"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type ConceptConfidence, type ConceptPerformance, type KnowledgeNode, type Material, type PracticeFocusMode, type PracticeProject } from '../lib/api';
import { getActiveMaterialId, saveActiveMaterialId } from '../lib/active-material';
import { Icon } from '../lib/icons';
import { LoadingSkeleton } from './loading-skeleton';
import { StyledSelect } from './styled-select';
import { ActionButton } from './action-button';

type FocusChoice = 'AUTOMATIC' | 'MANUAL';

const projectFocusLabels: Record<PracticeFocusMode, string> = {
  OVERVIEW: 'Material inteiro', MANUAL: 'Escolha manual', CONFIDENCE: 'Foco automático', PERFORMANCE: 'Foco automático', COMBINED: 'Foco automático',
};
const confidenceLabels = ['Não consigo aplicar', 'Entendo parcialmente', 'Explico com ajuda', 'Uso sozinho', 'Consigo ensinar'];
const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export function resolveAutomaticFocusMode(confidences: ConceptConfidence[], performance: ConceptPerformance[]): PracticeFocusMode {
  const hasConfidence = confidences.length > 0;
  const hasPerformance = performance.some(({ weakness }) => weakness !== null);
  if (hasConfidence && hasPerformance) return 'COMBINED';
  if (hasConfidence) return 'CONFIDENCE';
  if (hasPerformance) return 'PERFORMANCE';
  return 'OVERVIEW';
}

export function PracticeWorkspace() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialId, setMaterialId] = useState('');
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [confidences, setConfidences] = useState<ConceptConfidence[]>([]);
  const [performance, setPerformance] = useState<ConceptPerformance[]>([]);
  const [projects, setProjects] = useState<PracticeProject[]>([]);
  const [project, setProject] = useState<PracticeProject | null>(null);
  const [focusChoice, setFocusChoice] = useState<FocusChoice>('AUTOMATIC');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMaterial, setLoadingMaterial] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingConfidence, setSavingConfidence] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.materials().then((items) => {
      setMaterials(items);
      setMaterialId(getActiveMaterialId(items.map(({ id }) => id)) || items[0]?.id || '');
    }).catch((cause: unknown) => setError(errorMessage(cause, 'Não foi possível carregar os materiais.'))).finally(() => setLoading(false));
  }, []);

  const loadMaterial = useCallback(async (id: string) => {
    setLoadingMaterial(true); setError(''); setProject(null); setSelectedIds([]);
    try {
      const [map, confidenceItems, performanceItems, history] = await Promise.all([api.knowledgeMap(id), api.confidences(id), api.performance(id), api.practiceProjects(id)]);
      setNodes(map); setConfidences(confidenceItems); setPerformance(performanceItems); setProjects(history);
    } catch (cause: unknown) { setError(errorMessage(cause, 'Não foi possível carregar os dados de prática.')); }
    finally { setLoadingMaterial(false); }
  }, []);
  useEffect(() => { if (materialId) void loadMaterial(materialId); }, [materialId, loadMaterial]);

  const confidenceByConcept = useMemo(() => new Map(confidences.map((item) => [item.conceptId, item.value])), [confidences]);
  const performanceByConcept = useMemo(() => new Map(performance.map((item) => [item.conceptId, item])), [performance]);
  const automaticMode = resolveAutomaticFocusMode(confidences, performance);
  const canGenerate = nodes.length > 0 && !generating && (focusChoice === 'AUTOMATIC' || selectedIds.length > 0);
  const automaticSummary = automaticMode === 'COMBINED'
    ? 'Vamos priorizar os conceitos com menor confiança e maior dificuldade nas suas explicações.'
    : automaticMode === 'CONFIDENCE'
      ? 'Vamos priorizar os conceitos em que você declarou menos confiança.'
      : automaticMode === 'PERFORMANCE'
        ? 'Vamos priorizar as dificuldades observadas nas suas explicações.'
        : 'Ainda não há sinais pessoais; o projeto conectará o material inteiro.';

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
    } catch (cause: unknown) { setConfidences(previous); setError(errorMessage(cause, 'Não foi possível salvar sua confiança.')); }
    finally { setSavingConfidence(null); }
  };

  const toggleConcept = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 5 ? [...current, id] : current);
  const generate = async () => {
    if (!canGenerate) return;
    setGenerating(true); setError('');
    try {
      const mode = focusChoice === 'MANUAL' ? 'MANUAL' : automaticMode;
      const generated = await api.generatePracticeProject(materialId, mode, focusChoice === 'MANUAL' ? selectedIds : undefined);
      setProject(generated);
      setProjects((current) => [generated, ...current.filter(({ id }) => id !== generated.id)]);
    } catch (cause: unknown) {
      setError(errorMessage(cause, 'Não foi possível gerar o Projeto de prática. Tente novamente.'));
    } finally { setGenerating(false); }
  };

  if (loading) return <LoadingSkeleton variant="practice" />;
  if (!materials.length) return <section className="empty-state"><Icon name="document" /><h1>Adicione um material primeiro</h1><p>A prática usa os conceitos extraídos de um material.</p><a className="exercise-link" href="/">Ir para o Espaço de estudo</a></section>;
  return <>
    <section className="practice-hero"><div><span>TRANSFERÊNCIA PARA A PRÁTICA</span><h1>Projeto de prática</h1><p>Transforme o que estudou em algo que você possa construir.</p></div><StyledSelect label="Material" icon="document" value={materialId} options={materials.map((material) => ({ value: material.id, label: material.title }))} onValueChange={(id) => { saveActiveMaterialId(id); setMaterialId(id); }} /></section>
    {error && <p className="form-error practice-error" role="alert">{error}</p>}
    {loadingMaterial ? <LoadingSkeleton variant="practice" /> : !nodes.length ? <section className="empty-state"><Icon name="brain" /><h1>Este material ainda não tem conceitos</h1><p>Extraia o material no Espaço de estudo antes de gerar uma prática.</p><a className="exercise-link" href={`/?material=${materialId}`}>Abrir material</a></section> : <div className="practice-layout">
      <section className="practice-config">
        <header><span>1 · DEFINA O FOCO</span><h2>Como você quer preparar o projeto?</h2><p>Você não precisa escolher uma estratégia técnica. O MasterMe usa o contexto disponível.</p></header>
        <div className="focus-choices">
          <button type="button" className={focusChoice === 'AUTOMATIC' ? 'selected' : ''} aria-pressed={focusChoice === 'AUTOMATIC'} onClick={() => { setFocusChoice('AUTOMATIC'); setSelectedIds([]); }}><Icon name="sparkles" /><span><strong>Escolha por mim</strong><small>Usa suas dificuldades e confiança. Sem histórico, conecta o material inteiro.</small></span><i><Icon name="check" /></i></button>
          <button type="button" className={focusChoice === 'MANUAL' ? 'selected' : ''} aria-pressed={focusChoice === 'MANUAL'} onClick={() => setFocusChoice('MANUAL')}><Icon name="brain" /><span><strong>Quero escolher</strong><small>Você seleciona de um a cinco conceitos para exercitar juntos.</small></span><i><Icon name="check" /></i></button>
        </div>
        {focusChoice === 'AUTOMATIC' ? <section className="focus-explanation" aria-live="polite"><Icon name="idea" /><div><strong>Como o foco será definido</strong><p>{automaticSummary}</p></div></section> : <section className="concept-scope"><header><span>2 · ESCOLHA OS CONCEITOS</span><h2>O que você quer colocar em prática?</h2><small>{selectedIds.length}/5 selecionados</small></header><div>{nodes.map((node) => <label key={node.concept.id} className={selectedIds.includes(node.concept.id) ? 'selected' : ''}><input type="checkbox" checked={selectedIds.includes(node.concept.id)} disabled={!selectedIds.includes(node.concept.id) && selectedIds.length >= 5} onChange={() => toggleConcept(node.concept.id)} /><span><strong>{node.concept.name}</strong><small>{confidenceByConcept.has(node.concept.id) ? `Confiança ${confidenceByConcept.get(node.concept.id)}/5` : 'Confiança não informada'} · {performanceByConcept.get(node.concept.id)?.weakness === null || !performanceByConcept.has(node.concept.id) ? 'Sem explicações avaliadas' : `${Math.round((performanceByConcept.get(node.concept.id)?.weakness ?? 0) * 100)}% de dificuldade`}</small></span></label>)}</div></section>}
        <details className="confidence-panel"><summary><span><b>Opcional</b><strong>Ajustar minha confiança nos conceitos</strong><small>Ajuda o foco automático quando você não fez a etapa de explicação.</small></span><Icon name="chevron" /></summary><div className="confidence-list">{nodes.map((node) => <div className="confidence-row" key={node.concept.id}><div><strong>{node.concept.name}</strong><small>{confidenceByConcept.has(node.concept.id) ? confidenceLabels[(confidenceByConcept.get(node.concept.id) ?? 1) - 1] : 'Não informado'}</small></div><div className="confidence-scale" aria-label={`Confiança em ${node.concept.name}`}>{[1,2,3,4,5].map((value) => <button type="button" key={value} aria-label={`${value} de 5`} className={confidenceByConcept.get(node.concept.id) === value ? 'active' : ''} disabled={savingConfidence === node.concept.id} onClick={() => void setConfidence(node.concept.id, value)}>{value}</button>)}{confidenceByConcept.has(node.concept.id) && <button type="button" className="clear" onClick={() => void setConfidence(node.concept.id, null)}>Remover</button>}</div></div>)}</div></details>
        <div className="generate-bar"><div><strong>Projeto personalizado</strong><span>{focusChoice === 'MANUAL' ? selectedIds.length ? `${selectedIds.length} conceitos selecionados` : 'Escolha pelo menos um conceito' : automaticSummary}</span></div><ActionButton variant="primary" disabled={!canGenerate} onClick={() => void generate()}><Icon name="sparkles" />{generating ? 'Gerando projeto…' : 'Gerar projeto · 1 uso de IA'}</ActionButton></div>
      </section>
      <aside className="practice-result">{project ? <ProjectView project={project} /> : <><div className="result-placeholder"><Icon name="idea" /><h2>Sua próxima construção aparece aqui</h2><p>Você recebe objetivo, entregáveis, restrições e um primeiro passo. A execução continua sendo sua.</p></div>{projects.length > 0 && <section className="project-history"><span>PROJETOS ANTERIORES</span>{projects.map((item) => <button key={item.id} onClick={() => setProject(item)}><strong>{item.title}</strong><small>{new Date(item.createdAt).toLocaleDateString('pt-BR')} · {projectFocusLabels[item.focusMode]}</small></button>)}</section>}</>}</aside>
    </div>}
  </>;
}

export function ProjectView({ project }: { project: PracticeProject }) {
  return <article className="project-card"><header><span>PROJETO DE PRÁTICA · {projectFocusLabels[project.focusMode]}</span><h2>{project.title}</h2><p>{project.context}</p></header><section><h3>Objetivo</h3><p>{project.goal}</p></section><div className="project-columns"><section><h3>Entregáveis</h3><ul>{project.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h3>Restrições</h3><ul>{project.constraints.map((item) => <li key={item}>{item}</li>)}</ul></section></div><section className="first-step"><h3>Primeiro passo</h3><p>{project.firstStep}</p></section><section className="project-priorities"><h3>Conceitos priorizados</h3>{project.prioritizedConcepts.map((item) => <div key={item.conceptId}><strong>{item.name}</strong><span>{item.reason}</span></div>)}</section></article>;
}
