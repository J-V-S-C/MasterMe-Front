'use client'

import { useCallback, useEffect } from 'react'
import { useReportWebVitals } from 'next/web-vitals'
import { usePathname } from 'next/navigation'
import { configureClientObservability, reportClientError, reportPageView, reportWebVital } from '../lib/client-observability'

export function ClientObservability({ build }: { build: string }) {
  const pathname = usePathname()
  configureClientObservability(build)
  const reportVital = useCallback((metric: Parameters<typeof reportWebVital>[0]) => reportWebVital(metric, build), [build])
  useReportWebVitals(reportVital)

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportClientError(event.target && event.target !== window ? 'navigation' : 'unhandled', build)
    }
    const onRejection = () => reportClientError('unhandled', build)
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [build])

  useEffect(() => { reportPageView(build) }, [build, pathname])

  return null
}
