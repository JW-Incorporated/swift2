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
  "my-boy-only-breaks-his-favorite-toys": {
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

  "florida": {
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
  }
};
