'use client'

import type { ReactNode } from 'react'
import { SiteHeader } from './site-header'
import { useI18n } from '../../lib/localization/i18n'

export function PageShell({ children, active }: { children: ReactNode; active: 'study' | 'map' | 'practice' | 'library' }) {
  const { t } = useI18n()
  return <div className="app-shell"><a className="skip-link" href="#main-content">{t('skipContent')}</a><SiteHeader active={active} />{children}</div>
}
