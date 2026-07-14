// Vault content — The Tortured Poets Department era.
//
// First batch: April 2024, the album-release wavetop month. Every claim
// verified against its cited source directly. See
// docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first) authoring model this follows.
//
// T16 full-era pass (2026-07-09, content/ttpd-full): every item brought to
// the 2+ paragraph body standard (paragraphs split on blank lines by
// sync-longlive-content.mjs) and every item given at least one real photo —
// Wikipedia-hosted cover art, official-channel YouTube stills (each video ID
// re-verified via YouTube oEmbed this session), CC-licensed Wikimedia
// Commons concert photos, or credited press/agency CDN images per the
// 2026-07-09 relaxed hotlink policy in docs/decisions.md. Every photo URL
// curl-verified HTTP 200 + image/* this session; non-cover images visually
// confirmed against their captions. No AI-generated imagery.

export default {
  eraSlug: 'tortured-poets',
  items: [
    {
      year: 2024,
      month: 2,
      day: 4,
      category: 'release',
      title: 'TTPD announced live at the Grammys before her record fourth AOTY win',
      snippet:
        'She revealed the April 19 release date mid-speech while accepting Best Pop Vocal Album, then ended the night as the first artist to win Album of the Year four times.',
      sourceUrl: 'https://www.cbsnews.com/news/taylor-swift-announces-new-album-the-tortured-poets-department-grammys-2024/',
      thumbnailUrl:
        'https://assets1.cbsnewsstatic.com/hub/i/r/2024/02/05/8edd48b7-d5d3-4f41-9abc-73224e5a7012/thumbnail/620x413/c9004cfb98e90e6a93cd1764340a1057/gettyimages-1986514177.jpg',
      moment: {
        context:
          'Accepting Best Pop Vocal Album for Midnights — her 13th career Grammy — she told the room: "I want to say thank you to the fans by telling you a secret that I\'ve been keeping from you for the last two years, which is that my brand new album comes out April 19th."\n\nFans primed by her lucky number 13 had bet on a Reputation (Taylor\'s Version) reveal; instead, a black-and-white cover photo of her lying in bed hit Instagram minutes later, captioned with lines about muses and love bombs. By the end of the night she had Album of the Year for Midnights too, making her the first artist ever to win the category four times.',
        sources: [
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-announces-new-album-the-tortured-poets-department-grammys-2024/',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-grammys-tortured-poets-department-1234960908/',
          },
        ],
        photos: [
          {
            url: 'https://assets1.cbsnewsstatic.com/hub/i/r/2024/02/05/8edd48b7-d5d3-4f41-9abc-73224e5a7012/thumbnail/620x413/c9004cfb98e90e6a93cd1764340a1057/gettyimages-1986514177.jpg',
            credit: 'Kevin Winter/Getty Images for The Recording Academy',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 4,
      day: 19,
      category: 'business',
      title: "Tortured Poets breaks Spotify's single-day record",
      snippet:
        "300+ million streams on release day alone, plus 'Fortnight' becoming the most-streamed song Spotify had ever seen in a single day.",
      sourceUrl:
        'https://newsroom.spotify.com/2024-04-19/tortured-poets-department-taylor-swift-library-los-angeles/',
      thumbnailUrl: 'https://storage.googleapis.com/pr-newsroom-wp/1/2024/04/Day1_IGCarousel_5-1-1440x1440.jpg',
      moment: {
        context:
          'The album cleared 300 million Spotify streams before its first day was out — the first album in the platform\'s history to cross either the 200 million or 300 million single-day marks — while "Fortnight" displaced the single-day record for any song, and Swift set the single-day artist record too.\n\nThe takeover had a physical footprint: for three days before release, Spotify ran an open-air "poetry library" pop-up at The Grove in Los Angeles, revealing new lyrics from the album each day. The artist single-day record she broke was her own, set when 1989 (Taylor\'s Version) arrived in October 2023.',
        sources: [
          {
            outlet: 'Spotify Newsroom',
            url: 'https://newsroom.spotify.com/2024-04-19/tortured-poets-department-taylor-swift-library-los-angeles/',
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/mollybohannon/2024/04/22/all-the-records-taylor-swifts-the-tortured-poets-department-has-broken-so-far/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-tortured-poets-passes-billion-spotify-streams-1235665087/',
          },
        ],
        photos: [
          {
            url: 'https://storage.googleapis.com/pr-newsroom-wp/1/2024/04/Day1_IGCarousel_5-1-1440x1440.jpg',
            credit: 'Spotify Newsroom',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 4,
      day: 24,
      category: 'business',
      title: 'A billion streams in one week',
      snippet:
        'The fastest album ever to hit a billion Spotify streams — all 31 tracks, Anthology included, inside five days.',
      sourceUrl:
        'https://newsroom.spotify.com/2024-04-24/tortured-poets-department-taylor-swift-one-billion-record-streams/',
      thumbnailUrl: 'https://storage.googleapis.com/pr-newsroom-wp/1/2024/04/TSwift-Square-header-1440x1440.jpg',
      moment: {
        context:
          'No album had ever reached a billion Spotify streams within five days; Spotify confirmed the milestone on April 24.\n\nIt capped a stretch where a record fell almost daily — most pre-saved album on the platform\'s Countdown Pages the day before release, most-streamed album in a single day on day one, then most-streamed album in a single week logged before an actual week had even elapsed. "Fortnight" led the charge as the most-streamed song in a single day in Spotify history — a record that stood until her own "The Fate of Ophelia" broke it in October 2025.',
        sources: [
          {
            outlet: 'Spotify Newsroom',
            url: 'https://newsroom.spotify.com/2024-04-24/tortured-poets-department-taylor-swift-one-billion-record-streams/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-tortured-poets-passes-billion-spotify-streams-1235665087/',
          },
          {
            outlet: 'Music Business Worldwide',
            url: 'https://www.musicbusinessworldwide.com/taylor-swifts-the-fate-of-ophelia-becomes-most-streamed-song-in-a-single-day-on-spotify-as-new-album-shatters-records-across-platforms/',
          },
        ],
        photos: [
          {
            url: 'https://storage.googleapis.com/pr-newsroom-wp/1/2024/04/TSwift-Square-header-1440x1440.jpg',
            credit: 'Spotify Newsroom',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 4,
      day: 19,
      category: 'music',
      title: 'Fortnight opens the album, with Post Malone on the hook',
      snippet: "A pulsing '80s-inspired synth ballad that opens the album, with Post Malone on the hook.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Fortnight_(song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Taylor_Swift_Eras_Tour_TTPD_Set_Fortnight.jpg/500px-Taylor_Swift_Eras_Tour_TTPD_Set_Fortnight.jpg',
      moment: {
        context:
          'Written with Post Malone and Jack Antonoff, the downtempo synth-pop opener carries what Taylor called the album\'s fatalism — "You ended up not with the person that you loved and now you just have to live with that every day" — with Malone recording his harmonies and bridge hooks at his home studio in Los Angeles.\n\nThe video, which Swift directed herself with cinematographer Rodrigo Prieto shooting in black and white, casts Malone as her lover and reunites Dead Poets Society co-stars Ethan Hawke and Josh Charles as mad scientists administering her electroshock therapy; critics caught echoes of Poor Things, Frankenstein, and silent-era German Expressionism. The song debuted at No. 1 on the Hot 100 — her 12th chart-topper and Post Malone\'s fifth — after breaking Spotify\'s single-day streaming record, and its video went on to take Video of the Year at the 2024 VMAs.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Fortnight_(song)' },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-hot-100-top-14-fortnight-post-malone-record/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Taylor_Swift_Eras_Tour_TTPD_Set_Fortnight.jpg/500px-Taylor_Swift_Eras_Tour_TTPD_Set_Fortnight.jpg',
            credit: 'Wikimedia Commons',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 4,
      day: 19,
      category: 'release',
      title: 'A 2am surprise: TTPD was a secret double album all along',
      snippet:
        'Two hours after the album dropped, a second post: "The Tortured Poets Department is a secret DOUBLE album." The Anthology added 15 more songs, 31 total.',
      sourceUrl:
        'https://www.billboard.com/music/pop/taylor-swift-2am-surprise-secret-double-album-the-tortured-poets-department-1235660643/',
      thumbnailUrl: null,
      moment: {
        context:
          'She had teased a mysterious 2 a.m. countdown, and delivered on it two hours after the midnight release: "It\'s a 2am surprise: The Tortured Poets Department is a secret DOUBLE album. I\'d written so much tortured poetry in the past 2 years and wanted to share it all with you."\n\nFour of the 15 Anthology tracks — "The Manuscript," "The Bolter," "The Albatross," and "The Black Dog" — had already been teased as bonus cuts scattered across physical variants; the rest were entirely new, pushing the full album past the two-hour mark. Her sign-off handed the record over: "And now the story isn\'t mine anymore... it\'s all yours."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-2am-surprise-secret-double-album-the-tortured-poets-department-1235660643/',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-the-tortured-poets-department-the-anthology-announcement-1235007251/',
          },
        ],
        // T16 photo pass (2026-07-09): The Anthology cover from Wikipedia's
        // stable upload.wikimedia.org copy. Verified HTTP 200 + image/png.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1b/The_Tortured_Poets_Department_The_Anthology.png/250px-The_Tortured_Poets_Department_The_Anthology.png',
            credit: 'Republic Records',
            caption: 'Cover of The Tortured Poets Department: The Anthology, the 31-track edition revealed at 2 a.m.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 4,
      day: 19,
      category: 'music',
      title: 'Clara Bow, and the industry habit of replacing women with women',
      snippet: '"You look like Clara Bow in this light... Stevie Nicks in \'75" — then, in the last verse, the label pitches the same line about her.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Clara_Bow_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Written and produced with Aaron Dessner at Long Pond Studios, "Clara Bow" closes the standard album at track 16 by walking through the lineage of women the industry anoints and then swaps out: the narrator is told she looks like Clara Bow — the silent-film star who defined the 1920s "It girl" — then "Stevie Nicks in \'75," before the final verse turns the machine on its own author, with an executive pitching the next new girl as looking like Taylor Swift. Her own explanation: "I picked women who have done great things in the past and have been these archetypes of greatness in the entertainment industry" — then showed how the industry sells every new woman as a replacement for the last.\n\nBow\'s descendants embraced the closer: her family called the song a "testament" to the actress\'s legacy and its lyrics "hauntingly beautiful," despite Swift never consulting them beforehand. Critics highlighted the track\'s self-aware framing of fame\'s churn — NPR later named it among the best songs of 2024 — and it reached No. 21 on the Hot 100 in TTPD\'s record-sweeping first week.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Clara_Bow_(song)' }],
        // T16 photo pass (2026-07-09): official lyric-video still — video ID
        // verified via YouTube oEmbed (author @TaylorSwift) this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/fcVUbmdQfaE/hqdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the official "Clara Bow" lyric video on Taylor Swift\'s YouTube channel.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 4,
      day: 19,
      category: 'music',
      title: 'The Bolter, and the 1930s socialite fans think inspired it',
      snippet: 'A woman who leaves relationships the moment they turn — fans trace the title to a real 1900s aristocrat divorced five times over.',
      sourceUrl: 'https://www.bustle.com/entertainment/taylor-swift-the-bolter-theory-lady-idina-sackville',
      thumbnailUrl:
        'https://imgix.bustle.com/uploads/getty/2024/2/22/9b7b54e9-11ab-43f1-90fa-51af4b2737da-getty-2015053197.jpg?w=248&h=165&fit=crop&crop=faces&dpr=2',
      moment: {
        context:
          'Lady Idina Sackville, part of the scandalous "Happy Valley set" in 1930s colonial Kenya, earned the "bolter" nickname after leaving her husband for another man; her own great-granddaughter, Frances Osborne, wrote a 2008 biography by the same title. Taylor has never confirmed the connection.\n\nThe Anthology track itself — written and produced with Aaron Dessner — sketches "an endearing and mischievous woman" who charms the "trophy hunters" pursuing her and escapes at every turn. Literary-minded listeners also point to Nancy Mitford\'s 1945 novel The Pursuit of Love, whose absentee mother figure is nicknamed "the Bolter" for serially abandoning her marriages; like the Sackville theory, it remains an interpretation fans and critics supplied, not one Swift has endorsed.',
        sources: [
          {
            outlet: 'Bustle',
            url: 'https://www.bustle.com/entertainment/taylor-swift-the-bolter-theory-lady-idina-sackville',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/The_Bolter_(song)',
          },
        ],
        photos: [
          {
            url: 'https://imgix.bustle.com/uploads/getty/2024/2/22/9b7b54e9-11ab-43f1-90fa-51af4b2737da-getty-2015053197.jpg?w=248&h=165&fit=crop&crop=faces&dpr=2',
            credit: 'Graham Denholm/TAS24/Getty Images Entertainment',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 5,
      day: 9,
      category: 'tour',
      title: "TTPD joins the Eras Tour as 'Female Rage The Musical'",
      snippet:
        "New songs from the album folded into the setlist in Paris — Taylor's own nickname for the segment, from her Instagram caption.",
      sourceUrl: 'https://www.rollingstone.com/music/music-news/taylor-swift-tortured-poets-eras-tour-set-list-post-1235019481/',
      thumbnailUrl:
        // Image-fix pass (2026-07-10): #343 — was ?w=300 (300x198, soft/pixelated). Raised to the
        // ?w=942&h=628&crop=1 variant of the same Billboard photo, already live elsewhere in this
        // file; curl-verified HTTP 200 image/jpeg and vision-confirmed same subject at full res.
        'https://www.billboard.com/wp-content/uploads/2024/05/Taylor-Swift-_-The-Eras-Tour-Paris-France-04-2024-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'Her caption dedicated the post "to the new Tortured Poets section of the Eras Tour (aka Female Rage The Musical!)" and credited a crew that spent the tour\'s two-month break building it: "we really didn\'t take any time off."\n\nSeven TTPD songs entered the show — "But Daddy I Love Him," "So High School," "Who\'s Afraid of Little Old Me?," "Down Bad," "Fortnight," "The Smallest Man Who Ever Lived," and "I Can Do It With a Broken Heart" — with original choreography, new costumes, and moody staging built on muted tones, paper, and a typewriter. Fitting a new era in meant real surgery on the three-hour show: the Lover and folklore sets lost songs, and Red moved up to follow Fearless directly.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-tortured-poets-eras-tour-set-list-post-1235019481/',
          },
          { outlet: 'Billboard', url: 'https://www.billboard.com/lists/taylor-swift-paris-eras-tour-europe/' },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/05/Taylor-Swift-_-The-Eras-Tour-Paris-France-04-2024-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Kevin Mazur/TAS24/Getty Images',
          },
        ],
      },
    },

    // --- Active-tier batch (2026-07-04): the Kelce relationship arc continues
    // + tour/sighting/fashion, per the ship-readiness bar in docs/decisions.md.
    // Every item below verified against its cited source(s) directly.
    {
      year: 2024,
      month: 5,
      day: 9,
      category: 'tour',
      title: 'The European leg opens in Paris, with two live debuts',
      snippet:
        'Her first show back after TTPD dropped — she gave "Paris" and "loml" their live debuts at Paris La Défense Arena.',
      sourceUrl: 'https://www.billboard.com/lists/taylor-swift-paris-eras-tour-europe/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2024/05/Taylor-Swift-_-The-Eras-Tour-Paris-France-04-2024-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'May 9, 2024 at La Défense Arena was her first performance anywhere since TTPD arrived, and the setlist treated it as a premiere: an acoustic "Paris" — a song she said would make its live debut only in its namesake city — a piano rendition of "loml," and the unveiling of the full seven-song Tortured Poets section with its muted, typewriter-strewn staging.\n\nOther eras got refreshed too, with "cardigan" now sung from the roof of a transparent wooden cabin under autumnal light, and she worked the crowd in French between songs. Paramore, the openers for the whole European leg, worked a Talking Heads cover into their set.',
        sources: [
          { outlet: 'Billboard', url: 'https://www.billboard.com/lists/taylor-swift-paris-eras-tour-europe/' },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-tortured-poets-eras-tour-set-list-post-1235019481/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/05/Taylor-Swift-_-The-Eras-Tour-Paris-France-04-2024-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Kevin Mazur/TAS24/Getty Images',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 5,
      day: 9,
      category: 'fashion',
      title: 'A new crystal bodysuit, and a dress covered in lyrics',
      snippet: 'A brand-new crystal bodysuit for the opening numbers, then a gown printed with her own lyrics for the new album\'s songs.',
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-eras-tour-paris-show-1235680098/',
      // Image-fix pass (2026-07-10): #344 — thumbnailUrl was ?w=204 (204x300 thumbnail). Raised to
      // ?w=942, the same Billboard photo at full res; curl-verified HTTP 200 image/jpeg and
      // vision-confirmed the orange/red crystal bodysuit and ombre boots, matching the caption.
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2024/05/taylor-swift-eras-tour-paris-05-2024-billboard-1240.jpg?w=942',
      moment: {
        context:
          'The "Fortnight" gown was custom Vivienne Westwood Couture: a draped, corseted dress inscribed with the song\'s own confession — "I love you, it\'s ruining my life" — finished with a three-row orb-detail choker in black agate.\n\nIt opened a run of Westwood one-offs across the European leg; by Milan, a new white taffeta corset dress arrived with "Who\'s afraid of little old me?" spelled out in black crystals. The same Paris night refreshed the rest of the wardrobe too, with the new crystal bodysuit and boots for the opening Lover set plus first-time looks in the Fearless and 1989 sets.',
        sources: [
          { outlet: 'Billboard', url: 'https://www.billboard.com/photos/taylor-swift-eras-tour-paris-show-1235680098/' },
          {
            outlet: 'Vivienne Westwood',
            url: 'https://www.viviennewestwood.com/westwood-world/news-and-projects/taylor-swift-the-eras-tour/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/05/taylor-swift-eras-tour-paris-05-2024-billboard-1240.jpg?w=942',
            credit: 'Kevin Mazur/TAS24/Getty Images',
          },
          {
            // Image-fix pass (2026-07-10): #343 — second usage of the same ?w=300 low-res URL
            // flagged on the "Female Rage The Musical" moment; raised to the ?w=942&h=628&crop=1
            // full-res variant (curl-verified 200/image/jpeg, vision-confirmed same photo).
            url: 'https://www.billboard.com/wp-content/uploads/2024/05/Taylor-Swift-_-The-Eras-Tour-Paris-France-04-2024-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Kevin Mazur/TAS24/Getty Images',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 8,
      day: 20,
      category: 'tour',
      title: 'Eight nights at Wembley — more than any solo artist ever',
      snippet:
        'Three nights in June, five more in August: the first solo artist to play Wembley Stadium eight times on a single tour, beating Michael Jackson\'s record.',
      sourceUrl: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-breaks-record-eras-tour-london-wembley-stadium-1235980429/',
      thumbnailUrl: null,
      moment: {
        context:
          '"You just made me the first solo artist to ever play Wembley eight times in a single tour," she told the crowd on her final 2024 London night — Michael Jackson\'s seven-show stand on the 1988 Bad Tour had stood as the mark for 36 years.\n\nAll eight nights sold out, poured over £300 million into London\'s economy by the stadium\'s own accounting, and had the Wembley arch relit in a different era\'s colors through each show; afterward, the venue shipped a bespoke guitar and personalized plectrums to Nashville as a thank-you. The Aug. 20 record-setter doubled as the European leg\'s finale, with Florence Welch joining for the live debut of "Florida!!!" and the "I Can Do It With a Broken Heart" video premiering on the screens after the show.',
        sources: [
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-breaks-record-eras-tour-london-wembley-stadium-1235980429/',
          },
          {
            outlet: 'Wembley Stadium',
            url: 'https://www.wembleystadium.com/news/2024/08/23/10/34/Wembley-Stadium-has-gifted-Taylor-Swift-a-bespoke-guitar-to-mark-her-record-breaking-achievement',
          },
        ],
        // T16 photo pass (2026-07-09): CC BY 4.0 Wikimedia Commons photo from
        // the Aug. 19, 2024 Wembley show. Verified HTTP 200 + image/jpeg;
        // visually confirmed (Wembley bowl mid-show, arch overhead).
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Taylor_Swift_Eras_Tour_London_20240819_1989era.jpg/960px-Taylor_Swift_Eras_Tour_London_20240819_1989era.jpg',
            credit: 'BrigidLIS via Wikimedia Commons, CC BY 4.0',
            caption: 'Wembley Stadium during the 1989 set on Aug. 19, 2024 — night seven of the record eight-show stand.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 10,
      day: 7,
      category: 'sighting',
      title: 'Back at Arrowhead for a Monday night win over New Orleans',
      snippet: 'A rare in-season appearance between international tour legs, cheering on a Chiefs win over the Saints.',
      sourceUrl: 'https://www.today.com/popculture/music/chiefs-schedule-2024-taylor-swift-rcna152582',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2024/10/taylor-swift-glitter-freckles-chiefs-game-2024-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'The Oct. 7, 2024 Monday Night Football matchup against the Saints came in the closing days of the Eras Tour\'s two-month break, less than two weeks before the tour resumed in Miami on Oct. 18. She watched from a suite flanked by both families\' patriarchs — her father Scott Swift and Travis\'s father Ed Kelce.\n\nThe look drew nearly as much coverage as the game: a plaid, off-the-shoulder minidress with black knee-high platform boots, finished with glitter freckles scattered across her nose and cheeks — a sparkly game-day beauty flourish Billboard flagged as the night\'s standout detail.',
        sources: [
          { outlet: 'Today', url: 'https://www.today.com/popculture/music/chiefs-schedule-2024-taylor-swift-rcna152582' },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-monday-night-football-style-glitter-freckles-plaid-dress-boots-1235795383/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/10/taylor-swift-glitter-freckles-chiefs-game-2024-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Jamie Squire/Getty Images',
          },
        ],
      },
    },
    {
      slug: 'yankee-stadium-alcs-game-1',
      year: 2024,
      month: 10,
      day: 14,
      category: 'sighting',
      title: 'Date night at Yankee Stadium for ALCS Game 1',
      snippet:
        'A bye-week baseball date: she and Travis watched the Yankees take Game 1 of the ALCS from a right-field suite, four nights before the Eras Tour restarted in Miami.',
      sourceUrl:
        'https://www.espn.com/nfl/story/_/id/41796394/taylor-swift-travis-kelce-new-york-yankees-cleveland-guardians-alcs-game-one',
      thumbnailUrl: null,
      moment: {
        context:
          "The Oct. 14, 2024 series opener against the Guardians — a 5-2 Yankees win — landed in a lull for both of them: a bye week for Travis's 5-0 Chiefs, and the last days of the Eras Tour's two-month break before Miami on Oct. 18. Cameras found them in the second row of a suite down the right-field line, just above the postseason bunting and a flag marking the Yankees' 1932 World Series title, both in caps on a 50-degree Bronx night. Even the matchup was on theme: Travis grew up in Cleveland Heights, and New York has been her adopted hometown for a decade.",
        sources: [
          {
            outlet: 'ESPN',
            url: 'https://www.espn.com/nfl/story/_/id/41796394/taylor-swift-travis-kelce-new-york-yankees-cleveland-guardians-alcs-game-one',
            source_title: 'Taylor Swift and Travis Kelce in attendance for Game 1 of Guardians-Yankees ALCS series',
            publisher: 'ESPN',
            source_type: 'reputable_press',
            accessed_at: '2026-07-12',
            reliability_score: 4,
          },
          {
            outlet: 'MLB.com',
            url: 'https://www.mlb.com/news/taylor-swift-travis-kelce-attend-alcs-game-1-2024',
            source_title: 'Taylor Swift and Travis Kelce attend ALCS Game 1 2024',
            publisher: 'MLB.com',
            source_type: 'reputable_press',
            accessed_at: '2026-07-12',
            reliability_score: 4,
          },
        ],
      },
    },
    {
      year: 2024,
      month: 11,
      day: 10,
      category: 'sighting',
      title: 'Two more Chiefs games in three weeks: Denver, then Las Vegas',
      snippet: 'Home for the Broncos game on Nov. 10, then back again to watch Kansas City beat the Raiders on Nov. 29.',
      sourceUrl: 'https://www.today.com/popculture/music/chiefs-schedule-2024-taylor-swift-rcna152582',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2024/11/taylor-swift-2024-chiefs-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'The Nov. 10 Broncos game — her fifth straight home game, watched with her parents Scott and Andrea in a red-and-black checkered blazer over a black corset and coordinating skirt — ended in the wildest finish of the Chiefs\' season: Leo Chenal blocked Denver\'s 35-yard field-goal attempt as time expired to preserve a 16-14 win and a 9-0 start.\n\nShe was back for the Black Friday game on Nov. 29, joining her father and Donna Kelce in a red half-zip to watch Kansas City edge the Raiders 19-17 in the NFL\'s Black Friday game, streamed on Prime Video. It made six Arrowhead games on the season for her — all of them Chiefs wins.',
        sources: [
          { outlet: 'Today', url: 'https://www.today.com/popculture/music/chiefs-schedule-2024-taylor-swift-rcna152582' },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-travis-kelce-chiefs-broncos-nfl-game-1235824990/',
          },
          {
            outlet: 'Kansas City Chiefs',
            url: 'https://www.chiefs.com/news/chiefs-defeat-broncos-16-14-behind-a-walk-off-blocked-field-goal',
          },
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/music/taylor-swift-chiefs-raiders-nfl-black-friday-game-rcna181662',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/11/taylor-swift-2024-chiefs-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Jamie Squire/Getty Images',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 12,
      day: 8,
      category: 'tour',
      title: 'The Eras Tour takes its final bow in Vancouver',
      snippet: 'BC Place, 149 shows and 21 months after Glendale — more than 50,000 fans for the last night of the tour.',
      sourceUrl: 'https://www.nbcnews.com/pop-culture/pop-culture-news/end-era-taylor-swifts-eras-tour-coming-close-vancouver-rcna183279',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2024/12/taylor-swift-eras-tour-vancouver-fearless-dec-2024-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'The Dec. 6–8 farewell stand at BC Place drew roughly 60,000 fans a night, with all three shows professionally filmed for a then-unannounced project.\n\nThe final surprise-song slot went out swinging — "Long Live" and a "New Year\'s Day"/"The Manuscript" mashup to close — after "The Tortured Poets Department" itself surfaced on night two and her parents watched a "Never Grow Up"/"The Best Day" pairing on night one. Three days later she posted 17 photos from the finale with a caption borrowed from "All Too Well": "It was rare. I was there. I remember it."',
        sources: [
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/pop-culture/pop-culture-news/end-era-taylor-swifts-eras-tour-coming-close-vancouver-rcna183279',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-eras-tour-ends-message-photos-1235853564/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/12/taylor-swift-eras-tour-vancouver-fearless-dec-2024-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Kevin Winter/TAS24/Getty Images',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 12,
      day: 9,
      category: 'business',
      title: 'The first tour ever to gross $2 billion',
      snippet: 'A final tally of $2,077,618,725 across 10.17 million tickets — roughly double the previous all-time tour record.',
      sourceUrl: 'https://www.forbes.com/sites/maryroeloffs/2024/12/09/taylor-swifts-eras-tour-grossed-2-billion-double-any-other-tour-in-history-report-says/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2024/12/taylor-swift-eras-tour-rogers-centre-toronto-012-2024-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'Her production company confirmed the totals to The New York Times: 10,168,008 tickets across 149 shows on five continents, at an average of $204 a seat — roughly double the previous all-time record, Coldplay\'s $1 billion Music of the Spheres run, which needed more dates to get there.\n\nThe figure counts tickets only; merchandise, the record-grossing concert film, and the Eras Tour Book all sit outside the tally. Pollstar had already estimated the tour crossed the billion-dollar line in November 2023 — the second billion took barely a year more.',
        sources: [
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/maryroeloffs/2024/12/09/taylor-swifts-eras-tour-grossed-2-billion-double-any-other-tour-in-history-report-says/',
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2024/music/news/taylor-swift-2-billion-eras-tour-gross-1236243254/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-eras-tour-earnings-2-billion-sales-1235847513/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/12/taylor-swift-eras-tour-rogers-centre-toronto-012-2024-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Emma McIntyre/TAS24/Getty Images',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 11,
      day: 8,
      category: 'business',
      title: 'A record 7th Album of the Year nomination, for TTPD',
      snippet: 'The most Album of the Year nominations ever for a female artist, announced for the 2025 Grammys.',
      sourceUrl: 'https://www.eonline.com/news/1409681/taylor-swifts-historic-2025-grammy-nominations-prove-shes-anything-but-a-tortured-poet',
      thumbnailUrl: null,
      moment: {
        context:
          'The nomination broke her tie with Barbra Streisand — at six apiece — for the most Album of the Year nods by any female artist, putting TTPD on a ledger that already held Fearless, Red, 1989, folklore, evermore, and Midnights.\n\nThe same announcement gave "Fortnight" a Song of the Year nomination, her eighth in that category and a record no other songwriter holds, en route to a 58-nomination career total. Her stated stance on the stakes: "For me, the award is the work. All I want to do is keep being able to do this." The Grammy itself went to Beyoncé\'s Cowboy Carter at the February 2025 ceremony, ending Swift\'s bid for a fifth Album of the Year win.',
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/1409681/taylor-swifts-historic-2025-grammy-nominations-prove-shes-anything-but-a-tortured-poet',
          },
          { outlet: 'NPR', url: 'https://www.npr.org/2025/02/02/nx-s1-5279565/2025-grammys-beyonce-kendrick-lamar' },
        ],
        // T16 photo pass (2026-07-09): the nominated album's cover from
        // Wikipedia's stable upload.wikimedia.org copy. Verified HTTP 200.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/Taylor_Swift_%E2%80%93_The_Tortured_Poets_Department_%28album_cover%29.png/250px-Taylor_Swift_%E2%80%93_The_Tortured_Poets_Department_%28album_cover%29.png',
            credit: 'Republic Records',
            caption: 'The Tortured Poets Department — her record seventh Album of the Year nominee.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2025,
      month: 2,
      day: 9,
      category: 'sighting',
      title: 'Booed at the Superdome, cheering for a three-peat that fell short',
      snippet: 'Back at her second straight Super Bowl to support Travis — this time drawing boos from a pro-Eagles crowd as Kansas City lost, 40–22.',
      sourceUrl: 'https://www.cbsnews.com/philadelphia/news/taylor-swift-philadelphia-eagles-fans-boo-super-bowl/',
      thumbnailUrl:
        'https://assets3.cbsnewsstatic.com/hub/i/r/2025/02/10/730950cd-100f-4bdf-9500-9ddfae69e3a2/thumbnail/620x413/17ecc99a76627497275a0395c0802f6e/gettyimages-2198604289.jpg',
      moment: {
        context:
          'When the Superdome video boards found her suite during a first-quarter break — right after Adam Sandler and Paul Rudd drew cheers — the heavily pro-Eagles crowd booed, and cameras caught the side-eye and wrinkled nose she shot to Ice Spice beside her before the two laughed it off.\n\nHer section also held her brother Austin, the Haim sisters, longtime friend Ashley Avignone, and the Kelce family, watching the first Chiefs playoff loss she had ever attended. Donald Trump piled on from Truth Social ("MAGA is very unforgiving!"); Serena Williams answered on X: "I love you @taylorswift13 dont listen to those booo!!"',
        sources: [
          {
            outlet: 'CBS News Philadelphia',
            url: 'https://www.cbsnews.com/philadelphia/news/taylor-swift-philadelphia-eagles-fans-boo-super-bowl/',
          },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1413228/super-bowl-taylor-swift-booed-on-jumbotron',
          },
        ],
        photos: [
          {
            url: 'https://assets3.cbsnewsstatic.com/hub/i/r/2025/02/10/730950cd-100f-4bdf-9500-9ddfae69e3a2/thumbnail/620x413/17ecc99a76627497275a0395c0802f6e/gettyimages-2198604289.jpg',
            credit: 'Getty Images',
          },
        ],
      },
    },
    {
      year: 2025,
      month: 2,
      day: 9,
      category: 'fashion',
      title: 'Super Bowl LIX: an oversized white blazer, in Chiefs colors',
      snippet: 'A Saint Laurent double-breasted blazer, crystal denim shorts, and white Paris Texas boots — red-and-white, coordinated for game day.',
      sourceUrl: 'https://www.marieclaire.com/fashion/taylor-swift-2025-super-bowl-outfit/',
      thumbnailUrl: 'https://cdn.mos.cms.futurecdn.net/P5J7PGVYFxPyyTdzTVpya3.jpg',
      moment: {
        context:
          'Styled by Joseph Cassell Falconer, the Feb. 9, 2025 Superdome look built Chiefs red-and-white out of luxury basics: a shell-white Saint Laurent blazer with exaggerated shoulders worn open over a white Alaïa bodysuit styled like a tank top, custom crystal-embellished Purple Brand denim shorts, white over-the-knee Paris Texas boots, and a red Givenchy Nano Voyou bag carrying the team\'s other color.\n\nThe jewelry did the sentimental work: the custom Lorraine Schwartz ruby "T" necklace — repurposed from her Grammys-week styling a week earlier — plus a Retrouvai ruby ring and a Logan Hollowell gold hand chain. Marie Claire read the sharp tailoring as a callback to the Versace blazers she wore performing "The Man" on tour; the game itself went far worse than the outfit, with Kansas City\'s three-peat bid ending 40-22.',
        sources: [
          { outlet: 'Marie Claire', url: 'https://www.marieclaire.com/fashion/taylor-swift-2025-super-bowl-outfit/' },
        ],
        photos: [
          {
            url: 'https://cdn.mos.cms.futurecdn.net/P5J7PGVYFxPyyTdzTVpya3.jpg',
            credit: 'Getty Images',
            // Image-fix pass (2026-07-10): #341 — vision-confirmed no blazer is visible here (white
            // tank top and denim shorts in the Superdome suite). Searched Marie Claire, WWD, Billboard,
            // Hollywood Reporter, Time, and Wikimedia Commons for an arrival/entry shot showing the
            // blazer itself; every candidate found was either the same suite look or unverifiable on
            // an allowlisted host. Added a caption so the photo doesn't misrepresent what's pictured.
            caption:
              'In the Superdome suite after removing the Saint Laurent blazer for the game — the blazer itself was worn on arrival.',
          },
          {
            url: 'https://cdn.mos.cms.futurecdn.net/cpMbV3jceZ6rfU2apDrhta.jpg',
            credit: 'Getty Images',
            // Image-fix pass (2026-07-10): #342 — same finding as #341: no blazer in frame. Caption
            // added rather than an unverified replacement URL; see note on the sibling photo above.
            caption:
              'Full-length view in the Superdome suite, blazer already off; the white tank top and crystal-denim shorts were worn underneath it.',
          },
        ],
      },
    },
    {
      year: 2025,
      month: 8,
      day: 26,
      category: 'relationship',
      title: '"Your English teacher and your gym teacher are getting married"',
      snippet: 'Travis proposed in the garden of his home in Leawood, Kansas, outside Kansas City; the two announced their engagement together on Instagram.',
      sourceUrl: 'https://www.cbsnews.com/news/taylor-swift-travis-kelce-engaged/',
      thumbnailUrl: 'https://i.abcnewsfe.com/a/3a2fb75a-4d19-4924-a103-78328191421c/swift-kelce-engagement-03-ht-jef-250826_1756229507890_hpMain.jpg',
      moment: {
        context:
          'The caption on the joint Aug. 26, 2025 post — "Your English teacher and your gym teacher are getting married" — ran over photos of a garden proposal scene set among pink and white roses, soundtracked on Instagram by "So High School," her TTPD song about him.\n\nTravis had actually proposed about two weeks earlier; his father Ed learned the news by FaceTime from the couple while standing at an Eagles practice. It closed the loop on a courtship that started when Kelce attended the Eras Tour in Kansas City in 2023 and vented about her on New Heights — or as Swift later put it, "This podcast got me a boyfriend."',
        sources: [
          { outlet: 'CBS News', url: 'https://www.cbsnews.com/news/taylor-swift-travis-kelce-engaged/' },
          {
            outlet: 'Newsweek',
            url: 'https://www.newsweek.com/entertainment/taylor-swift-wedding-buzz-timeline-of-her-relationship-with-travis-kelce-12156460',
          },
          {
            outlet: 'KCUR',
            url: 'https://www.kcur.org/arts-life/2025-08-27/taylor-swift-travis-kelce-proposal-leawood-lees-summit-engagement',
          },
        ],
        photos: [
          {
            url: 'https://i.abcnewsfe.com/a/3a2fb75a-4d19-4924-a103-78328191421c/swift-kelce-engagement-03-ht-jef-250826_1756229507890_hpMain.jpg',
            credit: 'ABC News',
          },
        ],
      },
    },
    {
      year: 2025,
      month: 8,
      day: 26,
      category: 'fashion',
      title: 'The ring: an antique-style cut from a goldsmith she\'d had her eye on',
      snippet: "A custom Old Mine cushion-cut diamond by NYC goldsmith Kindred Lubeck — Taylor had shown Travis the designer's work over a year before he proposed.",
      sourceUrl: 'https://www.complex.com/pop-culture/a/holly-riordan/taylor-swift-engagement-ring-designer-launches-brand',
      thumbnailUrl: 'https://i.abcnewsfe.com/a/55d1f976-92b1-44e8-a423-ea8344309260/swift-kelce-engagement-05-ht-jef-250826_1756229507889_hpMain.jpg',
      moment: {
        context:
          'Travis worked directly with Kindred Lubeck — the goldsmith, hand-engraver, and vintage-jewelry collector behind New York\'s Artifex Fine Jewelry, whose work Swift had shown him admiringly well before the proposal — on an old mine brilliant-cut diamond of undisclosed size (expert estimates range from 8 to 15 carats) set in a hand-engraved yellow gold band.\n\nThe old mine cut is a genuinely antique geometry, common from the early 1700s to the late 1800s: squarer than a modern brilliant, with a smaller table, larger culet, and higher crown. Swift\'s verdict on the ring she never had to spec: "I didn\'t know what I would want, but he did somehow."',
        sources: [
          {
            outlet: 'Complex',
            url: 'https://www.complex.com/pop-culture/a/holly-riordan/taylor-swift-engagement-ring-designer-launches-brand',
          },
          {
            outlet: 'ABC News',
            url: 'https://abcnews.com/GMA/Culture/taylor-swift-travis-kelce-engagement-ring/story?id=124993837',
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/maryroeloffs/2025/08/27/taylor-swifts-engagement-ring-may-be-13-carats-expert-says-and-is-worth-an-estimated-650000/',
          },
        ],
        photos: [
          {
            url: 'https://i.abcnewsfe.com/a/55d1f976-92b1-44e8-a423-ea8344309260/swift-kelce-engagement-05-ht-jef-250826_1756229507889_hpMain.jpg',
            credit: 'ABC News',
          },
        ],
      },
    },

    // --- Fashion/photo depth pass (2026-07-04): hotlinked photos added to
    // items above that lacked them, plus new fashion/beauty items covering
    // the TTPD-era aesthetic, red carpet looks, the engagement, and the
    // wedding. Every claim verified against its cited source directly; every
    // photo URL curl-verified as a live image on the outlet's own CDN.
    {
      year: 2024,
      month: 4,
      day: 19,
      category: 'fashion',
      title: "TTPD's grunge, tea-stained aesthetic: the album photography",
      snippet:
        'A sharp turn from Midnights\' glitz — greige, "color-leached" tones, off-the-shoulder slip tops from The Row and Saint Laurent, in bedroom-set portraits shot by Beth Garrabrant.',
      sourceUrl: 'https://www.marieclaire.com/fashion/taylor-swift-tortured-poets-department-fashion-explained/',
      thumbnailUrl: 'https://cdn.mos.cms.futurecdn.net/iLujwgsEwXSAYA4yN98NKS.jpg',
      moment: {
        context:
          'Beth Garrabrant — the photographer behind the folklore and Midnights campaigns — shot the TTPD package as intimate bedroom scenes: tea-soaked sepia, stark black-and-white, and "greige" color-leached tones, with Swift in half-undone slip pieces from The Row, Saint Laurent, Khaite, and Meshki. The dishabille styling was the point — an album about coming apart, photographed mid-unraveling, and a hard swerve from Midnights\' jewel-toned glitz.\n\nStylists traced the era\'s Victorian-gothic, corseted-mourning-gown throughline across red carpets and the tour, mixing high couture (Schiaparelli, Alaïa, Gabriela Hearst) with accessible brands like Free People and Reformation.',
        sources: [
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/taylor-swift-tortured-poets-department-fashion-explained/',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
          },
        ],
        photos: [
          {
            url: 'https://cdn.mos.cms.futurecdn.net/iLujwgsEwXSAYA4yN98NKS.jpg',
            credit: 'Beth Garrabrant',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 4,
      day: 19,
      category: 'fashion',
      title: "'Fortnight' video costuming: an Elena Velez gothic gown",
      snippet:
        'The black Victorian-gothic ensemble from the music video — gown by Elena Velez, top by UNTTLD — later went on display on the V&A\'s Taylor Swift | Songbook Trail.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Fortnight_(song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Taylor_Swift_Songbook_Trail_Fortnight_display_05.jpg/500px-Taylor_Swift_Songbook_Trail_Fortnight_display_05.jpg',
      moment: {
        context:
          'The pieces came from Elena Velez\'s Fall 2024 runway collection — Velez, the 2022 CFDA Emerging Designer of the Year, was raised in Milwaukee by a single mother who captained ships on the Great Lakes, and told Vogue her aim is a "more multi-dimensional representation of womanhood, good and bad."\n\nMonths after the video, the ensemble got museum treatment as one of 13 theatrically staged stops on the V&A\'s free Taylor Swift | Songbook Trail in London (July 27–Sept. 8, 2024), where the museum described it as fusing "monochromatic elements of B-movie sci-fi with a Victorian gothic aesthetic."',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Fortnight_(song)' },
          { outlet: 'V&A', url: 'https://www.vam.ac.uk/articles/va-trail-taylor-swift-songbook' },
          {
            outlet: 'Milwaukee Journal Sentinel',
            url: 'https://www.yahoo.com/entertainment/taylor-swifts-outfit-fortnight-video-011351237.html',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Taylor_Swift_Songbook_Trail_Fortnight_display_05.jpg/500px-Taylor_Swift_Songbook_Trail_Fortnight_display_05.jpg',
            credit: 'Wikimedia Commons',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 9,
      day: 11,
      category: 'fashion',
      title: '2024 VMAs red carpet: a tartan Dior corset and cape',
      snippet:
        'A custom Christian Dior look from the Resort 2025 collection — plaid bustier, open cape-like skirt, thigh-high Stuart Weitzman boots, and lace-up gloves. Fans called it "Reputation"-coded.',
      sourceUrl: 'https://www.marieclaire.com/fashion/taylor-swift-2024-vmas-red-carpet-tartan-corset/',
      thumbnailUrl: 'https://cdn.mos.cms.futurecdn.net/oKWbowx4E2Tgw6ZLAHrb4a.jpg',
      moment: {
        context:
          'The Sept. 11, 2024 look adapted a runway design from Dior\'s Resort 2025 collection — a show Dior staged in Scotland — into a tartan bustier with black hot pants and an open skirt that Marie Claire described as flowing behind her "like a Highland warrior\'s cape." Joseph Cassell Falconer styled it with Stuart Weitzman thigh-high boots, lace-up leather gloves, and a plaid choker cut to match the corset print; hair was a classic blow-out over heavy black eyeliner and a lighter-than-usual red lip.\n\nFans immediately filed the black-and-plaid punk styling as "Reputation"-coded — the same guessing game her black Versace VMAs look had set off in 2023 — though she never commented on the inspiration. Whatever the signal, the night itself became a record haul: she left with seven Moon Persons, including her third straight Video of the Year.',
        sources: [
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/taylor-swift-2024-vmas-red-carpet-tartan-corset/',
          },
          {
            outlet: 'WWD',
            url: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-christian-dior-outfit-mtv-vmas-1236609528/',
          },
        ],
        photos: [
          { url: 'https://cdn.mos.cms.futurecdn.net/oKWbowx4E2Tgw6ZLAHrb4a.jpg', credit: 'Getty Images' },
          { url: 'https://cdn.mos.cms.futurecdn.net/KVrtqLFYbAQRxkZBWvfzjd.jpg', credit: 'Getty Images' },
        ],
      },
    },
    {
      year: 2025,
      month: 2,
      day: 2,
      category: 'fashion',
      title: "2025 Grammys red carpet: sequined Vivienne Westwood, in Chiefs red",
      snippet:
        'A one-shoulder sequined red minidress with a Lorraine Schwartz thigh chain spelling "T" — for Travis — plus Casadei heels.',
      sourceUrl: 'https://www.eonline.com/news/1412664/grammys-2025-taylor-swift-red-carpet-fashion-moment',
      thumbnailUrl:
        'https://assets2.cbsnewsstatic.com/hub/i/r/2025/02/03/d575db15-2694-4564-97b4-2a9bd88ac338/thumbnail/620x930/ea5b6dbdcd77be1409149df490bff1c8/gettyimages-2197310399.jpg',
      moment: {
        context:
          'The custom one-shoulder Vivienne Westwood mini read as a message: Chiefs red, worn Feb. 2 at Crypto.com Arena exactly one week before Kansas City\'s Super Bowl LIX matchup with the Eagles, with the Lorraine Schwartz diamond thigh chain dangling a single "T" fans immediately read as Travis, absent while he prepared for the game.\n\nCasadei heels finished the look as she carried six nominations into the night, including her record seventh Album of the Year nod for The Tortured Poets Department.',
        sources: [
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1412664/grammys-2025-taylor-swift-red-carpet-fashion-moment',
          },
          {
            outlet: 'CBS News Los Angeles',
            url: 'https://www.cbsnews.com/losangeles/news/grammys-red-carpet-2025-highlights/',
          },
        ],
        photos: [
          {
            url: 'https://assets2.cbsnewsstatic.com/hub/i/r/2025/02/03/d575db15-2694-4564-97b4-2a9bd88ac338/thumbnail/620x930/ea5b6dbdcd77be1409149df490bff1c8/gettyimages-2197310399.jpg',
            credit: 'Getty Images',
          },
        ],
      },
    },
    {
      year: 2025,
      month: 8,
      day: 26,
      category: 'fashion',
      title: 'Engagement photos: a Polo Ralph Lauren dress in the garden',
      snippet:
        'A striped silk-blend Ralph Lauren dress with a creamy linen skirt, Louis Vuitton Isola sandals, and a diamond-lined Cartier watch — a deliberately soft, summer-neutral look for the announcement.',
      sourceUrl: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-travis-kelce-engagement-outfits/',
      thumbnailUrl: 'https://cdn.mos.cms.futurecdn.net/UsvU6jYWQoHAFBkAhaQtgS.jpg',
      moment: {
        context:
          'The Aug. 26, 2025 announcement photos were a fashion story in miniature: a $319.99 Polo Ralph Lauren silk-blend dress — vertical black stripes over a creamy linen skirt — with Louis Vuitton\'s caramel-brown Isola sandals, a diamond-lined Cartier watch, heart-shaped earrings, and a deliberately minimalist manicure that kept every eye on the old mine-cut Artifex ring.\n\nTravis coordinated in a Ralph Lauren black polo, khaki shorts, and leather loafers for the same garden shoot, staged under an archway of roses and hydrangeas — one frame catching him mid-kneel. The soft, summer-neutral palette read as intentional: engagement photos styled like the quiet opposite of a stadium spectacle.',
        sources: [
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/celebrity-style/taylor-swift-travis-kelce-engagement-outfits/',
          },
          {
            outlet: 'L\'Officiel',
            url: 'https://www.lofficielusa.com/fashion/taylor-swift-engagement-ring-dress-shoes-watch-outfit-details',
          },
        ],
        photos: [
          { url: 'https://cdn.mos.cms.futurecdn.net/UsvU6jYWQoHAFBkAhaQtgS.jpg', credit: 'Taylor Swift' },
          { url: 'https://cdn.mos.cms.futurecdn.net/zv7w65v5wxxFPVLtRAScqX.jpg', credit: 'Taylor Swift' },
        ],
      },
    },
    // NOTE: the wedding itself, the wedding-gown fashion angle, and everything
    // else dated after 2025-10-03 now live in the-life-of-a-showgirl.mjs —
    // this era ends 2025-10-02 (end-date trim, audit 2026-07-08 rollout PR 2).

    // --- Fashion/photo depth pass 2 (2026-07-04)
    {
      year: 2024,
      month: 2,
      day: 4,
      category: 'fashion',
      title: 'A draped Schiaparelli gown the same night TTPD was announced',
      snippet:
        'A custom off-white Schiaparelli Haute Couture gown by Daniel Roseberry — draped silk crepe with corset-style lacing at the back and a thigh-high slit — worn on the 2024 Grammys red carpet hours before revealing the new album.',
      sourceUrl: 'https://www.redcarpet-fashionawards.com/2024/02/05/taylor-swift-wore-schiaparelli-haute-couture-to-the-2024-grammy-awards/',
      thumbnailUrl:
        'https://www.redcarpet-fashionawards.com/wp-content/uploads/2024/02/Taylor-Swift-Wore-Schiaparelli-Haute-Couture-To-The-2024-Grammy-Awards.jpg',
      moment: {
        context:
          'Adapted from a look in Schiaparelli\'s Fall 2023 ready-to-wear collection, the gown added a dramatic train and high leg slit for the Feb. 4, 2024 ceremony.\n\nSwift paired it with opera-length gloves, black Giuseppe Zanotti sandals, and more than 300 carats of black-and-white diamonds from Lorraine Schwartz, including a choker built around a vintage watch face.',
        sources: [
          {
            outlet: 'Red Carpet Fashion Awards',
            url: 'https://www.redcarpet-fashionawards.com/2024/02/05/taylor-swift-wore-schiaparelli-haute-couture-to-the-2024-grammy-awards/',
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/lifestyle/style/taylor-swift-2024-grammys-dress-schiaparelli-1235815411/',
          },
        ],
        photos: [
          {
            url: 'https://www.redcarpet-fashionawards.com/wp-content/uploads/2024/02/Taylor-Swift-Wore-Schiaparelli-Haute-Couture-To-The-2024-Grammy-Awards.jpg',
            credit: 'Matt Winkelmeyer/Getty Images for The Recording Academy',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 4,
      day: 19,
      category: 'fashion',
      title: 'A sculptural white Toni Matičevski gown opens the "Fortnight" video',
      snippet:
        'The video\'s opening scene puts her in Australian designer Toni Matičevski\'s "Candescence" gown from his Spring/Summer 2024 collection — crisp pearl-white cotton gathered at the hip into a high-low, sculptural silhouette.',
      sourceUrl: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-toni-maticevski-gown-fortnight-music-video-1236321522/',
      thumbnailUrl: 'https://wwd.com/wp-content/uploads/2024/04/taylor-swift-fornight-dress-maticevski.jpg?w=1000',
      moment: {
        context:
          'The "Candescence" gown, from Matičevski\'s Spring 2024 collection, is engineered like sculpture: a strapless bodice with internal boning and a rounded, collar-skimming neckline, in crisp pearl-white crinkled cotton gathered asymmetrically at the hip into a high-low skirt. It surfaces in the video\'s most-teased beat — Swift hurling an object at a glass pane — and WWD framed the bridal-coded silhouette as the romantic counterweight to the video\'s asylum gothic.\n\nThe gown is one of several distinct costume changes across the "Fortnight" video\'s different vignettes — a separate look from the black Elena Velez/Unttld gothic ensemble already covered elsewhere in this era, and from the Celine-designed piece in the video\'s rain-soaked finale.',
        sources: [
          {
            outlet: 'WWD',
            url: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-toni-maticevski-gown-fortnight-music-video-1236321522/',
          },
        ],
        photos: [
          {
            url: 'https://wwd.com/wp-content/uploads/2024/04/taylor-swift-fornight-dress-maticevski.jpg?w=1000',
            credit: 'Republic Records',
            // Image-fix pass (2026-07-10): #345 — vision-confirmed this is a studio/lookbook shot
            // of the correct gown on a runway/lookbook model (not Swift); searched WWD, YouTube's
            // official "Fortnight" video default thumbnail, and press for a Swift-wearing-it still
            // and found none verifiable. Added caption so the record doesn't misrepresent the model
            // as Swift; garment and designer are still correctly identified.
            caption:
              'Designer lookbook image of Toni Matičevski\'s "Candescence" gown, shown here on a runway/lookbook model — not Swift, who wears the same gown in the "Fortnight" video\'s opening scene.',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 8,
      day: 20,
      category: 'fashion',
      title: 'Popflex and WISKII athleisure for "I Can Do It With a Broken Heart"',
      snippet:
        'Rehearsal-style outfits built from independent activewear labels: a plum Popflex Active skort, a lavender Popflex tulle skirt with a matching corset bra, and a scalloped tennis skirt from Kansas-based WISKII Active, paired with custom Christian Louboutin ankle boots.',
      sourceUrl: 'https://www.thezoereport.com/culture/taylor-swift-i-can-do-it-with-a-broken-heart-music-video-outfits',
      // Image-fix pass (2026-07-10): #346 — old thumbnailUrl was a bedazzled Eras Tour stage
      // costume, not the Popflex/WISKII backstage athleisure this moment is about. Replaced with a
      // screenshot of the plum Popflex Active skort look from the official "I Can Do It With a
      // Broken Heart" video, sourced via Blogilates (the Popflex founder's own site, already a
      // cited source below); curl-verified HTTP 200 image/png and vision-confirmed single-frame,
      // no watermark/collage, matching the "plum Popflex Active skort" described in the context.
      thumbnailUrl:
        'https://i0.wp.com/www.blogilates.com/wp-content/uploads/2024/08/Screenshot-2024-08-21-at-10.14.34-AM.png?resize=789%2C491&ssl=1',
      moment: {
        context:
          'The video, styled around Eras Tour rehearsal footage, mixed pieces from small activewear brands (Popflex Active, WISKII Active) with Golden Goose sneakers and an Awe Inspired gold pendant necklace — a deliberately unglamorous, backstage counterpoint to the tour\'s stage costuming.\n\nFor Popflex founder Cassey Ho — the Blogilates creator who designs the line — the placement was surreal: she wrote that her heart pounded and her team\'s Slack "blew up" as she stood frozen in front of the TV counting her own designs onscreen, with Popflex pieces (including the viral lavender Pirouette skort and the Twirl skort) appearing four separate times in the video.',
        sources: [
          {
            outlet: 'The Zoe Report',
            url: 'https://www.thezoereport.com/culture/taylor-swift-i-can-do-it-with-a-broken-heart-music-video-outfits',
          },
          {
            outlet: 'Blogilates',
            url: 'https://www.blogilates.com/blog/popflex-taylor-swift-music-video-outfits/',
          },
        ],
        photos: [
          {
            // Image-fix pass (2026-07-10): #346 — replaced the Eras Tour stage-costume photo (see
            // thumbnailUrl note above) with the same verified Blogilates video screenshot.
            url: 'https://i0.wp.com/www.blogilates.com/wp-content/uploads/2024/08/Screenshot-2024-08-21-at-10.14.34-AM.png?resize=789%2C491&ssl=1',
            credit: 'Screenshot via Blogilates, from Taylor Swift\'s official "I Can Do It With a Broken Heart" music video (Republic Records)',
            caption: 'The plum Popflex Active skort from the video\'s backstage rehearsal footage.',
          },
        ],
      },
    },

    // --- Sightings depth pass (2026-07-05): candid public-appearance moments
    // through the Kelce relationship arc, from the 2025 playoff run to the
    // pre-wedding weekend. Every claim verified against its cited source
    // directly; every photo URL curl-verified as a live image on the
    // outlet's own CDN. The wedding day and engagement announcement itself
    // are covered elsewhere (see notes above) and are not duplicated here.
    {
      year: 2025,
      month: 1,
      day: 18,
      category: 'sighting',
      title: 'Back in the family suite for a Chiefs-Texans divisional playoff win',
      snippet:
        'Sat between her parents Scott and Andrea for the Jan. 18 divisional-round game at Arrowhead, with Caitlin Clark — personally invited by Travis — a row back and Ed Kelce also in the suite.',
      sourceUrl: 'https://www.si.com/wnba/caitlin-clark-watching-chiefs-texans-playoff-game-suite-taylor-swift',
      thumbnailUrl:
        'https://images2.minutemediacdn.com/image/upload/c_crop,x_0,y_0,w_594,h_334/c_fill,w_720,ar_16:9,f_auto,q_auto,g_auto/images/voltaxMediaLibrary/mmsport/si/01jhxrrtgddvpfcwhn8k.jpg',
      moment: {
        context:
          "Kansas City beat Houston 23-14 to advance to the AFC Championship, pulling away from a 13-6 halftime lead in the Jan. 18, 2025 divisional-round game at Arrowhead. Swift watched from the family suite between her parents, Scott and Andrea, with Ed Kelce alongside — the postseason continuation of a regular season she'd spent as an Arrowhead fixture.\n\nIt was Caitlin Clark's first Chiefs game of the season, and this time the invitation came directly from Travis Kelce — Swift had previously invited her to a game via a handwritten letter during the Eras Tour's Indianapolis stop, but this was Clark's first time taking her up on it. Clark, who had passed on the offseason Unrivaled league, sat a row back from the suite's front line.",
        sources: [
          {
            outlet: 'Sports Illustrated',
            url: 'https://www.si.com/wnba/caitlin-clark-watching-chiefs-texans-playoff-game-suite-taylor-swift',
          },
        ],
        photos: [
          {
            url: 'https://images2.minutemediacdn.com/image/upload/c_crop,x_0,y_0,w_594,h_334/c_fill,w_720,ar_16:9,f_auto,q_auto,g_auto/images/voltaxMediaLibrary/mmsport/si/01jhxrrtgddvpfcwhn8k.jpg',
            credit: 'Jamie Squire/Getty Images',
          },
        ],
      },
    },
    {
      year: 2025,
      month: 1,
      day: 26,
      category: 'sighting',
      title: 'A confetti kiss after the Chiefs punch their Super Bowl ticket',
      snippet:
        'Watched the Jan. 26 AFC Championship win over Buffalo from a VIP suite, then shared a kiss with Travis in the falling confetti with his mom Donna Kelce right there for it.',
      sourceUrl: 'https://abcnews.com/GMA/Culture/taylor-swift-celebrates-kansas-city-chiefs-afc-win/story?id=118133249',
      thumbnailUrl:
        'https://i.abcnewsfe.com/a/5bb420d4-c3a8-46c8-91e6-d0ba2429a491/taylor-swift3-ap-ml-250127_1737980318936_hpMain.jpg',
      moment: {
        context:
          'Kansas City beat Buffalo 32-29 in the Jan. 26, 2025 AFC Championship at Arrowhead, sending the Chiefs to a second straight Super Bowl — and a Feb. 9 shot at becoming the first NFL team ever to win three in a row. Kelce had two catches for 19 yards in the win, his fifth conference title as a Chief.\n\nWhen the confetti cannons fired, cameras found the night\'s defining image: Swift and Kelce kissing amid the falling paper with Donna Kelce beside them. By ABC\'s tally, the Chiefs had won every game Swift attended that season — eight regular-season dates at Arrowhead plus both playoff rounds — a streak that would finally break two weeks later in New Orleans.',
        sources: [
          {
            outlet: 'ABC News',
            url: 'https://abcnews.com/GMA/Culture/taylor-swift-celebrates-kansas-city-chiefs-afc-win/story?id=118133249',
          },
        ],
        photos: [
          {
            url: 'https://i.abcnewsfe.com/a/5bb420d4-c3a8-46c8-91e6-d0ba2429a491/taylor-swift3-ap-ml-250127_1737980318936_hpMain.jpg',
            credit: 'AP',
          },
          {
            url: 'https://i.abcnewsfe.com/a/746ae3a7-ce19-4c9c-a703-bc8dfc6d5f42/taylor-swift1-gty-ml-250127_1737980240663_hpEmbed_17x16.jpg',
            credit: 'Getty Images',
          },
        ],
      },
    },
    {
      year: 2025,
      month: 6,
      day: 28,
      category: 'sighting',
      title: 'A pink mini dress for a Saturday-night dinner date',
      snippet:
        'Stepped out for a swanky Saturday-night dinner in New York City in a pink mini dress with gold buttons and beige heels, Travis alongside her in a plain white top and trousers.',
      sourceUrl: 'https://www.tmz.com/2025/06/29/taylor-swift-travis-kelce-new-york-city-dinner-date/',
      // Image-fix pass (2026-07-10): #361 — was the two-panel collage removed from photos[] below;
      // pointed thumbnailUrl at the same single-frame photo that remains there.
      // Image-fix pass (2026-07-10 retry): #362 — swapped in the clean, unbordered frame from
      // the same June 28, 2025 shoot (see photos[] below) to replace the TMZ letterbox crop.
      thumbnailUrl:
        'https://s.yimg.com/lo/mysterio/api/e87265b9418c6734bbad1f64b2faae25457007c449be9b004c51a96dce1798ab/lightyear_networkapi/resizefill_w461_h1024;quality_80;format_webp/https:%2F%2Fmedia.zenfs.com%2Fen%2Fpage_six_articles_559%2F89c5d1c1ef03b7418b67a546d78fe729',
      moment: {
        context:
          'The Saturday, June 28, 2025 dinner date put her in a $3,500 Balmain houndstooth tweed A-line minidress — chain-metal straps, oversized gold buttons, frayed trim — with taupe Christian Louboutin "Miss Jane" sandals and an Aspinal of London trunk bag, while Travis kept it simple in a fresh white top, trousers, and black loafers.\n\nE! priced the full look near $30,000 once the jewelry was counted: a $22,500 Panthère de Cartier necklace on a gold-and-diamond chain, a $3,400 Ofira "Tattoo" diamond ring, and a diamond-studded gold Rolex — red-carpet hardware deployed for a restaurant run, photographed on the way in and published the next morning.',
        sources: [
          { outlet: 'TMZ', url: 'https://www.tmz.com/2025/06/29/taylor-swift-travis-kelce-new-york-city-dinner-date/' },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1419311/taylor-swift-wears-s22-500-necklace-on-travis-kelce-date-night',
          },
        ],
        // Image-fix pass (2026-07-10): #361 — removed the bdcd54... photo (vision-confirmed a
        // two-panel collage behind TMZ's black grunge divider, the junk-collage pattern the
        // protocol rejects). The single-frame photo below already covers the same outing, so this
        // record keeps at least one photo.
        // Image-fix pass (2026-07-10 retry): #362 — broadened search beyond the allowlist found a
        // clean, unbordered single frame of the same June 28, 2025 outing (same construction-site
        // fence/black SUV backdrop as the old TMZ crop): Yahoo Entertainment's syndication of a
        // TheImageDirect.com photo — the same agency credited on E! News's coverage of this outing
        // (already an outlet cited in sources[] above). curl-verified HTTP 200 / image/jpeg;
        // vision-confirmed full-body shot of Swift in the pale-pink tweed Balmain mini dress with
        // gold buttons, holding Kelce's hand, a bystander behind — no letterbox, watermark, or
        // collage. Replaced the TMZ bordered photo with it.
        photos: [
          {
            url: 'https://s.yimg.com/lo/mysterio/api/e87265b9418c6734bbad1f64b2faae25457007c449be9b004c51a96dce1798ab/lightyear_networkapi/resizefill_w461_h1024;quality_80;format_webp/https:%2F%2Fmedia.zenfs.com%2Fen%2Fpage_six_articles_559%2F89c5d1c1ef03b7418b67a546d78fe729',
            credit: 'The Image Direct',
          },
        ],
      },
    },
    {
      year: 2025,
      month: 9,
      day: 14,
      category: 'sighting',
      title: "Unseen at the Eagles rematch, then photographed at Mahomes' birthday",
      snippet:
        'No one caught her walking into Arrowhead for the Sept. 14 Eagles rematch, but a source confirmed she was there — her first game since the Aug. 26 engagement announcement — before surfacing that night at Patrick Mahomes\' 30th.',
      sourceUrl: 'https://www.eonline.com/news/1421829/taylor-swift-at-travis-kelces-chiefs-eagles-game',
      thumbnailUrl: null,
      moment: {
        context:
          'Philadelphia beat Kansas City 20-17 in the Sept. 14, 2025 Super Bowl rematch — and for once, the cameras never found her: no arrival shots, no suite cutaways, just a source confirming to E! that she was in the building for her first game since the engagement announcement.\n\nThe proof of the day came that night instead. Swift and Kelce turned up at Patrick Mahomes\' 30th birthday, hosted by Brittany Mahomes at Travis and Patrick\'s new steakhouse 1587 Prime, where Swift wore a black-and-ivory plaid Simkhai vest and matching skirt with dark red Gucci platform heels; country singer Kane Brown posted the group photo — "Happy birthday Pat & congrats TT" — the next day.',
        sources: [
          { outlet: 'E! News', url: 'https://www.eonline.com/news/1421829/taylor-swift-at-travis-kelces-chiefs-eagles-game' },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1422599/taylor-swift-travis-kelce-at-patrick-mahomes-30th-birthday-party',
          },
        ],
        // T16 photo pass (2026-07-09): no photo of Swift exists from this
        // game (the point of the item) and the party photos are third-party
        // Instagram posts — so a clearly-labeled reference image of the venue
        // per the audit's §A2 stand-in rule. CC BY-SA 4.0, Wikimedia Commons.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Arrowhead_Stadium_%28October_27%2C_2019_-_2%29.jpg/960px-Arrowhead_Stadium_%28October_27%2C_2019_-_2%29.jpg',
            credit: 'Kj1595 via Wikimedia Commons, CC BY-SA 4.0',
            caption: 'Reference image: Arrowhead Stadium (2019 file photo). No photos of Swift surfaced from this game — she attended unseen, confirmed by a source to E!.',
            kind: 'reference',
          },
        ],
      },
    },
    // (The Oct. 12, 2025 Arrowhead/Caitlin Clark sighting and the June 2026
    // Watch Hill pre-wedding weekend moved to the-life-of-a-showgirl.mjs —
    // both post-date this era's 2025-10-02 end.)

    // --- Music backstory depth pass (2026-07-05): song-writing stories for
    // deep-cut TTPD tracks, plus a Grammy business item distinct from the
    // AOTY-nomination item above. Every claim verified against its cited
    // source(s) directly.
    {
      year: 2024,
      month: 4,
      day: 19,
      category: 'music',
      title: 'Down Bad, and the alien-abduction metaphor for being love-bombed',
      snippet:
        'Her own explanation, from Amazon Music\'s track-by-track commentary: "someone rocks your world and dazzles you and then just kind of abandons you" — like an alien abduction the narrator never wanted to end.',
      sourceUrl: 'https://americansongwriter.com/behind-the-dizzying-love-story-in-down-bad-by-taylor-swift/',
      thumbnailUrl: null,
      moment: {
        context:
          'In Amazon Music\'s track-by-track commentary, Swift said: "The metaphor in \'Down Bad\' is that I was comparing sort of the idea of being love bombed, where someone rocks your world and dazzles you and then just kind of abandons you," likening it to alien abduction: "This girl is abducted by aliens but she wanted to stay with them, and then when they drop her back off in her hometown, she\'s like, \'Wait, no, where are you going... I liked it there!\'"\n\nThe song debuted at No. 2 on the Hot 100, directly behind "Fortnight," as part of TTPD\'s historic sweep of the chart\'s entire top 14.',
        sources: [
          {
            outlet: 'American Songwriter',
            url: 'https://americansongwriter.com/behind-the-dizzying-love-story-in-down-bad-by-taylor-swift/',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Down_Bad_(Taylor_Swift_song)' },
        ],
        // T16 photo pass (2026-07-09): CC BY 4.0 Commons photo of the song's
        // Eras Tour staging — the abduction metaphor made literal. Verified
        // HTTP 200 + image/jpeg; visually confirmed (saucer + beam onstage).
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Taylor_Swift_Eras_Tour_TTPD_Set_Down_Bad.jpg/960px-Taylor_Swift_Eras_Tour_TTPD_Set_Down_Bad.jpg',
            credit: 'Vixy13 via Wikimedia Commons, CC BY 4.0',
            caption: 'The "Down Bad" staging in the Eras Tour\'s TTPD set (Paris, May 2024): a flying saucer beams its light down on the abandoned narrator.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 4,
      day: 19,
      category: 'music',
      title: "So Long, London keeps her 'track five' tradition alive",
      snippet:
        'Written and produced with Aaron Dessner at Long Pond: "instinctively I was just kind of putting a very vulnerable, personal, honest, emotional song as track five," she said of the pattern — one TTPD\'s own track five upholds.',
      sourceUrl: 'https://www.billboard.com/lists/taylor-swift-track-fives-ranked/',
      thumbnailUrl: null,
      moment: {
        context:
          'On a 2019 Instagram Live, Swift explained the tradition fans had spotted across her albums: "Track five is kind of a tradition that really started with you guys. Because I didn\'t realize I was doing this, but as I was making albums, I guess, I don\'t know why, but instinctively I was just kind of putting a very vulnerable, personal, honest, emotional song as track five... Because you noticed this, I kind of started to put the songs that were really honest, emotional and vulnerable and personal as track fives."\n\n"So Long, London," written and produced with Aaron Dessner, peaked at No. 5 on the Hot 100 and No. 4 on the Billboard Global 200.',
        sources: [
          { outlet: 'Billboard', url: 'https://www.billboard.com/lists/taylor-swift-track-fives-ranked/' },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/So_Long,_London' },
        ],
        // T16 photo pass (2026-07-09): official lyric-video still — video ID
        // verified via YouTube oEmbed (author @TaylorSwift) this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/CCUr2pNJft4/hqdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the official "So Long, London" lyric video on Taylor Swift\'s YouTube channel.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 4,
      day: 19,
      category: 'music',
      title: "loml flips its own acronym: 'love of my life' becomes 'the loss of my life'",
      snippet:
        'A piano ballad written and produced with Aaron Dessner that spends four minutes setting up "love of my life" before the final lines invert it: "You\'re the loss of my life." "What we thought was for all time, was momentary."',
      sourceUrl: 'https://en.wikipedia.org/wiki/Loml',
      thumbnailUrl: null,
      moment: {
        context:
          'Recorded at Long Pond Studios with vocals captured at Electric Lady (New York) and Prime Recording (Nashville), and mixed by Serban Ghenea, "loml" builds as a conventional "love of my life" ballad until its closing lines reveal the title\'s other reading.\n\nCritics singled out the reversal: The A.V. Club and Uproxx both praised the lyrical twist on the phrase, calling the final line a "perfectly simple epitaph."',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Loml' }],
        // T16 photo pass (2026-07-09): official lyric-video still — video ID
        // verified via YouTube oEmbed (author @TaylorSwift) this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/GZ4vaTRn0HU/hqdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the official "loml" lyric video on Taylor Swift\'s YouTube channel.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 4,
      day: 19,
      category: 'music',
      title: 'I Can Fix Him (No Really I Can): a saloon-twang song about the savior complex',
      snippet:
        'Written and produced with Jack Antonoff, built on tremolo guitars and Old West imagery — a confident chorus that cracks by the final line into: "Whoa, maybe I can\'t."',
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Can_Fix_Him_(No_Really_I_Can)',
      thumbnailUrl: null,
      moment: {
        context:
          'Recorded across Conway (Los Angeles), Electric Lady (New York), and Rue Boyer A (Paris), the track leans on Western and Americana textures — tremolo guitars, Moog Voyager, Mellotron — that critics described as sounding "like it comes straight out of an Old West saloon."\n\nThe lyrics track a narrator convinced she can reform an unreliable partner despite everyone\'s warnings, before the chorus\'s title refrain buckles into doubt on the final repeat.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/I_Can_Fix_Him_(No_Really_I_Can)',
          },
        ],
        // T16 photo pass (2026-07-09): official lyric-video still — video ID
        // verified via YouTube oEmbed (author @TaylorSwift) this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/OKWfv-x2rdU/hqdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the official "I Can Fix Him (No Really I Can)" lyric video on Taylor Swift\'s YouTube channel.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 5,
      day: 4,
      category: 'music',
      title: 'The Smallest Man Who Ever Lived: the distorted bridge that closed out a historic chart sweep',
      snippet:
        'A hushed piano ballad in 7/4 time that detonates into a distorted-vocal rock bridge — and the song that filled the No. 14 slot when TTPD became the first album ever to hold the entire top 14 of the Hot 100 at once.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Smallest_Man_Who_Ever_Lived',
      thumbnailUrl: null,
      moment: {
        context:
          'Written and produced with Aaron Dessner and recorded partly in Biarritz, France, the song switches from a 7/4 verse-and-chorus meter to 4/4 for a bridge that swaps its piano ballad restraint for distorted vocals and a rock climax.\n\nThe Nation\'s Stephanie Burt called it "the harshest, most dismissive, most condemnatory song that Swift has ever written," while Rolling Stone\'s Rob Sheffield ranked it among her best breakup songs. On the Hot 100 dated May 4, 2024, it landed at No. 14 — the closing slot the week TTPD\'s 31 tracks filled the entire top 14, a first for any artist, with "Cruel Summer" charting too for 32 songs on the Hot 100 at once.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Smallest_Man_Who_Ever_Lived' },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/mollybohannon/2024/04/29/taylor-swift-becomes-first-artist-to-take-top-14-spots-on-billboard-hot-100-chart/',
          },
        ],
        // T16 photo pass (2026-07-09): official lyric-video still — video ID
        // verified via YouTube oEmbed (author @TaylorSwift) this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/Atdzfj8LcuY/hqdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the official "The Smallest Man Who Ever Lived" lyric video on Taylor Swift\'s YouTube channel.',
            kind: 'archival',
          },
        ],
      },
    },
    // (The Oct. 2025 "The Black Dog" BBC Radio 2 item moved to
    // the-life-of-a-showgirl.mjs — it happened on the Showgirl press run.)
    {
      year: 2024,
      month: 11,
      day: 8,
      category: 'business',
      title: "Fortnight's Grammy double: nominated for both Record and Song of the Year",
      snippet:
        'Alongside TTPD\'s Album of the Year nod, "Fortnight" picked up matching Record and Song of the Year nominations and a Best Music Video nod, while "us." with Gracie Abrams landed Best Pop Duo/Group Performance — six 2025 Grammy nominations in all.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-reacts-2025-grammy-nominations-tortured-poets-1235830451/',
      thumbnailUrl: null,
      moment: {
        context:
          'Reacting from the Toronto stop of the Eras Tour after the Nov. 8, 2024 nominations announcement, Swift told the crowd: "Everything that happens is a direct reflection of the passion you show, and you guys got this album nominated for six Grammys. So thank you."\n\nThe Song of the Year nod for "Fortnight" gave her eight career nominations in that category, the most of any artist. None of the six converted into a win at the Feb. 2, 2025 ceremony, where Beyoncé\'s Cowboy Carter took Album of the Year.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-reacts-2025-grammy-nominations-tortured-poets-1235830451/',
          },
          {
            outlet: 'Capital FM',
            url: 'https://www.capitalfm.com/news/music/taylor-swift-grammys-nominations-2025/',
          },
        ],
        // T16 photo pass (2026-07-09): still from the Grammy-nominated
        // official music video (Best Music Video nominee) — video ID verified
        // via YouTube oEmbed (author @TaylorSwift) this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/q3zqJs7JUCQ/hqdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the "Fortnight" music video — itself a 2025 Grammy nominee for Best Music Video alongside the song\'s Record and Song of the Year nods.',
            kind: 'archival',
          },
        ],
      },
    },

    // (The July 2026 Madison Square Garden wedding item moved to
    // the-life-of-a-showgirl.mjs with this era's end-date trim.)

    // --- Deep timeline fill (2026-07-08, content/deep-d): release-week
    // records, the European leg's peaks and its darkest week, the tour's
    // wind-down economy, and the masters buyback that closed the era's
    // biggest storyline. Every claim verified against its cited source(s)
    // this session; items carry the audit's additive provenance fields.
    {
      slug: 'ttpd-billboard-200-debut',
      year: 2024,
      month: 5,
      day: 4,
      category: 'business',
      title: '2.61 million in week one — her 14th No. 1, tying Jay-Z',
      snippet:
        'The biggest album week in nine years: 2.61M units, 1.914M of them real sales, plus the largest streaming week ever logged for an album at 891 million on-demand plays.',
      sourceUrl: 'https://www.billboard.com/lists/taylor-swift-tortured-poets-department-debut-number-one-billboard-200-chart/',
      thumbnailUrl: null,
      moment: {
        context:
          'On the chart dated May 4, 2024, TTPD\'s 2.61 million-unit start trailed only Adele\'s 25 (3.482M in 2015) among all weeks since late 2014 and tied her with Jay-Z for the most No. 1 albums by a soloist in the chart\'s history — a record she\'d break outright the following year with Showgirl.\n\nThe 31-track Anthology\'s 891.37 million streams set a new single-week album streaming record.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-tortured-poets-department-debut-number-one-billboard-200-chart/',
            source_title: "Taylor Swift's 'The Tortured Poets Department' No. 1 on Billboard 200",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2024/music/news/taylor-swift-first-week-figure-units-tortured-poets-department-1235984882/',
            source_title: "Taylor Swift Debuts With 2.61 Million Units for 'The Tortured Poets Department,' the Best Number for Any Album in Nine Years",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): the chart-topping album's cover from
        // Wikipedia's stable upload.wikimedia.org copy. Verified HTTP 200.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/Taylor_Swift_%E2%80%93_The_Tortured_Poets_Department_%28album_cover%29.png/250px-Taylor_Swift_%E2%80%93_The_Tortured_Poets_Department_%28album_cover%29.png',
            credit: 'Republic Records',
            caption: 'The Tortured Poets Department cover, shot by Beth Garrabrant — the album behind the biggest sales week in nine years.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'fortnight-top-14-sweep',
      year: 2024,
      month: 5,
      day: 4,
      category: 'business',
      title: 'All 14: TTPD monopolizes the top of the Hot 100',
      snippet:
        '"Fortnight" debuted at No. 1 while the next 13 spots filled with the rest of the album — the first artist ever to hold the Hot 100\'s entire top 14, topping her own Midnights top-10 sweep.',
      sourceUrl: 'https://www.billboard.com/lists/taylor-swift-hot-100-top-14-fortnight-post-malone-record/',
      thumbnailUrl: null,
      moment: {
        context:
          'The May 4, 2024 chart put 32 of her songs on the Hot 100 at once. "Fortnight" — 76.2 million streams in its first week — was her 12th No. 1 and seventh to debut there, tying Ariana Grande for the most No. 1 debuts among women.\n\nShe was already the only artist to have held a full top 10; TTPD stretched the block four slots deeper.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-hot-100-top-14-fortnight-post-malone-record/',
            source_title: "Taylor Swift Sets Record With All Top 14 of Hot 100, 'Fortnight' No. 1",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/mollybohannon/2024/04/29/taylor-swift-becomes-first-artist-to-take-top-14-spots-on-billboard-hot-100-chart/',
            source_title: 'Taylor Swift Becomes First Artist To Take Top 14 Spots On Billboard Hot 100 Chart',
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): the No. 1 single's cover art from
        // Wikipedia's stable upload.wikimedia.org copy. Verified HTTP 200.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/91/Taylor_Swift_-_Fortnight.png/250px-Taylor_Swift_-_Fortnight.png',
            credit: 'Republic Records',
            caption: 'Single artwork for "Fortnight," which led the historic top-14 sweep from No. 1.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'thank-you-aimee-capitalization',
      year: 2024,
      month: 4,
      day: 19,
      category: 'music',
      title: 'thanK you aIMee: the capitalization does the talking',
      snippet:
        'The stray capitals spell KIM, and fans connected the rest — a song about outlasting a schoolyard bully, filed under grudges from 2016. By August, a live version was restyled "thank You aimEe."',
      sourceUrl: 'https://www.today.com/popculture/music/taylor-swift-kim-kardashian-thank-you-aimee-lyrics-rcna148523',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift has never named the subject — the Kardashian reading is fan and critic interpretation, labeled as such, built on the title\'s capitals and the 2016 phone-call feud.\n\nThe plot thickened in August 2024 when a Taylor Nation email restyled the Wembley live version (mashed up with "Mean") as "thank You aimEe" — capitals now spelling YE, and fans re-litigated the whole thing overnight.',
        sources: [
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/music/taylor-swift-kim-kardashian-thank-you-aimee-lyrics-rcna148523',
            source_title: "Are Taylor Swift's 'thanK you aIMee' and 'Cassandra' About Kim Kardashian?",
            publisher: 'Today',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-thank-you-aimee-kanye-west-title-live-1235754448/',
            source_title: "Taylor Swift Shifts From Kim to Ye With New Live Release of 'thank You aimEe'",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): official lyric-video still — video ID
        // verified via YouTube oEmbed (author @TaylorSwift) this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/oaBJlKXBvjk/hqdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the official "thanK you aIMee" lyric video, stray capitals intact.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'florida-dateline-escape-hatch',
      year: 2024,
      month: 4,
      day: 19,
      category: 'music',
      title: 'Florida!!! — a Dateline-inspired duet with Florence Welch',
      snippet:
        'Her own logic: people flee to Florida after crimes and breakups alike. Florence + the Machine turn the reinvention fantasy into the album\'s biggest-sounding song.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Florida!!!',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift said the idea came from watching Dateline: fugitives run to Florida to "reinvent themselves, have a new identity, blend in" — and heartbreak, she figured, wants the same exit.\n\nWelch co-wrote the track and trades verses on it; critics singled out the power-ballad build as the Anthology-era song most built for stadiums, and it later reached Florence\'s highest-ever Hot 100 peak.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Florida!!!',
            source_title: 'Florida!!!',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/music/florida-lyrics-meaning-taylor-swift-rcna149070',
            source_title: "Taylor Swift says 'Florida!!!' was inspired by 'Dateline.' Here's why",
            publisher: 'Today',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): official lyric-video still — video ID
        // verified via YouTube oEmbed (author @TaylorSwift) this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/uEssK8o3jKg/hqdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the official "Florida!!! (feat. Florence + The Machine)" lyric video.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'so-high-school-kelce-references',
      year: 2024,
      month: 4,
      day: 19,
      category: 'music',
      title: 'So High School, annotated by the internet in minutes',
      snippet:
        'The "marry, kiss, or kill me" line traces to a viral 2016 Travis interview clip, and fans caught the nod to his impressions of his dad — the album\'s one openly giddy chapter.',
      sourceUrl: 'https://www.today.com/popculture/music/so-high-school-taylor-swift-lyrics-meaning-rcna148574',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift hasn\'t confirmed the subject on the record — but the reading is barely a theory: in the resurfaced clip Kelce picks "kiss" for Swift in a game of marry-kiss-kill years before they met, and "I feel like laughing in the middle of practice" nods at his impressions of Ed Kelce.\n\nWhen the song joined the Eras Tour setlist, the staging added on-stage bleachers and football-field visuals, and fans took the hint as confirmation enough.',
        sources: [
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/music/so-high-school-taylor-swift-lyrics-meaning-rcna148574',
            source_title: "'So High School' Lyrics: What Does the Taylor Swift Song Mean?",
            publisher: 'Today',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/taylor-swift-fans-thrilled-over-apparent-reference-to-travis-kelce-and-his-dad-ed-on-so-high-school',
            source_title: "Taylor Swift Fans Thrilled Over Apparent Reference to Travis Kelce and His Dad, Ed Kelce, on 'So High School'",
            publisher: 'Entertainment Tonight',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        // T16 photo pass (2026-07-09): official lyric-video still — video ID
        // verified via YouTube oEmbed (author @TaylorSwift) this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/w-FkV0EM_CU/hqdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the official "So High School" lyric video on Taylor Swift\'s YouTube channel.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'murrayfield-scotland-records',
      year: 2024,
      month: 6,
      day: 7,
      category: 'tour',
      title: 'Three nights, three Scottish attendance records at Murrayfield',
      snippet:
        'Night one beat Harry Styles\' all-time Scottish stadium record at nearly 73,000 — then nights two and three each broke it again. 220,000 fans across the weekend.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-thanks-edinburgh-eras-tour-fans-breaking-crowd-record-1235705719/',
      thumbnailUrl: null,
      moment: {
        context:
          'The June 7–9, 2024 Edinburgh stand opened the UK run by re-breaking its own record nightly: night one\'s crowd of nearly 73,000 took the all-time Scottish stadium-concert attendance record, and nights two and three each topped it again, putting roughly 220,000 fans through Murrayfield in a single weekend. Swift thanked the city for crowds that "truly blew me away."\n\nThe stand registered beyond the stadium, literally — seismic monitors picked up the shows — and CNBC pegged the UK leg\'s Edinburgh windfall at an estimated £77M+ (roughly $98M) for the local economy.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-thanks-edinburgh-eras-tour-fans-breaking-crowd-record-1235705719/',
            source_title: "Taylor Swift Thanks Edinburgh Eras Tour Crowds for Record-Breaking Attendance: 'Truly Blew Me Away'",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'CNBC',
            url: 'https://www.cnbc.com/2024/06/13/taylor-swift-eras-tour-shows-trigger-earthquake-readings-in-scotland.html',
            source_title: "Taylor Swift's Eras Tour shows trigger earthquake readings in Scotland; estimated $98 million economic boost",
            publisher: 'CNBC',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): Getty tour photo hosted on Billboard's
        // CDN (from its Edinburgh coverage, the first source above). Verified
        // HTTP 200 + image/jpeg; visually confirmed (folklore-set moss piano).
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/06/Taylor-Swift-_-The-Eras-Tour-Edinburgh-Scotland-02-2024-billboard-1548.jpg?w=1024',
            credit: 'Getty Images (via Billboard)',
            caption: 'The folklore set at Murrayfield Stadium, Edinburgh, during the record-breaking June 2024 stand.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'liverpool-100th-show',
      year: 2024,
      month: 6,
      day: 13,
      category: 'tour',
      title: 'Show 100 at Anfield — and the news the tour will end',
      snippet:
        'She marked the milestone by confirming what fans dreaded: the Eras Tour closes for good in December. "The most exhausting, all-encompassing, but most joyful... thing that has ever happened in my life."',
      sourceUrl: 'https://abcnews.go.com/GMA/Culture/taylor-swift-announces-end-eras-tour-milestone-100th/story?id=111150191',
      thumbnailUrl: null,
      moment: {
        context:
          'June 13, 2024, Anfield Stadium, Liverpool: "You know, this is actually the 100th show of the tour. That blows my mind."\n\nA spokesperson confirmed to ABC News the run would end in Vancouver on Dec. 8 — 149 shows after Glendale, with no further extensions after a tour that had already been extended repeatedly.',
        sources: [
          {
            outlet: 'ABC News',
            url: 'https://abcnews.go.com/GMA/Culture/taylor-swift-announces-end-eras-tour-milestone-100th/story?id=111150191',
            source_title: "Taylor Swift announces end of Eras Tour during milestone 100th show in Liverpool",
            publisher: 'ABC News (Good Morning America)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-celebrates-100th-show-the-eras-tour-1235710864/',
            source_title: 'Taylor Swift Celebrates Her 100th Show on The Eras Tour',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): photo from ABC News' coverage of the
        // Liverpool stand (image dated June 15, 2024, on ABC's own CDN).
        // Verified HTTP 200 + image/jpeg; visually confirmed (onstage, Lover-set bodysuit).
        photos: [
          {
            url: 'https://i.abcnewsfe.com/a/93f66532-3cd0-4fd1-8a10-52594110c859/taylor-swift-nc-jt-240615_1718457109716_hpMain_16x9.jpg?w=1600',
            credit: 'ABC News',
            caption: 'Onstage during the June 2024 Anfield stand in Liverpool, where show 100 doubled as the end-date announcement.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'travis-wembley-stage-cameo',
      year: 2024,
      month: 6,
      day: 23,
      category: 'relationship',
      title: 'Travis Kelce, Eras Tour cast member for a night',
      snippet:
        'In white tie and a top hat, he carried her onto the stage during "I Can Do It With a Broken Heart" at Wembley — his idea, he later admitted, with choreography studied from Dumb and Dumber.',
      sourceUrl: 'https://www.rollingstone.com/music/music-news/taylor-swift-travis-kelce-eras-tour-debut-london-show-1235045292/',
      thumbnailUrl: null,
      moment: {
        context:
          'June 23, 2024, the third London night: Kelce slipped in among the tuxedoed dancers who carry Swift to the couch in the TTPD set\'s vaudeville intro, and the crowd took a beat to clock that the 6-foot-5 dancer was him.\n\nHe called the experience "jarring" in the best way on New Heights and confirmed he\'d pitched the cameo to her himself.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-travis-kelce-eras-tour-debut-london-show-1235045292/',
            source_title: 'Taylor Swift Brings Travis Kelce Onstage at London Eras Tour Show',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2024/music/news/travis-kelce-eras-tour-on-stage-experience-1236059951/',
            source_title: "Travis Kelce Details 'Jarring' On-Stage Eras Tour Experience",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): Getty photo from Rolling Stone's own
        // coverage of this night (filename: night three, London). Verified
        // HTTP 200 + image/jpeg; visually confirmed (Fearless set, Wembley).
        photos: [
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2024/06/TaylorSwiftNightThreeLondon-1.jpg?w=1600',
            credit: 'Getty Images (via Rolling Stone)',
            caption: 'Swift onstage at Wembley on June 23, 2024 — the night Kelce joined the TTPD set\'s tuxedoed cast.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'munich-olympiaberg-hill',
      year: 2024,
      month: 7,
      day: 28,
      category: 'tour',
      title: "Munich's hill: the biggest free show of the Eras Tour",
      snippet:
        'Tens of thousands of ticketless fans climbed the Olympiaberg overlooking the Olympiastadion — and Taylor counted them from the stage: 74,000 inside, "and if the reports are correct, about 50,000 beautiful people outside the stadium."',
      sourceUrl:
        'https://variety.com/2024/music/global/taylor-swift-munich-fans-outside-stadium-hilltop-crowds-1236088585/',
      thumbnailUrl: null,
      moment: {
        context:
          'Munich\'s Olympiastadion sits in a park below a hill with a clear sightline into the bowl — a vantage point no other stop on the tour offered — and for the July 27–28, 2024 shows the Olympiaberg filled with an estimated 40,000 people on the Saturday night alone, watching the whole three-hour production for free. On the Sunday, the tour\'s last night in Germany, she thanked them mid-show: "whether you\'re in the stadium or outside of the stadium... we are so lucky to be here with you."',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2024/music/global/taylor-swift-munich-fans-outside-stadium-hilltop-crowds-1236088585/',
            source_title:
              "Taylor Swift Thanks '50,000 Beautiful People Outside the Stadium' as Munich Shows Draw Massive Hilltop Crowds",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-12',
            reliability_score: 4,
          },
          {
            outlet: 'Consequence',
            url: 'https://consequence.net/2024/07/taylor-swift-eras-tour-munch-giant-hill/',
            source_title: "50,000 people watched Taylor Swift's concert on a hill outside of the stadium in Munich",
            publisher: 'Consequence',
            source_type: 'reputable_press',
            accessed_at: '2026-07-12',
            reliability_score: 4,
          },
        ],
      },
    },
    {
      slug: 'vienna-shows-cancelled',
      year: 2024,
      month: 8,
      day: 7,
      category: 'tour',
      title: 'Vienna, cancelled: a foiled plot, three sold-out shows',
      snippet:
        'Austrian police arrested suspects planning an attack on the Ernst Happel shows, and all three nights were scrapped. She later wrote the cancellations left her with "a new sense of fear" and "tremendous guilt."',
      sourceUrl: 'https://www.nbcnews.com/news/world/taylor-swift-concert-terror-plot-austria-foiled-2-men-arrested-shows-w-rcna165591',
      thumbnailUrl: null,
      moment: {
        context:
          'The Aug. 8–10, 2024 shows were called off after authorities said a 19-year-old who had pledged allegiance to ISIS planned to attack the crowds, with bomb-making materials found at his home.\n\nSwift stayed publicly silent until the tour\'s London dates were safely done, then explained that her silence "was actually showing restraint" — the Wembley run resumed days later under heightened security, and the tour finished without further incident.',
        sources: [
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/news/world/taylor-swift-concert-terror-plot-austria-foiled-2-men-arrested-shows-w-rcna165591',
            source_title: 'Taylor Swift concerts in Vienna canceled after Austrian police say foiled terrorist plot targeted shows',
            publisher: 'NBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-eras-tour-resumes-london-foiled-vienna-terror-plot/',
            source_title: "Taylor Swift's Eras Tour resumes in London after foiled Vienna terror plot",
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): the shows never happened, so no event
        // photo can exist — a clearly-labeled reference image of the venue
        // per the audit's §A2 stand-in rule. Public domain, Wikimedia Commons.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Ernst-Happel-Stadion_02.jpg/960px-Ernst-Happel-Stadion_02.jpg',
            credit: 'Peter Gugerell, public domain, via Wikimedia Commons',
            caption: 'Reference image: Ernst Happel Stadium in Vienna, where all three sold-out shows were cancelled — the concerts themselves never took place.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      slug: 'harris-endorsement-cat-lady',
      year: 2024,
      month: 9,
      day: 10,
      category: 'business',
      title: 'An endorsement signed "Childless Cat Lady"',
      snippet:
        'Minutes after the Harris–Trump debate ended, she endorsed Kamala Harris to 283 million followers — posed with Benjamin Button, sign-off borrowed from JD Vance\'s own insult.',
      sourceUrl: 'https://www.nbcnews.com/politics/2024-election/taylor-swift-endorses-kamala-harris-rcna170547',
      thumbnailUrl: null,
      moment: {
        context:
          'The Sept. 10, 2024 Instagram post called Harris "a steady-handed, gifted leader" and said AI-generated images falsely showing Swift endorsing Donald Trump had pushed her to be transparent about her actual vote.\n\nThe photo — Swift holding Benjamin Button, the cat from her Time cover — and the "Childless Cat Lady" signature did the rest of the messaging.',
        sources: [
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/politics/2024-election/taylor-swift-endorses-kamala-harris-rcna170547',
            source_title: 'Taylor Swift endorses Kamala Harris following presidential debate',
            publisher: 'NBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-kamala-harris-endorsement/',
            source_title: 'Taylor Swift endorses Kamala Harris in post signed "Childless Cat Lady"',
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): Getty file photo CBS News ran with its
        // endorsement coverage (the endorsement itself was an Instagram post,
        // whose cat portrait is not freely rehostable). Verified HTTP 200 +
        // image/jpeg; visually confirmed (Swift onstage, 2024).
        photos: [
          {
            url: 'https://assets2.cbsnewsstatic.com/hub/i/r/2024/09/11/edfca45c-3300-45c7-9daf-30c51d86fe4e/thumbnail/1200x630g2/528b3593333d50ff51e0e52340b1ca69/gettyimages-2166943469.jpg',
            credit: 'Getty Images (via CBS News)',
            caption: 'Swift in 2024 — the file photo CBS News ran with its coverage of the endorsement, which itself was an Instagram post.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'us-open-2024-final',
      year: 2024,
      month: 9,
      day: 8,
      category: 'sighting',
      title: "Box seats at Arthur Ashe for the US Open men's final",
      snippet:
        'A rare non-football sports date: she and Travis watched Sinner beat Fritz from a box with Patrick and Brittany Mahomes — a red-and-white checkered dress and a Gucci bucket hat between them.',
      sourceUrl: 'https://abcnews.go.com/GMA/Culture/taylor-swift-travis-kelce-attend-us-open-mens/story?id=113500642',
      thumbnailUrl: null,
      moment: {
        context:
          'Sept. 8, 2024: two days before her Harris endorsement rearranged the news cycle, the two couples took in the Grand Slam final at Arthur Ashe Stadium.\n\nThe US Open\'s own coverage leaned into it — "in her tennis era" — and the outing became one of the relationship\'s most-photographed non-Arrowhead appearances of the year.',
        sources: [
          {
            outlet: 'ABC News',
            url: 'https://abcnews.go.com/GMA/Culture/taylor-swift-travis-kelce-attend-us-open-mens/story?id=113500642',
            source_title: "Taylor Swift and Travis Kelce attend US Open men's final with Patrick and Brittany Mahomes",
            publisher: 'ABC News (Good Morning America)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'US Open',
            url: 'https://www.usopen.org/en_US/news/articles/2024-09-08/in_her_tennis_era_taylor_swift_and_travis_kelce_attend_2024_us_open.html',
            source_title: 'In her tennis era: Taylor Swift and Travis Kelce attend 2024 US Open',
            publisher: 'US Open (USTA)',
            source_type: 'official',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
        ],
        // T16 photo pass (2026-07-09): AP photo from ABC News' coverage of
        // this outing, on ABC's own CDN. Verified HTTP 200 + image/jpeg;
        // visually confirmed (both couples in the Arthur Ashe box).
        photos: [
          {
            url: 'https://i.abcnewsfe.com/a/667ac5d8-cb5f-48cd-9230-89ea434a7644/Taylor-Travis-Patrick-Brittany-USOpen-1-ap-jm-240908_1725821927016_hpMain_16x9.jpg?w=1600',
            credit: 'AP (via ABC News)',
            caption: 'Swift, Brittany Mahomes, Travis Kelce, and Patrick Mahomes in the box at Arthur Ashe Stadium, Sept. 8, 2024.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'vmas-2024-seven-wins',
      year: 2024,
      month: 9,
      day: 11,
      category: 'business',
      title: 'Seven more VMAs, and a tie with Beyoncé at 30',
      snippet:
        'Video of the Year for "Fortnight" made her the first artist ever to win the top prize three years running — a fifth VOTY overall, and a total that ties Beyoncé for the most VMAs, period.',
      sourceUrl: 'https://www.rollingstone.com/music/music-news/taylor-swift-breaks-records-2024-mtv-vma-awards-1235097031/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Sept. 11, 2024 haul: Video of the Year, Artist of the Year, Best Pop, Best Collaboration, Best Direction, Best Editing, and Song of the Summer — seven of twelve nominations.\n\nThe three-peat (All Too Well in 2022, Anti-Hero in 2023, Fortnight in 2024) and fifth career VOTY are both records nobody else holds, and the night made her the most-awarded solo artist in VMAs history.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-breaks-records-2024-mtv-vma-awards-1235097031/',
            source_title: 'Taylor Swift Broke a Whole Bunch of Records at the 2024 VMAs',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/awards/taylor-swift-vmas-2024-passes-beyonce-top-winner-1235773005/',
            source_title: 'Taylor Swift Ties Beyoncé as All-Time Top VMAs Winner',
            publisher: 'Billboard',
            source_type: 'awards_database',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): Getty ceremony photo from Rolling
        // Stone's own records coverage (first source above). Verified HTTP
        // 200 + image/jpeg; visually confirmed (Moon Person in hand, onstage).
        photos: [
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2024/09/taylor-record-for-VOY-awards.jpg?resize=1600%2C900',
            credit: 'Getty Images (via Rolling Stone)',
            caption: 'Accepting one of seven Moon Persons at the 2024 VMAs on Sept. 11, 2024 — including a record third straight Video of the Year.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'eras-tour-book-target',
      year: 2024,
      month: 11,
      day: 30,
      category: 'business',
      title: 'The Eras Tour Book sells 814,000 copies in two days',
      snippet:
        'Target-exclusive, $39.99, 256 pages of tour photos and her own notes: it moved 814K over Thanksgiving weekend and nearly a million in week one — 2024\'s biggest new-release print debut.',
      sourceUrl: 'https://variety.com/2024/music/news/taylor-swift-eras-tour-book-sales-blockbuster-debut-two-days-1236236012/',
      thumbnailUrl: null,
      moment: {
        context:
          'Released in stores on Black Friday, Nov. 29, 2024, alongside a Target-exclusive TTPD Anthology pressing.\n\nPer Circana BookScan data, the two-day number was among the biggest for any nonfiction title in the modern era — trailing only Barack Obama\'s A Promised Land for a first week — and Target itself called it the fastest-selling new release book it had carried in four years.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2024/music/news/taylor-swift-eras-tour-book-sales-blockbuster-debut-two-days-1236236012/',
            source_title: "Taylor Swift Eras Tour Book Sells Reported 814,000 Copies in Two Days",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-eras-book-sales-target-1235193109/',
            source_title: "Taylor Swift's 'Eras Tour Book' Sells Record-Breaking 814,000 Copies in Just Two Days",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Target',
            url: 'https://corporate.target.com/press/release/2024/12/the-official-taylor-swift-the-eras-tour-book-available-exclusively-at-target-sells-nearly',
            source_title: "The Official 'Taylor Swift | The Eras Tour Book' Sells Nearly 1 Million Copies in First Week",
            publisher: 'Target (press release)',
            source_type: 'official',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
        ],
        // T16 photo pass (2026-07-09): product image of the book from
        // Variety's sales coverage (first source above). Verified HTTP 200 +
        // image/png; visually confirmed (the book itself).
        photos: [
          {
            url: 'https://variety.com/wp-content/uploads/2024/12/targetbook.png?w=1000',
            credit: 'Target (via Variety)',
            caption: 'The Eras Tour Book — 256 pages, $39.99, Target-exclusive, and 2024\'s biggest new-release print debut.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'spotify-wrapped-2024',
      year: 2024,
      month: 12,
      day: 4,
      category: 'business',
      title: "Spotify's top global artist, again — 26.6 billion streams",
      snippet:
        'Wrapped 2024 crowned her the most-streamed artist on earth for the second straight year, with TTPD as the year\'s most-streamed album — and the first-ever Wrapped badge stamped on her profile.',
      sourceUrl: 'https://newsroom.spotify.com/2024-12-04/taylor-swift-takes-the-crown-as-spotifys-global-top-artist-of-2024/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Dec. 4, 2024 reveal put her ahead of The Weeknd, Bad Bunny, Drake, and Billie Eilish on more than 26.6 billion global streams for the year — the Eras Tour and the Anthology feeding each other. Women held most of the global top-10 albums chart, with TTPD on top.\n\nSpotify built her a victory lap to match: the platform\'s first-ever "Global Top Artist Badge" stamped on her profile, era-themed Easter-egg animations hidden in the play button across her discography, augmented-reality friendship bracelets on Snapchat, celebration billboards in 11 cities, and personalized thank-you videos from Swift dropped into loyal listeners\' own Wrapped stories.',
        sources: [
          {
            outlet: 'Spotify Newsroom',
            url: 'https://newsroom.spotify.com/2024-12-04/taylor-swift-takes-the-crown-as-spotifys-global-top-artist-of-2024/',
            source_title: "Taylor Swift Takes the Crown as Spotify's Global Top Artist of 2024",
            publisher: 'Spotify Newsroom',
            source_type: 'official',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2024/music/news/spotify-wrapped-2024-taylor-swift-1236233812/',
            source_title: 'Spotify Wrapped 2024: Taylor Swift Is Most-Streamed Artist, Women Dominate Global Top 10 Albums Chart',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): Spotify's own Wrapped Top Artist
        // graphic from the cited newsroom post. Verified HTTP 200 + image/png.
        photos: [
          {
            url: 'https://storage.googleapis.com/pr-newsroom-wp/1/2024/12/Wrapped-FTRHeader_TopArtist-1.png',
            credit: 'Spotify Newsroom',
            caption: 'Spotify\'s Wrapped 2024 Global Top Artist announcement graphic.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'masters-buyback-shamrock',
      year: 2025,
      month: 5,
      day: 30,
      category: 'business',
      title: '"All of the music I\'ve ever made... now belongs... to me"',
      snippet:
        'The ending the Taylor\'s Versions were building toward: she bought her first six albums back from Shamrock Capital — masters, videos, artwork, unreleased songs, everything.',
      sourceUrl: 'https://www.billboard.com/pro/taylor-swift-regains-control-master-recordings-shamrock/',
      thumbnailUrl: null,
      moment: {
        context:
          'Announced May 30, 2025 in a letter on her website; Billboard reported a price around $360 million to the firm that had bought the catalog out of the Scooter Braun dispute.\n\nThe same letter settled the re-record questions: Reputation (Taylor\'s Version) had barely been touched — she\'d kept hitting a wall re-making an album she felt needed nothing fixed — while her re-recorded debut was done and could "have its moment" someday.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-regains-control-master-recordings-shamrock/',
            source_title: 'Taylor Swift Buys Back Her Masters From Shamrock, Reclaiming Her First Six Albums',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2025/music/news/taylor-swift-buys-rights-first-six-albums-shamrock-1236413964/',
            source_title: 'Taylor Swift Shocker: Singer Buys Back Rights to First Six Albums',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Bloomberg',
            url: 'https://www.bloomberg.com/news/articles/2025-05-30/taylor-swift-buys-back-her-early-albums-after-years-long-crusade',
            source_title: 'Taylor Swift Buys Back Her Early Albums After Years-Long Crusade',
            publisher: 'Bloomberg',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 photo pass (2026-07-09): the celebration photo released with
        // her announcement (Swift with the six reclaimed albums), as hosted
        // by Billboard's coverage. Verified HTTP 200 + image/jpeg; visually
        // confirmed (Swift seated with the six LPs fanned out).
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2025/05/02-taylor-swift-with-albums-2025-billboard-1548.jpg?w=1024',
            credit: 'Courtesy of Taylor Swift (via Billboard)',
            caption: 'The photo released with the May 30, 2025 announcement: Swift with the six albums she bought back from Shamrock Capital.',
            kind: 'primary',
          },
        ],
      },
    },
  ],
};
