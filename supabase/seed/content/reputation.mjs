// Vault content — reputation era.
//
// First batch: November 2017, the album-release wavetop month. Every claim
// verified against its cited source directly. See
// docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first) authoring model this follows.
//
// Note on the "Look What You Made Me Do" item: it touches the 2016
// Kanye West/Kim Kardashian phone-call controversy. Debated explicitly
// against the framework's hard exclusion on relationship/private-life
// theories — judged in-scope because it's a public feud Taylor herself
// confirmed on record (2019 Rolling Stone interview), not fan/media
// speculation about a private relationship. Sourced to 2 independent
// outlets (stricter than the usual 1-source bar for `music`) given the
// public-figure adjacency.

export default {
  eraSlug: 'reputation',
  items: [
    {
      year: 2017,
      month: 11,
      category: 'business',
      title: 'reputation sells more than the rest of the chart combined',
      snippet:
        '1.238 million units in week one — the only artist in Nielsen history with four different million-selling album weeks.',
      sourceUrl: 'https://www.billboard.com/pro/taylor-swift-reputation-debuts-no-1-billboard-200-albums/',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-reputation-debuts-no-1-billboard-200-albums/',
          },
          {
            outlet: 'Refinery29',
            url: 'https://www.refinery29.com/en-us/2017/11/182106/taylor-swift-reputation-billboard-chart',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2017,
      month: 11,
      category: 'music',
      title: 'Look What You Made Me Do, and the phone call it started with',
      snippet:
        "By her own account, the song began as a poem about deciding who she could trust — she later said the bridge's phone-call line played on 'a stupid phone call I shouldn't have picked up,' the Kanye West call at the center of their 2016 feud.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Look_What_You_Made_Me_Do',
      thumbnailUrl: null,
      moment: {
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Look_What_You_Made_Me_Do' },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/taylor-swift-rolling-stone-interview-880794/',
          },
        ],
        photos: [],
      },
    },
  ],
};
