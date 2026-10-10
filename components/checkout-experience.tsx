'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ActionButton } from './action-button'
import { api, type BillingCatalog } from '../lib/api'
import { checkoutIntentKey, requestedPlan, safeInfinitePayCheckoutUrl, type RequestedPlan } from '../lib/billing-security'
import { useI18n } from '../lib/i18n'

export function CheckoutQueryExperience() {
  const search = useSearchParams()
  const router = useRouter()
  const serializedSearch = search.toString()
  const [consumedPlan, setConsumedPlan] = useState<RequestedPlan | null | undefined>(undefined)
  useEffect(() => {
    const current = new URLSearchParams(serializedSearch)
    if (current.getAll('plan').length === 0) return
    setConsumedPlan(requestedPlan(current))
    router.replace('/estudar', { scroll: false })
  }, [serializedSearch, router])
  if (consumedPlan === undefined) return null
  return <CheckoutExperience plan={consumedPlan} />
}

export function CheckoutExperience({
  plan,
  navigate = (url) => window.location.assign(url),
}: {
  plan: RequestedPlan | null
  navigate?: (url: string) => void
}) {
  const { locale, t } = useI18n()
  const [catalog, setCatalog] = useState<BillingCatalog | null>(null)
  const [loadingCatalog, setLoadingCatalog] = useState(plan !== 'FREE' && plan !== null)
  const [submitting, setSubmitting] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [error, setError] = useState('')
  const activeRequest = useRef(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!plan || plan === 'FREE') return
    let active = true
    void api.billingCatalog().then((value) => { if (active) setCatalog(value) }).catch(() => { if (active) setError(t('checkoutUnavailable')) }).finally(() => { if (active) setLoadingCatalog(false) })
    return () => { active = false }
  }, [plan, t])
  useEffect(() => {
    if (!plan || plan === 'FREE' || dismissed) return
    const previousFocus = document.activeElement as HTMLElement | null
    titleRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !activeRequest.current) setDismissed(true)
      if (event.key !== 'Tab') return
      const controls = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]') ?? [])]
      if (!controls.length) { event.preventDefault(); titleRef.current?.focus(); return }
      const first = controls[0]
      const last = controls.at(-1)!
      const focusInsideDialog = dialogRef.current?.contains(document.activeElement)
      if (event.shiftKey && (document.activeElement === titleRef.current || document.activeElement === first || !focusInsideDialog)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === titleRef.current || !focusInsideDialog)) { event.preventDefault(); first.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', handleKey)
    return () => { window.removeEventListener('keydown', handleKey); previousFocus?.focus() }
  }, [plan, dismissed])

  if (plan === 'FREE' || dismissed) return null
  if (!plan) return <p className="checkout-query-error" role="alert">{t('checkoutInvalidPlan')}</p>
  const selected = catalog?.plans.find((candidate) => candidate.id === plan)
  const price = selected ? new Intl.NumberFormat(locale, { style: 'currency', currency: catalog?.currency ?? 'BRL' }).format(selected.priceInCents / 100) : '—'
  const planName = t(plan === 'PRO' ? 'planPro' : 'planEssential')

  const startCheckout = async () => {
    if (activeRequest.current || !selected) return
    activeRequest.current = true
    setSubmitting(true)
    setError('')
    try {
      const key = checkoutIntentKey(plan)
      const order = await api.createCheckout(plan, key)
      const destination = order.planId === plan ? safeInfinitePayCheckoutUrl(order.checkoutUrl) : null
      if (!destination) {
        setError(t('checkoutInvalidUrl'))
        return
      }
      navigate(destination)
    } catch {
      setError(t('checkoutUnavailable'))
    } finally {
      activeRequest.current = false
      setSubmitting(false)
    }
  }

  return <div className="checkout-overlay" role="presentation"><section ref={dialogRef} className="checkout-dialog" role="dialog" aria-modal="true" aria-labelledby="checkout-title" aria-describedby="checkout-description">
    <span>{t('checkoutEyebrow')}</span>
    <h1 id="checkout-title" ref={titleRef} tabIndex={-1}>{t('checkoutTitle')} · {planName}</h1>
    <p id="checkout-description">{t('checkoutDescription')}</p>
    <div className="checkout-offer"><strong>{price}</strong><span>{selected?.durationDays ? `${selected.durationDays} ${locale === 'pt-BR' ? 'dias' : 'days'}` : ''}</span><small>{t('checkoutOneTime')}</small></div>
    {selected && <dl><div><dt>{t('creditDaily')}</dt><dd>{new Intl.NumberFormat(locale).format(selected.dailyCreditLimit)} {t('credits')}</dd></div><div><dt>{t('creditPeriod')}</dt><dd>{new Intl.NumberFormat(locale).format(selected.periodCreditLimit)} {t('credits')}</dd></div></dl>}
    {error && <p className="checkout-error" role="alert">{error}</p>}
    <div className="checkout-actions"><ActionButton variant="primary" disabled={submitting || loadingCatalog || !selected} onClick={() => void startCheckout()}>{submitting ? t('checkoutPreparing') : t('checkoutContinue')}</ActionButton><ActionButton variant="ghost" disabled={submitting} onClick={() => setDismissed(true)}>{t('checkoutCancel')}</ActionButton></div>
  </section></div>
}
