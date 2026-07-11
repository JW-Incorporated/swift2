// Vault theories/easter eggs — The Life of a Showgirl era.
// NOTE: the `the-life-of-a-showgirl` era row lands in rollout PR 2; this file
// seeds cleanly once it exists (the validator knows the slug as expected).
// All URLs verified 2026-07-08.

const wiki = (article, title, notes) => ({
  source_url: `https://en.wikipedia.org/wiki/${article}`,
  source_title: title,
  publisher: 'Wikipedia',
  source_type: 'wiki',
  accessed_at: '2026-07-08',
  reliability_score: 2,
  excerpt: null,
  notes: notes ?? null,
});

export default {
  eraSlug: 'the-life-of-a-showgirl',
  theories: [
    {
      slug: 'orange-era-clues',
      kind: 'theory',
      title: 'The orange era, called before the announcement',
      claim:
        'Through the TTPD stretch, TS12 watchers bet the next era\'s color was orange — reading glittery orange accents into late Eras Tour looks and posts. When The Life of a Showgirl arrived, the branding was orange head to toe.',
      evidence:
        'The album was announced on the New Heights podcast in August 2025 wrapped in glittering orange (and mint) — instantly validating months of color-watching. How much of the pre-announcement orange was planted versus pattern-matched has never been itemized, so the call is graded, not fully confirmed.',
      confidence: 'strong_fan_consensus',
      outcome: 'partially_confirmed',
      relatedSlugs: ['midnights:album-color-canon'],
      sources: [wiki('The_Life_of_a_Showgirl', 'The Life of a Showgirl', 'the orange-branded New Heights announcement is documented in the album article')],
    },
    {
      slug: 'ophelia-rewrite',
      kind: 'easter_egg',
      title: 'Ophelia, rewritten to live',
      claim:
        'The lead single "The Fate of Ophelia" flips Shakespeare: where Hamlet\'s Ophelia drowns in abandonment, the song\'s narrator is pulled out of that fate by love — a literary inversion fans and critics mapped line by line.',
      evidence:
        'The allusion is the title; coverage of the single documented the Hamlet inversion as the song\'s central conceit, continuing the quill-pen literary streak from TTPD (Peter Pan, Cassandra, Clara Bow).',
      confidence: 'reputable_reporting',
      outcome: 'confirmed',
      relatedSlugs: ['tortured-poets:peter-pan-throughline'],
      sources: [wiki('The_Fate_of_Ophelia', 'The Fate of Ophelia')],
    },
  ],
};
