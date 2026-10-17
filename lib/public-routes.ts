const publicPages = new Set(['/', '/entrar', '/auth/callback'])

export function isPublicPage(pathname: string): boolean {
  return publicPages.has(pathname)
}
