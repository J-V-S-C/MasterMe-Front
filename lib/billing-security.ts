import type { PaidBillingPlanId } from './api'

const PAID_PLANS = new Set<PaidBillingPlanId>(['ESSENTIAL', 'PRO'])
const CHECKOUT_KEY = /^[A-Za-z0-9._:-]{8,128}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type RequestedPlan = 'FREE' | PaidBillingPlanId
export type PaymentReturnReference = {
  orderId: string
  reference?: { transactionNsu: string; slug: string }
}

export function requestedPlan(search: Pick<URLSearchParams, 'getAll'>): RequestedPlan | null {
  const plans = search.getAll('plan')
  if (plans.length !== 1) return null
  if (plans[0] === 'FREE') return 'FREE'
  return PAID_PLANS.has(plans[0] as PaidBillingPlanId) ? plans[0] as PaidBillingPlanId : null
}

export function safeInfinitePayCheckoutUrl(candidate: string | null): string | null {
  if (!candidate) return null
  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'checkout.infinitepay.com.br') return null
    if (parsed.username || parsed.password || parsed.port) return null
    return parsed.toString()
  } catch {
    return null
  }
}

export function checkoutIntentKey(
  planId: PaidBillingPlanId,
  storage: Pick<Storage, 'getItem' | 'setItem'> = sessionStorage,
  createId: () => string = () => crypto.randomUUID(),
): string {
  const storageKey = `masterme:checkout-intent:${planId}`
  const existing = storage.getItem(storageKey)
  if (existing && existing.startsWith(`checkout.${planId}.`) && CHECKOUT_KEY.test(existing)) return existing
  const created = `checkout.${planId}.${createId()}`
  if (!CHECKOUT_KEY.test(created)) throw new Error('Não foi possível criar uma intenção de checkout segura.')
  storage.setItem(storageKey, created)
  return created
}

export function clearCheckoutIntent(planId: PaidBillingPlanId, storage: Pick<Storage, 'removeItem'> = sessionStorage): void {
  storage.removeItem(`masterme:checkout-intent:${planId}`)
}

export function paymentReturnReference(search: URLSearchParams): PaymentReturnReference | null {
  const allowed = new Set(['orderId', 'transaction_nsu', 'invoice_slug'])
  if ([...search.keys()].some((key) => !allowed.has(key))) return null
  const orderIds = search.getAll('orderId')
  const transactionNsus = search.getAll('transaction_nsu')
  const invoiceSlugs = search.getAll('invoice_slug')
  if (orderIds.length !== 1 || !UUID.test(orderIds[0])) return null
  if (transactionNsus.length === 0 && invoiceSlugs.length === 0) return { orderId: orderIds[0] }
  if (transactionNsus.length !== 1 || invoiceSlugs.length !== 1) return null
  const transactionNsu = transactionNsus[0].trim()
  const slug = invoiceSlugs[0].trim()
  if (!transactionNsu || transactionNsu.length > 160 || !slug || slug.length > 160) return null
  return { orderId: orderIds[0], reference: { transactionNsu, slug } }
}
