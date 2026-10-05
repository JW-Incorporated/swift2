import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { claim, finish } = vi.hoisted(() => ({ claim: vi.fn(), finish: vi.fn(async () => undefined) }));
vi.mock('./watchdog-dedupe', () => ({ claimWatchdogReport: claim, finishWatchdogReport: finish }));

import { POST } from './route';
import { resetWatchdogAllowed } from './watchdog-report';

const body = { message: '[watchdog]', watchdog: { platform: 'ios', buildKey: '42:embedded', category: 'protocol' } };
let n = 0;
const req = () => {
  n += 1;
  return new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-real-ip': `10.9.${Math.floor(n / 250)}.${n % 250}` },
    body: JSON.stringify(body),
  });
};

describe('POST [watchdog] durable claim lifecycle', () => {
  beforeEach(() => {
    resetWatchdogAllowed();
    claim.mockReset();
    finish.mockClear();
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

  it('new + successful post -> marked posted', async () => {
    claim.mockResolvedValue('new');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 201 })));
    expect((await POST(req())).status).toBe(201);
    expect(finish).toHaveBeenCalledWith(expect.objectContaining({ buildKey: '42:embedded' }), true);
  });

  it('new + failed post (non-2xx or throw) -> claim released so the retry is not a duplicate', async () => {
    claim.mockResolvedValue('new');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('no', { status: 500 })));
    expect((await POST(req())).status).toBe(502);
    expect(finish).toHaveBeenLastCalledWith(expect.anything(), false);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('net');
      }),
    );
    expect((await POST(req())).status).toBe(500);
    expect(finish).toHaveBeenLastCalledWith(expect.anything(), false);
    expect(finish).toHaveBeenCalledTimes(2);
  });
});
