import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { Window } from 'happy-dom';
import { SessionView } from './live-study';
import type { KnowledgeNode, StudySession } from '../lib/api';

beforeEach(() => { const window = new Window(); Object.assign(globalThis, { window, document: window.document, navigator: window.navigator }); });
afterEach(() => cleanup());
const node: KnowledgeNode = { concept: { id: 'concept-a', materialId: 'material-a', name: 'Contrato', description: 'Descrição', kind: 'AXIOM', sourceExcerpt: 'Trecho.', fundamentalPremises: ['Premissa'], edgeCases: ['Limite'], prerequisiteIds: [], nextIds: [] }, status: 'EXPLAINED', edgeCaseStatus: 'NOT_REQUESTED', lastAttempt: null, question: { text: 'Como funciona?', targetPremise: 'Premissa', expectedReasoningSteps: ['Explicar'] } };
const session: StudySession = { id: 'session-a', conceptId: 'concept-a', state: 'EXPLANATION_PASSED', question: node.question, edgeCaseStatus: 'NOT_REQUESTED', edgeCaseChallenge: null, attempts: [{ stage: 'INITIAL', answer: 'Resposta', evaluation: { status: 'PASSED', missingPremises: [], logicalBreak: null, feedback: 'Boa explicação.' }, createdAt: '2026-01-01T00:00:00.000Z' }], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };

describe('interface de estudo', () => {
  test('aprovação mostra caso-limite como ação opcional sem textarea automático', async () => {
    const request = mock(async () => undefined);
    const view = render(<SessionView session={session} answer="" words={0} onAnswerChange={() => {}} onSubmit={() => {}} selectedNode={node} submitting={false} onRetry={() => {}} error="" onRequestEdgeCase={request} />);
    expect(view.getByText('Explicação concluída')).toBeTruthy();
    expect(view.queryByPlaceholderText('Explique o seu raciocínio…')).toBeNull();
    fireEvent.click(view.getByText('Testar em um caso-limite'));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  });

  test('caso solicitado possui resposta separada', () => {
    const view = render(<SessionView session={{ ...session, edgeCaseStatus: 'READY', edgeCaseChallenge: { scenario: 'Não existe variação.', edgeCaseTested: 'Abstração prematura', question: 'Quando o contrato não compensa?' } }} answer="" words={0} onAnswerChange={() => {}} onSubmit={() => {}} selectedNode={node} submitting={false} onRetry={() => {}} error="" onRequestEdgeCase={async () => {}} />);
    expect(view.getByText('Teste de caso-limite')).toBeTruthy();
    expect(view.getAllByText('Quando o contrato não compensa?')).toHaveLength(2);
    expect(view.getByPlaceholderText('Explique o seu raciocínio…')).toBeTruthy();
  });
});
