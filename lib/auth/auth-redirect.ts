import { paymentReturnReference } from '../billing/billing-security'

export const PLAN_IDS = ['FREE', 'ESSENTIAL', 'PRO'] as const

export type PlanId = (typeof PLAN_IDS)[number]

const defaultDestination = '/study'
const allowedDestinations = new Set([
  '/study',
  '/library',
  '/knowledge-map',
  '/practice',
  '/payment/return',
])
const allowedPlans = new Set<string>(PLAN_IDS)
const internalOrigin = 'https://masterme.internal'
const safeIdentifier = /^[A-Za-z0-9_-]{1,128}$/
const allowedQueryKeys: Record<string, readonly string[]> = {
  '/study': ['material', 'concept', 'unit', 'review', 'record', 'source', 'plan'],
  '/practice': ['material', 'concept', 'project'],
  '/knowledge-map': ['material'],
  '/library': [],
}

export function safeInternalDestination(candidate: string | null | undefined): string {
  if (!candidate) return defaultDestination

  try {
    const parsed = new URL(candidate, internalOrigin)
    if (parsed.origin !== internalOrigin || !allowedDestinations.has(parsed.pathname)) {
      return defaultDestination
    }

    if (parsed.pathname === '/payment/return') {
      const payment = paymentReturnReference(parsed.searchParams)
      if (!payment) return defaultDestination
      const query = new URLSearchParams({ orderId: payment.orderId })
      if (payment.reference) {
        query.set('transaction_nsu', payment.reference.transactionNsu)
        query.set('invoice_slug', payment.reference.slug)
      }
      return `${parsed.pathname}?${query}`
    }

    if (parsed.search.length > 512) return defaultDestination
    const permitted = allowedQueryKeys[parsed.pathname] ?? []
    const query = new URLSearchParams()
    for (const [key, value] of parsed.searchParams) {
      if (!permitted.includes(key) || query.has(key)) return defaultDestination
      if (key === 'plan' ? !allowedPlans.has(value) : key === 'record' || key === 'source' ? value !== '1' : !safeIdentifier.test(value)) return defaultDestination
      query.set(key, value)
    }
    return query.size ? `${parsed.pathname}?${query}` : parsed.pathname
  } catch {
    return defaultDestination
  }
}

export function loginHrefFor(destination: string): string {
  return `/login?next=${encodeURIComponent(safeInternalDestination(destination))}`
}

export function planLoginHref(planId: PlanId): string {
  return loginHrefFor(`/study?plan=${planId}`)
}
