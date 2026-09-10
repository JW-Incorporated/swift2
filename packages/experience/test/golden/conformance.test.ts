/**
 * OS-026 — Core conformance suite.
 *
 * Golden tests any renderer can be checked against
 * (docs/specs/2026-09-05-one-source-three-surfaces.md §6, Phase 2). This is
 * NOT a test of any particular renderer — it snapshots the pure VIEW-MODELS
 * `packages/experience` produces for a fixed fixture bundle (the same
 * `@swift2/content` fixture OS-010's `fixture-bundle.test.ts` validates) and
 * a fixed list of deep links. Both `apps/web` and any future native
 * renderer (OS-032+) must render from these exact inputs; if a renderer
 * change alters what the headless core hands it, the diff shows up here
 * first, in a snapshot review, rather than as a silent visual drift between
 * the two surfaces.
 *
 * Loads the fixture bundle through the REAL `@swift2/content` loader
 * (`loadBundle`) via an in-memory `fetch` stand-in that serves the on-disk
 * fixture files — the same code path a real renderer's bundle fetch takes,
 * not a hand-rolled shortcut — then wires the loaded, already-validated
 * files into `packages/experience`'s injected providers exactly the way
 * `apps/web/lib/longlive/{threads,era-secrets,vault-wiring}.ts` do, so the
 * conformance suite exercises the real seam between Layer 1 and Layer 2.
 *
 * `npx vitest run -u` re-records the snapshot after an intentional change;
 * review the diff before committing it — an unexplained golden-file change
 * is exactly the regression this suite exists to catch.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadBundle, type FetchResponseLike } from '@swift2/content';
import {
  deepLinkTarget,
  eraSecretsForEra,
  getEra,
  mergeEraFeed,
  resolveTrackKey,
  setContentItemLookup,
  setEraSecretsRawProvider,
  setSongTargetResolver,
  setTheoriesRawProvider,
  setThreadContentProvider,
  setTracksRawProvider,
  spaceDoorways,
  threadDoorwaysForEra,
  eggDoorwaysForEra,
  theoriesForEra,
  keepExploring,
  releasedFactValue,
  trackKey,
  tracksForEra,
  visibleFeed,
  type ContentItem,
  type EraId,
  type EraSecret,
  type TheoryNote,
  type TrackNote,
  type VideoNote,
} from '../../src/index';

const bundleDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'content',
  'src',
  'fixtures',
  'bundle',
);

/** In-memory `fetch` that serves the on-disk OS-010 fixture bundle over the
 * exact `current.json` / `<version>/manifest.json` / `<version>/<path>` wire
 * shape `loadBundle` expects — a real HTTP publish target isn't needed for
 * this suite to exercise the real loader code path. */
function fixtureFetch(): (url: string) => Promise<FetchResponseLike> {
  const manifest = JSON.parse(readFileSync(join(bundleDir, 'manifest.json'), 'utf8')) as {
    bundleVersion: string;
  };
  const ok = (body: string): FetchResponseLike => ({
    ok: true,
    status: 200,
    text: async () => body,
    headers: { get: () => null },
  });
  return async (url: string) => {
    if (url.endsWith('/current.json')) {
      return ok(JSON.stringify({ bundleVersion: manifest.bundleVersion }));
    }
    if (url.endsWith('/manifest.json')) {
      return ok(readFileSync(join(bundleDir, 'manifest.json'), 'utf8'));
    }
    const marker = `${manifest.bundleVersion}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) throw new Error(`fixtureFetch: unexpected URL ${url}`);
    const relPath = url.slice(idx + marker.length);
    return ok(readFileSync(join(bundleDir, relPath), 'utf8'));
  };
}

/** Every kind of deep link the front door resolves (deepLink.ts's precedence
 * order) plus a bare/unknown one, so the golden file covers the whole union. */
const DEEP_LINKS: readonly string[] = [
  '?item=vault-folklore-001',
  `?song=${encodeURIComponent(trackKey('folklore', { trackNumber: 1, title: 'the 1' }))}`,
  '?guide=folklore',
  '?theories=folklore',
  '?mode=threads',
  '?era=folklore',
  '?nonsense=1',
];

const ERA_ID: EraId = 'folklore';

describe('OS-026 core conformance suite', () => {
  let content: ContentItem[];
  let videos: VideoNote[];

  beforeAll(async () => {
    const loaded = await loadBundle({ baseUrl: 'https://fixture.invalid/content', fetch: fixtureFetch() });

    const eras = loaded.files.eras as { id: string }[];
    const contentByEra = new Map<string, { eraId: string; items: ContentItem[] }>();
    for (const [name, value] of Object.entries(loaded.files)) {
      if (name.startsWith('content:')) {
        const file = value as { eraId: string; items: ContentItem[] };
        contentByEra.set(file.eraId, file);
      }
    }
    content = [...contentByEra.values()].flatMap((f) => f.items);

    const tracksFile = loaded.files.tracks as { eraId: EraId; tracks: TrackNote[] };
    setTracksRawProvider({ [tracksFile.eraId]: tracksFile.tracks });

    const theoriesFile = loaded.files.theories as { eraId: EraId; theories: TheoryNote[] };
    setTheoriesRawProvider(() => ({ [theoriesFile.eraId]: theoriesFile.theories }));

    const eraSecretsFile = loaded.files.eraSecrets as { eraId: EraId; secrets: EraSecret[] };
    setEraSecretsRawProvider(() => ({ [eraSecretsFile.eraId]: eraSecretsFile.secrets }));

    setThreadContentProvider(() => content);
    setContentItemLookup((id) => content.find((c) => c.id === id));
    setSongTargetResolver((relatedId) => {
      if (!relatedId.startsWith('song:')) return null;
      const slug = relatedId.slice('song:'.length);
      const track = tracksFile.tracks.find((t) => t.slug === slug);
      return track ? { eraId: tracksFile.eraId, track } : null;
    });

    videos = (loaded.files.videos as { videos: VideoNote[] }).videos;
    void eras;
  });

  it('resolves every deep link in the fixture to the same target both renderers must dispatch on', () => {
    const validLensIds = ['love-story', 'fashion', 'taylors-version', 'easter-eggs', 'hidden-clues', 'the-proposal'];
    const resolved = DEEP_LINKS.map((search) => ({
      search,
      target: deepLinkTarget(search, validLensIds),
    }));
    expect(resolved).toMatchSnapshot('deep-link-targets');
  });

  it('builds the folklore era stream section view-model from the fixture bundle', () => {
    const era = getEra(ERA_ID);
    const eraContent = content.filter((c) => c.eraId === ERA_ID);
    const merged = mergeEraFeed(eraContent, videos, era.start, era.end, [
      ...threadDoorwaysForEra(ERA_ID, era.start, era.end),
      ...eggDoorwaysForEra(ERA_ID, era.start, era.end),
    ]);
    const spaced = spaceDoorways(merged);
    const visible = visibleFeed(spaced, new Set());
    expect(visible).toMatchSnapshot('era-stream-section-folklore');
  });

  it('builds a thread timeline view-model (love-story) from the fixture bundle', () => {
    // The fixture's single moment carries no `threadIds`, so this
    // deliberately snapshots the empty-but-well-formed timeline shape a
    // renderer must handle — not just the happy path.
    const timeline = content
      .filter((c) => c.threadIds?.includes('love-story'))
      .sort((a, b) => a.date.localeCompare(b.date));
    expect(timeline).toMatchSnapshot('thread-timeline-love-story');
  });

  it('builds the folklore track guide page view-model from the fixture bundle', () => {
    const tracks = tracksForEra(ERA_ID);
    const pages = tracks.map((track) => ({
      key: trackKey(ERA_ID, track),
      title: track.title,
      trackNumber: track.trackNumber,
      note: track.note,
      releasedFact: track.facts ? releasedFactValue(track.facts) : undefined,
      keepExploring: keepExploring(ERA_ID, track),
    }));
    expect(pages).toMatchSnapshot('track-guide-folklore');

    // resolveTrackKey must round-trip every key trackKey() produced above —
    // the ?song= deep link's whole contract.
    for (const page of pages) {
      const resolved = resolveTrackKey(page.key);
      expect(resolved?.track.title).toBe(page.title);
    }
  });

  it('builds the folklore theories/eggs and era-secret view-models from the fixture bundle', () => {
    const theories = theoriesForEra(ERA_ID);
    const secrets = eraSecretsForEra(ERA_ID);
    expect({ theories, secrets }).toMatchSnapshot('theories-and-secrets-folklore');
  });
});
