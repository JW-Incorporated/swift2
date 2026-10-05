import { describe, expect, it } from 'vitest';
import { createTapGate } from './notification-tap-gate';
import { startDeepLinkIntake, type DeepLinkPorts } from './use-deep-links';

const SITE = 'https://www.longlivets.com';

function setup(initial: string | null = null) {
  let emit: (url: string) => void = () => {};
  let off = 0;
  const ports: DeepLinkPorts = {
    getInitialURL: async () => initial,
    listen: (cb) => {
      emit = cb;
      return () => void off++;
    },
  };
  const opened: string[] = [];
  const gate = createTapGate({ siteUrl: SITE });
  gate.setNativeNavigator((u) => opened.push(u));
  let t = 1000;
  const stop = startDeepLinkIntake(gate, ports, () => t);
  return { opened, emit: (u: string) => emit(u), tick: (ms: number) => (t += ms), stop, off: () => off, gate };
}
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('startDeepLinkIntake', () => {
  it('routes a cold initial URL natively', async () => {
    const s = setup(`${SITE}/settings`);
    await flush();
    expect(s.opened).toEqual([`${SITE}/settings`]);
  });

  it('routes a live url event (apex and www hosts)', async () => {
    const s = setup();
    s.emit('https://longlivets.com/vault/x?y=1');
    await flush();
    expect(s.opened).toEqual([`${SITE}/vault/x?y=1`]);
  });

  it('dedupes the initial URL and its first url event, but not a later re-tap', async () => {
    const s = setup(`${SITE}/support`);
    await flush();
    s.tick(500);
    s.emit(`${SITE}/support`);
    await flush();
    expect(s.opened).toHaveLength(1);
    s.tick(10_000);
    s.emit(`${SITE}/support`);
    await flush();
    expect(s.opened).toHaveLength(2);
  });

  it('maps longlive:// links to the same path, cold and live', async () => {
    const s = setup('longlive://settings');
    await flush();
    s.emit('longlive://vault/x?y=1');
    await flush();
    expect(s.opened).toEqual([`${SITE}/settings`, `${SITE}/vault/x?y=1`]);
  });

  it.each([
    'https://evil.example/settings',
    'http://www.longlivets.com/settings',
    'https://www.longlivets.com.evil.example/',
    'https://user:pw@www.longlivets.com/',
    'https://www.longlivets.com:8443/',
    'longlive://../settings',
    'longlive:///evil.example/x',
    'ftp://www.longlivets.com/settings',
    'javascript:alert(1)',
    `https://www.longlivets.com/${'a'.repeat(3000)}`,
  ])('ignores hostile url %s', async (url) => {
    const s = setup(url);
    s.emit(url);
    await flush();
    expect(s.opened).toEqual([]);
  });

  it('stop unsubscribes and ignores later events', async () => {
    const s = setup();
    s.stop();
    s.emit(`${SITE}/privacy`);
    await flush();
    expect(s.off()).toBe(1);
    expect(s.opened).toEqual([]);
  });

  it('tags deeplink source and delivers it over a bound host', async () => {
    const emitted: unknown[] = [];
    const ack: { cb: ((a: boolean) => void) | null } = { cb: null };
    const gate = createTapGate({ siteUrl: SITE });
    gate.bindHost({
      emit: (_t, payload) => (emitted.push(payload), { epoch: 1, seq: 1 }),
      onAcked: (_r, cb) => ((ack.cb = cb), () => {}),
    });
    const stop = startDeepLinkIntake(gate, { getInitialURL: async () => `${SITE}/terms`, listen: () => () => {} });
    await flush();
    expect(emitted).toEqual([{ path: '/terms', source: 'deeplink' }]);
    ack.cb?.(true);
    stop();
  });
});
