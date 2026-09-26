import type { AiUsageSummary } from './api';

const sessionKey = (materialId: string, conceptId: string) => `masterme:session:${materialId}:${conceptId}`;
const draftKey = (sessionId: string) => `masterme:draft:${sessionId}`;

export const studyState = {
  sessionId: (materialId: string, conceptId: string) => sessionStorage.getItem(sessionKey(materialId, conceptId)),
  saveSession: (materialId: string, conceptId: string, sessionId: string) => sessionStorage.setItem(sessionKey(materialId, conceptId), sessionId),
  forgetSession: (materialId: string, conceptId: string) => sessionStorage.removeItem(sessionKey(materialId, conceptId)),
  draft: (sessionId: string) => sessionStorage.getItem(draftKey(sessionId)) ?? '',
  saveDraft: (sessionId: string, answer: string) => sessionStorage.setItem(draftKey(sessionId), answer),
  clearDraft: (sessionId: string) => sessionStorage.removeItem(draftKey(sessionId)),
};

export function usageCounts(summary: AiUsageSummary) {
  const count = (operation: string) => summary.byOperation.find((item) => item.operation === operation)?.successes ?? 0;
  return {
    extractions: count('EXTRACTION'),
    validations: count('INITIAL_EVALUATION') + count('EDGE_CASE_EVALUATION'),
    edgeCases: count('EDGE_CASE_GENERATION'),
    practiceProjects: count('PRACTICE_PROJECT'),
  };
}
