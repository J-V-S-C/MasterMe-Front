"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Icon } from '../lib/icons'
import { LogoutButton } from './logout-button'

const links = [
  { label: 'Estudar', accessibleLabel: 'Espaço de estudo', href: '/', id: 'study', icon: 'book' },
  { label: 'Analisar', accessibleLabel: 'Mapa do conhecimento', href: '/mapa-do-conhecimento', id: 'map', icon: 'brain' },
  { label: 'Criar', accessibleLabel: 'Projeto de prática', href: '/pratica', id: 'practice', icon: 'sparkles' },
] as const

export function SiteHeader({ active = 'study' }: { active?: 'study' | 'map' | 'practice' }) {
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
    <Link className="brand" href="/" aria-label="MasterMe, ir para o espaço de estudo"><span className="brand-mark"><i>M</i></span><strong>MASTERME</strong></Link>
    <nav className="primary-nav" aria-label="Navegação principal">{links.map((link) => <Link className={active === link.id ? 'active' : ''} aria-label={link.accessibleLabel} aria-current={active === link.id ? 'page' : undefined} href={link.href} key={link.id}><span className="nav-icon"><Icon name={link.icon} /></span><span className="nav-label">{link.label}</span></Link>)}</nav>
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} aria-pressed={theme === 'dark'}>
      <span className="theme-track" aria-hidden="true"><Icon name="sun" /><Icon name="moon" /><i className="theme-orbit" /></span>
    </button>
    <LogoutButton />
  </div></header>
}
