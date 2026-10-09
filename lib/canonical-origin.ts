const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

export function canonicalAppOrigin(
  requestUrl?: string,
  configured = process.env.PUBLIC_APP_URL,
  nodeEnv = process.env.NODE_ENV,
): string {
  if (configured) {
    const url = new URL(configured)
    const validProtocol = nodeEnv === 'production' ? url.protocol === 'https:' : ['http:', 'https:'].includes(url.protocol)
    if (!validProtocol || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      throw new Error('PUBLIC_APP_URL deve ser uma origem HTTPS sem path, query ou credenciais.')
    }
    return url.origin
  }

  if (nodeEnv === 'production') throw new Error('PUBLIC_APP_URL é obrigatória em produção.')
  if (requestUrl) {
    const candidate = new URL(requestUrl)
    if (LOCAL_HOSTS.has(candidate.hostname) && ['http:', 'https:'].includes(candidate.protocol)) return candidate.origin
  }
  return 'http://localhost:3000'
}
