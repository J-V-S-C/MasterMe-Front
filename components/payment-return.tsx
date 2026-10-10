'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '../lib/api'
import { clearCheckoutIntent, paymentReturnReference } from '../lib/billing-security'
import { reconcilePaymentReturn, type PaymentReturnState } from '../lib/payment-return'
import { useBilling } from './billing-provider'
import { useI18n } from '../lib/i18n'
import { ActionButton } from './action-button'
import { Icon } from '../lib/icons'

export function PaymentReturn() {
  const search = useSearchParams()
  const router = useRouter()
  const [payment] = useState(() => paymentReturnReference(new URLSearchParams(search.toString())))
  const { refresh } = useBilling()
  const { t } = useI18n()
  const [state, setState] = useState<PaymentReturnState | { status: 'checking'; order: null }>({ status: 'checking', order: null })
  const checking = useRef(false)

  const check = useCallback(async () => {
    if (!payment || checking.current) return
    checking.current = true
    setState({ status: 'checking', order: null })
    try {
      const result = await reconcilePaymentReturn(payment, api.reconcileOrder, refresh)
      if (result.status === 'success') clearCheckoutIntent(result.order.planId)
      setState(result)
    }
    finally { checking.current = false }
  }, [payment, refresh])
  useEffect(() => { if (search.toString()) router.replace('/pagamento/retorno', { scroll: false }) }, [router, search])
  useEffect(() => { if (payment) void check() }, [payment, check])

  if (!payment) return <ReturnCard kind="error" title={t('paymentInvalidReturn')} description={t('paymentErrorDescription')} />
  if (state.status === 'checking') return <ReturnCard kind="checking" title={t('paymentChecking')} description={t('paymentCheckingDescription')} />
  if (state.status === 'success') return <ReturnCard kind="success" title={t('paymentSuccess')} description={t('paymentSuccessDescription')} />
  if (state.status === 'pending') return <ReturnCard kind="pending" title={t('paymentPending')} description={t('paymentPendingDescription')} onRetry={check} />
  return <ReturnCard kind="error" title={t('paymentError')} description={t('paymentErrorDescription')} onRetry={check} />
}

function ReturnCard({ kind, title, description, onRetry }: { kind: 'checking' | 'pending' | 'success' | 'error'; title: string; description: string; onRetry?: () => Promise<void> }) {
  const { t } = useI18n()
  return <section className={`payment-return-card ${kind}`} aria-live="polite" aria-busy={kind === 'checking'}>
    <div className="payment-return-icon"><Icon name={kind === 'success' ? 'check' : kind === 'error' ? 'warning' : 'sparkles'} /></div>
    <span>{t('paymentReturnEyebrow')}</span><h1>{title}</h1><p>{description}</p>
    <div>{onRetry && <ActionButton variant="primary" onClick={() => void onRetry()}>{t('paymentRetry')}</ActionButton>}<Link className="app-button secondary" href="/estudar">{t('paymentGoStudy')}</Link></div>
  </section>
}
