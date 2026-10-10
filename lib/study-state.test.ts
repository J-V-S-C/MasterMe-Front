import { describe, expect, test } from 'bun:test';
import { studyState } from './study-state';

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
});
