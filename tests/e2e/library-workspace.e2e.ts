import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1000 },
  { name: 'desktop', width: 1440, height: 1000 },
] as const

for (const viewport of viewports) {
  test(`task workspace remains usable at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/auth/session') return route.fulfill({ json: { data: { id: 'student', email: 'student@example.test' } } })
      if (path === '/api/materials') return route.fulfill({ json: { data: [{ id: 'material-a', title: 'History of Ideas', locale: 'en-US', createdAt: '2026-01-01' }] } })
      if (path === '/api/materials/material-a/concepts') return route.fulfill({ json: { data: [{ id: 'concept-a', name: 'Ideas' }] } })
      if (path === '/api/learning/tasks' || path === '/api/learning/suggestions' || path === '/api/learning/reviews/due') return route.fulfill({ json: { data: [] } })
      if (path === '/api/events' || path === '/api/observability') return route.fulfill({ status: 204 })
      if (path === '/api/billing/me') return route.fulfill({ status: 503, json: { message: 'Unavailable' } })
      return route.fulfill({ status: 404, json: { message: 'Unexpected test request' } })
    })

    await page.goto('/library')
    await expect(page.getByRole('heading', { name: 'Tarefas' })).toBeVisible()
    await expect(page.getByLabel('Prévia do cartão')).toBeVisible()
    await page.getByRole('tab', { name: /Detalhes/ }).click()
    await expect(page.getByRole('combobox', { name: 'Material' })).toBeVisible()
    await page.getByRole('combobox', { name: 'Material' }).selectOption('material-a')
    await expect(page.getByLabel('Prévia do cartão')).toContainText('History of Ideas')
    await page.getByRole('tab', { name: /Quadro/ }).click()
    await expect(page.getByRole('region', { name: 'A fazer' })).toBeVisible()
    expect(await page.locator('html').evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(viewport.width)
  })
}
