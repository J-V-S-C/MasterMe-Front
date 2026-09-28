'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ActionButton } from '../../components/action-button'
import { Icon } from '../../lib/icons'

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
  return <label><span>{label}</span><span className="password-control"><input type={visible ? 'text' : 'password'} minLength={creating ? 8 : undefined} autoComplete={confirmationField || creating ? 'new-password' : 'current-password'} required value={value} onChange={(event) => onChange(event.target.value)} placeholder={creating ? 'Mínimo de 8 caracteres' : 'Sua senha'} /><button className="password-toggle" type="button" onClick={onToggle} aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`} title={visible ? 'Ocultar senha' : 'Mostrar senha'}><Icon name={visible ? 'eyeOff' : 'eye'} /></button></span>{creating && !confirmationField && <small>Use pelo menos 8 caracteres.</small>}</label>
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [callbackError, setCallbackError] = useState('')
  useEffect(() => { if (new URLSearchParams(window.location.search).has('auth_error')) setCallbackError('O link de confirmação é inválido ou expirou. Solicite um novo cadastro.') }, [])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(''); setNotice('')
    if (creating && password !== confirmation) { setError('As senhas não coincidem.'); return }
    setLoading(true)
    try {
      const response = await fetch(creating ? '/api/auth/signup' : '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const payload = await response.json().catch(() => null) as { message?: string; data?: { confirmationRequired?: boolean } } | null
      if (!response.ok) throw new Error(payload?.message ?? 'Não foi possível entrar.')
      if (creating && payload?.data?.confirmationRequired) {
        setNotice('Conta criada. Abra o e-mail de confirmação e depois entre no MasterMe.')
        setCreating(false); setPassword(''); setConfirmation('')
        return
      }
      router.replace('/'); router.refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.') }
    finally { setLoading(false) }
  }

  const setMode = (create: boolean) => { setCreating(create); setPassword(''); setConfirmation(''); setError(''); setNotice('') }

  return <main className="auth-page"><section className="auth-shell"><aside className="auth-intro"><span className="brand-mark"><i>M</i></span><span className="eyebrow">MASTERME · ESTUDO ATIVO</span><h1>Aprenda explicando, não apenas relendo.</h1><p>Transforme seus materiais em conceitos, pratique com desafios guiados e acompanhe seu domínio.</p><ul><li><i>01</i><span>Envie seu material</span></li><li><i>02</i><span>Extraia o mapa de conhecimento</span></li><li><i>03</i><span>Teste sua explicação</span></li></ul></aside><section className="auth-card"><header><h2>{creating ? 'Crie sua conta' : 'Boas-vindas de volta'}</h2><p>{creating ? 'Comece uma biblioteca privada para seus estudos.' : 'Entre para continuar de onde parou.'}</p></header><div className="auth-tabs" role="tablist" aria-label="Acesso"><button type="button" role="tab" aria-selected={!creating} className={!creating ? 'selected' : ''} onClick={() => setMode(false)}>Entrar</button><button type="button" role="tab" aria-selected={creating} className={creating ? 'selected' : ''} onClick={() => setMode(true)}>Criar conta</button></div><form onSubmit={submit}><label><span>E-mail</span><input type="text" inputMode="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" /></label><PasswordField label="Senha" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((current) => !current)} creating={creating} />{creating && <PasswordField label="Confirmar senha" value={confirmation} onChange={setConfirmation} visible={showConfirmation} onToggle={() => setShowConfirmation((current) => !current)} creating={creating} confirmationField />}{(error || callbackError) && <p className="auth-feedback error" role="alert">{error || callbackError}</p>}{notice && <p className="auth-feedback success" role="status">{notice}</p>}<ActionButton className="auth-submit" variant="primary" type="submit" disabled={loading}>{loading ? 'Aguarde…' : creating ? 'Criar minha conta' : 'Entrar no MasterMe'}</ActionButton></form><footer>Seus materiais e sessões ficam isolados na sua conta.</footer></section></section></main>
}
