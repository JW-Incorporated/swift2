// Vault content — Midnights era.
//
// First real, sourced batch (pilot, approved by Joey 2026-07-03): October
// 2022, the album-release wavetop month. Every claim below was verified
// against its cited source directly (not taken from a search summary) —
// see docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first, not write-first) authoring model
// this follows.
//
// One real fact was researched but not included: Taylor Swift becoming the
// first artist to hold the entire Billboard Hot 100 top 10 at once (confirmed
// directly on Billboard) — parked because a second independent source
// couldn't be reached this session (NPR/Deadline/other outlets all blocked
// by paywalls or anti-bot errors). Add it once a working second source is
// found; don't lower the two-source bar for `business` to force it in.

export default {
  eraSlug: 'midnights',
  items: [
    {
      year: 2022,
      month: 10,
      category: 'music',
      title: "iHeartRadio's six-night Midnights takeover",
      snippet:
        'Six nights at midnight, Oct 21–26 — the whole album on iHeartRadio stations nationwide, with Taylor sharing some of the stories behind the songs herself.',
      sourceUrl:
        'https://www.iheart.com/content/2022-10-20-celebrate-midnights-with-taylor-swift-on-iheartradio/',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'iHeartRadio',
            url: 'https://www.iheart.com/content/2022-10-20-celebrate-midnights-with-taylor-swift-on-iheartradio/',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2022,
      month: 10,
      category: 'business',
      title: 'Midnights breaks Spotify in a single day',
      snippet:
        "184.6 million album streams in 24 hours, while Taylor's full catalog hit 228 million streams — Spotify's biggest day ever for both, album and artist.",
      sourceUrl:
        'https://newsroom.spotify.com/2022-10-22/taylor-swift-breaks-two-records-with-midnights-becoming-the-most-streamed-artist-on-spotify/',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'Spotify Newsroom',
            url: 'https://newsroom.spotify.com/2022-10-22/taylor-swift-breaks-two-records-with-midnights-becoming-the-most-streamed-artist-on-spotify/',
          },
          {
            outlet: 'Guinness World Records',
            url: 'https://www.guinnessworldrecords.com/news/2022/10/taylor-swifts-album-midnights-smashes-three-spotify-records-723058',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2022,
      month: 10,
      category: 'business',
      title: 'Midnights debuts at No. 1 on the Billboard 200',
      snippet:
        "1.578 million equivalent units in week one — Swift's 11th No. 1 album, tying Barbra Streisand for the most by a woman.",
      sourceUrl:
        'https://www.billboard.com/music/chart-beat/taylor-swift-midnights-debut-number-one-billboard-200-albums-chart-1235163377/',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-midnights-debut-number-one-billboard-200-albums-chart-1235163377/',
          },
          {
            outlet: 'GoldDerby',
            url: 'https://www.goldderby.com/article/2022/taylor-swift-billboard-charts-midnights/',
          },
        ],
        photos: [],
      },
    },
  ],
};
