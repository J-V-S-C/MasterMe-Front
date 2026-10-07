import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase-server'

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') ?? 0) > 4_096) return NextResponse.json({ message: 'Solicitação muito grande.' }, { status: 413 })
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null
  if (!body?.email || body.email.length > 254 || !body.password || body.password.length > 128) return NextResponse.json({ message: 'Informe e-mail e senha válidos.' }, { status: 400 })
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email: body.email.trim(), password: body.password })
    if (error || !data.user) return NextResponse.json({ message: 'E-mail ou senha inválidos.' }, { status: 401 })
    return NextResponse.json({ data: { id: data.user.id, email: data.user.email } })
  } catch {
    return NextResponse.json({ message: 'A autenticação está temporariamente indisponível.' }, { status: 503 })
  }
}
