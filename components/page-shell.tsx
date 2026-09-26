import type { ReactNode } from 'react'
import { SiteHeader } from './site-header'

export function PageShell({ children, active }: { children: ReactNode; active: 'study' | 'map' | 'practice' }) {
  return <div className="app-shell"><a className="skip-link" href="#main-content">Pular para o conteúdo principal</a><SiteHeader active={active} />{children}</div>
}
