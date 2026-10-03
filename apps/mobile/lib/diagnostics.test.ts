import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLoadTimingSink, beginStage } from '@swift2/content';
import {
  DIAG_PREFIX,
  buildDiagPayload,
  createTapUnlock,
  createTimingCollector,
  diagCollector,
  diagMarkOnce,
  installDiagnostics,
  launchKindOf,
  summarizeMarks,
} from './diagnostics';
import { sendDiagReport } from './diagnostics-send';
import { parseDiagReport } from '../../web/app/api/feedback/diag';

function clock(...values: number[]) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

const env = { model: 'Pixel 8', os: 'android 15', build: '1.0.0 (42)', updateId: 'abc-123' };

describe('createTimingCollector', () => {
  it('records instant marks and timed stages on the injected clock', () => {
    const c = createTimingCollector(clock(5, 10, 40), 0);
    c.mark('app-start');
    const end = c.start('config');
    end();
    expect(c.marks()).toEqual([
      { stage: 'app-start', startMs: 5, durationMs: 0 },
      { stage: 'config', startMs: 10, durationMs: 30 },
    ]);
  });

  it('rebases packages/content load events onto the launch origin', () => {
    const c = createTimingCollector(() => 0, 0);
    c.record({ stage: 'download', detail: 'content:1989', startMs: 1, durationMs: 9 });
    expect(c.marks()[0]).toEqual({ stage: 'download', detail: 'content:1989', startMs: 1, durationMs: 9 });
  });

  it('reports small launch offsets even when the clock origin is huge', () => {
    const base = 1e9;
    const c = createTimingCollector(clock(base, base + 120, base + 300, base + 2500), undefined);
    c.mark('app-start');
    c.record({ stage: 'hash', detail: 'a', startMs: base + 200, durationMs: 4 });
    const end = c.start('parse');
    end();
    const marks = c.marks();
    expect(marks[0]).toMatchObject({ stage: 'app-start', startMs: 120, durationMs: 0 });
    expect(marks[1]).toMatchObject({ stage: 'hash', startMs: 200 });
    expect(marks[2]).toMatchObject({ stage: 'parse', startMs: 300, durationMs: 2200 });
    const p = buildDiagPayload(env, c.summary());
    for (const v of Object.values(p.diag.timings)) expect(v).toBeLessThan(600000);
    expect(p.diag.timings['at:app-start']).toBe(120);
    expect(p.diag.timings['at:hash']).toBe(200);
    expect(parseDiagReport(p.diag).ok).toBe(true);
  });

  it('caps stored marks and can reset', () => {
    const c = createTimingCollector(() => 0, 0);
    for (let i = 0; i < 600; i++) c.mark('x');
    expect(c.marks().length).toBe(500);
    c.reset();
    expect(c.marks().length).toBe(0);
  });
});

describe('launchKindOf / summarizeMarks', () => {
  const m = (stage: string, durationMs: number, detail?: string, startMs = 0) => ({
    stage,
    durationMs,
    startMs,
    ...(detail ? { detail } : {}),
  });

  it('reads cold from a 200 manifest and warm from a 304', () => {
    expect(launchKindOf([m('manifest', 5, '200')])).toBe('cold');
    expect(launchKindOf([m('manifest', 5, '304')])).toBe('warm');
    expect(launchKindOf([])).toBe('unknown');
  });

  it('aggregates per stage and lists the slowest downloads', () => {
    const s = summarizeMarks([
      m('download', 10, 'a', 1),
      m('download', 30, 'b', 2),
      m('hash', 4, 'a', 12),
      m('app-start', 0, undefined, 0.5),
    ]);
    expect(s.stages.find((x) => x.stage === 'download')).toEqual({
      stage: 'download',
      count: 2,
      totalMs: 40,
      maxMs: 30,
      firstStartMs: 1,
    });
    expect(s.slowestDownloads[0]).toEqual({ file: 'b', ms: 30 });
    expect(s.stages.map((x) => x.stage)).toEqual(['download', 'hash', 'app-start']);
  });
});

describe('buildDiagPayload', () => {
  const summary = {
    launch: 'cold' as const,
    stages: [
      { stage: 'manifest', count: 1, totalMs: 12.34, maxMs: 12.34, firstStartMs: 100.06 },
      { stage: 'not-a-known-stage', count: 1, totalMs: 1, maxMs: 1, firstStartMs: 1 },
      { stage: 'first-era-paint', count: 1, totalMs: 0, maxMs: 0, firstStartMs: 9e9 },
    ],
    slowestDownloads: [{ file: 'content:1989 `@evil`', ms: 50.55 }],
  };

  it('carries only the whitelisted fields with known stage names', () => {
    const p = buildDiagPayload(env, summary);
    expect(p.message).toBe(DIAG_PREFIX);
    expect(Object.keys(p.diag).sort()).toEqual(
      ['build', 'launch', 'model', 'os', 'timings', 'updateId'].sort(),
    );
    expect(p.diag.timings.manifest).toBe(12.3);
    expect(p.diag.timings['at:manifest']).toBe(100.1);
    expect(p.diag.timings['not-a-known-stage']).toBeUndefined();
    expect(p.diag.timings['at:first-era-paint']).toBe(600000);
    expect(p.diag.timings['download:content:1989evil']).toBe(50.6);
    expect(p.diag.updateId).toBe('embedded');
  });

  it('is accepted by the server-side schema (contract with /api/feedback)', () => {
    const p = buildDiagPayload(
      { ...env, model: 'iPad (10th generation) `x`', updateId: '123e4567-e89b-12d3-a456-426614174000' },
      summary,
    );
    expect(parseDiagReport(p.diag).ok).toBe(true);
    expect(buildDiagPayload(env, { launch: 'unknown', stages: [], slowestDownloads: [] }).diag.timings).toEqual({
      'app-start': 0,
    });
    const unknown = buildDiagPayload(env, { launch: 'unknown', stages: [], slowestDownloads: [] });
    expect(unknown.diag.launch).toBe('unknown');
    expect(parseDiagReport(unknown.diag).ok).toBe(true);
  });
});

describe('createTapUnlock', () => {
  it('unlocks on the 7th tap within the window', () => {
    let t = 0;
    const u = createTapUnlock({ now: () => (t += 100) });
    const results = Array.from({ length: 7 }, () => u.tap());
    expect(results).toEqual([false, false, false, false, false, false, true]);
  });

  it('restarts the count after a pause and after unlocking', () => {
    let t = 0;
    const u = createTapUnlock({ now: () => t });
    for (let i = 0; i < 6; i++) u.tap();
    t += 5000;
    expect(u.tap()).toBe(false);
    for (let i = 0; i < 5; i++) u.tap();
    expect(u.tap()).toBe(true);
    expect(u.tap()).toBe(false);
  });
});

describe('installDiagnostics', () => {
  afterEach(() => setLoadTimingSink(null));

  it('diagMarkOnce is a no-op before install, then marks each stage once', () => {
    diagMarkOnce('provider-wiring');
    expect(diagCollector.marks().some((x) => x.stage === 'provider-wiring')).toBe(false);
    installDiagnostics();
    diagMarkOnce('provider-wiring');
    diagMarkOnce('provider-wiring');
    diagMarkOnce('first-era-paint');
    const stages = diagCollector.marks().map((x) => x.stage);
    expect(stages.filter((x) => x === 'provider-wiring').length).toBe(1);
    expect(stages).toContain('first-era-paint');
  });

  it('installs once and routes content stage events into the shared collector', () => {
    installDiagnostics();
    installDiagnostics();
    expect(diagCollector.marks().filter((x) => x.stage === 'app-start').length).toBe(1);
    setLoadTimingSink((e) => diagCollector.record(e));
    beginStage('probe')();
    expect(diagCollector.marks().some((x) => x.stage === 'probe')).toBe(true);
  });
});

describe('sendDiagReport', () => {
  const payload = buildDiagPayload(env, { launch: 'warm', stages: [], slowestDownloads: [] });

  it('posts the structured payload to /api/feedback', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    const result = await sendDiagReport(payload, fetchImpl as unknown as typeof fetch);
    expect(result.ok).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toMatch(/\/api\/feedback$/);
    expect(JSON.parse(init.body)).toEqual(payload);
  });

  it('surfaces the route error and survives a network failure', async () => {
    const limited = vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: 'slow down' }) });
    expect(await sendDiagReport(payload, limited as unknown as typeof fetch)).toEqual({ ok: false, error: 'slow down' });
    const down = vi.fn().mockRejectedValue(new Error('offline'));
    expect((await sendDiagReport(payload, down as unknown as typeof fetch)).ok).toBe(false);
  });
});
