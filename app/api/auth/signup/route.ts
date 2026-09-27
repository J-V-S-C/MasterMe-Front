import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase-server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null
  if (!body?.email || !body.password || body.password.length < 12) return NextResponse.json({ message: 'Use um e-mail válido e uma senha com pelo menos 12 caracteres.' }, { status: 400 })
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signUp({ email: body.email, password: body.password })
  if (error) return NextResponse.json({ message: 'Não foi possível criar a conta.' }, { status: 400 })
  return NextResponse.json({ data: { authenticated: Boolean(data.session), confirmationRequired: !data.session } }, { status: 201 })
}
