import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { Window } from 'happy-dom'
import { I18nProvider, useI18n } from '../../lib/i18n'

function LocaleControl() {
  const { locale, setLocale } = useI18n()
  return <button type="button" data-locale={locale} onClick={() => setLocale(locale === 'pt-BR' ? 'en-US' : 'pt-BR')}>Change language</button>
}

beforeEach(() => {
  const window = new Window()
  Object.assign(globalThis, { window, document: window.document, navigator: window.navigator, localStorage: window.localStorage })
})
afterEach(() => cleanup())

describe('internationalization', () => {
  test('saves locale changes and restores them after remounting', async () => {
    const view = render(<I18nProvider><LocaleControl /></I18nProvider>)
    expect(view.getByRole('button').dataset.locale).toBe('pt-BR')
    fireEvent.click(view.getByRole('button'))
    expect(view.getByRole('button').dataset.locale).toBe('en-US')
    expect(window.localStorage.getItem('masterme:locale')).toBe('en-US')
    expect(document.documentElement.lang).toBe('en-US')

    cleanup()
    const restored = render(<I18nProvider><LocaleControl /></I18nProvider>)
    await waitFor(() => expect(restored.getByRole('button').dataset.locale).toBe('en-US'))
    fireEvent.click(restored.getByRole('button'))
    expect(window.localStorage.getItem('masterme:locale')).toBe('pt-BR')
    expect(document.documentElement.lang).toBe('pt-BR')
  })
})
