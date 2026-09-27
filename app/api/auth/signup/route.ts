import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase-server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null
  if (!body?.email || !body.email.includes('@') || !body.password || body.password.length < 8) return NextResponse.json({ message: 'Use um e-mail válido e uma senha com pelo menos 8 caracteres.' }, { status: 400 })
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signUp({ email: body.email.trim(), password: body.password, options: { emailRedirectTo: `${new URL(request.url).origin}/auth/callback` } })
    if (error) {
      const messages: Record<string, string> = {
        email_address_invalid: 'Não conseguimos usar este e-mail. Confira se existe texto antes e depois do @.',
        validation_failed: 'Não conseguimos usar este e-mail. Confira se existe texto antes e depois do @.',
        user_already_exists: 'Já existe uma conta com este e-mail. Tente entrar.',
        weak_password: 'A senha não atende aos requisitos de segurança do projeto.',
        over_email_send_rate_limit: 'O envio de confirmação do Supabase está temporariamente limitado para este projeto. Aguarde alguns minutos e tente novamente.',
      }
      console.error('Supabase signup failed', { code: error.code, status: error.status })
      return NextResponse.json({ message: messages[error.code ?? ''] ?? 'Não foi possível criar a conta agora. Tente novamente.' }, { status: error.status === 429 ? 429 : 400 })
    }
    if (!data.user) return NextResponse.json({ message: 'O Supabase não confirmou a criação da conta.' }, { status: 502 })
    const alreadyRegistered = Array.isArray(data.user.identities) && data.user.identities.length === 0
    if (alreadyRegistered) return NextResponse.json({ message: 'Já existe uma conta com este e-mail. Tente entrar.' }, { status: 409 })
    return NextResponse.json({ data: { authenticated: Boolean(data.session), confirmationRequired: !data.session } }, { status: 201 })
  } catch (error) {
    console.error('Signup configuration failed', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ message: 'A autenticação está temporariamente indisponível.' }, { status: 503 })
  }
}
