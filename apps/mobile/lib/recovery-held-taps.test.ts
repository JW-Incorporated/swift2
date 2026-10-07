import { describe, expect, it } from 'vitest';
import { setup, tick } from './bridge-host.test-kit';
import { createTapGate } from './notification-tap-gate';
import { createTapQueue, TAP_MAX_AGE_MS, TAP_TTL_MS } from './notification-tap-queue';
import { startTapIngest } from './notification-tap-ingest';
import { startDeepLinkIntake } from './use-deep-links';

const SITE = 'https://x.test';
const resp = (id: string) => ({ notification: { date: 1, request: { identifier: id, content: { data: { deepLink: '/?item=abc' } } } } });
const navigates = (sent: ReturnType<typeof setup>['sent']) => sent.filter((e) => e.kind === 'evt' && e.type === 'navigate');
const ack = (s: ReturnType<typeof setup>, n = 0) =>
  s.host.receive({ v: 1, id: `ack${n}`, kind: 'evt', type: 'ack', payload: { seq: navigates(s.sent)[n].seq }, ts: 1 });
const flush = () => new Promise((r) => setTimeout(r, 0));
const recoveryGate = (queue?: ReturnType<typeof createTapQueue>) => {
  const gate = createTapGate({ siteUrl: SITE, queue });
  gate.setNativeNavigator(null);
  return gate;
};

describe('Recovery holds queued taps (#5102)', () => {
  it('a cold notification tap stays queued', async () => {
    const gate = recoveryGate();
    startTapIngest(gate, { getLast: async () => resp('cold') as never, clearLast: async () => {}, listen: () => () => {} });
    await flush();
    expect(gate.size()).toBe(1);
  });

  it('a live notification tap stays queued', async () => {
    const gate = recoveryGate();
    let live: (r: unknown) => void = () => {};
    startTapIngest(gate, { getLast: async () => null, clearLast: async () => {}, listen: (cb) => ((live = cb as never), () => {}) });
    await flush();
    live(resp('live'));
    await flush();
    expect(gate.size()).toBe(1);
  });

  it('a deep link stays queued', async () => {
    const gate = recoveryGate();
    startDeepLinkIntake(gate, { getInitialURL: async () => 'longlive://?item=abc', listen: () => () => {} });
    await flush();
    expect(gate.size()).toBe(1);
  });

  it('after Retry the DOM host binds: exactly one navigate, none left after the ack, no re-emit for the same id', async () => {
    const gate = recoveryGate();
    expect(gate.enqueue({ id: 'a', deepLink: '/?item=abc' })).toBe('queued');
    const s = setup();
    s.makeReady();
    const off = gate.bindHost(s.host);
    await tick();
    expect(navigates(s.sent)).toHaveLength(1);
    ack(s);
    await tick();
    expect(gate.size()).toBe(0);
    off();
    expect(gate.enqueue({ id: 'a', deepLink: '/?item=abc' })).toBe('duplicate');
    const s2 = setup();
    s2.makeReady();
    gate.bindHost(s2.host);
    await tick();
    expect(navigates(s2.sent)).toHaveLength(0);
  });

  it('a tap that waited past the TTL with no host is still delivered when Retry lands', async () => {
    let t = 0;
    const gate = recoveryGate(createTapQueue({ now: () => t }));
    gate.enqueue({ id: 'waited', deepLink: '/?item=abc' });
    t += TAP_TTL_MS + 1;
    const s = setup();
    s.makeReady();
    gate.bindHost(s.host);
    await tick();
    expect(navigates(s.sent)).toHaveLength(1);
  });

  it('a tap older than the absolute cap when Retry lands is never delivered', async () => {
    let t = 0;
    const gate = recoveryGate(createTapQueue({ now: () => t }));
    gate.enqueue({ id: 'old', deepLink: '/?item=abc' });
    t += TAP_MAX_AGE_MS + 1;
    const s = setup();
    s.makeReady();
    gate.bindHost(s.host);
    await tick();
    expect(navigates(s.sent)).toHaveLength(0);
    expect(gate.size()).toBe(0);
  });
});
