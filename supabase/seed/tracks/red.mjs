// Vault track guide — Red era (Red 2012 / Taylor's Version 2021, including
// From The Vault). Original prose only — never lyrics; unconfirmed readings
// are labeled. Provenance per docs/content/content-audit-2026-07-08.md §5
// (URLs verified 2026-07-08).

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
  'Red (Taylor Swift album)',
  'Red_(Taylor_Swift_album)',
  'album article: release facts, credits, and cited interviews',
);
const TV = wiki(
  "Red (Taylor's Version)",
  "Red_(Taylor's_Version)",
  're-recording article: vault-track credits and release facts',
);

const TRACKS = [
    {
      slug: 'state-of-grace',
      trackNumber: 1,
      trackTitle: 'State of Grace',
      youtubeId: '-mrC5tRkxrY', // oEmbed-verified official Taylor Swift channel
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      singleReleaseDate: '2012-10-16',
      note: 'The U2-sized arena-rock opener — the sound of country Taylor kicking the door open on everything Red was about to become.',
      summary:
        'Love as a collision of two headstrong people: risky, ruinous, and worth it — the thesis statement the rest of the album stress-tests.',
      inspiration:
        'Swift described it as capturing the moment of meeting a love that would change her — deliberately sequenced first as the calm before the album’s storm.',
      themes: ['love as risk', 'new beginnings', 'intensity'],
      sourceUrl: 'https://en.wikipedia.org/wiki/State_of_Grace_(song)',
      sources: [
        wiki(
          'State of Grace (song)',
          'State_of_Grace_(song)',
          'song article: promo-single release and style',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "State of Grace is the sound of the door opening on the Red era: a howling, U2-scaled arena-rock opener that announced in its first four minutes that the country boundaries of Speak Now no longer applied. Released October 16, 2012 as the final promotional single before the album, it reached No. 13 on the Hot 100 on download strength alone — a measure of how ready the audience was for the swerve. Rolling Stone's album preview singled out its reverb-drenched, U2-style build as the era's boldest signal.",
          "As track one it is also the album's thesis. The love it describes is framed as collision — two headstrong people, risk accepted up front — and everything that follows on Red stress-tests exactly that bargain. Billboard's track-by-track said the song effortlessly extended Swift's genre reach, and the Joshua Tree-adjacent guitar language became shorthand for her arena-rock arrival."
        ],
        meaning: {
          confirmed: [
            "Big Machine released it on October 16, 2012 as the last promotional single before Red, sequenced as the album's opening track; Swift wrote it alone and produced it with Nathan Chapman.",
            "It peaked at No. 13 on the Billboard Hot 100 from that promotional release and was later certified gold."
          ],
          supported: [
            "Contemporary critics framed it as a deliberate U2-style epic — reverb-drenched guitars and gigantic drums signaling the move beyond country-pop — and retrospective rankings regularly place it among Swift's best openers.",
            "The song reads as love-as-risk accepted with eyes open: the calm, expansive prelude the album then spends the rest of its runtime complicating."
          ],
          fanTheories: [
            "Fans read it as the hopeful first chapter of the same relationship arc All Too Well later mourns, folding it into the era's muse speculation — a sequencing-based reading Swift has never confirmed."
          ]
        },
        connections: [
          {
            relatedId: "song:all-too-well",
            label: "All Too Well",
            why: "The two ends of the album's central arc: State of Grace signs up for the collision, All Too Well inventories the wreckage."
          },
          {
            relatedId: "song:red",
            label: "Red",
            why: "Track one declares love a worthy risk; track two immediately grades that love in colors — the opener's thesis restated as a paint chart."
          },
          {
            relatedId: "song:holy-ground",
            label: "Holy Ground",
            why: "Both run on drums and forward motion, and both insist the doomed thing was still worth it — one from inside the moment, one from years later."
          }
        ],
        sources: [
          {
            name: "State of Grace (Taylor Swift song) — Wikipedia",
            url: "https://en.wikipedia.org/wiki/State_of_Grace_(Taylor_Swift_song)"
          },
          {
            name: "Rolling Stone: Taylor Swift on Her Bold New Direction (2012)",
            url: "https://www.rollingstone.com/music/music-news/taylor-swift-on-her-bold-new-direction-233291/"
          },
          {
            name: "Billboard: Red Track-by-Track Review (2012)",
            url: "https://www.billboard.com/music/music-news/taylor-swift-red-track-by-track-review-1066798/"
          }
        ]
      },
    },
    {
      slug: 'red',
      trackNumber: 2,
      trackTitle: 'Red',
      youtubeId: 'R_rUYuFtNO4', // oEmbed-verified official Taylor Swift channel
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman', 'Dann Huff'],
      isSingle: true,
      note: 'The color-wheel title track: an entire relationship graded by hue, with red reserved for the parts that refuse to fade.',
      summary:
        'Loving him was primary-color intense, losing him was gray-blue; the song is a paint chart for a relationship that ran too hot to keep.',
      inspiration:
        'Swift explained the title concept on release: the album covers relationships defined by extreme, red emotions — this song is the legend for that map.',
      themes: ['emotional intensity', 'synesthetic memory', 'aftermath'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Red (Taylor Swift song)',
          'Red_(Taylor_Swift_song)',
          'song article: concept and single run',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "The title track is the album's legend — the key that explains what every other song's temperature means. Swift's stated concept maps a relationship's emotional stages to colors: breakup blue, the dark gray of losing someone, and the burning red of a love too intense to keep. Naming the whole album after the hottest band on that spectrum was the era's mission statement, and she described the relationship at its center as the worst thing and the best thing at once.",
          "It also marks the exact midpoint of her country-to-pop transition. Serviced to country radio in June 2013, it spent 42 weeks on Hot Country Songs — then her longest run on that chart — while its production pointed unmistakably forward. NPR's Ken Tucker singled out how the color device turns familiar imagery into efficient emotional shorthand, which is the album's whole trick in miniature."
        ],
        meaning: {
          confirmed: [
            "Swift publicly explained the song's color-coded concept — blue for breakup, dark gray for loss, red for intense passionate love — and described the relationship it depicts as simultaneously the worst and best thing.",
            "Written by Swift and produced with Nathan Chapman and Dann Huff, it was serviced to US country radio in June 2013, debuted at No. 6 on the Hot 100, and logged a then-personal-record 42 weeks on Hot Country Songs."
          ],
          supported: [
            "NPR's review praised the color scheme as more than a gimmick: a device that converts cliché into shortcut, letting one word carry the album's entire emotional range.",
            "Contemporary reception split on the chorus's processed vocal effect — divisive in 2012, later re-read as an early signal of how far into pop production the era was willing to go."
          ],
          fanTheories: [
            "Fans fold the title track into the same fall-2010 muse timeline as All Too Well; Swift has only ever discussed the song in emotional and color terms and has never named a subject."
          ]
        },
        connections: [
          {
            relatedId: "song:state-of-grace",
            label: "State of Grace",
            why: "The opener promises a love worth the risk; the title track supplies the color chart for what that risk felt like from inside."
          },
          {
            relatedId: "song:i-knew-you-were-trouble",
            label: "I Knew You Were Trouble",
            why: "Two takes on the same heat: Red grades the intensity in hindsight's colors, Trouble relives the moment of walking into it anyway."
          },
          {
            relatedId: "song:sad-beautiful-tragic",
            label: "Sad Beautiful Tragic",
            why: "The title track burns hot; this is the same relationship after the color has drained to fog — the gray the color wheel warned about."
          }
        ],
        sources: [
          {
            name: "Red (Taylor Swift song) — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Red_(Taylor_Swift_song)"
          },
          {
            name: "NPR: Ken Tucker reviews Red",
            url: "https://www.npr.org/transcripts/164340690"
          },
          {
            name: "Billboard: Red Track-by-Track Review (2012)",
            url: "https://www.billboard.com/music/music-news/taylor-swift-red-track-by-track-review-1066798/"
          }
        ]
      },
    },
    {
      slug: 'treacherous',
      trackNumber: 3,
      trackTitle: 'Treacherous',
      youtubeId: 'u1D1AgDfreg', // oEmbed-verified official Taylor Swift channel
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift', 'Dan Wilson'],
      producers: ['Dan Wilson'],
      note: 'The Dan Wilson co-write that whispers what the rest of Red shouts — wanting something you know is a bad idea, slowly.',
      summary:
        'Attraction on an unsafe road: she can see exactly where the slope leads and takes the first step anyway.',
      inspiration:
        'Written with Semisonic’s Dan Wilson, who has described building the song around the tension between gentleness and danger.',
      themes: ['temptation', 'knowing better', 'slow-burn desire'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Treacherous_(song)',
      sources: [
        wiki('Treacherous (song)', 'Treacherous_(song)', 'song article: co-writing background'),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "Treacherous is the album's quiet dissent: while the singles shout, track three whispers about wanting something you already know is a bad idea. Written with Semisonic's Dan Wilson — in a session Wilson says took about ten minutes — it builds from restrained acoustic guitar to a mid-song crescendo that critics treat as a masterclass in dynamics. Rolling Stone's Rob Sheffield ranks it in the upper tier of her entire catalog.",
          "It also marks a boundary crossing in her writing. Critics read it as Swift's first explicit engagement with desire as its own subject — not romance's aftermath but its pull — handled with a slow-burn control that made it a fan-canonized deep cut long before the Taylor's Version re-record charted on the Hot 100 in 2021."
        ],
        meaning: {
          confirmed: [
            "Swift co-wrote it with Dan Wilson, who also produced it; Wilson has recounted writing it in about ten minutes at his studio and praised Swift's clarity as a writer.",
            "Swift said the song came from the conflicted feeling of being at risk every time you fall in love — and that an experience that made you feel something was worth it."
          ],
          supported: [
            "Rob Sheffield reads it as a song about choosing romantic risk over safety, its restrained opening building deliberately to a crescendo — a top-tier entry in his all-songs ranking.",
            "Critics widely treat it as an album highlight and some hear it as Swift's first direct engagement with desire in her songwriting, a threshold the later pop albums walk through."
          ],
          fanTheories: [
            "Fans speculate the subject is Jake Gyllenhaal, as with much of Red, with some arguing for other era figures instead; Swift has never named a subject and has only described the song in abstract emotional terms."
          ]
        },
        connections: [
          {
            relatedId: "song:i-knew-you-were-trouble",
            label: "I Knew You Were Trouble",
            why: "The same bad idea at two speeds: Treacherous inches toward the cliff edge in slow motion, Trouble is the drop after the ground gives way."
          },
          {
            relatedId: "song:state-of-grace",
            label: "State of Grace",
            why: "Both accept risk as the price of admission — the opener at arena scale, Treacherous at a whisper."
          },
          {
            relatedId: "song:all-too-well",
            label: "All Too Well",
            why: "Treacherous is the road in; All Too Well is the accident report — the album's clearest before-and-after pairing on the same slope."
          }
        ],
        sources: [
          {
            name: "Treacherous — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Treacherous_(song)"
          },
          {
            name: "Rolling Stone: Rob Sheffield ranks Treacherous",
            url: "https://www.rollingstone.com/music/music-lists/taylor-swift-songs-ranked-rob-sheffield-201800/treacherous-2012-199051/"
          }
        ]
      },
    },
    {
      slug: 'i-knew-you-were-trouble',
      trackNumber: 4,
      trackTitle: 'I Knew You Were Trouble',
      youtubeId: 'TqAollrUJdA', // oEmbed-verified official Taylor Swift channel
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      isSingle: true,
      note: 'The dubstep drop heard round Nashville — her first full Max Martin swerve, plus the screaming-goat meme that outlived the discourse.',
      summary:
        'Blame turned inward: the red flags were visible from the parking lot, and she walked in anyway. The bass drop is the floor giving out.',
      inspiration:
        'Often read as being about the shame of knowing at first sight exactly how it would end; the Martin/Shellback production made it her boldest pop move to date.',
      themes: ['self-blame', 'red flags', 'aftermath of bad choices'],
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Knew_You_Were_Trouble',
      sources: [
        wiki(
          'I Knew You Were Trouble',
          'I_Knew_You_Were_Trouble',
          'song article: production shift and reception',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "This is the dubstep drop heard round Nashville: Swift's first full Max Martin/Shellback pop swerve, released as a single in November 2012 and peaking at No. 2 on the Hot 100 with seven weeks atop Pop Songs. By her own account it began as a ballad she wanted to detonate — she asked for a dubstep drop because the sound needed to match the song's chaotic emotions, and Shellback's frantic verse drumbeat transformed it in the room.",
          "Its afterlife is half chart history, half internet history. The screaming-goat remix went viral in early 2013 and outlived the original discourse, while retrospective critics upgraded the song from divisive gamble to durable crossover — the moment the 1989 pivot became inevitable, two years early."
        ],
        meaning: {
          confirmed: [
            "Swift wrote it with Max Martin and Shellback, who produced it; released as a single on November 27, 2012, it peaked at No. 2 on the Hot 100 and spent seven weeks at No. 1 on Pop Songs.",
            "Swift said the dubstep textures were deliberately chosen to mirror the song's chaotic emotions rather than chase a trend, and recounted that it began as a ballad before Shellback's frantic drum suggestion reshaped it during the Red sessions."
          ],
          supported: [
            "Contemporary reviews split on the dubstep gambit — the New York Times praised its boldness while others called it derivative — but retrospective assessments treat it as the rare pop-EDM crossover of its moment that endured.",
            "The song's engine is self-blame rather than accusation: the narrator saw the red flags from the parking lot and walked in anyway, and the drop is the floor giving out."
          ],
          fanTheories: [
            "Fans widely speculate the subject is Harry Styles — whose relationship with Swift coincided with the single's promotion — or alternatively John Mayer; Swift has never publicly named the song's subject."
          ]
        },
        connections: [
          {
            relatedId: "song:red",
            label: "Red",
            why: "The title track files the intensity under a color; Trouble relives the exact moment of choosing it — hindsight versus freefall."
          },
          {
            relatedId: "song:treacherous",
            label: "Treacherous",
            why: "Track three walks toward the danger slowly and knowingly; track four is the same knowledge at full speed with the brakes cut."
          },
          {
            relatedId: "song:we-are-never-ever-getting-back-together",
            label: "We Are Never Ever Getting Back Together",
            why: "The Martin/Shellback trilogy's two poles: Trouble turns the blame inward, Never Ever flips it outward with a flounce."
          }
        ],
        sources: [
          {
            name: "I Knew You Were Trouble — Wikipedia",
            url: "https://en.wikipedia.org/wiki/I_Knew_You_Were_Trouble"
          },
          {
            name: "Rolling Stone: Taylor Swift on How She Created Red",
            url: "https://www.rollingstone.com/music/music-features/500-greatest-albums-taylor-swift-red-1059586/"
          }
        ]
      },
    },
    {
      slug: 'all-too-well',
      trackNumber: 5,
      trackTitle: 'All Too Well',
      youtubeId: '9OQBDdNHmXo', // oEmbed-verified official Taylor Swift channel
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'Never a single, always the masterpiece: born as a 10-plus-minute soundcheck ad-lib on the Speak Now tour, trimmed with Liz Rose, and canonized by fans as the best thing she has ever written.',
      summary:
        'A relationship reconstructed object by object — a scarf left at a sister’s house, an autumn upstate, a refrigerator-light dance — because remembering precisely is the only power left.',
      inspiration:
        'Reportedly began as a long, improvised vent during tour rehearsals; Liz Rose was called in to help carve a song out of it. Taylor has never named the song’s subject.',
      themes: ['memory as evidence', 'grief for a specific autumn', 'the scarf'],
      fanLore:
        'Fan reading (unconfirmed): the endlessly relitigated real-world scarf.',
      easterEggs:
        'Track 5 — the fan-observed emotional-centerpiece slot she later acknowledged as a real tradition.',
      sourceUrl: 'https://en.wikipedia.org/wiki/All_Too_Well',
      sources: [
        wiki('All Too Well', 'All_Too_Well', 'song article: origin story and legacy'),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "All Too Well is the canonical Swift deep cut: never a single, sequenced at track five, and fan-canonized over a decade into the consensus pick for the best thing she has ever written. It began as an improvised vent during February 2011 Speak Now tour rehearsals — Swift ad-libbing over guitar while her band played along — and co-writer Liz Rose was called in to carve a five-and-a-half-minute song out of a draft she recalled running ten to twenty minutes. That origin story became fan scripture long before the full version existed in public.",
          "Its afterlife is the real story. With no single push it reached only No. 80 on the Hot 100 in 2012, then became one of Swift's most requested songs anyway — an underground treasure passed between fans until demand grew loud enough to summon the ten-minute original out of the drawer nine years later. It is also the song that made track five a Swift institution: the emotional-centerpiece slot she later acknowledged as a real tradition."
        ],
        meaning: {
          confirmed: [
            "Swift has described the song's origin as a long, emotional improvised rant during Speak Now tour rehearsals in February 2011, later edited down with co-writer Liz Rose to the 5:28 album version.",
            "It was never released as a single in the Red era; its No. 80 Hot 100 debut came from album play alone, and Swift acknowledged the rumored longer draft for years, joking it was somewhere in a drawer."
          ],
          supported: [
            "Rolling Stone's Rob Sheffield reads it as more than a breakup song: a meditation on how vulnerable the heart is at nineteen or twenty, with the older narrator vindicating her younger self's perception of what happened.",
            "The song works by treating memory as evidence — a relationship reconstructed object by object and scene by scene, because remembering precisely is the only power the narrator has left."
          ],
          fanTheories: [
            "The widely reported fan attribution to Jake Gyllenhaal, whom Swift dated in fall 2010, rests on timeline and the song's autumnal setting — Swift has never confirmed the subject, and this remains an unconfirmed fan theory, not fact.",
            "The scarf became fandom's favorite real-world artifact hunt, complete with a reported sister's-house location and Maggie Gyllenhaal saying in 2017 she had no idea where it was; Swift has never identified the house or the scarf's whereabouts and has only ever discussed the scarf as symbolic."
          ]
        },
        connections: [
          {
            relatedId: "song:all-too-well-10-minute-version",
            label: "All Too Well (10 Minute Version)",
            why: "The 2021 vault release restored the sprawling original this version was carved from — nine years of fan lobbying made the director's cut real."
          },
          {
            relatedId: "song:state-of-grace",
            label: "State of Grace",
            why: "Fans hear the album as one arc: State of Grace is the hopeful collision at the start, All Too Well the autopsy of the same intensity after it ends."
          },
          {
            relatedId: "song:the-moment-i-knew",
            label: "The Moment I Knew",
            why: "Fans cross-reference the two songs' timelines — the birthday party where the one person who mattered never arrived reads like a missing scene from the same story."
          }
        ],
        sources: [
          {
            name: "All Too Well — Wikipedia",
            url: "https://en.wikipedia.org/wiki/All_Too_Well"
          },
          {
            name: "Rolling Stone: Rob Sheffield on All Too Well",
            url: "https://www.rollingstone.com/music/music-features/taylor-swift-all-too-well-rob-sheffield-1235127364/"
          },
          {
            name: "Billboard: How All Too Well Became a Fan Favorite",
            url: "https://www.billboard.com/music/pop/taylor-swift-all-too-well-red-best-songs-9657795/"
          },
          {
            name: "Billboard: Red Track-by-Track Review (2012)",
            url: "https://www.billboard.com/music/music-news/taylor-swift-red-track-by-track-review-1066798/"
          }
        ]
      },
    },
    {
      slug: '22',
      trackNumber: 6,
      trackTitle: '22',
      youtubeId: '9boiT64sm0Q', // oEmbed-verified official Taylor Swift channel
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      singleReleaseDate: '2013-03-12',
      note: 'The birthday-party single that made an age into a brand — and later, the Eras Tour’s nightly hat-giveaway ritual.',
      summary:
        'Being 22 as a mood: dressed up like hipsters, ditching the heartbreak for one night, happy-free-confused in exactly that order.',
      inspiration:
        'Swift tied it to the specific joy of her early-twenties friend group — the rare Red song about friends, not the relationship.',
      themes: ['friendship', 'youth', 'joy as defiance'],
      easterEggs:
        'On the Eras Tour, the 22 hat handed to a young fan each night became one of the tour’s signature traditions.',
      sourceUrl: 'https://en.wikipedia.org/wiki/22_(Taylor_Swift_song)',
      sources: [
        wiki('22 (Taylor Swift song)', '22_(Taylor_Swift_song)', 'song article: single history'),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "22 turned an age into a brand. Written and produced with Max Martin and Shellback and released as Red's fourth single in March 2013, it is the album's rare song about friends instead of the relationship — Swift told Billboard it captures being 22 as still learning but knowing enough, carefree in a way rooted in both freedom and indecision, and told Ryan Seacrest it was inspired by her group of female friends.",
          "A decade later the song acquired a second institution: on the Eras Tour, Swift ended each performance of 22 by handing her black hat to a pre-selected young fan — a nightly ritual Billboard called a staple of the show, running through the tour's final night. Documented recipients ranged from a young dancer whose seat was crowdfunded by fans to Selena Gomez's younger sister, who traded Swift a friendship bracelet for it."
        ],
        meaning: {
          confirmed: [
            "Swift, Max Martin, and Shellback wrote and produced it; released March 12, 2013 as Red's fourth single, it peaked at No. 20 on the Hot 100 and No. 9 in the UK.",
            "Swift described the song as capturing being 22 — still learning but knowing enough, carefree out of freedom and indecision — and said it was inspired by her group of female friends.",
            "On the Eras Tour, the nightly 22 hat handoff to a young fan became one of the show's signature traditions, documented by Billboard through the final night."
          ],
          supported: [
            "Critics treat it as joy-as-craft: Rob Sheffield called it far more fun than actually being 22, The Guardian's Alexis Petridis ranked it among her very best singles, and outlets credit it with turning 22nd birthdays into a cultural milestone.",
            "Within the album it works as deliberate relief — one night of dressing up like hipsters and ditching the heartbreak, sequenced right after the record's heaviest song."
          ],
          fanTheories: [
            "Fans read the song's mocking spoken aside as a jab at a specific detractor or at the too-cool crowd that dismissed her music, and speculate about which real friends the night out depicts; Swift has never identified a target or a cast."
          ]
        },
        connections: [
          {
            relatedId: "song:we-are-never-ever-getting-back-together",
            label: "We Are Never Ever Getting Back Together",
            why: "The Martin/Shellback pop trio's two celebrations: Never Ever dances out of a relationship, 22 dances past the whole subject with friends instead."
          },
          {
            relatedId: "song:stay-stay-stay",
            label: "Stay Stay Stay",
            why: "The album's two palate cleansers — 22 finds lightness in friendship, Stay Stay Stay finds it in domestic comedy — both placed to let Red breathe between wounds."
          },
          {
            relatedId: "song:starlight",
            label: "Starlight",
            why: "Both are youth bottled on purpose: 22 documents her own happy-free-confused present, Starlight invents the same giddiness for two teenagers in 1945."
          }
        ],
        sources: [
          {
            name: "22 (Taylor Swift song) — Wikipedia",
            url: "https://en.wikipedia.org/wiki/22_(Taylor_Swift_song)"
          },
          {
            name: "Billboard: The Final Eras Tour Show's Best Moments",
            url: "https://www.billboard.com/lists/taylor-swift-last-eras-tour-show-best-moments-review/"
          },
          {
            name: "Billboard: Swift Gifts '22' Hat to Young Dancer in Texas",
            url: "https://www.billboard.com/music/music-news/taylor-swift-hat-dancer-fan-eras-tour-texas-1235297568/"
          }
        ]
      },
    },
    {
      slug: 'i-almost-do',
      trackNumber: 7,
      trackTitle: 'I Almost Do',
      youtubeId: 'w1AV_35zVwU', // oEmbed-verified official Taylor Swift channel
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'The letter she never sends — Taylor has said writing this song was how she avoided actually calling.',
      summary:
        'Hovering over the call button after a breakup: every reason to reach out, met by the one reason not to. The song exists so the phone call did not have to.',
      inspiration:
        'Often read as her way of resisting the urge to reconnect — the song replaced the conversation.',
      themes: ['restraint', 'almosts', 'post-breakup gravity'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'we-are-never-ever-getting-back-together',
      trackNumber: 8,
      trackTitle: 'We Are Never Ever Getting Back Together',
      youtubeId: 'zJFcr1KyFqE', // oEmbed-verified official Taylor Swift channel
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback', 'Taylor Swift'],
      singleReleaseDate: '2012-08-13',
      note: 'Her first Hot 100 No. 1 — written in roughly 25 minutes after a friend of an ex walked into the studio and the on-off drama wrote itself.',
      summary:
        'A breakup declared with a flounce and an eye-roll, indie-record condescension included — the never-ever is doing gleeful, spiteful work.',
      inspiration:
        'Studio lore: an associate of an ex interrupted the session, Taylor vented about the never-quite-over relationship, and Martin and Shellback turned the rant into the hook on the spot.',
      themes: ['on-again-off-again fatigue', 'liberation', 'playful spite'],
      sourceUrl: 'https://en.wikipedia.org/wiki/We_Are_Never_Ever_Getting_Back_Together',
      sources: [
        wiki(
          'We Are Never Ever Getting Back Together',
          'We_Are_Never_Ever_Getting_Back_Together',
          'song article: writing story and chart record',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "This is the song that gave Swift her first Billboard Hot 100 No. 1 — leaping from No. 72 to the top on a then-record 623,000 first-week downloads, at the time the biggest digital sales week ever by a female artist. Written with Max Martin and Shellback in roughly 25 minutes after studio talk of the ex reconciling, with Swift improvising the central refrain on acoustic guitar and asking the room whether it was too obvious, it became Red's lead single and spent nine straight weeks atop Hot Country Songs — breaking a record that had stood since 1965.",
          "It also settled, in real time, what kind of album Red would be. Swift has called Red her only true breakup album, and this was its opening argument: a kiss-off whose gleeful, spiteful comedy divided critics along exactly the line — pop mischief versus commercial calculation — that the rest of her career would keep arguing about."
        ],
        meaning: {
          confirmed: [
            "It was Swift's first Hot 100 No. 1, jumping 72-to-1 on 623,000 first-week downloads — then the biggest digital sales week by a female artist — and spent nine consecutive weeks atop Hot Country Songs, a record dating to 1965.",
            "Swift wrote it with Max Martin and Shellback in about 25 minutes, sparked by studio talk of the ex reconciling; she said the song targets a relationship in which she felt constantly critiqued — an ex who judged her taste in music — and hoped it would be a hit so he would have to hear it."
          ],
          supported: [
            "Critics split on its kiss-off comedy: Rolling Stone praised its zing and Billboard highlighted the sardonic sneer in Swift's delivery, while dissenters heard commercial calculation — the divide itself became part of the song's story.",
            "The spoken-word aside and the mocking indie-record jab work as theater: a breakup declared with a flounce, where the never-ever is doing gleeful, spiteful work on purpose."
          ],
          fanTheories: [
            "Fans and press very widely assume the ex is Jake Gyllenhaal, pointing to the timeline and the indie-music-snobbery jab; Swift has described the relationship's dynamic in interviews but has never publicly named the person."
          ]
        },
        connections: [
          {
            relatedId: "song:i-knew-you-were-trouble",
            label: "I Knew You Were Trouble",
            why: "The Martin/Shellback trilogy's two poles: Never Ever aims the blame outward with a laugh, Trouble turns it inward with a drop."
          },
          {
            relatedId: "song:22",
            label: "22",
            why: "Liberation in two stages — first the door slams on the ex, then the friends arrive and the night out begins."
          },
          {
            relatedId: "song:the-last-time",
            label: "The Last Time",
            why: "The same on-again-off-again exhaustion played straight: The Last Time stands wearily at the door Never Ever gleefully bolts shut."
          }
        ],
        sources: [
          {
            name: "We Are Never Ever Getting Back Together — Wikipedia",
            url: "https://en.wikipedia.org/wiki/We_Are_Never_Ever_Getting_Back_Together"
          },
          {
            name: "Billboard: Taylor Swift Scores First Hot 100 No. 1 (2012)",
            url: "https://www.billboard.com/music/music-news/taylor-swift-scores-first-hot-100-no-1-480315/"
          },
          {
            name: "Rolling Stone: Taylor Swift on How She Created Red",
            url: "https://www.rollingstone.com/music/music-features/500-greatest-albums-taylor-swift-red-1059586/"
          }
        ]
      },
    },
    {
      slug: 'stay-stay-stay',
      trackNumber: 9,
      trackTitle: 'Stay Stay Stay',
      youtubeId: 'OhJ-S9Nrh7Q', // oEmbed-verified official Taylor Swift channel
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'The album’s screen-door palate cleanser — a fight that ends in laughter instead of a bridge full of tears.',
      summary:
        'Domestic comedy about a couple who argue and stay: she throws a phone, he shows up with a football helmet, and staying becomes the punchline and the point.',
      inspiration:
        'Swift called it an idealized sketch of the kind of easygoing love she had observed rather than lived — deliberately placed after the album’s heaviest stretch.',
      themes: ['staying', 'humor in love', 'domestic warmth'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'the-last-time',
      trackNumber: 10,
      trackTitle: 'The Last Time',
      youtubeId: 'pCH4QrSx2Jg', // oEmbed-verified official Taylor Swift channel
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift', 'Gary Lightbody', 'Jacknife Lee'],
      producers: ['Jacknife Lee'],
      isSingle: true,
      note: 'The Snow Patrol summit: Gary Lightbody duets on two exhausted people meeting at the same doorway one more time.',
      summary:
        'A dual-perspective standoff — his side pleading for one more chance, hers worn down from giving them — sung simultaneously because neither is listening.',
      inspiration:
        'Written with Lightbody and Jacknife Lee; Swift described wanting a duet where both parties talk past each other on purpose.',
      themes: ['last chances', 'exhaustion', 'two sides of one door'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Last_Time_(Taylor_Swift_song)',
      sources: [
        wiki(
          'The Last Time (Taylor Swift song)',
          'The_Last_Time_(Taylor_Swift_song)',
          'song article: collaboration details',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "The Last Time is Red's most formally ambitious experiment: a dual-perspective duet with Snow Patrol's Gary Lightbody, produced by Jacknife Lee, in which two exhausted people sing past each other at the same doorway. Swift's own visual for it — a man on his knees outside a door, the girlfriend he keeps leaving on the other side — is the whole song in one image, and she called the feeling it chases a really fragile emotion: wanting to love someone without knowing if it's smart to.",
          "It matters as proof of Red's range. Released as a UK single in late 2013, the brooding, string-laden ballad sits at the album's midpoint like a held breath between the pop singles — praised for its orchestration even by critics (Rob Sheffield among them) who argue the two voices never quite blend. The disagreement is the point: it is the album's most debated track precisely because it risks the most."
        ],
        meaning: {
          confirmed: [
            "Swift wrote it with Gary Lightbody and Jacknife Lee, who produced it; Mercury released it as a UK single on November 4, 2013, where it peaked at No. 25.",
            "Swift said it was based on her experience with an unreliable ex who kept leaving and coming back, described her visual of a man on his knees outside a door, and called the song's feeling a really fragile emotion — wanting to love someone without knowing if it's smart to."
          ],
          supported: [
            "Critics received it as a brooding orchestral power ballad, praising the strings and Lightbody's vocal even where they questioned the duet chemistry.",
            "The two simultaneous vocal lines dramatize the impasse structurally: his plea and her exhaustion occupy the same bars because neither is actually listening to the other."
          ],
          fanTheories: [
            "Fans and press widely tie the song to Jake Gyllenhaal, reading the on-again-off-again scenario and an album liner clue as pointing to that chapter — Rolling Stone's 2012 subject guide named him the likeliest candidate while remaining explicitly speculative; Swift has only ever described the subject as an unreliable ex."
          ]
        },
        connections: [
          {
            relatedId: "song:i-almost-do",
            label: "I Almost Do",
            why: "Two sides of the same threshold: I Almost Do hovers over the call button and never presses it, The Last Time answers the door one more time."
          },
          {
            relatedId: "song:we-are-never-ever-getting-back-together",
            label: "We Are Never Ever Getting Back Together",
            why: "The same revolving-door relationship at two temperatures — played for weary drama here, for gleeful farce there."
          },
          {
            relatedId: "song:sad-beautiful-tragic",
            label: "Sad Beautiful Tragic",
            why: "Red's two slow exhalations: The Last Time is the standoff while it can still be saved, Sad Beautiful Tragic the fog after nobody saved it."
          }
        ],
        sources: [
          {
            name: "The Last Time (Taylor Swift song) — Wikipedia",
            url: "https://en.wikipedia.org/wiki/The_Last_Time_(Taylor_Swift_song)"
          },
          {
            name: "NPR: Taylor Swift — 'My Confidence Is Easy to Shake' (2012)",
            url: "https://www.npr.org/2012/11/03/164186569/taylor-swift-my-confidence-is-easy-to-shake"
          },
          {
            name: "Rolling Stone: Rob Sheffield Ranks Every Taylor Swift Song",
            url: "https://www.rollingstone.com/music/music-lists/taylor-swift-songs-ranked-rob-sheffield-201800/"
          }
        ]
      },
    },
    {
      slug: 'holy-ground',
      trackNumber: 11,
      trackTitle: 'Holy Ground',
      youtubeId: 'S4PuN-IWi2g', // oEmbed-verified official Taylor Swift channel
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Jeff Bhasker'],
      note: 'The drum-driven sprint where a past relationship finally gets remembered fondly — grace instead of a grudge.',
      summary:
        'Years later, the anger burns off and what is left is gratitude: the time was good, the dancing happened, the ground it stood on gets consecrated.',
      inspiration:
        'Often read as coming from realizing she could look back at a long-ended relationship and feel thankful rather than bitter.',
      themes: ['retrospective grace', 'gratitude', 'making peace with the past'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Holy_Ground_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Holy Ground (Taylor Swift song)',
          'Holy_Ground_(Taylor_Swift_song)',
          'song article: background',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "Holy Ground is where Red forgives. Produced by Jeff Bhasker on insistent, driving drums, it sprints through a long-ended relationship and — for the first time on the album — comes out grateful. Swift said the romance behind it had ended years before she wrote it, and that she found herself looking back with appreciation instead of bitterness: the time was good, the dancing happened, and the ground it stood on gets consecrated rather than salted.",
          "Critics treat it as a hidden summit of the record: Rob Sheffield ranks it among her very best, likening its rapid emotional escalation to a daredevil stunt and flagging it as a Red Tour standout, where Swift played drums on it. Never a single, it charted anyway in 2012 and again when the Taylor's Version re-record reached the Hot 100 in 2021 — deep-cut devotion measured in numbers."
        ],
        meaning: {
          confirmed: [
            "Jeff Bhasker produced the uptempo, drum-driven track, which blends arena, country, and heartland rock.",
            "Swift said the relationship that inspired it had ended years before she wrote the song, and that she looked back on it with appreciation rather than bitterness — glad to have had it in her life."
          ],
          supported: [
            "Rob Sheffield ranks it among Swift's best songs, comparing its rapid emotional escalation to a daredevil stunt and noting its 1980s-rock guitar language and Red Tour showcase.",
            "Musicologist James E. Perone reads it as evidence of her maturing pen: a charmingly complicated view of a failed relationship, a deliberate departure from the more bitter breakup framing of earlier records."
          ],
          fanTheories: [
            "Fans widely read it as being about Joe Jonas, decoding an album liner clue about someone coming to a show in San Diego as Jonas attending her October 2011 concert years after their breakup; a competing 2012 Rolling Stone reading proposed Jake Gyllenhaal from the same clue. Swift has never confirmed either — the coexisting theories are the proof."
          ]
        },
        connections: [
          {
            relatedId: "song:begin-again",
            label: "Begin Again",
            why: "Red's two recoveries: Holy Ground makes peace with the past at a sprint, Begin Again walks calmly into what comes after it."
          },
          {
            relatedId: "song:state-of-grace",
            label: "State of Grace",
            why: "Bookend arguments for the same thesis — love as a risk worth taking — made before the fall and long after it."
          },
          {
            relatedId: "song:the-very-first-night",
            label: "The Very First Night",
            why: "Both dance back to a relationship's good early days; Holy Ground blesses the memory, the vault track misses it out loud."
          }
        ],
        sources: [
          {
            name: "Holy Ground (Taylor Swift song) — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Holy_Ground_(Taylor_Swift_song)"
          },
          {
            name: "Rolling Stone: Rob Sheffield ranks Holy Ground",
            url: "https://www.rollingstone.com/music/music-lists/taylor-swift-songs-ranked-rob-sheffield-201800/holy-ground-2012-205510/"
          },
          {
            name: "Rolling Stone: A Guide to the Subjects of Red's Songs (2012)",
            url: "https://www.rollingstone.com/music/music-news/taylor-swifts-red-an-almost-definitive-guide-to-subjects-of-all-19-songs-247227/"
          }
        ]
      },
    },
    {
      slug: 'sad-beautiful-tragic',
      trackNumber: 12,
      trackTitle: 'Sad Beautiful Tragic',
      youtubeId: 'jQfB4Gahi3I', // oEmbed-verified official Taylor Swift channel
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'Written on the tour bus in one sitting — a waltz-time eulogy she has said she wanted to feel like the fog of remembering.',
      summary:
        'A relationship viewed from the far shore: no blame left, just the three adjectives of the title taking turns.',
      inspiration:
        'Reportedly written alone on her tour bus, chasing the hazy mood of a memory rather than the events themselves.',
      themes: ['mourning', 'haze of memory', 'acceptance'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      sources: [ALBUM],
      dossier: {
        whyItMatters: [
          "The quietest breakup song on Red, written at the point when the anger had already burned off. Swift told Billboard the feeling by then 'wasn't sadness and anger or those things anymore. It was wistful loss,' and she built the song from a single rhyme of magic with tragic. She described it as a breakup song in the form of a funeral march, at the opposite end of Red's emotional range from the pop smash 'We Are Never Ever Getting Back Together'.",
          "It is the album's clearest example of memory as haze rather than argument. In Swift's words she wanted a 'cloudy recollection of what went wrong,' 'the murky gray, looking back on something you can't change or get back.'"
        ],
        meaning: {
          confirmed: [
            "Track 12 of Red (released October 22, 2012), written by Taylor Swift alone and produced by Swift and Nathan Chapman.",
            "Swift told Billboard: 'It was after a show and I was on the bus thinking about this relationship that ended months and months before... I just got my guitar and I hit on the fact that I was thinking in terms of rhyming; I rhymed magic with tragic, changed a few things and ended it with what a sad beautiful tragic love affair.'",
            "In Billboard's cover story she placed it at one end of Red's spectrum: 'Sad Beautiful Tragic' is a breakup song in the form of a funeral march, and 'We Are Never Ever Getting Back Together' is a breakup song in the form of a parade."
          ],
          supported: [
            "The Wikipedia article on Red describes it as an intimate, melancholic acoustic track built from overdubs of acoustic instruments, and groups it with the album's tracks that keep the country sound of her earlier records.",
            "Musicologist James E. Perone, cited there, argues the song extends the 'lyrical impressionism' of her writing, stacking images without drawing a straight line between them, which matches Swift's stated goal of a recollection that stays blurry."
          ]
        },
        connections: [
          {
            relatedId: "song:we-are-never-ever-getting-back-together",
            label: "We Are Never Ever Getting Back Together",
            why: "Swift named the pair herself as the two ends of Red's range in Billboard's cover story: this one a funeral march, that one a parade."
          },
          {
            relatedId: "song:all-too-well",
            label: "All Too Well",
            why: "Red's acoustic, country-rooted core: the Red article lists the two among the songs that keep the sound of her earlier albums alive on a record otherwise full of pop and rock."
          },
          {
            relatedId: "song:begin-again",
            label: "Begin Again",
            why: "Also listed with it in the Red article's group of country-leaning songs."
          }
        ],
        voices: [
          {
            who: "Taylor Swift",
            context: "Interview with Billboard, 2012",
            note: "On the mood of the song: 'It's kind of the murky gray, looking back on something you can't change or get back.'"
          }
        ],
        sources: [
          {
            name: "Taylor Swift Q&A: The Risks of 'Red' and The Joys of Being 22 - Billboard",
            url: "https://www.billboard.com/music/music-news/taylor-swift-qa-the-risks-of-red-and-the-joys-of-being-22-474565/"
          },
          {
            name: "Taylor Swift's 'Red': The Billboard Cover Story - Billboard",
            url: "https://www.billboard.com/music/music-news/taylor-swifts-red-the-billboard-cover-story-474541/"
          },
          {
            name: "Red (Taylor Swift album) - Wikipedia",
            url: "https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)"
          },
          {
            name: "Sad Beautiful Tragic by Taylor Swift - Songfacts",
            url: "https://www.songfacts.com/facts/taylor-swift/sad-beautiful-tragic"
          }
        ]
      },
    },
    {
      slug: 'the-lucky-one',
      trackNumber: 13,
      trackTitle: 'The Lucky One',
      youtubeId: '4LtQxA_ooLk', // oEmbed-verified official Taylor Swift channel
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Jeff Bhasker'],
      note: 'Her fame-parable about the star who took the money and vanished — written by someone quietly wondering if she would ever want the same exit.',
      summary:
        'A golden-age starlet chooses a rose garden over Madison Square Garden; the narrator, now famous herself, starts to suspect the runaway was the lucky one.',
      inspiration:
        'Often read as inspired by artists who walked away from fame at their peak; fans map it onto figures like Joni Mitchell (unconfirmed specifics).',
      themes: ['cost of fame', 'escape', 'foreshadowing'],
      fanLore:
        'Fan reading (unconfirmed): Joni Mitchell as the model — Mitchell was separately attached to a shelved biopic Swift was once linked to.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      sources: [ALBUM],
      dossier: {
        whyItMatters: [
          "Billboard's 2012 track-by-track review of Red described it as a Hollywood cautionary tale about the perils of fame that starts out as a diatribe against celebrity.",
          "It resurfaced on the Eras Tour: Billboard's surprise-song list reports Swift played it on piano in Arlington, Texas on April 2, 2023, with the audience singing along."
        ],
        meaning: {
          confirmed: [
            "Introducing it in Arlington, Swift quipped, 'It's about how horrible being famous is,' as quoted by Billboard. Billboard characterized the line as a quip, so treat it as her short, wry summary rather than a full account of the song."
          ],
          supported: [
            "Billboard's 2012 reviewer read the song as moving from a rant against celebrity to a closing turn toward the story of an artist who stepped away from the spotlight. That is the reviewer's reading, not a statement from Swift."
          ]
        },
        live: [
          {
            date: "April 2, 2023",
            event: "The Eras Tour, Arlington (AT&T Stadium)",
            note: "Billboard's surprise-song list says she played it on piano, looking pleased as the audience sang along."
          }
        ],
        sources: [
          {
            name: "Taylor Swift, 'Red': Track-By-Track Review - Billboard",
            url: "https://www.billboard.com/music/music-news/taylor-swift-red-track-by-track-review-1066798/"
          },
          {
            name: "All the Surprise Songs Taylor Swift Performed on The Eras Tour - Billboard",
            url: "https://www.billboard.com/lists/taylor-swift-eras-tour-surprise-songs/"
          }
        ]
      },
    },
    {
      slug: 'everything-has-changed',
      trackNumber: 14,
      trackTitle: 'Everything Has Changed',
      youtubeId: 'eMcMbWl0fDk', // oEmbed-verified official Taylor Swift channel
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift', 'Ed Sheeran'],
      producers: ['Butch Walker'],
      isSingle: true,
      note: 'Written with Ed Sheeran on a trampoline in her backyard — an early session in what became pop’s most durable friendship.',
      summary:
        'The first-meeting butterflies duet: two people who just met and already divide time into before and after.',
      inspiration:
        'Origin as reported: Taylor and Sheeran wrote it bouncing on her trampoline in early 2012, then cut it with Butch Walker; Sheeran opened the Red Tour the next year.',
      themes: ['new love', 'friendship origin story', 'beginnings'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Everything_Has_Changed',
      sources: [
        wiki(
          'Everything Has Changed',
          'Everything_Has_Changed',
          'song article: trampoline writing session',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "Everything Has Changed is the origin document of pop's most durable friendship: Swift and Ed Sheeran wrote it bouncing on a trampoline in her backyard during the Red sessions, then handed it to Butch Walker — chosen, Swift said, because he would approach it from an organic place, which is where Sheeran comes from. Released as the album's sixth single in July 2013, it arrived with a video that cast child doppelgängers of the two singers while the real ones toured North America together.",
          "The song itself is the album's first-meeting butterflies distilled: two people who just met already dividing time into before and after. Its long afterlife — Red Tour duets in 2013-14, then a reunion performance on the Eras Tour in 2024 — turned a modest chart single into one of the era's most rewatched friendships."
        ],
        meaning: {
          confirmed: [
            "Swift and Ed Sheeran wrote it together on a trampoline in her backyard; Butch Walker produced it, with Swift saying she chose him because he would approach the song from an organic place.",
            "Released as Red's sixth single (UK July 14, US July 16, 2013), it peaked at No. 32 on the Hot 100, No. 7 in the UK, and No. 28 in both Australia and Canada.",
            "The Philip Andelman-directed video premiered June 6, 2013: it cast child doppelgängers — Ava Ames as young Taylor and Jack Lewis as young Ed — who meet at school and are revealed at the end to be the singers' own children. The same two actors reunited nine years later for Sheeran's 'The Joker and the Queen' video (2022).",
            "A Taylor's Version followed on Red (Taylor's Version) (November 2021): Sheeran re-recorded his vocal — teasing the studio session in an August 23, 2021 video — and the re-cut reached No. 59 on the Billboard Global 200, No. 63 on the Hot 100, and No. 51 in Canada."
          ],
          supported: [
            "Critics split on the duet: the AP's Mesfin Fekadu singled out the pair's falsetto harmonies and Randall Roberts (Los Angeles Times) called it a 'powerful collaboration,' while Jon Caramanica (New York Times) judged the writing weaker than her past work and NME's Sian Rowe called it 'disappointing.' Its cultural weight ended up biographical: the recorded beginning of the Swift-Sheeran partnership.",
            "The song treats a first meeting as a hinge in time: what matters isn't the romance's outcome but the instant certainty that everything after it will be different."
          ],
          fanTheories: [
            "Rolling Stone's 2012 speculative subject guide read an album liner clue as pointing to Conor Kennedy as the new romance in the song; Swift has never named a subject — the documented facts are only that she wrote it with Sheeran about the openness of a new connection."
          ]
        },
        connections: [
          {
            relatedId: "song:run",
            label: "Run",
            why: "The other trampoline-era Sheeran co-write, written the first day they met and vaulted for nine years — the same partnership's secret first chapter."
          },
          {
            relatedId: "song:end-game",
            label: "End Game",
            why: "The Swift-Sheeran friendship's next studio chapter — a 2017 reputation collaboration (with Future) that turned a one-off Red duet into a recurring partnership."
          },
          {
            relatedId: "song:begin-again",
            label: "Begin Again",
            why: "Red's two new-beginning songs: Begin Again notices hope returning after damage, Everything Has Changed catches it arriving all at once."
          },
          {
            relatedId: "song:message-in-a-bottle",
            label: "Message in a Bottle",
            why: "Both bottle the fizzy hope of a connection that's barely started — one written with Sheeran, the other the first-ever Martin/Shellback collaboration from the same sessions."
          }
        ],
        sources: [
          {
            name: "Everything Has Changed — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Everything_Has_Changed"
          },
          {
            name: "Billboard: Swift and Sheeran Return to Childhood in Video (2013)",
            url: "https://www.billboard.com/music/music-news/taylor-swift-ed-sheeran-return-to-childhood-in-everything-has-1566117/"
          },
          {
            name: "Variety: Sheeran/Swift 'Joker and the Queen' video reunites 'Everything Has Changed' child actors (2022)",
            url: "https://variety.com/2022/music/news/ed-sheeran-taylor-swift-video-duet-joker-queen-everything-has-changed-actors-1235178135/"
          },
          {
            name: "Rolling Stone: A Guide to the Subjects of Red's Songs (2012)",
            url: "https://www.rollingstone.com/music/music-news/taylor-swifts-red-an-almost-definitive-guide-to-subjects-of-all-19-songs-247227/"
          }
        ]
      },
    },
    {
      slug: 'starlight',
      trackNumber: 15,
      trackTitle: 'Starlight',
      youtubeId: 'lPvcwgEuKTg', // oEmbed-verified official Taylor Swift channel
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman', 'Dann Huff'],
      note: 'Sparked by a single old photograph of Ethel and Bobby Kennedy dancing as teenagers in 1945 — historical fan-fiction, Taylor style.',
      summary:
        'She invents the whole night around one snapshot: two seventeen-year-olds crashing a yacht-club party, the future unwritten and gleaming.',
      inspiration:
        'Reportedly written after seeing a vintage photo of young Ethel and Robert F. Kennedy; Ethel Kennedy attended a screening of the video era with her.',
      themes: ['imagined history', 'youthful glamour', 'possibility'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Starlight_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Starlight (Taylor Swift song)',
          'Starlight_(Taylor_Swift_song)',
          'song article: Kennedy photo origin',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'begin-again',
      trackNumber: 16,
      trackTitle: 'Begin Again',
      youtubeId: 'dXNZaHuKWNA', // oEmbed-verified official Taylor Swift channel
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman', 'Dann Huff'],
      singleReleaseDate: '2012-10-01',
      note: 'The gentle country closer released as the second single — a Wednesday-café first date that quietly reboots her belief in the whole enterprise.',
      summary:
        'After months of bracing for criticism that never comes, she notices she is laughing on a first date — and that heartbreak did not get the last word.',
      inspiration:
        'Swift described it as the moment of realizing a past relationship’s scorn was not the universal condition of love.',
      themes: ['healing', 'first dates after heartbreak', 'renewal'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Begin_Again_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Begin Again (Taylor Swift song)',
          'Begin_Again_(Taylor_Swift_song)',
          'song article: single release',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "Begin Again is Red's quiet thesis about recovery: released October 1, 2012 as the album's second single — deliberately country and gentle right after the lead single's pop detonation — it debuted and peaked at No. 7 on the Hot 100 and went platinum within six months. Swift's own framing, delivered on Good Morning America as the song premiered, is the plainest she has ever been about a track: it's about getting through a really bad relationship, dusting yourself off, and the vulnerability of a first date after a horrible breakup.",
          "As the standard edition's closer, it does structural work no other Red song can: after fifteen tracks of collision and wreckage, the album ends on a Wednesday-café first date where she notices she's laughing. Critics from Rolling Stone to Billboard read the restraint as maturity, and musicologist James E. Perone hears it as the record's thematic conclusion — the wreckage surveyed, something lasting finally possible."
        ],
        meaning: {
          confirmed: [
            "Released October 1, 2012 as Red's second single, produced by Swift with Dann Huff and Nathan Chapman; it debuted and peaked at No. 7 on the Hot 100, hit No. 3 on Country Airplay, and was certified platinum in March 2013.",
            "Swift described it as a song about getting through a really bad relationship, dusting yourself off, and the vulnerability of going on a first date after a horrible breakup — previewed on Good Morning America before a midnight iTunes debut."
          ],
          supported: [
            "Rob Sheffield called it a deceptively simple ballad that sneaks up and steamrolls you; Billboard ranked it among 2012's best songs, citing its artistic maturity.",
            "Perone reads it as Red's thematic conclusion: the album's arc lands not on revenge or grief but on the possibility of a deeper, more lasting relationship."
          ],
          fanTheories: [
            "The widely reported reading casts the healing first date as Conor Kennedy with the bad relationship left behind as the Gyllenhaal chapter — though fan press has noted the song was written before the Kennedy romance began, which keeps the speculation unresolved; Swift has only ever described the scenario, never its cast."
          ]
        },
        connections: [
          {
            relatedId: "song:holy-ground",
            label: "Holy Ground",
            why: "Red's two recoveries in sequence: Holy Ground makes peace with what ended, Begin Again risks what comes next."
          },
          {
            relatedId: "song:everything-has-changed",
            label: "Everything Has Changed",
            why: "Both catch love at the threshold — Begin Again cautiously over coffee on a Wednesday, Everything Has Changed all at once on a trampoline."
          },
          {
            relatedId: "song:state-of-grace",
            label: "State of Grace",
            why: "The album's frame: the opener declares love worth the risk, and the standard edition's closer quietly proves it by trying again."
          }
        ],
        sources: [
          {
            name: "Begin Again (Taylor Swift song) — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Begin_Again_(Taylor_Swift_song)"
          },
          {
            name: "Billboard: Taylor Swift Wants to 'Begin Again' on New Single (2012)",
            url: "https://www.billboard.com/articles/news/474935/taylor-swift-wants-to-begin-again-on-new-single-listen"
          },
          {
            name: "Rolling Stone: A Guide to the Subjects of Red's Songs (2012)",
            url: "https://www.rollingstone.com/music/music-news/taylor-swifts-red-an-almost-definitive-guide-to-subjects-of-all-19-songs-247227/"
          }
        ]
      },
    },
    {
      slug: 'the-moment-i-knew',
      trackNumber: 17,
      trackTitle: 'The Moment I Knew',
      youtubeId: 'LmXn6BU16e0', // oEmbed-verified official Taylor Swift channel
      release: 'Red (Deluxe Edition)',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'The deluxe cut about the birthday party where the one person who mattered never walked in.',
      summary:
        'Standing in a party dress watching the door: the relationship ends not with a fight but with an empty doorway at her own birthday.',
      inspiration:
        'Swift has not named the song’s subject; the party scenario is the song’s own explicit frame.',
      themes: ['disappointment', 'the no-show', 'endings you watch happen'],
      fanLore:
        'Fan reading (unconfirmed): the 21st-birthday timeline fans cross-reference with All Too Well.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'come-back-be-here',
      trackNumber: 18,
      trackTitle: 'Come Back... Be Here',
      youtubeId: 'hHWOAUjnmjQ', // oEmbed-verified official Taylor Swift channel
      release: 'Red (Deluxe Edition)',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift', 'Dan Wilson'],
      producers: ['Dan Wilson'],
      note: 'The long-distance lament from the deluxe edition — New York to London measured in time zones and second-guessing.',
      summary:
        'One perfect weekend, then an ocean: she resents geography itself for interrupting something that had barely started.',
      inspiration: null,
      themes: ['long distance', 'bad timing', 'longing'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'girl-at-home',
      trackNumber: 19,
      trackTitle: 'Girl at Home',
      youtubeId: 'UNckfN9upqo', // oEmbed-verified official Taylor Swift channel
      release: 'Red (Deluxe Edition)',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'The deluxe track that turns down a taken man on principle — later given a full synth-pop makeover on Taylor’s Version.',
      summary:
        'A flirtatious guy with a girlfriend gets shut down out of solidarity: it is not about jealousy, it is about the girl at home.',
      inspiration: null,
      themes: ['loyalty between women', 'principles', 'rejection as ethics'],
      easterEggs:
        'The 2021 re-record (produced by Elvira Anderfjärd) reinvented it as glittering synth-pop — the most changed arrangement on Red TV.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      sources: [ALBUM, TV],
    },
    {
      slug: 'ronan',
      trackNumber: 21,
      trackTitle: 'Ronan',
      youtubeId: 'kdiBc40gW7s', // oEmbed-verified official Taylor Swift channel
      release: "Charity single / Red (Taylor's Version)",
      releaseDate: '2012-09-08',
      writers: ['Taylor Swift', 'Maya Thompson'],
      producers: ['Taylor Swift', 'Christopher Rowe'],
      singleReleaseDate: '2012-09-08',
      note: 'The charity single built from a grieving mother’s blog — Maya Thompson shares the writing credit, and every profit went to cancer research.',
      summary:
        'A eulogy for Ronan Thompson, written in his mother’s words and voice — one of Swift’s heaviest songs.',
      inspiration:
        'Composed from phrases in Maya Thompson’s blog about her son; Thompson is credited as co-writer and approved its Red TV inclusion.',
      themes: ['grief', 'a mother’s love', 'memorial'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Ronan_(song)',
      sources: [
        wiki('Ronan (song)', 'Ronan_(song)', 'song article: charity origin and credit'),
        TV,
      ],
      dossier: {
        whyItMatters: [
          "Rolling Stone reported on September 8, 2012 that Swift debuted the song at that year's Stand Up To Cancer telethon, and that it then became available on iTunes with all proceeds donated to the Taylor Swift Charitable Fund. Billboard later called it an iTunes-exclusive charity single at the time.",
          "In July 2021 Billboard reported the song would appear on Red (Taylor's Version), and that Swift had emailed its co-writer to ask how she would feel about that. Rolling Stone's review of the re-recording called it 'a one-of-a-kind song for her.'"
        ],
        meaning: {
          confirmed: [
            "Billboard's critic's essay reports that at an Arizona stop on the 1989 World Tour, with the song's co-writer in the audience, Swift introduced it by saying that since she became a fan of the blog behind it, 'cancer has hit really close to me and my family.' She warned fans she might not be able to get through it. The essay says the song rarely drew public comment from her."
          ],
          supported: [
            "Rolling Stone and Billboard report the song was built from Maya Thompson's blog about her young son, Ronan (Billboard names it 'Rockstar Ronan'), and that Thompson is credited as co-writer. Billboard says it is written from the mother's perspective.",
            "Billboard's 2021 lyric-video report says that, according to one of Thompson's blog posts, Swift asked her permission to include the song on Red (Taylor's Version). That is Billboard relaying Thompson's account; Swift's own statement is not quoted."
          ]
        },
        live: [
          {
            date: "September 2012",
            event: "Stand Up To Cancer telethon",
            note: "Rolling Stone's report, dated September 8, 2012, describes the debut performance as 'Friday night's.' Billboard's 2018 essay calls it a televised performance, and its 2021 report says the boy's face was shown behind her on stage."
          }
        ],
        voices: [
          {
            who: "Maya Thompson",
            context: "On Twitter after seeing the Taylor's Version lyric video, November 11, 2021, as quoted by Billboard",
            note: "She thanked Swift for loving her son: 'You are one of the greatest loves of my life. TY for loving him.'"
          }
        ],
        sources: [
          {
            name: "Taylor Swift Debuts 'Ronan' at Stand Up To Cancer Benefit - Rolling Stone",
            url: "https://www.rollingstone.com/music/music-news/taylor-swift-debuts-ronan-at-stand-up-to-cancer-benefit-122781/"
          },
          {
            name: "'Ronan' Finds a Home on Taylor Swift's Re-Recorded 'Red' Album - Billboard",
            url: "https://www.billboard.com/music/pop/taylor-swift-ronan-red-taylors-version-9608693/"
          },
          {
            name: "Taylor Swift Releases Touching Tribute Lyric Video 'Ronan' With Permission From Family - Billboard",
            url: "https://www.billboard.com/music/pop/taylor-swift-ronan-music-video-9659226/"
          },
          {
            name: "Why Taylor Swift's 'Ronan' Is Her Best Song Never to Appear on an Album: Critic's Take - Billboard",
            url: "https://www.billboard.com/music/pop/taylor-swift-ronan-best-non-album-song-8030275/"
          },
          {
            name: "'Red (Taylor's Version)' Makes a Classic Even Better - Rolling Stone",
            url: "https://www.rollingstone.com/music/music-album-reviews/review-red-taylors-version-1255956/"
          }
        ]
      },
    },
    {
      slug: 'better-man',
      trackNumber: 22,
      trackTitle: 'Better Man',
      youtubeId: 'PReSQYTFvcs', // oEmbed-verified official Taylor Swift channel
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      isFromTheVault: true,
      note: 'Written for Red, shelved, then gifted to Little Big Town in 2016 — where it won CMA Song of the Year before her own version surfaced in the vault.',
      summary:
        'Missing someone and refusing to apologize for leaving: the love was real, but so was the pattern — she just wishes he had been a better man.',
      inspiration:
        'History: cut from the original Red, recorded by Little Big Town in 2016 (CMA Song of the Year), reclaimed by Taylor on Red TV.',
      themes: ['leaving well', 'grief without regret', 'what he could have been'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Better_Man_(Little_Big_Town_song)',
      sources: [
        wiki(
          'Better Man (Little Big Town song)',
          'Better_Man_(Little_Big_Town_song)',
          'song article: Swift authorship and awards',
        ),
        TV,
      ],
      dossier: {
        whyItMatters: [
          "\"Better Man\" carries one of the best songwriter stories in the catalog: Swift wrote it alone during the original Red era, left it off the 2012 album, and in 2016 gave it away to Little Big Town — where the song she'd shelved became a phenomenon she hadn't. As the lead single of the group's 2017 album The Breaker it topped Billboard's Hot Country Songs (Feb. 11, 2017) and Country Airplay charts and reached No. 34 on the Hot 100, won CMA Song of the Year in 2017, and won the group the Grammy for Best Country Duo/Group Performance at the 2018 ceremony — their third Grammy. Swift was credited throughout as the sole writer.",
          "Reclaiming it on Red (Taylor's Version) in 2021 closed the loop — the writer finally recording the words she'd handed to someone else. Aaron Dessner's vault production reframes the country-radio hit as a folklore-adjacent ballad, and Rolling Stone later ranked \"Better Man\" No. 50 among Swift's 229 songs, unusual standing for a track most listeners first knew as another act's single."
        ],
        meaning: {
          confirmed: [
            "Swift wrote \"Better Man\" alone during the original Red era and cut it from the 2012 album; in 2016 she gave it to the country group Little Big Town, credited as its sole writer.",
            "Little Big Town released it as the lead single of their 2017 album The Breaker; it reached No. 1 on Billboard's Hot Country Songs (Feb. 11, 2017) and Country Airplay charts and No. 34 on the Hot 100, won CMA Song of the Year in 2017, and won the group the Grammy for Best Country Duo/Group Performance at the 2018 ceremony.",
            "Swift released her own \"Better Man (Taylor's Version) (From The Vault)\" on Red (Taylor's Version) on Nov. 12, 2021, produced with Aaron Dessner; it debuted at No. 52 on the Hot 100 among the album's 26 charting songs.",
            "Swift has performed it live on the Eras Tour as an acoustic surprise song — in Foxborough, Mass. on May 19, 2023, and again in Gelsenkirchen, Germany on July 19, 2024, mashed up with \"It's Time to Go.\""
          ],
          supported: [
            "Dessner's vault production leans on acoustic and high-strung guitar, lap steel, and the London Contemporary Orchestra rather than Little Big Town's four-part country-radio harmony, placing the reclaimed cut sonically closer to Swift's 2020 folklore/evermore albums than to 2012 Red.",
            "Critics and retrospective rankings have treated the vault version as a highlight of the Red (Taylor's Version) release — Rolling Stone placed it No. 50 in its 2022 ranking of all Swift songs — reading the reclamation itself as the point."
          ],
          fanTheories: [
            "Because Swift kept the muse private and the lyric stays general, listeners have folded \"Better Man\" into the era's wider who-is-it-about speculation; she has never named a subject, and the song reads as a clear-eyed account of leaving a love that couldn't change rather than a coded portrait."
          ]
        },
        connections: [
          {
            relatedId: "song:all-too-well",
            label: "All Too Well",
            why: "The two Red heartbreaks that loomed largest on Taylor's Version — one the ten-minute epic she'd withheld, the other the song she'd given away and then reclaimed."
          },
          {
            relatedId: "song:red",
            label: "Red",
            why: "The title track calls the love \"burning\"; \"Better Man\" is the clear-eyed accounting after the fire — a man who couldn't become who she needed."
          }
        ],
        sources: [
          {
            name: "Better Man (Little Big Town song) — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Better_Man_(Little_Big_Town_song)"
          },
          {
            name: "Billboard: Little Big Town Leads Hot Country Songs With Taylor Swift-Written 'Better Man'",
            url: "https://www.billboard.com/articles/columns/chart-beat/7676235/little-big-town-hot-country-songs-taylor-swift"
          },
          {
            name: "Billboard: Little Big Town Tops Country Airplay With Taylor Swift-Penned 'Better Man'",
            url: "https://www.billboard.com/articles/columns/chart-beat/7698213/little-big-town-country-airplay-taylor-swift"
          },
          {
            name: "Billboard: All the Surprise Songs Taylor Swift Has Performed on The Eras Tour",
            url: "https://www.billboard.com/lists/taylor-swift-eras-tour-surprise-songs/its-time-to-go-better-man/"
          }
        ]
      },
    },
    {
      slug: 'nothing-new',
      trackNumber: 23,
      trackTitle: 'Nothing New',
      youtubeId: 'm3fWCRvz5JA', // oEmbed-verified official Taylor Swift channel
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Aaron Dessner', 'Tony Berg'],
      isFromTheVault: true,
      note: 'Written at 22 about the industry’s expiration date for young women — released at 31 as a duet with Phoebe Bridgers, the next generation answering back.',
      summary:
        'The fear of being novelty: what happens when a newer, shinier girl arrives and everyone stops clapping. Giving the second verse to Bridgers turned a private anxiety into a generational relay.',
      inspiration:
        'A 2012 composition about the churn of it-girls, unreleased until Red TV; Bridgers has called being asked her career’s pinch-me moment.',
      themes: ['aging in public', 'industry churn', 'women replacing women by design'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Nothing_New_(song)',
      sources: [
        wiki('Nothing New (song)', 'Nothing_New_(song)', 'song article: Bridgers duet background'),
        TV,
      ],
      dossier: {
        whyItMatters: [
          "A vault song that waited a decade. Swift told Late Night with Seth Meyers (as NME reported) that she wrote 'Nothing New' when she was 22, and that it is really special to her because it was the first time she was not a shiny new artist. She sent it to Phoebe Bridgers because she wanted another female artist she loved to sing it with her.",
          "Pitchfork described it as a somber acoustic ballad about the music business's fickle relationship with young women, and noted that, unlike on 'The Lucky One', Swift sings these anxieties in her own voice rather than projecting them onto a character."
        ],
        meaning: {
          confirmed: [
            "Swift said she wrote the song at 22 and that it was special to her because it was the first time she was not a shiny new artist (NME, quoting her Late Night with Seth Meyers appearance).",
            "She called Bridgers 'one of my favorite artists in the world' and said that if Bridgers sings something, she will listen to it. Per Rolling Stone, she said she wanted another female artist she loved to sing it with her, 'because I think it was a very female artist perspective', and that Bridgers replied she had been waiting for that text her entire life.",
            "The song came out as a 'From the Vault' track on Red (Taylor's Version) on November 12, 2021, per NME."
          ],
          supported: [
            "Bridgers told Billboard that recording it was 'just been a dream', and that she got teary doing her part.",
            "Rolling Stone's reading is that the duet works because Swift's adult voice and Bridgers' hushed one meet at a place of earned wisdom, and that Bridgers was 18 when Red came out, which makes the chorus about knowing everything at 18 and nothing at 22 land. That is the outlet's reading, not Swift's."
          ]
        },
        connections: [
          {
            relatedId: "song:the-lucky-one",
            label: "The Lucky One",
            why: "Pitchfork said the same fear of being chewed up and replaced runs through 'The Lucky One', but that here Swift inhabits it in her own voice."
          },
          {
            relatedId: "song:i-bet-you-think-about-me",
            label: "I Bet You Think About Me",
            why: "Another 'From the Vault' track with a featured guest: NME noted Chris Stapleton on it, alongside Bridgers here."
          },
          {
            relatedId: "song:run",
            label: "Run",
            why: "The third vault track with a featured guest on Red (Taylor's Version): NME noted Ed Sheeran on it."
          }
        ],
        voices: [
          {
            who: "Phoebe Bridgers",
            context: "Speaking to Billboard ahead of Red (Taylor's Version)",
            note: "She said she was so excited for people to take the song at face value the day it came out, because she got teary recording it."
          }
        ],
        sources: [
          {
            name: "Taylor Swift recalls texting Phoebe Bridgers to ask her to collaborate - NME",
            url: "https://www.nme.com/news/music/taylor-swift-recalls-texting-phoebe-bridgers-collaborate-red-3094565"
          },
          {
            name: "Phoebe Bridgers 'Got Teary' Recording Her Part on Taylor Swift's 'Red (Taylor's Version)' - Billboard",
            url: "https://www.billboard.com/music/pop/phoebe-bridgers-taylor-swift-red-taylors-version-nothing-new-9657454/"
          },
          {
            name: "Congratulations, Indie Fans: We Finally Manifested a Taylor Swift/Phoebe Bridgers Duet - Rolling Stone",
            url: "https://www.rollingstone.com/music/music-features/taylor-swift-phoebe-bridgers-nothing-new-red-1256954/"
          },
          {
            name: "Taylor Swift: Red (Taylor's Version) Album Review - Pitchfork",
            url: "https://pitchfork.com/reviews/albums/taylor-swift-red-taylors-version/"
          }
        ]
      },
    },
    {
      slug: 'babe',
      trackNumber: 24,
      trackTitle: 'Babe',
      youtubeId: '3pj39qZZYoQ', // oEmbed-verified official Taylor Swift channel
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift', 'Patrick Monahan'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      note: 'Co-written with Train’s Pat Monahan for Red, handed to Sugarland in 2018 (with Taylor guesting), and finally sung solo in the vault.',
      summary:
        'The last straw song: one act of betrayal detonates the whole future tense — every plan they made now needs a new pronoun.',
      inspiration:
        'Provenance: written in the Red sessions with Monahan; Sugarland released it as a single in 2018 with Taylor featured before her own cut arrived on Red TV.',
      themes: ['betrayal', 'the point of no return', 'canceled futures'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Babe_(Sugarland_song)',
      sources: [
        wiki(
          'Babe (Sugarland song)',
          'Babe_(Sugarland_song)',
          'song article: writing and release history',
        ),
        TV,
      ],
      dossier: {
        whyItMatters: [
          "A Swift co-write that lived on someone else's record first. Billboard reported in April 2018 that Swift wrote 'Babe' with Train frontman Pat Monahan while writing for Red, then offered it to Sugarland, who put it on their album Bigger with Swift singing backup. USA Today noted it was the only song on Bigger that Jennifer Nettles and Kristian Bush did not co-write.",
          "Swift's own recording arrived on Red (Taylor's Version) on November 12, 2021. Rolling Stone's Rob Sheffield counted it, with 'Better Man', among the country hits she gave away and finally sang lead on herself, with Jack Antonoff producing."
        ],
        meaning: {
          supported: [
            "Sugarland's Nettles said in a statement, as quoted by Billboard and Variety, that the duo had never put someone else's song on a Sugarland record but were immediately interested in 'Babe' the first time they heard it, and saved it for the last afternoon of their recording session. Bush added, per Variety, that the biggest compliment was Swift emailing after hearing their take to say she wanted to be part of it.",
            "Billboard's 2018 report noted that Swift does not take any of the verses on Sugarland's version; Nettles sings lead and Swift's vocals come in on the chorus.",
            "Billboard's critic ranked Swift's version ninth of the nine Red (Taylor's Version) vault songs, describing it as offering levity even in the context of a breakup song, with a warm mix of keys, slide guitar and percussion. That is a critic's ranking, not a statement from Swift.",
            "Sheffield's Rolling Stone review said both 'Babe' and 'Better Man' thrive with Swift singing lead. That is the reviewer's judgment."
          ]
        },
        connections: [
          {
            relatedId: "song:better-man",
            label: "Better Man",
            why: "Rolling Stone's review pairs the two as country hits she had given away, and finally recorded herself, on Red (Taylor's Version)."
          }
        ],
        voices: [
          {
            who: "Pat Monahan",
            context: "Speaking to ABC News Radio in 2013, as quoted by USA Today",
            note: "The Train singer, her co-writer, said of the song 'it's her song; I was just lucky enough to be a part of it with her,' and described the track as originally intended for Red."
          },
          {
            who: "Jennifer Nettles",
            context: "In a statement on the Sugarland recording, April 2018",
            note: "She said the collaboration was 'the perfect combination of mutual admiration for each other and mutual admiration for great songs.'"
          }
        ],
        sources: [
          {
            name: "Sugarland Teams Up With Taylor Swift For Acoustic Breakup Tune 'Babe' - Billboard",
            url: "https://www.billboard.com/music/country/sugarland-taylor-swift-new-song-babe-8357952/"
          },
          {
            name: "Sugarland Drop 'Babe,' New Single Featuring and Co-Written by Taylor Swift - Variety",
            url: "https://variety.com/2018/music/news/sugarland-drop-babe-new-single-featuring-and-co-written-by-taylor-swift-1202770991/"
          },
          {
            name: "Taylor Swift, Sugarland team for country duet 'Babe' - USA Today",
            url: "https://www.usatoday.com/story/life/music/2018/04/20/taylor-swift-sugarland-team-country-duet-babe/535334002/"
          },
          {
            name: "Every 'From The Vault' Song Ranked on Taylor Swift's 'Red (Taylor's Version)': Critic's Picks - Billboard",
            url: "https://www.billboard.com/music/pop/taylor-swift-red-taylors-version-from-the-vault-songs-ranked-9659077/"
          },
          {
            name: "'Red (Taylor's Version)' Makes a Classic Even Better - Rolling Stone",
            url: "https://www.rollingstone.com/music/music-album-reviews/review-red-taylors-version-1255956/"
          }
        ]
      },
    },
    {
      slug: 'message-in-a-bottle',
      trackNumber: 25,
      trackTitle: 'Message in a Bottle',
      youtubeId: 'cVaG6adE2mA', // oEmbed-verified official Taylor Swift channel
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Elvira Anderfjärd', 'Shellback'],
      isFromTheVault: true,
      note: 'The first song she ever wrote with Max Martin and Shellback — the vault reveal that the 1989 pivot was already loaded in 2012.',
      summary:
        'A crush lobbed into the void like a corked note into the sea: pure fizzy hope that the message finds its way to the right person.',
      inspiration:
        'The trio’s first-ever collaboration, from the Red sessions — the historical footnote is the headline here.',
      themes: ['hope', 'long-shot love', 'pop origins'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Message_in_a_Bottle_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Message in a Bottle (Taylor Swift song)',
          'Message_in_a_Bottle_(Taylor_Swift_song)',
          'song article: first Martin/Shellback co-write',
        ),
        TV,
      ],
      dossier: {
        whyItMatters: [
          "A vault song with a career footnote attached. Pitchfork called it the first song Swift wrote with Max Martin and Shellback, and Rolling Stone's Rob Sheffield added that she wrote it the day she met them. Billboard noted Red was the first album she worked with Martin, a pairing that produced 'We Are Never Ever Getting Back Together' and 'I Knew You Were Trouble', and that Martin's only credit among the Red (Taylor's Version) vault tracks is as co-writer here.",
          "That makes it a time capsule of the album's pivot. Pitchfork described Red as the album where Swift called in Martin and Shellback to cue the synths and drop the bass, and the first song of that partnership stayed in the vault until November 12, 2021."
        ],
        meaning: {
          supported: [
            "Credits: Rolling Stone, NME and Billboard all report it was co-written with Max Martin and Shellback. NME noted the pair also worked on 'I Knew You Were Trouble' and '22' in 2012.",
            "Sheffield wrote that it makes sense she left it off Red because it sounds so similar to '22', and that it sounds as if she is already stretching ahead to 1989. That is the critic's reading, not a statement from Swift.",
            "Critics heard a dance-pop song: Billboard called it a compact, propulsive dance track; NME an effervescent nugget of pure pop in the vein of Carly Rae Jepsen's Emotion; Pitchfork said its polish nearly makes up for a dearth of personality."
          ]
        },
        connections: [
          {
            relatedId: "song:22",
            label: "22",
            why: "Sheffield's Rolling Stone ranking says it sounds so similar to '22' that it makes sense she left this one off Red."
          },
          {
            relatedId: "song:i-knew-you-were-trouble",
            label: "I Knew You Were Trouble",
            why: "NME noted that Martin and Shellback also worked on that song in 2012."
          },
          {
            relatedId: "song:we-are-never-ever-getting-back-together",
            label: "We Are Never Ever Getting Back Together",
            why: "Billboard cited it as one of the smashes from Swift's first album working with Martin."
          }
        ],
        sources: [
          {
            name: "'Red (Taylor's Version)' Makes a Classic Even Better - Rolling Stone",
            url: "https://www.rollingstone.com/music/music-album-reviews/review-red-taylors-version-1255956/"
          },
          {
            name: "All 286 of Taylor Swift's Songs, Ranked - Rolling Stone",
            url: "https://www.rollingstone.com/music/music-lists/taylor-swift-songs-ranked-rob-sheffield-201800/message-in-a-bottle-2021-1261516/"
          },
          {
            name: "Taylor Swift: Red (Taylor's Version) - Pitchfork",
            url: "https://pitchfork.com/reviews/albums/taylor-swift-red-taylors-version/"
          },
          {
            name: "Every 'From The Vault' Song Ranked on Taylor Swift's 'Red (Taylor's Version)': Critic's Picks - Billboard",
            url: "https://www.billboard.com/music/pop/taylor-swift-red-taylors-version-from-the-vault-songs-ranked-9659077/"
          },
          {
            name: "Taylor Swift - 'Red (Taylor's Version)' review: a retread of heartbreak - NME",
            url: "https://www.nme.com/reviews/album/taylor-swift-red-taylors-version-review-3093107"
          }
        ]
      },
    },
    {
      slug: 'i-bet-you-think-about-me',
      trackNumber: 26,
      trackTitle: 'I Bet You Think About Me',
      youtubeId: 'AccGdO5XeZY', // oEmbed-verified official Taylor Swift channel
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift', 'Lori McKenna'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      isFromTheVault: true,
      isSingle: true,
      note: 'The harmonica-laced class-warfare kiss-off with Chris Stapleton — and a wedding-crasher video directed by Blake Lively.',
      summary:
        'A small-town girl toasts the rich ex at his own imaginary wedding: his organic-shoes world never fit her, but she bets she still haunts it.',
      inspiration:
        'Written with Lori McKenna in the Red era; the 2021 video (Lively’s directing debut for Swift) staged the revenge-at-the-wedding fantasy with red-velvet cake.',
      themes: ['class contrast', 'haunting an ex', 'country wit'],
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Bet_You_Think_About_Me',
      sources: [
        wiki(
          'I Bet You Think About Me',
          'I_Bet_You_Think_About_Me',
          'song article: Stapleton feature and Lively video',
        ),
        TV,
      ],
      dossier: {
        whyItMatters: [
          "The Red (Taylor's Version) vault song Swift says was meant to be funny. Billboard reported that in a country radio interview in November 2021 she said she wrote it with Lori McKenna, whom she called one of her favorite singer-songwriters ever, at McKenna's house while she was playing Foxboro on the Speak Now Tour, and that she wanted it to be a comedic, tongue-in-cheek, not-caring-what-anyone-thinks breakup song.",
          "It was also the vault's country-radio entry. Rolling Stone noted the harmonica-driven track, with harmonies from Chris Stapleton, was Swift's latest song marketed to country radio after 'betty', and Variety reported that Blake Lively directed its music video, released on Monday, November 15, 2021."
        ],
        meaning: {
          confirmed: [
            "Swift said, as quoted by Billboard, that there are many types of heartbreak songs on Red, some very sincere, stoic and sad, and that she and McKenna wanted this to be the moment where you say 'I don't care about anything.'",
            "She said they wanted to make people laugh with it and wanted it to be 'sort of a drinking song,' adding, 'I think that that's what it ended up being.' Billboard pointed out there is not a single reference to alcohol in the lyrics.",
            "On the day the video came out she tweeted that it was directed by Blake Lively, 'who SMASHED it just like I smashed this cake' (as quoted by Variety)."
          ],
          supported: [
            "Rolling Stone dated the song to around the Red sessions in 2012. Swift's own account, as quoted by Billboard, places the writing on the Speak Now Tour, which Billboard dated to June 2011. This guide goes with Swift's account.",
            "Rolling Stone read the lyrics as 'diary-personal' lines contrasting her own modest upbringing with the world of the person she addresses. That is the reviewer's interpretation of the lyrics, not something Swift said.",
            "Variety described the six-minute video as a wedding-day story in which the groom flashes back on a failed relationship while Swift mischievously knocks over the cake topper, tears into the cake and chugs wine after giving a toast. It marked Lively's first time directing."
          ],
          fanTheories: [
            "Fans commonly attach the song to a specific relationship. Swift's own account, above, describes it as a comedic breakup song and names no one, and this guide does not either."
          ]
        },
        connections: [
          {
            relatedId: "song:betty",
            label: "betty",
            why: "Rolling Stone noted this was Swift's latest song marketed to country radio, following 'betty' from folklore."
          },
          {
            relatedId: "song:all-too-well-10-minute-version",
            label: "All Too Well (10 Minute Version)",
            why: "Variety called this video the second high-profile Swift video in three days, after the short film for the 10-minute 'All Too Well' premiered the previous Friday."
          }
        ],
        voices: [
          {
            who: "Taylor Swift",
            context: "In a country radio interview, November 2021, as quoted by Billboard",
            note: "She described McKenna as one of her favorite singer-songwriters ever and said she had always wanted to write with her."
          }
        ],
        sources: [
          {
            name: "Taylor Swift Calls 'I Bet You Think About Me' the 'Drinking Song' of 'Red (Taylor's Version)' - Billboard",
            url: "https://www.billboard.com/music/music-news/taylor-swift-i-bet-you-think-about-me-song-meaning-9659844/"
          },
          {
            name: "Taylor Swift and Chris Stapleton Take Down Her Ex on Collab 'I Bet You Think About Me' - Rolling Stone",
            url: "https://www.rollingstone.com/music/music-country/taylor-swift-chris-stapleton-song-i-bet-you-think-about-me-1256983/"
          },
          {
            name: "Taylor Swift and Blake Lively Debut 'I Bet You Think About Me' Music Video Starring Miles Teller - Variety",
            url: "https://variety.com/2021/music/news/taylor-swift-blake-lively-i-bet-you-think-about-me-music-video-miles-teller-1235111991/"
          }
        ]
      },
    },
    {
      slug: 'forever-winter',
      trackNumber: 27,
      trackTitle: 'Forever Winter',
      youtubeId: 'TkAomsYFsJw', // oEmbed-verified official Taylor Swift channel
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift', 'Mark Foster'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      note: 'The vault’s heaviest subject handled with horns — loving someone through a mental-health crisis and being terrified of losing them.',
      summary:
        'She circles a person in crisis, wishing she had understood sooner and promising to stay on the line — fans embraced it as one of her few songs explicitly about a loved one’s struggle.',
      inspiration:
        'Co-written with Foster the People’s Mark Foster during the Red era, per the TV credits.',
      themes: ['loving someone in crisis', 'helplessness', 'showing up'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Forever_Winter',
      sources: [wiki('Forever Winter', 'Forever_Winter', 'song article: vault credits'), TV],
    },
    {
      slug: 'run',
      trackNumber: 28,
      trackTitle: 'Run',
      youtubeId: 'flv8AEWrRMI', // oEmbed-verified official Taylor Swift channel
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift', 'Ed Sheeran'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      isFromTheVault: true,
      note: 'The other trampoline-era Sheeran co-write — written the very first day they met, and kept in a drawer for nine years.',
      summary:
        'An elopement fantasy in hushed harmony: two people ditching everyone’s expectations with a getaway car and a head start.',
      inspiration:
        'Reportedly written the first day Taylor and Sheeran worked together in 2012, before Everything Has Changed; it stayed unreleased until Red TV.',
      themes: ['escape', 'secret love', 'creative kinship'],
      sourceUrl: "https://en.wikipedia.org/wiki/Red_(Taylor's_Version)",
      sources: [TV],
      dossier: {
        whyItMatters: [
          "Red (Taylor's Version)'s Ed Sheeran vault duet, and the second Swift and Sheeran co-write on the album after 'Everything Has Changed'. Rolling Stone's Rob Sheffield reported they wrote 'Run' the day they met, on the same trampoline where they wrote 'Everything Has Changed'.",
          "Billboard heard the vault track as a belated way of giving Sheeran a place in Swift's folklore and evermore era: Aaron Dessner's co-production, it wrote, recalls her indie-folk detour, and the rustic sound suits the pair."
        ],
        meaning: {
          confirmed: [
            "On August 6, 2021, Swift posted the Red (Taylor's Version) track list on Twitter with the note that the vault tracks would feature Chris Stapleton, Phoebe Bridgers and Ed Sheeran among their guests, adding, 'I can't wait to dust off our highest hopes & relive these memories together.' Billboard quoted the post."
          ],
          supported: [
            "Billboard's August 2021 bonus-track report lists 'Run' featuring Ed Sheeran as track 28 of the 30-song album.",
            "Rolling Stone called it a peppy acoustic duet; NME called it an earnest duet with production from Dessner; Billboard ranked it sixth of the nine vault songs. These are critics' descriptions of the song, not statements from Swift or Sheeran about its subject."
          ]
        },
        connections: [
          {
            relatedId: "song:everything-has-changed",
            label: "Everything Has Changed",
            why: "Rolling Stone reported the two songs were written on the same trampoline, with 'Run' written the day Swift and Sheeran met."
          },
          {
            relatedId: "song:i-bet-you-think-about-me",
            label: "I Bet You Think About Me",
            why: "Swift's August 6, 2021 post named Stapleton and Sheeran together as the vault guests, and Billboard ranked these two back to back, fifth and sixth."
          }
        ],
        sources: [
          {
            name: "Taylor Swift Unveils 'Red (Taylor's Version)' Tracklist: 'I Can't Wait to Dust Off Our Highest Hopes' - Billboard",
            url: "https://www.billboard.com/music/music-news/taylor-swift-red-taylor-version-tracklist-9611506/"
          },
          {
            name: "Here Are All the Decoded 'Red (Taylor's Version)' Bonus Tracks - Billboard",
            url: "https://www.billboard.com/music/pop/taylor-swift-red-taylors-version-bonus-tracks-list-9611265/"
          },
          {
            name: "'Red (Taylor's Version)' Makes a Classic Even Better - Rolling Stone",
            url: "https://www.rollingstone.com/music/music-album-reviews/review-red-taylors-version-1255956/"
          },
          {
            name: "Taylor Swift - 'Red (Taylor's Version)' review: a retread of heartbreak - NME",
            url: "https://www.nme.com/reviews/album/taylor-swift-red-taylors-version-review-3093107"
          },
          {
            name: "Every 'From The Vault' Song Ranked on Taylor Swift's 'Red (Taylor's Version)': Critic's Picks - Billboard",
            url: "https://www.billboard.com/music/pop/taylor-swift-red-taylors-version-from-the-vault-songs-ranked-9659077/"
          }
        ]
      },
    },
    {
      slug: 'the-very-first-night',
      trackNumber: 29,
      trackTitle: 'The Very First Night',
      youtubeId: 'rVuyi-dPMIc', // oEmbed-verified official Taylor Swift channel
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift', 'Amund Bjørklund', 'Espen Lind'],
      producers: ['Espionage', 'Taylor Swift', 'Christopher Rowe'],
      isFromTheVault: true,
      note: 'The vault’s brightest bop — dancing back to the beginning of a relationship the world never got to see.',
      summary:
        'Grief disguised as a party track: she misses the private, pre-cameras version of a love, back when it was only theirs.',
      inspiration:
        'Written with the Norwegian duo Espionage during the Red sessions, per the TV credits.',
      themes: ['private joy', 'nostalgia', 'before it went wrong'],
      sourceUrl: "https://en.wikipedia.org/wiki/Red_(Taylor's_Version)",
      sources: [TV],
    },
    {
      slug: 'all-too-well-10-minute-version',
      trackNumber: 30,
      trackTitle: 'All Too Well (10 Minute Version)',
      youtubeId: 'sRxrwjOtIag', // oEmbed-verified official Taylor Swift channel
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      isSingle: true,
      note: 'The original uncut draft, restored after nine years of fan lobbying — it became the longest song ever to hit No. 1 on the Hot 100, with a Sadie Sink short film to match.',
      summary:
        'Every excised verse returned: the ages, the keys thrown, the twin-flame speech — plus the short film (Sink and Dylan O’Brien) that Swift wrote and directed, which won video-of-the-year trophies and made the scarf mythology canon.',
      inspiration:
        'The full-length version from the original 2011 writing sessions; fan demand for the mythical 10-minute cut is the documented reason it exists in public.',
      themes: ['the director’s cut of heartbreak', 'age-gap retrospect', 'fan-willed history'],
      easterEggs:
        'The short film’s title cards and autumn palette seeded Easter eggs fans later connected forward to Midnights and TTPD imagery.',
      sourceUrl: 'https://en.wikipedia.org/wiki/All_Too_Well',
      sources: [
        wiki('All Too Well', 'All_Too_Well', 'song article: 10-minute version and short film'),
        TV,
      ],
      dossier: {
        whyItMatters: [
          "This is the most famous act of fan-willed history in Swift's catalog: the mythical uncut draft, confirmed to exist for years, finally released on Red (Taylor's Version) in November 2021. At 10:13 it became the longest song ever to top the Billboard Hot 100 — breaking a record Don McLean's American Pie had held since January 1972 — and gave Swift her eighth No. 1 on 54.4 million first-week US streams.",
          "It arrived as a complete audiovisual event. Swift wrote and directed All Too Well: The Short Film, starring Sadie Sink and Dylan O'Brien, which premiered the same day in New York and went on to win the Grammy for Best Music Video and three MTV VMAs including Video of the Year. The rerelease turned a private fan treasure into the centerpiece of the whole Taylor's Version project — proof the re-recordings were not archival housekeeping but a second, bigger life for the songs."
        ],
        meaning: {
          confirmed: [
            "Swift explained on The Tonight Show that the long original survived because the sound engineer recorded her tour-rehearsal vent and her mother kept the recording; she rebuilt the released ten-minute cut from that draft, her notes, and new writing, producing it with Jack Antonoff.",
            "It debuted at No. 1 on the Hot 100 dated November 27, 2021 — the longest song ever to lead the chart — and the self-directed short film starring Sadie Sink and Dylan O'Brien won the 2023 Grammy for Best Music Video plus three 2022 VMAs including Video of the Year."
          ],
          supported: [
            "Critics read the extended cut as the definitive version — Rolling Stone called it Swift at her absolute best — with the restored verses shifting the song from grief toward indictment: the adult narrator finally saying the quiet parts out loud.",
            "Rob Sheffield frames the release as the payoff of a decade of underground canonization: a deep cut the hardcore fans kept alive until the mainstream had no choice but to catch up."
          ],
          fanTheories: [
            "The 2021 release reignited the unconfirmed Jake Gyllenhaal attribution, with fans reading the restored age-gap material and the short film's casting as pointed; Swift has still never named the subject, and the reading remains a fan theory, not fact.",
            "When the film's scarf appeared red on screen rather than the fan-reported blue, Swift addressed it only by calling the scarf a metaphor — reinforcing that she treats the object symbolically, not as a real-world artifact to be found."
          ]
        },
        connections: [
          {
            relatedId: "song:all-too-well",
            label: "All Too Well",
            why: "The 2012 album version is the five-minute carving this vault track un-edits; hearing them back to back is the clearest before-and-after in the re-recording project."
          },
          {
            relatedId: "song:nothing-new",
            label: "Nothing New",
            why: "The vault's two biggest revelations work as a pair: one restores what was cut for length, the other releases what was held back for candor."
          },
          {
            relatedId: "song:i-bet-you-think-about-me",
            label: "I Bet You Think About Me",
            why: "The other headline vault track covers the same wreckage with a smirk instead of a scalpel — revenge comedy where this is forensic elegy."
          }
        ],
        sources: [
          {
            name: "All Too Well (10 Minute Version) — Wikipedia",
            url: "https://en.wikipedia.org/wiki/All_Too_Well_(10_Minute_Version)"
          },
          {
            name: "Billboard: 'All Too Well' Debuts at No. 1 on the Hot 100",
            url: "https://www.billboard.com/music/chart-beat/taylor-swift-all-too-well-hot-100-debut-1235001340/"
          },
          {
            name: "Rolling Stone: Rob Sheffield on All Too Well",
            url: "https://www.rollingstone.com/music/music-features/taylor-swift-all-too-well-rob-sheffield-1235127364/"
          }
        ]
      },
    },
];

export default {
  eraSlug: 'red',
  tracks: TRACKS,
};
