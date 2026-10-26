import { afterEach, beforeEach, expect, test, spyOn } from 'bun:test';
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { Window } from 'happy-dom';
import { api, type StudySuggestion, type StudyTask } from '../../lib/api';
import { LibraryWorkspace, SuggestionEditor } from '../../components/library-workspace';
import { I18nProvider } from '../../lib/i18n';

const suggestion: StudySuggestion = {
  id: 'suggestion', title: 'Retomar a causa', reason: 'A explicação ficou incompleta.',
  status: 'PENDING', task_id: null,
  learning_evidence: { id: 'evidence', material_id: 'material', prompt: 'Explique a causa.', diagnosis: 'A causa não foi explicada.', source_excerpt: 'A causa aparece aqui.', activity_type: 'COMPREHENSION', status: 'INCOMPLETE', created_at: '2026-10-19T00:00:00Z' },
};

beforeEach(() => {
  const window = new Window();
  Object.assign(globalThis, { window, document: window.document, navigator: window.navigator, Node: window.Node, PointerEvent: window.PointerEvent, requestAnimationFrame: window.requestAnimationFrame.bind(window), cancelAnimationFrame: window.cancelAnimationFrame.bind(window) });
});
afterEach(() => { cleanup(); });

const task = (id: string, title: string, status: StudyTask['status'] = 'PENDING', scheduledAt: string | null = null, duration: number | null = null): StudyTask => ({
  id, sort_order: Number(id) || 0, title, activity_type: 'READ', plan_id: null, material_id: null, concept_id: null, unit_id: null,
  duration_minutes: duration, scheduled_at: scheduledAt, status, reason: '',
});

function mockWorkspace(rows: StudyTask[] = []) {
  const materials = spyOn(api, 'materials').mockResolvedValue([]);
  const tasks = spyOn(api, 'tasks').mockResolvedValue(rows);
  const suggestions = spyOn(api, 'suggestions').mockResolvedValue([]);
  return () => { materials.mockRestore(); tasks.mockRestore(); suggestions.mockRestore(); };
}

test('lets the student edit a suggested task before accepting it', async () => {
  const decide = spyOn(api, 'decideSuggestion').mockResolvedValue(suggestion);
  const view = render(<SuggestionEditor suggestion={suggestion} plans={[{ id: 'plan', title: 'Meu roteiro', goal_id: null, study_plan_materials: [] }]} busy={false} operate={async (action) => { await action(); }} locale="pt-BR" labels={{ accept: 'Adicionar ao roteiro', ignore: 'Ignorar' }} />);
  fireEvent.input(view.getByLabelText('Ajuste a tarefa antes de aceitar'), { target: { value: 'Ler outra vez' } });
  fireEvent.input(view.getByLabelText('Duração em minutos'), { target: { value: '40' } });
  fireEvent.change(view.getByLabelText('Roteiro'), { target: { value: 'plan' } });
  fireEvent.click(view.getByRole('button', { name: 'Adicionar ao roteiro' }));
  await waitFor(() => expect(decide).toHaveBeenCalledWith('suggestion', {
    decision: 'ACCEPTED', title: 'Ler outra vez', durationMinutes: 40, scheduledAt: undefined, planId: 'plan',
  }));
  decide.mockRestore();
});

test('creates a task from the visual date and detail controls', async () => {
  const restore = mockWorkspace();
  const create = spyOn(api, 'createTask').mockResolvedValue(task('1', 'Review chapter'));
  const view = render(<I18nProvider><LibraryWorkspace /></I18nProvider>);
  await view.findByRole('heading', { name: 'Tarefas' });
  fireEvent.input(view.getByLabelText('Tarefa'), { target: { value: 'Review chapter' } });
  fireEvent.click(view.getByRole('button', { name: 'Amanhã' }));
  fireEvent.click(view.getByRole('tab', { name: /Detalhes/ }));
  fireEvent.input(view.getByLabelText('Horário'), { target: { value: '14:30' } });
  fireEvent.input(view.getByLabelText('Descrição'), { target: { value: 'Compare the two examples.' } });
  fireEvent.click(view.getByRole('button', { name: '45min' }));
  fireEvent.click(view.getByRole('button', { name: 'Adicionar tarefa' }));
  await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Review chapter', description: 'Compare the two examples.', durationMinutes: 45, scheduledAt: expect.any(String) })));
  expect(new Date(create.mock.calls[0]![0].scheduledAt!).getHours()).toBe(14);
  expect(new Date(create.mock.calls[0]![0].scheduledAt!).getMinutes()).toBe(30);
  restore(); create.mockRestore();
});

test('keeps a selected material and concept after adding a task', async () => {
  const materials = spyOn(api, 'materials').mockResolvedValue([{ id: 'material', title: 'Databases', locale: 'en-US', createdAt: '' }]);
  const tasks = spyOn(api, 'tasks').mockResolvedValue([]);
  const suggestions = spyOn(api, 'suggestions').mockResolvedValue([]);
  const concepts = spyOn(api, 'concepts').mockResolvedValue([{ id: 'concept', materialId: 'material', name: 'Indexes', description: '', kind: 'NODE', sourceExcerpt: '', fundamentalPremises: [], edgeCases: [], prerequisiteIds: [], nextIds: [], generatedLocale: 'en-US' }]);
  const create = spyOn(api, 'createTask').mockResolvedValue(task('1', 'Review indexes'));
  const view = render(<I18nProvider><LibraryWorkspace /></I18nProvider>);
  await view.findByRole('heading', { name: 'Tarefas' });
  fireEvent.click(view.getByRole('tab', { name: /Detalhes/ }));
  fireEvent.click(view.getByRole('combobox', { name: /Material/i }));
  fireEvent.click(view.getByRole('option', { name: 'Databases' }));
  await waitFor(() => expect(view.getByRole('combobox', { name: /Conceito/i }).hasAttribute('disabled')).toBe(false));
  fireEvent.click(view.getByRole('combobox', { name: /Conceito/i }));
  fireEvent.click(view.getByRole('option', { name: 'Indexes' }));
  fireEvent.input(view.getByLabelText('Tarefa'), { target: { value: 'Review indexes' } });
  fireEvent.click(view.getByRole('button', { name: 'Adicionar tarefa' }));
  await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ materialId: 'material', conceptId: 'concept' })));
  expect(view.getByRole('combobox', { name: 'Conceito' }).textContent).toContain('Indexes');
  materials.mockRestore(); tasks.mockRestore(); suggestions.mockRestore(); concepts.mockRestore(); create.mockRestore();
});

test('keeps the card draggable without a separate move control', async () => {
  const restore = mockWorkspace([task('1', 'First'), task('2', 'Second')]);
  const view = render(<I18nProvider><LibraryWorkspace /></I18nProvider>);
  fireEvent.click(await view.findByRole('tab', { name: /Quadro/ }));
  await view.findByText('First');
  const card = view.container.querySelector('#task-1') as HTMLElement;
  expect(card.getAttribute('tabindex')).toBe('0');
  expect(within(card).queryByText('Mover')).toBeNull();
  restore();
});

test('edits a task in its own form without submitting a new task', async () => {
  const restore = mockWorkspace([task('1', 'First', 'PENDING', '2026-10-25T12:00:00Z')]);
  const update = spyOn(api, 'updateTask').mockResolvedValue(task('1', 'Renamed'));
  const create = spyOn(api, 'createTask').mockResolvedValue(task('2', 'Unwanted'));
  const view = render(<I18nProvider><LibraryWorkspace /></I18nProvider>);
  fireEvent.click(await view.findByRole('tab', { name: /Quadro/ }));
  const card = view.container.querySelector('#task-1') as HTMLElement;
  fireEvent.click(within(card).getByRole('button', { name: 'Editar' }));
  const editForm = (await view.findByRole('button', { name: 'Salvar' })).closest('form');
  expect(editForm).toBeTruthy();
  expect(editForm?.parentElement?.closest('form')).toBeNull();
  fireEvent.input(within(editForm!).getByLabelText('Tarefa'), { target: { value: 'Renamed' } });
  fireEvent.input(within(editForm!).getByLabelText('Descrição'), { target: { value: 'Read both sections.' } });
  fireEvent.submit(editForm!);
  await waitFor(() => expect(update).toHaveBeenCalledWith('1', expect.objectContaining({ title: 'Renamed', description: 'Read both sections.' })));
  expect(create).not.toHaveBeenCalled();
  restore(); update.mockRestore(); create.mockRestore();
});

