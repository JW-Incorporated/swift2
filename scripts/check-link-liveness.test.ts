import { afterEach, describe, expect, it, vi } from 'vitest';

import { check } from './check-link-liveness.mjs';

const okResponse = (status = 200) =>
  new Response('<html><body>hi</body></html>', {
    status,
    headers: { 'content-type': 'text/html' },
  });

describe('link-liveness check (#3469)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('retries a transient connection failure before succeeding', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(okResponse());
    vi.stubGlobal('fetch', fetchMock);

    const resultPromise = check('https://example.com/article');
    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toMatchObject({ verdict: 'ok', status: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports repeated connection failures as unverified, never a definitive verdict', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    vi.stubGlobal('fetch', fetchMock);

    const resultPromise = check('https://example.com/article');
    await vi.runAllTimersAsync();

    const result = await resultPromise;
    expect(result.verdict).toBe('unverified');
    expect(result.status).toBe(0);
    expect(result.reason).toMatch(/connection error after retries/);
    // MAX_ATTEMPTS_TRANSIENT = 3
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries a 429/503 with backoff before eventually succeeding', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 503, headers: {} }))
      .mockResolvedValueOnce(okResponse());
    vi.stubGlobal('fetch', fetchMock);

    const resultPromise = check('https://example.com/article');
    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toMatchObject({ verdict: 'ok', status: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('never retries a definitive 404 — that is real evidence, not a transient failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 404, headers: {} }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await check('https://example.com/gone');

    expect(result).toMatchObject({ verdict: 'dead', status: 404 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
