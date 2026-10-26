"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Icon } from '../lib/icons'
import { LogoutButton } from './logout-button'
import { useI18n } from '../lib/i18n'
import { ThemeToggle } from './theme-toggle'
import { StyledSelect } from './styled-select'
import { BrandLink } from './brand-link'

const links = [
  { label: 'navStudy', accessibleLabel: 'navStudyLabel', href: '/study', id: 'study', icon: 'book' },
  { label: 'navLibrary', accessibleLabel: 'navLibraryLabel', href: '/library', id: 'library', icon: 'library' },
  { label: 'navMap', accessibleLabel: 'navMapLabel', href: '/knowledge-map', id: 'map', icon: 'brain' },
  { label: 'navPractice', accessibleLabel: 'navPracticeLabel', href: '/practice', id: 'practice', icon: 'sparkles' },
] as const

export function SiteHeader({ active = 'study' }: { active?: 'study' | 'map' | 'practice' | 'library' }) {
  const { locale, setLocale, t } = useI18n()
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
    <button className="mobile-menu-toggle" type="button" aria-label={t('menu')} aria-controls="site-menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
      <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
    </button>
    <div id="site-menu" className={`site-menu${menuOpen ? ' open' : ''}`}>
    <nav className="primary-nav" aria-label={t('mainNavigation')}>{links.map((link) => <Link className={active === link.id ? 'active' : ''} aria-label={t(link.accessibleLabel)} aria-current={active === link.id ? 'page' : undefined} href={link.href} key={link.id} onClick={() => setMenuOpen(false)}><span className="nav-icon"><Icon name={link.icon} /></span><span className="nav-label">{t(link.label)}</span></Link>)}</nav>
    <div className="header-controls">
      <div className="locale-control"><StyledSelect compact icon={null} label={t('language')} value={locale} options={[{ value: 'pt-BR', label: 'PT' }, { value: 'en-US', label: 'EN' }]} onValueChange={(value) => setLocale(value === 'en-US' ? 'en-US' : 'pt-BR')} /></div>
      <ThemeToggle lightLabel={t('lightTheme')} darkLabel={t('darkTheme')} />
      <LogoutButton />
    </div>
    </div>
  </div></header>
}
