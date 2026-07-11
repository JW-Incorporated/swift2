// TEMPLATE for the CONTENT track (Joey) — album song track guide.
// Copy this to `<era-slug>.mjs` (e.g. `midnights.mjs`) and fill in one entry per
// song WHERE A REAL SOURCE EXISTS. Files starting with "_" are ignored by the
// seed runner, so this template is never seeded.
//
// This is the NON-month-scoped shape (per
// docs/proposals/2026-07-04-song-track-guide-content-shape.md): it's reached
// from the album, not by scrubbing to a month, so it stays off the Tier 0
// timeline payload — full-catalog coverage without breaking the budget.
//
// Rules:
//   - note: a short SOURCED line — meaning / background / Easter egg (<=400
//     chars, enforced by a DB CHECK). Never invent; skip a track entirely if no
//     real source exists (same no-fabrication rule as the rest of the Vault).
//   - NO theories about relationships, private life, sexuality, family, or
//     identity — content/lyrical/Easter-egg notes only (per the 2026-07-04 brief).
//   - sources: [{ outlet, url }] — same shape as moment.sources.
//
//   - writers / producers (OPTIONAL): string[] of public-record credits.
//   - release (OPTIONAL): the album/single title, e.g. 'Midnights'.
//   - releaseDate (OPTIONAL): ISO date (YYYY-MM-DD) the release came out.
//   - singleReleaseDate (OPTIONAL): ISO date the track was released as its
//     own single, if ever.
//   - themes (OPTIONAL): string[] of short documented lyrical/thematic tags.
//   These all flow straight to the UI's "essential facts" area on the song's
//   TrackDetail page — no separate source needed beyond the row's own
//   `sources` above.
//
//   - discussion (OPTIONAL): string[] of real, researched paragraphs — why
//     she wrote it, what it's about, its place in the album/era. This is the
//     actual "article" shown on the song's TrackDetail page. Requires its OWN
//     discussionSources citation (independent of `sources` above) — a
//     discussion entry with no discussionSources is dropped entirely by the
//     generator, same no-unsourced-content rule as everywhere else.
//   - quotedLines (OPTIONAL): string[] of a FEW short illustrative lines from
//     the song — NOT full lyrics (see docs/decisions.md 2026-07-09, which
//     supersedes an earlier full-lyrics decision). Use like a music-journalism
//     quote: enough to ground the discussion in the actual words, never the
//     complete song.
//
// Then run:  npm run db:seed:tracks
export default {
  eraSlug: 'midnights',
  tracks: [
    {
      trackNumber: 3,
      trackTitle: 'Anti-Hero',
      note: 'One sourced line on the song — its meaning, background, or a documented Easter egg. A hook, not an essay.',
      sourceUrl: 'https://example.com/source-article',
      sources: [{ outlet: 'Example Mag', url: 'https://example.com/source-article' }],
      // discussion: ['Paragraph one of real researched analysis.', 'Paragraph two.'],
      // quotedLines: ['A short illustrative line from the song.'],
      // discussionSourceUrl: 'https://example.com/discussion-source',
      // discussionSources: [{ outlet: 'Example Mag', url: 'https://example.com/discussion-source' }],
    },
  ],
};
