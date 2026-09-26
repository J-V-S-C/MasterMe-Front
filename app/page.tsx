import { LiveStudy } from '../components/live-study'
import { PageShell } from '../components/page-shell'
import { Suspense } from 'react'

export default function Home() {
  return <PageShell active="study"><main id="main-content" className="page-main" tabIndex={-1}><Suspense fallback={null}><LiveStudy /></Suspense></main></PageShell>
}
