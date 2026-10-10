import { describe, expect, test } from 'bun:test'
import { buildBackendHeaders, InvalidProxyHeaderError } from './bff-headers'

describe('allowlist de headers do BFF', () => {
  test('encaminha Idempotency-Key somente ao checkout autenticado', () => {
    const request = new Request('https://masterme.test/api/billing/checkouts', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': 'checkout.PRO.safe-key', cookie: 'secret=never-forward' },
    })
    const checkout = buildBackendHeaders(request, 'access-token', ['billing', 'checkouts'])
    expect(checkout.get('idempotency-key')).toBe('checkout.PRO.safe-key')
    expect(checkout.get('authorization')).toBe('Bearer access-token')
    expect(checkout.get('cookie')).toBeNull()

    const otherRoute = buildBackendHeaders(request, 'access-token', ['materials'])
    expect(otherRoute.get('idempotency-key')).toBeNull()
  })

  test('rejeita chave ausente ou fora do contrato antes do backend', () => {
    expect(() => buildBackendHeaders(new Request('https://masterme.test/api/billing/checkouts', { method: 'POST' }), 'token', ['billing', 'checkouts'])).toThrow(InvalidProxyHeaderError)
    expect(() => buildBackendHeaders(new Request('https://masterme.test/api/billing/checkouts', { method: 'POST', headers: { 'idempotency-key': 'bad key' } }), 'token', ['billing', 'checkouts'])).toThrow(InvalidProxyHeaderError)
  })
})
