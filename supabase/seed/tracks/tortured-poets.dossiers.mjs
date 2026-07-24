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
  // Added 2026-07-24 by the Answerer (shard 1) for ledgers #1307, #1312, #1327,
  // #1328. Web-sourced; confirmed = Swift's public statements or hard facts,
  // readings labeled; no lyric quotations beyond documented lines; no private-
  // life speculation (the "wild boy" of But Daddy stays a labeled fan reading).
  "whos-afraid-of-little-old-me": {
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
  "but-daddy-i-love-him": {
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
  "the-albatross": {
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
  "i-hate-it-here": {
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
  "fresh-out-the-slammer": {
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
  "the-alchemy": {
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
  "i-can-do-it-with-a-broken-heart": {
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
  "imgonnagetyouback": {
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
  "peter": {
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
  "the-black-dog": {
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
  "robin": {
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
  // Added 2026-07-24 by the Answerer (shard 1) for ledgers #1458, #1464, #1478.
  // Web-sourced; confirmed = Swift's public statements or hard facts, readings
  // labeled; no lyric quotations beyond documented lines; no private-life
  // speculation. Cross-link ids verified to resolve (tracks.test.ts).
  "guilty-as-sin": {
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
  "chloe-or-sam-or-sophia-or-marcus": {
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
  "loml": {
    whyItMatters: [
      "The piano dirge that redefines its own acronym in the final line — 'love of my life' curdling into 'loss of my life.' A spare, Evermore-adjacent Aaron Dessner ballad, it peaked at No. 12 on the Hot 100 inside TTPD's record top-14 sweep and was a critical standout: The Hollywood Reporter called it the album's 'most emotional track.'",
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
  }
};
