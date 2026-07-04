// Vault content — Red era.
//
// Two wavetop months: Oct 2012 (album release) and Mar 2013 (tour opens).
// Every claim verified against its cited source directly. See
// docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first) authoring model this follows.
//
// "All Too Well" is one of the most persistently theorized songs in
// Swift's catalog. Deliberately excludes any naming/implication — sticks
// to Taylor's own quote about the scarf as a songwriting device, not the
// fan theory about who it's about.

export default {
  eraSlug: 'red',
  items: [
    {
      year: 2012,
      month: 10,
      category: 'business',
      title: 'Red sells 1.2 million copies — the biggest week in a decade',
      snippet:
        "1.208 million copies in week one — the strongest opening week for any album since Eminem's The Eminem Show in 2002, and her second million-selling debut in a row.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'Slate',
            url: 'https://slate.com/culture/2012/10/taylor-swift-album-sales-record-1-2-million-copies-of-red-sold-in-first-week-according-to-soundscan.html',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-country/taylor-swifts-red-sells-1-2-million-copies-in-first-week-243204/',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2012,
      month: 10,
      category: 'music',
      title: 'All Too Well, and the scarf that became a metaphor',
      snippet:
        "The scarf in the lyrics — Taylor's called it \"a metaphor,\" then stopped herself before saying more.",
      sourceUrl: 'https://www.etonline.com/taylor-swift-says-red-scarf-in-all-too-well-is-a-metaphor-190595',
      thumbnailUrl: null,
      moment: {
        context:
          'Full quote: "Basically, the scarf is a metaphor, and we turned it red because red is a very important color in this album, which is called Red."',
        sources: [
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/taylor-swift-says-red-scarf-in-all-too-well-is-a-metaphor-190595',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2013,
      month: 3,
      category: 'tour',
      title: 'The Red Tour opens with Ed Sheeran in Omaha',
      snippet:
        "A sold-out crowd of 27,877 got 17 songs and a surprise duet on 'Everything Has Changed' with opening act Ed Sheeran.",
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Red_Tour',
      thumbnailUrl: null,
      moment: {
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Red_Tour' }],
        photos: [],
      },
    },
  ],
};
