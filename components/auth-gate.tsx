'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(pathname === '/entrar')
  useEffect(() => {
    if (pathname === '/entrar') { setReady(true); return }
    if (ready) return
    let active = true
    void fetch('/api/auth/session', { cache: 'no-store' }).then((response) => {
      if (!active) return
      if (response.ok) setReady(true)
      else router.replace('/entrar')
    }).catch(() => { if (active) router.replace('/entrar') })
    return () => { active = false }
  }, [pathname, ready, router])
  if (!ready) return <main className="auth-loading" aria-busy="true">Validando sessão…</main>
  return children
}
