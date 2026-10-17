"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { api, type ConceptRelation, type KnowledgeNode, type LearningEvidence, type MaterialSummary } from "../lib/api";
import { ReactFlow, Background, Controls, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Icon } from "../lib/icons";
import { useI18n } from "../lib/i18n";
import { LoadingSkeleton } from "./loading-skeleton";
import { StyledSelect } from "./styled-select";
import { getActiveMaterialId, saveActiveMaterialId } from "../lib/active-material";
import { useRealtimeRefresh } from "./realtime-provider";

type GraphEdge = { source: string; target: string };

export function visibleGraphEdges(nodes: KnowledgeNode[], includeTransitive = false): GraphEdge[] {
  const ids = new Set(nodes.map(({ concept }) => concept.id));
  const edges = nodes.flatMap(({ concept }) => concept.nextIds.filter((target) => ids.has(target)).map((target) => ({ source: concept.id, target })));
  if (includeTransitive) return edges;
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target]);
  const reachesWithout = (edge: GraphEdge): boolean => {
    const queue = (adjacency.get(edge.source) ?? []).filter((target) => target !== edge.target);
    const visited = new Set<string>([edge.source]);
    while (queue.length) {
      const current = queue.shift()!;
      if (current === edge.target) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      queue.push(...(adjacency.get(current) ?? []));
    }
    return false;
  };
  return edges.filter((edge) => !reachesWithout(edge));
}

export function graphLayout(nodes: KnowledgeNode[]) {
  const byId = new Map(nodes.map((node) => [node.concept.id, node]));
  const levels = new Map<string, number>();
  const levelFor = (node: KnowledgeNode, visiting = new Set<string>()): number => {
    if (levels.has(node.concept.id)) return levels.get(node.concept.id)!;
    if (visiting.has(node.concept.id)) return 0;
    const parents = node.concept.prerequisiteIds.map((id) => byId.get(id)).filter((item): item is KnowledgeNode => Boolean(item));
    const level = parents.length ? Math.max(...parents.map((item) => levelFor(item, new Set(visiting).add(node.concept.id)))) + 1 : 0;
    levels.set(node.concept.id, level);
    return level;
  };
  const layers = new Map<number, KnowledgeNode[]>();
  nodes.forEach((node) => {
    const level = levelFor(node);
    layers.set(level, [...(layers.get(level) ?? []), node]);
  });
  const ordered = [...layers.entries()].sort(([a], [b]) => a - b);
  const priorOrder = new Map<string, number>();
  ordered.forEach(([, layer]) => {
    layer.sort((left, right) => {
      const average = (node: KnowledgeNode) => {
        const positions = node.concept.prerequisiteIds.flatMap((id) => priorOrder.has(id) ? [priorOrder.get(id)!] : []);
        return positions.length ? positions.reduce((sum, value) => sum + value, 0) / positions.length : Number.MAX_SAFE_INTEGER;
      };
      return average(left) - average(right) || left.concept.name.localeCompare(right.concept.name);
    });
    layer.forEach((node, index) => priorOrder.set(node.concept.id, index));
  });
  const largestLayer = Math.max(1, ...ordered.map(([, layer]) => layer.length));
  const width = Math.max(760, ordered.length * 220 + 140);
  const height = Math.max(520, largestLayer * 118 + 150);
  const points = new Map<string, { x: number; y: number }>();
  ordered.forEach(([level, layer]) => layer.forEach((node, index) => points.set(node.concept.id, { x: 90 + level * 220, y: height / 2 + (index - (layer.length - 1) / 2) * 118 })));
  return { points, width, height };
}

export function KnowledgeMap() {
  const { t, locale } = useI18n();
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [relations, setRelations] = useState<ConceptRelation[]>([]);
  const [evidence, setEvidence] = useState<LearningEvidence[]>([]);
  const [materialId, setMaterialId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [selectedRelationId, setSelectedRelationId] = useState("");
  const [activityType, setActivityType] = useState<'RELATION' | 'APPLICATION' | 'RETENTION'>('APPLICATION');
  const [activityAnswer, setActivityAnswer] = useState('');
  const [assisted, setAssisted] = useState(false);
  const [activityBusy, setActivityBusy] = useState(false);
  const [activityMessage, setActivityMessage] = useState('');
  const activityRequestId = useRef<string | null>(null);
  const [newRelationTarget, setNewRelationTarget] = useState('');
  const [newRelationType, setNewRelationType] = useState<'REQUIRES' | 'ENABLES' | 'CONTRASTS' | 'APPLIES_TO' | 'PART_OF'>('ENABLES');
  const [newRelationStatement, setNewRelationStatement] = useState('');
  const [newRelationJustification, setNewRelationJustification] = useState('');
  const [newRelationExcerpt, setNewRelationExcerpt] = useState('');
  useEffect(() => { activityRequestId.current = null; }, [activityAnswer, activityType, assisted, selectedId, selectedRelationId]);
  const [showAllEdges, setShowAllEdges] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.materials().then((data) => { setMaterials(data); setMaterialId(getActiveMaterialId(data.map(({ id }) => id)) || data[0]?.id || ""); })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : t('unexpectedError'))).finally(() => setLoading(false));
  }, [t]);
  useEffect(() => {
    if (!materialId) return;
    setLoading(true);
    Promise.all([api.knowledgeMap(materialId), api.relations(materialId), api.evidence(materialId)]).then(([data, relationsData, evidenceData]) => { setNodes(data); setRelations(relationsData); setEvidence(evidenceData); setSelectedId(data[0]?.concept.id ?? ""); setSelectedRelationId(''); })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : t('unexpectedError'))).finally(() => setLoading(false));
  }, [materialId, t]);
  const selected = useMemo(() => nodes.find(({ concept }) => concept.id === selectedId) ?? null, [nodes, selectedId]);
  const graph = useMemo(() => graphLayout(nodes), [nodes]);
  const edges = useMemo(() => visibleGraphEdges(nodes, showAllEdges), [nodes, showAllEdges]);
  const selectedRelation = relations.find((relation) => relation.id === selectedRelationId) ?? null;
  const flowNodes = useMemo<Node[]>(() => nodes.map((item) => ({ id: item.concept.id, position: graph.points.get(item.concept.id) ?? { x: 0, y: 0 }, data: { label: `${item.concept.name} · ${item.status}` }, className: `masterme-flow-node ${item.status.toLowerCase()} ${selectedId === item.concept.id ? 'selected' : ''}`, ariaLabel: `${t('selectConcept')} ${item.concept.name}`, draggable: false })), [nodes, graph, selectedId, t]);
  const flowEdges = useMemo<Edge[]>(() => {
    const typedPairs = new Set(relations.map((relation) => `${relation.from_concept_id}:${relation.to_concept_id}`));
    return [...edges.filter((edge) => !typedPairs.has(`${edge.source}:${edge.target}`)).map((edge) => ({ id: `legacy:${edge.source}:${edge.target}`, source: edge.source, target: edge.target, animated: false, style: { strokeDasharray: '5 5', stroke: 'var(--muted)' }, ariaLabel: 'Relação legada sem justificativa de fonte' })), ...relations.map((relation) => ({ id: relation.id, source: relation.from_concept_id, target: relation.to_concept_id, label: relation.relation_type, style: { stroke: '#bb9164' }, ariaLabel: relation.statement }))];
  }, [edges, relations]);
  const adjacent = useMemo(() => new Set(selected ? [selected.concept.id, ...selected.concept.prerequisiteIds, ...selected.concept.nextIds] : []), [selected]);
  const validated = nodes.filter(({ status }) => status === "EXPLAINED").length;
  const review = nodes.filter(({ status }) => status === "REVIEW").length;
  const available = nodes.filter(({ status }) => status === "READY").length;
  const completion = nodes.length ? Math.round((validated / nodes.length) * 100) : 0;
  const statusText = (status: KnowledgeNode['status']) => status === 'EXPLAINED' ? t('mapExplained') : status === 'REVIEW' ? t('mapReview') : t('mapReady');
  const assess = async () => {
    if (activityAnswer.trim().length < 20 || !selected) return;
    setActivityBusy(true); setActivityMessage('');
    try {
      const target = activityType === 'RELATION' && selectedRelation ? { relationId: selectedRelation.id } : { conceptId: selected.concept.id };
      activityRequestId.current ??= crypto.randomUUID();
      const result = await api.evaluateActivity({ requestId: activityRequestId.current, ...target, activityType, answer: activityAnswer.trim(), assisted });
      setEvidence((current) => [result.event, ...current]);
      setActivityMessage(`${result.event.status}: ${result.event.diagnosis}`);
      setActivityAnswer('');
      activityRequestId.current = null;
    } catch (cause: unknown) { setActivityMessage(cause instanceof Error ? cause.message : t('unexpectedError')); }
    finally { setActivityBusy(false); }
  };
  const createRelation = async () => {
    if (!selected || !newRelationTarget) return;
    setActivityBusy(true); setActivityMessage('');
    try {
      await api.createRelation({ materialId, fromConceptId: selected.concept.id, toConceptId: newRelationTarget, relationType: newRelationType, statement: newRelationStatement.trim(), justification: newRelationJustification.trim(), sourceExcerpt: newRelationExcerpt.trim() });
      setRelations(await api.relations(materialId));
      setNewRelationTarget(''); setNewRelationStatement(''); setNewRelationJustification(''); setNewRelationExcerpt('');
      setActivityMessage('Relação guardada com sua fonte.');
    } catch (cause: unknown) { setActivityMessage(cause instanceof Error ? cause.message : t('unexpectedError')); }
    finally { setActivityBusy(false); }
  };

  useRealtimeRefresh((change) => {
    if (change.type === 'material.progress' || change.type === 'material.queued') return
    void api.materials().then(setMaterials).catch(() => {})
    if (materialId) void api.knowledgeMap(materialId).then((data) => {
      setNodes(data)
      setSelectedId((current) => data.some(({ concept }) => concept.id === current) ? current : data[0]?.concept.id ?? '')
    }).catch(() => {})
    if (materialId) { void api.relations(materialId).then(setRelations).catch(() => {}); void api.evidence(materialId).then(setEvidence).catch(() => {}); }
  });

  if (loading && !materials.length) return <LoadingSkeleton variant="map" />;
  if (error) return <section className="empty-state"><h1>{t('mapLoadError')}</h1><p>{error}</p></section>;
  if (!materials.length) return <section className="empty-state"><Icon name="document" /><h1>{t('mapNeedsMaterial')}</h1><p>{t('mapNeedsMaterialDescription')}</p><Link className="exercise-link" href="/estudar">{t('goToStudy')} <Icon name="chevron" /></Link></section>;
  return <>
    <section className="map-hero">
      <div className="map-kicker"><Icon name="sparkles" /> {t('mapKicker')}</div>
      <div className="map-hero-title"><div><h1>{t('mapTitle')}</h1><p>{t('mapDescription')}</p></div><StyledSelect label={t('studiedMaterial')} icon="book" value={materialId} options={materials.map(({ id, title }) => ({ value: id, label: title }))} onValueChange={(id) => { saveActiveMaterialId(id); setMaterialId(id); }} /></div>
      <div className="map-stats"><Stat value={`${validated} / ${nodes.length}`} label={t('conceptsExplained')} tone="green" /><Stat value={review} label={t('reviewPoints')} tone="amber" /><Stat value={`${completion}%`} label={t('explanationProgress')} tone="blue" /><Stat value={available} label={t('available')} tone="neutral" /></div>
    </section>
    <section className="map-legend"><span><i className="explained" />{t('mapExplained')}</span><span><i className="review" />{t('mapReview')}</span><span><i className="ready" />{t('mapReady')}</span><button type="button" aria-pressed={showAllEdges} onClick={() => setShowAllEdges((current) => !current)}>{showAllEdges ? t('essentialRelations') : t('allRelations')}</button><small>{t('mapSelectionHint')}</small></section>
    <section className="map-layout">
      <div className="graph astrolabe" role="region" aria-label={t('interactiveMap')}>
        <div className="graph-hint">{t('selectForDiagnostic')}</div>
        <ReactFlow nodes={flowNodes} edges={flowEdges} fitView nodesDraggable={false} nodesConnectable={false} elementsSelectable nodesFocusable edgesFocusable onNodeClick={(_, node) => { setSelectedId(node.id); setSelectedRelationId(''); }} onEdgeClick={(_, edge) => { if (!edge.id.startsWith('legacy:')) { setSelectedRelationId(edge.id); setActivityType('RELATION'); } }}><Background gap={24} size={1} /><Controls showInteractive={false} /></ReactFlow>
      </div>
      {selectedRelation ? <aside className="inspector"><small>{selectedRelation.relation_type} · {selectedRelation.provenance}</small><h2>{selectedRelation.statement}</h2><section><h3>Justificativa</h3><p>{selectedRelation.justification}</p></section><section><h3>Trecho de origem</h3><p>{selectedRelation.source_excerpt}</p></section><button type="button" onClick={() => { setSelectedRelationId(''); setActivityType('APPLICATION'); }}>Voltar ao conceito</button></aside> : <Inspector node={selected} statusText={statusText} />}
    </section>
    <section className="map-active-section"><h2>Investigar e reconstruir</h2><p>As relações com fonte aparecem em linha contínua. Relações legadas são hipóteses sem justificativa verificada.</p><ul>{relations.map((relation) => <li key={relation.id}><button type="button" onClick={() => { setSelectedRelationId(relation.id); setActivityType('RELATION'); }}>{relation.statement}</button> <small>{relation.relation_type}</small></li>)}</ul><form onSubmit={(event) => { event.preventDefault(); void assess(); }}><label>Atividade<select value={activityType} onChange={(event) => setActivityType(event.target.value === 'RELATION' ? 'RELATION' : event.target.value === 'RETENTION' ? 'RETENTION' : 'APPLICATION')}><option value="APPLICATION">Aplicação</option><option value="RETENTION">Retomada voluntária</option>{selectedRelation && <option value="RELATION">Reconstruir relação</option>}</select></label><p>{activityType === 'RELATION' ? selectedRelation?.statement : selected?.question.text}</p><label>Sua resposta<textarea minLength={20} maxLength={20000} required value={activityAnswer} onChange={(event) => setActivityAnswer(event.target.value)} /></label><label><input type="checkbox" checked={assisted} onChange={(event) => setAssisted(event.target.checked)} /> Usei pistas ou consultei o material</label><button disabled={activityBusy || activityAnswer.trim().length < 20 || (activityType === 'RELATION' && !selectedRelation)}>{activityBusy ? 'Avaliando…' : 'Avaliar resposta'}</button></form><h3>Justificar uma nova ligação</h3><form onSubmit={(event) => { event.preventDefault(); void createRelation(); }}><p>Origem: {selected?.concept.name ?? 'Selecione um conceito'}</p><label>Destino<select required value={newRelationTarget} onChange={(event) => setNewRelationTarget(event.target.value)}><option value="">Selecione</option>{nodes.filter(({ concept }) => concept.id !== selectedId).map(({ concept }) => <option key={concept.id} value={concept.id}>{concept.name}</option>)}</select></label><label>Tipo<select value={newRelationType} onChange={(event) => setNewRelationType(event.target.value as typeof newRelationType)}>{(['REQUIRES','ENABLES','CONTRASTS','APPLIES_TO','PART_OF'] as const).map((type) => <option key={type} value={type}>{type}</option>)}</select></label><label>Proposição<input required minLength={5} maxLength={500} value={newRelationStatement} onChange={(event) => setNewRelationStatement(event.target.value)} /></label><label>Justificativa<textarea required minLength={5} maxLength={1000} value={newRelationJustification} onChange={(event) => setNewRelationJustification(event.target.value)} /></label><label>Trecho exato do material<textarea required value={newRelationExcerpt} onChange={(event) => setNewRelationExcerpt(event.target.value)} /></label><button disabled={activityBusy || !selected}>Guardar relação</button></form>{activityMessage && <p role="status">{activityMessage}</p>}<h3>Histórico de evidências</h3><ul>{evidence.map((event) => <EvidenceRow key={event.id} event={event} locale={locale} onContested={() => { void api.evidence(materialId).then(setEvidence).catch(() => {}); }} />)}</ul></section>
    <section className="map-insights"><article><span>{t('dependencyChain')}</span><h3>{review ? `${review} ${t('needsRefinement')}` : t('noBlindSpots')}</h3><p>{review ? t('reviewDescription') : t('noPendingDiagnostics')}</p></article><article><span>{t('strongFoundations')}</span><h3>{validated ? `${validated} ${t('consolidatedConcepts')}` : t('awaitingValidation')}</h3><p>{t('approvalExplanation')}</p></article><article><span>{t('nextInvestigation')}</span><h3>{selected?.concept.name ?? t('selectConcept')}</h3><p>{selected?.question.text ?? t('selectMapPoint')}</p></article></section>
  </>;
}

function shortLabel(name: string) { return name.length > 22 ? `${name.slice(0, 21)}…` : name; }
function Stat({ value, label, tone }: { value: string | number; label: string; tone: string }) { return <div className={`map-stat ${tone}`}><strong>{value}</strong><span>{label}</span></div>; }

function Inspector({ node, statusText }: { node: KnowledgeNode | null; statusText: (status: KnowledgeNode['status']) => string }) {
  const { t } = useI18n();
  if (!node) return <aside className="inspector"><p>{t('selectMapConcept')}</p></aside>;
  const evaluation = node.lastAttempt?.evaluation;
  const gap = evaluation?.gap ?? evaluation?.logicalBreak ?? evaluation?.missingPremises[0];
  return <aside className="inspector"><small>{t('mapFragment')} · {node.concept.kind}</small><h2>{node.concept.name}</h2><span className={`status-badge ${node.status.toLowerCase()}`}>{statusText(node.status)}</span><section><h3>{t('focusPrinciple')}</h3><p>{node.concept.description}</p></section>{evaluation && <section className="inspector-diagnostic"><h3>{t('latestDiagnostic')}</h3><strong>{t('correctPoint')}</strong><p>{evaluation.strength ?? evaluation.feedback}</p>{evaluation.status !== 'PASSED' && <><strong>{t('missingPoint')}</strong><p>{gap ?? evaluation.feedback}</p></>}<strong>{t('nextStep')}</strong><p>{evaluation.nextAction ?? evaluation.feedback}</p></section>}<section className="next-prompt"><h3>{t('nextMasteryChallenge')}</h3><p>{node.question.text}</p></section><Link className="exercise-link" href={`/estudar?material=${node.concept.materialId}&concept=${node.concept.id}`}>{t('practiceConcept')} <Icon name="chevron" /></Link></aside>;
}

function EvidenceRow({ event, locale, onContested }: { event: LearningEvidence; locale: 'pt-BR' | 'en-US'; onContested: () => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return <li className="evidence-row"><strong>{event.activity_type} · {event.status}</strong><small>{new Date(event.created_at).toLocaleString(locale)} · {event.assisted ? (locale === 'pt-BR' ? 'com ajuda' : 'assisted') : (locale === 'pt-BR' ? 'sem ajuda declarada' : 'no assistance declared')}</small><details><summary>{locale === 'pt-BR' ? 'Resposta, diagnóstico e fonte' : 'Answer, diagnosis and source'}</summary><p>{event.prompt}</p><blockquote>{event.answer}</blockquote><p>{event.diagnosis}</p><blockquote>{event.source_excerpt}</blockquote></details>{event.evidence_contestations?.map((item) => <p key={item.id}>{locale === 'pt-BR' ? 'Contestação' : 'Contest'}: {item.reason}</p>)}{event.status !== 'SELF_REPORTED' && <form onSubmit={(submission) => { submission.preventDefault(); setBusy(true); setError(''); void api.contestEvidence(event.id, reason.trim()).then(() => { setReason(''); onContested(); }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : String(cause))).finally(() => setBusy(false)); }}><label>{locale === 'pt-BR' ? 'Contestar diagnóstico' : 'Contest diagnosis'}<input minLength={5} maxLength={2000} required value={reason} onChange={(change) => setReason(change.target.value)} /></label><button disabled={busy || reason.trim().length < 5}>{locale === 'pt-BR' ? 'Registrar contestação' : 'Record contest'}</button></form>}{error && <p role="alert">{error}</p>}</li>;
}
