"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, uploadMaterial, type AiUsageSummary, type KnowledgeNode, type Material, type StudySession } from "../lib/api";
import { stageCopy, type ExtractionProgress } from "../lib/extraction-progress";
import { useMaterialExtraction } from "../lib/use-material-extraction";
import { Icon } from "../lib/icons";
import { LoadingSkeleton } from "./loading-skeleton";
import { StyledSelect } from "./styled-select";
import { ActionButton } from "./action-button";
import { getActiveMaterialId, saveActiveMaterialId } from "../lib/active-material";
import { studyState, usageCounts } from "../lib/study-state";

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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [usage, setUsage] = useState<AiUsageSummary | null>(null);
  const restoredSelection = useRef<string | null>(null);
  const activeSelection = useRef("");
  const nodeLoadRequest = useRef(0);
  const currentMaterial = useRef(materialId);
  activeSelection.current = `${materialId}:${conceptId}`;
  currentMaterial.current = materialId;

  const loadNodes = useCallback(async (id: string) => {
    const requestId = ++nodeLoadRequest.current;
    setLoadingNodes(true);
    try {
      const data = await api.knowledgeMap(id);
      if (requestId !== nodeLoadRequest.current || id !== currentMaterial.current) return;
      setNodes(data);
      setConceptId((current) => {
        const requestedNode = data.find((node) => node.concept.id === requestedConceptId);
        if (requestedNode) return requestedNode.concept.id;
        const currentNode = data.find((node) => node.concept.id === current);
        if (currentNode) return current;
        return data[0]?.concept.id ?? "";
      });
    } catch (cause: unknown) {
      if (requestId !== nodeLoadRequest.current || id !== currentMaterial.current) return;
      setNodes([]);
      setConceptId("");
      setError(message(cause, "Não foi possível carregar os conceitos."));
    } finally { if (requestId === nodeLoadRequest.current) setLoadingNodes(false); }
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

  useEffect(() => {
    if (!materialId) return;
    restoredSelection.current = null;
    setSession(null);
    setAnswer("");
    setNodes([]);
    setConceptId("");
    void loadNodes(materialId);
  }, [materialId, loadNodes]);
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

  const uploadFile = async (file: File, fileTitle: string) => {
    setCreating(true); setError(""); setUploadProgress(0);
    try {
      const uploaded = await uploadMaterial(file, fileTitle, setUploadProgress);
      const all = await api.materials();
      setMaterials(all);
      saveActiveMaterialId(uploaded.id);
      setMaterialId(uploaded.id);
      setTitle(""); setContent("");
    } catch (cause: unknown) { setError(message(cause, "Não foi possível importar o material.")); }
    finally { setCreating(false); setUploadProgress(null); }
  };

  const begin = async () => {
    if (!conceptId) return;
    setError("");
    try {
      const s = await api.startSession(conceptId);
      studyState.saveSession(materialId, conceptId, s.id);
      if (activeSelection.current === `${materialId}:${conceptId}`) {
        setSession(s);
        setAnswer("");
      }
    } catch (cause: unknown) { setError(message(cause, "Não foi possível iniciar a sessão.")); }
  };

  useEffect(() => {
    if (!selected || selected.concept.materialId !== materialId || loadingNodes) return;
    const key = `${materialId}:${conceptId}`;
    if (restoredSelection.current === key) return;
    restoredSelection.current = key;
    setSession(null);
    setAnswer("");
    const saved = studyState.sessionId(materialId, conceptId);
    if (saved) {
      void api.getSession(saved).then((restored) => {
        if (restored.conceptId !== conceptId) throw new Error('Sessão pertence a outro conceito.');
        if (activeSelection.current === key) {
          setSession(restored);
          setAnswer(studyState.draft(restored.id));
        }
      }).catch(() => {
        studyState.forgetSession(materialId, conceptId);
        if (activeSelection.current === key) setError('Não foi possível retomar a sessão. Inicie uma nova.');
      });
    } else if (requestedMaterialId === materialId && requestedConceptId === conceptId) {
      void begin();
    }
  }, [materialId, conceptId, selected, loadingNodes, requestedMaterialId, requestedConceptId]);

  const submit = async () => {
    if (!session) return;
    setError("");
    if (submitting) return;
    setSubmitting(true);
    try {
      const edgeCaseAnswer = session.state === "EXPLANATION_PASSED" && (session.edgeCaseStatus === "READY" || session.edgeCaseStatus === "REVIEW");
      const updated = edgeCaseAnswer ? await api.answerEdgeCase(session.id, answer) : await api.answer(session.id, answer);
      if (activeSelection.current !== `${materialId}:${session.conceptId}`) return;
      setSession(updated);
      void api.aiUsageToday().then(setUsage).catch(() => {});
      if (updated.state === 'EXPLANATION_PASSED') {
        setNodes((current) => current.map((node) => node.concept.id === updated.conceptId ? { ...node, status: 'EXPLAINED', edgeCaseStatus: updated.edgeCaseStatus } : node));
        setAnswer("");
        studyState.clearDraft(updated.id);
      }
    } catch (cause: unknown) {
      setError(message(cause, "Não foi possível avaliar a resposta."));
    } finally { setSubmitting(false); }
  };

  const changeConcept = (id: string) => {
    restoredSelection.current = null;
    setConceptId(id);
    setSession(null);
    setAnswer("");
    setError("");
  };
  const changeAnswer = (value: string) => {
    setAnswer(value);
    if (session) studyState.saveDraft(session.id, value);
  };

  if (loading) return <LoadingSkeleton />;
  if (error && !materials.length) return <section className="empty-state"><h1>Backend indisponível</h1><p>{error}</p></section>;
  if (!materials.length) return <section className="onboarding"><div className="onboarding-shell"><header className="onboarding-intro"><div className="onboarding-symbol"><Icon name="book" /></div><span className="eyebrow">Seu espaço está pronto</span><h1>Adicione o primeiro material</h1><p>O MasterMe transforma o conteúdo em um mapa de conceitos e prepara sessões de estudo ativo.</p><ol><li><strong>1</strong><span><b>Adicione</b><small>Cole um texto ou envie um arquivo.</small></span></li><li><strong>2</strong><span><b>Extraia</b><small>A IA organiza os conceitos centrais.</small></span></li><li><strong>3</strong><span><b>Explique</b><small>Responda e receba um diagnóstico.</small></span></li></ol></header><MaterialForm title={title} content={content} creating={creating} uploadProgress={uploadProgress} onTitleChange={setTitle} onContentChange={setContent} onSubmit={createMaterial} onUpload={uploadFile} error={error} /></div></section>;

  return <>
    <section className="study-context">
      <div><span>ESTUDO ATIVO</span><h1>{material?.title ?? 'Tratado em estudo'}</h1></div>
      {selected && <div className="context-node"><Icon name="idea" /><span>Nó atual: <b>{selected.concept.name}</b></span></div>}
    </section>
    <section className="live-toolbar">
      <StyledSelect label="Material" icon="document" value={materialId} disabled={creating} options={materials.map((item) => ({ value: item.id, label: item.title }))} onValueChange={(id) => { setError(""); saveActiveMaterialId(id); setMaterialId(id); }} />
      {usage && <div className="usage-inline" title={`A quota renova em ${new Date(usage.resetsAt).toLocaleString('pt-BR')}`}><strong>{usage.remainingRequests} de {usage.dailyLimit} chamadas de IA disponíveis hoje</strong><span>{usageCounts(usage).extractions} extrações · {usageCounts(usage).validations} avaliações · {usageCounts(usage).edgeCases} casos-limite · {usageCounts(usage).practiceProjects} projetos · {usage.totalInputTokens + usage.totalOutputTokens} tokens</span><progress aria-label="Quota diária de IA restante" value={usage.remainingRequests} max={usage.dailyLimit} /></div>}
      {loadingNodes || extraction.checking ? <p className="toolbar-note">Verificando o contexto do material…</p> : hasConcepts ? <><StyledSelect label="Conceito" icon="idea" value={conceptId} options={nodes.map((node) => ({ value: node.concept.id, label: node.concept.name + " — " + node.status }))} onValueChange={changeConcept} /><ActionButton variant="primary" onClick={begin} disabled={!selected}>Nova sessão</ActionButton></> : extractionActive || extraction.progress.status === "FAILED" ? <p className="toolbar-note">Acompanhe a extração abaixo.</p> : <div className="extract-callout"><div><strong>Extraia o contexto deste material</strong><span>Depois, você poderá escolher um conceito para estudar.</span></div><ActionButton variant="primary" onClick={() => void extract()} disabled={extraction.enqueueing}>{extraction.enqueueing ? "Colocando na fila…" : "Extrair contexto"}</ActionButton></div>}
    </section>
    <details className="material-creator">
      <summary><span><Icon name="document" />Adicionar novo material</span><small>Texto, PDF, Markdown ou TXT <Icon name="chevron" /></small></summary>
      <MaterialForm title={title} content={content} creating={creating} uploadProgress={uploadProgress} onTitleChange={setTitle} onContentChange={setContent} onSubmit={createMaterial} onUpload={uploadFile} error="" compact />
    </details>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!hasConcepts && (extractionActive || extraction.progress.status === "FAILED") ? <ExtractionProgressCard progress={extraction.progress} connectionLost={extraction.connectionLost} retrying={extraction.enqueueing} cancelling={extraction.cancelling} onRetry={extract} onCancel={extraction.cancelExtraction} /> : <div className={`workspace-grid ${hasConcepts ? "concepts-ready" : ""}`}><section className="reading-pane"><div className="pane-title"><span><Icon name="book" />Material de referência</span></div><article className="reading-card"><h1>{material?.title}</h1><p className="source-content">{material?.content}</p>{selected && <div className="concept-highlight"><div><span><Icon name="idea" />Conceito em discussão</span><small>{selected.concept.kind}</small></div><h2>{selected.concept.name}</h2><p>{selected.concept.description}</p><footer>Pré-requisitos: {selected.concept.prerequisiteIds.length}</footer></div>}</article></section><section className="study-pane">{session?.conceptId === conceptId ? <SessionView session={session} answer={answer} words={words} onAnswerChange={changeAnswer} onSubmit={submit} selectedNode={selected} submitting={submitting} onRetry={() => void submit()} error={error} onRequestEdgeCase={async () => { if (!session) return; setSubmitting(true); setError(""); try { const updated = await api.requestEdgeCase(session.id); setSession(updated); setNodes((current) => current.map((node) => node.concept.id === updated.conceptId ? { ...node, edgeCaseStatus: updated.edgeCaseStatus } : node)); } catch (cause: unknown) { setError(message(cause, "Não foi possível criar o caso-limite.")); } finally { setSubmitting(false); } }} /> : <section className="empty-state compact"><Icon name="brain" /><h1>{hasConcepts ? "Escolha um conceito" : "Contexto ainda não extraído"}</h1><p>{hasConcepts ? "Inicie uma sessão para receber uma pergunta gerada a partir do material." : "Use a ação acima para transformar o material em conceitos estudáveis."}</p></section>}</section></div>}
  </>;
}

export function SessionView({ session, answer, words, onAnswerChange, onSubmit, selectedNode, submitting, onRetry, error, onRequestEdgeCase }: { session: StudySession; answer: string; words: number; onAnswerChange: (value: string) => void; onSubmit: () => void; selectedNode: KnowledgeNode | undefined; submitting: boolean; onRetry: () => void; error: string; onRequestEdgeCase: () => Promise<void> }) {
  const edgeActive = session.state === "EXPLANATION_PASSED" && (session.edgeCaseStatus === "READY" || session.edgeCaseStatus === "REVIEW");
  const latest = session.attempts.at(-1);
  const kind = selectedNode?.concept.kind ?? "N/A";
  const source = selectedNode?.concept.sourceExcerpt ?? null;
  const completed = session.state === "EXPLANATION_PASSED";
  return <>
    <section className="prompt-card">
      <div className="eyebrow"><span className="challenge">{edgeActive ? "Teste de caso-limite" : "Desafio deste nó"}</span><small className="kind">{kind}</small>{!edgeActive && <small className="target-premise">{session.question.targetPremise}</small>}</div>
      <h2>{edgeActive ? session.edgeCaseChallenge?.question : session.question.text}</h2>
      {edgeActive && session.edgeCaseChallenge && <p className="edge-scenario">{session.edgeCaseChallenge.scenario}</p>}
      {source && <blockquote className="evidence">{source}</blockquote>}
      <p className="tip"><Icon name="idea" /><span>{edgeActive ? "Teste voluntariamente os limites da sua explicação." : "Explique o mecanismo com suas próprias palavras."} Respostas com menos de 20 caracteres não são aceitas.</span></p>
    </section>
    {!completed || edgeActive ? <section className="answer-card"><header><h2>{edgeActive ? "Sua resposta ao caso" : "Sua explicação"}</h2><p>{words} palavras</p></header><textarea aria-label={edgeActive ? "Sua resposta ao caso-limite" : "Sua explicação"} value={answer} onChange={(event) => onAnswerChange(event.target.value)} rows={8} placeholder="Explique o seu raciocínio…" /><footer><span>O diagnóstico usa somente o material selecionado.</span><div className="answer-actions"><ActionButton variant="primary" disabled={answer.trim().length < 20 || submitting} onClick={onSubmit}><Icon name="sparkles" />{submitting ? "Avaliando…" : "Validar resposta · 1 uso de IA"}</ActionButton>{error && <ActionButton variant="secondary" onClick={onRetry}>Tentar validar novamente</ActionButton>}</div></footer></section> : <section className="completion-card"><Icon name="sparkles" /><div><span>Explicação concluída</span><h2>Você explicou este conceito com consistência.</h2><p>O caso-limite é opcional e não altera esta aprovação.</p></div>{session.edgeCaseStatus === "NOT_REQUESTED" && <ActionButton variant="secondary" disabled={submitting} onClick={() => void onRequestEdgeCase()}>{submitting ? "Preparando…" : "Testar em um caso-limite"}</ActionButton>}{session.edgeCaseStatus === "PASSED" && <strong>Caso-limite aprovado</strong>}</section>}
    {latest && <section className="diagnostic-card"><header><h2>Diagnóstico</h2><small>{latest.evaluation.status}</small></header><p>{latest.evaluation.feedback}</p>{session.edgeCaseStatus !== "NOT_REQUESTED" && <div className="edge-case-status"><Icon name="warning" /><div><span>Teste de caso-limite · {session.edgeCaseStatus}</span><p>{session.edgeCaseChallenge?.question}</p></div></div>}</section>}
  </>;
}

function ExtractionProgressCard({ progress, connectionLost, retrying, cancelling, onRetry, onCancel }: { progress: ExtractionProgress; connectionLost: boolean; retrying: boolean; cancelling: boolean; onRetry: () => Promise<void>; onCancel: () => Promise<void> }) {
  const failed = progress.status === "FAILED";
  const copy = stageCopy[progress.stage];
  const failureMessage = progress.error?.trim() || "Não foi possível extrair os conceitos deste material.";
  const stages = [
    { key: 'PREPARING', label: 'Preparação' }, { key: 'EXTRACTING', label: 'Análise com IA' }, { key: 'REDUCING', label: 'Organização' },
  ] as const;
  const currentStage = Math.max(0, stages.findIndex(({ key }) => key === progress.stage));
  return <section className={`extraction-progress ${failed ? "failed" : "active"}`} aria-live="polite"><div className="processing-symbol"><Icon name={failed ? "warning" : "brain"} /><i /></div><div className="progress-copy"><span className="eyebrow">Construção do mapa de conhecimento</span><h2>{failed ? "A extração não foi concluída" : copy.title}</h2><p>{failed ? failureMessage : copy.description}</p></div>{!failed && <><ol className="extraction-stages" aria-label="Etapas da extração">{stages.map((stage, index) => <li key={stage.key} className={index < currentStage ? 'done' : index === currentStage ? 'current' : ''}><i aria-hidden="true" /><span>{stage.label}</span></li>)}</ol><div className="progress-track indeterminate" role="progressbar" aria-label={`${copy.title}. Processamento em andamento`}><i /></div><p className="progress-note">Você pode continuar usando outras áreas enquanto processamos o material.</p>{connectionLost && <p className="connection-note">Conexão em tempo real instável. Continuamos consultando o progresso.</p>}<ActionButton variant="secondary" onClick={() => void onCancel()} disabled={cancelling}>{cancelling ? "Cancelando…" : "Cancelar processamento"}</ActionButton></>}{failed && <ActionButton variant="primary" onClick={() => void onRetry()} disabled={retrying}>{retrying ? "Colocando na fila…" : "Tentar extrair novamente"}</ActionButton>}</section>;
}

export function MaterialForm({ title, content, creating, uploadProgress, onTitleChange, onContentChange, onSubmit, onUpload, error, compact = false }: { title: string; content: string; creating: boolean; uploadProgress: number | null; error: string; compact?: boolean; onTitleChange: (value: string) => void; onContentChange: (value: string) => void; onSubmit: () => void; onUpload: (file: File, title: string) => Promise<void> }) {
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [file, setFile] = useState<File | null>(null);
  return <section className={`material-form ${compact ? "compact-form" : ""}`}>
    <div><span className="eyebrow">Base do estudo</span><h1>{compact ? "Adicionar material" : "Comece com um material"}</h1><p>Cole texto ou envie um PDF, Markdown ou TXT. A extração começa após salvar.</p></div>
    <div className="material-mode" role="group" aria-label="Forma de adicionar material"><button type="button" className={mode === 'text' ? 'selected' : ''} onClick={() => setMode('text')}>Colar texto</button><button type="button" className={mode === 'file' ? 'selected' : ''} onClick={() => setMode('file')}>Enviar arquivo</button></div>
    <label className="title-field">Título{mode === 'file' && <small>Opcional; o nome do arquivo será usado se ficar vazio.</small>}<input value={title} maxLength={160} onChange={(event) => onTitleChange(event.target.value)} placeholder="Dê um título ao material" /></label>
    {mode === 'text' ? <label>Conteúdo<textarea value={content} onChange={(event) => onContentChange(event.target.value)} placeholder="Cole ou escreva o conteúdo que deseja estudar" rows={8} /></label> : <label>Arquivo<input type="file" accept=".pdf,.md,.markdown,.txt,application/pdf,text/markdown,text/plain" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><small>PDF com texto selecionável, Markdown ou TXT · até 15 MiB</small></label>}
    {uploadProgress !== null && <div className="upload-progress" role="status">{uploadProgress < 100 ? `Enviando arquivo: ${uploadProgress}%` : 'Arquivo enviado. Preparando processamento…'}<progress value={uploadProgress} max={100} /></div>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <ActionButton variant="primary" onClick={() => mode === 'file' ? file && void onUpload(file, title) : onSubmit()} disabled={creating || (mode === 'text' ? !title.trim() || !content.trim() : !file)}>{creating ? "Salvando e enfileirando…" : mode === 'file' ? 'Enviar e extrair arquivo' : 'Criar e extrair contexto'}</ActionButton>
  </section>;
}
