'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { loginHrefFor } from '../lib/auth-redirect'
import { useI18n } from '../lib/i18n'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { locale } = useI18n()
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (ready) return
    let active = true
    setUnavailable(false)
    void fetch('/api/auth/session', { cache: 'no-store' }).then((response) => {
      if (!active) return
      if (response.ok) setReady(true)
      else if (response.status === 401) router.replace(loginHrefFor(`${pathname}${window.location.search}`))
      else setUnavailable(true)
    }).catch(() => { if (active) setUnavailable(true) })
    return () => { active = false }
  }, [pathname, ready, router, attempt])
  if (unavailable) return <main className="auth-loading" role="alert">{locale === 'pt-BR' ? 'Não foi possível verificar sua sessão agora.' : 'Could not check your session right now.'} <button type="button" onClick={() => setAttempt((value) => value + 1)}>{locale === 'pt-BR' ? 'Tentar novamente' : 'Try again'}</button></main>
  if (!ready) return <main className="auth-loading" aria-busy="true" aria-live="polite">Validando sessão…</main>
  return children
}
