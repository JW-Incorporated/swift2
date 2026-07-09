// Vault content — The Life of a Showgirl era (the 12th era).
//
// First-pass fill (rollout PR 2 of the 2026-07-08 audit): the announcement,
// release-week wavetop, chart/business records, song stories, the Eras Tour's
// Disney+ send-off, and the era's Kelce arc through the July 2026 wedding.
// Every claim verified against its cited source directly; no fabrication.
//
// New items in this file carry the audit's additive provenance fields
// (slug + publisher/source_type/accessed_at/reliability_score alongside the
// legacy {outlet,url}) — all optional, ignored by the seeder, readable by the
// coverage tooling. Items marked "moved from tortured-poets.mjs" are existing
// corpus rows re-attributed here because they post-date the 2025-10-03 era
// handoff (TTPD's end date was trimmed in the same PR).

export default {
  eraSlug: 'the-life-of-a-showgirl',
  items: [
    // --- The announcement (August 2025; pre-dates the era window on purpose,
    // same convention as TTPD's Grammys-announcement item living in its own
    // era file).
    {
      slug: 'showgirl-announced-on-new-heights',
      year: 2025,
      month: 8,
      category: 'release',
      title: 'A mint-green briefcase on New Heights: album No. 12, announced on her first-ever podcast',
      snippet:
        'Teased by a 12:12 a.m. countdown, revealed on Travis and Jason Kelce\'s New Heights: a briefcase with an orange "TS," a title, and an Oct. 3 date. The episode set a Guinness World Record with 1.3 million concurrent YouTube viewers — the most ever for a podcast.',
      sourceUrl: 'https://www.nbcnews.com/pop-culture/pop-culture-news/taylor-swift-sets-guinness-world-record-new-heights-podcast-appearance-rcna227245',
      thumbnailUrl: null,
      moment: {
        context:
          'The countdown appeared on her website at 12:12 a.m. ET on Aug. 12, 2025; the full episode aired the next evening. On it she pulled the blurred mint-green briefcase from behind the desk, revealed the 12-track list ending in a Sabrina Carpenter feature, and talked through the era\'s orange-glitter look. The livestream crashed under the load about an hour and 44 minutes in; within 24 hours the episode had roughly 13 million YouTube views, and Guinness certified the concurrent-viewership record.',
        sources: [
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/pop-culture/pop-culture-news/taylor-swift-sets-guinness-world-record-new-heights-podcast-appearance-rcna227245',
            source_title: "Taylor Swift sets Guinness World Record with 'New Heights' podcast appearance",
            publisher: 'NBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2025/music/news/taylor-swift-new-heights-podcast-views-life-of-a-showgirl-1236489806/',
            source_title: "Taylor Swift's 'New Heights' Podcast Ratings in 24 Hours",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'CNN',
            url: 'https://www.cnn.com/entertainment/live-news/new-heights-taylor-swift-album-announcement-08-13-25',
            source_title: "Taylor Swift announces track list and release date for new album on 'New Heights' podcast",
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
      slug: 'showgirl-mert-marcus-portraits',
      year: 2025,
      month: 8,
      category: 'fashion',
      title: 'The showgirl portraits: Mert and Marcus, rhinestones, and an Ophelia bathtub cover',
      snippet:
        'Her most theatrical album imagery yet — feathered, crystal-covered showgirl looks shot by Mert and Marcus (their first Swift shoot since reputation), and a cover of her half-submerged in water in a diamond-lined AREA bralette, nodding to Millais\'s painting of Ophelia.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift said the submerged cover glamorizes the offstage side of the Eras Tour — every show "ends with [her] in a bathtub" — choosing a behind-the-scenes image over full showgirl mode because the songs are about what she was going through offstage. The title is lettered in orange glitter, and the wider shoot\'s bejeweled bodysuits and feather headdresses were described by critics as the most provocative, glamorous visual identity of her career.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
            source_title: 'The Life of a Showgirl',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'The Line of Best Fit',
            url: 'https://www.thelineofbestfit.com/news/taylor-swift-details-new-album-the-life-of-a-showgirl-reuniting-with-photography-duo-mert-marcus',
            source_title: 'The Life of a Showgirl reunites Taylor Swift with photography duo Mert and Marcus',
            publisher: 'The Line of Best Fit',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },

    // --- Release week (October 2025).
    {
      slug: 'showgirl-release-day',
      year: 2025,
      month: 10,
      category: 'release',
      title: 'The Life of a Showgirl arrives: 12 tracks, Max Martin and Shellback, one guest',
      snippet:
        'Written and recorded in Sweden between European Eras Tour dates — her first full album with Max Martin and Shellback since 1989 and reputation. Twelve tracks, no Anthology-style sprawl, and a single feature: Sabrina Carpenter on the closing title track.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
      thumbnailUrl: null,
      moment: {
        context:
          'On New Heights she described slipping to Sweden during the Eras Tour\'s 2024 European leg to cut the record with Max Martin and Shellback, keeping it deliberately tight at 12 songs after the 31-track Tortured Poets Anthology. The tracklist runs from a Hamlet-referencing opener to a George Michael interpolation to the Carpenter duet that gives the album its name.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
            source_title: 'The Life of a Showgirl',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'NPR',
            url: 'https://www.npr.org/2025/08/14/nx-s1-5502415/taylor-swift-podcast-new-album-life-showgirl-kelce',
            source_title: "Taylor Swift talks new album on 'New Heights' podcast",
            publisher: 'NPR',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'showgirl-release-party-theaters',
      year: 2025,
      month: 10,
      category: 'release',
      title: 'The Official Release Party of a Showgirl turns movie theaters into listening parties',
      snippet:
        'A one-weekend-only AMC event, Oct. 3–5: the premiere of "The Fate of Ophelia" video, behind-the-scenes footage, and lyric videos for the whole album — with audiences singing and dancing in the aisles. It earned an A+ CinemaScore.',
      sourceUrl: 'https://www.cnn.com/2025/10/05/business/taylor-swift-amc-showgirl-box-office',
      thumbnailUrl: null,
      moment: {
        context:
          'Announced barely two weeks out and distributed by AMC Theatres Distribution with Variance Films domestically and Piece of Magic internationally, the 89-minute event was built as a communal album drop rather than a concert film — release-day showtimes started at 3 p.m. ET so fans could hear the record together. Theaters leaned into the party: costumes, friendship bracelets, and full-crowd singalongs to songs nobody had heard that morning.',
        sources: [
          {
            outlet: 'CNN Business',
            url: 'https://www.cnn.com/2025/10/05/business/taylor-swift-amc-showgirl-box-office',
            source_title: "Swifties flock to movie theaters for 'Taylor Swift: The Official Release Party of a Showgirl'",
            publisher: 'CNN',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'AMC Entertainment',
            url: 'https://investor.amctheatres.com/news-events/press-releases/detail/399/taylor-swift-the-official-release-party-of-a-showgirl-is-an-unprecedented-record-setting-worldwide-success-with-more-than-50-million-global-box-office',
            source_title: 'THE OFFICIAL RELEASE PARTY OF A SHOWGIRL Is an Unprecedented, Record-Setting, Worldwide Success',
            publisher: 'AMC Entertainment (press release)',
            source_type: 'official',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'showgirl-box-office-number-one',
      year: 2025,
      month: 10,
      category: 'business',
      title: 'An album release party wins the box office: $34.1M domestic, $50M+ worldwide',
      snippet:
        'The Release Party topped the North American box office on $34.1 million and crossed $50 million globally in its single weekend — the biggest album-debut event in cinema history, beating actual movies without being one.',
      sourceUrl: 'https://www.screendaily.com/news/taylor-swift-the-official-release-party-of-a-showgirl-rules-north-american-box-office-on-341m/5209617.article',
      thumbnailUrl: null,
      moment: {
        context:
          'The three-day domestic gross split $15.8M Friday, $9.9M Saturday, and $8.3M Sunday, with roughly $16 million more internationally. AMC called it the biggest album-debut cinema event ever, domestic and global — a rerun of the distribution play she pioneered with The Eras Tour concert film in 2023, again routed around traditional studios.',
        sources: [
          {
            outlet: 'Screen Daily',
            url: 'https://www.screendaily.com/news/taylor-swift-the-official-release-party-of-a-showgirl-rules-north-american-box-office-on-341m/5209617.article',
            source_title: "'Taylor Swift: The Official Release Party Of A Showgirl' rules North American box office on $34.1m",
            publisher: 'Screen International',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'AMC Entertainment',
            url: 'https://www.businesswire.com/news/home/20251006963072/en/TAYLOR-SWIFT-THE-OFFICIAL-RELEASE-PARTY-OF-A-SHOWGIRL-Is-an-Unprecedented-Record-Setting-Worldwide-Success-With-More-Than-$50-Million-Global-Box-Office',
            source_title: 'More Than $50 Million Global Box Office',
            publisher: 'AMC Entertainment via Business Wire (press release)',
            source_type: 'official',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'showgirl-four-million-week',
      year: 2025,
      month: 10,
      category: 'business',
      title: '4.002 million in a week: the biggest album debut ever measured',
      snippet:
        'The largest single-week total in Billboard 200 history — 4.002 million equivalent units, about 3.48 million of them pure sales, past Adele\'s decade-old 25 record. It\'s her 15th No. 1 album, breaking her tie with Drake and Jay-Z for the most among soloists.',
      sourceUrl: 'https://www.billboard.com/lists/taylor-swift-life-of-a-showgirl-number-one-billboard-200/',
      thumbnailUrl: null,
      moment: {
        context:
          'The week (charts dated Oct. 18, 2025) counted 3,479,500 in pure album sales plus 680.9 million on-demand streams. She\'d already passed Adele\'s 3.378 million-unit 2015 benchmark within five days. Universal reported more than 5.5 million equivalent units globally in week one. Her reaction, via Billboard: "I\'ll cherish this feeling forever."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-life-of-a-showgirl-number-one-billboard-200/',
            source_title: "Taylor Swift Achieves Record-Shattering 4 Million Week With No. 1 Billboard 200 Debut of 'The Life of a Showgirl'",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2025/music/news/taylor-swift-debut-week-record-billboard-200-life-showgirl-1236547501/',
            source_title: "Taylor Swift Bows With 4 Million Album Units as 'The Life of a Showgirl' Smashes Records",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'showgirl-spotify-records',
      year: 2025,
      month: 10,
      category: 'business',
      title: "Spotify's 2025 single-day streaming record falls in under 11 hours",
      snippet:
        'Showgirl became Spotify\'s most-streamed album in a single day of 2025 before lunch, finished day one with roughly 250 million global streams, and had already broken the platform\'s all-time pre-save record at over 6 million.',
      sourceUrl: 'https://newsroom.spotify.com/2025-10-03/taylor-swift-life-showgirl-spotify-record/',
      thumbnailUrl: null,
      moment: {
        context:
          'Day one also made "The Fate of Ophelia" the most-streamed song in a single day in Spotify history. The album\'s ~250 million single-day total is second all-time only to her own Tortured Poets Department (314 million) — that record\'s survival being the one release-week superlative Showgirl left standing.',
        sources: [
          {
            outlet: 'Spotify Newsroom',
            url: 'https://newsroom.spotify.com/2025-10-03/taylor-swift-life-showgirl-spotify-record/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' Breaks Spotify's 2025 Single-Day Streaming Record",
            publisher: 'Spotify Newsroom',
            source_type: 'official',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
          {
            outlet: 'Deadline',
            url: 'https://deadline.com/2025/10/taylor-swift-life-of-a-showgirl-breaks-multiple-spotify-records-1236570076/',
            source_title: "Taylor Swift's 'Life of a Showgirl' Breaks Multiple Spotify Records In First Day",
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
      slug: 'showgirl-vinyl-record-week',
      year: 2025,
      month: 10,
      category: 'business',
      title: '1.334 million vinyl LPs in seven days — the first million-vinyl week ever tracked',
      snippet:
        'No album had ever sold a million vinyl copies in a week since modern tracking began. Showgirl did 1.334 million, blowing past her own record of 859,000 set by The Tortured Poets Department.',
      sourceUrl: 'https://www.forbes.com/sites/hughmcintyre/2025/10/08/taylor-swift-shatters-the-all-time-vinyl-sales-record-in-a-matter-of-hours/',
      thumbnailUrl: null,
      moment: {
        context:
          'The push came from a stack of collectible pressings in the era\'s signature orange, and NPR\'s analysis noted the number is less about turntables than fandom-as-collecting — a physical-object economy she has done more than anyone to revive. The vinyl haul was the engine of the pure-sales side of her 4-million-unit week.',
        sources: [
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2025/10/08/taylor-swift-shatters-the-all-time-vinyl-sales-record-in-a-matter-of-hours/',
            source_title: "Taylor Swift's The Life of a Showgirl Breaks Vinyl Sales Record",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'NPR',
            url: 'https://www.npr.org/2025/10/14/nx-s1-5570850/taylor-swift-vinyl-sales-showgirl',
            source_title: "How big a deal are Taylor Swift's vinyl sales, really?",
            publisher: 'NPR',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'showgirl-hot-100-top-12-sweep',
      year: 2025,
      month: 10,
      category: 'business',
      title: "All 12 tracks debut as the Hot 100's entire top 12",
      snippet:
        'Every song on the album landed inside the top 12 of the Hot 100 in its first week — the whole tracklist, in a block — making her the first artist ever to monopolize the chart\'s top 10 three separate times.',
      sourceUrl: 'https://www.billboard.com/lists/taylor-swift-hot-100-fate-of-ophelia-number-one/',
      thumbnailUrl: null,
      moment: {
        context:
          'She first claimed a full top 10 with Midnights in 2022, again with TTPD\'s top-14 sweep in 2024, and now a third time — this one unique in that the album\'s complete tracklist occupied the top slots with nothing left over. "The Fate of Ophelia" led the block from No. 1.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-hot-100-fate-of-ophelia-number-one/',
            source_title: "Taylor Swift's 'Fate of Ophelia' No. 1 on Hot 100, Takes All Top 10",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
        ],
        photos: [],
      },
    },

    // --- Song stories (music).
    {
      slug: 'fate-of-ophelia-lead-single',
      year: 2025,
      month: 10,
      category: 'music',
      title: 'The Fate of Ophelia: Hamlet\'s drowned girl, rescued — and a 13th Hot 100 No. 1',
      snippet:
        'The opener flips Millais\'s Ophelia (the same painting the cover restages): this narrator gets pulled out of the water by a love that "saved my heart." It debuted at No. 1 — her 13th chart-topper, on brand for her — and stayed there deep into the winter.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Fate_of_Ophelia',
      thumbnailUrl: null,
      moment: {
        context:
          'The self-directed music video premiered inside the theatrical Release Party over release weekend, moving through vaudeville and showgirl tableaux built around the drowned-painting image. As the single kept leading the Hot 100 — a run Billboard tracked past 10 weeks, her longest-leading No. 1, out-running "Anti-Hero" — the song became the commercial spine of the era.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/The_Fate_of_Ophelia',
            source_title: 'The Fate of Ophelia',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-hot-100-the-fate-of-ophelia-10th-week/',
            source_title: "Taylor Swift's 'The Fate of Ophelia' No. 1 on Hot 100 for 10th Week",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'father-figure-george-michael',
      year: 2025,
      month: 10,
      category: 'music',
      title: "Father Figure rebuilds George Michael's 1988 hit — with his estate's blessing",
      snippet:
        'She approached George Michael\'s estate before release to clear the interpolation; hearing the track, they said they "had no hesitation" and believed "George would have felt the same." Her version recasts the title as music-industry patronage — the protégé outgrowing the patron.',
      sourceUrl: 'https://www.rollingstone.com/music/music-news/george-michael-taylor-swift-father-figure-song-1235439835/',
      thumbnailUrl: null,
      moment: {
        context:
          'Michael\'s 1988 original gets a formal songwriting credit on the track. The estate\'s public statement framed it as an "association between two great artists," one of the warmest legacy-artist endorsements any of her interpolations has drawn.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/george-michael-taylor-swift-father-figure-song-1235439835/',
            source_title: "'No Hesitation': George Michael's Estate 'Delighted' Over Taylor Swift Using 'Father Figure'",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-father-figure-george-michael-statement-1236081129/',
            source_title: "Taylor Swift 'Father Figure': George Michael Estate Comments On Song",
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
      slug: 'eldest-daughter-track-five',
      year: 2025,
      month: 10,
      category: 'music',
      title: 'Eldest Daughter: the first track five that ends somewhere safe',
      snippet:
        'The album\'s track five — the slot fans expect to hurt — names "eldest daughter syndrome," the firstborn\'s job of holding everything together. But unlike every track five before it, this one resolves into reassurance instead of grief.',
      sourceUrl: 'https://time.com/7322849/taylor-swift-eldest-daughter-the-life-of-a-showgirl-track-5/',
      thumbnailUrl: null,
      moment: {
        context:
          'At 4:06 it\'s the longest song on the album. Time read it as a deliberate turn in the tradition she once described discovering by accident — the vulnerable song instinctively sequenced fifth — keeping the confessional register while, for the first time, landing on being taken care of rather than being wrecked.',
        sources: [
          {
            outlet: 'Time',
            url: 'https://time.com/7322849/taylor-swift-eldest-daughter-the-life-of-a-showgirl-track-5/',
            source_title: "Making Sense of 'Eldest Daughter,' Taylor Swift's Emotional The Life of a Showgirl Track 5",
            publisher: 'Time',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'showgirl-title-track-sabrina',
      year: 2025,
      month: 10,
      category: 'music',
      title: 'The title track hands the last word to Sabrina Carpenter',
      snippet:
        'The album\'s only feature closes it: Sabrina Carpenter — who opened the Eras Tour\'s first leg before her own breakout — duets on "The Life of a Showgirl," a showgirl passing hard-won stage wisdom to the next one up.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
      thumbnailUrl: null,
      moment: {
        context:
          'The song tells the story of a veteran performer named Kitty and the young singer studying her, and the casting does the subtext: Carpenter went from Eras Tour opener in 2023-24 to arena headliner in her own right by the time the album dropped. It was the pairing fans most wanted from the tracklist reveal on New Heights, and the reason the feature stayed the announcement\'s biggest talking point.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
            source_title: 'The Life of a Showgirl',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'NPR',
            url: 'https://www.npr.org/2025/08/14/nx-s1-5502415/taylor-swift-podcast-new-album-life-showgirl-kelce',
            source_title: "Taylor Swift talks new album on 'New Heights' podcast",
            publisher: 'NPR',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'opalite-second-number-one',
      year: 2026,
      month: 2,
      category: 'music',
      title: 'Opalite follows Ophelia to No. 1',
      snippet:
        'The sunny track three — widely heard by fans and critics as her Travis song, its title a man-made stone standing in for a happiness you build yourself — became the album\'s second Hot 100 No. 1 in February 2026, taking the top spot from "The Fate of Ophelia."',
      sourceUrl: 'https://slate.com/culture/2026/02/taylor-swift-opalite-billboard-hot-100-song-ophelia.html',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift has not confirmed the song\'s subject — the Travis Kelce reading (opal as his October birthstone, the synthetic stone as self-made joy) is fan and critic interpretation, labeled as such. Slate\'s chart analysis of its February 2026 ascent noted it was pushed as the album\'s follow-up single after "The Fate of Ophelia" finally cooled, back-to-back No. 1s from the same 12-track album.',
        sources: [
          {
            outlet: 'Slate',
            url: 'https://slate.com/culture/2026/02/taylor-swift-opalite-billboard-hot-100-song-ophelia.html',
            source_title: "Taylor Swift's \"Opalite\" is No. 1 on Billboard's Hot 100. But is it a real hit?",
            publisher: 'Slate',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },

    {
      slug: 'ruin-the-friendship-hendersonville',
      year: 2025,
      month: 10,
      category: 'music',
      title: 'Ruin the Friendship: a regret from Hendersonville High',
      snippet:
        'A song about the high-school kiss she never risked — with a devastating final verse at a funeral. Fans traced it to her classmate Jeff Lang, who died in 2010; his mother told The Tennessean she wished she could thank Swift for "keeping his name alive."',
      sourceUrl: 'https://en.wikipedia.org/wiki/Ruin_the_Friendship',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift has not named the song\'s subject — the Lang connection is fan interpretation, labeled as such, but it rests on public record: she sang at a close friend\'s funeral in 2010 and thanked "Jeff Lang" from the BMI Country Awards stage that year, saying she used to play him her songs first. The lyric\'s advice — ruin the friendship, kiss your friend while you can — lands as the album\'s quietest gut-punch.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Ruin_the_Friendship',
            source_title: 'Ruin the Friendship',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/monicamercuri/2025/10/03/taylor-swift-ruin-the-friendship-lyrics-the-heartbreaking-story-that-may-have-inspired-the-song/',
            source_title: "Taylor Swift 'Ruin The Friendship' Lyrics — The Heartbreaking Story That May Have Inspired The Song",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'actually-romantic-one-sided-feud',
      year: 2025,
      month: 10,
      category: 'music',
      title: "Actually Romantic: the diss track she frames as a compliment",
      snippet:
        'Her own track intro: it\'s about "realizing that someone else has kind of had a one-sided adversarial relationship with you" — living "in their head rent free." Critics near-unanimously read it as an answer to Charli XCX\'s "Sympathy is a knife."',
      sourceUrl: 'https://en.wikipedia.org/wiki/Actually_Romantic',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift never names Charli — the reading is critic and fan interpretation, labeled as such, built from the "Boring Barbie" opening line and the two artists\' overlapping 1975 chapters. It became the album\'s most-argued-about track: Variety timelined the perceived feud, while Rolling Stone questioned whether the biggest pop star on earth punching laterally was a good look at all.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Actually_Romantic',
            source_title: 'Actually Romantic',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2025/music/news/taylor-swift-charli-xcx-feud-actually-romantic-timeline-showgirl-1236538041/',
            source_title: "Taylor Swift, Charli xcx Feud Timeline After 'Actually Romantic' Song",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/taylor-swift-actually-romantic-charli-xcx-commentary-1235442867/',
            source_title: "Taylor Swift: Was 'Actually Romantic,' Charli XCX Drama Necessary?",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },

    // --- The Eras Tour's send-off (tour + release, December 2025).
    {
      slug: 'end-of-an-era-docuseries',
      year: 2025,
      month: 12,
      category: 'release',
      title: 'The End of an Era: the Eras Tour docuseries lands on Disney+',
      snippet:
        'Six episodes going backstage on the record-breaking tour, directed by Don Argott and Sheena M. Joyce, with Gracie Abrams, Sabrina Carpenter, Ed Sheeran, and Florence Welch. Episodes rolled out Dec. 12, 19, and 23 — a three-Friday(ish) December takeover.',
      sourceUrl: 'https://abcnews.com/GMA/Culture/taylor-swifts-end-era-docuseries-final-show/story?id=128047876',
      thumbnailUrl: null,
      moment: {
        context:
          'The docuseries covers the tour\'s full 2023-24 arc — the staging, the surprise-song scramble, the Kelce of it all — and functions as the era-bridge between TTPD\'s stadium years and the Showgirl era they produced: she wrote the new album on this tour\'s European leg.',
        sources: [
          {
            outlet: 'ABC News',
            url: 'https://abcnews.com/GMA/Culture/taylor-swifts-end-era-docuseries-final-show/story?id=128047876',
            source_title: "Everything to know about Taylor Swift's 'The End of an Era' docuseries and 'Final Show'",
            publisher: 'ABC News (Good Morning America)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2025/music/news/taylor-swift-airdate-last-two-end-of-era-episodes-christmas-1236611639/',
            source_title: "Taylor Swift's Last Two 'End of an Era' Episodes Get Pre-Christmas Airdate",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'eras-tour-final-show-film',
      year: 2025,
      month: 12,
      category: 'tour',
      title: 'The Final Show: the full Vancouver closer, streaming at last',
      snippet:
        'The complete Dec. 8, 2024 finale at BC Place — show 149 of 149 — released as a concert film on Disney+ on Dec. 12, 2025. It\'s the only filmed Eras Tour release to include the Tortured Poets set, which didn\'t exist when the 2023 theatrical cut was shot.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift:_The_End_of_an_Era',
      thumbnailUrl: null,
      moment: {
        context:
          'Paired with the End of an Era docuseries for the same-day premiere, the film preserves the tour\'s final setlist end-to-end — the version of the show that closed out the highest-grossing tour ever, ten months after the last confetti fell in Vancouver.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Taylor_Swift:_The_End_of_an_Era',
            source_title: 'Taylor Swift: The End of an Era',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'ABC News',
            url: 'https://abcnews.com/GMA/Culture/taylor-swifts-end-era-docuseries-final-show/story?id=128047876',
            source_title: "Everything to know about Taylor Swift's 'The End of an Era' docuseries and 'Final Show'",
            publisher: 'ABC News (Good Morning America)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },

    // --- Items below were moved verbatim from tortured-poets.mjs in this PR:
    // they post-date the 2025-10-03 era handoff, so they belong to this era's
    // timeline (TTPD's end date was trimmed to 2025-10-02 in eras-data.mjs).
    // Slugs added; content and sources unchanged from the approved corpus.
    {
      slug: 'arrowhead-caitlin-clark-october',
      year: 2025,
      month: 10,
      category: 'sighting',
      title: 'Back at Arrowhead with Caitlin Clark, nine days after her album dropped',
      snippet:
        'The first publicly confirmed Chiefs game she\'d attended so far this season, chatting with Caitlin Clark and Ed Kelce in the suite as Kansas City beat Detroit 30-17 on Sunday Night Football.',
      sourceUrl: 'https://www.espn.com/nfl/story/_/id/46577064/taylor-swift-caitlin-clark-sunday-night-football-chiefs-lions-travis-kelce',
      thumbnailUrl: null,
      moment: {
        context:
          'The Oct. 12 game came nine days after Swift released The Life of a Showgirl on Oct. 3. ESPN called it "the first public indication" of her attending a Chiefs game this season — she\'d also been at the Sept. 14 Eagles game, but wasn\'t photographed there. This was the second time Clark had joined her in a suite, after the January 2025 Texans playoff game.',
        sources: [
          {
            outlet: 'ESPN',
            url: 'https://www.espn.com/nfl/story/_/id/46577064/taylor-swift-caitlin-clark-sunday-night-football-chiefs-lions-travis-kelce',
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'black-dog-still-nobody-knows',
      year: 2025,
      month: 10,
      category: 'music',
      title: "The Black Dog: 'still nobody knows' what the song's about, she says a year later",
      snippet:
        'Asked on BBC Radio 2 if she\'d tipped off the real Vauxhall pub fans decided inspired the song, she said: "I did not, and still nobody knows what I\'m even talking about on that song. They think they know, they have no idea."',
      sourceUrl: 'https://www.elitedaily.com/lifestyle/taylor-swift-the-black-dog-london-pub-review',
      thumbnailUrl: null,
      moment: {
        context:
          'The lyric describes tracking an ex whose location services were still on and watching him walk "into some bar called The Black Dog," which turned a real Vauxhall, London gastropub into a fan pilgrimage site, complete with lyric-quoting window signage and a "Taylor\'s Version" cocktail list. Speaking to BBC Radio 2\'s Scott Mills during her Life of a Showgirl press run, Swift denied tipping off the pub and declined to confirm the connection, insisting the song\'s real subject remains misunderstood.',
        sources: [
          {
            outlet: 'Elite Daily',
            url: 'https://www.elitedaily.com/lifestyle/taylor-swift-the-black-dog-london-pub-review',
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'watch-hill-bachelorette-weekend',
      year: 2026,
      month: 6,
      category: 'sighting',
      title: 'A tented lawn in Rhode Island, two weeks before the wedding',
      snippet:
        'Security tightened around her Watch Hill estate as a large tent went up on the Ocean House lawn next door and friends including Abigail Anderson were spotted arriving for what looked like a bachelorette weekend.',
      sourceUrl: 'https://www.tmz.com/2026/06/19/taylor-swift-bachelorette-party-rumors/',
      thumbnailUrl: 'https://imagez.tmz.com/image/2c/16by9/2026/06/19/2ce1e3acab1c4ea4a7e0faa9f4bb02ab_md.png',
      moment: {
        context:
          'TMZ reported the gathering the weekend of June 19-20, 2026 as a "bachelorette-style gathering centered around Taylor and her closest girlfriends" — separate from the Ocean House\'s own scheduled event that weekend, which the venue confirmed was for a different couple.',
        sources: [
          { outlet: 'TMZ', url: 'https://www.tmz.com/2026/06/19/taylor-swift-bachelorette-party-rumors/' },
        ],
        photos: [
          {
            url: 'https://imagez.tmz.com/image/2c/16by9/2026/06/19/2ce1e3acab1c4ea4a7e0faa9f4bb02ab_md.png',
            credit: 'TMZ',
          },
          {
            url: 'https://imagez.tmz.com/image/81/4by3/2026/06/19/81b2c535bab3435487f156afbe67b6be_md.png',
            credit: 'TMZ',
          },
        ],
      },
    },
    {
      slug: 'msg-wedding',
      year: 2026,
      month: 7,
      category: 'relationship',
      title: 'Taylor and Travis marry at Madison Square Garden',
      snippet:
        'A wedding officiated by their friend Adam Sandler — no bridesmaids or groomsmen, just Austin Swift as her Man of Honor and Jason Kelce as his best man. Roughly 1,000 guests, and a jumbotron outside the arena reading "JUST&T MARRIED!"',
      sourceUrl: 'https://www.cbsnews.com/news/taylor-swift-travis-kelce-wedding-day-madison-square-garden-nyc/',
      thumbnailUrl:
        'https://assets1.cbsnewsstatic.com/hub/i/r/2026/07/04/dcbf1e43-644d-45c1-9fd7-712be991cd59/thumbnail/620x403/8012c5092c88e86e560c7d3b3cb2ca54/gettyimages-2283939355.jpg',
      moment: {
        context:
          'Sandler, a friend of the couple, sang an original song for them at the ceremony. Both wore custom Christian Dior Haute Couture; Stevie Nicks performed at the reception. Guests included Hugh Grant, Jason Sudeikis, Ethan Hawke, Abby Wambach, Joe Buck, Benson Boone, Cooper Kupp, and Paulina Gretzky, among roughly 1,000 attendees.',
        sources: [
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-travis-kelce-wedding-day-madison-square-garden-nyc/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/what-we-know-about-taylor-swift-travis-kelce-wedding/',
          },
        ],
        photos: [
          {
            url: 'https://assets1.cbsnewsstatic.com/hub/i/r/2026/07/04/dcbf1e43-644d-45c1-9fd7-712be991cd59/thumbnail/620x403/8012c5092c88e86e560c7d3b3cb2ca54/gettyimages-2283939355.jpg',
            credit: 'Charly Triballeau/AFP via Getty Images',
            caption:
              'The jumbotron outside Madison Square Garden reading "JUST&T MARRIED!" as fans stop to photograph it, the Empire State Building behind.',
            kind: 'primary',
          },
          {
            url: 'https://assets3.cbsnewsstatic.com/hub/i/r/2026/07/02/e66f5b93-8b69-4557-847c-106908119407/thumbnail/620x413/06cdf599d84c9a589b8eb695f3867456/2026-07-02t205104z-316575572-rc2w5maws1vu-rtrmadp-3-people-taylor-swift-kelce.jpg',
            credit: 'Christian Monterrosa/Reuters',
            caption:
              "In the run-up to the ceremony: crews on ladders hang curtains across the Garden's glass entrance while security stands watch outside.",
            kind: 'archival',
          },
          // T16 note: no additional wedding photo added — no Wikimedia Commons /
          // confirmably-licensed photo of the event itself could be verified, and
          // press/Getty imagery beyond the existing CBS-sourced photos is not
          // cleanly licensable for us to add.
        ],
      },
    },
    {
      slug: 'wedding-gown-dior-anderson',
      year: 2026,
      month: 7,
      category: 'fashion',
      title: 'The wedding gown: a custom Dior Haute Couture, styled by Joseph Cassell',
      snippet:
        "Jonathan Anderson's first celebrity couture bridal commission at Dior — a custom gown reportedly drawing on Elizabeth Taylor's 1950 wedding dress, worn with custom Christian Louboutin shoes and Cartier jewelry.",
      sourceUrl: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-wedding-dress-dior-jonathan-anderson-2-1236637523/',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift, Travis and longtime stylist Joseph Cassell worked directly with Anderson and the Dior ateliers on Avenue Montaigne on an entirely custom design rather than a runway adaptation. No official photo of the gown had been released as of the day after the wedding, and several AI-generated fakes were circulating online — none of those are used here; the gallery instead shows clearly-labeled reference images of the real things the design reportedly draws on. The commission caps a whirlwind first year for Anderson at Dior: named creative director of womenswear and haute couture on June 2, 2025 — on top of Dior Men — he became the first designer since Christian Dior himself to lead all three lines, succeeding Maria Grazia Chiuri after his acclaimed run at Loewe. The reported touchstone is Elizabeth Taylor\'s gown for her May 6, 1950 wedding to Conrad "Nicky" Hilton: designed by MGM costume designer Helen Rose and gifted to Elizabeth by the studio, which turned the wedding into a publicity event for Father of the Bride — the film in which Rose also dressed the 18-year-old Elizabeth as a bride, in the lace-and-veil look shown in the reference image here. Per The Hollywood Reporter and Marie Claire, the finishing pieces were custom Christian Louboutin shoes and Cartier jewelry.',
        sources: [
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-wedding-dress-dior-jonathan-anderson-2-1236637523/',
          },
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-wedding-dress-details/',
          },
          {
            outlet: 'Fashion Dive',
            url: 'https://www.fashiondive.com/news/jonathan-anderson-dior-creative-director-haute-couture-mens-womens/749569/',
            source_title: 'Jonathan Anderson will lead fashion at Dior',
            publisher: 'Fashion Dive',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
          {
            outlet: 'ElizabethTaylor.com',
            url: 'https://elizabethtaylor.com/marriage-and-movies-the-real-life-romance-that-promoted-father-of-the-bride/',
            source_title: "Marriage and Movies: The Real-Life Romance That Promoted 'Father of the Bride'",
            publisher: 'House of Taylor / elizabethtaylor.com',
            source_type: 'official',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
          // License provenance for the reference images below (Commons file pages):
          {
            outlet: 'Wikimedia Commons (file page — Elizabeth Taylor, Father of the Bride trailer)',
            url: 'https://commons.wikimedia.org/wiki/File:Elizabeth_Taylor_in_Father_of_the_Bride_trailer.JPG',
          },
          {
            outlet: 'Wikimedia Commons (file page — Jonathan Anderson dress for Loewe)',
            url: 'https://commons.wikimedia.org/wiki/File:Dress_by_Jonathan_Anderson_for_Loewe_(51444).jpg',
          },
          {
            outlet: 'Wikimedia Commons (file page — Dior, 30 Avenue Montaigne)',
            url: 'https://commons.wikimedia.org/wiki/File:Christian_Dior,_30_Avenue_Montaigne,_Paris_2016.jpg',
          },
        ],
        // T16 pilot: no official photo of the gown exists and AI fakes are refused
        // (see context). These are REAL, license-verified reference images only —
        // each `kind: 'reference'` so the UI labels them as stand-ins, never as
        // the gown itself. Licenses confirmed on the Commons file pages cited in
        // `sources` above on 2026-07-09.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Elizabeth_Taylor_in_Father_of_the_Bride_trailer.JPG',
            credit: 'MGM trailer still, public domain (published without copyright notice) via Wikimedia Commons',
            caption:
              "For reference — no official photo of Taylor Swift's gown has been released. This is Elizabeth Taylor in the Helen Rose bridal look from Father of the Bride (1950); Rose also designed the real gown Elizabeth Taylor wore to marry Conrad Hilton that May, the dress the Dior design reportedly references.",
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Dress_by_Jonathan_Anderson_for_Loewe_%2851444%29.jpg',
            credit: 'Rhododendrites / CC BY-SA 4.0 via Wikimedia Commons',
            caption:
              "For reference — not the wedding gown. Jonathan Anderson working in white duchess silk satin at Loewe (autumn/winter 2023-24), before he took over Dior womenswear and haute couture — a feel for the designer's hand in bridal-adjacent white silk.",
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Christian_Dior%2C_30_Avenue_Montaigne%2C_Paris_2016.jpg',
            credit: 'Frédéric BISSON / CC BY 2.0 via Wikimedia Commons',
            caption:
              "For reference — Dior's historic house at 30 Avenue Montaigne, Paris, home of the haute couture ateliers where the custom gown was made.",
            kind: 'reference',
          },
        ],
      },
    },

    // --- Category depth pass (2026-07-08): fashion, business, sighting, and
    // relationship items to clear the era's coverage gaps. Every claim
    // verified against its cited source directly; no fabrication.
    {
      slug: 'showgirl-david-koma-graham-norton',
      year: 2025,
      month: 9,
      category: 'fashion',
      title: 'A jeweled David Koma LBD opens the press run on Graham Norton',
      snippet:
        'A little black dress lined with Midnights-coded jewels around the neckline — her first stop on the promo circuit for the album, before Fallon and Seth Meyers followed.',
      sourceUrl: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-the-life-of-a-showgirl-style/',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift kicked off her Life of a Showgirl press run in London on The Graham Norton Show wearing a David Koma design, then continued the tour on The Tonight Show Starring Jimmy Fallon and Late Night with Seth Meyers plus radio stops — a compact, TV-first promo cycle rather than a full magazine-cover blitz.',
        sources: [
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-the-life-of-a-showgirl-style/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' Album Style, Explained",
            publisher: 'Marie Claire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'showgirl-orange-reformation-versace',
      year: 2025,
      month: 9,
      category: 'fashion',
      title: 'The first "Showgirl orange" look: Reformation cashmere and a Versace leather mini',
      snippet:
        'Explaining the album\'s packaging and orange-and-mint color scheme on Sept. 20, she wore a pumpkin-hued Reformation cashmere sweater over a Versace leather mini skirt — the outfit that made "Showgirl orange" a fashion story before the record even dropped.',
      sourceUrl: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-showgirl-orange-reformation-cashmere-versace-leather-mini-skirt/',
      thumbnailUrl: null,
      moment: {
        context:
          'The look accompanied a behind-the-scenes video about the record\'s visual identity, pairing a roughly $70 sparkly pumpkin-colored knit with high-end leather — deliberately mixing accessible and designer pieces the way she had for past eras\' promo drops.',
        sources: [
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-showgirl-orange-reformation-cashmere-versace-leather-mini-skirt/',
            source_title: 'Taylor Swift Styles a Showgirl Orange Reformation Sweater With a Versace Leather Mini Skirt',
            publisher: 'Marie Claire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'showgirl-selena-gomez-texans-coats',
      year: 2025,
      month: 12,
      category: 'fashion',
      title: 'Taylor and Selena Gomez coordinate opulent winter coats at Arrowhead',
      snippet:
        'A Miu Miu checkered bomber for Taylor, all-black shearling-trimmed for Selena — the two friends layered up for Gomez\'s first-ever Chiefs game, a Dec. 7 loss to the Texans.',
      sourceUrl: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-selena-gomez-kansas-city-chiefs-houston-texans-game-winter-coats/',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift\'s oversize checkered Miu Miu bomber (originally $4,600) and Gomez\'s fitted shearling-trimmed coat drew as much coverage as the game itself, which the Chiefs lost 20-10. E! Online and Marie Claire both noted it was Gomez\'s first time attending a Chiefs game with Swift.',
        sources: [
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-selena-gomez-kansas-city-chiefs-houston-texans-game-winter-coats/',
            source_title: 'Taylor Swift and Selena Gomez Coordinate Opulent Winter Coats for the Kansas City Chiefs vs. Houston Texans Game',
            publisher: 'Marie Claire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/1425931/taylor-swift-selena-gomez-attend-chiefs-vs-texans-game',
            source_title: 'Taylor Swift and Selena Gomez Cheer on Travis Kelce During Chiefs vs. Texans Game',
            publisher: 'E! Online',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'showgirl-emmy-nomination-eras-final-show',
      year: 2026,
      month: 7,
      category: 'business',
      title: 'The Eras Tour: The Final Show earns five Emmy nominations',
      snippet:
        'Her first Primetime Emmy nod in over a decade: five nominations for the Disney+ concert film, including Outstanding Variety Special, for a nearly 3.5-hour cut of the tour\'s Vancouver finale with the full Tortured Poets set added.',
      sourceUrl: 'https://www.hollywoodreporter.com/tv/tv-news/taylor-swift-2026-emmy-nominations-1236641549/',
      thumbnailUrl: null,
      moment: {
        context:
          'The 2026 nominations covered Outstanding Variety Special (Prerecorded), directing for Glenn Weiss, picture editing, sound mixing, and technical direction/camerawork. Produced by Taylor Swift Productions with Silent House Productions, the film expanded the 2023 theatrical Eras Tour cut with the 45-song Vancouver setlist, including the TTPD segment Swift has called the "Female Rage" set. The 78th Emmy Awards air Sept. 14, 2026 on NBC and Peacock.',
        sources: [
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/tv/tv-news/taylor-swift-2026-emmy-nominations-1236641549/',
            source_title: "Taylor Swift's 'The Eras Tour: The Final Show' Lands 5 Emmy Noms, Including One for Namesake",
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-emmy-nomination-eras-tour-final-show/',
            source_title: "Taylor Swift Gets Emmy Nomination for 'The Eras Tour: The Final Show'",
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
      slug: 'showgirl-grammy-eligibility-window-miss',
      year: 2025,
      month: 10,
      category: 'business',
      title: 'A release date that costs a Grammy shot: Showgirl misses the 2026 eligibility window by 34 days',
      snippet:
        'The Recording Academy\'s 2026 eligibility period closed Aug. 30, 2025 — five weeks before Showgirl came out on Oct. 3. The record-shattering album ended up with zero 2026 Grammy nominations, eligible instead for the 2027 ceremony.',
      sourceUrl: 'https://www.aol.com/articles/why-taylor-swift-doesn-t-144826491.html',
      thumbnailUrl: null,
      moment: {
        context:
          'Outlets including E! Online and AOL confirmed the snub was purely a calendar issue, not a reception one: the 2026 Grammy eligibility window ran Aug. 31, 2024 through Aug. 30, 2025, and Showgirl\'s Oct. 3 release fell just outside it. Swift already holds 14 Grammys, including a record four Album of the Year wins; the album remains eligible for the 2027 awards.',
        sources: [
          {
            outlet: 'AOL',
            url: 'https://www.aol.com/articles/why-taylor-swift-doesn-t-144826491.html',
            source_title: "Why Taylor Swift Doesn't Have Any 2026 Grammy Nominations for 'The Life of a Showgirl'",
            publisher: 'AOL',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/1424797/grammys-2026-why-taylor-swift-wasnt-nominated',
            source_title: "Why Doesn't Taylor Swift Qualify for the Grammys 2026",
            publisher: 'E! Online',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'showgirl-broncos-christmas-game',
      year: 2025,
      month: 12,
      category: 'sighting',
      title: 'A Christmas Day game at Arrowhead, arriving with her parents',
      snippet:
        'Swift showed up nearly an hour into the Dec. 25 Chiefs-Broncos game with her parents, in a red Frankie Shop bomber and her Artifex Fine engagement ring, for what was expected to be Travis Kelce\'s final home game as the Chiefs missed the playoffs.',
      sourceUrl: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-kansas-city-chiefs-denver-broncos-christmas-game-outfit/',
      thumbnailUrl: null,
      moment: {
        context:
          'Styled by Joseph Cassell Falconer in a red Frankie Shop bomber jacket, black mini skirt, tights, knee-high boots, and a Louis Vuitton bag, Swift arrived with her parents after the 8:15 p.m. kickoff. Marie Claire noted the game\'s added weight: with the Chiefs missing the playoffs for the first time since 2014, it was expected to be Kelce\'s final appearance at Arrowhead that season.',
        sources: [
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-kansas-city-chiefs-denver-broncos-christmas-game-outfit/',
            source_title: 'Is Taylor Swift Styling a Kansas City Chiefs vs. Denver Broncos Christmas Game Outfit?',
            publisher: 'Marie Claire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'showgirl-engagement-announcement',
      year: 2025,
      month: 8,
      category: 'relationship',
      title: '"Your English teacher and your gym teacher are getting married": the engagement, announced on Instagram',
      snippet:
        'Two weeks after the New Heights album reveal, Taylor and Travis announced their engagement in a joint Instagram post — a garden proposal, an Old Mine Cut diamond in yellow gold, and a caption that became the year\'s most-repeated line.',
      sourceUrl: 'https://abcnews.com/GMA/Culture/taylor-swift-travis-kelce-relationship-timeline/story?id=118197742',
      thumbnailUrl: null,
      moment: {
        context:
          'The Aug. 26, 2025 announcement came via matching Instagram posts with garden-proposal photos; Swift\'s caption read "Your English teacher and your gym teacher are getting married." The ring — an elongated cushion-cut, Old Mine Cut diamond estimated at 7 to 10 carats, set in yellow gold — was designed by Kindred Lubeck of Artifex Fine Jewelry, who was later invited to the couple\'s wedding.',
        sources: [
          {
            outlet: 'ABC News',
            url: 'https://abcnews.com/GMA/Culture/taylor-swift-travis-kelce-relationship-timeline/story?id=118197742',
            source_title: 'Taylor Swift, Travis Kelce are married: See their relationship timeline',
            publisher: 'ABC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Yahoo Lifestyle',
            url: 'https://www.yahoo.com/lifestyle/article/a-look-back-at-taylor-swifts-one-of-a-kind-vintage-inspired-engagement-ring-from-travis-kelce-194728425.html',
            source_title: "Taylor Swift's engagement ring from Travis Kelce is one of a kind, vintage-inspired and really expensive",
            publisher: 'Yahoo Lifestyle',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        photos: [],
      },
    },
    // --- Deep timeline fill (2026-07-08, content/deep-d): song stories, the
    // album's chart marathon, the Kelce arc between engagement and wedding,
    // and the era's 2026 chapters. Every claim verified against its cited
    // source(s) this session; no fabrication.
    {
      slug: 'elizabeth-taylor-track-two',
      year: 2025,
      month: 10,
      category: 'music',
      title: 'Elizabeth Taylor: the first song she wrote for the album',
      snippet:
        'Two showgirls, one lyric: White Diamonds, violet eyes, and "you\'re only as hot as your last hit" — her fame anxiety filtered through the star whose love life the press devoured first. It debuted at No. 3.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Elizabeth_Taylor_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Track two draws the parallel explicitly — the Plaza Athénée, Portofino, "I would trade the Cartier for someone to trust" — two famous women whose romances became public property. Time and Rolling Stone both read it as the album\'s thesis statement: the showgirl persona as armor, borrowed from the woman who wore it best. It was the first Showgirl song written, and it debuted at No. 3 on the Hot 100 behind "The Fate of Ophelia" and "Opalite."',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Elizabeth_Taylor_(song)',
            source_title: 'Elizabeth Taylor (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Time',
            url: 'https://time.com/7322774/taylor-swift-elizabeth-taylor-life-of-a-showgirl/',
            source_title: "The Meaning Behind 'Elizabeth Taylor' on 'The Life of a Showgirl'",
            publisher: 'Time',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/taylor-swift-elizabeth-taylor-life-of-a-showgirl-1235440312/',
            source_title: "Taylor Swift's Brilliant New Song 'Elizabeth Taylor': The Life of Two Showgirls",
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
      slug: 'fate-of-ophelia-video-wardrobe',
      year: 2025,
      month: 10,
      category: 'fashion',
      title: 'The Ophelia video wardrobe: Versace crystals, Cavalli chainmail, custom Ferretti',
      snippet:
        'Every era of showgirl in one self-directed video — a flowing white Alberta Ferretti gown into a red crystal Versace bodysuit with matching gloves, a black chainmail Cavalli fringe dress, and a rhinestone Kelsey Randall mini.',
      sourceUrl: 'https://www.femestella.com/the-fate-of-ophelia-music-video-every-outfit-taylor-swift-wears/',
      thumbnailUrl: null,
      moment: {
        context:
          'The costume parade tracks the video\'s conceit — Swift as a showgirl across different stage-history periods, from the drowned-Ophelia opening to full vaudeville. The long-beaded gown and the swimming costume later left the closet entirely: both went on display at the Rock & Roll Hall of Fame the following June.',
        sources: [
          {
            outlet: 'Femestella',
            url: 'https://www.femestella.com/the-fate-of-ophelia-music-video-every-outfit-taylor-swift-wears/',
            source_title: "'The Fate of Ophelia' Music Video: Every Outfit Taylor Swift Wears",
            publisher: 'Femestella',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'ABC7',
            url: 'https://abc7.com/post/taylor-swift-new-display-rock-roll-hall-fame-features-artifacts-fate-ophelia-music-video/19390785/',
            source_title: "A new display at the Rock & Roll Hall of Fame features artifacts from 'The Fate of Ophelia' music video",
            publisher: 'ABC7 (ABC Owned Television Stations)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'showgirl-graham-norton-destination-wedding',
      year: 2025,
      month: 10,
      category: 'relationship',
      title: 'Wedding plans, teased from a British chat-show couch',
      snippet:
        'On Graham Norton during release week, she said the wedding would be a big destination affair — the first real planning detail either of them had offered since the garden proposal in August.',
      sourceUrl: 'https://www.hellomagazine.com/us/911732/travis-kelce-finally-confirms-long-awaited-taylor-swift-news-after-wedding/',
      thumbnailUrl: null,
      moment: {
        context:
          'The detail set off months of location speculation that neither of them fed further — and the eventual Madison Square Garden ceremony in July 2026 made the "destination" a hometown-adjacent punchline. In a September New Heights episode, guest host Jimmy Fallon had pulled the only other tidbit: "we\'re live music kind of people," per Travis.',
        sources: [
          {
            outlet: 'Hello!',
            url: 'https://www.hellomagazine.com/us/911732/travis-kelce-finally-confirms-long-awaited-taylor-swift-news-after-wedding/',
            source_title: 'Travis Kelce finally confirms long-awaited Taylor Swift news after wedding',
            publisher: 'Hello! Magazine',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'The Knot',
            url: 'https://www.theknot.com/content/taylor-swift-wedding',
            source_title: 'Taylor Swift and Travis Kelce Are Married; Plus, Wedding Details',
            publisher: 'The Knot',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'showgirl-colts-game-sighting',
      year: 2025,
      month: 11,
      category: 'sighting',
      title: 'Back in the suite window for an overtime nail-biter',
      snippet:
        'After weeks of slipping into Arrowhead unphotographed, she was visible celebrating the Colts game from the suite — playfully shaking her dad by the shoulders as Butker\'s kick won it 23-20 in OT.',
      sourceUrl: 'https://www.tmz.com/2025/11/23/taylor-swift-watches-travis-kelce-win-nailbiter-kansas-city/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Nov. 23, 2025 game was her most visible Arrowhead appearance in weeks — E! noted she\'d been keeping a deliberately low profile at games through the fall, a run that ended with the Chiefs\' playoff hopes: the Christmas Broncos game a month later was expected to be Kelce\'s last at home that season.',
        sources: [
          {
            outlet: 'TMZ',
            url: 'https://www.tmz.com/2025/11/23/taylor-swift-watches-travis-kelce-win-nailbiter-kansas-city/',
            source_title: 'Taylor Swift Watches Travis Kelce, Chiefs Beat Colts in Week 12 Nail-Biter',
            publisher: 'TMZ',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/1425412/taylor-swift-supports-travis-kelce-at-chiefs-vs-colts-game',
            source_title: "Taylor Swift Is Travis Kelce's No. 1 Fan at Chiefs vs. Colts Game",
            publisher: 'E! Online',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'showgirl-colts-game-outfit',
      year: 2025,
      month: 11,
      category: 'fashion',
      title: 'A low-key game-day layer for the Colts game',
      snippet:
        'No statement piece this time — a beige, red, and white color-blocked jacket and the signature red lip, dressed for the suite rather than the cameras.',
      sourceUrl: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-kansas-city-chiefs-indianapolis-colts-game-outfit/',
      thumbnailUrl: null,
      moment: {
        context:
          'Marie Claire filed the Nov. 23, 2025 look under "fit for a low-key fan" — a deliberate contrast to the fall\'s headline-grabbing game-day fashion (the Miu Miu bomber, the Christmas-red Frankie Shop look) during a stretch where she was mostly avoiding the broadcast cameras altogether.',
        sources: [
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-kansas-city-chiefs-indianapolis-colts-game-outfit/',
            source_title: "Taylor Swift's Kansas City Chiefs vs. Indianapolis Colts Game Outfit Is Fit for a Low-Key Fan",
            publisher: 'Marie Claire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'end-of-an-era-kelce-episodes',
      year: 2025,
      month: 12,
      category: 'relationship',
      title: 'Travis joins the docuseries for its final episodes',
      snippet:
        'The End of an Era\'s pre-Christmas episodes brought Kelce into the frame — the tour\'s last stretch told with the relationship that started in its stands finally on camera.',
      sourceUrl: 'https://abcnews.com/GMA/Culture/exclusive-1st-end-era-travis-kelce-joins-taylor/story?id=128488203',
      thumbnailUrl: null,
      moment: {
        context:
          'GMA\'s exclusive first look confirmed Kelce appears in the back half of the six-episode Disney+ series, which rolled out Dec. 12, 19, and 23, 2025. The docuseries also addressed the era\'s hardest moment — the cancelled Vienna shows — making it the fullest inside account of the tour\'s final year.',
        sources: [
          {
            outlet: 'ABC News',
            url: 'https://abcnews.com/GMA/Culture/exclusive-1st-end-era-travis-kelce-joins-taylor/story?id=128488203',
            source_title: "Exclusive 1st look: Travis Kelce joins Taylor in next episodes of 'The End of an Era'",
            publisher: 'ABC News (Good Morning America)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-vienna-terror-plot-eras-doc-1235482119/',
            source_title: "Taylor Swift's Eras Tour Doc Addresses Vienna Terror Plot",
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
      slug: 'showgirl-twelve-weeks-number-one',
      year: 2026,
      month: 1,
      category: 'business',
      title: 'Twelve straight weeks at No. 1 — through the entire holiday season',
      snippet:
        'Showgirl held the Billboard 200\'s top spot for 12 consecutive weeks into January — her second-longest run ever behind TTPD — outlasting a record seven Christmas albums crowding the top 10.',
      sourceUrl: 'https://www.billboard.com/music/chart-beat/taylor-swift-showgirl-twelfth-week-number-one-billboard-200-1236148560/',
      thumbnailUrl: null,
      moment: {
        context:
          'The album never left No. 1 from its October debut through the new year — through Wrapped season, through a holiday chart where Bing Crosby posted his biggest streaming week ever at No. 2, through its own 10th and 11th week milestones Billboard tracked one by one.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-showgirl-twelfth-week-number-one-billboard-200-1236148560/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' Nets 12th Week Atop Billboard 200",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
            source_title: 'The Life of a Showgirl',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'showgirl-luminate-2025-top-album',
      year: 2026,
      month: 1,
      category: 'business',
      title: "Luminate's 2025 crown: 5.6 million units, no contest",
      snippet:
        'The year-end report made it official — Showgirl was 2025\'s most-consumed album in the US at 5.607M units, roughly half a million clear of Morgan Wallen. Her fourth year-end No. 1, and second in a row.',
      sourceUrl: 'https://www.billboard.com/pro/luminate-2025-year-end-music-report-taylor-swift-showgirl/',
      thumbnailUrl: null,
      moment: {
        context:
          'Remarkable mostly for the calendar: the album had only 13 weeks of 2025 to work with (Luminate\'s tracking year closed Jan. 1, 2026) and still beat everything released in the previous nine months. It topped Billboard\'s year-end Billboard 200 albums ranking on the same math.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/luminate-2025-year-end-music-report-taylor-swift-showgirl/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' Is Luminate's Top Album of 2025 in U.S.",
            publisher: 'Billboard (Luminate year-end report)',
            source_type: 'chart_database',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-showgirl-2025-year-end-billboard-200-album-1236130192/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' Is the Top Billboard 200 Album of 2025",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'elizabeth-taylor-video-archival',
      year: 2026,
      month: 3,
      category: 'music',
      title: 'The Elizabeth Taylor video: a supercut of the real Liz',
      snippet:
        'Released to close Women\'s History Month — Cleopatra, Cat on a Hot Tin Roof, A Place in the Sun, and newsreel paparazzi footage, cut into a tribute instead of a performance video.',
      sourceUrl: 'https://variety.com/2026/music/news/taylor-swift-elizabeth-taylor-music-video-1236703350/',
      thumbnailUrl: null,
      moment: {
        context:
          'The March 31, 2026 video is built almost entirely from archival material: scenes from nine-plus Taylor films alongside newsreels of her navigating the press. It hit Apple Music and Spotify Premium first, then YouTube two days later — an unusual windowed rollout for a Swift video, and the era\'s first new video since "The Fate of Ophelia."',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2026/music/news/taylor-swift-elizabeth-taylor-music-video-1236703350/',
            source_title: "Taylor Swift Releases 'Elizabeth Taylor' Music Video",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-elizabeth-taylor-music-video-1235539333/',
            source_title: "Taylor Swift Honors a Legend With New 'Elizabeth Taylor' Music Video",
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
      slug: 'rock-hall-ophelia-display',
      year: 2026,
      month: 6,
      category: 'business',
      title: 'The Rock Hall puts the Ophelia gown in Legends of Rock',
      snippet:
        'Cleveland\'s Rock & Roll Hall of Fame added a Showgirl display to its Legends of Rock exhibit: the long-beaded gown, the swimming costume, and dancers\' props from a video past 438 million views.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-display-rock-and-roll-hall-of-fame-1236281831/',
      thumbnailUrl: null,
      moment: {
        context:
          'The display opened in late June 2026 on the museum\'s fifth level — institutional-canon treatment for an era still in progress, before she is even age-eligible for induction. The artifacts come from the self-written, self-directed video whose single led the Hot 100 for 10 weeks, her longest-leading No. 1.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-display-rock-and-roll-hall-of-fame-1236281831/',
            source_title: "New Taylor Swift Display Opens in the Rock & Roll Hall of Fame's 'Legends of Rock' Exhibit",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'ABC7',
            url: 'https://abc7.com/post/taylor-swift-new-display-rock-roll-hall-fame-features-artifacts-fate-ophelia-music-video/19390785/',
            source_title: "A new display at the Rock & Roll Hall of Fame features artifacts from 'The Fate of Ophelia' music video",
            publisher: 'ABC7 (ABC Owned Television Stations)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'kelce-new-heights-proposal-story',
      year: 2026,
      month: 7,
      category: 'relationship',
      title: 'Back on New Heights, a married man with a proposal story',
      snippet:
        'In his first episode after the wedding, Travis walked through the "epic" garden proposal and life as a husband — the podcast that announced the album now bookending the era\'s whole arc.',
      sourceUrl: 'https://www.eonline.com/news/1433765/taylor-swift-travis-kelce-wedding-travis-details-proposal',
      thumbnailUrl: null,
      moment: {
        context:
          'The post-wedding episode closed a loop the era opened: New Heights hosted the album reveal in August 2025, the engagement announcement followed two weeks later, and eleven months on, Kelce recapped the Madison Square Garden wedding from the same desk.',
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/1433765/taylor-swift-travis-kelce-wedding-travis-details-proposal',
            source_title: 'Travis Kelce Details "Epic" Taylor Swift Proposal in First Podcast Episode After MSG Wedding',
            publisher: 'E! Online',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/celebrity/articles/travis-kelce-reflects-taylor-swift-110036898.html',
            source_title: "Travis Kelce Reflects on Taylor Swift Proposal in First 'New Heights' Appearance Since Starry N.Y.C. Wedding",
            publisher: 'Yahoo Entertainment',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'showgirl-ring-designer-wedding-invite',
      year: 2026,
      month: 7,
      category: 'relationship',
      title: 'The ring designer gets a wedding invite of her own',
      snippet:
        'Kindred Lubeck of Artifex Fine Jewelry, who designed Taylor\'s engagement ring with Travis, was among the guests at the Madison Square Garden wedding — and publicly thanked the "incredible" couple for including her.',
      sourceUrl: 'https://www.eonline.com/news/1433683/taylor-swift-travis-kelce-invited-ring-designer-kindred-lubeck-to-wedding',
      thumbnailUrl: null,
      moment: {
        context:
          'Lubeck\'s attendance closed the loop on the engagement-ring story: the jeweler who worked with Kelce on the custom Old Mine Cut design nearly a year earlier was invited to see the marriage it led to, a detail she confirmed publicly after the wedding.',
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/1433683/taylor-swift-travis-kelce-invited-ring-designer-kindred-lubeck-to-wedding',
            source_title: 'Taylor Swift, Travis Kelce invited Ring Designer Kindred Lubeck to Wedding',
            publisher: 'E! Online',
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
