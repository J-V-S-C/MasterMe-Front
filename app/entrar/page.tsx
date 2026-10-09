'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ActionButton } from '../../components/action-button'
import { Icon } from '../../lib/icons'
import { I18nProvider, useI18n } from '../../lib/i18n'
import { safeInternalDestination } from '../../lib/auth-redirect'

type PasswordFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  visible: boolean
  onToggle: () => void
  creating: boolean
  confirmationField?: boolean
}

function PasswordField({ label, value, onChange, visible, onToggle, creating, confirmationField = false }: PasswordFieldProps) {
  const { t } = useI18n()
  return <label><span>{label}</span><span className="password-control"><input type={visible ? 'text' : 'password'} minLength={creating ? 8 : undefined} autoComplete={confirmationField || creating ? 'new-password' : 'current-password'} required value={value} onChange={(event) => onChange(event.target.value)} placeholder={creating ? t('passwordPlaceholder') : t('currentPasswordPlaceholder')} /><button className="password-toggle" type="button" onClick={onToggle} aria-label={`${visible ? t('hide') : t('show')} ${label.toLowerCase()}`} title={visible ? t('hide') : t('show')}><Icon name={visible ? 'eyeOff' : 'eye'} /></button></span>{creating && !confirmationField && <small>{t('passwordHint')}</small>}</label>
}

export default function LoginPage() {
  return <I18nProvider><LoginContent /></I18nProvider>
}

function LoginContent() {
  const { t } = useI18n()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [callbackError, setCallbackError] = useState('')
  const [destination, setDestination] = useState('/estudar')
  const authMessage = (code?: string) => {
    const messages = {
      AUTH_REQUEST_TOO_LARGE: 'authRequestTooLarge', AUTH_INVALID_SIGNUP_INPUT: 'authInvalidSignupInput',
      AUTH_EMAIL_INVALID: 'authEmailInvalid', AUTH_EMAIL_NOT_AUTHORIZED: 'authEmailNotAuthorized',
      AUTH_USER_EXISTS: 'authUserExists', AUTH_WEAK_PASSWORD: 'authWeakPassword',
      AUTH_EMAIL_RATE_LIMITED: 'authEmailRateLimited', AUTH_SIGNUP_FAILED: 'authSignupFailed',
      AUTH_SIGNUP_UNCONFIRMED: 'authSignupUnconfirmed', AUTH_UNAVAILABLE: 'authUnavailable',
      AUTH_INVALID_LOGIN_INPUT: 'authInvalidLoginInput', AUTH_INVALID_CREDENTIALS: 'authInvalidCredentials',
    } as const
    return t(messages[code as keyof typeof messages] ?? 'authLoginFailed')
  }
  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    if (query.has('auth_error')) setCallbackError(t('authCallbackError'))
    setDestination(safeInternalDestination(query.get('next')))
  }, [t])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(''); setNotice('')
    if (creating && password !== confirmation) { setError(t('passwordsMismatch')); return }
    setLoading(true)
    try {
      const response = await fetch(creating ? '/api/auth/signup' : '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, ...(creating ? { next: destination } : {}) }) })
      const payload = await response.json().catch(() => null) as { code?: string; data?: { confirmationRequired?: boolean } } | null
      if (!response.ok) throw new Error(authMessage(payload?.code))
      if (creating && payload?.data?.confirmationRequired) {
        setNotice(t('authAccountCreated'))
        setCreating(false); setPassword(''); setConfirmation('')
        return
      }
      router.replace(destination); router.refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('authLoginFailed')) }
    finally { setLoading(false) }
  }

  const setMode = (create: boolean) => { setCreating(create); setPassword(''); setConfirmation(''); setError(''); setNotice('') }

  return <main className="auth-page"><section className="auth-shell"><aside className="auth-intro"><span className="brand-mark"><i>M</i></span><span className="eyebrow">{t('authEyebrow')}</span><h1>{t('authTitle')}</h1><p>{t('authDescription')}</p><ul><li><i>01</i><span>{t('authStepUpload')}</span></li><li><i>02</i><span>{t('authStepMap')}</span></li><li><i>03</i><span>{t('authStepTest')}</span></li></ul></aside><section className="auth-card"><header><h2>{creating ? t('createAccount') : t('welcomeBack')}</h2><p>{creating ? t('createDescription') : t('loginDescription')}</p></header><div className="auth-tabs" role="tablist" aria-label={t('login')}><button type="button" role="tab" aria-selected={!creating} className={!creating ? 'selected' : ''} onClick={() => setMode(false)}>{t('login')}</button><button type="button" role="tab" aria-selected={creating} className={creating ? 'selected' : ''} onClick={() => setMode(true)}>{t('signup')}</button></div><form onSubmit={submit}><label><span>{t('email')}</span><input type="email" inputMode="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><PasswordField label={t('password')} value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((current) => !current)} creating={creating} />{creating && <PasswordField label={t('confirmPassword')} value={confirmation} onChange={setConfirmation} visible={showConfirmation} onToggle={() => setShowConfirmation((current) => !current)} creating={creating} confirmationField />}{(error || callbackError) && <p className="auth-feedback error" role="alert">{error || callbackError}</p>}{notice && <p className="auth-feedback success" role="status">{notice}</p>}<ActionButton className="auth-submit" variant="primary" type="submit" disabled={loading}>{loading ? t('waiting') : creating ? t('createMyAccount') : t('login')}</ActionButton></form><footer>{t('privateLibrary')}</footer></section></section></main>
}
