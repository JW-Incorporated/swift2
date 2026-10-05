// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FilterBar } from './FilterBar';
import { useChromeOffset } from '@swift2/ui/reader/clown/lib/useChromeOffset';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider } from '@/lib/longlive/store';
import { TestHostProvider } from '@/lib/test-host';

// The app host writes --safe-top (and so TopBar's padding-top) AFTER the reader mounted. Padding-only growth does not
// change a content-box ResizeObserver, so the sticky chrome must observe TopBar's border-box and re-measure on the callback.
type Entry = { target: Element; options?: ResizeObserverOptions; fire: () => void };
let observed: Entry[] = [];

beforeEach(() => {
  observed = [];
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private cb: ResizeObserverCallback) {}
      observe(target: Element, options?: ResizeObserverOptions) {
        observed.push({ target, options, fire: () => this.cb([], this as unknown as ResizeObserver) });
      }
      disconnect() {}
      unobserve() {}
    },
  );
  document.body.innerHTML = '<header data-ll-topbar></header>';
});
afterEach(() => vi.unstubAllGlobals());

function setTopBarHeight(px: number) {
  const bar = document.querySelector<HTMLElement>('[data-ll-topbar]')!;
  bar.getBoundingClientRect = () => ({ height: px }) as DOMRect;
}

describe('sticky chrome follows a TopBar padding change after mount', () => {
  it('useChromeOffset observes the border-box and re-measures when it fires', () => {
    setTopBarHeight(65);
    const { result } = renderHook(() => useChromeOffset('[data-ll-topbar]'));
    expect(result.current).toBe(65);
    const entry = observed.find((o) => o.target.matches('[data-ll-topbar]'))!;
    expect(entry.options).toEqual({ box: 'border-box' });
    setTopBarHeight(89);
    act(() => entry.fire());
    expect(result.current).toBe(89);
  });

  it('FilterBar observes the border-box and moves its sticky top when it fires', () => {
    setTopBarHeight(65);
    const { container } = renderWithReader(
      <TestHostProvider>
        <AppProvider>
          <FilterBar />
        </AppProvider>
      </TestHostProvider>,
    );
    const bar = () => container.querySelector<HTMLElement>('[data-ll-filterbar]')!;
    expect(bar().style.top).toBe('65px');
    const entry = observed.find((o) => o.target.matches('[data-ll-topbar]'))!;
    expect(entry.options).toEqual({ box: 'border-box' });
    setTopBarHeight(89);
    act(() => entry.fire());
    expect(bar().style.top).toBe('89px');
  });
});
