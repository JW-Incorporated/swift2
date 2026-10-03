import { describe, expect, it, vi } from 'vitest';
import { eraVideoFeed } from '@swift2/content-enrichment';
import { fromBaked } from '@swift2/experience/reader-snapshot';
import { bakedModulesFull } from './baked-modules-full';
import { PARITY_MODES, PARITY_QUERIES } from './parity-queries';
import golden from './search-golden-frozen.fixture.json';
import { searchDocs } from './search';
import './tracks';

// The frozen parity fixture (scripts/parity/fixture/web) stands in for the
// generated content, so this golden never moves with content PRs.
vi.mock('./content-vault.generated', async () => await import('../../../../scripts/parity/fixture/web/content-vault.generated'));
vi.mock('./tracks.generated', async () => await import('../../../../scripts/parity/fixture/web/tracks.generated'));
vi.mock('./theories-bundle.generated', async () => await import('../../../../scripts/parity/fixture/web/theories-bundle.generated'));
vi.mock('./videos-bundle.generated', async () => await import('../../../../scripts/parity/fixture/web/videos-bundle.generated'));
vi.mock('./era-secrets.generated', async () => await import('../../../../scripts/parity/fixture/web/era-secrets.generated'));
vi.mock('./merch.generated', async () => await import('../../../../scripts/parity/fixture/web/merch.generated'));
vi.mock('./song-moods.generated', async () => await import('../../../../scripts/parity/fixture/web/song-moods.generated'));

// search-golden-frozen.fixture.json was generated ONCE from the pre-WP2.2-B web
// builder (apps/web/lib/longlive/search.ts at 5dad3b21^, since deleted) over this
// same frozen fixture content, for every result group (moments, tracks, theories,
// videos, eras, eggs, threads; merch is not searchable in either builder). It is
// asserted here against the NEW snapshot index, so it proves equivalence.
describe('golden: all result groups, frozen fixture, old builder vs snapshot index', () => {
  const index = fromBaked(bakedModulesFull(), { eraVideoFeed }).domains.searchIndex;
  const shape = (groups: ReturnType<typeof searchDocs>) =>
    groups.map((g) => ({
      type: g.type,
      total: g.totalMatches,
      results: g.results.map((r) => ({ key: r.doc.key, score: r.score, eraId: r.doc.eraId, target: r.doc.target })),
    }));

  it('covers at least 20 queries and every group type', () => {
    expect(PARITY_QUERIES.length).toBeGreaterThanOrEqual(20);
    const types = new Set(Object.values(golden).flatMap((gs) => (gs as { type: string }[]).map((g) => g.type)));
    expect([...types].sort()).toEqual(['egg', 'era', 'moment', 'theory', 'thread', 'track', 'video']);
  });

  for (const q of PARITY_QUERIES)
    for (const m of PARITY_MODES)
      it(`${q}|${m}`, () => {
        const limit = m === 'all' ? Number.POSITIVE_INFINITY : undefined;
        expect(shape(searchDocs(index, q, limit))).toEqual((golden as Record<string, unknown>)[`${q}|${m}`]);
      });
});
