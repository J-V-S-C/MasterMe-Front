import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase-server'

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') ?? 0) > 4_096) return NextResponse.json({ code: 'AUTH_REQUEST_TOO_LARGE' }, { status: 413 })
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null
  if (!body?.email || body.email.length > 254 || !body.password || body.password.length > 128) return NextResponse.json({ code: 'AUTH_INVALID_LOGIN_INPUT' }, { status: 400 })
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email: body.email.trim(), password: body.password })
    if (error || !data.user) return NextResponse.json({ code: 'AUTH_INVALID_CREDENTIALS' }, { status: 401 })
    return NextResponse.json({ data: { id: data.user.id, email: data.user.email } })
  } catch {
    return NextResponse.json({ code: 'AUTH_UNAVAILABLE' }, { status: 503 })
  }
}
