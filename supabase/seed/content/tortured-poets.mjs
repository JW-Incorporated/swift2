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
            focalPoint: '42% 22%',
          },
          // Photo pass #762 run 4 (2026-07-18): the other half of the night —
          // accepting the record fourth Album of the Year. CBS's own CDN;
          // curl-verified 200 image/jpeg (620x443), vision-confirmed.
          {
            url: 'https://assets3.cbsnewsstatic.com/hub/i/r/2024/02/05/ab5beb9a-9706-4815-84aa-c61399cd2d4f/thumbnail/620x443g3/8ab5e40f2be348435c6a803e11b53a60/gettyimages-1986749514.jpg',
            credit: 'John Shearer/Getty Images for The Recording Academy, via CBS News',
            caption: 'Accepting Album of the Year for Midnights — the first artist to win the category four times.',
            kind: 'primary',
            focalPoint: '65% 22%',
          },
        ],
      },
    },
    {
      significance: 'notable', // the second consecutive album to set this exact platform record (docs/decisions.md, 2026-07-19)
      relatedIds: [
          'moment:vault-ttpd-spotifys-top-global-artist-again-26-6-billion-streams','moment:vault-midnights-midnights-breaks-spotify-in-a-single-day'],
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
          'The album cleared 300 million Spotify streams before its first day was out — the first album in the platform\'s history to cross either the 200 million or 300 million single-day marks — while "Fortnight" displaced the single-day record for any song, and Taylor set the single-day artist record too.\n\nThe takeover had a physical footprint: for three days before release, Spotify ran an open-air "poetry library" pop-up at The Grove in Los Angeles, revealing new lyrics from the album each day. The artist single-day record she broke was her own, set when 1989 (Taylor\'s Version) arrived in October 2023.',
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
            focalPoint: '60% 60%',
          },
          // Photo pass #762 run 4 (2026-07-18): second frame from Spotify's
          // own newsroom gallery of the Grove pop-up — the arched display
          // with the day's lyric reveal. curl-verified 200 image/jpeg
          // (819x1024), vision-confirmed.
          {
            url: 'https://storage.googleapis.com/pr-newsroom-wp/1/2024/04/Day1_IGCarousel_1-819x1024.jpg',
            credit: 'Spotify Newsroom',
            caption: 'The pop-up library\'s lyric case at The Grove — new album lines revealed each day before release.',
            kind: 'archival',
            focalPoint: '50% 60%',
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
        // Photo pass #762 run 4 (2026-07-18): left at one photo — the only
        // on-topic imagery for this streaming milestone is Spotify's own
        // campaign art (this portrait) or Grove pop-up photos already used
        // on the single-day-record page; no distinct verifiable second image.
        photos: [
          {
            url: 'https://storage.googleapis.com/pr-newsroom-wp/1/2024/04/TSwift-Square-header-1440x1440.jpg',
            credit: 'Spotify Newsroom',
            focalPoint: '70% 40%',
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
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Taylor_Swift_Eras_Tour_TTPD_Set_Fortnight.jpg/1280px-Taylor_Swift_Eras_Tour_TTPD_Set_Fortnight.jpg',
      moment: {
        context:
          'Written with Post Malone and Jack Antonoff, the downtempo synth-pop opener carries what Taylor called the album\'s fatalism — "You ended up not with the person that you loved and now you just have to live with that every day" — with Malone recording his harmonies and bridge hooks at his home studio in Los Angeles.\n\nThe video, which Taylor directed herself with cinematographer Rodrigo Prieto shooting in black and white, casts Malone as her lover and reunites Dead Poets Society co-stars Ethan Hawke and Josh Charles as mad scientists administering her electroshock therapy; critics caught echoes of Poor Things, Frankenstein, and silent-era German Expressionism. The song debuted at No. 1 on the Hot 100 — her 12th chart-topper and Post Malone\'s fifth — after breaking Spotify\'s single-day streaming record, and its video went on to take Video of the Year at the 2024 VMAs.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Fortnight_(song)' },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-hot-100-top-14-fortnight-post-malone-record/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Taylor_Swift_Eras_Tour_TTPD_Set_Fortnight.jpg/1280px-Taylor_Swift_Eras_Tour_TTPD_Set_Fortnight.jpg',
            credit: 'Wikimedia Commons',
            focalPoint: '50% 25%',
          },
          // Photo pass #762 run 4 (2026-07-18): still from the official video
          // — video ID verified via YouTube oEmbed (author @TaylorSwift,
          // "Fortnight (feat. Post Malone) (Official Music Video)") this
          // session; curl-verified 200 image/jpeg (1280x720), vision-confirmed.
          {
            url: 'https://i.ytimg.com/vi/q3zqJs7JUCQ/maxresdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'The self-directed black-and-white video, shot by Rodrigo Prieto — Video of the Year at the 2024 VMAs.',
            kind: 'archival',
            focalPoint: '48% 35%',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 4,
      day: 19,
      category: 'release',
      significance: 'defining', // the surprise-drop format taken to its biggest scale yet (docs/decisions.md, 2026-07-19)
      relatedIds: [
          'moment:vault-tloas-the-black-dog-still-nobody-knows-what-the-songs-about-she-sa','moment:vault-folklore-sixteen-hours-notice-the-announcement-that-invented-the-surp'],
      title: 'A 2am surprise: TTPD was a secret double album all along',
      snippet:
        'Two hours after the album dropped, a second post: "The Tortured Poets Department is a secret DOUBLE album." The Anthology added 15 more songs, 31 total.',
      sourceUrl:
        'https://www.billboard.com/music/pop/taylor-swift-2am-surprise-secret-double-album-the-tortured-poets-department-1235660643/',
      thumbnailUrl: null,
      moment: {
        context:
          'She had teased a mysterious 2 a.m. countdown, and delivered on it two hours after the midnight release: "It\'s a 2am surprise: The Tortured Poets Department is a secret DOUBLE album. I\'d written so much tortured poetry in the past 2 years and wanted to share it all with you."\n\nFour of the 15 Anthology tracks — "The Manuscript," "The Bolter," "The Albatross," and "The Black Dog" — had already been teased as bonus cuts scattered across physical variants; the rest were entirely new, pushing the full album past the two-hour mark. Her sign-off handed the record over: "And now the story isn\'t mine anymore... it\'s all yours."\n\nThree days before release, a Spotify pop-up at LA\'s Grove had already planted real lines from the record in plain sight — open "book" props, card-catalog drawers, a Times Square billboard — that fans photographed without knowing they were reading the actual album.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-2am-surprise-secret-double-album-the-tortured-poets-department-1235660643/',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-the-tortured-poets-department-the-anthology-announcement-1235007251/',
          },
          {
            outlet: 'Deseret News',
            url: 'https://www.deseret.com/entertainment/2024/04/16/taylor-swift-tortured-poets-department-los-angeles-art-installation/',
            source_title: "Taylor Swift 'The Tortured Poets Department' LA Spotify library",
            publisher: 'Deseret News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-19',
            reliability_score: 3,
          },
        ],
        // T16 photo pass (2026-07-09): The Anthology cover from Wikipedia's
        // stable upload.wikimedia.org copy. Verified HTTP 200 + image/png.
        // Photo pass #762 run 4 (2026-07-18): left at one photo — the 2 a.m.
        // reveal was an Instagram post; the only other candidate (standard
        // TTPD cover) is a ~300px fair-use render, below the ≥400px add bar.
        // Photo depth pass (round 2, 2026-07-19): the 2am post itself has no
        // more real imagery, but the same release week has plenty — added
        // three frames from Spotify's official "TTPD" library installation
        // at The Grove (opened April 16, three days ahead of the drop), from
        // Spotify Newsroom's own storage.googleapis.com CDN. Each verified
        // HTTP 200 + image/jpeg, downloaded and viewed this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/1/1b/The_Tortured_Poets_Department_The_Anthology.png',
            credit: 'Republic Records',
            caption: 'Cover of The Tortured Poets Department: The Anthology, the 31-track edition revealed at 2 a.m.',
            kind: 'primary',
            focalPoint: '50% 38%',
          },
          {
            url: 'https://storage.googleapis.com/pr-newsroom-wp/1/2024/04/Day1_IGCarousel_5-1-1440x1440.jpg',
            credit: 'Spotify Newsroom',
            caption:
              'The Spotify x Taylor Swift "Tortured Poets Department" library installation outside The Grove in Los Angeles, part of the release-week rollout leading into the album\'s April 19 arrival.',
            kind: 'archival',
            focalPoint: '50% 55%',
          },
          {
            url: 'https://storage.googleapis.com/pr-newsroom-wp/1/2024/04/Day1_IGCarousel_6-819x1024.jpg',
            credit: 'Spotify Newsroom',
            caption:
              'Inside the installation: a "TTPD"-lettered reading nook staged with a manuscript-topped writing desk, one of several vignettes built for the pop-up.',
            kind: 'archival',
            focalPoint: '50% 45%',
          },
          {
            url: 'https://storage.googleapis.com/pr-newsroom-wp/1/2024/04/Day1_IGCarousel_7-819x1024.jpg',
            credit: 'Spotify Newsroom',
            caption: 'Fans browse the installation\'s card-catalog wall, filled with poetry excerpts, in the days before the album dropped.',
            kind: 'archival',
            focalPoint: '45% 55%',
          },
          // Photo pass 2026-07-19 (bulk-to-6+, docs/decisions.md): 4 more
          // frames from the same Spotify Newsroom carousel, found by probing
          // adjacent numbers in the CDN's own filename pattern. Two show the
          // exact planted lines ("Even statues crumble / if they're made to
          // wait") that paid off as real album lyrics three days later.
          {
            url: 'https://storage.googleapis.com/pr-newsroom-wp/1/2024/04/Day1_IGCarousel_1-819x1024.jpg',
            focalPoint: '48% 40%',
            credit: 'Spotify Newsroom',
            caption: 'An open "book" prop inside the installation reading "EVEN STATUES CRUMBLE / IF THEY\'RE MADE TO WAIT" — a line that surfaced as an actual album lyric on release day.',
            kind: 'archival',
          },
          {
            url: 'https://storage.googleapis.com/pr-newsroom-wp/1/2024/04/Day1_IGCarousel_2-819x1024.jpg',
            focalPoint: '50% 40%',
            credit: 'Spotify Newsroom',
            caption: 'A second planted page: "ONE LESS TEMPTRESS / ONE LESS DAGGER TO SHARPEN" — another line that matched the finished record.',
            kind: 'archival',
          },
          {
            url: 'https://storage.googleapis.com/pr-newsroom-wp/1/2024/04/Day1_IGCarousel_4-819x1024.jpg',
            focalPoint: '42% 50%',
            credit: 'Spotify Newsroom',
            caption: 'A card-catalog wall inside the installation, drawers labeled "TTPD" and "Taylor Swift" — the shelves fans mined for days.',
            kind: 'archival',
          },
          {
            url: 'https://storage.googleapis.com/pr-newsroom-wp/1/2024/04/Day1_IGCarousel_9-819x1024.jpg',
            focalPoint: '58% 32%',
            credit: 'Spotify Newsroom',
            caption: 'The same "Even statues crumble" line scaled up on a Times Square billboard, part of the same pre-save campaign.',
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
      title: 'Clara Bow, and the industry habit of replacing women with women',
      snippet: '"You look like Clara Bow in this light... Stevie Nicks in \'75" — then, in the last verse, the label pitches the same line about her.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Clara_Bow_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Written and produced with Aaron Dessner at Long Pond Studios, "Clara Bow" closes the standard album at track 16 by walking through the lineage of women the industry anoints and then swaps out: the narrator is told she looks like Clara Bow — the silent-film star who defined the 1920s "It girl" — then "Stevie Nicks in \'75," before the final verse turns the machine on its own author, with an executive pitching the next new girl as looking like Taylor Swift. Her own explanation: "I picked women who have done great things in the past and have been these archetypes of greatness in the entertainment industry" — then showed how the industry sells every new woman as a replacement for the last.\n\nBow\'s descendants embraced the closer: her family called the song a "testament" to the actress\'s legacy and its lyrics "hauntingly beautiful," despite Taylor never consulting them beforehand. Critics highlighted the track\'s self-aware framing of fame\'s churn — NPR later named it among the best songs of 2024 — and it reached No. 21 on the Hot 100 in TTPD\'s record-sweeping first week.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Clara_Bow_(song)' }],
        // T16 photo pass (2026-07-09): official lyric-video still — video ID
        // verified via YouTube oEmbed (author @TaylorSwift) this session.
        // Photo pass #762 run 9 (2026-07-18): added the 1927 Paramount
        // publicity portrait of Clara Bow herself — the woman the song is
        // named for; public domain, license verified via the Commons API
        // this session (1078x1500). Both images downloaded and viewed for
        // focal points.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/fcVUbmdQfaE/maxresdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the official "Clara Bow" lyric video on Taylor Swift\'s YouTube channel.',
            kind: 'archival',
            // Title text left, bare shoulder right edge; keep the middle band.
            focalPoint: '50% 45%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Clara_Bow_1927.jpg',
            credit: 'Paramount Photos (1927), public domain, via Wikimedia Commons',
            caption:
              'Clara Bow in a 1927 Paramount publicity portrait — the silent-film "It girl" whose name opens the song\'s lineage of anointed and replaced women.',
            kind: 'reference',
            // Profile portrait facing right; face upper-center-right.
            focalPoint: '58% 35%',
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
      // Photo pass #762 run 4 (2026-07-18): was the ?w=248&h=165 article
      // thumbnail (496x330 rendered). Raised to ?w=1200&fit=max — same imgix
      // asset, uncropped at 1200x800; curl-verified 200 image/jpeg and
      // vision-confirmed (green folklore-style gown on wooden stage steps).
      thumbnailUrl:
        'https://imgix.bustle.com/uploads/getty/2024/2/22/9b7b54e9-11ab-43f1-90fa-51af4b2737da-getty-2015053197.jpg?w=1200&fit=max',
      moment: {
        context:
          'Lady Idina Sackville, part of the scandalous "Happy Valley set" in 1930s colonial Kenya, earned the "bolter" nickname after leaving her husband for another man; her own great-granddaughter, Frances Osborne, wrote a 2008 biography by the same title. Taylor has never confirmed the connection.\n\nThe Anthology track itself — written and produced with Aaron Dessner — sketches "an endearing and mischievous woman" who charms the "trophy hunters" pursuing her and escapes at every turn. Literary-minded listeners also point to Nancy Mitford\'s 1945 novel The Pursuit of Love, whose absentee mother figure is nicknamed "the Bolter" for serially abandoning her marriages; like the Sackville theory, it remains an interpretation fans and critics supplied, not one Taylor has endorsed.',
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
            url: 'https://imgix.bustle.com/uploads/getty/2024/2/22/9b7b54e9-11ab-43f1-90fa-51af4b2737da-getty-2015053197.jpg?w=1200&fit=max',
            credit: 'Graham Denholm/TAS24/Getty Images Entertainment',
            focalPoint: '48% 20%',
          },
          // Photo pass #762 run 4 (2026-07-18): William Orpen's 1915 portrait
          // of Idina herself — the socialite the page is about. Public domain
          // (Orpen d. 1931), Commons license verified via API; curl-verified
          // 200 image/jpeg (1148x2000), vision-confirmed.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/61/Idina_Wallace%2C_by_William_Orpen.jpg',
            credit: 'William Orpen (1915), public domain, via Wikimedia Commons',
            caption: 'Lady Idina Sackville, painted by William Orpen in 1915 — the aristocrat fans trace the title to.',
            kind: 'reference',
            focalPoint: '48% 18%',
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
            focalPoint: '45% 25%',
          },
          // Photo pass #762 run 4 (2026-07-18): fan photo of the segment's
          // Fortnight staging, Paris May 11, 2024 — CC BY 4.0, Commons
          // license verified via API; curl-verified 200 image/jpeg (1280px
          // render of 4000x2250 original), vision-confirmed (script-covered
          // dress over the white bed frame). Distinct file from the shot on
          // the Fortnight song page; the sibling Down Bad photo was skipped
          // as already used on the Down Bad song page.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Taylor_Swift_Eras_Tour_TTPD_Set_Fortnight_2.jpg/1280px-Taylor_Swift_Eras_Tour_TTPD_Set_Fortnight_2.jpg',
            credit: 'Vixy13 via Wikimedia Commons, CC BY 4.0',
            caption: 'Draped over the bed frame in "Fortnight" — one of seven TTPD songs staged in the new segment, Paris, May 11, 2024.',
            kind: 'primary',
            focalPoint: '49% 30%',
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
            focalPoint: '45% 25%',
          },
          // Photo pass #762 run 10 (2026-07-18): second frame from the same La Défense
          // stand, from the cited Rolling Stone setlist story (its own CDN). RS caption
          // dates it to night four (May 12); caption below says so honestly.
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2024/05/Taylor-Swift-Tortured-Poets-Eras-Tour-Post.jpg?crop=0px%2C11px%2C1798px%2C1014px&resize=1600%2C900',
            credit: 'Kevin Mazur/TAS24/Getty Images',
            caption: 'Night four of the same Paris stand at La Défense Arena (May 12, 2024), in the sparkling orange jacket of the new TTPD set.',
            focalPoint: '52% 26%',
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
            // Focal point set 2026-07-18 (photo-enrichment run 7, #762) by viewing:
            // full-body stage shot in the crystal bodysuit; face upper-left of center.
            focalPoint: '42% 18%',
          },
          {
            // Image-fix pass (2026-07-10): #343 — second usage of the same ?w=300 low-res URL
            // flagged on the "Female Rage The Musical" moment; raised to the ?w=942&h=628&crop=1
            // full-res variant (curl-verified 200/image/jpeg, vision-confirmed same photo).
            url: 'https://www.billboard.com/wp-content/uploads/2024/05/Taylor-Swift-_-The-Eras-Tour-Paris-France-04-2024-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Kevin Mazur/TAS24/Getty Images',
            // Focal point set 2026-07-18 (run 7) by viewing: Swift small atop the white
            // TTPD set piece, upper-center-left, dancers below.
            focalPoint: '46% 28%',
          },
        ],
        // Shop pass (2026-07-22): the custom Vivienne Westwood lyric gown
        // was never sold at retail -- a current ivory corseted gown,
        // verified in stock, closest real match.
        products: [
          {
            brand: 'MESHKI',
            item: 'Seraphine Corset Satin Maxi Dress',
            retailer: 'meshki.us',
            url: 'https://www.meshki.us/products/seraphine-corset-satin-maxi-dress-ivory',
            price: '$229.00',
            isAlternative: true,
            altNote: 'The custom Vivienne Westwood lyric gown was never sold at retail -- this sources the gown only, matching its corseted, draped feel (no printed text; the bodysuit not separately sourced).',
          },
        ],
      },
    },
    {
      significance: 'notable', // a real, outright venue record — more nights at Wembley than any solo artist in the stadium's history (docs/decisions.md, 2026-07-19)
      relatedIds: ['moment:vault-ttpd-the-eras-tour-takes-its-final-bow-in-vancouver'],
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
            focalPoint: '35% 48%',
          },
          // Photo pass #762 run 4 (2026-07-18): THR's lead photo on its
          // record-breaking-stand story, on THR's own CDN — the Lover-set
          // crystal bodysuit against the pink screen at Wembley.
          // curl-verified 200 image/jpeg (1296x730), vision-confirmed.
          {
            url: 'https://www.hollywoodreporter.com/wp-content/uploads/2024/08/Taylor-Swift-Getty-H-2024-1.jpg?w=1296&h=730&crop=1',
            credit: 'Getty Images, via The Hollywood Reporter',
            caption: 'Onstage at Wembley during the record-setting London run, August 2024.',
            kind: 'primary',
            focalPoint: '47% 22%',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 10,
      day: 7,
      category: 'sighting',
      threadIds: ['the-proposal'],
      // Cross-link (Stage 3, 2026-08-06): same "the-proposal" thread — the
      // Super Bowl LIX sighting the Chiefs' playoff run led to.
      relatedIds: ['moment:vault-ttpd-a-confetti-kiss-after-the-chiefs-punch-their-super-bowl-tick'],
      title: 'Back at Arrowhead for a Monday night win over New Orleans',
      snippet: 'A rare in-season appearance between international tour legs, cheering on a Chiefs win over the Saints.',
      sourceUrl: 'https://www.today.com/popculture/music/chiefs-schedule-2024-taylor-swift-rcna152582',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2024/10/taylor-swift-glitter-freckles-chiefs-game-2024-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'The Oct. 7, 2024 Monday Night Football matchup against the Saints came in the closing days of the Eras Tour\'s two-month break, less than two weeks before the tour resumed in Miami on Oct. 18. She watched from a suite flanked by both families\' patriarchs — her father Scott Swift and Travis\'s father Ed Kelce.\n\nThe look drew nearly as much coverage as the game: a plaid, off-the-shoulder minidress with black knee-high platform boots, finished with glitter freckles scattered across her nose and cheeks — the night\'s standout detail, per Billboard\'s own coverage.',
        sources: [
          { outlet: 'Today', url: 'https://www.today.com/popculture/music/chiefs-schedule-2024-taylor-swift-rcna152582' },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-monday-night-football-style-glitter-freckles-plaid-dress-boots-1235795383/',
          },
        ],
        // Photo pass #762 (2026-07-19): no second verifiable image — the cited
        // Billboard piece carries only this photo of the night (its other
        // images are different events), and Today's article has no stills of
        // the Oct. 7 look on its own CDN.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/10/taylor-swift-glitter-freckles-chiefs-game-2024-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Jamie Squire/Getty Images',
            // Tight backstage close-up; eyes sit just above the vertical middle.
            focalPoint: '53% 40%',
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
      threadIds: ['the-proposal'],
      title: 'Date night at Yankee Stadium for ALCS Game 1',
      snippet:
        'A bye-week baseball date: she and Travis watched the Yankees take Game 1 of the ALCS from a right-field suite, four nights before the Eras Tour restarted in Miami.',
      sourceUrl:
        'https://www.espn.com/nfl/story/_/id/41796394/taylor-swift-travis-kelce-new-york-yankees-cleveland-guardians-alcs-game-one',
      thumbnailUrl:
        'https://img.mlbstatic.com/mlb-images/image/upload/t_2x1/t_w1536/mlb/gbi9ws0peesvkjm8m0ye.jpg',
      moment: {
        context:
          "The Oct. 14, 2024 series opener against the Guardians — a 5-2 Yankees win — landed in a lull for both of them: a bye week for Travis's 5-0 Chiefs, and the last days of the Eras Tour's two-month break before Miami on Oct. 18. Cameras found them in the second row of a suite down the right-field line, just above the postseason bunting and a flag marking the Yankees' 1932 World Series title, both in caps on a 50-degree Bronx night. Even the matchup was on theme: Travis grew up in Cleveland Heights, and New York has been her adopted hometown for a decade.\n\nThey watched from a right-field luxury suite with what Kelce later called an \"unbelievable crew\" of friends; no outlet pinned down whose suite it was, and no other celebrities were photographed inside with them. The neutral dress code was its own tell — both wore black-and-navy caps by Midnight Rodeo, a Kansas City band whose merch Kelce favors (his from its \"You're Not Dreaming\" line), with Taylor finishing the look in her signature red lip rather than any team gear.\n\nThe night's viral image was Taylor's startled reaction to Juan Soto's leadoff home run in the bottom of the third, a broadcast cutaway that MLB and the Yankees reposted on their own channels; TBS announcer Brian Anderson had already flagged Kelce as a \"big Cleveland fan.\" Kelce, a Cleveland Heights native, quietly pulled for the visiting Guardians \"in hostile territory,\" as he put it on New Heights, and days later defended his hometown loyalty on X after being trolled for wearing no Guardians gear. It was the couple's first MLB game together and their only postseason-baseball outing that October — one beat in a run of New York sporting dates that had included the Sept. 8 US Open final — with no reported early exit and no player weighing in on their presence.",
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
          {
            outlet: 'MLB.com',
            url: 'https://www.mlb.com/yankees/video/taylor-swift-reacts-to-juan-soto-s-home-run',
            source_title: "Taylor Swift reacts to Juan Soto's home run",
            publisher: 'MLB.com (Yankees)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 5,
            notes: 'Official league video of the broadcast cutaway to Swift reacting to the leadoff HR',
          },
          {
            outlet: 'Bleacher Report',
            url: 'https://bleacherreport.com/articles/10139652-travis-kelce-talks-mixed-feelings-attending-yankees-vs-guardians-with-taylor-swift',
            source_title: "Travis Kelce Talks 'Mixed Feelings' Attending Yankees vs. Guardians With Taylor Swift",
            publisher: 'Bleacher Report',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'New Heights: "unbelievable crew" of friends; Cleveland-kid divided loyalty in "hostile territory"',
          },
          {
            outlet: 'WWD',
            url: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-travis-kelce-midnight-rodeo-hat-yankees-game-1236684448/',
            source_title: 'Taylor Swift and Travis Kelce Wear Midnight Rodeo Hats to Yankees Game',
            publisher: 'WWD',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Both in neutral Midnight Rodeo (Kansas City band) caps; Kelce\'s "You\'re Not Dreaming" cap; Swift\'s red lip',
          },
        ],
        // Photo pass #762 (2026-07-19): page had zero photos. Both images below
        // come from the cited MLB.com story's own CDN (img.mlbstatic.com),
        // curl-verified 200 image/jpeg and vision-confirmed: the suite shot
        // shows both in caps behind the right-field railing exactly as the
        // context describes; the second is a broadcast frame from the same game.
        photos: [
          {
            url: 'https://img.mlbstatic.com/mlb-images/image/upload/t_2x1/t_w1536/mlb/gbi9ws0peesvkjm8m0ye.jpg',
            credit: 'MLB.com',
            caption:
              'Taylor and Kelce — both in caps, popcorn in reach — in the right-field suite during Game 1 of the 2024 ALCS at Yankee Stadium.',
            kind: 'primary',
            focalPoint: '47% 27%',
          },
          {
            url: 'https://img.mlbstatic.com/mlb-images/image/upload/t_16x9/t_w1536/mlb/rghl1u3zla8wyqz8xfw1.jpg',
            credit: 'MLB.com',
            caption:
              'A broadcast frame from the same suite: Taylor mid-laugh in a black cap as the Yankees took Game 1, 5-2.',
            kind: 'archival',
            focalPoint: '51% 44%',
          },
        ],
      },
    },
    // --- The Eras Tour's final act (Oct–Nov 2024): the closing North
    // American leg between Wembley and the Vancouver finale. Added for
    // issue #628 (Nils, 2026-07-14 walk) — the goodbye laps, not just the
    // accounting afterwards.
    {
      slug: 'eras-tour-miami-return',
      year: 2024,
      month: 10,
      day: 18,
      category: 'tour',
      // Cross-link pass (Answerer shard 5, 2026-07-21, ledger #1088): links to
      // the "Florida!!!" studio-duet page — the Miami run is where that duet ran
      // nightly on the final leg. ID verified against the generated vault.
      relatedIds: [
          'moment:vault-ttpd-sabrina-carpenter-crashes-the-superdome','moment:vault-ttpd-florida-a-dateline-inspired-duet-with-florence-welch'],
      title: 'The tour comes home: three nights in Miami, with Florence Welch in tow',
      snippet:
        'After a two-month break, the Eras Tour opens its final leg at Hard Rock Stadium — and Florence Welch walks out for a live "Florida!!!", not once but on all three nights.',
      sourceUrl: 'https://deadline.com/2024/10/taylor-swift-eras-tour-miami-night-one-review-florence-welch-1236120710/',
      // Photo pass #762 run 10 (2026-07-18): page had zero photos. Both photos below
      // HTTP-checked (200 image/jpeg), downloaded, and vision-confirmed. Deadline (the
      // cited source) tollbit-gates its images, so the Florence duet frame comes from
      // Rolling Stone's own Miami-show story CDN instead.
      thumbnailUrl:
        'https://www.rollingstone.com/wp-content/uploads/2024/10/taylor-swift-florence-welch-florida-miami-show.jpg?w=1600&h=900&crop=1',
      moment: {
        context:
          'The first show since Wembley on Aug. 20 — Oct. 18, 2024 at Hard Rock Stadium, and the start of the tour\'s last lap. Over its first two nights (Oct. 18–19) the run drew more than 122,000, breaking Billy Joel and Elton John\'s 1995 two-night Hard Rock Stadium record of 103,694 — with Billy Joel himself in the crowd the night it fell; a third sold-out show followed Oct. 20 with no separately published count. The layoff showed in the wardrobe: new Roberto Cavalli looks by Fausto Puglisi, headlined by the first new Reputation outfit of the entire tour — a gold-and-black one-leg bodysuit with a 3-D cobra, retiring the red-sequin-snake catsuit worn at every show since March 2023 — plus a new sapphire-fringe Fearless dress and a four-color crystal ombré wrap dress for the acoustic set (fashion desks documented three new Miami looks in all).\n\nThe TTPD set had the marquee guest: Florence Welch walked out for a live "Florida!!!" on all three nights. It wasn\'t the song\'s debut — that had come at the Aug. 20 Wembley finale — but Miami made the duet a fixture. Otherwise the setlist held; only the nightly two-song surprise changed: "Tim McGraw" / "Timeless" and "this is me trying" / "Daylight" (18th); "Should\'ve Said No" / "I Did Something Bad" and "loml" / "White Horse" (19th); "Out of the Woods" / "All You Had to Do Was Stay" and "mirrorball" / "Guilty as Sin?" (20th). Rain soaked the open-canopy opener — "a little rain never stopped Swift," wrote Deadline. Travis Kelce, mid-NFL season, missed the run, though his mother Donna and brother Jason\'s family came opening night.\n\nThe three nights sat inside a documented South Florida tourism surge: FIU analysts projected the run would push Miami\'s average hotel rate above $200 for the first October in more than a decade, against an Eras Tour per-attendee spend they estimated near $1,327 a head — likely higher in a costlier market like Miami.',
        sources: [
          {
            outlet: 'Deadline',
            url: 'https://deadline.com/2024/10/taylor-swift-eras-tour-miami-night-one-review-florence-welch-1236120710/',
            source_title: 'Taylor Swift Dazzles In Miami, Kicking Off Final Leg Of Eras Tour With Help From Florence Welch — And A Little Rain',
            publisher: 'Deadline',
            source_type: 'reputable_press',
            accessed_at: '2026-07-14',
            reliability_score: 4,
          },
          {
            outlet: 'Holler',
            url: 'https://holler.country/news/breaking/taylor-swift-and-florence-welch-bring-florida-to-the-the-eras-tour-in-miami-for-all-three-nights/',
            source_title: "Taylor Swift & Florence Welch Bring 'Florida!!!' to the The Eras Tour in Miami For All Three Nights",
            publisher: 'Holler',
            source_type: 'reputable_press',
            accessed_at: '2026-07-14',
            reliability_score: 3,
          },
          {
            outlet: 'setlist.fm',
            url: 'https://www.setlist.fm/setlist/taylor-swift/2024/hard-rock-stadium-miami-gardens-fl-1355c19d.html',
            source_title: 'Taylor Swift Setlist at Hard Rock Stadium, Miami — Oct. 18, 2024',
            publisher: 'setlist.fm',
            source_type: 'reference',
            accessed_at: '2026-07-21',
            reliability_score: 3,
            notes: 'Per-night surprise-song mashups across Oct 18–20; Florence Welch on "Florida!!!"',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-florence-florida-duet-miami-show-1235137985/',
            source_title: "Taylor Swift Brings Out Florence Welch for 'Florida!!!' in Miami",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
            notes: 'Establishes the Aug. 20 Wembley live debut of "Florida!!!" vs the Miami return',
          },
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/taylor-swift-new-reputation-outfit/',
            source_title: "Taylor Swift Is Finally Ready to Change Her 'Reputation' (Outfit)",
            publisher: 'Marie Claire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
            notes: 'First new Reputation look of the tour (gold-and-black cobra bodysuit); Roberto Cavalli / Fausto Puglisi across the final leg',
          },
          {
            outlet: 'Newsweek',
            url: 'https://www.newsweek.com/taylor-swift-eras-tour-miami-billy-joel-record-hard-rock-stadium-1995165',
            source_title: "Taylor Swift Breaks Billy Joel's Hard Rock Stadium Record",
            publisher: 'Newsweek',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
            notes: '122,000+ over two nights broke the venue concert record (Billy Joel & Elton John, 1995)',
          },
          {
            outlet: 'FIU News',
            url: 'https://news.fiu.edu/2024/how-taylor-swifts-eras-tour-is-shaking-up-south-floridas-hospitality-scene',
            source_title: "How Taylor Swift's Eras Tour is shaking up South Florida's hospitality scene",
            publisher: 'Florida International University',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Projected Miami ADR above $200 (first October $200+ in over a decade); ~$1,327 per-attendee Eras Tour spend — economic-impact projections, not an audited post-hoc total',
          },
          {
            outlet: 'American Songwriter',
            url: 'https://americansongwriter.com/billy-joel-and-his-family-attend-taylor-swift-concert-the-night-she-broke-his-attendance-record-at-the-same-stadium/',
            source_title: 'Billy Joel and His Family Attend Taylor Swift Concert the Night She Broke His Attendance Record',
            publisher: 'American Songwriter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Two-night record window (Oct 18-19); Billy Joel attended Oct 19; third show Oct 20 unquantified',
          },
          {
            outlet: 'Bustle',
            url: 'https://www.bustle.com/entertainment/taylor-swift-eras-tour-outfits-miami',
            source_title: 'Taylor Swift Debuted 3 New Eras Tour Outfits In Miami',
            publisher: 'Bustle',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Three new Miami looks (Reputation cobra bodysuit, Fearless fringe, acoustic ombré dress) — no new Midnights look',
          },
          {
            outlet: 'TMZ',
            url: 'https://www.tmz.com/2024/10/18/travis-kelce-family-taylor-swift-eras-tour-miami/',
            source_title: "Travis Kelce's Family Supports Taylor Swift at Eras Tour in Miami",
            publisher: 'TMZ',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
            notes: 'Travis absent (NFL season); Donna, Jason and Kylie Kelce attended opening night',
          },
          {
            outlet: 'WWD',
            url: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-new-eras-tour-outfits-miami-1236692034/',
            source_title: "Taylor Swift's New Eras Tour Outfits: Reputation, Fearless & More",
            publisher: 'WWD',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'The cobra-bodysuit swap fueled Reputation (Taylor\'s Version) speculation; Swift\'s Oct 22 deflection ("nice when the crowd notices").',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-reputation-gold-reputation-bodysuit-doc-series-1235487475/',
            source_title: "Taylor Swift Shares the Secrets Behind That 'Reputation' Bodysuit",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Stylist attributed the bodysuit change to a fabric shortage, not a hidden Rep-TV message.',
          },
          {
            outlet: 'Audacy',
            url: 'https://www.audacy.com/wcbsfm/news/billy-joel-watched-taylor-swift-break-his-own-record',
            source_title: "Billy Joel watched in Miami as Taylor Swift broke his own record: 'Onward and upward'",
            publisher: 'Audacy',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Joel\'s Instagram: "Celebrating someone\'s success does not negate your own… Onward and upward"; family met Swift backstage.',
          },
          {
            outlet: 'STR / CoStar',
            url: 'https://www.hospitalitynet.org/news/4125179/the-end-of-an-eras-tour-taylor-swifts-final-impact-on-hotel-performance',
            source_title: "The end of an Era(s Tour): Taylor Swift's final impact on hotel performance",
            publisher: 'Hospitality Net (STR/CoStar data)',
            source_type: 'industry_data',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Miami RevPAR up 80%+ over the Oct 18–20 weekend on ~60% ADR growth; Saturday ADR ~$332.',
          },
        ],
        photos: [
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2024/10/taylor-swift-florence-welch-florida-miami-show.jpg?w=1600&h=900&crop=1',
            credit: 'John Shearer/TAS24/Getty Images for TAS Rights Management',
            caption: 'Florence Welch joins Taylor Swift for "Florida!!!" on opening night at Hard Rock Stadium, Oct. 18, 2024.',
            focalPoint: '44% 18%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/10/taylor-swift-2024-miami-eras-tour-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'TAS2024/Getty Images for TAS',
            caption: 'At the flower-painted piano in the acoustic set, night two at Hard Rock Stadium, Oct. 19, 2024.',
            focalPoint: '55% 18%',
          },
        ],
      },
    },
    {
      slug: 'eras-tour-new-orleans-sabrina',
      year: 2024,
      month: 10,
      day: 26,
      category: 'tour',
      title: 'Sabrina Carpenter crashes the Superdome',
      // Cross-links added 2026-07-24 (ledger #1310): the later Showgirl
      // title-track feature this duet prefigured, and the Miami Florence cameo
      // the page name-checks. Ids verified against content-vault.generated.
      relatedIds: [
        'moment:vault-tloas-the-title-track-hands-the-last-word-to-sabrina-carpenter',
        'moment:vault-ttpd-the-tour-comes-home-three-nights-in-miami-with-florence-welc',
      ],
      snippet:
        'Night two in New Orleans: Taylor announces she\'s about to sing a song that isn\'t hers, starts strumming "Espresso" — and Sabrina Carpenter appears for a three-song mashup with "Please Please Please" and "Is It Over Now?"',
      sourceUrl:
        'https://www.nola.com/entertainment_life/taylor_swift/sabrina-carpenter-taylor-swift-surprise-songs/article_166bb366-93e4-11ef-aa8f-77e530d02cf8.html',
      // Photo pass #762 run 10 (2026-07-18): page had zero photos. Billboard's own
      // Oct. 26 duet frame HTTP-checked, downloaded, vision-confirmed (Swift in the
      // orange evermore dress with guitar, Carpenter in white, jumbotron behind).
      // NOLA.com and Axios (cited) both block image hotlink verification; Rolling
      // Stone's og:image was an off-event archive Getty file — rejected.
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2024/10/taylor-swift-sabrina-carpenter-eras-tour-new-orleans-oct-26-2024-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'The Caesars Superdome residency ran Oct. 25–27, 2024, and the Saturday show got the leg\'s biggest surprise-song swing. Taylor almost never performs covers, so the setup was its own tell: "I\'m gonna sing a song that\'s not mine but it\'s someone that I really love," she told the dome, then took a fan\'s phone to call Sabrina Carpenter down. It landed in the guitar half of the acoustic set — the piano song that night was a separate "Hits Different"/"Welcome to New York" mashup. Carpenter, who had only ever opened for Taylor (on the 2023 Latin American leg), had never shared her stage before; this was their first performance together.\n\nSwift started "Espresso" alone, then brought Carpenter out to sing lead while she harmonized on guitar — threading her own "1989 (Taylor\'s Version)" vault track "Is It Over Now?" between Carpenter\'s two hits and closing on a duet of "Please Please Please." Taylor marveled that Carpenter had "literally one day off" on her own tour and came anyway; Carpenter posted afterward: "thank you for working late, thank you for being a singer, and thank you for having me… i love you."\n\nThe duet lived in fan video at the time — it postdated the 2023 concert film — but it turned out to be a prelude. A year later Carpenter guested on the title track of The Life of a Showgirl (Oct. 2025), and that song\'s official visual, screened at the Showgirl release-party event, folded in Eras Tour footage of the two on stage together. It joined the tour\'s all-timer surprise-guest list alongside Miami\'s Florence Welch cameo the weekend before.',
        sources: [
          {
            outlet: 'NOLA.com',
            url: 'https://www.nola.com/entertainment_life/taylor_swift/sabrina-carpenter-taylor-swift-surprise-songs/article_166bb366-93e4-11ef-aa8f-77e530d02cf8.html',
            source_title: "Taylor Swift surprises New Orleans with Sabrina Carpenter, 'Espresso' duet at Eras Tour",
            publisher: 'NOLA.com | The Times-Picayune',
            source_type: 'reputable_press',
            accessed_at: '2026-07-14',
            reliability_score: 4,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-sabrina-carpenter-espresso-mash-up-new-orleans-1235144110/',
            source_title: "See Taylor Swift Bring Out Sabrina Carpenter for 'Espresso' Mash-Up at New Orleans Show",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 5,
            notes: 'Exact on-stage intro; called a fan to bring Carpenter down',
          },
          {
            outlet: 'Billboard',
            url: 'https://ca.billboard.com/music/music-news/taylor-swift-sabrina-carpenter-espresso-surprise-new-orleans-1235812233/',
            source_title: "Taylor Swift, Sabrina Carpenter Sing 'Espresso' & More in New Orleans",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 5,
            notes: 'Mashup order Espresso -> Is It Over Now? -> Please Please Please; vocal split',
          },
          {
            outlet: 'NOLA.com',
            url: 'https://www.nola.com/entertainment_life/new-orleans-life-of-a-showgirl-connection/article_466cd932-9548-4b2d-8bcd-6d0c5688b91f.html',
            source_title: "Taylor Swift's 'The Life of a Showgirl' has a New Orleans connection you may have missed",
            publisher: 'NOLA.com | The Times-Picayune',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'First on-stage duet was New Orleans; Showgirl title-track visual folds in the footage',
          },
          {
            outlet: 'setlist.fm',
            url: 'https://www.setlist.fm/setlist/taylor-swift/2024/caesars-superdome-new-orleans-la-1357c595.html',
            source_title: 'Taylor Swift Setlist, Caesars Superdome, Oct. 26, 2024',
            publisher: 'setlist.fm',
            source_type: 'fan_database',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Guitar-slot Espresso mashup; piano slot was Hits Different/Welcome to New York',
          },
          {
            outlet: 'Fox 8 New Orleans',
            url: 'https://www.fox8live.com/2024/10/27/sabrina-carpenters-appearance-stuns-sold-out-superdome-audience-night-2-taylor-swift-eras-tour-stop-new-orleans/',
            source_title: "Sabrina Carpenter's appearance stuns sold-out Superdome audience Night 2 of Taylor Swift Eras tour stop in New Orleans",
            publisher: 'Fox 8 New Orleans (WVUE)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-14',
            reliability_score: 4,
          },
          {
            outlet: 'Axios New Orleans',
            url: 'https://www.axios.com/local/new-orleans/2024/10/27/photos-taylor-swift-eras-tour-sabrina-carpenter',
            source_title: "In photos: Taylor Swift's Eras Tour in New Orleans",
            publisher: 'Axios',
            source_type: 'reputable_press',
            accessed_at: '2026-07-14',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/10/taylor-swift-sabrina-carpenter-eras-tour-new-orleans-oct-26-2024-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'TAS2024/Getty Images for TAS',
            caption: 'Taylor Swift and Sabrina Carpenter mid-mashup on night two at the Caesars Superdome, Oct. 26, 2024.',
            focalPoint: '48% 42%',
          },
        ],
      },
    },
    {
      slug: 'eras-tour-indianapolis-us-finale',
      year: 2024,
      month: 11,
      day: 1,
      category: 'tour',
      // Cross-links (Answerer shard 6, 2026-07-24, ledger #1296): the final-leg
      // tour-sequence rail — leg opener (Miami), next stop (Toronto), finale
      // (Vancouver). Ids verified against content-vault.generated.ts.
      relatedIds: [
        'moment:vault-ttpd-the-tour-comes-home-three-nights-in-miami-with-florence-welc',
        'moment:vault-ttpd-the-long-canadian-goodbye-six-nights-in-toronto',
        'moment:vault-ttpd-the-eras-tour-takes-its-final-bow-in-vancouver',
        'moment:vault-ttpd-back-in-the-family-suite-for-a-chiefs-texans-divisional-play',
      ],
      title: 'The last American shows: Indianapolis breaks its own record three nights running',
      snippet:
        'The U.S. goodbye at Lucas Oil Stadium — the building\'s concert attendance record falls on night one, again on night two, and again on night three. 207,000 fans over one weekend.',
      sourceUrl:
        'https://www.wthr.com/article/entertainment/music/taylor-swift-eras-tour-indianapolis-night-3-third-concert-lucas-oil-stadium-us-stop/531-4bb86738-e858-4583-bc44-28d5554e7c8f',
      thumbnailUrl:
        'https://wish-media.s3.us-east-2.amazonaws.com/wp-content/2024/11/04/MAIN-PIC-ac-photo-taylor-swift-1.jpg',
      moment: {
        context:
          'Nov. 1–3, 2024: the final U.S. shows of the biggest tour ever staged, and Indianapolis treated them like a Super Bowl. Mayor Joe Hogsett proclaimed "Taylor Swift Weekend," and downtown leaned into a "Swift City" nickname — press-and-fan shorthand, not an official renaming — while roughly 81% of ticket holders came from out of state. Visit Indy anticipated a "healthy nine-figure" impact and economists floated $100M-plus, though an IU economist cautioned the true figure is essentially unknowable; read it as an estimate.\n\nEach acoustic surprise slot landed with the finality fans expected. Night 1 paired "The Albatross"/"Holy Ground" and "Cold As You"/"exile"; night 2, "The Prophecy"/"This Love" and "Maroon"/"Cowboy Like Me"; and the final U.S. night (Nov. 3), "Cornelia Street"/"The Bolter" and "Death by a Thousand Cuts"/"The Great War." From the stage that night she named it plainly — the very last U.S. show the Eras Tour would ever play.\n\nInside the building each crowd topped 69,000 and each night broke the attendance record the one before had just set, for 207,000 across the weekend — opening night alone drew 69,000, itself a Lucas Oil Stadium concert record. Indianapolis is also where the Taylor–Caitlin Clark friendship began: Clark attended, met Andrea Swift and Travis Kelce in a suite, and Taylor later sent her four bags of Eras merch with a note calling her "inspiring to watch from afar" and an invitation to a Chiefs game. After Indy, only Toronto and Vancouver remained.',
        sources: [
          {
            outlet: 'WTHR',
            url: 'https://www.wthr.com/article/entertainment/music/taylor-swift-eras-tour-indianapolis-night-3-third-concert-lucas-oil-stadium-us-stop/531-4bb86738-e858-4583-bc44-28d5554e7c8f',
            source_title: "Lucas Oil Stadium attendance record broken for 3rd consecutive night of Taylor Swift's Eras Tour",
            publisher: 'WTHR (NBC Indianapolis)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-14',
            reliability_score: 4,
          },
          {
            outlet: 'WFYI',
            url: 'https://www.wfyi.org/news/articles/taylor-swift-final-eras-tour-stop-indianapolis-record-attendance',
            source_title: "Lavender haze lingers over Indy after Taylor Swift's final U.S. Eras Tour concerts",
            publisher: 'WFYI (NPR Indianapolis)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-14',
            reliability_score: 4,
          },
          {
            outlet: 'Fox 59',
            url: 'https://fox59.com/news/entertainment/indianapolis-stop-on-taylor-swifts-eras-tour-expected-to-boost-citys-economy/',
            source_title: "Indianapolis stop on Taylor Swift's Eras tour expected to boost city's economy",
            publisher: 'Fox 59 Indianapolis',
            source_type: 'reputable_press',
            accessed_at: '2026-07-14',
            reliability_score: 4,
          },
          {
            outlet: 'IndyStar (via AOL)',
            url: 'https://www.yahoo.com/entertainment/were-indy-eras-tour-night-041337539.html',
            source_title: 'What were the Indy Eras Tour Night 3 surprise songs?',
            publisher: 'IndyStar',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Per-night surprise-song mashups; Nov. 3 "Cornelia Street"/"The Bolter" + "Death by a Thousand Cuts"/"The Great War"',
          },
          {
            outlet: 'TODAY',
            url: 'https://www.today.com/popculture/music/caitlin-clark-time-athlete-year-taylor-swift-rcna183630',
            source_title: 'Taylor Swift gave Caitlin Clark an inspirational note — and a special invitation',
            publisher: 'TODAY',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Clark met Andrea Swift and Kelce in the suite; four bags of Eras merch, note "inspiring to watch from afar," a Chiefs-game invite',
          },
          {
            outlet: 'WISH-TV',
            url: 'https://www.wishtv.com/news/entertainment-news/taylor-swift-economic-impact-indianapolis/',
            source_title: "Taylor Swift's Eras Tour to boost Indianapolis economy",
            publisher: 'WISH-TV',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Visit Indy "healthy nine-figure" estimate; IU economist Kyle Anderson caution that the true figure is unknowable',
          },
          {
            outlet: 'WTHR',
            url: 'https://www.wthr.com/article/entertainment/music/mayor-joe-hogsett-proclaims-taylor-swift-weekend-indianapolis-eras-tour-lucas-oil-stadium-tickets/531-481800b5-32f7-46d4-bbf7-e24812ae8e49',
            source_title: "Mayor Hogsett officially proclaims 'Taylor Swift Weekend' in Indianapolis",
            publisher: 'WTHR (NBC Indianapolis)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Official mayoral proclamation; "Swift City" as press/fan coloring, not a legal renaming',
          },
        ],
        // Photo pass (2026-07-18, #762): page had zero photos. WISH-TV's own
        // gallery shot from Night 3 (their S3 media origin, referenced by
        // wishtv.com's gallery page) + two WFYI staff photos by Elizabeth
        // Gabriel from the cited WFYI dispatch. All three HTTP-checked,
        // downloaded, and vision-confirmed this session.
        photos: [
          {
            url: 'https://wish-media.s3.us-east-2.amazonaws.com/wp-content/2024/11/04/MAIN-PIC-ac-photo-taylor-swift-1.jpg',
            credit: 'WISH-TV',
            caption: 'Lucas Oil Stadium before the Nov. 3, 2024 show — the last of three record-breaking Indianapolis nights, and the final U.S. date of the Eras Tour.',
            kind: 'archival',
            focalPoint: '50% 25%',
          },
          {
            url: 'https://npr.brightspotcdn.com/legacy/files/wfyi/articles/original/taylor-swift-fans3-110224-gabriel.jpg',
            credit: 'Elizabeth Gabriel / WFYI',
            caption: 'Swifties outside Lucas Oil Stadium hunting last-minute tickets — roughly 81% of the weekend\'s ticket holders came from out of state.',
            kind: 'archival',
            focalPoint: '50% 30%',
          },
          {
            url: 'https://npr.brightspotcdn.com/legacy/files/image/taylor-swift-fans2-110224-gabriel.png',
            credit: 'Elizabeth Gabriel / WFYI',
            caption: 'Fans in downtown Indianapolis, rebranded "Swift City" for the tour\'s final U.S. weekend.',
            kind: 'archival',
            focalPoint: '48% 25%',
          },
        ],
      },
    },
    {
      slug: 'eras-tour-toronto-goodbye',
      year: 2024,
      month: 11,
      day: 14,
      category: 'tour',
      title: 'The long Canadian goodbye: six nights in Toronto',
      relatedIds: [
          'moment:vault-ttpd-the-eras-tour-book-sells-814-000-copies-in-two-days',
        'moment:vault-ttpd-the-eras-tour-takes-its-final-bow-in-vancouver',
        'moment:vault-ttpd-the-last-american-shows-indianapolis-breaks-its-own-record-t',
        'moment:vault-ttpd-the-first-tour-ever-to-gross-2-billion',
      ],
      snippet:
        '"Toronto, we are sooo back!" Six sold-out nights at Rogers Centre — Nov. 14–16 and 21–23 — the tour\'s only Canadian residency before the finale, with the Prime Minister trading friendship bracelets in the crowd.',
      sourceUrl: 'https://www.cbc.ca/news/entertainment/taylor-swift-night-one-1.7383718',
      // Photo pass #762 run 10 (2026-07-18): page had zero photos. Both photos below
      // HTTP-checked (200 image/jpeg), downloaded, vision-confirmed. The CBC frame is
      // a CBC staff photo (Evan Mitsui) from the cited opening-night story; the
      // Billboard frame fronts the cited Trudeau story, captioned Nov. 14 Rogers Centre.
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2024/11/taylor-swift-toronto-eras-tour-2024-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'The Eras Tour\'s penultimate stop stretched across two weekends — Nov. 14–16 and 21–23, 2024 — the longest residency of the closing leg and Taylor\'s first Canadian shows since 2018. CBC\'s opening-night dispatch caught the mood of a city that had waited out the entire tour: "Toronto, we are sooo back!"\n\nBy the second weekend the crowd itself was the story: Prime Minister Justin Trudeau brought his family to the Nov. 22 show, where fan video caught him dancing to "You Don\'t Own Me" during the pre-show countdown and swapping friendship bracelets with Swifties on the concourse. Six nights, six sellouts — and then only Vancouver was left.\n\nEach night rotated a fresh surprise-song mashup: Night 1 (Nov. 14) opened with "My Boy Only Breaks His Favorite Toys" / "This Is Why We Can\'t Have Nice Things" and "False God" / "\'Tis the Damn Season," and the final night (Nov. 23) closed with "Sparks Fly" / "Message in a Bottle" and "You\'re Losing Me" / "How Did It End?" On Night 3 (Nov. 16) she brought out opener Gracie Abrams for a mashup of their duet "Us" with "Out of the Woods" — the run\'s only guest. After a standing ovation for "Champagne Problems" on the last night, Taylor teared up mid-speech — "I don\'t even know what I\'m saying anymore… I\'m just having a bit of a moment… It\'s not even the last show!" — the farewell that earned a Rolling Stone headline: "Bit of a Moment."\n\nUnderwritten by Rogers, the run made Taylor the first artist to play six shows at Rogers Centre. A later City of Toronto report pegged the "Swift lift" at $282M in total economic impact and $152M in direct spending — 93% of it from out-of-town visitors — across 240,000 concertgoers, with short-term-rental demand up 163% city-wide (245% around Rogers Centre) and about $39.7M in tax revenue across three levels of government.',
        sources: [
          {
            outlet: 'CBC News',
            url: 'https://www.cbc.ca/news/entertainment/taylor-swift-night-one-1.7383718',
            source_title: "'Toronto, we are sooo back!': Taylor Swift takes fans through her eras on epic opening night",
            publisher: 'CBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-14',
            reliability_score: 4,
          },
          {
            outlet: 'CBC News',
            url: 'https://www.cbc.ca/news/canada/toronto/trudeau-taylor-swift-toronto-eras-tour-1.7391709',
            source_title: 'Justin Trudeau attends Taylor Swift show in Toronto with family members',
            publisher: 'CBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-14',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-justin-trudeau-eras-tour-toronto-concert-1235837460/',
            source_title: 'Taylor Swift Inspires Canadian PM Justin Trudeau to Bust a Move at Eras Tour in Toronto',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-14',
            reliability_score: 4,
          },
          {
            outlet: 'TODAY',
            url: 'https://www.today.com/popculture/music/eras-tour-surprise-songs-rcna141380',
            source_title: "Taylor Swift's 'Eras Tour' Surprise Songs: Everything She's Played",
            publisher: 'TODAY / NBCUniversal',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Toronto surprise-song mashups, night by night (Nov 14-23, 2024)',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-final-toronto-eras-tour-tears-speech-1235179061/',
            source_title: "'Bit of a Moment': Taylor Swift Bids Teary Eras Tour Farewell to Toronto",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Nov 23 teary closing speech after "Champagne Problems"',
          },
          {
            outlet: 'People / AOL',
            url: 'https://www.aol.com/taylor-swift-brings-gracie-abrams-155125685.html',
            source_title: "Taylor Swift Brings Out Gracie Abrams for Mashup of 'Us' and 'Out of the Woods'",
            publisher: 'People / AOL',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Nov 16 guest: Gracie Abrams on "Us" x "Out of the Woods"',
          },
          {
            outlet: 'CBC News',
            url: 'https://www.cbc.ca/news/canada/toronto/city-report-taylor-swift-economic-impact-9.7034179',
            source_title: "Toronto got a $282M economic 'Taylor lift' after hosting Eras Tour in 2024",
            publisher: 'CBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: '$282M impact, $152M direct spend, 240,000 attendees, 163% STR surge, ~$39.7M tax; first artist to play six Rogers Centre shows',
          },
          {
            outlet: 'Destination Toronto',
            url: 'https://www.destinationtoronto.com/media/media-blog/post/six-swift-shows-bring-282m-in-economic-impact/',
            source_title: 'Six Swift shows in the 6ix to bring $282M in economic impact',
            publisher: 'Destination Toronto',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 5,
            notes: 'Primary economic-impact source for the six-show run',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/11/taylor-swift-toronto-eras-tour-2024-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Emma McIntyre/TAS24/Getty Images',
            caption: 'Opening night of the Toronto residency at Rogers Centre, Nov. 14, 2024.',
            focalPoint: '45% 24%',
          },
          {
            url: 'https://i.cbc.ca/ais/1.7384051,1731634346000/full/max/0/default.jpg?im=Crop%2Crect%3D%28607%2C0%2C3682%2C2071%29%3BResize%3D1180',
            credit: 'Evan Mitsui/CBC',
            caption: "The Lover set on night one — CBC's own photo from inside Rogers Centre.",
            focalPoint: '48% 18%',
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
            // Photo pass #762 (2026-07-19): viewed — golf cart in the Arrowhead tunnel, the
            // red-and-black checkered blazer from the Nov. 10 Broncos game, Andrea Swift at left.
            focalPoint: '49% 25%',
          },
          // Photo pass #762 (2026-07-19): second image for the page's other game — the Nov. 29
          // Black Friday arrival, from the cited TODAY article's own CDN (media-cldnry.s-nbcnews.com).
          // curl 200 image/jpeg 1500x2192; Read-viewed: the red half-zip (LV monogram trim) and
          // braid, matching the context's description of the Raiders-game look. TODAY's page
          // exposes no photographer byline, so the credit stays at the outlet level.
          {
            url: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1500w,f_auto,q_auto:best/rockcms/2024-11/taylor-swift-2-te-241129-4366e8.jpg',
            credit: 'Via TODAY',
            caption:
              'Arriving at Arrowhead in the red half-zip for the Black Friday Chiefs–Raiders game, Nov. 29, 2024.',
            focalPoint: '45% 15%',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 12,
      day: 8,
      category: 'tour',
      significance: 'defining', // the bookend to the biggest tour of her career, and of all time (docs/decisions.md, 2026-07-19)
      relatedIds: [
          'moment:vault-ttpd-the-long-canadian-goodbye-six-nights-in-toronto',
          'moment:vault-ttpd-show-100-at-anfield-and-the-news-the-tour-will-end',
        'moment:vault-midnights-the-eras-tour-kicks-off-in-glendale',
        'moment:vault-ttpd-the-first-tour-ever-to-gross-2-billion',
        // Reverse link (ledger #1526): the finale footage IS this concert film;
        // the film already lists this moment, so close the loop back to it.
        'moment:vault-tloas-the-final-show-the-full-vancouver-closer-streaming-at-last',
      ],
      title: 'The Eras Tour takes its final bow in Vancouver',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-ttpd-2", label: "Eras Tour finale", kind: "tour" },
      snippet: 'BC Place, 149 shows and 21 months after Glendale — more than 50,000 fans for the last night of the tour.',
      sourceUrl: 'https://www.nbcnews.com/pop-culture/pop-culture-news/end-era-taylor-swifts-eras-tour-coming-close-vancouver-rcna183279',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2024/12/taylor-swift-eras-tour-vancouver-fearless-dec-2024-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'The Dec. 6–8 farewell stand at BC Place drew roughly 60,000 fans a night. On the final evening, Dec. 8, 2024, Taylor closed the show — and the tour — telling the crowd she wanted "to thank every single one of you for being a part of the most thrilling chapter of my entire life to date."\n\nBy the numbers it was the largest concert tour ever staged: 149 shows across 21 months, five continents and 51 cities, drawing 10,168,008 fans and grossing $2,077,618,725 — the first tour in history to cross $2 billion, and by a wide margin the highest-grossing of all time.\n\nEach of the three Vancouver nights carried its own surprise-song pairing. Night one (Dec. 6) mashed "Haunted" into "Wonderland" on guitar and "Never Grow Up" into "The Best Day" — for her parents — at the piano; night two (Dec. 7) brought opener Gracie Abrams out for an "I Love You, I\'m Sorry"/"Last Kiss" guitar duet, then "The Tortured Poets Department" into "Maroon." For the last surprise slot of the entire tour she played "A Place in This World," from her 2006 debut, into "New Romantics" on guitar, then sat at the piano for "Long Live" — altering the lyric to "It was the end of an era, but the start of an age" — flowing into "New Year\'s Day" and "The Manuscript."\n\nAll three shows were professionally filmed. A year later the footage became two Disney+ releases on Dec. 12, 2025: "The End of an Era," a six-episode documentary on the tour\'s inner workings, and "Taylor Swift | The Eras Tour | The Final Show," a concert film of this Vancouver closer carrying "The Tortured Poets Department" set for the first time. Three days after the finale Taylor had posted 17 photos with a caption borrowed from "All Too Well": "It was rare. I was there. I remember it."',
        sources: [
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/pop-culture/pop-culture-news/end-era-taylor-swifts-eras-tour-coming-close-vancouver-rcna183279',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-eras-tour-ends-message-photos-1235853564/',
          },
          {
            outlet: 'Time',
            url: 'https://time.com/7199590/taylor-swift-eras-tour-final-numbers/',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-surprise-song-performances-the-eras-tour-vancouver-1235197102/',
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2025/music/news/taylor-swift-eras-tour-documentary-last-show-disney-1236547665/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/12/taylor-swift-eras-tour-vancouver-fearless-dec-2024-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Kevin Winter/TAS24/Getty Images',
            focalPoint: '47% 22%',
          },
          // Photo pass #762 run 10 (2026-07-18): second Vancouver frame from the cited
          // NBC News story's own CDN; NBC's caption dates it Dec. 6, 2024, Vancouver.
          // HTTP-checked, downloaded, vision-confirmed (Reputation-set bodysuit).
          {
            url: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2024-12/241208-taylor-swift-mn-1245-48703f.jpg',
            credit: 'Kevin Winter/Getty Images for TAS Rights Management',
            caption: 'The Reputation set on the first night of the farewell stand at BC Place, Dec. 6, 2024.',
            focalPoint: '59% 22%',
          },
          // Photo depth pass (round 2, 2026-07-19): nine more frames, all
          // explicitly dated Dec. 8, 2024 (the actual final night) via TODAY's
          // live-blog CDN (NBC's s-nbcnews.com, same house photographer as
          // the two photos above). Each verified HTTP 200 + image/jpeg,
          // downloaded and viewed this session.
          {
            url: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2024-12/surprise-songs-me-241208-6e1f8f.jpg',
            credit: 'Kevin Winter/TAS24/Getty Images for TAS Rights Management',
            caption: 'The first surprise song of the finale, played acoustic — the set that closed with the "Long Live" mashup.',
            kind: 'primary',
            focalPoint: '50% 35%',
          },
          {
            url: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2024-12/taylor-swift-acousitic-set-ae-241208-d4cacc.jpg',
            credit: 'Kevin Winter/TAS24/Getty Images for TAS Rights Management',
            caption: 'Mid-acoustic-set on the final night, under the tour\'s starfield backdrop.',
            kind: 'primary',
            focalPoint: '55% 35%',
          },
          {
            url: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2024-12/taylor-swift-eras-tour-ae-241208-e44bdc.jpg',
            credit: 'Kevin Winter/TAS24/Getty Images for TAS Rights Management',
            caption: 'The folklore set, singing "Betty" in front of the cabin, during the Dec. 8, 2024 finale.',
            kind: 'primary',
            focalPoint: '75% 45%',
          },
          {
            url: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2024-12/taylor-swift-vancouver-ae-241208png-6500d5.jpg',
            credit: 'Kevin Winter/TAS24/Getty Images for TAS Rights Management',
            caption: 'Speaking to the crowd before "All Too Well" on the final night at BC Place.',
            kind: 'primary',
            focalPoint: '50% 25%',
          },
          {
            url: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2024-12/eras-tour-orbs-ae-241208-90dc8a.jpg',
            credit: 'Kevin Winter/TAS24/Getty Images for TAS Rights Management',
            caption: 'Fans hold up glowing orbs during "Willow" — the arena-wide light show that became an Eras Tour signature.',
            kind: 'archival',
            focalPoint: '55% 65%',
          },
          {
            url: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2024-12/taylor-swift-reputation-ae-241208-4905ed.jpg',
            credit: 'Kevin Winter/TAS24/Getty Images for TAS Rights Management',
            caption: 'The Reputation set on the finale night, Dec. 8, 2024.',
            kind: 'primary',
            focalPoint: '55% 30%',
          },
          {
            url: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2024-12/taylor-swift-speak-now-vancouver-ae-241208-cffd68.jpg',
            credit: 'Kevin Winter/TAS24/Getty Images for TAS Rights Management',
            caption: 'The Speak Now set, ballgown and all, on the tour\'s last night.',
            kind: 'primary',
            focalPoint: '35% 55%',
          },
          {
            url: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2024-12/taylor-swift-ttpd-ae-241208-28a3c3.jpg',
            credit: 'Kevin Winter/TAS24/Getty Images for TAS Rights Management',
            caption: 'On the moving platform during "The Tortured Poets Department" segment, finale night.',
            kind: 'primary',
            focalPoint: '55% 40%',
          },
          {
            url: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1240w,f_auto,q_auto:best/rockcms/2024-12/taylor-swift-1989-2-ae-241208-a3754a.jpg',
            credit: 'Kevin Winter/TAS24/Getty Images for TAS Rights Management',
            caption: 'The 1989 set, gold bralette and red skirt, on the screen above the stage during the final show.',
            kind: 'primary',
            focalPoint: '55% 45%',
          },
        ],
        // Rumor Desk 2026-07-29: the structural home for the open question this
        // finale created — will Swift ever tour again? Forward-looking tour
        // speculation, explicitly allowed by the redlines; no location (an
        // unannounced future tour is L0 by default and this names none). Seeds
        // the Tortured Poets era into the rumor system (previously uncovered),
        // deliberately spread away from the wedding page.
        rumors: [
          {
            claim:
              'As the Eras Tour wound down, an Us Weekly cover story reported that Taylor was weighing another tour — "albeit on a smaller scale than the Eras Tour" — as soon as 2026, a source saying "She had such a great experience on Eras. She really wants to do it again," while cautioning nothing was locked: "A lot of it hinges on what happens over the next year with Travis."',
            reportedBy: 'Us Weekly',
            reportedOn: '2024-12-03',
            status: 'unconfirmed',
            url: 'https://www.usmagazine.com/celebrity-news/news/taylor-swifts-next-album-engagement-burning-questions-answered-excl/',
            note: 'Forward-looking tour speculation; no location. Re-checked 2026-08-05: no tour announced and the source\'s 2026 window has largely passed — Taylor released The Life of a Showgirl, married Kelce, and told BBC Radio 1 in October 2025 she was "so tired," with no plans to tour soon. Unlikely now but not formally denied; resolves on an announcement, fades otherwise.',
            sourceTier: 'tabloid',
            lastCheckedOn: '2026-08-05',
          },
        ],
      },
    },
    {
      significance: 'notable', // the single largest economic figure of her touring career, the companion number to the already-defining Vancouver finale (docs/decisions.md, 2026-07-19)
      relatedIds: ['moment:vault-ttpd-the-eras-tour-takes-its-final-bow-in-vancouver'],
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
        // Photo re-check (2026-07-19, Tier 3): stays at one image — Wikimedia
        // Commons has no Rogers Centre Toronto Eras Tour category or files
        // from the November 2024 dates this $2B tally was announced against.
        // Re-reviewed 2026-08-01 (#762): checked for a Vancouver final-show
        // (Dec. 8, 2024) photo tied to the tour-total announcement — nothing
        // on an outlet CDN or Commons beyond wire/Getty art already excluded.
        // Stays reviewed-sparse at one image.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/12/taylor-swift-eras-tour-rogers-centre-toronto-012-2024-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Emma McIntyre/TAS24/Getty Images',
            focalPoint: '45% 27%',
          },
        ],
      },
    },
    {
      significance: 'notable', // an outright nomination record, though the win itself (already 'defining' elsewhere) is the bigger night (docs/decisions.md, 2026-07-19)
      relatedIds: ['moment:vault-midnights-a-record-fourth-album-of-the-year-grammy-for-midnights'],
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
          'The nomination broke her tie with Barbra Streisand — at six apiece — for the most Album of the Year nods by any female artist, putting TTPD on a ledger that already held Fearless, Red, 1989, folklore, evermore, and Midnights.\n\nThe same announcement gave "Fortnight" a Song of the Year nomination, her eighth in that category and a record no other songwriter holds, en route to a 58-nomination career total. Her stated stance on the stakes: "For me, the award is the work. All I want to do is keep being able to do this." The Grammy itself went to Beyoncé\'s Cowboy Carter at the February 2025 ceremony, ending Taylor\'s bid for a fifth Album of the Year win.',
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/1409681/taylor-swifts-historic-2025-grammy-nominations-prove-shes-anything-but-a-tortured-poet',
          },
          { outlet: 'NPR', url: 'https://www.npr.org/2025/02/02/nx-s1-5279565/2025-grammys-beyonce-kendrick-lamar' },
        ],
        // T16 photo pass (2026-07-09): the nominated album's cover from
        // Wikipedia's stable upload.wikimedia.org copy. Verified HTTP 200.
        // Photo pass (2026-07-18, #762): + Getty Toronto show photo from the
        // cited Billboard nominations-reaction story (she reacted to the six
        // nods from the Toronto stage that night). Downloaded + vision-confirmed.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/6/6e/Taylor_Swift_%E2%80%93_The_Tortured_Poets_Department_%28album_cover%29.png',
            focalPoint: '50% 55%',
            credit: 'Republic Records',
            caption: 'The Tortured Poets Department — her record seventh Album of the Year nominee.',
            kind: 'archival',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/11/Taylor-Swift-04-The-Eras-Tour-Toronto-ON-345-billboard-1548.jpg?w=1024',
            focalPoint: '48% 26%',
            credit: 'Getty Images (via Billboard)',
            caption: 'On stage in Toronto the week of the announcement — she thanked fans there for the album\'s six nominations.',
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
      threadIds: ['the-proposal'],
      // Cross-link (Stage 3, 2026-07-27): the other Super Bowl LIX sighting
      // on the same "the-proposal" thread, two weeks earlier.
      relatedIds: ['moment:vault-ttpd-a-confetti-kiss-after-the-chiefs-punch-their-super-bowl-tick'],
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
            // Focal point set 2026-07-18 (photo-enrichment run 7, #762) by viewing:
            // wide suite shot; Swift (white tank, dark bob) stands left of center
            // at the rail, face in the upper-middle band.
            focalPoint: '37% 38%',
          },
          {
            // Added 2026-07-18 (photo-enrichment run 21, #762): Billboard's own
            // wp-content frame of Swift seated beside Ice Spice in the Superdome
            // suite — the exact pairing the jumbotron caught during the boos.
            // Downloaded and vision-confirmed; no watermark; 1024px render.
            url: 'https://www.billboard.com/wp-content/uploads/2025/02/taylor-swift-super-bowl-lix-2025-billboard-1548.jpg?w=1024',
            credit: 'Jamie Squire/Getty Images via Billboard',
            caption: 'Ice Spice and Taylor Swift at Super Bowl LIX at Caesars Superdome, Feb. 9, 2025.',
            // Focal point set by viewing: Swift seated just right of center,
            // Ice Spice at her left; split keeps both faces under a wide crop.
            focalPoint: '52% 40%',
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
          'Styled by Joseph Cassell Falconer, the Feb. 9, 2025 Superdome look built Chiefs red-and-white out of luxury basics: a shell-white Saint Laurent blazer with exaggerated shoulders worn open over a white Alaïa bodysuit styled like a tank top, custom crystal-embellished Purple Brand denim shorts, white over-the-knee Paris Texas boots, and a red Givenchy Nano Voyou bag carrying the team\'s other color.\n\nThe jewelry did the sentimental work: the custom Lorraine Schwartz ruby "T" necklace — repurposed from her Grammys-week styling a week earlier — plus a Retrouvai ruby ring and a Logan Hollowell gold hand chain. The sharp tailoring was a callback to the Versace blazers she wore performing "The Man" on tour, per Marie Claire; the game itself went far worse than the outfit, with Kansas City\'s three-peat bid ending 40-22.',
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
            // Focal point set 2026-07-18 (photo-enrichment run 7, #762) by viewing:
            // Swift centered at the suite rail in the white tank, face high in frame.
            focalPoint: '52% 24%',
          },
          {
            url: 'https://cdn.mos.cms.futurecdn.net/cpMbV3jceZ6rfU2apDrhta.jpg',
            credit: 'Getty Images',
            // Image-fix pass (2026-07-10): #342 — same finding as #341: no blazer in frame. Caption
            // added rather than an unverified replacement URL; see note on the sibling photo above.
            caption:
              'Full-length view in the Superdome suite, blazer already off; the white tank top and crystal-denim shorts were worn underneath it.',
            // Focal point set 2026-07-18 (run 7) by viewing: standing full-length
            // left-of-center in the suite, face in the upper quarter of the frame.
            focalPoint: '44% 22%',
          },
        ],
        // Shop pass (2026-07-22): the exact Saint Laurent blazer is
        // discontinued -- a current white double-breasted blazer,
        // verified in stock, closest real match.
        products: [
          {
            brand: 'St. John',
            item: 'Double-Breasted Knit Blazer',
            retailer: 'shop.simon.com',
            url: 'https://shop.simon.com/products/st-john-double-breasted-knit-blazer',
            price: '$599.98',
            isAlternative: true,
            altNote: 'Her exact Saint Laurent blazer is discontinued -- this is a current white double-breasted blazer with padded shoulders in a similar longline cut, in knit rather than tailored fabric.',
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
          'Beth Garrabrant — the photographer behind the folklore and Midnights campaigns — shot the TTPD package as intimate bedroom scenes: tea-soaked sepia, stark black-and-white, and "greige" color-leached tones, with Taylor in half-undone slip pieces from The Row, Saint Laurent, Khaite, and Meshki. The dishabille styling was the point — an album about coming apart, photographed mid-unraveling, and a hard swerve from Midnights\' jewel-toned glitz.\n\nStylists traced the era\'s Victorian-gothic, corseted-mourning-gown throughline across red carpets and the tour, mixing high couture (Schiaparelli, Alaïa, Gabriela Hearst) with accessible brands like Free People and Reformation.',
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
            // Focal point set 2026-07-18 (photo-enrichment run 7, #762) by viewing:
            // three-panel collage of Garrabrant portraits; the center panel's
            // full-length figure carries the crop, faces sit in the upper third.
            focalPoint: '52% 25%',
          },
          {
            // Added 2026-07-18 (photo-enrichment run 21, #762): Marie Claire's
            // own composite from this page's source article — Garrabrant bedroom
            // portraits, the Manuscript CD package, and the era's street/red-
            // carpet looks in one frame. Downloaded and vision-confirmed.
            url: 'https://cdn.mos.cms.futurecdn.net/2oQqrmEL7ZpA7ZUzzMnqk8.png',
            credit: 'Beth Garrabrant; Getty Images via Marie Claire',
            caption: "Marie Claire's composite of the era: Garrabrant's album portraits, the TTPD CD package, and the Victorian-gothic looks that carried the aesthetic onto red carpets.",
            // Focal point set by viewing: busy collage; the cut-out foreground
            // figure (black sequined moon dress) reads as the subject, face in
            // the upper-right third.
            focalPoint: '66% 28%',
          },
          {
            // Added 2026-07-18 (photo-enrichment run 21, #762): the Fortnight
            // video's Victorian-poet typewriter frame from the same Marie Claire
            // article — the "corseted-mourning-gown throughline" the context
            // paragraph describes. Downloaded and vision-confirmed; distinct
            // from the face-tattoo ytimg frame used on the Fortnight page.
            url: 'https://cdn.mos.cms.futurecdn.net/VTGUgGFbL2PbwFRdhdCUxk.png',
            credit: 'YouTube via Marie Claire',
            caption: "The Victorian-mourning styling carried into the era's visuals: Taylor at the typewriter in the 'Fortnight' video.",
            // Focal point set by viewing: centered figure at the typewriter,
            // face in the upper quarter of the frame.
            focalPoint: '50% 25%',
          },
        ],
        // Shop pass (2026-07-22): no single named piece from the shoot is
        // identified -- a current off-shoulder grey top, verified in
        // stock, in the same greige, undone spirit.
        products: [
          {
            brand: 'Princess Polly',
            item: 'Ashlinn Off Shoulder Drapey Top',
            retailer: 'us.princesspolly.com',
            url: 'https://us.princesspolly.com/products/ashlinn-off-shoulder-drapey-top-grey',
            price: '$45.00',
            isAlternative: true,
            altNote: 'No single piece from the shoot is identified -- this is a current grey off-shoulder top in the same greige, undone-styling spirit as the album photography.',
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
            // Photo pass #762 (2026-07-19): viewed — close-in angle on the mannequin, ruffled
            // bodice in the upper-left quadrant of the frame.
            focalPoint: '46% 28%',
          },
          // Photo pass #762 (2026-07-19): second angle of the same V&A Songbook Trail display,
          // Commons file "Taylor Swift Songbook Trail Fortnight display 01.jpg" (CC0, author
          // 14GTR — license checked via the Commons API this session). curl 200 image/jpeg;
          // Read-viewed: the full case with the typewriter, neon cabling, and book plinth —
          // distinct from the display_05 crop above (display_05 is the only other Songbook file
          // used in this seed, so no cross-page duplicate).
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Taylor_Swift_Songbook_Trail_Fortnight_display_01.jpg/960px-Taylor_Swift_Songbook_Trail_Fortnight_display_01.jpg',
            credit: '14GTR / Wikimedia Commons (CC0)',
            caption:
              "The full Fortnight stop on the V&A's Songbook Trail: the Elena Velez gown staged on a plinth of antique books, with the typewriter and neon wiring completing the scene.",
            kind: 'archival',
            focalPoint: '47% 33%',
          },
        ],
        // Shop pass (2026-07-22): the Elena Velez runway gown is not sold
        // at mainstream retail -- a current black Victorian-gothic
        // corset gown, verified in stock, closest real match.
        products: [
          {
            brand: 'Dare Fashion Globe',
            item: 'Renaissance Dress in Black (Dark Raven)',
            retailer: 'darefashionglobe.com',
            url: 'https://darefashionglobe.com/products/renaissance-corset-dress-black',
            price: '$69.99',
            isAlternative: true,
            altNote: 'The Elena Velez runway gown is not sold at mainstream retail -- this is a current black Victorian-gothic corset gown in the same silhouette family (top by UNTTLD not separately sourced).',
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
          'The Sept. 11, 2024 look adapted a runway design from Dior\'s Resort 2025 collection — a show Dior staged in Scotland — into a tartan bustier with black hot pants and an open skirt that flowed behind her "like a Highland warrior\'s cape" — Marie Claire\'s phrase for it. Joseph Cassell Falconer styled it with Stuart Weitzman thigh-high boots, lace-up leather gloves, and a plaid choker cut to match the corset print; hair was a classic blow-out over heavy black eyeliner and a lighter-than-usual red lip.\n\nFans immediately filed the black-and-plaid punk styling as "Reputation"-coded — the same guessing game her black Versace VMAs look had set off in 2023 — though she never commented on the inspiration. Whatever the signal, the night itself became a record haul: she left with seven Moon Persons, including her third straight Video of the Year.',
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
          {
            url: 'https://cdn.mos.cms.futurecdn.net/oKWbowx4E2Tgw6ZLAHrb4a.jpg',
            credit: 'Getty Images',
            // Photo pass #762 (2026-07-19): viewed — landscape close-up against the neon "20"
            // stage sign, face left-of-center in the upper third.
            focalPoint: '46% 30%',
          },
          {
            url: 'https://cdn.mos.cms.futurecdn.net/KVrtqLFYbAQRxkZBWvfzjd.jpg',
            credit: 'Getty Images',
            // Photo pass #762 (2026-07-19): viewed — full-length carpet shot, face high in frame.
            focalPoint: '52% 15%',
          },
        ],
        // Shop pass (2026-07-22): the custom Dior runway look was never
        // sold at retail -- a current plaid tweed corset, verified in
        // stock, closest real match.
        products: [
          {
            brand: 'AKIRA',
            item: 'Look At Me Baby Tweed Corset',
            retailer: 'shopakira.com',
            url: 'https://shopakira.com/products/look-at-me-baby-tweed-corset',
            price: '$45.90',
            isAlternative: true,
            altNote: 'The custom Dior runway look was never sold at retail -- this sources the corset only, a pink-and-black plaid rather than the exact tartan, without the cape.',
          },
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
            // Focal point set 2026-07-18 (photo-enrichment run 7, #762) by viewing:
            // full-length red-carpet pose in the red Westwood mini; face high,
            // just left of center.
            focalPoint: '48% 14%',
          },
          {
            // Added 2026-07-18 (photo-enrichment run 21, #762): Marie Claire's
            // own futurecdn render of the Getty close-up — ruby chandelier
            // earrings, red lip, the draped one-shoulder bodice. Downloaded and
            // vision-confirmed against the same MusiCares Fire Relief backdrop
            // as the existing CBS full-length.
            url: 'https://cdn.mos.cms.futurecdn.net/8jriSdzqvBHFQGNi9PLQzV.jpg',
            credit: 'Getty Images via Marie Claire',
            caption: 'The details up close: ruby chandelier earrings and the draped, corseted Westwood bodice.',
            // Focal point set by viewing: landscape close-up, face left of
            // center with eyes in the upper-middle band.
            focalPoint: '44% 34%',
          },
          {
            // Added 2026-07-18 (photo-enrichment run 21, #762): Marie Claire's
            // futurecdn render of the sharp Getty full-length — the Lorraine
            // Schwartz "T" thigh chain and red Casadei heels the snippet calls
            // out are clearly visible. Downloaded and vision-confirmed.
            url: 'https://cdn.mos.cms.futurecdn.net/GPDhDuw6VEnmseepjCckUf.jpg',
            credit: 'Getty Images via Marie Claire',
            caption: 'The full look on the carpet: the one-shoulder mini with the diamond thigh chain dangling its single "T".',
            // Focal point set by viewing: full-length portrait pose, face high
            // and just left of center.
            focalPoint: '48% 20%',
          },
        ],
        // Shop pass (2026-07-22): the custom Vivienne Westwood mini was
        // never sold at retail -- a current red sequined one-shoulder
        // mini, verified in stock, closest real match.
        products: [
          {
            brand: 'Armani Exchange',
            item: 'Sequin One Shoulder Mini Dress',
            retailer: 'shop.simon.com',
            url: 'https://shop.simon.com/products/sequin-one-shoulder-mini-dress-in-red',
            price: '$111.00',
            isAlternative: true,
            altNote: 'The custom Vivienne Westwood mini was never sold at retail -- this is a current red sequined one-shoulder mini in the same color and asymmetric silhouette (thigh chain not separately sourced).',
          },
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
          'Adapted from a look in Schiaparelli\'s Fall 2023 ready-to-wear collection, the gown added a dramatic train and high leg slit for the Feb. 4, 2024 ceremony.\n\nTaylor paired it with opera-length gloves, black Giuseppe Zanotti sandals, and more than 300 carats of black-and-white diamonds from Lorraine Schwartz, including a choker built around a vintage watch face.',
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
            // Focal point set 2026-07-18 (photo-enrichment run 7, #762) by viewing:
            // full-length carpet shot, the white train sweeping right; face high
            // in the upper-left quadrant.
            focalPoint: '34% 15%',
          },
        ],
        // Shop pass (2026-07-22): the custom Schiaparelli Haute Couture
        // gown was never sold at retail -- a current ivory strapless
        // slinky gown, verified in stock, closest real match.
        products: [
          {
            brand: 'MESHKI',
            item: 'Bex Strapless Slinky Maxi Dress With Split',
            retailer: 'meshki.us',
            url: 'https://www.meshki.us/products/bex-strapless-slinky-maxi-dress-with-split-ivory',
            price: '$95.00',
            isAlternative: true,
            altNote: 'The custom Schiaparelli gown was never sold at retail -- this is a current ivory strapless gown with a leg slit in a similar draped spirit, without the corset-style back lacing.',
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
          'The "Candescence" gown, from Matičevski\'s Spring 2024 collection, is engineered like sculpture: a strapless bodice with internal boning and a rounded, collar-skimming neckline, in crisp pearl-white crinkled cotton gathered asymmetrically at the hip into a high-low skirt. It surfaces in the video\'s most-teased beat — Taylor hurling an object at a glass pane — and WWD framed the bridal-coded silhouette as the romantic counterweight to the video\'s asylum gothic.\n\nThe gown is one of several distinct costume changes across the "Fortnight" video\'s different vignettes — a separate look from the black Elena Velez/Unttld gothic ensemble already covered elsewhere in this era, and from the Celine-designed piece in the video\'s rain-soaked finale.',
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
              'Designer lookbook image of Toni Matičevski\'s "Candescence" gown, shown here on a runway/lookbook model — not Taylor, who wears the same gown in the "Fortnight" video\'s opening scene.',
            // Photo pass #762 (2026-07-19): viewed — the sculptural white gown fills the frame on
            // the lookbook model; the gathered bodice is the visual anchor, upper-center.
            focalPoint: '52% 22%',
          },
          // Photo pass #762 (2026-07-19): re-checked for a second image — the official video's
          // maxresdefault thumbnail (oEmbed-verified @TaylorSwift) is the face-tattoo close-up,
          // not the white-gown opening scene, so it would misrepresent this moment (and near-
          // duplicates the frame already on the TTPD-photography page). Page stays at one photo,
          // consistent with the 2026-07-10 image-fix finding above.
        ],
        // Shop pass (2026-07-22): the Toni Matičevski "Candescence" gown
        // is no longer sold -- a current ivory off-shoulder crepe gown,
        // verified in stock, closest real match.
        products: [
          {
            brand: 'MESHKI',
            item: 'Aphrodite Off Shoulder Crepe Gown',
            retailer: 'meshki.us',
            url: 'https://www.meshki.us/products/aphrodite-off-shoulder-crepe-gown-ivory',
            price: '$339.00',
            isAlternative: true,
            altNote: 'The "Candescence" gown is no longer sold -- this ivory crepe gown keeps the sculptural gathering and dramatic white silhouette, off-shoulder with a fishtail hem rather than high-low cotton.',
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
            // Photo pass #762 (2026-07-19): viewed — mid-dance on the marked rehearsal floor,
            // figure centered with the face in the upper third.
            focalPoint: '49% 30%',
          },
          // Photo pass #762 (2026-07-19): second look from the same cited Blogilates post's own
          // CDN (i0.wp.com/blogilates.com) — the lavender tulle skirt + matching corset bra the
          // snippet names. curl 200 image/png 2302x1500; Read-viewed: single video frame, no
          // watermark or collage, distinct from the plum-skort frame above.
          {
            url: 'https://i0.wp.com/www.blogilates.com/wp-content/uploads/2024/08/Screenshot-2024-08-21-at-10.16.26-AM.png?ssl=1',
            credit: 'Screenshot via Blogilates, from Taylor Swift\'s official "I Can Do It With a Broken Heart" music video (Republic Records)',
            caption: 'The lavender Popflex tulle skirt and matching corset bra, mid-rehearsal in the video.',
            focalPoint: '41% 25%',
          },
        ],
        // Shop pass (2026-07-22): the exact real Popflex piece from the
        // video, verified in stock.
        products: [
          {
            brand: 'POPFLEX',
            item: 'Twirl Skort - Plum',
            retailer: 'popflexactive.com',
            url: 'https://www.popflexactive.com/products/twirl-skort-plum',
            price: '$54.00',
            isAlternative: false,
            altNote: 'The exact Popflex Twirl Skort in Plum shown in the video -- sourcing the skort only, not the lavender set, WISKII skirt, or boots.',
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
      threadIds: ['the-proposal'],
      title: 'Back in the family suite for a Chiefs-Texans divisional playoff win',
      snippet:
        'Sat between her parents Scott and Andrea for the Jan. 18 divisional-round game at Arrowhead, with Caitlin Clark — personally invited by Travis — a row back and Ed Kelce also in the suite.',
      sourceUrl: 'https://www.si.com/wnba/caitlin-clark-watching-chiefs-texans-playoff-game-suite-taylor-swift',
      thumbnailUrl:
        'https://images2.minutemediacdn.com/image/upload/c_crop,x_0,y_0,w_594,h_334/c_fill,w_720,ar_16:9,f_auto,q_auto,g_auto/images/voltaxMediaLibrary/mmsport/si/01jhxrrtgddvpfcwhn8k.jpg',
      relatedIds: [
        'moment:vault-tloas-back-at-arrowhead-with-caitlin-clark-nine-days-after-her-alb',
        'moment:vault-ttpd-the-last-american-shows-indianapolis-breaks-its-own-record-t',
      ],
      moment: {
        context:
          "Kansas City beat Houston 23-14 to advance to the AFC Championship, pulling away from a 13-6 halftime lead in the Jan. 18, 2025 divisional-round game at Arrowhead. Taylor watched from the family suite between her parents, Scott and Andrea, with Ed Kelce alongside — the postseason continuation of a regular season she'd spent as an Arrowhead fixture.\n\nIt was Caitlin Clark's first Chiefs game of the season, and this time the invitation came directly from Travis Kelce — Taylor had previously invited her to a game via a handwritten letter during the Eras Tour's Indianapolis stop, but this was Clark's first time taking her up on it. Clark, who had passed on the offseason Unrivaled league, sat a row back from the suite's front line.",
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
            // Photo pass #762 (2026-07-19): viewed — suite window above the crowd; Swift's face
            // sits right-of-center behind the glass, Scott Swift mid-frame.
            focalPoint: '73% 37%',
          },
          // Photo pass #762 (2026-07-19): checked the cited SI story for a second image — it
          // carries only this one frame in different crops, and SI is the page's only source.
          // Page stays at one photo rather than pulling from an uncited host.
        ],
      },
    },
    {
      year: 2025,
      month: 1,
      day: 26,
      category: 'sighting',
      threadIds: ['the-proposal'],
      // Cross-link (Stage 3, 2026-07-27): the follow-up Super Bowl LIX
      // sighting two weeks later, same "the-proposal" thread.
      // (Stage 3, 2026-08-06): also links back to the Arrowhead divisional
      // win that punched the Chiefs' Super Bowl ticket.
      relatedIds: [
        'moment:vault-ttpd-booed-at-the-superdome-cheering-for-a-three-peat-that-fell-s',
        'moment:vault-ttpd-back-at-arrowhead-for-a-monday-night-win-over-new-orleans',
      ],
      title: 'A confetti kiss after the Chiefs punch their Super Bowl ticket',
      snippet:
        'Watched the Jan. 26 AFC Championship win over Buffalo from a VIP suite, then shared a kiss with Travis in the falling confetti with his mom Donna Kelce right there for it.',
      sourceUrl: 'https://abcnews.com/GMA/Culture/taylor-swift-celebrates-kansas-city-chiefs-afc-win/story?id=118133249',
      thumbnailUrl:
        'https://i.abcnewsfe.com/a/5bb420d4-c3a8-46c8-91e6-d0ba2429a491/taylor-swift3-ap-ml-250127_1737980318936_hpMain.jpg',
      moment: {
        context:
          'Kansas City beat Buffalo 32-29 in the Jan. 26, 2025 AFC Championship at Arrowhead, sending the Chiefs to a second straight Super Bowl — and a Feb. 9 shot at becoming the first NFL team ever to win three in a row. Kelce had two catches for 19 yards in the win, his fifth conference title as a Chief.\n\nWhen the confetti cannons fired, cameras found the night\'s defining image: Taylor and Kelce kissing amid the falling paper with Donna Kelce beside them. By ABC\'s tally, the Chiefs had won every game Taylor attended that season — eight regular-season dates at Arrowhead plus both playoff rounds — a streak that would finally break two weeks later in New Orleans.',
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
            // Focal point set 2026-07-18 (photo-enrichment run 7, #762) by viewing:
            // the confetti kiss itself — the two faces meet right of center,
            // upper third, her gloved hand on his cheek.
            focalPoint: '55% 32%',
          },
          {
            url: 'https://i.abcnewsfe.com/a/746ae3a7-ce19-4c9c-a703-bc8dfc6d5f42/taylor-swift1-gty-ml-250127_1737980240663_hpEmbed_17x16.jpg',
            credit: 'Getty Images',
            // Focal point set 2026-07-18 (run 7) by viewing: near-square two-shot,
            // Travis's face upper-left, Taylor's face right of center in the LV
            // beanie; midpoint keeps both under a wide crop.
            focalPoint: '52% 40%',
          },
        ],
      },
    },
    {
      year: 2025,
      month: 6,
      day: 28,
      category: 'sighting',
      threadIds: ['the-proposal'],
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
            // Photo pass #762 (2026-07-19): viewed — full-body walking shot, face high in the
            // portrait frame.
            focalPoint: '53% 12%',
          },
          // Photo pass #762 (2026-07-19): second frame of the same June 28, 2025 outing from the
          // cited E! News article's own CDN (akns-images.eonline.com, the article's lead image,
          // captioned "Taylor Swift and Travis Kelce in NYC"). curl 200 image/jpeg 1200x1200;
          // Read-viewed: the couple hand in hand — same pink Balmain mini with gold buttons, same
          // construction-fence backdrop — single frame, no watermark. E! exposes no photographer
          // byline on this image, so the credit stays at the outlet level.
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/20250630/a3a86034-2ab6-49c1-bc30-2f5ade7cf52b_1751297982.jpg',
            credit: 'Via E! News',
            caption: 'Hand in hand with Travis on the way into dinner, June 28, 2025.',
            focalPoint: '70% 28%',
          },
        ],
        // Stylist source pass (2026-07-21): the headline pieces of this look, linked
        // to live retailer product pages (curl HTTP 200 + read-verified).
        products: [
          {
            // The exact dress. Nordstrom's PDP for the Balmain "Strappy Houndstooth
            // Tweed A-Line Dress" read-verifies every detail in the context above:
            // houndstooth tweed A-line, straps interlaced with gold metal chains, six
            // gold buttons, raw (frayed) hems, pink. curl 200; page is live but the
            // item read as "no longer available", so inStock:false.
            brand: 'Balmain',
            item: 'Strappy Houndstooth Tweed A-Line Dress',
            retailer: 'nordstrom.com',
            url: 'https://www.nordstrom.com/s/strappy-houndstooth-tweed-a-line-dress/8377396',
            price: '$3,500.00',
            inStock: false,
          },
          {
            // The Louboutin "Miss Jane" sandal she wore was the taupe/"Leche"
            // colorway, sold only via christianlouboutin.com (which hard-blocks all
            // automated requests — unverifiable). Nordstrom carries the same sandal,
            // curl 200 + read-verified in stock, but in Blush/Black rather than taupe —
            // so it's flagged as the closest verified buyable match, not the exact shoe.
            brand: 'Christian Louboutin',
            item: 'Miss Jane Sandal',
            retailer: 'nordstrom.com',
            url: 'https://www.nordstrom.com/s/christian-louboutin-miss-jane-sandal-women/7544624',
            price: '$945.00',
            isAlternative: true,
            altNote: 'Same Miss Jane sandal she wore; the exact taupe ("Leche") colorway sells only on Louboutin\'s own site — this Nordstrom listing is Blush/Black.',
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
          'Philadelphia beat Kansas City 20-17 in the Sept. 14, 2025 Super Bowl rematch — and for once, the cameras never found her: no arrival shots, no suite cutaways, just a source confirming to E! that she was in the building for her first game since the engagement announcement.\n\nThe proof of the day came that night instead. Taylor and Kelce turned up at Patrick Mahomes\' 30th birthday, hosted by Brittany Mahomes at Travis and Patrick\'s new steakhouse 1587 Prime, where Taylor wore a black-and-ivory plaid Simkhai vest and matching skirt with dark red Gucci platform heels; country singer Kane Brown posted the group photo — "Happy birthday Pat & congrats TT" — the next day.',
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
        // Re-checked 2026-07-18 (#762 enrichment): still nothing verifiable —
        // the private 1587 Prime party was documented only via Kane Brown's
        // Instagram (E!/SI/NBC all repost that same IG carousel), which fails
        // the outlet-own-CDN rule. Deliberately left at one photo.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Arrowhead_Stadium_%28October_27%2C_2019_-_2%29.jpg/960px-Arrowhead_Stadium_%28October_27%2C_2019_-_2%29.jpg',
            credit: 'Kj1595 via Wikimedia Commons, CC BY-SA 4.0',
            caption: 'Reference image: Arrowhead Stadium (2019 file photo). No photos of Taylor surfaced from this game — she attended unseen, confirmed by a source to E!.',
            kind: 'reference',
            focalPoint: '50% 45%',
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
          'In Amazon Music\'s track-by-track commentary, Taylor said: "The metaphor in \'Down Bad\' is that I was comparing sort of the idea of being love bombed, where someone rocks your world and dazzles you and then just kind of abandons you," likening it to alien abduction: "This girl is abducted by aliens but she wanted to stay with them, and then when they drop her back off in her hometown, she\'s like, \'Wait, no, where are you going... I liked it there!\'"\n\nThe song debuted at No. 2 on the Hot 100, directly behind "Fortnight," as part of TTPD\'s historic sweep of the chart\'s entire top 14.',
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
            focalPoint: '29% 50%',
          },
          // Photo pass #762 run 10 (2026-07-18): official lyric-video still, video id
          // oEmbed-verified against @TaylorSwift this run; 1280x720 maxres render.
          {
            url: 'https://i.ytimg.com/vi/EVbtjaWXQVg/maxresdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the official "Down Bad" lyric video on Taylor Swift\'s YouTube channel.',
            kind: 'archival',
            focalPoint: '49% 50%',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 4,
      day: 19,
      category: 'music',
      // Cross-link (candidate #1105, 2026-07-25): the most recent track five,
      // which defines itself against this grief tradition.
      relatedIds: [
        'moment:vault-tloas-eldest-daughter-the-first-track-five-that-ends-somewhere-saf',
        'moment:vault-ttpd-a-breakup-album-disguised-as-a-double-lp',
      ],
      title: "So Long, London keeps her 'track five' tradition alive",
      snippet:
        'Track five — and the album\'s goodbye to the six-year Joe Alwyn relationship, written as the antithesis of Lover\'s giddy "London Boy." It upholds the vulnerable-track-five tradition even as it closes the love that "London Boy" opened.',
      sourceUrl: 'https://www.billboard.com/lists/taylor-swift-track-fives-ranked/',
      thumbnailUrl: null,
      moment: {
        context:
          '"So Long, London" is the sound of a six-year love ending. Taylor and Joe Alwyn, together since late 2016, split in the spring of 2023 after more than six and a half years — and this is the song that grieves it: a deliberate mirror of "London Boy," the 2019 Lover track that once celebrated falling for an Englishman in his own city. Critics read the two as opposites — where "London Boy" was giddy, this is the long exhale of leaving.\n\nIt also keeps a tradition alive. On a 2019 Instagram Live, Taylor explained the pattern fans had spotted across her albums: "instinctively I was just kind of putting a very vulnerable, personal, honest, emotional song as track five... the songs that were really honest and emotional and vulnerable and personal." "So Long, London," written and produced with Aaron Dessner at Long Pond, is TTPD\'s track five and holds that line — it peaked at No. 5 on the Hot 100 and No. 4 on the Billboard Global 200.',
        sources: [
          { outlet: 'Billboard', url: 'https://www.billboard.com/lists/taylor-swift-track-fives-ranked/' },
          { outlet: 'E! News', url: 'https://www.eonline.com/news/1399781/untangling-taylor-swifts-heartbreaking-goodbye-to-joe-alwyn-in-so-long-london' },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/So_Long,_London' },
        ],
        // T16 photo pass (2026-07-09): official lyric-video still — video ID
        // verified via YouTube oEmbed (author @TaylorSwift) this session.
        // Photo pass #762 run 10 (2026-07-18): upgraded 480x360 hqdefault -> 1280x720
        // maxres (same video). Deliberately one photo: studio track never performed
        // solo live; no distinct on-topic image exists on an approved CDN.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/CCUr2pNJft4/maxresdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the official "So Long, London" lyric video on Taylor Swift\'s YouTube channel.',
            kind: 'archival',
            focalPoint: '48% 49%',
          },
        ],
      },
    },
    {
      year: 2024,
      month: 4,
      day: 19,
      category: 'music',
      relatedIds: [
        'moment:vault-ttpd-a-breakup-album-disguised-as-a-double-lp',
        'moment:vault-ttpd-so-long-london-keeps-her-track-five-tradition-alive',
      ],
      title: "loml flips its own acronym: 'love of my life' becomes 'the loss of my life'",
      snippet:
        'A piano ballad written and produced with Aaron Dessner that spends four minutes setting up "love of my life" before the final lines invert it: "You\'re the loss of my life." "What we thought was for all time, was momentary."',
      sourceUrl: 'https://en.wikipedia.org/wiki/Loml',
      thumbnailUrl: null,
      moment: {
        context:
          'Recorded at Long Pond Studios with vocals captured at Electric Lady (New York) and Prime Recording (Nashville), and mixed by Serban Ghenea, "loml" builds as a conventional "love of my life" ballad until its closing lines reveal the title\'s other reading — one of the album\'s starkest elegies for the six-year Joe Alwyn relationship it mourns.\n\nCritics singled out the reversal: The A.V. Club and Uproxx both praised the lyrical twist on the phrase, calling the final line a "perfectly simple epitaph."',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Loml' },
          { outlet: 'Yahoo Entertainment', url: 'https://www.yahoo.com/entertainment/every-song-taylor-swift-wrote-025849543.html' },
        ],
        // T16 photo pass (2026-07-09): official lyric-video still — video ID
        // verified via YouTube oEmbed (author @TaylorSwift) this session.
        // Photo pass #762 run 10 (2026-07-18): upgraded 480x360 hqdefault -> 1280x720
        // maxres (same video). Deliberately one photo: studio piano ballad; its one
        // live moment (the Paris debut) is covered by the Paris tour page.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/GZ4vaTRn0HU/maxresdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the official "loml" lyric video on Taylor Swift\'s YouTube channel.',
            kind: 'archival',
            focalPoint: '50% 50%',
          },
        ],
      },
    },
    {
      // Authored 2026-07-26 (Content Shift) for experience ticket #1237: TTPD's
      // emotional spine — the Joe Alwyn breakup the album grieves — was a chart
      // stat, never a story. Ticket suggested a standalone ~Apr 2023 split item,
      // but that date falls in the Midnights era window (ends 2024-04-18), so it
      // is told here, correctly dated to the album drop, as the record that
      // processes it. Redlines: relationship at the level the principals made
      // public (Alwyn's own Sunday Times words); no location beyond song titles,
      // no third-party private life. Matty Healy deliberately not authored — a
      // private individual, and the ticket makes him an optional, not-required
      // beat; the Alwyn arc is the gap.
      slug: 'ttpd-the-breakup-album',
      significance: 'notable',
      relatedIds: [
        'moment:vault-ttpd-so-long-london-keeps-her-track-five-tradition-alive',
        'moment:vault-ttpd-loml-flips-its-own-acronym-love-of-my-life-becomes-the-loss-',
      ],
      year: 2024,
      month: 4,
      day: 19,
      category: 'relationship',
      title: 'A breakup album disguised as a double LP',
      snippet:
        'Six and a half years, almost entirely private — and when it ended in spring 2023, it became her most confessional album. TTPD is the record that turns the Joe Alwyn breakup into literature, from "So Long, London" to "loml."',
      sourceUrl: 'https://www.nbcnews.com/pop-culture/celebrity/joe-alwyn-taylor-swift-interview-rcna157354',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/6/6e/Taylor_Swift_%E2%80%93_The_Tortured_Poets_Department_%28album_cover%29.png',
      moment: {
        context:
          'For six and a half years — from late 2016 to the spring of 2023 — Taylor and British actor Joe Alwyn kept one of pop\'s most private relationships, a romance she guarded so closely it surfaced mostly in a handful of paparazzi sightings and the love songs fans read as his ("Call It What You Want," "London Boy," "Lover"). The breakup was widely reported in April 2023; Alwyn stayed silent on it for more than a year, then told The Sunday Times only that he hoped people could "empathize and understand the difficulties that come with the end of a long, loving, fully committed relationship of over six and a half years."\n\nThe Tortured Poets Department, arriving April 19, 2024, is the record that turned that grief into literature. Its quietest, most wounded songs read as a direct elegy for the relationship — "So Long, London" as the goodbye to Alwyn\'s home city, "loml" folding "love of my life" into "the loss of my life," and "How Did It End?" naming the question outright. Where the era\'s public timeline is a wall of chart records and stadium nights, this is the private arc underneath it: an album that is, at its core, a breakup record disguised as a 31-song double LP.',
        sources: [
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/pop-culture/celebrity/joe-alwyn-taylor-swift-interview-rcna157354',
            source_title: 'Joe Alwyn opens up for the first time about breakup with Taylor Swift',
            publisher: 'NBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-26',
            reliability_score: 4,
            notes: "Alwyn's own Sunday Times words ('long, loving, fully committed... over six and a half years'); April 2023 split; late-2016 start.",
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2024/music/news/joe-alwyn-taylor-swift-breakup-1236039195/',
            source_title: 'Joe Alwyn Opens Up About Taylor Swift Breakup',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-26',
            reliability_score: 4,
          },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1399781/untangling-taylor-swifts-heartbreaking-goodbye-to-joe-alwyn-in-so-long-london',
            source_title: "Untangling Taylor Swift's Goodbye to Joe Alwyn in 'So Long, London'",
            publisher: 'E! News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-26',
            reliability_score: 4,
            notes: "'So Long, London' as the album's goodbye to the six-year Alwyn relationship; antithesis of 2019's 'London Boy'.",
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/6/6e/Taylor_Swift_%E2%80%93_The_Tortured_Poets_Department_%28album_cover%29.png',
            credit: 'Republic Records (album cover, via Wikipedia)',
            caption: 'The Tortured Poets Department (2024) — the record that turned the end of the Joe Alwyn years into an album.',
            kind: 'primary',
            focalPoint: '50% 40%',
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
        // Photo pass #762 run 10 (2026-07-18): upgraded 480x360 hqdefault -> 1280x720
        // maxres (same video). Deliberately one photo: studio track never staged on
        // the tour; no distinct on-topic image exists on an approved CDN.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/OKWfv-x2rdU/maxresdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the official "I Can Fix Him (No Really I Can)" lyric video on Taylor Swift\'s YouTube channel.',
            kind: 'archival',
            focalPoint: '50% 38%',
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
          'Written and produced with Aaron Dessner and recorded partly in Biarritz, France, the song switches from a 7/4 verse-and-chorus meter to 4/4 for a bridge that swaps its piano ballad restraint for distorted vocals and a rock climax.\n\nThe Nation\'s Stephanie Burt called it "the harshest, most dismissive, most condemnatory song that Swift has ever written" — and it belongs on anyone\'s list of her best breakup songs, Rolling Stone\'s Rob Sheffield included. On the Hot 100 dated May 4, 2024, it landed at No. 14 — the closing slot the week TTPD\'s 31 tracks filled the entire top 14, a first for any artist, with "Cruel Summer" charting too for 32 songs on the Hot 100 at once.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Smallest_Man_Who_Ever_Lived' },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/mollybohannon/2024/04/29/taylor-swift-becomes-first-artist-to-take-top-14-spots-on-billboard-hot-100-chart/',
          },
        ],
        // T16 photo pass (2026-07-09): official lyric-video still — video ID
        // verified via YouTube oEmbed (author @TaylorSwift) this session.
        // Photo pass (2026-07-18, #762): + Commons CC BY-SA 4.0 photo of the
        // song's Eras Tour staging (Swift with dancer Jan Ravnik on the
        // hydraulic platforms, per the file's own description; Gelsenkirchen,
        // July 17, 2024). License API-verified; distinct file from the Paris
        // TTPD-set photos used on the Fortnight / Female Rage / Down Bad pages.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/Atdzfj8LcuY/maxresdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the official "The Smallest Man Who Ever Lived" lyric video on Taylor Swift\'s YouTube channel.',
            kind: 'archival',
            focalPoint: '50% 45%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/The_Eras_Tour_The_Tortured_Poets_Department_Performance.png/960px-The_Eras_Tour_The_Tortured_Poets_Department_Performance.png',
            credit: 'Sally-Marie Böhm, CC BY-SA 4.0, via Wikimedia Commons',
            caption: 'The song\'s Tortured Poets set staging on the Eras Tour — Taylor and dancer Jan Ravnik on the hydraulic platforms (Gelsenkirchen, July 2024).',
            kind: 'archival',
            focalPoint: '60% 62%',
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
          'Reacting from the Toronto stop of the Eras Tour after the Nov. 8, 2024 nominations announcement, Taylor told the crowd: "Everything that happens is a direct reflection of the passion you show, and you guys got this album nominated for six Grammys. So thank you."\n\nThe Song of the Year nod for "Fortnight" gave her eight career nominations in that category, the most of any artist. None of the six converted into a win at the Feb. 2, 2025 ceremony, where Beyoncé\'s Cowboy Carter took Album of the Year.',
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
        // Photo pass (2026-07-18, #762): the prior 480×360 hqdefault still
        // duplicated (at lower res) the same MV frame already used full-size
        // on the "Fortnight opens the album" page — replaced with the Getty
        // Toronto show photo from the cited Billboard nominations-reaction
        // story (distinct file from the Toronto photo on the AOTY-nomination
        // page). Downloaded + vision-confirmed. Deliberately one photo: the
        // only other candidate found (Capital FM's hero) is a stitched
        // archive collage from earlier ceremonies, rejected as off-event.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/11/Taylor-Swift-_-The-Eras-Tour-Toronto-ON-345-billboard-1548.jpg?w=1024',
            credit: 'Getty Images (via Billboard)',
            caption: 'In Toronto the night the 2025 Grammy nominations landed: "you guys got this album nominated for six Grammys."',
            kind: 'archival',
            focalPoint: '53% 26%',
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
      // Cross-links added 2026-07-24 (ledger #1322): the two halves of the same
      // May 4, 2024 chart frame — album record + singles record — plus the album
      // itself. Ids verified against content-vault.generated.
      relatedIds: [
        'moment:vault-ttpd-all-14-ttpd-monopolizes-the-top-of-the-hot-100',
        'moment:vault-ttpd-the-tortured-poets-department',
      ],
      snippet:
        'The biggest album week in nine years: 2.61M units, 1.914M of them real sales, plus the largest streaming week ever logged for an album at 891 million on-demand plays.',
      sourceUrl: 'https://www.billboard.com/lists/taylor-swift-tortured-poets-department-debut-number-one-billboard-200-chart/',
      thumbnailUrl: null,
      moment: {
        context:
          'On the chart dated May 4, 2024, TTPD opened to 2.61 million units — the biggest week for any album in nine years, trailing only Adele\'s 25 (3.482M in 2015) — and gave Taylor her 14th Billboard 200 No. 1, tying Jay-Z (and Drake) for the most chart-toppers by a soloist; only the Beatles, at 19, stood ahead. She broke the tie the next year, when The Life of a Showgirl opened at 4.002 million on the chart dated Oct. 18, 2025 for a 15th No. 1.\n\nThe week was built on physical variety. 1.914 million of the units were pure sales — the third-largest sales week of the SoundScan era (since 1991), behind only 25 and *NSYNC\'s No Strings Attached, and the biggest since 25 in 2015. Of those, 859,000 were vinyl, the largest modern-era vinyl week, breaking Taylor\'s own record of 693,000 set by 1989 (Taylor\'s Version) in 2023. Four numbered collector\'s-edition vinyl variants and matching deluxe CDs each carried a different bonus track — "The Manuscript," "The Bolter," "The Albatross" and "The Black Dog" — the same variant strategy that would later power Showgirl.\n\nStreaming set its own records. The 31-track Anthology, surprise-dropped at 2 a.m. ET on release night and counted inside the same tracking week, drew 891.37 million U.S. on-demand streams — a single-week album record that broke Drake\'s Scorpion (745.92M, 2018), not any Taylor title; her Midnights had set the global mark, which TTPD also took, lifting it from 1.16 to 1.76 billion worldwide. Spotify logged its first-ever 300-million-stream day and first billion-stream week for an album; Amazon Music and Apple Music reported their own most-streamed-album records. Abroad, TTPD posted the UK\'s biggest opening week in seven years, a 12th UK No. 1.',
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
          {
            outlet: 'Variety',
            url: 'https://variety.com/2024/music/news/vinyl-tortured-poets-department-breaks-record-weekly-sales-1235978774/',
            source_title: "Taylor Swift's 'Tortured Poets' Breaks Record for Biggest Vinyl Sales Week",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: '859,000 vinyl, beating her own 1989 (TV) record of 693,000',
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2024/04/26/taylor-swift-breaks-drakes-all-time-streaming-record-in-america/',
            source_title: "Taylor Swift Breaks Drake's All-Time Streaming Record In America",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: '891.37M US single-week album streams broke Drake\'s Scorpion (745.92M, 2018)',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-tortured-poets-department-breaks-global-streaming-record-1235671798/',
            source_title: "Taylor Swift's 'Tortured Poets Department' Breaks Global Streaming Record",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-24',
            reliability_score: 5,
            notes: '1.76B global streams, breaking her own Midnights record of 1.16B',
          },
          {
            outlet: 'Spotify Newsroom',
            url: 'https://newsroom.spotify.com/2024-04-24/tortured-poets-department-taylor-swift-one-billion-record-streams/',
            source_title: 'THE TORTURED POETS DEPARTMENT Becomes the First Album to Surpass One Billion Streams in a Single Week on Spotify',
            publisher: 'Spotify',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 5,
          },
          {
            outlet: 'Official Charts',
            url: 'https://www.officialcharts.com/chart-news/taylor-swift-tortured-poets-department-fortnight-uk-number-1-chart-double/',
            source_title: "Taylor Swift's Tortured Poets Department scores biggest UK opening week in seven years",
            publisher: 'Official Charts Company',
            source_type: 'chart_database',
            accessed_at: '2026-07-24',
            reliability_score: 5,
            notes: 'Biggest UK opening week in seven years; 12th UK No. 1',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-life-of-a-showgirl-number-one-billboard-200/',
            source_title: "Taylor Swift's 'The Life of a Showgirl' Debuts at No. 1 With 4.002 Million Units",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-24',
            reliability_score: 5,
            notes: '15th No. 1 (Oct. 18, 2025), breaking the Jay-Z tie outright',
          },
        ],
        // T16 photo pass (2026-07-09): the chart-topping album's cover from
        // Wikipedia's stable upload.wikimedia.org copy. Verified HTTP 200.
        // Photo pass (2026-07-18, #762): + Beth Garrabrant album-shoot
        // portrait ("The Black Dog") from Billboard's own chart story for
        // this debut (its hero image). Downloaded + vision-confirmed.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/6/6e/Taylor_Swift_%E2%80%93_The_Tortured_Poets_Department_%28album_cover%29.png',
            credit: 'Republic Records',
            caption: 'The Tortured Poets Department cover, shot by Beth Garrabrant — the album behind the biggest sales week in nine years.',
            kind: 'primary',
            focalPoint: '50% 55%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/04/Taylor-Swift-cr-Beth-Garrabrant-2024-The-Black-Dog-billboard-1548.jpg?w=1024',
            credit: 'Beth Garrabrant (via Billboard)',
            caption: 'From the TTPD album shoot — the era imagery that fronted Billboard\'s coverage of the 2.61 million-unit debut.',
            kind: 'archival',
            focalPoint: '45% 22%',
          },
        ],
      },
    },
    {
      slug: 'fortnight-top-14-sweep',
      significance: 'notable', // an even bigger chart sweep than the Midnights top-10 record, on an even larger tracklist (docs/decisions.md, 2026-07-19)
      // Cross-links: the Midnights top-10 sweep it surpassed, plus the album
      // half of the same May 4, 2024 chart week (added 2026-07-24, ledger #1305).
      relatedIds: [
        'moment:vault-midnights-every-spot-in-the-hot-100-top-10-all-at-once',
        'moment:vault-ttpd-2-61-million-in-week-one-her-14th-no-1-tying-jay-z',
        'moment:vault-ttpd-the-tortured-poets-department',
      ],
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
          'The May 4, 2024 chart put 32 of Taylor\'s songs on the Hot 100 at once — a record for a woman, breaking her own 26 (Red (Taylor\'s Version), 2021); only Morgan Wallen, with 36, has ever charted more simultaneously. At the very top she did something no act had: held all fourteen of the highest positions. Ranked by streaming rather than the album\'s running order, the block ran "Fortnight" (No. 1), "Down Bad," "I Can Do It With a Broken Heart," "The Tortured Poets Department," "So Long, London," "My Boy Only Breaks His Favorite Toys," "But Daddy I Love Him," "Florida!!!," "Who\'s Afraid of Little Old Me?," "Guilty as Sin?," "Fresh Out the Slammer," "loml," "The Alchemy" and "The Smallest Man Who Ever Lived."\n\nThe feat was the flip side of the release strategy: a surprise 31-track double album with multiple vinyl and digital variants and no advance singles, so the entire tracklist\'s streams landed in one week. It stretched a ceiling she had already raised — the Beatles held the top five in April 1964, and no one passed it until Taylor swept the full top 10 with Midnights in 2022; TTPD pushed the block four slots deeper.\n\n"Fortnight," at 76.2 million first-week streams, was her 12th Hot 100 No. 1 — and, for guest Post Malone, a fifth career chart-topper but his first as a featured act. It held No. 1 for two weeks before the block collapsed: by the next chart only three TTPD songs were left in the top 10, and on May 18 Kendrick Lamar\'s "Not Like Us" took over. The full fourteen-deep lock was a Hot 100 record; on the global chart she came close but not level, holding the top nine of the Billboard Global 200 that same week.',
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
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/',
            source_title: "Taylor Swift Charts 32 Songs on the Hot 100 in a Single Week",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-24',
            reliability_score: 5,
            notes: '32 simultaneous entries — record for a woman, breaking her own 26; Wallen holds the all-act mark at 36',
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2022/music/news/taylor-swift-10-top-spots-hot-100-one-week-1235418542/',
            source_title: 'Taylor Swift Becomes First Artist to Claim Entire Top 10 of the Hot 100',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Midnights top-10 sweep (2022) surpassed the Beatles\' April 1964 top-5 ceiling',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-post-malone-fortnight-number-one-hot-100-second-week/',
            source_title: "Taylor Swift's 'Fortnight' Spends a Second Week at No. 1 on the Hot 100",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-24',
            reliability_score: 5,
            notes: 'Two weeks at No. 1; top-14 block collapses the following week',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-post-malone-fortnight-number-one-debut-global-charts-1235669042/',
            source_title: "Taylor Swift's 'Fortnight' Debuts at No. 1 on Billboard Global 200",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-24',
            reliability_score: 5,
            notes: 'Held the top nine of the Global 200 — near-monopoly, not a full top-14',
          },
        ],
        // T16 photo pass (2026-07-09): the No. 1 single's cover art from
        // Wikipedia's stable upload.wikimedia.org copy. Verified HTTP 200.
        // Photo pass (2026-07-18, #762): + the Swift/Post Malone MV frame
        // Billboard ran with its own top-14 chart story — a different frame
        // from the ytimg maxres still on the "Fortnight opens the album"
        // page. Downloaded + vision-confirmed.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/9/91/Taylor_Swift_-_Fortnight.png',
            credit: 'Republic Records',
            caption: 'Single artwork for "Fortnight," which led the historic top-14 sweep from No. 1.',
            kind: 'primary',
            focalPoint: '50% 55%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/04/taylor-swift-post-malone-fortnight-music-video-still-billboard-1548.jpg?w=1024',
            credit: 'Taylor Swift / Republic Records (via Billboard)',
            caption: 'Taylor and Post Malone in the "Fortnight" video — the No. 1 that led a chart-history first.',
            kind: 'archival',
            focalPoint: '50% 38%',
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
      // relatedIds: main's TTPD rail plus the feud-arc links (the "Mean" live
      // mashup + the reputation feud origin) folded in by shard 6 for ledger
      // #1287; merge-dedup 2026-07-24. All ids verified against the generated vault.
      relatedIds: [
        'moment:vault-ttpd-the-tortured-poets-department',
        'moment:vault-ttpd-all-14-ttpd-monopolizes-the-top-of-the-hot-100',
        'moment:vault-speak-now-mean-written-straight-at-her-critics',
        'moment:vault-reputation-look-what-you-made-me-do-and-the-phone-call-it-started-with',
        'moment:vault-speak-now-mean-the-banjo-single-goes-to-country-radio',
      ],
      snippet:
        'The stray capitals spell KIM, and fans connected the rest — a song about outlasting a schoolyard bully, filed under grudges from 2016. By August, a live version was restyled "thank You aimEe."',
      sourceUrl: 'https://www.today.com/popculture/music/taylor-swift-kim-kardashian-thank-you-aimee-lyrics-rcna148523',
      thumbnailUrl: null,
      moment: {
        context:
          'Taylor has never named the subject — the Kim Kardashian reading is fan and critic interpretation, labeled as such, built on the title\'s capitals (which spell KIM) and the 2016 phone-call feud; the name "Aimee" is even flagged as a pseudonym inside the song.\n\nIt is track 24 of The Tortured Poets Department: The Anthology — a bonus cut on the 31-song edition, not on the standard sixteen — written by Taylor with Aaron Dessner and produced by the two of them with Jack Antonoff. In the album\'s record-setting week it debuted and peaked at No. 23 on the Billboard Hot 100. Critics read it as the album\'s clearest diss track and routinely paired it with "Cassandra," the other Anthology song tied to the same 2016 feud.\n\nShe played it live once: June 22, 2024 at Wembley, on guitar, as a surprise-song mashup with "Mean" (2010) — the throughline being two songs fourteen years apart about outlasting a bully. On Aug. 15, 2024 a Taylor Nation email released a recording of that performance restyled "thank You aimEe," the capitals now spelling YE (Kanye), and fans re-litigated the whole thing overnight. Neither Kim Kardashian nor Kanye West responded publicly to the song or the restyle; Kardashian, reported to be "over" the feud, later offered only a generic compliment about Taylor as an artist.',
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
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Thank_You_Aimee',
            source_title: 'Thank You Aimee',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-24',
            reliability_score: 2,
            notes: 'Track 24 Anthology; Swift/Dessner writers, produced with Antonoff; No. 23 Hot 100; June 22 2024 Wembley "Mean" mashup',
          },
          {
            outlet: 'Consequence',
            url: 'https://consequence.net/2024/04/taylor-swift-kim-kardashian-diss-track-thank-you-aimee/',
            source_title: "Taylor Swift Releases Kim Kardashian Diss Track 'thanK you aIMee'",
            publisher: 'Consequence',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Reads it as a diss track; situates it alongside "Look What You Made Me Do" and the 2016 feud',
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
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-thank-you-aimee-castles-crumbling-hayley-williams-london-eras-tour-1235715917/',
            source_title: "Taylor Swift Debuts 'thanK you aIMee,' Sings 'Castles Crumbling' With Hayley Williams in London",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'June 22, 2024 Wembley live debut, an acoustic mashup with "Mean"',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-diss-kanye-west-thank-you-aimee-live-version-1235081574/',
            source_title: "Taylor Swift Disses Kanye West With 'thank You aimEe' Live Version",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Aug. 15, 2024 YE-restyled live release pulled the same night before midnight',
          },
          {
            outlet: 'BuzzFeed News',
            url: 'https://www.buzzfeednews.com/article/ellendurney/kim-kardashian-instagram-followers-after-taylor-swift-song',
            source_title: 'Kim Kardashian Has Lost More Than 120,000 Followers Since Taylor Swift Released "thanK You aIMee"',
            publisher: 'BuzzFeed News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Release-week Instagram follower drop of 120,000+ as reception',
          },
        ],
        // T16 photo pass (2026-07-09): official lyric-video still — video ID
        // verified via YouTube oEmbed (author @TaylorSwift) this session.
        // Photo pass #762 run 10 (2026-07-18): focal point set. Deliberately one
        // photo: the Wembley "thank You aimEe" live moment exists only in fan video
        // and a Taylor Nation email — no creditable still on an approved CDN.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/oaBJlKXBvjk/maxresdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the official "thanK you aIMee" lyric video, stray capitals intact.',
            kind: 'archival',
            focalPoint: '50% 46%',
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
      relatedIds: [
        'moment:vault-ttpd-the-tour-comes-home-three-nights-in-miami-with-florence-welc',
        'moment:vault-ttpd-the-tortured-poets-department',
        'moment:vault-ttpd-all-14-ttpd-monopolizes-the-top-of-the-hot-100',
      ],
      snippet:
        'Her own logic: people flee to Florida after crimes and breakups alike. Florence + the Machine turn the reinvention fantasy into the album\'s biggest-sounding song.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Florida!!!',
      thumbnailUrl: null,
      moment: {
        context:
          'Taylor said the idea came from watching Dateline: fugitives run to Florida to "reinvent themselves, have a new identity, blend in" — and heartbreak, she figured, wants the same exit.\n\nWelch co-wrote the track and trades verses on it; Taylor produced it with Jack Antonoff. Track 8 of the standard sixteen — not an Anthology bonus cut — its power-ballad build is one of the album\'s biggest-sounding songs, and it debuted and peaked at No. 8 on the Billboard Hot 100 dated May 4, 2024: Florence + the Machine\'s first top-10 hit and highest-ever chart entry, past their earlier No. 21 with "Dog Days Are Over," landing inside the week TTPD swept the entire top 14.\n\nSwift and Welch sang it live together for the first time in London on Aug. 20, 2024 — the eighth and final Wembley night, closing the European leg — then reunited for it across the three Miami shows, Oct. 18–20, 2024.',
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
          {
            outlet: 'Stereogum',
            url: 'https://stereogum.com/2261492/florence-the-machine-reach-new-chart-peak-as-taylor-swift-occupies-top-14-spots-on-billboard-hot-100/news',
            source_title: 'Florence + The Machine Reach New Chart Peak As Taylor Swift Occupies Top 14 Spots On Billboard Hot 100',
            publisher: 'Stereogum',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: "No. 8 debut = Florence + the Machine's first top 10, past their No. 21 'Dog Days Are Over'",
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-hot-100-top-14-fortnight-post-malone-record/',
            source_title: "Taylor Swift Sets Record With All Top 14 of Hot 100, 'Fortnight' No. 1",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'May 4, 2024 chart; "Florida!!!" at No. 8 within the top-14 sweep',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-florence-florida-duet-miami-show-1235137985/',
            source_title: "Taylor Swift Brings Back Florence Welch to Sing 'Florida!!!' in Miami",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Live: London Aug 20 2024 debut, Miami Oct 18-20 2024 reprise',
          },
        ],
        // T16 photo pass (2026-07-09): official lyric-video still — video ID
        // verified via YouTube oEmbed (author @TaylorSwift) this session.
        // Photo pass (2026-07-18, #762): render upgraded from 480×360
        // hqdefault to the same video's 1280×720 maxresdefault (HTTP-checked
        // + viewed). + the Swift/Welch polaroid that fronted Holler's Miami
        // "Florida!!!" duet story — Holler's own metadata credits the photo
        // to Taylor Swift. Downloaded + vision-confirmed.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/uEssK8o3jKg/maxresdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the official "Florida!!! (feat. Florence + The Machine)" lyric video.',
            kind: 'archival',
            focalPoint: '50% 60%',
          },
          {
            url: 'https://cdn.sanity.io/images/o6uq28nb/production/e92e7a8463fee4535c9c538f067276de0a77c9c3-2048x2011.jpg?w=1200',
            credit: 'Taylor Swift (via Holler)',
            caption: 'Taylor and Florence Welch — the collaborators behind the album\'s biggest-sounding song.',
            kind: 'archival',
            focalPoint: '47% 27%',
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
      // the-proposal thread opt-in (stage 3, 2026-07-19): the song fans read
      // as the relationship's track — a beat of the derived End Game thread.
      threadIds: ['the-proposal'],
      relatedIds: [
        'moment:vault-ttpd-travis-kelce-eras-tour-cast-member-for-a-night',
        'moment:vault-ttpd-eight-nights-at-wembley-more-than-any-solo-artist-ever',
        'moment:vault-tloas-your-english-teacher-and-your-gym-teacher-are-getting-marrie',
      ],
      snippet:
        'The "marry, kiss, or kill me" line traces to a viral 2016 Travis interview clip, and fans caught the nod to his impressions of his dad — the album\'s one openly giddy chapter.',
      sourceUrl: 'https://www.today.com/popculture/music/so-high-school-taylor-swift-lyrics-meaning-rcna148574',
      thumbnailUrl: null,
      moment: {
        context:
          'Taylor hasn\'t confirmed the subject on the record — but the reading is barely a theory: in the resurfaced clip Kelce picks "kiss" for Taylor in a game of marry-kiss-kill years before they met, and fans and outlets read "I feel like laughing in the middle of practice" as a nod to his impressions of his dad, Ed Kelce (Today itself hedges the mapping with "if the reference is indeed pointed at Kelce").\n\nWhen the song joined the Eras Tour setlist, the staging added on-stage bleachers and football-field visuals, and fans took the hint as confirmation enough. Credited to Taylor and Aaron Dessner, it sits on the Anthology\'s Dessner-led second half rather than among Jack Antonoff\'s tracks; reviewers heard the album\'s guitar-forward pop-rock outlier — an obvious back-half highlight (Billboard\'s words for its electric-guitar arrival), with critics reaching for Sheryl Crow, Third Eye Blind and Avril Lavigne comparisons. It debuted and peaked at No. 24 on the Hot 100 in May 2024 — just below the record top 14 the standard tracks monopolized, part of Taylor\'s 19-of-the-top-25 showing that week.\n\nIt became a permanent part of the revamped "Female Rage" TTPD set from May 2024 and surfaced once as a surprise-song mashup with "Mary\'s Song" and "Everything Has Changed" in Amsterdam on July 6, 2024. Taylor underscored the relationship reading herself in August 2025, soundtracking her engagement announcement with the song — captioned "Your English teacher and your gym teacher are getting married" — which drove a 394% single-day streaming spike.',
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
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-the-tortured-poets-department-tracks-ranked/',
            source_title: "Taylor Swift's 'The Tortured Poets Department': All 31 Tracks Ranked",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: '"An obvious back-half highlight"; guitar-forward pop-rock outlier',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-engagement-so-high-school-streaming-gains/',
            source_title: "Taylor Swift's 'So High School' Sports 394% Streaming Gain After Engagement Reveal",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'No. 24 Hot 100 peak; the top 14 sweep excluded it (19 of top 25); engagement-announcement soundtrack + 394% single-day spike',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/So_High_School',
            source_title: 'So High School — Wikipedia',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-24',
            reliability_score: 2,
            notes: 'Swift/Dessner writing-production credit; live history (permanent set from May 2024; Amsterdam July 6 mashup)',
          },
        ],
        // T16 photo pass (2026-07-09): official lyric-video still — video ID
        // verified via YouTube oEmbed (author @TaylorSwift) this session.
        // Photo pass (2026-07-18, #762): render upgraded from 480×360
        // hqdefault to the same video's 1280×720 maxresdefault (HTTP-checked
        // + viewed). + a Commons CC BY 2.0 portrait of Travis Kelce, the
        // song's widely read subject, as a reference image (license
        // API-verified; same pattern as the Hendersonville reference photo).
        photos: [
          {
            url: 'https://i.ytimg.com/vi/w-FkV0EM_CU/maxresdefault.jpg',
            credit: 'YouTube / Taylor Swift',
            caption: 'Still from the official "So High School" lyric video on Taylor Swift\'s YouTube channel.',
            kind: 'archival',
            focalPoint: '43% 45%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Travis_Kelce_2021.jpg',
            credit: 'Erik Drost, CC BY 2.0, via Wikimedia Commons',
            caption: 'Travis Kelce — the song\'s widely read subject, down to the resurfaced marry-kiss-kill clip.',
            kind: 'reference',
            focalPoint: '50% 38%',
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
      // Cross-link: the Seattle "Swift quake," the tour's other stand the crowd
      // shook into the seismic record (added 2026-07-24, ledger #1308).
      relatedIds: [
        'moment:vault-midnights-the-swift-quake-seattle-shows-register-as-seismic-activity',
      ],
      snippet:
        'Night one beat Harry Styles\' all-time Scottish stadium record at nearly 73,000 — then nights two and three each broke it again. 220,000 fans across the weekend.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-thanks-edinburgh-eras-tour-fans-breaking-crowd-record-1235705719/',
      thumbnailUrl: null,
      moment: {
        context:
          'The June 7–9, 2024 Edinburgh stand opened the UK run by breaking its own record nightly. Night one\'s crowd of almost 73,000 overtook Harry Styles\' 2023 Murrayfield show (about 65,000) to become the highest-attended stadium concert in Scottish history; the venue operator confirmed nights two and three each topped the night before, putting roughly 220,000 fans through the ground across one weekend (exact figures for the later nights went unpublished). Paramore opened all three nights, and each acoustic set carried its own Edinburgh debut — "The Bolter" and "Crazier" on June 8, "It\'s Nice to Have a Friend" on June 9.\n\nThe stand registered beyond the stadium, literally. The British Geological Survey recorded the crowd as seismic activity, the strongest reading coming during "…Ready For It?" — about 23.4 nanometres of ground movement, the dancing crowd transmitting some 80 kilowatts, detected 6 km away at the BGS\'s Lyell Centre. CNBC pegged the Edinburgh windfall at an estimated £77M+ (roughly $98M) for the local economy.\n\nTold from the stage she\'d just played the most-attended stadium show in Scottish history, Taylor answered, "What a way to welcome a lass to Scotland," and thanked the city for crowds that "truly blew me away." Edinburgh met her in kind: the council presented a bespoke Edinburgh-900 tartan guitar strap, hand-made by Kinloch Anderson and inscribed "Fàilte chridheil gu Dùn Èideann" ("a heartfelt welcome to Edinburgh"). Across the tour the weekend ranked among her larger three-night runs, though below the eight-night Wembley stand and Melbourne\'s bigger single-night totals.',
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
            outlet: 'Scottish Rugby',
            url: 'https://scottishrugby.org/swift-smashes-records-at-scottish-gas-murrayfield/',
            source_title: 'Taylor smashes records at Scottish Gas Murrayfield',
            publisher: 'Scottish Rugby (venue operator)',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 5,
            notes: 'Night one ~73,000 overtook Harry Styles\' 65,000; each subsequent night re-broke the record; on-stage line',
          },
          {
            outlet: 'British Geological Survey',
            url: 'https://www.bgs.ac.uk/news/quake-it-off-taylor-swift-concerts-shake-edinburgh/',
            source_title: 'Quake it off: Taylor Swift concerts shake Edinburgh',
            publisher: 'British Geological Survey',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 5,
            notes: 'Strongest seismic reading during "…Ready For It?"; 23.4 nm, ~80 kW, detected 6 km away',
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
          {
            outlet: 'STV News',
            url: 'https://news.stv.tv/entertainment/third-scottish-taylor-swift-eras-tour-show-in-edinburgh-announced-as-support-act-paramore-revealed',
            source_title: 'Third Scottish Taylor Swift Eras tour show in Edinburgh announced as support act Paramore revealed',
            publisher: 'STV News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Paramore opened all three Edinburgh nights',
          },
          {
            outlet: 'City of Edinburgh Council',
            url: 'https://www.edinburgh.gov.uk/news/article/13996/-sparks-fly-as-edinburgh-welcomes-taylor-swift-with-civic-gift',
            source_title: "'Sparks Fly' as Edinburgh welcomes Taylor Swift with civic gift",
            publisher: 'City of Edinburgh Council',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Bespoke Edinburgh-900 tartan guitar strap by Kinloch Anderson',
          },
          {
            outlet: 'setlist.fm',
            url: 'https://www.setlist.fm/setlist/taylor-swift/2024/scottish-gas-murrayfield-stadium-edinburgh-scotland-3baa4018.html',
            source_title: 'Taylor Swift Setlist, Murrayfield, June 8, 2024',
            publisher: 'setlist.fm',
            source_type: 'fan_database',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Surprise-song debuts of "The Bolter" and "Crazier" (June 8); "It\'s Nice to Have a Friend" (June 9)',
          },
        ],
        // T16 photo pass (2026-07-09): Getty tour photo hosted on Billboard's
        // CDN (from its Edinburgh coverage, the first source above). Verified
        // HTTP 200 + image/jpeg; visually confirmed (folklore-set moss piano).
        // Photo pass (2026-07-18, #762): + the Getty Murrayfield crowd shot
        // fronting the cited CNBC Edinburgh story (CNBC's own image CDN).
        // Downloaded + vision-confirmed: packed stands under the stadium's
        // distinctive roof. Note the CDN serves browser user-agents only.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/06/Taylor-Swift-_-The-Eras-Tour-Edinburgh-Scotland-02-2024-billboard-1548.jpg?w=1024',
            credit: 'Getty Images (via Billboard)',
            caption: 'The folklore set at Murrayfield Stadium, Edinburgh, during the record-breaking June 2024 stand.',
            kind: 'archival',
            focalPoint: '52% 25%',
          },
          {
            url: 'https://image.cnbcfm.com/api/v1/image/107428490-1718277585941-gettyimages-2156561216-_gc10806_lnvlarov.jpeg?v=1733316726&w=1480&h=833',
            credit: 'Getty Images (via CNBC)',
            caption: 'Playing to a record Murrayfield crowd — each of the three nights topped the Scottish stadium attendance record the last had just set.',
            kind: 'archival',
            focalPoint: '47% 45%',
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
      // Cross-link pass (Answerer shard 5, 2026-07-21, ledger #1082): page had
      // zero links. The show where the end-date was surfaced now threads to the
      // show where the tour actually ended (Vancouver) and the tour's $2B-gross
      // milestone. IDs verified against the generated vault.
      relatedIds: [
          'moment:vault-midnights-the-i-can-see-you-video-reunites-the-taylors',
        'moment:vault-ttpd-the-eras-tour-takes-its-final-bow-in-vancouver',
        'moment:vault-ttpd-the-first-tour-ever-to-gross-2-billion',
      ],
      title: 'Show 100 at Anfield — and the news the tour will end',
      snippet:
        'She marked the milestone by confirming what fans dreaded: the Eras Tour closes for good in December. "The most exhausting, all-encompassing, but most joyful... thing that has ever happened in my life."',
      sourceUrl: 'https://abcnews.go.com/GMA/Culture/taylor-swift-announces-end-eras-tour-milestone-100th/story?id=111150191',
      thumbnailUrl: null,
      moment: {
        context:
          'June 13, 2024, Anfield — home of Liverpool FC — and night one of a three-night stand (June 13–15, Paramore opening). "You know, this is actually the 100th show of the tour. That blows my mind," she told the crowd, before making the admission fans dreaded: "this is the very first time I\'ve ever acknowledged to myself and admitted that this tour is going to end in December." She gave only "December" from the stage; a spokesperson supplied ABC News the specific finale — Vancouver, Dec. 8, the 149th and last show, 149 dates after Glendale, with no further extensions.\n\nThe milestone night carried two rarities: a "Cornelia Street" / "Maroon" mashup on piano and an "I Can See You" / "Mine" mashup on guitar — the first a nod to Liverpool, where the "I Can See You" video was filmed. The city met her halfway: Culture Liverpool and the social enterprise Make CIC turned the centre into a "Taylor Town" trail of eleven era-themed art installations (June 8–16) — a moss-covered "evermore" piano, a "Red" room, "Lover" hearts, a Fearless "13" mural. Night one drew about 62,000, which Taylor said broke Anfield\'s attendance record — the 61,905 set at a 1952 FA Cup tie — though a concert pitch packs in more standing fans than a match ever did.\n\nNights two and three (June 14–15) added four more mashups — among them a first-person twist on "The Great War" that fans seized on, and the live debuts of "Carolina" and "The Manuscript" — with Paramore opening all three nights and no surprise guest. VoucherCodes valued the stand at about £26.3m for the city (~£523 a fan across ~144,000 attendees), with local hotel and Airbnb prices forecast to surge 115%, the steepest of any UK stop; Music Week called the night "extraordinary… an artist at the peak of her powers."',
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
          {
            outlet: 'setlist.fm',
            url: 'https://www.setlist.fm/setlist/taylor-swift/2024/anfield-liverpool-england-33aa401d.html',
            source_title: 'Taylor Swift Setlist at Anfield, Liverpool — June 13, 2024',
            publisher: 'setlist.fm',
            source_type: 'reference',
            accessed_at: '2026-07-21',
            reliability_score: 3,
            notes: 'Surprise songs: "Cornelia Street"/"Maroon" (piano); "I Can See You"/"Mine" (guitar)',
          },
          {
            outlet: 'Liverpool BID Company',
            url: 'https://liverpoolbidcompany.com/taylor-town-trail/',
            source_title: 'Welcome to Lover-pool: the Taylor Town Trail',
            publisher: 'Liverpool BID Company',
            source_type: 'official',
            accessed_at: '2026-07-21',
            reliability_score: 4,
            notes: 'Taylor Town Trail: 11 era-themed art installations, Culture Liverpool + Make CIC, June 8–16, 2024',
          },
          {
            outlet: 'TicketNews',
            url: 'https://www.ticketnews.com/2024/06/swift-breaks-anfield-record-with-62000-fans-confirms-final-tour-date/',
            source_title: 'Taylor Breaks Anfield Record with 62,000 Fans, Confirms Final Tour Date',
            publisher: 'TicketNews',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
            notes: '~62,000 night one vs Anfield\'s 61,905 record (1952 FA Cup); schedule ends Vancouver Dec. 8',
          },
          {
            outlet: 'Music Week',
            url: 'https://www.musicweek.com/live/read/live-review-taylor-swift-stuns-in-liverpool-with-landmark-100th-show-of-eras-tour/089976',
            source_title: 'Live review: Taylor Swift stuns in Liverpool with landmark 100th show of Eras tour',
            publisher: 'Music Week',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
            notes: 'Onstage 100th-show acknowledgment; three-night Anfield stand',
          },
          {
            outlet: 'Music Week',
            url: 'https://www.musicweek.com/live/read/live-review-taylor-swift-stuns-in-liverpool-with-landmark-100th-show-of-eras-tour/089976',
            source_title: 'Live review: Taylor Swift stuns in Liverpool with landmark 100th show of Eras tour',
            publisher: 'Music Week',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Pull-quotes: "extraordinary… an artist at the peak of her powers"; "locating intimacy within colossal spectacle."',
          },
          {
            outlet: 'setlist.fm',
            url: 'https://www.setlist.fm/setlist/taylor-swift/2024/anfield-liverpool-england-33aa4011.html',
            source_title: 'Taylor Swift Setlist at Anfield, Liverpool — June 14, 2024',
            publisher: 'setlist.fm',
            source_type: 'reference',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Night two surprise songs: "This Is What You Came For"/"gold rush" (guitar); "The Great War"/"You\'re Losing Me" (piano, first-person lyric change).',
          },
          {
            outlet: 'setlist.fm',
            url: 'https://www.setlist.fm/setlist/taylor-swift/2024/anfield-liverpool-england-23aa4017.html',
            source_title: 'Taylor Swift Setlist at Anfield, Liverpool — June 15, 2024',
            publisher: 'setlist.fm',
            source_type: 'reference',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Night three surprise songs: "no body, no crime"/"Carolina" (guitar, live debut); "The Manuscript" with "Red" (piano, live debut).',
          },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/taylor-swift-fans-lose-over-203559077.html',
            source_title: 'Taylor Swift Fans Lose It Over Eras Tour Lyric Change During Emotional Surprise Song',
            publisher: 'Yahoo Entertainment',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'June 14 "The Great War" — Swift sang the reconciliation line in the first person ("if I survived the Great War").',
          },
          {
            outlet: 'Liverpool Film Office',
            url: 'https://liverpoolfilmoffice.tv/home/taylor-swifts-i-can-see-you-taylors-version-music-video-supports-local-liverpool-talent/',
            source_title: "Taylor Swift's \"I Can See You (Taylor's Version)\" Music Video Supports Local Liverpool Talent",
            publisher: 'Liverpool Film Office',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Video shot in Liverpool (April 2023): Cunard Building; vault-heist interior in the former NatWest bank on Castle Street.',
          },
          {
            outlet: 'Liverpool Business News',
            url: 'https://lbndaily.co.uk/taylor-swift-shows-worth-26-3m-to-liverpool/',
            source_title: "Taylor Swift shows 'worth £26.3m to Liverpool'",
            publisher: 'Liverpool Business News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'VoucherCodes: ~£26.3m local impact, £523.12 average spend per fan across ~144,000 attendees; hotel/Airbnb prices forecast +115%.',
          },
          {
            outlet: 'Culture Liverpool',
            url: 'https://www.cultureliverpool.co.uk/news/welcome-to-lover-pool-taylor-town-transformation-revealed/',
            source_title: 'Welcome to Lover-pool! Taylor Town transformation revealed',
            publisher: 'Liverpool City Council (Culture Liverpool)',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Council-led "Taylor Town" trail curated by Culture Liverpool with Make CIC and regional makers; St George\'s Hall "Liverpool Loves Taylor" banner.',
          },
        ],
        // T16 photo pass (2026-07-09): photo from ABC News' coverage of the
        // Liverpool stand (image dated June 15, 2024, on ABC's own CDN).
        // Verified HTTP 200 + image/jpeg; visually confirmed (onstage, Lover-set bodysuit).
        // Photo-enrichment run 11 (2026-07-18, #762): added Billboard's photo
        // from Liverpool night one — June 13, the 100th show itself. Verified
        // HTTP 200 + image/jpeg, downloaded and vision-confirmed (Fearless-set
        // fringe dress, crystal guitar). Focal points set per image by viewing.
        photos: [
          {
            url: 'https://i.abcnewsfe.com/a/93f66532-3cd0-4fd1-8a10-52594110c859/taylor-swift-nc-jt-240615_1718457109716_hpMain_16x9.jpg?w=1600',
            credit: 'ABC News',
            caption: 'Onstage during the June 2024 Anfield stand in Liverpool, where show 100 doubled as the end-date announcement.',
            kind: 'archival',
            // Profile shot, singing into the mic; face sits upper-left of center.
            focalPoint: '45% 25%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/06/taylor-swift-liverpool-night-1-2024-billboard-1548.jpg?w=1024',
            credit: 'Getty Images (via Billboard)',
            caption: 'The Fearless set on June 13, 2024 at Anfield — night one of the Liverpool stand, and the Eras Tour\'s 100th show.',
            kind: 'primary',
            // Face high in frame, just right of center, guitar mid-frame.
            focalPoint: '52% 18%',
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
      // Cross-link pass (Answerer shard 5, 2026-07-21, ledger #1068): page had
      // zero links. Threaded into the relationship arc and paired with the
      // reciprocal TTPD Taylor/Travis crossover — the "So High School" moment
      // (she wrote the song about him; here he steps into her show).
      threadIds: ['the-proposal'],
      relatedIds: [
        'moment:vault-ttpd-so-high-school-annotated-by-the-internet-in-minutes',
        'moment:vault-ttpd-eight-nights-at-wembley-more-than-any-solo-artist-ever',
        'moment:vault-tloas-travis-joins-the-docuseries-for-its-final-episodes',
      ],
      title: 'Travis Kelce, Eras Tour cast member for a night',
      snippet:
        'In white tie and a top hat, he carried her onto the stage during "I Can Do It With a Broken Heart" at Wembley — his idea, he later admitted, with choreography studied from Dumb and Dumber.',
      sourceUrl: 'https://www.rollingstone.com/music/music-news/taylor-swift-travis-kelce-eras-tour-debut-london-show-1235045292/',
      thumbnailUrl: null,
      moment: {
        context:
          'June 23, 2024, the third London night at Wembley — and originally a very different bit. On New Heights, Kelce said he first floated rolling out on a bike during the "1989" set ("How funny would it be if I just rolled out on one of the bikes"); Taylor redirected him somewhere safer — the "I Can Do It With a Broken Heart" vaudeville intro, where top-hatted dancers revive her "fainted" showgirl.\n\nIn white tie, tails and a top hat — a costume built by Eras designer Jessica Jones and styled by Joseph Cassell — the 6-foot-5 Kelce carried Taylor to the couch, dusted her face with a makeup brush once she was "revived," and slipped in a comedic step he later said he lifted from Jim Carrey in "Dumb and Dumber." He had a single night of rehearsal and one rule for himself: "Do not drop Taylor." The crowd took a beat to clock who the extra dancer was; Taylor called the experience "jarring" in the best way, posted that she was "cracking up and swooning," and in the End of an Era docuseries said it was "the loudest it ever got on the Eras Tour."\n\nHe teased that it "might not be the last time," but it stayed a one-off — his only onstage turn before the tour closed in Vancouver that December. The tuxedo got a second life, though: he wore it again to Taylor\'s Eras Tour wrap party.\n\nThe bit came from the tour\'s own vocabulary: lead choreographer Mandy Moore built the "I Can Do It" intro, and Kelce filled the slot dancers Kam Saunders and Jan Ravnik usually work. It was a new kind of guest — the tour\'s other walk-ons sang; none had played a costumed skit — and it was widely treated as a first. No hard view figures were published, but the cameo won Favorite Surprise Guest at the 2025 iHeartRadio Music Awards, and Patrick Mahomes needled Kelce by wearing a matching top hat to Taylor\'s December 2024 birthday.',
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
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/pop-culture/pop-culture-news/taylor-swift-brings-travis-kelce-stage-london-first-time-eras-tour-sho-rcna158507',
            source_title: 'Taylor Swift brings Travis Kelce onstage in London for the first time',
            publisher: 'NBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
            notes: 'Onstage business (carried her, makeup-brush dab, dance); first onstage appearance; her "cracking up/swooning" Instagram note',
          },
          {
            outlet: 'WWD',
            url: 'https://wwd.com/pop-culture/celebrity-news/travis-kelce-taylor-swift-the-eras-tour-costume-1236464231/',
            source_title: "Travis Kelce Joins Taylor Swift Onstage in Tuxedo at 'The Eras' Tour",
            publisher: 'WWD',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
            notes: 'Tuxedo created by Eras costume designer Jessica Jones; styling by Joseph Cassell',
          },
          {
            outlet: 'Uproxx',
            url: 'https://uproxx.com/pop/travis-kelce-the-eras-tour-debut-jim-carrey-easter-egg-video/',
            source_title: "Travis Kelce Snuck A Jim Carrey Easter Egg Into His 'Eras Tour' Debut",
            publisher: 'Uproxx',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
            notes: 'New Heights: the tap step lifted from Jim Carrey in Dumb and Dumber',
          },
          {
            outlet: 'TheWrap',
            url: 'https://www.thewrap.com/creative-content/music/taylor-swift-end-of-an-era-sabrina-carpenter-travis-kelce-eras-tour/',
            source_title: "Taylor Swift's 'End of an Era' Docuseries",
            publisher: 'TheWrap',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
            notes: 'Swift: the Wembley cameo was "the loudest it ever got on the Eras Tour"',
          },
          {
            outlet: 'People (via Yahoo)',
            url: 'https://www.yahoo.com/entertainment/travis-kelce-wore-london-eras-125932535.html',
            source_title: "Travis Kelce Wore His London Eras Tour Tuxedo to Taylor Swift's Wrap Party",
            publisher: 'People',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
            notes: 'Re-wore the same cameo tuxedo to the Eras Tour wrap party, Dec 2024',
          },
          {
            outlet: 'Parade',
            url: 'https://parade.com/entertainment/taylor-swift-eras-tour-choreographer-mandy-moore-disney-plus',
            source_title: "Meet Mandy Moore, the Choreographer Behind Taylor Swift's Eras Tour",
            publisher: 'Parade',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Mandy Moore was the Eras Tour\'s lead choreographer; the "I Can Do It" revival skit is normally worked by dancers Kam Saunders and Jan Ravnik (per NBC News). No named person is credited with coaching Kelce\'s specific blocking.',
          },
          {
            outlet: 'setlist.fm',
            url: 'https://www.setlist.fm/setlist/taylor-swift/2024/wembley-stadium-london-england-23aa4007.html',
            source_title: 'Taylor Swift Setlist at Wembley Stadium, London — June 23, 2024',
            publisher: 'setlist.fm',
            source_type: 'reference',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'The night\'s surprise songs: Gracie Abrams\'s "us." got its live debut with Abrams on guitar; the piano set was an "Out of the Woods" / "Is It Over Now?" / "Clean" mashup.',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/travis-kelce-reacts-taylor-swift-eras-cameo-award-nomination-1235886550/',
            source_title: "Travis Kelce Reacts to His Eras Tour Cameo Earning an iHeartRadio Music Awards Nod",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'The cameo won Favorite Surprise Guest at the March 17, 2025 iHeartRadio Music Awards. No aggregate view/engagement total was published; no official NFL/Chiefs reaction is documented.',
          },
          {
            outlet: 'The Mirror US',
            url: 'https://www.themirror.com/sport/american-football/mahomes-trolls-chiefs-teammates-swift-867641',
            source_title: 'Patrick Mahomes trolls Travis Kelce over Eras Tour cameo at Taylor Swift birthday party',
            publisher: 'The Mirror US',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Mahomes wore a matching top hat and tails to Swift\'s December 2024 birthday party to needle Kelce over the cameo.',
          },
        ],
        // Photo passes verified HTTP 200 + image/jpeg and vision-confirmed
        // against this exact night. The lead shot (2026-07-17) IS the cameo —
        // Kelce in white tie among the TTPD vaudeville cast — hosted on ABC's
        // own CDN (i.abcnewsfe.com), not a watermarked wire comp.
        photos: [
          {
            url: 'https://i.abcnewsfe.com/a/eb18fccb-d278-4181-b394-da9653623dc3/GettyImages-2158904096_1719178517424_hpMain.jpg',
            credit: 'Getty Images / Gareth Cattermole (via ABC News)',
            caption:
              'Kelce in white tie, top hat and tails during the "I Can Do It With a Broken Heart" vaudeville intro, flanking Taylor and the tuxedoed dancers — Wembley, June 23, 2024.',
            kind: 'primary',
            // Focal points set 2026-07-18 (photo-enrichment run 2, #762) by
            // viewing each frame. Swift and Kelce's faces span the upper third,
            // centered as a group across the stage.
            focalPoint: '52% 30%',
          },
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2024/06/TaylorSwiftNightThreeLondon-1.jpg?w=1600',
            credit: 'Getty Images (via Rolling Stone)',
            caption: 'Taylor onstage at Wembley on June 23, 2024 — the night Kelce joined the TTPD set\'s tuxedoed cast.',
            kind: 'archival',
            // Swift with guitar stands left of center; her face is high in frame.
            focalPoint: '42% 18%',
          },
        ],
      },
    },
    // --- G-A depth pass: July 2024 European-leg gap (2026-07-15)
    {
      slug: 'gelsenkirchen-swiftkirchen',
      year: 2024,
      month: 7,
      day: 17,
      category: 'tour',
      // Cross-link pass (Answerer shard 5, 2026-07-21, ledger #1093): the two
      // defining fan-scale spectacles of the July 2024 German leg — a city
      // renaming itself, and the tour's largest ticketless crowd ten days later
      // at Munich's Olympiaberg. ID verified against the generated vault.
      relatedIds: ['moment:vault-ttpd-munichs-hill-the-biggest-free-show-of-the-eras-tour'],
      title: 'Welcome to Swiftkirchen: Gelsenkirchen renames itself for the Eras Tour',
      snippet:
        'New town signs went up before the tour’s three sold-out Veltins-Arena nights, July 17–19: “Swiftkirchen.” The rename was one fan’s idea — Aleshanee Westhoff petitioned Mayor Karin Welge, and the city let her install the first sign herself.',
      sourceUrl:
        'https://www.billboard.com/music/music-news/taylor-swifts-eras-tour-german-city-changes-name-1235724323/',
      thumbnailUrl:
        'https://media.nbcbayarea.com/2024/07/Germany-City-renamed.png?resize=1200%2C675&quality=85&strip=all',
      moment: {
        context:
          'The rename was one fan’s idea: a teenage Taylor fan, Aleshanee Westhoff, wrote to Mayor Karin Welge and started a petition behind it (it drew a few hundred signatures). Welge answered that it was “a great idea to temporarily rename Gelsenkirchen to ‘Swiftkirchen’” for the concert window, and had Westhoff unveil the first yellow sign on Ebertstraße in early July; around thirty went up at high-traffic spots. Gelsenkirchen wasn’t the first host city to try it — Glendale, Arizona had branded itself “Swift City” for the 2023 tour opener — but it went furthest.\n\nAll three Veltins-Arena nights sold out at roughly 60,000, about 180,000 across July 17–19, and the city threw a free “Taylor Town” festival — karaoke, DJ sets, a Taylor-themed tram — organised with local partners. Mastercard’s “Swiftonomics” tally put Gelsenkirchen’s accommodation spending up 171% year-on-year on the concert days, the largest jump of Germany’s three host cities. Two traces outlasted the weekend unevenly: the Walk of Fame stone was only temporary — swapped back for a neutral plate afterward, since that honour is normally reserved for locals — while twenty of the original “Swiftkirchen” signs were auctioned for charity. For one July week, a renamed industrial town was the center of the Swiftie map.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swifts-eras-tour-german-city-changes-name-1235724323/',
            source_title:
              'City in Germany Temporarily Renames Itself ‘Swiftkirchen’ Ahead of Taylor Swift’s Eras Tour Stops',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-15',
            reliability_score: 4,
          },
          {
            outlet: 'The Washington Post',
            url: 'https://www.washingtonpost.com/world/2024/07/18/gelsenkirchen-taylor-swift-europe-tour/',
            source_title: 'Gelsenkirchen is the most unlikely city on Taylor Swift’s Europe tour',
            publisher: 'The Washington Post',
            source_type: 'reputable_press',
            accessed_at: '2026-07-15',
            reliability_score: 4,
          },
          {
            outlet: 'TheWrap',
            url: 'https://www.thewrap.com/taylor-swift-germany-city-gelsenkirchen-name-change-eras-tour/',
            source_title:
              "Taylor Swift Gets German City Gelsenkirchen Renamed in Her Honor Ahead of Eras Tour Stop: 'Swiftkirchen'",
            publisher: 'TheWrap',
            source_type: 'reputable_press',
            accessed_at: '2026-07-15',
            reliability_score: 4,
          },
          {
            outlet: 'Stadt Gelsenkirchen',
            url: 'https://www.gelsenkirchen.de/de/_funktionsnavigation/presse/pressemeldungen/64305-taylor-swift-bekommt-einen-stein-auf-dem-gelsenkirchen-walk-of-fame',
            source_title: 'Taylor Swift bekommt einen Stein auf dem Gelsenkirchen Walk of Fame',
            publisher: 'City of Gelsenkirchen (official)',
            source_type: 'official',
            accessed_at: '2026-07-21',
            reliability_score: 5,
            notes: 'Walk of Fame stone is temporary — replaced with a neutral plate after the concerts (honour normally reserved for locals)',
          },
          {
            outlet: 'Stadt Gelsenkirchen',
            url: 'https://www.gelsenkirchen.de/de/_funktionsnavigation/presse/pressemeldungen/64442-versteigerung-von-20-original-swiftkirchen-schildern-ist-abgeschlossen',
            source_title: "Versteigerung von 20 original 'Swiftkirchen'-Schildern ist abgeschlossen",
            publisher: 'City of Gelsenkirchen (official)',
            source_type: 'official',
            accessed_at: '2026-07-21',
            reliability_score: 5,
            notes: '20 original signs auctioned for charity (~1,400 bids, top €3,000)',
          },
          {
            outlet: 'Mastercard',
            url: 'https://www.mastercard.com/news/europe/de-de/newsroom/pressemitteilungen/de-de/2024/swiftonomics-deutschlandkonzerte-taylor-swift-eras-tour/',
            source_title: 'Swiftonomics: Taylor Swifts Deutschlandkonzerte',
            publisher: 'Mastercard Newsroom',
            source_type: 'official',
            accessed_at: '2026-07-21',
            reliability_score: 4,
            notes: 'Gelsenkirchen accommodation spend +171% YoY, gastronomy +95% on concert days',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/glendale-arizona-renamed-swift-city-taylor-swift-eras-tour-1234695783/',
            source_title: 'Glendale, Arizona Renamed ‘Taylor City’ for Taylor Swift’s Eras Tour',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
            notes: 'Glendale renamed itself "Swift City" for the March 2023 tour opener — Gelsenkirchen was not the first',
          },
        ],
        // Photo-enrichment run 11 (2026-07-18, #762): page had zero photos.
        // NBC's coverage frame of the sign unveiling, on an NBC-owned CDN
        // (media.nbcbayarea.com). Verified HTTP 200 + image/png; downloaded and
        // vision-confirmed — the yellow "Swiftkirchen" town sign with the 1989
        // Taylor portrait, held up by a city official with young fans in Eras
        // Tour shirts. Billboard's and TheWrap's own leads were off-moment
        // Dublin/London file photos and were rejected.
        photos: [
          {
            url: 'https://media.nbcbayarea.com/2024/07/Germany-City-renamed.png?resize=1200%2C675&quality=85&strip=all',
            credit: 'NBC (via NBC Bay Area)',
            caption: 'The yellow "Swiftkirchen" town sign — one of 30 posted around Gelsenkirchen — unveiled with young fans ahead of the July 2024 shows.',
            kind: 'primary',
            // The sign is the subject, right of center; fans' faces upper-middle.
            focalPoint: '62% 48%',
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
      relatedIds: [
        'moment:vault-ttpd-vienna-cancelled-a-foiled-plot-three-sold-out-shows',
        'moment:vault-ttpd-welcome-to-swiftkirchen-gelsenkirchen-renames-itself-for-the',
      ],
      snippet:
        'Tens of thousands of ticketless fans climbed the Olympiaberg overlooking the Olympiastadion — and Taylor counted them from the stage: 74,000 inside, "and if the reports are correct, about 50,000 beautiful people outside the stadium."',
      sourceUrl:
        'https://variety.com/2024/music/global/taylor-swift-munich-fans-outside-stadium-hilltop-crowds-1236088585/',
      thumbnailUrl: 'https://consequence.net/wp-content/uploads/2024/07/Munich-Hill-Eras-Concert.jpeg',
      moment: {
        context:
          'The Olympiaberg is a man-made hill — the "Großer Schuttberg," a mound of World War II rubble piled up through the late 1940s and 1950s, then landscaped for the 1972 Munich Olympics. Rising roughly 55 metres above the park, it looks straight down into the Olympiastadion bowl — a sightline no other Eras Tour stop offered — and for the July 27–28, 2024 shows fans climbed it to watch the full three-hour production for free.\n\nEstimates of the hillside crowd varied by who was counting: Munich police put the Saturday gathering near 25,000, while media tallies ran to about 40,000, and both nights drew crowds. From the stage on Sunday — the tour\'s last German night — Taylor cited the higher figure, thanking "about 50,000 beautiful people outside the stadium" alongside the roughly 74,000 inside: "whether you\'re in the stadium or outside of the stadium... we are so lucky to be here with you." German and international press covered the gathering as an event in its own right, fans nicknamed the spot "Mount Swiftie," and police — who had monitored it — called the whole affair peaceful. German outlets framed it as a "Hörerparty," a listening party: the view down into the bowl was nothing like a stadium seat, so people came for the sound and the atmosphere, spreading picnic blankets while the concert organizer handed out water and emergency blankets against the sun.\n\nComparable ticketless crowds formed on high ground at other stops, but Munich\'s hillside is the largest and best-documented of the tour — the basis for the "biggest free show" framing.',
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
          {
            outlet: 'muenchen.de',
            url: 'https://www.muenchen.de/en/events/news/taylor-swift-all-about-concerts-munich',
            source_title: 'Taylor Swift: All about the concerts in Munich',
            publisher: 'City of Munich (official portal)',
            source_type: 'official',
            accessed_at: '2026-07-21',
            reliability_score: 4,
            notes: 'Police ~25,000 Saturday estimate vs ~40,000 media tally; peaceful conclusion; both nights',
          },
          {
            outlet: 'The Washington Times (AP)',
            url: 'https://www.washingtontimes.com/news/2024/jul/28/taylor-swift-fans-swarm-hill-in-munich-claiming-hi/',
            source_title: 'Taylor Swift fans swarm hill in Munich, claiming high perch for watching her concert for free',
            publisher: 'Associated Press',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
            notes: 'Free hilltop viewing across both nights',
          },
          {
            outlet: 'Rolling Stone (DE)',
            url: 'https://www.rollingstone.de/olympiaberg-in-muenchen-lockt-swifties-entspannte-hoererparty-statt-stadionstress-2783213/',
            source_title: 'Olympiaberg in München lockt Swifties: Entspannte Hörerparty statt Stadionstress',
            publisher: 'Rolling Stone Germany',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
            notes: 'German-press coverage of the Olympiaberg gathering as its own phenomenon',
          },
        ],
        // Photo-enrichment run 11 (2026-07-18, #762): page had zero photos.
        // Both images verified HTTP 200 + image/jpeg, downloaded and
        // vision-confirmed. The Consequence lead IS the moment — the
        // Olympiaberg hillside completely covered in people above the stadium
        // rim. Variety's Getty photo is Swift onstage at the same Munich stand
        // (folklore-set green dress, hand on heart).
        photos: [
          {
            url: 'https://consequence.net/wp-content/uploads/2024/07/Munich-Hill-Eras-Concert.jpeg',
            credit: 'via Consequence',
            caption: 'The Olympiaberg, packed with tens of thousands of ticketless fans, rising over the Olympiastadion rim during the July 2024 Munich shows.',
            kind: 'primary',
            // The crowded hillside crest sits upper-center; keep it in frame.
            focalPoint: '55% 28%',
          },
          {
            url: 'https://variety.com/wp-content/uploads/2024/07/GettyImages-2163970051-e1731290295821.jpg?w=990&h=563&crop=1',
            credit: 'Getty Images (via Variety)',
            caption: 'Hand on heart in the folklore set at the Olympiastadion — the stand where she thanked the "50,000 beautiful people outside the stadium."',
            kind: 'archival',
            // Face high in frame, just left of center.
            focalPoint: '47% 15%',
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
      relatedIds: [
          'moment:vault-tloas-the-end-of-an-era-the-eras-tour-docuseries-lands-on-disney',
        'moment:vault-ttpd-munichs-hill-the-biggest-free-show-of-the-eras-tour',
        'moment:vault-ttpd-eight-nights-at-wembley-more-than-any-solo-artist-ever',
        'moment:vault-lover-cornelia-street-written-alone-and-debuted-acoustic-in-paris',
      ],
      snippet:
        'Austrian police arrested suspects planning an attack on the Ernst Happel shows, and all three nights were scrapped. She later wrote the cancellations left her with "a new sense of fear" and "tremendous guilt."',
      sourceUrl: 'https://www.nbcnews.com/news/world/taylor-swift-concert-terror-plot-austria-foiled-2-men-arrested-shows-w-rcna165591',
      thumbnailUrl: null,
      moment: {
        context:
          'The Aug. 8–10, 2024 shows were called off after authorities said a foiled plot targeted the crowds at Ernst Happel Stadium; promoter Barracuda Music scrapped all three sold-out nights. Authorities attributed the plan to ISIS; the main suspect, a 19-year-old who had pledged allegiance to the group, was one of three people arrested in Austria at the time, and in May 2026 a Vienna court convicted him and imposed a 15-year sentence (a co-defendant received 12). The three dates were never rescheduled.\n\nThe cancellation had a counter-story the venue photos captured: on Aug. 8, the night the first show should have opened, thousands of fans gathered anyway — many on Vienna\'s Corneliusgasse, chosen because its name echoes "Cornelia Street" — trading friendship bracelets and singing together, including a pointed "Cruel Summer." One couple got engaged in the street as the crowd sang "Love Story," and nearby churches and shops opened their doors, one posting: "Dear Swifties, we sympathize with you. You\'re welcome to come and sing your sadness away."\n\nAll three nights were automatically refunded within 10 working days through the original point of purchase, per Barracuda Music and Austrian ticketer oeticket (StubHub buyers were offered a 120% voucher or a full cash refund). The Austrian Press Agency estimated the shows would have drawn more than 170,000 fans and roughly €100 million to the city, lost to the cancellation.\n\nTaylor stayed publicly silent until the tour\'s London dates were safely done. On Aug. 21, 2024 — the day after her final Wembley show — she addressed it on Instagram, calling the cancellation "devastating" and writing that it "filled me with a new sense of fear, and a tremendous amount of guilt because so many people had planned on coming to those shows," adding that her "priority was finishing our European tour safely." Her silence, she said, had been "showing restraint." The Wembley run had resumed days earlier, and the tour finished without further incident.',
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
          {
            outlet: 'TODAY',
            url: 'https://www.today.com/popculture/music/taylor-swift-vienna-cornelia-street-fans-canceled-concerts-rcna165835',
            source_title: "Taylor Swift fans sing on Vienna's Corneliusgasse after canceled concerts",
            publisher: 'TODAY / NBCUniversal',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Corneliusgasse gathering echoing "Cornelia Street"; bracelets and singalongs',
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2024/music/news/taylor-swift-fans-vienna-streets-terrorist-attack-canceled-concert-1236100439/',
            source_title: 'Taylor Swift Fans Sing in Vienna Streets After Canceled Concert',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: '"Cruel Summer" singalong; a street engagement during "Love Story"; church welcome post',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/business/touring/taylor-swift-vienna-concerts-ticket-refund-info-announced-1235749988/',
            source_title: "Ticket Refund Policies Announced for Taylor Swift's Canceled Vienna Shows",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Automatic refunds within 10 working days (Barracuda Music / oeticket); StubHub 120% voucher or 100% cash',
          },
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/news/world/taylor-swift-fear-tremendous-guilt-foiled-terror-plot-targ-rcna165751',
            source_title: "Taylor Swift says foiled plot targeting her Vienna shows filled her with fear and 'tremendous guilt'",
            publisher: 'NBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Her Aug. 21, 2024 Instagram statement — the correct provenance for the "new sense of fear"/"tremendous guilt" quote (not the Eras Tour Book)',
          },
          {
            outlet: 'Times of Israel (AFP)',
            url: 'https://www.timesofisrael.com/taylor-swifts-vienna-concerts-cancelled-over-islamist-attack-plot/',
            source_title: "Taylor Swift's three Vienna concerts cancelled over attack plot",
            publisher: 'AFP via The Times of Israel',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'APA estimate: 170,000+ spectators and ~€100M lost to the cancellation; ISIS-inspired plot',
          },
          {
            outlet: 'PBS NewsHour (AP)',
            url: 'https://www.pbs.org/newshour/world/suspect-in-attack-plot-on-taylor-swifts-vienna-concert-convicted-and-sentenced-to-15-years',
            source_title: "Suspect in plot to attack Taylor Swift's Vienna concert convicted and sentenced to 15 years",
            publisher: 'PBS NewsHour / Associated Press',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 5,
            notes: 'May 28, 2026 verdict: main suspect (Beran A.) 15 years, co-defendant 12 years; knives/homemade explosives targeting people outside Ernst Happel Stadium; ISIS allegiance',
          },
          {
            outlet: 'PBS NewsHour',
            url: 'https://www.pbs.org/newshour/world/suspect-in-attack-plot-on-taylor-swifts-vienna-concert-convicted-and-sentenced-to-15-years',
            source_title: "Suspect in attack plot on Taylor Swift's Vienna concert convicted and sentenced to 15 years",
            publisher: 'PBS NewsHour (AP)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'May 28, 2026: main suspect convicted, 15-year sentence; co-defendant 12 years',
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/austrian-plead-guilty-isis-terror-attack-taylor-swift-concert/',
            source_title: 'Austrian pleads guilty to plotting ISIS-linked terror attack on Taylor Swift concert',
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'ISIS attribution; main suspect pledged allegiance and pleaded guilty at trial',
          },
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/world/europe/suspect-taylor-swift-vienna-concert-attack-plot-convicted-sentenced-15-rcna347416',
            source_title: 'Suspect in Taylor Swift Vienna concert attack plot convicted and sentenced to 15 years',
            publisher: 'NBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'May 28, 2026 verdict: the ringleader convicted of the IS-linked concert plot, sentenced to 15 years.',
          },
          {
            outlet: 'CBC News',
            url: 'https://www.cbc.ca/lite/story/1.7289726',
            source_title: '3rd person arrested over foiled plot to attack Taylor Swift show in Vienna',
            publisher: 'CBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Several suspects detained (19-year-old ringleader, a 17-year-old, later an 18-year-old); plan to kill crowds outside the stadium with knives and/or explosives.',
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/austrian-plead-guilty-isis-terror-attack-taylor-swift-concert/',
            source_title: 'Austrian pleads guilty to plotting ISIS-linked terror attack on Taylor Swift concert',
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Islamic State attribution: the lead suspect had sworn allegiance to IS; IS propaganda and bomb-making chemicals recovered.',
          },
        ],
        // T16 photo pass (2026-07-09): the shows never happened, so no event
        // photo can exist — a clearly-labeled reference image of the venue
        // per the audit's §A2 stand-in rule. Public domain, Wikimedia Commons.
        // Photo-enrichment run 11 (2026-07-18, #762): added the aftermath that
        // WAS photographable — fans gathered in Vienna's streets on Aug. 8 to
        // sing together anyway. From TODAY's coverage on NBC's own CDN;
        // verified HTTP 200 + image/jpeg, downloaded and vision-confirmed
        // (crowd, friendship bracelets, raised phones and a gerbera).
        // Focal points set per image by viewing.
        photos: [
          {
            url: 'https://media-cldnry.s-nbcnews.com/image/upload/t_social_share_1200x630_center,f_auto,q_auto:best/rockcms/2024-08/taylor-swift-concert-vienna-zz-240808-03-8b9e7e.jpg',
            credit: 'Getty Images (via TODAY / NBC News)',
            caption: 'Aug. 8, 2024: on the night the first show should have opened, fans filled Vienna\'s streets — friendship bracelets on, phones up — to sing her songs together anyway.',
            kind: 'primary',
            // The raised flower-and-phone cluster is the subject, mid-frame.
            focalPoint: '50% 40%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Ernst-Happel-Stadion_02.jpg/960px-Ernst-Happel-Stadion_02.jpg',
            credit: 'Peter Gugerell, public domain, via Wikimedia Commons',
            caption: 'Reference image: Ernst Happel Stadium in Vienna, where all three sold-out shows were cancelled — the concerts themselves never took place.',
            kind: 'reference',
            // Wide architecture panorama; the stadium bowl sits below the sky line.
            focalPoint: '50% 58%',
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
      significance: 'defining', // her highest-profile political act ever, to 283M followers within minutes of the debate ending (docs/decisions.md, 2026-07-19)
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-ttpd-4", label: "Harris endorsement", kind: "life" },
      relatedIds: [
        'moment:vault-midnights-time-names-her-2023-person-of-the-year',
        'moment:vault-reputation-she-breaks-her-political-silence-and-voter-registrations-spi',
        'moment:vault-midnights-times-person-of-the-year-cover-shoot-in-three-looks',
        'moment:vault-lover-miss-americana-the-heartbreak-prince-a-high-school-built-fro',
      ],
      title: 'An endorsement signed "Childless Cat Lady"',
      snippet:
        'Minutes after the Harris–Trump debate ended, she endorsed Kamala Harris to 283 million followers — posed with Benjamin Button, sign-off borrowed from JD Vance\'s own insult.',
      sourceUrl: 'https://www.nbcnews.com/politics/2024-election/taylor-swift-endorses-kamala-harris-rcna170547',
      thumbnailUrl: null,
      moment: {
        // The post this page is ABOUT (issue #1074, Wyatt: "shouldn't we have
        // the actual picture that this article is about?"). Shortcode taken
        // from the permalink both NPR and CBS News embed, and verified by
        // rendering instagram.com/p/C_wtAOKOW1z/embed: the taylorswift verified
        // account, Swift holding Benjamin Button. Embedded rather than
        // hotlinked because Instagram CDN urls are signed and expiring and the
        // host is not on the image allowlist — and because every outlet that
        // covered this embeds it for the same reason.
        socialPost: {
          platform: 'instagram',
          shortcode: 'C_wtAOKOW1z',
          label:
            'The endorsement post itself: a photo with her cat Benjamin Button, signed "Childless Cat Lady."',
          postedOn: '2024-09-10',
        },

        context:
          'The Sept. 10, 2024 Instagram post — published minutes after the Harris–Trump debate ended — endorsed the full Democratic ticket: "I will be casting my vote for Kamala Harris and Tim Walz." It called Harris "a steady-handed, gifted leader" and praised Walz for "standing up for LGBTQ+ rights, IVF, and a woman\'s right to her own body for decades." Taylor said AI-generated images falsely showing her endorsing Donald Trump — which Trump had reposted on Truth Social on Aug. 18–19, 2024, captioned "I accept!" — had pushed her to be transparent about her actual vote.\n\nThe photo of Taylor holding Benjamin Button, the cat from her Time cover, and the "Childless Cat Lady" sign-off — reclaiming JD Vance\'s own insult — did the rest of the messaging. The post drew roughly a million likes in 13 minutes and more than ten million within days, among her most-liked ever.\n\nIts link to vote.gov drove 405,999 visitors in the following 24 hours — against a baseline near 30,000 a day — with officials reporting a 585% jump in use of the site\'s registration tools in the hours right after. That echoed, at far larger scale, the nearly 65,000 young people who registered through vote.org after her first political post in 2018 (the counts differ: 2024 measured site visitors, 2018 measured registrations). Trump answered on Sept. 15 with an all-caps "I HATE TAYLOR SWIFT!" The traffic was real, the ballot-box effect less so: researchers at Tufts\'s CIRCLE later found the endorsement moved youth turnout little, with under 1% of young voters citing celebrity influence.',
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
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-kamala-harris-endorsement-vote-gov/',
            source_title: "Taylor Swift's endorsement drove 405,999 visitors to vote.gov in 24 hours",
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'vote.gov (federal portal), not vote.org — 405,999 visitors via her link in 24h; GSA spokesperson',
          },
          {
            outlet: 'CNN',
            url: 'https://www.cnn.com/2024/08/19/politics/donald-trump-taylor-swift-ai/index.html',
            source_title: "Trump posts fake AI images of Taylor Swift and Swifties, falsely suggesting he has the singer's support",
            publisher: 'CNN',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2024/music/news/donald-trump-i-hate-taylor-swift-truth-social-1236144531/',
            source_title: "Donald Trump Rages at Taylor Swift: 'I Hate Taylor Swift!'",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
          },
          {
            outlet: 'TIME',
            url: 'https://time.com/7019847/taylor-swift-endorses-kamala-harris/',
            source_title: 'Taylor Swift Endorses Kamala Harris and Tim Walz',
            publisher: 'TIME',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Full-ticket endorsement quotes; ~1M likes in 13 minutes',
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-political-instagram-post-appears-to-spur-voter-registration-today-2018-10-09/',
            source_title: "Taylor Swift's political Instagram post appears to spur voter registration",
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: '2018 baseline: nearly 65,000 registrations via vote.org after her first political post',
          },
        ],
        // T16 photo pass (2026-07-09): Getty file photo CBS News ran with its
        // endorsement coverage (the endorsement itself was an Instagram post,
        // whose cat portrait is not freely rehostable). Verified HTTP 200 +
        // image/jpeg; visually confirmed (Swift onstage, 2024).
        // Photo-enrichment run 11 (2026-07-18, #762): deliberately left at one
        // photo. The moment is an Instagram post whose image can't be
        // rehosted, and the only candidates on approved CDNs (e.g. NBC's
        // endorsement-story lead, a July 2024 tour file photo) are more
        // off-moment file art that would add nothing over the existing one.
        // Focal point set by viewing.
        photos: [
          {
            url: 'https://assets2.cbsnewsstatic.com/hub/i/r/2024/09/11/edfca45c-3300-45c7-9daf-30c51d86fe4e/thumbnail/1200x630g2/528b3593333d50ff51e0e52340b1ca69/gettyimages-2166943469.jpg',
            credit: 'Getty Images (via CBS News)',
            caption: 'Taylor in 2024 — the file photo CBS News ran with its coverage of the endorsement, which itself was an Instagram post.',
            kind: 'archival',
            // Over-the-shoulder look to camera; face centered, eyes upper-middle.
            focalPoint: '49% 38%',
          },
          // Photo pass 2026-07-19 (defining-events-31-50): re-challenged —
          // the endorsement post itself still can't be rehosted, but 4 real,
          // official-portrait photos of the people this item's own text
          // directly names (the candidate she endorsed, the source of the
          // "cat lady" line, and the debate's two moderators) weren't
          // searched for before.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Kamala_Harris_Vice_Presidential_Portrait.jpg',
            focalPoint: '50% 30%',
            credit: 'Official White House portrait (public domain)',
            caption: 'Kamala Harris, the candidate the endorsement named directly.',
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/60/March_2026_Official_Vice_Presidential_Portrait_of_JD_Vance_%28head-and-shoulders_cropped%29.jpg',
            focalPoint: '54% 30%',
            credit: 'Official White House portrait (public domain)',
            caption: 'JD Vance, whose "childless cat ladies" line Taylor borrowed for her own sign-off.',
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/5/53/P20211222AS-1417_%2851898637810%29_%28cropped%29.jpg',
            focalPoint: '60% 22%',
            credit: 'Adam Schultz / The White House (public domain)',
            caption: 'David Muir, who co-moderated the Sept. 10, 2024 debate the endorsement followed within minutes.',
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Linsey_Davis_at_BookExpo_%2805437%29_%28cropped%29.jpg',
            focalPoint: '54% 22%',
            credit: 'Rhododendrites, Wikimedia Commons (CC BY-SA 4.0)',
            caption: 'Linsey Davis, the debate\'s other co-moderator.',
            kind: 'reference',
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
      // the-proposal thread opt-in (stage 3, 2026-07-19): the first big
      // non-football public date — a beat of the derived End Game thread.
      threadIds: ['the-proposal'],
      snippet:
        'A rare non-football sports date: she and Travis watched Sinner beat Fritz from a box with Patrick and Brittany Mahomes — a red-and-white checkered dress and a Gucci bucket hat between them.',
      sourceUrl: 'https://abcnews.go.com/GMA/Culture/taylor-swift-travis-kelce-attend-us-open-mens/story?id=113500642',
      thumbnailUrl: null,
      moment: {
        context:
          'Sept. 8, 2024: two days before her Harris endorsement rearranged the news cycle, the two couples took in the men\'s final at Arthur Ashe Stadium. Fashion desks pinned Taylor\'s look precisely — the cherry-red gingham was Reformation\'s "Sora" linen dress (about $248), styled with Gucci platform sandals and gold Louis Vuitton earrings; the Gucci bucket hat photographed between them was Travis\'s, part of his own head-to-toe Gucci fit.\n\nThe match itself was a real one: Jannik Sinner beat Taylor Fritz 6-3, 6-4, 7-5 for his first US Open title and second Grand Slam of 2024, while Fritz was the first American man in a US Open singles final since Andy Roddick in 2006. The couple shared a celebrity-heavy afternoon that also drew Anna Wintour, Matthew McConaughey and Alec Baldwin.\n\nThe US Open\'s own account leaned in — "in her tennis era," a nod to the 12-year-old Taylor who had sung at Arthur Ashe back in 2002 — and caught the couple on the stadium screen mid-singalong to The Darkness\'s "I Believe in a Thing Called Love," a clip the tournament posted that sent the song back up the charts. It was a one-day trip (the Chiefs had opened their NFL season three days earlier), read in real time as a pure sports-and-fashion appearance, and it became one of the relationship\'s most-photographed non-Arrowhead moments of the year — setting off a wave of gingham "dupe" shopping guides.',
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
          {
            outlet: 'WWD',
            url: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-reformation-dress-us-open-travis-kelce-1236584025/',
            source_title: 'Taylor Swift Serves Up Reformation Dress at US Open With Travis Kelce',
            publisher: 'WWD',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
            notes: 'Reformation "Sora" gingham dress (~$248); Travis in Gucci',
          },
          {
            outlet: 'Footwear News',
            url: 'https://footwearnews.com/shoes/womens-footwear/taylor-swift-travis-kelce-gucci-sandals-us-open-new-york-1203686442/',
            source_title: 'Taylor Swift Wore Gucci Lady Sandals at 2024 US Open With Travis Kelce',
            publisher: 'Footwear News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
            notes: 'Gucci sandals; Louis Vuitton earrings',
          },
          {
            outlet: 'ATP Tour',
            url: 'https://www.atptour.com/en/news/sinner-fritz-us-open-2024-final',
            source_title: 'Jannik Sinner defeats Taylor Fritz for US Open title',
            publisher: 'ATP Tour',
            source_type: 'official',
            accessed_at: '2026-07-21',
            reliability_score: 5,
            notes: 'Score 6-3, 6-4, 7-5; Sinner first US Open title; Fritz first American finalist since Roddick 2006',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-travis-kelce-darkness-i-believe-in-a-thing-called-love-us-open-bump-1235772356/',
            source_title: "The Darkness's 'I Believe in a Thing Called Love' Gets a US Open Bump",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
            notes: 'Swift & Kelce caught on the stadium screen singing along; USTA posted the clip; song surged on the charts',
          },
          {
            outlet: 'Billboard (via Yahoo)',
            url: 'https://www.yahoo.com/entertainment/taylor-swift-travis-kelce-attend-013108867.html',
            source_title: 'Taylor Swift and Travis Kelce Attend the 2024 US Open',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
            notes: 'The "in her tennis era" post referenced Swift singing at Arthur Ashe as a child in 2002',
          },
        ],
        // Stylist SOURCE pass (2026-07-24): the look names three pieces, but
        // only the Reformation dress is a nameable, verifiable retail garment.
        // - Reformation "Sora" linen dress: exact PDP on the brand's own store
        //   (thereformation.com), curl HTTP 200, title "Sora Linen Dress",
        //   price $248.00 — a real product page for the exact style. The
        //   red-and-white gingham colorway is now sold out ("Sorry, this isn't
        //   available"), so linked with inStock:false rather than dropped, per
        //   the Stylist rule (sold out still links, dimmed).
        // Skipped, no exact product page to verify:
        // - "Gucci platform sandals" and "gold Louis Vuitton earrings" name no
        //   specific style; gucci.com / louisvuitton.com hard-block automated
        //   requests, so no PDP can be identified or curl-verified without
        //   guessing — better no link than a fabricated one.
        products: [
          {
            brand: 'Reformation',
            item: 'Sora Linen Dress',
            retailer: 'thereformation.com',
            url: 'https://www.thereformation.com/products/sora-linen-dress/1314992.html',
            price: '$248.00',
            inStock: false,
          },
        ],
        // T16 photo pass (2026-07-09): AP photo from ABC News' coverage of
        // this outing, on ABC's own CDN. Verified HTTP 200 + image/jpeg;
        // visually confirmed (both couples in the Arthur Ashe box).
        photos: [
          {
            url: 'https://i.abcnewsfe.com/a/667ac5d8-cb5f-48cd-9230-89ea434a7644/Taylor-Travis-Patrick-Brittany-USOpen-1-ap-jm-240908_1725821927016_hpMain_16x9.jpg?w=1600',
            credit: 'AP (via ABC News)',
            caption: 'Taylor, Brittany Mahomes, Travis Kelce, and Patrick Mahomes in the box at Arthur Ashe Stadium, Sept. 8, 2024.',
            kind: 'primary',
            // Photo pass #762 (2026-07-19): viewed — the two couples' faces cluster around the
            // center of the frame; this keeps all four in a wide crop.
            focalPoint: '55% 42%',
          },
          // Photo pass #762 (2026-07-19): second frame from the same cited ABC News story's own
          // CDN — the Reuters photo embedded in the article body ("-rt-" in the filename, vs the
          // AP "-ap-" lead above). curl 200 image/jpeg 1500x952; Read-viewed: Swift clapping in
          // the red gingham dress between Kelce (Gucci bucket hat) and the Mahomeses — clearly a
          // different moment from the AP hug frame, no watermark.
          {
            url: 'https://i.abcnewsfe.com/a/1fc501ac-ba55-40eb-b3ce-02983fbfa66f/Taylor-Travis-Patrick-Brittany-USOpen-1-rt-jm-240908_1725822057337_hpEmbed_11x7.jpg?w=1500',
            credit: 'Reuters (via ABC News)',
            caption: 'Applauding the final from the box — Kelce, Taylor, and the Mahomeses reacting to the match.',
            focalPoint: '47% 42%',
          },
        ],
      },
    },
    {
      slug: 'vmas-2024-seven-wins',
      significance: 'notable', // a real, all-time career-wins tie with one of the genre's biggest names (docs/decisions.md, 2026-07-19)
      // Cross-link (Answerer shard 1, 2026-07-24, ledger #1408): the page had no
      // rail; the VOTY three-peat's prior rung is the 2023 record-tying VMA night.
      // Id verified against content-vault.generated.ts.
      relatedIds: [
        'moment:vault-midnights-a-record-tying-9-vma-wins-in-one-night',
        'moment:vault-evermore-video-of-the-year-for-all-too-well-then-she-announces-midnig',
      ],
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
          'The Sept. 11, 2024 haul was seven of twelve nominations: Video of the Year, Artist of the Year, Best Pop, Best Collaboration, Best Direction, Best Editing, and Song of the Summer. Five went to "Fortnight" alongside Post Malone — the two accepted Best Collaboration together, her first televised win of the night, in which she noted the ceremony fell on the anniversary of 9/11 — leaving Artist of the Year and Best Pop as her solo trophies. The Video of the Year three-peat (All Too Well in 2022, Anti-Hero in 2023, Fortnight in 2024) and a fifth career VOTY are records nobody else holds, and the total — her 30th Moon Person — tied Beyoncé for the most VMAs ever won; a year later, with Taylor sitting out the 2025 ceremony (she lost her lone nomination, Artist of the Year, to Lady Gaga), the 30–30 tie still stood.\n\nThe five she lost were all technical or special categories, most of them other "Fortnight" nods: Song of the Year (to Sabrina Carpenter\'s "Espresso"), Best Cinematography (to Ariana Grande\'s "we can\'t be friends"), Best Visual Effects (to Eminem\'s "Houdini"), Best Art Direction (to Megan Thee Stallion\'s "BOA"), and the fan-voted Most Iconic Performance nod for her 2009 "You Belong With Me."\n\nOnstage she kept it personal, not political. A night after endorsing Kamala Harris — the debate had aired the evening before — she made no mention of it in her speeches, urging fans only to register to vote, and in the Video of the Year speech she thanked Travis Kelce ("everything this man touches turns to happiness and fun and magic"), who was absent mid-NFL season. She walked the carpet in a tartan Christian Dior corset with a cape and velvet shorts, then changed mid-show into a Monse minidress embroidered with UFOs — a wink at the alien imagery of "Down Bad" — styled, as ever, by Joseph Cassell Falconer.',
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
          {
            outlet: 'Good Morning America (ABC News)',
            url: 'https://www.goodmorningamerica.com/culture/story/mtv-vmas-winners-2024-taylor-swift-chappell-roan-113618153',
            source_title: '2024 MTV VMAs recap: Taylor Swift dominates the night, full winners list',
            publisher: 'ABC News',
            source_type: 'awards_database',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Full winners list — confirms the seven wins (incl. Song of the Summer for "Fortnight") and the winners of the five lost categories',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-video-of-the-year-2024-vmas-fortnight-1235096115/',
            source_title: 'Taylor Swift Wins 2024 VMA for Video of the Year, Thanks Travis Kelce',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'VOTY speech — the Kelce "happiness and fun and magic" line; the register-to-vote message with no on-stage Harris mention',
          },
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/taylor-swift-ufo-sequin-mini-dress-2024-vmas/',
            source_title: 'Taylor Swift Changes Into a UFO-Embellished Sequin Mini Dress Mid-2024 VMAs',
            publisher: 'Marie Claire',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Tartan Christian Dior carpet look and the Monse UFO minidress change (stylist Joseph Cassell Falconer)',
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/tonifitzgerald/2025/09/07/taylor-swift-skips--2025-vmas-stays-tied-for-record-wins/',
            source_title: 'Taylor Swift Skips 2025 VMAs, Stays Tied For Record Wins',
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'The 30–30 Beyoncé tie survived the 2025 ceremony; Swift lost her lone 2025 nod (Artist of the Year) to Lady Gaga',
          },
        ],
        // T16 photo pass (2026-07-09): Getty ceremony photo from Rolling
        // Stone's own records coverage (first source above). Verified HTTP
        // 200 + image/jpeg; visually confirmed (Moon Person in hand, onstage).
        // Photo-enrichment run 11 (2026-07-18, #762): added Billboard's frame
        // of the Best Collaboration acceptance from the same night — a
        // distinct outfit-and-podium moment from the silver-dress VOTY frame.
        // Verified HTTP 200 + image/jpeg, downloaded and vision-confirmed.
        // Focal points set per image by viewing.
        photos: [
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2024/09/taylor-record-for-VOY-awards.jpg?resize=1600%2C900',
            credit: 'Getty Images (via Rolling Stone)',
            caption: 'Accepting one of seven Moon Persons at the 2024 VMAs on Sept. 11, 2024 — including a record third straight Video of the Year.',
            kind: 'primary',
            // Mid-laugh at the mic; face upper-center-left, trophy mid-frame.
            focalPoint: '48% 20%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/09/taylor-swift-best-collab-mtv-vmas-2024-billboard-1548.jpg?w=1024',
            credit: 'Getty Images (via Billboard)',
            caption: 'Accepting Best Collaboration for "Fortnight" in the plaid corset look — one of the seven wins that tied Beyoncé\'s all-time VMAs record.',
            kind: 'archival',
            // Face high, slightly left of center; Moon Person at chest height.
            focalPoint: '47% 18%',
          },
        ],
      },
    },
    {
      slug: 'eras-tour-book-target',
      significance: 'notable', // a real print-sales record for a photo book, extending the tour's commercial reach past music and tickets (docs/decisions.md, 2026-07-19)
      year: 2024,
      month: 11,
      day: 30,
      category: 'business',
      title: 'The Eras Tour Book sells 814,000 copies in two days',
      snippet:
        'Target-exclusive, $39.99, 256 pages of tour photos and her own notes: it moved 814K over Thanksgiving weekend and nearly a million in week one — 2024\'s biggest new-release print debut.',
      sourceUrl: 'https://variety.com/2024/music/news/taylor-swift-eras-tour-book-sales-blockbuster-debut-two-days-1236236012/',
      thumbnailUrl: null,
      relatedIds: [
          'moment:vault-ttpd-the-long-canadian-goodbye-six-nights-in-toronto','moment:vault-ttpd-2-61-million-in-week-one-her-14th-no-1-tying-jay-z'],
      moment: {
        context:
          'Released in stores on Black Friday, Nov. 29, 2024, alongside Target-exclusive Anthology pressings of The Tortured Poets Department — a $59.99 vinyl (four marbled, translucent discs plus a 12-inch poster) and a $17.99 CD, both carrying the 35-track Anthology. Per Circana BookScan data the book\'s two-day number trailed only Barack Obama\'s A Promised Land for a first week, and Target called it the fastest-selling new-release book it had carried in four years — 2024\'s biggest publishing launch.\n\nThe 256-page, $39.99 volume collects more than 500 photos — many never before seen, from every era, plus rehearsal shots and behind-the-scenes images of instruments, costumes, set pieces and designer sketches — with Taylor\'s own written reflections on the tour. First sold only at Target, it later reached Amazon and Taylor\'s official store.\n\nSelf-published rather than issued through a traditional house, it was quickly nicknamed "the Errors Tour": first printings were riddled with mistakes — the surprise song "This Is Me Trying" printed "This Is Me Rying," a Toronto date missing from the concert list, pixelated photos, text bleeding off pages, some copies with pages upside-down or missing, and images cropped so tightly into the spine that Taylor disappeared into the gutter. Publishing veterans said a traditional editor and printer would have caught them; Taylor\'s team, not being book publishers, simply "didn\'t consider" that layer of quality control (Sophie Vershbow, to Yahoo). Target ordered a two-million-copy print run; the individual tour photographers, the printer, and any editor or designer went uncredited. As of mid-2026 no corrected reprint, errata edition, or refund program had materialized, and no consumer-protection or class-action action was documented — the only remedy on record was ad-hoc copy exchanges at Target, with no formal acknowledgement of the defects from Taylor\'s team or Target.',
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
            url: 'https://www.rollingstone.com/culture/culture-news/taylor-swift-eras-tour-book-publishing-mistake-1235192781/',
            source_title: "The 'Errors Tour': Fans Point Out Mistakes in Taylor Swift's Official Tour Book",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/taylor-swift-fans-lined-target-220553826.html',
            source_title: 'Taylor Swift fans lined up at Target to buy her self-published book. It turned out to be riddled with errors.',
            publisher: 'Yahoo Entertainment',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
          },
          {
            outlet: 'Good Morning America',
            url: 'https://www.goodmorningamerica.com/culture/story/taylor-swift-announces-official-eras-tour-book-details-114807673',
            source_title: "Taylor Swift's 'The Eras Tour Book' is out now",
            publisher: 'Good Morning America',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-eras-tour-book-tortured-poets-department-anthology-vinyl-cd-black-friday-1235800890/',
            source_title: "Taylor Swift Releasing Eras Tour Book and 'Tortured Poets Department' Anthology Vinyl/CD on Black Friday",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
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
        // Photo-enrichment run 11 (2026-07-18, #762): added the in-store shot
        // from Rolling Stone's sales story (second source above) — shrink-
        // wrapped copies on a Target shelf with the "only at" Target rail,
        // which is the actual Black Friday retail moment. Verified HTTP 200 +
        // image/jpeg, downloaded and vision-confirmed. Focal points set per
        // image by viewing.
        photos: [
          {
            url: 'https://variety.com/wp-content/uploads/2024/12/targetbook.png?w=1000',
            credit: 'Target (via Variety)',
            caption: 'The Eras Tour Book — 256 pages, $39.99, Target-exclusive, and 2024\'s biggest new-release print debut.',
            kind: 'primary',
            // Product render on white; the book sits just left of center.
            focalPoint: '48% 42%',
          },
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2024/12/eras-tour-book-copies.jpg?crop=0px%2C0px%2C1798px%2C1014px&resize=1600%2C900',
            credit: 'via Rolling Stone',
            caption: 'Shrink-wrapped copies in the Target aisle over Thanksgiving weekend 2024, when 814,000 sold in two days.',
            kind: 'archival',
            // The held cover dominates the left half; its figure reads upper-left.
            focalPoint: '36% 25%',
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
      relatedIds: [
          'moment:vault-ttpd-tortured-poets-breaks-spotifys-single-day-record',
        'moment:vault-ttpd-the-tortured-poets-department',
        'moment:vault-ttpd-all-14-ttpd-monopolizes-the-top-of-the-hot-100',
        'moment:vault-ttpd-the-eras-tour-takes-its-final-bow-in-vancouver',
      ],
      snippet:
        'Wrapped 2024 crowned her the most-streamed artist on earth for the second straight year, with TTPD as the year\'s most-streamed album — and the first-ever Wrapped badge stamped on her profile.',
      sourceUrl: 'https://newsroom.spotify.com/2024-12-04/taylor-swift-takes-the-crown-as-spotifys-global-top-artist-of-2024/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Dec. 4, 2024 reveal put her ahead of The Weeknd, Bad Bunny, Drake, and Billie Eilish on more than 26.6 billion global streams for the year — the Eras Tour and the Anthology feeding each other. Women held most of the global top-10 albums chart, with TTPD on top.\n\nSpotify built her a victory lap to match: the platform\'s first-ever "Global Top Artist Badge" stamped on her profile, era-themed Easter-egg animations hidden in the play button across her discography, augmented-reality friendship bracelets on Snapchat, celebration billboards in 11 cities, and personalized thank-you videos from Taylor dropped into loyal listeners\' own Wrapped stories.\n\nContext the headline number needs: her 2023 Wrapped total was roughly 26.1 billion, so 26.6 billion was a modest new personal high, not a decline, and the largest year-end artist total Spotify has published to date. The back-to-back crown was a personal first but not an all-time one — she had ended Bad Bunny\'s three-year reign (2020–2022) when she took 2023. Spotify did not publish the runners-up\' individual totals or a country-by-country count, and the "Global Top Artist Badge" was the inaugural edition of what the platform framed as a recurring annual honor rather than a one-off for her. Her single most-streamed song of the year was not a TTPD cut but "Cruel Summer," the 2019 Lover single the Eras Tour kept aloft — her only track in Spotify\'s 2024 global top 10, at No. 9.\n\nApple Music\'s Replay 2024 mirrored the crown, naming TTPD its most-streamed album of the year and Taylor its most-streamed artist. Her monthly listeners had peaked earlier, at a Guinness-certified 113,539,589 on May 7, 2024 — the female record — in TTPD\'s wake. The streak then stopped at two: Wrapped 2025 (Dec. 3, 2025) handed the global crown back to Bad Bunny on 19.8 billion streams, Taylor a close second, so the "recurring annual honor" did not recur for her — though she stayed Spotify\'s No. 1 US artist both years.',
        sources: [
          {
            outlet: 'Spotify Newsroom',
            url: 'https://newsroom.spotify.com/2024-12-04/taylor-swift-takes-the-crown-as-spotifys-global-top-artist-of-2024/',
            source_title: "Taylor Swift Takes the Crown as Spotify's Global Top Artist of 2024",
            publisher: 'Spotify Newsroom',
            source_type: 'official',
            accessed_at: '2026-07-08',
            reliability_score: 5,
            notes: 'The 11 celebration-billboard cities: New York, Toronto, Jakarta, São Paulo, Manila, Mexico City, London, Berlin, Los Angeles, Nashville and Miami.',
          },
          {
            outlet: 'Spotify Newsroom',
            url: 'https://newsroom.spotify.com/2025-12-03/wrapped-bad-bunny-top-artist-album/',
            source_title: "Bad Bunny Is Spotify's Global Top Artist of 2025",
            publisher: 'Spotify Newsroom',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 5,
            notes: 'Wrapped 2025 (revealed Dec. 3, 2025): Bad Bunny reclaims the global crown on 19.8bn streams; Swift places No. 2 — the streak ends at two.',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/2024-spotify-wrapped-taylor-swift-sabrina-carpenter-espresso-1235843719/',
            source_title: "2024 Spotify Wrapped: Taylor Swift Is Top Artist, Sabrina Carpenter's 'Espresso' Is Top Song",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: "Swift was also Spotify's No. 1 US artist for 2024; the top US (and global) song was Sabrina Carpenter's \"Espresso.\" No US-only per-artist stream total was published.",
          },
          {
            outlet: 'Guinness World Records',
            url: 'https://www.guinnessworldrecords.com/news/icons/taylor-swift-most-monthly-listeners-on-spotify',
            source_title: 'Taylor Swift: most monthly listeners on Spotify (female)',
            publisher: 'Guinness World Records',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 5,
            notes: 'Certified female record of 113,539,589 monthly listeners as of May 7, 2024 (not the all-gender record).',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-reacts-the-tortured-poets-department-apple-music-top-streamed-album-2024-1235843467',
            source_title: "Taylor Swift Reacts to 'The Tortured Poets Department' Topping Apple Music's 2024 Most-Streamed Albums",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: "Apple Music Replay 2024 corroborated the crown — TTPD its most-streamed album, Swift its most-streamed artist. No Amazon Music 2024 album crown was located.",
          },
          {
            outlet: 'Music Business Worldwide',
            url: 'https://www.musicbusinessworldwide.com/taylor-swift-claims-title-of-spotifys-most-streamed-artist-for-second-straight-year-with-26-6bn-streams-in-20241/',
            source_title: "Taylor Swift claims title of Spotify's most-streamed artist for second straight year, with 26.6bn streams in 2024",
            publisher: 'Music Business Worldwide',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: '26.6bn (up from ~26.1bn in 2023); ended Bad Bunny’s 2020–2022 reign in 2023',
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
            // TTPD cover square sits dead-center of the banner; genuinely centered.
            focalPoint: '50% 50%',
          },
          // Photo pass (#762 run 6, 2026-07-18): the official share card from
          // the same newsroom post. Verified HTTP 200 + image/png, downloaded
          // and visually confirmed (portrait + "Global Top Artist" lockup).
          {
            url: 'https://storage.googleapis.com/pr-newsroom-wp/1/2024/12/Taylor-Swift-Sharecard.png',
            credit: 'Spotify Newsroom',
            caption:
              'The "Global Top Artist" share card Spotify issued with the Dec. 4 reveal — the badge-styled lockup fans passed around as Wrapped stories dropped.',
            kind: 'primary',
            // The portrait square sits in the upper-middle of the card; the text lockup is below.
            focalPoint: '50% 35%',
          },
        ],
      },
    },
    {
      slug: 'masters-buyback-shamrock',
      significance: 'defining', // the actual resolution of the defining business war of her career (docs/decisions.md, 2026-07-19)
      threadIds: ['taylors-version'],
      relatedIds: [
          'moment:vault-tloas-a-mint-green-briefcase-on-new-heights-album-no-12-announced-',
          'moment:vault-lover-lover-the-first-album-shes-ever-owned',
        'moment:vault-lover-my-worst-case-scenario-scooter-braun-buys-big-machine-and-he',
        'moment:vault-folklore-her-masters-get-sold-again-this-time-to-shamrock-capital-for',
        'moment:vault-evermore-fearless-taylors-version-is-the-first-re-recorded-album-ever',
        'moment:vault-reputation-she-leaves-big-machine-for-republic-and-owns-her-masters-goi',
        'moment:vault-lover-the-re-recording-plan-confirmed-on-live-tv-the-day-before-lo',
      ],
      year: 2025,
      month: 5,
      day: 30,
      category: 'business',
      title: '"All of the music I\'ve ever made... now belongs... to me"',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-ttpd-3", label: "Masters bought back", kind: "business" },
      snippet:
        'The ending the Taylor\'s Versions were building toward: she bought her first six albums back from Shamrock Capital — masters, videos, artwork, unreleased songs, everything.',
      sourceUrl: 'https://www.billboard.com/pro/taylor-swift-regains-control-master-recordings-shamrock/',
      thumbnailUrl: null,
      moment: {
        context:
          'Announced May 30, 2025 in a letter on her website. The terms were never officially disclosed, and the reported price depends on who you ask: around $360 million per Billboard, around $300 million per Rolling Stone, and — the highest figure floated — $405 million per Music Business Worldwide, for the catalog Shamrock Capital had bought from Scooter Braun\'s Ithaca Holdings back in November 2020. Whatever the real number, Shamrock\'s own math (per Billboard\'s later analysis) shows little if any profit on the resale itself — just roughly $100 million banked over the three-plus years it owned the records. As her letter enumerated it, the purchase swept up everything: "all my music videos. All the concert films. The album art and photography. The unreleased songs. The memories. The magic. The madness. Every single era. My entire life\'s work."\n\nShe had been offered the catalog directly in 2020 and walked away — Braun\'s team, she said, wanted an "ironclad" NDA barring her from ever speaking critically of him before she could even see the financials. This time the deal was struck directly with Shamrock through her Nashville-based management team; a source close to the talks credited only "the partners at Shamrock Capital and Taylor\'s Nashville-based management team," adding it happened "in spite of Scooter Braun, not because of him." Braun told reporters he was "happy for her."\n\nThe same letter settled the re-record questions: Reputation (Taylor\'s Version) had barely been touched — she\'d kept hitting a wall re-making an album she felt needed nothing fixed — while her re-recorded debut was finished and could "have its moment" someday. At its reported price the deal sits alongside the Dylan and Springsteen catalog sales of the era, but with a distinction: those bundled publishing, while Taylor already owned her publishing — making this a rare buyback of masters alone.\n\nIn her announcement letter she credited the ending to the success of the Eras Tour and the fans\' support for her re-recordings, saying she could finally own her music "with no strings attached." Whether the deal ended Braun\'s 2020 earnout was never officially confirmed — though according to Variety, he "no longer participates in any profit from a sale," and Taylor\'s camp was adamant he had no part in Shamrock\'s decision to sell.\n\nTwo things the announcement made concrete. First, the buyback gave Taylor ownership of her entire recorded catalog for the first time — the reclaimed first six albums plus Lover through The Tortured Poets Department, which she already owned on Republic — and for the four albums she had re-recorded (Fearless, Red, Speak Now, 1989) she now controls both the originals and the Taylor\'s Versions, quietly ending her long campaign urging fans to stream only the re-records. Shamrock issued its own statement, calling itself "thrilled with this outcome" and "so happy for Taylor." The market moved at once: per Luminate, her catalog streaming jumped 55.1% on announcement day and each of the six original albums at least doubled — the original Speak Now spiking roughly 430% — while the Taylor\'s Versions held steady rather than dipping, and catalog album sales rose 235% that week. Fellow artists cheered publicly, among them Selena Gomez, Phoebe Bridgers and Travis Kelce. As of mid-2026 nothing had advanced on the two unfinished re-records: the debut Taylor\'s Version remained finished but unreleased, and Reputation (Taylor\'s Version) stayed shelved — its only new fragment a re-recorded "Look What You Made Me Do (Taylor\'s Version)" that surfaced in a 2025 Handmaid\'s Tale sync.',
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
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-buys-back-her-catalog-explainer-1236233783/',
            source_title: 'Taylor Swift Gets Her Masters Back: How We Got Here',
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
            notes: 'Shamrock and Braun statements; 2020 NDA reason; the ~$300M/$405M and ~$360M figures',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Taylor_Swift_masters_dispute',
            source_title: 'Taylor Swift masters dispute — Wikipedia',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-21',
            reliability_score: 2,
            notes: 'Asset list; Reputation TV vs debut TV status; Shamrock statement wording',
          },
          {
            outlet: 'ABC News',
            url: 'https://abcnews.go.com/GMA/Culture/taylor-swift-reclaims-masters-shares-powerful-letter-greatest/story?id=122348547',
            source_title: 'Taylor Swift reclaims her masters and shares a powerful letter',
            publisher: 'ABC News (Good Morning America)',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
            notes: 'Reproduces the letter: bought back "with no strings attached" thanks to the Eras Tour and the re-recordings',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/pro/features/why-taylor-swift-scooter-braun-shamrock-1091742/',
            source_title: "Why Did Shamrock Capital Spend $300 Million on Old Taylor Swift Albums?",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'November 2020 Shamrock purchase reported ~$300M',
          },
          {
            outlet: 'Music Business Worldwide',
            url: 'https://www.musicbusinessworldwide.com/taylor-swift-buys-back-master-rights-to-first-six-albums-from-shamrock-capital/',
            source_title: 'Taylor Swift buys back master rights to first six albums from Shamrock Capital',
            publisher: 'Music Business Worldwide',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: "Shamrock's 2020 outlay reported at $405M; Braun's 'I am happy for her' statement",
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/monicamercuri/2025/05/30/taylor-swift-buys-back-her-masters-and-reveals-the-fate-of-reputation-tv/',
            source_title: "Taylor Swift Buys Back Her Masters And Reveals The Fate Of 'Reputation (TV)'",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Letter quotes on Reputation TV (barely a quarter re-recorded) and the finished debut re-record',
          },
          {
            outlet: 'NBC News',
            url: 'https://www.nbcnews.com/pop-culture/pop-culture-news/taylor-swift-buys-back-rights-master-recordings-first-6-albums-rcna209986',
            source_title: 'Taylor Swift buys back the rights to the master recordings of her first 6 albums',
            publisher: 'NBC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'First time she owns her entire catalog; Shamrock\'s own statement ("thrilled with this outcome and [we] are so happy for Taylor")',
          },
          {
            outlet: 'Luminate',
            url: 'https://luminatedata.com/blog/original-recordings-or-taylors-versions-which-albums-are-swifties-streaming/',
            source_title: 'Original Recordings or Taylor\'s Versions: Which Albums Are Swifties Streaming?',
            publisher: 'Luminate',
            source_type: 'chart_database',
            accessed_at: '2026-07-24',
            reliability_score: 5,
            notes: 'Post-buyback streaming: originals each at least doubled (Speak Now ~+430%), Taylor\'s Versions held steady, no dip',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-albums-boost-masters-1235993446/',
            source_title: 'Taylor Swift\'s Catalog Gets a Boost After She Buys Back Her Masters',
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: 'Catalog streaming +55.1% on announcement day; catalog album sales +235% that week',
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
            caption: 'The photo released with the May 30, 2025 announcement: Taylor with the six albums she bought back from Shamrock Capital.',
            kind: 'primary',
            // Seated with arms raised, face in the upper third, slightly left of center.
            focalPoint: '48% 30%',
          },
          // Photo pass (#762 run 6, 2026-07-18): frame 01 of the same
          // announcement set (distinct pose — reading the sleeves, reputation
          // LP in hand). Verified HTTP 200 + image/jpeg, downloaded and
          // visually confirmed.
          {
            url: 'https://www.billboard.com/wp-content/uploads/2025/05/01-taylor-swift-with-albums-2025-billboard-1548.jpg?w=1024',
            credit: 'Courtesy of Taylor Swift (via Billboard)',
            caption:
              'A second frame from the announcement set: reading the sleeves of the reclaimed records, reputation in hand.',
            kind: 'primary',
            // She sits center-left with the albums fanned across her lap; face in the upper quarter.
            focalPoint: '46% 30%',
          },
          // Photo depth pass (round 2, 2026-07-19): two more frames from the
          // same Billboard-hosted announcement shoot (sequential 03/04 in the
          // same URL series as the two above). Each verified HTTP 200 +
          // image/jpeg, downloaded and viewed this session.
          {
            url: 'https://www.billboard.com/wp-content/uploads/2025/05/03-taylor-swift-with-albums-2025-billboard-1548.jpg?w=1024',
            credit: 'Courtesy of Taylor Swift (via Billboard)',
            caption: 'A third frame from the announcement set: seated cross-legged with all six reclaimed albums fanned in a circle around her.',
            kind: 'primary',
            // Kneeling, face upper-center; albums ring the lower half of frame.
            focalPoint: '48% 28%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2025/05/04-taylor-swift-with-albums-2025-billboard-1548.jpg?w=1024',
            credit: 'Courtesy of Taylor Swift (via Billboard)',
            caption: 'A closer frame from the same shoot, hands resting on the reclaimed sleeves.',
            kind: 'primary',
            focalPoint: '50% 25%',
          },
        ],
      },
    },

    // --- Content Shift pass (2026-07-15, ticket #629): the 2025 Grammys
    // payoff. The two Nov 2024 nomination items set up the night; this item
    // resolves the arc (both nomination items already carry their own
    // "none converted" resolution lines). Sourcing note: direct page fetches
    // were proxy-blocked this session (every outlet host returned 403), so
    // each claim was cross-confirmed across multiple independent web-search
    // results; source URLs are real and search-verified. No photo — hotlinks
    // can't be liveness-checked this session.
    {
      year: 2025,
      month: 2,
      day: 2,
      category: 'business',
      title: 'Grammys night: six nominations, zero wins — and the moment everyone kept anyway',
      snippet:
        'TTPD goes 0-for-6 at the 2025 Grammys. The image that survives the night isn\'t a loss — it\'s Taylor presenting Best Country Album to a stunned Beyoncé for Cowboy Carter, one Album of the Year titan handing the genre trophy to the other.',
      sourceUrl: 'https://www.foxnews.com/entertainment/taylor-swift-leaves-grammys-no-awards-following-record-breaking-year',
      // Photo pass (#762 run 6, 2026-07-18): thumbnail = the Best Country Album
      // presentation photo added below.
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/2025/02/beyonce-grammy-awards-win-country-2025-billboard-1548.jpg?w=1024',
      moment: {
        context:
          'The Feb. 2, 2025 ceremony resolved all six nominations against her: Album of the Year went to Beyoncé\'s Cowboy Carter, "Not Like Us" swept Record of the Year, Song of the Year, and Best Music Video past "Fortnight," "Die With a Smile" took Best Pop Duo/Group Performance over "us.," and Sabrina Carpenter\'s Short n\' Sweet beat TTPD for Best Pop Vocal Album. Cameras kept finding her having a good night anyway — raising a glass when Kendrick Lamar\'s record swept, cheering when her tour opener Sabrina won.\n\nThe beat everyone kept came mid-show: Taylor presenting Best Country Album to a visibly stunned Beyoncé — her first-ever country win, from the artist whose own country-to-pop arc made her the category\'s most famous graduate. When Cowboy Carter later took Album of the Year, Taylor and Jay-Z clinked champagne glasses in the audience — a graceful coda to a night the internet had framed all week as a face-off.',
        sources: [
          {
            outlet: 'Fox News',
            url: 'https://www.foxnews.com/entertainment/taylor-swift-leaves-grammys-no-awards-following-record-breaking-year',
          },
          {
            outlet: 'NBC Connecticut',
            url: 'https://www.nbcconnecticut.com/entertainment/entertainment-news/beyonce-wins-grammy-best-country-album-taylor-swift/3489643/',
          },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1412913/grammys-2025-how-taylor-swift-and-jay-z-celebrated-beyonces-aoty-win-together',
          },
          // Provenance for the photos added in the #762 run-6 photo pass:
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/awards/beyonce-cowboy-carter-grammy-best-country-album-2025-1235890352/',
          },
          {
            outlet: 'WWD',
            url: 'https://wwd.com/pop-culture/celebrity-news/taylor-swift-red-dress-grammys-1236899833/',
          },
        ],
        // Photo pass (#762 run 6, 2026-07-18): both photos hotlinked from the
        // outlets' own CDNs, curl-verified HTTP 200 + image/jpeg, downloaded
        // and visually confirmed this session (the presentation moment and the
        // red Vivienne Westwood carpet look). No watermarks.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/2025/02/beyonce-grammy-awards-win-country-2025-billboard-1548.jpg?w=1024',
            credit: 'Sonja Flemming/CBS, via Billboard',
            caption:
              'The moment everyone kept: Taylor, in red Vivienne Westwood, just after presenting Best Country Album to a stunned Beyoncé — the first Black woman to win the category.',
            kind: 'primary',
            // Beyoncé with the trophy is center-right, Swift upper-left; faces live in the top third.
            focalPoint: '45% 25%',
          },
          {
            url: 'https://wwd.com/wp-content/uploads/2025/02/Taylor-Swift-Red-Vivienne-Westwood-Dress-Grammys-2025-1.jpg?w=1000',
            credit: 'Frazer Harrison/Getty Images, via WWD',
            caption:
              'The Red-era callback on the carpet: sparkling one-shoulder Vivienne Westwood with ruby chandelier earrings — worn to a night that ended 0-for-6.',
            kind: 'primary',
            // Tall portrait crop; her eyes sit in the upper third, face centered.
            focalPoint: '50% 30%',
          },
        ],
      },
    },

    // ── Migrated from content.ts RAW (consolidation stage 2a, 2026-07-19) ──
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "ttpd-album",
      year: 2024,
      month: 4,
      day: 19,
      category: "music",
      title: "The Tortured Poets Department",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-ttpd-1", label: "TTPD released", kind: "album" },
      snippet: "A literary, ink-stained double album — the most word-heavy record of her career.",
      hiddenClue: { clue: "A second half — “The Anthology” — appeared two hours after release.", payoff: "The surprise 15 extra tracks doubled the album and broke streaming records overnight." },
      relatedIds: [
          'moment:vault-ttpd-2-61-million-in-week-one-her-14th-no-1-tying-jay-z',
        'moment:vault-ttpd-ttpd-joins-the-eras-tour-as-female-rage-the-musical',
        'moment:vault-ttpd-the-european-leg-opens-in-paris-with-two-live-debuts',
        'moment:vault-ttpd-a-billion-streams-in-one-week',
        'moment:vault-ttpd-all-14-ttpd-monopolizes-the-top-of-the-hot-100',
        'moment:vault-ttpd-grammys-night-six-nominations-zero-wins-and-the-moment-every',
      ],
      moment: {
        context:
          'Announced from the Grammy stage on Feb. 4, 2024 — she revealed the April 19 release date while accepting Best Pop Vocal Album for Midnights and unveiled the cover on the podium — TTPD arrived as a surprise double album. Sixteen standard tracks dropped at midnight ET; two hours later, at 2 a.m. ET, fifteen more appeared as "The Tortured Poets Department: The Anthology," 31 songs in all.\n\nJack Antonoff and Aaron Dessner produced it alongside Taylor — the two collaborators who defined the folklore-through-Midnights run — splitting the work almost by half: Antonoff led the standard sixteen tracks, Dessner the fifteen-song Anthology, whose hushed folk cuts ("How Did It End?," "The Albatross," "The Black Dog") are largely his. It carries two features: Post Malone on the lead single "Fortnight" and Florence + the Machine on "Florida!!!." Four collectible deluxe editions each carried a different bonus track — "The Manuscript," "The Bolter," "The Albatross" and "The Black Dog" — before all four were folded into the Anthology.\n\nThe title is widely linked to a "Tortured Man Club" group chat Joe Alwyn shared with actors Paul Mescal and Andrew Scott (Alwyn confirmed the chat in a 2022 interview; Taylor has never named it as the source). It opened to 2.61 million first-week units in the U.S. — her 14th No. 1 on the Billboard 200, tying Jay-Z for the most chart-toppers among soloists — and was Spotify\'s most-streamed album in a single day. Reviews were admiring but split (Metacritic 76): critics praised the cathartic writing while calling the 31-track sprawl overlong.\n\nIt set records well past the first week: the first album in Spotify history to pass one billion streams in a single week, after also taking the single-day album and single-day song ("Fortnight") records on April 19 — and it monopolized all top 14 of the Billboard Hot 100, a first for any artist. Live, the album reshaped the Eras Tour: the May 9, 2024 European opener at Paris La Défense Arena debuted a new act Taylor nicknamed "Female Rage: The Musical," folding in seven TTPD songs — among them "Fortnight," "But Daddy I Love Him," "Down Bad," "So High School" and "I Can Do It With a Broken Heart" — and trimming older cuts to fit. Beyond that scripted act, TTPD tracks worked their way into the acoustic surprise slot through 2024 — "Paris" and "loml" were the first, at the Paris opener — and she held "So Long, London" back until the final Wembley night, debuting it solo on piano. Awards ran hot then cold: "Fortnight" won Video of the Year and Best Collaboration in a seven-VMA night in 2024, but at the 67th Grammys (Feb. 2, 2025) TTPD drew Taylor a record seventh Album of the Year nomination and a Best Pop Vocal Album nod and won neither — AOTY went to Beyoncé\'s Cowboy Carter, Best Pop Vocal Album to Sabrina Carpenter.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2024/music/news/taylor-swift-tracklist-the-tortured-poets-department-post-malone-florence-machine-1235898976/',
            source_title:
              "Taylor Swift Shares Tracklist for 'The Tortured Poets Department,' Featuring Post Malone and Florence + Machine",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-tortured-poets-department-debut-number-one-billboard-200-chart/',
            source_title: "Taylor Swift's 'The Tortured Poets Department' Debuts at No. 1 on Billboard 200 With 2.61 Million Units",
            publisher: 'Billboard',
            source_type: 'awards_database',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-hot-100-top-14-fortnight-post-malone-record/',
            source_title: "Taylor Swift Sets Record With All Top 14 of Hot 100, 'Fortnight' No. 1",
            publisher: 'Billboard',
            source_type: 'awards_database',
            accessed_at: '2026-07-21',
            reliability_score: 4,
          },
          {
            outlet: 'Metacritic',
            url: 'https://www.metacritic.com/music/the-tortured-poets-department/taylor-swift',
            source_title: 'The Tortured Poets Department by Taylor Swift Reviews',
            publisher: 'Metacritic',
            source_type: 'aggregator',
            accessed_at: '2026-07-21',
            reliability_score: 3,
          },
          {
            outlet: 'Newsweek',
            url: 'https://www.newsweek.com/entertainment-celebrity-news-joe-alwyn-tortured-man-club-group-chat-explained-andrew-scott-1903714',
            source_title: "Joe Alwyn's Tortured Man Club Group Chat Explained",
            publisher: 'Newsweek',
            source_type: 'reputable_press',
            accessed_at: '2026-07-21',
            reliability_score: 3,
          },
          {
            outlet: 'Spotify Newsroom',
            url: 'https://newsroom.spotify.com/2024-04-24/tortured-poets-department-taylor-swift-one-billion-record-streams/',
            source_title: "THE TORTURED POETS DEPARTMENT Becomes the First Album to Surpass One Billion Streams in a Single Week on Spotify",
            publisher: 'Spotify',
            source_type: 'official',
            accessed_at: '2026-07-24',
            reliability_score: 5,
            notes: 'First album to pass 1B Spotify streams in a week; single-day album (300M+) and single-day song ("Fortnight") records on April 19',
          },
          {
            outlet: 'TODAY',
            url: 'https://www.today.com/popculture/music/eras-tour-tortured-poets-department-set-list-rcna151509',
            source_title: "How Taylor Swift's 'Tortured Poets Department' changes the 'Eras Tour'",
            publisher: 'TODAY / NBCUniversal',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: '"Female rage: the musical" TTPD act debuted at the Paris opener (May 9, 2024)',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/awards/taylor-swift-wins-video-of-the-year-fortnight-vmas-2024-1235773569/',
            source_title: "Taylor Swift Wins Video of the Year for 'Fortnight' at 2024 VMAs",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: '"Fortnight" won Video of the Year and Best Collaboration; seven-win night tying Beyoncé at 30',
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/monicamercuri/2025/02/03/beyoncs-cowboy-carter-wins-album-of-the-year-at-the-2025-grammys/',
            source_title: "Beyoncé's 'Cowboy Carter' Wins Album Of The Year At The 2025 Grammys",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 4,
            notes: '67th Grammys: TTPD 0 wins; AOTY to Cowboy Carter, Best Pop Vocal Album to Sabrina Carpenter',
          },
          {
            outlet: 'NME',
            url: 'https://www.nme.com/news/music/taylor-swifts-the-tortured-poets-department-here-are-the-full-album-credits-3619931',
            source_title: "Taylor Swift's 'The Tortured Poets Department': here are the full album credits",
            publisher: 'NME',
            source_type: 'reputable_press',
            accessed_at: '2026-07-24',
            reliability_score: 3,
            notes: 'Producer split: Antonoff-led standard 16, Dessner-led Anthology 15',
          },
        ],
        // Photo pass #762 run 10 (2026-07-19): page had zero photos. Official
        // "Fortnight" MV id q3zqJs7JUCQ verified via YouTube oEmbed this
        // session ("Taylor Swift - Fortnight (feat. Post Malone) (Official
        // Music Video)", author @TaylorSwift); maxres1 frame (1280x720)
        // curl-verified 200 image/jpeg, downloaded and viewed — the
        // black-and-white asylum close-up, distinct from the maxresdefault
        // already used on the Fortnight single page. The Wikipedia album
        // cover render is only 300px (below the 400px floor), so the
        // lead-single frame carries the album's monochrome aesthetic instead.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/q3zqJs7JUCQ/maxres1.jpg',
            credit: 'Taylor Swift / Republic Records (official "Fortnight" video frame, YouTube)',
            caption:
              'The album’s black-and-white world, distilled: Taylor in the "Fortnight" video that arrived with TTPD on release night.',
            kind: 'primary',
            // Stark close-up; her eyes sit in the upper third, face centered.
            focalPoint: '47% 35%',
          },
          {
            // Salvaged 2026-07-19 from photo-enrichment PR #887, which was
            // otherwise superseded by a racing run: the album's OWN package
            // photography (Beth Garrabrant), which suits the album page
            // better than a music-video frame. Billboard's CDN, photographer
            // in the filename; re-verified 200 image/jpeg (774KB) this
            // session. The en-wiki cover render was rejected at 300px
            // (under the 400px floor).
            url: 'https://www.billboard.com/wp-content/uploads/2024/04/Taylor-Swift-cr-Beth-Garrabrant-2024-The-Albatross-billboard-1548.jpg',
            credit: 'Beth Garrabrant / Republic Records, via Billboard',
            caption:
              'The album package’s gray seaside portrait — the era’s black-and-white, ink-stained mood in one frame.',
            kind: 'primary',
            // Face upper-center-left against the flat gray sky.
            focalPoint: '45% 28%',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "ttpd-typewriter",
      year: 2024,
      month: 4,
      dateLabel: "Spring 2024",
      category: "fashion",
      title: "Ink, typewriters and monochrome",
      snippet: "The most restrained visual era: black, white, and typewritten confession.",
      moment: {
        context: "Grayscale styling and typewriter motifs frame the era as a literary confessional.",
        // Shop pass (2026-07-22): no single named piece -- a current
        // newspaper-print mesh tee, verified in stock, turning the era's
        // typewritten motif into a real garment.
        products: [
          {
            brand: 'AKIRA',
            item: 'Extra Extra Printed Mesh Tee',
            retailer: 'shopakira.com',
            url: 'https://shopakira.com/products/extra-extra-printed-mesh-tee',
            price: '$25.90',
            isAlternative: true,
            altNote: 'No single retail original is named -- this newspaper-print tee turns the typewritten motif into clothing, though its beige-multicolor print isn\'t the restrained monochrome styling.',
          },
        ],
      },
    },
  ],
};
