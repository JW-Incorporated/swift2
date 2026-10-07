import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { buildSearchIndex } from './__fixtures__/legacy-search-builder';
import { PARITY_MODES, PARITY_QUERIES } from './parity-queries';
import golden from './search-golden-frozen.fixture.json';
import { searchDocs } from './search';
import './tracks';

vi.mock('./content-vault.generated', async () => await import('../../../../scripts/parity/fixture/web/content-vault.generated'));
vi.mock('./tracks.generated', async () => await import('../../../../scripts/parity/fixture/web/tracks.generated'));
vi.mock('./theories-bundle.generated', async () => await import('../../../../scripts/parity/fixture/web/theories-bundle.generated'));
vi.mock('./videos-bundle.generated', async () => await import('../../../../scripts/parity/fixture/web/videos-bundle.generated'));
vi.mock('./era-secrets.generated', async () => await import('../../../../scripts/parity/fixture/web/era-secrets.generated'));
vi.mock('./merch.generated', async () => await import('../../../../scripts/parity/fixture/web/merch.generated'));
vi.mock('./song-moods.generated', async () => await import('../../../../scripts/parity/fixture/web/song-moods.generated'));

// Provenance: the committed golden is exactly what the recovered legacy builder
// (__fixtures__/legacy-search-builder.ts) produces over the frozen fixture.
// Regenerate with `node scripts/parity/regen-search-golden.mjs`.
function regenerate(): Record<string, unknown> {
  const index = buildSearchIndex();
  const out: Record<string, unknown> = {};
  for (const q of PARITY_QUERIES)
    for (const m of PARITY_MODES) {
      const limit = m === 'all' ? Number.POSITIVE_INFINITY : undefined;
      out[`${q}|${m}`] = searchDocs(index, q, limit).map((g) => ({
        type: g.type,
        total: g.totalMatches,
        results: g.results.map((r) => ({ key: r.doc.key, score: r.score, eraId: r.doc.eraId, target: r.doc.target })),
      }));
    }
  return out;
}

describe('search golden provenance', () => {
  it('has exactly 28 queries', () => {
    expect(PARITY_QUERIES.length).toBe(28);
    expect(Object.keys(golden).length).toBe(28 * PARITY_MODES.length);
  });

  it('legacy builder over the frozen fixture deep-equals the committed golden', () => {
    const fresh = regenerate();
    if (process.env.REGEN_SEARCH_GOLDEN === '1') {
      const path = fileURLToPath(new URL('./search-golden-frozen.fixture.json', import.meta.url));
      writeFileSync(path, `${JSON.stringify(fresh, null, 1)}\n`);
    }
    expect(JSON.parse(JSON.stringify(fresh))).toEqual(golden);
  });
});
