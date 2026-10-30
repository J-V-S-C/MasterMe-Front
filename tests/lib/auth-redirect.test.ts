import { describe, expect, test } from 'bun:test'
import { loginHrefFor, planLoginHref, safeInternalDestination } from '../../lib/auth/auth-redirect'
import { isPublicPage } from '../../lib/auth/public-routes'

describe('internal authentication redirects', () => {
  test('preserves known destinations, plans, and product deep links', () => {
    expect(safeInternalDestination('/study')).toBe('/study')
    expect(safeInternalDestination('/library')).toBe('/library')
    expect(safeInternalDestination('/knowledge-map')).toBe('/knowledge-map')
    expect(safeInternalDestination('/practice')).toBe('/practice')
    expect(safeInternalDestination('/study?plan=ESSENTIAL')).toBe('/study?plan=ESSENTIAL')
    expect(safeInternalDestination('/study?material=book-1&concept=idea-2&review=review-3')).toBe('/study?material=book-1&concept=idea-2&review=review-3')
    expect(safeInternalDestination('/study?record=1&material=book-1')).toBe('/study?record=1&material=book-1')
    expect(safeInternalDestination('/practice?material=book-1&project=project-2')).toBe('/practice?material=book-1&project=project-2')
    expect(safeInternalDestination('/knowledge-map?material=book-1')).toBe('/knowledge-map?material=book-1')
    expect(safeInternalDestination('/payment/return?orderId=11111111-1111-4111-8111-111111111111')).toBe('/payment/return?orderId=11111111-1111-4111-8111-111111111111')
  })

  test('rejects external origin, protocol-relative URLs, plans and unknown parameters', () => {
    expect(safeInternalDestination('https://example.com/study')).toBe('/study')
    expect(safeInternalDestination('//example.com/study')).toBe('/study')
    expect(safeInternalDestination('javascript:alert(1)')).toBe('/study')
    expect(safeInternalDestination('/study?plan=UNLIMITED')).toBe('/study')
    expect(safeInternalDestination('/study?plan=FREE&plan=PRO')).toBe('/study')
    expect(safeInternalDestination('/study?returnTo=https://example.com')).toBe('/study')
    expect(safeInternalDestination('/study?material=https%3A%2F%2Fexample.com')).toBe('/study')
    expect(safeInternalDestination('/study?material=one&material=two')).toBe('/study')
    expect(safeInternalDestination('/library?material=book-1')).toBe('/study')
    expect(safeInternalDestination('/payment/return?orderId=invalid')).toBe('/study')
    expect(safeInternalDestination('/payment/return?orderId=11111111-1111-4111-8111-111111111111&next=https://example.com')).toBe('/study')
  })

  test('builds CTA using only the plan identifier', () => {
    expect(decodeURIComponent(planLoginHref('PRO'))).toBe('/login?next=/study?plan=PRO')
    expect(loginHrefFor('/practice')).toBe('/login?next=%2Fpractice')
    expect(loginHrefFor('/study?material=book-1&concept=idea-2')).toBe('/login?next=%2Fstudy%3Fmaterial%3Dbook-1%26concept%3Didea-2')
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
