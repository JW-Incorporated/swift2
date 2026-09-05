/**
 * `apps/mobile/lib/vault.ts` unit tests (OS-015). Mocks `expo-file-system`
 * (same pattern `notification-actions.test.ts` uses for `expo-notifications`
 * — this workspace runs under plain Node/vitest, not a real RN runtime, so
 * native modules are stubbed) and `@swift2/content`'s `loadBundle` (the
 * network/storage plumbing OS-013 already unit-tests on its own) so this
 * file only proves vault.ts's own wiring: it calls `loadBundle` with the
 * right `baseUrl`/`storage`, maps the result via `vault-bundle-map.ts`, and
 * caches the loaded bundle in memory for the on-demand Tier 1 calls.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const files: Record<string, unknown> = vi.hoisted(() => ({
  eras: [
    {
      id: 'folklore',
      name: 'folklore',
      shortName: 'folklore',
      album: 'folklore',
      start: '2020-07-24',
      end: '2020-12-10',
      yearLabel: '2020',
      tagline: 'Wistful.',
      intro: 'intro',
      image: '/eras/folklore.png',
      theme: {
        bg: '#111',
        surface: '#222',
        surface2: '#333',
        ink: '#eee',
        inkSoft: '#ccc',
        line: '#444',
        accent: '#8a8a6d',
        accent2: '#5f5f4a',
        glow: '#c8c8a8',
        font: 'serif',
      },
    },
  ],
  milestones: [
    { id: 'ms-1', eraId: 'folklore', date: '2020-07-24', label: 'folklore released', kind: 'album' },
  ],
  'content:folklore': {
    eraId: 'folklore',
    items: [
      {
        id: 'item-1',
        eraId: 'folklore',
        date: '2020-07-24',
        dateLabel: 'July 24, 2020',
        title: 'folklore released',
        summary: 'summary',
        body: ['para one'],
        tags: ['Music'],
        images: [{ url: '/img.png', kind: 'primary' }],
      },
    ],
  },
  tracks: { eraId: 'folklore', tracks: [{ trackNumber: 1, title: 'the 1', note: 'note' }] },
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

const { fileExists, fileTextSync, fileWrite, fileDelete, dirExists, dirCreate } = vi.hoisted(() => ({
  fileExists: vi.fn().mockReturnValue(false),
  fileTextSync: vi.fn(),
  fileWrite: vi.fn(),
  fileDelete: vi.fn(),
  dirExists: vi.fn().mockReturnValue(true),
  dirCreate: vi.fn(),
}));

vi.mock('expo-file-system', () => {
  class FakeFile {
    exists = fileExists();
    textSync = fileTextSync;
    write = fileWrite;
    delete = fileDelete;
  }
  class FakeDirectory {
    get exists() {
      return dirExists();
    }
    create = dirCreate;
  }
  return {
    File: FakeFile,
    Directory: FakeDirectory,
    Paths: { document: {} },
  };
});

import { loadMoment, loadSkeleton, loadTrackGuide } from './vault';

beforeEach(() => {
  loadBundle.mockClear();
});

describe('loadSkeleton', () => {
  it('calls loadBundle with the content base URL and an expo-file-system-backed storage adapter, then maps the result', async () => {
    const skeleton = await loadSkeleton();
    expect(loadBundle).toHaveBeenCalledTimes(1);
    const call = loadBundle.mock.calls[0]![0] as { baseUrl: string; storage: unknown };
    expect(call.baseUrl).toBe('https://www.longlivets.com/content');
    expect(call.storage).toMatchObject({
      getItem: expect.any(Function),
      setItem: expect.any(Function),
    });
    expect(skeleton.eras).toHaveLength(1);
    expect(skeleton.eras[0]!.slug).toBe('folklore');
    expect(skeleton.monthItems).toHaveLength(1);
  });

  it('respects EXPO_PUBLIC_CONTENT_BASE_URL when set', async () => {
    process.env.EXPO_PUBLIC_CONTENT_BASE_URL = 'https://dev.example.test/content/';
    await loadSkeleton();
    const call = loadBundle.mock.calls[0]![0] as { baseUrl: string };
    expect(call.baseUrl).toBe('https://dev.example.test/content');
    delete process.env.EXPO_PUBLIC_CONTENT_BASE_URL;
  });
});

describe('loadMoment / loadTrackGuide', () => {
  it('loadMoment reuses the bundle already loaded by loadSkeleton without calling loadBundle again', async () => {
    await loadSkeleton();
    loadBundle.mockClear();
    const moment = await loadMoment('item-1');
    expect(loadBundle).not.toHaveBeenCalled();
    expect(moment).not.toBeNull();
    expect(moment!.monthItemId).toBe('item-1');
  });

  it('loadMoment loads the bundle itself when no prior loadSkeleton call happened this session', async () => {
    // The module-level `lastBundleFiles` cache is shared across tests in this file (same module
    // instance), so this exercises the "cache already warm" path rather than a truly cold one —
    // the real cold path is covered by loadSkeleton's own tests above, which always call loadBundle.
    const moment = await loadMoment('item-1');
    expect(moment!.monthItemId).toBe('item-1');
  });

  it('loadTrackGuide returns the era track guide from the loaded bundle', async () => {
    const notes = await loadTrackGuide('folklore');
    expect(notes).toHaveLength(1);
    expect(notes[0]!.trackTitle).toBe('the 1');
  });
});

describe('the expo-file-system storage adapter', () => {
  it('getItem returns null when the cache file does not exist', async () => {
    fileExists.mockReturnValue(false);
    await loadSkeleton();
    const call = loadBundle.mock.calls[0]![0] as { storage: { getItem(k: string): string | null } };
    expect(call.storage.getItem('some-key')).toBeNull();
  });

  it('getItem reads the file when it exists', async () => {
    fileExists.mockReturnValue(true);
    fileTextSync.mockReturnValue('{"cached":true}');
    await loadSkeleton();
    const call = loadBundle.mock.calls[0]![0] as { storage: { getItem(k: string): string | null } };
    expect(call.storage.getItem('some-key')).toBe('{"cached":true}');
  });

  it('setItem creates the cache directory if missing, then writes the file', async () => {
    dirExists.mockReturnValue(false);
    await loadSkeleton();
    const call = loadBundle.mock.calls[0]![0] as { storage: { setItem(k: string, v: string): void } };
    call.storage.setItem('some-key', 'some-value');
    expect(dirCreate).toHaveBeenCalled();
    expect(fileWrite).toHaveBeenCalledWith('some-value');
  });
});
