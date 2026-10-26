import { expect, test } from '@playwright/test';

const task = {
  id: 'task-one', title: 'Review chapter', sort_order: 0, activity_type: 'READ',
  plan_id: null, material_id: null, concept_id: null, unit_id: null,
  duration_minutes: 30, scheduled_at: '2026-10-25T12:00:00.000Z', status: 'PENDING', reason: '',
};

for (const width of [390, 768, 1440]) {
  test(`task calendar and editor remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let savedTitle = task.title;
    let savedStatus = task.status;
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/auth/session') return route.fulfill({ json: { data: { id: 'student' } } });
      if (path === '/api/learning/tasks/task-one' && route.request().method() === 'PATCH') {
        savedTitle = (route.request().postDataJSON() as { title: string }).title;
        return route.fulfill({ json: { data: { ...task, title: savedTitle } } });
      }
      if (path === '/api/learning/tasks/order' && route.request().method() === 'PUT') {
        savedStatus = (route.request().postDataJSON() as { statuses: Record<string, string> }).statuses[task.id] ?? savedStatus;
        return route.fulfill({ json: { data: [{ ...task, title: savedTitle, status: savedStatus }] } });
      }
      if (path === '/api/learning/tasks') return route.fulfill({ json: { data: [{ ...task, title: savedTitle, status: savedStatus }] } });
      if (path === '/api/materials' || path === '/api/learning/suggestions') return route.fulfill({ json: { data: [] } });
      if (path === '/api/events' || path === '/api/observability') return route.fulfill({ status: 204 });
      if (path === '/api/billing/me') return route.fulfill({ status: 503, json: { message: 'Unavailable' } });
      return route.fulfill({ status: 404, json: { message: 'Unexpected test request' } });
    });
    await page.goto('/library');
    await expect(page.getByRole('heading', { name: 'Tarefas' })).toBeVisible();
    const calendar = page.getByRole('tabpanel', { name: /Quando/ });
    await expect(calendar).toBeVisible();
    const calendarWidth = await calendar.boundingBox();
    const composerWidth = await page.locator('section[aria-labelledby="composer-title"]').boundingBox();
    const preview = page.getByLabel('Prévia do cartão');
    await expect(preview).toBeVisible();
    const previewBox = await preview.boundingBox();
    if (width === 1440) {
      expect(calendarWidth!.width).toBeLessThan(composerWidth!.width * 0.7);
      expect(previewBox!.x).toBeGreaterThan(calendarWidth!.x + calendarWidth!.width);
    } else {
      expect(previewBox!.y).toBeGreaterThan(calendarWidth!.y);
    }
    expect(await page.locator('html').evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(width);

    await page.getByRole('tab', { name: /Detalhes/ }).click();
    await page.getByRole('textbox', { name: 'Horário' }).fill('14:37');
    await expect(page.getByRole('tab', { name: /Detalhes/ })).toContainText('14:37');
    await page.getByRole('tab', { name: /Quadro/ }).click();
    const card = page.locator('#task-task-one');
    await card.getByRole('button', { name: 'Editar' }).click();
    const editor = card.locator('form');
    await expect(editor).toBeVisible();
    await editor.getByLabel('Tarefa').fill('Review new chapter');
    await editor.getByRole('button', { name: 'Salvar' }).click();
    await expect(card.getByText('Review new chapter')).toBeVisible();
    expect(savedTitle).toBe('Review new chapter');
    expect(await page.locator('html').evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(width);
    if (width === 1440) {
      const source = await card.boundingBox();
      const target = await page.getByRole('region', { name: 'Fazendo' }).boundingBox();
      await page.mouse.move(source!.x + 18, source!.y + 18);
      await page.mouse.down();
      await page.mouse.move(target!.x + target!.width / 2, target!.y + target!.height / 2, { steps: 12 });
      await page.mouse.up();
      await expect(page.getByRole('region', { name: 'Fazendo' }).locator('#task-task-one')).toBeVisible();
      expect(savedStatus).toBe('IN_PROGRESS');
    }
  });
}

test('temporary session failure offers a retry without navigating to login', async ({ page }) => {
  let available = false;
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/session') return available
      ? route.fulfill({ json: { data: { id: 'student' } } })
      : route.fulfill({ status: 503, json: { code: 'AUTH_UNAVAILABLE' } });
    if (path === '/api/materials' || path === '/api/learning/tasks' || path === '/api/learning/suggestions') return route.fulfill({ json: { data: [] } });
    if (path === '/api/events' || path === '/api/observability') return route.fulfill({ status: 204 });
    return route.fulfill({ status: 503, json: { message: 'Unavailable' } });
  });
  await page.goto('/library');
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
  await expect(page).toHaveURL(/\/library$/);
  available = true;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('heading', { name: 'Tarefas' })).toBeVisible();
});
