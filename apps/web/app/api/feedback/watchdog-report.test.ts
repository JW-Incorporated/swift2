import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import {
  WATCHDOG_GLOBAL_MAX_PER_WINDOW,
  WATCHDOG_MAX_PER_WINDOW,
  WATCHDOG_WINDOW_MS,
  parseWatchdogReport,
  resetWatchdogAllowed,
  watchdogAllowed,
  watchdogCommentFrom,
} from './watchdog-report';

const valid = () => ({ platform: 'android', buildKey: '18:embedded', category: 'ready-timeout' });

describe('parseWatchdogReport (strict schema)', () => {
  it('accepts exactly {platform, buildKey, category}', () => {
    expect(parseWatchdogReport(valid()).ok).toBe(true);
    expect(parseWatchdogReport({ ...valid(), buildKey: '42:123e4567-e89b-12d3-a456-426614174000' }).ok).toBe(true);
  });

  it('rejects extra fields (model, os, updateId, timings), missing fields and bad values', () => {
    for (const extra of ['model', 'os', 'updateId', 'timings', 'free']) {
      expect(parseWatchdogReport({ ...valid(), [extra]: 'x' }).ok).toBe(false);
    }
    expect(parseWatchdogReport({ platform: 'ios', category: 'protocol' }).ok).toBe(false);
    expect(parseWatchdogReport({ ...valid(), platform: 'web' }).ok).toBe(false);
    expect(parseWatchdogReport({ ...valid(), category: 'because it broke' }).ok).toBe(false);
    expect(parseWatchdogReport({ ...valid(), buildKey: '42:not-an-id' }).ok).toBe(false);
    expect(parseWatchdogReport({ ...valid(), buildKey: '`| x |`:embedded' }).ok).toBe(false);
    expect(parseWatchdogReport([]).ok).toBe(false);
    expect(parseWatchdogReport(null).ok).toBe(false);
  });

  it('renders only the three validated fields through a fixed template', () => {
    const parsed = parseWatchdogReport(valid());
    const body = watchdogCommentFrom((parsed as { ok: true; report: Parameters<typeof watchdogCommentFrom>[0] }).report);
    expect(body).toContain('| Platform | android |');
    expect(body).toContain('| Build key | `18:embedded` |');
    expect(body).toContain('| Category | ready-timeout |');
    expect(body).not.toMatch(/Model|OS \||Update id/);
  });
});

describe('flood guard', () => {
  beforeEach(resetWatchdogAllowed);

  it('allows N per buildKey per window, then rejects, then recovers', () => {
    for (let i = 0; i < WATCHDOG_MAX_PER_WINDOW; i += 1) expect(watchdogAllowed('42:embedded', 1000 + i)).toBe(true);
    expect(watchdogAllowed('42:embedded', 2000)).toBe(false);
    expect(watchdogAllowed('43:embedded', 2000)).toBe(true);
    expect(watchdogAllowed('42:embedded', 1000 + WATCHDOG_WINDOW_MS + 1)).toBe(true);
  });

  it('caps accepts across rotating buildKeys at the global limit, then recovers', () => {
    for (let i = 0; i < WATCHDOG_GLOBAL_MAX_PER_WINDOW; i += 1) {
      expect(watchdogAllowed(`${i}:embedded`, 1000 + i)).toBe(true);
    }
    expect(watchdogAllowed('rotated:embedded', 2000)).toBe(false);
    expect(watchdogAllowed('0:embedded', 2000)).toBe(false);
    expect(watchdogAllowed('rotated:embedded', 1000 + WATCHDOG_WINDOW_MS + WATCHDOG_GLOBAL_MAX_PER_WINDOW)).toBe(true);
  });
});

describe('POST [watchdog]', () => {
  const req = (body: unknown, ip: string) =>
    new Request('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-real-ip': ip },
      body: JSON.stringify(body),
    });
  const okFetch = () => vi.fn().mockImplementation(async () => new Response(JSON.stringify({ id: 9 }), { status: 201 }));

  beforeEach(resetWatchdogAllowed);
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('posts the fixed-template comment on the tracking issue', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 't');
    const spy = okFetch();
    vi.stubGlobal('fetch', spy);
    const res = await POST(req({ message: '[watchdog]', watchdog: valid() }, '10.8.0.1'));
    expect(res.status).toBe(201);
    const [url, init] = spy.mock.calls[0];
    expect(url).toContain('/issues/4791/comments');
    expect(Object.keys(JSON.parse(init.body as string))).toEqual(['body']);
  });

  it('rejects a malformed or over-wide report without calling GitHub', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 't');
    const spy = okFetch();
    vi.stubGlobal('fetch', spy);
    expect((await POST(req({ message: '[watchdog]', watchdog: { ...valid(), model: 'x' } }, '10.8.0.2'))).status).toBe(400);
    expect((await POST(req({ message: '[watchdog] hi', watchdog: valid() }, '10.8.0.3'))).status).toBe(400);
    expect((await POST(req({ message: '[watchdog]', watchdog: valid(), diag: {} }, '10.8.0.4'))).status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it('answers 429 once a buildKey floods the window', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 't');
    vi.stubGlobal('fetch', okFetch());
    for (let i = 0; i < WATCHDOG_MAX_PER_WINDOW; i += 1) {
      expect((await POST(req({ message: '[watchdog]', watchdog: valid() }, `10.7.0.${i}`))).status).toBe(201);
    }
    expect((await POST(req({ message: '[watchdog]', watchdog: valid() }, '10.7.1.1'))).status).toBe(429);
  });
});
