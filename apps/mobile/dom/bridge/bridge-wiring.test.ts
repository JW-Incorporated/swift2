import { describe, expect, it, vi } from 'vitest';
import { createAppHandlers, createUnwiredAppDeps } from '../../lib/app-handlers';
import { createBridgeHost, type BridgeHost } from '../../lib/bridge-host';
import { createBridgeLink, createDomHostHandlers, sameInbox } from '../../lib/dom-host-handlers';
import { createExpoBridge } from './transport-expo';

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) };

// The SharedUiHost wiring, minus React: link + host + handlers.bridge, with the real DOM client.
function wire() {
  const onSignal = vi.fn();
  const protocol = vi.fn();
  const inboxes: unknown[][] = [];
  const ref: { host?: BridgeHost } = {};
  const link = createBridgeLink(() => inboxes.push(ref.host?.inbox() ?? []));
  const handlers = createDomHostHandlers({
    onSignal,
    watch: { ready: vi.fn(), error: vi.fn(), crashed: vi.fn() },
    bridge: link.bridge,
  });
  const host = createBridgeHost({
    handlers: createAppHandlers(createUnwiredAppDeps(onSignal)),
    send: link.send,
    now: Date.now,
    scheduler,
    onProtocolFatal: (reason) => {
      onSignal('bridge-protocol-fatal', reason);
      link.dispose();
      protocol();
    },
    onSignal,
  });
  ref.host = host;
  link.attach(host);
  return { host, link, handlers, onSignal, protocol, inboxes };
}

describe('bridge wiring (SharedUiHost <-> DOM client)', () => {
  it('forwards ready: the DOM gets readyAck back and the host is ready', async () => {
    const w = wire();
    const bridge = createExpoBridge((env) => w.handlers.bridge(env));
    bridge.mount();
    await vi.waitFor(() => expect(w.host.isReady()).toBe(true));
    expect(w.protocol).not.toHaveBeenCalled();
    bridge.client.dispose();
  });

  it('drains the inbox once, in order, and the ack trims the host outbox', async () => {
    const w = wire();
    const bridge = createExpoBridge((env) => w.handlers.bridge(env));
    const seen: string[] = [];
    bridge.client.on('contentVersion', (p) => void seen.push(p.token));
    bridge.mount();
    await vi.waitFor(() => expect(w.host.isReady()).toBe(true));
    w.host.emit('contentVersion', { token: 'a' });
    w.host.emit('contentVersion', { token: 'b' });
    const inbox = w.host.inbox();
    expect(inbox).toHaveLength(2);
    bridge.client.consumeInbox(inbox);
    bridge.client.consumeInbox(inbox);
    expect(seen).toEqual(['a', 'b']);
    await vi.waitFor(() => expect(w.host.inbox()).toHaveLength(0));
    bridge.client.dispose();
  });

  it('answers a DOM command with its res through the awaiting bridge action', async () => {
    const w = wire();
    const bridge = createExpoBridge((env) => w.handlers.bridge(env));
    bridge.mount();
    await vi.waitFor(() => expect(w.host.isReady()).toBe(true));
    const r = await bridge.client.call('haptic', { kind: 'light' });
    expect(r.ok).toBe(true);
    const nav = await bridge.client.call('navigate', { path: '/songs' as never });
    expect(nav.ok).toBe(false);
    expect(w.protocol).not.toHaveBeenCalled();
    bridge.client.dispose();
  });

  it('a protocol-fatal ready (too new) reaches the watchdog, not the DOM error path', async () => {
    const w = wire();
    await w.handlers.bridge({ v: 1, id: 'r1', kind: 'evt', type: 'ready', payload: { v: 99 }, ts: 1 }).catch(() => undefined);
    expect(w.protocol).toHaveBeenCalledTimes(1);
    expect(w.onSignal).toHaveBeenCalledWith('bridge-protocol-fatal', expect.stringContaining('bridge-version'));
  });

  it('dispose releases awaiting actions and a pre-attach bridge call is a no-op', async () => {
    const link = createBridgeLink(() => undefined);
    const pending = link.bridge({ kind: 'evt', type: 'ready', id: 'x' });
    link.dispose();
    await expect(pending).resolves.toBeUndefined();
    await expect(link.bridge({ kind: 'evt', type: 'ack', id: 'y' })).resolves.toBeUndefined();
  });
});

describe('sameInbox', () => {
  it('compares length and first/last seq', () => {
    expect(sameInbox([], [])).toBe(true);
    expect(sameInbox([{ seq: 1 }, { seq: 2 }], [{ seq: 1 }, { seq: 2 }])).toBe(true);
    expect(sameInbox([{ seq: 1 }], [{ seq: 2 }])).toBe(false);
    expect(sameInbox([{ seq: 1 }], [{ seq: 1 }, { seq: 2 }])).toBe(false);
  });
});
