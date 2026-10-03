import { describe, expect, it } from 'vitest';
import type { DiagPayload, TimingSummary } from './diagnostics';
import { createLaunchTracker, createSpeedTestController } from './speed-test-controller';
import { MAX_TRIES } from './speed-test';

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

type SendResult = { ok: boolean; status?: number };

interface Disk {
  raw: string | null;
  outbox: string[];
  loads: number;
}

function harness(disk: Disk = { raw: null, outbox: [], loads: 0 }) {
  let summary: TimingSummary = coldSummary(1000);
  let elapsed = 1200;
  let images = 7;
  let clock = 1_000_000;
  let seed = 0.05;
  let reply: (p: DiagPayload) => SendResult = () => ({ ok: true });
  const sent: DiagPayload[] = [];
  const timers: { fn: () => void; ms: number; cancelled: boolean }[] = [];
  const c = createSpeedTestController({
    store: {
      load: async () => (disk.loads++, disk.raw),
      save: async (v) => void (disk.raw = v),
    },
    outbox: {
      load: async () => (disk.loads++, disk.outbox),
      save: async (e) => void (disk.outbox = e),
    },
    send: async (p) => {
      sent.push(p);
      return reply(p);
    },
    env: () => env,
    summary: () => summary,
    ui: () => 'shared',
    imagesBy: () => images,
    elapsed: () => elapsed,
    now: () => clock,
    schedule: (fn, ms) => {
      const t = { fn, ms, cancelled: false };
      timers.push(t);
      return () => void (t.cancelled = true);
    },
    rand: () => (seed = (seed + 0.137) % 1),
  });
  return {
    c,
    disk,
    sent,
    timers,
    set: (s: TimingSummary, e = 1200) => {
      summary = s;
      elapsed = e;
    },
    setImages: (n: number) => void (images = n),
    reply: (fn: (p: DiagPayload) => SendResult) => void (reply = fn),
    advance: (ms: number) => void (clock += ms),
  };
}

const kinds = (sent: DiagPayload[]) => sent.map((p) => p.diag.speed?.kind);

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
    await h.c.drain();
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
    await h.c.drain();
    expect(h.sent).toHaveLength(2);
    expect(h.sent[1].diag.speed).toMatchObject({ run: s.run, index: 2, anchor: 'js' });
    expect(h.sent[1].diag.speed?.images10s).toBeUndefined();
    expect(h.sent[1].diag.launch).toBe('warm');

    h.set(warmSummary(1200));
    await h.c.onPaint('warm');
    await h.c.drain();
    expect(kinds(h.sent)).toEqual(['launch', 'launch', 'launch', 'summary']);
    expect(h.sent[2].diag.speed?.index).toBe(3);
    const summary = h.sent[3].diag.speed;
    expect(summary).toMatchObject({ run: s.run, kind: 'summary', index: 3 });
    expect(summary?.launches).toEqual([
      { k: 'cold', ms: 1500 },
      { k: 'warm', ms: 300 },
      { k: 'warm', ms: 1200 },
    ]);

    expect((await h.c.state())?.remaining).toBe(0);
    expect(h.c.isOn()).toBe(false);
    expect(h.c.queued()).toBe(0);
    h.set(warmSummary(10));
    await h.c.onPaint('warm');
    await h.c.drain();
    expect(h.sent).toHaveLength(4);
  });

  it('survives a restart: remaining, run id and results come back from storage', async () => {
    const a = harness();
    await a.c.enable(2);
    a.set(warmSummary(200));
    await a.c.onPaint('warm');
    await a.c.drain();
    const b = harness(a.disk);
    b.set(warmSummary(250));
    await b.c.onPaint('warm');
    await b.c.drain();
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
    await h.c.drain();
    expect(h.sent).toHaveLength(1);
    expect(h.sent[0].diag.speed?.images10s).toBe(2);
    expect(h.timers[0].cancelled).toBe(true);
    await h.c.flush();
    await h.c.drain();
    expect(h.sent).toHaveLength(1);
  });

  it('ignores a paint whose kind does not match the current launch, or with no paint mark', async () => {
    const h = harness();
    await h.c.enable(2);
    h.set(warmSummary(100));
    await h.c.onPaint('cold');
    h.set({ launch: 'warm', stages: [], slowestDownloads: [] });
    await h.c.onPaint('warm');
    await h.c.drain();
    expect(h.sent).toEqual([]);
  });

  it('disable drops the held report and clears the mode', async () => {
    const h = harness();
    await h.c.enable(5);
    await h.c.onPaint('cold');
    await h.c.disable();
    await h.c.flush();
    await h.c.drain();
    expect(h.sent).toEqual([]);
    expect(h.disk.raw).toBeNull();
  });
});

describe('speed test controller: delivery and retry', () => {
  it('a 429 on the summary keeps it queued, persisted, and retried with backoff until accepted', async () => {
    const h = harness();
    await h.c.enable(1);
    h.reply(() => ({ ok: false, status: 429 }));
    h.set(warmSummary(100));
    await h.c.onPaint('warm');
    await h.c.drain();
    expect(kinds(h.sent)).toEqual(['launch', 'summary']);
    expect(h.c.queued()).toBe(2);
    expect(h.disk.outbox).toHaveLength(2);
    expect((await h.c.state())?.remaining).toBe(0);

    await h.c.retry();
    expect(h.sent).toHaveLength(2);

    h.reply(() => ({ ok: true }));
    h.advance(10 * 60_000);
    await h.c.retry();
    expect(kinds(h.sent).slice(2)).toEqual(['launch', 'summary']);
    expect(h.c.queued()).toBe(0);
    expect(h.disk.outbox).toEqual([]);
  });

  it('queued reports survive a restart and go out on the next launch paint', async () => {
    const a = harness();
    await a.c.enable(1);
    a.reply(() => {
      throw new Error('offline');
    });
    a.set(warmSummary(100));
    await a.c.onPaint('warm');
    await a.c.drain();
    expect(a.disk.outbox).toHaveLength(2);

    const b = harness(a.disk);
    b.advance(24 * 3_600_000);
    b.set(coldSummary(900));
    await b.c.onPaint('cold');
    await b.c.drain();
    expect(kinds(b.sent)).toEqual(['launch', 'summary']);
    expect(b.disk.outbox).toEqual([]);
  });

  it('a permanent 4xx is dropped (no retry loop) and attempts are bounded', async () => {
    const h = harness();
    await h.c.enable(1);
    h.reply(() => ({ ok: false, status: 400 }));
    h.set(warmSummary(100));
    await h.c.onPaint('warm');
    await h.c.drain();
    expect(h.c.queued()).toBe(0);

    const g = harness();
    await g.c.enable(1);
    g.reply(() => ({ ok: false, status: 503 }));
    g.set(warmSummary(100));
    await g.c.onPaint('warm');
    for (let i = 0; i < MAX_TRIES + 2; i++) {
      await g.c.drain();
      g.advance(2 * 3_600_000);
    }
    expect(g.c.queued()).toBe(0);
    expect(g.sent.length).toBe(2 * MAX_TRIES);
  });

  it('a duplicate-accepted response (ok) clears the entry', async () => {
    const h = harness();
    await h.c.enable(1);
    h.reply(() => ({ ok: true }));
    h.set(warmSummary(100));
    await h.c.onPaint('warm');
    await h.c.drain();
    expect(h.c.queued()).toBe(0);
  });
});

describe('speed test controller: ordering and cost', () => {
  it('a held cold launch of an old run cannot count into a re-enabled run', async () => {
    const h = harness();
    const first = await h.c.enable(3);
    await h.c.onPaint('cold');
    h.setImages(1);
    const swapping = h.c.enable(4);
    const flushing = h.c.flush();
    const second = await swapping;
    await flushing;
    await h.c.drain();
    expect(second.run).not.toBe('');
    const state = await h.c.state();
    expect(state?.run).toBe(second.run);
    expect(state?.results).toEqual([]);
    expect(state?.remaining).toBe(4);
    expect(h.sent.filter((p) => p.diag.speed?.run === first.run).length).toBe(0);
  });

  it('a finish queued behind disable cannot resurrect the mode', async () => {
    const h = harness();
    await h.c.enable(3);
    await h.c.onPaint('cold');
    const off = h.c.disable();
    const flushing = h.c.flush();
    await Promise.all([flushing, off]);
    await h.c.drain();
    expect(h.disk.raw).toBeNull();
    expect(h.c.isOn()).toBe(false);
    expect(h.sent).toEqual([]);
  });

  it('with the mode off and nothing queued, paints do no storage work after the first load', async () => {
    const h = harness();
    await h.c.init();
    const loads = h.disk.loads;
    for (let i = 0; i < 5; i++) await h.c.onPaint(i % 2 ? 'warm' : 'cold');
    await h.c.retry();
    expect(h.disk.loads).toBe(loads);
    expect(h.timers).toEqual([]);
    expect(h.sent).toEqual([]);
  });

  it('tells listeners when the mode flips', async () => {
    const h = harness();
    await h.c.init();
    let calls = 0;
    const off = h.c.onChange(() => calls++);
    await h.c.enable(2);
    expect(h.c.isOn()).toBe(true);
    await h.c.disable();
    expect(h.c.isOn()).toBe(false);
    expect(calls).toBe(2);
    off();
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
