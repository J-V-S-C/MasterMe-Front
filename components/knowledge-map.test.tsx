import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { Window } from 'happy-dom';
import type { ConceptRelation, KnowledgeNode } from '../lib/api';
import { I18nProvider } from '../lib/i18n';
import { EvidenceRow, KnowledgeMap, focusedGraphNodes, graphLayout, relatedConceptGroups, visibleGraphEdges } from './knowledge-map';

const node = (id: string, name: string, prerequisiteIds: string[] = [], nextIds: string[] = []): KnowledgeNode => ({
  concept: { id, materialId: 'material-a', name, description: `Descrição ${name}`, kind: 'NODE', sourceExcerpt: name, fundamentalPremises: ['p'], edgeCases: ['e'], prerequisiteIds, nextIds, generatedLocale: 'pt-BR' },
  status: 'READY', edgeCaseStatus: 'NOT_REQUESTED', lastAttempt: null,
  question: { text: `Pergunta ${name}`, targetPremise: 'p', expectedReasoningSteps: ['r'] },
});

const originalFetch = globalThis.fetch;
beforeEach(() => {
  const window = new Window();
  class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
  Object.assign(globalThis, { window, document: window.document, navigator: window.navigator, localStorage: window.localStorage, ResizeObserver: ResizeObserverStub, requestAnimationFrame: (callback: FrameRequestCallback) => setTimeout(() => callback(Date.now()), 0), cancelAnimationFrame: (id: number) => clearTimeout(id) });
});
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });

describe('Knowledge map', () => {
  test('removes transitive edges to reduce crossings', () => {
    const nodes = [node('a', 'A', [], ['b', 'c']), node('b', 'B', ['a'], ['c']), node('c', 'C', ['a', 'b'])];
    expect(visibleGraphEdges(nodes)).toEqual([{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }]);
    expect(visibleGraphEdges(nodes, true)).toHaveLength(3);
  });

  test('keeps the selected concept and its verified neighbor visible in a dense map', () => {
    const nodes = Array.from({ length: 20 }, (_, index) => node(String(index), `Concept ${index}`));
    const relations: ConceptRelation[] = [{ id: 'relation', material_id: 'material-a', from_concept_id: '19', to_concept_id: '0', relation_type: 'ENABLES', statement: 'Connection', justification: 'Because', source_excerpt: 'Source', provenance: 'EXTRACTED' }];
    const focused = focusedGraphNodes(nodes, relations, '19', false).map(({ concept }) => concept.id);
    expect(focused).toHaveLength(12);
    expect(focused[0]).toBe('19');
    expect(focused).toContain('0');
    expect(focusedGraphNodes(nodes, relations, '19', true)).toHaveLength(20);
  });

  test('groups only concepts connected by verified relations', () => {
    const nodes = [node('a', 'A'), node('b', 'B'), node('c', 'C'), node('d', 'D')];
    const relations: ConceptRelation[] = [
      { id: 'ab', material_id: 'material-a', from_concept_id: 'a', to_concept_id: 'b', relation_type: 'ENABLES', statement: 'A enables B', justification: 'Source', source_excerpt: 'Source', provenance: 'EXTRACTED' },
      { id: 'bc', material_id: 'material-a', from_concept_id: 'b', to_concept_id: 'c', relation_type: 'ENABLES', statement: 'B enables C', justification: 'Source', source_excerpt: 'Source', provenance: 'EXTRACTED' },
    ];
    const groups = relatedConceptGroups(nodes, relations);
    expect(groups.connected.map((group) => group.map(({ concept }) => concept.id))).toEqual([['a', 'b', 'c']]);
    expect(groups.unlinked.map(({ concept }) => concept.id)).toEqual(['d']);
  });

  test('places many disconnected concepts in a compact grid', () => {
    const nodes = Array.from({ length: 20 }, (_, index) => node(String(index), `Concept ${index}`));
    const layout = graphLayout(nodes);
    expect(layout.height).toBeLessThan(1000);
    expect(new Set([...layout.points.values()].map(({ x, y }) => `${x}:${y}`)).size).toBe(20);
  });

  test('selects a node and updates its diagnosis without navigation', async () => {
    const nodes = [node('a', 'Raiz', [], ['b']), node('b', 'Filho', ['a'])];
    globalThis.fetch = (async (url: string) => new Response(JSON.stringify({ data: url.endsWith('/materials') ? [{ id: 'material-a', title: 'Material', content: 'Texto', locale: 'pt-BR', createdAt: '2026-01-01T00:00:00.000Z' }] : url.endsWith('/relations') || url.endsWith('/evidence') ? [] : nodes }), { status: 200 })) as typeof fetch;
    const view = render(<I18nProvider><KnowledgeMap /></I18nProvider>);
    const child = await view.findByLabelText('Selecionar conceito Filho');
    const locationBeforeSelection = window.location.href;
    fireEvent.click(child);
    await waitFor(() => expect(view.getByRole('heading', { name: 'Filho', level: 2 })).toBeTruthy());
    expect(window.location.href).toBe(locationBeforeSelection);
  });

  test('lets the student request a revisit from an earlier attempt without creating a task', async () => {
    const paths: string[] = [];
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      paths.push(`${init?.method ?? 'GET'} ${new URL(url, 'http://localhost').pathname}`);
      return new Response(JSON.stringify({ data: { id: 'suggestion-a', status: 'PENDING' } }), { status: 200 });
    }) as typeof fetch;
    const view = render(<ul><EvidenceRow event={{ id: 'event-a', material_id: 'material-a', concept_id: 'concept-a', relation_id: null, previous_evidence_id: null, activity_type: 'RETENTION', status: 'PASSED', prompt: 'Explique', prompt_version: 'activity-v1', criteria: ['Causa'], hints_used: [], answer: 'Resposta', assisted: false, diagnosis: 'Correto', source_excerpt: 'Texto', created_at: '2026-01-01T00:00:00.000Z' }} locale="pt-BR" onContested={() => {}} /></ul>);
    expect(view.getByText(/Critérios desta tentativa/).textContent).toContain('Causa');
    const request = view.getByRole('button', { name: 'Solicitar retomada' });
    fireEvent.click(request);
    await waitFor(() => expect(view.getByText(/Sugestão pronta na Mesa do Dia/)).toBeTruthy());
    expect(paths).toContain('POST /api/learning/evidence/event-a/revisit');
    expect(paths.some((path) => path.includes('/tasks'))).toBe(false);
  });
});
