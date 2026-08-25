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
        'Swift said the song is about the shame of knowing at first sight exactly how it would end; the Martin/Shellback production made it her boldest pop move to date.',
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
        'Swift confirmed it began as a long, improvised vent during tour rehearsals; Liz Rose was called in to help carve a song out of it. The muse is widely reported as Jake Gyllenhaal — never confirmed by Swift.',
      themes: ['memory as evidence', 'grief for a specific autumn', 'the scarf'],
      fanLore:
        'Fan reading (widely reported, unconfirmed): the Gyllenhaal attribution and the endlessly relitigated real-world scarf.',
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
        'Swift said writing it was her way of resisting the urge to reconnect — the song replaced the conversation.',
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
        'Confirmed studio lore: an associate of an ex interrupted the session, Swift vented about the never-quite-over relationship, and Martin and Shellback turned the rant into the hook on the spot.',
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
        'Swift said it came from realizing she could look back at a long-ended relationship and feel thankful rather than bitter.',
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
        'Swift confirmed she wrote it alone on her tour bus, chasing the hazy mood of a memory rather than the events themselves.',
      themes: ['mourning', 'haze of memory', 'acceptance'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      sources: [ALBUM],
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
        'Swift said it was inspired by artists who walked away from fame at their peak; fans map it onto figures like Joni Mitchell (unconfirmed specifics).',
      themes: ['cost of fame', 'escape', 'foreshadowing'],
      fanLore:
        'Fan reading (unconfirmed): Joni Mitchell as the model — Mitchell was separately attached to a shelved biopic Swift was once linked to.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      sources: [ALBUM],
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
        'Confirmed origin: Swift and Sheeran wrote it bouncing on her trampoline in early 2012, then cut it with Butch Walker; Sheeran opened the Red Tour the next year.',
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
        'Confirmed: Swift wrote it after seeing a vintage photo of young Ethel and Robert F. Kennedy; Ethel Kennedy attended a screening of the video era with her.',
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
        'Widely tied by fans to her 21st birthday and the Gyllenhaal chapter (unconfirmed by Swift); the party scenario is the song’s own explicit frame.',
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
        'A eulogy for Ronan Thompson, who died of neuroblastoma just before turning four, written in his mother’s words and voice — Swift performing it once at Stand Up to Cancer remains one of her heaviest moments.',
      inspiration:
        'Confirmed: composed from phrases in Maya Thompson’s blog about her son; Thompson is credited as co-writer and approved its Red TV inclusion.',
      themes: ['grief', 'a mother’s love', 'memorial'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Ronan_(song)',
      sources: [
        wiki('Ronan (song)', 'Ronan_(song)', 'song article: charity origin and credit'),
        TV,
      ],
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
        'Confirmed history: cut from the original Red, recorded by Little Big Town in 2016 (CMA Song of the Year), reclaimed by Swift on Red TV.',
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
        'Confirmed: a 2012 composition about the churn of it-girls, unreleased until Red TV; Bridgers has called being asked her career’s pinch-me moment.',
      themes: ['aging in public', 'industry churn', 'women replacing women by design'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Nothing_New_(song)',
      sources: [
        wiki('Nothing New (song)', 'Nothing_New_(song)', 'song article: Bridgers duet background'),
        TV,
      ],
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
        'Confirmed provenance: written in the Red sessions with Monahan; Sugarland released it as a single in 2018 with Swift featured before her own cut arrived on Red TV.',
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
        'Confirmed as the trio’s first-ever collaboration from the Red sessions — the historical footnote is the headline here.',
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
        'Confirmed: Swift and Sheeran wrote it the first day they worked together in 2012, before Everything Has Changed; it stayed unreleased until Red TV.',
      themes: ['escape', 'secret love', 'creative kinship'],
      sourceUrl: "https://en.wikipedia.org/wiki/Red_(Taylor's_Version)",
      sources: [TV],
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
        'Confirmed: this is the full-length version from the original 2011 writing sessions; fan demand for the mythical 10-minute cut is the documented reason it exists in public.',
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
