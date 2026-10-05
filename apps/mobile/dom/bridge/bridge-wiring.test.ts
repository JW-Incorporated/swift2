import { describe, expect, it, vi } from 'vitest';
import { DOM_COMMAND_TYPES } from '@swift2/ui';
import { createUnwiredHandlers } from '../../lib/app-handlers';
import { createBridgeHost, type BridgeHost } from '../../lib/bridge-host';
import { createBridgeLink, createDomHostHandlers, sameInbox } from '../../lib/dom-host-handlers';
import { createExpoBridge } from './transport-expo';

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) };
const ctx = { signal: new AbortController().signal };
const ready = (id = 'r1', v = 1) => ({ v: 1, id, kind: 'evt', type: 'ready', payload: { v }, ts: 1 });
const cmd = (id: string, type: string, payload: unknown) => ({ v: 1, id, kind: 'cmd', type, payload, ts: 1 });
const unwiredTypes = DOM_COMMAND_TYPES.filter((t) => t !== 'cancel');

// One host epoch, exactly as SharedUiHost builds it (link + host + handlers), minus React.
function epoch() {
  const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(), protocol: vi.fn() };
  const onSignal = vi.fn();
  const ref: { host?: BridgeHost } = {};
  const link = createBridgeLink(() => void ref.host?.inbox());
  const handlers = createDomHostHandlers({ onSignal, watch, bridge: link.bridge, bridgeClosed: link.isClosed, token: 'tok' });
  const host = createBridgeHost({
    handlers: createUnwiredHandlers(onSignal),
    send: link.send,
    now: Date.now,
    scheduler,
    onProtocolFatal: (reason) => {
      onSignal('bridge-protocol-fatal', reason);
      link.dispose();
      watch.protocol();
    },
    onSignal,
  });
  ref.host = host;
  link.attach(host);
  const dispose = () => {
    host.dispose();
    link.dispose();
  };
  return { host, link, handlers, onSignal, watch, dispose };
}

describe('H0 unwired handler map', () => {
  it('covers exactly the DOM commands except cancel', () => {
    expect(Object.keys(createUnwiredHandlers(vi.fn())).sort()).toEqual([...unwiredTypes].sort());
  });

  it.each(unwiredTypes)('%s answers failed, never success', async (type) => {
    const log = vi.fn();
    const h = createUnwiredHandlers(log) as unknown as Record<string, (p: unknown, c: typeof ctx) => Promise<unknown>>;
    expect(await h[type]!({}, ctx)).toMatchObject({ ok: false, error: { code: 'failed' } });
    expect(log).toHaveBeenCalledWith('bridge-unwired', type);
  });

  it('through the host: haptic fails and nothing reaches the watchdog', async () => {
    const e = epoch();
    const bridge = createExpoBridge((env, t) => e.handlers.bridge(env, t), undefined, undefined, () => e.handlers.bridgeHello());
    bridge.mount();
    await vi.waitFor(() => expect(e.host.isReady()).toBe(true));
    expect(await bridge.client.call('haptic', { kind: 'light' })).toMatchObject({ ok: false, error: { code: 'failed' } });
    expect(await bridge.client.call('navigate', { path: '/songs' as never })).toMatchObject({ ok: false });
    expect(e.watch.protocol).not.toHaveBeenCalled();
    bridge.client.dispose();
    e.dispose();
  });
});

describe('bridge wiring (SharedUiHost <-> DOM client)', () => {
  it('forwards ready: the DOM gets readyAck back and the host is ready', async () => {
    const e = epoch();
    const bridge = createExpoBridge((env, t) => e.handlers.bridge(env, t), undefined, undefined, () => e.handlers.bridgeHello());
    bridge.mount();
    await vi.waitFor(() => expect(e.host.isReady()).toBe(true));
    expect(e.watch.protocol).not.toHaveBeenCalled();
    bridge.client.dispose();
    e.dispose();
  });

  it('drains the inbox once, in order, and the ack trims the host outbox', async () => {
    const e = epoch();
    const bridge = createExpoBridge((env, t) => e.handlers.bridge(env, t), undefined, undefined, () => e.handlers.bridgeHello());
    const seen: string[] = [];
    bridge.client.on('contentVersion', (p) => void seen.push(p.token));
    bridge.mount();
    await vi.waitFor(() => expect(e.host.isReady()).toBe(true));
    e.host.emit('contentVersion', { token: 'a' });
    e.host.emit('contentVersion', { token: 'b' });
    const inbox = e.host.inbox();
    expect(inbox).toHaveLength(2);
    bridge.client.consumeInbox(inbox);
    bridge.client.consumeInbox(inbox);
    expect(seen).toEqual(['a', 'b']);
    await vi.waitFor(() => expect(e.host.inbox()).toHaveLength(0));
    bridge.client.dispose();
    e.dispose();
  });

  it('a protocol-fatal ready (too new) strikes the watchdog once and later retries reject (no hang)', async () => {
    const e = epoch();
    const first = e.handlers.bridge(ready('r1', 99), 'tok');
    first.catch(() => undefined);
    expect(e.watch.protocol).toHaveBeenCalledTimes(1);
    await expect(first).rejects.toThrow('bridge closed');
    await expect(e.handlers.bridge(ready('r2'), 'tok')).rejects.toThrow('bridge closed');
    await expect(e.handlers.bridge(cmd('5', 'haptic', { kind: 'light' }), 'tok')).rejects.toThrow('bridge closed');
    expect(e.watch.protocol).toHaveBeenCalledTimes(1);
  });
});

describe('DOM client protocol fatal', () => {
  it.each([
    ['before first paint', false],
    ['after first paint', true],
  ])('strikes watch.protocol %s (reportError is ignored once ready)', async (_n, afterPaint) => {
    const e = epoch();
    if (afterPaint) await e.handlers.onReady('tok');
    await e.handlers.reportProtocolFatal('ready-failed', 'tok');
    expect(e.watch.protocol).toHaveBeenCalledTimes(1);
    expect(e.watch.error).not.toHaveBeenCalled();
    e.dispose();
  });

  it('is ignored once the host epoch is closed (stale or already struck)', async () => {
    const e = epoch();
    e.dispose();
    await e.handlers.reportProtocolFatal('id-space-exhausted', 'tok');
    expect(e.watch.protocol).not.toHaveBeenCalled();
  });
});

describe('host epochs and link lifetime', () => {
  it('a recreated host never serves the old client: its calls reject, the new client re-handshakes', async () => {
    const e1 = epoch();
    const oldClient = createExpoBridge((env, t) => e1.handlers.bridge(env, t), undefined, undefined, () => e1.handlers.bridgeHello());
    oldClient.mount();
    await vi.waitFor(() => expect(e1.host.isReady()).toBe(true));
    e1.dispose();
    const e2 = epoch();
    expect(await oldClient.client.call('haptic', { kind: 'light' })).toMatchObject({ ok: false });
    expect(e2.host.isReady()).toBe(false);
    const newClient = createExpoBridge((env, t) => e2.handlers.bridge(env, t), undefined, undefined, () => e2.handlers.bridgeHello());
    newClient.mount();
    await vi.waitFor(() => expect(e2.host.isReady()).toBe(true));
    expect(await newClient.client.call('haptic', { kind: 'light' })).toMatchObject({ ok: false, error: { code: 'failed' } });
    expect(e2.watch.protocol).not.toHaveBeenCalled();
    oldClient.client.dispose();
    newClient.client.dispose();
    e2.dispose();
  });

  it('calls after unmount reject at once, and a pending call rejects on dispose', async () => {
    const link = createBridgeLink(() => undefined);
    link.attach({ receive: () => undefined, inbox: () => [] });
    const pending = link.bridge(cmd('7', 'haptic', { kind: 'light' }));
    pending.catch(() => undefined);
    link.dispose();
    await expect(pending).rejects.toThrow('bridge closed');
    await expect(link.bridge(ready('r9'))).rejects.toThrow('bridge closed');
  });

  it('a duplicate command id rejects the older call instead of overwriting it', async () => {
    const link = createBridgeLink(() => undefined);
    link.attach({ receive: () => undefined, inbox: () => [] });
    const older = link.bridge(cmd('9', 'haptic', {}));
    older.catch(() => undefined);
    const newer = link.bridge(cmd('9', 'haptic', {}));
    await expect(older).rejects.toThrow('superseded');
    link.send({ kind: 'res', id: '9', type: 'haptic' });
    await expect(newer).resolves.toMatchObject({ id: '9' });
  });

  it('a repeated ready (retry or webview reload) releases the older ready and every pending command', async () => {
    const link = createBridgeLink(() => undefined);
    link.attach({ receive: () => undefined, inbox: () => [] });
    const r1 = link.bridge(ready('a'));
    const c1 = link.bridge(cmd('3', 'haptic', {}));
    const r2 = link.bridge(ready('b'));
    await expect(r1).resolves.toBeUndefined();
    await expect(c1).resolves.toBeUndefined();
    link.send({ kind: 'evt', id: 'x', type: 'readyAck' });
    await expect(r2).resolves.toMatchObject({ type: 'readyAck' });
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
