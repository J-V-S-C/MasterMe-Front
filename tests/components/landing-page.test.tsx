import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/react'
import { Window } from 'happy-dom'
import { LandingPage } from '../../components/marketing/landing-page'

const originalFetch = globalThis.fetch
const originalEventSource = globalThis.EventSource

const chooseLanguage = (root: Element, label: string, option: string, hidden = false) => {
  const controls = within(root as HTMLElement)
  const select = controls.getByRole('combobox', { name: label, hidden }) as HTMLSelectElement
  const choice = within(select).getByRole('option', { name: option, hidden }) as HTMLOptionElement
  fireEvent.change(select, { target: { value: choice.value } })
}

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
  test('presents the current Study, Tasks, and Practice product', () => {
    const view = render(<LandingPage />)
    const navigation = within(view.getByRole('navigation', { name: 'Seções da página' }))
    expect(navigation.getAllByRole('link').map((link) => link.textContent)).toEqual(['Estudar', 'Tarefas', 'Praticar'])
    expect(view.getByRole('figure', { name: 'Exemplo de pergunta e feedback do estudo' })).toBeTruthy()
    expect(view.getByRole('heading', { name: 'Encontre a resposta anterior e a lacuna que ficou.' })).toBeTruthy()
    expect(view.getByRole('figure', { name: 'Exercício focado' })).toBeTruthy()
    expect(view.getByText('Projeto opcional')).toBeTruthy()
    expect(view.queryByText('Veja como os assuntos se ligam')).toBeNull()
  })

  test('mobile menu closes after navigating to a section', () => {
    const view = render(<LandingPage />)
    const menu = view.container.querySelector<HTMLDetailsElement>('header details')!
    menu.setAttribute('open', '')
    fireEvent.click(within(menu).getByRole('link', { name: 'Tarefas', hidden: true }))
    expect(menu.hasAttribute('open')).toBe(false)
  })

  test('payment availability controls which plans can start login', () => {
    const view = render(<LandingPage />)
    const planIds = () => [...view.container.querySelectorAll<HTMLAnchorElement>('[data-plan-id]')].map((link) => link.dataset.planId)
    expect(new Set(planIds())).toEqual(new Set(['FREE']))

    view.rerender(<LandingPage paymentsEnabled />)
    expect(new Set(planIds())).toEqual(new Set(['FREE', 'ESSENTIAL', 'PRO']))
    for (const link of view.container.querySelectorAll<HTMLAnchorElement>('[data-plan-id]')) {
      const login = new URL(link.href)
      expect(login.pathname).toBe('/login')
      expect(new URL(login.searchParams.get('next')!, login.origin).searchParams.get('plan')).toBe(link.dataset.planId ?? null)
    }
  })

  test('locale changes stay synchronized between controls and survive a new session', async () => {
    const view = render(<LandingPage />)
    const footer = () => within(view.container.querySelector('footer')!)
    const menu = () => within(view.container.querySelector('header details')!)

    chooseLanguage(view.container.querySelector('footer')!, 'Idioma', 'EN')
    expect((menu().getByRole('combobox', { name: 'Language', hidden: true }) as HTMLSelectElement).value).toBe('en-US')
    expect(document.documentElement.lang).toBe('en-US')
    expect(window.localStorage.getItem('masterme:locale')).toBe('en-US')

    cleanup()
    const restored = render(<LandingPage />)
    await waitFor(() => expect((within(restored.container.querySelector('footer')!).getByRole('combobox', { name: 'Language' }) as HTMLSelectElement).value).toBe('en-US'))
    expect(document.documentElement.lang).toBe('en-US')

    chooseLanguage(restored.container.querySelector('header details')!, 'Language', 'PT', true)
    expect((within(restored.container.querySelector('footer')!).getByRole('combobox', { name: 'Idioma' }) as HTMLSelectElement).value).toBe('pt-BR')
    expect(window.localStorage.getItem('masterme:locale')).toBe('pt-BR')
    expect(document.documentElement.lang).toBe('pt-BR')
  })

  test('task preview carries date and duration across tabs and remains local', () => {
    const view = render(<LandingPage />)
    const preview = within(view.getByRole('figure', { name: 'EXEMPLO INTERATIVO' }))
    const storageBefore = window.localStorage.length

    fireEvent.click(preview.getByRole('button', { name: '24 de outubro 2026' }))
    expect(preview.getByRole('button', { name: '24 de outubro 2026' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(preview.getByRole('tab', { name: 'Tempo' }))
    fireEvent.click(preview.getByRole('button', { name: '90 min' }))
    expect(preview.getByRole('button', { name: '90 min' }).getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(preview.getByRole('button', { name: 'Ver no quadro' }))
    expect(preview.getByRole('tab', { name: 'Quadro' }).getAttribute('aria-selected')).toBe('true')
    expect(preview.getAllByText('24 out · 18:00 · 90 min')).toHaveLength(2)
    fireEvent.click(preview.getByRole('button', { name: 'Em andamento' }))
    expect(preview.getByRole('button', { name: 'Em andamento' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(preview.getByRole('tab', { name: 'Tempo' }))
    expect(preview.getByRole('button', { name: '90 min' }).getAttribute('aria-pressed')).toBe('true')
    expect(window.localStorage.length).toBe(storageBefore)
  })

  test('theme controls share state and persist the chosen theme', async () => {
    const view = render(<LandingPage />)
    const menu = within(view.container.querySelector('header details')!)
    const footer = within(view.container.querySelector('footer')!)
    fireEvent.click(menu.getByRole('button', { name: 'Usar tema claro', hidden: true }))
    await waitFor(() => expect(footer.getByRole('button', { name: 'Usar tema escuro' })).toBeTruthy())
    expect(window.localStorage.getItem('theme')).toBe('light')
    fireEvent.click(footer.getByRole('button', { name: 'Usar tema escuro' }))
    await waitFor(() => expect(menu.getByRole('button', { name: 'Usar tema claro', hidden: true })).toBeTruthy())
    expect(window.localStorage.getItem('theme')).toBe('dark')
  })

  test('locale, theme and task interactions never start fetch or SSE', async () => {
    const fetch = mock(async () => new Response(null, { status: 500 }))
    const eventSource = mock(() => { throw new Error('SSE must not open on the landing page') })
    globalThis.fetch = fetch as unknown as typeof globalThis.fetch
    globalThis.EventSource = eventSource as unknown as typeof EventSource
    const view = render(<LandingPage />)
    chooseLanguage(view.container.querySelector('footer')!, 'Idioma', 'EN')
    fireEvent.click(within(view.container.querySelector('footer')!).getByRole('button', { name: 'Use light theme' }))
    const preview = within(view.getByRole('figure', { name: 'INTERACTIVE EXAMPLE' }))
    fireEvent.click(preview.getByRole('tab', { name: 'Time' }))
    fireEvent.input(preview.getByRole('slider', { name: 'Time' }), { target: { value: '10' } })
    fireEvent.click(preview.getByRole('button', { name: 'See the board' }))
    await waitFor(() => expect(preview.getByRole('tab', { name: 'Board' }).getAttribute('aria-selected')).toBe('true'))
    expect(fetch).not.toHaveBeenCalled()
    expect(eventSource).not.toHaveBeenCalled()
  })
})
