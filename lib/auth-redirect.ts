export const PLAN_IDS = ['FREE', 'ESSENTIAL', 'PRO'] as const

export type PlanId = (typeof PLAN_IDS)[number]

const defaultDestination = '/estudar'
const allowedDestinations = new Set([
  '/estudar',
  '/mapa-do-conhecimento',
  '/pratica',
])
const allowedPlans = new Set<string>(PLAN_IDS)
const internalOrigin = 'https://masterme.internal'

export function safeInternalDestination(candidate: string | null | undefined): string {
  if (!candidate) return defaultDestination

  try {
    const parsed = new URL(candidate, internalOrigin)
    if (parsed.origin !== internalOrigin || !allowedDestinations.has(parsed.pathname)) {
      return defaultDestination
    }

    const keys = [...parsed.searchParams.keys()]
    if (keys.some((key) => key !== 'plan')) return defaultDestination

    const plans = parsed.searchParams.getAll('plan')
    if (plans.length === 0) return parsed.pathname
    if (plans.length !== 1) return defaultDestination
    const [plan] = plans
    if (!allowedPlans.has(plan)) return defaultDestination

    return `${parsed.pathname}?plan=${plan}`
  } catch {
    return defaultDestination
  }
}

export function loginHrefFor(destination: string): string {
  return `/entrar?next=${encodeURIComponent(safeInternalDestination(destination))}`
}

export function planLoginHref(planId: PlanId): string {
  return loginHrefFor(`/estudar?plan=${planId}`)
}
