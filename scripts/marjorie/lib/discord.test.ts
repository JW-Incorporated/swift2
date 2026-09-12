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

function fakeResponse(status: number, body: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
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

    const networkFailFetch = vi.fn().mockRejectedValue(new Error('fetch failed'));
    const networkFailResult = await post('short message', {
      webhook: FAKE_WEBHOOK, fetchImpl: networkFailFetch, waitImpl: fakeWait(),
    });
    expect(networkFailResult.ok).toBe(false);
    expect(networkFailResult.status).toBeNull();
    expect(networkFailResult.error).not.toContain(FAKE_WEBHOOK);
  });
});
