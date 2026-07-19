import type { ContentItem, ContentTag, EraId, ImageRef, LensId, Milestone } from './types';
import { VAULT_RAW } from './content-vault.generated';

/**
 * Default thread membership implied by a content tag — the mechanism behind
 * "new content flows into Threads automatically" (docs/decisions.md
 * 2026-07-10). Only tags with an unambiguous, always-true thread mapping
 * belong here: a 'Relationship'-tagged item is *always* Love Story material,
 * a 'Fashion'-tagged item is *always* Runway material. Threads with no such
 * 1:1 tag ('taylors-version', 'easter-eggs', 'hidden-clues', 'the-proposal')
 * are opt-in only, via an item's explicit `threadIds` — adding a case here
 * would silently over-include unrelated content.
 */
const DEFAULT_THREAD_IDS_BY_TAG: Partial<Record<ContentTag, LensId>> = {
  Relationship: 'love-story',
  Fashion: 'fashion',
};

/** Exported for unit tests. */
export function defaultThreadIdsForTags(tags: ContentTag[]): LensId[] {
  const out: LensId[] = [];
  for (const t of tags) {
    const id = DEFAULT_THREAD_IDS_BY_TAG[t];
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

/**
 * Representative mock content. Every era gets a hero image reused from the era
 * art; a real API would supply per-moment imagery. Ordering is handled in the
 * UI (chronological, oldest-first), so authoring order here is not significant.
 *
 * dateLabel rule (#682 — the WS1 day-precision relapse): when `date` is a
 * researched day-precision date, the label must show the day — write the
 * formatFullDate() form ('June 19, 2006'), never the bare month ('June
 * 2006'). When the day is genuinely unknown or the moment spans a period,
 * use an editorial period label ('Spring 2007', 'Late 2012') with a
 * representative placeholder date — a bare month+year label is
 * indistinguishable from a masked day-precision date, so a test
 * (content.test.ts) rejects it on curated items.
 */

/**
 * Authoring shape: accepts BOTH the legacy single `image` string and the new
 * `images` gallery, so existing data (the RAW literals below and the
 * generated VAULT_RAW) keeps compiling untouched. `build()` normalizes either
 * form into ContentItem's non-empty `images: ImageRef[]`.
 */
export type RawItem = Omit<ContentItem, 'eraId' | 'images'> & {
  image?: string;
  images?: ImageRef[];
};

/**
 * Normalizes RawItems into ContentItems. Every item ends up with a non-empty
 * `images` gallery: an explicit `images` array passes through verbatim; a
 * legacy single `image` (or nothing) becomes one 'primary' entry, falling
 * back to the era art. Exported for unit tests.
 */
export function build(eraId: EraId, items: RawItem[]): ContentItem[] {
  return items.map(({ image, images, threadIds, ...it }) => {
    // Explicit threadIds (an opt-in tag on the seed row) ADD to whatever the
    // item's tags imply by default — an explicit opt-in never removes a tag
    // default, matching the ContentItem.threadIds doc. Merged here — not in
    // the sync script — so hand-curated RAW items below get the exact same
    // treatment as items synced from supabase/seed/content.
    const defaults = defaultThreadIdsForTags(it.tags);
    const resolvedThreadIds = [
      ...defaults,
      ...(threadIds ?? []).filter((id) => !defaults.includes(id)),
    ];
    return {
      ...it,
      eraId,
      images: images?.length
        ? images
        : [{ url: image ?? `/eras/${eraId === 'ttpd' ? 'ttpd' : eraId}.png`, kind: 'primary' }],
      threadIds: resolvedThreadIds.length ? resolvedThreadIds : undefined,
    };
  });
}

// All hand-curated content has been migrated into supabase/seed/content/**
// (consolidation stage 2a, 2026-07-19) — the seed vault is the single source
// of truth for content. RAW remains only as the (empty) merge seam so build()
// and the id-collision rule below keep working; DO NOT author content here.
// New content goes in the era seed files, where validation, the content
// engine, and the bot fleet all operate.
const RAW: Partial<Record<EraId, RawItem[]>> = {};

// Curated ids win on collision, though the generator's `vault-` id prefix
// makes that vanishingly unlikely in practice. Iteration is driven by the
// VAULT's eras (∪ RAW's, defensively) — with RAW empty post-migration,
// iterating RAW's keys would render the whole site empty.
export const CONTENT: ContentItem[] = (
  [...new Set([...Object.keys(VAULT_RAW), ...Object.keys(RAW)])] as EraId[]
).flatMap((eraId) => {
  const curated = build(eraId, RAW[eraId] ?? []);
  const curatedIds = new Set(curated.map((c) => c.id));
  const synced = build(eraId, VAULT_RAW[eraId] ?? []).filter((c) => !curatedIds.has(c.id));
  return [...curated, ...synced];
});

export function contentForEra(eraId: EraId): ContentItem[] {
  // Newest-first: the experience travels *back* in time, so the most recent
  // moment sits at the top (fresh on every visit) and you descend into the past.
  // The timeline scrubber mirrors this — top = now, bottom = the era's start.
  return CONTENT.filter((c) => c.eraId === eraId).sort((a, b) => b.date.localeCompare(a.date));
}

export function getContentItem(id: string): ContentItem | undefined {
  return CONTENT.find((c) => c.id === id);
}

// ── Milestones (timeline markers) ───────────────────────────────────────────

export const MILESTONES: Milestone[] = [
  { id: 'm-debut-1', eraId: 'debut', date: '2006-10-24', label: 'Debut album', kind: 'album' },
  { id: 'm-debut-2', eraId: 'debut', date: '2007-09-08', label: '“Our Song” #1', kind: 'award' },
  { id: 'm-fear-1', eraId: 'fearless', date: '2008-11-11', label: 'Fearless released', kind: 'album' },
  { id: 'm-fear-2', eraId: 'fearless', date: '2009-09-13', label: 'VMAs moment', kind: 'life' },
  { id: 'm-fear-3', eraId: 'fearless', date: '2010-01-31', label: 'Album of the Year', kind: 'award' },
  { id: 'm-sn-1', eraId: 'speak-now', date: '2010-10-25', label: 'Speak Now released', kind: 'album' },
  { id: 'm-sn-2', eraId: 'speak-now', date: '2011-02-09', label: 'World Tour begins', kind: 'tour' },
  { id: 'm-red-0', eraId: 'red', date: '2012-08-13', label: 'First #1 single', kind: 'award' },
  { id: 'm-red-1', eraId: 'red', date: '2012-10-22', label: 'Red released', kind: 'album' },
  { id: 'm-red-2', eraId: 'red', date: '2013-03-13', label: 'The Red Tour', kind: 'tour' },
  { id: 'm-89-0', eraId: '1989', date: '2014-08-18', label: '“Shake It Off”', kind: 'life' },
  { id: 'm-89-1', eraId: '1989', date: '2014-10-27', label: '1989 released', kind: 'album' },
  { id: 'm-89-2', eraId: '1989', date: '2015-05-05', label: '1989 World Tour', kind: 'tour' },
  { id: 'm-89-3', eraId: '1989', date: '2016-02-15', label: 'Album of the Year', kind: 'award' },
  // Added 2026-07-19 alongside the 10-defining-events pass (docs/decisions.md)
  // — the Kimye "Famous" call leak was already the era's defining flashpoint
  // in the seed data (significance: 'defining') but had no scrubber marker.
  { id: 'm-89-4', eraId: '1989', date: '2016-07-17', label: 'The call leaks', kind: 'life' },
  // Added 2026-07-19 (10-defining-events round 3, docs/decisions.md).
  { id: 'm-rep-0', eraId: 'reputation', date: '2017-08-21', label: 'Snake video drops', kind: 'life' },
  { id: 'm-rep-1', eraId: 'reputation', date: '2017-11-10', label: 'reputation released', kind: 'album' },
  { id: 'm-rep-2', eraId: 'reputation', date: '2018-05-08', label: 'Stadium Tour', kind: 'tour' },
  // Added 2026-07-19 (10-defining-events round 3, docs/decisions.md).
  { id: 'm-rep-3', eraId: 'reputation', date: '2018-11-19', label: 'Leaves Big Machine', kind: 'business' },
  { id: 'm-lov-1', eraId: 'lover', date: '2019-06-30', label: 'Masters sold', kind: 'business' },
  { id: 'm-lov-2', eraId: 'lover', date: '2019-08-23', label: 'Lover released', kind: 'album' },
  { id: 'm-folk-1', eraId: 'folklore', date: '2020-07-24', label: 'folklore surprise drop', kind: 'album' },
  { id: 'm-folk-2', eraId: 'folklore', date: '2021-03-14', label: 'folklore wins AOTY', kind: 'award' },
  { id: 'm-ever-1', eraId: 'evermore', date: '2020-12-11', label: 'evermore surprise drop', kind: 'album' },
  // Added 2026-07-19 (10-defining-events round 2, docs/decisions.md).
  { id: 'm-ever-2', eraId: 'evermore', date: '2021-04-18', label: 'First re-record hits #1', kind: 'award' },
  { id: 'm-ever-3', eraId: 'evermore', date: '2021-11-22', label: 'ATW (10 Min) hits #1', kind: 'award' },
  { id: 'm-mid-1', eraId: 'midnights', date: '2022-10-21', label: 'Midnights released', kind: 'album' },
  { id: 'm-mid-1b', eraId: 'midnights', date: '2022-11-05', label: 'Entire top ten', kind: 'award' },
  // Added 2026-07-19 (10-defining-events round 2, docs/decisions.md).
  { id: 'm-mid-1c', eraId: 'midnights', date: '2022-11-15', label: 'Ticketmaster presale', kind: 'business' },
  { id: 'm-mid-2', eraId: 'midnights', date: '2023-03-17', label: 'Eras Tour begins', kind: 'tour' },
  // Added 2026-07-19 (10-defining-events round 3, docs/decisions.md).
  { id: 'm-mid-2a', eraId: 'midnights', date: '2023-04-09', label: 'Alwyn breakup confirmed', kind: 'life' },
  // Added 2026-07-19 alongside the 10-defining-events pass (docs/decisions.md)
  // — same gap as m-89-4: significance: 'defining' in the seed data, no
  // scrubber marker until now.
  { id: 'm-mid-2b', eraId: 'midnights', date: '2023-09-24', label: 'Relationship goes public', kind: 'life' },
  { id: 'm-mid-3', eraId: 'midnights', date: '2023-10-13', label: 'Eras Tour film', kind: 'tour' },
  // Added 2026-07-19 (10-defining-events round 3, docs/decisions.md).
  { id: 'm-mid-3a', eraId: 'midnights', date: '2023-12-06', label: 'Person of the Year', kind: 'award' },
  // Added 2026-07-19 (10-defining-events round 2, docs/decisions.md).
  { id: 'm-mid-3b', eraId: 'midnights', date: '2024-02-04', label: 'Record 4th AOTY', kind: 'award' },
  { id: 'm-mid-3c', eraId: 'midnights', date: '2024-02-11', label: 'Super Bowl LVIII', kind: 'life' },
  { id: 'm-ttpd-1', eraId: 'ttpd', date: '2024-04-19', label: 'TTPD released', kind: 'album' },
  { id: 'm-ttpd-2', eraId: 'ttpd', date: '2024-12-08', label: 'Eras Tour finale', kind: 'tour' },
  // Added 2026-07-19 (10-defining-events round 2, docs/decisions.md).
  { id: 'm-ttpd-3', eraId: 'ttpd', date: '2025-05-30', label: 'Masters bought back', kind: 'business' },
  { id: 'm-tloas-1', eraId: 'tloas', date: '2025-08-13', label: 'Era announced', kind: 'life' },
  { id: 'm-tloas-1b', eraId: 'tloas', date: '2025-08-26', label: 'Engagement announced', kind: 'life' },
  { id: 'm-tloas-2', eraId: 'tloas', date: '2025-10-03', label: 'Showgirl released', kind: 'album' },
  { id: 'm-tloas-3', eraId: 'tloas', date: '2025-10-18', label: 'Record debut', kind: 'award' },
  { id: 'm-tloas-4', eraId: 'tloas', date: '2025-10-18', label: 'Hot 100 sweep', kind: 'award' },
  // Added 2026-07-18 alongside the significance system (docs/decisions.md)
  // — conspicuously absent before: the era's list stopped at 2025-10-18
  // despite the wedding (msg-wedding, the era's clearest 'defining' item)
  // having happened since. Milestones and ContentItem.significance are
  // deliberately kept in sync manually for now — both are hand-curated,
  // and a life-defining event should appear in both places.
  { id: 'm-tloas-5', eraId: 'tloas', date: '2026-07-03', label: 'Married at MSG', kind: 'life' },
];

export function milestonesForEra(eraId: EraId): Milestone[] {
  return MILESTONES.filter((m) => m.eraId === eraId).sort((a, b) => a.date.localeCompare(b.date));
}
