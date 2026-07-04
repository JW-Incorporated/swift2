// Vault content — The Tortured Poets Department era.
//
// First batch: April 2024, the album-release wavetop month. Every claim
// verified against its cited source directly. See
// docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first) authoring model this follows.

export default {
  eraSlug: 'tortured-poets',
  items: [
    {
      year: 2024,
      month: 4,
      category: 'business',
      title: "Tortured Poets breaks Spotify's single-day record",
      snippet:
        "300+ million streams on release day alone, plus 'Fortnight' becoming the most-streamed song Spotify had ever seen in a single day.",
      sourceUrl:
        'https://newsroom.spotify.com/2024-04-19/tortured-poets-department-taylor-swift-library-los-angeles/',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'Spotify Newsroom',
            url: 'https://newsroom.spotify.com/2024-04-19/tortured-poets-department-taylor-swift-library-los-angeles/',
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/mollybohannon/2024/04/22/all-the-records-taylor-swifts-the-tortured-poets-department-has-broken-so-far/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-tortured-poets-passes-billion-spotify-streams-1235665087/',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2024,
      month: 4,
      category: 'business',
      title: 'A billion streams in one week',
      snippet:
        'The fastest album ever to hit a billion Spotify streams — all 31 tracks, Anthology included, inside five days.',
      sourceUrl:
        'https://newsroom.spotify.com/2024-04-24/tortured-poets-department-taylor-swift-one-billion-record-streams/',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'Spotify Newsroom',
            url: 'https://newsroom.spotify.com/2024-04-24/tortured-poets-department-taylor-swift-one-billion-record-streams/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-tortured-poets-passes-billion-spotify-streams-1235665087/',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2024,
      month: 4,
      category: 'music',
      title: 'Fortnight opens the album, with Post Malone on the hook',
      snippet: "A pulsing '80s-inspired synth ballad that opens the album, with Post Malone on the hook.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Fortnight_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Taylor\'s own description of the album\'s fatalism: "You ended up not with the person that you loved and now you just have to live with that every day."',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Fortnight_(song)' }],
        photos: [],
      },
    },
  ],
};
