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
        // or Commons host tied to this specific Nov. 2017 chart week. Stays
        // reviewed-sparse at one image.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Taylor_Swift_-_Reputation.png',
            credit: 'Big Machine Records',
            focalPoint: '42% 35%',
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
            note: 'Forward-looking, unannounced-music speculation (allowed by the redlines). The quotes are on record; the open question is whether and when a reputation re-record or its Vault tracks arrive — resolves on an official announcement, fades if the window stays empty. Distinct from the debut "Taylor\'s Version" rumor (the debut is fully re-recorded per the same letter). No location.',
            sourceTier: 'established',
            lastCheckedOn: '2026-07-25',
          },
          {
            claim:
              'Among the specific songs fans theorized could land on a reputation re-recording, the most persistent was "This Is What You Came For" — the 2016 Calvin Harris/Rihanna hit Taylor secretly co-wrote as "Nils Sjöberg" — alongside the Zayn duet "I Don\'t Wanna Live Forever," with fans reading her acoustic Eras Tour surprise-song performances of both as tea leaves.',
            reportedBy: 'Capital FM',
            reportedOn: '2025-09-30',
            status: 'unconfirmed',
            url: 'https://www.capitalfm.com/artists/taylor-swift/reputation-taylors-version-vault-tracks/',
            note: 'Pure fan speculation about an unannounced tracklist, aggregated by Capital — carried at the lowest source tier. Resolves if a reputation Vault release confirms or excludes these songs, and fades if no such release materializes. No location.',
            sourceTier: 'social',
            lastCheckedOn: '2026-07-25',
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
            note: 'The lyric edits are documented; the re-record tease is the unconfirmed read. The coverage cuts both ways — Taylor is on record calling reputation the one early album she thought "couldn\'t be improved upon by redoing it," while still promising its Vault tracks would one day "hatch." Resolves on an announced re-record or Vault release; fades if the window stays empty. No location.',
            sourceTier: 'established',
            lastCheckedOn: '2026-07-27',
          },
        ],
      },
    },
    {
      year: 2017,
      month: 8,
      day: 24,
      category: 'music',
      title: 'Look What You Made Me Do, and the phone call it started with',
      snippet: 'By her own account, it began as a poem about deciding who she could trust.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Look_What_You_Made_Me_Do',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/6/68/Taylor_Swift_-_Look_What_You_Made_Me_Do.png',
      relatedIds: [
          'moment:vault-ttpd-thank-you-aimee-the-capitalization-does-the-talking',
        'moment:vault-1989-snakes-snapchat-and-excluded-from-this-narrative',
        'moment:vault-1989-the-full-call-leaks-and-she-was-telling-the-truth',
        // Diss-lineage thread (ledger #1530): the Showgirl "answer-record" that
        // reviewers read as her latest entry in this same feud-song tradition.
        'moment:vault-tloas-actually-romantic-the-diss-track-she-frames-as-a-compliment',
      ],
      moment: {
        context:
          "Released August 24, 2017 — one day after the album announcement — it began, by her account, as a poem about realizing she could only trust a few people. Jack Antonoff co-wrote and co-produced, and Right Said Fred earned writing credits for the \"I'm Too Sexy\" interpolation carrying the chorus.\n\nThe bridge stages a phone call announcing that the old Taylor \"can't come to the phone right now\" because she's dead — and she later told Rolling Stone the device played on \"a stupid phone call I shouldn't have picked up\": the 2016 Kanye West call at the center of the Kim Kardashian \"Famous\" fallout. The single ended Despacito's 16-week run at No. 1 on the Hot 100 with the largest sales-and-streaming week of 2017.",
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Look_What_You_Made_Me_Do' },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/taylor-swift-rolling-stone-interview-880794/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/6/68/Taylor_Swift_-_Look_What_You_Made_Me_Do.png',
            credit: 'Big Machine Records',
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
      relatedIds: ['moment:vault-midnights-the-eras-tour-kicks-off-in-glendale'],
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
          "Opening night at University of Phoenix Stadium on May 8, 2018 grossed $7.2 million on its own, with Camila Cabello and Charli XCX opening the show — and briefly joining her on stage for a three-way \"Shake It Off.\" The 59,157 fans in the building broke a venue attendance record One Direction had held since 2014, and they broke it by 2,633 seats.\n\nIt was the first all-stadium tour of her career, launched behind an album rolled out with almost no press interviews: 53 shows across seven countries that would close six months later as the highest-grossing U.S. tour in Billboard Boxscore history.\n\nThe reclaimed snake from the album rollout got its full-size payoff on this stage: a towering animatronic serpent — fans nicknamed her Karyn — loomed over the set for \"Look What You Made Me Do\" every night of the run.",
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
      year: 2017,
      month: 8,
      day: 17,
      category: 'music',
      significance: 'defining', // reputation's pivot: the deliberate year-long disappearance the album answers, anchored on the eve of the Aug-18 blackout that ended it (#1238)
      relatedIds: [
        // The re-emergence that ended the silence…
        'moment:vault-reputation-the-snake-video-that-announced-reputation',
        // …and the July 2016 pile-on (told in the 1989 era) that caused it.
        'moment:vault-1989-snakes-snapchat-and-excluded-from-this-narrative',
      ],
      title: 'The year of silence',
      snippet:
        'After the summer 2016 pile-on, the most-watched woman in pop did the one thing no one expected — she vanished, and stayed gone for roughly a year.',
      sourceUrl: 'https://www.rollingstone.com/music/music-news/taylor-swift-miss-americana-trailer-941161/',
      thumbnailUrl: null,
      moment: {
        context:
          "After the summer 2016 fallout — the leaked \"Famous\" call, Kim Kardashian's \"National Snake Day,\" the snake emojis flooding every post until Instagram tested a comment filter on her page — Taylor did the one thing nobody expected of the most-watched pop star alive: she stopped showing up. Through late 2016 and into 2017 there were no interviews, no magazine covers, no award-show appearances, no new music. The most documented woman in pop simply went quiet and let the noise run itself out without her in the frame.\n\nShe later framed the withdrawal as deliberate. \"Nobody physically saw me for a year,\" she says in the 2020 documentary Miss Americana, \"and I thought that that was what they wanted\" — a retreat that, in her telling, woke her up from \"constantly feeling that I was fighting for people's respect.\" The silence was not empty: out of view she was building the record that would answer it, reputation, which arrived November 10, 2017. The disappearance is the setup the whole era pays off — the reason the snake, when it finally slithered back onscreen that August, read as armor instead of apology.\n\nThe withdrawal was near-total, but not absolute. She skipped the 2017 award-show circuit, sat for no interviews and mounted no promotion, yet the machine kept running without her at the front of it: in December 2016 she surfaced on \"I Don't Wanna Live Forever,\" a Fifty Shades Darker duet with Zayn Malik that climbed the Hot 100, and her back catalogue kept charting on its own. The point was the absence itself. With no fresh statements to react to, the narrative that had consumed her summer had nothing left to feed on — and by the time the snake slithered back that August, the terms of the conversation had quietly reset in her favor.",
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-miss-americana-trailer-941161/',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Reputation_(album)',
          },
          {
            // Depth pass #1719 (2026-08-12): third source for the 2016–17
            // withdrawal details (skipped awards, the Zayn duet) added above.
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-2017-timeline-8070261/',
          },
        ],
        // Photo pass (#1238, this run): a year defined by her *not* being
        // photographed has no honest representative image — the same reasoning
        // the snake-teaser item below records for its social-only window. Ship
        // text; let the photo-sparsity checker route it to Photo Enrichment
        // rather than force an off-subject or misrepresenting crop (charter 3b).
        photos: [],
      },
    },
    {
      year: 2017,
      month: 8,
      day: 21,
      category: 'release',
      significance: 'defining', // the visual rebirth after the Kimye-leak silence; reputation's whole aesthetic starts here (docs/decisions.md, 2026-07-19)
      relatedIds: [
        // The year-long silence this reveal ended (#1238).
        'moment:vault-reputation-the-year-of-silence',
        'moment:vault-1989-snakes-snapchat-and-excluded-from-this-narrative',
        'moment:vault-reputation-look-what-you-made-me-do-and-the-phone-call-it-started-with',
        // Cross-link (candidate #1027): the Showgirl portraits — Mert & Marcus's
        // first Swift shoot since this reputation cover reveal.
        'moment:vault-tloas-the-showgirl-portraits-mert-and-marcus-rhinestones-and-an-op',
      ],
      title: 'The snake video that announced reputation',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-rep-0", label: "Snake video drops", kind: "life" },
      snippet:
        'She wiped her social media clean, then reappeared three days later with a slithering snake video — a reclaimed symbol before the album title and Nov. 10 release date dropped.',
      sourceUrl: 'https://www.refinery29.com/en-us/2017/08/168987/taylor-swift-snake-instagram-video-symbolism-emoji',
      thumbnailUrl: null,
      moment: {
        context:
          "The blackout began August 18, 2017, when her Instagram, Twitter, Tumblr, and official website all went blank at once. At noon on August 21 came the first post-wipe post: a glitchy, fuzzy clip of what was eventually recognizable as a slithering snake tail, with more fragments following over the next two days — until August 23 brought the album title, the Mert & Marcus cover, and the November 10 release date.\n\nThe symbol was a pointed reclamation: after the July 2016 \"Famous\" fallout, when Kim Kardashian's \"National Snake Day\" tweet sent snake emojis flooding her accounts so heavily that Instagram tested a comment-filtering tool on her page, she made the snake the era's opening image.\n\nThe teaser's mechanics were as deliberate as its symbol. The August 18 wipe hit every platform at once — Instagram, Twitter, Facebook, Tumblr and her website — and she unfollowed everyone she had been following, stripping the accounts bare. The snake then arrived in three installments: the tail first, then a squirming middle, and finally a red-eyed, open-fanged head lunging at the camera, so the full animal only assembled across the three posts. The August 23 announcement kept the same three-part cadence, adding that the lead single, \"Look What You Made Me Do,\" would land the following night. What a year earlier had been an insult hurled at her — Kim Kardashian's snake emojis — she had turned into a mark she owned outright, opening the era on her own terms. Commentators read the reclamation as a textbook act of narrative control: rather than deny the meme, she absorbed it, so the symbol used to shame her became the era's logo, the tour's animatronic set pieces, and the visual signature of a best-selling comeback.",
        sources: [
          {
            outlet: 'Refinery29',
            url: 'https://www.refinery29.com/en-us/2017/08/168987/taylor-swift-snake-instagram-video-symbolism-emoji',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-reputation-new-album-7941019/',
          },
          {
            // Depth pass #1719 (2026-08-12): third source for the three-part
            // teaser / blackout mechanics added to the narrative.
            outlet: 'Fortune',
            url: 'https://fortune.com/2017/08/21/taylor-swift-instagram-new-album',
          },
        ],
        // T16 photo pass (2026-07-09): the Instagram teaser frames themselves are
        // unhostable-quality glitch fragments; the Mert & Marcus cover revealed on
        // August 23 is the artifact the teasers built to. Wikipedia's stable
        // upload.wikimedia.org copy, verified HTTP 200 + image/png this session.
        // Photo-enrichment pass (2026-07-18, #762): re-checked — the snake
        // clip still lives only in Instagram embeds (UPI 403s, CBS/Billboard
        // embed rather than host a frame), so the T16 judgment stands and the
        // page stays at one image. Focal point set by eye this run.
        // Photo pass 2026-07-19 (bulk-to-6+, docs/decisions.md): re-challenged
        // a third time — CBS News and Billboard's own teaser-story pages
        // still only embed the Instagram clips rather than host a frame
        // (confirmed again this pass). Genuinely no photographable content
        // exists for this specific 3-day, social-only teaser window: no
        // press photography, no hostable video frame. Added the tour's later
        // full-size snake payoff (already verified for the Stadium Tour
        // item, reused here under the checker's 3-use limit) rather than
        // leave this at one image, but did not force fabricated or
        // low-confidence sourcing to hit a photo count on a story this thin.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/f2/Taylor_Swift_-_Reputation.png',
            credit: 'Big Machine Records',
            caption: 'The Mert & Marcus album cover revealed on August 23, 2017 — the payoff of the three-day snake-video teaser rollout.',
            kind: 'archival',
            focalPoint: '42% 35%',
          },
          {
            url: 'https://www.nme.com/wp-content/uploads/2018/05/GettyImages-956288820-1.jpg',
            // Photo pass #762 (2026-08-01): same frame as the Stadium Tour
            // page above — matching that page's focal point for consistency.
            focalPoint: '55% 35%',
            credit: 'Kevin Mazur/Getty Images for TAS, via NME',
            caption: 'The reclaimed snake\'s full-size payoff, a year later: the reputation Stadium Tour\'s animatronic mascot, fans nicknamed her Karyn.',
            kind: 'archival',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/3/38/Taylor_Swift_-_Reputation_Tour_Seattle_-_Look_What_You_Made_Me_Do.jpg',
            // Photo pass #762 (2026-08-01): same frame as the Stadium Tour
            // page above — matching that page's focal point for consistency.
            focalPoint: '68% 55%',
            credit: 'Ronald Woan, Wikimedia Commons (CC BY-SA 2.0)',
            caption: 'Golden snake set pieces on the reputation Stadium Tour, Seattle, May 2018 — the visual language this teaser opened.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2017,
      month: 11,
      day: 9,
      category: 'music',
      title: "New Year's Day closes reputation on a quiet, acoustic note",
      snippet: 'After an album about scandal and revenge, the final track is a piano ballad about who does the dishes the morning after.',
      sourceUrl: "https://en.wikipedia.org/wiki/New_Year's_Day_(Taylor_Swift_song)",
      thumbnailUrl: null,
      moment: {
        context:
          'Written and produced with Jack Antonoff, it got the era\'s first televised moment: a living-room performance taped at her Rhode Island home during a secret session, fans swaying around the piano, aired mid-episode during ABC\'s Scandal on November 9, 2017 — hours before the album dropped at midnight.\n\nSent to country radio weeks later, it became her first entry on a Billboard country chart since 2013. Her reasoning for the song itself: "I think there\'s something even more romantic about who\'s gonna deal with you on New Year\'s Day. Who\'s willing to give you Advil and clean up the house? I think that states more of a permanence."',
        sources: [
          { outlet: 'Wikipedia', url: "https://en.wikipedia.org/wiki/New_Year's_Day_(Taylor_Swift_song)" },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-new-years-day-video-live-scandal-8031153/',
          },
        ],
        // T16 photo pass (2026-07-09): Wikimedia Commons, CC BY-SA 2.0, author
        // Ronald Woan — license verified on the file page this session; the song
        // lived on the tour as the piano mashup this photo captures.
        // Photo-enrichment pass (2026-07-18, #762): added two ABC stills of the
        // actual televised moment this item describes — the candlelit Rhode
        // Island living-room performance aired during Scandal — from ABC News's
        // own article on the premiere (s.abcnews.com, allowed CDN). Both
        // curl-verified 200 + image/jpeg, downloaded and vision-confirmed
        // (grand piano, candles, ABC bug, ring of fans) this run.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Taylor_Swift_-_Reputation_Tour_Seattle_-_Long_Live-New_Years_Day_%28cropped%29.jpg',
            credit: 'Ronald Woan / Wikimedia Commons (CC BY-SA 2.0)',
            caption: "At the reputation piano in Seattle, May 22, 2018 — on tour the song was performed as a “Long Live / New Year's Day” piano mashup.",
            kind: 'archival',
            focalPoint: '48% 20%',
          },
          {
            url: 'https://s.abcnews.com/images/Entertainment/gma-tay-swift-piano-abc-hb-171109_16x9_992.jpg',
            credit: 'ABC',
            caption:
              'The candlelit living-room performance taped at her Rhode Island home, aired during Scandal on November 9, 2017 — 100 hand-picked fans around the piano.',
            kind: 'primary',
            focalPoint: '72% 35%',
          },
          {
            url: 'https://s.abcnews.com/images/Entertainment/gma-tay-swift-piano03-abc-hb-171109_16x9_992.jpg',
            credit: 'ABC',
            caption: 'At the piano mid-performance in the ABC broadcast, the night before reputation dropped.',
            kind: 'primary',
            focalPoint: '40% 42%',
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
            price: 'AU$90.00',
            isAlternative: true,
            altNote: 'The original tour bodysuit was custom, never sold at retail -- this is a current snake-print sequined bodysuit in the same silhouette (price in Australian dollars).',
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
            price: '$373.00',
            isAlternative: true,
            altNote: 'Her exact custom Naeem Khan piece is discontinued -- this is a current Tiffany-blue tiered-fringe dress in the same spirit, a fitted mini rather than the floor-to-mini reveal.',
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
            price: '$85.00',
            isAlternative: true,
            altNote: 'Her exact Balmain mirrored mini is long discontinued -- this is a current silver sequin mini in the same disco-ball spirit (thigh-high boots not separately sourced).',
          },
        ],
      },
    },
    {
      year: 2017,
      month: 8,
      day: 27,
      category: 'fashion',
      // Cross-link (Stage 3, 2026-07-27): sibling "Look What You Made Me Do"
      // moments. ("...and the phone call it started with" already sits at
      // the 4-link rail cap with other curated links, so this points only
      // at the video-record moment; not modifying that page's existing set.)
      relatedIds: [
        'moment:vault-reputation-look-what-you-made-me-do-and-the-phone-call-it-started-with',
        'moment:vault-reputation-the-look-what-you-made-me-do-video-shatters-youtubes-24-hour',
      ],
      title: 'Zombie makeup for Look What You Made Me Do',
      snippet:
        'The grave-crawling zombie look that opens the video was created by Bill Corso — the makeup artist behind Deadpool\'s scarred face — confirmed on record by director Joseph Kahn.',
      sourceUrl: 'https://www.etonline.com/taylor-swifts-look-what-you-made-me-do-video-everything-we-know-about-the-snakes-diamonds-dancing',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-zombie-transformation-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'Director Joseph Kahn confirmed via Twitter that special-makeup artist Bill Corso — who did Ryan Reynolds\' scarred prosthetic look in "Deadpool" — created zombie Taylor for the opening graveyard scene, a look deliberately pitched as the antithesis of her earlier, more polished eras.\n\nThe video was a seven-month build overall, conceived in January and shot over five days in Los Angeles that May, and the practical effects didn\'t stop at the makeup: the diamonds she bathes in were real, supplied by jeweler Neil Lane and valued at over $12 million.',
        sources: [
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/taylor-swifts-look-what-you-made-me-do-video-everything-we-know-about-the-snakes-diamonds-dancing',
          },
        ],
        // T-img pass (2026-07-10): swapped the video's bathtub-scene YouTube
        // thumbnail for Billboard's behind-the-scenes zombie-transformation
        // photo — verified HTTP 200 + image/jpeg and eyeballed this session;
        // it actually shows the graveyard zombie makeup the moment is about.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-zombie-transformation-billboard-1548.jpg?w=942&h=628&crop=1',
            // Face left-of-center at mid-height in this landscape frame.
            focalPoint: '42% 40%',
            credit: 'Billboard',
            caption: "Behind the scenes on the zombie makeup for \"Look What You Made Me Do\"'s graveyard opening.",
            kind: 'archival',
          },
        ],
        // Shop pass (2026-07-22): a makeup/SFX look, not a garment --
        // offering a real zombie SFX kit rather than forcing a clothing
        // link onto a beauty item.
        products: [
          {
            brand: 'Mehron',
            item: 'Zombie Professional Makeup Kit',
            retailer: 'jestpaint.com',
            url: 'https://jestpaint.com/products/mehron-premium-makeup-kit-new-zombie-professional-makeup-kit-kmp-ez',
            price: '$20.19',
            isAlternative: true,
            altNote: 'Bill Corso\'s bespoke film prosthetics were never sold at retail -- this is a current zombie SFX kit (creme colors, blood gel, latex, wax) for a similar undead effect.',
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
            price: '$320.00',
            isAlternative: true,
            altNote: 'The 800-hour Atelier Versace gown was custom couture, never sold at retail -- this is a current blush-pink one-shoulder feather-trim gown in the same color and spirit.',
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
        // media.gettyimages.com watermarked comp (banned host); replaced with
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
          {
            brand: 'Casa de Fashion',
            item: 'Party Vibes Black One-Shoulder Cutout Sequin Bodysuit',
            retailer: 'casadefashion.com',
            url: 'https://casadefashion.com/products/glam-me-up-black-cutout-sequin-bodysuit',
            price: '$46.00',
            isAlternative: true,
            altNote: 'Jessica Jones\'s custom bodysuit-and-jacket set was never sold at retail -- this sources the bodysuit only, matching black sequins and asymmetry (no matching jacket).',
          },
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
          {
            brand: 'AKIRA',
            item: 'Shining Down On You Rhinestone Bodysuit',
            retailer: 'shopakira.com',
            url: 'https://shopakira.com/products/shining-down-on-your-sequin-bodysuit',
            price: '$15.57',
            isAlternative: true,
            altNote: 'Jessica Jones\'s custom sparkling green bodysuit was never sold at retail -- this is a current rhinestone-embellished green bodysuit in the same sparkling spirit.',
          },
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
        photos: [
          {
            url: 'https://media.gettyimages.com/id/1004129336/photo/east-rutherford-nj-taylor-swift-swift-performs-onstage-during-the-taylor-swift-reputation.jpg?s=612x612&w=0&k=20&c=ZFwV3GLrIALEaen0WKvTgnFcKmQr4QrmRSvGUUlUle4=',
            credit: 'Kevin Mazur/TAS18/Getty Images',
            caption: 'Taylor Swift performing in the "cotton candy" tinsel-fringe dress at MetLife Stadium, July 22, 2018.',
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
            price: '$319.90',
            isAlternative: true,
            altNote: 'Jessica Jones\'s custom "cotton candy" mini was never sold at retail -- this is a current rainbow crystal fringe mini in the same multicolor, movement-driven spirit.',
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
            price: '$46.00',
            isAlternative: true,
            altNote: 'Jessica Jones\'s custom snake-print set was never sold at retail -- this sources the bodysuit only, matching the serpent motif (no sequins, red camo jacket, or boots).',
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
          {
            brand: 'Elizabeth K',
            item: 'GL3159 Sequin Long Sleeve Slit Gown',
            retailer: 'formaldressshops.com',
            url: 'https://formaldressshops.com/products/sequin-fitted-long-sleeve-slit-gown-by-elizabeth-k-gl3159',
            price: '$151.00',
            isAlternative: true,
            altNote: 'Jessica Jones\'s custom closer gown was never sold at retail -- this is a current black sequin long-sleeve slit gown in the same fitted, floor-length spirit (no boots).',
          },
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
        'moment:vault-1989-a-rain-soaked-fourth-of-july-family-portrait-in-rhode-island',
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
      relatedIds: ['moment:vault-lover-the-pastel-turn-me-ends-the-reputation-black'],
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
      year: 2017,
      month: 11,
      day: 3,
      category: 'music',
      title: 'Call It What You Want closes the arc: rebellion, then falling in love',
      snippet:
        "\"It starts with...rebellion, or anger, or angst...and then falling in love, and realizing you settle into what your priorities are\" — her own map of reputation, with this song as the landing point.",
      sourceUrl:
        'https://www.iheart.com/content/2017-11-10-taylor-swifts-iheartradio-reputation-release-party-everything-we-learned/',
      thumbnailUrl: null,
      moment: {
        context:
          'At the same iHeartRadio release-party special, Taylor described how Call It What You Want — track 14, and the one most fans read as being about Joe Alwyn — completes reputation\'s arc: "It starts with just getting out any kind of rebellion, or anger, or angst, or whatever. And then, like, falling in love, and realizing that you kind of settle into what your priorities are."\n\nFans got it a week before the album: released November 3, 2017 as the rollout\'s final promotional single, it debuted at No. 27 on the Hot 100 and arrived with a deliberately homemade lyric video — Taylor in minimal makeup with an acoustic guitar, a bonfire, a horse, a dog — the first unguarded look at the domestic life the album\'s back half describes.',
        sources: [
          {
            outlet: 'iHeartRadio',
            url: 'https://www.iheart.com/content/2017-11-10-taylor-swifts-iheartradio-reputation-release-party-everything-we-learned/',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Call_It_What_You_Want_(Taylor_Swift_song)',
          },
        ],
        // T16 photo pass (2026-07-09): single art via Wikimedia Commons (file
        // page license: Public domain — text-only artwork below the threshold
        // of originality). Verified HTTP 200 + image/jpeg and visually checked.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Taylor_Swift_-_Call_It_What_You_Want.jpg',
            credit: 'Big Machine Records, via Wikimedia Commons',
            caption: 'Single art for "Call It What You Want," released November 3, 2017 — the handwritten title on kraft paper.',
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
          "Reputation was the best-selling album of 2017 and the No. 1 album on Billboard's 2018 year-end Billboard 200, but by the 61st Annual Grammy Awards in February 2019 it had one nomination to show for it: Best Pop Vocal Album.\n\nNone of its singles — \"Look What You Made Me Do,\" \"...Ready for It?,\" \"End Game,\" \"New Year's Day,\" \"Gorgeous,\" or \"Delicate\" — made the cut for Record, Song, or Album of the Year, making it, per Rolling Stone, her least-nominated LP since her self-titled 2006 debut.",
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

    // --- Deep timeline fill (2026-07-08): rollout, tour, business, and
    // relationship depth — the era's biggest business stories (the political
    // post, the UMG deal) were missing entirely. New items carry the audit's
    // additive provenance fields (slug + publisher/source_type/accessed_at/
    // reliability_score alongside legacy {outlet,url}), same convention as
    // the-life-of-a-showgirl.mjs. Every claim verified against its cited
    // source via search on 2026-07-08; no fabrication. Photos deliberately
    // omitted where no already-verified image URL exists.
    {
      slug: 'rep-lwymmd-video-youtube-record',
      significance: 'notable', // a real streaming record and the era's single most-discussed visual statement (docs/decisions.md, 2026-07-19)
      // Cross-link (Stage 3, 2026-07-27): sibling "Look What You Made Me Do"
      // moment. One-directional to the song-backstory moment (2026-08-03):
      // that moment is already at the ~4-link cap, so this side carries the
      // pointer instead of bumping a curated link there.
      relatedIds: [
        'moment:vault-reputation-the-snake-video-that-announced-reputation',
        'moment:vault-reputation-zombie-makeup-for-look-what-you-made-me-do',
        'moment:vault-reputation-look-what-you-made-me-do-and-the-phone-call-it-started-with',
      ],
      year: 2017,
      month: 8,
      day: 27,
      category: 'release',
      title: 'The Look What You Made Me Do video shatters YouTube\'s 24-hour record',
      snippet:
        'Premiered at the VMAs on August 27, 2017, then racked up 43.2 million views in a day — past Psy, past Adele — averaging 30,000 views a minute.',
      sourceUrl: 'https://variety.com/2017/digital/news/taylor-swifts-look-what-you-made-me-do-smashes-youtubes-24-hour-record-crushing-psy-1202541558/',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/6/68/Taylor_Swift_-_Look_What_You_Made_Me_Do.png',
      moment: {
        context:
          'Joseph Kahn\'s video — zombie Taylor, snake throne, and a closing lineup of her past selves bickering with each other — beat Psy\'s "Gentleman" (36 million YouTube views) and Adele\'s "Hello" (27.7 million Vevo views) for the biggest 24-hour debut ever at the time. The song later collected Guinness World Records for first-day Spotify streams and fastest-selling digital single.\n\nThe records stacked up across platforms at once: hourly viewing peaked above 3 million, the lyric video set YouTube\'s first-day record for that format, and the single took Spotify\'s global first-24-hours streaming mark too. The stage for all of it was pointed — the video premiered at the MTV Video Music Awards, the same show where the 2009 interruption that opens this whole story had happened eight years earlier.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2017/digital/news/taylor-swifts-look-what-you-made-me-do-smashes-youtubes-24-hour-record-crushing-psy-1202541558/',
            source_title: "Taylor Swift's 'Look What You Made Me Do' Smashes YouTube's 24-Hour Record",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-psy-youtube-24-hour-streams-record/',
            source_title: "Taylor Swift's 'Look What You Made Me Do' Sets YouTube 24-Hour Streams Record",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added a frame of the video
        // this record is about — the bathtub-of-diamonds scene from Joseph
        // Kahn's LWYMMD video. Video id 3tmd-ClpJxA verified via YouTube
        // oEmbed this run: title "Taylor Swift - Look What You Made Me Do",
        // channel @TaylorSwift (official); maxresdefault 404s so this uses
        // hqdefault, same pattern as the vault's other official stills.
        // Downloaded and vision-confirmed this run.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/6/68/Taylor_Swift_-_Look_What_You_Made_Me_Do.png',
            credit: 'Big Machine Records',
            focalPoint: '65% 42%',
          },
          {
            url: 'https://i.ytimg.com/vi/3tmd-ClpJxA/hqdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption:
              "The bathtub-of-diamonds scene from Joseph Kahn's video — the clip that pulled 43.2 million views in its first 24 hours.",
            kind: 'archival',
            focalPoint: '64% 40%',
          },
        ],
      },
    },
    {
      slug: 'rep-ready-for-it-college-football',
      year: 2017,
      month: 9,
      day: 2,
      category: 'release',
      title: '...Ready for It? debuts inside a college football broadcast',
      snippet:
        'The album\'s opener premiered September 2, 2017, soundtracking a hype promo for Alabama vs. Florida State on ABC — reputation\'s second single, delivered to a stadium audience before pop radio got it.',
      sourceUrl: 'https://variety.com/2017/music/news/taylor-swift-teases-ready-for-it-espn-football-1202546044/',
      thumbnailUrl: null,
      moment: {
        context:
          'The minute-long clip scored footage of the teams taking the field during the ABC/ESPN broadcast, with the full song hitting streaming that night and radio the next morning.\n\nThe album\'s opening track became its second single officially on October 24, 2017, peaking at No. 4 on the Hot 100, and Joseph Kahn\'s video — a human Taylor dueling her own cyborg double inside a neon compound — followed on October 26. Dropping a pop single through a football telecast read very differently six years later, once the NFL became part of her story.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2017/music/news/taylor-swift-teases-ready-for-it-espn-football-1202546044/',
            source_title: "Taylor Swift Teases New Song 'Ready For It' on ESPN College Football",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/ca/news/877508/taylor-swift-teases-brand-new-song-ready-for-it-during-college-football-game',
            source_title: 'Taylor Swift Releases New Song "...Ready For It?" After Teasing It During College Football Game',
            publisher: 'E! News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/...Ready_for_It%3F',
            source_title: '...Ready for It?',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
        ],
        // T16 photo pass (2026-07-09): official music-video still. Video id
        // wIft-t-MQuE verified via YouTube oEmbed this session — title "Taylor
        // Swift - ...Ready For It?", channel @TaylorSwift (official). The
        // Wikipedia single art for this track is the BloodPop Remix cover, so
        // the video still is the more honest image for the original song.
        // Photo-enrichment pass (2026-07-18, #762): no still of the ABC
        // broadcast promo itself exists outside the telecast, so the second
        // image is the song's other life — opening every reputation Stadium
        // Tour show. Commons CC BY-SA 2.0 (Ronald Woan, Seattle, May 22,
        // 2018), license verified on the file page; downloaded and
        // vision-confirmed this run.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/wIft-t-MQuE/hqdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: "From Joseph Kahn's \"...Ready for It?\" video, released October 26, 2017 — human Taylor eye to eye with her cyborg double.",
            kind: 'archival',
            focalPoint: '54% 50%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Taylor_Swift_-_Reputation_Tour_Seattle_-_Ready_for_It.jpg',
            credit: 'Ronald Woan / Wikimedia Commons (CC BY-SA 2.0)',
            caption:
              'Performing "...Ready for It?" — the show opener on the reputation Stadium Tour — in Seattle, May 22, 2018.',
            kind: 'archival',
            focalPoint: '48% 14%',
          },
        ],
      },
    },
    {
      slug: 'rep-gorgeous-baby-voice',
      year: 2017,
      month: 10,
      day: 20,
      category: 'music',
      title: 'Gorgeous opens with a baby saying the title — Blake and Ryan\'s daughter',
      snippet:
        'Released October 20, 2017: the giddy track five preview of the album\'s softer side, with a liner-notes credit fans obsessed over — "baby intro voice" by James Reynolds, Blake Lively and Ryan Reynolds\' daughter.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Gorgeous_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'The third track released ahead of reputation swapped the vengeful lead-single mode for flustered crush comedy, and it debuted at No. 13 on the Hot 100 — proof the rollout\'s pull didn\'t depend on a revenge narrative.\n\nThe one-word cameo came about after Taylor played a demo for Lively and Reynolds and their toddler kept repeating "gorgeous" — the credit made her the youngest name in the album\'s liner notes, and the kind of decodable detail (which friend? whose baby?) that kept fans treating every liner-note line of this era as a puzzle.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Gorgeous_(Taylor_Swift_song)',
            source_title: 'Gorgeous (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2017/10/20/taylor-swift-drops-new-single-gorgeous-from-upcoming-album-reputation/',
            source_title: "Taylor Swift Drops New Single 'Gorgeous' From Upcoming Album 'Reputation'",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): single cover art from Wikipedia's stable
        // upload.wikimedia.org copy (exact filename from the article HTML).
        // Verified HTTP 200 + image/png and visually checked this session.
        // Photo-enrichment pass (2026-07-18, #762): added the official lyric
        // video's frame — the reputation-era newsprint portrait with the
        // handwritten "Gorgeous" scrawl. Video id EUoe7cf0HYw verified via
        // YouTube oEmbed this run: title "Taylor Swift - Gorgeous (Lyric
        // Video)", channel @TaylorSwift (official). Downloaded and
        // vision-confirmed this run. Cover-art focal genuinely centered
        // (text-only wordmark) — looked, not defaulted.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/7/71/Gorgeous_Taylor.png',
            credit: 'Big Machine Records',
            caption: 'Single cover art for "Gorgeous," released October 20, 2017.',
            kind: 'primary',
            focalPoint: '50% 50%',
          },
          {
            url: 'https://i.ytimg.com/vi/EUoe7cf0HYw/maxresdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'From the official "Gorgeous" lyric video — the album\'s newsprint visual language, released with the single on October 20, 2017.',
            kind: 'archival',
            focalPoint: '63% 38%',
          },
        ],
      },
    },
    {
      slug: 'rep-secret-sessions',
      // Cross-link (vault-run 2026-08-06): the 1989 Secret Sessions — where the
      // living-room-listening-party tradition began.
      relatedIds: ['moment:vault-1989-the-secret-sessions-89-fans-at-a-time-in-her-living-rooms'],
      year: 2017,
      month: 10,
      day: 13,
      category: 'release',
      title: 'The reputation Secret Sessions: 500 fans, four houses, zero leaks',
      snippet:
        'London on October 13, Rhode Island on the 18th and 19th, LA on the 22nd, Nashville on the 25th — she played reputation to 500 hand-picked fans in her own homes, and not one song leaked.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-reputation-secret-sessions-london-7998688/',
      thumbnailUrl: null,
      moment: {
        context:
          'Reviving the 1989 rollout ritual, Taylor selected fans from social media herself and talked through each track before playing it. For an album rolled out with almost no press interviews, the living-room listening parties were the promotional strategy.\n\nABC\'s cameras got the only outside look: behind-the-scenes footage that aired on Good Morning America on November 7, 2017, three days before release, showing her dancing through a candle-lit living room of fans. The secrecy ran both ways — one attendee told ABC News they\'d "left the country in secret" to fly in from Ireland without telling friends, and a Rhode Island guest summed up the pitch of the whole exercise: "she just felt like my best friend."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-reputation-secret-sessions-london-7998688/',
            source_title: "Taylor Swift 'Reputation' Secret Sessions: Fans Listen to Album in London",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'ABC News',
            url: 'https://abcnews.go.com/Entertainment/exclusive-1st-inside-taylor-swifts-secret-sessions-reputation/story?id=50973344',
            source_title: "Exclusive 1st look inside Taylor Swift's secret sessions for 'Reputation'",
            publisher: 'ABC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): frame from the cited ABC News exclusive
        // (their behind-the-scenes footage of a session). Verified HTTP 200 +
        // image/jpeg and visually confirmed (Swift dancing in a living room of
        // fans) this session.
        photos: [
          {
            url: 'https://s.abcnews.com/images/Entertainment/taylor-swift-2-ht-mem-171107_16x9_992.jpg',
            credit: 'ABC News',
            caption: "Inside a reputation Secret Session, from the behind-the-scenes footage ABC aired on November 7, 2017.",
            kind: 'archival',
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
        // T16 photo pass (2026-07-09): single cover from Wikipedia's stable
        // upload.wikimedia.org copy (exact filename from the article HTML),
        // plus an official MV still — video id dfnCAmr569k verified via YouTube
        // oEmbed this session ("Taylor Swift - End Game ft. Ed Sheeran, Future",
        // channel @TaylorSwift). Both HTTP 200 + image/*.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/1/1d/End_Game_%28Official_Single_Cover%29_by_Taylor_Swift.png',
            credit: 'Big Machine Records',
            caption: 'Official single cover for "End Game" featuring Ed Sheeran and Future.',
            kind: 'primary',
            focalPoint: '42% 35%',
          },
          {
            url: 'https://i.ytimg.com/vi/dfnCAmr569k/hqdefault.jpg',
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
          '"So I just got to my dressing room and found this actual olive branch. This means so much," Taylor said on her Instagram Story before taking the stage in Glendale, captioning the clip "Thank you Katy" with a heart. Only the note\'s opening — "Hello old friend" — was fully legible in the video; fans spent the night squinting at the rest of Perry\'s handwriting.\n\nThe gesture closed the loop on the falling-out widely understood to be behind "Bad Blood," a feud that had shadowed both discographies for four years — and it set up their on-camera reunion in the "You Need to Calm Down" video a year later.',
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
        ],
      },
    },
    {
      slug: 'rep-signs-with-republic-umg',
      significance: 'defining', // the deal that made every album since (Lover onward) hers outright, directly bracketing the Big Machine sale and the buyback (docs/decisions.md, 2026-07-19)
      threadIds: ['taylors-version'],
      relatedIds: [
          'moment:vault-lover-lover-the-first-album-shes-ever-owned',
        'moment:vault-lover-my-worst-case-scenario-scooter-braun-buys-big-machine-and-he',
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
  ],
};
