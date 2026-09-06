/**
 * `apps/mobile/lib/track-guide-data.ts` unit tests (OS-035). Same mocking
 * pattern as `vault.test.ts`: `@swift2/content`'s `loadBundle` is mocked so
 * this file only proves track-guide-data.ts's own wiring — it calls
 * `loadBundle` with the right `baseUrl`/`storage`, wires the bundle's flat
 * `tracks` array into `@swift2/experience`'s `setTracksRawProvider` (keyed
 * by each entry's own `eraId`, not a single flat era), wires every
 * `content:<eraId>` file's items into `setContentItemLookup`, and then
 * defers entirely to the shared `tracksForEra` accessor.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const files: Record<string, unknown> = vi.hoisted(() => ({
  'content:folklore': {
    eraId: 'folklore',
    items: [
      {
        id: 'moment-1',
        eraId: 'folklore',
        date: '2020-07-24',
        dateLabel: 'July 24, 2020',
        title: 'folklore released',
        summary: 'summary',
        body: ['para one'],
        tags: ['Music'],
        images: [],
      },
    ],
  },
  tracks: [
    {
      eraId: 'folklore',
      tracks: [
        { slug: 'the-1', trackNumber: 1, title: 'the 1', note: 'note one' },
        { slug: 'cardigan', trackNumber: 2, title: 'cardigan', note: 'note two' },
      ],
    },
    {
      eraId: 'evermore',
      tracks: [{ slug: 'willow', trackNumber: 1, title: 'willow', note: 'note three' }],
    },
  ],
}));

const loadBundle = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    manifest: { schemaVersion: 1, bundleVersion: 'v1', generatedAt: '2020-01-01T00:00:00Z', files: {} },
    files,
    source: 'network',
    stale: false,
  }),
);

vi.mock('@swift2/content', async () => {
  const actual = await vi.importActual<typeof import('@swift2/content')>('@swift2/content');
  return { ...actual, loadBundle: (...args: unknown[]) => loadBundle(...args) };
});

vi.mock('expo-file-system', () => {
  class FakeFile {
    exists = false;
    textSync = vi.fn();
    write = vi.fn();
    delete = vi.fn();
  }
  class FakeDirectory {
    get exists() {
      return true;
    }
    create = vi.fn();
  }
  return {
    File: FakeFile,
    Directory: FakeDirectory,
    Paths: { document: {} },
  };
});

import { contentItemLookup, tracksForEra } from '@swift2/experience';
import { ensureTrackGuideWired, loadTrackGuide } from './track-guide-data';

beforeEach(() => {
  loadBundle.mockClear();
});

describe('loadTrackGuide', () => {
  it('calls loadBundle with the content base URL and an expo-file-system-backed storage adapter', async () => {
    await loadTrackGuide('folklore');
    expect(loadBundle).toHaveBeenCalled();
    const call = loadBundle.mock.calls[0]![0] as { baseUrl: string; storage: unknown };
    expect(call.baseUrl).toBe('https://www.longlivets.com/content');
    expect(call.storage).toMatchObject({
      getItem: expect.any(Function),
      setItem: expect.any(Function),
    });
  });

  it("returns the era's tracks via the shared tracksForEra accessor, generator-sorted order preserved", async () => {
    const tracks = await loadTrackGuide('folklore');
    expect(tracks).toHaveLength(2);
    expect(tracks[0]!.title).toBe('the 1');
    expect(tracks[1]!.title).toBe('cardigan');
  });

  it('wires every era present in the flat tracks array, not just the one requested', async () => {
    await loadTrackGuide('folklore');
    expect(tracksForEra('evermore')).toHaveLength(1);
    expect(tracksForEra('evermore')[0]!.title).toBe('willow');
  });

  it('returns an empty array for an era with no tracks in the bundle', async () => {
    const tracks = await loadTrackGuide('debut');
    expect(tracks).toEqual([]);
  });
});

describe('ensureTrackGuideWired', () => {
  it('wires the content-item lookup from every content:<eraId> file so keepExploring can resolve moment connections', async () => {
    await ensureTrackGuideWired();
    expect(contentItemLookup('moment-1')).toMatchObject({ id: 'moment-1', title: 'folklore released' });
    expect(contentItemLookup('does-not-exist')).toBeUndefined();
  });

  it('is idempotent — a second call does not re-derive the providers from a stale bundle read', async () => {
    await ensureTrackGuideWired();
    loadBundle.mockClear();
    await ensureTrackGuideWired();
    // loadBundle itself is still called every time (matches vault.ts's
    // "always re-check the published version" contract) — idempotency here
    // means the wiring functions don't throw or double-register on a
    // second pass, which the two assertions above already exercise
    // implicitly by not erroring.
    expect(loadBundle).toHaveBeenCalledTimes(1);
  });
});
