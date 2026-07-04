// Vault content — debut era.
//
// First batch: October 2006, the album's only wavetop month. Every claim
// verified against its cited source directly. See
// docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first) authoring model this follows.
//
// A business/chart-legacy item (the album's 157-week/longest-charting-
// album-of-the-2000s record) was researched but not included — couldn't
// find a second independent source beyond Wikipedia this session (several
// candidates were blocked or didn't carry the specific figure). Add once a
// working second source is found; don't lower the two-source bar to force
// it in.

export default {
  eraSlug: 'debut',
  items: [
    {
      year: 2006,
      month: 10,
      category: 'music',
      title: 'The math-class idea behind "Tim McGraw"',
      snippet: 'The idea for her debut single came to her in freshman-year math class.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Tim_McGraw_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          "She brought it to co-writer Liz Rose that day — an idea about a senior boyfriend leaving for college — and they finished \"Tim McGraw\" together at the piano after school.",
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Tim_McGraw_(song)' }],
        photos: [],
      },
    },
    {
      year: 2006,
      month: 9,
      category: 'sighting',
      title: 'Her Grand Ole Opry debut, in a sundress at 16',
      snippet:
        'A white sundress, natural curls, and "Tim McGraw" — before the album that made her famous had even come out.',
      sourceUrl: 'https://tasteofcountry.com/taylor-swift-grand-ole-opry-debut/',
      thumbnailUrl: null,
      moment: {
        sources: [{ outlet: 'Taste of Country', url: 'https://tasteofcountry.com/taylor-swift-grand-ole-opry-debut/' }],
        photos: [],
      },
    },
    {
      year: 2007,
      month: 4,
      category: 'fashion',
      title: 'A strapless BCBG gown for her first CMT win',
      snippet:
        'A strapless BCBG Max Azria gown, all tulle skirt and neutral tones, the night "Tim McGraw" won Breakthrough Video of the Year.',
      sourceUrl:
        'https://www.hellomagazine.com/celebrities/516949/taylor-swifts-most-iconic-cmt-performances-head-turning-outfits-over-the-years/',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'Hello!',
            url: 'https://www.hellomagazine.com/celebrities/516949/taylor-swifts-most-iconic-cmt-performances-head-turning-outfits-over-the-years/',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2007,
      month: 11,
      category: 'business',
      title: 'Wins her first CMA Award — the Horizon Award',
      snippet:
        'Her first career CMA Award, the Horizon Award, at the 41st CMA Awards on Nov. 7, 2007 — the trophy now known as New Artist of the Year.',
      sourceUrl: 'https://www.cbsnews.com/news/taylor-swift-reacts-to-cmas-win/',
      thumbnailUrl: null,
      moment: {
        sources: [
          { outlet: 'CBS News', url: 'https://www.cbsnews.com/news/taylor-swift-reacts-to-cmas-win/' },
          { outlet: 'Forbes', url: 'https://www.forbes.com/pictures/geeg45eilhf/2007-success-is-on-the/' },
        ],
        photos: [],
      },
    },
    {
      year: 2007,
      month: 12,
      category: 'business',
      title: 'Our Song becomes her first No. 1',
      snippet:
        'Six weeks atop Hot Country Songs — the first of what would become seven country No. 1s before her pivot to pop.',
      sourceUrl: 'https://www.billboard.com/pro/taylor-swift-our-song-this-week-in-billboard-chart-history-2007/',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-our-song-this-week-in-billboard-chart-history-2007/',
          },
          {
            outlet: 'Wide Open Country',
            url: 'https://www.wideopencountry.com/our-song-taylor-swift/',
          },
        ],
        photos: [],
      },
    },
  ],
};
