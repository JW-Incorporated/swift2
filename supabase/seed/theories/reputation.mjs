// Vault theories/easter eggs — reputation era. All URLs verified 2026-07-08.

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
  eraSlug: 'reputation',
  theories: [
    {
      slug: 'snake-reclamation',
      kind: 'easter_egg',
      title: 'Reclaiming the snake',
      claim:
        'After the 2016 feud fallout flooded her comments with snake emoji, the reputation rollout weaponized it: glitchy snake teasers announced the era, a serpent slithered through the visuals, and a giant snake named Karyn towered over the stadium tour.',
      evidence:
        "The era launch was three wordless snake videos posted to blacked-out socials; 'Look What You Made Me Do' leaned all the way in (a snake serving tea); the Stadium Tour made the snake a mascot. A documented, deliberate reclamation arc — the insult became the brand.",
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        wiki('Look_What_You_Made_Me_Do', 'Look What You Made Me Do', 'documents the snake imagery and its feud context'),
        wiki('Kanye_West%E2%80%93Taylor_Swift_feud', 'Kanye West–Taylor Swift feud', 'the 2016 snake-emoji pile-on this answered'),
      ],
    },
  ],
};
