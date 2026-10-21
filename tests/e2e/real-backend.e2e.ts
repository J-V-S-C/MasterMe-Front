import { expect, test, type BrowserContext } from '@playwright/test';

const backend = process.env.PHASE2_REAL_BACKEND_URL;
const ownerA = '11111111-1111-4111-8111-111111111111';
const ownerB = '77777777-7777-4777-8777-777777777777';

const connect = async (context: BrowserContext, owner: string) => {
  await context.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url());
    if (path.pathname === '/api/auth/session')
      return route.fulfill({ json: { data: { id: owner, email: `${owner}@example.test` } } });
    if (path.pathname === '/api/events' || path.pathname === '/api/observability')
      return route.fulfill({ status: 204 });
    if (path.pathname === '/api/billing/me')
      return route.fulfill({ status: 503, json: { message: 'Unavailable in test harness' } });
    if (!path.pathname.startsWith('/api/learning/') && !path.pathname.startsWith('/api/materials'))
      return route.fulfill({ status: 404, json: { message: 'Unexpected test request' } });
    const response = await fetch(`${backend}${path.pathname}${path.search}`, {
      method: request.method(),
      headers: { 'x-test-user': owner, 'content-type': 'application/json' },
      body: request.postData() ?? undefined,
    });
    return route.fulfill({ status: response.status, body: await response.text(), headers: { 'content-type': 'application/json' } });
  });
};

test('real PostgreSQL backend keeps a suggested revisit and another account separate', async ({ browser }) => {
  test.skip(!backend, 'Start the backend browser harness and set PHASE2_REAL_BACKEND_URL.');
  const first = await browser.newContext();
  const second = await browser.newContext();
  try {
    await connect(first, ownerA);
    await connect(second, ownerB);
    const student = await first.newPage();
    await student.goto('/library');
    await student.getByRole('button', { name: 'Mesa do Dia' }).click();
    await expect(student.getByText('A aplicação mostrou uma lacuna; experimente um cenário menor antes de avançar.')).toBeVisible();
    await student.getByText('Tentativa anterior').click();
    await expect(student.getByText('Explain why the index narrows candidates.')).toBeVisible();
    await student.getByRole('button', { name: 'Adicionar ao roteiro' }).click();
    await expect(student.getByText('Nenhuma sugestão pendente.')).toBeVisible();
    await student.getByRole('button', { name: 'Calendário' }).click();
    await expect(student.getByText('Retomar Index').first()).toBeVisible();

    const other = await second.newPage();
    await other.goto('/library');
    await other.getByRole('button', { name: 'Mesa do Dia' }).click();
    await expect(other.getByText('Explain why the index narrows candidates.')).toHaveCount(0);
    await expect(other.getByText('Retomar Index')).toHaveCount(0);
  } finally {
    await first.close();
    await second.close();
  }
});
