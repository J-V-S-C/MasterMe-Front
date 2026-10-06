type Entry = { count: number; resetAt: number }

const entries = new Map<string, Entry>()
const MAX_ENTRIES = 5_000

export function enforceRequestRateLimit(request: Request, scope: string, max: number, windowMs: number): Response | null {
  const now = Date.now()
  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const key = `${scope}:${ip}`
  const current = entries.get(key)
  const entry = !current || current.resetAt <= now ? { count: 1, resetAt: now + windowMs } : { ...current, count: current.count + 1 }
  entries.set(key, entry)

  if (entries.size > MAX_ENTRIES) {
    for (const [storedKey, stored] of entries) {
      if (stored.resetAt <= now || entries.size > MAX_ENTRIES) entries.delete(storedKey)
      if (entries.size <= MAX_ENTRIES) break
    }
  }

  if (entry.count <= max) return null
  const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1_000))
  return Response.json(
    { code: 'RATE_LIMITED', message: 'Muitas tentativas. Aguarde um pouco e tente novamente.' },
    { status: 429, headers: { 'retry-after': String(retryAfter), 'cache-control': 'no-store' } },
  )
}
