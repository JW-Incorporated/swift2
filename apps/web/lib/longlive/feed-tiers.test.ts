import { describe, expect, it } from 'vitest';
import { build, contentForEra } from './content';
import { eraKnownVideoIds, inlineVideoMomentIds } from './era-feed';
import { feedCardImageHidden } from './video-affordance';
import { videosForEra } from './videos';
import { VAULT_RAW } from './content-vault.generated';
import { ERAS } from '@swift2/experience';
import {
  HERO_MIN_GAP,
  HERO_SCORE_THRESHOLD,
  MEDIA_SCORE_THRESHOLD,
  assignFeedTiers,
  baseTierFor,
  withInlineVideoTiers,
  type CardTier,
} from './feed-tiers';
import { substanceScore } from './substance';
import type { ContentItem, EraId } from '@swift2/experience';

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

/**
 * The image-suppressed ids EraSection computes for an era, derived exactly as it
 * derives them: the cards whose photo will not render, minus the owners, whose
 * poster fills the slot instead. Without this the "real vault" suite would be
 * asserting tiers production no longer assigns.
 */
function realSuppressedIds(items: ContentItem[], eraId: EraId): Set<string> {
  const owners = inlineVideoMomentIds(items);
  const known = eraKnownVideoIds(items, videosForEra(eraId));
  return new Set(
    items
      .filter((it) => feedCardImageHidden(it, known) && !owners.has(it.id))
      .map((it) => it.id),
  );
}

/** Tiers for every era, assigned over the real per-era feed sequence — the
 * same call EraSection makes, suppressed ids and all. */
function realFeedTiers(): Map<string, CardTier> {
  const all = new Map<string, CardTier>();
  for (const era of ERAS) {
    const items = contentForEra(era.id);
    const tiers = assignFeedTiers(items, realSuppressedIds(items, era.id));
    for (const [id, tier] of tiers) all.set(id, tier);
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
    const id = 'vault-ttpd-the-ring-an-old-mine-diamond-from-a-goldsmith-taylor-already';
    const it = ALL_VAULT_ITEMS.find((c) => c.id === id)!;
    expect(it.significance).toBeUndefined();
    expect(substanceScore(it)).toBeGreaterThan(HERO_SCORE_THRESHOLD);
    expect(baseTierFor(it)).toBe('hero');
    // In the live TTPD feed it sits close behind another hero, so hero
    // spacing steps it to media — the ONE demotion pacing is still allowed.
    expect(realTier(id)).toBe('media');
  });

  it('renders unsigned but substantial real items as hero where spacing allows', () => {
    // Example item, repointed 2026-08-05: this is a spacing-dependent assertion,
    // so the specific id rotates as the TLOAS feed's substance/pacing shifts (a
    // depth pass enriching neighbours can demote any single example — see the
    // "ONE demotion pacing is still allowed" note above). The prior example
    // (shania-twain-scheduling-conflict) stepped to media after the 2026-08-05
    // vault run added two substantial TLOAS moments (the country Hot 100 sweep
    // and the Gracie Abrams quote) that shifted its cluster's hero spacing.
    // Repointed again (issue #616 dedup): removing the duplicate Rock Hall
    // item and enriching the surviving one shifted TLOAS hero spacing and
    // stepped the Eras Tour docuseries example to media; repointed to a
    // currently-hero unsigned item (the album release page). The
    // population-level guarantee is covered by the next test.
    const id = 'vault-tloas-the-life-of-a-showgirl-released';
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
    // Fixtures rotate as depth passes enrich the example items (see the
    // spacing/pacing note on the hero test above). Repointed 2026-07-25
    // (ledger #1370): the Answerer gave showgirl-released — previously the last
    // remaining tloas chip — its sourcing + cross-link consolidation treatment,
    // promoting it out of chip tier, so a still-bare debut single now carries
    // the bare case on its own (no tloas item sits in chip tier anymore).
    expect(realTier('vault-debut-our-song-hits-number-one')).toBe('chip');
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

  it('produces a genuinely mixed distribution over the real vault corpus', () => {
    const counts: Record<CardTier, number> = { hero: 0, media: 0, chip: 0, text: 0 };
    for (const tier of REAL_TIERS.values()) counts[tier] += 1;
    const total = REAL_TIERS.size;
    const pct = (t: CardTier) => (counts[t] / total) * 100;

    // The whole point of #1017. Before this change the split was
    // hero 12.3 / media 55.9 / chip 1.3 / text 30.5 — chip was effectively
    // dead and more than half the feed was one silhouette.
    //
    // Upper bound widened 12 -> 20 (#1628, 2026-08-01): hero tier is earned
    // per-item on an ABSOLUTE substanceScore threshold (HERO_SCORE_THRESHOLD),
    // not a corpus-relative rank — so as depth/photo-enrichment passes
    // legitimately raise individual items' substance over that bar, the
    // POPULATION share of heroes drifts up too. That is the tiering design
    // working as intended (a meatier corpus earns more hero cards), not
    // drift to suppress. A tight ceiling fit to one day's corpus snapshot
    // (12%) broke CI on main the first time enrichment nudged it to 12.06%,
    // freezing every open PR for days. This is the reversible interim
    // unblock Joey/Wyatt decided on #1628 (option 1) while option 2 — tiers
    // driven by an explicit editorial weight/recency signal instead of
    // corpus-relative substance, decoupling "how the feed looks" from "how
    // good the corpus's floor is" — is tracked separately as the real fix.
    // 20% still catches genuine regressions (a bug that made everything
    // hero) without breaking on ordinary content growth.
    expect(pct('hero')).toBeGreaterThanOrEqual(8);
    expect(pct('hero')).toBeLessThanOrEqual(20);
    expect(pct('media')).toBeGreaterThan(30);
    expect(pct('media')).toBeLessThan(45);
    // Chip must be a real tier now, not a rounding error. Lowered 20 -> 18
    // (issue #722, 2026-08-24): removing ~29 thin, single-source
    // fashion/wardrobe "chip"-tier cards from the founding eras (routed to
    // the Runway thread instead) nudged the population share down from
    // ~19.7% — a real, intended composition shift, not a tiering bug.
    expect(pct('chip')).toBeGreaterThan(18);
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

/**
 * #2080: one video treatment in the feed. Every playable video renders the same
 * full-width 16:9 poster, and two tiers cannot carry one honestly — see
 * INLINE_VIDEO_MIN_TIER. This is a FLOOR on cards that actually play.
 */
describe('withInlineVideoTiers', () => {
  const tiers = (entries: [string, CardTier][]) => new Map(entries);

  it('lifts a chip that plays a video to media', () => {
    const out = withInlineVideoTiers(tiers([['a', 'chip']]), new Set(['a']));
    expect(out.get('a')).toBe('media');
  });

  it('lifts a text breather that plays a video to media', () => {
    const out = withInlineVideoTiers(tiers([['a', 'text']]), new Set(['a']));
    expect(out.get('a')).toBe('media');
  });

  it('never demotes: a hero that plays a video stays a hero', () => {
    const out = withInlineVideoTiers(tiers([['a', 'hero']]), new Set(['a']));
    expect(out.get('a')).toBe('hero');
  });

  it('leaves cards that do not play anything exactly as they were', () => {
    const input = tiers([
      ['a', 'chip'],
      ['b', 'text'],
      ['c', 'hero'],
      ['d', 'media'],
    ]);
    const out = withInlineVideoTiers(input, new Set());
    expect([...out]).toEqual([...input]);
  });

  it('skips a moment that DEFERS its video to an earlier card (#2057 de-dupe)', () => {
    // Ownership, not `item.video`: the deferring card renders no poster, so
    // inflating it would grow a card for a video it never shows.
    const out = withInlineVideoTiers(tiers([['a', 'chip']]), new Set(['someone-else']));
    expect(out.get('a')).toBe('chip');
  });

  it('does not mutate the map it was given', () => {
    const input = tiers([['a', 'chip']]);
    withInlineVideoTiers(input, new Set(['a']));
    expect(input.get('a')).toBe('chip');
  });

  /**
   * Wired the way EraSection wires it — `inlineVideoMomentIds(items)`, the same
   * ownership set the component derives — rather than "every item with
   * `item.video`". Those differ (a moment deferring a duplicate id is not an
   * owner), and the naive version is also circular: assert `hero|media` over
   * exactly the ids you just floored and the test passes on an empty vault.
   * The `toBeGreaterThan(0)` below is what stops it going quiet — if the corpus
   * ever stops containing a card the floor lifts, this fails instead of
   * silently asserting nothing.
   */
  it('leaves no chip or text card playing a video anywhere in the real corpus', () => {
    let promoted = 0;
    let owned = 0;
    for (const era of ERAS) {
      const items = contentForEra(era.id);
      const owners = inlineVideoMomentIds(items);
      const base = assignFeedTiers(items);
      const floored = withInlineVideoTiers(base, owners);
      for (const id of owners) {
        owned++;
        if (base.get(id) !== floored.get(id)) promoted++;
        expect(['hero', 'media']).toContain(floored.get(id));
      }
      // Nothing OUTSIDE the ownership set may move.
      for (const it of items) {
        if (owners.has(it.id)) continue;
        expect(floored.get(it.id)).toBe(base.get(it.id));
      }
    }
    // Non-vacuity, not a census: the vault gains content most days, so pinning
    // exact counts here would fail on unrelated content PRs. Today it is 16
    // owners and 7 promotions (6 `text` + 1 `chip`).
    expect(owned).toBeGreaterThan(0);
    expect(promoted).toBeGreaterThan(0);
  });
});

/**
 * #2081. A card whose photo is suppressed has no picture — and unlike an owner,
 * whose poster takes the slot, a DEFERRING card gets nothing in its place. Its
 * tier has to be told, or it keeps the silhouette it earned as a photo card and
 * renders it empty: on tloas, "'Elizabeth Taylor' goes to radio" was a `hero`.
 */
describe('assignFeedTiers with suppressed images', () => {
  it('scores a suppressed card as the imageless card it is about to be', () => {
    const it0 = substantial('m-suppressed');
    expect(baseTierFor(it0)).toBe('hero');
    expect(baseTierFor(it0, true)).toBe('text');
  });

  it('honours `significance` over suppression, exactly as it does over score', () => {
    // 'defining' is an authoring judgment about the real world; a missing
    // picture is not a reason to demote the event. It renders the bigger
    // typography with no image block, which MomentCardButton already supports.
    expect(baseTierFor(substantial('m-def', { significance: 'defining' }), true)).toBe('hero');
    // 'notable' keeps its `media` floor for the same reason.
    expect(baseTierFor(substantial('m-not', { significance: 'notable' }), true)).toBe('media');
  });

  it('demotes only the ids it is given', () => {
    const items = [substantial('m-a'), substantial('m-b')];
    const tiers = assignFeedTiers(items, new Set(['m-a']));
    expect(tiers.get('m-a')).toBe('text');
    expect(tiers.get('m-b')).toBe('hero');
  });

  it('defaults to suppressing nothing, so every existing caller is unchanged', () => {
    const items = [substantial('m-a'), substantial('m-b')];
    expect([...assignFeedTiers(items)]).toEqual([...assignFeedTiers(items, new Set())]);
  });

  it('frees the hero gap it was occupying rather than just blanking a hero', () => {
    // The demotion runs BEFORE pacing, not after, so a suppressed card no
    // longer spends the hero budget that would push the next real hero down to
    // `media`. Passing a set (not a pre-filtered list) is what keeps the
    // sequence — and therefore the spacing — honest.
    const items = [substantial('m-first'), substantial('m-second')];
    expect(assignFeedTiers(items).get('m-second')).toBe('media');
    expect(assignFeedTiers(items, new Set(['m-first'])).get('m-second')).toBe('hero');
  });
});
