import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/react'
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
  test('header tabs mirror the application destinations', () => {
    const view = render(<LandingPage />)
    const tabs = within(view.getByRole('navigation', { name: 'Seções da página' })).getAllByRole('link')

    expect(tabs.map((tab) => [tab.textContent, tab.getAttribute('href')])).toEqual([
      ['Estudar', '#estudar'],
      ['Tarefas', '#tarefas'],
      ['Analisar', '#mapa'],
      ['Criar', '#criar'],
    ])
    for (const target of ['#estudar', '#tarefas', '#mapa', '#criar', '#planos']) {
      expect(view.container.querySelector(target)).toBeTruthy()
    }
  })

  test('free launch shows only the usable free plan', () => {
    const view = render(<LandingPage />)
    expect(view.getByRole('heading', { level: 1, name: /organize o que estudar/i })).toBeTruthy()
    expect(view.getByRole('heading', { name: /comece grátis\. amplie só se precisar/i })).toBeTruthy()
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

    expect(view.getByRole('heading', { level: 1, name: /organize what to study/i })).toBeTruthy()
    expect(view.getByRole('heading', { name: 'Frequently asked questions' })).toBeTruthy()
    expect(view.getByText('100 credits per day')).toBeTruthy()
    expect(view.queryByText('Daily and period limits apply simultaneously.')).toBeNull()
    expect(view.queryByText('Perguntas frequentes')).toBeNull()
    expect(window.localStorage.getItem('masterme:locale')).toBe('en-US')
    expect(document.documentElement.lang).toBe('en-US')
  })

  test('explains the full loop, the map, the diagnosis, and the planning step', () => {
    const view = render(<LandingPage />)

    expect(view.getByRole('heading', { name: /quatro áreas\. o mesmo material/i })).toBeTruthy()
    expect(view.getByText('Reúna e explique')).toBeTruthy()
    expect(view.getByText('Planeje quando voltar')).toBeTruthy()
    expect(view.getByText('Veja a estrutura e a lacuna')).toBeTruthy()
    expect(view.getByText('Pratique a partir da lacuna')).toBeTruthy()

    expect(view.getByRole('heading', { name: /veja a estrutura\. depois, a lacuna/i })).toBeTruthy()
    expect(view.getByRole('figure', { name: 'Exemplo de mapa de conhecimento e diagnóstico' })).toBeTruthy()
    expect(view.getByText('Índice B-tree')).toBeTruthy()
    expect(view.getAllByText('Seletividade da consulta')).toHaveLength(2)
    expect(view.getByText('Ordem das colunas')).toBeTruthy()
    expect(view.getByText('Premissa omitida')).toBeTruthy()
    expect(view.getByText(/omitiu a ordem das colunas/i)).toBeTruthy()
    expect(view.getByText(/nenhum nó bloqueia o próximo/i)).toBeTruthy()
    expect(view.queryByText(/raft/i)).toBeNull()

    expect(view.getByRole('heading', { name: /decida o que estudar agora/i })).toBeTruthy()
    expect(view.getByText('Revisar índices compostos')).toBeTruthy()
    expect(view.getByText(/o calendário remarca/i)).toBeTruthy()

    expect(view.getByRole('heading', { name: /você escolhe a profundidade/i })).toBeTruthy()
    expect(view.getByText('Explorar e ancorar')).toBeTruthy()
    expect(view.getByText('Explicar com diagnóstico')).toBeTruthy()
    expect(view.getByText('Testar um caso-limite')).toBeTruthy()
    expect(view.getByText('Projeto de prática')).toBeTruthy()
    expect(view.getByText(/sem revogar a aprovação/i)).toBeTruthy()
    expect(view.getByRole('heading', { name: /da lacuna ao projeto/i })).toBeTruthy()
    expect(view.getByRole('figure', { name: 'Exemplo de brief de prática' })).toBeTruthy()
    expect(view.getByText('Índices compostos em consultas reais')).toBeTruthy()
    expect(view.getByText(/sem solução enviada/i)).toBeTruthy()
    expect(view.getByText('Quem acessa o meu material?')).toBeTruthy()
  })

  test('translates the loop, map story, tasks, and paths to English', () => {
    const view = render(<LandingPage />)
    fireEvent.change(view.getByRole('combobox', { name: 'Idioma' }), { target: { value: 'en-US' } })

    expect(view.getByRole('heading', { name: /four areas\. the same material/i })).toBeTruthy()
    expect(view.getByRole('heading', { name: /see the structure\. then the gap/i })).toBeTruthy()
    expect(view.getByRole('figure', { name: 'Knowledge map and diagnostic example' })).toBeTruthy()
    expect(view.getByText('B-tree index')).toBeTruthy()
    expect(view.getByText('Omitted premise')).toBeTruthy()
    expect(view.getByText(/left out the column order/i)).toBeTruthy()
    expect(view.getByText(/no node blocks the next one/i)).toBeTruthy()
    expect(view.getByRole('heading', { name: /decide what to study now/i })).toBeTruthy()
    expect(view.getByText('Review composite indexes')).toBeTruthy()
    expect(view.getByRole('heading', { name: /you choose the depth/i })).toBeTruthy()
    expect(view.getByText('Explore and anchor')).toBeTruthy()
    expect(view.getByText('Test an edge case')).toBeTruthy()
    expect(view.getByText(/without revoking the approval/i)).toBeTruthy()
    expect(view.getByRole('heading', { name: /from gap to project/i })).toBeTruthy()
    expect(view.getByRole('figure', { name: 'Practice brief example' })).toBeTruthy()
    expect(view.getByText('Composite indexes in real queries')).toBeTruthy()
    expect(within(view.getByRole('navigation', { name: 'Page sections' })).getAllByRole('link').map((tab) => tab.textContent)).toEqual([
      'Study',
      'Tasks',
      'Analyze',
      'Create',
    ])
    expect(view.getByText('Who can access my material?')).toBeTruthy()
  })

  test('restores the saved locale without authentication or SSE', async () => {
    window.localStorage.setItem('masterme:locale', 'en-US')
    const view = render(<LandingPage />)

    await waitFor(() => expect(view.getByRole('heading', { level: 1, name: /organize what to study/i })).toBeTruthy())
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
