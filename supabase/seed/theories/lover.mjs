// Vault theories/easter eggs — Lover era. All URLs verified 2026-07-08.

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
  eraSlug: 'lover',
  theories: [
    {
      slug: 'butterfly-mural',
      kind: 'easter_egg',
      title: 'The butterfly mural that announced the era',
      claim:
        'Hours before "ME!" dropped in April 2019, a pastel butterfly mural by street artist Kelsey Montague appeared in Nashville — fans swarmed it, correctly reading it as the snake era molting into something new.',
      evidence:
        'Documented rollout stunt: the mural went up unannounced, fan detectives connected it to the countdown Taylor had posted, and she showed up at the wall herself. The butterfly-eats-snake beat inside the "ME!" video completed the metamorphosis arc.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: ['reputation:snake-reclamation'],
      sources: [wiki('Me!', 'ME!', 'the mural stunt is documented in the single article')],
    },
    {
      slug: 'mastermind-doctrine',
      kind: 'easter_egg',
      title: 'The easter-egg doctrine, stated on the record',
      claim:
        'Not a theory — a confession: Taylor has said outright that she plants clues about future music years in advance, and that decoding them is a game she deliberately plays with fans.',
      evidence:
        'She described the practice in Lover-era interviews and later wrote it into a song ("Mastermind"). This record is the anchor for every other entry in this collection: the eggs are real, planted, and intended to be found — which is exactly why unconfirmed readings still need labels.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: ['debut:liner-notes-hidden-messages'],
      sources: [
        wiki('Cultural_impact_of_Taylor_Swift', 'Cultural impact of Taylor Swift', 'documents her stated easter-egg practice'),
        wiki('Swifties', 'Swifties'),
      ],
    },
  ],
};
