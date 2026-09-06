// OS-032 — native era stream (docs/specs/2026-09-05-one-source-three-
// surfaces.md, Phase 3). This is the "golden view-model" builder: the exact
// sequence of steps `EraSection.tsx` runs client-side to turn one era's raw
// content into an ordered, renderable list. Extracting it here (rather than
// leaving the pipeline only inline in the web component) is what makes "the
// native renderer matches the web's section order" a property of shared code
// instead of two hand-kept-in-sync implementations (D2: two renderers, one
// headless core).
//
// This module does NOT decide card tiers on its own beyond what the pipeline
// already needs (`assignFeedTiers`/`withInlineVideoTiers`, imported
// unchanged from feed-tiers.ts) — it is the same ordering pipeline
// `EraSection.tsx` runs, factored into one callable so a second renderer
// (apps/mobile) gets it by construction, not by copying the component logic.
import type { ContentItem, VideoNote, Era } from './types';
import type { FilterId } from './filters';
import type { EraFeedEntry } from './feed-types';
import { mergeEraFeed, visibleFeed, inlineVideoMomentIds } from './era-feed';
import { spaceDoorways } from './space-doorways';
import { clusterSameDayMoments, type RenderFeedEntry } from './era-feed-clusters';
import { assignFeedTiers, withInlineVideoTiers, type CardTier } from './feed-tiers';

/**
 * Everything the pipeline needs beyond the era + its curated moments — every
 * caller (web today, native from this card) assembles this the same way
 * `EraSection.tsx` does: `videoFeed` from `eraVideoFeed`, `doorwayEntries`
 * from `threadDoorwaysForEra`/`eggDoorwaysForEra`, `liveEntries` from the
 * app's Stage 5 current-item feed (`useEraCurrentFeed`/`useCurrentItems`),
 * `imageHiddenIds` from the app's video-affordance rule
 * (`feedCardImageHidden` — kept an app concern since it reads
 * `hasRealPrimaryImage`/`youtubeFrameId`, which stay outside this
 * framework-free package deliberately, same boundary as
 * `content-item-provider.ts`).
 */
export interface EraStreamInputs<V extends VideoNote> {
  era: Era;
  items: ContentItem[];
  videoFeed: V[];
  doorwayEntries?: EraFeedEntry<V>[];
  liveEntries?: EraFeedEntry<V>[];
  filters: ReadonlySet<FilterId>;
  /** Ids whose feed-card photo must not render (video-affordance rule) — see `EraStreamInputs` doc. */
  imageHiddenIds?: ReadonlySet<string>;
}

/** Everything a renderer needs to draw one era section, in final render order. */
export interface EraStreamViewModel<V extends VideoNote> {
  era: Era;
  /** The exact cards to render, in order — clusters already folded in. */
  entries: RenderFeedEntry<V>[];
  /** Card silhouette per moment id (`EraFeedList`'s `tiers` prop). */
  tiers: Map<string, CardTier>;
  /** Moment ids that own their embedded video's inline player (`EraFeedList`'s `videoOwnerIds`). */
  videoOwnerIds: Set<string>;
  /** Moment ids whose feed-card photo must not render. Echoes the input verbatim — this pipeline does not compute it (see `EraStreamInputs` doc) — but it travels with the view-model so a renderer never has to thread a fourth argument. */
  imageHiddenIds: ReadonlySet<string>;
}

/**
 * Builds the ordered, tiered render list for one era — the same sequence
 * `EraSection.tsx` runs: merge (`mergeEraFeed`) → space doorways
 * (`spaceDoorways`) → filter (`visibleFeed`) → cluster same-day moments
 * (`clusterSameDayMoments`) for the entries; and, over the filtered
 * moments-only subset, ownership (`inlineVideoMomentIds`) → tiers
 * (`assignFeedTiers` floored by `withInlineVideoTiers`) for the map every
 * card kind besides `moment` ignores.
 *
 * Pure and framework-free: no rendering, no React, so both apps/web and
 * apps/mobile can call it and are, by construction, looking at the same
 * list in the same order — the OS-032 "done when" ("golden view-model →
 * rendered list matches the web's section order for three eras").
 */
export function buildEraStreamViewModel<V extends VideoNote>(
  inputs: EraStreamInputs<V>,
): EraStreamViewModel<V> {
  const { era, items, videoFeed, doorwayEntries = [], liveEntries = [], filters, imageHiddenIds = new Set<string>() } =
    inputs;

  const mergedFeed = spaceDoorways(
    mergeEraFeed(items, videoFeed, era.start, era.end, [...doorwayEntries, ...liveEntries]),
  );
  const feedEntries = visibleFeed(mergedFeed, filters);
  const entries = clusterSameDayMoments(feedEntries);

  const visible = feedEntries.flatMap((e) => (e.kind === 'moment' ? [e.item] : []));
  const videoOwnerIds = inlineVideoMomentIds(visible);
  // Mirrors EraSection.tsx's `tierlessImageIds`: hidden-image moments that
  // don't own their own embed lose the score-derived tier floor a poster
  // would otherwise earn them (see feed-tiers.ts / video-affordance.ts).
  const tierlessImageIds = new Set(
    [...imageHiddenIds].filter((id) => !videoOwnerIds.has(id)),
  );
  const tiers = withInlineVideoTiers(assignFeedTiers(visible, tierlessImageIds), videoOwnerIds);

  return { era, entries, tiers, videoOwnerIds, imageHiddenIds };
}
