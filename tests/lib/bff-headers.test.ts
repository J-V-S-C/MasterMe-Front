import { describe, expect, test } from 'bun:test'
import { buildBackendHeaders, InvalidProxyHeaderError } from '../../lib/server/bff-headers'

describe('BFF header allowlist', () => {
  test('forwards Idempotency-Key only to authenticated checkout', () => {
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

  test('rejects missing or invalid keys before reaching the backend', () => {
    expect(() => buildBackendHeaders(new Request('https://masterme.test/api/billing/checkouts', { method: 'POST' }), 'token', ['billing', 'checkouts'])).toThrow(InvalidProxyHeaderError)
    expect(() => buildBackendHeaders(new Request('https://masterme.test/api/billing/checkouts', { method: 'POST', headers: { 'idempotency-key': 'bad key' } }), 'token', ['billing', 'checkouts'])).toThrow(InvalidProxyHeaderError)
  })
})
