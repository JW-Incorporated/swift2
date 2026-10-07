// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, screen } from '@testing-library/react';
import { trackKey } from '@swift2/experience';
import { TrackDetail } from './TrackDetail';
import { tracksForEra } from '@/lib/longlive/tracks';
import { createWebStorage } from '@/lib/host-adapter';
import { TestHostProvider } from '@/lib/test-host';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider, useAppActions } from '@/lib/longlive/store';

const HINT_KEY = 'll-track-swipe-hint-seen-v1';
const ERA = 'fearless' as const;
const KEY = trackKey(ERA, tracksForEra(ERA)[1]);
const KEY2 = trackKey(ERA, tracksForEra(ERA)[2]);
const HINT = /swipe/i;

let actions: ReturnType<typeof useAppActions>;

function OpenSong() {
  const a = useAppActions();
  actions = a;
  useEffect(() => {
    a.openSong(ERA, KEY);
  }, [a.openSong]);
  return null;
}

function mount() {
  return renderWithReader(
    <TestHostProvider>
      <AppProvider>
        <OpenSong />
        <TrackDetail />
      </AppProvider>
    </TestHostProvider>,
  );
}

function hintWrites(spy: { mock: { calls: unknown[][] } }) {
  return spy.mock.calls.filter((c) => c[0] === HINT_KEY);
}

describe('TrackDetail swipe hint — tri-state host storage', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('returning user (get -> "1"): no hint, zero hint writes', () => {
    window.localStorage.setItem(HINT_KEY, '1');
    const set = vi.spyOn(Storage.prototype, 'setItem');
    mount();
    expect(screen.queryByText(HINT)).toBeNull();
    expect(hintWrites(set)).toHaveLength(0);
  });

  it('new user (get -> null): hint shown, exactly one write; navigating twice keeps it at one', () => {
    const set = vi.spyOn(Storage.prototype, 'setItem');
    mount();
    expect(screen.getByText(HINT)).toBeInTheDocument();
    expect(window.localStorage.getItem(HINT_KEY)).toBe('1');
    act(() => actions.openTrack(KEY2));
    act(() => actions.openTrack(KEY));
    expect(hintWrites(set)).toHaveLength(1);
  });

  it('blocked storage (get -> undefined): no hint, zero hint writes', () => {
    const boom = (): never => {
      throw new Error('blocked');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(boom);
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(boom);
    mount();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText(HINT)).toBeNull();
    expect(hintWrites(set)).toHaveLength(0);
  });

  it('real createWebStorage reports undefined when Storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(createWebStorage('localStorage').get(HINT_KEY)).toBeUndefined();
  });
});
