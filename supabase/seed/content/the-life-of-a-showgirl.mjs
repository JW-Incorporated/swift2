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
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-the-showgirl-portraits-mert-and-marcus-rhinestones-and-an-op',
        'moment:vault-tloas-4-002-million-in-a-week-the-biggest-album-debut-ever-measure',
      ],
      title: 'A mint-green briefcase on New Heights: album No. 12, announced on her first-ever podcast',
      snippet:
        'Teased by a 12:12 a.m. countdown, revealed on Travis and Jason Kelce\'s New Heights: a briefcase with an orange "TS," a title, and an Oct. 3 date. The episode set a Guinness World Record with 1.3 million concurrent YouTube viewers — the most ever for a podcast.',
      sourceUrl: 'https://www.nbcnews.com/pop-culture/pop-culture-news/taylor-swift-sets-guinness-world-record-new-heights-podcast-appearance-rcna227245',
      thumbnailUrl: null,
      moment: {
        context:
          'A countdown on her website expired at 12:12 a.m. ET on Aug. 12, 2025, revealing the teaser; the full episode aired the next evening. On it she pulled the blurred mint-green briefcase from behind the desk — mint green with an orange "TS" — revealed the 12-track list ending in a Sabrina Carpenter feature, and talked through the era\'s orange-glitter look. It was her first-ever podcast appearance, staged on her boyfriend\'s own show, and it doubled as the most unguarded long-form interview she had given in years: two hours of album talk, football talk, and the couple\'s dynamic on camera.\n\nThe internet did not hold. The livestream crashed under the load about an hour and 44 minutes in, with the concurrent count peaking at 1.3 million viewers — a figure Guinness World Records certified as the most concurrent views ever for a podcast on YouTube. Within 24 hours the episode had roughly 13 million YouTube views, per Variety\'s tally. The announcement\'s mechanics became the era\'s template: every detail, from the 12:12 a.m. timestamp to the reveal\'s staging on the Kelce brothers\' set, was read by fans as deliberate.\n\nThe two hours ranged well past the reveal. Its most-quoted stretch was the masters buyback: she teared up recounting that she had finally bought back her catalog from Shamrock Capital, a deal she said she led "heart-first," sending her mother Andrea and brother Austin to make the case because "these are my handwritten diary entries from my whole life." She also walked through wrapping the Eras Tour, how she and Travis started dating, and homemaker life down to baking sourdough. On the number 12 she was firm the short tracklist was the whole album — "This is 12. There\'s not a 13th" — while the 12:12 timestamp fed a fan numerology her team never formally confirmed. The appearance moved the show itself: New Heights, on a $100M-plus Wondery deal, saw its female viewership jump more than 600% on Spotify and drew over 500 million cross-platform video views within days.',
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
      ],
      title: 'The Life of a Showgirl arrives: 12 tracks, Max Martin and Shellback, one guest',
      snippet:
        'Written and recorded in Sweden between European Eras Tour dates — her first full album with Max Martin and Shellback since 1989 and reputation. Twelve tracks, no Anthology-style sprawl, and a single feature: Sabrina Carpenter on the closing title track.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/f/f4/Taylor_Swift_%E2%80%93_The_Life_of_a_Showgirl_%28album_cover%29.png',
      moment: {
        context:
          'On New Heights she described slipping to Sweden during the Eras Tour\'s 2024 European leg to cut the record with Max Martin and Shellback, keeping it deliberately tight at 12 songs after the 31-track Tortured Poets Anthology. It was a pointed reunion: Martin and Shellback built the pop machinery of 1989 and reputation, and this was her first full album with them since — made in stolen days between stadium shows, which she said is exactly what the songs are about. The tracklist runs from a Hamlet-referencing opener to a George Michael interpolation to the Carpenter duet that gives the album its name.\n\nThe cover — shot by Mert Alas and Marcus Piggott, styled by her longtime stylist Joseph Cassell — shows Swift half-submerged in water in a diamond-lined AREA bralette, restaging Millais\'s Ophelia under an orange, glittery title treatment. She framed it as a deliberately offstage image: "My day ends in a bathtub, not usually in a bedazzled dress," she said, wanting the artwork to be "about what happened offstage" rather than onstage. The bathtub reading pays off on track one — the drowned Ophelia of the cover is the same woman the opening song pulls out of the water.\n\nThe record itself is lean: 12 tracks, 41:40, cut at MXM and Shellback Studios in Stockholm and written throughout by Swift with Martin and Shellback — the only outside credit George Michael\'s, for the "Father Figure" interpolation. Sabrina Carpenter sings on the closing title track (a character study of a Las Vegas showgirl named Kitty) as a vocal feature, not a co-writer. Republic flooded release week with 27 physical variants — 16 CDs, eight vinyl pressings, two deluxe CDs bundled with clothing, and a cassette — the collector economy behind the sales records. Critics split hard: a 69 on Metacritic across 23 reviews, Rolling Stone\'s five stars against the Guardian\'s two, one of 2025\'s most-debated albums.',
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
          'The three-day domestic gross split $15.8M Friday, $9.9M Saturday, and $8.3M Sunday, with roughly $16 million more internationally. Every "ticket" was for the same 89 minutes on a loop of showtimes — the in-theater premiere of the self-directed "The Fate of Ophelia" music video, behind-the-scenes footage from its shoot, lyric videos for the rest of the album, and Swift\'s own on-camera reflections on the songs. No plot, no premiere, no stars in attendance — and it still beat every actual movie in wide release.\n\nIt was not an AMC-only affair. AMC Theatres Distribution ran it with Variance Films in the U.S. and Canada and Piece of Magic abroad, playing all 540 U.S. AMC locations plus Cinemark and Regal, Cineplex in Canada and Cinépolis and Cinemex in Mexico — part of a global footprint of more than 8,000 cinemas across 110-plus territories. Domestically it topped Warner Bros.\' "One Battle After Another" (No. 2, about $11 million in its second weekend) and out-opened Dwayne Johnson\'s "The Smashing Machine" ($5.9 million), making it — by AMC\'s account — the only "non-film" theatrical event this century to finish a weekend at No. 1 in North America.\n\nAMC called it the biggest album-debut cinema event ever, domestic and global — a rerun of the distribution play she pioneered with The Eras Tour concert film in 2023, when she bypassed the studio system and took the tour film to AMC directly. That film opened far bigger ($92.8 million domestic); the release party\'s win was structural, not a bigger number — proof a big enough artist can rent the theatrical apparatus for a weekend and turn an album drop into a box-office event, no studio in the deal.',
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
        'moment:vault-tloas-all-12-tracks-debut-as-the-hot-100s-entire-top-12',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-1-334-million-vinyl-lps-in-seven-days-the-first-million-viny',
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
          'The week (charts dated Oct. 18, 2025) counted 3,479,500 in pure album sales plus 680.9 million on-demand streams — 4.002 million equivalent units in total, the largest single week for any album, by both equivalent units and pure sales, since Billboard began tracking by Luminate\'s modern methodology in 1991. It ran roughly 2.5 times her own previous personal best, Midnights\' 1.578 million units in 2022, and passed the two records it beat: Adele\'s 3.482 million-unit 25 (2015) and *NSYNC\'s 2.416 million No Strings Attached (2000). She\'d cleared the decade-old Adele mark within five days — a record many chart-watchers had assumed the streaming era made permanently unreachable.\n\nIt was also her 15th No. 1 album, breaking the three-way tie with Drake and Jay-Z for the most Billboard 200 chart-toppers among soloists — only The Beatles, at 19, remain ahead. Universal reported more than 5.5 million equivalent units globally in week one. Her reaction, via Billboard: "I\'ll cherish this feeling forever."\n\nThe composition explains the shape: only two things counted toward 4.002 million — the 3,479,500 pure copies and 522,600 streaming-equivalent units from those 680.9 million streams, with no tracks sold à la carte. The pure-sales side ran on collecting: 1.334 million of it was vinyl, driven by 38 editions (16 CDs, two deluxe CD-plus-clothing boxes, eight vinyl, a cassette, 11 digital), most release-week-only — a variant strategy that drew chart-inflation criticism. The 680.9 million streams set 2025\'s biggest album week but no all-time mark; her own Tortured Poets Department (891 million) still leads there. Abroad it opened at No. 1 in the UK (423,000 units, her biggest week there), Australia, Canada, New Zealand and Ireland. The theatrical Official Release Party that topped the weekend box office was a separate event, uncounted here. The front-loading showed a week later: it held No. 1 but fell to 338,000 units as pure sales collapsed 97% and streaming eased just 55%.',
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
          'The milestones stacked up hourly on Oct. 3. Before a note went public the album had already broken Spotify\'s all-time pre-save record — more than 6 million saves banked, past the mark her own Tortured Poets Department set in 2024. By midday it was 2025\'s most-streamed album in a single day, the record falling in under 11 hours; by RouteNote\'s tally of Spotify\'s figures the day closed near 251.5 million global streams.\n\nDay one also made "The Fate of Ophelia" the most-streamed song in a single day in Spotify history — RouteNote put it at 30.99 million, past her own "Fortnight." Across everything she has out, Oct. 3 was the single biggest streaming day for any artist in 2025 — about 309 million listens — and the second-biggest single-artist day Spotify has ever logged, behind only her own Tortured Poets release. The album\'s ~250 million single-day total is likewise second all-time to TTPD\'s 314 million: that mark\'s survival is the one release-week superlative Showgirl left standing. Deadline framed it as a competition with exactly one participant — the only albums anywhere near her numbers are her own.',
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
          'The push came from a stack of collectible pressings in the era\'s signature orange — multiple variants, retailer exclusives included, sold as objects to own as much as records to play. Forbes tracked the record falling within hours of release day, not at week\'s end: her own all-time vinyl mark of 859,000, set by The Tortured Poets Department in 2024, was gone almost immediately, and the week closed at 1.334 million LPs.\n\nNPR\'s analysis noted the number is less about turntables than fandom-as-collecting — a physical-object economy she has done more than anyone to revive, where a pressing in the right shade of orange is a fan artifact first and an audio format second. The vinyl haul was the engine of the pure-sales side of her 4-million-unit week, and the reason a 2025 blockbuster could post sales splits that look like the CD era.\n\nThe number sat atop a lineage she built and kept breaking: 859,000 (TTPD, 2024) had toppled 693,000 (1989 (Taylor\'s Version)), which beat 570,000 (Midnights) — every modern-era vinyl-week record since Luminate began tracking in 1991 has been hers, and Showgirl\'s 1.334 million is the first million ever counted, with TTPD\'s 859,000 now the No. 2 week behind it. Eight distinct vinyl variants drove it, the Target-exclusive "The Crowd Is Your King" among them. Vinyl was 1.334 million of the roughly 3.48 million pure copies inside the 4.002-million-unit week — the album led every format (CD, vinyl, cassette, digital) and finished 2025 as the year\'s top seller on each. The record was not only American: in the UK it moved about 125,000 LPs in week one, the fastest-selling vinyl album of the century and the biggest UK vinyl week since those records began in 1994, inside a 423,000-unit British debut.',
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
          'On the Hot 100 dated Oct. 18, 2025, the chart\'s top 12 and the album\'s 12-song tracklist were the same list, in order: "The Fate of Ophelia" (No. 1), "Opalite" (2), "Elizabeth Taylor" (3), "Father Figure" (4), "Wood" (5), "Wi$h Li$t" (6), "Actually Romantic" (7), "The Life of a Showgirl" feat. Sabrina Carpenter (8), "Eldest Daughter" (9), "Cancelled!" (10), "Ruin the Friendship" (11) and "Honey" (12) — with nothing else, no other artist or song, inside the top 12. Billboard called it the first album ever to place all its songs uninterrupted from the top of the chart on down.\n\n"The Fate of Ophelia" arrived as the 1,184th No. 1 in Hot 100 history and Swift\'s 13th career chart-topper — tying for the fourth-most ever — on 92.5 million official U.S. streams, the most for any title in a single week since streams became the metric\'s sole contributor in September 2020, plus 38.5 million in radio-airplay impressions. The week lifted her to 69 career top 10s, the most of any woman.\n\nShe first filled the entire top 10 with Midnights in November 2022, then outdid herself with The Tortured Poets Department\'s top-14 sweep in May 2024 — the only act ever to monopolize the top 10, now three times over. But the shape was unique. Midnights spilled 10 more debuts down to No. 45 (20 songs that week) and TTPD another 17 down to No. 55 (31 total); Showgirl\'s twelve tracks filled exactly the top 12 and stopped — a clean tracklist-equals-top-12 match possible only because she kept the album short.',
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
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-all-12-tracks-debut-as-the-hot-100s-entire-top-12',
        'moment:vault-tloas-spotifys-2025-single-day-streaming-record-falls-in-under-11-',
        'moment:vault-tloas-the-official-release-party-of-a-showgirl-turns-movie-theater',
        'moment:vault-tloas-opalite-follows-ophelia-to-no-1',
        'moment:vault-tloas-elizabeth-taylor-the-first-song-she-wrote-for-the-album',
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
          'Released Oct. 3, 2025 as the lead single and opening track, the song reworks Hamlet: where Millais\'s Ophelia (the muse was Pre-Raphaelite model Elizabeth Siddal) drowns, Swift imagined a version who instead "met someone who treated her well" and is pulled from the water. She has said she has a "fixation on Shakespeare characters that I fall in love with and I can\'t stand to see them meet a tragic demise," and named it the lead single when she announced the album on Kelce\'s New Heights podcast. The liner credits are Swift, Max Martin and Shellback alone — no other co-writer or sample — cut at Shellback Studios and MXM Studios in Stockholm between Eras Tour dates. It debuted atop the Billboard Hot 100 — her 13th No. 1 — and spent 10 non-consecutive weeks there, her longest-running No. 1, out-running "Anti-Hero."\n\nSwift wrote and directed the video herself, shot by cinematographer Rodrigo Prieto and choreographed by Eras Tour choreographer Mandy Moore, with Eras dancers (Jan Ravnik, Kam Saunders) returning; it premiered inside the theatrical Official Release Party of a Showgirl before its YouTube debut two days later, moving through vaudeville and showgirl tableaux — Marilyn-style stagecraft, 1960s go-go dancing, Busby Berkeley-scale synchronized-swim formations. The chorus choreography became a genuine trend, recreated by fans and by public figures from Australian PM Anthony Albanese (at a Melbourne radio station) to India\'s Shashi Tharoor.\n\nThe single was the era\'s commercial spine: it led the Billboard Global 200 for seven weeks and set Spotify\'s single-day song-streaming record on release day. Abroad it became her longest-running UK No. 1 (seven weeks, past "Anti-Hero"\'s six) and hit No. 1 in Australia, Canada (15 weeks) and Ireland (nine); BPI and ARIA each certified it double platinum. Critics engaged the opener directly: NPR\'s Ann Powers heard its "huge and buoyant" bass and a voice that "sounds smitten and a bit hungry."',
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
          'The song tells the story of a veteran performer named Kitty and the young singer studying her, and the casting does the subtext: Carpenter went from Eras Tour opener in 2023-24 to arena headliner in her own right by the time the album dropped. It was the pairing fans most wanted from the tracklist reveal on New Heights, and the reason the feature stayed the announcement\'s biggest talking point through release week.\n\nThe track doubles as the album\'s mission statement — the "life of a showgirl" the title promises turns out to be Kitty\'s hard-won stage wisdom, handed down the way the real Swift-Carpenter relationship played out in stadium wings for two years. The lyric sheet closes on a scripted curtain-call exchange between the two of them — Swift\'s "Give it up for the band / And the dancers / And of course, Sabrina," answered by Carpenter\'s "I love you, Taylor!" — laid over real crowd noise recorded at the final Eras Tour show in Vancouver, folding the tour\'s actual sound into the album\'s closing minutes. Ending the record on a duet with her own former opener made the succession theme explicit: the album about being a showgirl closes by introducing the next one.\n\nOn the Hot 100 dated Oct. 18, 2025 the title track debuted and peaked at No. 8 inside the album\'s record top-12 sweep, credited to Swift with Max Martin and Shellback — Carpenter a featured vocalist, not a co-writer. Swift confirmed the closing crowd roar is real: her Amazon Music intro says it "transports me back" to standing onstage for the last time on the Eras Tour (the Vancouver/BC Place date is tour record, not something she names in the audio). Rolling Stone heard the succession theme plainly, calling it Swift "passing the torch to the next generation of showgirls as she takes a bow," and Carpenter — who voices the fictional veteran "Kitty" — called Swift "so gracious." Closing on a guest duet isn\'t new (evermore ended on its Bon Iver title track), but doing it with a former tour opener is.',
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
          'Swift has not confirmed the song\'s subject — the Travis Kelce reading (opal as his October birthstone, the synthetic stone as self-made joy) is fan and critic interpretation, labeled as such — but she has described what it\'s about: forgiving yourself when life "didn\'t pan out the way you wanted it to," and giving yourself permission not to marry the first person you ever dated. Kelce, for his part, called it his favorite song on the album on New Heights. Musically it\'s the record\'s sunniest stretch — a disco-inflected Max Martin/Shellback production critics kept comparing to ABBA and Fleetwood Mac.\n\nIt had debuted at No. 2 behind "The Fate of Ophelia" in October; the formal single push, including a run of remixes (Chris Lake, BUNT., Skream, and Ely Oaks among them), landed in mid-February 2026, and on the chart dated Feb. 28, 2026 — its 20th chart week — it leapt from No. 8 to No. 1, replacing Bad Bunny\'s "DTMF." Slate\'s chart analysis of the February 2026 ascent noted the unusual shape of it: a second Hot 100 No. 1 from the same 12-track album, arriving months after release and months after its album-mate "The Fate of Ophelia" had wrapped its own 10-week run at the top.\n\nThe topping week was engineered, not streamed. Slate\'s Chris Molanphy showed the leap was almost all sales: across its versions "Opalite" sold 168,000 copies that week — 144,000 physical, 24,000 digital — while ranking only 17th in streaming and third on Radio Songs. Swift had planned the retail push all along (7-inch vinyl, dance remixes on CD, a 69-cent acoustic B-side) but held the shipment until the week after Bad Bunny\'s Super Bowl halftime show had boxed her out — because Billboard counts physical singles when they ship, not when fans order them. Molanphy\'s answer to his own "is it a real hit?" was yes — but a chart-scientist\'s hit, built from collectibles more than streams. It was Swift\'s 14th career No. 1, tying Rihanna behind only the Beatles (20) and Mariah Carey (19).',
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
        'moment:vault-tloas-the-final-show-the-full-vancouver-closer-streaming-at-last',
        'moment:vault-ttpd-the-eras-tour-takes-its-final-bow-in-vancouver',
        'moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel',
        'moment:vault-tloas-a-mint-green-briefcase-on-new-heights-album-no-12-announced-',
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
          'The docuseries covers the tour\'s full 2023-24 arc — the staging, the surprise-song scramble, the Kelce of it all — and functions as the era-bridge between TTPD\'s stadium years and the Showgirl era they produced: she wrote the new album on this tour\'s European leg. It doesn\'t flinch from the tour\'s hardest chapter, either: the opening episode deals with the foiled Vienna terror plot and its aftermath, the first time Swift has discussed it at length on camera.\n\nThe six episodes — "Welcome to the Eras Tour" and "Magic in the Eras" (Dec. 12), "Kismet" and "Thank You for the Lovely Bouquet" (Dec. 19), "Marjorie" and "Remember This Moment" (Dec. 23) — run 42-49 minutes each, created and narrated by Swift, directed by Don Argott and Sheena M. Joyce (Object & Animal). Guest artists slot in across the run: Ed Sheeran\'s London medley (ep. 1), Florence Welch on "Florida!!!" (ep. 2), Sabrina Carpenter (ep. 4), Gracie Abrams\'s mashup (ep. 5); Travis Kelce runs through the back half, including his tuxedoed "I Can Do It With a Broken Heart" cameo. Critics were warm — 88% on Rotten Tomatoes, 79 on Metacritic, The Hollywood Reporter calling it a "juicy tell-all." It was the No. 1 series on Disney+ globally within days, and Nielsen logged 377 million minutes watched in the pre-Christmas week — enough to sit a backstage documentary inside that week\'s overall streaming top ten. Where these episodes stay backstage, the same-day companion film The Final Show carries the complete Vancouver concert.',
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
        'moment:vault-ttpd-the-eras-tour-takes-its-final-bow-in-vancouver',
        'moment:vault-tloas-the-end-of-an-era-the-eras-tour-docuseries-lands-on-disney',
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
          'Paired with the End of an Era docuseries for the same-day premiere, the film preserves the tour\'s final setlist end-to-end — the version of the show that closed out the highest-grossing tour ever, a year after the last confetti fell in Vancouver. Where the 2023 theatrical film had to trim songs for runtime, the streaming cut runs the full Vancouver marathon, including the Tortured Poets segment added for the 2024 legs — the set Swift called the "Female Rage" chapter — that no prior filmed version contained. It captures that night\'s specific goodbyes, too: the guitar surprise was an "A Place in This World"/"New Romantics" mashup, and the piano send-off folded "Long Live" and "New Year\'s Day" into "The Manuscript" — a literal end-of-an-era note to close 149 shows.\n\nUnlike the 2023 film, this was a Disney+ exclusive with no theatrical window, and — director aside — a different hand: Glenn Weiss directed it (not Sam Wrench, who shot the 2023 cut), with Swift credited as a producer. No separate live album or soundtrack was released; the audio lives only inside the film. The pairing was a deliberate double release: the docuseries tells you what the tour cost to make and end, and The Final Show is the artifact itself, shot at BC Place on Dec. 8, 2024 — show 149 of 149. Together they turned mid-December 2025 into a Disney+ event weekend, and the concert film went on to earn five Emmy nominations the following summer — Outstanding Variety Special (Pre-Recorded), Directing and Picture Editing for a Variety Special, Sound Mixing, and Technical Direction and Camerawork.',
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
      title: '"Stevie Knicks" courtside: the Garden, three weeks before the wedding',
      snippet:
        'Courtside for NBA Finals Game 4 with Este and Alana Haim, in homemade Knicks-pun tees — hers reads "Stevie Knicks" — Taylor watches New York erase a 29-point deficit and steal it on a put-back with 1.2 seconds left. Three weeks later, same building: the wedding.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-nba-finals-game-4-haim-stevie-knicks-shirt-1236270180/',
      // Photo pass (#762 run 6, 2026-07-18): thumbnail = the courtside group
      // photo added below; page previously had no images.
      thumbnailUrl: 'https://cdn.nba.com/manage/2026/06/GettyImages_TSwift.jpg',
      moment: {
        context:
          'The shirts were Alana Haim\'s craft project — $3 Gildan tees from Michaels, hand-lettered in orange: "Stevie Knicks" for Taylor, "Knickleback" for Alana, "Knickol Kidman" for Este. Travis was at the Chiefs\' mandatory minicamp back in Kansas City, reduced to liking the courtside posts from afar.\n\nThe game earned the outfit: New York trailed San Antonio 81-52 in the third quarter and won 107-106 on OG Anunoby\'s put-back with 1.2 seconds left — the largest comeback in NBA Finals history, on the way to the Knicks\' first title in 53 years. Then the hindsight arrived: twenty-three days later, Taylor and Travis were married in that same building, with Stevie Nicks herself singing at the reception.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-nba-finals-game-4-haim-stevie-knicks-shirt-1236270180/',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-knicks-nba-finals-haim-1235575812/',
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
      year: 2026,
      month: 6,
      day: 19,
      category: 'sighting',
      // Rumor-tier pilot (2026-07-19): single-outlet TMZ reporting that Swift's
      // team never confirmed (the context already says so) — the loud
      // "Reported — not confirmed" banner makes that status unmissable.
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
          'TMZ reported the gathering the weekend of June 19-20, 2026 as a "bachelorette-style gathering centered around Taylor and her closest girlfriends" — separate from the Ocean House\'s own scheduled event that weekend, which the venue confirmed was for a different couple. The tells were logistical rather than official: a large tent rising on the Ocean House lawn, and longtime friends converging on the small Rhode Island town at once.\n\nThe location was its own callback. Watch Hill is the "holiday house" of the 2020 song "the last great american dynasty" — the Rebekah Harkness mansion Swift bought in 2013, the site of the Fourth of July parties of the 1989 era — so a pre-wedding weekend there read to fans as the personal-lore equivalent of a hometown send-off, two weeks before the Madison Square Garden ceremony. Neither Swift nor her team ever confirmed the party; the venue-level reporting here is TMZ\'s, labeled as such.',
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
            // Tent peaks and the walking couple sit center-right, just above and below the midline.
            focalPoint: '52% 45%',
          },
          {
            url: 'https://twt-thumbs.washtimes.com/media/image/2026/06/21/Swift_Wedding_Speculation_6953__c0-242-5784-3614_s885x516.jpg?18921fe33b20ba0427c28b6eeae09fd9ded1b3cc',
            credit: 'AP Photo/Robert F. Bukaty, via The Washington Times',
            caption: 'A security guard stands watch at Swift\'s Watch Hill "Holiday House" estate, June 20, 2026.',
            kind: 'primary',
            // The guard stands far left against the fence line, mid-height.
            focalPoint: '18% 40%',
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
          'The venue was the punchline and the point: after months of "destination wedding" speculation, the destination turned out to be Madison Square Garden — a 20,000-seat arena dressed for a wedding, with curtains hung across the glass entrance in the days before and a jumbotron outside reading "JUST&T MARRIED!" once it was done. Adam Sandler officiated and sang an original song for the couple at the ceremony. There were no bridesmaids or groomsmen: Austin Swift stood as his sister\'s Man of Honor, Jason Kelce as best man.\n\nBoth bride and groom wore custom Christian Dior Haute Couture, and Stevie Nicks — the elder-showgirl touchstone of Swift\'s own catalog — performed at the reception. The guest list, roughly 1,000 people, ran the full width of their two worlds: Hugh Grant, Jason Sudeikis, Ethan Hawke, Abby Wambach, Joe Buck, Benson Boone, Cooper Kupp, and Paulina Gretzky among them, per CBS News\'s reporting. What did not surface was the interior: no official photos of the ceremony or reception had been released as of the days after, leaving the arrivals, the curtained Garden, and the jumbotron as the event\'s entire public visual record.\n\nAccounts filled in the interior no photo showed: the arena floor built into a garden, peach-and-white at the ceremony and green-and-white beyond, reading personal vows from gold books for about 20 minutes. Adam Sandler\'s officiant song went untitled in reporting but guests called it "humorous and touching"; Paul McCartney played "I Want to Hold Your Hand," while Stevie Nicks\'s reception set was never documented. Favors were embroidered handkerchiefs bearing the couple\'s "T&T" monogram, the July 3 date and a "Blank Space" lyric — the same T&T play behind the "JusT&T Married" marquee. It spanned days: a ~100-guest rehearsal dinner at the Garden on July 2, then the ~1,000-guest ceremony July 3 into the early hours. Confirmed guests ran wider than first reported — among them Bradley Cooper, Zoë Kravitz, Steven Spielberg and Tom Brady.',
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
            status: 'unconfirmed',
            url: 'https://www.tmz.com/2026/06/30/taylor-swift-travis-kelce-building-castle-for-wedding-celebration/',
            note: 'No photos from inside the Garden have ever been released, so what the build-out actually looked like remains unconfirmed.',
            sourceTier: 'tabloid',
            // Lifecycle re-check 2026-07-20: still no interior photos or
            // official statement; the build-out remains unconfirmed.
            lastCheckedOn: '2026-07-20',
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
            note: 'A gossip-newsletter "source" claim about her release strategy — resolves once (and if) official photos surface and we can see the channel. As of this report, no official ceremony photos had been published.',
            sourceTier: 'tabloid',
            lastCheckedOn: '2026-07-20',
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
      title: 'The wedding gown: a custom Dior Haute Couture, styled by Joseph Cassell',
      snippet:
        "Jonathan Anderson's first celebrity couture bridal commission at Dior — a custom gown reportedly drawing on Elizabeth Taylor's 1950 wedding dress, worn with custom Christian Louboutin shoes and Cartier jewelry.",
      sourceUrl: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-wedding-dress-dior-jonathan-anderson-2-1236637523/',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift, Travis and longtime stylist Joseph Cassell worked directly with Jonathan Anderson and the Dior ateliers on Avenue Montaigne on an entirely custom design. The commission is now confirmed on both sides: publicist Tree Paine\'s wedding-night press release said both ceremony looks were "created by Christian Dior Haute Couture" by Anderson "in close collaboration with the bride and groom," calling it "the designer\'s first couture wedding dress for a world-renowned celebrity"; days later, at his Dior couture show, Anderson spoke on the record — "It was a joy to work with her. We became very good friends. It\'s an emotional thing doing someone\'s wedding." Official photos of the gown remain unreleased and the viral "first look" images were AI fakes (Snopes), so the gallery uses only clearly-labeled reference images. Harper\'s Bazaar reports Swift changed into a second gown for the reception (the house was not named).\n\nThe commission caps a whirlwind first year for Anderson at Dior: named creative director of womenswear and haute couture on June 2, 2025 — on top of Dior Men — he became the first designer since Christian Dior himself to lead all three lines, succeeding Maria Grazia Chiuri after his acclaimed run at Loewe. A widely reported but designer-unconfirmed touchstone is Elizabeth Taylor\'s gown for her May 6, 1950 wedding to Conrad "Nicky" Hilton: designed by MGM\'s Helen Rose and gifted by the studio, which turned the wedding into a publicity event for Father of the Bride — the film in which Rose also dressed the 18-year-old Elizabeth as a bride, the lace-and-veil look in the reference image here.\n\nThat Elizabeth Taylor echo completes a circle the album drew first: track two of The Life of a Showgirl is named for her. Anderson did not confirm the reference. Per Tree Paine\'s release and WWD, the finishing pieces were custom Christian Louboutin shoes and Cartier jewelry; the specific styles were not disclosed.',
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
      year: 2025,
      month: 12,
      day: 7,
      category: 'fashion',
      title: 'Taylor and Selena Gomez coordinate opulent winter coats at Arrowhead',
      snippet:
        'A Miu Miu checkered bomber for Taylor, all-black shearling-trimmed for Selena — the two friends layered up for Gomez\'s first-ever Chiefs game, a Dec. 7 loss to the Texans.',
      sourceUrl: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-selena-gomez-kansas-city-chiefs-houston-texans-game-winter-coats/',
      // Photo pass (2026-07-20): was null (no agency photo found the first
      // pass) — now points at the real Dec. 7 suite photo, see moment.photos.
      thumbnailUrl:
        'https://s.yimg.com/lo/mysterio/api/51607632d8b138ca2eb5ef4309f5f62efba2de679c41c5aa011b6eea7ffc78ff/lightyear_networkapi/resizefill_w976;quality_80;format_webp/https:%2F%2Fmedia.zenfs.com%2Fen%2Fpeople_218%2F6f5cc6c4b72bc346bb5078ba6b322161',
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
        // Photo pass #762 run 9 (2026-07-18): added the Getty tour photo THR
        // ran as the hero of its own Emmy-nominations story (THR's wp-content
        // CDN; curl-verified 200 image/jpeg 1440x810, downloaded and viewed).
        // Caption keeps it generic to the tour since Getty's frame isn't
        // dated to the Vancouver finale. Both images viewed for focal points.
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
      slug: 'showgirl-grammy-eligibility-window-miss',
      significance: 'notable', // a real, documented trade-off in the release calendar with a full award-cycle consequence (docs/decisions.md, 2026-07-19)
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
      },
    },
    {
      slug: 'showgirl-engagement-announcement',
      // Pull-quote for the derived End Game thread card (stage 3, 2026-07-19).
      pullQuote: '“Your English teacher and your gym teacher are getting married.”',
      significance: 'defining', // the direct precursor to the wedding, one of the most-repeated cultural moments of 2025 (docs/decisions.md, 2026-07-19)
      threadIds: ['the-proposal'],
      relatedIds: [
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
        context:
          'The couple made it official themselves on Aug. 26, 2025 — two weeks after Swift used Kelce\'s New Heights podcast to reveal The Life of a Showgirl — in a single joint Instagram post rather than a statement to any outlet. The carousel ran five photos from a flower-filled garden proposal, one a close-up of the ring, under Swift\'s caption: "Your English teacher and your gym teacher are getting married 🧨" — a line that became one of the year\'s most-repeated. The photos show the scale of the staging: a floral arch and urns overflowing with pink-and-white blooms deep in a wooded garden, Kelce in navy and Swift in a striped summer dress.\n\nThe ring, shown in close-up in the post, is an Old Mine Cut brilliant diamond — an elongated cushion-cut stone of undisclosed size (expert guesses ranged from about 7 to 15 carats, most clustering near 8 to 10), set in warm yellow gold — designed by Kelce together with Kindred Lubeck, the goldsmith, hand engraver and vintage-jewelry collector behind New York\'s Artifex Fine Jewelry; Lubeck was later invited to the couple\'s wedding. The post itself is the primary document of the moment, cited below, and the caption\'s teacher framing became era canon — quoted back at the couple everywhere from morning shows to the wedding\'s own coverage ten months later.\n\nThe post rewrote Instagram\'s records: about 14 million likes in its first hour and over a million reposts within six — the platform\'s most-reposted post ever — passing 46 million likes by early September. The proposal came ~two weeks earlier, around Aug. 10, 2025, in a flower-filled garden at Kelce\'s Missouri home (over an Eagles practice weekend, his father Ed said; exact date unconfirmed). On-the-record congratulations followed from the Kansas City Chiefs ("Today is a fairytale"), the NFL and Brittany Mahomes. The closing dynamite emoji went officially unexplained but fits the couple\'s running "T&T"/"TNT" initials motif — the play that later lit the "JusT&T Married" marquee.',
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
          'The Aug. 26, 2025 announcement photos were a fashion story in miniature: a $319.99 Polo Ralph Lauren silk-blend dress — vertical black stripes over a creamy linen skirt — with Louis Vuitton\'s caramel-brown Isola sandals, a diamond-lined Cartier watch, heart-shaped earrings, and a deliberately minimalist manicure that kept every eye on the old mine-cut Artifex ring.\n\nTravis coordinated in a Ralph Lauren black polo, khaki shorts, and leather loafers for the same garden shoot, staged under an archway of roses and hydrangeas — one frame catching him mid-kneel. The soft, summer-neutral palette read as intentional: engagement photos styled like the quiet opposite of a stadium spectacle.\n\nThe pieces have since been catalogued: the caramel Louis Vuitton Isola sandals retail at $930, the diamond-lined watch is a discontinued yellow-gold Cartier Santos Demoiselle, and the heart jewelry is by Foundrae (outlets differ on the exact piece and its price). Swift posted the photos to Instagram herself; they carry only a "Taylor Swift" credit, with no outside photographer or stylist named. The $319.99 Polo Ralph Lauren dress then became a case study in the "Swift effect" — it sold out across Ralph Lauren\'s own site within about 20 minutes of the post, and resale listings soon climbed past $450.',
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
            // Same tall crowd frame as the companion sighting item: face high-right.
            focalPoint: '65% 21%',
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
          'The album spent nearly every week at No. 1 from its October debut through the new year — through Wrapped season, through a holiday chart where Bing Crosby posted his biggest streaming week ever at No. 2, through its own 10th and 11th week milestones Billboard tracked one by one — ceding the top spot only once, for a single week in early December, when Stray Kids\' EP "Just Do It" opened strong before Showgirl reclaimed No. 1. Holding the top spot across December is still the chart\'s hardest endurance test — a record seven Christmas albums crowded the top 10 that season, per Billboard, and none of them budged it for more than that one week.\n\nTwelve nonconsecutive weeks made it her second-longest run at No. 1 ever, behind only The Tortured Poets Department\'s 17-week 2024 reign, and the album was still on top when Luminate crowned it 2025\'s most-consumed album in January — a holiday quarter that turned the release-week fireworks into a sustained occupation.',
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
          'The Times\' list, published April 28, 2026, was assembled from more than 250 music insiders and six of its own critics — unranked, and putting her alongside Bob Dylan, Dolly Parton, Jay-Z, Kendrick Lamar, Missy Elliott, and Bad Bunny. The accompanying video interview is the part fans kept: an uninterrupted half-hour where the only subject is the songwriting.\n\nThe takeaways travel well. Country storytelling pulled her in first, but the other early wire was emo — Dashboard Confessional and Fall Out Boy get named checks. Her collaboration rule: "May the best idea win... I don\'t care if it came from you, you or me. If it\'s better, that\'s what goes in the song" — adding "I do kind of like it when people challenge me on something." And on the fandom\'s favorite sport, she pushed back harder than she ever has: "When it gets a little bit weird for me is when people act like it\'s sort of like a paternity test... That dude didn\'t write the song. I did."\n\nThe timing made it land as the opening beat of a craft-canonization spring: six weeks later she\'d be the youngest woman ever inducted into the Songwriters Hall of Fame.',
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
      title: 'The youngest woman in the Songwriters Hall of Fame',
      snippet:
        'At 36, Taylor becomes the youngest woman ever inducted into the Songwriters Hall of Fame — only Stevie Wonder got there younger. Steven Spielberg handles the surprise introduction, and Travis and both moms watch from her table, three weeks before the wedding.',
      sourceUrl: 'https://www.pbs.org/newshour/arts/taylor-swift-becomes-the-youngest-woman-inducted-into-the-songwriters-hall-of-fame-at-age-36',
      thumbnailUrl:
        'https://d3i6fh83elv35t.cloudfront.net/static/2026/06/2026-06-11T222809Z_1091184995_RC2YRLAQU168_RTRMADP_3_AWARDS-SONGWRITERS-HALL-OF-FAME-1024x683.jpg',
      moment: {
        context:
          'The June 11 ceremony at New York\'s Marriott Marquis put her in a class of 2026 that included Alanis Morissette, Kenny Loggins, and KISS\'s Gene Simmons and Paul Stanley — and put her in the record books twice: youngest woman ever inducted, and second-youngest inductee in the Hall\'s history behind Stevie Wonder, who got in at 32 in 1983. Of all the institutions to canonize her mid-era, this one honored the craft underneath everything else: the writing.\n\nHer speech ran past the twenty-minute mark, and the room got the songwriter version of her origin story — she held back tears thanking her family for "uprooting their entire lives" to Nashville to bet on her. Spielberg\'s introduction was her own doing, in a way: when the Hall asked which of her heroes she\'d want presenting, she named him. And the seating chart told the engagement-year story on its own — Travis, Andrea Swift, and Donna Kelce at her table, twenty-two days before the Madison Square Garden wedding.',
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
          'Three days after the Madison Square Garden wedding, a case that had run since 2024 ended in a single order. Kimberly Marasco, a Florida poet acting pro se, first sued in April 2024 — a $100 small-claims filing in St. Lucie County (No. 2024SC001385) that was removed to federal court (S.D. Fla., No. 2:24-cv-14153, before Judge Aileen Cannon) and amended by that October to demand more than $7 million. It was not her first attempt: the operative complaint, Cannon noted, closely mirrored an earlier one Marasco had already lost. On July 6, 2026 the judge dismissed it — this time with prejudice, so it cannot be amended and refiled — against Taylor, producers Jack Antonoff and Aaron Dessner, Republic Records and Universal Music Group.\n\nMarasco claimed more than a dozen songs borrowed from her poetry — "Down Bad" and "I Can Do It With a Broken Heart" from The Tortured Poets Department, but also "The Man," "The Great War" and "Invisible String," reaching back across Midnights, folklore and evermore (the Dessner records, which is why he was named). Cannon\'s order weighed not whether the songs resembled the poems but whether there was anything there to copy: she concluded "that Plaintiff\'s poems do not contain protectable expression and that, regardless, Plaintiff has failed to plausibly plead copying," the alleged overlaps being "quintessential themes, concepts and isolated words" copyright does not protect. The order also noted Marasco\'s concession that one of her books had sold roughly 3,000 copies worldwide, none actively promoted — the access problem underneath the legal one.\n\nMarasco said she disagrees and intends to appeal to the Eleventh Circuit, so the docket may not be fully closed. But as of the July 6 order the case is over at the district level — the quietest possible bookend to the loudest week of her year.',
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
      title: 'Four songs in the Adult Contemporary top 10 — a first in the chart’s 65 years',
      snippet:
        'On the July 18 chart Taylor held Nos. 7, 8, 9 and 10 on Billboard’s Adult Contemporary ranking — the first artist ever to take four of the top 10 in a single week with music that isn’t seasonal.',
      sourceUrl:
        'https://www.billboard.com/music/chart-beat/taylor-swift-adult-contemporary-4-in-top-10-1236291740/',
      thumbnailUrl: null,
      moment: {
        context:
          'Billboard’s Adult Contemporary chart has been published continuously since the issue dated July 17, 1961. On the chart dated July 18, 2026 — sixty-five years and a day later — Taylor took four of its top 10 at once: "The Fate of Ophelia" at No. 7, "Opalite" at No. 8, "I Knew It, I Knew You" holding at its No. 9 peak, and "Elizabeth Taylor" at No. 10.\n\nNo artist had done that before with music that isn’t seasonal, and the qualifier is the whole record rather than a technicality. Michael Bublé got there first, across three weeks of the 2011 holidays — two weeks with four songs in the top 10 and one with five, No. 1 included — but every one of them came off his Christmas album, which is a format that behaves like nothing else on the chart. Strip the tinsel out and the top of Adult Contemporary had never belonged to one artist four times over until this week.\n\nThe four are not all from one record, which is the quietly interesting part. "The Fate of Ophelia," "Opalite" and "Elizabeth Taylor" come from The Life of a Showgirl; "I Knew It, I Knew You" is from the Toy Story 5 soundtrack. Adult Contemporary is a slow chart by design — songs climb it over months and stay — so a week like this is less a launch than an accumulation, the sound of four separate releases all still working at once.\n\nIt brings her to 23 top 10s on the ranking, nine of them No. 1s.',
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
      moment: {
        context:
          'The concert film of the Eras Tour’s final night — Taylor Swift: The Eras Tour: The Final Show, which streamed on Disney+ — landed five nominations when the 78th Emmy nominations were announced on July 8, 2026: Outstanding Variety Special (Pre-Recorded), a directing nod for Glenn Weiss, Outstanding Picture Editing for Variety Programming, Outstanding Sound Mixing for a Variety Series or Special, and Outstanding Technical Direction and Camerawork for a Special.\n\nTaylor is credited on the special as both performer and producer — Taylor Swift Productions made it, in association with Silent House — so the nominations attach to her personally, and they are her first Emmy nominations in more than a decade. They are not her first Emmy outright: back in 2015 she won Outstanding Creative Achievement in Interactive Media for the AMEX Unstaged: Taylor Swift Experience, the 360-degree app built around the "Blank Space" video, as its artist and executive producer. What is new this time is the Television Academy recognizing her on-camera performing work — and it is the film of the record-breaking Eras Tour that got her there.',
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
        ],
        // No photo: the nominations announcement has no photography of its own,
        // and a stand-in performance still would illustrate nothing that
        // happened here. Same call as the Marasco and donation items below.
        photos: [],
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
          'Operation Breakthrough runs an early-education and family-support center in Kansas City, describing its mission as giving children in poverty a “safe, loving and educational environment” while backing their families through advocacy and emergency aid. Over the 2025 holidays, Taylor made a donation to it — the kind of low-key giving she has folded into her time in Kansas City since her relationship with Travis Kelce became public in 2023.\n\nThe organization made the gift public itself, thanking her on Instagram: “Thank you @taylorswift for supporting Operation Breakthrough. We are so grateful for your kindness and for championing creativity, education, and opportunity for our over 750 students.” Neither Billboard nor the follow-up coverage put a dollar figure on it, and none was announced — what is on the record is the act and the charity’s thanks, not the size of the check.\n\nThe nonprofit is one Kelce already works with: his Eighty-Seven & Running foundation funds its Ignition Lab, a STEM program for teenagers. Taylor’s gift read as her own gesture toward the same cause — one thread in a season of Kansas City giving rather than a headline she went looking for.',
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
        ],
        // No photo: a private donation has no photography of its own, and the
        // charity's own thank-you post isn't the event — a stand-in shot would
        // illustrate nothing that happened. Same call as the chart items above.
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
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-tloas-1", label: "Era announced", kind: "life" },
      snippet: "The Life of a Showgirl is revealed live on Travis Kelce’s \"New Heights\" podcast — a hard turn from ink into glitter.",
      hiddenClue: { clue: "The announcement leaned hard on the color orange — a shade barely used before.", payoff: "Orange became the era’s signature, blanketing every teaser and cover in warm footlight glow." },
      moment: {
        context: "After the monochrome hush of the last era, the reveal comes not from a stage or a cryptic post but from a guest chair on her fiancé’s football podcast — itself a sign of how public the era would be.\n\nThe announcement lands in warm orange and gold: a showgirl era, all sparkle and spectacle, reframing everything that came before as the build-up to a curtain call.",
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
      snippet: "The twelfth studio album arrives: opulent, theatrical, and unapologetically bright.",
      moment: {
        context: "The album trades diary pages for the stage — feathers, footlights, and the glittering armor of a performer who has seen it all.\n\nProduced with Max Martin and Shellback — their first new-album collaboration with her since reputation — it is a victory lap dressed as a cabaret: knowing, warm, and dazzling.",
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
      title: "“The Fate of Ophelia” video premieres",
      snippet: "The self-directed lead-single video debuts on YouTube after its theatrical-only premiere two days earlier.",
      video: { youtubeId: "ko70cExuzZM", title: "Taylor Swift - The Fate of Ophelia (Official Music Video)" },
      moment: {
        context: "Written and directed by Taylor Swift, the video moves through a string of theatrical costume changes and sets, in keeping with the album’s showgirl framing.\n\nIt had already premiered on the big screen as part of the release-party film before arriving on YouTube for the wider audience.",
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
      title: "Orange sequins and feathers",
      snippet: "The visual language: burnt-orange rhinestones, marabou, and spotlight sparkle.",
      moment: {
        context: "Showgirl glamour defines the styling — sequins, feathers, and a warm theatrical glow in every frame.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "tloas-debut-chart",
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
        context: "The Life of a Showgirl moved north of 4 million album-equivalent units in its opening week, the biggest sales week any album has ever posted.\n\nIt became her 15th number-one album on the Billboard 200, breaking a tie with Drake and Jay-Z for the most chart-toppers among solo acts.",
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
      month: 1,
      day: 12,
      category: "music",
      title: "“Opalite” arrives as the second single",
      snippet: "A time-slip music video follows a lonesome character through the 1990s toward a gem-hued reinvention.",
      video: { youtubeId: "1FVF-9KQiPo", title: "Taylor Swift - Opalite (Official Music Video)" },
      moment: {
        context: "The video for \"Opalite\" casts Taylor as a wistful, cat-loving figure decades removed from the stage, before the song’s glow pulls her back into color.\n\nReleased as the second single, it kept the era’s pastel-orange visual thread going into the new year.",
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
      year: 2026,
      month: 3,
      day: 9,
      category: "music",
      tags: ["Fashion"],
      title: "“Elizabeth Taylor” goes to radio",
      snippet: "The album’s third single, named for the screen icon, arrives at radio with its own official video.",
      video: { youtubeId: "WqbJT_vC0rs", title: "Taylor Swift - Elizabeth Taylor (Official Music Video)" },
      moment: {
        context: "The song went to US hot adult contemporary radio first, followed a day later by a contemporary hit radio push, extending the album’s single cycle five months after release.\n\nA \"So Glamorous Cabaret Version\" and full digital package followed later that month, keeping the showgirl motif alive well into 2026.",
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
