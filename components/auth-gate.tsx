'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { loginHrefFor } from '../lib/auth-redirect'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (ready) return
    let active = true
    void fetch('/api/auth/session', { cache: 'no-store' }).then((response) => {
      if (!active) return
      if (response.ok) setReady(true)
      else router.replace(loginHrefFor(`${pathname}${window.location.search}`))
    }).catch(() => { if (active) router.replace(loginHrefFor(`${pathname}${window.location.search}`)) })
    return () => { active = false }
  }, [pathname, ready, router])
  if (!ready) return <main className="auth-loading" aria-busy="true" aria-live="polite">Validando sessão…</main>
  return children
}
