import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { cleanup, render, waitFor } from '@testing-library/react'
import { Window } from 'happy-dom'
import { I18nProvider, useI18n } from './i18n'

function Probe() {
  const { locale, t } = useI18n()
  return <><span>{locale}:{t('navStudy')}</span><span>{t('fileHelp')}</span><span>{t('authCallbackError')}</span><span>{t('authAccountCreated')}</span><span>{t('creditBalance')}</span><span>{t('checkoutContinue')}</span><span>{t('paymentPending')}</span></>
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
    expect(view.getByText(/até 8 MiB/)).toBeTruthy()
    expect(view.getByText('O link de confirmação é inválido ou expirou. Solicite um novo cadastro.')).toBeTruthy()
    expect(view.getByText(/Conta criada/)).toBeTruthy()
    expect(view.getByText('Saldo de créditos')).toBeTruthy()
    expect(view.getByText('Continuar para a InfinitePay')).toBeTruthy()
    expect(view.getByText('Pagamento em confirmação')).toBeTruthy()
  })

  test('restaura en-US e atualiza o lang do documento', async () => {
    window.localStorage.setItem('masterme:locale', 'en-US')
    const view = render(<I18nProvider><Probe /></I18nProvider>)
    await waitFor(() => expect(view.getByText('en-US:Study')).toBeTruthy())
    expect(view.getByText(/up to 8 MiB/)).toBeTruthy()
    expect(view.getByText('The confirmation link is invalid or expired. Create a new account request.')).toBeTruthy()
    expect(view.getByText(/Account created/)).toBeTruthy()
    expect(view.getByText('Credit balance')).toBeTruthy()
    expect(view.getByText('Continue to InfinitePay')).toBeTruthy()
    expect(view.getByText('Payment being confirmed')).toBeTruthy()
    expect(document.documentElement.lang).toBe('en-US')
  })
})
