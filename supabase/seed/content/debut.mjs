// Vault content — debut era.
//
// First batch: October 2006, the album's only wavetop month. Every claim
// verified against its cited source directly. See
// docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first) authoring model this follows.
//
// A business/chart-legacy item (the album's 157-week/longest-charting-
// album-of-the-2000s record) was researched but not included — couldn't
// find a second independent source beyond Wikipedia this session (several
// candidates were blocked or didn't carry the specific figure). Add once a
// working second source is found; don't lower the two-source bar to force
// it in.

export default {
  eraSlug: 'debut',
  items: [
    {
      year: 2006,
      month: 6,
      day: 19,
      category: 'music',
      title: 'The math-class idea behind "Tim McGraw"',
      snippet: 'The idea for her debut single came to her in freshman-year math class.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Tim_McGraw_(song)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b7/Taylor_Swift_-_Tim_McGraw.png',
      moment: {
        context:
          "She started singing \"When you think Tim McGraw\" to herself in freshman-year math class — the boyfriend was a senior about to leave for college, and the song became a list of things that would make him remember her. She finished it with co-writer Liz Rose at a piano after school in about fifteen minutes; her verdict, per Songfacts: \"It may be the best fifteen minutes I've ever experienced.\"\n\nRose has always handed her the credit, saying Taylor arrived with the idea and the melody and knew exactly what she wanted — and Taylor insisted it open the record: \"This song means so much to me, that's why we wanted it to be the first track on the album.\"",
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Tim_McGraw_(song)' },
          { outlet: 'Songfacts', url: 'https://www.songfacts.com/facts/taylor-swift/tim-mcgraw' },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/b/b7/Taylor_Swift_-_Tim_McGraw.png',
            focalPoint: '28% 38%',
            credit: 'Big Machine Records (single cover art)',
          },
          // Photo pass #762 (2026-07-27): a live companion to the cover art —
          // three days before this single's June 19, 2006 release. Verified
          // via Wikimedia Commons (HTTP 200 + image/jpeg, downloaded and
          // viewed); the file's own Commons description confirms the date
          // and venue.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/c/c0/Taylor_Swift.jpg',
            focalPoint: '50% 18%',
            credit: 'Dwight McCann, CC BY-SA 2.5, via Wikimedia Commons',
            caption: 'Performing at the Maverick Saloon & Grill in Santa Maria, California, June 16, 2006 — three days before "Tim McGraw" came out.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'willow-island-madison-2006',
      year: 2006,
      month: 8,
      day: 4,
      category: 'sighting',
      title: 'A free set at Willow Island, near the bottom of the bill',
      snippet:
        'Six weeks after her first single, a 16-year-old played about ten of her own songs for a crowd of roughly 60 at a Madison radio-station party.',
      sourceUrl:
        'https://captimes.com/entertainment/music/when-taylor-swift-played-a-free-madison-show-20-years-ago/article_b4d3dfcb-4dc2-4b23-a305-5468971f8ac5.html',
      thumbnailUrl: null,
      moment: {
        context:
          'Aug. 4, 2006: "Tim McGraw" had been at country radio for about six weeks, the debut album was still two months out, and a 16-year-old took the 4:45 p.m. Friday slot — near the bottom of a six-act national lineup — at Willow Island in Madison, Wisconsin, for country station Q106\'s free birthday party on the Brat Fest grounds. She played roughly ten of her own songs, among them "Picture to Burn," "Our Song" and "I\'d Lie," and closed on her single, to a crowd The Cap Times\' Tom Alesia puts at "60 or so." Her mother Andrea had driven her and a hired guitarist up from Nashville that morning.\n\nMadison kept a soft spot for her. On Oct. 29, 2007 — the album out, "Our Song" climbing, a Brad Paisley arena tour just ahead — she came back to the Madison Marriott West, where Q106 named her "Madison\'s choice for country music\'s best new artist" and handed her a glass statue in front of about a thousand fans. One of them, Lenora Lawrence, still has the cowboy hat Taylor signed "love love love," curled around with stars and twirls — a small souvenir of the fifteen months between a radio-park afternoon for sixty people and the awards this career was about to start collecting.',
        sources: [
          {
            outlet: 'The Cap Times',
            url: 'https://captimes.com/entertainment/music/when-taylor-swift-played-a-free-madison-show-20-years-ago/article_b4d3dfcb-4dc2-4b23-a305-5468971f8ac5.html',
          },
        ],
        // No freely licensed image of the 2006 Willow Island set exists (the
        // article's photos are outlet/contributor-credited, not reusable-host),
        // so this stays honest era-context: a genuine, already-verified 2006
        // public-domain appearance shot — not the Willow Island afternoon
        // itself. Vault Run 2026-08-07 (Content Shift lane, Closes #1832).
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Taylorswiftphoenixchecker500111206.JPG',
            credit: 'Wikimedia Commons (public domain)',
            caption:
              'A real 2006 appearance — curly hair and a printed dress, the same first-year-signed-artist stretch as the Madison show, though not that afternoon.',
            kind: 'archival',
            focalPoint: '68% 35%',
          },
        ],
      },
    },
    {
      year: 2006,
      month: 9,
      day: 1,
      category: 'sighting',
      significance: 'notable', // a real, sourced first step onto country music's most sacred stage, weeks before the album that made her famous (docs/decisions.md, 2026-07-19)
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-debut-0", label: "Grand Ole Opry debut", kind: "life" },
      title: 'Her Grand Ole Opry debut, in a sundress at 16',
      snippet:
        'A white sundress, natural curls, and "Tim McGraw" — before the album that made her famous had even come out.',
      sourceUrl: 'https://tasteofcountry.com/taylor-swift-grand-ole-opry-debut/',
      thumbnailUrl: null,
      moment: {
        context:
          'Sept. 1, 2006: "Tim McGraw" had been at country radio for barely ten weeks, the album was still almost two months away, and the newest signing at a just-launched independent label walked onto country music\'s most sacred stage to sing her only single. Taste of Country\'s retrospective is blunt about the odds — at the time, "the notion of a teenage girl succeeding in country music seemed pretty far-fetched."\n\nThe bet paid off fast enough that she spent the next several years as a regular on the Opry stage.',
        sources: [
          { outlet: 'Taste of Country', url: 'https://tasteofcountry.com/taylor-swift-grand-ole-opry-debut/' },
          { outlet: 'The Boot', url: 'https://theboot.com/taylor-swift-grand-ole-opry-debut/' },
        ],
        // Photo pass (2026-07-19, defining-events-31-50): 6 added. No freely
        // licensed photo of the actual Sept. 1, 2006 debut exists, so this
        // stays honest era-context: the actual Opry House stage/building
        // (before and around the debut) plus two other real 2006-07
        // appearances, none claiming to be the debut night itself. All
        // curl-verified 200 + image/jpeg, downloaded and visually confirmed.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Taylor_Swift_%282007%29_retouched.jpg/1280px-Taylor_Swift_%282007%29_retouched.jpg',
            credit: 'Wikimedia Commons — Taylor Swift, 2007 (archival, era context; not the Opry debut)',
            kind: 'archival',
            focalPoint: '39% 23%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Grand_Ole_Opry_%2897056906%29.jpg',
            credit: 'Ken Lund / Wikimedia Commons, CC BY-SA 2.0',
            caption: 'The Grand Ole Opry House exterior, Feb. 2006 — seven months before her debut on this stage.',
            kind: 'reference',
            focalPoint: '50% 35%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Dolly_parton_grand_ole_opry.jpg',
            credit: 'Tech. Sgt. Cherie A. Thurlby, USAF (public domain)',
            caption: 'Dolly Parton performing on the actual Grand Ole Opry stage, under the same "GRAND OLE OPRY" roundel — the same stage Taylor debuted on, a different night.',
            kind: 'reference',
            focalPoint: '78% 55%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/5/52/101207-Nashville-GrandOleOpry-001.JPG',
            credit: "Bobak Ha'Eri / Wikimedia Commons, CC BY 3.0",
            caption: 'The Opry House grounds and garden entrance, October 2007.',
            kind: 'reference',
            focalPoint: '50% 40%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Grand_Ole_Opry_House_%28entrance_sign%29.jpg',
            credit: 'Abbie Myers / Wikimedia Commons, CC BY-SA 4.0',
            caption: 'The Opry House\'s lit entrance sign, 2008.',
            kind: 'reference',
            focalPoint: '50% 60%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Taylor_Swift_at_Yahoo_2007.jpg',
            credit: 'Brian Cantoni / Wikimedia Commons, CC BY 2.0',
            caption: 'Holding a certified-sales plaque for the debut album at a Yahoo event, May 16, 2007.',
            kind: 'archival',
            focalPoint: '48% 30%',
          },
        ],
      },
    },
    {
      year: 2007,
      month: 11,
      day: 7,
      category: 'business',
      significance: 'notable', // her first industry-body recognition, the trophy her later CMA wins are counted from (docs/decisions.md, 2026-07-19)
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-debut-3", label: "First CMA Award", kind: "award" },
      title: 'Wins her first CMA Award — the Horizon Award',
      snippet:
        'Her first career CMA Award, the Horizon Award, at the 41st CMA Awards on Nov. 7, 2007 — the trophy now known as New Artist of the Year.',
      sourceUrl: 'https://www.cbsnews.com/news/taylor-swift-reacts-to-cmas-win/',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Swift%2C_Taylor_%282007%29.jpg',
      moment: {
        context:
          'At the 41st CMA Awards in Nashville, she took the Horizon Award over a nominee class of Jason Aldean, Rodney Atkins, Little Big Town, and Kellie Pickler — and delivered the acceptance line that dates the whole era: "This is definitely the highlight of my senior year."\n\nThe Horizon trophy, since renamed New Artist of the Year, was the first of the dozen career CMA Awards CBS would eventually count — handed to a 17-year-old who was, as the speech says, still technically in her senior year.',
        sources: [
          { outlet: 'CBS News', url: 'https://www.cbsnews.com/news/taylor-swift-reacts-to-cmas-win/' },
          { outlet: 'Forbes', url: 'https://www.forbes.com/pictures/geeg45eilhf/2007-success-is-on-the/' },
          { outlet: 'The Boot', url: 'https://theboot.com/cma-awards-winners-list/' },
          // Fan-archive footage of the win + "Our Song" performance —
          // oEmbed-verified 2026-08-12 (see candidates/youtube-appearances.mjs).
          { outlet: 'YouTube — lionheart33026 (fan archive)', url: 'https://www.youtube.com/watch?v=6Ak1OMIGC1c' },
        ],
        // Photo pass (2026-07-19, defining-events-31-50): 6 added. No further
        // freely licensed photo of the Nov. 7, 2007 ceremony itself was found
        // on Commons, so these add the actual award venue (Gaylord
        // Entertainment Center/Sommet Center, renamed Bridgestone Arena in
        // 2010 — same building) plus other real, dated 2007 appearances. All
        // curl-verified 200 + image/jpeg, downloaded and visually confirmed.
        // Kevin Stream 1 (#751, 2026-07-23): dropped the Getty comp-image CDN's
        // watermarked press-room comp (banned host) — the moment keeps its 5
        // freely licensed photos; thumbnail repointed to the Aug. 2007 shot.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Gaylord_Entertainment_Center_2005-12-07.jpg',
            credit: 'Wonderdawg777 / Wikimedia Commons, CC BY 2.0',
            caption: 'An aerial view of the Gaylord Entertainment Center — renamed Sommet Center in 2007, the arena where the 41st CMA Awards were held — Dec. 2005.',
            kind: 'reference',
            focalPoint: '35% 45%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Bridgestone_Arena_%2897058907%29.jpg',
            credit: 'Ken Lund / Wikimedia Commons, CC BY-SA 2.0',
            caption: 'A street-level view of the same downtown Nashville arena, Feb. 2006.',
            kind: 'reference',
            focalPoint: '45% 40%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Swift%2C_Taylor_%282007%29.jpg',
            credit: 'minds-eye / Wikimedia Commons, CC BY-SA 2.0',
            caption: 'Performing three months before the CMA win, Aug. 10, 2007.',
            kind: 'archival',
            focalPoint: '50% 25%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/TaylorSwift4.jpg',
            credit: 'Brian Cantoni / Wikimedia Commons, CC BY 2.0',
            caption: 'Performing at a separate May 16, 2007 Yahoo appearance the same year.',
            kind: 'archival',
            focalPoint: '48% 25%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Terry_%26_Filo_honor_country_music_star_Taylor_Swift_1.jpg',
            credit: 'Yahoo! (CC BY 2.0), via Wikimedia Commons',
            caption: 'Onstage with Yahoo co-founder David Filo and then-CEO Terry Semel at the same May 16, 2007 appearance.',
            kind: 'archival',
            focalPoint: '43% 32%',
          },
        ],
      },
    },
    {
      year: 2006,
      month: 10,
      day: 24,
      category: 'music',
      title: "Mary's Song, borrowed from the couple next door",
      snippet: "A story of two neighbors who fell in love as kids and stayed married forever — inspired by an actual couple who lived next door.",
      sourceUrl: 'https://au.rollingstone.com/music/music-lists/taylor-swift-most-romantic-love-songs-list-82721/marys-song-oh-my-my-my-82725/',
      // Image-fix pass (2026-07-10): CIE #156 — old songfacts.com cover was a 145x145 low-res
      // file, visibly soft when scaled up. Swapped (thumbnail + moment photo) for Wikipedia's
      // 500x500 non-free cover file (curl 200, image/png; opened and viewed — correct debut cover).
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1f/Taylor_Swift_-_Taylor_Swift.png/500px-Taylor_Swift_-_Taylor_Swift.png',
      moment: {
        context:
          'The couple came over for dinner and told the story of how they\'d met as kids — and Taylor, then 16, turned it into the debut\'s only whole-life love story, written with Liz Rose and Brian Maher. Her full quote reads like a thesis statement for the album: "You can go to the grocery store and read the tabloids... it was really comforting to know that all I had to do was go home and look next door to see a perfect example of forever."\n\nThen the song disappeared: per Songfacts she didn\'t perform it again after 2008 until July 6, 2024, when it resurfaced in an Eras Tour surprise-song mashup in Amsterdam.',
        sources: [
          {
            outlet: 'Rolling Stone Australia',
            url: 'https://au.rollingstone.com/music/music-lists/taylor-swift-most-romantic-love-songs-list-82721/marys-song-oh-my-my-my-82725/',
          },
          { outlet: 'Songfacts', url: 'https://www.songfacts.com/facts/taylor-swift/marys-song-oh-my-my-my' },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added a period photo from three weeks
        // after the album (and this song) released — Commons PD-self, photographer-uploaded
        // Nov. 2006; downloaded and visually confirmed 2006-era Taylor. Focal points set
        // per image by viewing.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1f/Taylor_Swift_-_Taylor_Swift.png/500px-Taylor_Swift_-_Taylor_Swift.png',
            credit: 'Big Machine Records (debut album cover art, 500px Wikipedia file)',
            focalPoint: '60% 30%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Taylorswiftphoenixchecker500111206.JPG',
            credit: 'BHFeller / Wikimedia Commons, public domain',
            kind: 'archival',
            focalPoint: '47% 32%',
            caption: 'Sixteen-year-old Taylor — skull-print cowboy boots and all — backstage before singing the national anthem at Phoenix International Raceway, Nov. 12, 2006, three weeks after the debut album arrived.',
          },
        ],
      },
    },
    {
      year: 2006,
      month: 10,
      day: 24,
      category: 'music',
      title: "Should've Said No, written in 20 minutes",
      snippet: "Written the same week the album was mastered — the whole song took her 20 minutes, the chorus just five.",
      sourceUrl: "https://en.wikipedia.org/wiki/Should've_Said_No",
      thumbnailUrl: "https://i.ytimg.com/vi/v9bxXO9fj98/maxresdefault.jpg",
      moment: {
        context:
          "Written alone, two days before the album was mastered, and finished overnight with producer Nathan Chapman: \"It literally took me just 20 minutes to write,\" by her own account — about a boyfriend who'd cheated, with many lyrics lifted from the actual confrontation (\"I was living every line in this song at the time\"). She drew a line between it and her other kiss-off: where \"Picture to Burn\" was pure anger, this one was \"more of a moral statement.\"\n\nReleased as the album's fifth and final single in May 2008, it became her second Hot Country Songs No. 1 — and when it hit the country top 10 that July, she became the first solo female artist in the chart's history (dating to 1964) with five top-10 country hits from a debut album.",
        sources: [
          { outlet: 'Wikipedia', url: "https://en.wikipedia.org/wiki/Should've_Said_No" },
          { outlet: 'Songfacts', url: 'https://www.songfacts.com/facts/taylor-swift/shouldve-said-no' },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added Brian Cantoni's debut-era photo
        // (Commons API-verified CC BY 2.0, EXIF-dated May 16, 2007; downloaded and visually
        // confirmed). Focal points set per image by viewing.
        // Low-res single-cover retired (issue #1715, 2026-08-26): official
        // video id v9bxXO9fj98 confirmed via YouTube oEmbed (author "Taylor
        // Swift"); maxresdefault curl-verified 200 image/jpeg, downloaded and viewed.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/v9bxXO9fj98/maxresdefault.jpg',
            credit: 'Taylor Swift / Big Machine Records, via YouTube',
            caption: 'A still from the official "Should\'ve Said No" video.',
            focalPoint: '50% 30%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Taylor_Swift_%282007%29_retouched.jpg/960px-Taylor_Swift_%282007%29_retouched.jpg',
            credit: 'Brian Cantoni / Wikimedia Commons, CC BY 2.0',
            kind: 'archival',
            focalPoint: '38% 22%',
            caption: 'Debut-era Taylor and her koa-wood Taylor guitar at an outdoor Yahoo headquarters set, May 16, 2007 — the album cycle that carried this song to its 2008 single release.',
          },
        ],
      },
    },
    {
      year: 2006,
      month: 10,
      day: 24,
      category: 'music',
      title: 'A Place in This World, written at 13',
      snippet: 'Written years before the album came out, after watching a TV special about Faith Hill\'s move to Nashville.',
      sourceUrl: 'https://en.wikipedia.org/wiki/A_Place_in_This_World',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Swift%2C_Taylor_%282007%29.jpg',
      moment: {
        context:
          'She wrote it at 13 while still living in Pennsylvania and making regular trips to Nashville, working out whether a music career was even reachable:\n\n"It was tough trying to find out how I was going to get where I wanted to go... I\'m really happy this is on the album, because I feel like I finally figured it out."',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/A_Place_in_This_World' },
          { outlet: 'Songfacts', url: 'https://www.songfacts.com/facts/taylor-swift/a-place-in-this-world' },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added an Aug. 2007 live shot (Commons
        // API-verified CC BY-SA 2.0, minds-eye; downloaded and visually confirmed debut-era
        // Taylor onstage). Focal points set per image by viewing.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Swift%2C_Taylor_%282007%29.jpg',
            credit: 'minds-eye / Wikimedia Commons, CC BY-SA 2.0',
            kind: 'archival',
            focalPoint: '50% 20%',
            caption: 'Performing live in August 2007, mid-debut era — the album cycle where the song she wrote at 13 finally found its audience.',
          },
        ],
      },
    },
    {
      // Cross-links (Stage 3, 2026-07-24): the four "Our Song" moments — its
      // origin, both No. 1 markers, and the CMT wins — now interlink so the
      // "Keep reading" rail traces the song's whole arc.
      relatedIds: [
        'moment:vault-debut-our-song-written-for-the-ninth-grade-talent-show',
        'moment:vault-debut-our-song-hits-number-one',
        'moment:vault-debut-our-song-wins-two-trophies-at-the-2008-cmt-music-awards',
      ],
      year: 2007,
      month: 12,
      day: 22,
      category: 'business',
      title: 'Our Song becomes her first No. 1',
      snippet:
        'Six weeks atop Hot Country Songs — the first of what would become seven country No. 1s before her pivot to pop.',
      sourceUrl: 'https://www.billboard.com/pro/taylor-swift-our-song-this-week-in-billboard-chart-history-2007/',
      thumbnailUrl: 'https://www.wideopencountry.com/wp-content/uploads/sites/4/2021/04/Untitled-design-241.png?fit=798%2C526',
      moment: {
        context:
          'In December 2007 it began a six-week reign at No. 1 on Hot Country Songs — a song she had written alone for her ninth-grade talent show, which made her, per Wikipedia\'s chart accounting, the youngest person ever to single-handedly write and sing a Hot Country Songs No. 1.\n\nIts jump to the top from No. 6 was the chart\'s biggest leap since 1998. She never claimed to have seen it coming: "I never thought it was going to be on an album... I never thought it would be a single, I never thought it would go No. 1."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-our-song-this-week-in-billboard-chart-history-2007/',
          },
          {
            outlet: 'Wide Open Country',
            url: 'https://www.wideopencountry.com/our-song-taylor-swift/',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Our_Song_(Taylor_Swift_song)' },
        ],
        photos: [
          {
            url: 'https://www.wideopencountry.com/wp-content/uploads/sites/4/2021/04/Untitled-design-241.png?fit=798%2C526',
            credit: 'Associated Press',
            // Focal point set 2026-07-18 by viewing (798x526): face upper-left
            // of center, sparkly guitar fills the lower half.
            focalPoint: '34% 20%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-performance-2007-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Ethan Miller/ACMA/Getty Images for ACMA',
            // Focal point set 2026-07-18 by viewing (942x628): face top-center-left
            // at the mic, koa guitar across the frame below.
            focalPoint: '42% 16%',
          },
        ],
      },
    },

    // --- Sightings depth pass (2026-07-05)
    {
      year: 2006,
      month: 8,
      category: 'sighting',
      title: "An unknown 16-year-old, performing for Yahoo's 'Who's Next?' showcase",
      snippet:
        "Months before her album dropped, a 16-year-old Taylor Swift performed at a Yahoo Music showcase — reworking one of her own lyrics mid-song into a shout-out to Yahoo.",
      sourceUrl: 'https://www.yahoo.com/entertainment/taylor-swift-performed-at-yahoo-2006-201948506.html',
      thumbnailUrl:
        'https://s.yimg.com/ny/api/res/1.2/8PYQ4NDvX3FrR_scm0lYQw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyNDI7aD02OTM7Y2Y9d2VicA--/https://s.yimg.com/os/creatr-uploaded-images/2023-10/8c1753b0-693b-11ee-b69e-d5b17b60c7bb',
      moment: {
        context:
          "Two months before \"Taylor Swift\" released on Oct. 24, 2006, she performed at Yahoo Entertainment as part of its \"Who's Next?\" artist program — a low-key industry showcase, not a concert or red carpet.\n\nMid-performance she swapped in a lyric namechecking Yahoo Music, a detail Yahoo's own retrospective still points to as evidence of how new and unpolished the moment was.",
        sources: [
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/taylor-swift-performed-at-yahoo-2006-201948506.html',
          },
        ],
        photos: [
          {
            url: 'https://s.yimg.com/ny/api/res/1.2/8PYQ4NDvX3FrR_scm0lYQw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyNDI7aD02OTM7Y2Y9d2VicA--/https://s.yimg.com/os/creatr-uploaded-images/2023-10/8c1753b0-693b-11ee-b69e-d5b17b60c7bb',
            credit: 'Yahoo via YouTube',
            focalPoint: '34% 45%',
          },
        ],
      },
    },
    {
      // Cross-link (Stage 3, 2026-07-30): the "Rascal Flatts" pair — the
      // diary entry the day she got the call, and the tour opening it led
      // to — now interlink.
      relatedIds: ['moment:vault-debut-her-first-arena-tour-opening-for-rascal-flatts-on-a-days-not'],
      year: 2006,
      month: 10,
      day: 18,
      category: 'sighting',
      title: "Her diary entry the day she got the call to open for Rascal Flatts",
      snippet:
        '"Oh my God. I am on the Rascal Flatts tour!" — her real, handwritten diary entry from Oct. 18, 2006, the day a fired opening act\'s bad luck became her first big tour break.',
      sourceUrl: 'https://tasteofcountry.com/taylor-swift-diary-entry-2006-rascal-flatts-tour/',
      // Image-fix pass (2026-07-10): CIE #154 — thumbnail shared the same broken collage URL as
      // the first moment photo below; both fixed together (see photos[] comment).
      thumbnailUrl: 'https://townsquare.media/site/204/files/2019/08/Taylor-Rascal-Flatts-Diary-Entry.jpg?w=980&q=75',
      moment: {
        context:
          'Rascal Flatts had just fired opener Eric Church from their "Me and My Gang" tour for repeatedly running long onstage. The opening it created went to 16-year-old Taylor, who got the call on Oct. 17, 2006 and wrote in her diary the next day: "Oh my God. I am on the Rascal Flatts tour! I got the call yesterday and I screamed louder than I can ever remember screaming before." She opened the tour\'s remaining dates that fall (Oct. 19-Nov. 3, 2006).\n\nYears later, when she earned her first gold record, she gave it to Church with a note: "Thanks for playing too long and too loud on the Flatts tour. I sincerely appreciate it."',
        sources: [
          { outlet: 'Taste of Country', url: 'https://tasteofcountry.com/taylor-swift-diary-entry-2006-rascal-flatts-tour/' },
        ],
        photos: [
          // Image-fix pass (2026-07-10): CIE #154 — removed the Taylor-Swift-Flatts.jpg photo: it
          // was a side-by-side collage (2019 Lover-era Taylor left, Rascal Flatts performing right),
          // ~13 years off-era and not a single photo. The diary-page photo below is on-topic and
          // stands alone; no replacement photo needed for this item.
          {
            url: 'https://townsquare.media/site/204/files/2019/08/Taylor-Rascal-Flatts-Diary-Entry.jpg?w=980&q=75',
            credit: "Taylor Swift's handwritten diary entry, Oct. 18, 2006",
          },
        ],
      },
    },
    {
      year: 2006,
      month: 11,
      day: 23,
      category: 'sighting',
      title: 'Singing the anthem at a Detroit Lions Thanksgiving game, 16 years old',
      snippet:
        '"It felt impossible for a place to be that big, I was sooo insanely nervous" — 16-year-old Taylor on singing the national anthem before a sold-out Ford Field on Thanksgiving Day, 2006.',
      sourceUrl:
        'https://www.billboard.com/music/music-news/taylor-swift-reminisces-2006-national-anthem-detroit-ford-field-1235351234/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/06/Taylor-Swift-National-Anthem-as-the-Detroit-Lions-2006-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'She sang the national anthem before the Detroit Lions hosted the Miami Dolphins on Thanksgiving Day, Nov. 23, 2006, at Ford Field — a solo, unaccompanied public appearance, a month after her debut album released, far from any stage show or red carpet.\n\nShe later called back to the moment onstage during her 2023 Eras Tour stop in Detroit, describing the stadium as "the biggest place I\'ve ever seen in my life."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-reminisces-2006-national-anthem-detroit-ford-field-1235351234/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/06/Taylor-Swift-National-Anthem-as-the-Detroit-Lions-2006-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Al Messerschmidt/Getty Images',
          },
        ],
      },
    },
    {
      year: 2007,
      month: 4,
      day: 5,
      category: 'sighting',
      title: 'Home to Pennsylvania to sing the anthem at a Reading Phillies game',
      snippet:
        'Cowboy boots, a knit hat, and a stripped-down national anthem on the grass behind home plate — a hometown moment at her local minor-league team\'s 2007 opening day.',
      sourceUrl: 'https://whyy.org/articles/taylor-swift-sports-performing-national-anthem-pennsylvania-phillies/',
      thumbnailUrl: 'https://media.nbcphiladelphia.com/2024/02/GettyImages-1315798658.jpg?quality=85&strip=all',
      moment: {
        context:
          'Originally from nearby Wyomissing, she returned home to sing the national anthem before the Reading Phillies\' 2007 opening game against the Harrisburg Senators at FirstEnergy Stadium on Thursday, April 5, 2007 — wearing cowboy boots and a knit hat, then triumphantly waving to the crowd alongside team mascot Screwball.\n\nA former Reading communications director later recalled that even then, the teenager "had some mound presence."',
        sources: [
          {
            outlet: 'WHYY',
            url: 'https://whyy.org/articles/taylor-swift-sports-performing-national-anthem-pennsylvania-phillies/',
          },
          {
            outlet: 'NBC Philadelphia',
            url: 'https://www.nbcphiladelphia.com/news/local/taylor-swifts-connections-to-sports-go-back-to-her-early-days-performing-the-national-anthem/3772093/',
          },
        ],
        photos: [
          {
            url: 'https://media.nbcphiladelphia.com/2024/02/GettyImages-1315798658.jpg?quality=85&strip=all',
            credit: 'Krissy Krummenacker/MediaNews Group/Reading Eagle via Getty Images',
          },
        ],
      },
    },
    {
      year: 2007,
      month: 12,
      day: 6,
      category: 'sighting',
      title: 'A hug for Dave Grohl the second she heard her first Grammy nomination',
      snippet:
        'Invited on as a presenter, 17-year-old Taylor heard Dave Grohl and Taylor Hawkins read her name for Best New Artist and couldn\'t contain it — stepping up to hug them both on the spot.',
      sourceUrl: 'https://www.thelist.com/1610914/taylor-swift-dave-grohl-drama-timeline/',
      thumbnailUrl:
        'https://www.thelist.com/img/gallery/a-timeline-of-the-drama-between-taylor-swift-and-dave-grohl/dave-grohl-announced-taylor-swifts-very-first-grammy-nomination-in-2008-1719439666.jpg',
      moment: {
        context:
          'At the 50th Grammy Awards nominations announcement at the Henry Fonda Music Box Theater on Dec. 6, 2007, 17-year-old Taylor was invited on as one of the presenters — and then heard her own name read out as a Best New Artist nominee, her first-ever Grammy nomination.\n\nShe couldn\'t hold back her excitement, stepping up to hug Foo Fighters\' Dave Grohl and Taylor Hawkins on the spot, drawing laughs from the room. (Amy Winehouse would go on to win the category at the ceremony two months later.)',
        sources: [
          { outlet: 'The List', url: 'https://www.thelist.com/1610914/taylor-swift-dave-grohl-drama-timeline/' },
        ],
        photos: [
          {
            url:
              'https://www.thelist.com/img/gallery/a-timeline-of-the-drama-between-taylor-swift-and-dave-grohl/dave-grohl-announced-taylor-swifts-very-first-grammy-nomination-in-2008-1719439666.jpg',
            credit: 'Kevin Winter/Getty Images',
            focalPoint: '55% 40%',
          },
        ],
      },
    },
    // --- Music/business/fashion/sighting depth pass 3 (2026-07-05)
    {
      // Cross-link (Stage 3, 2026-07-30): the "Teardrops on My Guitar" pair —
      // who the song was about, and the single's radio-to-pop crossover —
      // now interlink.
      relatedIds: ['moment:vault-debut-teardrops-on-my-guitar-goes-to-radio-and-then-to-pop'],
      year: 2006,
      month: 10,
      day: 24,
      category: 'music',
      title: 'Teardrops on My Guitar, and the classmate who showed up in her driveway',
      snippet:
        "Written about a real classmate named Drew, later publicly identified as Drew Hardwick -- who didn't know the song was about him until he showed up in her driveway years later.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Teardrops_on_My_Guitar',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e3/Teardrops_on_My_Guitar.PNG',
      moment: {
        context:
          'Taylor wrote the song about a classmate named Drew (widely reported, including by outlets covering his later arrest, as Drew Hardwick) who sat next to her in class -- she wanted to date him, but he kept confiding in her about another girl he liked instead. She turned the feeling into a song on the walk home from school.\n\nHe didn\'t realize the song was about him until, by her account: "About two years after the album came out in the States, he showed up in my driveway. Apparently he and his girlfriend had broken up so that was his first stop when he was back in town."',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Teardrops_on_My_Guitar' },
          { outlet: 'Songfacts', url: 'https://www.songfacts.com/facts/taylor-swift/teardrops-on-my-guitar' },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/drew-hardwick-taylor-swift-sang-122711087.html',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/e/e3/Teardrops_on_My_Guitar.PNG',
            // Photo pass #762 (2026-08-09): downloaded and viewed (316x316) —
            // her face sits in the upper-left quadrant of the cover.
            focalPoint: '35% 25%',
            credit: 'Big Machine Records (single cover art)',
          },
          // Photo pass #762 (2026-08-09): 2nd verified photo — official video
          // still. oEmbed-verified videoId xKCek6_dB0M belongs to the
          // official @TaylorSwift channel; i.ytimg.com is YouTube's own CDN;
          // curl 200 image/jpeg 640x480, downloaded and vision-confirmed.
          {
            url: 'https://i.ytimg.com/vi/xKCek6_dB0M/sddefault.jpg',
            // Face sits right-of-center, upper third.
            focalPoint: '68% 33%',
            credit: 'Big Machine Records / YouTube (official "Teardrops on My Guitar" music video still)',
            caption: 'A close-up still from the "Teardrops on My Guitar" video — Taylor holding the neck of an acoustic guitar as she sings.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2006,
      month: 10,
      day: 24,
      category: 'music',
      // Cross-link (candidate #1047, 2026-07-25): the grown-up Hendersonville High
      // regret ("Ruin the Friendship") rooted in the same school.
      // Cross-link (Stage 3, 2026-07-30): + the "Picture to Burn" single's
      // own top-10 chart run.
      relatedIds: [
        'moment:vault-tloas-ruin-the-friendship-a-regret-from-hendersonville-high',
        'moment:vault-debut-picture-to-burn-makes-it-four-straight-top-10s',
      ],
      title: 'Picture to Burn, and the line rewritten for radio',
      snippet:
        "Born from an after-school outburst -- \"I hate his stupid truck that he doesn't let me drive. He's such a redneck!\" -- that became the chorus of her only anger-driven song on the debut album.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Picture_to_Burn',
      thumbnailUrl: 'https://i.ytimg.com/vi/yCMqcFAigRg/sddefault.jpg',
      moment: {
        context:
          'Written with Liz Rose about a Hendersonville High classmate she\'d almost dated, who preferred another girl. Mid-session, she blurted out in frustration: "I hate his stupid truck that he doesn\'t let me drive. He\'s such a redneck! Oh my God!" -- and the line became the chorus.\n\nShe later told The Washington Post: "It\'s about a guy who didn\'t like me back, and I got really mad, you know?" The original album lyric -- "That\'s fine; I\'ll tell mine you\'re gay" -- was softened to "That\'s fine; you won\'t mind if I say" for the Feb. 4, 2008 country-radio single.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Picture_to_Burn' }],
        // Low-res single-cover retired (issue #1715, 2026-08-26): the 300x300
        // Wikipedia cover was below the quality floor; the video still below
        // (already verified) is now the sole/thumbnail image.
        photos: [
          // Photo pass #762 (2026-07-18): still from the official Picture to
          // Burn video (Trey Fanjoy) — Taylor fronting the band against the
          // amp wall. oEmbed-verified the video (yCMqcFAigRg) belongs to the
          // official @TaylorSwift channel; i.ytimg.com is YouTube's own CDN;
          // curl 200 image/jpeg 640x480, downloaded and vision-confirmed.
          {
            url: 'https://i.ytimg.com/vi/yCMqcFAigRg/sddefault.jpg',
            credit: 'Still from the official "Picture to Burn" music video (dir. Trey Fanjoy), Big Machine Records, via YouTube',
            caption: 'Fronting the band against a wall of amps in the "Picture to Burn" video — the revenge fantasy that turned an after-school outburst into a single.',
            kind: 'archival',
            // Focal point set by viewing: her face sits just left of center,
            // upper third, mic stand below.
            focalPoint: '47% 32%',
          },
        ],
      },
    },
    {
      year: 2007,
      month: 8,
      day: 21,
      category: 'sighting',
      title: 'A surprise duet with a 14-year-old AGT finalist, off a red-eye flight',
      snippet:
        "\"I can't wait to sing with Julienne...she's such a sweetheart\" -- Taylor flew overnight from a Rapid City tour stop to duet on the America's Got Talent finale.",
      sourceUrl: 'https://www.countrystandardtime.com/news/newsitem.asp?xid=851',
      thumbnailUrl: null,
      moment: {
        context:
          'Fourteen-year-old America\'s Got Talent finalist Julienne Irwin\'s wish, if she made the finals, was to duet with her favorite singer. Taylor agreed: "I can\'t wait to sing with Julienne on America\'s Got Talent. She\'s such a sweetheart, and I\'m so unbelievably honored that she chose me..."\n\nOn Aug. 21, 2007, she flew overnight from a tour date in Rapid City, South Dakota to Los Angeles for the live finale, where the pair performed "Teardrops on My Guitar" together, before Taylor continued on to a show in Minneapolis.',
        sources: [
          { outlet: 'Country Standard Time', url: 'https://www.countrystandardtime.com/news/newsitem.asp?xid=851' },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Julienne_Irwin' },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Swift%2C_Taylor_%282007%29_cropped_2.JPG',
            credit: 'Wikimedia Commons — Taylor Swift, 2007 (archival, era context; not the AGT finale)',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2008,
      month: 1,
      day: 17,
      category: 'sighting',
      title: 'Her first Ellen appearance, talking Sony/ATV at 14',
      snippet:
        'At 18, on Ellen for the first time -- talking about landing a Sony/ATV songwriting deal at 14 and the Nashville move that followed.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-ellen-appearances-8511659/',
      thumbnailUrl: null,
      moment: {
        context:
          'She made her first appearance on The Ellen DeGeneres Show on Jan. 17, 2008, at 18, as "Teardrops on My Guitar" climbed the charts -- discussing how she signed a songwriting deal with Sony/ATV Music Publishing at 14 and the move toward Nashville that followed. It was the first of what became a recurring guest spot across her career, through 2019.\n\nThe backstory she was telling is one of the era\'s foundational decisions: per Wikipedia, she signed with Sony/ATV Tree in 2004, at 14 the youngest writer in that publishing company\'s history, after her father moved the family from Pennsylvania to Hendersonville, Tennessee to give her a real shot at country. It came right after she\'d walked away from an RCA Records development deal rather than sit in development until 18 — she wanted her songs out while they still matched her teenage life, and that impatience is arguably the reason the debut album exists when it does.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-ellen-appearances-8511659/',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Taylor_Swift',
          },
          // The interview itself, on Ellen's own channel — oEmbed-verified
          // 2026-08-12 (see candidates/youtube-appearances.mjs).
          {
            outlet: 'YouTube — TheEllenShow',
            url: 'https://www.youtube.com/watch?v=vBgiDYBCuxY',
          },
        ],
        photos: [
          {
            // Image-fix pass (2026-07-10): CIE #158 — old photo (Taylor_in_Concert.jpg) was a noisy/
            // soft 330x285 amateur concert shot, the weakest image in the file. Replaced with a
            // sharper, already-verified 2007 Commons performance photo (curl 200, image/jpeg;
            // opened and viewed — clean shot of Taylor Swift performing live; CC BY-SA 2.0,
            // minds-eye/Sehome Bay via Wikimedia Commons).
            url: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Swift%2C_Taylor_%282007%29_cropped_2.JPG',
            credit: 'minds-eye/Sehome Bay, Wikimedia Commons (CC BY-SA 2.0) — Taylor Swift performing, 2007 (archival, era context; not the Ellen appearance)',
            kind: 'archival',
          },
        ],
      },
    },
    {
      // Cross-links (Stage 3, 2026-07-24): interlinks the four "Our Song"
      // moments so the "Keep reading" rail traces the song's whole arc.
      relatedIds: [
        'moment:vault-debut-our-song-written-for-the-ninth-grade-talent-show',
        'moment:vault-debut-our-song-hits-number-one',
        'moment:vault-debut-our-song-becomes-her-first-no-1',
      ],
      year: 2008,
      month: 4,
      day: 14,
      category: 'business',
      title: 'Our Song wins two trophies at the 2008 CMT Music Awards',
      snippet:
        '"Our Song" won both Video of the Year and Female Video of the Year at the 2008 CMT Music Awards -- with a cheeky thank-you to the stylist who did her hair and dresses.',
      sourceUrl: 'https://theboot.com/taylor-swift-wins-cmts-female-video-of-the-year/',
      // Photo dropped 2026-07-25 (#762 review, PR #1506): the prior image
      // hotlinked a Getty comp (gettyimages-80677442.jpg) via the
      // non-allowlisted host images.hellomagazine.com — the legal class
      // tracked in #935 — and was an off-moment shot anyway ("Picture to
      // Burn" performance, not the Our Song win). Left photo-less until an
      // allowlisted/reusable source for this exact moment is verified.
      thumbnailUrl: null,
      moment: {
        context:
          'At the 2008 CMT Music Awards on April 14, 2008 at Nashville\'s Curb Events Center, "Our Song" won both Video of the Year and Female Video of the Year, beating a field that included Carrie Underwood, LeAnn Rimes, Martina McBride, and Miranda Lambert.\n\nAccepting, 18-year-old Taylor joked: "I want to thank Sandy Spika for making all the dresses in that video and for straightening my hair, because that\'s not easy," before tearfully thanking the fans who\'d voted for her.',
        sources: [
          { outlet: 'The Boot', url: 'https://theboot.com/taylor-swift-wins-cmts-female-video-of-the-year/' },
        ],
      },
    },

    // --- Sightings depth pass (2026-07-05)
    {
      year: 2008,
      month: 6,
      day: 7,
      category: 'sighting',
      title: "An all-day meet-and-greet marathon at CMA Fest's Fan Fair",
      snippet:
        'Hours of posing for photos with fans, one after another, at the Big Machine Records booth in the Nashville Convention Center — an early instance of the marathon fan meet-and-greets she\'d become known for.',
      sourceUrl: 'https://www.yahoo.com/entertainment/music/articles/13-collaborations-helped-taylor-swift-100535520.html',
      thumbnailUrl:
        'https://s.yimg.com/ny/api/res/1.2/.aCciUUvVRppty__Am_qwA--/YXBwaWQ9aGlnaGxhbmRlcjt3PTk2MDtoPTYzMTtjZj13ZWJw/https://media.zenfs.com/en/the_tennessean_slideshows_726/e66c5e27810715572b9b8533bbc6a086',
      moment: {
        context:
          'On Day 3 of the CMA Music Festival, June 7, 2008, she held an all-day meet, greet, and autograph-signing session at the Big Machine Records booth inside the Fan Fair Exhibit Hall of the Nashville Convention Center, posing for photo after photo with fans in line.\n\nIt was an early version of the marathon meet-and-greets (including a later 13-hour signing session) she became known for.',
        sources: [
          {
            outlet: 'The Tennessean (via Yahoo)',
            url: 'https://www.yahoo.com/entertainment/music/articles/13-collaborations-helped-taylor-swift-100535520.html',
          },
        ],
        photos: [
          {
            url:
              'https://s.yimg.com/ny/api/res/1.2/.aCciUUvVRppty__Am_qwA--/YXBwaWQ9aGlnaGxhbmRlcjt3PTk2MDtoPTYzMTtjZj13ZWJw/https://media.zenfs.com/en/the_tennessean_slideshows_726/e66c5e27810715572b9b8533bbc6a086',
            credit: 'Jae S. Lee/The Tennessean',
            focalPoint: '55% 32%',
          },
        ],
      },
    },

    // --- Active-tier batch 2 (2026-07-04), per docs/decisions.md.
    {
      significance: 'notable', // became genuine pop-culture shorthand — referenced on Ellen and in her own later lyrics, not just a private breakup (docs/decisions.md, 2026-07-19)
      // Cross-link (Stage 3, 2026-07-30): the "Joe Jonas" pair — how the
      // relationship began, and the phone call that ended it — now interlink.
      relatedIds: ['moment:vault-debut-the-joe-jonas-chapter-begins'],
      year: 2008,
      month: 10,
      category: 'relationship',
      title: 'Joe Jonas ends it in a 27-second phone call',
      snippet: 'Three months of dating, over in less time than it takes to order coffee — she checked the call log after and said, "that\'s got to be a record."',
      sourceUrl: 'https://www.justjared.com/2008/11/06/joe-jonas-taylor-swift-phone-call-dump/',
      thumbnailUrl: null,
      moment: {
        context:
          'She told the story herself on Ellen that November: "He broke up with me over the phone in 25 seconds when I was 18" — then, after checking the call log, revised the count to 27. The composure was the point of the bit: "When I find that person that is right for me... I\'m not even going to remember the boy who broke up with me over the phone."\n\nFearless arrived that same month carrying "Forever & Always," written about watching the relationship fade — and she also told Us Weekly he\'d left for Camilla Belle ("That\'s why we broke up — because he met her"). A decade on, she recanted the takedown on the same couch, calling it "the most rebellious thing" she did as a teenager; the two eventually landed back at friendship.',
        sources: [
          { outlet: 'Just Jared', url: 'https://www.justjared.com/2008/11/06/joe-jonas-taylor-swift-phone-call-dump/' },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/taylor-swift-joe-jonas-ups-175948631.html',
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added a freely licensed
        // Commons fan photo of Joe Jonas on the Burnin' Up tour, July 5, 2008
        // — the summer the relationship began (the tour she guested on).
        // License (CC BY 2.0) + date verified via the Commons API; URL
        // verified HTTP 200 + image/jpeg, downloaded, and visually confirmed.
        // The Concert for Hope Commons alternative was rejected for a
        // baked-in uploader watermark.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/7/76/TaylorSwift_080208_photoby_Adam-Bielawski_%28cropped%29.jpg',
            credit: 'Adam Bielawski / Wikimedia Commons — Taylor Swift, Aug. 2, 2008 (archival, era context; not the relationship)',
            kind: 'archival',
            focalPoint: '52% 18%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Joe_Jonas.jpg',
            credit: 'Loreal Reid (CC BY 2.0) via Wikimedia Commons',
            caption:
              'Joe Jonas on the Burnin\' Up tour, July 5, 2008 — the summer the relationship began, on the tour she turned up to sing on (archival, era context).',
            kind: 'archival',
            focalPoint: '45% 14%',
          },
        ],
      },
    },

    // --- Thin-era top-up (2026-07-08, audit rollout PR 2): the era's empty
    // tour and release categories, filled with public record — she had no
    // headline tour, but 2006-2008 was two straight years of opening-act
    // runs, plus two exclusive EPs and the deluxe reissue. New items carry
    // the audit's additive provenance fields.
    {
      slug: 'rascal-flatts-opening-run',
      // Cross-link (Stage 3, 2026-07-30): sibling "Rascal Flatts" moment.
      relatedIds: ['moment:vault-debut-her-diary-entry-the-day-she-got-the-call-to-open-for-rascal-'],
      year: 2006,
      month: 10,
      day: 17,
      category: 'tour',
      title: 'Her first arena tour: opening for Rascal Flatts, on a day\'s notice',
      snippet:
        'Rascal Flatts fired opener Eric Church mid-tour for playing too long; the 16-year-old, days from releasing her debut album, got his slot. Years later she sent Church her first gold record — thanks for "playing too long and too loud."',
      sourceUrl: 'https://tasteofcountry.com/eric-church-rascal-flatts-tour-taylor-swift-secret-history/',
      thumbnailUrl: null,
      moment: {
        context:
          'The call came Oct. 17, 2006 — a week before her self-titled debut album dropped on Oct. 24 — and she was on the Me and My Gang Tour\'s remaining fall dates almost immediately, her first taste of arena crowds.\n\nChurch has told the story ever since, gold record and all: the note read "Thanks for playing too long and too loud on the Flatts tour. I sincerely appreciate it."',
        sources: [
          {
            outlet: 'Taste of Country',
            url: 'https://tasteofcountry.com/eric-church-rascal-flatts-tour-taylor-swift-secret-history/',
            source_title: "How Eric Church's Rascal Flatts Feud Helped Launch Taylor Swift",
            publisher: 'Taste of Country',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'Whiskey Riff',
            url: 'https://www.whiskeyriff.com/2025/09/22/eric-church-details-the-phone-call-he-got-from-taylor-swift-when-she-replaced-him-on-2006-rascal-flatts-tour/',
            source_title: 'Eric Church Details The Phone Call He Got From Taylor Swift When She Replaced Him On 2006 Rascal Flatts Tour',
            publisher: 'Whiskey Riff',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        photos: [
          {
            // Image-fix pass (2026-07-10): CIE #140 — old photo (Taylor-Swift-Flatts.jpg) was a
            // side-by-side collage: 2019 Lover-era Taylor (blunt bob, purple blazer, pastel
            // "Lover" guitar) left, Rascal Flatts performing right — ~13 years off-era and not a
            // single photo. This was this item's only photo, so per protocol it needed a verified
            // replacement rather than removal. Replaced with an already-verified 2007 Commons
            // photo (curl 200, image/jpeg; opened and viewed — Taylor Swift on stage at a mic
            // stand holding a gold-record plaque, white dress, era-correct; CC BY 2.0, Brian Cantoni).
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Taylor_Swift_at_Yahoo_2007_%28cropped%29.jpg',
            credit: 'Brian Cantoni, Wikimedia Commons (CC BY 2.0) — Taylor Swift, 2007 (archival, era context; not the Rascal Flatts tour)',
            kind: 'archival',
            // Focal point set 2026-07-18 by viewing (1409x1995 portrait): her
            // face is top-right; the framed gold record she holds fills the left.
            focalPoint: '70% 14%',
          },
          // Photo pass #762 (2026-07-18): public-domain shot of 16-year-old
          // Taylor at Phoenix International Raceway, EXIF-dated Nov. 12, 2006 —
          // squarely inside the Me and My Gang fall leg she'd just joined,
          // three weeks after the album dropped (era context; a NASCAR
          // appearance, not a Flatts date). Commons license API-verified
          // Public domain; curl 200 image/jpeg 873x660, vision-confirmed
          // (2006 Nextel Cup stage branding, red skull cowboy boots).
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Taylorswiftphoenixchecker500111206.JPG',
            credit: 'Wikimedia Commons (public domain) — Taylor Swift at Phoenix International Raceway, Nov. 12, 2006',
            caption: 'Sixteen years old, three weeks after the album release, waiting on a NASCAR stage in Phoenix mid-tour — sundress and red skull cowboy boots.',
            kind: 'archival',
            // Focal point set by viewing: she sits center frame, face just
            // above middle.
            focalPoint: '46% 30%',
          },
        ],
      },
    },
    {
      slug: 'george-strait-tour-opener',
      year: 2007,
      month: 1,
      day: 11,
      category: 'tour',
      title: "Opening for George Strait, country's biggest headliner",
      snippet:
        'January 2007: the new year started with a slot opening arenas for the King of Country on his 2007 tour — a 17-year-old with one album, playing to the most traditional crowds in the format.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      thumbnailUrl: null,
      moment: {
        context:
          'The run opened Jan. 11, 2007 at the Cajundome in Lafayette, Louisiana and carried through March 3, with Ronnie Milsap also on the bill; the announcement quoted a 17-year-old who could not quite believe the booking: "I couldn\'t imagine anything more thrilling than to be on a tour with George Strait... This is surreal! I keep pinching myself to make sure this isn\'t just a dream."\n\nIt kicked off a 2007 in which she basically never stopped opening — Strait in the winter, Brad Paisley in the fall, Tim McGraw and Faith Hill\'s stadium shows in the summer — the road apprenticeship that sold her debut album one market at a time.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
            source_title: 'Taylor Swift (album)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Country Standard Time',
            url: 'https://www.countrystandardtime.com/news/newsitem.asp?xid=283',
            source_title: 'Taylor Swift opens Strait tour',
            publisher: 'Country Standard Time',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 3,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Taylor_Swift_at_Yahoo_2007_%28cropped%29.jpg',
            credit: 'Wikimedia Commons — Taylor Swift, 2007 (archival, era context; not the Strait tour)',
            kind: 'archival',
            // Focal point set 2026-07-18 by viewing (1409x1995 portrait): face
            // top-right, gold-record plaque held out to the left. Same value as
            // this file's other occurrence (same image, same crop).
            focalPoint: '70% 14%',
          },
          // Photo pass #762 (2026-07-18): a different frame from the same
          // May 16, 2007 Cantoni set — in profile at the mic, koa Taylor
          // guitar, white sundress; the look she toured behind the debut with
          // that year (era context; not the Strait tour). Commons license
          // API-verified CC BY 2.0; curl 200 image/jpeg 1786x2011, EXIF-dated
          // 2007-05-16, vision-confirmed distinct from the plaque shot.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Taylor_Swift_at_Yahoo_2007_%282%29.jpg',
            credit: 'Brian Cantoni, Wikimedia Commons (CC BY 2.0) — Taylor Swift performing, May 2007',
            caption: 'Mid-song in profile, spring 2007 — deep in the opening-act year that started with the Strait arenas in January.',
            kind: 'archival',
            // Focal point set by viewing: face upper-left of the portrait
            // frame, guitar neck running down-right.
            focalPoint: '38% 18%',
          },
        ],
      },
    },
    {
      slug: 'soul2soul-mcgraw-hill-opener',
      year: 2007,
      month: 7,
      day: 9,
      category: 'tour',
      title: 'Opening for the actual Tim McGraw (and Faith Hill)',
      snippet:
        'A year after naming her debut single after him, she spent summer 2007 opening Tim McGraw and Faith Hill\'s Soul2Soul II dates — singing "Tim McGraw" on Tim McGraw\'s own tour.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Soul2Soul_II_Tour',
      thumbnailUrl: null,
      moment: {
        context:
          'The booking closed the loop on the best origin story in her catalog: the single that introduced her — written in math class about a McGraw song — now performed for his audiences at the select summer dates she opened.\n\nShe\'d first met him on camera at the 2007 ACM Awards, introducing herself with "Hi, I\'m Taylor" after performing the song to his face.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Soul2Soul_II_Tour',
            source_title: 'Soul2Soul II Tour',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
            source_title: 'Taylor Swift (album)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Swift%2C_Taylor_%282007%29_cropped_2.JPG',
            focalPoint: '38% 18%',
            credit: 'Wikimedia Commons — Taylor Swift, 2007 (archival, era context; not the Soul2Soul dates)',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'holiday-collection-ep',
      year: 2007,
      month: 10,
      day: 14,
      category: 'release',
      title: 'A holiday EP, one year into her career',
      snippet:
        'Sounds of the Season: The Taylor Swift Holiday Collection — six tracks, two originals ("Christmases When You Were Mine" and "Christmas Must Be Something More"), sold as a Target exclusive in October 2007.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Taylor_Swift_Holiday_Collection',
      thumbnailUrl: null,
      moment: {
        context:
          'Released Oct. 14, 2007 as "Sounds of the Season: The Taylor Swift Holiday Collection," a Target exclusive — six tracks produced by Nathan Chapman, mixing covers of "Last Christmas," "Santa Baby," "Silent Night," and "White Christmas" with two originals: "Christmases When You Were Mine" (co-written with Liz Rose and Chapman) and the solo-written "Christmas Must Be Something More." She was barely a year into her recording career and still opening arenas for other people.\n\nIt was an early example of the limited-exclusive retail play — and the holiday-season chart bump — that Big Machine leaned on all through the debut era. The EP got a wide re-release on Dec. 2, 2008 and another Target run in 2009; after the reissue it peaked at No. 20 on the Billboard 200, topped Top Holiday Albums, and went on to sell more than a million US copies, eventually certified platinum.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/The_Taylor_Swift_Holiday_Collection',
            source_title: 'The Taylor Swift Holiday Collection',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/7/72/The_Taylor_Swift_Holiday_Collection.png',
            credit: 'Big Machine Records (EP cover art)',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'debut-deluxe-edition',
      year: 2007,
      month: 11,
      day: 6,
      category: 'release',
      title: 'The deluxe edition adds three songs to the album that would not stop selling',
      snippet:
        'A year after release, Taylor Swift got a deluxe reissue with "I\'m Only Me When I\'m With You," "Invisible," and "A Perfectly Good Heart," plus the era\'s music videos, behind-the-scenes footage, and a recording of her first phone call with Tim McGraw — a mid-run repackage of a still-climbing album.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      thumbnailUrl: null,
      moment: {
        context:
          'The Nov. 6, 2007 deluxe reissue landed while the album was still climbing — she\'d win the CMA Horizon Award the following night, and the record went on to log 157 weeks on the Billboard 200, more than any other album of the 2000s decade. The three additions — "I\'m Only Me When I\'m With You," "Invisible," and "A Perfectly Good Heart" — stayed exclusive to the edition for years.\n\nThe package doubled as a fan artifact: it bundled a DVD of the era\'s music videos ("Tim McGraw," "Teardrops on My Guitar," and "Our Song"), behind-the-scenes footage, and a recording of her first phone conversation with Tim McGraw. Repackaging a still-selling debut to extend its shelf life — rather than rushing the follow-up — was exactly the patience the slow-burn "Taylor Swift" campaign was built on; "Fearless" was still a year away.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
            source_title: 'Taylor Swift (album)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1f/Taylor_Swift_-_Taylor_Swift.png/500px-Taylor_Swift_-_Taylor_Swift.png',
            credit: 'Big Machine Records (debut album cover art, 500px Wikipedia file)',
            kind: 'primary',
            focalPoint: '60% 35%',
          },
          // Photo pass #762 (2026-07-18): still from the official Teardrops on
          // My Guitar video — one of the three era videos ("Tim McGraw,"
          // "Teardrops," "Our Song") bundled on the deluxe edition's DVD, which
          // is the page's actual artifact. oEmbed-verified the video
          // (xKCek6_dB0M) belongs to the official @TaylorSwift channel;
          // i.ytimg.com is YouTube's own CDN; curl 200 image/jpeg 640x480,
          // downloaded and vision-confirmed (the bedroom close-up scene).
          {
            url: 'https://i.ytimg.com/vi/xKCek6_dB0M/sddefault.jpg',
            credit: 'Still from the official "Teardrops on My Guitar" music video (dir. Trey Fanjoy), Big Machine Records, via YouTube',
            caption: 'The "Teardrops on My Guitar" video — one of the three era videos bundled on the deluxe edition\'s DVD.',
            kind: 'archival',
            // Focal point set by viewing: face right of center, guitar neck
            // up the left edge.
            focalPoint: '62% 35%',
          },
        ],
      },
    },
    {
      slug: 'beautiful-eyes-ep',
      year: 2008,
      month: 7,
      day: 15,
      category: 'release',
      title: 'Beautiful Eyes: the Walmart EP that put her at No. 1 and No. 2 at once',
      snippet:
        'A six-track Walmart exclusive released July 15, 2008, to tide fans over before Fearless — it debuted at No. 1 on Top Country Albums with her debut sitting at No. 2, making her the first artist since LeAnn Rimes in 1997 to hold both top spots.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Beautiful_Eyes',
      thumbnailUrl: null,
      moment: {
        context:
          'A six-track Walmart exclusive released July 15, 2008, built from alternate versions plus two otherwise-unreleased songs, "Beautiful Eyes" and "I Heart ?." It debuted at No. 1 on Top Country Albums with her still-selling debut sitting right behind it at No. 2 — making her the first act since LeAnn Rimes in 1997 to hold both of the chart\'s top two spots at once.\n\nTaylor deliberately capped the pressing and said so in her own announcement, wary of overexposing fans a year out from her real second album: "I\'m only letting my record company make a small amount of these. The last thing I want any of you to think is that we are putting out too many releases." The whole point was a stopgap — something to hold the audience until "Fearless" that November.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Beautiful_Eyes',
            source_title: 'Beautiful Eyes',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/b/ba/Beautiful_Eyes.png',
            credit: 'Big Machine Records (EP cover art)',
            kind: 'primary',
            // Focal point set 2026-07-18 by viewing (300x300): face upper-left
            // against the orange floral background, red gerbera lower right.
            focalPoint: '35% 25%',
          },
          // Photo pass #762 (2026-07-18): live shot from Joliet, IL,
          // Feb. 8, 2008 — the EP-year era, headset mic and koa Taylor
          // guitar, months before the July 15 Walmart release. Commons
          // license API-verified CC BY-SA 3.0 (Adam Bielawski); curl 200
          // image/jpeg 800x536, downloaded and vision-confirmed.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/TaylorSwift_080208_photoby_Adam-Bielawski.jpg',
            credit: 'Adam Bielawski, Wikimedia Commons (CC BY-SA 3.0) — Taylor Swift performing in Joliet, IL, February 2008',
            caption: 'On stage in early 2008 — the stopgap-EP year, still touring the debut while Fearless waited in November.',
            kind: 'archival',
            // Focal point set by viewing: face top-center, guitar across the
            // lower half of the frame.
            focalPoint: '50% 22%',
          },
        ],
      },
    },

    // --- Deep timeline fill (2026-07-08, content/deep-a): singles-run release
    // history, the songs' origin stories, the opening-act year, and the era's
    // first awards. Every claim verified against its cited source this
    // session; business items carry two independent sources per the framework.
    {
      slug: 'tim-mcgraw-debut-single',
      // Cross-links added 2026-07-24 (ledger #1318, Answerer shard 2): the
      // Tim McGraw arc — where the idea came from, the album it led, the other
      // record-setting single, and the payoff of opening for McGraw himself.
      relatedIds: [
        'moment:vault-debut-the-math-class-idea-behind-tim-mcgraw',
        'moment:vault-debut-taylor-swift-the-album-arrives',
        'moment:vault-debut-our-song-hits-number-one',
        'moment:vault-debut-opening-for-the-actual-tim-mcgraw-and-faith-hill',
      ],
      year: 2006,
      month: 6,
      day: 19,
      category: 'release',
      title: 'The debut single named after somebody else',
      snippet:
        '"Tim McGraw" goes to country radio on June 19, 2006 — a 16-year-old\'s first single, named for another artist\'s song, out four months before anyone could buy her album.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Tim_McGraw_(song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/b/b7/Taylor_Swift_-_Tim_McGraw.png',
      moment: {
        context:
          'She got the idea in a high-school math class and finished it in about fifteen minutes with co-writer Liz Rose. The title points at McGraw\'s music, not at the boy the song is about: her favorite McGraw song — his 2004 "Can\'t Tell Me Nothin\'" — was the one she imagined an ex hearing years later, and fans who decode the capital letters hidden through the debut\'s liner notes find that same title spelled back. The subject was a senior boyfriend leaving for college, which is all Taylor herself has ever said about him; the "Brandon Borello" name attached to the song comes from the press, not from her.\n\nIt was the first single Scott Borchetta\'s brand-new Big Machine Records ever released — chosen after Taylor played it for him on ukulele — and pushed the slow, grassroots way everything moved in this era, with a country-radio and MySpace campaign urging fans to request it. The single debuted at No. 86 on the Hot 100 in September and didn\'t peak (No. 40) until January, while climbing to No. 6 on Hot Country Songs across 20 Hot 100 weeks; the RIAA has since certified it double platinum. The Trey Fanjoy video, shot at a Hendersonville cabin once owned by Johnny Cash, premiered in July 2006 — and Rolling Stone has since ranked the single No. 11 on its list of the greatest debut singles of all time.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Tim_McGraw_(song)',
            source_title: 'Tim McGraw (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Songfacts',
            url: 'https://www.songfacts.com/facts/taylor-swift/tim-mcgraw',
            source_title: 'Tim McGraw by Taylor Swift',
            publisher: 'Songfacts',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
          {
            outlet: 'American Songwriter',
            url: 'https://americansongwriter.com/on-this-day-2006-taylor-swift-released-debut-single-tim-mcgraw/',
            source_title: 'On This Day in 2006, Taylor Swift Released Her Debut Single "Tim McGraw"',
            publisher: 'American Songwriter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          {
            outlet: 'The Boot',
            url: 'https://theboot.com/taylor-swift-tim-mcgraw-song/',
            source_title: 'The Story Behind Taylor Swift\'s "Tim McGraw"',
            publisher: 'The Boot',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/b/b7/Taylor_Swift_-_Tim_McGraw.png',
            credit: 'Big Machine Records (single cover art)',
            // Focal point set 2026-07-18 by viewing (300x300): she leans
            // against the vintage truck on the left; face upper-left third.
            focalPoint: '28% 35%',
          },
          // Photo pass #762 (2026-07-18): still from the official Tim McGraw
          // video (Trey Fanjoy, shot at a Hendersonville cabin once owned by
          // Johnny Cash) — the close-up that opens the song's daydream.
          // oEmbed-verified the video (GkD20ajVxnY) belongs to the official
          // @TaylorSwift channel; i.ytimg.com is YouTube's own CDN; curl 200
          // image/jpeg 640x480, downloaded and vision-confirmed.
          {
            url: 'https://i.ytimg.com/vi/GkD20ajVxnY/sddefault.jpg',
            credit: 'Still from the official "Tim McGraw" music video (dir. Trey Fanjoy), Big Machine Records, via YouTube',
            caption: 'The debut video\'s dreamlike close-up — a 16-year-old\'s first single, premiered a month after the song hit radio.',
            kind: 'archival',
            // Focal point set by viewing: her face fills the frame, eyes just
            // above center-left.
            focalPoint: '47% 42%',
          },
        ],
      },
    },
    {
      slug: 'taylor-swift-album-release',
      significance: 'defining', // the origin of the whole 20-year catalog (docs/decisions.md, 2026-07-19)
      // Cross-links: kept the Fearless AOTY forward link and added the three
      // pages that answer this ledger's own questions (2026-07-21, ledger #1101)
      // — the lead single, the first No. 1, and the Bluebird Café signing night.
      relatedIds: [
        'moment:vault-fearless-fearless-makes-her-the-youngest-album-of-the-year-winner-for',
        'moment:vault-debut-tim-mcgraw-arrives',
        'moment:vault-debut-our-song-hits-number-one',
        'moment:vault-debut-the-bluebird-cafe-night-a-14-year-old-and-a-label-that-didnt',
      ],
      year: 2006,
      month: 10,
      day: 24,
      category: 'release',
      title: 'Taylor Swift, the album, arrives',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-debut-1", label: "Debut album", kind: "album" },
      snippet:
        'Oct. 24, 2006: the self-titled debut lands — eleven tracks, her name on every writing credit, released when she was 16.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      // Image-fix pass (2026-07-10): CIE #156 — old songfacts.com cover was a 145x145 low-res
      // file, most obvious on this hero release item. Swapped (thumbnail + moment photo) for
      // Wikipedia's 500x500 non-free cover file (curl 200, image/png; opened and viewed).
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1f/Taylor_Swift_-_Taylor_Swift.png/500px-Taylor_Swift_-_Taylor_Swift.png',
      moment: {
        context:
          'She wrote over 40 songs for it; 11 made the standard edition, three of them ("The Outside," "Should\'ve Said No," "Our Song") written entirely alone, with her demo producer Nathan Chapman kept on for nearly the whole record (cut across Nashville studios; Robert Ellis Orrall co-produced).\n\nIt sold 40,000 copies its first week and entered the Billboard 200 at No. 19 — then simply refused to leave, peaking at No. 5 fifteen months later and logging 157 weeks on the chart, the longest run of any album of the 2000s. She arrived, at 16, "with a fully formed idea of herself as an artist," in the words of Billboard\'s own tenth-anniversary retrospective — simply put.\n\nThe liner notes hid something too: read only the capitalized letters scattered through each printed lyric sheet and they spell out a short secret line per song ("Tim McGraw" hides "can\'t tell me nothin\'," "Our Song" "live in love") — a code she\'d repeat on every album booklet through 1989 (2014), starting here.\n\nIts lead single, "Tim McGraw" (June 19, 2006), was named after an established country star so an ex would think of her when he heard it; co-written with Liz Rose in a fifteen-minute after-school session, it reached No. 6 on Hot Country Songs and No. 40 on the Hot 100. Four more singles followed, and "Our Song" — which she wrote alone in the ninth grade — went to No. 1, making her the youngest person to single-handedly write and perform a Hot Country Songs chart-topper. The album existed at all because Scott Borchetta, having heard her at Nashville\'s Bluebird Café, made her the first artist signed to his new label, Big Machine, after she had walked away from an RCA development deal at 14. Reviews were warm if not rapturous (Metacritic 67; "the Tammy Wynette of t.m.i.," per Rolling Stone), and the record eventually certified 8x platinum — a debut that simply never stopped selling. Its green cover was shot by Andrew Orth, a family friend who had photographed her since before fame.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
            source_title: 'Taylor Swift (album)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-debut-album-anniversary-7550054/',
            source_title: "Taylor Swift's Debut Album Turns 10: A Track-by-Track Retrospective",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
          {
            outlet: 'Today.com',
            url: 'https://www.today.com/popculture/music/taylor-swift-easter-eggs-hidden-messages-rcna51887',
            source_title: "A Complete History of Taylor Swift's Best Easter Eggs",
            publisher: 'Today.com',
            source_type: 'reputable_press',
            accessed_at: '2026-07-19',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-tim-mcgraw-chart-rewind-2006-1236284818/',
            source_title: "Taylor Swift's 'Tim McGraw': Chart Rewind, 2006",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'American Songwriter',
            url: 'https://americansongwriter.com/on-this-day-2006-taylor-swift-released-debut-single-tim-mcgraw/',
            source_title: 'On This Day in 2006, Taylor Swift Released Her Debut Single "Tim McGraw"',
            publisher: 'American Songwriter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
          },
          {
            outlet: 'Metacritic',
            url: 'https://www.metacritic.com/music/taylor-swift/taylor-swift',
            source_title: 'Taylor Swift by Taylor Swift Reviews and Tracks',
            publisher: 'Metacritic',
            source_type: 'aggregator',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Taylor Swift Style',
            url: 'https://taylorswiftstyle.substack.com/p/taylor-swift-debut-era-photographer',
            source_title: 'Before the Eras: The Images That Introduced Taylor Swift',
            publisher: 'Taylor Swift Style (Substack)',
            source_type: 'specialist',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Debut cover + era photographer Andrew Orth, a family friend who shot her pre-fame; corroborated by his recalled "this thing is going to go places" quote and Taylor Swift Wiki.',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1f/Taylor_Swift_-_Taylor_Swift.png/500px-Taylor_Swift_-_Taylor_Swift.png',
            credit: 'Big Machine Records (debut album cover art, 500px Wikipedia file)',
            // Focal point set 2026-07-18 by viewing (500x500): her face sits
            // center-right of the square cover, hair filling the frame.
            focalPoint: '60% 35%',
          },
          // Photo pass #762 (2026-07-18): live shot dated Aug. 10, 2007 —
          // the album's marathon chart run in progress, played one market at
          // a time. Commons license API-verified CC BY-SA 2.0 (minds-eye);
          // curl 200 image/jpeg 819x546, downloaded and vision-confirmed
          // (black stage outfit, pink-cross guitar strap, koa Taylor).
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Swift%2C_Taylor_%282007%29.jpg',
            credit: 'minds-eye, Wikimedia Commons (CC BY-SA 2.0) — Taylor Swift performing live, August 2007',
            caption: 'Ten months after release and still on the road — the album sold one market at a time across a 157-week chart run.',
            kind: 'archival',
            // Focal point set by viewing: face top-center, guitar body across
            // the lower left.
            focalPoint: '48% 18%',
          },
          // Photo pass 2026-07-19 (10-defining-events, docs/decisions.md):
          // real, verified radio-tour photos from her fall 2006 Athens Drive
          // High School visit while promoting the debut. Curl 200 image/jpeg,
          // sourced via WRAL's 2023 retrospective.
          {
            url: 'https://images.wral.com/asset/entertainment/2023/10/03/21079762/3196033-TSwift3-DMID1-60h14ptlf-640x360.jpg',
            focalPoint: '46% 44%',
            credit: 'Submitted photo, via WRAL',
            caption: 'Taylor performs for students at Athens Drive High School in Raleigh during her fall 2006 debut-album radio tour.',
            kind: 'archival',
          },
          {
            url: 'https://images.wral.com/asset/entertainment/2023/10/03/21079771/3195989-TSwift_at_ADHS2-DMID1-60gyrf86l-640x360.jpg',
            focalPoint: '50% 40%',
            credit: 'Submitted photo, via WRAL',
            caption: 'Taylor poses with Athens Drive students after playing songs from her first album at the school in fall 2006.',
            kind: 'archival',
          },
          {
            url: 'https://images.wral.com/asset/entertainment/2023/10/03/21079653/3195973-TSwift_pic_cropped-DMID1-60gxv2dvw-640x360.jpg',
            focalPoint: '38% 36%',
            credit: 'Athens Drive High School, via WRAL',
            caption: 'Taylor poses with student Josh Boatwright after her stripped-down Athens Drive High School show in 2006.',
            kind: 'archival',
          },
          {
            url: 'https://images.wral.com/asset/entertainment/2023/10/06/21084702/3196262-TSwift_pic2-DMID1-60i4g7bch-640x360.jpg',
            focalPoint: '50% 36%',
            credit: 'Contributed photo, via WRAL',
            caption: 'Taylor poses with fans at Athens Drive High School while promoting her self-titled debut in 2006.',
            kind: 'archival',
          },
          {
            url: 'https://images.wral.com/asset/entertainment/2023/10/04/21081502/3196088-TSwift5-DMID1-60hd13tr0-640x360.jpg',
            focalPoint: '46% 44%',
            credit: 'Submitted photo, via WRAL',
            caption: 'Taylor meets another group of students after her fall 2006 Athens Drive High School performance.',
            kind: 'archival',
          },
        ],
        // Rumor Desk 2026-07-21: the debut's own 20th anniversary makes it the
        // structural home for the "debut Taylor's Version is coming" speculation
        // — a public-facing music/re-recording rumor (explicitly allowed by the
        // redlines), adjudicable because it resolves on an announcement or fades
        // when the anniversary window passes empty. No location involved.
        rumors: [
          {
            claim:
              'A set of small July 19 Spotify "canvas" color changes — a green background on "I Knew It, I Knew You," red on "Blank Space" — was read across entertainment outlets as an Easter-egg tease that an announcement of Taylor\'s Version of the 2006 self-titled debut was imminent, pointed toward the album\'s 20th anniversary later in 2026.',
            reportedBy: 'Bustle',
            reportedOn: '2026-07-20',
            status: 'unconfirmed',
            url: 'https://www.bustle.com/entertainment/taylor-swift-spotify-canvas-new-album-theories',
            note: 'Taylor and her team said nothing, and the canvas colors reportedly reverted next day. Forward-looking debut-re-recording claim: resolves if a debut Taylor\'s Version is announced, fades if the anniversary passes empty. Re-checked 2026-08-14: still unannounced (fan/tabloid chatter only), still live; the Oct 24 20th-anniversary window is still ahead.',
            sourceTier: 'tabloid',
            lastCheckedOn: '2026-08-14',
          },
          {
            // Rumor Desk 2026-07-24: a separate, earlier easter-egg wave than
            // the Spotify-canvas reading above, from a different outlet —
            // added as breadth of sourcing on the same forward-looking claim.
            claim:
              'A mid-June wave of easter-egg reading pointed the same way: Elite Daily noted Taylor\'s recent looks echoing her 2006 debut-promo photoshoot and a dress from Erdem\'s archive-inspired Fall 2026 collection — marking that label\'s 20th anniversary the same autumn the debut album turns 20 — as hints a debut Taylor\'s Version announcement is near.',
            reportedBy: 'Elite Daily (Hannah Kerns)',
            reportedOn: '2026-06-16',
            status: 'unconfirmed',
            url: 'https://www.elitedaily.com/entertainment/taylor-swift-album-13-clues-easter-eggs',
            note: 'Distinct from the Spotify-canvas reading above — an earlier easter-egg wave. The re-recording is on record (Taylor, June 2025: "already completely re-recorded" the debut); only the timing is unconfirmed. Re-checked 2026-08-14: still unannounced, kept live rather than faded — the Oct 24 anniversary catalyst has not passed and a fresher restock signal (below) landed Aug 7.',
            sourceTier: 'tabloid',
            lastCheckedOn: '2026-08-14',
          },
          {
            // Rumor Desk 2026-08-09: a more concrete signal than the earlier
            // easter-egg reads — an inventory-restock flag — but sourced to a
            // fan-run tracking bot and a tabloid write-up, not to Taylor. Same
            // forward-looking debut-re-record question, fresh data point.
            claim:
              'A fan-run inventory bot ("Taylor Swift Store Updates") flagged ~250,000 vinyl records restocked in Taylor\'s webstore warehouse — with per-unit weights suggesting multi-LP sets — which fans and tabloids read as a sign the finished re-recording of her 2006 debut could arrive around its 20th anniversary on Oct 24, 2026. A Target listing briefly showed SEO text for a "Taylor Swift 20" set.',
            reportedBy: 'Radar Online (Alex West), via AOL',
            reportedOn: '2026-08-07',
            status: 'unconfirmed',
            url: 'https://www.aol.com/articles/taylor-swift-allegedly-restocks-250-200000000.html',
            note: 'A more concrete signal than the easter-egg reads above, but sourced to a fan-bot and a tabloid write-up — Taylor and her team have said nothing. The re-recording is on record as finished (her May 2025 letter: "already completely re-recorded my entire debut album"); only the release is unannounced. Resolves on a debut Taylor\'s Version announcement, fades if anniversary passes empty. No location.',
            sourceTier: 'tabloid',
            lastCheckedOn: '2026-08-30',
          },
          {
            // Rumor Desk 2026-08-19: a different KIND of signal than the
            // easter-egg reads and the restock flag above — a quantified
            // prediction-market probability with a hard year-end deadline, which
            // makes it the cleanest-resolving entry on this forward-looking
            // debut-re-record question. Same public-facing music rumor (allowed
            // by the redlines); no location.
            claim:
              'Prediction-market bettors on Polymarket were pricing in roughly a 68% chance that Taylor would release a re-recorded Taylor\'s Version of her 2006 self-titled debut before the end of 2026.',
            reportedBy: 'PopCulture (Anthony Farris)',
            reportedOn: '2026-06-19',
            status: 'unconfirmed',
            url: 'https://popculture.com/celebrity/news/taylor-swift-spotted-at-recording-studio-amidst-new-taylors-version-speculation/',
            note: 'A distinct signal from the easter-egg and restock reads above: a quantified betting-market probability with a hard deadline. The debut re-record is on record as finished (Taylor, May 2025); only the release is unannounced. Resolves cleanly by 2026-12-31 — a debut Taylor\'s Version out or not — otherwise fades. No location.',
            sourceTier: 'social',
            lastCheckedOn: '2026-08-19',
          },
        ],
      },
    },
    {
      slug: 'teardrops-single-release',
      // Cross-link (Stage 3, 2026-07-30): sibling "Teardrops on My Guitar" moment.
      relatedIds: ['moment:vault-debut-teardrops-on-my-guitar-and-the-classmate-who-showed-up-in-he'],
      year: 2007,
      month: 2,
      day: 20,
      category: 'release',
      title: 'Teardrops on My Guitar goes to radio — and then to pop',
      snippet:
        'The second single, out February 2007, did what "Tim McGraw" couldn\'t: it crossed from country radio onto the pop chart.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Teardrops_on_My_Guitar',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/e/e3/Teardrops_on_My_Guitar.PNG',
      moment: {
        context:
          'The crossover was the tell. Big Machine sent it to country radio on Feb. 20, 2007 and then — the real move — to contemporary hit radio that November; it peaked at No. 2 on Hot Country Songs and No. 13 on the Billboard Hot 100, and its 21 weeks on the Pop Songs chart (reaching the top 10) made it her first pop crossover hit.\n\nIt won BMI\'s country Song of the Year in 2008, hung around the year-end charts two years running, and flagged, two years early, exactly where this career was headed.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Teardrops_on_My_Guitar',
            source_title: 'Teardrops on My Guitar',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Songfacts',
            url: 'https://www.songfacts.com/facts/taylor-swift/teardrops-on-my-guitar',
            source_title: 'Teardrops on My Guitar by Taylor Swift',
            publisher: 'Songfacts',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
        ],
        // Photo-enrichment pass (2026-07-29): added the official music-video
        // still (YouTube channel "Taylor Swift", oEmbed-verified) alongside
        // the single cover; both downloaded and vision-confirmed.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/e/e3/Teardrops_on_My_Guitar.PNG',
            focalPoint: '35% 22%',
            credit: 'Big Machine Records (single cover art)',
          },
          {
            url: 'https://i.ytimg.com/vi/xKCek6_dB0M/hqdefault.jpg',
            focalPoint: '68% 42%',
            credit: 'Big Machine Records / YouTube (official "Teardrops on My Guitar" music video still)',
            kind: 'video-still',
          },
        ],
      },
    },
    {
      slug: 'picture-to-burn-single',
      // Cross-link (Stage 3, 2026-07-30): sibling "Picture to Burn" moment.
      relatedIds: ['moment:vault-debut-picture-to-burn-and-the-line-rewritten-for-radio'],
      year: 2008,
      month: 2,
      day: 4,
      category: 'release',
      title: 'Picture to Burn makes it four straight top 10s',
      snippet:
        'The fourth single from the debut goes to country radio in February 2008 — with the original\'s sharpest line rewritten for airplay.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Picture_to_Burn',
      thumbnailUrl: 'https://i.ytimg.com/vi/yCMqcFAigRg/hqdefault.jpg',
      moment: {
        context:
          'Sent to country radio on Feb. 4, 2008, it peaked at No. 3 on Hot Country Songs and No. 28 on the Hot 100 — the fourth straight top-10 country single from an album that still hadn\'t stopped selling, with "Should\'ve Said No" still to come as the fifth that May.\n\nThe Trey Fanjoy video, premiered March 14, staged the revenge fantasy with real pyrotechnics at Nashville\'s Sommet Center and cast her actual high-school best friend, Abigail Anderson, in her backup band. It\'s the founding document of her "woman-scorned" mode, per Billboard\'s anniversary retrospective; the RIAA eventually certified it double platinum.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Picture_to_Burn',
            source_title: 'Picture to Burn',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-debut-album-anniversary-7550054/',
            source_title: "Taylor Swift's Debut Album Turns 10: A Track-by-Track Retrospective",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // Low-res single-cover retired (issue #1715, 2026-08-26): the 300x300
        // Wikipedia cover was below the quality floor; the official
        // music-video still below (already verified) is now the sole/
        // thumbnail image.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/yCMqcFAigRg/hqdefault.jpg',
            focalPoint: '48% 32%',
            credit: 'Big Machine Records / YouTube (official "Picture to Burn" music video still)',
            kind: 'video-still',
          },
        ],
      },
    },
    {
      slug: 'our-song-talent-show',
      // Cross-links (Stage 3, 2026-07-24): the origin of the arc — links the
      // other three "Our Song" moments so the "Keep reading" rail follows the
      // song from talent show to No. 1 to its CMT wins.
      relatedIds: [
        'moment:vault-debut-our-song-hits-number-one',
        'moment:vault-debut-our-song-becomes-her-first-no-1',
        'moment:vault-debut-our-song-wins-two-trophies-at-the-2008-cmt-music-awards',
      ],
      year: 2006,
      month: 10,
      day: 24,
      category: 'music',
      title: 'Our Song, written for the ninth-grade talent show',
      snippet:
        'She wrote "Our Song" to perform at her freshman-year talent show — and put it on the album after classmates spent weeks humming it back at her.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Our_Song_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'No song on the debut travelled further from its origin: a talent-show number she wrote alone as a ninth-grader, which classmates kept humming back at her long afterward — the signal that made her insist the label put it on the album.\n\nReleased to country radio on Sept. 10, 2007 as the third single, it jumped from No. 6 to No. 1 on Hot Country Songs (the chart\'s biggest leap to the top since 1998) and stayed there six weeks. The Trey Fanjoy video premiered on CMT that Sept. 24, sat atop the channel\'s rotation for seven weeks, and won Video of the Year at the 2008 CMT Music Awards.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Our_Song_(Taylor_Swift_song)',
            source_title: 'Our Song (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Songfacts',
            url: 'https://www.songfacts.com/facts/taylor-swift/our-song',
            source_title: 'Our Song by Taylor Swift',
            publisher: 'Songfacts',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/4/4e/Taylor_Swift_-_Our_Song.png',
            credit: 'Big Machine Records (single cover art)',
            kind: 'primary',
            // Focal point set 2026-07-18 by viewing (300x300): she sits atop
            // school desks in front of the chalkboard; face upper-center.
            focalPoint: '45% 20%',
          },
          // Photo pass #762 (2026-07-18): still from the official Our Song
          // video (Trey Fanjoy) — the flower-bed scene from the video that
          // topped CMT's rotation for seven weeks and won Video of the Year
          // at the 2008 CMT Music Awards. oEmbed-verified the video
          // (Jb2stN7kH28) belongs to the official @TaylorSwift channel;
          // i.ytimg.com is YouTube's own CDN; curl 200 image/jpeg 640x480,
          // downloaded and vision-confirmed.
          {
            url: 'https://i.ytimg.com/vi/Jb2stN7kH28/sddefault.jpg',
            credit: 'Still from the official "Our Song" music video (dir. Trey Fanjoy), Big Machine Records, via YouTube',
            caption: 'The flower-bed scene from the "Our Song" video — CMT\'s No. 1 video for seven straight weeks, and its 2008 Video of the Year.',
            kind: 'archival',
            // Focal point set by viewing: face just right of center against
            // the wall of roses.
            focalPoint: '55% 48%',
          },
        ],
      },
    },
    {
      slug: 'the-outside-written-at-12',
      year: 2006,
      month: 10,
      day: 24,
      category: 'music',
      title: 'The Outside, written by a 12-year-old about the lunch table',
      snippet:
        'One of the first songs she ever wrote, at 12 — about the middle-school years when the girls at school wanted nothing to do with her — and it survived four years to make the debut album.',
      sourceUrl: 'https://www.songfacts.com/facts/taylor-swift/the-outside',
      thumbnailUrl: null,
      moment: {
        context:
          'She wrote it at 12, not long after picking up her first guitar — one of the very first songs she ever finished, about the stretch of middle school when she was the odd one out: taller than everyone, into country music, singing at festivals while her classmates went to sleepovers. Her own gloss, to Entertainment Weekly: "I wrote that about the scariest feeling I\'ve ever felt: going to school, walking down the hall, looking at all those faces, and not knowing who you\'re gonna talk to that day."\n\nThat it survived four years to make the album at 16 is the point — it\'s the debut\'s origin story in miniature, "the very reason I ever started to write songs," and the record\'s only track Nathan Chapman didn\'t produce. She\'s said that after finishing it as a kid she wrote in her diary, "I don\'t know if it\'ll go anywhere, but it made me feel better."',
        sources: [
          {
            outlet: 'Songfacts',
            url: 'https://www.songfacts.com/facts/taylor-swift/the-outside',
            source_title: 'The Outside by Taylor Swift',
            publisher: 'Songfacts',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
            source_title: 'Taylor Swift (album)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        photos: [
          // Photo pass #762 (2026-07-18): the song's story (written at 12,
          // about being the outsider) predates any public photography, so the
          // era-context add is the payoff shot instead — the girl from the
          // lunch-table song performing to a crowd at 17. Third distinct
          // frame from the May 16, 2007 Cantoni Yahoo-HQ set. Commons license
          // API-verified CC BY 2.0; curl 200 image/jpeg 2816x2112, EXIF-dated
          // 2007-05-16, vision-confirmed (sunglasses, white sundress).
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/TaylorSwift4.jpg',
            credit: 'Brian Cantoni, Wikimedia Commons (CC BY 2.0) — Taylor Swift performing, May 2007',
            caption: 'Five years after writing "The Outside" alone at 12, the outsider is the one on stage — May 2007.',
            kind: 'archival',
            // Focal point set by viewing: face upper-center behind the mic,
            // koa guitar across the middle.
            focalPoint: '48% 22%',
          },
        ],
      },
    },
    {
      slug: 'nsai-songwriter-artist-2007',
      year: 2007,
      month: 10,
      day: 16,
      category: 'business',
      title: 'The youngest Songwriter/Artist of the Year in NSAI history',
      snippet:
        'October 2007: the Nashville Songwriters Association International names her Songwriter/Artist of the Year — the youngest winner the trade group had ever picked.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift',
      thumbnailUrl: null,
      moment: {
        context:
          'A peer-voted songwriting honor, not a fan award — handed to a 17-year-old one year into her recording career. Per Wikipedia\'s account she became the youngest person the Nashville Songwriters Association International had ever named Songwriter/Artist of the Year, a recognition from the town\'s professional writers rather than radio programmers or the record-buying public.\n\nThe timing frames the whole era: this was the same stretch that produced her first CMA Horizon Award and her first Grammy nomination, all before "Fearless." And she kept winning the NSAI trophy — by the 2010 ceremony The Boot counted that year\'s as her third in four years, quoting the speech where she traced it all back to the city: "I discovered a town where they told cool stories in magical ways, and that was Nashville."',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Taylor_Swift',
            source_title: 'Taylor Swift',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'The Boot',
            url: 'https://theboot.com/taylor-swift-nsai-awards/',
            source_title: 'Taylor Swift Named NSAI Songwriter/Artist of the Year',
            publisher: 'The Boot',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Taylor_Swift_at_Yahoo_2007_%28cropped%29.jpg',
            focalPoint: '50% 24%',
            credit: 'Wikimedia Commons — Taylor Swift, 2007 (archival, era context; not the NSAI ceremony)',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'acm-new-female-vocalist-2008',
      year: 2008,
      month: 5,
      day: 18,
      category: 'business',
      title: 'Her first ACM Award: Top New Female Vocalist',
      snippet:
        'The Academy of Country Music hands her its Top New Female Vocalist trophy in May 2008 — the first ACM Award of a career that would eventually collect the academy\'s Entertainer of the Year.',
      sourceUrl: 'https://en.wikipedia.org/wiki/List_of_awards_and_nominations_received_by_Taylor_Swift',
      thumbnailUrl: null,
      moment: {
        context:
          'She\'d been nominated for the same award in 2007 and lost; the 2008 win came on her second try, a night she was also up for Top Female Vocalist and Album of the Year.\n\nTaste of Country counts it as the first of nine career ACM trophies — a run that ends in two Entertainer of the Year awards — and it landed the same night as the performance everyone remembers from that show, "Should\'ve Said No" ending with her drenched under onstage rain.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/List_of_awards_and_nominations_received_by_Taylor_Swift',
            source_title: 'List of awards and nominations received by Taylor Swift',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Taste of Country',
            url: 'https://tasteofcountry.com/taylor-swift-acm-awards-pictures/',
            source_title: 'Look Back at Taylor Swift at the ACM Awards, From Newcomer to Superstar',
            publisher: 'Taste of Country',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        // Photo-enrichment pass (2026-07-29): focalPoint added (downloaded +
        // vision-confirmed). Searched for a second, non-Getty verifiable
        // photo of the actual trophy/red-carpet moment (Taste of Country's
        // gallery only renders a generic hero image via JS, not per-year
        // stills; no outlet-CDN rehost of the specific win found) — left at
        // 1 photo, reviewed-sparse.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/mUIcC8_4ABE/hqdefault.jpg',
            focalPoint: '55% 38%',
            credit: 'Academy of Country Music via YouTube — "Should\'ve Said No," 43rd ACM Awards, 2008 (same ceremony as the win)',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'shouldve-said-no-acm-soaked',
      year: 2008,
      month: 5,
      day: 18,
      category: 'sighting',
      title: 'Soaked to the skin, mid-song, at the 2008 ACMs',
      snippet:
        'Her "Should\'ve Said No" performance at the 2008 ACM Awards ended with her standing under a curtain of onstage rain, drenched and still singing — an early sign she understood television.',
      sourceUrl: 'https://tasteofcountry.com/taylor-swift-acm-awards-pictures/',
      thumbnailUrl: null,
      moment: {
        context:
          'She opened the song disguised in a hooded sweatshirt and jeans, made an onstage costume change into a black dress mid-performance, and sang the final lines under pouring rain — the room answering with a standing ovation.\n\nBig Machine liked the staging enough that the footage became the song\'s official music video. Country outlets still rank it among her definitive award-show performances; it also happened the same night she collected her first ACM Award, Top New Female Vocalist.',
        sources: [
          {
            outlet: 'Taste of Country',
            url: 'https://tasteofcountry.com/taylor-swift-acm-awards-pictures/',
            source_title: 'Look Back at Taylor Swift at the ACM Awards, From Newcomer to Superstar',
            publisher: 'Taste of Country',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'Wikipedia',
            url: "https://en.wikipedia.org/wiki/Should've_Said_No",
            source_title: "Should've Said No",
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
          {
            outlet: 'YouTube',
            url: 'https://www.youtube.com/watch?v=mUIcC8_4ABE',
            source_title: "Taylor Swift - Should've Said No (43rd Academy Of Country Music Awards, 2008)",
            publisher: 'YouTube',
            source_type: 'video',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://i.ytimg.com/vi/mUIcC8_4ABE/hqdefault.jpg',
            credit: 'Academy of Country Music via YouTube — "Should\'ve Said No," 43rd ACM Awards, 2008 (still from the performance)',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'joe-jonas-summer-2008',
      // Cross-link (Stage 3, 2026-07-30): sibling "Joe Jonas" moment.
      relatedIds: ['moment:vault-debut-joe-jonas-ends-it-in-a-27-second-phone-call'],
      year: 2008,
      month: 7,
      category: 'relationship',
      title: 'The Joe Jonas chapter begins',
      snippet:
        'July 2008: she and Joe Jonas start dating — never confirmed while it was happening, exhaustively documented after it ended.',
      sourceUrl: 'https://www.capitalfm.com/news/taylor-swift-joe-jonas-relationship-break-up/',
      thumbnailUrl: null,
      moment: {
        context:
          'The relationship ran July to October 2008, kept officially unacknowledged in real time — the tells were her turning up to sing with the Jonas Brothers on their Burnin\' Up tour dates and the two being spotted together at the MTV VMAs that September.\n\nIts ending — a 27-second phone call — got an item of its own on this timeline, plus a last-minute Fearless track ("Forever & Always," with fans later adding "Last Kiss" to the ledger). By 2015 the two were photographed double-dating as friends.',
        sources: [
          {
            outlet: 'Capital FM',
            url: 'https://www.capitalfm.com/news/taylor-swift-joe-jonas-relationship-break-up/',
            source_title: 'Taylor Swift And Joe Jonas: When Did They Date And Why Did They Break Up?',
            publisher: 'Capital FM',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/joe-jonas-taylor-swift-a-post-breakup-timeline-8514830/',
            source_title: 'Joe Jonas & Taylor Swift: A Post-Breakup Timeline',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/7/76/TaylorSwift_080208_photoby_Adam-Bielawski_%28cropped%29.jpg',
            credit: 'Adam Bielawski / Wikimedia Commons — Taylor Swift, Aug. 2, 2008 (archival, era context; not the relationship)',
            kind: 'archival',
            focalPoint: '52% 18%',
          },
        ],
      },
    },
    {
      slug: 'bonfires-amplifiers-fall-leg',
      year: 2007,
      month: 9,
      day: 6,
      category: 'tour',
      title: "Opening Brad Paisley's Bonfires & Amplifiers fall leg",
      snippet:
        'Her 2007 of permanent opening slots rolls on: the fall leg of Brad Paisley\'s Bonfires & Amplifiers Tour, Sept. 6 through Nov. 17, after guesting on summer dates alongside Kellie Pickler and Jack Ingram.',
      sourceUrl: 'https://www.concertarchives.org/bands/brad-paisley?page=1&year=2007',
      thumbnailUrl: null,
      moment: {
        context:
          'Thirty announced fall dates, from London, Ontario through Grand Rapids, on a tour that totaled 75 shows that year — with Taylor and Rodney Atkins opening the entire second leg. Her mid-2007 résumé at the time: one hit single ("Tim McGraw"), a debut album newly certified gold, and support slots for Rascal Flatts and George Strait already behind her.\n\nConcert archives from that fall show her billed nightly under Paisley — the last long stretch of the opening-act years before Fearless made her the headliner.',
        sources: [
          {
            outlet: 'Concert Archives',
            url: 'https://www.concertarchives.org/bands/brad-paisley?page=1&year=2007',
            source_title: "Brad Paisley's 2007 Concert & Tour History",
            publisher: 'Concert Archives',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Taylor_Swift_%282007%29_retouched.jpg/1280px-Taylor_Swift_%282007%29_retouched.jpg',
            focalPoint: '40% 22%',
            credit: 'Wikimedia Commons — Taylor Swift, 2007 (archival, era context; not the Paisley tour)',
            kind: 'archival',
          },
        ],
      },
    },

    // ---- Origin-story pass (issue #718, Content Shift 2026-07-17) ----
    // The three beats below predate the era window (2006-10-24 start), which
    // the validator flags as a WARN by design — contentForEra filters by
    // eraId, so pre-window origin dates render at the timeline's bottom, the
    // deepest point of the descend-into-the-past design. Days are omitted
    // where outlets only document the month (never guess a day).
    // Sources verified via web search 2026-07-17; this environment blocks
    // direct URL fetches (network policy), so per-URL liveness was not
    // re-checked.
    {
      slug: 'bluebird-cafe-showcase',
      // Cross-link (candidate #1319): the debut single that scouting night led to.
      relatedIds: ['moment:vault-debut-tim-mcgraw-arrives'],
      year: 2004,
      month: 11,
      category: 'business',
      title: 'The Bluebird Cafe night: a 14-year-old, and a label that didn\'t exist yet',
      snippet:
        'November 2004, an industry showcase at Nashville\'s tiny Bluebird Cafe: in the audience is Scott Borchetta, a label exec already planning his exit — and the teenager on the stool becomes the reason Big Machine gets built.',
      sourceUrl:
        'https://www.forbes.com/sites/mattcraig/2025/09/26/scott-borchetta-interview-big-machine-20th-anniversary-taylor-swift-nascar/',
      thumbnailUrl: null,
      moment: {
        context:
          'The setup makes the payoff: earlier that year, at 14, she had walked away from a development deal at RCA — the biggest label in Nashville — because, in her words, "they wanted to shelf me" until she was about 18, and she wanted her songs out while they still matched the teenage life they were written from. So the girl playing the Bluebird that November was a free agent by choice.\n\nBorchetta, then a DreamWorks Nashville executive who knew his label was going away, heard her in that listening room and made her an offer with nothing behind it but himself: sign with the label he was about to start. She took the bet, he launched Big Machine in 2005, and the founding gamble of both careers — hers on herself, his on her — traces back to one round in that tiny listening room. Two decades on, Borchetta was still retelling it in Big Machine anniversary interviews.',
        sources: [
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/mattcraig/2025/09/26/scott-borchetta-interview-big-machine-20th-anniversary-taylor-swift-nascar/',
            source_title: "From Taylor Swift To Nascar: Under The Hood Of Scott Borchetta's Big Machine",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-17',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/country/the-bluebird-cafe-taylor-swift-dierks-bentley-oral-history-7880979/',
            source_title:
              "Oral History of Nashville's Bluebird Cafe: Taylor Swift, Maren Morris, Dierks Bentley & More on the Legendary Venue",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-17',
            reliability_score: 4,
          },
          {
            outlet: 'American Songwriter',
            url: 'https://americansongwriter.com/they-wanted-to-shelf-me-the-story-behind-a-14-year-old-taylor-swift-denying-the-biggest-record-label-in-nashville/',
            source_title:
              '"They Wanted to Shelf Me": The Story Behind a 14-Year-Old Taylor Swift Denying the "Biggest Record Label in Nashville"',
            publisher: 'American Songwriter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-17',
            reliability_score: 3,
            notes: 'carries her "they wanted to shelf me" quote and the RCA walkaway account',
          },
        ],
        // Real-photo pass (2026-07-31): freely licensed interior of Nashville's
        // Bluebird Cafe — the listening room this moment is set in. Verified
        // HTTP 200 + image/jpeg + downloaded and vision-confirmed this session
        // (1380x886). Contextual venue photo, honestly captioned: the performer
        // pictured is not Taylor.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Jamie_Meyer_at_Bluebird_Cafe%2C_Nashville.jpg',
            focalPoint: '37% 44%',
            credit: 'Uppsalaelle, CC BY-SA 4.0, via Wikimedia Commons',
            caption:
              "Inside the Bluebird Cafe's listening room in Nashville — the tiny, in-the-round space where a mid-set industry showcase like the November 2004 round that caught Scott Borchetta's ear plays out just feet from the crowd. (A later night at the venue; the performer pictured is not Taylor.)",
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'myspace-native-fanbase',
      year: 2005,
      month: 8,
      day: 31,
      category: 'business',
      title: 'The MySpace page she ran herself — the first Swiftie army',
      snippet:
        'Her MySpace went up on Aug. 31, 2005 — and she ran it herself: the bio, the blogs, the replies to fans. When country radio shrugged at a teenage girl, her label answered with her play counts.',
      sourceUrl: 'https://www.fastcompany.com/1795743/meet-scott-borchetta-music-industry-maverick-who-launched-taylor-swift',
      thumbnailUrl: null,
      moment: {
        context:
          'Before the album, there was the page. She was already on MySpace because, as Borchetta later told Fast Company, "that\'s how she and her friends were talking to each other" — so the platform-native teenager did her own marketing: wrote her bio and blogs, and answered fans one by one, building the direct artist-to-fan line the whole fandom still runs on.\n\nThe numbers became the argument. Country radio programmers were openly skeptical that a 16-year-old girl could hold country listeners; per Wikipedia\'s accounting, her songs racked up more than 45 million MySpace plays, and Borchetta took those play counts to the skeptics as proof the audience already existed. By late 2008 The New York Times was profiling her as the first country star whose fame was MySpace-born.\n\nEverything the site now calls parasocial-by-design — the replies, the Easter eggs, fans as co-conspirators — starts here, on a page she typed herself.',
        sources: [
          {
            outlet: 'Fast Company',
            url: 'https://www.fastcompany.com/1795743/meet-scott-borchetta-music-industry-maverick-who-launched-taylor-swift',
            source_title: 'Meet Scott Borchetta, the Music-Industry Maverick Who Launched Taylor Swift',
            publisher: 'Fast Company',
            source_type: 'reputable_press',
            accessed_at: '2026-07-17',
            reliability_score: 4,
          },
          {
            outlet: 'The New York Times',
            url: 'https://www.nytimes.com/2008/11/09/arts/music/09cara.html',
            source_title: 'My Music, MySpace, My Life',
            publisher: 'The New York Times',
            source_type: 'reputable_press',
            accessed_at: '2026-07-17',
            reliability_score: 4,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Swifties',
            source_title: 'Swifties',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-17',
            reliability_score: 2,
            notes: 'page-creation date (Aug. 31, 2005) and the 45-million-plays figure shown to radio',
          },
        ],
        photos: [],
      },
    },
    {
      slug: 'acm-2007-hi-im-taylor',
      year: 2007,
      month: 5,
      day: 15,
      category: 'music',
      title: '"Hi, I\'m Taylor" — sung at Tim McGraw, then said to him',
      snippet:
        'Her awards-show debut, May 15, 2007: she sings "Tim McGraw" straight at Tim McGraw in the ACMs front row — a man she has never met — then walks down, sticks out her hand, and introduces herself: "Hi, I\'m Taylor."',
      sourceUrl:
        'https://www.rollingstone.com/music/music-news/watch-taylor-swift-sing-tim-mcgraw-academy-of-country-music-awards-2007-732961/',
      thumbnailUrl: null,
      moment: {
        context:
          'The nerviest bit of stagecraft of the whole debut era. At 17, in her first awards-show performance, she sang "Tim McGraw" at the 42nd ACM Awards with the song\'s namesake sitting in the front row next to Faith Hill — and they had never met. When it ended she walked up, offered McGraw her hand and said "Hi, I\'m Taylor"; he shook it and hugged her, and she turned to the camera and mouthed "Tim McGraw!"\n\nThe handshake became the era\'s defining clip: the introduction she\'d written into a song a year earlier, finally performed in person, on national TV, on her own terms. Months later she\'d be opening for McGraw and Hill on tour — the follow-up the moment all but scheduled.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/watch-taylor-swift-sing-tim-mcgraw-academy-of-country-music-awards-2007-732961/',
            source_title: 'Flashback: Taylor Swift Makes Her Awards Show Debut in 2007',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-17',
            reliability_score: 4,
          },
          {
            outlet: 'American Songwriter',
            url: 'https://americansongwriter.com/remember-when-taylor-swift-performed-tim-mcgraw-in-front-of-tim-mcgraw-at-the-acms/',
            source_title: 'Remember When: Taylor Swift Performed "Tim McGraw" In Front of Tim McGraw at the ACMs',
            publisher: 'American Songwriter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-17',
            reliability_score: 3,
          },
          // Fan-archive footage of the performance — oEmbed-verified
          // 2026-08-12 (see candidates/youtube-appearances.mjs).
          {
            outlet: 'YouTube — Taylor Swift Evolution (fan archive)',
            url: 'https://www.youtube.com/watch?v=k3eWsix68bs',
          },
        ],
        photos: [],
      },
    },

    // ── Migrated from content.ts RAW (consolidation stage 2a, 2026-07-19) ──
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "debut-tim-mcgraw",
      year: 2006,
      month: 6,
      day: 19,
      category: "music",
      title: "“Tim McGraw” arrives",
      snippet: "A debut single named after a country legend announces a 16-year-old songwriter with an unusual gift for specifics.",
      video: { youtubeId: "GkD20ajVxnY", title: "Taylor Swift - Tim McGraw" },
      hiddenClue: { clue: "The liner notes hid secret messages in capital letters.", payoff: "Decode the capitals in the “Tim McGraw” lyric sheet and they read CAN’T TELL ME NOTHIN’ — the McGraw song the lyric calls their own. That decrypting-the-capitals habit became a decade-long tradition fans still decode on every album booklet through 1989." },
      // Cross-links added 2026-07-24 (ledger #1318): the writing origin, the
      // album this single launched, the McGraw meeting, and the signing that
      // made Big Machine possible. Ids verified against content-vault.generated.
      relatedIds: [
        'moment:vault-debut-the-math-class-idea-behind-tim-mcgraw',
        'moment:vault-debut-taylor-swift-the-album-arrives',
        'moment:vault-debut-opening-for-the-actual-tim-mcgraw-and-faith-hill',
        'moment:vault-debut-the-bluebird-cafe-night-a-14-year-old-and-a-label-that-didnt',
      ],
      moment: {
        context: "Before the stadiums, there was a teenager who named her first single after Tim McGraw — a bet that specificity would travel further than polish.\n\nThe melody came to her in freshman-year math class at Hendersonville High; she finished it that afternoon with co-writer Liz Rose in about fifteen minutes, cataloguing the details that would make an older boyfriend think of her once he left for college. (Press and fans tie the muse to a graduating senior; Taylor has described the leaving-for-college story but never named him.) She first titled it “When You Think Tim McGraw” — Scott Borchetta trimmed it to the country legend’s name to catch his fanbase — and the lyric points to McGraw’s “Can’t Tell Me Nothin’” as the couple’s song.\n\nReleased June 19, 2006 as the very first single on Borchetta’s brand-new Big Machine, with Taylor as the label’s first signed artist, it climbed on a grassroots push — MySpace, hourly GAC vignettes, radio worked by hand — to No. 6 on Hot Country Songs and No. 40 on the Hot 100, later certified multi-platinum. Trey Fanjoy’s video, shot around Hendersonville, staged the song’s whole idea: a tune heard years later that drags an old love back to the surface. McGraw, at first wary of a newcomer borrowing his name, came around; Taylor sang it at the 2007 ACM Awards with him in the front row, then crossed over afterward to introduce herself — “Hi, I’m Taylor.”",
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Tim_McGraw_(song)',
            source_title: 'Tim McGraw (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-24',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-tim-mcgraw-chart-rewind-2006-1236284818/',
            source_title: "Taylor Swift's 'Tim McGraw': Chart Rewind, 2006",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'No. 6 Hot Country Songs, No. 40 Hot 100 peaks',
          },
          {
            outlet: 'Parade',
            url: 'https://parade.com/entertainment/2006-debut-hit-written-in-15-minutes-after-high-school-math-class-launched-the-defining-artist-of-a-generation',
            source_title: 'Debut Hit Written in 15 Minutes After High School Math Class',
            publisher: 'Parade',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Liz Rose co-write; math-class melody; ~15 minutes',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-liner-note-secret-messages-6296379/',
            source_title: "Taylor Swift's 13 Best Liner Note Secret Messages",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: "Hidden capitals decode to CAN'T TELL ME NOTHIN'",
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/big-machine-label-group-scott-borchetta-20-years-interview/',
            source_title: "Big Machine's Scott Borchetta on 20 Years, Taylor Swift, Reba & More",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'First signed artist; grassroots MySpace/GAC/radio rollout; title shortened',
          },
        ],
        // Photo-enrichment pass (2026-07-29): page had zero photos. Added the
        // official "Tim McGraw" music-video still (YouTube channel "Taylor
        // Swift", matching the `video.youtubeId` above, oEmbed-verified) and
        // the Wikipedia single-cover file; both downloaded and
        // vision-confirmed, individual focal points.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/GkD20ajVxnY/hqdefault.jpg',
            focalPoint: '46% 45%',
            credit: 'Big Machine Records / YouTube (official "Tim McGraw" music video still)',
            kind: 'video-still',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/b/b7/Taylor_Swift_-_Tim_McGraw.png',
            focalPoint: '32% 22%',
            credit: 'Big Machine Records (single cover art)',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "debut-cowboy-boots",
      year: 2007,
      month: 4,
      dateLabel: "Spring 2007",
      category: "fashion",
      title: "Curls, sundresses and cowboy boots",
      snippet: "The visual signature of the debut era: sunlit country-girl Americana.",
      moment: {
        sources: [
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/newyork/news/taylor-swifts-fashion-evolution/',
            source_title: 'Taylor Swift\'s Fashion Evolution',
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-08-11',
            reliability_score: 4,
          },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/celebrity/articles/taylor-swift-style-eras-explained-200200209.html',
            source_title: 'Taylor Swift\'s style eras, explained: Her fashion evolution from 2006 to now',
            publisher: 'Yahoo Entertainment',
            source_type: 'reputable_press',
            accessed_at: '2026-08-11',
            reliability_score: 3,
          },
        ],
        context: "Ringlet curls, floaty sundresses, and well-worn cowboy boots became the uniform of the debut era — a look as handmade and earnest as the songs.",
        // Shop pass (2026-07-22): no single named pair or dress -- a
        // current cowboy boot, verified in stock, the era's recurring prop.
        products: [
          {
            brand: 'IUV',
            item: 'Cowboy Boots for Women, Mid-Calf Cowgirl Boots',
            retailer: 'amazon.com',
            url: 'https://www.amazon.com/IUV-Cowboy-Western-Cowgirl-Pointy/dp/B0BFQRZPRH',
            matchTier: 'unscored',
            price: '$54.99',
            isAlternative: true,
            altNote: 'No single named pair -- this era-defining look was built from many worn-in boots and sundresses -- a current cowboy boot in the same recurring spirit.',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "debut-our-song",
      // Cross-links (Stage 3, 2026-07-24): interlinks the four "Our Song"
      // moments so the "Keep reading" rail traces the song's whole arc.
      relatedIds: [
        'moment:vault-debut-our-song-written-for-the-ninth-grade-talent-show',
        'moment:vault-debut-our-song-becomes-her-first-no-1',
        'moment:vault-debut-our-song-wins-two-trophies-at-the-2008-cmt-music-awards',
      ],
      // Date corrected (#720): was 2007-09-08, which predates even the
      // single's Sept 10, 2007 radio release and conflicted with the
      // sibling card's real chart date. Re-dated to match the No. 1 date
      // (Billboard Hot Country Songs, Dec 22, 2007) so this card and
      // vault-debut-our-song-becomes-her-first-no-1 agree, and the
      // m-debut-2 milestone lands on the correct date.
      year: 2007,
      month: 12,
      day: 22,
      category: "music",
      title: "“Our Song” hits number one",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-debut-2", label: "“Our Song” #1", kind: "award" },
      snippet: "At 17, she becomes the youngest person to single-handedly write and perform a number-one country hit.",
      video: { youtubeId: "Jb2stN7kH28", title: "Taylor Swift - Our Song" },
      moment: {
        sources: [
          {
            outlet: 'Country Standard Time',
            url: 'https://www.countrystandardtime.com/news/newsitem.asp?xid=1195',
            source_title: 'Taylor Swift jumps to top of country chart, replacing Carrie Underwood',
            publisher: 'Country Standard Time',
            source_type: 'chart_database',
            accessed_at: '2026-08-11',
            reliability_score: 3,
          },
          {
            outlet: 'Country Now',
            url: 'https://countrynow.com/remember-when-taylor-swift-released-our-song/',
            source_title: 'Remember When Taylor Swift Released \'Our Song?\'',
            publisher: 'Country Now',
            source_type: 'reputable_press',
            accessed_at: '2026-08-11',
            reliability_score: 3,
          },
        ],
        context: "A song she originally wrote for a high-school talent show became a record-setting number one, proving the debut was no fluke.",
        // Photo pass #762 run 10 (2026-07-19): page had zero photos. Official
        // MV id Jb2stN7kH28 verified via YouTube oEmbed this session
        // ("Taylor Swift - Our Song", author @TaylorSwift); sd2 frame
        // (640x480) curl-verified 200 image/jpeg, downloaded and viewed —
        // the flower-bed scene, a distinct frame from the sddefault already
        // used on the our-song-talent-show page (maxres variants 404 for
        // this 2007-era upload).
        photos: [
          {
            url: 'https://i.ytimg.com/vi/Jb2stN7kH28/sd2.jpg',
            credit: 'Taylor Swift / Big Machine Records (official "Our Song" video frame, YouTube)',
            caption:
              'Seventeen-year-old Taylor in the flower-bed scene of the "Our Song" video — the homemade-feeling clip behind her first number one.',
            kind: 'primary',
            // Face fills the center of the frame, eyes just above the midline.
            focalPoint: '53% 40%',
          },
          // Photo pass (issue #1721, 2026-08-25): a second photo of Taylor
          // from the debut era was tried here, but combined with this pass's
          // other additions it pushed that image's reuse past
          // content.image-overuse's >3-moments threshold — reverted rather
          // than force an overused image through.
        ],
      },
    },

    {
      // Cross-link (Stage 3, 2026-07-30): the "Love Story" pair — the song's
      // story, and the single's release two months ahead of the album — now
      // interlink.
      relatedIds: ['moment:vault-debut-love-story-arrives-two-months-before-the-album'],
      year: 2008,
      month: 9,
      day: 15,
      category: 'music',
      title: "Love Story, and the boy her family didn't approve of",
      snippet:
        "Inspired by a boy she never actually dated — one her family and friends \"all said they didn't like.\"",
      sourceUrl: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor_Swift_song)',
      thumbnailUrl: 'https://i.ytimg.com/vi/8xg3vE8Ie_E/hqdefault.jpg',
      moment: {
        context:
          "She's said the disapproval reminded her of Romeo and Juliet — \"the only people who wanted them to be together were them\" — so she gave her version the happy ending Shakespeare didn't, swapping the double suicide for a marriage proposal she felt the characters deserved.\n\nThe whole thing came fast: she wrote it on her bedroom floor in about 20 minutes, then cut a rough demo in roughly 15 minutes the next day. The boy stayed anonymous — she's only ever said he was someone she never actually dated, and that when she brought him around, \"[they] all said they didn't like him. All of them!\"",
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor_Swift_song)' },
          { outlet: 'Wide Open Country', url: 'https://www.wideopencountry.com/love-story-taylor-swift/' },
        ],
        // Photo-enrichment pass (2026-07-30): added the official "Love Story"
        // music-video still (YouTube id 8xg3vE8Ie_E, oEmbed-verified channel
        // "Taylor Swift" @TaylorSwift; curl 200 image/jpeg); downloaded and
        // vision-confirmed.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/8xg3vE8Ie_E/hqdefault.jpg',
            focalPoint: '52% 45%',
            credit: 'Big Machine Records / official Taylor Swift YouTube channel',
            caption: 'Still from the official "Love Story" music video.',
            kind: 'primary',
          },
        ],
      },
    },
    // --- Music/business/tour depth pass (2026-07-05)
    {
      year: 2008,
      month: 10,
      day: 28,
      category: 'music',
      title: "You're Not Sorry, and the ex-boyfriend who felt like Prince Charming",
      snippet: "He \"came across as Prince Charming\" — until Taylor found out how many secrets he'd been keeping from her.",
      sourceUrl: "https://en.wikipedia.org/wiki/You%27re_Not_Sorry",
      thumbnailUrl:
        'https://i.ytimg.com/vi/hNiMWIwAr3k/hqdefault.jpg',
      moment: {
        context:
          'She\'s said the inspiration was an ex-boyfriend whose lies took a while to surface: "He came across as Prince Charming [...] who had a lot of secrets that he didn\'t tell me about." The situation became a "breaking point" where she felt she had to walk away before getting hurt further.\n\nShe wrote the song alone and produced it with Nathan Chapman at Blackbird Studio in Nashville, releasing it Oct. 28, 2008 as a promotional single ahead of the album.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/You%27re_Not_Sorry' }],
        photos: [
          {
            url: 'https://i.ytimg.com/vi/hNiMWIwAr3k/hqdefault.jpg',
            focalPoint: '50% 45%',
            credit: "Fearless Tour performance still, via Taylor Swift's Tour Extras on YouTube",
            caption: 'Performing the "You\'re Not Sorry" piano mashup on the Fearless Tour.',
            kind: 'primary',
          },
        ],
      },
    },


    // --- Deep timeline fill (2026-07-08, content/deep-a): the era's singles
    // and reissue (release was empty), song origin stories, tour lore, the
    // 2009 CMA sweep, and her acting/SNL firsts. Every claim verified against
    // its cited source this session; business items carry two independent
    // sources per the framework.
    {
      slug: 'love-story-single-release',
      // Cross-link (Stage 3, 2026-07-30): sibling "Love Story" moment.
      relatedIds: ['moment:vault-debut-love-story-and-the-boy-her-family-didnt-approve-of'],
      year: 2008,
      month: 9,
      day: 15,
      category: 'release',
      title: 'Love Story arrives two months before the album',
      snippet:
        'Sept. 15, 2008: the lead single from Fearless goes out to country radio ahead of the album — and starts a climb that wouldn\'t stop until it had topped pop radio too.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor_Swift_song)',
      thumbnailUrl: 'https://i.ytimg.com/vi/8xg3vE8Ie_E/hqdefault.jpg',
      moment: {
        context:
          'It peaked at No. 4 on the Hot 100, spent two weeks atop Hot Country Songs — and five months later became the first country song ever to hit No. 1 on Billboard\'s pop-radio chart (see February 2009).\n\nThe long tail is the real story: roughly 18 million copies sold worldwide make it one of the best-selling singles ever released, and its 6.2 million US copies still stand as her biggest-selling song at home — a lead single that outsold everything the superstar decade that followed produced.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor_Swift_song)',
            source_title: 'Love Story (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Wide Open Country',
            url: 'https://www.wideopencountry.com/love-story-taylor-swift/',
            source_title: "'Love Story': The Story Behind The Classic Taylor Swift Song",
            publisher: 'Wide Open Country',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 3,
          },
        ],
        // Photo-enrichment run 16 (2026-07-18, #762): added a still from the
        // official "Love Story" music video, which premiered Sept. 12, 2008,
        // days before the single's radio release — video id verified via
        // YouTube oEmbed (title "Taylor Swift - Love Story", channel
        // @TaylorSwift); thumbnail verified HTTP 200 + image/jpeg, downloaded
        // and visually confirmed. Per-image focal points set by eye.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/8xg3vE8Ie_E/hqdefault.jpg',
            credit: 'Big Machine Records / YouTube (official music video still)',
            caption: 'The sepia close-up from the official "Love Story" video, which premiered days before the single went to country radio.',
            kind: 'archival',
            focalPoint: '48% 40%',
          },
        ],
      },
    },
  ],
};
