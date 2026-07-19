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
export default {
  eraSlug: 'evermore',
  items: [
    {
      year: 2020,
      month: 12,
      day: 26,
      category: 'business',
      title: 'evermore makes her the first artist to top both charts at once — twice',
      snippet:
        "Her eighth No. 1 album, with 'willow' also debuting at No. 1 — the only artist ever to pull off that double feat twice, let alone in the same year.",
      sourceUrl: 'https://www.billboard.com/pro/taylor-swift-willow-debut-number-one-hot-100/',
      thumbnailUrl: 'https://lede-admin.stereogum.com/wp-content/uploads/sites/64/2025/12/Taylor-Swift-Willow.jpg?w=2880',
      moment: {
        context:
          'On charts dated Dec. 26, 2020, "willow" opened at No. 1 with 30 million U.S. streams and 59,000 downloads while evermore launched atop the Billboard 200 — an exact repeat of what "cardigan" and folklore had done that August, and no other artist had ever pulled off the double debut twice.\n\nIt was her seventh Hot 100 No. 1 and only her third No. 1 debut, after "Shake It Off" and "cardigan." The chart footnote is almost as good: "willow" fell to No. 38 the following week, at the time the steepest drop from a No. 1 debut in Hot 100 history.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-willow-debut-number-one-hot-100/',
          },
          {
            outlet: 'Stereogum',
            url: 'https://stereogum.com/2482727/the-number-ones-taylor-swifts-willow/columns/the-number-ones',
          },
        ],
        photos: [
          {
            url: 'https://lede-admin.stereogum.com/wp-content/uploads/sites/64/2025/12/Taylor-Swift-Willow.jpg?w=2880',
            credit: 'Stereogum',
            // Focal point set by viewing: she stands center-frame in the field,
            // face just below the tree line at ~57% height.
            focalPoint: '50% 57%',
          },
          // Photo pass #762 (2026-07-18): still from the official "willow"
          // music video — the glass-box scene, the single whose No. 1 debut
          // made this chart double. oEmbed-verified the video (RsEZmictANA)
          // belongs to the official @TaylorSwift channel; i.ytimg.com is
          // YouTube's own CDN; curl 200 image/jpeg 1280x720, downloaded and
          // vision-confirmed.
          {
            url: 'https://i.ytimg.com/vi/RsEZmictANA/maxresdefault.jpg',
            credit: 'Still from the official "willow" music video (dir. Taylor Swift), Republic Records, via YouTube',
            caption: 'Inside the glass box in the self-directed "willow" video — the single that opened at No. 1 the same week evermore topped the Billboard 200.',
            kind: 'archival',
            // Focal point set by viewing: both faces sit in the top quarter of
            // the frame — hers left, his right — so bias the crop high.
            focalPoint: '48% 20%',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 12,
      day: 11,
      category: 'music',
      title: "willow, and the spell it's supposed to sound like",
      snippet: 'Taylor\'s own description: it "sounds like casting a spell to make someone fall in love with you."',
      sourceUrl: 'https://en.wikipedia.org/wiki/Willow_(song)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9a/Taylor_Swift_-_Willow.png',
      moment: {
        context:
          'Full quote: "Willow is about intrigue, desire, and the complexity that goes into wanting someone." The music arrived almost by accident: Aaron Dessner had an instrumental sketch he called "Westerly," named for Swift\'s Rhode Island home, and sent it over without expecting anything back — she wrote the entire song to it within the hour.\n\nThe self-directed video (her third) picks up exactly where "cardigan" left off, following a golden thread through an enchanted forest, and the single later spawned a full coven of official remixes: "dancing witch," "lonely witch," and "moonlit witch" versions.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Willow_(song)' },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/9/9a/Taylor_Swift_-_Willow.png',
            credit: 'Republic Records',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 12,
      day: 11,
      category: 'music',
      title: 'no body, no crime, a murder ballad with HAIM',
      snippet:
        'A fictional murder mystery, complete with a cheating husband, a framed mistress, and a sister for an alibi.',
      sourceUrl: 'https://en.wikipedia.org/wiki/No_Body,_No_Crime',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/4/42/Taylor_Swift_Feat._Haim_-_No_Body%2C_No_Crime.png',
      moment: {
        context:
          'The victim is named Este, after Este Haim — Taylor sent her the track and asked if she and sister Danielle would sing on it. They said yes immediately.\n\nSwift had written the song entirely alone while deep in a true-crime documentary and podcast phase, then sent Aaron Dessner a voice memo of the finished thing; the production leans all the way into its country staging, harmonica courtesy of Josh Kaufman. It even went to country radio as a single in January 2021, and when HAIM opened Eras Tour shows in 2023, it bumped "\'tis the damn season" to become the evermore set\'s opener.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/No_Body,_No_Crime' },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/4/42/Taylor_Swift_Feat._Haim_-_No_Body%2C_No_Crime.png',
            credit: 'Republic Records',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 12,
      day: 11,
      category: 'music',
      title: "marjorie, sung back by her grandmother's own voice",
      snippet: "A tribute to her grandmother, the opera singer Marjorie Finlay — and, in the outro, literally her voice.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Marjorie_(song)',
      thumbnailUrl: 'https://i.ytimg.com/vi/hP6QpMeSG6s/hqdefault.jpg',
      moment: {
        context:
          "Taylor gave producer Aaron Dessner her grandmother's old opera recordings to build the track around; Marjorie's soprano appears woven into the song itself, answering the line \"if I didn't know better, I'd think you were singing to me now.\"\n\nDessner called it \"one of the most experimental songs on the album — it doesn't sound that way, but when you pick apart the layers underneath it, it's pretty interesting\": beneath the hush sit synthesizers, pizzicato strings, and a rhythm bed built from software that reshuffles sampled sounds into randomized patterns. On the Eras Tour, crowds raised their phone flashlights for it nightly — a tribute to a grandmother most of them never heard sing.",
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Marjorie_(song)' },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/',
          },
        ],
        // Real-photo pass (2026-07-09): official lyric video still, id verified
        // via YouTube oEmbed (title + @TaylorSwift channel). The thumbnail is a
        // photograph of Marjorie Finlay herself. URL verified HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/hP6QpMeSG6s/hqdefault.jpg',
            credit: 'Republic Records / YouTube (official lyric video still)',
            caption:
              'Still from the official "marjorie" lyric video — a photograph of Marjorie Finlay herself — via the video\'s YouTube thumbnail.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 12,
      day: 11,
      category: 'music',
      title: 'champagne problems, a fictional proposal gone wrong',
      snippet: 'A Christmas-party engagement, planned in secret and turned down on the spot — entirely invented, co-written with Joe Alwyn under his William Bowery pseudonym.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Champagne_Problems_(Taylor_Swift_song)',
      thumbnailUrl: 'https://i.ytimg.com/vi/wMpqCRF7TKg/hqdefault.jpg',
      moment: {
        context:
          'Swift described it simply as a story about "two college sweethearts" — a character study, not autobiography. She wrote it with Joe Alwyn (as William Bowery) during the September 2020 sessions at Long Pond that were being filmed for the folklore documentary, with Aaron Dessner producing the spare, oom-pah-tinged piano ballad.\n\nDespite never being released as a single, it reached No. 21 on the Hot 100 — and on the Eras Tour it became a nightly event anyway, consistently drawing extended ovations from the crowd.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Champagne_Problems_(Taylor_Swift_song)' },
          {
            outlet: 'Slate',
            url: 'https://slate.com/culture/2020/12/taylor-swift-evermore-review-new-album-track-by-track.html',
          },
        ],
        // Real-photo pass (2026-07-09): official lyric video still, id verified
        // via YouTube oEmbed (title + @TaylorSwift channel). URL verified
        // HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/wMpqCRF7TKg/hqdefault.jpg',
            credit: 'Republic Records / YouTube (official lyric video still)',
            caption: 'Still from the official "champagne problems" lyric video, via the video\'s YouTube thumbnail.',
            kind: 'archival',
            // Focal point set by viewing: the champagne flute stands just left
            // of center, its bowl at mid-frame.
            focalPoint: '46% 52%',
          },
          // Photo pass #762 (2026-07-18): the song's co-writer — Joe Alwyn
          // wrote it with her under the William Bowery pseudonym (era context;
          // a 2018 portrait, not from the sessions). Commons license
          // API-verified CC BY-SA 2.0 (Greg2600); curl 200 image/jpeg
          // 1249x1665, downloaded and vision-confirmed.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Joe_Alwyn-2018.jpg',
            credit: 'Greg2600, Wikimedia Commons (CC BY-SA 2.0) — Joe Alwyn, December 2018',
            caption: 'Joe Alwyn — credited as "William Bowery," he wrote the fictional turned-down proposal with her during the September 2020 Long Pond sessions.',
            kind: 'archival',
            // Focal point set by viewing: tight head-and-shoulders portrait,
            // face filling the frame, eyes just above center.
            focalPoint: '50% 45%',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 12,
      day: 11,
      category: 'music',
      title: 'coney island, a duet built for The National',
      snippet: 'A breakup told from both sides, with The National\'s Matt Berninger trading verses with her over a slow, aching duet.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Coney_Island_(Taylor_Swift_song)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c7/Coney_island_cover.jpeg',
      moment: {
        context:
          'The Dessner brothers built the instrumental and heard Berninger\'s voice in it immediately; Berninger recorded his half at Knobworld in Los Angeles while Taylor recorded hers at Long Pond in the Hudson Valley, never in the same room.\n\nThe words are another William Bowery co-write — Joe Alwyn trading breakup perspectives with her — and Aaron Dessner happily conceded the result cuts both ways: "it does really feel like Taylor, obviously, since she and William Bowery wrote all the words, but it also feels like a National song in a good way." She performed it live only three times on the Eras Tour, including a Sydney mashup with "White Horse" alongside Sabrina Carpenter.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Coney_Island_(Taylor_Swift_song)' },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/c/c7/Coney_island_cover.jpeg',
            credit: 'Republic Records',
          },
        ],
      },
    },
    {
      year: 2021,
      month: 4,
      day: 18,
      category: 'business',
      significance: 'defining', // the first proof the Taylor's Version project would actually work commercially (docs/decisions.md, 2026-07-19)
      threadIds: ['taylors-version'],
      relatedIds: [
        'moment:vault-lover-my-worst-case-scenario-scooter-braun-buys-big-machine-and-he',
        'moment:vault-ttpd-all-of-the-music-ive-ever-made-now-belongs-to-me',
      ],
      title: 'Fearless (Taylor\'s Version) is the first re-recorded album ever to hit No. 1',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-ever-2", label: "First re-record hits #1", kind: "award" },
      snippet:
        '291,000 units in week one — her ninth No. 1 album, tying Madonna, and the first re-recorded album in Billboard 200 history to top the chart.',
      sourceUrl: 'https://www.billboard.com/articles/news/9558306/taylor-swift-fearless-taylors-version-tops-billboard-200/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2021/04/Taylor-Swift-fearless-album-art-cr-Beth-Garrabrant-billboard-1548-1617974680.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'Beyond the headline record, the numbers were era-defining: 179,000 of the 291,000 units were pure album sales — the biggest sales week for any album since folklore — and its 143 million on-demand streams gave a country album by a woman its largest streaming week ever.\n\nIt also made her the first woman in the Billboard 200\'s 65-year history to land three new No. 1 albums in under 12 months, following folklore and evermore. The Madonna tie put her at nine chart-toppers, second among women only to Barbra Streisand\'s eleven.',
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
        // Photo-depth pass (2026-07-18, #ten-defining-events-round-2): this was a
        // chart-only story with no accompanying live event, so the real, on-topic,
        // non-duplicate photo pool is genuinely thin — one additional Beth
        // Garrabrant press portrait from the same era, used by Billboard in its
        // own Fearless (Taylor's Version) chart coverage. Verified HTTP 200 +
        // image/jpeg this session; other outlets' "Fearless" chart-story photos
        // (Forbes in particular) turned out to be unrelated stock shots from
        // other eras when checked visually, so they were left out rather than
        // used misleadingly.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2021/04/Taylor-Swift-fearless-album-art-cr-Beth-Garrabrant-billboard-1548-1617974680.jpg?w=942&h=628&crop=1',
            credit: 'Beth Garrabrant',
            // Focal point set by viewing: Billboard's wide crop of the sepia
            // cover art — her profile sits right of center, eyes at ~40% height,
            // hair streaming left.
            focalPoint: '63% 40%',
          },
          // Photo pass #762 (2026-07-18): still from the official "Mr.
          // Perfectly Fine" lyric video — the tuxedo-in-fog title card of the
          // biggest From the Vault track of this record-setting release week.
          // oEmbed-verified the video (rFjJs6ZjPe8) belongs to the official
          // @TaylorSwift channel; i.ytimg.com is YouTube's own CDN; curl 200
          // image/jpeg 1280x720, downloaded and vision-confirmed.
          {
            url: 'https://i.ytimg.com/vi/rFjJs6ZjPe8/maxresdefault.jpg',
            credit: 'Still from the official "Mr. Perfectly Fine (Taylor\'s Version) (From The Vault)" lyric video, Republic Records, via YouTube',
            caption: 'The faceless tuxedo of "Mr. Perfectly Fine" — the vault cut that led the album\'s 291,000-unit record week.',
            kind: 'archival',
            // Focal point set by viewing: the tuxedo stands dead center in the
            // fog with the title above; crop reads best just above center.
            focalPoint: '50% 45%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2020/12/03-taylor-swift-press-cr-Beth-Garrabrant-2020-billboard-1548-1607617377.jpg?w=1024',
            credit: 'Beth Garrabrant, via Billboard',
            caption:
              "A Beth Garrabrant press portrait of Swift from the same era, used by Billboard to illustrate its coverage of Fearless (Taylor's Version) holding its chart position months after release.",
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2021,
      month: 11,
      day: 22,
      category: 'business',
      significance: 'defining', // an unprecedented chart record for a song fans had wanted for a decade (docs/decisions.md, 2026-07-19)
      relatedIds: ['moment:vault-midnights-all-too-well-the-short-film-wins-the-grammy-that-makes-her-a'],
      title: 'All Too Well (10 Minute Version) becomes the longest song ever to hit No. 1',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-ever-3", label: "ATW (10 Min) hits #1", kind: "award" },
      snippet:
        '10 minutes and 13 seconds — beating a nearly 50-year-old record held by Don McLean\'s "American Pie." Taylor\'s own reaction: "You guys sent a 10-minute song to Number One for the first time in history."',
      sourceUrl: 'https://www.guinnessworldrecords.com/news/2021/11/taylor-swifts-10-minute-all-too-well-is-longest-song-to-reach-no-1-683614',
      // Image-fix pass (2026-07-10): tickets #193/#147 — old Guinness URL was a
      // two-panel news collage (Red TV cover + premiere photo, visible seam).
      // Swapped to the Red (Taylor's Version) cover art, already verified live
      // (HTTP 200 + image/png) and in use elsewhere in this file.
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/4/47/Taylor_Swift_-_Red_%28Taylor%27s_Version%29.png',
      moment: {
        context:
          'At 10:13 it dethroned Don McLean\'s 8:37 "American Pie," which had held the mark since January 1972 — and the record fell as part of a broader rout, with Red (Taylor\'s Version) landing 26 songs on the Hot 100 at once, the most simultaneous new entries since the chart began in 1958 — a mark that stood until 2023. The two versions of "All Too Well" combined for 54.4 million U.S. Spotify streams in the debut week alone.\n\nThe momentum was carefully built: an SNL performance, the self-directed short film starring Sadie Sink and Dylan O\'Brien, and a surprise acoustic appearance at a Manhattan theater screening all landed within days of the album.',
        sources: [
          {
            outlet: 'Guinness World Records',
            url: 'https://www.guinnessworldrecords.com/news/2021/11/taylor-swifts-10-minute-all-too-well-is-longest-song-to-reach-no-1-683614',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-all-too-well-longest-number-one-billboard-1261579/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/morgan-wallen-single-week-hot-100-record-36-songs-one-thing-at-a-time-1235285241/',
          },
        ],
        // Image-fix pass (2026-07-10): tickets #193/#147 — old Guinness URL was
        // a two-panel news collage (visible seam between the Red TV cover and a
        // premiere photo). Replaced with the Red (Taylor's Version) cover art
        // (single image, verified HTTP 200 + image/png this session).
        //
        // Photo-depth pass (2026-07-18, #ten-defining-events-round-2): added real
        // photos from the three promotional beats named in the context above (SNL
        // performance, short film, premiere). Every URL below downloaded and
        // viewed directly this session to confirm it shows what its caption
        // claims and isn't a placeholder/collage — the Guinness World Records
        // article's own photo was checked and rejected for exactly that reason
        // (the same two-panel collage flagged in the 2026-07-10 note above).
        // Each URL verified HTTP 200 + a real image/* content-type via curl.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/4/47/Taylor_Swift_-_Red_%28Taylor%27s_Version%29.png',
            credit: 'Republic Records (album cover art)',
            caption: "The Red (Taylor's Version) cover — \"All Too Well (10 Minute Version)\" is the album's centerpiece track that set the longest-No.-1-song record.",
            kind: 'primary',
            // Focal point set by viewing: her face sits left of center under
            // the burgundy cap, ringed hand raised to the right.
            focalPoint: '42% 46%',
          },
          // Photo pass #762 (2026-07-18): still from All Too Well: The Short
          // Film — Sadie Sink and Dylan O'Brien forehead-to-forehead in the
          // car; the self-directed film is named in this page's context as a
          // driver of the record week (distinct image from the film's poster
          // used on the premiere page). oEmbed-verified the video
          // (tollGa3S0o8) belongs to the official @TaylorSwift channel;
          // i.ytimg.com is YouTube's own CDN; curl 200 image/jpeg 1280x720,
          // downloaded and vision-confirmed.
          {
            url: 'https://i.ytimg.com/vi/tollGa3S0o8/maxresdefault.jpg',
            credit: 'Still from "All Too Well: The Short Film" (dir. Taylor Swift), Republic Records, via YouTube',
            caption: "Sadie Sink and Dylan O'Brien in All Too Well: The Short Film — the self-directed film that helped push a 10-minute song to No. 1.",
            kind: 'archival',
            // Focal point set by viewing: the two faces meet at center frame,
            // slightly above the midline.
            focalPoint: '50% 40%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2021/11/taylor-swift-snl-all-too-well-11142021-billboard-1548-1636905415.jpg?w=942&h=628&crop=1',
            credit: 'Will Heath/NBC',
            caption:
              'Swift performs "All Too Well (10 Minute Version)" for the first time on television, as musical guest on Saturday Night Live, Nov. 13, 2021 — part of the promotional run that carried the song to No. 1.',
            kind: 'primary',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2021/11/taylor-swift-all-too-well-premiere-2021-billboard-1548-1636758898.png?w=942&h=628&crop=1',
            credit: 'Dimitrios Kambouris/Getty Images',
            caption:
              'Swift at the "All Too Well" short film premiere, AMC Lincoln Square, New York City, Nov. 12, 2021 — the night she performed the 10-minute version live for the first time, before it played on SNL the next night.',
            kind: 'primary',
          },
          {
            url: 'https://jj-justjaredjr-media.s3.amazonaws.com/wp-content/uploads/2021/11/dylan-sadie-taylor/dylan-obrien-sadie-sink-join-taylor-swift-at-all-too-well-premiere-02.jpg',
            credit: 'Evan Agostini/Invision/AP, via Just Jared Jr',
            caption:
              "Dylan O'Brien, Taylor Swift, and Sadie Sink together at the \"All Too Well\" short film premiere, Nov. 12, 2021.",
            kind: 'archival',
          },
          {
            url: 'https://jj-justjaredjr-media.s3.amazonaws.com/wp-content/uploads/2021/11/dylan-sadie-taylor/dylan-obrien-sadie-sink-join-taylor-swift-at-all-too-well-premiere-01.jpg',
            credit: 'Dimitrios Kambouris/Getty Images, via Just Jared Jr',
            caption:
              'Sadie Sink, who starred opposite Dylan O\'Brien in the short film built around the song, on the premiere carpet.',
            kind: 'archival',
          },
          {
            url: 'https://jj-justjaredjr-media.s3.amazonaws.com/wp-content/uploads/2021/11/dylan-sadie-taylor/dylan-obrien-sadie-sink-join-taylor-swift-at-all-too-well-premiere-03.jpg',
            credit: 'Dimitrios Kambouris/Getty Images, via Just Jared Jr',
            caption: 'Swift on the "All Too Well" short film premiere red carpet, Nov. 12, 2021.',
            kind: 'archival',
          },
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2021/11/taylor-swift-all-too-well-car.jpg?w=1600&h=900&crop=1',
            credit: 'Republic Records / Taylor Swift (All Too Well: The Short Film still)',
            caption:
              "A still from All Too Well: The Short Film, the Sadie Sink/Dylan O'Brien-led film Swift wrote and directed and released alongside the 10-minute version — central to the promotional push that took the song to No. 1.",
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2021,
      month: 11,
      day: 23,
      category: 'business',
      title: 'evermore gets an Album of the Year nod, its only nomination',
      snippet:
        "Nominated for the Grammys' biggest award, with no other nods for the album — it lost to Jon Batiste's We Are at the 64th ceremony.",
      sourceUrl: 'https://www.forbes.com/sites/hughmcintyre/2021/12/05/taylor-swift-just-lost-one-of-her-album-of-the-year-grammy-nominations/',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0a/Taylor_Swift_-_Evermore.png',
      moment: {
        context:
          'The nomination came with an asterisk-shaped subplot: Swift was briefly up for Album of the Year twice that cycle, credited on Olivia Rodrigo\'s Sour because two of its songs drew on previously released Swift material — until the Recording Academy ruled that only writers of new material count in the category and struck her (along with Jack Antonoff and St. Vincent) from the Sour nomination, leaving evermore as her lone shot.\n\nThe album then lost to the night\'s great upset: Jon Batiste\'s We Are, which had peaked at No. 86 on the Billboard 200 but rode in on 11 nominations, the most of any artist that year.',
        sources: [
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2021/12/05/taylor-swift-just-lost-one-of-her-album-of-the-year-grammy-nominations/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/awards/jon-batiste-album-of-the-year-2022-grammys-why-it-won-1235054841/',
          },
        ],
        // Real-photo pass (2026-07-09): album cover art from Wikipedia's stable
        // upload.wikimedia.org copy (exact filename from the article HTML).
        // URL verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/0/0a/Taylor_Swift_-_Evermore.png',
            credit: 'Republic Records (album cover art)',
            caption: "evermore's album cover — the album's lone nomination at the 64th Grammys was for the night's biggest award.",
            kind: 'archival',
            // Focal point set by viewing: the French braid runs down the upper
            // half of the frame between her plaid-coated shoulders.
            focalPoint: '50% 35%',
          },
          // Photo pass #762 (2026-07-18): Jon Batiste — whose We Are took the
          // Album of the Year upset this page turns on (era context; a June
          // 2022 portrait from the TIME 100 Gala, two months after the
          // ceremony). Commons license API-verified CC BY 2.0 (lev radin);
          // canonical 1280px render from the Commons API; curl 200 image/jpeg
          // 1280x2139, downloaded full-res and vision-confirmed.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Batiste%2C_Jon.jpg/1280px-Batiste%2C_Jon.jpg',
            credit: 'lev radin, Wikimedia Commons (CC BY 2.0) — Jon Batiste at the TIME 100 Gala, June 2022',
            caption: "Jon Batiste, months after his We Are — a No. 86 peak on the Billboard 200 — beat evermore in the night's great Album of the Year upset.",
            kind: 'archival',
            // Focal point set by viewing: tall portrait; his smiling face sits
            // high in the frame, slightly left of center.
            focalPoint: '46% 20%',
          },
        ],
      },
    },

    // --- Active-tier batch (2026-07-04), per docs/decisions.md.
    {
      year: 2021,
      month: 3,
      day: 14,
      category: 'fashion',
      title: 'A folklore medley, staged like a cabin in an enchanted forest',
      snippet: 'A blue-and-gold Etro "nap dress," performing "cardigan," "august," and "willow" from a set built to look like a tiny forest cabin.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-floral-2021-grammy-awards-dress-video-9540868/',
      // Image-fix pass (2026-07-10): ticket #215 — old Bustle URL was the
      // separate red-carpet Oscar de la Renta photo (also used by, and a
      // duplicate of, this era's "3D-floral Oscar de la Renta mini dress"
      // item), not the medley performance itself. Swapped to the official
      // performance still (verified HTTP 200 + image/jpeg).
      thumbnailUrl: 'https://i.ytimg.com/vi/Uzii44SDYFA/hqdefault.jpg',
      moment: {
        context:
          'She opened "cardigan" from the roof of the mossy cabin, surrounded by trees against a nighttime backdrop, then slipped inside to join Aaron Dessner and Jack Antonoff — the two producers behind both lockdown albums — for "august," before all three stepped out into the lit-up forest for "willow."\n\nIt was her first awards-show performance of the era\'s material since a solo acoustic "betty" at the September 2020 ACM Awards — and the first TV performance of "cardigan," "august" and "willow" — and the night ended with folklore taking Album of the Year, her third career win in the category. On the red carpet beforehand: a floral-appliqué Oscar de la Renta mini, covered separately by the outlets below.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-floral-2021-grammy-awards-dress-video-9540868/',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-performed-folklore-evermore-medley-2021-grammy-awards-1140876/',
          },
          {
            outlet: 'Elite Daily',
            url: 'https://www.elitedaily.com/p/taylor-swifts-2021-grammys-dress-is-cottagecore-princesscore-come-to-life-65951509',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-country/taylor-swift-betty-2020-acm-awards-1058897/',
          },
        ],
        // Image-fix pass (2026-07-10): ticket #215 — old Bustle URL was the
        // separate red-carpet Oscar de la Renta look (no cabin/forest set
        // visible), and a duplicate of the photo already used on this era's
        // "3D-floral Oscar de la Renta mini dress" item. Replaced with the
        // official performance still, id verified via YouTube oEmbed (title:
        // "Taylor Swift - cardigan / august / willow (Live From The 63rd
        // GRAMMYs / 2021)", channel: Taylor Swift). URL verified HTTP 200 +
        // image/jpeg; visually confirmed Swift on the moss-covered cabin set
        // in the blue-and-gold Etro gown.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/Uzii44SDYFA/hqdefault.jpg',
            credit: 'Republic Records / YouTube (official performance still)',
            caption: 'Swift on the moss-covered cabin set during the folklore/evermore medley at the 2021 Grammys.',
            kind: 'archival',
          },
        ],
      },
    },

    // --- Fashion/photo depth pass (2026-07-04)
    {
      year: 2020,
      month: 12,
      day: 11,
      category: 'fashion',
      title: 'The ivory Zimmermann gown from the "willow" video',
      snippet:
        'A lace-paneled Zimmermann "Charm Star" dress that read as bridal to fans within hours — paired with a Jennifer Behr tiara and antique diamond earrings.',
      sourceUrl: 'https://www.refinery29.com/en-us/2020/12/10221082/shop-taylor-swift-evermore-willow-dress',
      thumbnailUrl:
        'https://www.redcarpet-fashionawards.com/wp-content/uploads/2020/12/Taylor-Swift-Wore-Zimmermann-For-Her-Willow-Music-Video-819x1024.jpg',
      moment: {
        context:
          'The ivory gown — Zimmermann\'s Fall \'20 "Charm Star" silk-organza and guipure lace maxi dress, retailing around $2,650 — features a V-neck, lace paneling and a tonal velvet bow at one shoulder.\n\nFans immediately speculated it was a wedding dress; Zimmermann said the collection was instead inspired by "lucky charms and fortune telling." She wore it with a Jennifer Behr Priscilla tiara and antique diamond and pearl earrings.',
        sources: [
          {
            outlet: 'Refinery29',
            url: 'https://www.refinery29.com/en-us/2020/12/10221082/shop-taylor-swift-evermore-willow-dress',
          },
          {
            outlet: 'Red Carpet Fashion Awards',
            url: 'https://www.redcarpet-fashionawards.com/2020/12/11/taylor-swift-wore-zimmermann-for-her-willow-music-video/',
          },
        ],
        photos: [
          {
            url: 'https://www.redcarpet-fashionawards.com/wp-content/uploads/2020/12/Taylor-Swift-Wore-Zimmermann-For-Her-Willow-Music-Video-819x1024.jpg',
            credit: 'Republic Records',
          },
        ],
      },
    },
    {
      year: 2021,
      month: 2,
      day: 11,
      category: 'fashion',
      title: "A sepia Fearless (Taylor's Version) cover, with a Love Story Easter egg",
      snippet:
        'Revealed on Good Morning America, the cover recreates her original 2008 pose in sepia tone — in a cream Ulla Johnson blouse fans clocked as a nod to Romeo\'s shirt from the "Love Story" video.',
      sourceUrl: 'https://www.marieclaire.com/celebrity/a35498019/taylor-swift-outfit-new-fearless-cover-easter-egg/',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/5/5b/Fearless_%28Taylor%27s_Version%29_%282021_album_cover%29_by_Taylor_Swift.png',
      moment: {
        context:
          'The cover, revealed on Good Morning America on February 11, 2021 — the same morning she announced the re-recording project, with "Love Story (Taylor\'s Version)" arriving that night — recreates the original 2008 album\'s windswept pose in warm sepia tone. The blouse she wears in it is a cream satin "Fernanda" top from Ulla Johnson ($395).\n\nFans noted the top closely resembles the Shakespearean-style shirt worn by actor Justin Gaston as the Romeo character in the 2008 "Love Story" video, reading it as a symbolic callback: she no longer needs a knight in shining armor because she is her own.',
        sources: [
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/celebrity/a35498019/taylor-swift-outfit-new-fearless-cover-easter-egg/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/5/5b/Fearless_%28Taylor%27s_Version%29_%282021_album_cover%29_by_Taylor_Swift.png',
            credit: 'Republic Records',
          },
        ],
      },
    },
    {
      year: 2021,
      month: 6,
      day: 18,
      category: 'fashion',
      title: "A vintage Chevrolet, a burgundy cap, and the Red (Taylor's Version) cover",
      snippet:
        'Beige peacoat, red lipstick, and a sold-out-within-hours burgundy velvet "Mattie" cap by independent designer Janessa Leoné, shot in a 1932 Chevrolet Cabriolet.',
      sourceUrl: 'https://www.billboard.com/articles/columns/pop/9589789/taylor-swift-red-taylors-version-hat-album-cover-janessa-leone/',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/4/47/Taylor_Swift_-_Red_%28Taylor%27s_Version%29.png',
      moment: {
        context:
          'Leoné had no advance notice her "Mattie" cap would appear on the cover, telling Billboard: "It came as a total surprise to see her sport Mattie on the album cover — we were genuinely shocked, but thrilled."\n\nShe said the shoot was not a team collaboration — Swift\'s stylist chose the piece independently — and the cap sold out on Leoné\'s site immediately after the reveal on June 18, 2021.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/articles/columns/pop/9589789/taylor-swift-red-taylors-version-hat-album-cover-janessa-leone/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/4/47/Taylor_Swift_-_Red_%28Taylor%27s_Version%29.png',
            credit: 'Republic Records',
          },
        ],
      },
    },
    {
      year: 2021,
      month: 11,
      category: 'fashion',
      title: "The 'siren red' lip and cat eye that came to define the Red (TV) era",
      snippet:
        'Overlined red-liner-and-matte-lipstick "siren red" mouth, a fine-tipped black liquid cat eye, and flat-ironed, straight-across bangs — the signature beauty look of the re-release run.',
      sourceUrl: 'https://www.bustle.com/style/taylor-swift-red-beauty-look',
      // Image-fix pass (2026-07-10): ticket #212 — old URL's Getty asset
      // (155669360) is a 2012 original-Red-era photo (bangs/curls/backdrop
      // don't match Nov 2021), mismatched despite Bustle's own caption.
      // Swapped to the Nov 11, 2021 Tonight Show photo (red lip + bangs
      // visible), already verified live (HTTP 200 + image/jpeg) elsewhere
      // in this file.
      thumbnailUrl:
        'https://www.redcarpet-fashionawards.com/wp-content/uploads/2021/11/Taylor-Swift-Wore-Zuhair-Murad-On-Jimmy-Fallon-.jpg',
      moment: {
        context:
          'Bustle\'s breakdown of the look starts at the mouth: red lip liner as a base with matte red lipstick layered on top and slightly overlined at the cupid\'s bow — the "siren red" lip she wore to nearly every appearance of the re-release run.\n\nThe rest of the formula: a "minimal yet striking" black liquid cat eye with a fine-tipped flick, straight-across bangs re-created with a flat iron and angled at 45 degrees for dimension, plus an inner-corner highlight to open the eyes.',
        sources: [{ outlet: 'Bustle', url: 'https://www.bustle.com/style/taylor-swift-red-beauty-look' }],
        // Image-fix pass (2026-07-10): ticket #212 — old Bustle imgix URL
        // (Getty asset 155669360) is a decade-old 2012 original-Red-era photo,
        // not the Nov 2021 re-release run described here. Replaced with the
        // Nov 11, 2021 Tonight Show appearance (red lip and bangs both
        // visible), verified HTTP 200 + image/jpeg this session.
        photos: [
          {
            url: 'https://www.redcarpet-fashionawards.com/wp-content/uploads/2021/11/Taylor-Swift-Wore-Zuhair-Murad-On-Jimmy-Fallon-.jpg',
            credit: 'NBC',
            focalPoint: '42% 13%',
            caption:
              'Swift on The Tonight Show Starring Jimmy Fallon, Nov. 11, 2021 — the "siren red" lip and blunt bangs of the Red (TV) beauty look, the night before the album\'s release.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2021,
      month: 11,
      day: 13,
      category: 'fashion',
      title: 'A skin-tight Alaïa jumpsuit for "All Too Well" on SNL, then a houndstooth blazer after',
      snippet:
        'An off-the-shoulder Alaïa knit jumpsuit for the 10-minute "All Too Well" performance on SNL, swapped for an Anine Bing houndstooth blazer and Aquazzura platform boots at the after-party with Blake Lively.',
      sourceUrl: 'https://www.shefinds.com/collections/taylor-swift-turned-heads-in-this-skintight-bodysuit-on-snl-you-can-see-everything/',
      thumbnailUrl: 'https://www.shefinds.com/files/2021/11/taylor-swift-snl-performance.jpg',
      moment: {
        context:
          'For her November 13, 2021 SNL performance of "All Too Well (10 Minute Version)," Swift wore a skin-tight off-the-shoulder Alaïa stretch-knit jumpsuit (about $3,590) with Jennifer Zeuner Holland earrings and Loeffler Randall ankle booties.\n\nAt the after-party that night at L\'Avenue in New York with Blake Lively, she layered a houndstooth blazer by Anine Bing and platform boots by Aquazzura over the same jumpsuit.',
        sources: [
          {
            outlet: 'SheFinds',
            url: 'https://www.shefinds.com/collections/taylor-swift-turned-heads-in-this-skintight-bodysuit-on-snl-you-can-see-everything/',
          },
          {
            outlet: 'Nylon',
            url: 'https://www.nylon.com/fashion/taylor-swift-snl-after-party-outfit-houndstooth-blazer-platform-boots/amp',
          },
        ],
        photos: [
          {
            url: 'https://www.shefinds.com/files/2021/11/taylor-swift-snl-performance.jpg',
            credit: 'Will Heath/NBC',
          },
          // Image-fix pass (2026-07-10): ticket #200 — same imgix asset, but
          // dropped the 'duotone=000000,ff6813' query param that was baking a
          // black/orange tint into every pixel. Verified HTTP 200 + image/jpeg
          // and visually confirmed natural color (Swift in the houndstooth
          // coat with Blake Lively, both masked, at the SNL after-party).
          {
            url: 'https://imgix.bustle.com/uploads/getty/2021/11/15/5927994a-87f7-41ae-9f97-576f50f1747f-getty-1353171506.jpg?w=414&h=736&fit=crop&crop=faces&dpr=2',
            credit: 'Getty Images',
          },
        ],
      },
    },

    // --- Fashion/photo depth pass 2 (2026-07-04)
    {
      year: 2020,
      month: 12,
      day: 11,
      category: 'fashion',
      title: 'The "willow" video\'s final scene: a Gucci Liberty-print floral maxi dress',
      snippet:
        'Beyond the Zimmermann "bridal" gown, the video\'s closing scene puts her in a $4,800 Gucci maxi dress made from Liberty London floral fabric — a third, lesser-discussed look from the same shoot.',
      sourceUrl: 'https://stealherstyle.net/2020/12/11/taylor-swift-willow-music-video/',
      // Image-fix pass (2026-07-10 retry): ticket #194 — broadened search
      // (Wikimedia Commons, Getty editorial, official TaylorSwiftVEVO/BRIT-style
      // YouTube thumbnails in all resolutions, Billboard's storyboard-vs-frame
      // piece, taylorswiftstyle.com) turned up no clean single still of this
      // specific "final scene" Gucci look — every YouTube auto-thumbnail/
      // storyboard frame checked (maxresdefault, hqdefault, sddefault, 0-3.jpg)
      // shows a different scene (the Zimmermann bridal moment or the cloak/
      // witch scene), and press coverage of this look doesn't exist beyond
      // this one fan-style-blog composite. No verified replacement found;
      // left as the record's only photo per protocol fallback. SKIPPED-FINAL.
      thumbnailUrl: 'https://stealherstyle.net/wp-content/uploads/2020/12/taylorswift_w3-500x350.jpg',
      moment: {
        context:
          'Steal Her Style\'s breakdown of the "willow" video counts three distinct looks: a Magnolia Pearl "Layla" tank dress over her own "cardigan" merch sweater for the opening scene; the Zimmermann "Charm Star" lace gown with Jennifer Behr tiara for the "wedding" scene.\n\nFor the video\'s final scene: a Gucci maxi dress made from Liberty of London floral-print fabric, retailing around $4,800 — a look far less discussed by fans than the "bridal" Zimmermann gown but confirmed as part of the same December 2020 shoot.',
        sources: [
          {
            outlet: 'Steal Her Style',
            url: 'https://stealherstyle.net/2020/12/11/taylor-swift-willow-music-video/',
          },
          {
            outlet: 'Social Media Style',
            url: 'https://www.socialmediastyle.org/post/taylor-swift-s-beige-lace-panel-dress-from-the-willow-music-video-off-of-the-evermore-album',
          },
        ],
        photos: [
          {
            url: 'https://stealherstyle.net/wp-content/uploads/2020/12/taylorswift_w3-500x350.jpg',
            credit: 'Republic Records',
          },
        ],
      },
    },
    {
      year: 2021,
      month: 3,
      day: 14,
      category: 'fashion',
      title: 'A 3D-floral Oscar de la Renta mini dress for the 2021 Grammys red carpet',
      snippet:
        'A separate look from her Etro performance gown: a vividly floral Oscar de la Renta Spring \'21 mini dress with mesh bell sleeves and individually tacked-on botanical appliqués, worn to arrive at the (pandemic-scaled) red carpet before her folklore/evermore medley.',
      sourceUrl: 'https://www.redcarpet-fashionawards.com/2021/03/15/taylor-swift-wore-oscar-de-la-renta-etro-to-the-2021-grammy-awards/',
      thumbnailUrl:
        'https://www.redcarpet-fashionawards.com/wp-content/uploads/2021/03/Taylor-Swift-Wore-Oscar-de-la-Renta-To-The-2021-Grammy-Awards-731x1024.jpg',
      moment: {
        context:
          'For her red-carpet arrival at the March 14, 2021 Grammys — where folklore won Album of the Year — Swift wore a mini dress from Oscar de la Renta\'s Spring 2021 collection: long mesh bell sleeves, a mock neck, and bold 3D floral embroidery with botanical appliqués tacked on individually.\n\nShe paired it with pink Christian Louboutin "Rose Amelie" peep-toe ankle-strap heels and Cathy Waterman jewelry — a separate outfit from the navy-and-gold Etro paisley gown she changed into to perform the folklore/evermore medley later that night.',
        sources: [
          {
            outlet: 'Red Carpet Fashion Awards',
            url: 'https://www.redcarpet-fashionawards.com/2021/03/15/taylor-swift-wore-oscar-de-la-renta-etro-to-the-2021-grammy-awards/',
          },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1248131/taylor-swift-brought-the-flower-power-to-the-2021-grammys-and-were-here-for-it',
          },
        ],
        photos: [
          {
            url: 'https://www.redcarpet-fashionawards.com/wp-content/uploads/2021/03/Taylor-Swift-Wore-Oscar-de-la-Renta-To-The-2021-Grammy-Awards-731x1024.jpg',
            credit: 'Getty Images',
            focalPoint: '45% 10%',
          },
        ],
      },
    },
    {
      year: 2021,
      month: 11,
      day: 12,
      category: 'fashion',
      title: 'A purple velvet Etro pantsuit for the "All Too Well" short film premiere',
      snippet:
        'A double-breasted, gold-buttoned Etro velvet suit with contrast black lapels, worn to the November 12, 2021 New York premiere of her self-directed "All Too Well" short film with Dylan O\'Brien and Sadie Sink.',
      sourceUrl: 'https://www.redcarpet-fashionawards.com/2021/11/12/taylor-swift-wore-etro-to-the-all-too-well-new-york-premiere/',
      thumbnailUrl:
        'https://www.redcarpet-fashionawards.com/wp-content/uploads/2021/11/Taylor-Swift-Wore-Etro-To-The-All-Too-Well-New-York-Premiere.jpg',
      moment: {
        context:
          'At the AMC Lincoln Square 13 premiere of her self-written-and-directed "All Too Well" short film, Swift wore a purple velvet Etro pantsuit with padded shoulders and contrasting black lapels, styled with Melinda Maria jewelry.\n\nCo-stars Dylan O\'Brien and Sadie Sink joined her on the carpet for the film built around the 10-minute version of "All Too Well" from Red (Taylor\'s Version), released that week.',
        sources: [
          {
            outlet: 'Red Carpet Fashion Awards',
            url: 'https://www.redcarpet-fashionawards.com/2021/11/12/taylor-swift-wore-etro-to-the-all-too-well-new-york-premiere/',
          },
          {
            outlet: 'Just Jared',
            url: 'https://www.justjared.com/2021/11/12/taylor-swift-walks-red-carpet-at-all-too-well-short-film-premiere-with-dylan-obrien-sadie-sink/',
          },
        ],
        photos: [
          {
            url: 'https://www.redcarpet-fashionawards.com/wp-content/uploads/2021/11/Taylor-Swift-Wore-Etro-To-The-All-Too-Well-New-York-Premiere.jpg',
            credit: 'Getty Images',
          },
        ],
      },
    },
    {
      year: 2021,
      month: 11,
      day: 11,
      category: 'fashion',
      title: 'A gold-beaded Zuhair Murad shift dress for The Tonight Show',
      snippet:
        'An ivory mod-style mini dress from Zuhair Murad\'s Resort 2022 collection, gold beaded trim at the neckline and sleeves, worn to promote Red (Taylor\'s Version) on Jimmy Fallon\'s show days before the album\'s release.',
      sourceUrl: 'https://www.redcarpet-fashionawards.com/2021/11/12/taylor-swift-wore-zuhair-murad-david-koma-on-jimmy-fallon-seth-meyers/',
      thumbnailUrl:
        'https://www.redcarpet-fashionawards.com/wp-content/uploads/2021/11/Taylor-Swift-Wore-Zuhair-Murad-On-Jimmy-Fallon-.jpg',
      moment: {
        context:
          'Promoting Red (Taylor\'s Version) on The Tonight Show Starring Jimmy Fallon, Swift wore an ivory shift dress from Lebanese couturier Zuhair Murad\'s Resort 2022 collection, with gold beaded trim at the neckline and sleeves and oversized pockets. She paired it with gold Christian Louboutin "So Kate" pumps, Lark & Berry jewelry, and her signature red lip.\n\nIt was one of two late-night looks from the same release-week press blitz — the crystal-covered David Koma she changed into for Late Night with Seth Meyers, covered separately in this era\'s fashion items, was the other.',
        sources: [
          {
            outlet: 'Red Carpet Fashion Awards',
            url: 'https://www.redcarpet-fashionawards.com/2021/11/12/taylor-swift-wore-zuhair-murad-david-koma-on-jimmy-fallon-seth-meyers/',
          },
          {
            outlet: 'Vogue Arabia',
            url: 'https://en.vogue.me/fashion/taylor-swift-zuhair-murad-white-dress-red-the-tonight-show-starring-jimmy-fallon/',
          },
        ],
        photos: [
          {
            url: 'https://www.redcarpet-fashionawards.com/wp-content/uploads/2021/11/Taylor-Swift-Wore-Zuhair-Murad-On-Jimmy-Fallon-.jpg',
            credit: 'NBC',
            focalPoint: '42% 13%',
          },
        ],
      },
    },
    {
      year: 2021,
      month: 11,
      day: 11,
      category: 'fashion',
      title: 'A crystal-strewn David Koma mini dress for Late Night with Seth Meyers',
      snippet:
        'An off-the-shoulder David Koma mini dress worked in the designer\'s signature crystal embellishment, paired with Aquazzura "Love Link" crystal slingbacks for a same-week Red (TV) promo stop on Seth Meyers\' show.',
      sourceUrl: 'https://www.redcarpet-fashionawards.com/2021/11/12/taylor-swift-wore-zuhair-murad-david-koma-on-jimmy-fallon-seth-meyers/',
      thumbnailUrl:
        'https://www.redcarpet-fashionawards.com/wp-content/uploads/2021/11/latenightseth-254951110_1087887028417877_8037280291044973019_n.jpg',
      moment: {
        context:
          'For her Late Night with Seth Meyers stop the same week she released Red (Taylor\'s Version), Swift changed into an off-the-shoulder David Koma mini dress covered in the designer\'s signature structured crystal embellishment, worn with Aquazzura "Love Link" crystal-embellished slingback pumps.\n\nIt was a different David Koma piece from the navy sequin dress she\'d wear days later in her "Three Sad Virgins" SNL sketch cameo — the same designer twice in one promo week, both covered by Red Carpet Fashion Awards\' roundup of the album\'s late-night circuit.',
        sources: [
          {
            outlet: 'Red Carpet Fashion Awards',
            url: 'https://www.redcarpet-fashionawards.com/2021/11/12/taylor-swift-wore-zuhair-murad-david-koma-on-jimmy-fallon-seth-meyers/',
          },
        ],
        photos: [
          {
            url: 'https://www.redcarpet-fashionawards.com/wp-content/uploads/2021/11/latenightseth-254951110_1087887028417877_8037280291044973019_n.jpg',
            credit: 'NBC',
          },
        ],
      },
    },
    {
      year: 2021,
      month: 11,
      day: 13,
      category: 'fashion',
      title: 'A David Koma sequin mini dress for her surprise "Three Sad Virgins" SNL cameo',
      snippet:
        'A navy one-shoulder sequined David Koma mini dress, worn for her surprise sung cameo in the "Please Don\'t Destroy" trio\'s viral "Three Sad Virgins" sketch on the same November 13, 2021 SNL episode as her "All Too Well" performance.',
      sourceUrl: 'https://www.nbc.com/nbc-insider/three-sad-virgins-snl-taylor-swift-cast-lyrics',
      // Image-fix pass (2026-07-10): ticket #195 — old Steal Her Style URL
      // was a watermarked, 500x350 two-panel collage (sketch still + a
      // separate product shot). Swapped to the official SNL sketch still
      // (verified HTTP 200 + image/jpeg).
      thumbnailUrl: 'https://i.ytimg.com/vi/21Ki96Lsxhc/hqdefault.jpg',
      moment: {
        context:
          'On the same episode where she performed "All Too Well (10 Minute Version)," Swift also made a surprise appearance in "Please Don\'t Destroy" — the SNL writing trio of John Higgins, Ben Marshall and Martin Herlihy\'s musical sketch "Three Sad Virgins," starring Pete Davidson.\n\nPer the writers, they doubted she\'d agree to do it, but she said yes immediately when asked; she appears at the sketch\'s bridge, in a navy one-shoulder sequined David Koma mini dress, singing comedic insults about the trio. The sketch went on to rack up tens of millions of YouTube views.',
        sources: [
          {
            outlet: 'NBC Insider',
            url: 'https://www.nbc.com/nbc-insider/three-sad-virgins-snl-taylor-swift-cast-lyrics',
          },
          {
            outlet: 'Steal Her Style',
            url: 'https://stealherstyle.net/2021/11/14/taylor-swift-saturday-night-live-outfits/',
          },
        ],
        // Image-fix pass (2026-07-10): ticket #195 — old Steal Her Style URL
        // was a watermarked ("Steal Her Style" logo), 500x350 two-panel
        // collage (sketch still + a separate product shot of the dress).
        // Replaced with the official NBC Saturday Night Live YouTube still,
        // id verified via oEmbed (title: "Please Don't Destroy - Three Sad
        // Virgins (ft. Taylor Swift) - SNL", channel: Saturday Night Live).
        // URL verified HTTP 200 + image/jpeg; visually confirmed Swift
        // alongside Pete Davidson in the sketch (the sequin dress is only
        // partly visible at this camera angle, but the subject/event/date
        // are correct and the image is a single unwatermarked frame).
        photos: [
          {
            url: 'https://i.ytimg.com/vi/21Ki96Lsxhc/hqdefault.jpg',
            credit: 'NBC / Saturday Night Live (YouTube sketch still)',
            caption: 'Swift with Pete Davidson in the "Three Sad Virgins" sketch, SNL, Nov. 13, 2021.',
            kind: 'archival',
          },
        ],
      },
    },

    // --- Sightings pass (2026-07-05): first candid-sighting items for this era.
    {
      year: 2021,
      month: 9,
      day: 9,
      category: 'sighting',
      title: 'A Belfast weekend: a restaurant selfie, then a three-hour bar set',
      snippet:
        "While Joe Alwyn wrapped filming in Belfast, she turned up at Shu Restaurant for staff selfies one night, then stayed for a local busker's entire three-hour set at The Tipsy Bird the next.",
      sourceUrl: 'https://www.rte.ie/entertainment/2021/0913/1246573-taylor-swift-thrills-fans-at-a-belfast-bar/',
      thumbnailUrl: 'https://www.rte.ie/images/001825a9-500.jpg',
      moment: {
        context:
          'Swift was in Belfast to support Joe Alwyn as he finished filming the BBC/Hulu adaptation of Sally Rooney\'s "Conversations with Friends." On Thursday, September 9, 2021, she dined at Shu Restaurant on the Lisburn Road and posed for selfies with staff, who posted that she "was so lovely and really is a beautiful person inside and out."\n\nThe next night, Friday September 10, she turned up at The Tipsy Bird cocktail bar in the city centre and stayed for musician Tiernán Heffron\'s full three-hour set, joining a singalong and tipping him afterward; Heffron said, "It\'s not everyday Taylor Swift walks into your gig and stays for your whole three hour set. She was the most lovely person!" The bar confirmed her visit and posed for a photo with its team.',
        sources: [
          { outlet: 'RTÉ', url: 'https://www.rte.ie/entertainment/2021/0913/1246573-taylor-swift-thrills-fans-at-a-belfast-bar/' },
          { outlet: 'Irish News', url: 'https://www.irishnews.com/magazine/entertainment/2021/09/13/news/taylor-swift-thrills-fans-at-a-belfast-bar-2447182/' },
          { outlet: 'NME', url: 'https://www.nme.com/news/music/taylor-swift-watches-young-singer-songwriters-set-at-belfast-bar-3045454' },
        ],
        photos: [
          {
            url: 'https://www.rte.ie/images/001825a9-500.jpg',
            credit: 'The Tipsy Bird via Facebook',
          },
        ],
      },
    },
    {
      year: 2022,
      month: 7,
      day: 21,
      category: 'sighting',
      title: "A surprise cameo at HAIM's sold-out O2 Arena show",
      snippet:
        'Fans spotted her walk out mid-set for a "Gasoline"/"Love Story" mashup with her old 1989 tourmates — a rare return to a concert stage.',
      sourceUrl: 'https://www.rollingstone.com/music/music-news/taylor-swift-haim-love-story-gasoline-mashup-o2-arena-1386538/',
      // Image-fix pass (2026-07-10): ticket #201 — old CloudFront URL was a
      // two-panel news-header composite (HAIM selfie + separate Taylor shot,
      // visible seam). Swapped to a single fan-recorded still of the actual
      // performance (verified HTTP 200 + image/jpeg; visually confirmed
      // Swift singing with a HAIM sister, matching date/venue/outfit).
      thumbnailUrl: 'https://i.ytimg.com/vi/3TrVA4kYTrQ/hqdefault.jpg',
      moment: {
        context:
          'At HAIM\'s sold-out show at London\'s O2 Arena on July 21, 2022 — their last UK date before heading to US tour dates — Swift walked out mid-set, telling the crowd of roughly 20,000: "I heard that my girls were playing in London at the O2 and I thought, \'I\'m gonna have to see that.\' And it looks like there\'s about 20,000 other people that also thought that, too."\n\nShe joined the sisters, who opened for her 1989 World Tour in 2015, for a mashup of their collaboration "Gasoline" with her own "Love Story," wearing a black sports bra and the same custom Louis Vuitton trousers HAIM had worn throughout their tour. She added: "I haven\'t been on stage in a very long time. It\'s nice…it\'s nice, it\'s very nice [to be back]."',
        sources: [
          { outlet: 'Rolling Stone', url: 'https://www.rollingstone.com/music/music-news/taylor-swift-haim-love-story-gasoline-mashup-o2-arena-1386538/' },
          { outlet: 'E! Online', url: 'https://www.eonline.com/news/1339032/taylor-swift-joins-haim-for-a-surprise-performance-and-its-the-love-story-we-always-needed' },
        ],
        // Image-fix pass (2026-07-10): ticket #201 — old CloudFront URL was a
        // two-panel composite (HAIM backstage selfie without Taylor + a
        // separate fan shot, visible seam). Replaced with a single frame from
        // fan concert footage of the actual "Gasoline"/"Love Story" mashup,
        // id verified via YouTube oEmbed (title: "Taylor Swift & HAIM
        // performing Gasoline/Love Story Mashup - Live at O2 Arena in
        // London"). URL verified HTTP 200 + image/jpeg; visually confirmed
        // Swift in black crop top/leather pants singing with a HAIM sister.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/3TrVA4kYTrQ/hqdefault.jpg',
            credit: 'stolenmidnights / YouTube (concert footage still)',
            caption: 'Swift performing "Gasoline"/"Love Story" with HAIM at London\'s O2 Arena, July 21, 2022.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2022,
      month: 7,
      day: 14,
      category: 'sighting',
      title: 'A paparazzi-caught coffee stroll through a London park with Joe Alwyn',
      snippet:
        'Caught mid-heatwave in baseball caps, sunglasses and iced coffees, holding hands and talking — a rare candid, unposed sighting of the notoriously private couple out together.',
      sourceUrl: 'https://hollywoodlife.com/2022/07/14/taylor-swift-joe-alwyn-holding-hands-london-denim-shorts-photos/',
      thumbnailUrl: 'https://hollywoodlife.com/wp-content/uploads/2022/07/taylor-swift-joe-alwyn-london-coffee-date-embed2.jpg',
      moment: {
        context:
          'On July 14, 2022, during a London heatwave with temperatures near 90 degrees, paparazzi photographed Swift and Alwyn holding hands and talking over iced coffees in a park.\n\nShe wore dark denim shorts, sunglasses and a white baseball cap; he wore blue shorts, a white t-shirt, sneakers and a blue cap. E! Online reported the photos were credited to Backgrid.',
        sources: [
          { outlet: 'E! Online', url: 'https://www.eonline.com/news/1338054/taylor-swift-and-joe-alwyn-enjoy-cute-coffee-date-while-out-in-london' },
          { outlet: 'HollywoodLife', url: 'https://hollywoodlife.com/2022/07/14/taylor-swift-joe-alwyn-holding-hands-london-denim-shorts-photos/' },
        ],
        photos: [
          {
            url: 'https://hollywoodlife.com/wp-content/uploads/2022/07/taylor-swift-joe-alwyn-london-coffee-date-embed2.jpg',
            credit: 'Backgrid',
          },
        ],
      },
    },
    {
      year: 2022,
      month: 8,
      day: 28,
      category: 'sighting',
      title: 'Spotted leaving the VMAs in a Midnights-teasing star romper',
      snippet:
        "Straight from the ceremony where she announced her next album, she was photographed arriving at the after-party in a Moschino romper embroidered with silver stars — a color and motif nodding to Midnights.",
      sourceUrl: 'https://www.nylon.com/fashion/taylor-swift-2022-mtv-vmas-after-party-outfit',
      thumbnailUrl:
        'https://imgix.bustle.com/uploads/getty/2022/8/29/c270e9b7-cdb5-445c-ba9b-07504db79dc8-getty-1418938506.jpg?w=653&h=980&fit=crop&crop=faces&dpr=2',
      moment: {
        context:
          'Hours after revealing her tenth studio album, Midnights, during her Video of the Year acceptance speech at the 2022 MTV VMAs, Swift was photographed arriving at Republic Records\' post-show party at the Fleur Room in New York City on August 28, 2022.\n\nShe wore a royal blue silk mini romper by Moschino embroidered with glittery stars — which Nylon described as "channeling \'midnight\'" — paired with a fuzzy jacket, platform sparkly sandals from Alexander McQueen, ANANYA jewelry, and her signature red lip.',
        sources: [
          { outlet: 'Nylon', url: 'https://www.nylon.com/fashion/taylor-swift-2022-mtv-vmas-after-party-outfit' },
          { outlet: 'Billboard', url: 'https://www.billboard.com/music/music-news/taylor-swift-2022-mtv-vmas-afterparty-outfit-midnights-1235132508/' },
        ],
        photos: [
          {
            url: 'https://imgix.bustle.com/uploads/getty/2022/8/29/c270e9b7-cdb5-445c-ba9b-07504db79dc8-getty-1418938506.jpg?w=653&h=980&fit=crop&crop=faces&dpr=2',
            credit: 'Getty Images',
          },
        ],
      },
    },

    // --- Music/business/sightings depth pass (2026-07-05)
    {
      year: 2020,
      month: 12,
      day: 11,
      category: 'music',
      title: "cowboy like me, cut at Marcus Mumford's home studio",
      snippet:
        'Swift recorded this late-album duet during the pandemic at Marcus Mumford\'s home studio in Devon, where he called her "the most phenomenal houseguest" before she asked him to sing on it: "I chose Cowboy Like Me. Man, I love that song."',
      sourceUrl: 'https://www.billboard.com/music/music-news/marcus-mumford-taylor-swift-phenomenal-houseguest-studio-1236112442/',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Marcus_Mumford_at_Newport_Folk_Festival_2018_by_Sachyn_Mital.jpg/1280px-Marcus_Mumford_at_Newport_Folk_Festival_2018_by_Sachyn_Mital.jpg',
      moment: {
        context:
          'Swift finished much of evermore\'s second half at Scarlet Pimpernel, the home studio of Mumford & Sons\' Marcus Mumford in Devon, England, working there with producer Aaron Dessner. On the Table Manners podcast, Mumford recalled Dessner asking to borrow his studio for an artist he was producing — Mumford joked, "Beyoncé or something?" — before learning it was Swift, who arrived "right at the end of COVID." He called her "the most phenomenal houseguest," joking that he "burned a lot of vegetables for her" and that "her candle game was excellent."\n\nIn a separate interview with The Sunday Times, Mumford said: "Taylor came to my studio, played me some music and asked if I wanted to sing on anything. I chose Cowboy Like Me. Man, I love that song." Asked whether she arrived with heavy security, he said: "Ha, no, none of that. She stayed over and was a great house guest. Straightforward, easy-going. She ate my cauliflower salad."\n\nJustin Vernon also played drums on the track, and Josh Kaufman added lap steel, harmonica and mandolin.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/marcus-mumford-taylor-swift-phenomenal-houseguest-studio-1236112442/',
          },
          {
            outlet: 'Yahoo News UK (The Sunday Times)',
            url: 'https://uk.news.yahoo.com/taylor-swift-stayed-over-marcus-013726926.html',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Cowboy_like_Me' },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Marcus_Mumford_at_Newport_Folk_Festival_2018_by_Sachyn_Mital.jpg/1280px-Marcus_Mumford_at_Newport_Folk_Festival_2018_by_Sachyn_Mital.jpg',
            credit: 'Sachyn Mital via Wikimedia Commons',
            // Focal point set by viewing: his sunglassed face sits upper-left
            // of center, above the mic and guitar neck.
            focalPoint: '43% 22%',
          },
          // Photo pass #762 (2026-07-18): still from the official "cowboy like
          // me" lyric video — the song this page is about. oEmbed-verified the
          // video (YPlNBb6I8qU) belongs to the official @TaylorSwift channel;
          // i.ytimg.com is YouTube's own CDN; curl 200 image/jpeg 1280x720,
          // downloaded and vision-confirmed.
          {
            url: 'https://i.ytimg.com/vi/YPlNBb6I8qU/maxresdefault.jpg',
            credit: 'Still from the official "cowboy like me" lyric video, Republic Records, via YouTube',
            caption: 'The dim gambling-parlor set of the official "cowboy like me" lyric video — leather chesterfields, old books and low lamplight.',
            kind: 'archival',
            // Focal point set by viewing: the title sits centered over the
            // couch backs, the lit shelves just above the midline.
            focalPoint: '50% 45%',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 12,
      day: 11,
      category: 'music',
      title: "the evermore title track's bridge, written after the fact by Bon Iver's Justin Vernon",
      snippet:
        'Aaron Dessner: "Taylor wrote \'Evermore\' with William Bowery, and then we sent it to Justin, who wrote the bridge, and all of a sudden, that\'s when it started to become clear that there was a sister record."',
      sourceUrl: 'https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/',
      thumbnailUrl: 'https://i.ytimg.com/vi/EXLgZZE072g/hqdefault.jpg',
      moment: {
        context:
          'In a Rolling Stone interview, producer Aaron Dessner described writing the closing title track: "At some point, Taylor wrote \'Evermore\' with William Bowery [Joe Alwyn\'s songwriting pseudonym], and then we sent it to Justin, who wrote the bridge, and all of a sudden, that\'s when it started to become clear that there was a sister record" to folklore. Dessner said the run of collaboration felt like "weird alchemy," arriving after "seven or eight or nine" songs written in quick succession.\n\nPer Wikipedia, the piano ballad progresses into a dramatic bridge with a tempo shift, where Swift is joined midway by Vernon\'s multitracked falsetto in a call-and-response. Swift has said the lyrics were shaped by 2016 — a year she described as one where "all those times were just taking it day by day to get through" — along with the uncertainty of the 2020 U.S. election.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Evermore_(Taylor_Swift_song)' },
        ],
        // Real-photo pass (2026-07-09): official lyric video still, id verified
        // via YouTube oEmbed (title + @TaylorSwift channel). URL verified
        // HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/EXLgZZE072g/hqdefault.jpg',
            credit: 'Republic Records / YouTube (official lyric video still)',
            caption: 'Still from the official "evermore" lyric video, featuring Bon Iver, via the video\'s YouTube thumbnail.',
            kind: 'archival',
            // Focal point set by viewing: the frosted branch fills the center
            // of the frame — this one genuinely reads best centered.
            focalPoint: '50% 50%',
          },
          // Photo pass #762 (2026-07-18): Justin Vernon fronting Bon Iver — the
          // voice and writer of the bridge this page is about (era context; a
          // November 2011 live shot). Commons license API-verified CC BY 2.0
          // (danieljordahl); curl 200 image/jpeg 1024x680, downloaded and
          // vision-confirmed.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Bon_Iver_2011.jpg',
            credit: 'danieljordahl, Wikimedia Commons (CC BY 2.0) — Justin Vernon performing with Bon Iver, November 2011',
            caption: "Justin Vernon on stage with Bon Iver — the multitracked falsetto that answers her in the title track's bridge, written after the song was sent to him.",
            kind: 'archival',
            // Focal point set by viewing: Vernon stands at the mic left of
            // center, face in the upper third of the frame.
            focalPoint: '38% 33%',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 12,
      day: 11,
      category: 'music',
      title: "tolerate it, the 10/8 track Dessner almost didn't send her",
      snippet:
        'Aaron Dessner: "This song is intense. It\'s in 10/8, which is an odd time signature... maybe I shouldn\'t send it to her." He sent it anyway — and: "I think I cried when I first heard it."',
      sourceUrl: 'https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/',
      thumbnailUrl: 'https://i.ytimg.com/vi/ukxEKY_7MOc/hqdefault.jpg',
      moment: {
        context:
          'In the same Rolling Stone interview, Dessner recalled writing the piano instrumental for "tolerate it": "I remember when I wrote the piano track to \'Tolerate It,\' right before I sent it to her, I thought, This song is intense. It\'s in 10/8, which is an odd time signature. And I did think for a second, \'Maybe I shouldn\'t send it to her, she won\'t be into it.\' But I sent it to her, and it conjured a scene in her mind, and she wrote this crushingly beautiful song to it and sent it back. I think I cried when I first heard it."\n\nPer Wikipedia, Swift has said the song explores "ambivalent toleration" in a relationship, drawing on Daphne du Maurier\'s 1938 novel Rebecca, in which a young woman is undervalued by an older, emotionally distant husband.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Tolerate_It' },
        ],
        // Real-photo pass (2026-07-09): official lyric video still, id verified
        // via YouTube oEmbed (title + @TaylorSwift channel). URL verified
        // HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/ukxEKY_7MOc/hqdefault.jpg',
            credit: 'Republic Records / YouTube (official lyric video still)',
            caption: 'Still from the official "tolerate it" lyric video, via the video\'s YouTube thumbnail.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2021,
      month: 11,
      day: 27,
      category: 'business',
      title: "Red (Taylor's Version) sets a new Hot 100 record: 26 debuts in a single week",
      snippet:
        "Every re-recorded and vault track hit the Hot 100 at once — Billboard: \"the 26 arrivals set a new record for the most single-week debuts by an artist in the Hot 100's history.\"",
      sourceUrl: 'https://www.billboard.com/music/chart-beat/taylor-swift-26-songs-hot-100-red-taylors-version-1235001484/',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/4/47/Taylor_Swift_-_Red_%28Taylor%27s_Version%29.png',
      moment: {
        context:
          'In the week ending Nov. 27, 2021, 26 tracks from Red (Taylor\'s Version) debuted on the Hot 100 simultaneously. Billboard: "Notably, with all the songs above new to the survey, the 26 arrivals set a new record for the most single-week debuts by an artist in the Hot 100\'s history."\n\nThe same week, Swift also extended her own record for the most simultaneously charted Hot 100 entries among women — a mark Summer Walker had tied just a week earlier. At the time, only Drake — with 27 total titles charted after Scorpion\'s 2018 release — had ever had more entries from one act on a single week\'s survey; Morgan Wallen has since surpassed both marks, with 36 songs in 2023 and 37 in 2025.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-26-songs-hot-100-red-taylors-version-1235001484/',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Red_(Taylor%27s_Version)' },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/morgan-wallen-record-breaking-songs-hot-100-simultaneously-1235981641/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/4/47/Taylor_Swift_-_Red_%28Taylor%27s_Version%29.png',
            credit: 'Republic Records',
            // Focal point set by viewing: her face sits left of center under
            // the burgundy cap, ringed hand raised to the right.
            focalPoint: '42% 46%',
          },
          // Photo pass #762 (2026-07-18): still from the official "I Bet You
          // Think About Me" video, released Nov. 15, 2021 — inside the very
          // chart week this page covers; it's one of the 26 debuting tracks.
          // oEmbed-verified the video (5UMCrq-bBCg) belongs to the official
          // @TaylorSwift channel; i.ytimg.com is YouTube's own CDN; curl 200
          // image/jpeg 1280x720, downloaded and vision-confirmed.
          {
            url: 'https://i.ytimg.com/vi/5UMCrq-bBCg/maxresdefault.jpg',
            credit: 'Still from the official "I Bet You Think About Me (Taylor\'s Version)" music video (dir. Blake Lively), Republic Records, via YouTube',
            caption: 'Wedding-crashing in red in the Blake Lively–directed "I Bet You Think About Me" video — one of the 26 tracks that hit the Hot 100 in a single week.',
            kind: 'archival',
            // Focal point set by viewing: she stands center-frame in the red
            // gown with guitar, face just above the midline, chandelier above.
            focalPoint: '50% 42%',
          },
        ],
      },
    },
    {
      year: 2022,
      month: 9,
      day: 20,
      category: 'business',
      title: 'Nashville Songwriters name her Songwriter-Artist of the Decade — and she debuts her "pen" framework',
      snippet:
        'Accepting NSAI\'s Songwriter-Artist of the Decade award, Swift publicly explained her three lyric-writing styles for the first time: "Quill," "Fountain Pen" and "Glitter Gel Pen."',
      sourceUrl: 'https://www.billboard.com/music/country/taylor-swift-nashville-songwriter-awards-full-speech-1235142144/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2022/09/taylor-swift-performs-nsai-nashville-songwriter-awards-2022-billboard-1548.png?w=1024',
      moment: {
        context:
          'At the 5th annual Nashville Songwriter Awards at the Ryman Auditorium on September 20, 2022, the Nashville Songwriters Association International named Swift its Songwriter-Artist of the Decade. Accepting the honor, she said: "This award celebrates my family and my co-writers and my team. My friends and my fiercest fans and my harshest detractors and everyone who entered my life or left it."\n\nShe also revealed, publicly for the first time, a framework she uses to sort her own lyrics: "Quill" lyrics lean on antiquated, literary language (she cited "ivy"); "Fountain Pen" lyrics — "most of my lyrics fall into this category" — pair a modern storyline with "a poetic twist" (she cited "All Too Well"); and "Glitter Gel Pen" lyrics are "frivolous, carefree, bouncy, syncopated perfectly to the beat" (she cited "Shake It Off"). She admitted she\'d "never talked about this publicly before, because, well, it\'s dorky."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/country/taylor-swift-nashville-songwriter-awards-full-speech-1235142144/',
          },
          {
            outlet: 'WSMV',
            url: 'https://www.wsmv.com/2022/09/20/taylor-swift-receives-songwriter-artist-decade/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2022/09/taylor-swift-performs-nsai-nashville-songwriter-awards-2022-billboard-1548.png?w=1024',
            credit: 'Terry Wyatt/Getty Images',
          },
        ],
      },
    },
    {
      year: 2022,
      month: 5,
      day: 18,
      category: 'sighting',
      title: "An honorary NYU doctorate, and a graduation-cap 'first'",
      snippet:
        'She wore a cap and gown "for the very first time," per her own Instagram caption, to receive an honorary Doctor of Fine Arts from NYU and deliver its 2022 commencement address at Yankee Stadium.',
      sourceUrl: 'https://www.cbsnews.com/news/taylor-swift-nyu-honorary-degree-commencement-address-2022/',
      thumbnailUrl:
        'https://assets1.cbsnewsstatic.com/hub/i/r/2022/05/18/066b689c-0e18-49aa-966a-7f08eeddd78d/thumbnail/1200x630/333d073afd2d380fa574745fdb2e40e7/gettyimages-1240747838-1.jpg',
      moment: {
        context:
          'On May 18, 2022, Swift received an honorary Doctor of Fine Arts from New York University and delivered the commencement address to its graduating class at Yankee Stadium, captioning an Instagram post ahead of the ceremony: "Wearing a cap and gown for the very first time."\n\nIn her speech she joked, "I\'m 90% sure the main reason I\'m here is because I have a song called \'22,\'" and told graduates she "never got to have the normal college experience" because she was homeschooled while touring. She described writing as her constant: "Everything I do is just an extension of my writing, whether it\'s directing videos or a short film." Her closing advice: "Never be ashamed of trying. Effortlessness is a myth," and "my mistakes led to the best things in my life."',
        sources: [
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-nyu-honorary-degree-commencement-address-2022/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-nyu-commencement-speech-full-transcript-1235072824/',
          },
        ],
        photos: [
          {
            url: 'https://assets1.cbsnewsstatic.com/hub/i/r/2022/05/18/066b689c-0e18-49aa-966a-7f08eeddd78d/thumbnail/1200x630/333d073afd2d380fa574745fdb2e40e7/gettyimages-1240747838-1.jpg',
            credit: 'Getty Images',
          },
        ],
      },
    },
    {
      year: 2022,
      month: 6,
      day: 11,
      category: 'sighting',
      title: "A Tribeca Q&A ends in a surprise \"All Too Well\" singalong, Blake Lively and Ryan Reynolds in the crowd",
      snippet:
        'At the Beacon Theatre for a live conversation about her short film, Swift revealed easter eggs, talked directing ambitions, and broke into an unplanned performance of the 10-minute song — with Lively and Reynolds singing along from the audience.',
      sourceUrl: 'https://variety.com/2022/film/news/taylor-swift-all-too-well-tribeca-festival-1235291648/',
      // Image-fix pass (2026-07-10): ticket #213 — old Variety URL was a
      // recycled Nov 2021 "All Too Well" premiere file photo (same Etro suit
      // and step-and-repeat used elsewhere in this era), not this June 2022
      // event. Swapped to a same-night arrival still outside the Beacon
      // Theatre (verified HTTP 200 + image/jpeg; visually confirmed).
      thumbnailUrl: 'https://i.ytimg.com/vi/_ptL-dwudyw/hqdefault.jpg',
      moment: {
        context:
          'On June 11, 2022, Swift appeared at the Tribeca Festival\'s Beacon Theatre for "A Conversation with Taylor Swift," screening her self-written-and-directed "All Too Well" short film and discussing its making with filmmaker Mike Mills.\n\nPer Variety: "the notoriously private pop star also revealed easter eggs in the short film, discussed her ambitions to direct a movie and treated fans to a surprise performance of \'All Too Well.\' Seated near the stage, Blake Lively and Ryan Reynolds were among the many in the crowd who enthusiastically sung along, clapped and took videos of Swift throughout the lengthy track."',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2022/film/news/taylor-swift-all-too-well-tribeca-festival-1235291648/',
          },
        ],
        // Image-fix pass (2026-07-10): ticket #213 — old Variety URL was a
        // Nov 12, 2021 "All Too Well" premiere file photo (identical Etro
        // suit/backdrop to this era's premiere fashion item), not an actual
        // June 11, 2022 Tribeca photo. Replaced with a same-night arrival
        // still outside the Beacon Theatre, id verified via YouTube oEmbed
        // (title: "Taylor Swift Is Greeted By A Mob Of Adoring Fans At The
        // Beacon Theater For The Tribeca Film Festival", channel: The
        // Hollywood Fix). URL verified HTTP 200 + image/jpeg; visually
        // confirmed Swift arriving at the venue.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/_ptL-dwudyw/hqdefault.jpg',
            credit: 'The Hollywood Fix / YouTube (arrival footage still)',
            caption: 'Swift arriving at the Beacon Theatre for the Tribeca Festival "All Too Well" conversation, June 11, 2022.',
            kind: 'archival',
          },
        ],
      },
    },

    // --- Thin-era top-up (2026-07-08, audit rollout PR 2): the era's empty
    // release and relationship categories, filled with public record. Tour
    // stays genuinely empty — no touring happened between the pandemic and
    // the Eras Tour announcement (which falls in the Midnights era). New
    // items carry the audit's additive provenance fields.
    {
      slug: 'evermore-deluxe-bonus-tracks',
      year: 2021,
      month: 1,
      day: 7,
      category: 'release',
      title: 'The deluxe edition surfaces "right where you left me" — a narrator frozen in a restaurant',
      snippet:
        'evermore\'s two bonus tracks, "right where you left me" and "it\'s time to go," arrived digitally Jan. 7, 2021 with the deluxe edition — one about staying stuck at the table where it ended, the other about knowing when to leave.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Right_Where_You_Left_Me',
      thumbnailUrl: 'https://i.ytimg.com/vi/Ur_wAcYDnuA/hqdefault.jpg',
      moment: {
        context:
          'The pairing reads as a deliberate diptych — the girl who never left the restaurant versus the voice listing every time walking away was the right call: "right where you left me" traps its narrator mid-heartbreak in the booth where it ended, while "it\'s time to go" runs the ledger the other way, through an unhappy marriage, a toxic workplace, and a greedy adversary.\n\nFans and press immediately read that last scenario — "fifteen years, fifteen million tears, begging \'til my knees bled" — as the Big Machine masters dispute, the decision to walk rather than re-sign. Both tracks were written with Aaron Dessner and had shipped on physical editions before going wide digitally on Jan. 7, 2021.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Right_Where_You_Left_Me',
            source_title: 'Right Where You Left Me',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Evermore_(Taylor_Swift_album)',
            source_title: 'Evermore (Taylor Swift album)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/why-taylor-swift-fans-think-shes-calling-out-scooter-braun-on-evermore-bonus-track-158708',
            source_title: "Why Taylor Swift Fans Think She's Calling Out Scooter Braun on 'Evermore' Bonus Track",
            publisher: 'Entertainment Tonight',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 3,
          },
        ],
        // Real-photo pass (2026-07-09): official lyric video still, id verified
        // via YouTube oEmbed (title + @TaylorSwift channel). URL verified
        // HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/Ur_wAcYDnuA/hqdefault.jpg',
            credit: 'Republic Records / YouTube (official lyric video still)',
            caption:
              'Still from the official "right where you left me" lyric video, released with the deluxe edition, via the video\'s YouTube thumbnail.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'mr-perfectly-fine-from-the-vault',
      year: 2021,
      month: 4,
      day: 7,
      category: 'release',
      title: 'Mr. Perfectly Fine opens the vault',
      snippet:
        'The first From the Vault track ever released, out April 7, 2021 ahead of Fearless (Taylor\'s Version) — a 2008 castoff fans immediately read as a Joe Jonas song. Sophie Turner\'s Instagram verdict: "It\'s not NOT a bop."',
      sourceUrl: 'https://en.wikipedia.org/wiki/Mr._Perfectly_Fine',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/f/fa/Taylor_Swift_-_Mr._Perfectly_Fine.png',
      moment: {
        context:
          'Written solo when she was 18 and left off the original Fearless, it introduced the vault-track format that became the re-recording project\'s signature: finished songs from each album\'s original sessions, released as new. Produced with Jack Antonoff for the 2021 release, it debuted at No. 90 on the Hot 100 and climbed to No. 30, reaching No. 2 on Hot Country Songs — remarkable mileage for a thirteen-year-old castoff.\n\nThen there was the subplot: fans immediately read the song as a Joe Jonas post-mortem, and Turner — married to Jonas at the time — posted it to her Instagram story with the now-famous verdict, "It\'s not NOT a bop." Swift reposted her with a Game of Thrones bow, writing that she was "forever bending the knee" for the queen of the north.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Mr._Perfectly_Fine',
            source_title: 'Mr. Perfectly Fine',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/articles/columns/pop/9552800/taylor-swift-responds-sophie-turner-reaction-mr-perfectly-fine',
            source_title: "Taylor Swift Responds to Sophie Turner's 'Mr. Perfectly Fine' Reaction",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): single cover art from Wikipedia's stable
        // upload.wikimedia.org copy (exact filename from the article HTML).
        // URL verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/fa/Taylor_Swift_-_Mr._Perfectly_Fine.png',
            credit: 'Republic Records (single cover art)',
            caption: 'Cover artwork for "Mr. Perfectly Fine (Taylor\'s Version) (From the Vault)."',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'all-too-well-short-film-premiere',
      year: 2021,
      month: 11,
      day: 12,
      category: 'release',
      title: 'All Too Well: The Short Film premieres — she wrote it, she directed it',
      snippet:
        'Released Nov. 12, 2021 alongside Red (Taylor\'s Version): a 15-minute film starring Sadie Sink and Dylan O\'Brien, built on the 10-minute version of the song, premiered at a fan event in New York with Sink and O\'Brien on hand.',
      sourceUrl: 'https://en.wikipedia.org/wiki/All_Too_Well:_The_Short_Film',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/6/69/All_Too_Well_short_film_poster.jpg',
      moment: {
        context:
          'Her most ambitious directing work to date — shot on 35mm by cinematographer Rina Yang and chaptered like a short story, ending with Swift herself as the older writer reading from the book of it. Sadie Sink and Dylan O\'Brien carry the film as the couple; Swift has said she would not have gone ahead with making it had Sink turned the part down.\n\nIt went on to win the Grammy for Best Music Video — with Swift as the sole credited director — and gave the era its defining visual: the scarf, finally on screen. Its VMAs sweep the following summer — Video of the Year, plus an album announcement from the podium — is covered in this era\'s business items. (The premiere-night Etro pantsuit is covered separately in this era\'s fashion items.)',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/All_Too_Well:_The_Short_Film',
            source_title: 'All Too Well: The Short Film',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): the film's poster from Wikipedia's stable
        // upload.wikimedia.org copy (exact filename from the article HTML).
        // URL verified HTTP 200 + image/jpeg this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/6/69/All_Too_Well_short_film_poster.jpg',
            credit: 'Republic Records (film poster)',
            caption: 'Poster for All Too Well: The Short Film, starring Sadie Sink and Dylan O\'Brien.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'carolina-crawdads',
      year: 2022,
      month: 6,
      day: 24,
      category: 'release',
      title: 'Carolina: a one-take murder-ballad for the marsh',
      snippet:
        'Written alone for Where the Crawdads Sing and produced with Aaron Dessner using only instruments available before 1953, "Carolina" arrived June 24, 2022 — evermore\'s swampy ghost, one last time.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Carolina_(Taylor_Swift_song)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2c/Taylor_Swift_-_Carolina.png',
      moment: {
        context:
          'Swift revealed she had written it "alone in the middle of the night" about a year and a half before its release, keeping its existence secret; she and Aaron Dessner then, in her words, "meticulously worked on a sound that we felt would be authentic to the moment when this story takes place." The period constraint was strict — recorded in a single take, using only instruments that existed before 1953, fiddle and mandolin and acoustic guitar among them — keeping it deliberately spare and eerie.\n\nIt earned a Golden Globe nomination for Best Original Song and a Grammy nomination for Best Song Written for Visual Media, and made the Oscars\' Best Original Song shortlist — the folklore/evermore sound\'s formal goodbye before Midnights rebooted everything that October.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Carolina_(Taylor_Swift_song)',
            source_title: 'Carolina (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2022/music/news/taylor-swift-drops-carolina-track-released-where-crawdads-sing-movie-1235302333/',
            source_title: "Taylor Swift Treats 'Carolina' Like 'Folklore' in 'Where the Crawdads Sing' End Credits Theme",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): single cover art from Wikipedia's stable
        // upload.wikimedia.org copy (exact filename from the article HTML).
        // URL verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/2/2c/Taylor_Swift_-_Carolina.png',
            credit: 'Republic Records (single cover art)',
            caption: 'Cover artwork for "Carolina," from the Where the Crawdads Sing soundtrack.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'grammys-2021-joe-thank-you',
      year: 2021,
      month: 3,
      day: 14,
      category: 'relationship',
      title: '"Joe, who is the first person that I play every single song that I write"',
      snippet:
        'The Album of the Year speech doubled as the relationship\'s most public moment yet — thanking Joe by first name on the Grammy stage: "I had the best time writing songs with you in quarantine."',
      sourceUrl: 'https://www.grammy.com/news/taylor-swift-folklore-album-of-the-year-win-2021-grammys-acceptance-speech-video-joe-alwyn-collaborators-rewind/',
      thumbnailUrl: 'https://i.ytimg.com/vi/JPmvsG3iSF4/hqdefault.jpg',
      moment: {
        context:
          'Four months after the William Bowery reveal, the March 14, 2021 speech acknowledged the co-writing partnership out loud on live TV, by first name and in full: "Joe, who is the first person that I play every single song that I write... I had the best time writing songs with you in quarantine."\n\nThe win itself was history — folklore made her the first woman with three Album of the Year Grammys — but the thank-you is the part fans clipped and kept. It stayed the couple\'s most public exchange until the relationship ended two years later.',
        sources: [
          {
            outlet: 'Grammy.com',
            url: 'https://www.grammy.com/news/taylor-swift-folklore-album-of-the-year-win-2021-grammys-acceptance-speech-video-joe-alwyn-collaborators-rewind/',
            source_title: 'GRAMMY Rewind: Taylor Swift Thanks Joe Alwyn For Being Her Quarantine Co-Writer',
            publisher: 'The Recording Academy',
            source_type: 'official',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/taylor-swift-makes-history-with-2021-album-of-the-year-grammy-win-gives-shout-out-to-boyfriend-joe',
            source_title: 'Taylor Swift Makes History With 2021 Album of the Year GRAMMY Win, Gives Shout-Out to Boyfriend Joe Alwyn',
            publisher: 'Entertainment Tonight',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): still from the Recording Academy's own
        // GRAMMY Rewind upload of the speech, id verified via YouTube oEmbed
        // (title + GRAMMYS channel). URL verified HTTP 200 + image/jpeg;
        // thumbnail visually confirmed (Swift holding the AOTY Grammy).
        photos: [
          {
            url: 'https://i.ytimg.com/vi/JPmvsG3iSF4/hqdefault.jpg',
            credit: 'Recording Academy / YouTube (GRAMMY Rewind still)',
            caption:
              "Swift with the Album of the Year Grammy for folklore, from the Recording Academy's GRAMMY Rewind clip of the March 14, 2021 speech.",
            kind: 'archival',
            focalPoint: '57% 33%',
          },
        ],
      },
    },
    {
      slug: 'joe-alwyn-pound-coins',
      year: 2022,
      month: 4,
      day: 20,
      category: 'relationship',
      title: '"If I had a pound for every time I think I\'ve been told I\'ve been engaged…"',
      snippet:
        'Joe Alwyn finally addressed the constant engagement rumors in an April 2022 WSJ. Magazine interview: "…then I\'d have a lot of pound coins. The truth is, if the answer was yes, I wouldn\'t say, and if the answer was no, I wouldn\'t say."',
      sourceUrl: 'https://www.billboard.com/music/music-news/joe-alwyn-taylor-swift-engagement-rumors-response-1235061173/',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Joe_Alwyn_at_the_2022_TIFF_Premiere_of_Catherine_Called_Birdy_%2852358881656%29_%28cropped%29.jpg',
      moment: {
        context:
          'The line landed in a WSJ. Magazine profile published April 20, 2022, while he promoted Conversations with Friends, and the non-answer was the most he ever said publicly about the relationship\'s status: "The truth is, if the answer was yes, I wouldn\'t say, and if the answer was no, I wouldn\'t say."\n\nHe explained the reflex in the same interview: "We live in a culture that people expect so much to be given. So that if you\'re not posting all the time about what you\'re doing... does that make you a recluse?" It was consistent with the privacy pact the couple described in Miss Americana — and a line fans quoted for years afterward whenever the rumors resurfaced.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/joe-alwyn-taylor-swift-engagement-rumors-response-1235061173/',
            source_title: 'Joe Alwyn Is Finally Addressing Those Taylor Swift Engagement Rumors',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): freely licensed Commons photo of Alwyn;
        // license (CC BY-SA 2.0) verified on the file page. URL verified
        // HTTP 200 + image/jpeg this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Joe_Alwyn_at_the_2022_TIFF_Premiere_of_Catherine_Called_Birdy_%2852358881656%29_%28cropped%29.jpg',
            credit: 'GabboT (CC BY-SA 2.0) via Wikimedia Commons',
            caption:
              'Joe Alwyn at the Toronto International Film Festival, September 2022 — a few months after the WSJ. Magazine interview.',
            kind: 'archival',
            focalPoint: '50% 32%',
          },
        ],
      },
    },
    // --- Deep timeline fill (2026-07-08, content/deep-c): remaining evermore
    // song stories, the Taylor's Version release train that ran through this
    // era (announcements, drops, videos, one-off TV tracks), the era's odd
    // business wavetops (theme-park lawsuits, the BRITs first, the VMA-stage
    // Midnights handoff), and the fullest on-record relationship moment (the
    // GQ Hype co-writing interview). Tour stays genuinely empty — no touring
    // happened between the pandemic and the Eras Tour announcement (which
    // falls in the Midnights era). New items carry the audit's additive
    // provenance fields. (Thumbnails were originally null under the 2026-07-08
    // no-new-hotlinks policy; the 2026-07-09 T16 pass filled them in under the
    // relaxed image policy — see docs/decisions.md 2026-07-09.)
    {
      slug: 'gold-rush-daydream',
      year: 2020,
      month: 12,
      day: 11,
      category: 'music',
      title: 'gold rush, a jealousy fantasy that dismisses itself',
      snippet:
        'Produced with Jack Antonoff — pop shimmer amid the Dessner woodwork — its narrator falls for someone everyone falls for, spirals about her own ordinariness, then snaps out of the daydream and decides not to pursue it at all.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Evermore_(Taylor_Swift_album)',
      thumbnailUrl: 'https://i.ytimg.com/vi/Pz-f9mM3Ms8/hqdefault.jpg',
      moment: {
        context:
          'The whole song happens inside that single reverie — the fantasy assembles itself, curdles into insecurity, and gets shelved by the final chorus. It became a fan-favorite precisely for admitting the ugly-feeling side of wanting someone universally wanted.\n\nIt\'s a structural outlier too: the only track on evermore that Jack Antonoff co-wrote and produced, and critics heard the difference — Slate\'s track-by-track review called it "a subdued take on the spirit of 1989-style pop" that gave the album back some necessary energy.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Evermore_(Taylor_Swift_album)',
            source_title: 'Evermore (Taylor Swift album)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Slate',
            url: 'https://slate.com/culture/2020/12/taylor-swift-evermore-review-new-album-track-by-track.html',
            source_title: "Taylor Swift's Evermore review: Your track-by-track guide to the new album",
            publisher: 'Slate',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): official lyric video still, id verified
        // via YouTube oEmbed (title + @TaylorSwift channel). URL verified
        // HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/Pz-f9mM3Ms8/hqdefault.jpg',
            credit: 'Republic Records / YouTube (official lyric video still)',
            caption: 'Still from the official "gold rush" lyric video, via the video\'s YouTube thumbnail.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'tis-the-damn-season-overnight',
      year: 2020,
      month: 12,
      day: 11,
      category: 'music',
      title: "'tis the damn season, written overnight during the folklore film shoot",
      snippet:
        'Staying at Long Pond to film the folklore sessions, she stayed up late over wine on the first night, wrote the whole song, and sang it to Aaron Dessner the next day — Dorothea\'s hometown-holiday fling, done by breakfast.',
      sourceUrl: 'https://en.wikipedia.org/wiki/%27Tis_the_Damn_Season',
      thumbnailUrl: 'https://i.ytimg.com/vi/WuvhOD-mP8M/hqdefault.jpg',
      moment: {
        context:
          'The music was an existing Dessner instrumental he\'d never found a voice for — one he later ranked among his own career highlights: "one of my favorite things I\'ve ever made, even though it\'s an incredibly simple musical sketch."\n\nIts narrator is Dorothea — the same character whose namesake track sits later on the album — home for the holidays and weighing a "so much for auld lang syne" weekend with the one who stayed.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/%27Tis_the_Damn_Season',
            source_title: "'Tis the Damn Season",
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/aaron-dessner-interview-taylor-swift-evermore-1105853/',
            source_title: 'Aaron Dessner on the Making of Evermore',
            publisher: 'Rolling Stone',
            source_type: 'interview',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): official lyric video still, id verified
        // via YouTube oEmbed (title + @TaylorSwift channel). URL verified
        // HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/WuvhOD-mP8M/hqdefault.jpg',
            credit: 'Republic Records / YouTube (official lyric video still)',
            caption: 'Still from the official "\'tis the damn season" lyric video, via the video\'s YouTube thumbnail.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'happiness-week-before',
      year: 2020,
      month: 12,
      day: 11,
      category: 'music',
      title: 'happiness, the last song finished — days before the album dropped',
      snippet:
        'The final track written for evermore, completed just days before release: a divorce ballad insisting "there\'ll be happiness after you, but there was happiness because of you." Both true at once — that\'s the whole trick.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Happiness_(Taylor_Swift_song)',
      thumbnailUrl: 'https://i.ytimg.com/vi/tP4TTgt4nb0/hqdefault.jpg',
      moment: {
        context:
          'After the wedding fantasies and murder ballads, it\'s the record\'s most adult song: no villain, just two accurate memories of the same marriage refusing to cancel each other out. Aaron Dessner had composed the instrumental back in 2019; Swift added the words just days before the album was finished — the same last-minute tradition as folklore\'s "the 1" and "hoax."\n\nThe lyrics thread references to F. Scott Fitzgerald\'s The Great Gatsby through the wreckage, and critics singled the song out immediately — Stereogum\'s Tom Breihan called it "a masterful piece of recording and songwriting." It charted at No. 54 on the Hot 100 on album-week streams alone, without ever being a single.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Happiness_(Taylor_Swift_song)',
            source_title: 'Happiness (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): official lyric video still, id verified
        // via YouTube oEmbed (title + @TaylorSwift channel). URL verified
        // HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/tP4TTgt4nb0/hqdefault.jpg',
            credit: 'Republic Records / YouTube (official lyric video still)',
            caption: 'Still from the official "happiness" lyric video, via the video\'s YouTube thumbnail.',
            kind: 'archival',
            // Focal point set by viewing: rocky shoreline in the lower half,
            // sea and horizon above — reads best slightly above center.
            focalPoint: '50% 40%',
          },
          // Photo pass #762 (2026-07-18): Aaron Dessner — he composed the
          // instrumental back in 2019, and the words landed days before the
          // deadline (era context; a March 2016 live shot). Commons license
          // API-verified CC BY 2.0 (Bruce Baker); canonical 1920px render from
          // the Commons API; curl 200 image/jpeg 1920x1346, downloaded
          // full-res and vision-confirmed.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Aaron_Dessner_%28March_25%2C_2016%29.jpg/1920px-Aaron_Dessner_%28March_25%2C_2016%29.jpg',
            credit: 'Bruce Baker, Wikimedia Commons (CC BY 2.0) — Aaron Dessner performing, March 2016',
            caption: 'Aaron Dessner, who composed the "happiness" instrumental back in 2019 — Swift added the words just days before the album was finished.',
            kind: 'archival',
            // Focal point set by viewing: his face sits left of center in the
            // upper third, mic angled in from the right.
            focalPoint: '44% 28%',
          },
        ],
      },
    },
    {
      slug: 'love-story-tv-first-rerecording',
      year: 2021,
      month: 2,
      day: 11,
      category: 'release',
      title: "Love Story (Taylor's Version): the first re-recording arrives at midnight",
      snippet:
        'Announced on Good Morning America on Feb. 11, 2021 and out that night — the first finished piece of the re-recording project, 13 years after the original, sounding almost eerily identical on purpose.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor%27s_Version)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/d/d4/Taylor_Swift_-_Love_Story_%28Taylor%27s_Version%29.png',
      moment: {
        context:
          'The announcement letter set the template the whole project would follow: a full album (Fearless) coming, vault tracks from the original sessions — and stray capital letters hiding the release date in plain sight for fans to decode.\n\nFans had technically heard the new recording already, via a snippet in a Match.com ad the previous December. The finished single debuted at No. 1 on Hot Country Songs, making her only the second artist ever — after Dolly Parton — to top a Billboard chart with both the original and re-recorded versions of the same song.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor%27s_Version)',
            source_title: "Love Story (Taylor's Version)",
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Fearless_(Taylor%27s_Version)',
            source_title: "Fearless (Taylor's Version)",
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): single cover art from Wikipedia's stable
        // upload.wikimedia.org copy (exact filename from the article HTML).
        // URL verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/d/d4/Taylor_Swift_-_Love_Story_%28Taylor%27s_Version%29.png',
            credit: 'Republic Records (single cover art)',
            caption: 'Cover artwork for "Love Story (Taylor\'s Version)," the first re-recording released.',
            kind: 'primary',
            // Focal point set by viewing: she stands on the left in the white
            // gown, face in the upper-left quarter, arm extended right.
            focalPoint: '30% 25%',
          },
          // Photo pass #762 (2026-07-18): still from the official "Love Story
          // (Taylor's Version)" lyric video — built from vintage fan-club
          // footage; this frame is a 2008-era clip of her making heart hands.
          // oEmbed-verified the video (aXzVF3XeS8M) belongs to the official
          // @TaylorSwift channel; i.ytimg.com is YouTube's own CDN; curl 200
          // image/jpeg 1280x720, downloaded and vision-confirmed.
          {
            url: 'https://i.ytimg.com/vi/aXzVF3XeS8M/maxresdefault.jpg',
            credit: 'Still from the official "Love Story (Taylor\'s Version)" lyric video, Republic Records, via YouTube',
            caption: 'From the official lyric video, cut from vintage Fearless-era fan footage — "With love to all of my fans," heart hands and all, 13 years on.',
            kind: 'archival',
            // Focal point set by viewing: the framed archival clip sits left of
            // center, her face at the upper-left third.
            focalPoint: '29% 32%',
          },
        ],
      },
    },
    {
      slug: 'fearless-tv-release-day',
      year: 2021,
      month: 4,
      day: 9,
      category: 'release',
      title: "Fearless (Taylor's Version): 26 songs, six from the vault",
      snippet:
        'Out April 9, 2021: the original era re-cut top to bottom, plus six From the Vault songs — with Keith Urban and Maren Morris turning up on tracks that never made the 2008 album.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor%27s_Version)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5b/Fearless_%28Taylor%27s_Version%29_%282021_album_cover%29_by_Taylor_Swift.png',
      moment: {
        context:
          'She chased faithful-but-grown versions of songs she first sang at 18: the twenty re-recordings were produced with Christopher Rowe, and critics heard sharper instrumentation and a deeper, stronger voice — though some reviewers missed the teenage earnestness of the originals.\n\nThe six From the Vault cuts, produced with Jack Antonoff and Aaron Dessner, proved the project could generate new canon, not just replacements — "Mr. Perfectly Fine" chief among them (covered separately in this era), plus "You All Over Me" with Maren Morris and "That\'s When" with Keith Urban. The chart history it made is covered in this era\'s business items.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Fearless_(Taylor%27s_Version)',
            source_title: "Fearless (Taylor's Version)",
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): album cover art from Wikipedia's stable
        // upload.wikimedia.org copy — same file already used by this era's
        // Fearless TV cover-reveal fashion item. URL verified HTTP 200 + image/png.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/5/5b/Fearless_%28Taylor%27s_Version%29_%282021_album_cover%29_by_Taylor_Swift.png',
            credit: 'Republic Records / Beth Garrabrant (album cover)',
            caption: "Album artwork for Fearless (Taylor's Version), released April 9, 2021.",
            kind: 'primary',
            // Focal point set 2026-07-18 by viewing (300x300): sepia profile,
            // face upper-center-right with hair sweeping across the left.
            focalPoint: '56% 30%',
          },
          // Photo pass #762 (2026-07-18): title card from the official
          // "You All Over Me (From The Vault)" lyric video — one of the six
          // vault tracks this page is about. oEmbed-verified the video
          // (XKaMUm7YwZc) belongs to the official @TaylorSwift channel;
          // i.ytimg.com is YouTube's own CDN; curl 200 image/jpeg 1280x720,
          // downloaded and vision-confirmed.
          {
            url: 'https://i.ytimg.com/vi/XKaMUm7YwZc/maxresdefault.jpg',
            credit: 'Still from the official "You All Over Me (From The Vault)" lyric video, Republic Records, via YouTube',
            caption: 'The vault opens: the "You All Over Me" lyric video title card, featuring Maren Morris — proof the re-recordings could mint new canon, not just replacements.',
            kind: 'archival',
            // Focal point set by viewing: gravel-and-glitter title card with
            // the text just left of center, mid-frame.
            focalPoint: '50% 45%',
          },
        ],
      },
    },
    {
      slug: 'red-tv-announcement',
      year: 2021,
      month: 6,
      day: 18,
      category: 'release',
      title: 'Red (Taylor\'s Version) announced: "And hey, one of them is even ten minutes long"',
      snippet:
        'The June 18, 2021 announcement promised "all 30 songs that were meant to go on Red" — and slipped the fandom\'s white whale into a parenthetical: the 10-minute "All Too Well" was real, and it was coming.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor%27s_Version)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/4/47/Taylor_Swift_-_Red_%28Taylor%27s_Version%29.png',
      moment: {
        context:
          'Her note described the original Red as the album of "a fractured mosaic of feelings" — happiness and freedom sitting next to devastation and torment — and set the date at Nov. 19, which later jumped forward a week to Nov. 12, a near-unheard-of move.\n\nThe timing was no accident either: it came just two months after Fearless (Taylor\'s Version) proved the whole re-recording model with a 291,000-unit No. 1 week. The Janessa Leoné-hat cover reveal from the same day is covered in this era\'s fashion items.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Red_(Taylor%27s_Version)',
            source_title: "Red (Taylor's Version)",
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/articles/columns/pop/9589369/taylor-swift-red-taylors-version-november-release-date/',
            source_title: "Taylor Swift Announces 'Red (Taylor's Version),' Reveals November Release Date",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): album cover art from Wikipedia's stable
        // upload.wikimedia.org copy — same file already used by this era's
        // Red TV cover fashion item. URL verified HTTP 200 + image/png.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/4/47/Taylor_Swift_-_Red_%28Taylor%27s_Version%29.png',
            credit: 'Republic Records / Beth Garrabrant (album cover)',
            caption: "The Red (Taylor's Version) cover, revealed with the June 18, 2021 announcement.",
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'renegade-big-red-machine',
      year: 2021,
      month: 7,
      day: 2,
      category: 'release',
      title: 'Renegade: guesting on Big Red Machine, the Dessner–Vernon mothership',
      snippet:
        'Out July 2, 2021 — Swift fronting Aaron Dessner and Justin Vernon\'s own band on "How Long Do You Think It\'s Gonna Last?", repaying the folklore/evermore collaboration in kind.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Renegade_(Big_Red_Machine_song)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/c/ca/Big_Red_Machine_-_Renegade_%28ft._Taylor_Swift%29.png',
      moment: {
        context:
          'A rare Swift feature where she\'s the guest in someone else\'s house: an anxious, galloping track about loving someone who won\'t get out of their own way, written with Aaron Dessner and recorded across the project\'s home bases — Long Pond in the Hudson Valley, Kitty Committee in Los Angeles, and April Base in Eau Claire, Wisconsin.\n\nDessner\'s own account: "Taylor\'s words hit me so hard when I heard her first voice memo and still do, every time. Justin lifted the song further into the heavens." The single gave Big Red Machine their first-ever Hot 100 entry, peaking at No. 73 — and she appears twice on the album, since "Birch" carries her vocals too.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Renegade_(Big_Red_Machine_song)',
            source_title: 'Renegade (Big Red Machine song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): single cover art from Wikipedia's stable
        // upload.wikimedia.org copy (exact filename from the article HTML).
        // URL verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/c/ca/Big_Red_Machine_-_Renegade_%28ft._Taylor_Swift%29.png',
            credit: '37d03d / Jagjaguwar (single cover art)',
            caption: 'Cover artwork for Big Red Machine\'s "Renegade," featuring Taylor Swift.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'wildest-dreams-tv-tiktok',
      year: 2021,
      month: 9,
      day: 17,
      category: 'release',
      title: "Wildest Dreams (Taylor's Version), rushed out because TikTok wouldn't wait",
      snippet:
        'When a viral slow-zoom trend sent the original "Wildest Dreams" surging on TikTok, she surprise-dropped the re-recorded version on Sept. 17, 2021 — posting that if the song was trending, fans should have her version of it.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Wildest_Dreams_(Taylor_Swift_song)',
      thumbnailUrl: 'https://i.ytimg.com/vi/vtW_4j7SsZk/hqdefault.jpg',
      moment: {
        context:
          'It jumped the 1989 (Taylor\'s Version) queue entirely — the second standalone TV track after "Love Story" — and marked the first time the re-recording project visibly rerouted around a meme. Snippets had already surfaced in trailers for DreamWorks\' Spirit Untamed that spring, but it was TikTok\'s slow-zoom trend sending the original surging that pushed the full version out on Sept. 17, 2021.\n\nProduced with Shellback and Christopher Rowe — original co-producer Max Martin did not return — it pulled more than two million Spotify streams within four hours, beating the original\'s single-day record, and debuted at No. 37 on the Hot 100. The full album wouldn\'t follow for another two years.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Wildest_Dreams_(Taylor_Swift_song)',
            source_title: 'Wildest Dreams (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): official lyric video still, id verified
        // via YouTube oEmbed (title + @TaylorSwift channel). URL verified
        // HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/vtW_4j7SsZk/hqdefault.jpg',
            credit: 'Republic Records / YouTube (official lyric video still)',
            caption: 'Still from the official Wildest Dreams (Taylor\'s Version) lyric video, via the video\'s YouTube thumbnail.',
            kind: 'archival',
            // Focal point set 2026-07-18 by viewing (480x360): starry blue
            // dreamscape with the handwritten title dead center — genuinely
            // reads best centered; no face or subject to protect.
            focalPoint: '50% 50%',
          },
          // Photo pass #762 (2026-07-18): the single's own cover art — Swift
          // in sunglasses and a striped shirt — from Wikipedia's stable
          // upload.wikimedia.org copy (exact filename from the article HTML).
          // curl 200 image/png 300x300, downloaded and vision-confirmed.
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/ff/Wildest_Dreams_%28Taylor%27s_Version%29_-_Taylor_Swift.png',
            credit: 'Republic Records (single cover art)',
            caption: 'The Wildest Dreams (Taylor\'s Version) cover — the artwork that appeared when the re-record surprise-dropped mid-TikTok trend.',
            kind: 'primary',
            // Focal point set by viewing: face in sunglasses upper-center-
            // right, sunlit wall behind.
            focalPoint: '55% 28%',
          },
        ],
      },
    },
    {
      slug: 'i-bet-you-think-about-me-video',
      year: 2021,
      month: 11,
      day: 15,
      category: 'release',
      title: 'Blake Lively directs "I Bet You Think About Me" — wedding-cake carnage included',
      snippet:
        'The vault track got a Nov. 15, 2021 video directed by Blake Lively in her directing debut, with Miles Teller as the groom and Taylor as the red-dressed ghost of relationships past, cheerfully ruining a wedding.',
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Bet_You_Think_About_Me',
      thumbnailUrl: 'https://i.ytimg.com/vi/5UMCrq-bBCg/hqdefault.jpg',
      moment: {
        context:
          'Swift and Lively co-wrote the video\'s concept, and the song itself carries Chris Stapleton\'s harmonies — the twangiest thing in the entire vault.\n\nThe casting kept it in the family: Miles Teller\'s bride is played by his real-life wife, Keleigh Sperry, and Swift\'s own announcement framed the collaboration as overdue — "I finally got to work with the brilliant, brave, & wickedly funny @blakelively on her directorial debut. Join us as we raise a toast, and a little hell." It was the friends\' first official creative project together, years after Swift borrowed the names of Lively and Ryan Reynolds\' daughters for folklore\'s "betty."',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/I_Bet_You_Think_About_Me',
            source_title: 'I Bet You Think About Me',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-blake-lively-music-video-red-taylors-version-1235047645/',
            source_title: 'Taylor Swift Releases Music Video Directed by Blake Lively',
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): official music video still, id verified
        // via YouTube oEmbed (title + @TaylorSwift channel). URL verified
        // HTTP 200 + image/jpeg; thumbnail visually confirmed (Swift in the
        // red gown at the wedding reception).
        photos: [
          {
            url: 'https://i.ytimg.com/vi/5UMCrq-bBCg/hqdefault.jpg',
            credit: 'Republic Records / YouTube (official music video still)',
            caption:
              'Still from the Blake Lively-directed "I Bet You Think About Me" video — Swift as the red-dressed wedding crasher — via the video\'s YouTube thumbnail.',
            kind: 'archival',
            // Focal point set 2026-07-18 by viewing (480x360 letterboxed):
            // Swift center frame in the red gown with guitar, face just left
            // of center in the upper-mid frame, chandelier above.
            focalPoint: '48% 40%',
          },
          // Photo pass #762 (2026-07-18): Commons portrait of Blake Lively,
          // the video's director (era context; a TIFF red carpet, not the
          // video shoot). Commons license API-verified CC BY-SA 2.0 (Josh
          // Jensen, Sept. 2010); curl 200 image/jpeg 500x751, downloaded and
          // vision-confirmed (Lively in a red sequined dress, TIFF backdrop).
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Blake_Lively_%284994696823%29.jpg/500px-Blake_Lively_%284994696823%29.jpg',
            credit: 'Josh Jensen, Wikimedia Commons (CC BY-SA 2.0) — Blake Lively, 2010 (archival, era context; not the video shoot)',
            caption: 'Blake Lively — the friend Swift finally got to work with, in Lively\'s directorial debut.',
            kind: 'archival',
            // Focal point set by viewing: tall portrait, her face high in the
            // frame, dress filling the lower two-thirds.
            focalPoint: '50% 16%',
          },
        ],
      },
    },
    {
      slug: 'joker-and-the-queen-remix',
      year: 2022,
      month: 2,
      day: 11,
      category: 'release',
      title: 'The Joker and the Queen: an Ed Sheeran duet with a nine-year Easter egg',
      snippet:
        'Out Feb. 11, 2022 — her verse added to Sheeran\'s piano ballad, with a video that reunites the two kids from 2013\'s "Everything Has Changed" video, now teenagers, finding each other again at college.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Joker_and_the_Queen',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/1/17/Ed_Sheeran_-_The_Joker_and_the_Queen.png',
      moment: {
        context:
          'Their fourth collaboration — after "Everything Has Changed," "End Game," and the vault duet "Run" — and the most sentimental: the video brings back Ava Ames and Jack Lewis, the child actors from the 2013 "Everything Has Changed" video, now teenagers finding each other again at college.\n\nThe Easter eggs run deeper than the casting: the text-message exchange shown in the video is a real one between Sheeran and Swift that she had shared publicly back in 2015, and a framed photo from the original video sits in frame. It landed in the era\'s quietest stretch, a reminder the two write to each other\'s timelines, not the industry\'s.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/The_Joker_and_the_Queen',
            source_title: 'The Joker and the Queen',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): single cover art from Wikipedia's stable
        // upload.wikimedia.org copy (exact filename from the article HTML).
        // URL verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/1/17/Ed_Sheeran_-_The_Joker_and_the_Queen.png',
            credit: 'Asylum / Atlantic Records (single cover art)',
            caption: 'Cover artwork for Ed Sheeran\'s "The Joker and the Queen," featuring Taylor Swift.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'this-love-tv-summer-i-turned-pretty',
      year: 2022,
      month: 5,
      day: 6,
      category: 'release',
      title: "This Love (Taylor's Version) arrives early, care of a TV trailer",
      snippet:
        'The second 1989 re-recording (after "Wildest Dreams (Taylor\'s Version)"), released May 6, 2022 after soundtracking the trailer for Amazon\'s The Summer I Turned Pretty — whose author-showrunner Jenny Han made Swift songs the show\'s sonic signature.',
      sourceUrl: 'https://en.wikipedia.org/wiki/This_Love_(Taylor_Swift_song)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/b/be/This_Love_%28Taylor%27s_Version%29.png',
      moment: {
        context:
          'Like "Wildest Dreams (Taylor\'s Version)" before it, it leapfrogged its parent album — 1989 (Taylor\'s Version) was still 17 months away — after a snippet soundtracked the first trailer for Amazon\'s The Summer I Turned Pretty on May 5, 2022; she announced the full track on her socials the day the trailer dropped, and it arrived the next day.\n\nCritics heard a gentler remake: more subdued synths, vocals less processed and more resonant, with a lean toward indie rock. The re-recording reached No. 42 on the Hot 100 — a significantly stronger showing than the original 2014 album cut ever managed.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/This_Love_(Taylor_Swift_song)',
            source_title: 'This Love (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): single cover art from Wikipedia's stable
        // upload.wikimedia.org copy (exact filename from the article HTML).
        // URL verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/b/be/This_Love_%28Taylor%27s_Version%29.png',
            credit: 'Republic Records (single cover art)',
            caption: 'Cover artwork for "This Love (Taylor\'s Version)," the first 1989 re-recording released.',
            kind: 'primary',
            // Focal point set 2026-07-18 by viewing (300x300): extreme
            // close-up, eyes and lips in the upper-right quadrant, hair
            // filling the lower half.
            focalPoint: '58% 26%',
          },
          // Photo pass #762 (2026-07-18): Commons portrait of Jenny Han —
          // author-showrunner of The Summer I Turned Pretty, whose trailer
          // premiered the re-record (era context; BookCon 2019, not the show).
          // Commons license API-verified CC BY-SA 4.0 (Rhododendrites);
          // curl 200 image/jpeg 500x482, downloaded and vision-confirmed
          // (Han at a BookCon signing table).
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Jenny_Han_at_BookCon_-_2019_%2826746%29_%28cropped%29.jpg/500px-Jenny_Han_at_BookCon_-_2019_%2826746%29_%28cropped%29.jpg',
            credit: 'Rhododendrites, Wikimedia Commons (CC BY-SA 4.0) — Jenny Han, BookCon 2019 (archival, era context)',
            caption: 'Jenny Han, whose Amazon adaptation of The Summer I Turned Pretty carried the re-recorded "This Love" out into the world a night early.',
            kind: 'archival',
            // Focal point set by viewing: face upper-center, BookCon banner
            // behind, folded arms along the bottom edge.
            focalPoint: '45% 24%',
          },
        ],
      },
    },
    {
      slug: 'evermore-park-lawsuits',
      year: 2021,
      month: 2,
      day: 2,
      category: 'business',
      title: 'evermore vs. Evermore: the theme-park lawsuit that ended in a draw',
      snippet:
        'A Utah fantasy park sued over the album\'s name on Feb. 2, 2021; her company countersued three weeks later over the park\'s costumed performers singing "Love Story" and "Bad Blood" without a license. By late March, both sides dropped everything — no money exchanged.',
      sourceUrl: 'https://variety.com/2021/music/news/taylor-swift-evermore-park-lawsuits-drop-utah-theme-park-trademark-1234937782/',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0a/Taylor_Swift_-_Evermore.png',
      moment: {
        context:
          'Evermore Park alleged trademark infringement and "actual confusion" with its brand, seeking up to $2 million per counterfeit mark plus attorney fees; TAS Rights Management\'s countersuit answered that the park\'s costumed performers had been singing three Swift songs in shows while ignoring numerous licensing notices from BMI.\n\nOn March 24, 2021 — barely seven weeks after the first filing — both sides dropped and dismissed everything, with a Swift spokesperson confirming no money changed hands. One of the odder footnotes in the album\'s history.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2021/music/news/taylor-swift-evermore-park-lawsuits-drop-utah-theme-park-trademark-1234937782/',
            source_title: 'Taylor Swift and Evermore Park Drop Lawsuits Against One Another, With No Money Exchanged',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-evermore-park-copyright-infringement-lawsuits-dropped-1146582/',
            source_title: 'Taylor Swift, Evermore Park Drop Respective Copyright Infringement Lawsuits',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): no freely usable photo of Evermore Park
        // itself was found (Wikimedia Commons has none), so the album art at the
        // center of the dispute stands in, labeled honestly. URL verified
        // HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/0/0a/Taylor_Swift_-_Evermore.png',
            credit: 'Republic Records (album cover art)',
            caption:
              "evermore's album art — the name at the center of the dueling suits. (No usable photo of the Utah park itself; the album artwork stands in.)",
            kind: 'archival',
            // Focal point set 2026-07-18 by viewing (300x300): back of head
            // with the french braid running down the center; keep the braid
            // and coat collar in frame. Photo pass #762: no second photo
            // added — Commons has no imagery of the Utah park or its founder,
            // and no on-hook alternative could be verified.
            focalPoint: '48% 30%',
          },
        ],
      },
    },
    {
      slug: 'brits-global-icon',
      year: 2021,
      month: 5,
      day: 11,
      category: 'business',
      title: 'First woman ever to take the BRITs Global Icon award',
      snippet:
        'May 11, 2021: the BRITs\' highest honor — previously given only to Elton John, David Bowie and Robbie Williams — goes to its first woman, first non-British recipient, and youngest winner.',
      sourceUrl: 'https://www.cnn.com/2021/05/10/entertainment/taylor-swift-brits-global-icon-intl-scli-gbr/index.html',
      // Image-fix pass (2026-07-10 retry): ticket #216 — old YouTube still had
      // a 'billboard NEWS' channel-branding logo baked into the frame (cosmetic
      // only per the checker; subject/era were already correct). Broadened
      // search found E! Online's own hosted copy of the Ian West/PA Images via
      // Getty Images wire photo from the ceremony — a clean editorial shot with
      // no logo overlay. URL verified HTTP 200 + image/jpeg; visually confirmed
      // (Swift on the BRITs 2021 stage in the Miu Miu two-piece, holding up the
      // Global Icon trophy, Mastercard-branded podium visible as event signage
      // — not an added watermark).
      thumbnailUrl:
        'https://akns-images.eonline.com/eol_images/Entire_Site/2021411/rs_1200x1200-210511142237-1200..2-taylor-swift-brit-awards-2021.jpg',
      moment: {
        context:
          'The ceremony doubled as a UK live-events pilot, with an O2 Arena crowd of roughly 4,000 made up largely of frontline workers — one of the first big indoor shows of the reopening — and she was there in person to accept, mid-re-recording-era, with no album of her own to promote.\n\nGame of Thrones\' Maisie Williams presented the award, and Swift aimed her speech at the room\'s newer artists: "If you\'re being met with resistance, that probably means doing something new. If you\'re experiencing turbulence or pressure, that probably means you\'re rising."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/awards/taylor-swift-inspires-with-brit-awards-2021-speech-video-9570789/',
            source_title: 'Taylor Swift Offers Inspiration in Brit Awards 2021 Speech',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
          {
            outlet: 'CNN',
            url: 'https://www.cnn.com/2021/05/10/entertainment/taylor-swift-brits-global-icon-intl-scli-gbr/index.html',
            source_title: 'Taylor Swift becomes first woman to win BRITs Global Icon award',
            publisher: 'CNN',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'BRIT Awards',
            url: 'https://www.brits.co.uk/news/2021/taylor-swift-to-receive-global-icon-award/',
            source_title: 'Taylor Swift to receive Global Icon Award!',
            publisher: 'BRIT Awards (official)',
            source_type: 'official',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
        ],
        // Image-fix pass (2026-07-10 retry): ticket #216 — replaced the
        // logo-overlaid YouTube still with the Ian West/PA Images via Getty
        // Images wire photo (hosted on eonline.com's own CDN), a clean shot
        // with no channel-branding overlay. URL verified HTTP 200 + image/jpeg;
        // visually confirmed (Swift on the BRITs 2021 stage, Miu Miu two-piece,
        // holding the Global Icon trophy aloft).
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2021411/rs_1200x1200-210511142237-1200..2-taylor-swift-brit-awards-2021.jpg',
            credit: 'Ian West/PA Images via Getty Images',
            caption: 'Swift holds up the Global Icon trophy on stage at the 2021 BRIT Awards.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'vmas-2022-midnights-handoff',
      year: 2022,
      month: 8,
      day: 28,
      category: 'business',
      title: 'Video of the Year for All Too Well — then she announces Midnights from the podium',
      snippet:
        'Aug. 28, 2022: the short film takes the VMAs\' top prize, and mid-acceptance she drops it — "I thought it might be a fun moment to tell you that my brand-new album comes out October 21." The evermore era ended live on camera.',
      sourceUrl: 'https://en.wikipedia.org/wiki/2022_MTV_Video_Music_Awards',
      // Image-fix pass (2026-07-10): ticket #202 — old ET thumbnail was a
      // side-by-side composite (Swift at the mic + a separate Midnights
      // album-art panel), not a single photograph. Swapped to Access
      // Hollywood's single podium-speech still (verified HTTP 200 +
      // image/jpeg; visually confirmed Swift alone with the VMA statuette).
      thumbnailUrl: 'https://i.ytimg.com/vi/x_c_1qsnZ28/hqdefault.jpg',
      moment: {
        context:
          'The short film swept its categories that night — Video of the Year plus Best Longform Video and Best Direction, the direction prize for Swift\'s own work behind the camera.\n\nAt midnight her socials revealed the title, Midnights — "the stories of 13 sleepless nights scattered throughout my life." The Moschino star romper she wore to the after-party, already reading as a teaser, is covered in this era\'s sighting items.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/2022_MTV_Video_Music_Awards',
            source_title: '2022 MTV Video Music Awards',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-2022-mtv-vmas-afterparty-outfit-midnights-1235132508/',
            source_title: "Taylor Swift's 2022 VMAs After-Party Outfit Channels Midnights",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // Image-fix pass (2026-07-10): ticket #202 — old ET thumbnail was a
        // side-by-side composite (Swift at the mic + a separate Midnights
        // album-art panel, per the checker's pixel read). Replaced with Access
        // Hollywood's official YouTube still, id verified via oEmbed (title:
        // "Taylor Swift Announces NEW ALBUM 'Midnights' After 2022 VMAs
        // Acceptance Speech", channel: Access Hollywood). URL verified HTTP
        // 200 + image/jpeg; visually confirmed a single photo of Swift alone
        // at the podium holding the VMA statuette.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/x_c_1qsnZ28/hqdefault.jpg',
            credit: 'Access Hollywood / YouTube (press coverage still)',
            caption:
              'Swift accepting Video of the Year at the 2022 VMAs, moments before announcing Midnights — from Access Hollywood\'s coverage of the speech.',
            kind: 'archival',
            // Focal point set 2026-07-18 by viewing (480x360): Swift at the
            // podium mid-speech, face just left of center in the upper third,
            // moon-person trophy lower right. Photo pass #762: no second
            // photo added — Commons has no 2022-VMAs Swift imagery, and MTV's
            // own speech-compilation thumbnail shows other artists, so no
            // verifiable second still of this exact moment was found.
            focalPoint: '47% 30%',
          },
        ],
      },
    },
    {
      slug: 'joe-gq-hype-accidental',
      year: 2022,
      month: 5,
      day: 9,
      category: 'relationship',
      title: '"The most accidental thing to happen in lockdown": Joe on the co-writes',
      snippet:
        'In a May 2022 GQ Hype profile, Joe Alwyn finally talked about William Bowery\'s workload — "It was just messing around on a piano and singing badly and being overheard" — five credits across folklore and evermore, all by accident.',
      sourceUrl: 'https://www.justjared.com/2022/05/09/joe-alwyn-says-writing-songs-with-taylor-swift-was-the-most-accidental-thing-to-happen-in-lockdown/',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Joe_Alwyn_during_an_interview%2C_August_2018.png',
      moment: {
        context:
          'He\'d spent two years deflecting questions about the pseudonym; this was the fullest account he ever gave: "It was really the most accidental thing to happen in lockdown. It wasn\'t like, \'It\'s three o\'clock, it\'s time to write a song!\'"\n\nThe rest of the origin story stayed just as casual — "messing around on a piano and singing badly," being overheard, "and then thinking, you know, what if we tried to get to the end of it together?" No schedule, no sessions. His credits: "exile," "betty," "champagne problems," "coney island," and "evermore."',
        sources: [
          {
            outlet: 'Just Jared',
            url: 'https://www.justjared.com/2022/05/09/joe-alwyn-says-writing-songs-with-taylor-swift-was-the-most-accidental-thing-to-happen-in-lockdown/',
            source_title: "Joe Alwyn Says Writing Songs with Taylor Swift Was 'The Most Accidental Thing to Happen in Lockdown'",
            publisher: 'Just Jared',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'iHeart',
            url: 'https://www.iheart.com/content/2022-05-09-joe-alwyn-opens-up-about-accidentally-writing-songs-with-taylor-swift/',
            source_title: "Joe Alwyn Opens Up About 'Accidentally' Writing Songs With Taylor Swift",
            publisher: 'iHeartRadio',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        // Real-photo pass (2026-07-09): freely licensed Commons still of Alwyn
        // mid-interview; license (CC BY-SA 3.0) verified on the file page.
        // URL verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Joe_Alwyn_during_an_interview%2C_August_2018.png',
            credit: 'Collider Video (CC BY-SA 3.0) via Wikimedia Commons',
            caption: 'Joe Alwyn during a 2018 interview — years into the same press-shy stretch the GQ Hype profile finally opened up.',
            kind: 'archival',
          },
        ],
      },
    },

    // ── Migrated from content.ts RAW (consolidation stage 2a, 2026-07-19) ──
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "evermore-album",
      year: 2020,
      month: 12,
      day: 11,
      category: "music",
      title: "folklore’s sister arrives",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-ever-1", label: "evermore surprise drop", kind: "album" },
      snippet: "A second surprise album in five months — warmer, rustier, and just as literary.",
      moment: {
        context: "evermore extended the folklore universe into late autumn: flannel, firelight, and some of her most intricate storytelling.\n\nSwift announced it with a note calling folklore's \"sister record\" not a spillover of extra songs but a natural continuation she \"couldn't stop writing.\"",
        // Photo pass #762 (2026-07-19): alternate official frame of the
        // "willow" video, which premiered alongside the album at midnight —
        // video ID verified via YouTube oEmbed (author "Taylor Swift",
        // @TaylorSwift) this session; curl 200 image/jpeg 1280x720;
        // Read-viewed: hooded Swift in the snowy night bonfire scene.
        // (The video's default thumbnail is used on the "willow" page —
        // distinct URL per the no-duplicates rule.)
        photos: [
          {
            url: 'https://i.ytimg.com/vi/RsEZmictANA/maxres3.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'The "willow" video — released with the album at midnight — carried evermore\'s wintry, firelit look.',
            kind: 'archival',
            focalPoint: '60% 25%',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "evermore-willow",
      year: 2020,
      month: 12,
      day: 11,
      category: "music",
      title: "\"willow\" leads the era",
      snippet: "The lead single doubles as the album's only official single release.",
      video: { youtubeId: "RsEZmictANA", title: "Taylor Swift - willow" },
      moment: {
        context: "\"willow\" was released same-day as the album as its lead single and only Hot 100 top-10 hit from evermore — later performed live for the first time at the 2021 Grammys.",
        // Photo pass #762 (2026-07-19): official video still — ID RsEZmictANA
        // (already cited by this entry's video field) verified via YouTube
        // oEmbed (author "Taylor Swift"); curl 200 image/jpeg 1280x720;
        // Read-viewed: Swift in the glass-box carnival scene.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/RsEZmictANA/maxresdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'The glass-box scene from the self-directed "willow" video.',
            kind: 'archival',
            focalPoint: '45% 20%',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "evermore-no-body-no-crime",
      year: 2020,
      month: 12,
      day: 11,
      category: "music",
      title: "\"no body no crime\" with HAIM",
      snippet: "A murder-ballad duet featuring sisters Este, Danielle, and Alana Haim, named as characters in the song.",
      moment: {
        context: "The song casts all three HAIM sisters as characters in its narrative (Este Haim is even the credited narrator), and the band joined Swift to perform it live during the Eras Tour years later.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "evermore-champagne-problems",
      year: 2020,
      month: 12,
      day: 11,
      category: "music",
      tags: ["Lore"],
      title: "\"champagne problems\"",
      snippet: "A co-write with William Bowery (Joe Alwyn) about a declined proposal.",
      moment: {
        context: "One of two evermore tracks co-written with \"William Bowery,\" \"champagne problems\" narrates a failed proposal — widely read by fans as one of the album's emotional centerpieces.",
        // Photo pass #762 (2026-07-19): official lyric-video still — ID
        // wMpqCRF7TKg verified via YouTube oEmbed ("Taylor Swift - champagne
        // problems (Official Lyric Video)", author "Taylor Swift"); curl 200
        // image/jpeg 1280x720; Read-viewed: the title card's champagne flute.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/wMpqCRF7TKg/maxresdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'The official lyric video\'s title card.',
            kind: 'archival',
            focalPoint: '50% 40%',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "evermore-right-where-you-left-me",
      year: 2021,
      month: 1,
      day: 7,
      category: "music",
      title: "The deluxe edition adds two tracks",
      snippet: "\"right where you left me\" and \"it's time to go\" arrive a month after the album.",
      moment: {
        context: "A deluxe edition released three weeks after the original, adding \"right where you left me\" and \"it's time to go\" — both later folded into the era's standard track list on streaming.",
        // Photo pass #762 (2026-07-19): official lyric-video still — ID
        // Ur_wAcYDnuA verified via YouTube oEmbed ("Taylor Swift - right
        // where you left me (Official Lyric Video)", author "Taylor Swift");
        // curl 200 image/jpeg 1280x720; Read-viewed: the empty-table scene.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/Ur_wAcYDnuA/maxresdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'The empty restaurant table of the official lyric video — "right where you left me."',
            kind: 'archival',
            focalPoint: '52% 55%',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "evermore-marjorie",
      year: 2020,
      month: 12,
      day: 11,
      category: "music",
      tags: ["Lore"],
      title: "\"marjorie,\" for her grandmother",
      snippet: "A tribute built partly from archival recordings of Swift's late grandmother, opera singer Marjorie Finlay.",
      moment: {
        context: "The song incorporates real vocal recordings of Marjorie Finlay, Swift's grandmother and a professional opera singer who died in 2003 — Swift has spoken about writing it as a way of \"bringing her back.\"",
        // Photo pass #762 (2026-07-19): official lyric-video still — ID
        // hP6QpMeSG6s verified via YouTube oEmbed ("Taylor Swift - marjorie
        // (Official Lyric Video)", author "Taylor Swift"); curl 200 image/jpeg
        // 1280x720; Read-viewed: an archival black-and-white portrait of
        // Marjorie Finlay from the video itself.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/hP6QpMeSG6s/maxresdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Marjorie Finlay, in an archival portrait from the official lyric video.',
            kind: 'archival',
            focalPoint: '40% 40%',
          },
        ],
      },
    },
  ],
};
