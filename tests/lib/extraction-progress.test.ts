import { describe, expect, test } from 'bun:test'
import {
  eventBelongsToMaterial,
  initialExtractionProgress,
  parseExtractionEvent,
  progressFromEvent,
  progressFromStatus,
} from '../../lib/study/extraction-progress'

describe('extraction progress', () => {
  test('keeps the job pending after extraction is queued', () => {
    const progress = progressFromEvent(initialExtractionProgress, 'material.queued', {
      materialId: 'material-a', stage: 'QUEUED', progressPercent: 0,
    })
    expect(progress.status).toBe('PENDING')
    expect(progress.progressPercent).toBe(0)
  })

  test('represents all stages through completion', () => {
    const preparing = progressFromEvent(initialExtractionProgress, 'material.progress', { materialId: 'material-a', stage: 'PREPARING', progressPercent: 1 })
    const extracting = progressFromEvent(preparing, 'material.progress', { materialId: 'material-a', stage: 'EXTRACTING', progressPercent: 55, totalChunks: 4, completedChunks: 2 })
    const reducing = progressFromEvent(extracting, 'material.progress', { materialId: 'material-a', stage: 'REDUCING', progressPercent: 90 })
    const ready = progressFromEvent(reducing, 'material.ready', { materialId: 'material-a', progressPercent: 100 })
    expect([preparing.stage, extracting.stage, reducing.stage, ready.stage]).toEqual(['PREPARING', 'EXTRACTING', 'REDUCING', 'READY'])
    expect(ready).toMatchObject({ status: 'READY', progressPercent: 100 })
  })

  test('restores an active job from persisted status', () => {
    const progress = progressFromStatus({
      id: 'material-a', status: 'PROCESSING', error: null, processedAt: null,
      jobId: 'job-a', stage: 'EXTRACTING', totalChunks: 6, completedChunks: 3,
      progressPercent: 43, attempts: 1, startedAt: null, finishedAt: null,
    })
    expect(progress).toMatchObject({ status: 'PROCESSING', stage: 'EXTRACTING', completedChunks: 3, totalChunks: 6 })
  })

  test('ignores invalid events or events from another material', () => {
    expect(parseExtractionEvent('{invalid')).toBeNull()
    const event = parseExtractionEvent('{"materialId":"material-b","progressPercent":20}')
    expect(eventBelongsToMaterial(event, 'material-a')).toBe(false)
    expect(eventBelongsToMaterial(event, 'material-b')).toBe(true)
  })

  test('exposes permanent failure and allows returning to the queue', () => {
    const failed = progressFromEvent(initialExtractionProgress, 'material.failed', { materialId: 'material-a', message: 'Falha ao extrair.' })
    const retried = progressFromEvent(failed, 'material.queued', { materialId: 'material-a', stage: 'RETRYING' })
    expect(failed).toMatchObject({ status: 'FAILED', error: 'Falha ao extrair.' })
    expect(retried).toMatchObject({ status: 'PENDING', stage: 'RETRYING', error: null })
  })

  test('ends progress on cancellation', () => {
    const active = progressFromEvent(initialExtractionProgress, 'material.progress', { materialId: 'material-a', stage: 'EXTRACTING' })
    const cancelled = progressFromEvent(active, 'material.cancelled', { materialId: 'material-a' })
    expect(cancelled).toMatchObject({ status: 'CANCELLED', error: null })
  })
})
