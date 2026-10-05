// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
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

  it('?item= opens the overlay and strips the key, keeping history.state and length', () => {
    const id = CONTENT[0]!.id;
    window.history.replaceState({ marker: 1 }, '', `/?item=${encodeURIComponent(id)}`);
    const len = window.history.length;
    const { container } = renderWithReader(
      <HostProvider adapter={createWebAdapter(router)}>
        <AppProvider>
          <ItemProbe />
        </AppProvider>
      </HostProvider>,
    );
    expect(container.querySelector('[data-testid="item"]')!.textContent).toBe(id);
    expect(window.location.search).toBe('');
    expect(window.history.state).toEqual({ marker: 1 });
    expect(window.history.length).toBe(len);
  });

  it('app-style host (currentUrl link, empty window.location.search): opens, no throw, path intact', () => {
    const id = CONTENT[0]!.id;
    window.history.replaceState(null, '', '/some/path');
    const adapter = { ...createWebAdapter(router), currentUrl: () => `file:///bundle/index.html?item=${encodeURIComponent(id)}` };
    const { container } = renderWithReader(
      <HostProvider adapter={adapter}>
        <AppProvider>
          <ItemProbe />
        </AppProvider>
      </HostProvider>,
    );
    expect(container.querySelector('[data-testid="item"]')!.textContent).toBe(id);
    expect(window.location.pathname).toBe('/some/path');
    expect(window.location.search).toBe('');
  });

  it('unknown params survive the strip', () => {
    const id = CONTENT[0]!.id;
    window.history.replaceState(null, '', `/?utm_source=a&item=${encodeURIComponent(id)}#h`);
    renderWithReader(
      <HostProvider adapter={createWebAdapter(router)}>
        <AppProvider>
          <ItemProbe />
        </AppProvider>
      </HostProvider>,
    );
    expect(window.location.search).toBe('?utm_source=a');
    expect(window.location.hash).toBe('#h');
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
