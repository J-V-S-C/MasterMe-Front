import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Window } from 'happy-dom'
import { configureClientObservability, deterministicSample, normalizeClientRoute, parseClientTelemetry, reportApiRequest, reportWebVital } from './client-observability'

const originalFetch = globalThis.fetch
const originalWindow = globalThis.window
const originalDocument = globalThis.document
const originalNavigator = globalThis.navigator
let originalBeacon: typeof navigator.sendBeacon
beforeEach(() => {
  const browser = new Window({ url: 'https://masterme.test/' })
  Object.assign(globalThis, { window: browser, document: browser.document, navigator: browser.navigator })
  originalBeacon = navigator.sendBeacon
  configureClientObservability('abc1234')
})
afterEach(() => {
  globalThis.fetch = originalFetch
  Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: originalBeacon })
  window.history.replaceState({}, '', '/')
  Object.assign(globalThis, { window: originalWindow, document: originalDocument, navigator: originalNavigator })
})

describe('telemetria privada do cliente', () => {
  test('normaliza somente rotas allowlisted e nunca preserva query', () => {
    expect(normalizeClientRoute('/estudar/')).toBe('/estudar')
    expect(normalizeClientRoute('/estudar?email=person@example.com')).toBeNull()
    expect(normalizeClientRoute('/materials/11111111-1111-4111-8111-111111111111')).toBeNull()
  })

  test('aceita somente o schema fechado e arredonda o valor', () => {
    expect(parseClientTelemetry({ kind: 'web_vital', name: 'LCP', rating: 'good', value: 1234.56789, route: '/estudar', build: 'abc1234' })).toEqual({ kind: 'web_vital', name: 'LCP', rating: 'good', value: 1234.568, route: '/estudar', build: 'abc1234' })
    expect(parseClientTelemetry({ kind: 'client_error', errorType: 'render', route: '/', build: 'abc1234', email: 'person@example.com' })).toBeNull()
    expect(parseClientTelemetry({ kind: 'web_vital', name: 'CUSTOM', rating: 'good', value: 1, route: '/', build: 'abc1234' })).toBeNull()
  })

  test('amostragem é determinística e o envio omite id, query e PII', () => {
    expect(deterministicSample('same-key', 0.1)).toBe(deterministicSample('same-key', 0.1))
    const payloads: string[] = []
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: (_url: string, data: Blob) => { void data.text().then((body) => payloads.push(body)); return true } })
    window.history.replaceState({}, '', '/estudar?email=person@example.com')
    let seed = 0
    while (!deterministicSample(String(seed), 0.1)) seed += 1
    window.sessionStorage.setItem('masterme:observability-sample', String(seed))
    reportWebVital({ name: 'LCP', rating: 'good', value: 1200, id: 'ephemeral-vital-id' }, 'abc1234')
    return Bun.sleep(5).then(() => {
      expect(payloads).toHaveLength(1)
      expect(JSON.parse(payloads[0] ?? '{}')).not.toHaveProperty('id')
      expect(payloads[0]).not.toContain('person@example.com')
      expect(payloads[0]).not.toContain('?')
    })
  })

  test('fallback usa fetch sem credenciais somente quando beacon recusa', async () => {
    let seed = 0
    while (!deterministicSample(String(seed), 0.1)) seed += 1
    window.sessionStorage.setItem('masterme:observability-sample', String(seed))
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false })
    let captured: { url?: string; init?: RequestInit } = {}
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      captured = { url: String(url), init }
      return new Response(null, { status: 202 })
    }) as typeof fetch

    reportApiRequest('server_error', 'abc1234')
    await Bun.sleep(1)

    expect(captured.url).toBe('/api/observability')
    expect(captured.init?.credentials).toBe('omit')
    expect(captured.init?.keepalive).toBe(true)
  })
})
