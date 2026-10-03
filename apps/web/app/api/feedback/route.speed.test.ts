import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import {
  MAX_SPEED_LAUNCHES,
  diagCommentFrom,
  parseDiagReport,
  resetSpeedAllowed,
  speedAllowed,
  speedVerdict,
  type DiagReport,
} from './diag';

const base = {
  model: 'Pixel 10 Pro',
  os: 'android 16',
  build: '1.0.0 (18)',
  updateId: 'embedded',
};
const launchDiag = (extra: Record<string, unknown> = {}) => ({
  ...base,
  launch: 'cold',
  timings: { 'first-era-paint': 0, 'at:first-era-paint': 1500.5, 'native-lead': 600, 'at:first-image-paint': 1700 },
  speed: { run: 'abcd1234', kind: 'launch', index: 1, total: 10, ui: 'shared', anchor: 'native', images10s: 12, ...extra },
});
const summaryDiag = (launches: unknown, extra: Record<string, unknown> = {}) => ({
  ...base,
  launch: 'unknown',
  timings: {},
  speed: { run: 'abcd1234', kind: 'summary', index: 3, total: 10, ui: 'shared', anchor: 'native', launches, ...extra },
});
const launches = [
  { k: 'cold', ms: 2100 },
  { k: 'cold', ms: 2400 },
  { k: 'warm', ms: 900 },
];

describe('speed test reports: validation', () => {
  it('accepts a launch report and a summary (empty timings only for the summary)', () => {
    expect(parseDiagReport(launchDiag()).ok).toBe(true);
    expect(parseDiagReport(summaryDiag(launches)).ok).toBe(true);
    expect(parseDiagReport({ ...launchDiag(), timings: {} }).ok).toBe(false);
    expect(parseDiagReport({ ...summaryDiag(launches), speed: undefined }).ok).toBe(false);
  });

  it('stays strict: unknown keys, bad run ids, ranges, cross-kind fields', () => {
    const bad = [
      launchDiag({ extra: 1 }),
      launchDiag({ run: 'ABCD1234' }),
      launchDiag({ run: 'abcd12' }),
      launchDiag({ kind: 'other' }),
      launchDiag({ index: 0 }),
      launchDiag({ index: 11 }),
      launchDiag({ total: MAX_SPEED_LAUNCHES + 1 }),
      launchDiag({ index: 1.5 }),
      launchDiag({ ui: 'web' }),
      launchDiag({ anchor: 'gps' }),
      launchDiag({ images10s: -1 }),
      launchDiag({ images10s: 501 }),
      launchDiag({ images10s: '3' }),
      launchDiag({ launches }),
      summaryDiag([]),
      summaryDiag(launches, { images10s: 1 }),
      summaryDiag([{ k: 'hot', ms: 1 }]),
      summaryDiag([{ k: 'cold', ms: -1 }]),
      summaryDiag([{ k: 'cold', ms: 700_000 }]),
      summaryDiag([{ k: 'cold', ms: 1, note: 'x' }]),
      summaryDiag(Array.from({ length: MAX_SPEED_LAUNCHES + 1 }, () => ({ k: 'warm', ms: 1 }))),
      { ...launchDiag(), speed: 'abcd1234' },
      { ...launchDiag(), speed: [] },
    ];
    for (const b of bad) expect(parseDiagReport(b).ok).toBe(false);
  });

  it('new stages are accepted; unknown ones are still rejected', () => {
    const d = launchDiag();
    d.timings = { 'resume-paint': 0, 'at:resume-paint': 85 } as never;
    expect(parseDiagReport(d).ok).toBe(true);
    d.timings = { 'resume-pain': 1 } as never;
    expect(parseDiagReport(d).ok).toBe(false);
  });
});

describe('speed test reports: rendering', () => {
  const report = (d: unknown) => (parseDiagReport(d) as { ok: true; report: DiagReport }).report;

  it('a launch report names run, launch number, UI path, clock start and image count', () => {
    const body = diagCommentFrom(report(launchDiag()));
    expect(body).toContain('| Speed test | run `abcd1234`, launch 1 of 10 |');
    expect(body).toContain('| UI | shared |');
    expect(body).toContain('| Clock starts at | native process start |');
    expect(body).toContain('| Images loaded by T+10 s | 12 |');
    expect(body).toContain('| `native-lead` | 600.0 |');
    expect(body).toContain('<!-- diag:v1 -->');
  });

  it('labels the JS-only anchor honestly', () => {
    expect(diagCommentFrom(report(launchDiag({ anchor: 'js' })))).toContain('JS start (native lead unavailable)');
  });

  it('the summary recomputes worst cold/warm and the verdict from the launches', () => {
    const body = diagCommentFrom(report(summaryDiag(launches)));
    expect(body).toContain('| Worst cold (bar 2500) | 2400.0 |');
    expect(body).toContain('| Worst warm (bar 1000) | 900.0 |');
    expect(body).toContain('| Verdict | **INCOMPLETE** |');
    expect(body).toContain('| 3 | warm | 900.0 |');
    const fail = diagCommentFrom(report(summaryDiag([...launches, { k: 'warm', ms: 1000.1 }])));
    expect(fail).toContain('**FAIL**');
  });

  it('speedVerdict: bar is inclusive, PASS needs 5 cold AND 5 warm', () => {
    const many = (k: 'cold' | 'warm', n: number, ms: number) => Array.from({ length: n }, () => ({ k, ms }));
    expect(speedVerdict([...many('cold', 5, 2500), ...many('warm', 5, 1000)]).verdict).toBe('PASS');
    expect(speedVerdict([...many('cold', 1, 10), ...many('warm', 9, 10)]).verdict).toBe('INCOMPLETE');
    expect(speedVerdict([{ k: 'cold', ms: 2500 }, { k: 'warm', ms: 1000 }]).verdict).toBe('INCOMPLETE');
    expect(speedVerdict([{ k: 'cold', ms: 2500.5 }]).verdict).toBe('FAIL');
    expect(speedVerdict([{ k: 'cold', ms: 10 }]).verdict).toBe('INCOMPLETE');
  });

  it('reports without speed render exactly as before (no speed rows)', () => {
    const plain = report({ ...base, launch: 'cold', timings: { manifest: 1, 'at:manifest': 2 } });
    expect(diagCommentFrom(plain)).not.toContain('Speed test');
  });
});

describe('speed test reports: rate limit', () => {
  beforeEach(() => resetSpeedAllowed());
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    resetSpeedAllowed();
  });

  it('caps reports per run id (one per launch plus the summary) and across run ids', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < MAX_SPEED_LAUNCHES + 1; i++) expect(speedAllowed('aaaaaaaa', t0 + i)).toBe(true);
    expect(speedAllowed('aaaaaaaa', t0 + 100)).toBe(false);
    expect(speedAllowed('bbbbbbbb', t0 + 100)).toBe(true);
    expect(speedAllowed('aaaaaaaa', t0 + 25 * 60 * 60_000)).toBe(true);
    resetSpeedAllowed();
    let allowed = 0;
    for (let i = 0; i < 400; i++) if (speedAllowed(i.toString(16).padStart(8, '0'), t0)) allowed++;
    expect(allowed).toBe(300);
  });

  const okFetch = () =>
    vi.fn().mockImplementation(async () => new Response(JSON.stringify({ id: 9 }), { status: 201 }));
  const post = (diag: unknown, ip = '10.7.0.1') =>
    POST(
      new Request('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-real-ip': ip },
        body: JSON.stringify({ message: '[diag]', diag }),
      }),
    );

  it('speed reports bypass the generic 5/min per-IP limiter, so the summary is not dropped', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'tok');
    const fetchSpy = okFetch();
    vi.stubGlobal('fetch', fetchSpy);
    for (let i = 1; i <= 10; i++) expect((await post(launchDiag({ run: 'cafe0002', index: i }), '10.7.1.1')).status).toBe(201);
    expect((await post(summaryDiag(launches, { run: 'cafe0002', index: 3 }), '10.7.1.1')).status).toBe(201);
    expect(fetchSpy).toHaveBeenCalledTimes(11);
  });

  it('the generic limiter still applies to a plain [diag] report from the same IP', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'tok');
    vi.stubGlobal('fetch', okFetch());
    const plain = { ...base, launch: 'cold', timings: { manifest: 1, 'at:manifest': 2 } };
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) statuses.push((await post(plain, '10.7.2.1')).status);
    expect(statuses[6]).toBe(429);
  });

  it('a duplicate (run, kind, index) and a second summary answer 200 duplicate without calling GitHub', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'tok');
    const fetchSpy = okFetch();
    vi.stubGlobal('fetch', fetchSpy);
    const run = 'cafe0003';
    expect((await post(launchDiag({ run, index: 2 }))).status).toBe(201);
    const dup = await post(launchDiag({ run, index: 2 }));
    expect(dup.status).toBe(200);
    expect(await dup.json()).toEqual({ ok: true, duplicate: true });
    expect((await post(summaryDiag(launches, { run }))).status).toBe(201);
    expect((await post(summaryDiag(launches, { run }))).status).toBe(200);
    expect((await post(launchDiag({ run, index: 3 }))).status).toBe(201);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('a failed GitHub post is not remembered, so the client retry is accepted', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'tok');
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response('no', { status: 500 })));
    const diag = launchDiag({ run: 'cafe0004', index: 1 });
    expect((await post(diag)).status).toBe(502);
    vi.stubGlobal('fetch', okFetch());
    expect((await post(diag)).status).toBe(201);
  });

  it('the route answers 429 once a run id is over its budget and never calls GitHub for it', async () => {
    vi.stubEnv('GITHUB_FEEDBACK_TOKEN', 'tok');
    const fetchSpy = okFetch();
    vi.stubGlobal('fetch', fetchSpy);
    for (let i = 0; i < MAX_SPEED_LAUNCHES + 1; i++) expect(speedAllowed('cafe0001')).toBe(true);
    expect((await post(launchDiag({ run: 'cafe0001' }))).status).toBe(429);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
