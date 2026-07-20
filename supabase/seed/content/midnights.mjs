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
          'The takeover ran nightly at midnight from Oct. 21 through Oct. 26, 2022, airing the complete album on iHeartRadio stations nationwide plus the Hit Nation and Today\'s Mix stations on the iHeartRadio app — with Swift herself supplying behind-the-scenes commentary on the songs between tracks. Her framing for the special matched the album\'s pitch: "a collection of music written in the middle of the night," representing "13 sleepless nights scattered throughout my life."\n\nThe radio play came with a fan hook, too: each night carried a code word listeners could enter at iHeartRadio\'s Taylor Swift page for a chance to win merchandise autographed by Swift. It was one spoke of a saturation-level release week that also included the lyric-billboard partnership with Spotify and the "Anti-Hero" video dropping eight hours after the album.',
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
          "The 184.6 million album streams blew past the single-day record Drake's Certified Lover Boy had set at 153.4 million in 2021, and the 228 million catalog-wide streams took the most-streamed-artist-in-a-day mark from Bad Bunny, who'd held it since May 2022 at 183 million. Guinness World Records logged the day as three records at once: most-streamed album in 24 hours, most day-one streams for an album, and most-streamed act in a single day.\n\nThe launch had a runway, too — Spotify and Swift had partnered to reveal Midnights lyrics on billboards around the world in the lead-up to release, her fifth album in roughly two years.",
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
              'One of the "Meet us at midnight" billboards Spotify ran with Swift in the lead-up to release — this one over a rainy London staircase, counting down to the drop that broke the platform\'s single-day records.',
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
      title: 'Midnights debuts at No. 1 on the Billboard 200',
      snippet:
        "1.578 million equivalent units in week one — Swift's 11th No. 1 album, tying Barbra Streisand for the most by a woman.",
      sourceUrl:
        'https://www.billboard.com/music/chart-beat/taylor-swift-midnights-debut-number-one-billboard-200-albums-chart-1235163377/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2022/10/02-taylor-swift-midnights-cr-Beth-Garrabrant-billboard-1548.jpg?w=1024',
      moment: {
        context:
          "The 1.578 million units broke down to 1.14 million in pure sales — 575,000 of them on vinyl — at the time the biggest vinyl week since electronic tracking began in 1991, a record she would go on to break repeatedly — plus 549 million on-demand streams, the third-largest streaming week any album had ever posted. It was the largest week for any album since Adele's 25 in 2015, and it made Swift the only artist in history with five different albums that each sold a million copies in a single week.\n\nThe 11th No. 1 tied Barbra Streisand for the most Billboard 200 chart-toppers by a woman — a tie Swift would break eight months later when Speak Now (Taylor's Version) became her 12th.",
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
      title: "The 'Anti-Hero' video, and the scale scene that got cut",
      snippet:
        "Three versions of herself confronting body image and insecurity — including a scale reading 'fat' that got edited out after online criticism.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Anti-Hero_(song)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Taylor_Swift_-_Anti-Hero.png',
      moment: {
        context:
          "Swift wrote and directed the video herself and premiered it on YouTube eight hours after the song dropped, reuniting with cinematographer Rina Yang. It splits her in three — a 'current' Taylor in a 1970s-style suburban kitchen, an early-2010s version in a tour dance outfit, and a giant who crawls into a neighbor's dinner party — and peaks with a dream-sequence funeral where Mike Birbiglia, John Early, and Mary Elizabeth Ellis, as her sons and daughter-in-law, discover she's left them each 13 cents (the real assets went to the cats).\n\nThe scale scene — one Taylor stepping on a bathroom scale that reads 'fat' while another shakes her head, an allusion to her past struggles with eating disorders — was edited out after online criticism, a cut that drew its own backlash from commentators arguing she shouldn't have to sanitize her own trauma. She's described the song as coming from feeling her life had become 'unmanageably sized' and struggling 'with the idea of not feeling like a person' — a 'guided tour' through the things she hates about herself.",
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
          '"Now That We Don\'t Talk" was written late in the original 1989 sessions and cut for a purely technical reason, as Swift explained around the re-record\'s release: "It was so hard to leave it behind, but I think we wrote it a little bit towards the end of the process, and we couldn\'t get the production right at the time." Nine years of studio evolution later, the re-recording sessions gave her and her collaborators the room to finally land the synth-pop-and-disco sound the song was reaching for.\n\nAt 2 minutes and 31 seconds it stands as one of the shortest songs in her entire catalog — but, in her telling, one that "packs a punch" and makes its point without overstaying. Released Oct. 27, 2023 on 1989 (Taylor\'s Version), nine years to the day after the original album, it landed among the From the Vault tracks with fans widely speculating it references her past relationship with Harry Styles — the reading Uproxx logged the week it dropped.',
        sources: [
          { outlet: 'Uproxx', url: 'https://uproxx.com/pop/why-now-that-we-dont-talk-not-on-1989-original/' },
        ],
        // Real-photo pass (2026-07-09): the album the vault track finally landed on.
        // Wikipedia's stable upload.wikimedia.org copy; verified HTTP 200 + image/png.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/d/d5/Taylor_Swift_-_1989_%28Taylor%27s_Version%29.png',
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
              "The wide key art from the film's official trailer on Swift's own channel — the Lover-set bodysuit against the theatrical campaign's watercolor backdrop.",
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
            credit: 'John Shearer/Getty Images for TAS Rights Management, via FOX 11 Los Angeles',
            caption: 'Arms outstretched with a pink sequined guitar, in the sparkling fringe bodysuit worn for the Lover set.',
            kind: 'primary',
          },
          {
            url: 'https://images.foxtv.com/static.foxla.com/www.foxla.com/content/uploads/2023/03/932/524/GettyImages-1474271127-copy.jpg?tl=1&ve=1',
            credit: 'John Shearer/Getty Images for TAS Rights Management, via FOX 11 Los Angeles',
            caption: 'In a glittering silver blazer dress and knee-high boots, flanked by suited backup dancers in front of the reputation set\'s office-desk backdrop.',
            kind: 'primary',
          },
          {
            url: 'https://images.foxtv.com/static.foxla.com/www.foxla.com/content/uploads/2023/03/932/524/GettyImages-1474459817-copy.jpg?tl=1&ve=1',
            credit: 'John Shearer/Getty Images for TAS Rights Management, via FOX 11 Los Angeles',
            caption: 'Swift performs during another costume-and-set chapter of the Eras Tour\'s opening night.',
            kind: 'primary',
          },
          {
            url: 'https://images.foxtv.com/static.foxla.com/www.foxla.com/content/uploads/2023/03/932/524/GettyImages-1474275193-copy.jpg?tl=1&ve=1',
            credit: 'John Shearer/Getty Images for TAS Rights Management, via FOX 11 Los Angeles',
            caption: 'Seated atop the moss-covered folklore cabin\'s peaked roof, its chimney smoking, for the acoustic folklore set.',
            kind: 'primary',
          },
          {
            url: 'https://images.foxtv.com/static.foxla.com/www.foxla.com/content/uploads/2023/03/932/524/GettyImages-1474275197-copy.jpg?tl=1&ve=1',
            credit: 'John Shearer/Getty Images for TAS Rights Management, via FOX 11 Los Angeles',
            caption: 'Swift performs in a separate Getty image from the Eras Tour\'s first night at State Farm Stadium.',
            kind: 'primary',
          },
          {
            url: 'https://neon.reviewjournal.com/wp-content/uploads/2023/03/17580620_web1_Taylor-Swift-Eras-Tour-Opener-Glendale-Ariz_.jpg',
            credit: 'Ashley Landis/AP, via Las Vegas Review-Journal',
            caption: 'Swift performs during the opening Eras Tour concert at State Farm Stadium on March 17, 2023.',
            kind: 'primary',
          },
          {
            url: 'https://neon.reviewjournal.com/wp-content/uploads/2023/03/17580620_web1_Taylor-Swift-Eras-Tour-Opener-Glendale-Ariz_-31.jpg',
            credit: 'Ashley Landis/AP, via Las Vegas Review-Journal',
            caption: 'A second AP frame captures Swift during the opening-night Glendale performance.',
            kind: 'primary',
          },
          {
            url: 'https://neon.reviewjournal.com/wp-content/uploads/2023/03/17580620_web1_Taylor-Swift-Eras-Tour-Opener-Glendale-Ariz_-28.jpg',
            credit: 'Ashley Landis/AP, via Las Vegas Review-Journal',
            caption: 'A third Ashley Landis frame shows Swift performing at the Eras Tour opener.',
            kind: 'primary',
          },
          {
            url: 'https://neon.reviewjournal.com/wp-content/uploads/2023/03/17580620_web1_Taylor-Swift-Eras-Tour-Opener-Glendale-Ariz_-23.jpg',
            credit: 'Ashley Landis/AP, via Las Vegas Review-Journal',
            caption: 'A fourth distinct AP image records Swift onstage during the March 17 Glendale show.',
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
      title: 'Glendale becomes Swift City for the weekend',
      snippet:
        'The mayor made it official: Glendale, Arizona was Swift City for March 17 and 18 — Eras Tour opening weekend.',
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
            caption: 'State Farm Stadium in Glendale, Arizona — photographed in 2006, when it was still Cardinals Stadium — the venue Swift became the first act ever to sell out twice on a single tour.',
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
          "For the 1989 act of opening night, Swift wore a sequined Roberto Cavalli two-piece set with knee-high Christian Louboutin boots — one of the marathon's roughly dozen-plus documented looks across a 44-song, 3-hour-15-minute show that touched all ten studio albums. Billboard's night-one gallery logged the look with a John Shearer photo, one of three photographers (with Kevin Winter and Kevin Mazur) credentialed to shoot the costume parade.\n\nLouboutin boots, meanwhile, ran through nearly every act of the night — the gallery credits the same bootmaker on the Lover, Fearless, and evermore looks and on the navy Oscar de la Renta bodysuit that closed the Midnights set. Roberto Cavalli did double duty too, dressing this act, the gold-fringe Fearless set, and the reputation catsuit in a single show.",
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
      relatedIds: ['moment:vault-ttpd-an-endorsement-signed-childless-cat-lady'],
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
        context:
          'The pick capped the exact year the citation ran through: an Eras Tour so big the Federal Reserve noted its boost to tourism, a concert film AMC was already calling the highest-grossing ever after a $90 million-plus domestic opening weekend, billionaire status reached that fall — helped by 1989 (Taylor\'s Version) — and the title of Spotify\'s most-streamed artist of 2023.\n\nHer full line to Time ended with a wink at the spectacle of it all: "Ultimately, we can convolute it all we want, or try to overcomplicate it, but there\'s only one question... Are you not entertained?"',
        sources: [
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-time-2023-person-of-the-year/',
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/conormurray/2023/12/06/every-major-event-in-taylor-swifts-record-breaking-2023-from-the-eras-tour-to-time-person-of-the-year/',
          },
        ],
        photos: [
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
      relatedIds: ['moment:vault-midnights-the-game-the-world-decided-made-it-official'],
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
            caption: 'Swift performing the Midnights set on the Eras Tour, the album era during which the breakup was confirmed.',
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
          'Never confirmed on the record by either party — but the history ran back nearly a decade. They met at a 1975 show in Los Angeles in November 2014 and exchanged numbers, Healy spent 2015–16 alternately stoking and batting down romance rumors, and in September 2022 he revealed the band had recorded a Midnights collaboration with Swift that didn\'t make the album.\n\nIn January 2023 she surprise-joined the 1975 onstage in London to debut "Anti-Hero" live; by May, weeks after the Alwyn split, he was at her Nashville Eras Tour shows and sources had them reconnecting through Jack Antonoff. By early June it was done — "they are both extremely busy and realized they\'re not really compatible," one source said — though a year later, fans combed The Tortured Poets Department for songs they read as being about him.',
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
            caption: 'Matty Healy fronting The 1975 at Lollapalooza in summer 2023, weeks after the rumored month with Swift fizzled.',
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
          'He told the story on the July 26, 2023 episode of his own New Heights podcast, a few weeks after attending her Arrowhead Eras Tour stop: leaning into the tour\'s friendship-bracelet tradition, he\'d made one carrying his phone number and planned to hand it to her. It never happened — "I was disappointed that she doesn\'t talk before or after her shows because she has to save her voice for the 44 songs that she sings, so I was a little butt-hurt I didn\'t get to hand her one of the bracelets I made for her."\n\nHis kicker on the episode: "She doesn\'t meet anybody, or at least she didn\'t want to meet me, so I took it personal." The public sulk turned out to be the play of the year — the clip went wide, people in Swift\'s circle took notice, and by his own later account in WSJ. Magazine, mutual contacts "working in his corner" after the bracelet story got the two of them talking before they ever met.',
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
            caption: 'Swift cheers beside Donna Kelce from a suite as the Chiefs play the Bears at Arrowhead on Sept. 24, 2023.',
            kind: 'primary',
          },
          {
            url: 'https://media.vanityfair.com/photos/6511b258c700cad4c4f82633/master/w_2560%2Cc_limit/Taylor-Swift.jpg',
            focalPoint: '50% 26%',
            credit: 'Jason Hanna/Getty Images, via Vanity Fair',
            caption: 'Swift reacts from the Arrowhead suite during the first Chiefs game she attended.',
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
            caption: 'Swift watches the game with Travis Kelce\'s mother, Donna, in a separate suite photograph from Sept. 24.',
            kind: 'primary',
          },
          {
            url: 'https://imagez.tmz.com/image/cc/4by3/2023/09/25/cc266e4c1e8646149db60f4c03b795ce_md.jpg',
            focalPoint: '50% 22%',
            credit: 'TMZ.com',
            caption: 'Swift enters Arrowhead in a Chiefs windbreaker, escorted by a member of Kelce\'s public-relations team.',
            kind: 'primary',
          },
          {
            url: 'https://imagez.tmz.com/image/02/16by9/2023/09/25/02f6bdca4be649f58c60466f10fc0115_md.jpg',
            focalPoint: '50% 40%',
            credit: 'X/@paytonsun, via TMZ',
            caption: 'Swift and Kelce walk out of Arrowhead side by side after the Chiefs\' win.',
            kind: 'primary',
          },
          {
            url: 'https://imagez.tmz.com/image/98/4by3/2023/09/25/984b4d79ebce419cbcef97777e65d904_md.jpg',
            focalPoint: '48% 40%',
            credit: 'TMZ.com',
            caption: 'Swift and Kelce leave Arrowhead together in his metallic purple convertible after the game.',
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
              "The art for 'Cruel Summer (Live from Taylor Swift | The Eras Tour)' — the live single Swift released Oct. 18, 2023, in the final push that carried the four-year-old song to No. 1.",
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
          "The Jan. 13, 2024 Wild Card game against Miami was played in air so cold it entered the record books among the coldest games in NFL history — and the jacket she wore into it became the night's biggest star. The custom red puffer, stitched with Kelce's name and \"87,\" was made by Kristin Juszczyk, wife of 49ers fullback Kyle Juszczyk; Swift finished the look with heavy-duty Christian Louboutin boots and a Manu Atelier bag.\n\nThe puffer went so viral — with a matching Mahomes version on Brittany Mahomes in the same suite — that within weeks Juszczyk had an official NFL apparel licensing deal, one of the cleanest examples of the \"Taylor effect\" converting a single broadcast cutaway into a business. The Chiefs won and moved on, starting the playoff run that ended in Las Vegas.",
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
      },
    },
    {
      year: 2024,
      month: 2,
      day: 4,
      category: 'business',
      significance: 'defining', // most Album of the Year wins ever, breaking her own tie with music history's biggest names (docs/decisions.md, 2026-07-19)
      relatedIds: [
        'moment:vault-fearless-fearless-makes-her-the-youngest-album-of-the-year-winner-for',
        'moment:vault-1989-1989-wins-album-of-the-year-making-her-the-first-woman-to-wi',
        'moment:vault-folklore-folklore-makes-her-the-first-woman-to-win-album-of-the-year-',
      ],
      title: 'A record fourth Album of the Year Grammy, for Midnights',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-mid-3b", label: "Record 4th AOTY", kind: "award" },
      snippet: 'Presented by Céline Dion in a rare public appearance — Swift\'s fourth AOTY win, more than any artist in Grammy history.',
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
        "Swift's pink-toned Lover era on opening night was a Versace bodysuit paired with knee-high Christian Louboutin boots.",
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
      },
    },
    {
      year: 2023,
      month: 3,
      day: 17,
      category: 'fashion',
      title: 'A magenta Jessica Jones gown for the surprise-song set',
      snippet: 'For the acoustic surprise-song portion of the night, Swift stunned in a magenta Jessica Jones dress.',
      sourceUrl: 'https://www.billboard.com/photos/taylor-swift-the-eras-tour-night-one-outfits-1235289639/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2023/03/taylor-swift-eras-tour-acoustic-guitar-march-17-2023-billboard-1548.jpg',
      moment: {
        context:
          "The acoustic set is where Swift plays two surprise songs each night, swapped every show — and on opening night the segment got its own dedicated gown: a magenta Jessica Jones dress, photographed by Kevin Mazur — acoustic guitar in hand — for Billboard's look-by-look gallery.\n\nBecause the surprise-song slot changed nightly, its dress became a look fans tracked closely show to show — a stripped-down, one-instrument reset in the middle of a production numbering 44 songs and over three hours, and the segment where set-list watchers got their nightly payoff.",
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
      },
    },

    // --- G-A depth pass: Active-month payoff beats (2026-07-15)
    {
      slug: 'all-too-well-grammy-best-music-video',
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
          'Von Teese told Billboard it was a "true pleasure" working with Swift, who she coached on the burlesque choreography for the "Bejeweled" video\'s giant-martini-glass scene, alongside Swift\'s longtime stylist Joseph Cassell and burlesque costumer Catherine D\'Lish.\n\nSeparately, makeup artist Pat McGrath — who cameos in the video as "Queen Pat" — told E! she created about 30 different looks for the shoot, including a contoured red ombré lip built from three products (Legendary Wear Matte Lipstick in "Elson 4" and PermaGel Ultra Glide Lip Pencils in Deep Dive and Blood Lust), plus a jeweled smoky cat-eye using an unreleased shadow palette from her own line.',
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
            caption: "Swift performing the Red set on the Eras Tour, wearing the MAC Locked Kiss 24HR lipstick in \"Ruby True\" that became her signature stage lip.",
            kind: 'fashion',
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
          'The white silky slip has floral lace at the neckline and thigh-skimming cutouts along the hem, under the Free People Renata Faux Fur Coat; other looks in the video include an oversized T-shirt worn as a dress and a separate 70s-inflected knit top.\n\nThe video, which Swift wrote and directed, leans fully into a groovy, retro aesthetic — loose beachy waves, shag bangs, and warm-toned glam.',
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
          "The early-November 2023 dinner at Bond Street, the Japanese restaurant in NoHo, assembled a notably current version of the squad: Selena Gomez on one arm, Brittany Mahomes' hand in hers, with Sophie Turner, Gigi Hadid, and Cara Delevingne walking out just behind — the frame TMZ's cameras caught becoming the night's defining image.\n\nThe guest list was the story. Brittany Mahomes' presence marked how completely the Kansas City circle had merged with the longtime friend group within six weeks of the first Chiefs game, while Sophie Turner's spot in the lineup, in the middle of her very public divorce proceedings that fall, read as a deliberate closing of ranks. Days later, Swift flew south for the Buenos Aires leg of the tour.",
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
          "The day ran football-first: she watched the Chiefs close out 2023 by beating Cincinnati 25-17 on Dec. 31, then the couples reconvened for a New Year's Eve party where a midnight kiss with Travis — caught on fan video — did the year-in-review headline writing for every outlet in the celebrity press.\n\nThe four-person photo was the artifact that lasted: Swift with a drink in one hand and the other arm wrapped around Kelce, leaning into Brittany Mahomes' hug while Patrick beamed alongside — a frame that blew past a million views almost immediately. The comments wrote themselves; as one viral reply put it, she had \"one hand on her drink the other on her man... girl has her priorities straight.\"",
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
          'In an Instagram video explaining the song, Swift said: "I happened upon the phrase \'lavender haze\' when I was watching Mad Men. And I looked it up because I thought it sounded cool, and it turns out that it\'s a common phrase used in the \'50s where they would just describe being in love... If you were in the lavender haze, then that meant that you were in that all-encompassing love glow."\n\nShe tied it directly to her own six-year relationship with Joe Alwyn: "My relationship for six years, we\'ve had to dodge weird rumors, tabloid stuff, and we just ignore it... this song is sort of about the act of ignoring that stuff to protect the real stuff."',
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
          '"Sweet Nothing" is credited to Swift and William Bowery — the pseudonym Alwyn had already used on folklore and evermore — with Jack Antonoff co-producing. He explained the name\'s origin on The Kelly Clarkson Show: "It was a combination of William... my great-grandfather — who I actually never met — [who] was a composer. He wrote a lot of classical music, and he wrote a lot of film scores. And then Bowery is the area in New York that I spent a lot of time in when I first moved over there."\n\nHe and Swift chose to write under a shared pseudonym, he said, "so the people, first and foremost, would listen to the music first before dissecting the fact that we did it together." The song itself leans into small, sheltered domestic memories — a pebble collected on a trip to Wicklow, quiet moments at home — as a refuge from "cunning" outsiders and her own critical inner voice.',
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
          'Swift described her state of mind writing it in an Apple Music interview: "I wrote \'Karma\' from a perspective of feeling really happy, really proud of the way your life is, feeling like this must be a reward for doing stuff right."\n\nSeven months after release, she brought the song full circle: Ice Spice\'s team reached out asking to collaborate, Swift said yes, and on May 26, 2023 — the Eras Tour\'s first New Jersey show — a remix dropped with a new Ice Spice verse written with RiotUSA, premiered live at MetLife Stadium.',
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
          'Del Rey, who co-wrote the song with Swift and Jack Antonoff: "I am all over the first version of \'Snow on the Beach.\' I layer and match her vocals perfectly, so you would never even know that I was completely all over that first song... I had no idea I was the only feature [on that song]. Had I known, I would have sung the entire second verse like she wanted."\n\nSwift has described the song\'s concept as "falling in love with someone at the same time as they\'re falling in love with you... this cataclysmic, fated moment where you realize someone feels exactly the same way that you feel." A "More Lana Del Rey" version, with Del Rey singing the full second verse, followed as part of the Til Dawn Edition in May 2023.',
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
          'In her December 2023 Time Person of the Year cover interview, Swift traced "Mastermind" back to the twist ending of Phantom Thread: "Wouldn\'t it be fun to have a lyric about being calculated..."\n\nOn the "calculated" label she\'s carried for years, she said: "It\'s something that\'s been thrown at me like a dagger, but now I take it as a compliment." Antonoff co-wrote and co-produced the track with her, closing out the standard edition of Midnights.',
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
      relatedIds: ['moment:vault-tloas-all-12-tracks-debut-as-the-hot-100s-entire-top-12'],
      title: 'Every spot in the Hot 100 top 10, all at once',
      snippet:
        'The week "Anti-Hero" debuted at No. 1, the other nine Midnights tracks filled out the rest of the top 10 — the first time in Hot 100 history one artist held the entire top 10 in a single week.',
      sourceUrl: 'https://www.billboard.com/music/chart-beat/taylor-swift-all-hot-100-top-10-anti-hero-1235163664/',
      thumbnailUrl: null,
      moment: {
        context:
          'On the chart dated Nov. 5, 2022, Swift became, in Billboard\'s words, "the first artist to claim the survey\'s entire top 10 in a single frame," surpassing Drake, who\'d held nine of the top 10 in September 2021.\n\nLed by "Anti-Hero" (59.7 million streams) at No. 1, the top 10 ran Lavender Haze, Maroon, Snow on the Beach, Midnight Rain, Bejeweled, Question...?, You\'re on Your Own Kid, Karma, and Vigilante Shit — all from the same album, which also became the first LP ever to land 10 songs in the Hot 100\'s top 10 at once.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-all-hot-100-top-10-anti-hero-1235163664/',
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
            caption: 'Single artwork for "Anti-Hero," which led the historic all-Swift top 10 from No. 1.',
            kind: 'archival',
            focalPoint: '55% 48%',
          },
          {
            url: 'https://i.ytimg.com/vi/b1kbLwvqugk/maxresdefault.jpg',
            credit: 'Taylor Swift / Republic Records, via YouTube',
            caption: 'A frame from the self-directed "Anti-Hero" video — the No. 1 that led an all-Swift top 10, with 59.7 million streams in the chart week.',
            kind: 'archival',
            focalPoint: '50% 25%',
          },
          // Photo pass 2026-07-19 (bulk-to-6+, docs/decisions.md): 2 more,
          // from official videos of other songs named in this item's own
          // list. oEmbed-verified both belong to @TaylorSwift's channel.
          {
            url: 'https://i.ytimg.com/vi/b7QlX3yR2xs/maxresdefault.jpg',
            credit: 'Taylor Swift / Republic Records, via YouTube',
            caption: 'A frame from the official "Bejeweled" video — one of the nine other tracks that filled out the historic all-Swift top 10.',
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
          'On May 26, 2023, Swift released two new deluxe versions — the 23-track Til Dawn Edition (including the Ice Spice "Karma" remix) and a 21-track Late Night Edition with the previously unreleased "You\'re Losing Me" — plus a new vinyl variant.\n\nIt was enough to send Midnights back to No. 1 on the chart dated June 10, 2023, halting One Thing at a Time\'s run at the top and handing Midnights its sixth (non-consecutive) week at No. 1 on 282,000 equivalent album units, the second-largest album week of 2023 to that point.',
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
          'The series started Sept. 21, 2022, with episodes dropping at midnight ET — cat Meredith cameoed in episode 2, and the remaining titles were released an hour apart through the night of Oct. 7.\n\nIt flipped her usual Easter-egg hunt on its head: instead of fans decoding clues, chance decided which track title she revealed next.',
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
          {
            outlet: 'Taylor Swift on TikTok',
            url: 'https://www.tiktok.com/@taylorswift/video/7151677137337208110',
            source_title: 'Our LAST EPISODE! The season finale of Midnights Mayhem with Me',
            publisher: 'Taylor Swift (official TikTok)',
            source_type: 'social',
            accessed_at: '2026-07-08',
            reliability_score: 3,
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
          'Released Oct. 25, 2022, four days after the album, the Cinderella-story video stacked its cast like a wink: Laura Dern as the wicked stepmother, the three HAIM sisters as the stepsisters, and Dita Von Teese in the martini glass.\n\nThe clues were the point — and they all faced one direction. Dern\'s "Speak not, you tacky, tired wench" line, the three stepsisters (album three), and an orchestral "Long Live" over the closing shot all pointed at Speak Now as the next re-record — a call fans banked, and one the Nashville announcement confirmed the following May.',
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
          'The Nov. 20, 2022 sweep at the Microsoft Theater covered favorite female pop artist, favorite female country artist, favorite pop album, favorite country album, and favorite music video — a re-recorded 2012 album and its ten-minute short film winning a full month into the Midnights era, alongside a seventh Artist of the Year. Accepting, she pointed the credit outward: "I have the fans to thank, essentially, for my happiness," signing off with "thank you, underlined with 13 exclamation points."\n\nThe re-record project got its own acceptance-speech paragraph — "I cannot tell you how much my re-recorded albums mean to me" — and the six-for-six night pushed her career total to 40 American Music Awards, extending her lead as the most-awarded artist in the show\'s history. The timing added subtext: the sweep landed five days after the Eras Tour presale had melted Ticketmaster down.',
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
        ],
        // Real-photo pass (2026-07-09): Rolling Stone's lead photo of the night,
        // hotlinked per the 2026-07-09 relaxed media policy; credit per the
        // article's own photo credit. Verified HTTP 200 + image/jpeg.
        // Photo-enrichment pass (2026-07-18): added Deadline's press-room frame —
        // the gold Zuhair Murad halter with all six trophies in hand, distinct
        // from the onstage acceptance shot. Curl 200 + image/jpeg,
        // vision-confirmed (AMA/ABC press wall, six pyramids in her arms).
        photos: [
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2022/11/Taylor-Artist-1443142818.jpg?w=1600&h=900&crop=1',
            credit: 'Kevin Winter/Getty Images via Rolling Stone',
            caption: 'Swift accepting at the 2022 American Music Awards in Los Angeles, where she went six-for-six.',
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
          'The Verified Fan presale opened Nov. 15, 2022 and buckled within the hour as fans, bots, and scalpers flooded the site; Ticketmaster later blamed a massive bot attack and scrapped the general sale outright.\n\nFans sued, and Swift said watching the mistakes unfold with no recourse had been "excruciating." The fallout carried into Washington within two months.',
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
            credit: 'Architect of the Capitol (public domain)',
            caption: 'A Hart Senate Office Building hearing room — where the Judiciary Committee questioned Ticketmaster\'s parent company two months later.',
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Alexandria_Ocasio-Cortez_Official_Portrait_%281%29.jpg',
            credit: 'Official congressional portrait (public domain)',
            caption: 'Rep. Alexandria Ocasio-Cortez, one of the lawmakers who publicly weighed in on the ticketing meltdown.',
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/dc/US_Department_of_Justice.jpg',
            credit: 'Bjoertvedt, Wikimedia Commons (CC BY-SA 3.0)',
            caption: 'The Department of Justice, which went on to sue Live Nation–Ticketmaster over market power the meltdown first put in the national spotlight.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      slug: 'ticketmaster-senate-hearing',
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
          'At the Jan. 24, 2023 Senate Judiciary hearing, Sen. Amy Klobuchar opened on consolidation people know "all too well"; Live Nation\'s CFO blamed bots, and when witnesses were asked whether Ticketmaster is a monopoly, SeatGeek\'s CEO answered "unequivocally."\n\nKlobuchar\'s case: the company controls over 70% of ticketing for major venues plus much of the promotion pipeline.',
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
          'Premiered July 7, 2023 at the first Kansas City show, hours after Speak Now (Taylor\'s Version) dropped.\n\nSwift wrote and directed the vault-heist clip herself, cast the "Mean" video kids all grown up, and told the crowd Lautner had been "a very positive force in my life" during the original Speak Now — and did every stunt himself.',
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
          'Geologist Jackie Caplan-Auerbach read the July 22–23, 2023 shows off a seismometer beside the stadium: shaking roughly twice as strong as the Beast Quake, sustained for hours at a time because 144,000 fans across two nights were all moving to the same beat.\n\nThe difference, she noted, was rhythm — music drives the ground in a way a single touchdown roar can\'t.',
        sources: [
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/beast-quake-taylor-swift-seattle-concerts-seismic-activity-lumen-field/',
            source_title: "Beast Quake (Taylor's Version): Swift's Eras tour concerts cause seismic activity in Seattle",
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
      relatedIds: ['moment:vault-midnights-the-eras-tour-kicks-off-in-glendale'],
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
          'The July 12, 2023 Beige Book flagged that May was Philadelphia\'s strongest hotel-revenue month since the pandemic\'s onset, in large part from the influx of fans for her Lincoln Financial Field dates — while Chicago broke hotel occupancy records during her Soldier Field weekend.\n\n"Swiftonomics" stopped being a joke headline and became a line item — a pop tour showing up in the same central-bank briefing document as inflation expectations and freight volumes. The Fed mention followed her the rest of the year, resurfacing in Time\'s Person of the Year citation that December.',
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
      relatedIds: ['moment:vault-lover-my-worst-case-scenario-scooter-braun-buys-big-machine-and-he'],
      title: "1989 (Taylor's Version) announced at the final US show — on the date fans predicted",
      snippet:
        'Blue versions of her Speak Now, folklore, and 1989 outfits teased it all night at SoFi before the reveal: Oct. 27. Fans had already done the math — Aug. 9 was eight years, nine months, and 13 days since the original.',
      sourceUrl: 'https://variety.com/2023/music/news/taylor-swift-announces-1989-taylors-version-coming-la-tour-finale-sofi-stadium-1235692622/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Aug. 9, 2023 finale of the tour\'s first US run ended with SoFi\'s roof lit up for the announcement and Swift calling it "my most FAVORITE re-record I\'ve ever done."\n\nThe date numerology (8-9, and her lucky 13) had circulated among fans for weeks — one of the rare times the fandom called an announcement to the day: date logic (8/9 reading as \'89), the era\'s color-code system (blue for 1989), and the tour calendar all pointed the same direction publicly before the show, and the reveal landed exactly where the numerology said it would (1989 (Taylor\'s Version), Wikipedia).',
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
      title: 'Billionaire status, from the music alone',
      snippet:
        'Bloomberg put her net worth at $1.1 billion in October 2023 — one of the only entertainers ever to get there purely on songs and shows, no sneaker line or liquor brand required.',
      sourceUrl: 'https://www.bloomberg.com/graphics/2023-taylor-swift-net-worth-billionaire/',
      thumbnailUrl: null,
      moment: {
        context:
          'Bloomberg\'s breakdown: roughly $400 million in catalog value from music released since 2019, $370 million from ticket sales and merchandise, $120 million from streaming, $110 million in real estate, and $80 million in royalties — the Eras Tour and the Taylor\'s Version project doing the compounding.\n\nThe distinction was the story: the $1.1 billion estimate made her one of the only entertainers ever to reach ten figures on music alone — no sneaker line, liquor brand, or startup portfolio required — and it landed in the same October that 1989 (Taylor\'s Version) posted the largest traditional-sales week of her entire career.',
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
            credit: 'Paolo V, Wikimedia Commons (CC BY 2.0)',
            caption: 'The 1989 set at the same SoFi stand — the era whose Taylor\'s Version posted the biggest sales week of her career that same October.',
            kind: 'archival',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/d/d5/Taylor_Swift_-_1989_%28Taylor%27s_Version%29.png',
            credit: 'Republic Records (official cover art)',
            caption: '1989 (Taylor\'s Version), released Oct. 27, 2023 — the record-week sales that landed the same month as the billionaire estimate.',
            kind: 'archival',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/The_Eras_Tour_Logo.png',
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
      title: 'The Eras Tour film opens to $92.8 million — the biggest concert-film debut ever',
      snippet:
        'Distributed straight through AMC, skipping the studios entirely: $92.8M domestic, $123.5M globally, and the second-biggest October opening of all time behind Joker.',
      sourceUrl: 'https://variety.com/2023/film/box-office/taylor-swift-eras-tour-box-office-final-opening-weekend-record-1235757568/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Oct. 13, 2023 opening weekend played like a tour stop: theaters full of costumed fans dancing in the aisles, with minimal traditional marketing behind it. The $123.5 million global start beat the concert-film opening record Justin Bieber: Never Say Never had held since 2011, and the $92.8 million domestic number ranked as the second-biggest October opening ever, behind only Joker.\n\nThe business model drew as much coverage as the numbers: Swift bypassed the studio system entirely and dealt directly with AMC as distributor — a first at this scale — and the direct-to-exhibitor template became the one she reran two years later for the Showgirl Release Party.',
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
          'Swift said the two songs both "cheekily play on the discussions at that time of my life around my dating life" — Blank Space made the 2014 cut, and "Slut!" waited nine years.\n\nIt debuted at No. 3 on the Hot 100, and critics read the soft, tender arrangement as the point: reckoning with the slut-shaming era by refusing to write an angry song about it.',
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
      title: '"Karma is the guy on the Chiefs" — sung with Travis watching',
      snippet:
        'She swapped the lyric mid-show in Buenos Aires while Kelce watched from a tent with her dad — then ran into his arms after the show for their first kiss caught on camera.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-travis-kelce-kiss-karma-is-the-guy-on-the-chiefs-1235469366/',
      thumbnailUrl: null,
      moment: {
        context:
          'Nov. 11, 2023: fan video caught Kelce covering his face and grinning as Scott Swift patted his arm.\n\nHe recapped it on New Heights with "I\'m enjoying life, and I sure as hell enjoyed this weekend." The line stuck — the Chiefs version of the lyric kept resurfacing at shows through the rest of the tour.',
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
      title: '"You\'re Losing Me" finally hits streaming',
      snippet:
        'The Midnights bonus track fans treated as the Alwyn-breakup rosetta stone went wide on Nov. 29 — her thank-you for being named Spotify\'s top global artist of 2023.',
      sourceUrl: 'https://en.wikipedia.org/wiki/You%27re_Losing_Me',
      thumbnailUrl: null,
      moment: {
        context:
          'Previously locked to a CD-only Late Night Edition sold at Eras Tour merch stands from May 2023, the downtempo ballad — twinkling synthesizers over sparse, steady beats — literally samples Swift\'s own heartbeat in its production. On streaming it climbed to No. 27 on the Hot 100, remarkable for a bonus track six months old, with one reviewer calling it potentially the most devastating breakup song she\'s written.\n\nJack Antonoff later revealed they wrote and recorded it on Dec. 5, 2021 — well over a year before the Alwyn breakup became public, which only deepened the fan forensics around it: the song read in hindsight as a relationship\'s decline documented in real time, released into the exact week Spotify crowned her its most-streamed artist of 2023.',
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
          'The Feb. 16–18, 2024 Melbourne stand opened the Australian leg at a scale no Eras Tour stadium before it had touched — she told the final crowd she was "starstruck" by the sight, spelling the math out from the stage: "those are all the biggest shows I\'ve ever played on a tour, and you did it three times."\n\nThe 96,000-per-night mark stood as the tour\'s attendance ceiling through its Vancouver finale — a cricket ground out-drawing every NFL and soccer stadium on the routing, with the city itself leaning in via "Welcome to Melbourne, Swifties" projections downtown.',
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
          'April 13, 2024: she wore a green New Heights cap for his podcast, he wore his usual white Happy Gilmore hat, and during Dom Dolla\'s DJ set he briefly lifted her off the ground in the crowd. A festival date night six days out from a double album nobody knew was a double album yet.\n\nThe itinerary read like a loyalty tour: dancing in the Sahara tent crowd through Ice Spice\'s set as the "Karma" remix played, then watching from backstage at the Mojave tent as Jack Antonoff played with Bleachers. The night ran late — photographers caught the two at the Neon Carnival afterparty in Thermal, still in the matching-baseball-cap disguise that fooled no one.',
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
        ],
        // Real-photo pass (2026-07-09): Billboard's lead photo of the couple at
        // Neon Carnival that night, hotlinked per the 2026-07-09 relaxed media
        // policy; credit per the article. Verified HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/04/Taylor-Swift-and-Travis-Kelce-coachella-2024-billboard-1548.jpg?w=1024',
            credit: 'Gilbert Flores/Billboard',
            caption: 'Swift in the green New Heights cap and Kelce in the Happy Gilmore hat at Neon Carnival, Coachella weekend, April 13, 2024.',
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
      snippet: "A return to pop as a diary of midnights across her life.",
      moment: {
        context: "Midnights framed itself as thirteen sleepless nights, blending retro-glam synths with confessional diary entries.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "midnights-3am",
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
      moment: {
        context: "Its confessional humor and inescapable chorus made “Anti-Hero” the defining pop single of the season.",
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
      day: 1,
      category: 'relationship',
      threadIds: ['the-proposal'],
      title: 'Travis confirms it, on the record',
      snippet: 'After weeks of stadium-suite appearances, Travis confirmed the relationship on the record in a WSJ. Magazine interview — the first time either side spoke to it directly rather than letting the sightings speak for themselves.',
      sourceUrl: 'https://www.wsj.com/style/travis-kelce-interview-taylor-swift-chiefs-9d7943ac',
      thumbnailUrl: 'https://wsjshop.com/cdn/shop/files/WSJmag120923_1024x1024@2x.jpg?v=1702301778',
      moment: {
        context: 'After weeks of stadium-suite appearances (including an October trip to MetLife Stadium for a Chiefs-Jets game), Travis confirmed the relationship on the record in a WSJ. Magazine interview — the first time either side spoke to it directly rather than letting the sightings speak for themselves.',
        sources: [
          {
            outlet: 'WSJ. Magazine',
            url: 'https://www.wsj.com/style/travis-kelce-interview-taylor-swift-chiefs-9d7943ac',
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
