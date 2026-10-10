'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, invalidateApiCache, type BillingSummary } from '../lib/api'

type BillingContextValue = {
  balance: BillingSummary | null
  loading: boolean
  unavailable: boolean
  refresh: () => Promise<void>
}

const BillingContext = createContext<BillingContextValue | null>(null)

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<BillingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  const load = useCallback(async (force = false) => {
    if (force) invalidateApiCache('/billing/me')
    setLoading(true)
    try {
      setBalance(await api.billingMe())
      setUnavailable(false)
    } catch {
      setUnavailable(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])
  const value = useMemo<BillingContextValue>(() => ({ balance, loading, unavailable, refresh: () => load(true) }), [balance, loading, unavailable, load])
  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>
}

export function useBilling(): BillingContextValue {
  const value = useContext(BillingContext)
  if (!value) throw new Error('useBilling deve ser usado dentro de BillingProvider.')
  return value
}
