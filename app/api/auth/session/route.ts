import { NextResponse } from 'next/server'
import { authenticatedSession } from '../../../../lib/auth/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await authenticatedSession()
    if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 })
    return NextResponse.json({ data: { id: session.user.id, email: session.user.email } })
  } catch {
    return NextResponse.json({ code: 'AUTH_UNAVAILABLE' }, { status: 503 })
  }
}
