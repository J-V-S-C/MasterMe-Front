import { LiveStudy } from '../components/live-study'
import { PageShell } from '../components/page-shell'
import { Suspense } from 'react'

export default function Home() {
  return <PageShell active="study"><main id="workspace" className="page-main"><section className="workspace-heading"><div><span>Estudo ativo Feynman</span><h1>Espaço de estudo</h1></div></section><Suspense fallback={null}><LiveStudy /></Suspense></main></PageShell>
}
