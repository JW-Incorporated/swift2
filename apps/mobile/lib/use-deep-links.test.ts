import { describe, expect, it } from 'vitest';
import { createTapGate } from './notification-tap-gate';
import { createTapTarget } from './tap-bind-epoch';
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
  const stop = startDeepLinkIntake(gate, ports);
  return { opened, emit: (u: string) => emit(u), stop, off: () => off, gate };
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

  it('pairs the cold URL with the first url event at any delay; later taps navigate again', async () => {
    const s = setup(`${SITE}/support`);
    await flush();
    await new Promise((r) => setTimeout(r, 60));
    s.emit(`${SITE}/support`);
    await flush();
    expect(s.opened).toHaveLength(1);
    s.emit(`${SITE}/support`);
    await flush();
    expect(s.opened).toHaveLength(2);
  });

  it('pairs when the url event arrives before getInitialURL resolves', async () => {
    let resolveInitial: (u: string) => void = () => {};
    let emit: (u: string) => void = () => {};
    const gate = createTapGate({ siteUrl: SITE });
    const opened: string[] = [];
    gate.setNativeNavigator((u) => opened.push(u));
    startDeepLinkIntake(gate, {
      getInitialURL: () => new Promise<string>((r) => (resolveInitial = r)),
      listen: (cb) => ((emit = cb), () => {}),
    });
    emit(`${SITE}/terms`);
    await flush();
    resolveInitial(`${SITE}/terms`);
    await flush();
    expect(opened).toEqual([`${SITE}/terms`]);
  });

  it('distinct long URLs sharing a prefix never collide on id', async () => {
    const s = setup();
    const base = `${SITE}/vault/${'a'.repeat(400)}`;
    s.emit(`${base}1`);
    s.emit(`${base}2`);
    await flush();
    expect(s.opened).toHaveLength(2);
  });

  it('maps longlive:// links (both authority forms) to the same path, cold and live', async () => {
    const s = setup('longlive://settings');
    await flush();
    s.emit('longlive:///vault/x?y=1');
    await flush();
    s.emit('longlive://vault/z');
    await flush();
    expect(s.opened).toEqual([`${SITE}/settings`, `${SITE}/vault/x?y=1`, `${SITE}/vault/z`]);
  });

  it.each([
    'https://evil.example/settings',
    'http://www.longlivets.com/settings',
    'https://www.longlivets.com.evil.example/',
    'https://user:pw@www.longlivets.com/',
    'https://www.longlivets.com:8443/',
    'longlive://../settings',
    'longlive://vault/%2e%2e/x',
    'longlive://vault/../x',
    'longlive:////evil.example/x',
    'longlive://vault\\x',
    `longlive://vault/${'a'.repeat(3000)}`,
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

  it('source deeplink reaches the bridge event through the real gate and tap target', async () => {
    const emitted: { path: unknown; source: unknown }[] = [];
    const ackers: ((a: boolean) => void)[] = [];
    const target = createTapTarget({
      host: {
        isReady: () => true,
        emit: (_t, p) => (emitted.push({ path: p.path, source: p.source }), { epoch: 1, seq: emitted.length }),
        onAcked: (_r, cb) => (ackers.push(cb), () => {}),
      },
      isReaderPath: () => true,
      openElsewhere: async () => true,
    });
    const gate = createTapGate({ siteUrl: SITE });
    gate.bindHost(target as never);
    const stop = startDeepLinkIntake(gate, { getInitialURL: async () => `${SITE}/terms`, listen: () => () => {} });
    await flush();
    expect(emitted).toEqual([{ path: '/terms', source: 'deeplink' }]);
    stop();
  });
});
