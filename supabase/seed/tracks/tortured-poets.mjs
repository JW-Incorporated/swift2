// Vault track guide — The Tortured Poets Department era (TTPD 2024 + The
// Anthology, surprise-dropped at 2 a.m. the same night). Original prose only —
// never lyrics; unconfirmed muse readings are labeled (this era is almost
// entirely fan-attributed and Swift has named no one). Provenance per
// docs/content/content-audit-2026-07-08.md §5 (URLs verified 2026-07-08).

const ACCESSED = '2026-07-08';
const wiki = (title, path, notes) => ({
  source_url: `https://en.wikipedia.org/wiki/${path}`,
  source_title: `${title} — Wikipedia`,
  publisher: 'Wikipedia',
  source_type: 'wiki',
  accessed_at: ACCESSED,
  reliability_score: 2,
  notes,
});
const ALBUM = wiki(
  'The Tortured Poets Department',
  'The_Tortured_Poets_Department',
  'album article: release facts, credits, and cited interviews',
);

const TRACKS = [
    {
      slug: 'fortnight',
      trackNumber: 1,
      trackTitle: 'Fortnight',
      youtubeId: 'q3zqJs7JUCQ', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff', 'Post Malone'],
      producers: ['Taylor Swift', 'Jack Antonoff', 'Louis Bell'],
      singleReleaseDate: '2024-04-19',
      note: 'The Post Malone lead single — suburban dystopia, a two-week love with permanent damage, and a typewriter-filled video cameoing Dead Poets Society alumni.',
      summary:
        'A medicated narrator next door to the one that got away: a fortnight of feeling everything, then lawns and small talk forever. The Ethan Hawke and Josh Charles video cameos made the tortured-poet joke text.',
      inspiration:
        'Swift called it an ode to a brief, ruinous love and picked it as the album’s thesis single; it debuted at Hot 100 No. 1.',
      themes: ['brief love, long damage', 'suburban numbness', 'what-ifs'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Fortnight_(song)',
      sources: [
        wiki('Fortnight (song)', 'Fortnight_(song)', 'song article: single release and video'),
        ALBUM,
        {
          source_url:
            'https://www.billboard.com/lists/taylor-swift-post-malone-fortnight-number-one-hot-100-second-week/',
          source_title:
            "Taylor Swift & Post Malone's 'Fortnight' Spends a Second Week at No. 1 on Billboard Hot 100",
          publisher: 'Billboard',
          source_type: 'chart_database',
          accessed_at: '2026-07-21',
          reliability_score: 4,
        },
        {
          source_url:
            'https://www.hollywoodreporter.com/music/music-news/taylor-swift-video-of-year-win-breaks-records-2024-mtv-vmas-1235997409/',
          source_title: 'Taylor Swift Wins Video of the Year at 2024 MTV VMAs, Breaking Multiple Records',
          publisher: 'The Hollywood Reporter',
          source_type: 'reputable_press',
          accessed_at: '2026-07-21',
          reliability_score: 4,
        },
      ],
      dossier: {
        whyItMatters: [
          "Fortnight is the album's thesis single and its front door: released April 19, 2024 as the lead single alongside the record, it debuted at No. 1 on the Billboard Hot 100 — Swift's 12th chart-topper and seventh No. 1 debut — and anchored her record top-14 opening week. Post Malone was Swift's stated first-choice feature for the album's opener, and the two trading the refrain 'I love you, it's ruining my life' set the record's tone of numbed, permanent damage: a fortnight of feeling everything, then lawns and small talk forever.",
          "Its reach was historic on two fronts. Within a day of release the song set Spotify's all-time single-day streaming record for a track (about 25.2 million global streams), later logged with Guinness World Records; months on, the Swift-directed video swept the 2024 MTV VMAs — Video of the Year, Best Collaboration, Best Direction, Best Editing and Song of the Summer — five of the seven trophies Swift took that night, the most any artist has won at a single VMAs ceremony."
        ],
        meaning: {
          confirmed: [
            "The Tortured Poets Department's lead single (April 19, 2024), written by Swift, Post Malone and Jack Antonoff — a muted, 1980s-leaning synth-pop ballad built on a pulsing eighth-note synth bass with Swift singing much of it near-monotone.",
            "After Swift brought him the track, Post Malone's vocals were recorded and produced by Louis Bell — Malone's longtime collaborator, credited here as vocal producer/engineer rather than a full producer — at Electric Feel Studios in Los Angeles, while Jack Antonoff programmed the track and played its guitars and synths; the song debuted atop the Hot 100 and spent two consecutive weeks at No. 1, and set Spotify's single-day streaming record for a song on release day.",
            "The Swift-directed video was shot in black-and-white by cinematographer Rodrigo Prieto and won Video of the Year and Best Direction at the 2024 MTV VMAs; the song was later nominated for Record of the Year and Song of the Year at the 2025 Grammys."
          ],
          supported: [
            "The video casts Swift as a Victorian-gothic asylum patient alongside Post Malone, with Dead Poets Society co-stars Ethan Hawke and Josh Charles as the doctors experimenting on her — the cameo that made the album's 'tortured poets' framing literal, over typewriters and an on-a-highway embrace before a tornado.",
            "Critics read the track as a deliberately understated opener — its stillness a foil to the album's louder grief — and it doubled as the album's chart battering ram, part of the top-14 Hot 100 debut."
          ],
          fanTheories: [
            "The narrator's most-quoted lines ('my husband is cheating,' 'I love you, it's ruining my life') drew heavy autobiographical reading, but Swift has framed the album as character-driven and named no subject for this song; the confessional reading is fan/press interpretation, not confirmed autobiography."
          ]
        },
        connections: [
          {
            relatedId: "song:the-tortured-poets-department",
            label: "The Tortured Poets Department",
            why: "Lead single and title track are the album's two theses — Fortnight opens with numbed suburban damage, the title track winks at the poet-couple mythology the whole record is named for."
          },
          {
            relatedId: "song:i-can-do-it-with-a-broken-heart",
            label: "I Can Do It With a Broken Heart",
            why: "The album's other single and its Eras Tour showpiece — where Fortnight is medicated stillness, Broken Heart performs the same devastation as relentless showgirl motion."
          },
          {
            relatedId: "moment:vault-ttpd-2-61-million-in-week-one-her-14th-no-1-tying-jay-z",
            label: "TTPD's 2.61-million debut",
            why: "Fortnight was the single that led the album into this record week — the biggest album week in nine years — and its own Spotify single-day record fed the streaming totals behind it."
          }
        ],
        live: [
          {
            date: "May 9, 2024",
            event: "The Eras Tour — Paris (Paris La Défense Arena)",
            note: "Folded into the tour's new TTPD segment from the European leg's opening night; Taylor performs it solo to Post Malone's recorded vocals, staged around a typewriter. No live performance with Post Malone has been documented."
          }
        ],
        sources: [
          {
            name: "Fortnight (song) — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Fortnight_(song)"
          },
          {
            name: "Billboard: Taylor Swift & Post Malone's 'Fortnight' Spends a Second Week at No. 1 on Billboard Hot 100",
            url: "https://www.billboard.com/lists/taylor-swift-post-malone-fortnight-number-one-hot-100-second-week/"
          },
          {
            name: "The Hollywood Reporter: Taylor Swift Wins Video of the Year at 2024 MTV VMAs, Breaking Multiple Records",
            url: "https://www.hollywoodreporter.com/music/music-news/taylor-swift-video-of-year-win-breaks-records-2024-mtv-vmas-1235997409/"
          },
          {
            name: "Variety: Taylor Swift 'Fortnight' Music Video — Post Malone Breaks Out of the Psych Ward",
            url: "https://variety.com/2024/music/news/taylor-swift-fortnight-music-video-1235975675/"
          }
        ]
      },
    },
    {
      slug: 'the-tortured-poets-department',
      trackNumber: 2,
      trackTitle: 'The Tortured Poets Department',
      youtubeId: 'RQMz4JDbtmI', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The title track — a spare Antonoff production that name-checks Dylan Thomas, Patti Smith, Lucy Dacus and, most memed of all, Charlie Puth — gently deflates its own poet mythology.',
      summary:
        'A relationship between two people addicted to their own melodrama: she punctures the artist mythos even while cataloging it. Never released as a single, it still peaked at No. 4 on the Billboard Hot 100 during the album’s top-14 takeover, and its "Charlie Puth should be a bigger artist" couplet became the record’s most-quoted line.',
      inspiration:
        'Dylan Thomas and Patti Smith are named in the lyric to set the couple against the Chelsea Hotel’s romantic-artist legends. Two days after release, Smith posted photos of herself reading Thomas and wrote she "was moved to be mentioned in the company of the great Welsh poet Dylan Thomas. Thank you Taylor."',
      themes: ['self-aware melodrama', 'artist personas vs. reality', 'in-jokes as intimacy', 'literary/rock mythology deflated'],
      fanLore:
        'The "Lucy" name-check was confirmed by Lucy Dacus in March 2025 ("she actually texted me and asked for my approval"); "Jack" is widely read as Jack Antonoff, though he has not confirmed it.',
      easterEggs:
        'The Charlie Puth name-drop nudged Puth to finally release his shelved single "Hero" in May 2024. The song was first played live as a surprise song in Lisbon on May 25, 2024 — Swift told the crowd it was "the first time I’m ever playing this one live."',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [
        ALBUM,
        {
          source_url:
            'https://variety.com/2024/music/news/charlie-puth-taylor-swift-the-tortured-poets-department-hero-1235974552/',
          source_title: "Charlie Puth Responds to Taylor Swift's 'Tortured Poets' Mention With New Song 'Hero'",
          publisher: 'Variety',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
        },
        {
          source_url:
            'https://www.today.com/popculture/music/patti-smith-dylan-thomas-tortured-poets-department-taylor-swift-rcna148511',
          source_title: "Patti Smith thanks Taylor Swift for the 'Tortured Poets' album mention",
          publisher: 'TODAY / NBCUniversal',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
        },
        {
          source_url:
            'https://www.rollingstone.com/music/music-news/taylor-swift-tortured-poets-department-hot-100-debut-1235011913/',
          source_title: "Taylor Swift's 'The Tortured Poets Department' Dominates the Hot 100",
          publisher: 'Rolling Stone',
          source_type: 'chart_database',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Title track peaked No. 4 on the Hot 100; part of the top-14 sweep',
        },
        {
          source_url:
            'https://www.rollingstone.com/music/music-news/taylor-swift-debut-the-tortured-poets-department-title-track-lisbon-1235028103/',
          source_title: "Taylor Swift Debuts 'The Tortured Poets Department' Title Track in Lisbon",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'First live performance, Lisbon, May 25, 2024 (surprise song)',
        },
        {
          source_url:
            'https://variety.com/2025/music/news/lucy-dacus-tortured-poets-department-taylor-swift-lyric-1236351456/',
          source_title: "Lucy Dacus Confirms Taylor Swift's 'Tortured Poets Department' Lyric Is About Her",
          publisher: 'Variety',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'my-boy-only-breaks-his-favorite-toys',
      trackNumber: 3,
      trackTitle: 'My Boy Only Breaks His Favorite Toys',
      youtubeId: 'wRKXAAV6jh4', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'Solo-written heartbreak in toy-box metaphor — being the doll he smashed precisely because she was the favorite.',
      summary:
        'She rationalizes the damage as evidence of being loved: only the cherished toys get broken — the saddest kind of cope, self-diagnosed mid-song. Solo-written by Swift and produced with Jack Antonoff, it is a synth-pop track with new-wave marching drums (Swift on piano; Antonoff programming drums, bass, guitar and Moog/Korg/Juno synths). It debuted and peaked at No. 6 on both the Hot 100 and the Billboard Global 200 the week The Tortured Poets Department held the entire top 14, and reached the top 10 in Canada (6), Australia (6), New Zealand (7) and Singapore (7) — later certified Platinum in Australia and Gold in New Zealand.',
      inspiration:
        'Swift named no subject; reviewers split on it — Beats Per Minute (John Wohlmacher) praised how she stretches her vocal range and Billboard (Jason Lipshutz) called it a "big, booming" song that "deserves the stadium treatment," while Slant\'s Jonathan Keefe and the Telegraph\'s Neil McCormick pegged it as a radio-ready hook and Pitchfork and Exclaim! found the toy-box metaphor a fast-dulling formula.',
      themes: ['rationalizing mistreatment', 'being discarded', 'cope and its collapse'],
      easterEggs:
        'Played live only twice on the 2024 Eras Tour, both as piano surprise songs — solo in Paris (May 10, 2024, later released as a "Live From Paris" recording) and mashed with "Coney Island" in London (Aug. 17, 2024).',
      sourceUrl: 'https://en.wikipedia.org/wiki/My_Boy_Only_Breaks_His_Favorite_Toys',
      sources: [
        wiki(
          'My Boy Only Breaks His Favorite Toys',
          'My_Boy_Only_Breaks_His_Favorite_Toys',
          'song article: composition, charts, production, reception, live history',
        ),
        {
          source_url:
            'https://www.billboard.com/lists/taylor-swift-hot-100-top-14-fortnight-post-malone-record/',
          source_title: 'Taylor Swift Sets Record With All Top 14 of Hot 100, "Fortnight" No. 1',
          publisher: 'Billboard',
          source_type: 'chart_database',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'No. 6 debut/peak on the Hot 100 as part of the record top-14 week',
        },
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "Track 3 is one of the album's cleanest character studies of self-deluding cope: the narrator reframes being discarded as proof she was the favorite — only the cherished toys get broken. Solo-written by Swift and produced with Jack Antonoff, it dresses that sad logic in bright synth-pop and new-wave marching drums (Swift on piano; Antonoff programming drums, bass, guitar and Moog, Korg M1 and Roland Juno-60 synths), the polish deliberately at odds with the wound underneath.",
          "It was also a genuine hit. It debuted and peaked at No. 6 on both the Billboard Hot 100 and the Global 200 the week The Tortured Poets Department became the first album ever to hold the entire top 14, and it reached the top 10 in Canada (6), Australia (6), New Zealand (7) and Singapore (7), later certified Platinum in Australia and Gold in New Zealand. Critics split on it — Beats Per Minute's John Wohlmacher praised how Swift stretches her vocal range and Billboard's Jason Lipshutz called it a 'big, booming' song that 'deserves the stadium treatment,' while Pitchfork and Exclaim! heard the toy-box metaphor as a fast-dulling formula."
        ],
        meaning: {
          confirmed: [
            "Track 3 on The Tortured Poets Department (April 19, 2024), written solely by Taylor Swift and produced by Swift with Jack Antonoff; recorded at Conway Recording Studios (Los Angeles) and Electric Lady Studios (New York), mixed by Serban Ghenea and mastered by Randy Merrill.",
            "It debuted and peaked at No. 6 on the Billboard Hot 100 and the Global 200 during the album's record top-14 week, reached the top 10 in Canada, Australia, New Zealand and Singapore, and was certified Platinum in Australia and Gold in New Zealand."
          ],
          supported: [
            "The production — bright synth-pop with new-wave marching drums set against a resigned lyric — is the contrast reviewers point to; several named Swift's vocal performance a highlight while others found the central metaphor overworked.",
            "It reads as the album's sharpest study of rationalizing mistreatment: the narrator diagnosing her own cope in real time, then watching it collapse."
          ],
          fanTheories: [
            "Swift has named no subject and the album is framed as character-driven; any real-life reading of the 'favorite toy' is fan/press interpretation, not confirmed fact."
          ]
        },
        connections: [
          {
            relatedId: "song:down-bad",
            label: "Down Bad",
            why: "The next track and its mirror: both sit in the immediate wreckage of being dropped by an idealized love — My Boy rationalizes the breakage, Down Bad grieves the re-entry."
          },
          {
            relatedId: "song:i-can-fix-him-no-really-i-can",
            label: "I Can Fix Him (No Really I Can)",
            why: "Two sides of one delusion about a damaging partner — I Can Fix Him insists the project is salvageable, My Boy insists the damage was proof of love."
          },
          {
            relatedId: "song:loml",
            label: "loml",
            why: "Both reckon with being discarded by someone once idealized; loml names the loss outright while My Boy files it under a self-flattering excuse."
          }
        ],
        live: [
          {
            date: "May 10, 2024",
            event: "The Eras Tour — Paris (Paris La Défense Arena)",
            note: "Surprise-song live debut, performed solo at the piano; later issued as a 'Live From Paris' recording."
          },
          {
            date: "August 17, 2024",
            event: "The Eras Tour — London (Wembley Stadium)",
            note: "Its only other performance — a piano surprise-song mashup with evermore's 'Coney Island.'"
          }
        ],
        sources: [
          {
            name: "My Boy Only Breaks His Favorite Toys — Wikipedia",
            url: "https://en.wikipedia.org/wiki/My_Boy_Only_Breaks_His_Favorite_Toys"
          },
          {
            name: "Billboard: Taylor Swift Sets Record With All Top 14 of Hot 100, 'Fortnight' No. 1",
            url: "https://www.billboard.com/lists/taylor-swift-hot-100-top-14-fortnight-post-malone-record/"
          }
        ]
      },
    },
    {
      slug: 'down-bad',
      trackNumber: 4,
      trackTitle: 'Down Bad',
      youtubeId: 'EVbtjaWXQVg', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isSingle: true,
      note: 'Love as alien abduction: dazzled, experimented on, then dropped back in a field — a love-bomb hangover set to pillowy synth-pop.',
      summary:
        'A cosmic fling ends and re-entry is the injury: ordinary life feels like the wrong planet. Gen-Z idiom in the title, UFO imagery in the verses, grief in everything else. It debuted and peaked at No. 2 on the Billboard Hot 100 and Global 200 — held off the top only by “Fortnight” — inside the record week Swift held the entire top 14, and became a fixed number in the revamped Eras Tour set from May 2024. See the dossier for the full production, chart and reception record.',
      inspiration:
        'Swift explained the conceit in Amazon Music commentary: a love-bombing — “where someone rocks your world and dazzles you and then just kind of abandons you” — recast as being abducted by aliens and dropped back into ordinary life. She named no real-life subject.',
      themes: ['post-love withdrawal', 'alienation', 'wanting to be taken back'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Down_Bad_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Down Bad (Taylor Swift song)',
          'Down_Bad_(Taylor_Swift_song)',
          'song article: composition, charts, certifications, reception, live history',
        ),
        ALBUM,
        {
          source_url:
            'https://www.billboard.com/lists/taylor-swift-hot-100-top-14-fortnight-post-malone-record/',
          source_title: 'Taylor Swift Sets Record With All Top 14 of the Hot 100, "Fortnight" No. 1',
          publisher: 'Billboard',
          source_type: 'chart_database',
          accessed_at: '2026-07-28',
          reliability_score: 4,
          notes: 'No. 2 Hot 100 debut/peak, behind "Fortnight," inside the top-14 record week',
        },
      ],
      dossier: {
        whyItMatters: [
          "'Down Bad' is the album's proof that its most bruised feelings could still make pure pop: Swift and Jack Antonoff dress a love-bomb hangover in pillowy synths and muted drums, and the Gen-Z slang of the title collides with a science-fiction conceit. Swift spelled the metaphor out herself in Amazon Music commentary — the song is about 'being love bombed, where someone rocks your world and dazzles you and then just kind of abandons you,' likened to being abducted by aliens and dropped back into ordinary life.",
          "Commercially it was one of TTPD's biggest tracks. It debuted and peaked at No. 2 on both the Billboard Hot 100 and the Global 200 — held off the top only by lead single 'Fortnight' — inside the record week when Swift became the first artist to hold the entire top 14 of the Hot 100. It reached the top five in the UK (4), Canada (2), Australia (2) and New Zealand (3), and was later certified 2x Platinum in Australia, 3x Platinum in Brazil, Platinum in New Zealand and Gold in the UK. It was never released as a standalone single with its own music video — a lyric video accompanied it — yet it became a fixed part of the revamped Eras Tour set from May 2024.",
        ],
        meaning: {
          confirmed: [
            "Track 4 on The Tortured Poets Department (April 19, 2024), written and produced by Taylor Swift and Jack Antonoff. Antonoff played Juno, M1, Mellotron, piano, drums and percussion and handled programming, with Mikey Freedom Hart on Mellotron, DX7 and M1, Sean Hutchinson on percussion, and Evan Smith and Zem Audu on saxophone; it was recorded at Conway Recording (Los Angeles) and Electric Lady (New York), mixed by Serban Ghenea and mastered by Randy Merrill.",
            "It debuted and peaked at No. 2 on the Billboard Hot 100 and the Global 200 during the album's top-14 week, and was certified 2x Platinum in Australia, 3x Platinum in Brazil, Platinum in New Zealand and Gold in the UK.",
            "Swift added it to the Eras Tour's new TTPD segment from the European leg's opening night (Paris, May 2024), performing it on a rotating metal block beneath a projected UFO — a fixed set number, not a one-off surprise song.",
          ],
          supported: [
            "The song's signature is its collision of registers — flip slang over a 'cosmic love' abduction narrative — and critics split on whether it landed. Billboard's Jason Lipshutz ranked it sixth of the album's 31 tracks and called it 'one of the album's purest pop pleasures,' and Pitchfork's Olivia Horn credited the 'juxtaposition between its banal hook and its description of cosmic love'; Beats Per Minute's John Wohlmacher faulted its 'metaphor-chains' and the Associated Press's Maria Sherman found it 'mawkish.'",
            "It carries some of the album's heaviest profanity — the repeated hook built on the word most cut for radio — part of why it stayed an album track rather than a serviced radio single.",
          ],
          fanTheories: [
            "Swift named no real-life subject; the alien-abduction framing is her own stated metaphor for love-bombing, not a coded biography, and any autobiographical reading is fan/press interpretation.",
          ],
        },
        connections: [
          {
            relatedId: "song:fortnight",
            label: "Fortnight",
            why: "The No. 1 that kept 'Down Bad' at No. 2 — the two opened the album at the top two spots of the Hot 100, and both sit in the same numbed-aftermath register (Fortnight medicated, Down Bad grieving the re-entry).",
          },
          {
            relatedId: "song:my-boy-only-breaks-his-favorite-toys",
            label: "My Boy Only Breaks His Favorite Toys",
            why: "The album's back-to-back wreckage pair (tracks 3 and 4): 'My Boy' rationalizes being broken as proof of love, 'Down Bad' grieves the crash after the high — My Boy's own dossier names this song its mirror.",
          },
          {
            relatedId: "moment:vault-ttpd-2-61-million-in-week-one-her-14th-no-1-tying-jay-z",
            label: "TTPD's 2.61-million debut",
            why: "The record week 'Down Bad' charted inside — the top-14 Hot 100 sweep behind the biggest album week in nine years, where this track landed at No. 2.",
          },
        ],
        live: [
          {
            date: "May 9, 2024",
            event: "The Eras Tour — Paris (Paris La Défense Arena)",
            note: "Added to the revamped TTPD segment from the European leg's opening night and kept in the set thereafter; staged on a rotating metal block beneath a projected UFO.",
          },
        ],
        voices: [
          {
            who: "Jason Lipshutz",
            context: "Billboard",
            note: "Ranked it sixth of the album's 31 tracks — 'one of the album's purest pop pleasures.'",
          },
          {
            who: "Olivia Horn",
            context: "Pitchfork",
            note: "Credited the juxtaposition between its 'banal hook' and its 'cosmic love' description.",
          },
        ],
        sources: [
          { name: "Down Bad (Taylor Swift song) — Wikipedia", url: "https://en.wikipedia.org/wiki/Down_Bad_(Taylor_Swift_song)" },
          { name: "Billboard: Taylor Swift Sets Record With All Top 14 of the Hot 100, 'Fortnight' No. 1", url: "https://www.billboard.com/lists/taylor-swift-hot-100-top-14-fortnight-post-malone-record/" },
          { name: "Billboard: Taylor Swift Charts 32 Songs on the Hot 100 in One Week", url: "https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/" },
          { name: "Billboard: The Tortured Poets Department — All 31 Tracks Ranked", url: "https://www.billboard.com/lists/taylor-swift-the-tortured-poets-department-tracks-ranked/" },
        ],
      },
    },
    {
      slug: 'so-long-london',
      trackNumber: 5,
      trackTitle: 'So Long, London',
      youtubeId: 'CCUr2pNJft4', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'Track 5, as always the wound: a farewell to a city and the six-year love that made it home — the grown-up, exhausted answer to London Boy.',
      summary:
        'A eulogy that opens on Swift’s own multitracked voices stacked into a choral hymn, then quickens — a bass-drum pulse running at roughly double the vocal’s tempo — as a long partnership dies not in a blaze but of quiet: she stopped being willing to trade her aliveness for someone’s low simmer. It debuted at No. 5 on the Hot 100 inside TTPD’s record top-14 opening week, and critics singled it out — Billboard called it so raw that by its close “Swift sounds like she’s been slightly healed from the act of catharsis.” The London of it all made the subject reading universal (unconfirmed, as ever).',
      inspiration:
        'Track 5 is Swift’s standing “most vulnerable” slot (All Too Well, my tears ricochet, tolerate it), and the press treated this as a deliberate continuation of that canon. Fans and press read it as a six-year relationship’s post-mortem given the geography and timeline; Swift has said only that the album chronicles a period she needed to close, and has never spoken to this song specifically. She live-debuted it solo on piano at the Aug. 20, 2024 Wembley finale — the tour’s last European night — and reportedly flipped the closing line from “you’ll find someone” to “I’ll find someone.”',
      themes: ['leaving a life, not just a person', 'exhausted grief', 'cities as exes'],
      fanLore:
        'Fan reading (universal, unconfirmed): the six-year London chapter — the direct sequel fans queue against London Boy.',
      sourceUrl: 'https://en.wikipedia.org/wiki/So_Long%2C_London',
      sources: [
        wiki(
          'So Long, London',
          'So_Long%2C_London',
          'song article: track-5 placement, No. 5 Hot 100 debut, tempo construction',
        ),
        {
          source_url:
            'https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/',
          source_title: 'Taylor Swift Charts 32 Songs on the Hot 100 in a Single Week',
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-21',
          reliability_score: 4,
          notes: '"So Long, London" debuted at No. 5, part of the record top-14',
        },
        {
          source_url:
            'https://www.billboard.com/lists/taylor-swift-the-tortured-poets-department-tracks-ranked/my-boy-only-breaks-his-favorite-toys/',
          source_title: 'The Tortured Poets Department: All 31 Tracks Ranked (Billboard)',
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-21',
          reliability_score: 4,
          notes: 'Jason Lipshutz on the song\'s "raw honesty" and catharsis',
        },
        {
          source_url:
            'https://variety.com/2024/music/news/taylor-swift-florence-jack-antonoff-live-debut-florida-so-long-london-1236112940/',
          source_title: 'Taylor Swift Live-Debuts "So Long, London" at Wembley',
          publisher: 'Variety',
          source_type: 'reputable_press',
          accessed_at: '2026-07-21',
          reliability_score: 4,
          notes: 'First live performance, Aug. 20, 2024, Wembley — solo piano',
        },
        {
          source_url:
            'https://www.washingtonpost.com/entertainment/music/2024/04/18/taylor-swift-track-5-so-long-london/',
          source_title: "Why Taylor Swift's track five 'So Long, London' holds extra meaning",
          publisher: 'The Washington Post',
          source_type: 'reputable_press',
          accessed_at: '2026-07-21',
          reliability_score: 4,
          notes: 'The track-5 "most vulnerable" tradition, applied to this song',
        },
        {
          source_url: 'https://www.capitalfm.com/news/music/taylor-swift-so-long-london-lyrics-eras-tour/',
          source_title: "Taylor Swift's 'So Long, London' lyric change at the Eras Tour",
          publisher: 'Capital FM',
          source_type: 'reputable_press',
          accessed_at: '2026-07-21',
          reliability_score: 3,
          notes: 'The live-debut outro change, "you\'ll find someone" → "I\'ll find someone"',
        },
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "Track five is Swift's standing 'most vulnerable' slot — All Too Well, my tears ricochet, tolerate it — and So Long, London extends that canon by eulogizing not a person but a whole life built in one city. The construction is the tell: the a-cappella opening is Swift's own voice multitracked into a choral hymn, and the arrangement sets a fast bass-drum pulse against a slow vocal, so the grief quietly accelerates under a calm surface rather than exploding.",
          "It also stands as one of the album's critical high points. It debuted at No. 5 on the Billboard Hot 100 during The Tortured Poets Department's record top-14 opening week, and reviewers singled it out even where the album's reception was mixed — Billboard called it so raw that by its close Swift 'sounds like she's been slightly healed from the act of catharsis.' She held it back from the stage until the tour's last European night, live-debuting it solo on piano at Wembley on Aug. 20, 2024."
        ],
        meaning: {
          confirmed: [
            "Track 5 on The Tortured Poets Department (April 19, 2024), written and produced by Swift with Aaron Dessner.",
            "It debuted at No. 5 on the Billboard Hot 100 as part of the album's record-setting top-14 opening week, and was first performed live on Aug. 20, 2024 at Wembley Stadium — the Eras Tour's final European show — as a solo piano rendition."
          ],
          supported: [
            "Critics repeatedly named it an album highlight, praising the eulogy structure and the vocal arrangement; the stacked-vocal choral intro and a bass-drum pulse running at roughly double the vocal's tempo are the production choices fans and musicologists point to for its 'breathless acceleration.'",
            "The press treated the placement as a deliberate continuation of Swift's track-5 tradition of her most emotionally intense songs."
          ],
          fanTheories: [
            "It is read near-universally as a long relationship's post-mortem given the song's geography and timeline, and as the grown-up, exhausted answer to Lover's 'London Boy' — a sequel fans queue the two songs against. Swift has named no subject and has not spoken to this track specifically."
          ]
        },
        connections: [
          {
            relatedId: "song:london-boy",
            label: "London Boy",
            why: "The before-and-after of the same city: London Boy is giddy new love touring the map of a place, So Long, London is the exhausted farewell to the life that place became."
          },
          {
            relatedId: "song:how-did-it-end",
            label: "How Did It End?",
            why: "Two angles on one ending — So Long, London delivers the eulogy from inside the grief, How Did It End? watches the gossips demand the cause of death."
          },
          {
            relatedId: "song:loml",
            label: "loml",
            why: "Both map the collapse of a years-long partnership; loml curdles 'love of my life' into 'loss of my life,' the same wound So Long, London reads as a city one has to leave."
          },
          {
            relatedId: "song:the-black-dog",
            label: "The Black Dog",
            why: "The other half of the album's London break-up cluster: The Black Dog tracks the ex in real time through a shared-location app, the raw counterpart to So Long, London's formal goodbye."
          }
        ],
        sources: [
          {
            name: "So Long, London — Wikipedia",
            url: "https://en.wikipedia.org/wiki/So_Long,_London"
          },
          {
            name: "Billboard: Taylor Swift Charts 32 Songs on the Hot 100 in a Single Week",
            url: "https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/"
          },
          {
            name: "Billboard: The Tortured Poets Department — All Tracks Ranked",
            url: "https://www.billboard.com/lists/taylor-swift-the-tortured-poets-department-tracks-ranked/my-boy-only-breaks-his-favorite-toys/"
          },
          {
            name: "Variety: Taylor Swift Live-Debuts 'So Long, London' at Wembley",
            url: "https://variety.com/2024/music/news/taylor-swift-florence-jack-antonoff-live-debut-florida-so-long-london-1236112940/"
          },
          {
            name: "The Washington Post: Why Taylor Swift's track five 'So Long, London' holds extra meaning",
            url: "https://www.washingtonpost.com/entertainment/music/2024/04/18/taylor-swift-track-5-so-long-london/"
          }
        ]
      },
    },
    {
      slug: 'but-daddy-i-love-him',
      trackNumber: 6,
      trackTitle: 'But Daddy I Love Him',
      youtubeId: 'U2W173hRfyA', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner', 'Jack Antonoff'],
      note: 'The country-sized rebellion aimed not at a father but at the fandom itself — the judgmental chorus gets called sanctimonious to its face, with one gleeful fake-out pregnancy line.',
      summary:
        'She dates someone the internet hates and torches the moralizers who staged interventions over it: her life is not a group project. The wild-boy subject is read as the 2023 Healy controversy (unconfirmed); the scolds in the song are documented — they posted.',
      inspiration:
        'Widely read against the documented 2023 fan open-letter campaign about a brief relationship; Swift never names him, but the song’s target is clearly the pile-on, not the boy.',
      themes: ['autonomy', 'fandom parasociality', 'choosing your own mistakes'],
      fanLore:
        'Fan reading (unconfirmed): the Healy chapter; the anti-fan-jury message needed no decoding.',
      sourceUrl: 'https://en.wikipedia.org/wiki/But_Daddy_I_Love_Him',
      sources: [
        wiki(
          'But Daddy I Love Him',
          'But_Daddy_I_Love_Him',
          'song article: reception and readings',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "A country-scale kiss-off aimed not at a lover but at the fandom: the 'Sarahs and Hannahs in their Sunday best' and 'judgmental creeps' who staged a public moral intervention over her dating life. Critics read the target as the pile-on, not the man, and connect it to the documented 2023 fan open-letter campaign — public conduct that is fair game; the 'wild boy' subject itself stays a labeled, unconfirmed fan reading.",
          "It became a critical centerpiece and a live one. Billboard ranked it the album's second-best song and called it 'the centerpiece,' and it opened the Eras Tour's new 'Female Rage: The Musical' act from the Paris premiere on May 9, 2024. It debuted and peaked at No. 7 on the Hot 100, one of the fourteen songs in Swift's record top-14 sweep."
        ],
        meaning: {
          confirmed: [
            "Track 6 on The Tortured Poets Department (April 19, 2024), written by Swift and Aaron Dessner and produced with Dessner and Jack Antonoff; a roughly 5:40 fingerpicked-folk build that swells into anthemic choruses, its country lean drawing Fearless/Speak Now comparisons.",
            "Debuted and peaked at No. 7 on the Billboard Hot 100 and the Global 200 — one of the fourteen songs in Swift's record top-14 sweep the week TTPD released. Certified Platinum in Australia and Gold in the UK and New Zealand; no US RIAA certification is documented.",
            "Added to the Eras Tour's 'Female Rage: The Musical' act, which it opened, from the Paris premiere on May 9, 2024; a 24-hour acoustic remix was released digitally on May 8, 2024. It lived in the main set, never as a standalone acoustic surprise song."
          ],
          supported: [
            "The most-clipped moment is the fake-out pregnancy line ('I'm having his baby / No I'm not, but you should see your faces'), widely read as Swift baiting the fans who police her private life and then snapping the trap shut — one of TTPD's biggest online moments.",
            "Critics named it an album highlight and a genre swerve back toward her country-pop roots, placing it on year-end best-songs lists at NME and the Los Angeles Times."
          ],
          fanTheories: [
            "The title echoes Ariel's 'But Daddy, I love him!' from The Little Mermaid — a widely-made critical reading Swift has not confirmed. A resurfaced 2008 interview shows her shouting the same line at her own father, but she told that story about writing 'Love Story,' not this song."
          ]
        },
        connections: [
          {
            relatedId: "moment:vault-ttpd-all-14-ttpd-monopolizes-the-top-of-the-hot-100",
            label: "All 14: TTPD monopolizes the top of the Hot 100",
            why: "This track sat at No. 7 inside the record week it belongs to — the first time any artist held the entire Hot 100 top 14."
          },
          {
            relatedId: "song:florida",
            label: "Florida!!!",
            why: "Two sides of the same chapter: 'But Daddy' torches the scolds policing the romance, 'Florida!!!' is the fantasy of vanishing from the pile-on entirely."
          }
        ],
        sources: [
          { name: "But Daddy I Love Him — Wikipedia", url: "https://en.wikipedia.org/wiki/But_Daddy_I_Love_Him" },
          { name: "Billboard: Sorry Ariel, Taylor Swift Revealed the Real 'But Daddy I Love Him' Inspiration in a 2008 Interview", url: "https://www.billboard.com/music/pop/taylor-swift-but-daddy-i-love-him-inspiration-2008-interview-ariel-argument-1235701183/" },
          { name: "Rolling Stone: Taylor Swift Celebrates 'Tortured Poets' Induction Into Eras Tour Set List", url: "https://www.rollingstone.com/music/music-news/taylor-swift-tortured-poets-eras-tour-set-list-post-1235019481/" }
        ]
      },
    },
    {
      slug: 'fresh-out-the-slammer',
      trackNumber: 7,
      trackTitle: 'Fresh Out the Slammer',
      youtubeId: '0EKbEP2L32M', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The rebound with a prison metaphor — first call after release goes to the old flame who waited.',
      summary:
        'A long relationship recast as a sentence served: now sprung, she runs straight to someone from before the walls went up. The giddy escape reads knowingly temporary. A tremolo-guitar, spring-reverb opening gives way near 2:25 to a tempo-dropping outro and its “I did my time” refrain; it debuted and peaked at No. 11 on the Hot 100 in the album’s top-14 week.',
      inspiration: null,
      themes: ['relationships as confinement', 'rebounds', 'running to the past'],
      easterEggs:
        'An Eras Tour surprise song twice — Lisbon (May 24, 2024) on piano with Midnights’ “High Infidelity,” and Munich (July 27, 2024) on guitar with 1989’s “You Are in Love.”',
      sourceUrl: 'https://en.wikipedia.org/wiki/Fresh_Out_the_Slammer',
      sources: [
        wiki('Fresh Out the Slammer', 'Fresh_Out_the_Slammer', 'song article: composition, chart, live history, reception'),
        ALBUM,
        {
          source_url: 'https://www.billboard.com/lists/taylor-swift-hot-100-top-14-fortnight-post-malone-record/',
          source_title: 'Taylor Swift Makes Chart History With Top 14 of the Hot 100',
          publisher: 'Billboard',
          source_type: 'chart_database',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'No. 11 Hot 100 debut/peak, week of May 4, 2024',
        },
      ],
      dossier: {
        whyItMatters: [
          "The album's rebound song, built as an extended prison metaphor: a long relationship recast as a sentence served, and the first phone call after release goes not forward but back, to someone from before the walls went up. Critics near-unanimously read it as a rebound — the giddy freedom is knowingly temporary.",
          "Sonically it is one of the standard album's most distinctive Antonoff productions: a twangy, tremolo-guitar and spring-reverb opening that several writers heard as a widescreen Americana, then a structural break near the 2:25 mark where the outro drops tempo and shifts its rhythmic programming for the repeated 'I did my time' refrain."
        ],
        meaning: {
          confirmed: [
            "Track 7 on The Tortured Poets Department (April 19, 2024), written and produced by Taylor Swift with Jack Antonoff; tracked across Conway (LA), Electric Lady (NY) and Esplanade (New Orleans), with Antonoff playing guitars, synths and drums.",
            "It debuted and peaked at No. 11 on the Billboard Hot 100 (chart dated May 4, 2024), part of Swift's record-setting top-14 monopoly, and reached No. 15 on the Billboard Global 200; certified Silver in the UK.",
            "An Eras Tour surprise song twice: live-debuted on piano in Lisbon (May 24, 2024) mashed with Midnights' 'High Infidelity,' and played on guitar in Munich (July 27, 2024) mashed with 1989's 'You Are in Love.'"
          ],
          supported: [
            "The 'rebound' framing is the critical consensus (Wikipedia summarizes several reviewers reaching it independently). Rob Sheffield (Rolling Stone) called it a 'sneakily durable gauze-rocker' with heist-flick guitar twang; Annie Zaleski likened its dusty, twangy texture to evermore's 'Cowboy Like Me.' Billboard's Jason Lipshutz ranked it 23rd of the 31 tracks, 'connective tissue.' Dissenters included Lindsay Zoladz (New York Times), who found the prison imagery overworked.",
            "The tremolo-guitar intro and the programmed string section in the second verse are the arrangement details critics single out; the late tempo drop is described as the song loosening its own giddy momentum."
          ],
          fanTheories: [
            "The line about swirling someone into all of her poems is read by critics (e.g. John Wohlmacher, Beats Per Minute) as a hint that the same person appears across earlier songs — an interpretation, not a stated fact; the lyric names no one, and the 'who waited / first call' reading is fan-and-critic inference only. Swift has said nothing on record about the song."
          ]
        },
        connections: [
          {
            relatedId: "song:cowboy-like-me",
            label: "Cowboy Like Me",
            why: "The evermore twang critics reached for by name: both ride a dusty, tremolo-lit Western texture, a duel-at-dawn romance under wide skies."
          },
          {
            relatedId: "song:high-infidelity",
            label: "High Infidelity",
            why: "Swift's own live pairing — she fused the two on piano for the Lisbon debut, two songs about the exact moment a relationship's loyalty quietly gives way."
          }
        ],
        sources: [
          { name: "Fresh Out the Slammer — Wikipedia", url: "https://en.wikipedia.org/wiki/Fresh_Out_the_Slammer" },
          { name: "Billboard: Taylor Swift Charts All Top 14 Hot 100 Spots", url: "https://www.billboard.com/lists/taylor-swift-hot-100-top-14-fortnight-post-malone-record/" },
          { name: "Variety: Every Surprise Song Taylor Swift Has Played on the Eras Tour", url: "https://variety.com/2024/music/news/taylor-swift-eras-tour-surprise-songs-list-1235578714/" }
        ]
      },
    },
    {
      slug: 'florida',
      trackNumber: 8,
      trackTitle: 'Florida!!!',
      youtubeId: 'uEssK8o3jKg', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Florence Welch'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The Florence + the Machine team-up: Florida as national witness-protection program, three exclamation points mandatory.',
      summary:
        'Two women flee their crime scenes (romantic and otherwise) to the one state where nobody asks questions — a gothic-country power ballad Swift produced with Jack Antonoff (Antonoff on guitars, bass, cello, piano and synths; Welch adding drums, piano and percussion) that pushes insistent verses into thunderclap-drum refrains around Welch’s choir-like voice. It debuted and peaked at No. 8 on the Billboard Hot 100 and the Global 200 — Florence + the Machine’s first-ever top 10 on either chart — and the two performed it together only four times, live-debuting it at the Aug. 20, 2024 Wembley finale (Welch rising from beneath the stage) and reprising it on all three Miami nights (Oct. 18–20, 2024), the only shows Florence joined the tour.',
      inspiration:
        'Confirmed premise: Swift told iHeartRadio the song runs on true-crime logic — people who commit a crime and vanish to Florida to reinvent themselves and blend in — mapped onto fleeing heartbreak. Welch told British Vogue that Swift approached her with “a concept and a story,” which Welch called her favorite way to start a song.',
      themes: ['escape', 'reinvention', 'gothic humor'],
      easterEggs:
        'The lyric plants real Florida geography (Destin) and Southern-gothic imagery — palm trees, a girl who mysteriously vanished — into its escape-artist fantasy.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Florida!!!',
      sources: [
        wiki('Florida!!!', 'Florida!!!', 'song article: Welch collaboration, premise, production, No. 8 peak, live history'),
        {
          source_url:
            'https://www.billboard.com/lists/taylor-swift-the-tortured-poets-department-tracks-ranked/my-boy-only-breaks-his-favorite-toys/',
          source_title: 'The Tortured Poets Department: All 31 Tracks Ranked (Billboard)',
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Jason Lipshutz ranked “Florida!!!” 3rd of the 31 tracks',
        },
        {
          source_url:
            'https://variety.com/2024/music/news/taylor-swift-florence-jack-antonoff-live-debut-florida-so-long-london-1236112940/',
          source_title: 'Taylor Swift Gives “So Long, London” and “Florida!!!” Eras Tour Debuts at Final Wembley Show',
          publisher: 'Variety',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Florence Welch live-debuts “Florida!!!” with Swift at Wembley, Aug. 20, 2024',
        },
        {
          source_url:
            'https://www.rollingstone.com/music/music-news/taylor-swift-florence-florida-duet-miami-show-1235137985/',
          source_title: 'Taylor Swift Brings Out Florence Welch for “Florida!!!” in Miami',
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Florence joins the three Miami nights (Oct. 18–20, 2024)',
        },
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "Florida!!! is the album's one true duet and its gothic set piece: Swift and Florence Welch — who co-wrote it — turn the state into a national witness-protection program, the place fugitives and the heartbroken alike go to disappear and start over. Produced by Swift with Jack Antonoff (Antonoff on guitars, bass, cello, piano and synths; Welch adding drums, piano and percussion), it pushes insistent, programmed verses into thunderclap-drum refrains of power chords around Welch's choir-like voice — the boldest, most physical sound on The Tortured Poets Department.",
          "It gave Florence + the Machine their biggest US chart moment. It debuted and peaked at No. 8 on both the Billboard Hot 100 and the Global 200 — the band's first-ever top 10 on either — and Billboard's Jason Lipshutz ranked it third of the album's 31 tracks while Pitchfork's Shaad D'Souza called it the record's boldest and most energetic song. Its live life was rare and event-sized: Swift and Welch performed it together only four times, the only shows Florence joined the tour."
        ],
        meaning: {
          confirmed: [
            "Track 8 on The Tortured Poets Department (April 19, 2024), written by Taylor Swift and Florence Welch and produced by Swift with Jack Antonoff.",
            "It debuted and peaked at No. 8 on the Billboard Hot 100 and the Global 200 — Florence + the Machine's first top-10 entry on either chart.",
            "Swift told iHeartRadio the premise came from true-crime logic — people who commit a crime and flee to Florida to reinvent themselves and blend in — applied to escaping heartbreak."
          ],
          supported: [
            "Welch told British Vogue that Swift brought her 'a concept and a story,' which Welch called her favorite way to begin a song; critics read the track as the album's most cinematic, Southern-gothic swing.",
            "The arrangement — insistent programming under crashing, 'thunderclap' drums and a choir-like vocal build — is the production choice reviewers single out, though a minority (Stereogum, Paste) found the Bible-belt imagery half-baked."
          ],
          fanTheories: [
            "The escape-artist narrator is a character, not stated autobiography; Swift has tied the idea to true-crime storytelling rather than any real person, and the only concrete geography is the named Florida town (Destin)."
          ]
        },
        connections: [
          {
            relatedId: "moment:vault-ttpd-florida-a-dateline-inspired-duet-with-florence-welch",
            label: "Florida!!! — the Dateline-inspired duet with Florence Welch",
            why: "The song's own event page: how the true-crime premise, the credits and the Swift–Welch collaboration came together off the record."
          },
          {
            relatedId: "moment:vault-ttpd-the-tour-comes-home-three-nights-in-miami-with-florence-welc",
            label: "The tour comes home: three nights in Miami with Florence Welch",
            why: "Where the studio-only duet became a live fixture — Welch walked out for Florida!!! on all three Miami nights that opened the tour's final leg."
          }
        ],
        live: [
          {
            date: "August 20, 2024",
            event: "The Eras Tour — London (Wembley Stadium), European-leg finale",
            note: "Live debut with Florence Welch, who rose from beneath the stage; the tour's final European night."
          },
          {
            date: "October 18–20, 2024",
            event: "The Eras Tour — Miami Gardens (Hard Rock Stadium)",
            note: "Welch reprised the duet on all three nights that opened the tour's final leg — the only other shows she joined."
          }
        ],
        sources: [
          {
            name: "Florida!!! — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Florida!!!"
          },
          {
            name: "Billboard: The Tortured Poets Department — All 31 Tracks Ranked",
            url: "https://www.billboard.com/lists/taylor-swift-the-tortured-poets-department-tracks-ranked/my-boy-only-breaks-his-favorite-toys/"
          },
          {
            name: "Variety: Taylor Swift Gives 'So Long, London' and 'Florida!!!' Eras Tour Debuts at Final Wembley Show",
            url: "https://variety.com/2024/music/news/taylor-swift-florence-jack-antonoff-live-debut-florida-so-long-london-1236112940/"
          },
          {
            name: "Rolling Stone: Taylor Swift Brings Out Florence Welch for 'Florida!!!' in Miami",
            url: "https://www.rollingstone.com/music/music-news/taylor-swift-florence-florida-duet-miami-show-1235137985/"
          }
        ]
      },
    },
    {
      slug: 'guilty-as-sin',
      trackNumber: 9,
      trackTitle: 'Guilty as Sin?',
      youtubeId: 'OOYlWF6V8t8', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'Fantasizing inside a fading relationship and putting the fantasy itself on trial — with a confirmed nod to The Blue Nile in the first verse.',
      summary:
        'Nothing happened except in her head — so why does it feel like evidence? Desire as thought-crime, argued before a jury of her own upbringing. Its 1990s-tinged, guitar-and-live-drums soft rock (Antonoff on drums, bass, guitars and Juno) stands apart from the album’s synth palette, and the Blue Nile’s “The Downtown Lights,” name-checked in the first verse, drew a roughly 1,400% streaming spike within four days. It debuted and peaked at No. 10 on the Hot 100 during TTPD’s record top-14 week (No. 11 Global 200; Gold in the UK, Platinum in Australia and New Zealand), and critics singled it out — Vanity Fair called it the album’s “emotional apex.”',
      inspiration:
        'Recorded at Conway (LA), Electric Lady (NY) and Prime Recording (Nashville). The Blue Nile reference is in-text (a band tied to the reported muse’s known tastes, per fan forensics — that layer unconfirmed).',
      themes: ['desire as guilt', 'emotional infidelity', 'religious framing of want'],
      fanLore:
        'Fan reading (unconfirmed): the music-taste breadcrumb trail linking the verse’s band reference to a specific muse.',
      easterEggs:
        'Played live three times, all as 2024 Eras Tour surprise songs: the solo acoustic-guitar debut in Stockholm (May 18), an acoustic mashup with "Untouchable" in Amsterdam (July 4), and a piano mashup with "mirrorball" in Miami (Oct 20).',
      sourceUrl: 'https://en.wikipedia.org/wiki/Guilty_as_Sin%3F',
      sources: [
        wiki('Guilty as Sin?', 'Guilty_as_Sin%3F', 'song article: lyric references, production, reception'),
        ALBUM,
        {
          source_url:
            'https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/',
          source_title: "Taylor Swift Charts 32 Songs on Hot 100, Including Every 'Tortured Poets' Track",
          publisher: 'Billboard',
          source_type: 'chart_database',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'No. 10 Hot 100 peak within the record top-14 week',
        },
        {
          source_url: 'https://www.officialcharts.com/songs/taylor-swift-guilty-as-sin/',
          source_title: 'Guilty as Sin? — Official Charts',
          publisher: 'Official Charts Company',
          source_type: 'chart_database',
          accessed_at: '2026-07-24',
          reliability_score: 5,
          notes: 'UK charting record',
        },
        {
          source_url:
            'https://ca.rollingstone.com/en/music/taylor-swift-debuts-guilty-as-sin-and-triple-1989-mashup-for-89th-eras-tour-show/',
          source_title: "Taylor Swift Debuts 'Guilty as Sin?' at 89th Eras Tour Show",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: 'Live debut May 18, 2024, Stockholm — solo on acoustic guitar',
        },
        {
          source_url: 'https://www.setlist.fm/setlist/taylor-swift/2024/johan-cruijff-arena-amsterdam-netherlands-33aa40fd.html',
          source_title: 'Taylor Swift Setlist at Johan Cruijff ArenA, Amsterdam — July 4, 2024',
          publisher: 'setlist.fm',
          source_type: 'reference',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: 'Amsterdam surprise-song mashup with "Untouchable"',
        },
      ],
      dossier: {
        whyItMatters: [
          "A guitar-forward, 1990s-tinged soft-rock cut that puts a fantasy on trial: desire treated as a thought-crime, argued through courtroom and Catholic-guilt imagery. Written and produced by Swift with Jack Antonoff (who programmed it and played drums, bass, guitars and Juno), it stands apart from the album's synth palette and was widely singled out — Vanity Fair called it the album's 'emotional apex.'",
          "It debuted and peaked at No. 10 on the Hot 100 in TTPD's record top-14 week and was performed live three times on the 2024 Eras Tour. Its first verse name-checks Scottish band The Blue Nile, whose 'The Downtown Lights' saw a roughly 1,400% streaming spike within four days of the album's release."
        ],
        meaning: {
          confirmed: [
            "Track 9 on The Tortured Poets Department (April 19, 2024), written and produced by Swift with Jack Antonoff; recorded at Conway Recording Studios (Los Angeles), Electric Lady Studios (New York) and Prime Recording (Nashville).",
            "It debuted and peaked at No. 10 on the Billboard Hot 100 and No. 11 on the Global 200 during the record top-14 week, also reaching the top 10-15 in Australia, Canada and New Zealand; certified Gold in the UK and Platinum in Australia and New Zealand.",
            "An Eras Tour surprise song performed three times, all in 2024: the solo acoustic-guitar debut in Stockholm (May 18), an acoustic mashup with 'Untouchable' in Amsterdam (July 4), and a piano mashup with 'mirrorball' in Miami (Oct. 20)."
          ],
          supported: [
            "Critics named it a standout — Vanity Fair ('emotional apex'), The Times ('straight from the Fleetwood Mac school'), the Irish Independent ('one of the loveliest vocals Swift has ever committed to tape') — with the Associated Press a notable dissenter.",
            "They read it as desire-as-thought-crime: a fantasy about someone other than her partner put 'on trial' through religious and courtroom imagery ('roll the stone away,' 'crucify me anyway'), arguing that nothing physical happened yet the guilt still feels like evidence."
          ],
          fanTheories: [
            "The 'muse's known tastes' reading of the Blue Nile reference — tying the shout-out to a specific person — is unconfirmed fan forensics; the checkable facts are the in-lyric reference and the streaming spike. No explanation for the title's question mark is documented."
          ]
        },
        connections: [
          {
            relatedId: "song:fresh-out-the-slammer",
            label: "Fresh Out the Slammer",
            why: "The tightest sibling — two halves of one forbidden-desire arc: 'Guilty as Sin?' is the interior, guilt-ridden fantasy, 'Fresh Out the Slammer' the escape to the old flame."
          },
          {
            relatedId: "song:but-daddy-i-love-him",
            label: "But Daddy I Love Him",
            why: "The same wanting-what-you-shouldn't cluster, aimed outward at the scolds policing her choices rather than inward at the fantasy."
          },
          {
            relatedId: "song:i-can-fix-him-no-really-i-can",
            label: "I Can Fix Him (No Really I Can)",
            why: "The other side of the desire-you-can't-justify thread — a savior-complex delusion beside 'Guilty as Sin?'s' thought-crime."
          }
        ],
        live: [
          {
            date: "May 18, 2024",
            event: "The Eras Tour — Stockholm (Friends Arena)",
            note: "Solo acoustic-guitar surprise-song live debut."
          },
          {
            date: "July 4, 2024",
            event: "The Eras Tour — Amsterdam (Johan Cruijff ArenA)",
            note: "Acoustic surprise-song mashup with 'Untouchable.'"
          },
          {
            date: "October 20, 2024",
            event: "The Eras Tour — Miami Gardens (Hard Rock Stadium)",
            note: "Piano surprise-song mashup with 'mirrorball.'"
          }
        ],
        sources: [
          { name: "Guilty as Sin? — Wikipedia", url: "https://en.wikipedia.org/wiki/Guilty_as_Sin%3F" },
          { name: "Billboard: Taylor Swift Charts 32 Songs on the Hot 100 in a Single Week", url: "https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/" },
          { name: "Official Charts: Guilty as Sin?", url: "https://www.officialcharts.com/songs/taylor-swift-guilty-as-sin/" },
          { name: "Rolling Stone: Taylor Swift Debuts 'Guilty as Sin?' at 89th Eras Tour Show", url: "https://ca.rollingstone.com/en/music/taylor-swift-debuts-guilty-as-sin-and-triple-1989-mashup-for-89th-eras-tour-show/" },
          { name: "setlist.fm: Amsterdam, July 4, 2024", url: "https://www.setlist.fm/setlist/taylor-swift/2024/johan-cruijff-arena-amsterdam-netherlands-33aa40fd.html" }
        ]
      },
    },
    {
      slug: 'whos-afraid-of-little-old-me',
      trackNumber: 10,
      trackTitle: "Who's Afraid of Little Old Me?",
      youtubeId: 'vOZFiX6hDXQ', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The solo-written asylum aria — raised in a circus, sharpened by the crowd, and now performing the monster they insisted she was.',
      summary:
        'Fame as a haunted-house attraction she was locked into as a teenager: if they wanted feral, she can do feral. The album’s biggest vocal and its most explicit indictment of celebrity-making machinery.',
      inspiration: null,
      themes: ['fame as cage', 'weaponized reputation', 'rage as performance'],
      sourceUrl: "https://en.wikipedia.org/wiki/Who's_Afraid_of_Little_Old_Me%3F",
      sources: [
        wiki(
          "Who's Afraid of Little Old Me?",
          "Who's_Afraid_of_Little_Old_Me%3F",
          'song article: reception',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "The album's biggest vocal and its most explicit thesis on fame. Swift solo-wrote it on piano out of, in her own Amazon Music commentary, a bitter feeling about the things 'we do to our artists as a society' — 'we love to watch artists in pain.' The Southern-Gothic chamber-pop build climbs from conversational verses to a screamed chorus, casting fame as a circus cage she was locked into as a teenager.",
          "Critics made it a standout of the 31: The Hollywood Reporter ranked it 4th, Variety put it among 2024's best and called it 'wonderfully bizarre,' and The Guardian praised 'some of Swift's most cutting lyrics.' It debuted and peaked at No. 9 on both the Hot 100 and the Global 200 during the record top-14 sweep, and became a live centerpiece of the 'Female Rage' act."
        ],
        meaning: {
          confirmed: [
            "Track 10 on The Tortured Poets Department (April 19, 2024), solely written by Swift and produced with Jack Antonoff; a roughly 5:34 Southern-Gothic build recorded across Conway Recording (Los Angeles), Electric Lady (New York) and Esplanade Studios (New Orleans).",
            "Debuted and peaked at No. 9 on the Billboard Hot 100 and the Global 200 — one of the fourteen songs in Swift's record top-14 monopoly that week. Certified 2x Platinum in Brazil, Platinum in Australia and Gold in the UK and New Zealand; no US RIAA certification is documented.",
            "One of the seven TTPD songs added to the Eras Tour's 'Female Rage: The Musical' act at the Paris opener on May 9, 2024; performed on a moving glass platform in the main set rather than the acoustic surprise slot, and featured in the 2024 'Final Show' Disney+ special (it postdated the 2023 concert film)."
          ],
          supported: [
            "In her own commentary Swift framed the song around society's sense of ownership over public figures, making the circus/asylum/cage imagery an author-endorsed metaphor for celebrity-making machinery and public judgment. Its clearest tie to the 2016 reputation-era backlash is textual — the 'filled my cell with snakes' line reprises the 'Snakegate' iconography she reclaimed on reputation.",
            "Widely called the album's biggest or loudest vocal — though studio reception was in fact divided, with some critics (the BBC's Mark Savage, the NYT's Jon Pareles) finding the sound heavy or 'suffocated' rather than a triumph — and live she routinely capped the final high note with a shriek, repeated in the same spot across tour dates. No sourced note-name analysis exists, so the force of the belt is what's documented, not a specific pitch."
          ],
          fanTheories: [
            "Critics — not Swift — hear an 'evil twin' of 'Mirrorball' and read the title as a nod to Edward Albee's Who's Afraid of Virginia Woolf?; exactly whom the 'you' indicts (critics, industry or public) is left to the listener.",
            "Thematically it sits in Swift's weaponized-reputation / 'madwoman' lineage; critics group that rage cluster around 'Cassandra' (live-mashed with 'mad woman' and 'I Did Something Bad'), so the tie is a thematic one rather than a critic-asserted grouping of this specific track."
          ]
        },
        connections: [
          {
            relatedId: "song:i-can-do-it-with-a-broken-heart",
            label: "I Can Do It With a Broken Heart",
            why: "The two halves of the album's fame-machine argument: 'Who's Afraid' rages at the audience that demands the performance, 'I Can Do It' shows her giving it anyway, breaking down inside while the show goes on."
          },
          {
            relatedId: "song:clara-bow",
            label: "Clara Bow",
            why: "Both anatomize celebrity as a machine that builds and then devours its women — Clara Bow traces the lineage of used-up stars that 'Who's Afraid' snarls back against."
          },
          {
            relatedId: "song:cassandra",
            label: "Cassandra",
            why: "The Anthology's other portrait of a woman branded dangerous and disbelieved — the rage cluster critics anchor on 'Cassandra' is the same weaponized-reputation vein 'Who's Afraid' snarls in."
          }
        ],
        sources: [
          { name: "Who's Afraid of Little Old Me? — Wikipedia", url: "https://en.wikipedia.org/wiki/Who%27s_Afraid_of_Little_Old_Me%3F" },
          { name: "Songfacts: Who's Afraid Of Little Old Me?", url: "https://www.songfacts.com/facts/taylor-swift/whos-afraid-of-little-old-me" },
          { name: "Capital FM: Seven Tortured Poets songs added to the Eras Tour setlist", url: "https://www.capitalfm.com/news/music/taylor-swift-new-eras-tour-setlist-tortured-poets-songs/" },
          { name: "Billboard: Cassandra, mad woman and I Did Something Bad — the rage lineage", url: "https://ca.billboard.com/music/music-news/taylor-swift-cassandra-mad-woman-i-did-something-bad-eras-tour-1235837621/" }
        ]
      },
    },
    {
      slug: 'i-can-fix-him-no-really-i-can',
      trackNumber: 11,
      trackTitle: 'I Can Fix Him (No Really I Can)',
      youtubeId: 'OKWfv-x2rdU', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The fixer-upper delusion with a saloon-door twang — a 2:36 country-Western pastiche whose last line, "Woah, maybe I can’t," pulls the rug out from under the whole premise.',
      summary:
        'She parades a "project" of a man before a horrified audience and insists she alone sees the potential — until the closing concession undoes it. A sparse Western/Americana pastiche of tremolo guitars and drum machine (Antonoff on Moog and Mellotron); critics read it as self-aware satire and one of the album’s sonic highlights, and Billboard ranked it 18th of the 31 tracks. It debuted and peaked at No. 20 on the Hot 100 as every TTPD track charted at once.',
      inspiration: null,
      themes: ['savior complex', 'bad-boy delusion', 'the punchline confession', 'country-Western pastiche'],
      easterEggs:
        'Played live only twice on the 2024 Eras Tour, both as acoustic-guitar surprise mashups — with "Sparks Fly" in Madrid (May 29) and "I Can See You" in Warsaw (Aug 2).',
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Can_Fix_Him_(No_Really_I_Can)',
      sources: [
        wiki(
          'I Can Fix Him (No Really I Can)',
          'I_Can_Fix_Him_(No_Really_I_Can)',
          'song article: composition, credits, reception, live history',
        ),
        ALBUM,
        {
          source_url: 'https://www.officialcharts.com/songs/taylor-swift-i-can-fix-him-no-really-i-can/',
          source_title: 'I Can Fix Him (No Really I Can) — Official Charts',
          publisher: 'Official Charts Company',
          source_type: 'chart_database',
          accessed_at: '2026-07-24',
          reliability_score: 5,
          notes: 'UK charting; corroborates the simultaneous TTPD chart entry',
        },
        {
          source_url:
            'https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/',
          source_title: "Taylor Swift Charts 32 Songs on Hot 100, Including Every 'Tortured Poets' Track",
          publisher: 'Billboard',
          source_type: 'chart_database',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'No. 20 Hot 100 peak, week of release',
        },
      ],
    },
    {
      slug: 'loml',
      trackNumber: 12,
      trackTitle: 'loml',
      youtubeId: 'GZ4vaTRn0HU', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The piano dirge that redefines its own acronym by the final line — love of my life curdling into loss of my life.',
      summary:
        'A returned lover promises everything with confetti-cannon sincerity, then vanishes on schedule: she inventories the con and files him under the acronym’s crueler expansion. A spare, evermore-adjacent Aaron Dessner piano ballad that builds quietly to the final-line turn, it peaked at No. 12 on the Hot 100 inside TTPD’s record top-14 sweep (No. 16 Global 200; UK No. 20). Critics made it a standout — The Hollywood Reporter called it the album’s "most emotional track," with Pitchfork the notable dissent.',
      inspiration:
        'Dessner production (piano, keys, synth bass), recorded at his Long Pond studio; critics group it with "So Long, London" and "How Did It End?" as the album’s Dessner heartbreak spine.',
      themes: ['love as con job', 'the biggest loss', 'acronyms as knives'],
      easterEggs:
        'Live-debuted as the tour’s first-ever TTPD surprise song — solo on piano at Paris Night 1 (May 9, 2024), later issued as a "Live From Paris" recording — and returned only twice, as piano mashups with "Don\'t You (Forget About Me)" in Munich (July 28, 2024) and "White Horse" in Miami (Oct. 19, 2024).',
      sourceUrl: 'https://en.wikipedia.org/wiki/Loml',
      sources: [
        wiki('loml', 'Loml', 'song article: acronym twist, credits, charts, live, reception'),
        ALBUM,
        {
          source_url: 'https://www.officialcharts.com/songs/taylor-swift-loml/',
          source_title: 'loml — Official Charts',
          publisher: 'Official Charts Company',
          source_type: 'chart_database',
          accessed_at: '2026-07-24',
          reliability_score: 5,
          notes: 'UK peak No. 20',
        },
        {
          source_url: 'https://www.billboard.com/lists/taylor-swift-hot-100-top-14-fortnight-post-malone-record/',
          source_title: 'Taylor Swift Sets Record With All Top 14 of Hot 100',
          publisher: 'Billboard',
          source_type: 'chart_database',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'No. 12 Hot 100 debut within the record top-14 week',
        },
      ],
      dossier: {
        whyItMatters: [
          "The piano dirge that redefines its own acronym in the final line — 'love of my life' curdling into 'loss of my life.' A spare, evermore-adjacent Aaron Dessner ballad, it peaked at No. 12 on the Hot 100 inside TTPD's record top-14 sweep and was a critical standout: The Hollywood Reporter called it the album's 'most emotional track.'",
          "It live-debuted as the tour's first-ever TTPD surprise song and returned only twice; critics group it with 'So Long, London' and 'How Did It End?' as the album's Dessner heartbreak spine."
        ],
        meaning: {
          confirmed: [
            "Track 12 on The Tortured Poets Department (April 19, 2024), written and produced by Swift with Aaron Dessner (piano, keys, synth bass), recorded at his Long Pond studio and mixed by Serban Ghenea.",
            "It peaked at No. 12 on the Billboard Hot 100 (inside the record top-14 sweep) and No. 16 on the Global 200, reached No. 20 on the UK Official chart, and is certified Platinum in Australia, Gold in New Zealand and Silver in the UK.",
            "Live-debuted solo on piano at Paris Night 1 (May 9, 2024) — the Eras Tour's first TTPD surprise song, later issued as a 'Live From Paris' recording — and returned only twice, as piano mashups with Simple Minds' 'Don't You (Forget About Me)' in Munich (July 28, 2024) and 'White Horse' in Miami (Oct. 19, 2024)."
          ],
          supported: [
            "Named reviewers singled it out for its vocal ache and the acronym inversion — The Hollywood Reporter ('most emotional track'), Business Insider (the only TTPD song that made her cry), USA Today (an ache 'raked over with nails') — with Pitchfork the notable dissent that it fell emotionally flat. Variety's Chris Willman ranked it No. 21 of Swift's 75 best songs.",
            "The love-of-my-life-to-loss-of-my-life inversion of the internet shorthand 'loml' is the device critics point to as the song's engine."
          ],
          fanTheories: [
            "The song is widely read autobiographically, but Swift has named no subject and offered no gloss beyond the lyric's own device; any specific real-person reading is unconfirmed fan/press inference."
          ]
        },
        connections: [
          {
            relatedId: "song:so-long-london",
            label: "So Long, London",
            why: "Part of the album's Dessner heartbreak spine — the abandonment autopsy to loml's inventory of a vanished love."
          },
          {
            relatedId: "song:how-did-it-end",
            label: "How Did It End?",
            why: "The third of the trio critics group together: the breakup post-mortem beside loml's cataloguing of the con."
          }
        ],
        live: [
          {
            date: "May 9, 2024",
            event: "The Eras Tour — Paris (Paris La Défense Arena)",
            note: "Solo-piano surprise-song live debut; the tour's first TTPD surprise song, later issued as 'Live From Paris.'"
          },
          {
            date: "July 28, 2024",
            event: "The Eras Tour — Munich (Olympiastadion)",
            note: "Piano surprise-song mashup with Simple Minds' 'Don't You (Forget About Me).'"
          },
          {
            date: "October 19, 2024",
            event: "The Eras Tour — Miami Gardens (Hard Rock Stadium)",
            note: "Piano surprise-song mashup with 'White Horse.'"
          }
        ],
        sources: [
          { name: "loml — Wikipedia", url: "https://en.wikipedia.org/wiki/Loml" },
          { name: "Official Charts: loml", url: "https://www.officialcharts.com/songs/taylor-swift-loml/" },
          { name: "Billboard: Taylor Swift Sets Record With All Top 14 of Hot 100", url: "https://www.billboard.com/lists/taylor-swift-hot-100-top-14-fortnight-post-malone-record/" },
          { name: "Variety: Taylor Swift's Best Songs, Ranked (Chris Willman)", url: "https://variety.com/lists/best-taylor-swift-songs-ranked/" },
          { name: "Billboard: The Tortured Poets Department, All 31 Tracks Ranked", url: "https://www.billboard.com/lists/taylor-swift-the-tortured-poets-department-tracks-ranked/" }
        ]
      },
    },
    {
      slug: 'i-can-do-it-with-a-broken-heart',
      trackNumber: 13,
      trackTitle: 'I Can Do It with a Broken Heart',
      youtubeId: 'Sl6en1NPTYM', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isSingle: true,
      note: 'The confirmed Eras Tour confession — performing the biggest show on earth nightly while privately wrecked, its counted "1, 2, 3, 4" intro widely heard as a stage count-off.',
      summary:
        'Explicitly about smiling through the 2023 tour dates while her life fell apart offstage: the depression-era show-must-go-on anthem, ending with the giddy, unhinged brag that she pulled it off.',
      inspiration:
        'Confirmed autobiography: the song describes performing the Eras Tour mid-heartbreak. Fans read the counted intro as a sampled in-ear stage count-off, though no production source documents that.',
      themes: ['functioning depression', 'the show must go on', 'professionalism as armor'],
      easterEggs:
        'Eras Tour audiences screaming the more-tour-dates line back at her became the meta-joke of the 2024 legs. Released as the album’s second single (July 2, 2024), it peaked at No. 3 on the Hot 100 and became TTPD’s longest-charting track (31 weeks); its Swift-directed behind-the-scenes video premiered at the final Wembley show (Aug. 20, 2024). USA Today named it the best song of 2024.',
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Can_Do_It_with_a_Broken_Heart',
      sources: [
        wiki(
          'I Can Do It with a Broken Heart',
          'I_Can_Do_It_with_a_Broken_Heart',
          'song article: single, chart, video, reception',
        ),
        ALBUM,
        {
          source_url: 'https://variety.com/2024/music/news/taylor-swift-i-can-do-it-with-a-broken-heart-music-video-behind-the-scenes-1236113079/',
          source_title: "Taylor Swift Drops Behind-the-Scenes 'I Can Do It With a Broken Heart' Video",
          publisher: 'Variety',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Self-directed video premiered Aug. 20, 2024 at the final Wembley Eras Tour show',
        },
      ],
      dossier: {
        whyItMatters: [
          "The album's confirmed autobiography and its second single: a synth-pop anthem about smiling through the Eras Tour night after night while her private life fell apart, with a counted stage cue ticking under the production and a closing spoken run — crying a lot but 'so productive, it's an art' — that became the record's most-quoted, most-memed lyric.",
          "It doubled as an Eras Tour set piece: added to the tour's TTPD act with a silent-film-style pantomime of a performer dragged back onstage, and given a Swift-directed behind-the-scenes video premiered at the tour's final London night."
        ],
        meaning: {
          confirmed: [
            "Track 13 on The Tortured Poets Department (April 19, 2024), written and produced by Taylor Swift with Jack Antonoff (mixed by Serban Ghenea with Bryce Bordone; recorded by Laura Sisk — Antonoff's regular team); released as the album's second and final single on July 2, 2024.",
            "It debuted and peaked at No. 3 on the Billboard Hot 100 (chart dated May 4, 2024) inside Swift's record top-14 week, and became TTPD's longest-charting track at 31 weeks; No. 5 on the Global 200, No. 8 in the UK, and certified Platinum by the BPI.",
            "The counted 'one, two, three, four' intro is a studio recreation of a live in-ear count-off, not a raw stage capture (in the video, dancer Kameron Saunders performs the count). Critics filed the track as electropop / dance-pop with 1980s synth textures, around 130 BPM.",
            "Its Swift-directed music video — a compilation of Eras Tour rehearsal and behind-the-scenes footage — premiered Aug. 20, 2024 at her final Wembley show and then on YouTube. Live, it anchored the tour's added TTPD segment, staged as a Golden-Age-Hollywood pantomime of exhaustion."
          ],
          supported: [
            "The show-must-go-on framing was read as the song's emotional core. Variety called it among the album's most talked-about and replayed tracks; Billboard ranked it 8th of 31, 'rollicking, snarky and strikingly funny'; Stereogum's Tom Breihan praised its energy. Pitchfork's Olivia Horn was cooler on the production. USA Today named it the best song of 2024.",
            "CNBC reported the 'I cry a lot but I am so productive, it's an art' line resonated widely with working women, spawning tens of thousands of TikToks within a week of release."
          ],
          fanTheories: [
            "The autobiography is on record — it is explicitly about performing the tour mid-heartbreak — but any attribution of the offstage heartbreak to a specific person is fan-and-press inference, which Swift has not confirmed."
          ]
        },
        connections: [
          {
            relatedId: "moment:vault-ttpd-the-eras-tour-takes-its-final-bow-in-vancouver",
            label: "The Eras Tour's final bow",
            why: "The song's literal subject is the tour it was performed on; the Vancouver finale is where that two-year 'do it with a broken heart' marathon actually ended."
          },
          {
            relatedId: "song:so-long-london",
            label: "So Long, London",
            why: "The breakup this song performs through: 'So Long, London' is the eulogy for the relationship whose collapse 'I Can Do It with a Broken Heart' says she smiled over onstage (a thematic pairing)."
          }
        ],
        sources: [
          { name: "I Can Do It with a Broken Heart — Wikipedia", url: "https://en.wikipedia.org/wiki/I_Can_Do_It_with_a_Broken_Heart" },
          { name: "Variety: Taylor Swift's Behind-the-Scenes 'I Can Do It With a Broken Heart' Video", url: "https://variety.com/2024/music/news/taylor-swift-i-can-do-it-with-a-broken-heart-music-video-behind-the-scenes-1236113079/" },
          { name: "CNBC: A Taylor Swift lyric is resonating with working women", url: "https://www.cnbc.com/2024/04/25/taylor-swift-tortured-poets-department-lyric-hits-with-working-women.html" }
        ]
      },
    },
    {
      slug: 'the-smallest-man-who-ever-lived',
      trackNumber: 14,
      trackTitle: 'The Smallest Man Who Ever Lived',
      youtubeId: 'Atdzfj8LcuY', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The album’s scorched-earth peak — a quiet build to the most contemptuous bridge she has ever recorded, asking whether the whole romance was an op.',
      summary:
        'Someone vanished without explanation and she drafts the charges: coward, operative, hometown embarrassment. The fury is that she still does not know which betrayal it was.',
      inspiration:
        'Fan attribution splits between the era’s two reported exes (unconfirmed either way) — the ambiguity is itself the fandom’s longest-running TTPD debate.',
      themes: ['contempt', 'unexplained abandonment', 'demanding an autopsy'],
      fanLore:
        'Fan reading (contested, unconfirmed): the great Healy-versus-Alwyn attribution war of 2024.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Smallest_Man_Who_Ever_Lived',
      sources: [
        wiki(
          'The Smallest Man Who Ever Lived',
          'The_Smallest_Man_Who_Ever_Lived',
          'song article: reception',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "Track 14 is the album's scorched-earth peak and the closest The Tortured Poets Department comes to pure fury. Written and produced with Aaron Dessner, it opens as an understated piano ballad and detonates in a near-one-chord bridge — rock-inflected, with Swift's vocal pushed into distortion — that reviewers treated as the record's emotional climax. Critics reached for their strongest language: Rolling Stone's Rob Sheffield read the bridge as an interrogation so heated it could have been retitled 'the angriest song I'll ever write,' the Financial Times called the track a 'quietly venomous piano assassination,' and The Nation's Stephanie Burt named it the harshest, most condemnatory song Swift has ever written.",
          "It was also a chart and critical high point. It debuted at No. 14 on the Billboard Hot 100 (chart dated April 29, 2024) as part of the week Swift became the first artist ever to hold the entire top 14 simultaneously, all 31 Tortured Poets tracks charting at once; it reached No. 18 on the Billboard Global 200 and No. 17 on the UK streaming chart. Billboard's Jason Lipshutz named it the album's best song and centerpiece, and Vulture and The New York Times both ranked it her finest break-up track since 'All Too Well.'"
        ],
        meaning: {
          confirmed: [
            "Track 14 on The Tortured Poets Department (April 19, 2024), written and produced by Swift with Aaron Dessner; recorded at Dessner's Long Pond Studio in the Hudson Valley and at Tiny Telephone in Oakland, with mixing by Serban Ghenea at MixStar (Virginia Beach) and mastering at Sterling Sound.",
            "It debuted at No. 14 on the Billboard Hot 100 during the album's record top-14 opening week, and entered the Eras Tour setlist on the European leg from May 2024 — staged with a military jacket and marching choreography that breaks down as the bridge does."
          ],
          supported: [
            "The song's architecture — a restrained piano verse building to an abrasive, near-spoken bridge — is the production choice critics point to for its force; Rolling Stone, the Financial Times and The Nation all singled the bridge out as the moment the track turns from sorrow to contempt.",
            "Critics widely rated it an album highlight: Billboard called it the record's best track, The Hollywood Reporter its 'cruelest and most direct,' and multiple year-end and best-of-TTPD rankings placed it near the top."
          ],
          fanTheories: [
            "The song is read as a kiss-off to a specific ex, and fandom split for months over which of the era's two reported relationships it addresses — but Swift has named no subject and the album is framed as character-driven, so the attribution stays fan/press theory, not fact. No documented origin exists for the 'smallest man who ever lived' phrasing itself; it reads as original Swift construction rather than a traced idiom or quotation."
          ]
        },
        connections: [
          {
            relatedId: "song:loml",
            label: "loml",
            why: "Two readings of the same abandonment — loml grieves the vanished love outright, The Smallest Man Who Ever Lived turns that same wound into prosecution and contempt."
          },
          {
            relatedId: "song:fresh-out-the-slammer",
            label: "Fresh Out the Slammer",
            why: "Bookends of the collapse: Fresh Out the Slammer bolts toward freedom the moment a relationship ends, this track stands in the rubble demanding to know what the relationship even was."
          },
          {
            relatedId: "song:i-can-fix-him-no-really-i-can",
            label: "I Can Fix Him (No Really I Can)",
            why: "The delusion and its hangover — I Can Fix Him is the doomed conviction going in, The Smallest Man Who Ever Lived the scorched verdict once the fixing failed."
          },
          {
            relatedId: "song:the-alchemy",
            label: "The Alchemy",
            why: "The album's two poles of the same heart: the pure contempt here against The Alchemy's rare, uncomplicated joy — the record's lowest and highest emotional readings, back to back on the tracklist."
          }
        ],
        live: [
          {
            date: "May 9, 2024",
            event: "The Eras Tour — Paris (Paris La Défense Arena)",
            note: "Added to the tour's new TTPD segment from the European leg's opening night; performed in a military jacket with a marching, drill-like staging whose choreography collapses as the bridge peaks."
          }
        ],
        sources: [
          {
            name: "The Smallest Man Who Ever Lived — Wikipedia",
            url: "https://en.wikipedia.org/wiki/The_Smallest_Man_Who_Ever_Lived"
          },
          {
            name: "Billboard: Taylor Swift Charts 32 Songs on the Hot 100 in a Single Week",
            url: "https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/"
          },
          {
            name: "Billboard: The Tortured Poets Department — All Tracks Ranked",
            url: "https://www.billboard.com/lists/taylor-swift-the-tortured-poets-department-tracks-ranked/my-boy-only-breaks-his-favorite-toys/"
          }
        ]
      },
    },
    {
      slug: 'the-alchemy',
      trackNumber: 15,
      trackTitle: 'The Alchemy',
      youtubeId: 'iMMUAd66vxo', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The one happy chemical reaction on the album — stacked with touchdown and trophy imagery that made the subject reading a national headline.',
      summary:
        'After the wreckage, something easy: winning streaks, locker-room metaphors, a love that feels like the championship. The football vocabulary pointed everyone the same direction (unconfirmed in the lyric, extremely confirmed by the tour cameras).',
      inspiration:
        'The sports-imagery reading toward her documented 2023-onward relationship with Travis Kelce is universal; the relationship itself is public record even if the song’s address is not footnoted.',
      themes: ['new love as chemistry', 'winning', 'rare joy on a grief album'],
      easterEggs:
        'An Eras Tour surprise song twice — Paris (May 12, 2024) on guitar with “Treacherous,” and Wembley (Aug. 15, 2024) on piano with “King of My Heart.” It debuted and peaked at No. 13 on the Hot 100.',
      fanLore: 'Fan reading (near-universal): the Kelce attribution via the end-zone metaphors — never confirmed by Swift in any interview, liner note or dedication.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Alchemy',
      sources: [
        wiki('The Alchemy', 'The_Alchemy', 'song article: composition, chart, live history, reception'),
        ALBUM,
        {
          source_url: 'https://time.com/6969049/taylor-swift-song-travis-kelce-the-alchemy/',
          source_title: "Breaking Down Taylor Swift's 'The Alchemy' and Its Travis Kelce References",
          publisher: 'TIME',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Press football-metaphor reading; labels the subject as fan/press inference, not Swift-confirmed',
        },
      ],
      dossier: {
        whyItMatters: [
          "The one unclouded love song on a grief album — widely called the standard edition's only track with a happy ending — and the one whose imagery made the muse reading a national headline: end-zone, trophy, winning-streak and 'the team' vocabulary that every outlet pointed the same direction.",
          "A Swift/Antonoff production of echoing drums and layered vocals that critics filed as electropop with pop-rock and R&B tints; its central football pun split reviewers sharply, from five-star defenses to 'terrible.'"
        ],
        meaning: {
          confirmed: [
            "Track 15 on The Tortured Poets Department (April 19, 2024), written and produced by Taylor Swift with Jack Antonoff; tracked at Conway (LA), Electric Lady (NY) and Prime Recording (Nashville).",
            "It debuted and peaked at No. 13 on the Billboard Hot 100 (chart dated May 4, 2024) during the album's top-14 takeover, and reached No. 19 on the Global 200; it hit No. 23 on the UK Official Streaming Chart.",
            "An Eras Tour surprise song twice: Paris (May 12, 2024) as an acoustic-guitar mashup with Red's 'Treacherous,' and London/Wembley (Aug. 15, 2024) as a piano mashup with reputation's 'King of My Heart.'"
          ],
          supported: [
            "Reception was polarized on the sports-metaphor conceit. Detractors included Spencer Kornhaber ('weak'), Slate's Carl Wilson ('terrible') and Neil McCormick ('cheesy sports puns'); defenders included Will Hodgkinson (five stars — 'epic but intimate, like the final scene in a blockbuster'), and Billboard's Jason Lipshutz ranked it 21st of 31, 'a glittering love song.'",
            "It is broadly described as the album's rare uncomplicated-joy song — the chemistry-as-love-that-finally-works counterweight to the surrounding wreckage."
          ],
          fanTheories: [
            "The football vocabulary is read near-universally by the press (TIME, Today, Slate and others) as pointing to Swift's documented relationship with Travis Kelce, tying the trophy/winning-streak imagery to the Chiefs' Super Bowl LVIII win (Feb. 11, 2024), roughly two months before release. The relationship is public record; the song's address is not. Swift has never confirmed the Kelce reading of 'The Alchemy' in any interview, liner note or dedication — it remains a fan-and-press reading."
          ]
        },
        connections: [
          {
            relatedId: "song:so-high-school",
            label: "So High School",
            why: "The album's other track the press reads as Kelce-adjacent; outlets pair the two as TTPD's new-love duo (a fan-and-press reading, not a Swift-stated one)."
          },
          {
            relatedId: "song:treacherous",
            label: "Treacherous",
            why: "Swift's own live pairing — she mashed 'The Alchemy' with it in Paris; the Red slow-burn of a risky attraction against the Showgirl-adjacent certainty of a love that finally works."
          }
        ],
        sources: [
          { name: "The Alchemy — Wikipedia", url: "https://en.wikipedia.org/wiki/The_Alchemy" },
          { name: "TIME: Breaking Down Taylor Swift's 'The Alchemy' and Its Travis Kelce References", url: "https://time.com/6969049/taylor-swift-song-travis-kelce-the-alchemy/" },
          { name: "Official Charts: Taylor Swift — The Alchemy", url: "https://www.officialcharts.com/songs/taylor-swift-the-alchemy/" }
        ]
      },
    },
    {
      slug: 'clara-bow',
      trackNumber: 16,
      trackTitle: 'Clara Bow',
      youtubeId: 'fcVUbmdQfaE', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The standard edition’s closer: the it-girl assembly line from Clara Bow to Stevie Nicks to — in the final twist — a hungrier new girl being told she looks like Taylor Swift.',
      summary:
        'Each generation’s dazzling girl is complimented as an upgrade on the last, then shelved: the industry conveyor examined by its current occupant, who writes her own replacement into the last verse by name.',
      inspiration:
        'Clara Bow and Stevie Nicks are named in-text; Nicks — a documented friend of Swift — appears elsewhere in the album’s liner poetry, closing the loop.',
      themes: ['it-girl economics', 'replaceability', 'passing the crown'],
      easterEggs:
        'The self-naming final verse is the catalog’s starkest fourth-wall break — the machine described from inside, by name.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Clara_Bow_(song)',
      sources: [wiki('Clara Bow (song)', 'Clara_Bow_(song)', 'song article: named figures'), ALBUM],
      dossier: {
        whyItMatters: [
          "The standard edition's closer is the catalog's starkest fourth-wall break: a chain of it-girls — the 1920s silent-film star Clara Bow, then Stevie Nicks, then a hungrier newcomer told she looks like Taylor Swift — each praised as an upgrade on the last and then quietly shelved. Swift examines the industry conveyor from inside it and writes her own eventual replacement into the final verse by name, closing the album on the machine's own logic rather than a personal grievance.",
          "The name is the argument. Clara Bow was Hollywood's original 'It Girl' — the phrase coined for her 1927 film 'It,' from Elinor Glyn's story — the silent era's biggest sex symbol, whose stardom the studio system used up and discarded, exactly the arc the song traces forward. Critics treated the closer as a highlight: Consequence's Mary Siroky called it the album's 'clear highlight,' its spare production leaving the thesis exposed, and NPR included it among its best songs of 2024. It debuted and peaked at No. 21 on the Billboard Hot 100 the week the album arrived, and No. 22 on the Billboard Global 200."
        ],
        meaning: {
          confirmed: [
            "Track 16, the closer of The Tortured Poets Department's standard edition (April 19, 2024), written and produced by Swift with Aaron Dessner; recorded at Dessner's Long Pond Studio (engineered by Bella Blasko and Jonathan Low) and mixed by Serban Ghenea at MixStar.",
            "Clara Bow (1905-1965) was the silent era's 'It Girl,' named for the 1927 film 'It'; Stevie Nicks, named in the second verse, is a documented friend of Swift's who wrote a poem printed in the album's liner notes."
          ],
          supported: [
            "Reviewers read the song as a self-aware map of celebrity's replaceability cycle, its minimal arrangement deliberately clearing space for the lyric; several named it the album's best closer and an overall highlight.",
            "The Bow reference is widely read as deliberate: the song places her at the head of an it-girl lineage that runs through Nicks and lands on Swift herself, using the original discarded starlet to frame the fear of being the next one used up."
          ],
          fanTheories: [
            "The final verse's turn — an unnamed new girl told she resembles Swift — is read as Swift writing her own future obsolescence into the record; that is critical/fan interpretation of a deliberately meta lyric. No public response from Stevie Nicks to being named in the song is documented, though Nicks attended the Dublin show where Swift dedicated it to her."
          ]
        },
        connections: [
          {
            relatedId: "song:the-lucky-one",
            label: "The Lucky One",
            why: "The same thesis a decade earlier — The Lucky One watches fame chew up and discard a star; Clara Bow names the machine outright, and Swift mashed the two together live in Dublin for exactly that reason."
          },
          {
            relatedId: "song:nothing-new",
            label: "nothing new (feat. Phoebe Bridgers)",
            why: "The fear stated plainly one era before: nothing new dreads the day she is no longer the shiny new thing, the anxiety Clara Bow turns into a whole assembly-line argument."
          },
          {
            relatedId: "song:cassandra",
            label: "Cassandra",
            why: "Companion TTPD studies of women and the fame machine — Cassandra the disbelieved truth-teller, Clara Bow the used-up starlet, two ways the industry disposes of the women it elevated."
          },
          {
            relatedId: "song:the-bolter",
            label: "The Bolter",
            why: "Two portraits of a woman the spotlight can't hold — The Bolter runs before she can be discarded, Clara Bow is discarded on schedule; both sit in the album's gallery of it-girls outrunning their shelf life."
          }
        ],
        live: [
          {
            date: "June 30, 2024",
            event: "The Eras Tour — Dublin (Aviva Stadium)",
            note: "Live debut, performed acoustic as a surprise-song mashup with 'The Lucky One' and dedicated to Stevie Nicks, who was in the audience. Reprised August 1, 2024 in Warsaw as a mashup with 'Mirrorball.'"
          }
        ],
        sources: [
          {
            name: "Clara Bow (song) — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Clara_Bow_(song)"
          },
          {
            name: "Billboard: Taylor Swift Charts 32 Songs on the Hot 100 in a Single Week",
            url: "https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/"
          },
          {
            name: "Billboard: The Tortured Poets Department — All Tracks Ranked",
            url: "https://www.billboard.com/lists/taylor-swift-the-tortured-poets-department-tracks-ranked/my-boy-only-breaks-his-favorite-toys/"
          }
        ]
      },
    },
    {
      slug: 'the-black-dog',
      trackNumber: 17,
      trackTitle: 'The Black Dog',
      youtubeId: '56TZ3B8Qxsk', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The Anthology opener named for a real London pub — which promptly became a Swiftie pilgrimage site with a themed menu, to the owners’ delight.',
      summary:
        'An ex forgets to turn off location sharing and she watches him walk into their old bar: grief via app notification, modern heartbreak’s most specific opening scene. The actual Vauxhall pub leaned in, documented worldwide.',
      inspiration:
        'The real Black Dog pub in London confirmed the tourist wave publicly — the era’s best example of a lyric geotagging itself.',
      themes: ['digital-age grief', 'shared places lost', 'watching from afar'],
      easterEggs:
        'The Vauxhall pub leaned in — window signage quoting the lyric, a cocktail board annotated “Taylor’s Version,” branded merch — and staff said they turned customers away daily after release. It opens the Anthology’s fifteen-song second half, peaked at No. 25 on the Hot 100, and was an Eras Tour piano surprise song three times: Wembley (June 21, 2024, live debut, with “Come Back… Be Here”/“Maroon”), Warsaw (Aug. 3, 2024, with “exile”) and New Orleans (Oct. 25, 2024, with “Haunted”). In Oct. 2025 Swift told BBC Radio 2 fans “have no idea” what it is about.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Black_Dog_(song)',
      sources: [
        wiki('The Black Dog (song)', 'The_Black_Dog_(song)', 'song article: composition, chart, live history, reception'),
        ALBUM,
        {
          source_url: 'https://www.cbsnews.com/news/taylor-swift-the-black-dog-pub-london-tortured-poets-department/',
          source_title: "London pub becomes Taylor Swift fan destination after 'The Black Dog'",
          publisher: 'CBS News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'The Vauxhall pub phenomenon; marketing manager on turning customers away daily',
        },
        {
          source_url: 'https://www.justjared.com/2025/10/06/taylor-swift-reveals-fans-have-no-idea-what-the-black-dog-is-really-about/',
          source_title: "Taylor Swift Says Fans 'Have No Idea' What 'The Black Dog' Is About",
          publisher: 'Just Jared',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: 'Oct. 2025 BBC Radio 2 (Scott Mills) remark deflating the assumed reading',
        },
      ],
      dossier: {
        whyItMatters: [
          "The song that opens the Anthology's fifteen-track second half, and the era's clearest example of a lyric geotagging itself: an ex forgets to turn off location sharing and the narrator watches him walk into their old bar — grief delivered as an app notification. A real Vauxhall pub of that name became a Swiftie pilgrimage overnight.",
          "A sole-written Swift lyric on a bare-piano Antonoff production that ruptures into a screamed 'old habits die screaming' climax — critics called it an emo peak and one of the Anthology's best."
        ],
        meaning: {
          confirmed: [
            "Track 17 on The Tortured Poets Department: The Anthology (April 19, 2024), written solely by Taylor Swift and produced with Jack Antonoff; recorded at Conway (LA) and Electric Lady (NY). Its sparse arrangement opens on bare piano and builds to a dynamic crescendo of synths and multitracked harmonies.",
            "It peaked at No. 25 on the Billboard Hot 100 and No. 26 on the Global 200; certified Silver in the UK (Gold in Australia and New Zealand).",
            "'The Starting Line' names the emo band in the lyric; frontman Kenny Vasoli called it 'a very sweet name-drop,' and the band's streams rose sharply that weekend.",
            "An Eras Tour surprise song performed as piano mashups: London/Wembley (June 21, 2024, its live debut) with 'Come Back... Be Here' and 'Maroon'; Warsaw (Aug. 3, 2024) with 'exile'; and New Orleans (Oct. 25, 2024) with 'Haunted.'"
          ],
          supported: [
            "The real Black Dog pub in Vauxhall, London leaned into its accidental fame: window signage quoting the lyric, a cocktail board annotated 'Taylor's Version,' branded merch, and Swiftie singalongs. Staff told outlets they turned customers away daily after release (marketing manager Amy Crowley to CBS News) and watched their social following multiply within days (Lily Bottomley to CNN). Swift, they noted, has never actually been seen there.",
            "Critics rated it a highlight; Rob Sheffield (Rolling Stone) praised its 'classic Nashville-worthy premise' as a wry take on post-breakup phone-watching, and Variety's Chris Willman described its build to an 'emo climax.'"
          ],
          fanTheories: [
            "The location-sharing / 'Find My' conceit is widely reported as the song's premise but is a reading of the lyric, not an autobiographical fact, and no real person is named. In October 2025 Swift herself told BBC Radio 2's Scott Mills that fans 'think they know. They have no idea' what the song is about — an on-record deflation of the assumed reading."
          ]
        },
        connections: [
          {
            relatedId: "moment:vault-tloas-the-black-dog-still-nobody-knows-what-the-songs-about-she-sa",
            label: "The Black Dog: still nobody knows",
            why: "Swift's own October 2025 remark that fans 'have no idea' what the song is about — the artist-sourced counterweight to every confident reading of this track."
          },
          {
            relatedId: "song:so-long-london",
            label: "So Long, London",
            why: "The album's London break-up cluster: 'So Long, London' delivers the formal eulogy, 'The Black Dog' tracks the same ex in real time through a shared-location app (a critic-drawn grouping)."
          },
          {
            relatedId: "song:exile",
            label: "exile",
            why: "Swift's own Warsaw live pairing — two duets with distance, one sung across a break-up, the other across a map app that won't stop sharing."
          }
        ],
        sources: [
          { name: "The Black Dog (song) — Wikipedia", url: "https://en.wikipedia.org/wiki/The_Black_Dog_(song)" },
          { name: "CBS News: London pub becomes Taylor Swift fan destination after 'The Black Dog'", url: "https://www.cbsnews.com/news/taylor-swift-the-black-dog-pub-london-tortured-poets-department/" },
          { name: "Just Jared: Taylor Swift Says Fans 'Have No Idea' What 'The Black Dog' Is About", url: "https://www.justjared.com/2025/10/06/taylor-swift-reveals-fans-have-no-idea-what-the-black-dog-is-really-about/" }
        ]
      },
    },
    {
      slug: 'imgonnagetyouback',
      trackNumber: 18,
      trackTitle: 'imgonnagetyouback',
      youtubeId: 'SBGdvxi2JmU', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The double-meaning threat: win him back or get him back — she has not decided, and the song refuses to either.',
      summary:
        'Revenge and reunion held in deliberate superposition: whichever hurts more, probably. Critics filed the restrained, synth-forward production in Midnights’ dusky-electropop lineage (and reached for Olivia Rodrigo comparisons), not reputation. It debuted and peaked at No. 26 on the Hot 100 during the album’s top-14 week, and Swift twice worked it into Eras Tour surprise sets — Amsterdam (July 5, 2024) mashed with “Dress,” then Munich (July 28, 2024).',
      inspiration: null,
      themes: ['ambivalence weaponized', 'revenge or romance', 'unfinished business'],
      easterEggs:
        'The lowercase run-on title — no spaces, all lowercase — is the reputation-era kiss-off attitude compressed into a URL, but the sound is Midnights-adjacent synth-pop.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Imgonnagetyouback',
      sources: [
        wiki('imgonnagetyouback', 'Imgonnagetyouback', 'song article: composition, chart, live history'),
        ALBUM,
        {
          source_url: 'https://www.billboard.com/lists/taylor-swift-hot-100-top-14-fortnight-post-malone-record/',
          source_title: 'Taylor Swift Makes Chart History With Top 14 of the Hot 100',
          publisher: 'Billboard',
          source_type: 'chart_database',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'No. 26 Hot 100 debut/peak within the record top-14 week',
        },
        {
          source_url: 'https://www.rollingstone.com/music/music-news/taylor-swift-imgonnagetyouback-amsterdam-1235054443/',
          source_title: "Taylor Swift Debuts 'imgonnagetyouback' in Amsterdam",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: 'Live debut July 5, 2024, mashed with reputation’s "Dress"',
        },
      ],
      dossier: {
        whyItMatters: [
          "A double-meaning threat held in deliberate superposition — win him back or get him back — that the song refuses to resolve. Critics read the ambivalence as the whole point, riding a restrained, synth-forward Antonoff groove.",
          "The Anthology's second bonus track and one of its more divisive cuts: reviewers reached not for reputation but for Midnights-era electropop and Olivia Rodrigo comparisons to place its bratty spoken asides and muted keyboards."
        ],
        meaning: {
          confirmed: [
            "Track 18 overall on The Tortured Poets Department: The Anthology (April 19, 2024) — the second of the fifteen bonus tracks in the double album's second half, exclusive to the Anthology edition — written and produced by Taylor Swift with Jack Antonoff at Electric Lady (NY), mixed by Serban Ghenea.",
            "It debuted and peaked at No. 26 on the Billboard Hot 100 (chart dated May 4, 2024) within Swift's record top-14 week, and reached No. 28 on the Global 200; certified Silver in the UK.",
            "It was performed live twice as Eras Tour surprise songs: Amsterdam (July 5, 2024) mashed with reputation's 'Dress,' and Munich (July 28, 2024)."
          ],
          supported: [
            "Critics placed the production in Midnights' dusky electropop lineage (Annie Zaleski) and repeatedly compared it to Olivia Rodrigo's 'Get Him Back!' (Vulture's Nate Jones called it parallel thinking, not plagiarism); Billboard's Jason Lipshutz described the production as 'dainty' and 'shuddering.' Reviews ranged from Rob Sheffield's 'catchy oddity' to John Wohlmacher's 'an immediate skip.'",
            "The intentional double meaning of 'get you back' — reconciliation versus revenge — is the reading nearly every writer highlighted, alongside the lowercase run-on title."
          ],
          fanTheories: [
            "Swift has made no on-record statement about the song's ambivalence or its subject; the reconciliation-or-revenge reading is strictly critics' and fans' interpretation, and press muse-guesses are unconfirmed speculation."
          ]
        },
        connections: [
          {
            relatedId: "song:dress",
            label: "Dress",
            why: "Swift's own live pairing — she mashed the two in Amsterdam; both circle the same unfinished wanting, one giddy and secret, one weaponized into a threat."
          },
          {
            relatedId: "song:now-that-we-dont-talk",
            label: "Now That We Don't Talk",
            why: "A kiss-off companion a reader of one would want (a fan-and-thematic grouping, not a critic-drawn one): the clipped, done-with-you posture 'imgonnagetyouback' can't quite commit to."
          }
        ],
        sources: [
          { name: "imgonnagetyouback — Wikipedia", url: "https://en.wikipedia.org/wiki/Imgonnagetyouback" },
          { name: "Rolling Stone: Taylor Swift Debuts 'imgonnagetyouback' in Amsterdam", url: "https://www.rollingstone.com/music/music-news/taylor-swift-imgonnagetyouback-amsterdam-1235054443/" },
          { name: "Billboard: Taylor Swift Charts All Top 14 Hot 100 Spots", url: "https://www.billboard.com/lists/taylor-swift-hot-100-top-14-fortnight-post-malone-record/" }
        ]
      },
    },
    {
      slug: 'the-albatross',
      trackNumber: 19,
      trackTitle: 'The Albatross',
      youtubeId: '4wOsiM2T_xc', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'Coleridge’s cursed bird, self-applied — she is the omen the wise men warn him about, and she arrives anyway.',
      summary:
        'A woman preceded by her own mythology: dangerous to love, per the pamphlet. She accepts the albatross label, then rewrites it — the curse shows up to rescue him.',
      inspiration:
        'The Rime of the Ancient Mariner reference is in-text — one of the Anthology’s densest literary borrowings.',
      themes: ['reputation as curse', 'literary self-mythology', 'rescue by the feared thing'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Albatross_(Taylor_Swift_song)',
      sources: [
        wiki(
          'The Albatross (Taylor Swift song)',
          'The_Albatross_(Taylor_Swift_song)',
          'song article: Coleridge reference',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "One of the Anthology's densest literary borrowings: it takes Coleridge's Rime of the Ancient Mariner and turns the omen inside out — the 'dangerous to love' woman the wise men warn against is the one who leads the ship out of the storm, and the curse falls on those who slay her. Critics and fans read it as a reputation-era statement about being branded dangerous.",
          "A fingerpicked Aaron Dessner folk-rock ballad that lived a double life — first the exclusive bonus on the numbered 'Smoke Grey' collector's variant revealed at the February 2024 Sydney show, then track 19 of the 31-song Anthology — and became a recurring Eras Tour surprise song."
        ],
        meaning: {
          confirmed: [
            "Track 19 of The Tortured Poets Department: The Anthology (April 19, 2024), written and produced by Swift with Aaron Dessner and recorded across Long Pond (Hudson Valley), Chicago, London and other studios. On the standard album it appears only as the physical bonus on the 'Smoke Grey' / 'The Albatross' collector's edition, one of four numbered variants each named for its exclusive bonus track.",
            "That variant was revealed on Feb. 23, 2024 at the Sydney Eras Tour show; all four bonus tracks released together with the album on April 19, with no earlier standalone release.",
            "During TTPD's record debut week it peaked at No. 30 on the Billboard Hot 100 and No. 32 on the Global 200, among the 31 tracks Swift charted at once.",
            "An Eras Tour surprise song: it debuted June 29, 2024 in Dublin mashed with reputation's 'Dancing with Our Hands Tied,' and returned on Indianapolis Night 1 (Nov. 1, 2024) in a guitar-slot mashup with Red's 'Holy Ground.'",
            "A folk-rock ballad whose liner credits reach beyond Dessner's usual kit to the London Contemporary Orchestra (conducted by Robert Ames) plus his folklore–evermore collaborators (Glenn Kotche, James McAlister, Benjamin Lanz, Bryce Dessner on orchestration) — the Long Pond family of players.",
            "An official lyric video (not a music video) accompanied the track on Swift's YouTube channel."
          ],
          supported: [
            "No on-record Swift gloss defines who 'the albatross' is; the dominant critic-and-fan reading takes the Coleridge frame as reputation-as-curse — a woman preceded by her own myth who turns out to be the rescuer, not the omen. Annotators read the third-person 'wise men' opening as critics warning her lover about the danger of loving her, then the first-person final turn as her claiming the omen label and recasting it as salvation.",
            "Ranking lists placed it mid-pack (Billboard 25th of 31, The Hollywood Reporter 19th, Rob Sheffield's Rolling Stone discography ranking 215th), but close-readings single it out as the Anthology's key literary set-piece, with outlets including Vogue Australia and Today foregrounding the Coleridge 'Rime of the Ancient Mariner' albatross frame."
          ],
          fanTheories: [
            "Critics and fans cluster it with 'Cassandra' (the disbelieved prophetess) and 'Clara Bow' (the mythologized woman) as the Anthology's self-mythology thread, reinforced by its live mashups with reputation-era songs — an interpretive consensus, not a stated one.",
            "A widely circulated fan reading maps the song's 'wise men' warnings onto the public warnings Travis Kelce was reported to have gotten about dating her — a public-relationship interpretation, not anything Swift has stated."
          ]
        },
        connections: [
          {
            relatedId: "song:cassandra",
            label: "Cassandra",
            why: "The Anthology's closest sibling: both are women disbelieved and punished for what they see — the prophetess no one heeds and the omen the wise men warn against."
          },
          {
            relatedId: "song:clara-bow",
            label: "Clara Bow",
            why: "Two studies in a woman preceded by her own mythology — Clara Bow the used-up star, 'The Albatross' the feared omen who is really the rescue."
          }
        ],
        sources: [
          { name: "The Albatross (Taylor Swift song) — Wikipedia", url: "https://en.wikipedia.org/wiki/The_Albatross_(Taylor_Swift_song)" },
          { name: "Billboard: Taylor Swift Announces 'The Albatross' Edition of 'Tortured Poets'", url: "https://www.billboard.com/music/pop/taylor-swift-tortured-poets-the-albatross-edition-eras-tour-announcement-1235613344/" },
          { name: "Billboard: All the Surprise Songs Taylor Swift Performed on The Eras Tour", url: "https://www.billboard.com/lists/taylor-swift-eras-tour-surprise-songs/" },
          { name: "In The Know (AOL): 'The Albatross' Lyrics Seemingly Reveal the Warnings Travis Kelce Got About Her", url: "https://www.aol.com/taylor-swift-albatross-lyrics-seemingly-154500643.html" }
        ]
      },
    },
    {
      slug: 'chloe-or-sam-or-sophia-or-marcus',
      trackNumber: 20,
      trackTitle: 'Chloe or Sam or Sophia or Marcus',
      youtubeId: 'gOtOWeD9YJk', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The Anthology’s cult favorite — replacing her is so easy the replacements do not even need distinct names.',
      summary:
        'He moves on to interchangeable someones while she replays the specific, unrepeatable thing they had: the title’s shrugged list is the cruelest device on the album. A spare, folklore-adjacent Aaron Dessner piano ballad, it debuted and peaked at No. 36 on the Hot 100 in TTPD’s record week, and Rolling Stone’s Rob Sheffield called it "a delicately etched ballad." Its "cult favorite" standing rests more on fan streaming and discussion than on critic lists.',
      inspiration:
        'Outlets (Today, AOL/Yahoo) read the four title names as generic, interchangeable placeholders — "somebody" who "could be anybody with any name" — not references to identifiable people; Swift has named no subject.',
      themes: ['interchangeability', 'specific versus generic love', 'lingering'],
      easterEggs:
        'Its only live performance was a solo-piano Eras Tour surprise-song debut in Lyon, France (June 3, 2024); setlist.fm logs it as played exactly once, never repeated.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [
        ALBUM,
        {
          source_url: 'https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/',
          source_title: "Taylor Swift Charts 32 Songs on Hot 100, Including Every 'Tortured Poets' Track",
          publisher: 'Billboard',
          source_type: 'chart_database',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'No. 36 Hot 100 debut/peak in the release week',
        },
        {
          source_url: 'https://www.setlist.fm/setlist/taylor-swift/2024/groupama-stadium-decines-charpieu-france-33aa4021.html',
          source_title: 'Taylor Swift Setlist at Groupama Stadium, Lyon — June 3, 2024',
          publisher: 'setlist.fm',
          source_type: 'reference',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Solo-piano surprise-song live debut; played once across the tour',
        },
        {
          source_url: 'https://www.today.com/popculture/music/chloe-sam-sophia-marcus-taylor-swift-lyrics-meaning-rcna148527',
          source_title: "'Chloe or Sam or Sophia or Marcus': who are they? Lyrics explained",
          publisher: 'TODAY',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Names read as generic placeholders, not real individuals',
        },
      ],
      dossier: {
        whyItMatters: [
          "A spare, folklore-adjacent Aaron Dessner piano ballad and one of the Anthology's cult favorites: he moves on to interchangeable someones while she replays the specific thing they had, the title's shrugged list of first names its cruelest device. It debuted and peaked at No. 36 on the Hot 100 in TTPD's record week.",
          "Rolling Stone's Rob Sheffield called it 'a delicately etched ballad'; its standing rests more on fan streaming and discussion than on critic lists, and its only live outing was a single Eras Tour surprise song."
        ],
        meaning: {
          confirmed: [
            "Track 20 on The Tortured Poets Department: The Anthology (April 19, 2024), written and produced by Swift with Aaron Dessner.",
            "It debuted and peaked at No. 36 on the Billboard Hot 100 (chart dated May 4, 2024), one of all 31 tracks charting at once.",
            "Its sole live performance was a solo-piano surprise-song debut at the Eras Tour in Lyon, France (June 3, 2024); setlist.fm records it as played exactly once, never repeated."
          ],
          supported: [
            "Outlets (Today, AOL/Yahoo) read the four title names — Chloe, Sam, Sophia, Marcus — as generic, interchangeable placeholders ('somebody' who 'could be anybody with any name'), not references to identifiable people."
          ],
          fanTheories: [
            "Critics hedge-map the song to the album's documented breakup arc via a lyric read as an addiction reference, while stressing it could equally fit other exes or none; Swift has named no subject, and no real individual should be inferred behind the placeholder names."
          ]
        },
        connections: [
          {
            relatedId: "song:how-did-it-end",
            label: "How Did It End?",
            why: "Its closest Anthology sibling: another Swift/Dessner ballad about a relationship's unresolved aftermath and the appetite to narrate it."
          },
          {
            relatedId: "song:clara-bow",
            label: "Clara Bow",
            why: "Shares the interchangeability motif — the it-girl replaced and renamed in the final verse, the same 'you are swappable' cruelty."
          },
          {
            relatedId: "song:the-prophecy",
            label: "The Prophecy",
            why: "A Dessner-led Anthology plea against a fated lonely end, part of the same closing-arc lament cluster."
          }
        ],
        live: [
          {
            date: "June 3, 2024",
            event: "The Eras Tour — Lyon (Groupama Stadium)",
            note: "Solo-piano surprise-song live debut; its only performance across the tour."
          }
        ],
        sources: [
          { name: "The Tortured Poets Department — Wikipedia (Anthology credits)", url: "https://en.wikipedia.org/wiki/The_Tortured_Poets_Department" },
          { name: "Billboard: Taylor Swift Charts 32 Songs on the Hot 100 in a Single Week", url: "https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/" },
          { name: "setlist.fm: Lyon, June 3, 2024", url: "https://www.setlist.fm/setlist/taylor-swift/2024/groupama-stadium-decines-charpieu-france-33aa4021.html" },
          { name: "TODAY: 'Chloe or Sam or Sophia or Marcus' lyrics explained", url: "https://www.today.com/popculture/music/chloe-sam-sophia-marcus-taylor-swift-lyrics-meaning-rcna148527" },
          { name: "Rolling Stone AU: Taylor Swift's Best Songs (Rob Sheffield)", url: "https://au.rollingstone.com/music/music-lists/-58660/chloe-or-sam-or-sophia-or-marcus-2024-2-58799/" }
        ]
      },
    },
    {
      slug: 'how-did-it-end',
      trackNumber: 21,
      trackTitle: 'How Did It End?',
      youtubeId: 'O3wlMR0y4a4', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'A breakup autopsy performed for an audience of gossips — the couple’s friends, the fans, and the press all lean in for the cause of death.',
      summary:
        'Everyone wants the story of the ending, including the two people it happened to, who genuinely do not know — grief with a Greek chorus of rubberneckers. It is track 21 — the fifth of the fifteen songs in “The Anthology,” the second half that surprise-dropped at 2 a.m. ET on release night (that bonus run opens with “The Black Dog,” track 17) — and it reached No. 35 on the Billboard Hot 100 during TTPD’s record-setting chart week. Swift debuted it live as a solo piano ballad at the final Stockholm Eras Tour show (May 19, 2024); Variety later ranked it among her best songs and The Independent named it one of 2024’s best.',
      inspiration:
        'Aaron Dessner co-wrote and co-produced it, recording at his Long Pond studio (Hudson Valley), Kitty Committee (Los Angeles) and Thomas Bartlett’s home studio in Paris; the waltz-time arrangement builds from near-whispered verses on insistent piano arpeggios to a surging London Contemporary Orchestra string crescendo (conducted by Robert Ames) that fans single out. Swift has named no subject.',
      themes: ['public appetite for private pain', 'unanswerable endings', 'gossip as ritual'],
      fanLore:
        'Fan/press reading (near-universal, unconfirmed): the close of the six-year Joe Alwyn relationship — the “how did it end?” question outsiders ask when any couple splits — frequently paired with “You’re Losing Me” as the same story’s bookends.',
      easterEggs:
        'The lyric sustains a clinical autopsy conceit — a “fatal fever,” a “death rattle,” maladies “we could not cure” — turning the breakup into a coroner’s report.',
      sourceUrl: 'https://en.wikipedia.org/wiki/How_Did_It_End%3F',
      sources: [
        wiki('How Did It End?', 'How_Did_It_End%3F', 'song article: composition, recording, Hot 100 No. 35 peak, live history, critical reception'),
        {
          source_url: 'https://ca.rollingstone.com/music/taylor-swift-debuts-how-did-it-end-at-final-2024-eras-tour-date-in-sweden/',
          source_title: 'Taylor Swift Debuts “How Did It End?” at Final Stockholm Eras Tour Date',
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-21',
          reliability_score: 3,
          notes: 'Live debut May 19, 2024, Stockholm — standalone piano performance',
        },
        {
          source_url:
            'https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/',
          source_title: 'Taylor Swift Charts 32 Songs on the Hot 100 in a Single Week',
          publisher: 'Billboard',
          source_type: 'chart_database',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'No. 35 Hot 100 peak, outside the album\'s top-14 sweep',
        },
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "Track 21 sits deep inside 'The Anthology,' the fifteen-song second half (tracks 17–31) that surprise-dropped at 2 a.m. ET on release night — that half opens with 'The Black Dog' (track 17), not this song. It turns a breakup into a coroner's report performed for an audience of gossips — the couple, their friends, the fans and the press all leaning in for the cause of death — and its sustained clinical metaphor (a 'fatal fever,' a 'death rattle') is the detail reviewers single out.",
          "It punched above its bonus-track billing. Recorded with Aaron Dessner at his Long Pond studio (Hudson Valley), Kitty Committee (Los Angeles) and Thomas Bartlett's Paris studio, its waltz-time build runs from near-whispered verses on insistent piano arpeggios to a surging London Contemporary Orchestra string crescendo (conducted by Robert Ames). It reached No. 35 on the Billboard Hot 100 during the album's record week — just outside the top 14 it monopolized — Variety later ranked it 11th among Swift's best songs and The Independent named it one of 2024's best, and Swift brought it to the stage twice: a solo-piano debut at the final Stockholm show (May 19, 2024) and a lone reprise mashed with 'You're Losing Me' in Toronto (Nov. 23, 2024)."
        ],
        meaning: {
          confirmed: [
            "Track 21 of 'The Anthology' — the fifteen-song second half of The Tortured Poets Department (tracks 17–31) that surprise-released at 2 a.m. ET on April 19, 2024, whose bonus half opens with 'The Black Dog' (track 17), not this song — written and produced by Swift with Aaron Dessner and recorded at Long Pond, Kitty Committee and Thomas Bartlett's Paris studio.",
            "It reached No. 35 on the Billboard Hot 100 during the album's record week (outside the top 14 the album swept), and was performed live twice on the Eras Tour: a solo-piano debut on May 19, 2024 at the final Stockholm show, and a 'You're Losing Me' mashup in Toronto on Nov. 23, 2024."
          ],
          supported: [
            "The arrangement builds from near-whispered verses toward a full crescendo that fans single out, and the lyric sustains an autopsy conceit that reviewers repeatedly quote.",
            "It was widely praised among the Anthology's bonus tracks — Variety ranked it among her best songs; The Independent named it one of 2024's best."
          ],
          fanTheories: [
            "It is read near-universally as the close of a six-year relationship — the 'how did it end?' question outsiders ask when any couple splits — and is frequently paired with Midnights' 'You're Losing Me' as the same story's bookends. Swift has named no subject."
          ]
        },
        connections: [
          {
            relatedId: "song:so-long-london",
            label: "So Long, London",
            why: "The two halves of one ending: How Did It End? is the public autopsy demanded from outside, So Long, London the private eulogy from within."
          },
          {
            relatedId: "song:youre-losing-me",
            label: "You're Losing Me",
            why: "Fans pair them as bookends of the same slow death — You're Losing Me the flatline warning in real time, How Did It End? the post-mortem asked once it is over."
          },
          {
            relatedId: "song:loml",
            label: "loml",
            why: "Both sit in the album's grieving-a-long-love register; loml names the loss outright while How Did It End? circles the cause of it."
          },
          {
            relatedId: "song:the-black-dog",
            label: "The Black Dog",
            why: "Companion Anthology break-up tracks — The Black Dog's obsessive real-time watching against How Did It End?'s retrospective, spectated grief."
          },
          {
            relatedId: "song:the-manuscript",
            label: "The Manuscript",
            why: "The Anthology's two clinical grief-closers — How Did It End? autopsies the split as it is spectated, The Manuscript files it away years later as finished narrative."
          }
        ],
        live: [
          {
            date: "May 19, 2024",
            event: "The Eras Tour — Stockholm (Friends Arena), final Stockholm night",
            note: "Live debut, performed alone at the piano as a surprise song."
          },
          {
            date: "November 23, 2024",
            event: "The Eras Tour — Toronto (Rogers Centre)",
            note: "Its only other performance — a surprise-song mashup with Midnights' 'You're Losing Me,' the pairing fans read as the same relationship's bookends."
          }
        ],
        sources: [
          {
            name: "How Did It End? — Wikipedia",
            url: "https://en.wikipedia.org/wiki/How_Did_It_End%3F"
          },
          {
            name: "Rolling Stone: Taylor Swift Debuts 'How Did It End?' at Final Stockholm Eras Tour Date",
            url: "https://ca.rollingstone.com/music/taylor-swift-debuts-how-did-it-end-at-final-2024-eras-tour-date-in-sweden/"
          },
          {
            name: "Billboard: Taylor Swift Charts 32 Songs on the Hot 100 in a Single Week",
            url: "https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/"
          }
        ]
      },
    },
    {
      slug: 'so-high-school',
      trackNumber: 22,
      trackTitle: 'So High School',
      youtubeId: 'w-FkV0EM_CU', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The 90s-rock crush song that made a grown superstar feel sixteen again — video games and one very identifiable "marry, kiss, or kill" reference.',
      summary:
        'New love that regresses her to gym-class butterflies: teasing, truth-or-dare, learning someone’s aunts’ names. The Anthology’s second unambiguous burst of happiness, read universally toward the same tight end as The Alchemy.',
      inspiration:
        'Fan attribution to the Kelce relationship is near-universal (the relationship is documented; the dedication is not footnoted). He has publicly vibed to it at shows, which fans file as confirmation-adjacent.',
      themes: ['regression to giddiness', 'new love', 'being known simply'],
      fanLore:
        'Fan reading (near-universal): the Kelce song — supported by his documented on-camera reactions at the Eras Tour.',
      sourceUrl: 'https://www.capitalfm.com/news/music/taylor-swift-so-high-school-eras-tour-travis-kelce/',
      sources: [
        wiki('So High School', 'So_High_School', 'song article: readings'),
        {
          source_url: 'https://www.capitalfm.com/news/music/taylor-swift-so-high-school-eras-tour-travis-kelce/',
          source_title: "Taylor Swift's 'So High School' Travis Kelce References Explained",
          publisher: 'Capital FM',
          source_type: 'reputable_press',
          accessed_at: ACCESSED,
          reliability_score: 3,
          notes: "'marry, kiss, or kill' lyric and Kelce's 2016 interview clip; bleachers as Eras Tour staging, not a lyric",
        },
        ALBUM,
      ],
    },
    {
      slug: 'i-hate-it-here',
      trackNumber: 23,
      trackTitle: 'I Hate It Here',
      youtubeId: 'BpkmUfv1I4Q', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The escapist’s manifesto — secret gardens, imaginary decades, and a much-debated line about which decade she would actually survive.',
      summary:
        'When the present is unbearable she emigrates inward: books, invented worlds, lunar vacations. The nostalgia-with-asterisks verse (the 1830s, minus everything wrong with the 1830s) generated its own documented discourse cycle. It debuted at No. 34 on the Hot 100 in the release week and was a documented Eras Tour one-off — played only once, at its Cardiff live debut.',
      inspiration: null,
      themes: ['escapism', 'interior worlds', 'nostalgia audited'],
      easterEggs:
        'Played live exactly once: the June 18, 2024 Cardiff Eras Tour debut, on piano, mashed with folklore’s "The Lakes" ("a song I’ve never played live before"). It was never repeated. Recording credits include Aaron Dessner on acoustic guitar and Glenn Kotche on percussion.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [
        ALBUM,
        {
          source_url: 'https://www.capitalfm.com/artists/taylor-swift/eras-tour-surprise-songs-setlist/',
          source_title: 'Every Eras Tour Surprise Song',
          publisher: 'Capital FM',
          source_type: 'reference',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: '"I Hate It Here" played once (Cardiff, June 18, 2024) and never repeated',
        },
        {
          source_url: 'https://www.officialcharts.com/songs/taylor-swift-i-hate-it-here/',
          source_title: 'I Hate It Here — Official Charts',
          publisher: 'Official Charts Company',
          source_type: 'chart_database',
          accessed_at: '2026-07-24',
          reliability_score: 5,
          notes: 'UK component-chart peaks; one-week run',
        },
      ],
      dossier: {
        whyItMatters: [
          "An escapist's manifesto — books, invented worlds, 'secret gardens in my mind' — whose most-discussed moment is a single couplet ('I'd say the 1830s but without all the racists / And getting married off for the highest bid') that set off an April 2024 backlash. Outlets argued the 'without all the racists' framing minimizes 1830s slavery; Swift and her team never publicly responded, a silence itself worth recording.",
          "The song also supplies its own counter-argument — 'Nostalgia is a mind's trick / If I'd been there, I'd hate it / It was freezing in the palace' — which some read as the track auditing and dismantling the fantasy rather than endorsing it. That is critical/fan interpretation, not an author's gloss, and the page keeps the two apart."
        ],
        meaning: {
          confirmed: [
            "Track 23 on The Tortured Poets Department: The Anthology (April 19, 2024), written and produced by Swift with Aaron Dessner — an acoustic, power-pop-jangling cut from the Dessner-led second half, much of that material worked at his Long Pond studio; recording credits include Dessner on acoustic guitar and Glenn Kotche on percussion.",
            "It debuted at No. 34 on the Billboard Hot 100 in the release week (chart dated May 4, 2024), one of all 31 Anthology tracks charting at once; on the UK charts it managed only a one-week run in early May, peaking No. 48 on the Official Streaming Chart, and no RIAA/BPI/ARIA certification for the track is documented.",
            "An Eras Tour one-off: its only performance was the June 18, 2024 Cardiff live debut, on piano, mashed with folklore's 'The Lakes' (Swift noting she'd never played it live before) — it was never repeated."
          ],
          supported: [
            "Coverage of the '1830s' line uniformly reported the criticism that reducing the era's realities to 'racists' elides slavery; those same outlets — including Salon and AOL/USA Today-network explainers — noted the song's stated thesis that 'nostalgia is a mind's trick,' without treating it as settling the debate. No named critic was found defending the couplet as a deliberate self-audit, and no public response from Swift or her team is documented.",
            "Salon's Nardos Haile gave the song its fullest standalone critique, calling it 'regressive, not reflective'; most other outlets folded it into the 1830s discourse rather than reviewing it as a musical standout. Rolling Stone's Anthology review singled out the opening line — 'a poet trapped in the body of a finance guy' — with a 'what a line' aside, reading the track as a lighter power-pop change of pace."
          ],
          fanTheories: [
            "Lyric-analysis writers read the 'secret gardens in my mind… the only [key] is mine' image as an allusion to Frances Hodgson Burnett's The Secret Garden, and the whole song as an audit of nostalgia rather than an endorsement — inferences, not anything Swift has confirmed."
          ]
        },
        connections: [
          {
            relatedId: "song:the-lakes",
            label: "The Lakes",
            why: "Its live-debut mashup partner and its spiritual twin: both flee an unbearable present into a Romantic retreat — the Lake District in one, invented 'secret gardens' and imaginary decades in the other."
          }
        ],
        sources: [
          { name: "Today: Taylor Swift's 'I Hate It Here' Lyrics — Why 1 Line Is Sparking Backlash", url: "https://www.today.com/popculture/music/i-hate-it-here-lyrics-meaning-taylor-swift-rcna148592" },
          { name: "Billboard: Taylor Swift Debuts 'I Hate It Here' Live With 'The Lakes' on Eras Tour", url: "https://www.billboard.com/music/music-news/taylor-swift-i-hate-it-here-the-lakes-live-cardiff-1235713439/" },
          { name: "Rolling Stone: The Tortured Poets Department — The Anthology Review", url: "https://www.rollingstone.com/music/music-album-reviews/taylor-swift-the-tortured-poets-department-the-anthology-review-1235007309/" },
          { name: "Salon: Taylor Swift's 'I Hate It Here' is regressive, not reflective (Nardos Haile)", url: "https://www.salon.com/2024/04/22/taylor-swift-i-hate-it-here-lyrics/" },
          { name: "Official Charts: I Hate It Here", url: "https://www.officialcharts.com/songs/taylor-swift-i-hate-it-here/" },
          { name: "Capital FM: Every Eras Tour Surprise Song (Cardiff one-off)", url: "https://www.capitalfm.com/artists/taylor-swift/eras-tour-surprise-songs-setlist/" }
        ]
      },
    },
    {
      slug: 'thank-you-aimee',
      trackNumber: 24,
      trackTitle: 'thanK you aIMee',
      youtubeId: 'oaBJlKXBvjk', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner', 'Jack Antonoff'],
      note: 'The stylized capitals in the official title spell out a three-letter name — the pettiest typography in the catalog, attached to a song about thanking your bully.',
      summary:
        'A lifelong tormentor gets an ironic acknowledgment: the cruelty built the empire. The K-I-M capitalization is on the official streaming tracklist (fact); the Kardashian reading it triggers has never been stated aloud and never needed to be. It debuted live as an Eras Tour surprise song — June 22, 2024, Wembley Stadium, London — mashed up with "Mean," and charted at No. 23 on the Hot 100 in the album\'s release week.',
      inspiration:
        'The capitalization is documented in the official track listing; the 2016 feud it evokes is public record. Swift has confirmed only that the name is changed and the bully composite.',
      themes: ['bullies as accidental architects', 'ironic gratitude', 'outliving a feud', 'triumph over naysayers'],
      fanLore:
        'Fan/press reading (unconfirmed but typographically assisted): the Kim Kardashian address.',
      easterEggs:
        'The official stylization is the Easter egg — the clue embedded in the tracklist itself, its capitals spelling KIM. The Aug. 15, 2024 limited download edition restyled the title "thank You aimEe," whose capitals spell YE — read by press as a glance at Kanye West. Both name-readings are interpretation, not confirmed.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Thank_You_Aimee',
      sources: [
        wiki('thanK you aIMee', 'Thank_You_Aimee', 'song article: stylization, charts, live history, readings'),
        ALBUM,
        {
          source_url:
            'https://www.billboard.com/music/music-news/taylor-swift-thank-you-aimee-castles-crumbling-hayley-williams-london-eras-tour-1235715917/',
          source_title: "Taylor Swift Debuts 'thanK you aIMee' Live in London",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'First live performance, Wembley, June 22 2024, mashup with "Mean"',
        },
        {
          source_url: 'https://open.spotify.com/track/7ogK4lJDVDMU6A6vYR5rvD',
          source_title: 'thanK you aIMee — official Spotify track metadata',
          publisher: 'Spotify',
          source_type: 'official',
          accessed_at: '2026-07-24',
          reliability_score: 5,
          notes: 'Primary DSP metadata fixing the exact "thanK you aIMee" stylization',
        },
      ],
    },
    {
      slug: 'i-look-in-peoples-windows',
      trackNumber: 25,
      trackTitle: "I Look in People's Windows",
      youtubeId: '6HIA7ouBfGY', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff', 'Patrik Berger'],
      producers: ['Taylor Swift', 'Jack Antonoff', 'Patrik Berger'],
      note: 'A ninety-second miniature about scanning strangers’ windows for a glimpse of someone who left without a forwarding address.',
      summary:
        'The compulsion phase of grief: what if he is at one of these dinner parties, what if a lit window contains the conversation they never finished. Small, strange, and over before it resolves — on purpose.',
      inspiration: null,
      themes: ['searching for the vanished', 'voyeurism of grief', 'miniatures'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [ALBUM],
    },
    {
      slug: 'the-prophecy',
      trackNumber: 26,
      trackTitle: 'The Prophecy',
      youtubeId: '_PsBoqNwYo4', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The Anthology’s rawest plea — bargaining with whoever writes fate to change hers from always-left to finally-kept.',
      summary:
        'She petitions the universe like a medieval supplicant: the cards keep reading alone, and she wants a different spread. Fans rank its bridge among the era’s most devastating.',
      inspiration: null,
      themes: ['fate and bargaining', 'fear of unlovability', 'petitioning the universe'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [ALBUM],
    },
    {
      slug: 'cassandra',
      trackNumber: 27,
      trackTitle: 'Cassandra',
      youtubeId: '0hYY86DmqPY', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The Greek prophetess cursed to prophesy the truth and never be believed — a myth fans read as Taylor’s snake-era epitaph, though she has named no subject.',
      summary:
        'She told the truth, the town lit the pyre, and vindication arrived years late with no apology attached. The myth maps so cleanly onto the snake-era receipts saga that fans and critics treat it as that chapter’s formal epitaph — but Swift has named no one, so the mapping is interpretation, not confirmed. It debuted and peaked at No. 44 on the Hot 100 during TTPD’s all-31-tracks week, and Swift sang it live once: a Toronto Eras Tour mashup with “mad woman” and “I Did Something Bad” (Nov. 22, 2024). See the dossier for the full craft, chart and reception record.',
      inspiration:
        'The Cassandra myth is in-text; the 2016 phone-call scandal and its 2020 full-video vindication are public record, and critics (e.g. Billboard’s Jason Lipshutz) read the song against that period — but Swift has made no on-record statement naming a subject, so the wiring is press/fan reading rather than confirmed autobiography.',
      themes: ['believed too late', 'mob dynamics', 'myth as memoir'],
      fanLore: 'Fan/press reading (near-universal): the 2016 feud timeline as the song’s skeleton — inferred from the myth, not confirmed by Swift.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Cassandra_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Cassandra (Taylor Swift song)',
          'Cassandra_(Taylor_Swift_song)',
          'song article: production, charts, reception, live history',
        ),
        ALBUM,
        {
          source_url:
            'https://ca.billboard.com/music/music-news/taylor-swift-cassandra-mad-woman-i-did-something-bad-eras-tour-1235837621/',
          source_title: 'Taylor Swift Mashes Up "Cassandra," "mad woman" & "I Did Something Bad" at the Eras Tour',
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-28',
          reliability_score: 4,
          notes: 'Toronto Nov. 22, 2024 live mashup; the "rage lineage" reading',
        },
        {
          source_url:
            'https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/',
          source_title: 'Taylor Swift Charts 32 Songs on the Hot 100 in a Single Week',
          publisher: 'Billboard',
          source_type: 'chart_database',
          accessed_at: '2026-07-28',
          reliability_score: 4,
          notes: 'No. 44 Hot 100 debut/peak inside the all-31-tracks week',
        },
      ],
      dossier: {
        whyItMatters: [
          "'Cassandra' is the Anthology's myth-as-memoir centerpiece: Swift borrows the Trojan princess cursed by Apollo to prophesy the truth and never be believed, and critics heard in it her account of the stretch that led to reputation — the 2016 period when a public feud turned much of the culture against her. She names no one; the mapping is the reading reviewers reached for, not a subject she confirmed.",
          "Built with Aaron Dessner at Long Pond, it is a folk-pop piano ballad of soft-glow piano and strings (orchestration recorded in Biarritz with the London Contemporary Orchestra) — a sound closer to folklore and evermore than to the standard edition's synth-pop. It charted inside TTPD's history-making week, when all 31 tracks hit the Hot 100 at once, debuting and peaking at No. 44, and Rolling Stone's Rob Sheffield called it 'one of the most powerful songs Swift and Dessner have crafted.'",
        ],
        meaning: {
          confirmed: [
            "Track 27 on The Tortured Poets Department: The Anthology (April 19, 2024), written and produced by Taylor Swift and Aaron Dessner. Dessner played piano, electric guitar, keyboards, percussion, synth bass and synthesizer, with orchestration by the London Contemporary Orchestra; it was recorded at Long Pond Studios (Hudson Valley) with strings cut in Biarritz, mixed at MixStar (Virginia Beach) and mastered at Sterling Sound.",
            "It debuted and peaked at No. 44 on the Billboard Hot 100 and the Global 200 during the album's record week, also reaching No. 44 in Canada and No. 49 in Australia.",
            "It was performed live once — an Eras Tour surprise-song mashup with folklore's 'mad woman' and reputation's 'I Did Something Bad' in Toronto on November 22, 2024.",
          ],
          supported: [
            "The song adapts the Cassandra myth directly — the seer whose warnings go unheeded until the city falls — and threads it with the imagery of a woman condemned by a mob. Billboard's Jason Lipshutz read the lyric as insight into 'the period in Swift's life that led to her album Reputation,' when the feud with Kanye West and Kim Kardashian 'turned many against her,' pointing to its lines about supposed supporters who did not take her side.",
            "Reception ran mixed-to-strong: Rolling Stone's Rob Sheffield called it one of the most powerful Swift–Dessner songs and Beats Per Minute's John Wohlmacher and USA Today's Melissa Ruggieri praised its 'pretty' piano, while Vulture's Craig Jenkins found the central metaphor 'a stretch,' Slate's Carl Wilson faulted Swift for criticizing readings-into-songs while doing the same, and The Hollywood Reporter ranked it the album's weakest track.",
          ],
          fanTheories: [
            "Swift has made no on-record statement naming a subject for 'Cassandra' — not in the TTPD prologue, the liner notes, or any interview — so the near-universal reading of it as her 2016-feud epitaph is fan and press interpretation, not confirmed autobiography. The myth is in-text; the celebrity mapping is inferred.",
          ],
        },
        connections: [
          {
            relatedId: "song:whos-afraid-of-little-old-me",
            label: "Who's Afraid of Little Old Me?",
            why: "Its Anthology sibling and closest neighbor on the record — both are Dessner-built portraits of a woman remade monstrous by other people's stories, 'Little Old Me' seething where 'Cassandra' mourns being disbelieved.",
          },
          {
            relatedId: "song:mad-woman",
            label: "mad woman",
            why: "The folklore forerunner of the disbelieved-woman song and its Toronto live-mashup partner: Billboard grouped 'Cassandra,' 'mad woman' and 'I Did Something Bad' as one rage lineage.",
          },
          {
            relatedId: "song:i-did-something-bad",
            label: "I Did Something Bad",
            why: "The reputation track from the very feud 'Cassandra' is read against, and the third song braided into its Eras Tour Toronto mashup — the rage that answered the pyre.",
          },
        ],
        live: [
          {
            date: "November 22, 2024",
            event: "The Eras Tour — Toronto (Rogers Centre)",
            note: "Its only live performance — an acoustic surprise-song mashup with folklore's 'mad woman' and reputation's 'I Did Something Bad,' three disbelieved/enraged-woman songs sung as one.",
          },
        ],
        voices: [
          {
            who: "Rob Sheffield",
            context: "Rolling Stone",
            note: "'One of the most powerful songs Taylor and Dessner have crafted.'",
          },
          {
            who: "Jason Lipshutz",
            context: "Billboard",
            note: "Read it as insight into the reputation-era period when the West/Kardashian feud 'turned many against her.'",
          },
        ],
        sources: [
          { name: "Cassandra (Taylor Swift song) — Wikipedia", url: "https://en.wikipedia.org/wiki/Cassandra_(Taylor_Swift_song)" },
          { name: "Billboard: Cassandra, mad woman and I Did Something Bad — the rage lineage (Eras Tour Toronto)", url: "https://ca.billboard.com/music/music-news/taylor-swift-cassandra-mad-woman-i-did-something-bad-eras-tour-1235837621/" },
          { name: "Billboard: Taylor Swift Charts 32 Songs on the Hot 100 in One Week", url: "https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/" },
          { name: "Rolling Stone: TTPD — The Anthology Review", url: "https://www.rollingstone.com/music/music-album-reviews/taylor-swift-the-tortured-poets-department-the-anthology-review-1235007309/" },
        ],
      },
    },
    {
      slug: 'peter',
      trackNumber: 28,
      trackTitle: 'Peter',
      youtubeId: 'Mxxswu7V1Us', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'Solo-written Peter Pan correspondence — Wendy finally closes the window on the boy who kept promising to grow up.',
      summary:
        'She kept the light on for a man perpetually twenty-five in his own head; the song is her formally releasing the promise. Fans flag the direct callback to cardigan, where the same Peter first lost his Wendy.',
      inspiration:
        'The Peter Pan framework is in-text; the cardigan connection is a documented fan-canon link Swift seeded herself by reusing the names.',
      themes: ['waiting expired', 'boys who won’t grow up', 'closing the window'],
      easterEggs:
        'A four-years-later answer to cardigan’s Peter-and-Wendy line — one of the catalog’s cleanest long-range callbacks. A solo-written piano ballad with London Contemporary Orchestra strings; played live on piano in Stockholm (May 17, 2024) and Toronto (Nov. 15, 2024, mashed with “evermore”), and it debuted at No. 46 on the Hot 100.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [
        ALBUM,
        {
          source_url: 'https://www.rollingstone.com/music/music-album-reviews/taylor-swift-the-tortured-poets-department-the-anthology-review-1235007309/',
          source_title: 'Taylor Swift: The Tortured Poets Department — The Anthology Review',
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Rob Sheffield calls "Peter" the Anthology\'s show-stopper; ties it to folklore\'s "cardigan"',
        },
      ],
      dossier: {
        whyItMatters: [
          "A solo-written piano ballad addressed from Wendy's side of the window to a man perpetually twenty-five in his own head — Swift formally releasing a promise she kept far too long. It is one of the catalog's cleanest long-range callbacks, answering folklore's 'cardigan' and its Peter-losing-Wendy line four years later.",
          "Rob Sheffield (Rolling Stone) called it the Anthology's 'show-stopper'; other rankings put it near the bottom — a track that divided critics as sharply as it moved fans."
        ],
        meaning: {
          confirmed: [
            "Track 28 on The Tortured Poets Department: The Anthology (April 19, 2024), written solely by Taylor Swift and produced with Aaron Dessner; a piano ballad with orchestral strings by the London Contemporary Orchestra conducted by Robert Ames, from the Dessner-led Long Pond sessions.",
            "It debuted at No. 46 on the Billboard Hot 100 (chart dated May 4, 2024), one of all 31 Anthology tracks to chart at once in the record week.",
            "An Eras Tour surprise song twice on piano: Stockholm (May 17, 2024) and Toronto (Nov. 15, 2024), the latter as a mashup with 'evermore.'"
          ],
          supported: [
            "The song builds the J. M. Barrie Peter Pan frame — Wendy waiting for a boy who won't grow up — and its callback to 'cardigan' is a critic-documented link (Sheffield ties the two directly). Reception split: Rolling Stone named it a standout, while a Hollywood Reporter ranking placed it second-to-last.",
            "The 'lost boys' / never-growing-up motif recurs across Swift's childhood songs; whether the Peter/Wendy naming was deliberately seeded across both 'Peter' and 'cardigan' is a fan-and-critic inference — no Swift or Dessner statement on the song is on record."
          ],
          fanTheories: [
            "Some outlets read 'Peter' (with 'cardigan') as pointed at a specific past relationship, citing a publicly performed 'cardigan' mouthed-lyric moment; this is unconfirmed fan-and-press interpretation and Swift has named no one. Separately, actor Peter Krause (9-1-1) jokingly 'responded' to sharing the title in a social clip — a gag, not a real connection to the song."
          ]
        },
        connections: [
          {
            relatedId: "song:cardigan",
            label: "cardigan",
            why: "The song 'Peter' answers: folklore's 'cardigan' introduced the Peter-losing-Wendy image, and 'Peter' closes that window four years later (a critic-drawn link)."
          },
          {
            relatedId: "song:evermore",
            label: "evermore",
            why: "Swift's own live pairing — she mashed 'Peter' with 'evermore' in Toronto, two piano dirges about a grief that finally, barely lifts."
          },
          {
            relatedId: "song:seven",
            label: "seven",
            why: "The other Dessner childhood song and the never-grow-up motif's origin point; a thematic companion to 'Peter's' arrested boyhood (a fan-and-thematic grouping)."
          }
        ],
        sources: [
          { name: "The Tortured Poets Department — Wikipedia (Anthology credits, 'Peter')", url: "https://en.wikipedia.org/wiki/The_Tortured_Poets_Department" },
          { name: "Rolling Stone: The Tortured Poets Department — The Anthology Review", url: "https://www.rollingstone.com/music/music-album-reviews/taylor-swift-the-tortured-poets-department-the-anthology-review-1235007309/" },
          { name: "The Hollywood Reporter: Every Song on 'The Tortured Poets Department,' Ranked", url: "https://www.hollywoodreporter.com/lists/taylor-swift-the-tortured-poets-department-songs-ranked/" }
        ]
      },
    },
    {
      slug: 'the-bolter',
      trackNumber: 29,
      trackTitle: 'The Bolter',
      youtubeId: 'bAi80EylyXQ', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'A character study of the woman who always runs — named for the aristocratic nickname history gave serial escapees, and grinning about it.',
      summary:
        'A serial vanisher who feels most alive mid-getaway: every relationship ends with the door swinging. Press traced the title to the Idina Sackville-style Bolter archetype of English society lore (a reading, not a footnote); fans read the shoe as autobiographical and half-proud, though the near-drowning-at-six is the character’s origin myth — the lyric flags it "by all accounts" — not Swift’s documented biography. It debuted and peaked at No. 47 on the Billboard Hot 100 during the album’s all-31-tracks chart week; Rolling Stone’s Rob Sheffield grouped it with the Anthology’s "stark piano narratives" about women seeking revenge.',
      inspiration:
        'The Bolter as an English-society archetype (popularized by Frances Osborne’s biography of Idina Sackville) is the documented reference point critics reached for; the nickname reached the culture through Nancy Mitford’s novels before Osborne’s 2008 book.',
      themes: ['flight response', 'self-mythologized escape', 'freedom versus intimacy'],
      easterEggs:
        'Played live twice on the 2024 Eras Tour, both as acoustic-guitar surprise mashups — with "Getaway Car" at its Edinburgh live debut (June 7) and "Cornelia Street" in Indianapolis (Nov 3).',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [
        {
          source_url: 'https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/',
          source_title: 'Taylor Swift Charts 32 Songs on the Hot 100 in One Week — a Record',
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: '"The Bolter" debuted and peaked at No. 47 on the Hot 100 (chart dated May 4, 2024).',
        },
        {
          source_url: 'https://www.rollingstone.com/music/music-news/taylor-swift-the-bolter-crazier-live-debut-eras-tour-1235036115/',
          source_title: "See Taylor Swift Debut 'The Bolter,' 'Crazier' Live at Edinburgh, Scotland Show",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Live debut Edinburgh June 7, 2024 mashed with "Getaway Car" (shared need-to-run-away theme); returned Indianapolis Nov 3 with "Cornelia Street".',
        },
        {
          source_url: 'https://www.rollingstone.com/music/music-album-reviews/taylor-swift-the-tortured-poets-department-the-anthology-review-1235007309/',
          source_title: 'Taylor Swift Delivers an Epic Double Album with TTPD: The Anthology',
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Rob Sheffield groups "The Bolter" with the Anthology\'s "stark piano narratives" about women seeking revenge.',
        },
        {
          source_url: 'https://www.aol.com/news/taylor-swift-song-bolter-based-212636465.html',
          source_title: "Is Taylor Swift's song 'The Bolter' based on a true story?",
          publisher: 'AOL / Yahoo Entertainment',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: 'Reads the song as a third-person character sketch; no verified account of Swift nearly drowning at six.',
        },
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "One of the Anthology's most-praised character studies: a portrait of the serial escapee who feels most alive mid-getaway, grinning as every relationship ends with the door swinging. It is Swift writing a type rather than a confession — the album's clearest example of the fictional 'poet' framing she said the record runs on.",
          "It sits on the Dessner-produced back half of the double album as a stark piano narrative, and became a twice-played Eras Tour surprise song despite never being a single — the kind of deep cut fans argued deserved more than bonus-track billing.",
        ],
        meaning: {
          confirmed: [
            "Track on The Tortured Poets Department: The Anthology (April 19, 2024), written and produced by Swift with Aaron Dessner. During the album's record debut week — when all 31 tracks charted at once — 'The Bolter' debuted and peaked at No. 47 on the Billboard Hot 100 (chart dated May 4, 2024).",
            "It was performed live only twice, both as acoustic-guitar surprise-song mashups on the 2024 Eras Tour: its debut at Edinburgh on June 7, 2024, paired with 'Getaway Car,' and a return in Indianapolis on November 3, 2024, paired with 'Cornelia Street.'",
          ],
          supported: [
            "Rolling Stone's Rob Sheffield grouped it with the Anthology's 'stark piano narratives' about different kinds of 'mad women' seeking revenge — reading the Bolter as a woman treated as a 'sexual toy' who runs before she can be discarded. Track-by-track reviews frequently named it an Anthology highlight for that character writing.",
          ],
          fanTheories: [
            "The title is widely traced to the English-society 'Bolter' archetype — the serial marriage-escapee popularized by Frances Osborne's 2008 biography of Idina Sackville, a nickname that reached the culture earlier through Nancy Mitford's novels — but that is the reference critics reached for, not one Swift or her team has confirmed.",
            "The near-drowning image ('by all accounts, she almost drowned / when she was six in frigid water') is the character's origin myth, flagged in-lyric as secondhand ('by all accounts'); there is no verified account of Swift nearly drowning at six, so the detail reads as the fictional Bolter's, not documented autobiography.",
          ],
        },
        connections: [
          {
            relatedId: 'song:getaway-car',
            label: 'Getaway Car',
            why: "Its Edinburgh live-debut mashup partner (cross-link candidate #1445) and its thematic twin — both are runaway songs about leaving before you can be left.",
          },
          {
            relatedId: 'song:cornelia-street',
            label: 'Cornelia Street',
            why: "Its other documented Eras mashup partner (Indianapolis, Nov 3, 2024) — the settled-in love of Cornelia Street set against the Bolter who could never stay.",
          },
        ],
        live: [
          {
            date: '2024-06-07',
            event: 'The Eras Tour — Edinburgh (Murrayfield)',
            note: "Live debut, an acoustic-guitar surprise-song mashup with 'Getaway Car.'",
          },
          {
            date: '2024-11-03',
            event: 'The Eras Tour — Indianapolis (Lucas Oil Stadium)',
            note: "Its only other performance — a surprise-song mashup with 'Cornelia Street.'",
          },
        ],
        voices: [
          {
            who: 'Rob Sheffield',
            context: 'Rolling Stone',
            note: "Grouped it with the Anthology's 'stark piano narratives' of women seeking revenge — the Bolter as the one treated as a 'sexual toy' who runs first.",
          },
        ],
        sources: [
          { name: 'Billboard: Taylor Swift Charts 32 Songs on the Hot 100 in One Week', url: 'https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/' },
          { name: "Rolling Stone: See Taylor Swift Debut 'The Bolter,' 'Crazier' Live at Edinburgh", url: 'https://www.rollingstone.com/music/music-news/taylor-swift-the-bolter-crazier-live-debut-eras-tour-1235036115/' },
          { name: 'Rolling Stone: TTPD — The Anthology Review', url: 'https://www.rollingstone.com/music/music-album-reviews/taylor-swift-the-tortured-poets-department-the-anthology-review-1235007309/' },
          { name: "AOL/Yahoo: Is Taylor Swift's 'The Bolter' based on a true story?", url: 'https://www.aol.com/news/taylor-swift-song-bolter-based-212636465.html' },
        ],
      },
    },
    {
      slug: 'robin',
      trackNumber: 30,
      trackTitle: 'Robin',
      youtubeId: 'FQyEZZPbOb0', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The gentlest thing on the Anthology — a lullaby promising to guard a child’s unbothered world for as long as possible.',
      summary:
        'Addressed to a small boy in swing-set-and-dragonfly years: the adults will hold the sadness so he does not have to know it exists yet. Widely reported to be named for co-writer Aaron Dessner’s young son Robin — Dessner has a son of that name (he said so himself in 2016), though a direct statement that this song is for him is not on the public record. It debuted at No. 55 on the Hot 100 in the album’s record week, and Swift played it live once, as a Zurich surprise-song mashup with “Never Grow Up” (July 10, 2024).',
      inspiration:
        'Strongly reported as named for co-writer Dessner’s young son Robin; the son’s name is family-published, the song-dedication itself uncomfirmed by Dessner on record.',
      themes: ['protected childhood', 'buying time for innocence', 'tenderness'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [
        ALBUM,
        {
          source_url: 'https://americansongwriter.com/every-song-on-taylor-swifts-the-tortured-poets-department-has-charted-on-the-billboard-hot-100/',
          source_title: "Every Song on Taylor Swift's 'The Tortured Poets Department' Has Charted on the Billboard Hot 100",
          publisher: 'American Songwriter',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: '"Robin" debuted at No. 55 on the Hot 100',
        },
        {
          source_url: 'https://www.hollywoodreporter.com/lists/taylor-swift-the-tortured-poets-department-songs-ranked/',
          source_title: "Every Song on Taylor Swift's 'The Tortured Poets Department,' Ranked",
          publisher: 'The Hollywood Reporter',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: 'Ranked 7th; likened to "The Best Day" and "seven"',
        },
      ],
      dossier: {
        whyItMatters: [
          "The gentlest thing on the Anthology — a lullaby that promises to guard a small boy's unbothered world (swing sets, dragonflies, 'covered in mud, you look ridiculous') for as long as the adults can hold the sadness at bay. It closes the deluxe run on a note of pure tenderness.",
          "Critics grouped it with Swift's own childhood songs; the Hollywood Reporter ranked it 7th of the album and likened it to 'The Best Day' and 'seven.'"
        ],
        meaning: {
          confirmed: [
            "Track 30 on The Tortured Poets Department: The Anthology (April 19, 2024), written and produced by Taylor Swift with Aaron Dessner — a piano ballad opening on a bright, near-music-box figure, from the Dessner-led second half.",
            "It charted: 'Robin' debuted at No. 55 on the Billboard Hot 100 (chart dated May 4, 2024), one of the 31 Anthology tracks to enter the chart at once.",
            "It was performed live once — an Eras Tour surprise-song mashup with 'Never Grow Up' in Zurich (July 10, 2024)."
          ],
          supported: [
            "It reads as a portrait of any protected childhood, which is the dominant critical framing; the Hollywood Reporter placed it among the album's best and tied it to Swift's earlier childhood songs.",
            "Co-writer Aaron Dessner has a young son named Robin — a fact he volunteered himself (he posted in 2016 about producing a track two days after his son Robin was born) — and the song is widely reported to be named for the boy."
          ],
          fanTheories: [
            "The 'named for Dessner's son' account, though near-universal in coverage, rests on the family-published name plus reporting; a direct Dessner statement that this song was written for his son is not on the public record, so the naming is best treated as strongly-reported rather than author-confirmed. Any tie of the lyric to that specific child (beyond the shared name) is inference."
          ]
        },
        connections: [
          {
            relatedId: "song:never-grow-up",
            label: "Never Grow Up",
            why: "Swift's own live pairing — she mashed the two in Zurich; both are a grown woman begging time to slow down and leave a child's innocence intact."
          },
          {
            relatedId: "song:seven",
            label: "seven",
            why: "Dessner's other childhood song, and the one critics named alongside 'Robin' — the same fierce tenderness toward a kid's unguarded world (a critic-drawn link)."
          },
          {
            relatedId: "song:the-best-day",
            label: "The Best Day",
            why: "The Hollywood Reporter grouped 'Robin' with it as childhood-evoking; where 'Robin' guards a boy's innocence, 'The Best Day' is the grown child's thank-you for that guarding."
          }
        ],
        sources: [
          { name: "The Tortured Poets Department — Wikipedia (Anthology credits, 'Robin')", url: "https://en.wikipedia.org/wiki/The_Tortured_Poets_Department" },
          { name: "American Songwriter: Every Song on 'The Tortured Poets Department' Has Charted on the Hot 100", url: "https://americansongwriter.com/every-song-on-taylor-swifts-the-tortured-poets-department-has-charted-on-the-billboard-hot-100/" },
          { name: "The Hollywood Reporter: Every Song on 'The Tortured Poets Department,' Ranked", url: "https://www.hollywoodreporter.com/lists/taylor-swift-the-tortured-poets-department-songs-ranked/" }
        ]
      },
    },
    {
      slug: 'the-manuscript',
      trackNumber: 31,
      trackTitle: 'The Manuscript',
      youtubeId: 'iY6Qhlua8Zw', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The solo-written final word of the whole double album — an old heartbreak reread years later, then formally handed over to the readers.',
      summary:
        'She revisits the draft of a long-ago too-young romance, watches younger women live its echoes, and concludes the story stopped being hers the moment it became everyone’s. The closing thesis of the TTPD project: the pain was hers, the manuscript is ours.',
      inspiration:
        'Functions as the album’s stated epilogue — its closing line about the manuscript’s ownership is the era’s mission statement, quoted in essentially every review.',
      themes: ['art outliving pain', 'handing over the story', 'epilogue'],
      easterEggs:
        'Fans map its verses onto the All Too Well mythology — the manuscript rereading as the scarf saga’s final form (fan reading, unconfirmed).',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [ALBUM],
    },
];

export default {
  eraSlug: 'tortured-poets',
  tracks: TRACKS,
};
