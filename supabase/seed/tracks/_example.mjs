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
    },
  ],
};
