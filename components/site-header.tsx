"use client"

import { useEffect, useState } from 'react'
import { Icon } from '../lib/icons'

const links = ['Espaço de Estudo', 'Mapa do Conhecimento']

export function SiteHeader({ active = 'study' }: { active?: 'study' | 'map' }) {
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
    <a className="brand" href="#workspace" aria-label="Feynman, ir para espaço de estudo"><span className="brand-mark">F</span><span><strong>FEYNMAN</strong><small>ACADEMIA · RENASCENÇA</small></span></a>
    <nav aria-label="Navegação principal">{links.map((link, index) => <a className={(index === 0 && active === 'study') || (index === 1 && active === 'map') ? 'active' : ''} href={index === 0 ? '/' : index === 1 ? '/mapa-do-conhecimento' : '#'} key={link}>{link}</a>)}</nav>
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>
      <span className="theme-track" aria-hidden="true"><Icon name="sun" /><Icon name="moon" /><i className="theme-orbit" /></span>
    </button>
  </div></header>
}
