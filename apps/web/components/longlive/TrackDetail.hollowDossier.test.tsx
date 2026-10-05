// @vitest-environment jsdom
import type {} from '@testing-library/jest-dom/vitest';
import { useEffect } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { trackKey } from '@swift2/experience';
import { TrackDetail } from './TrackDetail';
import { tracksForEra } from '@/lib/longlive/tracks';
import { TestHostProvider } from '@/lib/test-host';
import { renderWithReader } from '@/lib/longlive/render-with-reader';
import { AppProvider, useAppActions } from '@/lib/longlive/store';

const ERA = 'fearless' as const;
const track = tracksForEra(ERA)[1];
const KEY = trackKey(ERA, track);
const PLACEHOLDER = /hasn.t been written yet/i;

function OpenSong() {
  const a = useAppActions();
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

function hollow(extra: Record<string, unknown> = {}) {
  Object.assign(track, {
    discussion: undefined,
    dossier: { connections: [], sources: [] },
    ...extra,
  });
}

describe('TrackDetail — hollow dossier (#4798)', () => {
  afterEach(cleanup);

  it('a connections-only dossier with no narrative still shows the honest placeholder', () => {
    hollow();
    mount();
    expect(screen.getByText(PLACEHOLDER)).toBeInTheDocument();
  });

  it('a connections-only dossier with a discussion shows the story, not the placeholder', () => {
    hollow({ discussion: ['A distinctive story paragraph.'] });
    mount();
    expect(screen.getByText('The story')).toBeInTheDocument();
    expect(screen.queryByText(PLACEHOLDER)).toBeNull();
  });

  it('a dossier with whyItMatters shows no placeholder', () => {
    hollow({ dossier: { whyItMatters: ['Why it matters.'], connections: [], sources: [] } });
    mount();
    expect(screen.queryByText(PLACEHOLDER)).toBeNull();
  });
});
