import type { ReactNode } from 'react'
import { AuthGate } from '../../components/auth-gate'
import { RealtimeProvider } from '../../components/realtime-provider'
import { I18nProvider } from '../../lib/i18n'
import { BillingProvider } from '../../components/billing-provider'

export default function ProductLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <I18nProvider><AuthGate><BillingProvider><RealtimeProvider>{children}</RealtimeProvider></BillingProvider></AuthGate></I18nProvider>
}
