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
      day: 21,
      category: 'music',
      title: "iHeartRadio's six-night Midnights takeover",
      snippet:
        'Six nights at midnight, Oct 21–26 — the whole album on iHeartRadio stations nationwide, with Taylor sharing some of the stories behind the songs herself.',
      sourceUrl:
        'https://www.iheart.com/content/2022-10-20-celebrate-midnights-with-taylor-swift-on-iheartradio/',
      thumbnailUrl: 'https://i.iheart.com/v3/re/new_assets/6351759fded3848f2718dc48',
      moment: {
        context:
          'The takeover ran nightly at midnight from Oct. 21 through Oct. 26, 2022, airing the complete album on iHeartRadio stations nationwide plus the Hit Nation and Today\'s Mix stations on the iHeartRadio app — with Taylor herself supplying behind-the-scenes commentary on the songs between tracks. Her framing for the special matched the album\'s pitch: "a collection of music written in the middle of the night," representing "13 sleepless nights scattered throughout my life."\n\nThe radio play came with a fan hook, too: each night carried a code word listeners could enter at iHeartRadio\'s Taylor Swift page for a chance to win merchandise autographed by Taylor. It was one spoke of a saturation-level release week that also included the lyric-billboard partnership with Spotify and the "Anti-Hero" video dropping eight hours after the album.',
        sources: [
          {
            outlet: 'iHeartRadio',
            url: 'https://www.iheart.com/content/2022-10-20-celebrate-midnights-with-taylor-swift-on-iheartradio/',
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added iHeartRadio's own
        // promo graphic for this exact takeover from the same article
        // (i.iheart.com CDN, 1200px) — the campaign creative with the
        // nightly code-word contest the page describes. Both images verified
        // HTTP 200 + image/jpeg, downloaded, and visually confirmed this
        // session.
        photos: [
          {
            url: 'https://i.iheart.com/v3/re/new_assets/6351759fded3848f2718dc48',
            credit: 'iHeart',
            focalPoint: '58% 43%',
          },
          {
            url: 'https://i.iheart.com/v3/re/new_assets/6351b3beded3848f2718dc4c',
            credit: 'iHeartRadio',
            caption:
              "iHeartRadio's promo for the six-night takeover — listen for a code word at midnight, enter to win signed merch.",
            kind: 'archival',
            focalPoint: '72% 40%',
          },
        ],
      },
    },
    {
      significance: 'notable', // an outright platform streaming record on release day (docs/decisions.md, 2026-07-19)
      year: 2022,
      month: 10,
      day: 21,
      category: 'business',
      title: 'Midnights breaks Spotify in a single day',
      snippet:
        "184.6 million album streams in 24 hours, while Taylor's full catalog hit 228 million streams — at the time Spotify's biggest day ever for both, album and artist, records she'd break herself with The Tortured Poets Department in 2024.",
      sourceUrl:
        'https://newsroom.spotify.com/2022-10-22/taylor-swift-breaks-two-records-with-midnights-becoming-the-most-streamed-artist-on-spotify/',
      thumbnailUrl: 'https://storage.googleapis.com/pr-newsroom-wp/1/2022/10/Screenshot_20221022-153332.png',
      moment: {
        context:
          "The 184.6 million album streams blew past the single-day record Drake's Certified Lover Boy had set at 153.4 million in 2021, and the 228 million catalog-wide streams took the most-streamed-artist-in-a-day mark from Bad Bunny, who'd held it since May 2022 at 183 million. Guinness World Records logged the day as three records at once: most-streamed album in 24 hours, most day-one streams for an album, and most-streamed act in a single day.\n\nThe launch had a runway, too — Spotify and Taylor had partnered to reveal Midnights lyrics on billboards around the world in the lead-up to release, her fifth album in roughly two years.",
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
            focalPoint: '48% 55%',
          },
          {
            url: 'https://storage.googleapis.com/pr-newsroom-wp/1/2022/10/TS-Midnights_LDN-2.jpg',
            credit: 'Spotify Newsroom',
            caption:
              'One of the "Meet us at midnight" billboards Spotify ran with Taylor in the lead-up to release — this one over a rainy London staircase, counting down to the drop that broke the platform\'s single-day records.',
            kind: 'archival',
            focalPoint: '48% 40%',
          },
          {
            url: 'https://www.guinnessworldrecords.com/news/2022/10/images/split-image-of-taylor-swift-sitting-in-a-dark-room-and-the-album-cover-of-midnights-723266.jpg',
            credit: 'Guinness World Records',
            caption:
              "Guinness World Records' own art for logging the day as three records at once: most-streamed album in 24 hours, most day-one album streams, and most-streamed act in a single day.",
            kind: 'archival',
            focalPoint: '75% 45%',
          },
        ],
      },
    },
    {
      year: 2022,
      month: 10,
      day: 30,
      category: 'business',
      // Cross-link (candidate #1021): the album that later broke this personal
      // best — Showgirl's record-shattering 4.002-million debut week.
      relatedIds: ['moment:vault-tloas-4-002-million-in-a-week-the-biggest-album-debut-ever-measure'],
      title: 'Midnights debuts at No. 1 on the Billboard 200',
      snippet:
        "1.578 million equivalent units in week one — Taylor's 11th No. 1 album, tying Barbra Streisand for the most by a woman.",
      sourceUrl:
        'https://www.billboard.com/music/chart-beat/taylor-swift-midnights-debut-number-one-billboard-200-albums-chart-1235163377/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2022/10/02-taylor-swift-midnights-cr-Beth-Garrabrant-billboard-1548.jpg?w=1024',
      moment: {
        context:
          "The 1.578 million units broke down to 1.14 million in pure sales — 575,000 of them on vinyl — at the time the biggest vinyl week since electronic tracking began in 1991, a record she would go on to break repeatedly — plus 549 million on-demand streams, the third-largest streaming week any album had ever posted. It was the largest week for any album since Adele's 25 in 2015, and it made Taylor the only artist in history with five different albums that each sold a million copies in a single week.\n\nThe 11th No. 1 tied Barbra Streisand for the most Billboard 200 chart-toppers by a woman — a tie Taylor would break eight months later when Speak Now (Taylor's Version) became her 12th.",
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
            focalPoint: '57% 30%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2022/10/01-taylor-swift-midnights-cr-Beth-Garrabrant-billboard-1548.jpg?w=1024',
            credit: 'Beth Garrabrant/Billboard',
            caption:
              "Another frame from Beth Garrabrant's Midnights press shoot, run by Billboard with its chart story on the 1.578-million-unit debut.",
            kind: 'archival',
            focalPoint: '45% 25%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2022/10/taylor-swift-tonight-show-cr-todd-owyoung-1548.jpg?w=1024',
            credit: 'Todd Owyoung/NBC (via Billboard)',
            caption:
              'Walking out on The Tonight Show Starring Jimmy Fallon on Oct. 24, 2022 — the release-week victory lap while Midnights was racking up the numbers behind this chart debut.',
            kind: 'archival',
            focalPoint: '47% 20%',
          },
        ],
      },
    },
    {
      year: 2022,
      month: 10,
      day: 21,
      category: 'music',
      // Cross-link (candidate #1356, 2026-07-25): the single's chart run — same song.
      relatedIds: ['moment:vault-midnights-anti-hero-dominates'],
      title: "The 'Anti-Hero' video, and the scale scene that got cut",
      snippet:
        "Three versions of herself confronting body image and insecurity — including a scale reading 'fat' that got edited out after online criticism.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Anti-Hero_(song)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Taylor_Swift_-_Anti-Hero.png',
      moment: {
        context:
          "Taylor wrote and directed the video herself and premiered it on YouTube eight hours after the song dropped, reuniting with cinematographer Rina Yang. It splits her in three — a 'current' Taylor in a 1970s-style suburban kitchen, an early-2010s version in a tour dance outfit, and a giant who crawls into a neighbor's dinner party — and peaks with a dream-sequence funeral where Mike Birbiglia, John Early, and Mary Elizabeth Ellis, as her sons and daughter-in-law, discover she's left them each 13 cents (the real assets went to the cats).\n\nThe scale scene — one Taylor stepping on a bathroom scale that reads 'fat' while another shakes her head, an allusion to her past struggles with eating disorders — was edited out after online criticism, a cut that drew its own backlash from commentators arguing she shouldn't have to sanitize her own trauma. She's described the song as coming from feeling her life had become 'unmanageably sized' and struggling 'with the idea of not feeling like a person' — a 'guided tour' through the things she hates about herself.",
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Anti-Hero_(song)' },
          { outlet: 'CBS News', url: 'https://www.cbsnews.com/news/taylor-swift-midnights-3am-anti-hero-video/' },
        ],
        photos: [
          { url: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Taylor_Swift_-_Anti-Hero.png', credit: 'Republic Records' },
        ],
      },
    },
    {
      year: 2022,
      month: 12,
      day: 9,
      category: 'business',
      title: 'The next project is a movie: Searchlight signs her to direct',
      snippet:
        "Seven weeks after Midnights, the follow-up announcement isn't music at all — Searchlight Pictures reveals Taylor will write and direct her first feature film, from an original script she's already written.",
      sourceUrl: 'https://variety.com/2022/film/news/taylor-swift-feature-directing-debut-searchlight-pictures-1235455606/',
      thumbnailUrl: null,
      moment: {
        context:
          'The December 9 announcement was deliberately spare: an original script, written by Taylor, to be produced by Searchlight — the specialty studio behind Nomadland and The Shape of Water — with plot and casting kept under wraps. Searchlight presidents David Greenbaum and Matthew Greenfield called her "a once in a generation artist and storyteller," adding it was "a genuine joy and privilege to collaborate with her as she embarks on this exciting and new creative journey."\n\nThe timing made it read as a promotion, not a pivot: she came into the deal fresh off All Too Well: The Short Film, which had just won her Best Direction at the 2022 VMAs, and she had written and directed the Anti-Hero video herself weeks earlier. Directing a feature was the logical next rung on a ladder she had been climbing in public, one music video at a time.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2022/film/news/taylor-swift-feature-directing-debut-searchlight-pictures-1235455606/',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-feature-length-directorial-debut-original-script-searchlight-1234644555/',
          },
        ],
        // No photo: the announcement had no event imagery; direct image-URL
        // verification is blocked in this environment (T16 pattern) — leave
        // for the photo pass rather than hotlink unverified.
      },
    },
    {
      significance: 'notable', // a real chart-week record at the time, one of four Taylor's Version release milestones this era carries (docs/decisions.md, 2026-07-19)
      year: 2023,
      month: 7,
      day: 16,
      category: 'business',
      title: "Speak Now (Taylor's Version) has 2023's biggest album week to that point",
      // Cross-link (candidate #1451): the "I Can See You" video — this release's
      // marquee vault track — premiered live in Kansas City the same night the
      // album dropped.
      relatedIds: [
        'moment:vault-midnights-the-i-can-see-you-video-reunites-the-taylors',
      ],
      snippet:
        "716,000 units in week one, the biggest album week of 2023 to that point — her 12th No. 1 on the Billboard 200.",
      sourceUrl:
        'https://www.billboard.com/music/chart-beat/taylor-swift-speak-now-taylors-version-number-one-debut-billboard-200-chart-1235372565/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/06/Taylor-Swift-Speak-Now-cr-Beth-Garrabrant-billboard-1548.jpg?w=1024',
      moment: {
        context:
          "507,000 of the 716,000 units were pure sales, including 268,500 on vinyl — at the time the second-largest vinyl week since tracking began in 1991, behind only Midnights' own 575,000.\n\nThe bigger headline: No. 1 album number twelve moved her past Barbra Streisand's 11 for the most Billboard 200 chart-toppers by any woman — a record the two had shared for barely nine months — and pulled her even with Drake for third all-time, behind only The Beatles (19) and Jay-Z (14). The 22-track set paired the re-recorded 2010 album with previously unreleased From the Vault songs, her third re-record after Fearless and Red in 2021.",
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
            focalPoint: '52% 30%',
          },
          {
            url: 'https://i.ytimg.com/vi/lVkKLf4DCn8/maxresdefault.jpg',
            credit: "Taylor Swift/YouTube ('I Can See You' official video)",
            caption:
              "A frame from the 'I Can See You (Taylor's Version) (From The Vault)' video, premiered at the Kansas City Eras show on July 7, 2023 — the vault-track centerpiece of the release week this chart record capped.",
            kind: 'archival',
            focalPoint: '55% 45%',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 10,
      category: 'business',
      // Cross-link (candidate #1332, 2026-07-25): the Oct-2023 billionaire milestone
      // whose own text cites this record sales week as part of the same revenue story.
      relatedIds: ['moment:vault-midnights-billionaire-status-from-the-music-alone'],
      title: "1989 (Taylor's Version) resets the vinyl record",
      snippet:
        '1.653 million units in week one, 693,000 on vinyl alone — a new all-time vinyl sales record, and her 13th No. 1 album.',
      sourceUrl:
        'https://www.billboard.com/music/chart-beat/taylor-swift-1989-taylors-version-number-one-billboard-200-albums-chart-1235463917/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/10/Taylor-Swift-1989-TSV-press-credit-Beth-Garrabrant-2023-billboard-aa-1548.jpg?w=1024',
      moment: {
        context:
          "The 1.653 million-unit week ran on 1.359 million traditional sales — then the largest sales week of her entire career, and the biggest for any album since Adele's 25 moved 3.482 million in 2015 — with 693,000 of those on vinyl, a new vinyl record she'd break again with The Tortured Poets Department and The Life of a Showgirl, smashing the modern-era vinyl record Midnights had set at 575,000 just a year earlier.\n\nIt also out-opened the original: 1989 debuted with 1.287 million in November 2014 on its way to 11 nonconsecutive weeks at No. 1. Chart-topper number thirteen — her lucky number — kept her tied with Drake for the third-most No. 1 albums in Billboard 200 history and extended her record among women.",
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
            focalPoint: '50% 32%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/10/Taylor-Swift-1989-TSV-press-credit-Beth-Garrabrant-2023-billboard-bb-1548.jpg?w=1024',
            credit: 'Beth Garrabrant/Billboard',
            caption:
              "Another Beth Garrabrant frame from the 1989 (Taylor's Version) beach shoot, run with Billboard's chart coverage of the record-resetting vinyl week.",
            kind: 'archival',
            focalPoint: '50% 18%',
          },
          {
            url: 'https://i.ytimg.com/vi/tNxUxm3-658/maxresdefault.jpg',
            credit: 'Taylor Swift/YouTube',
            caption:
              "The official lyric-video art for 'Is It Over Now? (Taylor's Version) (From The Vault)' — the vault track from this release that went on to hit No. 1 on the Hot 100.",
            kind: 'archival',
            focalPoint: '50% 50%',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 10,
      day: 27,
      category: 'music',
      title: 'A vault track that almost made the original 1989',
      snippet: 'A vault track that almost made the original 1989 — cut, then resurrected nearly a decade later.',
      sourceUrl: 'https://uproxx.com/pop/why-now-that-we-dont-talk-not-on-1989-original/',
      thumbnailUrl: null,
      moment: {
        context:
          '"Now That We Don\'t Talk" was written late in the original 1989 sessions and cut for a purely technical reason, as Taylor explained around the re-record\'s release: "It was so hard to leave it behind, but I think we wrote it a little bit towards the end of the process, and we couldn\'t get the production right at the time." Nine years of studio evolution later, the re-recording sessions gave her and her collaborators the room to finally land the synth-pop-and-disco sound the song was reaching for.\n\nAt 2 minutes and 31 seconds it stands as one of the shortest songs in her entire catalog — but, in her telling, one that "packs a punch" and makes its point without overstaying. Released Oct. 27, 2023 on 1989 (Taylor\'s Version), nine years to the day after the original album, it landed among the From the Vault tracks with fans widely speculating it references her past relationship with Harry Styles — the reading Uproxx logged the week it dropped.',
        sources: [
          { outlet: 'Uproxx', url: 'https://uproxx.com/pop/why-now-that-we-dont-talk-not-on-1989-original/' },
        ],
        // Real-photo pass (2026-07-09): the album the vault track finally landed on.
        // Wikipedia's stable upload.wikimedia.org copy; verified HTTP 200 + image/png.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/d/d5/Taylor_Swift_-_1989_%28Taylor%27s_Version%29.png',
            focalPoint: '50% 46%',
            credit: 'Republic Records',
            caption: "1989 (Taylor's Version), the October 2023 re-record where \"Now That We Don't Talk\" finally surfaced from the vault.",
            kind: 'archival',
          },
        ],
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
        'https://upload.wikimedia.org/wikipedia/en/d/d6/Taylor_Swift_The_Eras_Tour_film_promotional_poster.png',
      moment: {
        context:
          "The film's initial nine-week run grossed $179.2 million; the record fell only after a Dec. 31, 2023 China opening through Alibaba Pictures added $8.7 million and carried the total past This Is It's $261.2 million by roughly $400,000.\n\nIt already owned the biggest opening weekend of any concert film — $123.5 million globally ($92.8 million domestic), beating Justin Bieber: Never Say Never's 2011 mark — landing it among 2023's top 20 films. AMC chairman Adam Aron sent his \"congratulations and eternal gratitude\" in the press release, which also noted the film's nomination in the Golden Globes' inaugural Cinematic and Box Office Achievement category.",
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
            url: 'https://upload.wikimedia.org/wikipedia/en/d/d6/Taylor_Swift_The_Eras_Tour_film_promotional_poster.png',
            credit: 'AMC Theatres / Taylor Swift Productions (theatrical release poster)',
            caption: 'The official theatrical release poster for "Taylor Swift: The Eras Tour," which became the highest-grossing concert film ever.',
            kind: 'primary',
            focalPoint: '50% 20%',
          },
          {
            url: 'https://i.ytimg.com/vi/KudedLV0tP0/maxresdefault.jpg',
            credit: 'Taylor Swift Productions/YouTube (official trailer)',
            caption:
              "The wide key art from the film's official trailer on Taylor's own channel — the Lover-set bodysuit against the theatrical campaign's watercolor backdrop.",
            kind: 'archival',
            focalPoint: '25% 25%',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      day: 17,
      category: 'tour',
      significance: 'defining', // the highest-grossing tour ever, an economic/cultural phenomenon (docs/decisions.md, 2026-07-19)
      relatedIds: [
        'moment:vault-midnights-the-presale-that-broke-ticketmaster-and-set-a-sales-record-a',
        'moment:vault-midnights-the-eras-tour-film-opens-to-92-8-million-the-biggest-concert',
        'moment:vault-ttpd-the-eras-tour-takes-its-final-bow-in-vancouver',
        'moment:vault-ttpd-the-first-tour-ever-to-gross-2-billion',
      ],
      title: 'The Eras Tour kicks off in Glendale',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-mid-2", label: "Eras Tour begins", kind: "tour" },
      snippet:
        '44 songs, 3 hours and 15 minutes at State Farm Stadium — opening night moved era by era through songs from all 10 studio albums.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-setlist-eras-tour-1235289197/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/03/taylor-swift-eras-tour-glendale-2-2023-billboard-1548.png?w=1024',
      moment: {
        context:
          'More than 69,000 fans filled State Farm Stadium for her first stadium show since the reputation tour ended in 2018 — "So tonight, we\'re going to be going through an adventure, one era at a time," she told the crowd. The night opened with "Miss Americana & the Heartbreak Prince" in a Versace bodysuit and closed with "Karma," with a folklore cabin, snake motifs for reputation, and white confetti falling like snow through the ten-minute "All Too Well" in between; folklore and Midnights got the deepest dives "to make up for lost time."\n\nRolling Stone\'s review compared the era-by-era acts — each with its own costumes, staging, and visuals — to a Broadway production, and she even joked from the stage about the fans\' evermore discourse: "I absolutely love it, despite what some of you say on TikTok."',
        sources: [
          { outlet: 'Billboard', url: 'https://www.billboard.com/music/pop/taylor-swift-setlist-eras-tour-1235289197/' },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-live-reviews/taylor-swift-the-eras-tour-glendale-review-1234699496/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/03/taylor-swift-eras-tour-glendale-2-2023-billboard-1548.png?w=1024',
            credit: 'Kevin Mazur/Getty Images for TAS Rights Management',
            focalPoint: '43% 25%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/03/taylor-swift-eras-tour-glendale-1-2023-billboard-1548.png?w=1024',
            credit: 'Kevin Mazur/Getty Images for TAS Rights Management (via Billboard)',
            caption:
              'Opening the Lover set in the crystal bodysuit on night one in Glendale, March 17, 2023 — the first minutes of the tour that would define the next two years.',
            kind: 'archival',
            focalPoint: '49% 18%',
          },
          // Photo pass 2026-07-19 (10-defining-events, docs/decisions.md):
          // every real, distinct photo found from the March 17, 2023
          // opening night — different costume/set chapters, multiple outlets.
          // Three ca-times.brightspotcdn.com (LA Times) candidates were
          // dropped here 2026-07-19: curl returned 200 + real image bytes,
          // but the CDN serves a 1x1 placeholder to actual browser requests
          // (Referer-based hotlink protection) — caught only by testing in
          // a real browser (naturalWidth === 1), not by curl. See
          // docs/decisions.md; every other domain in this pass tested clean.
          {
            url: 'https://images.foxtv.com/static.foxla.com/www.foxla.com/content/uploads/2023/03/764/432/GettyImages-1474279449-copy.jpg?tl=1&ve=1',
            focalPoint: '52% 20%',
            credit: 'John Shearer/Getty Images for TAS Rights Management, via FOX 11 Los Angeles',
            caption: 'Arms outstretched with a pink sequined guitar, in the sparkling fringe bodysuit worn for the Lover set.',
            kind: 'primary',
          },
          {
            url: 'https://images.foxtv.com/static.foxla.com/www.foxla.com/content/uploads/2023/03/932/524/GettyImages-1474271127-copy.jpg?tl=1&ve=1',
            focalPoint: '50% 24%',
            credit: 'John Shearer/Getty Images for TAS Rights Management, via FOX 11 Los Angeles',
            caption: 'In a glittering silver blazer dress and knee-high boots, flanked by suited backup dancers in front of the reputation set\'s office-desk backdrop.',
            kind: 'primary',
          },
          {
            url: 'https://images.foxtv.com/static.foxla.com/www.foxla.com/content/uploads/2023/03/932/524/GettyImages-1474459817-copy.jpg?tl=1&ve=1',
            focalPoint: '40% 22%',
            credit: 'John Shearer/Getty Images for TAS Rights Management, via FOX 11 Los Angeles',
            caption: 'Taylor performs during another costume-and-set chapter of the Eras Tour\'s opening night.',
            kind: 'primary',
          },
          {
            url: 'https://images.foxtv.com/static.foxla.com/www.foxla.com/content/uploads/2023/03/932/524/GettyImages-1474275193-copy.jpg?tl=1&ve=1',
            focalPoint: '42% 30%',
            credit: 'John Shearer/Getty Images for TAS Rights Management, via FOX 11 Los Angeles',
            caption: 'Seated atop the moss-covered folklore cabin\'s peaked roof, its chimney smoking, for the acoustic folklore set.',
            kind: 'primary',
          },
          {
            url: 'https://images.foxtv.com/static.foxla.com/www.foxla.com/content/uploads/2023/03/932/524/GettyImages-1474275197-copy.jpg?tl=1&ve=1',
            focalPoint: '72% 52%',
            credit: 'John Shearer/Getty Images for TAS Rights Management, via FOX 11 Los Angeles',
            caption: 'Taylor performs in a separate Getty image from the Eras Tour\'s first night at State Farm Stadium.',
            kind: 'primary',
          },
          {
            url: 'https://neon.reviewjournal.com/wp-content/uploads/2023/03/17580620_web1_Taylor-Swift-Eras-Tour-Opener-Glendale-Ariz_.jpg',
            focalPoint: '40% 22%',
            credit: 'Ashley Landis/AP, via Las Vegas Review-Journal',
            caption: 'Taylor performs during the opening Eras Tour concert at State Farm Stadium on March 17, 2023.',
            kind: 'primary',
          },
          {
            url: 'https://neon.reviewjournal.com/wp-content/uploads/2023/03/17580620_web1_Taylor-Swift-Eras-Tour-Opener-Glendale-Ariz_-31.jpg',
            focalPoint: '53% 15%',
            credit: 'Ashley Landis/AP, via Las Vegas Review-Journal',
            caption: 'A second AP frame captures Taylor during the opening-night Glendale performance.',
            kind: 'primary',
          },
          {
            url: 'https://neon.reviewjournal.com/wp-content/uploads/2023/03/17580620_web1_Taylor-Swift-Eras-Tour-Opener-Glendale-Ariz_-28.jpg',
            focalPoint: '50% 18%',
            credit: 'Ashley Landis/AP, via Las Vegas Review-Journal',
            caption: 'A third Ashley Landis frame shows Taylor performing at the Eras Tour opener.',
            kind: 'primary',
          },
          {
            url: 'https://neon.reviewjournal.com/wp-content/uploads/2023/03/17580620_web1_Taylor-Swift-Eras-Tour-Opener-Glendale-Ariz_-23.jpg',
            focalPoint: '30% 30%',
            credit: 'Ashley Landis/AP, via Las Vegas Review-Journal',
            caption: 'A fourth distinct AP image records Taylor onstage during the March 17 Glendale show.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      day: 17,
      category: 'tour',
      title: 'Glendale becomes Taylor City for the weekend',
      snippet:
        'The mayor made it official: Glendale, Arizona was Taylor City for March 17 and 18 — Eras Tour opening weekend.',
      sourceUrl:
        'https://www.billboard.com/music/music-news/taylor-swift-arizona-city-renamed-eras-tour-1235285285/',
      thumbnailUrl: null,
      moment: {
        context:
          'Mayor Jerry Weiers — quickly dubbed "Mayor Swiftie" — announced the two-day renaming at a March 13 press conference where officials handed out pastel "Welcome to Swift City" T-shirts, reading a proclamation packed with lyric puns: there was no "need to calm down," the city was "fearless and doing something highly unusual," writing "our own love story" and greeting every Swiftie "in style." Fans were encouraged to share smiles "that could light up this whole town" on social media.\n\nThe occasion earned it: she became the first act ever to sell out two nights at State Farm Stadium on a single tour, with GAYLE and Paramore opening the Arizona shows.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-arizona-city-renamed-eras-tour-1235285285/',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/glendale-arizona-renamed-swift-city-taylor-swift-eras-tour-1234695783/',
          },
        ],
        // Real-photo pass (2026-07-09): no freely licensed photo of the "Swift City"
        // press conference exists on Commons; the stadium at the center of the
        // renaming is the honest stand-in, clearly labeled as an older photo.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Cardinals_stadium_crop.jpg',
            credit: 'MCSixth (Flickr), CC BY-SA 2.0, via Wikimedia Commons',
            caption: 'State Farm Stadium in Glendale, Arizona — photographed in 2006, when it was still Cardinals Stadium — the venue Taylor became the first act ever to sell out twice on a single tour.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      day: 17,
      category: 'fashion',
      title: 'Roberto Cavalli and Louboutin for the 1989 set',
      snippet:
        'A Roberto Cavalli two-piece and Christian Louboutin boots for the 1989 set — one look in a night of nonstop costume changes.',
      sourceUrl:
        'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/03/04-Taylor-Swift-The-Eras-Tour-opening-night-billboard-1548.jpg',
      moment: {
        context:
          "For the 1989 act of opening night, Taylor wore a sequined Roberto Cavalli two-piece set with knee-high Christian Louboutin boots — one of the marathon's roughly dozen-plus documented looks across a 44-song, 3-hour-15-minute show that touched all ten studio albums. Billboard's night-one gallery logged the look with a John Shearer photo, one of three photographers (with Kevin Winter and Kevin Mazur) credentialed to shoot the costume parade.\n\nLouboutin boots, meanwhile, ran through nearly every act of the night — the gallery credits the same bootmaker on the Lover, Fearless, and evermore looks and on the navy Oscar de la Renta bodysuit that closed the Midnights set. Roberto Cavalli did double duty too, dressing this act, the gold-fringe Fearless set, and the reputation catsuit in a single show.",
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
        // Shop pass (2026-07-22): the custom Cavalli tour set was never
        // sold at retail -- a current light-blue sequin two-piece,
        // verified in stock, closest real match.
        products: [
          {
            brand: 'Showpo',
            item: 'Kai Two Piece Top and Skirt Set',
            retailer: 'showpo.com',
            url: 'https://www.showpo.com/us/products/kai-two-piece-top-and-skirt-set-sequin-strappy-crop-top-and-wrap-tie-side-mini-skirt-in-sc2605000502',
            price: '$105.00',
            isAlternative: true,
            altNote: 'The custom Cavalli look was never sold at retail -- this light-blue sequin two-piece matches its color, sparkle, and silhouette (boots not separately sourced).',
          },
        ],
      },
    },
    {
      year: 2022,
      month: 10,
      day: 21,
      category: 'release',
      title: 'Midnights (3am Edition) surprises fans with 7 more songs',
      snippet:
        "Dropped three hours after the standard album — \"other songs we wrote on our journey to find that magic 13,\" in Taylor's words.",
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-midnights-3am-edition-1235159092/',
      thumbnailUrl: null,
      moment: {
        context:
          'She teased a "special very chaotic surprise" earlier in the evening, and at 3 a.m. ET — midnight Pacific — it landed: seven more songs, adding roughly 25 minutes to the album. "I think of Midnights as a complete concept album, with those 13 songs forming a full picture of the intensities of that mystifying, mad hour," she wrote, calling the extras "3am tracks" from the journey to find that magic 13.\n\nThe seven — The Great War, Bigger Than the Whole Sky, Paris, High Infidelity, Glitch, Would\'ve, Could\'ve, Should\'ve, and Dear Reader — were written primarily with Jack Antonoff and folklore/evermore collaborator Aaron Dessner, and framed as an extension of the vault-track habit: "Lately, I\'ve been loving the feeling of sharing more of our creative process with you."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-midnights-3am-edition-1235159092/',
          },
          { outlet: 'CBS News', url: 'https://www.cbsnews.com/news/taylor-swift-midnights-3am-anti-hero-video/' },
        ],
        // Real-photo pass (2026-07-09): the album art the 3am tracks extended.
        // Wikipedia's stable upload.wikimedia.org copy; verified HTTP 200 + image/png.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Midnights_-_Taylor_Swift.png',
            credit: 'Republic Records',
            caption: 'The standard-edition Midnights cover — the "complete concept album" of 13 songs the surprise 3am tracks were framed as outtakes from.',
            kind: 'archival',
            focalPoint: '40% 47%',
          },
          {
            url: 'https://i.ytimg.com/vi/iFX6_9h7th0/maxresdefault.jpg',
            credit: 'Taylor Swift/YouTube',
            caption:
              'The white-flag art of the official lyric video for "The Great War" — the opening 3am track, surrendering the fight the song spends its runtime surviving.',
            kind: 'archival',
            focalPoint: '55% 55%',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 12,
      day: 6,
      category: 'business',
      significance: 'defining', // global-recognition peak of the Eras Tour year (docs/decisions.md, 2026-07-19)
      relatedIds: [
          'moment:vault-midnights-the-eras-tour-makes-the-federal-reserves-beige-book',
        'moment:vault-ttpd-an-endorsement-signed-childless-cat-lady',
        // Same-day sibling: the cover-shoot fashion item (Inez & Vinoodh, the
        // Benjamin Button cover). Curiosity ledger #888, Q4.
        'moment:vault-midnights-times-person-of-the-year-cover-shoot-in-three-looks',
      ],
      title: 'Time names her 2023 Person of the Year',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-mid-3a", label: "Person of the Year", kind: "award" },
      snippet:
        "Her own reaction: \"This is the proudest and happiest I've ever felt, and the most creatively fulfilled and free I've ever been.\"",
      sourceUrl: 'https://www.cbsnews.com/news/taylor-swift-time-2023-person-of-the-year/',
      thumbnailUrl:
        'https://assets1.cbsnewsstatic.com/hub/i/r/2023/11/29/524678ff-481f-45ce-b589-ab084c5b2102/thumbnail/1200x630g2/0e9e2c82d8413afa5d970900f56f7835/taylor-swift.jpg',
      moment: {
        // Depth pass 2026-07-20 (curiosity ledger #888): context expanded with
        // the historic firsts (Q3), the full nine-finalist field + editor's
        // rationale (Q2), and Swift's own on-record interview revelations (Q1).
        context:
          'The pick capped the exact year the citation ran through: an Eras Tour so big the Federal Reserve noted its boost to tourism, a concert film AMC was already calling the highest-grossing ever after a $92 million-plus domestic opening weekend, billionaire status reached that fall — helped by 1989 (Taylor\'s Version) — and the title of Spotify\'s most-streamed artist of 2023.\n\nA run of firsts: in 96 years of the franchise she was the first individual picked for achievement in the arts, the first entertainer named solo, and — after the 2017 "Silence Breakers" cover marking her David Mueller trial testimony — the first woman to appear on a Person of the Year cover twice. Editor-in-chief Sam Jacobs\' letter: "No one else on the planet today can move so many people so well… Swift is the rare person who is both the writer and hero of her own story." She was chosen over eight other finalists — King Charles III, Xi Jinping, Vladimir Putin, Sam Altman, the striking Hollywood actors and writers, Fed chair Jerome Powell, the Trump prosecutors, and Barbie.\n\nIn Sam Lansky\'s cover story — her first sit-down interview in years — she dated the Kelce relationship earlier than fans knew ("we actually had a significant amount of time that no one knew"; it began after "Travis very adorably put me on blast on his podcast, which I thought was metal as hell"), called the 2016 Kanye/Kim phone-call fallout a stretch that "took me down psychologically to a place I\'ve never been before," and framed the re-recordings as her answer to the sale of her masters: "My response to anything that happens, good or bad, is to keep making things." Her closing wink at the spectacle: "Are you not entertained?"',
        sources: [
          {
            outlet: 'TIME',
            url: 'https://time.com/6342806/person-of-the-year-2023-taylor-swift/',
            source_title: 'Person of the Year 2023: Taylor Swift',
            publisher: 'TIME',
            source_type: 'primary', // the cover interview itself (Sam Lansky)
            accessed_at: '2026-07-20',
            reliability_score: 5,
          },
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/taylor-swift-time-person-of-the-year-revelations-rcna128268',
            source_title: '8 revelations from Taylor Swift in Time\'s Person of the Year cover story',
            publisher: 'TODAY',
            source_type: 'news',
            accessed_at: '2026-07-20',
            reliability_score: 4,
          },
          {
            outlet: 'CBC News',
            url: 'https://www.cbc.ca/news/entertainment/taylor-swift-person-of-the-year-1.7050425',
            source_title: 'Taylor Swift makes history as Time\'s Person of the Year for 2023',
            publisher: 'CBC News',
            source_type: 'news',
            accessed_at: '2026-07-20',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/biz/news/times-person-of-the-year-hollywood-strikers-taylor-swift-1235820420/',
            source_title: 'Time\'s Person of the Year Finalists',
            publisher: 'Variety',
            source_type: 'news',
            accessed_at: '2026-07-20',
            reliability_score: 4,
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-time-2023-person-of-the-year/',
            source_title: 'Taylor Swift is TIME\'s 2023 Person of the Year',
            publisher: 'CBS News',
            source_type: 'news',
            accessed_at: '2026-07-20',
            reliability_score: 4,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/conormurray/2023/12/06/every-major-event-in-taylor-swifts-record-breaking-2023-from-the-eras-tour-to-time-person-of-the-year/',
            source_title: 'Every Major Event In Taylor Swift\'s Record-Breaking 2023',
            publisher: 'Forbes',
            source_type: 'news',
            accessed_at: '2026-07-20',
            reliability_score: 4,
          },
        ],
        photos: [
          // Curiosity ledger #888, Q6: the actual Dec 25 2023 POTY cover (the
          // Benjamin Button "cat on the shoulders" frame). Verified 2026-07-20
          // per the image protocol — HTTP 200, image/jpeg, 600x800, downloaded
          // and vision-confirmed as the TIME cover; same PetaPixel-hosted file
          // the sibling cover-shoot item carries. Credited TIME.
          {
            url: 'https://petapixel.com/assets/uploads/2023/12/SWIFT.FINAL_.COVER3_-600x800.jpg',
            focalPoint: '50% 30%',
            credit: 'TIME',
            caption: 'The Dec. 25, 2023 Person of the Year cover, shot by Inez van Lamsweerde and Vinoodh Matadin — Taylor with her cat Benjamin Button.',
            kind: 'reference',
          },
          {
            url: 'https://assets1.cbsnewsstatic.com/hub/i/r/2023/11/29/524678ff-481f-45ce-b589-ab084c5b2102/thumbnail/1200x630g2/0e9e2c82d8413afa5d970900f56f7835/taylor-swift.jpg',
            focalPoint: '48% 22%',
            credit: 'CBS News',
          },
          // Photo pass 2026-07-19 (bulk-to-6+, docs/decisions.md): 3 more
          // real, verified photos anchoring the specific 2023 milestones
          // this item's own context names. All curl 200.
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/10/taylor-swift-eras-movie-premiere-2023-billboard-1240.jpg',
            focalPoint: '48% 20%',
            credit: 'Getty Images, via Billboard',
            caption: 'At the Eras Tour concert film premiere, Oct. 11, 2023 — the film AMC was already calling the highest-grossing concert film ever.',
            kind: 'archival',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/d/d6/Taylor_Swift_The_Eras_Tour_film_promotional_poster.png',
            focalPoint: '50% 20%',
            credit: 'AMC Theatres / TAS Rights Management (official poster)',
            caption: 'The theatrical poster for "Taylor Swift: The Eras Tour."',
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg',
            focalPoint: '50% 50%',
            credit: 'Spotify (public domain mark)',
            caption: 'She closed 2023 as Spotify\'s most-streamed artist of the year, the citation\'s other capstone stat.',
            kind: 'reference',
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
      day: 9,
      category: 'relationship',
      significance: 'defining', // the end of a 6-year relationship and the direct precursor to the Kelce era (docs/decisions.md, 2026-07-19)
      relatedIds: [
          'moment:vault-midnights-youre-losing-me-finally-hits-streaming','moment:vault-midnights-the-game-the-world-decided-made-it-official'],
      title: 'Taylor and Joe Alwyn confirm their breakup after six years',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-mid-2a", label: "Alwyn breakup confirmed", kind: "life" },
      snippet:
        '"They simply grew apart and plan to remain friends" — the end of a relationship she\'d kept almost entirely out of public view since 2016.',
      sourceUrl: 'https://www.cnn.com/2023/04/09/entertainment/taylor-swift-joe-alwyn-break-up/index.html',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/5/5d/Taylor_Swift_The_Eras_Tour_Midnights_Era_Set_%2853109799784%29_%28cropped%29.jpg',
      moment: {
        context:
          'Alwyn didn\'t address it publicly for over a year. When he finally did, in a June 2024 Sunday Times Style interview, he called it "a long, loving, fully committed relationship" and said he\'d hope "anyone and everyone can empathize and understand the difficulties that come with the end" of one — adding that what felt abnormal wasn\'t the split but that "one week later, it\'s suddenly in the public domain."\n\nThe relationship had run from 2016 to early 2023 almost entirely out of frame by design: "It was never something to commodify," he said, "and I see no reason to change that now."',
        sources: [
          { outlet: 'CNN', url: 'https://www.cnn.com/2023/04/09/entertainment/taylor-swift-joe-alwyn-break-up/index.html' },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/joe-alwyn-breaks-silence-taylor-swift-breakup-1235710711/',
          },
        ],
        // Photo pass 2026-07-19 (bulk-to-6+, docs/decisions.md): deliberately
        // NOT pushed toward the 6+ floor applied elsewhere this pass. This
        // item's own sourced text quotes Alwyn saying the relationship "was
        // never something to commodify, and I see no reason to change that
        // now" — padding a breakup story with more imagery of either party
        // would work against the substance of what's being reported. Added
        // one more of the same non-invasive category already here (her own
        // solo tour performance, not the relationship itself), nothing more.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Taylor_Swift_The_Eras_Tour_Midnights_Era_Set_%2853109799784%29_%28cropped%29.jpg',
            credit: 'Paolo V, CC BY 2.0, via Wikimedia Commons',
            caption: 'Taylor performing the Midnights set on the Eras Tour, the album era during which the breakup was confirmed.',
            kind: 'archival',
            // Tight cropped frame, arm raised; her face is in the upper quarter, just left of center.
            focalPoint: '43% 24%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Taylor_Swift_The_Eras_Tour_Midnights_Era_Set_%2853110112943%29.jpg',
            credit: 'Paolo V, Wikimedia Commons (CC BY 2.0)',
            caption: 'Another frame from the same Midnights-era set, August 2023.',
            kind: 'archival',
            // Very tall wide-stage frame; the small figure's face sits around the upper-middle third.
            focalPoint: '48% 37%',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 5,
      category: 'relationship',
      title: 'A brief, rumored month with Matty Healy',
      snippet: 'Reconnecting through mutual friend Jack Antonoff weeks after the Alwyn breakup — studio nights, a Nashville Eras Tour stop, then over by early June.',
      sourceUrl: 'https://www.etonline.com/taylor-swift-and-matty-healys-relationship-timeline-a-look-back-at-their-short-lived-romance-223746',
      thumbnailUrl: null,
      moment: {
        context:
          'Never confirmed on the record by either party — but the history ran back nearly a decade. They met at a 1975 show in Los Angeles in November 2014 and exchanged numbers, Healy spent 2015–16 alternately stoking and batting down romance rumors, and in September 2022 he revealed the band had recorded a Midnights collaboration with Taylor that didn\'t make the album.\n\nIn January 2023 she surprise-joined the 1975 onstage in London to debut "Anti-Hero" live; by May, weeks after the Alwyn split, he was at her Nashville Eras Tour shows and sources had them reconnecting through Jack Antonoff. By early June it was done — "they are both extremely busy and realized they\'re not really compatible," one source said — though a year later, fans combed The Tortured Poets Department for songs they read as being about him.',
        sources: [
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/taylor-swift-and-matty-healys-relationship-timeline-a-look-back-at-their-short-lived-romance-223746',
          },
          { outlet: 'StyleCaster', url: 'https://stylecaster.com/lists/taylor-swift-matty-healy-dating/' },
        ],
        // Real-photo pass (2026-07-09): no paparazzi shot of the pair is freely
        // hostable and the relationship was never confirmed; a clearly-labeled
        // contemporaneous photo of Healy performing is the honest visual.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Matty_Healy%2C_The_1975%2C_at_Lollapalooza_2023.jpg/960px-Matty_Healy%2C_The_1975%2C_at_Lollapalooza_2023.jpg',
            // He sings center-frame with his face near the top; bias upward.
            focalPoint: '52% 20%',
            credit: 'Mats Rennstam (RennstamPhotography), CC0, via Wikimedia Commons',
            caption: 'Matty Healy fronting The 1975 at Lollapalooza in summer 2023, weeks after the rumored month with Taylor fizzled.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 7,
      day: 26,
      category: 'relationship',
      // Cross-link (candidate #1282, 2026-07-25): the WSJ. cover story where Travis
      // first publicly retold this failed-bracelet meet-cute.
      relatedIds: ['moment:vault-midnights-travis-confirms-it-on-the-record'],
      title: "The friendship bracelet Travis couldn't deliver",
      // the-proposal thread opt-in + pull-quote (stage 3, 2026-07-19 — the
      // derived End Game thread starts here; quote from the New Heights episode).
      threadIds: ['the-proposal'],
      pullQuote: '“I was a little butthurt I didn’t get to meet her.”',
      snippet:
        "He made a bracelet with his number on it for her Arrowhead Eras Tour stop, worked up the nerve, and never got the chance to hand it over.",
      sourceUrl:
        'https://www.billboard.com/music/pop/travis-kelce-taylor-swift-phone-number-friendship-bracelet-1235379640/',
      thumbnailUrl: null,
      moment: {
        context:
          'He told the story on the July 26, 2023 episode of his own New Heights podcast, a few weeks after attending her Arrowhead Eras Tour stop: leaning into the tour\'s friendship-bracelet tradition, he\'d made one carrying his phone number and planned to hand it to her. It never happened — "I was disappointed that she doesn\'t talk before or after her shows because she has to save her voice for the 44 songs that she sings, so I was a little butt-hurt I didn\'t get to hand her one of the bracelets I made for her."\n\nHis kicker on the episode: "She doesn\'t meet anybody, or at least she didn\'t want to meet me, so I took it personal." The public sulk turned out to be the play of the year — the clip went wide, people in Taylor\'s circle took notice, and by his own later account in WSJ. Magazine, mutual contacts "working in his corner" after the bracelet story got the two of them talking before they ever met.',
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
        // Real-photo pass (2026-07-09): no free image of the bracelet moment exists
        // (it never happened on camera); a contemporaneous, freely licensed photo
        // of Kelce in the 2023 season is the honest visual.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Travis_Kelce_KC_Chiefs_2023_season_%28cropped%29.jpg/960px-Travis_Kelce_KC_Chiefs_2023_season_%28cropped%29.jpg',
            // He faces away; head sits above the No. 87 jersey — bias upward.
            focalPoint: '47% 44%',
            credit: 'Accedie, CC BY-SA 4.0, via Wikimedia Commons',
            caption: 'Travis Kelce in the No. 87 jersey during the 2023 Chiefs season — the number he put on the friendship bracelet he never got to deliver.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 9,
      day: 24,
      category: 'sighting',
      title: 'First Chiefs game: cheering on from the family suite',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-mid-2b", label: "Relationship goes public", kind: "life" },
      snippet:
        "Taylor watched Kansas City rout Chicago 41–10 from Travis's family suite at Arrowhead, sitting beside his mother Donna in a red-and-white Chiefs jacket.",
      sourceUrl: 'https://www.cnn.com/2023/09/24/entertainment/taylor-swift-travis-kelce-chiefs-game/',
      thumbnailUrl:
        'https://media.cnn.com/api/v1/images/stellar/prod/230924170550-taylor-swift-chiefs-092423.jpg?c=16x9&q=w_800,c_fill',
      moment: {
        context:
          'Three days earlier, Travis had put the invitation on the record on The Pat McAfee Show: "I told her that I\'ve seen her rock a stage in Arrowhead, and she might have to come see me rock the stage at Arrowhead." She took him up on it — and when he caught a three-yard touchdown pass in the third quarter, Fox cameras found her jumping and screaming in the glass-enclosed suite beside Donna Kelce.\n\nPatrick Mahomes admitted afterward he\'d felt "a little pressure" to get Kelce a touchdown with her watching; the two were spotted leaving Arrowhead together after the 41-10 rout.',
        sources: [
          { outlet: 'CNN', url: 'https://www.cnn.com/2023/09/24/entertainment/taylor-swift-travis-kelce-chiefs-game/' },
          {
            outlet: 'ESPN',
            url: 'https://www.espn.com/nfl/story/_/id/38481870/taylor-swift-accepts-travis-kelce-invite-chiefs-game',
          },
        ],
        photos: [
          {
            url: 'https://media.cnn.com/api/v1/images/stellar/prod/230924170550-taylor-swift-chiefs-092423.jpg?c=16x9&q=w_800,c_fill',
            credit: 'CNN',
            focalPoint: '36% 16%',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 9,
      day: 24,
      category: 'relationship',
      significance: 'defining', // the crossover into mainstream/NFL culture that reshaped her public life (docs/decisions.md, 2026-07-19)
      threadIds: ['the-proposal'],
      relatedIds: [
        'moment:vault-tloas-your-english-teacher-and-your-gym-teacher-are-getting-marrie',
        'moment:vault-tloas-taylor-and-travis-marry-at-madison-square-garden',
        'moment:vault-midnights-taylor-and-joe-alwyn-confirm-their-breakup-after-six-years',
      ],
      title: 'The game the world decided made it official',
      snippet:
        "She'd been dating Travis for weeks by the time cameras found her at Arrowhead — but this was the night the relationship became public record.",
      sourceUrl: 'https://www.cnn.com/2023/09/24/entertainment/taylor-swift-travis-kelce-chiefs-game/',
      thumbnailUrl:
        'https://media.cnn.com/api/v1/images/stellar/prod/230924170550-taylor-swift-chiefs-092423.jpg?c=16x9&q=w_800,c_fill',
      moment: {
        context:
          'By his own later math on The Pat McAfee Show, they\'d "known each other for close to a month" by kickoff — quiet late-summer talking that started after his friendship-bracelet story went viral in July. What made Sept. 24 the unofficial announcement was everything after the final whistle: they walked out of Arrowhead together and drove off in his convertible — "slid off in the getaway car," as he put it.\n\nTwo days later he acknowledged her publicly for the first time on New Heights: "Shout out to Taylor for pulling up. That was pretty ballsy... she looked amazing." Neither ever staged a confirmation; the getaway car did it for them.',
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
            focalPoint: '36% 16%',
          },
          // Photo pass 2026-07-19 (10-defining-events, docs/decisions.md):
          // every real photo found specifically from the Sept. 24, 2023
          // Arrowhead game and its immediate aftermath.
          {
            url: 'https://media.vanityfair.com/photos/655a2af58877a2e304c7d8ac/master/w_2560%2Cc_limit/1687516923',
            focalPoint: '55% 28%',
            credit: 'Cooper Neill/Getty Images, via Vanity Fair',
            caption: 'Taylor cheers beside Donna Kelce from a suite as the Chiefs play the Bears at Arrowhead on Sept. 24, 2023.',
            kind: 'primary',
          },
          {
            url: 'https://media.vanityfair.com/photos/6511b258c700cad4c4f82633/master/w_2560%2Cc_limit/Taylor-Swift.jpg',
            focalPoint: '50% 26%',
            credit: 'Jason Hanna/Getty Images, via Vanity Fair',
            caption: 'Taylor reacts from the Arrowhead suite during the first Chiefs game she attended.',
            kind: 'primary',
          },
          // A ca-times.brightspotcdn.com (LA Times) candidate was dropped
          // here 2026-07-19: curl returned 200 + real image bytes, but the
          // CDN serves a 1x1 placeholder to actual browser requests
          // (Referer-based hotlink protection) — caught only by testing in
          // a real browser (naturalWidth === 1), not by curl. See
          // docs/decisions.md; every other domain in this pass tested clean.
          {
            url: 'https://media.vanityfair.com/photos/65bac4142264a30c89f9949d/master/w_1600%2Cc_limit/1687739252',
            focalPoint: '45% 26%',
            credit: 'Icon Sportswire/Getty Images, via Vanity Fair',
            caption: 'Taylor watches the game with Travis Kelce\'s mother, Donna, in a separate suite photograph from Sept. 24.',
            kind: 'primary',
          },
          {
            url: 'https://imagez.tmz.com/image/cc/4by3/2023/09/25/cc266e4c1e8646149db60f4c03b795ce_md.jpg',
            focalPoint: '50% 22%',
            credit: 'TMZ.com',
            caption: 'Taylor enters Arrowhead in a Chiefs windbreaker, escorted by a member of Kelce\'s public-relations team.',
            kind: 'primary',
          },
          {
            url: 'https://imagez.tmz.com/image/02/16by9/2023/09/25/02f6bdca4be649f58c60466f10fc0115_md.jpg',
            focalPoint: '50% 40%',
            credit: 'X/@paytonsun, via TMZ',
            caption: 'Taylor and Kelce walk out of Arrowhead side by side after the Chiefs\' win.',
            kind: 'primary',
          },
          {
            url: 'https://imagez.tmz.com/image/98/4by3/2023/09/25/984b4d79ebce419cbcef97777e65d904_md.jpg',
            focalPoint: '48% 40%',
            credit: 'TMZ.com',
            caption: 'Taylor and Kelce leave Arrowhead together in his metallic purple convertible after the game.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 9,
      day: 24,
      category: 'fashion',
      title: 'Game-day debut: a Doen tank, denim shorts, and a Chiefs windbreaker',
      snippet:
        'No designer red carpet moment — her first Arrowhead look was Doen, denim, New Balance sneakers, and a New Era Chiefs windbreaker.',
      sourceUrl: 'https://wwd.com/fashion-news/fashion-features/gallery/taylor-swift-chiefs-game-outfits-photos-1236673626/',
      thumbnailUrl:
        'https://media.cnn.com/api/v1/images/stellar/prod/230924170550-taylor-swift-chiefs-092423.jpg?c=16x9&q=w_800,c_fill',
      moment: {
        context:
          "The full Sept. 24, 2023 look: a white Dôen tank, Ksubi denim shorts, New Balance 550 sneakers in Chiefs colors, and a red-and-white New Era Chiefs windbreaker. Marie Claire, ranking every game-day outfit she'd worn since, put this one dead last at No. 23 — not as an insult, but because it was the baseline: \"an outfit every NFL fan has worn to an early-season game at one time or another, with a few trendy additions.\"\n\nThat was also exactly why it landed. The pieces were fan-accessible and instantly shoppable rather than designer-flexing — a deliberate first impression for a debut in someone else's arena, before her game-day wardrobe leveled up into custom pieces, four-figure jewelry stacks, and the Kristin Juszczyk puffer that earned its own NFL deal.",
        sources: [
          {
            outlet: 'WWD',
            url: 'https://wwd.com/fashion-news/fashion-features/gallery/taylor-swift-chiefs-game-outfits-photos-1236673626/',
          },
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/taylor-swift-chiefs-game-outfits-ranked/',
          },
        ],
        photos: [
          {
            url: 'https://media.cnn.com/api/v1/images/stellar/prod/230924170550-taylor-swift-chiefs-092423.jpg?c=16x9&q=w_800,c_fill',
            credit: 'CNN',
            caption: 'The white Dôen tank and Chiefs windbreaker draped over her arm, in the Arrowhead suite on Sept. 24, 2023.',
            kind: 'fashion',
          },
        ],
        // Shop pass (2026-07-22): the exact seasonal Dôen tank is
        // discontinued -- a current same-brand tank, verified in stock,
        // closest real match.
        products: [
          {
            brand: 'DÔEN',
            item: 'Lois Tank',
            retailer: 'shopdoen.com',
            url: 'https://www.shopdoen.com/products/lois-tank-salt-quelle-jolie-pointelle',
            price: '$138.00',
            isAlternative: true,
            altNote: 'The exact game-day tank is discontinued -- this is a current Dôen white pointelle tank, same brand (shorts, windbreaker, and shoes not separately sourced).',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 9,
      day: 12,
      category: 'fashion',
      title: 'A black-and-gold gown for a record VMA night',
      snippet: 'A reputation-coded black gown with gold accents and a thigh-high slit on the pink carpet.',
      sourceUrl: 'https://www.nbcnews.com/pop-culture/live-blog/mtv-vmas-2023-live-updates-rcna103947',
      thumbnailUrl:
        'https://media-cldnry.s-nbcnews.com/image/upload/c_fill,g_auto,w_1667,h_2500/rockcms/2023-09/230912-vma-taylor-swift-ew-802p-78ccc7.jpg',
      moment: {
        context:
          "The Sept. 12, 2023 pink carpet at the Prudential Center got a black Versace gown with a line of the house's signature gold hardware and a thigh-high slit — a look fans immediately read as reputation-coded, arriving in the thick of re-record-announcement mania. The dress did a full night's work: she was on camera constantly as the show's most-awarded and most-visible attendee.\n\nThe night behind the gown was historic: nine Moon Person trophies from 11 nominations, including Video of the Year for \"Anti-Hero\" — her fourth win in the show's top category, more than anyone in VMAs history, in a field where no other artist (not Beyoncé, Rihanna, or Eminem) has more than two.",
        sources: [
          { outlet: 'NBC News', url: 'https://www.nbcnews.com/pop-culture/live-blog/mtv-vmas-2023-live-updates-rcna103947' },
          { outlet: 'TheWrap', url: 'https://www.thewrap.com/taylor-swift-most-video-of-the-year-wins-vmas-2023/' },
        ],
        photos: [
          {
            url: 'https://media-cldnry.s-nbcnews.com/image/upload/c_fill,g_auto,w_1667,h_2500/rockcms/2023-09/230912-vma-taylor-swift-ew-802p-78ccc7.jpg',
            credit: 'NBC News',
            focalPoint: '47% 12%',
          },
        ],
        // Shop pass (2026-07-22): the exact Versace gown is discontinued
        // -- a current black-and-gold embellished gown, verified in
        // stock, closest real match.
        products: [
          {
            brand: 'Mac Duggal',
            item: 'Black and Gold Embellished Column Gown with Chiffon Cape Sleeves',
            retailer: 'macduggal.com',
            url: 'https://macduggal.com/products/13206',
            price: '$798.00',
            isAlternative: true,
            altNote: 'Her exact Versace gown is discontinued -- this is a current black-and-gold gown in the same formal palette, with chiffon cape sleeves rather than gold hardware.',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 9,
      day: 12,
      category: 'business',
      title: 'A record-tying 9 VMA wins in one night',
      snippet:
        "Nine Moonmen, tying a record untouched since Peter Gabriel's 1987 sweep — including all four top categories in one night.",
      sourceUrl: 'https://www.thewrap.com/taylor-swift-most-video-of-the-year-wins-vmas-2023/',
      thumbnailUrl:
        'https://i0.wp.com/www.thewrap.com/wp-content/uploads/2023/09/taylor-swift-1.jpg?fit=1200%2C675&quality=89&ssl=1',
      moment: {
        context:
          'Every one of the nine trophies traced back to Midnights: "Anti-Hero" alone swept Video of the Year, Song of the Year, Best Pop, Best Direction, Best Cinematography, Best Editing, and Best Visual Effects, with Artist of the Year and Album of the Year rounding out the night — nine wins from 11 nominations.\n\nThe Video of the Year trophy was the historic one: her fourth in the show\'s top category, after "Bad Blood" (2015), "You Need to Calm Down" (2019), and "All Too Well: The Short Film" (2022), in a category where no other artist — not Beyoncé, Rihanna, or Eminem — has more than two.',
        sources: [
          { outlet: 'TheWrap', url: 'https://www.thewrap.com/taylor-swift-most-video-of-the-year-wins-vmas-2023/' },
          { outlet: 'NBC News', url: 'https://www.nbcnews.com/pop-culture/live-blog/mtv-vmas-2023-live-updates-rcna103947' },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/2023_MTV_Video_Music_Awards' },
        ],
        photos: [
          {
            url: 'https://i0.wp.com/www.thewrap.com/wp-content/uploads/2023/09/taylor-swift-1.jpg?fit=1200%2C675&quality=89&ssl=1',
            credit: 'TheWrap',
            focalPoint: '50% 35%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%281%29.png',
            credit: 'iHeartRadioCA / Wikimedia Commons, CC BY 3.0',
            caption:
              'On the pink carpet at the 2023 VMAs in black Versace — the night she took home a record-tying nine Moon Persons, including her fourth Video of the Year.',
            kind: 'archival',
            focalPoint: '47% 22%',
          },
        ],
      },
    },
    {
      // Cross-link (Stage 3, 2026-07-30): sibling "Cruel Summer" moments.
      relatedIds: [
        'moment:vault-lover-cruel-summer-born-from-a-casual-jam-with-st-vincent-and-jack',
        'moment:vault-lover-cruel-summer-takes-four-years-to-become-a-no-1',
      ],
      year: 2023,
      month: 10,
      day: 23,
      category: 'business',
      title: "Cruel Summer hits No. 1 — four years after it came out",
      snippet:
        'An unpromoted 2019 album track, revived by the Eras Tour setlist and a viral moment, was announced Oct. 23 as her 10th Hot 100 No. 1 — on the Billboard chart dated Oct. 28.',
      sourceUrl:
        'https://www.billboard.com/music/chart-beat/taylor-swift-cruel-summer-number-one-hot-100-1235452093/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/08/taylor-swift-eras-tour-los-angeles-night-4-sofi-stadium-2023-billboard-1548.jpg?w=1024',
      moment: {
        context:
          "The fifth-longest wait for a No. 1 in Hot 100 history — four years, one month, three weeks after it debuted at No. 29.\n\nThe final push came from the Eras Tour concert film: the week it hit theaters, the song jumped from No. 9 on 18.6 million streams (up 35%), 41,000 downloads (up 1,482%, juiced by new live and LP Giobbi remix versions released Oct. 18), and 77.8 million in radio audience, taking the chart's Streaming and Sales Gainer honors in the same frame. It made her one of just 11 artists ever to reach ten Hot 100 No. 1s — with a song her label never promoted as a proper single in 2019.",
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
            focalPoint: '58% 52%',
          },
          {
            url: 'https://i.ytimg.com/vi/xB-RZqcoIgo/maxresdefault.jpg',
            credit: 'Taylor Swift/YouTube',
            caption:
              "The art for 'Cruel Summer (Live from Taylor Swift | The Eras Tour)' — the live single Taylor released Oct. 18, 2023, in the final push that carried the four-year-old song to No. 1.",
            kind: 'archival',
            focalPoint: '45% 32%',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 10,
      day: 1,
      category: 'sighting',
      title: 'A box full of A-listers at MetLife Stadium',
      snippet:
        'Blake Lively, Ryan Reynolds, and Hugh Jackman joined her to watch Kansas City beat the Jets — the broadcast drew the biggest Sunday audience since the last Super Bowl.',
      sourceUrl:
        'https://variety.com/2023/music/news/taylor-swift-attends-travis-kelce-chiefs-jets-game-hugh-jackman-blake-lively-1235741837/',
      thumbnailUrl: 'https://variety.com/wp-content/uploads/2023/10/GettyImages-1712353673.jpg?w=1000&h=563&crop=1',
      moment: {
        context:
          "Her second Chiefs game in eight days went prime-time: for the Oct. 1, 2023 Sunday Night Football matchup against the Jets at MetLife Stadium, she filled a box with Blake Lively, Ryan Reynolds, and Hugh Jackman while Kansas City held on to win 23-20. NBC had leaned in all week, cutting a game promo to \"Welcome to New York.\"\n\nThe ratings validated the circus: nearly 27 million average viewers across platforms — 24.83 million on the TV broadcast alone, up 19% year-over-year and NBC's best of the season to that point — plus its largest-ever streaming audience for a regular-season Sunday game. The lifts skewed exactly where the cameras suggested: viewership among girls 12-17 jumped 53%, women 18-24 rose 24%, and women over 35 climbed 34%.",
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/music/news/taylor-swift-attends-travis-kelce-chiefs-jets-game-hugh-jackman-blake-lively-1235741837/',
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/tv/tv-news/tv-ratings-sunday-oct-1-2023-1235606571/',
          },
        ],
        photos: [
          {
            url: 'https://variety.com/wp-content/uploads/2023/10/GettyImages-1712353673.jpg?w=1000&h=563&crop=1',
            credit: 'Elsa/Getty Images',
            focalPoint: '44% 32%',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 10,
      day: 11,
      category: 'fashion',
      title: 'A blue floral gown, and a surprise Beyoncé reunion',
      snippet:
        "A full-length blue gown with floral decals for the Eras Tour film premiere at The Grove — where Beyoncé stopped by to pose with her on the carpet.",
      sourceUrl: 'https://variety.com/2023/music/news/taylor-swift-eras-tour-premiere-the-grove-1235752172/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/10/beyonce-taylor-swift-eras-film-premiere-2023-billboard-1548.jpg?w=1000',
      moment: {
        context:
          "For the Oct. 11, 2023 world premiere at AMC The Grove 14 — the Los Angeles mall was shut down for the event — she wore a strapless Oscar de la Renta gown with floral embroidery and cutout details, a roughly $12,000 dress that Neiman Marcus was advertising to Swifties on Facebook within days. She debuted a curly bob with it, and the blue palette read as a nod to 1989 (Taylor's Version), then two weeks from release.\n\nThe carpet's biggest gasp wasn't the dress: Beyoncé arrived to support her, and the two posed together on the carpet — a photo op that instantly buried years of manufactured rivalry narratives. The film itself, directed by Sam Wrench and running 2 hours 45 minutes, opened wide two days later.",
        sources: [
          { outlet: 'Variety', url: 'https://variety.com/2023/music/news/taylor-swift-eras-tour-premiere-the-grove-1235752172/' },
          { outlet: 'Footwear News (via Yahoo)', url: 'https://www.yahoo.com/entertainment/own-taylor-swift-eras-premiere-191558719.html' },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/10/beyonce-taylor-swift-eras-film-premiere-2023-billboard-1548.jpg?w=1000',
            credit: 'John Shearer/Getty Images for TAS via Billboard',
            caption: 'Taylor in the blue floral Oscar de la Renta gown with Beyoncé at The Grove premiere, Oct. 11, 2023.',
            kind: 'fashion',
          },
        ],
        // Shop pass (2026-07-22): the exact Oscar de la Renta gown is
        // discontinued -- a current blue floral brocade gown, verified in
        // stock, closest real match.
        products: [
          {
            brand: 'Mac Duggal',
            item: 'Blue Floral Brocade Strapless Ball Gown',
            retailer: 'macduggal.com',
            url: 'https://macduggal.com/products/11921-blue-multi',
            price: '$798.00',
            isAlternative: true,
            altNote: 'Her exact Oscar de la Renta gown is discontinued -- this is a current blue floral brocade ball gown in the same full-skirted silhouette, without the original\'s cutouts.',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 11,
      day: 20,
      category: 'relationship',
      title: 'Travis makes it official, on the record',
      snippet:
        '"I\'ve never dated anyone with that kind of aura about them" — his first on-record confirmation of the relationship, in WSJ. Magazine.',
      sourceUrl: 'https://www.today.com/popculture/travis-kelce-dating-taylor-swift-wsj-magazine-rcna125990',
      thumbnailUrl:
        'https://www.inquirer.com/resizer/v2/WZM56FNWJVQU4MGIKUF22L3Q2Q.jpg?auth=01fbce1493c6c84b5774b263114dc5841e2f76b4491df6f62ec647e96e55ef1a&width=760&height=507&smart=true',
      moment: {
        context:
          'The WSJ. Magazine profile was also where he confirmed how it actually started: "There were definitely people she knew that knew who I was" working in his corner after the friendship-bracelet story, and by the time they met, "we had already kind of been talking, so I knew we could have a nice dinner and, like, a conversation, and what goes from there will go from there."\n\nOn the scrutiny she lives under: "The scrutiny she gets, how much she has a magnifying glass on her, every single day, paparazzi outside her house, outside every restaurant she goes to... and she\'s just living, enjoying life." His own rule for navigating it: "The biggest thing to me was making sure I don\'t say anything that would push Taylor away."',
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
            focalPoint: '46% 30%',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 12,
      day: 10,
      category: 'fashion',
      title: 'High-low styling for the Bills game: Khaite, vintage, and Mejuri',
      snippet: 'A Khaite mini skirt and a vintage-’90s Chiefs jumper, styled with Mejuri jewelry and Larroudé boots.',
      sourceUrl: 'https://www.marieclaire.com/fashion/taylor-swift-chiefs-game-outfits-ranked/',
      thumbnailUrl: 'https://cdn.mos.cms.futurecdn.net/RdZNsvNDCZtsUCwJmMbUv7.jpg',
      moment: {
        context:
          "For the Dec. 10, 2023 Bills game she built the look around a 1990s-era vintage Chiefs jumper, pairing it with a Khaite mini skirt, Mejuri jewelry, and Larroudé boots — the clearest single expression of the high-low formula that defined her game-day season: one thrifted-feeling team piece, elevated by contemporary designers.\n\nMarie Claire's ranking of every Chiefs-game outfit slotted this one at No. 18, noting the pattern beneath it — her habit of mixing accessible vintage finds with luxury labels, and of favoring women-owned and affordable accessory brands (Mejuri among them) even as the headline pieces climbed in price.",
        sources: [
          { outlet: 'Marie Claire', url: 'https://www.marieclaire.com/fashion/taylor-swift-chiefs-game-outfits-ranked/' },
        ],
        photos: [{ url: 'https://cdn.mos.cms.futurecdn.net/RdZNsvNDCZtsUCwJmMbUv7.jpg', credit: 'Marie Claire' }],
        // Shop pass (2026-07-22): the exact Khaite mini worn to the game
        // is undocumented beyond the brand name -- a current same-brand
        // leather skirt, verified in stock, closest real match.
        products: [
          {
            brand: 'KHAITE',
            item: 'Jett Skirt in Black Leather',
            retailer: 'khaite.com',
            url: 'https://khaite.com/products/jett-skirt-in-black-leather',
            price: '$1,680.00',
            isAlternative: true,
            altNote: 'The exact Khaite mini worn to the game is undocumented -- this is a current same-brand black leather skirt (vintage top, jewelry, and boots not separately sourced).',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 12,
      day: 25,
      category: 'sighting',
      title: 'A Santa-costumed entrance for a Christmas Day upset',
      snippet:
        'She arrived at Arrowhead on Christmas alongside a companion dressed as Santa; the Raiders upset the Chiefs 20–14 in the most-watched Christmas Day game since 1989.',
      sourceUrl: 'https://www.si.com/nfl/2023/12/25/raiders-chiefs-taylor-swift-arrives-with-santa-claus-fans-love-it',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/12/taylor-swift-chiefs-raiders-christmas-2023-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          "The entrance was the show: she walked into Arrowhead on Dec. 25, 2023 alongside a companion in a full Santa suit, and the clip ricocheted around social media before kickoff — \"Santa and Taylor Swift have arrived,\" as Sports Illustrated logged it, with fans fixating on the outfit and the bow in her hair.\n\nThe look itself was a holiday-coded version of her high-low game-day formula: a plaid Hill House Home skirt, a shearling-lined jacket from Gigi Hadid's Guest in Residence label, chunky Prada loafers, Foundrae jewelry, a red Polo Ralph Lauren sweater, and a Jennifer Behr bow — Marie Claire ranked it 10th among all her Chiefs-game outfits. The football cooperated less: the Raiders spoiled Christmas with a 20-14 upset in the most-watched Christmas Day game since 1989.",
        sources: [
          {
            outlet: 'Sports Illustrated',
            url: 'https://www.si.com/nfl/2023/12/25/raiders-chiefs-taylor-swift-arrives-with-santa-claus-fans-love-it',
          },
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/taylor-swift-chiefs-game-outfits-ranked/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/12/taylor-swift-chiefs-raiders-christmas-2023-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Kirby Lee/Getty Images via Billboard',
            caption: 'Taylor in the red No. 87 Santa hat and red sweater, in the Arrowhead suite on Christmas Day 2023.',
            kind: 'sighting',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 12,
      day: 6,
      category: 'fashion',
      // Reciprocal cross-link to the same-day POTY award item (ledger #888, Q4).
      relatedIds: ['moment:vault-midnights-time-names-her-2023-person-of-the-year'],
      title: "TIME's Person of the Year cover shoot, in three looks",
      snippet: 'A black bodysuit with her cat Benjamin Button on one cover, a crystal-embellished Area mini dress in reputation-coded gray on another.',
      sourceUrl: 'https://petapixel.com/2023/12/06/photographers-reveal-story-behind-taylor-swifts-time-person-of-the-year-covers/',
      thumbnailUrl: 'https://petapixel.com/assets/uploads/2023/12/SWIFT.FINAL_.COVER3_-600x800.jpg',
      moment: {
        context:
          'Dutch fashion duo Inez van Lamsweerde and Vinoodh Matadin — who\'d previously shot her for Vogue in 2019 — photographed all three covers during the Eras Tour year. The Benjamin Button image was a long-held ambition of theirs, modeled on Bill Hayward\'s 1970s book Cat People: "It speaks to a sense of carrying everything on your shoulders but being defiant while doing so," they said, calling the final frame everything at once — "her glamor, her power, her sense of empathy of carrying the whole world on her shoulders."\n\nA third cover leaned cozy fall: a cream turtleneck and denim jacket, styled with slicked-back bangs instead of her usual curls. Time chose her from nine finalists, a field that included King Charles III, Sam Altman, and Barbie.',
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
        // Shop pass (2026-07-22): the cover's exact grey AREA crystal
        // dress isn't currently sold -- a current same-brand black
        // crystal mini, verified in stock, closest real match.
        products: [
          {
            brand: 'AREA',
            item: 'Crystal Hotfix Mini Dress',
            retailer: 'area.nyc',
            url: 'https://area.nyc/products/crystal-hotfix-mini-dress',
            price: '$398.00',
            isAlternative: true,
            altNote: 'The cover\'s grey AREA crystal dress isn\'t currently sold -- this is a current same-brand black crystal mini, one of the shoot\'s three looks.',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 1,
      day: 13,
      category: 'sighting',
      title: 'A frigid Wild Card game, bundled in a No. 87 puffer',
      snippet:
        'Below-zero temperatures for the Chiefs\' playoff opener against Miami — she watched from a box with Donna Kelce, wrapped in a red puffer jacket bearing Travis\'s name and number.',
      sourceUrl: 'https://www.today.com/popculture/taylor-swift-chiefs-dolphins-game-playoffs-rcna133047',
      thumbnailUrl: 'https://www.rollingstone.com/wp-content/uploads/2024/01/TaylorSwiftChiefs-1.jpeg?w=1600&h=900&crop=1',
      moment: {
        context:
          "The Jan. 13, 2024 Wild Card game against Miami was played in air so cold it entered the record books among the coldest games in NFL history — and the jacket she wore into it became the night's biggest star. The custom red puffer, stitched with Kelce's name and \"87,\" was made by Kristin Juszczyk, wife of 49ers fullback Kyle Juszczyk; Taylor finished the look with heavy-duty Christian Louboutin boots and a Manu Atelier bag.\n\nThe puffer went so viral — with a matching Mahomes version on Brittany Mahomes in the same suite — that within weeks Juszczyk had an official NFL apparel licensing deal, one of the cleanest examples of the \"Taylor effect\" converting a single broadcast cutaway into a business. The Chiefs won and moved on, starting the playoff run that ended in Las Vegas.",
        sources: [
          { outlet: 'Today', url: 'https://www.today.com/popculture/taylor-swift-chiefs-dolphins-game-playoffs-rcna133047' },
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/taylor-swift-chiefs-game-outfits-ranked/',
          },
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
      day: 28,
      category: 'relationship',
      title: 'A kiss to celebrate the AFC Championship',
      snippet: 'She kissed Travis on the field as Kansas City beat Baltimore to reach a second straight Super Bowl.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-curls-chiefs-ravens-afc-championship-game-1235591057/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2024/01/Taylor-swift-travis-kelce-jan-28-2024-baltimore-billboard-1548.jpg',
      moment: {
        context:
          'The Chiefs beat the Ravens 17-10 at M&T Bank Stadium — Travis caught the game\'s first touchdown — and she came down to the field afterward for the kiss and his on-camera declaration: "Believe it, baby, we going to Las Vegas, Nevada."\n\nShe\'d watched from a suite with Brittany Mahomes, Cara Delevingne, and Keleigh Teller, hair air-dried into the natural curls of her debut era against the Baltimore rain, a week after sitting with Jason and Kylie Kelce for the Bills game. Her verdict on the sport that season, via Time: "Football is awesome, it turns out. I\'ve been missing out my whole life."',
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
            focalPoint: '55% 38%',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 2,
      day: 4,
      category: 'fashion',
      title: 'Custom Schiaparelli, with a Midnights clock hidden in the choker',
      snippet: 'A strapless white Schiaparelli gown with a thigh-high slit — and a choker shaped like a clock face set to midnight.',
      sourceUrl: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-schiaparelli-dress-2024-grammys-1236164497/',
      thumbnailUrl: 'https://www.hollywoodreporter.com/wp-content/uploads/2024/02/GettyImages-1986392520-EMBED-2024.jpg?w=408',
      moment: {
        context:
          'Schiaparelli\'s Daniel Roseberry adapted the design for her from the house\'s fall 2023 ready-to-wear, and stylist Joseph Cassell finished it with black opera-length gloves — but the choker was the story: a Lorraine Schwartz piece holding over 300 carats of black and white diamonds around a vintage watch, its hands set to midnight for the album she was nominated for.\n\nShe played it up on the red carpet, asking publicist Tree Paine, "Do you need to set my watch?" ("Nope, it\'s already perfect. Midnight.") The black-and-white palette had fans betting on a reputation (Taylor\'s Version) announcement that night; the actual reveal turned out to be The Tortured Poets Department.',
        sources: [
          {
            outlet: 'WWD',
            url: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-schiaparelli-dress-2024-grammys-1236164497/',
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/lifestyle/style/taylor-swift-2024-grammys-dress-schiaparelli-1235815411/',
          },
        ],
        photos: [
          {
            url: 'https://www.hollywoodreporter.com/wp-content/uploads/2024/02/GettyImages-1986392520-EMBED-2024.jpg?w=408',
            credit: 'Getty Images',
          },
        ],
        // Shop pass (2026-07-22): the custom Schiaparelli ensemble was
        // never sold at retail -- a current strapless slit gown, verified
        // in stock, closest real match.
        products: [
          {
            brand: 'Mac Duggal',
            item: 'White Polka Dot Strapless Viscose Gown With Slit',
            retailer: 'macduggal.com',
            url: 'https://macduggal.com/products/56248-black-ivory',
            price: '$398.00',
            isAlternative: true,
            altNote: 'The custom Schiaparelli ensemble was never sold at retail -- this is a current strapless slit gown in a similar high-contrast shape, polka dots instead of crystals (choker not included).',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 2,
      day: 4,
      category: 'business',
      significance: 'defining', // most Album of the Year wins ever, breaking her own tie with music history's biggest names (docs/decisions.md, 2026-07-19)
      relatedIds: [
          'moment:vault-midnights-thirteen-sleepless-nights',
        'moment:vault-fearless-fearless-makes-her-the-youngest-album-of-the-year-winner-for',
        'moment:vault-1989-1989-wins-album-of-the-year-making-her-the-first-woman-to-wi',
        'moment:vault-folklore-folklore-makes-her-the-first-woman-to-win-album-of-the-year-',
      ],
      title: 'A record fourth Album of the Year Grammy, for Midnights',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-mid-3b", label: "Record 4th AOTY", kind: "award" },
      snippet: 'Presented by Céline Dion in a rare public appearance — Taylor\'s fourth AOTY win, more than any artist in Grammy history.',
      sourceUrl: 'https://www.grammy.com/news/taylor-swift-album-of-the-year-2024-grammys-speech',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2024/02/taylor-swift-pop-album-grammys-cbs-2024-billboard-1548.jpg?w=1024',
      moment: {
        context:
          'The Feb. 4, 2024 win broke a three-way tie with Frank Sinatra, Stevie Wonder, and Paul Simon, who had each stopped at three Album of the Year trophies. Her speech skipped the milestone talk entirely: "I would love to tell you that this is the best moment of my life, but I feel this happy when I finish a song, or when I crack the code to a bridge I love... For me, the award is the work."\n\nEarlier that night she\'d already made the bigger news — using her Best Pop Vocal Album acceptance to announce The Tortured Poets Department, complete with an April 19 release date, out of nowhere. Travis Kelce\'s read on the evening: she was "rewriting the history books herself."',
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
            focalPoint: '48% 25%',
          },
          {
            url: 'https://variety.com/wp-content/uploads/2024/02/Taylor-Swift-Album-of-the-Year.jpg?w=1000',
            credit: 'Variety',
            caption:
              'Accepting the record fourth Album of the Year Grammy for Midnights, with Jack Antonoff at her shoulder — the moment she passed Stevie Wonder, Frank Sinatra and Paul Simon.',
            kind: 'archival',
            focalPoint: '47% 35%',
          },
          // Photo pass 2026-07-19 (bulk-to-6+, docs/decisions.md): 3 more
          // real, verified photos. Skipped reusing the Schiaparelli red-
          // carpet photo already on its own dedicated item in this file —
          // used a different Getty frame of the same arrival instead.
          {
            url: 'https://www.hollywoodreporter.com/wp-content/uploads/2024/02/GettyImages-1978657268-H-2024.jpg?w=1296&h=730&crop=1',
            credit: 'Robyn Beck/AFP via Getty Images, via The Hollywood Reporter',
            caption: 'Arriving at the 66th Grammy Awards, Feb. 4, 2024 — hours before both the Best Pop Vocal Album win and the TTPD announcement.',
            kind: 'archival',
            // Full-length red-carpet shot: her face sits near the top-center,
            // just left of the frame's midline; bias the crop high.
            focalPoint: '43% 12%',
          },
          {
            url: 'https://assets1.cbsnewsstatic.com/hub/i/r/2024/02/05/8edd48b7-d5d3-4f41-9abc-73224e5a7012/thumbnail/620x413/c9004cfb98e90e6a93cd1764340a1057/gettyimages-1986514177.jpg',
            credit: 'Getty Images, via CBS News',
            caption: 'Accepting Best Pop Vocal Album for Midnights earlier the same night — the speech where she announced The Tortured Poets Department.',
            kind: 'archival',
            // At the mic holding the trophy; her face is upper-center, a touch
            // left of center.
            focalPoint: '43% 22%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/C%C3%A9line_Dion_2012.jpg',
            credit: 'Georges Biard, Wikimedia Commons (CC BY-SA 3.0)',
            caption: 'Céline Dion, who presented the Album of the Year award in a rare public appearance during her stiff-person syndrome recovery.',
            kind: 'reference',
            // Head-and-shoulders portrait; her face sits upper-center.
            focalPoint: '43% 28%',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 2,
      day: 11,
      category: 'fashion',
      significance: 'defining', // the single biggest mainstream-crossover moment of the relationship, watched by ~123M people (docs/decisions.md, 2026-07-19)
      threadIds: ['the-proposal'],
      relatedIds: [
        'moment:vault-midnights-the-game-the-world-decided-made-it-official',
        'moment:vault-tloas-your-english-teacher-and-your-gym-teacher-are-getting-marrie',
      ],
      title: 'Super Bowl LVIII: a sheer corset, Area jeans, and his number in rubies',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-mid-3c", label: "Super Bowl LVIII", kind: "life" },
      snippet:
        'A Dion Lee corset top and bedazzled Area jeans, accessorized with jewelry stamped 87 — plus a red Erin Andrews bomber for team spirit.',
      sourceUrl: 'https://www.hollywoodreporter.com/lifestyle/style/what-taylor-swift-is-wearing-super-bowl-2024-1235822097/',
      thumbnailUrl:
        'https://www.hollywoodreporter.com/wp-content/uploads/2024/02/GettyImages-1996270243-copy.jpg?w=1296&h=730&crop=1',
      moment: {
        context:
          "Styled by Joseph Cassell Falconer for Feb. 11, 2024 at Allegiant Stadium, the outfit paired a Dion Lee corset-style crop top ($720) with Area's crystal-slit black jeans ($795) — which sold out almost immediately — under a $130 vintage-style red Chiefs windbreaker from Wear by Erin Andrews, the broadcaster's team-apparel line.\n\nThe jewelry did the storytelling: over $16,000 worth, nearly all of it coded to Kelce. A custom Stephanie Gottlieb 14-karat necklace hung a diamond \"87\" pendant beside a $7,500 diamond tennis choker; ruby rings from Retrouvaí and Shala Karimi worked in the Chiefs red; and a custom Judith Leiber crystal clutch carried the 87 again. She watched from the suite with Blake Lively and Ice Spice as Kansas City won it in overtime.",
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
            focalPoint: '51% 17%',
          },
          // Photo pass 2026-07-19 (bulk-to-6+, docs/decisions.md): 4 more
          // real, verified photos — a nationally televised, extremely
          // public game, not a private moment, so more real coverage
          // exists than the original single-photo pass captured.
          {
            url: 'https://a57.foxnews.com/static.foxnews.com/foxnews.com/content/uploads/2024/02/1200/675/Super-Bowl-Las-Vegas-49ers-Chiefs-Taylor-Swift-Travis-Kelce_01.jpg',
            credit: 'Getty Images, via Fox News',
            caption: 'On the field after the Chiefs\' overtime win — the moment broadcast to roughly 123 million viewers.',
            kind: 'primary',
            // The kiss is the subject: their two faces meet center-right of
            // the frame, around the vertical midline.
            focalPoint: '56% 38%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Allegiant_Stadium%2C_view_from_Interstate_15_%282024-02-04%29.jpg',
            credit: 'Amin Eshaiker, Wikimedia Commons (CC BY-SA 4.0)',
            caption: 'Allegiant Stadium in Las Vegas, host of Super Bowl LVIII, days before kickoff.',
            kind: 'reference',
            // The lit nameplate and the SF/KC matchup logos sit across the
            // middle band of the building; keep the crop centered.
            focalPoint: '46% 42%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Patrick_Mahomes_%2851615475056%29.jpg',
            credit: 'All-Pro Reels, Wikimedia Commons (CC BY-SA 2.0)',
            caption: 'Chiefs quarterback Patrick Mahomes, who led the overtime win.',
            kind: 'reference',
            // Vertical portrait; his face is upper-center of the frame.
            focalPoint: '52% 26%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Chiefs_361_%2851615694173%29.jpg',
            credit: 'All-Pro Reels, Wikimedia Commons (CC BY-SA 2.0)',
            caption: 'Travis Kelce on the field for the Chiefs.',
            kind: 'reference',
            // Vertical portrait; his face is upper-center, just left of the
            // midline.
            focalPoint: '48% 23%',
          },
        ],
        // Shop pass (2026-07-22): the exact AREA jeans she wore, verified
        // in stock.
        products: [
          {
            brand: 'AREA',
            item: 'Crystal Slit Jean',
            retailer: 'area.nyc',
            url: 'https://area.nyc/products/crystal-slit-jean-3',
            price: '$298.00',
            isAlternative: false,
            altNote: 'The exact AREA Crystal Slit Jean named in the look, currently marked down -- sourcing the jeans only (corset, jacket, boots, and jewelry not separately sourced).',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 2,
      day: 11,
      category: 'sighting',
      title: 'Tokyo to Las Vegas: making the Super Bowl after four Eras shows',
      snippet:
        'She flew in from her Tokyo Eras Tour date to reach Super Bowl LVIII in time, arriving with Blake Lively and Ice Spice among her guests.',
      sourceUrl: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-attends-2024-super-bowl-travis-kelce-1235821940/',
      thumbnailUrl:
        'https://www.hollywoodreporter.com/wp-content/uploads/2024/02/GettyImages-2003760399-copy.jpg?w=1296&h=730&crop=1',
      moment: {
        context:
          "The logistics were global news for a week beforehand: four Eras Tour nights in Tokyo ended Saturday, Feb. 10, and Super Bowl LVIII kicked off in Las Vegas on Sunday, Feb. 11 — a 12-hour flight against a 17-hour time difference. Japan's embassy in Washington even issued a statement reassuring fans that \"if she departs Tokyo in the evening after her concert, she should comfortably arrive in Las Vegas before the Super Bowl begins.\" She did.\n\nAt Allegiant Stadium — her 13th Chiefs game of the season, with her lucky number doing the math — she arrived with her mother Andrea, Blake Lively, and Ice Spice, and watched from a box that also held Jason and Donna Kelce and NFL commissioner Roger Goodell. Broadcast cameras caught her cheering and chugging her drink; after the overtime win she found Travis on the field for a long hug and several kisses.",
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
            focalPoint: '62% 38%',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 3,
      day: 2,
      category: 'tour',
      title: 'Six Singapore shows, and a regional exclusivity deal that made headlines',
      snippet:
        "Singapore's government offered financial incentives to keep the Eras Tour's only Southeast Asia stop there — a deal its neighbors publicly complained about.",
      sourceUrl: 'https://time.com/6836711/taylor-swift-eras-tour-exclusive-singapore-southeast-asia-governments-reactions/',
      thumbnailUrl:
        'https://static.time.com/v3/assets/bltea6093859af6183b/bltc2ec949c9ace970b/698a490516d8847cd4c3d41a/Taylor-Swift-Singapore-Eras-Tour.jpg?branch=production&width=2400&quality=75&auto=webp&crop=16:9',
      moment: {
        context:
          "Six sold-out National Stadium shows, March 2-9, 2024 — the Eras Tour's only stop in Southeast Asia, and the subject of a rare pop-music diplomatic row. Thailand's Prime Minister Srettha Thavisin set it off by telling a Bangkok business forum that, per the tour's promoter, Singapore had offered on the order of $2-3 million per show in exchange for regional exclusivity; lawmakers and tourism officials in neighboring countries piled on.\n\nSingapore didn't really deny the substance. Prime Minister Lee Hsien Loong acknowledged \"certain incentives\" funded from a post-pandemic tourism-recovery budget and called the deal \"a very successful arrangement,\" while declining to confirm the figure. The economics explain the shrug: six nights of regional fan travel — flights, hotels, spending — concentrated into one city that had locked out every alternative.",
        sources: [
          {
            outlet: 'Time',
            url: 'https://time.com/6836711/taylor-swift-eras-tour-exclusive-singapore-southeast-asia-governments-reactions/',
          },
          {
            outlet: 'The Globe and Mail',
            url: 'https://www.theglobeandmail.com/world/article-taylor-swift-steals-the-show-at-an-asian-summit-as-singapore-defends/',
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
      day: 17,
      category: 'fashion',
      title: 'A pink-toned Versace bodysuit opens the Lover set',
      snippet:
        "Taylor's pink-toned Lover era on opening night was a Versace bodysuit paired with knee-high Christian Louboutin boots.",
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2023/03/Taylor-Swift-outfit-gallery-night-1-billboard-1240.jpg',
      moment: {
        context:
          'The Lover set opened the very first Eras Tour show at State Farm Stadium in Glendale, Arizona on March 17, 2023 — the pink-toned, crystal-covered Versace bodysuit with knee-high Christian Louboutin boots was the first thing 70,000 people saw as she rose into "Miss Americana & the Heartbreak Prince," and Billboard\'s photographers logged it as look one of the night\'s full costume parade.\n\nThe Lover act actually carried two Versace pieces: Billboard\'s gallery also documents a silver Versace blazer, worn with silver Louboutin boots, as its own look within the same set. Between them, the two looks established the night\'s pattern: one era, one silhouette, with the designers rotating act by act.',
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
        // Shop pass (2026-07-22): the custom Versace stage bodysuit was
        // never sold at retail -- a current pink rhinestone mini,
        // verified in stock, closest real match.
        products: [
          {
            brand: 'Fashion Nova',
            item: 'Natalie Rhinestone Fishnet Mini Dress',
            retailer: 'fashionnova.com',
            url: 'https://www.fashionnova.com/products/natalie-rhinestone-fishnet-mini-dress-fncolorname-pink',
            price: '$27.98',
            isAlternative: true,
            altNote: 'The custom Versace stage bodysuit was never sold at retail -- this pink rhinestone fishnet mini offers a similar color and sparkle, as a dress rather than a bodysuit.',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      day: 17,
      category: 'fashion',
      title: 'Roberto Cavalli gold fringe for the Fearless set',
      snippet:
        'A sparkling gold fringe mini-dress by Roberto Cavalli, paired again with knee-high Christian Louboutin boots, for the Fearless segment of Eras Tour night one.',
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2023/03/02-Taylor-Swift-outfit-gallery-night-1-billboard-1548.jpg',
      moment: {
        context:
          "The Fearless act's look was a gold sequined fringe mini-dress by Roberto Cavalli over knee-high Christian Louboutin boots — fringe built to move, catching stadium light through the era's guitar-swinging choreography. Kevin Winter's shot of the look anchors Billboard's night-one gallery.\n\nCavalli was the night's busiest house, also supplying the reputation catsuit and the 1989 two-piece, while the Louboutin boots under this dress ran through the Lover and evermore looks as well — the quiet uniform beneath ten eras' worth of costume changes.",
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
        // Shop pass (2026-07-22): the custom Cavalli stage dress was
        // never sold at retail -- a current gold sequin fringe dress,
        // verified in stock, closest real match.
        products: [
          {
            brand: 'Mac Duggal',
            item: 'Multicolor Metallic Sequin One Shoulder Fringe Dress',
            retailer: 'macduggal.com',
            url: 'https://macduggal.com/products/6212',
            price: '$698.00',
            isAlternative: true,
            altNote: 'The custom Cavalli stage dress was never sold at retail -- this gold-silver ombre sequin fringe dress recreates its shimmer and movement (boots not separately sourced).',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      day: 17,
      category: 'fashion',
      title: 'A mustard Etro gown and cape for evermore',
      snippet:
        'A mustard orange Etro dress with delicate embroidery, worn with a matching cape and Christian Louboutin boots for the evermore segment.',
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2023/03/03-Taylor-Swift-outfit-gallery-night-1-billboard-1548.jpg',
      moment: {
        context:
          "For the evermore act, Billboard's gallery logs a mustard-orange Etro dress with delicate embroidery, worn with a matching cape and Christian Louboutin boots — the warmest palette of the night, photographed by Kevin Mazur for the gallery.\n\nThe cape was the tell: where most of the night's looks were cut close for choreography, the evermore silhouette flowed — a deliberate contrast to the crystal bodysuits elsewhere in the running order. She'd joked from the stage that same night about fans' evermore discourse: \"I absolutely love it, despite what some of you say on TikTok.\"",
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
        // Shop pass (2026-07-22): the custom Etro stage gown is not
        // retail merchandise -- a current chiffon gown, verified in
        // stock, closest real match.
        products: [
          {
            brand: 'Mac Duggal',
            item: 'Yellow Ruffle Shoulder V-Neck Chiffon Gown',
            retailer: 'macduggal.com',
            url: 'https://macduggal.com/products/48856-marigold',
            price: '$458.00',
            isAlternative: true,
            altNote: 'The custom Etro stage gown is not retail merchandise -- this marigold chiffon gown matches its warm, flowing character with ruffled shoulders rather than the original\'s cape.',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      day: 17,
      category: 'fashion',
      title: 'The original reputation catsuit, cut-outs and all',
      snippet:
        'A Roberto Cavalli catsuit with a leg and arm cut-out, plus matching Roberto Cavalli boots, for the reputation segment — the version she wore for the tour\'s first year-plus of shows.',
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2023/03/04-Taylor-Swift-outfit-gallery-night-1-billboard-1548.jpg',
      moment: {
        context:
          "The reputation act wore a one-legged, one-armed Roberto Cavalli catsuit in black — cut-outs baring one leg and one arm — with matching Roberto Cavalli boots, shot for Billboard's gallery by Kevin Winter as snake imagery filled the screens behind her. It was the version of the catsuit the tour opened with and kept for its first year-plus of shows before later variants appeared.\n\nThe look did the era's arguing for it: reputation's whole visual identity onstage was serpents and black-and-red defiance, and the single asymmetric silhouette became one of the tour's most-photographed outfits — instantly readable from the top deck of a stadium.",
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
        // Shop pass (2026-07-22): the asymmetrical Cavalli catsuit was
        // custom-made -- a current black cutout jumpsuit, verified in
        // stock, closest real match.
        products: [
          {
            brand: 'Fashion Nova',
            item: 'Lara Cut Out Jumpsuit',
            retailer: 'fashionnova.com',
            url: 'https://www.fashionnova.com/products/lara-cut-out-jumpsuit-fncolorname-black',
            price: '$39.99',
            isAlternative: true,
            altNote: 'The asymmetrical Cavalli catsuit was custom-made -- this black one-shoulder cutout jumpsuit echoes its one-piece shape with flared pants (boots not separately sourced).',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      day: 17,
      category: 'fashion',
      title: 'The Ashish "22" outfit, recreated for Red',
      snippet:
        'The Red segment recreated her iconic look from the "22" music video, made by Ashish, for the Eras Tour\'s opening night.',
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2023/03/05-Taylor-Swift-outfit-gallery-night-1-billboard-1548.jpg',
      moment: {
        context:
          "The Red act's centerpiece was an Ashish-made recreation of her iconic look from the \"22\" music video, rebuilt for the stadium stage and photographed for Billboard's gallery by Kevin Mazur. It was the night's most literal era re-creation: not a reference to a look, the look itself, remade.\n\nThe Red act it anchored ran to the heaviest emotional beat of the night — the ten-minute \"All Too Well,\" performed as white confetti fell like snow through the stadium, per the night-one reviews.",
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
        // Shop pass (2026-07-22): the Ashish stage recreation was custom
        // and never sold -- a real made-to-order fan shirt with the
        // video's phrase, verified available.
        products: [
          {
            brand: 'Upper 90 Studio',
            item: '"Not a Lot Going on at the Moment" Unisex T-Shirt',
            retailer: 'upper90studio.com',
            url: 'https://www.upper90studio.com/store/p/not-a-lot-going-on-at-the-moment-unisex-t-shirt',
            price: '$19.95+',
            isAlternative: true,
            altNote: 'The Ashish stage recreation was custom and never sold at retail -- this made-to-order shirt reproduces the "22" video\'s phrase, not the designer construction.',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      day: 17,
      category: 'fashion',
      title: 'A Nicole + Felicia princess gown for Speak Now',
      snippet: 'A voluminous Nicole + Felicia princess gown for the Speak Now segment of Eras Tour night one.',
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2023/03/06-Taylor-Swift-outfit-gallery-night-1-billboard-1548.jpg',
      moment: {
        context:
          "The Speak Now act belonged to a voluminous Nicole + Felicia princess gown — a full-skirted couture piece photographed for Billboard's gallery by John Shearer, and the most theatrical single garment of opening night. Where every other act dressed for dancing, this one dressed for a slow spotlight turn.\n\nIt fit the era's logic: Speak Now's visual language has always been the purple gown — the original album cover wore one — and on a night built as an era-by-era retrospective, the ball gown WAS the setlist argument, staging the album as the fairy-tale chapter of the catalog.",
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
        // Shop pass (2026-07-22): the Nicole + Felicia tour gown was
        // custom-made -- a current purple strapless ball gown, verified
        // in stock, closest real match.
        products: [
          {
            brand: 'Mac Duggal',
            item: 'Purple Strapless Satin Ball Gown With Draped Detail',
            retailer: 'macduggal.com',
            url: 'https://macduggal.com/products/56425-periwinkle',
            price: '$398.00',
            isAlternative: true,
            altNote: 'The Nicole + Felicia tour gown was custom-made -- this periwinkle strapless ball gown recreates the purple princess volume in satin, with draping rather than the original embellishment.',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      day: 17,
      category: 'fashion',
      title: 'A flowing purple Alberta Ferretti dress for Folklore',
      snippet: "A flowing purple Alberta Ferretti dress captured the woodsy feel of Folklore on Eras Tour opening night.",
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/03/02-Taylor-Swift-The-Eras-Tour-opening-night-billboard-1548.jpg',
      moment: {
        context:
          "The folklore act came dressed in a flowing purple Alberta Ferretti gown — loose, layered, and photographed by Kevin Mazur for Billboard's night-one gallery — the closest thing the show had to the album's cardigan-and-cottage softness rendered as stagewear.\n\nfolklore was also one of the two albums the show dug deepest into — it and Midnights got the longest acts, making up for the eras she never toured — and the act played out around the on-stage folklore cabin, the gown moving like the era's whole misty aesthetic in fabric form.",
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
        // Shop pass (2026-07-22): the Alberta Ferretti tour dress was
        // custom-made -- a current purple chiffon gown, verified in
        // stock, closest real match.
        products: [
          {
            brand: 'Mac Duggal',
            item: 'Purple Ruched Chiffon Sleeveless Gown With 3D Flower',
            retailer: 'macduggal.com',
            url: 'https://macduggal.com/products/49938',
            price: '$498.00',
            isAlternative: true,
            altNote: 'The Alberta Ferretti tour dress was custom-made -- this vintage-lilac layered chiffon gown offers comparable soft movement, with a different neckline and floral detail.',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      day: 17,
      category: 'fashion',
      title: 'A magenta Jessica Jones gown for the surprise-song set',
      snippet: 'For the acoustic surprise-song portion of the night, Taylor stunned in a magenta Jessica Jones dress.',
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/03/taylor-swift-eras-tour-acoustic-guitar-march-17-2023-billboard-1548.jpg',
      moment: {
        context:
          "The acoustic set is where Taylor plays two surprise songs each night, swapped every show — and on opening night the segment got its own dedicated gown: a magenta Jessica Jones dress, photographed by Kevin Mazur — acoustic guitar in hand — for Billboard's look-by-look gallery.\n\nBecause the surprise-song slot changed nightly, its dress became a look fans tracked closely show to show — a stripped-down, one-instrument reset in the middle of a production numbering 44 songs and over three hours, and the segment where set-list watchers got their nightly payoff.",
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
        // Shop pass (2026-07-22): the Jessica Jones stage gown was
        // custom-made -- a current magenta kaftan gown, verified in
        // stock, closest real match.
        products: [
          {
            brand: 'Mac Duggal',
            item: 'Hot Pink Cut Out Fringe Kaftan Gown',
            retailer: 'macduggal.com',
            url: 'https://macduggal.com/products/49898-magenta',
            price: '$498.00',
            isAlternative: true,
            altNote: 'The Jessica Jones stage gown was custom-made -- this magenta kaftan gown preserves the saturated color and flowing movement, with cutouts and fringe instead of the original silhouette.',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 3,
      day: 17,
      category: 'fashion',
      title: 'Oscar de la Renta closes the night for Midnights',
      snippet:
        'An Oscar de la Renta faux fur coat and crystal T-shirt gave way to a shining navy blue Oscar de la Renta bodysuit and Christian Louboutin boots to close the Midnights set.',
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/03/07-Taylor-Swift-outfit-gallery-night-1-billboard-1548-1.jpg',
      moment: {
        context:
          "Oscar de la Renta owned the show's final act, and Billboard's gallery logs it as a three-stage look: a faux fur coat over a crystal T-shirt to open the Midnights set, the coat shed to let the crystal shirt carry the middle songs, and finally a shining navy blue bodysuit — with Christian Louboutin boots — to close the night. The album the tour was nominally promoting got a full act's worth of wardrobe to itself.\n\nThe navy bodysuit is the one on the marquee moment: it's what she wore for the closing run that ended the night with \"Karma,\" the final song of the very first Eras Tour show — the image of Midnights as the era that contained all the others.",
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
        // Shop pass (2026-07-22): the Oscar de la Renta bodysuit, shirt,
        // and coat were custom -- a current navy sequin mini, verified in
        // stock, closest real match.
        products: [
          {
            brand: 'Beginning Boutique',
            item: 'Penny Lane Navy Sequin Mini Dress',
            retailer: 'beginningboutique.com',
            url: 'https://www.beginningboutique.com/products/penny-lane-navy-sequin-mini-dress',
            price: '$89.99',
            isAlternative: true,
            altNote: 'The Oscar de la Renta bodysuit, shirt, and coat were custom -- this navy sequin mini captures the closing look\'s color and shine in one dress, the primary piece only.',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 1,
      day: 7,
      category: 'fashion',
      title: 'A sparkling green Gucci gown at the Golden Globes',
      snippet:
        'A custom sparkling green Gucci gown by Sabato de Sarno, paired with green Christian Louboutin pumps and De Beers diamonds — plus a snake-like ring stack fans read as a reputation nod.',
      sourceUrl: 'https://www.billboard.com/music/awards/taylor-swift-golden-globes-dress-2024-1235577071/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2024/01/taylor-swift-02-golden-globes-2024-billboard-1548.jpg?w=1024',
      moment: {
        context:
          "Styled by her go-to stylist Joseph Cassell for the January 7, 2024 ceremony, the custom Sabato De Sarno-era Gucci was a slinky, floor-length column in shimmering green, thin straps baring her shoulders and back, worn with De Beers diamonds and green Christian Louboutin pumps. She was there as a nominee: Taylor Swift: The Eras Tour was up for the Globes' brand-new Cinematic and Box Office Achievement award.\n\nFans mined the look immediately: the fabric's scale-like shimmer and a De Beers ring stack that appeared to coil around her finger like a snake read to many as reputation (Taylor's Version) bait, a theory the internet ran with for weeks. Inside the room she was photographed with Emma Stone, Keleigh Teller, and Selena Gomez, wearing her signature bangs in soft waves — a switch from the sideswept styling of her recent carpets.",
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
        // Shop pass (2026-07-22): the custom Gucci gown was not released
        // for retail -- a current emerald sequin gown, verified in stock,
        // closest real match.
        products: [
          {
            brand: 'Mac Duggal',
            item: 'Green Cowl Back Boat Neck Sequined Evening Gown',
            retailer: 'macduggal.com',
            url: 'https://macduggal.com/products/26331_emerald',
            price: '$398.00',
            isAlternative: true,
            altNote: 'The custom Gucci gown was not released for retail -- this emerald sequin gown shares its saturated sparkle, with a boat neck and cowl back instead of the original column shape.',
          },
        ],
      },
    },

    // --- Fashion/photo depth pass 2 (2026-07-04)
    {
      year: 2023,
      month: 2,
      day: 5,
      category: 'fashion',
      title: 'A midnight-blue, star-scattered Roberto Cavalli look at the 2023 Grammys',
      snippet:
        'A long-sleeve, mock-neck Roberto Cavalli crop top and matching skirt by designer Fausto Puglisi, covered edge to edge in silver and blue sequins and beads meant to read as a night sky — a direct nod to the Midnights album she was there representing.',
      sourceUrl: 'https://www.redcarpet-fashionawards.com/2023/02/06/taylor-swift-wore-roberto-cavalli-to-the-2023-grammy-awards/',
      thumbnailUrl:
        'https://www.redcarpet-fashionawards.com/wp-content/uploads/2023/02/Taylor-Swift-Wore-Roberto-Cavalli-To-The-2023-Grammy-Awards.jpeg',
      moment: {
        context:
          'Worn to the Feb. 5, 2023 ceremony at Crypto.com Arena, the custom Roberto Cavalli two-piece — designed by the house\'s Fausto Puglisi — was paired with statement earrings of diamonds, purple sapphires and turquoise-blue paraiba tourmalines from Lorraine Schwartz, coordinated blue eye makeup, and a matching blue manicure, with her regular team of stylist Joseph Cassell Falconer, hairstylist Jemma Muradian, and makeup artist Lorrie Turk behind the look.\n\nThe design worked as a double reference: the midnight-blue base read as Midnights itself, while the scatter of silvery-white embellishment across the crop top and skirt was widely taken as a nod to "Midnight Rain." Red Carpet Fashion Awards called the whole thing "a fashion equivalent of a homerun" — an album cover translated into eveningwear on the night Midnights\' campaign hit the Grammys.',
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
            focalPoint: '53% 12%',
          },
          {
            url: 'https://www.redcarpet-fashionawards.com/wp-content/uploads/2023/02/Taylor-Swift-2023-Grammys-683x1024.jpeg',
            credit: 'Getty Images',
            focalPoint: '45% 25%',
          },
        ],
        // Shop pass (2026-07-22): the custom Cavalli Grammys set was
        // never sold at retail -- a current sequin two-piece set,
        // verified in stock, closest real match.
        products: [
          {
            brand: 'Showpo',
            item: 'Aurora Two Piece Top and Skirt Set',
            retailer: 'showpo.com',
            url: 'https://www.showpo.com/us/products/aurora-two-piece-top-and-skirt-set-floral-sequin-cowl-neck-top-and-maxi-skirt-in-baby-blue',
            price: '$45.00',
            isAlternative: true,
            altNote: 'The custom Cavalli Grammys set was never sold at retail -- this blue sequin two-piece keeps the cropped-top-and-skirt formula, in pale blue with floral sequins and a cowl neck.',
          },
        ],
      },
    },

    // --- G-A depth pass: Active-month payoff beats (2026-07-15)
    {
      slug: 'all-too-well-grammy-best-music-video',
      // Cross-link (Stage 3, 2026-07-30): the "All Too Well: The Short Film"
      // pair — the premiere, and the Grammy win it led to — now interlink.
      relatedIds: ['moment:vault-evermore-all-too-well-the-short-film-premieres-she-wrote-it-she-direc'],
      year: 2023,
      month: 2,
      day: 5,
      category: 'business',
      title: 'All Too Well: The Short Film wins the Grammy that makes her an award-winning director',
      snippet:
        'The 10-minute version’s short film takes Best Music Video at the 2023 Grammys — and no artist had ever won the category as the sole director of their own video before. Her reaction: “…acknowledge me as a director, and in doing so, acknowledge my work to try and reclaim my music… I’m blown away.”',
      sourceUrl:
        'https://www.rollingstone.com/music/music-news/taylor-swift-award-winning-director-best-music-video-grammys-2023-1234674183/',
      thumbnailUrl: null,
      moment: {
        context:
          'The win landed early — announced at the afternoon Premiere Ceremony, before the telecast — so it was the film’s co-producer Saul Germaine who accepted, thanking Taylor from the podium: “It was an incredible honor to tell this story with you.” The history in it: Grammy voters had never before handed Best Music Video to an artist with a sole directing credit on their own video. She wrote, directed, and starred in the short film alongside Sadie Sink and Dylan O’Brien.\n\nHer posted response drew the line fans drew too, from the directing credit straight back to the rerecording project the ten-minute “All Too Well” anchors: “For the Recording Academy and my peers to acknowledge me as a director, and in doing so, acknowledge my work to try and reclaim my music… I’m blown away.” She spent the evening ceremony in the star-scattered midnight-blue Cavalli from that afternoon’s red carpet — Midnights’ own Grammy night, the record fourth Album of the Year, was still a year away.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-award-winning-director-best-music-video-grammys-2023-1234674183/',
            source_title:
              'Taylor Swift Is Officially an Award-Winning Director With Her Best Music Video Grammy 2023 Win',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-15',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/awards/taylor-swift-2023-grammys-dress-winner-all-too-well-music-video-1235213021/',
            source_title: 'Taylor Swift & Fans React to Grammy Win for ‘All Too Well’ Music Video',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-15',
            reliability_score: 4,
          },
          {
            outlet: 'GRAMMY.com',
            url: 'https://www.grammy.com/news/taylor-swift-all-too-well-the-short-film-best-music-video-winner-2023-grammys',
            source_title:
              'Taylor Swift Makes GRAMMY History (Again) With Best Music Video Win For "All Too Well: The Short Film"',
            publisher: 'The Recording Academy',
            source_type: 'official',
            accessed_at: '2026-07-15',
            reliability_score: 5,
          },
        ],
        // Photo-enrichment pass (2026-07-18): two frames of the midnight-blue
        // Cavalli from the 2023 Grammys carpet — the look the context describes —
        // from the page's own cited Rolling Stone article plus Billboard's
        // companion piece. Both curl-verified 200 + image/jpeg and vision-checked
        // (Grammy gramophone backdrop visible). The short film's poster was
        // rejected: Wikipedia's copy renders at 277px, under the 400px floor.
        photos: [
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2023/02/GettyImages-1463251082.jpg?w=1600&h=900&crop=1',
            credit: 'Getty Images via Rolling Stone',
            caption:
              'The star-scattered midnight-blue Roberto Cavalli at the 2023 Grammys — the carpet look she kept on through the evening ceremony after the afternoon Best Music Video win.',
            kind: 'primary',
            focalPoint: '48% 18%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/02/04-taylor-swift-2023-grammys-red-carpet-billboard-1548.jpg?w=1024',
            credit: 'Getty Images via Billboard',
            caption:
              'Close-up on the same Grammys carpet: the diamond-and-amethyst drop earrings over the beaded Cavalli turtleneck.',
            kind: 'primary',
            focalPoint: '40% 32%',
          },
        ],
      },
    },
    {
      year: 2022,
      month: 10,
      day: 25,
      category: 'fashion',
      title: 'A Dita Von Teese-styled burlesque scene and Pat McGrath\'s 30-look makeup for "Bejeweled"',
      snippet:
        'Burlesque legend Dita Von Teese coached Taylor through the martini-glass dance number and worked with stylist Joseph Cassell and costumer Catherine D\'Lish on the crystal-covered costumes; makeup artist Pat McGrath built roughly 30 distinct looks for the video, including a jeweled cat-eye and a red ombré lip.',
      sourceUrl: 'https://www.billboard.com/music/music-news/dita-von-teese-taylor-swift-bejewled-music-video-1235161045/',
      thumbnailUrl: 'https://cdn01.justjared.com/wp-content/uploads/headlines/2022/10/bejeweled-cameos.jpg',
      moment: {
        context:
          'Von Teese told Billboard it was a "true pleasure" working with Taylor, who she coached on the burlesque choreography for the "Bejeweled" video\'s giant-martini-glass scene, alongside Taylor\'s longtime stylist Joseph Cassell and burlesque costumer Catherine D\'Lish.\n\nSeparately, makeup artist Pat McGrath — who cameos in the video as "Queen Pat" — told E! she created about 30 different looks for the shoot, including a contoured red ombré lip built from three products (Legendary Wear Matte Lipstick in "Elson 4" and PermaGel Ultra Glide Lip Pencils in Deep Dive and Blood Lust), plus a jeweled smoky cat-eye using an unreleased shadow palette from her own line.',
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
        // Shop pass (2026-07-22): the exact lipstick shade used for the
        // red ombre lip, verified in stock.
        products: [
          {
            brand: 'Pat McGrath Labs',
            item: 'LiquiLUST: Legendary Wear Lipstick in Elson 4',
            retailer: 'patmcgrath.com',
            url: 'https://www.patmcgrath.com/products/liquilust-legendary-wear-matte-lipstick',
            price: '$34.00',
            isAlternative: false,
            altNote: 'The exact Elson 4 shade used for the red ombre lip -- the primary makeup item only, not the full 30-look kit or the jeweled cat-eye.',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 9,
      day: 12,
      category: 'fashion',
      title: 'A black Versace gown with gold buttons at the 2023 VMAs',
      snippet:
        'A black Versace dress with an asymmetrical line of the house\'s signature gold buttons, a thigh-high slit, and Jimmy Choo stiletto pumps — styled by Joseph Cassell, the same stylist behind her Eras Tour looks.',
      sourceUrl: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-mtv-vmas-2023-red-carpet-versace-1235806480/',
      thumbnailUrl:
        'https://media-cldnry.s-nbcnews.com/image/upload/c_fill,g_auto,w_1667,h_2500/rockcms/2023-09/230912-vma-taylor-swift-ew-802p-78ccc7.jpg',
      moment: {
        context:
          'Worn to the Sept. 12, 2023 MTV VMAs — the night she won Video of the Year for "Anti-Hero" among nine total Moon Person wins — the black Versace ran its asymmetrical line of the house\'s signature gold buttons down the bodice, with a thigh-high slit over Jimmy Choo stiletto pumps. The look was finished with a stack of necklaces from Joseph Saidian and Sons and an Anita Ko diamond ear cuff.\n\nStylist Joseph Cassell — the same hand behind her Eras Tour wardrobe — kept the formula consistent with her biggest awards-night looks of the era: one house, one dark statement piece, gold hardware doing the accent work. In a season when every appearance was scanned for re-record clues, the black-and-gold palette was read as reputation-coded on sight.',
        sources: [
          {
            outlet: 'WWD',
            url: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-mtv-vmas-2023-red-carpet-versace-1235806480/',
          },
        ],
        photos: [
          {
            url: 'https://media-cldnry.s-nbcnews.com/image/upload/c_fill,g_auto,w_1667,h_2500/rockcms/2023-09/230912-vma-taylor-swift-ew-802p-78ccc7.jpg',
            credit: 'NBC News',
            caption: 'The black Versace gown with its line of gold buttons and thigh-high slit, on the 2023 VMAs pink carpet.',
            kind: 'fashion',
          },
        ],
        // Shop pass (2026-07-22): the original Versace gown is no longer
        // sold -- a current black-and-gold sequin gown, verified in
        // stock, closest real match.
        products: [
          {
            brand: 'Mac Duggal',
            item: 'Black and Gold Sequined Wrap Over Butterfly Sleeve Draped Gown',
            retailer: 'macduggal.com',
            url: 'https://macduggal.com/products/5540',
            price: '$199.00',
            isAlternative: true,
            altNote: 'The original Versace gown is no longer sold -- this black-and-gold sequin gown matches the palette and shine, with a wrap front and butterfly sleeves instead of gold buttons.',
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
        'https://upload.wikimedia.org/wikipedia/commons/f/f3/Taylor_Swift_The_Eras_Tour_The_Red_Era_Set_%2853109971409%29.jpg',
      moment: {
        context:
          'The exact shade had been a mystery to fans for years until behind-the-scenes docuseries footage caught Turk applying it: MAC Locked Kiss 24HR Lipstick in "Ruby True," a classic blue-red.\n\nThe durability was the real trade secret: layered over Smashbox\'s Be Legendary Line & Prime Pencil and set with Charlotte Tilbury Airbrush Flawless Finish Setting Powder, the combination was built specifically to survive multi-hour shows and outdoor-stadium weather — the same lip at song 1 and song 44, through rain shows included.',
        sources: [
          {
            outlet: 'Taylor Swift Style',
            url: 'https://www.taylorswiftstyle.com/post-grid/teoae-erasredlipstick',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Taylor_Swift_The_Eras_Tour_The_Red_Era_Set_%2853109971409%29.jpg',
            credit: 'Paolo V, CC BY 2.0, via Wikimedia Commons',
            caption: "Taylor performing the Red set on the Eras Tour, wearing the MAC Locked Kiss 24HR lipstick in \"Ruby True\" that became her signature stage lip.",
            kind: 'fashion',
          },
        ],
        // Shop pass (2026-07-22): the exact MAC lipstick and shade
        // identified in the backstage footage, verified in stock.
        products: [
          {
            brand: 'MAC',
            item: 'Locked Kiss 24HR Lipstick in Ruby True',
            retailer: 'maccosmetics.com',
            url: 'https://www.maccosmetics.com/product/13854/119065/products/makeup/lips/lipstick/mac-locked-kiss-24hr-lipstick?shade=RUBY+TRUE',
            price: '$34.00',
            isAlternative: false,
            altNote: 'The exact MAC lipstick and shade identified in the backstage footage -- the primary lip color only, without the liner, setting powder, or full application routine.',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 1,
      day: 27,
      category: 'fashion',
      title: 'A 70s lace slip dress and Free People fur coat for "Lavender Haze"',
      snippet:
        'A white lace-trimmed slip mini dress under a light-violet Free People "Renata" faux fur coat, styled with shag-inspired bangs, glittery eyeshadow, and glossy pink lips for the self-directed 70s-themed video.',
      sourceUrl: 'https://www.shefinds.com/collections/taylor-swift-lavender-haze-lacy-slip-mini-dress-music-video/',
      thumbnailUrl: 'https://images.hellomagazine.com/horizon/original_aspect_ratio/cdb2d2b2b516-tcoatz-z.jpg',
      moment: {
        context:
          'The white silky slip has floral lace at the neckline and thigh-skimming cutouts along the hem, under the Free People Renata Faux Fur Coat; other looks in the video include an oversized T-shirt worn as a dress and a separate 70s-inflected knit top.\n\nThe video, which Taylor wrote and directed, leans fully into a groovy, retro aesthetic — loose beachy waves, shag bangs, and warm-toned glam.',
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
            url: 'https://images.hellomagazine.com/horizon/original_aspect_ratio/cdb2d2b2b516-tcoatz-z.jpg',
            credit: 'Taylor Swift / Republic Records (music video still) via Hello!',
            caption: 'The lace slip dress and Free People faux fur coat, on the 70s-themed set of the self-directed "Lavender Haze" video.',
            kind: 'primary',
          },
        ],
        // Shop pass (2026-07-22): the original Free People slip and coat
        // are discontinued -- a current white lace mini, verified in
        // stock, closest real match.
        products: [
          {
            brand: 'Beginning Boutique',
            item: 'All Mine White Lace Mini Dress',
            retailer: 'beginningboutique.com',
            url: 'https://www.beginningboutique.com/products/all-mine-white-lace-mini-dress',
            price: '$99.99',
            isAlternative: true,
            altNote: 'The original Free People slip and coat are discontinued -- this white lace mini is a current stand-in for the dress only, with a different lace construction (the fur coat not included).',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 5,
      day: 26,
      category: 'fashion',
      title: 'A Coach gingham minidress for the "Karma" surprise video',
      snippet:
        'A black-and-white gingham Coach minidress with a Peter Pan collar and a cherry motif running down the bodice like a tie, worn "skipping down a yellow brick road" in the surprise "Karma" video, premiered live at the Eras Tour\'s New Jersey stop.',
      sourceUrl: 'https://www.billboard.com/culture/product-recommendations/taylor-swift-karma-video-dress-where-to-buy-1235342478/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2023/05/coach-gingham-dress-edited.jpeg?w=1000',
      moment: {
        context:
          'The Coach Gingham Tie Collar Mini Dress (retail $550) featured in the "Karma" video, which premiered an hour early for the crowd at MetLife Stadium on May 26, 2023 before its official online release.\n\nThe premiere folded into a bigger New Jersey wardrobe story: the same stand also debuted a silver leotard, a gold dress, and a new "Enchanted" princess gown on the Eras Tour stage — a mid-tour refresh that had outfit-tracking fans working overtime the same weekend the video dropped.',
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
        // Shop pass (2026-07-22): the exact Coach black-and-white minidress
        // is discontinued -- a current red gingham cherry-print dress,
        // verified in stock, closest real match.
        products: [
          {
            brand: 'Unique Vintage',
            item: 'Red Gingham & Cherries Sweetheart Swing Dress',
            retailer: 'unique-vintage.com',
            url: 'https://www.unique-vintage.com/products/unique-vintage-red-gingham-cherries-sweetheart-swing-dress',
            price: '$98.00',
            isAlternative: true,
            altNote: 'The exact Coach black-and-white Peter Pan-collar mini is discontinued -- this current dress carries the gingham-and-cherry motif in red, with a sweetheart neckline and swing skirt.',
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
      day: 12,
      category: 'sighting',
      title: 'A Thursday-night Broncos game, one day after the Eras film premiere',
      snippet:
        "Straight off the Eras Tour film's LA premiere, she landed in Kansas City, arrived in a Chiefs zip-up about 45 minutes before kickoff, and was driven by golf cart to a private box to watch with Donna Kelce again.",
      sourceUrl: 'https://www.cbssports.com/nfl/news/look-taylor-swift-arrives-at-broncos-chiefs-thursday-night-game-to-watch-travis-kelce/',
      thumbnailUrl:
        'https://sportshub.cbsistatic.com/i/r/2023/10/12/40650345-0cc6-4ceb-b781-c837359fee06/thumbnail/770x433/d8fdf57d237d253925cb3ab88bc67608/swift-chiefs-g.jpg',
      moment: {
        context:
          'It was her third Chiefs game of the 2023 season, played the Thursday night of Oct. 12 — she waved and smiled at fans on her way in before the 8:15 p.m. ET kickoff, was golf-carted through the building, and settled into a private box with Donna Kelce again, with Kansas City a 10.5-point favorite over Denver.\n\nThe broadcast politics were already their own story: Amazon\'s Prime Video crew, with Al Michaels promising coverage of her would come "in moderation," still had her on screen twice within her first twenty minutes in the stadium. The turnaround was the flex — the Eras Tour concert film had premiered in Los Angeles barely 24 hours earlier, and she was back in Kansas City before its opening weekend even started.',
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
      day: 14,
      category: 'sighting',
      title: 'A wordless SNL cameo, then dinner at Nobu',
      snippet:
        'She popped onscreen for four words — "Once again, Ice Spice" — during the season 49 premiere, then that night was seen cuddling through an intimate sushi dinner with Travis at Nobu, the first time the two had shown that much public affection.',
      sourceUrl: 'https://www.tmz.com/2023/10/15/taylor-swift-ice-spice-snl-travis-kelce-pete-davidson-nobu/',
      thumbnailUrl: 'https://imagez.tmz.com/image/77/4by3/2023/10/15/77f8e73e44f34d2ead2e55f2444bc657_md.jpg',
      moment: {
        context:
          'On the Oct. 14, 2023 premiere hosted by Pete Davidson, Travis also got his own cameo — popping up after Kenan Thompson joked about wanting real football talk instead of Taylor gossip. Neither performed with the cast.\n\nHours later, TMZ caught the couple holding hands past the sushi bar at Nobu in Manhattan, Travis greeting the chefs, before sitting down to a meal an eyewitness described as spent "cuddling throughout."',
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
        ],
      },
    },
    {
      year: 2023,
      month: 10,
      day: 22,
      category: 'sighting',
      title: "A friendship bracelet with his number, for the Chargers game",
      snippet:
        "For her fourth Chiefs game of the season, a friendship bracelet reading '87' surrounded by hearts — plus a celebratory handshake with Brittany Mahomes every time Kansas City scored.",
      sourceUrl: 'https://www.bustle.com/entertainment/taylor-swift-friendship-bracelet-travis-kelce-tribute',
      thumbnailUrl:
        'https://imgix.bustle.com/uploads/getty/2023/10/23/b8956637-edbb-49a6-9f42-58fe6268b05c-getty-1750806324.jpg?w=1200&fit=max',
      moment: {
        context:
          'For the Oct. 22, 2023 Chargers game at Arrowhead — her fourth of the season — the accessory did the talking: a friendship bracelet spelling out "87" with hearts on both sides, worn with a Chiefs sweater in the family suite, where she sat with Brittany Mahomes and the Mahomeses\' infant son.\n\nThe suite footage became its own subplot: she and Brittany broke out a celebratory handshake every time Kansas City scored a touchdown. After the win, Travis held her hand out of the stadium and opened the convertible door for her — the "getaway car" exit becoming a post-game ritual of its own.',
        sources: [
          {
            outlet: 'Bustle',
            url: 'https://www.bustle.com/entertainment/taylor-swift-friendship-bracelet-travis-kelce-tribute',
          },
        ],
        photos: [
          {
            url: 'https://imgix.bustle.com/uploads/getty/2023/10/23/b8956637-edbb-49a6-9f42-58fe6268b05c-getty-1750806324.jpg?w=1200&fit=max',
            credit: 'Getty Images via Bustle',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 11,
      day: 11,
      category: 'sighting',
      title: 'Travis flies to Buenos Aires for the second Eras Tour show there',
      snippet:
        "He arrived a day late — after missing the first Argentina show for a Kansas City gala — and watched from the VIP tent beside her dad Scott. She altered a lyric mid-show to reference him, then ran into his arms to kiss him once it wrapped.",
      sourceUrl: 'https://www.billboard.com/music/music-news/travis-kelce-taylor-swift-buenos-aires-eras-tour-1235469312/',
      thumbnailUrl: null,
      moment: {
        context:
          'Nov. 11, 2023, at Estadio River Plate — the same day she\'d woken up to six new Grammy nominations, which she mentioned from the stage before the show. Kelce had landed in Argentina Thursday night, taken her to a hand-in-hand dinner at the Four Seasons, and then watched the Saturday show from a side tent next to her father, Scott — the seating chart that launched a thousand "meeting the parents" headlines.\n\nThe stand itself was chaotic: the middle Buenos Aires date had been pushed to Sunday after storms she described as "so truly chaotic it would be unsafe to try and put on this concert," which is how his first Eras Tour show as her boyfriend became the one where she rewrote a "Karma" lyric for him mid-set and ran into his arms afterward.',
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
        // Real-photo pass (2026-07-09): freely licensed crowd photo from the same
        // Buenos Aires stand (night one, two days before this moment), clearly
        // labeled — no free photo of Kelce in the tent exists.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Cierre_del_Eras_Tour_de_Taylor_Swift%2C_Buenos_Aires_noche_1.jpg/960px-Cierre_del_Eras_Tour_de_Taylor_Swift%2C_Buenos_Aires_noche_1.jpg',
            credit: 'Solargentino, CC BY-SA 4.0, via Wikimedia Commons',
            caption: 'The final bow at Estadio River Plate on the first Buenos Aires night, Nov. 9, 2023 — two nights before Kelce watched from the VIP tent at the same stadium.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 11,
      day: 4,
      category: 'sighting',
      title: 'A girls-only night out on Bond Street',
      snippet:
        'Leaving a Japanese restaurant on Bond Street, she locked arms with Selena Gomez and held Brittany Mahomes\'s hand, with Sophie Turner, Gigi Hadid, and Cara Delevingne close behind — a rare all-friends outing between Chiefs games and Eras Tour dates.',
      sourceUrl: 'https://www.tmz.com/2023/11/05/taylor-swift-selena-gomez-sophie-turner-gigi-hadid-brittany-mahomes-dinner-new-york/',
      thumbnailUrl: 'https://imagez.tmz.com/image/b8/4by3/2023/11/05/b8a558e9361042cca1e7b95fea55ef56_md.jpg',
      moment: {
        context:
          "The early-November 2023 dinner at Bond Street, the Japanese restaurant in NoHo, assembled a notably current version of the squad: Selena Gomez on one arm, Brittany Mahomes' hand in hers, with Sophie Turner, Gigi Hadid, and Cara Delevingne walking out just behind — the frame TMZ's cameras caught becoming the night's defining image.\n\nThe guest list was the story. Brittany Mahomes' presence marked how completely the Kansas City circle had merged with the longtime friend group within six weeks of the first Chiefs game, while Sophie Turner's spot in the lineup, in the middle of her very public divorce proceedings that fall, read as a deliberate closing of ranks. Days later, Taylor flew south for the Buenos Aires leg of the tour.",
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
      day: 13,
      category: 'sighting',
      title: 'A crescent-moon dress for her 34th birthday, with Blake Lively',
      snippet:
        'A black Clio Peppiatt cocktail dress covered in silver crescent moons and stars, a furry coat, and Blake Lively\'s hand to hold walking into The Box nightclub — Travis stayed behind in Kansas City for mandatory Chiefs practice.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-birthday-blake-lively-miles-teller-photos-1235556824/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2023/12/01-taylor-swift-dec-13-2023-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'The main party was Dec. 13, 2023, following a lower-key Dec. 12 gathering at Zero Bond with Selena Gomez — two nights of celebrating turning 34 with Miles Teller and Keleigh Sperry also along for both. The birthday-night dress was the detail fans clocked: a black Clio Peppiatt cocktail piece scattered with silver crescent moons and stars — a Midnights sky rendered in beadwork for a Midnights-era birthday — under a furry coat, with sky-high black heels.\n\nTravis Kelce\'s absence had a paper trail rather than a subtext: he stayed back in Kansas City for a mandatory Chiefs practice, leaving Blake Lively to take the hand-holding duties on the walk into The Box as photographers packed the sidewalk.',
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
      day: 31,
      category: 'sighting',
      title: 'Ringing in 2024 with the Mahomeses',
      snippet:
        "A double-date New Year's Eve in Kansas City — a kiss with Travis at midnight, and a photo with Patrick and Brittany Mahomes that raced past a million views, hours after watching the Chiefs beat Cincinnati 25–17.",
      sourceUrl: 'https://www.newsweek.com/taylor-swift-travis-kelce-patrick-brittany-mahomes-kansas-city-chiefs-photo-1857056',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2023/12/taylor-swift-dec-31-2023-kansas-city-chiefs-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          "The day ran football-first: she watched the Chiefs close out 2023 by beating Cincinnati 25-17 on Dec. 31, then the couples reconvened for a New Year's Eve party where a midnight kiss with Travis — caught on fan video — did the year-in-review headline writing for every outlet in the celebrity press.\n\nThe four-person photo was the artifact that lasted: Taylor with a drink in one hand and the other arm wrapped around Kelce, leaning into Brittany Mahomes' hug while Patrick beamed alongside — a frame that blew past a million views almost immediately. The comments wrote themselves; as one viral reply put it, she had \"one hand on her drink the other on her man... girl has her priorities straight.\"",
        sources: [
          {
            outlet: 'Newsweek',
            url: 'https://www.newsweek.com/taylor-swift-travis-kelce-patrick-brittany-mahomes-kansas-city-chiefs-photo-1857056',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/12/taylor-swift-dec-31-2023-kansas-city-chiefs-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Jamie Squire/Getty Images via Billboard',
            caption: "Taylor Swift watches from the Arrowhead suite as the Chiefs beat the Bengals 25-17 on Dec. 31, 2023, hours before the Mahomeses' New Year's Eve party.",
            kind: 'sighting',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 1,
      day: 21,
      category: 'sighting',
      title: 'A frigid divisional round in Buffalo, seated with Jason Kelce',
      snippet:
        "Braving frigid temperatures at Highmark Stadium, she watched the Chiefs beat the Bills 27–24 from a suite alongside Travis's brother Jason — while some Bills fans in the crowd held up a sign reading they'd come \"for Taylor.\"",
      sourceUrl: 'https://www.cbsnews.com/news/taylor-swift-travis-kelce-chiefs-buffalo-bills-highmark/',
      thumbnailUrl:
        'https://assets3.cbsnewsstatic.com/hub/i/r/2024/01/21/3ea9f4b6-39c9-4026-aea6-be7d5a44af76/thumbnail/620x413/fe93c98a06090411f5266f68af3ce8b1/gettyimages-1950919592.jpg',
      moment: {
        context:
          'Jan. 21, 2024, at the AFC Divisional Round in Orchard Park, New York — her second straight playoff-game appearance, following the Wild Card round the week before, and her first true road playoff environment: a Buffalo crowd famous for wanting no part of visiting fandom, with some Bills supporters still holding up a sign saying they\'d come "for Taylor."\n\nThe game earned the frostbite: Kansas City survived 27-24 when Buffalo\'s Tyler Bass pushed a potential game-tying field goal wide right with under two minutes left, sending the Chiefs to the AFC Championship. She watched it land from a suite she shared with Travis\'s brother Jason — an Eagles player with no rooting stake beyond family — in what became one of the season\'s most replayed suite-camera nights.',
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

    // --- Music-backstory + chart-record depth pass (2026-07-05): the album's
    // music backstories were thin (3 items) relative to its 13-plus track
    // list, so this batch digs into song-by-song writing stories with
    // on-record Taylor/collaborator quotes, plus two chart records verified
    // with a working second source this session — including the entire-
    // Hot-100-top-10 record flagged as parked in this file's header note
    // (a second source, Wikipedia's Anti-Hero page, was reachable this time).
    // Every claim below verified against its cited source(s) directly.
    {
      year: 2022,
      month: 10,
      day: 7,
      category: 'music',
      title: 'A Mad Men rerun gave Midnights its opening track',
      snippet:
        'She found "lavender haze" watching Mad Men, looked up its 1950s meaning — "an all-encompassing love glow" — and turned it into an opening track defending her relationship from tabloid noise.',
      sourceUrl:
        'https://www.rollingstone.com/music/music-news/taylor-swift-reveals-lavender-haze-midnights-inspiration-joe-alwyn-1234607000/',
      thumbnailUrl: null,
      moment: {
        context:
          'In an Instagram video explaining the song, Taylor said: "I happened upon the phrase \'lavender haze\' when I was watching Mad Men. And I looked it up because I thought it sounded cool, and it turns out that it\'s a common phrase used in the \'50s where they would just describe being in love... If you were in the lavender haze, then that meant that you were in that all-encompassing love glow."\n\nShe tied it directly to her own six-year relationship with Joe Alwyn: "My relationship for six years, we\'ve had to dodge weird rumors, tabloid stuff, and we just ignore it... this song is sort of about the act of ignoring that stuff to protect the real stuff."',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-reveals-lavender-haze-midnights-inspiration-joe-alwyn-1234607000/',
          },
        ],
        // Real-photo pass (2026-07-09): single artwork from Wikipedia's stable
        // upload.wikimedia.org copy. Verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/a/af/Taylor_Swift_-_Lavender_Haze.png',
            credit: 'Republic Records',
            caption: 'Single artwork for "Lavender Haze," the Mad Men-inspired opening track.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      // Cross-link (Stage 3, 2026-07-30): the folklore reveal this song's
      // pseudonym pays off. (Note: "William Bowery revealed" in folklore.mjs
      // is a same-fact duplicate of the reveal moment linked below — not a
      // second link target; see PR notes.)
      relatedIds: ['moment:vault-folklore-william-bowery-is-joe-the-long-pond-reveal'],
      year: 2022,
      month: 10,
      category: 'music',
      title: 'William Bowery writes one more Midnights love song',
      snippet:
        "Joe Alwyn's songwriting pseudonym — borrowed from a great-grandfather who composed film scores and the New York neighborhood where he first lived — turns up again, on a quiet song built from real domestic memories.",
      sourceUrl: 'https://www.thethings.com/why-did-taylor-swift-credit-joe-alwyn-as-william-bowery/',
      thumbnailUrl: null,
      moment: {
        context:
          '"Sweet Nothing" is credited to Taylor and William Bowery — the pseudonym Alwyn had already used on folklore and evermore — with Jack Antonoff co-producing. He explained the name\'s origin on The Kelly Clarkson Show: "It was a combination of William... my great-grandfather — who I actually never met — [who] was a composer. He wrote a lot of classical music, and he wrote a lot of film scores. And then Bowery is the area in New York that I spent a lot of time in when I first moved over there."\n\nHe and Taylor chose to write under a shared pseudonym, he said, "so the people, first and foremost, would listen to the music first before dissecting the fact that we did it together." The song itself leans into small, sheltered domestic memories — a pebble collected on a trip to Wicklow, quiet moments at home — as a refuge from "cunning" outsiders and her own critical inner voice.',
        sources: [
          {
            outlet: 'The Things',
            url: 'https://www.thethings.com/why-did-taylor-swift-credit-joe-alwyn-as-william-bowery/',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Sweet_Nothing_(Taylor_Swift_song)',
          },
        ],
        // Real-photo pass (2026-07-09): "Sweet Nothing" has no single artwork; a
        // freely licensed photo of the credited co-writer, clearly labeled, is
        // the honest visual for a story about the William Bowery pseudonym.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Joe_Alwyn_at_the_2022_TIFF_Premiere_of_Catherine_Called_Birdy_%2852358881656%29_%28cropped%29.jpg/960px-Joe_Alwyn_at_the_2022_TIFF_Premiere_of_Catherine_Called_Birdy_%2852358881656%29_%28cropped%29.jpg',
            credit: 'GabboT, CC BY-SA 2.0, via Wikimedia Commons',
            caption: 'Joe Alwyn — the "William Bowery" of the credits — at the Toronto International Film Festival in September 2022, weeks before Midnights arrived.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2022,
      month: 10,
      category: 'music',
      title: 'A Sounwave beat, finished in a day, becomes "Karma"',
      snippet:
        'A track producer Sounwave built with Keanu Beats and passed to Jack Antonoff was, in Sounwave\'s words, "too perfect not to send" to Taylor — she recorded her vocals and finished the song the next day.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Karma_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Taylor described her state of mind writing it in an Apple Music interview: "I wrote \'Karma\' from a perspective of feeling really happy, really proud of the way your life is, feeling like this must be a reward for doing stuff right."\n\nSeven months after release, she brought the song full circle: Ice Spice\'s team reached out asking to collaborate, Taylor said yes, and on May 26, 2023 — the Eras Tour\'s first New Jersey show — a remix dropped with a new Ice Spice verse written with RiotUSA, premiered live at MetLife Stadium.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Karma_(Taylor_Swift_song)' },
        ],
        // Real-photo pass (2026-07-09): the remix single artwork from Wikipedia's
        // stable upload.wikimedia.org copy. Verified HTTP 200 + image/png.
        // Photo-enrichment pass (2026-07-18): added the freely licensed Arlington
        // frame of "Karma" closing the Eras Tour show (curl 200 + image/jpeg,
        // vision-confirmed: the iridescent Karma jacket over the sequined
        // bodysuit); focal points set per image by viewing.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/b/ba/Taylor_Swift_feat_Ice_Spice_-_Karma.png',
            credit: 'Republic Records',
            caption: 'Artwork for the "Karma" remix featuring Ice Spice — the May 2023 full-circle ending to the Sounwave beat\'s one-day story.',
            kind: 'archival',
            focalPoint: '47% 70%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Taylor_Swift_Eras_Tour_-_Arlington_TX_20230331_-_Karma.jpg/960px-Taylor_Swift_Eras_Tour_-_Arlington_TX_20230331_-_Karma.jpg',
            credit: 'Ronald Woan, CC BY-SA 2.0, via Wikimedia Commons',
            caption: 'The one-day song became the whole show\'s closer: "Karma" ending an Eras Tour night in Arlington, March 2023.',
            kind: 'archival',
            focalPoint: '42% 36%',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 11,
      day: 29,
      category: 'music',
      title: 'Lana Del Rey reveals how much of "Snow on the Beach" is actually her',
      snippet:
        'She matched Taylor\'s vocals so closely on the original mix that "you would never even know I was completely all over that first song" — and didn\'t realize she was the track\'s only featured artist until after it came out.',
      sourceUrl:
        'https://www.rollingstone.com/music/music-news/lana-del-rey-taylor-swift-snow-on-the-beach-interview-1234892236/',
      thumbnailUrl: null,
      moment: {
        context:
          'Del Rey, who co-wrote the song with Taylor and Jack Antonoff: "I am all over the first version of \'Snow on the Beach.\' I layer and match her vocals perfectly, so you would never even know that I was completely all over that first song... I had no idea I was the only feature [on that song]. Had I known, I would have sung the entire second verse like she wanted."\n\nTaylor has described the song\'s concept as "falling in love with someone at the same time as they\'re falling in love with you... this cataclysmic, fated moment where you realize someone feels exactly the same way that you feel." A "More Lana Del Rey" version, with Del Rey singing the full second verse, followed as part of the Til Dawn Edition in May 2023.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/lana-del-rey-taylor-swift-snow-on-the-beach-interview-1234892236/',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Snow_on_the_Beach' },
        ],
        // Real-photo pass (2026-07-09): no free image of the two together exists;
        // a freely licensed contemporaneous photo of the track's only featured
        // artist, clearly labeled, is the honest visual.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Lana_del_rey_MITA.jpg_%28cropped%29.jpg/960px-Lana_del_rey_MITA.jpg_%28cropped%29.jpg',
            credit: 'Raphaelp18, CC BY-SA 4.0, via Wikimedia Commons',
            caption: 'Lana Del Rey greeting fans at MITA Festival in São Paulo, June 2023 — the year her buried "Snow on the Beach" vocals finally got their fuller version.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 12,
      day: 6,
      category: 'music',
      title: 'The Phantom Thread ending that inspired "Mastermind"',
      snippet:
        'A rewatch of Paul Thomas Anderson\'s Phantom Thread gave her the idea for a closing track that owns up to orchestrating her own love story — reclaiming a word she says has been "thrown at me like a dagger."',
      sourceUrl: 'https://www.bustle.com/entertainment/taylor-swift-mastermind-inspired-by-phantom-thread',
      thumbnailUrl: null,
      moment: {
        context:
          'In her December 2023 Time Person of the Year cover interview, Taylor traced "Mastermind" back to the twist ending of Phantom Thread: "Wouldn\'t it be fun to have a lyric about being calculated..."\n\nOn the "calculated" label she\'s carried for years, she said: "It\'s something that\'s been thrown at me like a dagger, but now I take it as a compliment." Antonoff co-wrote and co-produced the track with her, closing out the standard edition of Midnights.',
        sources: [
          {
            outlet: 'Bustle',
            url: 'https://www.bustle.com/entertainment/taylor-swift-mastermind-inspired-by-phantom-thread',
          },
          { outlet: 'Songfacts', url: 'https://www.songfacts.com/facts/taylor-swift/mastermind' },
        ],
        // Real-photo pass (2026-07-09): album artwork (the track closes the
        // standard edition); Wikipedia's stable copy, verified HTTP 200 + image/png.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Midnights_-_Taylor_Swift.png',
            credit: 'Republic Records',
            caption: 'Midnights — "Mastermind" closes the standard edition, the last move of the album\'s chessboard.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2022,
      month: 11,
      day: 5,
      category: 'business',
      significance: 'defining', // a chart feat only she has ever pulled off, then repeated with TLOAS (docs/decisions.md, 2026-07-19)
      // Cross-link (candidate #1536, 2026-07-26): the No. 1 single that led the
      // all-top-10 week — the "Anti-Hero" dominates page tells that single's story.
      relatedIds: [
        'moment:vault-tloas-all-12-tracks-debut-as-the-hot-100s-entire-top-12',
        'moment:vault-midnights-anti-hero-dominates',
      ],
      title: 'Every spot in the Hot 100 top 10, all at once',
      snippet:
        'The week "Anti-Hero" debuted at No. 1, the other nine Midnights tracks filled out the rest of the top 10 — the first time in Hot 100 history one artist held the entire top 10 in a single week.',
      sourceUrl: 'https://www.billboard.com/music/chart-beat/taylor-swift-all-hot-100-top-10-anti-hero-1235163664/',
      thumbnailUrl: null,
      moment: {
        context:
          'On the chart dated Nov. 5, 2022, Taylor became, in Billboard\'s words, "the first artist to claim the survey\'s entire top 10 in a single frame" in the Hot 100\'s 64-year history, passing Drake, who\'d held nine of the top 10 in September 2021. The sweep also passed both Drake and the Beatles — each of whom had managed only the top five, in 2021 and on the chart dated April 4, 1964 — for the most titles ever stacked at the top of the chart in a single week.\n\nAll ten belonged to Midnights, and they were only the crest: all 20 of the album\'s songs (13 from the standard edition, seven from the 3am Edition) charted on the Hot 100 that week. "Anti-Hero" led at No. 1 on 59.7 million U.S. streams — Taylor\'s ninth career Hot 100 No. 1 — trailed by "Lavender Haze" (41.4M streams), "Maroon" (37.6M), "Snow on the Beach" feat. Lana Del Rey (37.2M), "Midnight Rain" (36.9M), "Bejeweled" (35.5M), "Question...?" (31M), "You\'re on Your Own, Kid" (34.1M), "Karma" (33M) and "Vigilante Shit" (32.2M). Every one was a fresh, streaming-driven debut before radio had caught up; sales reshuffled the lower rungs ("Question...?" sold 21,400, "Bejeweled" 16,100) but streams set the order.\n\nThe takeover made Midnights the first album ever to hold ten Hot 100 top 10s at once — one better than the nine from Drake\'s Certified Lover Boy in 2021 — and lifted Taylor to 40 career top 10s, the most of any woman (past Madonna\'s 38) and behind only Drake\'s 59. It landed the same week Midnights opened at No. 1 on the Billboard 200 with the biggest week for any album in seven years, rewriting the top of the songs and albums charts in one frame. Taylor, watching it happen, wrote that she was "in shambles."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-all-hot-100-top-10-anti-hero-1235163664/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-charts-20-midnights-tracks-billboard-hot-100-1235163740/',
          },
          {
            outlet: 'Entertainment Tonight (via AOL)',
            url: 'https://www.aol.com/taylor-swift-monopolizes-top-10-194834436.html',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Anti-Hero_(song)' },
        ],
        // Real-photo pass (2026-07-09): the No. 1 single's artwork; Wikipedia's
        // stable copy (same file the Anti-Hero video item uses), verified 200.
        // Photo-enrichment pass (2026-07-18): added the official Anti-Hero video
        // frame from YouTube's own CDN (the same host prior runs used for
        // official-video stills). Curl 200 + image/jpeg, 1280x720,
        // vision-confirmed as the video's kitchen-hallway opening frame.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Taylor_Swift_-_Anti-Hero.png',
            credit: 'Republic Records',
            caption: 'Single artwork for "Anti-Hero," which led the historic all-Taylor top 10 from No. 1.',
            kind: 'archival',
            focalPoint: '55% 48%',
          },
          {
            url: 'https://i.ytimg.com/vi/b1kbLwvqugk/maxresdefault.jpg',
            credit: 'Taylor Swift / Republic Records, via YouTube',
            caption: 'A frame from the self-directed "Anti-Hero" video — the No. 1 that led an all-Taylor top 10, with 59.7 million streams in the chart week.',
            kind: 'archival',
            focalPoint: '50% 25%',
          },
          // Photo pass 2026-07-19 (bulk-to-6+, docs/decisions.md): 2 more,
          // from official videos of other songs named in this item's own
          // list. oEmbed-verified both belong to @TaylorSwift's channel.
          {
            url: 'https://i.ytimg.com/vi/b7QlX3yR2xs/maxresdefault.jpg',
            credit: 'Taylor Swift / Republic Records, via YouTube',
            caption: 'A frame from the official "Bejeweled" video — one of the nine other tracks that filled out the historic all-Taylor top 10.',
            kind: 'archival',
            // Centered close-up; her face is upper-center against the dark,
            // glittering backdrop.
            focalPoint: '50% 26%',
          },
          {
            url: 'https://i.ytimg.com/vi/Uoey4W_3bos/maxresdefault.jpg',
            credit: 'Taylor Swift / Republic Records, via YouTube',
            caption: 'The title card for the official "Vigilante Shit" lyric video, another of the nine.',
            kind: 'archival',
            // Letterboxed title card: the "Vigilante Shit" text is the only
            // subject and sits in the upper-left; bias the crop left and high.
            focalPoint: '38% 26%',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 6,
      day: 10,
      category: 'business',
      title: 'Midnights knocks Morgan Wallen off the top of the chart',
      snippet:
        "New deluxe editions — Til Dawn, Late Night, and a Karma remix with Ice Spice — sent Midnights back to No. 1 in June 2023, ending Morgan Wallen's 12-week reign, the longest run for a country album in over 30 years.",
      sourceUrl:
        'https://www.billboard.com/music/chart-beat/taylor-swift-midnights-back-number-one-billboard-200-til-dawn-late-nights-1235345655/',
      thumbnailUrl: null,
      moment: {
        context:
          'On May 26, 2023, Taylor released two new deluxe versions — the 23-track Til Dawn Edition (including the Ice Spice "Karma" remix) and a 21-track Late Night Edition with the previously unreleased "You\'re Losing Me" — plus a new vinyl variant.\n\nIt was enough to send Midnights back to No. 1 on the chart dated June 10, 2023, halting One Thing at a Time\'s run at the top and handing Midnights its sixth (non-consecutive) week at No. 1 on 282,000 equivalent album units, the second-largest album week of 2023 to that point.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-midnights-back-number-one-billboard-200-til-dawn-late-nights-1235345655/',
          },
        ],
        // Real-photo pass (2026-07-09): album artwork; Wikipedia's stable copy,
        // verified HTTP 200 + image/png this session.
        // Photo-enrichment pass (2026-07-18): added a freely licensed frame of
        // the Midnights set (Lavender Haze clouds) at U.S. Bank Stadium,
        // June 24, 2023 — the same month the deluxe editions put the album back
        // at No. 1. Curl 200 + image/jpeg, vision-confirmed (cloud props,
        // stadium signage visible).
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Midnights_-_Taylor_Swift.png',
            credit: 'Republic Records',
            caption: 'Midnights — back at No. 1 in June 2023, eight months after release, on the strength of the Til Dawn and Late Night deluxe editions.',
            kind: 'archival',
            focalPoint: '50% 52%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Eras_Tour_-_Minneapolis%2C_Minnesota_-_Midnights_act_1.jpg/960px-Eras_Tour_-_Minneapolis%2C_Minnesota_-_Midnights_act_1.jpg',
            credit: 'Michael Hicks, CC BY 2.0, via Wikimedia Commons',
            caption: 'The Midnights act at Minneapolis\' U.S. Bank Stadium in June 2023 — the album onstage the same month the deluxe drops sent it back to No. 1.',
            kind: 'archival',
            focalPoint: '53% 58%',
          },
        ],
      },
    },

    // --- Deep timeline fill (2026-07-08, content/deep-d): rollout, records,
    // Eras Tour milestones, and era-spanning moments the corpus was missing.
    // Every claim verified against its cited source(s) this session; new items
    // carry the audit's additive provenance fields (slug + publisher/
    // source_type/accessed_at/reliability_score) alongside legacy {outlet,url}.
    {
      slug: 'midnights-mayhem-with-me',
      year: 2022,
      month: 10,
      day: 7,
      category: 'release',
      title: 'Midnights Mayhem with Me: a bingo cage announces the tracklist',
      snippet:
        'No cryptic clues this time — a TikTok series where a bingo cage picked the order and she announced each track title into a vintage phone. Thirteen episodes, capped by a middle-of-the-night finale blitz.',
      sourceUrl: 'https://www.elitedaily.com/entertainment/taylor-swift-midnights-mayhem-with-me-tracklist-tiktoks-explained',
      thumbnailUrl: null,
      moment: {
        context:
          'The mechanic was pure chance theater: a spinning bingo cage held 13 ping-pong balls numbered 1-13, one per track. Taylor drew a ball, then read that track\'s title into a red rotary phone — held upside-down in episodes 2 and 6, a wink fans caught. The opener on Sept. 21, 2022 drew number 13: "Mastermind," the album\'s closer, revealed first.\n\nEpisodes dropped Monday, Wednesday and Friday — Meredith the cat cameoed in episode 2 — until the finale. On the night of Oct. 7, 2022 she blitzed the rest, releasing the last episodes an hour apart from midnight, and the full order landed: "Lavender Haze," "Maroon," "Anti-Hero," "Snow on the Beach" (with Lana Del Rey), "You\'re on Your Own, Kid," "Midnight Rain," "Question...?," "Vigilante Shit," "Bejeweled," "Labyrinth," "Karma," "Sweet Nothing," and "Mastermind."\n\nIt flipped her usual Easter-egg hunt on its head: instead of fans decoding clues, a bingo cage decided which title she revealed next — chance, not cryptography, running the rollout. Fans still suspected a mastermind behind the "random" draw — "Mastermind" itself surfacing first fueled the joke — though Taylor never confirmed it was staged; the golden cage later got an afterlife as an official-store "Bingo Roller" ornament.',
        sources: [
          {
            outlet: 'Elite Daily',
            url: 'https://www.elitedaily.com/entertainment/taylor-swift-midnights-mayhem-with-me-tracklist-tiktoks-explained',
            source_title: "Taylor Swift's 'Midnights Mayhem With Me' Tracklist TikToks, Explained",
            publisher: 'Elite Daily',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          // Depth pass (ledger #1293, 2026-07-24): the first-ball "Mastermind"
          // reveal and the ping-pong-ball/rotary-phone mechanic; per-episode
          // reveal order.
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-midnights-song-title-track-13-mastermind-1235142141/',
            source_title: "Taylor Swift Reveals First 'Midnights' Song Title: 'Mastermind'",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'iHeartRadio',
            url: 'https://www.iheart.com/content/2022-09-26-every-midnights-track-taylor-swift-has-revealed-so-far/',
            source_title: "Every 'Midnights' Track Taylor Swift Has Revealed So Far",
            publisher: 'iHeartRadio',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          {
            outlet: 'Taylor Swift on TikTok',
            url: 'https://www.tiktok.com/@taylorswift/video/7151677137337208110',
            source_title: 'Our LAST EPISODE! The season finale of Midnights Mayhem with Me',
            publisher: 'Taylor Swift (official TikTok)',
            source_type: 'social',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          // Depth pass (ledger #1293, 2026-07-24): the draw mechanic (numbered
          // balls + red phone, upside-down in eps 2/6), the Sept. 21 first reveal
          // (track 13 "Mastermind"), the Mon/Wed/Fri cadence and Oct. 7 finale,
          // and the full revealed track order.
          {
            outlet: 'TODAY',
            url: 'https://www.today.com/popculture/music/taylor-swift-midnights-tracklist-song-names-rcna50738',
            source_title: "'Midnights' tracklist: Song names of Taylor Swift's new album",
            publisher: 'TODAY',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Midnights',
            source_title: 'Midnights',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-24',
            reliability_score: 2,
          },
          {
            outlet: 'Taylor Swift Official Store',
            url: 'https://store.taylorswift.com/products/midnights-mayhem-with-me-bingo-roller-ornament',
            source_title: 'Midnights Mayhem With Me Bingo Roller Ornament',
            publisher: 'Taylor Swift Official Store',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
        ],
        // Real-photo pass (2026-07-09): album artwork (the tracklist being
        // announced); Wikipedia's stable copy, verified HTTP 200 + image/png.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Midnights_-_Taylor_Swift.png',
            credit: 'Republic Records',
            caption: 'The Midnights cover — the 13-track list a bingo cage announced, one title at a time, on TikTok.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'bejeweled-video-easter-eggs',
      // Cross-link (ledger #1316 Q8 / crosslink-candidate): the video's whole
      // thesis is the Speak Now prediction; thread it to the payoff — the May
      // 2023 onstage announcement of Speak Now (Taylor's Version) in Nashville.
      relatedIds: [
        'moment:vault-midnights-speak-now-taylors-version-announced-onstage-in-nashville',
      ],
      year: 2022,
      month: 10,
      day: 25,
      category: 'music',
      title: '"Bejeweled" arrives with a "psychotic amount" of easter eggs',
      snippet:
        'Her warning, not ours. Laura Dern as the wicked stepmother, HAIM as the stepsisters, an elevator button for floor three glowing purple — the Cinderella video that quietly announced Speak Now was next.',
      sourceUrl: 'https://www.goodmorningamerica.com/culture/story/watch-taylor-swifts-music-video-bejeweled-off-album-92029478',
      thumbnailUrl: null,
      moment: {
        context:
          'Taylor wrote and directed the video — a comic Cinderella riff shot by cinematographer Rina Yang — and stacked the cast like a wink: Laura Dern as the wicked stepmother, the three HAIM sisters as stepsisters, burlesque legend Dita Von Teese as the "fairy goddess" in the martini glass, producer Jack Antonoff as a blink-and-miss Prince Charming, and makeup artist Pat McGrath in the transformation scene. Von Teese\'s martini-glass turn was a deliberate homage to her signature act — she used glasses from her own show and taught Taylor the routine herself, later thanking Taylor for "acknowledging burlesque, an American art form."\n\nIts self-described "psychotic amount" of easter eggs faced a single direction — Speak Now. Dern\'s "Speak not, you tacky, tired wench," an "Enchanted" instrumental at the open, a floor-three elevator button glowing the purple of the Speak Now cover (her third album), an "SN" hair clip, and an orchestral "Long Live" over the closing castle. The video even dropped Oct. 25, 2022 — the calendar date Speak Now first arrived in 2010. Taylor framed the whole clip as a Midnights-driven fairy tale ("where do we hear about midnights a lot? … the Cinderella fairy tale … what if we did a little twist"), and fans catalogued still more clues — the recurring number three (her third album), heart-shaped "S" and "N" hair clips, and a closing balcony echoing the Speak Now tour set.\n\nSwift had told Jimmy Fallon to expect that egg pile, so the density was deliberate; whether Speak Now specifically was the target stayed fan inference — a call the fandom banked and the May 2023 Nashville announcement of Speak Now (Taylor\'s Version) confirmed.',
        sources: [
          {
            outlet: 'Good Morning America',
            url: 'https://www.goodmorningamerica.com/culture/story/watch-taylor-swifts-music-video-bejeweled-off-album-92029478',
            source_title: "Taylor Swift's 'Bejeweled' music video features Laura Dern, Dita Von Teese and a 'psychotic amount' of Easter eggs",
            publisher: 'ABC News (Good Morning America)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Newsweek',
            url: 'https://www.newsweek.com/taylor-swift-bejeweled-music-vieo-easter-eggs-cast-haim-laura-dern-1754441',
            source_title: "All of the Taylor Swift 'Bejeweled' music video easter eggs and cast",
            publisher: 'Newsweek',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          // Depth pass (ledger #1316, 2026-07-24): the director credit and the
          // fuller cast (Von Teese as fairy godmother, Antonoff as Prince
          // Charming, Pat McGrath); the additional Speak Now easter eggs; and
          // the deliberate-eggs-vs-fan-inference distinction.
          {
            outlet: 'IndieWire',
            url: 'https://www.indiewire.com/features/general/taylor-swift-bejeweled-video-laura-dern-alana-haim-watch-1234775782/',
            source_title: "Taylor Swift's 'Bejeweled' Video Stars Laura Dern, Alana Haim",
            publisher: 'IndieWire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-bejeweled-music-video-1235160502/',
            source_title: "Taylor Swift's 'Bejeweled' Video: Watch",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'NME',
            url: 'https://www.nme.com/news/music/dita-von-teese-says-teaching-taylor-swift-the-bejeweled-martini-glass-routine-was-the-best-experience-3567738',
            source_title: "Dita Von Teese on teaching Taylor Swift the 'Bejeweled' martini-glass routine",
            publisher: 'NME',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Revolution Pictures',
            url: 'https://revolutionpictures.com/featured/taylorswift-antihero-bejeweled/',
            source_title: 'Taylor Swift — Anti-Hero / Bejeweled (production credits)',
            publisher: 'Revolution Pictures',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): the single's artwork; Wikipedia's stable
        // copy, verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/7/7b/Taylor_Swift_-_Bejeweled.png',
            credit: 'Republic Records',
            caption: 'Single artwork for "Bejeweled," whose video carried the self-described "psychotic amount" of easter eggs.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'amas-2022-six-for-six',
      significance: 'notable', // a perfect nomination-to-win record and a real 40+ career-wins milestone (docs/decisions.md, 2026-07-19)
      // Cross-links added 2026-07-21 (ledger #1063): the presale meltdown five
      // days earlier (the page's own subtext) and the All Too Well short film —
      // the video that won Favorite Music Video here, plus its later Grammy win.
      relatedIds: [
        'moment:vault-midnights-the-presale-that-broke-ticketmaster-and-set-a-sales-record-a',
        'moment:vault-evermore-all-too-well-the-short-film-premieres-she-wrote-it-she-direc',
        'moment:vault-midnights-all-too-well-the-short-film-wins-the-grammy-that-makes-her-a',
      ],
      year: 2022,
      month: 11,
      day: 20,
      category: 'business',
      title: 'Six-for-six at the AMAs, and past 40 career wins',
      snippet:
        'Artist of the Year for the seventh time, plus wins for Red (Taylor\'s Version) and the All Too Well short film — bringing her career total to a record 40 American Music Awards.',
      sourceUrl: 'https://www.rollingstone.com/music/music-news/taylor-swift-sweeps-2022-amas-1234634191/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Nov. 20, 2022 sweep at the Microsoft Theater covered favorite female pop artist, favorite female country artist, favorite pop album, favorite country album, and favorite music video — a re-recorded 2012 album and its ten-minute short film winning a full month into the Midnights era, alongside a seventh Artist of the Year. Accepting, she pointed the credit outward: "I have the fans to thank, essentially, for my happiness," signing off with "thank you, underlined with 13 exclamation points."\n\nThe re-record project got its own acceptance-speech paragraph — "I cannot tell you how much my re-recorded albums mean to me" — and the six-for-six night pushed her career total to 40 American Music Awards, extending her lead as the most-awarded artist in the show\'s history. The timing added subtext: the sweep landed five days after the Eras Tour presale had melted Ticketmaster down.\n\nEach trophy had a work behind it: Red (Taylor\'s Version) took both album categories, favorite pop album and favorite country album, while All Too Well: The Short Film — which she wrote and directed — won favorite music video; the two favorite-female artist prizes and the seventh Artist of the Year completed a literal six-for-six, six nominations converted to six wins. She was not billed to appear and did not perform, arriving as a surprise guest to collect the awards in a gold beaded halter jumpsuit by The Blonds, styled by Joseph Cassell. She had first passed Michael Jackson\'s all-time record of 24 at the 2019 ceremony, where she was also named Artist of the Decade; this sweep carried the record to 40, and with no AMAs held in 2023 or 2024 it stood unchallenged until the show returned in 2025.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-sweeps-2022-amas-1234634191/',
            source_title: 'Taylor Swift Sweeps 2022 AMAs With Six of Six Wins',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Deadline',
            url: 'https://deadline.com/2022/11/american-music-awards-winners-list-taylor-swift-scores-artist-of-the-year-1235178280/',
            source_title: 'American Music Awards 2022 Winners List: Taylor Swift Reigns, Scores Artist Of The Year Prize',
            publisher: 'Deadline',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/awards/2022-amas-winners-list-1235174393/',
            source_title: 'Here Are All the 2022 AMAs Winners',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'WWD',
            url: 'https://wwd.com/fashion-news/fashion-scoops/taylor-swift-american-music-awards-2022-gold-jumpsuit-look-1235425904/',
            source_title: 'Taylor Swift Shines in Gold Beaded Jumpsuit at American Music Awards 2022',
            publisher: 'WWD',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-ama-singer-beats-michael-jackson-for-most-american-music-awards-2019-performance-artist-of-the-decade/',
            source_title: 'Taylor Swift beats Michael Jackson for most American Music Awards, receives Artist of the Decade',
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): Rolling Stone's lead photo of the night,
        // hotlinked per the 2026-07-09 relaxed media policy; credit per the
        // article's own photo credit. Verified HTTP 200 + image/jpeg.
        // Photo-enrichment pass (2026-07-18): added Deadline's press-room frame —
        // the gold beaded halter with all six trophies in hand, distinct
        // from the onstage acceptance shot. Curl 200 + image/jpeg,
        // Attribution fix (2026-07-21, ledger #1063): the gown was miscaptioned
        // "Zuhair Murad" in this note — it is The Blonds, styled by Joseph
        // Cassell (WWD/PopSugar/Red Carpet Fashion Awards). Corrected here.
        // vision-confirmed (AMA/ABC press wall, six pyramids in her arms).
        photos: [
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2022/11/Taylor-Artist-1443142818.jpg?w=1600&h=900&crop=1',
            credit: 'Kevin Winter/Getty Images via Rolling Stone',
            caption: 'Taylor accepting at the 2022 American Music Awards in Los Angeles, where she went six-for-six.',
            kind: 'primary',
            focalPoint: '50% 15%',
          },
          {
            url: 'https://deadline.com/wp-content/uploads/2022/11/taylor-swift-american-music-awards-2022.jpg?w=1000',
            credit: 'Deadline',
            caption: 'All six of the night\'s trophies at once in the AMAs press room — career total: a record 40.',
            kind: 'primary',
            focalPoint: '50% 17%',
          },
        ],
      },
    },
    {
      slug: 'eras-tour-presale-meltdown',
      significance: 'defining', // reshaped the national conversation about ticketing and market power (docs/decisions.md, 2026-07-19)
      relatedIds: [
          'moment:vault-midnights-six-for-six-at-the-amas-and-past-40-career-wins',
        'moment:vault-midnights-the-eras-tour-kicks-off-in-glendale',
        'moment:vault-midnights-the-senate-holds-a-ticketmaster-hearing-in-swiftie-puns',
      ],
      year: 2022,
      month: 11,
      day: 15,
      category: 'business',
      title: 'The presale that broke Ticketmaster — and set a sales record anyway',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-mid-1c", label: "Ticketmaster presale", kind: "business" },
      snippet:
        '2.4 million tickets in one day, the most ever sold for an artist — while millions more fans sat in crashed queues until Ticketmaster canceled the public on-sale entirely.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift%E2%80%93Ticketmaster_controversy',
      thumbnailUrl: null,
      moment: {
        context:
          'The TaylorSwiftTix presale, powered by Verified Fan, drew more than 3.5 million registrations — the largest in Ticketmaster\'s history. About 1.5 million fans were sent codes for the 52 shows; the other 2 million were waitlisted. When it opened Nov. 15, 2022, the site buckled within the hour under what Ticketmaster called a "staggering number of bot attacks" and 3.5 billion system requests — four times its prior peak. It still moved more than 2 million tickets that day (2.4 million across all presales), the most ever sold for one artist in a single day.\n\nOn Nov. 17 the company scrapped the Nov. 18 general public sale outright, citing "extraordinarily high demands" and too little remaining inventory; shut-out fans turned to resale, where seats were listed as high as $22,500–$28,350 on StubHub.\n\nTaylor answered Nov. 18: it was "excruciating for me to just watch mistakes happen with no recourse," and "we asked them, multiple times, if they could handle this kind of demand and we were assured they could." The reckoning outlived the tour. Fans sued in Los Angeles in December 2022 for fraud and antitrust; a judge dismissed the fraud claims but let the antitrust case proceed, and in 2024 the Ninth Circuit refused to push those claims into arbitration, keeping them in court. The bigger case grew from the two-year probe the presale set off: in May 2024 the Justice Department and more than 30 states sued to break up Live Nation-Ticketmaster. It reached trial in 2026 — the DOJ settled in March (a 15% fee cap, rival ticketing at Live Nation\'s amphitheaters, a $280M fund), while a coalition of 34 states pressed on and won an April 2026 jury verdict finding the companies liable on every antitrust count. The outcry drove reform too: the FTC\'s "junk fees" rule banning hidden drip pricing took effect in May 2025, and the TICKET Act cleared the House 409-15 that April, still awaiting the Senate.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Taylor_Swift%E2%80%93Ticketmaster_controversy',
            source_title: 'Taylor Swift–Ticketmaster controversy',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'ABC News',
            url: 'https://abcnews.com/GMA/Culture/taylor-swift-fans-sue-ticketmaster-tour-presale-meltdown/story?id=94459600',
            source_title: 'Taylor Swift fans sue Ticketmaster over tour presale meltdown',
            publisher: 'ABC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          // Depth pass (ledger #1302, 2026-07-24): registration/supply and
          // system-request figures from Ticketmaster's own onsale explainer;
          // Swift's statement, the cancellation and resale prices, the
          // litigation, the DOJ breakup suit, and the reform legislation.
          {
            outlet: 'Ticketmaster',
            url: 'https://business.ticketmaster.com/press-release/taylor-swift-the-eras-tour-onsale-explained/',
            source_title: 'Taylor Swift | The Eras Tour Onsale Explained',
            publisher: 'Ticketmaster (Live Nation)',
            source_type: 'primary',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2022/music/news/taylor-swift-addresses-eras-tour-ticketmaster-fiasco-1235436036/',
            source_title: "Taylor Swift on Ticketmaster Fiasco: 'Excruciating for Me to Watch'",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-eras-tour-tickets-resale-for-more-than-10-times-previous-tours/',
            source_title: 'Taylor Swift Eras Tour tickets are fetching more than $20,000',
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/caileygleeson/2024/05/23/doj-sues-ticketmaster-owner-live-nation/',
            source_title: 'DOJ Sues Ticketmaster And Live Nation In Latest Antitrust Suit',
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-fans-win-eras-tour-ticketmaster-lawsuit/',
            source_title: 'Taylor Swift Fans Score Win in Eras Tour Ticketmaster Lawsuit',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2024/music/news/ticket-act-passes-house-of-representatives-1236005647/',
            source_title: 'TICKET Act Passes House of Representatives to Create Transparency in Pricing',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Federal Trade Commission',
            url: 'https://www.ftc.gov/news-events/news/press-releases/2024/12/federal-trade-commission-announces-bipartisan-rule-banning-junk-ticket-hotel-fees',
            source_title: 'Federal Trade Commission Announces Bipartisan Rule Banning Junk Ticket and Hotel Fees',
            publisher: 'Federal Trade Commission',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          // Depth pass (ledger #1371, 2026-07-24): the 2026 antitrust outcome — the
          // DOJ settlement and the states' jury verdict — and the mass-arbitration
          // ruling that kept the fan suit in court.
          {
            outlet: 'NPR',
            url: 'https://www.npr.org/2026/03/09/nx-s1-5742433/live-nation-ticketmaster-doj-antitrust-case',
            source_title: 'Live Nation and Justice Department reach settlement in antitrust case',
            publisher: 'NPR',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'New York State Attorney General',
            url: 'https://ag.ny.gov/press-release/2026/attorney-general-james-and-coalition-states-win-trial-against-live-nation-and',
            source_title: 'Attorney General James and Coalition of States Win Trial Against Live Nation and Ticketmaster',
            publisher: 'Office of the New York State Attorney General',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
        ],
        // Real-photo pass (2026-07-09): the official tour poster fans were queuing
        // for; Wikipedia's stable copy, verified HTTP 200 + image/png.
        // Photo-enrichment audit (2026-07-18): stays at one image deliberately —
        // no outlet-CDN-verifiable photo depicts the presale itself (coverage
        // used watermarked Getty comps or off-hook file photos; ABC's article
        // image is a 2019 AMAs performance shot). Focal point set by viewing.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/7/75/The_Eras_Tour_Poster_%28updated%29.png',
            credit: 'TAS Rights Management',
            caption: 'The official Eras Tour poster — the tickets 2.4 million people managed to buy in one day, and millions more never got the chance to.',
            kind: 'archival',
            focalPoint: '50% 40%',
          },
          // Photo pass 2026-07-19 (bulk-to-6+, docs/decisions.md): re-checked
          // per Joey's direction — the presale itself still has no
          // photographable moment (confirmed again), but the Washington
          // fallout this item's own context names does. Kept light since a
          // separate dedicated item covers the hearing itself in full.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Hearing_Room_in_the_Hart_Building.jpg',
            focalPoint: '50% 40%',
            credit: 'Architect of the Capitol (public domain)',
            caption: 'A Hart Senate Office Building hearing room — where the Judiciary Committee questioned Ticketmaster\'s parent company two months later.',
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Alexandria_Ocasio-Cortez_Official_Portrait_%281%29.jpg',
            focalPoint: '48% 24%',
            credit: 'Official congressional portrait (public domain)',
            caption: 'Rep. Alexandria Ocasio-Cortez, one of the lawmakers who publicly weighed in on the ticketing meltdown.',
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/dc/US_Department_of_Justice.jpg',
            focalPoint: '38% 42%',
            credit: 'Bjoertvedt, Wikimedia Commons (CC BY-SA 3.0)',
            caption: 'The Department of Justice, which went on to sue Live Nation–Ticketmaster over market power the meltdown first put in the national spotlight.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      slug: 'ticketmaster-senate-hearing',
      // Cross-link (ledger #1394): the Nov. 2022 on-sale collapse this hearing
      // was convened to examine — the presale page links here, so close the loop.
      relatedIds: [
        'moment:vault-midnights-the-presale-that-broke-ticketmaster-and-set-a-sales-record-a',
      ],
      year: 2023,
      month: 1,
      day: 24,
      category: 'business',
      title: 'The Senate holds a Ticketmaster hearing, in Swiftie puns',
      snippet:
        'Senators quoted her lyrics while grilling Live Nation over the Eras Tour on-sale collapse — a three-hour bipartisan airing of the monopoly question, with Swifties rallying outside the Capitol.',
      sourceUrl: 'https://www.npr.org/2023/01/24/1150942804/taylor-swift-ticketmaster-senate-hearing-live-nation',
      thumbnailUrl: null,
      moment: {
        context:
          'The Jan. 24, 2023 Senate Judiciary hearing — "That\'s the Ticket" — put six witnesses before the committee: Live Nation president and CFO Joe Berchtold, the company under scrutiny; SeatGeek CEO Jack Groetzinger; independent promoter Jerry Mickelson of Jam Productions; the American Antitrust Institute\'s Kathleen Bradish; the James Madison Institute\'s Sal Nuzzo, the lone free-market voice; and singer-songwriter Clyde Lawrence, testifying as an artist squeezed by the fees. Berchtold apologized under oath — "We apologize to the fans. We apologize to Ms. Swift. We need to do better, and we will do better" — but pinned the meltdown on a bot "cyberattack" and argued that venues, not Ticketmaster, set the fees.\n\nThe senators weren\'t buying it, across party lines. Amy Klobuchar opened on consolidation people know "all too well" (the firm controls ~70% of major-venue ticketing plus much of the promotion pipeline); Richard Blumenthal told Live Nation to look in the mirror and say "I\'m the problem. It\'s me," calling the whole system "a monopolistic mess"; Mike Lee slipped in three lyrics ("a nightmare dressed like a daydream," "cheer captain… bleachers," "Karma\'s a relaxing thought"); John Kennedy skipped the puns for "I\'m not against big, but I am against dumb." Groetzinger\'s proposed fix was blunt — break up the Live Nation-Ticketmaster merger.\n\nOutside, roughly 40–50 fans organized by attorney Jennifer Kinder rallied (about 700 more on a TikTok livestream) with signs reading "Ticketswindle" and "your reputation has never been worse." The hearing had teeth: Klobuchar forwarded its evidence to the Justice Department and, with colleagues, introduced the Unlock Ticketing Markets Act and the bipartisan Fans First Act — groundwork for the DOJ\'s May 2024 antitrust suit to break up Live Nation.',
        sources: [
          {
            outlet: 'NPR',
            url: 'https://www.npr.org/2023/01/24/1150942804/taylor-swift-ticketmaster-senate-hearing-live-nation',
            source_title: "The Senate's Ticketmaster hearing featured plenty of Taylor Swift puns and protesters",
            publisher: 'NPR',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Time',
            url: 'https://time.com/6249730/ticketmaster-taylor-swift-hearing-congress/',
            source_title: "What Happened During Congress' Hearing on Ticketmaster and the Taylor Swift Concert Mess",
            publisher: 'Time',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-ticketmaster-senate-judiciary-committee-eras-tour/',
            source_title: "All the Taylor Swift references from the Senate's Ticketmaster hearing",
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          // Depth pass (ledger #1394, 2026-07-24): the six-witness panel, Berchtold's
          // sworn apology, the fuller pun roster, and the legislative/DOJ outcome.
          {
            outlet: 'U.S. Senate Judiciary Committee',
            url: 'https://www.rev.com/transcripts/senators-question-ticketmaster-over-monopoly-concerns-transcript',
            source_title: 'Senators Question Ticketmaster Over Monopoly Concerns — hearing transcript',
            publisher: 'Rev (hearing transcript)',
            source_type: 'primary',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/music/news/witnesses-ticketmaster-congressional-hearing-taylor-swift-1235499604/',
            source_title: 'Witnesses Announced for Ticketmaster Senate Hearing as Opposing Sides Square Off',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Office of Sen. Amy Klobuchar',
            url: 'https://www.klobuchar.senate.gov/public/index.cfm/news-releases?id=FDC64466-6E6D-4E91-B9A8-7FD18CC7C70A',
            source_title: "Klobuchar Statement on Justice Department's Antitrust Lawsuit Against Live Nation",
            publisher: 'U.S. Senator Amy Klobuchar (official)',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
        ],
        // Real-photo pass (2026-07-09): NPR's lead photo of the Swiftie protest
        // outside the hearing, hotlinked per the 2026-07-09 relaxed media policy.
        // Verified HTTP 200 + image/jpeg this session.
        photos: [
          {
            url: 'https://media.npr.org/assets/img/2023/01/24/gettyimages-1246499609_wide-b572c3a7dd2ccede1212035348be1254ff017d20.jpg?s=1400&c=85&f=jpeg',
            credit: 'Getty Images via NPR',
            caption: 'Swiftie protesters outside the U.S. Capitol on hearing day, Jan. 24, 2023, with lyric-pun signs aimed at Ticketmaster and Live Nation.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'speak-now-tv-announced-nashville',
      // Cross-link (candidate #1317): the "Bejeweled" video's easter eggs (three
      // stepsisters, an orchestral "Long Live") were read as pointing to Speak
      // Now as the next re-record — this is where that prediction paid off.
      relatedIds: [
        'moment:vault-midnights-bejeweled-arrives-with-a-psychotic-amount-of-easter-eggs',
      ],
      threadIds: ['taylors-version'],
      year: 2023,
      month: 5,
      day: 5,
      category: 'release',
      significance: 'notable', // a real re-record milestone, but one of four TV announcements this era rather than a career-wide top-40 event (docs/decisions.md, 2026-07-19)
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-mid-5", label: "Speak Now (TV) announced", kind: "album" },
      title: "Speak Now (Taylor's Version) announced onstage in Nashville",
      snippet:
        'Wristbands turned purple across Nissan Stadium as she revealed the next re-record from the stage — the album she wrote entirely alone at 18–20, coming back July 7.',
      sourceUrl: 'https://variety.com/2023/music/news/taylor-swift-speak-now-taylors-version-announced-during-concert-nashville-nissan-stadium-1235605123/',
      thumbnailUrl: null,
      moment: {
        context:
          'The May 5, 2023 reveal opened her three-night hometown Nashville stand: entry banners ran purple-hued all day before the announcement landed mid-show.\n\nHer post that night flagged the July 7 date as "just in time for July 9th, iykyk" — the "Last Kiss" date fans have kept as an anniversary since 2010.\n\nFans had already called it: the "Bejeweled" video, released five months earlier, was widely read as a coded Speak Now tease — the purple gown, a pointed third-floor elevator button, an Enchanted-coded ballroom — and the Nashville reveal confirmed the read (Bejeweled (song), Wikipedia).',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/music/news/taylor-swift-speak-now-taylors-version-announced-during-concert-nashville-nissan-stadium-1235605123/',
            source_title: "Taylor Swift Announces 'Speak Now (Taylor's Version)' Is Coming Next",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Bejeweled_(song)',
            source_title: 'Bejeweled (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-speak-now-taylors-version-release-date-1235322958/',
            source_title: "Taylor Swift 'Speak Now (Taylor's Version)' Release Date",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): the announced album's artwork; Wikipedia's
        // stable copy, verified HTTP 200 + image/png this session.
        // Photo-enrichment audit (2026-07-18): stayed at one image deliberately —
        // no verifiable photo of the May 5 Nissan Stadium announcement moment
        // exists on an outlet CDN or Commons (Variety's article image is a vinyl
        // product render that duplicates this cover). Focal point set by viewing.
        // Photo pass (2026-07-19, defining-events-31-50): 6 added — title
        // cards from the album's own re-recorded lyric video and five of its
        // six official From the Vault lyric videos on the @TaylorSwift
        // channel (oEmbed-verified each), the closest real visual record of
        // the album this announcement introduced.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/5/5b/Taylor_Swift_-_Speak_Now_%28Taylor%27s_Version%29.png',
            credit: 'Republic Records',
            caption: "The Speak Now (Taylor's Version) cover revealed alongside the onstage Nashville announcement.",
            kind: 'primary',
            focalPoint: '55% 30%',
          },
          {
            url: 'https://i.ytimg.com/vi/JlZnvyBqceY/maxresdefault.jpg',
            credit: 'Still from the official "Speak Now (Taylor\'s Version)" lyric video, Republic Records, via YouTube',
            caption: 'The title-track lyric video\'s paper-cut white rose title card.',
            kind: 'archival',
            focalPoint: '50% 45%',
          },
          {
            url: 'https://i.ytimg.com/vi/hMPK2vNXr-E/maxresdefault.jpg',
            credit: 'Still from the official "Electric Touch (From The Vault)" lyric video, Republic Records, via YouTube',
            caption: 'The "Electric Touch" title card, crediting Fall Out Boy\'s feature.',
            kind: 'archival',
            focalPoint: '50% 45%',
          },
          {
            url: 'https://i.ytimg.com/vi/V80A8qN4fR8/maxresdefault.jpg',
            credit: 'Still from the official "Castles Crumbling (From The Vault)" lyric video, Republic Records, via YouTube',
            caption: 'The "Castles Crumbling" title card, crediting Hayley Williams\'s feature.',
            kind: 'archival',
            focalPoint: '50% 60%',
          },
          {
            url: 'https://i.ytimg.com/vi/6-x1AlDudZw/maxresdefault.jpg',
            credit: 'Still from the official "Foolish One (From The Vault)" lyric video, Republic Records, via YouTube',
            caption: 'The "Foolish One" title card.',
            kind: 'archival',
            focalPoint: '65% 50%',
          },
          {
            url: 'https://i.ytimg.com/vi/osmzwWw4RYM/maxresdefault.jpg',
            credit: 'Still from the official "Timeless (From The Vault)" lyric video, Republic Records, via YouTube',
            caption: 'The "Timeless" title card, framed as a scalloped-edge vintage photograph.',
            kind: 'archival',
            focalPoint: '48% 45%',
          },
          {
            url: 'https://i.ytimg.com/vi/IYqgVYjN3Go/maxresdefault.jpg',
            credit: 'Still from the official "When Emma Falls in Love (From The Vault)" lyric video, Republic Records, via YouTube',
            caption: 'The "When Emma Falls in Love" title card.',
            kind: 'archival',
            focalPoint: '50% 50%',
          },
        ],
      },
    },
    {
      slug: 'i-can-see-you-video-lautner',
      // Cross-link (ledger #1450): the video premiered the night Speak Now (TV)
      // dropped — thread it to that release's record album-week moment.
      relatedIds: [
          'moment:vault-ttpd-show-100-at-anfield-and-the-news-the-tour-will-end',
        'moment:vault-midnights-speak-now-taylors-version-has-2023s-biggest-album-week-to-th',
      ],
      year: 2023,
      month: 7,
      day: 7,
      category: 'music',
      title: 'The "I Can See You" video reunites the Taylors',
      snippet:
        'Taylor Lautner backflipping through a heist to free her from a vault — she premiered the video live in Kansas City with Lautner, Joey King, and Presley Cash walking out onstage.',
      sourceUrl: 'https://variety.com/2023/music/news/taylor-swift-lautner-i-can-see-you-music-video-joey-king-presley-cash-1235664478/',
      thumbnailUrl: null,
      moment: {
        context:
          'Premiered July 7, 2023 at the first Kansas City show, hours after Speak Now (Taylor\'s Version) dropped. Taylor wrote and directed the vault-heist clip — shot in Liverpool in April 2023 at the Cunard Building, the Stanley Dock Tobacco Warehouse and the former NatWest bank, with cinematographer Jonathan Sela, producer Jane Lloyd, editor Chancler Haynes, production designer Ethan Tobman and fight choreographer Charlie Mayhew. She said she wanted it to depict "how her fans helped her reclaim her music" — the vault stuffed with Speak Now-era memorabilia, a barely-veiled masters-reclamation metaphor critics read the same way.\n\nThe cast was a reunion. Taylor Lautner — the acknowledged inspiration for "Back to December" and, Taylor told the crowd, now among her "closest friends" along with his wife, Tay Lautner — did every stunt himself; Joey King and Presley Cash, the kids from the 2010 "Mean" video, returned grown up as the heist crew. Overwhelmed, Lautner backflipped onstage at the premiere ("when I freak out … I just go straight to backflip") and reprised the flips at an Eras Tour film screening months later.\n\nThe song rewarded the moment: "I Can See You" debuted and peaked at No. 5 on the Hot 100 (dated July 22, 2023) — the highest-charting of Speak Now (Taylor\'s Version)\'s six From the Vault tracks, on 24.7 million first-week streams — in the week all 22 of the album\'s songs charted at once. Rolling Stone called it "the most surprising of the new tracks," and Slant wrote that Taylor "takes control" in the action-packed clip.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/music/news/taylor-swift-lautner-i-can-see-you-music-video-joey-king-presley-cash-1235664478/',
            source_title: "Taylor Swift Casts Her Ex, Taylor Lautner, as Co-Star in 'I Can See You' Video",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-i-can-see-you-video-taylor-lautner-joey-king-presley-cash-1235368510/',
            source_title: "Taylor Swift Premieres 'I Can See You' Video",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          // Depth pass (ledger #1450, 2026-07-24): the No. 5 chart debut + first-week
          // units, the Liverpool shoot and crew credits, the "Mean" reunion, Lautner's
          // own on-record account, and the fan-reclamation intent Swift stated.
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/I_Can_See_You_(song)',
            source_title: 'I Can See You (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-24',
            reliability_score: 2,
          },
          {
            outlet: 'Jonathan Sela (DP)',
            url: 'https://www.jonathansela.net/portfolio/taylor-swift-i-can-see-you-taylors-version-from-the-vault-official-video',
            source_title: "Taylor Swift — I Can See You (production credits)",
            publisher: 'Jonathan Sela (official site)',
            source_type: 'primary',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard via Yahoo',
            url: 'https://www.yahoo.com/entertainment/taylor-lautner-says-blacked-during-172118460.html',
            source_title: 'Taylor Lautner Says He Blacked Out During His Surprise Eras Tour Appearance',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-album-reviews/speak-now-taylors-version-review-1234783042/',
            source_title: "Speak Now (Taylor's Version) Review",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): official music-video still hosted on
        // Wikipedia (the song article's screenshot file); verified HTTP 200 + image/png.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/87/I_Can_See_You_%E2%80%93_Taylor_Swift_%28music_video_screenshot%29.png',
            credit: 'Taylor Swift / Republic Records (music video still)',
            caption: 'A still from the self-directed "I Can See You" vault-heist video.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'swift-quake-seattle',
      // Cross-link (candidate #1309): the Edinburgh/Murrayfield 2024 stand whose
      // crowd also registered as real seismic activity — the two "her concert is
      // an earthquake" moments, two eras apart.
      relatedIds: [
        'moment:vault-ttpd-three-nights-three-scottish-attendance-records-at-murrayfiel',
      ],
      significance: 'notable', // a genuinely unusual, scientifically documented cultural phenomenon — a real seismologist's read on a real seismometer (docs/decisions.md, 2026-07-19)
      year: 2023,
      month: 7,
      day: 22,
      category: 'tour',
      title: 'The "Swift Quake": Seattle shows register as seismic activity',
      snippet:
        'Two nights at Lumen Field shook the ground like a 2.3-magnitude quake — beating the stadium\'s famous 2011 "Beast Quake," with dancing Swifties out-rumbling a Marshawn Lynch touchdown.',
      sourceUrl: 'https://www.cbsnews.com/news/beast-quake-taylor-swift-seattle-concerts-seismic-activity-lumen-field/',
      thumbnailUrl: null,
      moment: {
        context:
          'Geologist Jackie Caplan-Auerbach read the July 22–23, 2023 shows off PNSN station KDK, directly across the street from Lumen Field on Occidental Avenue — shaking that peaked at a 2.3-magnitude *equivalent*, roughly twice the amplitude of the stadium\'s 2011 "Beast Quake," and sustained across the whole ~3.5-hour set rather than one touchdown\'s burst. Her read became peer-reviewed science: "Beast Quake (Taylor\'s Version)" in GSA Today (May 2024), with a separate Caltech study of the L.A./SoFi shows in Seismological Research Letters the same year.\n\nThe key finding corrects the obvious guess: the ground was moved by the crowd, not the sound system. Caltech\'s controlled test showed the PA — and even a bass guitar — produced no such signal, while fans jumping in sync did; the music only works as a metronome (Eos: "stomping feet, not booming beat"). The strongest signals tracked "Shake It Off" (the single biggest jolt, ~magnitude 0.85), "You Belong With Me" and "Love Story," each low-frequency peak matching the song\'s tempo. It is surface loading from tens of thousands of synchronized bodies, not a fault rupturing — so the "magnitude" is only an energy-equivalent, and the Beast Quake it beat never had a firm number of its own (roughly M1–2, "at best very approximate").\n\nEach sold-out night drew more than 70,000 — 72,171 on July 22, a Lumen Field concert record and the first time an artist sold out the stadium on consecutive nights. Guinness certified it "Greatest seismic activity caused by a music concert," and the effect proved tour-wide — measured again at SoFi, at Lisbon (0.82, May 2024) and at Edinburgh, where the British Geological Survey picked it up 6 km from the stadium.',
        sources: [
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/beast-quake-taylor-swift-seattle-concerts-seismic-activity-lumen-field/',
            source_title: "Beast Quake (Taylor's Version): Taylor's Eras tour concerts cause seismic activity in Seattle",
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'CNN',
            url: 'https://www.cnn.com/2023/07/27/entertainment/taylor-swift-seismic-activity/index.html',
            source_title: 'Taylor Swift fans cause record-breaking seismic activity during Seattle shows',
            publisher: 'CNN',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          // Depth pass (ledger #1419, 2026-07-24): the seismometer identity (PNSN
          // station KDK) and the Lumen Field attendance record.
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-seattle-eras-tour-shows-break-seismic-activity-record-in-two-nights-1234796787/',
            source_title: 'Taylor Swift Seattle Eras Tour Shows Break Seismic Activity Record in Two Nights',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Pacific Northwest Seismic Network',
            url: 'https://pnsn.org/blog/2023/08/15/beast-quake-taylor-s-version-from-the-vault',
            source_title: "Beast Quake (Taylor's Version) (From The Vault)",
            publisher: 'Pacific Northwest Seismic Network',
            source_type: 'institutional',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'Western Washington University News',
            url: 'https://news.wwu.edu/wwu-seismologist-captures-swift-quake-story-goes-global',
            source_title: 'WWU seismologist captures “Swift Quake,” story goes global',
            publisher: 'Western Washington University',
            source_type: 'institutional',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Caltech',
            url: 'https://www.caltech.edu/about/news/swifities-shake-it-off-and-help-seismologists-solve-mystery-of-how-concertgoers-shake-things-up',
            source_title: 'Swifties Shake It Off — and Help Seismologists Solve a Mystery',
            publisher: 'California Institute of Technology',
            source_type: 'institutional',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Eos',
            url: 'https://eos.org/articles/swift-quakes-caused-by-stomping-feet-not-booming-beat',
            source_title: 'Taylor Quakes Caused by Stomping Feet, Not Booming Beat',
            publisher: 'Eos (American Geophysical Union)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Guinness World Records',
            url: 'https://www.guinnessworldrecords.com/world-records/759394-greatest-seismic-activity-caused-by-a-music-concert',
            source_title: 'Greatest seismic activity caused by a music concert',
            publisher: 'Guinness World Records',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'British Geological Survey',
            url: 'https://www.bgs.ac.uk/news/quake-it-off-taylor-swift-concerts-shake-edinburgh/',
            source_title: 'Quake it off: Taylor Swift concerts shake Edinburgh',
            publisher: 'British Geological Survey',
            source_type: 'institutional',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
        ],
        // Real-photo pass (2026-07-09): freely licensed photo taken inside Lumen
        // Field during the Eras Tour's Seattle stand (the venue's only Eras dates
        // were July 22-23, 2023). Verified HTTP 200 + image/jpeg this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Lumen_Field_northwest_side_-_The_Eras_Tour_by_Taylor_Swift_%2820230802143847%29.jpg/960px-Lumen_Field_northwest_side_-_The_Eras_Tour_by_Taylor_Swift_%2820230802143847%29.jpg',
            focalPoint: '50% 45%',
            credit: 'Anaroll, CC BY-SA 3.0, via Wikimedia Commons',
            caption: 'Lumen Field mid-show during the Eras Tour Seattle stand — the crowd whose synchronized dancing registered on a seismometer next door.',
            kind: 'primary',
          },
          {
            url: 'https://news.wwu.edu/sites/news.wwu.edu/files/bc8a75cd-f7bb-90e1-7abf-b4277cf3f5a5_1.jpg',
            focalPoint: '45% 45%',
            credit: 'Kari Mar, via WWU News',
            caption: 'A packed Lumen Field lit red, shot by an attendee — the same synchronized 72,000-person crowd Western Washington University\'s own seismologist read off a seismometer.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'eras-tour-beige-book',
      significance: 'notable', // an economic-impact recognition genuinely unprecedented for a single tour — a real, citable macro data point (docs/decisions.md, 2026-07-19)
      relatedIds: [
        'moment:vault-midnights-the-eras-tour-kicks-off-in-glendale',
        // Cross-link (ledger #1320 Q7 / crosslink-candidate): the page's own prose
        // says the Fed mention resurfaced in Time's Person of the Year citation.
        'moment:vault-midnights-time-names-her-2023-person-of-the-year',
      ],
      year: 2023,
      month: 7,
      day: 12,
      category: 'business',
      title: "The Eras Tour makes the Federal Reserve's Beige Book",
      snippet:
        'The Philadelphia Fed credited her three Linc shows with the city\'s strongest hotel month since the pandemic began — a pop tour surfacing in central-bank economic reporting.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-eras-tour-boosting-hotel-industry-economy-federal-reserve-1235371670/',
      thumbnailUrl: null,
      moment: {
        context:
          'The July 12, 2023 Beige Book named her outright — no euphemism. In the Third District (Philadelphia) summary, Fed staff wrote that "one contact highlighted that May was the strongest month for hotel revenue in Philadelphia since the onset of the pandemic, in large part due to an influx of guests for the Taylor Swift concerts in the city." A pop tour had become a line in the same central-bank briefing that tracks inflation and freight.\n\nThe Fed entry itself carried no dollar figure, but the numbers behind it were real. Her three Soldier Field shows (June 2-4, 2023) helped push Chicago to its highest hotel occupancy on record — more than 44,000 rooms filled at a 96.8% weekend average, about $39 million in hotel revenue, per Choose Chicago — while Illinois logged record hotel revenue for the year.\n\nIt was not quite unprecedented: weeks earlier a Danske Bank economist had pinned roughly 0.2 points of Sweden\'s surprise May inflation on Beyonce\'s Renaissance opener in Stockholm — the "Beyonce blip." But that was a Danske Bank economist reading Sweden\'s official inflation figures (from the national statistics office, not the Riksbank), not a central bank writing an artist into its own report, which is what made the Fed line singular. The mention followed her all year, resurfacing that December when Time named her Person of the Year for a tour "so big the Federal Reserve noted its boost to tourism."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-eras-tour-boosting-hotel-industry-economy-federal-reserve-1235371670/',
            source_title: "Federal Reserve Says Taylor Swift's Eras Tour Had a Massive Impact on Philadelphia Hotel Bookings",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          // Depth pass (ledger #1320, 2026-07-24): verbatim Fed wording; the
          // Chicago/Illinois hard hotel numbers behind the entry; and the
          // Beyonce/Riksbank "Beyonce blip" parallel the ledger asked to weigh.
          {
            outlet: 'NBC Chicago',
            url: 'https://www.nbcchicago.com/news/local/taylor-swifts-chicago-soldier-field-concerts-break-chicago-hotel-record/3157392/',
            source_title: "Chicago sets new 'all-time record' for hotel room occupancy during Taylor Swift Soldier Field shows",
            publisher: 'NBC Chicago',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/tylerroush/2023/06/14/beyonc-caused-inflation-renaissance-tour-may-have-boosted-swedens-costs-economist-says/',
            source_title: "Beyoncé Caused Inflation? 'Renaissance' Tour May Have Boosted Sweden's Costs, Economist Says",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/business/consumer/taylor-swift-federal-reserve-credits-eras-tour-boosting-hotels-tourism-rcna94046',
            source_title: 'Federal Reserve credits Taylor Swift with boosting hotel revenues through her blockbuster Eras Tour',
            publisher: 'NBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Federal Reserve',
            url: 'https://www.federalreserve.gov/monetarypolicy/beigebook202307.htm',
            source_title: 'Beige Book — July 12, 2023',
            publisher: 'Federal Reserve Board',
            source_type: 'official',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
        ],
        // Real-photo pass (2026-07-09): the institution that wrote her into its
        // briefing book — freely licensed photo of the Federal Reserve's Eccles
        // Building, clearly labeled. Verified HTTP 200 + image/jpeg this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Marriner_S._Eccles_Federal_Reserve_Board_Building.jpg/960px-Marriner_S._Eccles_Federal_Reserve_Board_Building.jpg',
            credit: 'AgnosticPreachersKid, CC BY-SA 3.0, via Wikimedia Commons',
            caption: "The Federal Reserve's Marriner S. Eccles Building in Washington — publisher of the Beige Book that cited the Eras Tour's hotel impact.",
            focalPoint: '50% 42%',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'sofi-1989-tv-announcement',
      threadIds: ['taylors-version'],
      year: 2023,
      month: 8,
      day: 9,
      category: 'release',
      significance: 'notable', // a genuinely predictive fan-numerology win and a real re-record milestone, but one of four TV announcements this era rather than a career-wide top-40 event (docs/decisions.md, 2026-07-19)
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-mid-6", label: "1989 (TV) announced", kind: "album" },
      relatedIds: [
        'moment:vault-lover-my-worst-case-scenario-scooter-braun-buys-big-machine-and-he',
        // Announcement → payoff (ledger #1115, Q3): the Oct. 27, 2023 release outcome.
        'moment:vault-midnights-1989-taylors-version-resets-the-vinyl-record',
        // Consolidation thread (ledger #1115, Q1): the 1989-era canonical copy of
        // this same Aug. 9 2023 SoFi announcement — threaded, not left duplicated.
        'moment:vault-1989-1989-taylors-version-announced-in-head-to-toe-blue-at-sofi-s',
      ],
      title: "1989 (Taylor's Version) announced at the final US show — on the date fans predicted",
      snippet:
        'Blue versions of her Speak Now, folklore, and 1989 outfits teased it all night at SoFi before the reveal: Oct. 27. Fans had already done the math — Aug. 9 was eight years, nine months, and 13 days since the original.',
      sourceUrl: 'https://variety.com/2023/music/news/taylor-swift-announces-1989-taylors-version-coming-la-tour-finale-sofi-stadium-1235692622/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Aug. 9, 2023 finale of the tour\'s first US run landed the reveal in the acoustic surprise-song slot: the new album cover — Taylor smiling against a blue sky, echoing the 2014 original — flashed onto the stadium screens to a roughly eight-minute roar, and she paired the night with "New Romantics" on guitar and "New Year\'s Day" on piano. She called it "my most FAVORITE re-record I\'ve ever done because the 5 From The Vault tracks are so insane."\n\nThe date numerology (8/9 reading as \'89, and her lucky 13) had circulated among fans for weeks — one of the rare times the fandom called an announcement to the day, with the era\'s blue color-code and the tour calendar all pointing the same way before the show.\n\nThe five vault-track titles came via a September Google puzzle hunt — fans were set 33 million word-scrambles to solve (a nod to her age) and blew past it in a day, crashing the counter. All five landed in the Hot 100\'s top 10 at release: "Is It Over Now?" debuted at No. 1 (her second Taylor\'s Version vault cut to top the chart, after "All Too Well"), trailed by "Now That We Don\'t Talk," "Slut!," "Say Don\'t Go" and "Suburban Legends" — and 1989 (Taylor\'s Version) opened to the biggest week of her career.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/music/news/taylor-swift-announces-1989-taylors-version-coming-la-tour-finale-sofi-stadium-1235692622/',
            source_title: "Taylor Swift Says '1989 (Taylor's Version)' Is Coming at L.A. Finale",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'The Washington Post',
            url: 'https://www.washingtonpost.com/arts-entertainment/2023/08/10/taylor-swift-1989-taylors-version/',
            source_title: "Taylor Swift announces '1989 (Taylor's Version)' at final U.S. Eras Tour show this year",
            publisher: 'The Washington Post',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Wikipedia',
            url: "https://en.wikipedia.org/wiki/1989_(Taylor%27s_Version)",
            source_title: "1989 (Taylor's Version)",
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          // Depth pass (ledger #1115, 2026-07-24): surprise-song reveal, vault
          // puzzle mechanic, vault-track chart outcomes, and week-one payoff.
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-eras-tour-la-recap-night-6-best-moments-sofi-stadium/',
            source_title: 'Taylor Swift Eras Tour LA Night 6 Recap: Best Moments at SoFi Stadium',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-fans-crash-google-1989-vault-puzzles-1235416529/',
            source_title: "Taylor Swift Fans Crash Google Solving 1989 Vault Puzzles",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-is-it-over-now-number-1-hot-100-debut-1235464462/',
            source_title: "Taylor Swift's 'Is It Over Now?' Debuts at No. 1 on the Hot 100",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/music/news/taylor-swift-number-one-1989-taylors-version-her-best-first-week-ever-1235780769/',
            source_title: "1989 (Taylor's Version) Gives Taylor Swift Her Best First Week Ever",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): freely licensed photo from the actual
        // Aug. 9, 2023 SoFi Stadium show where the announcement happened.
        // Verified HTTP 200 + image/jpeg this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Taylor_Swift_The_Eras_Tour_Midnights_Era_Set_%2853109617451%29.jpg/960px-Taylor_Swift_The_Eras_Tour_Midnights_Era_Set_%2853109617451%29.jpg',
            credit: 'Paolo V, CC BY 2.0, via Wikimedia Commons',
            caption: 'The Midnights set at SoFi Stadium on Aug. 9, 2023 — the final US show of the year, and the night the 1989 (Taylor\'s Version) announcement lit up the roof.',
            focalPoint: '48% 30%',
            kind: 'primary',
          },
          // Photo pass (#762, 2026-07-20): a second freely-licensed frame from
          // the same Aug. 9, 2023 SoFi show — the blue-crystal 1989 set that,
          // per this moment's own snippet, teased the announcement all night.
          // Same Commons photographer (Paolo V) as the frame above. URL 200 +
          // image/jpeg; downloaded and vision-confirmed this session.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Taylor_Swift_The_Eras_Tour_1989_Era_Set_%2853109523971%29_%28cropped%29.jpg',
            focalPoint: '51% 15%',
            credit: 'Paolo V, CC BY 2.0, via Wikimedia Commons',
            caption: 'Taylor in the blue-crystal 1989 era set at SoFi Stadium that night — the color-coded tease that fans read as a signal before the 1989 (Taylor\'s Version) reveal.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'bloomberg-billionaire',
      year: 2023,
      month: 10,
      day: 26,
      category: 'business',
      significance: 'defining', // one of very few entertainers ever to reach ten figures on music alone, no side business required (docs/decisions.md, 2026-07-19)
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-mid-4", label: "Billionaire status", kind: "business" },
      // Cross-links (ledger #1331): the same-October record sales week the page's
      // own text cites; the Eras Tour engine Bloomberg weighted most heavily; and
      // the masters sale that explains why only post-2019 catalog was counted.
      relatedIds: [
        'moment:vault-midnights-1989-taylors-version-resets-the-vinyl-record',
        'moment:vault-midnights-the-eras-tour-kicks-off-in-glendale',
        'moment:vault-lover-my-worst-case-scenario-scooter-braun-buys-big-machine-and-he',
      ],
      title: 'Billionaire status, from the music alone',
      snippet:
        'Bloomberg put her net worth at $1.1 billion in October 2023 — one of the only entertainers ever to get there purely on songs and shows, no sneaker line or liquor brand required.',
      sourceUrl: 'https://www.bloomberg.com/graphics/2023-taylor-swift-net-worth-billionaire/',
      thumbnailUrl: null,
      moment: {
        context:
          'Bloomberg pegged her net worth at $1.1 billion in October 2023, splitting it into roughly $400M in catalog value (music released since 2019), $370M from tickets and merch, $120M from streaming, $110M in real estate, and $80M in royalties. Forbes reached the same call the same month — both noting she was the first musician to get to ten figures on songs and shows alone, not on an outside empire.\n\nThat distinction was the story. Rihanna crossed a billion on Fenty Beauty, Jay-Z on spirits and art, Oprah on media — Taylor did it with no sneaker line, liquor brand, or startup portfolio. Bloomberg counted only her post-2019 masters, because she did not own the Big Machine catalog Scooter Braun had bought in 2019; the Taylor\'s Version re-recordings were her rebuilding an owned catalog from scratch, and that new-catalog value is what the estimate tallied.\n\nThe compounding engine was the Eras Tour — the first tour ever to gross $1 billion, which closed in December 2024 at $2.08 billion, double any tour in history — landing in the same October as 1989 (Taylor\'s Version) and the largest sales week of her career. Her real-estate line spanned homes in Nashville, Beverly Hills, New York and Rhode Island. The number kept climbing: Forbes had her at $1.6 billion by late 2024, passing Rihanna as the richest female musician, and near $2 billion by 2026.',
        sources: [
          {
            outlet: 'Bloomberg',
            url: 'https://www.bloomberg.com/graphics/2023-taylor-swift-net-worth-billionaire/',
            source_title: 'Taylor Swift Hits Billionaire Status as Net Worth Surges With Eras Tour Success',
            publisher: 'Bloomberg',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'CNBC',
            url: 'https://www.cnbc.com/2023/10/27/taylor-swift-has-entered-her-billionaire-era.html',
            source_title: 'Taylor Swift has reportedly entered her billionaire era with success of Eras Tour',
            publisher: 'CNBC',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          // Depth pass (ledger #1331, 2026-07-24): Forbes concurrence and the
          // "music alone" contrast; the Eras Tour gross milestones; the
          // post-2019-catalog/masters methodology; and the net-worth trajectory.
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/mollybohannon/2024/04/02/taylor-swift-officially-joins-forbes-billionaire-list-as-one-of-14-celebrity-billionaires/',
            source_title: 'Taylor Swift Officially Joins Forbes\' Billionaire List As One Of 14 Celebrity Billionaires',
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-eras-tour-earnings-2-billion-sales-1235847513/',
            source_title: "Taylor Swift's The Eras Tour Wraps as First Tour to Pass $2 Billion in Sales",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/pop-culture/pop-culture-news/taylor-swifts-eras-tour-first-concert-tour-gross-1-billion-rcna128743',
            source_title: "Taylor Swift's Eras Tour is the first concert tour to gross more than $1 billion",
            publisher: 'NBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'AOL / People',
            url: 'https://www.aol.com/taylor-swift-surpasses-rihanna-richest-025541499.html',
            source_title: 'Taylor Swift Surpasses Rihanna as Richest Female Musician with $1.6 Billion Net Worth',
            publisher: 'People',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
        ],
        // Real-photo pass (2026-07-09): freely licensed Eras Tour performance
        // photo — the machine that did the compounding. Verified HTTP 200 + image/jpeg.
        // Photo-enrichment pass (2026-07-18): added a second frame from the same
        // SoFi stand — the Midnights set panorama (same photographer, different
        // act, distinct from the three Midnights Era Set files already used
        // elsewhere in the corpus). Curl 200 + image/jpeg, vision-confirmed.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Eras_Tour_-_Inglewood%2C_California_-_Red_act_7.jpg/960px-Eras_Tour_-_Inglewood%2C_California_-_Red_act_7.jpg',
            credit: 'Paolo V, CC BY 2.0, via Wikimedia Commons',
            caption: 'The Eras Tour at SoFi Stadium in August 2023 — the touring engine Bloomberg credited with pushing the net-worth math past $1 billion.',
            kind: 'archival',
            focalPoint: '50% 32%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Taylor_Swift_The_Eras_Tour_Midnights_Era_Set_%2853109009237%29.jpg/1280px-Taylor_Swift_The_Eras_Tour_Midnights_Era_Set_%2853109009237%29.jpg',
            credit: 'Paolo V, CC BY 2.0, via Wikimedia Commons',
            caption: 'The Midnights set during the same SoFi stand — the August 2023 shows that closed out the US leg two months before Bloomberg ran the numbers.',
            kind: 'archival',
            focalPoint: '50% 45%',
          },
          // Photo pass 2026-07-19 (defining-events-31-50): 3 more real,
          // verified photos tied to the specific revenue drivers this
          // item's own text breaks down (the tour, and 1989 (Taylor's
          // Version), which posted its largest sales week the same month).
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Taylor_Swift_The_Eras_Tour_1989_Era_Set_%2853109542801%29_%28cropped%29.jpg',
            focalPoint: '48% 24%',
            credit: 'Paolo V, Wikimedia Commons (CC BY 2.0)',
            caption: 'The 1989 set at the same SoFi stand — the era whose Taylor\'s Version posted the biggest sales week of her career that same October.',
            kind: 'archival',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/d/d5/Taylor_Swift_-_1989_%28Taylor%27s_Version%29.png',
            focalPoint: '50% 46%',
            credit: 'Republic Records (official cover art)',
            caption: '1989 (Taylor\'s Version), released Oct. 27, 2023 — the record-week sales that landed the same month as the billionaire estimate.',
            kind: 'archival',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/The_Eras_Tour_Logo.png',
            focalPoint: '50% 50%',
            credit: 'TAS Rights Management (official logo)',
            caption: 'The Eras Tour\'s own branding — the touring revenue Bloomberg\'s breakdown weighted most heavily.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      slug: 'eras-film-opening-weekend',
      year: 2023,
      month: 10,
      day: 13,
      category: 'release',
      significance: 'defining', // bypassed the entire studio system and still set the concert-film opening record — a new distribution playbook, not just a box-office number (docs/decisions.md, 2026-07-19)
      // No new MILESTONES entry: "m-mid-3" (this same era file) already marks
      // Oct. 13, 2023 on the scrubber via the "midnights-film" stub item.
      // Cross-links (ledger #1476 Q5, 2026-07-24): the tour this film documents,
      // the docuseries about its making, and the 2025 concert film it set the
      // template for. All three moment ids verified against the generated vault.
      // (Song links to "Our Song"/"You're On Your Own, Kid" can't render here —
      // moment relatedIds resolve only to moments, not tracks.)
      relatedIds: [
          'moment:vault-tloas-an-album-release-party-wins-the-box-office-34-1m-domestic-50',
        'moment:vault-midnights-the-presale-that-broke-ticketmaster-and-set-a-sales-record-a',
        'moment:vault-tloas-the-end-of-an-era-the-eras-tour-docuseries-lands-on-disney',
        'moment:vault-tloas-the-final-show-the-full-vancouver-closer-streaming-at-last',
      ],
      // Reception pull-quote (ledger #1476 Q1): The Hollywood Reporter's verdict.
      pullQuote: '“Sometimes exhausting, often exhilarating, always impressively immersive.”',
      title: 'The Eras Tour film opens to $92.8 million — the biggest concert-film debut ever',
      snippet:
        'Distributed straight through AMC, skipping the studios entirely: $92.8M domestic, $123.5M globally, and the second-biggest October opening of all time behind Joker.',
      sourceUrl: 'https://variety.com/2023/film/box-office/taylor-swift-eras-tour-box-office-final-opening-weekend-record-1235757568/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Oct. 13, 2023 opening weekend played like a tour stop: theaters full of costumed fans dancing in the aisles, with minimal traditional marketing. The $123.5 million global start beat the concert-film opening record Justin Bieber: Never Say Never had held since 2011, and the $92.8 million domestic number ranked as the second-biggest October opening ever, behind only Joker.\n\nDirected by Sam Wrench and filmed over the first three of Taylor\'s six SoFi Stadium nights (Aug. 3–5, 2023), it carried her numerology into the box office: AMC priced adult tickets at $19.89 and children\'s and seniors\' at $13.13. Demand broke AMC\'s records — a $26 million single-day presale, past $100 million in advance sales before opening — and AMC shares jumped about 11.5% on the news.\n\nThe business model drew as much coverage as the numbers: Taylor bypassed the studios and dealt directly with AMC — theaters kept 43% of the gross — a direct-to-exhibitor first at this scale she reran for the 2025 Showgirl Release Party. It opened in more than 100 countries, booked overseas through Trafalgar Releasing rather than a studio, and trades credited it with reviving a strike-thinned fall box office.\n\nThe theatrical cut kept the two SoFi surprise songs ("Our Song" and "You\'re On Your Own, Kid") but dropped five numbers; a later Extended Version and the March 2024 Disney+ edit restored them and added more acoustic cuts. Reviews matched the box office — a 98% Rotten Tomatoes score and an 82 Metascore — and while a concert film was ineligible for the documentary Oscar, it earned a Golden Globe nomination for Cinematic and Box Office Achievement, losing to Barbie. By January 2024 it passed Michael Jackson\'s This Is It as the highest-grossing concert film ever, on its way to about $267 million.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/film/box-office/taylor-swift-eras-tour-box-office-final-opening-weekend-record-1235757568/',
            source_title: 'Taylor Swift Eras Tour Box Office: Final Opening Weekend Number',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'CNBC',
            url: 'https://www.cnbc.com/2023/10/16/taylor-swift-eras-tour-box-office-weekend.html',
            source_title: "Taylor Swift Eras Tour film posts second-best October box office opening, behind 'Joker'",
            publisher: 'CNBC',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          // Depth pass (ledger #1124, 2026-07-24): director/filming, symbolic
          // pricing, record presales, cut/restored songs, AMC terms, final gross.
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/music/news/taylor-swift-eras-tour-movie-song-list-surprise-songs-1235753833/',
            source_title: 'Taylor Swift Eras Tour Movie: Full Song List and Surprise Songs',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/taylor-swift-eras-tour-movie-amc-tickets-rcna102712',
            source_title: 'Taylor Swift Eras Tour movie tickets: $19.89 and $13.13 pricing',
            publisher: 'Today',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/film/box-office/taylor-swift-eras-tour-film-record-breaking-presales-1235710568/',
            source_title: 'Taylor Swift Eras Tour Film Sets Record-Breaking AMC Presales',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-eras-tour-concert-film-deal-amc/',
            source_title: "Inside Taylor Swift's Eras Tour Concert Film Deal With AMC",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'AMC Theatres',
            url: 'https://investor.amctheatres.com/news-events/press-releases/detail/348/',
            source_title: "Taylor Swift | The Eras Tour Becomes Highest-Grossing Concert Film of All Time",
            publisher: 'AMC Entertainment',
            source_type: 'primary',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          // Depth pass (ledger #1476, 2026-07-24): critical reception, the AMC /
          // exhibition-industry story, international width, and the awards axis.
          {
            outlet: 'Rotten Tomatoes',
            url: 'https://www.rottentomatoes.com/m/taylor_swift_the_eras_tour',
            source_title: 'Taylor Swift: The Eras Tour — 98% Tomatometer (96 reviews)',
            publisher: 'Rotten Tomatoes',
            source_type: 'aggregator',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Metacritic',
            url: 'https://www.metacritic.com/movie/taylor-swift-the-eras-tour/',
            source_title: 'Taylor Swift: The Eras Tour — Metascore 82 (universal acclaim)',
            publisher: 'Metacritic',
            source_type: 'aggregator',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/movies/movie-reviews/taylor-swift-the-eras-tour-review-1235616407/',
            source_title: "'Taylor Swift: The Eras Tour' Review (Angie Han)",
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Source of the pull-quote: "always impressively immersive"',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/tv-movies/tv-movie-reviews/taylor-swift-the-eras-tour-movie-review-sing-along-amc-evermore-1234853358/',
            source_title: "'Taylor Swift: The Eras Tour' Movie Review (Rob Sheffield)",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/film/news/how-taylor-swift-eras-tour-concert-movie-landed-amc-theaters-1235749215/',
            source_title: "How Taylor Swift's Eras Tour Concert Film Scrambled (and Saved) the Fall Movie Season",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'AMC stock jump, direct-to-exhibitor model, reviving the post-strike fall box office',
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/movies/movie-news/taylor-swift-golden-globes-box-office-history-1235781525/',
            source_title: "Taylor Swift's Eras Tour Film Makes Golden Globes History (Cinematic and Box Office Achievement nom)",
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://au.variety.com/?p=11433',
            source_title: "Why Taylor Swift's Eras Tour Film Is Ineligible for the Documentary Feature Oscar",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): the film's promotional poster; Wikipedia's
        // stable copy, verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/d/d6/Taylor_Swift_The_Eras_Tour_film_promotional_poster.png',
            focalPoint: '50% 20%',
            credit: 'Taylor Swift Productions / AMC Theatres',
            caption: 'Promotional poster for Taylor Swift: The Eras Tour, the concert film that opened to a record $92.8 million domestic.',
            kind: 'primary',
          },
          // Photo pass 2026-07-19 (defining-events-31-50): 2 more real,
          // verified photos of the opening weekend itself.
          {
            url: 'https://www.billboard.com/wp-content/uploads/2023/10/taylor-swift-eras-movie-premiere-2023-billboard-1240.jpg',
            focalPoint: '48% 20%',
            credit: 'Getty Images, via Billboard',
            caption: 'At the film\'s Los Angeles premiere, Oct. 11, 2023, two days before the record-setting opening weekend.',
            kind: 'archival',
          },
          {
            url: 'https://www.hollywoodreporter.com/wp-content/uploads/2023/10/Taylor-Swift-Eras-Tour-Movie-Opening-Night-Publicity-H-2023.jpg?w=1296&h=730&crop=1',
            focalPoint: '43% 22%',
            credit: 'Getty Images, via The Hollywood Reporter',
            caption: 'Opening night at the TCL Chinese Theatre in Hollywood — the costumed, dancing audiences that drove the box office.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'slut-vault-love-song',
      // Cross-links (ledger #1341 Q7, 2026-07-24): the song she chose over
      // "Slut!" for the original 1989, and the SoFi announcement of the
      // re-record that finally freed it from the vault.
      relatedIds: [
        'moment:vault-1989-blank-space-flips-the-narrative',
        'moment:vault-1989-1989-taylors-version-announced-in-head-to-toe-blue-at-sofi-s',
      ],
      year: 2023,
      month: 10,
      day: 27,
      category: 'music',
      title: '"Slut!" turns out to be a love song',
      snippet:
        'The vault title everyone braced for arrived as a dreamy synth-pop ballad about a romance worth the name-calling — she\'d once had to choose between it and "Blank Space" for the original 1989.',
      sourceUrl: 'https://en.wikipedia.org/wiki/%22Slut!%22',
      thumbnailUrl: null,
      moment: {
        context:
          'Written and produced by Taylor Swift with Jack Antonoff and Swedish writer-producer Patrik Berger, "Slut!" was cut from the original 1989 in 2014 and held nine years. Taylor explained the choice in a short audio clip during the 2023 vault reveal: both "Slut!" and "Blank Space" grew from the same tabloid narrative about her dating life, but she picked the sharper "Blank Space" because "Slut!" had a warmer, "California" feel that clashed with 1989\'s New York sound.\n\nThe title everyone braced for arrived as a dreamy synth-pop love song that reclaims the slut-shaming era with tenderness rather than anger — "if they call me a slut, you know it might be worth it for once." It debuted and peaked at No. 3 on the Hot 100 the week the three 1989 (Taylor\'s Version) vault cuts swept the chart\'s top three ("Is It Over Now?" No. 1, "Now That We Don\'t Talk" No. 2, "Slut!" No. 3), part of seven Taylor songs in that week\'s top 10.\n\nReviews split on the gentle turn: Rolling Stone\'s Angie Martoccio called it "a stunner" and The Line of Best Fit found the softness empowering, while Pitchfork ("aimless") and The New York Times ("half-baked") felt the tender execution undersold a strong concept. She first performed it Nov. 12, 2023 in Buenos Aires — solo at the piano in the Eras Tour acoustic set — and later folded it into "False God" mashups in Singapore and Germany.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/%22Slut!%22',
            source_title: '"Slut!"',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/taylor-swift-1989-vault-tracks-revelations-1234864433/',
            source_title: "The Sadness of 'Slut' — And More of Our Takeaways from Taylor Swift's New Vault Tracks",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          // Depth pass (ledger #1341, 2026-07-24): writing/production credits
          // (Berger), the Tumblr audio-clip explanation of the Blank Space
          // choice, the top-three vault-cluster chart week, and the live debut.
          {
            outlet: 'TODAY',
            url: 'https://www.today.com/popculture/music/taylor-swift-1989-slut-song-meaning-rcna122450',
            source_title: "Taylor Swift's '1989' Vault Song 'Slut!': What Do the Lyrics Mean?",
            publisher: 'TODAY',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-slut-live-buenos-aires-1235470006/',
            source_title: "Taylor Swift Debuts 'Slut!' Live at Buenos Aires Show",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): the vault track's parent album artwork;
        // Wikipedia's stable copy, verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/d/d5/Taylor_Swift_-_1989_%28Taylor%27s_Version%29.png',
            credit: 'Republic Records',
            caption: '1989 (Taylor\'s Version), where "Slut!" surfaced from the vault as a love song instead of the expected diss.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'buenos-aires-karma-lyric-change',
      year: 2023,
      month: 11,
      day: 11,
      category: 'relationship',
      // Cross-links (ledger #1248, Q-cross-links): the relationship going public
      // and the Dec. 2023 TIME Person of the Year cover from the same window.
      relatedIds: [
          'moment:vault-midnights-travis-confirms-it-on-the-record',
        'moment:vault-midnights-the-game-the-world-decided-made-it-official',
        'moment:vault-midnights-time-names-her-2023-person-of-the-year',
      ],
      title: '"Karma is the guy on the Chiefs" — sung with Travis watching',
      snippet:
        'She swapped the lyric mid-show in Buenos Aires while Kelce watched from a tent with her dad — then ran into his arms after the show for their first kiss caught on camera.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-travis-kelce-kiss-karma-is-the-guy-on-the-chiefs-1235469366/',
      thumbnailUrl: null,
      moment: {
        context:
          'Nov. 11, 2023, the third and final night of her Buenos Aires stand at Estadio River Plate: midway through "Karma" she swapped the bridge line "Karma is the guy on the screen coming straight home to me" to "…the guy on the Chiefs coming straight home to me," and fan video caught Kelce covering his face and grinning from a VIP tent as Scott Swift patted his arm.\n\nIt was Kelce\'s first Eras Tour show outside the US and the first since the two went public — he\'d quietly turned up in Kansas City back in July — and when the set ended she ran off the stage into his arms for the couple\'s first kiss caught on camera, the moment outlets treated as their relationship\'s "hard launch."\n\nHe recapped it on New Heights ("I might have had a little bit of a clue, but … it still shocked me"), and Taylor spoke about the romance on the record in TIME\'s December 2023 Person of the Year cover. The "Chiefs" version turned into a recurring tribute, resurfacing at later shows from Sydney in February 2024 through the Vancouver finale, and "Karma" streams jumped about 22% the Monday after Buenos Aires.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-travis-kelce-kiss-karma-is-the-guy-on-the-chiefs-1235469366/',
            source_title: 'Taylor Swift Changes Lyric, Kisses Travis Kelce in Buenos Aires',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/pop-culture/celebrity/travis-kelce-reacts-taylor-swift-karma-lyric-change-rcna124807',
            source_title: "Travis Kelce reacts to Taylor Swift's changing 'Karma' lyrics to refer to the Chiefs",
            publisher: 'NBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          // Depth pass (ledger #1248, 2026-07-24): first-kiss framing, the
          // lyric's later recurrence, and the streaming spike for "Karma."
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/taylor-swift-travis-kelce-kiss-eras-tour-argentina-rcna124801',
            source_title: 'Taylor Swift and Travis Kelce kiss after Buenos Aires Eras Tour show',
            publisher: 'Today',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-changes-karma-lyrics-travis-kelce-sydney-show-1235613396/',
            source_title: "Taylor Swift Changes 'Karma' Lyrics for Travis Kelce at Sydney Show",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'NME',
            url: 'https://www.nme.com/news/music/taylor-swifts-karma-streaming-boost-after-changing-lyric-to-shout-out-travis-kelce-3539649',
            source_title: "Taylor Swift's 'Karma' gets streaming boost after Travis Kelce lyric change",
            publisher: 'NME',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
        ],
        // Real-photo pass (2026-07-09): freely licensed photo from the same Buenos
        // Aires stand (night one), clearly labeled — the lyric-change moment itself
        // exists only in fan video. Verified HTTP 200 + image/jpeg this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Cierre_del_Eras_Tour_de_Taylor_Swift%2C_Buenos_Aires_noche_1.jpg/960px-Cierre_del_Eras_Tour_de_Taylor_Swift%2C_Buenos_Aires_noche_1.jpg',
            // Wide stadium shot; the lit stage and performers sit low in frame.
            focalPoint: '45% 72%',
            credit: 'Solargentino, CC BY-SA 4.0, via Wikimedia Commons',
            caption: 'Estadio River Plate during the Buenos Aires stand\'s first night, Nov. 9, 2023 — two nights before the "Karma" lyric change landed in the same stadium.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'youre-losing-me-streaming',
      year: 2023,
      month: 11,
      day: 29,
      category: 'music',
      // Cross-link (ledger #1251, Q-cross-links): it dropped in the same week as
      // the Spotify-2023 crown / TIME Person of the Year recognition.
      relatedIds: [
          'moment:vault-midnights-taylor-and-joe-alwyn-confirm-their-breakup-after-six-years','moment:vault-midnights-time-names-her-2023-person-of-the-year'],
      title: '"You\'re Losing Me" finally hits streaming',
      snippet:
        'The Midnights bonus track fans treated as the Alwyn-breakup rosetta stone went wide on Nov. 29 — her thank-you for being named Spotify\'s top global artist of 2023.',
      sourceUrl: 'https://en.wikipedia.org/wiki/You%27re_Losing_Me',
      thumbnailUrl: null,
      moment: {
        context:
          'Previously locked to a CD-only Late Night Edition sold at Eras Tour merch stands from late May 2023, the downtempo Taylor/Antonoff ballad — twinkling synthesizers over a sparse, steady pulse widely heard as a sampled heartbeat, a trick fans trace back to "Wildest Dreams," though Taylor has never confirmed whose it is — runs 4:38 and never appeared on a standard Midnights edition, only the digital Til Dawn Edition. Going wide on Nov. 29 as her thank-you for Spotify\'s 2023 global-artist crown, it entered the Hot 100 at No. 46 on two days of tracking and rose to No. 27 — remarkable for a six-month-old bonus track — while debuting atop Digital Song Sales, her record-extending 28th No. 1 there, and hitting No. 20 in the UK.\n\nAntonoff pinned the origin himself, posting that it was "written and recorded at home on 12/5/21" — well over a year before the Alwyn breakup became public, which only deepened the fan forensics: the song reads in hindsight as a relationship\'s decline documented in real time. Taylor has never narrated its meaning on the record, so the Alwyn attribution, however universally held, stays a fan reading.\n\nFor all its devotion it stayed off the setlist until Melbourne on Feb. 16, 2024, when Taylor finally played it as a piano surprise song — "I\'ve never played this one before" — returning to it in a Liverpool mashup and again at the Toronto tour finale in late 2024. Rolling Stone placed it at No. 86 on its best-songs-of-2023 list; it drew no Grammy nomination.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/You%27re_Losing_Me',
            source_title: "You're Losing Me",
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Deadline',
            url: 'https://deadline.com/2023/11/taylor-swift-youre-losing-me-1235642243/',
            source_title: "Taylor Swift Surprise-Releases 'You're Losing Me' As Thank You For Being Spotify's Top 2023 Global Artist",
            publisher: 'Deadline',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          // Depth pass (ledger #1251, 2026-07-24): chart run and Digital Song
          // Sales milestone; live-history and best-of-2023 placement per Wikipedia.
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-youre-losing-me-from-the-vault-debuts-hot-100-1235533932/',
            source_title: "Taylor Swift's 'You're Losing Me' Debuts on the Hot 100",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/music/news/taylor-swift-youre-losing-me-release-from-the-vault-1235812502/',
            source_title: "Taylor Swift Releases 'You're Losing Me' From the Vault to Streaming",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): the track's artwork; Wikipedia's stable
        // copy, verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/9/9b/Taylor_Swift_-_You%27re_Losing_Me.png',
            credit: 'Republic Records',
            caption: 'Artwork for "You\'re Losing Me (From the Vault)," the Midnights bonus track that finally went wide in November 2023.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'melbourne-mcg-biggest-shows',
      significance: 'notable', // the single largest crowds of her touring career, at Australia's most storied stadium (docs/decisions.md, 2026-07-19)
      relatedIds: ['moment:vault-midnights-the-eras-tour-kicks-off-in-glendale'],
      year: 2024,
      month: 2,
      day: 16,
      category: 'tour',
      title: '96,000 a night at the MCG — the biggest shows of her career',
      snippet:
        'Three Melbourne Cricket Ground nights, 96,000 each, 288,000 total: "those are all the biggest shows I\'ve ever played on a tour, and you did it three times."',
      sourceUrl: 'https://deadline.com/2024/02/taylor-swift-starstruck-by-record-breaking-melbourne-crowd-mcg-eras-tour-1235829157/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Feb. 16–18, 2024 Melbourne stand opened the Australian leg at a scale no Eras Tour stadium before it had touched — she told the final crowd she was "starstruck," spelling the math from the stage: "those are all the biggest shows I\'ve ever played on a tour, and you did it three times," and, visibly overwhelmed, "if I seem a bit like I\'m losing my mind it\'s about the fact that there are 96,000 people here tonight." It was the biggest crowd of her career, though not the MCG\'s own concert record — Ed Sheeran drew 109,500 to the same ground in 2023 with an in-the-round stage that opens up the whole oval.\n\nEach night carried its own acoustic surprises: Feb. 16 paired "Red" with the live debut of "You\'re Losing Me"; Feb. 17 a "Getaway Car" mashup (weaving in "august" and "The Other Side of the Door") and "this is me trying"; Feb. 18 "Come Back… Be Here" laced with "Daylight," plus "Teardrops on My Guitar." Opening night doubled as an era-tease — mid-set she announced "The Bolter," a bonus-track edition of the still-unreleased Tortured Poets Department. Sabrina Carpenter opened all three nights.\n\nThe 96,000-per-night mark — about 288,000 across the run — stood as the tour\'s single-night attendance ceiling through its Vancouver finale, with the city leaning in via "Welcome to Melbourne, Swifties" projections downtown.',
        sources: [
          {
            outlet: 'Deadline',
            url: 'https://deadline.com/2024/02/taylor-swift-starstruck-by-record-breaking-melbourne-crowd-mcg-eras-tour-1235829157/',
            source_title: 'Taylor Swift "Starstruck" By Record-Breaking Melbourne Crowd For Eras',
            publisher: 'Deadline',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/taylor-swift-celebrates-eras-tour-milestone-rcna139379',
            source_title: "Taylor Swift honors Melbourne crowd after celebrating major 'Eras Tour' milestone",
            publisher: 'Today',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          // Depth pass (ledger #1421, 2026-07-24): the per-night surprise songs and
          // "You're Losing Me" live debut (setlist.fm), the MCG attendance record and
          // Sheeran comparison (Visit Victoria), the "losing my mind" quote (RNZ), and
          // the opening-night "The Bolter" announcement (The Music AU).
          {
            outlet: 'setlist.fm',
            url: 'https://www.setlist.fm/setlist/taylor-swift/2024/melbourne-cricket-ground-melbourne-australia-33ad9425.html',
            source_title: 'Taylor Swift Setlist, Melbourne Cricket Ground, Feb. 16, 2024',
            publisher: 'setlist.fm',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          {
            outlet: 'Visit Victoria',
            url: 'https://corporate.visitvictoria.com/news/melbourne-stages-taylor-swifts-biggest-audience',
            source_title: "Melbourne stages Taylor Swift's biggest audience",
            publisher: 'Visit Victoria (Victorian Government)',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'RNZ',
            url: 'https://www.rnz.co.nz/news/media-technology/509428/mcg-comes-alive-as-taylor-swift-draws-the-biggest-concert-crowd-of-her-career',
            source_title: 'MCG comes alive as Taylor Swift draws the biggest concert crowd of her career',
            publisher: 'RNZ',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'The Music (AU)',
            url: 'https://themusic.com.au/news/taylor-swift-s-first-eras-tour-aus-setlist-live-debuts-big-announcements-more/mqYgjI-OsbA/17-02-24',
            source_title: "Taylor Swift's First 'Eras Tour' Aus Setlist: Live Debuts, Big Announcements & More",
            publisher: 'The Music (AU)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
        ],
        // Real-photo pass (2026-07-09): freely licensed photo of Melbourne's
        // Flinders Street Station lit up for the MCG weekend (Feb. 17, 2024).
        // Verified HTTP 200 + image/jpeg this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Welcome_to_Melbourne_Swifties_%2853555073949%29.jpg/960px-Welcome_to_Melbourne_Swifties_%2853555073949%29.jpg',
            credit: 'Caroline Jones, CC BY 2.0, via Wikimedia Commons',
            caption: '"Welcome to Melbourne Swifties" projected across Flinders Street Station on Feb. 17, 2024, mid-way through the record MCG weekend.',
            focalPoint: '50% 35%',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'coachella-2024-with-travis',
      // Cross-links (ledger #1435): the album six days out, and the Nov-2023
      // Buenos Aires "Karma is the guy on the Chiefs" moment the Ice-Spice-set
      // "Karma" dance rhymes with. Both ids verified in the generated vault.
      relatedIds: [
        'moment:vault-ttpd-the-tortured-poets-department',
        'moment:vault-midnights-karma-is-the-guy-on-the-chiefs-sung-with-travis-watching',
      ],
      year: 2024,
      month: 4,
      day: 13,
      category: 'sighting',
      title: 'Coachella, in a New Heights hat',
      snippet:
        'Days before TTPD dropped, she and Travis turned up in the Indio crowd — dancing to the Karma remix at Ice Spice\'s set and watching side-stage as Jack Antonoff played with Bleachers.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-travis-kelce-coachella-2024-photos-1235656317/',
      thumbnailUrl: null,
      moment: {
        context:
          'Coachella 2024, Weekend 1 Saturday (April 13): she wore a green New Heights cap for his podcast, he wore his usual white Happy Gilmore hat, and during Dom Dolla\'s DJ set he briefly lifted her off the ground so she could see over the crowd. A festival date night — reported as the couple\'s Coachella debut — six days out from a double album nobody knew was a double album yet.\n\nThe itinerary read like a loyalty tour: dancing in the Sahara-tent crowd through Ice Spice\'s set (just behind Sabrina Carpenter and Barry Keoghan) as the "Karma" remix played and Ice Spice shouted her out from the stage — "Shoutout to Taylor… I love you, and I love karma, too" — then watching from the Mojave stage\'s artist guest area as Jack Antonoff played with Bleachers, whom Kelce later raved about on New Heights ("my guy Jack Antonoff — he absolutely ripped it"). The night ran late — photographers caught the two at the Neon Carnival afterparty in Thermal, still in the matching-baseball-cap disguise that fooled no one. They were not reported returning for Weekend 2, which opened on TTPD\'s April 19 release day.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-travis-kelce-coachella-2024-photos-1235656317/',
            source_title: 'Taylor Swift & Travis Kelce Dance to Ice Spice, Support Jack Antonoff at Coachella 2024',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-travis-kelce-watch-ice-spice-bleachers-coachella-2024-1235004226/',
            source_title: 'Taylor Swift and Travis Kelce Dance to Ice Spice, Bleachers at Coachella 2024',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          // Depth pass (ledger #1435, 2026-07-24): Weekend 1 framing, the Ice Spice
          // on-mic shoutout and Carpenter/Keoghan detail, and Kelce's New Heights
          // account of the Bleachers set.
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/travis-kelce-coachella-taylor-swift-podcast-1235005946/',
            source_title: "Travis Kelce Had 'So Much Fun' Witnessing Coachella 'Madness' From the Pit With Taylor Swift",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): Billboard's lead photo of the couple at
        // Neon Carnival that night, hotlinked per the 2026-07-09 relaxed media
        // policy; credit per the article. Verified HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/04/Taylor-Swift-and-Travis-Kelce-coachella-2024-billboard-1548.jpg?w=1024',
            credit: 'Gilbert Flores/Billboard',
            caption: 'Taylor in the green New Heights cap and Kelce in the Happy Gilmore hat at Neon Carnival, Coachella weekend, April 13, 2024.',
            kind: 'primary',
          },
        ],
      },
    },

    // --- Content Shift pass (2026-07-15, ticket #654): the era's cold open.
    // Aug + Sep 2022 were the only empty months in the era's span — the VMAs
    // announcement and Midnights Mayhem are the two beats that start the
    // story. Sourcing note: direct page fetches were proxy-blocked this
    // session (every outlet host returned 403), so each claim below was
    // cross-confirmed across multiple independent web-search results instead
    // of a single fetched page; source URLs are real and search-verified.
    // No thumbnails/photos — hotlinks can't be liveness-checked this session
    // (house rule: verify before hotlinking).
    {
      year: 2022,
      month: 8,
      day: 28,
      category: 'release',
      title: '"Meet me at midnight": a new album, announced mid-acceptance-speech',
      snippet:
        'Accepting Video of the Year at the VMAs — her record third — Taylor drops it almost as an aside: the brand-new album is out October 21, and she\'ll "tell you more at midnight." She did.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-new-album-announcement-vmas-speech-1235132031/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Aug. 28, 2022 VMAs at Newark\'s Prudential Center gave All Too Well: The Short Film the night\'s top prize — Taylor\'s third career Video of the Year win, a VMAs record — and she spent the speech\'s last beat on something else entirely: "I thought it might be a fun moment to tell you that my brand new album comes out October 21. I will tell you more at midnight."\n\nAt midnight the reveal landed on her socials: Midnights, "the stories of 13 sleepless nights scattered throughout my life" — pitched as "a collection of music written in the middle of the night, a journey through terrors and sweet dreams," her first all-new album since folklore and evermore in 2020. The announcement itself was staged as lore: the stroke-of-midnight timing was the album\'s concept, performed in real time.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-new-album-announcement-vmas-speech-1235132031/',
          },
          {
            outlet: 'Deadline',
            url: 'https://deadline.com/2022/08/taylor-swift-new-album-release-date-mtv-vma-video-of-the-year-1235101906/',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-announces-new-album-1234583475/',
          },
        ],
        // Photo-enrichment pass (2026-07-18): the section note above predates
        // this session — these hotlinks WERE liveness-checked this run
        // (curl 200 + image/jpeg) and vision-confirmed against the VMAs 2022
        // set (MTV moonman backdrop visible in both). Both are from the page's
        // own cited articles.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2022/08/01-taylor-swift-2022-mtv-vmas-rc-billboard-1548.jpg?w=1024',
            credit: 'Getty Images via Billboard',
            caption:
              'The crystal-mesh Oscar de la Renta on the 2022 VMAs carpet — the night the Video of the Year speech turned into an album announcement.',
            kind: 'primary',
            focalPoint: '48% 15%',
          },
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2022/08/taylor-swift-new-album.jpg?w=1600&h=900&crop=1',
            credit: 'Getty Images via Rolling Stone',
            caption:
              'In the VMAs press room minutes later — jeweled eye makeup, and a brand-new album on the calendar for October 21.',
            kind: 'primary',
            focalPoint: '50% 40%',
          },
        ],
      },
    },
    {
      year: 2022,
      month: 9,
      day: 21,
      category: 'music',
      title: 'Midnights Mayhem with Me: fate, a bingo cage, and thirteen ping-pong balls',
      snippet:
        'No cryptic clues this time — a TikTok series where a bingo cage full of numbered balls decides which track title Taylor announces into a red phone. First ball out: 13. "Track 13 is called Mastermind." Of course it was.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-midnights-song-title-track-13-mastermind-1235142141/',
      thumbnailUrl: null,
      moment: {
        context:
          'Launched at midnight ET on Sep. 21, 2022, the TikTok series ran on one gloriously lo-fi mechanic: thirteen ping-pong balls in a bingo cage — "this technologically advanced device," as Taylor put it — "to help me allow fate to decide exactly what track titles I\'m going to be announcing, and in what order." A ball drops, she lifts a red phone receiver, and a title is read out. Episode one drew ball 13 and gave the era its thesis statement: "Mastermind."\n\nThirteen episodes later the series wrapped on Oct. 7, the final titles posted an hour apart — album opener "Lavender Haze," "You\'re On Your Own, Kid," "Labyrinth," "Sweet Nothings," and "Snow On The Beach" with Lana Del Rey — completing the tracklist two weeks before release. It became the rollout\'s defining fan ritual: appointment-viewing at midnight for a lottery ball.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-midnights-song-title-track-13-mastermind-1235142141/',
          },
          {
            outlet: 'NME',
            url: 'https://www.nme.com/news/music/taylor-swift-midnights-album-tracklist-3314098',
          },
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/music/taylor-swift-midnights-tracklist-song-names-rcna50738',
          },
        ],
      },
    },

    // ── Migrated from content.ts RAW (consolidation stage 2a, 2026-07-19) ──
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "midnights-album",
      year: 2022,
      month: 10,
      day: 21,
      category: "music",
      title: "Thirteen sleepless nights",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-mid-1", label: "Midnights released", kind: "album" },
      // Cross-links (ledger #1269, 2026-07-24): the rollout reveal, the 3am
      // surprise, the top-ten sweep, and the Grammy payoff this album won.
      relatedIds: [
          'moment:vault-midnights-anti-hero-dominates',
        'moment:vault-midnights-a-record-fourth-album-of-the-year-grammy-for-midnights',
        'moment:vault-midnights-the-3am-edition-surprise',
        'moment:vault-midnights-midnights-mayhem-with-me-a-bingo-cage-announces-the-tracklis',
        'moment:vault-midnights-every-top-ten-slot-at-once',
      ],
      snippet: "A return to pop as a diary of midnights across her life.",
      moment: {
        context:
          'Announced at the Aug. 28, 2022 MTV VMAs — minutes after she won Video of the Year for the "All Too Well" short film — under a "Meet Me At Midnight" tagline, Taylor called the album "the stories of 13 sleepless nights scattered throughout my life." She built it almost entirely with Jack Antonoff, who co-wrote 11 of the 13 tracks, with additional production from Sounwave, Jahaan Sweet and Keanu Beats; the surprise "3am Edition" added seven more songs, several co-produced by Aaron Dessner. Its retro-glam synth-pop swapped the folklore/evermore woods for a 1970s bedroom-diary mood, and Beth Garrabrant — her cover photographer since folklore — shot the lighter-flame cover on film. The album\'s lone standard-edition guest is Lana Del Rey on "Snow on the Beach," later reissued as a "feat. More Lana Del Rey" mix after fans wanted her louder. Four collectible vinyl variants — Moonstone Blue, Jade Green, Mahogany and Blood Moon — were designed so their back covers assemble into a clock face. Critics received it warmly (Metacritic 85; Pitchfork 7.0), and it rewrote records: the first album to hold all ten of the Hot 100\'s top spots at once, and, at the 2024 Grammys, Album of the Year — Taylor\'s record fourth, more than any artist in history. It opened at No. 1 with 1.578 million first-week units — the biggest week for any album since Adele\'s 25 in 2015 — and spun off four hits: "Anti-Hero" (a No. 1 that ruled the Hot 100 for eight weeks, her longest solo reign to that point), "Lavender Haze" and "Karma" (both No. 2), and "Snow on the Beach" (No. 4).',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Midnights',
            source_title: 'Midnights',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-24',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-all-hot-100-top-10-anti-hero-1235163664/',
            source_title: 'Taylor Swift Makes History as First Artist to Claim Entire Top 10 of the Hot 100',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'NME',
            url: 'https://www.nme.com/news/music/taylor-swift-reveals-collectable-editions-of-midnights-on-cd-and-vinyl-3303014',
            source_title: "Taylor Swift reveals collectable editions of 'Midnights' on CD and vinyl",
            publisher: 'NME',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
          },
          {
            outlet: 'GRAMMY.com',
            url: 'https://www.grammy.com/news/taylor-swift-album-of-the-year-2024-grammys-speech',
            source_title: 'Taylor Swift Wins Album Of The Year For Midnights At The 2024 GRAMMYs',
            publisher: 'The Recording Academy',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-midnights-debut-number-one-billboard-200-albums-chart-1235163377/',
            source_title: 'Taylor Swift’s ‘Midnights’ Debuts at No. 1 With Biggest Week for an Album Since 2015',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-anti-hero-eighth-week-number-one-zach-bryan-top-10-1235199856/',
            source_title: 'Taylor Swift’s ‘Anti-Hero’ Spends an Eighth Week at No. 1 on the Hot 100',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
        ],
        // Depth pass (ledger #1269, 2026-07-24): the album cover is the exact
        // subject of the release page; Wikipedia's stable copy, verified this
        // session HTTP 200 + image/png (the same file already vetted in-repo).
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Midnights_-_Taylor_Swift.png',
            credit: 'Republic Records',
            caption: 'The lighter-flame cover, shot on film by Beth Garrabrant — the album released Oct. 21, 2022.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "midnights-3am",
      // Cross-link (candidate #1336): the standard Midnights whose 3am edition this extends.
      relatedIds: ['moment:vault-midnights-thirteen-sleepless-nights'],
      year: 2022,
      month: 10,
      day: 22,
      category: "music",
      title: "The 3am edition surprise",
      snippet: "Seven extra tracks land three hours after release, a now-signature move.",
      moment: {
        context: "Hours after midnight, a “3am Edition” expanded the album — rewarding the fans who stayed up.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "midnights-antihero",
      year: 2022,
      month: 10,
      day: 24,
      category: "music",
      title: "“Anti-Hero” dominates",
      snippet: "A candid single about self-doubt becomes her biggest solo hit in years.",
      video: { youtubeId: "b1kbLwvqugk", title: "Taylor Swift - Anti-Hero (Official Music Video)" },
      // Cross-links (ledger #1355, 2026-07-24): the album it led, the single-day
      // Spotify record it helped set, and the top-ten sweep it anchored.
      // Candidate #1356 (2026-07-25): the self-directed video for the same song.
      // Cross-link (candidate #1536, 2026-07-26): the bidirectional partner to the
      // richer, sourced "Every spot in the Hot 100 top 10, all at once" moment.
      // NOTE: 'every-top-ten-slot-at-once' below is a legacy stub of the SAME feat
      // (a duplicate flagged for a human, not resolved here).
      relatedIds: [
        'moment:vault-midnights-thirteen-sleepless-nights',
        'moment:vault-midnights-midnights-breaks-spotify-in-a-single-day',
        'moment:vault-midnights-every-top-ten-slot-at-once',
        'moment:vault-midnights-every-spot-in-the-hot-100-top-10-all-at-once',
        'moment:vault-midnights-the-anti-hero-video-and-the-scale-scene-that-got-cut',
      ],
      moment: {
        context:
          '“Anti-Hero” — written and produced by Taylor Swift and Jack Antonoff — was the lead single and the emotional center of Midnights; Taylor called it "a guided tour of all the things I tend to hate about myself," her most detailed reckoning with her own insecurities. It debuted at No. 1 on the Hot 100 (dated Nov. 5, 2022), the anchor of her history-making sweep of the chart\'s entire top 10, then held the summit for eight weeks — passing "Blank Space" to become her longest-running solo No. 1 to that point — and topped the UK, Australian and Canadian charts too. Its first day drew 17.4 million Spotify streams, the third-biggest single-day song total then on record.\n\nCritics made it the album\'s standout — Pitchfork heard "the lacquered synth-pop of 1989, the neurotic image analysis of reputation, the dense lyricism of folklore and evermore" folded into one song — and it placed high on year-end lists (No. 2 at USA Today and Slant, No. 5 at Billboard). It won Song of the Year at the 2023 VMAs and the iHeartRadio Awards; at the 2024 Grammys it was up for Record and Song of the Year — Taylor\'s record seventh Song of the Year nod — but won neither. It is certified 4× Platinum in the UK and 8× in Australia.\n\nLive, it first surfaced as a surprise guest turn at The 1975\'s London O2 show (Jan. 12, 2023) before settling into a fixed slot in the Eras Tour\'s Midnights act. Its self-lacerating hook — "It\'s me, hi, I\'m the problem, it\'s me" — became one of TikTok\'s defining sounds, drawing 120,000+ videos within days of release.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-anti-hero-eighth-week-number-one-zach-bryan-top-10-1235199856/',
            source_title: "Taylor Swift's 'Anti-Hero' Spends an Eighth Week at No. 1 on the Hot 100",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'TODAY',
            url: 'https://www.today.com/popculture/music/taylor-swift-anti-hero-song-meaning-midnights-rcna50503',
            source_title: 'Taylor Swift explains the meaning behind “Anti-Hero”',
            publisher: 'TODAY',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Guinness World Records',
            url: 'https://www.guinnessworldrecords.com/news/2022/10/taylor-swifts-album-midnights-smashes-three-spotify-records-723058',
            source_title: "Taylor Swift's album Midnights smashes three Spotify records",
            publisher: 'Guinness World Records',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/pop-culture/grammys-2024-running-list-winners-rcna136890',
            source_title: 'Grammys 2024: The full list of winners',
            publisher: 'NBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2022/music/album-reviews/taylor-swift-midnights-album-review-1235410102/',
            source_title: 'Album Review: Taylor Swift’s ‘Midnights’',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Anti-Hero_(song)',
            source_title: 'Anti-Hero (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-24',
            reliability_score: 2,
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "midnights-chart-record",
      year: 2022,
      month: 11,
      day: 5,
      category: "sighting",
      // Cross-link (candidate #1357, 2026-07-25): the lead single that anchored the sweep.
      relatedIds: ['moment:vault-midnights-anti-hero-dominates'],
      title: "Every top-ten slot at once",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-mid-1b", label: "Entire top ten", kind: "award" },
      snippet: "She becomes the first artist to monopolize the entire top ten of the Hot 100.",
      moment: {
        context: "The album’s dominance rewrote the record books, occupying all ten of the chart’s highest positions in a single week.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "midnights-ticket-chaos",
      year: 2022,
      month: 11,
      day: 15,
      category: "sighting",
      title: "The ticket frenzy",
      snippet: "Unprecedented demand for the Eras Tour crashes the sales system and reaches Washington.",
      moment: {
        context: "The scramble for tickets became a national news story — and eventually a subject of political hearings.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "midnights-film",
      year: 2023,
      month: 10,
      day: 13,
      category: "tour",
      title: "The Eras Tour hits cinemas",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-mid-3", label: "Eras Tour film", kind: "tour" },
      snippet: "A concert film breaks box-office records for the format.",
      moment: {
        context: "Bypassing traditional studios, the concert film became the highest-grossing of its kind, extending the tour’s reach worldwide.",
        // Photo pass #762 (2026-07-19): ABC News' own CDN (i.abcnewsfe.com,
        // from GMA's world-premiere story); curl 200 image/jpeg 3072x3071;
        // Read-viewed: Swift in the tanzanite Oscar de la Renta gown on the
        // premiere carpet, "Taylor Swift: The Eras Tour" step-and-repeat
        // behind her (The Grove, Los Angeles, Oct. 11, 2023).
        photos: [
          {
            url: 'https://i.abcnewsfe.com/a/64e8b004-20de-4b7b-9296-b1f46aac00ee/taylor-swift-01-ss-jt-231011_1697075963440_hpEmbed_1x1.jpg',
            credit: 'Via ABC News',
            caption: 'The world premiere at The Grove, Oct. 11, 2023 — where she announced the film would open a day early.',
            focalPoint: '52% 22%',
          },
        ],
      },
    },

    // ── Migrated from the End Game thread's hand-authored beat list (stage 3,
    // 2026-07-19): the WSJ confirmation was a beat with no vault moment — the
    // only one — so it becomes a real moment; the thread now derives fully
    // from tagged moments. Beat text carried verbatim; wsjshop.com cover
    // image verified HTTP 200 + image/jpeg this session (the beat's other
    // option was a watermarked Getty comp, dropped per the image protocol).
    {
      slug: 'prop-wsj-confirm',
      year: 2023,
      month: 11,
      // Date corrected 2026-07-24 (ledger #1280, Q2): the WSJ. Magazine
      // interview published Nov. 20, 2023 (CNN/TODAY/NBC all dated Nov. 20;
      // print was the Dec/Jan cover). Was 2023-11-01, which mis-sorted it
      // BEFORE the Nov. 11 Buenos Aires on-stage acknowledgment; verified
      // against TODAY and The Philadelphia Inquirer before changing the field.
      day: 20,
      category: 'relationship',
      threadIds: ['the-proposal'],
      // Cross-links (ledger #1280, Q6): the friendship-bracelet origin beat it
      // retells, and her Nov. 11 on-stage acknowledgment it followed.
      relatedIds: [
        'moment:vault-midnights-the-friendship-bracelet-travis-couldnt-deliver',
        'moment:vault-midnights-karma-is-the-guy-on-the-chiefs-sung-with-travis-watching',
      ],
      title: 'Travis confirms it, on the record',
      snippet: 'In a Nov. 20, 2023 WSJ. Magazine cover story, Travis gave his first extended sit-down about the relationship — retelling the failed friendship-bracelet meet-cute and speaking candidly about the scrutiny that came with dating her.',
      sourceUrl: 'https://www.wsj.com/style/travis-kelce-interview-taylor-swift-chiefs-9d7943ac',
      thumbnailUrl: 'https://wsjshop.com/cdn/shop/files/WSJmag120923_1024x1024@2x.jpg?v=1702301778',
      moment: {
        context:
          'Published Nov. 20, 2023 as WSJ. Magazine\'s December cover story — written by Pulitzer winner J.R. Moehringer, fresh off ghost-writing Prince Harry\'s memoir — this was Travis\'s first extended sit-down about the relationship, not his first word on it: he had already told the bracelet story on his New Heights podcast that July. He recapped how it began, saying he had "somebody playing Cupid" after failing to hand her a friendship bracelet at her Kansas City Eras show, and that she "told me exactly what was going on and how I got lucky enough to get her to reach out." Of their first New York dinner: "We had already kind of been talking, so I knew we could have a nice dinner and, like, a conversation." He put it plainly — "I\'ve never dated anyone with that kind of aura about them" — and spoke to the scrutiny it brought: "The scrutiny she gets, how much she has a magnifying glass on her, every single day, paparazzi outside her house... she\'s just living, enjoying life. When she acts like that I better not be the one acting all strange." Photographed by Gregory Harris for the cover, the interview was picked up within hours by CNN, TODAY and NBC News. It landed nine days after her own on-stage acknowledgment — the Nov. 11 "Karma is the guy on the Chiefs" line in Buenos Aires — so the print confirmation followed her public one, not the other way around.',
        sources: [
          {
            outlet: 'WSJ. Magazine',
            url: 'https://www.wsj.com/style/travis-kelce-interview-taylor-swift-chiefs-9d7943ac',
            source_title: 'How Travis Kelce Manifested the Best Year of His Life',
            publisher: 'WSJ. Magazine',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'TODAY',
            url: 'https://www.today.com/popculture/travis-kelce-dating-taylor-swift-wsj-magazine-rcna125990',
            source_title: 'Travis Kelce dishes on dating Taylor Swift to WSJ. Magazine',
            publisher: 'TODAY',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'The Philadelphia Inquirer',
            url: 'https://www.inquirer.com/entertainment/travis-kelce-wall-street-journal-interview-taylor-swift-20231120.html',
            source_title: 'Travis Kelce talks relationship with Taylor Swift in new Wall Street Journal interview',
            publisher: 'The Philadelphia Inquirer',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://wsjshop.com/cdn/shop/files/WSJmag120923_1024x1024@2x.jpg?v=1702301778',
            credit: 'Gregory Harris/WSJ. Magazine',
            caption: 'The WSJ. Magazine cover interview where Travis spoke to the relationship on the record.',
            // Focal point set 2026-07-19 (photo-enrichment run 10, #762) by
            // viewing: portrait magazine cover, Travis's hooded face fills the
            // upper-middle with eyes about a quarter down the frame.
            focalPoint: '55% 28%',
          },
        ],
      },
    },
  ],
};
