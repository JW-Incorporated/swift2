import { describe, expect, it, vi } from 'vitest';
import { setup, tick } from './bridge-host.test-kit';
import { createTapGate, tapFromResponse } from './notification-tap-gate';
import { createTapQueue } from './notification-tap-queue';

const SITE = 'https://www.longlivets.com';
const resp = (identifier: unknown, deepLink: unknown, date?: unknown) => ({
  notification: { date, request: { identifier, content: { data: { deepLink } } } },
});

function readyHost() {
  const s = setup();
  s.makeReady();
  return s;
}
type Kit = ReturnType<typeof setup>;
const navigates = (sent: Kit['sent']) => sent.filter((e) => e.kind === 'evt' && e.type === 'navigate');
const ackNavigate = (s: Kit, n = 0) =>
  s.host.receive({ v: 1, id: `ack${n}`, kind: 'evt', type: 'ack', payload: { seq: navigates(s.sent)[n].seq }, ts: 1 });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('tapFromResponse', () => {
  it('uses request.identifier as the id and reads data.deepLink', () => {
    expect(tapFromResponse(resp('abc', '/settings'))).toEqual({ id: 'abc', deepLink: '/settings' });
  });
  it('identifier-less: stable fallback key from date + link; no date = malformed, rejected', () => {
    expect(tapFromResponse(resp(undefined, '/settings', 12))).toEqual({ id: 'anon:12|/settings', deepLink: '/settings' });
    expect(tapFromResponse(resp('', '/settings', 12))?.id).toBe('anon:12|/settings');
    expect(tapFromResponse(resp(undefined, '/settings'))).toBeNull();
    expect(tapFromResponse(null)).toBeNull();
  });
  it('a payload without deepLink yields deepLink null', () => {
    expect(tapFromResponse({ notification: { request: { identifier: 'x', content: {} } } })?.deepLink).toBeNull();
  });
});

describe('tap gate', () => {
  it('queues while the host is not bound, then delivers on bind and completes on ack', async () => {
    const gate = createTapGate({ siteUrl: SITE });
    expect(gate.enqueue({ id: 'a', deepLink: '/settings' })).toBe('queued');
    const s = readyHost();
    gate.bindHost(s.host);
    await tick();
    expect(navigates(s.sent)[0].payload).toEqual({ path: '/settings', source: 'notification' });
    expect(gate.size()).toBe(1);
    ackNavigate(s);
    await tick();
    expect(gate.size()).toBe(0);
  });

  it('duplicate (same id) navigates once', async () => {
    const gate = createTapGate({ siteUrl: SITE });
    const nav = vi.fn();
    gate.setNativeNavigator(nav);
    expect(gate.enqueue({ id: 'same', deepLink: '/settings' })).toBe('queued');
    await tick();
    expect(gate.enqueue({ id: 'same', deepLink: '/settings' })).toBe('duplicate');
    await tick();
    expect(nav).toHaveBeenCalledTimes(1);
  });

  it('native mode (fallback/quarantine) navigates natively with an absolute URL', async () => {
    const gate = createTapGate({ siteUrl: SITE });
    const nav = vi.fn();
    gate.setNativeNavigator(nav);
    gate.enqueue({ id: 'n', deepLink: '/?item=abc' });
    await tick();
    expect(nav).toHaveBeenCalledWith(`${SITE}/?item=abc`);
    expect(gate.size()).toBe(0);
  });

  it('taps held for the DOM flush natively when the host falls back', async () => {
    const gate = createTapGate({ siteUrl: SITE });
    gate.enqueue({ id: 'h', deepLink: '/settings' });
    const nav = vi.fn();
    gate.setNativeNavigator(nav);
    await tick();
    expect(nav).toHaveBeenCalledWith(`${SITE}/settings`);
  });

  it('native mode wins over a bound host', async () => {
    const gate = createTapGate({ siteUrl: SITE });
    const s = readyHost();
    const nav = vi.fn();
    gate.setNativeNavigator(nav);
    gate.bindHost(s.host);
    gate.enqueue({ id: 'u', deepLink: '/settings' });
    await tick();
    expect(nav).toHaveBeenCalledTimes(1);
    expect(navigates(s.sent)).toHaveLength(0);
  });

  describe('canonical links in native mode', () => {
    it('forwards a canonical link the queue does not serve (e.g. /inbox), never the raw string', async () => {
      const gate = createTapGate({ siteUrl: SITE, queue: createTapQueue() });
      const nav = vi.fn();
      gate.setNativeNavigator(nav);
      expect(gate.enqueue({ id: 'm', deepLink: 'https://longlivets.com/inbox?x=1' })).toBe('dropped');
      gate.enqueue({ id: 'm', deepLink: '/inbox' });
      expect(nav).toHaveBeenCalledTimes(1);
      expect(nav).toHaveBeenCalledWith(`${SITE}/inbox?x=1`);
    });
    it.each(['https://evil.example/', 'javascript:alert(1)', '//evil.example/x', 'https://longlivets.com@evil.example/', '/a/../b\\c', 'myapp://x'])(
      'hostile link %s opens home, never raw',
      async (link) => {
        const gate = createTapGate({ siteUrl: SITE });
        const nav = vi.fn();
        gate.setNativeNavigator(nav);
        gate.enqueue({ id: `h-${link}`, deepLink: link });
        expect(nav).toHaveBeenCalledTimes(1);
        expect(nav).toHaveBeenCalledWith(`${SITE}/`);
      },
    );
    it('a payload with no link opens home in native mode; an unmappable link is not forwarded while the DOM owns taps', () => {
      const gate = createTapGate({ siteUrl: SITE });
      expect(gate.enqueue({ id: 'x', deepLink: 'https://evil.example/' })).toBe('dropped');
      const nav = vi.fn();
      gate.setNativeNavigator(nav);
      gate.enqueue({ id: 'nolink', deepLink: null });
      expect(nav).toHaveBeenCalledWith(`${SITE}/`);
    });
  });

  describe('ack timeout and retry', () => {
    it('resume after the ack timeout re-awaits the SAME event (no duplicate emit) and completes on the late ack', async () => {
      const gate = createTapGate({ siteUrl: SITE, queue: createTapQueue({ ackTimeoutMs: 30 }), retryMs: 1e9 });
      const s = readyHost();
      gate.bindHost(s.host);
      gate.enqueue({ id: 'bg', deepLink: '/settings' });
      await tick();
      await sleep(80);
      expect(gate.size()).toBe(1);
      ackNavigate(s);
      gate.resume();
      await sleep(10);
      expect(gate.size()).toBe(0);
      expect(navigates(s.sent)).toHaveLength(1);
    });

    it('retries on its own after a timeout (no resume needed)', async () => {
      const gate = createTapGate({ siteUrl: SITE, queue: createTapQueue({ ackTimeoutMs: 20 }), retryMs: 10 });
      const s = readyHost();
      gate.bindHost(s.host);
      gate.enqueue({ id: 'r', deepLink: '/settings' });
      await sleep(40);
      ackNavigate(s);
      await sleep(80);
      expect(gate.size()).toBe(0);
      expect(navigates(s.sent)).toHaveLength(1);
    });
  });

  describe('epoch-safe lifecycle', () => {
    it('a stale cleanup from an older epoch does not unbind the newer host', async () => {
      const gate = createTapGate({ siteUrl: SITE });
      const a = readyHost();
      const b = readyHost();
      const unbindA = gate.bindHost(a.host);
      gate.bindHost(b.host);
      unbindA();
      gate.enqueue({ id: 'e', deepLink: '/settings' });
      await tick();
      expect(navigates(b.sent)).toHaveLength(1);
      expect(navigates(a.sent)).toHaveLength(0);
    });

    it('the current cleanup unbinds (taps hold again)', async () => {
      const gate = createTapGate({ siteUrl: SITE });
      const a = readyHost();
      const unbind = gate.bindHost(a.host);
      unbind();
      gate.enqueue({ id: 'e', deepLink: '/settings' });
      await tick();
      expect(navigates(a.sent)).toHaveLength(0);
      expect(gate.size()).toBe(1);
    });

    it('rebinding the same live host does not re-emit while the event is still in the outbox', async () => {
      const gate = createTapGate({ siteUrl: SITE });
      const a = readyHost();
      const unbind = gate.bindHost(a.host);
      gate.enqueue({ id: 'e', deepLink: '/settings' });
      await tick();
      unbind();
      gate.bindHost(a.host);
      await tick();
      expect(navigates(a.sent)).toHaveLength(1);
      ackNavigate(a);
      await tick();
      expect(gate.size()).toBe(0);
    });
  });
});
