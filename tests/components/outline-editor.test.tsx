import { afterEach, beforeEach, expect, spyOn, test } from 'bun:test';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { Window } from 'happy-dom';
import { OutlineEditor } from '../../components/study/outline-editor';
import { api, type EditorialUnit } from '../../lib/api';
import { I18nProvider } from '../../lib/localization/i18n';

beforeEach(() => {
  const window = new Window();
  Object.assign(globalThis, { window, document: window.document, navigator: window.navigator, requestAnimationFrame: window.requestAnimationFrame.bind(window) });
});
afterEach(() => cleanup());

const units: EditorialUnit[] = [
  { id: 'first', order: 0, title: 'Chapter 1', originalTitle: 'Chapter 1', level: 1, startOffset: 0, endOffset: 100, provenance: 'HEADING', pageNumber: 1 },
  { id: 'second', order: 1, title: 'Chapter 2', originalTitle: 'Chapter 2', level: 1, startOffset: 100, endOffset: 200, provenance: 'HEADING', pageNumber: 5 },
];

test('saves a corrected outline using the observed revision and stable unit IDs', async () => {
  const load = spyOn(api, 'outlineState').mockResolvedValue({ revision: 2, units });
  const save = spyOn(api, 'updateOutline').mockResolvedValue({ revision: 3, units: [units[1]!, units[0]!] });
  const view = render(<I18nProvider><OutlineEditor materialId="material" content={'A'.repeat(200)} outline={units} onSaved={() => {}} /></I18nProvider>);
  fireEvent.click(view.getByText('Editar capítulos e seções (opcional)'));
  await waitFor(() => expect(view.getByLabelText('Título da seção 1')).toBeTruthy());
  fireEvent.click(view.getByRole('button', { name: 'Mover seção 2 para cima' }));
  await waitFor(() => expect((view.getByLabelText('Título da seção 1') as HTMLInputElement).value).toBe('Chapter 2'));
  fireEvent.input(view.getByLabelText('Título da seção 1'), { target: { value: 'Second chapter' } });
  await waitFor(() => expect((view.getByLabelText('Título da seção 1') as HTMLInputElement).value).toBe('Second chapter'));
  fireEvent.click(view.getByRole('button', { name: 'Salvar índice' }));
  await waitFor(() => expect(save).toHaveBeenCalledWith('material', 2, [
    { id: 'second', title: 'Second chapter' },
    { id: 'first', title: 'Chapter 1' },
  ]));
  load.mockRestore(); save.mockRestore();
});
