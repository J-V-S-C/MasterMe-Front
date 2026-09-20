export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3333'
  const lastEventId = request.headers.get('last-event-id')
  const upstream = await fetch(`${backendUrl}/api/events`, {
    cache: 'no-store',
    headers: lastEventId ? { 'last-event-id': lastEventId } : undefined,
    signal: request.signal,
  })
  if (!upstream.ok || !upstream.body) return new Response(null, { status: upstream.status })
  return new Response(upstream.body, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  })
}
