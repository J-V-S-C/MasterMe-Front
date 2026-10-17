'use client'

import { useEffect, useRef } from 'react'
import { invalidateApiCache } from '../lib/api'

export const DATA_CHANGED_EVENT = 'masterme:data-changed'
const activityTypes = [
  'material.created', 'material.queued', 'material.progress', 'material.ready', 'material.failed', 'material.cancelled', 'material.localized',
  'session.created', 'session.updated', 'confidence.updated', 'confidence.deleted', 'practice.created',
] as const

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const source = new EventSource('/api/events')
    const receive = (event: Event) => {
      invalidateApiCache()
      const message = event as MessageEvent<string>
      let payload: unknown = null
      try { payload = JSON.parse(message.data) } catch {}
      window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail: { type: event.type, payload } }))
    }
    for (const type of activityTypes) source.addEventListener(type, receive)
    return () => source.close()
  }, [])
  return children
}

export type RealtimeChange = { type: string; payload: unknown }

export function useRealtimeRefresh(refresh: (change: RealtimeChange) => void): void {
  const current = useRef(refresh)
  current.current = refresh
  useEffect(() => {
    const listener = (event: Event) => current.current((event as CustomEvent<RealtimeChange>).detail)
    window.addEventListener(DATA_CHANGED_EVENT, listener)
    return () => window.removeEventListener(DATA_CHANGED_EVENT, listener)
  }, [])
}
