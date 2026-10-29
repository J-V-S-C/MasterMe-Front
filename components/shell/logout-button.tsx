'use client'

import { useRouter } from 'next/navigation'
import { Icon } from '../ui/icons'
import { useI18n } from '../../lib/localization/i18n'

export function LogoutButton() {
  const { t } = useI18n()
  const router = useRouter()
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }
  return <button className="header-logout" type="button" onClick={() => void logout()} aria-label={t('logout')} title={t('logout')}><Icon name="logout" /></button>
}
