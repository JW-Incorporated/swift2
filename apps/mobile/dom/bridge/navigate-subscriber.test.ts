import { describe, expect, it, vi } from 'vitest';
import { createWiredHandlers } from '../../lib/app-handlers';
import { createBridgeHost, type BridgeHost } from '../../lib/bridge-host';
import { createBridgeLink, createDomHostHandlers } from '../../lib/dom-host-handlers';
import { NAVIGATE_SUBSCRIBER_STAGE as NATIVE_STAGE } from '../../lib/tap-bind-epoch';
import { NAVIGATE_SUBSCRIBER_STAGE, applyNavigateEvent, installNavigateSubscriber } from './navigate-subscriber';
import { createExpoBridge } from './transport-expo';

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) };

describe('applyNavigateEvent', () => {
  it('keeps search + hash only and remounts', () => {
    const deps = { replaceUrl: vi.fn(), remount: vi.fn() };
    expect(applyNavigateEvent({ path: '/?item=abc&era=debut#x' as never }, deps)).toBe(true);
    expect(deps.replaceUrl).toHaveBeenCalledWith('?item=abc&era=debut#x');
    expect(deps.remount).toHaveBeenCalledTimes(1);
  });

  it('a path with no query clears the query', () => {
    const deps = { replaceUrl: vi.fn(), remount: vi.fn() };
    applyNavigateEvent({ path: '/' as never }, deps);
    expect(deps.replaceUrl).toHaveBeenCalledWith('?');
  });
});

describe('native to DOM navigate over a real host and client', () => {
  it('the stage names agree', () => {
    expect(NAVIGATE_SUBSCRIBER_STAGE).toBe(NATIVE_STAGE);
  });

  it('is delivered to the subscriber, acked, and the subscriber announces itself', async () => {
    const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(), protocol: vi.fn() };
    const signals: string[] = [];
    const ref: { host?: BridgeHost } = {};
    const link = createBridgeLink(() => void ref.host?.inbox());
    const handlers = createDomHostHandlers({ onSignal: vi.fn(), watch, bridge: link.bridge, bridgeClosed: link.isClosed });
    const host = createBridgeHost({
      handlers: createWiredHandlers(vi.fn(), {}),
      send: link.send,
      now: Date.now,
      scheduler,
      onProtocolFatal: () => watch.protocol(),
      onSignal: (stage) => void signals.push(stage),
    });
    ref.host = host;
    link.attach(host);
    const dom = createExpoBridge((env) => handlers.bridge(env));
    const deps = { replaceUrl: vi.fn(), remount: vi.fn() };
    dom.mount();
    installNavigateSubscriber(dom.client, deps);
    await vi.waitFor(() => expect(host.isReady()).toBe(true));
    await vi.waitFor(() => expect(signals).toContain(NATIVE_STAGE));
    const ref1 = host.emit('navigate', { path: '/?item=abc' as never, source: 'notification' });
    expect(ref1).not.toBeNull();
    dom.client.consumeInbox(host.inbox());
    expect(deps.replaceUrl).toHaveBeenCalledWith('?item=abc');
    const acked = await new Promise<boolean>((resolve) => host.onAcked(ref1!, resolve));
    expect(acked).toBe(true);
    dom.client.dispose();
    host.dispose();
    link.dispose();
  });
});
