import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { Window } from 'happy-dom'
import { LandingPage, marketingPlans } from './landing-page'

const originalFetch = globalThis.fetch
const originalEventSource = globalThis.EventSource

beforeEach(() => {
  const window = new Window({ url: 'https://masterme.test/' })
  Object.assign(globalThis, {
    window,
    document: window.document,
    navigator: window.navigator,
    localStorage: window.localStorage,
  })
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }) })
})

afterEach(() => {
  cleanup()
  globalThis.fetch = originalFetch
  globalThis.EventSource = originalEventSource
})

describe('public landing page', () => {
  test('free launch shows only the usable free plan', () => {
    const view = render(<LandingPage />)
    expect(view.getByRole('heading', { level: 1, name: /pare de apenas reler/i })).toBeTruthy()
    expect(view.getByText('R$ 0')).toBeTruthy()
    expect(view.queryByText('R$ 29,90')).toBeNull()
    expect(view.queryByText('R$ 249')).toBeNull()
    expect(view.getByText('100 créditos por dia')).toBeTruthy()
    expect(view.queryByText(/créditos por mês/)).toBeNull()
    expect(view.queryByText('Os limites diário e do período valem simultaneamente.')).toBeNull()
    expect(marketingPlans.every((plan) => !plan.periodLimit.trimStart().startsWith('+'))).toBe(true)
  })

  test('paid plans remain available when payments are explicitly enabled', () => {
    const view = render(<LandingPage paymentsEnabled />)
    expect(view.getByText('R$ 29,90')).toBeTruthy()
    expect(view.getByText('R$ 249')).toBeTruthy()
    expect(view.getByText(/sem assinatura e sem renovação automática/i)).toBeTruthy()
  })

  test('switches all content to English and persists the preference', async () => {
    const view = render(<LandingPage />)
    const language = view.getByRole('combobox', { name: 'Idioma' })

    fireEvent.change(language, { target: { value: 'en-US' } })

    expect(view.getByRole('heading', { level: 1, name: /stop merely rereading/i })).toBeTruthy()
    expect(view.getByRole('heading', { name: 'Frequently asked questions' })).toBeTruthy()
    expect(view.getByText('100 credits per day')).toBeTruthy()
    expect(view.queryByText('Daily and period limits apply simultaneously.')).toBeNull()
    expect(view.queryByText('Perguntas frequentes')).toBeNull()
    expect(window.localStorage.getItem('masterme:locale')).toBe('en-US')
    expect(document.documentElement.lang).toBe('en-US')
  })

  test('shows the problem, diagnosis and unrestricted study paths on the map', () => {
    const view = render(<LandingPage />)

    expect(view.getByRole('heading', { name: /ler até reconhecer não é o mesmo/i })).toBeTruthy()
    expect(view.getByRole('heading', { level: 3, name: 'Explique ou construa' })).toBeTruthy()
    expect(view.getByText(/gere um projeto de prática diretamente do material/i)).toBeTruthy()
    expect(view.getByText(/você lembra da frase. mas consegue sustentar a ideia/i)).toBeTruthy()
    expect(view.getByRole('figure', { name: 'Demonstração de um mapa de conhecimento' })).toBeTruthy()
    expect(view.getByText(/as conexões ajudam você a investigar; elas nunca bloqueiam/i)).toBeTruthy()
    expect(view.getByText('Explorar livremente')).toBeTruthy()
    expect(view.getByText('Explicar com suas palavras')).toBeTruthy()
    expect(view.getByText('Começar pela prática')).toBeTruthy()
    expect(view.getByText(/sem iniciar uma explicação/i)).toBeTruthy()
    expect(view.getByText('Testar um caso-limite')).toBeTruthy()
    expect(view.getByText(/após uma explicação aprovada.*solicite.*nunca por obrigação/i)).toBeTruthy()
  })

  test('translates the map story and paths to English', () => {
    const view = render(<LandingPage />)
    fireEvent.change(view.getByRole('combobox', { name: 'Idioma' }), { target: { value: 'en-US' } })

    expect(view.getByRole('heading', { name: /recognizing a sentence is not the same/i })).toBeTruthy()
    expect(view.getByRole('heading', { level: 3, name: 'Explain or build' })).toBeTruthy()
    expect(view.getByText(/generate a practice project directly from the material/i)).toBeTruthy()
    expect(view.getByRole('figure', { name: 'Knowledge map demonstration' })).toBeTruthy()
    expect(view.getByText('Explore freely')).toBeTruthy()
    expect(view.getByText('Start with practice')).toBeTruthy()
    expect(view.getByText(/without starting an explanation/i)).toBeTruthy()
    expect(view.getByText('Test an edge case')).toBeTruthy()
    expect(view.getByText(/after an approved explanation.*request.*never because you have to/i)).toBeTruthy()
  })

  test('restores the saved locale without authentication or SSE', async () => {
    window.localStorage.setItem('masterme:locale', 'en-US')
    const view = render(<LandingPage />)

    await waitFor(() => expect(view.getByRole('heading', { level: 1, name: /stop merely rereading/i })).toBeTruthy())
    expect(view.getByRole('combobox', { name: 'Language' })).toHaveProperty('value', 'en-US')
    expect(document.documentElement.lang).toBe('en-US')
  })

  test('theme button describes its action without contradictory pressed state', () => {
    const view = render(<LandingPage />)
    const toggle = view.getByRole('button', { name: 'Usar tema claro' })
    expect(toggle.hasAttribute('aria-pressed')).toBe(false)

    fireEvent.click(toggle)

    expect(view.getByRole('button', { name: 'Usar tema escuro' })).toBeTruthy()
    expect(window.localStorage.getItem('theme')).toBe('light')
  })

  test('CTAs carry only known IDs without prices in the destination', () => {
    const view = render(<LandingPage />)
    const callsToAction = [...view.container.querySelectorAll<HTMLAnchorElement>('[data-plan-id]')]
    expect(new Set(callsToAction.map((link) => link.dataset.planId))).toEqual(new Set(['FREE']))
    for (const link of callsToAction) {
      expect(link.href).toContain('/entrar?next=')
      expect(decodeURIComponent(link.href)).toContain(`plan=${link.dataset.planId}`)
      expect(link.href).not.toMatch(/29|249|1500|15000/)
    }
    expect(marketingPlans.map(({ id }) => id)).toEqual(['FREE', 'ESSENTIAL', 'PRO'])
  })

  test('does not fetch a session or open a real-time connection', () => {
    const fetch = mock(async () => new Response(null, { status: 500 }))
    const eventSource = mock(() => { throw new Error('SSE must not open on the landing page') })
    globalThis.fetch = fetch as unknown as typeof globalThis.fetch
    globalThis.EventSource = eventSource as unknown as typeof EventSource
    render(<LandingPage />)
    expect(fetch).not.toHaveBeenCalled()
    expect(eventSource).not.toHaveBeenCalled()
  })
})
