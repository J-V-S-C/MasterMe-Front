import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import { Window } from 'happy-dom';
import { ProjectView, resolveAutomaticFocusMode } from '../../components/practice-workspace';
import { I18nProvider } from '../../lib/i18n';

beforeEach(() => { const window = new Window(); Object.assign(globalThis, { window, document: window.document, navigator: window.navigator }); });
afterEach(() => cleanup());

describe('Practice project', () => {
  test('renders the proposal without a solution editor or evaluation', () => {
    const view = render(<I18nProvider><ProjectView project={{ id: 'project-a', materialId: 'material-a', title: 'Gateway resiliente', context: 'Construa uma integração.', goal: 'Aplicar contratos.', deliverables: ['Diagrama'], constraints: ['Sem acoplamento'], firstStep: 'Liste as fronteiras.', prioritizedConcepts: [{ conceptId: 'concept-a', name: 'Inversão', reason: 'confiança 2/5' }], focusMode: 'CONFIDENCE', createdAt: '2026-01-01T00:00:00.000Z' }} /></I18nProvider>);
    expect(view.queryByRole('textbox')).toBeNull(); expect(view.queryByText(/avaliar solução/i)).toBeNull();
  });
  test('automatically picks the best available signal without exposing technical modes', () => {
    const confidence = [{ conceptId: 'concept-a', value: 2, createdAt: '2026-01-01', updatedAt: '2026-01-01' }];
    const performance = [{ conceptId: 'concept-a', passedAttempts: 0, logicalBreaks: 1, incompleteAttempts: 0, totalInitialAttempts: 1, failedInitialAttempts: 1, weakness: 1, latestStatus: 'LOGICAL_BREAK' as const, performanceNeed: 1 }];
    expect(resolveAutomaticFocusMode([], [])).toBe('OVERVIEW');
    expect(resolveAutomaticFocusMode(confidence, [])).toBe('CONFIDENCE');
    expect(resolveAutomaticFocusMode([], performance)).toBe('PERFORMANCE');
    expect(resolveAutomaticFocusMode(confidence, performance)).toBe('COMBINED');
  });
  test('ignores aggregate history when the latest answer is missing', () => {
    const historicalOnly = [{ conceptId: 'concept-a', passedAttempts: 0, logicalBreaks: 1, incompleteAttempts: 0, totalInitialAttempts: 1, failedInitialAttempts: 1, weakness: 1, latestStatus: null, performanceNeed: null }];
    expect(resolveAutomaticFocusMode([], historicalOnly)).toBe('OVERVIEW');
  });
});
