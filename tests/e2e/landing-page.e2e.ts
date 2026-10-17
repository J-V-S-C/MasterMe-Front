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
  test(`landing comunica caminhos independentes sem overflow em ${viewport.name}`, async ({ page }) => {
    const unexpectedConsoleErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() !== 'error') return
      if (!expectedDevelopmentConsoleErrors.some((expected) => message.text().includes(expected))) unexpectedConsoleErrors.push(message.text())
    })
    await page.route('**/api/observability', async (route) => route.fulfill({ status: 204 }))
    await page.setViewportSize(viewport)
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 2, name: 'Ler até reconhecer não é o mesmo que conseguir explicar.' })).toBeVisible()
    await expect(page.getByRole('figure', { name: 'Demonstração de um mapa de conhecimento' })).toBeVisible()
    await expect(page.getByText('Começar pela prática')).toBeVisible()
    await expect(page.getByText(/sem iniciar uma explicação/i)).toBeVisible()
    await expect(page.getByText(/após uma explicação aprovada.*nunca por obrigação/i)).toBeVisible()
    const scrollWidth = await page.locator('html').evaluate((element) => element.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(viewport.width)

    const methodLink = page.getByRole('link', { name: 'Conhecer o método' })
    await methodLink.focus()
    await expect(methodLink).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#como-funciona$/)
    expect(unexpectedConsoleErrors).toEqual([])
  })
}
