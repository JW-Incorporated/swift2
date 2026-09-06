import { describe, expect, it } from 'vitest';
import {
  ERAS,
  buildEraStreamViewModel,
  mergeEraFeed,
  visibleFeed,
  spaceDoorways,
  eggDoorwaysForEra,
  threadDoorwaysForEra,
  clusterSameDayMoments,
  inlineVideoMomentIds,
  assignFeedTiers,
  withInlineVideoTiers,
} from '@swift2/experience';
import './theories'; // side effect: wires the real generated THEORIES_RAW into @swift2/experience
import { contentForEra } from './content';
import { eraVideoFeed, type PlayableVideoNote } from './videos';
import { embeddedYoutubeIds } from '@swift2/experience';

/**
 * OS-032's "done when": the shared golden view-model builder
 * (`buildEraStreamViewModel`, `packages/experience/src/era-stream.ts`)
 * produces exactly the same rendered section order the web's own hand-built
 * pipeline does, for three real eras — proving the native renderer (which
 * calls the same function) cannot drift from the web by construction.
 *
 * This test rebuilds the web's pre-OS-032 pipeline inline (the exact steps
 * `EraSection.tsx` used to run directly: merge -> space -> filter -> cluster
 * for entries; ownership -> tiers over the filtered moments) and diffs its
 * output, entry-for-entry, against the shared builder given the identical
 * real-corpus inputs. `EraSection.tsx` itself now calls the shared builder
 * directly (see era-section-ownership.test.ts), so this is a redundant,
 * from-first-principles cross-check rather than a test of EraSection's own
 * wiring.
 */
const THREE_ERAS = ['debut', '1989', 'ttpd'] as const;

describe('OS-032 golden view-model: native pipeline matches web section order', () => {
  it.each(THREE_ERAS)('era "%s": entries, in order, are identical', (eraId) => {
    const era = ERAS.find((e) => e.id === eraId);
    expect(era).toBeDefined();
    if (!era) return;

    const items = contentForEra(era.id);
    const embeddedVideoIds = embeddedYoutubeIds(items);
    const videoFeed: PlayableVideoNote[] = eraVideoFeed(era.id, embeddedVideoIds);
    const doorwayEntries = [
      ...threadDoorwaysForEra(era.id, era.start, era.end),
      ...eggDoorwaysForEra(era.id, era.start, era.end),
    ];
    const filters = new Set<never>(); // no active filter -> full feed, same default EraStream mounts with

    // Reference pipeline: the web's pre-refactor steps, run directly against
    // the same primitives era-stream.ts calls internally.
    const referenceMerged = spaceDoorways(mergeEraFeed(items, videoFeed, era.start, era.end, doorwayEntries));
    const referenceFiltered = visibleFeed(referenceMerged, filters);
    const referenceEntries = clusterSameDayMoments(referenceFiltered);
    const referenceVisible = referenceFiltered.flatMap((e) => (e.kind === 'moment' ? [e.item] : []));
    const referenceVideoOwnerIds = inlineVideoMomentIds(referenceVisible);
    const referenceTiers = withInlineVideoTiers(
      assignFeedTiers(referenceVisible, new Set()),
      referenceVideoOwnerIds,
    );

    // The shared golden builder (what apps/mobile's native era stream calls).
    const viewModel = buildEraStreamViewModel({
      era,
      items,
      videoFeed,
      doorwayEntries,
      filters,
    });

    // Same number of rendered entries, in the same order, same kinds.
    expect(viewModel.entries.length).toBe(referenceEntries.length);
    expect(viewModel.entries.map(entryKey)).toEqual(referenceEntries.map(entryKey));

    // Same video ownership.
    expect([...viewModel.videoOwnerIds].sort()).toEqual([...referenceVideoOwnerIds].sort());

    // Same tier assignment for every moment id.
    for (const [id, tier] of referenceTiers) {
      expect(viewModel.tiers.get(id)).toBe(tier);
    }
    expect(viewModel.tiers.size).toBe(referenceTiers.size);
  });
});

/** A stable identity string per rendered entry — same tiebreak identity `mergeEraFeed`/`EraFeedList` use per kind. */
function entryKey(entry: {
  kind: string;
  item?: { id: string };
  video?: { slug: string };
  doorway?: { threadId?: string | null; eggId?: string };
  items?: { id: string }[];
  anchor?: { sortDate: string };
}): string {
  switch (entry.kind) {
    case 'moment':
      return `moment:${entry.item!.id}`;
    case 'video':
      return `video:${entry.video!.slug}`;
    case 'thread':
      return `thread:${entry.doorway!.threadId}`;
    case 'egg':
      return `egg:${entry.doorway!.eggId}`;
    case 'current':
      return `current:${entry.item!.id}`;
    case 'cluster':
      return `cluster:${entry.anchor!.sortDate}:${entry.items!.map((i) => i.id).join(',')}`;
    default:
      return JSON.stringify(entry);
  }
}
