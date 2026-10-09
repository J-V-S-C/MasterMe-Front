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

describe('landing pública', () => {
  test('explica o produto, preços e natureza não recorrente', () => {
    const view = render(<LandingPage />)
    expect(view.getByRole('heading', { level: 1, name: /pare de apenas reler/i })).toBeTruthy()
    expect(view.getByText('R$ 0')).toBeTruthy()
    expect(view.getByText('R$ 29,90')).toBeTruthy()
    expect(view.getByText('R$ 249')).toBeTruthy()
    expect(view.getByText(/sem assinatura e sem renovação automática/i)).toBeTruthy()
    expect(view.getAllByText(/pagamento único/i).length).toBeGreaterThanOrEqual(2)
    expect(view.getByText('10 créditos por dia')).toBeTruthy()
    expect(view.getByText('120 créditos por dia')).toBeTruthy()
    expect(view.getByText('180 créditos por dia')).toBeTruthy()
    expect(view.getAllByText('Os limites diário e do período valem simultaneamente.')).toHaveLength(3)
    expect(marketingPlans.every((plan) => !plan.periodLimit.trimStart().startsWith('+'))).toBe(true)
  })

  test('alterna todo o conteúdo para inglês e persiste a preferência', async () => {
    const view = render(<LandingPage />)
    const language = view.getByRole('combobox', { name: 'Idioma' })

    fireEvent.change(language, { target: { value: 'en-US' } })

    expect(view.getByRole('heading', { level: 1, name: /stop merely rereading/i })).toBeTruthy()
    expect(view.getByRole('heading', { name: 'Frequently asked questions' })).toBeTruthy()
    expect(view.getAllByText('Daily and period limits apply simultaneously.')).toHaveLength(3)
    expect(view.queryByText('Perguntas frequentes')).toBeNull()
    expect(window.localStorage.getItem('masterme:locale')).toBe('en-US')
    expect(document.documentElement.lang).toBe('en-US')
  })

  test('restaura o idioma salvo sem autenticação ou SSE', async () => {
    window.localStorage.setItem('masterme:locale', 'en-US')
    const view = render(<LandingPage />)

    await waitFor(() => expect(view.getByRole('heading', { level: 1, name: /stop merely rereading/i })).toBeTruthy())
    expect(view.getByRole('combobox', { name: 'Language' })).toHaveProperty('value', 'en-US')
    expect(document.documentElement.lang).toBe('en-US')
  })

  test('botão de tema descreve a ação sem estado pressed contraditório', () => {
    const view = render(<LandingPage />)
    const toggle = view.getByRole('button', { name: 'Usar tema claro' })
    expect(toggle.hasAttribute('aria-pressed')).toBe(false)

    fireEvent.click(toggle)

    expect(view.getByRole('button', { name: 'Usar tema escuro' })).toBeTruthy()
    expect(window.localStorage.getItem('theme')).toBe('light')
  })

  test('CTAs carregam somente IDs conhecidos, sem preço no destino', () => {
    const view = render(<LandingPage />)
    const callsToAction = [...view.container.querySelectorAll<HTMLAnchorElement>('[data-plan-id]')]
    expect(new Set(callsToAction.map((link) => link.dataset.planId))).toEqual(new Set(['FREE', 'ESSENTIAL', 'PRO']))
    for (const link of callsToAction) {
      expect(link.href).toContain('/entrar?next=')
      expect(decodeURIComponent(link.href)).toContain(`plan=${link.dataset.planId}`)
      expect(link.href).not.toMatch(/29|249|1500|15000/)
    }
    expect(marketingPlans.map(({ id }) => id)).toEqual(['FREE', 'ESSENTIAL', 'PRO'])
  })

  test('não consulta sessão nem abre conexão em tempo real', () => {
    const fetch = mock(async () => new Response(null, { status: 500 }))
    const eventSource = mock(() => { throw new Error('SSE não deve abrir na landing') })
    globalThis.fetch = fetch as unknown as typeof globalThis.fetch
    globalThis.EventSource = eventSource as unknown as typeof EventSource
    render(<LandingPage />)
    expect(fetch).not.toHaveBeenCalled()
    expect(eventSource).not.toHaveBeenCalled()
  })
})
