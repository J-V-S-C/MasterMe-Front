import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LiveStudy } from '../../../components/study/live-study'
import { PageShell } from '../../../components/shell/page-shell'
import { CheckoutQueryExperience } from '../../../components/billing/checkout-experience'

export const metadata: Metadata = { title: 'Estudar' }

export default function StudyPage() {
  return <PageShell active="study"><main id="main-content" className="page-main" tabIndex={-1}><Suspense fallback={null}><CheckoutQueryExperience /><LiveStudy /></Suspense></main></PageShell>
}
