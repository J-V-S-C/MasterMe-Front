import { describe, expect, test } from 'bun:test'
import { readFile } from 'node:fs/promises'
import { handleObservability, validatedDestination } from './route'

let ip = 1
const event = { kind: 'web_vital', name: 'LCP', rating: 'good', value: 1200.1234, route: '/estudar', build: 'client-forged' }
const request = (body: string, headers: Record<string, string> = {}) => new Request('https://masterme.app/api/observability?secret=no', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': `2001:db8::${ip++}`, ...headers }, body })
const allow = { limit: async () => ({ success: true }) }
const handle = (incoming: Request, overrides: Parameters<typeof handleObservability>[1] = {}) => handleObservability(incoming, { limiter: allow, ...overrides })

describe('BFF de observabilidade', () => {
  test('funciona sem destino e rejeita rota ou campos desconhecidos', async () => {
    expect((await handle(request(JSON.stringify(event)))).status).toBe(202)
    expect((await handle(request(JSON.stringify({ ...event, route: '/users/person@example.com' })))).status).toBe(400)
    expect((await handle(request(JSON.stringify({ ...event, stack: 'secret stack' })))).status).toBe(400)
  })

  test('rejeita corpo grande mesmo sem content-length confiável', async () => {
    expect((await handle(request(JSON.stringify({ ...event, padding: 'x'.repeat(3_000) }), { 'content-length': '1' }))).status).toBe(413)
  })

  test('falha fechado sem binding distribuído ou quando o binding falha', async () => {
    expect((await handleObservability(request(JSON.stringify(event)), {})).status).toBe(503)
    expect((await handleObservability(request(JSON.stringify(event)), { limiter: { limit: async () => { throw new Error('binding unavailable') } } })).status).toBe(503)
    expect((await handleObservability(request(JSON.stringify(event)), { limiter: { limit: async () => ({ success: false }) } })).status).toBe(429)
  })

  test('encaminha somente evento validado, build e credencial próprios do servidor sem redirects', async () => {
    let captured: { url?: string; init?: RequestInit } = {}
    const fetchMock = (async (url: string | URL | Request, init?: RequestInit) => { captured = { url: String(url), init }; return new Response(null, { status: 204 }) }) as typeof fetch
    const incoming = request(JSON.stringify(event), { authorization: 'Bearer user-session', cookie: 'sb=secret', 'x-private': 'secret' })
    expect((await handle(incoming, { configuration: { ingestUrl: 'https://telemetry.example/ingest', allowedOrigins: 'https://telemetry.example', token: 'server-only-token', build: 'server-sha' }, fetch: fetchMock })).status).toBe(202)
    const headers = new Headers(captured.init?.headers)
    expect(captured.url).toBe('https://telemetry.example/ingest')
    expect(captured.init?.redirect).toBe('error')
    expect(headers.get('authorization')).toBe('Bearer server-only-token')
    expect(headers.get('cookie')).toBeNull()
    expect(headers.get('x-private')).toBeNull()
    expect(captured.init?.body).toBe(JSON.stringify({ ...event, value: 1200.123, build: 'server-sha' }))
  })

  test('rejeita destino fora da allowlist, localhost, IP privado, link-local e IPv6', async () => {
    expect(validatedDestination({ ingestUrl: 'https://telemetry.example/i', allowedOrigins: 'https://telemetry.example', token: 'secret' })?.href).toBe('https://telemetry.example/i')
    expect(validatedDestination({ ingestUrl: 'https://evil.example/i', allowedOrigins: 'https://telemetry.example', token: 'secret' })).toBeNull()
    for (const destination of ['https://localhost/i', 'https://127.0.0.1/i', 'https://169.254.169.254/i', 'https://10.0.0.1/i', 'https://[::1]/i']) {
      expect(validatedDestination({ ingestUrl: destination, allowedOrigins: new URL(destination).origin, token: 'secret' })).toBeNull()
    }
  })

  test('redirect ou falha do destino não afeta o produto e não segue o bearer', async () => {
    let calls = 0
    const fetchMock = (async (_url: string | URL | Request, init?: RequestInit) => {
      calls += 1
      expect(init?.redirect).toBe('error')
      throw new TypeError('redirect blocked')
    }) as unknown as typeof fetch
    const response = await handle(request(JSON.stringify(event)), { configuration: { ingestUrl: 'https://telemetry.example/redirect', allowedOrigins: 'https://telemetry.example', token: 'secret', build: 'sha' }, fetch: fetchMock })
    expect(response.status).toBe(202)
    expect(calls).toBe(1)
  })

  test('wrangler declara limiter distribuído oficial em vez de estado local', async () => {
    const wrangler = JSON.parse(await readFile(new URL('../../../wrangler.jsonc', import.meta.url), 'utf8')) as { ratelimits?: unknown[] }
    expect(wrangler.ratelimits).toEqual([{ name: 'OBSERVABILITY_RATE_LIMITER', namespace_id: '10001', simple: { limit: 30, period: 60 } }])
  })
})
