// Per-song dossiers for the Midnights era (issue #440 pattern), keyed by track
// slug and attached in midnights.mjs. Added by the depth engine's Answerer
// (2026-07-21) to answer curiosity ledger #1098 (Anti-Hero) — its music-video,
// live-history, reception, writing/production, sources and cross-link axes.
// Fact-checked this pass against the Wikipedia song article (fetched) and the
// in-repo Midnights record-week moment: confirmed tier = documented facts or
// Swift's own statements only; the '30 Rock' and any subject readings are
// labeled fan/press theory, never fact. No lyric quotations. The internal
// song:/moment: connection ids resolve and are asserted by
// apps/web/lib/longlive/tracks.test.ts.
export default {
  'anti-hero': {
    whyItMatters: [
      "Anti-Hero is the most culturally load-bearing song of the Midnights era and Swift's own stated favorite on the record. Released with the album on October 21, 2022, it became her longest-running Billboard Hot 100 No. 1 to that point — eight weeks on top, six of them consecutive before Mariah Carey's holiday perennial interrupted the run and it returned for two more weeks in January 2023 — surpassing 'Blank Space.' On its opening day it drew about 17.4 million Spotify streams, at the time the biggest single-day for a song in the platform's history, and its 'it's me, hi' hook became a global catchphrase within days.",
      "It also anchored a chart first: the week it debuted at No. 1, the nine other Midnights tracks filled out the rest of the Hot 100's top 10, making Swift the first artist ever to hold the entire top 10 at once. The self-directed video and its self-loathing imagery kept the song in the culture for months, and it was nominated for Record of the Year, Song of the Year and Best Pop Solo Performance at the 2024 Grammys."
    ],
    meaning: {
      confirmed: [
        "The lead single from Midnights (October 21, 2022), written and produced by Swift and Jack Antonoff; Swift introduced it in an Instagram video as a guided tour of the things she dislikes and fears about herself. Antonoff built the track over an OB-8 synth with tremolo applied to a LinnDrum beat (E major, ~97 BPM).",
        "It spent eight weeks at No. 1 on the Hot 100 — her longest-running chart-topper up to then — and set a Spotify single-day streaming record on release. The Swift-written-and-directed music video premiered October 21, 2022; a version featuring Bleachers (Jack Antonoff's band) followed on November 7-8, 2022, reworking the album cut as a duet."
      ],
      supported: [
        "The video literalizes the song's intrusive thoughts — Swift confronted by an 'anti-hero' version of herself — including a bathroom-scale shot reading 'fat.' After criticism that the scene equated fatness with failure, Swift edited the video to remove that specific shot. The will-reading/funeral sequence, where a scheming family divides her estate, was played by Mike Birbiglia, John Early and Mary Elizabeth Ellis as her sons and daughter-in-law.",
        "It received three 2024 Grammy nominations (Record of the Year, Song of the Year, Best Pop Solo Performance) and won none, in a field where Miley Cyrus's 'Flowers' took Record of the Year and Best Pop Solo Performance and Billie Eilish's 'What Was I Made For?' took Song of the Year. Its live debut came on January 12, 2023, when Swift joined The 1975 as a surprise guest at their London show; it then held a fixed spot in the Midnights section of the Eras Tour."
      ],
      fanTheories: [
        "The 'sexy baby / monster on the hill' line is widely read as invoking the sitcom 30 Rock, but Swift has not confirmed the reference, so the reading stays fan/press interpretation rather than a stated source."
      ]
    },
    connections: [
      {
        relatedId: "moment:vault-midnights-every-spot-in-the-hot-100-top-10-all-at-once",
        label: "Every spot in the Hot 100 top 10, all at once",
        why: "Anti-Hero is the No. 1 that led the record — the week it debuted atop the chart, the other nine Midnights tracks filled out the top 10, the first time one artist ever monopolized it, and this song's 59.7 million-stream week sat at the front of it."
      },
      {
        relatedId: "song:youre-on-your-own-kid",
        label: "You're on Your Own, Kid",
        why: "The album's two self-portraits — Anti-Hero itemizes the self-loathing, You're on Your Own, Kid answers it with hard-won self-reliance; the record's problem statement and its resolution."
      },
      {
        relatedId: "song:mastermind",
        label: "Mastermind",
        why: "Two sides of Swift narrating her own reputation — Anti-Hero the anxious confession of being her own worst problem, Mastermind the wink that every bit of the image was calculated on purpose."
      }
    ],
    live: [
      {
        date: "January 12, 2023",
        event: "The 1975 — 'At Their Very Best' Tour, London (The O2)",
        note: "Live debut, performed as a surprise guest during The 1975's set before the Eras Tour began; it then ran as a fixture of the tour's Midnights section from opening night."
      }
    ],
    sources: [
      {
        name: "Anti-Hero (song) — Wikipedia",
        url: "https://en.wikipedia.org/wiki/Anti-Hero_(song)"
      },
      {
        name: "Anti-Hero — biggest single-day Spotify streams and Hot 100 records (Wikipedia, cited)",
        url: "https://en.wikipedia.org/wiki/Anti-Hero_(song)#Commercial_performance"
      }
    ]
  },
  // Depth pass (2026-07-24, Answerer shard 6): cross-link connections answering
  // the "cross-links" deficit on ledgers #1358 (labyrinth), #1372 (midnight-rain),
  // #1411 (the-great-war), #1422 (lavender-haze), #1444 (maroon), #1401 (paris).
  // The prose depth for each lives in the track's `summary`/`sources` in
  // midnights.mjs; these dossiers carry the resolvable song:/moment: rails.
  // Every id is asserted to resolve by apps/web/lib/longlive/tracks.test.ts.
  'labyrinth': {
    connections: [
      {
        relatedId: "song:this-is-me-trying",
        label: "this is me trying",
        why: "The folklore track Swift fused with Labyrinth into a single piano mashup in Gelsenkirchen (July 18, 2024) — one hook flowing into 'I just wanted you to know I'm falling in love again.'"
      },
      {
        relatedId: "song:state-of-grace",
        label: "State of Grace",
        why: "The Red song she mashed with Labyrinth on piano in Toronto (Nov. 21, 2024) — the other of its two surprise-song pairings."
      },
      {
        relatedId: "song:youre-on-your-own-kid",
        label: "You're on Your Own, Kid",
        why: "Its Midnights sibling in fragile hope after damage — talking yourself through the fear toward the next step."
      }
    ]
  },
  'midnight-rain': {
    connections: [
      {
        relatedId: "song:labyrinth",
        label: "Labyrinth",
        why: "The album's two pitched-down-vocal experiments — Labyrinth drops Swift's voice near the end; Midnight Rain runs the whole hook an octave low."
      },
      {
        relatedId: "moment:vault-midnights-every-spot-in-the-hot-100-top-10-all-at-once",
        label: "Every spot in the Hot 100 top 10, all at once",
        why: "Midnight Rain debuted at No. 5 in the week Swift became the first artist to hold the chart's entire top 10."
      }
    ]
  },
  'the-great-war': {
    connections: [
      {
        relatedId: "song:high-infidelity",
        label: "High Infidelity",
        why: "The album's only other core Aaron Dessner co-write — the pair of folk-rock imports on an otherwise Antonoff-built synth-pop record."
      },
      {
        relatedId: "song:wouldve-couldve-shouldve",
        label: "Would've, Could've, Should've",
        why: "The third Dessner collaboration on the 3am Edition, sharing the same acoustic, folklore/evermore lineage."
      }
    ]
  },
  'lavender-haze': {
    // Dossier body added 2026-07-25 (ledger #1422): remix/chart/single/video
    // facts verified against the linked Wikipedia article this pass. Sub-facts
    // Wikipedia does not document (video DP/production company, first-24h view
    // count, a specific RIAA tier, named LGBTQ+ outlet coverage of the casting)
    // are left unstated rather than invented — those ledger sub-questions stay
    // open, not answered.
    whyItMatters: [
      "It opens Midnights by naming the album's private-life thesis: 'lavender haze' is a 1950s phrase for the all-consuming glow of new love, which Swift found in Mad Men and turned into a song about guarding a relationship from the tabloid weather around it.",
      "It was also the record's second-biggest hit and a genuine collaborative outlier — a co-write that pulled in Zoë Kravitz and a Kendrick-adjacent production team, then arrived with a self-directed video whose casting became part of the story.",
    ],
    meaning: {
      confirmed: [
        "Written by Swift with Jack Antonoff, Zoë Kravitz, Sam Dew, Mark 'Sounwave' Spears and Jahaan Sweet, and produced by Swift, Antonoff and Sounwave. Per Sounwave, the track started when he built the beat in about fifteen minutes and an accidental button-press played a Braxton Cook voice-memo melody; the R&B groove grew from there, with 'Dew [coming] up with the melodies and Kravitz [adding] some sonic embellishments.'",
        "It peaked at No. 2 on the Hot 100 — held off the top only by album-mate 'Anti-Hero' — and reached No. 2 in Australia, Canada and on the Billboard Global 200, and No. 3 on the UK Singles chart. Swift wrote and directed the music video (premiered January 27, 2023), casting Dominican-American transgender model and activist Laith Ashley as her love interest.",
      ],
      supported: [
        "Its single campaign ran behind 'Anti-Hero': it went to US contemporary-hit (pop) radio on November 29, 2022 and to hot adult-contemporary radio on January 10, 2023 — placing it as a later single in the Midnights rollout, not the lead. An official remix package followed the video, led by a Felix Jaehn remix (February 10, 2023) and then Tensnake, Snakehips and Jungle remixes (March 3, 2023), issued to digital and streaming.",
        "The casting of Laith Ashley was widely read as a deliberately inclusive choice and drew attention as such; the specific outlet write-ups and any on-record comments from Ashley are not captured here, so that thread is noted rather than quoted.",
      ],
      fanTheories: [
        "Beyond opening the Midnights act on the 2023–24 Eras Tour, no TV, awards-show, late-night, or surprise-song performance of 'Lavender Haze' is documented — the live footprint is the tour slot, stated here so the absence is explicit rather than silent.",
      ],
    },
    live: [
      {
        date: '2023',
        event: 'The Eras Tour',
        note: "Opened the Midnights act across the 2023–24 run; no separate TV/awards or surprise-song performance is documented.",
      },
    ],
    connections: [
      {
        relatedId: "song:anti-hero",
        label: "Anti-Hero",
        why: "The song that kept Lavender Haze at No. 2 — Anti-Hero held the No. 1 the same record-setting chart week."
      },
      {
        relatedId: "moment:vault-midnights-every-spot-in-the-hot-100-top-10-all-at-once",
        label: "Every spot in the Hot 100 top 10, all at once",
        why: "Lavender Haze was the No. 2 record in the week Swift filled the entire Hot 100 top 10."
      }
    ],
    sources: [
      { name: 'Lavender Haze — Wikipedia', url: 'https://en.wikipedia.org/wiki/Lavender_Haze' },
      { name: 'Midnights (Taylor Swift album) — Wikipedia', url: 'https://en.wikipedia.org/wiki/Midnights' },
    ],
  },
  'maroon': {
    connections: [
      {
        relatedId: "song:red",
        label: "Red",
        why: "The song fans read Maroon as the grown-up echo of — the same color pushed darker and drier a decade on."
      },
      {
        relatedId: "song:cornelia-street",
        label: "Cornelia Street",
        why: "Its most-repeated Eras Tour surprise pairing — the two New York almost-loves mashed together on piano at Anfield's 100th show (June 13, 2024)."
      },
      {
        relatedId: "song:cowboy-like-me",
        label: "Cowboy Like Me",
        why: "The Indianapolis surprise-song mashup partner (Nov. 2, 2024)."
      }
    ]
  },
  'paris': {
    connections: [
      {
        relatedId: "song:sweet-nothing",
        label: "Sweet Nothing",
        why: "The album's other portrait of love as a private refuge that shuts out the industry noise."
      }
    ]
  },
  // Depth pass (ledger #1447): High Infidelity's cross-link rail — its Dessner
  // siblings and the infidelity/exit-song lineage a named critic drew.
  'high-infidelity': {
    connections: [
      {
        relatedId: "song:wouldve-couldve-shouldve",
        label: "Would've, Could've, Should've",
        why: "The album's only other core Aaron Dessner co-write — the two folk-lineage tracks he brought to a synth-pop record."
      },
      {
        relatedId: "song:the-great-war",
        label: "The Great War",
        why: "The 3am Edition's other Swift–Dessner collaboration, sharing its acoustic-turned-electronic Dessner fingerprints."
      },
      {
        relatedId: "song:illicit-affairs",
        label: "illicit affairs",
        why: "Business Insider's Courteney Larocca paired the two — both detail the inevitable end of an ill-fated affair."
      }
    ]
  },
  // Added 2026-07-24 by the Answerer (depth shard 6, a later same-shard run) for
  // curiosity ledgers #1461 and #1477 — the two Midnights song stubs the earlier
  // shard-6 midnights run (PR #1471) did not reach. Same fact-checked
  // confirmed/supported/fanTheories discipline; no lyrics; unverified axes (US
  // RIAA certs) left out.
  'vigilante-shit': {
    whyItMatters: [
      "The only song on Midnights that Swift wrote entirely by herself — the record's cold-revenge set piece, 'revenge served through paperwork' rather than a keyed car. Produced with Jack Antonoff in A minor at about 80 BPM, its 2:44 of noir minimalism became one of the album's most-discussed tracks on release.",
      "On the Eras Tour it turned into a signature moment: a burlesque chair number in the Midnights act that fans and critics repeatedly compared to Chicago, staged from opening night in Glendale. On the chart dated Nov. 5, 2022 it debuted at No. 10 — the lowest rung of the historic week Swift became the first artist to hold the entire Hot 100 top 10 at once."
    ],
    meaning: {
      confirmed: [
        "Written solely by Taylor Swift (the album's lone solo credit) and produced with Jack Antonoff. Antonoff described building its buzzy, minimalist beat from tape transients in a MusicRadar interview — 'smashing everything into a Copicat,' then panning 808s and carving out low end 'to get that buzz.' It runs about 80 BPM in A minor and is 2 minutes 44 seconds long.",
        "Only an official lyric video was released (October 2022); Swift made no standalone music video or visualizer for the track, so its visual footprint is the Eras Tour staging rather than a film."
      ],
      supported: [
        "Reception split on the same axis critics still argue: Variety's Chris Willman predicted it would be the album's 'most talked-about song,' Vulture's Justin Curto called it Swift at her 'venomous best,' and The New York Times' Jon Caramanica read the narrator as 'funny, wry, slightly perturbing.' Pitchfork's Quinn Moreland dissented — the revenge-fantasy 'edginess' plays like a 'costume' next to the album's deeper cuts."
      ],
      fanTheories: [
        "Fans and press widely map the song onto Swift's documented business adversaries (the Scooter Braun / masters dispute) and, less often, Kanye West. Swift has named no subject; the lyric's literal story is a fictional wife-and-mistress revenge plot, and every real-world target is fan/critic reading, not confirmed fact."
      ]
    },
    connections: [
      {
        relatedId: "song:mastermind",
        label: "Mastermind",
        why: "Two Midnights self-portraits of control — Mastermind is the wink that she engineered everything on purpose, Vigilante Shit the cold execution of a plan against someone who wronged a friend."
      },
      {
        relatedId: "song:karma",
        label: "Karma",
        why: "The album's other reckoning track — Karma savors comeuppance arriving on its own, Vigilante Shit hurries it along with forwarded paperwork; a matched pair on the record's justice theme."
      },
      {
        relatedId: "song:look-what-you-made-me-do",
        label: "Look What You Made Me Do",
        why: "reputation's public, theatrical revenge is the precedent critics reached for; Vigilante Shit reruns the vengeance instinct in a colder, quieter, procedural register — the 'Reputation-adjacent' read made concrete."
      },
      {
        relatedId: "song:mad-woman",
        label: "mad woman",
        why: "folklore's study of a woman weaponizing the anger she's been provoked into is the clearest thematic ancestor — female rage turned deliberate rather than unhinged."
      }
    ],
    live: [
      {
        date: "March 17, 2023",
        event: "Eras Tour opening night — State Farm Stadium, Glendale, AZ",
        note: "Staged in the Midnights act as a chair-dance number (widely likened to Chicago); a fixture of the main set from the tour's first night, not a surprise song."
      }
    ],
    sources: [
      {
        name: "Vigilante Shit (song) — Wikipedia",
        url: "https://en.wikipedia.org/wiki/Vigilante_Shit"
      },
      {
        name: "MusicRadar: Jack Antonoff on building the Midnights tracks (tape-transient technique)",
        url: "https://www.musicradar.com/news/jack-antonoff-interview-taylor-swift-midnights-oberheim"
      },
      {
        name: "Billboard: Taylor Swift Makes History as First Artist to Claim Entire Hot 100 Top 10",
        url: "https://www.billboard.com/music/chart-beat/taylor-swift-all-hot-100-top-10-anti-hero-1235163664/"
      }
    ]
  },
  'bejeweled': {
    whyItMatters: [
      "A sparkle-pop highlight of Midnights and, in the record's all-top-10 week, the No. 6 song in the sweep — debuting and peaking at No. 6 on the Hot 100 and No. 8 on the Billboard Global 200. It reached the top 10 in Canada (No. 7) and Australia (No. 7, later 3× Platinum there) on streaming and sales alone.",
      "It anchored its own staged segment in the Midnights act of the Eras Tour from opening night, and its self-directed video — cameos by Laura Dern, HAIM and Dita Von Teese — hid the Speak Now (Taylor's Version) announcement in plain sight, making the song a rare case where the track and its video each carry a distinct piece of era lore."
    ],
    meaning: {
      confirmed: [
        "Written and produced by Taylor Swift and Jack Antonoff: synth- and bubblegum-pop with disco and electronica in the mix, about 82 BPM, built on deep Moog bass, Juno-6 arpeggios, kalimba and DX7/OB-1 synths, and tracked at Rough Customer Studio in Brooklyn and Electric Lady Studios in New York.",
        "Released as a promotional single on October 25, 2022 (a limited-time download via Swift's site), with an instrumental version two days later. It was never serviced to radio as an official single — the album's radio single was 'Anti-Hero' — so 'Bejeweled' charted purely on streaming and sales off the album.",
        "Swift has described the song as self-reassurance about returning to pop after the folklore/evermore years — the 'you're still bejeweled' idea of pumping herself back up to prove she could still light up a room. The broader sparkle-as-defiance reading builds on that stated intent."
      ],
      supported: [
        "Critics singled out its disco lift and self-worth swagger. Rolling Stone's Rob Sheffield heard it as 'the anxious dance-floor poseur of Mirrorball grown up'; Rolling Stone UK called it Swift's 'swaggiest showstopper' since 'The Man'; NME (rating Midnights four stars) held up its chorus as emblematic of a self-assured pop return. Dissenters — the NYT's Jon Caramanica ('metallic and tense,' the lyrics 'underwhelming') and the AP's Elise Ryan ('a bit too candy sweet') — found it slight."
      ]
    },
    connections: [
      {
        relatedId: "song:mirrorball",
        label: "mirrorball",
        why: "The comparison a critic actually drew: Rolling Stone's Rob Sheffield heard Bejeweled as folklore's anxious 'Mirrorball' grown into disco self-assurance — the same performer's fragility, now defiant."
      },
      {
        relatedId: "song:the-man",
        label: "The Man",
        why: "Rolling Stone UK ranked Bejeweled Swift's 'swaggiest showstopper' since 'The Man' — the two are her clearest struts of self-worth-as-power, a decade of the era's confidence songs bracketed."
      },
      {
        relatedId: "moment:vault-midnights-bejeweled-arrives-with-a-psychotic-amount-of-easter-eggs",
        label: "The 'Bejeweled' video and its Easter eggs",
        why: "The song's self-directed video is its own documented item — the Laura Dern / HAIM / Dita Von Teese Cinderella fantasy whose clues pointed at Speak Now (Taylor's Version)."
      },
      {
        relatedId: "moment:vault-midnights-speak-now-taylors-version-announced-onstage-in-nashville",
        label: "Speak Now (Taylor's Version) announced in Nashville",
        why: "The re-record the Bejeweled video predicted: fans decoded its purple wardrobe and floor numbers correctly, and this is the announcement that proved them right."
      }
    ],
    live: [
      {
        date: "March 17, 2023",
        event: "Eras Tour opening night — State Farm Stadium, Glendale, AZ",
        note: "A standing number in the Midnights act (fifth in that section on opening night), with choreography drawn from the song's viral TikTok dance; a main-set fixture, not a surprise song."
      }
    ],
    sources: [
      {
        name: "Bejeweled (song) — Wikipedia",
        url: "https://en.wikipedia.org/wiki/Bejeweled_(song)"
      },
      {
        name: "Rolling Stone: Rob Sheffield on Midnights (Bejeweled / Mirrorball read)",
        url: "https://www.rollingstone.com/music/music-features/taylor-swift-midnights-sheffield-1234615239/"
      },
      {
        name: "NME: Taylor Swift — Midnights review (four stars)",
        url: "https://www.nme.com/reviews/album/taylor-swift-midnights-review-3332805"
      },
      {
        name: "setlist.fm: Eras Tour opening night, Glendale (Midnights-act order)",
        url: "https://www.setlist.fm/setlist/taylor-swift/2023/state-farm-stadium-glendale-az-bbb91ce.html"
      }
    ]
  }
};
