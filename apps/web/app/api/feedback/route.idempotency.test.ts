import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import {
  isDuplicate,
  markPending,
  parseIdempotencyId,
  resetIdempotencyForTests,
  settle,
} from './idempotency';

const req = (body: unknown, ip: string) =>
  new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-real-ip': ip },
    body: JSON.stringify(body),
  });

describe('feedback idempotency id', () => {
  beforeEach(() => {
    resetIdempotencyForTests();
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'feedback-scoped-token');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('a repeated id returns 200 without posting a second issue', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ number: 1 }), { status: 201 }));
    vi.stubGlobal('fetch', fetchSpy);
    const body = { id: 'abcd-1234-efgh', message: 'typo on the page' };
    const first = await POST(req(body, '10.0.0.1'));
    expect(first.status).toBe(201);
    const again = await POST(req(body, '10.0.0.2'));
    expect(again.status).toBe(200);
    expect(await again.json()).toMatchObject({ ok: true, duplicate: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('a failed upstream post does not burn the id', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(new Response('nope', { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ number: 2 }), { status: 201 }));
    vi.stubGlobal('fetch', fetchSpy);
    const body = { id: 'retry-me-0001', message: 'broken link' };
    expect((await POST(req(body, '10.0.1.1'))).status).toBe(502);
    expect((await POST(req(body, '10.0.1.2'))).status).toBe(201);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('requests without an id are unaffected', async () => {
    const fetchSpy = vi
      .fn()
      .mockImplementation(async () => new Response(JSON.stringify({ number: 3 }), { status: 201 }));
    vi.stubGlobal('fetch', fetchSpy);
    await POST(req({ message: 'same text' }, '10.0.2.1'));
    await POST(req({ message: 'same text' }, '10.0.2.2'));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('ids expire after 24 hours and malformed ids are ignored', () => {
    expect(parseIdempotencyId('x')).toBeNull();
    expect(parseIdempotencyId('has space in it!')).toBeNull();
    settle('old-id-00001', true, 0);
    expect(isDuplicate('old-id-00001', 23 * 3600 * 1000)).toBe(true);
    expect(isDuplicate('old-id-00001', 25 * 3600 * 1000)).toBe(false);
  });

  it('a stuck pending id stops blocking after 60 s', () => {
    markPending('stuck-id-0001', 0);
    expect(isDuplicate('stuck-id-0001', 30_000)).toBe(true);
    expect(isDuplicate('stuck-id-0001', 61_000)).toBe(false);
  });
});
