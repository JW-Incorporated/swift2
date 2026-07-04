// Vault content — Speak Now era.
//
// Two wavetop months: Oct 2010 (album release) and Feb 2011 (tour opens).
// Every claim verified against its cited source directly. See
// docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first) authoring model this follows.
//
// "Dear John" is one of the most persistently theorized songs in Swift's
// catalog (widely attributed to a real ex-partner). Deliberately excludes
// any naming/implication — sticks to the song's own described narrative
// and a critic's assessment. Codex's first-pass title ("the relationship
// it doesn't name") was rejected as too knowing a wink at the theory;
// reworded to stay further from that line.

export default {
  eraSlug: 'speak-now',
  items: [
    {
      year: 2010,
      month: 10,
      category: 'business',
      title: 'Speak Now sells over a million copies in a single week',
      snippet:
        "1,047,000 copies in week one — the first album since Lil Wayne's Tha Carter III to cross a million in its opening week.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'Grammy.com',
            url: 'https://www.grammy.com/news/taylor-swift-speak-now-taylors-version-legacy-songs-mine-dear-john-mean/',
          },
          { outlet: 'The Boot', url: 'https://theboot.com/taylor-swift-speak-now-sales-charts/' },
        ],
        photos: [],
      },
    },
    {
      year: 2010,
      month: 10,
      category: 'music',
      title: "Dear John's slow-burn reckoning",
      snippet: 'A slow-burning ballad about a 19-year-old narrator naming the damage after the fact.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Dear_John_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          "Critic Rob Sheffield called it 'a failed quasi-relationship, with no happy ending, no moral, no solution.'",
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Dear_John_(Taylor_Swift_song)' }],
        photos: [],
      },
    },
    {
      year: 2010,
      month: 10,
      category: 'music',
      title: 'Mean, written straight at her critics',
      snippet: "Not a relationship song — this one's aimed straight at her critics.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Mean_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          "In her words: people who \"attack everything about a person\" instead of offering real feedback.",
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Mean_(song)' }],
        photos: [],
      },
    },
    {
      year: 2011,
      month: 11,
      category: 'fashion',
      title: 'A dove-grey J. Mendel gown for her second Entertainer of the Year win',
      snippet:
        'A dove-grey J. Mendel gown with a billowing train, held up the whole walk to the stage for her second CMA Entertainer of the Year award.',
      sourceUrl: 'https://www.eonline.com/news/804943/taylor-swift-s-evolving-cma-awards-style-over-the-years',
      thumbnailUrl: null,
      moment: {
        context:
          'The win made her only the second female artist in CMA history, after Barbara Mandrell, to win Entertainer of the Year twice.',
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/804943/taylor-swift-s-evolving-cma-awards-style-over-the-years',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2011,
      month: 2,
      category: 'tour',
      title: 'The Speak Now World Tour opens in Singapore',
      snippet:
        '8,964 fans at Singapore Indoor Stadium — the start of a 110-show tour across 19 territories, through March 18, 2012.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now_World_Tour',
      thumbnailUrl: null,
      moment: {
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Speak_Now_World_Tour' }],
        photos: [],
      },
    },
  ],
};
