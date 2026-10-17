import { ApiError, type BillingOrder } from './api'
import type { PaymentReturnReference } from './billing-security'

export type PaymentReturnState =
  | { status: 'success'; order: BillingOrder }
  | { status: 'pending'; order: BillingOrder | null }
  | { status: 'error'; order: null }

const pendingCodes = new Set(['PAYMENT_NOT_CONFIRMED', 'PAYMENT_REFERENCE_REQUIRED'])

export async function reconcilePaymentReturn(
  payment: PaymentReturnReference,
  reconcile: (orderId: string, reference?: { transactionNsu: string; slug: string }) => Promise<BillingOrder>,
  refreshBalance: () => Promise<void>,
): Promise<PaymentReturnState> {
  try {
    const order = await reconcile(payment.orderId, payment.reference)
    await refreshBalance().catch(() => undefined)
    if (order.status === 'PAID') return { status: 'success', order }
    if (order.status === 'PENDING' || order.status === 'CHECKOUT_READY') return { status: 'pending', order }
    return { status: 'error', order: null }
  } catch (error) {
    await refreshBalance().catch(() => undefined)
    if (error instanceof ApiError && (pendingCodes.has(error.code ?? '') || error.status === 429)) {
      return { status: 'pending', order: null }
    }
    return { status: 'error', order: null }
  }
}
