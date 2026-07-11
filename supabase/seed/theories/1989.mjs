// Vault theories/easter eggs — 1989 era. All URLs verified reachable 2026-07-08.

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
  eraSlug: '1989',
  theories: [
    {
      slug: 'no-its-becky',
      kind: 'theory',
      title: '"no it\'s becky"',
      claim:
        'The 2014 Tumblr joke: a photo of Taylor captioned as a girl named Becky who "died of marijuana overdose," answered with "no it\'s becky." Fans ran with Becky as Taylor\'s alter ego — and Taylor got the joke.',
      evidence:
        'Born as a Tumblr exchange during her famously online 1989-era presence. Taylor canonized the meme herself by wearing a "no its becky" T-shirt, turning a fandom in-joke into official-adjacent lore.',
      confidence: 'joke_meme',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        {
          source_url: 'https://knowyourmeme.com/memes/becky',
          source_title: 'Becky',
          publisher: 'Know Your Meme',
          source_type: 'fan_forum',
          accessed_at: '2026-07-08',
          reliability_score: 2,
          excerpt: null,
          notes: 'documents the original Tumblr post and the meme\'s spread — the meme itself is the subject here',
        },
        wiki('Swifties', 'Swifties', 'covers her 1989-era Tumblr fluency that made the meme land'),
      ],
    },
  ],
};
