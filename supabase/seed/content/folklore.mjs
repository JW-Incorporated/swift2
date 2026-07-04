// Vault content — folklore era.
//
// One wavetop month: July 2020, the surprise album release. Every claim
// verified against its cited source directly. See
// docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first) authoring model this follows.
//
// The "Teenage Love Triangle" (cardigan/betty/august) is explicitly
// fictional per multiple sources — safe territory, no real-person
// attribution. Character names are a nod to friends' children; deliberately
// not naming which friends, out of general good taste about minors.

export default {
  eraSlug: 'folklore',
  items: [
    {
      year: 2020,
      month: 7,
      category: 'business',
      title: 'folklore makes her the first artist to top both charts at once',
      snippet:
        "Announced the day before release — then Swift became the first artist ever to debut atop the Hot 100 (with 'cardigan') and the Billboard 200 in the same week.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Folklore_(Taylor_Swift_album)',
      thumbnailUrl: null,
      moment: {
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Folklore_(Taylor_Swift_album)' },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-becomes-first-artist-open-atop-hot-100-billboard-200-same-week-1305638/',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2020,
      month: 7,
      category: 'music',
      title: 'A fictional teenage love triangle, told across three songs',
      snippet:
        "cardigan, betty, and august each tell the same summer romance from a different character's point of view — all invented, with names borrowed as an affectionate nod to friends' kids.",
      sourceUrl:
        'https://screenrant.com/taylor-swift-folklore-betty-august-cardigan-love-triangle-song-lyrics-explained/',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'ScreenRant',
            url: 'https://screenrant.com/taylor-swift-folklore-betty-august-cardigan-love-triangle-song-lyrics-explained/',
          },
        ],
        photos: [],
      },
    },
  ],
};
