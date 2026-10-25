'use client';
import { LibraryWorkspace } from '../../components/library-workspace';
import { I18nProvider } from '../../lib/i18n';
import { PageShell } from '../../components/page-shell';
export default function Preview() { return <I18nProvider><PageShell active="library"><main id="main-content" className="page-main"><LibraryWorkspace /></main></PageShell></I18nProvider>; }
