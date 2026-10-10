import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase-server'
import { safeInternalDestination } from '../../../../lib/auth-redirect'
import { canonicalAppOrigin } from '../../../../lib/canonical-origin'

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') ?? 0) > 4_096) return NextResponse.json({ code: 'AUTH_REQUEST_TOO_LARGE' }, { status: 413 })
  const body = await request.json().catch(() => null) as { email?: string; password?: string; next?: string } | null
  if (!body?.email || body.email.length > 254 || !body.email.includes('@') || !body.password || body.password.length < 8 || body.password.length > 128) return NextResponse.json({ code: 'AUTH_INVALID_SIGNUP_INPUT' }, { status: 400 })
  try {
    const supabase = await createSupabaseServerClient()
    const callback = new URL('/auth/callback', canonicalAppOrigin(request.url))
    callback.searchParams.set('next', safeInternalDestination(body.next))
    const { data, error } = await supabase.auth.signUp({ email: body.email.trim(), password: body.password, options: { emailRedirectTo: callback.toString() } })
    if (error) {
      const codes: Record<string, string> = {
        email_address_invalid: 'AUTH_EMAIL_INVALID',
        email_address_not_authorized: 'AUTH_EMAIL_NOT_AUTHORIZED',
        validation_failed: 'AUTH_EMAIL_INVALID',
        user_already_exists: 'AUTH_USER_EXISTS',
        weak_password: 'AUTH_WEAK_PASSWORD',
        over_email_send_rate_limit: 'AUTH_EMAIL_RATE_LIMITED',
      }
      console.error('Supabase signup failed', { code: error.code, status: error.status })
      return NextResponse.json({ code: codes[error.code ?? ''] ?? 'AUTH_SIGNUP_FAILED' }, { status: error.status === 429 ? 429 : 400 })
    }
    if (!data.user) return NextResponse.json({ code: 'AUTH_SIGNUP_UNCONFIRMED' }, { status: 502 })
    const alreadyRegistered = Array.isArray(data.user.identities) && data.user.identities.length === 0
    if (alreadyRegistered) return NextResponse.json({ code: 'AUTH_USER_EXISTS' }, { status: 409 })
    return NextResponse.json({ data: { authenticated: Boolean(data.session), confirmationRequired: !data.session } }, { status: 201 })
  } catch (error) {
    console.error('Signup configuration failed', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ code: 'AUTH_UNAVAILABLE' }, { status: 503 })
  }
}
