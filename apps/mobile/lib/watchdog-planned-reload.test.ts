import { describe, expect, it, vi } from 'vitest';
import { freshRecord, markReady, beginAttempt, type WatchdogRecord } from './watchdog';
import { READY_TIMEOUT_MS, createAttemptMonitor } from './watchdog-monitor';
import { plannedReloadStep } from './watchdog-planned-reload';

function harness(writeOk: boolean, state: 'ready' | 'attempting' = 'ready') {
  let t = 0;
  const timers: { at: number; fn: () => void }[] = [];
  const onStrike = vi.fn();
  const monitor = createAttemptMonitor({
    now: () => t,
    active: true,
    onReady: () => {},
    onStrike,
    scheduler: { setTimeout: (fn, ms) => (timers.push({ at: t + ms, fn }), timers.length), clearTimeout: (h) => void (timers[(h as number) - 1] = { at: Infinity, fn: () => {} }) },
  });
  monitor.ready();
  const attempt = beginAttempt(freshRecord('b', 0), 0);
  const base: WatchdogRecord = state === 'ready' ? markReady(attempt, 1) : attempt;
  let rec: WatchdogRecord | null = base;
  const persisted: WatchdogRecord[] = [base];
  const write = vi.fn(async (r: WatchdogRecord) => {
    if (!writeOk) return false;
    persisted.push(r);
    return true;
  });
  const onWriteFailed = vi.fn();
  const run = () => plannedReloadStep({ getRecord: () => rec, setRecord: (r) => void (rec = r), write, arm: () => monitor.plannedReload(), onWriteFailed, now: () => 5 });
  const advance = (ms: number) => {
    t += ms;
    for (const x of timers.splice(0)) if (x.at <= t) x.fn(); else timers.push(x);
  };
  return { run, write, persisted, onWriteFailed, onStrike, advance, record: () => rec, base };
}

describe('plannedReloadStep', () => {
  it('write fails: false, persisted stays ready, record untouched and no strike after the ready timeout', async () => {
    const h = harness(false);
    expect(await h.run()).toBe(false);
    expect(h.persisted.at(-1)?.state).toBe('ready');
    expect(h.record()).toBe(h.base);
    expect(h.onWriteFailed).toHaveBeenCalledTimes(1);
    h.advance(READY_TIMEOUT_MS * 2);
    expect(h.onStrike).not.toHaveBeenCalled();
  });

  it('write succeeds: persisted attempting before it resolves, the monitor is armed afterwards', async () => {
    const h = harness(true);
    expect(await h.run()).toBe(true);
    expect(h.persisted.at(-1)?.state).toBe('attempting');
    expect(h.record()?.state).toBe('attempting');
    h.advance(READY_TIMEOUT_MS);
    expect(h.onStrike).toHaveBeenCalledWith('ready-timeout');
  });

  it('a non-ready record: false and no write', async () => {
    const h = harness(true, 'attempting');
    expect(await h.run()).toBe(false);
    expect(h.write).not.toHaveBeenCalled();
  });
});
