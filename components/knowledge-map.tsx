"use client";

import { useEffect, useMemo, useState } from "react";
import { api, type KnowledgeNode, type Material } from "../lib/api";
import { Icon } from "../lib/icons";
import { LoadingSkeleton } from "./loading-skeleton";
import { getActiveMaterialId, saveActiveMaterialId } from "../lib/active-material";

const statusText = {
  LOCKED: "Bloqueado",
  READY: "Disponível",
  VALIDATED: "Consolidado",
  REVIEW: "Revisão recomendada",
} as const;

export function KnowledgeMap() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [materialId, setMaterialId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .materials()
      .then((data) => {
        setMaterials(data);
        setMaterialId(getActiveMaterialId(data.map((material) => material.id)) || data[0]?.id || "");
      })
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Erro inesperado."),
      )
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!materialId) return;
    setLoading(true);
    api
      .knowledgeMap(materialId)
      .then((data) => {
        setNodes(data);
        setSelectedId(data[0]?.concept.id ?? "");
      })
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Erro inesperado."),
      )
      .finally(() => setLoading(false));
  }, [materialId]);
  const selected = useMemo(
    () => nodes.find((node) => node.concept.id === selectedId) ?? null,
    [nodes, selectedId],
  );
  const graph = useMemo(() => graphLayout(nodes), [nodes]);
  const validated = nodes.filter((node) => node.status === "VALIDATED").length;
  const review = nodes.filter((node) => node.status === "REVIEW").length;
  const available = nodes.filter((node) => node.status === "READY").length;
  const completion = nodes.length ? Math.round((validated / nodes.length) * 100) : 0;
  const openConcept = (node: KnowledgeNode) => {
    window.location.assign(`/?material=${node.concept.materialId}&concept=${node.concept.id}`);
  };
  if (loading && !materials.length) return <LoadingSkeleton variant="map" />;
  if (error)
    return (
      <section className="empty-state">
        <h1>Não foi possível carregar o mapa</h1>
        <p>
          {error} Verifique se o backend está ativo em{" "}
          <code>localhost:3333</code>.
        </p>
      </section>
    );
  if (!materials.length)
    return (
      <section className="empty-state">
        <Icon name="document" />
        <h1>Seu mapa começa com um material</h1>
        <p>
          Crie um material no Espaço de estudo e extraia seus conceitos para visualizar
          relações e evolução real das sessões.
        </p>
        <a className="exercise-link" href="/">Ir para o Espaço de estudo <Icon name="chevron" /></a>
      </section>
    );
  return (
    <>
      <section className="map-hero">
        <div className="map-kicker"><Icon name="sparkles" /> CONSTELAÇÃO EPISTÊMICA · MAPA DO MATERIAL</div>
        <div className="map-hero-title"><div><h1>Seu domínio conceitual</h1><p>O que foi consolidado pelo diálogo, o que pede revisão e os caminhos ainda velados.</p></div><label>Tratado em vigência<select value={materialId} onChange={(event) => { const id = event.target.value; saveActiveMaterialId(id); setMaterialId(id); }}>{materials.map((material) => <option value={material.id} key={material.id}>{material.title}</option>)}</select></label></div>
        <div className="map-stats">
          <Stat value={`${validated} / ${nodes.length}`} label="Nós verificados" tone="green" />
          <Stat value={review} label="Pontos em alerta" tone="amber" />
          <Stat value={`${completion}%`} label="Retenção epistêmica" tone="blue" />
          <Stat value={available} label="Próximos passos" tone="neutral" />
        </div>
      </section>
      <section className="map-legend"><span><i className="validated" />Dominado</span><span><i className="review" />Revisitar</span><span><i className="ready" />Disponível</span><span><i className="locked" />Trancado</span><small>Selecione um ponto do astrolábio para investigar.</small></section>
      <section className="map-layout">
        <div className="graph astrolabe" aria-label="Grafo de conceitos">
          <div className="graph-hint">
            Selecione um conceito para ver seu diagnóstico
          </div>
          <svg
            viewBox={`0 0 ${graph.width} ${graph.height}`}
            role="img"
            aria-label="Relações entre conceitos"
          >
            {nodes.flatMap((node) =>
              node.concept.nextIds.map((next) => {
                const target = nodes.findIndex(
                  (candidate) => candidate.concept.id === next,
                );
                return target >= 0 ? (
                  <line
                    key={`${node.concept.id}-${next}`}
                    x1={graph.points.get(node.concept.id)?.x}
                    y1={graph.points.get(node.concept.id)?.y}
                    x2={graph.points.get(nodes[target].concept.id)?.x}
                    y2={graph.points.get(nodes[target].concept.id)?.y}
                  />
                ) : null;
              }),
            )}
            {nodes.map((node) => {
              const point = graph.points.get(node.concept.id)!;
              return (
                <g
                  key={node.concept.id}
                  className={`graph-node ${node.status.toLowerCase()} ${selectedId === node.concept.id ? "selected" : ""}`}
                  transform={`translate(${point.x},${point.y})`}
                  onClick={() => openConcept(node)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Abrir ${node.concept.name}`}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") openConcept(node);
                  }}
                >
                  <circle r={node.status === "REVIEW" ? 28 : 23} />
                  <circle className="inner" r="8" />
                  <text y="43"><title>{node.concept.name}</title>{shortLabel(node.concept.name)}</text>
                  <text className="node-status" y="59">
                    {statusText[node.status]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <Inspector node={selected} />
      </section>
      <section className="map-insights">
        <article><span>CADEIA DE DEPENDÊNCIAS</span><h3>{review ? `${review} ponto${review > 1 ? 's' : ''} pede${review > 1 ? 'm' : ''} refinamento` : 'Nenhum ponto cego detectado'}</h3><p>{review ? 'Os conceitos em alerta merecem uma nova explicação antes de servir de base para seus sucessores.' : 'Seu mapa não tem diagnósticos pendentes neste material.'}</p></article>
        <article><span>FUNDAMENTOS FORTES</span><h3>{validated ? `${validated} conceito${validated > 1 ? 's' : ''} consolidado${validated > 1 ? 's' : ''}` : 'Aguardando a primeira validação'}</h3><p>Uma validação exige a explicação inicial e a réplica ao teste de estresse socrático.</p></article>
        <article><span>PRÓXIMA INVESTIGAÇÃO</span><h3>{selected?.concept.name ?? 'Selecione um conceito'}</h3><p>{selected?.question?.text ?? 'Escolha um ponto do mapa para ver sua pergunta específica.'}</p></article>
      </section>
    </>
  );
}
function shortLabel(name: string) {
  return name.length > 22 ? `${name.slice(0, 21)}…` : name;
}

function graphLayout(nodes: KnowledgeNode[]) {
  const byId = new Map(nodes.map((node) => [node.concept.id, node]));
  const levelFor = (node: KnowledgeNode, visiting = new Set<string>()): number => {
    if (visiting.has(node.concept.id)) return 0;
    const prerequisites = node.concept.prerequisiteIds
      .map((id) => byId.get(id))
      .filter((item): item is KnowledgeNode => Boolean(item));
    if (!prerequisites.length) return 0;
    const nextVisiting = new Set(visiting).add(node.concept.id);
    return Math.max(...prerequisites.map((item) => levelFor(item, nextVisiting))) + 1;
  };
  const layers = new Map<number, KnowledgeNode[]>();
  nodes.forEach((node) => {
    const level = levelFor(node);
    layers.set(level, [...(layers.get(level) ?? []), node]);
  });
  const largestLayer = Math.max(1, ...[...layers.values()].map((layer) => layer.length));
  const width = Math.max(760, layers.size * 220 + 140);
  const height = Math.max(520, largestLayer * 118 + 150);
  const points = new Map<string, { x: number; y: number }>();
  [...layers.entries()].sort(([a], [b]) => a - b).forEach(([level, layer]) => {
    layer.forEach((node, index) => points.set(node.concept.id, {
      x: 90 + level * 220,
      y: height / 2 + (index - (layer.length - 1) / 2) * 118,
    }));
  });
  return { points, width, height };
}
function Stat({
  value,
  label,
  tone,
}: {
  value: string | number;
  label: string;
  tone: string;
}) {
  return (
    <div className={`map-stat ${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
function Inspector({ node }: { node: KnowledgeNode | null }) {
  if (!node)
    return (
      <aside className="inspector">
        <p>Selecione um conceito no mapa.</p>
      </aside>
    );
  const gap =
    node.lastAttempt?.evaluation.logicalBreak ??
    node.lastAttempt?.evaluation.missingPremises[0] ??
    "Nenhuma falha registrada até agora.";
  return (
    <aside className="inspector">
      <small>TRATADO · FRAGMENTO {node.concept.kind}</small>
      <h2>{node.concept.name}</h2>
      <span className={`status-badge ${node.status.toLowerCase()}`}>
        {statusText[node.status]}
      </span>
      <section>
        <h3>Princípio em foco</h3>
        <p>{node.concept.description}</p>
      </section>
      <section>
        <h3>Salto de raciocínio detectado</h3>
        <p>{gap}</p>
      </section>
      <section className="next-prompt">
        <h3>Próximo desafio socrático</h3>
        <p>{node.question?.text}</p>
      </section>
      <a className="exercise-link" href={`/?material=${node.concept.materialId}&concept=${node.concept.id}`}>
        {node.status === "LOCKED"
          ? "Pré-requisitos pendentes"
          : "Exercitar este conceito agora"}{" "}
        <Icon name="chevron" />
      </a>
    </aside>
  );
}
