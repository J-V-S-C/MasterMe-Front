import { expect, test } from '@playwright/test';

test('revisit acceptance survives a network failure and a stale second tab', async ({ context }) => {
  let status: 'PENDING' | 'ACCEPTED' = 'PENDING';
  let failOnce = true;
  let createdTasks = 0;
  const task = {
    id: 'task-one', title: 'Revisit the cause', sort_order: 0, activity_type: 'REVISIT',
    plan_id: null, material_id: 'material-a', concept_id: null, unit_id: null,
    duration_minutes: 40, scheduled_at: null, status: 'PENDING', reason: 'Earlier attempt',
    study_suggestions: [{ learning_evidence: {
      id: 'evidence-one', prompt: 'Explain the cause', diagnosis: 'The cause is missing.',
      source_excerpt: 'The cause produces the effect.', status: 'INCOMPLETE', created_at: '2026-10-18T10:00:00Z',
    } }],
  };
  await context.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/session') return route.fulfill({ json: { data: { id: 'student', email: 'student@example.test' } } });
    if (path === '/api/events' || path === '/api/observability') return route.fulfill({ status: 204 });
    if (path === '/api/materials') return route.fulfill({ json: { data: [{ id: 'material-a', title: 'Mechanisms', locale: 'en-US', createdAt: '2026-10-18T09:00:00Z' }] } });
    if (path === '/api/learning/materials/material-a/outline' || path === '/api/materials/material-a/knowledge-map' || path === '/api/learning/materials/material-a/relations') return route.fulfill({ json: { data: [] } });
    if (path === '/api/learning/shelves' || path === '/api/learning/cards' || path === '/api/learning/goals' || path === '/api/learning/plans' || path === '/api/learning/availability' || path === '/api/learning/reviews/due') return route.fulfill({ json: { data: [] } });
    if (path === '/api/learning/tasks') return route.fulfill({ json: { data: status === 'ACCEPTED' ? [task] : [] } });
    if (path === '/api/learning/suggestions') return route.fulfill({ json: { data: [{
      id: 'suggestion-one', title: 'Revisit the cause', reason: 'The explanation was incomplete.', status,
      task_id: status === 'ACCEPTED' ? task.id : null,
      learning_evidence: { id: 'evidence-one', material_id: 'material-a', prompt: 'Explain the cause.', diagnosis: 'The cause is missing.', source_excerpt: 'The cause produces the effect.', activity_type: 'COMPREHENSION', status: 'INCOMPLETE', created_at: '2026-10-18T10:00:00Z' },
    }] } });
    if (path === '/api/learning/desk') return route.fulfill({ json: { data: { tasks: [], load: { plannedMinutes: 0, availableMinutes: 40, excessMinutes: 0 } } } });
    if (path === '/api/learning/suggestions/suggestion-one/decision' && route.request().method() === 'POST') {
      if (failOnce) { failOnce = false; return route.fulfill({ status: 503, json: { message: 'Temporary outage' } }); }
      if (status === 'PENDING') { status = 'ACCEPTED'; createdTasks += 1; }
      return route.fulfill({ json: { data: { id: 'suggestion-one', status, task_id: task.id } } });
    }
    if (path === '/api/billing/me') return route.fulfill({ status: 503, json: { message: 'Unavailable' } });
    return route.fulfill({ status: 404, json: { message: 'Unexpected test request' } });
  });

  const first = await context.newPage();
  const second = await context.newPage();
  await Promise.all([first.goto('/library'), second.goto('/library')]);
  await Promise.all([
    first.getByRole('button', { name: 'Mesa do Dia' }).click(),
    second.getByRole('button', { name: 'Mesa do Dia' }).click(),
  ]);
  await expect(first.getByText('The explanation was incomplete.')).toBeVisible();
  await expect(second.getByText('The explanation was incomplete.')).toBeVisible();
  await first.getByRole('button', { name: 'Adicionar ao roteiro' }).click();
  await expect(first.getByText('Não foi possível concluir. Tente novamente.')).toBeVisible();
  await first.getByRole('button', { name: 'Adicionar ao roteiro' }).click();
  await expect(first.getByText('Nenhuma sugestão pendente.')).toBeVisible();
  await second.getByRole('button', { name: 'Adicionar ao roteiro' }).click();
  await expect(second.getByText('Nenhuma sugestão pendente.')).toBeVisible();
  expect(createdTasks).toBe(1);
  await first.getByRole('button', { name: 'Calendário' }).click();
  await expect(first.getByText('Revisit the cause').first()).toBeVisible();
});

test('a removed material link reports the missing reference instead of opening another material', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/session') return route.fulfill({ json: { data: { id: 'student', email: 'student@example.test' } } });
    if (path === '/api/materials') return route.fulfill({ json: { data: [{ id: 'still-here', title: 'Different material', locale: 'pt-BR', createdAt: '2026-10-18T09:00:00Z' }] } });
    if (path === '/api/events' || path === '/api/observability') return route.fulfill({ status: 204 });
    if (path === '/api/billing/me') return route.fulfill({ status: 503, json: { message: 'Unavailable' } });
    return route.fulfill({ status: 404, json: { message: 'Unexpected test request' } });
  });
  await page.goto('/study?material=removed');
  await expect(page.getByRole('heading', { name: 'Referência indisponível' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Abrir biblioteca' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Different material' })).toHaveCount(0);
});

test('a stale material list still reports a removed linked source', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/session') return route.fulfill({ json: { data: { id: 'student', email: 'student@example.test' } } });
    if (path === '/api/materials') return route.fulfill({ json: { data: [{ id: 'removed', title: 'Former material', locale: 'pt-BR', createdAt: '2026-10-18T09:00:00Z' }] } });
    if (path === '/api/materials/removed') return route.fulfill({ status: 404, json: { code: 'NOT_FOUND', message: 'Material not found' } });
    if (path === '/api/materials/removed/knowledge-map') return route.fulfill({ status: 404, json: { code: 'NOT_FOUND', message: 'Material not found' } });
    if (path === '/api/events' || path === '/api/observability') return route.fulfill({ status: 204 });
    if (path === '/api/billing/me') return route.fulfill({ status: 503, json: { message: 'Unavailable' } });
    return route.fulfill({ status: 404, json: { message: 'Unexpected test request' } });
  });
  await page.goto('/study?material=removed');
  await expect(page.getByRole('heading', { name: 'Referência indisponível' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Former material' })).toHaveCount(0);
});
