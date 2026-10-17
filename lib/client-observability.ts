export const WEB_VITAL_NAMES = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const
export type WebVitalName = (typeof WEB_VITAL_NAMES)[number]
export type VitalRating = 'good' | 'needs-improvement' | 'poor'
export type ClientErrorType = 'render' | 'unhandled' | 'navigation'
export type ApiOutcome = 'success' | 'client_error' | 'server_error' | 'network_error'

export const OBSERVABLE_ROUTES = [
  '/',
  '/entrar',
  '/estudar',
  '/mapa-do-conhecimento',
  '/pratica',
  '/pagamento/retorno',
] as const

export type ClientTelemetryEvent =
  | { kind: 'web_vital'; name: WebVitalName; rating: VitalRating; value: number; route: string; build: string }
  | { kind: 'client_error'; errorType: ClientErrorType; route: string; build: string }
  | { kind: 'page_view'; route: string; build: string }
  | { kind: 'api_request'; outcome: ApiOutcome; route: string; build: string }

const routeSet = new Set<string>(OBSERVABLE_ROUTES)
const vitalSet = new Set<string>(WEB_VITAL_NAMES)
const ratingSet = new Set<string>(['good', 'needs-improvement', 'poor'])
const errorTypeSet = new Set<string>(['render', 'unhandled', 'navigation'])
const apiOutcomeSet = new Set<string>(['success', 'client_error', 'server_error', 'network_error'])
const BUILD = /^[A-Za-z0-9._-]{1,64}$/
let activeBuild = 'unknown'
let configuredWindow: Window | null = null

export function configureClientObservability(build: string): void {
  activeBuild = BUILD.test(build) ? build : 'unknown'
  configuredWindow = typeof window === 'undefined' ? null : window
}

export function normalizeClientRoute(pathname: string): string | null {
  const normalized = pathname !== '/' ? pathname.replace(/\/+$/, '') : '/'
  return routeSet.has(normalized) ? normalized : null
}

export function parseClientTelemetry(value: unknown): ClientTelemetryEvent | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const candidate = value as Record<string, unknown>
  const route = typeof candidate.route === 'string' ? normalizeClientRoute(candidate.route) : null
  if (!route || typeof candidate.build !== 'string' || !BUILD.test(candidate.build)) return null
  if (candidate.kind === 'web_vital') {
    const exactKeys = Object.keys(candidate).sort().join(',') === 'build,kind,name,rating,route,value'
    if (!exactKeys || typeof candidate.name !== 'string' || !vitalSet.has(candidate.name) || typeof candidate.rating !== 'string' || !ratingSet.has(candidate.rating) || typeof candidate.value !== 'number' || !Number.isFinite(candidate.value) || candidate.value < 0 || candidate.value > 3_600_000) return null
    return { kind: 'web_vital', name: candidate.name as WebVitalName, rating: candidate.rating as VitalRating, value: Math.round(candidate.value * 1_000) / 1_000, route, build: candidate.build }
  }
  if (candidate.kind === 'client_error') {
    const exactKeys = Object.keys(candidate).sort().join(',') === 'build,errorType,kind,route'
    if (!exactKeys || typeof candidate.errorType !== 'string' || !errorTypeSet.has(candidate.errorType)) return null
    return { kind: 'client_error', errorType: candidate.errorType as ClientErrorType, route, build: candidate.build }
  }
  if (candidate.kind === 'page_view') {
    if (Object.keys(candidate).sort().join(',') !== 'build,kind,route') return null
    return { kind: 'page_view', route, build: candidate.build }
  }
  if (candidate.kind === 'api_request') {
    const exactKeys = Object.keys(candidate).sort().join(',') === 'build,kind,outcome,route'
    if (!exactKeys || typeof candidate.outcome !== 'string' || !apiOutcomeSet.has(candidate.outcome)) return null
    return { kind: 'api_request', outcome: candidate.outcome as ApiOutcome, route, build: candidate.build }
  }
  return null
}

export function deterministicSample(key: string, rate: number): boolean {
  if (rate <= 0) return false
  if (rate >= 1) return true
  let hash = 2166136261
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 0x1_0000_0000 < rate
}

function currentRoute(): string | null {
  return typeof window === 'undefined' ? null : normalizeClientRoute(window.location.pathname)
}

const SAMPLE_KEY = 'masterme:observability-sample'
function sampledSession(): boolean {
  if (typeof window === 'undefined' || configuredWindow !== window) return false
  try {
    let seed = window.sessionStorage.getItem(SAMPLE_KEY)
    if (!seed) { seed = crypto.randomUUID(); window.sessionStorage.setItem(SAMPLE_KEY, seed) }
    return deterministicSample(seed, 0.1)
  } catch { return false }
}

function transmit(event: ClientTelemetryEvent): void {
  const body = JSON.stringify(event)
  try {
    // Supported browsers expose sendBeacon. If it is unavailable (including
    // non-browser test runtimes), telemetry stays disabled instead of making
    // an unrelated application fetch observable or blocking.
    if (typeof navigator.sendBeacon !== 'function') return
    if (navigator.sendBeacon('/api/observability', new Blob([body], { type: 'application/json' }))) return
    void fetch('/api/observability', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true, credentials: 'omit', cache: 'no-store' }).catch(() => undefined)
  } catch { /* Observability must never interrupt the product. */ }
}

export function reportWebVital(metric: { name: string; rating: string; value: number; id: string }, build: string): void {
  const route = currentRoute()
  if (!route || !vitalSet.has(metric.name) || !ratingSet.has(metric.rating)) return
  if (!sampledSession()) return
  const event = parseClientTelemetry({ kind: 'web_vital', name: metric.name, rating: metric.rating, value: metric.value, route, build })
  if (event) transmit(event)
}

export function reportClientError(errorType: ClientErrorType, build = activeBuild): void {
  const route = currentRoute()
  if (!route || !sampledSession()) return
  const event = parseClientTelemetry({ kind: 'client_error', errorType, route, build })
  if (event) transmit(event)
}

export function reportPageView(build = activeBuild): void {
  const route = currentRoute()
  if (!route || !sampledSession()) return
  const event = parseClientTelemetry({ kind: 'page_view', route, build })
  if (event) transmit(event)
}

export function reportApiRequest(outcome: ApiOutcome, build = activeBuild): void {
  const route = currentRoute()
  if (!route || !sampledSession()) return
  const event = parseClientTelemetry({ kind: 'api_request', outcome, route, build })
  if (event) transmit(event)
}
