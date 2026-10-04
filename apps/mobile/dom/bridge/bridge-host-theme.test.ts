import { describe, expect, it, vi } from 'vitest';
import { createExpoBridge } from './transport-expo';
import { createAppHandlersFor } from '../../lib/app-handlers';
import { createBridgeHost, type BridgeHost } from '../../lib/bridge-host';
import { createBridgeLink, createDomHostHandlers } from '../../lib/dom-host-handlers';

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) };

function wire(onTheme: (t: unknown) => void, onSignal = vi.fn()) {
  const ref: { host?: BridgeHost } = {};
  const link = createBridgeLink(() => void ref.host?.inbox());
  const sent: { kind: string; type: string }[] = [];
  const send = link.send;
  const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(), protocol: vi.fn() };
  const handlers = createDomHostHandlers({ onSignal: vi.fn(), watch, bridge: link.bridge, bridgeClosed: link.isClosed });
  const host = createBridgeHost({
    handlers: createAppHandlersFor(vi.fn(), {}),
    send: (e) => {
      sent.push({ kind: e.kind, type: e.type });
      return send(e);
    },
    now: Date.now,
    scheduler,
    onProtocolFatal: () => watch.protocol(),
    onSignal,
    onTheme,
  });
  ref.host = host;
  link.attach(host);
  return { host, handlers, sent };
}

describe('theme event (fire-and-forget)', () => {
  it('reaches onTheme validated, and the host never answers it', async () => {
    const onTheme = vi.fn();
    const w = wire(onTheme);
    const dom = createExpoBridge((env) => w.handlers.bridge(env));
    dom.mount();
    await vi.waitFor(() => expect(w.host.isReady()).toBe(true));
    dom.client.sendEvent('theme', { statusBarStyle: 'dark', background: '#ffffff' });
    await vi.waitFor(() => expect(onTheme).toHaveBeenCalledWith({ statusBarStyle: 'dark', background: '#ffffff' }));
    await new Promise((r) => setTimeout(r, 20));
    expect(w.sent.filter((e) => e.type === 'theme')).toEqual([]);
    expect(w.sent.some((e) => e.kind === 'res')).toBe(false);
    dom.client.dispose();
    w.host.dispose();
  });

  it('ignores a theme before ready with a signal', () => {
    const onTheme = vi.fn();
    const onSignal = vi.fn();
    const w = wire(onTheme, onSignal);
    w.host.receive({ v: 1, id: 'a', kind: 'evt', type: 'theme', payload: { statusBarStyle: 'dark', background: '#ffffff' }, ts: 1 });
    expect(onTheme).not.toHaveBeenCalled();
    expect(onSignal).toHaveBeenCalledWith('bridge-pre-ready', 'theme');
    w.host.dispose();
  });

  it('rejects a bad enum or colour once ready', async () => {
    const onTheme = vi.fn();
    const onSignal = vi.fn();
    const w = wire(onTheme, onSignal);
    const dom = createExpoBridge((env) => w.handlers.bridge(env));
    dom.mount();
    await vi.waitFor(() => expect(w.host.isReady()).toBe(true));
    const bad = [{ statusBarStyle: 'auto', background: '#ffffff' }, { statusBarStyle: 'dark', background: 'red' }, { statusBarStyle: 'dark', background: '#fff' }, 'x'];
    for (const payload of bad) dom.client.sendEvent('theme', payload as never);
    await vi.waitFor(() => expect(onSignal.mock.calls.filter((c) => c[1] === 'theme payload')).toHaveLength(4));
    expect(onTheme).not.toHaveBeenCalled();
    dom.client.dispose();
    w.host.dispose();
  });
});
