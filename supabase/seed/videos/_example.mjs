// TEMPLATE for the CONTENT track (Joey) — official videos / visual media.
// Copy this to `<era-slug>.mjs` and fill in one entry per official work.
// Files starting with "_" are ignored by the seed runner, so this template is
// never seeded.
//
// Shape: `VideoWork` in packages/shared/src/vault-types.ts (audit §4b).
// Rules:
//   - kind: music_video | lyric_video | short_film | tour_film | documentary | performance
//   - summary: <=400 chars, hook-voiced — a line, not a shot list.
//   - symbolism/easterEggs: DOCUMENTED readings only; label anything
//     speculative as a theory record instead (theories/<era>.mjs).
//   - officialUrl: the canonical official upload, or null — never a re-upload.
//   - media: rights-aware MediaRef objects only (kind + rights REQUIRED) —
//     typically a YouTube oEmbed of the official upload. Never rehosted files.
//   - sources: full provenance objects (audit §5) — >=1 REQUIRED.
//
// Then run:  npm run db:seed:videos
export default {
  eraSlug: 'midnights',
  videos: [
    {
      slug: 'example-video',
      kind: 'music_video',
      title: 'Example Video',
      director: 'Taylor Swift',
      releasedOn: '2022-10-21',
      relatedSongs: ['Example Song'],
      summary: 'One sourced line on the video — premise, premiere, or impact.',
      symbolism: 'Documented symbolism in our words, or null.',
      easterEggs: ['One documented egg per line.'],
      officialUrl: 'https://www.youtube.com/watch?v=XXXXXXXXXXX',
      media: [
        {
          kind: 'oembed',
          rights: 'platform_tos',
          provider: 'youtube',
          post_url: 'https://www.youtube.com/watch?v=XXXXXXXXXXX',
          oembed_fetched_at: '2026-07-08',
          attribution: 'Taylor Swift — official YouTube channel',
        },
      ],
      sources: [
        {
          source_url: 'https://example.com/source-article',
          source_title: 'Example article',
          publisher: 'Example Mag',
          source_type: 'reputable_press',
          accessed_at: '2026-07-08',
          reliability_score: 4,
        },
      ],
    },
  ],
};
