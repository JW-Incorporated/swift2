// Vault content — evermore era.
//
// Three wavetop months: Dec 2020 (evermore's own release), Apr 2021
// (Fearless (Taylor's Version) released) and Nov 2021 (Red (Taylor's
// Version) released) — both TV re-releases fall in evermore's date range
// per their actual release dates, same pattern as Speak Now TV / 1989 TV
// falling in the Midnights era (see midnights.mjs). Every claim verified
// against its cited source directly. See
// docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first) authoring model this follows.
//
// Item 1's second source is a record-label press release, not a fully
// independent outlet — a deliberate compromise, not an oversight. Variety,
// Rolling Stone, and NME all independently reported the same fact per
// search snippets, but every direct fetch attempt hit a paywall this
// session. Accepted because the claim itself is a simple, objective,
// publicly-verifiable chart position (not an interpretive or reputational
// claim) and the label has no incentive to misstate real Billboard data.
// Revisit if a clean independent source becomes reachable.

export default {
  eraSlug: 'evermore',
  items: [
    {
      year: 2020,
      month: 12,
      category: 'business',
      title: 'evermore makes her the first artist to top both charts at once — twice',
      snippet:
        "Her eighth No. 1 album, with 'willow' also debuting at No. 1 — the only artist ever to pull off that double feat twice, let alone in the same year.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Evermore',
      thumbnailUrl: null,
      moment: {
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Evermore' },
          {
            outlet: 'Universal Music Canada',
            url: 'https://www.universalmusic.ca/press-releases/taylor-swift-is-the-first-and-only-artist-in-history-to-debut-twice-at-1-on-both-the-billboard-200-and-billboard-hot-100-simultaneously/',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2020,
      month: 12,
      category: 'music',
      title: "willow, and the spell it's supposed to sound like",
      snippet:
        "Taylor's own description: 'Willow is about intrigue, desire, and the complexity that goes into wanting someone. I think it sounds like casting a spell to make someone fall in love with you.'",
      sourceUrl: 'https://en.wikipedia.org/wiki/Willow_(song)',
      thumbnailUrl: null,
      moment: {
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Willow_(song)' }],
        photos: [],
      },
    },
    {
      year: 2021,
      month: 4,
      category: 'business',
      title: 'Fearless (Taylor\'s Version) is the first re-recorded album ever to hit No. 1',
      snippet:
        '291,000 units in week one — her ninth No. 1 album, tying Madonna, and the only re-recorded album in Billboard 200 history to top the chart.',
      sourceUrl: 'https://www.billboard.com/articles/news/9558306/taylor-swift-fearless-taylors-version-tops-billboard-200/',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/articles/news/9558306/taylor-swift-fearless-taylors-version-tops-billboard-200/',
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2021/04/18/taylor-swift-charts-her-ninth-no-1-album-in-the-us-with-fearless-taylors-version/',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2021,
      month: 11,
      category: 'business',
      title: 'All Too Well (10 Minute Version) becomes the longest song ever to hit No. 1',
      snippet:
        '10 minutes and 13 seconds — beating a nearly 50-year-old record held by Don McLean\'s "American Pie." Taylor\'s own reaction: "You guys sent a 10-minute song to Number One for the first time in history."',
      sourceUrl: 'https://www.guinnessworldrecords.com/news/2021/11/taylor-swifts-10-minute-all-too-well-is-longest-song-to-reach-no-1-683614',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'Guinness World Records',
            url: 'https://www.guinnessworldrecords.com/news/2021/11/taylor-swifts-10-minute-all-too-well-is-longest-song-to-reach-no-1-683614',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-all-too-well-longest-number-one-billboard-1261579/',
          },
        ],
        photos: [],
      },
    },
  ],
};
