import { afterEach, describe, expect, it, vi } from 'vitest';
import { shareTarget } from '@swift2/ui/reader/lib/share-payload';
import { createWiredHandlers } from '../../lib/app-handlers';
import { createBridgeHost, type BridgeHost } from '../../lib/bridge-host';
import { createBridgeLink, createDomHostHandlers } from '../../lib/dom-host-handlers';
import { createUiDeps, type UiDepsEnv } from '../../lib/ui-deps';
import { createAppAdapter } from './app-adapter';
import { createExpoBridge } from './transport-expo';

const scheduler = { setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms), clearTimeout: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>) };

// A real host epoch (as SharedUiHost wires it) and a real DOM client over it, minus React.
function epoch(env: Partial<UiDepsEnv>) {
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
    ...env,
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
  return { host, handlers, dispose: () => (host.dispose(), link.dispose()) };
}

async function connect(env: Partial<UiDepsEnv>) {
  const e = epoch(env);
  const dom = createExpoBridge((m) => e.handlers.bridge(m));
  dom.mount();
  await vi.waitFor(() => expect(e.host.isReady()).toBe(true));
  return { dom, close: () => (dom.client.dispose(), e.dispose()) };
}

afterEach(() => vi.unstubAllGlobals());

describe('clipboard.write over a real host and DOM client', () => {
  it('writes the text natively through the app adapter', async () => {
    const setStringAsync = vi.fn(async () => true);
    const c = await connect({ clipboard: { setStringAsync } });
    const adapter = createAppAdapter({ client: c.dom.client, insets: { top: 0, right: 0, bottom: 0, left: 0 }, isNativeRoute: () => false, navigateDom: vi.fn(), getPath: () => '/', apiFetch: vi.fn() as never, onBack: vi.fn() as never });
    await adapter.clipboard!.writeText('https://www.longlivets.com?item=a');
    expect(setStringAsync).toHaveBeenCalledExactlyOnceWith('https://www.longlivets.com?item=a');
    c.close();
  });

  it('refuses malformed payloads at the host gate and never copies', async () => {
    const setStringAsync = vi.fn(async () => true);
    const c = await connect({ clipboard: { setStringAsync } });
    const bad: unknown[] = [{ text: '' }, { text: 5 }, {}, { text: 'x', extra: 1 }, { text: 'x'.repeat(2049) }];
    for (const payload of bad) {
      expect(await c.dom.client.call('clipboard.write', payload as never)).toMatchObject({ ok: false });
    }
    expect(setStringAsync).not.toHaveBeenCalled();
    c.close();
  });

  it('answers failed when expo-clipboard is absent or rejects', async () => {
    const none = await connect({});
    expect(await none.dom.client.call('clipboard.write', { text: 'x' })).toMatchObject({ ok: false, error: { code: 'failed' } });
    none.close();
    const rejects = await connect({ clipboard: { setStringAsync: vi.fn(async () => Promise.reject(new Error('denied'))) } });
    expect(await rejects.dom.client.call('clipboard.write', { text: 'x' })).toMatchObject({ ok: false, error: { code: 'failed' } });
    rejects.close();
  });

  it('a failed native share falls back to copying the logical-path link; a dismissed one does not', async () => {
    const local = '/data/user/0/com.longlive.app/files/dom/index.html';
    const events: Event[] = [];
    vi.stubGlobal('window', {
      location: { origin: 'null', pathname: local },
      dispatchEvent: (e: Event) => (events.push(e), true),
    });
    const setStringAsync = vi.fn(async () => true);
    const share = vi.fn<() => Promise<unknown>>(async () => Promise.reject(new Error('no share sheet')));
    const c = await connect({ clipboard: { setStringAsync }, share: { share } });
    const adapter = createAppAdapter({ client: c.dom.client, insets: { top: 0, right: 0, bottom: 0, left: 0 }, isNativeRoute: () => false, navigateDom: vi.fn(), getPath: () => '/privacy', apiFetch: vi.fn() as never, onBack: vi.fn() as never });
    const data = { getContentItem: () => undefined, resolveTrackKey: () => null };
    expect(await shareTarget({ kind: 'site' }, data, adapter)).toBe('fallback');
    expect(setStringAsync).toHaveBeenCalledExactlyOnceWith('https://www.longlivets.com/privacy');
    expect(events).toHaveLength(1);
    share.mockImplementation(async () => ({}));
    setStringAsync.mockClear();
    expect(await shareTarget({ kind: 'site' }, data, adapter)).toBe('native');
    expect(setStringAsync).not.toHaveBeenCalled();
    c.close();
  });
});
