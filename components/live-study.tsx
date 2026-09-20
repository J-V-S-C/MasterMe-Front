"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useSearchParams } from "next/navigation";
import { api, type KnowledgeNode, type Material, type StudySession } from "../lib/api";
import { stageCopy, type ExtractionProgress } from "../lib/extraction-progress";
import { useMaterialExtraction } from "../lib/use-material-extraction";
import { Icon } from "../lib/icons";
import { LoadingSkeleton } from "./loading-skeleton";
import { getActiveMaterialId, saveActiveMaterialId } from "../lib/active-material";

const message = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export function LiveStudy() {
  const searchParams = useSearchParams();
  const requestedMaterialId = searchParams.get("material");
  const requestedConceptId = searchParams.get("concept");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialId, setMaterialId] = useState("");
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [conceptId, setConceptId] = useState("");
  const [session, setSession] = useState<StudySession | null>(null);
  const [answer, setAnswer] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [usage, setUsage] = useState<{ extractions: number; validations: number; isomorphicProblems: number; fallbacks: number } | null>(null);
  const [isomorphicProblem, setIsomorphicProblem] = useState<{ id: string; content: string; hash: string } | null>(null);
  const [isGeneratingIsomorphic, setIsGeneratingIsomorphic] = useState(false);
  const [showIsomorphicPanel, setShowIsomorphicPanel] = useState(false);
  const autoStartedConcept = useRef<string | null>(null);

  const loadNodes = useCallback(async (id: string) => {
    setLoadingNodes(true);
    try {
      const data = await api.knowledgeMap(id);
      setNodes(data);
      setConceptId((current) => {
        const requestedNode = data.find((node) => node.concept.id === requestedConceptId);
        if (requestedNode) return requestedNode.concept.id;
        const currentNode = data.find((node) => node.concept.id === current);
        if (currentNode) return current;
        return data[0]?.concept.id ?? "";
      });
      setSession(null);
    } catch (cause: unknown) {
      setNodes([]);
      setConceptId("");
      setError(message(cause, "Não foi possível carregar os conceitos."));
    } finally { setLoadingNodes(false); }
  }, [requestedConceptId]);

  useEffect(() => {
    api.materials().then((data) => {
      setMaterials(data);
      setMaterialId(
        data.some((item) => item.id === requestedMaterialId)
          ? requestedMaterialId!
          : getActiveMaterialId(data.map((item) => item.id)) || data[0]?.id || "",
      );
    })
      .catch((cause: unknown) => setError(message(cause, "Não foi possível carregar os materiais.")))
      .finally(() => setLoading(false));
  }, [requestedMaterialId]);

  useEffect(() => { if (materialId) void loadNodes(materialId); }, [materialId]);
  useEffect(() => { void api.aiUsageToday().then(setUsage).catch(() => setUsage(null)); }, []);

  const material = materials.find((item) => item.id === materialId);
  const selected = nodes.find((node) => node.concept.id === conceptId);
  const words = useMemo(() => answer.trim() ? answer.trim().split(/\s+/).length : 0, [answer]);
  const hasConcepts = nodes.length > 0;
  const refreshSelectedMaterial = useCallback(() => loadNodes(materialId), [loadNodes, materialId]);
  const extraction = useMaterialExtraction(materialId, refreshSelectedMaterial);
  const extractionActive = extraction.progress.status === "PENDING" || extraction.progress.status === "PROCESSING";

  const extract = async () => {
    if (!materialId || extraction.enqueueing) return;
    setError("");
    try { await extraction.startExtraction(); }
    catch (cause: unknown) { setError(message(cause, "Não foi possível extrair o contexto.")); }
  };
  const createMaterial = async () => {
    if (!title.trim() || !content.trim()) return;
    setCreating(true); setError("");
    try {
      const material = await api.createMaterial(title.trim(), content.trim());
      setMaterials((current) => [material, ...current]);
      saveActiveMaterialId(material.id);
      setMaterialId(material.id); setTitle(""); setContent("");
      await api.extractConcepts(material.id);
    } catch (cause: unknown) { setError(message(cause, "Não foi possível criar o material.")); }
    finally { setCreating(false); }
  };

  const begin = async () => {
    if (!conceptId) return;
    setError("");
    try {
      const s = await api.startSession(conceptId);
      setSession(s);
      try { const problem = await api.getIsomorphicProblem(conceptId); setIsomorphicProblem(problem ?? null); }
      catch (_) { setIsomorphicProblem(null); }
    } catch (cause: unknown) { setError(message(cause, "Não foi possível iniciar a sessão.")); }
  };

  useEffect(() => {
    if (!requestedConceptId || requestedConceptId !== conceptId || !selected || loadingNodes || session || autoStartedConcept.current === requestedConceptId) return;
    autoStartedConcept.current = requestedConceptId;
    void begin();
  }, [conceptId, loadingNodes, requestedConceptId, selected, session]);

  const generateIsomorphic = async (conceptIdParam?: string) => {
    const id = conceptIdParam ?? conceptId;
    if (!id) return;
    setError("");
    if (isGeneratingIsomorphic) return;
    setIsGeneratingIsomorphic(true);
    try {
      const generated = await api.generateIsomorphicProblem(id);
      setIsomorphicProblem(generated);
      setShowIsomorphicPanel(true);
      void api.aiUsageToday().then(setUsage).catch(() => {});
    } catch (cause: unknown) {
      setError(message(cause, "Não foi possível gerar o problema isomórfico."));
    } finally { setIsGeneratingIsomorphic(false); }
  };

  const submit = async () => {
    if (!session) return;
    setError("");
    if (submitting) return;
    setSubmitting(true);
    try {
      const isStressReply = session.state === "AWAITING_STRESS_REPLY" || session.state === "RETRY_STRESS";
      const updated = isStressReply ? await api.stressReply(session.id, answer) : await api.answer(session.id, answer);
      setSession(updated);
      if (updated.state === 'VALIDATED') {
        setNodes((cur) => cur.map((n) => n.concept.id === updated.conceptId ? { ...n, status: 'VALIDATED' } : n));
        setAnswer("");
      } else if (updated.state === 'AWAITING_STRESS_REPLY') {
        setAnswer("");
      }
    } catch (cause: unknown) {
      setError(message(cause, "Não foi possível avaliar a resposta."));
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSkeleton />;
  if (error && !materials.length) return <section className="empty-state"><h1>Backend indisponível</h1><p>{error}</p></section>;
  if (!materials.length) return <section className="onboarding"><MaterialForm title={title} content={content} creating={creating} onTitleChange={setTitle} onContentChange={setContent} onSubmit={createMaterial} error={error} /></section>;

  return <>
    <section className="study-context">
      <div><span>DIALÉTICA SOCRÁTICA FEYNMAN</span><h1>{material?.title ?? 'Tratado em estudo'}</h1></div>
      {selected && <div className="context-node"><Icon name="idea" /><span>Nó atual: <b>{selected.concept.name}</b></span></div>}
    </section>
    <section className="live-toolbar">
      <label>Material<select value={materialId} disabled={creating} onChange={(event) => { const id = event.target.value; setError(""); saveActiveMaterialId(id); setMaterialId(id); }}>{materials.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      {usage && <div className="usage-inline"><strong>Uso de IA hoje</strong><span>{usage.extractions} extrações · {usage.validations} validações · {usage.isomorphicProblems} problemas gerados · {usage.fallbacks} alternativas locais</span></div>}
      {loadingNodes || extraction.checking ? <p className="toolbar-note">Verificando o contexto do material…</p> : hasConcepts ? <><label>Conceito<select value={conceptId} onChange={(event) => setConceptId(event.target.value)}>{nodes.map((node) => <option key={node.concept.id} value={node.concept.id}>{node.concept.name} — {node.status === "LOCKED" ? "Disponível" : node.status}</option>)}</select></label><button onClick={begin} disabled={!selected}>Iniciar sessão</button></> : extractionActive || extraction.progress.status === "FAILED" ? <p className="toolbar-note">Acompanhe a extração abaixo.</p> : <div className="extract-callout"><div><strong>Extraia o contexto deste material</strong><span>Depois, você poderá escolher um conceito para estudar.</span></div><button onClick={() => void extract()} disabled={extraction.enqueueing}>{extraction.enqueueing ? "Colocando na fila…" : "Extrair contexto"}</button></div>}
    </section>
    <details className="material-creator">
      <summary><span><Icon name="document" />Adicionar novo material</span><small>Texto, anotação ou referência <Icon name="chevron" /></small></summary>
      <MaterialForm title={title} content={content} creating={creating} onTitleChange={setTitle} onContentChange={setContent} onSubmit={createMaterial} error="" compact />
    </details>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!hasConcepts && (extractionActive || extraction.progress.status === "FAILED") ? <ExtractionProgressCard progress={extraction.progress} connectionLost={extraction.connectionLost} retrying={extraction.enqueueing} onRetry={extract} /> : <div className={`workspace-grid ${hasConcepts ? "concepts-ready" : ""}`}><section className="reading-pane"><div className="pane-title"><span><Icon name="book" />Material de referência</span></div><article className="reading-card"><h1>{material?.title}</h1><p className="source-content">{material?.content}</p>{selected && <div className="concept-highlight"><div><span><Icon name="idea" />Conceito em discussão</span><small>{selected.concept.kind}</small></div><h2>{selected.concept.name}</h2><p>{selected.concept.description}</p><footer>Pré-requisitos: {selected.concept.prerequisiteIds.length}</footer></div>}</article></section><section className="study-pane">{session ? <SessionView session={session} answer={answer} words={words} onAnswerChange={setAnswer} onSubmit={submit} selectedNode={selected} submitting={submitting} onRetry={() => void submit()} error={error} isomorphicProblem={isomorphicProblem} onGenerateIsomorphic={generateIsomorphic} isGeneratingIsomorphic={isGeneratingIsomorphic} showIsomorphicPanel={showIsomorphicPanel} setShowIsomorphicPanel={setShowIsomorphicPanel} /> : <section className="empty-state compact"><Icon name="brain" /><h1>{hasConcepts ? "Escolha um conceito" : "Contexto ainda não extraído"}</h1><p>{hasConcepts ? "Inicie uma sessão para receber uma pergunta gerada a partir do material." : "Use a ação acima para transformar o material em conceitos estudáveis."}</p></section>}</section></div>}
  </>;
}

function SessionView({ session, answer, words, onAnswerChange, onSubmit, selectedNode, submitting, onRetry, error, isomorphicProblem, onGenerateIsomorphic, isGeneratingIsomorphic, showIsomorphicPanel, setShowIsomorphicPanel }: { session: StudySession; answer: string; words: number; onAnswerChange: (value: string) => void; onSubmit: () => void; selectedNode: KnowledgeNode | undefined; submitting: boolean; onRetry: () => void; error: string; isomorphicProblem: { id: string; content: string; hash: string } | null; onGenerateIsomorphic: (conceptId?: string) => Promise<void>; isGeneratingIsomorphic: boolean; showIsomorphicPanel: boolean; setShowIsomorphicPanel: Dispatch<SetStateAction<boolean>> }) {
  const stress = session.state === "AWAITING_STRESS_REPLY" || session.state === "RETRY_STRESS";
  const latest = session.attempts.at(-1);
  const kind = selectedNode?.concept.kind ?? "N/A";
  const source = selectedNode?.concept.sourceExcerpt ?? null;
  return <>
    <section className="prompt-card">
      <div className="eyebrow"><span className="challenge">Desafio deste nó</span><small className="kind">{kind}</small><small className="target-premise">{session.question.targetPremise}</small></div>
      <h2>{stress ? session.stressTest?.question : session.question.text}</h2>
      {source && <blockquote className="evidence">{source}</blockquote>}
      <p className="tip"><Icon name="idea" /><span>{stress ? "Responda ao caso-limite usando o mecanismo do conceito." : "Explique o mecanismo com suas próprias palavras."} Respostas com menos de 20 caracteres não são aceitas.</span></p>
    </section>
    <section className="answer-card"><header><h2>Sua explicação</h2><p>{words} palavras</p></header><textarea value={answer} onChange={(event) => onAnswerChange(event.target.value)} rows={8} placeholder="Explique o seu raciocínio…" /><footer><span>O diagnóstico usa somente o material selecionado.</span><div className="answer-actions"><button className="primary" disabled={answer.trim().length < 20 || session.state === "VALIDATED" || submitting} onClick={onSubmit}><Icon name="sparkles" />Validar resposta · 1 uso de IA</button>{error && <button className="secondary" onClick={onRetry}>Tentar validar novamente</button>}</div></footer></section>
    {latest && <section className="diagnostic-card"><header><h2>Diagnóstico</h2><small>{latest.evaluation.status}</small></header><p>{latest.evaluation.feedback}</p>{session.stressTest && <div className="stress-question"><Icon name="warning" /><div><span>Teste de estresse</span><p>{session.stressTest.question}</p></div></div>}</section>}
    <div className="isomorphic-controls">
      {isomorphicProblem ? <button onClick={() => setShowIsomorphicPanel((s) => !s)} className="secondary">{showIsomorphicPanel ? 'Fechar problema salvo' : 'Abrir problema salvo'}</button> : <button className="secondary" disabled={isGeneratingIsomorphic} onClick={() => void onGenerateIsomorphic()}>{isGeneratingIsomorphic ? 'Gerando problema… · 1 uso de IA' : 'Gerar problema isomórfico · 1 uso de IA'}</button>}
      {showIsomorphicPanel && isomorphicProblem && <section className="isomorphic-panel"><h3>Problema isomórfico</h3><pre>{isomorphicProblem.content}</pre><small>Hash: {isomorphicProblem.hash}</small></section>}
    </div>
  </>;
}

function ExtractionProgressCard({ progress, connectionLost, retrying, onRetry }: { progress: ExtractionProgress; connectionLost: boolean; retrying: boolean; onRetry: () => Promise<void> }) {
  const failed = progress.status === "FAILED";
  const copy = stageCopy[progress.stage];
  const chunkDetails = progress.totalChunks > 0 ? `${progress.completedChunks} de ${progress.totalChunks} partes analisadas` : null;
  const errorLower = (progress.error ?? "").toLowerCase();
  const failureType = errorLower.includes('quota') || errorLower.includes('cota') ? 'quota' : errorLower.includes('model') || errorLower.includes('modelo') ? 'model' : errorLower.includes('invalid') || errorLower.includes('inválida') ? 'invalid' : 'processing';
  const failureMessage = failed ? (failureType === 'quota' ? 'Cota indisponível para extração no momento.' : failureType === 'model' ? 'Modelo indisponível no momento.' : failureType === 'invalid' ? 'Resposta inválida durante a extração.' : 'Falha no processamento local.') : null;
  return <section className={`extraction-progress ${failed ? "failed" : "active"}`} aria-live="polite"><div className="processing-symbol"><Icon name={failed ? "warning" : "brain"} /><i /></div><div className="progress-copy"><span className="eyebrow">Construção do mapa de conhecimento</span><h2>{failed ? "A extração não foi concluída" : copy.title}</h2><p>{failed ? failureMessage : copy.description}</p></div>{!failed && <><div className="progress-meta"><strong>{progress.progressPercent}%</strong><span>{chunkDetails ?? "Aguardando detalhes do processamento"}</span></div><div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.progressPercent}><i style={{ width: `${progress.progressPercent}%` }} /></div>{connectionLost && <p className="connection-note">Conexão em tempo real instável. Continuamos consultando o progresso.</p>}</>}{failed && <button className="primary" onClick={() => void onRetry()} disabled={retrying}>{retrying ? "Colocando na fila…" : "Tentar extrair novamente"}</button>}</section>;
}

function MaterialForm({ title, content, creating, onTitleChange, onContentChange, onSubmit, error, compact = false }: { title: string; content: string; creating: boolean; error: string; compact?: boolean; onTitleChange: (value: string) => void; onContentChange: (value: string) => void; onSubmit: () => void }) {
  return <section className={`material-form ${compact ? "compact-form" : ""}`}><div><span className="eyebrow">Base do estudo</span><h1>{compact ? "Adicionar material" : "Comece com um material"}</h1><p>{compact ? "O contexto será extraído automaticamente depois de salvar." : "Cole um texto técnico para criar sua base de estudo. Vamos extrair o contexto automaticamente depois de salvar."}</p></div><label className="title-field">Título<input value={title} maxLength={160} onChange={(event) => onTitleChange(event.target.value)} placeholder="Dê um título ao material" /></label><label>Conteúdo<textarea value={content} onChange={(event) => onContentChange(event.target.value)} placeholder="Cole ou escreva o conteúdo que deseja estudar" rows={8} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary" onClick={onSubmit} disabled={creating || !title.trim() || !content.trim()}>{creating ? "Salvando e enfileirando…" : "Criar e extrair contexto"}</button></section>;
}
