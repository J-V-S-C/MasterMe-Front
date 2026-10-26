import type { Metadata } from 'next'
import './globals.css'
import './live.css'
import './loading.css'
import './shell.css'
import './themes.css'
import './practice.css'
import './auth.css'
import './billing.css'
import './workspace-heading.css'
import './readable-type.css'
import './refinement.css'
import { ClientObservability } from '../components/client-observability'

export const metadata: Metadata = {
  title: {
    default: 'MasterMe — Organize o que estudar',
    template: '%s · MasterMe',
  },
  description: 'Transforme PDFs, artigos e documentação técnica em mapas conceituais, diagnósticos ancorados e prática.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try { const saved = localStorage.getItem('theme'); document.documentElement.dataset.theme = saved === 'light' || saved === 'dark' ? saved : matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; } catch {}" }} />
      </head>
      <body>{children}<ClientObservability build={process.env.APP_BUILD_ID ?? 'unknown'} /></body>
    </html>
  )
}
