import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { post } from './discord.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { neutralizeMentions } from '../../community/discord-delivery.mjs';

// Distinctive on purpose (acceptance-criterion 7 / the one thing lifted from
// PR #4047's review — see PLAN.md): if this literal string ever shows up in
// a returned `error`, something built the message by interpolating the
// `webhook` variable instead of the status code/error message alone.
const FAKE_WEBHOOK = 'https://discord.com/api/webhooks/1111111111111111111/totally-secret-token-do-not-leak';

function fakeResponse(status: number, body: unknown = {}, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    headers: new Headers(headers),
  };
}

function fakeWait() {
  return vi.fn().mockResolvedValue(undefined);
}

function bodyOf(call: unknown[]) {
  return JSON.parse((call[1] as { body: string }).body);
}

describe('post()', () => {
  it('posts a 4100-character message as 3 chunks, in order', async () => {
    const message = 'A'.repeat(4100);
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(200));

    const result = await post(message, { webhook: FAKE_WEBHOOK, fetchImpl });

    expect(result).toMatchObject({ ok: true, chunks: 3, delivered: 3, status: null, error: null });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const posted = fetchImpl.mock.calls.map((call) => bodyOf(call).content);
    expect(posted.join('')).toBe(message);
  });

  it('neutralizes @everyone before posting', async () => {
    const message = 'Reminder for @everyone: brief is up.';
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(200));

    await post(message, { webhook: FAKE_WEBHOOK, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(bodyOf(fetchImpl.mock.calls[0]).content).toBe(neutralizeMentions(message));
  });

  it('retries once on a 500, then delivers on the second attempt', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(fakeResponse(500))
      .mockResolvedValueOnce(fakeResponse(200));
    const waitImpl = fakeWait();

    const result = await post('short message', { webhook: FAKE_WEBHOOK, fetchImpl, waitImpl });

    expect(result.ok).toBe(true);
    expect(result.delivered).toBe(result.chunks);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(waitImpl).toHaveBeenCalledTimes(1);
  });

  it('stops at the first chunk that fails both attempts and reports its index', async () => {
    const message = 'A'.repeat(4100); // chunks into 3 (see chunking test above)
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(fakeResponse(200)) // chunk 0
      .mockResolvedValueOnce(fakeResponse(200)) // chunk 1
      .mockResolvedValueOnce(fakeResponse(500)) // chunk 2, attempt 1
      .mockResolvedValueOnce(fakeResponse(500)); // chunk 2, attempt 2
    const waitImpl = fakeWait();

    const result = await post(message, { webhook: FAKE_WEBHOOK, fetchImpl, waitImpl });

    expect(result).toMatchObject({ ok: false, chunks: 3, delivered: 2, status: 500 });
    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(result.error).not.toContain(FAKE_WEBHOOK);
  });

  it('honours a 429 body\'s retry_after (seconds) instead of the fixed 2s wait', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(fakeResponse(429, { retry_after: 3 }))
      .mockResolvedValueOnce(fakeResponse(200));
    const waitImpl = fakeWait();

    const result = await post('short message', { webhook: FAKE_WEBHOOK, fetchImpl, waitImpl });

    expect(result.ok).toBe(true);
    expect(waitImpl).toHaveBeenCalledTimes(1);
    expect(waitImpl).toHaveBeenCalledWith(3000);
  });

  it('never leaks the webhook URL into an error field, on an HTTP failure or a thrown network error', async () => {
    const httpFailFetch = vi.fn().mockResolvedValue(fakeResponse(500));
    const httpFailResult = await post('short message', {
      webhook: FAKE_WEBHOOK, fetchImpl: httpFailFetch, waitImpl: fakeWait(),
    });
    expect(httpFailResult.ok).toBe(false);
    expect(httpFailResult.error).not.toContain(FAKE_WEBHOOK);

    const networkFailFetch = vi.fn().mockRejectedValue(new Error(`fetch failed for ${FAKE_WEBHOOK}`));
    const networkFailResult = await post('short message', {
      webhook: FAKE_WEBHOOK, fetchImpl: networkFailFetch, waitImpl: fakeWait(),
    });
    expect(networkFailResult.ok).toBe(false);
    expect(networkFailResult.status).toBeNull();
    expect(networkFailResult.error).not.toContain(FAKE_WEBHOOK);
  });

  it('honours a header-only 429 with a non-JSON body, then retries successfully', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(`provider text ${FAKE_WEBHOOK}`, {
        status: 429, headers: { 'Retry-After': '65' },
      }))
      .mockResolvedValueOnce(fakeResponse(200, { id: 'first-message' }));
    const waitImpl = fakeWait();
    const result = await post('short message', { webhook: FAKE_WEBHOOK, fetchImpl, waitImpl });
    expect(waitImpl).toHaveBeenCalledWith(65_000);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ ok: true, chunks: 1, delivered: 1, messageId: 'first-message' });
  });

  it('waits for the longest valid cooldown and rounds fractional milliseconds up', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(fakeResponse(429, { retry_after: 1 }, {
        'Retry-After': '2', 'X-RateLimit-Reset-After': '3.0001',
      }))
      .mockResolvedValueOnce(fakeResponse(200));
    const waitImpl = fakeWait();
    await post('short message', { webhook: FAKE_WEBHOOK, fetchImpl, waitImpl });
    expect(waitImpl).toHaveBeenCalledWith(3001);
  });

  it.each([0, 120])('accepts the inclusive wait boundary of %s seconds', async (retryAfter) => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(fakeResponse(429, { retry_after: retryAfter }))
      .mockResolvedValueOnce(fakeResponse(200));
    const waitImpl = fakeWait();
    expect((await post('short', { webhook: FAKE_WEBHOOK, fetchImpl, waitImpl })).ok).toBe(true);
    expect(waitImpl).toHaveBeenCalledWith(retryAfter * 1000);
  });

  it.each([undefined, null, -1, Number.NaN, Number.POSITIVE_INFINITY, '', 'nonsense', true, []])(
    'does not guess a retry delay from malformed cooldown %j', async (retryAfter) => {
      const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(429, { retry_after: retryAfter }, {
        'Retry-After': FAKE_WEBHOOK, 'X-RateLimit-Reset-After': '-2',
      }));
      const waitImpl = fakeWait();
      const result = await post('short', { webhook: FAKE_WEBHOOK, fetchImpl, waitImpl });
      expect(result).toMatchObject({ ok: false, status: 429, delivered: 0, chunks: 1, retryAfterMs: null });
      expect(fetchImpl).toHaveBeenCalledTimes(1);
      expect(waitImpl).not.toHaveBeenCalled();
      expect(JSON.stringify(result)).not.toContain(FAKE_WEBHOOK);
    },
  );

  it('does not shorten a long provider cooldown to the local wait limit or replay earlier chunks', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(fakeResponse(200))
      .mockResolvedValueOnce(fakeResponse(429, { retry_after: 2 }, { 'Retry-After': '121.001' }));
    const waitImpl = fakeWait();
    const result = await post('A'.repeat(4100), { webhook: FAKE_WEBHOOK, fetchImpl, waitImpl });
    expect(result).toMatchObject({ ok: false, status: 429, delivered: 1, chunks: 3, retryAfterMs: 121001 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(waitImpl).not.toHaveBeenCalled();
  });

  it('fails closed when finite provider seconds overflow milliseconds', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(429, { retry_after: 1e308 }, { 'Retry-After': '1' }));
    const waitImpl = fakeWait();
    const result = await post('short', { webhook: FAKE_WEBHOOK, fetchImpl, waitImpl });
    expect(result).toMatchObject({ ok: false, status: 429, retryAfterMs: null });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(waitImpl).not.toHaveBeenCalled();
  });

  it('reports the final 429 cooldown without a third attempt or provider text', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(fakeResponse(500))
      .mockResolvedValueOnce(fakeResponse(429, { retry_after: 4, message: FAKE_WEBHOOK }, { 'Retry-After': '6' }));
    const waitImpl = fakeWait();
    const result = await post('short', { webhook: FAKE_WEBHOOK, fetchImpl, waitImpl });
    expect(result).toMatchObject({ ok: false, status: 429, retryAfterMs: 6000 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(waitImpl).toHaveBeenCalledExactlyOnceWith(2000);
    expect(JSON.stringify(result)).not.toContain(FAKE_WEBHOOK);
  });
});
