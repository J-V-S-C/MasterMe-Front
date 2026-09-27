'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/entrar')
    router.refresh()
  }
  return <button className="header-logout" type="button" onClick={() => void logout()}>Sair</button>
}
