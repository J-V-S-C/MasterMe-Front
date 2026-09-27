'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError('')
    try {
      const response = await fetch(creating ? '/api/auth/signup' : '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const payload = await response.json().catch(() => null) as { message?: string } | null
      if (!response.ok) throw new Error(payload?.message ?? 'Não foi possível entrar.')
      if (creating) { setError('Conta criada. Confirme o e-mail antes de entrar.'); setCreating(false); return }
      router.replace('/'); router.refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.') }
    finally { setLoading(false) }
  }
  return <main className="auth-page"><section className="auth-card"><span className="eyebrow">MASTERME</span><h1>{creating ? 'Crie sua conta' : 'Entre para continuar'}</h1><p>Seus materiais, mapas e sessões ficam isolados na sua conta.</p><form onSubmit={submit}><label>E-mail<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Senha<input type="password" minLength={creating ? 12 : undefined} autoComplete={creating ? 'new-password' : 'current-password'} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="form-error" role="status">{error}</p>}<button className="primary" type="submit" disabled={loading}>{loading ? 'Aguarde…' : creating ? 'Criar conta' : 'Entrar'}</button><button type="button" onClick={() => { setCreating((value) => !value); setError('') }}>{creating ? 'Já tenho uma conta' : 'Criar uma conta'}</button></form></section></main>
}
