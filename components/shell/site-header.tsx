"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Icon } from '../ui/icons'
import { LogoutButton } from './logout-button'
import { useI18n } from '../../lib/localization/i18n'
import { ThemeToggle } from './theme-toggle'
import { SelectField } from '../ui/select-field'
import { BrandLink } from './brand-link'
import { useBilling } from '../providers/billing-provider'

const links = [
  { label: 'navStudy', accessibleLabel: 'navStudyLabel', href: '/study', id: 'study', icon: 'book' },
  { label: 'navLibrary', accessibleLabel: 'navLibraryLabel', href: '/library', id: 'library', icon: 'library' },
  { label: 'navPractice', accessibleLabel: 'navPracticeLabel', href: '/practice', id: 'practice', icon: 'sparkles' },
] as const

export function SiteHeader({ active = 'study' }: { active?: 'study' | 'map' | 'practice' | 'library' }) {
  const { locale, setLocale, t } = useI18n()
  const { balance, loading: balanceLoading, unavailable: balanceUnavailable } = useBilling()
  const remainingCredits = balance ? balance.planId === 'FREE' ? balance.dailyRemaining : Math.min(balance.dailyRemaining, balance.periodRemaining) : null
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])
  return <header className="site-header"><div className="header-content">
    <BrandLink href="/study" label={t('brandLabel')} />
    <span className="header-credit-mobile" role="status" aria-label={`${t('creditBalance')}: ${remainingCredits !== null ? new Intl.NumberFormat(locale).format(remainingCredits) : balanceLoading ? '…' : t('creditUnavailable')}`}><Icon name="sparkles" />{remainingCredits !== null ? new Intl.NumberFormat(locale).format(remainingCredits) : balanceLoading ? '…' : '—'}</span>
    <button className="mobile-menu-toggle" type="button" aria-label={t('menu')} aria-controls="site-menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
      <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
    </button>
    <div id="site-menu" className={`site-menu${menuOpen ? ' open' : ''}`}>
    <nav className="primary-nav" aria-label={t('mainNavigation')}>{links.map((link) => <Link className={active === link.id ? 'active' : ''} aria-label={t(link.accessibleLabel)} aria-current={active === link.id ? 'page' : undefined} href={link.href} key={link.id} onClick={() => setMenuOpen(false)}><span className="nav-icon"><Icon name={link.icon} /></span><span className="nav-label">{t(link.label)}</span></Link>)}</nav>
    <div className="header-controls">
      <span className="header-credit-count" role="status" aria-label={t('creditBalance')} title={balanceUnavailable ? t('creditUnavailable') : `${t('creditBalance')}: ${remainingCredits ?? '…'}`}><Icon name="sparkles" /><span>{remainingCredits !== null ? new Intl.NumberFormat(locale).format(remainingCredits) : balanceLoading ? '…' : '—'}</span><span className="header-credit-label">{t('credits')}</span></span>
      <div className="locale-control"><SelectField compact icon={null} label={t('language')} value={locale} options={[{ value: 'pt-BR', label: 'PT' }, { value: 'en-US', label: 'EN' }]} onValueChange={(value) => setLocale(value === 'en-US' ? 'en-US' : 'pt-BR')} /></div>
      <ThemeToggle lightLabel={t('lightTheme')} darkLabel={t('darkTheme')} />
      <LogoutButton />
    </div>
    </div>
  </div></header>
}
