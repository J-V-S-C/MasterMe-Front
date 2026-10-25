import { describe, expect, test } from 'bun:test'

describe('separation between acquisition and product', () => {
  test('root layout does not mount authentication, SSE or remote fonts', async () => {
    const source = await Bun.file(new URL('../../app/layout.tsx', import.meta.url)).text()
    expect(source).not.toContain('AuthGate')
    expect(source).not.toContain('RealtimeProvider')
    expect(source).not.toContain('I18nProvider')
    expect(source).not.toContain('fonts.googleapis.com')
    expect(source).not.toContain('fonts.gstatic.com')
  })

  test('product layout centralizes authentication and real-time updates', async () => {
    const source = await Bun.file(new URL('../../app/(product)/layout.tsx', import.meta.url)).text()
    expect(source).toContain('<AuthGate>')
    expect(source).toContain('<BillingProvider>')
    expect(source).toContain('<RealtimeProvider>')
  })

  test('authenticated navigation uses /study instead of the landing page', async () => {
    const header = await Bun.file(new URL('../../components/site-header.tsx', import.meta.url)).text()
    const map = await Bun.file(new URL('../../components/knowledge-map.tsx', import.meta.url)).text()
    const practice = await Bun.file(new URL('../../components/practice-workspace.tsx', import.meta.url)).text()
    expect(header).toContain("href: '/study'")
    expect(map).toContain('href="/study"')
    expect(map).toContain('href={`/study?material=')
    expect(practice).toContain('href="/study"')
    expect(practice).toContain('href={`/study?material=')
  })

  test('payment return stays within the authenticated product', async () => {
    const publicRoutes = await Bun.file(new URL('../../lib/public-routes.ts', import.meta.url)).text()
    const paymentPage = await Bun.file(new URL('../../app/(product)/payment/return/page.tsx', import.meta.url)).text()
    expect(publicRoutes).not.toContain('/payment/return')
    expect(paymentPage).toContain('<PaymentReturn />')
  })
})
