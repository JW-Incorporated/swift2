// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { HostProvider, type HostStorage } from '@swift2/ui';
import { trackKey } from '@swift2/experience';
import { TrackDetail } from './TrackDetail';
import { tracksForEra } from '@/lib/longlive/tracks';
import { createWebAdapter } from '@/lib/host-adapter';
import { TestHostProvider } from '@/lib/test-host';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider, useAppActions } from '@/lib/longlive/store';

const HINT_KEY = 'll-track-swipe-hint-seen-v1';
const ERA = 'fearless' as const;
const KEY = trackKey(ERA, tracksForEra(ERA)[1]);

function OpenSong() {
  const { openSong } = useAppActions();
  useEffect(() => {
    openSong(ERA, KEY);
  }, [openSong]);
  return null;
}

const HINT = /swipe/i;

describe('TrackDetail swipe hint through host storage', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it('web: shows once and persists "1" under the same localStorage key', () => {
    renderWithReader(
      <TestHostProvider>
        <AppProvider>
          <OpenSong />
          <TrackDetail />
        </AppProvider>
      </TestHostProvider>,
    );
    expect(screen.getByText(HINT)).toBeInTheDocument();
    expect(window.localStorage.getItem(HINT_KEY)).toBe('1');
    cleanup();
    renderWithReader(
      <TestHostProvider>
        <AppProvider>
          <OpenSong />
          <TrackDetail />
        </AppProvider>
      </TestHostProvider>,
    );
    expect(screen.queryByText(HINT)).toBeNull();
  });

  it('a throwing storage degrades gracefully (hint skipped, no crash)', () => {
    const boom = (): never => {
      throw new Error('blocked');
    };
    const bad: HostStorage = { get: boom, set: boom, remove: boom };
    const adapter = {
      ...createWebAdapter({ push() {}, replace() {} }),
      storage: { local: bad, session: bad },
    };
    renderWithReader(
      <HostProvider adapter={adapter}>
        <AppProvider>
          <OpenSong />
          <TrackDetail />
        </AppProvider>
      </HostProvider>,
    );
    expect(screen.queryByText(HINT)).toBeNull();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
