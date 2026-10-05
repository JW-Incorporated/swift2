// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resOk } from '@swift2/ui';
import { createAppHandlersFor } from '../../lib/app-handlers';
import { createBridgeHost, type BridgeHost } from '../../lib/bridge-host';
import { createHandlers } from '../../lib/bridge-handlers-notifications';
import { createBridgeLink, createDomHostHandlers } from '../../lib/dom-host-handlers';
import { createAppAdapter } from './app-adapter';
import { createExpoBridge } from './transport-expo';

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) };

// Real DOM client (result gate) -> real host (registry, validation) -> real notification handlers over fake deps.
function rig(override: object) {
  const log = vi.fn();
  const real = createAppHandlersFor(log, {});
  const ref: { host?: BridgeHost; dom?: ReturnType<typeof createExpoBridge> } = {};
  const link = createBridgeLink(() => void ref.dom?.client.consumeInbox(ref.host?.inbox() ?? []));
  const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(), protocol: vi.fn() };
  const handlers = createDomHostHandlers({ onSignal: log, watch, bridge: link.bridge, bridgeClosed: link.isClosed });
  const host = createBridgeHost({ handlers: { ...real, ...override } as never, send: link.send, now: Date.now, scheduler, onProtocolFatal: () => watch.protocol(), onSignal: log });
  ref.host = host;
  link.attach(host);
  const dom = createExpoBridge((env) => handlers.bridge(env));
  ref.dom = dom;
  dom.mount();
  const adapter = createAppAdapter({
    client: dom.client,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    isNativeRoute: () => false,
    navigateDom: vi.fn(),
    getPath: () => '/',
    apiFetch: vi.fn() as never,
    onBack: () => () => {},
  });
  return { host, adapter, dispose: () => (dom.client.dispose(), host.dispose(), link.dispose()) };
}

let live: ReturnType<typeof rig> | null = null;
afterEach(() => {
  live?.dispose();
  live = null;
});
const start = async (override: object) => {
  live = rig(override);
  await vi.waitFor(() => expect(live!.host.isReady()).toBe(true));
  return live;
};

describe('notifications.optOutPending end to end', () => {
  it('carries the persisted flag through the real host and client, both values', async () => {
    let pending = true;
    const deps = { optOutPending: async () => pending };
    const r = await start(createHandlers(deps as never));
    expect(await r.adapter.notifications!.optOutPending!()).toBe(true);
    pending = false;
    expect(await r.adapter.notifications!.optOutPending!()).toBe(false);
  });

  it('a malformed result is rejected by the client gate', async () => {
    const r = await start({ 'notifications.optOutPending': async () => resOk({ pending: 'yes' }) });
    await expect(r.adapter.notifications!.optOutPending!()).rejects.toBeTruthy();
  });

  it('an extra key in the result is rejected by the client gate', async () => {
    const r = await start({ 'notifications.optOutPending': async () => resOk({ pending: true, token: 'x' }) });
    await expect(r.adapter.notifications!.optOutPending!()).rejects.toBeTruthy();
  });

  it('a host without the dep answers a fixed failure', async () => {
    const r = await start(createHandlers({} as never));
    await expect(r.adapter.notifications!.optOutPending!()).rejects.toBeTruthy();
  });
});
