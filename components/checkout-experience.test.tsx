import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { Window } from 'happy-dom'
import { CheckoutExperience } from './checkout-experience'
import { I18nProvider } from '../lib/i18n'
import { invalidateApiCache } from '../lib/api'

const originalFetch = globalThis.fetch
const catalog = { currency: 'BRL', billingType: 'ONE_TIME', plans: [
  { id: 'FREE', name: 'Gratuito', priceInCents: 0, durationDays: null, dailyCreditLimit: 10, periodCreditLimit: 120 },
  { id: 'ESSENTIAL', name: 'Essencial', priceInCents: 2_990, durationDays: 30, dailyCreditLimit: 120, periodCreditLimit: 1_500 },
  { id: 'PRO', name: 'Pro', priceInCents: 24_900, durationDays: 365, dailyCreditLimit: 180, periodCreditLimit: 15_000 },
], creditWeights: {}, fallbackPolicy: '' }

beforeEach(() => {
  const window = new Window({ url: 'https://masterme.test/estudar' })
  Object.defineProperty(window.navigator, 'sendBeacon', { configurable: true, value: () => true })
  Object.assign(globalThis, { window, document: window.document, navigator: window.navigator, localStorage: window.localStorage, sessionStorage: window.sessionStorage, crypto: window.crypto })
})
afterEach(() => { cleanup(); invalidateApiCache(); globalThis.fetch = originalFetch })

describe('checkout autenticado', () => {
  test('duplo clique cria um único checkout e navega para InfinitePay validada', async () => {
    let checkoutCalls = 0
    globalThis.fetch = (async (url: string) => {
      if (url === '/api/billing/catalog') return new Response(JSON.stringify({ data: catalog }), { status: 200 })
      checkoutCalls += 1
      return new Response(JSON.stringify({ data: { id: '11111111-1111-4111-8111-111111111111', planId: 'PRO', amountInCents: 24_900, status: 'CHECKOUT_READY', checkoutUrl: 'https://checkout.infinitepay.com.br/masterme?lenc=safe', createdAt: '', updatedAt: '' } }), { status: 201 })
    }) as typeof fetch
    const navigations: string[] = []
    const view = render(<I18nProvider><CheckoutExperience plan="PRO" navigate={(url) => navigations.push(url)} /></I18nProvider>)
    const button = await view.findByRole('button', { name: 'Continuar para a InfinitePay' })
    await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false))
    fireEvent.click(button); fireEvent.click(button)
    await waitFor(() => expect(navigations).toEqual(['https://checkout.infinitepay.com.br/masterme?lenc=safe']))
    expect(checkoutCalls).toBe(1)
    expect(sessionStorage.getItem('masterme:checkout-intent:PRO')).toMatch(/^checkout\.PRO\./)
  })

  test('não navega quando o backend devolve URL maliciosa', async () => {
    globalThis.fetch = (async (url: string) => url === '/api/billing/catalog'
      ? new Response(JSON.stringify({ data: catalog }), { status: 200 })
      : new Response(JSON.stringify({ data: { id: '1', planId: 'ESSENTIAL', amountInCents: 2_990, status: 'CHECKOUT_READY', checkoutUrl: 'https://evil.test/steal', createdAt: '', updatedAt: '' } }), { status: 201 })) as unknown as typeof fetch
    const navigations: string[] = []
    const view = render(<I18nProvider><CheckoutExperience plan="ESSENTIAL" navigate={(url) => navigations.push(url)} /></I18nProvider>)
    const button = await view.findByRole('button', { name: 'Continuar para a InfinitePay' })
    await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false))
    fireEvent.click(button)
    await view.findByRole('alert')
    expect(navigations).toEqual([])
  })

  test('FREE abre o produto sem catálogo ou checkout', () => {
    let calls = 0
    globalThis.fetch = (async () => { calls += 1; return new Response() }) as unknown as typeof fetch
    const view = render(<I18nProvider><CheckoutExperience plan="FREE" /></I18nProvider>)
    expect(view.container.textContent).toBe('')
    expect(calls).toBe(0)
  })

  test('mantém o foco dentro do diálogo e fecha com Escape', async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ data: catalog }), { status: 200 })) as unknown as typeof fetch
    const view = render(<I18nProvider><CheckoutExperience plan="ESSENTIAL" /></I18nProvider>)
    const dialog = await view.findByRole('dialog')
    const title = view.getByRole('heading', { name: /Confirmar acesso · Essencial/ })
    const continueButton = await view.findByRole('button', { name: 'Continuar para a InfinitePay' })
    const cancelButton = view.getByRole('button', { name: 'Agora não' })
    await waitFor(() => expect(document.activeElement).toBe(title))

    fireEvent.keyDown(window, { key: 'Tab' })
    expect(document.activeElement).toBe(continueButton)
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(cancelButton)
    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(dialog.isConnected).toBe(false))
  })
})
