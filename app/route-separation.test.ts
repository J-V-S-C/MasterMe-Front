import { describe, expect, test } from 'bun:test'

describe('separação entre aquisição e produto', () => {
  test('layout raiz não monta autenticação, SSE ou fontes remotas', async () => {
    const source = await Bun.file(new URL('./layout.tsx', import.meta.url)).text()
    expect(source).not.toContain('AuthGate')
    expect(source).not.toContain('RealtimeProvider')
    expect(source).not.toContain('I18nProvider')
    expect(source).not.toContain('fonts.googleapis.com')
    expect(source).not.toContain('fonts.gstatic.com')
  })

  test('layout do produto concentra autenticação e tempo real', async () => {
    const source = await Bun.file(new URL('./(product)/layout.tsx', import.meta.url)).text()
    expect(source).toContain('<AuthGate>')
    expect(source).toContain('<BillingProvider>')
    expect(source).toContain('<RealtimeProvider>')
  })

  test('navegação autenticada usa /estudar em vez da landing', async () => {
    const header = await Bun.file(new URL('../components/site-header.tsx', import.meta.url)).text()
    const map = await Bun.file(new URL('../components/knowledge-map.tsx', import.meta.url)).text()
    const practice = await Bun.file(new URL('../components/practice-workspace.tsx', import.meta.url)).text()
    expect(header).toContain("href: '/estudar'")
    expect(map).toContain('href="/estudar"')
    expect(map).toContain('href={`/estudar?material=')
    expect(practice).toContain('href="/estudar"')
    expect(practice).toContain('href={`/estudar?material=')
  })

  test('retorno de pagamento permanece dentro do produto autenticado', async () => {
    const publicRoutes = await Bun.file(new URL('../lib/public-routes.ts', import.meta.url)).text()
    const paymentPage = await Bun.file(new URL('./(product)/pagamento/retorno/page.tsx', import.meta.url)).text()
    expect(publicRoutes).not.toContain('pagamento/retorno')
    expect(paymentPage).toContain('<PaymentReturn />')
  })
})
