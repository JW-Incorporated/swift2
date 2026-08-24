// Vault track guide — debut era (Taylor Swift, 2006).
// One record per canonical song. Summaries, themes, and readings are ORIGINAL
// prose in our own words — never lyrics. Anything not publicly confirmed is
// labeled a fan reading. Sources follow the provenance format in
// docs/content/content-audit-2026-07-08.md §5 (all URLs verified 2026-07-08).
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
  'Taylor Swift (album)',
  'Taylor_Swift_(album)',
  'album article: release facts, credits, and cited interviews',
);

const _debut = {
  eraSlug: 'debut',
  tracks: [
    {
      slug: 'tim-mcgraw',
      trackNumber: 1,
      trackTitle: 'Tim McGraw',
      youtubeId: 'GkD20ajVxnY', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman'],
      singleReleaseDate: '2006-06-19',
      note: 'The debut single, drafted in ninth-grade math class — a goodbye to a senior boyfriend heading to college, banking on a Tim McGraw song to keep her in his memory.',
      summary:
        'A girl asks to be remembered through the soundtrack of a first love: when her favorite country star comes on, she hopes her ex thinks of her.',
      inspiration:
        'Swift has said she wrote it in math class about Brett, a senior boyfriend about to leave for college, then finished it with Liz Rose after school.',
      themes: ['first love', 'memory and nostalgia', 'small-town summer'],
      easterEggs:
        'Her early liner notes hid capitalized-letter messages per song — the codes that trained fans to hunt for Easter eggs in everything since.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Tim_McGraw_(song)',
      sources: [
        wiki(
          'Tim McGraw (song)',
          'Tim_McGraw_(song)',
          'song article: origin story and release facts',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "It is the first song the world ever heard from her: the debut single, released June 19, 2006, that turned a 16-year-old Nashville transplant into a name. It reached No. 6 on Billboard's Hot Country Songs and crossed to No. 40 on the Hot 100 — a real showing for a brand-new country act — and Rolling Stone would later rank it No. 11 on its 2020 list of the 100 greatest debut singles of all time, crediting a teenager with beating the Nashville veterans at their own game.",
          "The origin is already pure Taylor. The hook arrived in a ninth-grade math class, where she caught herself singing 'when you think Tim McGraw,' and after school she finished it with co-writer Liz Rose in about fifteen minutes — 'the best fifteen minutes I've ever experienced,' she has said. It is not a song about the country star: it is about a senior boyfriend leaving for college, and she reached for McGraw because his music was the couple's shared soundtrack. Naming a living legend in her very first single was its own quiet act of nerve."
        ],
        meaning: {
          confirmed: [
            "Track 1 and the opening song of Taylor Swift (Oct. 24, 2006), written by Taylor with Liz Rose and produced by Nathan Chapman; issued as her debut single on June 19, 2006 on Big Machine Records.",
            "It peaked at No. 6 on Billboard's Hot Country Songs and No. 40 on the Hot 100. Trey Fanjoy directed the music video, which premiered on Great American Country on July 22, 2006 and won Breakthrough Video of the Year at the 2007 CMT Music Awards."
          ],
          supported: [
            "Taylor has said the idea came to her in a ninth-grade math class, and that she wrote it after school with Liz Rose in roughly fifteen minutes — a speed she has called the best fifteen minutes she ever spent writing.",
            "By her own account the song is about an older boyfriend about to leave for college, not about Tim McGraw himself; she invoked the star because his songs were the ones the relationship was set to, hoping a McGraw track on the radio would keep her in the boy's memory."
          ],
          fanTheories: [
            "Fans treat it as the template for everything that followed — a specific, real goodbye turned universal — and as the first of the hidden capital-letter liner-note codes that trained a fandom to read her album booklets like ciphers."
          ]
        },
        connections: [
          {
            relatedId: "song:teardrops-on-my-guitar",
            label: "Teardrops on My Guitar",
            why: "The single that came next: 'Tim McGraw' introduced her to country radio, 'Teardrops on My Guitar' was the crossover that carried her onto pop radio and into the Hot 100's upper reaches."
          },
          {
            relatedId: "song:our-song",
            label: "Our Song",
            why: "The bookends of the debut's single run — the first single that opened the campaign beside the third that became her first No. 1 and the record she is still measured against."
          },
          {
            relatedId: "song:picture-to-burn",
            label: "Picture to Burn",
            why: "Its opposite number among the Swift–Liz Rose co-writes: 'Tim McGraw' is the tender goodbye, 'Picture to Burn' the bratty kiss-off — the two moods the debut runs on."
          }
        ],
        sources: [
          {
            name: "Tim McGraw (song) — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Tim_McGraw_(song)"
          },
          {
            name: "Songfacts: Tim McGraw by Taylor Swift",
            url: "https://www.songfacts.com/facts/taylor-swift/tim-mcgraw"
          }
        ]
      },
    },
    {
      slug: 'picture-to-burn',
      trackNumber: 2,
      trackTitle: 'Picture to Burn',
      youtubeId: 'yCMqcFAigRg', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman'],
      isSingle: true,
      note: 'The bratty banjo kiss-off — a high-school ex gets his photo torched. A softened lyric on later edits became an early lesson in Taylor-lyric archaeology.',
      summary:
        'A scorched-earth breakup romp: petty, funny, and fully aware of it, burning every reminder of a boy who never let her drive his truck.',
      inspiration:
        'Swift described it as being about a self-absorbed high-school ex — the anger phase of a teenage breakup, played for laughs.',
      themes: ['teenage anger', 'revenge as comedy', 'moving on'],
      easterEggs:
        'The original album line about telling everyone the ex is gay was rewritten for the radio single — a documented early edit fans still catalog.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Picture_to_Burn',
      sources: [
        wiki('Picture to Burn', 'Picture_to_Burn', 'song article: lyric edit and single history'),
        ALBUM,
      ],
    },
    {
      slug: 'teardrops-on-my-guitar',
      trackNumber: 3,
      trackTitle: 'Teardrops on My Guitar',
      youtubeId: 'xKCek6_dB0M', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman'],
      isSingle: true,
      note: 'The unrequited-crush ballad that named the real boy — Drew from her high school — and crossed her over to pop radio for the first time.',
      summary:
        'She is the shoulder a boy leans on while he gushes about another girl; the song sits in the ache of smiling through it.',
      inspiration:
        'Confirmed to be about classmate Drew Hardwick, whom Swift named publicly; he reportedly had no idea until the song was on the radio.',
      themes: ['unrequited love', 'hiding feelings', 'high-school heartache'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Teardrops_on_My_Guitar',
      sources: [
        wiki(
          'Teardrops on My Guitar',
          'Teardrops_on_My_Guitar',
          'song article: subject and chart history',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "This is the song that made her a pop star, not just a country prospect. Sent to country radio in February 2007 and re-serviced to pop radio that November, it climbed to No. 13 on the Hot 100 — her highest Hot 100 placing of the debut era — while reaching No. 2 on Hot Country Songs and going 3x platinum. The second single was the one that proved she could cross over.",
          "Its power is that it is true and specific. Taylor has always said it is about a real classmate she calls Drew, a boy she liked who only ever talked to her about the other girl he was dating. She built a national heartbreak out of the smallest, most ordinary one — being the friend, not the girlfriend — and, by her account, the boy had no idea until the song was on the radio."
        ],
        meaning: {
          confirmed: [
            "Track 3 of Taylor Swift, written by Taylor with Liz Rose and produced by Nathan Chapman; released to country radio on Feb. 20, 2007 and to pop radio on Nov. 9, 2007.",
            "It peaked at No. 13 on the Billboard Hot 100 — her best Hot 100 showing from the debut — and No. 2 on Hot Country Songs, and was certified 3x platinum by the RIAA. Trey Fanjoy directed the video (premiered Feb. 20, 2007), with actor Tyler Hilton as the boy, and the song won Song of the Year at the 2008 BMI Country Awards."
          ],
          supported: [
            "Taylor has consistently said the song is about a real high-school classmate she refers to only as Drew, a boy she liked while he confided in her about a different girl — the specific ache of being the one he talked to, not the one he wanted.",
            "She has recounted that Drew was unaware of the song until it aired: she once read a MySpace post of his — 'My name's Drew and I have a famous song written about me' — and has said that about two years after the album's U.S. release he turned up in her driveway, newly single. She let the moment stay a footnote."
          ],
          fanTheories: [
            "Fans have spent years trying to attach a full identity to 'Drew,' but Taylor has only ever used the first name; the guessing is fan sport, not fact, and the song works precisely because he stays a type — the boy who never noticed — rather than a name."
          ]
        },
        connections: [
          {
            relatedId: "song:tim-mcgraw",
            label: "Tim McGraw",
            why: "The first two singles in sequence: 'Tim McGraw' opened her account on country radio, 'Teardrops on My Guitar' was the follow-up that broke her to pop."
          },
          {
            relatedId: "song:our-song",
            label: "Our Song",
            why: "The debut's three-single arc: 'Teardrops' the aching second single, 'Our Song' the chart-topping third — grief and giddiness a few tracks apart."
          },
          {
            relatedId: "song:invisible",
            label: "Invisible",
            why: "Its quiet twin on the record — another portrait of watching someone you want want somebody else, the same unrequited angle told from a step further back."
          }
        ],
        sources: [
          {
            name: "Teardrops on My Guitar — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Teardrops_on_My_Guitar"
          },
          {
            name: "Songfacts: Teardrops on My Guitar by Taylor Swift",
            url: "https://www.songfacts.com/facts/taylor-swift/teardrops-on-my-guitar"
          }
        ]
      },
    },
    {
      slug: 'a-place-in-this-world',
      trackNumber: 4,
      trackTitle: 'A Place in This World',
      youtubeId: '_FNQ5qLuLjA', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Robert Ellis Orrall', 'Angelo Petraglia'],
      producers: ['Nathan Chapman'],
      note: 'Written at 13, while shuttling between Pennsylvania and Nashville trying to break in — a kid narrating the exact uncertainty she was living.',
      summary:
        'A wide-eyed mission statement: alone in a new town, unsure of the path, but certain there is one and determined to walk it.',
      inspiration:
        'Swift has said it captures how she felt as a new arrival in Nashville, still trying to figure out where she fit.',
      themes: ['ambition', 'self-discovery', 'small fish, big pond'],
      sourceUrl: 'https://en.wikipedia.org/wiki/A_Place_in_This_World',
      sources: [
        wiki('A Place in This World', 'A_Place_in_This_World', 'song article: writing background'),
        ALBUM,
      ],
    },
    {
      slug: 'cold-as-you',
      trackNumber: 5,
      trackTitle: 'Cold as You',
      youtubeId: 'aGvIwzgJ9hU', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman'],
      note: 'The debut deep cut Swifties hold up as proof the pen was already sharp — a slow, surgical takedown of an emotionally unavailable boy.',
      summary:
        'A post-mortem on a one-sided relationship with someone who gives nothing back; the closing line lands like a door slamming.',
      inspiration: null,
      themes: ['emotional neglect', 'disillusionment', 'quiet fury'],
      fanLore:
        'Fan reading: often ranked by fans among the best-written debut tracks — a favorite pick for early evidence of her bridge-writing instincts.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'the-outside',
      trackNumber: 6,
      trackTitle: 'The Outside',
      youtubeId: 'IAeicVet6SU', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift'],
      producers: ['Robert Ellis Orrall', 'Nathan Chapman'],
      note: 'One of the first songs she ever wrote — age 12, about the middle-school years when nobody saved her a seat.',
      summary:
        'A kid looking in at the friend groups that shut her out, choosing to write about the loneliness instead of pretending it away.',
      inspiration:
        'Swift has repeatedly said she wrote it at 12 about being excluded at school — songwriting itself was the coping mechanism.',
      themes: ['outsiderness', 'loneliness', 'writing as survival'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'tied-together-with-a-smile',
      trackNumber: 7,
      trackTitle: 'Tied Together with a Smile',
      youtubeId: 'aCVHGH5sO0c', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman'],
      note: 'Written the day she learned a friend was struggling with an eating disorder — the debut album at its most tender.',
      summary:
        'A letter to a beautiful friend who is quietly falling apart, about how the girls who seem to have it all can be the ones barely holding on.',
      inspiration:
        'Swift confirmed she wrote it about a close friend battling bulimia, starting it the same day she found out.',
      themes: ['friendship', 'hidden pain', 'beauty-standard pressure'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'stay-beautiful',
      trackNumber: 8,
      trackTitle: 'Stay Beautiful',
      youtubeId: 'TQ9haUkCV-M', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman'],
      note: 'A daydream about a boy named Cory — admiring from a distance and wishing him well whether or not the story ever starts.',
      summary:
        'Affection without possession: she catalogs what makes a boy shine and leaves the door open rather than forcing an ending.',
      inspiration:
        'Swift said in early album commentary it was written about a boy named Cory she admired mostly from afar.',
      themes: ['crushes', 'admiration', 'open endings'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'shouldve-said-no',
      trackNumber: 9,
      trackTitle: "Should've Said No",
      youtubeId: 'v9bxXO9fj98', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman'],
      isSingle: true,
      note: 'The last-minute solo write about a cheating ex that became a stadium moment — capped by the drenched waterfall performance at the 2008 ACMs.',
      summary:
        'A betrayed girl puts the blame exactly where it belongs: cheating was a choice, and the consequence is the song everyone now sings back at him.',
      inspiration:
        'Written solo about an ex who cheated; the hidden liner-note message famously spelled out his first name, Sam.',
      themes: ['betrayal', 'accountability', 'public reckoning'],
      easterEggs:
        "The album booklet's hidden capital letters for this track spelled SAM — the liner-note code fans decoded on day one.",
      sourceUrl: "https://en.wikipedia.org/wiki/Should've_Said_No",
      sources: [
        wiki(
          "Should've Said No",
          "Should've_Said_No",
          'song article: writing and performance history',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "The debut's fifth and final single is the one that showed she could close, hard. A solo write about a boyfriend who cheated, it hit No. 1 on Hot Country Songs — her second chart-topper there — and its top-10 run made her the first solo woman to land five top-10 country hits from a debut album since that chart began in 1964. By the time the record was done, nothing about it read as a fluke.",
          "It also introduced her instinct for spectacle. In place of a conventional clip, the official video was her performance at the 43rd Academy of Country Music Awards in May 2008, which ended with her singing in a downpour — a drenched, theatrical finale that turned an accountability anthem into a stadium moment years before she had stadiums."
        ],
        meaning: {
          confirmed: [
            "Track 9 of Taylor Swift, written solely by Taylor and produced by Nathan Chapman at Dark Horse Recording in Franklin, Tennessee; released to country radio on May 19, 2008 as the album's fifth single.",
            "It reached No. 1 on Billboard's Hot Country Songs for two weeks — her second No. 1 there — and No. 33 on the Hot 100, and was certified platinum. The official video is her rain-soaked performance from the 2008 ACM Awards."
          ],
          supported: [
            "Taylor has said she wrote the song by herself in about twenty minutes just before recording it, and that she was 'living every line' — that it is about a guy who cheated on her 'who shouldn't have.' She has framed its stance as loving but unyielding: we were great, you ruined it, and I would still be here if you hadn't.",
            "By multiple accounts it was a late addition, written and cut in the final days before the album was mastered — the last song onto the record, and one of the first fans point to when they talk about her turning a real grievance into pop."
          ],
          fanTheories: [
            "The debut booklet's hidden capital-letter code for this track famously spelled a name, and fans decoded it on day one — one of the earliest of the liner-note ciphers that became a Taylor signature. Who the song is actually about she has never named; the internet's candidates are speculation, not fact."
          ]
        },
        connections: [
          {
            relatedId: "song:picture-to-burn",
            label: "Picture to Burn",
            why: "The debut's two revenge songs: 'Picture to Burn' plays teenage fury for comedy, 'Should've Said No' turns betrayal into a public reckoning — the same anger, a lot more resolve."
          },
          {
            relatedId: "song:our-song",
            label: "Our Song",
            why: "The debut's record-setting single run, bookended: 'Our Song' was the first country No. 1, 'Should've Said No' the second — and the fifth top-10 hit that set the chart record."
          },
          {
            relatedId: "song:cold-as-you",
            label: "Cold as You",
            why: "Two sides of the same wound on the record — 'Cold as You' the quiet devastation of being let down, 'Should've Said No' the demand that he own it."
          }
        ],
        sources: [
          {
            name: "Should've Said No — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Should%27ve_Said_No"
          },
          {
            name: "Songfacts: Should've Said No by Taylor Swift",
            url: "https://www.songfacts.com/facts/taylor-swift/shouldve-said-no"
          }
        ]
      },
    },
    {
      slug: 'marys-song-oh-my-my-my',
      trackNumber: 10,
      trackTitle: "Mary's Song (Oh My My My)",
      youtubeId: '9TCRiGA1A2U', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Liz Rose', 'Brian Maher'],
      producers: ['Nathan Chapman'],
      note: 'A whole lifetime in three verses — inspired by the elderly couple next door telling the story of how they fell in love as kids.',
      summary:
        'A love story that ages from seven to eighty-seven, tracing a couple from backyard dares to a porch-swing forever.',
      inspiration:
        'Swift confirmed the song was inspired by her real next-door neighbors, a couple who shared their decades-long love story over dinner.',
      themes: ['lifelong love', 'small-town roots', 'growing old together'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'our-song',
      trackNumber: 11,
      trackTitle: 'Our Song',
      youtubeId: 'Jb2stN7kH28', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman'],
      isSingle: true,
      note: 'Written for her ninth-grade talent show, saved from the scrap pile by classmates who kept singing it — then it made her the youngest solo writer of a country No. 1.',
      summary:
        'A couple with no official song decides everything already is one: screen doors, late calls, and sneaking back in slow.',
      inspiration:
        'Swift wrote it alone for a high-school talent show; classmates remembering the hook months later convinced her it belonged on the album.',
      themes: ['young love', 'everyday romance', 'making your own soundtrack'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Our_Song',
      sources: [
        wiki('Our Song', 'Our_Song', 'song article: talent-show origin and chart record'),
        ALBUM,
      ],
      // Dossier added 2026-07-24 (ledger #1306, Answerer shard 2). Every claim
      // below was fetched and verified this pass; anything not documented was
      // left out. No lyric quotations. Inline dossier (debut has no
      // .dossiers.mjs file) — same shape the merge in other eras produces.
      dossier: {
        whyItMatters: [
          "\"Our Song\" is the debut's proof-of-concept: the third single, a track-eleven album closer she wrote alone at fifteen for a ninth-grade talent show, and the one that turned a promising newcomer into a record-setter. When it reached No. 1 on Billboard's Hot Country Songs (chart dated December 22, 2007) it made Swift the youngest person to single-handedly write and sing a country chart-topper — she was seventeen when she wrote it and had only just turned eighteen when it hit the top. It held there six straight weeks and crossed to No. 16 on the Hot 100.",
          "It also settled the argument about whether the debut was a fluke. She had to talk Big Machine into keeping the song on the album at all, then chose it to close the record so its final line — an instruction to start the whole thing over — would send listeners back to the top. The bet paid off: the RIAA certified it four-times platinum, and retrospective critics like Rolling Stone's Rob Sheffield have pointed to its hook as the moment she showed what she could do.",
        ],
        meaning: {
          confirmed: [
            "Swift wrote \"Our Song\" alone during her freshman year for a ninth-grade talent show, and has said it came from dating a boy with whom she had no defining song — so she wrote one. She lobbied Big Machine to include it on the debut and chose it as the closing track because its final line tells the listener to start the record over.",
            "Nathan Chapman produced it; Swift played acoustic guitar while Chapman played the banjo hook and electric guitar, backed by Bruce Bouton (Dobro), Rob Hajacos (fiddle), Nick Buda (drums), Eric Darken (percussion) and Tim Marks (bass). It was recorded by Chad Carlson at Sound Cottage and Quad Studios in Nashville.",
            "Big Machine sent it to US country radio on September 10, 2007 as the album's third single, after \"Tim McGraw\" and \"Teardrops on My Guitar,\" then to pop radio on March 10, 2008. Trey Fanjoy directed the video, which premiered on CMT on September 24, 2007 and won Video of the Year and Female Video of the Year at the 2008 CMT Music Awards.",
          ],
          supported: [
            "The song stayed in her live rotation for years: on the Eras Tour she revived it as an acoustic surprise-song mashup in Madrid (paired with \"Jump Then Fall,\" May 30, 2024) and in New Orleans (paired with \"Call It What You Want,\" October 25, 2024).",
            "It was named among the \"Award-Winning Songs\" at the 2008 BMI Country Awards, and retrospective rankings of her catalog regularly single out its hook as an early sign of her songwriting instinct.",
          ],
          fanTheories: [
            "Swift has only ever described the song as being about a boyfriend she was dating with whom she had no defining song; she has never named a real-life couple, so fans tend to read its lovers as an everyteen composite rather than one documented relationship.",
          ],
        },
        connections: [
          {
            relatedId: "song:tim-mcgraw",
            label: "Tim McGraw",
            why: "The debut's first single and its third are the era's bookends — the goodbye that introduced her and the homemade love song that made her a record-setter.",
          },
          {
            relatedId: "song:teardrops-on-my-guitar",
            label: "Teardrops on My Guitar",
            why: "The single that ran between them; together the three carried the debut across country radio and then over to pop.",
          },
        ],
        sources: [
          { name: "Our Song (Taylor Swift song) — Wikipedia", url: "https://en.wikipedia.org/wiki/Our_Song_(Taylor_Swift_song)" },
          { name: "The Boot: Story Behind the Song — \"Our Song\"", url: "https://theboot.com/story-behind-the-song-our-song-taylor-swift/" },
          { name: "Songfacts: \"Our Song\" by Taylor Swift", url: "https://www.songfacts.com/facts/taylor-swift/our-song" },
          { name: "NOLA.com: Eras Tour surprise songs, New Orleans", url: "https://www.nola.com/entertainment_life/taylor_swift/eras-tour-surprise-guest-new-orleans-night-1/" },
        ],
      },
      dossier: {
        whyItMatters: [
          "It is the record that proved the debut was no fluke: her first Billboard Hot Country Songs No. 1, and the one that made her the youngest person to single-handedly write AND sing a country chart-topper — a distinction that traces to the 17-year-old who wrote and recorded it. It spent six consecutive weeks at No. 1 (first dated Dec. 15, 2007), crossed to No. 16 on the Hot 100, and is certified 4x platinum.",
          "The origin is pure homemade Taylor: she wrote it alone in about twenty minutes for her ninth-grade talent show, wanting an upbeat song everyone could relate to, and only cut it after classmates kept singing the hook back to her. A late album cut — track 11 — it was chosen as the third single (sent to country radio Sept. 10, 2007, after 'Tim McGraw' and 'Teardrops on My Guitar') and placed last on the record so its closing 'play it again' line would nudge listeners to restart the whole thing."
        ],
        meaning: {
          confirmed: [
            "Track 11 and the closing song of Taylor Swift (Oct. 24, 2006); written solely by Swift and produced by Nathan Chapman, who also played banjo and electric guitar on it, with Rob Hajacos on fiddle and a Nashville session band.",
            "Six consecutive weeks at No. 1 on Billboard Hot Country Songs (first dated Dec. 15, 2007), No. 16 on the Hot 100, and an RIAA 4x-platinum certification (August 2014).",
            "Trey Fanjoy directed the music video, which premiered on CMT on Sept. 24, 2007 and won both Video of the Year and Female Video of the Year at the 2008 CMT Music Awards."
          ],
          supported: [
            "Swift has said she wrote it for her ninth-grade talent show in roughly twenty minutes, because she was dating someone with no shared 'song' and decided everything already around them was one; she made it the album closer so the final 'play it again' would send listeners back to the top.",
            "It was recognized among the 2008 BMI Country Awards' award-winning songs, and reception at release was warm, singling out its plainspoken, everyday-romance detail.",
            "It became a recurring Eras Tour acoustic surprise song — played in Los Angeles on Aug. 4, 2023 (the night filmed for the concert movie, paired with 'You Are in Love') and mashed with 'Call It What You Want' on the New Orleans opening night, where she noted the song had just 'turned 18.'"
          ],
          fanTheories: [
            "Fans read it as the debut's thesis in miniature — that the small, unglamorous specifics (a screen door, a late phone call, sneaking back in slow) are the love song — and prize the closing 'play it again' as a built-in invitation to loop the record."
          ]
        },
        connections: [
          {
            relatedId: "song:tim-mcgraw",
            label: "Tim McGraw",
            why: "The debut single run in order: 'Tim McGraw' opened the campaign, 'Our Song' finished it as her first No. 1. A reader tracing how she broke wants the first single beside the first chart-topper."
          },
          {
            relatedId: "song:teardrops-on-my-guitar",
            label: "Teardrops on My Guitar",
            why: "The second single between them — the crossover-leaning ballad that set up 'Our Song' as the third and biggest, completing the debut's three-single arc."
          },
          {
            relatedId: "moment:vault-debut-our-song-hits-number-one",
            label: "“Our Song” hits number one",
            why: "The moment page for the record this song set — the youngest solo writer-performer of a country No. 1 — is the event this track's story culminates in."
          }
        ],
        sources: [
          {
            name: "Our Song — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Our_Song"
          },
          {
            name: "Songfacts: Our Song by Taylor Swift",
            url: "https://www.songfacts.com/facts/taylor-swift/our-song"
          },
          {
            name: "Billboard: All the Surprise Songs Taylor Swift Performed on The Eras Tour",
            url: "https://www.billboard.com/lists/taylor-swift-eras-tour-surprise-songs/"
          }
        ]
      },
    },
    {
      slug: 'im-only-me-when-im-with-you',
      trackNumber: 12,
      trackTitle: "I'm Only Me When I'm with You",
      youtubeId: 'AlTfYj7q5gQ', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift (Deluxe Edition)',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Robert Ellis Orrall', 'Angelo Petraglia'],
      producers: ['Robert Ellis Orrall', 'Angelo Petraglia'],
      note: 'The fiddle-stomping deluxe cut about the people who get to see the unedited version of you.',
      summary:
        'A tribute to the friends and family around whom she never has to perform — the deluxe track fans read as being as much about her best friend as any boy.',
      inspiration: null,
      themes: ['authenticity', 'friendship', 'belonging'],
      fanLore:
        'Fan reading: the home-video-style music video starred her real childhood best friend Abigail, cementing the friendship interpretation.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'invisible',
      trackNumber: 13,
      trackTitle: 'Invisible',
      youtubeId: 'IiWI7qG8Jpc', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift (Deluxe Edition)',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Robert Ellis Orrall'],
      producers: ['Robert Ellis Orrall'],
      note: 'The quiet deluxe-edition companion to Teardrops on My Guitar — same wallflower ache, softer light.',
      summary:
        'Watching a boy chase a girl who barely notices him, while she waits unseen — a study in being overlooked by someone you actually see clearly.',
      inspiration: null,
      themes: ['invisibility', 'unrequited love', 'longing'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'a-perfectly-good-heart',
      trackNumber: 14,
      trackTitle: 'A Perfectly Good Heart',
      youtubeId: 'mbs84V9S5Lc', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift (Deluxe Edition)',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Brett James', 'Troy Verges'],
      producers: ['Brett James', 'Troy Verges'],
      note: 'The deluxe closer asking the debut album’s simplest question: why break something that was working fine?',
      summary:
        'First heartbreak rendered as bewilderment — no revenge, no comeback, just the raw question of why someone would wound a heart offered in good faith.',
      inspiration: null,
      themes: ['first heartbreak', 'innocence lost', 'confusion'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      sources: [ALBUM],
    },
  ],
};

export default _debut;
