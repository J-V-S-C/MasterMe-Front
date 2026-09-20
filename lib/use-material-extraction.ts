"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'
import { eventBelongsToMaterial, initialExtractionProgress, parseExtractionEvent, progressFromEvent, progressFromStatus, type ExtractionProgress } from './extraction-progress'

const eventNames = ['material.queued', 'material.progress', 'material.ready', 'material.failed'] as const

export function useMaterialExtraction(materialId: string, onReady: () => Promise<void>) {
  const [progress, setProgress] = useState<ExtractionProgress>(initialExtractionProgress)
  const [checking, setChecking] = useState(false)
  const [connectionLost, setConnectionLost] = useState(false)
  const [enqueueing, setEnqueueing] = useState(false)
  const readyCallback = useRef(onReady)
  const lastStatus = useRef<ExtractionProgress['status'] | null>(null)
  const readyNotified = useRef(false)
  readyCallback.current = onReady

  const refreshStatus = useCallback(async () => {
    if (!materialId) return
    const status = await api.materialStatus(materialId)
    const previousStatus = lastStatus.current
    lastStatus.current = status.status
    setProgress(progressFromStatus(status))
    if (status.status === 'READY' && status.progressPercent === 100) {
      if (previousStatus !== null && previousStatus !== 'READY' && !readyNotified.current) {
        readyNotified.current = true
        await readyCallback.current()
      } else if (previousStatus === null) {
        // O mapa já é carregado pela tela ao trocar de material. Não duplique esse GET.
        readyNotified.current = true
      }
    }
  }, [materialId])

  useEffect(() => {
    if (!materialId) return
    let polling: ReturnType<typeof setInterval> | undefined
    lastStatus.current = null
    readyNotified.current = false
    setChecking(true)
    setConnectionLost(false)
    void refreshStatus().catch(() => setConnectionLost(true)).finally(() => setChecking(false))
    const source = new EventSource('/api/events')
    const listen = (eventName: string) => (message: Event) => {
      if (!(message instanceof MessageEvent) || typeof message.data !== 'string') return
      const event = parseExtractionEvent(message.data)
      if (!eventBelongsToMaterial(event, materialId)) return
      if (eventName === 'material.queued') {
        lastStatus.current = 'PENDING'
        readyNotified.current = false
      } else if (eventName === 'material.progress') {
        lastStatus.current = 'PROCESSING'
      } else if (eventName === 'material.failed') {
        lastStatus.current = 'FAILED'
      }
      setProgress((current) => progressFromEvent(current, eventName, event))
      if (eventName === 'material.ready' && !readyNotified.current) {
        lastStatus.current = 'READY'
        readyNotified.current = true
        void readyCallback.current()
      }
    }
    const listeners = eventNames.map((eventName) => {
      const listener = listen(eventName)
      source.addEventListener(eventName, listener)
      return { eventName, listener }
    })
    source.onopen = () => {
      setConnectionLost(false)
      if (polling) { clearInterval(polling); polling = undefined }
    }
    source.onerror = () => {
      setConnectionLost(true)
      if (!polling) polling = setInterval(() => { void refreshStatus() }, 2_000)
    }
    return () => {
      source.close()
      if (polling) clearInterval(polling)
      for (const { eventName, listener } of listeners) source.removeEventListener(eventName, listener)
    }
  }, [materialId, refreshStatus])

  useEffect(() => {
    if (!materialId || (progress.status !== 'PENDING' && progress.status !== 'PROCESSING')) return
    const reconciliation = setInterval(() => { void refreshStatus().catch(() => setConnectionLost(true)) }, 5_000)
    return () => clearInterval(reconciliation)
  }, [materialId, progress.status, refreshStatus])

  const startExtraction = useCallback(async () => {
    setEnqueueing(true)
    try {
      const job = await api.extractConcepts(materialId)
      lastStatus.current = 'PENDING'
      readyNotified.current = false
      setProgress((current) => ({ ...current, status: 'PENDING', stage: job.stage, progressPercent: job.progressPercent, error: null }))
    } finally { setEnqueueing(false) }
  }, [materialId])

  return { progress, checking, connectionLost, enqueueing, startExtraction }
}
