import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiBaseUrl } from '../../lib/api-base';
import { createLiveAppHandlers } from '../../lib/app-handlers';
import { createBridgeHost, type BridgeHost } from '../../lib/bridge-host';
import { createBridgeLink, createDomHostHandlers } from '../../lib/dom-host-handlers';
import { createBridgeApiFetch } from './api-fetch';
import { createExpoBridge } from './transport-expo';

const expoFetch = vi.hoisted(() => vi.fn());
vi.mock('../../lib/expo-fetch-deps', () => ({
  createExpoApiDeps: () => ({ fetch: expoFetch, baseUrl: () => 'https://api.test' }),
}));

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) };

const streamed = (text: string, status = 200) =>
  new Response(new ReadableStream<Uint8Array>({ start(c) { c.enqueue(new TextEncoder().encode(text)); c.close(); } }), { status });
const never = (_url: string, init: RequestInit) =>
  new Promise<Response>((_res, rej) => init.signal?.addEventListener('abort', () => rej(new Error('aborted'))));

// Real DOM client + link + host + createLiveAppHandlers; only expo/fetch is mocked.
async function wire() {
  const onSignal = vi.fn();
  const ref: { host?: BridgeHost } = {};
  const link = createBridgeLink(() => void ref.host?.inbox());
  const handlers = createDomHostHandlers({ onSignal, watch: { ready: vi.fn(), error: vi.fn(), crashed: vi.fn(), protocol: vi.fn() }, bridge: link.bridge, bridgeClosed: link.isClosed, token: 'tok' });
  const host = createBridgeHost({ handlers: createLiveAppHandlers(onSignal), send: link.send, now: Date.now, scheduler, onProtocolFatal: () => link.dispose(), onSignal });
  ref.host = host;
  link.attach(host);
  const bridge = createExpoBridge((env, t) => handlers.bridge(env, t), undefined, undefined, () => handlers.bridgeHello());
  bridge.mount();
  await vi.waitFor(() => expect(host.isReady()).toBe(true));
  return { apiFetch: createBridgeApiFetch(bridge.client), dispose: () => { bridge.client.dispose(); host.dispose(); link.dispose(); } };
}

let live: { dispose: () => void } | undefined;
afterEach(() => {
  live?.dispose();
  live = undefined;
  expoFetch.mockReset();
  vi.useRealTimers();
});

describe('apiFetch through the real bridge (client, link, host, live handlers)', () => {
  it('an allowlisted call reaches the expo/fetch stream and returns its body', async () => {
    expoFetch.mockResolvedValueOnce(streamed('{"ok":true}'));
    const w = (live = await wire());
    const res = await w.apiFetch({ method: 'POST', path: '/api/intake', body: '{}', headers: { 'content-type': 'application/json' } });
    expect(res).toMatchObject({ status: 200, body: '{"ok":true}' });
    expect(expoFetch.mock.calls[0][0]).toBe(`${apiBaseUrl()}/api/intake`);
  });

  it('host validation refuses a non-allowlisted path and a request body over 64 KB, with no fetch', async () => {
    const w = (live = await wire());
    await expect(w.apiFetch({ method: 'POST', path: '/api/devices/register', body: '{}' })).rejects.toThrow(/invalid|failed/);
    await expect(w.apiFetch({ method: 'POST', path: '/api/feedback', body: 'a'.repeat(64 * 1024 + 1) })).rejects.toThrow(/invalid|failed/);
    expect(expoFetch).not.toHaveBeenCalled();
  });

  it('abort sends a cancel command that aborts the in-flight fetch', async () => {
    let signal: AbortSignal | undefined;
    expoFetch.mockImplementationOnce((u: string, init: RequestInit) => {
      signal = init.signal as AbortSignal;
      return never(u, init);
    });
    const w = (live = await wire());
    const ac = new AbortController();
    const p = w.apiFetch({ method: 'POST', path: '/api/mood', body: '{}' }, { signal: ac.signal });
    const settled = expect(p).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(signal).toBeDefined());
    ac.abort();
    await settled;
    await vi.waitFor(() => expect(signal?.aborted).toBe(true));
  });

  it('times out per endpoint (8 s default, 60 s clown) and aborts the fetch', async () => {
    vi.useFakeTimers();
    const signals: AbortSignal[] = [];
    expoFetch.mockImplementation((u: string, init: RequestInit) => {
      signals.push(init.signal as AbortSignal);
      return never(u, init);
    });
    const w = (live = await wire());
    const intake = expect(w.apiFetch({ method: 'POST', path: '/api/intake', body: '{}' })).rejects.toThrow('timeout');
    await vi.advanceTimersByTimeAsync(7999);
    expect(signals[0].aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await intake;
    expect(signals[0].aborted).toBe(true);
    const clown = expect(w.apiFetch({ method: 'POST', path: '/api/clown', body: '{}' })).rejects.toThrow('timeout');
    await vi.advanceTimersByTimeAsync(59_999);
    expect(signals[1].aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await clown;
    expect(signals[1].aborted).toBe(true);
  });
});
