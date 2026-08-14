// Filter coverage checker (kit-v3 P1 step 6) — every item that can appear on
// an era timeline must carry at least one of the six global filter ids
// (filters.ts's FilterId), or R2's single sticky filter makes it permanently
// unreachable: an entry with zero filter ids can never match a non-empty
// active set (see filterMatches in filters.ts).
//
// Reuses the REAL selection pipeline — mergeEraFeed + filtersForEntry, the
// same functions EraSection.tsx wires up — rather than re-deriving the rules
// here. A checker that disagrees with the app is worse than no checker.
//
// This file (and anything importing apps/web/lib/longlive/*.ts) must run
// under `tsx`; plain `node` cannot resolve TypeScript. See
// scripts/social/lib/era-palette.mjs for the same pattern.
//
//   npm run check:filter-coverage
//
// FAILS (exit 1): any moment or video that can appear in a timeline carries
// zero filter ids. Lists each offender as "era / kind / id / title" — the
// direct backfill list for PLAN.md step 7.
// REPORTS ONLY (exit 0): any of the six filters with zero items in a given
// era, and the count of appearance-family videos with no topic tag (step 7a
// — expected today, VideoNote has no topic field; not a regression).
import { ERAS } from '../apps/web/lib/longlive/eras.ts';
import { contentForEra } from '../apps/web/lib/longlive/content.ts';
import { eraVideoFeed, isAppearance } from '../apps/web/lib/longlive/videos.ts';
import {
  embeddedYoutubeIds,
  inlineVideoMomentIds,
  mergeEraFeed,
} from '../apps/web/lib/longlive/era-feed.ts';
import { ALL_FILTERS, filtersForEntry } from '../apps/web/lib/longlive/filters.ts';

/** The five topic tags — ALL_FILTERS minus the Videos peer chip. */
export const TOPIC_FILTERS = ALL_FILTERS.filter((f) => f !== 'Videos');

/** One merged-feed entry's id + title, whatever kind it is. */
function entryIdentity(entry) {
  return entry.kind === 'moment'
    ? { id: entry.item.id, title: entry.item.title }
    : { id: entry.video.slug, title: entry.video.title };
}

/** The exact offender line format PLAN.md step 6 asks for. */
export function formatOffender(o) {
  return `${o.era} / ${o.kind} / ${o.id} / ${o.title}`;
}

/**
 * One era's coverage facts, computed via the real pipeline. `items` and
 * `videoFeed` are exactly what EraSection.tsx wires up: EraSection dedupes
 * `videoFeed` against `items`'s own embeds (embeddedYoutubeIds) before ever
 * calling mergeEraFeed — this function takes that already-deduped list
 * rather than reimplementing the wiring, so the two call sites can't drift.
 *
 * `ctx.inlineVideoOwnerIds` is computed from the FULL `items` list, matching
 * what the app itself does when no filter is active (filters.size === 0,
 * "show everything") — exactly the case this checker evaluates, since it has
 * no notion of an active filter.
 *
 * Pure function of its inputs — exported so the unit tests can exercise it
 * against small fixtures instead of the full corpus.
 */
export function eraCoverage({ eraId, eraStart, eraEnd, items, videoFeed }) {
  const merged = mergeEraFeed(items, videoFeed, eraStart, eraEnd);
  const ctx = { inlineVideoOwnerIds: inlineVideoMomentIds(items) };

  const offenders = [];
  const filterCounts = Object.fromEntries(ALL_FILTERS.map((f) => [f, 0]));
  let untaggedAppearanceVideos = 0;

  for (const entry of merged) {
    const filters = filtersForEntry(entry, ctx);
    for (const f of filters) filterCounts[f] += 1;

    if (filters.length === 0) {
      const { id, title } = entryIdentity(entry);
      offenders.push({ era: eraId, kind: entry.kind, id, title });
    }

    if (entry.kind === 'video' && isAppearance(entry.video)) {
      const hasTopic = filters.some((f) => TOPIC_FILTERS.includes(f));
      if (!hasTopic) untaggedAppearanceVideos += 1;
    }
  }

  const zeroFilters = ALL_FILTERS.filter((f) => filterCounts[f] === 0);
  return { eraId, offenders, filterCounts, zeroFilters, untaggedAppearanceVideos };
}

/** Every era's coverage, from the real, live corpus. */
export function collectCoverage() {
  return ERAS.map((era) => {
    const items = contentForEra(era.id);
    const videoFeed = eraVideoFeed(era.id, embeddedYoutubeIds(items));
    return eraCoverage({ eraId: era.id, eraStart: era.start, eraEnd: era.end, items, videoFeed });
  });
}

function main() {
  const perEra = collectCoverage();

  const offenders = perEra.flatMap((r) => r.offenders);
  const untaggedAppearanceVideos = perEra.reduce((n, r) => n + r.untaggedAppearanceVideos, 0);

  console.log(`filter coverage: ${perEra.length} eras checked.`);

  for (const r of perEra) {
    if (r.zeroFilters.length > 0) {
      console.log(`  \u26a0 ${r.eraId}: no items under ${r.zeroFilters.join(', ')}`);
    }
  }

  // Step 7a: a "clean, quotable" line for a founder — how many appearance-
  // family videos (interviews, award speeches, etc.) carry no topic tag.
  // Expected today: VideoNote has no topic field, so this is every playable
  // appearance video, not a regression. See PLAN.md step 7a.
  console.log(
    `\n${untaggedAppearanceVideos} appearance-family video(s) carry no topic tag ` +
      `(Videos-only — VideoNote has no topic field yet).`,
  );

  if (offenders.length > 0) {
    console.error(
      `\n\u2717 ${offenders.length} item(s) with zero filter ids — unreachable under any active filter:\n`,
    );
    for (const o of offenders) console.error(`  \u2022 ${formatOffender(o)}`);
    console.error('\nBackfill tags for each (PLAN.md step 7) — do not invent facts.\n');
    process.exit(1);
  }

  console.log('\n\u2713 every timeline item carries at least one filter id.');
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/check-filter-coverage.mjs')
) {
  main();
}
