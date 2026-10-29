import type { Metadata } from 'next'
import '../styles/globals.css'
import '../styles/live.css'
import '../styles/loading.css'
import '../components/ui/loading-skeleton.css'
import '../styles/shell.css'
import './themes.css'
import '../styles/practice.css'
import '../styles/auth.css'
import '../styles/billing.css'
import '../styles/workspace-heading.css'
import '../styles/readable-type.css'
import '../styles/refinement.css'
import { ClientObservability } from '../components/providers/client-observability'

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
