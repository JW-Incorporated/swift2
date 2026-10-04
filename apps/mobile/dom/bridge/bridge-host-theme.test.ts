import { describe, expect, it, vi } from 'vitest';
import type { Envelope } from '@swift2/ui';
import { createExpoBridge } from './transport-expo';
import { createAppHandlersFor } from '../../lib/app-handlers';
import { createBridgeHost, type BridgeHost } from '../../lib/bridge-host';
import { createBridgeLink, createDomHostHandlers } from '../../lib/dom-host-handlers';

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) };
const A = { statusBarStyle: 'light', background: '#0c0c0c' } as const;
const B = { statusBarStyle: 'dark', background: '#ffffff' } as const;

/** Real DOM client <-> real host. `gate` holds the DOM's `ready` back to model a delayed handshake. */
function wire(onTheme: (t: unknown) => void, onSignal = vi.fn()) {
  const ref: { host?: BridgeHost; dom?: ReturnType<typeof createExpoBridge> } = {};
  const link = createBridgeLink(() => void ref.host?.inbox());
  const sent: { kind: string; type: string }[] = [];
  const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(), protocol: vi.fn() };
  const handlers = createDomHostHandlers({ onSignal: vi.fn(), watch, bridge: link.bridge, bridgeClosed: link.isClosed });
  const host = createBridgeHost({
    handlers: createAppHandlersFor(vi.fn(), {}),
    send: (e) => {
      sent.push({ kind: e.kind, type: e.type });
      link.send(e);
      ref.dom?.client.receive(e);
    },
    now: Date.now,
    scheduler,
    onProtocolFatal: () => watch.protocol(),
    onSignal,
    onTheme,
  });
  ref.host = host;
  link.attach(host);
  const held: Envelope[] = [];
  let gated = false;
  const dom = createExpoBridge((env) => {
    if (gated && env.type === 'ready') {
      held.push(env);
      return;
    }
    return handlers.bridge(env);
  });
  ref.dom = dom;
  return {
    host,
    dom,
    sent,
    gate: () => void (gated = true),
    release: () => {
      gated = false;
      for (const e of held.splice(0)) void handlers.bridge(e);
    },
  };
}

describe('theme event (fire-and-forget)', () => {
  it('delayed handshake: nothing reaches the host or signals before the ack; after it onTheme fires once with the latest value and nothing is sent back for it', async () => {
    const onTheme = vi.fn();
    const onSignal = vi.fn();
    const w = wire(onTheme, onSignal);
    w.gate();
    w.dom.mount();
    w.dom.client.sendEvent('theme', A);
    w.dom.client.sendEvent('theme', B);
    await new Promise((r) => setTimeout(r, 20));
    expect(onTheme).not.toHaveBeenCalled();
    expect(onSignal).not.toHaveBeenCalledWith('bridge-pre-ready', 'theme');
    w.release();
    await vi.waitFor(() => expect(onTheme).toHaveBeenCalledTimes(1));
    expect(onTheme).toHaveBeenCalledWith(B);
    expect(onSignal).not.toHaveBeenCalledWith('bridge-pre-ready', 'theme');
    expect(w.sent.some((e) => e.type === 'theme')).toBe(false);
    expect(w.sent.some((e) => e.kind === 'res')).toBe(false);
    w.dom.client.dispose();
    w.host.dispose();
  });

  it('post-ready sendEvent is immediate', async () => {
    const onTheme = vi.fn();
    const w = wire(onTheme);
    w.dom.mount();
    await vi.waitFor(() => expect(w.host.isReady()).toBe(true));
    await vi.waitFor(() => {
      w.dom.client.sendEvent('theme', A);
      expect(onTheme).toHaveBeenCalledWith(A);
    });
    w.dom.client.dispose();
    w.host.dispose();
  });

  it('dispose before the ack: the queued theme never reaches the host', async () => {
    const onTheme = vi.fn();
    const w = wire(onTheme);
    w.gate();
    w.dom.mount();
    w.dom.client.sendEvent('theme', A);
    w.dom.client.dispose();
    w.release();
    await new Promise((r) => setTimeout(r, 20));
    expect(onTheme).not.toHaveBeenCalled();
    w.host.dispose();
  });

  it('the host still ignores a theme that arrives before ready, with a signal', () => {
    const onTheme = vi.fn();
    const onSignal = vi.fn();
    const w = wire(onTheme, onSignal);
    w.host.receive({ v: 1, id: 'a', kind: 'evt', type: 'theme', payload: A, ts: 1 });
    expect(onTheme).not.toHaveBeenCalled();
    expect(onSignal).toHaveBeenCalledWith('bridge-pre-ready', 'theme');
    w.host.dispose();
  });

  it('rejects a bad enum, bad colour, extra key, or non-object once ready', async () => {
    const onTheme = vi.fn();
    const onSignal = vi.fn();
    const w = wire(onTheme, onSignal);
    w.dom.mount();
    await vi.waitFor(() => expect(w.host.isReady()).toBe(true));
    const bad = [{ statusBarStyle: 'auto', background: '#ffffff' }, { statusBarStyle: 'dark', background: 'red' }, { statusBarStyle: 'dark', background: '#fff' }, { ...A, extra: 1 }, 'x'];
    await vi.waitFor(() => {
      for (const payload of bad) w.dom.client.sendEvent('theme', payload as never);
      expect(onSignal.mock.calls.filter((c) => c[1] === 'theme payload').length).toBeGreaterThanOrEqual(5);
    });
    expect(onTheme).not.toHaveBeenCalled();
    w.dom.client.dispose();
    w.host.dispose();
  });
});
