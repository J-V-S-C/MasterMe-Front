import { describe, expect, test } from 'bun:test'
import { loginHrefFor, planLoginHref, safeInternalDestination } from './auth-redirect'
import { isPublicPage } from './public-routes'

describe('internal authentication redirects', () => {
  test('preserves only known destinations and plans', () => {
    expect(safeInternalDestination('/study')).toBe('/study')
    expect(safeInternalDestination('/library')).toBe('/library')
    expect(safeInternalDestination('/knowledge-map')).toBe('/knowledge-map')
    expect(safeInternalDestination('/practice')).toBe('/practice')
    expect(safeInternalDestination('/study?plan=ESSENTIAL')).toBe('/study?plan=ESSENTIAL')
    expect(safeInternalDestination('/payment/return?orderId=11111111-1111-4111-8111-111111111111')).toBe('/payment/return?orderId=11111111-1111-4111-8111-111111111111')
  })

  test('rejects external origin, protocol-relative URLs, plans and unknown parameters', () => {
    expect(safeInternalDestination('https://example.com/study')).toBe('/study')
    expect(safeInternalDestination('//example.com/study')).toBe('/study')
    expect(safeInternalDestination('javascript:alert(1)')).toBe('/study')
    expect(safeInternalDestination('/study?plan=UNLIMITED')).toBe('/study')
    expect(safeInternalDestination('/study?plan=FREE&plan=PRO')).toBe('/study')
    expect(safeInternalDestination('/study?returnTo=https://example.com')).toBe('/study')
    expect(safeInternalDestination('/payment/return?orderId=invalid')).toBe('/study')
    expect(safeInternalDestination('/payment/return?orderId=11111111-1111-4111-8111-111111111111&next=https://example.com')).toBe('/study')
  })

  test('builds CTA using only the plan identifier', () => {
    expect(decodeURIComponent(planLoginHref('PRO'))).toBe('/login?next=/study?plan=PRO')
    expect(loginHrefFor('/practice')).toBe('/login?next=%2Fpractice')
  })
})

describe('public routes', () => {
  test('keeps only acquisition and authentication outside the gate', () => {
    expect(isPublicPage('/')).toBe(true)
    expect(isPublicPage('/login')).toBe(true)
    expect(isPublicPage('/auth/callback')).toBe(true)
    expect(isPublicPage('/study')).toBe(false)
    expect(isPublicPage('/library')).toBe(false)
    expect(isPublicPage('/knowledge-map')).toBe(false)
    expect(isPublicPage('/practice')).toBe(false)
  })
})
