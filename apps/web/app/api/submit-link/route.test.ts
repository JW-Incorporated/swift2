import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

// Each test gets its own client IP — the route's rate limiter is a module-
// level Map keyed by IP, and would otherwise leak state between test cases.
const req = (body: unknown, ip: string) =>
  new Request('http://localhost/api/submit-link', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('POST /api/submit-link', () => {
  it('accepts a valid submission and returns success', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ number: 1, html_url: 'http://gh/1' }), { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const res = await POST(req({ url: 'https://reddit.com/r/TaylorSwift', section: 'community' }, '10.0.0.1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ ok: true, number: 1, url: 'http://gh/1' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects a non-http(s) scheme with 400', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await POST(req({ url: 'javascript:alert(1)', section: 'community' }, '10.0.0.2'));
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects a missing section with 400', async () => {
    const res = await POST(req({ url: 'https://reddit.com/r/x' }, '10.0.0.3'));
    expect(res.status).toBe(400);
  });

  it('drops honeypot submissions silently (200, nothing written)', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await POST(
      req({ url: 'https://reddit.com/r/x', section: 'community', hp: 'i am a bot' }, '10.0.0.4'),
    );
    expect(res.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rate-limits bursts from the same client', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ number: 1 }), { status: 201 })),
    );

    let last: Response | undefined;
    for (let i = 0; i < 7; i += 1) {
      last = (await POST(
        req({ url: `https://reddit.com/r/x?i=${i}`, section: 'community' }, '10.0.0.5'),
      )) as Response;
    }
    expect(last?.status).toBe(429);
  });

  it('still succeeds and still files the GitHub issue when the sheet webhook is unconfigured', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ number: 2, html_url: 'http://gh/2' }), { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const res = await POST(req({ url: 'https://etsy.com/shop/x', section: 'merch' }, '10.0.0.6'));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, number: 2 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toContain('api.github.com');
  });

  it('still succeeds and still files the GitHub issue when email is unconfigured', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
    vi.stubEnv('SUBMISSIONS_SHEET_WEBHOOK_URL', 'https://script.google.com/hook');
    const fetchSpy = vi.fn().mockImplementation((url: string) => {
      if (url.includes('api.github.com')) {
        return Promise.resolve(
          new Response(JSON.stringify({ number: 3, html_url: 'http://gh/3' }), { status: 201 }),
        );
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    });
    vi.stubGlobal('fetch', fetchSpy);

    const res = await POST(req({ url: 'https://discord.gg/x', section: 'community' }, '10.0.0.7'));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, number: 3 });
    // GitHub issue + sheet webhook both attempted; email skipped (unconfigured).
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('still succeeds (no crash) even when GitHub itself is unconfigured', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await POST(req({ url: 'https://reddit.com/r/x', section: 'community' }, '10.0.0.8'));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
