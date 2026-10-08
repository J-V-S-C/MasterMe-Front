import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { Window } from 'happy-dom';
import type { KnowledgeNode } from '../lib/api';
import { I18nProvider } from '../lib/i18n';
import { KnowledgeMap, visibleGraphEdges } from './knowledge-map';

const node = (id: string, name: string, prerequisiteIds: string[] = [], nextIds: string[] = []): KnowledgeNode => ({
  concept: { id, materialId: 'material-a', name, description: `Descrição ${name}`, kind: 'NODE', sourceExcerpt: name, fundamentalPremises: ['p'], edgeCases: ['e'], prerequisiteIds, nextIds, generatedLocale: 'pt-BR' },
  status: 'READY', edgeCaseStatus: 'NOT_REQUESTED', lastAttempt: null,
  question: { text: `Pergunta ${name}`, targetPremise: 'p', expectedReasoningSteps: ['r'] },
});

const originalFetch = globalThis.fetch;
beforeEach(() => {
  const window = new Window();
  Object.assign(globalThis, { window, document: window.document, navigator: window.navigator, localStorage: window.localStorage });
});
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });

describe('Mapa do conhecimento', () => {
  test('remove arestas transitivas para reduzir cruzamentos', () => {
    const nodes = [node('a', 'A', [], ['b', 'c']), node('b', 'B', ['a'], ['c']), node('c', 'C', ['a', 'b'])];
    expect(visibleGraphEdges(nodes)).toEqual([{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }]);
    expect(visibleGraphEdges(nodes, true)).toHaveLength(3);
  });

  test('seleciona o nó e atualiza o diagnóstico sem navegar', async () => {
    const nodes = [node('a', 'Raiz', [], ['b']), node('b', 'Filho', ['a'])];
    globalThis.fetch = (async (url: string) => new Response(JSON.stringify({ data: url.endsWith('/materials') ? [{ id: 'material-a', title: 'Material', content: 'Texto', locale: 'pt-BR', createdAt: '2026-01-01T00:00:00.000Z' }] : nodes }), { status: 200 })) as typeof fetch;
    const view = render(<I18nProvider><KnowledgeMap /></I18nProvider>);
    const child = await view.findByLabelText('Selecionar conceito Filho');
    const locationBeforeSelection = window.location.href;
    fireEvent.click(child);
    await waitFor(() => expect(view.getByRole('heading', { name: 'Filho', level: 2 })).toBeTruthy());
    expect(window.location.href).toBe(locationBeforeSelection);
  });
});
