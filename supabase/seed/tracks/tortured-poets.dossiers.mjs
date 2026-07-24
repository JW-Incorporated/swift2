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
  },

  "the-smallest-man-who-ever-lived": {
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

  "clara-bow": {
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

  // Added 2026-07-24 by the depth engine's Answerer (shard 6) to answer
  // curiosity ledgers #1271, #1193, #1250, #1283, #1110 and #1299 — song-depth
  // gaps (charts, production, reception, live history, cross-links). Every fact
  // is sourced below; confirmed = hard documented fact or Swift's own public
  // statement, supported = attributed criticism, fanTheories = fan/press
  // readings never confirmed by Swift. No lyric quotations. All song:/moment:
  // connection ids resolve (asserted by tracks.test.ts).
  "my-boy-only-breaks-his-favorite-toys": {
    whyItMatters: [
      "Track 3 is one of only two songs on the standard Tortured Poets Department that Swift wrote entirely alone — the other is 'Who's Afraid of Little Old Me?' — and it hides its bleakest idea, rationalizing mistreatment as proof of being loved, inside the brightest production on that stretch of the record. Jack Antonoff built the bed, programming the track and playing bass, drums, electric guitar and a rack of synths (Moog bass, Korg M1, Juno-60) under Swift's piano; the bounce is the point, a sugar coating critics kept flagging (Vulture called it 'sadder than you'd think').",
      "It was no throwaway commercially: it debuted and peaked at No. 6 on both the Billboard Hot 100 and the Global 200 during the album's record top-14 opening week — one of the higher-charting standard cuts — and later drew Platinum (Australia), Gold (New Zealand) and Silver (UK) certifications."
    ],
    meaning: {
      confirmed: [
        "Track 3 on The Tortured Poets Department (April 19, 2024), written solely by Swift and produced by Swift with Jack Antonoff; it debuted and peaked at No. 6 on the Billboard Hot 100 as part of her record top-14 chart sweep.",
        "Swift described it in her Amazon Music track commentary as a metaphor from a broken toy's point of view — being someone's favorite until they break you and stop wanting to play — about denial inside a toxic relationship."
      ],
      supported: [
        "Reviewers split on it, and the bright-music-against-bleak-words contrast was the recurring hook: Billboard ranked it 17th of the album's 31 tracks and called it a 'big, booming song' that 'deserves the stadium treatment,' the Guardian judged the writing 'deftly written,' while Pitchfork faulted the central conceit as 'working a schoolyard premise until it cracks.'"
      ],
      fanTheories: [
        "Fans and press most often read the 'favorite toys' framing as Swift's brief, rekindled 2023 romance with Matty Healy, but she has named no subject; only the toy metaphor itself is something she has addressed on record."
      ]
    },
    connections: [
      {
        relatedId: "song:whos-afraid-of-little-old-me",
        label: "Who's Afraid of Little Old Me?",
        why: "The album's other fully solo-written song — the same unsparing self-portraiture, aimed outward at the people who made her rather than inward at the damage they left."
      },
      {
        relatedId: "song:loml",
        label: "loml",
        why: "Both curdle devotion into wreckage: loml renames 'love of my life' as 'loss of my life,' the same self-deception this song diagnoses as being the toy that gets broken precisely because it was the favorite."
      }
    ],
    live: [
      {
        date: "May 10, 2024",
        event: "The Eras Tour — Paris (Paris La Défense Arena)",
        note: "Live debut as a piano surprise song during the European leg; revisited August 17, 2024 in London as a mashup with 'Coney Island.'"
      }
    ],
    sources: [
      { name: "My Boy Only Breaks His Favorite Toys — Wikipedia", url: "https://en.wikipedia.org/wiki/My_Boy_Only_Breaks_His_Favorite_Toys" },
      { name: "Billboard: Taylor Swift Claims Record Top 14 Spots on the Hot 100", url: "https://www.billboard.com/lists/taylor-swift-hot-100-top-14-fortnight-post-malone-record/" },
      { name: "Billboard: Taylor Swift's Amazon Music Track-by-Track Commentary", url: "https://www.billboard.com/music/pop/taylor-swift-tortured-poets-department-track-by-track-commentary-amazon-music-1235662357/" },
      { name: "Billboard: The Tortured Poets Department — All 31 Tracks Ranked", url: "https://www.billboard.com/lists/taylor-swift-the-tortured-poets-department-tracks-ranked/my-boy-only-breaks-his-favorite-toys/" }
    ]
  },

  "the-tortured-poets-department": {
    whyItMatters: [
      "The album's title track and thesis: two self-styled poets who deflate their own myth in real time. The most-quoted lines undercut the pose directly — the couple are 'modern idiots,' not Dylan Thomas and Patti Smith, and 'this ain't the Chelsea Hotel,' the mythic New York artists' residence where Thomas fell fatally ill and Smith later lived (chronicled in Just Kids). Swift casts herself, per the packaging, as 'Chairman of the Tortured Poets Department' and then spends the song puncturing the title.",
      "Two of its name-checks became the era's biggest talking points. Patti Smith responded publicly and graciously; Charlie Puth, shouted out in the bridge, resurfaced weeks later with new music framed as an answer to it. Never released as a single, it still debuted at No. 4 on the Hot 100 and No. 3 in the UK on album-week streaming alone — the album's third-highest-charting cut."
    ],
    meaning: {
      confirmed: [
        "Track 2 on The Tortured Poets Department (April 19, 2024), written and produced by Swift with Jack Antonoff; recorded at Conway (LA) and Electric Lady (NY), a spare synth-pop build around drum-machine beats and synth arpeggios.",
        "Not a single, it debuted and peaked at No. 4 on the Billboard Hot 100 (No. 3 UK, No. 3 Global 200) on release-week streaming, part of Swift's record sweep of the entire Hot 100 top 14.",
        "Patti Smith answered the name-check on Instagram on April 20, 2024, posting photos of herself reading Dylan Thomas and writing that she was moved to be mentioned in the company of the great Welsh poet — the era's nicest literary footnote.",
        "Charlie Puth, name-checked in the bridge, stayed quiet about two weeks, then teased his single 'Hero' on May 3, 2024 framing the shout-out as the push he needed; he called the mention surreal and said he first assumed it was AI."
      ],
      supported: [
        "Critics read the song as deliberate self-satire: Pitchfork called it a 'winking' track that mocks Swift's self-seriousness, and the New York Times' Lindsay Zoladz praised it as 'chatty, radiant' even while faulting the album's editing. Antonoff, who plays Juno-60, cello and Korg M1 on it, has refused to discuss the sessions in press (NME: 'You know I don't talk about that')."
      ],
      fanTheories: [
        "The lyric's 'Lucy and Jack' first names were read as Lucy Dacus and Jack Antonoff; Dacus confirmed in March 2025 that she is the 'Lucy' and that Swift texted her for approval before release, while Antonoff has not publicly addressed being the 'Jack.'"
      ]
    },
    connections: [
      {
        relatedId: "song:clara-bow",
        label: "Clara Bow",
        why: "The album's two exercises in measuring the self against a named real figure — Clara Bow weighs Swift against a discarded silent-film 'It girl,' the title track weighs the couple against Dylan Thomas and Patti Smith and finds them wanting."
      },
      {
        relatedId: "song:my-boy-only-breaks-his-favorite-toys",
        label: "My Boy Only Breaks His Favorite Toys",
        why: "The track it hands off to — the album's mission-statement melodrama flowing straight into its first full heartbreak, both wrapped in Antonoff's bright synth-pop."
      }
    ],
    live: [
      {
        date: "May 25, 2024",
        event: "The Eras Tour — Lisbon (Estádio da Luz)",
        note: "Live debut on guitar as an acoustic surprise-song mashup with 'Now That We Don't Talk' ('This is actually the first time I'm ever playing this one live'). Played once more on December 7, 2024 in Vancouver, mashed with 'Maroon' — it was never part of the main choreographed TTPD 'Female Rage' set."
      }
    ],
    sources: [
      { name: "The Tortured Poets Department (song) — Wikipedia", url: "https://en.wikipedia.org/wiki/The_Tortured_Poets_Department_(song)" },
      { name: "The Hollywood Reporter: Patti Smith Thanks Taylor Swift for Her Lyric", url: "https://www.hollywoodreporter.com/music/music-news/patti-smith-thanks-taylor-swift-tortured-poets-department-lyric-1235878480/" },
      { name: "Variety: Charlie Puth Responds to Taylor Swift's Mention With New Song 'Hero'", url: "https://variety.com/2024/music/news/charlie-puth-taylor-swift-the-tortured-poets-department-hero-1235974552/" },
      { name: "Variety: Lucy Dacus Confirms the 'Tortured Poets Department' Lyric Is About Her", url: "https://variety.com/2025/music/news/lucy-dacus-tortured-poets-department-taylor-swift-lyric-1236351456/" },
      { name: "Billboard: Taylor Swift Plays the Title Track Live for the First Time in Lisbon", url: "https://www.billboard.com/music/music-news/taylor-swift-tortured-poets-department-song-live-now-that-we-dont-talk-1235693169/" }
    ]
  },

  "i-can-fix-him-no-really-i-can": {
    whyItMatters: [
      "At 2 minutes 36 seconds it is the shortest song on the standard Tortured Poets Department, a wry country-western vignette that critics read as a send-up of the savior complex: the narrator parades a project of a man to a horrified audience, sure she alone sees the potential, until the closing line pulls the rug and concedes she probably can't. Rolling Stone grouped it among the album's 'witty reports on falling in love with needy men who don't reciprocate.'",
      "The 'saloon-door twang' is an effect, not an ensemble: the credits list no banjo or pedal steel, just Antonoff's twangy tremolo guitars over a drum machine and keyboards. It charted at No. 20 on the Hot 100 in the release-week deluge and reached the Australian top 20 (certified Gold there)."
    ],
    meaning: {
      confirmed: [
        "Track 11 on The Tortured Poets Department (April 19, 2024), written and produced by Swift with Jack Antonoff, recorded at Conway (LA), Electric Lady (NYC) and Rue Boyer (Paris); at 2:36 it is the shortest track on the standard album.",
        "It debuted and peaked at No. 20 on the Billboard Hot 100 (and Global 200), reached No. 19 in Australia (ARIA, Gold) and charted in Canada and the UK — a release-week entry, never a single.",
        "It has been performed live twice, both as Eras Tour acoustic surprise-song mashups: Madrid on May 29, 2024 (with 'Sparks Fly') and Warsaw on August 2, 2024 (with 'I Can See You')."
      ],
      supported: [
        "Reception was mixed-to-positive, with the humor and self-awareness the common note: Billboard highlighted the 'skeletal production ... defined by forlorn guitar strums,' and NME flagged its 'intriguing elements of country and western.' The final-line reversal is the detail critics single out as the joke landing."
      ],
      fanTheories: [
        "Fans and press tie the 'him' to Matty Healy as part of TTPD's Healy-adjacent material, but Swift has named no subject and the song works equally as an archetype of the self-destructive 'bad boy' fantasy; the reading is speculation."
      ]
    },
    connections: [
      {
        relatedId: "song:loml",
        label: "loml",
        why: "The track it runs straight into — a deliberate tonal drop from the two-and-a-half-minute country joke to a six-minute piano dirge, the album's sharpest sequencing whiplash."
      },
      {
        relatedId: "song:the-smallest-man-who-ever-lived",
        label: "The Smallest Man Who Ever Lived",
        why: "The other side of the same disillusion — I Can Fix Him laughs at the savior fantasy going in, The Smallest Man delivers the fury once the man proves unfixable."
      }
    ],
    live: [
      {
        date: "May 29, 2024",
        event: "The Eras Tour — Madrid (Santiago Bernabéu)",
        note: "Live debut as an acoustic surprise-song mashup with 'Sparks Fly'; played again August 2, 2024 in Warsaw as a mashup with 'I Can See You.'"
      }
    ],
    sources: [
      { name: "I Can Fix Him (No Really I Can) — Wikipedia", url: "https://en.wikipedia.org/wiki/I_Can_Fix_Him_(No_Really_I_Can)" },
      { name: "Billboard: The Tortured Poets Department — All 31 Tracks Ranked", url: "https://www.billboard.com/lists/taylor-swift-the-tortured-poets-department-tracks-ranked/" },
      { name: "Rolling Stone (AU): The Tortured Poets Department Review (Rob Sheffield)", url: "https://au.rollingstone.com/music/music-album-reviews/taylor-swift-the-tortured-poets-department-review-58162/" },
      { name: "American Songwriter: Behind the Meaning of 'I Can Fix Him (No Really I Can)'", url: "https://americansongwriter.com/behind-the-meaning-of-taylor-swifts-i-can-fix-him-no-really-i-can/" }
    ]
  },

  "i-can-do-it-with-a-broken-heart": {
    whyItMatters: [
      "The album's clearest bit of autobiography set to its most euphoric beat: an electropop-disco anthem about performing the biggest tour on earth night after night while privately falling apart. Critics kept naming the clash of bright production and bleak lyric as the point — Billboard ranked it 8th of the album's 31 tracks, calling it 'rollicking, snarky and strikingly funny.'",
      "It is the rare TTPD deep cut that became a full single campaign: it peaked at No. 3 on the Hot 100 and stayed 31 weeks, the album's longest-charting song, got an official Dombresky dance remix, and anchored a Swift-directed video built entirely from real Eras Tour backstage footage."
    ],
    meaning: {
      confirmed: [
        "Track 13 on The Tortured Poets Department (April 19, 2024), written and produced by Swift with Jack Antonoff; it peaked at No. 3 on the Billboard Hot 100 and spent 31 weeks on the chart, the album's longest-charting track.",
        "Swift directed and produced its music video, which premiered August 20, 2024 (first shown on the Wembley screens as she left the stage after her final European show) and is assembled from real Eras Tour backstage and rehearsal footage dramatizing the offstage-collapse-to-onstage-smile whiplash.",
        "It entered the Eras Tour on May 9, 2024 in Paris, the first show of the revamped European leg, as the closer of the TTPD set, staged with a theatrical costume-change intro.",
        "An official Dombresky remix was released September 13, 2024. The song was submitted for Best Pop Solo Performance at the 2025 Grammys but was not nominated."
      ],
      supported: [
        "Critics widely named it a highlight and described it as electropop / dance-pop / synth-disco built on rapid arpeggiated synths; Stereogum praised its 'musical energy and inventiveness,' while Pitchfork was cooler on lyrics it found 'versed in memespeak.'"
      ],
      fanTheories: [
        "The counted '1, 2, 3, 4' intro is widely heard as a literal sampled in-ear stage count-off, but no interview or production write-up documents that; absent a primary source it is best treated as a listener reading rather than a confirmed production detail."
      ]
    },
    connections: [
      {
        relatedId: "song:the-smallest-man-who-ever-lived",
        label: "The Smallest Man Who Ever Lived",
        why: "Its neighbor on the album and in the live set — the fury of Track 14 resolving into the show-must-go-on adrenaline this song rides to close the TTPD act."
      },
      {
        relatedId: "song:fortnight",
        label: "Fortnight",
        why: "The album's two poles of the same collapse: Fortnight opens it medicated and numb, I Can Do It closes the arc performing through the wreckage with a manic grin."
      }
    ],
    live: [
      {
        date: "May 9, 2024",
        event: "The Eras Tour — Paris (Paris La Défense Arena)",
        note: "Added to the setlist as the closer of the TTPD act when the revamped European leg opened; performed at every show thereafter with a theatrical costume-change intro."
      }
    ],
    sources: [
      { name: "I Can Do It with a Broken Heart — Wikipedia", url: "https://en.wikipedia.org/wiki/I_Can_Do_It_with_a_Broken_Heart" },
      { name: "Variety: Taylor Swift Debuts the Behind-the-Scenes Music Video", url: "https://variety.com/2024/music/news/taylor-swift-i-can-do-it-with-a-broken-heart-music-video-behind-the-scenes-1236113079/" },
      { name: "Rolling Stone: The 'I Can Do It With a Broken Heart' Video of Eras Tour BTS", url: "https://www.rollingstone.com/music/music-news/taylor-swift-i-can-do-it-with-a-broken-heart-video-eras-tour-1235084040/" },
      { name: "Billboard: 'I Can Do It With a Broken Heart' on the Hot 100", url: "https://www.billboard.com/music/chart-beat/taylor-swift-i-can-do-it-with-a-broken-heart-hot-100-1235758044/" }
    ]
  },

  "thank-you-aimee": {
    whyItMatters: [
      "Anthology bonus track 24 buries a three-letter name in the official title's stray capitals — thanK you aIMee, spelling KIM — and hangs a whole song about outlasting a bully on it. Swift has never named a subject; the Kim Kardashian reading is fan and press interpretation the typography invites, sitting on the public 2016 feud without ever saying so.",
      "Its defining beat happened live: at Wembley on June 22, 2024 Swift played it for the first time as an acoustic surprise-song mashup with 2010's 'Mean,' the same night she brought out Hayley Williams for 'Castles Crumbling.' Two months later that Wembley recording briefly surfaced as a download retitled 'thank You aimEe,' the capitals now spelling YE."
    ],
    meaning: {
      confirmed: [
        "Anthology track 24 on The Tortured Poets Department: The Anthology (April 19, 2024), written by Swift with Aaron Dessner and produced by Swift, Dessner and Jack Antonoff; recorded at Long Pond and Sharp Sonic. It debuted and peaked at No. 23 on the Billboard Hot 100.",
        "Its live debut was Wembley, June 22, 2024, an acoustic surprise-song mashup with 'Mean' — Swift told the crowd she had never played it before and improvised a line about singing it at Wembley.",
        "On August 15, 2024 Swift's webstore released that Wembley live recording as a limited digital track retitled 'thank You aimEe (Mean – Live from London),' its capitals restyled to spell YE (a Kanye 'Ye' West nod); Taylor Nation announced it and it was available only until 11:59 p.m. EDT that night before being pulled."
      ],
      supported: [
        "Critics treated it as a catchy, pointed mid-tier Anthology cut rather than a top highlight, and repeatedly paired it with the Anthology's 'Cassandra' as the album's twin Kardashian-read tracks (TODAY notes 'Cassandra' alludes to the 2016 call)."
      ],
      fanTheories: [
        "The KIM capitalization drives a near-universal read of the song as aimed at Kim Kardashian; Kardashian did not comment on the record (sources told People she was 'over it'), and her Instagram following dropped by more than 120,000 the release week. Swift's only on-record framing came from the Wembley stage — that criticism just makes her work harder — never naming anyone."
      ]
    },
    connections: [
      {
        relatedId: "song:cassandra",
        label: "Cassandra",
        why: "The Anthology's companion piece — the two tracks outlets read together as Swift's 2024 returns to the 2016 feud, thanK you aIMee as ironic thank-you, Cassandra as the prophet nobody believed in time."
      },
      {
        relatedId: "song:this-is-why-we-cant-have-nice-things",
        label: "This Is Why We Can't Have Nice Things",
        why: "The chapter this one answers eight years on — reputation's 2017 kiss-off opened the same feud arc that thanK you aIMee closes with weaponized gratitude instead of open anger."
      },
      {
        relatedId: "song:mean",
        label: "Mean",
        why: "Its live other half: at Wembley Swift mashed thanK you aIMee straight into 2010's 'Mean,' tying two bullying anthems fourteen years apart into one surprise-song moment."
      }
    ],
    live: [
      {
        date: "June 22, 2024",
        event: "The Eras Tour — London (Wembley Stadium)",
        note: "Live debut and only known performance, an acoustic surprise-song mashup with 'Mean' — released as a limited download on August 15, 2024 briefly retitled 'thank You aimEe' (YE)."
      }
    ],
    sources: [
      { name: "Thank You Aimee — Wikipedia", url: "https://en.wikipedia.org/wiki/Thank_You_Aimee" },
      { name: "Billboard: Taylor Swift Debuts 'thanK you aIMee' Live in London", url: "https://www.billboard.com/music/music-news/taylor-swift-thank-you-aimee-castles-crumbling-hayley-williams-london-eras-tour-1235715917/" },
      { name: "Billboard: Taylor Swift Shifts From Kim to Ye With the Live 'thank You aimEe'", url: "https://www.billboard.com/music/pop/taylor-swift-thank-you-aimee-kanye-west-title-live-1235754448/" },
      { name: "TODAY: Are 'thanK you aIMee' and 'Cassandra' About Kim Kardashian?", url: "https://www.today.com/popculture/music/taylor-swift-kim-kardashian-thank-you-aimee-lyrics-rcna148523" }
    ]
  },

  "the-prophecy": {
    whyItMatters: [
      "One of the Anthology's most-loved tracks and its clearest turn toward folklore/evermore: a hushed, hymn-like plea in which the narrator bargains with whoever writes fate to change hers from always-left to finally-kept. Rolling Stone grouped it with 'Peter' and 'Cassandra' as 'some of the most powerful songs Swift and Dessner have crafted together' and praised its 'fiercest vocals, all compressed fury.'",
      "Written and produced with Aaron Dessner in his Long Pond palette, it charted at No. 32 on the Hot 100 in the week Swift placed a record 32 songs on the chart at once, and returned live twice on the tour as an acoustic surprise song."
    ],
    meaning: {
      confirmed: [
        "Anthology track 26 on The Tortured Poets Department: The Anthology (April 19, 2024), written and produced by Swift with Aaron Dessner in a hushed piano-and-strings arrangement in the folklore/evermore mold.",
        "It debuted and peaked at No. 32 on the Billboard Hot 100 (week ending May 4, 2024), part of Swift's record 32 simultaneous Hot 100 entries.",
        "It was performed live twice as Eras Tour acoustic surprise-song mashups: Lyon on June 2, 2024 (with 'Long Story Short') and Indianapolis on November 2, 2024 (with 'This Love')."
      ],
      supported: [
        "Critics singled it out as an Anthology high point and placed it explicitly in the folklore/evermore lineage; Rolling Stone described the Anthology's back half as 'reaching all the way into homegrown Folklore/Evermore beauty.'"
      ],
      fanTheories: [
        "Fans rank its bridge among the era's most devastating and read the song as a broad fear of being unlovable rather than a specific breakup; Swift has offered no on-record account of the song's meaning, so those readings are interpretation, not stated intent."
      ]
    },
    connections: [
      {
        relatedId: "song:peter",
        label: "Peter",
        why: "The Anthology ballads critics named together — Peter grieves a promise never kept, The Prophecy pleads for one, both in Dessner's spare Long Pond register."
      },
      {
        relatedId: "song:this-is-me-trying",
        label: "this is me trying",
        why: "The folklore ancestor The Prophecy reaches back to — the same quiet, self-doubting plea for grace set to Dessner's hushed palette, four years apart."
      }
    ],
    live: [
      {
        date: "June 2, 2024",
        event: "The Eras Tour — Lyon (Groupama Stadium)",
        note: "Live debut as an acoustic surprise-song mashup with 'Long Story Short'; returned November 2, 2024 in Indianapolis, mashed with 'This Love.'"
      }
    ],
    sources: [
      { name: "The Tortured Poets Department: The Anthology — Wikipedia", url: "https://en.wikipedia.org/wiki/The_Tortured_Poets_Department" },
      { name: "Billboard: Aaron Dessner Says 'Tortured Poets' a Career Best", url: "https://www.billboard.com/music/pop/taylor-swift-producer-aaron-dessner-talks-tortured-poets-department-1235661001/" },
      { name: "Rolling Stone: The Tortured Poets Department: The Anthology Review (Rob Sheffield)", url: "https://www.rollingstone.com/music/music-album-reviews/taylor-swift-the-tortured-poets-department-the-anthology-review-1235007309/" },
      { name: "Billboard: Taylor Swift Charts 32 Songs on the Hot 100 in a Single Week", url: "https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/" }
    ]
  }
};
