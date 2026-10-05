// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, useState } from 'react';

// @ts-expect-error -- untyped deep path on purpose
vi.mock('react', async () => await import('../../../web/node_modules/react'));
// @ts-expect-error -- same copy pinning for the renderer
vi.mock('react-dom', async () => await import('../../../web/node_modules/react-dom'));

const h = vi.hoisted(() => ({ back: null as null | (() => 'handled' | 'exit') }));
vi.mock('@swift2/ui', async (orig) => ({ ...(await orig<object>()), useReader: () => ({}) }));
vi.mock('@swift2/ui/reader/store/index', () => ({
  useAppState: () => ({ mode: 'era', openItemId: null }),
  useAppActions: () => ({ closeItem: vi.fn() }),
}));
vi.mock('./reader-controls', () => ({
  useReaderControls: () => ({ registerBack: (fn: typeof h.back) => (h.back = fn), slottedModes: new Set(), lastSlotted: { current: null }, setApplier: () => {}, setRestorer: () => {} }),
}));

import { act, cleanup, render } from '@testing-library/react';
import { createUnwiredHandlers } from '../../lib/app-handlers';
import { createBackHandler } from '../../lib/bridge-handlers-ui';
import { createBridgeHost, type BridgeHost } from '../../lib/bridge-host';
import { createBridgeLink, createDomHostHandlers } from '../../lib/dom-host-handlers';
import { resetOnboardingForTests } from '../slots/onboarding-store';
import { ReaderBridge } from './reader-bridge';
import { createExpoBridge } from './transport-expo';
import { pushBackEntry, resetBackStackForTests, useBackDismiss, waitForBackStackIdle } from '@swift2/ui/reader/lib/useBackDismiss';

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (t: unknown) => clearTimeout(t as ReturnType<typeof setTimeout>) };

// Real native back handler -> real host (request, validation, timeout) -> real DOM client responder -> ReaderBridge's registered back.
function epoch() {
  const ref: { host?: BridgeHost; dom?: ReturnType<typeof createExpoBridge> } = {};
  const log = vi.fn();
  // Deferred like a React re-render of the inbox prop; a synchronous redelivery would recurse through the ack.
  const link = createBridgeLink(() => void setTimeout(() => ref.dom?.client.consumeInbox(ref.host?.inbox() ?? []), 0));
  const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(), protocol: vi.fn() };
  const handlers = createDomHostHandlers({ onSignal: log, watch, bridge: link.bridge, bridgeClosed: link.isClosed });
  const host = createBridgeHost({ handlers: createUnwiredHandlers(log), send: link.send, now: Date.now, scheduler, onProtocolFatal: () => watch.protocol(), onSignal: log });
  ref.host = host;
  link.attach(host);
  const dom = createExpoBridge((env) => handlers.bridge(env));
  ref.dom = dom;
  dom.mount();
  dom.client.handle('back', () => h.back!());
  const exitApp = vi.fn();
  const nativeBack = createBackHandler(host, exitApp);
  return { host, dom, exitApp, nativeBack, dispose: () => (dom.client.dispose(), host.dispose(), link.dispose()) };
}

let setOverlay: (v: boolean) => void = () => {};
let overlayShown = false;
function Overlay() {
  const [open, setOpen] = useState(false);
  setOverlay = setOpen;
  useBackDismiss(open, () => setOpen(false));
  overlayShown = open;
  return null;
}

let live: ReturnType<typeof epoch> | null = null;
afterEach(async () => {
  live?.dispose();
  live = null;
  cleanup();
  await waitForBackStackIdle();
  resetBackStackForTests();
  resetOnboardingForTests();
  overlayShown = false;
});

describe('native Back through the real bridge', () => {
  it('overlay closes first, then the nav entry restores, then root exits the app', async () => {
    live = epoch();
    await vi.waitFor(() => expect(live!.host.isReady()).toBe(true));
    render(createElement('div', null, createElement(ReaderBridge), createElement(Overlay)));
    const restore = vi.fn();
    act(() => pushBackEntry(restore));
    act(() => setOverlay(true));
    expect(overlayShown).toBe(true);

    expect(live.nativeBack()).toBe(true);
    await vi.waitFor(() => expect(overlayShown).toBe(false));
    expect(restore).not.toHaveBeenCalled();
    await act(async () => void (await waitForBackStackIdle()));
    expect(live.exitApp).not.toHaveBeenCalled();

    expect(live.nativeBack()).toBe(true);
    await vi.waitFor(() => expect(restore).toHaveBeenCalledTimes(1));
    await act(async () => void (await waitForBackStackIdle()));
    expect(live.exitApp).not.toHaveBeenCalled();

    expect(live.nativeBack()).toBe(true);
    await vi.waitFor(() => expect(live!.exitApp).toHaveBeenCalledTimes(1));
    expect(restore).toHaveBeenCalledTimes(1);
  });
});
