import { describe, expect, it, vi } from 'vitest';
import { setup, tick } from './bridge-host.test-kit';
import { createTapGate, type RawResponse } from './notification-tap-gate';
import { startTapIngest } from './notification-tap-ingest';

const resp = (id: string, deepLink: string): RawResponse => ({
  notification: { date: 1, request: { identifier: id, content: { data: { deepLink } } } },
});
type Kit = ReturnType<typeof setup>;
const navigates = (s: Kit) => s.sent.filter((e) => e.kind === 'evt' && e.type === 'navigate');
const ack = (s: Kit, n = 0) =>
  s.host.receive({ v: 1, id: `ack${n}`, kind: 'evt', type: 'ack', payload: { seq: navigates(s)[n].seq }, ts: 1 });
const ready = () => {
  const s = setup();
  s.makeReady();
  return s;
};
const rig = (last: () => RawResponse | null) => {
  const gate = createTapGate({ siteUrl: 'https://www.longlivets.com' });
  let live: (r: RawResponse | null) => void = () => {};
  const clearLast = vi.fn().mockResolvedValue(undefined);
  const stop = startTapIngest(gate, {
    getLast: async () => last(),
    clearLast,
    listen: (cb) => ((live = cb), () => {}),
  });
  return { gate, clearLast, stop, live: (r: RawResponse) => live(r) };
};

describe('cold response is cleared only once its tap settles', () => {
  it('stays uncleared until the matching ack', async () => {
    const t = rig(() => resp('cold', '/?item=abc'));
    const s = ready();
    t.gate.bindHost(s.host);
    await tick();
    expect(navigates(s)).toHaveLength(1);
    expect(t.clearLast).not.toHaveBeenCalled();
    ack(s);
    await tick();
    expect(t.clearLast).toHaveBeenCalledTimes(1);
  });

  it('is cleared when its tap is dropped (unmappable link)', async () => {
    const t = rig(() => resp('bad', '/api/devices/register'));
    await tick();
    expect(t.clearLast).toHaveBeenCalledTimes(1);
  });

  it('a malformed response (no id, no date) is cleared at once', async () => {
    const t = rig(() => ({ notification: { request: { identifier: undefined, content: {} } } }));
    await tick();
    expect(t.clearLast).toHaveBeenCalledTimes(1);
  });

  it('a cold duplicate of an already-delivered id is cleared at once', async () => {
    const stored = resp('same', '/?item=abc');
    let cold: RawResponse | null = null;
    const t = rig(() => cold);
    const s = ready();
    t.gate.bindHost(s.host);
    t.live(stored);
    await tick();
    ack(s);
    await tick();
    expect(t.clearLast).not.toHaveBeenCalled();
    cold = stored;
    const t2 = startTapIngest(t.gate, { getLast: async () => stored, clearLast: t.clearLast, listen: () => () => {} });
    await tick();
    expect(t.clearLast).toHaveBeenCalledTimes(1);
    t2();
  });

  it('a cold duplicate of a still-held id is not cleared until that tap settles', async () => {
    const stored = resp('held', '/?item=abc');
    const t = rig(() => null);
    t.live(stored);
    await tick();
    const clearLast = vi.fn().mockResolvedValue(undefined);
    startTapIngest(t.gate, { getLast: async () => stored, clearLast, listen: () => () => {} });
    await tick();
    expect(clearLast).not.toHaveBeenCalled();
    const s = ready();
    t.gate.bindHost(s.host);
    await tick();
    ack(s);
    await tick();
    expect(clearLast).toHaveBeenCalledTimes(1);
  });

  it('a live tap never clears', async () => {
    const t = rig(() => null);
    const s = ready();
    t.gate.bindHost(s.host);
    t.live(resp('live', '/?item=abc'));
    await tick();
    ack(s);
    await tick();
    expect(t.gate.size()).toBe(0);
    expect(t.clearLast).not.toHaveBeenCalled();
  });

  it('a reload before delivery re-ingests the still-stored response and delivers it exactly once', async () => {
    const stored = resp('cold', '/?item=abc');
    const first = rig(() => stored);
    await tick();
    expect(first.clearLast).not.toHaveBeenCalled();
    first.stop();
    const second = rig(() => stored);
    const s = ready();
    second.gate.bindHost(s.host);
    await tick();
    expect(navigates(s)).toHaveLength(1);
    ack(s);
    await tick();
    expect(second.gate.size()).toBe(0);
    expect(second.clearLast).toHaveBeenCalledTimes(1);
    expect(navigates(s)).toHaveLength(1);
  });
});
