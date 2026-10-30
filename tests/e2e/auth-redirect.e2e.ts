import { expect, test } from '@playwright/test'

test('guest Study and Practice links keep their context through login', async ({ page }) => {
  for (const destination of [
    '/study?material=book-1&concept=idea-2&review=review-3',
    '/practice?material=book-1&project=project-2',
  ]) {
    await page.goto(destination)
    await expect(page).toHaveURL(/\/login\?next=/)
    expect(new URL(page.url()).searchParams.get('next')).toBe(destination)
    await expect(page.locator('form').first()).toBeVisible()
  }
})
