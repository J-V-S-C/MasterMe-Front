"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, api, type ConceptConfidence, type ConceptPerformance, type FocusedDrillPreview, type KnowledgeNode, type LearningEvidence, type MaterialSummary, type PracticeFocusMode, type PracticeFocusPreview, type PracticeProject } from '../../lib/api';
import { getActiveMaterialId, saveActiveMaterialId } from '../../lib/study/active-material';
import { Icon } from '../ui/icons';
import { useI18n } from '../../lib/localization/i18n';
import { LoadingSkeleton } from '../ui/loading-skeleton';
import { SelectField } from '../ui/select-field';
import { ActionButton } from '../ui/action-button';
import { WorkspaceHeading } from '../ui/workspace-heading';
import { useRealtimeRefresh } from '../providers/realtime-provider';
import { useBilling } from '../providers/billing-provider';
import { StudyDepth } from '../study/study-depth';

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
  const searchParams = useSearchParams();
  const requestedMaterialId = searchParams.get('material');
  const requestedConceptId = searchParams.get('concept');
  const requestedProjectId = searchParams.get('project');
  const { refresh: refreshBilling } = useBilling();
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [materialId, setMaterialId] = useState('');
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [confidences, setConfidences] = useState<ConceptConfidence[]>([]);
  const [performance, setPerformance] = useState<ConceptPerformance[]>([]);
  const [evidence, setEvidence] = useState<LearningEvidence[]>([]);
  const [drillConceptId, setDrillConceptId] = useState('');
  const [drillPreview, setDrillPreview] = useState<FocusedDrillPreview | null>(null);
  const [drillError, setDrillError] = useState('');
  const [practiceMode, setPracticeMode] = useState<'DRILL' | 'PROJECT'>('DRILL');
  const [projects, setProjects] = useState<PracticeProject[]>([]);
  const [project, setProject] = useState<PracticeProject | null>(null);
  const [focusChoice, setFocusChoice] = useState<FocusChoice>('AUTOMATIC');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'FOUNDATION' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');
  const [projectSize, setProjectSize] = useState<'SMALL' | 'MEDIUM'>('SMALL');
  const [preview, setPreview] = useState<PracticeFocusPreview | null>(null);
  const [focusMessage, setFocusMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMaterial, setLoadingMaterial] = useState(false);
  const [loadingFocus, setLoadingFocus] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [addingProjectTask, setAddingProjectTask] = useState(false);
  const [projectTaskId, setProjectTaskId] = useState<string | null>(null);
  const [savingConfidence, setSavingConfidence] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.materials().then((items) => { setMaterials(items); setMaterialId(items.find(({ id }) => id === requestedMaterialId)?.id || getActiveMaterialId(items.map(({ id }) => id)) || items[0]?.id || ''); })
      .catch((cause: unknown) => setError(errorMessage(cause, t('materialsLoadError')))).finally(() => setLoading(false));
  }, [t, requestedMaterialId]);

  const loadMaterial = useCallback(async (id: string, reset = true) => {
    if (reset) setLoadingMaterial(true);
    setError('');
    if (reset) { setProject(null); setSelectedIds([]); setPreview(null); setEvidence([]); setDrillConceptId(''); setDrillPreview(null); setProjectTaskId(null); }
    try {
      const [context, attempts] = await Promise.all([api.practiceContext(id), api.evidence(id).catch(() => [])]);
      setNodes(context.knowledgeMap); setConfidences(context.confidences); setPerformance(context.performance); setProjects(context.projects);
      const linkedProject = context.projects.find((item) => item.id === requestedProjectId);
      if (linkedProject) { setProject(linkedProject); setPracticeMode('PROJECT'); }
      setEvidence(attempts);
      setDrillConceptId((current) => context.knowledgeMap.some((node) => node.concept.id === requestedConceptId) ? requestedConceptId! : context.knowledgeMap.some((node) => node.concept.id === current) ? current : '');
    } catch (cause: unknown) { setError(errorMessage(cause, t('practiceDataError'))); }
    finally { if (reset) setLoadingMaterial(false); }
  }, [t, requestedConceptId, requestedProjectId]);
  useEffect(() => { if (materialId) void loadMaterial(materialId); }, [materialId, loadMaterial]);

  useRealtimeRefresh((change) => {
    if (change.type === 'material.progress' || change.type === 'material.queued') return
    void api.materials().then(setMaterials).catch(() => {})
    if (materialId) void loadMaterial(materialId, false)
    void refreshBilling()
  });

  const confidenceByConcept = useMemo(() => new Map(confidences.map((item) => [item.conceptId, item.value])), [confidences]);
  const performanceByConcept = useMemo(() => new Map(performance.map((item) => [item.conceptId, item])), [performance]);
  const gapEvidence = useMemo(() => {
    const latestByConcept = new Map<string, LearningEvidence>();
    for (const event of [...evidence].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
      if (event.concept_id && !event.evidence_contestations?.length && !latestByConcept.has(event.concept_id)) latestByConcept.set(event.concept_id, event);
    }
    return [...latestByConcept.values()].filter((event) => event.status === 'INCOMPLETE' || event.status === 'LOGICAL_BREAK');
  }, [evidence]);
  const recommendedDrillId = gapEvidence.find((event) => nodes.some((node) => node.concept.id === event.concept_id))?.concept_id ?? nodes[0]?.concept.id ?? '';
  const selectedDrill = nodes.find((node) => node.concept.id === (drillConceptId || recommendedDrillId));
  useEffect(() => {
    if (!materialId || !selectedDrill || practiceMode !== 'DRILL') return;
    let active = true;
    setDrillPreview(null); setDrillError('');
    void api.focusedDrill(materialId, selectedDrill.concept.id).then((value) => { if (active) setDrillPreview(value); })
      .catch((cause: unknown) => { if (active) setDrillError(errorMessage(cause, locale === 'pt-BR' ? 'Não foi possível preparar o exercício.' : 'Could not prepare the drill.')); });
    return () => { active = false; };
  }, [materialId, selectedDrill?.concept.id, practiceMode, locale]);
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
      const generated = await api.generatePracticeProject(materialId, selectedMode, conceptIds, { difficulty, size: projectSize });
      setProject(generated); setProjects((current) => [generated, ...current.filter(({ id }) => id !== generated.id)]);
      setProjectTaskId(null);
      void refreshBilling();
    } catch (cause: unknown) { setError(errorMessage(cause, t('projectGenerateError'))); }
    finally { setGenerating(false); }
  };
  const addProjectToTasks = async () => {
    if (!project || addingProjectTask) return;
    setAddingProjectTask(true); setError('');
    try {
      const existing = (await api.tasks()).find((task) => task.project_id === project.id && task.status !== 'REMOVED');
      const task = existing ?? await api.createTask({ title: project.title, activityType: 'PRACTICE', materialId: project.materialId, projectId: project.id, durationMinutes: 60 });
      setProjectTaskId(task.id);
    } catch (cause: unknown) { setError(errorMessage(cause, locale === 'pt-BR' ? 'Não foi possível adicionar o projeto às tarefas.' : 'Could not add the project to Tasks.')); }
    finally { setAddingProjectTask(false); }
  };
  const confidenceLabels = [t('confidenceOne'), t('confidenceTwo'), t('confidenceThree'), t('confidenceFour'), t('confidenceFive')];

  if (loading) return <LoadingSkeleton variant="practice" />;
  if (!materials.length) return <section className="workspace-empty practice-empty"><div className="workspace-empty-copy"><span className="eyebrow">{t('practiceKicker')}</span><h1>{t('addMaterialFirst')}</h1><p>{t('practiceUsesConcepts')}</p><Link className="exercise-link" href="/study">{t('goToStudy')} <Icon name="chevron" /></Link></div><div className="practice-empty-brief" aria-label={t('practiceEmptyIllustration')}><span className="eyebrow">{t('practiceEmptyPath')}</span><div className="practice-empty-sheet"><div className="practice-empty-sheet-heading"><span>{t('practiceEmptyBrief')}</span><strong>{t('practiceTitle')}</strong></div><div className="practice-empty-sheet-row"><span>{t('practiceEmptyFocus')}</span><p>{t('practiceEmptyFocusDescription')}</p></div><div className="practice-empty-sheet-row"><span>{t('goal')}</span><p>{t('practiceEmptyGoalDescription')}</p></div><div className="practice-empty-sheet-row"><span>{t('firstStep')}</span><p>{t('practiceEmptyStepDescription')}</p></div></div></div></section>;
  return <>
    <WorkspaceHeading className="practice-hero" eyebrow={t('practiceKicker')} title={t('practiceTitle')} description={t('practiceDescription')} aside={<SelectField label={t('material')} icon="document" value={materialId} options={materials.map(({ id, title }) => ({ value: id, label: title }))} onValueChange={(id) => { saveActiveMaterialId(id); setMaterialId(id); }} />} />
    {error && <p className="form-error practice-error" role="alert">{error}</p>}
    {loadingMaterial ? <LoadingSkeleton variant="practice" /> : !nodes.length ? <section className="empty-state"><Icon name="brain" /><h1>{t('noConcepts')}</h1><p>{t('extractBeforePractice')}</p><Link className="exercise-link" href={`/study?material=${materialId}`}>{t('openMaterial')}</Link></section> : <>
      <div className="practice-mode" role="group" aria-label={locale === 'pt-BR' ? 'Modo de prática' : 'Practice mode'}>
        <ActionButton variant={practiceMode === 'DRILL' ? 'primary' : 'secondary'} aria-pressed={practiceMode === 'DRILL'} onClick={() => setPracticeMode('DRILL')}>{locale === 'pt-BR' ? 'Exercício focado' : 'Focused drill'}</ActionButton>
        <ActionButton variant={practiceMode === 'PROJECT' ? 'primary' : 'secondary'} aria-pressed={practiceMode === 'PROJECT'} onClick={() => setPracticeMode('PROJECT')}>{locale === 'pt-BR' ? 'Projeto' : 'Project'}</ActionButton>
      </div>
      {practiceMode === 'DRILL' && selectedDrill ? <section className="practice-drill" aria-labelledby="practice-drill-title">
        <div className="practice-drill-intro"><div><span>{locale === 'pt-BR' ? 'PRÁTICA FOCADA · CERCA DE 10 MIN' : 'FOCUSED PRACTICE · ABOUT 10 MIN'}</span><h2 id="practice-drill-title">{selectedDrill.concept.name}</h2><p>{drillPreview?.observedGap || (locale === 'pt-BR' ? 'Experimente aplicar esta ideia em uma situação concreta.' : 'Apply this idea in a concrete situation.')}</p>{drillPreview && <small>{locale === 'pt-BR' ? 'Critério' : 'Criterion'}: {drillPreview.criteria.join('; ')}</small>}</div>
          <SelectField label={locale === 'pt-BR' ? 'Habilidade' : 'Skill'} value={selectedDrill.concept.id} options={nodes.map((node) => ({ value: node.concept.id, label: node.concept.name }))} onValueChange={setDrillConceptId} />
        </div>
        {drillError ? <p role="alert" className="form-error">{drillError}</p> : drillPreview ? <StudyDepth key={`${selectedDrill.concept.id}:${drillPreview.questionVariant}`} node={selectedDrill} activity="APPLICATION" drill={drillPreview} /> : <p role="status">{locale === 'pt-BR' ? 'Preparando exercício…' : 'Preparing drill…'}</p>}
        <Link className="app-button secondary" href={`/study?material=${materialId}&concept=${selectedDrill.concept.id}&source=1`}>{locale === 'pt-BR' ? 'Abrir fonte no livro' : 'Open source in Study'}</Link>
      </section> : null}
      {practiceMode === 'PROJECT' && <div className="practice-layout">
      <section className="practice-config">
        <header><span>1 · {t('defineFocus')}</span><h2>{t('prepareProject')}</h2><p>{t('noTechnicalStrategy')}</p></header>
        <div className="focus-choices"><button type="button" className={focusChoice === 'AUTOMATIC' ? 'selected' : ''} aria-pressed={focusChoice === 'AUTOMATIC'} onClick={() => { setFocusChoice('AUTOMATIC'); setSelectedIds([]); }}><Icon name="sparkles" /><span><strong>{t('chooseForMe')}</strong><small>{t('chooseForMeDescription')}</small></span><i><Icon name="check" /></i></button><button type="button" className={focusChoice === 'MANUAL' ? 'selected' : ''} aria-pressed={focusChoice === 'MANUAL'} onClick={() => setFocusChoice('MANUAL')}><Icon name="brain" /><span><strong>{t('letMeChoose')}</strong><small>{t('letMeChooseDescription')}</small></span><i><Icon name="check" /></i></button></div>
        {focusChoice === 'AUTOMATIC' ? <section className="focus-explanation" aria-live="polite"><Icon name="idea" /><div><strong>{t('howFocusWorks')}</strong><p>{automaticSummary}</p></div></section> : <section className="concept-scope"><header><span>2 · {t('chooseConcepts')}</span><h2>{t('whatToPractice')}</h2><small>{selectedIds.length}/5 {t('selected')}</small></header><div>{nodes.map((node) => { const item = performanceByConcept.get(node.concept.id); return <label key={node.concept.id} className={selectedIds.includes(node.concept.id) ? 'selected' : ''}><input type="checkbox" checked={selectedIds.includes(node.concept.id)} disabled={!selectedIds.includes(node.concept.id) && selectedIds.length >= 5} onChange={() => toggleConcept(node.concept.id)} /><span><strong>{node.concept.name}</strong><small>{confidenceByConcept.has(node.concept.id) ? `${t('confidence')} ${confidenceByConcept.get(node.concept.id)}/5` : t('confidenceMissing')} · {item?.latestStatus ? `${t('latestAnswer')}: ${item.latestStatus}` : t('noEvaluatedAnswers')}</small></span></label>; })}</div></section>}
        <section className={`focus-preview ${focusMessage ? 'warning' : ''}`} aria-live="polite"><header><span>2 · {t('focusPreview')}</span><strong>{loadingFocus ? t('calculatingFocus') : preview?.priorities.length ? t('conceptsToPractice') : t('focusNeedsInput')}</strong></header>{focusMessage && <p>{focusMessage}</p>}{preview?.priorities.map((item) => <div key={item.conceptId}><strong>{item.name}</strong><span>{item.reason}</span></div>)}</section>
        <div className="practice-options"><SelectField label={locale === 'pt-BR' ? 'Dificuldade' : 'Difficulty'} value={difficulty} options={locale === 'pt-BR' ? [{ value: 'FOUNDATION', label: 'Fundamentos' }, { value: 'INTERMEDIATE', label: 'Intermediário' }, { value: 'ADVANCED', label: 'Avançado' }] : [{ value: 'FOUNDATION', label: 'Foundation' }, { value: 'INTERMEDIATE', label: 'Intermediate' }, { value: 'ADVANCED', label: 'Advanced' }]} onValueChange={(value) => { if (value === 'FOUNDATION' || value === 'INTERMEDIATE' || value === 'ADVANCED') setDifficulty(value); }} /><SelectField label={locale === 'pt-BR' ? 'Tamanho do projeto' : 'Project size'} value={projectSize} options={locale === 'pt-BR' ? [{ value: 'SMALL', label: 'Pequeno' }, { value: 'MEDIUM', label: 'Médio' }] : [{ value: 'SMALL', label: 'Small' }, { value: 'MEDIUM', label: 'Medium' }]} onValueChange={(value) => { if (value === 'SMALL' || value === 'MEDIUM') setProjectSize(value); }} /></div>
        <details className="confidence-panel"><summary><span><b>{t('optional')}</b><strong>{t('adjustConfidence')}</strong><small>{t('confidenceHelp')}</small></span><Icon name="chevron" /></summary><div className="confidence-list">{nodes.map((node) => <div className="confidence-row" key={node.concept.id}><div><strong>{node.concept.name}</strong><small>{confidenceByConcept.has(node.concept.id) ? confidenceLabels[(confidenceByConcept.get(node.concept.id) ?? 1) - 1] : t('notInformed')}</small></div><div className="confidence-scale" aria-label={`${t('confidence')} ${node.concept.name}`}>{[1,2,3,4,5].map((value) => <button type="button" key={value} aria-label={`${value} / 5`} className={confidenceByConcept.get(node.concept.id) === value ? 'active' : ''} disabled={savingConfidence === node.concept.id} onClick={() => void setConfidence(node.concept.id, value)}>{value}</button>)}{confidenceByConcept.has(node.concept.id) && <button type="button" className="clear" onClick={() => void setConfidence(node.concept.id, null)}>{t('remove')}</button>}</div></div>)}</div></details>
        <div className="generate-bar"><div><strong>{t('personalizedProject')}</strong><span>{preview?.priorities.length ? `${preview.priorities.length} ${t('activeGapsSelected')}` : focusMessage || t('selectFocusFirst')}</span></div><ActionButton variant="primary" disabled={!preview?.priorities.length || generating || loadingFocus} onClick={() => void generate()}><Icon name="sparkles" />{generating ? t('generatingProject') : t('generateProject')}</ActionButton></div>
      </section>
      <aside className="practice-result">{project ? <><ProjectView project={project} />{projectTaskId ? <Link className="app-button secondary" href="/library">{locale === 'pt-BR' ? 'Abrir em Tarefas' : 'Open in Tasks'}</Link> : <ActionButton variant="secondary" disabled={addingProjectTask} onClick={() => void addProjectToTasks()}>{addingProjectTask ? locale === 'pt-BR' ? 'Adicionando…' : 'Adding…' : locale === 'pt-BR' ? 'Adicionar às Tarefas' : 'Add to Tasks'}</ActionButton>}</> : <><div className="result-placeholder"><Icon name="idea" /><h2>{t('nextBuildHere')}</h2><p>{t('nextBuildDescription')}</p></div>{projects.length > 0 && <section className="project-history"><span>{t('previousProjects')}</span>{projects.map((item) => <button key={item.id} onClick={() => { setProject(item); setProjectTaskId(null); }}><strong>{item.title}</strong><small>{new Date(item.createdAt).toLocaleDateString(locale)}</small></button>)}</section>}</>}</aside>
    </div>}
    </>}
  </>;
}

export function ProjectView({ project }: { project: PracticeProject }) {
  const { t } = useI18n();
  return <article className="project-card"><header><span>{t('practiceProject')}</span><h2>{project.title}</h2><p>{project.context}</p></header><section><h3>{t('goal')}</h3><p>{project.goal}</p></section><section><h3>{t('deliverables')}</h3><ul>{project.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></section><section className="first-step"><h3>{t('firstStep')}</h3><p>{project.firstStep}</p></section><details className="project-support"><summary>{t('constraintsAndFocus')}</summary><section><h3>{t('constraints')}</h3><ul>{project.constraints.map((item) => <li key={item}>{item}</li>)}</ul></section><section className="project-priorities"><h3>{t('prioritizedConcepts')}</h3>{project.prioritizedConcepts.map((item) => <div key={item.conceptId}><strong>{item.name}</strong><span>{item.reason}</span></div>)}</section></details></article>;
}
