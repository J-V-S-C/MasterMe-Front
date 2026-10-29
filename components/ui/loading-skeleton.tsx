import { useI18n } from '../../lib/localization/i18n'

type SkeletonVariant = 'study' | 'practice' | 'record'

export function LoadingSkeleton({ variant = 'study' }: { variant?: SkeletonVariant }) {
  const { locale } = useI18n()
  return <section className={`skeleton-layout ${variant}`} role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">{locale === 'pt-BR' ? 'Carregando conteúdo' : 'Loading content'}</span>
    <div className="skeleton-hero"><div className="skeleton-line short" /><div className="skeleton-line title" /></div>
    <div className="skeleton-toolbar"><div className="skeleton-line control" /><div className="skeleton-line control" /></div>
    <div className={`skeleton-content ${variant}`}><div className="skeleton-block skeleton-panel" />{variant !== 'record' && <div className="skeleton-block skeleton-panel secondary" />}</div>
  </section>
}
