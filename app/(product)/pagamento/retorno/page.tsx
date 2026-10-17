import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PageShell } from '../../../../components/page-shell'
import { PaymentReturn } from '../../../../components/payment-return'

export const metadata: Metadata = { title: 'Pagamento' }

export default function PaymentReturnPage() {
  return <PageShell active="study"><main id="main-content" className="page-main payment-return-page" tabIndex={-1}><Suspense fallback={null}><PaymentReturn /></Suspense></main></PageShell>
}
