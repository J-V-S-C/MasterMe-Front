const publicPages = new Set(['/', '/login', '/auth/callback'])

export function isPublicPage(pathname: string): boolean {
  return publicPages.has(pathname)
}
