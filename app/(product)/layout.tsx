import type { ReactNode } from 'react'
import { AuthGate } from '../../components/providers/auth-gate'
import { RealtimeProvider } from '../../components/providers/realtime-provider'
import { I18nProvider } from '../../lib/localization/i18n'
import { BillingProvider } from '../../components/providers/billing-provider'

export default function ProductLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <I18nProvider><AuthGate><BillingProvider><RealtimeProvider>{children}</RealtimeProvider></BillingProvider></AuthGate></I18nProvider>
}
