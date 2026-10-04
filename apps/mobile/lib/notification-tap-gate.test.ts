import { describe, expect, it, vi } from 'vitest';
import { setup, tick } from './bridge-host.test-kit';
import { createTapGate, tapFromResponse } from './notification-tap-gate';
import { createTapQueue } from './notification-tap-queue';

const SITE = 'https://www.longlivets.com';
const resp = (identifier: unknown, deepLink: unknown) => ({
  notification: { request: { identifier, content: { data: { deepLink } } } },
});

function readyHost() {
  const s = setup();
  s.makeReady();
  return s;
}
const navigates = (sent: ReturnType<typeof setup>['sent']) => sent.filter((e) => e.kind === 'evt' && e.type === 'navigate');

describe('tapFromResponse', () => {
  it('uses request.identifier as the id and reads data.deepLink', () => {
    expect(tapFromResponse(resp('abc', '/settings'))).toEqual({ id: 'abc', deepLink: '/settings' });
  });
  it('null id path: a missing identifier yields id undefined (no dedupe)', () => {
    expect(tapFromResponse(resp(undefined, '/settings'))).toEqual({ id: undefined, deepLink: '/settings' });
    expect(tapFromResponse(null)).toBeNull();
  });
  it('a payload without deepLink yields deepLink null', () => {
    expect(tapFromResponse({ notification: { request: { identifier: 'x', content: {} } } })?.deepLink).toBeNull();
  });
});

describe('tap gate', () => {
  it('queues while the host is not ready/bound, then delivers on bind and completes on ack', async () => {
    const gate = createTapGate({ siteUrl: SITE });
    expect(gate.enqueue({ id: 'a', deepLink: '/settings' })).toBe('queued');
    const s = readyHost();
    expect(navigates(s.sent)).toHaveLength(0);
    gate.bindHost(s.host);
    await tick();
    expect(navigates(s.sent)).toHaveLength(1);
    expect(navigates(s.sent)[0].payload).toEqual({ path: '/settings', source: 'notification' });
    expect(gate.size()).toBe(1);
    s.host.receive({ v: 1, id: 'ack1', kind: 'evt', type: 'ack', payload: { seq: navigates(s.sent)[0].seq }, ts: 1 });
    await tick();
    expect(gate.size()).toBe(0);
  });

  it('duplicate (cold + listener, same identifier) navigates once', async () => {
    const gate = createTapGate({ siteUrl: SITE });
    const nav = vi.fn();
    gate.setNativeNavigator(nav);
    expect(gate.enqueue({ id: 'same', deepLink: '/settings' })).toBe('queued');
    await tick();
    expect(gate.enqueue({ id: 'same', deepLink: '/settings' })).toBe('duplicate');
    await tick();
    expect(nav).toHaveBeenCalledTimes(1);
  });

  it('a duplicate arriving while the first is held is dropped too', () => {
    const gate = createTapGate({ siteUrl: SITE });
    gate.enqueue({ id: 'same', deepLink: '/settings' });
    expect(gate.enqueue({ id: 'same', deepLink: '/settings' })).toBe('duplicate');
    expect(gate.size()).toBe(1);
  });

  it('null id is not deduplicated', async () => {
    const gate = createTapGate({ siteUrl: SITE });
    const nav = vi.fn();
    gate.setNativeNavigator(nav);
    gate.enqueue({ deepLink: '/settings' });
    await tick();
    gate.enqueue({ deepLink: '/settings' });
    await tick();
    expect(nav).toHaveBeenCalledTimes(2);
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

  it('unbindHost re-holds taps; native mode wins over a bound host', async () => {
    const gate = createTapGate({ siteUrl: SITE });
    const s = readyHost();
    gate.bindHost(s.host);
    gate.unbindHost();
    gate.enqueue({ id: 'u', deepLink: '/settings' });
    await tick();
    expect(navigates(s.sent)).toHaveLength(0);
    const nav = vi.fn();
    gate.setNativeNavigator(nav);
    gate.bindHost(s.host);
    await tick();
    expect(nav).toHaveBeenCalledTimes(1);
    expect(navigates(s.sent)).toHaveLength(0);
  });

  it('a link the queue cannot map still opens natively in native mode, once per id', async () => {
    const gate = createTapGate({ siteUrl: SITE, queue: createTapQueue() });
    const nav = vi.fn();
    gate.setNativeNavigator(nav);
    expect(gate.enqueue({ id: 'm', deepLink: '/inbox' })).toBe('dropped');
    gate.enqueue({ id: 'm', deepLink: '/inbox' });
    expect(nav).toHaveBeenCalledTimes(1);
    expect(nav).toHaveBeenCalledWith('/inbox');
  });

  it('an unmappable link is not navigated while the DOM host owns taps', () => {
    const gate = createTapGate({ siteUrl: SITE });
    expect(gate.enqueue({ id: 'x', deepLink: 'https://evil.example/' })).toBe('dropped');
  });
});
