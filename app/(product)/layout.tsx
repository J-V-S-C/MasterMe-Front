import type { ReactNode } from 'react'
import { AuthGate } from '../../components/auth-gate'
import { RealtimeProvider } from '../../components/realtime-provider'
import { I18nProvider } from '../../lib/i18n'

export default function ProductLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <I18nProvider><AuthGate><RealtimeProvider>{children}</RealtimeProvider></AuthGate></I18nProvider>
}
