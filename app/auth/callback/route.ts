import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { safeInternalDestination } from '../../../lib/auth-redirect'
import { canonicalAppOrigin } from '../../../lib/canonical-origin'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = canonicalAppOrigin(request.url)
  const code = url.searchParams.get('code')
  const next = safeInternalDestination(url.searchParams.get('next'))
  const destination = new URL('/entrar', origin)
  destination.searchParams.set('next', next)
  if (!code) {
    destination.searchParams.set('auth_error', 'invalid_link')
    return NextResponse.redirect(destination)
  }
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    destination.searchParams.set('auth_error', 'confirmation_failed')
    return NextResponse.redirect(destination)
  }
  return NextResponse.redirect(new URL(next, origin))
}
