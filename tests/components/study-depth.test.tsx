import { afterEach, beforeEach, expect, spyOn, test } from 'bun:test';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { Window } from 'happy-dom';
import { StudyDepth } from '../../components/study/study-depth';
import { BillingProvider } from '../../components/providers/billing-provider';
import { api, type KnowledgeNode, type LearningEvidence } from '../../lib/api';
import { I18nProvider } from '../../lib/localization/i18n';

beforeEach(() => {
  const window = new Window();
  Object.assign(globalThis, {
    window,
    document: window.document,
    navigator: window.navigator,
    requestAnimationFrame: window.requestAnimationFrame.bind(window),
    cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
  });
});
afterEach(() => cleanup());

const node: KnowledgeNode = {
  concept: {
    id: 'concept-a', materialId: 'material-a', name: 'Index', description: 'An index accelerates lookup.', kind: 'NODE',
    sourceExcerpt: 'The index maps keys to rows.', fundamentalPremises: ['Keys are ordered.'], edgeCases: ['Writes become slower.'],
    generatedLocale: 'pt-BR', prerequisiteIds: [], nextIds: [],
  },
  status: 'EXPLAINED', edgeCaseStatus: 'NOT_REQUESTED', lastAttempt: null,
  question: { text: 'Como funciona?', targetPremise: 'Premissa', expectedReasoningSteps: ['Explicar'] },
};

const evidence: LearningEvidence = {
  id: 'evidence-a', material_id: 'material-a', concept_id: 'concept-a', relation_id: null, previous_evidence_id: null,
  activity_type: 'RETENTION', prompt: 'Explique o índice.', prompt_version: 'activity-v3', criteria: ['Mecanismo'],
  hints_used: ['cue', 'source'], answer: 'O índice ordena chaves e reduz a busca.', status: 'PASSED', assisted: true,
  assistance_level: 2, solution_revealed: false, diagnosis: 'Bom.', strength: 'Mecanismo correto.', gap: null,
  next_action: 'Explique o custo de escrita.', evidence_quote: 'reduz a busca', source_excerpt: 'The index maps keys to rows.',
  created_at: '2026-10-19T00:00:00.000Z',
};

test('records opened explanation and source as assisted during a review', async () => {
  const prompts = spyOn(api, 'activityPrompts').mockResolvedValue({ reasoning: 'Raciocine.', application: 'Aplique.', retention: 'Explique o índice.' });
  const evaluate = spyOn(api, 'evaluateActivity').mockResolvedValue({ event: evidence, suggestion: null });
  const billing = spyOn(api, 'billingMe').mockResolvedValue({} as never);
  const view = render(<I18nProvider><BillingProvider><StudyDepth node={node} activity="RETENTION" reviewId="review-a" conceptHelpOpened sourceOpened /></BillingProvider></I18nProvider>);
  await waitFor(() => expect(view.getByText('Explique o índice.')).toBeTruthy());
  fireEvent.input(view.getByRole('textbox', { name: 'Sua resposta' }), { target: { value: 'O índice ordena chaves e reduz a busca no disco.' } });
  await waitFor(() => expect((view.getByRole('button', { name: 'Avaliar resposta' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(view.getByRole('button', { name: 'Avaliar resposta' }));
  await waitFor(() => expect(evaluate).toHaveBeenCalledWith(expect.objectContaining({
    reviewId: 'review-a', assisted: true, assistanceLevel: 3, hintsUsed: ['concept-summary', 'source-excerpt'], solutionRevealed: false,
  })));
  prompts.mockRestore(); evaluate.mockRestore(); billing.mockRestore();
});

test('a retry requests a different server prompt and keeps the previous attempt link', async () => {
  const prompts = spyOn(api, 'activityPrompts').mockImplementation(async (_id, variant = 0) => ({ reasoning: 'Raciocine.', application: variant ? 'Aplique em outro caso.' : 'Aplique.', retention: 'Retome.' }));
  const evaluate = spyOn(api, 'evaluateActivity').mockResolvedValue({ event: { ...evidence, status: 'INCOMPLETE', activity_type: 'APPLICATION', assisted: false, hints_used: [], assistance_level: 0 }, suggestion: null });
  const billing = spyOn(api, 'billingMe').mockResolvedValue({} as never);
  const view = render(<I18nProvider><BillingProvider><StudyDepth node={node} activity="APPLICATION" /></BillingProvider></I18nProvider>);
  await waitFor(() => expect(view.getByText('Aplique.')).toBeTruthy());
  fireEvent.input(view.getByRole('textbox', { name: 'Sua resposta' }), { target: { value: 'O índice permite localizar uma linha pelo valor da chave.' } });
  fireEvent.click(view.getByRole('button', { name: 'Avaliar resposta' }));
  await waitFor(() => expect(view.getByRole('button', { name: 'Tentar outra resposta' })).toBeTruthy());
  fireEvent.click(view.getByRole('button', { name: 'Tentar outra resposta' }));
  await waitFor(() => expect(view.getByText('Aplique em outro caso.')).toBeTruthy());
  expect(prompts).toHaveBeenCalledWith('concept-a', 1);
  prompts.mockRestore(); evaluate.mockRestore(); billing.mockRestore();
});
