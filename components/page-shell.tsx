import type { ReactNode } from 'react'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'

export function PageShell({ children, active }: { children: ReactNode; active: 'study' | 'map' }) {
  return <div className="app-shell"><SiteHeader active={active} />{children}<SiteFooter /></div>
}
