import { parseClientTelemetry } from '../../../lib/client-observability'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 2_048
type RateLimiter = { limit(input: { key: string }): Promise<{ success: boolean }> }
type RuntimeConfiguration = { ingestUrl?: string; allowedOrigins?: string; token?: string; build?: string }
type Dependencies = { limiter?: RateLimiter; configuration?: RuntimeConfiguration; fetch?: typeof fetch }

function clientKey(request: Request): string {
  const candidate = request.headers.get('cf-connecting-ip')
  return candidate && /^[0-9a-f:.]{3,64}$/i.test(candidate) ? candidate : 'shared'
}

async function readSmallJson(request: Request): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) throw new Error('too_large')
  const reader = request.body?.getReader()
  if (!reader) throw new Error('empty')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new Error('too_large') }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return JSON.parse(new TextDecoder().decode(bytes))
}

function isForbiddenHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.lan')) return true
  if (host.includes(':') || /^\d+(?:\.\d+){3}$/.test(host)) return true
  return false
}

export function validatedDestination(configuration: RuntimeConfiguration): URL | null {
  if (!configuration.ingestUrl || !configuration.allowedOrigins || !configuration.token) return null
  try {
    const target = new URL(configuration.ingestUrl)
    const allowed = new Set(configuration.allowedOrigins.split(',').map((value) => value.trim()).filter(Boolean))
    if (target.protocol !== 'https:' || target.username || target.password || isForbiddenHostname(target.hostname) || !allowed.has(target.origin)) return null
    for (const origin of allowed) {
      const parsed = new URL(origin)
      if (parsed.origin !== origin || parsed.protocol !== 'https:' || isForbiddenHostname(parsed.hostname)) return null
    }
    return target
  } catch { return null }
}

function authoritativeBuild(configured: string | undefined): string {
  return configured && /^[A-Za-z0-9._-]{1,64}$/.test(configured) ? configured : 'unknown'
}

async function productionDependencies(): Promise<Dependencies> {
  try {
    const { env } = await import('cloudflare:workers')
    const bindings = env as unknown as { OBSERVABILITY_RATE_LIMITER?: RateLimiter }
    return { limiter: bindings.OBSERVABILITY_RATE_LIMITER, configuration: { ingestUrl: process.env.OBSERVABILITY_INGEST_URL, allowedOrigins: process.env.OBSERVABILITY_ALLOWED_ORIGINS, token: process.env.OBSERVABILITY_INGEST_TOKEN, build: process.env.APP_BUILD_ID } }
  } catch {
    return { configuration: { ingestUrl: process.env.OBSERVABILITY_INGEST_URL, allowedOrigins: process.env.OBSERVABILITY_ALLOWED_ORIGINS, token: process.env.OBSERVABILITY_INGEST_TOKEN, build: process.env.APP_BUILD_ID } }
  }
}

export async function handleObservability(request: Request, dependencies: Dependencies): Promise<Response> {
  const noStore = { 'cache-control': 'no-store' }
  if (!dependencies.limiter) return Response.json({ code: 'OBSERVABILITY_DISABLED' }, { status: 503, headers: noStore })
  let limit: { success: boolean }
  try { limit = await dependencies.limiter.limit({ key: clientKey(request) }) }
  catch { return Response.json({ code: 'OBSERVABILITY_DISABLED' }, { status: 503, headers: noStore }) }
  if (!limit.success) return Response.json({ code: 'RATE_LIMITED' }, { status: 429, headers: noStore })
  if (request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() !== 'application/json') return Response.json({ code: 'UNSUPPORTED_MEDIA_TYPE' }, { status: 415, headers: noStore })
  let raw: unknown
  try { raw = await readSmallJson(request) } catch (error) {
    const large = error instanceof Error && error.message === 'too_large'
    return Response.json({ code: large ? 'PAYLOAD_TOO_LARGE' : 'INVALID_EVENT' }, { status: large ? 413 : 400, headers: noStore })
  }
  const parsed = parseClientTelemetry(raw)
  if (!parsed) return Response.json({ code: 'INVALID_EVENT' }, { status: 400, headers: noStore })
  const configuration = dependencies.configuration ?? {}
  const event = { ...parsed, build: authoritativeBuild(configuration.build) }
  const target = validatedDestination(configuration)
  if (target) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2_000)
    try {
      const headers = new Headers({ 'content-type': 'application/json' })
      if (configuration.token) headers.set('authorization', `Bearer ${configuration.token}`)
      await (dependencies.fetch ?? fetch)(target, { method: 'POST', headers, body: JSON.stringify(event), signal: controller.signal, cache: 'no-store', redirect: 'error' })
    } catch { /* Optional telemetry destination is fail-open for the product. */ }
    finally { clearTimeout(timeout) }
  }
  return new Response(null, { status: 202, headers: noStore })
}

export async function POST(request: Request): Promise<Response> {
  return handleObservability(request, await productionDependencies())
}
