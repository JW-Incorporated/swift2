// TEMPLATE for the CONTENT track (Joey) — tours.
// Copy entries into `tours.mjs` (or add a new non-underscore file). Files
// starting with "_" are ignored by the seed runner, so this is never seeded.
//
// Shape: `Tour` in packages/shared/src/vault-types.ts (audit §4b).
// Rules:
//   - slug: stable kebab id, globally unique across tours.
//   - eraSlug: the era active when the tour OPENED.
//   - note: <=400 chars, hook-voiced, sourced. No fabrication.
//   - shows[]: only notable, DOCUMENTED shows (Eras-Tour depth) — each show
//     carries its own confidence + sources so per-show fan documentation
//     never renders as unqualified fact. Venue-level, always past-tense,
//     never real-time (CI-enforced).
//   - sources: full provenance objects (audit §5) — >=1 REQUIRED.
//
// Then run:  npm run db:seed:tours
export default {
  tours: [
    {
      slug: 'example-tour',
      eraSlug: 'midnights',
      title: 'The Example Tour',
      openedOn: '2023-03-17',
      closedOn: '2024-12-08',
      legs: [{ name: 'North America', from: '2023-03-17', to: '2023-08-09', showCount: 56 }],
      showCount: 149,
      surpriseSongsNote: 'How the acoustic surprise-song slot worked on this tour, or null.',
      shows: [
        {
          date: '2023-03-17',
          city: 'Glendale, AZ',
          venue: 'State Farm Stadium',
          surpriseSongs: ['mirrorball', 'Tim McGraw'],
          mashups: [],
          guests: [],
          outfitNote: null,
          setlistChange: null,
          confidence: 'reputable_reporting',
          sources: [
            {
              // TODO: No verifiable source exists for this placeholder record as-is.
              // Replace with a real source URL before converting to production seed data.
              source_url: 'https://www.taylorswift.com',
              source_title: 'Placeholder source',
              publisher: 'TBD',
              source_type: 'reputable_press',
              accessed_at: '2026-07-08',
              reliability_score: 4,
            },
          ],
        },
      ],
      note: 'One sourced hook-voiced line about the tour.',
      sources: [
        {
          // TODO: No verifiable source exists for this placeholder record as-is.
          // Replace with a real source URL before converting to production seed data.
          source_url: 'https://www.taylorswift.com',
          source_title: 'Placeholder source',
          publisher: 'TBD',
          source_type: 'reputable_press',
          accessed_at: '2026-07-08',
          reliability_score: 4,
        },
      ],
    },
  ],
};
