import { describe, expect, it, vi } from 'vitest';
import { createAppHandlersFor } from '../../lib/app-handlers';
import { createBridgeHost, type BridgeHost } from '../../lib/bridge-host';
import { createBridgeLink, createDomHostHandlers, createNativeRoutePresenter } from '../../lib/dom-host-handlers';
import { createUiDeps } from '../../lib/ui-deps';
import { createReaderAdapter } from '../spike/reader-modules';
import { isNativeRoute } from '../slots/routes';
import { createExpoBridge } from './transport-expo';

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) };

// Real host + real ui handlers + real presenter + the real slot route registry; the DOM side is the real adapter.
function epoch() {
  const presenter = createNativeRoutePresenter({ isNativeRoute, now: Date.now });
  const log = vi.fn();
  const ref: { host?: BridgeHost; dom?: ReturnType<typeof createExpoBridge> } = {};
  const link = createBridgeLink(() => void ref.dom?.client.consumeInbox(ref.host?.inbox() ?? []));
  const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(), protocol: vi.fn() };
  const handlers = createDomHostHandlers({ onSignal: log, watch, bridge: link.bridge, bridgeClosed: link.isClosed });
  const ui = createUiDeps({
    linking: { openURL: async () => true },
    share: { share: async () => ({}) },
    platformOS: 'ios',
    log,
    getPresenter: () => presenter.presentNativeRoute as never,
  });
  const host = createBridgeHost({
    handlers: createAppHandlersFor(log, { ui }) as never,
    send: link.send,
    now: Date.now,
    scheduler,
    onProtocolFatal: () => watch.protocol(),
    onSignal: log,
  });
  ref.host = host;
  link.attach(host);
  const dom = createExpoBridge((env) => handlers.bridge(env));
  ref.dom = dom;
  return { presenter, host, dom, dispose: () => (dom.client.dispose(), host.dispose(), link.dispose()) };
}

describe('DOM navigate over the real host reaches the native presenter', () => {
  it.each(['/inbox'])('adapter.navigate(%s) opens it natively (not invalid)', async (path) => {
    const e = epoch();
    e.dom.mount();
    await vi.waitFor(() => expect(e.host.isReady()).toBe(true));
    const adapter = createReaderAdapter({ client: e.dom.client, insets: { top: 0, right: 0, bottom: 0, left: 0 }, navigateDom: vi.fn(), getPath: () => '/' });
    adapter.navigate(path);
    await vi.waitFor(() => expect(e.presenter.getState()).toMatchObject({ phase: 'opening', route: path }));
    e.dispose();
  });

  it('the command answers ok for a host route and invalid for a DOM-owned one', async () => {
    const e = epoch();
    e.dom.mount();
    await vi.waitFor(() => expect(e.host.isReady()).toBe(true));
    expect(await e.dom.client.call('navigate', { path: '/inbox' as never })).toMatchObject({ ok: true });
    expect(await e.dom.client.call('navigate', { path: '/vault' as never })).toMatchObject({ ok: false, error: { code: 'invalid' } });
    e.dispose();
  });
});
