import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import { Window } from 'happy-dom';
import { ProjectView, resolveAutomaticFocusMode } from './practice-workspace';

beforeEach(() => { const window = new Window(); Object.assign(globalThis, { window, document: window.document, navigator: window.navigator }); });
afterEach(() => cleanup());

describe('Projeto de prática', () => {
  test('renderiza a proposta sem editor de solução ou avaliação', () => {
    const view = render(<ProjectView project={{ id: 'project-a', materialId: 'material-a', title: 'Gateway resiliente', context: 'Construa uma integração.', goal: 'Aplicar contratos.', deliverables: ['Diagrama'], constraints: ['Sem acoplamento'], firstStep: 'Liste as fronteiras.', prioritizedConcepts: [{ conceptId: 'concept-a', name: 'Inversão', reason: 'confiança 2/5' }], focusMode: 'CONFIDENCE', createdAt: '2026-01-01T00:00:00.000Z' }} />);
    expect(view.getByText('Gateway resiliente')).toBeTruthy(); expect(view.getByText('Liste as fronteiras.')).toBeTruthy(); expect(view.getByText('confiança 2/5')).toBeTruthy();
    expect(view.queryByRole('textbox')).toBeNull(); expect(view.queryByText(/avaliar solução/i)).toBeNull();
  });
  test('escolhe automaticamente o melhor sinal disponível sem expor modos técnicos', () => {
    const confidence = [{ conceptId: 'concept-a', value: 2, createdAt: '2026-01-01', updatedAt: '2026-01-01' }];
    const performance = [{ conceptId: 'concept-a', passedAttempts: 0, logicalBreaks: 1, incompleteAttempts: 0, totalInitialAttempts: 1, failedInitialAttempts: 1, weakness: 1 }];
    expect(resolveAutomaticFocusMode([], [])).toBe('OVERVIEW');
    expect(resolveAutomaticFocusMode(confidence, [])).toBe('CONFIDENCE');
    expect(resolveAutomaticFocusMode([], performance)).toBe('PERFORMANCE');
    expect(resolveAutomaticFocusMode(confidence, performance)).toBe('COMBINED');
  });
});
