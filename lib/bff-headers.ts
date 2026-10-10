const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{8,128}$/

export class InvalidProxyHeaderError extends Error {}

export function buildBackendHeaders(request: Request, accessToken: string, path: readonly string[]): Headers {
  const headers = new Headers({ authorization: `Bearer ${accessToken}` })
  const contentType = request.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)
  const ifNoneMatch = request.headers.get('if-none-match')
  if (ifNoneMatch) headers.set('if-none-match', ifNoneMatch)

  const idempotencyKey = request.headers.get('idempotency-key')
  const isCheckout = request.method === 'POST' && path.length === 2 && path[0] === 'billing' && path[1] === 'checkouts'
  if (isCheckout) {
    if (!idempotencyKey || !IDEMPOTENCY_KEY.test(idempotencyKey)) {
      throw new InvalidProxyHeaderError('Idempotency-Key inválida.')
    }
    headers.set('idempotency-key', idempotencyKey)
  }
  return headers
}
