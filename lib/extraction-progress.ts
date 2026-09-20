import type { ExtractionStage, MaterialProcessingStatus, ProcessingState } from './api'

const extractionStages = ['QUEUED', 'RETRYING', 'PREPARING', 'EXTRACTING', 'REDUCING', 'READY'] as const

export type ExtractionProgress = {
  status: ProcessingState
  stage: ExtractionStage
  progressPercent: number
  totalChunks: number
  completedChunks: number
  attempts: number
  error: string | null
}

export type ExtractionEvent = {
  materialId: string
  stage?: ExtractionStage
  progressPercent?: number
  totalChunks?: number
  completedChunks?: number
  message?: string
}

export const initialExtractionProgress: ExtractionProgress = {
  status: 'READY', stage: 'READY', progressPercent: 0,
  totalChunks: 0, completedChunks: 0, attempts: 0, error: null,
}

export const progressFromStatus = (status: MaterialProcessingStatus): ExtractionProgress => ({
  status: status.status,
  stage: status.stage ?? (status.status === 'READY' ? 'READY' : 'QUEUED'),
  progressPercent: status.progressPercent ?? 0,
  totalChunks: status.totalChunks ?? 0,
  completedChunks: status.completedChunks ?? 0,
  attempts: status.attempts ?? 0,
  error: status.error,
})

export const progressFromEvent = (
  current: ExtractionProgress,
  eventName: string,
  event: ExtractionEvent,
): ExtractionProgress => {
  if (eventName === 'material.ready') return { ...current, status: 'READY', stage: 'READY', progressPercent: 100, error: null }
  if (eventName === 'material.failed') return { ...current, status: 'FAILED', error: event.message ?? 'Não foi possível extrair o contexto.' }
  if (eventName === 'material.queued') return { ...current, status: 'PENDING', stage: event.stage ?? (current.attempts > 0 || event.message ? 'RETRYING' : 'QUEUED'), progressPercent: event.progressPercent ?? 0, error: event.message ?? null }
  if (eventName === 'material.progress') return {
    ...current, status: 'PROCESSING', stage: event.stage ?? current.stage,
    progressPercent: event.progressPercent ?? current.progressPercent,
    totalChunks: event.totalChunks ?? current.totalChunks,
    completedChunks: event.completedChunks ?? current.completedChunks,
    error: null,
  }
  return current
}

export const stageCopy: Record<ExtractionStage, { title: string; description: string }> = {
  QUEUED: { title: 'Extração na fila', description: 'Seu material está aguardando o início do processamento.' },
  RETRYING: { title: 'Preparando nova tentativa', description: 'O sistema vai tentar processar o material novamente.' },
  PREPARING: { title: 'Preparando o material', description: 'Estamos organizando o texto em partes analisáveis.' },
  EXTRACTING: { title: 'Identificando conceitos', description: 'A análise está encontrando premissas, relações e casos de borda.' },
  REDUCING: { title: 'Construindo as relações', description: 'Os conceitos estão sendo consolidados em um mapa coerente.' },
  READY: { title: 'Contexto extraído', description: 'Os conceitos já podem ser usados na sessão de estudo.' },
}

export const parseExtractionEvent = (value: string): ExtractionEvent | null => {
  try {
    const candidate: unknown = JSON.parse(value)
    if (!candidate || typeof candidate !== 'object' || !('materialId' in candidate) || typeof candidate.materialId !== 'string') return null
    const result: ExtractionEvent = { materialId: candidate.materialId }
    if ('stage' in candidate && typeof candidate.stage === 'string') {
      const stage = extractionStages.find((entry) => entry === candidate.stage)
      if (stage) result.stage = stage
    }
    if ('progressPercent' in candidate && typeof candidate.progressPercent === 'number') result.progressPercent = candidate.progressPercent
    if ('totalChunks' in candidate && typeof candidate.totalChunks === 'number') result.totalChunks = candidate.totalChunks
    if ('completedChunks' in candidate && typeof candidate.completedChunks === 'number') result.completedChunks = candidate.completedChunks
    if ('message' in candidate && typeof candidate.message === 'string') result.message = candidate.message
    return result
  } catch { return null }
}

export const eventBelongsToMaterial = (event: ExtractionEvent | null, materialId: string): event is ExtractionEvent => event?.materialId === materialId
