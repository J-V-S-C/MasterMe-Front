'use client'

import { useEffect, useState } from 'react'
import { Icon } from '../lib/icons'

type Theme = 'light' | 'dark'

function preferredTheme(): Theme {
  const saved = window.localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function ThemeToggle({
  lightLabel,
  darkLabel,
}: {
  lightLabel: string
  darkLabel: string
}) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const selected = preferredTheme()
    setTheme(selected)
    document.documentElement.dataset.theme = selected
  }, [])

  const toggleTheme = () => {
    const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
    const nextTheme: Theme = current === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.dataset.theme = nextTheme
    window.localStorage.setItem('theme', nextTheme)
  }

  const label = theme === 'dark' ? lightLabel : darkLabel
  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <span className="theme-track" aria-hidden="true">
        <Icon name="sun" />
        <Icon name="moon" />
        <i className="theme-orbit" />
      </span>
    </button>
  )
}
