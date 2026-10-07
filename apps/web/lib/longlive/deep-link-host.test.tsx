// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { HostProvider } from '@swift2/ui';
import { useBackDismiss, waitForBackStackIdle } from '@swift2/ui/reader/lib/useBackDismiss';

import { createWebAdapter, createWebRootAdapter } from '../host-adapter';
import { CONTENT } from './content';
import { renderWithReader } from './render-with-reader';
import { WebReaderSnapshotProvider } from './reader-snapshot-provider';
import { AppProvider, useAppActions, useAppState } from './store';

function EraProbe() {
  return <span data-testid="era">{useAppState().eraId}</span>;
}

function ItemProbe() {
  return <span data-testid="item">{useAppState().openItemId ?? ''}</span>;
}

async function eraAfterMount(adapter: ReturnType<typeof createWebAdapter>, expected: string): Promise<string> {
  const { container } = renderWithReader(
    <HostProvider adapter={adapter}>
      <AppProvider>
        <EraProbe />
      </AppProvider>
    </HostProvider>,
  );
  const read = () => container.querySelector('[data-testid="era"]')!.textContent!;
  await settle();
  expect(read()).toBe(expected);
  return read();
}

function mountItemProbe(adapter: ReturnType<typeof createWebAdapter>): { get: () => string } {
  const { container } = renderWithReader(
    <HostProvider adapter={adapter}>
      <AppProvider>
        <ItemProbe />
      </AppProvider>
    </HostProvider>,
  );
  return { get: () => container.querySelector('[data-testid="item"]')!.textContent! };
}

function BackOverlay() {
  const { openItemId } = useAppState();
  const { closeItem } = useAppActions();
  useBackDismiss(openItemId !== null, closeItem);
  return <span data-testid="item">{openItemId ?? ''}</span>;
}

const router = { push() {}, replace() {} };

// The strip-then-open runs in one setTimeout(0); fake timers + act() make its effects land deterministically.
async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10);
  });
}

describe('?era deep link goes through the host (currentUrl)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    window.history.replaceState(null, '', '/');
  });

  it('root adapter: ?era= lands on that era, as before', async () => {
    window.history.replaceState(null, '', '/?era=debut');
    expect(await eraAfterMount(createWebRootAdapter(router), 'debut')).toBe('debut');
  });

  it('adapter without currentUrl falls back to window.location: deep link applied', async () => {
    window.history.replaceState(null, '', '/?era=debut');
    expect(await eraAfterMount(createWebAdapter(router), 'debut')).toBe('debut');
  });

  it('adapter without currentUrl, ?item=x: opens the item overlay from window.location', async () => {
    const id = CONTENT[0]!.id;
    window.history.replaceState(null, '', `/?item=${encodeURIComponent(id)}`);
    const { container } = renderWithReader(
      <HostProvider adapter={createWebAdapter(router)}>
        <AppProvider>
          <ItemProbe />
        </AppProvider>
      </HostProvider>,
    );
    await settle();
    expect(container.querySelector('[data-testid="item"]')!.textContent).toBe(id);
  });

  it('?item= opens the overlay and strips the key, keeping history.state and length', async () => {
    const id = CONTENT[0]!.id;
    window.history.replaceState({ marker: 1 }, '', `/?item=${encodeURIComponent(id)}`);
    const len = window.history.length;
    const read = mountItemProbe(createWebAdapter(router));
    expect(read.get()).toBe('');
    await settle();
    expect(read.get()).toBe(id);
    expect(window.location.search).toBe('');
    expect(window.history.state).toEqual({ marker: 1 });
    expect(window.history.length).toBe(len);
  });

  it('app-style host (currentUrl link, empty window.location.search): opens, no throw, path intact', async () => {
    const id = CONTENT[0]!.id;
    window.history.replaceState(null, '', '/some/path');
    const adapter = { ...createWebAdapter(router), currentUrl: () => `file:///bundle/index.html?item=${encodeURIComponent(id)}` };
    expect(mountItemProbe(adapter).get()).toBe(id);
    await settle();
    expect(window.location.pathname).toBe('/some/path');
    expect(window.location.search).toBe('');
  });

  it('unknown params and hash survive the strip', async () => {
    const id = CONTENT[0]!.id;
    window.history.replaceState(null, '', `/?utm_source=a&item=${encodeURIComponent(id)}#h`);
    mountItemProbe(createWebAdapter(router));
    await settle();
    expect(window.location.search).toBe('?utm_source=a');
    expect(window.location.hash).toBe('#h');
  });

  it.each([
    ['item', 'missing-item'],
    ['song', 'nope::1::nothing'],
    ['guide', 'not-an-era'],
    ['theories', 'not-an-era'],
    ['era', 'not-an-era'],
  ])('unresolved ?%s=%s opens nothing and is NOT stripped', async (key, value) => {
    window.history.replaceState({ marker: 2 }, '', `/?${key}=${value}`);
    expect(mountItemProbe(createWebAdapter(router)).get()).toBe('');
    await settle();
    expect(window.location.search).toBe(`?${key}=${value}`);
    expect(window.history.state).toEqual({ marker: 2 });
  });

  it('strips BEFORE the overlay pushes its back entry: Back lands on the clean base URL', async () => {
    const id = CONTENT[0]!.id;
    window.history.replaceState({ __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: 't', keep: 1 }, '', `/?item=${encodeURIComponent(id)}`);
    const calls: Array<[string, unknown, unknown]> = [];
    const rs = window.history.replaceState.bind(window.history);
    const ps = window.history.pushState.bind(window.history);
    window.history.replaceState = ((d: unknown, u: string, url?: string | URL | null) => {
      calls.push(['replaceState', d, url]);
      return rs(d, u, url);
    }) as typeof window.history.replaceState;
    window.history.pushState = ((d: unknown, u: string, url?: string | URL | null) => {
      calls.push(['pushState', d, url]);
      return ps(d, u, url);
    }) as typeof window.history.pushState;
    try {
      const mount = () =>
        renderWithReader(
          <HostProvider adapter={createWebAdapter(router)}>
            <AppProvider>
              <BackOverlay />
            </AppProvider>
          </HostProvider>,
        );
      const first = mount();
      const text = () => first.container.querySelector('[data-testid="item"]')!.textContent;
      await settle();
      expect(text()).toBe(id);
      expect(calls.map((c) => c[0])).toEqual(['replaceState', 'pushState']);
      expect(calls[0]![2]).toBe('/');
      expect(calls[0]![1]).toEqual({ keep: 1 });
      expect(window.location.search).toBe('');
      const popped = new Promise<void>((r) => window.addEventListener('popstate', () => r(), { once: true }));
      window.history.back();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
        await popped;
      });
      expect(text()).toBe('');
      await waitForBackStackIdle();
      expect(window.location.search).toBe('');
      cleanup();
      const second = mount();
      await settle();
      expect(second.container.querySelector('[data-testid="item"]')!.textContent).toBe('');
    } finally {
      window.history.replaceState = rs;
      window.history.pushState = ps;
    }
  });

  it('Next-aware: strips through a Next-style patched replaceState without the __NA bypass, keeping our fields', async () => {
    const id = CONTENT[0]!.id;
    const nextState = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: 't' }, back: 3 };
    window.history.replaceState(nextState, '', `/?item=${encodeURIComponent(id)}`);
    const original = window.history.replaceState.bind(window.history);
    const restores: unknown[] = [];
    // Mirrors next/dist/client/components/app-router.js (16.3.x) replaceState patch.
    window.history.replaceState = function (data: unknown, unused: string, url?: string | URL | null) {
      const d = data as { __NA?: boolean; _N?: boolean } | null;
      if (d?.__NA || d?._N) return original(data, unused, url);
      const cur = window.history.state as { __NA?: boolean; __PRIVATE_NEXTJS_INTERNALS_TREE?: unknown } | null;
      const merged = { ...(d ?? {}), __NA: cur?.__NA, __PRIVATE_NEXTJS_INTERNALS_TREE: cur?.__PRIVATE_NEXTJS_INTERNALS_TREE };
      if (url) restores.push(String(url));
      return original(merged, unused, url);
    } as typeof window.history.replaceState;
    try {
      mountItemProbe(createWebAdapter(router));
      await settle();
      expect(restores).toEqual(['/']);
      expect(window.history.state).toEqual(nextState);
      expect(window.location.search).toBe('');
    } finally {
      window.history.replaceState = original;
    }
  });

  it('no window and no currentUrl: renders without crashing', () => {
    const html = renderToString(
      <WebReaderSnapshotProvider>
        <HostProvider adapter={createWebAdapter(router)}>
          <AppProvider>
            <EraProbe />
          </AppProvider>
        </HostProvider>
      </WebReaderSnapshotProvider>,
    );
    expect(html).toContain('data-testid="era"');
  });

  it('root adapter exposes currentUrl and a clipboard that wraps navigator.clipboard', () => {
    const root = createWebRootAdapter(router);
    expect(root.currentUrl?.()).toBe(window.location.href);
    expect(root.clipboard).toBeDefined();
    expect(createWebAdapter(router).clipboard).toBeUndefined();
    expect(createWebAdapter(router).currentUrl).toBeUndefined();
  });
});
