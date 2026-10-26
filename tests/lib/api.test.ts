import { afterEach, describe, expect, test } from 'bun:test';
import { api, invalidateApiCache, MAX_UPLOAD_BYTES, uploadMaterial } from '../../lib/api';

const originalFetch = globalThis.fetch;
const originalXhr = globalThis.XMLHttpRequest;
afterEach(() => { invalidateApiCache(); globalThis.fetch = originalFetch; globalThis.XMLHttpRequest = originalXhr; });

describe('frontend HTTP contract', () => {
  test('uses confidence, performance and practice endpoints', async () => {
    const calls: Array<[string, string | undefined, string | null]> = [];
    globalThis.fetch = (async (url: string, init?: RequestInit) => { calls.push([url, init?.method, typeof init?.body === 'string' ? init.body : null]); return new Response(JSON.stringify({ data: url.includes('performance') ? [] : url.includes('confidence') ? { conceptId: 'concept-a', value: 2 } : { id: 'project-a' } }), { status: 200 }); }) as typeof fetch;
    await api.saveConfidence('concept-a', 2);
    await api.performance('material-a');
    await api.practiceFocus('material-a', 'COMBINED');
    await api.generatePracticeProject('material-a', 'MANUAL', ['concept-a']);
    expect(calls).toEqual([
      ['/api/concepts/concept-a/confidence', 'PUT', JSON.stringify({ value: 2 })],
      ['/api/materials/material-a/performance', 'GET', null],
      ['/api/materials/material-a/practice-focus', 'POST', JSON.stringify({ focusMode: 'COMBINED' })],
      ['/api/materials/material-a/practice-projects', 'POST', JSON.stringify({ focusMode: 'MANUAL', conceptIds: ['concept-a'] })],
    ]);
  });

  test('uses the opt-in edge-case endpoints', async () => {
    const paths: string[] = [];
    globalThis.fetch = (async (url: string) => { paths.push(url); return new Response(JSON.stringify({ data: { id: 'session-a' } }), { status: 200 }); }) as typeof fetch;
    await api.requestEdgeCase('session-a'); await api.answerEdgeCase('session-a', 'Resposta detalhada para o caso.');
    expect(paths).toEqual(['/api/sessions/session-a/edge-case', '/api/sessions/session-a/edge-case/answers']);
  });

  test('cancels extraction with DELETE', async () => {
    const calls: Array<[string, string | undefined]> = [];
    globalThis.fetch = (async (url: string, init?: RequestInit) => { calls.push([url, init?.method]); return new Response(JSON.stringify({ data: { id: 'job-a', status: 'CANCELLED' } }), { status: 200 }); }) as typeof fetch;
    const result = await api.cancelExtraction('material-a');
    expect(calls).toEqual([['/api/materials/material-a/extract', 'DELETE']]);
    expect(result.status).toBe('CANCELLED');
  });

  test('reuses recent GETs and invalidates cache after mutation', async () => {
    let materialRequests = 0;
    globalThis.fetch = (async (url: string) => {
      if (url === '/api/materials') { materialRequests += 1; return new Response(JSON.stringify({ data: [] }), { status: 200, headers: { etag: '"materials-v1"' } }); }
      return new Response(JSON.stringify({ data: { conceptId: 'concept-a', value: 3 } }), { status: 200 });
    }) as typeof fetch;
    await api.materials(); await api.materials();
    expect(materialRequests).toBe(1);
    await api.saveConfidence('concept-a', 3);
    await api.materials();
    expect(materialRequests).toBe(2);
  });

  test('forwards only plan and idempotency key to checkout', async () => {
    let captured: { url?: string; init?: RequestInit } = {};
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      captured = { url, init };
      return new Response(JSON.stringify({ data: { id: '11111111-1111-4111-8111-111111111111', planId: 'PRO', amountInCents: 24_900, status: 'CHECKOUT_READY', checkoutUrl: 'https://checkout.infinitepay.com.br/masterme', createdAt: '2026-10-09T00:00:00.000Z', updatedAt: '2026-10-09T00:00:00.000Z' } }), { status: 201 });
    }) as typeof fetch;

    await api.createCheckout('PRO', 'checkout.PRO.11111111-1111-4111-8111-111111111111');

    expect(captured.url).toBe('/api/billing/checkouts');
    expect(captured.init?.method).toBe('POST');
    expect(new Headers(captured.init?.headers).get('idempotency-key')).toBe('checkout.PRO.11111111-1111-4111-8111-111111111111');
    expect(captured.init?.body).toBe(JSON.stringify({ planId: 'PRO' }));
  });

  test('deduplicates authoritative balance and invalidates it after mutation', async () => {
    let balanceRequests = 0;
    globalThis.fetch = (async (url: string) => {
      if (url === '/api/billing/me') {
        balanceRequests += 1;
        return new Response(JSON.stringify({ data: { planId: 'FREE', dailyLimit: 100, dailyUsed: 0, dailyRemaining: 100, periodLimit: 100, periodUsed: 0, periodRemaining: 100 } }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: { id: 'session-a' } }), { status: 200 });
    }) as typeof fetch;

    await Promise.all([api.billingMe(), api.billingMe()]);
    expect(balanceRequests).toBe(1);
    await api.startSession('concept-a');
    await api.billingMe();
    expect(balanceRequests).toBe(2);
  });

  test('uploads multipart file and title and updates progress', async () => {
    let path = ''; const capture: { sent?: FormData } = {};
    class FakeXhr { upload = { onprogress: null as ((event: ProgressEvent) => void) | null }; onerror: (() => void) | null = null; onload: (() => void) | null = null; status = 202; responseText = JSON.stringify({ data: { id: 'material-a', title: 'Título', status: 'PENDING' } }); open(_method: string, url: string) { path = url; } send(body: FormData) { capture.sent = body; this.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 } as ProgressEvent); this.onload?.(); } }
    globalThis.XMLHttpRequest = FakeXhr as unknown as typeof XMLHttpRequest;
    const progress: Array<number | null> = [];
    const result = await uploadMaterial(new File(['conteúdo'], 'a.md'), 'Título', 'pt-BR', (percent) => progress.push(percent));
    expect(path).toBe('/api/materials/upload'); expect(capture.sent?.get('title')).toBe('Título'); expect(capture.sent?.get('locale')).toBe('pt-BR'); expect(progress).toEqual([50]); expect(result.id).toBe('material-a');
  });

  test('rejects files above the 16 MiB API limit on the client', async () => {
    expect(MAX_UPLOAD_BYTES).toBe(16 * 1024 * 1024);
    const file = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], 'grande.pdf', { type: 'application/pdf' });
    await expect(uploadMaterial(file, '', 'pt-BR', () => undefined)).rejects.toThrow('O arquivo deve ter no máximo 16 MiB.');
  });
});
