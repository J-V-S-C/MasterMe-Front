import { reportApiRequest } from './client-observability';

export type SupportedLocale = 'pt-BR' | 'en-US';
export type MaterialSummary = {
  id: string;
  title: string;
  locale: SupportedLocale;
  createdAt: string;
};
export type Material = MaterialSummary & { content: string };
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
  sourceOffset?: number;
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
export type PracticeContext = {
  knowledgeMap: KnowledgeNode[];
  confidences: ConceptConfidence[];
  performance: ConceptPerformance[];
  projects: PracticeProject[];
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
export type BillingPlanId = 'FREE' | 'ESSENTIAL' | 'PRO';
export type PaidBillingPlanId = Exclude<BillingPlanId, 'FREE'>;
export type AiCreditOperation =
  | 'EXTRACTION'
  | 'INITIAL_EVALUATION'
  | 'EDGE_CASE_GENERATION'
  | 'EDGE_CASE_EVALUATION'
  | 'PRACTICE_PROJECT'
  | 'LOCALIZATION'
  | 'STRESS_EVALUATION'
  | 'ISOMORPHIC_PROBLEM';
export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  priceInCents: number;
  durationDays: number | null;
  dailyCreditLimit: number;
  periodCreditLimit: number;
};
export type BillingCatalog = {
  currency: 'BRL';
  billingType: 'ONE_TIME';
  plans: BillingPlan[];
  creditWeights: Record<AiCreditOperation, number>;
  fallbackPolicy: string;
};
export type BillingOrder = {
  id: string;
  planId: PaidBillingPlanId;
  amountInCents: number;
  status: 'PENDING' | 'CHECKOUT_READY' | 'CHECKOUT_FAILED' | 'PAID';
  checkoutUrl: string | null;
  createdAt: string;
  updatedAt: string;
};
export type BillingSummary = {
  planId: BillingPlanId;
  dailyLimit: number;
  dailyUsed: number;
  dailyRemaining: number;
  dailyResetsAt: string;
  periodLimit: number;
  periodUsed: number;
  periodRemaining: number;
  periodStartsAt: string;
  periodEndsAt: string;
  validUntil: string | null;
  weights: Record<AiCreditOperation, number>;
  estimates: Record<AiCreditOperation, number>;
  estimateAssumption: { providerAttemptsPerOperation: number };
};
export type UploadedMaterial = {
  id: string;
  title: string;
  status: ProcessingState;
};
export type EditorialUnit = { id: string; order: number; title: string | null; level: number; startOffset: number; endOffset: number; provenance: 'HEADING' | 'PDF_OUTLINE' | 'UNSTRUCTURED'; pageNumber: number | null };
export type ConceptRelation = { id: string; material_id: string; from_concept_id: string; to_concept_id: string; relation_type: string; statement: string; justification: string; source_excerpt: string; source_offset?: number | null; provenance: 'EXTRACTED' | 'STUDENT' };
export type Shelf = { id: string; name: string; shelf_materials: Array<{ material_id: string }> };
export type ConceptCard = { concept_id: string; note: string; concepts: { name: string; material_id: string; source_excerpt: string } };
export type LearningGoal = { id: string; title: string; description: string; deadline: string | null };
export type StudyPlan = { id: string; title: string; goal_id: string | null; study_plan_materials: Array<{ material_id: string; ordinal: number }> };
export type TaskActivity = 'READ' | 'EXPLAIN' | 'RELATE' | 'APPLY' | 'REVISIT' | 'PRACTICE';
export type StudyTask = { id: string; sort_order: number; title: string; activity_type: TaskActivity; plan_id: string | null; material_id: string | null; concept_id: string | null; unit_id: string | null; duration_minutes: number | null; scheduled_at: string | null; status: 'PENDING' | 'DONE' | 'REMOVED'; reason: string; study_suggestions?: Array<{ learning_evidence: { id: string; prompt: string; diagnosis: string; source_excerpt: string; source_offset?: number | null; status: string; created_at: string } }> };
export type StudyAvailability = { weekday: number; minutes: number; timezone: string };
export type StudySuggestion = { id: string; title: string; reason: string; status: 'PENDING' | 'ACCEPTED' | 'IGNORED'; task_id: string | null; learning_evidence: { id: string; material_id: string; prompt: string; diagnosis: string; source_excerpt: string; source_offset?: number | null; activity_type: string; status: string; created_at: string } };
export type LearningEvidence = { id: string; material_id: string; concept_id: string | null; relation_id: string | null; previous_evidence_id: string | null; activity_type: 'COMPREHENSION' | 'RELATION' | 'APPLICATION' | 'RETENTION'; prompt: string; prompt_version: string; criteria: string[]; hints_used: string[]; answer: string; status: EvaluationStatus | 'SELF_REPORTED' | 'CONTESTED'; assisted: boolean; diagnosis: string; source_excerpt: string; source_offset?: number | null; created_at: string; evidence_contestations?: Array<{ id: string; reason: string; created_at: string }> };

export class ApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

type ResponseCacheEntry = { data: unknown; etag: string | null; expiresAt: number };
const responseCache = new Map<string, ResponseCacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();
const CACHE_TTL_MS = 15_000;

export function invalidateApiCache(prefix?: string): void {
  for (const key of responseCache.keys()) if (!prefix || key.startsWith(prefix)) responseCache.delete(key);
}

async function executeCall<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  requestHeaders?: Readonly<Record<string, string>>,
): Promise<T> {
  const stableGet = method === 'GET' && !path.endsWith('/status');
  const cached = stableGet ? responseCache.get(path) : undefined;
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      cache: stableGet ? 'no-cache' : 'no-store',
      headers: {
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(cached?.etag ? { 'if-none-match': cached.etag } : {}),
        ...requestHeaders,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    reportApiRequest('network_error');
    throw error;
  }
  if (response.status === 304 && cached) {
    reportApiRequest('success');
    cached.expiresAt = Date.now() + CACHE_TTL_MS;
    return cached.data as T;
  }
  if (!response.ok) {
    reportApiRequest(response.status >= 500 ? 'server_error' : 'client_error');
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
  reportApiRequest('success');
  if (response.status === 204) {
    if (method !== 'GET') invalidateApiCache();
    return undefined as T;
  }
  const payload = (await response.json()) as { data: T };
  if (stableGet) responseCache.set(path, { data: payload.data, etag: response.headers.get('etag'), expiresAt: Date.now() + CACHE_TTL_MS });
  else if (method !== 'GET') invalidateApiCache();
  return payload.data;
}

function call<T>(path: string, method = 'GET', body?: unknown, requestHeaders?: Readonly<Record<string, string>>): Promise<T> {
  const stableGet = method === 'GET' && !path.endsWith('/status');
  const cached = stableGet ? responseCache.get(path) : undefined;
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.data as T);
  if (!stableGet) return executeCall<T>(path, method, body, requestHeaders);
  const pending = inFlight.get(path);
  if (pending) return pending as Promise<T>;
  const request = executeCall<T>(path, method, body, requestHeaders).finally(() => inFlight.delete(path));
  inFlight.set(path, request);
  return request;
}

const uploadTypes: Record<string, string> = {
  pdf: 'application/pdf',
  md: 'text/markdown',
  markdown: 'text/markdown',
  txt: 'text/plain',
};
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
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
    return Promise.reject(new Error('O arquivo deve ter no máximo 8 MiB.'));
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
    xhr.onerror = () => {
      reportApiRequest('network_error');
      reject(new Error('Falha de conexão durante o envio do arquivo.'));
    };
    xhr.onload = () => {
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(xhr.responseText);
      } catch {}
      const payload =
        parsed && typeof parsed === 'object'
          ? (parsed as { data?: UploadedMaterial; message?: string })
          : null;
      if (xhr.status >= 200 && xhr.status < 300 && payload?.data) {
        reportApiRequest('success');
        invalidateApiCache();
        resolve(payload.data);
      } else {
        reportApiRequest(xhr.status >= 500 || xhr.status === 0 ? 'server_error' : 'client_error');
        reject(
          new Error(payload?.message ?? 'Não foi possível enviar o arquivo.'),
        );
      }
    };
    xhr.send(data);
  });
}

export const api = {
  outline: (materialId: string) => call<EditorialUnit[]>(`/learning/materials/${materialId}/outline`),
  readingPosition: (materialId: string) => call<{ offset: number }>(`/learning/materials/${materialId}/reading-position`),
  setReadingPosition: (materialId: string, offset: number) => call<{ offset: number }>(`/learning/materials/${materialId}/reading-position`, 'PUT', { offset }),
  relations: (materialId: string) => call<ConceptRelation[]>(`/learning/materials/${materialId}/relations`),
  createRelation: (input: { materialId: string; fromConceptId: string; toConceptId: string; relationType: string; statement: string; justification: string; sourceExcerpt: string }) => call<ConceptRelation>('/learning/relations', 'POST', input),
  shelves: () => call<Shelf[]>('/learning/shelves'),
  createShelf: (name: string) => call<Shelf>('/learning/shelves', 'POST', { name }),
  deleteShelf: (id: string) => call<void>(`/learning/shelves/${id}`, 'DELETE'),
  setShelfMaterial: (shelfId: string, materialId: string, included: boolean) => call<void>(`/learning/shelves/${shelfId}/materials/${materialId}`, included ? 'PUT' : 'DELETE'),
  cards: () => call<ConceptCard[]>('/learning/cards'),
  saveCard: (conceptId: string, note: string) => call<ConceptCard>(`/learning/cards/${conceptId}`, 'PUT', { note }),
  deleteCard: (conceptId: string) => call<void>(`/learning/cards/${conceptId}`, 'DELETE'),
  goals: () => call<LearningGoal[]>('/learning/goals'),
  createGoal: (title: string, description: string, deadline?: string) => call<LearningGoal>('/learning/goals', 'POST', { title, description, deadline }),
  updateGoal: (id: string, input: { title?: string; description?: string; deadline?: string | null }) => call<LearningGoal>(`/learning/goals/${id}`, 'PATCH', input),
  plans: () => call<StudyPlan[]>('/learning/plans'),
  createPlan: (title: string, goalId?: string, materialIds: string[] = []) => call<StudyPlan>('/learning/plans', 'POST', { title, goalId, materialIds }),
  updatePlan: (id: string, input: { title?: string; goalId?: string | null; materialIds?: string[] }) => call<StudyPlan>(`/learning/plans/${id}`, 'PATCH', input),
  reorderPlanTasks: (id: string, taskIds: string[]) => call<StudyTask[]>(`/learning/plans/${id}/tasks/order`, 'PUT', { taskIds }),
  tasks: () => call<StudyTask[]>('/learning/tasks'),
  createTask: (input: { title: string; activityType: TaskActivity; planId?: string; materialId?: string; conceptId?: string; unitId?: string; durationMinutes?: number; scheduledAt?: string; reason?: string }) => call<StudyTask>('/learning/tasks', 'POST', input),
  updateTask: (id: string, input: { title?: string; durationMinutes?: number | null; scheduledAt?: string | null; status?: StudyTask['status'] }) => call<StudyTask>(`/learning/tasks/${id}`, 'PATCH', input),
  availability: () => call<StudyAvailability[]>('/learning/availability'),
  setAvailability: (weekday: number, minutes: number, timezone: string) => call<StudyAvailability>('/learning/availability', 'PUT', { weekday, minutes, timezone }),
  desk: (date: string, timezone: string) => call<{ tasks: StudyTask[]; load: { plannedMinutes: number; availableMinutes: number; excessMinutes: number } }>(`/learning/desk?date=${encodeURIComponent(date)}&timezone=${encodeURIComponent(timezone)}`),
  suggestions: () => call<StudySuggestion[]>('/learning/suggestions'),
  decideSuggestion: (id: string, input: { decision: 'ACCEPTED' | 'IGNORED'; title?: string; durationMinutes?: number; scheduledAt?: string; planId?: string }) => call<StudySuggestion>(`/learning/suggestions/${id}/decision`, 'POST', input),
  evidence: (materialId: string) => call<LearningEvidence[]>(`/learning/materials/${materialId}/evidence`),
  requestRevisit: (evidenceId: string) => call<StudySuggestion>(`/learning/evidence/${evidenceId}/revisit`, 'POST'),
  contestEvidence: (id: string, reason: string) => call<{ id: string; reason: string }>(`/learning/evidence/${id}/contestations`, 'POST', { reason }),
  evaluateActivity: (input: { requestId: string; conceptId?: string; relationId?: string; taskId?: string; activityType: LearningEvidence['activity_type']; answer: string; assisted: boolean; hintsUsed?: string[]; previousEvidenceId?: string }) => call<{ event: LearningEvidence; suggestion: StudySuggestion | null }>('/learning/activities/answers', 'POST', input),
  materials: () => call<MaterialSummary[]>('/materials'),
  material: (id: string) => call<Material>(`/materials/${id}`),
  deleteMaterial: (id: string) => call<void>(`/materials/${id}`, 'DELETE'),
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
  practiceContext: (materialId: string) =>
    call<PracticeContext>(`/materials/${materialId}/practice-context`),
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
  billingCatalog: () => call<BillingCatalog>('/billing/catalog'),
  billingMe: () => call<BillingSummary>('/billing/me'),
  createCheckout: (planId: PaidBillingPlanId, idempotencyKey: string) =>
    call<BillingOrder>('/billing/checkouts', 'POST', { planId }, { 'idempotency-key': idempotencyKey }),
  reconcileOrder: (orderId: string, reference?: { transactionNsu: string; slug: string }) =>
    call<BillingOrder>(`/billing/orders/${orderId}/reconcile`, 'POST', reference ?? {}),
};
