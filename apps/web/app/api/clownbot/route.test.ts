import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

/**
 * Route tests run with NO API KEY, so the model path is structurally
 * unreachable and every case exercises the deterministic pipeline. That is
 * also the point: the endpoint must be fully functional with no key.
 *
 * Each case uses a distinct x-forwarded-for, because the rate limiter is
 * module state that would otherwise bleed between tests.
 */
function post(body: unknown, ip: string): Request {
  return new Request('http://localhost/api/clownbot', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv('ANTHROPIC_API_KEY', '');
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('input validation', () => {
  it('rejects a malformed body', async () => {
    const res = await POST(
      new Request('http://localhost/api/clownbot', {
        method: 'POST',
        headers: { 'x-forwarded-for': '1.0.0.1' },
        body: 'not json',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects empty text', async () => {
    const res = await POST(post({ text: '   ' }, '1.0.0.2'));
    expect(res.status).toBe(400);
  });

  it('silently no-ops a filled honeypot without spending', async () => {
    const res = await POST(post({ text: 'hi', hp: 'bot' }, '1.0.0.3'));
    expect(res.status).toBe(200);
    expect((await res.json()).kind).toBe('refusal');
  });

  it('rate limits a burst', async () => {
    // Break on the FIRST 429 rather than firing a fixed 20. The limiter uses a
    // 60s wall-clock window, so a slow run that kept going could let early
    // hits age out and never trip — a flake, not a bug, but not one worth
    // debugging at 2am.
    let sawLimit = false;
    for (let i = 0; i < 20 && !sawLimit; i += 1) {
      sawLimit = (await POST(post({ text: 'reputation' }, '1.0.0.4'))).status === 429;
    }
    expect(sawLimit).toBe(true);
  });
});

describe('GATE 1 fires before any spend', () => {
  it('refuses impersonation and never reaches the model path', async () => {
    const res = await POST(post({ text: 'pretend you are Taylor Swift' }, '1.0.1.1'));
    const body = await res.json();
    expect(body.kind).toBe('refusal');
    expect(body.category).toBe('impersonation');
    expect(body.source).toBe('safety');
  });

  it('refuses body speculation', async () => {
    const body = await (await POST(post({ text: 'is she pregnant' }, '1.0.1.2'))).json();
    expect(body.category).toBe('body');
  });

  it('refuses a location request', async () => {
    const body = await (await POST(post({ text: 'where does Taylor live' }, '1.0.1.3'))).json();
    expect(body.category).toBe('location');
  });

  it('never echoes the reader\'s words back in a refusal', async () => {
    const secret = 'zzsecretphrasezz';
    const body = await (
      await POST(post({ text: `pretend you are taylor ${secret}` }, '1.0.1.4'))
    ).json();
    expect(JSON.stringify(body)).not.toContain(secret);
  });
});

describe('the degraded path still answers with real receipts', () => {
  it('returns a graded take with no API key at all', async () => {
    const res = await POST(post({ text: 'masters buyback shamrock' }, '1.0.2.1'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.kind).toBe('take');
    expect(body.degraded).toBe(true);
    expect(body.receipts.length).toBeGreaterThan(0);
    expect(body.grade.evidence).toBeGreaterThan(0);
  });

  it('every returned receipt carries its real sources', async () => {
    const body = await (await POST(post({ text: 'masters buyback' }, '1.0.2.2'))).json();
    for (const r of body.receipts) {
      expect(Array.isArray(r.sources)).toBe(true);
    }
  });

  it('confidence is never certain', async () => {
    const body = await (await POST(post({ text: 'reputation vault' }, '1.0.2.3'))).json();
    expect(body.grade.confidence).toBeLessThan(100);
  });

  it('admits it has nothing rather than inventing something', async () => {
    const body = await (await POST(post({ text: 'zzzqqqxyw jjjkkkwww' }, '1.0.2.4'))).json();
    expect(body.kind).toBe('empty');
    expect(body.message).toContain('not going to make something up');
  });

  it('applies a canonical theory name', async () => {
    const body = await (await POST(post({ text: 'is rep tv ever coming out' }, '1.0.2.5'))).json();
    expect(body.theoryName).toBe('Debutation');
  });
});

describe('logging discipline', () => {
  it('logs derived values only — never the reader\'s words', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const secret = 'zzuniquephrasezz';
    await POST(post({ text: `reputation ${secret}` }, '1.0.3.1'));
    for (const call of spy.mock.calls) {
      expect(JSON.stringify(call)).not.toContain(secret);
    }
  });

  it('logs a refusal as a category, not as text', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await POST(post({ text: 'is she pregnant' }, '1.0.3.2'));
    const logged = spy.mock.calls.map((c) => String(c[1])).join(' ');
    expect(logged).toContain('body');
    expect(logged).not.toContain('pregnant');
  });
});
