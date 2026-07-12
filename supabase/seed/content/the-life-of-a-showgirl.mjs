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
      day: 13,
      category: 'release',
      title: 'A mint-green briefcase on New Heights: album No. 12, announced on her first-ever podcast',
      snippet:
        'Teased by a 12:12 a.m. countdown, revealed on Travis and Jason Kelce\'s New Heights: a briefcase with an orange "TS," a title, and an Oct. 3 date. The episode set a Guinness World Record with 1.3 million concurrent YouTube viewers — the most ever for a podcast.',
      sourceUrl: 'https://www.nbcnews.com/pop-culture/pop-culture-news/taylor-swift-sets-guinness-world-record-new-heights-podcast-appearance-rcna227245',
      thumbnailUrl: null,
      moment: {
        context:
          'A countdown on her website expired at 12:12 a.m. ET on Aug. 12, 2025, revealing the teaser; the full episode aired the next evening. On it she pulled the blurred mint-green briefcase from behind the desk — mint green with an orange "TS" — revealed the 12-track list ending in a Sabrina Carpenter feature, and talked through the era\'s orange-glitter look. It was her first-ever podcast appearance, staged on her boyfriend\'s own show, and it doubled as the most unguarded long-form interview she had given in years: two hours of album talk, football talk, and the couple\'s dynamic on camera.\n\nThe internet did not hold. The livestream crashed under the load about an hour and 44 minutes in, with the concurrent count peaking at 1.3 million viewers — a figure Guinness World Records certified as the most concurrent views ever for a podcast on YouTube. Within 24 hours the episode had roughly 13 million YouTube views, per Variety\'s tally. The announcement\'s mechanics became the era\'s template: every detail, from the 12:12 a.m. timestamp to the reveal\'s staging on the Kelce brothers\' set, was read by fans as deliberate.',
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
        // Episode identity verified 2026-07-09 via YouTube oEmbed
        // (watch?v=M2lX9XESvDE -> "Taylor Swift on Reclaiming Her Masters,
        // Wrapping The Eras Tour, and The Life of a Showgirl | NHTV",
        // author @newheightshow). Thumbnail verified HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/M2lX9XESvDE/hqdefault.jpg',
            credit: 'New Heights with Jason & Travis Kelce (official YouTube episode thumbnail)',
            caption:
              'The thumbnail of the record-breaking New Heights episode itself — Swift between Travis and Jason Kelce, holding The Life of a Showgirl artwork on the set where album No. 12 was announced.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'showgirl-mert-marcus-portraits',
      year: 2025,
      month: 8,
      day: 13,
      category: 'fashion',
      title: 'The showgirl portraits: Mert and Marcus, rhinestones, and an Ophelia bathtub cover',
      snippet:
        'Her most theatrical album imagery yet — feathered, crystal-covered showgirl looks shot by Mert and Marcus (their first Swift shoot since reputation), and a cover of her half-submerged in water in a diamond-lined AREA bralette, nodding to Millais\'s painting of Ophelia.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift said the submerged cover glamorizes the offstage side of the Eras Tour — her day "ends in a bathtub, not usually in a bedazzled dress" — choosing a behind-the-scenes image over full showgirl mode because the songs are about what she was going through offstage. The title is lettered in orange glitter, and the wider shoot\'s bejeweled bodysuits and feather headdresses were described by critics as the most provocative, glamorous visual identity of her career. It reunited her with Mert Alas and Marcus Piggott, the duo behind reputation\'s black-and-white newsprint portraits — their first Swift shoot since 2017, now flipped from monochrome menace to full Vegas color.\n\nMarie Claire\'s wardrobe breakdown of the album packaging reads like a showgirl-history syllabus: vintage Bob Mackie — the designer synonymous with Cher and the Las Vegas stage — appears on several alternate covers, alongside custom Gucci, The Blonds, a Kelsey Randall chainmail dress, Fleur du Mal lingerie, and an Annie\'s Ibiza mini with Lorraine Schwartz jewels. The feathered backstage portrait shown here, styled dressing-room-mirror-and-all, is the shoot\'s thesis in one frame: the glamour machine photographed from inside the dressing room rather than from the audience.',
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
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-the-life-of-a-showgirl-style/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' Album Style, Explained",
            publisher: 'Marie Claire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // Image from the album shoot itself, hotlinked from Marie Claire's
        // credited copy (credit: Mert Alas and Marcus Piggott). Verified
        // HTTP 200 + image/jpeg and visually confirmed this session.
        photos: [
          {
            url: 'https://cdn.mos.cms.futurecdn.net/vHBrRbZzrfetu5KQQR2VBZ.jpg',
            credit: 'Mert Alas and Marcus Piggott, via Marie Claire',
            caption:
              'From the album shoot: Swift in vintage Bob Mackie feathers at a dressing-room mirror, surrounded by showgirls in matching plumes — Mert and Marcus\'s backstage-glamour thesis for the era.',
            kind: 'primary',
          },
        ],
      },
    },

    // --- Release week (October 2025).
    {
      slug: 'showgirl-release-day',
      year: 2025,
      month: 10,
      day: 3,
      category: 'release',
      title: 'The Life of a Showgirl arrives: 12 tracks, Max Martin and Shellback, one guest',
      snippet:
        'Written and recorded in Sweden between European Eras Tour dates — her first full album with Max Martin and Shellback since 1989 and reputation. Twelve tracks, no Anthology-style sprawl, and a single feature: Sabrina Carpenter on the closing title track.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/f/f4/Taylor_Swift_%E2%80%93_The_Life_of_a_Showgirl_%28album_cover%29.png',
      moment: {
        context:
          'On New Heights she described slipping to Sweden during the Eras Tour\'s 2024 European leg to cut the record with Max Martin and Shellback, keeping it deliberately tight at 12 songs after the 31-track Tortured Poets Anthology. It was a pointed reunion: Martin and Shellback built the pop machinery of 1989 and reputation, and this was her first full album with them since — made in stolen days between stadium shows, which she said is exactly what the songs are about. The tracklist runs from a Hamlet-referencing opener to a George Michael interpolation to the Carpenter duet that gives the album its name.\n\nThe cover — shot by Mert Alas and Marcus Piggott — shows Swift half-submerged in water in a diamond-lined AREA bralette, restaging Millais\'s Ophelia under an orange, glittery title treatment. She framed it as a deliberately offstage image: "My day ends in a bathtub, not usually in a bedazzled dress," she said, wanting the artwork to be "about what happened offstage" rather than onstage. The bathtub reading pays off on track one — the drowned Ophelia of the cover is the same woman the opening song pulls out of the water.',
        // Cover art added 2026-07-09 under the relaxed image policy (hotlink any
        // real, publicly-available image with credit; no AI images). Hotlinked from
        // Wikipedia's stable copy of the official artwork — verified HTTP 200,
        // image/png, this session. Supersedes the earlier described-only stance.
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
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-life-of-showgirl-details-cover-new-heights-1235406130/',
            source_title: "Taylor Swift Unveils 'The Life of a Showgirl' Cover, Sabrina Carpenter Feature",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Taylor_Swift_%E2%80%93_The_Life_of_a_Showgirl_%28album_cover%29.png',
            credit: 'Album cover photographed by Mert Alas & Marcus Piggott / Republic Records, via Wikipedia',
            caption:
              'The official album cover: Swift half-submerged in water in a diamond-lined AREA bralette, restaging Millais\'s Ophelia beneath the orange-glitter title.',
            kind: 'primary',
          },
          // Release-day pop-up/theater-event photos were looked for on 2026-07-09
          // but skipped: the only credited galleries found (Deadline) sit behind a
          // bot-wall, CNN's image pages return HTTP 451 to us, and Wikimedia
          // Commons has no release-party media — no stable, verifiable direct
          // image URL was available, so none is force-added.
        ],
      },
    },
    {
      slug: 'showgirl-release-party-theaters',
      year: 2025,
      month: 10,
      day: 3,
      category: 'release',
      title: 'The Official Release Party of a Showgirl turns movie theaters into listening parties',
      snippet:
        'A one-weekend-only AMC event, Oct. 3–5: the premiere of "The Fate of Ophelia" video, behind-the-scenes footage, and lyric videos for the whole album — with audiences singing and dancing in the aisles. It earned an A+ CinemaScore.',
      sourceUrl: 'https://www.cnn.com/2025/10/05/business/taylor-swift-amc-showgirl-box-office',
      thumbnailUrl: null,
      moment: {
        context:
          'Announced barely two weeks out and distributed by AMC Theatres Distribution with Variance Films domestically and Piece of Magic internationally, the 89-minute event was built as a communal album drop rather than a concert film — release-day showtimes started at 3 p.m. ET so fans could hear the record together. The program packed in the premiere of the self-directed "The Fate of Ophelia" video, behind-the-scenes footage from its set, lyric videos for the full album, and Swift on camera talking through the songs.\n\nTheaters leaned into the party: costumes, friendship bracelets, and full-crowd singalongs to songs nobody had heard that morning. CNN\'s dispatch from opening weekend described aisles turned into dance floors, and audiences graded the experience an A+ CinemaScore — a mark usually reserved for crowd-pleasing blockbusters. AMC\'s own press release called it "an unprecedented, record-setting worldwide success," and the numbers backed the hyperbole: more than $50 million in global box office for a weekend-only album listening party.',
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
        // Official theatrical poster, hotlinked from Wikipedia's stable copy
        // (exact filename from the article's HTML). Verified HTTP 200 +
        // image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/2/26/Taylor_Swift_The_Official_Release_Party_of_a_Showgirl_poster.png',
            credit: 'Official theatrical release poster / AMC Theatres Distribution, via Wikipedia',
            caption:
              'The official poster for the one-weekend-only theatrical event that turned the album\'s release day into a group listening party.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'showgirl-box-office-number-one',
      year: 2025,
      month: 10,
      day: 5,
      category: 'business',
      title: 'An album release party wins the box office: $34.1M domestic, $50M+ worldwide',
      snippet:
        'The Release Party topped the North American box office on $34.1 million and crossed $50 million globally in its single weekend — the biggest album-debut event in cinema history, beating actual movies without being one.',
      sourceUrl: 'https://www.screendaily.com/news/taylor-swift-the-official-release-party-of-a-showgirl-rules-north-american-box-office-on-341m/5209617.article',
      thumbnailUrl: null,
      moment: {
        context:
          'The three-day domestic gross split $15.8M Friday, $9.9M Saturday, and $8.3M Sunday, with roughly $16 million more internationally. Every "ticket" was for the same 89 minutes of content playing on a loop of showtimes — no plot, no premiere, no stars in attendance — and it still beat every actual movie in wide release that weekend.\n\nAMC called it the biggest album-debut cinema event ever, domestic and global — a rerun of the distribution play she pioneered with The Eras Tour concert film in 2023, when she bypassed the studio system and took the tour film to AMC directly. The weekend reads as a structural story as much as a Swift story: proof that a big enough artist can rent the entire theatrical apparatus for a weekend and turn an album release into a box-office event, without a studio in the deal.',
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
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/2/26/Taylor_Swift_The_Official_Release_Party_of_a_Showgirl_poster.png',
            credit: 'Official theatrical release poster / AMC Theatres Distribution, via Wikipedia',
            caption:
              'The poster for the event that topped the weekend box office — an album release party billed, sold, and reported like a feature film.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'showgirl-four-million-week',
      year: 2025,
      month: 10,
      day: 18,
      category: 'business',
      title: '4.002 million in a week: the biggest album debut ever measured',
      snippet:
        'The largest single-week total in Billboard 200 history — 4.002 million equivalent units, about 3.48 million of them pure sales, past Adele\'s decade-old 25 record. It\'s her 15th No. 1 album, breaking her tie with Drake and Jay-Z for the most among soloists.',
      sourceUrl: 'https://www.billboard.com/lists/taylor-swift-life-of-a-showgirl-number-one-billboard-200/',
      thumbnailUrl: null,
      moment: {
        context:
          'The week (charts dated Oct. 18, 2025) counted 3,479,500 in pure album sales plus 680.9 million on-demand streams — 4.002 million equivalent units in total, the largest single week for any album since Billboard began tracking by Luminate\'s modern methodology. She\'d already passed Adele\'s 3.482 million-unit 2015 benchmark for 25 within five days, retiring a record that had stood for a decade and that many chart-watchers assumed the streaming era had made permanently unreachable.\n\nIt was also her 15th No. 1 album, breaking the three-way tie with Drake and Jay-Z for the most Billboard 200 chart-toppers among soloists — only The Beatles, at 19, remain ahead. Universal reported more than 5.5 million equivalent units globally in week one. Her reaction, via Billboard: "I\'ll cherish this feeling forever."',
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
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Taylor_Swift_%E2%80%93_The_Life_of_a_Showgirl_%28album_cover%29.png',
            credit: 'Album cover photographed by Mert Alas & Marcus Piggott / Republic Records, via Wikipedia',
            caption:
              'The album behind the biggest sales week ever measured: 4.002 million equivalent units in seven days.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'showgirl-spotify-records',
      year: 2025,
      month: 10,
      day: 3,
      category: 'business',
      title: "Spotify's 2025 single-day streaming record falls in under 11 hours",
      snippet:
        'Showgirl became Spotify\'s most-streamed album in a single day of 2025 before lunch, finished day one with roughly 250 million global streams, and had already broken the platform\'s all-time pre-save record at over 6 million.',
      sourceUrl: 'https://newsroom.spotify.com/2025-10-03/taylor-swift-life-showgirl-spotify-record/',
      thumbnailUrl: null,
      moment: {
        context:
          'The milestones stacked up hourly on Oct. 3: Spotify confirmed the album had become 2025\'s biggest single-day debut before the workday ended, having already smashed the platform\'s all-time pre-save record with more than 6 million saves banked before a note went public. By midnight the album sat at roughly 250 million global streams for the day.\n\nDay one also made "The Fate of Ophelia" the most-streamed song in a single day in Spotify history. The album\'s ~250 million single-day total is second all-time only to her own Tortured Poets Department (314 million) — that record\'s survival being the one release-week superlative Showgirl left standing. Deadline\'s tally framed it as a competition with exactly one participant: the only albums anywhere near her numbers are her own.',
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
        // Official MV thumbnail for the song that set the single-day song
        // record; id ko70cExuzZM verified against @TaylorSwift via oEmbed.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/ko70cExuzZM/hqdefault.jpg',
            credit: 'Taylor Swift / Republic Records (official "The Fate of Ophelia" music video thumbnail, YouTube)',
            caption:
              '"The Fate of Ophelia," whose Oct. 3 numbers made it the most-streamed song in a single day in Spotify history.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'showgirl-vinyl-record-week',
      year: 2025,
      month: 10,
      day: 13,
      category: 'business',
      title: '1.334 million vinyl LPs in seven days — the first million-vinyl week ever tracked',
      snippet:
        'No album had ever sold a million vinyl copies in a week since modern tracking began. Showgirl did 1.334 million, blowing past her own record of 859,000 set by The Tortured Poets Department.',
      sourceUrl: 'https://www.forbes.com/sites/hughmcintyre/2025/10/08/taylor-swift-shatters-the-all-time-vinyl-sales-record-in-a-matter-of-hours/',
      thumbnailUrl: null,
      moment: {
        context:
          'The push came from a stack of collectible pressings in the era\'s signature orange — multiple variants, retailer exclusives included, sold as objects to own as much as records to play. Forbes tracked the record falling within hours of release day, not at week\'s end: her own all-time vinyl mark of 859,000, set by The Tortured Poets Department in 2024, was gone almost immediately, and the week closed at 1.334 million LPs.\n\nNPR\'s analysis noted the number is less about turntables than fandom-as-collecting — a physical-object economy she has done more than anyone to revive, where a pressing in the right shade of orange is a fan artifact first and an audio format second. The vinyl haul was the engine of the pure-sales side of her 4-million-unit week, and the reason a 2025 blockbuster could post sales splits that look like the CD era.',
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
        // Getty photo NPR ran with its vinyl analysis; hotlinked from NPR's
        // stable CDN copy. Verified HTTP 200 + image/jpeg and visually
        // confirmed (a fan holding the orange Target-exclusive LP in-store).
        photos: [
          {
            url: 'https://npr.brightspotcdn.com/dims3/default/strip/false/crop/6971x3921+0+363/resize/1400/quality/85/format/jpeg/?url=http%3A%2F%2Fnpr-brightspot.s3.amazonaws.com%2F82%2Fd2%2Fa3ec9b6b4c94bffaeed9273b69dc%2Fgettyimages-2238895638.jpg',
            credit: 'Getty Images, via NPR',
            caption:
              'A fan holds a Target-exclusive pressing of The Life of a Showgirl on release week — one of the collectible variants that drove the first million-vinyl week ever tracked.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'showgirl-hot-100-top-12-sweep',
      year: 2025,
      month: 10,
      day: 18,
      category: 'business',
      title: "All 12 tracks debut as the Hot 100's entire top 12",
      snippet:
        'Every song on the album landed inside the top 12 of the Hot 100 in its first week — the whole tracklist, in a block — making her the first artist ever to monopolize the chart\'s top 10 three separate times.',
      sourceUrl: 'https://www.billboard.com/lists/taylor-swift-hot-100-fate-of-ophelia-number-one/',
      thumbnailUrl: null,
      moment: {
        context:
          'On the Hot 100 dated Oct. 18, 2025, the chart\'s top 12 positions and the album\'s 12-song tracklist were the same list: "The Fate of Ophelia" at No. 1, "Elizabeth Taylor" at No. 3, "Opalite" at No. 2, and every other track slotted in behind them, with nothing else — no other artist, no other song — inside the top 12.\n\nShe first claimed a full top 10 with Midnights in 2022, again with TTPD\'s top-14 sweep in 2024, and now a third time, making her the only artist ever to monopolize the chart\'s top 10 on three occasions. This one was unique in shape: a 12-track album occupying exactly the top 12, the complete tracklist with nothing left over — a chart picture only possible because she kept the album short.',
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
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/0/09/Taylor_Swift_%E2%80%93_The_Fate_of_Ophelia_%28CD_single_cover%29.png',
            credit: 'Single artwork / Republic Records, via Wikipedia',
            caption:
              '"The Fate of Ophelia" single artwork — the song that led the album\'s wall-to-wall occupation of the Hot 100\'s top 12 from No. 1.',
            kind: 'archival',
          },
        ],
      },
    },

    // --- Song stories (music).
    {
      slug: 'fate-of-ophelia-lead-single',
      year: 2025,
      month: 10,
      day: 13,
      category: 'music',
      title: 'The Fate of Ophelia: Hamlet\'s drowned girl, rescued — and a 13th Hot 100 No. 1',
      snippet:
        'The opener flips Millais\'s Ophelia (the same painting the cover restages): this narrator gets pulled out of the water by a love that "saved my heart." It debuted at No. 1 — her 13th chart-topper, on brand for her — and stayed there deep into the winter.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Fate_of_Ophelia',
      thumbnailUrl: null,
      moment: {
        context:
          'Released Oct. 3, 2025 as the lead single and opening track, the song reworks Hamlet: where Millais\'s Ophelia (the muse was Pre-Raphaelite model Elizabeth Siddal) drowns, Swift imagined a version who instead "met someone who treated her well" and is pulled from the water. Written and produced with Max Martin and Shellback and recorded in Stockholm between Eras Tour dates, it debuted atop the Billboard Hot 100 — her 13th No. 1 — and went on to spend 10 non-consecutive weeks at the top, her longest-running No. 1 single, out-running "Anti-Hero."\n\nSwift wrote and directed the official music video herself; it premiered inside the theatrical Official Release Party of a Showgirl over release weekend, moving through vaudeville and showgirl tableaux built around the drowned-painting image — Marilyn-style stagecraft, 1960s go-go dancing, Busby Berkeley-scale synchronized-swim formations — before its own YouTube debut two days later. The chorus choreography became a bona fide social trend, recreated by fans and, memorably, by Australia\'s Prime Minister Anthony Albanese. The single became the commercial spine of the era: on top of the Hot 100 run it led the Billboard Global 200 for seven weeks and set Spotify\'s single-day song-streaming record on release day.',
        // Official MV id verified 2026-07-09 via YouTube oEmbed:
        // https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=ko70cExuzZM
        // -> title "Taylor Swift - The Fate of Ophelia (Official Music Video)",
        // author @TaylorSwift (official channel). Recorded here at the source of
        // truth. TODO(sync/founder): (1) scripts/sync-longlive-content.mjs does not
        // yet forward `moment.video` from seed items into VAULT_RAW, so this won't
        // render until that pass-through is added; (2) the curated content.ts item
        // `tloas-fate-of-ophelia-video` currently embeds the promo-clip id
        // 'fxeEYfVDaJI' ("...available now, only on YouTube") — it should adopt this
        // canonical MV id 'ko70cExuzZM'. Both are out of scope for this seed-only PR.
        video: { youtubeId: 'ko70cExuzZM', title: 'Taylor Swift - The Fate of Ophelia (Official Music Video)' },
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
        // Single cover from the Wikipedia article's own HTML (stable
        // upload.wikimedia.org copy) + official MV thumbnail (id verified
        // via oEmbed against @TaylorSwift). Both HTTP 200 this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/0/09/Taylor_Swift_%E2%80%93_The_Fate_of_Ophelia_%28CD_single_cover%29.png',
            credit: 'CD single artwork / Republic Records, via Wikipedia',
            caption: 'The official single artwork for "The Fate of Ophelia."',
            kind: 'primary',
          },
          {
            url: 'https://i.ytimg.com/vi/ko70cExuzZM/hqdefault.jpg',
            credit: 'Taylor Swift / Republic Records (official music video thumbnail, YouTube)',
            caption:
              'From the self-written, self-directed music video that premiered in theaters before hitting YouTube.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'father-figure-george-michael',
      year: 2025,
      month: 10,
      day: 3,
      category: 'music',
      title: "Father Figure rebuilds George Michael's 1988 hit — with his estate's blessing",
      snippet:
        'She approached George Michael\'s estate before release to clear the interpolation; hearing the track, they said they "had no hesitation" and believed "George would have felt the same." Her version recasts the title as music-industry patronage — the protégé outgrowing the patron.',
      sourceUrl: 'https://www.rollingstone.com/music/music-news/george-michael-taylor-swift-father-figure-song-1235439835/',
      thumbnailUrl: null,
      moment: {
        context:
          'Michael\'s original gets a formal songwriting credit on the track — George Michael is listed as a writer alongside Swift, Max Martin, and Shellback, since the song lifts the melody and the "I\'ll be your father figure" line directly. The estate\'s public statement framed it as an "association between two great artists," one of the warmest legacy-artist endorsements any of her interpolations has drawn, and pointedly noted they were approached before release rather than after.\n\nSwift\'s version flips the phrase from seduction to power: she has described the song as a mentor-and-protégé story told from the mentor\'s side, saying she drew on Succession\'s Logan Roy for the voice — though she added that she has lived the protégé\'s side of it. Critics heard the autobiography immediately, reading lines about finding someone young and profiting from their success as her Big Machine signing and the masters dispute retold from behind the boss\'s desk. It debuted at No. 4 on the Hot 100, and Pitchfork singled it out as the album\'s most direct appraisal of her own power.',
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
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Father_Figure_(Taylor_Swift_song)',
            source_title: 'Father Figure (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
        ],
        // Lyric-video id 98SmlWOKuME verified via oEmbed against
        // @TaylorSwift; Commons photo license-checked (public domain,
        // University of Houston Digital Library, Faith World Tour 1988).
        photos: [
          {
            url: 'https://i.ytimg.com/vi/98SmlWOKuME/hqdefault.jpg',
            credit: 'Taylor Swift / Republic Records (official "Father Figure" lyric video thumbnail, YouTube)',
            kind: 'primary',
            caption: 'The official lyric video for "Father Figure."',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/George_Michael_%28cropped%29.jpeg',
            credit: 'University of Houston Digital Library, public domain, via Wikimedia Commons',
            caption:
              'George Michael on the Faith World Tour in Houston, 1988 — the era of the original "Father Figure" his estate cleared Swift to rebuild.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'eldest-daughter-track-five',
      year: 2025,
      month: 10,
      day: 3,
      category: 'music',
      title: 'Eldest Daughter: the first track five that ends somewhere safe',
      snippet:
        'The album\'s track five — the slot fans expect to hurt — names "eldest daughter syndrome," the firstborn\'s job of holding everything together. But unlike every track five before it, this one resolves into reassurance instead of grief.',
      sourceUrl: 'https://time.com/7322849/taylor-swift-eldest-daughter-the-life-of-a-showgirl-track-5/',
      thumbnailUrl: null,
      moment: {
        context:
          'At 4:06 it\'s the longest song on the album — a minor-key piano ballad in a tracklist otherwise built on Max Martin bounce. The lyric plays directly on "eldest daughter syndrome": the firstborn who calls herself the "first lamb to the slaughter," dressed up as a wolf so nobody worries. Swift\'s own track commentary framed it as a song about the gap between the public self and the private one — "the life you show to others... and the \'you\' that only those closest know."\n\nTime read it as a deliberate turn in the track-five tradition she once described discovering by accident — the vulnerable song instinctively sequenced fifth, a slot fans treat as canon and Swift has admitted has become a "pressurized decision." It keeps the confessional register of its predecessors while, for the first time in the tradition\'s history, landing on being taken care of rather than being wrecked: the eldest daughter gets to put the wolf costume down.',
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
          {
            outlet: 'Capital FM',
            url: 'https://www.capitalfm.com/news/taylor-swift-eldest-daughter-lyrics-meaning/',
            source_title: "Taylor Swift explains real meaning behind her 'Eldest Daughter' lyrics",
            publisher: 'Capital FM (Global)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 3,
          },
        ],
        // Lyric-video id HwQnW_ZRKhc verified via oEmbed against @TaylorSwift.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/HwQnW_ZRKhc/hqdefault.jpg',
            credit: 'Taylor Swift / Republic Records (official "Eldest Daughter" lyric video thumbnail, YouTube)',
            caption: 'The official lyric video for "Eldest Daughter," the album\'s track five.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'showgirl-title-track-sabrina',
      year: 2025,
      month: 10,
      day: 3,
      category: 'music',
      title: 'The title track hands the last word to Sabrina Carpenter',
      snippet:
        'The album\'s only feature closes it: Sabrina Carpenter — who opened the Eras Tour\'s first leg before her own breakout — duets on "The Life of a Showgirl," a showgirl passing hard-won stage wisdom to the next one up.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
      thumbnailUrl: null,
      moment: {
        context:
          'The song tells the story of a veteran performer named Kitty and the young singer studying her, and the casting does the subtext: Carpenter went from Eras Tour opener in 2023-24 to arena headliner in her own right by the time the album dropped. It was the pairing fans most wanted from the tracklist reveal on New Heights, and the reason the feature stayed the announcement\'s biggest talking point through release week.\n\nThe track doubles as the album\'s mission statement — the "life of a showgirl" the title promises turns out to be Kitty\'s hard-won stage wisdom, handed down the way the real Swift-Carpenter relationship played out in stadium wings for two years. The lyric sheet closes on a scripted curtain-call exchange between the two of them — Swift\'s "Give it up for the band / And the dancers / And of course, Sabrina," answered by Carpenter\'s "I love you, Taylor!" — laid over real crowd noise recorded at the final Eras Tour show in Vancouver, folding the tour\'s actual sound into the album\'s closing minutes. Ending the record on a duet with her own former opener made the succession theme explicit: the album about being a showgirl closes by introducing the next one.',
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
        // Lyric-video id OU6362Nggg0 verified via oEmbed against @TaylorSwift.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/OU6362Nggg0/hqdefault.jpg',
            credit: 'Taylor Swift / Republic Records (official "The Life of a Showgirl" lyric video thumbnail, YouTube)',
            caption:
              'The official lyric video for the title track — the album\'s only feature, closing the record with Sabrina Carpenter.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'opalite-second-number-one',
      year: 2026,
      month: 2,
      day: 28,
      category: 'music',
      title: 'Opalite follows Ophelia to No. 1',
      snippet:
        'The sunny track three — widely heard by fans and critics as her Travis song, its title a man-made stone standing in for a happiness you build yourself — became the album\'s second Hot 100 No. 1 on the chart dated Feb. 28, 2026, months after "The Fate of Ophelia" had wrapped its own 10-week run at the top.',
      sourceUrl: 'https://slate.com/culture/2026/02/taylor-swift-opalite-billboard-hot-100-song-ophelia.html',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift has not confirmed the song\'s subject — the Travis Kelce reading (opal as his October birthstone, the synthetic stone as self-made joy) is fan and critic interpretation, labeled as such — but she has described what it\'s about: forgiving yourself when life "didn\'t pan out the way you wanted it to," and giving yourself permission not to marry the first person you ever dated. Kelce, for his part, called it his favorite song on the album on New Heights. Musically it\'s the record\'s sunniest stretch — a disco-inflected Max Martin/Shellback production critics kept comparing to ABBA and Fleetwood Mac.\n\nIt had debuted at No. 2 behind "The Fate of Ophelia" in October; the formal single push, including a run of remixes (Chris Lake, BUNT., Skream, and Ely Oaks among them), landed in mid-February 2026, and on the chart dated Feb. 28, 2026 — its 20th chart week — it leapt from No. 8 to No. 1, replacing Bad Bunny\'s "DTMF." Slate\'s chart analysis of the February 2026 ascent noted the unusual shape of it: a second Hot 100 No. 1 from the same 12-track album, arriving months after release and months after its album-mate "The Fate of Ophelia" had wrapped its own 10-week run at the top.',
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
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Opalite_(song)',
            source_title: 'Opalite (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-opalite-hot-100-number-one/',
            source_title: "Taylor Swift's 'Opalite' Hits No. 1 on the Hot 100",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-10',
            reliability_score: 5,
          },
        ],
        // Single artwork filename taken from the Wikipedia article's HTML;
        // stable upload.wikimedia.org copy, verified HTTP 200 + image/png.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/9/92/Taylor_Swift_-_Opalite.png',
            credit: 'Single artwork / Republic Records, via Wikipedia',
            caption: 'The official single artwork for "Opalite," the album\'s second Hot 100 No. 1.',
            kind: 'primary',
          },
        ],
      },
    },

    {
      slug: 'ruin-the-friendship-hendersonville',
      year: 2025,
      month: 10,
      day: 3,
      category: 'music',
      title: 'Ruin the Friendship: a regret from Hendersonville High',
      snippet:
        'A song about the high-school kiss she never risked — with a devastating final verse at a funeral. Fans traced it to her classmate Jeff Lang, who died in 2010; his mother told The Tennessean she wished she could thank Swift for "keeping his name alive."',
      sourceUrl: 'https://en.wikipedia.org/wiki/Ruin_the_Friendship',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift has not named the song\'s subject — the Lang connection is fan interpretation, labeled as such, but it rests on public record: she sang at a close friend\'s funeral in 2010 and thanked "Jeff Lang" from the BMI Country Awards stage that year, saying she used to play him her songs first. Fans lined those facts up with the song\'s Hendersonville high-school setting and its final verse — the narrator getting the news of his death and singing at his grave, regretting she never kissed him and admitting "we\'ll never know why" — within hours of release.\n\nWhat elevated the theory beyond lyric forensics was the family\'s response. Lang\'s mother told The Tennessean she wished she could thank Swift for "keeping his name alive," effectively blessing the reading without Swift ever confirming it. The lyric\'s advice — ruin the friendship, kiss your friend while you can — lands as the album\'s quietest gut-punch, a country-storytelling move (the twist verse, the moral) smuggled onto her glossiest pop record.',
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
        // Lyric-video id WQCPl5rTMDQ verified via oEmbed against @TaylorSwift.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/WQCPl5rTMDQ/hqdefault.jpg',
            credit: 'Taylor Swift / Republic Records (official "Ruin The Friendship" lyric video thumbnail, YouTube)',
            caption: 'The official lyric video for "Ruin the Friendship."',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'actually-romantic-one-sided-feud',
      year: 2025,
      month: 10,
      day: 3,
      category: 'music',
      title: "Actually Romantic: the diss track she frames as a compliment",
      snippet:
        'Her own track intro: it\'s about "realizing that someone else has kind of had a one-sided adversarial relationship with you" — living "in their head rent free." Critics near-unanimously read it as an answer to Charli XCX\'s "Sympathy is a knife."',
      sourceUrl: 'https://en.wikipedia.org/wiki/Actually_Romantic',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift never names Charli — the reading is critic and fan interpretation, labeled as such, built from the "Boring Barbie" opening line and the two artists\' overlapping 1975 chapters. Her own framing, in the track-by-track commentary, is studiously subject-free: someone has been carrying on a "one-sided adversarial relationship" she didn\'t know about, and the song reframes that obsession as flattery — hate as a form of attention, attention as a form of love.\n\nIt became the album\'s most-argued-about track. Variety published a full timeline of the perceived Swift-Charli history, from tour-opener days through "Sympathy is a knife," treating the song as the latest entry in a documented arc; Rolling Stone ran a commentary questioning whether the biggest pop star on earth punching laterally at a fellow artist was a good look at all. That split — delicious lore versus unnecessary swipe — kept the track in the discourse long after release week, precisely because Swift left the target deniable.',
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
        // Lyric-video id FnEg1RgmqO4 verified via oEmbed against @TaylorSwift.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/FnEg1RgmqO4/hqdefault.jpg',
            credit: 'Taylor Swift / Republic Records (official "Actually Romantic" lyric video thumbnail, YouTube)',
            caption: 'The official lyric video for "Actually Romantic."',
            kind: 'primary',
          },
        ],
      },
    },

    // --- The Eras Tour's send-off (tour + release, December 2025).
    {
      slug: 'end-of-an-era-docuseries',
      year: 2025,
      month: 12,
      day: 12,
      category: 'release',
      title: 'The End of an Era: the Eras Tour docuseries lands on Disney+',
      snippet:
        'Six episodes going backstage on the record-breaking tour, directed by Don Argott and Sheena M. Joyce, with Gracie Abrams, Sabrina Carpenter, Ed Sheeran, and Florence Welch. Episodes rolled out Dec. 12, 19, and 23 — a three-Friday(ish) December takeover.',
      sourceUrl: 'https://abcnews.com/GMA/Culture/taylor-swifts-end-era-docuseries-final-show/story?id=128047876',
      thumbnailUrl: null,
      moment: {
        context:
          'The docuseries covers the tour\'s full 2023-24 arc — the staging, the surprise-song scramble, the Kelce of it all — and functions as the era-bridge between TTPD\'s stadium years and the Showgirl era they produced: she wrote the new album on this tour\'s European leg. It doesn\'t flinch from the tour\'s hardest chapter, either: the opening episode deals with the foiled Vienna terror plot and its aftermath, the first time Swift has discussed it at length on camera.\n\nThe six episodes run 42-49 minutes each and rolled out in pairs — Dec. 12, Dec. 19, and Dec. 23, 2025 — with Travis Kelce appearing in the back half, including footage around his tuxedoed "I Can Do It With a Broken Heart" onstage cameo. It was the No. 1 series on Disney+ globally within days of the premiere, and Nielsen logged 377 million minutes watched in the pre-Christmas week alone, putting a backstage tour documentary in the same weekly top ten as scripted juggernauts.',
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
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Taylor_Swift:_The_End_of_an_Era',
            source_title: 'Taylor Swift: The End of an Era',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
        ],
        // Official poster, exact filename from the Wikipedia article's HTML;
        // verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/4/41/Taylor_Swift_-_The_End_of_an_Era_%28Official_poster%29.png',
            credit: 'Official poster / Disney+ & Taylor Swift Productions, via Wikipedia',
            caption: 'The official poster for the six-episode Disney+ docuseries.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'eras-tour-final-show-film',
      year: 2025,
      month: 12,
      day: 12,
      category: 'tour',
      title: 'The Final Show: the full Vancouver closer, streaming at last',
      snippet:
        'The complete Dec. 8, 2024 finale at BC Place — show 149 of 149 — released as a concert film on Disney+ on Dec. 12, 2025. It\'s the only filmed Eras Tour release to include the Tortured Poets set, which didn\'t exist when the 2023 theatrical cut was shot.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift:_The_End_of_an_Era',
      thumbnailUrl: null,
      moment: {
        context:
          'Paired with the End of an Era docuseries for the same-day premiere, the film preserves the tour\'s final setlist end-to-end — the version of the show that closed out the highest-grossing tour ever, a year after the last confetti fell in Vancouver. Where the 2023 theatrical film had to trim songs for runtime, the streaming cut runs the full Vancouver marathon, including the Tortured Poets segment added for the 2024 legs — the set Swift called the "Female Rage" chapter — that no prior filmed version contained.\n\nThe pairing was a deliberate double release: the docuseries tells you what the tour cost to make and end, and The Final Show is the artifact itself, shot at BC Place on Dec. 8, 2024 — show 149 of 149. Together they turned mid-December 2025 into a Disney+ event weekend, and the concert film went on to earn five Emmy nominations the following summer, including Outstanding Variety Special.',
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
        // Commons photo of BC Place dressed for the Vancouver finale;
        // license (CC BY-SA 4.0, JazzHandsIncarnate) and December 2024 date
        // verified on the file page this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Taylor_Swift_The_Eras_Tour_at_BC_Place%2C_Landscape.jpg',
            credit: 'JazzHandsIncarnate, CC BY-SA 4.0, via Wikimedia Commons',
            caption:
              'BC Place in Vancouver dressed for the Eras Tour\'s final dates, December 2024 — a giant friendship bracelet reading "TAYLOR SWIFT THE ERAS TOUR" wrapped along the stadium.',
            kind: 'archival',
          },
        ],
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
      day: 12,
      category: 'sighting',
      title: 'Back at Arrowhead with Caitlin Clark, nine days after her album dropped',
      snippet:
        'The first publicly confirmed Chiefs game she\'d attended so far this season, chatting with Caitlin Clark and Ed Kelce in the suite as Kansas City beat Detroit 30-17 on Sunday Night Football.',
      sourceUrl: 'https://www.espn.com/nfl/story/_/id/46577064/taylor-swift-caitlin-clark-sunday-night-football-chiefs-lions-travis-kelce',
      thumbnailUrl: null,
      moment: {
        context:
          'The Oct. 12 game came nine days after Swift released The Life of a Showgirl on Oct. 3. ESPN called it "the first public indication" of her attending a Chiefs game this season — she\'d also been at the Sept. 14 Eagles game, but wasn\'t photographed there. The broadcast caught her mid-celebration in the suite as Kansas City handled Detroit 30-17 in the Sunday-night window, her first on-camera Arrowhead appearance of an era in which she\'d been deliberately scarcer at games.\n\nThe company mattered as much as the sighting: Caitlin Clark, by then one of the few American athletes with a Swift-adjacent level of fame, was in the suite alongside Ed Kelce. It was the second time Clark had joined her in a suite, after the January 2025 Texans playoff game — enough of a pattern that the broadcast treated the two of them as a recurring double act, the biggest star in music watching football next to the biggest new star in basketball.',
        sources: [
          {
            outlet: 'ESPN',
            url: 'https://www.espn.com/nfl/story/_/id/46577064/taylor-swift-caitlin-clark-sunday-night-football-chiefs-lions-travis-kelce',
          },
        ],
        // Image ESPN ran with its story, hotlinked from its stable CDN copy;
        // verified HTTP 200 + image/jpeg and visually confirmed this session.
        photos: [
          {
            url: 'https://a1.espncdn.com/combiner/i?img=%2Fphoto%2F2025%2F1013%2Fr1559433_1179x663_16%2D9.jpg',
            credit: 'via ESPN',
            caption:
              'In the Arrowhead suite during the Oct. 12 Sunday Night Football win over Detroit: Swift hugs a companion in a Kelce jersey, engagement ring visible.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'black-dog-still-nobody-knows',
      year: 2025,
      month: 10,
      day: 6,
      category: 'music',
      title: "The Black Dog: 'still nobody knows' what the song's about, she says a year later",
      snippet:
        'Asked on BBC Radio 2 if she\'d tipped off the real Vauxhall pub fans decided inspired the song, she said: "I did not, and still nobody knows what I\'m even talking about on that song. They think they know, they have no idea."',
      sourceUrl: 'https://www.elitedaily.com/lifestyle/taylor-swift-the-black-dog-london-pub-review',
      thumbnailUrl: null,
      moment: {
        context:
          'The lyric describes tracking an ex whose location services were still on and watching him walk "into some bar called The Black Dog," which turned a real Vauxhall, London gastropub into a fan pilgrimage site, complete with lyric-quoting window signage and a "Taylor\'s Version" cocktail list. A year and a half on, the pub was still trading on the association — and fans were still treating the TTPD deep cut as an unsolved case.\n\nSpeaking to BBC Radio 2\'s Scott Mills during her Life of a Showgirl press run in October 2025, Swift finally addressed it — by un-solving it further. She said she never tipped off the pub, and went out of her way to note that the internet\'s confident consensus is wrong: "still nobody knows what I\'m even talking about on that song. They think they know, they have no idea." It was a rare on-record reminder, delivered mid-victory-lap for a new album, that some of the catalog\'s most-theorized songs remain deliberately unexplained.',
        sources: [
          {
            outlet: 'Elite Daily',
            url: 'https://www.elitedaily.com/lifestyle/taylor-swift-the-black-dog-london-pub-review',
          },
        ],
        // Commons photo of the actual pub; license (CC BY-SA 2.0, Chris
        // Whippet / geograph.org.uk) verified on the file page this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/The_Black_Dog%2C_Vauxhall_-_geograph.org.uk_-_4576579.jpg',
            credit: 'Chris Whippet / geograph.org.uk, CC BY-SA 2.0, via Wikimedia Commons',
            caption:
              'The Black Dog in Vauxhall, London — the real gastropub fans decided the song is about, photographed in 2015, years before it became a pilgrimage site.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'watch-hill-bachelorette-weekend',
      year: 2026,
      month: 6,
      day: 19,
      category: 'sighting',
      title: 'A tented lawn in Rhode Island, two weeks before the wedding',
      snippet:
        'Security tightened around her Watch Hill estate as a large tent went up on the Ocean House lawn next door and friends including Abigail Anderson were spotted arriving for what looked like a bachelorette weekend.',
      sourceUrl: 'https://www.tmz.com/2026/06/19/taylor-swift-bachelorette-party-rumors/',
      // Image-fix pass (2026-07-10): swapped the watermarked TMZ collage
      // thumbnail for the verified AP tent/Ocean House photo below (see
      // photos[0]) — same fix as ticket #337.
      thumbnailUrl: 'https://fortune.com/img-assets/wp-content/uploads/2026/06/AP26171861867196-e1782051050489.jpg?format=webp&w=1440&q=100',
      moment: {
        context:
          'TMZ reported the gathering the weekend of June 19-20, 2026 as a "bachelorette-style gathering centered around Taylor and her closest girlfriends" — separate from the Ocean House\'s own scheduled event that weekend, which the venue confirmed was for a different couple. The tells were logistical rather than official: extra security around the Watch Hill estate, a large tent rising on the lawn next door, and longtime friends — Abigail Anderson among the arrivals fans identified — converging on the small Rhode Island town at once.\n\nThe location was its own callback. Watch Hill is the "holiday house" of the 2020 song "the last great american dynasty" — the Rebekah Harkness mansion Swift bought in 2013, the site of the Fourth of July parties of the 1989 era — so a pre-wedding weekend there read to fans as the personal-lore equivalent of a hometown send-off, two weeks before the Madison Square Garden ceremony. Neither Swift nor her team ever confirmed the party; the venue-level reporting here is TMZ\'s, labeled as such.',
        sources: [
          { outlet: 'TMZ', url: 'https://www.tmz.com/2026/06/19/taylor-swift-bachelorette-party-rumors/' },
        ],
        // Image-fix pass (2026-07-10): both TMZ photos here (tickets #337,
        // #338) were junk news-graphics — a watermarked collage with a
        // celebrity inset, and a watermarked long-lens shot with a blurred
        // face. Replaced with two AP Photo/Robert F. Bukaty images (June 20,
        // 2026, Westerly RI) sourced via Fortune and The Washington Times'
        // wire copy: the Ocean House lawn tent, and a security guard at
        // Swift's Watch Hill estate. Both curl-verified HTTP 200 +
        // image/jpeg and visually confirmed this session — clean, unwatermarked,
        // single photos matching the moment's context (the tent, and the
        // tightened estate security).
        photos: [
          {
            url: 'https://fortune.com/img-assets/wp-content/uploads/2026/06/AP26171861867196-e1782051050489.jpg?format=webp&w=1440&q=100',
            credit: 'AP Photo/Robert F. Bukaty, via Fortune',
            caption:
              'A couple walks past the Ocean House and the event tent on its lawn in Watch Hill, June 20, 2026 — the tent that fueled bachelorette-weekend speculation.',
            kind: 'primary',
          },
          {
            url: 'https://twt-thumbs.washtimes.com/media/image/2026/06/21/Swift_Wedding_Speculation_6953__c0-242-5784-3614_s885x516.jpg?18921fe33b20ba0427c28b6eeae09fd9ded1b3cc',
            credit: 'AP Photo/Robert F. Bukaty, via The Washington Times',
            caption: 'A security guard stands watch at Swift\'s Watch Hill "Holiday House" estate, June 20, 2026.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'msg-wedding',
      year: 2026,
      month: 7,
      day: 3,
      category: 'relationship',
      title: 'Taylor and Travis marry at Madison Square Garden',
      snippet:
        'A wedding officiated by their friend Adam Sandler — no bridesmaids or groomsmen, just Austin Swift as her Man of Honor and Jason Kelce as his best man. Roughly 1,000 guests, and a jumbotron outside the arena reading "JUST&T MARRIED!"',
      sourceUrl: 'https://www.cbsnews.com/news/taylor-swift-travis-kelce-wedding-day-madison-square-garden-nyc/',
      thumbnailUrl:
        'https://assets1.cbsnewsstatic.com/hub/i/r/2026/07/04/dcbf1e43-644d-45c1-9fd7-712be991cd59/thumbnail/620x403/8012c5092c88e86e560c7d3b3cb2ca54/gettyimages-2283939355.jpg',
      moment: {
        context:
          'The venue was the punchline and the point: after months of "destination wedding" speculation, the destination turned out to be Madison Square Garden — a 20,000-seat arena dressed for a wedding, with curtains hung across the glass entrance in the days before and a jumbotron outside reading "JUST&T MARRIED!" once it was done. Adam Sandler officiated and sang an original song for the couple at the ceremony. There were no bridesmaids or groomsmen: Austin Swift stood as his sister\'s Man of Honor, Jason Kelce as best man.\n\nBoth bride and groom wore custom Christian Dior Haute Couture, and Stevie Nicks — the elder-showgirl touchstone of Swift\'s own catalog — performed at the reception. The guest list, roughly 1,000 people, ran the full width of their two worlds: Hugh Grant, Jason Sudeikis, Ethan Hawke, Abby Wambach, Joe Buck, Benson Boone, Cooper Kupp, and Paulina Gretzky among them, per CBS News\'s reporting. What did not surface was the interior: no official photos of the ceremony or reception had been released as of the days after, leaving the arrivals, the curtained Garden, and the jumbotron as the event\'s entire public visual record.',
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
          // 2026-07-09, relaxed image policy: the wire photos below (same CBS News
          // gallery as the two above) are now hotlinked with credit. Each URL
          // verified HTTP 200 + image/jpeg this session. All are real press photos
          // of the actual event; no AI imagery.
          {
            url: 'https://assets2.cbsnewsstatic.com/hub/i/r/2026/07/03/0bb2c01d-717b-42d9-a2b4-08fd18f021e3/thumbnail/620x414/162fb69de698cd4a021ab5e0e34a638a/gettyimages-2284537214.jpg',
            credit: 'Roy Rochlin/Getty Images, via CBS News',
            caption:
              'Guest arrivals: Hugh Grant and Anna Elisabet Eberstein arrive at Madison Square Garden on July 2, 2026, as the multi-day celebration begins.',
            kind: 'primary',
          },
          {
            url: 'https://assets1.cbsnewsstatic.com/hub/i/r/2026/07/03/46f18357-e274-4e86-a5ac-b173d9b01219/thumbnail/620x414/aff0da6d159019e0ce14046348347c7b/gettyimages-2284532594.jpg',
            credit: 'Roy Rochlin/Getty Images, via CBS News',
            caption:
              'Abby Wambach and Glennon Doyle arrive at Madison Square Garden for the wedding on July 3, 2026.',
            kind: 'primary',
          },
          {
            url: 'https://assets2.cbsnewsstatic.com/hub/i/r/2026/07/03/5ba6ed3b-0728-43a7-a105-2fdc2beb7097/thumbnail/620x414/ca2a0b800b41ca793cc0db76270c7ef5/gettyimages-2283912122.jpg',
            credit: 'Angela Weiss/AFP via Getty Images, via CBS News',
            caption:
              'The scene outside: members of the media gather at Madison Square Garden on the wedding day, July 3, 2026.',
            kind: 'archival',
          },
          {
            url: 'https://assets1.cbsnewsstatic.com/hub/i/r/2026/07/03/661a9e69-70e1-4a8c-88bc-e84d2bc985c0/thumbnail/620x414/82c6463f5b68d14f30b1660eb692a0d5/gettyimages-2283918271.jpg',
            credit: 'Tom Weller/picture alliance via Getty Images, via CBS News',
            caption:
              'Onlookers wait behind barriers outside Madison Square Garden ahead of the ceremony on July 3, 2026.',
            kind: 'archival',
          },
          // Still none of the ceremony/reception interior: no official or wire
          // photos from inside the ceremony/reception could be found and verified
          // as of 2026-07-09 — only exterior/arrival wire imagery exists to add.
        ],
      },
    },
    {
      slug: 'wedding-gown-dior-anderson',
      year: 2026,
      month: 7,
      day: 3,
      category: 'fashion',
      title: 'The wedding gown: a custom Dior Haute Couture, styled by Joseph Cassell',
      snippet:
        "Jonathan Anderson's first celebrity couture bridal commission at Dior — a custom gown reportedly drawing on Elizabeth Taylor's 1950 wedding dress, worn with custom Christian Louboutin shoes and Cartier jewelry.",
      sourceUrl: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-wedding-dress-dior-jonathan-anderson-2-1236637523/',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift, Travis and longtime stylist Joseph Cassell worked directly with Anderson and the Dior ateliers on Avenue Montaigne on an entirely custom design rather than a runway adaptation. No official photo of the gown had been released as of the day after the wedding, and several AI-generated fakes were circulating online — none of those are used here; the gallery instead shows clearly-labeled reference images of the real things the design reportedly draws on.\n\nThe commission caps a whirlwind first year for Anderson at Dior: named creative director of womenswear and haute couture on June 2, 2025 — on top of Dior Men — he became the first designer since Christian Dior himself to lead all three lines, succeeding Maria Grazia Chiuri after his acclaimed run at Loewe. The reported touchstone is Elizabeth Taylor\'s gown for her May 6, 1950 wedding to Conrad "Nicky" Hilton: designed by MGM costume designer Helen Rose and gifted to Elizabeth by the studio, which turned the wedding into a publicity event for Father of the Bride — the film in which Rose also dressed the 18-year-old Elizabeth as a bride, in the lace-and-veil look shown in the reference image here.\n\nThe Elizabeth Taylor reference completes a circle the album drew first: track two of The Life of a Showgirl is literally named for her, and the wedding gown reportedly borrows from the most famous bridal moment of her early stardom. Per The Hollywood Reporter and Marie Claire, the finishing pieces were custom Christian Louboutin shoes and Cartier jewelry.',
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
        // Re-checked 2026-07-09 under the relaxed image policy (T16 re-pass):
        // still no published photo of the actual gown — WWD/Stylecaster confirm
        // official wedding photos remain unreleased, and circulating "gown" images
        // are AI fakes, which stay refused. The honest reference-only framing
        // stands unchanged; add a real `primary` if/when one is published.
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
      month: 10,
      day: 2,
      category: 'fashion',
      title: 'A jeweled David Koma LBD opens the press run on Graham Norton',
      snippet:
        'A little black dress lined with Midnights-coded jewels around the neckline — her first stop on the promo circuit for the album, before Fallon and Seth Meyers followed.',
      sourceUrl: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-the-life-of-a-showgirl-style/',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift kicked off her Life of a Showgirl press run in London on The Graham Norton Show wearing a David Koma design — a black velvet mini with a crystal-embroidered halter neckline that read as a choker of jewels on camera. Marie Claire\'s close-read of the look noted it was surprisingly understated for a showgirl-era debut, letting the accessories carry the theme: drop earrings, the signature red lip, and the Artifex Fine engagement ring, on its first talk-show outing since the August proposal.\n\nThe Oct. 2 taping opened a compact, TV-first promo cycle rather than a full magazine-cover blitz: London first, then The Tonight Show Starring Jimmy Fallon and Late Night with Seth Meyers plus radio stops. The dress set the press-run template — one designer statement per couch, jewels doing the showgirl signaling — that ran through the rest of release week.',
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
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-graham-norton-show-interview-dress/',
            source_title: "Taylor Swift's Graham Norton Show Interview Dress, Up Close",
            publisher: 'Marie Claire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // Photo of the actual appearance, hotlinked from Marie Claire's
        // credited copy (credit: Alamy). Verified HTTP 200 + image/jpeg and
        // visually confirmed (Graham Norton set, crystal halter neckline).
        photos: [
          {
            url: 'https://cdn.mos.cms.futurecdn.net/PJsDTgPm4oKabghVVGKLNM-1920-80.jpg',
            credit: 'Alamy, via Marie Claire',
            caption:
              'On the Graham Norton Show set, Oct. 2, 2025: the crystal-embroidered neckline of the David Koma LBD that opened the Showgirl press run.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'showgirl-orange-reformation-versace',
      year: 2025,
      month: 9,
      day: 20,
      category: 'fashion',
      title: 'The first "Showgirl orange" look: Reformation cashmere and a Versace leather mini',
      snippet:
        'Explaining the album\'s packaging and orange-and-mint color scheme on Sept. 20, she wore a pumpkin-hued Reformation cashmere sweater over a Versace leather mini skirt — the outfit that made "Showgirl orange" a fashion story before the record even dropped.',
      sourceUrl: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-showgirl-orange-reformation-cashmere-versace-leather-mini-skirt/',
      thumbnailUrl: null,
      moment: {
        context:
          'The look accompanied a behind-the-scenes video about the record\'s visual identity — posted by Taylor Nation on Sept. 20, with Swift talking through the album\'s orange-and-mint packaging on camera in front of set art from the era\'s shoots. Fans clocked the outfit as the messaging: the album wasn\'t out for two more weeks, and she was already dressed in its color.\n\nThe styling formula was classic Swift promo-craft, pairing a sold-out Reformation cashmere crew in Showgirl orange with a high-end Versace leather mini, while a roughly $70 sparkly pumpkin cardigan on her merch store offered fans a budget-friendly version of the color — deliberately mixing accessible and designer pieces the way she had for past eras\' drops, so the look could be copied at two price points. Marie Claire\'s coverage marked it as the moment "Showgirl orange" became a fashion story in its own right, ahead of the record itself.',
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
        // Still from the Taylor Nation video, hotlinked from Marie Claire's
        // credited copy (credit: Instagram/@taylornation). Verified HTTP 200
        // + image/jpeg and visually confirmed (orange knit, on camera).
        photos: [
          {
            url: 'https://cdn.mos.cms.futurecdn.net/izGR5GyrdGtkDeTMsNFvAN-1920-80.jpg',
            credit: 'Instagram/@taylornation, via Marie Claire',
            caption:
              'From the Sept. 20 behind-the-scenes video: Swift in the pumpkin-orange Reformation knit, explaining the album\'s visual identity on camera.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'showgirl-selena-gomez-texans-coats',
      year: 2025,
      month: 12,
      day: 7,
      category: 'fashion',
      title: 'Taylor and Selena Gomez coordinate opulent winter coats at Arrowhead',
      snippet:
        'A Miu Miu checkered bomber for Taylor, all-black shearling-trimmed for Selena — the two friends layered up for Gomez\'s first-ever Chiefs game, a Dec. 7 loss to the Texans.',
      sourceUrl: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-selena-gomez-kansas-city-chiefs-houston-texans-game-winter-coats/',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift\'s oversize checkered Miu Miu bomber (originally $4,600) and Gomez\'s fitted shearling-trimmed coat drew as much coverage as the game itself, which the Chiefs lost 20-10 — the loss that helped seal the franchise\'s first missed playoffs of the Kelce-Swift era. E! Online and Marie Claire both noted it was Gomez\'s first time attending a Chiefs game with Swift, a milestone in its own right for a friendship fans have tracked since 2008.\n\nThe pairing carried extra 2025 subtext: it was a wedding-season friendship on both sides — Gomez had married Benny Blanco that September, and Swift\'s own wedding was seven months out — and the coordinated-winter-coats suite appearance became an instant fan-edit staple, the two most-followed women of their pop generation doing normal-best-friend things at a football game. Marie Claire\'s fashion desk treated the coats as a two-hander: Swift\'s loud checkerboard against Gomez\'s all-black, opulence in two registers.',
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
        // No hotlinkable agency photo of the Dec. 7 suite look was found this
        // session (the cited articles lead with older Getty imagery), so the
        // gallery uses an honest archival photo of the actual friendship,
        // clearly dated in the caption. Verified HTTP 200 + image/jpeg and
        // visually confirmed.
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/202502/rs_1200x1200-250102084057-Selena-Gomez-Taylor-Swift.jpg',
            credit: 'via E! Online',
            caption:
              'Archival: Swift and Gomez at the January 2024 Golden Globes — the image E! ran with its coverage of Gomez\'s first Chiefs game in the Arrowhead suite. No agency photo of the Dec. 7 coats look was available to hotlink.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'showgirl-emmy-nomination-eras-final-show',
      year: 2026,
      month: 7,
      day: 9,
      category: 'business',
      title: 'The Eras Tour: The Final Show earns five Emmy nominations',
      snippet:
        'Her first Primetime Emmy nod in over a decade: five nominations for the Disney+ concert film, including Outstanding Variety Special, for a nearly 3.5-hour cut of the tour\'s Vancouver finale with the full Tortured Poets set added.',
      sourceUrl: 'https://www.hollywoodreporter.com/tv/tv-news/taylor-swift-2026-emmy-nominations-1236641549/',
      thumbnailUrl: null,
      moment: {
        context:
          'The 2026 nominations covered Outstanding Variety Special (Prerecorded), directing for Glenn Weiss, picture editing, sound mixing, and technical direction/camerawork. Produced by Taylor Swift Productions with Silent House Productions, the film captured the 45-song Vancouver finale in full, including the TTPD segment Swift has called the "Female Rage" set — material no prior filmed version of the show contained. As a named producer on the Variety Special nomination, Swift herself is a nominee.\n\nIt was her first Primetime Emmy recognition in over a decade, and it recast the tour\'s afterlife: a stadium show that had already broken box-office and grossing records was now competing in television\'s categories too, against purpose-built comedy and variety specials. The 78th Emmy Awards air Sept. 14, 2026 on NBC and Peacock.',
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
        // Commons concert photo of the actual tour (license CC BY 2.0,
        // Paolo V, verified via the Commons API this session); dated in the
        // caption so it isn't mistaken for the Vancouver finale itself.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Taylor_Swift_The_Eras_Tour_Lover_Set_%2853108817342%29.jpg',
            credit: 'Paolo V, CC BY 2.0, via Wikimedia Commons',
            caption:
              'The Eras Tour\'s Lover set at SoFi Stadium, August 2023 — the show whose filmed Vancouver finale earned the five nominations.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'showgirl-grammy-eligibility-window-miss',
      year: 2025,
      month: 10,
      day: 3,
      category: 'business',
      title: 'A release date that costs a Grammy shot: Showgirl misses the 2026 eligibility window by 34 days',
      snippet:
        'The Recording Academy\'s 2026 eligibility period closed Aug. 30, 2025 — five weeks before Showgirl came out on Oct. 3. The record-shattering album ended up with zero 2026 Grammy nominations, eligible instead for the 2027 ceremony.',
      sourceUrl: 'https://www.aol.com/articles/why-taylor-swift-doesn-t-144826491.html',
      thumbnailUrl: null,
      moment: {
        context:
          'Outlets including E! Online and AOL confirmed the snub was purely a calendar issue, not a reception one: the 2026 Grammy eligibility window ran Aug. 31, 2024 through Aug. 30, 2025, and Showgirl\'s Oct. 3 release fell just outside it — by 34 days. The commercially biggest album of 2025 was therefore invisible at the ceremony honoring 2025\'s music, an outcome baked in the moment the release date was chosen.\n\nThe trade-off cut the other way, too: the date that cost her the 2026 ceremony banked the album for the 2027 one, where it will compete as a year-old blockbuster with a full chart history behind it. Swift already holds 14 Grammys, including a record four Album of the Year wins, so the stakes are less about validation than record-keeping — a fifth AOTY would extend a record no one else has matched at four.',
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
        // Generic Grammy-statuette photo, clearly labeled as reference —
        // there is no event photo for a nomination that didn't happen.
        // License (CC BY 2.0) verified via the Commons API this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/Grammy_Award_trophies_-_Kenny_Rogers_%22The_Gambler%22_%28cropped%29.jpg',
            credit: 'Photo by "Thank You (23 Millions+) views", CC BY 2.0, via Wikimedia Commons',
            caption:
              'For reference — Grammy statuettes on display (these are Kenny Rogers\'s, at the Country Music Hall of Fame). The 2026 window Showgirl missed closed Aug. 30, 2025.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      slug: 'showgirl-broncos-christmas-game',
      year: 2025,
      month: 12,
      day: 25,
      category: 'sighting',
      title: 'A Christmas Day game at Arrowhead, arriving with her parents',
      snippet:
        'Swift showed up nearly an hour into the Dec. 25 Chiefs-Broncos game with her parents, in a red Frankie Shop bomber and her Artifex Fine engagement ring, for what was expected to be Travis Kelce\'s final home game as the Chiefs missed the playoffs.',
      sourceUrl: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-kansas-city-chiefs-denver-broncos-christmas-game-outfit/',
      thumbnailUrl: null,
      moment: {
        context:
          'Styled by Joseph Cassell Falconer in a red Frankie Shop bomber jacket, black mini skirt, tights, knee-high boots, and a Louis Vuitton bag, Swift arrived with her parents after the 8:15 p.m. kickoff — nearly an hour into a Christmas Day game the NFL had handed to Amazon Prime, whose cameras caught her in the concourse on the way up to the suite. The red-on-red palette read as both Chiefs colors and Christmas at once.\n\nMarie Claire noted the game\'s added weight: with the Chiefs missing the playoffs for the first time since 2014, the Broncos game was expected to be Kelce\'s final appearance at Arrowhead that season, which made her family-in-tow attendance read as more than a holiday outing — a send-off to the season that had bracketed their engagement year. The Artifex Fine engagement ring, by then a fixture of every game-day sighting, rounded out the look.',
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
        // Image-fix pass (2026-07-10 retry, ticket #339): first pass
        // rejected Marie Claire's futurecdn frame (moire'd screenshot-of-a-
        // screen with a "CHIEFS KINGDOM" lower-third and NFL|prime bug) and
        // found no replacement. Broadened the search this pass: checked
        // Getty's own site search (zero results for this event — wire
        // photogs evidently didn't have access; Prime's broadcast cameras
        // caught this moment, not press photographers), Marie Claire's full
        // gallery (its only other candidate, alt-tagged "Taylor Swift in the
        // stands... football game," is undated/generic — rejected, same as
        // last pass), a Yahoo/Page Six listicle whose two "Getty Images"-
        // credited photos both downloaded and visually turned out to be
        // recycled 2024/2025 AFC-Championship-celebration shots (wrong
        // outfit, wrong game — rejected after opening them), and a Just
        // Jared pre-game speculation post whose thumbnail is Swift in a
        // Chiefs crewneck, not the bomber (wrong outfit — rejected). Found
        // one candidate that verifies clean: Taylor Swift Style's own
        // Dec. 25 2025 gallery page runs a tighter, un-moired crop of the
        // same NFL/Amazon Prime broadcast footage (no lower-third, no
        // NFL|prime bug, no scan-line artifacts) — downloaded and visually
        // confirmed the red Frankie Shop bomber, dark Louis Vuitton bag, and
        // engagement ring, matching the caption exactly. Verified HTTP 200 +
        // image/webp via curl. Site itself is a long-running, press-cited
        // fashion-ID archive (not a wire service), so kept the credit
        // traceable to the underlying broadcast source it names.
        photos: [
          {
            url: 'https://images.squarespace-cdn.com/content/v1/6616cae0172b170a8dd0818d/30ea9668-3908-4972-a828-f97ff5fdbcf4/1225+Taylor+Swift+Chiefs+vs+Broncos+Feature.png',
            credit: 'NFL via Amazon Prime broadcast, via Taylor Swift Style',
            caption:
              'From the Prime broadcast of the Christmas Day game: Swift in the red Frankie Shop bomber, Louis Vuitton bag on her arm and engagement ring visible.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'showgirl-engagement-announcement',
      year: 2025,
      month: 8,
      day: 26,
      category: 'relationship',
      title: '"Your English teacher and your gym teacher are getting married": the engagement, announced on Instagram',
      snippet:
        'Two weeks after the New Heights album reveal, Taylor and Travis announced their engagement in a joint Instagram post — a garden proposal, an Old Mine Cut diamond in yellow gold, and a caption that became the year\'s most-repeated line.',
      sourceUrl: 'https://abcnews.com/GMA/Culture/taylor-swift-travis-kelce-relationship-timeline/story?id=118197742',
      thumbnailUrl:
        'https://i.abcnewsfe.com/a/ecc533d0-9f9d-4f6f-b167-e4d2e20ce469/swift-kelce-engagement-ht-jef-250826_1756229211049_hpMain.jpg',
      moment: {
        context:
          'The couple made it official themselves on Aug. 26, 2025 — two weeks after Swift used Kelce\'s New Heights podcast to reveal The Life of a Showgirl — in a single joint Instagram post rather than a statement to any outlet. The carousel ran five photos from a flower-filled garden proposal, one a close-up of the ring, under Swift\'s caption: "Your English teacher and your gym teacher are getting married 🧨" — a line that became one of the year\'s most-repeated. The photos show the scale of the staging: a floral arch and urns overflowing with pink-and-white blooms deep in a wooded garden, Kelce in navy and Swift in a striped summer dress.\n\nThe ring, shown in close-up in the post, is an Old Mine Cut brilliant diamond — an elongated cushion-cut stone widely estimated at 7 to 10 carats, set in warm yellow gold — designed by Kelce together with Kindred Lubeck, the goldsmith, hand engraver and vintage-jewelry collector behind New York\'s Artifex Fine Jewelry; Lubeck was later invited to the couple\'s wedding. The post itself is the primary document of the moment, cited below, and the caption\'s teacher framing became era canon — quoted back at the couple everywhere from morning shows to the wedding\'s own coverage ten months later.',
        // 2026-07-09, relaxed image policy: the gallery now hotlinks the couple's
        // own official post imagery via ABC News' stable copies (i.abcnewsfe.com),
        // credited "@taylorswift/Instagram" as ABC credits them. Instagram's own
        // CDN URLs are signed/ephemeral and were skipped on purpose. Each URL
        // verified HTTP 200 + image/jpeg this session. Supersedes the old
        // no-embed note; the IG permalink stays cited as the primary source.
        sources: [
          {
            outlet: 'Instagram (@taylorswift, official joint post)',
            url: 'https://www.instagram.com/p/DN02niAXMM-/',
            source_title: 'Taylor Swift & Travis Kelce engagement announcement (joint post)',
            publisher: 'Instagram',
            source_type: 'social',
            accessed_at: '2026-07-09',
            reliability_score: 5,
          },
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
        photos: [
          {
            url: 'https://i.abcnewsfe.com/a/ecc533d0-9f9d-4f6f-b167-e4d2e20ce469/swift-kelce-engagement-ht-jef-250826_1756229211049_hpMain.jpg',
            credit: 'via @taylorswift/Instagram (ABC News)',
            caption:
              'The proposal, from the couple\'s official announcement post: Kelce and Swift beneath a flower-covered arch in the garden, ringed by urns of pink-and-white blooms.',
            kind: 'primary',
          },
          {
            url: 'https://i.abcnewsfe.com/a/a0e8236a-f7e0-4462-8139-eedaae95e5f0/swift-kelce-engagement-04-ht-jef-250826_1756229507890_hpMain.jpg',
            credit: 'via @taylorswift/Instagram (ABC News)',
            caption:
              'From the same carousel: the couple embrace among the garden flowers, the new ring visible on Swift\'s hand.',
            kind: 'primary',
          },
          {
            url: 'https://i.abcnewsfe.com/a/55d1f976-92b1-44e8-a423-ea8344309260/swift-kelce-engagement-05-ht-jef-250826_1756229507889_hpMain.jpg',
            credit: 'via @taylorswift/Instagram (ABC News)',
            caption:
              'The ring close-up from the carousel: the Old Mine Cut brilliant diamond in yellow gold, designed by Travis Kelce with Kindred Lubeck of Artifex Fine Jewelry.',
            kind: 'primary',
          },
        ],
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
      day: 3,
      category: 'music',
      title: 'Elizabeth Taylor: the first song she wrote for the album',
      snippet:
        'Two showgirls, one lyric: White Diamonds, violet eyes, and "you\'re only as hot as your last hit" — her fame anxiety filtered through the star whose love life the press devoured first. It debuted at No. 3.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Elizabeth_Taylor_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Track two draws the parallel explicitly — the Plaza Athénée, Portofino, "I would trade the Cartier for someone to trust" — two famous women whose romances became public property. Time and Rolling Stone both read it as the album\'s thesis statement: the showgirl persona as armor, borrowed from the woman who wore it best. The specificity is the trick — White Diamonds (the Taylor fragrance empire), the violet eyes, "you\'re only as hot as your last hit" — Swift writing her own fame anxiety in another woman\'s biography, the way "the last great american dynasty" once used Rebekah Harkness.\n\nIt was the first Showgirl song written, which makes it the era\'s seed: the Elizabeth Taylor fixation came before the album had a title, and it kept paying off — the song debuted at No. 3 on the Hot 100 behind "The Fate of Ophelia" and "Opalite," got an archival-footage music video the following March, and, per SheKnows\' wedding coverage tracing to Daily Mail reporting, reportedly echoed into the Dior wedding gown modeled on Elizabeth Taylor\'s 1950 bridal look.',
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
          {
            outlet: 'SheKnows',
            url: 'https://www.sheknows.com/entertainment/articles/1235032198/taylor-swift-wedding-look-elizabeth-taylor/',
            source_title: "Taylor Swift's Wedding Look Was Elizabeth Taylor-Coded",
            publisher: 'SheKnows',
            source_type: 'reputable_press',
            accessed_at: '2026-07-10',
            reliability_score: 3,
          },
        ],
        // Public-domain MGM publicity still of the song's namesake; license
        // and provenance verified via the Commons API this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Elizabeth_Taylor%2C_late_1950s.jpg',
            credit: 'MGM publicity still, public domain, via Wikimedia Commons',
            caption:
              'The real Elizabeth Taylor in an MGM publicity photo from the late 1950s — the violet-eyed star whose public life the song borrows as a mirror.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'fate-of-ophelia-video-wardrobe',
      year: 2025,
      month: 10,
      day: 3,
      category: 'fashion',
      title: 'The Ophelia video wardrobe: Versace crystals, Cavalli chainmail, custom Ferretti',
      snippet:
        'Every era of showgirl in one self-directed video — a flowing white Alberta Ferretti gown into a red crystal Versace bodysuit with matching gloves, a black chainmail Cavalli fringe dress, and a rhinestone Kelsey Randall mini.',
      sourceUrl: 'https://www.femestella.com/the-fate-of-ophelia-music-video-every-outfit-taylor-swift-wears/',
      thumbnailUrl: null,
      moment: {
        context:
          'The costume parade tracks the video\'s conceit — Swift as a showgirl across different stage-history periods, from the drowned-Ophelia opening to full vaudeville. The itemized wardrobe reads like a century of stagewear: a flowing white Alberta Ferretti gown for the painting-come-to-life opening, a red crystal Versace bodysuit with matching gloves, a black chainmail Roberto Cavalli fringe dress, and a rhinestone Kelsey Randall mini, with Swift directing herself through every quick-change.\n\nThe synchronized-swim sequence — Swift in a mint sequined swim cap and costume among dancers with life rings, shown in the image here — staged the album cover\'s water imagery at Busby Berkeley scale. The costumes had an afterlife, too: the long-beaded gown and the swimming costume left the closet entirely, going on display at the Rock & Roll Hall of Fame the following June as part of its Legends of Rock exhibit.',
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
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-the-life-of-a-showgirl-style/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' Album Style, Explained",
            publisher: 'Marie Claire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // On-set still from the video, hotlinked from Marie Claire's
        // credited copy (credit: TAS Rights Management). Verified HTTP 200 +
        // image/jpeg and visually confirmed (the swim-costume sequence).
        photos: [
          {
            url: 'https://cdn.mos.cms.futurecdn.net/mRuaC9xbvVQHQFewM7GoGY.jpg',
            credit: 'TAS Rights Management, via Marie Claire',
            caption:
              'On the set of the self-directed video: Swift in the mint sequined swimming costume — one of the pieces later displayed at the Rock & Roll Hall of Fame — amid the synchronized-swim ensemble.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'showgirl-graham-norton-destination-wedding',
      year: 2025,
      month: 10,
      day: 2,
      category: 'relationship',
      title: 'Wedding plans, teased from a British chat-show couch',
      snippet:
        'On Graham Norton during release week, she called the wedding "huge," said planning would start once album promotion wrapped, and ruled out trimming the guest list — the most concrete planning detail she\'d offered herself since the garden proposal in August.',
      sourceUrl: 'https://www.hellomagazine.com/us/911732/travis-kelce-finally-confirms-long-awaited-taylor-swift-news-after-wedding/',
      thumbnailUrl: null,
      moment: {
        context:
          'The tease came from the same Oct. 2 Graham Norton taping that opened the press run — the David Koma appearance — when the host pried gently at wedding plans and got the era\'s first concrete detail from Taylor herself: she called the wedding "huge," said planning wouldn\'t start until after album promotion wrapped, and said she wasn\'t about to trim the guest list — small weddings, she said, are the stressful ones. It set off months of location speculation that neither of them fed further.\n\nThe eventual Madison Square Garden ceremony in July 2026 made all that speculation moot — the venue was a subway ride for half the guest list. In a September New Heights episode, guest Jimmy Fallon had pulled the only other planning tidbit either of them ever gave: "we\'re live music kind of people," per Travis — which, in hindsight, was the whole answer. They got married in a concert venue.',
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
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/1423387/taylor-swift-on-graham-norton-travis-kelce-wedding-plans',
            source_title: 'Taylor Swift on Graham Norton, Travis Kelce Wedding Plans',
            publisher: 'E! Online',
            source_type: 'reputable_press',
            accessed_at: '2026-07-10',
            reliability_score: 4,
          },
          {
            outlet: 'NBC Insider',
            url: 'https://www.nbc.com/nbc-insider/jimmy-fallon-new-heights-travis-kelce-wedding-planning-taylor-swift',
            source_title: 'Jimmy Fallon Asks Travis Kelce About Wedding Planning With Taylor Swift on New Heights',
            publisher: 'NBC Insider',
            source_type: 'reputable_press',
            accessed_at: '2026-07-10',
            reliability_score: 4,
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
        // Photo from the same Oct. 2 Graham Norton taping where the tease
        // happened (Alamy, via Marie Claire's coverage of the appearance).
        photos: [
          {
            url: 'https://cdn.mos.cms.futurecdn.net/PJsDTgPm4oKabghVVGKLNM-1920-80.jpg',
            credit: 'Alamy, via Marie Claire',
            caption:
              'On the Graham Norton Show couch, Oct. 2, 2025 — the appearance where she called the wedding "huge" and ruled out a small guest list.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'showgirl-colts-game-sighting',
      year: 2025,
      month: 11,
      day: 23,
      category: 'sighting',
      title: 'Back in the suite window for an overtime nail-biter',
      snippet:
        'After weeks of slipping into Arrowhead unphotographed, she was visible celebrating the Colts game from the suite — playfully shaking her dad by the shoulders as Butker\'s kick won it 23-20 in OT.',
      sourceUrl: 'https://www.tmz.com/2025/11/23/taylor-swift-watches-travis-kelce-win-nailbiter-kansas-city/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Nov. 23, 2025 game was her most visible Arrowhead appearance in weeks — E! noted she\'d been keeping a deliberately low profile at games through the fall, attending without being shown on broadcasts. This time the suite window gave her away: fans in the stands filmed her reaction as Harrison Butker\'s overtime kick beat the Colts 23-20, TMZ describing her screaming and jumping, and E! reporting she was seen playfully shaking her father Scott by the shoulders in celebration.\n\nThe sighting marked the practical end of the invisible-fan experiment: with the Chiefs\' playoff hopes fading, the remaining home slate was short — the Christmas Broncos game a month later was expected to be Kelce\'s last at home that season — and her appearances got more visible, not less, as the season wound down. The low-profile stretch itself became part of the era\'s story: the most-photographed woman in the NFL\'s orbit spending most of a season successfully unphotographed.',
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
        // No agency photo of the Nov. 23 suite moment was hotlinkable (the
        // moment was captured on fan video); the gallery uses the Getty
        // image Marie Claire ran to illustrate her low-profile fall at
        // Chiefs games, captioned as such. Verified HTTP 200 + image/jpeg
        // and visually confirmed.
        photos: [
          {
            url: 'https://cdn.mos.cms.futurecdn.net/h3Tpzz7eTbWA33VN2tjfMQ.jpg',
            credit: 'Getty Images, via Marie Claire',
            caption:
              'Archival: Swift in the Arrowhead crowd — the Getty image Marie Claire used to illustrate her deliberately low-profile 2025 season at Chiefs games; the Nov. 23 overtime celebration itself was caught only on fan video.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'showgirl-colts-game-outfit',
      year: 2025,
      month: 11,
      day: 23,
      category: 'fashion',
      title: 'A low-key game-day layer for the Colts game',
      snippet:
        'No statement piece this time — a beige, red, and white color-blocked jacket and the signature red lip, dressed for the suite rather than the cameras.',
      sourceUrl: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-kansas-city-chiefs-indianapolis-colts-game-outfit/',
      thumbnailUrl: null,
      moment: {
        context:
          'Marie Claire filed the Nov. 23, 2025 look under "fit for a low-key fan": a beige, red, and white color-blocked jacket, the ever-present red lip, and nothing engineered for a jumbotron close-up. It was game-day dressing for someone planning to watch the game rather than be broadcast during it — which, that fall, was exactly the plan.\n\nThe restraint was the story. Her game-day looks had spent two seasons as a fashion beat of their own — dissected, price-tagged, sold out by Monday — and the fall 2025 stretch of quiet fits during her lowest-profile season at Arrowhead read as deliberate de-escalation. The contrast made the exceptions (the Miu Miu checkerboard bomber with Gomez, the Christmas-red Frankie Shop look a month later) land harder when they came.',
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
        // Same honest-archival approach as the companion sighting item: no
        // agency photo of the Nov. 23 look itself was hotlinkable, so this
        // uses the Getty image from Marie Claire's low-profile coverage,
        // captioned as archival.
        photos: [
          {
            url: 'https://cdn.mos.cms.futurecdn.net/h3Tpzz7eTbWA33VN2tjfMQ.jpg',
            credit: 'Getty Images, via Marie Claire',
            caption:
              'Archival: Swift at a Chiefs game during her low-profile 2025 stretch, from Marie Claire\'s coverage of the era\'s quieter game-day dressing — no agency photo of the Nov. 23 color-blocked look was available to hotlink.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'end-of-an-era-kelce-episodes',
      year: 2025,
      month: 12,
      day: 18,
      category: 'relationship',
      title: 'Travis joins the docuseries for its final episodes',
      snippet:
        'The End of an Era\'s pre-Christmas episodes brought Kelce into the frame — the tour\'s last stretch told with the relationship that started in its stands finally on camera.',
      sourceUrl: 'https://abcnews.com/GMA/Culture/exclusive-1st-end-era-travis-kelce-joins-taylor/story?id=128488203',
      thumbnailUrl: null,
      moment: {
        context:
          'GMA\'s exclusive first look confirmed Kelce appears in the back half of the six-episode Disney+ series, which rolled out Dec. 12, 19, and 23, 2025. His presence gave the series its relationship arc in miniature: the tour that began with him failing to hand her a friendship bracelet in July 2023 ends with him on camera inside its machinery — including the footage around his tuxedoed Wembley cameo in the "I Can Do It With a Broken Heart" bit from June 2024, the night he became briefly an Eras Tour cast member.\n\nThe docuseries also addressed the era\'s hardest moment — the cancelled Vienna shows, covered in the opening episode — making it the fullest inside account of the tour\'s final year: the terror plot, the record-breaking finale, and the relationship that started in its stands, all in one December drop.',
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
        // Getty photo ABC News ran with its docuseries exclusive, hotlinked
        // from its stable CDN copy; verified HTTP 200 + image/jpeg and
        // visually confirmed (the Wembley "I Can Do It With a Broken Heart"
        // cameo in white tie).
        photos: [
          {
            url: 'https://i.abcnewsfe.com/a/28b02501-c9ae-4c1b-bf3f-1e84c6916b90/eras-1-gty-er-251217_1766008410871_hpMain_16x9.jpg',
            credit: 'Getty Images, via ABC News',
            caption:
              'The moment the docuseries revisits: Kelce, in white tie and top hat, on the Eras Tour stage at Wembley during "I Can Do It With a Broken Heart," June 2024.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'showgirl-twelve-weeks-number-one',
      year: 2026,
      month: 1,
      day: 4,
      category: 'business',
      title: 'Twelve weeks at No. 1 — through the entire holiday season',
      snippet:
        'Showgirl held the Billboard 200\'s top spot for 12 nonconsecutive weeks into January — her second-longest run ever behind TTPD — outlasting a record seven Christmas albums crowding the top 10.',
      sourceUrl: 'https://www.billboard.com/music/chart-beat/taylor-swift-showgirl-twelfth-week-number-one-billboard-200-1236148560/',
      thumbnailUrl: null,
      moment: {
        context:
          'The album spent nearly every week at No. 1 from its October debut through the new year — through Wrapped season, through a holiday chart where Bing Crosby posted his biggest streaming week ever at No. 2, through its own 10th and 11th week milestones Billboard tracked one by one — ceding the top spot only once, for a single week in early December, when Stray Kids\' EP "Just Do It" opened strong before Showgirl reclaimed No. 1. Holding the top spot across December is still the chart\'s hardest endurance test — a record seven Christmas albums crowded the top 10 that season, per Billboard, and none of them budged it for more than that one week.\n\nTwelve nonconsecutive weeks made it her second-longest run at No. 1 ever, behind only The Tortured Poets Department\'s 2024 reign, and the album was still on top when Luminate crowned it 2025\'s most-consumed album in January — a holiday quarter that turned the release-week fireworks into a sustained occupation.',
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
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-showgirl-11th-week-number-one-billboard-200-1236146314/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' Reaches 11th Week Atop Billboard 200",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-10',
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
        // Official era wordmark; Commons hosts it as public domain (textual
        // logo, TAS Rights Management provenance), verified via the API.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Taylor_Swift_-_The_Life_of_a_Showgirl_Logo.png',
            credit: 'TAS Rights Management / Republic Records, public domain (textual logo), via Wikimedia Commons',
            caption:
              'The era\'s orange-glitter wordmark — on top of the Billboard 200 for every week of it through the holidays.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'showgirl-luminate-2025-top-album',
      year: 2026,
      month: 1,
      day: 14,
      category: 'business',
      title: "Luminate's 2025 crown: 5.6 million units, no contest",
      snippet:
        'The year-end report made it official — Showgirl was 2025\'s most-consumed album in the US at 5.607M units, roughly half a million clear of Morgan Wallen. Her fourth year-end No. 1, and second in a row.',
      sourceUrl: 'https://www.billboard.com/pro/luminate-2025-year-end-music-report-taylor-swift-showgirl/',
      thumbnailUrl: null,
      moment: {
        context:
          'Remarkable mostly for the calendar: the album had only 13 weeks of 2025 to work with (Luminate\'s tracking year closed Jan. 1, 2026) and still beat everything released in the previous nine months, finishing at 5.607 million US units — roughly half a million clear of Morgan Wallen\'s runner-up total. It topped Billboard\'s year-end Billboard 200 albums ranking on the same math.\n\nIt was her fourth year-end No. 1 album and her second in a row, following The Tortured Poets Department\'s 2024 crown. The report formalized what the weekly charts had been saying since October: a quarter of Showgirl outweighed a full year of everyone else, the kind of margin that turns an album cycle into an industry-wide accounting event.',
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
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Taylor_Swift_%E2%80%93_The_Life_of_a_Showgirl_%28album_cover%29.png',
            credit: 'Album cover photographed by Mert Alas & Marcus Piggott / Republic Records, via Wikipedia',
            caption:
              'Luminate\'s most-consumed album of 2025 in the US — on 13 weeks of availability.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'elizabeth-taylor-video-archival',
      year: 2026,
      month: 3,
      day: 31,
      category: 'music',
      title: 'The Elizabeth Taylor video: a supercut of the real Liz',
      snippet:
        'Released to close Women\'s History Month — Cleopatra, Cat on a Hot Tin Roof, A Place in the Sun, and newsreel paparazzi footage, cut into a tribute instead of a performance video.',
      sourceUrl: 'https://variety.com/2026/music/news/taylor-swift-elizabeth-taylor-music-video-1236703350/',
      thumbnailUrl: null,
      moment: {
        context:
          'The March 31, 2026 video is built almost entirely from archival material: scenes from nine-plus Taylor films — Cleopatra, Cat on a Hot Tin Roof, and A Place in the Sun among them — alongside newsreel footage of her navigating banks of photographers. Rather than cast herself as Elizabeth (the move most artists would make), Swift stays out of frame entirely, letting the real woman carry her own tribute — a supercut argument that the song\'s subject needs no re-enactment.\n\nThe release mechanics were their own story: it hit Apple Music and Spotify Premium first, then YouTube two days later — an unusual windowed rollout for a Swift video — and it landed on the last day of Women\'s History Month, five months after the song had debuted at No. 3. It was the era\'s first new video since "The Fate of Ophelia," and the two make an intentional pair: one a self-directed showgirl spectacular she stars in, the other a curated archive she deliberately absents herself from.',
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
        // Official MV id WqbJT_vC0rs verified via oEmbed against
        // @TaylorSwift ("Taylor Swift - Elizabeth Taylor (Official Music
        // Video)") this session; thumbnail HTTP 200 + image/jpeg.
        video: { youtubeId: 'WqbJT_vC0rs', title: 'Taylor Swift - Elizabeth Taylor (Official Music Video)' },
        photos: [
          {
            url: 'https://i.ytimg.com/vi/WqbJT_vC0rs/hqdefault.jpg',
            credit: 'Taylor Swift / Republic Records (official "Elizabeth Taylor" music video thumbnail, YouTube)',
            caption: 'The official "Elizabeth Taylor" music video — a supercut of the real Elizabeth Taylor\'s films and newsreels.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'rock-hall-ophelia-display',
      year: 2026,
      month: 6,
      day: 26,
      category: 'business',
      title: 'The Rock Hall puts the Ophelia gown in Legends of Rock',
      snippet:
        'Cleveland\'s Rock & Roll Hall of Fame added a Showgirl display to its Legends of Rock exhibit: the long-beaded gown, the swimming costume, and dancers\' props from a video past 438 million views.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-display-rock-and-roll-hall-of-fame-1236281831/',
      thumbnailUrl: null,
      moment: {
        context:
          'The display opened in late June 2026 on the museum\'s fifth level, in the Legends of Rock exhibit — institutional-canon treatment for an era still in progress, before she is even age-eligible for induction. The case holds the long-beaded gown from the video\'s finale, the mint sequined swimming costume from its synchronized-swim number, and props carried by her dancers, staged against a backdrop image from the shoot.\n\nThe artifacts come from the self-written, self-directed video whose single led the Hot 100 for 10 weeks, her longest-leading No. 1, and which had passed 438 million views by the time the case was installed. The placement is the story: costumes from a nine-month-old music video sharing a floor with rock history\'s permanent wardrobe, the museum treating the Showgirl era as canon while it was still selling out vinyl pressings.',
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
        // Image-fix pass (2026-07-10, ticket #340): removed the ABC7
        // two-panel composite (display photo + AP file photo of Swift, with
        // an "ON THE RED CARPET abc" station bug and "AP/EVAN AGOSTINI" text
        // baked in) — a broadcaster news-graphic, not a single photo. Looked
        // for a clean direct photo of the Legends of Rock case (ABC7's own
        // gallery images 3-6 are dead/empty; Billboard's art is a video
        // screengrab, not the case; no Getty/AP/Rock Hall press photo of the
        // case itself was found). ABC7's second gallery image is a single
        // (non-composite) shot of the gown but still carries the same
        // station bug, so it was rejected too rather than trading one
        // logo'd image for another. Falling back to the Commons venue photo
        // below as the moment's sole (verified) photo; needs manual sourcing
        // of a clean case photo if one surfaces later.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Rock_and_Roll_Hall_of_Fame%2C_May_2016.jpg',
            credit: 'MusikAnimal, CC BY-SA 4.0, via Wikimedia Commons',
            caption: 'The Rock & Roll Hall of Fame in Cleveland, home of the Legends of Rock exhibit where the display sits.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'kelce-new-heights-proposal-story',
      year: 2026,
      month: 7,
      day: 8,
      category: 'relationship',
      title: 'Back on New Heights, a married man with a proposal story',
      snippet:
        'In his first episode after the wedding, Travis finally told the proposal story — confirming he was already planning to ask Taylor to marry him during their August 2025 podcast taping — the podcast that announced the album now bookending the era\'s whole arc.',
      sourceUrl: 'https://www.eonline.com/news/1433765/taylor-swift-travis-kelce-wedding-travis-details-proposal',
      thumbnailUrl: null,
      moment: {
        context:
          'The post-wedding episode closed a loop the era opened: New Heights hosted the album reveal in August 2025, the engagement announcement followed two weeks later, and eleven months on, Kelce used the same desk to finally tell the proposal story — confirming that during that August 2025 taping, he was already planning to ask Taylor to marry him. Per E!\'s recap, he called starting the podcast season with her "pretty epic."\n\nThe episode\'s existence was itself notable. The wedding itself remains publicly unrecounted — no interviews, no magazine exclusive, no official photos — but the proposal finally got its telling, characteristically, through the podcast that has functioned as the relationship\'s official record since 2023: the show that started it (the failed friendship-bracelet handoff), announced the album, and now got the proposal\'s own origin story.',
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
        // Archival: the August 2025 Taylor Swift episode of the same show
        // (thumbnail; episode verified via oEmbed against @newheightshow) —
        // the desk the era's story keeps returning to.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/M2lX9XESvDE/hqdefault.jpg',
            credit: 'New Heights with Jason & Travis Kelce (official YouTube episode thumbnail)',
            caption:
              'Archival: the August 2025 Taylor Swift episode of New Heights — the same show, and the same desk, where Kelce finally told the proposal story eleven months later.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'showgirl-ring-designer-wedding-invite',
      year: 2026,
      month: 7,
      day: 7,
      category: 'relationship',
      title: 'The ring designer gets a wedding invite of her own',
      snippet:
        'Kindred Lubeck of Artifex Fine Jewelry, who designed Taylor\'s engagement ring with Travis, was among the guests at the Madison Square Garden wedding — and publicly thanked the "incredible" couple for including her.',
      sourceUrl: 'https://www.eonline.com/news/1433683/taylor-swift-travis-kelce-invited-ring-designer-kindred-lubeck-to-wedding',
      thumbnailUrl: null,
      moment: {
        context:
          'Lubeck\'s attendance closed the loop on the engagement-ring story: the jeweler who worked with Kelce on the custom Old Mine Cut design nearly a year earlier was invited to see the marriage it led to, a detail she confirmed publicly after the wedding, thanking the "incredible" couple for including her.\n\nIt was a fitting coda for the person whose work had carried an outsized share of the era\'s symbolism. Lubeck — the goldsmith, hand engraver, and vintage-jewelry specialist behind New York\'s Artifex Fine Jewelry — was catapulted from independent-studio obscurity to global attention overnight when the ring close-up hit the couple\'s August 2025 announcement post, and the invitation suggested the collaboration had been personal rather than transactional. A guest list that ran from Hugh Grant to Stevie Nicks also had room for the woman who made the ring.',
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
        // Archival: the ring itself, from the couple's own announcement
        // carousel (ABC News' stable copy, credited as ABC credits it).
        photos: [
          {
            url: 'https://i.abcnewsfe.com/a/55d1f976-92b1-44e8-a423-ea8344309260/swift-kelce-engagement-05-ht-jef-250826_1756229507889_hpMain.jpg',
            credit: 'via @taylorswift/Instagram (ABC News)',
            caption:
              'The work that earned the invitation: the Old Mine Cut diamond in yellow gold Lubeck designed with Kelce, from the couple\'s engagement announcement.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'nyc-wedding-permit-fee',
      year: 2026,
      month: 7,
      day: 10,
      category: 'relationship',
      title: "New York City confirms the price tag on Taylor's wedding: over $160K",
      snippet:
        'Mayor Zohran Mamdani says Taylor paid more than $160,000 for the permit and city response around her Madison Square Garden wedding — but that\'s a different claim than "she covered every dollar of NYPD overtime," and the two shouldn\'t get blurred together.',
      sourceUrl: 'https://abcnews.com/GMA/Culture/taylor-swift-paid-new-york-city-160k-wedding/story?id=134655199',
      thumbnailUrl: null,
      moment: {
        context:
          'New York City Mayor Zohran Mamdani confirmed Taylor paid more than $160,000 for the event permit tied to her July 3 wedding to Travis Kelce at Madison Square Garden — a figure covering the permit itself plus the city\'s response to an event that closed streets, rerouted traffic, and pulled in a heavy NYPD presence around the Garden and Penn Station.\n\nWorth being precise about what that number does and doesn\'t confirm. Mamdani tied the payment to "the permit and the response to that event," but nothing public has itemized the $160K into permit fees versus traffic control versus actual police overtime — so the accurate read is "Taylor paid for the permit and the associated city response," not "she personally covered every dollar of NYPD overtime" or "taxpayers paid nothing at all." Separately, and worth not conflating with this: Taylor and Travis also donated $26 million to charities around the wedding, including groups supporting NYPD and FDNY families — real money, but philanthropy, not a city-services invoice.',
        sources: [
          {
            outlet: 'ABC News',
            url: 'https://abcnews.com/GMA/Culture/taylor-swift-paid-new-york-city-160k-wedding/story?id=134655199',
            source_title: 'Taylor Swift paid New York City more than $160k for wedding permit, mayor says',
            publisher: 'ABC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-12',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-nyc-permit-cost-msg-wedding-zohran-mamdani-1235592197/',
            source_title: "Taylor Swift Paid 'Over $160,000' to Obtain NYC Permit for MSG Wedding, Says Zohran Mamdani",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-12',
            reliability_score: 4,
          },
        ],
      },
    },
    {
      slug: 'first-newlywed-appearance-juju-wedding',
      year: 2026,
      month: 7,
      day: 10,
      category: 'sighting',
      title: "First sighting since the wedding: pink Markarian, at a friend's big day",
      snippet:
        'Eight days after their own Madison Square Garden wedding, Taylor and Travis showed up as guests at Kansas City teammate JuJu Smith-Schuster\'s wedding — Taylor in a pink Markarian gown, both of them visibly wearing their new rings.',
      sourceUrl: 'https://www.tmz.com/2026/07/10/taylor-swift-and-travis-kelce-seen-first-time-since-wedding/',
      thumbnailUrl: 'https://imagez.tmz.com/image/43/16by9/2026/07/11/435b7e695e334893923e269c987b46f6_xl.jpg',
      moment: {
        context:
          'Eight days after their July 3 wedding at Madison Square Garden, Taylor and Travis made their first public appearance as a married couple — not at a press event or a project of their own, but as guests at former Kansas City teammate JuJu Smith-Schuster\'s wedding to Laura Kruk, held July 10 at the Ritz-Carlton in Laguna Niguel, California.\n\nTaylor wore a strapless pink and red floral-brocade gown from Markarian, paired with her usual red lipstick; Travis wore a black suit. The pair were photographed holding hands on the way in — the first clear look at both of them wearing their wedding bands. Smith-Schuster was Travis\'s teammate through the Chiefs\' Super Bowl LVII run and stayed close with the couple afterward; he and Kruk were among the 1,000 guests at Taylor and Travis\'s own wedding, making this something of a return trip.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/culture/lifestyle/taylor-swift-travis-kelce-wedding-nfl-juju-smith-schuster-1236292369/',
            source_title: 'Taylor Swift, Travis Kelce Attend Wedding as First Outing After Marrying',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-12',
            reliability_score: 4,
          },
          {
            outlet: 'TMZ',
            url: 'https://www.tmz.com/2026/07/10/taylor-swift-and-travis-kelce-seen-first-time-since-wedding/',
            source_title: 'Newlyweds Taylor Swift & Travis Kelce: See First Photos of Couple Since Wedding',
            publisher: 'TMZ',
            source_type: 'reputable_press',
            accessed_at: '2026-07-12',
            reliability_score: 3,
          },
        ],
        // Verified 2026-07-12: HTTP 200, real JPEG (2048x1152), downloaded
        // and viewed directly — confirms Travis in a black suit + sunglasses
        // and Taylor in the pink floral-brocade gown, outdoor wedding
        // setting. TMZ's own hosted/watermarked photo, not a hotlink to a
        // third party's copy.
        photos: [
          {
            url: 'https://imagez.tmz.com/image/43/16by9/2026/07/11/435b7e695e334893923e269c987b46f6_xl.jpg',
            credit: 'TMZ.com',
            caption:
              "Taylor in the pink Markarian gown and Travis in a black suit, arriving at JuJu Smith-Schuster's wedding.",
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'i-knew-it-i-knew-you-oscar-buzz',
      year: 2026,
      month: 7,
      day: 7,
      category: 'music',
      title: '"I Knew It, I Knew You" enters the Oscar conversation — not a nominee, not yet',
      snippet:
        "Taylor's Toy Story 5 song, co-written with Jack Antonoff, is drawing real Best Original Song buzz — including praise from a rival songwriter — but nothing about an actual nomination is decided.",
      sourceUrl: 'https://variety.com/2026/film/news/moana-lin-manuel-miranda-oscar-race-taylor-swift-1236802380/',
      thumbnailUrl: null,
      moment: {
        context:
          'Taylor\'s original song for Toy Story 5, "I Knew It, I Knew You" (co-written with Jack Antonoff), has become part of the real conversation around the 2027 Best Original Song Oscar race — not because of hype, but because of who\'s saying so. At the July 7 premiere for Disney\'s live-action Moana, Lin-Manuel Miranda — writer of "Along the Way," his own new song for that film, and a two-time Best Original Song nominee himself for animated Moana\'s "How Far I\'ll Go" — told PEOPLE, "I love Taylor, and I love that song. I thought her song for \'Toy Story 5\' was really fun," adding that when writing for a character, "you\'re not thinking about the Oscars... you\'re thinking, \'How on earth do I pull this off? How can it feel honest and true?\'"\n\nThe song has real momentum behind that praise: it topped the Billboard Hot 100 for two weeks running. None of that makes it a nominee — the Academy hasn\'t ruled on eligibility, nothing has been shortlisted, and the formal submission window hasn\'t closed. What\'s real right now is that two of the year\'s highest-profile original songs, both written for existing franchise characters rather than as standalone singles, are being talked about in the same breath — including by the person who\'d be competing against it.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2026/film/news/moana-lin-manuel-miranda-oscar-race-taylor-swift-1236802380/',
            source_title: "'Moana': Lin-Manuel Miranda on Writing the Song 'Along The Way' in a Week and Being in the Oscar Race With Taylor Swift",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-12',
            reliability_score: 4,
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/movies/movie-news/welcome-to-the-oscar-race-toy-story-5-taylor-swift-1236618102/',
            source_title: "Welcome to the Oscar Race, 'Toy Story 5' and Taylor Swift",
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-12',
            reliability_score: 4,
          },
        ],
      },
    },
  ],
};
