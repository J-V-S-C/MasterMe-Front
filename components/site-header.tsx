"use client"

import Link from 'next/link'
import { Icon } from '../lib/icons'
import { LogoutButton } from './logout-button'
import { useI18n } from '../lib/i18n'
import { ThemeToggle } from './theme-toggle'
import { CreditBalance } from './credit-balance'

const links = [
  { label: 'navStudy', accessibleLabel: 'navStudyLabel', href: '/estudar', id: 'study', icon: 'book' },
  { label: 'navMap', accessibleLabel: 'navMapLabel', href: '/mapa-do-conhecimento', id: 'map', icon: 'brain' },
  { label: 'navPractice', accessibleLabel: 'navPracticeLabel', href: '/pratica', id: 'practice', icon: 'sparkles' },
] as const

export function SiteHeader({ active = 'study' }: { active?: 'study' | 'map' | 'practice' }) {
  const { locale, setLocale, t } = useI18n()
  return <header className="site-header"><div className="header-content">
    <Link className="brand" href="/estudar" aria-label={t('brandLabel')}><span className="brand-mark"><i>M</i></span><strong>MASTERME</strong></Link>
    <div className="header-controls">
      <CreditBalance compact />
      <label className="locale-control"><span className="sr-only">{t('language')}</span><select aria-label={t('language')} value={locale} onChange={(event) => setLocale(event.target.value === 'en-US' ? 'en-US' : 'pt-BR')}><option value="pt-BR">PT</option><option value="en-US">EN</option></select></label>
      <ThemeToggle lightLabel={t('lightTheme')} darkLabel={t('darkTheme')} />
      <LogoutButton />
    </div>
    <nav className="primary-nav" aria-label={t('mainNavigation')}>{links.map((link) => <Link className={active === link.id ? 'active' : ''} aria-label={t(link.accessibleLabel)} aria-current={active === link.id ? 'page' : undefined} href={link.href} key={link.id}><span className="nav-icon"><Icon name={link.icon} /></span><span className="nav-label">{t(link.label)}</span></Link>)}</nav>
  </div></header>
}
