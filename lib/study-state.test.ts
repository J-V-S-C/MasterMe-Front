import { describe, expect, test } from 'bun:test';
import { studyState, usageCounts } from './study-state';

describe('estado de estudo', () => {
  test('mantém sessões e rascunhos separados por conceito', () => {
    const items = new Map<string, string>();
    globalThis.sessionStorage = {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => { items.set(key, value); },
      removeItem: (key: string) => { items.delete(key); },
    } as Storage;
    studyState.saveSession('material', 'conceito-a', 'sessao-a');
    studyState.saveSession('material', 'conceito-b', 'sessao-b');
    studyState.saveDraft('sessao-a', 'resposta A');
    studyState.saveDraft('sessao-b', 'resposta B');
    expect(studyState.sessionId('material', 'conceito-a')).toBe('sessao-a');
    expect(studyState.sessionId('material', 'conceito-b')).toBe('sessao-b');
    expect(studyState.draft('sessao-a')).toBe('resposta A');
    studyState.clearDraft('sessao-a');
    expect(studyState.draft('sessao-a')).toBe('');
    expect(studyState.draft('sessao-b')).toBe('resposta B');
  });

  test('resume chamadas por operação sem inventar cota ou fallback', () => {
    expect(usageCounts({ totalRequests: 5, totalInputTokens: 15, totalOutputTokens: 6, dailyLimit: 100, remainingRequests: 95, resetsAt: '2026-10-07T00:00:00.000Z', byModel: [], byOperation: [
      { operation: 'EXTRACTION', requests: 1, successes: 1, inputTokens: 1, outputTokens: 1 },
      { operation: 'INITIAL_EVALUATION', requests: 2, successes: 1, inputTokens: 1, outputTokens: 1 },
      { operation: 'EDGE_CASE_EVALUATION', requests: 1, successes: 1, inputTokens: 1, outputTokens: 1 },
      { operation: 'PRACTICE_PROJECT', requests: 1, successes: 1, inputTokens: 1, outputTokens: 1 },
    ] })).toEqual({ extractions: 1, validations: 2, edgeCases: 0, practiceProjects: 1 });
  });
});
