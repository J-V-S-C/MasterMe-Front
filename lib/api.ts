export type SupportedLocale = 'pt-BR' | 'en-US';
export type Material = {
  id: string;
  title: string;
  content: string;
  locale: SupportedLocale;
  createdAt: string;
};
export type EvaluationStatus = 'PASSED' | 'LOGICAL_BREAK' | 'INCOMPLETE';
export type Attempt = {
  stage: 'INITIAL' | 'EDGE_CASE_REPLY' | 'STRESS_REPLY';
  answer: string;
  evaluation: {
    status: EvaluationStatus;
    missingPremises: string[];
    logicalBreak: string | null;
    feedback: string;
    strength?: string;
    gap?: string | null;
    nextAction?: string;
  };
  createdAt: string;
};
export type Concept = {
  id: string;
  materialId: string;
  name: string;
  description: string;
  kind: 'AXIOM' | 'NODE' | 'EDGE';
  sourceExcerpt: string;
  fundamentalPremises: string[];
  edgeCases: string[];
  edgeCaseQuestion?: string;
  prerequisiteIds: string[];
  nextIds: string[];
  generatedLocale: SupportedLocale | 'und';
};
export type KnowledgeNode = {
  concept: Concept;
  status: 'READY' | 'REVIEW' | 'EXPLAINED';
  edgeCaseStatus: EdgeCaseStatus;
  lastAttempt: Attempt | null;
  question: {
    text: string;
    targetPremise: string;
    expectedReasoningSteps: string[];
    learningObjective?: string;
    requiredIdeas?: string[];
    commonMisconceptions?: string[];
  };
};
export type EdgeCaseStatus = 'NOT_REQUESTED' | 'READY' | 'REVIEW' | 'PASSED';
export type EdgeCaseChallenge = {
  scenario: string;
  edgeCaseTested: string;
  question: string;
};
export type StudySession = {
  id: string;
  conceptId: string;
  state: 'QUESTION_READY' | 'RETRY_INITIAL' | 'EXPLANATION_PASSED';
  question: {
    text: string;
    targetPremise: string;
    expectedReasoningSteps: string[];
    learningObjective?: string;
    requiredIdeas?: string[];
    commonMisconceptions?: string[];
  };
  edgeCaseStatus: EdgeCaseStatus;
  edgeCaseChallenge: EdgeCaseChallenge | null;
  attempts: Attempt[];
  createdAt: string;
  updatedAt: string;
};
export type ConceptConfidence = {
  conceptId: string;
  value: number;
  createdAt: string;
  updatedAt: string;
};
export type ConceptPerformance = {
  conceptId: string;
  passedAttempts: number;
  logicalBreaks: number;
  incompleteAttempts: number;
  totalInitialAttempts: number;
  failedInitialAttempts: number;
  weakness: number | null;
  latestStatus: EvaluationStatus | null;
  performanceNeed: number | null;
};
export type PracticeFocusMode =
  | 'OVERVIEW'
  | 'MANUAL'
  | 'CONFIDENCE'
  | 'PERFORMANCE'
  | 'COMBINED';
export type PracticeProject = {
  id: string;
  materialId: string;
  title: string;
  context: string;
  goal: string;
  deliverables: string[];
  constraints: string[];
  firstStep: string;
  prioritizedConcepts: Array<{
    conceptId: string;
    name: string;
    reason: string;
  }>;
  focusMode: PracticeFocusMode;
  createdAt: string;
};
export type PracticeFocusPreview = {
  focusMode: PracticeFocusMode;
  priorities: PracticeProject['prioritizedConcepts'];
};
export type ExtractionStage =
  | 'QUEUED'
  | 'RETRYING'
  | 'PREPARING'
  | 'EXTRACTING'
  | 'REDUCING'
  | 'READY';
export type ProcessingState = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | 'CANCELLED';
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
export type AiUsageSummary = {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  dailyLimit: number;
  remainingRequests: number;
  resetsAt: string;
  byModel: Array<{
    model: string;
    requests: number;
    successes: number;
    inputTokens: number;
    outputTokens: number;
  }>;
  byOperation: Array<{
    operation: string;
    requests: number;
    successes: number;
    inputTokens: number;
    outputTokens: number;
  }>;
};
export type UploadedMaterial = {
  id: string;
  title: string;
  status: ProcessingState;
};

export class ApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

async function call<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    cache: 'no-store',
    headers:
      body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      code?: string;
    } | null;
    throw new ApiError(
      payload?.message ?? 'Não foi possível concluir a solicitação.',
      response.status,
      payload?.code,
    );
  }
  if (response.status === 204) return undefined as T;
  const payload = (await response.json()) as { data: T };
  return payload.data;
}

const uploadTypes: Record<string, string> = {
  pdf: 'application/pdf',
  md: 'text/markdown',
  markdown: 'text/markdown',
  txt: 'text/plain',
};
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export function uploadMaterial(
  file: File,
  title: string,
  locale: SupportedLocale,
  onProgress: (percent: number | null) => void,
): Promise<UploadedMaterial> {
  const extension = file.name.split('.').at(-1)?.toLowerCase() ?? '';
  const mime = uploadTypes[extension];
  if (!mime)
    return Promise.reject(
      new Error('Selecione um arquivo PDF, Markdown ou TXT.'),
    );
  if (file.size > MAX_UPLOAD_BYTES)
    return Promise.reject(new Error('O arquivo deve ter no máximo 15 MiB.'));
  const data = new FormData();
  data.append('file', new File([file], file.name, { type: mime }));
  if (title.trim()) data.append('title', title.trim());
  data.append('locale', locale);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/materials/upload');
    xhr.upload.onprogress = (event) =>
      onProgress(
        event.lengthComputable
          ? Math.round((event.loaded / event.total) * 100)
          : null,
      );
    xhr.onerror = () =>
      reject(new Error('Falha de conexão durante o envio do arquivo.'));
    xhr.onload = () => {
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(xhr.responseText);
      } catch {}
      const payload =
        parsed && typeof parsed === 'object'
          ? (parsed as { data?: UploadedMaterial; message?: string })
          : null;
      if (xhr.status >= 200 && xhr.status < 300 && payload?.data)
        resolve(payload.data);
      else
        reject(
          new Error(payload?.message ?? 'Não foi possível enviar o arquivo.'),
        );
    };
    xhr.send(data);
  });
}

export const api = {
  materials: () => call<Material[]>('/materials'),
  createMaterial: (title: string, content: string, locale: SupportedLocale = 'pt-BR') =>
    call<Material>('/materials', 'POST', { title, content, locale }),
  extractConcepts: (materialId: string) =>
    call<ExtractionJob>(`/materials/${materialId}/extract`, 'POST'),
  cancelExtraction: (materialId: string) =>
    call<{ id: string; status: 'CANCELLED' }>(`/materials/${materialId}/extract`, 'DELETE'),
  materialStatus: (materialId: string) =>
    call<MaterialProcessingStatus>(`/materials/${materialId}/status`),
  knowledgeMap: (id: string) =>
    call<KnowledgeNode[]>(`/materials/${id}/knowledge-map`),
  localizeMaterial: (id: string, locale: SupportedLocale) =>
    call<Concept[]>(`/materials/${id}/localize`, 'POST', { locale }),
  startSession: (conceptId: string) =>
    call<StudySession>(`/concepts/${conceptId}/sessions`, 'POST'),
  getSession: (sessionId: string) =>
    call<StudySession>(`/sessions/${sessionId}`),
  answer: (sessionId: string, answer: string) =>
    call<StudySession>(`/sessions/${sessionId}/answers`, 'POST', { answer }),
  requestEdgeCase: (sessionId: string) =>
    call<StudySession>(`/sessions/${sessionId}/edge-case`, 'POST'),
  answerEdgeCase: (sessionId: string, answer: string) =>
    call<StudySession>(`/sessions/${sessionId}/edge-case/answers`, 'POST', {
      answer,
    }),
  confidences: (materialId: string) =>
    call<ConceptConfidence[]>(`/materials/${materialId}/confidences`),
  saveConfidence: (conceptId: string, value: number) =>
    call<ConceptConfidence>(`/concepts/${conceptId}/confidence`, 'PUT', {
      value,
    }),
  deleteConfidence: (conceptId: string) =>
    call<void>(`/concepts/${conceptId}/confidence`, 'DELETE'),
  performance: (materialId: string) =>
    call<ConceptPerformance[]>(`/materials/${materialId}/performance`),
  practiceFocus: (
    materialId: string,
    focusMode: PracticeFocusMode,
    conceptIds?: string[],
  ) => call<PracticeFocusPreview>(
    `/materials/${materialId}/practice-focus`,
    'POST',
    conceptIds === undefined ? { focusMode } : { focusMode, conceptIds },
  ),
  generatePracticeProject: (
    materialId: string,
    focusMode: PracticeFocusMode,
    conceptIds?: string[],
  ) =>
    call<PracticeProject>(
      `/materials/${materialId}/practice-projects`,
      'POST',
      conceptIds === undefined ? { focusMode } : { focusMode, conceptIds },
    ),
  practiceProjects: (materialId: string) =>
    call<PracticeProject[]>(`/materials/${materialId}/practice-projects`),
  practiceProject: (id: string) =>
    call<PracticeProject>(`/practice-projects/${id}`),
  aiUsageToday: () => call<AiUsageSummary>('/ai-usage/today'),
};
