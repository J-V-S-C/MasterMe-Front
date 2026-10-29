import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { Window } from 'happy-dom';
import { SessionView } from '../../components/study/live-study';
import type { KnowledgeNode, StudySession } from '../../lib/api';
import { I18nProvider } from '../../lib/localization/i18n';

beforeEach(() => { const window = new Window(); Object.assign(globalThis, { window, document: window.document, navigator: window.navigator }); });
afterEach(() => cleanup());
const node: KnowledgeNode = { concept: { id: 'concept-a', materialId: 'material-a', name: 'Contrato', description: 'Descrição', kind: 'AXIOM', sourceExcerpt: 'Trecho.', fundamentalPremises: ['Premissa'], edgeCases: ['Limite'], generatedLocale: 'pt-BR', prerequisiteIds: [], nextIds: [] }, status: 'EXPLAINED', edgeCaseStatus: 'NOT_REQUESTED', lastAttempt: null, question: { text: 'Como funciona?', targetPremise: 'Premissa', expectedReasoningSteps: ['Explicar'] } };
const session: StudySession = { id: 'session-a', conceptId: 'concept-a', state: 'EXPLANATION_PASSED', question: node.question, edgeCaseStatus: 'NOT_REQUESTED', edgeCaseChallenge: null, attempts: [{ stage: 'INITIAL', answer: 'Resposta', evaluation: { status: 'PASSED', missingPremises: [], logicalBreak: null, feedback: 'Boa explicação.' }, createdAt: '2026-01-01T00:00:00.000Z' }], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };

describe('study interface', () => {
  test('approval offers edge case as an optional action without an automatic textarea', async () => {
    const request = mock(async () => undefined);
    const view = render(<I18nProvider><SessionView session={session} answer="" words={0} onAnswerChange={() => {}} onSubmit={() => {}} selectedNode={node} submitting={false} onRetry={() => {}} error="" onRequestEdgeCase={request} /></I18nProvider>);
    expect(view.queryByPlaceholderText('Explique o seu raciocínio…')).toBeNull();
    fireEvent.click(view.getByText('Testar em um caso-limite'));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  });


});
