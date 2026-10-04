import { describe, expect, it, vi } from 'vitest';
import { createTapGate, type RawResponse } from './notification-tap-gate';
import { startTapIngest } from './notification-tap-ingest';

const SITE = 'https://www.longlivets.com';
const r = (identifier: unknown, deepLink: string, date?: number): RawResponse => ({
  notification: { date, request: { identifier, content: { data: { deepLink } } } },
});
const flush = () => new Promise((res) => setTimeout(res, 5));

function rig(last: RawResponse | null | Promise<RawResponse | null>) {
  const nav = vi.fn();
  const gate = createTapGate({ siteUrl: SITE });
  gate.setNativeNavigator(nav);
  let live: (x: RawResponse | null) => void = () => {};
  const clearLast = vi.fn().mockResolvedValue(undefined);
  const stop = startTapIngest(gate, {
    getLast: () => Promise.resolve(last),
    clearLast,
    listen: (cb) => ((live = cb), () => {}),
  });
  return { nav, clearLast, stop, deliver: (x: RawResponse | null) => live(x) };
}

describe('tap ingest', () => {
  it('cold + listener delivering the same identifier navigate once; cold path clears once', async () => {
    const t = rig(r('same', '/settings'));
    t.deliver(r('same', '/settings'));
    await flush();
    expect(t.nav).toHaveBeenCalledTimes(1);
    expect(t.clearLast).toHaveBeenCalledTimes(1);
  });

  it('a live tap arriving while the cold read is pending is processed after it, in order, and not cleared', async () => {
    let release: (v: RawResponse | null) => void = () => {};
    const t = rig(new Promise((res) => (release = res)));
    t.deliver(r('live', '/?item=2'));
    await flush();
    expect(t.nav).not.toHaveBeenCalled();
    release(r('cold', '/settings'));
    await flush();
    expect(t.nav.mock.calls.map((c) => c[0])).toEqual([`${SITE}/settings`, `${SITE}/?item=2`]);
    expect(t.clearLast).toHaveBeenCalledTimes(1);
  });

  it('identifier-less responses dedupe on date + link; malformed (no id, no date) are rejected', async () => {
    const t = rig(r(undefined, '/settings', 7));
    t.deliver(r(undefined, '/settings', 7));
    t.deliver(r(undefined, '/settings'));
    await flush();
    expect(t.nav).toHaveBeenCalledTimes(1);
  });

  it('no cold response: nothing navigates and nothing is cleared; stop ignores later taps', async () => {
    const t = rig(null);
    await flush();
    expect(t.clearLast).not.toHaveBeenCalled();
    t.stop();
    t.deliver(r('late', '/settings'));
    await flush();
    expect(t.nav).not.toHaveBeenCalled();
  });
});
