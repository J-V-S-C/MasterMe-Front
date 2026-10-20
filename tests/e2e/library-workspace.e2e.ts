import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1000 },
  { name: 'desktop', width: 1440, height: 1000 },
] as const;

for (const viewport of viewports) {
  test(`library and plan remain usable at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/auth/session') return route.fulfill({ json: { data: { id: 'student', email: 'student@example.test' } } });
      if (path === '/api/events') return route.fulfill({ status: 204 });
      if (path === '/api/materials') return route.fulfill({ json: { data: [{ id: 'material-a', title: 'History of Ideas', locale: 'en-US', createdAt: '2026-01-01' }] } });
      if (path === '/api/learning/materials/material-a/outline') return route.fulfill({ json: { data: [{ id: 'chapter-a', order: 0, title: 'Chapter one', level: 1, startOffset: 0, endOffset: 100, provenance: 'HEADING', pageNumber: 1 }] } });
      if (path === '/api/materials/material-a/knowledge-map') return route.fulfill({ json: { data: [] } });
      if (path === '/api/learning/materials/material-a/relations') return route.fulfill({ json: { data: [] } });
      if (path === '/api/learning/shelves' || path === '/api/learning/cards' || path === '/api/learning/goals' || path === '/api/learning/plans' || path === '/api/learning/tasks' || path === '/api/learning/suggestions' || path === '/api/learning/availability') return route.fulfill({ json: { data: [] } });
      if (path === '/api/billing/me') return route.fulfill({ status: 503, json: { message: 'Unavailable' } });
      if (path === '/api/observability') return route.fulfill({ status: 204 });
      return route.fulfill({ status: 404, json: { message: 'Unexpected test request' } });
    });
    await page.goto('/biblioteca');
    await expect(page.getByRole('heading', { name: 'Sua biblioteca' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('link', { name: /Chapter one/ })).toHaveAttribute('href', '/estudar?material=material-a&unit=chapter-a');
    await page.getByRole('button', { name: 'Calendário' }).click();
    await expect(page.getByRole('heading', { name: 'Novo roteiro' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'History of Ideas' })).toBeVisible();
    const scrollWidth = await page.locator('html').evaluate((element) => element.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: `test-results/library-${viewport.name}.png`, fullPage: true });
  });
}
