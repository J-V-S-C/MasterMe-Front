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
      ['Estudar', '#study'],
      ['Tarefas', '#tasks'],
      ['Analisar', '#analyze'],
      ['Criar', '#create'],
    ])
    const footerNav = view.getByRole('navigation', { name: 'Navegação do rodapé' })
    const footerLinks = within(footerNav).getAllByRole('link')
    expect(footerLinks.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ...tabs.map((tab) => [tab.textContent, tab.getAttribute('href')]),
    ])
    expect(footerNav.className).toBe(view.getByRole('navigation', { name: 'Seções da página' }).className)
    expect(footerLinks.every((link) => link.querySelector('svg'))).toBe(true)
    const footer = view.container.querySelector('footer')
    const mobileNav = view.getByRole('navigation', { name: 'Menu de seções', hidden: true })
    expect(within(mobileNav).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['#study', '#tasks', '#analyze', '#create'])
    expect(view.container.querySelector('header a[href="#plans"]')).toBeNull()
    expect(view.queryByText('Ambiente pessoal de aprendizagem para autodidatas técnicos')).toBeNull()
    expect(footer?.querySelector('a[href="#plans"]')?.textContent).toBe('Planos')
    expect(footer?.querySelector('a[href="/login"]')?.textContent).toBe('Entrar')
    expect(view.queryByText('Conceito ativo')).toBeNull()
    for (const target of ['#study', '#tasks', '#analyze', '#create', '#plans']) {
      expect(view.container.querySelector(target)).toBeTruthy()
    }
  })

  test('mobile menu keeps every section and closes after a section is chosen', () => {
    const view = render(<LandingPage />)
    const menu = view.container.querySelector<HTMLDetailsElement>('header details')!
    const links = within(menu).getAllByRole('link', { hidden: true })
    expect(links.slice(0, 4).map((link) => link.getAttribute('href'))).toEqual(['#study', '#tasks', '#analyze', '#create'])
    expect(links[4]?.getAttribute('href')?.startsWith('/login')).toBe(true)
    expect(within(menu).getByRole('combobox', { name: 'Idioma', hidden: true })).toBeTruthy()
    expect(within(menu).getByRole('button', { name: 'Usar tema claro', hidden: true })).toBeTruthy()

    menu.setAttribute('open', '')
    fireEvent.click(links[1]!)
    expect(menu.hasAttribute('open')).toBe(false)
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
    const language = within(view.container.querySelector('footer')!).getByRole('combobox', { name: 'Idioma' })

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
    expect(view.getByText('Veja o que você entendeu')).toBeTruthy()
    expect(view.getByText('Crie um projeto para praticar')).toBeTruthy()

    expect(view.getByRole('heading', { name: /veja como os assuntos se ligam/i })).toBeTruthy()
    expect(view.getByRole('figure', { name: 'Exemplo de mapa de conhecimento e diagnóstico' })).toBeTruthy()
    expect(view.getByText('Índices no banco de dados')).toBeTruthy()
    expect(view.getAllByText('Índice com duas colunas')).toHaveLength(2)
    expect(view.getByText('Busca por cliente ou por data')).toBeTruthy()
    expect(view.getByText(/não explicou por que a ordem das colunas importa/i)).toBeTruthy()
    expect(view.getByText(/você pode abrir qualquer assunto do mapa/i)).toBeTruthy()
    expect(view.queryByText(/raft/i)).toBeNull()

    expect(view.getByRole('heading', { name: /dê um dia à tarefa/i })).toBeTruthy()
    expect(view.getByText('Revisar índices compostos')).toBeTruthy()
    expect(view.getByRole('figure', { name: 'EXEMPLO INTERATIVO' })).toBeTruthy()

    expect(view.getByRole('heading', { name: /você escolhe a profundidade/i })).toBeTruthy()
    expect(view.getByText('Explore os assuntos')).toBeTruthy()
    expect(view.getByText('Explicar com diagnóstico')).toBeTruthy()
    expect(view.getByText('Testar um caso-limite')).toBeTruthy()
    expect(view.getByText('Projeto de prática')).toBeTruthy()
    expect(view.getByText(/sem revogar a aprovação/i)).toBeTruthy()
    expect(view.getByRole('heading', { name: /pratique com um projeto curto/i })).toBeTruthy()
    expect(view.getByRole('figure', { name: 'Exemplo de projeto de prática' })).toBeTruthy()
    expect(view.getByText('Índices compostos em consultas reais')).toBeTruthy()
    expect(view.getByText(/você faz o projeto no seu editor/i)).toBeTruthy()
    expect(view.getByText('Quem acessa o meu material?')).toBeTruthy()
  })

  test('translates the loop, map story, tasks, and paths to English', () => {
    const view = render(<LandingPage />)
    fireEvent.change(within(view.container.querySelector('footer')!).getByRole('combobox', { name: 'Idioma' }), { target: { value: 'en-US' } })

    expect(view.getByRole('heading', { name: /four areas\. the same material/i })).toBeTruthy()
    expect(view.getByRole('heading', { name: /see how the topics connect/i })).toBeTruthy()
    expect(view.getByRole('figure', { name: 'Knowledge map and diagnostic example' })).toBeTruthy()
    expect(view.getByText('Database indexes')).toBeTruthy()
    expect(view.getByText(/did not explain why column order matters/i)).toBeTruthy()
    expect(view.getByText(/you can open any topic on the map/i)).toBeTruthy()
    expect(view.getByRole('heading', { name: /give the task a date/i })).toBeTruthy()
    expect(view.getByText('Review composite indexes')).toBeTruthy()
    expect(view.getByRole('heading', { name: /you choose the depth/i })).toBeTruthy()
    expect(view.getByText('Explore the topics')).toBeTruthy()
    expect(view.getByText('Test an edge case')).toBeTruthy()
    expect(view.getByText(/without revoking the approval/i)).toBeTruthy()
    expect(view.getByRole('heading', { name: /practice with a small project/i })).toBeTruthy()
    expect(view.getByRole('figure', { name: 'Practice project example' })).toBeTruthy()
    expect(view.getByText('Composite indexes in real queries')).toBeTruthy()
    expect(within(view.getByRole('navigation', { name: 'Page sections' })).getAllByRole('link').map((tab) => tab.textContent)).toEqual([
      'Study',
      'Tasks',
      'Analyze',
      'Create',
    ])
    expect(view.getByText('Who can access my material?')).toBeTruthy()
  })

  test('task preview carries the chosen date and time into the board without saving', () => {
    const view = render(<LandingPage />)
    const preview = within(view.getByRole('figure', { name: 'EXEMPLO INTERATIVO' }))

    fireEvent.click(preview.getByRole('button', { name: '24 de outubro 2026' }))
    expect(preview.getByText('24 out · 18:00 · 60 min')).toBeTruthy()

    fireEvent.click(preview.getByRole('tab', { name: 'Tempo' }))
    fireEvent.change(preview.getByRole('slider', { name: 'Horário' }), { target: { value: '10' } })
    fireEvent.click(preview.getByRole('button', { name: '90 min' }))
    fireEvent.click(preview.getByRole('button', { name: 'Ver no quadro' }))
    expect(preview.getByRole('tab', { name: 'Quadro' }).getAttribute('aria-selected')).toBe('true')
    expect(preview.getAllByText('24 out · 10:00 · 90 min')).toHaveLength(2)

    fireEvent.click(preview.getByRole('button', { name: 'Em andamento' }))
    expect(preview.getByRole('button', { name: 'Em andamento' }).getAttribute('aria-pressed')).toBe('true')
    expect(preview.getByText('Você está explorando um exemplo. Nada é salvo.')).toBeTruthy()
  })

  test('restores the saved locale without authentication or SSE', async () => {
    window.localStorage.setItem('masterme:locale', 'en-US')
    const view = render(<LandingPage />)

    await waitFor(() => expect(view.getByRole('heading', { level: 1, name: /organize what to study/i })).toBeTruthy())
    expect(within(view.container.querySelector('footer')!).getByRole('combobox', { name: 'Language' })).toHaveProperty('value', 'en-US')
    expect(document.documentElement.lang).toBe('en-US')
  })

  test('theme button describes its action without contradictory pressed state', () => {
    const view = render(<LandingPage />)
    const toggle = within(view.container.querySelector('footer')!).getByRole('button', { name: 'Usar tema claro' })
    expect(toggle.hasAttribute('aria-pressed')).toBe(false)

    fireEvent.click(toggle)

    expect(within(view.container.querySelector('footer')!).getByRole('button', { name: 'Usar tema escuro' })).toBeTruthy()
    expect(window.localStorage.getItem('theme')).toBe('light')
  })

  test('menu and footer theme controls stay in sync', async () => {
    const view = render(<LandingPage />)
    const menu = view.container.querySelector<HTMLDetailsElement>('header details')!
    const footer = view.container.querySelector<HTMLElement>('footer')!

    fireEvent.click(within(menu).getByRole('button', { name: 'Usar tema claro', hidden: true }))

    await waitFor(() => expect(within(footer).getByRole('button', { name: 'Usar tema escuro' })).toBeTruthy())
  })

  test('CTAs carry only known IDs without prices in the destination', () => {
    const view = render(<LandingPage />)
    const callsToAction = [...view.container.querySelectorAll<HTMLAnchorElement>('[data-plan-id]')]
    expect(new Set(callsToAction.map((link) => link.dataset.planId))).toEqual(new Set(['FREE']))
    for (const link of callsToAction) {
      expect(link.href).toContain('/login?next=')
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
