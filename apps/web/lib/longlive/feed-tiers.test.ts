import { describe, expect, it } from 'vitest';
import { build, contentForEra } from './content';
import { VAULT_RAW } from './content-vault.generated';
import { ERAS } from './eras';
import {
  HERO_MIN_GAP,
  HERO_SCORE_THRESHOLD,
  MEDIA_SCORE_THRESHOLD,
  assignFeedTiers,
  baseTierFor,
  type CardTier,
} from './feed-tiers';
import { substanceScore } from './substance';
import type { ContentItem, EraId } from './types';

const realImg = [{ url: 'https://example.com/a.jpg', kind: 'primary' as const }];
const manyImgs = Array.from({ length: 4 }, (_, i) => ({
  url: `https://example.com/${i}.jpg`,
  kind: 'primary' as const,
}));
const eraArtOnly = [{ url: '/eras/debut.png', kind: 'primary' as const }];

/** A body long enough to clear the substance bar on its own terms. */
const meatyBody = ['x'.repeat(700), 'y'.repeat(600)];
const sources = [
  { name: 'A', url: 'https://a.com' },
  { name: 'B', url: 'https://b.com' },
  { name: 'C', url: 'https://c.com' },
  { name: 'D', url: 'https://d.com' },
];

function item(overrides: Partial<ContentItem> & { id: string }): ContentItem {
  return {
    eraId: 'debut',
    date: '2020-01-01',
    dateLabel: 'January 2020',
    title: 'Title',
    summary: 'A summary.',
    body: ['One paragraph.'],
    tags: [],
    images: eraArtOnly,
    ...overrides,
  };
}

/** A synthetic item guaranteed to clear HERO_SCORE_THRESHOLD. */
const substantial = (id: string, extra: Partial<ContentItem> = {}): ContentItem =>
  item({ id, images: manyImgs, body: meatyBody, sources, tags: ['Music'], ...extra });

/** A synthetic item guaranteed to sit below MEDIA_SCORE_THRESHOLD. */
const slight = (id: string, extra: Partial<ContentItem> = {}): ContentItem =>
  item({ id, images: realImg, body: ['Short.'], tags: ['Tour'], ...extra });

// ── Real vault content ──────────────────────────────────────────────────────
// VAULT_RAW is Partial<Record<EraId, VaultRawItem[]>>; build() is the same
// normalisation the app runs, so these are the exact ContentItems the feed
// renders.
const ALL_VAULT_ITEMS: ContentItem[] = (Object.keys(VAULT_RAW) as EraId[]).flatMap((eraId) =>
  build(eraId, VAULT_RAW[eraId] ?? []),
);

/** Tiers for every era, assigned over the real per-era feed sequence — the
 * same call EraSection makes (`assignFeedTiers(contentForEra(era.id))`). */
function realFeedTiers(): Map<string, CardTier> {
  const all = new Map<string, CardTier>();
  for (const era of ERAS) {
    for (const [id, tier] of assignFeedTiers(contentForEra(era.id))) all.set(id, tier);
  }
  return all;
}

const REAL_TIERS = realFeedTiers();

const realTier = (id: string): CardTier => {
  const t = REAL_TIERS.get(id);
  if (!t) throw new Error(`no tier for vault item: ${id}`);
  return t;
};

describe('baseTierFor — the pure, per-item tier', () => {
  it('gives a substantial item with a real photo the hero tier', () => {
    expect(substanceScore(substantial('a'))).toBeGreaterThanOrEqual(HERO_SCORE_THRESHOLD);
    expect(baseTierFor(substantial('a'))).toBe('hero');
  });

  it('gives a slight item with a real photo the compact chip tier', () => {
    expect(substanceScore(slight('a'))).toBeLessThan(MEDIA_SCORE_THRESHOLD);
    expect(baseTierFor(slight('a'))).toBe('chip');
  });

  it('gives a mid-substance photo item the workhorse media tier', () => {
    const mid = item({
      id: 'a',
      images: realImg,
      body: ['x'.repeat(900)],
      sources: sources.slice(0, 2),
      tags: ['Music'],
    });
    const s = substanceScore(mid);
    expect(s).toBeGreaterThanOrEqual(MEDIA_SCORE_THRESHOLD);
    expect(s).toBeLessThan(HERO_SCORE_THRESHOLD);
    expect(baseTierFor(mid)).toBe('media');
  });

  it('gives text tier to an item with only the era-art fallback, however substantial', () => {
    const noPhoto = item({ id: 'a', images: eraArtOnly, body: meatyBody, sources });
    expect(substanceScore(noPhoto)).toBeGreaterThan(MEDIA_SCORE_THRESHOLD);
    expect(baseTierFor(noPhoto)).toBe('text');
  });

  it('never depends on position — the same item scores the same tier in isolation', () => {
    const it = substantial('a');
    expect(baseTierFor(it)).toBe(baseTierFor(it));
  });
});

describe('assignFeedTiers — significance overrides', () => {
  it('gives a defining item hero tier even with no image, video or body', () => {
    const items = [item({ id: 'a', images: eraArtOnly, significance: 'defining' })];
    expect(assignFeedTiers(items).get('a')).toBe('hero');
  });

  it('never spaces out defining items — two back to back both render hero', () => {
    const items = [
      item({ id: 'a', images: realImg, significance: 'defining' }),
      item({ id: 'b', images: realImg, significance: 'defining' }),
    ];
    const tiers = assignFeedTiers(items);
    expect(tiers.get('a')).toBe('hero');
    expect(tiers.get('b')).toBe('hero');
  });

  it('never lets a low computed score pull a defining item below hero', () => {
    const barren = item({ id: 'a', images: eraArtOnly, body: [], significance: 'defining' });
    expect(substanceScore(barren)).toBe(0);
    expect(assignFeedTiers([barren]).get('a')).toBe('hero');
  });

  it('gives a notable item at least media tier even when it scores as slight', () => {
    const it = slight('a', { significance: 'notable' });
    expect(substanceScore(it)).toBeLessThan(MEDIA_SCORE_THRESHOLD);
    expect(assignFeedTiers([it]).get('a')).toBe('media');
  });

  it('gives a notable item media tier even with no real photo at all', () => {
    const it = item({ id: 'a', images: eraArtOnly, significance: 'notable' });
    expect(assignFeedTiers([it]).get('a')).toBe('media');
  });

  it('still lets a notable item earn hero on substance — the floor is a floor, not a ceiling', () => {
    const it = substantial('a', { significance: 'notable' });
    expect(assignFeedTiers([it]).get('a')).toBe('hero');
  });
});

describe('assignFeedTiers — pacing', () => {
  it('spaces out score-derived heroes rather than stacking two adjacent', () => {
    const tiers = assignFeedTiers([substantial('a'), substantial('b')]);
    expect(tiers.get('a')).toBe('hero');
    expect(tiers.get('b')).not.toBe('hero');
  });

  it('steps a spaced-out hero down exactly one tier, to media — never to chip or text', () => {
    const tiers = assignFeedTiers([substantial('a'), substantial('b')]);
    expect(tiers.get('b')).toBe('media');
  });

  it('lets a second hero through once the minimum gap has passed', () => {
    const filler = Array.from({ length: HERO_MIN_GAP + 3 }, (_, i) => slight(`f${i}`));
    const tiers = assignFeedTiers([substantial('a'), ...filler, substantial('b')]);
    expect(tiers.get('a')).toBe('hero');
    expect(tiers.get('b')).toBe('hero');
  });

  it('is aperiodic — hero spacing varies by id, it is not a fixed beat', () => {
    const gaps = new Set<number>();
    for (let seed = 0; seed < 40; seed++) {
      // Find, per id, the smallest filler run after which a hero is allowed.
      for (let n = 0; n <= HERO_MIN_GAP + 4; n++) {
        const filler = Array.from({ length: n }, (_, i) => slight(`f${seed}-${i}`));
        const tiers = assignFeedTiers([substantial(`h${seed}`), ...filler, substantial(`k${seed}`)]);
        if (tiers.get(`k${seed}`) === 'hero') {
          gaps.add(n);
          break;
        }
      }
    }
    expect(gaps.size).toBeGreaterThan(1);
  });

  // ── The #1017 regression guard ────────────────────────────────────────────
  it('NEVER demotes a substantial item to text because of its position in a run', () => {
    const wall = Array.from({ length: 20 }, (_, i) => substantial(`m${i}`));
    const tiers = assignFeedTiers(wall);
    for (const it of wall) {
      expect(tiers.get(it.id)).not.toBe('text');
      expect(tiers.get(it.id)).not.toBe('chip');
    }
  });

  it('never demotes any item below its own base tier by more than the hero->media step', () => {
    const order: CardTier[] = ['text', 'chip', 'media', 'hero'];
    const mixed = Array.from({ length: 30 }, (_, i) =>
      i % 3 === 0 ? substantial(`s${i}`) : i % 3 === 1 ? slight(`l${i}`) : item({ id: `t${i}` }),
    );
    const tiers = assignFeedTiers(mixed);
    for (const it of mixed) {
      const base = order.indexOf(baseTierFor(it));
      const final = order.indexOf(tiers.get(it.id)!);
      expect(final).toBeGreaterThanOrEqual(base - 1);
      expect(final).toBeLessThanOrEqual(base);
    }
  });

  it('never demotes an item with a hidden clue away from an image tier', () => {
    const run = Array.from({ length: 6 }, (_, i) => substantial(`m${i}`));
    const clueItem = substantial('clue', { hiddenClue: { clue: 'c', payoff: 'p' } });
    const tiers = assignFeedTiers([...run, clueItem]);
    expect(tiers.get('clue')).not.toBe('text');
    expect(tiers.get('clue')).not.toBe('chip');
  });

  it('is a pure function of the sequence — same input always produces the same tiers', () => {
    const items = Array.from({ length: 30 }, (_, i) =>
      i % 2 === 0 ? substantial(`x${i}`) : slight(`y${i}`),
    );
    const first = assignFeedTiers(items);
    const second = assignFeedTiers(items);
    for (const it of items) expect(first.get(it.id)).toBe(second.get(it.id));
  });

  it('assigns a tier to every item and nothing else', () => {
    const items = Array.from({ length: 12 }, (_, i) => slight(`s${i}`));
    const tiers = assignFeedTiers(items);
    expect(tiers.size).toBe(items.length);
  });

  it('handles an empty feed', () => {
    expect(assignFeedTiers([]).size).toBe(0);
  });
});

describe('assignFeedTiers over REAL vault content', () => {
  it('covers the whole corpus', () => {
    expect(ALL_VAULT_ITEMS.length).toBeGreaterThan(600);
    expect(REAL_TIERS.size).toBe(ALL_VAULT_ITEMS.length);
  });

  it('gives the MSG wedding — the single most substantial item in the vault — hero', () => {
    expect(realTier('vault-tloas-taylor-and-travis-marry-at-madison-square-garden')).toBe('hero');
  });

  it('gives the Showgirl album release hero', () => {
    expect(realTier('vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel')).toBe(
      'hero',
    );
  });

  it('earns the meaty unsigned ring piece a hero base tier on substance alone — no significance set', () => {
    const id = 'vault-tloas-the-ring-an-old-mine-diamond-from-a-goldsmith-taylor-already';
    const it = ALL_VAULT_ITEMS.find((c) => c.id === id)!;
    expect(it.significance).toBeUndefined();
    expect(substanceScore(it)).toBeGreaterThan(HERO_SCORE_THRESHOLD);
    expect(baseTierFor(it)).toBe('hero');
    // In the live TLOAS feed it sits close behind the wedding hero, so hero
    // spacing steps it to media — the ONE demotion pacing is still allowed.
    expect(realTier(id)).toBe('media');
  });

  it('renders unsigned but substantial real items as hero where spacing allows', () => {
    // Example item, repointed 2026-07-25: this is a spacing-dependent assertion,
    // so the specific id rotates as the TLOAS feed's substance/pacing shifts (a
    // depth pass enriching neighbours can demote any single example — see the
    // "ONE demotion pacing is still allowed" note above). The prior example
    // (pink-markarian) stepped to media after a depth pass enriched its wedding-
    // cluster neighbours; repointed to a currently-hero unsigned item. The
    // population-level guarantee is covered by the next test.
    const id = 'vault-tloas-shania-twain-explains-the-scheduling-conflict-that-kept-her-';
    const it = ALL_VAULT_ITEMS.find((c) => c.id === id)!;
    expect(it.significance).toBeUndefined();
    expect(realTier(id)).toBe('hero');
  });

  it('promotes a real, unsigned population to hero — heroes are not just the authored ones', () => {
    const unsignedHeroes = ALL_VAULT_ITEMS.filter(
      (c) => !c.significance && REAL_TIERS.get(c.id) === 'hero',
    );
    // Before #1017 an unsigned item reached hero only via the narrow
    // isHeroWorthy heuristic plus a 1-in-10 throttle. Substance scoring must
    // surface a real number of them.
    expect(unsignedHeroes.length).toBeGreaterThan(15);
  });

  it('gives a bare one-line single announcement the compact chip tier', () => {
    // Fixtures repointed 2026-07-21 (ledger #1096): the Answerer enriched
    // tloas-opalite-video into a hero-tier page, so still-thin singles (the
    // "Elizabeth Taylor" radio release and the showgirl-released marker) stand
    // in for the bare-with-photo case.
    expect(realTier('vault-tloas-elizabeth-taylor-goes-to-radio')).toBe('chip');
    expect(realTier('vault-tloas-the-life-of-a-showgirl-released')).toBe('chip');
  });

  it('gives a mid-weight sourced item the media tier', () => {
    expect(realTier('vault-tloas-the-ring-designer-gets-a-wedding-invite-of-her-own')).toBe('media');
  });

  it('gives every authored defining item hero, across the entire real corpus', () => {
    const defining = ALL_VAULT_ITEMS.filter((c) => c.significance === 'defining');
    expect(defining.length).toBeGreaterThan(30);
    for (const it of defining) expect(realTier(it.id)).toBe('hero');
  });

  it('never puts an authored notable item below media, across the entire real corpus', () => {
    const notable = ALL_VAULT_ITEMS.filter((c) => c.significance === 'notable');
    expect(notable.length).toBeGreaterThan(50);
    for (const it of notable) expect(['hero', 'media']).toContain(realTier(it.id));
  });

  it('never demotes a real item below its base tier except the hero->media spacing step', () => {
    const order: CardTier[] = ['text', 'chip', 'media', 'hero'];
    for (const era of ERAS) {
      const items = contentForEra(era.id);
      const tiers = assignFeedTiers(items);
      for (const it of items) {
        const base = baseTierFor(it);
        const final = tiers.get(it.id)!;
        if (final === base) continue;
        expect(base).toBe('hero');
        expect(final).toBe('media');
      }
    }
  });

  it('no real item is demoted to text by pacing — the #1017 bug, over real data', () => {
    for (const era of ERAS) {
      const items = contentForEra(era.id);
      const tiers = assignFeedTiers(items);
      for (const it of items) {
        if (tiers.get(it.id) === 'text') expect(baseTierFor(it)).toBe('text');
      }
    }
  });

  it('produces a genuinely mixed distribution over the real 698-item corpus', () => {
    const counts: Record<CardTier, number> = { hero: 0, media: 0, chip: 0, text: 0 };
    for (const tier of REAL_TIERS.values()) counts[tier] += 1;
    const total = REAL_TIERS.size;
    const pct = (t: CardTier) => (counts[t] / total) * 100;

    // The whole point of #1017. Before this change the split was
    // hero 12.3 / media 55.9 / chip 1.3 / text 30.5 — chip was effectively
    // dead and more than half the feed was one silhouette.
    expect(pct('hero')).toBeGreaterThanOrEqual(8);
    expect(pct('hero')).toBeLessThanOrEqual(12);
    expect(pct('media')).toBeGreaterThan(30);
    expect(pct('media')).toBeLessThan(45);
    // Chip must be a real tier now, not a rounding error.
    expect(pct('chip')).toBeGreaterThan(20);
    expect(pct('text')).toBeGreaterThan(15);
    // No single silhouette may own the majority of the feed.
    for (const t of ['hero', 'media', 'chip', 'text'] as CardTier[]) {
      expect(pct(t)).toBeLessThan(50);
    }
  });

  it('is stable across repeated assignment over real per-era feeds', () => {
    for (const era of ERAS.slice(0, 4)) {
      const items = contentForEra(era.id);
      const a = assignFeedTiers(items);
      const b = assignFeedTiers(items);
      for (const it of items) expect(a.get(it.id)).toBe(b.get(it.id));
    }
  });
});
