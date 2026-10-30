import { afterEach, beforeEach, expect, spyOn, test } from 'bun:test';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { Window } from 'happy-dom';
import { api } from '../../lib/api';
import { I18nProvider } from '../../lib/localization/i18n';
import { GoalEditor } from '../../components/tasks/goal-editor';

beforeEach(() => {
  const window = new Window();
  Object.assign(globalThis, { window, document: window.document, navigator: window.navigator, localStorage: window.localStorage, FormData: window.FormData });
});
afterEach(() => cleanup());

test('an existing goal can be renamed and its deadline removed', async () => {
  const goal = { id: 'goal-a', title: 'Read', description: 'Original', deadline: '2026-11-01T00:00:00.000Z' };
  const update = spyOn(api, 'updateGoal').mockResolvedValue({ ...goal, title: 'Understand', deadline: null });
  try {
    const view = render(<I18nProvider><GoalEditor goal={goal} busy={false} operate={async (action) => { await action(); }} /></I18nProvider>);
    fireEvent.change(view.getByLabelText('Título do objetivo'), { target: { value: 'Understand' } });
    fireEvent.change(view.getByLabelText('Prazo opcional'), { target: { value: '' } });
    fireEvent.click(view.getByRole('button', { name: 'Salvar objetivo' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('goal-a', { title: 'Understand', description: 'Original', deadline: null }));
  } finally {
    update.mockRestore();
  }
});
