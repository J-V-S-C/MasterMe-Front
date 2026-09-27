import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../lib/supabase-server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const destination = new URL('/entrar', url.origin)
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
  return NextResponse.redirect(new URL('/', url.origin))
}
