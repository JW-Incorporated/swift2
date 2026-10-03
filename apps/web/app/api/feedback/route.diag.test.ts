import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import {
  DIAG_ISSUE_NUMBER,
  diagCommentFrom,
  isDiagMessage,
  parseDiagReport,
  type DiagReport,
} from './diag';

describe('POST [diag] reports', () => {
  const req = (body: unknown, headers: Record<string, string> = {}) =>
    new Request('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const validDiag = () => ({
    model: 'Pixel 8',
    os: 'android 15',
    build: '1.0.0 (42)',
    updateId: '123e4567-e89b-12d3-a456-426614174000',
    launch: 'cold',
    timings: {
      manifest: 12.34,
      'at:manifest': 100,
      'first-era-paint': 0,
      'at:first-era-paint': 2500.5,
      'download:content:1989': 50,
    },
  });
  const diagReq = (diag: unknown, ip: string, extra: Record<string, unknown> = {}) =>
    req({ message: '[diag]', diag, ...extra }, { 'x-real-ip': ip });
  const okFetch = () =>
    vi
      .fn()
      .mockImplementation(async () => new Response(JSON.stringify({ id: 9 }), { status: 201 }));

  it('posts a fixed-template comment on the tracking issue, not a new issue', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'feedback-scoped-token');
    vi.stubEnv('FEEDBACK_REPO', '');
    const fetchSpy = okFetch();
    vi.stubGlobal('fetch', fetchSpy);

    const res = await POST(diagReq(validDiag(), '10.9.0.1'));
    expect(res.status).toBe(201);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(
      `https://api.github.com/repos/JW-Incorporated/swift2/issues/${DIAG_ISSUE_NUMBER}/comments`,
    );
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer feedback-scoped-token',
    );
    const sent = JSON.parse(init.body as string);
    expect(Object.keys(sent)).toEqual(['body']);
    const parsed = parseDiagReport(validDiag());
    expect(parsed.ok).toBe(true);
    expect(sent.body).toBe(diagCommentFrom((parsed as { ok: true; report: DiagReport }).report));
    expect(sent.body).toBe(
      [
        '**[diag] device timing report**',
        '',
        '| Field | Value |',
        '|---|---|',
        '| Model | `Pixel 8` |',
        '| OS | `android 15` |',
        '| Build | `1.0.0 (42)` |',
        '| Update id | `123e4567-e89b-12d3-a456-426614174000` |',
        '| Launch | cold |',
        '',
        '| Timing | ms |',
        '|---|---|',
        '| `manifest` | 12.3 |',
        '| `at:manifest` | 100.0 |',
        '| `at:first-era-paint` | 2500.5 |',
        '| `download:content:1989` | 50.0 |',
        '',
        '<!-- diag:v1 -->',
      ].join('\n'),
    );
  });

  it('accepts a WP2.14 watchdog report (fixed stages only) and renders it as at: rows', () => {
    const parsed = parseDiagReport({
      ...validDiag(),
      launch: 'unknown',
      timings: {
        'watchdog-quarantine': 0,
        'at:watchdog-quarantine': 0,
        'wd-ready-timeout': 0,
        'at:wd-ready-timeout': 0,
      },
    });
    expect(parsed.ok).toBe(true);
    const body = diagCommentFrom((parsed as { ok: true; report: DiagReport }).report);
    expect(body).toContain('| `at:watchdog-quarantine` | 0.0 |');
    expect(body).toContain('| `at:wd-ready-timeout` | 0.0 |');
    expect(body).not.toContain('| `wd-ready-timeout` |');
  });

  it('rejects a watchdog reason that is not one of the fixed categories (no free text)', () => {
    for (const key of ['wd-because it broke', 'wd-', 'reason:ready-timeout', 'watchdog-other']) {
      expect(parseDiagReport({ ...validDiag(), timings: { [key]: 0 } }).ok).toBe(false);
    }
  });

  it('keeps the duration row for a timed stage that measured 0 ms, drops it only for point marks', () => {
    const parsed = parseDiagReport({
      ...validDiag(),
      timings: {
        manifest: 0,
        'at:manifest': 100,
        'first-era-paint': 0,
        'at:first-era-paint': 2500.5,
      },
    });
    expect(parsed.ok).toBe(true);
    const body = diagCommentFrom((parsed as { ok: true; report: DiagReport }).report);
    expect(body).toContain('| `manifest` | 0.0 |');
    expect(body).toContain('| `at:manifest` | 100.0 |');
    expect(body).toContain('| `at:first-era-paint` | 2500.5 |');
    expect(body).not.toContain('| `first-era-paint` |');
  });

  it('rejects an extra field with 400 and never calls GitHub', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'tok');
    const fetchSpy = okFetch();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await POST(diagReq({ ...validDiag(), note: 'hello @evil' }, '10.9.0.2'));
    expect(res.status).toBe(400);
    expect(JSON.stringify(await res.json())).not.toContain('evil');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects free text: a message beyond the bare prefix, free-text fields, unknown timing keys, bad charsets', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'tok');
    const fetchSpy = okFetch();
    vi.stubGlobal('fetch', fetchSpy);
    const bad: Array<[string, unknown, Record<string, unknown>?]> = [
      ['10.9.1.1', validDiag(), { message: '[diag] buy pills at evil.example' }],
      ['10.9.1.2', { ...validDiag(), model: 'Pixel `8` @evil' }],
      ['10.9.1.3', { ...validDiag(), updateId: 'not-a-uuid' }],
      ['10.9.1.4', { ...validDiag(), launch: 'lukewarm' }],
      ['10.9.1.5', { ...validDiag(), timings: { 'buy-pills': 1 } }],
      ['10.9.1.6', { ...validDiag(), timings: { manifest: 'fast' } }],
      ['10.9.1.7', validDiag(), { location: { url: 'x' } }],
      ['10.9.1.8', undefined],
      ['10.9.1.9', 'text'],
    ];
    for (const [ip, diag, extra] of bad) {
      const res = await POST(req({ message: '[diag]', diag, ...extra }, { 'x-real-ip': ip }));
      expect(res.status).toBe(400);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects out-of-range, non-finite and oversize timings', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'tok');
    const fetchSpy = okFetch();
    vi.stubGlobal('fetch', fetchSpy);
    const withTimings = (timings: Record<string, unknown>) => ({ ...validDiag(), timings });
    const many = Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`download:f${i}`, 1]));
    const bad = [
      withTimings({ manifest: -1 }),
      withTimings({ manifest: 600001 }),
      withTimings({ manifest: null }),
      withTimings({}),
      withTimings(many),
    ];
    for (const [i, diag] of bad.entries()) {
      const res = await POST(diagReq(diag, `10.9.2.${i}`));
      expect(res.status).toBe(400);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('still rate-limits [diag] reports per IP, and answers 503 with no token', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', '');
    expect((await POST(diagReq(validDiag(), '10.9.3.1'))).status).toBe(503);

    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'tok');
    vi.stubGlobal('fetch', okFetch());
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++)
      statuses.push((await POST(diagReq(validDiag(), '10.9.3.2'))).status);
    expect(statuses.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
    expect(statuses[6]).toBe(429);
  });

  it('leaves non-diag messages on the normal issue path', async () => {
    expect(isDiagMessage('[diag]')).toBe(true);
    expect(isDiagMessage('hello [diag]')).toBe(false);
    expect(isDiagMessage('[Diag]')).toBe(false);
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'tok');
    const fetchSpy = okFetch();
    vi.stubGlobal('fetch', fetchSpy);
    await POST(req({ message: 'my [diag] is odd' }, { 'x-real-ip': '10.9.0.4' }));
    expect(fetchSpy.mock.calls[0][0]).toMatch(/\/issues$/);
  });

  it('rejects "[diag]" with trailing whitespace (raw message must be exactly "[diag]")', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'tok');
    const fetchSpy = okFetch();
    vi.stubGlobal('fetch', fetchSpy);
    for (const [i, message] of ['[diag] \n', ' [diag]', '[diag]\n'].entries()) {
      const res = await POST(req({ message, diag: validDiag() }, { 'x-real-ip': `10.9.4.${i}` }));
      expect(res.status).toBe(400);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects any top-level field other than message, hp and diag', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'tok');
    const fetchSpy = okFetch();
    vi.stubGlobal('fetch', fetchSpy);
    const res = await POST(diagReq(validDiag(), '10.9.5.1', { extra: 'x' }));
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('accepts launch "unknown" truthfully', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'tok');
    vi.stubGlobal('fetch', okFetch());
    expect((await POST(diagReq({ ...validDiag(), launch: 'unknown' }, '10.9.6.1'))).status).toBe(
      201,
    );
  });

  it('always comments on the swift2 tracking issue, ignoring FEEDBACK_REPO', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'tok');
    vi.stubEnv('FEEDBACK_REPO', 'someone/else');
    const fetchSpy = okFetch();
    vi.stubGlobal('fetch', fetchSpy);
    await POST(diagReq(validDiag(), '10.9.7.1'));
    expect(fetchSpy.mock.calls[0][0]).toBe(
      `https://api.github.com/repos/JW-Incorporated/swift2/issues/${DIAG_ISSUE_NUMBER}/comments`,
    );
  });
});
