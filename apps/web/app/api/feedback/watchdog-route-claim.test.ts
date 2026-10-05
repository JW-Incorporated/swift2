import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { claim } = vi.hoisted(() => ({ claim: vi.fn() }));
vi.mock('./watchdog-dedupe', () => ({ claimWatchdogReport: claim }));

import { POST } from './route';
import { WATCHDOG_IP_MAX_PER_HOUR, WATCHDOG_UNKNOWN_BUILD_MAX_PER_DAY } from './watchdog-lifecycle';
import { resetWatchdogAllowed } from './watchdog-report';

const body = { message: '[watchdog]', watchdog: { platform: 'ios', buildKey: '38:embedded', category: 'protocol' } };
let n = 0;
const req = (wd: unknown = body.watchdog, ip?: string) => {
  n += 1;
  return new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-real-ip': ip ?? `10.9.${Math.floor(n / 250)}.${n % 250}` },
    body: JSON.stringify({ message: '[watchdog]', watchdog: wd }),
  });
};

describe('POST [watchdog] durable claim', () => {
  beforeEach(() => {
    resetWatchdogAllowed();
    claim.mockReset();
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 't');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('claims only after the config check: no token means no claim', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', '');
    expect((await POST(req())).status).toBe(503);
    expect(claim).not.toHaveBeenCalled();
  });

  it('duplicate -> 200 duplicate, no GitHub call', async () => {
    claim.mockResolvedValue('duplicate');
    const spy = vi.fn();
    vi.stubGlobal('fetch', spy);
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, duplicate: true });
    expect(spy).not.toHaveBeenCalled();
  });

  it('capped -> 429, no GitHub call', async () => {
    claim.mockResolvedValue('capped');
    const spy = vi.fn();
    vi.stubGlobal('fetch', spy);
    expect((await POST(req())).status).toBe(429);
    expect(spy).not.toHaveBeenCalled();
  });

  it('new + successful post -> 201', async () => {
    claim.mockResolvedValue('new');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })));
    expect((await POST(req())).status).toBe(201);
    expect(claim).toHaveBeenCalledTimes(1);
  });

  it('new + failed post -> 502 and the claim is not released or retried', async () => {
    claim.mockResolvedValue('new');
    const spy = vi.fn(async () => new Response('no', { status: 500 }));
    vi.stubGlobal('fetch', spy);
    expect((await POST(req())).status).toBe(502);
    expect(claim).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('a build known for the other platform is unknown here (android 38 is not shipped)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })));
    expect((await POST(req({ platform: 'android', buildKey: '38:embedded', category: 'protocol' }))).status).toBe(201);
    expect(claim).not.toHaveBeenCalled();
  });

  it('accepts the known build with an OTA update UUID', async () => {
    claim.mockResolvedValue('new');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })));
    const buildKey = '38:123e4567-e89b-12d3-a456-426614174000';
    expect((await POST(req({ ...body.watchdog, buildKey }))).status).toBe(201);
  });

  it('one IP rotating categories cannot take more than the per-IP hourly share of the claims', async () => {
    claim.mockResolvedValue('new');
    vi.useFakeTimers();
    try {
      vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })));
      const cats = ['ready-timeout', 'dom-error', 'webview-terminated', 'webview-render-gone', 'abandoned', 'protocol'];
      const statuses: number[] = [];
      for (let i = 0; i < WATCHDOG_IP_MAX_PER_HOUR + 2; i += 1) {
        // keep each request clear of the generic 5/min limiter and the per-buildKey in-memory cap
        vi.setSystemTime(Date.now() + 61_000);
        const buildKey = `38:123e4567-e89b-12d3-a456-4266141740${String(i).padStart(2, '0')}`;
        statuses.push((await POST(req({ platform: 'ios', buildKey, category: cats[i % cats.length] }, '10.55.0.1'))).status);
      }
      expect(statuses.filter((s) => s === 201)).toHaveLength(WATCHDOG_IP_MAX_PER_HOUR);
      expect(statuses.slice(-2)).toEqual([429, 429]);
      expect(claim).toHaveBeenCalledTimes(WATCHDOG_IP_MAX_PER_HOUR);
    } finally {
      vi.useRealTimers();
    }
  });

  it('an unknown native build is posted without a durable claim, through a small separate bucket', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 48 * 60 * 60_000); // clear hits from earlier tests in this file
    const spy = vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 }));
    vi.stubGlobal('fetch', spy);
    const statuses: number[] = [];
    for (let i = 0; i < WATCHDOG_UNKNOWN_BUILD_MAX_PER_DAY + 2; i += 1) {
      statuses.push((await POST(req({ platform: 'ios', buildKey: `${900 + i}:embedded`, category: 'protocol' }))).status);
    }
    expect(statuses.filter((x) => x === 201)).toHaveLength(WATCHDOG_UNKNOWN_BUILD_MAX_PER_DAY);
    expect(statuses.slice(-2)).toEqual([429, 429]);
    expect(claim).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
