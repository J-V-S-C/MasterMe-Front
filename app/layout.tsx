import type { Metadata } from 'next'
import './globals.css'
import './live.css'
import './loading.css'
import './shell.css'
import './themes.css'
import './practice.css'

export const metadata: Metadata = {
  title: 'MasterMe — Estudo ativo',
  description: 'Workspace de inquirição socrática.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,400&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: "try { const saved = localStorage.getItem('theme'); document.documentElement.dataset.theme = saved === 'light' || saved === 'dark' ? saved : matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; } catch {}" }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
