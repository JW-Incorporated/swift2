// TEMPLATE for the CONTENT track (Joey) — easter eggs + fan theories.
// Copy this to `<era-slug>.mjs` and fill in DOCUMENTED lore. Files starting
// with "_" are ignored by the seed runner, so this template is never seeded.
//
// Shape: `Theory` in packages/shared/src/vault-types.ts (audit §4b).
// Rules:
//   - confidence + outcome are REQUIRED on every record — they render as
//     badges so speculation never reads as fact.
//     confidence: official | confirmed_interview | reputable_reporting |
//                 strong_fan_consensus | plausible | clowning | disproven | joke_meme
//     outcome:    confirmed | partially_confirmed | pending | debunked |
//                 abandoned | unfalsifiable
//   - claim: what fans believe, in OUR words, <=400 chars.
//   - HARD BAN (2026-07-04 brief, carried over verbatim): NO speculation
//     about relationships, private life, sexuality, family, or identity.
//   - fan_forum/social sources are allowed HERE (they are the subject);
//     factual assertions still need a stronger anchor.
//
// Then run:  npm run db:seed:theories
export default {
  eraSlug: 'midnights',
  theories: [
    {
      slug: 'example-theory',
      kind: 'theory', // or 'easter_egg'
      title: 'The example theory',
      claim: 'What fans believe, in our words — a hook, not an essay.',
      evidence: 'The documented evidence trail, in our words.',
      confidence: 'strong_fan_consensus',
      outcome: 'pending',
      relatedSlugs: ['midnights:karma'],
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
