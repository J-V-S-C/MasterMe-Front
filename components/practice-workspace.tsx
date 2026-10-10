"use client";

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, api, type ConceptConfidence, type ConceptPerformance, type KnowledgeNode, type MaterialSummary, type PracticeFocusMode, type PracticeFocusPreview, type PracticeProject } from '../lib/api';
import { getActiveMaterialId, saveActiveMaterialId } from '../lib/active-material';
import { Icon } from '../lib/icons';
import { useI18n } from '../lib/i18n';
import { LoadingSkeleton } from './loading-skeleton';
import { StyledSelect } from './styled-select';
import { ActionButton } from './action-button';
import { useRealtimeRefresh } from './realtime-provider';
import { useBilling } from './billing-provider';

type FocusChoice = 'AUTOMATIC' | 'MANUAL';
const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export function resolveAutomaticFocusMode(confidences: ConceptConfidence[], performance: ConceptPerformance[]): PracticeFocusMode {
  const hasConfidence = confidences.length > 0;
  const hasPerformance = performance.some(({ performanceNeed }) => performanceNeed !== null);
  if (hasConfidence && hasPerformance) return 'COMBINED';
  if (hasConfidence) return 'CONFIDENCE';
  if (hasPerformance) return 'PERFORMANCE';
  return 'OVERVIEW';
}

export function PracticeWorkspace() {
  const { locale, t } = useI18n();
  const { refresh: refreshBilling } = useBilling();
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [materialId, setMaterialId] = useState('');
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [confidences, setConfidences] = useState<ConceptConfidence[]>([]);
  const [performance, setPerformance] = useState<ConceptPerformance[]>([]);
  const [projects, setProjects] = useState<PracticeProject[]>([]);
  const [project, setProject] = useState<PracticeProject | null>(null);
  const [focusChoice, setFocusChoice] = useState<FocusChoice>('AUTOMATIC');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<PracticeFocusPreview | null>(null);
  const [focusMessage, setFocusMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMaterial, setLoadingMaterial] = useState(false);
  const [loadingFocus, setLoadingFocus] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingConfidence, setSavingConfidence] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.materials().then((items) => { setMaterials(items); setMaterialId(getActiveMaterialId(items.map(({ id }) => id)) || items[0]?.id || ''); })
      .catch((cause: unknown) => setError(errorMessage(cause, t('materialsLoadError')))).finally(() => setLoading(false));
  }, [t]);

  const loadMaterial = useCallback(async (id: string, reset = true) => {
    if (reset) setLoadingMaterial(true);
    setError('');
    if (reset) { setProject(null); setSelectedIds([]); setPreview(null); }
    try {
      const context = await api.practiceContext(id);
      setNodes(context.knowledgeMap); setConfidences(context.confidences); setPerformance(context.performance); setProjects(context.projects);
    } catch (cause: unknown) { setError(errorMessage(cause, t('practiceDataError'))); }
    finally { if (reset) setLoadingMaterial(false); }
  }, [t]);
  useEffect(() => { if (materialId) void loadMaterial(materialId); }, [materialId, loadMaterial]);

  useRealtimeRefresh((change) => {
    if (change.type === 'material.progress' || change.type === 'material.queued') return
    void api.materials().then(setMaterials).catch(() => {})
    if (materialId) void loadMaterial(materialId, false)
    void refreshBilling()
  });

  const confidenceByConcept = useMemo(() => new Map(confidences.map((item) => [item.conceptId, item.value])), [confidences]);
  const performanceByConcept = useMemo(() => new Map(performance.map((item) => [item.conceptId, item])), [performance]);
  const automaticMode = resolveAutomaticFocusMode(confidences, performance);
  const selectedMode: PracticeFocusMode = focusChoice === 'MANUAL' ? 'MANUAL' : automaticMode;
  const conceptIds = focusChoice === 'MANUAL' ? selectedIds : undefined;
  const automaticSummary = automaticMode === 'COMBINED' ? t('focusCombined') : automaticMode === 'CONFIDENCE' ? t('focusConfidence') : automaticMode === 'PERFORMANCE' ? t('focusPerformance') : t('focusOverview');

  useEffect(() => {
    if (!materialId || !nodes.length || (focusChoice === 'MANUAL' && !selectedIds.length)) { setPreview(null); setFocusMessage(''); return; }
    let active = true;
    setLoadingFocus(true); setFocusMessage('');
    api.practiceFocus(materialId, selectedMode, conceptIds).then((result) => { if (active) setPreview(result); })
      .catch((cause: unknown) => {
        if (!active) return;
        setPreview(null);
        setFocusMessage(cause instanceof ApiError && cause.status === 422 ? cause.message : errorMessage(cause, t('focusPreviewError')));
      }).finally(() => { if (active) setLoadingFocus(false); });
    return () => { active = false; };
  }, [materialId, nodes.length, focusChoice, selectedMode, selectedIds, confidences, performance, t]);

  const setConfidence = async (conceptId: string, value: number | null) => {
    const previous = confidences;
    setSavingConfidence(conceptId); setError('');
    setConfidences((current) => value === null ? current.filter((item) => item.conceptId !== conceptId) : [...current.filter((item) => item.conceptId !== conceptId), { conceptId, value, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]);
    try {
      if (value === null) await api.deleteConfidence(conceptId);
      else {
        const saved = await api.saveConfidence(conceptId, value);
        setConfidences((current) => [...current.filter((item) => item.conceptId !== conceptId), saved]);
      }
    } catch (cause: unknown) { setConfidences(previous); setError(errorMessage(cause, t('confidenceSaveError'))); }
    finally { setSavingConfidence(null); }
  };

  const toggleConcept = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 5 ? [...current, id] : current);
  const generate = async () => {
    if (!preview?.priorities.length || generating) return;
    setGenerating(true); setError('');
    try {
      const generated = await api.generatePracticeProject(materialId, selectedMode, conceptIds);
      setProject(generated); setProjects((current) => [generated, ...current.filter(({ id }) => id !== generated.id)]);
      void refreshBilling();
    } catch (cause: unknown) { setError(errorMessage(cause, t('projectGenerateError'))); }
    finally { setGenerating(false); }
  };
  const confidenceLabels = [t('confidenceOne'), t('confidenceTwo'), t('confidenceThree'), t('confidenceFour'), t('confidenceFive')];

  if (loading) return <LoadingSkeleton variant="practice" />;
  if (!materials.length) return <section className="empty-state"><Icon name="document" /><h1>{t('addMaterialFirst')}</h1><p>{t('practiceUsesConcepts')}</p><Link className="exercise-link" href="/estudar">{t('goToStudy')}</Link></section>;
  return <>
    <section className="practice-hero"><div><span>{t('practiceKicker')}</span><h1>{t('practiceTitle')}</h1><p>{t('practiceDescription')}</p></div><StyledSelect label={t('material')} icon="document" value={materialId} options={materials.map(({ id, title }) => ({ value: id, label: title }))} onValueChange={(id) => { saveActiveMaterialId(id); setMaterialId(id); }} /></section>
    {error && <p className="form-error practice-error" role="alert">{error}</p>}
    {loadingMaterial ? <LoadingSkeleton variant="practice" /> : !nodes.length ? <section className="empty-state"><Icon name="brain" /><h1>{t('noConcepts')}</h1><p>{t('extractBeforePractice')}</p><Link className="exercise-link" href={`/estudar?material=${materialId}`}>{t('openMaterial')}</Link></section> : <div className="practice-layout">
      <section className="practice-config">
        <header><span>1 · {t('defineFocus')}</span><h2>{t('prepareProject')}</h2><p>{t('noTechnicalStrategy')}</p></header>
        <div className="focus-choices"><button type="button" className={focusChoice === 'AUTOMATIC' ? 'selected' : ''} aria-pressed={focusChoice === 'AUTOMATIC'} onClick={() => { setFocusChoice('AUTOMATIC'); setSelectedIds([]); }}><Icon name="sparkles" /><span><strong>{t('chooseForMe')}</strong><small>{t('chooseForMeDescription')}</small></span><i><Icon name="check" /></i></button><button type="button" className={focusChoice === 'MANUAL' ? 'selected' : ''} aria-pressed={focusChoice === 'MANUAL'} onClick={() => setFocusChoice('MANUAL')}><Icon name="brain" /><span><strong>{t('letMeChoose')}</strong><small>{t('letMeChooseDescription')}</small></span><i><Icon name="check" /></i></button></div>
        {focusChoice === 'AUTOMATIC' ? <section className="focus-explanation" aria-live="polite"><Icon name="idea" /><div><strong>{t('howFocusWorks')}</strong><p>{automaticSummary}</p></div></section> : <section className="concept-scope"><header><span>2 · {t('chooseConcepts')}</span><h2>{t('whatToPractice')}</h2><small>{selectedIds.length}/5 {t('selected')}</small></header><div>{nodes.map((node) => { const item = performanceByConcept.get(node.concept.id); return <label key={node.concept.id} className={selectedIds.includes(node.concept.id) ? 'selected' : ''}><input type="checkbox" checked={selectedIds.includes(node.concept.id)} disabled={!selectedIds.includes(node.concept.id) && selectedIds.length >= 5} onChange={() => toggleConcept(node.concept.id)} /><span><strong>{node.concept.name}</strong><small>{confidenceByConcept.has(node.concept.id) ? `${t('confidence')} ${confidenceByConcept.get(node.concept.id)}/5` : t('confidenceMissing')} · {item?.latestStatus ? `${t('latestAnswer')}: ${item.latestStatus}` : t('noEvaluatedAnswers')}</small></span></label>; })}</div></section>}
        <section className={`focus-preview ${focusMessage ? 'warning' : ''}`} aria-live="polite"><header><span>2 · {t('focusPreview')}</span><strong>{loadingFocus ? t('calculatingFocus') : preview?.priorities.length ? t('conceptsToPractice') : t('focusNeedsInput')}</strong></header>{focusMessage && <p>{focusMessage}</p>}{preview?.priorities.map((item) => <div key={item.conceptId}><strong>{item.name}</strong><span>{item.reason}</span></div>)}</section>
        <details className="confidence-panel"><summary><span><b>{t('optional')}</b><strong>{t('adjustConfidence')}</strong><small>{t('confidenceHelp')}</small></span><Icon name="chevron" /></summary><div className="confidence-list">{nodes.map((node) => <div className="confidence-row" key={node.concept.id}><div><strong>{node.concept.name}</strong><small>{confidenceByConcept.has(node.concept.id) ? confidenceLabels[(confidenceByConcept.get(node.concept.id) ?? 1) - 1] : t('notInformed')}</small></div><div className="confidence-scale" aria-label={`${t('confidence')} ${node.concept.name}`}>{[1,2,3,4,5].map((value) => <button type="button" key={value} aria-label={`${value} / 5`} className={confidenceByConcept.get(node.concept.id) === value ? 'active' : ''} disabled={savingConfidence === node.concept.id} onClick={() => void setConfidence(node.concept.id, value)}>{value}</button>)}{confidenceByConcept.has(node.concept.id) && <button type="button" className="clear" onClick={() => void setConfidence(node.concept.id, null)}>{t('remove')}</button>}</div></div>)}</div></details>
        <div className="generate-bar"><div><strong>{t('personalizedProject')}</strong><span>{preview?.priorities.length ? `${preview.priorities.length} ${t('activeGapsSelected')}` : focusMessage || t('selectFocusFirst')}</span></div><ActionButton variant="primary" disabled={!preview?.priorities.length || generating || loadingFocus} onClick={() => void generate()}><Icon name="sparkles" />{generating ? t('generatingProject') : t('generateProject')}</ActionButton></div>
      </section>
      <aside className="practice-result">{project ? <ProjectView project={project} /> : <><div className="result-placeholder"><Icon name="idea" /><h2>{t('nextBuildHere')}</h2><p>{t('nextBuildDescription')}</p></div>{projects.length > 0 && <section className="project-history"><span>{t('previousProjects')}</span>{projects.map((item) => <button key={item.id} onClick={() => setProject(item)}><strong>{item.title}</strong><small>{new Date(item.createdAt).toLocaleDateString(locale)}</small></button>)}</section>}</>}</aside>
    </div>}
  </>;
}

export function ProjectView({ project }: { project: PracticeProject }) {
  const { t } = useI18n();
  return <article className="project-card"><header><span>{t('practiceProject')}</span><h2>{project.title}</h2><p>{project.context}</p></header><section><h3>{t('goal')}</h3><p>{project.goal}</p></section><section><h3>{t('deliverables')}</h3><ul>{project.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></section><section className="first-step"><h3>{t('firstStep')}</h3><p>{project.firstStep}</p></section><details className="project-support"><summary>{t('constraintsAndFocus')}</summary><section><h3>{t('constraints')}</h3><ul>{project.constraints.map((item) => <li key={item}>{item}</li>)}</ul></section><section className="project-priorities"><h3>{t('prioritizedConcepts')}</h3>{project.prioritizedConcepts.map((item) => <div key={item.conceptId}><strong>{item.name}</strong><span>{item.reason}</span></div>)}</section></details></article>;
}
