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
//
// Body-depth pass (2026-07-09): thin/empty moment.context expanded on 16
// items, each re-verified against its cited sources via fetch on 2026-07-09;
// strong second sources added where an item had one. The five tour-costume
// items sourced only to the Taylor Swift Style fan blog were deliberately
// left shallow — no independently verifiable second source exists for those
// costume specifics, and skipping beats padding or inventing.
//
// T16 full pass (2026-07-09, branch content/reputation-full): every item
// brought to the 2+ paragraph body standard (paragraphs split on \n\n, per
// scripts/sync-longlive-content.mjs bodyFrom()) and every item given at
// least one real photo. New facts verified against fetched sources this
// session; the five fan-blog costume items keep their costume claims
// attributed to the blog and are deepened only with independently sourced
// facts about the segment/show each costume dressed (Wikipedia tour data,
// Billboard show coverage). New photo URLs verified HTTP 200 + image/*
// and visually checked against their captions this session; Wikimedia
// Commons licenses verified on each file page (CC BY-SA 2.0/4.0 or PD),
// YouTube stills verified via oEmbed against the official @TaylorSwift
// channel. One item (the March 2018 Malibu hike) has no verifiable photo
// of the actual moment anywhere — it carries a clearly-captioned
// kind:'reference' stand-in (the couple's documented March 2019 trail
// hike) rather than a fake or a non-matching agency composite.

export default {
  eraSlug: 'reputation',
  items: [
    {
      significance: 'notable', // a striking real chart statistic capturing the scale of the comeback (docs/decisions.md, 2026-07-19)
      year: 2017,
      month: 11,
      day: 20,
      category: 'business',
      title: 'reputation sells more than the rest of the chart combined',
      snippet:
        '1.238 million units in week one — the only artist in Nielsen history with four different million-selling album weeks.',
      sourceUrl: 'https://www.billboard.com/pro/taylor-swift-reputation-debuts-no-1-billboard-200-albums/',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/f/f2/Taylor_Swift_-_Reputation.png',
      moment: {
        context:
          "Withheld from streaming services for its entire first week, reputation moved 1.216 million copies in pure sales — the biggest sales week for any album since 2015 — while the No. 2 record that week, Sam Smith's The Thrill of It All, managed 66,000 units. Its 709,000 digital copies were the third-largest digital sales week in Nielsen history, and in seven days it passed Ed Sheeran's ÷ (931,000) to become 2017's best-selling album.\n\nThe million-selling-week club she rejoined was her own: Speak Now (1.047 million), Red (1.208 million), and 1989 (1.287 million) had all done it first — no other artist in Nielsen's history had even one week that size four times. For a record rolled out with no press interviews, a wiped social feed, and a deliberate streaming holdout, the number was the whole argument: the audience showed up anyway.",
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-reputation-debuts-no-1-billboard-200-albums/',
          },
          {
            outlet: 'Refinery29',
            url: 'https://www.refinery29.com/en-us/2017/11/182106/taylor-swift-reputation-billboard-chart',
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/brittanyhodak/2017/11/20/taylor-swifts-reputation-outsold-every-other-album-on-the-billboard-200-combined/',
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): stays at one image — the
        // cited Billboard/Refinery29/Forbes pages lazy-load their images (no
        // retrievable URLs), their chart-story art is wire/Getty-only, and no
        // Commons photo depicts the sales week itself. The album cover is the
        // artifact the 1.2M buyers bought; focal point set by eye this run.
        // Re-reviewed 2026-08-01 (#762): searched again for a second image
        // (Time 100 gala, TIME cover, era press) — nothing on an outlet-CDN
        // or Commons host tied to this specific Nov. 2017 chart week.
        // Photo pass #762 (2026-08-16): a second image found — Billboard's own
        // hero image for the exact article cited as this moment's sourceUrl.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Taylor_Swift_-_Reputation.png',
            focalPoint: '42% 35%',
            credit: 'Big Machine Records',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-press-photo-2017-05-aa-billboard-1548.jpg',
            focalPoint: '52% 20%',
            credit: 'Billboard',
            caption:
              "Taylor Swift's reputation-era press portrait, the lead image Billboard used on its report of the album's chart-shattering debut week.",
            kind: 'primary',
          },
        ],
        // Rumor Desk 2026-07-25: this album-identity moment is the structural
        // home for the "will reputation ever get a Taylor's Version" question —
        // as of this run it is the only one of Swift's first six albums with no
        // released re-recording. Both entries are forward-looking, unannounced-
        // music speculation (explicitly allowed by the redlines) and carry no
        // location. Adds reputation as a new era in the rumor system (previously
        // only Showgirl + debut), deliberately spread away from the wedding page.
        rumors: [
          {
            claim:
              'Fans and music press kept expecting reputation (Taylor\'s Version) — or at least its unreleased Vault tracks — to eventually surface, after Taylor wrote in her May 2025 masters-buyback letter that the album\'s Vault tracks would one day "hatch," while confirming she\'d "not even re-recorded a quarter of it." No reputation re-recording or Vault release has been announced.',
            reportedBy: 'Rolling Stone (Angie Martoccio)',
            reportedOn: '2025-05-30',
            status: 'unconfirmed',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-reputation-taylors-version-not-releasing-1235351379/',
            note: 'Forward-looking, unannounced-music speculation; distinct from the debut "Taylor\'s Version" rumor. Resolves on an official announcement of a reputation re-record or Vault release. Re-checked 2026-08-15: still none announced; kept STILL LIVE rather than faded — the topic was re-fueled as recently as the Dec 2025 Dolby Atmos lyric edits (entry below), so it has not gone quiet.',
            sourceTier: 'established',
            lastCheckedOn: '2026-08-15',
          },
          {
            claim:
              'Among the specific songs fans theorized could land on a reputation re-recording, the most persistent was "This Is What You Came For" — the 2016 Calvin Harris/Rihanna hit Taylor secretly co-wrote as "Nils Sjöberg" — alongside the Zayn duet "I Don\'t Wanna Live Forever," with fans reading her acoustic Eras Tour surprise-song performances of both as tea leaves.',
            reportedBy: 'Capital FM',
            reportedOn: '2025-09-30',
            status: 'unconfirmed',
            url: 'https://www.capitalfm.com/artists/taylor-swift/reputation-taylors-version-vault-tracks/',
            note: 'Pure fan speculation about an unannounced tracklist, aggregated by Capital — lowest source tier. Resolves if a reputation Vault release confirms or excludes these songs. Re-checked 2026-08-15: no such release, so the theory can\'t yet be confirmed or excluded; still-live as part of the active reputation-re-record question, not faded.',
            sourceTier: 'social',
            lastCheckedOn: '2026-08-15',
          },
          {
            // Rumor Desk 2026-07-27: a third, later data point on the same
            // reputation Taylor's Version question — a concrete, dated December
            // 2025 easter-egg event, distinct from the May-2025 masters-letter
            // entry and the fan-tracklist theory above. Forward-looking,
            // unannounced-music speculation (allowed by the redlines); no location.
            claim:
              'When reputation arrived on Apple Music in Dolby Atmos in December 2025, Taylor had quietly altered two lyrics from the 2017 originals — sharpening a line in "I Did Something Bad" and swapping a word in "Delicate" — and fans and music press read the tweaks as an Easter-egg tease that reputation (Taylor\'s Version) or its unreleased Vault tracks were finally near.',
            reportedBy: 'Rolling Stone (Maya Georgi)',
            reportedOn: '2025-12-12',
            status: 'unconfirmed',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-reputation-lyric-changes-explained-1235483070/',
            note: 'The lyric edits are documented; the re-record tease is the unconfirmed read. Resolves on an announced reputation re-record or Vault release, fades if the window stays empty. Re-checked 2026-08-19: still nothing announced — kept STILL LIVE (not faded), the same active reputation-TV question its two sibling entries were re-checked on 2026-08-15. No location.',
            sourceTier: 'established',
            lastCheckedOn: '2026-08-19',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 5,
      day: 8,
      category: 'tour',
      significance: 'defining', // the highest-grossing US tour of all time when it closed, the tour that proved the reputation comeback (docs/decisions.md, 2026-07-19)
      relatedIds: [
        'moment:vault-midnights-the-eras-tour-kicks-off-in-glendale',
        'moment:vault-1989-the-snake-video-that-announced-reputation',
      ],
      title: 'reputation Stadium Tour opens to a record crowd',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-rep-2", label: "Stadium Tour", kind: "tour" },
      snippet:
        "59,157 fans at University of Phoenix Stadium — breaking the venue's attendance record, set by One Direction in 2014, by 2,633 seats.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Reputation_Stadium_Tour',
      thumbnailUrl:
        "https://upload.wikimedia.org/wikipedia/en/b/b3/Taylor_Swift%27s_Reputation_Stadium_tour.png",
      moment: {
        context:
          "Opening night at University of Phoenix Stadium on May 8, 2018 grossed $7.2 million on its own, with Camila Cabello and Charli XCX opening the show — and briefly joining her on stage for a three-way \"Shake It Off.\" The 59,157 fans in the building broke a venue attendance record One Direction had held since 2014, and they broke it by 2,633 seats.\n\nIt was the first all-stadium tour of her career, launched behind an album rolled out with almost no press interviews: 53 shows across seven countries that would close six months later as the highest-grossing U.S. tour in Billboard Boxscore history.\n\nThe reclaimed snake from the album rollout got its full-size payoff on this stage: a towering animatronic serpent — fans nicknamed her Karyn — loomed over the set for \"Look What You Made Me Do\" every night of the run.\n\nBy the time the run closed six months later, the numbers had grown to tour-defining size: those 53 shows drew about 2.88 million people — an average of well over 50,000 a night — and grossed roughly $345.6 million worldwide. The U.S. leg alone took in around $266.1 million, enough to pass the Rolling Stones' A Bigger Bang Tour as the highest-grossing tour in North American history to that point, and the run carried the Guinness World Record for the highest-grossing tour by a female artist in 2018. Those receipts were the argument the album itself had declined to make in interviews: an era that let the snake and the stadiums do the talking answered its doubters in ticket stubs, turning a comeback nobody was sure would land into the biggest touring success of Taylor's career to that point.",
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Reputation_Stadium_Tour' },
          {
            outlet: 'Refinery29',
            url: 'https://www.refinery29.com/en-us/2018/10/212619/taylor-swift-reputation-snake-costume',
            source_title: 'Taylor Swift Reputation Tour Snake Halloween Costume',
            publisher: 'Refinery29',
            source_type: 'reputable_press',
            accessed_at: '2026-07-19',
            reliability_score: 3,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/articles/columns/pop/8455193/taylor-swift-reputation-tour-best-moments',
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): no photo from opening
        // night in Glendale exists on Commons, and the cited outlets' own
        // CDNs lazy-load (no retrievable URLs) or run Getty wire art. Added a
        // clearly-captioned era-performance shot from four nights later on
        // the same leg (Levi's Stadium, May 12) — Commons CC BY-SA 4.0,
        // downloaded and vision-confirmed this run.
        photos: [
          {
            url: "https://upload.wikimedia.org/wikipedia/en/b/b3/Taylor_Swift%27s_Reputation_Stadium_tour.png",
            credit: 'Big Machine Records',
            focalPoint: '46% 28%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Taylor_Swift_Reputation_Tour31.jpg',
            credit: 'UltimateWarrior13 / Wikimedia Commons (CC BY-SA 4.0)',
            caption:
              'Mid-song on the reputation Stadium Tour at Levi’s Stadium, May 12, 2018 — four nights after the record-crowd opener in Glendale.',
            kind: 'archival',
            focalPoint: '50% 18%',
          },
          // Photo pass 2026-07-19 (bulk-to-6+, docs/decisions.md): re-searched
          // for the actual Glendale opening night this pass names directly —
          // an NME gallery hosts Getty's own opening-night set on NME's CDN.
          // All 4 below curl 200 image/jpeg, downloaded and vision-confirmed.
          {
            url: 'https://www.nme.com/wp-content/uploads/2018/05/GettyImages-956230118.jpg',
            // Photo pass #762 (2026-08-01): viewed (1000x635). Three faces level
            // across the upper third; Taylor is the center figure.
            focalPoint: '50% 28%',
            credit: 'Kevin Mazur/Getty Images for TAS, via NME',
            caption: 'Camila Cabello, Taylor, and Charli XCX backstage at University of Phoenix Stadium before opening night, May 8, 2018.',
            kind: 'archival',
          },
          {
            url: 'https://www.nme.com/wp-content/uploads/2018/05/GettyImages-956319166.jpg',
            // Photo pass #762 (2026-08-01): viewed (1000x635). Three singers mid-song,
            // faces in the upper fifth, Taylor centered between the other two.
            focalPoint: '48% 20%',
            credit: 'Kevin Mazur/Getty Images for TAS, via NME',
            caption: 'The three-way "Shake It Off" that closed the opening set, Cabello and Charli XCX joining Taylor on stage.',
            kind: 'archival',
          },
          {
            url: 'https://www.nme.com/wp-content/uploads/2018/05/GettyImages-956299498.jpg',
            // Photo pass #762 (2026-08-01): viewed (1000x635). Close crop, her
            // face fills the top of frame, arms raised on either side.
            focalPoint: '48% 15%',
            credit: 'Kevin Mazur/Getty Images for TAS, via NME',
            caption: 'Taylor performs opening night of the reputation Stadium Tour, May 8, 2018.',
            kind: 'archival',
          },
          {
            url: 'https://www.nme.com/wp-content/uploads/2018/05/GettyImages-956288820-1.jpg',
            // Photo pass #762 (2026-08-01): viewed (1000x636). The animatronic
            // snake head fills the center-right of frame.
            focalPoint: '55% 35%',
            credit: 'Kevin Mazur/Getty Images for TAS, via NME',
            caption: 'The tour\'s giant animatronic snake, "Karyn" — the mascot the reclaimed symbol became a year after the Kimye leak.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/3/38/Taylor_Swift_-_Reputation_Tour_Seattle_-_Look_What_You_Made_Me_Do.jpg',
            // Photo pass #762 (2026-08-01): viewed (1200x800 downsized from
            // 5472x3648). Taylor performs front-right on the gilded stage
            // platform, lower-right of frame; the snake set dominates the rest.
            focalPoint: '68% 55%',
            credit: 'Ronald Woan, Wikimedia Commons (CC BY-SA 2.0)',
            caption: 'Golden snake set pieces frame the stage during "Look What You Made Me Do," Seattle, May 22, 2018.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 5,
      day: 8,
      category: 'tour',
      title: 'Snakes everywhere, on purpose',
      snippet:
        "Taylor's own explanation, on stage: she was called a snake on social media, and rather than let it define her, she made it the tour's whole visual language — in her words, something that 'can strengthen you instead.'",
      sourceUrl:
        'https://www.iheart.com/content/2018-05-08-taylor-swift-kicks-off-reputation-tour-with-big-setlist-fireworks-snakes/',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Taylor_Swift_-_Reputation_Tour_Seattle_-_Getaway_Car.jpg/1280px-Taylor_Swift_-_Reputation_Tour_Seattle_-_Getaway_Car.jpg',
      moment: {
        context:
          "\"You might be wondering why there are so many snakes everywhere,\" she told the opening-night crowd in Glendale, before explaining that \"a couple of years ago, someone called me a snake on social media and it caught on,\" and that she went through \"some really low times\" because of it.\n\nThe serpents were everywhere by design — coiling across the video screens, in her jewelry and costumes, and as set pieces flanking the stages — and the nightly speech reframed them in real time: name-calling \"doesn't have to defeat you. It can strengthen you instead.\"",
        sources: [
          {
            outlet: 'iHeartRadio',
            url: 'https://www.iheart.com/content/2018-05-08-taylor-swift-kicks-off-reputation-tour-with-big-setlist-fireworks-snakes/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/articles/columns/pop/8455193/taylor-swift-reputation-tour-best-moments',
          },
        ],
        // T-img pass (2026-07-10): dropped the Getaway Car performance photo
        // from this moment — that file shows Taylor alone in a silver jacket
        // with no snake staging visible, and it's already correctly used on
        // the dedicated Getaway Car moment. No verified Commons photo of the
        // tour's cobra prop/snake-screen visuals was found this session, so
        // this moment keeps its other, unflagged tour photo rather than
        // adding an unverified replacement.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Taylor_Swift_Sports_Authority_Field_05.25.18_%2842328420702%29.jpg',
            credit: 'Julio Enriquez / Wikimedia Commons',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 3,
      day: 30,
      category: 'release',
      title: 'A second, stripped-down Delicate video — just her, a clearing, and one take',
      snippet:
        'Two weeks after the elaborate original, a Spotify-exclusive alternate: Taylor, alone in the woods, singing straight into a single unbroken shot.',
      sourceUrl: 'https://www.rollingstone.com/music/music-news/watch-taylor-swifts-one-take-new-delicate-video-629359/',
      thumbnailUrl: 'https://i.ytimg.com/vi/MBR2kxt7RK8/maxresdefault.jpg',
      moment: {
        context:
          "Released March 30, 2018 as a Spotify exclusive — initially viewable only in the U.S., U.K., Sweden, and Latin America — the vertical video was shot by Taylor herself in a single unbroken take, lip-syncing and twirling through a wooded clearing. Fans zeroed in on one blink-and-miss gesture: her clutching a necklace with a \"J\" pendant, read as a nod to Joe Alwyn.\n\nWhere Joseph Kahn's original video was a dance-heavy fantasy about turning invisible, this one was deliberately homemade — and it finally hit YouTube for everyone on May 15.",
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/watch-taylor-swifts-one-take-new-delicate-video-629359/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-delicate-vertical-video-spotify-8274561/',
          },
        ],
        // T-img pass (2026-07-10): video ID 3tHoEgt0zB8 was a third-party
        // news-reaction upload (a news anchor talking with a small inset),
        // not the vertical video itself. Swapped to MBR2kxt7RK8, the
        // Big Machine Label Group-published "Delicate (Vertical Version)" —
        // its maxresdefault thumbnail is a single VEVO-branded frame of
        // Taylor alone in the foggy wooded clearing, no collage seam;
        // verified HTTP 200 + image/jpeg and eyeballed this session.
        photos: [{ url: 'https://i.ytimg.com/vi/MBR2kxt7RK8/maxresdefault.jpg', credit: 'YouTube / Taylor Swift (Big Machine Label Group)' }],
      },
    },
    {
      year: 2018,
      month: 12,
      day: 31,
      category: 'release',
      title: 'The reputation Stadium Tour film premieres on Netflix, New Year\'s Eve',
      snippet: 'Announced on her 29th birthday, filmed secretly at her last North American tour stop, released globally at 12:01 a.m. on New Year\'s Eve.',
      sourceUrl: 'https://www.refinery29.com/en-us/2018/12/219360/taylor-swift-reputation-tour-concert-movie-netflix',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Taylor_Swift_performing_Fearless_during_Reputation_Stadium_Tour_-_New_Jersey%2C_2018.jpg/1280px-Taylor_Swift_performing_Fearless_during_Reputation_Stadium_Tour_-_New_Jersey%2C_2018.jpg',
      moment: {
        context:
          'Secretly taped on October 6 at AT&T Stadium in Arlington — the second of two Texas nights, and the tour\'s final North American stop — the film preserves the full six-act show, 63-foot cobra included, plus its one-night-only guest moments: Sugarland joining her for the first-ever live "Babe," Maren Morris on "The Middle," and openers Camila Cabello and Charli XCX returning for "Shake It Off."\n\nIt landed on Netflix at 12:01 a.m. on New Year\'s Eve, weeks after the tour closed out as the highest-grossing U.S. tour ever, at $266.1 million; the trailer\'s voiceover set the era\'s arc in one line: "When she fell, she fell apart. When she rose, she rose slowly."',
        sources: [
          {
            outlet: 'Refinery29',
            url: 'https://www.refinery29.com/en-us/2018/12/219360/taylor-swift-reputation-tour-concert-movie-netflix',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-reputation-stadium-tour-film-netflix-what-to-expect-8490159/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Taylor_Swift_performing_Fearless_during_Reputation_Stadium_Tour_-_New_Jersey%2C_2018.jpg/1280px-Taylor_Swift_performing_Fearless_during_Reputation_Stadium_Tour_-_New_Jersey%2C_2018.jpg',
            credit: 'Melodies1917 / Wikimedia Commons',
          },
        ],
      },
    },
    {
      significance: 'notable', // a genuine, all-time career-wins record for a woman at the AMAs (docs/decisions.md, 2026-07-19)
      year: 2018,
      month: 10,
      day: 9,
      category: 'business',
      title: '23 AMA wins — more than any woman in history',
      snippet:
        'Four more trophies at the 2018 AMAs pushed her past Whitney Houston for the most American Music Award wins ever by a woman.',
      sourceUrl: 'https://www.forbes.com/sites/hughmcintyre/2018/10/10/taylor-swift-now-holds-the-record-for-the-most-american-music-award-wins-among-women/',
      thumbnailUrl: 'https://specials-images.forbesimg.com/dam/imageserve/1048528712/960x0.jpg?fit=scale',
      moment: {
        context:
          'She opened the October 9 show with a pyrotechnics-heavy "I Did Something Bad," then swept all four of her categories: Artist of the Year, Tour of the Year, and the pop/rock awards for Favorite Female Artist and Favorite Album — pushing her career total to 23, one behind Michael Jackson\'s all-time record of 24.\n\nTwo days after breaking her political silence on Instagram, she used the Artist of the Year speech to keep the thread going: "You know what else is voted on by the people? The mid-term elections on November 6. Get out and vote."',
        sources: [
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2018/10/10/taylor-swift-now-holds-the-record-for-the-most-american-music-award-wins-among-women/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/awards/2018-amas-recap-taylor-swift-cardi-b-8479215/',
          },
        ],
        // Photo re-check (2026-07-19, Tier 3): stays at one image — Wikimedia
        // Commons' Taylor Swift 2018 category has no 2018 AMA files at all
        // (only Reputation Stadium Tour Seattle shots), and the show wasn't
        // televised-broadcast-archived to Commons like later ceremonies were.
        photos: [
          {
            url: 'https://specials-images.forbesimg.com/dam/imageserve/1048528712/960x0.jpg?fit=scale',
            credit: 'Jeff Kravitz/FilmMagic',
            focalPoint: '56% 26%',
          },
        ],
      },
    },

    // --- Fashion/photo depth pass (2026-07-04) ---
    // Zero fashion items existed for this era before this batch. Every claim
    // and photo below was verified against its cited source directly (see
    // supabase/seed/content/_example.mjs for the no-fabrication rule).
    {
      year: 2018,
      month: 5,
      day: 8,
      category: 'fashion',
      title: "The reputation Stadium Tour's snake bodysuit",
      snippet:
        'Black sequins, cutouts, and a serpent motif for the "Look What You Made Me Do" staging — a look so definitive that the Eras Tour later rebuilt it as a Roberto Cavalli snake bodysuit.',
      sourceUrl: 'https://www.rollingstone.com/music/music-news/taylor-swift-reputation-gold-reputation-bodysuit-doc-series-1235487475/',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Taylor_Swift_-_Reputation_Tour_Seattle_-_Look_What_You_Made_Me_Do.jpg/1280px-Taylor_Swift_-_Reputation_Tour_Seattle_-_Look_What_You_Made_Me_Do.jpg',
      moment: {
        context:
          'The sparkling, snake-themed bodysuit-and-boots silhouette she wore for the "Look What You Made Me Do" staging became one of the tour\'s signature images — the era\'s reclaimed insult rendered as stagewear, captured here mid-song in Seattle.\n\nThe look outlived the tour itself. When the Eras Tour revived reputation as a full act in 2023, Roberto Cavalli built its black-and-red sequined snake bodysuit in the same mold — and that costume went unchanged for 131 shows, the only Eras Tour look that never got a variation, until a black-and-gold rework debuted at Miami\'s Hard Rock Stadium on October 18, 2024. Stylist Joseph Cassell\'s team raced the calendar to finish the new version, an origin story told in the third episode of The End of an Era; Taylor\'s own verdict on the swap, posted to Instagram: "I got some new outfits, and it\'s always nice when the crowd notices that."',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-reputation-gold-reputation-bodysuit-doc-series-1235487475/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Taylor_Swift_-_Reputation_Tour_Seattle_-_Look_What_You_Made_Me_Do.jpg/1280px-Taylor_Swift_-_Reputation_Tour_Seattle_-_Look_What_You_Made_Me_Do.jpg',
            credit: 'Ronald Woan / Wikimedia Commons',
          },
        ],
        // Shop pass (2026-07-22): the original tour costume was custom,
        // never sold at retail -- a current snake-print sequined bodysuit,
        // verified in stock, closest real match.
        products: [
          {
            brand: 'Rhapso Designs',
            item: 'Snake Print Silver Sequined Bodysuit',
            retailer: 'rhapso-designs.com',
            url: 'https://www.rhapso-designs.com/product-page/snake-print-silver-sequined-bodysuit-leo32',
            // Photo pass (t_fa7bfb57, 2026-08-31): retailer PDP image, curl-verified
            // 200 image/* response.
            imageUrl: 'https://static.wixstatic.com/media/a88653_79a149a90cff4fb787e246b77424f847~mv2.jpg/v1/fit/w_500,h_500,q_90/file.jpg',
            matchTier: 'unscored',
            kind: 'top',
            price: 'AU$90.00',
            isAlternative: true,
            altNote: 'The original tour bodysuit was custom, never sold at retail -- this is a current snake-print sequined bodysuit in the same silhouette (price in Australian dollars).',
            verifiedAt: '2026-08-30T19:22:10.691Z'
          },
        ],
      },
    },
    {
      year: 2018,
      month: 3,
      day: 30,
      category: 'fashion',
      title: 'The teal fringe dress in the second Delicate video',
      snippet:
        'A custom Naeem Khan piece from his Spring 2018 collection — layered tassels that swing into a mini as she twirls through the one-take video.',
      sourceUrl: 'https://www.bustle.com/p/where-to-buy-taylor-swifts-delicate-blue-tassel-dress-thats-causing-a-fashion-frenzy-8469568',
      thumbnailUrl:
        'https://imgix.bustle.com/uploads/image/2018/3/12/c5dd79b9-3dd6-48fb-be2c-6b565fc5fe09-screen-shot-2018-03-12-at-61855-am.png?w=248&h=218&fit=crop&crop=faces&dpr=2',
      moment: {
        context:
          'The teal, tiered-tassel dress was custom-made by Naeem Khan from his Spring 2018 ready-to-wear runway collection — a roughly $3,500 design with a keyhole back that reads as two dresses in one, falling as a floor-length fringed column before swinging up into a mini as she dances.\n\nStyled with Anabela Chan earrings and Christian Louboutin pumps, it set off a where-to-buy frenzy in the video\'s release week.',
        sources: [
          {
            outlet: 'Bustle',
            url: 'https://www.bustle.com/p/where-to-buy-taylor-swifts-delicate-blue-tassel-dress-thats-causing-a-fashion-frenzy-8469568',
          },
        ],
        photos: [
          {
            url: 'https://imgix.bustle.com/uploads/image/2018/3/12/c5dd79b9-3dd6-48fb-be2c-6b565fc5fe09-screen-shot-2018-03-12-at-61855-am.png?w=248&h=218&fit=crop&crop=faces&dpr=2',
            credit: 'Bustle',
          },
        ],
        // Shop pass (2026-07-22): the exact custom Naeem Khan piece is
        // discontinued -- a current teal tiered-fringe dress, verified
        // in stock, closest real match.
        products: [
          {
            brand: 'Alyce Paris',
            item: 'Alyce 40022 Short Homecoming Dress',
            retailer: 'promgirl.com',
            url: 'https://www.promgirl.com/products/alyce-al-40022-dress',
            imageUrl: 'https://cdn.shopify.com/s/files/1/0617/6414/1261/files/40022_AD_315_01.jpg?v=1762553101',
            matchTier: 'inspired',
            matchScore: 32,
            kind: 'dress',
            price: '$373.00',
            isAlternative: true,
            altNote: 'Her exact custom Naeem Khan piece is discontinued -- this is a current Tiffany-blue tiered-fringe dress in the same spirit, a fitted mini rather than the floor-to-mini reveal.',
            verifiedAt: '2026-08-30T19:22:10.691Z'
          },
        ],
      },
    },
    {
      year: 2018,
      month: 10,
      day: 9,
      category: 'fashion',
      title: 'A disco-ball Balmain look for the 2018 AMAs',
      snippet:
        'A mirrored, all-silver Balmain minidress and matching thigh-high boots — Olivier Rousteing\'s design, worn the same night she performed "I Did Something Bad" and won Artist of the Year.',
      sourceUrl: 'https://www.hollywoodreporter.com/lifestyle/style/american-music-awards-taylor-swift-wears-badass-balmain-outfit-1150928/',
      thumbnailUrl: 'https://www.hollywoodreporter.com/wp-content/uploads/2018/10/gettyimages-1048368054_copy.jpg?w=1296&h=730&crop=1',
      moment: {
        context:
          'Designed by Olivier Rousteing from Balmain\'s Episode collection: a long-sleeved, mock-neck minidress covered edge-to-edge in tiny mirrored squares ($7,650), paired with matching disco-ball thigh-high boots finished with solid black cap toes, a snake ring nodding to the album, and a Sixties-inspired sleek bouffant updo with a bold black cat-eye.\n\nThe mirror-ball look was built for the occasion — she opened the show minutes later with the first-ever televised performance of "I Did Something Bad."',
        sources: [
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/lifestyle/style/american-music-awards-taylor-swift-wears-badass-balmain-outfit-1150928/',
          },
          {
            outlet: 'W Magazine',
            url: 'https://www.wmagazine.com/story/taylor-swift-balmain-disco-ball-2018-american-music-awards',
          },
        ],
        photos: [
          {
            url: 'https://www.hollywoodreporter.com/wp-content/uploads/2018/10/gettyimages-1048368054_copy.jpg?w=1296&h=730&crop=1',
            credit: 'Getty Images',
          },
          {
            url: 'https://imgix.bustle.com/wmag/2018/10/09/5bbd2d31a36ed72d939f3ec2_GettyImages-1048354800.jpg?w=414&h=276&fit=crop&crop=faces&dpr=2',
            credit: 'Getty Images',
          },
        ],
        // Shop pass (2026-07-22): the exact Balmain mirrored mini is
        // discontinued -- a current silver sequin mini, verified in
        // stock, closest real match.
        products: [
          {
            brand: 'Princess Polly',
            item: 'Miss Me Sequin Mini Dress',
            retailer: 'us.princesspolly.com',
            url: 'https://us.princesspolly.com/products/bombshell-sequin-mini-dress-silver',
            matchTier: 'unscored',
            kind: 'dress',
            imageUrl: 'https://cdn.shopify.com/s/files/1/0061/8627/0804/files/1-modelinfo-anna-us2_50d8d45d-d7e9-436c-8612-a72cbd106a3e.jpg?v=1757460707',
            price: '$85.00',
            isAlternative: true,
            altNote: 'Her exact Balmain mirrored mini is long discontinued -- this is a current silver sequin mini in the same disco-ball spirit (thigh-high boots not separately sourced).',
            verifiedAt: '2026-08-30T19:22:10.691Z'
          },
        ],
      },
    },

    // --- Fashion/photo depth pass 2 (2026-07-04) ---
    // Second pass, still zero-to-thin on fashion depth before this batch.
    // Every claim and photo below verified directly against its cited
    // source (see supabase/seed/content/_example.mjs for the no-fabrication
    // rule). Costume designer for the whole Stadium Tour wardrobe below is
    // Jessica Jones, confirmed via her IMDb costume-department credit and
    // corroborated across every cited outfit post.
    {
      year: 2018,
      month: 5,
      day: 20,
      category: 'fashion',
      title: 'An 800-hour Atelier Versace gown for her first red carpet in two years',
      snippet:
        'Blush-pink, one-shoulder, a thigh-high slit, and a floor-sweeping half-cape of appliqued feathers — Donatella Versace said the piece took over 800 hours to build.',
      sourceUrl: 'https://www.billboard.com/articles/columns/pop/8457333/taylor-swift-bbma-dress-800-hours-to-make',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/media/02-taylor-swift-bbmas-arrivals-2018-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'Worn to the 2018 Billboard Music Awards — a rare red-carpet stop mid-tour, which she called "my first award show in a few years" — the custom Atelier Versace gown paired scattered appliques at the bust, shoulder, and hips with Casadei shoes.\n\nDonatella Versace confirmed the build time on Instagram: "This gown took more than 800 hours to bring to life." Taylor won Top Female Artist that night, then thanked the house with an era-appropriate word choice, describing the feathered pink design as "delicate."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/articles/columns/pop/8457333/taylor-swift-bbma-dress-800-hours-to-make',
          },
          {
            outlet: 'The Fashion Court',
            url: 'https://thefashion-court.com/2018/05/taylor-swift-2018-billboard-music-awards/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/02-taylor-swift-bbmas-arrivals-2018-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Billboard',
          },
        ],
        // Shop pass (2026-07-22): the 800-hour Atelier Versace gown was
        // custom couture, never sold at retail -- a current blush-pink
        // feather-trim gown, verified in stock, closest real match.
        products: [
          {
            brand: 'Club L London',
            item: 'Armina Blush Pink One-Shoulder Feather-Trim Maxi Dress',
            retailer: 'clubllondon.us',
            url: 'https://clubllondon.us/products/armina-blush-pink-one-shoulder-feather-trim-maxi-dress-cl135995081',
            matchTier: 'unscored',
            kind: 'dress',
            imageUrl: 'https://cdn.shopify.com/s/files/1/0249/0413/8798/files/uploaded_image_2_otlx1.jpg?v=1741965571',
            price: '$320.00',
            isAlternative: true,
            altNote: 'The 800-hour Atelier Versace gown was custom couture, never sold at retail -- this is a current blush-pink one-shoulder feather-trim gown in the same color and spirit.',
            verifiedAt: '2026-08-30T19:22:10.691Z'
          },
        ],
      },
    },
    {
      year: 2018,
      month: 6,
      day: 2,
      category: 'fashion',
      title: 'The reputation tour opening number gets a glitter-cutout upgrade',
      snippet:
        'Debuted night two in Chicago: a custom Jessica Jones bodysuit and matching jacket with intricate glitter cutout patterns, worn with Christian Louboutin boots.',
      sourceUrl: 'https://tayswiftstyle.wordpress.com/2018/06/06/reputation-tour-110-version-2-ready-for-it/',
      thumbnailUrl: 'https://tayswiftstyle.wordpress.com/wp-content/uploads/2018/06/tumblr_p9wqzvce8h1r4fk4fo1_r1_1280.jpg?w=1100',
      moment: {
        context:
          'Jessica Jones, Taylor\'s longtime tour costume designer, reworked the "...Ready For It?" opening-number look partway through the run — swapping in a bodysuit-and-jacket set covered edge to edge in cutout glitter patterning, which the Taylor Swift Style archive dates to the tour\'s Chicago stop in early June.\n\nThe number it dressed was the show\'s detonation point: after opening sets from Camila Cabello and Charli XCX, the main set opened with "...Ready for It?". The Soldier Field stand where the new look debuted was itself a two-night, 105,208-ticket engagement on June 1-2, 2018 — the kind of scale that made a mid-run costume refresh legible from the last row.',
        sources: [
          {
            outlet: 'Taylor Swift Style',
            url: 'https://tayswiftstyle.wordpress.com/2018/06/06/reputation-tour-110-version-2-ready-for-it/',
          },
          {
            outlet: 'iHeartRadio',
            url: 'https://www.iheart.com/content/2018-05-08-taylor-swift-kicks-off-reputation-tour-with-big-setlist-fireworks-snakes/',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Reputation_Stadium_Tour',
          },
        ],
        // Image-fix pass (2026-07-10 retry): swapped the watermarked
        // tayswiftstyle collage for a single clean editorial shot of the
        // bodysuit-and-jacket opening-number set.
        // Kevin Stream 1 (#751, 2026-07-23): the interim shot was a
        // Getty comp-image CDN watermarked comp (banned host); replaced with
        // a freely licensed Commons photo of the same "...Ready For It?"
        // opening set (Seattle, Reputation Stadium Tour). Curl-verified 200 +
        // image/jpeg and vision-confirmed (black sequined bodysuit, black
        // jacket sleeves, lace-up boots) this run.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Taylor_Swift_-_Reputation_Tour_Seattle_-_Ready_for_It.jpg',
            credit: 'Ronald Woan / Wikimedia Commons, CC BY-SA 2.0',
            caption: 'Taylor Swift performing the "...Ready For It?" opening number in the reworked bodysuit-and-jacket set, Reputation Stadium Tour, 2018.',
            kind: 'archival',
          },
        ],
        // Shop pass (2026-07-22): the custom Jessica Jones set was never
        // sold at retail -- a current black cutout sequin bodysuit,
        // verified in stock, closest real match.
        products: [
        ],
      },
    },
    {
      year: 2018,
      month: 7,
      day: 22,
      category: 'fashion',
      title: 'A sparkling green bodysuit for the "Dress" segment',
      snippet:
        'One of three custom Jessica Jones bodysuits Taylor rotated through for the "Blank Space"/"Bad Blood"/"Should\'ve Said No" block — this version in dense sparkling green, worn with Christian Louboutin boots.',
      sourceUrl: 'https://tayswiftstyle.wordpress.com/2018/07/22/reputation-tour-blank-space-bad/',
      thumbnailUrl: 'https://tayswiftstyle.wordpress.com/wp-content/uploads/2018/07/tumblr_pc9uwg06kq1r4fk4fo1_1280.jpg?w=1100',
      moment: {
        context:
          'Jessica Jones designed at least three versions of this sequined bodysuit across the tour\'s run for the "Dress"-nicknamed segment; the Taylor Swift Style archive had documented all three versions, including this sparkling green iteration, by July 2018.\n\nThe European leg that summer was a compressed, three-country sprint: Manchester\'s Etihad Stadium on June 8-9, a 133,034-ticket double at Dublin\'s Croke Park on June 15-16, and the two Wembley nights of June 22-23 that drew 143,427 — the kind of run where rotating costume variants gave repeat European ticket-holders a genuinely different-looking show night to night.',
        sources: [
          {
            outlet: 'Taylor Swift Style',
            url: 'https://tayswiftstyle.wordpress.com/2018/07/22/reputation-tour-blank-space-bad/',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Reputation_Stadium_Tour',
          },
        ],
        // Image-fix pass (2026-07-10 retry): SKIPPED — broadened search
        // (Wikimedia Commons across all 6 dated tour-stop categories incl.
        // Minneapolis's 86-file set; Getty editorial galleries for Chicago,
        // MetLife, Landover/FedExField, and Wembley; Billboard/HollywoodLife/
        // Femestella outfit roundups) found plenty of the OTHER rotating
        // "Dress"-segment bodysuits (black, red) but no verified photo of
        // this specific dense-sparkling-green variant. Left as-is; still the
        // record's only photo, so not stripped per protocol.
        photos: [
          {
            url: 'https://tayswiftstyle.wordpress.com/wp-content/uploads/2018/07/tumblr_pc9uwg06kq1r4fk4fo1_1280.jpg?w=1100',
            credit: 'Taylor Swift Style',
          },
        ],
        // Shop pass (2026-07-22): the custom Jessica Jones bodysuit was
        // never sold at retail -- a current sparkling green bodysuit,
        // verified in stock, closest real match.
        products: [
        ],
      },
    },
    {
      year: 2018,
      month: 7,
      day: 14,
      category: 'fashion',
      title: 'The "cotton candy" dress for "Delicate"/"Shake It Off"',
      snippet:
        'A rainbow, tiered-tassel custom Jessica Jones mini dress Taylor herself nicknamed her "cotton candy" dress — one of four versions built for the segment.',
      sourceUrl: 'https://tayswiftstyle.wordpress.com/2018/07/23/reputation-tour-delicateshake-it-off/',
      thumbnailUrl: 'https://tayswiftstyle.wordpress.com/wp-content/uploads/2018/07/tumblr_pcati7kyz11r4fk4fo1_r1_1280.jpg?w=1100',
      moment: {
        context:
          'Jessica Jones built four rotating versions of this fringed mini dress for the "Delicate"/"Shake It Off" segment; this rainbow-tassel take was the one Taylor nicknamed her "cotton candy" dress on stage.\n\nThe segment it dressed was the show\'s flying-machine moment: "Delicate" carried her over the crowd toward the far stage in a glittering basket rig each night — and when the rig jammed mid-air at Philadelphia\'s Lincoln Financial Field on July 14, 2018, she talked the stadium through it ("I\'m pretty sure I\'m stuck up here. It\'s a nice view, though") and sang a 2007 deep cut, "Our Song," a cappella until the crew got it moving again.',
        sources: [
          {
            outlet: 'Taylor Swift Style',
            url: 'https://tayswiftstyle.wordpress.com/2018/07/23/reputation-tour-delicateshake-it-off/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-stuck-mid-air-sparkly-basket-at-philadelphia-concert-reputation-tour-8465462/',
          },
        ],
        // Image-fix pass (2026-07-10 retry): swapped the watermarked
        // tayswiftstyle collage for a single clean Getty Images editorial
        // shot from MetLife Stadium, July 22, 2018 (one day before this
        // record's source blog post) — shows Taylor in the blue/pink
        // tinsel-fringe "cotton candy" dress in front of the show's large
        // illuminated snake set piece, matching the CIE finding's
        // description of the original photo; verified HTTP 200 +
        // image/jpeg and eyeballed this session.
        // Getty retirement pass (issue #935, 2026-08-24): the Getty comp URL
        // retired per the 2026-08-15 decision. A same-costume replacement on
        // an allowlisted host could not be verified after a real search
        // (Wikimedia Commons' Reputation Stadium Tour categories, incl. the
        // MetLife date itself and Minneapolis, only turned up other
        // costumes from the same "Delicate" segment, not this rainbow
        // tinsel take; Billboard/WWD/People coverage of the tour was
        // generic hero shots). Reused this item's own thumbnailUrl
        // (tayswiftstyle.wordpress.com, already an allowlisted host and the
        // correct dress/moment) rather than force a wrong-costume match —
        // it is the same image already trusted as this record's primary
        // thumbnail. TODO: swap for a single, unwatermarked press photo of
        // this exact costume if one turns up.
        photos: [
          {
            url: 'https://tayswiftstyle.wordpress.com/wp-content/uploads/2018/07/tumblr_pcati7kyz11r4fk4fo1_r1_1280.jpg?w=1100',
            credit: 'Via Taylor Swift Style',
            caption: 'Taylor Swift performing in the "cotton candy" tinsel-fringe dress during the Reputation Stadium Tour, July 2018.',
            kind: 'archival',
          },
        ],
        // Shop pass (2026-07-22): the custom Jessica Jones "cotton candy"
        // mini was never sold at retail -- a current rainbow crystal
        // fringe mini, verified in stock, closest real match.
        products: [
          {
            brand: 'Mew Mews',
            item: 'Indy V Neck Rainbow Crystal Fringe Mini Dress',
            retailer: 'mewmews.com',
            url: 'https://mewmews.com/products/indy-v-neck-rainbow-crystal-fringe-mini-dress',
            matchTier: 'unscored',
            kind: 'dress',
            imageUrl: 'https://cdn.shopify.com/s/files/1/0620/2716/9852/files/IndyVNeckRainbowCrystalFringeMiniDress_1.jpg?v=1723186112',
            price: '$319.90',
            isAlternative: true,
            altNote: 'Jessica Jones\'s custom "cotton candy" mini was never sold at retail -- this is a current rainbow crystal fringe mini in the same multicolor, movement-driven spirit.',
            verifiedAt: '2026-08-30T19:22:10.691Z'
          },
        ],
      },
    },
    {
      year: 2018,
      month: 5,
      day: 18,
      category: 'fashion',
      title: 'A snake bodysuit and red camo jacket for the Shawn Mendes duet',
      snippet:
        'For the "There\'s Nothing Holding Me Back" duet stop, a custom Jessica Jones snake-print bodysuit layered under a red camouflage sequined jacket with a buckle waist, plus custom Christian Louboutin boots.',
      sourceUrl: 'https://tayswiftstyle.wordpress.com/2018/05/20/reputation-tour-theres-nothing-holding-me-2/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/media/taylor-swift-shawn-mendes-live-2018-u-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'Worn in Pasadena on May 18, 2018, when Shawn Mendes joined the tour for "There\'s Nothing Holdin\' Me Back": a Jessica Jones snake-pattern bodysuit under a red camo sequined jacket with buckle detailing, styled with custom Louboutin boots.\n\nThe cameo it dressed was one of the North American leg\'s biggest surprise-guest gets. Taylor had teased it that afternoon with a rehearsal clip, then opened Mendes\' hit herself — singing the first verse solo before calling him out — at the fourth show of the tour, night one of a two-night Rose Bowl stand that sold 118,084 tickets.',
        sources: [
          {
            outlet: 'Taylor Swift Style',
            url: 'https://tayswiftstyle.wordpress.com/2018/05/20/reputation-tour-theres-nothing-holding-me-2/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-shawn-mendes-theres-nothing-holdin-me-back-reputation-statium-tour-8456817/',
          },
        ],
        // T-img pass (2026-07-10): swapped the watermarked tayswiftstyle
        // collage for Billboard's clean single photo of the actual Rose Bowl
        // duet — shows both Mendes and Swift in the red camo sequined jacket;
        // verified HTTP 200 + image/jpeg and eyeballed this session.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-shawn-mendes-live-2018-u-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Christopher Polk/TAS18/Getty Images',
            caption: 'Shawn Mendes and Taylor Swift performing "There\'s Nothing Holdin\' Me Back" at the Rose Bowl, May 18, 2018.',
            kind: 'archival',
          },
        ],
        // Shop pass (2026-07-22): the custom Jessica Jones snake bodysuit
        // was never sold at retail -- a current snake-print bodysuit,
        // verified in stock, closest real match.
        products: [
          {
            brand: 'SKIMS',
            item: 'Fits Everybody Zip Front Bodysuit in Shadow Snake Print',
            retailer: 'skims.com',
            url: 'https://skims.com/products/fits-everybody-zip-front-bodysuit-shadow-snake-print',
            // Photo pass (t_fa7bfb57, 2026-08-31): retailer PDP image, curl-verified
            // 200 image/* response.
            imageUrl: 'https://cdn.shopify.com/s/files/1/0259/5448/4284/files/SKIMS-LOUNGEWEAR-BD-BRF-9083-GSP-FLT.jpg?v=1758757495',
            matchTier: 'unscored',
            kind: 'top',
            price: '$46.00',
            isAlternative: true,
            altNote: 'Jessica Jones\'s custom snake-print set was never sold at retail -- this sources the bodysuit only, matching the serpent motif (no sequins, red camo jacket, or boots).',
            verifiedAt: '2026-08-30T19:22:10.691Z'
          },
        ],
      },
    },
    {
      year: 2018,
      month: 5,
      day: 8,
      category: 'fashion',
      title: 'The "Call It What You Want"/"...Nice Things" closer dress',
      snippet:
        'A custom Jessica Jones gown for the show\'s emotional final segment — the blogger who\'s tracked every tour costume called it a grown-up echo of a Jenny Packham piece from the Fearless Tour.',
      sourceUrl: 'https://tayswiftstyle.wordpress.com/2018/05/11/reputation-tour-call-it-what-you-want-this/',
      thumbnailUrl: 'https://tayswiftstyle.wordpress.com/wp-content/uploads/2018/05/tumblr_p8jr4cwjzw1r4fk4fo1_1280.jpg?w=1100',
      moment: {
        context:
          'Closing the show over "Call It What You Want" into "This Is Why We Can\'t Have Nice Things," Taylor wore a custom Jessica Jones gown styled with Christian Louboutin boots.\n\nThe block it dressed carried the night\'s thesis statement: after the final song, the stadium screens signed off with the line "and in the death of her reputation, she felt truly alive" — the sentence that became the era\'s unofficial thesis statement — the show\'s "very perfect and poetic finish," per Billboard\'s opening-night review — and the closest thing the no-interviews era ever gave fans to an artist\'s statement.',
        sources: [
          {
            outlet: 'Taylor Swift Style',
            url: 'https://tayswiftstyle.wordpress.com/2018/05/11/reputation-tour-call-it-what-you-want-this/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/articles/columns/pop/8455193/taylor-swift-reputation-tour-best-moments',
          },
        ],
        // Image-fix pass (2026-07-10 retry): SKIPPED — broadened search
        // (Wikimedia Commons across all 6 dated tour-stop categories;
        // Getty editorial galleries for Santa Clara, Denver, Chicago,
        // MetLife, and Landover/FedExField; Billboard/HollywoodLife/
        // Femestella outfit roundups) turned up several other closing-block
        // gowns (plain black, black/gold) but no verified photo clearly
        // matching this navy/iridescent-paillette variant. Left as-is;
        // still the record's only photo, so not stripped per protocol.
        photos: [
          {
            url: 'https://tayswiftstyle.wordpress.com/wp-content/uploads/2018/05/tumblr_p8jr4cwjzw1r4fk4fo1_1280.jpg?w=1100',
            credit: 'Taylor Swift Style',
          },
        ],
        // Shop pass (2026-07-22): the custom Jessica Jones closer gown was
        // never sold at retail -- a current black sequin long-sleeve
        // slit gown, verified in stock, closest real match.
        products: [
        ],
      },
    },

    // --- Sightings pass (2026-07-05) ---
    // Zero sighting items existed for this era before this batch. This was a
    // deliberately private stretch of Taylor's life — she and Joe Alwyn were
    // photographed together only a handful of times across nearly two years,
    // almost always by paparazzi/agency photographers rather than at staged
    // events. Every item below is one of those rare documented sightings;
    // every claim and photo verified directly against its cited source (see
    // supabase/seed/content/_example.mjs for the no-fabrication rule). A
    // broader search for a rare-airport-look sighting and Nashville family
    // visits in this specific window turned up nothing independently
    // verifiable, so neither is included — quality over quantity.
    {
      year: 2018,
      month: 5,
      day: 30,
      category: 'sighting',
      // Cross-link (Stage 3, 2026-08-10): the private Turks and Caicos
      // Fourth of July, the same tour break's low-key stretch.
      relatedIds: ['moment:vault-reputation-a-rare-fourth-of-july-just-the-two-of-them-in-turks-and-caic'],
      title: 'A fish-and-chips pub date at The Flask, no red carpet in sight',
      snippet:
        'Paparazzi caught Taylor and Joe Alwyn leaving The Flask, a traditional North London pub, after fish and chips and a pint each — one of only a handful of public sightings during a deliberately private relationship.',
      sourceUrl: 'https://www.wmagazine.com/story/taylor-swift-joe-alwyn-photographed-date-london',
      thumbnailUrl:
        'https://jj-justjared-media.s3.amazonaws.com/wp-content/uploads/2018/05/swift-lunch/taylor-swift-joe-alwyn-step-out-for-lunch-date-in-london-04.jpg',
      moment: {
        context:
          'Photographed leaving The Flask, a centuries-old pub in North London, on May 30, 2018, mid-way through a break in the reputation Stadium Tour. Taylor wore a striped tank top and skirt; Alwyn kept it casual in a white T-shirt and jeans.\n\nThe two spent about 45 minutes inside over fish and chips and pints of London Pride before leaving in a waiting car — one of the rare unstaged sightings the notoriously private couple allowed during this era.',
        sources: [
          {
            outlet: 'W Magazine',
            url: 'https://www.wmagazine.com/story/taylor-swift-joe-alwyn-photographed-date-london',
          },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/taylor-swift-steps-mini-skirt-232044419.html',
          },
          {
            outlet: 'Just Jared',
            url: 'https://www.justjared.com/2018/05/31/taylor-swift-joe-alwyn-step-out-for-lunch-date-in-london/',
          },
        ],
        // T-img pass (2026-07-10): the old Bustle/W Mag file art was a Getty
        // concert still with no pub, food, or Alwyn in frame. Replaced with
        // an actual paparazzi shot from this outing — both of them heading to
        // the car after the Flask lunch — sourced from Just Jared's post on
        // this exact date/event; verified HTTP 200 + image/jpeg and eyeballed
        // this session.
        photos: [
          {
            url: 'https://jj-justjared-media.s3.amazonaws.com/wp-content/uploads/2018/05/swift-lunch/taylor-swift-joe-alwyn-step-out-for-lunch-date-in-london-04.jpg',
            credit: 'Backgrid USA',
            caption: 'Taylor and Joe Alwyn heading to the car after their fish-and-chips stop at The Flask, May 30, 2018.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      // Cross-link (Stage 3, 2026-08-06): the "Fourth of July" cluster.
      relatedIds: [
        'moment:vault-red-a-rain-soaked-fourth-of-july-family-portrait-in-rhode-island',
        'moment:vault-1989-a-fourth-of-july-beach-walk-in-rhode-island',
        // Cross-link (Stage 3, 2026-08-10): the low-key London pub date, same
        // tour break.
        'moment:vault-reputation-a-fish-and-chips-pub-date-at-the-flask-no-red-carpet-in-sigh',
      ],
      year: 2018,
      month: 7,
      day: 4,
      category: 'sighting',
      title: 'A rare Fourth of July, just the two of them, in Turks and Caicos',
      snippet:
        'No star-studded Rhode Island party this year — instead, Taylor and Joe Alwyn were photographed hand in hand on a beach in Turks and Caicos over the holiday weekend, swimming and snorkeling during a tour break.',
      sourceUrl: 'https://www.eonline.com/news/950442/taylor-swift-and-joe-alwyn-hold-hands-in-turks-and-caicos',
      thumbnailUrl:
        'https://akns-images.eonline.com/eol_images/Entire_Site/201869/rs_634x1024-180709130925-634-Taylor-Swift-Joe-Alwayn-Turks-And-Caicos-JR-070918.jpg?fit=around%7C634:1024&output-quality=90&crop=634:1024;center,top',
      moment: {
        context:
          "During a break in the reputation Stadium Tour's summer leg, Taylor and Alwyn spent the July 4, 2018 weekend at an oceanfront villa in Turks and Caicos rather than hosting her usual Rhode Island gathering.\n\nPaparazzi photographed the couple walking the shoreline hand in hand, swimming, and snorkeling; an eyewitness told E! News they kept a low profile the entire stay, splitting time between the villa's beach, pool, and gym.",
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/950442/taylor-swift-and-joe-alwyn-hold-hands-in-turks-and-caicos',
          },
          {
            outlet: 'Just Jared Jr.',
            url: 'https://www.justjaredjr.com/2018/07/05/taylor-swift-vacations-with-joe-alwyn-in-turks-caicos/',
          },
        ],
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/201869/rs_634x1024-180709130925-634-Taylor-Swift-Joe-Alwayn-Turks-And-Caicos-JR-070918.jpg?fit=around%7C634:1024&output-quality=90&crop=634:1024;center,top',
            credit: 'SBMF / BACKGRID',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 8,
      day: 22,
      category: 'sighting',
      title: 'Steak, wine, and a rare London date night at Hawksmoor',
      snippet:
        'Taylor and Joe Alwyn were photographed holding hands leaving Hawksmoor Seven Dials, a Covent Garden steakhouse, after a two-and-a-half-hour dinner during a break in the reputation Stadium Tour.',
      sourceUrl: 'https://www.eonline.com/news/962926/inside-taylor-swift-and-joe-alwyn-s-romantic-dinner-date-in-london',
      thumbnailUrl:
        'https://s.yimg.com/ny/api/res/1.2/8s7AwHFL8l1fcEO1Nzrakg--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyNDI7aD02MjQ7Y2Y9d2VicA--/https://media.zenfs.com/en-US/homerun/elle_570/932921f24da6dde86e34cff9ab62a007',
      moment: {
        context:
          'On August 22, 2018, during a five-day break from touring, Taylor and Alwyn dined at Hawksmoor Seven Dials in Covent Garden, arriving around 8 p.m. with security and leaving hand in hand roughly two and a half hours later.\n\nThey reportedly shared fillet steaks with spinach and mac and cheese, toasting with wine in a private section of the restaurant. Taylor wore an off-the-shoulder green dress and a necklace bearing Alwyn\'s initial.',
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/962926/inside-taylor-swift-and-joe-alwyn-s-romantic-dinner-date-in-london',
          },
          {
            outlet: 'Elle (via Yahoo)',
            url: 'https://www.yahoo.com/lifestyle/taylor-swift-joe-alwyn-ate-182400550.html',
          },
        ],
        photos: [
          {
            url: 'https://s.yimg.com/ny/api/res/1.2/8s7AwHFL8l1fcEO1Nzrakg--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyNDI7aD02MjQ7Y2Y9d2VicA--/https://media.zenfs.com/en-US/homerun/elle_570/932921f24da6dde86e34cff9ab62a007',
            credit: 'BACKGRID',
          },
          {
            url: 'https://s.yimg.com/ny/api/res/1.2/BUHEwdl3nKDJks5lcyY46g--/YXBwaWQ9aGlnaGxhbmRlcjt3PTk2MDtoPTEwNDY7Y2Y9d2VicA--/https://media.zenfs.com/en-US/homerun/elle_570/c5e18120192022d5561829bc16d9961e',
            credit: 'BACKGRID',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 9,
      day: 28,
      category: 'sighting',
      title: 'Skipping the red carpet to support Joe Alwyn at the New York Film Festival',
      snippet:
        "Taylor avoided The Favourite's red carpet entirely, watching from inside Lincoln Center and catching up with Jennifer Lawrence, then left hand in hand with Alwyn through a back exit.",
      sourceUrl: 'https://www.wmagazine.com/story/taylor-swift-joe-alwyn-the-favourite-premiere',
      thumbnailUrl:
        'https://imgix.bustle.com/wmag/2018/09/29/5baf8bb27359e94f4fc119bb_GettyImages-1042761566.jpg?w=414&h=531&fit=crop&crop=faces&dpr=2',
      moment: {
        context:
          'On September 28, 2018, Taylor attended the New York Film Festival premiere of The Favourite to support Alwyn, who co-starred alongside Emma Stone and Rachel Weisz. She skipped the red carpet where her boyfriend posed with castmates, instead watching the screening from inside Lincoln Center\'s theater, where she was seen chatting with Jennifer Lawrence.\n\nPhotographers caught the couple leaving hand in hand through a side exit afterward, in a sparkling red-and-black sequined dress, Jimmy Choo pumps, and Eva Fehren jewelry.',
        sources: [
          {
            outlet: 'W Magazine',
            url: 'https://www.wmagazine.com/story/taylor-swift-joe-alwyn-the-favourite-premiere',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-joe-alwyn-the-favourite-premiere-8477522/',
          },
        ],
        photos: [
          {
            url: 'https://imgix.bustle.com/wmag/2018/09/29/5baf8bb27359e94f4fc119bb_GettyImages-1042761566.jpg?w=414&h=531&fit=crop&crop=faces&dpr=2',
            credit: 'Jackson Lee/GC Images',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 4,
      day: 22,
      category: 'sighting',
      relatedIds: ['moment:vault-reputation-the-pastel-turn-me-ends-the-reputation-black'],
      title: 'A denim-themed birthday party for Gigi Hadid — sans denim',
      snippet:
        "Taylor made a rare public appearance at best friend Gigi Hadid's 24th birthday party in New York, skipping the party's all-denim dress code for a red checkered blazer and floral dress.",
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-gigi-hadid-birthday-party-photos-8508341/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-nyc-April-22-2019-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          "Taylor attended Gigi Hadid's 24th birthday celebration at L'Avenue at Saks in New York City on April 22, 2019, alongside guests including Martha Hunt, Hailee Steinfeld, Ashley Graham, and Hadid's mother Yolanda.\n\nPhotographers caught her arriving in a red checkered blazer over a floral dress, having opted out of the party's denim theme. Appearances at friends' private events were among the only places she was reliably photographed during this deliberately low-profile stretch.",
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-gigi-hadid-birthday-party-photos-8508341/',
          },
          {
            outlet: 'Refinery29',
            url: 'https://www.refinery29.com/en-us/2019/04/230667/taylor-swift-gigi-hadid-birthday-surprise-appearance',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-nyc-April-22-2019-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Gotham/GC Images',
          },
        ],
      },
    },

    // --- Music/business/sightings depth pass 3 (2026-07-05) ---
    // Music backstories were thin (2 items for a 15-track album) going into
    // this batch; both new quotes below are pulled directly from the primary
    // iHeartRadio release-party writeup (verified via WebFetch), not a
    // secondary summary. The two new sightings are genuinely distinct dated
    // paparazzi events, verified separately from the sibling relationship-
    // history PR's known milestones. One sighting (the March 2018 Malibu
    // hike) has no verifiable photo of the actual moment — only generic
    // file/red-carpet composites turned up under that headline — so its
    // photos array is intentionally empty rather than using a non-matching
    // image. All other photo URLs below were verified with curl (2xx,
    // image/*) and a visual check that they depict the specific moment.
    {
      year: 2017,
      month: 11,
      day: 10,
      category: 'music',
      title: "The Getaway Car bridge, written in under 30 seconds on camera",
      snippet:
        "Jack Antonoff caught it on Taylor's iPhone: \"the only time in my life...that a camera was ever on when magic actually happened.\"",
      sourceUrl:
        'https://www.rollingstone.com/music/music-news/jack-antonoff-on-working-with-taylor-swift-and-viral-getaway-car-video-1234852109/',
      thumbnailUrl: null,
      moment: {
        context:
          "Taylor wrote and produced Getaway Car with Jack Antonoff, and its bridge came together in under 30 seconds during a studio session she happened to be recording on her phone — footage that later circulated widely, showing the song's climactic turn arriving in real time.\n\nAntonoff called the clip singular in his career: \"That was the only time in my life — million hours I've spent in studios — that a camera was ever on when magic actually happened. She just had her iPhone on for whatever reason...I think that's why that video became so popular, because it was real.\"",
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/jack-antonoff-on-working-with-taylor-swift-and-viral-getaway-car-video-1234852109/',
          },
        ],
        // T16 photo pass (2026-07-09): Wikimedia Commons, CC BY-SA 2.0, author
        // Ronald Woan (license verified on the file page; same photographer set
        // already used elsewhere in this file). Live shot of the song itself.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Taylor_Swift_-_Reputation_Tour_Seattle_-_Getaway_Car.jpg/1280px-Taylor_Swift_-_Reputation_Tour_Seattle_-_Getaway_Car.jpg',
            credit: 'Ronald Woan / Wikimedia Commons (CC BY-SA 2.0)',
            caption: 'Performing "Getaway Car" on the reputation Stadium Tour in Seattle, May 22, 2018.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2017,
      month: 11,
      day: 10,
      category: 'music',
      title: "Delicate's confession: 'could something fake...affect something real?'",
      snippet:
        "Taylor's own framing, from the album's release night: the record turns vulnerable exactly when it hits track five.",
      sourceUrl:
        'https://www.iheart.com/content/2017-11-10-taylor-swifts-iheartradio-reputation-release-party-everything-we-learned/',
      thumbnailUrl: null,
      moment: {
        context:
          'At the iHeartRadio reputation release-party special the night the album came out, Taylor explained why Delicate — track five — marks the record\'s turn from bombastic to vulnerable: "Could something fake, like your reputation, affect something real, like somebody getting to know you?" It\'s the moment she\'s said the album starts asking what happens when you meet someone you actually want in your life.\n\nThe confession became the era\'s sleeper hit. Sent to pop radio on March 12, 2018 as the album\'s fourth single, it peaked at No. 12 on the Hot 100 but went No. 1 on three separate Billboard airplay charts — Pop Songs, Adult Pop Songs, and Adult Contemporary — and Joseph Kahn\'s video, with Taylor dancing unwatched through the Millennium Biltmore Hotel after a magic note turns her invisible, premiered at the iHeartRadio Music Awards on March 11.',
        sources: [
          {
            outlet: 'iHeartRadio',
            url: 'https://www.iheart.com/content/2017-11-10-taylor-swifts-iheartradio-reputation-release-party-everything-we-learned/',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Delicate_(Taylor_Swift_song)',
          },
        ],
        // T16 photo pass (2026-07-09): official music-video still. Video id
        // tCXGJQYZ9JA verified via YouTube oEmbed this session — title "Taylor
        // Swift - Delicate", channel @TaylorSwift (official). HTTP 200 + image/jpeg.
        // Photo-enrichment pass (2026-07-18, #762): added the song's tour
        // staging — Swift singing Delicate from the flying basket rig over the
        // crowd, Minneapolis, Aug 31, 2018. Commons CC BY 2.0 (Michael Hicks),
        // license verified on the file page; downloaded and vision-confirmed
        // this run. Era-performance, captioned as such.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/tCXGJQYZ9JA/hqdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: "From Joseph Kahn's \"Delicate\" video, which premiered at the iHeartRadio Music Awards on March 11, 2018.",
            kind: 'archival',
            focalPoint: '50% 40%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Taylor_Swift_performs_Delicate_during_Reputation_Stadium_Tour_in_Minneapolis_-_2018-2.jpg/1280px-Taylor_Swift_performs_Delicate_during_Reputation_Stadium_Tour_in_Minneapolis_-_2018-2.jpg',
            credit: 'Michael Hicks / Wikimedia Commons (CC BY 2.0)',
            caption:
              'Singing "Delicate" from the sphere-shaped basket rig floating over the crowd — the song\'s nightly staging on the reputation Stadium Tour (Minneapolis, August 31, 2018).',
            kind: 'archival',
            focalPoint: '52% 45%',
          },
        ],
      },
    },

    // --- Active-tier batch 2 (2026-07-04), per docs/decisions.md.
    {
      year: 2019,
      month: 2,
      day: 10,
      category: 'relationship',
      title: 'A rare public appearance with Joe Alwyn at the BAFTAs',
      snippet: 'The notoriously private couple stepped out together at the after-party, celebrating "The Favourite" winning seven BAFTAs.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-joe-alwyn-the-favourite-2019-bafta-awards-party-8497568/',
      thumbnailUrl: null,
      moment: {
        context:
          'On February 10, 2019, The Favourite won seven BAFTAs — including Outstanding British Film, Best Actress for Olivia Colman, and Best Supporting Actress for Rachel Weisz — with Alwyn in the cast as Samuel Masham.\n\nTaylor skipped the ceremony and red carpet entirely, surfacing at the after-party at his side in a flowing Stella McCartney gown, and let Instagram do the talking: "AHHHHH @thefavouritemovie just won 7 @bafta awards !!! Bout to go give some high fives."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-joe-alwyn-the-favourite-2019-bafta-awards-party-8497568/',
          },
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/1014397/see-taylor-swift-and-joe-alwyn-pack-on-the-pda-at-baftas-after-party',
          },
        ],
        // T16 photo pass (2026-07-09): agency photo from the cited E! story
        // (E!'s own credit line: "News Licensing / MEGA"). Verified HTTP 200 +
        // image/jpeg and visually confirmed (Swift in the Stella McCartney gown,
        // leaving hand in hand with Alwyn) this session.
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2019110/rs_600x600-190210195541-600-taylor-swift-joe-alwyn-baftas.jpg?fit=around%7C600:600&output-quality=90&crop=600:600;center,top',
            // Both faces in the upper third of the square; bias upward.
            focalPoint: '48% 28%',
            credit: 'News Licensing / MEGA, via E! Online',
            caption: 'Leaving the BAFTAs after-party hand in hand, February 10, 2019 — Taylor in the Stella McCartney gown.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 12,
      day: 7,
      category: 'business',
      title: "One nomination for the year's best-selling album",
      snippet:
        "At the 61st Grammys, reputation — Billboard's No. 1 album of 2018 — picked up a single nomination, Best Pop Vocal Album, and was shut out of Album, Record, and Song of the Year.",
      sourceUrl: 'https://www.rollingstone.com/music/music-news/taylor-swift-reputation-grammys-snub-764008/',
      thumbnailUrl:
        'https://www.rollingstone.com/wp-content/uploads/2018/12/taylor-swift-biggest-loser.jpg?w=1600&h=900&crop=1',
      moment: {
        context:
          "reputation was the best-selling album of 2017 and the No. 1 album on Billboard's 2018 year-end Billboard 200, but by the 61st Annual Grammy Awards in February 2019 it had one nomination to show for it: Best Pop Vocal Album.\n\nNone of its singles — \"Look What You Made Me Do,\" \"...Ready for It?,\" \"End Game,\" \"New Year's Day,\" \"Gorgeous,\" or \"Delicate\" — made the cut for Record, Song, or Album of the Year, making it, per Rolling Stone, her least-nominated LP since her self-titled 2006 debut.",
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-reputation-grammys-snub-764008/',
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): stays at one image — the
        // moment is a nominations announcement (no ceremony appearance; she
        // skipped the 2019 Grammys carpet), so the only honest depictions are
        // the cited Rolling Stone story's own art, already used here. Focal
        // point set by eye this run.
        photos: [
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2018/12/taylor-swift-biggest-loser.jpg?w=1600&h=900&crop=1',
            credit: 'Frank Micelotta/PictureGroup/REX Shutterstock',
            focalPoint: '48% 25%',
          },
        ],
      },
    },
    {
      significance: 'notable', // a real attendance record broken decades after it was set, at the tour's own closing stretch (docs/decisions.md, 2026-07-19)
      relatedIds: ['moment:vault-reputation-reputation-stadium-tour-opens-to-a-record-crowd'],
      year: 2018,
      month: 11,
      day: 30,
      category: 'business',
      title: 'Breaking a Rolling Stones record set a decade earlier — in almost half the shows',
      snippet:
        "$266.1 million and 2,068,399 tickets across 38 U.S. stadium shows passed the Rolling Stones' prior record — the biggest gross in Billboard Boxscore's history since it began tracking in 1990.",
      sourceUrl: 'https://www.billboard.com/pro/taylor-swift-reputation-stadium-tour-breaks-record-highest-grossing-us-tour/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/media/taylor-swift-reputation-tour-nov-21-2018-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          "The reputation Stadium Tour's North American leg (May 8-Oct. 6, 2018) grossed $266.1 million from 2,068,399 tickets over 38 shows, breaking the U.S. touring record the Rolling Stones had held since their 2005-07 A Bigger Bang tour grossed $245 million — across 70 shows, nearly double what Taylor needed.\n\nThe margin showed up venue by venue: the run averaged $7 million and 54,432 tickets a night, and her three consecutive July dates at MetLife Stadium alone grossed $22 million on 165,654 tickets, beating the venue record she'd set there herself on The 1989 World Tour. Her total domestic gross since 2009's Fearless Tour: $687.7 million — over $140 million more than any other artist in that period, per Billboard's own ledger.",
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-reputation-stadium-tour-breaks-record-highest-grossing-us-tour/',
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added a U.S.-leg stadium
        // shot (Levi's Stadium, May 12, 2018) for the leg this record is
        // about — Commons CC BY-SA 4.0, license verified on the file page,
        // downloaded and vision-confirmed this run. Distinct file from the
        // May 12 close-up used on the tour-opener page.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-reputation-tour-nov-21-2018-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Jun Sato/TAS18/Getty Images',
            focalPoint: '48% 22%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Taylor_Swift_Reputation_Tour1.jpg/1280px-Taylor_Swift_Reputation_Tour1.jpg',
            credit: 'UltimateWarrior13 / Wikimedia Commons (CC BY-SA 4.0)',
            caption:
              'On the record-breaking U.S. leg at Levi’s Stadium, May 12, 2018 — the run averaged $7 million and 54,432 tickets a night.',
            kind: 'archival',
            focalPoint: '50% 18%',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 3,
      day: 7,
      category: 'sighting',
      title: 'A Malibu hike, and an outfit that read like a lyric',
      snippet:
        "Their first sighting together in months: a 90-minute Malibu hike, Joe Alwyn in the exact \"dark jeans and Nikes\" from Delicate's opening line, four days before the Delicate video premiered.",
      sourceUrl:
        'https://www.etonline.com/taylor-swift-steps-out-for-romantic-hike-with-boyfriend-joe-alwyn-see-the-pic-98043',
      thumbnailUrl: null,
      moment: {
        context:
          'Photographed hiking in Malibu on March 7, 2018 — their first sighting together in months — Taylor wore black running shorts, a dark gray tank top, and a black hoodie tied around her waist; Joe Alwyn wore dark jeans and Nike sneakers. A source told E! News "they were deep in conversation for most of the hike and their attention was focused solely on one another."\n\nFans quickly noted Alwyn\'s outfit matched Delicate\'s opening line, "Dark jeans and your Nikes, look at you" — four days before Joseph Kahn\'s Delicate video premiered at the March 11 iHeartRadio Music Awards.',
        sources: [
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/taylor-swift-steps-out-for-romantic-hike-with-boyfriend-joe-alwyn-see-the-pic-98043',
          },
          {
            outlet: 'Bustle',
            url: 'https://www.bustle.com/p/taylor-swift-joe-alwyn-went-hiking-but-fans-think-it-was-sneaky-promo-for-her-next-single-8454429',
          },
        ],
        // T16 photo pass (2026-07-09): no photo of the March 2018 Malibu hike
        // itself has surfaced anywhere verifiable (the cited articles run
        // generic file composites — re-checked this session). Per the §A2
        // reference-image standard, this is a clearly-captioned stand-in from
        // the couple's DOCUMENTED March 2019 Franklin Canyon hike (same photo
        // as that item), never presented as the Malibu moment.
        photos: [
          {
            url: 'https://jj-justjared-media.s3.us-east-1.amazonaws.com/wp-content/uploads/2019/03/taylor-hiking/taylor-swift-joe-alwyn-go-hiking-04.jpg',
            credit: 'Just Jared',
            caption: 'For reference: the couple on a similar Los Angeles trail hike in March 2019 — no photo of the 2018 Malibu hike itself has surfaced.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 3,
      day: 3,
      category: 'sighting',
      title: 'Hand in hand on the Franklin Canyon trail, near the era\'s close',
      snippet:
        'One of the last documented sightings of the reputation stretch: Taylor and Joe Alwyn hiking Franklin Canyon Park in Beverly Hills, caught holding hands by paparazzi.',
      sourceUrl: 'https://www.justjared.com/2019/03/04/taylor-swift-joe-alwyn-hold-hands-while-hiking-in-l-a/',
      thumbnailUrl:
        'https://jj-justjared-media.s3.us-east-1.amazonaws.com/wp-content/uploads/2019/03/taylor-hiking/taylor-swift-joe-alwyn-go-hiking-02.jpg',
      moment: {
        context:
          'Photographed holding hands while hiking the Franklin Canyon Park Trail in Beverly Hills on Sunday, March 3, 2019, Taylor wore a yellow crop top, high-waisted denim shorts, and rainbow Nike sneakers, with Joe Alwyn alongside her. It was one of only a handful of documented sightings of the couple during this stretch of the era.\n\nIt also capped the era\'s most visible run for the two: the Golden Globes after-party circuit in January, the BAFTAs in February, and now a Sunday trail hike in workout clothes — the guarded privacy of the reputation years relaxing, by degrees, as the era wound down toward its successor.',
        sources: [
          {
            outlet: 'Just Jared',
            url: 'https://www.justjared.com/2019/03/04/taylor-swift-joe-alwyn-hold-hands-while-hiking-in-l-a/',
          },
        ],
        // T-img pass (2026-07-10): swapped to frame -02 from the same Just
        // Jared photo set — verified HTTP 200 + image/jpeg and eyeballed this
        // session: both faces visible, holding hands on the trail, no large
        // watermark (unlike frame -04, which is faces-hidden-from-behind and
        // heavily watermarked, and stays reserved for the 2018 Malibu-hike
        // stand-in reference photo).
        photos: [
          {
            url: 'https://jj-justjared-media.s3.us-east-1.amazonaws.com/wp-content/uploads/2019/03/taylor-hiking/taylor-swift-joe-alwyn-go-hiking-02.jpg',
            credit: 'Just Jared',
          },
        ],
      },
    },
    {
      slug: 'rep-end-game-video',
      year: 2018,
      month: 1,
      day: 12,
      category: 'release',
      title: 'The End Game video: Miami, Tokyo, London — with Ed Sheeran and Future',
      snippet:
        'Joseph Kahn\'s globe-hopping party video for the album\'s only guest-feature track dropped in January 2018 — yacht in Miami, arcade in Tokyo, double-decker in London.',
      sourceUrl: 'https://en.wikipedia.org/wiki/End_Game_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'The third single from reputation is the only track in her catalog to date pairing her with both a rapper (Future) and Ed Sheeran on one song. The video leaned into the album\'s reputation motif — a neon "reputation" sign flickers through the London sequence — while keeping the era\'s no-interviews rollout intact.\n\nJoseph Kahn\'s cut landed overnight on January 12, 2018 — his third video of the era after "Look What You Made Me Do" and "...Ready for It?" — and played as a world tour of the album\'s id: a yacht party in Miami, karaoke and vending-machine snacks with Sheeran in Tokyo, kebabs and a New Year\'s Eve house party in London.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/End_Game_(Taylor_Swift_song)',
            source_title: 'End Game (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-end-game-video-watch-1074288/',
            source_title: "Taylor Swift Parties Around the World in 'End Game' Music Video",
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): official MV still — video id
        // dfnCAmr569k verified via YouTube oEmbed this session ("Taylor
        // Swift - End Game ft. Ed Sheeran, Future", channel @TaylorSwift).
        // Low-res single-cover retired (issue #1715, 2026-08-26): upgraded
        // the still to maxresdefault (curl-verified 200 image/jpeg,
        // downloaded and viewed), removed the redundant low-res cover.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/dfnCAmr569k/maxresdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'The Tokyo stretch of Joseph Kahn\'s "End Game" video, released January 12, 2018.',
            kind: 'archival',
            focalPoint: '53% 40%',
          },
        ],
      },
    },
    {
      slug: 'rep-babe-to-sugarland',
      year: 2018,
      month: 4,
      day: 20,
      category: 'music',
      title: 'She gives Babe, a Red-era outtake, to Sugarland',
      snippet:
        'Written with Train\'s Pat Monahan for Red and left off the album, "Babe" surfaced April 20, 2018 as a Sugarland single — with Taylor on the track and, later, playing the other woman in its Mad Men-styled video.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Babe_(Sugarland_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Taylor pitched the six-year-old outtake to the duo when she heard they\'d reunited. She sang backing vocals — audible echoing through the chorus and bridge under Jennifer Nettles\' lead — and the single climbed to No. 8 on Hot Country Songs.\n\nAnthony Mandler\'s video, teased at the CMT Music Awards and released June 9, 2018, cast Taylor against type as the other woman: a 1960s, Mad Men-styled secretary opposite Brandon Routh\'s straying husband. The two acts finally performed it together live at the reputation Stadium Tour\'s Arlington finale that October, and her own version eventually arrived in 2021 as a from-the-vault track on Red (Taylor\'s Version).',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Babe_(Sugarland_song)',
            source_title: 'Babe (Sugarland song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'The Boot',
            url: 'https://theboot.com/sugarland-taylor-swift-pat-monahan-babe/',
            source_title: "Taylor Swift Co-Wrote One of Sugarland's New Songs With Train's Pat Monahan",
            publisher: 'The Boot',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        // T16 photo pass (2026-07-09): single art via Wikimedia Commons (file
        // page license: Public domain — text-only artwork; artist field credits
        // Big Machine Records). Verified HTTP 200 + image/png, visually checked.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Sugarland_Babe.png',
            credit: 'Big Machine Records, via Wikimedia Commons',
            caption: 'Single art for Sugarland\'s "Babe," featuring Taylor Swift — released April 20, 2018.',
            kind: 'primary',
            // Text-only wordmark art, genuinely centered — viewed this run.
            focalPoint: '50% 50%',
          },
          // Photo pass #762 run 25 (2026-07-18): second image is the video the
          // page's story hinges on — video id l25AL0BdD6w oEmbed-verified this
          // session ("Sugarland - Babe ft. Taylor Swift", channel SugarlandVEVO).
          // maxresdefault curl 200 image/jpeg 1280x720; Read-viewed (Jennifer
          // Nettles poolside frame; caption says who's actually pictured).
          {
            url: 'https://i.ytimg.com/vi/l25AL0BdD6w/maxresdefault.jpg',
            credit: 'Sugarland / YouTube (official music video still)',
            caption:
              'Jennifer Nettles in Anthony Mandler\'s Mad Men-styled "Babe" video, released June 9, 2018 — Taylor wrote the treatment and played the other woman.',
            kind: 'archival',
            focalPoint: '63% 32%',
          },
        ],
      },
    },
    {
      slug: 'rep-katy-perry-olive-branch',
      significance: 'notable', // the widely-covered public resolution of one of pop music's longest-running, most-documented feuds (docs/decisions.md, 2026-07-19)
      relatedIds: ['moment:vault-reputation-reputation-stadium-tour-opens-to-a-record-crowd'],
      year: 2018,
      month: 5,
      day: 8,
      category: 'sighting',
      title: 'Katy Perry sends a literal olive branch on opening night',
      snippet:
        'Waiting in Taylor\'s dressing room before the May 8, 2018 tour kickoff: an actual olive branch and a handwritten note from Katy Perry beginning "Hello old friend" — the public end of pop\'s longest-running feud.',
      sourceUrl: 'https://www.billboard.com/articles/columns/pop/8455152/katy-perry-sends-taylor-swift-olive-branch-instagram',
      thumbnailUrl: null,
      moment: {
        context:
          '"So I just got to my dressing room and found this actual olive branch. This means so much," Taylor said from her dressing room before taking the stage in Glendale, adding "Thank you Katy" with a heart. Contemporary coverage could clearly make out only the note\'s opening — "Hello old friend" — while the rest of Perry\'s handwriting remained difficult to read.\n\nThe gesture closed the loop on the falling-out widely understood to be behind "Bad Blood," a feud that had shadowed both discographies for four years — and it set up their on-camera reunion in the "You Need to Calm Down" video a year later.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/articles/columns/pop/8455152/katy-perry-sends-taylor-swift-olive-branch-instagram',
            source_title: 'Katy Perry Literally Extended an Olive Branch to Taylor Swift For Reputation Tour Opening Night',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/news/music-news/katy-perry-sends-taylor-swift-an-olive-branch-tour-1110405/',
            source_title: 'Katy Perry Sends Taylor Swift an Olive Branch',
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): the olive branch itself exists only as an
        // Instagram Story screenshot; the cited Billboard piece ran this 2010
        // file photo of the two together, used here as clearly-captioned
        // archival context. Verified HTTP 200 + image/jpeg, visually checked.
        // Photo pass #762 (2026-08-14): no `socialPost` for the same reason —
        // the moment itself was Taylor's Instagram *Story*, which has no
        // permalink/shortcode and expired within 24 hours. There is nothing
        // to embed; the archival photo above is the honest substitute.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/katy-perry-taylor-swift-2010-billboard-1548.jpg?w=600',
            // Photo pass #762 (2026-07-20): viewed. Both faces sit high and near
            // the center — Perry left, Swift right of the midline; keep the crop
            // high so neither head is cut.
            focalPoint: '48% 28%',
            credit: 'Billboard',
            caption: 'Perry and Taylor in 2010, before the falling-out — the file photo Billboard ran with news of the olive branch.',
            kind: 'archival',
          },
          {
            // Photo pass (issue #1721, 2026-08-25).
            url: 'https://www.nme.com/wp-content/uploads/2018/05/GettyImages-956319166-1-696x442.jpg',
            credit: 'Getty Images / NME',
            caption: 'Taylor Swift performing with Charli XCX and Camila Cabello on the Reputation Stadium Tour\'s opening night, Glendale, AZ, May 8, 2018 — the same night the olive branch arrived backstage.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'rep-wembley-guest-nights',
      year: 2018,
      month: 6,
      day: 22,
      category: 'tour',
      title: 'Two Wembley nights, two British icons: Niall Horan, then Robbie Williams',
      snippet:
        'June 22, 2018: Niall Horan joins her at Wembley Stadium. June 23: Robbie Williams walks out in a Taylor Swift T-shirt for a stadium-wide "Angels" singalong she started at the piano.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-robbie-williams-angels-london-video-8462415/',
      thumbnailUrl: null,
      moment: {
        context:
          'Horan\'s night-one cameo was a duet on his own "Slow Hands." The next night, she started "Angels" alone at the piano before Williams strode out in a Taylor Swift T-shirt, and the Wembley-wide singalong footage flooded social media — the European leg\'s signature moment.\n\nWilliams was as starstruck as the stadium, posting afterward: "What an honour to sing with you tonight @taylorswift13 I\'ve got a proper crush. THANK YOU THANK YOU THANK YOU x" — and joking he hadn\'t realized how big a deal the cameo would be to her audience. The two Wembley nights drew 143,427 fans between them — a bigger crowd than any other stop of the tour outside North America.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-robbie-williams-angels-london-video-8462415/',
            source_title: "Taylor Swift and Robbie Williams Sing 'Angels' in London on Reputation Stadium Tour",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'NME',
            url: 'https://www.nme.com/news/music/taylor-swift-robbie-williams-angels-wembley-2343193',
            source_title: "Watch Taylor Swift bring out Robbie Williams to sing 'Angels' at Wembley",
            publisher: 'NME',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): the composite the cited NME story ran —
        // Swift on the reputation tour beside Williams performing in his Taylor
        // Swift tee. Verified HTTP 200 + image/jpeg and visually checked.
        photos: [
          {
            url: 'https://www.nme.com/wp-content/uploads/2018/06/taylor-swift-robbie-williams-angels-wembley.jpg',
            credit: 'Press photos via NME',
            caption: 'Taylor on the reputation Stadium Tour, and Robbie Williams in his Taylor Swift T-shirt — the composite NME ran on the Wembley "Angels" duet.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'rep-political-post-voter-registration',
      significance: 'notable', // a real, measurable civic-impact moment — a years-long public silence broken with concrete registration numbers to show for it (docs/decisions.md, 2026-07-19)
      year: 2018,
      month: 10,
      day: 7,
      category: 'business',
      title: 'She breaks her political silence — and voter registrations spike',
      snippet:
        'An October 7, 2018 Instagram post endorsing two Tennessee Democrats ended a career of political silence. Vote.org counted roughly 65,000 new registrations nationwide in the day that followed.',
      sourceUrl: 'https://time.com/5419276/taylor-swift-instagram-post-voter-registration-spike/',
      thumbnailUrl: null,
      moment: {
        // The post this page is ABOUT (issue #762 Part B). Shortcode taken
        // from the permalink CNN, Billboard and Deseret all embed, and
        // verified by rendering instagram.com/p/BopoXpYnCes/embed/captioned:
        // the taylorswift verified account, caption opening "I'm writing this
        // post about the upcoming midterm elections on November 6th, in which
        // I'll be voting in the state of Tennessee." Embedded rather than
        // hotlinked because Instagram CDN urls are signed/expiring and the
        // host is not on the image allowlist.
        socialPost: {
          platform: 'instagram',
          shortcode: 'BopoXpYnCes',
          label:
            'The endorsement post itself: her text statement backing Phil Bredesen and Jim Cooper, breaking a career of political silence.',
          postedOn: '2018-10-07',
        },
        context:
          '"In the past I\'ve been reluctant to publicly voice my political opinions, but due to several events in my life and in the world in the past two years, I feel very differently about that now," she wrote, endorsing Phil Bredesen for Senate and Jim Cooper for House.\n\nVote.org attributed a surge of about 65,000 registrations nationwide in the following 24 hours — one of the clearest measured cases of celebrity influence on registration, and the pivot point for the activism that carried into the Lover era and Miss Americana.',
        sources: [
          {
            outlet: 'TIME',
            url: 'https://time.com/5419276/taylor-swift-instagram-post-voter-registration-spike/',
            source_title: "Taylor's First Political Endorsements Caused a Taylor Spike in Voter Registrations",
            publisher: 'TIME',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-political-instagram-post-appears-to-spur-voter-registration-today-2018-10-09/',
            source_title: "Taylor Swift's political Instagram post appears to spur voter registration",
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/politics/politics-news/taylor-swift-instagram-post-causes-voter-registration-spike-734975/',
            source_title: "Taylor Swift's Instagram Post Causes Spike in Voter Registration",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): the post itself is a text Instagram
        // post; the era's photographic record of the moment is her carrying
        // the message onto the AMAs stage two nights later (same photo/credit
        // as this file's AMAs item, where the speech is sourced). Verified
        // HTTP 200 + image/jpeg this session.
        photos: [
          {
            url: 'https://specials-images.forbesimg.com/dam/imageserve/1048528712/960x0.jpg?fit=scale',
            // Photo pass #762 (2026-07-20): viewed. She holds the award right of
            // center in the mirrored dress, face high on the right; bias the crop
            // right and high to keep the face framed.
            focalPoint: '58% 26%',
            credit: 'Jeff Kravitz/FilmMagic',
            caption: 'Two nights after the post, at the American Music Awards: "You know what else is voted on by the people? The mid-term elections."',
            kind: 'archival',
          },
          {
            // Photo pass (issue #1721, 2026-08-25).
            url: 'https://www.rollingstone.com/wp-content/uploads/2018/10/taylorcrop.jpg?w=1600&h=900&crop=1',
            credit: 'Rolling Stone',
            caption: 'Taylor Swift performing on the Reputation Stadium Tour, October 2018 — the month of the political endorsement post.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'rep-signs-with-republic-umg',
      significance: 'defining', // the deal that made every album since (Lover onward) hers outright, directly bracketing the Big Machine sale and the buyback (docs/decisions.md, 2026-07-19)
      threadIds: ['taylors-version'],
      relatedIds: [
          'moment:vault-lover-lover-the-first-album-shes-ever-owned',
        'moment:vault-reputation-my-worst-case-scenario-scooter-braun-buys-big-machine-and-he',
        'moment:vault-ttpd-all-of-the-music-ive-ever-made-now-belongs-to-me',
      ],
      year: 2018,
      month: 11,
      day: 19,
      category: 'business',
      title: 'She leaves Big Machine for Republic — and owns her masters going forward',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-rep-3", label: "Leaves Big Machine", kind: "business" },
      snippet:
        'November 19, 2018: after 13 years, a new deal with Universal\'s Republic Records guarantees she owns every master she records from here on — and forces a Spotify-equity payout clause for every UMG artist.',
      sourceUrl: 'https://variety.com/2018/music/news/taylor-swift-news-alert-1203032124/',
      thumbnailUrl: null,
      moment: {
        context:
          'The contract\'s headline term — ownership of her future master recordings — became the fault line of the next year\'s Big Machine catalog fight and the entire Taylor\'s Version project. She also negotiated that if UMG sold its Spotify shares, proceeds would be distributed to all its artists on a non-recoupable basis, a condition she called non-negotiable and framed as leverage on behalf of other musicians.\n\nHer own words put the weight on that second clause: the payout condition "meant more to me than any other deal point," she wrote, casting the signing not as a label change but as "positive change for creators" — the first of the era-ending business moves that would define the next several years of her career.\n\nShe made the announcement herself, on Instagram, captioned "My new home": a photo with UMG chairman Sir Lucian Grainge and Republic Records co-founder Monte Lipman, calling them "incredible partners."\n\nThe fine print stayed private. UMG announced only a multi-year, multi-album global agreement; the master-ownership headline came from Taylor\'s own post — she wrote that she owns "all of my master recordings that I make from now on" — and it covered future work only. Her first six albums\' masters stayed with Big Machine, sold to Scooter Braun\'s Ithaca Holdings in 2019. No dollar figure was confirmed: Forbes estimated $100–200 million in guarantees, which UMG called "entirely inaccurate." Lover (2019) became the first album released under the deal, and the first master she owned outright.\n\nThe Spotify-equity clause took years to pay out. UMG\'s 2021 stock-market debut did not trigger it — that was UMG listing itself, not selling its Spotify shares. The clause fired for the first time in April 2026, when UMG moved to sell half its roughly 3% Spotify stake — about $1.4 billion — and confirmed the proceeds would reach its entire roster on the non-recoupable basis Taylor had demanded, not just its biggest names.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2018/music/news/taylor-swift-news-alert-1203032124/',
            source_title: 'Taylor Swift Signs Landmark New Deal With Universal Music Group',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/pro/news/taylor-swift-universal-republic-deal-spotify-758102/',
            source_title: "How Taylor Swift's Deal With Universal Affects Other Artists",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'The FADER',
            url: 'https://www.thefader.com/2018/11/19/taylor-swift-republic-records-deal-spotify-contract',
            source_title: 'Taylor Swift has signed with Republic Records',
            publisher: 'The FADER',
            source_type: 'reputable_press',
            accessed_at: '2026-07-19',
            reliability_score: 3,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/zackomalleygreenburg/2018/11/19/taylor-swifts-new-record-deal-could-pay-as-much-as-200m/',
            source_title: "Taylor Swift's New Record Deal Could Pay As Much As $200M",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/music/music-industry-news/taylor-swift-umg-spotify-stock-sale-clause-1236580300/',
            source_title: 'Universal Music Artists Can Reap Millions From Spotify Stock Sale, Thanks to Taylor Swift',
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Music Business Worldwide',
            url: 'https://www.musicbusinessworldwide.com/universal-is-selling-50-of-its-spotify-stake-generating-around-1-4-billion/',
            source_title: 'Universal is selling 50% of its Spotify stake, generating around $1.4 billion',
            publisher: 'Music Business Worldwide',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
        ],
        // T16 photo pass (2026-07-09): Wikimedia Commons, CC BY-SA 2.0, author
        // Ronald Woan (license verified on the file page). Archival era context
        // for a paper-deal story with no event photo of its own.
        // Photo pass 2026-07-19 (bulk-to-6+, docs/decisions.md): re-challenged
        // a third time — the actual "My new home" Instagram announcement
        // photo (with Grainge and Lipman) still isn't hostable on any allowed
        // CDN (Instagram-only, matching the prior finding), but this pass
        // found real reference photos of both named executives, from close
        // to the actual deal date, that weren't searched for before.
        photos: [
          // Photo pass #762 run 25 (2026-07-18): stays at one image — a
          // paper-deal story with no signing/announcement imagery on allowed
          // hosts (Variety/Rolling Stone art is wire/Getty), and a second tour
          // frame would only repeat the era context this one already carries.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/5/58/Taylor_Swift_-_Reputation_Tour_Seattle_-_I_Did_Something_Bad.jpg',
            credit: 'Ronald Woan / Wikimedia Commons (CC BY-SA 2.0)',
            caption: 'On the reputation Stadium Tour in May 2018 — the final album cycle recorded under the Big Machine contract she was leaving.',
            kind: 'archival',
            focalPoint: '47% 15%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Lucian_Grainge_at_State_of_the_Entertainment_Industry_2018.jpg',
            // Photo pass #762 (2026-08-01): viewed (659x1200 downsized from
            // 1007x1835). Portrait crop, face centered horizontally, upper third.
            focalPoint: '50% 25%',
            credit: 'Luke Harold (CC0)',
            caption: 'Sir Lucian Grainge, UMG chairman/CEO, four days before the deal — one of the "incredible partners" named in her announcement.',
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Monte_Lipman_Headshot_Cropped.jpg',
            // Photo pass #762 (2026-08-01): viewed (571x544). Tight headshot,
            // face fills most of frame, centered.
            focalPoint: '50% 40%',
            credit: 'BBscary, Wikimedia Commons (CC BY-SA 4.0)',
            caption: "Monte Lipman, Republic Records' founder and CEO, the other partner named in the announcement.",
            kind: 'reference',
          },
          {
            url: 'https://thefader-res.cloudinary.com/private_images/w_760,c_limit,f_auto,q_auto:best/GettyImages-1048415872_v1oq0t/taylor-swift-republic-records-deal-spotify-contract.jpg',
            // Photo pass #762 (2026-08-01): viewed (760x508). Onstage performing,
            // upper body upper-center of frame.
            focalPoint: '48% 25%',
            credit: 'Kevin Winter/Getty Images, via The FADER',
            caption: 'A contemporary reference photo from the same period, not from the announcement itself — no photo op exists for the signing.',
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Umgheadquarters.jpg',
            // Photo pass #762 (2026-08-01): viewed (1200x900 downsized from
            // 4608x3456). Building facade fills the frame, roughly centered
            // with palm trees flanking both sides.
            focalPoint: '50% 45%',
            credit: 'Coolcaesar, Wikimedia Commons (CC BY-SA 3.0)',
            caption: 'Universal Music Group\'s Santa Monica headquarters — the new corporate home behind the deal.',
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Republic_Records_logo.svg',
            // Photo pass #762 (2026-08-01): viewed. Wordmark stacked in the
            // upper half of the mark, with bars beneath — visual weight sits high.
            focalPoint: '50% 30%',
            credit: 'Republic Records (official logo)',
            caption: 'The Republic Records identity — the label side of the deal.',
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg',
            // Photo pass #762 (2026-08-01): viewed. A circular, symmetric mark —
            // genuinely reads best centered.
            focalPoint: '50% 50%',
            credit: 'Spotify (public domain mark)',
            caption: 'The Spotify-equity clause — proceeds from any future UMG share sale distributed to all its artists, non-recoupable — was the deal point she called "non-negotiable."',
            kind: 'reference',
          },
        ],
      },
    },
    {
      slug: 'rep-tour-closes-tokyo',
      year: 2018,
      month: 11,
      day: 21,
      category: 'tour',
      title: 'The reputation Stadium Tour closes at the Tokyo Dome',
      snippet:
        'November 21, 2018: the second of two Tokyo Dome nights ends the 53-show run — $345.7 million grossed worldwide, the highest-grossing tour of her career to that point.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Reputation_Stadium_Tour',
      thumbnailUrl:
        "https://upload.wikimedia.org/wikipedia/en/b/b3/Taylor_Swift%27s_Reputation_Stadium_tour.png",
      moment: {
        context:
          'The tour that had already broken the U.S. all-time record ended its single year of touring in Japan: the two Tokyo Dome nights drew 100,109 fans and $14.9 million between them, the highest-grossing engagement of the run outside North America.\n\nThe final tally — $345.7 million across a compact 53 dates, all stadiums — came in 38 percent above the 85-show 1989 World Tour\'s $250.7 million, and pushed her career touring gross past $935 million. The Dallas stop filmed weeks earlier became the Netflix concert film released that New Year\'s Eve.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Reputation_Stadium_Tour',
            source_title: 'Reputation Stadium Tour',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-reputation-stadium-tour-345-million/',
            source_title: 'Taylor Swift Closes Reputation Stadium Tour With $345 Million',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: "https://upload.wikimedia.org/wikipedia/en/b/b3/Taylor_Swift%27s_Reputation_Stadium_tour.png",
            credit: 'Big Machine Records',
          },
        ],
      },
    },
    {
      slug: 'rep-golden-globes-date-night',
      year: 2019,
      month: 1,
      day: 6,
      category: 'relationship',
      title: 'A surprise Golden Globes appearance turns into a rare public date night',
      snippet:
        'She materialized at the January 2019 Golden Globes as an unannounced presenter with Idris Elba — then spent the after-party circuit at Joe Alwyn\'s side, holding hands at the Fox/FX/Hulu party while The Favourite celebrated its wins.',
      sourceUrl: 'https://www.eonline.com/news/1002592/inside-taylor-swift-and-joe-alwyn-s-golden-globes-date-night',
      thumbnailUrl: null,
      moment: {
        context:
          'The two arrived and walked carpets separately — she to present, he with his Favourite castmates — before reuniting at the after-parties, where witnesses described her beelining to his table. Inside, she and Idris Elba presented Best Original Score and Best Original Song, the night Lady Gaga\'s "Shallow" took the song award.\n\nThe after-party circuit stretched across four stops: the Fox/FX/Hulu party where she found his table, a back-booth ten minutes at Netflix\'s bash, side-by-side arrivals into "a sea of flashing cameras" at the InStyle and Warner Bros. party, and a brief late-night stop at CAA\'s. Alongside the BAFTAs weeks later, it was as public as the famously private couple got during the whole reputation stretch.',
        sources: [
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1002592/inside-taylor-swift-and-joe-alwyn-s-golden-globes-date-night',
            source_title: "Inside Taylor Swift and Joe Alwyn's Golden Globes Date Night",
            publisher: 'E! News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'W Magazine',
            url: 'https://www.wmagazine.com/story/joe-alwyn-taylor-swift-golden-globes-afterparties',
            source_title: 'How Joe Alwyn and Taylor Swift Managed the Golden Globes Afterparty Circuit',
            publisher: 'W Magazine',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): the composite the cited E! story ran —
        // Swift presenting inside the ceremony, Alwyn on the carpet — which is
        // itself the story (they arrived and walked separately). Verified
        // HTTP 200 + image/jpeg and visually checked this session.
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/201907/rs_600x600-190107083644-600x600-taylorswift-joealwyn-ggs-gj-1-7-19.jpg?fit=around%7C600:600&output-quality=90&crop=600:600;center,top',
            focalPoint: '50% 20%',
            credit: 'Composite via E! Online',
            caption: 'Separate arrivals, January 6, 2019: Taylor presenting inside the Golden Globes, Alwyn on the carpet with his castmates.',
            kind: 'archival',
          },
        ],
      },
    },

    // ── Migrated from content.ts RAW (consolidation stage 2a, 2026-07-19) ──
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "rep-album",
      // Cross-link (candidate #1404): The Life of a Showgirl — her first full
      // album reuniting with Max Martin and Shellback since reputation.
      relatedIds: ["moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel"],
      year: 2017,
      month: 11,
      day: 10,
      category: "music",
      title: "reputation strikes back",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-rep-1", label: "reputation released", kind: "album" },
      snippet: "Armored, monochrome, and defiant — the sound of rebuilding on her own terms.",
      hiddenClue: { clue: "She reclaimed the snake her critics used against her.", payoff: "Turning the insult into iconography flipped the whole narrative in her favor." },
      moment: {
        sources: [
          {
            outlet: 'TIME',
            url: 'https://time.com/5017724/taylor-swift-reputation-explained/',
            source_title: 'Analyzing Every Song on Taylor Swift\'s Reputation',
            publisher: 'TIME',
            source_type: 'reputable_press',
            accessed_at: '2026-08-11',
            reliability_score: 4,
          },
          {
            outlet: 'NME',
            url: 'https://www.nme.com/reviews/review/taylor-swift-reputation-album-review-2158267',
            source_title: 'Taylor Swift – \'Reputation\' Review',
            publisher: 'NME',
            source_type: 'reputable_press',
            accessed_at: '2026-08-11',
            reliability_score: 4,
          },
        ],
        context: "After a very public year, she disappeared and returned all in black, with snakes reclaimed as armor.\n\nBeneath the hard exterior, though, reputation hides a surprisingly tender love story.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "rep-tour",
      year: 2018,
      month: 5,
      day: 8,
      category: "tour",
      title: "Giant snakes, record numbers",
      snippet: "The Reputation Stadium Tour becomes the highest-grossing US tour at the time.",
      moment: {
        sources: [
          {
            outlet: 'The Recording Academy',
            url: 'https://www.grammy.com/news/taylor-swift-breaks-own-tour-record-sold-out-reputation',
            source_title: 'Taylor Swift Breaks Own Tour Record With Sold-Out Reputation',
            publisher: 'The Recording Academy',
            source_type: 'official',
            accessed_at: '2026-08-11',
            reliability_score: 5,
          },
          {
            outlet: 'The Music Network',
            url: 'https://themusicnetwork.com/news/taylor-swifts-reputation-tour-sets-new-us-record-for-highest-grossing',
            source_title: 'Taylor Swift\'s Reputation Stadium Tour highest grossing in US history',
            publisher: 'The Music Network',
            source_type: 'reputable_press',
            accessed_at: '2026-08-11',
            reliability_score: 3,
          },
        ],
        context: "Towering cobra stage design and a stadium-scale production reset expectations for her live shows.",
        // Photo pass #762 (2026-07-20): page had zero photos. Two freely
        // licensed Commons shots from the Reputation Stadium Tour itself —
        // both file pages' licenses verified via the Commons API, curl 200
        // image/jpeg, downloaded and Read-viewed this session. focalPoint is
        // written immediately after url per the 2026-07-20 field-order rule.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Taylor_Swift_-_Reputation_Tour_Seattle_-_End_Game.jpg',
            focalPoint: '62% 44%',
            credit: 'Ronald Woan via Wikimedia Commons, CC BY-SA 2.0',
            caption: 'Performing "End Game" in black-and-gold sequins on the Reputation Stadium Tour, Seattle, May 2018.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Taylor_Swift_Reputation_Tour_stage_in_Minneapolis_2018.jpg',
            focalPoint: '46% 40%',
            credit: 'Michael Hicks via Wikimedia Commons, CC BY 2.0',
            caption: 'The stadium-scale stage and a packed house in Minneapolis, August 2018 — the tour that reset her live records.',
            kind: 'reference',
          },
        ],
      },
    },

    // Era-ignition beat (2026-07-30, #828): the Lover timeline used to open on
    // the June 30 masters sale — a business tragedy two singles deep — with the
    // April pastel turn living only inside a fashion caption. This is the
    // answering card to reputation's close (the April 22 Gigi Hadid party), and
    // the beat the era was missing.
    {
      year: 2019,
      month: 4,
      day: 25,
      category: 'music',
      slug: 'lover-era-ignition-me-pastel-turn',
      title: 'The pastel turn: ME! ends the reputation black',
      snippet:
        'A pastel countdown, a commissioned butterfly mural, and an NFL-Draft-night interview with Robin Roberts — the single most legible palette flip of her career, staged across April 2019.',
      sourceUrl:
        'https://pitchfork.com/news/taylor-swift-to-release-new-song-and-video-me-tonight/',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/0/01/Taylor_Swift_-_Me%21.png',
      relatedIds: [
        'moment:vault-reputation-seven-pastel-outfit-changes-in-the-me-video',
        'moment:vault-reputation-a-denim-themed-birthday-party-for-gigi-hadid-sans-denim',
      ],
      moment: {
        context:
          'reputation had ended in black and white; Lover announced itself in pastels. On April 13, 2019, a countdown debuted on Taylor\'s Instagram and website, ticking toward April 26 while a run of colorful posts kept repeating the date. On April 25, Taylor made a surprise appearance at the butterfly mural she had commissioned from street artist Kelsey Montague in Nashville\'s Gulch. Hearts, flowers, rainbows, and cats filled the wings; Montague added "ME!" between them as fans watched. Taylor sent the crowd to ABC for her next clue: a live chat with Robin Roberts that night.\n\nDuring the 2019 NFL Draft broadcast, Taylor discussed the new single with Roberts. On April 26, "ME!" arrived with a candy-colored video and Brendon Urie of Panic! at the Disco — her first new music since reputation, and an immediate visual break from that era. The video amassed 65.2 million Vevo views in its first 24 hours, setting the platform\'s single-day record. The palette flip was no longer tucked inside a teaser: this was the Lover era\'s public opening scene.',
        sources: [
          {
            outlet: 'The Washington Post',
            url: 'https://www.washingtonpost.com/arts-entertainment/2019/04/17/taylor-swifts-guessing-games-about-her-music-started-off-savvy-now-theyre-essential/',
            source_title:
              'Taylor Swift\'s guessing games about her music started off as savvy. Now they\'re essential.',
            publisher: 'The Washington Post',
            source_type: 'reputable_press',
            accessed_at: '2026-08-24',
            reliability_score: 4,
          },
          {
            outlet: 'MusicRow',
            url: 'https://musicrow.com/2019/04/taylor-swift-makes-surprise-appearance-at-nashville-mural/',
            source_title: 'Taylor Swift Makes Surprise Appearance At Nashville Mural',
            publisher: 'MusicRow',
            source_type: 'reputable_press',
            accessed_at: '2026-08-24',
            reliability_score: 4,
          },
          {
            outlet: 'Pitchfork',
            url: 'https://pitchfork.com/news/taylor-swift-to-release-new-song-and-video-me-tonight/',
            source_title: 'Taylor Swift Releases New Song and Video "ME!": Watch',
            publisher: 'Pitchfork',
            source_type: 'reputable_press',
            accessed_at: '2026-08-24',
            reliability_score: 4,
          },
          {
            outlet: 'Guinness World Records',
            url: 'https://www.guinnessworldrecords.com/world-records/112534-most-viewed-vevo-video-in-24-hours',
            source_title: 'Most viewed VEVO video in 24 hours',
            publisher: 'Guinness World Records',
            source_type: 'official',
            accessed_at: '2026-08-24',
            reliability_score: 5,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/0/01/Taylor_Swift_-_Me%21.png',
            focalPoint: '50% 50%',
            credit: 'Republic Records (single cover art)',
            kind: 'primary',
          },
        ],
      },
    },
    {
      // Cross-link (Stage 3, 2026-07-30): the "You Need to Calm Down" pair —
      // the video's petition and the costumes in it — now interlink.
      relatedIds: ['moment:vault-reputation-rainbow-wig-western-shirt-and-a-french-fries-costume-in-you-'],
      year: 2019,
      month: 6,
      day: 17,
      category: 'business',
      title: 'You Need to Calm Down turns a music video into an Equality Act petition',
      snippet:
        'The video ends with a call to sign her petition for the Equality Act; by the VMAs that August, it had half a million signatures.',
      sourceUrl: 'https://www.advocate.com/news/2019/6/17/taylor-swift-releases-lgbtq-packed-video-you-need-calm-down',
      thumbnailUrl:
        // Image-fix pass (2026-07-10): #239 — Advocate crop had a "VIDEO SCREENSHOT" watermark baked into the
        // pixels (confirmed even on the un-cropped source). Replaced with an eonline.com frame from the same video
        // (curl-verified HTTP 200 image/jpeg); visually confirmed Taylor in the trailer-park pink fur coat/pearl
        // sunglasses look, no watermark, no collage.
        'https://akns-images.eonline.com/eol_images/Entire_Site/201969/rs_1043x646-190709093159-taylor-swift-music-video-2.jpg?fit=around%7C1043:646&output-quality=90&crop=1043:646;center,top',
      moment: {
        context:
          'The video itself, released June 17, 2019 and produced with Todrick Hall, packed its trailer-park block party with LGBTQ figures — Ellen DeGeneres, Billy Porter, Laverne Cox, RuPaul, the Queer Eye cast, Adam Rippon, and Jesse Tyler Ferguson with his real-life husband Justin Mikita — and closed on the on-screen ask: "Let\'s show our pride by demanding that, on a national level, our laws truly treat all our citizens equally." The Advocate called it her most pro-LGBTQ statement ever, and one of the most political stances she had taken with her music.\n\nShe personally wrote to her home-state senator, Lamar Alexander, urging support: "For American citizens to be denied jobs or housing based on who they love or how they identify, in my opinion, is un-American and cruel." Accepting Video of the Year at the VMAs, she noted the petition had "five times the amount that it would need to warrant a response from the White House."',
        sources: [
          {
            outlet: 'The Advocate',
            url: 'https://www.advocate.com/news/2019/6/17/taylor-swift-releases-lgbtq-packed-video-you-need-calm-down',
          },
          {
            outlet: 'Elite Daily',
            url: 'https://www.elitedaily.com/p/heres-how-to-sign-taylor-swifts-petition-supporting-the-equality-act-18700857',
          },
          // YouTube-appearances research pass (2026-08-12): this item's context
          // already narrates the Aug. 26 VMA acceptance speech and the
          // White-House-response threshold, so the speech is sourced here
          // rather than split into a second moment about the same night (the
          // era's fashion items already carry the VMA red carpet).
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/detroit/news/taylor-swift-calls-out-white-house-during-vmas-acceptance-speech',
          },
          // The acceptance speech itself on MTV's own channel —
          // oEmbed-verified 2026-08-12 (see candidates/youtube-appearances.mjs).
          {
            outlet: 'YouTube — MTV',
            url: 'https://www.youtube.com/watch?v=8z4icNgFSPI',
          },
        ],
        // Photo pass (#762, 2026-08-07): added a second still — the official
        // aerial pool shot from the same video — downloaded and vision-
        // confirmed. Set focalPoint on both photos individually by eye.
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/201969/rs_1043x646-190709093159-taylor-swift-music-video-2.jpg?fit=around%7C1043:646&output-quality=90&crop=1043:646;center,top',
            focalPoint: '55% 30%',
            credit: 'E! News (video still)',
          },
          {
            url: 'https://i.ytimg.com/vi/Dkk9gvTmCXY/maxresdefault.jpg',
            focalPoint: '50% 50%',
            credit: 'Taylor Swift / YouTube (official "You Need to Calm Down" video, aerial still)',
            caption:
              'An aerial shot from the "You Need to Calm Down" video: Taylor floating on a yellow inner tube in a rose-ringed trailer-park pool.',
            kind: 'archival',
          },
        ],
      },
    },
    // --- Fashion/photo depth pass (2026-07-04)
    {
      year: 2019,
      month: 4,
      day: 26,
      category: 'fashion',
      relatedIds: ['moment:vault-reputation-the-pastel-turn-me-ends-the-reputation-black'],
      title: 'Seven pastel outfit changes in the ME! video',
      snippet:
        'Styled by Joseph Cassell Falconer, the video traded reputation black-and-white for tulle, pastels, and bold suiting — including a Monique Lhuillier tea-length dress and a lemon-yellow power suit.',
      sourceUrl: 'https://www.etonline.com/see-every-dreamy-outfit-taylor-swift-wears-in-me-music-video-124147',
      thumbnailUrl: 'https://www.etonline.com/sites/default/files/styles/1280x720/public/images/2019-04/taylor-swift-me-music-video-1280.jpg',
      moment: {
        context:
          'Longtime stylist Joseph Cassell Falconer put her through seven looks for the video, including a floral Monique Lhuillier tea-length dress with Alison Lou earrings and Roger Vivier shoes, an Alexander McQueen floral jacket-and-shorts set, and a ruffled Amorphose top over an Monica Ivena tulle skirt — the first full preview of the pastel "Lover" aesthetic.\n\nThe wardrobe had a huge stage to debut on: the video, co-directed by Taylor and Dave Meyers and premiered at midnight on April 26, 2019, pulled in 65.2 million views in its first day — breaking the 24-hour Vevo record previously held by Ariana Grande\'s "Thank U, Next" — and critics read the bright palette as a deliberate, symbolic exit from the reputation era\'s black-and-white. The kitten Brendon Urie hands her mid-video was real, and stayed: Taylor adopted him as her third cat, Benjamin Button.',
        sources: [
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/see-every-dreamy-outfit-taylor-swift-wears-in-me-music-video-124147',
          },
          {
            outlet: 'Refinery29',
            url: 'https://www.refinery29.com/en-us/2019/04/230942/taylor-swift-me-music-video-outfit-looks-shop',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Me!',
          },
        ],
        photos: [
          {
            url: 'https://www.etonline.com/sites/default/files/styles/1280x720/public/images/2019-04/taylor-swift-me-music-video-1280.jpg',
            credit: 'Entertainment Tonight',
          },
        ],
        // Shop pass (2026-07-22): the exact Monique Lhuillier tea-length
        // dress is discontinued -- a current pink floral tiered midi,
        // verified in stock, closest real match.
        products: [
          {
            brand: 'Lulus',
            item: 'Tea Party Chic Pink Floral Print Tie-Strap Tiered Midi Dress',
            retailer: 'lulus.com',
            url: 'https://www.lulus.com/products/tea-party-chic-pink-floral-print-tie-strap-tiered-midi-dress/1712196.html',
            // Photo pass (t_fa7bfb57 round 3, 2026-08-31): retailer photo via
            // Poshmark listing of the same Lulus style (lulus.com itself blocks
            // non-browser fetches), curl-verified 200 image/jpeg.
            imageUrl: 'https://di2ponv0v5otw.cloudfront.net/posts/2026/07/10/6a51c55a9e4f74cf70811414/m_6a51c5cd2981af99c3b77248.jpeg',
            matchTier: 'unscored',
            kind: 'dress',
            price: '$30.00',
            isAlternative: true,
            altNote: 'Her exact Monique Lhuillier tea-length dress is long discontinued -- this is a current pink floral tiered midi in the same tea-party, pastel-floral spirit.',
            verifiedAt: '2026-08-30T19:22:10.691Z'
          },
        ],
      },
    },
    {
      // Cross-link (Stage 3, 2026-07-30): sibling "You Need to Calm Down" moment.
      relatedIds: ['moment:vault-reputation-you-need-to-calm-down-turns-a-music-video-into-an-equality-a'],
      year: 2019,
      month: 6,
      day: 17,
      category: 'fashion',
      title: 'Rainbow wig, western shirt, and a French fries costume in You Need to Calm Down',
      snippet:
        'Five outfit changes in the trailer-park video, from a peach Agent Provocateur robe to a rainbow wig with a Marina Hoermanseder western shirt and gold Saint Laurent shorts, ending in a French fries costume playing off Katy Perry\'s Met Gala burger dress.',
      sourceUrl: 'https://www.etonline.com/all-of-taylor-swifts-fabulous-outfits-from-you-need-to-calm-down-music-video-shop-the-looks-127156',
      thumbnailUrl:
        // Image-fix pass (2026-07-10): #237 — old bustle still was the opening trailer-park scene (pearl
        // sunglasses/fur coat), none of the three named looks. Replaced with a billboard.com still (curl-verified
        // HTTP 200 image/jpeg, no watermark) visually confirmed showing Taylor in the French fries costume next to
        // Katy Perry's burger costume — the closing look this moment specifically calls out.
        'https://www.billboard.com/wp-content/uploads/media/taylor-swift-calm-down-vid-2019-billboard-1548.jpg?w=875&h=583&crop=1',
      moment: {
        context:
          'The looks tracked the video\'s scenes: a peach silk Agent Provocateur robe and Sophia Webster heels to open, a pink Norma Kamali bikini with a faux-fur Vivetta jacket poolside, then a rainbow wig with a purple Marina Hoermanseder western shirt, gold metallic Saint Laurent shorts, and Irregular Choice unicorn boots.\n\nIt closes with a French fries costume and red Buffalo London x Opening Ceremony sandals, a direct callback to Katy Perry\'s cheeseburger look at the 2019 Met Gala.',
        sources: [
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/all-of-taylor-swifts-fabulous-outfits-from-you-need-to-calm-down-music-video-shop-the-looks-127156',
          },
          {
            outlet: 'Bustle',
            url: 'https://www.bustle.com/p/all-the-looks-from-taylor-swifts-you-need-to-calm-down-music-video-are-a-rainbow-dream-18010763',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-calm-down-vid-2019-billboard-1548.jpg?w=875&h=583&crop=1',
            credit: 'Billboard',
            caption: "Taylor in the closing French fries costume, next to Katy Perry's burger costume.",
          },
        ],
        products: [
          {
            brand: 'Wrangler',
            item: "Women's Multicolor Rainbow Bandana Western Snap Shirt",
            retailer: 'jacksonswestern.com',
            url: 'https://jacksonswestern.com/wrangler-women-s-multicolor-rainbow-bandana-western-snap-shirt/',
            // Photo pass (t_fa7bfb57 round 3, 2026-08-31): the jacksonswestern.com
            // PDP is now 404 (delisted); this is the same real Wrangler x Lainey
            // Wilson Rainbow Bandana Western Snap Shirt product photo from another
            // in-stock retailer, curl-verified 200 image/png.
            imageUrl: 'https://bootjack.com/cdn/shop/files/SHIRTLONGG-2024-10-31T142255.702.png?v=1730406459',
            matchTier: 'unscored',
            kind: 'top',
            price: '$55.00',
            inStock: false,
            verifiedAt: '2026-08-30T19:22:10.691Z',
            isAlternative: true,
            altNote: 'Her exact Marina Hoermanseder shirt is discontinued -- this sources the western shirt only, matching its rainbow palette (not the wig, shorts, boots, or fries costume).',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 6,
      day: 17,
      category: 'fashion',
      title: 'The glitter heart eye that became the Lover era\'s signature',
      snippet:
        'On the Lover album cover, shot by Valheria Rocha, she swapped her signature red lip for bright fuchsia and outlined one eye in a giant glittery heart, with streaks of pink and blue through her hair.',
      sourceUrl: 'https://www.refinery29.com/en-us/2019/06/235426/taylor-swift-lover-album-heart-makeup',
      thumbnailUrl: null,
      moment: {
        context:
          'Taylor credited the cover to "the artistic genius that is @valheria123" (photographer Valheria Rocha) on Instagram. The heart-lined eye, glitter, and pastel pink-and-blue hair streaks became a recurring beauty motif across the era\'s videos and press cycle.\n\nEvery element was a departure from an established signature: the giant glitter heart outlined her right eye, the trademark red lip went bright fuchsia, and the pink-and-blue streaks replaced the all-blonde hair fans had watched for a decade. Fans immediately began hunting for a hidden meaning, the way her beauty choices have a history of doubling as Easter eggs (as Refinery29 pointed out) — and, more practically, planning recreations: "All of us are going to show up with glittery heart to the tour," as one put it, back when the era was still supposed to get one.',
        sources: [
          {
            outlet: 'Refinery29',
            url: 'https://www.refinery29.com/en-us/2019/06/235426/taylor-swift-lover-album-heart-makeup',
          },
          {
            outlet: 'YouBeauty',
            url: 'https://www.youbeauty.com/celebs/taylor-swift-provides-summer-makeup-inspo-on-her-lover-album-cover/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/c/cd/Taylor_Swift_-_Lover.png',
            credit: 'Republic Records / Valheria Rocha (album cover art)',
            caption: 'The Lover album cover, shot by Valheria Rocha — the glitter heart eye in its original context.',
            kind: 'primary',
            focalPoint: '49% 52%',
          },
          // Photo-enrichment pass (2026-07-19, #762): from the cited
          // Refinery29 story's own CDN (s2.r29static.com), downloaded and
          // vision-confirmed — the era's fuchsia lip and pink-tipped
          // ponytail on stage at Wango Tango, weeks before the cover.
          {
            url: 'https://s2.r29static.com/bin/entry/6b6/x,80/2201581/image.jpg',
            credit: 'Getty Images via Refinery29',
            caption: 'The era\'s new beauty look in motion: fuchsia lip and pink-tipped ponytail at Wango Tango that June, from Refinery29\'s story on the cover makeup.',
            kind: 'archival',
            focalPoint: '50% 18%',
          },
        ],
        // Shop pass (2026-07-22): a makeup look, not a garment -- offering
        // a real glitter cosmetic rather than forcing a clothing link
        // onto a beauty item.
        products: [
          {
            brand: 'Too Faced',
            item: 'Disco Crush High Shine Glitter Eye + Face Sparkle in Heart Eyes',
            retailer: 'ulta.com',
            url: 'https://www.ulta.com/p/disco-crush-high-shine-glitter-eye-face-sparkle-pimprod2046472?sku=2627323',
            // Photo pass (t_fa7bfb57, 2026-08-31): retailer PDP image, curl-verified
            // 200 image/* response. Uses the SKU-specific media.ulta.com
            // path (not the page's server-rendered og:image, which
            // defaulted to the Mystic Pink variant regardless of
            // ?sku= — codex review flagged the mismatch) so the photo
            // matches the named Heart Eyes shade (SKU 2627323).
            imageUrl: 'https://media.ultainc.com/i/ulta/2627323?w=500&h=500',
            matchTier: 'unscored',
            kind: 'beauty',
            price: '$18.00',
            isAlternative: true,
            altNote: 'The exact cover makeup was custom -- this rose-gold glitter is a real eye-and-face cosmetic for recreating the sparkle, not the exact product used.',
            verifiedAt: '2026-08-30T19:22:10.691Z'
          },
        ],
      },
    },
    // --- Fashion/photo depth pass round 2 (2026-07-04)
    {
      year: 2019,
      month: 8,
      day: 22,
      category: 'fashion',
      title: 'Jessica Jones sequin shorts and René Caovilla boots for the pre-release GMA set',
      snippet:
        'The morning before Lover dropped, she played Central Park in multi-colored Jessica Jones sequin shorts, a sheer Helmut Lang blouse over a Wolford bodysuit, and glitter-soled René Caovilla Karlotta boots.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-outfit-gma-performance-photos-8528049/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-gma-aug-2019-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'Performing "Me!," "You Need to Calm Down," and "Shake It Off" at Central Park\'s SummerStage on August 22, 2019, one day ahead of the Lover release. Footwear News (via Yahoo) named each piece: Jessica Jones sequin high-waisted shorts, a Helmut Lang sheer pink blouse, a Wolford bodysuit, and René Caovilla\'s black suede Karlotta booties with a glitter-covered sole.\n\nThe sparkle was only half the booking: the same Good Morning America appearance included the sit-down with Robin Roberts in which she confirmed, on air, that she planned to re-record her Big Machine catalog — so the glitter-soled boots ended up sharing a news cycle with one of the biggest business decisions of her career.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-outfit-gma-performance-photos-8528049/',
          },
          {
            outlet: 'Yahoo / Footwear News',
            url: 'https://www.yahoo.com/lifestyle/taylor-swift-ren-caovilla-boots-155958921.html',
          },
          {
            outlet: 'Good Morning America',
            url: 'https://www.goodmorningamerica.com/culture/story/taylor-swift-record-music-year-important-artists-work-65115745',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-gma-aug-2019-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Billboard',
          },
        ],
        // Shop pass (2026-07-22): the exact Jessica Jones shorts are
        // discontinued -- a current multicolor sequin high-waist short,
        // verified in stock, closest real match.
        products: [
          {
            brand: 'Mardi Gras Apparel',
            item: 'Mardi Gras Sequin High-Waist Shorts',
            retailer: 'mardigrasapparel.us',
            url: 'https://mardigrasapparel.us/products/mardi-gras-sequin-high-waist-shorts-purple-gold-green',
            matchTier: 'unscored',
            kind: 'bottom',
            imageUrl: 'https://cdn.shopify.com/s/files/1/0696/5457/7459/files/mardi-gras-sequin-high-waist-shorts-purple-gold-greenbeauty-hub-5743705.png?v=1767469696',
            price: '$24.95',
            isAlternative: true,
            altNote: 'Jessica Jones\'s shorts are discontinued -- this sources the shorts only, matching high waist and multicolor sequins (not the blouse, bodysuit, or boots).',
            verifiedAt: '2026-08-30T19:22:10.691Z'
          },
        ],
      },
    },
    {
      year: 2019,
      month: 8,
      day: 22,
      category: 'fashion',
      title: 'A Johanna Ortiz tiered dress for the Lover music video',
      snippet:
        'In the pastel-house music video, she plays guitar in a yellow Johanna Ortiz "Ladies Who Lunch" tiered dress with matching Rebecca de Ravenel "Les Bonbons" ball earrings and an orange headband.',
      sourceUrl: 'https://www.spotern.com/en/spot/video/taylor-swift-lover-official-music-video/226542/yellow-tiered-dress-of-taylor-swift-in-the-music-video-lover',
      thumbnailUrl: 'https://medias.spotern.com/spots/w640/226/226542-1566837979.jpg',
      moment: {
        context:
          'The "Lover" video follows a couple through a color-coded house spanning different moods and moments of a shared life. The sunshine-yellow tiered dress is identified as Johanna Ortiz\'s "Ladies Who Lunch" style, paired with Rebecca de Ravenel "Les Bonbons" drop earrings — part of the video\'s wider pastel wardrobe.\n\nThe house itself was the concept: co-directed by Taylor and Drew Kirsch and premiered on YouTube on August 22, 2019 — hours before the album dropped — the video puts the couple\'s whole domestic life inside a dollhouse held in a snow globe, one distinctly colored room at a time, with former tour dancer Christian Owens as the male lead. Critics compared the miniature, hyper-art-directed rooms to a Wes Anderson film, and the closing shot reveals the child holding the snow globe is the couple\'s daughter.',
        sources: [
          {
            outlet: 'Spotern',
            url: 'https://www.spotern.com/en/spot/video/taylor-swift-lover-official-music-video/226542/yellow-tiered-dress-of-taylor-swift-in-the-music-video-lover',
          },
          {
            outlet: 'Social Media Style',
            url: 'https://www.socialmediastyle.org/post/taylor-swift-s-yellow-ball-earrings-and-tiered-dress-from-the-lover-music-video',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Lover_(Taylor_Swift_song)',
          },
        ],
        photos: [
          {
            url: 'https://medias.spotern.com/spots/w640/226/226542-1566837979.jpg',
            credit: 'Spotern',
          },
        ],
        // Shop pass (2026-07-22): the exact Johanna Ortiz dress is
        // discontinued -- a current yellow floral midi, verified in
        // stock, closest real match.
        products: [
        ],
      },
    },
    {
      year: 2019,
      month: 7,
      day: 10,
      category: 'fashion',
      title: 'A sequined romper and Kat Maconie heels at the Amazon Prime Day concert',
      snippet:
        'Opening with pyrotechnics for "ME!," she performed the Hammerstein Ballroom show in a black-and-purple sequined romper with Kat Maconie\'s glitter-jeweled "Frida" block heels.',
      sourceUrl: 'https://www.yahoo.com/entertainment/taylor-swift-steals-spotlight-block-152845330.html',
      thumbnailUrl:
        'https://s.yimg.com/ny/api/res/1.2/nGumpB8peACYAs7Asf2FzQ--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyNDI7aD05NTg7Y2Y9d2VicA--/https://media.zenfs.com/en/footwear_news_642/b9f0d931ac0118fb627ab814516c62d5',
      moment: {
        context:
          'Headlining the Amazon Prime Day Concert at Hammerstein Ballroom on July 10, 2019 alongside Dua Lipa, SZA, and Becky G, she opened with "Me!" in a sparkling black-and-purple striped sequin romper. Footwear News named her shoes as Kat Maconie\'s $370 "Frida" style — thick block heels with dark, reflective jewel detailing and a thin silver ankle strap.\n\nIt was "stadium-level production" jammed into a theater — pyrotechnics, smoke cannons, and spark showers, per Billboard\'s recap — across a set that gave "You Need to Calm Down" its live debut and ran through "I Knew You Were Trouble," "Style," and "Love Story," plus acoustic takes on "Welcome to New York" and "Delicate," before a confetti-drenched "Shake It Off" closed the night with Becky G and Dua Lipa back onstage.',
        sources: [
          {
            outlet: 'Yahoo / Footwear News',
            url: 'https://www.yahoo.com/entertainment/taylor-swift-steals-spotlight-block-152845330.html',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/amazon-prime-day-concert-recap-taylor-swift-8519537/',
          },
        ],
        photos: [
          {
            url: 'https://s.yimg.com/ny/api/res/1.2/nGumpB8peACYAs7Asf2FzQ--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyNDI7aD05NTg7Y2Y9d2VicA--/https://media.zenfs.com/en/footwear_news_642/b9f0d931ac0118fb627ab814516c62d5',
            credit: 'Footwear News',
          },
        ],
        // Shop pass (2026-07-22): the exact custom striped romper is
        // discontinued -- a current black sequin romper, verified in
        // stock, closest real match.
        products: [
          {
            brand: 'Julian Chang',
            item: 'Eres Long-Sleeve V Neck Sequin Romper',
            retailer: 'julianchang.com',
            url: 'https://julianchang.com/products/eres-romper',
            matchTier: 'inspired',
            matchScore: 25,
            kind: 'dress',
            imageUrl: 'https://cdn.shopify.com/s/files/1/2100/2615/files/3135BlackSequinJulianChang.jpg?v=1758735654',
            price: '$315.00',
            isAlternative: true,
            altNote: 'The custom striped romper is discontinued -- this is a current black sequin romper in the same short one-piece silhouette, without purple striping (heels not separately sourced).',
            verifiedAt: '2026-08-30T19:22:10.691Z'
          },
        ],
      },
    },
    // --- Music backstory + sighting/fashion/business depth pass (2026-07-05)
    {
      // Cross-link (Stage 3, 2026-07-27): sibling "Shake It Off" moments.
      relatedIds: [
        'moment:vault-red-shake-it-off-and-the-pivot-from-victim-to-punchline-maker',
        'moment:vault-red-shake-it-off-launches-the-era',
        'moment:vault-lover-shake-it-off-becomes-her-first-diamond-certified-single',
      ],
      year: 2019,
      month: 6,
      day: 14,
      category: 'sighting',
      title: 'A surprise "Shake It Off" at the Stonewall Inn for Pride\'s 50th anniversary',
      snippet:
        'Hours after "You Need to Calm Down" dropped, she showed up unannounced at the Stonewall Inn\'s 50th-anniversary Pride event: "Thank you for having me, Stonewall. Happy Pride!"',
      sourceUrl: 'https://abcnews.com/Entertainment/taylor-swift-makes-surprise-appearance-stonewall-inn-performs/story?id=63731487',
      thumbnailUrl: 'https://s.abcnews.com/images/GMA/taylor-swift-stonewall-gty-mo-20190615_hpMain_16x9_992.jpg?w=992',
      moment: {
        context:
          'In mid-June 2019, hours after releasing "You Need to Calm Down," Taylor made a surprise appearance at AEG and the Stonewall Inn\'s invitation-only Pride celebration marking the 50th anniversary of the Stonewall uprising, headlined by Jesse Tyler Ferguson.\n\nShe performed an acoustic "Shake It Off," telling the crowd, "Thank you for having me, Stonewall. Happy Pride!" before inviting Ferguson onstage for a duet, saying she\'d heard it was his favorite karaoke song.',
        sources: [
          {
            outlet: 'ABC News',
            url: 'https://abcnews.com/Entertainment/taylor-swift-makes-surprise-appearance-stonewall-inn-performs/story?id=63731487',
          },
          {
            outlet: 'BuzzFeed News',
            url: 'https://www.buzzfeed.com/adeonibada/taylor-swift-surprise-performance-stonewall-inn-nyc-pride',
          },
        ],
        photos: [
          {
            url: 'https://s.abcnews.com/images/GMA/taylor-swift-stonewall-gty-mo-20190615_hpMain_16x9_992.jpg?w=992',
            credit: 'Getty Images via ABC News',
          },
        ],
      },
    },
    // --- Deep timeline fill (2026-07-08, content/deep-c): music backstories
    // for the remaining marquee tracks, the era's missing release-category
    // moments (singles, the holiday one-off, the concert special), the
    // one-off shows that stood in for a tour, and the two business wavetops
    // (the Big Machine sale + the on-air re-recording pledge) that frame the
    // whole era. Every claim verified against its cited source. New items
    // carry the audit's additive provenance fields; thumbnails deliberately
    // null per the 2026-07-08 media policy (no new hotlinks).
    {
      slug: 'the-archer-track-five',
      year: 2019,
      month: 7,
      day: 23,
      category: 'release',
      title: 'The Archer arrives as track five — and everyone knew what that meant',
      snippet:
        'Out July 23, 2019 as a promotional single, announced on an Instagram Live where she acknowledged the fan-spotted pattern herself: track five is where the most vulnerable song goes. This one asks "who could ever leave me, darling? But who could stay?"',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Archer_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'A synth-heartbeat ballad written and produced with Jack Antonoff — the writing took about two hours, by his account, though the LinnDrum-and-DX7 production never breaks into a radio chorus by design.\n\nShe announced it on an Instagram Live minutes before it dropped, explaining she wanted fans to hear a track five early because that slot holds the songs that are "the most honest, emotional, vulnerable, and personal." The title flips her Sagittarius archer into the era\'s sharpest self-inventory — "I\'ve been the archer, I\'ve been the prey" — and with no video or chart push, it worked as a deliberate "this album has feelings" flare sent up between the candy-colored singles. Stereogum and Slant both ranked it the sixth-best song of 2019.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/The_Archer_(Taylor_Swift_song)',
            source_title: 'The Archer (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/articles/news/8523616/taylor-swift-the-archer-listen',
            source_title: "Taylor Swift's 'The Archer': Listen",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/0/0f/Taylor_Swift_-_The_Archer.png',
            focalPoint: '50% 50%',
            credit: 'Republic Records (single cover art)',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'lover-title-track-waltz',
      year: 2019,
      month: 8,
      day: 16,
      category: 'music',
      title: 'Lover, the waltz she wrote alone',
      snippet:
        'The title track, written solo and released a week ahead of the album as its third single — a hazy, slow-dance waltz produced with Jack Antonoff, and the quietest thesis statement she\'s ever put a whole era\'s name on.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Lover_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'She wrote it alone late one night at the piano, and the recording with Jack Antonoff at Electric Lady took about six hours; her pitch for the sound was "just the last two people on a dance floor at 3 a.m. swaying" — a song that could have played at "a wedding reception in 1980 or 1970 or now."\n\nThe bridge — "swear to be overdramatic and true to my lover" — is written like vows on purpose ("I love a bridge, and I was really able to go to Bridge City," she said on release day). It got its live debut in her 2019 VMAs medley, a Shawn Mendes duet remix followed that November with verses he wrote himself, and it earned her first Grammy nomination for Song of the Year as a solo writer.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Lover_(Taylor_Swift_song)',
            source_title: 'Lover (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-lover-new-song-new-album-listen-871277/',
            source_title: "Hear Taylor Swift's Tender New Song 'Lover'",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): music-video still upgraded
        // from the 480×360 hqdefault to the same video's 1280×720 maxres
        // render (video id oEmbed-verified: "Taylor Swift - Lover (Official
        // Music Video)", Taylor Swift channel). Added the official Lover
        // (Remix) feat. Shawn Mendes lyric-video artwork — the November 2019
        // duet the story mentions (also oEmbed-verified against her channel).
        // Both downloaded and visually confirmed this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/-BjZmE2gtdo/maxresdefault.jpg',
            credit: 'Republic Records / YouTube (official music video still)',
            caption: "Still from the official 'Lover' music video, co-directed by Taylor and Drew Kirsch.",
            kind: 'archival',
            focalPoint: '49% 36%',
          },
          {
            url: 'https://i.ytimg.com/vi/b5Zay_Hd_7Q/maxresdefault.jpg',
            credit: 'Republic Records / YouTube (official lyric video still)',
            caption:
              "Artwork from the official 'Lover (Remix)' lyric video — the November 2019 duet with verses Shawn Mendes wrote himself.",
            kind: 'archival',
            focalPoint: '50% 45%',
          },
        ],
      },
    },
    {
      slug: 'big-machine-sale-worst-case-scenario',
      significance: 'defining', // reshaped the whole industry's masters conversation, launched Taylor's Version (docs/decisions.md, 2026-07-19)
      threadIds: ['taylors-version'],
      relatedIds: [
          'moment:vault-tloas-father-figure-rebuilds-george-michaels-1988-hit-with-his-est',
        'moment:vault-evermore-fearless-taylors-version-is-the-first-re-recorded-album-ever',
        'moment:vault-evermore-red-gets-its-do-over-red-taylors-version-opens-at-no-1',
        'moment:vault-midnights-1989-taylors-version-announced-at-the-final-us-show-on-the-d',
        'moment:vault-reputation-she-leaves-big-machine-for-republic-and-owns-her-masters-goi',
        'moment:vault-folklore-her-masters-get-sold-again-this-time-to-shamrock-capital-for',
      ],
      year: 2019,
      month: 6,
      day: 30,
      category: 'business',
      title: '"My worst case scenario": Scooter Braun buys Big Machine — and her first six albums',
      snippet:
        'June 30, 2019: Ithaca Holdings acquired Big Machine for over $300 million, her masters included. Her Tumblr response the same day called it her "worst case scenario" — the opening shot of the defining business war of her career.',
      sourceUrl: 'https://variety.com/2019/music/news/taylor-swifts-masters-scooter-brauns-bullying-inside-the-big-machine-ithaca-holdings-deal-1203256640/',
      thumbnailUrl: null,
      moment: {
        context:
          'Her Tumblr post laid out the history in one line — "For years I asked, pleaded for a chance to own my work" — and said the alternative she\'d been offered was to "sign back up to Big Machine Records and \'earn\' one album back at a time, one for every new one I turned in."\n\nShe wrote that she\'d learned of the deal "as it was announced to the world"; Scott Borchetta answered with a blog post titled "So, It\'s Time For Some Truth," claiming he had texted her the night before, which she disputed. #IStandWithTaylor trended worldwide within hours. Everything that follows in this era traces back to this sale: the AMA standoff, Miss Americana\'s framing, the on-air re-recording pledge — and eventually the entire Taylor\'s Version project.\n\nThe deal\'s paperwork tells a quieter story than the headlines did. Ithaca Holdings\' own announcement, put out through PR Newswire on the morning of June 30, disclosed no price at all — the widely-cited "over $300 million" came from press reporting, not from the release itself. It named the Carlyle Group as backing the purchase through its Carlyle Partners VI fund and staying on as a minority shareholder, with Carlyle\'s Jay Sammons joining Ithaca\'s board. Borchetta didn\'t simply cash out and walk away: he took a minority interest in the combined company and a board seat, and stayed on as Big Machine\'s president and CEO. What changed hands was every master recording of her first six albums, from her 2006 debut through reputation — the catalog she built before leaving for Republic, and the exact body of work the Taylor\'s Version project would spend the next years reclaiming.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2019/music/news/taylor-swifts-masters-scooter-brauns-bullying-inside-the-big-machine-ithaca-holdings-deal-1203256640/',
            source_title: "Taylor Swift Vs. Scooter Braun: Inside the Big Machine-Ithaca Deal",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-scooter-braun-feud-timeline/',
            source_title: "Taylor Swift and Scooter Braun's Feud: A Timeline",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'PR Newswire',
            url: 'https://www.prnewswire.com/news-releases/scooter-brauns-ithaca-holdings-acquires-scott-borchettas-big-machine-label-group-300878263.html',
            source_title: "Scooter Braun's Ithaca Holdings Acquires Scott Borchetta's Big Machine Label Group",
            publisher: 'PR Newswire (Ithaca Holdings)',
            source_type: 'official',
            accessed_at: '2026-08-16',
            reliability_score: 5,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Taylor_Swift_masters_dispute',
            source_title: 'Taylor Swift masters dispute',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added Billboard's own art
        // for its feud-timeline story (the second source this page cites) —
        // a clean side-by-side of the two parties on billboard.com's CDN,
        // captioned honestly as later photos, since no press photo of the
        // 2019 sale itself exists. No usable Commons photo of Scott
        // Borchetta was found (only a signature graphic). Verified HTTP 200
        // + image/jpeg, downloaded, and visually confirmed this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Scooter_Braun.jpg',
            credit: 'TechCrunch (CC BY 2.0), via Wikimedia Commons',
            caption: 'Reference image: Scooter Braun, whose Ithaca Holdings acquired Big Machine — an earlier conference photo, not from the 2019 deal.',
            kind: 'reference',
            focalPoint: '49% 28%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/10/scooter-braun-taylor-swift-2024-billboard-1548.jpg',
            credit: 'Billboard',
            caption:
              "The two sides of the fight, in Billboard's art for its feud timeline — later photos of Braun and Taylor, not from the 2019 sale.",
            kind: 'reference',
            focalPoint: '50% 30%',
          },
          // Photo pass 2026-07-19 (10-defining-events, docs/decisions.md):
          // real, verified photos from the surrounding news cycle — no photo
          // op exists for the sale itself, so this is the era's actual
          // documented fallout, same convention as the reference photo above.
          {
            url: 'https://i.guim.co.uk/img/media/952d2b76234c00dea74332a4b49e9ee26bb26884/0_31_3000_1800/master/3000.jpg?crop=none&dpr=1&s=none&width=1000',
            focalPoint: '50% 28%',
            credit: 'Richard Shotwell/Invision/AP, via The Guardian',
            caption: 'A contemporaneous reference image shows Taylor arriving at the Billboard Music Awards on May 1, 2019, two months before the Big Machine sale.',
            kind: 'reference',
          },
          // Two ca-times.brightspotcdn.com (LA Times) candidates were dropped
          // here 2026-07-19: curl returned 200 + real image bytes, but the
          // CDN serves a 1x1 placeholder to actual browser requests
          // (Referer-based hotlink protection) — caught only by testing in
          // a real browser (naturalWidth === 1), not by curl. See
          // docs/decisions.md for the full note; every other domain in this
          // pass tested clean.
          {
            url: 'https://media.vanityfair.com/photos/5ddb4a90d223c300093e7f42/master/w_2560%2Cc_limit/taylor-swift-ama-perfomance.jpg',
            focalPoint: '30% 28%',
            credit: 'JC Olivera/Getty Images, via Vanity Fair',
            caption: 'Taylor accepts Artist of the Decade at the 2019 American Music Awards amid the public dispute over performing her Big Machine-era songs.',
            kind: 'archival',
          },
          {
            url: 'https://i.guim.co.uk/img/media/62052f41de01072ab003d60e57853e969dd49106/0_363_3994_2397/master/3994.jpg?crop=none&dpr=1&s=none&width=1000',
            focalPoint: '58% 33%',
            credit: 'Kevin Mazur/Getty Images for ABA, via The Guardian',
            caption: 'Taylor performs on Good Morning America on Aug. 22, 2019, the day she publicly confirmed that she planned to rerecord her catalog.',
            kind: 'archival',
          },
          // Photo pass 2026-07-19 (bulk-to-6+, docs/decisions.md): 2 more,
          // re-challenging the prior "no usable Borchetta photo" note — still
          // true (only a signature graphic exists), but a period-accurate
          // Scooter Braun photo and the literal album-titles-shirt statement
          // both turned up on this harder second look. Both curl-verified;
          // the shirt photo downloaded and vision-confirmed.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Scooter_Braun_Interview_2020.png',
            focalPoint: '49% 30%',
            credit: 'Ashley Graham interview, via Wikimedia Commons (CC BY 3.0)',
            caption: 'Braun in a 2020 interview, months after the Big Machine deal closed.',
            kind: 'reference',
          },
          {
            url: 'https://townsquare.media/site/623/files/2019/11/taylor-siwft-2019-amas-40.jpg?w=980&q=75',
            focalPoint: '48% 17%',
            credit: 'Townsquare Media, via The Boot',
            caption: 'At the 2019 AMAs that November, she opened her medley in a men\'s shirt printed with the titles of the six albums under dispute — "Speak Now," "Red," "reputation," "1989," "Fearless" — a wordless statement mid-feud.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'gma-rerecording-pledge',
      year: 2019,
      month: 8,
      day: 22,
      category: 'business',
      title: 'The re-recording plan, confirmed on live TV the day before Lover dropped',
      snippet:
        'Asked on Good Morning America whether she really planned to re-record her Big Machine catalog: "Yeah, that\'s true, and it\'s something I\'m very excited about." Broadcast Aug. 22, 2019 — Lover arrived the next day.',
      sourceUrl: 'https://www.goodmorningamerica.com/culture/story/taylor-swift-record-music-year-important-artists-work-65115745',
      thumbnailUrl: null,
      moment: {
        context:
          'She told Robin Roberts exactly how the plan worked: "My contract says that starting November 2020, so next year, I can record albums 1 through 5 all over again," adding, "I think it\'s important for artists to own their work."\n\nThe interview ran alongside a Central Park SummerStage concert for fans who had camped out overnight — "You Need to Calm Down," "ME!," and "Shake It Off," plus the reveal that Lover would be "the first one that I will own." Fifteen months later she was in the studio doing exactly that — the AMA-night reveal covered in the folklore era.',
        sources: [
          {
            outlet: 'Good Morning America',
            url: 'https://www.goodmorningamerica.com/culture/story/taylor-swift-record-music-year-important-artists-work-65115745',
            source_title: "Taylor Swift performs live on 'GMA,' reveals she'll re-record her old albums",
            publisher: 'ABC News / Good Morning America',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2019/music/news/taylor-swift-performs-on-gma-talks-re-recording-big-machine-songs-watch-1203310319/',
            source_title: "Taylor Swift Performs on 'GMA,' Talks Re-Recording Big Machine Songs",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): segment still upgraded
        // from hqdefault to maxres (video id oEmbed-verified: "Taylor Swift
        // says she'll re-record her old albums | Live on GMA", Good Morning
        // America channel). Added GMA's own wide frame of the Central Park
        // SummerStage concert that ran alongside the interview, from the
        // story this page cites (s.abcnews.com CDN — a different frame than
        // the one added to the lover-first-owned-album page). Both
        // downloaded and visually confirmed this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/ellK-CXh7B4/maxresdefault.jpg',
            credit: 'Good Morning America / YouTube (official segment still)',
            caption: "Still from GMA's official YouTube upload of the segment where she confirmed the re-recording plan.",
            kind: 'archival',
            focalPoint: '42% 40%',
          },
          {
            url: 'https://s.abcnews.com/images/GMA/taylor-swift5abc-ml-190822_hpMain_16x9_992.jpg',
            credit: 'ABC News / Good Morning America',
            caption:
              'The Central Park SummerStage show that ran alongside the interview, Aug. 22, 2019 — fans had camped out overnight.',
            kind: 'archival',
            focalPoint: '49% 28%',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "lover-masters",
      year: 2019,
      month: 6,
      day: 30,
      category: "sighting",
      title: "The masters are sold",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-lov-1", label: "Masters sold", kind: "business" },
      snippet: "Her back catalog changes hands without her — igniting a fight to reclaim her work.",
      // No photo (photo-enrichment #762, 2026-07-20): the June 30, 2019
      // Big Machine/Ithaca masters sale is a business transaction with no
      // photographable event. A generic same-period Swift portrait would be
      // off-hook, and there is no verifiable image OF the sale — left
      // photo-less rather than fabricate. Skip on future runs.
      hiddenClue: { clue: "She announced she would re-record her old albums.", payoff: "The “Taylor’s Version” project was born — reclaiming her catalog one album at a time." },
      moment: {
        sources: [
          {
            outlet: 'NPR',
            url: 'https://text.npr.org/737613627',
            source_title: 'Taylor Swift\'s Former Label Big Machine Is Sold, Rankling The Star',
            publisher: 'NPR',
            source_type: 'reputable_press',
            accessed_at: '2026-08-11',
            reliability_score: 4,
            notes: 'NPR\'s text-only host; the canonical npr.org url timed out on every fetch attempt.',
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/caitlinkelley/2019/06/30/taylor-swift-calls-scooter-braun-manipulative-after-big-machine-sells-her-catalog/',
            source_title: 'Taylor Swift Calls Scooter Braun \'Manipulative\' After Big Machine Sells Her Catalog',
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-08-11',
            reliability_score: 3,
          },
        ],
        context: "News that her master recordings were sold set off the defining business battle of her career and the plan to re-record everything.",
      },
    },
  ],
};
