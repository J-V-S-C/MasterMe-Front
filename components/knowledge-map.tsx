"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, type KnowledgeNode, type Material } from "../lib/api";
import { Icon } from "../lib/icons";
import { useI18n } from "../lib/i18n";
import { LoadingSkeleton } from "./loading-skeleton";
import { StyledSelect } from "./styled-select";
import { getActiveMaterialId, saveActiveMaterialId } from "../lib/active-material";

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
  const { t } = useI18n();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [materialId, setMaterialId] = useState("");
  const [selectedId, setSelectedId] = useState("");
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
    api.knowledgeMap(materialId).then((data) => { setNodes(data); setSelectedId(data[0]?.concept.id ?? ""); })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : t('unexpectedError'))).finally(() => setLoading(false));
  }, [materialId, t]);
  const selected = useMemo(() => nodes.find(({ concept }) => concept.id === selectedId) ?? null, [nodes, selectedId]);
  const graph = useMemo(() => graphLayout(nodes), [nodes]);
  const edges = useMemo(() => visibleGraphEdges(nodes, showAllEdges), [nodes, showAllEdges]);
  const adjacent = useMemo(() => new Set(selected ? [selected.concept.id, ...selected.concept.prerequisiteIds, ...selected.concept.nextIds] : []), [selected]);
  const validated = nodes.filter(({ status }) => status === "EXPLAINED").length;
  const review = nodes.filter(({ status }) => status === "REVIEW").length;
  const available = nodes.filter(({ status }) => status === "READY").length;
  const completion = nodes.length ? Math.round((validated / nodes.length) * 100) : 0;
  const statusText = (status: KnowledgeNode['status']) => status === 'EXPLAINED' ? t('mapExplained') : status === 'REVIEW' ? t('mapReview') : t('mapReady');

  if (loading && !materials.length) return <LoadingSkeleton variant="map" />;
  if (error) return <section className="empty-state"><h1>{t('mapLoadError')}</h1><p>{error}</p></section>;
  if (!materials.length) return <section className="empty-state"><Icon name="document" /><h1>{t('mapNeedsMaterial')}</h1><p>{t('mapNeedsMaterialDescription')}</p><Link className="exercise-link" href="/">{t('goToStudy')} <Icon name="chevron" /></Link></section>;
  return <>
    <section className="map-hero">
      <div className="map-kicker"><Icon name="sparkles" /> {t('mapKicker')}</div>
      <div className="map-hero-title"><div><h1>{t('mapTitle')}</h1><p>{t('mapDescription')}</p></div><StyledSelect label={t('studiedMaterial')} icon="book" value={materialId} options={materials.map(({ id, title }) => ({ value: id, label: title }))} onValueChange={(id) => { saveActiveMaterialId(id); setMaterialId(id); }} /></div>
      <div className="map-stats"><Stat value={`${validated} / ${nodes.length}`} label={t('conceptsExplained')} tone="green" /><Stat value={review} label={t('reviewPoints')} tone="amber" /><Stat value={`${completion}%`} label={t('explanationProgress')} tone="blue" /><Stat value={available} label={t('available')} tone="neutral" /></div>
    </section>
    <section className="map-legend"><span><i className="explained" />{t('mapExplained')}</span><span><i className="review" />{t('mapReview')}</span><span><i className="ready" />{t('mapReady')}</span><button type="button" aria-pressed={showAllEdges} onClick={() => setShowAllEdges((current) => !current)}>{showAllEdges ? t('essentialRelations') : t('allRelations')}</button><small>{t('mapSelectionHint')}</small></section>
    <section className="map-layout">
      <div className="graph astrolabe" role="region" tabIndex={0} aria-label={t('interactiveMap')}>
        <div className="graph-hint">{t('selectForDiagnostic')}</div>
        <svg viewBox={`0 0 ${graph.width} ${graph.height}`} role="img" aria-label={t('conceptRelations')}>
          {edges.map((edge) => {
            const from = graph.points.get(edge.source); const to = graph.points.get(edge.target);
            if (!from || !to) return null;
            const active = !selected || edge.source === selectedId || edge.target === selectedId;
            const bend = Math.max(50, (to.x - from.x) * .45);
            return <path key={`${edge.source}-${edge.target}`} className={active ? 'active' : 'dimmed'} d={`M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x} ${to.y}`} />;
          })}
          {nodes.map((node) => {
            const point = graph.points.get(node.concept.id)!;
            const dimmed = selected && !adjacent.has(node.concept.id);
            return <g key={node.concept.id} className={`graph-node ${node.status.toLowerCase()} ${selectedId === node.concept.id ? "selected" : ""} ${dimmed ? 'dimmed' : ''}`} transform={`translate(${point.x},${point.y})`} onClick={() => setSelectedId(node.concept.id)} tabIndex={0} role="button" aria-label={`${t('selectConcept')} ${node.concept.name}`} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(node.concept.id); } }}><circle r={node.status === "REVIEW" ? 28 : 23} /><circle className="inner" r="8" /><text y="43"><title>{node.concept.name}</title>{shortLabel(node.concept.name)}</text><text className="node-status" y="59">{statusText(node.status)}</text></g>;
          })}
        </svg>
      </div>
      <Inspector node={selected} statusText={statusText} />
    </section>
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
  return <aside className="inspector"><small>{t('mapFragment')} · {node.concept.kind}</small><h2>{node.concept.name}</h2><span className={`status-badge ${node.status.toLowerCase()}`}>{statusText(node.status)}</span><section><h3>{t('focusPrinciple')}</h3><p>{node.concept.description}</p></section>{evaluation && <section className="inspector-diagnostic"><h3>{t('latestDiagnostic')}</h3><strong>{t('correctPoint')}</strong><p>{evaluation.strength ?? evaluation.feedback}</p>{evaluation.status !== 'PASSED' && <><strong>{t('missingPoint')}</strong><p>{gap ?? evaluation.feedback}</p></>}<strong>{t('nextStep')}</strong><p>{evaluation.nextAction ?? evaluation.feedback}</p></section>}<section className="next-prompt"><h3>{t('nextMasteryChallenge')}</h3><p>{node.question.text}</p></section><Link className="exercise-link" href={`/?material=${node.concept.materialId}&concept=${node.concept.id}`}>{t('practiceConcept')} <Icon name="chevron" /></Link></aside>;
}
