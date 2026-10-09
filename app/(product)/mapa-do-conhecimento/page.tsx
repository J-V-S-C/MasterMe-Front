import type { Metadata } from 'next'
import { KnowledgeMap } from '../../../components/knowledge-map'
import { PageShell } from '../../../components/page-shell'

export const metadata: Metadata = { title: 'Mapa do conhecimento' }

export default function KnowledgeMapPage() {
  return <PageShell active="map"><main id="main-content" className="page-main map-page" tabIndex={-1}><KnowledgeMap /></main></PageShell>
}
