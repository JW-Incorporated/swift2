import { describe, expect, it } from 'vitest';
import { build } from './content';
import { VAULT_RAW } from './content-vault.generated';
import {
  BODY_FLOOR_CHARS,
  BODY_SATURATION_CHARS,
  PHOTO_SATURATION,
  SUBSTANCE_WEIGHTS,
  WEIGHT_BODY,
  WEIGHT_PHOTOS,
  bodyChars,
  realPhotoCount,
  substanceScore,
} from './substance';
import type { ContentItem, EraId } from './types';

const realImg = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    url: `https://example.com/${i}.jpg`,
    kind: 'primary' as const,
  }));
const eraArtOnly = [{ url: '/eras/debut.png', kind: 'primary' as const }];

function item(overrides: Partial<ContentItem> & { id: string }): ContentItem {
  return {
    eraId: 'debut',
    date: '2020-01-01',
    dateLabel: 'January 2020',
    title: 'Title',
    summary: 'A summary.',
    body: [],
    tags: [],
    images: eraArtOnly,
    ...overrides,
  };
}

/** Body prose of exactly `n` characters. */
const bodyOf = (n: number) => ['x'.repeat(n)];

/** Every real item in the vault, built the same way the app builds them. */
const ALL_VAULT_ITEMS: ContentItem[] = (Object.keys(VAULT_RAW) as EraId[]).flatMap((eraId) =>
  build(eraId, VAULT_RAW[eraId] ?? []),
);

const byId = (id: string): ContentItem => {
  const found = ALL_VAULT_ITEMS.find((c) => c.id === id);
  if (!found) throw new Error(`vault item not found: ${id}`);
  return found;
};

describe('substance weights', () => {
  it('sum to exactly 1, so the score is a true 0..1 with no hidden rescaling', () => {
    const sum = Object.values(SUBSTANCE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it('gives body and photos equal co-lead weight — body length alone cannot carry the spread', () => {
    expect(WEIGHT_BODY).toBe(WEIGHT_PHOTOS);
    for (const [name, w] of Object.entries(SUBSTANCE_WEIGHTS)) {
      if (name === 'body' || name === 'photos') continue;
      expect(w).toBeLessThan(WEIGHT_BODY);
    }
  });
});

describe('substanceScore', () => {
  it('returns 0 for an item with no signal at all', () => {
    expect(substanceScore(item({ id: 'a' }))).toBe(0);
  });

  it('returns 1 for an item that saturates every signal', () => {
    const maxed = item({
      id: 'a',
      body: bodyOf(BODY_SATURATION_CHARS * 2),
      images: realImg(PHOTO_SATURATION + 3),
      sources: Array.from({ length: 9 }, (_, i) => ({ name: `s${i}`, url: `https://e.com/${i}` })),
      relatedIds: ['moment:a', 'moment:b', 'moment:c', 'moment:d'],
      rumors: [
        {
          claim: 'c',
          reportedBy: 'o',
          reportedOn: '2020-01-01',
          status: 'unconfirmed',
          url: 'https://e.com',
        },
        {
          claim: 'd',
          reportedBy: 'o',
          reportedOn: '2020-01-02',
          status: 'unconfirmed',
          url: 'https://e.com',
        },
      ],
      video: { youtubeId: 'abc', title: 'v' },
      hiddenClue: { clue: 'c', payoff: 'p' },
      pullQuote: 'q',
    });
    expect(substanceScore(maxed)).toBe(1);
  });

  it('stays within 0..1 for every one of the real vault items', () => {
    expect(ALL_VAULT_ITEMS.length).toBeGreaterThan(600);
    for (const it of ALL_VAULT_ITEMS) {
      const s = substanceScore(it);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
      expect(Number.isFinite(s)).toBe(true);
    }
  });

  it('is pure — the same item scores identically every call', () => {
    for (const it of ALL_VAULT_ITEMS.slice(0, 50)) {
      expect(substanceScore(it)).toBe(substanceScore(it));
    }
  });

  it('does not read significance — two items identical but for significance score the same', () => {
    const base = { body: bodyOf(800), images: realImg(2) };
    const plain = item({ id: 'a', ...base });
    const defining = item({ id: 'a', ...base, significance: 'defining' });
    expect(substanceScore(defining)).toBe(substanceScore(plain));
  });

  it('ignores the era-art stand-in when counting photos', () => {
    expect(realPhotoCount(item({ id: 'a', images: eraArtOnly }))).toBe(0);
    expect(substanceScore(item({ id: 'a', images: eraArtOnly }))).toBe(0);
    expect(substanceScore(item({ id: 'a', images: realImg(1) }))).toBeGreaterThan(0);
  });

  it('counts reference and archival images as real photos — they are still page', () => {
    const withArchival = item({
      id: 'a',
      images: [
        { url: 'https://example.com/a.jpg', kind: 'primary' },
        { url: 'https://example.com/b.jpg', kind: 'archival' },
      ],
    });
    expect(realPhotoCount(withArchival)).toBe(2);
  });

  it('is monotonic in photo count', () => {
    const scores = [0, 1, 2, 3, 4, 5].map((n) =>
      substanceScore(item({ id: 'a', images: n === 0 ? eraArtOnly : realImg(n) })),
    );
    for (let i = 1; i < scores.length; i++) expect(scores[i]).toBeGreaterThan(scores[i - 1]);
  });

  it('is monotonic in body length above the floor', () => {
    const scores = [300, 500, 800, 1200].map((n) =>
      substanceScore(item({ id: 'a', body: bodyOf(n) })),
    );
    for (let i = 1; i < scores.length; i++) expect(scores[i]).toBeGreaterThan(scores[i - 1]);
  });

  it('is monotonic in sources, relatedIds and rumors', () => {
    const src = (n: number) =>
      substanceScore(
        item({
          id: 'a',
          sources: Array.from({ length: n }, (_, i) => ({ name: 's', url: `https://e.com/${i}` })),
        }),
      );
    expect(src(3)).toBeGreaterThan(src(1));
    const rel = (n: number) =>
      substanceScore(item({ id: 'a', relatedIds: Array.from({ length: n }, (_, i) => `m:${i}`) }));
    expect(rel(2)).toBeGreaterThan(rel(0));
  });

  it('scores a body at or below the floor as zero body contribution — a stub is a stub', () => {
    expect(substanceScore(item({ id: 'a', body: bodyOf(BODY_FLOOR_CHARS) }))).toBe(0);
    expect(substanceScore(item({ id: 'a', body: bodyOf(BODY_FLOOR_CHARS - 50) }))).toBe(0);
  });

  it('log-scales the body so the crowded low end resolves and the long tail compresses', () => {
    const at = (n: number) => substanceScore(item({ id: 'a', body: bodyOf(n) }));
    // The corpus is p10 353 / p50 635 / p90 885 chars. Linear scaling would
    // give 635->885 (250 chars) a BIGGER contribution than 353->635 (282
    // chars) is worth relative to the range; log scaling must do the reverse,
    // so the p10..p50 half of the corpus is where the tiers actually separate.
    const lowGain = at(635) - at(353);
    const highGain = at(885) - at(635);
    expect(lowGain).toBeGreaterThan(highGain);
  });

  it('saturates the body signal so a rare 2000-char outlier cannot stretch the scale', () => {
    const at = (n: number) => substanceScore(item({ id: 'a', body: bodyOf(n) }));
    expect(at(BODY_SATURATION_CHARS)).toBe(at(2000));
    expect(at(BODY_SATURATION_CHARS)).toBeCloseTo(WEIGHT_BODY, 10);
  });

  it('saturates rather than letting a 13-photo outlier run away with the scale', () => {
    const at = substanceScore(item({ id: 'a', images: realImg(PHOTO_SATURATION) }));
    const way = substanceScore(item({ id: 'a', images: realImg(13) }));
    expect(way).toBe(at);
  });

  it('sums body length across paragraphs, not paragraph count', () => {
    expect(bodyChars(item({ id: 'a', body: ['abc', 'de'] }))).toBe(5);
    const oneLong = substanceScore(item({ id: 'a', body: bodyOf(900) }));
    const splitSame = substanceScore(item({ id: 'a', body: [bodyOf(450)[0], bodyOf(450)[0]] }));
    expect(oneLong).toBe(splitSame);
  });
});

describe('substanceScore over real vault content', () => {
  it('ranks the MSG wedding — 1988 chars, 6 photos, 5 sources — near the top of the corpus', () => {
    const wedding = byId('vault-tloas-taylor-and-travis-marry-at-madison-square-garden');
    const score = substanceScore(wedding);
    expect(score).toBeGreaterThan(0.8);
    const higher = ALL_VAULT_ITEMS.filter((c) => substanceScore(c) > score).length;
    expect(higher).toBe(0);
  });

  // Thin fixture repointed 2026-07-24 (ledger #1274): the Answerer enriched the
  // former fixture ("Orange sequins and feathers") with sourced provenance,
  // cross-links and the real Gucci/Bob Mackie looks, so it is no longer a valid
  // "bare" example (as its own repoint comment predicted). Repointed to the
  // 1989 "pop reinvention" era-vibe card — a genuinely bare aesthetic marker,
  // and one outside the depth engine's defining-moment/current-era queue, so it
  // should stay a stable thin stand-in rather than rotate every few weeks.
  it('ranks a bare single-announcement item near the bottom', () => {
    const thin = byId('vault-1989-the-pop-reinvention');
    expect(bodyChars(thin)).toBeLessThan(BODY_FLOOR_CHARS + 50);
    expect(substanceScore(thin)).toBeLessThan(0.2);
  });

  it('scores the meaty ring piece above the thin single announcement by a wide margin', () => {
    const meaty = substanceScore(
      byId('vault-tloas-the-ring-an-old-mine-diamond-from-a-goldsmith-taylor-already'),
    );
    const thin = substanceScore(byId('vault-1989-the-pop-reinvention'));
    expect(meaty).toBeGreaterThan(thin * 4);
  });

  it('produces real spread across the corpus, not one clustered band', () => {
    const scores = ALL_VAULT_ITEMS.map(substanceScore).sort((a, b) => a - b);
    const at = (p: number) => scores[Math.floor((scores.length - 1) * p)];
    // The tails are what make a feed look weighted: the corpus's raw body
    // length spans only 2.5x p10..p90 and 5.7x p05..p95, and it bottoms out
    // at a nonzero floor. The composite pulls the extremes much further apart.
    expect(at(0.95) / at(0.05)).toBeGreaterThan(7);
    expect(scores[scores.length - 1] / at(0.1)).toBeGreaterThan(4);
    expect(scores[scores.length - 1]).toBeGreaterThan(0.8);
    expect(at(0.05)).toBeLessThan(0.15);
  });

  it('populates every band of the range — no single band owns the corpus', () => {
    const scores = ALL_VAULT_ITEMS.map(substanceScore);
    const share = (lo: number, hi: number) =>
      scores.filter((s) => s >= lo && s < hi).length / scores.length;
    // Four bands, each a real slice. This is what lets four card tiers exist;
    // before #1017 the `chip` tier held 1.3% of cards, i.e. it did not exist.
    expect(share(0, 0.2)).toBeGreaterThan(0.08);
    expect(share(0.2, 0.3)).toBeGreaterThan(0.15);
    expect(share(0.3, 0.4)).toBeGreaterThan(0.15);
    expect(share(0.4, 1.01)).toBeGreaterThan(0.1);
    for (const [lo, hi] of [
      [0, 0.2],
      [0.2, 0.3],
      [0.3, 0.4],
      [0.4, 1.01],
    ]) {
      expect(share(lo, hi)).toBeLessThan(0.5);
    }
  });

  it('scores authored `defining` items well above the corpus median without being told to', () => {
    const scores = ALL_VAULT_ITEMS.map(substanceScore).sort((a, b) => a - b);
    const median = scores[Math.floor(scores.length / 2)];
    const defining = ALL_VAULT_ITEMS.filter((c) => c.significance === 'defining');
    expect(defining.length).toBeGreaterThan(30);
    const above = defining.filter((c) => substanceScore(c) > median).length;
    // Independent corroboration that the score tracks real importance: the
    // vast majority of items a human marked defining also read as substantial.
    expect(above / defining.length).toBeGreaterThan(0.8);
  });
});
