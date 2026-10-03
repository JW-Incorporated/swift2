// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { HostProvider } from '@swift2/ui';

import { createWebAdapter, createWebRootAdapter } from '../host-adapter';
import { renderWithReader } from './render-with-reader';
import { AppProvider, useAppState } from './store';

function EraProbe() {
  return <span data-testid="era">{useAppState().eraId}</span>;
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

  it('adapter without currentUrl: no deep link, no crash', () => {
    window.history.replaceState(null, '', '/?era=debut');
    expect(eraAfterMount(createWebAdapter(router))).not.toBe('debut');
  });

  it('root adapter exposes currentUrl and a clipboard that wraps navigator.clipboard', () => {
    const root = createWebRootAdapter(router);
    expect(root.currentUrl?.()).toBe(window.location.href);
    expect(root.clipboard).toBeDefined();
    expect(createWebAdapter(router).clipboard).toBeUndefined();
    expect(createWebAdapter(router).currentUrl).toBeUndefined();
  });
});
