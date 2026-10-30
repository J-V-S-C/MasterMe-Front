import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Study history' }

export default async function KnowledgeMapPage({ searchParams }: { searchParams: Promise<{ material?: string }> }) {
  const { material } = await searchParams
  redirect(`/study?record=1${material ? `&material=${encodeURIComponent(material)}` : ''}`)
}
