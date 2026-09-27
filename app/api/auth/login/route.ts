import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase-server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null
  if (!body?.email || !body.password) return NextResponse.json({ message: 'Informe e-mail e senha.' }, { status: 400 })
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email: body.email, password: body.password })
  if (error || !data.user) return NextResponse.json({ message: 'E-mail ou senha inválidos.' }, { status: 401 })
  return NextResponse.json({ data: { id: data.user.id, email: data.user.email } })
}
