// TEMPLATE for the CONTENT track (Joey) — official videos / visual media.
// Copy this to `<era-slug>.mjs` and fill in one entry per official work.
// Files starting with "_" are ignored by the seed runner, so this template is
// never seeded.
//
// Shape: `VideoWork` in packages/shared/src/vault-types.ts (audit §4b).
// Rules:
//   - kind: one of TEN values, in two families (2026-08-12).
//
//     WORKS — visual media she made or headlined; the video IS the output:
//       music_video   the official video for a song
//       lyric_video   the official lyric video for a song
//       short_film    a narrative film release (e.g. All Too Well)
//       tour_film     a concert film
//       documentary   a documentary or studio-sessions film
//       performance   her performing a song — live TV, awards stage, session
//
//     APPEARANCES — Taylor herself, on screen, inside someone else's
//     programming; the video is the record of an event, not a work she
//     released. Her on someone's couch, stage, podium or carpet. RULE ZERO
//     (Joey, 2026-08-12: "it should only be Taylor"): if she is not the person
//     on screen, it does not belong here, however big the news. A broadcast
//     announcing something about her is a timeline moment — the Time Person of
//     the Year reveal on TODAY was removed from the rail on exactly this line.
//     The bar is a specific dated event, an official upload, and her in it.
//       interview     a sit-down conversation: talk show, podcast, or
//                     radio/streaming interview (Fallon, New Heights, Zane Lowe)
//       award_speech  accepting or presenting at an awards show — a podium
//       speech        a standalone address outside an awards show (NYU 2022)
//       press_event   publicity appearance she is present at: a premiere Q&A
//                     or a red carpet she walks (Sundance Q&A, GMA carpet).
//                     Never a studio segment where someone discusses her.
//
//     Pick by WHAT THE VIEWER SEES, not by what the event was called. A speech
//     at a podium is never `performance`; a song sung on a talk show is
//     `performance`, not `interview`. If nothing fits honestly, the record does
//     not belong on the Videos rail — say so rather than stretching a value.
//   - tags: OPTIONAL topic ContentTags ('Music' | 'Fashion' | 'Tour' |
//     'Relationship' | 'Lore') — author ONLY where the record's own
//     kind/title/relatedSongs/summary genuinely support the topic. Every
//     video is reachable under the structural Videos filter chip regardless;
//     do not add a tag to make a record reachable under a topic it isn't
//     honestly about. May carry more than one where genuinely warranted.
//   - summary: <=400 chars, hook-voiced — a line, not a shot list.
//   - symbolism/easterEggs: DOCUMENTED readings only; label anything
//     speculative as a theory record instead (theories/<era>.mjs).
//   - officialUrl: the canonical official upload, or null — never a re-upload.
//     For an APPEARANCE that means the upload on the channel that owns the
//     footage (the show, the network, the awards body, the outlet that filmed
//     it). A fan archive may be a timeline SOURCE; it may never be an
//     officialUrl, no matter how long it has been alive. If the only surviving
//     copy is a fan re-upload, the appearance stays off this rail.
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
      tags: ['Music'],
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
