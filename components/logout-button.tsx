'use client'

import { useRouter } from 'next/navigation'
import { Icon } from '../lib/icons'

export function LogoutButton() {
  const router = useRouter()
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/entrar')
    router.refresh()
  }
  return <button className="header-logout" type="button" onClick={() => void logout()} aria-label="Sair da conta" title="Sair"><Icon name="logout" /></button>
}
