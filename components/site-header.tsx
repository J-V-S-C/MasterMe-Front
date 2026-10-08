"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Icon } from '../lib/icons'
import { LogoutButton } from './logout-button'
import { useI18n } from '../lib/i18n'

const links = [
  { label: 'navStudy', accessibleLabel: 'navStudyLabel', href: '/', id: 'study', icon: 'book' },
  { label: 'navMap', accessibleLabel: 'navMapLabel', href: '/mapa-do-conhecimento', id: 'map', icon: 'brain' },
  { label: 'navPractice', accessibleLabel: 'navPracticeLabel', href: '/pratica', id: 'practice', icon: 'sparkles' },
] as const

export function SiteHeader({ active = 'study' }: { active?: 'study' | 'map' | 'practice' }) {
  const { locale, setLocale, t } = useI18n()
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  useEffect(() => {
    const saved = window.localStorage.getItem('theme')
    const nextTheme = saved === 'light' || saved === 'dark' ? saved : window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.dataset.theme = nextTheme
  }, [])
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.dataset.theme = nextTheme
    window.localStorage.setItem('theme', nextTheme)
  }
  return <header className="site-header"><div className="header-content">
    <Link className="brand" href="/" aria-label={t('brandLabel')}><span className="brand-mark"><i>M</i></span><strong>MASTERME</strong></Link>
    <div className="header-controls">
      <label className="locale-control"><span className="sr-only">{t('language')}</span><select aria-label={t('language')} value={locale} onChange={(event) => setLocale(event.target.value === 'en-US' ? 'en-US' : 'pt-BR')}><option value="pt-BR">PT</option><option value="en-US">EN</option></select></label>
      <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? t('lightTheme') : t('darkTheme')} title={theme === 'dark' ? t('lightTheme') : t('darkTheme')} aria-pressed={theme === 'dark'}>
      <span className="theme-track" aria-hidden="true"><Icon name="sun" /><Icon name="moon" /><i className="theme-orbit" /></span>
    </button>
      <LogoutButton />
    </div>
    <nav className="primary-nav" aria-label={t('mainNavigation')}>{links.map((link) => <Link className={active === link.id ? 'active' : ''} aria-label={t(link.accessibleLabel)} aria-current={active === link.id ? 'page' : undefined} href={link.href} key={link.id}><span className="nav-icon"><Icon name={link.icon} /></span><span className="nav-label">{t(link.label)}</span></Link>)}</nav>
  </div></header>
}
