import { afterEach, beforeEach, expect, test, spyOn } from 'bun:test';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { Window } from 'happy-dom';
import { api } from '../lib/api';
import { I18nProvider } from '../lib/i18n';
import { MaterialReader } from './material-reader';

beforeEach(() => {
  const window = new Window();
  Object.assign(globalThis, { window, document: window.document, navigator: window.navigator, localStorage: window.localStorage });
});
afterEach(() => cleanup());

test('opens a requested editorial unit and saves the selected position', async () => {
  const outline = spyOn(api, 'outline').mockResolvedValue([
    { id: 'first', order: 0, title: 'Chapter one', level: 1, startOffset: 0, endOffset: 10, provenance: 'HEADING', pageNumber: null },
    { id: 'second', order: 1, title: 'Chapter two', level: 1, startOffset: 10, endOffset: 20, provenance: 'HEADING', pageNumber: 2 },
  ]);
  const position = spyOn(api, 'readingPosition').mockResolvedValue({ offset: 0 });
  const save = spyOn(api, 'setReadingPosition').mockResolvedValue({ offset: 0 });
  const view = render(<I18nProvider><MaterialReader material={{ id: 'material', title: 'Book', content: 'first textsecond text', locale: 'en-US', createdAt: '2026-01-01' }} requestedUnitId="second" sourceExcerpt="second" /></I18nProvider>);
  await waitFor(() => expect(view.getByText('Chapter two', { selector: 'h2' })).toBeTruthy());
  expect(view.getByText('second', { selector: 'mark' })).toBeTruthy();
  fireEvent.click(view.getByRole('button', { name: 'Chapter one' }));
  await waitFor(() => expect(save).toHaveBeenCalledWith('material', 0));
  outline.mockRestore(); position.mockRestore(); save.mockRestore();
});

test('chooses among repeated excerpts and persists scroll progress within a unit', async () => {
  const excerpt = 'Repeated citation';
  const content = `Start ${excerpt} between ${excerpt} end`;
  const outline = spyOn(api, 'outline').mockResolvedValue([
    { id: 'whole', order: 0, title: 'Article', level: 1, startOffset: 0, endOffset: content.length, provenance: 'UNSTRUCTURED', pageNumber: null },
  ]);
  const position = spyOn(api, 'readingPosition').mockResolvedValue({ offset: content.lastIndexOf(excerpt) });
  const save = spyOn(api, 'setReadingPosition').mockResolvedValue({ offset: 0 });
  const view = render(<I18nProvider><MaterialReader material={{ id: 'article', title: 'Article', content, locale: 'en-US', createdAt: '2026-01-01' }} requestedUnitId={null} sourceExcerpt={excerpt} /></I18nProvider>);
  const occurrence = await view.findByRole('combobox', { name: 'Ocorrência do trecho' });
  await waitFor(() => expect((occurrence as HTMLSelectElement).value).toBe('1'));
  fireEvent.change(occurrence, { target: { value: '0' } });
  expect((occurrence as HTMLSelectElement).value).toBe('0');
  const source = view.container.querySelector('.source-content') as HTMLParagraphElement;
  Object.defineProperty(source, 'scrollHeight', { value: 1000 });
  Object.defineProperty(source, 'clientHeight', { value: 100 });
  source.scrollTop = 450;
  fireEvent.scroll(source);
  await waitFor(() => expect(save).toHaveBeenCalledWith('article', Math.round(content.length / 2)), { timeout: 2000 });
  outline.mockRestore(); position.mockRestore(); save.mockRestore();
});

test('opens the exact linked occurrence even when reading progress is nearer another', async () => {
  const excerpt = 'Repeated citation';
  const content = `Start ${excerpt} between ${excerpt} end`;
  const outline = spyOn(api, 'outline').mockResolvedValue([
    { id: 'whole', order: 0, title: 'Article', level: 1, startOffset: 0, endOffset: content.length, provenance: 'UNSTRUCTURED', pageNumber: null },
  ]);
  const position = spyOn(api, 'readingPosition').mockResolvedValue({ offset: content.lastIndexOf(excerpt) });
  const view = render(<I18nProvider><MaterialReader material={{ id: 'article', title: 'Article', content, locale: 'en-US', createdAt: '2026-01-01' }} requestedUnitId={null} sourceExcerpt={excerpt} requestedSourceOffset={content.indexOf(excerpt)} /></I18nProvider>);
  const occurrence = await view.findByRole('combobox', { name: 'Ocorrência do trecho' });
  await waitFor(() => expect((occurrence as HTMLSelectElement).value).toBe('0'));
  expect(view.getByText(excerpt, { selector: 'mark' })).toBeTruthy();
  outline.mockRestore(); position.mockRestore();
});

test('shows an explicit warning when a linked unit and excerpt are no longer available', async () => {
  const outline = spyOn(api, 'outline').mockResolvedValue([
    { id: 'current', order: 0, title: 'Current section', level: 1, startOffset: 0, endOffset: 'Current source content'.length, provenance: 'HEADING', pageNumber: null },
  ]);
  const position = spyOn(api, 'readingPosition').mockResolvedValue({ offset: 0 });
  const view = render(<I18nProvider><MaterialReader material={{ id: 'material', title: 'Book', content: 'Current source content', locale: 'en-US', createdAt: '2026-01-01' }} requestedUnitId="removed" sourceExcerpt="Removed excerpt" /></I18nProvider>);
  await waitFor(() => expect(view.getByRole('alert').textContent).toContain('referência solicitada não foi encontrada'));
  expect(view.getByText('Current source content')).toBeTruthy();
  outline.mockRestore(); position.mockRestore();
});
