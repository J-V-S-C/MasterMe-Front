import { describe, expect, test } from 'bun:test'
import { checkoutIntentKey, clearCheckoutIntent, paymentReturnReference, requestedPlan, safeInfinitePayCheckoutUrl } from '../../lib/billing-security'

const memoryStorage = () => {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
  }
}

describe('checkout security', () => {
  test('accepts only a known single plan', () => {
    expect(requestedPlan(new URLSearchParams('plan=FREE'))).toBe('FREE')
    expect(requestedPlan(new URLSearchParams('plan=PRO'))).toBe('PRO')
    expect(requestedPlan(new URLSearchParams('plan=PRO&plan=ESSENTIAL'))).toBeNull()
    expect(requestedPlan(new URLSearchParams('plan=ENTERPRISE'))).toBeNull()
  })

  test('allows only HTTPS navigation to the exact InfinitePay host', () => {
    expect(safeInfinitePayCheckoutUrl('https://checkout.infinitepay.com.br/masterme?lenc=safe')).toBe('https://checkout.infinitepay.com.br/masterme?lenc=safe')
    expect(safeInfinitePayCheckoutUrl('https://checkout.infinitepay.com.br.evil.test/steal')).toBeNull()
    expect(safeInfinitePayCheckoutUrl('https://evil.test/?next=https://checkout.infinitepay.com.br')).toBeNull()
    expect(safeInfinitePayCheckoutUrl('http://checkout.infinitepay.com.br/insecure')).toBeNull()
    expect(safeInfinitePayCheckoutUrl('javascript:alert(1)')).toBeNull()
  })

  test('reuses an intent only for the same plan and allows closing it', () => {
    const storage = memoryStorage()
    const essential = checkoutIntentKey('ESSENTIAL', storage as Storage, () => '11111111-1111-4111-8111-111111111111')
    expect(checkoutIntentKey('ESSENTIAL', storage as Storage, () => 'never-used')).toBe(essential)
    expect(checkoutIntentKey('PRO', storage as Storage, () => '22222222-2222-4222-8222-222222222222')).not.toBe(essential)
    clearCheckoutIntent('ESSENTIAL', storage as Storage)
    expect(checkoutIntentKey('ESSENTIAL', storage as Storage, () => '33333333-3333-4333-8333-333333333333')).not.toBe(essential)
  })

  test('validates return without accepting partial parameters or references', () => {
    const orderId = '11111111-1111-4111-8111-111111111111'
    expect(paymentReturnReference(new URLSearchParams({ orderId }))).toEqual({ orderId })
    expect(paymentReturnReference(new URLSearchParams({ orderId, transaction_nsu: 'tx', invoice_slug: 'invoice' }))).toEqual({ orderId, reference: { transactionNsu: 'tx', slug: 'invoice' } })
    expect(paymentReturnReference(new URLSearchParams({ orderId, transaction_nsu: 'tx' }))).toBeNull()
    expect(paymentReturnReference(new URLSearchParams({ orderId, next: 'https://evil.test' }))).toBeNull()
    expect(paymentReturnReference(new URLSearchParams({ orderId: 'not-a-uuid' }))).toBeNull()
  })
})
