"use client";

import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from 'next/link';
import { ApiError, api, uploadMaterial, type EditorialUnit, type KnowledgeNode, type Material, type MaterialSummary, type StudySession } from "../lib/api";
import { type ExtractionProgress } from "../lib/extraction-progress";
import { useMaterialExtraction } from "../lib/use-material-extraction";
import { Icon } from "../lib/icons";
import { LoadingSkeleton } from "./loading-skeleton";
import { StyledSelect } from "./styled-select";
import { ActionButton } from "./action-button";
import { PdfBookViewer } from "./pdf-book-viewer";
import { getActiveMaterialId, saveActiveMaterialId } from "../lib/active-material";
import { studyState } from "../lib/study-state";
import { useI18n } from "../lib/i18n";
import { useRealtimeRefresh } from "./realtime-provider";
import { useBilling } from "./billing-provider";
import { knowledgeStatusKey } from "../lib/knowledge-status";

const message = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;
const extractionStageKeys = {
  QUEUED: ['extractionQueuedTitle', 'extractionQueuedDescription'],
  RETRYING: ['extractionRetryingTitle', 'extractionRetryingDescription'],
  PREPARING: ['extractionPreparingTitle', 'extractionPreparingDescription'],
  EXTRACTING: ['extractionExtractingTitle', 'extractionExtractingDescription'],
  REDUCING: ['extractionReducingTitle', 'extractionReducingDescription'],
  READY: ['extractionReadyTitle', 'extractionReadyDescription'],
} as const;

class SourceViewerBoundary extends Component<{ children: ReactNode; fallback: string }, { failed: boolean; message: string }> {
  state = { failed: false, message: '' };
  static getDerivedStateFromError(error: Error) { return { failed: true, message: error.message }; }
  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV === 'development') console.error('Source viewer failed', { name: error.name, message: error.message, stack: error.stack });
  }
  render() { return this.state.failed ? <p className="form-error" role="alert">{this.props.fallback}{process.env.NODE_ENV === 'development' && this.state.message && <small> {this.state.message}</small>}</p> : this.props.children; }
}

export function LiveStudy() {
  const { locale, t } = useI18n();
  const translateRef = useRef(t);
  translateRef.current = t;
  const { balance, loading: balanceLoading, unavailable: balanceUnavailable, refresh: refreshBilling } = useBilling();
  const searchParams = useSearchParams();
  const requestedMaterialId = searchParams.get("material");
  const requestedConceptId = searchParams.get("concept");
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [materialId, setMaterialId] = useState("");
  const [material, setMaterial] = useState<Material | null>(null);
  const [outline, setOutline] = useState<EditorialUnit[]>([]);
  const [materialUnavailable, setMaterialUnavailable] = useState(false);
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [conceptId, setConceptId] = useState("");
  const [session, setSession] = useState<StudySession | null>(null);
  const [history, setHistory] = useState<StudySession[]>([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const [answer, setAnswer] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localizing, setLocalizing] = useState(false);
  const restoredSelection = useRef<string | null>(null);
  const activeSelection = useRef("");
  const nodeLoadRequest = useRef(0);
  const currentMaterial = useRef(materialId);
  const pendingFeedback = useRef<string | null>(null);
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
        return (data.find((node) => node.status === 'REVIEW') ?? data.find((node) => node.status === 'READY') ?? data[0])?.concept.id ?? "";
      });
    } catch (cause: unknown) {
      if (requestId !== nodeLoadRequest.current || id !== currentMaterial.current) return;
      setNodes([]);
      setConceptId("");
      setError(message(cause, translateRef.current('studyConceptsLoadError')));
    } finally { if (requestId === nodeLoadRequest.current) setLoadingNodes(false); }
  }, [requestedConceptId]);

  useEffect(() => {
    api.materials().then((data) => {
      setMaterials(data);
      setMaterialId(
        requestedMaterialId
          ? (data.some((item) => item.id === requestedMaterialId) ? requestedMaterialId : '')
          : getActiveMaterialId(data.map((item) => item.id)) || data[0]?.id || "",
      );
    })
      .catch((cause: unknown) => setError(message(cause, translateRef.current('studyMaterialsLoadError'))))
      .finally(() => setLoading(false));
  }, [requestedMaterialId]);

  useEffect(() => {
    if (!materialId) return;
    let active = true;
    pendingFeedback.current = null;
    restoredSelection.current = null;
    setSession(null);
    setHistory([]);
    setMaterial(null);
    setOutline([]);
    setAnswer("");
    setNodes([]);
    setConceptId("");
    setMaterialUnavailable(false);
    void api.material(materialId).then((detail) => { if (active) setMaterial(detail); }).catch((cause: unknown) => {
      if (!active) return;
      if (cause instanceof ApiError && cause.status === 404) setMaterialUnavailable(true);
      else setError(message(cause, translateRef.current('studyMaterialLoadError')));
    });
    void api.outline(materialId).then((units) => { if (active) setOutline(units); }).catch(() => {});
    void loadNodes(materialId);
    return () => { active = false; };
  }, [materialId, loadNodes]);

  const selected = nodes.find((node) => node.concept.id === conceptId);
  const words = useMemo(() => answer.trim() ? answer.trim().split(/\s+/).length : 0, [answer]);
  const hasConcepts = nodes.length > 0;
  const refreshSelectedMaterial = useCallback(() => loadNodes(materialId), [loadNodes, materialId]);
  const extraction = useMaterialExtraction(materialId, refreshSelectedMaterial);
  const extractionActive = extraction.progress.status === "PENDING" || extraction.progress.status === "PROCESSING";

  const extract = async () => {
    if (!materialId || extraction.enqueueing) return;
    setError("");
    try { await extraction.startExtraction(); void refreshBilling(); }
    catch (cause: unknown) { setError(message(cause, t('studyExtractError'))); }
  };
  const createMaterial = async () => {
    if (!title.trim() || !content.trim()) return;
    setCreating(true); setError("");
    try {
      const material = await api.createMaterial(title.trim(), content.trim(), locale);
      setMaterials((current) => [{ id: material.id, title: material.title, locale: material.locale, createdAt: material.createdAt }, ...current]);
      saveActiveMaterialId(material.id);
      setMaterialId(material.id); setTitle(""); setContent("");
      await api.extractConcepts(material.id);
      void refreshBilling();
    } catch (cause: unknown) { setError(message(cause, t('studyCreateError'))); }
    finally { setCreating(false); }
  };

  const uploadFile = async (file: File, fileTitle: string) => {
    setCreating(true); setError(""); setUploadProgress(0);
    try {
      const uploaded = await uploadMaterial(file, fileTitle, locale, setUploadProgress);
      const all = await api.materials();
      setMaterials(all);
      saveActiveMaterialId(uploaded.id);
      setMaterialId(uploaded.id);
      setTitle(""); setContent("");
    } catch (cause: unknown) { setError(message(cause, t('studyUploadError'))); }
    finally { setCreating(false); setUploadProgress(null); }
  };

  const begin = async () => {
    if (!conceptId) return;
    pendingFeedback.current = null;
    setLoadingSession(true);
    setError("");
    try {
      const s = await api.startSession(conceptId);
      void refreshBilling();
      studyState.saveSession(materialId, conceptId, s.id);
      if (activeSelection.current === `${materialId}:${conceptId}`) {
        setSession(s);
        setHistory((current) => [s, ...current]);
        setAnswer("");
      }
    } catch (cause: unknown) { setError(message(cause, t('studyBeginError'))); }
    finally { setLoadingSession(false); }
  };

  const repeat = () => {
    const approved = history.some((item) => item.state === 'EXPLANATION_PASSED');
    if (approved && !window.confirm(t('repeatConfirm'))) return;
    void begin();
  };

  useEffect(() => {
    if (!selected || selected.concept.materialId !== materialId || loadingNodes) return;
    const key = `${materialId}:${conceptId}`;
    if (restoredSelection.current === key) return;
    restoredSelection.current = key;
    setSession(null);
    setHistory([]);
    setAnswer("");
    setLoadingSession(true);
    void api.conceptSessions(conceptId).then(async (savedSessions) => {
      if (activeSelection.current !== key) return;
      setHistory(savedSessions);
      const restored = savedSessions[0];
      if (restored) {
        if (!restored.attempts.length && selected.question.text !== restored.question.text) {
          await begin();
          return;
        }
        studyState.saveSession(materialId, conceptId, restored.id);
        setSession(restored);
        setAnswer(studyState.draft(restored.id));
      } else await begin();
    }).catch((cause: unknown) => {
      if (activeSelection.current === key) setError(message(cause, translateRef.current('studyResumeError')));
    }).finally(() => { if (activeSelection.current === key) setLoadingSession(false); });
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
      if (updated.attempts.length > session.attempts.length) pendingFeedback.current = updated.id;
      setSession(updated);
      setHistory((current) => current.map((item) => item.id === updated.id ? updated : item));
      void refreshBilling();
      if (updated.state === 'EXPLANATION_PASSED') {
        setNodes((current) => current.map((node) => node.concept.id === updated.conceptId ? { ...node, status: 'EXPLAINED', edgeCaseStatus: updated.edgeCaseStatus } : node));
        setAnswer("");
        studyState.clearDraft(updated.id);
      }
    } catch (cause: unknown) {
      setError(message(cause, t('studyEvaluateError')));
    } finally { setSubmitting(false); }
  };

  useEffect(() => {
    if (!session || pendingFeedback.current !== session.id) return;
    const feedback = document.getElementById('study-diagnostic');
    if (!feedback) return;
    pendingFeedback.current = null;
    feedback.focus({ preventScroll: true });
    feedback.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }, [session]);

  const changeConcept = (id: string) => {
    pendingFeedback.current = null;
    restoredSelection.current = null;
    setConceptId(id);
    setSession(null);
    setHistory([]);
    setAnswer("");
    setError("");
  };
  const changeAnswer = (value: string) => {
    setAnswer(value);
    if (session) studyState.saveDraft(session.id, value);
  };

  const localize = async () => {
    if (!materialId || localizing) return;
    setLocalizing(true); setError("");
    try {
      await api.localizeMaterial(materialId, locale);
      setMaterials((current) => current.map((item) => item.id === materialId ? { ...item, locale } : item));
      await loadNodes(materialId);
      void refreshBilling();
    } catch (cause: unknown) {
      setError(message(cause, t('studyLocalizeError')));
    } finally { setLocalizing(false); }
  };

  useRealtimeRefresh((_change) => {
    void api.materials().then(setMaterials).catch(() => {})
    if (materialId) {
      void api.material(materialId).then(setMaterial).catch(() => {})
      void loadNodes(materialId)
    }
    void refreshBilling()
  });

  if (loading) return <LoadingSkeleton />;
  if (error && !materials.length) return <section className="empty-state"><h1>{t('studyBackendUnavailable')}</h1><p>{error}</p></section>;
  if (materialUnavailable || (requestedMaterialId && !materials.some(({ id }) => id === requestedMaterialId))) return <section className="empty-state" role="alert"><h1>{locale === 'pt-BR' ? 'Referência indisponível' : 'Reference unavailable'}</h1><p>{locale === 'pt-BR' ? 'O material desta tarefa não está mais disponível. Escolha outra fonte na biblioteca.' : 'The material for this task is no longer available. Choose another source in the library.'}</p><Link href="/library">{locale === 'pt-BR' ? 'Abrir biblioteca' : 'Open library'}</Link></section>;
  if (!materials.length) return <section className="onboarding"><div className="onboarding-shell"><header className="onboarding-intro"><span className="eyebrow">{t('workspaceReady')}</span><h1>{t('addFirstMaterial')}</h1><p>{t('onboardingDescription')}</p><div className="onboarding-outcome"><span className="onboarding-outcome-rule" aria-hidden="true" /><span>{t('extractStepDescription')} {t('explainStepDescription')}</span></div></header><MaterialForm title={title} content={content} creating={creating} uploadProgress={uploadProgress} onTitleChange={setTitle} onContentChange={setContent} onSubmit={createMaterial} onUpload={uploadFile} error={error} /></div></section>;

  const remainingCredits = balance ? balance.planId === 'FREE' ? balance.dailyRemaining : Math.min(balance.dailyRemaining, balance.periodRemaining) : null;

  return <>
    <h1 className="sr-only">{t('navStudy')}</h1>
    <section className="live-toolbar">
      <div className="study-controls">
        <StyledSelect label={t('material')} icon="document" value={materialId} disabled={creating} options={materials.map((item) => ({ value: item.id, label: item.title }))} onValueChange={(id) => { setError(""); saveActiveMaterialId(id); setMaterialId(id); }} />
        {loadingNodes || extraction.checking ? <p className="toolbar-note">{t('checkingMaterial')}</p> : hasConcepts ? <><StyledSelect label={t('concept')} icon="idea" value={conceptId} options={nodes.map((node) => ({ value: node.concept.id, label: `${node.concept.name} — ${t(knowledgeStatusKey(node.status))}` }))} onValueChange={changeConcept} />{session?.conceptId === conceptId && <ActionButton variant="secondary" onClick={repeat} disabled={!selected || loadingSession}>{t('repeatConcept')}</ActionButton>}</> : extractionActive || extraction.progress.status === "FAILED" ? <p className="toolbar-note">{t('extractionFollow')}</p> : <div className="extract-callout"><div><strong>{t('extractionCalloutTitle')}</strong><span>{t('extractionCalloutDescription')}</span></div><ActionButton variant="primary" onClick={() => void extract()} disabled={extraction.enqueueing}>{extraction.enqueueing ? t('extractingQueue') : t('extractContext')}</ActionButton></div>}
      </div>
      <p className="study-credit-count" role="status" title={balanceUnavailable ? t('creditUnavailable') : undefined}>{remainingCredits !== null ? `${new Intl.NumberFormat(locale).format(remainingCredits)} ${t('credits')} ${t('creditRemaining')}` : balanceLoading ? `${t('creditBalance')}: …` : t('creditUnavailable')}</p>
    </section>
    {error && <p className="form-error" role="alert">{error}</p>}
    {selected && selected.concept.generatedLocale !== locale && <section className="localize-callout"><Icon name="warning" /><div><strong>{t('localizeTitle')}</strong><span>{t('localizeDescription')}</span></div><ActionButton variant="secondary" disabled={localizing} onClick={() => void localize()}>{localizing ? t('localizing') : t('localizeAction')}</ActionButton></section>}
    <details className="material-creator">
      <summary><span><Icon name="document" />{t('addMaterial')}</span><small>Texto, PDF, Markdown ou TXT <Icon name="chevron" /></small></summary>
      <MaterialForm title={title} content={content} creating={creating} uploadProgress={uploadProgress} onTitleChange={setTitle} onContentChange={setContent} onSubmit={createMaterial} onUpload={uploadFile} error="" compact />
    </details>
    <div className="study-work-layout">
      {!hasConcepts && (extractionActive || extraction.progress.status === "FAILED") ? <ExtractionProgressCard progress={extraction.progress} connectionLost={extraction.connectionLost} retrying={extraction.enqueueing} cancelling={extraction.cancelling} onRetry={extract} onCancel={extraction.cancelExtraction} /> : <div className={`workspace-grid study-only ${hasConcepts ? "concepts-ready" : ""}`}><section className="study-pane">{session?.conceptId === conceptId ? <SessionView session={session} history={history} material={material} outline={outline} answer={answer} words={words} onAnswerChange={changeAnswer} onSubmit={submit} selectedNode={selected} submitting={submitting} onRetry={() => void submit()} error={error} onRequestEdgeCase={async () => { if (!session) return; setSubmitting(true); setError(""); try { const updated = await api.requestEdgeCase(session.id); setSession(updated); setNodes((current) => current.map((node) => node.concept.id === updated.conceptId ? { ...node, edgeCaseStatus: updated.edgeCaseStatus } : node)); void refreshBilling(); } catch (cause: unknown) { setError(message(cause, t('studyEdgeError'))); } finally { setSubmitting(false); } }} /> : hasConcepts && selected ? <p className="study-loading" role="status">{loadingSession ? t('loadingQuestion') : error || t('studyBeginError')}</p> : <section className="empty-state compact"><Icon name="brain" /><h1>{t('contextNotExtracted')}</h1><p>{t('contextNotExtractedDescription')}</p></section>}</section></div>}
    </div>
  </>;
}

export function SessionView({ session, history = [], material, outline = [], answer, words, onAnswerChange, onSubmit, selectedNode, submitting, onRetry, error, onRequestEdgeCase }: { session: StudySession; history?: StudySession[]; material?: Material | null; outline?: EditorialUnit[]; answer: string; words: number; onAnswerChange: (value: string) => void; onSubmit: () => void; selectedNode: KnowledgeNode | undefined; submitting: boolean; onRetry: () => void; error: string; onRequestEdgeCase: () => Promise<void> }) {
  const { locale, t } = useI18n();
  const [helpOpen, setHelpOpen] = useState(false);
  useEffect(() => setHelpOpen(false), [session.id]);
  const edgeActive = session.state === "EXPLANATION_PASSED" && (session.edgeCaseStatus === "READY" || session.edgeCaseStatus === "REVIEW");
  const latest = session.attempts.at(-1);
  const completed = session.state === "EXPLANATION_PASSED";
  const statusLabel = latest?.evaluation.status === 'PASSED' ? t('statusPassed') : latest?.evaluation.status === 'INCOMPLETE' ? t('statusIncomplete') : t('statusLogicalBreak');
  return <>
    <section className="prompt-card">
      <div className="eyebrow"><span className="challenge">{edgeActive ? t('edgeChallenge') : t('nodeChallenge')}</span></div>
      <h2>{edgeActive ? session.edgeCaseChallenge?.question : session.question.text}</h2>
      {selectedNode && <>
        <ActionButton variant="primary" className="concept-help-toggle" aria-expanded={helpOpen} aria-controls={`concept-help-${session.id}`} onClick={() => setHelpOpen((open) => !open)}><Icon name="idea" />{helpOpen ? t('hideConceptHelp') : t('showConceptHelp')}</ActionButton>
        <section className="concept-summary" id={`concept-help-${session.id}`} hidden={!helpOpen}><header><span><Icon name="idea" />{t('conceptContext')}</span></header><h3>{selectedNode.concept.name}</h3><p>{selectedNode.concept.description}</p>{selectedNode.concept.fundamentalPremises.length > 0 && <ul>{selectedNode.concept.fundamentalPremises.map((premise, index) => <li key={`${index}-${premise}`}>{premise}</li>)}</ul>}</section>
        <SourceViewerBoundary key={`${selectedNode.concept.id}:${material?.id ?? ''}`} fallback={t(material?.sourceType === 'PDF' ? 'pdfUnavailable' : 'studyMaterialLoadError')}><SourceDisclosure material={material} outline={outline} node={selectedNode} /></SourceViewerBoundary>
      </>}
      {edgeActive && session.edgeCaseChallenge && <p className="edge-scenario">{session.edgeCaseChallenge.scenario}</p>}
      <p className="tip"><Icon name="idea" /><span>{edgeActive ? t('testLimits') : t('explainMechanism')} {t('minimumAnswer')}</span></p>
    </section>
    {!completed || edgeActive ? <section className="answer-card"><header><h2>{edgeActive ? t('yourEdgeAnswer') : t('yourExplanation')}</h2><p>{words} {t('words')}</p></header><textarea aria-label={edgeActive ? t('yourEdgeAnswer') : t('yourExplanation')} value={answer} onChange={(event) => onAnswerChange(event.target.value)} rows={8} placeholder={t('answerPlaceholder')} /><footer><span>{t('groundedDiagnostic')}</span><div className="answer-actions"><ActionButton variant="primary" disabled={answer.trim().length < 20 || submitting} onClick={onSubmit}><Icon name="sparkles" />{submitting ? t('evaluating') : t('validateAnswer')}</ActionButton>{error && <ActionButton variant="secondary" onClick={onRetry}>{t('retry')}</ActionButton>}</div></footer></section> : <section className="completion-card"><Icon name="sparkles" /><div><span>{t('explanationComplete')}</span><h2>{t('explanationPassed')}</h2><p>{t('edgeOptional')}</p></div>{session.edgeCaseStatus === "NOT_REQUESTED" && <ActionButton variant="secondary" disabled={submitting} onClick={() => void onRequestEdgeCase()}>{submitting ? t('preparing') : t('prepareEdge')}</ActionButton>}{session.edgeCaseStatus === "PASSED" && <strong>{t('edgePassed')}</strong>}</section>}
    {latest && <section id="study-diagnostic" className="diagnostic-card concise" tabIndex={-1}><header><h2>{t('diagnostic')}</h2><small className={latest.evaluation.status.toLowerCase()}>{statusLabel}</small></header><div className="diagnostic-points"><article><strong>{t('correctPoint')}</strong><p>{latest.evaluation.strength ?? latest.evaluation.feedback}</p></article>{latest.evaluation.status !== 'PASSED' && <article><strong>{t('missingPoint')}</strong><p>{latest.evaluation.gap ?? latest.evaluation.logicalBreak ?? latest.evaluation.missingPremises[0] ?? latest.evaluation.feedback}</p></article>}<article><strong>{t('nextStep')}</strong>{selectedNode && <span className="next-step-concept">{t('concept')}: {selectedNode.concept.name}</span>}<p>{latest.evaluation.nextAction ?? latest.evaluation.feedback}</p></article></div>{session.edgeCaseStatus !== "NOT_REQUESTED" && <div className="edge-case-status"><Icon name="warning" /><div><span>{t('edgeChallenge')}</span><p>{session.edgeCaseChallenge?.question}</p></div></div>}</section>}
    {history.some((item) => item.attempts.length > 0) && <details className="study-history"><summary>{t('savedExplanations')} ({history.filter((item) => item.attempts.length > 0).length})</summary><div>{history.filter((item) => item.attempts.length > 0).map((item) => <article key={item.id}><h3>{new Date(item.createdAt).toLocaleDateString(locale)} · {item.state === 'EXPLANATION_PASSED' ? t('statusPassed') : t('statusIncomplete')}</h3><p>{item.question.text}</p>{item.attempts.map((attempt, index) => <div key={`${item.id}-${index}`}><strong>{attempt.stage === 'INITIAL' ? t('yourExplanation') : t('yourEdgeAnswer')}</strong><p>{attempt.answer}</p><strong>{t('diagnostic')}</strong><p>{attempt.evaluation.feedback}</p></div>)}</article>)}</div></details>}
  </>;
}

function SourceDisclosure({ material, outline, node }: { material?: Material | null; outline: EditorialUnit[]; node: KnowledgeNode }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const offset = node.concept.sourceOffset ?? material?.content.indexOf(node.concept.sourceExcerpt) ?? 0;
  const unit = outline.find((item) => item.startOffset <= offset && offset < item.endOffset);
  return <details className="source-disclosure" onToggle={(event) => setOpen(event.currentTarget.open)}><summary><Icon name="book" /><span>{t('readSource')}</span><Icon name="chevron" /></summary>{open && (material?.sourceType === 'PDF' ? <PdfBookViewer materialId={material.id} title={material.title} excerpt={node.concept.sourceExcerpt} sourceOffset={offset} contentLength={material.content.length} outlinePage={unit?.pageNumber ?? undefined} /> : <SourceReader material={material} outline={outline} node={node} />)}</details>;
}

function SourceReader({ material, outline, node }: { material?: Material | null; outline: EditorialUnit[]; node: KnowledgeNode }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const excerpt = node.concept.sourceExcerpt;
  if (!material) return <p className="study-loading" role="status">{t('checkingMaterial')}</p>;
  const content = material.content;
  const offset = node.concept.sourceOffset ?? content.indexOf(excerpt);
  const position = Math.max(0, offset);
  const unit = outline.find((item) => item.startOffset <= position && position < item.endOffset);
  const unitStart = unit?.startOffset ?? 0;
  const unitEnd = unit?.endOffset ?? content.length;
  const windowStart = Math.max(unitStart, position - 4000);
  const windowEnd = Math.min(unitEnd, position + Math.max(4000, excerpt.length));
  const expandedStart = unitEnd - unitStart <= 24000 ? unitStart : Math.max(unitStart, position - 12000);
  const expandedEnd = Math.min(unitEnd, expandedStart + 24000);
  const start = expanded ? expandedStart : windowStart;
  const end = expanded ? expandedEnd : windowEnd;
  const passage = content.slice(start, end);
  const selectedStart = passage.indexOf(excerpt);
  const selectedEnd = selectedStart + excerpt.length;
  let cursor = 0;
  const readable = (value: string) => value.replace(/([^\n])\n([^\n])/g, '$1 $2');
  return <article className="source-reader"><header><span>{t('sourceFromMaterial')}</span><h4>{unit?.title ?? material.title}</h4>{unit?.pageNumber && <small>{t('sourcePage')} {unit.pageNumber}</small>}</header>{start > unitStart && <span className="source-reader-ellipsis" aria-hidden="true">…</span>}<div className="source-reader-text">{passage.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => {
    const paragraphStart = passage.indexOf(paragraph, cursor);
    cursor = paragraphStart + paragraph.length;
    const markStart = Math.max(0, selectedStart - paragraphStart);
    const markEnd = Math.min(paragraph.length, selectedEnd - paragraphStart);
    return <p key={index}>{selectedStart >= 0 && markEnd > markStart ? <>{readable(paragraph.slice(0, markStart))}<mark>{readable(paragraph.slice(markStart, markEnd))}</mark>{readable(paragraph.slice(markEnd))}</> : readable(paragraph)}</p>;
  })}</div>{end < unitEnd && <span className="source-reader-ellipsis" aria-hidden="true">…</span>}{(windowStart > unitStart || windowEnd < unitEnd) && <ActionButton variant="secondary" onClick={() => setExpanded((value) => !value)}>{expanded ? t('showLessSource') : t('showFullSection')}</ActionButton>}</article>;
}

function ExtractionProgressCard({ progress, connectionLost, retrying, cancelling, onRetry, onCancel }: { progress: ExtractionProgress; connectionLost: boolean; retrying: boolean; cancelling: boolean; onRetry: () => Promise<void>; onCancel: () => Promise<void> }) {
  const { t } = useI18n();
  const failed = progress.status === "FAILED";
  const [titleKey, descriptionKey] = extractionStageKeys[progress.stage];
  const title = t(titleKey);
  const failureMessage = progress.error?.trim() || t('extractionFailedDescription');
  const stages = [
    { key: 'PREPARING', label: t('extractionPreparingStage') }, { key: 'EXTRACTING', label: t('extractionExtractingStage') }, { key: 'REDUCING', label: t('extractionReducingStage') },
  ] as const;
  const currentStage = Math.max(0, stages.findIndex(({ key }) => key === progress.stage));
  return <section className={`extraction-progress ${failed ? "failed" : "active"}`} aria-live="polite"><div className="processing-symbol"><Icon name={failed ? "warning" : "brain"} /><i /></div><div className="progress-copy"><span className="eyebrow">{t('extractionHeading')}</span><h2>{failed ? t('extractionFailed') : title}</h2><p>{failed ? failureMessage : t(descriptionKey)}</p></div>{!failed && <><ol className="extraction-stages" aria-label={t('extractionStages')}>{stages.map((stage, index) => <li key={stage.key} className={index < currentStage ? 'done' : index === currentStage ? 'current' : ''}><i aria-hidden="true" /><span>{stage.label}</span></li>)}</ol><div className="progress-track indeterminate" role="progressbar" aria-label={`${title}. ${t('extractionInProgress')}`}><i /></div><p className="progress-note">{t('extractionWhileWaiting')}</p>{connectionLost && <p className="connection-note">{t('extractionConnectionLost')}</p>}<ActionButton variant="secondary" onClick={() => void onCancel()} disabled={cancelling}>{cancelling ? t('extractionCancelling') : t('extractionCancel')}</ActionButton></>}{failed && <ActionButton variant="primary" onClick={() => void onRetry()} disabled={retrying}>{retrying ? t('extractionRetryingAction') : t('extractionRetry')}</ActionButton>}</section>;
}

export function MaterialForm({ title, content, creating, uploadProgress, onTitleChange, onContentChange, onSubmit, onUpload, error, compact = false }: { title: string; content: string; creating: boolean; uploadProgress: number | null; error: string; compact?: boolean; onTitleChange: (value: string) => void; onContentChange: (value: string) => void; onSubmit: () => void; onUpload: (file: File, title: string) => Promise<void> }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [file, setFile] = useState<File | null>(null);
  return <section className={`material-form ${compact ? "compact-form" : ""}`}>
    <div><span className="eyebrow">{t('studyBase')}</span><h1>{compact ? t('addMaterial') : t('startWithMaterial')}</h1><p>{t('materialFormDescription')}</p></div>
    <div className="material-mode" role="group" aria-label={t('addMaterial')}><button type="button" className={mode === 'text' ? 'selected' : ''} onClick={() => setMode('text')}>{t('pasteText')}</button><button type="button" className={mode === 'file' ? 'selected' : ''} onClick={() => setMode('file')}>{t('uploadFile')}</button></div>
    <label className="title-field">{t('title')}{mode === 'file' && <small>{t('optionalFilename')}</small>}<input value={title} maxLength={160} onChange={(event) => onTitleChange(event.target.value)} placeholder={t('titlePlaceholder')} /></label>
    {mode === 'text' ? <label>{t('content')}<textarea value={content} onChange={(event) => onContentChange(event.target.value)} placeholder={t('contentPlaceholder')} rows={8} /></label> : <label>{t('file')}<input type="file" accept=".pdf,.md,.markdown,.txt,application/pdf,text/markdown,text/plain" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><small>{t('fileHelp')}</small></label>}
    {uploadProgress !== null && <div className="upload-progress" role="status">{uploadProgress < 100 ? `${t('uploadSending')}: ${uploadProgress}%` : t('uploadReceived')}<progress value={uploadProgress} max={100} /></div>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <ActionButton variant="primary" onClick={() => mode === 'file' ? file && void onUpload(file, title) : onSubmit()} disabled={creating || (mode === 'text' ? !title.trim() || !content.trim() : !file)}>{creating ? t('savingQueue') : mode === 'file' ? t('uploadExtract') : t('createExtract')}</ActionButton>
  </section>;
}
