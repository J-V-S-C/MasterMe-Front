import type { Metadata } from 'next'
import './globals.css'
import './live.css'
import './loading.css'
import './shell.css'
import './themes.css'
import './practice.css'
import './auth.css'
import './billing.css'

export const metadata: Metadata = {
  title: {
    default: 'MasterMe — Aprenda explicando',
    template: '%s · MasterMe',
  },
  description: 'Transforme materiais técnicos em mapas de conhecimento, diagnósticos e projetos de prática.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try { const saved = localStorage.getItem('theme'); document.documentElement.dataset.theme = saved === 'light' || saved === 'dark' ? saved : matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; } catch {}" }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
