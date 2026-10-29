import type { Metadata } from 'next'
import { PracticeWorkspace } from '../../../components/practice/practice-workspace'
import { PageShell } from '../../../components/shell/page-shell'
import { Suspense } from 'react'

export const metadata: Metadata = { title: 'Projeto de prática' }

export default function PracticePage() {
  return <PageShell active="practice"><main id="main-content" className="page-main practice-page" tabIndex={-1}><Suspense fallback={null}><PracticeWorkspace /></Suspense></main></PageShell>
}
