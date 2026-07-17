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
        'The 2014 Tumblr joke: a photo of Taylor captioned as a girl named Becky who "snorted marijuana at a party and died," answered with "no it\'s becky." Fans ran with Becky as Taylor\'s alter ego — and Taylor got the joke.',
      evidence:
        'Born as a Tumblr exchange during her famously online 1989-era presence. Taylor canonized the meme herself by wearing a "no its becky" T-shirt, turning a fandom in-joke into official-adjacent lore.',
      confidence: 'joke_meme',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        {
          source_url: 'https://time.com/3430491/taylor-swift-internet-meme-no-its-becky-tshirt/',
          source_title: "Taylor Swift Wears 'no its becky' T-Shirt",
          publisher: 'Time',
          source_type: 'reputable_press',
          accessed_at: '2026-07-08',
          reliability_score: 4,
          excerpt: null,
          notes: 'documents the original Tumblr post and the meme\'s spread — the meme itself is the subject here',
        },
        wiki('Swifties', 'Swifties', 'covers her 1989-era Tumblr fluency that made the meme land'),
      ],
    },
    {
      slug: '1989-lowercase-liner-codes',
      kind: 'easter_egg',
      title: 'The lowercase inversion',
      claim:
        "1989's booklet flips her oldest trick: after five albums of hidden messages spelled in capitalized letters, the codes moved to the lowercase letters — and read in track order, the thirteen messages tell one continuous story.",
      evidence:
        'Billboard decoded and published the full 1989 set the week the album dropped — it opens "We begin our story in New York" and runs as a single arc through all thirteen tracks, a two-year autobiography threaded through the lyric sheets. The inversion mattered to code-watchers: new sound, new cipher. It was also the finale — the booklet codes stop entirely at reputation.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: ['debut:liner-notes-hidden-messages', 'red:twenty-two-liner-note-code'],
      sources: [
        {
          source_url: 'https://www.billboard.com/music/music-news/taylor-swift-1989-liner-notes-6296676/',
          source_title: "Taylor Swift's '1989' Liner Note Messages & Reference Guide",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
          excerpt: null,
          notes: 'the full decoded set, message by message',
        },
        {
          source_url: 'https://www.today.com/popculture/music/taylor-swift-easter-eggs-hidden-messages-rcna51887',
          source_title: 'Liner notes and easter eggs: How Taylor Swift turned fandom into a scavenger hunt',
          publisher: 'Today',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
          excerpt: null,
          notes: 'documents the capital-letter practice, the 1989 lowercase inversion, and the stop after 1989',
        },
      ],
    },
  ],
};
