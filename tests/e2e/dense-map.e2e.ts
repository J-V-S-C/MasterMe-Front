import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1000 },
  { name: 'desktop', width: 1440, height: 1000 },
] as const;

for (const viewport of viewports) {
  test(`dense map keeps every concept reachable at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/auth/session') return route.fulfill({ json: { data: { id: 'student', email: 'student@example.test' } } });
      if (path === '/api/events' || path === '/api/observability') return route.fulfill({ status: 204 });
      if (path === '/api/materials') return route.fulfill({ json: { data: [{ id: 'material-a', title: 'Mechanisms', locale: 'pt-BR', createdAt: '2026-10-18T09:00:00Z' }] } });
      if (path === '/api/materials/material-a/knowledge-map') return route.fulfill({ json: { data: Array.from({ length: 20 }, (_, index) => ({
        concept: { id: `concept-${index}`, materialId: 'material-a', name: `Concept ${index}`, description: `Description ${index}`, kind: 'NODE', sourceExcerpt: `Excerpt ${index}`, fundamentalPremises: [], edgeCases: [], prerequisiteIds: [], nextIds: [], generatedLocale: 'pt-BR' },
        status: 'READY', edgeCaseStatus: 'NOT_REQUESTED', lastAttempt: null,
        question: { text: `Explain concept ${index}`, targetPremise: 'Mechanism', expectedReasoningSteps: [] },
      })) } });
      if (path === '/api/learning/materials/material-a/relations' || path === '/api/learning/materials/material-a/evidence') return route.fulfill({ json: { data: [] } });
      if (path === '/api/billing/me') return route.fulfill({ status: 503, json: { message: 'Unavailable' } });
      return route.fulfill({ status: 404, json: { message: 'Unexpected test request' } });
    });
    const started = Date.now();
    await page.goto('/knowledge-map');
    await expect(page.getByRole('heading', { name: 'Mapa deste material' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Expandir mapa (20 conceitos)' })).toBeVisible();
    const timeToMapMs = Date.now() - started;
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    const metrics = await cdp.send('Performance.getMetrics');
    console.log(JSON.stringify({ fixture: 'dense-map-20', viewport: viewport.name, timeToMapMs, jsHeapUsedBytes: metrics.metrics.find((metric) => metric.name === 'JSHeapUsedSize')?.value ?? null }));
    await cdp.detach();
    await page.getByText('Todos os 20 conceitos').click();
    const hiddenConcept = page.getByRole('button', { name: 'Concept 19', exact: true });
    await hiddenConcept.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Concept 19', level: 2 })).toBeVisible();
    await expect(page.getByText('12/20 visíveis no grafo; todos na lista abaixo')).toBeVisible();
    await page.getByRole('button', { name: 'Expandir mapa (20 conceitos)' }).click();
    await expect(page.getByRole('button', { name: 'Focar no conceito' })).toBeVisible();
    const scrollWidth = await page.locator('html').evaluate((element) => element.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: `test-results/dense-map-${viewport.name}.png`, fullPage: true });
  });
}

test('a relation can be reconstructed by keyboard on mobile without blocking the source', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let submitted: Record<string, unknown> | null = null;
  const relation = { id: 'relation-a', material_id: 'material-a', from_concept_id: 'concept-a', to_concept_id: 'concept-b', relation_type: 'ENABLES', statement: 'The index narrows candidate rows before filtering.', justification: 'The excerpt states the sequence.', source_excerpt: 'An index narrows candidate rows before filtering.', provenance: 'EXTRACTED' };
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/session') return route.fulfill({ json: { data: { id: 'student', email: 'student@example.test' } } });
    if (path === '/api/events' || path === '/api/observability') return route.fulfill({ status: 204 });
    if (path === '/api/materials') return route.fulfill({ json: { data: [{ id: 'material-a', title: 'Indexes', locale: 'pt-BR', createdAt: '2026-10-19T00:00:00Z' }] } });
    if (path === '/api/materials/material-a/knowledge-map') return route.fulfill({ json: { data: ['concept-a', 'concept-b'].map((id) => ({ concept: { id, materialId: 'material-a', name: id, description: id, kind: 'NODE', sourceExcerpt: relation.source_excerpt, fundamentalPremises: [], edgeCases: [], prerequisiteIds: [], nextIds: [], generatedLocale: 'pt-BR' }, status: 'READY', edgeCaseStatus: 'NOT_REQUESTED', lastAttempt: null, question: { text: 'Explain the index mechanism.', targetPremise: 'Index', expectedReasoningSteps: [] } })) } });
    if (path === '/api/learning/materials/material-a/relations') return route.fulfill({ json: { data: [relation] } });
    if (path === '/api/learning/materials/material-a/evidence') return route.fulfill({ json: { data: [] } });
    if (path === '/api/learning/activities/answers' && route.request().method() === 'POST') {
      submitted = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ status: 201, json: { data: { event: { id: 'event-a', material_id: 'material-a', relation_id: relation.id, concept_id: null, activity_type: 'RELATION', status: 'PASSED', prompt: relation.statement, answer: submitted.answer, diagnosis: 'The sequence is explained.', source_excerpt: relation.source_excerpt, assisted: false, created_at: '2026-10-19T00:00:00Z' }, suggestion: null } } });
    }
    if (path === '/api/billing/me') return route.fulfill({ status: 503, json: { message: 'Unavailable' } });
    return route.fulfill({ status: 404, json: { message: 'Unexpected test request' } });
  });
  await page.goto('/knowledge-map');
  const inspect = page.getByRole('button', { name: relation.statement });
  await inspect.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: 'Abrir trecho no material' })).toBeVisible();
  await page.getByLabel('Sua resposta').fill('The index first narrows candidate rows, and filtering then checks the remaining predicate.');
  await page.getByRole('button', { name: 'Avaliar resposta' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('The sequence is explained.');
  expect(submitted).toMatchObject({ relationId: relation.id, activityType: 'RELATION', assisted: false });
  expect(await page.locator('html').evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(390);
});
