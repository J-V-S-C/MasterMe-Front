import type { Metadata } from 'next';
import { PageShell } from '../../../components/page-shell';
import { LibraryWorkspace } from '../../../components/library-workspace';

export const metadata: Metadata = { title: 'Biblioteca e planejamento' };

export default function LibraryPage() {
  return <PageShell active="library"><main id="main-content" tabIndex={-1}><LibraryWorkspace /></main></PageShell>;
}
