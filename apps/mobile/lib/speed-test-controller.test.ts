import { describe, expect, it } from 'vitest';
import type { DiagPayload, TimingSummary } from './diagnostics';
import { createLaunchTracker, createSpeedTestController } from './speed-test-controller';

const env = { model: 'Pixel 10 Pro', os: 'android 16', build: '1.0.0 (18)', updateId: 'embedded' };
const st = (stage: string, totalMs: number, firstStartMs: number) => ({
  stage,
  count: 1,
  totalMs,
  maxMs: totalMs,
  firstStartMs,
});
const coldSummary = (paint: number, lead = 500): TimingSummary => ({
  launch: 'cold',
  stages: [st('first-era-paint', 0, paint), st('native-lead', lead, 0)],
  slowestDownloads: [],
});
const warmSummary = (paint: number): TimingSummary => ({
  launch: 'warm',
  stages: [st('resume-paint', 0, paint)],
  slowestDownloads: [],
});

function harness(initial: string | null = null) {
  let raw = initial;
  let summary: TimingSummary = coldSummary(1000);
  let elapsed = 1200;
  let images = 7;
  const sent: DiagPayload[] = [];
  const timers: { fn: () => void; ms: number; cancelled: boolean }[] = [];
  const c = createSpeedTestController({
    store: { load: async () => raw, save: async (v) => void (raw = v) },
    send: async (p) => {
      sent.push(p);
      return { ok: true };
    },
    env: () => env,
    summary: () => summary,
    ui: () => 'shared',
    imagesBy: () => images,
    elapsed: () => elapsed,
    schedule: (fn, ms) => {
      const t = { fn, ms, cancelled: false };
      timers.push(t);
      return () => void (t.cancelled = true);
    },
    rand: () => 0.1,
  });
  return {
    c,
    sent,
    timers,
    raw: () => raw,
    set: (s: TimingSummary, e = 1200) => {
      summary = s;
      elapsed = e;
    },
    setImages: (n: number) => void (images = n),
  };
}

describe('speed test controller', () => {
  it('does nothing while the mode is off', async () => {
    const h = harness();
    await h.c.onPaint('cold');
    expect(h.sent).toEqual([]);
    expect(h.timers).toEqual([]);
  });

  it('enable -> N launches -> auto-off + one summary, all under one run id', async () => {
    const h = harness();
    const s = await h.c.enable(3);
    expect(s.remaining).toBe(3);

    h.set(coldSummary(1000));
    await h.c.onPaint('cold');
    expect(h.sent).toEqual([]);
    expect(h.timers).toHaveLength(1);
    expect(h.timers[0].ms).toBe(10_000 - 1200);
    h.timers[0].fn();
    await h.c.flush();
    expect(h.sent).toHaveLength(1);
    expect(h.sent[0].diag.speed).toMatchObject({
      run: s.run,
      kind: 'launch',
      index: 1,
      total: 3,
      ui: 'shared',
      anchor: 'native',
      images10s: 7,
    });
    expect(h.sent[0].diag.launch).toBe('cold');

    h.set(warmSummary(300));
    await h.c.onPaint('warm');
    expect(h.sent).toHaveLength(2);
    expect(h.sent[1].diag.speed).toMatchObject({ run: s.run, index: 2, anchor: 'js' });
    expect(h.sent[1].diag.speed?.images10s).toBeUndefined();
    expect(h.sent[1].diag.launch).toBe('warm');

    h.set(warmSummary(1200));
    await h.c.onPaint('warm');
    expect(h.sent).toHaveLength(4);
    expect(h.sent[2].diag.speed?.index).toBe(3);
    const summary = h.sent[3].diag.speed;
    expect(summary).toMatchObject({ run: s.run, kind: 'summary', index: 3 });
    expect(summary?.launches).toEqual([
      { k: 'cold', ms: 1500 },
      { k: 'warm', ms: 300 },
      { k: 'warm', ms: 1200 },
    ]);

    const after = await h.c.state();
    expect(after?.remaining).toBe(0);
    h.set(warmSummary(10));
    await h.c.onPaint('warm');
    expect(h.sent).toHaveLength(4);
  });

  it('survives a restart: remaining, run id and results come back from storage', async () => {
    const a = harness();
    await a.c.enable(2);
    a.set(warmSummary(200));
    await a.c.onPaint('warm');
    const b = harness(a.raw());
    b.set(warmSummary(250));
    await b.c.onPaint('warm');
    expect(b.sent).toHaveLength(2);
    expect(b.sent[0].diag.speed?.index).toBe(2);
    expect(b.sent[1].diag.speed?.kind).toBe('summary');
  });

  it('flush sends a held cold report early (app backgrounded before T+10 s) with the image count so far', async () => {
    const h = harness();
    await h.c.enable(5);
    await h.c.onPaint('cold');
    h.setImages(2);
    await h.c.flush();
    expect(h.sent).toHaveLength(1);
    expect(h.sent[0].diag.speed?.images10s).toBe(2);
    expect(h.timers[0].cancelled).toBe(true);
    await h.c.flush();
    expect(h.sent).toHaveLength(1);
  });

  it('ignores a paint whose kind does not match the current launch, or with no paint mark', async () => {
    const h = harness();
    await h.c.enable(2);
    h.set(warmSummary(100));
    await h.c.onPaint('cold');
    h.set({ launch: 'warm', stages: [], slowestDownloads: [] });
    await h.c.onPaint('warm');
    expect(h.sent).toEqual([]);
  });

  it('disable drops the held report and clears the mode', async () => {
    const h = harness();
    await h.c.enable(5);
    await h.c.onPaint('cold');
    await h.c.disable();
    await h.c.flush();
    expect(h.sent).toEqual([]);
    expect(h.raw()).toBeNull();
  });

  it('a failed send still counts the launch so the run cannot hang', async () => {
    let raw: string | null = null;
    const sent: DiagPayload[] = [];
    const c = createSpeedTestController({
      store: { load: async () => raw, save: async (v) => void (raw = v) },
      send: async (p) => {
        sent.push(p);
        throw new Error('offline');
      },
      env: () => env,
      summary: () => warmSummary(100),
      ui: () => 'native',
      imagesBy: () => 0,
      elapsed: () => 0,
      schedule: () => () => undefined,
    });
    await c.enable(1);
    await c.onPaint('warm');
    expect((await c.state())?.remaining).toBe(0);
    expect(sent).toHaveLength(2);
  });
});

describe('launch tracker (cold vs warm)', () => {
  function tracker() {
    const log: string[] = [];
    const t = createLaunchTracker({
      beginWarm: () => log.push('warm'),
      onResumed: () => log.push('resumed'),
      onBackground: () => log.push('bg'),
    });
    return { t, log };
  }

  it('background -> active in the same process is a warm launch; inactive blips are not', () => {
    const { t, log } = tracker();
    t.change('inactive');
    t.change('active');
    expect(log).toEqual([]);
    t.change('background');
    t.change('active');
    expect(log).toEqual(['bg', 'warm', 'resumed']);
  });

  it('a process that first reports active is cold (no warm event), and each resume is its own warm launch', () => {
    const { t, log } = tracker();
    t.change('active');
    expect(log).toEqual([]);
    t.change('background');
    t.change('active');
    t.change('background');
    t.change('active');
    expect(log.filter((x) => x === 'warm')).toHaveLength(2);
  });
});
