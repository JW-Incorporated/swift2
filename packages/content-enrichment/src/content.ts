import type { ContentItem, ContentTag, EraId, ImageRef, LensId, Milestone } from '@swift2/experience';

/**
 * Default thread membership implied by a content tag — the mechanism behind
 * "new content flows into Threads automatically" (docs/decisions.md
 * 2026-07-10). Only tags with an unambiguous, always-true thread mapping
 * belong here: a 'Relationship'-tagged item is *always* Love Story material,
 * a 'Fashion'-tagged item is *always* Runway material. Threads with no such
 * 1:1 tag ('taylors-version', 'easter-eggs', 'hidden-clues', 'the-proposal')
 * are opt-in only, via an item's explicit `threadIds` — adding a case here
 * would silently over-include unrelated content.
 *
 * Moved out of `apps/web/lib/longlive/content.ts` in OS-014b-1
 * (docs/proposals/2026-09-vault-read-path.md) so `scripts/build-content-
 * bundle.mjs` can call this logic with zero `apps/web` dependency.
 * `apps/web/lib/longlive/content.ts` re-exports this unchanged for its
 * existing callers/tests.
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

/**
 * Assembles the full `CONTENT` corpus from a hand-curated `RAW` map and the
 * generated `VAULT_RAW` map, exactly matching the merge/collision rule
 * `apps/web/lib/longlive/content.ts` previously computed inline: curated ids
 * win on collision, iteration driven by the union of both maps' era keys.
 * Exported for unit tests and for `scripts/build-content-bundle.mjs`.
 */
export function buildContent(
  raw: Partial<Record<EraId, RawItem[]>>,
  vaultRaw: Partial<Record<EraId, RawItem[]>>,
): ContentItem[] {
  return ([...new Set([...Object.keys(vaultRaw), ...Object.keys(raw)])] as EraId[]).flatMap(
    (eraId) => {
      const curated = build(eraId, raw[eraId] ?? []);
      const curatedIds = new Set(curated.map((c) => c.id));
      const synced = build(eraId, vaultRaw[eraId] ?? []).filter((c) => !curatedIds.has(c.id));
      return [...curated, ...synced];
    },
  );
}

/**
 * Derives the `MILESTONES` timeline-marker list from an assembled `CONTENT`
 * corpus — every milestone is a marker on its own moment
 * (`ContentItem.milestone`), so the scrubber's timeline and the moment it
 * points at can never drift apart. Exported for unit tests and the bundle
 * builder.
 */
export function buildMilestones(content: ContentItem[]): Milestone[] {
  return content
    .filter((c) => c.milestone)
    .map((c) => ({
      id: c.milestone!.id,
      eraId: c.eraId,
      date: c.date,
      label: c.milestone!.label,
      kind: c.milestone!.kind,
    }));
}
