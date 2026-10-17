import { describe, expect, test } from 'bun:test'
import { ApiError, type BillingOrder } from './api'
import { reconcilePaymentReturn } from './payment-return'

const paidOrder: BillingOrder = { id: '11111111-1111-4111-8111-111111111111', planId: 'PRO', amountInCents: 24_900, status: 'PAID', checkoutUrl: null, createdAt: '', updatedAt: '' }
const payment = { orderId: paidOrder.id }

describe('InfinitePay return state', () => {
  test('shows success only when the server returns PAID and updates the balance', async () => {
    let refreshed = 0
    expect(await reconcilePaymentReturn(payment, async () => paidOrder, async () => { refreshed += 1 })).toEqual({ status: 'success', order: paidOrder })
    expect(refreshed).toBe(1)
  })

  test('keeps payment pending without granting access after negative confirmation or rate limit', async () => {
    const notConfirmed = () => Promise.reject(new ApiError('pending', 409, 'PAYMENT_NOT_CONFIRMED'))
    const limited = () => Promise.reject(new ApiError('limited', 429, 'RATE_LIMITED'))
    await expect(reconcilePaymentReturn(payment, notConfirmed, async () => undefined)).resolves.toEqual({ status: 'pending', order: null })
    await expect(reconcilePaymentReturn(payment, limited, async () => undefined)).resolves.toEqual({ status: 'pending', order: null })
  })

  test('fails closed for unrecognized errors', async () => {
    await expect(reconcilePaymentReturn(payment, async () => { throw new Error('network') }, async () => undefined)).resolves.toEqual({ status: 'error', order: null })
  })
})
