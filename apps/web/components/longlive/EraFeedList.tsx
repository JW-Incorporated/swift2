'use client';

import { emptyFeedMessage, type EraFeedEntry } from '@/lib/longlive/era-feed';
import type { FilterId } from '@/lib/longlive/filters';
import type { Era } from '@/lib/longlive/types';
import type { PlayableVideoNote } from '@/lib/longlive/videos';
import type { CardTier } from '@/lib/longlive/feed-tiers';
import { MomentCard } from './MomentCard';
import { VideoMomentCard } from './VideoMomentCard';
import { ThreadDoorwayCard, EggDoorwayCard } from './DoorwayCard';

// Split out of EraSection.tsx (PLAN.md P3 step 15 — "EraSection.tsx must come
// DOWN, not up"; split recorded in MAP.md). The four-kind dispatch that used
// to be an inline ternary in EraSection's render (moment/video only, pre-step
// 15) now switches on all four `EraFeedEntry` kinds and lives here so the
// era-level component stays about wiring data, not about how each card kind
// renders.

/**
 * The chronological feed grid for one era: every moment, video and doorway
 * card, editorially tiered (moments), full-width (videos, doorways), newest
 * first. `onOpenDoorway` is the one hook a doorway tap calls — EraSection
 * decides what that means (push a ReturnPoint, then navigate) so this
 * component stays presentation-only.
 */
export function EraFeedList({
  entries,
  era,
  tiers,
  videoOwnerIds,
  imageHiddenIds,
  filters,
  onOpenItem,
  onOpenDoorway,
}: {
  entries: EraFeedEntry<PlayableVideoNote>[];
  era: Era;
  tiers: Map<string, CardTier>;
  videoOwnerIds: Set<string>;
  imageHiddenIds: Set<string>;
  filters: ReadonlySet<FilterId>;
  onOpenItem: (id: string) => void;
  onOpenDoorway: (entry: Extract<EraFeedEntry<PlayableVideoNote>, { kind: 'thread' } | { kind: 'egg' }>) => void;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:pr-8">
      {/* Visually hidden: card titles are h3, so without this the outline
          jumps h1 (era) → h3 (card) — axe `heading-order` (#703). */}
      <h2 className="sr-only">Moments from {era.shortName}</h2>
      <ol className="relative grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-6">
        {entries.map((entry) => renderEntry(entry, { era, tiers, videoOwnerIds, imageHiddenIds, onOpenItem, onOpenDoorway }))}
      </ol>
      {entries.length === 0 && (
        <p className="py-16 text-center text-sm text-[color:var(--era-ink-soft)]">
          {emptyFeedMessage(filters, era.shortName)}
        </p>
      )}
    </div>
  );
}

function renderEntry(
  entry: EraFeedEntry<PlayableVideoNote>,
  ctx: {
    era: Era;
    tiers: Map<string, CardTier>;
    videoOwnerIds: Set<string>;
    imageHiddenIds: Set<string>;
    onOpenItem: (id: string) => void;
    onOpenDoorway: (entry: Extract<EraFeedEntry<PlayableVideoNote>, { kind: 'thread' } | { kind: 'egg' }>) => void;
  },
) {
  const { era, tiers, videoOwnerIds, imageHiddenIds, onOpenItem, onOpenDoorway } = ctx;
  switch (entry.kind) {
    case 'moment':
      return (
        <MomentCard
          key={entry.item.id}
          item={entry.item}
          tier={tiers.get(entry.item.id) ?? 'text'}
          ownsVideo={videoOwnerIds.has(entry.item.id)}
          hideImage={imageHiddenIds.has(entry.item.id)}
          onOpen={() => onOpenItem(entry.item.id)}
        />
      );
    case 'video':
      return (
        <VideoMomentCard
          key={`era-video-${entry.video.slug}`}
          video={entry.video}
          eraId={era.id}
          sortDate={entry.anchor.sortDate}
        />
      );
    case 'thread':
      return (
        <ThreadDoorwayCard
          key={`era-thread-${entry.doorway.threadId}`}
          doorway={entry.doorway}
          eraId={era.id}
          sortDate={entry.anchor.sortDate}
          displayDate={entry.anchor.displayDate}
          onOpen={() => onOpenDoorway(entry)}
        />
      );
    case 'egg':
      return (
        <EggDoorwayCard
          key={`era-egg-${entry.doorway.eggId}`}
          doorway={entry.doorway}
          eraId={era.id}
          sortDate={entry.anchor.sortDate}
          onOpen={() => onOpenDoorway(entry)}
        />
      );
    default: {
      const exhaustive: never = entry;
      return exhaustive;
    }
  }
}
