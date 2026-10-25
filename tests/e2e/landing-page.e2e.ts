import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1000 },
  { name: 'desktop', width: 1440, height: 1000 },
] as const

const expectedDevelopmentConsoleErrors = [
  'eval() is not supported in this environment',
  'WebSocket connection to',
  '/_next/hmr',
]

for (const viewport of viewports) {
  test(`landing navigation fits ${viewport.name}`, async ({ page }) => {
    const unexpectedConsoleErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() !== 'error') return
      if (!expectedDevelopmentConsoleErrors.some((expected) => message.text().includes(expected))) unexpectedConsoleErrors.push(message.text())
    })
    await page.route('**/api/observability', async (route) => route.fulfill({ status: 204 }))
    await page.setViewportSize(viewport)
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1, name: /Organize o que estudar/ })).toBeVisible()
    await expect(page.getByRole('figure', { name: 'Exemplo de mapa de conhecimento e diagnóstico' })).toBeVisible()
    const headerTabs = page.locator('header nav[aria-label="Seções da página"]')
    const footerTabs = page.getByRole('navigation', { name: 'Navegação do rodapé' })
    if (viewport.width <= 760) await expect(headerTabs).toBeHidden()
    else await expect(headerTabs).toBeVisible()
    for (const tab of ['Estudar', 'Tarefas', 'Analisar', 'Criar']) {
      if (viewport.width > 760) await expect(headerTabs.getByRole('link', { name: tab })).toBeVisible()
      await expect(footerTabs.getByRole('link', { name: tab })).toBeVisible()
    }
    await expect(page.locator('footer').getByRole('link', { name: 'Planos' })).toBeVisible()
    await expect(page.locator('footer').getByRole('link', { name: 'Entrar' })).toBeVisible()
    expect(await headerTabs.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(
      await footerTabs.evaluate((element) => getComputedStyle(element).backgroundColor),
    )
    const scrollWidth = await page.locator('html').evaluate((element) => element.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(viewport.width)

    const methodLink = page.getByRole('link', { name: 'Ver como funciona' })
    await methodLink.focus()
    await expect(methodLink).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#how-it-works$/)
    expect(unexpectedConsoleErrors).toEqual([])
  })
}

test('legacy paths redirect to English routes and preserve payment references', async ({ request }) => {
  const routes = [
    ['/entrar', '/login'],
    ['/estudar', '/study'],
    ['/biblioteca', '/library'],
    ['/mapa-do-conhecimento', '/knowledge-map'],
    ['/pratica', '/practice'],
    ['/pagamento/retorno?orderId=11111111-1111-4111-8111-111111111111', '/payment/return?orderId=11111111-1111-4111-8111-111111111111'],
  ] as const

  for (const [legacy, current] of routes) {
    const response = await request.get(legacy, { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    const location = response.headers().location
    expect(location).toBeTruthy()
    expect(new URL(location, 'http://localhost').pathname + new URL(location, 'http://localhost').search).toBe(current)
  }
})
