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
      // Cross-links (ledger #978, 2026-07-20): this is the era's origin point —
      // thread it forward to the album it announced, the same-day portraits,
      // and the record-shattering debut week that followed.
      relatedIds: [
          'moment:vault-ttpd-all-of-the-music-ive-ever-made-now-belongs-to-me',
          'moment:vault-tloas-your-english-teacher-and-your-gym-teacher-are-getting-marrie',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-the-showgirl-portraits-mert-and-marcus-rhinestones-and-an-op',
        'moment:vault-tloas-4-002-million-in-a-week-the-biggest-album-debut-ever-measure',
        // Cross-link (candidate #1114): the married-man return-visit proposal story.
        'moment:vault-tloas-back-on-new-heights-a-married-man-with-a-proposal-story',
      ],
      title: 'A mint-green briefcase on New Heights: album No. 12, announced on her first-ever podcast',
      snippet:
        'Teased by a 12:12 a.m. countdown, revealed on Travis and Jason Kelce\'s New Heights: a briefcase with an orange "TS," a title, and an Oct. 3 date. The episode set a Guinness World Record with 1.3 million concurrent YouTube viewers — the most ever for a podcast.',
      sourceUrl: 'https://www.nbcnews.com/pop-culture/pop-culture-news/taylor-swift-sets-guinness-world-record-new-heights-podcast-appearance-rcna227245',
      thumbnailUrl: null,
      moment: {
        context:
          'A countdown on her website expired at 12:12 a.m. ET on Aug. 12, 2025, revealing the teaser; the full episode aired the next evening. On it she pulled the blurred mint-green briefcase from behind the desk — mint green with an orange "TS" — revealed the 12-track list ending in a Sabrina Carpenter feature, and talked through the era\'s orange-glitter look. It was her first-ever podcast appearance, staged on her boyfriend\'s own show, and it doubled as the most unguarded long-form interview she had given in years: two hours of album talk, football talk, and the couple\'s dynamic on camera.\n\nThe internet did not hold. The livestream crashed under the load about an hour and 44 minutes in, with the concurrent count peaking at 1.3 million viewers — a figure Guinness World Records certified as the most concurrent views ever for a podcast on YouTube. Within 24 hours the episode had roughly 13 million YouTube views, per Variety\'s tally. The announcement\'s mechanics became the era\'s template: every detail, from the 12:12 a.m. timestamp to the reveal\'s staging on the Kelce brothers\' set, was read by fans as deliberate.\n\nThe two hours ranged well past the reveal. Its most-quoted stretch was the masters buyback: she teared up recounting that she had finally bought back her catalog from Shamrock Capital, a deal she said she led "heart-first," sending her mother Andrea and brother Austin to make the case because "these are my handwritten diary entries from my whole life." She also walked through wrapping the Eras Tour, how she and Travis started dating, and homemaker life down to baking sourdough. On the number 12 she was firm the short tracklist was the whole album — "This is 12. There\'s not a 13th" — while the 12:12 timestamp fed a fan numerology her team never formally confirmed. The appearance moved the show itself: New Heights, on a $100M-plus Wondery deal, saw its female viewership jump more than 600% on Spotify and drew over 500 million cross-platform video views within days.\n\nThe details fans dissected fill in the mechanics. The Aug. 12 teaser did more than tease a briefcase — it already named the album, The Life of a Showgirl, over a blurred cover. The full episode, titled "Taylor Swift on Reclaiming Her Masters, Wrapping The Eras Tour, and The Life of a Showgirl," ran about two hours four minutes; past the crashed livestream, the complete cut lives on the New Heights YouTube channel and its Wondery/Amazon audio feeds, and it topped both Spotify\'s and Apple\'s podcast charts that week, unseating The Joe Rogan Experience. Two things the episode did not actually contain: the masters deal it recounted had been announced months earlier — May 30, 2025, in a handwritten letter on her site, the price never disclosed but reported around $360 million — and the story behind the Sabrina Carpenter title-track duet ("she\'s one of my favorite artists… she was like, \'I\'m dead, yes\'") surfaced only later, at the October release-party film.',
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
          // Added 2026-07-20 (ledger #978): the Guinness record itself, the
          // masters-buyback account, and the show's measured audience jump.
          {
            outlet: 'Guinness World Records',
            url: 'https://www.guinnessworldrecords.com/world-records/779144-most-concurrent-views-for-a-podcast-on-youtube',
            source_title: 'Most concurrent views for a podcast on YouTube',
            publisher: 'Guinness World Records',
            source_type: 'official',
            accessed_at: '2026-07-20',
            reliability_score: 5,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2025/music/news/taylor-swift-mom-brother-master-recordings-1236488967/',
            source_title: "Taylor Swift Sent Her Mom and Brother to Negotiate Her Master Recordings Buyback",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-20',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-new-heights-breaks-youtube-podcast-record-1236045668/',
            source_title: "Taylor Swift's 'New Heights' Episode Breaks YouTube Podcast Record",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-20',
            reliability_score: 4,
          },
          // Ledger #1380 (2026-07-25): the teaser named the album (not just a
          // briefcase); the episode title/runtime and its archive; the Spotify +
          // Apple No. 1s; the masters deal's actual May 30, 2025 announcement
          // date (the podcast only recounted it) and its reported ~$360M/
          // undisclosed price; and that the Sabrina Carpenter collab backstory
          // surfaced later at the October release-party film, not on the episode.
          {
            outlet: 'PhillyVoice',
            url: 'https://www.phillyvoice.com/taylor-swift-12th-album-new-heights-podcast-jason-travis-kelce/',
            source_title: "Taylor Swift announces 12th album on Kelces' New Heights podcast",
            publisher: 'PhillyVoice',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          {
            outlet: 'Music Business Worldwide',
            url: 'https://www.musicbusinessworldwide.com/taylor-swift-buys-back-master-rights-to-first-six-albums-from-shamrock-capital/',
            source_title: 'Taylor Swift buys back master rights to first six albums from Shamrock Capital',
            publisher: 'Music Business Worldwide',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'Newsweek',
            url: 'https://www.newsweek.com/travis-kelce-new-heights-beats-joe-rogan-podcast-2112744',
            source_title: "Travis Kelce's New Heights beats Joe Rogan podcast",
            publisher: 'Newsweek',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-sabrina-carpenter-the-life-of-a-showgirl-song-1235439996/',
            source_title: "How Taylor Swift's 'The Life of a Showgirl' Collab With Sabrina Carpenter Came Together",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
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
          // 2026-07-17: NBC News' still from the episode (their own
          // media-cldnry.s-nbcnews.com render), verified HTTP 200 +
          // image/jpeg (1240x698), downloaded and viewed — Swift and Kelce
          // side by side at the New Heights desk mid-episode.
          {
            url: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2025-08/250814-travis-kelce-taylor-swift-16x9-mn-1200-675781.jpg',
            credit: 'New Heights, via NBC News',
            caption:
              'Mid-episode at the New Heights desk, Aug. 13, 2025 — her first-ever podcast appearance, on the show where the album was announced.',
            kind: 'archival',
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
      // Cross-links added 2026-07-25 (ledger #1431 Q6: this visual-thesis page
      // carried ZERO relatedIds). Threads to the era's origin (New Heights
      // reveal), the release these portraits ARE the packaging of, the lead
      // single that shares the Ophelia/Millais conceit, and the look in which
      // Swift walked fans through this exact packaging. All four ids verified
      // to resolve in content-vault.generated.ts.
      relatedIds: [
        'moment:vault-tloas-a-mint-green-briefcase-on-new-heights-album-no-12-announced-',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-the-fate-of-ophelia-hamlets-drowned-girl-rescued-and-a-13th-',
        'moment:vault-tloas-the-look-that-made-showgirl-orange-a-fashion-story-reformati',
        // Cross-link (candidate #1027): Mert & Marcus's first Swift shoot since
        // reputation, whose cover debuted in the snake-video reveal.
        'moment:vault-reputation-the-snake-video-that-announced-reputation',
      ],
      title: 'The showgirl portraits: Mert and Marcus, rhinestones, and an Ophelia bathtub cover',
      snippet:
        'Her most theatrical album imagery yet — feathered, crystal-covered showgirl looks shot by Mert and Marcus (their first Swift shoot since reputation), and a cover of her half-submerged in water in a diamond-lined AREA bralette, widely read as an echo of Millais\'s painting of Ophelia.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift said the submerged cover glamorizes the offstage side of the Eras Tour — her day "ends in a bathtub, not usually in a bedazzled dress" — choosing a behind-the-scenes image over full showgirl mode because the songs are about what she was going through offstage. The title is lettered in orange glitter, and the wider shoot\'s bejeweled bodysuits and feather headdresses were described by critics as the most provocative, glamorous visual identity of her career. It reunited her with Mert Alas and Marcus Piggott, the duo behind reputation\'s black-and-white newsprint portraits — their first Swift shoot since 2017, now flipped from monochrome menace to full Vegas color.\n\nMarie Claire\'s wardrobe breakdown of the album packaging reads like a showgirl-history syllabus: vintage Bob Mackie — the designer synonymous with Cher and the Las Vegas stage — appears on several alternate covers, alongside custom Gucci, The Blonds, a Kelsey Randall chainmail dress, Fleur du Mal lingerie, and an Annie\'s Ibiza mini with Lorraine Schwartz jewels. The feathered backstage portrait shown here, styled dressing-room-mirror-and-all, is the shoot\'s thesis in one frame: the glamour machine photographed from inside the dressing room rather than from the audience.\n\nTwo of the imagery\'s most-repeated readings are interpretation, not statement. The Millais Ophelia parallel is a critics\' reading — neither Swift nor the photographers ever confirmed it; she framed the submerged shot only as an offstage image. And while the crystal looks are Bob Mackie, Mackie said he was never consulted, "kind of shocked" to see Swift in pieces borrowed from his Las Vegas Jubilee! revue, not made for her. Documented in the credits: styling by longtime stylist Joseph Cassell Falconer; a standard-cover bralette from AREA\'s Spring 2022 collection, customized for the shoot; and an orange-glitter wordmark that sets an existing 2021 typeface — Edwin Moreira\'s Gazzetta — her team selected rather than commissioned.\n\nThe shoot ultimately fed six distinct Mert & Marcus cover images — Swift as six different showgirls — spread across a blitz of physical editions: the standard half-submerged "Ophelia bathtub" cover, the vinyl editions "The Shiny Bug" (an embellished corseted bodysuit and gloves), "Baby, That\'s Show Business" and "Tiny Bubbles in Champagne," the Target-exclusive "The Crowd Is Your King," three CD variants ("It\'s Frightening," "It\'s Rapturous," "It\'s Beautiful") and a limited "Sweat and Vanilla Perfume" CD, part of the 27-variant release-week blitz. The packaging leaned into physical-media detail — a high-gloss finish, photo-card CDs, a poem tucked into each vinyl — though no outside creative director was credited for it beyond Swift and her team. A few threads stay genuinely undocumented: the shoot\'s exact date and location were never published (they circulate only via fan-wiki image metadata, so neither is asserted here), and the hair-and-makeup credits, a named packaging art director, and any on-record comment from AREA\'s designers or from Mert and Marcus about the concept have not surfaced in press coverage.',
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
          // Depth ledger #1025 (2026-07-21): the Millais link is a critic
          // reading (not Swift/photographer-confirmed); Bob Mackie says he was
          // never consulted and the looks were borrowed from his Vegas
          // "Jubilee!" revue; the wordmark uses Edwin Moreira's pre-existing
          // "Gazzetta" typeface.
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/bob-mackie-blown-away-taylor-swift-outfit-showgirl-cover-1236101495/',
            source_title: "Bob Mackie 'Blown Away' by Taylor Swift Wearing His Design on 'Showgirl' Cover",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Hyperallergic',
            url: 'https://hyperallergic.com/did-19th-century-ophelia-painting-inspire-taylor-swift-new-showgirl-album-art/',
            source_title: "Did a 19th-Century Ophelia Painting Inspire Taylor Swift's New Album Art?",
            publisher: 'Hyperallergic',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
          },
          {
            outlet: 'Fast Company',
            url: 'https://www.fastcompany.com/91392024/taylor-swifts-life-of-a-showgirl-album-typeface',
            source_title: "The typeface behind Taylor Swift's 'The Life of a Showgirl'",
            publisher: 'Fast Company',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          // Ledger #1431 (2026-07-25): the six distinct Mert & Marcus covers /
          // "six different showgirls" and the named vinyl/CD editions.
          {
            outlet: 'Capital FM',
            url: 'https://www.capitalfm.com/news/taylor-swift-life-of-a-showgirl-variants-album-covers/',
            source_title: "Every Taylor Swift 'The Life of a Showgirl' vinyl variant and album cover",
            publisher: 'Capital FM',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
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
            // Swift stands left of center amid the showgirls; her face sits just above the middle band.
            focalPoint: '42% 38%',
          },
          // Photo pass (#762 run 6, 2026-07-18): two more frames from the same
          // Mert & Marcus album shoot, hotlinked from Marie Claire's credited
          // copies (credit strings on the article: "Mert Alas and Marcus
          // Piggott"). Both verified HTTP 200 + image/jpeg, downloaded and
          // visually confirmed this session.
          {
            url: 'https://cdn.mos.cms.futurecdn.net/6bCBZegSVzvrbtkJHDHqUe-1024-80.jpg',
            credit: 'Mert Alas and Marcus Piggott, via Marie Claire',
            caption:
              'The custom Gucci look from the same shoot: a sequined copper gown, glancing back past a room-service cart of martinis — offstage glamour played as theater.',
            kind: 'primary',
            // She stands right of center, glancing back; her face sits in the upper quarter.
            focalPoint: '45% 25%',
          },
          {
            url: 'https://cdn.mos.cms.futurecdn.net/M6vbXtrHkRuawfHjpn422Q-1024-80.jpg',
            credit: 'Mert Alas and Marcus Piggott, via Marie Claire',
            caption:
              'Rhinestone bra, crystal headdress, gold-tassel curtain: the full Vegas register of the shoot, photographed like a between-shows breather.',
            kind: 'primary',
            // Seated pose with her face upper-left against the gold tassels.
            focalPoint: '38% 22%',
          },
        ],
        products: [
          {
            brand: 'AKIRA',
            item: 'Drippy Rhinestone Chain Top',
            retailer: 'shopakira.com',
            url: 'https://www.shopakira.com/products/drippy-rhinestone-chain-top',
            price: '$62.93',
            isAlternative: true,
            altNote: 'The shoot used vintage Bob Mackie originals from his Vegas "Jubilee!" revue, not made for Swift and not sold at retail -- this is a current rhinestone-chain top in the same showgirl register.',
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
      significance: 'defining', // the era-defining album release (docs/decisions.md, 2026-07-18)
      // Cross-links (ledger #981, 2026-07-20): this release-day page is the
      // era anchor — thread it to its origin (New Heights announcement), the
      // same-day portraits, the five song pages, and the four chart-record
      // pages. IDs are the generated vault ids (vault-tloas-<slugified title>).
      relatedIds: [
          'moment:vault-tloas-a-release-date-that-costs-a-grammy-shot-showgirl-misses-the-',
        'moment:vault-tloas-a-mint-green-briefcase-on-new-heights-album-no-12-announced-',
        'moment:vault-tloas-the-showgirl-portraits-mert-and-marcus-rhinestones-and-an-op',
        'moment:vault-tloas-the-fate-of-ophelia-hamlets-drowned-girl-rescued-and-a-13th-',
        'moment:vault-tloas-father-figure-rebuilds-george-michaels-1988-hit-with-his-est',
        'moment:vault-tloas-eldest-daughter-the-first-track-five-that-ends-somewhere-saf',
        'moment:vault-tloas-the-title-track-hands-the-last-word-to-sabrina-carpenter',
        'moment:vault-tloas-opalite-follows-ophelia-to-no-1',
        'moment:vault-tloas-4-002-million-in-a-week-the-biggest-album-debut-ever-measure',
        'moment:vault-tloas-spotifys-2025-single-day-streaming-record-falls-in-under-11-',
        'moment:vault-tloas-1-334-million-vinyl-lps-in-seven-days-the-first-million-viny',
        'moment:vault-tloas-all-12-tracks-debut-as-the-hot-100s-entire-top-12',
        // Cross-links (candidates #1404/#1405): the Max Martin/Shellback pop-machinery
        // lineage the release page names — her first full album with them since
        // reputation, the sound first built on 1989.
        'moment:vault-reputation-reputation-strikes-back',
        'moment:vault-1989-the-pop-reinvention',
      ],
      title: 'The Life of a Showgirl arrives: 12 tracks, Max Martin and Shellback, one guest',
      snippet:
        'Written and recorded in Sweden between European Eras Tour dates — her first full album with Max Martin and Shellback since 1989 and reputation. Twelve tracks, no Anthology-style sprawl, and a single feature: Sabrina Carpenter on the closing title track.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/f/f4/Taylor_Swift_%E2%80%93_The_Life_of_a_Showgirl_%28album_cover%29.png',
      moment: {
        context:
          'On New Heights she described slipping to Sweden during the Eras Tour\'s 2024 European leg to cut the record with Max Martin and Shellback, keeping it deliberately tight at 12 songs after the 31-track Tortured Poets Anthology. It was a pointed reunion: Martin and Shellback built the pop machinery of 1989 and reputation, and this was her first full album with them since — made in stolen days between stadium shows, which she said is exactly what the songs are about.\n\nThe cover — shot by Mert Alas and Marcus Piggott, styled by her longtime stylist Joseph Cassell — shows Swift half-submerged in water in a diamond-lined bralette from AREA\'s Spring 2022 collection (the New York label of Beckett Fogg and Piotrek Panszczyk), restaging Millais\'s Ophelia under an orange, glittery title treatment. She framed it as a deliberately offstage image: "My day ends in a bathtub, not usually in a bedazzled dress," she said, wanting the artwork to be "about what happened offstage" rather than onstage. The bathtub reading pays off on track one — the drowned Ophelia of the cover is the same woman the opening song pulls out of the water.\n\nThe record itself is lean: 12 tracks, 41:40, cut at MXM and Shellback Studios in Stockholm and written throughout by Swift with Martin and Shellback — the only outside credit George Michael\'s, for the "Father Figure" interpolation. Sabrina Carpenter sings on the closing title track (a Las Vegas showgirl named Kitty) as a vocal feature, not a co-writer. The album dropped at midnight ET on Oct. 3 as one worldwide release, Target holding roughly 500 stores open for a midnight vinyl sale; there was no 13th track or launch-day deluxe. Republic flooded release week with 27 physical variants — 16 CDs, eight vinyl pressings, two deluxe CDs bundled with clothing, and a cassette. Critics split hard: a 69 on Metacritic across 23 reviews, Rolling Stone\'s five stars against the Guardian\'s two, one of 2025\'s most-debated albums.\n\nIn her own framing the record is the private life running under the tour\'s spectacle — "about what was going on behind the scenes in my inner life during this tour, which was so exuberant and electric and vibrant," made while she was "physically exhausted" yet "so mentally stimulated." The title track turns that thesis into character: a fictional Las Vegas showgirl, Kitty, who warns a starstruck admirer that fame is "not all flowers and magic." The 12-song length was a deliberate discipline against The Tortured Poets Department\'s 31 — "here\'s a data dump… here\'s 31 songs. This is 12," she said, adding "there\'s no other songs coming." The split reviews left it among the lowest-scored of her career on Metacritic — its 69 above only her 2006 debut by the review-roundup tallies — with Rolling Stone calling it "the castle she built out of all the bricks that have been thrown at her" and the Guardian\'s Alexis Petridis panning its "dull razzle-dazzle" and "lack of undeniable hooks." The 27-variant blitz drew its own backlash — fans and commentators flagged overconsumption and environmental cost, a recurring charge against her variant-heavy rollouts — which neither Swift nor Republic answered directly.',
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
          // Added 2026-07-20 (ledger #981): reception + credits + styling.
          {
            outlet: 'Metacritic',
            url: 'https://www.metacritic.com/music/the-life-of-a-showgirl/taylor-swift',
            source_title: 'The Life of a Showgirl by Taylor Swift Reviews',
            publisher: 'Metacritic',
            source_type: 'aggregator',
            accessed_at: '2026-07-20',
            reliability_score: 4,
          },
          {
            outlet: 'The Guardian',
            url: 'https://www.theguardian.com/music/2025/oct/03/taylor-swift-the-life-of-a-showgirl-review',
            source_title: "Taylor Swift: The Life of a Showgirl review",
            publisher: 'The Guardian',
            source_type: 'reputable_press',
            accessed_at: '2026-07-20',
            reliability_score: 4,
          },
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/taylor-swift-life-of-a-showgirl-album-outfits-new-heights/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' Album Outfits, Explained",
            publisher: 'Marie Claire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-20',
            reliability_score: 4,
          },
          // Depth ledger #991 (2026-07-21): the release-clock detail — midnight
          // ET, single worldwide drop, Target's midnight in-store sale. The AREA
          // designer attribution (Fogg/Panszczyk, Spring 2022) rests on Marie
          // Claire (above). Crystal count and the shoot's submersion method stay
          // undocumented; the shoot date/location circulates only via fan-wiki
          // EXIF, so neither is asserted.
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/music/when-does-the-life-of-a-showgirl-taylor-swift-come-out-rcna235169',
            source_title: "When does 'The Life of a Showgirl' come out? Release time, tracklist",
            publisher: 'Today',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          // Ledger #1403 (2026-07-25): the album's thesis in her own words, the
          // deliberate 12-vs-31 discipline, the Metacritic ranking in context,
          // the Kitty title-track character, and the variant-strategy backlash.
          // (AREA's designers never publicly reacted to the Ophelia cover — a
          // genuine unanswerable, left unasserted.)
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-made-life-of-showgirl-during-eras-tour-1235407376/',
            source_title: "Taylor Swift Made 'The Life of a Showgirl' During the Eras Tour",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-life-of-a-showgirl-track-list-length-12-songs-1236043775/',
            source_title: "Taylor Swift Explains Why 'The Life of a Showgirl' Is Just 12 Songs",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-album-reviews/taylor-swift-the-life-of-a-showgirl-album-review-1235439733/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' Review",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-the-life-of-a-showgirl-critic-reviews-1236392461/',
            source_title: "What Critics Are Saying About Taylor Swift's 'The Life of a Showgirl'",
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'AOL',
            url: 'https://www.aol.com/articles/surprising-inspiration-behind-kitty-finlay-172426102.html',
            source_title: "The Surprising Inspiration Behind Kitty Finlay in Taylor Swift's 'The Life of a Showgirl'",
            publisher: 'AOL',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          {
            outlet: 'Tufts Daily',
            url: 'https://www.tuftsdaily.com/article/2025/10/taylor-swifts-the-life-of-a-showgirl-the-commercialism-of-album-covers',
            source_title: "Taylor Swift's 'The Life of a Showgirl': the commercialism of album covers",
            publisher: 'Tufts Daily',
            source_type: 'commentary',
            accessed_at: '2026-07-25',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Taylor_Swift_%E2%80%93_The_Life_of_a_Showgirl_%28album_cover%29.png',
            credit: 'Album cover photographed by Mert Alas & Marcus Piggott / Republic Records, via Wikipedia',
            caption:
              'The official album cover: Swift half-submerged in water in a diamond-lined AREA bralette, restaging Millais\'s Ophelia beneath the orange-glitter title.',
            kind: 'primary',
            // Focal point set 2026-07-18 by viewing the image: her face sits
            // upper-center-right of the square cover.
            focalPoint: '55% 22%',
          },
          // Release-day pop-up/theater-event photos were looked for on 2026-07-09
          // but skipped: the only credited galleries found (Deadline) sit behind a
          // bot-wall, CNN's image pages return HTTP 451 to us, and Wikimedia
          // Commons has no release-party media — no stable, verifiable direct
          // image URL was available, so none is force-added.
          // Photo pass 2026-07-19 (bulk-to-6+, docs/decisions.md): 4 more
          // real, verified photos of the people and the exact painting this
          // item's own context names directly. All curl 200.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/9/94/John_Everett_Millais_-_Ophelia_-_Google_Art_Project.jpg',
            focalPoint: '38% 52%',
            credit: 'John Everett Millais, 1852 (public domain, Google Art Project)',
            caption: 'Millais\'s "Ophelia" (1852) — the painting the album cover directly restages.',
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/61/Sabrina_Carpenter_-_O2_Arena_2025_-_086_%28cropped_2%29.jpg',
            focalPoint: '60% 20%',
            credit: 'Raph_PH, Wikimedia Commons (CC BY 2.0)',
            caption: 'Sabrina Carpenter, the album\'s single feature, on the closing title track.',
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/3/31/Max_Martin.jpg',
            focalPoint: '32% 22%',
            credit: 'Martina Huber / Regeringskansliet (CC BY 2.0)',
            caption: 'Max Martin, whose reunion with Swift on this record was her first with him since 1989 and reputation.',
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/New_Heights_logo.svg',
            focalPoint: '50% 50%',
            credit: 'New Heights (official logo)',
            caption: 'The New Heights podcast, where she first described making the album in Sweden between Eras Tour dates.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      slug: 'showgirl-release-party-theaters',
      year: 2025,
      month: 10,
      day: 3,
      category: 'release',
      // Cross-links (ledger #1042, 2026-07-21): this page had ZERO relatedIds
      // despite being the same event as the box-office record it grossed, the
      // album it dropped for, and the "Fate of Ophelia" video it premiered.
      relatedIds: [
        'moment:vault-tloas-an-album-release-party-wins-the-box-office-34-1m-domestic-50',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-the-fate-of-ophelia-video-premieres',
      ],
      title: 'The Official Release Party of a Showgirl turns movie theaters into listening parties',
      snippet:
        'A one-weekend-only AMC event, Oct. 3–5: the premiere of "The Fate of Ophelia" video, behind-the-scenes footage, and lyric videos for the whole album — with audiences singing and dancing in the aisles. It earned an A+ CinemaScore.',
      sourceUrl: 'https://www.cnn.com/2025/10/05/business/taylor-swift-amc-showgirl-box-office',
      thumbnailUrl: null,
      moment: {
        context:
          'Announced barely two weeks out and distributed by AMC Theatres Distribution with Variance Films domestically and Piece of Magic internationally, the roughly 89-minute event was built as a communal album drop rather than a concert film — release-day showtimes started at 3 p.m. ET, and a ticket ran the standard $12, which fans read as a nod to her 12th album (AMC never confirmed the price as a deliberate Easter egg the way the Eras film\'s $19.89 was, and $12 is also its ordinary base price). The program opened with the world premiere of the self-directed "The Fate of Ophelia" video, then behind-the-scenes footage from its shoot, then Swift on camera talking through the record over lyric videos for its tracks.\n\nThat video was shot by Rodrigo Prieto — the Oscar-nominated cinematographer of Barbie and Killers of the Flower Moon, and of her own "Fortnight" — at the 1931 Los Angeles Theatre and a soundstage, with Eras Tour collaborators Ethan Tobman (production design) and Mandy Moore (choreography); Prieto later won an ASC Music Video Award for it. The theatrical window was only about 48 hours: the video hit YouTube on Sunday, Oct. 5 at 7 p.m. ET.\n\nTheaters leaned into the party — costumes, friendship bracelets, full-crowd singalongs to songs nobody had heard that morning; CNN\'s dispatch described aisles turned into dance floors — and audiences graded it an A+ CinemaScore, the same mark the 2023 Eras Tour film earned and one only a handful of releases a year ever get. It played the single weekend of Oct. 3–5 with no held-over showings and cleared more than $50 million worldwide — $34.1 million domestic, $16 million international — enough for AMC to call it the biggest-grossing album-debut theatrical event ever and the only album-debut cinema experience to finish a weekend at No. 1 domestically.\n\nAMC put the full global footprint at more than 8,000 cinemas across upward of 110 territories once every partner market came online, all playing the exact same run time in their own local time zone rather than a staggered international rollout. Inside the program, the commentary segments went beyond generic reflections: Swift is shown baking sourdough bread on camera during behind-the-scenes footage, and the sequence includes a segment built around Sabrina Carpenter, framed as her having "opened" for the title track the way she opened Eras Tour shows before her own breakout — tying the film\'s structure to the same mentor/successor idea the title track\'s lyric explores. No exclusive merchandise or collectible ticket for the event has been reported. The full 89-minute program with Swift\'s commentary has not had a confirmed home or streaming release; what did surface afterward were the pieces already built for wider release — the "Fate of Ophelia" video and the album\'s lyric videos went to YouTube shortly after the theatrical run ended, which is the extent of the program\'s life outside AMC\'s three-day window as of this writing. Its $50.1 million global weekend outdrew Beyoncé\'s "Renaissance: A Film" (roughly $21 million opening weekend in 2023) by a wide margin, though it still trails the scale of Swift\'s own "The Eras Tour" concert film, which opened to $92.8 million domestically in 2023 — the two events aren\'t quite apples-to-apples: Eras was a full concert film with a wider multi-week run, while the Showgirl release party was a single 89-minute weekend event built around an album, not a tour.',
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
          // Depth ledger #1042 (2026-07-21): ticket price, single-weekend run,
          // the "Fate of Ophelia" video credits/location, the YouTube window,
          // and the A+ CinemaScore benchmark against the Eras film.
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/zacharyfolk/2025/10/05/taylor-swifts-official-release-party-of-a-showgirl-hits-no-1-and-dominates-box-office-during-single-weekend-run/',
            source_title: "Taylor Swift's 'Official Release Party Of A Showgirl' Hits No. 1 During Single Weekend Run",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-the-fate-of-ophelia-music-video-watch-1236393494/',
            source_title: "Taylor Swift Drops Self-Directed 'The Fate of Ophelia' Music Video",
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2025/music/news/taylor-swift-fate-of-ophelia-music-video-premiere-youtube-1236540694/',
            source_title: "Taylor Swift's 'The Fate of Ophelia' Video Arrives on YouTube",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-the-eras-tour-movie-number-one-box-office-1235442994/',
            source_title: "'Taylor Swift: The Eras Tour' Opens at No. 1 With an A+ CinemaScore",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          // Depth ledger #1161 (2026-07-29): global theater/territory count,
          // the Carpenter/sourdough program detail, merchandise and
          // post-run-availability facts, and the Renaissance/Eras comparison.
          {
            outlet: 'AMC Entertainment',
            url: 'https://investor.amctheatres.com/news-events/press-releases/detail/397/taylor-swift-the-official-release-party-of-a-showgirl-goes-global-with-more-than-8000-cinemas-worldwide-across-more-than-110-territories-expected-to-play-the-experience',
            source_title: 'THE OFFICIAL RELEASE PARTY OF A SHOWGIRL Goes Global, With More Than 8,000 Cinemas Worldwide Across More Than 110 Territories',
            publisher: 'AMC Entertainment (press release)',
            source_type: 'official',
            accessed_at: '2026-07-29',
            reliability_score: 5,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Taylor_Swift:_The_Official_Release_Party_of_a_Showgirl',
            source_title: 'Taylor Swift: The Official Release Party of a Showgirl',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-29',
            reliability_score: 2,
            notes: 'the sourdough-baking footage and the Sabrina Carpenter "opening" segment structure; the post-run YouTube release of the video and lyric videos',
          },
          {
            outlet: 'TheWrap',
            url: 'https://www.thewrap.com/taylor-swift-release-party-showgirl-33-million-box-office/',
            source_title: "Taylor Swift's 'Release Party of a Showgirl' Racks Up $33 Million at Box Office",
            publisher: 'TheWrap',
            source_type: 'reputable_press',
            accessed_at: '2026-07-29',
            reliability_score: 4,
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
            // Focal point set 2026-07-18 by viewing: her face is upper-middle,
            // just left of center on the portrait poster.
            focalPoint: '46% 32%',
          },
          // Added 2026-07-18 (photo-enrichment run 2, #762): fan photo from
          // opening day, hosted on Rolling Stone's own CDN (wp-content, not a
          // watermarked comp). Verified HTTP 200 + image/jpeg, downloaded and
          // vision-confirmed: fans in orange outfits and Eras merch celebrate
          // outside AMC Lincoln Square 13, Oct. 3, 2025 (per RS's caption).
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2025/10/taylor-swift-AMC-watch-party.jpg?w=1600&h=900&crop=1',
            credit: 'Dia Dipasupil/Getty Images, via Rolling Stone',
            caption:
              'Fans in album-orange outfits celebrate outside the AMC Lincoln Square 13 theater in New York on release day, Oct. 3, 2025.',
            kind: 'primary',
            focalPoint: '50% 40%',
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
      // Cross-link deficit closed (2026-07-21, depth ledger #1011): the box-office
      // record now threads to the theatrical event it grosses, the album it
      // promotes, the same-week 4M album record, and the Eras Tour film whose
      // studio-bypassing distribution play it reran.
      relatedIds: [
        'moment:vault-tloas-the-official-release-party-of-a-showgirl-turns-movie-theater',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-4-002-million-in-a-week-the-biggest-album-debut-ever-measure',
        'moment:vault-midnights-the-eras-tour-film-opens-to-92-8-million-the-biggest-concert',
      ],
      title: 'An album release party wins the box office: $34.1M domestic, $50M+ worldwide',
      snippet:
        'The Release Party topped the North American box office on $34.1 million and crossed $50 million globally in its single weekend — the biggest album-debut event in cinema history, beating actual movies without being one.',
      sourceUrl: 'https://www.screendaily.com/news/taylor-swift-the-official-release-party-of-a-showgirl-rules-north-american-box-office-on-341m/5209617.article',
      thumbnailUrl: null,
      moment: {
        context:
          'The three-day domestic gross split $15.8M Friday, $9.9M Saturday, and $8.3M Sunday, with roughly $16 million more internationally. Every "ticket" was for the same 89 minutes on a loop of showtimes — the in-theater premiere of the self-directed "The Fate of Ophelia" music video, behind-the-scenes footage from its shoot, lyric videos for the rest of the album, and Swift\'s own on-camera reflections on the songs. No plot, no premiere, no stars in attendance — and it still beat every actual movie in wide release.\n\nIt was not an AMC-only affair. AMC Theatres Distribution ran it with Variance Films in the U.S. and Canada and Piece of Magic abroad, playing all 540 U.S. AMC locations plus Cinemark and Regal, Cineplex in Canada and Cinépolis and Cinemex in Mexico — part of a global footprint of more than 8,000 cinemas across 110-plus territories. Domestically it topped Warner Bros.\' "One Battle After Another" (No. 2, about $11 million in its second weekend) and out-opened Dwayne Johnson\'s "The Smashing Machine" ($5.9 million), making it — by AMC\'s account — the only "non-film" theatrical event this century to finish a weekend at No. 1 in North America. Tickets were a flat $12, pegged to her 12th album, and AMC released no admissions count; the event played a single weekend by design (Oct. 3–5 only), so its opening gross was effectively its final total. CBS News, independent of AMC, called it "the largest grossing album debut theatrical event of all time."\n\nAMC called it the biggest album-debut cinema event ever, domestic and global — a rerun of the distribution play she pioneered with The Eras Tour concert film in 2023, when she bypassed the studio system and took the tour film to AMC directly. That film opened far bigger ($92.8 million domestic); the release party\'s win was structural, not a bigger number — proof a big enough artist can rent the theatrical apparatus for a weekend and turn an album drop into a box-office event, no studio in the deal.\n\nSeveral of the business specifics stayed deliberately private. The receipts were spread across more than 3,700 domestic screens, and the single overseas market AMC and Comscore ever quantified was the UK and Ireland, where it opened at No. 1 with £3.5 million ($4.7 million); the rest of the roughly $16 million international haul was never broken out country by country. AMC published no attendance figure — the ~2.8 million tickets implied by $34.1M at $12 apiece is arithmetic, not a reported count — and the revenue split among AMC Distribution, Variance Films, Piece of Magic, the participating chains and Swift\'s Republic side was never disclosed. Even the accounting was ambiguous: Comscore ranked it live within the weekend domestic chart, but no tracker said whether the gross was folded into 2025\'s official North American year-end total or held apart from it as a "non-film" event.\n\nThat single weekend was the whole of its life on the big screen. No home-video, digital or streaming release was ever announced; unlike The Eras Tour concert film, which reached Disney+ 155 days after its theatrical run, the release party stayed theatrical-exclusive — only the premiered "The Fate of Ophelia" music video and the album\'s lyric videos turned up on YouTube in the days after. Trade press floated a possible Disney+ window around March 2026, but no such deal materialized.',
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
          // Depth ledger #1011 (2026-07-21): the exhibitor lineup + footprint
          // (AMC's own release naming Cinemark/Regal/Cineplex/Cinépolis/Cinemex,
          // 8,000+ cinemas / 110+ territories) and the weekend runner-up.
          {
            outlet: 'AMC Entertainment',
            url: 'https://investor.amctheatres.com/news-events/press-releases/detail/399/taylor-swift-the-official-release-party-of-a-showgirl-is-an-unprecedented-record-setting-worldwide-success-with-more-than-50-million-global-box-office',
            source_title: 'THE OFFICIAL RELEASE PARTY OF A SHOWGIRL Is an Unprecedented, Record-Setting, Worldwide Success',
            publisher: 'AMC Entertainment (investor press release)',
            source_type: 'official',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2025/film/box-office/taylor-swift-box-office-global-charts-one-battle-after-another-milestone-100-million-1236540555/',
            source_title: "Taylor Swift Leads Box Office, 'One Battle After Another' Crosses $100 Million",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          // Depth ledger #1262 (2026-07-24): the one quantified overseas market
          // (UK/Ireland), the undisclosed attendance / revenue-split / year-end
          // accounting, and the confirmed lack of any post-theatrical release.
          {
            outlet: 'Variety',
            url: 'https://variety.com/2025/film/box-office/taylor-swift-release-party-of-a-showgirl-uk-ireland-box-office-1236541930/',
            source_title: "Taylor Swift's 'Release Party of a Showgirl' Tops U.K., Ireland Box Office",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-official-release-party-show-girl-tops-box-office-1236082371/',
            source_title: "Taylor Swift's 'Official Release Party of a Showgirl' Tops Weekend Box Office",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Dexerto',
            url: 'https://www.dexerto.com/tv-movies/how-to-watch-taylor-swift-release-party-of-a-showgirl-streaming-3261637/',
            source_title: "Taylor Swift's 'Showgirl release party' movie may not be streaming until 2026",
            publisher: 'Dexerto',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Taylor_Swift:_The_Official_Release_Party_of_a_Showgirl',
            source_title: 'Taylor Swift: The Official Release Party of a Showgirl',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-24',
            reliability_score: 2,
          },
          // Depth ledger #1011 (2026-07-22): the $12 flat ticket price, the
          // single-weekend limited-engagement design, and CBS's independent
          // confirmation of the all-time record claim.
          {
            outlet: 'Capital FM',
            url: 'https://www.capitalfm.com/news/taylor-swift-showgirl-release-party-movie-tickets-theatres/',
            source_title: "Taylor Swift's Showgirl release party: ticket prices and details",
            publisher: 'Capital FM',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 4,
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-life-of-a-showgirl-movie-33-million-box-office',
            source_title: "Taylor Swift's 'Life of a Showgirl' release party tops box office",
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/2/26/Taylor_Swift_The_Official_Release_Party_of_a_Showgirl_poster.png',
            credit: 'Official theatrical release poster / AMC Theatres Distribution, via Wikipedia',
            caption:
              'The poster for the event that topped the weekend box office — an album release party billed, sold, and reported like a feature film.',
            kind: 'archival',
            // Focal point set 2026-07-18 by viewing: face upper-middle-left.
            focalPoint: '46% 32%',
          },
          // Added 2026-07-18 (photo-enrichment run 2, #762): the album-era
          // promo still The Hollywood Reporter ran with its box-office story,
          // hosted on THR's own CDN. Verified HTTP 200 + image/jpeg, downloaded
          // and vision-confirmed (Swift in the black-bob showgirl look with pink
          // feathers in a dressing-room set — the era's press imagery, no
          // watermark).
          {
            url: 'https://www.hollywoodreporter.com/wp-content/uploads/2025/10/TLOASPromo-H-2025.jpg',
            credit: 'Mert Alas & Marcus Piggott / Republic Records, via The Hollywood Reporter',
            caption:
              'The album-era promo image that ran with the box-office coverage: the showgirl in her dressing room, feathers and all.',
            kind: 'archival',
            focalPoint: '53% 22%',
          },
        ],
      },
    },
    {
      slug: 'showgirl-four-million-week',
      significance: 'notable', // an outright industry record, the biggest album debut ever measured (docs/decisions.md, 2026-07-19)
      // Cross-links (ledger #976, 2026-07-20): the record the album (release-day)
      // set, powered by the vinyl week, alongside the concurrent Hot 100 sweep.
      relatedIds: [
          'moment:vault-tloas-twelve-weeks-at-no-1-through-the-entire-holiday-season',
          'moment:vault-tloas-luminates-2025-crown-5-6-million-units-no-contest',
          'moment:vault-tloas-a-record-setting-debut',
        'moment:vault-tloas-all-12-tracks-debut-as-the-hot-100s-entire-top-12',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-1-334-million-vinyl-lps-in-seven-days-the-first-million-viny',
        // Cross-link (candidate #1021): the personal best this week broke.
        'moment:vault-midnights-midnights-debuts-at-no-1-on-the-billboard-200',
      ],
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
          'The week (charts dated Oct. 18, 2025) counted 3,479,500 in pure album sales plus 680.9 million on-demand streams — 4.002 million equivalent units in total, the largest single week for any album, by both equivalent units and pure sales, since Billboard began tracking by Luminate\'s modern methodology in 1991. It ran roughly 2.5 times her own previous personal best, Midnights\' 1.578 million units in 2022, and passed the two records it beat: Adele\'s 3.482 million-unit 25 (2015) and *NSYNC\'s 2.416 million No Strings Attached (2000). She\'d cleared the decade-old Adele mark within five days — a record many chart-watchers had assumed the streaming era made permanently unreachable.\n\nIt was also her 15th No. 1 album, breaking the three-way tie with Drake and Jay-Z for the most Billboard 200 chart-toppers among soloists — only The Beatles, at 19, remain ahead. Universal reported more than 5.5 million equivalent units globally in week one. Her reaction, via Billboard: "I\'ll cherish this feeling forever."\n\nThe composition explains the shape: only two things counted toward 4.002 million — the 3,479,500 pure copies and 522,600 streaming-equivalent units from those 680.9 million streams, with no tracks sold à la carte. The pure-sales side ran on collecting: 1.334 million of it was vinyl, driven by 38 editions (16 CDs, two deluxe CD-plus-clothing boxes, eight vinyl, a cassette, 11 digital), most release-week-only — a variant strategy that drew chart-inflation criticism. The 680.9 million streams set 2025\'s biggest album week but no all-time mark — it ranks fourth all-time, behind her own Tortured Poets Department (891 million) and two Drake albums, so the platform records it set (Apple Music\'s and Amazon\'s biggest debuts) were day-one, not weekly. Abroad it opened at No. 1 in the UK (423,000 units, her biggest week there), Australia, Canada, New Zealand and Ireland. The theatrical Official Release Party that topped the weekend box office was a separate event, uncounted here. The front-loading showed a week later: it held No. 1 but fell to 338,000 units as pure sales collapsed 97% and streaming eased just 55%.\n\nAdele\'s 25 had actually held the biggest week on two separate counts — 3.482 million equivalent units and, in traditional album sales, about 3.387 million pure copies, set in 2015 when 25 was withheld from streaming. Showgirl passed both: its 4.002 million equivalent units and 3,479,500 pure copies mean it took the pure-sales crown too, not the streaming-inclusive one alone. Within that pure total, the 1.334 million on vinyl is the single most-quantified slice — dwarfing 25\'s roughly 22,000 vinyl copies — but Billboard did not itemize how the rest split across CD, cassette and paid downloads.\n\nThe variant strategy is the album\'s standing asterisk. Forbes and academic writers framed the 38 versions as chart-gaming; chart analyst Chris Molanphy agreed the week carries "an aftertaste" of repeat-buyer inflation — "this is chart gaming, but it\'s not payola," he wrote — while concluding the record still stands, because the album "would have debuted at No. 1 in any case, by a huge margin."\n\nThe numbers underneath fill in the shape. Day one alone — Friday, Oct. 3 — moved 2.7 million copies, which by itself outsold every album\'s full opening week in history except Adele\'s 25. The rout down-chart was total: the week\'s No. 2 title, the KPop Demon Hunters soundtrack, managed 96,000 units. Billboard published no debut-week "outsold the rest of the chart combined" figure — that line belongs to the UK, where it beat the entire Top 100, and to the 2025 year-end tally, where it topped the rest of the top 10 by 150,000. The four overseas No. 1s came without itemized counts but with records attached: the biggest Australian week since 2015 and another ARIA "chart double," Canada\'s biggest debut of the streaming era, and record-extending 15th No. 1s in Canada and New Zealand.',
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
          // Added 2026-07-20 (ledger #976): the global tally, the UK debut, and
          // the second-week hold that exposed the front-loading.
          {
            outlet: 'Republic Records / Universal Music (PR Newswire)',
            url: 'https://www.prnewswire.com/news-releases/taylor-swifts-the-life-of-a-showgirl-earns-biggest-first-week-in-music-history-with-over-4-million-us-and-over-5-5-million-global-album-equivalent-units-302582496.html',
            source_title: "The Life of a Showgirl Earns Biggest First Week in Music History — Over 4M US, Over 5.5M Global",
            publisher: 'Republic Records / Universal Music Group',
            source_type: 'official',
            accessed_at: '2026-07-20',
            reliability_score: 5,
          },
          {
            outlet: 'Official Charts Company',
            url: 'https://www.officialcharts.com/chart-news/taylor-swift-number-1-album-and-single/',
            source_title: "Taylor Swift scores biggest opening week of her career in the UK with The Life of a Showgirl",
            publisher: 'Official Charts Company (UK)',
            source_type: 'chart_database',
            accessed_at: '2026-07-20',
            reliability_score: 5,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2025/music/news/taylor-swift-stays-number-1-week-2-billboard-album-chart-1236556554/',
            source_title: "Taylor Swift Stays at No. 1 in Week 2 as 'The Life of a Showgirl' Sales Drop",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-20',
            reliability_score: 4,
          },
          // Added 2026-07-22 (ledger #1020): the pure- vs equivalent-units split
          // against Adele's 25, and the attributed variant/"chart-gaming" debate.
          {
            // Adele's 25 held the pure/traditional album-sales record (~3.387M),
            // distinct from its 3.482M equivalent-units figure; 25 was withheld
            // from streaming in 2015, so its week was almost entirely pure sales.
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-the-life-of-a-showgirl-first-week-sales-record-1235442979/',
            source_title: "Taylor Swift Breaks Adele's First-Week Sales Record for '25' With 'The Life of a Showgirl'",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 4,
          },
          {
            // Attributes the "gaming the system" / 38-variants criticism.
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/conormurray/2025/10/13/taylor-swifts-life-of-a-showgirl-debuts-with-record-breaking-4-million-album-units-on-billboard-chart/',
            source_title: "Taylor Swift's 'Life Of A Showgirl' Debuts With Record-Breaking 4 Million Album Units",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 4,
          },
          {
            // Chart analyst Chris Molanphy's "asterisk" verdict quoted in the text.
            outlet: 'Chris Molanphy',
            url: 'https://chris.molanphy.com/did-taylor-swift-really-have-the-biggest-album-debut-of-all-time-yes-with-an-asterisk-or-two/',
            source_title: 'Did Taylor Swift Really Have the Biggest Album Debut of All Time? Yes, With an Asterisk, or Two',
            publisher: 'Chris Molanphy (Hit Parade / Slate columnist)',
            source_type: 'expert_analysis',
            accessed_at: '2026-07-22',
            reliability_score: 4,
          },
          // Added 2026-07-24 (ledger #1020): the day-one 2.7M figure (Q3), the
          // down-chart / year-end "rest of the chart" comparisons (Q4), the
          // overseas benchmarks (Q7), and the streaming-week ranking (Q6).
          {
            outlet: 'Variety',
            url: 'https://variety.com/2025/music/news/taylor-swift-album-sales-first-day-billboard-million-showgirl-1236540366/',
            source_title: "Taylor Swift Sells 2.7 Million Copies of 'The Life of a Showgirl' on Day 1 — Already the Second-Best Tally for an Album's First Week in History",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2026/01/14/taylor-swift-dominates-2025s-bestselling-albums-list-by-a-huge-margin/',
            source_title: "Taylor Swift Dominates 2025's Bestselling Albums List By A Huge Margin",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-aria-chart-double-the-life-of-a-showgirl-1236107439/',
            source_title: "Taylor Swift Completes Another ARIA Chart Double With 'The Life of a Showgirl'",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'TheWrap',
            url: 'https://www.thewrap.com/taylor-swift-the-life-of-a-showgirl-streaming-records/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' Breaks Day 1 Streaming Records on Spotify, Apple and Amazon Music",
            publisher: 'TheWrap',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
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
            // Focal point set 2026-07-18 by viewing: face upper-center-right.
            focalPoint: '55% 22%',
          },
          // Added 2026-07-18 (photo-enrichment run 2, #762): official album
          // press photo Billboard ran with its 4-million-week chart coverage,
          // hosted on Billboard's own CDN (wp-content — an allowed outlet CDN,
          // not a Getty comp). Verified HTTP 200 + image/jpeg, downloaded and
          // vision-confirmed (Swift in the jeweled showgirl costume on the
          // theater-stage set from the album shoot; clean, no watermark).
          {
            url: 'https://www.billboard.com/wp-content/uploads/2025/08/03-taylor-swift-life-of-a-showgirl-pr-billboard-1800.jpg?w=942&h=628&crop=1',
            credit: 'Mert Alas & Marcus Piggott / Republic Records, via Billboard',
            caption:
              'The album-shoot press image Billboard ran with the record-shattering chart week: 4.002 million units, the biggest ever measured.',
            kind: 'archival',
            focalPoint: '54% 18%',
          },
        ],
      },
    },
    {
      slug: 'showgirl-spotify-records',
      significance: 'notable', // a genuinely fast record — the fastest platform milestone of its kind, in under half a day (docs/decisions.md, 2026-07-19)
      // Cross-link deficit closed (2026-07-21, depth ledger #992 Q7): this
      // platform-record page now threads to the song whose day-one number it
      // cites, the release anchor, and its sibling chart records.
      relatedIds: [
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-the-fate-of-ophelia-hamlets-drowned-girl-rescued-and-a-13th-',
        'moment:vault-tloas-a-mint-green-briefcase-on-new-heights-album-no-12-announced-',
        'moment:vault-tloas-4-002-million-in-a-week-the-biggest-album-debut-ever-measure',
        'moment:vault-tloas-1-334-million-vinyl-lps-in-seven-days-the-first-million-viny',
        'moment:vault-tloas-all-12-tracks-debut-as-the-hot-100s-entire-top-12',
      ],
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
          'The milestones stacked up hourly on Oct. 3. Before a note went public the album had already broken Spotify\'s all-time pre-save record — more than 6 million saves banked, past the mark her own Tortured Poets Department set in 2024. By midday it was 2025\'s most-streamed album in a single day, clearing the prior 2025 mark — Playboi Carti\'s Music, roughly 134.5 million first-day streams the previous March — in under 11 hours. That "under 11 hours" is when it passed Carti, not the counting window: by RouteNote\'s tally the full 24-hour day, from the midnight drop, closed near 251.5 million global streams. Spotify never published an exact clock time for the crossover.\n\nDay one also made "The Fate of Ophelia" the most-streamed song in a single day in Spotify history — RouteNote put it at 30.99 million, past her own "Fortnight." Across everything she has out, Oct. 3 was the single biggest streaming day for any artist in 2025 — about 309 million listens — and the second-biggest single-artist day Spotify has ever logged, behind only her own Tortured Poets release. The album\'s ~250 million single-day total is likewise second all-time to TTPD\'s 314 million: that mark\'s survival is the one release-week superlative Showgirl left standing.\n\nTwo of the marks were later certified by Guinness World Records, both dated Oct. 3: most pre-saved album on Spotify (6 million saves) and most-streamed track on Spotify in the first 24 hours ("The Fate of Ophelia," 30,987,370 filtered streams). The "biggest 2025 single-day album" figure stayed a Spotify-newsroom milestone — a year-qualified mark, not a certified all-time record. Deadline framed the whole day as a competition with exactly one participant: the only albums anywhere near her numbers are her own.',
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
          // Depth ledger #992 (2026-07-21): the "most-streamed song in a single
          // day" record is confirmed by Spotify's newsroom (above) and MBW; the
          // granular figures (251.5M album day, 30.99M for "Ophelia" past
          // "Fortnight", 309M artist-day) are RouteNote's tally of Spotify data
          // — reported, not officially itemised by Spotify, hence the lower score.
          {
            outlet: 'Music Business Worldwide',
            url: 'https://www.musicbusinessworldwide.com/taylor-swifts-the-fate-of-ophelia-becomes-most-streamed-song-in-a-single-day-on-spotify-as-new-album-shatters-records-across-platforms/',
            source_title: "Taylor Swift's 'The Fate of Ophelia' becomes most-streamed song in a single day on Spotify",
            publisher: 'Music Business Worldwide',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'RouteNote',
            url: 'https://routenote.com/blog/all-the-spotify-records-taylor-swift-broke-with-the-life-of-a-showgirl/',
            source_title: "All the Spotify records Taylor Swift broke with 'The Life of a Showgirl'",
            publisher: 'RouteNote',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
          },
          // Depth ledger #992 (2026-07-21, second pass): the prior-2025 holder
          // (Playboi Carti's Music, ~134.5M first day) via Rolling Stone; the two
          // Guinness World Records certifications (official record pages, figures
          // and Oct. 3 set-date verified this session). Exact crossover clock
          // time stays undocumented — left unstated rather than invented.
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-broke-spotify-record-stream-album-this-year-1235440264/',
            source_title: "Taylor Swift Broke a Spotify Record for the Most-Streamed Album in a Single Day This Year",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Guinness World Records',
            url: 'https://www.guinnessworldrecords.com/world-records/780188-most-pre-saved-album-on-spotify',
            source_title: 'Most pre-saved album on Spotify',
            publisher: 'Guinness World Records',
            source_type: 'official',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
          {
            outlet: 'Guinness World Records',
            url: 'https://www.guinnessworldrecords.com/world-records/494520-most-streamed-track-on-spotify-in-the-first-24-hours',
            source_title: 'Most streamed track on Spotify in the first 24 hours',
            publisher: 'Guinness World Records',
            source_type: 'official',
            accessed_at: '2026-07-21',
            reliability_score: 5,
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
            // Focal point set 2026-07-18 by viewing: her face is centered,
            // upper-middle of the frame amid the red feather fans.
            focalPoint: '50% 35%',
          },
          // Added 2026-07-18 (photo-enrichment run 2, #762): the album-era
          // portrait Spotify itself ran with its streaming-record newsroom post,
          // hosted on Spotify's own newsroom CDN (storage.googleapis.com/
          // pr-newsroom-wp — the newsroom's image host). Verified HTTP 200 +
          // image/jpeg, downloaded and vision-confirmed (red-feather showgirl
          // portrait from the album package; clean, no watermark).
          {
            url: 'https://storage.googleapis.com/pr-newsroom-wp/1/2025/10/5_RedFront-1440x1440.jpg',
            credit: 'Mert Alas & Marcus Piggott / Republic Records, via Spotify Newsroom',
            caption:
              'The album-package portrait Spotify published alongside its announcement that the 2025 single-day streaming record had fallen in under 11 hours.',
            kind: 'archival',
            focalPoint: '47% 40%',
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
      // Cross-link deficit closed (2026-07-21, depth ledger #990 Q8): the vinyl
      // haul is the engine of the pure-sales side of the 4M week, so it now
      // threads to the release and the other Showgirl chart-record pages.
      relatedIds: [
        'moment:vault-tloas-4-002-million-in-a-week-the-biggest-album-debut-ever-measure',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-spotifys-2025-single-day-streaming-record-falls-in-under-11-',
        'moment:vault-tloas-all-12-tracks-debut-as-the-hot-100s-entire-top-12',
        'moment:vault-tloas-an-album-release-party-wins-the-box-office-34-1m-domestic-50',
      ],
      title: '1.334 million vinyl LPs in seven days — the first million-vinyl week ever tracked',
      snippet:
        'No album had ever sold a million vinyl copies in a week since modern tracking began. Showgirl did 1.334 million, blowing past her own record of 859,000 set by The Tortured Poets Department.',
      sourceUrl: 'https://www.forbes.com/sites/hughmcintyre/2025/10/08/taylor-swift-shatters-the-all-time-vinyl-sales-record-in-a-matter-of-hours/',
      thumbnailUrl: null,
      moment: {
        context:
          'The push came from a stack of collectible pressings in the era\'s signature orange — multiple variants, retailer exclusives included, sold as objects to own as much as records to play. Forbes tracked the record falling within hours of release day, not at week\'s end: her own all-time vinyl mark of 859,000, set by The Tortured Poets Department in 2024, was gone almost immediately, and the week closed at 1.334 million LPs.\n\nNPR\'s analysis noted the number is less about turntables than fandom-as-collecting — a physical-object economy she has done more than anyone to revive, where a pressing in the right shade of orange is a fan artifact first and an audio format second. The vinyl haul was the engine of the pure-sales side of her 4-million-unit week, and the reason a 2025 blockbuster could post sales splits that look like the CD era.\n\nThe number sat atop a lineage she built and kept breaking: 859,000 (TTPD, 2024) had toppled 693,000 (1989 (Taylor\'s Version)), which beat 570,000 (Midnights) — every modern-era vinyl-week record since Luminate began tracking in 1991 has been hers, and Showgirl\'s 1.334 million is the first million ever counted, with TTPD\'s 859,000 now the No. 2 week behind it. Eight distinct vinyl variants drove it: the standard "Sweat and Vanilla Perfume" Portofino-orange-glitter LP, the Target-exclusive "The Crowd Is Your King" pink shimmer, and six limited "first and only pressing" webstore drops — the "Shiny Bug" pair (Wintergreen & Onyx and Violet Shimmer), the "Baby, That’s Showbiz" pair (Lakeside Beach Blue Sparkle and Lovely Bouquet Golden) and the "Tiny Bubbles in Champagne" pair (Red Lipstick & Lace and Under Bright Lights Pearlescent); per-variant pressing figures were never disclosed. Vinyl was 1.334 million of the roughly 3.48 million pure copies inside the 4.002-million-unit week — the album led every format (CD, vinyl, cassette, digital) and finished 2025 as the year\'s top seller on each. The record was not only American: in the UK it moved about 125,000 LPs in week one, the fastest-selling vinyl album of the century and the biggest UK vinyl week since those records began in 1994, inside a 423,000-unit British debut.\n\nThe pure-sales week broke down as 1.76 million CDs, the 1.334 million LPs, 358,000 digital downloads and 26,000 cassettes, with zero à-la-carte track sales; Billboard estimated the album grossed roughly $135 million in seven days, vinyl priced from $34.99 and CD-plus-apparel bundles at $65–$70. Forbes was explicit that the million-vinyl week was a first "for any artist in history," and that the old 859,000 mark fell on release day itself — about 1.2 million LPs moved on day one alone.\n\nThe variant strategy that built the number drew its own documented criticism. In The Conversation, University of Bath marketing scholar Annayah Prosser argued the two-dozen-plus editions inflate the charts by design — since "every album purchased (regardless of the format or cover image) is valued" — and called vinyl\'s materials "unsustainable," noting Swift "hasn\'t experimented with eco-friendly alternatives." A University of Glasgow study led by Prof. Matt Brennan found about a quarter of surveyed Swift fans (26%) would consider a plastic-free release. Neither Swift nor Republic publicly answered the sustainability or chart-inflation critiques, and per-variant pressing figures were never disclosed.',
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
          // Depth ledger #1303 (2026-07-24): the reception axis (attributed
          // chart-inflation + sustainability criticism) and the non-vinyl format
          // split / week-one gross that the number sat inside.
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-life-of-a-showgirl-how-much-money-make-week-1/',
            source_title: "How Much Money Did Taylor Swift Earn in the First Week of 'Life of a Showgirl'?",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'The Conversation',
            url: 'https://theconversation.com/taylor-swifts-aggressive-marketing-guarantees-success-no-matter-what-the-music-sounds-like-266812',
            source_title: "Taylor Swift's aggressive marketing guarantees success – no matter what the music sounds like",
            publisher: 'The Conversation',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'University of Glasgow',
            url: 'https://www.gla.ac.uk/news/archiveofnews/2025/february/headline_1148110_en.html',
            source_title: "Taylor Swift fans may be ready to 'Shake Off' plastic vinyl records, new University of Glasgow study shows",
            publisher: 'University of Glasgow',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          // Depth ledger #990 (2026-07-21): variant count + format leadership,
          // the modern-era record lineage, and the UK vinyl record.
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/luminate-2025-year-end-music-report-taylor-swift-showgirl/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' Is Luminate's Top Album of 2025 in U.S.",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2024/music/news/vinyl-tortured-poets-department-breaks-record-weekly-sales-1235978774/',
            source_title: "'Tortured Poets Department' Breaks Record for Weekly Vinyl Sales in Just Three Days",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Official Charts',
            url: 'https://www.officialcharts.com/chart-news/taylor-swift-number-1-album-and-single/',
            source_title: 'Taylor Swift lands the biggest opening week of her career in the UK with The Life Of A Showgirl',
            publisher: 'Official Charts Company',
            source_type: 'chart_database',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
          // Depth ledger #1303 Q1 (2026-07-25): the full eight-variant roster —
          // the standard Portofino orange, the Target "Crowd Is Your King" pink
          // shimmer, and the six limited webstore "first and only pressing" drops.
          {
            outlet: 'Capital',
            url: 'https://www.capitalfm.com/news/taylor-swift-life-of-a-showgirl-variants-album-covers/',
            source_title: "Every Taylor Swift 'The Life of a Showgirl' vinyl variant and album cover",
            publisher: 'Capital FM',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
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
            // Focal point set 2026-07-18 by viewing: the held-up LP jacket is
            // the subject, center-right of frame.
            focalPoint: '55% 45%',
          },
          // Added 2026-07-18 (photo-enrichment run 2, #762): official promo
          // for the Target-exclusive "The Crowd Is Your King" vinyl variant —
          // one of the collectible pressings that powered the million-vinyl
          // week — hosted on Billboard's own CDN. Verified HTTP 200 +
          // image/jpeg, downloaded and vision-confirmed (Swift in showgirl
          // corset holding the vinyl in the era's pink dressing-room set;
          // clean, no watermark).
          {
            url: 'https://www.billboard.com/wp-content/uploads/2025/09/taylor-swift-the-crowd-is-your-king-billboard-1800.jpg',
            credit: 'Courtesy of Republic Records, via Billboard',
            caption:
              'The Target-exclusive "The Crowd Is Your King" edition, one of the stack of collectible pressings behind the 1.334 million-LP week.',
            kind: 'archival',
            focalPoint: '48% 16%',
          },
        ],
      },
    },
    {
      slug: 'showgirl-hot-100-top-12-sweep',
      significance: 'defining', // a feat only she's pulled off, repeated and extended past her own Midnights record (docs/decisions.md, 2026-07-19)
      // Cross-link deficit closed (2026-07-21, depth ledger #996 Q8): the sweep
      // now threads to the three songs it names (Ophelia/Opalite/Elizabeth
      // Taylor), the same-week Billboard 200 debut, and its chart-record
      // siblings — not only the Midnights precedent.
      relatedIds: [
        'moment:vault-midnights-every-spot-in-the-hot-100-top-10-all-at-once',
        'moment:vault-tloas-the-fate-of-ophelia-hamlets-drowned-girl-rescued-and-a-13th-',
        'moment:vault-tloas-opalite-follows-ophelia-to-no-1',
        'moment:vault-tloas-elizabeth-taylor-the-first-song-she-wrote-for-the-album',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-4-002-million-in-a-week-the-biggest-album-debut-ever-measure',
        'moment:vault-tloas-spotifys-2025-single-day-streaming-record-falls-in-under-11-',
        'moment:vault-tloas-1-334-million-vinyl-lps-in-seven-days-the-first-million-viny',
      ],
      year: 2025,
      month: 10,
      day: 18,
      category: 'business',
      title: "All 12 tracks debut as the Hot 100's entire top 12",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-tloas-4", label: "Hot 100 sweep", kind: "award" },
      snippet:
        'Every song on the album landed inside the top 12 of the Hot 100 in its first week — the whole tracklist, in a block — making her the first artist ever to monopolize the chart\'s top 10 three separate times.',
      sourceUrl: 'https://www.billboard.com/lists/taylor-swift-hot-100-fate-of-ophelia-number-one/',
      thumbnailUrl: null,
      moment: {
        context:
          'On the Hot 100 dated Oct. 18, 2025, the chart\'s top 12 and the album\'s 12-song tracklist were the same list, in order: "The Fate of Ophelia" (No. 1), "Opalite" (2), "Elizabeth Taylor" (3), "Father Figure" (4), "Wood" (5), "Wi$h Li$t" (6), "Actually Romantic" (7), "The Life of a Showgirl" feat. Sabrina Carpenter (8), "Eldest Daughter" (9), "Cancelled!" (10), "Ruin the Friendship" (11) and "Honey" (12) — with nothing else, no other artist or song, inside the top 12. Billboard called it the first album ever to place all its songs uninterrupted from the top of the chart on down.\n\n"The Fate of Ophelia" arrived as the 1,184th No. 1 in Hot 100 history and Swift\'s 13th career chart-topper — tying for the fourth-most ever — on 92.5 million official U.S. streams, the most for any title in a single week since streams became the metric\'s sole contributor in September 2020 — past the 76.4 million of Post Malone\'s "I Had Some Help" in 2024 — plus 38.5 million in radio-airplay impressions. The week added 10 new top-10 debuts, lifting her to 69 career top 10s, the most of any woman.\n\nShe first filled the entire top 10 with Midnights in November 2022, then outdid herself with The Tortured Poets Department\'s top-14 sweep in May 2024 — the only act ever to monopolize the top 10, now three times over. But the shape was unique. Midnights spilled 10 more debuts down to No. 45 (20 songs that week) and TTPD another 17 down to No. 55 (31 total); Showgirl\'s twelve tracks filled exactly the top 12 and stopped — a clean tracklist-equals-top-12 match possible only because she kept the album short. The yardstick before her was the Beatles\' entire top five in April 1964, which stood more than fifty years; no act held the whole top 10 until her Midnights sweep (Drake had come closest, nine of ten, in 2021). That makes her the only act to sweep the top 10 at all, and twelve-for-twelve the most complete domination the Hot 100 has recorded.',
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
          // Depth ledger #996 (2026-07-21): corroborating second source for the
          // sweep, plus the full No. 1-12 grid and the per-week shape breakdown.
          {
            outlet: 'Variety',
            url: 'https://variety.com/2025/music/news/taylor-swift-hot-100-history-12-songs-showgirl-chart-1236551607/',
            source_title: "Taylor Swift Makes Hot 100 History With All 12 Songs From 'Showgirl' Occupying the Top 12",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          // Depth ledger #996 (2026-07-21, second pass): the historical yardstick.
          // Ultimate Classic Rock documents the Beatles' April 1964 top-five;
          // Billboard's own chart recap confirms she is the only act ever to hold
          // the entire top 10 (three times) and enumerates the women's records.
          {
            outlet: 'Ultimate Classic Rock',
            url: 'https://ultimateclassicrock.com/beatles-billboard-top-five/',
            source_title: 'When the Beatles Held the Top 5 Spots on the Billboard Hot 100',
            publisher: 'Ultimate Classic Rock',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
          },
          {
            outlet: 'Billboard',
            url: 'https://billboard.substack.com/p/here-are-all-the-billboard-chart',
            source_title: 'Here Are All the Billboard Chart Records Taylor Swift Broke With The Life of a Showgirl',
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): portrait is from Billboard's
        // own coverage of this chart week (billboard.com/wp-content, filename
        // carries the Mert Alas & Marcus Piggott credit); downloaded and
        // vision-confirmed 1800x1200, unwatermarked. Focal points set per image
        // by inspection.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2025/10/taylor-swift-2025-cr-Mert-Alas-Marcus-Piggot-billboard-1800.jpg',
            credit: 'Mert Alas & Marcus Piggott / TAS Rights Management, via Billboard',
            caption:
              'A Showgirl-era portrait by the album\'s photographers, Mert Alas and Marcus Piggott — run with Billboard\'s coverage of the week the tracklist WAS the top 12.',
            kind: 'primary',
            focalPoint: '48% 15%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/0/09/Taylor_Swift_%E2%80%93_The_Fate_of_Ophelia_%28CD_single_cover%29.png',
            credit: 'Single artwork / Republic Records, via Wikipedia',
            caption:
              '"The Fate of Ophelia" single artwork — the song that led the album\'s wall-to-wall occupation of the Hot 100\'s top 12 from No. 1.',
            kind: 'archival',
            focalPoint: '38% 22%',
          },
          // Photo pass 2026-07-19 (bulk-to-6+, docs/decisions.md): 2 more,
          // from official videos of the other 2 songs named in this item's
          // own text. oEmbed-verified both belong to @TaylorSwift's channel
          // (a same-titled "Opalite Official Music Video" upload from a
          // different, non-official channel was found and rejected).
          {
            url: 'https://i.ytimg.com/vi/4Mg_Qtr6Osg/maxresdefault.jpg',
            focalPoint: '62% 42%',
            credit: 'Taylor Swift / Republic Records, via YouTube',
            caption: 'A frame from the official "Elizabeth Taylor" visualizer — No. 3 on the same chart week.',
            kind: 'archival',
          },
          {
            url: 'https://i.ytimg.com/vi/4FUIEcnvT04/maxresdefault.jpg',
            focalPoint: '50% 30%',
            credit: 'Taylor Swift / Republic Records, via YouTube',
            caption: 'A frame from the official "Opalite" visualizer — No. 2 on the same chart week.',
            kind: 'archival',
          },
        ],
      },
    },

    // --- Song stories (music).
    {
      slug: 'fate-of-ophelia-lead-single',
      // Cross-links added 2026-07-21 (ledger #1002, cross-links deficit): the
      // lead single is the hub of the release cluster. Every id below was
      // verified to resolve against the generated vault (no silent drops).
      relatedIds: [
          'moment:vault-tloas-the-fate-of-ophelia-video-premieres',
          'moment:vault-tloas-the-rock-hall-puts-the-ophelia-gown-in-legends-of-rock',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-all-12-tracks-debut-as-the-hot-100s-entire-top-12',
        'moment:vault-tloas-spotifys-2025-single-day-streaming-record-falls-in-under-11-',
        'moment:vault-tloas-the-official-release-party-of-a-showgirl-turns-movie-theater',
        'moment:vault-tloas-opalite-follows-ophelia-to-no-1',
        'moment:vault-tloas-elizabeth-taylor-the-first-song-she-wrote-for-the-album',
        // Reciprocal of the portraits page's new link (ledger #1431): the Ophelia
        // bathtub COVER and this Ophelia opening SINGLE are one Millais conceit.
        'moment:vault-tloas-the-showgirl-portraits-mert-and-marcus-rhinestones-and-an-op',
      ],
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
          'Released Oct. 3, 2025 as the lead single and opening track, the song reworks Hamlet: where Millais\'s Ophelia (the muse was Pre-Raphaelite model Elizabeth Siddal) drowns, Swift imagined a version who instead "met someone who treated her well" and is pulled from the water. She has said she has a "fixation on Shakespeare characters that I fall in love with and I can\'t stand to see them meet a tragic demise," and named it the lead single when she announced the album on Kelce\'s New Heights podcast. The liner credits are Swift, Max Martin and Shellback alone — no other co-writer or sample — cut at Shellback Studios and MXM Studios in Stockholm between Eras Tour dates. It debuted atop the Billboard Hot 100 — her 13th No. 1 — opening its reign on the Oct. 18, 2025 chart; it briefly slipped to No. 28 in the holiday streaming rush, then climbed back to log a 10th week on the Jan. 17, 2026 chart — 10 non-consecutive weeks in all, her longest-running No. 1, out-running "Anti-Hero"\'s eight.\n\nSwift wrote and directed the video herself, shot by cinematographer Rodrigo Prieto and choreographed by Eras Tour choreographer Mandy Moore, with Eras dancers (Jan Ravnik, Kam Saunders) returning; it premiered inside the theatrical Official Release Party of a Showgirl before its YouTube debut two days later, moving through vaudeville and showgirl tableaux — Marilyn-style stagecraft, 1960s go-go dancing, Busby Berkeley-scale synchronized-swim formations. The chorus choreography became a genuine trend, recreated by fans and by public figures from Australian PM Anthony Albanese — gamely, on Melbourne\'s Nova 100 — to India\'s Shashi Tharoor.\n\nThe single was the era\'s commercial spine: it led the Billboard Global 200 for seven weeks and set Spotify\'s single-day song-streaming record on release day. Abroad it became her longest-running UK No. 1 (seven weeks, past "Anti-Hero"\'s six) and hit No. 1 in Australia, Canada (15 weeks) and Ireland (nine); BPI and ARIA each certified it double platinum. Critics engaged the opener directly, and split on it. NPR\'s Ann Powers heard its "huge and buoyant" bass and a voice that "sounds smitten and a bit hungry," and Rolling Stone\'s Maya Georgi praised its "tantalizing" melody and "wondrous" mix — the magazine later ranked it the eighth-best song of 2025. The Shakespeare conceit drew the sharpest dissent: The New York Times\' Lindsay Zoladz felt Swift reduced Ophelia to "just another princess waiting for her Prince Charming," The Times\' Will Hodgkinson judged the analogy "doesn\'t really work," and Stereogum\'s Tom Breihan said the song "misses the entire point" of the tragedy while still landing as engaging "writerly excess."',
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
          // Depth ledger #1002 (2026-07-21): primary reporting added to replace
          // the Wikipedia lean — video production credits, the song's own
          // critical reception, the UK reign, and the Albanese trend.
          {
            // Reign narrative (2026-07-24, ledger #1002 Q1): dethrones
            // "Anti-Hero" as her longest-running No. 1 and traces the
            // Oct.-2025 -> Jan.-2026 run, incl. the holiday No. 28 dip and
            // return. Reception quotes (Georgi/Zoladz/Hodgkinson/Breihan)
            // verified this session against the song's Wikipedia reception
            // section and its cited reviews.
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-the-fate-of-ophelia-passes-anti-hero-number-1-1235494237/',
            source_title: "'The Fate of Ophelia' Dethrones 'Anti-Hero' as Taylor Swift's Longest-Running Number One",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            // Video premiere + production framing (self-directed, theatrical debut).
            outlet: 'Variety',
            url: 'https://variety.com/2025/music/news/taylor-swift-fate-of-ophelia-music-video-premiere-youtube-1236540694/',
            source_title: "Taylor Swift Debuts 'Fate of Ophelia' Music Video on YouTube",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            // Choreographer Mandy Moore on record about the video shoot; also
            // corroborates the returning Eras Tour performers.
            outlet: 'Extra',
            url: 'https://extratv.com/2025/10/08/taylor-swifts-choreographer-mandy-moore-talks-fate-of-ophelia-video-exclusive/',
            source_title: "Taylor Swift's 'Fate of Ophelia' Choreographer Mandy Moore Spills on Video Shoot",
            publisher: 'Extra',
            source_type: 'interview',
            accessed_at: '2026-07-21',
            reliability_score: 3,
          },
          {
            // Cinematographer Rodrigo Prieto and production designer Ethan Tobman credits.
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-the-fate-of-ophelia-music-video-watch-1236393494/',
            source_title: "Taylor Swift Releases Music Video for 'The Fate of Ophelia': Watch",
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            // Critical reception of the opener itself — Ann Powers's track-one
            // read ("huge and buoyant" bass, voice "smitten and a bit hungry"),
            // verified verbatim against the review this session.
            outlet: 'NPR',
            url: 'https://www.npr.org/2025/10/03/nx-s1-5558007/taylor-swift-the-life-of-a-showgirl-review',
            source_title: "On 'The Life of a Showgirl,' Taylor Swift feels love's glow and the spotlight's glare",
            publisher: 'NPR',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            // Longest-running UK No. 1 (seven weeks, past "Anti-Hero").
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-the-fate-of-ophelia-uk-number-one-single-seventh-week-1236129156/',
            source_title: "'The Fate of Ophelia' Is Taylor Swift's Longest-Running U.K. No. 1",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
          {
            // The Albanese choreography attempt (occasion + venue).
            outlet: 'The Nightly',
            url: 'https://thenightly.com.au/politics/anthony-albanese-attempts-viral-tiktok-dance-to-taylor-swifts-the-fate-of-ophelia-c-20700569',
            source_title: "Anthony Albanese attempts viral TikTok dance to Taylor Swift's The Fate of Ophelia",
            publisher: 'The Nightly',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
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
            // Focal points (2026-07-18, #762): set per image by inspection.
            // Cover: Swift sits on the dressing-room vanity left of center,
            // face upper-left.
            focalPoint: '38% 22%',
          },
          {
            url: 'https://i.ytimg.com/vi/ko70cExuzZM/hqdefault.jpg',
            credit: 'Taylor Swift / Republic Records (official music video thumbnail, YouTube)',
            caption:
              'From the self-written, self-directed music video that premiered in theaters before hitting YouTube.',
            kind: 'archival',
            // MV frame: showgirl headdress center frame, face upper-middle.
            focalPoint: '48% 35%',
          },
        ],
      },
    },
    {
      slug: 'father-figure-george-michael',
      // Cross-links (ledger #1030, 2026-07-21): the album it opens, and the
      // masters/Big Machine story critics read the song as retelling from the
      // patron's side.
      relatedIds: [
          'moment:vault-lover-my-worst-case-scenario-scooter-braun-buys-big-machine-and-he',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-reputation-she-leaves-big-machine-for-republic-and-owns-her-masters-goi',
      ],
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
          'Michael\'s original gets a formal songwriting credit on the track — George Michael is listed as a writer alongside Swift, Max Martin, and Shellback, since the song lifts the melody and the "I\'ll be your father figure" line directly. The estate\'s public statement framed it as an "association between two great artists," one of the warmest legacy-artist endorsements any of her interpolations has drawn, and pointedly noted they were approached before release rather than after.\n\nSwift\'s version flips the phrase from seduction to power: she has described the song as a mentor-and-protégé story told from the mentor\'s side, saying she drew on Succession\'s Logan Roy for the voice — though she added that she has lived the protégé\'s side of it. Critics heard the autobiography immediately, reading lines about finding someone young and profiting from their success as her Big Machine signing and the masters dispute retold from behind the boss\'s desk. Pitchfork singled it out as the album\'s most direct appraisal of her own power. She placed the reference-point herself, telling Jimmy Fallon (Oct. 6, 2025) she\'d drawn the mentor\'s voice from Succession\'s Logan Roy.\n\nMechanically it is an interpolation, not a sample: the hook and melody were re-recorded rather than lifted from Michael\'s master, so only his songwriting rights — not the recording, which Sony controls — had to be cleared, and the estate collects as a credited co-writer rather than through the label. The liner-note credits bear out the rebuilt-not-sampled reading: beyond producers Swift, Max Martin and Shellback, the arrangement was reassembled by Max Martin\'s Stockholm circle — Mattias Bylund on orchestra arrangements and Hammond organ over a live string section (violinist Erik Arvinder, cellist David Bukovinsky among others), with Shellback playing bass, drums, guitar and Omnichord — recorded at the MXM and Shellback studios, mixed by Serban Ghenea and mastered by Randy Merrill. Never worked to radio as its own single, it still debuted at No. 4 on both the Hot 100 and the Global 200 and reached the top five in Australia, Canada, Germany, Sweden and Greece, going Platinum in Australia and Canada and later certified Silver in the UK and Gold in New Zealand.\n\nMichael\'s publishing is administered by Warner Chappell Music, but the clearance itself came from the estate — George Michael Entertainment, the company David Austin has run since Michael\'s 2016 death — and the interpolation added no living co-writer, crediting Michael alone alongside Swift, Martin and Shellback. The statement read partly as generosity because the estate is otherwise fiercely protective of the catalog: in 2022 it had Tory Lanez\'s unauthorized "Careless Whisper" sample pulled from streaming after formally declining permission the year before, and moved on other uncleared samples too. The "no hesitation" message itself was posted on the estate\'s Instagram and signed "George Michael Entertainment," not attributed to any one person by name. Past the debut the song drew only a lyric video and a visualizer — no standalone narrative clip, no dedicated single push, no live performance to date — and no further public word from Austin or the estate reacting to the finished record has surfaced.',
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
          // Added 2026-07-21 (ledger #1030): the interpolation-vs-sample
          // mechanics and the pre-release estate announcement.
          {
            outlet: 'The Conversation',
            url: 'https://theconversation.com/taylor-swifts-father-figure-isnt-a-cover-but-an-interpolation-what-that-means-and-why-it-matters-265583',
            source_title: "Taylor Swift's Father Figure isn't a cover, but an 'interpolation'. What that means – and why it matters",
            publisher: 'The Conversation',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-father-figure-george-michael-1236392324/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' to Feature an 'Interpolation' of George Michael's 'Father Figure'",
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          // Added 2026-07-25 (ledger #1030 Q1/Q4): estate administration +
          // the catalog's licensing protectiveness that frames the blessing.
          {
            outlet: 'Variety',
            url: 'https://variety.com/2022/music/news/george-michael-tory-lanez-careless-whisper-sample-1235204177/',
            source_title: "George Michael Estate Smacks Down Tory Lanez's Unauthorized 'Careless Whisper' Sample",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          // Added 2026-07-25 (ledger #1030 Q3): the statement's channel and
          // "George Michael Entertainment" sign-off (no named individual).
          {
            outlet: 'The Mirror US',
            url: 'https://www.themirror.com/entertainment/music/george-michael-taylor-swift-reference-1425956',
            source_title: "George Michael's estate speaks out on Taylor Swift honoring late singer's Father Figure",
            publisher: 'The Mirror US',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
        ],
        // Lyric-video id 98SmlWOKuME verified via oEmbed against
        // @TaylorSwift; Commons photo license-checked (public domain,
        // University of Houston Digital Library, Faith World Tour 1988).
        // Photo pass #762 run 9 (2026-07-18): 480x360 hqdefault raised to the
        // same video's 1280x720 maxres render; both images downloaded and
        // viewed for focal points.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/98SmlWOKuME/maxresdefault.jpg',
            credit: 'Taylor Swift / Republic Records (official "Father Figure" lyric video thumbnail, YouTube)',
            kind: 'primary',
            caption: 'The official lyric video for "Father Figure."',
            // Taylor in showgirl headdress on the right edge, face upper right.
            focalPoint: '78% 28%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/George_Michael_%28cropped%29.jpeg',
            credit: 'University of Houston Digital Library, public domain, via Wikimedia Commons',
            caption:
              'George Michael on the Faith World Tour in Houston, 1988 — the era of the original "Father Figure" his estate cleared Swift to rebuild.',
            kind: 'archival',
            // Tall B&W portrait: face in the upper quarter, slightly right.
            focalPoint: '54% 26%',
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
      // Cross-link (candidate #1105, 2026-07-25): the prior track five, "So Long,
      // London," whose grief tradition this one defines itself against.
      relatedIds: ['moment:vault-ttpd-so-long-london-keeps-her-track-five-tradition-alive'],
      title: 'Eldest Daughter: the first track five that ends somewhere safe',
      snippet:
        'The album\'s track five — the slot fans expect to hurt — names "eldest daughter syndrome," the firstborn\'s job of holding everything together. But unlike every track five before it, this one resolves into reassurance instead of grief.',
      sourceUrl: 'https://time.com/7322849/taylor-swift-eldest-daughter-the-life-of-a-showgirl-track-5/',
      thumbnailUrl: null,
      moment: {
        context:
          'At 4:06 it\'s the longest song on the album — a minor-key piano ballad in a tracklist otherwise built on Max Martin bounce. The lyric plays directly on "eldest daughter syndrome": the firstborn who calls herself the "first lamb to the slaughter," dressed up as a wolf so nobody worries. Swift\'s own track commentary framed it as a song about the gap between the public self and the private one — "the life you show to others... and the \'you\' that only those closest know."\n\nTime read it as a deliberate turn in the track-five tradition she once described discovering by accident — the vulnerable song instinctively sequenced fifth, a slot fans treat as canon and Swift has admitted has become a "pressurized decision." It keeps the confessional register of its predecessors while, for the first time in the tradition\'s history, landing on being taken care of rather than being wrecked: the eldest daughter gets to put the wolf costume down — the grief lineage the page threads back to "So Long, London."\n\nFor all that it stands apart on the record, its credits don\'t: like the rest of the album it\'s a Swift / Max Martin / Shellback three-way co-write and production, the lone minor-key piano ballad on an otherwise up-tempo Max Martin set rather than a solo departure. Spotify\'s published runtimes confirm the 4:06 length is the longest of the twelve tracks (the Sabrina Carpenter–featuring title track is next at 4:01). On the Hot 100 dated Oct. 18, 2025 it both debuted and peaked at No. 9 — its slot inside the album\'s record top-12 sweep — and had slipped to No. 29 by its fourth week. No official music video was made: only the lyric/visualizer clip lives on Swift\'s channel, and with the Eras Tour already closed in Vancouver in December 2024, she has not performed it live.\n\nCritics split sharply on it. Rolling Stone\'s Maya Georgi praised its "brutal admissions" and RTÉ\'s Sarah McIntyre called it "gorgeously vulnerable," while a cluster of reviewers made it the album\'s low point over its internet-slang lyrics — News.com.au\'s Nick Bond found lines "cringeworthy," Paste\'s Casey Epstein-Gross wrote it "collapses into secondhand embarrassment," and The A.V. Club\'s Mary Kate Carr and The New Yorker each singled it out among the weakest tracks. Several tied it to Swift\'s earlier perseverance-and-perfectionism songs, "The Archer" and "mirrorball."',
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
          // Ledger #1103 (2026-07-27): credits (Swift/Martin/Shellback co-write),
          // the 4:06 longest-track fact, no official MV / no live performance,
          // and the divided critical reception (RS/RTÉ vs. News.com.au/Paste/
          // AV Club/New Yorker; ties to "The Archer" and "mirrorball").
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Eldest_Daughter',
            source_title: 'Eldest Daughter',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-27',
            reliability_score: 2,
          },
          // Ledger #1103 Q2 (2026-07-27): the No. 9 debut-and-peak inside the
          // album's Hot 100 top-12 sweep.
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-hot-100-fate-of-ophelia-number-one/',
            source_title: 'Taylor Swift Takes Top 12 Spots on Billboard Hot 100, Led by ‘The Fate of Ophelia’',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-27',
            reliability_score: 4,
          },
        ],
        // Lyric-video id HwQnW_ZRKhc verified via oEmbed against @TaylorSwift.
        // Photo-enrichment pass (2026-07-18, #762): no verifiable second image
        // exists for this page — a studio track with no photographable event;
        // the maxres frame of the same video would be a near-duplicate.
        // Left at one photo deliberately.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/HwQnW_ZRKhc/hqdefault.jpg',
            credit: 'Taylor Swift / Republic Records (official "Eldest Daughter" lyric video thumbnail, YouTube)',
            caption: 'The official lyric video for "Eldest Daughter," the album\'s track five.',
            kind: 'primary',
            // Focal point by inspection: Swift at the piano on the frame's
            // right edge, title text left — keep the right side in crops.
            focalPoint: '85% 38%',
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
      // Cross-links (ledger #1028, 2026-07-21): the closer carried zero links.
      // Thread it to the album it ends, the Vancouver Eras closer whose crowd
      // audio plays over its final seconds (the filed crosslink candidate), and
      // the opener it bookends.
      relatedIds: [
          'moment:vault-ttpd-sabrina-carpenter-crashes-the-superdome',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-the-final-show-the-full-vancouver-closer-streaming-at-last',
        'moment:vault-tloas-the-fate-of-ophelia-hamlets-drowned-girl-rescued-and-a-13th-',
      ],
      title: 'The title track hands the last word to Sabrina Carpenter',
      snippet:
        'The album\'s only feature closes it: Sabrina Carpenter — who opened the Eras Tour\'s first leg before her own breakout — duets on "The Life of a Showgirl," a showgirl passing hard-won stage wisdom to the next one up.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
      thumbnailUrl: null,
      moment: {
        context:
          'The song tells the story of a veteran performer named Kitty and the young singer studying her, and the casting does the subtext: Carpenter went from Eras Tour opener in 2023-24 to arena headliner in her own right by the time the album dropped. It was the pairing fans most wanted from the tracklist reveal on New Heights, and the reason the feature stayed the announcement\'s biggest talking point through release week.\n\nThe track doubles as the album\'s mission statement — the "life of a showgirl" the title promises turns out to be Kitty\'s hard-won stage wisdom, handed down the way the real Swift-Carpenter relationship played out in stadium wings for two years. The lyric sheet closes on a scripted curtain-call exchange between the two of them — Swift\'s "Give it up for the band / And the dancers / And of course, Sabrina," answered by Carpenter\'s "I love you, Taylor!" — laid over real crowd noise recorded at the final Eras Tour show in Vancouver, folding the tour\'s actual sound into the album\'s closing minutes. Ending the record on a duet with her own former opener made the succession theme explicit: the album about being a showgirl closes by introducing the next one.\n\nOn the Hot 100 dated Oct. 18, 2025 the title track debuted and peaked at No. 8 inside the album\'s record top-12 sweep, credited to Swift with Max Martin and Shellback — Carpenter a featured vocalist, not a co-writer. Swift confirmed the closing crowd roar is real: her Amazon Music intro says it "transports me back" to standing onstage for the last time on the Eras Tour (the Vancouver/BC Place date is tour record, not something she names in the audio). Rolling Stone heard the succession theme plainly, calling it Swift "passing the torch to the next generation of showgirls as she takes a bow" and noting Carpenter "takes a full verse and even harmonizes with her idol" on the sped-up, showtune-y bridge; Variety set it beside "Clara Bow" as a "narrative tale of weathered entertainers passing down homespun and hard-fought wisdom," "an outlier, but an anthemic one to go out on." (Pitchfork and The Guardian reviewed the album without singling the closer out.) "Kitty," the veteran who "made her money being pretty and witty," reads as an invented persona — no source ties the name to a specific real showgirl or film — and Swift framed the song as a warning that fame is "not all flowers and magic." Carpenter, the album\'s only feature, expanded on it in a December Variety cover story: hearing their voices together was something "ten-year-old me... could not believe," and though she\'d never have asked — "I would have never been like, \'Hey, bestie, put me on a song\'" — Swift was "so gracious to think of me." As of this writing the two had not performed the duet live together, though Carpenter had opened the Eras Tour\'s 2023–24 legs before her own headline breakout. Closing on a guest duet isn\'t new (evermore ended on its Bon Iver title track), but doing it with a former tour opener is.',
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
          // Added 2026-07-21 (depth ledger #1028): chart position, the
          // Swift-confirmed Vancouver crowd audio + fictional "Kitty", the
          // review read, and Carpenter's own words.
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-hot-100-fate-of-ophelia-number-one/',
            source_title: "Taylor Swift Makes Hot 100 History as 'The Life of a Showgirl' Sweeps the Top 12",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
          {
            outlet: 'CBC',
            url: 'https://www.cbc.ca/news/canada/british-columbia/vancouver-crowd-on-taylor-swift-s-new-album-1.7650822',
            source_title: "The Vancouver crowd that closes Taylor Swift's new album",
            publisher: 'CBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-album-reviews/taylor-swift-the-life-of-a-showgirl-album-review-1235439733/',
            source_title: "Taylor Swift: 'The Life of a Showgirl' album review",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          // Added 2026-07-25 (depth ledger #1028): Q4 a second attributed review
          // (Variety), Q6 Carpenter's fuller December Variety-cover quote, Q7 the
          // "Kitty" persona + Swift's "not all flowers and magic" framing.
          {
            outlet: 'Variety',
            url: 'https://variety.com/2025/music/album-reviews/taylor-swift-album-review-life-of-a-showgirl-1236537532/',
            source_title: "Taylor Swift 'The Life of a Showgirl' Album Review",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/sabrina-carpenter-taylor-swift-so-gracious-collab-invite-1236127325/',
            source_title: "Sabrina Carpenter Calls Taylor Swift 'So Gracious' for Collab Invite (Variety cover story)",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/music/the-life-of-a-showgirl-lyrics-meaning-taylor-swift-sabrina-carpenter-rcna234281',
            source_title: "'The Life of a Showgirl' Lyrics: Taylor Swift and Sabrina Carpenter Explore the Price of Stardom",
            publisher: 'Today',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
        ],
        // Lyric-video id OU6362Nggg0 verified via oEmbed against @TaylorSwift.
        // Photo-enrichment pass (2026-07-18, #762): Commons photo of Carpenter
        // opening the Eras Tour (Singapore, 9 Mar 2024) — license CC BY-SA 4.0
        // and date verified via the Commons API; downloaded and vision-
        // confirmed (Carpenter on the runway and jumbotron mid-set).
        photos: [
          {
            url: 'https://i.ytimg.com/vi/OU6362Nggg0/hqdefault.jpg',
            credit: 'Taylor Swift / Republic Records (official "The Life of a Showgirl" lyric video thumbnail, YouTube)',
            caption:
              'The official lyric video for the title track — the album\'s only feature, closing the record with Sabrina Carpenter.',
            kind: 'primary',
            // Focal point by inspection: mirrored dressing-room shot, the
            // central figure's face just above center.
            focalPoint: '50% 32%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Sabrina_Carpenter%2C_The_Eras_Tour%2C_Singapore_National_Stadium%2C_9_March_2024.jpeg',
            credit: 'TenthAvenueFreezeOut, CC BY-SA 4.0, via Wikimedia Commons',
            caption:
              'Sabrina Carpenter opening the Eras Tour at Singapore National Stadium, March 2024 — the stadium-wings apprenticeship the title track turns into its closing duet.',
            kind: 'archival',
            focalPoint: '52% 25%',
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
      // Cross-link deficit closed (2026-07-21, depth ledger #997 Q9): the
      // album's SECOND No. 1 now threads to its chart-partner "The Fate of
      // Ophelia," the debut-week sweep where it opened at No. 2, and the
      // release/album-week cluster.
      relatedIds: [
        'moment:vault-tloas-the-fate-of-ophelia-hamlets-drowned-girl-rescued-and-a-13th-',
        'moment:vault-tloas-all-12-tracks-debut-as-the-hot-100s-entire-top-12',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-4-002-million-in-a-week-the-biggest-album-debut-ever-measure',
        'moment:vault-tloas-twelve-weeks-at-no-1-through-the-entire-holiday-season',
      ],
      title: 'Opalite follows Ophelia to No. 1',
      snippet:
        'The sunny track three — widely heard by fans and critics as her Travis song, its title a man-made stone standing in for a happiness you build yourself — became the album\'s second Hot 100 No. 1 on the chart dated Feb. 28, 2026, months after "The Fate of Ophelia" had wrapped its own 10-week run at the top.',
      sourceUrl: 'https://slate.com/culture/2026/02/taylor-swift-opalite-billboard-hot-100-song-ophelia.html',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift has not confirmed the song\'s subject — the Travis Kelce reading (opal as his October birthstone, the synthetic stone as self-made joy) is fan and critic interpretation, labeled as such — but she has described what it\'s about: forgiving yourself when life "didn\'t pan out the way you wanted it to," and giving yourself permission not to marry the first person you ever dated — a framing she gave in release-week interviews in October 2025. Kelce had already named it his favorite on the album on the couple\'s New Heights podcast back on Aug. 27, 2025 ("I think \'Opalite\' might be my favorite ... every time it comes on, I always catch myself [vibing]"), two weeks after Swift announced the album on that same show. Musically it\'s the record\'s sunniest stretch — a disco-inflected Max Martin/Shellback production critics kept comparing to ABBA and Fleetwood Mac; Swift wrote and produced it with the pair, with recording and engineering by Lasse Mårtén, the mix by Serban Ghenea and the master by Randy Merrill.\n\nIt had debuted at No. 2 behind "The Fate of Ophelia" in October; the formal single push — a four-track dance-remix package (Chris Lake\'s house rework plus BUNT., Skream and Ely Oaks) issued as digital and limited CD singles across Feb. 17–23, 2026, alongside an acoustic "Opalite (Life Is a Song)" CD single on Feb. 16 — landed in mid-February 2026; Chris Lake said Swift and Kelce, who had been "listening to my music loads together," personally asked him to remix it, a rework he built over two weeks in Ableton. On the chart dated Feb. 28, 2026 — its 20th chart week — it leapt from No. 8 to No. 1, replacing Bad Bunny\'s "DTMF." Slate\'s chart analysis of the February 2026 ascent noted the unusual shape of it: a second Hot 100 No. 1 from the same 12-track album, arriving months after release and months after its album-mate "The Fate of Ophelia" had wrapped its own 10-week run at the top.\n\nThe topping week was engineered, not streamed. Slate\'s Chris Molanphy showed the leap was almost all sales: across its versions "Opalite" sold 168,000 copies that week — 144,000 physical, 24,000 digital — while ranking only 17th in streaming and third on Radio Songs. Swift had planned the retail push all along (7-inch vinyl, dance remixes on CD, a 69-cent acoustic B-side) but held the shipment until the week after Bad Bunny\'s Super Bowl halftime show had boxed her out — because Billboard counts physical singles when they ship, not when fans order them. Molanphy\'s answer to his own "is it a real hit?" was yes — but a chart-scientist\'s hit, built from collectibles more than streams. It was Swift\'s 14th career No. 1, tying Rihanna behind only the Beatles (20) and Mariah Carey (19).\n\nThe feat is rare even within her own catalog: sending two different songs to No. 1 off a single album is something she had done only once before, with 1989 in 2014-15, making The Life of a Showgirl just the second Taylor Swift album to place multiple tracks atop the Hot 100. And "Opalite" did get its own official music video — it premiered Feb. 6, 2026 on Apple Music before reaching YouTube two days later, a 1990s-infomercial comedy in which Swift plays a lonesome cat lady "dating a rock" until Opalite arrives as "the revolutionary fix for your problems," with cameos from Domhnall Gleeson, Lewis Capaldi, Cillian Murphy, Greta Lee, Jodie Turner-Smith and Graham Norton (as a rival "Nope-alite" salesman). Its release sat inside the mid-February single push that carried the song to the top.',
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
          // Added 2026-07-22 (ledger #997): the two-No.1s-from-one-album rarity
          // (Q4) and confirmation an official video exists (Q8).
          {
            // "The only other time Swift has secured two chart-topping songs on
            // the same album was for 2014's 1989."
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-opalite-number-one-billboard-hot-100-1235521139/',
            source_title: "Taylor Swift Nabs 14th Number One on the Billboard Hot 100 With 'Opalite'",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 4,
          },
          {
            // The official "Opalite" music video: Feb. 6 2026 Apple Music
            // premiere, the 1990s cat-lady concept and the cameo cast.
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-opalite-music-video-1235511440/',
            source_title: "Taylor Swift Releases 'Opalite' Music Video: Watch",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 4,
          },
          // Added 2026-07-23 (ledger #997): the remix package (Q2), the
          // songwriting/production credits (Q5), the source/date of Swift's
          // "permission not to marry the first person" framing (Q6), and the
          // Aug. 27, 2025 New Heights episode where Kelce named it his favorite (Q7).
          {
            // The four-track remix package — Chris Lake, BUNT., Skream, Ely Oaks —
            // and its mid-February 2026 digital/CD-single rollout.
            outlet: 'DJ Mag',
            url: 'https://djmag.com/news/chris-lake-skream-more-remix-taylor-swifts-opalite',
            source_title: "Chris Lake, Skream, more remix Taylor Swift's 'Opalite'",
            publisher: 'DJ Mag',
            source_type: 'reputable_press',
            accessed_at: '2026-07-23',
            reliability_score: 3,
          },
          {
            // Chris Lake on being asked by Swift and Kelce to remix "Opalite"
            // and building it over two weeks in Ableton.
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-chris-lake-travis-kelce-opalite-remix-interview-1236198801/',
            source_title: 'Chris Lake Talks About Remixing Taylor Swift\'s "Opalite"',
            publisher: 'Billboard',
            source_type: 'interview',
            accessed_at: '2026-07-23',
            reliability_score: 5,
          },
          {
            // Kelce's "my favorite" remark on the Aug. 27, 2025 New Heights episode.
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1421690/travis-kelces-favorite-song-from-taylor-swifts-life-of-a-showgirl',
            source_title: "Travis Kelce Reveals His Favorite Song From Fiancée Taylor Swift's The Life of a Showgirl Album",
            publisher: 'E! News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-23',
            reliability_score: 4,
          },
          {
            // Swift's release-week description of the song's meaning; also carries
            // full "Opalite" liner credits (writers/producers/engineers).
            outlet: 'Today',
            url: 'https://www.today.com/popculture/music/opalite-lyrics-meaning-taylor-swift-travis-kelce-rcna233775',
            source_title: "Are Taylor Swift's 'Opalite' Lyrics a Nod to Her and Travis Kelce? Read Them in Full",
            publisher: 'Today (NBC)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-23',
            reliability_score: 4,
          },
        ],
        // Single artwork filename taken from the Wikipedia article's HTML;
        // stable upload.wikimedia.org copy, verified HTTP 200 + image/png.
        // Photo-enrichment pass (2026-07-18, #762): video still is the lead
        // image of the cited Billboard No. 1 story (billboard.com/wp-content,
        // filename credits Republic Records); downloaded and vision-confirmed
        // 1800x1200, unwatermarked.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/9/92/Taylor_Swift_-_Opalite.png',
            credit: 'Single artwork / Republic Records, via Wikipedia',
            caption: 'The official single artwork for "Opalite," the album\'s second Hot 100 No. 1.',
            kind: 'primary',
            // Focal points by inspection: cover has Swift mid-dance, face
            // upper-left of center under the title text.
            focalPoint: '45% 28%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2026/02/taylor-swift-opalite-republic-records-screenshot-billboard-1800.jpg',
            credit: 'Republic Records (video still), via Billboard',
            caption:
              'A still from the "Opalite" video footage, as run with Billboard\'s coverage of the song\'s February 2026 climb from No. 8 to No. 1.',
            kind: 'archival',
            focalPoint: '50% 38%',
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
      // Cross-link (candidate #1047, 2026-07-25): the teenage-version Hendersonville
      // High song, "Picture to Burn."
      relatedIds: ['moment:vault-debut-picture-to-burn-and-the-line-rewritten-for-radio'],
      title: 'Ruin the Friendship: a regret from Hendersonville High',
      snippet:
        'A song about the high-school kiss she never risked — with a devastating final verse at a funeral. Fans traced it to her classmate Jeff Lang, who died in 2010; his mother told The Tennessean she wished she could thank Swift for "keeping his name alive."',
      sourceUrl: 'https://en.wikipedia.org/wiki/Ruin_the_Friendship',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift has not named the song\'s subject — the Lang connection is fan interpretation, labeled as such, but it rests on public record: she sang at a close friend\'s funeral in 2010 and thanked "Jeff Lang" from the BMI Country Awards stage that year, saying she used to play him her songs first. Fans lined those facts up with the song\'s Hendersonville high-school setting and its final verse — the narrator getting the news of his death and singing at his grave, regretting she never kissed him and admitting "we\'ll never know why" — within hours of release.\n\nWhat elevated the theory beyond lyric forensics was the family\'s response. Lang\'s mother told The Tennessean she wished she could thank Swift for "keeping his name alive," effectively blessing the reading without Swift ever confirming it. The lyric\'s advice — ruin the friendship, kiss your friend while you can — lands as the album\'s quietest gut-punch, a country-storytelling move (the twist verse, the moral) smuggled onto her glossiest pop record.\n\nThe song was written and produced by Swift with Max Martin and Shellback — Showgirl was the first album the three made with no outside collaborators, cut at Shellback\'s Stockholm studio on days off from the Eras Tour\'s European leg, as Swift recounted on the New Heights podcast in August 2025. For all its hush it was one of the album\'s bigger hits: it debuted and peaked at No. 11 on the Hot 100 — part of Showgirl\'s unprecedented sweep of the chart\'s entire top 12 — hit No. 12 on the Global 200, and went top-20 in Australia, Canada, New Zealand and Sweden.\n\nCritics singled it out: Billboard\'s Jason Lipshutz ranked it the best song on the album, hearing a track that "bridges Swift\'s past and present as a songwriter" and calls it "a summation of her strengths." Swift herself, at the theatrical release party, framed it plainly as a high-school regret — "It would\'ve been fine to take chances I didn\'t take. I was so disciplined in high school. It\'s very wistful and very nostalgic" — while pointedly not naming anyone, leaving the Lang reading to the fans.\n\nShe later cut a stripped "Ruin the Friendship (My Advice Version)" with new vocals, one of eight acoustic recordings sold as bonus tracks on limited-edition Showgirl CDs. The track has only an official lyric video, not a cinematic one, and — with no tour since the Eras Tour closed in December 2024 — it had not been documented performed live as of mid-2026.',
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
          {
            // Primary reporting on the mother's on-record quote — upgrades the
            // Wikipedia citation for the Lang connection (ledger #1046 Q7).
            outlet: 'The Tennessean',
            url: 'https://www.tennessean.com/story/news/local/2025/10/10/taylor-swift-ruin-the-friendship-tennessee-connection/86605317007/',
            source_title: "Taylor Swift's 'Ruin the Friendship' has a Tennessee connection",
            publisher: 'The Tennessean',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 5,
          },
          {
            // The 2010 BMI Country Awards thank-you to Jeff Lang, contemporaneous.
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-country/taylor-swift-named-country-songwriter-of-the-year-70024/',
            source_title: 'Taylor Swift Named Country Songwriter of the Year',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            // Chart: No. 11 on the Hot 100 within Showgirl's top-12 sweep.
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-hot-100-fate-of-ophelia-number-one/',
            source_title: 'Taylor Swift Takes Top 12 Spots on Billboard Hot 100, Led by "The Fate of Ophelia"',
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-25',
            reliability_score: 5,
          },
          {
            // Critical reception: ranked the album's No. 1 best song (Jason Lipshutz).
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-the-life-of-a-showgirl-songs-ranked/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' Songs, Ranked",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 5,
          },
          {
            // Swift's own release-party framing of the song as high-school regret,
            // without naming a subject.
            outlet: 'People',
            url: 'https://www.aol.com/articles/taylor-swifts-ruin-friendship-lyrics-042400124.html',
            source_title: "Taylor Swift Confirms 'Ruin the Friendship' Is About a High School Romantic Regret",
            publisher: 'People',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            // The making-of: Max Martin/Shellback, Stockholm sessions on Eras days off.
            outlet: 'TIME',
            url: 'https://time.com/7322334/taylor-swift-life-of-a-showgirl-max-martin-shellback/',
            source_title: "Everything to Know About Taylor Swift's Collaborators on The Life of a Showgirl",
            publisher: 'TIME',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            // The acoustic "My Advice Version" bonus recording.
            outlet: 'Variety',
            url: 'https://au.variety.com/2025/music/news/taylor-swift-acoustic-recordings-bonus-tracks-cd-editions-showgirl-28534',
            source_title: 'Taylor Swift Announces Eight Acoustic Recordings as Bonus Tracks for Four New "Life of a Showgirl" CD Editions',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
        ],
        // Lyric-video id WQCPl5rTMDQ verified via oEmbed against @TaylorSwift.
        // Photo-enrichment pass (2026-07-18, #762): Commons photo of the
        // actual Hendersonville High School building (license CC BY-SA 3.0
        // verified via the Commons API; signage legible in frame). Reference
        // kind, mirroring the Grammy-statuette precedent — the song's setting,
        // clearly labeled.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/WQCPl5rTMDQ/hqdefault.jpg',
            credit: 'Taylor Swift / Republic Records (official "Ruin The Friendship" lyric video thumbnail, YouTube)',
            caption: 'The official lyric video for "Ruin the Friendship."',
            kind: 'primary',
            // Focal point by inspection: Swift centered on the bed, face
            // just above the frame's midline.
            focalPoint: '50% 38%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Hendersonville_HS_Hendersonville_TN_USA.JPG',
            credit: 'Ed! (English Wikipedia), CC BY-SA 3.0, via Wikimedia Commons',
            caption:
              'Hendersonville High School in Hendersonville, Tennessee — the school Swift attended, and the setting of the song\'s never-risked kiss.',
            kind: 'reference',
            focalPoint: '62% 55%',
          },
        ],
      },
    },
    {
      slug: 'actually-romantic-one-sided-feud',
      // Cross-links + sourced craft/chart/reception depth added 2026-07-25
      // (depth ledgers #1144 / #1515 / #1518 — three duplicate ledgers all on
      // this one page). Redline note: the Swift-Charli material is kept to the
      // documented PROFESSIONAL arc and on-record statements; the "overlapping
      // 1975 chapters" allusion is deliberately left un-spelled-out (private
      // relationships are a redline and are not what makes this a story).
      relatedIds: [
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-all-12-tracks-debut-as-the-hot-100s-entire-top-12',
        'moment:vault-tloas-the-title-track-hands-the-last-word-to-sabrina-carpenter',
        // Diss-lineage thread (ledger #1530): her signature "answer-record"
        // predecessor, itself the anchor of the reputation feud-song thread.
        'moment:vault-reputation-look-what-you-made-me-do-and-the-phone-call-it-started-with',
      ],
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
          'Track 7 of the album\'s twelve and, at 2:43, one of its briskest, "Actually Romantic" is a Swift / Max Martin / Shellback co-write from the three-person core team that made the whole record — bright, up-tempo pop carrying a barbed lyric, a contrast reviewers kept noting (Pitchfork heard "diet indie rock," the New York Times praised its "cascading verses"). When the album swept the entire top 12 of the Billboard Hot 100 in its debut week, "Actually Romantic" entered at No. 7 — which is also its peak.\n\nSwift never names Charli — the reading is critic and fan interpretation, labeled as such, built from the "Boring Barbie" opening line and the two artists\' overlapping 1975 chapters. Her own framing, in the album\'s track-by-track commentary on Amazon Music, is studiously subject-free: someone has been carrying on a "one-sided adversarial relationship" she didn\'t know about, and the song reframes that obsession as flattery — hate as a form of attention, attention as a form of love. At the theatrical release party she called it "sort of a love letter to someone who hates you," and still didn\'t confirm a subject.\n\nWhat critics point to is a documented professional arc. Charli XCX opened Swift\'s 2018 Reputation Stadium Tour; a year later she told Pitchfork the billing "kind of felt like I was getting up on stage and waving to 5-year-olds." On Brat (2024) came "Sympathy Is a Knife," which Charli said was "about me and my feelings and my anxiety" — declining, when asked, to say whether Swift was in it ("People are gonna think what they want to think"). Swift, for her part, had publicly praised Charli\'s writing in a 2024 profile and was filmed cheering her 2025 Grammys set. "Actually Romantic" — its title read as a nod to Brat\'s "Everything Is Romantic," its sharpest line "wrote me a song saying it makes you sick to see my face" — is the entry critics treat as her reply.\n\nIt became the album\'s most-argued-about track. Variety published a full timeline of the perceived Swift-Charli history, from tour-opener days through "Sympathy Is a Knife," treating the song as the latest entry in a documented arc; Rolling Stone ran a commentary questioning whether the biggest pop star on earth punching laterally at a fellow artist was a good look at all, and Pitchfork, the Guardian and Slate panned the concept while the Times singled out its vocal as the album\'s most inspired. Charli, asked directly in an October 2025 Vanity Fair cover, declined to comment — a non-answer that, like the deniable target itself, kept the track in the discourse long after release week. As of mid-2026 Swift has not performed it live or added to the record since.',
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
          // Craft/chart/reception depth (ledgers #1144/#1515/#1518, 2026-07-25).
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-the-life-of-a-showgirl-billboard-debut-1236399004/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' Sweeps Billboard Hot 100's Entire Top 12",
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1423037/who-are-max-martin-shellback-taylor-swifts-album-producers',
            source_title: "Who Are Max Martin & Shellback, Taylor Swift's Album Producers?",
            publisher: 'E! News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/music/charli-xcx-taylor-swift-sympathy-is-a-knife-rcna168189',
            source_title: 'Charli XCX addresses whether "Sympathy Is a Knife" is about Taylor Swift',
            publisher: 'Today (NBC)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'People',
            url: 'https://www.aol.com/articles/charli-xcx-declines-whether-taylor-001018233.html',
            source_title: 'Charli XCX Declines to Say Whether Taylor Swift\'s "Actually Romantic" Is About Her',
            publisher: 'People (via AOL)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'People',
            url: 'https://www.aol.com/lifestyle/taylor-swift-actually-romantic-lyrics-040600872.html',
            source_title: 'Taylor Swift Explains the Meaning Behind "Actually Romantic"',
            publisher: 'People (via AOL)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
        ],
        // Lyric-video id FnEg1RgmqO4 verified via oEmbed against @TaylorSwift.
        // Photo pass #762 run 9 (2026-07-18): hqdefault raised to the same
        // video's 1280x720 maxres render. Added the Commons Charli XCX Brat
        // arena tour photo (CC BY-SA 4.0, Junefreund, license + Nov 29 2024
        // date verified via the Commons API this session) as a reference
        // image — the page's whole subject is the critics' Charli reading,
        // clearly labeled as interpretation in the caption. Both images
        // downloaded and viewed for focal points.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/FnEg1RgmqO4/maxresdefault.jpg',
            credit: 'Taylor Swift / Republic Records (official "Actually Romantic" lyric video thumbnail, YouTube)',
            caption: 'The official lyric video for "Actually Romantic."',
            kind: 'primary',
            // Taylor at the dressing-room mirror, face left-of-center.
            focalPoint: '46% 40%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Charli_XCX_-_Birmingham%2C_UK_%28November_29%2C_2024%29.jpg',
            credit: 'Junefreund, CC BY-SA 4.0, via Wikimedia Commons',
            caption:
              'Charli XCX on the Brat arena tour in Birmingham, November 2024 — the artist critics near-unanimously read the song as answering, a reading Swift has never confirmed.',
            kind: 'reference',
            // Square frame, Charli mid-frame under falling rain, face upper-center.
            focalPoint: '48% 42%',
          },
        ],
      },
    },

    // --- The Eras Tour's send-off (tour + release, December 2025).
    {
      slug: 'end-of-an-era-docuseries',
      relatedIds: [
          'moment:vault-ttpd-vienna-cancelled-a-foiled-plot-three-sold-out-shows',
        'moment:vault-tloas-the-final-show-the-full-vancouver-closer-streaming-at-last',
        'moment:vault-ttpd-the-eras-tour-takes-its-final-bow-in-vancouver',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-a-mint-green-briefcase-on-new-heights-album-no-12-announced-',
        'moment:vault-tloas-the-eras-tour-film-pulls-five-emmy-nominations-her-first-nod',
      ],
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
          'The docuseries covers the tour\'s full 2023-24 arc — the staging, the surprise-song scramble, the Kelce of it all — and functions as the era-bridge between TTPD\'s stadium years and the Showgirl era they produced: she wrote the new album on this tour\'s European leg. It doesn\'t flinch from the tour\'s hardest chapter, either: the opening episode deals with the foiled Vienna terror plot and its aftermath, the first time Swift has discussed it at length on camera.\n\nThe six episodes — "Welcome to the Eras Tour" and "Magic in the Eras" (Dec. 12), "Kismet" and "Thank You for the Lovely Bouquet" (Dec. 19), "Marjorie" and "Remember This Moment" (Dec. 23) — run 42-49 minutes each, created and narrated by Swift, directed by Don Argott and Sheena M. Joyce and executive-produced by Rob Booth and Dom Thomas for Object & Animal. Guest artists slot in across the run: Ed Sheeran\'s London medley (ep. 1), Florence Welch on "Florida!!!" (ep. 2), Sabrina Carpenter (ep. 4), Gracie Abrams\'s mashup (ep. 5); Travis Kelce runs through the back half, including his tuxedoed "I Can Do It With a Broken Heart" cameo. Critics were warm — 88% on Rotten Tomatoes, 79 on Metacritic, The Hollywood Reporter calling it a "juicy tell-all." It was the No. 1 series on Disney+ globally within days, and Nielsen logged 377 million minutes watched in the pre-Christmas week — enough to sit a backstage documentary inside that week\'s overall streaming top ten. Where these episodes stay backstage, the same-day companion film The Final Show carries the complete Vancouver concert.',
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
        // Photo-enrichment pass (2026-07-18, #762): docuseries still from
        // Billboard's own coverage (billboard.com/wp-content, EXIF description
        // "Taylor Swift and Travis Kelce"); downloaded and vision-confirmed —
        // the under-stage cheek-kiss scene, Disney+ promo bug lower right,
        // 1800x1200, no agency watermark.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/4/41/Taylor_Swift_-_The_End_of_an_Era_%28Official_poster%29.png',
            credit: 'Official poster / Disney+ & Taylor Swift Productions, via Wikipedia',
            caption: 'The official poster for the six-episode Disney+ docuseries.',
            kind: 'primary',
            // Focal point by inspection: full-length figure walking into the
            // lit doorway, head in the frame's upper-middle band.
            focalPoint: '50% 40%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2025/10/taylor-swift-travis-kelce-eras-doc-screenshot-billboard-1800.jpg',
            credit: 'Disney+ / Taylor Swift Productions (docuseries still), via Billboard',
            caption:
              'Taylor and Travis Kelce beneath the Eras Tour stage, in a scene from the docuseries\' back half — the backstage register the six episodes live in.',
            kind: 'archival',
            focalPoint: '47% 32%',
          },
        ],
      },
    },
    {
      slug: 'eras-tour-final-show-film',
      significance: 'notable', // the tour's actual closing chapter made permanently available, companion to the already-defining Vancouver finale (docs/decisions.md, 2026-07-19)
      relatedIds: [
          'moment:vault-tloas-the-title-track-hands-the-last-word-to-sabrina-carpenter',
        'moment:vault-ttpd-the-eras-tour-takes-its-final-bow-in-vancouver',
        'moment:vault-tloas-the-end-of-an-era-the-eras-tour-docuseries-lands-on-disney',
        'moment:vault-tloas-the-eras-tour-film-pulls-five-emmy-nominations-her-first-nod',
      ],
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
          'Paired with the End of an Era docuseries for the same-day premiere, the film preserves the tour\'s final setlist end-to-end — the version of the show that closed out the highest-grossing tour ever, a year after the last confetti fell in Vancouver. Where the 2023 theatrical film had to trim songs for runtime, the streaming cut runs the full Vancouver marathon — the complete 45-song final setlist, roughly three and a half hours, uncut — including the Tortured Poets segment added for the 2024 legs — the set Swift called the "Female Rage" chapter — that no prior filmed version contained. It captures that night\'s specific goodbyes, too: the guitar surprise was an "A Place in This World"/"New Romantics" mashup, and the piano send-off folded "Long Live" and "New Year\'s Day" into "The Manuscript" — a literal end-of-an-era note to close 149 shows.\n\nUnlike the 2023 film, this was a Disney+ exclusive with no theatrical window, and — director aside — a different hand: Glenn Weiss directed it (not Sam Wrench, who shot the 2023 cut), with Swift credited as a producer. No separate live album or soundtrack was released; the audio lives only inside the film. The pairing was a deliberate double release: the docuseries tells you what the tour cost to make and end, and The Final Show is the artifact itself, shot at BC Place on Dec. 8, 2024 — show 149 of 149. Together they turned mid-December 2025 into a Disney+ event weekend, and the concert film went on to earn five Emmy nominations the following summer — Outstanding Variety Special (Pre-Recorded), Directing and Picture Editing for a Variety Special, Sound Mixing, and Technical Direction and Camerawork.',
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
          {
            // The five Emmy categories and Glenn Weiss's directing credit.
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-2026-emmy-nominations-eras-tour-final-show-1235590955/',
            source_title: "Taylor Swift Scores First Emmy Nominations in Over 10 Years for 'The Eras Tour: The Final Show'",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            // Fan-maintained setlist for the specific final-night surprise songs;
            // corroborated by the tour's documented Dec. 8, 2024 close.
            outlet: 'setlist.fm',
            url: 'https://www.setlist.fm/setlist/taylor-swift/2024/bc-place-stadium-vancouver-bc-canada-3baa40bc.html',
            source_title: 'Taylor Swift Setlist at BC Place Stadium, Vancouver — Dec. 8, 2024',
            publisher: 'setlist.fm',
            source_type: 'wiki',
            accessed_at: '2026-07-21',
            reliability_score: 2,
          },
        ],
        // Commons photo of BC Place dressed for the Vancouver finale;
        // license (CC BY-SA 4.0, JazzHandsIncarnate) and December 2024 date
        // verified on the file page this session.
        // Photo pass #762 run 9 (2026-07-18): added the Getty performance
        // photo ABC News ran with its own Final Show/End of an Era story
        // (i.abcnewsfe.com, ABC's own CDN; curl-verified 200 image/jpeg
        // 1600x900, downloaded and viewed — the acoustic-set piano moment).
        // Caption avoids claiming a specific city since Getty's frame isn't
        // dated to Vancouver. Both images viewed for focal points.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Taylor_Swift_The_Eras_Tour_at_BC_Place%2C_Landscape.jpg',
            credit: 'JazzHandsIncarnate, CC BY-SA 4.0, via Wikimedia Commons',
            caption:
              'BC Place in Vancouver dressed for the Eras Tour\'s final dates, December 2024 — a giant friendship bracelet reading "TAYLOR SWIFT THE ERAS TOUR" wrapped along the stadium.',
            kind: 'archival',
            // Giant friendship bracelet across the upper-middle of the facade.
            focalPoint: '50% 38%',
          },
          {
            url: 'https://i.abcnewsfe.com/a/5ec4f225-0002-477a-b2d6-d71be02ff77e/TAYLOR-GTY-AB-251202_1764711098744_hpMain_16x9.jpg?w=1600',
            credit: 'Getty Images, via ABC News',
            caption:
              'At the piano for the surprise-song acoustic set, in the orange gown of the tour\'s 2024 legs — the stripped-down chapter of the show the streaming cut preserves in full.',
            kind: 'archival',
            // Taylor seated at the piano, left third, face upper left.
            focalPoint: '34% 24%',
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
      // Cross-link (candidate #1247): this page calls itself Clark's second
      // suite appearance "after the January 2025 Texans playoff game" — the
      // first half of the pattern lives on that TTPD-era page.
      relatedIds: [
        'moment:vault-ttpd-back-in-the-family-suite-for-a-chiefs-texans-divisional-play',
      ],
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
            // Her face is center-left in the suite window, slightly above the middle.
            focalPoint: '43% 38%',
          },
          // Photo pass (#762 run 6, 2026-07-18): a second, distinct wire photo
          // from the same game via Billboard's coverage of the Swift/Clark
          // suite appearance. Verified HTTP 200 + image/jpeg, downloaded and
          // visually confirmed (Swift mid-smile above the crowd; Clark is not
          // in this frame — no verifiable Swift-and-Clark two-shot exists on
          // an approved CDN).
          {
            url: 'https://www.billboard.com/wp-content/uploads/2025/10/taylor-swift-chiefs-lions-2025-billboard-1800.jpg?w=1024',
            credit: 'Jamie Squire/Getty Images, via Billboard',
            caption:
              'Between plays: Swift spotted over the crowd in the Arrowhead suite during the Oct. 12 Sunday Night Football game — her first on-camera appearance there all season.',
            kind: 'primary',
            // Her face sits upper-right of center above the foreground crowd.
            focalPoint: '64% 28%',
          },
        ],
      },
    },
    {
      slug: 'black-dog-still-nobody-knows',
      // Cross-link (ledger #1072, 2026-07-21): the surprise 2 a.m. Anthology
      // drop that this deep cut arrived on.
      relatedIds: [
        'moment:vault-ttpd-a-2am-surprise-ttpd-was-a-secret-double-album-all-along',
      ],
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
          'The lyric describes tracking an ex whose location services were still on and watching him walk "into some bar called The Black Dog," which turned a real Vauxhall, London gastropub into a fan pilgrimage site, complete with lyric-quoting window signage and a "Taylor\'s Version" cocktail list. A year and a half on, the pub was still trading on the association — and fans were still treating the TTPD deep cut as an unsolved case.\n\nSpeaking to BBC Radio 2\'s Scott Mills during her Life of a Showgirl press run in October 2025, Swift finally addressed it — by un-solving it further. She said she never tipped off the pub, and went out of her way to note that the internet\'s confident consensus is wrong: "still nobody knows what I\'m even talking about on that song. They think they know, they have no idea." It was a rare on-record reminder, delivered mid-victory-lap for a new album, that some of the catalog\'s most-theorized songs remain deliberately unexplained.\n\nWhat she was un-solving: fans had split the song between two exes. The opening watches an ex whose phone still shared his location — "your location, you forgot to turn it off / and so I watch as you walk / into some bar called The Black Dog" — and one camp read it as Joe Alwyn (who later said flatly, "I\'ve never been to Vauxhall"), the other as Matty Healy, pointing to the track\'s nod to the band The Starting Line, whom Healy has covered live. A "2 a.m." Anthology cut from the surprise double-album, it charted on its own, peaking at No. 25 on the Hot 100. The title itself carries a double meaning under the literal pub: "black dog" is the old idiom for depression — coined by Samuel Johnson and popularized through Winston Churchill — so the song reads at once as tracking an ex into a real bar and as a portrait of the grief that trails the person left behind. The real Vauxhall pub — The Black Dog sits at 112 Vauxhall Walk, a redbrick Victorian corner house at Glasshouse Walk — leaned all the way in: Swift, it emerged, had drunk there herself before the song, and afterward the pub added Swift-themed burgers and cocktails as fans arrived faster than its tables could hold them and staff combed CCTV for a sighting; "anything she touches goes viral," one worker told reporters — a scene BBC News, NME, Capital FM and CNN all covered.',
        sources: [
          {
            outlet: 'Elite Daily',
            url: 'https://www.elitedaily.com/lifestyle/taylor-swift-the-black-dog-london-pub-review',
            source_title: "Taylor Swift's The Black Dog London Pub Is A Whole Vibe",
            publisher: 'Elite Daily',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          // Added 2026-07-21 (ledger #1072): the Scott Mills BBC Radio 2 quote,
          // the Alwyn/Healy fan split, and the multi-outlet pub coverage the
          // page previously cited to a single source.
          {
            outlet: 'The Express Tribune',
            url: 'https://tribune.com.pk/story/2570920/taylor-swift-clears-confusion-over-meaning-of-the-black-dog',
            source_title: "Taylor Swift clears confusion over meaning of 'The Black Dog', denies connection to ex Joe Alwyn",
            publisher: 'The Express Tribune',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
          },
          {
            outlet: 'BBC News',
            url: 'https://www.bbc.co.uk/news/uk-england-london-68876725',
            source_title: "Taylor Swift fans 'overwhelming' London pub The Black Dog",
            publisher: 'BBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
          {
            outlet: 'NME',
            url: 'https://www.nme.com/news/music/hundreds-of-taylor-swift-fans-swarm-london-pub-after-album-shout-out-as-the-black-dog-check-cctv-for-clues-of-ex-3719750',
            source_title: 'Hundreds of Taylor Swift fans swarm London pub after album shout-out, as The Black Dog check CCTV for clues of ex',
            publisher: 'NME',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Capital FM',
            url: 'https://www.capitalfm.com/news/the-black-dog-pub-london-vauxhall-taylor-swift/',
            source_title: 'The Black Dog Pub In Vauxhall Checking CCTV For Answers To Taylor Swift\'s Song',
            publisher: 'Capital FM (Global)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
          },
          // Added 2026-07-26 (ledger #1072): the pub's exact address (112 Vauxhall
          // Walk, corner of Glasshouse Walk), that Swift had drunk there before the
          // song, and the Swift-themed burgers/cocktails — from CNN's inside feature.
          {
            outlet: 'CNN Travel',
            url: 'https://www.cnn.com/travel/black-dog-vauxhall-london-pub-taylor-swift',
            source_title: 'What it’s like inside The Black Dog, the London pub made famous by Taylor Swift',
            publisher: 'CNN',
            source_type: 'reputable_press',
            accessed_at: '2026-07-26',
            reliability_score: 5,
          },
          // The title's second meaning: "black dog" as the Johnson/Churchill idiom
          // for depression, running under the literal-pub reading.
          {
            outlet: 'Capital FM',
            url: 'https://www.capitalfm.com/news/music/taylor-swift-the-black-dog-final-bonus-track-song-lyrics-meaning/',
            source_title: "Inside Taylor Swift's Bonus Song 'The Black Dog' Lyrics, Meaning & More",
            publisher: 'Capital FM (Global)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-26',
            reliability_score: 3,
          },
        ],
        // Commons photo of the actual pub; license (CC BY-SA 2.0, Chris
        // Whippet / geograph.org.uk) verified on the file page this session.
        // Photo pass #762 run 9 (2026-07-18): added the official "The Black
        // Dog" lyric-video still — video id 56TZ3B8Qxsk verified via YouTube
        // oEmbed against @TaylorSwift this session ("Taylor Swift - The
        // Black Dog (Official Lyric Video)"); 1280x720 maxres curl-verified
        // 200 image/jpeg. Both images downloaded and viewed for focal points.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/The_Black_Dog%2C_Vauxhall_-_geograph.org.uk_-_4576579.jpg',
            credit: 'Chris Whippet / geograph.org.uk, CC BY-SA 2.0, via Wikimedia Commons',
            caption:
              'The Black Dog in Vauxhall, London — the real gastropub fans decided the song is about, photographed in 2015, years before it became a pilgrimage site.',
            kind: 'archival',
            // Corner pub facade with the black-dog sign; entrance mid-frame.
            focalPoint: '46% 55%',
          },
          {
            url: 'https://i.ytimg.com/vi/56TZ3B8Qxsk/maxresdefault.jpg',
            credit: 'Taylor Swift / Republic Records (official "The Black Dog" lyric video thumbnail, YouTube)',
            caption: 'The official lyric video for the song she insists nobody has decoded.',
            kind: 'archival',
            // Sepia portrait, Taylor in profile on the right side, face upper right.
            focalPoint: '70% 30%',
          },
        ],
      },
    },
    // Content Shift (2026-07-13, ticket #617 fix-shape item 3): the June 10
    // MSG venue-foreshadowing sighting, previously missing from the vault.
    // Note for the End Game thread author: the ticket framed this as a
    // couple's venue clue, but Travis was NOT at this game — Chiefs
    // mandatory minicamp ran June 9-11 in Kansas City (Yahoo). Facts
    // triangulated across Billboard, Rolling Stone, E!, SI, NBA.com and
    // Yahoo search-indexed content; direct page fetches and image
    // verification were blocked in that session, so photos were left for the
    // photo pass — added in the #762 run-6 pass (2026-07-18) below.
    {
      slug: 'stevie-knicks-nba-finals-game-4',
      year: 2026,
      month: 6,
      day: 10,
      category: 'sighting',
      // Cross-link deficit closed (depth ledger #1032 Q1, 2026-07-21): the pun
      // tee's payoff is Stevie Nicks singing at the MSG wedding reception in this
      // same building 23 days later — the page carried no relatedIds. Target id
      // verified in-seed. (A crosslink-candidate for the pair is filed separately.)
      relatedIds: ['moment:vault-tloas-taylor-and-travis-marry-at-madison-square-garden'],
      title: '"Stevie Knicks" courtside: the Garden, three weeks before the wedding',
      snippet:
        'Courtside for NBA Finals Game 4 with Este and Alana Haim, in homemade Knicks-pun tees — hers reads "Stevie Knicks" — Taylor watches New York erase a 29-point deficit and steal it on a put-back with 1.2 seconds left. Three weeks later, same building: the wedding.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-nba-finals-game-4-haim-stevie-knicks-shirt-1236270180/',
      // Photo pass (#762 run 6, 2026-07-18): thumbnail = the courtside group
      // photo added below; page previously had no images.
      thumbnailUrl: 'https://cdn.nba.com/manage/2026/06/GettyImages_TSwift.jpg',
      moment: {
        context:
          'The shirts were Alana Haim\'s craft project — $3 Gildan blanks from Michaels, the lettering cut in Knicks orange on a Cricut she had bought after HAIM\'s last tour: "Stevie Knicks" for Taylor, "Knickleback" for Alana, "Knickol Kidman" for Este. The "Stevie Knicks" pun doubled as a wink at a real touchstone: outlets tied it to Swift\'s documented mentorship from Stevie Nicks, one of the few peers she has said she can turn to about navigating fame at her scale. Travis was at the Chiefs\' mandatory minicamp back in Kansas City, reduced to liking the courtside posts from afar.\n\nThe game earned the outfit: New York trailed San Antonio 81-52 in the third quarter and won 107-106 on OG Anunoby\'s put-back with 1.2 seconds left — the largest comeback in NBA Finals history, breaking the 24-point mark the Boston Celtics had set against the Lakers in 2008, on the way to the Knicks\' first title in 53 years. Then the hindsight arrived: twenty-three days later, Taylor and Travis were married in that same building, with Stevie Nicks herself singing at the reception.\n\nThe wordplay was a collaboration: Swift coined "Stevie Knicks" and asked Alana to make it ("She said, \'I want to wear this shirt to the game. Can you make it for me?\'"), the two riffing the rest between them before Alana screen-printed all three. Courtside put Swift in a packed MSG celebrity row — Jerry Seinfeld, Jimmy Fallon, Timothée Chalamet and Ben Stiller among them, with Mariska Hargitay in a matching "Stevie Knicks" tee — though which organization hosted her seats went unreported. It was not her first Knicks game, but it was unusual footing for her: her public sports attendance skews overwhelmingly to the NFL, and this was only her second NBA game of the 2026 postseason, after she sat the Eastern Conference finals alongside Kelce three weeks earlier. Travis, held at minicamp, liked the courtside posts from afar and left camp early on June 11 to meet her at her Songwriters Hall of Fame induction — but never commented publicly on the game or the shirt.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-nba-finals-game-4-haim-stevie-knicks-shirt-1236270180/',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-knicks-nba-finals-haim-1235575812/',
          },
          // Depth ledger #1032 (2026-07-21): the Cricut craft-origin and the
          // Nicks-mentorship read behind the "Stevie Knicks" pun.
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-stevie-knicks-shirt-nba-finals-alana-haim-made-1236271679/',
            source_title: "Taylor Swift's 'Stevie Knicks' Shirt at the NBA Finals: How Alana Haim Made It",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'The Washington Post',
            url: 'https://www.washingtonpost.com/style/fashion/2026/06/11/where-did-taylor-swifts-stevie-knicks-t-shirt-come/',
            source_title: "Where did Knicks fan Taylor Swift get her 'Stevie Knicks' T-shirt?",
            publisher: 'The Washington Post',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'NBA.com',
            url: 'https://www.nba.com/news/taylor-swift-attends-2026-nba-finals-game-4-at-madison-square-garden',
          },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/celebrity/articles/travis-kelce-shows-love-taylor-202611050.html',
          },
          // Provenance for the photos added in the #762 run-6 photo pass:
          {
            outlet: 'NBA.com',
            url: 'https://www.nba.com/news/taylor-swift-attends-2026-nba-finals-game-4-at-madison-square-garden',
          },
          // Depth ledger #1032 Q6 (2026-07-25): the exact prior Finals-comeback
          // record the 29-point rally broke (Celtics, 24 points, 2008 Finals).
          {
            outlet: 'NBA.com',
            url: 'https://www.nba.com/news/knicks-complete-nba-finals-record-29-point-comeback-to-seal-game-4-win-over-spurs',
            source_title: 'Knicks complete NBA Finals record 29-point comeback to seal Game 4 win over Spurs',
            publisher: 'NBA.com',
            source_type: 'official',
            accessed_at: '2026-07-25',
            reliability_score: 5,
          },
          // Depth ledger #1032 Q2-Q5 (2026-07-25): the pun origin (Swift coined
          // it, per Alana Haim to Vogue), the celebrity-row context, the NBA
          // rarity, and Travis leaving minicamp early for the SHOF induction.
          {
            outlet: 'Vogue',
            url: 'https://www.yahoo.com/entertainment/celebrity/articles/alana-haim-reveals-taylor-swift-192713073.html',
            source_title: "Alana Haim Reveals How She Made Taylor Swift's 'Stevie Knicks' Shirt",
            publisher: 'Vogue (via Yahoo Entertainment)',
            source_type: 'interview',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/siladityaray/2026/06/11/billionaire-taylor-swift-among-dozens-of-prominent-celebrities-at-the-knicks-spurs-nba-finals-game-4/',
            source_title: 'Taylor Swift Among Dozens Of Prominent Celebrities At The Knicks-Spurs NBA Finals Game 4',
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/celebrity/articles/why-travis-kelce-left-kansas-011353853.html',
            source_title: 'Why Travis Kelce Left Chiefs Minicamp Early to Join Taylor Swift in New York',
            publisher: 'Yahoo Entertainment',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
        ],
        // Photo pass (#762 run 6, 2026-07-18): both photos hotlinked from the
        // outlets' own CDNs, curl-verified HTTP 200 + image/jpeg, downloaded
        // and visually confirmed this session (the hand-lettered pun tees are
        // legible in both). Billboard's other frame and Rolling Stone's lead
        // are tighter crops of the same Dustin Satloff photo used below —
        // rejected as near-duplicates.
        photos: [
          {
            url: 'https://cdn.nba.com/manage/2026/06/GettyImages_TSwift.jpg',
            credit: 'Getty Images, via NBA.com',
            caption:
              'Courtside at Game 4: Swift, center, cheering the comeback with companions in the matching hand-made Knicks-pun tees.',
            kind: 'primary',
            // Swift stands just right of center; the three faces run along the upper quarter.
            focalPoint: '54% 22%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2026/06/taylor-swift-knicks-2026-billboard-embed.jpg?w=1024',
            credit: 'Dustin Satloff/Getty Images, via Billboard',
            caption:
              'The "Stevie Knicks" tee up close — $3 Gildan blank, Alana Haim\'s Cricut lettering in Knicks orange — engagement ring on the raised hand.',
            kind: 'primary',
            // Tall frame: her face sits high-left of the shirt lettering, upper third.
            focalPoint: '46% 30%',
          },
        ],
      },
    },
    {
      slug: 'watch-hill-bachelorette-weekend',
      // Cross-links: the wedding this weekend leads into (candidate #1126); the
      // Watch Hill estate the weekend was staged at — both the folklore song
      // that mythologizes it (candidate #1368) and the Red-era purchase that
      // put it in her hands (candidate #1369).
      relatedIds: [
        'moment:vault-tloas-taylor-and-travis-marry-at-madison-square-garden',
        'moment:vault-folklore-the-last-great-american-dynasty-and-the-widow-she-found-in-h',
        'moment:vault-red-she-buys-high-watch-the-watch-hill-mansion-in-cash',
      ],
      year: 2026,
      month: 6,
      day: 19,
      category: 'sighting',
      // Rumor-tier pilot (2026-07-19): single-outlet TMZ reporting that Swift's
      // team never confirmed (the context already says so) — the loud
      // "Reported — not confirmed" banner makes that status unmissable.
      //
      // Ledger #1367 (2026-07-25): the ledger asked whether, still single-source
      // and unconfirmed after the July 3 wedding, this should move toward
      // privacy-redlines rumor rule 6's "faded" state. It should — and the field
      // stays 'reputable_reporting' anyway, because 'faded' is NOT a valid
      // moment-level confidence (THEORY_CONFIDENCE in validate-content.mjs), so
      // setting it would drop the banner and render the claim as fact. The fade
      // is therefore expressed in the PROSE ("reported in June 2026 and never
      // confirmed or denied — a single-source sighting that has since gone
      // quiet"), which is what rule 6 actually asks for. Not promoted either:
      // nothing confirmed it, so downgrading toward faded is the only honest move.
      confidence: 'reputable_reporting',
      title: 'A tented lawn in Rhode Island, two weeks before the wedding',
      snippet:
        'A large tent went up on the Ocean House lawn in Watch Hill and longtime friends were seen arriving for what looked like a bachelorette weekend, two weeks before the wedding.',
      sourceUrl: 'https://www.tmz.com/2026/06/19/taylor-swift-bachelorette-party-rumors/',
      // Image-fix pass (2026-07-10): swapped the watermarked TMZ collage
      // thumbnail for the verified AP tent/Ocean House photo below (see
      // photos[0]) — same fix as ticket #337.
      thumbnailUrl: 'https://fortune.com/img-assets/wp-content/uploads/2026/06/AP26171861867196-e1782051050489.jpg?format=webp&w=1440&q=100',
      moment: {
        context:
          'TMZ reported the gathering the weekend of June 19-20, 2026 as a "bachelorette-style gathering centered around Taylor and her closest girlfriends." The tells were logistical rather than official: a large tent on the Ocean House lawn in Watch Hill, and longtime friends said to be converging on the small Rhode Island town at once. But the single-source read strained against its own evidence. The Boston Globe noted that "no definitive evidence has emerged confirming the nuptials will take place in the Ocean State," and reported that luxury planner Elizabeth Hall Events had disputed on Instagram that the weekend\'s ceremony was Swift\'s. TMZ\'s own photos showed the tent held little more than a bare wooden dance floor — no tables or place settings — and TMZ said the wedding actually booked at the hotel that weekend was a New York City couple\'s, not Swift\'s. When a separate rumor claimed Swift had paid a bride to give up her date, the resort\'s Stephanie Leavitt flatly denied it: "Ocean House would not and is not allowing another party or entity to buy a wedding group out of a contracted wedding date."\n\nThe Ocean House is Watch Hill\'s Forbes Five-Star beachfront resort — a Relais & Châteaux member, an 1868 grand hotel rebuilt in 2010 — near the home Swift has kept in the town since 2013, which is why observers folded the two together. That home is its own callback: the "holiday house" of the 2020 folklore song "the last great american dynasty," heiress Rebekah Harkness\'s former mansion, which Swift bought in 2013 for a reported $17.75 million in cash and used for her 1989-era Fourth of July parties from 2013 to 2016. A pre-wedding weekend there would have read to fans as a personal-lore send-off, two weeks before the Madison Square Garden ceremony. But nothing ever stood it up: neither Swift nor her team addressed it, no outlet beyond TMZ backed the bachelorette framing, and the July 3 MSG wedding overtook the rumor rather than settling it. It stands as reported in June 2026 and never confirmed or denied — a single-source sighting that has since gone quiet.',
        // Rumor Desk lifecycle re-check 2026-07-22 (CIE content.rumor-lifecycle):
        // the "Reported — not confirmed" banner still holds. Re-verified against
        // current sources this session — neither Swift nor her team ever
        // confirmed the bachelorette weekend, and nothing surfaced post-wedding
        // to settle it; it stays single-camp TMZ/tabloid reporting. accessed_at
        // added below to record that someone actually looked (the distinction the
        // banner rests on), per the finding's suggested fix.
        sources: [
          {
            outlet: 'TMZ',
            url: 'https://www.tmz.com/2026/06/19/taylor-swift-bachelorette-party-rumors/',
            source_title: 'Taylor Swift Bachelorette Party Buzz Grows in Rhode Island as Girlfriends Arrive',
            publisher: 'TMZ',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 3,
          },
          // Ledger #1367 (2026-07-25): corroborating context that keeps this a
          // labeled, gone-quiet rumor rather than a fact — the Globe's "no
          // definitive evidence" + the planner's dispute, and the resort's own
          // on-record denial of the adjacent buyout rumor. All verified by
          // direct fetch this session.
          {
            outlet: 'The Boston Globe',
            url: 'https://www.bostonglobe.com/2026/06/19/metro/taylor-swift-wedding-rhode-island-ocean-house/',
            source_title: 'Is Taylor Swift getting married in Rhode Island? Here\'s what we know.',
            publisher: 'The Boston Globe',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'AOL',
            url: 'https://www.aol.com/articles/venue-just-dispelled-bizarre-rumor-213600635.html',
            source_title: 'Venue Just Dispelled a Bizarre Rumor About Taylor Swift\'s Wedding',
            publisher: 'AOL',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          // House + venue backstory that anchors the "last great american
          // dynasty" callback (town-level only, no address/estate name per
          // privacy-redlines): the 2013 cash purchase and the resort's identity.
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/businessmain/taylor-swift-pays-cash-rhode-island-home-6c9826051',
            source_title: 'Taylor Swift pays cash for Rhode Island home',
            publisher: 'NBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'Relais & Châteaux',
            url: 'https://www.relaischateaux.com/us/hotel/ocean-house/',
            source_title: 'Ocean House — Watch Hill, Rhode Island',
            publisher: 'Relais & Châteaux',
            source_type: 'official',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
        ],
        // Image-fix pass (2026-07-10): both TMZ photos here (tickets #337,
        // #338) were junk news-graphics — a watermarked collage with a
        // celebrity inset, and a watermarked long-lens shot with a blurred
        // face. Replaced with two AP Photo/Robert F. Bukaty images (June 20,
        // 2026, Westerly RI) sourced via Fortune and The Washington Times'
        // wire copy. Curl-verified HTTP 200 + image/jpeg and visually
        // confirmed — clean, unwatermarked, single photos.
        //
        // ONLY THE OCEAN HOUSE TENT REMAINS. The second image — a security
        // guard at her Watch Hill estate — was REMOVED on 2026-07-22 (#1194)
        // as a Never-OK #2 violation: security arrangements at her private
        // residence, on a named date. It had been live on the site and passed
        // every nightly scan, because image captions were not screened until
        // that same fix. Do not restore it, and do not source a replacement
        // like it. The tent photo carries this moment on its own.
        photos: [
          {
            url: 'https://fortune.com/img-assets/wp-content/uploads/2026/06/AP26171861867196-e1782051050489.jpg?format=webp&w=1440&q=100',
            credit: 'AP Photo/Robert F. Bukaty, via Fortune',
            caption:
              'A couple walks past the Ocean House and the event tent on its lawn in Watch Hill, June 20, 2026 — the tent that fueled bachelorette-weekend speculation, though the resort said that weekend\'s booked wedding was an unrelated couple\'s.',
            kind: 'primary',
            // Tent peaks and the walking couple sit center-right, just above and below the midline.
            focalPoint: '52% 45%',
          },
        ],
        // Rumor Desk 2026-07-27: formalizes the wedding-DATE rumor this moment's
        // context references in passing ("paid a bride to give up her date") into
        // a tracked RumorNote with an honest DEBUNKED terminal state and a
        // citation — distinct from the June 19-20 bachelorette-tent sighting in
        // the prose above, which is a separate, single-source claim that faded.
        // Location stays at the public resort (Ocean House) and the town (Watch
        // Hill) — a public accommodation that itself denied the booking, and the
        // same venue this moment already names; her home is never named. This
        // debunked entry is the cleanest lifecycle example in the vault: a loud
        // tabloid claim that a definitive on-record outcome settled as false.
        rumors: [
          {
            claim:
              'Page Six reported in early December 2025 that Swift and Kelce would marry on Saturday, June 13, 2026 at the Ocean House resort in Watch Hill, Rhode Island — and that Swift had "paid off" another bride-to-be to free up the date.',
            reportedBy: 'Page Six (New York Post)',
            reportedOn: '2025-12-04',
            status: 'debunked',
            url: 'https://patch.com/rhode-island/across-ri/taylor-swift-paid-bride-be-get-wedding-date-ocean-house-watch-hill-page-six',
            note: 'Debunked on several fronts. Ocean House\'s Stephanie Leavitt denied any bought-out booking, and luxury planner Tara Guérard — overseeing a different wedding there that June 13 — said Taylor "is not her bride" that weekend. The couple married at Madison Square Garden on July 3, 2026; NPR reported "tabloid reports of a ceremony there proved unfounded." Location capped at the public resort and town.',
            sourceTier: 'tabloid',
            locationSpecificity: 'venue',
            lastCheckedOn: '2026-07-27',
            resolution: {
              on: '2026-07-03',
              url: 'https://www.npr.org/2026/07/03/nx-s1-5877361/taylor-swift-travis-kelce-wedding-msg',
              outlet: 'NPR',
              note: 'Swift and Kelce married at Madison Square Garden on July 3, 2026 — not on June 13 in Rhode Island. NPR: "tabloid reports of a ceremony there proved unfounded."',
            },
          },
        ],
      },
    },
    // --- Authored 2026-07-24 from intake #1454. A confirmed, documented
    // museum exhibit — culture/music item, clean on redlines (public
    // institution, Taylor's own work on display; "Cleveland" is the museum's
    // location, not her whereabouts). Chart facts cross-checked against the
    // existing "Fate of Ophelia" song item in this file (10 non-consecutive
    // weeks at No. 1). Photo is an establishing shot of the named venue.
    {
      slug: 'showgirl-rock-hall-ophelia-display',
      year: 2026,
      month: 6,
      day: 26,
      category: 'music',
      relatedIds: [
        'moment:vault-tloas-the-fate-of-ophelia-hamlets-drowned-girl-rescued-and-a-13th-',
        'moment:vault-tloas-the-fate-of-ophelia-video-premieres',
      ],
      title: 'The Rock Hall builds an "Ophelia" display — a tribute, not an induction',
      snippet:
        'Cleveland\'s Rock & Roll Hall of Fame opened a display built around "The Fate of Ophelia": the swimming costume and long beaded gown Taylor wears in the video, plus props and costumes worn by its dancers, up on Level 5 with the Legends of Rock. A tribute to the work — she isn\'t even eligible for induction until 2031.',
      sourceUrl: 'https://www.yahoo.com/entertainment/music/articles/rock-roll-hall-fame-opens-163000167.html',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/6/67/Rock_and_Roll_Hall_of_Fame%2C_May_2016.jpg',
      moment: {
        context:
          'The display sits on Level 5, folded into the museum\'s "Legends of Rock" section, and it\'s built entirely around "The Fate of Ophelia" — the Showgirl lead single that logged 10 non-consecutive weeks at No. 1 on the Hot 100, her longest-running chart-topper. Under glass: the swimming costume and the long beaded gown Taylor wears in the video, plus props and costumes worn by the clip\'s dancers. ABC Audio\'s writeup describes the video as an elaborate production that carries her through look after look across historical periods, from the 1800s to today.\n\nOne thing the coverage was careful to keep straight, and so are we: this is a tribute display, not a Hall of Fame induction. The museum\'s own rule is that an artist isn\'t eligible until 25 years after their first single, and "Tim McGraw" arrived in 2006 — so Taylor doesn\'t even come up for induction until 2031. The Rock Hall isn\'t waiting to celebrate her in the meantime, though: it\'s already hosted Taylor Swift Fan Days on site, with another in the works. Reported June 26, 2026.',
        sources: [
          {
            outlet: 'Yahoo Entertainment (ABC Audio)',
            url: 'https://www.yahoo.com/entertainment/music/articles/rock-roll-hall-fame-opens-163000167.html',
            source_title: 'Rock & Roll Hall of Fame opens Taylor Swift display',
            publisher: 'Yahoo Entertainment / ABC Audio',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Kiss 95.1',
            url: 'https://kiss951.com/2026/06/30/rock-hall-opens-taylor-swift-exhibit-with-the-fate-of-ophelia-artifacts/',
            source_title: 'Rock Hall opens Taylor Swift exhibit with "The Fate of Ophelia" artifacts',
            publisher: 'Kiss 95.1 (Beasley Media)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
        ],
        photos: [
          {
            // Establishing shot of the named venue (the exhibit interior isn't
            // on a reusable host); captioned as the building, not the display.
            // curl HTTP 200 + image/jpeg, 6000x4000, vision-confirmed as the
            // I.M. Pei pyramid with the "Rock & Roll Hall of Fame" entrance
            // banner. CC BY-SA 4.0, Wikimedia Commons.
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Rock_and_Roll_Hall_of_Fame%2C_May_2016.jpg',
            credit: 'MusikAnimal, CC BY-SA 4.0, via Wikimedia Commons',
            caption:
              'The Rock & Roll Hall of Fame in Cleveland, where the "Fate of Ophelia" display opened on Level 5 in June 2026.',
            kind: 'archival',
            // Glass pyramid and entrance banner sit dead center, just below the midline.
            focalPoint: '50% 48%',
          },
        ],
      },
    },
    // --- Authored 2026-07-24 from intake #1455. Unannounced-music / easter-egg
    // speculation — admissible per privacy-redlines.md ("unannounced music,
    // re-recordings, symbolism"). Whole item is sub-confirmed, so it rides a
    // "Reported — not confirmed" banner (confidence: reputable_reporting) with
    // Cosmopolitan first, rather than being woven into confirmed narrative.
    // Ticket said the June session was "with Alana and Danielle Haim" — the two
    // primary sources checked this run name NO collaborators (Yahoo explicitly:
    // "No collaborators were mentioned"), so that detail is CUT per the
    // no-fabrication rule. Electric Lady kept at venue level (L2), past-tense
    // documented professional activity; no precise clock times.
    {
      slug: 'showgirl-ts13-whispers',
      year: 2026,
      month: 6,
      category: 'music',
      confidence: 'reputable_reporting',
      title: 'The TS13 whispers begin: a late studio night and a "record in the works"',
      snippet:
        'Fans and outlets have started reading the tea leaves on album No. 13. The signs so far: Taylor was spotted at NYC\'s Electric Lady Studios for a marathon overnight session in early June, and a source told Us Weekly back in April she "does have another record in the works." No title, no date, nothing official — just signs, and a fandom that reads everything.',
      sourceUrl: 'https://www.yahoo.com/entertainment/music/articles/evidence-taylor-swift-next-album-185356681.html',
      thumbnailUrl: null,
      moment: {
        context:
          'Nothing here is announced — file it under fans-doing-what-fans-do. The most concrete thread is a working one: Taylor was spotted at Electric Lady Studios in New York for a roughly 12-hour overnight session in early June, which fans read as real recording rather than a quick drop-in. (Reports naming specific collaborators weren\'t backed by the outlets checked this week, so we\'re leaving names out.)\n\nThe line fans keep circling came from an Us Weekly source back in April: she "does have another record in the works, but there\'s no pressure to release it anytime soon" — "still very much in the creative stages." Cosmopolitan and Elite Daily then rounded up the easter-egg layer the internet had already assembled: an "A13" sign in the Eras docuseries finale where an "A12" once teased album 12, opal earrings with 13 stones, and the docuseries framing Life of a Showgirl as her biggest "to date." Read together, the fan case is that TS13 is on the way; read honestly, none of it is a plan Taylor or her team have confirmed.\n\nWorth keeping the tiers straight: a studio sighting is a documented fact, "another record in the works" is a named-but-anonymous source, and the number-13 numerology is pure fan reading. It\'s the kind of rumor that resolves the day an album is announced — and quietly fades if the signs go dark.',
        sources: [
          {
            outlet: 'Cosmopolitan (via Yahoo)',
            url: 'https://www.yahoo.com/entertainment/music/articles/evidence-taylor-swift-next-album-185356681.html',
            source_title: "There's New Evidence That Taylor Swift's Next Album, aka TS13, Is Incoming",
            publisher: 'Cosmopolitan',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          {
            outlet: 'Us Weekly (via AOL)',
            url: 'https://www.aol.com/articles/source-speaks-taylor-swift-plans-131746555.html',
            source_title: 'A Source Speaks on Taylor Swift\'s Album Plans',
            publisher: 'Us Weekly',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          {
            outlet: 'Elite Daily',
            url: 'https://www.elitedaily.com/entertainment/taylor-swift-album-13-clues-easter-eggs',
            source_title: 'Every Clue Taylor Swift\'s 13th Album Could Be Coming',
            publisher: 'Elite Daily',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 2,
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
      significance: 'defining', // the era's life-defining event (docs/decisions.md, 2026-07-18)
      // Cross-link deficit closed (2026-07-21, depth ledger #983 Q9): the era's
      // defining anchor now threads to its full engagement/wedding cluster.
      relatedIds: [
          'moment:vault-tloas-stevie-knicks-courtside-the-garden-three-weeks-before-the-we',
        'moment:vault-midnights-the-game-the-world-decided-made-it-official',
        'moment:vault-tloas-your-english-teacher-and-your-gym-teacher-are-getting-marrie',
        'moment:vault-tloas-the-ring-an-old-mine-diamond-from-a-goldsmith-taylor-already',
        'moment:vault-tloas-the-engagement-look-a-polo-ralph-lauren-dress-in-the-garden',
        'moment:vault-tloas-the-wedding-gown-a-custom-dior-haute-couture-styled-by-josep',
        'moment:vault-tloas-wedding-plans-teased-from-a-british-chat-show-couch',
        'moment:vault-tloas-new-york-city-confirms-the-price-tag-on-taylors-wedding-over',
        'moment:vault-tloas-the-ring-designer-gets-a-wedding-invite-of-her-own',
        'moment:vault-tloas-back-on-new-heights-a-married-man-with-a-proposal-story',
        'moment:vault-tloas-first-sighting-since-the-wedding-pink-markarian-at-a-friends',
        // Cross-link (candidate #1349): the wedding week's UK catalog chart bump.
        'moment:vault-tloas-the-wedding-week-nudges-the-whole-catalog-back-up-the-uk-cha',
        // Cross-link (candidate #1126): the Watch Hill bachelorette weekend two weeks before.
        'moment:vault-tloas-a-tented-lawn-in-rhode-island-two-weeks-before-the-wedding',
      ],
      title: 'Taylor and Travis marry at Madison Square Garden',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-tloas-5", label: "Married at MSG", kind: "life" },
      // the-proposal thread opt-in (stage 3, 2026-07-19): the End Game
      // thread's final beat, now derived from this moment.
      threadIds: ['the-proposal'],
      snippet:
        'A wedding officiated by their friend Adam Sandler — no bridesmaids or groomsmen, just Austin Swift as her Man of Honor and Jason Kelce as his best man. Roughly 1,000 guests, and a jumbotron outside the arena reading "JUST&T MARRIED!"',
      sourceUrl: 'https://www.cbsnews.com/news/taylor-swift-travis-kelce-wedding-day-madison-square-garden-nyc/',
      thumbnailUrl:
        'https://assets1.cbsnewsstatic.com/hub/i/r/2026/07/04/dcbf1e43-644d-45c1-9fd7-712be991cd59/thumbnail/620x403/8012c5092c88e86e560c7d3b3cb2ca54/gettyimages-2283939355.jpg',
      moment: {
        context:
          'The venue was the punchline and the point: after months of "destination wedding" speculation, the destination turned out to be Madison Square Garden — a 20,000-seat arena dressed for a wedding, with curtains hung across the glass entrance in the days before and a jumbotron outside reading "JUST&T MARRIED!" once it was done. Adam Sandler officiated and sang an original song for the couple at the ceremony. There were no bridesmaids or groomsmen: Austin Swift stood as his sister\'s Man of Honor, Jason Kelce as best man.\n\nGuest Jonathan Thomas, CEO of American Century Investments, gave the fullest outsider account of the ceremony itself on "The Compound & Friends" podcast (July 23): vows that ran close to 30 minutes each, Travis going first ("he made himself unbelievably vulnerable," Thomas said, "I looked around and there were all these 300-pound men from the football business crying as well") and Taylor following with her own, "poetic," equally lengthy vows. Sandler\'s officiating, Thomas said, ran another 20 to 30 minutes and "vacillated between funny, very sincere, sang a few things" — landing on two themes: a riff on "for richer or for poorer" ("you\'re not going to have to worry about that") and a repeated instruction to keep kissing each other, "in the morning, at night, after dinner."\n\nBoth bride and groom wore custom Christian Dior Haute Couture, and Stevie Nicks — the elder-showgirl touchstone of Swift\'s own catalog — performed at the reception. The guest list, roughly 1,000 people, ran the full width of their two worlds: Hugh Grant, Jason Sudeikis, Ethan Hawke, Abby Wambach, Joe Buck, Benson Boone, Cooper Kupp, and Paulina Gretzky among them, per CBS News\'s reporting. Seth Meyers attended with his wife Alexi Ashe, posing beforehand with longtime friends Brad Paisley and Kimberly Williams-Paisley; Meyers later called the celebration "wonderful," joking on his brother\'s podcast about the NDA that kept him from sharing more. What did not surface was the interior: no official photos of the ceremony or reception had been released as of the days after, leaving the arrivals, the curtained Garden, and the jumbotron as the event\'s entire public visual record.\n\nAccounts filled in the interior no photo showed: the arena floor built into a garden, peach-and-white at the ceremony and green-and-white beyond, each reading their vows from gold books. Once the ceremony ended, Thomas said, the space itself transformed — "they opened up the venue, you kind of walked through this massive castle that they built. And by the way, you would never guess you\'re in Madison Square Garden the way they did. It was incredible" — resolving months of unconfirmed pre-wedding reporting about a castle set under construction inside the arena. Paul McCartney played "I Want to Hold Your Hand"; guest Pat McAfee said on his show that Avril Lavigne performed "Sk8er Boi" and that Taylor joined Stevie Nicks\'s set. Catering ran through Scott Sartiano\'s orbit — his Sartiano\'s handled the July 2 rehearsal dinner and his club Zero Bond the reception, per Page Six. The couple sang too: per best man Jason Kelce — speaking on Ross Tucker\'s Football Podcast on July 21 — the newlyweds themselves performed a duet at the reception, though no song was reported. Jason said Travis "can sing" and "has always been able to carry a tune," if it "paled in comparison to some of the other people singing that night." Favors were embroidered handkerchiefs bearing the couple\'s "T&T" monogram, the July 3 date and a "Blank Space" lyric — the same T&T play behind the "JusT&T Married" marquee. It spanned days: a ~100-guest rehearsal dinner at the Garden on July 2, then the ~1,000-guest ceremony July 3 into the early hours. Confirmed guests ran wider than first reported — among them Bradley Cooper, Zoë Kravitz, Steven Spielberg and Tom Brady.',
        sources: [
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-travis-kelce-wedding-day-madison-square-garden-nyc/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/what-we-know-about-taylor-swift-travis-kelce-wedding/',
          },
          // Depth ledger #983 (2026-07-21): interior/ceremony detail, the
          // multi-day schedule, and the Nicks/McCartney performances.
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/lifestyle/lifestyle-news/taylor-swift-travis-kelce-wedding-blank-space-hankies-1236637926/',
            source_title: 'Taylor Swift-Travis Kelce Wedding Details Emerge: An Original Adam Sandler Song, "Blank Space" Handkerchiefs',
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'CNN',
            url: 'https://www.cnn.com/2026/07/02/entertainment/live-news/taylor-swift-travis-kelce-wedding',
            source_title: 'July 2: Taylor Swift and Travis Kelce\'s multiday wedding celebration begins',
            publisher: 'CNN',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/stevie-nicks-performance-taylor-swift-travis-kelce-wedding-1235586080/',
            source_title: 'Stevie Nicks Performs at Taylor Swift and Travis Kelce\'s Wedding',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          // Intake #1201 (2026-07-22): the couple's own reception duet,
          // confirmed by best man Jason Kelce on Ross Tucker's Football
          // Podcast (July 21). Primary quote is about Travis's singing; the
          // duet-with-Taylor framing is carried by multiple outlets and
          // attributed to Jason. No song was named — none authored.
          {
            outlet: 'ExtraTV',
            url: 'https://extratv.com/2026/07/21/taylor-swift-and-travis-kelce-sang-together-at-their-wedding-his-brother-jason-confirms/',
            source_title: 'Taylor Swift & Travis Kelce Sang Together at Their Wedding, His Brother Jason Confirms',
            publisher: 'ExtraTV',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 3,
          },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/celebrity/articles/travis-kelce-best-man-shares-085233670.html',
            source_title: 'Travis Kelce\'s Best Man Shares New Details About Taylor Swift Wedding Duet',
            publisher: 'Yahoo Entertainment',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 3,
          },
          // News catch-up pass (2026-07-23): resolves the pre-wedding TMZ
          // castle rumor below via an on-record guest account, and adds the
          // Sandler officiating detail and vow-length estimate (attributed
          // to that same guest, not stated as flat fact).
          {
            outlet: 'NBC New York',
            url: 'https://www.nbcnewyork.com/entertainment/entertainment-news/inside-taylor-swift-and-travis-kelce-30-minute-vows-massive-castle-reception/6529543/',
            source_title: "Inside Taylor Swift and Travis Kelce's '30 minute vows' and 'massive castle' reception",
            publisher: 'NBC New York',
            source_type: 'reputable_press',
            accessed_at: '2026-07-23',
            reliability_score: 4,
          },
          // News catch-up pass (2026-07-23): Seth Meyers + the Paisleys as
          // guests, previously not in the guest-list roster above.
          {
            outlet: 'NBC Insider',
            url: 'https://www.nbc.com/nbc-insider/seth-meyers-at-taylor-swift-wedding-comments',
            source_title: 'Seth Meyers & His Wife Went to Taylor Swift\'s "Wonderful" Wedding with Two Famous Pals',
            publisher: 'NBC Insider',
            source_type: 'reputable_press',
            accessed_at: '2026-07-23',
            reliability_score: 4,
          },
          // Ledger #1246 (2026-07-24): reception-music + vendor specifics — a
          // guest's on-record account of Avril Lavigne's set and Taylor joining
          // Stevie Nicks, and the confirmed caterers (Sartiano's / Zero Bond).
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/music/articles/avril-lavigne-rocked-taylor-swifts-165232336.html',
            source_title: "Avril Lavigne rocked Taylor Swift's wedding, famous guest says",
            publisher: 'Yahoo Entertainment',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          {
            outlet: 'Page Six (via Yahoo)',
            url: 'https://www.yahoo.com/entertainment/celebrity/articles/taylor-swift-enlists-help-one-114336219.html',
            source_title: 'Taylor Swift enlists help of one of her favorite NYC restaurants for Travis Kelce wedding',
            publisher: 'Page Six / Yahoo Entertainment',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
        ],
        photos: [
          {
            url: 'https://assets1.cbsnewsstatic.com/hub/i/r/2026/07/04/dcbf1e43-644d-45c1-9fd7-712be991cd59/thumbnail/620x403/8012c5092c88e86e560c7d3b3cb2ca54/gettyimages-2283939355.jpg',
            credit: 'Charly Triballeau/AFP via Getty Images',
            caption:
              'The jumbotron outside Madison Square Garden reading "JUST&T MARRIED!" as fans stop to photograph it, the Empire State Building behind.',
            kind: 'primary',
            // Focal points below set 2026-07-18 (photo-enrichment run 2, #762)
            // by downloading and viewing each frame. Here the jumbotron text is
            // the subject, upper-right of frame.
            focalPoint: '70% 35%',
          },
          {
            url: 'https://assets3.cbsnewsstatic.com/hub/i/r/2026/07/02/e66f5b93-8b69-4557-847c-106908119407/thumbnail/620x413/06cdf599d84c9a589b8eb695f3867456/2026-07-02t205104z-316575572-rc2w5maws1vu-rtrmadp-3-people-taylor-swift-kelce.jpg',
            credit: 'Christian Monterrosa/Reuters',
            caption:
              "In the run-up to the ceremony: crews on ladders hang curtains across the Garden's glass entrance while security stands watch outside.",
            kind: 'archival',
            // Crews on ladders + curtains occupy the upper half of the frame.
            focalPoint: '50% 30%',
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
            // Two faces flank center in the upper third.
            focalPoint: '48% 30%',
          },
          {
            url: 'https://assets1.cbsnewsstatic.com/hub/i/r/2026/07/03/46f18357-e274-4e86-a5ac-b173d9b01219/thumbnail/620x414/aff0da6d159019e0ce14046348347c7b/gettyimages-2284532594.jpg',
            credit: 'Roy Rochlin/Getty Images, via CBS News',
            caption:
              'Abby Wambach and Glennon Doyle arrive at Madison Square Garden for the wedding on July 3, 2026.',
            kind: 'primary',
            // The couple walks center-right; faces sit high in the frame.
            focalPoint: '62% 18%',
          },
          {
            url: 'https://assets2.cbsnewsstatic.com/hub/i/r/2026/07/03/5ba6ed3b-0728-43a7-a105-2fdc2beb7097/thumbnail/620x414/ca2a0b800b41ca793cc0db76270c7ef5/gettyimages-2283912122.jpg',
            credit: 'Angela Weiss/AFP via Getty Images, via CBS News',
            caption:
              'The scene outside: members of the media gather at Madison Square Garden on the wedding day, July 3, 2026.',
            kind: 'archival',
            // Officer mid-frame left-of-center anchors the shot; camera row right.
            focalPoint: '42% 45%',
          },
          {
            url: 'https://assets1.cbsnewsstatic.com/hub/i/r/2026/07/03/661a9e69-70e1-4a8c-88bc-e84d2bc985c0/thumbnail/620x414/82c6463f5b68d14f30b1660eb692a0d5/gettyimages-2283918271.jpg',
            credit: 'Tom Weller/picture alliance via Getty Images, via CBS News',
            caption:
              'Onlookers wait behind barriers outside Madison Square Garden ahead of the ceremony on July 3, 2026.',
            kind: 'archival',
            // Crowd faces run through the middle band, slightly left of center.
            focalPoint: '45% 50%',
          },
          // Still none of the ceremony/reception interior: no official or wire
          // photos from inside the ceremony/reception could be found and verified
          // as of 2026-07-09 — only exterior/arrival wire imagery exists to add.
        ],
        // Rumor-tier pilot (2026-07-19): the wedding is the canonical hot topic
        // where confirmed sourcing is thin (no interior photos, no official
        // statement) but reporting is loud. Everything below is a REAL,
        // attributed, dated press claim found and read this session — never a
        // fabrication — and renders in MomentDetail's visually distinct
        // "What's rumored" section, never woven into the confirmed narrative
        // above. Statuses are as of 2026-07-19; update them as facts land
        // (entries stay on record with an honest resolution badge).
        rumors: [
          {
            claim:
              'Sources close to the wedding told TMZ a massive white castle was being assembled inside a garden built on the arena floor — crews were filmed craning in a giant white staircase, and scenic crates arrived labeled "Garden Party."',
            reportedBy: 'TMZ',
            reportedOn: '2026-06-30',
            // Resolved 2026-07-23 (news catch-up pass): a named on-record
            // guest independently described walking through the same castle
            // build after the ceremony. Still no photos, but the physical
            // build-out itself is no longer just a pre-wedding tip.
            status: 'confirmed',
            url: 'https://www.tmz.com/2026/06/30/taylor-swift-travis-kelce-building-castle-for-wedding-celebration/',
            note: 'Confirmed 2026-07-23: guest Jonathan Thomas, CEO of American Century Investments, told "The Compound & Friends" podcast the reception space "opened up" into "this massive castle that they built," undetectable as Madison Square Garden. Still no interior photos exist to confirm the specific staircase/"Garden Party" crate details TMZ described.',
            sourceTier: 'tabloid',
            lastCheckedOn: '2026-07-23',
            resolution: {
              on: '2026-07-23',
              url: 'https://www.nbcnewyork.com/entertainment/entertainment-news/inside-taylor-swift-and-travis-kelce-30-minute-vows-massive-castle-reception/6529543/',
              outlet: 'NBC New York',
              note: 'A named, on-record guest confirmed the reception space was built out as a castle, independent of TMZ\'s original pre-wedding tip.',
            },
          },
          {
            claim:
              'Reports put the cost of hiring Madison Square Garden at roughly $3 million for three days — one to set up, one to marry, one to break it all down.',
            reportedBy: 'Hello!',
            reportedOn: '2026-07-02',
            status: 'unconfirmed',
            url: 'https://www.hellomagazine.com/us/910182/inside-taylor-swift-travis-kelce-wild-wedding-rumors/',
            note: 'An estimate aggregated from unnamed reports — neither the couple nor the venue has confirmed any figure. (Distinct from the separately confirmed $160K+ NYC permit fee — a city-services figure, not the cost of hiring the arena.)',
            sourceTier: 'tabloid',
            // Lifecycle re-check 2026-07-20: no outlet has confirmed the
            // venue-hire figure; still an unattributed estimate.
            lastCheckedOn: '2026-07-20',
          },
          {
            claim:
              'Pre-wedding reporting named Gigi Hadid and Selena Gomez as the only two confirmed members of the bridal party.',
            reportedBy: "Harper's Bazaar (via Fox News)",
            reportedOn: '2026-06-29',
            status: 'debunked',
            url: 'https://www.foxnews.com/entertainment/taylor-swifts-wedding-rumors-spark-speculation-close-friends-infamous-fallouts-bridal-party',
            note: 'There was no bridal party at all: no bridesmaids or groomsmen — Austin Swift stood as Man of Honor and Jason Kelce as best man.',
            sourceTier: 'tabloid',
            lastCheckedOn: '2026-07-20',
            resolution: {
              on: '2026-07-03',
              url: 'https://www.hollywoodreporter.com/lifestyle/lifestyle-news/taylor-swift-travis-kelce-bridesmaids-groomsmen-1236637288/',
              outlet: 'The Hollywood Reporter',
              note: 'Reported the day of the wedding: no traditional wedding party, only the two siblings.',
            },
          },
          {
            claim:
              'Page Six reported invitations had gone to Zoë Kravitz, Ed Sheeran, the Haim sisters and Suki Waterhouse, within a rumored A-list roster running from Selena Gomez to Bradley Cooper — while Blake Lively and Karlie Kloss were reportedly out.',
            reportedBy: 'Page Six (via Fox News)',
            reportedOn: '2026-06-29',
            status: 'partially_confirmed',
            url: 'https://www.foxnews.com/entertainment/taylor-swifts-wedding-rumors-spark-speculation-close-friends-infamous-fallouts-bridal-party',
            note: 'Several rumored names were later photographed arriving — including, against the reporting, Karlie Kloss (Rolling Stone, July 6). The full list was never published.',
            sourceTier: 'tabloid',
            // Lifecycle re-check 2026-07-20: no complete guest list has been
            // published; stays partially confirmed — some names verified by
            // arrival photos, the roster as a whole never confirmed.
            lastCheckedOn: '2026-07-20',
          },
          {
            claim:
              'The Daily Mail reported that save-the-date invitations came bundled with non-disclosure agreements guests had to sign.',
            reportedBy: 'Daily Mail (via Hello!)',
            reportedOn: '2026-07-02',
            // Lifecycle history: originally marked 'debunked' on the strength of
            // Graham Norton's on-air joke; corrected to 'unconfirmed' on
            // 2026-07-20 because that joke undercut the story's origin but never
            // addressed whether the invitations carried an NDA (two different
            // claims). Now promoted to 'confirmed' the same day: a named,
            // on-record guest independently confirmed the core claim. The
            // resolution citation is the confirmation, per the pipeline rule.
            status: 'confirmed',
            url: 'https://www.hellomagazine.com/us/910182/inside-taylor-swift-travis-kelce-wild-wedding-rumors/',
            note: 'Confirmed 2026-07-20: guest Jonathan Thomas, CEO of American Century Investments, told USA Today on the record that receiving an invitation required signing a non-disclosure agreement — "I won\'t get into the details of the NDA. But it had teeth." That settles the core claim (invitations carried NDAs), which the earlier Graham Norton remark had never actually disproven.',
            sourceTier: 'tabloid',
            lastCheckedOn: '2026-07-20',
            resolution: {
              on: '2026-07-19',
              // USA Today is the originating publisher; usatoday.com is not
              // reachable by our fetcher, so we cite its verbatim syndication
              // on AOL, which we read this session.
              url: 'https://www.aol.com/articles/taylor-swift-wedding-nda-had-181111000.html',
              outlet: 'USA Today (via AOL)',
              note: 'A named guest, on the record, confirmed the invitation process required signing an NDA — "it had teeth."',
            },
          },
          {
            claim:
              'Ed Sheeran was widely rumored to perform at the reception, fueled by Taylor\'s own October 2025 radio quip that "it would be hard to keep him from it."',
            reportedBy: 'Hello!',
            reportedOn: '2026-07-02',
            status: 'unconfirmed',
            url: 'https://www.hellomagazine.com/us/910182/inside-taylor-swift-travis-kelce-wild-wedding-rumors/',
            note: 'The only reception performance confirmed by post-wedding reporting was Stevie Nicks, per CBS News. No outlet has confirmed or denied that Sheeran — who was photographed arriving as a guest — actually performed.',
            sourceTier: 'tabloid',
            // Lifecycle re-check 2026-07-20: still no confirmation or denial of
            // a Sheeran performance; Nicks remains the only confirmed act.
            lastCheckedOn: '2026-07-20',
          },
          {
            claim:
              'Viral posts claimed to show real photos from inside the ceremony — including "first looks" at the gown.',
            reportedBy: 'Snopes (fact check)',
            reportedOn: '2026-07-09',
            status: 'debunked',
            url: 'https://www.snopes.com/news/2026/07/09/swift-kelce-wedding-photos/',
            note: 'Snopes found the circulating images were AI-generated fakes; no official photos of the ceremony or reception have been released.',
            sourceTier: 'established',
            lastCheckedOn: '2026-07-20',
            // Unusual shape, and correct: the report IS the debunking. Snopes
            // published the fact-check itself, so the claim arrived already
            // resolved and the citation is the same URL.
            resolution: {
              on: '2026-07-09',
              url: 'https://www.snopes.com/news/2026/07/09/swift-kelce-wedding-photos/',
              outlet: 'Snopes',
              note: 'The fact-check that debunked the images on publication.',
            },
          },
          {
            // Added 2026-07-20 (Rumor Desk): a forward-looking, adjudicable
            // claim about how/whether the real photos surface — carries no
            // location, so the provenance matrix is not engaged.
            claim:
              'With no official ceremony photos released more than two weeks on, reports said Taylor was deliberately holding them back — planning to unveil them as a "cultural moment" (a documentary or coffee-table book) rather than sell them to a magazine.',
            reportedBy: 'Rob Shuter’s Naughty But Nice (via Reality Tea)',
            reportedOn: '2026-07-20',
            status: 'unconfirmed',
            url: 'https://www.realitytea.com/2026/07/20/taylor-swift-wedding-photos-out-release/',
            note: 'A gossip-newsletter claim about her release strategy. Better-sourced update 2026-07-25 (ledger #1246): Dior told The New York Times that Swift herself will post the first wedding images to Instagram (timing unstated), and People reported no plans for a wedding documentary or film. No official photographer of record has been named — so the official channel is her own Instagram, on her own timing.',
            sourceTier: 'tabloid',
            lastCheckedOn: '2026-07-25',
          },
          {
            // Added 2026-07-25 (ledger #1246): the ceremony processional music.
            // Kept a rumor — the format is corroborated but the specific title
            // is single-source and unconfirmed by the couple.
            claim:
              'Ceremony music: a live string ensemble ushered in the wedding party, and a source-based account had Swift walking down the aisle to an instrumental version of "Love Story," with The Darkness\'s "I Believe in a Thing Called Love" as the recessional after the vows.',
            reportedBy: 'Yahoo Entertainment',
            reportedOn: '2026-07-05',
            status: 'unconfirmed',
            url: 'https://www.yahoo.com/entertainment/music/articles/taylor-swift-travis-kelce-walked-110045264.html',
            note: 'The processional FORMAT (live strings, an acoustic version of one of her own songs) is corroborated across outlets, but the specific "Love Story" title rests on a single unnamed source and is unconfirmed by the couple — Wikipedia records only "an acoustic version of one of her songs." Public-facing, redline-clean.',
            sourceTier: 'established',
            lastCheckedOn: '2026-07-25',
          },
          // PRIVACY-DROPPED (2026-07-19, docs/content-ops/privacy-redlines.md
          // Never-OK #1): an ET honeymoon-location rumor was cut here in
          // review. A honeymoon is a private trip, not a public appearance —
          // naming its "ultra-private" location, with a note speculating about
          // a further European trip (forward-looking whereabouts), is exactly
          // what the redlines exist to keep out. Attribution does not launder
          // a privacy violation.
        ],
      },
    },
    // --- News catch-up pass (2026-07-23): the authoring cadence stalled for
    // several days while ingestion kept running; these four items clear the
    // real backlog of verified, non-gossip wedding-adjacent stories. Every
    // URL and quote below was independently re-fetched and read this
    // session, not taken on trust from research-assistant output.
    {
      slug: 'showgirl-answer-the-call-donation',
      year: 2026,
      month: 7,
      day: 2,
      category: 'relationship',
      relatedIds: ['moment:vault-tloas-taylor-and-travis-marry-at-madison-square-garden'],
      title: 'A $2 million gift to the families of New York\'s fallen first responders',
      snippet:
        'Ahead of their wedding, Taylor and Travis directed $2 million of their reported $26 million in charitable giving to Answer the Call, the fund supporting families of NYC police, fire, Port Authority and EMS personnel killed in the line of duty.',
      sourceUrl: 'https://www.tmz.com/2026/07/02/how-taylor-swift-travis-kelce-charity-donations-are-being-used/',
      thumbnailUrl: null,
      moment: {
        context:
          'The gift went to Answer the Call — formally the New York Police and Fire Widows\' & Children\'s Benefit Fund — which currently supports roughly 500 families with annual $15,000 stipends. It was one piece of a reported $26 million the couple gave to more than 20 organizations around their wedding.\n\nThe confidence tiers matter here: the couple\'s representative confirmed the $26 million aggregate to Rolling Stone but did not itemize it, so the individual gift amounts surfaced only through the recipients themselves. On that basis the roughly 20 organizations sort into about nine food banks (City Harvest, which said it received $1 million; Feeding America, which thanked the couple for $2 million; Food Bank for NYC; the Los Angeles Regional Food Bank; Harvesters in Kansas City; and others), three children\'s hospitals (MSK Kids at Memorial Sloan Kettering, Hassenfeld Children\'s Hospital at NYU Langone, and Children\'s Mercy in Kansas City), seven education and youth programs (Education Through Music, Musical Mentors, After-School All-Stars, Grammy In The Schools, Dolly Parton\'s Imagination Library among them), an animal-welfare gift to the ASPCA, and the $2 million to Answer the Call. That $2 million figure was not stated by the couple\'s reps either; it comes from the fund\'s own public thank-you, which called the gift generous and said it would "make a tangible difference" for families but did not spell out how the money would be spent. No personal FDNY or NYPD connection has been reported — the link appears to be the New York wedding itself. Against the fund\'s scale — it has distributed more than $140 million to line-of-duty families since 1985, paying $50,000 immediately after a death and lifelong stipends thereafter — $2 million covers well over a hundred family-years of support. The giving was announced ahead of the Madison Square Garden ceremony and framed throughout as marking the wedding; whether any of it was structured as a multi-year pledge, and whether this was a first-time gift to these groups, has not been reported.',
        sources: [
          {
            outlet: 'TMZ',
            url: 'https://www.tmz.com/2026/07/02/how-taylor-swift-travis-kelce-charity-donations-are-being-used/',
            source_title: "How Taylor Swift and Travis Kelce's $26 Million Charity Donation is Being Used",
            publisher: 'TMZ',
            source_type: 'reputable_press',
            accessed_at: '2026-07-23',
            reliability_score: 3,
          },
          {
            outlet: 'The Kansas City Star (via FireRescue1)',
            url: 'https://www.firerescue1.com/fundraising/taylor-swift-travis-kelce-give-2m-to-families-of-fallen-nyc-first-responders',
            source_title: 'Taylor Swift, Travis Kelce give $2M to families of fallen NYC first responders',
            publisher: 'The Kansas City Star',
            source_type: 'reputable_press',
            accessed_at: '2026-07-23',
            reliability_score: 3,
          },
          // Ledger #1242 (2026-07-24): the full recipient list, the confidence
          // tiering (rep-confirmed $26M aggregate vs recipient-reported per-gift
          // amounts), and the fund's own acknowledgement.
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-travis-kelce-donate-26-million-charity-1235588245/',
            source_title: 'Taylor Swift, Travis Kelce Kick Off Wedding Week With $26 Million Charity Donation',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'ABC7 New York',
            url: 'https://abc7ny.com/post/taylor-swift-travis-kelce-donate-26-million-20-charities-country/19438669/',
            source_title: 'Taylor Swift and Travis Kelce donate $26 million to 20 charities across the country',
            publisher: 'WABC-TV (ABC7 New York)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Officer.com',
            url: 'https://www.officer.com/features/honoring-the-fallen/news/55393246/taylor-swift-and-travis-kelce-donate-2-million-to-nyc-first-responder-families-through-answer-the-call',
            source_title: 'Taylor Swift and Travis Kelce Donate $2 Million to NYC First Responder Families Through Answer The Call',
            publisher: 'Officer.com (Endeavor Business Media)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          {
            outlet: 'Answer the Call',
            url: 'https://www.answerthecall.org/who-we-are/',
            source_title: "Who We Are — New York Police & Fire Widows' & Children's Benefit Fund",
            publisher: "New York Police & Fire Widows' & Children's Benefit Fund",
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
        ],
      },
    },
    {
      // Authored 2026-07-25 from intake #1524. The wedding-as-event is already
      // the `msg-wedding` moment (significance: defining) — the intake's "not
      // yet captured / parent record" framing was wrong and is corrected in the
      // ledger. What IS new is the Kelce family going on the record welcoming
      // Taylor; it lands as its own beat here rather than bloating msg-wedding,
      // whose context is already at the 4000-char DB cap. Two independent
      // established outlets carry the identical on-record quotes (relationship
      // two-source bar): TODAY was fetched and verified directly this session.
      // The adjacent flower-girls/minors detail was deliberately NOT authored
      // (privacy redline #5); Donna's line is a public remark at a public event.
      slug: 'showgirl-kelces-welcome-taylor-family',
      year: 2026,
      month: 7,
      day: 23,
      category: 'relationship',
      relatedIds: [
        'moment:vault-tloas-taylor-and-travis-marry-at-madison-square-garden',
        'moment:vault-tloas-first-sighting-since-the-wedding-pink-markarian-at-a-friends',
      ],
      title: 'The Kelces put it on the record: Taylor is family',
      snippet:
        'In the weeks after the July 3 wedding, Travis\'s family spoke up: Kylie Kelce called it "absolutely magical" and said Taylor had "been part of the family now for quite some time," the wedding "only making it official."',
      sourceUrl: 'https://www.today.com/popculture/news/kylie-kelce-calls-taylor-swift-family-after-travis-kelce-wedding-rcna588869',
      thumbnailUrl: null,
      moment: {
        context:
          'For all the secrecy around the July 3 wedding itself, the warmth around it surfaced in the weeks after — and it came from Travis\'s side of the aisle. On the July 23 episode of her podcast "Not Gonna Lie," Kylie Kelce — married to Travis\'s brother Jason — called the ceremony "absolutely magical" and "intimate, and incredible, and full of love both for each other and for everybody else\'s love for them," and said she was "so happy for them." The line fans seized on reframed the day as a formality more than a threshold: "Taylor\'s been part of the family now for quite some time," Kylie said, the wedding "only making it official."\n\nTravis\'s mother Donna Kelce — bound by the same NDA that had guests like Seth Meyers joking about how little they could say — kept it to a single word when she was caught at the July 4 Macy\'s fireworks show: it was "magical, man." Neither said more about the ceremony\'s particulars. The family\'s public role here was less to reveal the day than to close the loop on the relationship it sealed — a Kelce welcome stated plainly, on the record.',
        sources: [
          {
            outlet: 'TODAY',
            url: 'https://www.today.com/popculture/news/kylie-kelce-calls-taylor-swift-family-after-travis-kelce-wedding-rcna588869',
            source_title: "Kylie Kelce Calls Taylor Swift 'Family' After Wedding to Travis Kelce",
            publisher: 'TODAY',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1434258/travis-kelce-taylor-swift-wedding-kylie-kelce-shares-details',
            source_title: "Kylie Kelce Details 'Absolutely Magical' Taylor Swift, Travis Kelce Wedding",
            publisher: 'E! News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
        ],
      },
    },
    {
      slug: 'showgirl-wedding-bands-first-look',
      year: 2026,
      month: 7,
      day: 20,
      category: 'relationship',
      relatedIds: [
          'moment:vault-tloas-the-ring-an-old-mine-diamond-from-a-goldsmith-taylor-already',
        'moment:vault-tloas-taylor-and-travis-marry-at-madison-square-garden',
        'moment:vault-tloas-first-sighting-since-the-wedding-pink-markarian-at-a-friends',
      ],
      title: 'Clearer looks at both wedding bands finally surface',
      snippet:
        'New photos give the clearest public look yet at Taylor\'s diamond wedding band and Travis\'s plain gold one — after the pair\'s first blurry, distant appearance together on July 10.',
      sourceUrl: 'https://stylecaster.com/entertainment/celebrity-news/1234935260/travis-kelce-wedding-ring-photos-taylor-swift/',
      thumbnailUrl: null,
      moment: {
        context:
          'The first public look at the couple\'s wedding bands came July 10, blurry and distant, at former teammate JuJu Smith-Schuster\'s wedding — the bands\' own designer and specifics undisclosed. Sharper looks followed: Harper\'s Bazaar identified a plain gold band on Travis\'s left hand in July 16 training photos, and a July 20 photo posted by Cris Carter gave StyleCaster another clear angle. Separately, a Vogue Weddings carousel from the Smith-Schuster wedding let ELLE Australia\'s jewelry expert examine Taylor\'s stack more closely, describing what appears to be a chunky diamond band alongside her engagement ring — though ELLE Australia is explicit that the photo isn\'t sharp enough to confirm exact specifications, and no designer, carat count or price has been confirmed by the couple. ELLE Australia\'s expert Cushla Whiting placed the band within a specific 2026 shift she calls a moment for "chunkier diamond wedding bands" — substantial diamond bands rather than thin plain-metal ones, driven by bolder engagement rings and chosen so a band "feels balanced alongside them rather than disappearing beneath the centre stone." No imagery from the wedding day itself (July 3 at Madison Square Garden) surfaced either band; the genuine first public look did not come until July 10, and every detail on record remains outside observation of photos, with no comment from the couple or Tree Paine. That July 10 debut — Taylor in a pink-and-gold Markarian brocade gown, the band visible on her hand — was itself the ring\'s first public sighting, so the clearer angles here trace to the July 16 and July 20 photos, not a later solo outing. One caution on the specs floating around online: retailers now sell "inspired-by" lookalike bands (some marketed at around 2.5 carats), but those are stand-ins, not Swift\'s actual ring — which, unlike the engagement ring experts openly pegged at 8–10 carats and $550,000–$1 million, the couple has left entirely unspecified. The engagement ring\'s maker offers no shortcut either: goldsmith Kindred Lubeck of Artifex, who gave several interviews about that ring, has never spoken about the wedding bands, and one jewelry writeup that attributes diamond eternity bands Swift has been photographed wearing to the label A.Jaffe is a single-outlet read, unconfirmed by the couple and possibly conflating her earlier stack. Trend coverage did place the finished stack in company: a Taylor & Hart bridal piece lined it up with Dua Lipa\'s slim gold band and Zendaya\'s "cool-girl gap" pairing as 2026\'s marquee celebrity rings, and a People roundup grouped Swift\'s old-mine cut with Dua Lipa\'s gypsy-set diamond.',
        sources: [
          {
            outlet: 'StyleCaster',
            url: 'https://stylecaster.com/entertainment/celebrity-news/1234935260/travis-kelce-wedding-ring-photos-taylor-swift/',
            source_title: "Travis Kelce's Wedding Band Photos Finally Released as Fans Get 1st Look at His Matching Band with Taylor Swift",
            publisher: 'StyleCaster',
            source_type: 'reputable_press',
            accessed_at: '2026-07-23',
            reliability_score: 3,
          },
          {
            outlet: "Harper's Bazaar",
            url: 'https://www.harpersbazaar.com/celebrity/latest/a73169277/travis-kelce-wedding-ring-band-taylor-swift-photos/',
            source_title: 'Travis Kelce Steps Out Wearing His Wedding Ring for the First Time!',
            publisher: "Harper's Bazaar",
            source_type: 'reputable_press',
            accessed_at: '2026-07-23',
            reliability_score: 3,
          },
          {
            outlet: 'ELLE Australia',
            url: 'https://www.elle.com.au/fashion/wedding/taylor-swift-diamond-wedding-ring-expert-details/',
            source_title: 'Taylor Swift\'s Diamond Wedding Band Signals An Emerging 2026 Bridal Trend',
            publisher: 'ELLE Australia',
            source_type: 'reputable_press',
            accessed_at: '2026-07-23',
            reliability_score: 3,
          },
          // Ledger #1243 (2026-07-24): the July 10 pink-Markarian appearance was
          // itself the band's first public sighting (band visible on her hand).
          // The circulating "2.5-carat" figures trace to retailer "inspired-by"
          // lookalike pages (tedwedding.com, caratdiamonds.com) seen this
          // session — marketing stand-ins, not reporting on her actual band;
          // flagged in the prose, not cited as fact about her ring.
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/celebrity/articles/taylor-swift-makes-her-first-141339478.html',
            source_title: 'Taylor Swift Makes Her First Post-Wedding Appearance at… Another Wedding!',
            publisher: 'Yahoo Entertainment (via People)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          // Ledger #1243 (2026-07-25): the engagement-ring goldsmith (Kindred
          // Lubeck / Artifex) has spoken only about the engagement ring, never
          // the bands; the circulating A.Jaffe band attribution is a single
          // outlet's read, labeled as such, not asserted. Plus the celebrity-
          // stack comparison (Dua Lipa / Zendaya) in the spirit of the
          // engagement page's carat comparisons.
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/taylor-swift-engagement-ring-jeweler-kindred-lubeck-interview-rcna238142',
            source_title: "Taylor Swift's engagement ring jeweler, Kindred Lubeck, on designing the ring",
            publisher: 'Today',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/celebrity/articles/taylor-swift-wedding-bands-sentimental-180641943.html',
            source_title: "Taylor Swift's wedding bands, explained",
            publisher: 'Yahoo Entertainment',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 2,
          },
          {
            outlet: 'Taylor & Hart',
            url: 'https://taylorandhart.com/us/blog/taylor-swift-dua-lipa-zendayas-wedding-rings-bridal-stacking-in-2026',
            source_title: "Taylor Swift, Dua Lipa & Zendaya's wedding rings: bridal stacking in 2026",
            publisher: 'Taylor & Hart',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 2,
          },
          {
            outlet: 'AOL',
            url: 'https://www.aol.com/articles/best-celebrity-engagement-rings-2025-150000468.html',
            source_title: 'The Best Celebrity Engagement Rings of 2025',
            publisher: 'AOL (via People)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
        ],
        // Rumor Desk 2026-07-24 (news digest): the narrative above notes the
        // couple has confirmed no designer, spec or price for either band.
        // This labels the one attributed READING of the design intent that has
        // surfaced — an expert interpretation, not a confirmed detail. Public-
        // facing (jewelry), redline-clean, no location.
        rumors: [
          {
            claim:
              'ELLE asked three fine-jewelry founders to read Travis Kelce\'s newly photographed wedding band; they described a simple, timeless yellow-gold comfort-fit band roughly 5–6mm wide, valued around $2,000–$6,000, and read the yellow-gold choice as a deliberate complement to the tone of Taylor\'s yellow-gold engagement ring — "a nice way to match," in Steph Mazuera\'s words.',
            reportedBy: 'ELLE (Alyssa Bailey)',
            reportedOn: '2026-07-22',
            status: 'unconfirmed',
            url: 'https://www.aol.com/articles/travis-kelce-wedding-band-nods-195810000.html',
            note: 'An expert reading of design intent, not a confirmed fact — neither the couple nor any jeweler has named the band\'s designer, metal spec, or the reason for the gold; the width and price are estimates from photos. Resolves if the couple or the band\'s maker confirms or denies the intended nod, and a candidate to fade otherwise. ELLE\'s piece read this session via its verbatim AOL syndication.',
            sourceTier: 'established',
            lastCheckedOn: '2026-07-24',
          },
        ],
      },
    },
    {
      slug: 'showgirl-shania-twain-wedding-conflict',
      year: 2026,
      month: 7,
      day: 23,
      category: 'relationship',
      relatedIds: ['moment:vault-tloas-taylor-and-travis-marry-at-madison-square-garden'],
      title: 'Shania Twain explains the scheduling conflict that kept her from the wedding',
      snippet:
        'Twain says she was honored by the invitation but had already committed to opening for Harry Styles at Wembley Stadium the same weekend as the July 3 ceremony.',
      sourceUrl: 'https://www.the-independent.com/arts-entertainment/music/news/taylor-swift-wedding-shania-twain-b3020210.html',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/3/30/Shania_Twain_Glaston2024_2806_300624_%2822_of_173%29_%2853838020769%29_%28cropped%29.jpg',
      moment: {
        context:
          'Twain opened for Styles\'s 12-night London residency, which ran through July 4 — directly overlapping the wedding weekend. She gave the same explanation in two on-record appearances: to eTalk, that she\'d already committed to the Wembley booking and chose to honor it; on the July 22 Tonight Show, that she was honored to have been invited and planned to congratulate Taylor in person next time they met.\n\nHer own words filled it in. To eTalk (first reported July 14): "Taylor Swift invited me to her wedding. And I couldn\'t go because I was already committed to Harry\'s shows," adding she "would have done anything" to be there "but I was with Harry," and laughing off that the conflict was Swift\'s own ex — "It\'s just kind of funny that that happened that way." On Fallon she praised the craft over the absence: "She\'s a fabulous performer… she does write her own songs. She sits down at home, plays the piano, plays the guitar. So I admire her musicianship and her commitment to telling her stories. I love everything about her." The history runs the other way too — Swift has long named Twain among her formative country influences — though Twain did not invoke that in these appearances. No public gift or message was sent in lieu of attending; she framed the make-good as an in-person congratulations. She was one of several invited names who publicly explained missing the July 3 ceremony, alongside Ryan Seacrest (a work commitment), Robert Pattinson (a film shoot) and Charles Barkley (who declined outright).',
        sources: [
          {
            outlet: 'The Independent',
            url: 'https://www.the-independent.com/arts-entertainment/music/news/taylor-swift-wedding-shania-twain-b3020210.html',
            source_title: 'Shania Twain explains why she had to decline Taylor Swift\'s wedding invite',
            publisher: 'The Independent',
            source_type: 'reputable_press',
            accessed_at: '2026-07-23',
            reliability_score: 4,
          },
          {
            outlet: 'TMZ',
            url: 'https://www.tmz.com/2026/07/14/shania-twain-explains-missing-taylor-swifts-wedding-for-harry-styles-concert/',
            source_title: "Shania Twain Says She Couldn't Ditch Harry Styles Concert For Taylor Swift's Wedding",
            publisher: 'TMZ',
            source_type: 'reputable_press',
            accessed_at: '2026-07-23',
            reliability_score: 3,
          },
          // Ledger #1267 (2026-07-24): verbatim eTalk + Fallon quotes, the
          // Twain-as-influence backstory, and the other invited guests who
          // explained their absence.
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/country/shania-twain-talks-taylor-swift-new-album-fallon-1236301256/',
            source_title: "'I Love Everything About Her': Shania Twain Has Only Good Things to Say About Taylor Swift",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'RTÉ',
            url: 'https://www.rte.ie/entertainment/2026/0723/1584789-twain-missed-swifts-wedding-to-perform-with-harry-styles/',
            source_title: "Twain missed Swift's wedding to perform with Harry Styles",
            publisher: 'RTÉ',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/why-shania-twain-is-opening-for-harry-styles-1235579099/',
            source_title: 'Why Shania Twain Is Opening for Harry Styles',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'The Boot',
            url: 'https://theboot.com/taylor-swift-country-music-roots-2000s-albums/',
            source_title: "How Taylor Swift's Career Beginnings Foreshadowed Her Move to Pop, Continuing Country Influence",
            publisher: 'The Boot',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
        ],
        // Photo added at backfill 2026-07-24 (Wyatt: recent posts should have
        // pictures). Archival portrait — the wedding-decline was explained in
        // interviews, not a photographed event, so this is the closest true
        // visual: Twain onstage. upload.wikimedia.org (allowlisted); curl 200 +
        // image/jpeg, 1595x2394, vision-confirmed as Shania.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Shania_Twain_Glaston2024_2806_300624_%2822_of_173%29_%2853838020769%29_%28cropped%29.jpg',
            credit: 'Raph_PH / Wikimedia Commons, CC BY 2.0',
            caption: 'Shania Twain performing at Glastonbury Festival, June 30, 2024.',
            kind: 'archival',
            focalPoint: '50% 22%',
          },
        ],
      },
    },
    {
      slug: 'showgirl-jason-kelce-fanbase-shift',
      year: 2026,
      month: 7,
      day: 21,
      category: 'relationship',
      relatedIds: [
        'moment:vault-tloas-taylor-and-travis-marry-at-madison-square-garden',
        // Cross-link (candidate #1294): the New Heights proposal-story episode —
        // the same Kelce-family-media-and-fame throughline.
        'moment:vault-tloas-back-on-new-heights-a-married-man-with-a-proposal-story',
      ],
      title: 'Jason Kelce on the new audience Taylor brought to the whole family',
      snippet:
        'Jason Kelce says his brother\'s relationship with Taylor Swift changed who stops him on the street — from Eagles fans thanking him for his career to, increasingly, young girls who know the family through her.',
      sourceUrl: 'https://people.com/jason-kelce-reveals-how-his-life-has-changed-since-travis-kelce-taylor-swift-started-dating-12024707',
      thumbnailUrl: null,
      moment: {
        context:
          'On the July 21 Ross Tucker Football Podcast, Jason said the shift in his own public life was gradual through his 13 NFL seasons, then "a very big flip" once Travis and Taylor started dating. In his own words: "I went from very much being dominated by large fat men coming up to me and shaking my hand and thanking me for being an Eagle to little girls. It was quite a shift of people that became fans."\n\nAsked whether it happened gradually, Jason said it "was definitely gradual, and then it just like was a big flip obviously when Taylor and Travis started dating" — one that "led to a whole other demographic and fan base being interested, not just me, my entire family." The numbers bear the shift out. When Swift first attended a Chiefs game (vs. the Bears, Sept. 24, 2023), Travis\'s jersey sales spiked nearly 400% across the Fanatics network, vaulting him from the 19th-best-selling NFL player into the top five in a single Sunday. The brothers\' New Heights podcast, building since 2022, then signed a reported $100 million-plus deal with Amazon\'s Wondery in August 2024; and when Swift herself sat down on the show in August 2025, the episode pulled more than 15 million YouTube views in under two days and a record 1.3 million concurrent livestream viewers, topping Spotify\'s episode, trending and sports charts at once. The reach extends past the Kelces: a LendingTree survey found 13% of U.S. consumers — and 24% of Gen Z — said Swift raised their interest in watching football, the "large fat men to little girls" flip measured at national scale.',
        sources: [
          {
            outlet: 'People',
            url: 'https://people.com/jason-kelce-reveals-how-his-life-has-changed-since-travis-kelce-taylor-swift-started-dating-12024707',
            source_title: 'Jason Kelce Reveals How His Life Has Changed Since Travis Kelce Started Dating Taylor Swift',
            publisher: 'People',
            source_type: 'reputable_press',
            accessed_at: '2026-07-23',
            reliability_score: 4,
          },
          {
            outlet: "Harper's Bazaar",
            url: 'https://www.harpersbazaar.com/celebrity/latest/a73247382/jason-kelce-talks-impact-of-travis-taylor-swift-relationship-fame/',
            source_title: 'Jason Kelce Gets Candid About How Life Has Changed Since Taylor Swift Joined the Family',
            publisher: "Harper's Bazaar",
            source_type: 'reputable_press',
            accessed_at: '2026-07-23',
            reliability_score: 3,
          },
          // Ledger #1292 (2026-07-24): more of Jason's July 21 remarks + the
          // quantified "Taylor effect" (jersey spike, the New Heights/Wondery
          // deal, the record Swift episode, the LendingTree football-interest survey).
          {
            outlet: 'Pro Football Network',
            url: 'https://www.profootballnetwork.com/jason-kelce-taylor-swift-family-fame-stratosphere/',
            source_title: "'A Whole Other Demographic' — Jason Kelce Details How Taylor Swift Elevated His Family's Fame",
            publisher: 'Pro Football Network',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          {
            outlet: 'KCUR (NPR)',
            url: 'https://www.kcur.org/sports/2023-09-28/taylor-swifts-travis-kelce-kansas-city-chiefs-jersey',
            source_title: "Taylor Swift's star power sends Travis Kelce's jersey sales soaring",
            publisher: 'KCUR / NPR',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-travis-kelce-podcast-ratings-1236344673/',
            source_title: 'Taylor Swift-Travis Kelce Podcast Delivers a Massive 15 Million Views, Stream Crashes',
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Awful Announcing',
            url: 'https://awfulannouncing.com/podcasts/kelce-brothers-new-heights-amazon-deal.html',
            source_title: "Kelce brothers reach $100 million-plus deal with Amazon for 'New Heights'",
            publisher: 'Awful Announcing',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          {
            outlet: 'LiveNOW from FOX',
            url: 'https://www.livenowfox.com/news/taylor-swift-nfl-impact-travis-kelce',
            source_title: 'How Taylor Swift changed the NFL — and how the NFL changed Taylor Swift',
            publisher: 'FOX Television Stations',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
        ],
      },
    },
    {
      slug: 'wedding-gown-dior-anderson',
      year: 2026,
      month: 7,
      day: 3,
      category: 'fashion',
      // Rumor-tier pilot (2026-07-19), RESOLVED 2026-07-21 (ledger #1022): the
      // commission is now confirmed on both sides — Swift publicist Tree Paine's
      // wedding-night press release (July 3) named Christian Dior Haute Couture
      // by Anderson, and Anderson spoke on the record at his Dior couture show
      // (WWD/USA Today, July 6-7). Confidence lifted reputable_reporting ->
      // official; the "Reported — not confirmed" banner retires. The Elizabeth
      // Taylor touchstone stays flagged as designer-unconfirmed (press
      // speculation only), and no official gown photo has been released yet.
      confidence: 'official',
      // Cross-link (candidate #1023): the gown reportedly references Elizabeth
      // Taylor's 1950 bridal look, and track two is named for her.
      relatedIds: ['moment:vault-tloas-elizabeth-taylor-the-first-song-she-wrote-for-the-album'],
      title: 'The wedding gown: a custom Dior Haute Couture, styled by Joseph Cassell',
      snippet:
        "Jonathan Anderson's first celebrity couture bridal commission at Dior — a custom gown reportedly drawing on Elizabeth Taylor's 1950 wedding dress, worn with custom Christian Louboutin shoes and Cartier jewelry.",
      sourceUrl: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-wedding-dress-dior-jonathan-anderson-2-1236637523/',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift, Travis and longtime stylist Joseph Cassell worked directly with Jonathan Anderson and the Dior ateliers on Avenue Montaigne on an entirely custom design. The commission is now confirmed on both sides: publicist Tree Paine\'s wedding-night press release said both ceremony looks were "created by Christian Dior Haute Couture" by Anderson "in close collaboration with the bride and groom," calling it "the designer\'s first couture wedding dress for a world-renowned celebrity"; days later, at his Dior couture show, Anderson spoke on the record — "It was a joy to work with her. We became very good friends. It\'s an emotional thing doing someone\'s wedding." Official photos of the gown remain unreleased and the viral "first look" images were AI fakes (Snopes), so the gallery uses only clearly-labeled reference images. Harper\'s Bazaar reports Swift changed into a second gown for the reception (the house was not named).\n\nThe commission caps a whirlwind first year for Anderson at Dior: named creative director of womenswear and haute couture on June 2, 2025 — on top of Dior Men — he became the first designer since Christian Dior himself to lead all three lines, succeeding Maria Grazia Chiuri after his acclaimed run at Loewe. A widely reported but designer-unconfirmed touchstone is Elizabeth Taylor\'s gown for her May 6, 1950 wedding to Conrad "Nicky" Hilton: designed by MGM\'s Helen Rose and gifted by the studio, which turned the wedding into a publicity event for Father of the Bride — the film in which Rose also dressed the 18-year-old Elizabeth as a bride, the lace-and-veil look in the reference image here.\n\nThat Elizabeth Taylor echo completes a circle the album drew first: track two of The Life of a Showgirl is named for her. Anderson did not confirm the reference. Per Tree Paine\'s release and WWD, the finishing pieces were custom Christian Louboutin shoes and Cartier jewelry; the specific styles were not disclosed.\n\nNo official image has been published, so everything about the garment itself is still eyewitness account. A source told People the ceremony look had a "long veil and train" and was "perfectly Taylor," not straying from her signature style; guests told the Daily Mail it was a big white, off-the-shoulder gown with a very long train — one estimated it at roughly 25 feet — worn under a long lace veil, the waist fitted and "old-fashioned" in feel. The same guest reporting says she changed into a more comfortable second dress for the reception, whose house — as Harper\'s Bazaar first noted — has still not been named. The circulating specifics that go further (bespoke lace counts, embroidery-hour figures) trace to unreliable sites and contradict the guest accounts, so they are left out here until a reputable source or the official reveal confirms them.\n\nThe Elizabeth Taylor thread runs deeper than the dress: a source said Swift "spent so much time looking at old photos of Elizabeth Taylor when she was making her music video for that song that she became enamored with the movie queen\'s style" — the same fascination that named track two. Her stylist Joseph Cassell Falconer has dressed her for the better part of two decades, since she was a teenager, across red carpets, music videos and the Eras Tour costumes (built with Nicole + Felicia Couture\'s Nicole Chang); his other clients include Reba McEntire, Kerry Washington and Maitreyi Ramakrishnan.',
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
            // On-record confirmation from the designer, and the WWD exclusive
            // that carries his quotes and the "first celebrity" framing.
            outlet: 'WWD',
            url: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-dior-wedding-dress-jonathan-anderson-1239054304/',
            source_title: "Jonathan Anderson Reveals New Details About Taylor Swift's Wedding Dress",
            publisher: 'WWD',
            source_type: 'interview',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
          {
            // USA Today reporting Anderson's on-record quotes (Edward Segarra,
            // July 7, 2026) — corroborating second source for the confirmation.
            outlet: 'USA Today',
            url: 'https://www.yahoo.com/entertainment/celebrity/articles/taylor-swifts-wedding-dress-designer-135450158.html',
            source_title: "Taylor Swift's wedding dress designer speaks out, reveals new details",
            publisher: 'USA Today (via Yahoo)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            // Carries Tree Paine's official press-release wording ("created by
            // Christian Dior Haute Couture," "first couture wedding dress for a
            // world-renowned celebrity") and the reported reception-change.
            outlet: "Harper's Bazaar",
            url: 'https://www.yahoo.com/entertainment/celebrity/articles/everything-know-taylor-swift-history-152143201.html',
            source_title: "Everything We Know About Taylor Swift's History-Making Dior Haute Couture Wedding Dress",
            publisher: "Harper's Bazaar (via Yahoo)",
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
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
          // Added 2026-07-22 (ledger #1168): the only descriptions of the gown
          // itself so far, all pre-official-reveal eyewitness accounts.
          {
            // People's source: "long veil and train," "perfectly Taylor."
            outlet: 'People (via AOL)',
            url: 'https://www.aol.com/articles/taylor-swift-custom-dior-wedding-213332000.html',
            source_title: "Taylor Swift's Custom Dior Wedding Look Featured a 'Long Veil and Train,' Says Source",
            publisher: 'People (via AOL)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 3,
          },
          {
            // Guest accounts (off-the-shoulder, ~25-ft train, lace veil, a more
            // comfortable reception dress) and the Elizabeth Taylor-video quote —
            // tabloid-sourced and secondhand, hence the low score.
            outlet: 'Daily Mail (via Yahoo)',
            url: 'https://www.yahoo.com/entertainment/celebrity/articles/taylor-swift-wedding-dress-had-113412656.html',
            source_title: "Taylor Swift's Wedding Dress Had a 25-Foot Train, Per Guests",
            publisher: 'Daily Mail (via Yahoo Entertainment)',
            source_type: 'tabloid',
            accessed_at: '2026-07-22',
            reliability_score: 2,
          },
          {
            // Joseph Cassell Falconer's tenure and other clients.
            outlet: 'South China Morning Post',
            url: 'https://www.scmp.com/magazines/style/entertainment/article/3289693/who-taylor-swifts-stylist-joseph-cassell-falconer-whos-also-styled-celebs-country-star-reba-mcentire',
            source_title: "Who is Taylor Swift's stylist Joseph Cassell Falconer?",
            publisher: 'South China Morning Post',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 4,
          },
          {
            // Status-check corroboration: the "surfaced" photos were the JuJu
            // Smith-Schuster wedding (July 10), not the MSG ceremony.
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/celebrity/articles/taylor-swift-wedding-photos-finally-155916382.html',
            source_title: "New Taylor Swift Wedding Photos Finally Surface as Pics Give 1st Look at Her 2nd Dress & Ring",
            publisher: 'Yahoo Entertainment',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 3,
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
            // Her veiled face sits just left of center, in the upper-middle of the frame.
            focalPoint: '47% 38%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Dress_by_Jonathan_Anderson_for_Loewe_%2851444%29.jpg',
            credit: 'Rhododendrites / CC BY-SA 4.0 via Wikimedia Commons',
            caption:
              "For reference — not the wedding gown. Jonathan Anderson working in white duchess silk satin at Loewe (autumn/winter 2023-24), before he took over Dior womenswear and haute couture — a feel for the designer's hand in bridal-adjacent white silk.",
            kind: 'reference',
            // Tall portrait of a mannequin dress; the bodice detail lives in the upper third.
            focalPoint: '50% 30%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Christian_Dior%2C_30_Avenue_Montaigne%2C_Paris_2016.jpg',
            credit: 'Frédéric BISSON / CC BY 2.0 via Wikimedia Commons',
            caption:
              "For reference — Dior's historic house at 30 Avenue Montaigne, Paris, home of the haute couture ateliers where the custom gown was made.",
            kind: 'reference',
            // The lit chandelier installation hangs dead-center on the corner facade, slightly above the storefront.
            focalPoint: '50% 45%',
          },
        ],
        // Rumor Desk 2026-07-21: the commission itself is confirmed (above), but
        // HOW/WHEN the gown is unveiled is a separate, still-open claim. This is
        // an official-tier statement (a Dior spokesperson, on the record to the
        // NYT), distinct from the tabloid "holding the photos back" rumor on the
        // MSG-wedding page. Adjudicable: it resolves the moment official photos
        // appear — confirmed if they arrive via her own Instagram as described.
        // No location (an Instagram reveal pins down nothing physical).
        rumors: [
          {
            claim:
              'A Dior spokesperson told The New York Times that Swift herself would be the one to unveil the custom gown — sharing the first official photos in her own Instagram post, on her own timeline, which the house said it was "not sure when" would come.',
            reportedBy: 'The New York Times (via The Hollywood Reporter)',
            reportedOn: '2026-07-07',
            status: 'unconfirmed',
            url: 'https://www.hollywoodreporter.com/lifestyle/style/taylor-swift-wedding-dress-reveal-dior-couture-1236640479/',
            note: 'An on-record Dior statement about the reveal mechanism, not the gown itself. Rechecked 2026-07-22: still no official photos posted. Images that circulated in mid-July were of the couple as guests at JuJu Smith-Schuster\'s July 10 wedding, not the MSG ceremony; Dior\'s fall 2026 couture-runway gown was also confirmed not to be it. Resolves when official photos surface via her Instagram, as described.',
            sourceTier: 'official',
            lastCheckedOn: '2026-07-22',
          },
        ],
        products: [
          {
            brand: 'Monique Lhuillier',
            item: 'Viola Dress',
            retailer: 'moniquelhuillier.com',
            url: 'https://www.moniquelhuillier.com/products/viola-dress',
            price: '$4,990.00',
            isAlternative: true,
            altNote: 'The real gown is a one-of-one Dior Haute Couture commission with no retail equivalent -- this is a real silk-white bridal gown in a comparable register, not the actual dress.',
          },
        ],
      },
    },

    // --- Category depth pass (2026-07-08): fashion, business, sighting, and
    // relationship items to clear the era's coverage gaps. Every claim
    // verified against its cited source directly; no fabrication.
    {
      slug: 'showgirl-david-koma-graham-norton',
      // Cross-links: the wedding tease from the same couch (candidate #1128);
      // the "Opalite" video whose whole ensemble is drawn from this couch
      // (candidate #1097).
      relatedIds: [
        'moment:vault-tloas-wedding-plans-teased-from-a-british-chat-show-couch',
        'moment:vault-tloas-opalite-arrives-as-the-second-single',
      ],
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
            // Tight head-and-shoulders frame; eyes sit just above the middle, face centered.
            focalPoint: '50% 38%',
          },
          // Photo pass (#762 run 6, 2026-07-18): the seated full view of the
          // same look from Marie Claire's dress close-read (credit on the
          // article: Alamy). Verified HTTP 200 + image/jpeg, downloaded and
          // visually confirmed (whole halter silhouette + jeweled neckline).
          {
            url: 'https://cdn.mos.cms.futurecdn.net/oGZmWZYsJXLBXALnDQk7X4-1024-80.jpg',
            credit: 'Alamy, via Marie Claire',
            caption:
              'The whole silhouette on the couch: black velvet halter mini, crystal choker-neckline doing the showgirl signaling, glass of white within reach.',
            kind: 'primary',
            // Tall seated portrait; her face is centered in the upper quarter.
            focalPoint: '50% 25%',
          },
        ],
        products: [
          {
            brand: 'David Koma',
            item: 'Crystal Embroidered Neckline and Strap Mini Dress',
            retailer: 'davidkoma.com',
            url: 'https://davidkoma.com/collections/dresses/products/crystal-embroidered-neckline-and-strap-mini-dress-black-silver',
            price: '$1,200.00',
            inStock: true,
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
      // Cross-links + sources added 2026-07-24 (ledger #1066). Title corrected
      // the same pass: it is NOT verifiably her "first" Showgirl-orange look —
      // a $70 pumpkin merch cardigan (worn Sept. 17) and the Aug. 12 New Heights
      // announcement's orange both preceded it — so the superlative was dropped
      // for the sourced "made it a fashion story" framing Marie Claire used.
      relatedIds: [
        'moment:vault-tloas-the-showgirl-portraits-mert-and-marcus-rhinestones-and-an-op',
        'moment:vault-tloas-orange-sequins-and-feathers',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
      ],
      title: 'The look that made "Showgirl orange" a fashion story: Reformation cashmere and a Versace leather mini',
      snippet:
        'Explaining the album\'s packaging and orange-and-mint color scheme on Sept. 20, she wore a pumpkin-hued Reformation cashmere sweater over a Versace leather mini skirt — the outfit that turned "Showgirl orange" into a fashion story before the record even dropped.',
      sourceUrl: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-showgirl-orange-reformation-cashmere-versace-leather-mini-skirt/',
      thumbnailUrl: null,
      moment: {
        context:
          'The look accompanied a behind-the-scenes video about the record\'s visual identity — posted by Taylor Nation in the week of Sept. 20 — with Swift talking through the packaging on camera in front of set art from the era\'s shoots. She called the design "really luxurious as a nod to the luxury that a showgirl puts on when she\'s on the stage," walking fans through the photo-card CDs, a unique poem tucked into each vinyl, and a first-ever high-gloss finish. Fans clocked the outfit as the messaging: the album wasn\'t out for two more weeks, and she was already dressed in its color.\n\nIt wasn\'t her first orange of the era — she\'d worn the $70 "The Life of a Showgirl" album cardigan (a sparkly pumpkin knit with her initials embroidered on the bust, dropped on her official store Sept. 17 in a limited Wednesday-to-Friday window) a few days earlier, and orange had been the Showgirl signal since the Aug. 12 New Heights announcement — but it was the look Marie Claire marked as turning "Showgirl orange" into a fashion story. The formula was classic Swift promo-craft: a sold-out Reformation cashmere crew in Showgirl orange over Versace\'s Black Medusa leather mini (about $430), the merch cardigan offering fans a budget echo of the same color. No stylist is credited for this off-duty look itself; her longtime stylist Joseph Cassell Falconer is credited on the era\'s editorial shoots.',
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
          {
            // Swift's on-camera packaging words ("really luxurious… nod to the
            // luxury a showgirl puts on when she's on the stage"; high-gloss
            // finish; per-vinyl poems; photo-card CDs) from the Taylor Nation video.
            outlet: 'NME',
            url: 'https://www.nme.com/news/music/taylor-swift-talks-luxurious-album-artwork-for-the-life-of-a-showgirl-says-fans-will-see-more-images-than-we-ever-planned-3894073',
            source_title: 'Taylor Swift talks "luxurious" album artwork for \'The Life of a Showgirl\'',
            publisher: 'NME',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            // The ~$70 pumpkin merch cardigan worn earlier (Sept. 17) — the basis
            // for the "not her first orange look" correction.
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-life-of-a-showgirl-orange-cardigan-merch/',
            source_title: "Taylor Swift's $70 Orange Cardigan Is the Showgirl Era's First Merch Flex",
            publisher: 'Marie Claire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            // Itemized breakdown IDing the Versace "Black Medusa Leather Mini
            // Skirt" ($430) and the Reformation cashmere crew (documentation blog).
            outlet: 'Taylor Swift Style',
            url: 'https://www.taylorswiftstyle.com/post-grid/tloas-092025',
            source_title: '13 Days Until The Life of a Showgirl',
            publisher: 'Taylor Swift Style',
            source_type: 'blog',
            accessed_at: '2026-07-24',
            reliability_score: 3,
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
            // Talking-head frame with her face centered high; eyes in the upper third.
            focalPoint: '50% 32%',
          },
          // Photo pass (#762 run 6, 2026-07-18): deliberately left at one
          // photo. The Sept. 20 Taylor Nation video yielded a single credited
          // still (above); the other orange-outfit images on approved CDNs are
          // different sightings (the $70 merch cardigan in a later teaser
          // trailer), and the album-cover render would duplicate the
          // showgirl-release-day page's art.
        ],
        // Shop pass (Stylist 2026-07-20): the exact Reformation piece she
        // wore — the "Cashmere Short Sleeve Crew" in Showgirl orange — was
        // sold out at the time and is no longer listed under that name.
        // Reformation's current cashmere short-sleeve crew is the "Teo" (same
        // brand, same silhouette); curl-verified live (HTTP 200) and marked
        // inStock:false because its page reports schema.org/OutOfStock
        // (waitlist only, final sale). Offered as an isAlternative, not
        // presented as the literal garment.
        //   NOT added: the Versace "Medusa" black leather mini skirt — Versace
        //   sells first-party and versace.com bot-blocks verification, so no
        //   curl-verifiable product page exists (same reason the LV/Cartier
        //   items on the engagement moment were skipped). The MAINTAIN pass
        //   can add it if a verifiable retailer page ever surfaces.
        products: [
          {
            brand: 'Reformation',
            item: 'Teo Cashmere Short Sleeve Sweater',
            retailer: 'thereformation.com',
            url: 'https://www.thereformation.com/products/teo-cashmere-short-sleeve-sweater/1313290.html',
            price: '$64.00',
            inStock: false,
            isAlternative: true,
            altNote:
              'Her exact "Cashmere Short Sleeve Crew" in Showgirl orange is sold out and delisted — this is Reformation\'s current cashmere short-sleeve crew (the "Teo"), same brand and silhouette, also sold out.',
          },
        ],
      },
    },
    {
      slug: 'showgirl-selena-gomez-texans-coats',
      // Cross-link (candidate #1052): the coordinated-outfit game-day sighting.
      relatedIds: ['moment:vault-tloas-a-low-key-game-day-layer-for-the-colts-game'],
      year: 2025,
      month: 12,
      day: 7,
      category: 'fashion',
      title: 'Taylor and Selena Gomez coordinate opulent winter coats at Arrowhead',
      snippet:
        'A Miu Miu checkered bomber for Taylor, all-black shearling-trimmed for Selena — the two friends layered up for Gomez\'s first Chiefs game alongside Taylor, a Dec. 7 loss to the Texans.',
      sourceUrl: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-selena-gomez-kansas-city-chiefs-houston-texans-game-winter-coats/',
      // Photo pass (2026-07-20): was null (no agency photo found the first
      // pass) — now points at the real Dec. 7 suite photo, see moment.photos.
      thumbnailUrl:
        'https://s.yimg.com/lo/mysterio/api/51607632d8b138ca2eb5ef4309f5f62efba2de679c41c5aa011b6eea7ffc78ff/lightyear_networkapi/resizefill_w976;quality_80;format_webp/https:%2F%2Fmedia.zenfs.com%2Fen%2Fpeople_218%2F6f5cc6c4b72bc346bb5078ba6b322161',
      moment: {
        context:
          'Swift\'s oversize checkered Miu Miu bomber (originally $4,600) and Gomez\'s fitted shearling-trimmed coat drew as much coverage as the game itself, which the Chiefs lost 20-10 — the loss that helped seal the franchise\'s first missed playoffs of the Kelce-Swift era — Kansas City finished 6-11 and missed the postseason for the first time since 2014, its first losing season since 2012. E! Online and Marie Claire both noted it was Gomez\'s first time attending a Chiefs game with Swift, a milestone in its own right for a friendship fans have tracked since 2008.\n\nThe pairing carried extra 2025 subtext: it was a wedding-season friendship on both sides — Gomez had married Benny Blanco that September, and Swift\'s own wedding was seven months out — and the coordinated-winter-coats suite appearance became an instant fan-edit staple, the two most-followed women of their pop generation doing normal-best-friend things at a football game. They weren\'t alone in the box: Lena Dunham sat just in front of the pair and Leonardo DiCaprio was also spotted in the suite, while Benny Blanco — whom Gomez had married that September — wasn\'t among those documented in the coverage. Marie Claire\'s fashion desk treated the coats as a two-hander: Swift\'s loud checkerboard against Gomez\'s all-black, opulence in two registers.',
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
          // Ledger #1080 Q4 (2026-07-27): the suite company that day —
          // Lena Dunham and Leonardo DiCaprio documented, Benny Blanco not.
          {
            outlet: 'NBC Insider',
            url: 'https://www.nbc.com/nbc-insider/taylor-swift-watched-chiefs-texans-game-with-selena-gomez-lena-dunham',
            source_title: 'Taylor Swift Watched Chiefs-Texans Game With Selena Gomez & Lena Dunham',
            publisher: 'NBC',
            source_type: 'reputable_press',
            accessed_at: '2026-07-27',
            reliability_score: 4,
          },
          // Ledger #1080 Q5 (2026-07-27): the Chiefs' 6-11 finish and first
          // missed postseason since 2014 that the Dec. 7 loss fed into.
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/2025_Kansas_City_Chiefs_season',
            source_title: '2025 Kansas City Chiefs season',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-27',
            reliability_score: 2,
          },
        ],
        // Photo pass (2026-07-20): found a real Dec. 7 suite photo (Kelce
        // Brothers' own Instagram, syndicated via Yahoo/PEOPLE) that a
        // founder flagged was missing — replaces the archival Golden Globes
        // stand-in from the 2026-07-19 pass. Verified HTTP 200 + image/jpeg,
        // downloaded and visually confirmed: Swift's grey checked collar and
        // Gomez's dark fur-trimmed coat are both visible in the suite.
        photos: [
          {
            url: 'https://s.yimg.com/lo/mysterio/api/51607632d8b138ca2eb5ef4309f5f62efba2de679c41c5aa011b6eea7ffc78ff/lightyear_networkapi/resizefill_w976;quality_80;format_webp/https:%2F%2Fmedia.zenfs.com%2Fen%2Fpeople_218%2F6f5cc6c4b72bc346bb5078ba6b322161',
            credit: 'Kelce Brothers/Instagram, via Yahoo/PEOPLE',
            caption: 'Swift and Gomez in the Arrowhead suite during the Dec. 7, 2025 Chiefs-Texans game.',
            kind: 'primary',
          },
        ],
        // Shop pass (2026-07-20): the Miu Miu jacket is confirmed (same
        // grey-check oversized bomber, Bergdorf Goodman) but sold out.
        // Gomez's coat carries no brand in any source — a close Nordstrom
        // match (Avec Les Filles) was two-tone, not the all-black described,
        // so it was skipped rather than forced.
        products: [
          {
            brand: 'Miu Miu',
            item: 'Check Oversized Zip Up Wool Bomber Jacket',
            retailer: 'bergdorfgoodman.com',
            url: 'https://www.bergdorfgoodman.com/p/miu-miu-check-oversized-zip-up-wool-bomber-jacket-prod189900058',
            price: '$4,600.00',
            inStock: false,
          },
        ],
      },
    },
    {
      slug: 'showgirl-grammy-eligibility-window-miss',
      significance: 'notable', // a real, documented trade-off in the release calendar with a full award-cycle consequence (docs/decisions.md, 2026-07-19)
      year: 2025,
      month: 10,
      day: 3,
      category: 'business',
      // Cross-link deficit closed (2026-07-21, depth ledger #1084 Q6/cross-links):
      // the page now threads to the Oct. 3 release that IS the cause, the debut-week
      // record that makes it "the biggest album of 2025," and the "I Knew It, I Knew
      // You" soundtrack single, which sits on its own awards clock.
      relatedIds: [
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-4-002-million-in-a-week-the-biggest-album-debut-ever-measure',
        'moment:vault-tloas-i-knew-it-i-knew-you-enters-the-oscar-conversation-not-a-nom',
      ],
      title: 'A release date that costs a Grammy shot: Showgirl misses the 2026 eligibility window by 34 days',
      snippet:
        'The Recording Academy\'s 2026 eligibility period closed Aug. 30, 2025 — five weeks before Showgirl came out on Oct. 3. The record-shattering album ended up with zero 2026 Grammy nominations, eligible instead for the 2027 ceremony.',
      sourceUrl: 'https://www.aol.com/articles/why-taylor-swift-doesn-t-144826491.html',
      thumbnailUrl: null,
      moment: {
        context:
          'Outlets including E! Online and AOL confirmed the snub was purely a calendar issue, not a reception one: the 2026 Grammy eligibility window ran Aug. 31, 2024 through Aug. 30, 2025, and Showgirl\'s Oct. 3 release fell 34 days outside it. The commercially biggest album of 2025 was therefore invisible at the 68th Grammys on Feb. 1, 2026 — the ceremony honoring 2025\'s music, where Bad Bunny\'s "Debí Tirar Más Fotos" won Album of the Year, Kendrick Lamar and SZA\'s "Luther" took Record of the Year, and Billie Eilish\'s "Wildflower" won Song of the Year.\n\nBut an October release costing the "expected" year is Swift\'s norm, not an accident. 1989 (Oct. 27, 2014), Red (Oct. 22, 2012), reputation (Nov. 2017) and Midnights (Oct. 21, 2022) all landed just after a window closed and competed a cycle later — and 1989 and Midnights each won Album of the Year two calendar years after release. Only the summer-released folklore (July 2020) competed at the very next ceremony, so Showgirl\'s early-October date makes it the structural twin of 1989. The closest outside precedent is Adele\'s "25" (Nov. 2015), which skipped its release-year Grammys and swept Album of the Year in 2017.\n\nSo the date banks the album for the 69th Grammys in 2027, whose window runs roughly Sept. 1, 2025 through Aug. 31, 2026; it competes there as a year-old blockbuster with a full chart history behind it. No on-record statement from Swift or Republic frames Oct. 3 as a deliberate Grammy calculation. Her tally stands at 14 Grammys and a record four Album of the Year wins (Fearless, 1989, folklore, Midnights), and she won nothing at the 2026 ceremony, so the count is current — a fifth AOTY would extend a record no one else has reached at four.\n\nThere was no single-level escape route, either: lead single "The Fate of Ophelia" came out Oct. 13, 2025 — ten days after the album and further outside the window than the record itself — so nothing from Showgirl qualified in any category at the 68th ceremony. Swift skipped the Feb. 1, 2026 show entirely (no attendance, no performance, no presenting slot — rumors that she\'d perform were denied by the telecast\'s own executive producer), surfacing only at a post-Grammys after-party; no other 2025-26 Swift release (a Taylor\'s Version, an Eras Tour credit) was nominated that night either.\n\nThe Recording Academy has since confirmed the 69th Grammys\' official eligibility window: Aug. 31, 2025 through Aug. 28, 2026 (nominees announced Nov. 16, 2026; ceremony Feb. 7, 2027) — Oct. 3, 2025 sits comfortably inside it, contrary to the page\'s earlier hedge about the exact dates. "I Knew It, I Knew You," the Toy Story 5 song, does sit on its own separate clock from the album: it is Oscar-eligible for Best Original Song at the March 2027 ceremony (a 2026 release) and, per awards handicappers, considered a lock for a Grammy Best Song Written for Visual Media nod at the same 69th ceremony as the album — with Best Country Song and Best Country Solo Performance floated as additional possible categories.\n\nThe calendar-vs-chart-window awards, unlike the Grammys, didn\'t make her wait: Swift led the 2026 American Music Awards nominations with eight and the 2026 iHeartRadio Music Awards with nine (winning that show\'s Artist of the Year, its fourth straight year topping the nominations list), both keyed to a rolling 12-month chart/sales period that Showgirl\'s Oct. 3 release fell well inside.',
        sources: [
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/music/taylor-swift-grammys-2026-attendance-performance-rcna256764',
            source_title: 'Did Taylor Swift Attend the 2026 Grammy Awards?',
            publisher: 'TODAY',
            source_type: 'reputable_press',
            accessed_at: '2026-07-28',
            reliability_score: 4,
          },
          {
            outlet: 'Grammy.com',
            url: 'https://www.grammy.com/news/2027-grammys-show-air-date-nominations-announced/',
            source_title: 'The Grammy Awards Set to Take Place Sunday, Feb. 7, 2027',
            publisher: 'The Recording Academy',
            source_type: 'official',
            accessed_at: '2026-07-28',
            reliability_score: 5,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2026/07/22/taylor-swifts-path-to-becoming-the-most-nominated-act-at-the-2027-grammys/',
            source_title: "Taylor Swift's Path To Becoming The Most-Nominated Act At The 2027 Grammys",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-28',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/2026-american-music-awards-nominations-full-list/',
            source_title: 'Taylor Swift Leads 2026 American Music Awards Nominations: Full List',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-28',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/2026-iheartradio-music-awards-nominations-list/',
            source_title: 'Taylor Swift Leads 2026 iHeartRadio Music Awards Nods: Full Nominations List',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-28',
            reliability_score: 4,
          },
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
          // Depth ledger #1084 (2026-07-21): who filled the vacuum at the Feb. 1,
          // 2026 ceremony (Q1), Swift's current Grammy tally (Q7), and the fall-
          // release / Adele precedent context (Q3/Q4).
          {
            outlet: 'NPR',
            url: 'https://www.npr.org/2026/02/01/nx-s1-5693046/2026-grammy-awards-full-list-winners-nominees',
            source_title: 'The complete list of 2026 Grammy winners and nominees',
            publisher: 'NPR',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
          {
            outlet: 'Grammy.com',
            url: 'https://www.grammy.com/artists/taylor-swift/15450/',
            source_title: 'Taylor Swift | 14 Grammy Wins, 4 Album of the Year',
            publisher: 'The Recording Academy',
            source_type: 'official',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2024/music/news/taylor-swift-album-year-grammys-1235897350/',
            source_title: "Taylor Swift Breaks the Record for Most Album of the Year Grammy Wins, as 'Midnights' Makes It Four",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Grammy.com',
            url: 'https://www.grammy.com/news/adele-25-beyonce-lemonade-grammys-2017-album-of-the-year-win-acceptance-speech-video-rewind/',
            source_title: "GRAMMY Rewind: Adele's '25' and the 2017 Album of the Year Win",
            publisher: 'The Recording Academy',
            source_type: 'official',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
        ],
        // Generic Grammy-statuette photo, clearly labeled as reference —
        // there is no event photo for a nomination that didn't happen.
        // License (CC BY 2.0) verified via the Commons API this session.
        // Photo-enrichment pass (2026-07-18, #762): searched for a second
        // image (AOL/E! lead art is a generic logo; no CC Grammys-ceremony
        // photo of Swift on Commons) — left at one photo rather than pad
        // with a second generic statuette.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/Grammy_Award_trophies_-_Kenny_Rogers_%22The_Gambler%22_%28cropped%29.jpg',
            credit: 'Photo by "Thank You (23 Millions+) views", CC BY 2.0, via Wikimedia Commons',
            caption:
              'For reference — Grammy statuettes on display (these are Kenny Rogers\'s, at the Country Music Hall of Fame). The 2026 window Showgirl missed closed Aug. 30, 2025.',
            kind: 'reference',
            // Focal point by inspection: tall frame, gramophone horn and
            // turntable in the middle band above the engraved plaque.
            focalPoint: '50% 42%',
          },
        ],
        // Rumor Desk 2026-07-24 (news digest): the moment above holds the
        // confirmed line (the album is banked for the 2027 Grammys); this
        // separates the forward-looking prediction of HOW it does there.
        // Award chances are explicitly public-facing/allowed by the redlines,
        // and this is adjudicable — it resolves when the 69th Grammy
        // nominations land (~Nov 2026). No location. Distinct from the
        // song-level Oscar/Grammy prediction on the "I Knew It, I Knew You"
        // moment: this is about the album's overall nomination haul.
        rumors: [
          {
            claim:
              'Forbes laid out a path for Swift to be the most-nominated act at the 2027 Grammys — potentially double-digit nominations spanning Album of the Year and Best Pop Vocal Album for The Life of a Showgirl, Record/Song of the Year for its singles, Best Pop Duo/Group for the Sabrina Carpenter title track, and country and visual-media nods for "I Knew It, I Knew You."',
            reportedBy: 'Forbes (Hugh McIntyre)',
            reportedOn: '2026-07-22',
            status: 'unconfirmed',
            url: 'https://www.forbes.com/sites/hughmcintyre/2026/07/22/taylor-swifts-path-to-becoming-the-most-nominated-act-at-the-2027-grammys/',
            note: 'A best-case projection, not a nomination — predictions diverge: Gold Derby\'s tracker (July 8) had Showgirl only sixth for Album of the Year, with "The Fate of Ophelia" faring better in Record and Song of the Year. Resolves when the 69th Grammy nominations are announced (~November 2026). Forbes 403s our fetcher; read via its verbatim Yahoo News Canada syndication.',
            sourceTier: 'established',
            lastCheckedOn: '2026-07-24',
          },
        ],
      },
    },
    {
      slug: 'showgirl-broncos-christmas-game',
      // Cross-link (candidate #1123): the Colts-game low-key look — the same
      // recurring game-day-styling beat of the engagement/wedding season.
      relatedIds: ['moment:vault-tloas-a-low-key-game-day-layer-for-the-colts-game'],
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
          'Styled by Joseph Cassell Falconer in a red Frankie Shop bomber jacket, black mini skirt, tights, knee-high boots, and a Louis Vuitton bag, Swift arrived with her parents after the 8:15 p.m. kickoff — nearly an hour into a Christmas Day game the NFL had handed to Amazon Prime, whose cameras caught her in the concourse on the way up to the suite. The red-on-red palette read as both Chiefs colors and Christmas at once.\n\nMarie Claire noted the game\'s added weight: with the Chiefs missing the playoffs for the first time since 2014, the Broncos game was expected to be Kelce\'s final appearance at Arrowhead that season, which made her family-in-tow attendance read as more than a holiday outing — a send-off to the season that had bracketed their engagement year. The Artifex Fine engagement ring, by then a fixture of every game-day sighting, rounded out the look.\n\nThe game itself was already a formality, and the timing sharpens the "missed the playoffs" note: Kansas City had been eliminated from contention the previous Sunday, in a 16–13 loss to the Chargers — the game in which Patrick Mahomes tore his left ACL — sealing the Chiefs\' first missed postseason since 2014. So the Broncos matchup was played without Mahomes or backup Gardner Minshew, with third-string quarterback Chris Oladokun starting, and Denver won 20–13 on a late Bo Nix-to-RJ Harvey touchdown. The appearance traveled well past a single fashion write-up: AP, People, ESPN, Fox Sports and Yahoo all ran game-day items built around the Amazon Prime cameras catching Swift entering the concourse with parents Andrea and Scott Swift. The red hero piece was later identified as The Frankie Shop\'s "Zion Bomber Jacket" ($388).\n\nOn the field, Kelce led Kansas City in receiving with five catches for 36 yards on six targets — more than half the team\'s passing offense that day — but was held out of the end zone. He was miked up during the loss and was picked up telling Nix a classy message as the Broncos closed it out, a small moment outlets flagged as in keeping with a farewell-tinged night. What "expected to be his final home game" did not become fact: Kelce did not retire that offseason. On March 9, 2026, his own New Heights account announced "HE\'S BACK!!!" — he re-signed with Kansas City on a one-year deal for a 14th NFL season, so the Christmas game was not, in the end, his Arrowhead farewell. Reporting on the broadcast goes only as far as confirming the pregame concourse footage Amazon aired during the game window; no outlet has documented an in-game cutaway to Swift\'s suite itself, a postgame interaction between her and Kelce, or any other family member (beyond Andrea and Scott) joining her there — those pieces of the "season send-off" framing remain undocumented rather than confirmed.',
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
          // Ledger #1122 (2026-07-24): the game outcome + the corrected
          // elimination timing (KC was out the prior week, Chargers/Mahomes ACL),
          // the exact bomber ID, and the broader game-day coverage.
          {
            outlet: 'ESPN',
            url: 'https://www.espn.com/nfl/game/_/gameId/401772622/broncos-chiefs',
            source_title: 'Broncos 20-13 Chiefs (Dec 25, 2025) Final Score',
            publisher: 'ESPN',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'Front Office Sports',
            url: 'https://frontofficesports.com/chiefs-dynasty-ends-as-amazons-christmas-game-loses-shine/',
            source_title: 'Mahomes Tears ACL and Chiefs Eliminated From Playoffs',
            publisher: 'Front Office Sports',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'theFashionSpot',
            url: 'https://www.thefashionspot.com/fashion-news/921485-taylor-swift-bomber-jacket-bag-louis-vuitton/',
            source_title: 'Taylor Swift Elevates $300 Jacket With $4K Louis Vuitton Bag',
            publisher: 'theFashionSpot',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          {
            outlet: 'People (via AOL)',
            url: 'https://www.aol.com/articles/taylor-swift-matches-her-signature-125318714.html',
            source_title: "Taylor Swift Matches Her Signature Red Lipstick to Trendy Bomber Jacket for Fiance Travis Kelce's Christmas Day Game",
            publisher: 'People',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          // Depth ledger #1382 (2026-07-28): Kelce's own stats, the mic'd-up
          // Bo Nix moment, and the retirement resolution that overturns the
          // "final home game" framing.
          {
            outlet: 'Fox Sports',
            url: 'https://www.foxsports.com/nfl/week-17-denver-broncos-vs-kansas-city-chiefs-dec-25-2025-game-boxscore-10707',
            source_title: 'Denver Broncos vs. Kansas City Chiefs - Final Score - December 25, 2025',
            publisher: 'Fox Sports',
            source_type: 'reputable_press',
            accessed_at: '2026-07-28',
            reliability_score: 4,
          },
          {
            outlet: 'Sports Illustrated',
            url: 'https://www.si.com/nfl/mics-caught-travis-kelces-classy-message-to-bo-nix-last-chiefs-home-game',
            source_title: "Mics Caught Travis Kelce's Classy Message to Bo Nix in Possibly Last Chiefs Home Game",
            publisher: 'Sports Illustrated',
            source_type: 'reputable_press',
            accessed_at: '2026-07-28',
            reliability_score: 3,
          },
          {
            outlet: 'NFL.com',
            url: 'https://www.nfl.com/news/travis-kelce-expected-to-return-to-chiefs-for-14th-nfl-season',
            source_title: 'Travis Kelce re-signs with Chiefs for 14th season in Kansas City',
            publisher: 'NFL.com',
            source_type: 'reputable_press',
            accessed_at: '2026-07-28',
            reliability_score: 4,
          },
          {
            outlet: 'TMZ',
            url: 'https://www.tmz.com/2025/12/25/taylor-swift-attends-chiefs-christmas-game/',
            source_title: 'Taylor Swift Attends Chiefs Christmas Game With Family, Supports Fiancé Travis Kelce',
            publisher: 'TMZ',
            source_type: 'reputable_press',
            accessed_at: '2026-07-28',
            reliability_score: 3,
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
            // Focal point set 2026-07-18 (photo-enrichment run 7, #762) by viewing:
            // tall broadcast frame; her face sits high and right of center, the
            // bag low-left — keep the face under wide crops.
            focalPoint: '65% 14%',
          },
          // Photo pass #762 run 7 (2026-07-18): re-searched for a second photo of
          // this event and again found none that verify. AOL/InStyle's "lead
          // photo" of the game downloaded as a recycled Jan-2025 AFC-Championship
          // celebration shot (AFC CHAMPIONS boards, Champions tee — wrong event,
          // rejected on viewing); TMZ's article runs a Dec. 3 Getty file photo;
          // Taylor Swift Style's gallery carries only the single broadcast frame
          // already used above. Deliberately leaving this page at one photo —
          // wire photographers had no access (broadcast-only event, see note
          // above from the 2026-07-10 pass).
        ],
        products: [
          {
            // The exact jacket. Marie Claire / Yahoo / AOL coverage of the
            // Dec. 25 2025 look all ID it as The Frankie Shop "Zion Bomber
            // Jacket" in red, $388. Its Shopify PDP curl-200s and the product
            // JSON read-verifies title "Zion Bomber Jacket - Red", price
            // $388.00, ONE SIZE, inventory_quantity 29 / policy deny — i.e.
            // genuinely in stock (checked 2026-07-22). The black mini skirt,
            // tights and knee-high boots are unbranded, the Louis Vuitton bag
            // is not identified to a specific model, and the Artifex Fine ring
            // is the bespoke engagement ring — none linkable, so skipped.
            brand: 'The Frankie Shop',
            item: 'Zion Bomber Jacket - Red',
            retailer: 'thefrankieshop.com',
            url: 'https://thefrankieshop.com/products/zion-bomber-jacket-red',
            price: '$388.00',
            inStock: true,
          },
        ],
      },
    },
    {
      slug: 'showgirl-engagement-announcement',
      // Pull-quote for the derived End Game thread card (stage 3, 2026-07-19).
      pullQuote: '“Your English teacher and your gym teacher are getting married.”',
      significance: 'defining', // the direct precursor to the wedding, one of the most-repeated cultural moments of 2025 (docs/decisions.md, 2026-07-19)
      threadIds: ['the-proposal'],
      relatedIds: [
          'moment:vault-tloas-a-mint-green-briefcase-on-new-heights-album-no-12-announced-',
        'moment:vault-midnights-the-game-the-world-decided-made-it-official',
        'moment:vault-midnights-super-bowl-lviii-a-sheer-corset-area-jeans-and-his-number-in',
        'moment:vault-tloas-taylor-and-travis-marry-at-madison-square-garden',
        // Engagement cluster completed (2026-07-21, depth ledger #987 Q8):
        // its direct Showgirl siblings — the ring, the look, the New Heights
        // proposal story, and the ring-designer wedding-invite sequel.
        'moment:vault-tloas-the-ring-an-old-mine-diamond-from-a-goldsmith-taylor-already',
        'moment:vault-tloas-the-engagement-look-a-polo-ralph-lauren-dress-in-the-garden',
        'moment:vault-tloas-back-on-new-heights-a-married-man-with-a-proposal-story',
        'moment:vault-tloas-the-ring-designer-gets-a-wedding-invite-of-her-own',
      ],
      year: 2025,
      month: 8,
      day: 26,
      category: 'relationship',
      title: '"Your English teacher and your gym teacher are getting married": the engagement, announced on Instagram',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-tloas-1b", label: "Engagement announced", kind: "life" },
      snippet:
        'Two weeks after the New Heights album reveal, Taylor and Travis announced their engagement in a joint Instagram post — a garden proposal, an Old Mine Cut diamond in yellow gold, and a caption that became the year\'s most-repeated line.',
      sourceUrl: 'https://abcnews.com/GMA/Culture/taylor-swift-travis-kelce-relationship-timeline/story?id=118197742',
      thumbnailUrl:
        'https://i.abcnewsfe.com/a/ecc533d0-9f9d-4f6f-b167-e4d2e20ce469/swift-kelce-engagement-ht-jef-250826_1756229211049_hpMain.jpg',
      moment: {
        // The post this page is ABOUT (issue #762 Part B). Shortcode taken
        // from the permalink Variety, Rolling Stone, THR, CNN and Today all
        // embed, and verified by rendering instagram.com/p/DN02niAXMM-/embed/
        // captioned: the taylorswift verified account, caption "Your English
        // teacher and your gym teacher are getting married 🧨", the garden-
        // proposal carousel. Embedded rather than hotlinked because Instagram
        // CDN urls are signed/expiring and the host is not on the allowlist.
        socialPost: {
          platform: 'instagram',
          shortcode: 'DN02niAXMM-',
          label:
            'The engagement announcement itself: a garden-proposal carousel, captioned "Your English teacher and your gym teacher are getting married 🧨."',
          postedOn: '2025-08-26',
        },
        context:
          'The couple made it official themselves on Aug. 26, 2025 — two weeks after Swift used Kelce\'s New Heights podcast to reveal The Life of a Showgirl — in a single joint Instagram post rather than a statement to any outlet. The carousel ran five photos from a flower-filled garden proposal, one a close-up of the ring, under Swift\'s caption: "Your English teacher and your gym teacher are getting married 🧨" — a line that became one of the year\'s most-repeated. The photos show the scale of the staging: a floral arch and urns overflowing with pink-and-white blooms deep in a wooded garden, Kelce in navy and Swift in a striped summer dress.\n\nThe ring, shown in close-up in the post, is an Old Mine Cut brilliant diamond — an elongated cushion-cut stone of undisclosed size (expert guesses ranged from about 7 to 15 carats, most clustering near 8 to 10), set in warm yellow gold — designed by Kelce together with Kindred Lubeck, the goldsmith, hand engraver and vintage-jewelry collector behind New York\'s Artifex Fine Jewelry; Lubeck was later invited to the couple\'s wedding. The post itself is the primary document of the moment, cited below, and the caption\'s teacher framing became era canon — quoted back at the couple everywhere from morning shows to the wedding\'s own coverage ten months later.\n\nThe post rewrote Instagram\'s records: about 14 million likes in its first hour and over a million reposts within six — the platform\'s most-reposted post ever — passing 46 million likes by early September. The proposal came ~two weeks earlier, around Aug. 10, 2025, in a flower-filled garden at Kelce\'s Missouri home (over an Eagles practice weekend, his father Ed said; exact date unconfirmed). On-the-record congratulations followed from the Kansas City Chiefs ("Today is a fairytale"), the NFL and Brittany Mahomes. The closing dynamite emoji went officially unexplained but fits the couple\'s running "T&T"/"TNT" initials motif — the play that later lit the "JusT&T Married" marquee.\n\nHow the scene was made came out only later, when Swift detailed it on The Graham Norton Show. Kelce staged the whole thing during the three-to-four-hour taping of the New Heights album-reveal episode — having his Missouri backyard turned into a flower-filled "secret garden" while they recorded inside, and building a wall of hedges that had not been there before, with Swift\'s own tour photographer hidden inside them to shoot the carousel. That is why the professionally lit frames carry only the couple\'s @taylorswift/Instagram credit and no outside photographer was ever named. Per Travis\'s father, Ed Kelce, the florists who dressed the set were still finishing and had to duck into the bushes when the couple came out — so the floral architecture was a temporary installation built for the occasion, not a standing garden feature. No event designer or florist has been publicly named, but florists reading the images for the press catalogued garden roses, "Limelight" hydrangeas, delphinium, ranunculus, lilies and southern smilax draping a domed metal arbor; Kansas City florist Sarah Burch (EverWild Florals) put the flowers alone at $10,000–$15,000. The caption had its own afterlife: within hours brands were riffing on it — Pixar paired "Your English teacher and your gym teacher are getting married" with the Incredibles — and it hardened into a documented meme format, with its own Know Your Meme entry, recycled onto countless other couples.',
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
          // Carat-range reconciliation (2026-07-13, ticket #615 item 3): this
          // item said "7 to 10 carats" while the TTPD ring item said "8 to
          // 15" — the site contradicted itself. Unified both to the full
          // documented spread: named-expert estimates run from 7-8 carats
          // (Lauren B. Shmueli, Simone Kendle via Today) through ~8 (Benjamin
          // Khordipour via Fortune) up to 10-15 (Deborah Villepigue via
          // Forbes). Today source added below as the low-end anchor.
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/taylor-swift-engagement-ring-cost-rcna227776',
            source_title: "How Much Did Taylor Swift's Engagement Ring Cost? 6 Jewelers Share Their Guesses",
            publisher: 'Today',
            source_type: 'reputable_press',
            accessed_at: '2026-07-13',
            reliability_score: 4,
          },
          // Depth ledger #987 (2026-07-21): Instagram records, the proposal
          // timing/setting, and named on-the-record reactions.
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/lifestyle/lifestyle-news/taylor-swift-travis-kelce-engagement-instagram-record-1236354963/',
            source_title: "Taylor Swift and Travis Kelce's Engagement Post Breaks Instagram Record",
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'CNN',
            url: 'https://www.cnn.com/2025/08/26/entertainment/taylor-swift-travis-kelce-engagement',
            source_title: 'Taylor Swift and Travis Kelce are engaged',
            publisher: 'CNN',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/live-blog/taylor-swift-travis-kelce-engagement-live-updates-rcna227298',
            source_title: 'Taylor Swift, Travis Kelce Announce Engagement: See the Ring, Photos, Celeb Reactions',
            publisher: 'Today',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          // Depth ledger #1468 (2026-07-25): the production/provenance of the
          // proposal scene — Swift's Graham Norton account (the secret-garden
          // build, the hidden tour photographer), Ed Kelce on the florists
          // hiding, the florist-catalogued flowers + cost, and the caption's
          // documented meme afterlife.
          {
            outlet: 'TMZ',
            url: 'https://www.tmz.com/2025/10/03/taylor-swift-travis-kelce-proposal-graham-norton-show/',
            source_title: "Taylor Swift Details Travis Kelce Proposal on 'The Graham Norton Show'",
            publisher: 'TMZ',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          {
            outlet: 'HGTV',
            url: 'https://www.hgtv.com/outdoors/gardens/what-to-know-about-taylor-swifts-engagement-garden',
            source_title: "Taylor Swift's Engagement Garden's Secret Meaning Behind Flowers and Plants",
            publisher: 'HGTV',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          {
            outlet: 'AOL',
            url: 'https://www.aol.com/taylor-swift-travis-kelce-engagement-205620651.html',
            source_title: 'Kansas City florist analyzes Taylor Swift and Travis Kelce dreamy proposal flowers',
            publisher: 'AOL',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          {
            outlet: 'Know Your Meme',
            url: 'https://knowyourmeme.com/memes/your-english-teacher-and-your-gym-teacher-are-getting-married',
            source_title: 'Your English Teacher and Your Gym Teacher Are Getting Married',
            publisher: 'Know Your Meme',
            source_type: 'reference',
            accessed_at: '2026-07-25',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://i.abcnewsfe.com/a/ecc533d0-9f9d-4f6f-b167-e4d2e20ce469/swift-kelce-engagement-ht-jef-250826_1756229211049_hpMain.jpg',
            credit: 'via @taylorswift/Instagram (ABC News)',
            caption:
              'The proposal, from the couple\'s official announcement post: Kelce and Swift beneath a flower-covered arch in the garden, ringed by urns of pink-and-white blooms.',
            kind: 'primary',
            // Focal points below set 2026-07-18 (photo-enrichment run 2, #762)
            // by downloading and viewing each frame. The couple stands mid-frame,
            // slightly right of center in the wide garden scene.
            focalPoint: '52% 50%',
          },
          {
            // 2026-07-18: the wide garden-staging carousel shot on ABC's CDN;
            // verified 200 + image/jpeg and vision-confirmed. The couple sit low
            // in a tall frame, so the focal point anchors down to keep them.
            url: 'https://i.abcnewsfe.com/a/826038ad-f638-4da8-9501-08748f22125b/swift-kelce-engagement-02-ht-jef-250826_1756229507971_hpMain.jpg',
            credit: 'via @taylorswift/Instagram (ABC News)',
            caption:
              'The scale of the staging: the couple beneath the floral arch and a flower-ringed chandelier deep in the garden — Swift in a striped summer dress, Kelce in navy.',
            kind: 'primary',
            focalPoint: '50% 64%',
          },
          {
            url: 'https://i.abcnewsfe.com/a/a0e8236a-f7e0-4462-8139-eedaae95e5f0/swift-kelce-engagement-04-ht-jef-250826_1756229507890_hpMain.jpg',
            credit: 'via @taylorswift/Instagram (ABC News)',
            caption:
              'From the same carousel: the couple embrace among the garden flowers, the new ring visible on Swift\'s hand.',
            kind: 'primary',
            // Foreheads-together close-up; both faces sit upper-center.
            focalPoint: '47% 30%',
          },
          {
            url: 'https://i.abcnewsfe.com/a/55d1f976-92b1-44e8-a423-ea8344309260/swift-kelce-engagement-05-ht-jef-250826_1756229507889_hpMain.jpg',
            credit: 'via @taylorswift/Instagram (ABC News)',
            caption:
              'The ring close-up from the carousel: the Old Mine Cut brilliant diamond in yellow gold, designed by Travis Kelce with Kindred Lubeck of Artifex Fine Jewelry.',
            kind: 'primary',
            // The diamond itself sits dead-center, slightly above middle.
            focalPoint: '50% 42%',
          },
          // Photo depth pass (round 2, 2026-07-19): the carousel ran five
          // photos total (per context above); the gallery previously had
          // frames 1/2/4/5 (hpMain, 02, 04, 05) but was missing frame 03 —
          // found via ABC News' engagement-ring story, same CDN. Also added:
          // the couple's first public sighting since the announcement,
          // wearing the ring, two days later at a college football game.
          // Both verified HTTP 200 + image/jpeg, downloaded and viewed this
          // session.
          {
            url: 'https://i.abcnewsfe.com/a/3a2fb75a-4d19-4924-a103-78328191421c/swift-kelce-engagement-03-ht-jef-250826_1756229507890_hpMain.jpg',
            credit: 'via @taylorswift/Instagram (ABC News)',
            caption:
              'The missing frame from the carousel: the embrace right after the proposal, the new ring visible on Swift\'s hand as she holds Kelce.',
            kind: 'primary',
            // Embracing couple fill the upper-center of a tall garden frame.
            focalPoint: '48% 35%',
          },
          {
            url: 'https://i.abcnewsfe.com/a/7896331b-7a75-44df-9649-74b77732d132/swift-kelce-01-gty-jef-250829_1756467997339_hpMain.jpg',
            credit: 'Jamie Squire/Getty Images, via ABC News',
            caption:
              'Their first public sighting since the engagement: Swift with Travis and Jason Kelce in a suite at Arrowhead Stadium for a Cincinnati Bearcats-Nebraska Cornhuskers game, Aug. 28, 2025 — two days after the announcement.',
            kind: 'archival',
            // The group sits mid-frame; Swift is right-of-center, face upper-middle.
            focalPoint: '62% 55%',
          },
        ],
      },
    },
    // --- The ring, deepened (2026-07-18, curiosity→answer pilot / Lex): moved
    // out of tortured-poets.mjs (wrong era — this is an Aug 2025 Showgirl-era
    // event) and consolidated with the announcement, then deepened per the
    // founder's list: the goldsmith's story, the "shown Travis her work"
    // provenance, celebrity-ring carat comparisons, and labeled cost/size
    // rumors. Every claim verified against its cited source this session; the
    // photos are the same rights-cleared ABC copies of the couple's official
    // post used by the announcement item. Open item Lex logged and the
    // Answerer could NOT close this pass: a rights-cleared portrait of Lubeck
    // and a photo of the specific earlier Artifex piece Taylor showed Travis —
    // no clean, unwatermarked source found, so none was added.
    {
      slug: 'showgirl-engagement-ring',
      threadIds: ['the-proposal'],
      relatedIds: [
          'moment:vault-tloas-clearer-looks-at-both-wedding-bands-finally-surface',
        'moment:vault-tloas-your-english-teacher-and-your-gym-teacher-are-getting-marrie',
        'moment:vault-tloas-taylor-and-travis-marry-at-madison-square-garden',
        // Cluster completed (2026-07-21, depth ledger #989 Q7): the look worn
        // in the same photos, the New Heights proposal story, and the sequel
        // about this same designer being invited to the wedding.
        'moment:vault-tloas-the-engagement-look-a-polo-ralph-lauren-dress-in-the-garden',
        'moment:vault-tloas-back-on-new-heights-a-married-man-with-a-proposal-story',
        'moment:vault-tloas-the-ring-designer-gets-a-wedding-invite-of-her-own',
      ],
      year: 2025,
      month: 8,
      day: 26,
      category: 'fashion',
      title: 'The ring: an old mine diamond from a goldsmith Taylor already admired',
      snippet:
        'A custom old mine–cut diamond in hand-engraved yellow gold by New York goldsmith Kindred Lubeck of Artifex Fine Jewelry — whose vintage work Taylor had admired, and shown Travis, more than a year before he proposed.',
      sourceUrl:
        'https://www.complex.com/pop-culture/a/holly-riordan/taylor-swift-engagement-ring-designer-launches-brand',
      thumbnailUrl:
        'https://i.abcnewsfe.com/a/55d1f976-92b1-44e8-a423-ea8344309260/swift-kelce-engagement-05-ht-jef-250826_1756229507889_hpMain.jpg',
      moment: {
        context:
          'Travis did not walk into a jeweler and point at a case. He worked directly with Kindred Lubeck — the hand-engraver behind New York\'s Artifex Fine Jewelry — on a ring Taylor never had to spec, because he already knew the name: she had shown him Lubeck\'s vintage work admiringly more than a year before he proposed. Her verdict: "I didn\'t know what I would want, but he did somehow."\n\nLubeck, 30, is a newcomer with a craftsman\'s pedigree — the daughter of a working goldsmith, a Florida State psychology grad who took an engraving class in 2021 and got, in her words, "totally hooked." Artifex is built on hand-engraved gold and antique stones: "Hand engraving allows me to leave a piece of myself in every ring," she says, "transforming each gemstone into something that carries a story."\n\nThe stone is an old mine brilliant cut — an antique geometry from the 1700s–1800s, squarer than a modern round with a higher crown and a softer, candlelit sparkle — set in a yellow-gold band with her signature engraved arches. No carat weight was ever disclosed, so the sizes are estimates: appraisers ranged from about 7–8 carats (jewelers surveyed by Today) through a ~8–10 consensus up to 10–15, with Forbes calling 13 "very possible" — Taylor\'s signature number — at an estimated ~$650,000, and others guessing $1 million and up. That lands it below the carat monsters of celebrity lore — Kim Kardashian\'s 15- and 20-carat rings, Beyoncé\'s ~18-carat emerald cut, Elizabeth Taylor\'s 33-carat Burton diamond — and notable instead for its antique cut over its size.\n\nThe ring made Lubeck famous overnight; within months she staged a rare Sotheby\'s "Gem Drop" capsule of one-of-a-kind rings — "the chance," she said, "to bring that level of care and creativity to a larger audience." That capsule — "The Gem Drop: Kindred & Jogani," bidding Nov. 10–13 — held three one-of-a-kind rings (a 4-carat old-mine diamond, an 8-carat cognac diamond and a 5-carat blue sapphire) estimated at up to $300,000.',
        sources: [
          {
            outlet: 'Complex',
            url: 'https://www.complex.com/pop-culture/a/holly-riordan/taylor-swift-engagement-ring-designer-launches-brand',
            source_title: "Taylor Swift's Engagement Ring Designer Launches Her Own Brand",
            publisher: 'Complex',
            source_type: 'reputable_press',
            accessed_at: '2026-07-18',
            reliability_score: 3,
          },
          {
            outlet: 'TODAY',
            url: 'https://www.today.com/popculture/taylor-swift-engagement-ring-jeweler-kindred-lubeck-interview-rcna238142',
            source_title: "EXCLUSIVE: Taylor Swift's Jeweler Kindred Lubeck Talks Engagement Ring",
            publisher: 'TODAY',
            source_type: 'reputable_press',
            accessed_at: '2026-07-18',
            reliability_score: 4,
          },
          {
            outlet: 'South China Morning Post',
            url: 'https://www.scmp.com/magazines/style/people/celebrities/article/3323318/meet-kindred-lubeck-who-designed-taylor-swifts-engagement-ring',
            source_title: "Meet Kindred Lubeck, who designed Taylor Swift's engagement ring",
            publisher: 'SCMP',
            source_type: 'reputable_press',
            accessed_at: '2026-07-18',
            reliability_score: 3,
          },
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/celebrity-style/kindred-lubeck-artifex-sothebys-gem-drop-taylor-swift-engagement-ring/',
            source_title: "Kindred Lubeck Is Holding a Rare Auction for Her One-of-a-Kind Pieces With Sotheby's",
            publisher: 'Marie Claire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-18',
            reliability_score: 4,
          },
          // Depth ledger #989 (2026-07-21): the Gem Drop capsule specifics —
          // three rings, the stones, dates and estimate.
          {
            outlet: "L'Officiel USA",
            url: 'https://www.lofficielusa.com/fashion/artifex-auction-sothebys-expensive-gems-diamonds-rings',
            source_title: "Artifex Makes Its Auction Debut With Sotheby's",
            publisher: "L'Officiel USA",
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/maryroeloffs/2025/08/27/taylor-swifts-engagement-ring-may-be-13-carats-expert-says-and-is-worth-an-estimated-650000/',
            source_title: "Taylor Swift's Engagement Ring May Be 13 Carats, Expert Says",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-18',
            reliability_score: 4,
          },
          {
            outlet: 'TODAY',
            url: 'https://www.today.com/popculture/taylor-swift-engagement-ring-cost-rcna227776',
            source_title: "How Much Did Taylor Swift's Engagement Ring Cost? 6 Jewelers Share Their Guesses",
            publisher: 'TODAY',
            source_type: 'reputable_press',
            accessed_at: '2026-07-18',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://i.abcnewsfe.com/a/55d1f976-92b1-44e8-a423-ea8344309260/swift-kelce-engagement-05-ht-jef-250826_1756229507889_hpMain.jpg',
            credit: 'via @taylorswift/Instagram (ABC News)',
            caption:
              'The ring in close-up from the announcement carousel: the old mine brilliant-cut diamond in hand-engraved yellow gold, designed by Kindred Lubeck of Artifex Fine Jewelry.',
            kind: 'primary',
            // The stone sits dead-center, slightly above the middle of the frame.
            focalPoint: '50% 42%',
          },
          {
            url: 'https://i.abcnewsfe.com/a/a0e8236a-f7e0-4462-8139-eedaae95e5f0/swift-kelce-engagement-04-ht-jef-250826_1756229507890_hpMain.jpg',
            credit: 'via @taylorswift/Instagram (ABC News)',
            caption:
              'The new ring on Swift\'s hand as the couple embrace among the garden flowers, from the same official post.',
            kind: 'primary',
            focalPoint: '47% 30%',
          },
          {
            url: 'https://i.abcnewsfe.com/a/3a2fb75a-4d19-4924-a103-78328191421c/swift-kelce-engagement-03-ht-jef-250826_1756229507890_hpMain.jpg',
            credit: 'via @taylorswift/Instagram (ABC News)',
            caption:
              'The ring visible on Swift\'s hand as she holds Kelce right after the proposal — the embrace frame from the carousel.',
            kind: 'primary',
            focalPoint: '48% 35%',
          },
        ],
        products: [
          {
            brand: 'M. Pope and Co',
            item: '14K Yellow Gold Vintage Old Mine Cut Diamond Ring',
            retailer: 'mpopeandco.com',
            url: 'https://mpopeandco.com/products/14k-yellow-gold-vintage-old-mine-cut-diamond-ring',
            price: '$3,250.00',
            isAlternative: true,
            altNote: 'The real ring is a one-of-one Artifex Fine Jewelry commission by Kindred Lubeck -- this is a real vintage old mine-cut diamond in a yellow-gold setting, not the actual ring.',
          },
        ],
      },
    },
    // The engagement OUTFIT angle (2026-07-18, dedup/consolidation): moved out
    // of tortured-poets.mjs (wrong era) and retitled from "Engagement photos"
    // — which promised the photo set — to "The engagement look," so it reads as
    // the distinct fashion facet it is, alongside the announcement (the news)
    // and the ring (the jewelry). Its photos and sources are the fashion-desk
    // coverage (Marie Claire / L'Officiel), different from the announcement's.
    {
      slug: 'showgirl-engagement-look',
      threadIds: ['the-proposal'],
      relatedIds: [
        'moment:vault-tloas-your-english-teacher-and-your-gym-teacher-are-getting-marrie',
        'moment:vault-tloas-the-ring-an-old-mine-diamond-from-a-goldsmith-taylor-already',
      ],
      year: 2025,
      month: 8,
      day: 26,
      category: 'fashion',
      title: 'The engagement look: a Polo Ralph Lauren dress in the garden',
      snippet:
        'A striped silk-blend Ralph Lauren dress with a creamy linen skirt, Louis Vuitton Isola sandals, and a diamond-lined Cartier watch — a deliberately soft, summer-neutral look for the announcement.',
      sourceUrl:
        'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-travis-kelce-engagement-outfits/',
      thumbnailUrl: 'https://cdn.mos.cms.futurecdn.net/UsvU6jYWQoHAFBkAhaQtgS.jpg',
      moment: {
        context:
          'The Aug. 26, 2025 announcement photos were a fashion story in miniature: a $319.99 Polo Ralph Lauren silk-blend dress — vertical black stripes over a creamy linen skirt — with Louis Vuitton\'s caramel-brown Isola sandals, a diamond-lined Cartier watch, heart-shaped earrings, and a deliberately minimalist manicure that kept every eye on the old mine-cut Artifex ring.\n\nTravis coordinated in a Ralph Lauren black polo, khaki shorts, and leather loafers for the same garden shoot, staged under an archway of roses and hydrangeas — one frame catching him mid-kneel. The soft, summer-neutral palette read as intentional: engagement photos styled like the quiet opposite of a stadium spectacle.\n\nThe pieces have since been catalogued: the caramel Louis Vuitton Isola sandals retail at $930, the diamond-lined watch is a discontinued yellow-gold Cartier Santos Demoiselle, and the heart jewelry is by Foundrae (outlets differ on the exact piece and its price). Swift posted the photos to Instagram herself; they carry only a "Taylor Swift" credit, with no outside photographer or stylist named. The $319.99 Polo Ralph Lauren dress then became a case study in the "Swift effect" — it sold out across Ralph Lauren\'s own site within about 20 minutes of the post, and resale listings soon climbed past $450.\n\nFashion press received the look warmly and read it the same way — understated luxury, not stadium spectacle. Marie Claire called the coordinated outfits "subdued and sweet for a late-summer proposal" and "something timeless"; Sports Illustrated praised a dress "simple, yet elegant" and "shockingly reasonable"; Who What Wear framed it as "the romantic dress trend every fashion person owns." The only mild ribbing went to Travis\'s shorts-and-loafers, not her dress.',
        sources: [
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-travis-kelce-engagement-outfits/',
          },
          {
            outlet: 'L\'Officiel',
            url: 'https://www.lofficielusa.com/fashion/taylor-swift-engagement-ring-dress-shoes-watch-outfit-details',
          },
          // Depth ledger #1005 (2026-07-21): piece-level ID (sandal price,
          // Santos Demoiselle watch, Foundrae heart jewelry) and the sellout.
          {
            // Detailed outfit archive (Sarah Chapelle) identifying the watch as
            // a Cartier Santos Demoiselle and the heart jewelry as Foundrae.
            outlet: 'Taylor Swift Style',
            url: 'https://www.taylorswiftstyle.com/post-grid/tntengagement-082625',
            source_title: 'Announcing her engagement',
            publisher: 'TaylorSwiftStyle.com (Sarah Chapelle)',
            source_type: 'fashion_database',
            accessed_at: '2026-07-21',
            reliability_score: 3,
          },
          {
            // The dress selling out on Ralph Lauren's own site (~20 minutes).
            outlet: 'ABC7',
            url: 'https://abc7.com/post/taylor-swifts-engagement-dress-sells-ralph-lauren-website/17664252/',
            source_title: "Taylor Swift's engagement dress sells out on Ralph Lauren website",
            publisher: 'ABC7 / KABC',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            // The "Swift effect" sellout and the resale climb past retail.
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/product-recommendations/style/taylor-swift-engagement-dress-brand-buy-online-1235415820/',
            source_title: "Taylor Swift's Engagement Dress Is Sold Out Almost Everywhere",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          // Depth ledger #1005 (2026-07-22): fashion-press reception of the look
          // itself (the Q7 gap). Marie Claire (already cited above) carries the
          // "subdued and sweet"/"timeless" read; these two add the corroborating
          // verdicts. No reputable engagement-look-vs-other-looks comparison was
          // findable, so that narrower sub-angle stays unanswered.
          {
            outlet: 'Sports Illustrated',
            url: 'https://www.si.com/onsi/athlete-lifestyle/fashion/taylor-swift-elegant-travis-kelce-engagement-fit-is-shockingly-affordable',
            source_title: "Taylor Swift's Elegant, Travis Kelce Engagement Fit Is Shockingly Affordable",
            publisher: 'Sports Illustrated (On SI)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 3,
          },
          {
            outlet: 'Who What Wear',
            url: 'https://www.whowhatwear.com/fashion/celebrity-style/taylor-swift-engagement-striped-dress',
            source_title: 'Taylor Swift Just Got Engaged in the Romantic Dress Trend Every Fashion Person Owns',
            publisher: 'Who What Wear',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 3,
          },
        ],
        photos: [
          {
            url: 'https://cdn.mos.cms.futurecdn.net/UsvU6jYWQoHAFBkAhaQtgS.jpg',
            credit: 'Taylor Swift',
            // Focal point set 2026-07-18 (photo-enrichment run 7, #762) by viewing:
            // close embrace, her hand on his cheek; the two faces meet just
            // above center frame.
            focalPoint: '50% 30%',
          },
          {
            url: 'https://cdn.mos.cms.futurecdn.net/zv7w65v5wxxFPVLtRAScqX.jpg',
            credit: 'Taylor Swift',
            // Focal point set 2026-07-18 (run 7) by viewing: wide garden scene,
            // the couple small at center under the floral arch, faces near mid-frame.
            focalPoint: '52% 46%',
          },
        ],
        // Shop-the-look pilot (2026-07-19, feat/shoppable-links — grafted here
        // in merge review: the worker authored these on the old TTPD copy of
        // this moment, which was relocated to this era before its PR landed).
        products: [
          {
            brand: 'Polo Ralph Lauren',
            item: 'Striped Silk-Blend Dress (1932 Stripe White & Black)',
            retailer: 'revolve.com',
            // Verified 2026-07-19: live single-product page (builder verified
            // via rendered fetch; independently corroborated in review via
            // search — same product listed at Neiman Marcus/Bloomingdale's).
            // Shows $398, "Sold Out" in all sizes — hence inStock: false.
            // Named as the exact engagement dress by Rolling Stone / PureWow.
            // Ralph Lauren's own page sits behind a PerimeterX wall, so the
            // verified Revolve page is the link.
            url: 'https://www.revolve.com/polo-ralph-lauren-striped-silkblend-dress-in-1932-stripe-white-black/dp/PLOR-WD21/',
            price: '$398',
            inStock: false,
          },
          // NOT added, per the never-fabricate/never-dead-link rule
          // (2026-07-19 verification pass):
          //   - Louis Vuitton "LV Isola Sandal" (exact model per WWD): every
          //     LV domain answers HTTP 403 to verification, and LV sells
          //     first-party only — no verifiable page exists from CI.
          //   - Cartier diamond watch (a Santos Demoiselle per Esquire):
          //     discontinued ~2014, no cartier.com product page; linking the
          //     current Panthère would be a wrong-product substitution.
          // Having any products dequeues this moment from the
          // fashion-products checker (by design — the two unlinkable items
          // genuinely have no product pages, so re-queueing would waste
          // Stylist runs). The Stylist's MAINTAIN pass re-checks existing
          // product moments and can add these if pages ever surface.
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
      // Cross-links (candidates #1023, #1038): the wedding gown that pays off the
      // Elizabeth Taylor reference, and the archival music video for this song.
      relatedIds: [
        'moment:vault-tloas-the-wedding-gown-a-custom-dior-haute-couture-styled-by-josep',
        'moment:vault-tloas-the-elizabeth-taylor-video-a-supercut-of-the-real-liz',
        // Cross-link (candidate #1258): the single sent to radio.
        'moment:vault-tloas-elizabeth-taylor-goes-to-radio',
      ],
      title: 'Elizabeth Taylor: the first song she wrote for the album',
      snippet:
        'Two showgirls, one lyric: White Diamonds, violet eyes, and "you\'re only as hot as your last hit" — her fame anxiety filtered through the star whose love life the press devoured first. It debuted at No. 3.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Elizabeth_Taylor_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Track two draws the parallel explicitly — the Plaza Athénée, Portofino, "I would trade the Cartier for someone to trust" — two famous women whose romances became public property. Time and Rolling Stone both read it as the album\'s thesis statement: the showgirl persona as armor, borrowed from the woman who wore it best. The specificity is the trick — White Diamonds (the Taylor fragrance empire), the violet eyes, "you\'re only as hot as your last hit" — Swift writing her own fame anxiety in another woman\'s biography, the way "the last great american dynasty" once used Rebekah Harkness.\n\nIt was the first Showgirl song written, which makes it the era\'s seed: the Elizabeth Taylor fixation came before the album had a title, and it kept paying off — the song debuted at No. 3 on the Hot 100 behind "The Fate of Ophelia" and "Opalite," got an archival-footage music video the following March, and, per SheKnows\' wedding coverage tracing to Daily Mail reporting, reportedly echoed into the Dior wedding gown modeled on Elizabeth Taylor\'s 1950 bridal look.\n\nLike the rest of the album it is credited to Swift with Max Martin and Shellback as its only writers and producers, a small string section the sole added players; the "first song written" claim traces to the album\'s liner notes and an Apple Music songwriting featurette rather than to fan lore. It peaked at No. 3 on the Hot 100 and, on radio months later, reached No. 7 on Pop Airplay, No. 8 on Adult Pop Airplay and No. 9 on Adult Contemporary; it went Platinum in Australia and Canada and Gold in the UK and New Zealand (no US certification as of mid-2026). Rolling Stone treated it as the album\'s emotional centerpiece, and it recurred on critics\' best-of-album and year-end lists as one of the record\'s standouts.\n\nThe lyric\'s specifics check out against the real biography — per Elizabeth Taylor\'s own estate, which published a line-by-line explainer: the Cartier reference nods to her lifelong Cartier patronage (the house behind the 69-carat Taylor–Burton diamond); "Portofino" to the Italian coast she vacationed on with Richard Burton; "the Plaza Athénée" to the six months she and Burton lived at that Paris hotel in 1971; "White Diamonds" to the fragrance she named for the jewels; the violet eyes to the deep-blue eyes that famously read as violet. One line is Swift\'s, not Taylor\'s: the estate\'s explainer never attributes "you\'re only as hot as your last hit" to her, and no biographer has — it is a showbiz adage Swift puts in a showgirl\'s mouth. The Taylor side embraced the tribute, its House of Taylor account promoting the song and publishing that explainer to show how closely it tracks her life.',
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
          // Added 2026-07-25 (ledger #1039 Q5/Q6/Q7): the estate's own
          // line-by-line lyric explainer — maps each reference to a
          // documented Elizabeth Taylor fact, and (by omission) confirms
          // "you're only as hot as your last hit" is not her quote.
          {
            outlet: 'Elizabeth Taylor (official estate)',
            url: 'https://www.elizabethtaylor.com/taylor-swifts-elizabeth-taylor-lyrics-explained/',
            source_title: "Taylor Swift's 'Elizabeth Taylor' Lyrics, Explained",
            publisher: 'House of Taylor / The Elizabeth Taylor Estate',
            source_type: 'official',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
        ],
        // Public-domain MGM publicity still of the song's namesake; license
        // and provenance verified via the Commons API this session.
        // Photo-enrichment pass (2026-07-18, #762): official MV id WqbJT_vC0rs
        // verified via YouTube oEmbed -> "Taylor Swift - Elizabeth Taylor
        // (Official Music Video)", author @TaylorSwift. maxresdefault used
        // (1280x720, no letterbox bars); downloaded and vision-confirmed —
        // b/w archival close-up of the real Elizabeth Taylor.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Elizabeth_Taylor%2C_late_1950s.jpg',
            credit: 'MGM publicity still, public domain, via Wikimedia Commons',
            caption:
              'The real Elizabeth Taylor in an MGM publicity photo from the late 1950s — the violet-eyed star whose public life the song borrows as a mirror.',
            kind: 'archival',
            // Focal point by inspection: portrait with the face in the upper
            // third, slightly left of center.
            focalPoint: '42% 25%',
          },
          {
            url: 'https://i.ytimg.com/vi/WqbJT_vC0rs/maxresdefault.jpg',
            credit: 'Taylor Swift / Republic Records (official "Elizabeth Taylor" music video thumbnail, YouTube)',
            caption:
              'From the archival-footage music video released in March 2026 — a supercut of Elizabeth Taylor\'s films and newsreels, cleared with her estate.',
            kind: 'archival',
            focalPoint: '60% 40%',
          },
        ],
      },
    },
    {
      slug: 'fate-of-ophelia-video-wardrobe',
      // Cross-links (candidates #1107, #1087): the video these looks appear in,
      // and the Rock Hall display of the Ophelia gown.
      relatedIds: [
        'moment:vault-tloas-the-fate-of-ophelia-video-premieres',
        'moment:vault-tloas-the-rock-hall-puts-the-ophelia-gown-in-legends-of-rock',
        // Cross-link (candidate #1278): the "Orange sequins and feathers" visual-identity card.
        'moment:vault-tloas-orange-sequins-and-feathers',
      ],
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
          'The costume parade tracks the video\'s conceit — Swift as a showgirl across different stage-history periods, from the drowned-Ophelia opening to full vaudeville. The itemized wardrobe reads like a century of stagewear: a flowing white Alberta Ferretti gown for the painting-come-to-life opening, a red crystal Versace bodysuit with matching gloves, a black chainmail Roberto Cavalli fringe dress, and a rhinestone Kelsey Randall mini, with Swift directing herself through every quick-change.\n\nThe synchronized-swim sequence — Swift in a mint sequined swim cap and costume among dancers with life rings, shown in the image here — staged the album cover\'s water imagery at Busby Berkeley scale. The costumes had an afterlife, too: the long-beaded gown and the swimming costume left the closet entirely, going on display at the Rock & Roll Hall of Fame the following June as part of its Legends of Rock exhibit.\n\nThe attribution the garment list left implicit: every look was pulled together by Swift\'s longtime stylist Joseph Cassell Falconer, and the fashion trades counted nine costume changes across the self-directed shoot. The named pieces were custom builds for the video rather than runway pulls — the opening Alberta Ferretti gown, the crystal Versace bodysuit (worn with opera gloves and Jimmy Choo heels), the Roberto Cavalli chainmail dress, and the rhinestone-and-fringe Kelsey Randall mini (paired with a teal fur jacket in the after-party scene) were each made for it. The one look the page couldn\'t place — the mint synchronized-swim costume and sequined cap — is by AREA, the New York label that also built the crystallized minidress recreating the album cover. Paolo Sebastian (a hand-beaded corset gown with a heart-and-arrow motif), Bob Mackie (an orange-feathered showgirl set) and a second embroidered Cavalli round out the nine-change parade.',
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
          // Ledger #1086 (2026-07-27): stylist Joseph Cassell Falconer, the
          // nine-outfit count, and the per-look designer attributions incl.
          // AREA for the synchronized-swim costume the page couldn't place.
          {
            outlet: 'AOL',
            url: 'https://www.aol.com/articles/inside-9-taylor-swifts-fate-174300574.html',
            source_title: "Analyzing the Fashion in Taylor Swift's 'The Fate of Ophelia' Video",
            publisher: 'AOL',
            source_type: 'reputable_press',
            accessed_at: '2026-07-27',
            reliability_score: 3,
          },
        ],
        // On-set still from the video, hotlinked from Marie Claire's
        // credited copy (credit: TAS Rights Management). Verified HTTP 200 +
        // image/jpeg and visually confirmed (the swim-costume sequence).
        // Photo pass #762 (2026-07-19): added two more wardrobe stills from the
        // cited Femestella piece (its own wp-content CDN) — the red crystal
        // Versace bodysuit and the black chainmail Cavalli fringe dress named
        // in the snippet. Both curl-verified 200 image/jpeg (800x1200),
        // downloaded and vision-confirmed against the outfit descriptions.
        photos: [
          {
            url: 'https://cdn.mos.cms.futurecdn.net/mRuaC9xbvVQHQFewM7GoGY.jpg',
            credit: 'TAS Rights Management, via Marie Claire',
            caption:
              'On the set of the self-directed video: Swift in the mint sequined swimming costume — one of the pieces later displayed at the Rock & Roll Hall of Fame — amid the synchronized-swim ensemble.',
            kind: 'primary',
            focalPoint: '50% 22%',
          },
          {
            url: 'https://www.femestella.com/wp-content/uploads/2025/10/taylor-1.jpg',
            credit: 'TAS Rights Management, via Femestella',
            caption:
              'The red crystal Versace bodysuit with matching gloves, worn with platinum Marilyn curls in the dressing-room sequence.',
            kind: 'archival',
            focalPoint: '49% 12%',
          },
          {
            url: 'https://www.femestella.com/wp-content/uploads/2025/10/taylor-2.jpg',
            credit: 'TAS Rights Management, via Femestella',
            caption:
              'The black chainmail Roberto Cavalli fringe dress — the vaudeville-line number in the video\'s costume parade.',
            kind: 'archival',
            focalPoint: '48% 10%',
          },
        ],
        products: [
          {
            brand: 'Manifestie',
            item: 'Xena Crystal Fringe Bodysuit',
            retailer: 'manifestie.com',
            url: 'https://www.manifestie.com/products/xena-crystal-fringe-bodysuit',
            price: '$190.00',
            isAlternative: true,
            altNote: 'The video wardrobe was custom Versace, Cavalli and Ferretti built for the shoot -- this is a real red crystal-fringe bodysuit in the same showgirl register, not the actual costume piece.',
          },
        ],
      },
    },
    {
      slug: 'showgirl-graham-norton-destination-wedding',
      // Cross-link (candidate #1128): the David Koma look from the same appearance.
      relatedIds: ['moment:vault-tloas-a-jeweled-david-koma-lbd-opens-the-press-run-on-graham-norto'],
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
        // Photos from the same Oct. 2 Graham Norton taping where the tease
        // happened (Alamy, via Marie Claire's coverage of the appearance).
        // 2026-07-17: three more frames from the same Marie Claire piece,
        // each verified HTTP 200 + image/jpeg, downloaded and viewed —
        // solo couch shot, smiling shot with the engagement ring visible,
        // and the full guest lineup with Norton.
        photos: [
          {
            url: 'https://cdn.mos.cms.futurecdn.net/oGZmWZYsJXLBXALnDQk7X4.jpg',
            credit: 'Alamy, via Marie Claire',
            caption:
              'On the Graham Norton Show couch in the black David Koma dress, Oct. 2, 2025 — the appearance where she called the wedding "huge" and ruled out a small guest list.',
            kind: 'primary',
          },
          {
            url: 'https://cdn.mos.cms.futurecdn.net/PJsDTgPm4oKabghVVGKLNM-1920-80.jpg',
            credit: 'Alamy, via Marie Claire',
            caption:
              'On the Graham Norton Show couch, Oct. 2, 2025 — the appearance where she called the wedding "huge" and ruled out a small guest list.',
            kind: 'archival',
          },
          {
            url: 'https://cdn.mos.cms.futurecdn.net/WaJNJAWscy5SEzxxRpSQQm.jpg',
            credit: 'Alamy, via Marie Claire',
            caption:
              'Mid-interview at the taping — the Artifex engagement ring visible on her hand while the wedding talk happened.',
            kind: 'archival',
          },
          {
            url: 'https://cdn.mos.cms.futurecdn.net/ZitCnEiHQVnUnBmHPedDZB.jpg',
            credit: 'Alamy, via Marie Claire',
            caption:
              "The full couch: Swift with Graham Norton and fellow guests Cillian Murphy, Greta Lee, Jodie Turner-Smith, Domhnall Gleeson, and Lewis Capaldi.",
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
      // Cross-link (candidate #1041): the game-day outfit she wore to this same
      // Nov 23, 2025 Colts game.
      relatedIds: ['moment:vault-tloas-a-low-key-game-day-layer-for-the-colts-game'],
      title: 'Back in the suite window for an overtime nail-biter',
      snippet:
        'After weeks of slipping into Arrowhead unphotographed, she was visible celebrating the Colts game from the suite — playfully shaking her dad by the shoulders as Butker\'s kick won it 23-20 in OT.',
      sourceUrl: 'https://www.tmz.com/2025/11/23/taylor-swift-watches-travis-kelce-win-nailbiter-kansas-city/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Nov. 23, 2025 game was her most visible Arrowhead appearance in weeks — E! noted she\'d been keeping a deliberately low profile at games through the fall, attending without being shown on broadcasts. This time the suite window gave her away: fans in the stands filmed her reaction as Harrison Butker\'s overtime kick beat the Colts 23-20, TMZ describing her screaming and jumping, and E! reporting she was seen playfully shaking her father Scott by the shoulders in celebration.\n\nThe game earned the "nail-biter" billing. On CBS, the Chiefs rallied from an 11-point deficit — Patrick Mahomes threw for a season-high 352 yards and Kareem Hunt ran for 104 and a touchdown — and it came down to Butker, who made all five of his field goals for 15 of Kansas City\'s 23 points, forcing overtime with a 25-yarder as regulation expired and winning it with a 27-yard kick. The Colts iced him with a timeout first: "that probably helped me slow the heart rate down," he said afterward. Her celebration was caught only on fan video from the stands, not a network cut — of a piece with a season she spent largely off the broadcast.\n\nThe sighting marked the practical end of the invisible-fan experiment: with the Chiefs\' playoff hopes fading, the remaining home slate was short — the Christmas Broncos game a month later was expected to be Kelce\'s last at home that season — and her appearances got more visible, not less, as the season wound down. The win only nudged Kansas City to 6-5, and the math kept slipping: the Chiefs finished 6-11 and missed the postseason for the first time since 2014 — clinched by a Week 15 loss to the Chargers in which Mahomes tore his ACL — the first missed playoffs of the stretch since Swift started attending. The low-profile run itself became part of the era\'s story: the most-photographed woman in the NFL\'s orbit spending most of a season successfully unphotographed.\n\nBy the count, that run was every Arrowhead home game of the fall. She attended all six Chiefs home dates from September through this one — the Eagles (Sept. 14), Ravens (Sept. 28), Lions (Oct. 12), Raiders (Oct. 19), Commanders (Oct. 27) and Colts (Nov. 23) — while skipping every road game, her documented home-only pattern. Three of the six she took in entirely off-broadcast: she slipped behind a rolling partition against the Eagles, went unspotted again at the Ravens game, and here against the Colts wasn\'t found until eagle-eyed fans caught her in the crowd on the final play. The exceptions proved the rule — she was televised laughing beside Caitlin Clark at the Lions game, and surfaced on the Commanders broadcast only after a Kelce touchdown in the third quarter.',
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
          {
            // Game recap: 11-point comeback, Mahomes 352, Hunt 104+TD, 6-5 record.
            outlet: 'KCTV5 (AP)',
            url: 'https://www.kctv5.com/2025/11/23/chiefs-rally-11-point-deficit-beat-colts-23-20-ot-harrison-butkers-fifth-field-goal/',
            source_title: 'Chiefs rally from 11-point deficit to beat Colts 23-20 in OT',
            publisher: 'KCTV5 / Associated Press',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            // Primary: the 27-yard overtime game-winner.
            outlet: 'Chiefs.com',
            url: 'https://www.chiefs.com/video/harrison-butker-s-27-yard-field-goal-seals-kansas-city-chiefs-win-over-indianapolis-colts-in-overtime',
            source_title: "Harrison Butker's 27-yard Field Goal Seals Chiefs Win in Overtime",
            publisher: 'Kansas City Chiefs',
            source_type: 'official',
            accessed_at: '2026-07-25',
            reliability_score: 5,
          },
          {
            // The icing timeout and Butker's five-FG, 15-point line.
            outlet: 'A to Z Sports',
            url: 'https://atozsports.com/nfl/indianapolis-colts-news/colts-week-12-loss-chiefs-kicker-harrison-butker-helped-him-overtime-field-goal-timeout/',
            source_title: "Chiefs kicker Harrison Butker says Colts' timeout 'helped him' on OT field goal",
            publisher: 'A to Z Sports',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          {
            // Broadcast: Week 12 carried on CBS.
            outlet: 'Pro Football Network',
            url: 'https://www.profootballnetwork.com/how-to-watch-chiefs-colts-game-tv-channel-kickoff-time-announcers-week-12/',
            source_title: 'How to Watch Chiefs-Colts: TV Channel, Kickoff Time, Announcers (Week 12)',
            publisher: 'Pro Football Network',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          {
            // Season outcome: 6-11, missed the playoffs for the first time since 2014.
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/2025_Kansas_City_Chiefs_season',
            source_title: '2025 Kansas City Chiefs season',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-25',
            reliability_score: 2,
          },
          // Ledger #1040 Q4 (2026-07-25): the countable home-game tally behind
          // the "weeks" of low profile — six home games attended, three of them
          // (Eagles, Ravens, Colts) entirely off-broadcast.
          {
            // Sept. 14 Eagles: attended but unspotted, entered behind a rolling partition.
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1421829/taylor-swift-at-travis-kelces-chiefs-eagles-game',
            source_title: 'Taylor Swift Attends Travis Kelce\'s Chiefs vs. Eagles Game',
            publisher: 'E! Online',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            // Sept. 28 Ravens: attended, not publicly spotted or shown on the broadcast.
            outlet: 'TODAY',
            url: 'https://www.today.com/popculture/music/taylor-swift-chiefs-ravens-nfl-game-2025-rcna233742',
            source_title: 'Was Taylor Swift at the Chiefs vs. Ravens game?',
            publisher: 'TODAY / NBCUniversal',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            // Oct. 12 Lions (televised, w/ Caitlin Clark) + Oct. 19 Raiders home return.
            outlet: 'Red94',
            url: 'https://www.red94.net/news/555210-taylor-swift-attends-chiefs-vs-raiders-home-game-at-arrowhead-after-lions-appearance-with-caitlin-clark/',
            source_title: 'Taylor Swift attends Chiefs vs. Raiders home game after Lions appearance with Caitlin Clark',
            publisher: 'Red94',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          {
            // Oct. 27 Commanders: surfaced on the MNF broadcast only after a Kelce TD.
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1424323/taylor-swift-at-kansas-city-chiefs-washington-commanders-game',
            source_title: 'Taylor Swift at Kansas City Chiefs vs. Washington Commanders Game',
            publisher: 'E! Online',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
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
            // Face sits high and right of center in this tall crowd frame.
            focalPoint: '65% 21%',
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
      // Cross-link (candidate #1041): the suite reaction from this same Nov 23,
      // 2025 Colts game.
      relatedIds: [
        'moment:vault-tloas-back-in-the-suite-window-for-an-overtime-nail-biter',
        // Cross-link (candidate #1052): the coordinated winter-coat game-day sighting.
        'moment:vault-tloas-taylor-and-selena-gomez-coordinate-opulent-winter-coats-at-a',
        // Cross-link (candidate #1123): the Broncos Christmas-game game-day look.
        'moment:vault-tloas-a-christmas-day-game-at-arrowhead-arriving-with-her-parents',
      ],
      title: 'A low-key game-day layer for the Colts game',
      snippet:
        'No statement piece this time — a sandstone Guest in Residence cashmere polo with Chiefs-red shoulders and the signature red lip, dressed for the suite rather than the cameras.',
      sourceUrl: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-kansas-city-chiefs-indianapolis-colts-game-outfit/',
      thumbnailUrl: null,
      moment: {
        context:
          'Marie Claire filed the Nov. 23, 2025 look under "fit for a low-key fan," and the color-blocking it described — sandstone, white and a flash of Chiefs red — was really a cashmere polo sweater, not a jacket: Guest in Residence\'s "Alpine Collegiate Polo" in Sandstone Combo (about $425), the red saved for its shoulders. The label is Gigi Hadid\'s, a quiet nod to her friend. She paired it with Agolde\'s Low Slung Baggy jeans (about $248) and a Sezane belt, and her ever-present red lip — the Pat McGrath Labs LiquiLust shade "Elson" she has worn through the Eras Tour — with nothing engineered for a jumbotron close-up. It was game-day dressing for someone planning to watch the game rather than be broadcast during it, which that fall was exactly the plan.\n\nThe restraint was the story. Her game-day looks had spent two seasons as a fashion beat of their own — dissected, price-tagged, sold out by Monday — and the fall 2025 stretch of quiet fits during her lowest-profile season at Arrowhead read as deliberate de-escalation. The contrast made the exceptions land harder when they came: the Miu Miu checkerboard bomber alongside Selena Gomez, and — a month later at the Dec. 25 Broncos game — a Christmas-red look her stylist Joseph Cassell Falconer built around The Frankie Shop\'s "Zion" bomber jacket (about $388).',
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
          {
            // Itemized ID of the look: Guest in Residence "Alpine Collegiate Polo"
            // ($425), Agolde Low Slung Baggy jeans ($248), Sezane Livie belt.
            outlet: 'Taylor Swift Style',
            url: 'https://www.taylorswiftstyle.com/post-grid/kansascity-112325',
            source_title: 'Kansas City — November 23, 2025',
            publisher: 'Taylor Swift Style',
            source_type: 'blog',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          {
            // Her documented signature red lip: Pat McGrath LiquiLust "Elson."
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/beauty/taylor-swift-chiefs-red-lipstick/',
            source_title: "Taylor Swift's Chiefs-Game Red Lipstick, Decoded",
            publisher: 'Marie Claire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            // The Dec. 25 Broncos-game contrast: Frankie Shop "Zion" red bomber
            // ($388), styled by Joseph Cassell Falconer.
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/celebrity/articles/taylor-swift-styles-subtly-festive-022006277.html',
            source_title: 'Taylor Swift Styles a Subtly Festive Look for the Chiefs Christmas Game',
            publisher: 'Yahoo Entertainment',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
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
            // Same tall crowd frame as the companion sighting item: face high-right.
            focalPoint: '65% 21%',
          },
        ],
        // Shop pass (2026-07-26): the Agolde jeans are curl-verified live and
        // in stock (agolde.com, price matches the $248 sourced above); linked
        // below. The GiR "Alpine Collegiate Polo" in Sandstone Combo is still
        // unlinkable -- the exact colorway is delisted from guestinresidence.com
        // (404), and the only live listing (Shopbop's "Cashmere Alpine
        // Collegiate Polo") carries just the Midnight Combo colorway, itself
        // out of stock -- so it stays skipped rather than link a mismatched
        // colorway as the exact piece (same call as 2026-07-25, ledger #1051).
        // The Sezane belt could not be verified either way this pass --
        // sezane.com returns 403 to both curl and the fetch tool (bot
        // protection), so it's skipped rather than guessed.
        products: [
          {
            brand: 'Agolde',
            item: 'Low Slung Baggy Jean',
            retailer: 'agolde.com',
            url: 'https://agolde.com/products/low-slung-baggy-reset',
            price: '$248.00',
            inStock: true,
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
      // Cross-link (candidate #1440): the docuseries revisits Kelce's tuxedoed
      // Wembley cameo on camera — the June 2024 night he became an Eras Tour
      // cast member for a night.
      // Cross-links added 2026-07-28 (depth ledger #1174): the parent
      // docuseries page, the same-day concert-film release, and the
      // relationship thread's proposal-story beat.
      relatedIds: [
        'moment:vault-ttpd-travis-kelce-eras-tour-cast-member-for-a-night',
        'moment:vault-tloas-the-end-of-an-era-the-eras-tour-docuseries-lands-on-disney',
        'moment:vault-tloas-the-final-show-the-full-vancouver-closer-streaming-at-last',
        'moment:vault-tloas-back-on-new-heights-a-married-man-with-a-proposal-story',
      ],
      moment: {
        context:
          'GMA\'s exclusive first look confirmed Kelce appears in the back half of the six-episode Disney+ series, which rolled out Dec. 12, 19, and 23, 2025. His presence gave the series its relationship arc in miniature: the tour that began with him failing to hand her a friendship bracelet in July 2023 ends with him on camera inside its machinery — including the footage around his tuxedoed Wembley cameo in the "I Can Do It With a Broken Heart" bit from June 2024, the night he became briefly an Eras Tour cast member.\n\nThe docuseries also addressed the era\'s hardest moment — the cancelled Vienna shows, covered in the opening episode — making it the fullest inside account of the tour\'s final year: the terror plot, the record-breaking finale, and the relationship that started in its stands, all in one December drop.\n\nKelce\'s actual episodes (three and four, released Dec. 19) build his presence out of archival tour and rehearsal footage and recorded phone calls rather than a separate sit-down interview segment — reporting on the episodes doesn\'t describe him giving a formal talking-head interview the way Swift does. One recurring bit outlets singled out: a phone call in which he tells her "You\'ve got teammates, I\'ve got teammates," comparing life on an NFL roster to life on tour, with Swift making her own version of the comparison back. Andrea Swift also appears on camera in these episodes calling Kelce someone who "brings a lot of happiness" to the family. The finale (episode six, Dec. 23) goes further: Swift reads aloud, on camera, part of a letter Kelce wrote her before the tour\'s final Vancouver shows — "my favorite one is seeing you in concert for the first time, being mesmerized and swept off my feet by a woman who doesn\'t even know me" — the series\' most direct piece of new relationship material.\n\nCritics were positive about the tone if not unanimous about the fit: Variety wrote that Swift and Kelce "seem freakishly relaxed... like they\'re having the time of their lives" together on camera, while some fan and outlet reaction was split on whether folding the relationship into a tour documentary pulled focus from the Eras Tour itself. No outlet reporting reviewed for this page describes the Wembley cameo\'s own planning — whether it was arranged in advance or a spontaneous ask — as newly explained by the docuseries footage; that backstory remains undocumented rather than resolved.',
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
          {
            outlet: 'ABC News',
            url: 'https://abcnews.com/GMA/Culture/taylor-swift-reads-aloud-love-letter-travis-kelce/story?id=128647552',
            source_title: 'Taylor Swift reads aloud a love letter from Travis Kelce in new docuseries: What it says',
            publisher: 'ABC News (Good Morning America)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-28',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2025/music/reviews/end-of-an-era-taylor-swift-review-disney-docuseries-1236607569/',
            source_title: "'End of an Era' Review: Taylor Swift Spotlights Dancers in Docuseries",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-28',
            reliability_score: 4,
          },
        ],
        // Getty photo ABC News ran with its docuseries exclusive, hotlinked
        // from its stable CDN copy; verified HTTP 200 + image/jpeg and
        // visually confirmed (the Wembley "I Can Do It With a Broken Heart"
        // cameo in white tie).
        // Photo-enrichment pass (2026-07-18, #762): added a frame from GMA's
        // own Dec. 18, 2025 first-look segment at the final episodes — actual
        // docuseries footage (Disney+ bug visible), hotlinked from the same
        // ABC News CDN as the source article's lead art. Verified HTTP 200 +
        // image/jpeg, downloaded, and visually confirmed (rain-soaked
        // reputation-set performance with dancers).
        photos: [
          {
            url: 'https://i.abcnewsfe.com/a/28b02501-c9ae-4c1b-bf3f-1e84c6916b90/eras-1-gty-er-251217_1766008410871_hpMain_16x9.jpg',
            credit: 'Getty Images, via ABC News',
            caption:
              'The moment the docuseries revisits: Kelce, in white tie and top hat, on the Eras Tour stage at Wembley during "I Can Do It With a Broken Heart," June 2024.',
            kind: 'archival',
            focalPoint: '55% 25%',
          },
          {
            url: 'https://i.abcnewsfe.com/a/698799cb-dc27-42ed-9766-e16fcee90faa/251218_gma_pop2_hpMain_16x9.jpg',
            credit: 'Disney+ / ABC News (GMA first look)',
            caption:
              "Docuseries footage from GMA's exclusive first look at the final episodes: the rain-soaked reputation set, aired Dec. 18, 2025.",
            kind: 'archival',
            focalPoint: '54% 33%',
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
      // Cross-link deficit closed (2026-07-21, depth ledger #1006 Q8): the
      // sustained reign now threads to its year-end sequel (the Luminate
      // most-consumed crown named in its own text), the debut week that began
      // the run, and its Showgirl chart-record siblings.
      relatedIds: [
        'moment:vault-tloas-luminates-2025-crown-5-6-million-units-no-contest',
        'moment:vault-tloas-4-002-million-in-a-week-the-biggest-album-debut-ever-measure',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-all-12-tracks-debut-as-the-hot-100s-entire-top-12',
        'moment:vault-tloas-spotifys-2025-single-day-streaming-record-falls-in-under-11-',
        'moment:vault-tloas-1-334-million-vinyl-lps-in-seven-days-the-first-million-viny',
      ],
      title: 'Twelve weeks at No. 1 — through the entire holiday season',
      snippet:
        'Showgirl held the Billboard 200\'s top spot for 12 nonconsecutive weeks into January — her second-longest run ever behind TTPD — outlasting a record seven Christmas albums crowding the top 10.',
      sourceUrl: 'https://www.billboard.com/music/chart-beat/taylor-swift-showgirl-twelfth-week-number-one-billboard-200-1236148560/',
      thumbnailUrl: null,
      moment: {
        context:
          'The album spent nearly every week at No. 1 from its October debut through the new year — through Wrapped season, through a holiday chart where Bing Crosby\'s Ultimate Christmas posted the biggest streaming week ever for a holiday album — 140.71 million on-demand streams on the chart dated Jan. 3, 2026 — and still stalled at No. 2 behind it, through 10th- and 11th-week milestones Billboard tracked one by one (104,000 units the week of Dec. 27, then a reign-peak 141,000 the week of Jan. 3, its biggest post-debut week). It ceded the top only once: on the chart dated Dec. 6, 2025, Stray Kids\' "Do It" opened at No. 1 with 295,000 units and knocked Showgirl to No. 3, before it reclaimed the summit a week later. Holding on across December is the chart\'s hardest endurance test — a record seven Christmas albums crowded the top 10 that season, per Billboard, and none of them dislodged it again.\n\nTwelve nonconsecutive weeks made it her second-longest No. 1 run ever, past the 11-week reigns of 1989 and Fearless and behind only The Tortured Poets Department\'s 17 weeks in 2024; at the 10-week mark she became the first woman — and third act overall — with four albums logging 10-plus weeks at No. 1. The run ended on the chart dated Jan. 17, 2026, when Morgan Wallen\'s "I\'m the Problem" returned to No. 1 (85,000 units) and Showgirl slipped to No. 2 with 72,000 — but it was still on top when Luminate crowned it 2025\'s most-consumed album, turning release-week fireworks into a season-long occupation.',
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
          // Depth ledger #1006 (2026-07-21): the TTPD benchmark the "second-longest"
          // claim is measured against — its career-best 17-week Billboard 200 reign.
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-tortured-poets-department-17th-week-number-one-billboard-200-chart-1235857250/',
            source_title: "Taylor Swift's 'The Tortured Poets Department' Logs 17th Week at No. 1 on Billboard 200",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-21',
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
          // Depth ledger #1006 (2026-07-22): the weekly-unit milestones, the
          // one-week Stray Kids interruption (corrected: "Do It," not "Just Do
          // It" — it fell to No. 3), the end of the reign (Wallen reclaims No. 1,
          // Jan. 17, 2026), and a non-Billboard wire to break the Billboard-only lean.
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-showgirl-10-weeks-number-one-billboard-200-1236143930/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' Spends 10th Week at No. 1 on Billboard 200",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-22',
            reliability_score: 5,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/stray-kids-do-it-billboard-200-number-one-debut-1236124898/',
            source_title: "Stray Kids' 'Do It' Debuts at No. 1 on Billboard 200",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-22',
            reliability_score: 5,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/morgan-wallen-problem-13th-week-number-one-billboard-200-1236152774/',
            source_title: "Morgan Wallen's 'I'm the Problem' Returns to No. 1 on Billboard 200",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-22',
            reliability_score: 5,
          },
          {
            outlet: 'RTTNews',
            url: 'https://www.rttnews.com/3600760/stray-kids-dethrone-taylor-swift-atop-billboard-200-with-do-it.aspx',
            source_title: "Stray Kids Dethrone Taylor Swift Atop Billboard 200 With 'Do It'",
            publisher: 'RTTNews (wire)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 3,
          },
          // Depth ledger #1006 (2026-07-22): the Bing Crosby holiday-week detail —
          // Ultimate Christmas' 140.71M-stream week (his biggest ever, and the
          // biggest streaming week for any holiday album) topped out at No. 2 on
          // the Jan. 3, 2026 chart, behind Showgirl at No. 1 that same week.
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/bing-crosby-ultimate-christmas-top-streaming-albums-chart-1236146943/',
            source_title: "Bing Crosby's 'Ultimate Christmas' Hits No. 1 on Billboard's Top Streaming Albums Chart",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-22',
            reliability_score: 5,
          },
        ],
        // Official era wordmark; Commons hosts it as public domain (textual
        // logo, TAS Rights Management provenance), verified via the API.
        // Photo-enrichment pass (2026-07-18, #762): press-shoot frame is from
        // Billboard's own 12th-week story (billboard.com/wp-content, frame 01
        // of the album press set — a different frame than the 03 used on the
        // four-million-week page); downloaded and vision-confirmed 1800x1200.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2025/08/01-taylor-swift-life-of-a-showgirl-pr-billboard-1800.jpg',
            credit: 'Album press photo / TAS Rights Management, via Billboard',
            caption:
              'From the album\'s press shoot — the bob-wigged showgirl with a coupe in a hall of mirrors, still on top of the Billboard 200 twelve weeks later.',
            kind: 'primary',
            focalPoint: '53% 32%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Taylor_Swift_-_The_Life_of_a_Showgirl_Logo.png',
            credit: 'TAS Rights Management / Republic Records, public domain (textual logo), via Wikimedia Commons',
            caption:
              'The era\'s orange-glitter wordmark — on top of the Billboard 200 for every week of it through the holidays.',
            kind: 'archival',
            // Focal point: pure wordmark, genuinely reads best centered.
            focalPoint: '50% 50%',
          },
        ],
      },
    },
    {
      slug: 'showgirl-luminate-2025-top-album',
      significance: 'notable', // the year-end industry-data confirmation of the album's record-setting week (docs/decisions.md, 2026-07-19)
      year: 2026,
      month: 1,
      day: 14,
      category: 'business',
      // Cross-links (ledger #1077, 2026-07-21): the year-end crown is the
      // full-year settle-up on the record October week — thread it to the
      // debut-week record that supplied the bulk of the total, the album
      // itself, and the vinyl week it also topped for the year.
      relatedIds: [
          'moment:vault-tloas-twelve-weeks-at-no-1-through-the-entire-holiday-season',
        'moment:vault-tloas-4-002-million-in-a-week-the-biggest-album-debut-ever-measure',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-1-334-million-vinyl-lps-in-seven-days-the-first-million-viny',
      ],
      title: "Luminate's 2025 crown: 5.6 million units, no contest",
      snippet:
        'The year-end report made it official — Showgirl was 2025\'s most-consumed album in the US at 5.607M units, roughly half a million clear of Morgan Wallen. Her fifth year-end No. 1 — more than any act in history — and second in a row.',
      sourceUrl: 'https://www.billboard.com/pro/luminate-2025-year-end-music-report-taylor-swift-showgirl/',
      thumbnailUrl: null,
      moment: {
        context:
          'Remarkable mostly for the calendar: the album had only 13 weeks of 2025 to work with (Luminate\'s tracking year closed Jan. 1, 2026) and still finished at 5.607 million US units — enough to beat everything released in the previous nine months and top Billboard\'s year-end Billboard 200. Morgan Wallen\'s "I\'m the Problem" ran second at 5.125 million; it was the first year since Luminate began the metric in 2014 that two albums each cleared five million.\n\nThe shape of the number tilted hard toward ownership. Of the 5.607 million, 3.985 million (71%) were pure album sales — itself the year\'s No. 1 sales total by a wide margin — against 1.603 million streaming-equivalent units and just 19,000 track-equivalent. Showgirl was also 2025\'s No. 1 vinyl album (1.601 million LPs) and the top seller on CD, cassette, and download, the collector economy behind the record October week doing the year-round work.\n\nIt was her fifth year-end No. 1 on the Billboard 200 — after Fearless (2009), 1989 (2015), reputation (2018), and The Tortured Poets Department (2024) — making her the first act ever to lead the year-end album chart five separate times. Taking 2024 and 2025 back to back also made her the first to top the year-end Billboard 200 in consecutive years with two different titles since Elton John in 1974. TTPD\'s larger 6.955-million 2024 total is the reminder that a single quarter of eligibility, not a bigger fanbase, set the 2025 ceiling. One nuance the headline hides: the year\'s top overall artist was Wallen (a record 41 Hot 100 entries), with Swift taking top album and top female artist. Globally, the IFPI named Showgirl its biggest-selling album of 2025 — No. 1 on its worldwide album, album-sales, and vinyl charts — back to back after The Tortured Poets Department took the 2024 global album crown — her second IFPI Global Album of the Year and second running; she had not won it for Midnights, whose 2022 global crown went to Bad Bunny’s "Un Verano Sin Ti."\n\nThe year-end crown wasn’t only American. Showgirl was also 2025’s No. 1 album in the UK — 642,000 combined chart sales, first across CD, vinyl, streaming and download (Official Charts) — and in Australia, topping ARIA’s year-end albums chart. Its US shape is the outlier: 71% pure sales cuts against the streaming-first norm of the era’s biggest records. Wallen’s runner-up leaned the other way — at 2025’s midpoint his units ran about 91% streaming-equivalent (2.326M of 2.562M) against barely 8% pure sales — so Showgirl led the year behaving like an ownership record in a rental market. One thing the album total hides is song-level: no Showgirl track made Billboard’s 2025 Year-End Hot 100, because "The Fate of Ophelia" didn’t reach No. 1 until Oct. 18, past the year-end tracking cutoff (the year-end No. 1 was Lady Gaga & Bruno Mars’ "Die With a Smile"); its nine-week reign counts toward the 2026 tally instead.',
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
          // Correction + depth 2026-07-24 (#1438 Q1): Showgirl is her FIFTH
          // year-end Billboard 200 No. 1 (was mislabeled "fourth") — Fearless
          // 2009, 1989 2015, reputation 2018, TTPD 2024, Showgirl 2025 — and
          // the Elton-John-1974 consecutive-titles line. Verified against
          // Billboard's own year-end story (already cited above) and this.
          {
            outlet: 'In Music',
            url: 'https://inmusicblog.com/news/taylor-swift-billboard-200-year-end-history-record/',
            source_title: 'Taylor Swift Makes History With Five Billboard 200 Year-End No. 1 Albums',
            publisher: 'In Music',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          // Depth ledger #1077 (2026-07-21): the format split (3.985M pure /
          // 1.603M SEA / 19K TEA), the pure-sales & vinyl No. 1s, Wallen's
          // 5.125M runner-up, the top-artist-vs-top-female-artist nuance,
          // the TTPD 2024 comparison, and the IFPI global crown.
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2026/01/14/taylor-swift-dominates-2025s-bestselling-albums-list-by-a-huge-margin/',
            source_title: "Taylor Swift Dominates 2025's Bestselling Albums List By A Huge Margin",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/morgan-wallen-billboard-top-artist-2025-1236129874/',
            source_title: "Morgan Wallen Is Billboard's Top Artist of 2025",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/luminate-2024-year-end-music-report-taylor-swift-shaboozey-teddy-swims/',
            source_title: "Luminate's 2024 Year-End Music Report",
            publisher: 'Billboard (Luminate 2024 year-end report)',
            source_type: 'chart_database',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
          {
            outlet: 'IFPI',
            url: 'https://www.ifpi.org/taylor-swifts-the-life-of-a-showgirl-named-ifpis-official-biggest-selling-global-album-of-the-year-2025/',
            source_title: "The Life of a Showgirl Named IFPI's Official Biggest-Selling Global Album of 2025",
            publisher: 'IFPI (press release)',
            source_type: 'official',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
          // Depth ledger #1438 (2026-07-25): Q2 UK/AU year-end crowns, Q3 the
          // IFPI count (2022 went to Bad Bunny, not Midnights), Q4 the
          // pure-sales-vs-streaming contrast with Wallen, Q5 no Showgirl track
          // on the 2025 Year-End Hot 100 (Ophelia peaked past the cutoff).
          {
            outlet: 'Official Charts',
            url: 'https://www.officialcharts.com/chart-news/the-official-biggest-albums-of-2025/',
            source_title: 'The Official biggest albums of 2025',
            publisher: 'Official Charts Company',
            source_type: 'chart_database',
            accessed_at: '2026-07-25',
            reliability_score: 5,
          },
          {
            outlet: 'The Music',
            url: 'https://themusic.com.au/industry/alex-warren-and-taylor-swift-lead-arias-2025-end-of-year-charts/bcrTYWBjYmU/03-02-26',
            source_title: "Alex Warren And Taylor Swift Lead ARIA's 2025 End-Of-Year Charts",
            publisher: 'The Music (ARIA year-end)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'IFPI',
            url: 'https://www.ifpi.org/bad-bunnys-un-verano-sin-ti-announced-as-winner-of-ifpis-global-album-award/',
            source_title: "Bad Bunny's Un Verano Sin Ti announced as winner of IFPI's Global Album Award (2022)",
            publisher: 'IFPI (press release)',
            source_type: 'official',
            accessed_at: '2026-07-25',
            reliability_score: 5,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/lady-gaga-bruno-mars-2025-year-end-billboard-hot-100/',
            source_title: "Lady Gaga & Bruno Mars' 'Die With a Smile' Is Billboard's 2025 Year-End Hot 100 No. 1",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-25',
            reliability_score: 5,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/morgan-wallen-kendrick-lamar-luminate-2025-midyear-charts-1236022530/',
            source_title: "Morgan Wallen's 'I'm the Problem' Tops Luminate's 2025 Midyear Rankings (unit split)",
            publisher: 'Billboard (Luminate 2025 midyear)',
            source_type: 'chart_database',
            accessed_at: '2026-07-25',
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
            focalPoint: '45% 25%',
          },
          // Photo pass #762 run 4 (2026-07-18): Billboard's 2025 Year-End
          // Charts hero — the branded artwork for the ranking this moment is
          // about. curl-verified 200 image/jpeg (942x628), vision-confirmed.
          {
            url: 'https://www.billboard.com/wp-content/uploads/2025/12/YE-Charts-web-hero17-taylor-swift-billboard-1800.jpg?w=942&h=628&crop=1',
            credit: 'Mert Alas & Marcus Piggott / Billboard Year-End Charts',
            caption: 'Billboard\'s 2025 Year-End Charts artwork — Showgirl topped the year-end Billboard 200 on the same math.',
            kind: 'archival',
            focalPoint: '58% 20%',
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
      // Cross-link deficit closed (depth ledger #1036 Q7, 2026-07-21): the
      // moment carried ZERO relatedIds despite being the video FOR the
      // "Elizabeth Taylor" song and the page's own named "intentional pair"
      // with the Fate of Ophelia video. Both target ids verified in-seed.
      relatedIds: [
        'moment:vault-tloas-elizabeth-taylor-the-first-song-she-wrote-for-the-album',
        'moment:vault-tloas-the-fate-of-ophelia-hamlets-drowned-girl-rescued-and-a-13th-',
        // Cross-link (candidate #1259): the single sent to radio.
        'moment:vault-tloas-elizabeth-taylor-goes-to-radio',
      ],
      title: 'The Elizabeth Taylor video: a supercut of the real Liz',
      snippet:
        'Released to close Women\'s History Month — Cleopatra, Cat on a Hot Tin Roof, A Place in the Sun, and newsreel paparazzi footage, cut into a tribute instead of a performance video.',
      sourceUrl: 'https://variety.com/2026/music/news/taylor-swift-elizabeth-taylor-music-video-1236703350/',
      thumbnailUrl: null,
      moment: {
        context:
          'The March 31, 2026 video breaks from the era\'s self-directed clips: unlike "The Fate of Ophelia" and "Opalite," it does not appear among Swift\'s credited directorial works — her official directed-projects list carries both of those but not this one — and no director is named in the coverage. It is built almost entirely from archival material: scenes from nine-plus Taylor films (Cleopatra, Cat on a Hot Tin Roof, A Place in the Sun, Giant, Father of the Bride, Suddenly, Last Summer, Who\'s Afraid of Virginia Woolf?, Julia Misbehaves and Boom! among them), cut against newsreel footage of her navigating banks of photographers and close-ups of the violet eyes and diamonds the lyric itself invokes. Rather than cast herself as Elizabeth (the move most artists would make), Swift stays out of frame entirely, letting the real woman carry her own tribute — a supercut argument that the song\'s subject needs no re-enactment.\n\nThe release mechanics were their own story: it hit Apple Music and Spotify Premium first, then YouTube two days later — an unusual windowed rollout for a Swift video — and it landed on the last day of Women\'s History Month, five months after the song had debuted at No. 3. It was the era\'s first new video since "The Fate of Ophelia," and the two make an intentional pair: one a self-directed showgirl spectacular she stars in, the other a curated archive she deliberately absents herself from.\n\nIt was made with the estate\'s cooperation: the video lists every film it draws on and gives special thanks to House of Taylor and the Elizabeth Taylor Trust, and to the families of two of Taylor\'s husbands, Mike Todd and Michael Wilding. Critics largely treated the song as the album\'s centerpiece and praised the way image and lyric tell the story together, though some found the clip-reel unremarkable and a share of fans wished for a narrative video with actors instead. Rolling Stone\'s Rob Sheffield read a deep "Liz/Swift soul connection" — "both Taylors got famous as kids, grew up in public as America\'s sweetheart" — while fans divided: some hailed the effort behind a video cleared entirely from archival footage as "art," others were let down that it was "clipped together from Elizabeth Taylor movies," and a few joked the March 31 timing meant it "has to be an April Fools\' joke."',
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
          // Depth ledger #1036 (2026-07-21): the full film list and the
          // estate/House-of-Taylor + Todd/Wilding-family licensing credits.
          {
            outlet: 'ABC News / Good Morning America',
            url: 'https://www.goodmorningamerica.com/culture/story/taylor-swift-elizabeth-taylor-video-archival-footage-late-131576436',
            source_title: "Taylor Swift 'Elizabeth Taylor' video uses archival footage of the late actress",
            publisher: 'ABC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          // Added 2026-07-25 (ledger #1036 Q1 correction): a prior pass said
          // Swift directed this video, but her official directed-projects
          // index lists "The Fate of Ophelia" and "Opalite" and NOT
          // "Elizabeth Taylor" — so the self-direction claim is unsupported.
          {
            outlet: 'taylorswift.com',
            url: 'https://www.taylorswift.com/directed-projects/',
            source_title: 'Directed Projects',
            publisher: 'Taylor Swift (official site)',
            source_type: 'official',
            accessed_at: '2026-07-25',
            reliability_score: 5,
          },
          // Added 2026-07-26 (ledger #1036 Q5): attributed reception — Rob
          // Sheffield's "Liz/Swift soul connection" read and the divided fan
          // response ("art" vs. "clipped together," the April Fools' joke quip).
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-elizabeth-taylor-music-video-fan-reaction-1235539693/',
            source_title: "Taylor Swift Fans React to 'Elizabeth Taylor' Music Video: 'Has to Be an April Fools' Joke'",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-26',
            reliability_score: 4,
          },
        ],
        // Official MV id WqbJT_vC0rs verified via oEmbed against
        // @TaylorSwift ("Taylor Swift - Elizabeth Taylor (Official Music
        // Video)") this session; thumbnail HTTP 200 + image/jpeg.
        video: { youtubeId: 'WqbJT_vC0rs', title: 'Taylor Swift - Elizabeth Taylor (Official Music Video)' },
        // Photo pass #762 run 9 (2026-07-18): hqdefault raised to the same
        // video's 1280x720 maxres render (a close-up of the real Liz from the
        // supercut). Added a public-domain still of Elizabeth Taylor from the
        // 1958 Cat on a Hot Tin Roof trailer — one of the films the video
        // cuts from; PD license verified via the Commons API this session
        // (763x459). Both images downloaded and viewed for focal points.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/WqbJT_vC0rs/maxresdefault.jpg',
            credit: 'Taylor Swift / Republic Records (official "Elizabeth Taylor" music video thumbnail, YouTube)',
            caption: 'The official "Elizabeth Taylor" music video — a supercut of the real Elizabeth Taylor\'s films and newsreels.',
            kind: 'primary',
            // B&W close-up of Liz reclining; eyes upper-right of center.
            focalPoint: '52% 40%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Cat_on_a_Hot_Tin_Roof4.jpg',
            credit: 'MGM trailer screenshot (1958), public domain, via Wikimedia Commons',
            caption:
              'Elizabeth Taylor with Paul Newman in the Cat on a Hot Tin Roof trailer, 1958 — one of the nine-plus films the video\'s supercut draws on.',
            kind: 'archival',
            // Liz leaning on Newman's shoulder, her face right-of-center.
            focalPoint: '55% 40%',
          },
        ],
      },
    },
    {
      slug: 'nyt-greatest-songwriters-interview',
      significance: 'notable', // a rare critical assessment of her actual craft, from one of the country's most respected culture desks (docs/decisions.md, 2026-07-19)
      // Cross-links (ledger #1044, 2026-07-21): the page had none despite being
      // an explicit craft-canonization beat — thread it to its direct payoff
      // (the Songwriters Hall of Fame induction six weeks later) and the album
      // whose rollout the interview sat inside.
      relatedIds: [
        'moment:vault-tloas-the-youngest-woman-in-the-songwriters-hall-of-fame',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
      ],
      year: 2026,
      month: 4,
      day: 28,
      category: 'music',
      title: 'One of the 30 greatest living American songwriters — and a rare half-hour on the craft',
      snippet:
        'The New York Times names Taylor one of the 30 greatest living American songwriters, and the accompanying sit-down is the real gift: 30 minutes on camera about nothing but the writing — the emo roots, "may the best idea win," and why decoding who a song is about is "sort of like a paternity test. That dude didn\'t write the song. I did."',
      sourceUrl: 'https://www.youtube.com/watch?v=5B8-TJ8vsKY',
      thumbnailUrl: null,
      moment: {
        context:
          'The Times\' list, published April 28, 2026, was assembled from more than 250 music insiders and six of its own critics (Wesley Morris, Jon Caramanica, Joe Coscarelli, Lindsay Zoladz, Jody Rosen and Danyel Smith) — unranked, and putting her alongside Bob Dylan, Dolly Parton, Jay-Z, Kendrick Lamar, Missy Elliott, and Bad Bunny — a roster weighted toward elder statespeople (Paul Simon, Stevie Wonder, Bruce Springsteen and Nile Rodgers made it too), on which she, Kendrick and Bad Bunny stand out as the youngest generation named. The accompanying video interview — conducted by Times music reporter Joe Coscarelli and released through the paper\'s Popcast — is the part fans kept: an uninterrupted half-hour where the only subject is the songwriting.\n\nThe takeaways travel well. Country storytelling pulled her in first, but the other early wire was emo, and here she named names: she praised the "specificity" of Dashboard Confessional\'s "Hands Down" — reading those lyrics, she said, made her think "oh, my God" — and the way Fall Out Boy "switched it" on "Sugar, We\'re Goin Down," quoting the "I\'m just a notch in your bedpost, but you\'re just a line in a song" flip. She traced none of her own songs to that wire, only the craft lesson she took from it. Her collaboration rule: "May the best idea win... I don\'t care if it came from you, you or me. If it\'s better, that\'s what goes in the song" — adding "I do kind of like it when people challenge me on something." And on the fandom\'s favorite sport, she pushed back harder than she ever has: "When it gets a little bit weird for me is when people act like it\'s sort of like a paternity test... That dude didn\'t write the song. I did." Coverage read the line as a general verdict on years of who-is-it-about sleuthing, not a reply to any single album\'s speculation cycle.\n\nOn the songs themselves the half-hour is unusually granular. She walked through the lost-and-rebuilt "All Too Well (10 Minute Version)," reconstructed from her old diaries in what she called her most extensive song restoration; a copy-editor\'s tic on "Our Song" (she changed "talk real low" to "talk real slow" to avoid a word ending on the letter the next one starts with); the head-through-a-wall intensity behind "...Ready For It?" and "Getaway Car"; "Love Story," written at seventeen while furious at her parents; and "Nothing New," written alone in a hotel at twenty-two convinced she was "completely washed up." She traced "Blank Space" and "Anti-Hero" back to the criticism of her that made them possible, and described catching the "Elizabeth Taylor" melody on a car ride straight into her phone\'s voice-memo app — a rare glimpse of the toolkit, voice memos and old diaries, behind the writing.\n\nThe timing made it land as the opening beat of a craft-canonization spring: six weeks later she\'d be the youngest woman ever inducted into the Songwriters Hall of Fame.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-greatest-songwriters-interview-things-learned/',
            source_title: "7 Things We Learned From Taylor Swift's 'Greatest Living American Songwriters' Interview",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-14',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2026/music/news/taylor-swift-fans-trying-to-figure-out-who-songs-about-weird-1236732071/',
            source_title: "Taylor Swift Says It's 'Weird' When Fans Turn Songs Into 'Paternity Tests' to Figure Out Who She's Talking About",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-14',
            reliability_score: 4,
          },
          {
            outlet: 'The Detroit News',
            url: 'https://www.detroitnews.com/story/entertainment/music/2026/04/29/taylor-swift-songwriting-paternity-test/89852693007/',
            source_title: "Taylor Swift battles fans conducting 'paternity test' on her songwriting",
            publisher: 'The Detroit News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-14',
            reliability_score: 4,
          },
          // Ledger #1044 Q2 (2026-07-21): the interview's platform + interviewer
          // — the NYT Popcast episode, conducted by Times reporter Joe
          // Coscarelli (host Jon Caramanica framed it on the show).
          {
            outlet: 'The New York Times — Popcast',
            url: 'https://podcasts.apple.com/us/podcast/the-taylor-swift-interview-behind-the-scenes/id120315823?i=1000765543287',
            source_title: 'The Taylor Swift Interview: Behind the Scenes',
            publisher: 'The New York Times',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          // Ledger #1044 Q1 (2026-07-25): the specific songs she breaks down on
          // camera (All Too Well 10-min, Our Song, ...Ready For It?, Getaway
          // Car, Love Story, Nothing New, Blank Space, Anti-Hero, Elizabeth
          // Taylor) and the voice-memo/diaries process.
          {
            outlet: 'Pedestrian.TV',
            url: 'https://www.pedestrian.tv/entertainment/taylor-swift-nyt-interview/',
            source_title: "9 Things We Learned From Taylor Swift's NYT Interview, From Lyric Changes To All Too Well Lore",
            publisher: 'Pedestrian Group',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          // Ledger #1044 Q3 (2026-07-25): the wider honoree roster used to place
          // her among the youngest names on a list dominated by elders.
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/music/articles/nyt-ranked-30-greatest-living-165619725.html',
            source_title: "NYT Ranked The '30 Greatest Living American Songwriters' — And The Internet Is Divided",
            publisher: 'Yahoo',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          // Ledger #1044 Q5 (2026-07-25): the specific emo songs she named —
          // Dashboard Confessional's "Hands Down" and Fall Out Boy's "Sugar,
          // We're Goin Down" — and that she traced none of her own songs to them.
          {
            outlet: 'Loudwire',
            url: 'https://loudwire.com/taylor-swift-emo-fall-out-boy-dashboard-confessional/',
            source_title: "Taylor Swift Names the Emo Songs That Shaped Her Songwriting",
            publisher: 'Loudwire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          // Ledger #1044 Q6 (2026-07-25): the "paternity test" line read as a
          // general remark on years of fan sleuthing, not aimed at one cycle.
          {
            outlet: 'GMA News Online',
            url: 'https://www.gmanetwork.com/news/showbiz/showbizabroad/985915/taylor-swift-songwriting-fan-theories/story/',
            source_title: "Taylor Swift on fans' songwriting 'paternity tests'",
            publisher: 'GMA News Online',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
        ],
        // Video id 5B8-TJ8vsKY verified 2026-07-14 via web search title match
        // ("Taylor Swift: The Stories Behind Her Biggest Songs (Exclusive
        // Interview)"). Photo pass #762 run 9 (2026-07-18): oEmbed now
        // verified — author_name "Popcast" (@Popcast, the NYT music
        // podcast's channel), same title. 1280x720 maxres thumbnail
        // curl-verified 200 image/jpeg, downloaded and viewed (NYT "T" logo
        // and "Taylor Swift on Songwriting" title card visible in-frame).
        video: { youtubeId: '5B8-TJ8vsKY', title: 'Taylor Swift: The Stories Behind Her Biggest Songs (Exclusive Interview)' },
        photos: [
          {
            url: 'https://i.ytimg.com/vi/5B8-TJ8vsKY/maxresdefault.jpg',
            credit: 'The New York Times / Popcast (official interview thumbnail, YouTube)',
            caption:
              'The Times\' half-hour sit-down on nothing but the songwriting, published with its 30-greatest-living-American-songwriters list.',
            kind: 'primary',
            // Taylor mid-gesture on the right, face upper-right; title text left.
            focalPoint: '62% 38%',
          },
        ],
      },
    },
    {
      slug: 'songwriters-hall-of-fame-induction',
      significance: 'notable', // a genuine career-capping industry-body first, not just another award (docs/decisions.md, 2026-07-19)
      year: 2026,
      month: 6,
      day: 11,
      category: 'music',
      // Cross-link (candidate #1045): the NYT 30-greatest-songwriters interview
      // that opened the same 2026 craft-canonization spring.
      relatedIds: ['moment:vault-tloas-one-of-the-30-greatest-living-american-songwriters-and-a-rar'],
      title: 'The youngest woman in the Songwriters Hall of Fame',
      snippet:
        'At 36, Taylor becomes the youngest woman ever inducted into the Songwriters Hall of Fame — only Stevie Wonder got there younger. Steven Spielberg handles the surprise introduction, and Travis and both moms watch from her table, three weeks before the wedding.',
      sourceUrl: 'https://www.pbs.org/newshour/arts/taylor-swift-becomes-the-youngest-woman-inducted-into-the-songwriters-hall-of-fame-at-age-36',
      thumbnailUrl:
        'https://d3i6fh83elv35t.cloudfront.net/static/2026/06/2026-06-11T222809Z_1091184995_RC2YRLAQU168_RTRMADP_3_AWARDS-SONGWRITERS-HALL-OF-FAME-1024x683.jpg',
      moment: {
        context:
          'The June 11 ceremony at New York\'s Marriott Marquis put her in a class of 2026 that included Alanis Morissette, Kenny Loggins, KISS\'s Gene Simmons and Paul Stanley, Walter Afanasieff, Terry Britten and Graham Lyle, and Christopher "Tricky" Stewart — and put her in the record books twice: youngest woman ever inducted, and second-youngest inductee in the Hall\'s history behind Stevie Wonder, who got in at 32 in 1983. She had a prior tie to the Hall — its 2010 Hal David Starlight Award, given to her at 20 — which made her its first Starlight honoree to return as a full inducted member. Of all the institutions to canonize her mid-era, this one honored the craft underneath everything else: the writing.\n\nThe introduction was her own doing: asked which of her heroes she\'d want presenting, she named Steven Spielberg, who appeared as a surprise. He set her in a lineage of "the composers of the Great American Songbook, Lennon and McCartney of the Sixties, and the singer-songwriters of the Seventies like Carole King and Stevie Nicks and your namesake James Taylor," called her "a woman who has no peer when it comes to shattering records as a writer, singer, and storyteller," and argued her achievements "defy A.I." — "no algorithm can replace the soul of a true original." "Somehow," he closed, "Taylor knows us all too well."\n\nTaylor didn\'t perform. Instead, at her request, the 20-year-old singer-songwriter sombr opened her segment with covers of "Cardigan" and "Dear John," and she returned the praise — "his writing is so exceptional that it makes me actually envious... Sombr is the future, and he doesn\'t need AI." The rest of her past-twenty-minute speech was about where her own writing began: she named the Nashville co-writers who taught her the room — Liz Rose (a fellow inductee, watching from the audience), Hillary Lindsey, the late Brett James, Robert Ellis Orrall, the Warren Brothers and Craig Wiseman — recalling how a session with Wiseman sent her home to finish "Love Story" alone that night. She held back tears thanking her family for "uprooting their entire lives" to Nashville to bet on her.\n\nShe kept the room on songwriting — no mention of the Madison Square Garden wedding twenty-two days off, though the seating told that story anyway, with Travis Kelce, Andrea Swift and Donna Kelce at her table. She walked the carpet in a custom Givenchy by Sarah Burton, a black gown embroidered top to bottom with blooms. The gala is an invite-only black-tie dinner with no broadcast or livestream; the full remarks reached fans mainly through Billboard\'s published transcript, picked up across Variety, Rolling Stone, PBS NewsHour and CBS News.',
        sources: [
          {
            outlet: 'PBS NewsHour',
            url: 'https://www.pbs.org/newshour/arts/taylor-swift-becomes-the-youngest-woman-inducted-into-the-songwriters-hall-of-fame-at-age-36',
            source_title: 'Taylor Swift becomes the youngest woman inducted into the Songwriters Hall of Fame at age 36',
            publisher: 'PBS NewsHour',
            source_type: 'reputable_press',
            accessed_at: '2026-07-13',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2026/music/news/taylor-swift-songwriters-hall-of-fame-acceptance-speech-1236779180/',
            source_title: 'Taylor Swift Thanks Family, Tears Up at Songwriters Hall of Fame 2026',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-13',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/awards/taylor-swift-songwriters-hall-of-fame-induction-speech-1236271403/',
            source_title: "Here's Taylor Swift's Full 20-Minute Induction Speech at the 2026 Songwriters Hall of Fame",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-13',
            reliability_score: 4,
          },
          // Added 2026-07-24 (ledger #1119): the sombr tribute (Q1), Spielberg's
          // actual remarks (Q3), the gown designer (Q6), and the Hall's own
          // record of the gala (Q2/Q7).
          {
            outlet: 'Variety',
            url: 'https://variety.com/2026/music/news/sombr-covers-taylor-swift-songwriters-hall-of-fame-1236779478/',
            source_title: 'Sombr Covers Two Taylor Swift Songs as Steven Spielberg Compares Her to Lennon-McCartney at Songwriters Hall of Fame Ceremony',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/steven-spielberg-taylor-swift-songwriters-hall-of-fame-1235576584/',
            source_title: "See Steven Spielberg Praise 'Singular' Taylor Swift in Songwriters Hall of Fame Introduction",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'WWD',
            url: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-givenchy-dress-songwriters-hall-of-fame-gala-1239008334/',
            source_title: "Taylor Swift Endorses Sarah Burton's Givenchy at Songwriters Hall of Fame Gala",
            publisher: 'WWD',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          {
            outlet: 'Songwriters Hall of Fame',
            url: 'https://www.songhall.org/news/shof-celebrates-best-of-songwriting-legends-at-2026-gala',
            source_title: 'Songwriters Hall of Fame Celebrates the Best of Songwriting Legends at its 2026 Induction & Awards Dinner',
            publisher: 'Songwriters Hall of Fame',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
        ],
        // Photo pass #762 run 4 (2026-07-18): both ceremony photos
        // curl-verified 200 image/jpeg, downloaded, and vision-confirmed
        // (Songwriters Hall of Fame step-and-repeat visible in both).
        photos: [
          {
            url: 'https://d3i6fh83elv35t.cloudfront.net/static/2026/06/2026-06-11T222809Z_1091184995_RC2YRLAQU168_RTRMADP_3_AWARDS-SONGWRITERS-HALL-OF-FAME-1024x683.jpg',
            credit: 'Kylie Cooper/Reuters, via PBS NewsHour',
            caption: 'On the carpet at the 55th Songwriters Hall of Fame Induction and Awards Gala in New York, June 11, 2026.',
            kind: 'primary',
            focalPoint: '38% 18%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2026/06/P1071NXM-e1781277661981.jpg?w=942&h=628&crop=1',
            credit: 'John Nacion/Variety, via Billboard',
            caption: 'The floral-embroidered black gown, full length, on the gala red carpet.',
            kind: 'primary',
            focalPoint: '47% 20%',
          },
        ],
      },
    },
    {
      slug: 'rock-hall-ophelia-display',
      // Cross-links (ledger #1049, 2026-07-21): the page carried none, yet the
      // artifacts on display ARE the wardrobe from "The Fate of Ophelia" video
      // — link it to that video, to the lead single it served, and to the
      // page that catalogs the same garments (the Ophelia video wardrobe).
      relatedIds: [
        'moment:vault-tloas-the-fate-of-ophelia-video-premieres',
        'moment:vault-tloas-the-fate-of-ophelia-hamlets-drowned-girl-rescued-and-a-13th-',
        'moment:vault-tloas-the-ophelia-video-wardrobe-versace-crystals-cavalli-chainmai',
      ],
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
          'The display opened in late June 2026 on the museum\'s fifth level, in the Legends of Rock exhibit — institutional-canon treatment for an era still in progress, before she is even age-eligible for induction. The case holds the long-beaded gown from the video\'s finale, the mint sequined swimming costume from its synchronized-swim number, and props carried by her dancers, staged against a backdrop image from the shoot.\n\nThe artifacts come from the self-written, self-directed video whose single led the Hot 100 for 10 weeks, her longest-leading No. 1, and which had passed 438 million views by the time the case was installed (and 450 million within weeks of it). The placement is the story: costumes from a nine-month-old music video sharing a floor with rock history\'s permanent wardrobe, the museum treating the Showgirl era as canon while it was still selling out vinyl pressings.\n\nTwo details the coverage pins down sharpen the picture. The installation is temporary, not a permanent placement: Cleveland.com reported the exhibit is "slated to be up through the end of the year," a defined 2026 run window inside the standing Legends of Rock section. And it is not the museum\'s first Swift artifact — Cleveland.com noted the case "joins a growing collection of Swift memorabilia already displayed" in Cleveland, with earlier items reported to include a cardigan from one of her music videos and a moss-covered piano, so the Rock Hall had been showing her work well before the Ophelia costumes arrived. What the coverage never settled is how the pieces got there: loan, donation, or acquisition is unstated, and no named curator went on record explaining why an era still in progress earned a case.',
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
          // Ledger #1049 Q2 + Q4 (2026-07-25): the temporary "through the end of
          // the year" run window, and that the case joins an existing Swift
          // collection at the Rock Hall (so it is not her first artifact there).
          {
            outlet: 'Cleveland.com (via AOL)',
            url: 'https://www.aol.com/articles/taylor-swifts-fate-ophelia-joins-172729000.html',
            source_title: "Taylor Swift's 'Fate of Ophelia' costumes join the Rock & Roll Hall of Fame",
            publisher: 'Cleveland.com / Advance Local',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
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
        // Photo pass #762 run 9 (2026-07-18): re-searched for a clean case
        // photo; the syndicated radio-network posts (kiss951.com et al.) run
        // a Getty Songwriters-HOF red-carpet portrait — off-moment, and a
        // third party's Getty copy — rejected on viewing. Still no direct
        // photo of the case on an approved source; deliberately one photo.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Rock_and_Roll_Hall_of_Fame%2C_May_2016.jpg',
            credit: 'MusikAnimal, CC BY-SA 4.0, via Wikimedia Commons',
            caption: 'The Rock & Roll Hall of Fame in Cleveland, home of the Legends of Rock exhibit where the display sits.',
            kind: 'archival',
            // Glass pyramid centered; entrance sign just below the midline.
            focalPoint: '50% 55%',
          },
        ],
      },
    },
    {
      slug: 'kelce-new-heights-proposal-story',
      // Cross-link (candidate #1114): the New Heights announcement this returns to.
      // Cross-link (candidate #1294): Jason Kelce on the fanbase shift — same
      // Kelce-family-media throughline.
      relatedIds: [
        'moment:vault-tloas-a-mint-green-briefcase-on-new-heights-album-no-12-announced-',
        'moment:vault-tloas-jason-kelce-on-the-new-audience-taylor-brought-to-the-whole-',
      ],
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
          'The post-wedding episode closed a loop the era opened: New Heights hosted the album reveal in August 2025, the engagement announcement followed two weeks later, and eleven months on, Kelce used the same desk to finally tell the proposal story — confirming that during that August 2025 taping, he was already planning to ask Taylor to marry him. Per E!\'s recap, he called starting the podcast season with her "pretty epic."\n\nThe episode\'s existence was itself notable. The wedding itself remains publicly unrecounted — no interviews, no magazine exclusive, no official photos — but the proposal finally got its telling, characteristically, through the podcast that has functioned as the relationship\'s official record since 2023: the show that started it (the failed friendship-bracelet handoff), announced the album, and now got the proposal\'s own origin story.\n\nThe staging Kelce described: he had his backyard secretly transformed into what outlets called a "secret garden" — a mix of roses, peonies, hydrangeas and delphinium — while the August 2025 episode was being recorded inside the house, with blackout drapes hung over every window so Swift couldn\'t see the setup in progress. The moment he describes planning throughout that entire taping was leading her outside right after they finished recording. This July 8 episode itself was New Heights\' season-four finale, taped with Tom Brady as guest; co-host Jason Kelce called it "by far our most viewed episode of all time," though no outlet paired that claim with an exact number against the ~1.3 million concurrent viewers Guinness certified for the August 2025 Swift episode. Travis kept the wedding itself off the table on this episode — he spoke only about the proposal and the relationship\'s beginning, not the ceremony — and Swift did not appear on or corroborate this particular episode; her own on-record account of the friendship-bracelet mishap ("such a wild romantic gesture," like "an \'80s John Hughes movie") comes from her own August 2025 appearance, a separate story from the proposal itself. On timing: the August 2025 taping preceded the Aug. 26, 2025 public engagement announcement by roughly two weeks, matching Kelce\'s "started the season" framing; no outlet has published the exact taping date separate from the episode\'s Aug. 13 air date.',
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
          // Depth ledger #1113 (2026-07-29): the peonies/blackout-drapes staging
          // detail, the Tom Brady finale/viewership framing, and the
          // wedding-stayed-private + timeline facts.
          {
            outlet: 'ABC News',
            url: 'https://abcnews.com/GMA/Culture/travis-kelce-talks-proposing-taylor-swift-1st-post/story?id=134582086',
            source_title: "Travis Kelce talks proposing to Taylor Swift in 1st post-wedding podcast",
            publisher: 'ABC News (Good Morning America)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-29',
            reliability_score: 4,
          },
          {
            outlet: 'TMZ',
            url: 'https://www.tmz.com/2026/07/08/travis-kelce-details-taylor-swift-proposal/',
            source_title: 'Travis Kelce Opens Up On Taylor Swift Proposal, Confirms Fan Theory',
            publisher: 'TMZ',
            source_type: 'reputable_press',
            accessed_at: '2026-07-29',
            reliability_score: 3,
          },
          {
            outlet: 'Sports Illustrated',
            url: 'https://lifestyle.si.com/celebrities/travis-kelce-reflects-on-proposal-to-taylor-swift-new-heights',
            source_title: "Travis Kelce Reflects on Proposal to Taylor Swift in 'New Heights' Season Finale Episode",
            publisher: 'Sports Illustrated',
            source_type: 'reputable_press',
            accessed_at: '2026-07-29',
            reliability_score: 3,
          },
          {
            outlet: 'TMZ',
            url: 'https://www.tmz.com/2025/08/26/taylor-swift-new-heights-world-record/',
            source_title: "Taylor Swift's 'New Heights' Episode Breaks Guinness World Record",
            publisher: 'TMZ',
            source_type: 'reputable_press',
            accessed_at: '2026-07-29',
            reliability_score: 3,
            notes: 'the ~1.3 million concurrent-viewer Guinness record for the Aug. 13, 2025 episode, and the Aug. 26 engagement-announcement date',
          },
        ],
        // Primary: the July 8, 2026 season-finale episode itself (EP 198,
        // verified 2026-07-17 via YouTube oEmbed against @newheightshow:
        // "Tom Brady on Favorite Super Bowl..." — the episode where Travis
        // told the proposal story). Thumbnail verified HTTP 200 + image/jpeg,
        // downloaded and viewed. Archival: the August 2025 Taylor Swift
        // episode of the same show — the desk the era's story keeps
        // returning to.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/LnpmnyCIbNQ/maxresdefault.jpg',
            credit: 'New Heights with Jason & Travis Kelce (official YouTube episode thumbnail)',
            caption:
              'The season-finale episode itself — Jason, guest Tom Brady, and a newly married Travis, in the first New Heights released after the wedding, where the proposal story finally got told.',
            kind: 'primary',
          },
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
      // Cross-links (ledger #1000, 2026-07-21): the coda carried zero links.
      // Thread it to the ring it follows up (same designer, same stone), the
      // announcement whose close-up made Lubeck famous, and the wedding she
      // was invited to. A crosslink-candidate issue covers the ring pair.
      relatedIds: [
        'moment:vault-tloas-the-ring-an-old-mine-diamond-from-a-goldsmith-taylor-already',
        'moment:vault-tloas-your-english-teacher-and-your-gym-teacher-are-getting-marrie',
        'moment:vault-tloas-taylor-and-travis-marry-at-madison-square-garden',
      ],
      title: 'The ring designer gets a wedding invite of her own',
      snippet:
        'Kindred Lubeck of Artifex Fine Jewelry, who designed Taylor\'s engagement ring with Travis, was among the guests at the Madison Square Garden wedding — and publicly thanked the "incredible" couple for including her.',
      sourceUrl: 'https://www.eonline.com/news/1433683/taylor-swift-travis-kelce-invited-ring-designer-kindred-lubeck-to-wedding',
      thumbnailUrl: null,
      moment: {
        context:
          'Lubeck\'s attendance closed the loop on the engagement-ring story: the jeweler who worked with Kelce on the custom Old Mine Cut design nearly a year earlier was invited to see the marriage it led to, a detail she confirmed publicly after the wedding, thanking the "incredible" couple for including her.\n\nIt was a fitting coda for the person whose work had carried an outsized share of the era\'s symbolism. Lubeck — the goldsmith, hand engraver, and vintage-jewelry specialist behind New York\'s Artifex Fine Jewelry — was catapulted from independent-studio obscurity to global attention overnight when the ring close-up hit the couple\'s August 2025 announcement post, and the invitation suggested the collaboration had been personal rather than transactional. A guest list that ran from Hugh Grant to Stevie Nicks also had room for the woman who made the ring.\n\nThe thank-you was her own: on an Instagram carousel of her wedding-night look, posted days after the July 3 wedding, Lubeck called it "an evening of celebrating the incredible couple who changed my life forever," signing off "Congratulations T&T" — the primary post E! and USA Today quoted. She came as a guest in a strapless dark-green gown and diamonds; no outlet credited that jewelry as her own Artifex work, and none has named who made the couple\'s wedding bands, so the engagement ring stays the full documented extent of her hand in the day.\n\nThe invitation capped a fast-widening year. After the August 2025 reveal, Lubeck — who learned hand-engraving from her goldsmith father in Jacksonville — took three one-of-a-kind pieces to a Sotheby\'s "Gem Drop" in late 2025, launched Artifex Bride, a first ready-to-order bridal line, in April 2026, and lent the label to a De Beers runway partnership. Order and waitlist numbers stayed private, but the arc from studio obscurity to global name ran straight through the wedding she was invited to attend.',
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
          // Added 2026-07-21 (depth ledger #1000): the verbatim caption, the
          // Artifex Bride launch, and Lubeck's profile / the Gem Drop.
          {
            outlet: 'USA Today',
            url: 'https://www.aol.com/articles/taylor-swifts-ring-designer-thanks-203659379.html',
            source_title: "Taylor Swift's ring designer thanks the couple after the wedding",
            publisher: 'USA Today (via AOL)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Complex',
            url: 'https://www.complex.com/pop-culture/a/holly-riordan/taylor-swift-engagement-ring-designer-launches-brand',
            source_title: "Taylor Swift's Engagement Ring Designer Launches Artifex Bride",
            publisher: 'Complex',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Sotheby\'s',
            url: 'https://www.sothebys.com/en/articles/taylor-swifts-engagement-ring-and-the-romantic-mystique-of-old-mine-diamonds',
            source_title: "Taylor Swift's Engagement Ring and the Romantic Mystique of Old Mine Diamonds",
            publisher: "Sotheby's",
            source_type: 'official',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
        ],
        // Primary: Lubeck herself beside her work — People's split image
        // (her own Instagram, from the wedding night) via Yahoo's syndicated
        // copy on media.zenfs.com; verified 2026-07-17 HTTP 200 + image/jpeg
        // (1500x1000), downloaded and viewed — left: Lubeck in her
        // wedding-guest jewelry, right: the Old Mine Cut ring close-up.
        // Archival: the ring itself, from the couple's own announcement
        // carousel (ABC News' stable copy, credited as ABC credits it).
        photos: [
          {
            url: 'https://media.zenfs.com/en/people_218/9c00317fa1b3074f60e013cdbc8628a6',
            credit: 'Kindred Lubeck/Instagram; @taylorswift/Instagram (via People/Yahoo)',
            caption:
              'The designer and the design: Kindred Lubeck on the wedding night she was invited to, beside the Old Mine Cut ring that earned the invitation.',
            kind: 'primary',
          },
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
      // Cross-link (candidate #1061): the wedding whose public price tag this itemizes.
      relatedIds: ['moment:vault-tloas-taylor-and-travis-marry-at-madison-square-garden'],
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
          'New York City Mayor Zohran Mamdani confirmed Taylor paid more than $160,000 for the event permit tied to her July 3 wedding to Travis Kelce at Madison Square Garden — a figure covering the permit itself plus the city\'s response to an event that closed streets, rerouted traffic, and pulled in a heavy NYPD presence around the Garden and Penn Station. He disclosed it at a Friday press conference, answering a reporter who asked whether Swift would compensate the city for police overtime: she "has paid already the cost of the permit that was lodged, which was over $160,000 for that event and for the response to that event."\n\nThe number landed as the answer to a live political question. Rep. Nicole Malliotakis (R-N.Y.) had publicly demanded the couple "reimburse NYPD for the 130 officers needed per day to keep their multi-million dollar, thousand person wedding at MSG safe," arguing "NYC taxpayers should NOT be on the hook" — a complaint sharpened by timing, since the July 3–4 window already had the department stretched across Independence Day, the Knicks\' championship celebration, and the FIFA World Cup. Mamdani\'s confirmation put a number to it and effectively closed it: the couple had already paid.\n\nWorth being precise about what that number does and doesn\'t confirm. No public breakdown itemizes the $160K into permit fee versus traffic control versus actual police overtime — pressed on it, Mamdani tied the figure to "the permit" and "the response" and left open that further costs could follow — so the accurate read is "Taylor paid for the permit and the associated city response," not "she personally covered every dollar of NYPD overtime" or "taxpayers paid nothing at all." Obtaining a permit and reimbursing the city for its response is the standard process for a street-closing private event of this footprint, so this reads as Swift following that process rather than going beyond it.\n\nSeparately, and worth not conflating with the city invoice: Taylor and Travis also gave $26 million to charity around the wedding — announced by Swift\'s publicist and spread across 20 organizations, nine of them New York–based. It included $2 million to Answer The Call (the N.Y. Police & Fire Widows\' & Children\'s Benefit Fund, which supports families of first responders killed in the line of duty, and which posted a thank-you on July 21), alongside Food Bank for NYC, City Harvest, New York Cares and Musical Mentors in the city, and Feeding America, the ASPCA, Kansas City\'s Children\'s Mercy Hospital, the Rhode Island Community Food Bank and Dolly Parton\'s Imagination Library beyond it — real money, but philanthropy, not a city-services invoice.',
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
          // Depth ledger #1060 (2026-07-26): the verbatim Mamdani press-conference
          // quote and the reimbursement framing (the $160K answers a reporter's
          // police-overtime question).
          {
            outlet: 'TODAY',
            url: 'https://www.today.com/popculture/news/taylor-swift-paid-nypd-police-overtime-wedding-zohran-mamdani-rcna385890',
            source_title: 'Taylor Swift Reimbursed NYC for Police Overtime After Wedding, Mayor Confirms',
            publisher: 'TODAY',
            source_type: 'reputable_press',
            accessed_at: '2026-07-26',
            reliability_score: 4,
          },
          // The political flashpoint: Rep. Nicole Malliotakis's "130 officers per
          // day… taxpayers should NOT be on the hook" demand, the press-conference
          // context, and the concurrent July 3–4 NYPD load (July 4th, Knicks
          // celebration, FIFA World Cup).
          {
            outlet: 'Police1',
            url: 'https://www.police1.com/taylor-swift-reportedly-paid-160-000-for-nypd-cops-at-madison-square-garden-wedding-weekend',
            source_title: 'Taylor Swift reportedly paid $160,000 for NYPD cops at Madison Square Garden wedding weekend',
            publisher: 'Police1',
            source_type: 'reputable_press',
            accessed_at: '2026-07-26',
            reliability_score: 3,
          },
          // The $26M charity split: 20 organizations, nine NYC-based, announced by
          // Swift's publicist ahead of the wedding.
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-travis-kelce-wedding-donate-charity/',
            source_title: 'Taylor Swift and Travis Kelce donate $26 million to charities ahead of wedding',
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-26',
            reliability_score: 4,
          },
          // The specific $2M to Answer The Call (N.Y. Police & Fire Widows' &
          // Children's Benefit Fund) and the org's July 21 thank-you.
          {
            outlet: 'EntertainmentNow',
            url: 'https://entertainmentnow.com/taylor-swift/taylor-swift-travis-kelce-first-responders/',
            source_title: 'Taylor Swift and Travis Kelce Made Life-Changing $2M Donation to Families of NYC First Responders',
            publisher: 'EntertainmentNow',
            source_type: 'reputable_press',
            accessed_at: '2026-07-26',
            reliability_score: 3,
          },
        ],
        // What the $160K bought, made visible: AP photo (via ABC7 New York's
        // street-closure coverage) of NYPD "No Parking" signs going up at the
        // barriers around MSG on July 2, 2026. Verified 2026-07-17: HTTP 200,
        // image/jpeg, 1920x1080, downloaded and viewed — police-department
        // signage, barriers, and event trucks outside the Garden.
        photos: [
          {
            url: 'https://cdn.abcotvs.com/dip/images/19437803_070226-wabc-msg-no-parking-ap-img.jpg',
            credit: 'AP, via ABC7 New York',
            caption:
              'The city response the permit paid for: NYPD "No Parking" signs going up at the barriers around Madison Square Garden ahead of the wedding weekend.',
            kind: 'primary',
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
      // Cross-links (ledger #1148): this newlywed sighting sits directly
      // downstream of the MSG wedding — the reverse links its siblings already
      // point at were missing. Threads back to the wedding itself, the gown, and
      // the engagement ring whose band it gave the first clear public look at.
      relatedIds: [
        'moment:vault-tloas-taylor-and-travis-marry-at-madison-square-garden',
        'moment:vault-tloas-the-wedding-gown-a-custom-dior-haute-couture-styled-by-josep',
        'moment:vault-tloas-the-ring-an-old-mine-diamond-from-a-goldsmith-taylor-already',
      ],
      title: "First sighting since the wedding: pink Markarian, at a friend's big day",
      snippet:
        'Eight days after their own Madison Square Garden wedding, Taylor and Travis showed up as guests at Kansas City teammate JuJu Smith-Schuster\'s wedding — Taylor in a pink Markarian gown, both of them visibly wearing their new rings.',
      sourceUrl: 'https://www.tmz.com/2026/07/10/taylor-swift-and-travis-kelce-seen-first-time-since-wedding/',
      thumbnailUrl: 'https://imagez.tmz.com/image/43/16by9/2026/07/11/435b7e695e334893923e269c987b46f6_xl.jpg',
      moment: {
        context:
          'Eight days after their July 3 wedding at Madison Square Garden, Taylor and Travis made their first public appearance as a married couple — not at a press event or a project of their own, but as guests at former Kansas City teammate JuJu Smith-Schuster\'s wedding to Laura Kruk, held July 10 at the Ritz-Carlton in Laguna Niguel, California.\n\nTaylor wore Markarian\'s strapless "Laila" gown — a $4,115 pink floral-brocade ball gown from the New York label (founded by designer Alexandra O\'Neill), its corset bodice flaring into a voluminous skirt — with her usual red lipstick, a Cartier Love bracelet, a pair of (already sold-out) Larkspur & Hawk "Posy" drop earrings and tortoiseshell Crap Eyewear sunglasses; Travis wore a double-breasted black suit. The couple were photographed holding hands on the way in — the first clear public look at both of their wedding bands, Taylor\'s set alongside her 10-carat old-mine-cut Kindred Lubeck engagement ring; the bands\' own designer and specifics went undisclosed. Smith-Schuster was Travis\'s teammate — alongside Patrick Mahomes — through the Chiefs\' Super Bowl LVII run and stayed close with the couple afterward; he and Kruk were among the roughly 1,000 guests at Taylor and Travis\'s own Madison Square Garden wedding a week earlier, making this something of a return trip.',
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
          // Added 2026-07-23 (ledger #1148): the gown provenance (Markarian's
          // $4,115 "Laila" brocade ball gown) and the full accessory list
          // (Cartier Love bracelet, sold-out Larkspur & Hawk earrings, shades).
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-markarian-floral-gown-wedding-dress-travis-kelce/',
            source_title: "Taylor Swift's Post-Wedding Style Era Starts With a Strapless Markarian Ball Gown Constructed From Floral Brocade",
            publisher: 'Marie Claire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-23',
            reliability_score: 4,
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
            // Focal point set 2026-07-18 (photo-enrichment run 7, #762) by viewing:
            // TMZ two-panel frame — Travis's face upper-left panel, Taylor's face
            // upper-right panel; both sit in the top quarter, so bias the crop high.
            focalPoint: '50% 22%',
          },
        ],
      },
    },
    {
      slug: 'i-knew-it-i-knew-you-oscar-buzz',
      // Cross-links (candidates #1059/#1290): the same song's other pages — the
      // Adult Contemporary four-in-the-top-10 record it co-holds, and its Pop
      // Airplay chart run — reverse links; the forward links already exist.
      relatedIds: [
        'moment:vault-tloas-four-songs-in-the-adult-contemporary-top-10-a-first-in-the-c',
        'moment:vault-tloas-one-shy-of-rihanna-i-knew-it-i-knew-you-takes-her-29th-pop-a',
      ],
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
          'Taylor\'s original song for Toy Story 5, "I Knew It, I Knew You" (co-written with Jack Antonoff), has become part of the real conversation around the 2027 Best Original Song Oscar race — not because of hype, but because of who\'s saying so. At the July 7 premiere for Disney\'s live-action Moana, Lin-Manuel Miranda — writer of "Along the Way," his own new song for that film, and a two-time Best Original Song nominee himself for animated Moana\'s "How Far I\'ll Go" — told PEOPLE, "I love Taylor, and I love that song. I thought her song for \'Toy Story 5\' was really fun," adding that when writing for a character, "you\'re not thinking about the Oscars... you\'re thinking, \'How on earth do I pull this off? How can it feel honest and true?\'"\n\nThe song has real momentum behind that praise: it topped the Billboard Hot 100 for two weeks running. None of that makes it a nominee — the Academy hasn\'t ruled on eligibility, nothing has been shortlisted, and the formal submission window hasn\'t closed. What\'s real right now is that two of the year\'s highest-profile original songs, both written for existing franchise characters rather than as standalone singles, are being talked about in the same breath — including by the person who\'d be competing against it.\n\nIt is the film\'s end-credit song, written from cowgirl Jessie\'s point of view — a character Swift has said she "adored" and dressed up as as a kid — and it doubled as a return to her country roots after years of pop. Released June 5, 2026 on Walt Disney Records and produced with Antonoff, it was recorded at Electric Lady Studios in New York and Tamarind Studios in Los Angeles. Swift has described writing and basic-tracking it in a single roughly eight-hour stretch: after an 11 a.m. screening of the finished film left her with "the songwriter zoomies," she went home, wrote the song, and by evening was playing it for Disney CEO Bob Iger — "one of the most fun days of my life." The official video, released the same day, is cut entirely from Toy Story footage tracing Jessie\'s own story: her meeting Woody, flashbacks to being outgrown by original owner Emily, and her present life with Bonnie.\n\nBeyond its two weeks at Hot 100 No. 1 (Swift\'s 15th chart-topper there), the song also opened at No. 1 on the Global 200, Hot Country Songs and, internationally, the UK, Australian, Canadian, German, Austrian and Belgian (Flanders) charts, reaching No. 2 in Ireland; it has been certified Silver in the UK. Critics singled out the song on its own merits — The Guardian\'s Laura Snapes called it "some of Swift\'s loveliest and tightest songwriting," and Rolling Stone described it as "blissful." It extends a run of Swift-written film songs going back to "Safe & Sound" (The Hunger Games, 2012) and including "Beautiful Ghosts" (Cats, 2019, Academy shortlisted) and "Carolina" (Where the Crawdads Sing, 2022, also shortlisted) — Swift has never landed an actual nomination despite four Golden Globe bids, but this is her first Oscar-eligible movie song to top the Hot 100, and every prior Toy Story film has produced a Best Original Song nominee, giving this one institutional precedent the earlier songs didn\'t have.',
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
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/I_Knew_It,_I_Knew_You',
            source_title: 'I Knew It, I Knew You',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-28',
            reliability_score: 2,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2026/music/news/taylor-swift-wrote-recorded-toy-story-song-eight-hours-1236785352/',
            source_title: "Taylor Swift Wrote and Recorded 'I Knew It, I Knew You' in 8 Hours Right After Watching 'Toy Story 5': 'One of the Most Fun Days of My Life'",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-28',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-finished-toy-story-5-song-hectic-8-hour-1236276419/',
            source_title: "Taylor Swift Finished 'Toy Story 5' Song in 'Hectic' 8-Hour Period",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-28',
            reliability_score: 4,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2026/07/27/taylor-swift-has-her-best-shot-at-an-oscar-nomination-thanks-to-toy-story-5/',
            source_title: "Taylor Swift Has Her Best Shot At An Oscar Nomination Thanks To 'Toy Story 5'",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-28',
            reliability_score: 4,
          },
        ],
        // Photo pass #762 run 9 (2026-07-18): page had zero photos. Official
        // music video id hDU4GB1PTxc verified via YouTube oEmbed against
        // @TaylorSwift this session ("Taylor Swift - I Knew It, I Knew You
        // (from Toy Story 5)"); 1280x720 maxres curl-verified 200 image/jpeg,
        // downloaded and viewed (a Jessie frame — the video is cut from Toy
        // Story film clips, per the announcement coverage).
        photos: [
          {
            url: 'https://i.ytimg.com/vi/hDU4GB1PTxc/maxresdefault.jpg',
            credit: 'Taylor Swift / Walt Disney Records (official "I Knew It, I Knew You" video thumbnail, YouTube)',
            caption:
              'The official video for "I Knew It, I Knew You," cut from Toy Story film clips with Jessie at its center.',
            kind: 'primary',
            // Jessie's face dead-center between the outstretched arms.
            focalPoint: '48% 35%',
          },
        ],
        // Rumor Desk 2026-07-20: the moment above holds the confirmed line
        // ("not a nominee, not yet"); this separates the labeled, forward-
        // looking awards *prediction* from it. Adjudicable — it resolves when
        // the Academy's shortlist and nominations land. No location.
        rumors: [
          {
            claim:
              'Awards writers began handicapping "I Knew It, I Knew You" as a genuine 2027 Best Original Song Oscar (and Grammy) contender — Billboard: it "could also be in line for an Oscar nomination for best original song," the first for both Swift and Antonoff.',
            reportedBy: 'Billboard (Paul Grein)',
            reportedOn: '2026-06-10',
            status: 'unconfirmed',
            url: 'https://www.billboard.com/music/awards/taylor-swift-jack-antonoff-toy-story-5-song-grammy-oscar-1236268865/',
            note: 'A forward-looking prediction, not a nomination: as of this report the Academy had not ruled on eligibility and nothing was shortlisted. Resolves with the shortlist and the January 2027 nominations.',
            sourceTier: 'established',
            lastCheckedOn: '2026-07-20',
          },
          {
            // Rumor Desk 2026-07-22 (news digest, The Tennessean via Yahoo): the
            // same song's country-awards trajectory — a parallel to the Oscar
            // prediction above, but a different awards body. Adjudicable: resolves
            // when the CMA nominees are announced. No location.
            claim:
              'With "I Knew It, I Knew You" up to No. 7 on Country Airplay, The Tennessean\'s Bryan West reported Swift\'s team was campaigning the Toy Story 5 ballad for CMA Single of the Year in the first round of CMA Awards voting — her most direct country-awards push in years, two decades after "Tim McGraw."',
            reportedBy: 'The Tennessean (Bryan West, via Yahoo)',
            reportedOn: '2026-07-21',
            status: 'unconfirmed',
            url: 'https://www.yahoo.com/entertainment/music/articles/taylor-swift-enters-cma-awards-170210895.html',
            note: 'A ballot campaign, not a nomination: the song sits on the preliminary CMA ballot, where members may nominate any eligible work. Resolves when the CMA nominees are announced — a Single of the Year nod confirms it, being passed over debunks it. Distinct from the Oscar-race prediction above (film awards vs. country awards).',
            sourceTier: 'established',
            lastCheckedOn: '2026-07-22',
          },
        ],
      },
    },
    {
      // Authored 2026-07-19 from intake #902. Filled a real gap: the ruling
      // landed July 6 but was never covered. Court-record outcome, so it
      // clears the privacy redlines (which ban legal ACCUSATIONS outside
      // court records — a dismissal ruling is the opposite).
      slug: 'showgirl-marasco-suit-dismissed',
      // moment: cross-links only (relatedIds resolve moment:/motif:/egg: —
      // not track: — so the "Down Bad"/"I Can Do It With a Broken Heart" track
      // pages the ledger named can't be linked here without rendering dead;
      // the wedding it bookends and the Vault's other Swift lawsuit can.
      relatedIds: [
        'moment:vault-tloas-taylor-and-travis-marry-at-madison-square-garden',
        'moment:vault-evermore-evermore-vs-evermore-the-theme-park-lawsuit-that-ended-in-a-',
      ],
      year: 2026,
      month: 7,
      day: 6,
      category: 'business',
      title: 'A federal judge throws out the Tortured Poets plagiarism suit — with prejudice',
      snippet:
        'Three days after the wedding, Judge Aileen Cannon dismissed Florida poet Kimberly Marasco\'s copyright case with prejudice, finding her poems held no protectable expression and that copying was never plausibly pleaded.',
      sourceUrl: 'https://www.cbc.ca/news/entertainment/swift-poet-plagiarism-lawsuit-9.7261092',
      thumbnailUrl: null,
      moment: {
        context:
          'Three days after the Madison Square Garden wedding, a case that had run since 2024 ended in a single order. Kimberly Marasco, a Florida poet acting pro se, first sued in April 2024 — a $100 small-claims filing in St. Lucie County (No. 2024SC001385) that was removed to federal court (S.D. Fla., No. 2:24-cv-14153, before Judge Aileen Cannon) and amended by that October to demand more than $7 million. It was not her first attempt: the operative complaint, Cannon noted, closely mirrored an earlier one Marasco had already lost. On July 6, 2026 the judge dismissed it — this time with prejudice, so it cannot be amended and refiled — against Taylor, producers Jack Antonoff and Aaron Dessner, Republic Records and Universal Music Group.\n\nMarasco claimed more than a dozen songs borrowed from her poetry — "Down Bad" and "I Can Do It With a Broken Heart" from The Tortured Poets Department, but also "The Man," "The Great War" and "Invisible String," reaching back across Midnights, folklore and evermore (the Dessner records, which is why he was named). Cannon\'s order weighed not whether the songs resembled the poems but whether there was anything there to copy: she concluded "that Plaintiff\'s poems do not contain protectable expression and that, regardless, Plaintiff has failed to plausibly plead copying," the alleged overlaps being "quintessential themes, concepts and isolated words" copyright does not protect. The order also noted Marasco\'s concession that one of her books had sold roughly 3,000 copies worldwide, none actively promoted — the access problem underneath the legal one.\n\nMarasco moved fast: she told ABC News she had filed a notice of appeal to the Eleventh Circuit on July 7 — the day after the order — so the docket is not fully closed even now. Swift\'s representatives, as after most of these filings, declined to comment on the win, and none of the co-defendants issued a statement. But at the district level the case is over — the quietest possible bookend to the loudest week of her year.',
        sources: [
          {
            outlet: 'CBC News',
            url: 'https://www.cbc.ca/news/entertainment/swift-poet-plagiarism-lawsuit-9.7261092',
            source_title: "Judge sides with Taylor Swift in Florida poet's plagiarism lawsuit",
            publisher: 'CBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-19',
            reliability_score: 4,
          },
          {
            outlet: 'TheWrap',
            url: 'https://www.thewrap.com/industry-news/public-policy-legal/taylor-swift-plagiarism-lawsuit-florida-poet-win/',
            source_title: 'Taylor Swift Wins Plagiarism Lawsuit Against Florida Poet',
            publisher: 'TheWrap',
            source_type: 'reputable_press',
            accessed_at: '2026-07-19',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2026/music/news/taylor-swift-wins-plagiarism-poet-lawsuit-florida-judge-1236802619/',
            source_title: "Taylor Swift Prevails in Poet's Plagiarism Lawsuit, as Florida Judge Dismisses Case With Prejudice",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-19',
            reliability_score: 4,
          },
          {
            outlet: 'ABC News',
            url: 'https://abcnews.com/GMA/Culture/judge-dismisses-poets-copyright-infringement-lawsuit-taylor-swift/story?id=134546988',
            source_title: "Judge dismisses poet's copyright infringement lawsuit against Taylor Swift",
            publisher: 'ABC News (Good Morning America)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            // Primary court record: confirms the S.D. Fla. docket (2:24-cv-14153),
            // the pro-se removal, and the "no protectable expression" holding.
            outlet: 'U.S. Courts (govinfo)',
            url: 'https://www.govinfo.gov/content/pkg/USCOURTS-flsd-2_24-cv-14153/pdf/USCOURTS-flsd-2_24-cv-14153-0.pdf',
            source_title: 'Marasco v. Taylor Swift Productions, Inc., No. 2:24-cv-14153 (S.D. Fla.)',
            publisher: 'United States District Court, Southern District of Florida',
            source_type: 'official',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
        ],
        // No photo: there is no photography of this order, and a stand-in
        // portrait would add nothing a caption could honestly justify.
        photos: [],
      },
    },
    {
      // Authored 2026-07-20 from intake #909. The newest post in the Vault had
      // been 2026-07-10 for nine days; this is the item that moves it.
      //
      // Two framing traps, both recorded on the ticket. First, the record is
      // "excluding seasonal music" — without that qualifier the claim is simply
      // false, since Bublé did it first. Second, my own intake wrongly said all
      // four songs were from this album; Billboard says "I Knew It, I Knew You"
      // is from the Toy Story 5 soundtrack, so the tidy single-album angle does
      // not exist and is not written here.
      slug: 'showgirl-adult-contemporary-four-top-tens',
      year: 2026,
      month: 7,
      day: 18,
      category: 'music',
      // Cross-link deficit closed (2026-07-22, depth ledger #1058): this hub page
      // is about four specific songs but carried ZERO relatedIds — thread it to
      // each of the four that made the record (Nos. 7/8/9/10 that week).
      relatedIds: [
        'moment:vault-tloas-the-fate-of-ophelia-hamlets-drowned-girl-rescued-and-a-13th-',
        'moment:vault-tloas-opalite-follows-ophelia-to-no-1',
        'moment:vault-tloas-i-knew-it-i-knew-you-enters-the-oscar-conversation-not-a-nom',
        'moment:vault-tloas-elizabeth-taylor-the-first-song-she-wrote-for-the-album',
        // Cross-link (candidate #1291): the Pop Airplay top-10 that helped set the record.
        'moment:vault-tloas-one-shy-of-rihanna-i-knew-it-i-knew-you-takes-her-29th-pop-a',
      ],
      title: 'Four songs in the Adult Contemporary top 10 — a first in the chart’s 65 years',
      snippet:
        'On the July 18 chart Taylor held Nos. 7, 8, 9 and 10 on Billboard’s Adult Contemporary ranking — the first artist ever to take four of the top 10 in a single week with music that isn’t seasonal.',
      sourceUrl:
        'https://www.billboard.com/music/chart-beat/taylor-swift-adult-contemporary-4-in-top-10-1236291740/',
      thumbnailUrl: null,
      moment: {
        context:
          'Billboard’s Adult Contemporary chart has been published continuously since the issue dated July 17, 1961. On the chart dated July 18, 2026 — sixty-five years and a day later — Taylor took four of its top 10 at once: "The Fate of Ophelia" at No. 7, "Opalite" at No. 8, "I Knew It, I Knew You" holding at its No. 9 peak, and "Elizabeth Taylor" at No. 10.\n\nNo artist had done that before with music that isn’t seasonal, and the qualifier is the whole record rather than a technicality. Michael Bublé got there first, across three weeks of the 2011 holidays — two weeks with four songs in the top 10 and one with five, No. 1 included — but every one of them came off his Christmas album, which is a format that behaves like nothing else on the chart. Strip the tinsel out and the top of Adult Contemporary had never belonged to one artist four times over until this week.\n\nThe four are not all from one record, which is the quietly interesting part. "The Fate of Ophelia," "Opalite" and "Elizabeth Taylor" come from The Life of a Showgirl; "I Knew It, I Knew You" is from the Toy Story 5 soundtrack. Adult Contemporary is a slow chart by design — songs climb it over months and stay — so a week like this is less a launch than an accumulation, the sound of four separate releases all still working at once.\n\nIt brings her to 23 top 10s on the ranking, nine of them No. 1s. That is the most of any act active on Adult Contemporary since her own first appearance in March 2008 — ahead of Bublé’s 19 and Kelly Clarkson’s 15 over that span — but well short of the all-time leaders, where Elton John holds the record with 42 top 10s (18 of them No. 1s), ahead of Neil Diamond’s 38 and Barbra Streisand’s 35; John also owns the most AC No. 1s at 18, with Celine Dion’s 11 the female mark. And for all four landing at once, none has topped Adult Contemporary itself: "The Fate of Ophelia" peaked at No. 2 in March and "Opalite" at No. 4 in May, while "I Knew It, I Knew You" and "Elizabeth Taylor" held this week’s Nos. 9 and 10.\n\nThe four reached Adult Contemporary at very different times, which is what made the convergence possible. "The Fate of Ophelia" debuted in October 2025 and "Opalite" in November — long-haul climbers 40 and 36 weeks deep by this chart — while "Elizabeth Taylor" entered in March 2026 and "I Knew It, I Knew You" debuted straight into the top 10 at No. 9 in June, a level no earlier Taylor soundtrack single had reached (her prior best, "I Don’t Wanna Live Forever," stalled at No. 16), though Billboard didn’t frame it as a first. The week turned on "Elizabeth Taylor," the biggest gainer, rising from No. 14 to complete the set at No. 10 as "The Fate of Ophelia" slipped off its peak. And it held: on the next chart, dated July 25, all four moved up a spot together to Nos. 6–9 — new peaks for "I Knew It, I Knew You" (No. 8) and "Elizabeth Taylor" (No. 9) — without growing to five or breaking apart, and with none yet threatening Alex Warren’s long-running No. 1, "Ordinary."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-adult-contemporary-4-in-top-10-1236291740/',
            source_title:
              'Taylor Swift Scores an Adult Contemporary Chart First With 4 Songs in the Top 10',
            publisher: 'Billboard',
            // Billboard publishes the chart itself, so on a chart fact it is
            // the primary source and outranks secondary coverage of it.
            source_type: 'official',
            accessed_at: '2026-07-20',
            reliability_score: 5,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2026/07/18/taylor-swift-manages-a-historic-first-on-the-charts/',
            source_title: 'Taylor Swift Manages A Historic First On The Charts',
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-20',
            reliability_score: 4,
          },
          // Depth ledger #1058 Q2 (2026-07-22): the all-time AC yardstick her
          // 23 top 10s are measured against — Elton John's record 42 (18 No. 1s),
          // Neil Diamond 38, Barbra Streisand 35.
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/elton-john-cold-heart-40th-adult-contemporary-chart-top-10/',
            source_title: "Elton John Notches Record-Extending 40th Adult Contemporary Top 10 With Dua Lipa Collab 'Cold Heart'",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 5,
          },
          {
            outlet: 'Guinness World Records',
            url: 'https://www.guinnessworldrecords.com/world-records/602412-most-top-10-entries-on-us-adult-contemporary-chart',
            source_title: 'Most Top 10 entries on US Adult Contemporary chart',
            publisher: 'Guinness World Records',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 4,
          },
          // Added 2026-07-24 (ledger #1058): each song's AC peak and debut/weeks
          // detail (Q1/Q4) and the July 25 follow-through (Q6) from the chart's
          // own per-entry data; the AC No. 1 leaderboard (Q2) from the AC list.
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/charts/adult-contemporary/',
            source_title: 'Adult Contemporary — chart dated July 25, 2026 (per-entry debut/peak/weeks/last-week detail)',
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/List_of_artists_who_reached_number_one_on_the_U.S._Adult_Contemporary_chart',
            source_title: 'List of artists who reached number one on the U.S. Adult Contemporary chart',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
        ],
        // No photo: a chart week has no photography of its own, and dropping in
        // an unrelated performance shot would illustrate nothing that happened
        // here. Same call as the Marasco ruling above.
        photos: [],
      },
    },
    {
      // Authored 2026-07-20 from intake #920. Awards milestone, clears the bar
      // on its own (one outlet needed; two verified here — Rolling Stone and the
      // Television Academy's own database). Two facts checked against the primary
      // record before writing: (1) Rolling Stone's exact language is "first nods
      // ... in more than a decade," so it is framed as first NOMINATIONS, not
      // first Emmy — the Television Academy shows she already WON in 2015, in
      // interactive media, so "first Emmy" would be false. (2) The Academy lists
      // the 2026 entry under her personal bio as "Produced by/Performer,"
      // confirming the nods attach to her personally. Unverified ticket details
      // (a Dec 12 2025 Disney+ premiere date, a Sept 14 2026 ceremony date/
      // network) were cut rather than guessed. Passes the privacy redlines
      // cleanly: her own public professional honor, no third parties.
      slug: 'showgirl-eras-tour-film-emmy-nominations',
      year: 2026,
      month: 7,
      day: 8,
      category: 'music',
      title: 'The Eras Tour film pulls five Emmy nominations — her first nods in over a decade',
      snippet:
        'Taylor Swift: The Eras Tour: The Final Show drew five nominations at the 78th Emmys, announced July 8, 2026 — Taylor’s first Emmy nods in more than a decade. Credited as both performer and producer on the concert film, the nominations land on her personally.',
      sourceUrl:
        'https://www.rollingstone.com/music/music-news/taylor-swift-2026-emmy-nominations-eras-tour-final-show-1235590955/',
      thumbnailUrl: null,
      significance: 'notable', // a real award milestone — first Emmy nominations in 10+ years, on the record-breaking Eras Tour (docs/decisions.md, 2026-07-18)
      // Cross-links added 2026-07-24 (correction ledger #1275, Q6): the awards
      // page now threads back to the film it honors and the docuseries it
      // premiered beside, so a reader can follow the arc release -> awards.
      relatedIds: [
        'moment:vault-tloas-the-final-show-the-full-vancouver-closer-streaming-at-last',
        'moment:vault-tloas-the-end-of-an-era-the-eras-tour-docuseries-lands-on-disney',
      ],
      moment: {
        context:
          'The concert film of the Eras Tour’s final night — Taylor Swift: The Eras Tour: The Final Show, which streamed on Disney+ — landed five nominations when the 78th Emmy nominations were announced on July 8, 2026: Outstanding Variety Special (Pre-Recorded), a directing nod for Glenn Weiss, Outstanding Picture Editing for Variety Programming, Outstanding Sound Mixing for a Variety Series or Special, and Outstanding Technical Direction and Camerawork for a Special.\n\nTaylor is credited on the special as both performer and producer — Taylor Swift Productions made it, in association with Silent House — so the nominations attach to her personally, and they are her first Emmy nominations in more than a decade. They are not her first Emmy outright: back in 2015 she won Outstanding Creative Achievement in Interactive Media for the AMEX Unstaged: Taylor Swift Experience, the 360-degree app built around the "Blank Space" video, as its artist and executive producer. What is new this time is the Television Academy recognizing her on-camera performing work — and it is the film of the record-breaking Eras Tour that got her there.\n\nOnly the Variety Special nod rides the primetime telecast; the other four — directing, picture editing, sound mixing, and technical direction and camerawork — are Creative Arts Emmys, handed out at the separate Creative Arts ceremony on Sept. 5-6, 2026, ahead of the main show on Sept. 14 (NBC and Peacock, hosted by Mariska Hargitay). Director Glenn Weiss, a veteran of the Oscars and Tony telecasts, was double-nominated in that directing category — also cited for the 78th Tony Awards. The special captures the tour\'s final night at Vancouver\'s BC Place in December 2025, a roughly three-and-a-half-hour, 45-song set that runs the entire Tortured Poets Department; its eligibility turned on format, where the 2023 Eras Tour concert film was a theatrical release and this Disney+ streaming special qualified as television.\n\nFive nominations is a heavy haul for a concert special — just shy of the six that Beyoncé\'s "Homecoming" drew in 2019, the modern benchmark for the form. That Netflix film competed in the same Variety Special (Pre-Recorded) race and was shut out at the Creative Arts ceremony, winning none of its six, a reminder that the nod is the achievement and the trophy is a separate question the Sept. 2026 ceremonies will settle. In the Variety Special (Pre-Recorded) category The Final Show is up against "Wicked: One Wonderful Night" (NBC), "Dave Chappelle: The Unstoppable…," Hulu\'s "Nikki Glaser: Good Girl," and a Muppet Show special — a field of purpose-built comedy and event television. Silent House, the firm sharing the production credit with Taylor Swift Productions, is the live-design company founded by Baz Halpin in 2010 that staged the Eras Tour itself, so the people who built the show also made its film.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-2026-emmy-nominations-eras-tour-final-show-1235590955/',
            source_title: "Taylor Swift Scores 2026 Emmy Nominations for 'Eras Tour: The Final Show'",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-20',
            reliability_score: 4,
          },
          {
            outlet: 'Television Academy',
            url: 'https://www.televisionacademy.com/bios/taylor-swift',
            source_title: 'Taylor Swift — Emmy Awards and Nominations',
            publisher: 'Television Academy',
            source_type: 'official',
            accessed_at: '2026-07-20',
            reliability_score: 5,
          },
          // Depth ledger #1034 (2026-07-21): the Creative-Arts/primetime split,
          // ceremony dates, producer credits, and Weiss's double nomination.
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/tv/tv-news/taylor-swift-2026-emmy-nominations-1236641549/',
            source_title: "Taylor Swift's 'The Eras Tour: The Final Show' Lands 5 Emmy Noms",
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          // Depth 2026-07-24 (#1034 Q7 / #1275 Q3): the concert-special
          // benchmark — Homecoming's six 2019 noms and its Creative-Arts shutout.
          {
            outlet: 'Variety',
            url: 'https://variety.com/2019/music/news/beyonce-emmy-nominations-homecoming-1203268823/',
            source_title: "Emmy Queen Bey? Beyonce's 'Homecoming' Lands Six Nominations",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          // Depth 2026-07-24 (#1034 Q5): the full Variety Special (Pre-Recorded)
          // field the Final Show competes in at the 78th Emmys — authoritative.
          {
            outlet: 'Television Academy',
            url: 'https://www.televisionacademy.com/awards/nominees-winners/2026/outstanding-variety-special-pre-recorded',
            source_title: 'Outstanding Variety Special (Pre-Recorded) — 2026 Nominees',
            publisher: 'Television Academy',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          // Depth 2026-07-24 (#1034 Q6): Silent House, Baz Halpin's live-design
          // firm (founded 2010) that shares the special's production credit.
          {
            outlet: 'Variety',
            url: 'https://variety.com/2019/music/news/silent-house-tour-producers-1203349554/',
            source_title: 'Silent House, Pink and Taylor Swift Tour Producer, Turns 10 in Style',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          // Merged 2026-07-24 (correction ledger #1275): corroboration carried
          // over from the deleted duplicate `showgirl-emmy-nomination-eras-final-show`.
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
        // Photos merged 2026-07-24 from the deleted duplicate moment
        // `showgirl-emmy-nomination-eras-final-show` (correction ledger #1275):
        // both are verified tour photos, not the nominations event itself, so
        // captions keep them generic to the Eras Tour that earned the nods.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Taylor_Swift_The_Eras_Tour_Lover_Set_%2853108817342%29.jpg',
            credit: 'Paolo V, CC BY 2.0, via Wikimedia Commons',
            caption:
              'The Eras Tour\'s Lover set at SoFi Stadium, August 2023 — the show whose filmed Vancouver finale earned the five nominations.',
            kind: 'archival',
            // Wide panorama, Taylor small in the left third against a dark bowl.
            focalPoint: '34% 40%',
          },
          {
            url: 'https://www.hollywoodreporter.com/wp-content/uploads/2026/07/GettyImages-2166917001.jpg?w=1440&h=810&crop=1',
            credit: 'Getty Images, via The Hollywood Reporter',
            caption:
              'Mid-show on the Eras Tour, arm raised against the billowing Lover-set backdrop — the image THR ran with news of the five nominations.',
            kind: 'archival',
            // Taylor centered, face just above the vertical midline.
            focalPoint: '50% 36%',
          },
        ],
      },
    },
    {
      // Authored 2026-07-20 from intake #903. Public philanthropy — clears the
      // two-outlet bar for business items (Billboard + RTTNews, independent),
      // and the privacy redlines cleanly (a public charitable act, city-level
      // only, Kelce in his public foundation role). No dollar figure was
      // disclosed by any outlet, so none is written here — the size of the
      // gift is cut rather than guessed. Month-precision on purpose: the
      // donation's exact date isn't public; Billboard reported it Dec 30, 2025.
      slug: 'showgirl-operation-breakthrough-holiday-donation',
      year: 2025,
      month: 12,
      category: 'business',
      title: 'A quiet holiday gift to a Kansas City classroom',
      snippet:
        'Over the 2025 holidays Taylor donated to Operation Breakthrough, a Kansas City nonprofit that educates and cares for children in poverty. The charity thanked her publicly, crediting her for “championing creativity, education, and opportunity” for its 750-plus students. No amount was announced.',
      sourceUrl:
        'https://www.billboard.com/music/pop/taylor-swift-operation-breakthrough-kansas-city-donation-1236147218/',
      thumbnailUrl: null,
      moment: {
        context:
          'Operation Breakthrough runs an early-education and family-support center in Kansas City, describing its mission as giving children in poverty a “safe, loving and educational environment” while backing their families through advocacy and emergency aid. Over the 2025 holidays, Taylor made a donation to it — the kind of low-key giving she has folded into her time in Kansas City since her relationship with Travis Kelce became public in 2023. The institution behind the thank-you note is a Kansas City fixture: founded in 1971 by two Catholic nuns, Sisters Corita Bussanmas and Berta Sailer, as day care for the children of the working poor, it began with 50 kids at 31st and Paseo and now cares for more than 700 children each weekday from its center at 31st and Troost. Fox4KC framed the December 2025 gift as "another" to the charity — a repeat rather than a first-time gesture — though the size of any earlier gift wasn\'t put on the record.\n\nThe organization made the gift public itself, thanking her on Instagram: “Thank you @taylorswift for supporting Operation Breakthrough. We are so grateful for your kindness and for championing creativity, education, and opportunity for our over 750 students.” Neither Billboard nor the follow-up coverage put a dollar figure on it, and none was announced — what is on the record is the act and the charity’s thanks, not the size of the check.\n\nThe nonprofit is one Kelce already works with: his Eighty-Seven & Running foundation funds its Ignition Lab, a STEM program for teenagers. Taylor’s gift read as her own gesture toward the same cause — one thread in a broader December 2025 run of giving rather than a headline she went looking for. That season she gave $1 million each to the American Heart Association and Feeding America before Christmas, and — reported the same week as the Operation Breakthrough gift — supported Nashville’s Monroe Carell Jr. Children’s Hospital at Vanderbilt (including its Adolescent and Young Adult Cancer Program), alongside MusiCares, the CMA Foundation and ACM Lifting Lives; on Christmas Day she was reported tipping Arrowhead Stadium staff in cash. The Kansas City classroom was one stop on a two-city sweep.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-operation-breakthrough-kansas-city-donation-1236147218/',
            source_title: 'Taylor Swift Donates to Kansas City Charity Operation Breakthrough',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-20',
            reliability_score: 4,
          },
          {
            outlet: 'RTTNews',
            url: 'https://www.rttnews.com/3607470/taylor-swift-makes-donation-to-kansas-city-charity-operation-breakthrough.aspx',
            source_title: 'Taylor Swift Makes Donation To Kansas City Charity Operation Breakthrough',
            publisher: 'RTTNews',
            source_type: 'reputable_press',
            accessed_at: '2026-07-20',
            reliability_score: 3,
          },
          // Ledger #1104 Q3 (2026-07-27): Operation Breakthrough's own founding
          // story — 1971, Sisters Corita Bussanmas & Berta Sailer, 700+ kids.
          {
            outlet: 'KCUR',
            url: 'https://www.kcur.org/news/2021-03-27/sister-corita-co-founder-of-operation-breakthrough-and-mom-to-more-than-70-foster-children-dies-at-87',
            source_title: "Sister Corita, Co-Founder Of Operation Breakthrough and 'Mom' To More Than 70 Foster Children, Dies At 87",
            publisher: 'KCUR (NPR Kansas City)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-27',
            reliability_score: 4,
          },
          // Ledger #1104 Q1 (2026-07-27): the other threads in the season —
          // $1M each to AHA and Feeding America, the Nashville hospital gift,
          // MusiCares/CMA Foundation/ACM Lifting Lives, the Arrowhead tips.
          {
            outlet: 'Mix 92.9 (ABC Audio)',
            url: 'https://mix929.com/2025/12/30/taylor-swift-donates-to-kansas-city-charity-operation-breakthrough/',
            source_title: 'Taylor Swift donates to Kansas City charity Operation Breakthrough',
            publisher: 'ABC Audio',
            source_type: 'reputable_press',
            accessed_at: '2026-07-27',
            reliability_score: 3,
          },
          {
            outlet: 'AOL / People',
            url: 'https://www.aol.com/articles/taylor-swift-helps-children-both-223803227.html',
            source_title: "Taylor Swift Helps Children in Both Nashville and Kansas City with Her Latest Run of Holiday Donations: 'Spreading Joy'",
            publisher: 'People (via AOL)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-27',
            reliability_score: 4,
          },
        ],
        // No photo: a private donation has no photography of its own, and the
        // charity's own thank-you post isn't the event — a stand-in shot would
        // illustrate nothing that happened. Same call as the chart items above.
        photos: [],
      },
    },
    {
      // Authored 2026-07-21 from intake #1133. Chart/professional item, one
      // established outlet sufficient (Forbes); the No. 9 / 29th-top-10 /
      // "one shy of Rihanna's 30" facts were independently corroborated before
      // writing. Two framing checks: (1) this is Pop Airplay TOP 10s, a
      // different record from the Hot 100 NO. 1s where the Opalite item already
      // has her "tying Rihanna" at 14 — kept distinct here, format named
      // explicitly. (2) The song is the Toy Story 5 original, not a Showgirl
      // track (the same correction recorded on #909). The Forbes "most No. 1s
      // in the chart's history" line is written as-reported without pinning the
      // exact count, which the intake transcribed but independent sources here
      // did not confirm. Passes the privacy redlines cleanly: her own chart
      // record, no third parties, no location or private-life detail.
      slug: 'i-knew-it-i-knew-you-pop-airplay-top-ten',
      // Cross-link (candidate #1291): the four-in-the-AC-top-10 record it feeds.
      // Cross-link (candidate #1290): the same song's Oscar-buzz page.
      relatedIds: [
        'moment:vault-tloas-four-songs-in-the-adult-contemporary-top-10-a-first-in-the-c',
        'moment:vault-tloas-i-knew-it-i-knew-you-enters-the-oscar-conversation-not-a-nom',
      ],
      year: 2026,
      month: 7,
      day: 20,
      category: 'music',
      title: 'One shy of Rihanna: “I Knew It, I Knew You” takes her 29th Pop Airplay top 10',
      snippet:
        'On the Pop Airplay chart dated July 20, Taylor’s Toy Story 5 song climbs to No. 9 — her 29th top 10 on the tally. That leaves her one behind Rihanna’s all-time record of 30, the most anyone has pushed into that region of pop radio.',
      sourceUrl:
        'https://www.forbes.com/sites/hughmcintyre/2026/07/20/taylor-swift-nearly-ties-one-of-rihannas-greatest-chart-records/',
      thumbnailUrl: null,
      moment: {
        context:
          'Billboard’s Pop Airplay chart tracks spins at pop radio, and it is a slow, crowded format — a song has to be worked for months to reach the top. It debuted around No. 20 on the chart dated June 20, 2026, and roughly five weeks later, on the chart dated July 20, “I Knew It, I Knew You” climbed 12–9 into the top 10 — Taylor’s 29th career top 10 there, nearly two decades after she first appeared on the tally. It edged one place higher, to No. 8, the following week.\n\nThat number is the whole story. Only Rihanna has ever gathered more: her 30 Pop Airplay top 10s are the all-time record, and Taylor sits exactly one behind it — as of these charts she had not yet added a 30th to tie it. She already owns the format’s other headline mark, the most No. 1s in its history: she first broke that record in July 2023 and extended it to fifteen with “Opalite” on the chart dated Feb. 28, 2026. So Rihanna’s top-10 count is one of the few Pop Airplay lines she hasn’t already claimed for herself.\n\nThe song keeps refusing the tidy version of the story. It isn’t a Showgirl track: “I Knew It, I Knew You” is her original for the Toy Story 5 soundtrack, co-written and produced with Jack Antonoff, and it has crossed every format that matters — a No. 1 Hot 100 debut, a top-10 Country Airplay entry, four simultaneous Adult Contemporary top 10s the week before, and now the edge of a Pop Airplay record. A movie song built for an animated character, out-charting most artists’ actual singles.\n\nThe origin explains the oddity. Pixar approached her in 2025 for a Toy Story 5 original; she was initially uninterested, until a letter from producer Jessica Choi about the film’s female-centered story won her over. She asked to watch the film in February 2026, and — hit with what she called the “songwriter zoomies” — wrote, produced and recorded it with Antonoff inside about eight hours of the screening. It’s Jessie the cowgirl’s song, playing over the closing credits; director Andrew Stanton said it fit “like a long-lost family member,” and Pixar cut a decoy version of the film without it to keep the surprise. Walt Disney Records issued it as a single on June 5, 2026; Antonoff played nine of its fourteen instruments, and it was cut at Electric Lady Studios in New York. Critics treated it as more than a soundtrack obligation — The Guardian called it her best song in years — and by midsummer it had entered the Academy Award for Best Original Song conversation.',
        sources: [
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2026/07/20/taylor-swift-nearly-ties-one-of-rihannas-greatest-chart-records/',
            source_title: 'Taylor Swift Nearly Ties One Of Rihanna’s Greatest Chart Records',
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            // Primary: the underlying Billboard Pop Airplay chart dated
            // 2026-07-20. Cited to the dated chart rather than the live URL,
            // which rolls over weekly and stops showing this ranking.
            outlet: 'Billboard',
            url: 'https://www.billboard.com/charts/pop-songs/',
            source_title: 'Pop Airplay — chart dated July 20, 2026',
            publisher: 'Billboard',
            source_type: 'official',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
          // Added 2026-07-24 (ledger #1289): the song's Toy Story 5 origin and
          // credits (Q2/Q3), the pinned 15-No.1 Pop Airplay record (Q4), and
          // the critical reception (Q6).
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/culture/tv-film/taylor-swift-toy-story-5-original-song-knew-it-knew-you-1236261432/',
            source_title: "Taylor Swift Pens 'Toy Story 5' Original Song 'I Knew It, I Knew You'",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-finished-toy-story-5-song-hectic-8-hour-1236276419/',
            source_title: "Taylor Swift Says She Got the 'Songwriter Zoomies' & Finished Toy Story 5 Song in 8 Hours",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-opalite-number-1-pop-airplay-chart-1236183278/',
            source_title: "Taylor Swift Dances to Her Record-Extending 15th Pop Airplay Chart No. 1 With 'Opalite'",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'The Guardian',
            url: 'https://www.theguardian.com/music/2026/jun/05/taylor-swift-i-knew-it-i-knew-you-review-toy-story-5',
            source_title: "Taylor Swift: 'I Knew It, I Knew You' review — song for Toy Story cowgirl Jessie is Swift's best in years",
            publisher: 'Guardian News & Media',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-toy-story-5-i-knew-it-i-knew-you-song-1235571671/',
            source_title: 'Taylor Swift Gives Jessie Her Flowers on Heartfelt Toy Story 5 Song',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
        ],
        // No photo: a chart week has no photography of its own; a stand-in
        // performance shot would illustrate nothing that happened here. Same
        // call as the Adult Contemporary and Marasco items above.
        photos: [],
        // Rumor Desk 2026-07-22 (news digest): the song's cross-format success —
        // including the top-10 Country Airplay entry noted above — has revived
        // reporting that a full country album may follow. A forward-looking,
        // unannounced-music claim (explicitly allowed by the redlines), adjudicable
        // because it resolves on an announcement or fades if the window passes
        // empty. No location.
        rumors: [
          {
            claim:
              'Off the back of "I Knew It, I Knew You" landing on country radio, Rolling Stone laid out "all the signs" that Swift could make a full return to country — a new country album — citing her pre-release meetings with country radio programmers, the Toy Story 5 single, and her self-titled debut turning 20 in October 2026, while stressing nothing was confirmed.',
            reportedBy: 'Rolling Stone (Jon Blistein)',
            reportedOn: '2026-06-29',
            status: 'unconfirmed',
            url: 'https://www.rollingstone.com/music/music-features/taylor-swift-make-country-music-again-signs-1235586149/',
            note: 'Speculation, not an announcement: Rolling Stone frames a country album as a possibility ("Fingers crossed"), not a plan — Swift\'s team has confirmed no such project. Resolves if a country album is announced, and fades if the country moment passes without one. Distinct from the debut "Taylor\'s Version" re-record rumor on the debut page (a new album vs. a re-recording of the 2006 debut).',
            sourceTier: 'established',
            lastCheckedOn: '2026-07-22',
          },
        ],
      },
    },
    {
      // Authored 2026-07-21 from intake #1134. Softer catalog-movement item, not
      // a milestone, but confirmed chart fact (Official Charts Company, reported
      // by Forbes). One established outlet suffices for a chart item; the TTPD
      // re-entry at No. 96 and the Fearless (TV) No. 19 -> No. 13 / 274-weeks
      // facts were independently corroborated before writing. The causal read
      // ("the wedding drove it") is Forbes's editorial framing and is attributed
      // to Forbes rather than stated flatly. Distinct from the msg-wedding item:
      // this is a downstream chart consequence, not a re-file of the wedding.
      // Passes the privacy redlines cleanly: professional chart facts; the
      // wedding is referenced only as the reported cause (a public, already-
      // covered event at venue level), no new private-life or location detail.
      slug: 'showgirl-wedding-uk-chart-bump',
      // Cross-link (candidate #1349): the wedding week that drove this chart bump.
      // Cross-link (2026-07-28, intake #1591): the next chart frame, where the
      // same singles keep returning to the UK tallies.
      relatedIds: [
        'moment:vault-tloas-taylor-and-travis-marry-at-madison-square-garden',
        'moment:vault-tloas-elizabeth-taylor-and-opalite-return-to-the-uk-charts',
      ],
      year: 2026,
      month: 7,
      day: 16,
      category: 'music',
      title: 'The wedding week nudges the whole catalog back up the UK charts',
      snippet:
        'The week after the Madison Square Garden wedding, the attention spike showed up on Britain’s charts: per Forbes, The Life of a Showgirl and The Tortured Poets Department both re-entered the Official Albums tallies, “Opalite” returned to the singles rankings, and Fearless (Taylor’s Version) climbed to No. 13 on the country chart.',
      sourceUrl:
        'https://www.forbes.com/sites/hughmcintyre/2026/07/16/taylor-swifts-wedding-helps-her-soar-up-the-charts/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Madison Square Garden wedding on July 3 was the most-covered week of Taylor’s year, and by the reckoning of Britain’s Official Charts Company the coverage moved records. In the week that followed, Forbes tallied a catalog-wide bump across several UK charts.\n\nTwo albums came back from off the tally entirely. The Life of a Showgirl and The Tortured Poets Department both re-entered the Official Albums and Official Albums Streaming charts, TTPD returning at No. 96 on both. “Opalite,” the Showgirl single, returned to the Official Singles Downloads and Official Singles Sales rankings. And Fearless (Taylor’s Version), her 2021 re-recording, stepped up from No. 19 to No. 13 on the Official Country Artists Albums chart — a tally it has now appeared on for 274 weeks, better than five straight years.\n\nThe causal read — that the wedding itself drove the climb — is Forbes’s, not a chart-company statement; what the Official Charts Company documents is the movement, not the reason for it. But the timing is hard to miss. It’s the ordinary mechanism of a very unordinary week: a private celebration pulls a decade-old re-recording and a pair of already-huge albums back up a national chart, on attention alone.\n\nThe precise re-entry positions Forbes\'s own chart-week snapshot gives: Showgirl came back at No. 57 on the Official Albums Chart (up from No. 61 the week before) and No. 59 on the Official Albums Streaming Chart (up from No. 65). "Opalite" landed at No. 93 on the main Official Singles Chart, and at No. 85 on the Singles Downloads component and No. 92 on Singles Sales — so it re-entered the actual Top 100, not only the smaller downloads/sales sub-tallies. No parallel US Billboard bump the same week is documented in the available reporting; the movement, as covered, was specifically a UK-charts story. Beyond the four titles named, Forbes\'s piece doesn\'t report any other catalog release (1989 (Taylor\'s Version), Midnights, Lover, evermore) moving that week, and no week-over-week streaming or sales figures are given — the story, as reported, is entirely about chart position, not underlying volume. On the Fearless (Taylor\'s Version) longevity note: 274 weeks made it, at the time, the first Swift release to reach four full years on the UK Country Artists Albums chart specifically — not a stated all-time chart record, but a genuine first for her own catalog there.',
        sources: [
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2026/07/16/taylor-swifts-wedding-helps-her-soar-up-the-charts/',
            source_title: 'Taylor Swift’s Wedding Helps Her Soar Up The Charts',
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2025/04/08/taylor-swifts-first-re-recorded-album-hits-a-huge-landmark/',
            source_title: "Taylor Swift's First Re-Recorded Album Hits A Huge Landmark",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-28',
            reliability_score: 4,
            notes: 'Fearless (TV)\'s multi-year UK Country Artists Albums chart run',
          },
          {
            // The underlying primary is the Official Charts Company's dated UK
            // charts for that week. Linked to the artist hub, which the OCC
            // publishes; the specific weekly charts roll over and won't keep
            // showing this movement.
            outlet: 'Official Charts Company',
            url: 'https://www.officialcharts.com/artist/5387/taylor-swift/',
            source_title: 'Taylor Swift — Official Chart history (UK)',
            publisher: 'Official Charts Company (UK)',
            source_type: 'official',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
        ],
        // No photo: a chart week has no photography of its own, and the wedding
        // it references already carries its own imagery on the msg-wedding
        // item. A stand-in shot would illustrate nothing that happened here.
        photos: [],
      },
    },
    {
      // Authored 2026-07-28 from intake #1591. The next chart frame after the
      // wedding-week bump above (2026-07-16) — a light catalog-movement item,
      // not a milestone, but a confirmed chart fact. The two re-entries
      // (Elizabeth Taylor -> Official Vinyl Singles No. 18, 13 weeks; Opalite ->
      // Official Singles Downloads No. 83 / Sales No. 89) were independently
      // corroborated against the Official Charts Company before writing; one
      // established outlet (Forbes) suffices for a chart item. The fuller
      // four-singles sweep is attributed to Forbes rather than stated flatly.
      // Privacy redlines: clean — professional UK chart facts only, no location,
      // third parties, health, or security material. Kept deliberately light and
      // cross-linked to the 07-16 bump rather than spun up as a heavy moment.
      slug: 'showgirl-uk-singles-return-july',
      relatedIds: [
        'moment:vault-tloas-the-wedding-week-nudges-the-whole-catalog-back-up-the-uk-cha',
      ],
      year: 2026,
      month: 7,
      day: 28,
      category: 'music',
      title: 'Elizabeth Taylor and Opalite return to the UK charts',
      snippet:
        'A week on from the wedding bump, Britain’s charts logged another Showgirl return: per Forbes, “Elizabeth Taylor” re-entered the Official Vinyl Singles chart at No. 18 — its 13th week on that tally — while “Opalite” came back to the Official Singles Downloads and Sales rankings.',
      sourceUrl:
        'https://www.forbes.com/sites/hughmcintyre/2026/07/28/all-of-taylor-swifts-recent-singles-remain-hits-as-several-hits-return/',
      thumbnailUrl: null,
      moment: {
        context:
          'A week after the wedding-week bump nudged her whole catalog back up Britain’s charts, the movement didn’t settle — it kept going. In the chart frame Forbes tallied on July 28, 2026, all four of Taylor’s most recent singles were charting together, two of them re-entering rankings they had been off entirely.\n\n“Elizabeth Taylor,” the third focus track from The Life of a Showgirl, came back onto the Official Vinyl Singles chart as a top-20 bestseller at No. 18 — now 13 weeks on a tally it has previously topped outright. “Opalite,” the era’s second single, returned to both the Official Singles Downloads chart (No. 83) and the Official Singles Sales chart (No. 89), two rankings it had led earlier in the year. By Forbes’s reckoning “The Fate of Ophelia” and “I Knew It, I Knew You” — her Toy Story 5 song — also turned up across multiple UK rankings the same week.\n\nThe vinyl re-entry isn’t a one-week fluke, which is the quietly remarkable part. By the Official Charts Company’s own mid-year reckoning, “Elizabeth Taylor” is the UK’s best-selling vinyl single of all of 2026 so far — roughly 16,500 copies on wax through the end of the second quarter — with “The Fate of Ophelia” and “Opalite” right behind it at Nos. 5 and 6 on that year-to-date vinyl ranking. Months after release, Showgirl is still moving physical singles in a format most catalogs left behind decades ago.\n\nAs with the wedding-week bump, the underlying primary is the Official Charts Company’s dated weekly tallies, not the live chart URLs, which roll over each week and stop showing the movement. This is the next frame in the same story: a catalog that, on attention and collectors alike, keeps climbing back.',
        sources: [
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2026/07/28/all-of-taylor-swifts-recent-singles-remain-hits-as-several-hits-return/',
            source_title: 'Taylor Swift’s ‘The Life Of A Showgirl’ Single Returns As A Bestseller',
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-28',
            reliability_score: 4,
          },
          {
            // Primary: the Official Charts Company's dated UK weekly charts.
            // Linked to the artist hub the OCC publishes; the specific weekly
            // charts roll over and won't keep showing this movement.
            outlet: 'Official Charts Company',
            url: 'https://www.officialcharts.com/artist/5387/taylor-swift/',
            source_title: 'Taylor Swift — Official Chart history (UK)',
            publisher: 'Official Charts Company (UK)',
            source_type: 'official',
            accessed_at: '2026-07-28',
            reliability_score: 5,
          },
          {
            // Corroborates the year-to-date vinyl-singles ranking (Elizabeth
            // Taylor No. 1, Fate of Ophelia No. 5, Opalite No. 6 through Q2).
            outlet: 'Official Charts Company',
            url: 'https://www.officialcharts.com/chart-news/official-best-selling-vinyl-albums-singles-of-2026/',
            source_title: 'The Official best-selling vinyl albums and singles of 2026 so far',
            publisher: 'Official Charts Company (UK)',
            source_type: 'official',
            accessed_at: '2026-07-28',
            reliability_score: 5,
          },
        ],
        // No photo: a chart week has no photography of its own; a stand-in shot
        // would illustrate nothing that happened here. Same call as the 07-16
        // wedding-bump item and the other Showgirl chart-week pages.
        photos: [],
      },
    },

    // ── Migrated from content.ts RAW (consolidation stage 2a, 2026-07-19) ──
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "tloas-announce",
      year: 2025,
      month: 8,
      day: 13,
      category: "music",
      title: "A new era is announced",
      // Consolidation + sourcing (ledger #1067, 2026-07-21): this is the thin
      // legacy-migrated duplicate of the canonical New Heights announcement
      // (the "mint-green briefcase" item), same date and event (2025-08-13).
      // It is deliberately NOT deleted here: it uniquely carries the
      // era-timeline `milestone` marker (m-tloas-1) and the orange-signature
      // `hiddenClue`, and the canonical sibling carries neither — so removing
      // or redirecting this page is a structural change that would drop a
      // timeline milestone, surfaced to the founders in the PR + on ledger
      // #1067 rather than done unilaterally by a content run. Pending that
      // call, this pass makes the page honest: it cross-links to its canonical
      // sibling and the album it announced, and adds the minimum sourcing it
      // previously lacked entirely.
      relatedIds: [
        'moment:vault-tloas-a-mint-green-briefcase-on-new-heights-album-no-12-announced-',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
      ],
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-tloas-1", label: "Era announced", kind: "life" },
      snippet: "The Life of a Showgirl is revealed live on Travis Kelce’s \"New Heights\" podcast — a hard turn from ink into glitter.",
      hiddenClue: { clue: "The announcement leaned hard on the color orange — a shade barely used before.", payoff: "Orange became the era’s signature, blanketing every teaser and cover in warm footlight glow." },
      moment: {
        context: "After the monochrome hush of the last era, the reveal comes not from a stage or a cryptic post but from a guest chair on her fiancé’s football podcast — itself a sign of how public the era would be.\n\nThe announcement lands in warm orange and gold: a showgirl era, all sparkle and spectacle, reframing everything that came before as the build-up to a curtain call.",
        // Minimum sourcing added per ledger #1067 Q4 (2026-07-21): the page
        // asserted facts (the New Heights reveal, the orange-signature read)
        // with zero sources. These are the same verified sources the canonical
        // sibling carries for this exact event — the episode itself plus a
        // reputable-press writeup of the announcement.
        sources: [
          {
            outlet: 'New Heights with Jason & Travis Kelce',
            url: 'https://www.youtube.com/watch?v=M2lX9XESvDE',
            source_title:
              'Taylor Swift on Reclaiming Her Masters, Wrapping The Eras Tour, and The Life of a Showgirl | NHTV',
            publisher: 'New Heights (Wondery)',
            source_type: 'social',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/pop-culture/pop-culture-news/taylor-swift-sets-guinness-world-record-new-heights-podcast-appearance-rcna227245',
            source_title: "Taylor Swift sets Guinness World Record with 'New Heights' podcast appearance",
            publisher: 'NBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
        ],
        // Photo pass #762 run 10 (2026-07-19): page had zero photos. Full New
        // Heights episode id M2lX9XESvDE verified via YouTube oEmbed this
        // session ("Taylor Swift on Reclaiming Her Masters, Wrapping The Eras
        // Tour, and The Life of a Showgirl | NHTV", author @newheightshow);
        // maxres1 frame (1280x720) curl-verified 200 image/jpeg, downloaded
        // and viewed — distinct frame from the hqdefault already used on the
        // showgirl-announced-on-new-heights page.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/M2lX9XESvDE/maxres1.jpg',
            credit: 'New Heights (official episode frame, YouTube)',
            caption:
              'In the guest chair on New Heights: Taylor and Travis laughing mid-episode, with Jason on the split screen, the night the album was announced.',
            kind: 'primary',
            // Three faces sit in a band across the upper third — Jason left
            // panel, Travis center, Taylor right; bias the crop high.
            focalPoint: '51% 32%',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "tloas-album",
      year: 2025,
      month: 10,
      day: 3,
      category: "music",
      title: "The Life of a Showgirl released",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-tloas-2", label: "Showgirl released", kind: "album" },
      // Sourcing + cross-link + consolidation treatment (ledger #1370, 2026-07-25),
      // mirroring what #1067 (tloas-announce) and #1091 (tloas-debut-chart) received.
      // This is one of two co-existing "Showgirl released" pages: this stub carries
      // the unique era-timeline milestone m-tloas-2, while the canonical release-day
      // page (linked first below) carries the exhaustive depth — so it is deliberately
      // NOT re-duplicated here. The consolidation question (should m-tloas-2 move to
      // the canonical page and this stub redirect?) is surfaced for Wyatt in the PR,
      // not resolved in a content run.
      relatedIds: [
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-a-mint-green-briefcase-on-new-heights-album-no-12-announced-',
        'moment:vault-tloas-4-002-million-in-a-week-the-biggest-album-debut-ever-measure',
        'moment:vault-tloas-all-12-tracks-debut-as-the-hot-100s-entire-top-12',
        'moment:vault-tloas-the-title-track-hands-the-last-word-to-sabrina-carpenter',
      ],
      snippet: "The twelfth studio album arrives: opulent, theatrical, and unapologetically bright.",
      moment: {
        context:
          'The album trades diary pages for the stage — feathers, footlights, and the glittering armor of a performer who has seen it all.\n\nHer twelfth studio album arrived October 3, 2025 on Republic Records: twelve tracks, roughly forty-one minutes, its only guest Sabrina Carpenter on the closing title track. Swift produced it with Max Martin and Shellback — the first time the three had made a complete album as its sole production team ("We\'ve never actually made an album before where it\'s just the three of us"), and her first full-album reunion with them since reputation (2017); the five records in between were led by Jack Antonoff and Aaron Dessner. She built it in Stockholm on days off during the Eras Tour\'s 2024 European leg, after inviting Max Martin out to a show — "I just feel like we could knock it out of the park if we went back in."\n\nThe rollout leaned on a sprawling physical strategy — dozens of CD, vinyl and cassette variants — behind the midnight digital release. Reviews split hard, from Rolling Stone\'s five stars to the Guardian\'s two, netting a generally-favorable aggregate (Metacritic in the high 60s); critics argued over a bright, victory-lap pop record made by an exhausted headliner. The record-shattering first week — 4.002 million units, the biggest in Luminate history — and the Hot 100 top-12 sweep are told in full on the linked debut and chart pages, where this consolidated milestone points rather than repeating them.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-max-martin-shellback-produce-life-of-showgirl-1235407365/',
            source_title: "Taylor Swift Reunites With Max Martin and Shellback for 'The Life of a Showgirl'",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-made-life-of-showgirl-during-eras-tour-1235407376/',
            source_title: "Taylor Swift Made 'The Life of a Showgirl' During the Eras Tour",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-album-reviews/taylor-swift-the-life-of-a-showgirl-album-review-1235439733/',
            source_title: "Taylor Swift's 'The Life of a Showgirl': Album Review",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'Metacritic',
            url: 'https://www.metacritic.com/music/the-life-of-a-showgirl/taylor-swift',
            source_title: "The Life of a Showgirl by Taylor Swift Reviews",
            publisher: 'Metacritic',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-life-of-a-showgirl-number-one-billboard-200/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' Debuts at No. 1 With Biggest Week in Luminate History",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
            source_title: 'The Life of a Showgirl',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-25',
            reliability_score: 2,
          },
        ],
        // Photo pass #762 run 10 (2026-07-19): page had zero photos. Billboard
        // wp-content PR image 02 from the album's Mert & Marcus press set
        // (same set as the 01/03 images used on sibling pages) curl-verified
        // 200 image/jpeg 1800x1200, downloaded and viewed — Taylor in the
        // ruby-crystal bodysuit draped across bentwood chairs.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2025/08/02-taylor-swift-life-of-a-showgirl-pr-billboard-1800.jpg',
            // Head tilted back in the top-right corner of the frame; keep the
            // crop high and right so the face survives wide cards.
            focalPoint: '84% 14%',
            credit: 'Mert Alas & Marcus Piggott / Republic Records, via Billboard',
            caption:
              'From the album press shoot: the ruby-crystal showgirl bodysuit, backstage-cabaret staging and all.',
            kind: 'primary',
          },
          // Photo pass #762 (2026-07-20): the album-release page had a single
          // photo, so added two more frames from the same official Mert &
          // Marcus press set on Billboard's CDN (images 01 and 03 of the set;
          // 02 is the photo above). Both curl-verified 200 image/jpeg,
          // 1800px, downloaded and visually confirmed this session — distinct
          // shots from each other and from 02, no duplicates.
          {
            url: 'https://www.billboard.com/wp-content/uploads/2025/08/01-taylor-swift-life-of-a-showgirl-pr-billboard-1800.jpg',
            // She sits just right of center; her face is in the upper third.
            focalPoint: '53% 32%',
            credit: 'Mert Alas & Marcus Piggott / Republic Records, via Billboard',
            caption:
              'From the same press shoot: a jeweled cap, a peach ostrich-feather boa and a champagne coupe, in a mirrored powder room.',
            kind: 'primary',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2025/08/03-taylor-swift-life-of-a-showgirl-pr-billboard-1800.jpg',
            // Arms-out pose centered in frame; her face sits high, near the top.
            focalPoint: '53% 15%',
            credit: 'Mert Alas & Marcus Piggott / Republic Records, via Billboard',
            caption:
              'From the same press shoot: the full crystal-and-gold showgirl costume, arms flung wide against a gilded stage.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "tloas-fate-of-ophelia-video",
      year: 2025,
      month: 10,
      day: 5,
      category: "music",
      // Cross-links + sourced depth added 2026-07-24 (ledgers #1069, #1106,
      // "big-ticket"/deficit): scoped to the VIDEO AS A DIRECTED WORK — crew,
      // premiere-as-event, filming, YouTube metrics, the dance trend, easter
      // eggs, the ASC win. The song's chart run lives on the lead-single page
      // and the piece-by-piece costumes on the wardrobe page (both linked).
      relatedIds: [
        'moment:vault-tloas-the-fate-of-ophelia-hamlets-drowned-girl-rescued-and-a-13th-',
        'moment:vault-tloas-the-ophelia-video-wardrobe-versace-crystals-cavalli-chainmai',
        'moment:vault-tloas-the-official-release-party-of-a-showgirl-turns-movie-theater',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
      ],
      title: "“The Fate of Ophelia” video premieres",
      snippet: "The self-directed lead-single video debuts on YouTube after its theatrical-only premiere two days earlier.",
      video: { youtubeId: "ko70cExuzZM", title: "Taylor Swift - The Fate of Ophelia (Official Music Video)" },
      moment: {
        context: "Swift wrote and directed the video herself and, per its credits, built it with Eras Tour collaborators: cinematographer Rodrigo Prieto (Barbie, Killers of the Flower Moon), production designer Ethan Tobman, choreographer Mandy Moore, editor Chancler Haynes and producer Jil Hardin, casting her Eras band and dancers as the ensemble. It is the first video of the Showgirl era and the latest in a long run of self-directed work: since her first solo credit — “The Man” in 2020, the video that made her the first solo woman to win the MTV VMA for Best Direction — Swift has directed 14 of her own videos, 11 of them entirely on her own. Filming centered on the 1931 Los Angeles Theatre in downtown LA, after rehearsals that ran more than three weeks; the piece moves through a run of eras — an Old Hollywood opening, 1960s go-go lines, and a Busby Berkeley-scale synchronized-swim number that stages the drowned-Ophelia cover.\n\nIt premiered on the big screen first, playing inside “The Official Release Party of a Showgirl” — the Oct. 3, 2025 theatrical event that wrapped the video with behind-the-scenes footage, lyric videos, and Swift’s spoken “what inspired this music” intros — before its YouTube debut two days later, on Oct. 5, where it drew about 25 million views in three days and trended at No. 1. Fans turned the chorus choreography into a TikTok trend that even Australian PM Anthony Albanese attempted; Swift amplified it by posting an official clip of her and her dancers running the routine.\n\nWatchers logged a dense easter-egg layer — a door marked “No. 87” and a dressing-room photo nodding to Travis Kelce, an orange bird recalling “Look What You Made Me Do,” a clapperboard reading “Sequins are forever,” and a “Featuring Kitty Finlay” card (Finlay is Swift’s maternal grandmother’s surname). Prieto’s camerawork went on to win Outstanding Achievement in Cinematography in a Music Video at the ASC Awards (March 2026), his first ASC win.",
        sources: [
          {
            // Theatrical premiere inside the Release Party + the full package shown.
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-fate-of-ophelia-video-1236082294/',
            source_title: "Taylor Swift Drops 'The Fate of Ophelia' Music Video: Watch",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            // Self-directed; cinematographer Rodrigo Prieto named.
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-the-fate-of-ophelia-music-video-watch-1236393494/',
            source_title: "Taylor Swift Releases Music Video for 'The Fate of Ophelia': Watch",
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            // Crew (Tobman, Mandy Moore), Eras cast, Los Angeles Theatre filming,
            // 3+ weeks of rehearsal, 25M views/No.1-trending in three days, and the
            // ASC 2026 cinematography win (accolades table). Reliability-2, used
            // only for facts corroborated by the reputable sources above/below.
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/The_Fate_of_Ophelia',
            source_title: 'The Fate of Ophelia',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-24',
            reliability_score: 2,
          },
          {
            // Swift released an official dance clip; the chorus routine became a
            // documented TikTok trend, choreographed by Mandy Moore.
            outlet: 'The Mary Sue',
            url: 'https://www.themarysue.com/taylor-swift-fate-of-ophelia-dance-tutorial-music-video-tiktok/',
            source_title: "Taylor Swift Shares Official 'Fate of Ophelia' Dance Tutorial",
            publisher: 'The Mary Sue',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          {
            // The video's easter-egg roundup (No. 87 door, Kelce photo, orange
            // bird, "Sequins are forever" clapperboard, "Featuring Kitty Finlay").
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/music/articles/taylor-swifts-fate-ophelia-music-180352287.html',
            source_title: "Every Easter Egg in Taylor Swift's 'The Fate of Ophelia' Music Video",
            publisher: 'Yahoo Entertainment',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          {
            // Rodrigo Prieto's first ASC Award (Music Video), ceremony March 8 2026.
            outlet: 'IBTimes UK',
            url: 'https://www.ibtimes.co.uk/rodrigo-prieto-asc-award-taylor-swift-fate-ophelia-1784138',
            source_title: "Rodrigo Prieto Wins First ASC Music Video Award for Taylor Swift's 'The Fate of Ophelia'",
            publisher: 'IBTimes UK',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          // Ledgers #1069/#1106 (2026-07-25): the self-directed filmography
          // context — 14 videos since "The Man" (2020), 11 of them fully solo —
          // and the editor credit (Chancler Haynes).
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/music/articles/taylor-swift-self-directed-music-004122639.html',
            source_title: "Here Are All of Taylor Swift's Self-Directed Music Videos, Ranked",
            publisher: 'Yahoo Entertainment',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          {
            outlet: 'IMDb',
            url: 'https://www.imdb.com/title/tt38604956/fullcredits/',
            source_title: "Taylor Swift: The Fate of Ophelia (Music Video 2025) — Full cast & crew",
            publisher: 'IMDb',
            source_type: 'database',
            accessed_at: '2026-07-25',
            reliability_score: 2,
          },
        ],
        // Photo pass #762 run 10 (2026-07-19): page had zero photos. Official
        // MV id ko70cExuzZM re-verified via YouTube oEmbed this session
        // ("Taylor Swift - The Fate of Ophelia (Official Music Video)",
        // author @TaylorSwift); maxres2 frame (1280x720) curl-verified 200
        // image/jpeg, downloaded and viewed — distinct frame from the
        // hqdefault already used on the lead-single pages.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/ko70cExuzZM/maxres2.jpg',
            credit: 'Taylor Swift / Republic Records (official "The Fate of Ophelia" video frame, YouTube)',
            caption:
              'The Busby Berkeley swim tableau from the self-directed video: aqua swim caps, life-ring set pieces, and Taylor front and center.',
            kind: 'primary',
            // Her face sits just above center-frame amid the swim formation.
            focalPoint: '49% 35%',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "tloas-sequins",
      year: 2025,
      month: 10,
      dateLabel: "Fall 2025",
      category: "fashion",
      // Provenance, sources + cross-links added 2026-07-24 (ledger #1274). This
      // generic "visual identity" card previously asserted the aesthetic with
      // zero sourcing and a single shoppable dress with no evidence Swift wore
      // it — now traced to the real Gucci/Bob Mackie looks, with the retail
      // dress kept but honestly framed as a get-the-look dupe (see below).
      relatedIds: [
        'moment:vault-tloas-the-showgirl-portraits-mert-and-marcus-rhinestones-and-an-op',
        'moment:vault-tloas-the-ophelia-video-wardrobe-versace-crystals-cavalli-chainmai',
        'moment:vault-tloas-the-look-that-made-showgirl-orange-a-fashion-story-reformati',
        'moment:vault-tloas-the-fate-of-ophelia-video-premieres',
      ],
      title: "Orange sequins and feathers",
      snippet: "The visual language: burnt-orange rhinestones, marabou, and spotlight sparkle.",
      moment: {
        context: "“Showgirl orange” was the era’s signal before a note dropped: Swift told Jason Kelce on New Heights that she chose orange because it captured how her Eras Tour life felt — “effervescent” — and had teased it for months, exiting each Eras stage through an orange door. The rhinestones-and-feathers language was set by the album’s imagery, shot by Mert Alas and Marcus Piggott and styled by Swift’s longtime stylist Joseph Cassell Falconer: a custom burnt-orange, ombré-sequined Gucci gown with opera gloves anchors the portrait suite, while one alternate cover revived a feather-trimmed, rhinestone-encrusted Bob Mackie costume from the Las Vegas revue Jubilee! — Mackie being the designer synonymous with Cher and the Vegas stage. The self-directed “Fate of Ophelia” video carried the same palette across its showgirl tableaux.\n\nThe shoppable dress below — Branna Couture’s feather-trim sequin mini — is a get-the-look dupe in the era’s colors, a fan-accessible echo of those documented Gucci and Mackie looks, not a garment Swift is documented wearing.",
        sources: [
          {
            // Era stylist (Joseph Cassell Falconer) + the custom burnt-orange
            // sequined Gucci gown from the Mert & Marcus shoot. Verified reachable.
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-the-life-of-a-showgirl-style/',
            source_title: "Every Fashion Detail of Taylor Swift's 'The Life of a Showgirl'",
            publisher: 'Marie Claire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            // Swift on why orange — "effervescent," how her Eras Tour life felt —
            // and the orange-door Eras Easter egg (New Heights, Aug. 2025).
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/taylor-swift-life-of-a-showgirl-album-outfits-new-heights/',
            source_title: "Taylor Swift's 'Life of a Showgirl' Album Cover Outfit, Explained",
            publisher: 'Marie Claire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            // Bob Mackie's feather-and-rhinestone Jubilee! costume on an album
            // cover variant, in the designer's own words.
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/bob-mackie-blown-away-taylor-swift-outfit-showgirl-cover-1236101495/',
            source_title: "Bob Mackie 'Blown Away' by Taylor Swift Wearing His Design on 'Showgirl' Cover",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
        ],
        products: [
          {
            brand: 'Branna Couture',
            item: 'Feather-Trim Sequin-Embellished Mini Dress',
            retailer: 'brannacouture.com',
            url: 'https://brannacouture.com/products/feather-trim-sequin-embellished-mini-dress-orange',
            price: '$262.00',
            inStock: true,
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "tloas-debut-chart",
      // Cross-links (ledger #1091, 2026-07-21): this milestone page is the thin
      // sibling of `showgirl-four-million-week`, which carries the exhaustive
      // accounting — link to it, the release day, the concurrent Hot 100 sweep,
      // and the vinyl week that powered the pure-sales side.
      relatedIds: [
        'moment:vault-tloas-4-002-million-in-a-week-the-biggest-album-debut-ever-measure',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-all-12-tracks-debut-as-the-hot-100s-entire-top-12',
        'moment:vault-tloas-1-334-million-vinyl-lps-in-seven-days-the-first-million-viny',
      ],
      year: 2025,
      month: 10,
      day: 18,
      category: "sighting",
      title: "A record-setting debut",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-tloas-3", label: "Record debut", kind: "award" },
      snippet: "The album opens at number one with the fastest-selling first week in history.",
      moment: {
        context: "The Life of a Showgirl opened at 4.002 million album-equivalent units — about 3.48 million of them pure sales — the largest single week for any album since Billboard began tracking with Luminate's modern methodology, past Adele's decade-old 25 (3.482 million units, 2015). The full accounting — the streaming split, the 38-edition variant strategy behind the pure-sales side, and the second-week fall — lives on the companion page, \"4.002 million in a week.\"\n\nAgainst her own catalog the number stacked cleanly on a rising first-week line: Red 1.208M (2012), reputation 1.238M (2017), 1989 1.287M (2014), Midnights 1.578M (2022), The Tortured Poets Department 2.61M (2024), then Showgirl at 4.002M — more than half again as large as her prior personal best. It was also her 15th No. 1 album on the Billboard 200, breaking her tie with Drake and Jay-Z (14 each) for the most chart-toppers of any soloist, behind only The Beatles' all-time 19. Abroad it debuted at No. 1 in the UK on the biggest opening week of her career there (423,000 units) and topped the charts in Australia, Canada, New Zealand and Ireland.\n\nThe final number overshot the forecasts. The album sold 2.7 million copies on release day alone — by itself the second-biggest sales week for any album in Luminate history, logged in a single day with six left to run — which put Adele's decade-old record within immediate reach; the completed 4.002M-unit week didn't just pass Adele's 3.482M, it cleared it by more than half a million.",
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-life-of-a-showgirl-number-one-billboard-200/',
            source_title: "Taylor Swift Achieves Record-Shattering 4 Million Week With No. 1 Billboard 200 Debut of 'The Life of a Showgirl'",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
          {
            outlet: 'Official Charts Company',
            url: 'https://www.officialcharts.com/chart-news/taylor-swift-number-1-album-and-single/',
            source_title: 'Taylor Swift scores biggest opening week of her career in the UK with The Life of a Showgirl',
            publisher: 'Official Charts Company (UK)',
            source_type: 'chart_database',
            accessed_at: '2026-07-21',
            reliability_score: 5,
          },
          // Depth ledger #1091 Q6 (2026-07-22): the forecast-vs-actual line — the
          // 2.7M first-DAY figure (Luminate, via Variety) that already ranked as
          // the second-biggest sales WEEK ever after one day and set up the run at
          // Adele's record the final 4.002M week went on to clear.
          {
            outlet: 'Variety',
            url: 'https://variety.com/2025/music/news/taylor-swift-album-sales-first-day-billboard-million-showgirl-1236540366/',
            source_title: "Taylor Swift Sells 2.7 Million Copies of 'The Life of a Showgirl' on Day 1 — Already the Second-Best Tally for an Album's First Week in History",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-22',
            reliability_score: 4,
          },
        ],
        // Photo pass #762 run 10 (2026-07-19): page had zero photos. Billboard
        // wp-content PR image 04 from the album's Mert & Marcus press set
        // curl-verified 200 image/jpeg 1800x1200, downloaded and viewed — the
        // underwater bathtub shot from the cover session, distinct from the
        // 03 image used on the showgirl-four-million-week sibling page.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2025/08/04-taylor-swift-life-of-a-showgirl-pr-billboard-1800.jpg',
            credit: 'Mert Alas & Marcus Piggott / Republic Records, via Billboard',
            caption:
              'The underwater shot from the album-cover session — the imagery that fronted the biggest sales week ever measured.',
            kind: 'archival',
            // Face slightly left of center, eyes just below the vertical midline.
            focalPoint: '52% 42%',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "tloas-hot100-sweep",
      year: 2025,
      month: 10,
      day: 18,
      category: "sighting",
      title: "All twelve songs, all twelve top spots",
      snippet: "Every track on the album lands positions 1 through 12 of the Billboard Hot 100 — a first in chart history.",
      moment: {
        context: "Led by \"The Fate of Ophelia\" at number one, the full tracklist swept the top of the Hot 100 with no other song breaking the streak.\n\nIt was the first time in the chart’s history, dating back to the 1950s, that an entire album occupied every one of its top positions uninterrupted.",
        // Photo pass #762 run 10 (2026-07-19): page had zero photos. Billboard
        // wp-content PR image 05 from the album's Mert & Marcus press set
        // curl-verified 200 image/jpeg 1800x1200, downloaded and viewed — the
        // jeweled-headdress shot, unused elsewhere in the corpus.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2025/08/05-taylor-swift-life-of-a-showgirl-pr-billboard-1800.jpg',
            credit: 'Mert Alas & Marcus Piggott / Republic Records, via Billboard',
            caption:
              'Crowning the showgirl: the jeweled-headdress press image from the album shoot, as all twelve tracks locked up the top twelve spots.',
            kind: 'archival',
            // Arms raised overhead push the face to the lower-center of the
            // frame; bias the crop down to keep it.
            focalPoint: '48% 58%',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "tloas-opalite-video",
      year: 2026,
      // Date corrected 2026-07-21 (depth ledger #1096, "stale field" fix): the
      // migrated legacy entry dated the video Jan 12, but the "Opalite" video
      // premiered Fri Feb 6, 2026 (8 a.m. ET, Apple Music + Spotify exclusive;
      // YouTube premiere Sun Feb 8) — verified via The Hollywood Reporter and
      // AOL/People. Field fix only: this page is the corpus's canonical "thin
      // page" test fixture (substance.test.ts, feed-tiers.test.ts pin it as
      // <0.2 substance / 'chip' tier), so the ledger's DEPTH questions are left
      // open — deepening it would break those engine-lane fixtures. See PR.
      month: 2,
      day: 6,
      category: "music",
      title: "“Opalite” arrives as the second single",
      snippet: "A time-slip music video follows a lonesome character through the 1990s toward a gem-hued reinvention.",
      video: { youtubeId: "1FVF-9KQiPo", title: "Taylor Swift - Opalite (Official Music Video)" },
      // Cross-link added 2026-07-21 (ledger #1096) to the single's chart page.
      // The Opalite-video ↔ Graham-Norton pair is captured as a separate
      // crosslink-candidate issue for the builder rather than hard-linked here.
      // Cross-link (candidate #1097): the video's whole ensemble — Gleeson,
      // Greta Lee, Turner-Smith, Capaldi, Norton, a Cillian Murphy cameo — is
      // the couch from the Oct 2025 Graham Norton press-run appearance.
      relatedIds: [
        'moment:vault-tloas-opalite-follows-ophelia-to-no-1',
        'moment:vault-tloas-a-jeweled-david-koma-lbd-opens-the-press-run-on-graham-norto',
      ],
      moment: {
        context: "Taylor Swift wrote and directed the \"Opalite\" video herself, with cinematography by Rodrigo Prieto — shot on film in a 1990s rom-com register — and choreography by Mandy Moore. It imagines the title as a magical drugstore spray that cures loneliness. A brunette Swift plays a Lonely Woman whose only friend is a pet rock that weighs her down; Domhnall Gleeson is a Lonely Man trapped with a hostile cactus. When both spritz themselves with Opalite, their toxic attachments fall away and a mall-date, dance-off montage begins. Graham Norton hawks a rival spray, \"Nope-alite\" (\"for people who want to choose to be unhealed\"); Cillian Murphy voices and fronts the Opalite ad; Greta Lee plays an MTV \"Indie Rock Goddess\" and Jodie Turner-Smith an aerobics instructor, both glimpsed on TV; Lewis Capaldi is the mall photographer.\n\nThe ensemble came straight off a couch: nearly every guest had sat beside Swift on the October 2025 Graham Norton Show, and after Gleeson joked on air that he hoped to land in one of her videos, she built the cast around that episode.\n\nIt premiered Feb. 6, 2026 exclusively on Apple Music and Spotify Premium — setting a record as the most-viewed video in 24 hours on both — before reaching YouTube two days later (5.4M-plus views on its first day there). Two behind-the-scenes extended cuts followed on Feb. 13, in which Swift walked through easter eggs nodding to \"You Belong with Me,\" \"Lover,\" \"Mad Woman,\" \"Bejeweled,\" \"Father Figure\" and \"Ruin the Friendship.\" Critics were broadly warm, reading it as a whimsical, self-aware showcase; its release also lifted the single to No. 1 in the UK.",
        // Sources added 2026-07-21 (ledger #1096): the page previously carried
        // zero sources. Director/DP/cast/date verified across HR, Variety,
        // E! Online, Rolling Stone and Wikipedia.
        sources: [
          {
            outlet: 'Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-opalite-music-video-1236497088/',
            source_title: 'Taylor Swift Debuts “Opalite” Music Video Starring Domhnall Gleeson',
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2026/music/news/taylor-swift-opalite-music-video-domhnall-gleeson-greta-lee-1236653651/',
            source_title: "Taylor Swift's 'Opalite' Music Video Stars Domhnall Gleeson, Greta Lee",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/1428562/taylor-swift-on-opalite-music-video-easter-eggs',
            source_title: 'Taylor Swift Reveals “Opalite” Music Video Easter Eggs',
            publisher: 'E! Online',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-opalite-music-video-1235511440/',
            source_title: "Taylor Swift Releases 'Opalite' Music Video: Watch",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Opalite_(song)',
            source_title: 'Opalite (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-21',
            reliability_score: 2,
          },
        ],
        // Photo pass #762 run 10 (2026-07-19): page had zero photos. Official
        // MV id 1FVF-9KQiPo verified via YouTube oEmbed this session
        // ("Taylor Swift - Opalite (Official Music Video)", author
        // @TaylorSwift); maxres1 frame (1280x720) curl-verified 200
        // image/jpeg, downloaded and viewed — Taylor pointing to the opalite
        // necklace (maxres2/3 show supporting cast only, skipped).
        photos: [
          {
            url: 'https://i.ytimg.com/vi/1FVF-9KQiPo/maxres1.jpg',
            credit: 'Taylor Swift / Republic Records (official "Opalite" video frame, YouTube)',
            caption:
              'From the "Opalite" video: Taylor points to the opal at her collarbone as the song pulls her character back into color.',
            kind: 'primary',
            // Pillarboxed frame; her face is centered with eyes in the upper
            // third of the image.
            focalPoint: '51% 32%',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "tloas-elizabeth-taylor-video",
      // Cross-links (candidates #1258, #1259): the song this single promotes,
      // and its archival music video.
      relatedIds: [
        'moment:vault-tloas-elizabeth-taylor-the-first-song-she-wrote-for-the-album',
        'moment:vault-tloas-the-elizabeth-taylor-video-a-supercut-of-the-real-liz',
      ],
      year: 2026,
      month: 3,
      day: 9,
      category: "music",
      tags: ["Fashion"],
      title: "“Elizabeth Taylor” goes to radio",
      snippet: "The album’s third radio single, five months after release — Hot AC on March 9, Top 40 the next day — and, weeks later, a top-10 airplay run that made chart history.",
      video: { youtubeId: "WqbJT_vC0rs", title: "Taylor Swift - Elizabeth Taylor (Official Music Video)" },
      moment: {
        context: "Five months after the album, \"Elizabeth Taylor\" became its third radio single, after the two Hot 100 No. 1s \"The Fate of Ophelia\" and \"Opalite.\" It impacted US hot adult contemporary (AC) radio on March 9, 2026 and contemporary hit (Top 40) radio the next day; Billboard reported it \"trending toward a debut on the March 21-dated Pop Airplay, Adult Pop Airplay and Adult Contemporary charts,\" with early adds at SiriusXM, iHeart's Z100 New York and 99.7 NOW San Francisco.\n\nRadio came first by a wide margin — the archival music video did not premiere until March 31, roughly three weeks later — so the single began its radio life well before it had a video, not alongside one. On airplay it became one of the album's biggest post-release hits, peaking at No. 7 on Pop Airplay, No. 8 on Adult Pop Airplay and No. 9 on Adult Contemporary. Its Adult Pop Airplay top-10 run made history: with \"The Fate of Ophelia\" and \"Opalite\" already in the region, Swift became the first artist in that chart's 30-year history to hold three simultaneous top 10s — her 35th career top 10 on the format.\n\nThe \"So Glamorous Cabaret Version\" the motif points to is not a spring-2026 release: it is one of eight acoustic re-recordings Swift cut with Max Martin and Shellback and issued Oct. 5, 2025 as bonus tracks on four limited CD editions of the album, the fourth of which paired it with an \"Original Songwriting Voice Memo.\" During the single's cycle Swift made a non-performing special appearance at the iHeartRadio Music Awards on March 26, 2026, taking Artist of the Year among seven wins; no official reason was published for choosing \"Elizabeth Taylor\" as the third single, and no dedicated televised performance of it is documented.",
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://ca.billboard.com/music/pop/taylor-swift-elizabeth-taylor-radio-single-1236197103',
            source_title: "Taylor Swift Promotes 'Elizabeth Taylor' As Third Radio Single From 'The Life of a Showgirl'",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2026/04/26/taylor-swift-makes-history-as-her-latest-single-soars-into-the-top-10/',
            source_title: 'Taylor Swift Makes History As Her Latest Single Soars Into The Top 10',
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://au.variety.com/2025/music/news/taylor-swift-acoustic-recordings-bonus-tracks-cd-editions-showgirl-28534',
            source_title: "Taylor Swift Announces Eight Acoustic Recordings as Bonus Tracks for Four New 'Life of a Showgirl' CD Editions",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/awards/taylor-swift-2026-iheartradio-music-award-artist-of-the-year-1236208165/',
            source_title: 'Taylor Swift Takes Home 2026 iHeartRadio Music Award for Artist of the Year',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Elizabeth_Taylor_(song)',
            source_title: 'Elizabeth Taylor (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-25',
            reliability_score: 2,
          },
        ],
        // Photo pass #762 run 10 (2026-07-19): page had zero photos. Official
        // MV id WqbJT_vC0rs verified via YouTube oEmbed this session
        // ("Taylor Swift - Elizabeth Taylor (Official Music Video)", author
        // @TaylorSwift); maxres3 frame (1280x720) curl-verified 200
        // image/jpeg, downloaded and viewed — archival Elizabeth Taylor
        // footage, distinct from the maxresdefault already used on the
        // elizabeth-taylor track pages.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/WqbJT_vC0rs/maxres3.jpg',
            // Letterboxed archival frame; her face is centered, eyes just
            // above the mid-line — keep the crop centred-high.
            focalPoint: '52% 38%',
            credit: 'Taylor Swift / Republic Records (official "Elizabeth Taylor" video frame, YouTube)',
            caption:
              'The video leans on archival footage of its namesake: Elizabeth Taylor in a violet headscarf, diamond flashing, seaside.',
            kind: 'primary',
          },
        ],
      },
    },
  ],
};
