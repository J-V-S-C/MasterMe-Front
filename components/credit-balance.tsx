'use client'

import { useBilling } from './billing-provider'
import { useI18n } from '../lib/i18n'

const planKey = {
  FREE: 'planFree',
  ESSENTIAL: 'planEssential',
  PRO: 'planPro',
} as const

export function CreditBalance({ compact = false }: { compact?: boolean }) {
  const { locale, t } = useI18n()
  const { balance, loading, unavailable } = useBilling()
  if (loading && !balance) return <div className={`credit-balance ${compact ? 'compact' : ''}`} aria-busy="true"><span>{t('creditBalance')}</span><strong>—</strong></div>
  if (!balance) return compact ? <span className="credit-unavailable" title={t('creditUnavailable')}>—</span> : <div className="credit-balance unavailable" role="status">{t('creditUnavailable')}</div>

  const number = new Intl.NumberFormat(locale)
  const available = Math.min(balance.dailyRemaining, balance.periodRemaining)
  const plan = t(planKey[balance.planId])
  if (compact) {
    return <div className="credit-balance compact" title={`${t('creditBalance')}: ${plan}. ${available} ${t('credits')} ${t('creditRemaining')}.`}><span>{plan}</span><strong>{number.format(available)} <small>{t('credits')}</small></strong>{unavailable && <i aria-label={t('creditUnavailable')}>!</i>}</div>
  }

  const reset = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(balance.dailyResetsAt))
  return <section className="credit-balance-panel" aria-labelledby="credit-balance-title">
    <header><div><span>{plan}</span><h2 id="credit-balance-title">{t('creditBalance')}</h2></div><strong>{number.format(available)} <small>{t('credits')} {t('creditRemaining')}</small></strong></header>
    <div className="credit-limits">
      <div><span>{t('creditDaily')}</span><b>{number.format(balance.dailyRemaining)} / {number.format(balance.dailyLimit)}</b><progress aria-label={`${t('creditDaily')}: ${balance.dailyRemaining} ${t('credits')} ${t('creditRemaining')}`} value={balance.dailyRemaining} max={balance.dailyLimit} /><small>{t('creditResets')} {reset}</small></div>
      <div><span>{t('creditPeriod')}</span><b>{number.format(balance.periodRemaining)} / {number.format(balance.periodLimit)}</b><progress aria-label={`${t('creditPeriod')}: ${balance.periodRemaining} ${t('credits')} ${t('creditRemaining')}`} value={balance.periodRemaining} max={balance.periodLimit} /><small>{number.format(balance.periodUsed)} {t('credits')} {t('creditUsed')}</small></div>
    </div>
    <div className="credit-estimates"><span>{t('creditEstimates')}</span><ul><li><b>{number.format(balance.estimates.INITIAL_EVALUATION)}</b> {t('estimateEvaluations')}</li><li><b>{number.format(balance.estimates.EXTRACTION)}</b> {t('estimateExtractions')}</li><li><b>{number.format(balance.estimates.PRACTICE_PROJECT)}</b> {t('estimateProjects')}</li></ul></div>
    {unavailable && <p className="credit-stale" role="status">{t('creditUnavailable')}</p>}
  </section>
}
