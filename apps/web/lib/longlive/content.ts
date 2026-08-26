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

// Derived from the seed vault (consolidation stage 2b, 2026-07-19): every
// milestone is a marker on its own moment (ContentItem.milestone, authored in
// supabase/seed/content/**), so the scrubber's timeline and the moment it
// points at can never drift apart — adding a milestone means marking the
// moment, not editing a parallel list. Legacy ids preserved in the markers.
export const MILESTONES: Milestone[] = CONTENT.filter((c) => c.milestone).map((c) => ({
  id: c.milestone!.id,
  eraId: c.eraId,
  date: c.date,
  label: c.milestone!.label,
  kind: c.milestone!.kind,
}));

export function milestonesForEra(eraId: EraId): Milestone[] {
  return MILESTONES.filter((m) => m.eraId === eraId).sort((a, b) => a.date.localeCompare(b.date));
}
