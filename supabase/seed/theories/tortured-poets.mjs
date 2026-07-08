// Vault theories/easter eggs — Tortured Poets era. All URLs verified 2026-07-08.

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
  eraSlug: 'tortured-poets',
  theories: [
    {
      slug: 'thank-you-aimee-capitals',
      kind: 'easter_egg',
      title: 'The capitals in "thanK you aIMee"',
      claim:
        'The track title is stylized "thanK you aIMee" — the stray capitals spell KIM. Press and fans read the song as addressed to a famous bully by that name; Taylor has never said so herself.',
      evidence:
        'The stylization is objective fact (it is printed that way on the tracklist) and the reading was reported by major outlets within hours. But the attribution remains an inference from typography — so it stays labeled as reporting, not confirmation.',
      confidence: 'reputable_reporting',
      outcome: 'pending',
      relatedSlugs: ['reputation:snake-reclamation'],
      sources: [wiki('The_Tortured_Poets_Department', 'The Tortured Poets Department', 'the stylization and its coverage are documented in the album article')],
    },
    {
      slug: 'peter-pan-throughline',
      kind: 'easter_egg',
      title: 'Peter, seven years later',
      claim:
        'The Anthology track "Peter" reads as the grown-up ending to folklore\'s Peter-and-Wendy thread — fans hold that the boy who "lost Wendy" in "cardigan" is the same Peter who finally never comes back here.',
      evidence:
        'The Peter Pan allusion is explicit in both lyrics four years apart, and the callback was noted across the album\'s press coverage. The songs connect textually; whether they share one narrator is the (unconfirmed) fan layer.',
      confidence: 'reputable_reporting',
      outcome: 'partially_confirmed',
      relatedSlugs: ['folklore:teenage-love-triangle'],
      sources: [
        wiki('The_Tortured_Poets_Department', 'The Tortured Poets Department'),
        wiki('Cardigan_(song)', 'cardigan (song)'),
      ],
    },
  ],
};
