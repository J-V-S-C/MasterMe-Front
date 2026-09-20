export type Material = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};
export type Attempt = {
  stage: 'INITIAL' | 'STRESS_REPLY';
  answer: string;
  evaluation: {
    status: 'PASSED' | 'LOGICAL_BREAK' | 'INCOMPLETE';
    missingPremises: string[];
    logicalBreak: string | null;
    feedback: string;
  };
  createdAt: string;
};
export type KnowledgeNode = {
  concept: {
    id: string;
    materialId: string;
    name: string;
    description: string;
    kind: 'AXIOM' | 'NODE' | 'EDGE';
    sourceExcerpt: string;
    fundamentalPremises: string[];
    edgeCases: string[];
    prerequisiteIds: string[];
    nextIds: string[];
  };
  status: 'LOCKED' | 'READY' | 'VALIDATED' | 'REVIEW';
  lastAttempt: Attempt | null;
  question: { text: string } | null;
};
export type ExtractionStage =
  | 'QUEUED'
  | 'RETRYING'
  | 'PREPARING'
  | 'EXTRACTING'
  | 'REDUCING'
  | 'READY';
export type ProcessingState = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
export type ExtractionJob = {
  id: string;
  stage: ExtractionStage;
  progressPercent: number;
};
export type MaterialProcessingStatus = {
  id: string;
  status: ProcessingState;
  error: string | null;
  processedAt: string | null;
  jobId: string | null;
  stage: ExtractionStage | null;
  totalChunks: number | null;
  completedChunks: number | null;
  progressPercent: number | null;
  attempts: number | null;
  startedAt: string | null;
  finishedAt: string | null;
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`, { cache: 'no-store' });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message ?? 'Não foi possível carregar os dados.');
  }
  return ((await response.json()) as { data: T }).data;
}

async function send<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: 'POST',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(
      payload?.message ?? 'Não foi possível concluir a solicitação.',
    );
  }
  return ((await response.json()) as { data: T }).data;
}

export type StudySession = {
  id: string;
  conceptId: string;
  state:
    | 'QUESTION_READY'
    | 'RETRY_INITIAL'
    | 'AWAITING_STRESS_REPLY'
    | 'RETRY_STRESS'
    | 'VALIDATED';
  question: {
    text: string;
    targetPremise: string;
    expectedReasoningSteps: string[];
  };
  stressTest: {
    scenario: string;
    edgeCaseTested: string;
    question: string;
  } | null;
  attempts: Attempt[];
};
export const api = {
  materials: () => request<Material[]>('/materials'),
  createMaterial: (title: string, content: string) =>
    send<Material>('/materials', { title, content }),
  extractConcepts: (materialId: string) =>
    send<ExtractionJob>(`/materials/${materialId}/extract`),
  materialStatus: (materialId: string) =>
    request<MaterialProcessingStatus>(`/materials/${materialId}/status`),
  knowledgeMap: (id: string) =>
    request<KnowledgeNode[]>(`/materials/${id}/knowledge-map`),
  startSession: (conceptId: string) =>
    send<StudySession>(`/concepts/${conceptId}/sessions`),
  answer: (sessionId: string, answer: string) =>
    send<StudySession>(`/sessions/${sessionId}/answers`, { answer }),
  stressReply: (sessionId: string, answer: string) =>
    send<StudySession>(`/sessions/${sessionId}/stress-replies`, { answer }),
  aiUsageToday: () =>
    request<{
      extractions: number;
      validations: number;
      isomorphicProblems: number;
      fallbacks: number;
    }>('/ai-usage/today'),
  getIsomorphicProblem: (conceptId: string) =>
    request<{ id: string; content: string; hash: string } | null>(
      `/concepts/${conceptId}/isomorphic-problem`,
    ),
  generateIsomorphicProblem: (conceptId: string) =>
    send<{ id: string; content: string; hash: string }>(
      `/concepts/${conceptId}/isomorphic-problem`,
    ),
};
