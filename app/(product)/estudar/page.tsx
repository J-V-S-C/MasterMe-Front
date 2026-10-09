import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LiveStudy } from '../../../components/live-study'
import { PageShell } from '../../../components/page-shell'

export const metadata: Metadata = { title: 'Estudar' }

export default function StudyPage() {
  return <PageShell active="study"><main id="main-content" className="page-main" tabIndex={-1}><Suspense fallback={null}><LiveStudy /></Suspense></main></PageShell>
}
