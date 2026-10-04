import { describe, expect, it, vi } from 'vitest';
import type { Insets, WebPath } from '@swift2/ui';
import { createWiredHandlers } from '../../lib/app-handlers';
import { createBackHandler, createContentVersionEmitter, createInsetsEmitter } from '../../lib/bridge-handlers-ui';
import { createBridgeHost, type BridgeHost } from '../../lib/bridge-host';
import { createBridgeLink, createDomHostHandlers } from '../../lib/dom-host-handlers';
import { createUiDeps } from '../../lib/ui-deps';
import { answerBack } from './back-responder';
import { createExpoBridge } from './transport-expo';

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) };

// One host epoch wired exactly as SharedUiHost does (ui deps, emitters, back handler), minus React.
function epoch(presentNativeRoute?: (path: WebPath) => unknown) {
  const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(), protocol: vi.fn() };
  const onSignal = vi.fn();
  const ref: { host?: BridgeHost } = {};
  const link = createBridgeLink(() => void ref.host?.inbox());
  const handlers = createDomHostHandlers({ onSignal, watch, bridge: link.bridge, bridgeClosed: link.isClosed });
  const uiDeps = createUiDeps({
    linking: { openURL: vi.fn(async () => true) },
    share: { share: vi.fn(async () => ({})) },
    platformOS: 'ios',
    log: onSignal,
    getPresenter: () => presentNativeRoute,
  });
  const host = createBridgeHost({
    handlers: createWiredHandlers(onSignal, { ui: uiDeps }),
    send: link.send,
    now: Date.now,
    scheduler,
    onProtocolFatal: () => watch.protocol(),
    onSignal,
  });
  ref.host = host;
  link.attach(host);
  const insets = createInsetsEmitter((i) => void host.emit('insets', i));
  const version = createContentVersionEmitter((e) => void host.emit('contentVersion', e));
  const exitApp = vi.fn();
  const onBack = createBackHandler(host, exitApp);
  const dispose = () => {
    host.dispose();
    link.dispose();
  };
  return { host, link, handlers, insets, version, onBack, exitApp, onSignal, dispose };
}

const portrait: Insets = { top: 47, right: 0, bottom: 34, left: 0 };
const landscape: Insets = { top: 0, right: 47, bottom: 21, left: 47 };

describe('H1 UI commands over a real host and DOM client', () => {
  it('navigate: a native route reaches the presenter; a DOM route is invalid and never does', async () => {
    const present = vi.fn(() => 'applied');
    const e = epoch(present);
    const dom = createExpoBridge((env) => e.handlers.bridge(env));
    dom.mount();
    await vi.waitFor(() => expect(e.host.isReady()).toBe(true));
    expect(await dom.client.call('navigate', { path: '/?screen=settings' as never })).toMatchObject({ ok: true });
    expect(present).toHaveBeenCalledWith('/?screen=settings');
    present.mockClear();
    expect(await dom.client.call('navigate', { path: '/?current=theories' as never })).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(present).not.toHaveBeenCalled();
    dom.client.dispose();
    e.dispose();
  });

  it('haptic with no haptics module and an https openExternal succeed, a file: url is refused', async () => {
    const e = epoch();
    const dom = createExpoBridge((env) => e.handlers.bridge(env));
    dom.mount();
    await vi.waitFor(() => expect(e.host.isReady()).toBe(true));
    expect(await dom.client.call('haptic', { kind: 'light' })).toMatchObject({ ok: true });
    expect(await dom.client.call('openExternal', { url: 'https://example.com' as never })).toMatchObject({ ok: true });
    expect(await dom.client.call('openExternal', { url: 'file:///etc/passwd' as never })).toMatchObject({ ok: false });
    dom.client.dispose();
    e.dispose();
  });

  it('hardware back before the DOM is ready falls through to native', () => {
    const e = epoch();
    expect(e.onBack()).toBe(false);
    expect(e.exitApp).not.toHaveBeenCalled();
    e.dispose();
  });

  it('hardware back after ready asks the DOM first: handled stays in the app, exit leaves it', async () => {
    const e = epoch();
    const dom = createExpoBridge((env) => e.handlers.bridge(env));
    let open: string | null = 'item';
    dom.client.handle('back', () => answerBack({ openItemId: open, closeItem: () => void (open = null) }));
    dom.mount();
    await vi.waitFor(() => expect(e.host.isReady()).toBe(true));

    expect(e.onBack()).toBe(true);
    dom.client.consumeInbox(e.host.inbox());
    await vi.waitFor(() => expect(open).toBeNull());
    await new Promise((r) => setTimeout(r, 20));
    expect(e.exitApp).not.toHaveBeenCalled();

    expect(e.onBack()).toBe(true);
    dom.client.consumeInbox(e.host.inbox());
    await vi.waitFor(() => expect(e.exitApp).toHaveBeenCalledTimes(1));
    dom.client.dispose();
    e.dispose();
  });

  it('insets and contentVersion queued before ready arrive once on ready; changes arrive, repeats do not', async () => {
    const e = epoch();
    const got: Insets[] = [];
    const tokens: string[] = [];
    const dom = createExpoBridge((env) => e.handlers.bridge(env));
    dom.client.on('insets', (i) => void got.push(i));
    dom.client.on('contentVersion', (p) => void tokens.push(p.token));
    e.insets(portrait);
    e.version('v1');
    dom.mount();
    await vi.waitFor(() => expect(e.host.isReady()).toBe(true));
    dom.client.consumeInbox(e.host.inbox());
    expect(got).toEqual([portrait]);
    expect(tokens).toEqual(['v1']);

    e.insets({ ...portrait });
    e.version('v1');
    e.insets(landscape);
    dom.client.consumeInbox(e.host.inbox());
    expect(got).toEqual([portrait, landscape]);
    expect(tokens).toEqual(['v1']);
    dom.client.dispose();
    e.dispose();
  });
});
