// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { trackKey } from '@swift2/experience';
import { TrackDetail } from './TrackDetail';
import { tracksForEra } from '@/lib/longlive/tracks';
import { TestHostProvider } from '@/lib/test-host';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider, useAppActions } from '@/lib/longlive/store';

const HINT_KEY = 'll-track-swipe-hint-seen-v1';
const ERA = 'fearless' as const;
const KEY = trackKey(ERA, tracksForEra(ERA)[1]);
const HINT = /swipe/i;

function OpenSong() {
  const { openSong } = useAppActions();
  useEffect(() => {
    openSong(ERA, KEY);
  }, [openSong]);
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

describe('TrackDetail swipe hint through the real web storage adapter', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows once and persists "1" under the same localStorage key', () => {
    mount();
    expect(screen.getByText(HINT)).toBeInTheDocument();
    expect(window.localStorage.getItem(HINT_KEY)).toBe('1');
    expect(window.localStorage.getItem('ll-track-swipe-hint-probe')).toBeNull();
    cleanup();
    mount();
    expect(screen.queryByText(HINT)).toBeNull();
  });

  it('blocked localStorage (throws on get/set): hint never shows', () => {
    const boom = (): never => {
      throw new Error('blocked');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(boom);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(boom);
    mount();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText(HINT)).toBeNull();
  });
});
