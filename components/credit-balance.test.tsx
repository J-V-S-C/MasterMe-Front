import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { cleanup, render, waitFor } from '@testing-library/react'
import { Window } from 'happy-dom'
import { BillingProvider } from './billing-provider'
import { CreditBalance, StudyCreditBalance } from './credit-balance'
import { I18nProvider } from '../lib/i18n'
import { invalidateApiCache } from '../lib/api'

const originalFetch = globalThis.fetch
beforeEach(() => {
  const window = new Window({ url: 'https://masterme.test/study' })
  Object.assign(globalThis, { window, document: window.document, navigator: window.navigator, localStorage: window.localStorage })
})
afterEach(() => { cleanup(); invalidateApiCache(); globalThis.fetch = originalFetch })

describe('authoritative balance', () => {
  test('shows the full study quota by default and lets the student minimize and restore it', async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ data: {
      planId: 'FREE', dailyLimit: 100, dailyUsed: 1, dailyRemaining: 99,
      dailyResetsAt: '2026-10-20T00:00:00.000Z', periodLimit: 0, periodUsed: 0, periodRemaining: 0,
      periodStartsAt: '2026-10-20T00:00:00.000Z', periodEndsAt: '2026-10-20T00:00:00.000Z', validUntil: null,
      weights: { INITIAL_EVALUATION: 1, STRESS_EVALUATION: 1, EDGE_CASE_GENERATION: 1, EDGE_CASE_EVALUATION: 1, PRACTICE_PROJECT: 1, LOCALIZATION: 1, EXTRACTION: 1, ISOMORPHIC_PROBLEM: 1 },
      estimates: { INITIAL_EVALUATION: 49, EXTRACTION: 49, PRACTICE_PROJECT: 49 },
      estimateAssumption: { providerAttemptsPerOperation: 2 },
    } }), { status: 200 })) as unknown as typeof fetch
    const view = render(<I18nProvider><BillingProvider><StudyCreditBalance /></BillingProvider></I18nProvider>)
    const disclosure = view.container.querySelector('details.study-balance') as HTMLDetailsElement
    await waitFor(() => expect(view.getByTitle(/99 créditos restantes/)).toBeTruthy())
    expect(disclosure.open).toBe(true)
    const summary = disclosure.querySelector('summary') as HTMLElement
    summary.click()
    expect(disclosure.open).toBe(false)
    expect(summary.textContent).toContain('99 créditos')
    summary.click()
    expect(disclosure.open).toBe(true)
  })

  test('free balance shows only the daily reset even with a legacy period value', async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ data: {
      planId: 'FREE', dailyLimit: 100, dailyUsed: 1, dailyRemaining: 99,
      dailyResetsAt: '2026-10-20T00:00:00.000Z',
      periodLimit: 100, periodUsed: 100, periodRemaining: 0,
      periodStartsAt: '2026-10-19T00:00:00.000Z', periodEndsAt: '2026-10-20T00:00:00.000Z', validUntil: null,
      weights: { INITIAL_EVALUATION: 1, STRESS_EVALUATION: 1, EDGE_CASE_GENERATION: 1, EDGE_CASE_EVALUATION: 1, PRACTICE_PROJECT: 1, LOCALIZATION: 1, EXTRACTION: 1, ISOMORPHIC_PROBLEM: 1 },
      estimates: { INITIAL_EVALUATION: 49, EXTRACTION: 49, PRACTICE_PROJECT: 49 },
      estimateAssumption: { providerAttemptsPerOperation: 2 },
    } }), { status: 200 })) as unknown as typeof fetch
    const view = render(<I18nProvider><BillingProvider><CreditBalance compact /><CreditBalance /></BillingProvider></I18nProvider>)
    await waitFor(() => expect(view.getByTitle(/99 créditos restantes/)).toBeTruthy())
    expect(view.container.querySelector('.credit-balance-panel')?.textContent).not.toContain('Período')
  })

  test('shows the lowest simultaneous balance and backend estimates with a single request', async () => {
    let calls = 0
    globalThis.fetch = (async () => {
      calls += 1
      return new Response(JSON.stringify({ data: {
        planId: 'PRO', dailyLimit: 180, dailyUsed: 30, dailyRemaining: 150, dailyResetsAt: '2026-10-10T00:00:00.000Z',
        periodLimit: 15_000, periodUsed: 14_900, periodRemaining: 100, periodStartsAt: '2026-01-01T00:00:00.000Z', periodEndsAt: '2027-01-01T00:00:00.000Z', validUntil: '2027-01-01T00:00:00.000Z',
        weights: { INITIAL_EVALUATION: 2, STRESS_EVALUATION: 2, EDGE_CASE_GENERATION: 4, EDGE_CASE_EVALUATION: 4, PRACTICE_PROJECT: 8, LOCALIZATION: 6, EXTRACTION: 12, ISOMORPHIC_PROBLEM: 4 },
        estimates: { INITIAL_EVALUATION: 25, STRESS_EVALUATION: 25, EDGE_CASE_GENERATION: 12, EDGE_CASE_EVALUATION: 12, PRACTICE_PROJECT: 6, LOCALIZATION: 8, EXTRACTION: 4, ISOMORPHIC_PROBLEM: 12 },
        estimateAssumption: { providerAttemptsPerOperation: 2 },
      } }), { status: 200 })
    }) as unknown as typeof fetch
    const view = render(<I18nProvider><BillingProvider><CreditBalance compact /><CreditBalance /></BillingProvider></I18nProvider>)
    await waitFor(() => expect(view.getByTitle(/100 créditos restantes/)).toBeTruthy())
    const text = view.container.querySelector('.credit-balance-panel')?.textContent ?? ''
    expect(text).toContain('25 avaliações')
    expect(text).toContain('4 extrações')
    expect(text).toContain('6 projetos')
    expect(calls).toBe(1)
  })
})
