// Per-song dossiers for The Tortured Poets Department era (issue #440 pattern),
// keyed by track slug and attached in tortured-poets.mjs. Added by the depth
// engine's Answerer (shard 5, 2026-07-21) to answer curiosity ledgers #1095
// (So Long, London), #1026 (How Did It End?) and #1099 (Fortnight) —
// specifically their cross-link questions, which resolve through a dossier's
// `connections`.
// Fact-checked this pass: every source URL was fetched and supports its claim;
// confirmed tier = Swift's own public statements or hard documented facts only;
// all relationship readings are labeled fan/press theory, never fact, and no
// private-life specifics are asserted (per docs/content-ops/privacy-redlines.md).
// No lyric quotations. Internal song:/moment: connection ids all resolve and
// are asserted by apps/web/lib/longlive/tracks.test.ts.
export default {
  "so-long-london": {
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

  "how-did-it-end": {
    whyItMatters: [
      "As track 21 it opens 'The Anthology,' the fifteen-song second half that surprise-dropped at 2 a.m. ET on release night. The song turns a breakup into a coroner's report performed for an audience of gossips — the couple, their friends, the fans and the press all leaning in for the cause of death — and its sustained clinical metaphor (a 'fatal fever,' a 'death rattle') is the detail reviewers single out.",
      "It punched above its bonus-track billing. It reached No. 35 on the Billboard Hot 100 during the album's record-setting chart week, Variety later ranked it among Swift's best songs and The Independent named it one of 2024's best, and Swift chose it as an early Anthology cut to bring to the stage — live-debuting it as a solo piano ballad at the final Stockholm Eras Tour show on May 19, 2024."
    ],
    meaning: {
      confirmed: [
        "Track 21, the opener of 'The Anthology' — the fifteen-song second half of The Tortured Poets Department that surprise-released at 2 a.m. ET on April 19, 2024 — written and produced by Swift with Aaron Dessner.",
        "It reached No. 35 on the Billboard Hot 100 during the album's record week, and was first performed live on May 19, 2024 at the final Stockholm Eras Tour show as a solo piano ballad."
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
      }
    ]
  },

  "fortnight": {
    whyItMatters: [
      "Fortnight is the album's thesis single and its front door: released April 19, 2024 as the lead single alongside the record, it debuted at No. 1 on the Billboard Hot 100 — Swift's 12th chart-topper and seventh No. 1 debut — and anchored her record top-14 opening week. Post Malone was Swift's stated first-choice feature for the album's opener, and the two trading the refrain 'I love you, it's ruining my life' set the record's tone of numbed, permanent damage: a fortnight of feeling everything, then lawns and small talk forever.",
      "Its reach was historic on two fronts. Within a day of release the song set Spotify's all-time single-day streaming record for a track (about 25.2 million global streams), later logged with Guinness World Records; months on, the Swift-directed video swept the 2024 MTV VMAs — Video of the Year, Best Collaboration, Best Direction, Best Editing and Song of the Summer — five of the seven trophies Swift took that night, the most any artist has won at a single VMAs ceremony."
    ],
    meaning: {
      confirmed: [
        "The Tortured Poets Department's lead single (April 19, 2024), written by Swift, Post Malone and Jack Antonoff — a muted, 1980s-leaning synth-pop ballad built on a pulsing eighth-note synth bass with Swift singing much of it near-monotone.",
        "Post Malone recorded his parts at his Los Angeles home studio after Swift brought him the track; the song debuted atop the Hot 100 and spent two consecutive weeks at No. 1, and set Spotify's single-day streaming record for a song on release day.",
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
        note: "Folded into the tour's new TTPD segment from the European leg's opening night; Swift performs it solo to Post Malone's recorded vocals, staged around a typewriter. No live performance with Post Malone has been documented."
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
  }
};
