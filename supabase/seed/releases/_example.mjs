// TEMPLATE for the CONTENT track (Joey) — canonical releases.
// Copy entries into `releases.mjs` (or add a new non-underscore file). Files
// starting with "_" are ignored by the seed runner, so this is never seeded.
//
// Shape: `Release` in packages/shared/src/vault-types.ts (audit §4b).
// Rules:
//   - slug: stable kebab id, globally unique across all releases.
//   - kind: album | rerecording | ep | deluxe | single | live
//   - parentReleaseSlug: the release this is a version of (deluxe -> standard,
//     Taylor's Version -> original), or null for a root release.
//   - tracklist: track TITLES in order — facts only, never lyrics.
//   - note: <=400 chars, hook-voiced, sourced. No fabrication.
//   - sources: full provenance objects (audit §5) — >=1 REQUIRED.
//
// Then run:  npm run db:seed:releases
export default {
  releases: [
    {
      slug: 'example-album',
      eraSlug: 'midnights',
      kind: 'album',
      title: 'Example Album',
      releaseDate: '2022-10-21',
      label: 'Republic',
      trackCount: 13,
      parentReleaseSlug: null,
      tracklist: ['Track One', 'Track Two'],
      note: 'One sourced hook-voiced line about the release — a line, not an encyclopedia entry.',
      sources: [
        {
          source_url: 'https://example.com/source-article',
          source_title: 'Example article',
          publisher: 'Example Mag',
          source_type: 'reputable_press',
          accessed_at: '2026-07-08',
          reliability_score: 4,
          excerpt: null,
          notes: 'anchors the release date and label',
        },
      ],
    },
  ],
};
