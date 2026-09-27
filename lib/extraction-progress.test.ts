import { describe, expect, test } from 'bun:test'
import {
  eventBelongsToMaterial,
  initialExtractionProgress,
  parseExtractionEvent,
  progressFromEvent,
  progressFromStatus,
} from './extraction-progress'

describe('progresso da extração', () => {
  test('mantém o job pendente depois que a extração é enfileirada', () => {
    const progress = progressFromEvent(initialExtractionProgress, 'material.queued', {
      materialId: 'material-a', stage: 'QUEUED', progressPercent: 0,
    })
    expect(progress.status).toBe('PENDING')
    expect(progress.progressPercent).toBe(0)
  })

  test('representa todas as etapas até a conclusão', () => {
    const preparing = progressFromEvent(initialExtractionProgress, 'material.progress', { materialId: 'material-a', stage: 'PREPARING', progressPercent: 1 })
    const extracting = progressFromEvent(preparing, 'material.progress', { materialId: 'material-a', stage: 'EXTRACTING', progressPercent: 55, totalChunks: 4, completedChunks: 2 })
    const reducing = progressFromEvent(extracting, 'material.progress', { materialId: 'material-a', stage: 'REDUCING', progressPercent: 90 })
    const ready = progressFromEvent(reducing, 'material.ready', { materialId: 'material-a', progressPercent: 100 })
    expect([preparing.stage, extracting.stage, reducing.stage, ready.stage]).toEqual(['PREPARING', 'EXTRACTING', 'REDUCING', 'READY'])
    expect(ready).toMatchObject({ status: 'READY', progressPercent: 100 })
  })

  test('restaura um job ativo a partir do status persistido', () => {
    const progress = progressFromStatus({
      id: 'material-a', status: 'PROCESSING', error: null, processedAt: null,
      jobId: 'job-a', stage: 'EXTRACTING', totalChunks: 6, completedChunks: 3,
      progressPercent: 43, attempts: 1, startedAt: null, finishedAt: null,
    })
    expect(progress).toMatchObject({ status: 'PROCESSING', stage: 'EXTRACTING', completedChunks: 3, totalChunks: 6 })
  })

  test('ignora eventos inválidos ou pertencentes a outro material', () => {
    expect(parseExtractionEvent('{invalid')).toBeNull()
    const event = parseExtractionEvent('{"materialId":"material-b","progressPercent":20}')
    expect(eventBelongsToMaterial(event, 'material-a')).toBe(false)
    expect(eventBelongsToMaterial(event, 'material-b')).toBe(true)
  })

  test('expõe falha definitiva e permite retornar à fila', () => {
    const failed = progressFromEvent(initialExtractionProgress, 'material.failed', { materialId: 'material-a', message: 'Falha ao extrair.' })
    const retried = progressFromEvent(failed, 'material.queued', { materialId: 'material-a', stage: 'RETRYING' })
    expect(failed).toMatchObject({ status: 'FAILED', error: 'Falha ao extrair.' })
    expect(retried).toMatchObject({ status: 'PENDING', stage: 'RETRYING', error: null })
  })

  test('encerra o progresso ao receber cancelamento', () => {
    const active = progressFromEvent(initialExtractionProgress, 'material.progress', { materialId: 'material-a', stage: 'EXTRACTING' })
    const cancelled = progressFromEvent(active, 'material.cancelled', { materialId: 'material-a' })
    expect(cancelled).toMatchObject({ status: 'CANCELLED', error: null })
  })
})
