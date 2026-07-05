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
  ],
};
