import { afterEach, beforeEach, expect, test, spyOn } from 'bun:test';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { Window } from 'happy-dom';
import { api, type MaterialSummary, type StudyPlan } from '../lib/api';
import { I18nProvider } from '../lib/i18n';
import { PlanBuilder } from './plan-builder';

const materials: MaterialSummary[] = [
  { id: 'first', title: 'First source', locale: 'en-US', createdAt: '2026-01-01' },
  { id: 'second', title: 'Second source', locale: 'en-US', createdAt: '2026-01-02' },
];
const plans: StudyPlan[] = [{ id: 'plan', title: 'My plan', goal_id: null, study_plan_materials: [
  { material_id: 'first', ordinal: 0 }, { material_id: 'second', ordinal: 1 },
] }];

beforeEach(() => {
  const window = new Window();
  Object.assign(globalThis, { window, document: window.document, navigator: window.navigator, localStorage: window.localStorage });
});
afterEach(() => { cleanup(); });

test('plan editor persists reordered sources and shows an uncovered goal', async () => {
  const update = spyOn(api, 'updatePlan').mockResolvedValue(plans[0]!);
  const view = render(<I18nProvider><PlanBuilder materials={materials} goals={[{ id: 'goal', title: 'Research', description: '', deadline: null }]} plans={plans} busy={false} operate={async (action) => { await action(); }} /></I18nProvider>);
  const editor = view.getByDisplayValue('My plan').closest('form');
  expect(editor).not.toBeNull();
  fireEvent.click(view.getByRole('button', { name: 'Descer: first' }));
  fireEvent.change(editor!.querySelector('select')!, { target: { value: 'goal' } });
  fireEvent.submit(editor!);
  await waitFor(() => expect(update).toHaveBeenCalledWith('plan', { title: 'My plan', goalId: 'goal', materialIds: ['second', 'first'] }));
  fireEvent.click(view.getByRole('button', { name: 'Retirar: Second source' }));
  fireEvent.click(view.getByRole('button', { name: 'Retirar: First source' }));
  expect(view.getByText(/lacuna no acervo/)).toBeTruthy();
  update.mockRestore();
});
