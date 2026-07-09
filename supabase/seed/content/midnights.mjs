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
      thumbnailUrl: 'https://i.iheart.com/v3/re/new_assets/6351759fded3848f2718dc48',
      moment: {
        sources: [
          {
            outlet: 'iHeartRadio',
            url: 'https://www.iheart.com/content/2022-10-20-celebrate-midnights-with-taylor-swift-on-iheartradio/',
          },
        ],
        photos: [{ url: 'https://i.iheart.com/v3/re/new_assets/6351759fded3848f2718dc48', credit: 'iHeart' }],
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
      thumbnailUrl: 'https://storage.googleapis.com/pr-newsroom-wp/1/2022/10/Screenshot_20221022-153332.png',
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
        photos: [
          {
            url: 'https://storage.googleapis.com/pr-newsroom-wp/1/2022/10/Screenshot_20221022-153332.png',
            credit: 'Spotify Newsroom',
          },
        ],
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
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2022/10/02-taylor-swift-midnights-cr-Beth-Garrabrant-billboard-1548.jpg?w=1024',
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
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2022/10/02-taylor-swift-midnights-cr-Beth-Garrabrant-billboard-1548.jpg?w=1024',
            credit: 'Beth Garrabrant/Billboard',
          },
        ],
      },
    },
    {
      year: 2022,
      month: 10,
      category: 'music',
      title: "The 'Anti-Hero' video, and the scale scene that got cut",
      snippet:
        "Three versions of herself confronting body image and insecurity — including a scale reading 'fat' that got edited out after online criticism.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Anti-Hero_(song)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Taylor_Swift_-_Anti-Hero.png',
      moment: {
        context:
          "She's described the song as coming from feeling her life had become 'unmanageably sized' and struggling 'with the idea of not feeling like a person' — what she's called a 'guided tour' through the things she hates about herself.",
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Anti-Hero_(song)' }],
        photos: [
          { url: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Taylor_Swift_-_Anti-Hero.png', credit: 'Republic Records' },
        ],
      },
    },
    {
      year: 2023,
      month: 7,
      category: 'business',
      title: "Speak Now (Taylor's Version) has 2023's biggest album week",
      snippet:
        "716,000 units in week one, the biggest album week of 2023 — her 12th No. 1 on the Billboard 200.",
      sourceUrl:
        'https://www.billboard.com/music/chart-beat/taylor-swift-speak-now-taylors-version-number-one-debut-billboard-200-chart-1235372565/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/06/Taylor-Swift-Speak-Now-cr-Beth-Garrabrant-billboard-1548.jpg?w=1024',
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-speak-now-taylors-version-number-one-debut-billboard-200-chart-1235372565/',
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2023/07/16/taylor-swift-charts-her-twelfth-no-1-album-with-the-massive-speak-now-taylors-version/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/06/Taylor-Swift-Speak-Now-cr-Beth-Garrabrant-billboard-1548.jpg?w=1024',
            credit: 'Beth Garrabrant/Billboard',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 10,
      category: 'business',
      title: "1989 (Taylor's Version) resets the vinyl record",
      snippet:
        '1.653 million units in week one, 693,000 on vinyl alone — a new all-time vinyl sales record, and her 13th No. 1 album.',
      sourceUrl:
        'https://www.billboard.com/music/chart-beat/taylor-swift-1989-taylors-version-number-one-billboard-200-albums-chart-1235463917/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/10/Taylor-Swift-1989-TSV-press-credit-Beth-Garrabrant-2023-billboard-aa-1548.jpg?w=1024',
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-1989-taylors-version-number-one-billboard-200-albums-chart-1235463917/',
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2023/11/05/taylor-swift-scores-the-biggest-debut-of-the-year-with-1989-taylors-version/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/10/Taylor-Swift-1989-TSV-press-credit-Beth-Garrabrant-2023-billboard-aa-1548.jpg?w=1024',
            credit: 'Beth Garrabrant/Billboard',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 10,
      category: 'music',
      title: 'A vault track that almost made the original 1989',
      snippet: 'A vault track that almost made the original 1989 — cut, then resurrected nearly a decade later.',
      sourceUrl: 'https://uproxx.com/pop/why-now-that-we-dont-talk-not-on-1989-original/',
      thumbnailUrl: null,
      moment: {
        context:
          'Synth-pop and disco, in Taylor\'s own words cut because "we couldn\'t get the production right at the time."',
        sources: [
          { outlet: 'Uproxx', url: 'https://uproxx.com/pop/why-now-that-we-dont-talk-not-on-1989-original/' },
        ],
        photos: [],
      },
    },
    {
      year: 2023,
      month: 12,
      category: 'release',
      title: 'The Eras Tour film becomes the highest-grossing concert film ever',
      snippet:
        "$261.6 million worldwide, pushed past Michael Jackson's This Is It after opening in China — a record that had stood for 14 years.",
      sourceUrl:
        'https://investor.amctheatres.com/news-events/press-releases/detail/348/taylor-swift-the-eras-tour-concert-film-is-now-the-highest-grossing-theatrical-release-in-history-among-concert-and-documentary-films',
      thumbnailUrl:
        'https://d1io3yog0oux5.cloudfront.net/_d611dc0f0c17c10e30defd93f67e7758/amctheatres/db/2287/20608/social_image_resized.jpg',
      moment: {
        sources: [
          {
            outlet: 'AMC Theatres',
            url: 'https://investor.amctheatres.com/news-events/press-releases/detail/348/taylor-swift-the-eras-tour-concert-film-is-now-the-highest-grossing-theatrical-release-in-history-among-concert-and-documentary-films',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/culture/tv-film/taylor-swift-eras-tour-movie-box-office-record-michael-jackson-this-is-it-1235577518/',
          },
        ],
        photos: [
          {
            url: 'https://d1io3yog0oux5.cloudfront.net/_d611dc0f0c17c10e30defd93f67e7758/amctheatres/db/2287/20608/social_image_resized.jpg',
            credit: 'AMC Theatres',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      category: 'tour',
      title: 'The Eras Tour kicks off in Glendale',
      snippet:
        '44 songs, 3 hours and 15 minutes at State Farm Stadium — opening night moved era by era through songs from all 10 studio albums.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-setlist-eras-tour-1235289197/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/03/taylor-swift-eras-tour-glendale-2-2023-billboard-1548.png?w=1024',
      moment: {
        sources: [
          { outlet: 'Billboard', url: 'https://www.billboard.com/music/pop/taylor-swift-setlist-eras-tour-1235289197/' },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/03/taylor-swift-eras-tour-glendale-2-2023-billboard-1548.png?w=1024',
            credit: 'Kevin Mazur/Getty Images for TAS Rights Management',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      category: 'tour',
      title: 'Glendale becomes Swift City for the weekend',
      snippet:
        'The mayor made it official: Glendale, Arizona was Swift City for March 17 and 18 — Eras Tour opening weekend.',
      sourceUrl:
        'https://www.billboard.com/music/music-news/taylor-swift-arizona-city-renamed-eras-tour-1235285285/',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-arizona-city-renamed-eras-tour-1235285285/',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2023,
      month: 3,
      category: 'fashion',
      title: 'Roberto Cavalli and Louboutin for the 1989 set',
      snippet:
        'A Roberto Cavalli two-piece and Christian Louboutin boots for the 1989 set — one look in a night of nonstop costume changes.',
      sourceUrl:
        'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/03/04-Taylor-Swift-The-Eras-Tour-opening-night-billboard-1548.jpg',
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/03/04-Taylor-Swift-The-Eras-Tour-opening-night-billboard-1548.jpg',
            credit: 'John Shearer/GI for TAS Rights Management',
          },
        ],
      },
    },
    {
      year: 2022,
      month: 10,
      category: 'release',
      title: 'Midnights (3am Edition) surprises fans with 7 more songs',
      snippet:
        "Dropped three hours after the standard album — \"other songs we wrote on our journey to find that magic 13,\" in Taylor's words.",
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-midnights-3am-edition-1235159092/',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-midnights-3am-edition-1235159092/',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2023,
      month: 12,
      category: 'business',
      title: 'Time names her 2023 Person of the Year',
      snippet:
        "Her own reaction: \"This is the proudest and happiest I've ever felt, and the most creatively fulfilled and free I've ever been.\"",
      sourceUrl: 'https://www.cbsnews.com/news/taylor-swift-time-2023-person-of-the-year/',
      thumbnailUrl:
        'https://assets1.cbsnewsstatic.com/hub/i/r/2023/11/29/524678ff-481f-45ce-b589-ab084c5b2102/thumbnail/1200x630g2/0e9e2c82d8413afa5d970900f56f7835/taylor-swift.jpg',
      moment: {
        sources: [
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-time-2023-person-of-the-year/',
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/conormurray/2023/12/06/every-major-event-in-taylor-swifts-record-breaking-2023-from-the-eras-tour-to-time-person-of-the-year/',
          },
        ],
        photos: [
          {
            url: 'https://assets1.cbsnewsstatic.com/hub/i/r/2023/11/29/524678ff-481f-45ce-b589-ab084c5b2102/thumbnail/1200x630g2/0e9e2c82d8413afa5d970900f56f7835/taylor-swift.jpg',
            credit: 'CBS News',
          },
        ],
      },
    },

    // --- Active-tier batch (2026-07-04): Joey/Travis Kelce relationship arc +
    // sightings/fashion, per the ship-readiness bar in docs/decisions.md
    // (weighted toward relationship/sighting/fashion, the categories this
    // vault under-serves). Every item below verified against its cited
    // source(s) directly this session.
    {
      year: 2023,
      month: 4,
      category: 'relationship',
      title: 'Taylor and Joe Alwyn confirm their breakup after six years',
      snippet:
        '"They simply grew apart and plan to remain friends" — the end of a relationship she\'d kept almost entirely out of public view since 2016.',
      sourceUrl: 'https://www.cnn.com/2023/04/09/entertainment/taylor-swift-joe-alwyn-break-up/index.html',
      thumbnailUrl:
        'https://media.cnn.com/api/v1/images/stellar/prod/230408204518-taylor-swift-joe-alwyn-split-restricted.jpg?c=16x9&q=w_800,c_fill',
      moment: {
        sources: [
          { outlet: 'CNN', url: 'https://www.cnn.com/2023/04/09/entertainment/taylor-swift-joe-alwyn-break-up/index.html' },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/joe-alwyn-breaks-silence-taylor-swift-breakup-1235710711/',
          },
        ],
        photos: [
          {
            url: 'https://media.cnn.com/api/v1/images/stellar/prod/230408204518-taylor-swift-joe-alwyn-split-restricted.jpg?c=16x9&q=w_800,c_fill',
            credit: 'CNN',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 5,
      category: 'relationship',
      title: 'A brief, rumored month with Matty Healy',
      snippet: 'Reconnecting through mutual friend Jack Antonoff weeks after the Alwyn breakup — studio nights, a Nashville Eras Tour stop, then over by early June.',
      sourceUrl: 'https://www.etonline.com/taylor-swift-and-matty-healys-relationship-timeline-a-look-back-at-their-short-lived-romance-223746',
      thumbnailUrl: null,
      moment: {
        context:
          'Never confirmed on the record by either party. A source told the press they were "not really compatible with each other" — an insider noted her friends "aren\'t shocked" it fizzled so soon after a six-year relationship ended.',
        sources: [
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/taylor-swift-and-matty-healys-relationship-timeline-a-look-back-at-their-short-lived-romance-223746',
          },
          { outlet: 'StyleCaster', url: 'https://stylecaster.com/lists/taylor-swift-matty-healy-dating/' },
        ],
        photos: [],
      },
    },
    {
      year: 2023,
      month: 7,
      category: 'relationship',
      title: "The friendship bracelet Travis couldn't deliver",
      snippet:
        "He made a bracelet with his number on it for her Arrowhead Eras Tour stop, worked up the nerve, and never got the chance to hand it over.",
      sourceUrl:
        'https://www.billboard.com/music/pop/travis-kelce-taylor-swift-phone-number-friendship-bracelet-1235379640/',
      thumbnailUrl: null,
      moment: {
        context:
          'He told the story on his own New Heights podcast a few weeks later — the missed handoff that started things before either of them said a word publicly.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/travis-kelce-taylor-swift-phone-number-friendship-bracelet-1235379640/',
          },
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/1421151/travis-kelces-taylor-swift-friendship-bracelet-fate-revealed',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2023,
      month: 9,
      category: 'sighting',
      title: 'First Chiefs game: cheering on from the family suite',
      snippet:
        "Taylor watched Kansas City rout Chicago 41–10 from Travis's family suite at Arrowhead, sitting beside his mother Donna in a red-and-white Chiefs jacket.",
      sourceUrl: 'https://www.cnn.com/2023/09/24/entertainment/taylor-swift-travis-kelce-chiefs-game/',
      thumbnailUrl:
        'https://media.cnn.com/api/v1/images/stellar/prod/230924170550-taylor-swift-chiefs-092423.jpg?c=16x9&q=w_800,c_fill',
      moment: {
        sources: [
          { outlet: 'CNN', url: 'https://www.cnn.com/2023/09/24/entertainment/taylor-swift-travis-kelce-chiefs-game/' },
        ],
        photos: [
          {
            url: 'https://media.cnn.com/api/v1/images/stellar/prod/230924170550-taylor-swift-chiefs-092423.jpg?c=16x9&q=w_800,c_fill',
            credit: 'CNN',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 9,
      category: 'relationship',
      title: 'The game the world decided made it official',
      snippet:
        "She'd been dating Travis for weeks by the time cameras found her at Arrowhead — but this was the night the relationship became public record.",
      sourceUrl: 'https://www.cnn.com/2023/09/24/entertainment/taylor-swift-travis-kelce-chiefs-game/',
      thumbnailUrl:
        'https://media.cnn.com/api/v1/images/stellar/prod/230924170550-taylor-swift-chiefs-092423.jpg?c=16x9&q=w_800,c_fill',
      moment: {
        sources: [
          { outlet: 'CNN', url: 'https://www.cnn.com/2023/09/24/entertainment/taylor-swift-travis-kelce-chiefs-game/' },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-travis-kelce-relationship-timeline/',
          },
        ],
        photos: [
          {
            url: 'https://media.cnn.com/api/v1/images/stellar/prod/230924170550-taylor-swift-chiefs-092423.jpg?c=16x9&q=w_800,c_fill',
            credit: 'CNN',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 9,
      category: 'fashion',
      title: 'Game-day debut: a Doen tank, denim shorts, and a Chiefs windbreaker',
      snippet:
        'No designer red carpet moment — her first Arrowhead look was Doen, denim, New Balance sneakers, and a New Era Chiefs windbreaker.',
      sourceUrl: 'https://wwd.com/fashion-news/fashion-features/gallery/taylor-swift-chiefs-game-outfits-photos-1236673626/',
      thumbnailUrl:
        'https://s.yimg.com/lo/mysterio/api/F6510B1490131D766EE623D8D54FBFDF7986E378788F30D426FF890B0C3AD8D7/subgraphmysterio/resizefill_w1200_h901;quality_80;format_webp/https:%2F%2Fmedia.zenfs.com%2Fen%2Faol_the_independent_us_877%2Fd0e4dfcb09c96b32c7af5936c6d4e1d6',
      moment: {
        sources: [
          {
            outlet: 'WWD',
            url: 'https://wwd.com/fashion-news/fashion-features/gallery/taylor-swift-chiefs-game-outfits-photos-1236673626/',
          },
        ],
        photos: [
          {
            url: 'https://s.yimg.com/lo/mysterio/api/F6510B1490131D766EE623D8D54FBFDF7986E378788F30D426FF890B0C3AD8D7/subgraphmysterio/resizefill_w1200_h901;quality_80;format_webp/https:%2F%2Fmedia.zenfs.com%2Fen%2Faol_the_independent_us_877%2Fd0e4dfcb09c96b32c7af5936c6d4e1d6',
            credit: 'AOL',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 9,
      category: 'fashion',
      title: 'A black-and-gold gown for a record VMA night',
      snippet: 'A reputation-coded black gown with gold accents and a thigh-high slit on the pink carpet.',
      sourceUrl: 'https://www.nbcnews.com/pop-culture/live-blog/mtv-vmas-2023-live-updates-rcna103947',
      thumbnailUrl:
        'https://media-cldnry.s-nbcnews.com/image/upload/c_fill,g_auto,w_1667,h_2500/rockcms/2023-09/230912-vma-taylor-swift-ew-802p-78ccc7.jpg',
      moment: {
        sources: [
          { outlet: 'NBC News', url: 'https://www.nbcnews.com/pop-culture/live-blog/mtv-vmas-2023-live-updates-rcna103947' },
        ],
        photos: [
          {
            url: 'https://media-cldnry.s-nbcnews.com/image/upload/c_fill,g_auto,w_1667,h_2500/rockcms/2023-09/230912-vma-taylor-swift-ew-802p-78ccc7.jpg',
            credit: 'NBC News',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 9,
      category: 'business',
      title: 'A record-tying 9 VMA wins in one night',
      snippet:
        "Nine Moonmen, tying a record untouched since Peter Gabriel's 1987 sweep — including all four top categories in one night.",
      sourceUrl: 'https://www.thewrap.com/taylor-swift-most-video-of-the-year-wins-vmas-2023/',
      thumbnailUrl:
        'https://i0.wp.com/www.thewrap.com/wp-content/uploads/2023/09/taylor-swift-1.jpg?fit=1200%2C675&quality=89&ssl=1',
      moment: {
        sources: [
          { outlet: 'TheWrap', url: 'https://www.thewrap.com/taylor-swift-most-video-of-the-year-wins-vmas-2023/' },
          { outlet: 'NBC News', url: 'https://www.nbcnews.com/pop-culture/live-blog/mtv-vmas-2023-live-updates-rcna103947' },
        ],
        photos: [
          {
            url: 'https://i0.wp.com/www.thewrap.com/wp-content/uploads/2023/09/taylor-swift-1.jpg?fit=1200%2C675&quality=89&ssl=1',
            credit: 'TheWrap',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 10,
      category: 'business',
      title: "Cruel Summer hits No. 1 — four years after it came out",
      snippet:
        'An unpromoted 2019 album track, revived by the Eras Tour setlist and a viral moment, becomes her 10th Hot 100 No. 1 on the chart dated Oct. 23.',
      sourceUrl:
        'https://www.billboard.com/music/chart-beat/taylor-swift-cruel-summer-number-one-hot-100-1235452093/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/08/taylor-swift-eras-tour-los-angeles-night-4-sofi-stadium-2023-billboard-1548.jpg?w=1024',
      moment: {
        context:
          "The fifth-longest wait for a No. 1 in Hot 100 history — four years, one month, three weeks after it debuted at No. 29.",
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-cruel-summer-number-one-hot-100-1235452093/',
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/music/news/taylor-swift-cruel-summer-hot-100-number-1-surge-1235764652/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/08/taylor-swift-eras-tour-los-angeles-night-4-sofi-stadium-2023-billboard-1548.jpg?w=1024',
            credit: 'Billboard',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 10,
      category: 'sighting',
      title: 'A box full of A-listers at MetLife Stadium',
      snippet:
        'Blake Lively, Ryan Reynolds, and Hugh Jackman joined her to watch Kansas City beat the Jets — the broadcast drew the biggest Sunday audience since the last Super Bowl.',
      sourceUrl:
        'https://variety.com/2023/music/news/taylor-swift-attends-travis-kelce-chiefs-jets-game-hugh-jackman-blake-lively-1235741837/',
      thumbnailUrl: 'https://variety.com/wp-content/uploads/2023/10/GettyImages-1712353673.jpg?w=1000&h=563&crop=1',
      moment: {
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/music/news/taylor-swift-attends-travis-kelce-chiefs-jets-game-hugh-jackman-blake-lively-1235741837/',
          },
        ],
        photos: [
          {
            url: 'https://variety.com/wp-content/uploads/2023/10/GettyImages-1712353673.jpg?w=1000&h=563&crop=1',
            credit: 'Elsa/Getty Images',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 10,
      category: 'fashion',
      title: 'A blue floral gown, and a surprise Beyoncé reunion',
      snippet:
        "A full-length blue gown with floral decals for the Eras Tour film premiere at The Grove — where Beyoncé stopped by to pose with her on the carpet.",
      sourceUrl: 'https://variety.com/2023/music/news/taylor-swift-eras-tour-premiere-the-grove-1235752172/',
      thumbnailUrl: 'https://wwd.com/wp-content/uploads/2023/10/taylor-swift-the-eras-tour-premiere-1.jpg?w=1000&h=563&crop=1',
      moment: {
        sources: [
          { outlet: 'Variety', url: 'https://variety.com/2023/music/news/taylor-swift-eras-tour-premiere-the-grove-1235752172/' },
        ],
        photos: [
          {
            url: 'https://wwd.com/wp-content/uploads/2023/10/taylor-swift-the-eras-tour-premiere-1.jpg?w=1000&h=563&crop=1',
            credit: 'WWD',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 11,
      category: 'relationship',
      title: 'Travis makes it official, on the record',
      snippet:
        '"I\'ve never dated anyone with that kind of aura about them" — his first on-record confirmation of the relationship, in WSJ. Magazine.',
      sourceUrl: 'https://www.today.com/popculture/travis-kelce-dating-taylor-swift-wsj-magazine-rcna125990',
      thumbnailUrl:
        'https://www.inquirer.com/resizer/v2/WZM56FNWJVQU4MGIKUF22L3Q2Q.jpg?auth=01fbce1493c6c84b5774b263114dc5841e2f76b4491df6f62ec647e96e55ef1a&width=760&height=507&smart=true',
      moment: {
        context:
          'On the scrutiny she lives under: "The scrutiny she gets, how much she has a magnifying glass on her, every single day... and she\'s just living, enjoying life."',
        sources: [
          { outlet: 'Today', url: 'https://www.today.com/popculture/travis-kelce-dating-taylor-swift-wsj-magazine-rcna125990' },
          {
            outlet: 'The Philadelphia Inquirer',
            url: 'https://www.inquirer.com/entertainment/travis-kelce-wall-street-journal-interview-taylor-swift-20231120.html',
          },
        ],
        photos: [
          {
            url: 'https://www.inquirer.com/resizer/v2/WZM56FNWJVQU4MGIKUF22L3Q2Q.jpg?auth=01fbce1493c6c84b5774b263114dc5841e2f76b4491df6f62ec647e96e55ef1a&width=760&height=507&smart=true',
            credit: 'The Philadelphia Inquirer',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 12,
      category: 'fashion',
      title: 'High-low styling for the Bills game: Khaite, vintage, and Mejuri',
      snippet: 'A Khaite mini skirt and a vintage-’90s Chiefs jumper, styled with Mejuri jewelry and Larroudé boots.',
      sourceUrl: 'https://www.marieclaire.com/fashion/taylor-swift-chiefs-game-outfits-ranked/',
      thumbnailUrl: 'https://cdn.mos.cms.futurecdn.net/RdZNsvNDCZtsUCwJmMbUv7.jpg',
      moment: {
        sources: [
          { outlet: 'Marie Claire', url: 'https://www.marieclaire.com/fashion/taylor-swift-chiefs-game-outfits-ranked/' },
        ],
        photos: [{ url: 'https://cdn.mos.cms.futurecdn.net/RdZNsvNDCZtsUCwJmMbUv7.jpg', credit: 'Marie Claire' }],
      },
    },
    {
      year: 2023,
      month: 12,
      category: 'sighting',
      title: 'A Santa-costumed entrance for a Christmas Day upset',
      snippet:
        'She arrived at Arrowhead on Christmas alongside a companion dressed as Santa; the Raiders upset the Chiefs 20–14 in the most-watched Christmas Day game since 1989.',
      sourceUrl: 'https://www.si.com/nfl/2023/12/25/raiders-chiefs-taylor-swift-arrives-with-santa-claus-fans-love-it',
      thumbnailUrl:
        'https://www.si.com/.image/c_fill,w_720,ar_16:9,f_auto,q_auto,g_auto/MjAyODIzMzIzNDA5NzIwMzMy/ap23344816547403.jpg',
      moment: {
        sources: [
          {
            outlet: 'Sports Illustrated',
            url: 'https://www.si.com/nfl/2023/12/25/raiders-chiefs-taylor-swift-arrives-with-santa-claus-fans-love-it',
          },
        ],
        photos: [
          {
            url: 'https://www.si.com/.image/c_fill,w_720,ar_16:9,f_auto,q_auto,g_auto/MjAyODIzMzIzNDA5NzIwMzMy/ap23344816547403.jpg',
            credit: 'AP',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 12,
      category: 'fashion',
      title: "TIME's Person of the Year cover shoot, in three looks",
      snippet: 'A black bodysuit with her cat Benjamin Button on one cover, a crystal-embellished Area mini dress in reputation-coded gray on another.',
      sourceUrl: 'https://petapixel.com/2023/12/06/photographers-reveal-story-behind-taylor-swifts-time-person-of-the-year-covers/',
      thumbnailUrl: 'https://petapixel.com/assets/uploads/2023/12/SWIFT.FINAL_.COVER3_-600x800.jpg',
      moment: {
        context: 'A third cover leaned cozy fall: a cream turtleneck and denim jacket, styled with slicked-back bangs instead of her usual curls.',
        sources: [
          {
            outlet: 'PetaPixel',
            url: 'https://petapixel.com/2023/12/06/photographers-reveal-story-behind-taylor-swifts-time-person-of-the-year-covers/',
          },
          {
            outlet: 'Bustle',
            url: 'https://www.bustle.com/style/taylor-swift-time-person-of-the-year-covers-reputation-style',
          },
        ],
        photos: [
          { url: 'https://petapixel.com/assets/uploads/2023/12/SWIFT.FINAL_.COVER3_-600x800.jpg', credit: 'TIME' },
          { url: 'https://petapixel.com/assets/uploads/2023/12/SWIFT.FINAL_.COVER1_-600x800.jpg', credit: 'TIME' },
        ],
      },
    },
    {
      year: 2024,
      month: 1,
      category: 'sighting',
      title: 'A frigid Wild Card game, bundled in a No. 87 puffer',
      snippet:
        'Below-zero temperatures for the Chiefs\' playoff opener against Miami — she watched from a box with Donna Kelce, wrapped in a red puffer jacket bearing Travis\'s name and number.',
      sourceUrl: 'https://www.today.com/popculture/taylor-swift-chiefs-dolphins-game-playoffs-rcna133047',
      thumbnailUrl: 'https://www.rollingstone.com/wp-content/uploads/2024/01/TaylorSwiftChiefs-1.jpeg?w=1600&h=900&crop=1',
      moment: {
        sources: [
          { outlet: 'Today', url: 'https://www.today.com/popculture/taylor-swift-chiefs-dolphins-game-playoffs-rcna133047' },
        ],
        photos: [
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2024/01/TaylorSwiftChiefs-1.jpeg?w=1600&h=900&crop=1',
            credit: 'Ed Zurga/AP via Rolling Stone',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 1,
      category: 'relationship',
      title: 'A kiss to celebrate the AFC Championship',
      snippet: 'She kissed Travis on the field as Kansas City beat Baltimore to reach a second straight Super Bowl.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-curls-chiefs-ravens-afc-championship-game-1235591057/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2024/01/Taylor-swift-travis-kelce-jan-28-2024-baltimore-billboard-1548.jpg',
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-curls-chiefs-ravens-afc-championship-game-1235591057/',
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-afc-championship-kansas-city-chiefs-baltimore-ravens-travis-kelce/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/01/Taylor-swift-travis-kelce-jan-28-2024-baltimore-billboard-1548.jpg',
            credit: 'Billboard',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 2,
      category: 'fashion',
      title: 'Custom Schiaparelli, with a Midnights clock hidden in the choker',
      snippet: 'A strapless white Schiaparelli gown with a thigh-high slit — and a choker shaped like a clock face set to midnight.',
      sourceUrl: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-schiaparelli-dress-2024-grammys-1236164497/',
      thumbnailUrl: 'https://www.hollywoodreporter.com/wp-content/uploads/2024/02/GettyImages-1986392520-EMBED-2024.jpg?w=408',
      moment: {
        sources: [
          {
            outlet: 'WWD',
            url: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-schiaparelli-dress-2024-grammys-1236164497/',
          },
        ],
        photos: [
          {
            url: 'https://www.hollywoodreporter.com/wp-content/uploads/2024/02/GettyImages-1986392520-EMBED-2024.jpg?w=408',
            credit: 'Getty Images',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 2,
      category: 'business',
      title: 'A record fourth Album of the Year Grammy, for Midnights',
      snippet: 'Presented by Céline Dion in a rare public appearance — Swift\'s fourth AOTY win, more than any artist in Grammy history.',
      sourceUrl: 'https://www.grammy.com/news/taylor-swift-album-of-the-year-2024-grammys-speech',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2024/02/taylor-swift-pop-album-grammys-cbs-2024-billboard-1548.jpg?w=1024',
      moment: {
        sources: [
          { outlet: 'Grammy.com', url: 'https://www.grammy.com/news/taylor-swift-album-of-the-year-2024-grammys-speech' },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-2024-grammy-awards-fourth-album-of-the-year-win/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/02/taylor-swift-pop-album-grammys-cbs-2024-billboard-1548.jpg?w=1024',
            credit: 'Billboard',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 2,
      category: 'fashion',
      title: 'Super Bowl LVIII: a sheer corset, Area jeans, and his number in rubies',
      snippet:
        'A Dion Lee corset top and bedazzled Area jeans, accessorized with jewelry stamped 87 — plus a red Erin Andrews bomber for team spirit.',
      sourceUrl: 'https://www.hollywoodreporter.com/lifestyle/style/what-taylor-swift-is-wearing-super-bowl-2024-1235822097/',
      thumbnailUrl:
        'https://www.hollywoodreporter.com/wp-content/uploads/2024/02/GettyImages-1996270243-copy.jpg?w=1296&h=730&crop=1',
      moment: {
        sources: [
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/lifestyle/style/what-taylor-swift-is-wearing-super-bowl-2024-1235822097/',
          },
        ],
        photos: [
          {
            url: 'https://www.hollywoodreporter.com/wp-content/uploads/2024/02/GettyImages-1996270243-copy.jpg?w=1296&h=730&crop=1',
            credit: 'Patrick T. Fallon/AFP via Getty Images',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 2,
      category: 'sighting',
      title: 'Tokyo to Las Vegas: making the Super Bowl after four Eras shows',
      snippet:
        'She flew in from her Tokyo Eras Tour date to reach Super Bowl LVIII in time, arriving with Blake Lively and Ice Spice among her guests.',
      sourceUrl: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-attends-2024-super-bowl-travis-kelce-1235821940/',
      thumbnailUrl:
        'https://www.hollywoodreporter.com/wp-content/uploads/2024/02/GettyImages-2003760399-copy.jpg?w=1296&h=730&crop=1',
      moment: {
        sources: [
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-attends-2024-super-bowl-travis-kelce-1235821940/',
          },
        ],
        photos: [
          {
            url: 'https://www.hollywoodreporter.com/wp-content/uploads/2024/02/GettyImages-2003760399-copy.jpg?w=1296&h=730&crop=1',
            credit: 'Getty Images',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 3,
      category: 'tour',
      title: 'Six Singapore shows, and a regional exclusivity deal that made headlines',
      snippet:
        "Singapore's government offered financial incentives to keep the Eras Tour's only Southeast Asia stop there — a deal its neighbors publicly complained about.",
      sourceUrl: 'https://time.com/6836711/taylor-swift-eras-tour-exclusive-singapore-southeast-asia-governments-reactions/',
      thumbnailUrl:
        'https://static.time.com/v3/assets/bltea6093859af6183b/bltc2ec949c9ace970b/698a490516d8847cd4c3d41a/Taylor-Swift-Singapore-Eras-Tour.jpg?branch=production&width=2400&quality=75&auto=webp&crop=16:9',
      moment: {
        context:
          "Singapore's Prime Minister Lee Hsien Loong called it \"a very successful arrangement,\" funded from a post-pandemic tourism-recovery budget.",
        sources: [
          {
            outlet: 'Time',
            url: 'https://time.com/6836711/taylor-swift-eras-tour-exclusive-singapore-southeast-asia-governments-reactions/',
          },
        ],
        photos: [
          {
            url: 'https://static.time.com/v3/assets/bltea6093859af6183b/bltc2ec949c9ace970b/698a490516d8847cd4c3d41a/Taylor-Swift-Singapore-Eras-Tour.jpg?branch=production&width=2400&quality=75&auto=webp&crop=16:9',
            credit: 'Getty Images via Time',
          },
        ],
      },
    },

    // --- Fashion/photo depth pass (2026-07-04): Task A added verified photos
    // to existing items; these new items round out the Eras Tour's costume
    // changes and add red-carpet fashion, all individually verified against
    // fetched sources (mostly the Billboard "night one outfits" photo gallery,
    // which captions and credits each era's look) plus one Golden Globes item.
    {
      year: 2023,
      month: 3,
      category: 'fashion',
      title: 'A pink-toned Versace bodysuit opens the Lover set',
      snippet:
        "Swift's pink-toned Lover era on opening night was a Versace bodysuit paired with knee-high Christian Louboutin boots.",
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2023/03/Taylor-Swift-outfit-gallery-night-1-billboard-1240.jpg',
      moment: {
        context:
          'The Lover set opened the very first Eras Tour show at State Farm Stadium in Glendale, Arizona on March 17, 2023 — the first of several costume changes documented look-by-look by Billboard that night.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/03/Taylor-Swift-outfit-gallery-night-1-billboard-1240.jpg',
            credit: 'Kevin Winter/GI for TAS Rights Management',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      category: 'fashion',
      title: 'Roberto Cavalli gold fringe for the Fearless set',
      snippet:
        'A sparkling gold fringe mini-dress by Roberto Cavalli, paired again with knee-high Christian Louboutin boots, for the Fearless segment of Eras Tour night one.',
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2023/03/02-Taylor-Swift-outfit-gallery-night-1-billboard-1548.jpg',
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/03/02-Taylor-Swift-outfit-gallery-night-1-billboard-1548.jpg',
            credit: 'Kevin Winter/GI for TAS Rights Management',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      category: 'fashion',
      title: 'A mustard Etro gown and cape for evermore',
      snippet:
        'A mustard orange Etro dress with delicate embroidery, worn with a matching cape and Christian Louboutin boots for the evermore segment.',
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2023/03/03-Taylor-Swift-outfit-gallery-night-1-billboard-1548.jpg',
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/03/03-Taylor-Swift-outfit-gallery-night-1-billboard-1548.jpg',
            credit: 'Kevin Mazur/GI for TAS Rights Management',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      category: 'fashion',
      title: 'The original reputation catsuit, cut-outs and all',
      snippet:
        'A Roberto Cavalli catsuit with a leg and arm cut-out, plus matching Roberto Cavalli boots, for the reputation segment — the version she wore for the tour\'s first year-plus of shows.',
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2023/03/04-Taylor-Swift-outfit-gallery-night-1-billboard-1548.jpg',
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/03/04-Taylor-Swift-outfit-gallery-night-1-billboard-1548.jpg',
            credit: 'Kevin Winter/GI for TAS Rights Management',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      category: 'fashion',
      title: 'The Ashish "22" outfit, recreated for Red',
      snippet:
        'The Red segment recreated her iconic look from the "22" music video, made by Ashish, for the Eras Tour\'s opening night.',
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2023/03/05-Taylor-Swift-outfit-gallery-night-1-billboard-1548.jpg',
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/03/05-Taylor-Swift-outfit-gallery-night-1-billboard-1548.jpg',
            credit: 'Kevin Mazur/GI for TAS Rights Management',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      category: 'fashion',
      title: 'A Nicole + Felicia princess gown for Speak Now',
      snippet: 'A voluminous Nicole + Felicia princess gown for the Speak Now segment of Eras Tour night one.',
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2023/03/06-Taylor-Swift-outfit-gallery-night-1-billboard-1548.jpg',
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/03/06-Taylor-Swift-outfit-gallery-night-1-billboard-1548.jpg',
            credit: 'John Shearer/GI for TAS Rights Management',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      category: 'fashion',
      title: 'A flowing purple Alberta Ferretti dress for Folklore',
      snippet: "A flowing purple Alberta Ferretti dress captured the woodsy feel of Folklore on Eras Tour opening night.",
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/03/02-Taylor-Swift-The-Eras-Tour-opening-night-billboard-1548.jpg',
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/03/02-Taylor-Swift-The-Eras-Tour-opening-night-billboard-1548.jpg',
            credit: 'Kevin Mazur/GI for TAS Rights Management',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      category: 'fashion',
      title: 'A magenta Jessica Jones gown for the surprise-song set',
      snippet: 'For the acoustic surprise-song portion of the night, Swift stunned in a magenta Jessica Jones dress.',
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/03/taylor-swift-eras-tour-acoustic-guitar-march-17-2023-billboard-1548.jpg',
      moment: {
        context:
          "The acoustic set is where Swift plays two surprise songs each night, swapped every show — night one's gown was a standout among the outfit changes fans tracked show to show.",
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/03/taylor-swift-eras-tour-acoustic-guitar-march-17-2023-billboard-1548.jpg',
            credit: 'Kevin Mazur/Getty Images for TAS Rights Management',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      category: 'fashion',
      title: 'Oscar de la Renta closes the night for Midnights',
      snippet:
        'An Oscar de la Renta faux fur coat and crystal T-shirt gave way to a shining navy blue Oscar de la Renta bodysuit and Christian Louboutin boots to close the Midnights set.',
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/03/07-Taylor-Swift-outfit-gallery-night-1-billboard-1548-1.jpg',
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/03/07-Taylor-Swift-outfit-gallery-night-1-billboard-1548-1.jpg',
            credit: 'John Shearer/G for TAS Rights Management',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/03/09-Taylor-Swift-outfit-gallery-night-1-billboard-1548.jpg',
            credit: 'Kevin Mazur/GI for TAS Rights Management',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 1,
      category: 'fashion',
      title: 'A sparkling green Gucci gown at the Golden Globes',
      snippet:
        'A custom sparkling green Gucci gown by Sabato de Sarno, paired with green Christian Louboutin pumps and De Beers diamonds — plus a snake-like ring stack fans read as a reputation nod.',
      sourceUrl: 'https://www.billboard.com/music/awards/taylor-swift-golden-globes-dress-2024-1235577071/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2024/01/taylor-swift-02-golden-globes-2024-billboard-1548.jpg?w=1024',
      moment: {
        context:
          "Styled by her go-to stylist Joseph Cassell for the January 7, 2024 ceremony, where she was nominated for Cinematic and Box Office Achievement for the Eras Tour concert film.",
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/awards/taylor-swift-golden-globes-dress-2024-1235577071/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/01/taylor-swift-02-golden-globes-2024-billboard-1548.jpg?w=1024',
            credit: 'Billboard',
          },
        ],
      },
    },

    // --- Fashion/photo depth pass 2 (2026-07-04)
    {
      year: 2023,
      month: 2,
      category: 'fashion',
      title: 'A midnight-blue, star-scattered Roberto Cavalli look at the 2023 Grammys',
      snippet:
        'A long-sleeve, mock-neck Roberto Cavalli crop top and matching skirt by designer Fausto Puglisi, covered edge to edge in silver and blue sequins and beads meant to read as a night sky — a direct nod to the Midnights album she was there representing.',
      sourceUrl: 'https://www.redcarpet-fashionawards.com/2023/02/06/taylor-swift-wore-roberto-cavalli-to-the-2023-grammy-awards/',
      thumbnailUrl:
        'https://www.redcarpet-fashionawards.com/wp-content/uploads/2023/02/Taylor-Swift-Wore-Roberto-Cavalli-To-The-2023-Grammy-Awards.jpeg',
      moment: {
        context:
          'Worn to the Feb. 5, 2023 ceremony at Crypto.com Arena, the custom Roberto Cavalli two-piece — designed by the house\'s Fausto Puglisi — was paired with diamond-and-turquoise statement earrings from Lorraine Schwartz.',
        sources: [
          {
            outlet: 'Red Carpet Fashion Awards',
            url: 'https://www.redcarpet-fashionawards.com/2023/02/06/taylor-swift-wore-roberto-cavalli-to-the-2023-grammy-awards/',
          },
          {
            outlet: 'WWD',
            url: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-roberto-cavalli-2023-grammy-awards-1235509202/',
          },
        ],
        photos: [
          {
            url: 'https://www.redcarpet-fashionawards.com/wp-content/uploads/2023/02/Taylor-Swift-Wore-Roberto-Cavalli-To-The-2023-Grammy-Awards.jpeg',
            credit: 'Getty Images',
          },
          {
            url: 'https://www.redcarpet-fashionawards.com/wp-content/uploads/2023/02/Taylor-Swift-2023-Grammys-683x1024.jpeg',
            credit: 'Getty Images',
          },
        ],
      },
    },
    {
      year: 2022,
      month: 10,
      category: 'fashion',
      title: 'A Dita Von Teese-styled burlesque scene and Pat McGrath\'s 30-look makeup for "Bejeweled"',
      snippet:
        'Burlesque legend Dita Von Teese coached Taylor through the martini-glass dance number and worked with stylist Joseph Cassell and costumer Catherine D\'Lish on the crystal-covered costumes; makeup artist Pat McGrath built roughly 30 distinct looks for the video, including a jeweled cat-eye and a red ombré lip.',
      sourceUrl: 'https://www.billboard.com/music/music-news/dita-von-teese-taylor-swift-bejewled-music-video-1235161045/',
      thumbnailUrl: 'https://cdn01.justjared.com/wp-content/uploads/headlines/2022/10/bejeweled-cameos.jpg',
      moment: {
        context:
          'Von Teese told Billboard it was a "true pleasure" working with Swift, who she coached on the burlesque choreography for the "Bejeweled" video\'s giant-martini-glass scene, alongside Swift\'s longtime stylist Joseph Cassell and burlesque costumer Catherine D\'Lish. Separately, makeup artist Pat McGrath — who cameos in the video as "Queen Pat" — told E! she created about 30 different looks for the shoot, including a contoured red ombré lip built from three products (Legendary Wear Matte Lipstick in "Elson 4" and PermaGel Ultra Glide Lip Pencils in Deep Dive and Blood Lust), plus a jeweled smoky cat-eye using an unreleased shadow palette from her own line.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/dita-von-teese-taylor-swift-bejewled-music-video-1235161045/',
          },
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/1352071/pat-mcgrath-reveals-the-hidden-gems-behind-taylor-swifts-glitzy-makeup-in-bejeweled-music-video',
          },
        ],
        photos: [
          {
            url: 'https://cdn01.justjared.com/wp-content/uploads/headlines/2022/10/bejeweled-cameos.jpg',
            credit: 'Just Jared',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 9,
      category: 'fashion',
      title: 'A black Versace gown with gold buttons at the 2023 VMAs',
      snippet:
        'A black Versace dress with an asymmetrical line of the house\'s signature gold buttons, a thigh-high slit, and Jimmy Choo stiletto pumps — styled by Joseph Cassell, the same stylist behind her Eras Tour looks.',
      sourceUrl: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-mtv-vmas-2023-red-carpet-versace-1235806480/',
      thumbnailUrl: 'https://wwd.com/wp-content/uploads/2023/09/taylor-swift-mtv-vmas-2023-photo.jpg?w=1000&h=563&crop=1',
      moment: {
        context:
          'Worn to the Sept. 12, 2023 MTV VMAs — the night she won Video of the Year for "Anti-Hero" among nine total Moon Man wins — the look was finished with a stack of necklaces from Joseph Saidian and Sons and an Anita Ko diamond ear cuff.',
        sources: [
          {
            outlet: 'WWD',
            url: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-mtv-vmas-2023-red-carpet-versace-1235806480/',
          },
        ],
        photos: [
          {
            url: 'https://wwd.com/wp-content/uploads/2023/09/taylor-swift-mtv-vmas-2023-photo.jpg?w=1000&h=563&crop=1',
            credit: 'Getty Images',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 12,
      category: 'fashion',
      title: 'The signature Eras Tour red lip, decoded: MAC Ruby True and a rain-proofing routine',
      snippet:
        'Backstage footage from "The End of an Era" finally revealed the exact product: MAC\'s Locked Kiss 24HR Lipstick in "Ruby True," applied by longtime makeup artist Lorrie Turk over a Smashbox lip liner to keep it from feathering under stage lights and rain.',
      sourceUrl: 'https://www.taylorswiftstyle.com/post-grid/teoae-erasredlipstick',
      thumbnailUrl:
        'https://images.squarespace-cdn.com/content/v1/6616cae0172b170a8dd0818d/f7e15f4a-04b0-4e6b-ac03-07f3e67b9387/1223+Taylor+Swift+Style+Makeup+Feature.png',
      moment: {
        context:
          'The exact shade had been a mystery to fans for years until behind-the-scenes docuseries footage caught Turk applying it: MAC Locked Kiss 24HR Lipstick in "Ruby True," a classic blue-red, layered over Smashbox\'s Be Legendary Line & Prime Pencil and set with Charlotte Tilbury Airbrush Flawless Finish Setting Powder — a combination built specifically to survive multi-hour shows and outdoor-stadium weather.',
        sources: [
          {
            outlet: 'Taylor Swift Style',
            url: 'https://www.taylorswiftstyle.com/post-grid/teoae-erasredlipstick',
          },
        ],
        photos: [
          {
            url: 'https://images.squarespace-cdn.com/content/v1/6616cae0172b170a8dd0818d/f7e15f4a-04b0-4e6b-ac03-07f3e67b9387/1223+Taylor+Swift+Style+Makeup+Feature.png',
            credit: 'Taylor Swift Style',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 1,
      category: 'fashion',
      title: 'A 70s lace slip dress and Free People fur coat for "Lavender Haze"',
      snippet:
        'A white lace-trimmed slip mini dress under a light-violet Free People "Renata" faux fur coat, styled with shag-inspired bangs, glittery eyeshadow, and glossy pink lips for the self-directed 70s-themed video.',
      sourceUrl: 'https://www.shefinds.com/collections/taylor-swift-lavender-haze-lacy-slip-mini-dress-music-video/',
      thumbnailUrl: 'https://www.shefinds.com/files/2023/01/Taylor-Swift-16.jpg',
      moment: {
        context:
          'The white silky slip has floral lace at the neckline and thigh-skimming cutouts along the hem, under the Free People Renata Faux Fur Coat; other looks in the video include an oversized T-shirt worn as a dress and a separate 70s-inflected knit top. The video, which Swift co-directed, leans fully into a groovy, retro aesthetic — loose beachy waves, shag bangs, and warm-toned glam.',
        sources: [
          {
            outlet: 'SheFinds',
            url: 'https://www.shefinds.com/collections/taylor-swift-lavender-haze-lacy-slip-mini-dress-music-video/',
          },
          {
            outlet: 'Hello!',
            url: 'https://www.hellomagazine.com/hfm/20230127162890/taylor-swift-lavender-haze-fashion-beauty-moments/',
          },
        ],
        photos: [
          {
            url: 'https://www.shefinds.com/files/2023/01/Taylor-Swift-16.jpg',
            credit: 'SheFinds',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 5,
      category: 'fashion',
      title: 'A Coach gingham minidress for the "Karma" surprise video',
      snippet:
        'A black-and-white gingham Coach minidress with a Peter Pan collar and a cherry motif running down the bodice like a tie, worn "skipping down a yellow brick road" in the surprise "Karma" video, premiered live at the Eras Tour\'s New Jersey stop.',
      sourceUrl: 'https://www.billboard.com/culture/product-recommendations/taylor-swift-karma-video-dress-where-to-buy-1235342478/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2023/05/coach-gingham-dress-edited.jpeg?w=1000',
      moment: {
        context:
          'The Coach Gingham Tie Collar Mini Dress (retail $550) featured in the "Karma" video, which premiered an hour early for the crowd at MetLife Stadium on May 26, 2023 before its official online release — the same New Jersey stand where she debuted a silver leotard, a gold dress, and a new "Enchanted" princess gown on the Eras Tour stage.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/culture/product-recommendations/taylor-swift-karma-video-dress-where-to-buy-1235342478/',
          },
          {
            outlet: 'Newsweek',
            url: 'https://www.newsweek.com/taylor-swift-eras-tour-karma-video-east-rutherford-new-jersey-1995065',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/05/coach-gingham-dress-edited.jpeg?w=1000',
            credit: 'Coach',
          },
        ],
      },
    },

    // --- Sightings depth pass (2026-07-05): candid public-appearance moments
    // beyond the Chiefs games already in this file, per the founder's request
    // for more real-world material from this era's huge paparazzi coverage.
    // Every claim below verified against its cited source directly this
    // session; every photo URL curl-checked for a 2xx image/* response before
    // inclusion. None of these touch the Joe Alwyn breakup, the Sept. 24,
    // 2023 "went public" Chiefs game, or the Matty Healy relationship — all
    // already covered elsewhere in this file (or, per the relationship-history
    // branch, in a sibling PR).
    {
      year: 2023,
      month: 10,
      category: 'sighting',
      title: 'A Thursday-night Broncos game, one day after the Eras film premiere',
      snippet:
        "Straight off the Eras Tour film's LA premiere, she landed in Kansas City, arrived in a Chiefs zip-up about 45 minutes before kickoff, and was driven by golf cart to a private box to watch with Donna Kelce again.",
      sourceUrl: 'https://www.cbssports.com/nfl/news/look-taylor-swift-arrives-at-broncos-chiefs-thursday-night-game-to-watch-travis-kelce/',
      thumbnailUrl:
        'https://sportshub.cbsistatic.com/i/r/2023/10/12/40650345-0cc6-4ceb-b781-c837359fee06/thumbnail/770x433/d8fdf57d237d253925cb3ab88bc67608/swift-chiefs-g.jpg',
      moment: {
        context:
          'It was her third Chiefs game of the 2023 season, played the Thursday night of Oct. 12 — she waved and smiled at fans on her way in before the 8:15 p.m. ET kickoff.',
        sources: [
          {
            outlet: 'CBS Sports',
            url: 'https://www.cbssports.com/nfl/news/look-taylor-swift-arrives-at-broncos-chiefs-thursday-night-game-to-watch-travis-kelce/',
          },
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/news/taylor-swift-chiefs-broncos-game-rcna120152',
          },
        ],
        photos: [
          {
            url: 'https://sportshub.cbsistatic.com/i/r/2023/10/12/40650345-0cc6-4ceb-b781-c837359fee06/thumbnail/770x433/d8fdf57d237d253925cb3ab88bc67608/swift-chiefs-g.jpg',
            credit: 'CBS Sports',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 10,
      category: 'sighting',
      title: 'A wordless SNL cameo, then dinner at Nobu',
      snippet:
        'She popped onscreen for four words — "Once again, Ice Spice" — during the season 49 premiere, then that night was seen cuddling through an intimate sushi dinner with Travis at Nobu, the first time the two had shown that much public affection.',
      sourceUrl: 'https://www.tmz.com/2023/10/15/taylor-swift-ice-spice-snl-travis-kelce-pete-davidson-nobu/',
      thumbnailUrl: 'https://imagez.tmz.com/image/8e/16by9/2023/10/15/8e0d4df878864a078bb032f7b54342f4_md.jpg',
      moment: {
        context:
          'On the Oct. 14, 2023 premiere hosted by Pete Davidson, Travis also got his own cameo — popping up after Kenan Thompson joked about wanting real football talk instead of Taylor gossip. Neither performed with the cast. Hours later, TMZ caught the couple holding hands past the sushi bar at Nobu in Manhattan, Travis greeting the chefs, before sitting down to a meal an eyewitness described as spent "cuddling throughout."',
        sources: [
          {
            outlet: 'TMZ',
            url: 'https://www.tmz.com/2023/10/15/taylor-swift-ice-spice-snl-travis-kelce-pete-davidson-nobu/',
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/tv/news/taylor-swift-snl-premiere-travis-kelce-cameo-1235756487/',
          },
        ],
        photos: [
          {
            url: 'https://imagez.tmz.com/image/77/4by3/2023/10/15/77f8e73e44f34d2ead2e55f2444bc657_md.jpg',
            credit: 'TMZ',
          },
          {
            url: 'https://imagez.tmz.com/image/a3/4by3/2023/10/15/a3a8f095ff4f49268d0bf9ce369a40d1_md.jpg',
            credit: 'TMZ',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 10,
      category: 'sighting',
      title: "A friendship bracelet with his number, for the Chargers game",
      snippet:
        "For her fourth Chiefs game of the season, a friendship bracelet reading '87' surrounded by hearts — plus a celebratory handshake with Brittany Mahomes every time Kansas City scored.",
      sourceUrl: 'https://www.bustle.com/entertainment/taylor-swift-friendship-bracelet-travis-kelce-tribute',
      thumbnailUrl:
        'https://imgix.bustle.com/uploads/getty/2023/10/23/b8956637-edbb-49a6-9f42-58fe6268b05c-getty-1750806324.jpg?w=248&h=165&fit=crop&crop=faces&dpr=2',
      moment: {
        context:
          'The Oct. 22, 2023 win over the Los Angeles Chargers at Arrowhead — afterward, she and Travis were seen holding hands and leaving the stadium together in his convertible.',
        sources: [
          {
            outlet: 'Bustle',
            url: 'https://www.bustle.com/entertainment/taylor-swift-friendship-bracelet-travis-kelce-tribute',
          },
        ],
        photos: [
          {
            url: 'https://imgix.bustle.com/uploads/getty/2023/10/23/b8956637-edbb-49a6-9f42-58fe6268b05c-getty-1750806324.jpg?w=248&h=165&fit=crop&crop=faces&dpr=2',
            credit: 'Getty Images via Bustle',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 11,
      category: 'sighting',
      title: 'Travis flies to Buenos Aires for the second Eras Tour show there',
      snippet:
        "He arrived a day late — after missing the first Argentina show for a Kansas City gala — and watched from the VIP tent beside her dad Scott. She altered a lyric mid-show to reference him, then ran into his arms to kiss him once it wrapped.",
      sourceUrl: 'https://www.billboard.com/music/music-news/travis-kelce-taylor-swift-buenos-aires-eras-tour-1235469312/',
      thumbnailUrl: null,
      moment: {
        context:
          'Nov. 11, 2023, at Estadio River Plate — the same day she\'d woken up to six new Grammy nominations, which she mentioned from the stage before the show.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/travis-kelce-taylor-swift-buenos-aires-eras-tour-1235469312/',
          },
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/travis-kelce-spotted-at-taylor-swifts-second-buenos-aires-eras-tour-concert-214678',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2023,
      month: 11,
      category: 'sighting',
      title: 'A girls-only night out on Bond Street',
      snippet:
        'Leaving a Japanese restaurant on Bond Street, she locked arms with Selena Gomez and held Brittany Mahomes\'s hand, with Sophie Turner, Gigi Hadid, and Cara Delevingne close behind — a rare all-friends outing between Chiefs games and Eras Tour dates.',
      sourceUrl: 'https://www.tmz.com/2023/11/05/taylor-swift-selena-gomez-sophie-turner-gigi-hadid-brittany-mahomes-dinner-new-york/',
      thumbnailUrl: 'https://imagez.tmz.com/image/b8/4by3/2023/11/05/b8a558e9361042cca1e7b95fea55ef56_md.jpg',
      moment: {
        sources: [
          {
            outlet: 'TMZ',
            url: 'https://www.tmz.com/2023/11/05/taylor-swift-selena-gomez-sophie-turner-gigi-hadid-brittany-mahomes-dinner-new-york/',
          },
        ],
        photos: [
          {
            url: 'https://imagez.tmz.com/image/b8/4by3/2023/11/05/b8a558e9361042cca1e7b95fea55ef56_md.jpg',
            credit: 'TMZ',
          },
          {
            url: 'https://imagez.tmz.com/image/df/4by3/2023/11/05/dfa5b127c6b4466c92fb3894cf22f85c_md.jpg',
            credit: 'TMZ',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 12,
      category: 'sighting',
      title: 'A crescent-moon dress for her 34th birthday, with Blake Lively',
      snippet:
        'A black Clio Peppiatt cocktail dress covered in silver crescent moons and stars, a furry coat, and Blake Lively\'s hand to hold walking into The Box nightclub — Travis stayed behind in Kansas City for mandatory Chiefs practice.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-birthday-blake-lively-miles-teller-photos-1235556824/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2023/12/01-taylor-swift-dec-13-2023-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'The main party was Dec. 13, 2023, following a lower-key Dec. 12 gathering at Zero Bond with Selena Gomez — two nights of celebrating turning 34 with Miles Teller and Keleigh Sperry also along for both.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-birthday-blake-lively-miles-teller-photos-1235556824/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/12/01-taylor-swift-dec-13-2023-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Billboard',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 12,
      category: 'sighting',
      title: 'Ringing in 2024 with the Mahomeses',
      snippet:
        "A double-date New Year's Eve in Kansas City — a kiss with Travis at midnight, and a photo with Patrick and Brittany Mahomes that raced past a million views, hours after watching the Chiefs beat Cincinnati 25–17.",
      sourceUrl: 'https://www.newsweek.com/taylor-swift-travis-kelce-patrick-brittany-mahomes-kansas-city-chiefs-photo-1857056',
      thumbnailUrl: 'https://assets.newsweek.com/wp-content/uploads/2025/08/2330299-taylor-swift-travis-kelce.jpg?w=1600&quality=80&webp=1',
      moment: {
        sources: [
          {
            outlet: 'Newsweek',
            url: 'https://www.newsweek.com/taylor-swift-travis-kelce-patrick-brittany-mahomes-kansas-city-chiefs-photo-1857056',
          },
        ],
        photos: [
          {
            url: 'https://assets.newsweek.com/wp-content/uploads/2025/08/2330299-taylor-swift-travis-kelce.jpg?w=1600&quality=80&webp=1',
            credit: 'Newsweek',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 1,
      category: 'sighting',
      title: 'A frigid divisional round in Buffalo, seated with Jason Kelce',
      snippet:
        "Braving frigid temperatures at Highmark Stadium, she watched the Chiefs beat the Bills 27–24 from a suite alongside Travis's brother Jason — while some Bills fans in the crowd held up a sign reading they'd come \"for Taylor.\"",
      sourceUrl: 'https://www.cbsnews.com/news/taylor-swift-travis-kelce-chiefs-buffalo-bills-highmark/',
      thumbnailUrl:
        'https://assets3.cbsnewsstatic.com/hub/i/r/2024/01/21/3ea9f4b6-39c9-4026-aea6-be7d5a44af76/thumbnail/620x413/fe93c98a06090411f5266f68af3ce8b1/gettyimages-1950919592.jpg',
      moment: {
        context:
          'Jan. 21, 2024, at the AFC Divisional Round in Orchard Park, New York — her second straight playoff-game appearance, following the Wild Card round the week before.',
        sources: [
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-travis-kelce-chiefs-buffalo-bills-highmark/',
          },
        ],
        photos: [
          {
            url: 'https://assets3.cbsnewsstatic.com/hub/i/r/2024/01/21/3ea9f4b6-39c9-4026-aea6-be7d5a44af76/thumbnail/620x413/fe93c98a06090411f5266f68af3ce8b1/gettyimages-1950919592.jpg',
            credit: 'Getty Images via CBS News',
          },
          {
            url: 'https://assets1.cbsnewsstatic.com/hub/i/r/2024/01/21/bc1ab4aa-2929-4189-b2bb-a0b408647c54/thumbnail/620x413/9555c45396dfac8af60912df8cfb71ac/gettyimages-1950836092.jpg',
            credit: 'Getty Images via CBS News',
          },
        ],
      },
    },

    // --- Music-backstory + chart-record depth pass (2026-07-05): the album's
    // music backstories were thin (3 items) relative to its 13-plus track
    // list, so this batch digs into song-by-song writing stories with
    // on-record Taylor/collaborator quotes, plus two chart records verified
    // with a working second source this session — including the entire-
    // Hot-100-top-10 record flagged as parked in this file's header note
    // (a second source, Wikipedia's Anti-Hero page, was reachable this time).
    // Every claim below verified against its cited source(s) directly.
    {
      year: 2022,
      month: 10,
      category: 'music',
      title: 'A Mad Men rerun gave Midnights its opening track',
      snippet:
        'She found "lavender haze" watching Mad Men, looked up its 1950s meaning — "an all-encompassing love glow" — and turned it into an opening track defending her relationship from tabloid noise.',
      sourceUrl:
        'https://www.rollingstone.com/music/music-news/taylor-swift-reveals-lavender-haze-midnights-inspiration-joe-alwyn-1234607000/',
      thumbnailUrl: null,
      moment: {
        context:
          'In an Instagram video explaining the song, Swift said: "I happened upon the phrase \'lavender haze\' when I was watching Mad Men. And I looked it up because I thought it sounded cool, and it turns out that it\'s a common phrase used in the \'50s where they would just describe being in love... If you were in the lavender haze, then that meant that you were in that all-encompassing love glow." She tied it directly to her own six-year relationship with Joe Alwyn: "My relationship for six years, we\'ve had to dodge weird rumors, tabloid stuff, and we just ignore it... this song is sort of about the act of ignoring that stuff to protect the real stuff."',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-reveals-lavender-haze-midnights-inspiration-joe-alwyn-1234607000/',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2022,
      month: 10,
      category: 'music',
      title: 'William Bowery writes one more Midnights love song',
      snippet:
        "Joe Alwyn's songwriting pseudonym — borrowed from a great-grandfather who composed film scores and the New York neighborhood where he first lived — turns up again, on a quiet song built from real domestic memories.",
      sourceUrl: 'https://www.thethings.com/why-did-taylor-swift-credit-joe-alwyn-as-william-bowery/',
      thumbnailUrl: null,
      moment: {
        context:
          '"Sweet Nothing" is credited to Swift, Jack Antonoff, and William Bowery — the pseudonym Alwyn had already used on folklore and evermore. He explained the name\'s origin on The Kelly Clarkson Show: "It was a combination of William... my great-grandfather — who I actually never met — [who] was a composer. He wrote a lot of classical music, and he wrote a lot of film scores. And then Bowery is the area in New York that I spent a lot of time in when I first moved over there." He and Swift chose to write under a shared pseudonym, he said, "so the people, first and foremost, would listen to the music first before dissecting the fact that we did it together." The song itself leans into small, sheltered domestic memories — a pebble collected on a trip to Wicklow, quiet moments at home — as a refuge from "cunning" outsiders and her own critical inner voice.',
        sources: [
          {
            outlet: 'The Things',
            url: 'https://www.thethings.com/why-did-taylor-swift-credit-joe-alwyn-as-william-bowery/',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Sweet_Nothing_(Taylor_Swift_song)',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2022,
      month: 10,
      category: 'music',
      title: 'A Sounwave beat, finished in a day, becomes "Karma"',
      snippet:
        'A track producer Sounwave built with Keanu Beats and passed to Jack Antonoff was, in Sounwave\'s words, "too perfect not to send" to Taylor — she recorded her vocals and finished the song the next day.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Karma_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift described her state of mind writing it in an Apple Music interview: "I wrote \'Karma\' from a perspective of feeling really happy, really proud of the way your life is, feeling like this must be a reward for doing stuff right." Seven months after release, she brought the song full circle: Ice Spice\'s team reached out asking to collaborate, Swift said yes, and on May 26, 2023 — the Eras Tour\'s first New Jersey show — a remix dropped with a new Ice Spice verse written with RiotUSA, premiered live at MetLife Stadium.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Karma_(Taylor_Swift_song)' },
        ],
        photos: [],
      },
    },
    {
      year: 2023,
      month: 11,
      category: 'music',
      title: 'Lana Del Rey reveals how much of "Snow on the Beach" is actually her',
      snippet:
        'She matched Taylor\'s vocals so closely on the original mix that "you would never even know I was completely all over that first song" — and didn\'t realize she was the track\'s only featured artist until after it came out.',
      sourceUrl:
        'https://www.rollingstone.com/music/music-news/lana-del-rey-taylor-swift-snow-on-the-beach-interview-1234892236/',
      thumbnailUrl: null,
      moment: {
        context:
          'Del Rey, who co-wrote the song with Swift and Jack Antonoff: "I am all over the first version of \'Snow on the Beach.\' I layer and match her vocals perfectly, so you would never even know that I was completely all over that first song... I had no idea I was the only feature [on that song]. Had I known, I would have sung the entire second verse like she wanted." Swift has described the song\'s concept as "falling in love with someone at the same time as they\'re falling in love with you... this cataclysmic, fated moment where you realize someone feels exactly the same way that you feel." A "More Lana Del Rey" version, with Del Rey singing the full second verse, followed as part of the Til Dawn Edition in May 2023.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/lana-del-rey-taylor-swift-snow-on-the-beach-interview-1234892236/',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Snow_on_the_Beach' },
        ],
        photos: [],
      },
    },
    {
      year: 2023,
      month: 12,
      category: 'music',
      title: 'The Phantom Thread ending that inspired "Mastermind"',
      snippet:
        'A rewatch of Paul Thomas Anderson\'s Phantom Thread gave her the idea for a closing track that owns up to orchestrating her own love story — reclaiming a word she says has been "thrown at me like a dagger."',
      sourceUrl: 'https://www.bustle.com/entertainment/taylor-swift-mastermind-inspired-by-phantom-thread',
      thumbnailUrl: null,
      moment: {
        context:
          'In her December 2023 Time Person of the Year cover interview, Swift traced "Mastermind" back to the twist ending of Phantom Thread: "Wouldn\'t it be fun to have a lyric about being calculated..." On the "calculated" label she\'s carried for years, she said: "It\'s something that\'s been thrown at me like a dagger, but now I take it as a compliment." Antonoff co-wrote and co-produced the track with her, closing out the standard edition of Midnights.',
        sources: [
          {
            outlet: 'Bustle',
            url: 'https://www.bustle.com/entertainment/taylor-swift-mastermind-inspired-by-phantom-thread',
          },
          { outlet: 'Songfacts', url: 'https://www.songfacts.com/facts/taylor-swift/mastermind' },
        ],
        photos: [],
      },
    },
    {
      year: 2022,
      month: 11,
      category: 'business',
      title: 'Every spot in the Hot 100 top 10, all at once',
      snippet:
        'The week "Anti-Hero" debuted at No. 1, the other nine Midnights tracks filled out the rest of the top 10 — the first time in Hot 100 history one artist held the entire top 10 in a single week.',
      sourceUrl: 'https://www.billboard.com/music/chart-beat/taylor-swift-all-hot-100-top-10-anti-hero-1235163664/',
      thumbnailUrl: null,
      moment: {
        context:
          'On the chart dated Nov. 5, 2022, Swift became, in Billboard\'s words, "the first artist to claim the survey\'s entire top 10 in a single frame," surpassing Drake, who\'d held nine of the top 10 in September 2021. Led by "Anti-Hero" (59.7 million streams) at No. 1, the top 10 ran Lavender Haze, Maroon, Snow on the Beach, You\'re on Your Own Kid, Midnight Rain, Bejeweled, Question...?, Karma, and Vigilante Shit — all from the same album, which also became the first LP ever to land 10 songs in the Hot 100\'s top 10 at once. This is the record flagged as unconfirmed-by-a-second-source in this file\'s original October 2022 batch; Wikipedia\'s "Anti-Hero" entry independently corroborates it.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-all-hot-100-top-10-anti-hero-1235163664/',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Anti-Hero_(song)' },
        ],
        photos: [],
      },
    },
    {
      year: 2023,
      month: 6,
      category: 'business',
      title: 'Midnights knocks Morgan Wallen off the top of the chart',
      snippet:
        "New deluxe editions — Til Dawn, Late Night, and a Karma remix with Ice Spice — sent Midnights back to No. 1 in June 2023, ending Morgan Wallen's 12-week reign, the longest run for a country album in over 30 years.",
      sourceUrl:
        'https://www.billboard.com/music/chart-beat/taylor-swift-midnights-back-number-one-billboard-200-til-dawn-late-nights-1235345655/',
      thumbnailUrl: null,
      moment: {
        context:
          'On May 26, 2023, Swift released two new deluxe versions — the 23-track Til Dawn Edition (including the Ice Spice "Karma" remix) and a 21-track Late Night Edition with the previously unreleased "You\'re Losing Me" — plus a new vinyl variant. It was enough to send Midnights back to No. 1 on the chart dated June 10, 2023, halting One Thing at a Time\'s run at the top and handing Midnights its sixth (non-consecutive) week at No. 1 on 282,000 equivalent album units, the second-largest album week of 2023 to that point.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-midnights-back-number-one-billboard-200-til-dawn-late-nights-1235345655/',
          },
        ],
        photos: [],
      },
    },

    // --- Deep timeline fill (2026-07-08, content/deep-d): rollout, records,
    // Eras Tour milestones, and era-spanning moments the corpus was missing.
    // Every claim verified against its cited source(s) this session; new items
    // carry the audit's additive provenance fields (slug + publisher/
    // source_type/accessed_at/reliability_score) alongside legacy {outlet,url}.
    {
      slug: 'midnights-mayhem-with-me',
      year: 2022,
      month: 10,
      category: 'release',
      title: 'Midnights Mayhem with Me: a bingo cage announces the tracklist',
      snippet:
        'No cryptic clues this time — a TikTok series where a bingo cage picked the order and she announced each track title into a vintage phone. Thirteen episodes, capped by a middle-of-the-night finale blitz.',
      sourceUrl: 'https://www.elitedaily.com/entertainment/taylor-swift-midnights-mayhem-with-me-tracklist-tiktoks-explained',
      thumbnailUrl: null,
      moment: {
        context:
          'The series started Sept. 21, 2022, with episodes dropping at midnight ET — cat Meredith cameoed in episode 2, and the remaining titles were released an hour apart through the night of Oct. 7. It flipped her usual Easter-egg hunt on its head: instead of fans decoding clues, chance decided which track title she revealed next.',
        sources: [
          {
            outlet: 'Elite Daily',
            url: 'https://www.elitedaily.com/entertainment/taylor-swift-midnights-mayhem-with-me-tracklist-tiktoks-explained',
            source_title: "Taylor Swift's 'Midnights Mayhem With Me' Tracklist TikToks, Explained",
            publisher: 'Elite Daily',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'Taylor Swift on TikTok',
            url: 'https://www.tiktok.com/@taylorswift/video/7151677137337208110',
            source_title: 'Our LAST EPISODE! The season finale of Midnights Mayhem with Me',
            publisher: 'Taylor Swift (official TikTok)',
            source_type: 'social',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'bejeweled-video-easter-eggs',
      year: 2022,
      month: 10,
      category: 'music',
      title: '"Bejeweled" arrives with a "psychotic amount" of easter eggs',
      snippet:
        'Her warning, not ours. Laura Dern as the wicked stepmother, HAIM as the stepsisters, an elevator button for floor three glowing purple — the Cinderella video that quietly announced Speak Now was next.',
      sourceUrl: 'https://www.goodmorningamerica.com/culture/story/watch-taylor-swifts-music-video-bejeweled-off-album-92029478',
      thumbnailUrl: null,
      moment: {
        context:
          'Released Oct. 25, 2022, four days after the album. Dern\'s "Speak not, you tacky, tired wench" line, the three stepsisters (album three), and an orchestral "Long Live" over the closing shot all pointed at Speak Now as the next re-record — a call fans banked, and one the Nashville announcement confirmed the following May.',
        sources: [
          {
            outlet: 'Good Morning America',
            url: 'https://www.goodmorningamerica.com/culture/story/watch-taylor-swifts-music-video-bejeweled-off-album-92029478',
            source_title: "Taylor Swift's 'Bejeweled' music video features Laura Dern, Dita Von Teese and a 'psychotic amount' of Easter eggs",
            publisher: 'ABC News (Good Morning America)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Newsweek',
            url: 'https://www.newsweek.com/taylor-swift-bejeweled-music-vieo-easter-eggs-cast-haim-laura-dern-1754441',
            source_title: "All of the Taylor Swift 'Bejeweled' music video easter eggs and cast",
            publisher: 'Newsweek',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'amas-2022-six-for-six',
      year: 2022,
      month: 11,
      category: 'business',
      title: 'Six-for-six at the AMAs, and past 40 career wins',
      snippet:
        'Artist of the Year for the seventh time, plus wins for Red (Taylor\'s Version) and the All Too Well short film — making her the first artist to pass 40 American Music Awards.',
      sourceUrl: 'https://www.rollingstone.com/music/music-news/taylor-swift-sweeps-2022-amas-1234634191/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Nov. 20, 2022 sweep at the Microsoft Theater covered favorite female pop artist, favorite female country artist, favorite pop album, favorite country album, and favorite music video — a re-recorded 2012 album and its ten-minute short film winning a full month into the Midnights era.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-sweeps-2022-amas-1234634191/',
            source_title: 'Taylor Swift Sweeps 2022 AMAs With Six of Six Wins',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Deadline',
            url: 'https://deadline.com/2022/11/american-music-awards-winners-list-taylor-swift-scores-artist-of-the-year-1235178280/',
            source_title: 'American Music Awards 2022 Winners List: Taylor Swift Reigns, Scores Artist Of The Year Prize',
            publisher: 'Deadline',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'eras-tour-presale-meltdown',
      year: 2022,
      month: 11,
      category: 'business',
      title: 'The presale that broke Ticketmaster — and set a sales record anyway',
      snippet:
        '2.4 million tickets in one day, the most ever sold for an artist — while millions more fans sat in crashed queues until Ticketmaster canceled the public on-sale entirely.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift%E2%80%93Ticketmaster_controversy',
      thumbnailUrl: null,
      moment: {
        context:
          'The Verified Fan presale opened Nov. 15, 2022 and buckled within the hour as fans, bots, and scalpers flooded the site; Ticketmaster later blamed a massive bot attack and scrapped the general sale outright. Fans sued, and Swift said watching the mistakes unfold with no recourse had been "excruciating." The fallout carried into Washington within two months.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Taylor_Swift%E2%80%93Ticketmaster_controversy',
            source_title: 'Taylor Swift–Ticketmaster controversy',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'ABC News',
            url: 'https://abcnews.com/GMA/Culture/taylor-swift-fans-sue-ticketmaster-tour-presale-meltdown/story?id=94459600',
            source_title: 'Taylor Swift fans sue Ticketmaster over tour presale meltdown',
            publisher: 'ABC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'ticketmaster-senate-hearing',
      year: 2023,
      month: 1,
      category: 'business',
      title: 'The Senate holds a Ticketmaster hearing, in Swiftie puns',
      snippet:
        'Senators quoted her lyrics while grilling Live Nation over the Eras Tour on-sale collapse — a three-hour bipartisan airing of the monopoly question, with Swifties rallying outside the Capitol.',
      sourceUrl: 'https://www.npr.org/2023/01/24/1150942804/taylor-swift-ticketmaster-senate-hearing-live-nation',
      thumbnailUrl: null,
      moment: {
        context:
          'At the Jan. 24, 2023 Senate Judiciary hearing, Sen. Amy Klobuchar opened on consolidation people know "all too well"; Live Nation\'s CFO blamed bots, and when witnesses were asked whether Ticketmaster is a monopoly, SeatGeek\'s CEO answered "unequivocally." Klobuchar\'s case: the company controls over 70% of ticketing for major venues plus much of the promotion pipeline.',
        sources: [
          {
            outlet: 'NPR',
            url: 'https://www.npr.org/2023/01/24/1150942804/taylor-swift-ticketmaster-senate-hearing-live-nation',
            source_title: "The Senate's Ticketmaster hearing featured plenty of Taylor Swift puns and protesters",
            publisher: 'NPR',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Time',
            url: 'https://time.com/6249730/ticketmaster-taylor-swift-hearing-congress/',
            source_title: "What Happened During Congress' Hearing on Ticketmaster and the Taylor Swift Concert Mess",
            publisher: 'Time',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-ticketmaster-senate-judiciary-committee-eras-tour/',
            source_title: "All the Taylor Swift references from the Senate's Ticketmaster hearing",
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'speak-now-tv-announced-nashville',
      year: 2023,
      month: 5,
      category: 'release',
      title: "Speak Now (Taylor's Version) announced onstage in Nashville",
      snippet:
        'Wristbands turned purple across Nissan Stadium as she revealed the next re-record from the stage — the album she wrote entirely alone at 18–20, coming back July 7.',
      sourceUrl: 'https://variety.com/2023/music/news/taylor-swift-speak-now-taylors-version-announced-during-concert-nashville-nissan-stadium-1235605123/',
      thumbnailUrl: null,
      moment: {
        context:
          'The May 5, 2023 reveal opened her three-night hometown Nashville stand: entry banners ran purple-hued all day before the announcement landed mid-show. Her post that night flagged the July 7 date as "just in time for July 9th, iykyk" — the "Last Kiss" date fans have kept as an anniversary since 2010.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/music/news/taylor-swift-speak-now-taylors-version-announced-during-concert-nashville-nissan-stadium-1235605123/',
            source_title: "Taylor Swift Announces 'Speak Now (Taylor's Version)' Is Coming Next",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-speak-now-taylors-version-release-date-1235322958/',
            source_title: "Taylor Swift 'Speak Now (Taylor's Version)' Release Date",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'i-can-see-you-video-lautner',
      year: 2023,
      month: 7,
      category: 'music',
      title: 'The "I Can See You" video reunites the Taylors',
      snippet:
        'Taylor Lautner backflipping through a heist to free her from a vault — she premiered the video live in Kansas City with Lautner, Joey King, and Presley Cash walking out onstage.',
      sourceUrl: 'https://variety.com/2023/music/news/taylor-swift-lautner-i-can-see-you-music-video-joey-king-presley-cash-1235664478/',
      thumbnailUrl: null,
      moment: {
        context:
          'Premiered July 7, 2023 at the first Kansas City show, hours after Speak Now (Taylor\'s Version) dropped. Swift wrote and directed the vault-heist clip herself, cast the "Mean" video kids all grown up, and told the crowd Lautner had been "a very positive force in my life" during the original Speak Now — and did every stunt himself.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/music/news/taylor-swift-lautner-i-can-see-you-music-video-joey-king-presley-cash-1235664478/',
            source_title: "Taylor Swift Casts Her Ex, Taylor Lautner, as Co-Star in 'I Can See You' Video",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-i-can-see-you-video-taylor-lautner-joey-king-presley-cash-1235368510/',
            source_title: "Taylor Swift Premieres 'I Can See You' Video",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'swift-quake-seattle',
      year: 2023,
      month: 7,
      category: 'tour',
      title: 'The "Swift Quake": Seattle shows register as seismic activity',
      snippet:
        'Two nights at Lumen Field shook the ground like a 2.3-magnitude quake — beating the stadium\'s famous 2011 "Beast Quake," with dancing Swifties out-rumbling a Marshawn Lynch touchdown.',
      sourceUrl: 'https://www.cbsnews.com/news/beast-quake-taylor-swift-seattle-concerts-seismic-activity-lumen-field/',
      thumbnailUrl: null,
      moment: {
        context:
          'Geologist Jackie Caplan-Auerbach read the July 22–23, 2023 shows off a seismometer beside the stadium: shaking roughly twice as strong as the Beast Quake, sustained for hours at a time because 144,000 fans across two nights were all moving to the same beat. The difference, she noted, was rhythm — music drives the ground in a way a single touchdown roar can\'t.',
        sources: [
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/beast-quake-taylor-swift-seattle-concerts-seismic-activity-lumen-field/',
            source_title: "Beast Quake (Taylor's Version): Swift's Eras tour concerts cause seismic activity in Seattle",
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'CNN',
            url: 'https://www.cnn.com/2023/07/27/entertainment/taylor-swift-seismic-activity/index.html',
            source_title: 'Taylor Swift fans cause record-breaking seismic activity during Seattle shows',
            publisher: 'CNN',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'eras-tour-beige-book',
      year: 2023,
      month: 7,
      category: 'business',
      title: "The Eras Tour makes the Federal Reserve's Beige Book",
      snippet:
        'The Philadelphia Fed credited her three Linc shows with the city\'s strongest hotel month since the pandemic began — a pop tour surfacing in central-bank economic reporting.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-eras-tour-boosting-hotel-industry-economy-federal-reserve-1235371670/',
      thumbnailUrl: null,
      moment: {
        context:
          'The July 12, 2023 Beige Book flagged that May was Philadelphia\'s strongest hotel-revenue month since the pandemic\'s onset, in large part from the influx of fans for her Lincoln Financial Field dates — while Chicago broke hotel occupancy records during her Soldier Field weekend. "Swiftonomics" stopped being a joke headline and became a line item.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-eras-tour-boosting-hotel-industry-economy-federal-reserve-1235371670/',
            source_title: "Federal Reserve Says Taylor Swift's Eras Tour Had a Massive Impact on Philadelphia Hotel Bookings",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/business/consumer/taylor-swift-federal-reserve-credits-eras-tour-boosting-hotels-tourism-rcna94046',
            source_title: 'Federal Reserve credits Taylor Swift with boosting hotel revenues through her blockbuster Eras Tour',
            publisher: 'NBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Federal Reserve',
            url: 'https://www.federalreserve.gov/monetarypolicy/beigebook202307.htm',
            source_title: 'Beige Book — July 12, 2023',
            publisher: 'Federal Reserve Board',
            source_type: 'official',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'sofi-1989-tv-announcement',
      year: 2023,
      month: 8,
      category: 'release',
      title: "1989 (Taylor's Version) announced at the final US show — on the date fans predicted",
      snippet:
        'Blue versions of her Speak Now, folklore, and 1989 outfits teased it all night at SoFi before the reveal: Oct. 27. Fans had already done the math — Aug. 9 was eight years, nine months, and 13 days since the original.',
      sourceUrl: 'https://variety.com/2023/music/news/taylor-swift-announces-1989-taylors-version-coming-la-tour-finale-sofi-stadium-1235692622/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Aug. 9, 2023 finale of the tour\'s first US run ended with SoFi\'s roof lit up for the announcement and Swift calling it "my most FAVORITE re-record I\'ve ever done." The date numerology (8-9, and her lucky 13) had circulated among fans for weeks — one of the rare times the fandom called an announcement to the day.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/music/news/taylor-swift-announces-1989-taylors-version-coming-la-tour-finale-sofi-stadium-1235692622/',
            source_title: "Taylor Swift Says '1989 (Taylor's Version)' Is Coming at L.A. Finale",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'The Washington Post',
            url: 'https://www.washingtonpost.com/arts-entertainment/2023/08/10/taylor-swift-1989-taylors-version/',
            source_title: "Taylor Swift announces '1989 (Taylor's Version)' at final U.S. Eras Tour show this year",
            publisher: 'The Washington Post',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'bloomberg-billionaire',
      year: 2023,
      month: 10,
      category: 'business',
      title: 'Billionaire status, from the music alone',
      snippet:
        'Bloomberg put her net worth at $1.1 billion in October 2023 — one of the only entertainers ever to get there purely on songs and shows, no sneaker line or liquor brand required.',
      sourceUrl: 'https://www.bloomberg.com/graphics/2023-taylor-swift-net-worth-billionaire/',
      thumbnailUrl: null,
      moment: {
        context:
          'Bloomberg\'s breakdown: roughly $400 million in catalog value from music released since 2019, $370 million from ticket sales and merchandise, $120 million from streaming, $110 million in real estate, and $80 million in royalties — the Eras Tour and the Taylor\'s Version project doing the compounding.',
        sources: [
          {
            outlet: 'Bloomberg',
            url: 'https://www.bloomberg.com/graphics/2023-taylor-swift-net-worth-billionaire/',
            source_title: 'Taylor Swift Hits Billionaire Status as Net Worth Surges With Eras Tour Success',
            publisher: 'Bloomberg',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'CNBC',
            url: 'https://www.cnbc.com/2023/10/27/taylor-swift-has-entered-her-billionaire-era.html',
            source_title: 'Taylor Swift has reportedly entered her billionaire era with success of Eras Tour',
            publisher: 'CNBC',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'eras-film-opening-weekend',
      year: 2023,
      month: 10,
      category: 'release',
      title: 'The Eras Tour film opens to $92.8 million — the biggest concert-film debut ever',
      snippet:
        'Distributed straight through AMC, skipping the studios entirely: $92.8M domestic, $123.5M globally, and the second-biggest October opening of all time behind Joker.',
      sourceUrl: 'https://variety.com/2023/film/box-office/taylor-swift-eras-tour-box-office-final-opening-weekend-record-1235757568/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Oct. 13, 2023 opening weekend played like a tour stop: theaters full of costumed fans dancing in the aisles, with minimal traditional marketing behind it. The direct-to-AMC distribution model became the template she reran two years later for the Showgirl Release Party.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/film/box-office/taylor-swift-eras-tour-box-office-final-opening-weekend-record-1235757568/',
            source_title: 'Taylor Swift Eras Tour Box Office: Final Opening Weekend Number',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'CNBC',
            url: 'https://www.cnbc.com/2023/10/16/taylor-swift-eras-tour-box-office-weekend.html',
            source_title: "Taylor Swift Eras Tour film posts second-best October box office opening, behind 'Joker'",
            publisher: 'CNBC',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'slut-vault-love-song',
      year: 2023,
      month: 10,
      category: 'music',
      title: '"Slut!" turns out to be a love song',
      snippet:
        'The vault title everyone braced for arrived as a dreamy synth-pop ballad about a romance worth the name-calling — she\'d once had to choose between it and "Blank Space" for the original 1989.',
      sourceUrl: 'https://en.wikipedia.org/wiki/%22Slut!%22',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift said the two songs both "cheekily play on the discussions at that time of my life around my dating life" — Blank Space made the 2014 cut, and "Slut!" waited nine years. It debuted at No. 3 on the Hot 100, and critics read the soft, tender arrangement as the point: reckoning with the slut-shaming era by refusing to write an angry song about it.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/%22Slut!%22',
            source_title: '"Slut!"',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/taylor-swift-1989-vault-tracks-revelations-1234864433/',
            source_title: "The Sadness of 'Slut' — And More of Our Takeaways from Taylor Swift's New Vault Tracks",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'buenos-aires-karma-lyric-change',
      year: 2023,
      month: 11,
      category: 'relationship',
      title: '"Karma is the guy on the Chiefs" — sung with Travis watching',
      snippet:
        'She swapped the lyric mid-show in Buenos Aires while Kelce watched from a tent with her dad — then ran into his arms after the show for their first kiss caught on camera.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-travis-kelce-kiss-karma-is-the-guy-on-the-chiefs-1235469366/',
      thumbnailUrl: null,
      moment: {
        context:
          'Nov. 11, 2023: fan video caught Kelce covering his face and grinning as Scott Swift patted his arm. He recapped it on New Heights with "I\'m enjoying life, and I sure as hell enjoyed this weekend." The line stuck — the Chiefs version of the lyric kept resurfacing at shows through the rest of the tour.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-travis-kelce-kiss-karma-is-the-guy-on-the-chiefs-1235469366/',
            source_title: 'Taylor Swift Changes Lyric, Kisses Travis Kelce in Buenos Aires',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/pop-culture/celebrity/travis-kelce-reacts-taylor-swift-karma-lyric-change-rcna124807',
            source_title: "Travis Kelce reacts to Taylor Swift's changing 'Karma' lyrics to refer to the Chiefs",
            publisher: 'NBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'youre-losing-me-streaming',
      year: 2023,
      month: 11,
      category: 'music',
      title: '"You\'re Losing Me" finally hits streaming',
      snippet:
        'The Midnights bonus track fans treated as the Alwyn-breakup rosetta stone went wide on Nov. 29 — her thank-you for being named Spotify\'s top global artist of 2023.',
      sourceUrl: 'https://en.wikipedia.org/wiki/You%27re_Losing_Me',
      thumbnailUrl: null,
      moment: {
        context:
          'Previously locked to a CD-only Late Night Edition from May 2023, the song samples Swift\'s own heartbeat in its production. Jack Antonoff later revealed they wrote and recorded it on Dec. 5, 2021 — well over a year before the breakup became public, which only deepened the fan forensics around it.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/You%27re_Losing_Me',
            source_title: "You're Losing Me",
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Deadline',
            url: 'https://deadline.com/2023/11/taylor-swift-youre-losing-me-1235642243/',
            source_title: "Taylor Swift Surprise-Releases 'You're Losing Me' As Thank You For Being Spotify's Top 2023 Global Artist",
            publisher: 'Deadline',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'melbourne-mcg-biggest-shows',
      year: 2024,
      month: 2,
      category: 'tour',
      title: '96,000 a night at the MCG — the biggest shows of her career',
      snippet:
        'Three Melbourne Cricket Ground nights, 96,000 each, 288,000 total: "those are all the biggest shows I\'ve ever played on a tour, and you did it three times."',
      sourceUrl: 'https://deadline.com/2024/02/taylor-swift-starstruck-by-record-breaking-melbourne-crowd-mcg-eras-tour-1235829157/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Feb. 16–18, 2024 Melbourne stand opened the Australian leg at a scale no Eras Tour stadium before it had touched — she told the final crowd she was "starstruck" by the sight. The 96,000-per-night mark stood as the tour\'s attendance ceiling through its Vancouver finale.',
        sources: [
          {
            outlet: 'Deadline',
            url: 'https://deadline.com/2024/02/taylor-swift-starstruck-by-record-breaking-melbourne-crowd-mcg-eras-tour-1235829157/',
            source_title: 'Taylor Swift "Starstruck" By Record-Breaking Melbourne Crowd For Eras',
            publisher: 'Deadline',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/taylor-swift-celebrates-eras-tour-milestone-rcna139379',
            source_title: "Taylor Swift honors Melbourne crowd after celebrating major 'Eras Tour' milestone",
            publisher: 'Today',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'coachella-2024-with-travis',
      year: 2024,
      month: 4,
      category: 'sighting',
      title: 'Coachella, in a New Heights hat',
      snippet:
        'Days before TTPD dropped, she and Travis turned up in the Indio crowd — dancing to the Karma remix at Ice Spice\'s set and watching side-stage as Jack Antonoff played with Bleachers.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-travis-kelce-coachella-2024-photos-1235656317/',
      thumbnailUrl: null,
      moment: {
        context:
          'April 13, 2024: she wore a green New Heights cap for his podcast, he wore his usual white Happy Gilmore hat, and during Dom Dolla\'s DJ set he briefly lifted her off the ground in the crowd. A festival date night six days out from a double album nobody knew was a double album yet.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-travis-kelce-coachella-2024-photos-1235656317/',
            source_title: 'Taylor Swift & Travis Kelce Dance to Ice Spice, Support Jack Antonoff at Coachella 2024',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-travis-kelce-watch-ice-spice-bleachers-coachella-2024-1235004226/',
            source_title: 'Taylor Swift and Travis Kelce Dance to Ice Spice, Bleachers at Coachella 2024',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
  ],
};
