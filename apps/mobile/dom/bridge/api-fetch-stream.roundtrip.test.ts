import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ApiRequest } from '@swift2/content';
import { resOk } from '@swift2/ui';
import { createAppHandlersFor } from '../../lib/app-handlers';
import { createBridgeHost, type BridgeHost } from '../../lib/bridge-host';
import { createBridgeLink, createDomHostHandlers } from '../../lib/dom-host-handlers';
import { fakeBody } from '../../lib/bridge-handlers-api-stream.test-kit';
import { createBridgeApiFetch, createBridgeApiStream } from './api-fetch';
import { createExpoBridge } from './transport-expo';

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) };
const req = { method: 'POST', path: '/api/clown', body: '{}' } as ApiRequest;
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

// The production chain: real DOM client -> real host (validation, dispatcher, cancel) -> real api handlers over a fake fetch.
function rig(responses: (() => Response)[], override?: (real: ReturnType<typeof createAppHandlersFor>) => object) {
  const signals: AbortSignal[] = [];
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    signals.push(init.signal as AbortSignal);
    return (responses.shift() ?? (() => new Response('{}')))();
  });
  const log = vi.fn();
  const real = createAppHandlersFor(log, { api: { fetch: fetchMock as unknown as typeof fetch, baseUrl: () => 'https://api.test' } });
  const ref: { host?: BridgeHost; dom?: ReturnType<typeof createExpoBridge> } = {};
  const link = createBridgeLink(() => void ref.dom?.client.consumeInbox(ref.host?.inbox() ?? []));
  const watch = { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(), protocol: vi.fn() };
  const handlers = createDomHostHandlers({ onSignal: log, watch, bridge: link.bridge, bridgeClosed: link.isClosed, token: 'tok' });
  const host = createBridgeHost({
    handlers: (override ? { ...real, ...override(real) } : real) as never,
    send: link.send,
    now: Date.now,
    scheduler,
    onProtocolFatal: () => watch.protocol(),
    onSignal: log,
  });
  ref.host = host;
  link.attach(host);
  const dom = createExpoBridge((env, t) => handlers.bridge(env, t), undefined, undefined, () => handlers.bridgeHello());
  ref.dom = dom;
  dom.mount();
  const apiStream = createBridgeApiStream(createBridgeApiFetch(dom.client));
  return { host, dom, signals, fetchMock, apiStream, dispose: () => (dom.client.dispose(), host.dispose(), link.dispose()) };
}

let live: ReturnType<typeof rig> | null = null;
const start = async (...a: Parameters<typeof rig>) => {
  live = rig(...a);
  await vi.waitFor(() => expect(live!.host.isReady()).toBe(true));
  return live;
};
afterEach(() => {
  live?.dispose();
  live = null;
});

describe('streamed api over the real host and client', () => {
  it('delivers repeated apiRead chunks in order, then finishes on done', async () => {
    const b = fakeBody();
    const r = await start([() => b.response]);
    const got: string[] = [];
    const done = (async () => {
      for await (const c of r.apiStream(req)) got.push(c);
    })();
    await flush();
    b.push('one\n');
    await vi.waitFor(() => expect(got).toEqual(['one\n']));
    b.push('two\n');
    await vi.waitFor(() => expect(got).toEqual(['one\n', 'two\n']));
    b.end();
    await done;
    expect(got.join('')).toBe('one\ntwo\n');
  });

  it('a malformed apiRead result is rejected by the real client gate', async () => {
    const b = fakeBody();
    const r = await start([() => b.response], () => ({ apiRead: async () => resOk({ chunk: 5, done: false }) }));
    await expect(r.apiStream(req)[Symbol.asyncIterator]().next()).rejects.toThrow(/api /);
  });

  it('cancelling mid-stream closes the native stream and aborts its fetch (no leak)', async () => {
    const b = fakeBody();
    const r = await start([() => b.response]);
    const it = r.apiStream(req)[Symbol.asyncIterator]();
    const first = it.next();
    await flush();
    b.push('a\n');
    expect(await first).toEqual({ done: false, value: 'a\n' });
    await it.return?.();
    await vi.waitFor(() => expect(b.cancel).toHaveBeenCalled());
    expect(r.signals[0].aborted).toBe(true);
  });

  it('abort then an immediate reopen works (single slot)', async () => {
    const a = fakeBody();
    const b = fakeBody();
    const r = await start([() => a.response, () => b.response]);
    const ac = new AbortController();
    const pending = r.apiStream(req, { signal: ac.signal })[Symbol.asyncIterator]().next();
    pending.catch(() => undefined);
    await flush();
    ac.abort();
    const second = r.apiStream(req)[Symbol.asyncIterator]();
    const next = second.next();
    await flush();
    b.push('fresh\n');
    expect(await next).toEqual({ done: false, value: 'fresh\n' });
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(a.cancel).toHaveBeenCalled();
    await second.return?.();
  });
});
