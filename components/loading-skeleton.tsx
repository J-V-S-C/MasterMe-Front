export function LoadingSkeleton({ variant = 'study' }: { variant?: 'study' | 'map' }) {
  return <div className={`skeleton-layout ${variant}`} aria-busy="true" aria-label="Carregando conteúdo"><div className="skeleton-block skeleton-title" /><div className="skeleton-row"><div className="skeleton-block skeleton-panel" /><div className="skeleton-block skeleton-panel" /></div>{variant === 'map' && <div className="skeleton-block skeleton-graph" />}</div>
}
