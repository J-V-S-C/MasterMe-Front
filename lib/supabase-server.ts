import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const configuration = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Supabase Auth não está configurado.')
  return { url, key }
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const { url, key } = configuration()
  return createServerClient(url, key, {
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        for (const { name, value, options } of values) cookieStore.set(name, value, options)
      },
    },
  })
}

export async function authenticatedSession() {
  const supabase = await createSupabaseServerClient()
  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData.user) return null
  const { data } = await supabase.auth.getSession()
  if (!data.session?.access_token) return null
  return { user: userData.user, accessToken: data.session.access_token }
}

/** The API verifies the JWT signature and ownership; the BFF only forwards the cookie token. */
export async function accessTokenForProxy(): Promise<string | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}
