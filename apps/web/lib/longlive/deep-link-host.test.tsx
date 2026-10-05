// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { HostProvider } from '@swift2/ui';

import { createWebAdapter, createWebRootAdapter } from '../host-adapter';
import { CONTENT } from './content';
import { renderWithReader } from './render-with-reader';
import { WebReaderSnapshotProvider } from './reader-snapshot-provider';
import { AppProvider, useAppState } from './store';

function EraProbe() {
  return <span data-testid="era">{useAppState().eraId}</span>;
}

function ItemProbe() {
  return <span data-testid="item">{useAppState().openItemId ?? ''}</span>;
}

function eraAfterMount(adapter: ReturnType<typeof createWebAdapter>): string {
  const { container } = renderWithReader(
    <HostProvider adapter={adapter}>
      <AppProvider>
        <EraProbe />
      </AppProvider>
    </HostProvider>,
  );
  return container.querySelector('[data-testid="era"]')!.textContent!;
}

function mountItemProbe(adapter: ReturnType<typeof createWebAdapter>): string {
  const { container } = renderWithReader(
    <HostProvider adapter={adapter}>
      <AppProvider>
        <ItemProbe />
      </AppProvider>
    </HostProvider>,
  );
  return container.querySelector('[data-testid="item"]')!.textContent!;
}

const router = { push() {}, replace() {} };

describe('?era deep link goes through the host (currentUrl)', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('root adapter: ?era= lands on that era, as before', () => {
    window.history.replaceState(null, '', '/?era=debut');
    expect(eraAfterMount(createWebRootAdapter(router))).toBe('debut');
  });

  it('adapter without currentUrl falls back to window.location: deep link applied', () => {
    window.history.replaceState(null, '', '/?era=debut');
    expect(eraAfterMount(createWebAdapter(router))).toBe('debut');
  });

  it('adapter without currentUrl, ?item=x: opens the item overlay from window.location', () => {
    const id = CONTENT[0]!.id;
    window.history.replaceState(null, '', `/?item=${encodeURIComponent(id)}`);
    const { container } = renderWithReader(
      <HostProvider adapter={createWebAdapter(router)}>
        <AppProvider>
          <ItemProbe />
        </AppProvider>
      </HostProvider>,
    );
    expect(container.querySelector('[data-testid="item"]')!.textContent).toBe(id);
  });

  it('?item= opens the overlay and strips the key, keeping history.state and length', async () => {
    const id = CONTENT[0]!.id;
    window.history.replaceState({ marker: 1 }, '', `/?item=${encodeURIComponent(id)}`);
    const len = window.history.length;
    expect(mountItemProbe(createWebAdapter(router))).toBe(id);
    await waitFor(() => expect(window.location.search).toBe(''));
    expect(window.history.state).toEqual({ marker: 1 });
    expect(window.history.length).toBe(len);
  });

  it('app-style host (currentUrl link, empty window.location.search): opens, no throw, path intact', async () => {
    const id = CONTENT[0]!.id;
    window.history.replaceState(null, '', '/some/path');
    const adapter = { ...createWebAdapter(router), currentUrl: () => `file:///bundle/index.html?item=${encodeURIComponent(id)}` };
    expect(mountItemProbe(adapter)).toBe(id);
    await new Promise((r) => setTimeout(r, 10));
    expect(window.location.pathname).toBe('/some/path');
    expect(window.location.search).toBe('');
  });

  it('unknown params and hash survive the strip', async () => {
    const id = CONTENT[0]!.id;
    window.history.replaceState(null, '', `/?utm_source=a&item=${encodeURIComponent(id)}#h`);
    mountItemProbe(createWebAdapter(router));
    await waitFor(() => expect(window.location.search).toBe('?utm_source=a'));
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
    expect(mountItemProbe(createWebAdapter(router))).toBe('');
    await new Promise((r) => setTimeout(r, 10));
    expect(window.location.search).toBe(`?${key}=${value}`);
    expect(window.history.state).toEqual({ marker: 2 });
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
      await waitFor(() => expect(restores).toEqual(['/']));
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
