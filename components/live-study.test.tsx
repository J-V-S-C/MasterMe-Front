import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { Window } from 'happy-dom';
import { SessionView } from './live-study';
import type { KnowledgeNode, StudySession } from '../lib/api';
import { I18nProvider } from '../lib/i18n';

beforeEach(() => { const window = new Window(); Object.assign(globalThis, { window, document: window.document, navigator: window.navigator }); });
afterEach(() => cleanup());
const node: KnowledgeNode = { concept: { id: 'concept-a', materialId: 'material-a', name: 'Contrato', description: 'Descrição', kind: 'AXIOM', sourceExcerpt: 'Trecho.', fundamentalPremises: ['Premissa'], edgeCases: ['Limite'], generatedLocale: 'pt-BR', prerequisiteIds: [], nextIds: [] }, status: 'EXPLAINED', edgeCaseStatus: 'NOT_REQUESTED', lastAttempt: null, question: { text: 'Como funciona?', targetPremise: 'Premissa', expectedReasoningSteps: ['Explicar'] } };
const session: StudySession = { id: 'session-a', conceptId: 'concept-a', state: 'EXPLANATION_PASSED', question: node.question, edgeCaseStatus: 'NOT_REQUESTED', edgeCaseChallenge: null, attempts: [{ stage: 'INITIAL', answer: 'Resposta', evaluation: { status: 'PASSED', missingPremises: [], logicalBreak: null, feedback: 'Boa explicação.' }, createdAt: '2026-01-01T00:00:00.000Z' }], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };

describe('interface de estudo', () => {
  test('exibe o contexto do conceito logo abaixo da pergunta', () => {
    const active = { ...session, state: 'QUESTION_READY' as const, attempts: [] };
    const view = render(<I18nProvider><SessionView session={active} answer="" words={0} onAnswerChange={() => {}} onSubmit={() => {}} selectedNode={node} submitting={false} onRetry={() => {}} error="" onRequestEdgeCase={async () => {}} /></I18nProvider>);
    const text = view.container.querySelector('.prompt-card')?.textContent ?? '';
    expect(text.indexOf('Como funciona?')).toBeLessThan(text.indexOf('Contexto do conceito'));
    expect(text.indexOf('Contexto do conceito')).toBeLessThan(text.indexOf('Descrição'));
  });

  test('aprovação mostra caso-limite como ação opcional sem textarea automático', async () => {
    const request = mock(async () => undefined);
    const view = render(<I18nProvider><SessionView session={session} answer="" words={0} onAnswerChange={() => {}} onSubmit={() => {}} selectedNode={node} submitting={false} onRetry={() => {}} error="" onRequestEdgeCase={request} /></I18nProvider>);
    expect(view.getByText('Explicação concluída')).toBeTruthy();
    expect(view.queryByPlaceholderText('Explique o seu raciocínio…')).toBeNull();
    fireEvent.click(view.getByText('Testar em um caso-limite'));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  });

  test('caso solicitado possui resposta separada', () => {
    const view = render(<I18nProvider><SessionView session={{ ...session, edgeCaseStatus: 'READY', edgeCaseChallenge: { scenario: 'Não existe variação.', edgeCaseTested: 'Abstração prematura', question: 'Quando o contrato não compensa?' } }} answer="" words={0} onAnswerChange={() => {}} onSubmit={() => {}} selectedNode={node} submitting={false} onRetry={() => {}} error="" onRequestEdgeCase={async () => {}} /></I18nProvider>);
    expect(view.getAllByText('Teste de caso-limite')).toHaveLength(2);
    expect(view.getAllByText('Quando o contrato não compensa?')).toHaveLength(2);
    expect(view.getByPlaceholderText('Explique o seu raciocínio…')).toBeTruthy();
  });
});
