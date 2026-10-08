import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { cleanup, render, waitFor } from '@testing-library/react'
import { Window } from 'happy-dom'
import { I18nProvider, useI18n } from './i18n'

function Probe() {
  const { locale, t } = useI18n()
  return <span>{locale}:{t('navStudy')}</span>
}

beforeEach(() => {
  const window = new Window()
  Object.assign(globalThis, { window, document: window.document, navigator: window.navigator, localStorage: window.localStorage })
})
afterEach(() => cleanup())

describe('internacionalização', () => {
  test('usa pt-BR por padrão', () => {
    const view = render(<I18nProvider><Probe /></I18nProvider>)
    expect(view.getByText('pt-BR:Estudar')).toBeTruthy()
  })

  test('restaura en-US e atualiza o lang do documento', async () => {
    window.localStorage.setItem('masterme:locale', 'en-US')
    const view = render(<I18nProvider><Probe /></I18nProvider>)
    await waitFor(() => expect(view.getByText('en-US:Study')).toBeTruthy())
    expect(document.documentElement.lang).toBe('en-US')
  })
})
