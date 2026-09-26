type SkeletonVariant = 'study' | 'map' | 'practice'

export function LoadingSkeleton({ variant = 'study' }: { variant?: SkeletonVariant }) {
  return <section className={`skeleton-layout ${variant}`} role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">Carregando conteúdo</span>
    <div className="skeleton-hero"><div className="skeleton-line short" /><div className="skeleton-line title" /></div>
    {variant === 'map' && <div className="skeleton-stats">{[1, 2, 3, 4].map((item) => <div className="skeleton-block skeleton-stat" key={item} />)}</div>}
    <div className="skeleton-toolbar"><div className="skeleton-line control" /><div className="skeleton-line control" /></div>
    <div className={`skeleton-content ${variant}`}><div className="skeleton-block skeleton-panel" /><div className="skeleton-block skeleton-panel secondary" /></div>
  </section>
}
