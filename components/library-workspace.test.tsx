import { afterEach, beforeEach, expect, test, spyOn } from 'bun:test';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { Window } from 'happy-dom';
import { api, type StudySuggestion } from '../lib/api';
import { SuggestionEditor } from './library-workspace';

const suggestion: StudySuggestion = {
  id: 'suggestion', title: 'Retomar a causa', reason: 'A explicação ficou incompleta.',
  status: 'PENDING', task_id: null,
  learning_evidence: { id: 'evidence', material_id: 'material', prompt: 'Explique a causa.', diagnosis: 'A causa não foi explicada.', source_excerpt: 'A causa aparece aqui.', activity_type: 'COMPREHENSION', status: 'INCOMPLETE', created_at: '2026-10-19T00:00:00Z' },
};

beforeEach(() => {
  const window = new Window();
  Object.assign(globalThis, { window, document: window.document, navigator: window.navigator });
});
afterEach(() => { cleanup(); });

test('lets the student edit a suggested task before accepting it', async () => {
  const decide = spyOn(api, 'decideSuggestion').mockResolvedValue(suggestion);
  const view = render(<SuggestionEditor suggestion={suggestion} plans={[{ id: 'plan', title: 'Meu roteiro', goal_id: null, study_plan_materials: [] }]} busy={false} operate={async (action) => { await action(); }} locale="pt-BR" labels={{ accept: 'Adicionar ao roteiro', ignore: 'Ignorar' }} />);
  fireEvent.input(view.getByLabelText('Ajuste a tarefa antes de aceitar'), { target: { value: 'Ler outra vez' } });
  fireEvent.input(view.getByLabelText('Duração em minutos'), { target: { value: '40' } });
  fireEvent.change(view.getByLabelText('Roteiro'), { target: { value: 'plan' } });
  fireEvent.click(view.getByRole('button', { name: 'Adicionar ao roteiro' }));
  await waitFor(() => expect(decide).toHaveBeenCalledWith('suggestion', {
    decision: 'ACCEPTED', title: 'Ler outra vez', durationMinutes: 40,
    scheduledAt: undefined, planId: 'plan',
  }));
  decide.mockRestore();
});
