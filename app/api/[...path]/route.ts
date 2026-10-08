import { accessTokenForProxy } from '../../../lib/supabase-server'

export const dynamic = 'force-dynamic'

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const accessToken = await accessTokenForProxy()
  if (!accessToken) return Response.json({ code: 'UNAUTHENTICATED', message: 'Entre na sua conta para continuar.' }, { status: 401 })
  const { path } = await context.params
  const incoming = new URL(request.url)
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3333'
  const headers = new Headers()
  headers.set('authorization', `Bearer ${accessToken}`)
  const contentType = request.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)
  const ifNoneMatch = request.headers.get('if-none-match')
  if (ifNoneMatch) headers.set('if-none-match', ifNoneMatch)
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer()
  const upstream = await fetch(`${backendUrl}/api/${path.join('/')}${incoming.search}`, {
    method: request.method,
    headers,
    body,
    cache: 'no-store',
    signal: request.signal,
  })
  const responseHeaders = new Headers()
  for (const name of ['content-type', 'cache-control', 'etag', 'vary']) {
    const value = upstream.headers.get(name)
    if (value) responseHeaders.set(name, value)
  }
  const retryAfter = upstream.headers.get('retry-after')
  if (retryAfter) responseHeaders.set('retry-after', retryAfter)
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
