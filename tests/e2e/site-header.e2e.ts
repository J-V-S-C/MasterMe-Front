import { expect, test } from '@playwright/test'

for (const width of [320, 390, 768, 1440]) {
  test(`navegação do produto em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.route('**/api/**', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }))
    await page.route('**/api/auth/session', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
    await page.goto('/estudar')

    const menu = page.getByRole('button', { name: 'Abrir menu' })
    const nav = page.getByRole('navigation', { name: 'Navegação principal' })
    if (width < 850) {
      await expect(nav).toBeHidden()
      await menu.click()
      await expect(menu).toHaveAttribute('aria-expanded', 'true')
      await expect(nav).toBeVisible()
      await expect(nav).toBeInViewport()
      await expect(page.getByRole('combobox', { name: 'Idioma' })).toBeVisible()
      await expect(page.getByRole('button', { name: /Ativar tema (claro|escuro)/ })).toBeVisible()
      const navBox = await nav.boundingBox()
      expect(navBox?.x).toBeGreaterThanOrEqual(0)
      expect(navBox?.width).toBeLessThanOrEqual(width)
      expect(navBox?.y).toBeGreaterThanOrEqual(0)
      expect(navBox?.y).toBeLessThan(900)
      await page.keyboard.press('Escape')
      await expect(nav).toBeHidden()
    } else {
      await expect(menu).toBeHidden()
      await expect(nav).toBeVisible()
      const links = await nav.getByRole('link').all()
      expect(links).toHaveLength(4)
      const bounds = await Promise.all(links.map((link) => link.boundingBox()))
      expect(bounds.every((box) => box && box.y === bounds[0]?.y)).toBe(true)
    }
    expect(await page.locator('html').evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(width)
  })
}
