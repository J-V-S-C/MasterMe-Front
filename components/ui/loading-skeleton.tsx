import { useI18n } from '../../lib/localization/i18n'

type SkeletonVariant = 'study' | 'practice' | 'record'

const loadingCopy = {
  'pt-BR': { study: 'Carregando estudo', practice: 'Carregando prática', record: 'Carregando histórico e lacunas' },
  'en-US': { study: 'Loading study', practice: 'Loading practice', record: 'Loading history and gaps' },
} as const

function Line({ width, height }: { width: string; height?: string }) {
  return <span className="skeleton-line" style={{ width, height }} />
}

function StudyShape() {
  return <div className="skeleton-study" aria-hidden="true">
    <div className="skeleton-study-nav"><span /><span /></div>
    <div className="skeleton-study-material">
      <div className="skeleton-fields"><div><Line width="28%" /><div className="skeleton-input" /></div><div><Line width="22%" /><div className="skeleton-input" /></div><div><Line width="26%" /><div className="skeleton-input" /></div></div>
      <div className="skeleton-disclosure"><Line width="34%" /><Line width="18%" /></div>
    </div>
    <div className="skeleton-study-work">
      <div className="skeleton-study-activity"><Line width="22%" /><Line width="38%" height="22px" /><Line width="58%" /></div>
      <div className="skeleton-study-question"><Line width="24%" /><Line width="88%" height="22px" /><Line width="68%" height="22px" /><div className="skeleton-question-actions"><Line width="32%" /><Line width="27%" /></div></div>
      <div className="skeleton-answer"><Line width="18%" /><Line width="76%" /><Line width="63%" /></div>
    </div>
  </div>
}

function PracticeShape({ contentOnly }: { contentOnly: boolean }) {
  return <div className="skeleton-practice" aria-hidden="true">
    {!contentOnly && <div className="skeleton-practice-heading"><div><Line width="26%" /><Line width="62%" height="42px" /><Line width="84%" /></div><div className="skeleton-input" /></div>}
    <div className="skeleton-practice-modes"><span /><span /></div>
    <div className="skeleton-practice-intro"><div><Line width="28%" /><Line width="48%" height="28px" /><Line width="82%" /></div><div className="skeleton-input" /></div>
    <div className="skeleton-practice-question"><Line width="23%" /><Line width="74%" height="22px" /><Line width="57%" /><div className="skeleton-answer"><Line width="74%" /><Line width="54%" /></div></div>
  </div>
}

function RecordShape({ contentOnly }: { contentOnly: boolean }) {
  return <div className="skeleton-record" aria-hidden="true">
    {!contentOnly && <div className="skeleton-record-heading"><Line width="52%" height="34px" /><Line width="76%" /></div>}
    <div className="skeleton-record-stats"><span><Line width="30px" height="22px" /><Line width="90px" /></span><span><Line width="30px" height="22px" /><Line width="90px" /></span></div>
    <div className="skeleton-record-chapter"><Line width="26%" /><Line width="56%" height="26px" /></div>
    <div className="skeleton-record-row"><div><Line width="31%" /><Line width="45%" height="22px" /></div><Line width="88%" /><Line width="66%" /></div>
    <div className="skeleton-record-row"><div><Line width="28%" /><Line width="38%" height="22px" /></div><Line width="75%" /><Line width="58%" /></div>
  </div>
}

export function LoadingSkeleton({ variant = 'study', contentOnly = false }: { variant?: SkeletonVariant; contentOnly?: boolean }) {
  const { locale } = useI18n()
  return <section className={`skeleton-layout${contentOnly ? ' skeleton-content-only' : ''}`} role="status" aria-live="polite" aria-busy="true">
    <span className="skeleton-status">{loadingCopy[locale][variant]}…</span>
    {variant === 'study' ? <StudyShape /> : variant === 'practice' ? <PracticeShape contentOnly={contentOnly} /> : <RecordShape contentOnly={contentOnly} />}
  </section>
}
