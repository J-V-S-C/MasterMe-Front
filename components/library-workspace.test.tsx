import { afterEach, beforeEach, expect, test, spyOn } from 'bun:test';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { Window } from 'happy-dom';
import { api, type StudySuggestion } from '../lib/api';
import { LibraryWorkspace, SuggestionEditor } from './library-workspace';
import { I18nProvider } from '../lib/i18n';

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

test('creates a dated task and keeps the task list free of raw source text', async () => {
  const materials = spyOn(api, 'materials').mockResolvedValue([]);
  const tasks = spyOn(api, 'tasks').mockResolvedValue([]);
  const suggestions = spyOn(api, 'suggestions').mockResolvedValue([]);
  const create = spyOn(api, 'createTask').mockResolvedValue({ id: 'new', sort_order: 0, title: 'Review chapter', activity_type: 'READ', plan_id: null, material_id: null, concept_id: null, unit_id: null, duration_minutes: null, scheduled_at: null, status: 'PENDING', reason: '' });
  const { LibraryWorkspace } = await import('./library-workspace');
  const view = render(<I18nProvider><LibraryWorkspace /></I18nProvider>);
  await view.findByRole('heading', { name: 'Suas tarefas de estudo' });
  fireEvent.input(view.getByLabelText('Tarefa'), { target: { value: 'Review chapter' } });
  fireEvent.input(view.getByLabelText('Data para concluir'), { target: { value: '2026-10-25' } });
  expect((view.getByLabelText('Tarefa') as HTMLInputElement).value).toBe('Review chapter');
  expect((view.getByLabelText('Data para concluir') as HTMLInputElement).value).toBe('2026-10-25');
  fireEvent.submit(view.getByRole('button', { name: 'Adicionar tarefa' }).closest('form')!);
  await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Review chapter', activityType: 'READ', scheduledAt: expect.any(String) })));
  expect(view.queryByText('Shelves')).toBeNull();
  materials.mockRestore(); tasks.mockRestore(); suggestions.mockRestore(); create.mockRestore();
});

test('shows planned dates and lets a task be completed', async () => {
  const materials = spyOn(api, 'materials').mockResolvedValue([]);
  const task = { id: 'existing', sort_order: 0, title: 'Read chapter', activity_type: 'READ' as const, plan_id: null, material_id: null, concept_id: null, unit_id: null, duration_minutes: null, scheduled_at: '2026-10-25T12:00:00.000Z', status: 'PENDING' as const, reason: '' };
  const tasks = spyOn(api, 'tasks').mockResolvedValue([task]);
  const suggestions = spyOn(api, 'suggestions').mockResolvedValue([]);
  const update = spyOn(api, 'updateTask').mockResolvedValue({ ...task, status: 'DONE' });
  const { LibraryWorkspace } = await import('./library-workspace');
  const view = render(<I18nProvider><LibraryWorkspace /></I18nProvider>);
  await view.findAllByText('Read chapter');
  expect(view.container.querySelector('time')?.getAttribute('dateTime')).toBe(task.scheduled_at);
  fireEvent.click(view.getByRole('button', { name: 'Concluir' }));
  await waitFor(() => expect(update).toHaveBeenCalledWith('existing', { status: 'DONE' }));
  materials.mockRestore(); tasks.mockRestore(); suggestions.mockRestore(); update.mockRestore();
});

test('calendar has no redundant day summary and the task date remains editable', async () => {
  const materials = spyOn(api, 'materials').mockResolvedValue([]);
  const tasks = spyOn(api, 'tasks').mockResolvedValue([]);
  const suggestions = spyOn(api, 'suggestions').mockResolvedValue([]);
  const { LibraryWorkspace } = await import('./library-workspace');
  const view = render(<I18nProvider><LibraryWorkspace /></I18nProvider>);
  await view.findByRole('heading', { name: 'Suas tarefas de estudo' });
  fireEvent.input(view.getByLabelText('Data para concluir'), { target: { value: '2026-10-25' } });
  await waitFor(() => expect((view.getByLabelText('Data para concluir') as HTMLInputElement).value).toBe('2026-10-25'));
  expect(view.queryByText('Neste dia')).toBeNull();
  materials.mockRestore(); tasks.mockRestore(); suggestions.mockRestore();
});

test('completed tasks are reachable from the visible list switch', async () => {
  const materials = spyOn(api, 'materials').mockResolvedValue([]);
  const completed = { id: 'done', sort_order: 0, title: 'Explain atomicity', activity_type: 'READ' as const, plan_id: null, material_id: null, concept_id: null, unit_id: null, duration_minutes: null, scheduled_at: '2026-10-20T12:00:00.000Z', status: 'DONE' as const, reason: '' };
  const tasks = spyOn(api, 'tasks').mockResolvedValue([completed]);
  const suggestions = spyOn(api, 'suggestions').mockResolvedValue([]);
  const view = render(<I18nProvider><LibraryWorkspace /></I18nProvider>);
  const completedSwitch = await view.findByRole('button', { name: 'Concluídas 1' });
  expect(completedSwitch.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(completedSwitch);
  expect(completedSwitch.getAttribute('aria-pressed')).toBe('true');
  expect(view.getByText('Explain atomicity')).toBeTruthy();
  expect(view.getByRole('button', { name: 'Reabrir' })).toBeTruthy();
  materials.mockRestore(); tasks.mockRestore(); suggestions.mockRestore();
});
