import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase-server'

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') ?? 0) > 4_096) return NextResponse.json({ message: 'Solicitação muito grande.' }, { status: 413 })
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null
  if (!body?.email || body.email.length > 254 || !body.email.includes('@') || !body.password || body.password.length < 8 || body.password.length > 128) return NextResponse.json({ message: 'Use um e-mail válido e uma senha entre 8 e 128 caracteres.' }, { status: 400 })
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signUp({ email: body.email.trim(), password: body.password, options: { emailRedirectTo: `${new URL(request.url).origin}/auth/callback` } })
    if (error) {
      const messages: Record<string, string> = {
        email_address_invalid: 'O Supabase não aceita domínios de exemplo ou teste, como a.com. Use um e-mail real.',
        email_address_not_authorized: 'O SMTP padrão do Supabase não pode enviar confirmação para este endereço. Use um e-mail da organização do projeto, desative a confirmação de e-mail ou configure SMTP próprio.',
        validation_failed: 'O Supabase recusou este endereço. Use um e-mail real, como nome@dominio.com.',
        user_already_exists: 'Já existe uma conta com este e-mail. Tente entrar.',
        weak_password: 'A senha não atende aos requisitos de segurança do projeto.',
        over_email_send_rate_limit: 'O SMTP gratuito do Supabase permite somente 2 e-mails por hora para todo o projeto. Aguarde a janela renovar, desative a confirmação de e-mail para o MVP ou configure SMTP próprio.',
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
