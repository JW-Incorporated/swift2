// TEMPLATE — not loaded (files starting with "_" are skipped by the generator).
// Copy this shape into a per-era file, e.g. `red.mjs`, when scoring songs
// (Stage 2 of docs/proposals/2026-07-19-mood-chat.md).
//
// Mood scores for the Mood Chat catalogue. One file per era; `songs` reference
// real tracks by their `slug` from supabase/seed/tracks/<era>.mjs. The
// generator (scripts/sync-song-moods.mjs) merges these onto the song list and
// FAILS THE BUILD on any error:
//   - a slug that doesn't resolve to a real track in this era
//   - a mood axis missing, unknown, or outside [0,1]
//   - energy/valence outside [0,1]
//   - an empty useCase, or a useCase/oneLiner that looks like quoted verse
//
// HARD RULES (docs/proposals §"Hard rules", safety.redline):
//   - NO LYRICS, EVER. `oneLiner` and `useCase` are ORIGINAL prose only.
//   - Score from the track's EXISTING researched note/article — never invent a
//     fact about a song to justify an axis.
//
// The eight axes are all required, each 0..1:
//   heartbreak, anger, nostalgia, joy, calm, defiance, longing, catharsis
// Plus: energy (0 still .. 1 driving), valence (0 sad .. 1 happy).

export default {
  eraSlug: 'red', // must match the track seed file's eraSlug
  songs: [
    {
      slug: 'all-too-well-10-minute-version', // must exist in tracks/red.mjs
      moods: {
        heartbreak: 0.95,
        anger: 0.6,
        nostalgia: 0.85,
        joy: 0.05,
        calm: 0.1,
        defiance: 0.3,
        longing: 0.9,
        catharsis: 0.8,
      },
      energy: 0.5,
      valence: 0.15,
      useCase: ['crying in the car', 'the 3am spiral'],
      oneLiner: 'Ten minutes of a wound reopened on purpose.',
    },
  ],
};
