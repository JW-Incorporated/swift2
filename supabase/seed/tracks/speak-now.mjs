// Vault track guide — Speak Now era (Speak Now 2010 / Taylor's Version 2023,
// including From The Vault). Original prose only — never lyrics; unconfirmed
// readings are labeled. Provenance per docs/content/content-audit-2026-07-08.md
// §5 (URLs verified 2026-07-08). Every track on the original album was written
// solely by Swift — her documented answer to critics who doubted her pen.

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
  'Speak Now',
  'Speak_Now',
  'album article: release facts, credits, and cited interviews',
);
const TV = wiki(
  "Speak Now (Taylor's Version)",
  "Speak_Now_(Taylor's_Version)",
  're-recording article: vault-track credits and release facts',
);

const TRACKS = [
  {
    slug: 'mine',
    trackNumber: 1,
    trackTitle: 'Mine',
    youtubeId: 'oxNLRqMJMZk', // oEmbed-verified official Taylor Swift channel
    release: 'Speak Now',
    releaseDate: '2010-10-25',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Nathan Chapman'],
    singleReleaseDate: '2010-08-04',
    note: 'The lead single, rush-released early after a leak — about her habit of running from love before it can run from her.',
    summary:
      'A girl who learned from her parents’ arguments to expect goodbye imagines, verse by verse, what staying could look like — a careless man’s careful daughter finding an exception.',
    inspiration:
      'Swift said it is about her tendency to flee relationships to avoid being left, written about a crush who never knew.',
    themes: ['fear of abandonment', 'hope against pattern', 'building a life'],
    sourceUrl: 'https://en.wikipedia.org/wiki/Mine_(Taylor_Swift_song)',
    sources: [
      wiki(
        'Mine (Taylor Swift song)',
        'Mine_(Taylor_Swift_song)',
        'song article: early release and background',
      ),
      ALBUM,
    ],
    dossier: {
      whyItMatters: [
        'Mine opened the Speak Now era ahead of its own schedule. A low-quality copy leaked online on August 4, 2010, and Big Machine answered by rushing the finished single to iTunes and country radio nearly two weeks before the planned August 16 date. The scramble cost the song nothing: it debuted at No. 3 on the Billboard Hot 100 on 297,000 first-week downloads, peaked at No. 2 on Hot Country Songs, topped Adult Contemporary, and eventually went triple platinum.',
        "It also announced the album's most interesting habit: self-diagnosis. Taylor said the song is about her tendency to run from love before it can leave her, written about a crush who never knew he had inspired it — so the whole storybook romance in the verses is an act of deliberate imagination, a runaway rehearsing what staying might feel like. The video she co-directed with Roman White, shot in Kennebunkport, Maine with Toby Hemingway as the love interest, gave the fantasy a happy ending and won Video of the Year at the 2011 CMT Music Awards.",
      ],
      meaning: {
        confirmed: [
          'Taylor wrote it alone and produced it with Nathan Chapman; after the August 4, 2010 leak it was rush-released ahead of the planned date, debuted at No. 3 on the Hot 100 with 297,000 downloads, peaked at No. 2 on Hot Country Songs and No. 1 on Adult Contemporary, and was certified triple platinum.',
          'Taylor explained the song addresses her tendency to run from love out of fear of heartbreak, and said it was written about a boy she liked who never knew — the lyric imagines what would happen if she let her guard down.',
        ],
        supported: [
          "The song's engine is a learned flinch being unlearned: a narrator raised around arguments decides, verse by verse, that the pattern is not destiny — which is why critics heard it as simple but honest emotional writing even when some found the formula familiar.",
          "As the era's lead single it did the thesis work: Speak Now is an album of things said out loud before it is too late, and Mine opens it with the hardest sentence of all — asking someone to stay.",
        ],
        fanTheories: [
          'Because Taylor described the muse only as a crush who never knew about the song, this lead single has unusually quiet attribution lore; fan speculation centers less on a name and more on how much of the imagined future was autobiography in waiting.',
        ],
      },
      connections: [
        {
          relatedId: 'song:sparks-fly',
          label: 'Sparks Fly',
          why: "The album's opening pair runs on the same current: Mine imagines where the attraction could lead, Sparks Fly stays inside the first jolt of it.",
        },
        {
          relatedId: 'song:ours',
          label: 'Ours',
          why: "Both defend an ordinary, unglamorous love against outside noise — Mine against her own instinct to bolt, Ours against everyone else's opinions.",
        },
      ],
      sources: [
        {
          name: 'Mine (Taylor Swift song) — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Mine_(Taylor_Swift_song)',
        },
        {
          name: "CBS News: Taylor Swift Rush Releases 'Mine' After Internet Leak (2010)",
          url: 'https://www.cbsnews.com/news/taylor-swift-rush-releases-mine-to-radio-after-internet-leak-speak-now-album-in-october/',
        },
      ],
    },
  },
  {
    slug: 'sparks-fly',
    trackNumber: 2,
    trackTitle: 'Sparks Fly',
    youtubeId: 'UlFrV5GJA_4', // oEmbed-verified official Taylor Swift channel
    release: 'Speak Now',
    releaseDate: '2010-10-25',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Nathan Chapman'],
    isSingle: true,
    note: 'Written years earlier and resurrected by fan demand — live bootlegs made Swifties campaign it onto the album.',
    summary:
      'Attraction as weather: a green-eyed someone she knows is a bad idea, and the rain-soaked kiss she wants anyway.',
    inspiration:
      'An early composition Swift performed live in 2007; fan enthusiasm for the bootleg is the documented reason it was reworked for Speak Now.',
    themes: ['electric attraction', 'bad ideas', 'fan-powered history'],
    sourceUrl: 'https://en.wikipedia.org/wiki/Sparks_Fly_(song)',
    sources: [
      wiki('Sparks Fly (song)', 'Sparks_Fly_(song)', 'song article: fan-demand origin'),
      ALBUM,
    ],
    dossier: {
      whyItMatters: [
        'Sparks Fly is fan-powered history from before fan campaigns had infrastructure. Taylor wrote it in 2006 at sixteen and played it occasionally at small venues; a recorded performance began circulating online in 2008 and became a bootleg favorite, and after fans kept requesting it at the 2010 CMA Music Festival she reworked the song for Speak Now. An audience willed a shelved teenage composition onto a blockbuster album — a preview of the lobbying power that would later resurrect a ten-minute All Too Well.',
        "The grown-up version paid off the wait. Released to country radio on July 18, 2011 as the album's fifth single, it debuted at No. 17 on the Hot 100, reached No. 1 on Hot Country Songs, and was certified platinum. Taylor described spending two years honing the lyrics, and said the rewrite made the narrator more confident — the sixteen-year-old's crush upgraded to a woman who knows exactly what bad idea she is choosing.",
      ],
      meaning: {
        confirmed: [
          'Taylor composed it in 2006 at age sixteen and performed it at small venues; a 2008 recording circulated online, and fan requests at the 2010 CMA Music Festival led her to rework it for Speak Now. She wrote it alone and produced it with Nathan Chapman.',
          "Released as the album's fifth single on July 18, 2011, it debuted at No. 17 on the Hot 100, hit No. 1 on Hot Country Songs, and was certified platinum by the RIAA; Taylor said the reworked lyric made the narrator more confident while keeping the original arrangement.",
        ],
        supported: [
          'Taylor framed the song as being about falling for someone you probably should not fall for and being unable to stop because the connection is that strong — attraction treated as weather you can see coming and stand in anyway.',
          "Contemporary reviews praised the production and her expressive delivery while noting the imagery ran familiar; Taste of Country's review called the blend of country and pop unmistakably her own.",
        ],
        fanTheories: [
          "Fans have never settled on a subject: the 2006 origin predates most of her documented public relationships, which has kept the attribution guessing unusually low-stakes — the rare Taylor mystery where the song's history matters more than its muse.",
        ],
      },
      connections: [
        {
          relatedId: 'song:mine',
          label: 'Mine',
          why: "The album's opening pair: Sparks Fly is the electric first jolt, Mine is the narrator daring to imagine what comes after it.",
        },
        {
          relatedId: 'song:enchanted',
          label: 'Enchanted',
          why: 'Two portraits of instant attraction — Sparks Fly wants the storm to hit, Enchanted lies awake afterward replaying every minute of it.',
        },
      ],
      sources: [
        {
          name: 'Sparks Fly (song) — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Sparks_Fly_(song)',
        },
        {
          name: "Taste of Country: Taylor Swift, 'Sparks Fly' — Song Review (2011)",
          url: 'https://tasteofcountry.com/taylor-swift-sparks-fly/',
        },
      ],
    },
  },
  {
    slug: 'back-to-december',
    trackNumber: 3,
    trackTitle: 'Back to December',
    youtubeId: 'qc2Z-OX9wnc', // oEmbed-verified official Taylor Swift channel
    release: 'Speak Now',
    releaseDate: '2010-10-25',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Nathan Chapman'],
    isSingle: true,
    note: 'Her first apology song — the one time on the early albums she casts herself as the one who did the breaking.',
    summary:
      'An apology delivered out loud to someone who deserved better: she replays the December she gave back his love and owns the damage.',
    inspiration:
      'Swift confirmed it is an apology to someone she hurt; it is widely reported to be about Taylor Lautner, who himself has good-naturedly acknowledged the association in later interviews.',
    themes: ['remorse', 'accountability', 'roads not taken'],
    sourceUrl: 'https://en.wikipedia.org/wiki/Back_to_December',
    sources: [
      wiki('Back to December', 'Back_to_December', 'song article: apology framing and reporting'),
      ALBUM,
    ],
    dossier: {
      whyItMatters: [
        'Back to December is the first time Taylor wrote herself as the one who did the breaking. She said so plainly at release: the song is an apology to someone who was absolutely wonderful to her, a ball she dropped and needed to own out loud. On an album full of open letters, this is the one addressed from the guilty party — a reversal critics immediately read as a leap in maturity. Released as a single on November 15, 2010, it climbed to No. 6 on the Hot 100 and No. 3 on Hot Country Songs.',
        "It is also the rare entry in her catalog where the muse question has an on-the-record answer. Taylor declined to name the subject in 2010, but in a 2016 Facebook Live with his Scream Queens castmates, Taylor Lautner acknowledged the song is about him — turning years of fan timeline math into documented fact. She performed it at the 2010 CMA Awards and folded it into an American Music Awards mashup with OneRepublic's Apologize, leaning into the theme.",
      ],
      meaning: {
        confirmed: [
          'Taylor wrote it alone, produced it with Nathan Chapman, and released it as a single on November 15, 2010; it peaked at No. 6 on the Hot 100 and No. 3 on Hot Country Songs.',
          'She described it as an apology to a past love — the first time she had apologized in a song — saying someone had been absolutely wonderful to her and she dropped the ball; in 2016 Taylor Lautner acknowledged on a Facebook Live with Scream Queens castmates that the song is about him.',
        ],
        supported: [
          'Critics praised the emotional honesty and the vulnerability in the vocal, and retrospective rankings often cite it as the moment her writing learned to indict herself as readily as anyone else.',
          'Within the album it balances the ledger: a record famous for its scorched-earth letters also contains its most unguarded act of accountability, sequenced early like a disclosure.',
        ],
        fanTheories: [
          "Before Lautner's 2016 acknowledgment, the attribution was entirely fan-assembled — a December timeline and a 2009 public friendship mapped onto the lyric. His confirmation made this one of the few Speak Now muse theories ever converted into fact by the named person himself.",
        ],
      },
      connections: [
        {
          relatedId: 'song:innocent',
          label: 'Innocent',
          why: "The album's two acts of grace: Back to December asks forgiveness for her own damage, Innocent extends it to someone who damaged her.",
        },
        {
          relatedId: 'song:last-kiss',
          label: 'Last Kiss',
          why: 'Two autopsies of endings with opposite fault lines — one grieves what she broke, the other grieves what broke her.',
        },
      ],
      sources: [
        {
          name: 'Back to December — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Back_to_December',
        },
        {
          name: "Time: Taylor Lautner Opens Up About Taylor Swift's Song About Him (2016)",
          url: 'https://time.com/4445042/taylor-lautner-taylor-swift-song/',
        },
      ],
    },
  },
  {
    slug: 'speak-now',
    trackNumber: 4,
    trackTitle: 'Speak Now',
    youtubeId: 'JlZnvyBqceY', // oEmbed-verified official Taylor Swift channel
    release: 'Speak Now',
    releaseDate: '2010-10-25',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Nathan Chapman'],
    note: 'The title track: a rom-com heist where she crashes the wedding of a boy marrying the wrong girl — and named the whole album’s say-it-now philosophy.',
    summary:
      'A comic fantasy of interrupting a wedding at the speak-now-or-forever-hold-your-peace moment; the album title came from the idea of saying what you feel before the door closes.',
    inspiration:
      'Swift said the scenario was sparked by a friend whose childhood sweetheart was marrying someone else — she imagined the barge-in her friend never did.',
    themes: ['speaking up', 'romantic comedy', 'seizing the moment'],
    sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now_(song)',
    sources: [
      wiki('Speak Now (song)', 'Speak_Now_(song)', 'song article: title-track concept'),
      ALBUM,
    ],
    dossier: {
      whyItMatters: [
        "The title track named an entire philosophy. Taylor built the song from a real conversation: a friend's high-school sweetheart was marrying someone else — someone who had, in her friend's telling, isolated him from the people he loved — and Taylor's instinct was to joke that her friend should storm the church while she played guitar. A vivid dream about an ex marrying a stranger sealed it, and the wedding-objection scenario became a comic heist song: crash the ceremony, say the thing, leave with the groom.",
        'Released as a promotional single on October 5, 2010, it debuted at No. 8 on the Hot 100 and went gold. More importantly, it titled the album. Taylor explained the ceremony phrase as a metaphor for waiting until it is too late to say something, and said the record collected everything she had wanted to tell people but never did — all of it, famously, written alone, with ideas arriving at four in the morning or mid-tour in Arkansas with no co-writer to call.',
      ],
      meaning: {
        confirmed: [
          'Taylor wrote it alone and produced it with Nathan Chapman; released as a promotional single on October 5, 2010, it debuted at No. 8 on the Hot 100 and was certified gold in the US and platinum in Australia — one of fourteen tracks chosen from roughly forty she wrote for the album.',
          "She has described the two documented sparks: a friend whose high-school sweetheart was marrying someone else (Taylor joked about storming the church), and her own dream about a former love's wedding; she framed the album title as a metaphor for waiting until it is too late to say something, on a record of things she had never been able to say.",
        ],
        supported: [
          "Critics enjoyed it as pure caper — playful, cinematic storytelling with a wink — even where some found the scenario juvenile; the brief flip to the groom's point of view near the end is the tell that she is writing theater, not confession.",
          "The song works as the album's mission statement in miniature: every other track is some version of the objection speech, delivered before the metaphorical doors close.",
        ],
        fanTheories: [
          'Fans have speculated for years about which friend lived the real version of the story; Taylor has never identified the couple, and the dream she described suggests the fantasy was at least partly her own.',
        ],
      },
      connections: [
        {
          relatedId: 'song:the-story-of-us',
          label: 'The Story of Us',
          why: 'Thesis and cautionary tale: Speak Now barges in and says the thing, The Story of Us documents exactly what the silence costs.',
        },
        {
          relatedId: 'song:if-this-was-a-movie',
          label: 'If This Was a Movie',
          why: 'Both run on movie logic — one stages the objection scene herself, the other waits for a third-act reunion that real life keeps refusing to film.',
        },
      ],
      sources: [
        {
          name: 'Speak Now (song) — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Speak_Now_(song)',
        },
        {
          name: "American Songwriter: Behind the Meaning of Taylor Swift's 'Speak Now'",
          url: 'https://americansongwriter.com/behind-the-meaning-of-taylor-swifts-speak-now/',
        },
        {
          name: "Entertainment Tonight: How Taylor Swift Explained Speak Now's Title and Songwriting (2010 flashback)",
          url: 'https://www.etonline.com/speak-now-how-taylor-swift-explained-albums-title-and-her-songwriting-process-in-2010-flashback',
        },
      ],
    },
  },
  {
    slug: 'dear-john',
    trackNumber: 5,
    trackTitle: 'Dear John',
    youtubeId: 'N-FYySSy0rM', // oEmbed-verified official Taylor Swift channel
    release: 'Speak Now',
    releaseDate: '2010-10-25',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Nathan Chapman'],
    note: 'The 6-minute blues-burn track 5 — an open letter to an older man who played games with a 19-year-old, and one of the most dissected songs she has ever written.',
    summary:
      'A young woman looks back at a manipulative relationship with someone much older and reclaims the story: she should have known, but he definitely did.',
    inspiration:
      'Never explicitly named by Swift; the title and guitar styling made John Mayer the universal press reading, and Mayer publicly objected to the song in a 2012 interview. Before the 2023 re-record, Swift pointedly asked fans for kindness toward the song’s subjects.',
    themes: ['age-gap power imbalance', 'manipulation', 'reclaiming the narrative'],
    fanLore:
      'Fan reading (widely reported, unconfirmed): the Mayer attribution; the documented facts are his public response and Swift’s 2023 no-harassment plea.',
    sourceUrl: 'https://en.wikipedia.org/wiki/Dear_John_(Taylor_Swift_song)',
    sources: [
      wiki(
        'Dear John (Taylor Swift song)',
        'Dear_John_(Taylor_Swift_song)',
        'song article: reception and Mayer response',
      ),
      ALBUM,
    ],
    dossier: {
      whyItMatters: [
        "Dear John is the album's six-minute, forty-three-second center of gravity: a slow blues burn in the track-five slot about a nineteen-year-old picking apart a much older man's games. Never a single, it still reached No. 54 on the Hot 100 on album play in 2010, and the 2023 re-recording climbed to No. 26. In the Speak Now (Taylor's Version) prologue, Taylor named it the most scathing song she has ever written — her own superlative, thirteen years on. She described the album's songs as open letters, and told USA Today this one was like the final e-mail you would send someone you used to be with.",
        'Its afterlife is a case study in how she manages the muse question. Asked in 2012 whether it was about John Mayer, she called the assumption presumptuous and repeated that she never discloses subjects. Mayer, for his part, went on the record in a June 2012 Rolling Stone interview saying the song humiliated him and dismissing it as cheap songwriting — his reaction is documented fact even though the attribution stays formally unconfirmed. When she finally played it live again on June 24, 2023 in Minneapolis, her first performance in eleven years, she prefaced it by asking fans for kindness and gentleness online, saying she was 33 and cared about nothing from when she was 19 except the songs she wrote.',
      ],
      meaning: {
        confirmed: [
          "Taylor wrote it alone and produced it with Nathan Chapman; the 6:43 deep cut reached No. 54 on the Hot 100 in 2010, and the Taylor's Version peaked at No. 26 in 2023. In the re-recording's prologue she called it the most scathing song she has ever written.",
          "She has never named the subject — telling Glamour in 2012 the Mayer assumption was presumptuous — while Mayer publicly responded in Rolling Stone that June, saying the song humiliated him and calling it cheap songwriting. Reviving it in Minneapolis on June 24, 2023, her first performance in eleven years, she asked fans not to defend her online against anyone she might have written about, requesting kindness ahead of the album's release.",
        ],
        supported: [
          'Critics praised its emotional force while some contemporaries flinched at the accusatory framing; retrospective assessments rank it among her best writing, and the extended guitar language was universally heard as a stylistic tell aimed at its rumored subject.',
          "The song's power move is the reclamation arc: it opens in self-blame — she should have known — and methodically shifts the verdict to the older party who certainly did.",
        ],
        fanTheories: [
          'The Mayer attribution is the most universal fan reading in the Speak Now catalog, built from the title, the blues-guitar styling, and the 2009-2010 timeline; it remains unconfirmed by Taylor, whose 2023 plea for gentleness is the closest she has come to acknowledging the discourse at all.',
        ],
      },
      connections: [
        {
          relatedId: 'song:superman',
          label: 'Superman',
          why: 'Fan chronologies file both in the same chapter: Superman watches the impressive older man fly off admiringly, Dear John grounds him.',
        },
        {
          relatedId: 'song:the-story-of-us',
          label: 'The Story of Us',
          why: 'Taylor tied The Story of Us to running into an ex at an awards show, and fans read the two songs as the same story at two temperatures — public avoidance and private indictment.',
        },
      ],
      sources: [
        {
          name: 'Dear John (Taylor Swift song) — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Dear_John_(Taylor_Swift_song)',
        },
        {
          name: 'Newsweek: Taylor Swift Asks Fans to Stop Attacking John Mayer (2023)',
          url: 'https://www.newsweek.com/taylor-swift-eras-tour-minneapolis-john-mayer-speak-now-1994859',
        },
        {
          name: 'PopCrush: Taylor Swift Reveals Her Saddest and Most Scathing Songs (2023)',
          url: 'https://popcrush.com/taylor-swift-saddest-most-scathing-wistfully-romantic-songs/',
        },
      ],
    },
  },
  {
    slug: 'mean',
    trackNumber: 6,
    trackTitle: 'Mean',
    youtubeId: '8AR1dKawCi8', // oEmbed-verified official Taylor Swift channel
    release: 'Speak Now',
    releaseDate: '2010-10-25',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Nathan Chapman'],
    isSingle: true,
    note: 'The banjo clapback at a critic who said she ruined her career — it won two Grammys, which settled the argument.',
    summary:
      'Aimed at a bully with a platform: someday she will be big enough that the cheap shots cannot reach, and he will still be mean.',
    inspiration:
      'Swift confirmed it was written about a critic who savaged her after a rough 2010 Grammys vocal; reporting widely identified blogger Bob Lefsetz. It won Best Country Song and Best Country Solo Performance at the 2012 Grammys.',
    themes: ['bullying', 'resilience', 'success as the answer'],
    sourceUrl: 'https://en.wikipedia.org/wiki/Mean_(song)',
    sources: [
      wiki('Mean (song)', 'Mean_(song)', 'song article: critic origin and Grammy wins'),
      ALBUM,
    ],
    dossier: {
      whyItMatters: [
        "Mean is the banjo-driven answer to the worst stretch of press Taylor had yet weathered: the pile-on over her vocals after rocky 2009-2010 awards-show performances. She said she wrote it about critics who go past critique into attacking everything about a person — and instead of hiding the wound, she set it to bluegrass stomp and released it to country radio on March 7, 2011 as the album's third single. It reached No. 11 on the Hot 100, No. 2 on Hot Country Songs, and went triple platinum.",
        'Then came the ending she could not have scripted. At the 54th Grammy Awards on February 12, 2012, Mean won Best Country Song and Best Country Solo Performance, and she performed it on the telecast with the lyric about someday pointedly updated to singing it at the Grammys — earning a standing ovation. Her acceptance line said the quiet part out loud: there is no feeling like writing a song about someone who is mean to you and then winning a Grammy for it.',
      ],
      meaning: {
        confirmed: [
          'Taylor wrote it alone and produced it with Nathan Chapman; released to country radio on March 7, 2011 as the third single, it peaked at No. 11 on the Hot 100 and No. 2 on Hot Country Songs and was certified triple platinum in the US.',
          'It won Best Country Song and Best Country Solo Performance at the 2012 Grammys (February 12, 2012), where she performed it with the future-tense lyric changed to reference singing it at the ceremony; Taylor confirmed she wrote it about critics whose attacks on her — including her singing — crossed from criticism into cruelty.',
        ],
        supported: [
          "Critics praised the bluegrass production and the anti-bullying framing, though some argued the song's own counterpunch complicated its message — a debate that became part of its story.",
          "The Grammy-night lyric swap turned the song into a completed arc in real time: the prophecy about outgrowing a bully's reach, performed at the exact moment it came true.",
        ],
        fanTheories: [
          'Reporting at the time widely identified industry blogger Bob Lefsetz — who had savaged her 2010 Grammys duet — as the critic in question; Taylor described the target only in general terms and never named anyone, so the identification remains a press-and-fan reading.',
        ],
      },
      connections: [
        {
          relatedId: 'song:innocent',
          label: 'Innocent',
          why: "The album's two responses to public wounds: Innocent answers humiliation with forgiveness, Mean answers it with a banjo and a scoreboard.",
        },
        {
          relatedId: 'song:long-live',
          label: 'Long Live',
          why: 'Mean predicts a someday big enough that the cheap shots cannot reach; Long Live is what that someday sounded like from the inside.',
        },
      ],
      sources: [
        {
          name: 'Mean (song) — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Mean_(song)',
        },
        {
          name: 'Taste of Country: Taylor Swift Wins Best Country Song at 2012 Grammys',
          url: 'https://tasteofcountry.com/taylor-swift-best-country-song-2012-grammy-awards/',
        },
        {
          name: "The Boot: Taylor Swift's 'Mean' Wins Best Country Solo Performance (2012)",
          url: 'https://theboot.com/taylor-swift-grammys-2012/',
        },
      ],
    },
  },
  {
    slug: 'the-story-of-us',
    trackNumber: 7,
    trackTitle: 'The Story of Us',
    youtubeId: 'pRhWAXg4xek', // oEmbed-verified official Taylor Swift channel
    release: 'Speak Now',
    releaseDate: '2010-10-25',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Nathan Chapman'],
    isSingle: true,
    note: 'Pop-punk panic about sitting rows away from an ex at an awards show and both pretending the other is invisible.',
    summary:
      'A love story that stalled mid-chapter: two people in the same room performing indifference, narrated by the one who hates the silence most.',
    inspiration:
      'Swift confirmed it was sparked by running into an ex at an awards show and the absurd theater of mutual avoidance.',
    themes: ['awkward encounters', 'pride', 'unfinished stories'],
    sourceUrl: 'https://en.wikipedia.org/wiki/The_Story_of_Us_(song)',
    sources: [
      wiki('The Story of Us (song)', 'The_Story_of_Us_(song)', 'song article: awards-show origin'),
      ALBUM,
    ],
    dossier: {
      whyItMatters: [
        "The Story of Us is the album's thesis argued in the negative. Taylor told the origin story herself: she ran into an ex at an awards show, seated only a few places away, and the two of them spent the night performing elaborate mutual invisibility. She went home and told her mother she had felt completely alone in a room full of people — and built the song around that sensation the same night. On an album named for speaking up, this is the track about what it costs when nobody does.",
        "Musically it is the record's most caffeinated swerve: a pop-punk, new-wave-tinged sprint of slashing guitars and fast drums that critics flagged as her furthest step from country to date. Released as a single in April 2011, it reached No. 41 on the Hot 100 — modest by her standards, but its DNA (awards-show dread, performed indifference, silence as the villain) kept resurfacing across the catalog for years.",
      ],
      meaning: {
        confirmed: [
          'Taylor wrote it alone and produced it with Nathan Chapman; it was released as a single in April 2011 (US pop radio April 19) and peaked at No. 41 on the Hot 100.',
          "She confirmed the inspiration: encountering an ex-boyfriend seated rows away at an awards show, feeling unable to speak, and telling her mother afterward that she had felt alone in a crowded room — a line that became the song's emotional center.",
        ],
        supported: [
          'Critics praised the specific, relatable lyric detail and the radio-ready energy, while some heard the pop-punk production as evidence the country boundary was already dissolving a full album before Red.',
          "The song dramatizes pride as a standoff: two people narrating the same silence, each waiting for the other to blink first — the album's whole speak-now philosophy proven by counterexample.",
        ],
        fanTheories: [
          'Fans and press slot it into the same chapter as Dear John — same rumored ex, same 2010 awards-season timeline; Taylor has only ever described the scenario, never the cast, so the linkage remains an unconfirmed reading.',
        ],
      },
      connections: [
        {
          relatedId: 'song:speak-now',
          label: 'Speak Now',
          why: 'The title track is the fantasy of saying the thing; The Story of Us is the documentary of not saying it.',
        },
        {
          relatedId: 'song:dear-john',
          label: 'Dear John',
          why: 'Fans read them as one story at two volumes — the frozen public encounter here, the six-minute private verdict there.',
        },
      ],
      sources: [
        {
          name: 'The Story of Us (song) — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/The_Story_of_Us_(song)',
        },
        {
          name: "Taste of Country: Taylor Swift, 'The Story of Us' — Story Behind the Song",
          url: 'https://tasteofcountry.com/taylor-swift-the-story-of-us/',
        },
      ],
    },
  },
  {
    slug: 'never-grow-up',
    trackNumber: 8,
    trackTitle: 'Never Grow Up',
    youtubeId: 'maEVfpxDB8k', // oEmbed-verified official Taylor Swift channel
    release: 'Speak Now',
    releaseDate: '2010-10-25',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Nathan Chapman'],
    note: 'Written around her first solo apartment — a lullaby to a child in verse one that turns out to be a lullaby to herself by verse three.',
    summary:
      'A plea to freeze childhood before the world edits it: protectiveness toward little kids, then the lonely first night in her own place.',
    inspiration:
      'Swift tied it to moving out on her own for the first time and realizing growing up had actually happened.',
    themes: ['growing up', 'innocence', 'homesickness'],
    sourceUrl: 'https://en.wikipedia.org/wiki/Never_Grow_Up',
    sources: [wiki('Never Grow Up', 'Never_Grow_Up', 'song article: writing context'), ALBUM],
    dossier: {
      whyItMatters: [
        "Never Grow Up is Speak Now's quiet emotional hinge — a fan-favorite deep cut, never a single, tucked between the album's romances and revenge songs like a held breath. It is built as a lullaby that moves through three vantage points: an adult hushing a sleeping baby, then a watchful eye on a teenager already in a hurry to leave, then Taylor alone on the first night in her own apartment. Charting only on album strength (it reached No. 84 on the Hot 100 and was certified gold in 2015), it earns its place by feeling, not numbers.",
        'Its power is that it re-reads at every age you return to it. Taylor tied the final verse to moving out on her own for the first time — the "big city, they just dropped me off" of the lyric is her describing that actual first night alone — so the song widens as she and the listener grow: the distance between the sleeping child of verse one and the uncertain adult of verse three only gets longer. She has kept it close, folding it into the acoustic and surprise-song stretches of every tour from Speak Now through the Eras era.',
      ],
      meaning: {
        confirmed: [
          'Taylor wrote it alone and produced it with Nathan Chapman; it is track eight on Speak Now, never released as a single, and charted on album sales (No. 84 on the Hot 100) before its 2015 gold certification. It is structured as a lullaby in three perspectives — an adult to a baby, a watched teenager, and finally herself.',
          'She has described the song as coming from not quite knowing how she felt about growing up — "it happens without you knowing it" — and tied its closing verse to moving into her own apartment for the first time in 2009, writing the loneliness of that first night away from home directly into the last scene.',
        ],
        supported: [
          "Critics have long heard it as the album's throwback: a folksy, fingerpicked change of pace closer to her country-debut songwriting than to Speak Now's bigger productions, which is part of why it reads as a keepsake rather than a statement.",
          'Retrospective reviews of the re-recording pointed to its structure as the source of its ache — the gap between the "childhood snoozing" of the opening and the "uncertain adulting" of the close has only grown more poignant as Taylor has aged into the third verse she once wrote from the threshold of.',
        ],
        fanTheories: [
          "Unusually for Speak Now, there is no muse to chase here — the subject is time itself. Fan conversation centers less on who the song is about and more on how differently it lands each time a listener revisits it, which is the rare Taylor deep cut whose meaning is designed to change with the person hearing it.",
        ],
      },
      connections: [
        {
          relatedId: 'song:the-best-day',
          label: 'The Best Day',
          why: "Her two great childhood-nostalgia songs bookend the leaving: The Best Day looks back from inside a family memory, Never Grow Up looks back from the doorway on the way out of it.",
        },
        {
          relatedId: 'song:seven',
          label: 'Seven',
          why: 'The same ache revisited nine years later — Seven is an adult straining to hold onto childhood, and Never Grow Up is the earlier moment it keeps looking back toward.',
        },
        {
          relatedId: 'song:long-live',
          label: 'Long Live',
          why: "Two sides of the album's obsession with impermanence: Long Live begs a triumphant moment to stay, Never Grow Up begs a fragile one not to end.",
        },
      ],
      sources: [
        {
          name: 'Never Grow Up — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Never_Grow_Up',
        },
        {
          name: "Songfacts: Never Grow Up by Taylor Swift (writing background and Swift's own words)",
          url: 'https://www.songfacts.com/facts/taylor-swift/never-grow-up',
        },
        {
          name: "Rolling Stone UK: Speak Now (Taylor's Version) review",
          url: 'https://www.rollingstone.co.uk/music/news/taylor-swift-speak-now-taylors-version-review-modern-revamp-of-a-classic-30973/',
        },
      ],
    },
  },
  {
    slug: 'enchanted',
    trackNumber: 9,
    trackTitle: 'Enchanted',
    youtubeId: 'igIfiqqVHtA', // oEmbed-verified official Taylor Swift channel
    release: 'Speak Now',
    releaseDate: '2010-10-25',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Nathan Chapman'],
    note: 'One dazzling first meeting, replayed all night — more than a decade later it became a viral wedding-and-TikTok standard and an Eras Tour showstopper.',
    summary:
      'The afterglow of meeting someone wonderstruck-level interesting, and the spiraling hope that he is not going home to somebody else.',
    inspiration:
      'Swift confirmed it was written after meeting Owl City’s Adam Young; Young later responded publicly with his own answer version of the song, and Swift’s Wonderstruck fragrance took its name from the lyric.',
    themes: ['first meetings', 'infatuation', 'what-ifs'],
    easterEggs:
      'The name of her Wonderstruck perfume line is a direct lift from this song’s vocabulary — an early lyric-to-brand Easter egg.',
    sourceUrl: 'https://en.wikipedia.org/wiki/Enchanted_(Taylor_Swift_song)',
    sources: [
      wiki(
        'Enchanted (Taylor Swift song)',
        'Enchanted_(Taylor_Swift_song)',
        'song article: Adam Young exchange and legacy',
      ),
      ALBUM,
    ],
    dossier: {
      whyItMatters: [
        "Enchanted is the song Taylor herself crowned the most wistfully romantic she has ever written, in the Speak Now (Taylor's Version) prologue. The documented origin is unusually specific: she met someone in New York City, and after he used the word wonderstruck in an e-mail to her, she wrote it into the chorus on purpose — then hid the name A-D-A-M in the album booklet's coded liner notes. The infatuation was so legible that the answer arrived in public: in February 2011, Owl City's Adam Young posted a reworked reply version of the song with a message saying he had been enchanted to meet her too.",
        "Taylor never confirmed or denied the identification, and never responded to the reply — which only deepened the song's what-if architecture. Its commercial afterlife outran the whole era: never a single, it became the name-source for her Wonderstruck fragrance in 2011, went viral on TikTok in late 2021 with millions of weekly streams, and settled into the Eras Tour as the Speak Now act's purple-gown showstopper.",
      ],
      meaning: {
        confirmed: [
          "Taylor wrote it alone and produced it with Nathan Chapman; she said it was about meeting someone in New York City she was instantly infatuated with, deliberately used the word wonderstruck because the subject had used it in an e-mail to her, and encoded A-D-A-M in the album booklet. Her Wonderstruck fragrance (October 2011) took its name from the song's vocabulary, and in the 2023 prologue she called it her most wistfully romantic song.",
          'Adam Young of Owl City publicly responded on February 13, 2011 with a reply version of the song and a message saying he had been enchanted to meet her too; Taylor never confirmed nor denied that he was the subject and did not respond publicly to his cover.',
        ],
        supported: [
          "Critics singled out the soaring production and the layered vocal coda as the album's most cinematic stretch, and the song's late-blooming streaming life — a TikTok-driven resurgence in October-November 2021 — turned a deep cut into one of the catalog's most-streamed Speak Now tracks.",
          "The song's engine is uncertainty rather than romance: one dazzling evening spent entirely in the subjunctive, spiraling on whether the feeling was mutual and whether someone else was waiting at his home.",
        ],
        fanTheories: [
          "The Adam Young identification is as close to solved as an unconfirmed muse gets — liner-note cipher, the wonderstruck e-mail detail, and Young's own public reply all point one way — but Taylor has never said his name, so it formally remains a fan-and-press reading.",
        ],
      },
      connections: [
        {
          relatedId: 'song:sparks-fly',
          label: 'Sparks Fly',
          why: 'Two stages of the same electricity: Sparks Fly stands inside the attraction, Enchanted lies awake all night narrating it.',
        },
        {
          relatedId: 'song:if-this-was-a-movie',
          label: 'If This Was a Movie',
          why: 'Both live in the subjunctive — Enchanted scripts a love story from one evening, If This Was a Movie waits for a script real life never delivers.',
        },
      ],
      sources: [
        {
          name: 'Enchanted (Taylor Swift song) — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Enchanted_(Taylor_Swift_song)',
        },
        {
          name: 'PopCrush: Taylor Swift Reveals Her Saddest and Most Scathing Songs (2023)',
          url: 'https://popcrush.com/taylor-swift-saddest-most-scathing-wistfully-romantic-songs/',
        },
      ],
    },
  },
  {
    slug: 'better-than-revenge',
    trackNumber: 10,
    trackTitle: 'Better Than Revenge',
    youtubeId: 'EH70M5OeS4o', // oEmbed-verified official Taylor Swift channel
    release: 'Speak Now',
    releaseDate: '2010-10-25',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Nathan Chapman'],
    note: 'The pop-punk grudge song whose most notorious line was rewritten on Taylor’s Version — the most talked-about lyric change of the whole re-recording project.',
    summary:
      'A takedown of the girl who "stole" a boyfriend, written at 18 in full drama mode; adult Swift swapped the infamous mattress line for a matches metaphor in 2023, a change that dominated the SNTV discourse.',
    inspiration:
      'Swift acknowledged over the years that she wrote it as a teenager assigning blame she would later rethink — the 2023 lyric revision is the documented postscript.',
    themes: ['jealousy', 'teenage grudges', 'revisiting your younger self'],
    sourceUrl: 'https://en.wikipedia.org/wiki/Better_than_Revenge',
    sources: [
      wiki(
        'Better than Revenge',
        'Better_than_Revenge',
        'song article: 2023 lyric change coverage',
      ),
      TV,
    ],
    dossier: {
      whyItMatters: [
        "Better Than Revenge is the album's pop-punk grudge match and, over time, its most relitigated track. Written at eighteen as a full-throttle takedown of a romantic rival, it reached No. 56 on the Hot 100 and went gold — but its chorus line about the other girl's reputation drew years of criticism from feminist writers who called it slut-shaming. Taylor addressed the writing herself in a 2014 Guardian interview: at eighteen you believe someone can actually steal your boyfriend, and you grow up and realize no one can take a person who does not want to leave.",
        "The 2023 re-recording turned that hindsight into the most talked-about lyric change of the entire Taylor's Version project. On Speak Now (Taylor's Version), released July 7, 2023, the notorious line was rewritten as a fire metaphor that spreads the blame to both parties. She has never publicly explained the change, and the reaction split — applause for the maturity on one side, purists mourning the teenage venom on the other — which made the edit itself a document of how she curates her younger self.",
      ],
      meaning: {
        confirmed: [
          'Taylor wrote it alone and produced it with Nathan Chapman; the pop-punk track peaked at No. 56 on the Hot 100 and was certified gold in 2014. In a 2014 Guardian interview she reflected that she was eighteen when she wrote it — the age when you think someone can actually take your boyfriend — and that growing up taught her otherwise.',
          "On Speak Now (Taylor's Version), released July 7, 2023, she rewrote the criticized chorus line into a metaphor of shared combustion; she has offered no public explanation for the change, and she has never named the song's subject.",
        ],
        supported: [
          'The original line was widely criticized as slut-shaming, and the 2023 revision was read as consistent with her stated view that judging women for their romantic choices is sexist; reaction to the edit split between praise for the growth and complaints that the song lost its teenage teeth.',
          'The rewrite also fits a documented pattern: she had softened a lyric in Picture to Burn early in her career, making Better Than Revenge the second time adult judgment revised a teenage grudge on the record.',
        ],
        fanTheories: [
          'The widely reported fan reading names actor Camilla Belle — who dated Joe Jonas shortly after Taylor did in 2008 — as the rival; Taylor has never confirmed any subject, and the attribution remains unverified speculation.',
        ],
      },
      connections: [
        {
          relatedId: 'song:mean',
          label: 'Mean',
          why: "The album's two fight songs, aged differently: Mean's grudge was vindicated with Grammys, Better Than Revenge's was retracted line by line.",
        },
        {
          relatedId: 'song:speak-now',
          label: 'Speak Now',
          why: 'Both cast another woman as the obstacle in a theatrical showdown — one plays it as caper, the other as vendetta, and only one got rewritten.',
        },
      ],
      sources: [
        {
          name: 'Better than Revenge — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Better_than_Revenge',
        },
        {
          name: 'Time: Will Taylor Swift Change the Lyrics to Better Than Revenge? (2023)',
          url: 'https://time.com/6291730/speak-now-better-than-revenge-lyrics/',
        },
      ],
    },
  },
  {
    slug: 'innocent',
    trackNumber: 11,
    trackTitle: 'Innocent',
    youtubeId: 'vO6JqQpJboY', // oEmbed-verified official Taylor Swift channel
    release: 'Speak Now',
    releaseDate: '2010-10-25',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Nathan Chapman'],
    note: 'Her formal response to the 2009 VMA interruption — debuted, deliberately, on the VMA stage one year later.',
    summary:
      'A pointedly gracious song extending forgiveness to the man who humiliated her on live TV: everyone is still growing, everyone can still be redeemed.',
    inspiration:
      'Confirmed response to Kanye West’s 2009 VMAs stage-crash; premiering it at the 2010 VMAs was the statement. The grace curdled after 2016, which is why fans read reputation as this song’s sequel-in-reverse.',
    themes: ['forgiveness', 'public grace', 'growing up in public'],
    sourceUrl: 'https://en.wikipedia.org/wiki/Innocent_(Taylor_Swift_song)',
    sources: [
      wiki(
        'Innocent (Taylor Swift song)',
        'Innocent_(Taylor_Swift_song)',
        'song article: VMA context',
      ),
      ALBUM,
    ],
    dossier: {
      whyItMatters: [
        "Innocent is the album's formal reply to the most-watched interruption in awards-show history. After Kanye West seized her microphone at the 2009 VMAs, the world expected a counterpunch; what Taylor wrote instead — over six months, far longer than her usual pace — was a song extending forgiveness, and she has said she deliberately wrote it to him rather than about him. The staging of its debut was the statement: September 12, 2010, on the VMA stage one year later, opening with footage of the incident itself before she sang, barefoot, about growth and redemption.",
        "It reached No. 27 on the Hot 100 on album release, but its real legacy is the argument it started. Reception split sharply between critics who heard rare public grace and those who found a twenty-year-old absolving a thirty-two-year-old patronizing. That fault line never healed — and after the events of 2016 re-poisoned the well between the two camps, the song's gentleness became one of the catalog's most debated time capsules.",
      ],
      meaning: {
        confirmed: [
          "Taylor wrote it alone and produced it with Nathan Chapman, in response to Kanye West's interruption of her acceptance speech at the 2009 MTV Video Music Awards — one of the few subjects in her catalog she publicly confirmed. It peaked at No. 27 on the Hot 100.",
          "She debuted it at the 2010 VMAs on September 12, 2010, in a performance that opened with footage of the previous year's incident; she said the song took her about six months to write and that she wanted to write it to him rather than about him.",
        ],
        supported: [
          'Reception split on arrival and stayed split: supporters heard sympathy and maturity, detractors found the framing condescending — a younger artist granting absolution to an older one — and both readings still circulate.',
          "The performance's staging did as much narrative work as the lyric: replaying the humiliation on the same stage before answering it framed the song as a public closing of the loop, on her terms.",
        ],
        fanTheories: [
          "After the 2016 feud reignited everything the song had forgiven, fans widely re-read the reputation era as this track's sequel-in-reverse — grace extended, then rescinded. The arc is a fan framing; Taylor has never described the songs that way herself.",
        ],
      },
      connections: [
        {
          relatedId: 'song:mean',
          label: 'Mean',
          why: "The album's two answers to public humiliation: Mean hits back with a grin, Innocent forgives with a straight face — and critics argued about both.",
        },
        {
          relatedId: 'song:back-to-december',
          label: 'Back to December',
          why: 'Companion studies in grace: one extends forgiveness she was never asked for, the other requests forgiveness she knows she may not get.',
        },
      ],
      sources: [
        {
          name: 'Innocent (Taylor Swift song) — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Innocent_(Taylor_Swift_song)',
        },
        {
          name: "CBS News: Taylor Swift's 'Innocent' at the 2010 VMAs Reflects on Kanye West Incident",
          url: 'https://www.cbsnews.com/news/taylor-swift-vmas-2010-innocent-lyrics-reflect-on-kanye-west-incident/',
        },
      ],
    },
  },
  {
    slug: 'haunted',
    trackNumber: 12,
    trackTitle: 'Haunted',
    youtubeId: '4cC6fw8EqWU', // oEmbed-verified official Taylor Swift channel
    release: 'Speak Now',
    releaseDate: '2010-10-25',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Nathan Chapman'],
    note: 'The album’s gothic centerpiece — live strings, minor keys, and a relationship dying in real time.',
    summary:
      'The panic of feeling someone slip away mid-conversation: she begs the connection to come back before the ghost of it moves in.',
    inspiration:
      'Swift described wanting the production to sound as chaotic as the moment of realizing someone is already gone.',
    themes: ['losing someone slowly', 'desperation', 'dread'],
    sourceUrl: 'https://en.wikipedia.org/wiki/Haunted_(Taylor_Swift_song)',
    sources: [
      wiki(
        'Haunted (Taylor Swift song)',
        'Haunted_(Taylor_Swift_song)',
        'song article: production intent',
      ),
      ALBUM,
    ],
  },
  {
    slug: 'last-kiss',
    trackNumber: 13,
    trackTitle: 'Last Kiss',
    youtubeId: 'idWma942CUI', // oEmbed-verified official Taylor Swift channel
    release: 'Speak Now',
    releaseDate: '2010-10-25',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Nathan Chapman'],
    note: 'The quietest devastation on Speak Now — a 1 a.m. autopsy of a breakup, down to remembered dates and doorway postures.',
    summary:
      'Grief in the present tense: she keeps the details (a first kiss timestamp, his jokes, his jacket) because the details are all that is left.',
    inspiration:
      'Fans widely link its specifics to the Jonas breakup timeline (unconfirmed by Swift); what is documented is Swift calling it one of the saddest songs she had written to that point.',
    themes: ['mourning a relationship', 'memory hoarding', 'letting go slowly'],
    fanLore:
      'Fan reading (unconfirmed): the July date referenced in the lyric matching a documented 2008 relationship timeline.',
    sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now',
    sources: [ALBUM],
    dossier: {
      whyItMatters: [
        "Last Kiss holds a title from the only critic whose superlatives are canon: in the Speak Now (Taylor's Version) prologue, Taylor named it the saddest song she has ever written. Track thirteen is the album's quietest devastation — grief conducted as inventory, a narrator cataloguing timestamps, gestures, and borrowed details because the details are all that survived the relationship. Introducing it as a surprise song in Kansas City on July 8, 2023, she told the crowd it was time to play it and cry.",
        'The song also built its own holiday. Its lyric fixes a memory to a specific July 9th, and fans turned the date into an annual observance — Last Kiss Day — trading the song every summer like a seasonal rite. The date is the engine of the muse speculation too, which the fandom has assembled entirely from circumstantial pieces; Taylor has never revealed the inspiration, which for a song this specific is its own kind of statement.',
      ],
      meaning: {
        confirmed: [
          "Taylor wrote it alone and produced it with Nathan Chapman; it is track thirteen on Speak Now, and in the Taylor's Version prologue she called it the saddest song she has ever written.",
          "She played it as an Eras Tour surprise song in Kansas City on July 8, 2023 — the eve of the lyric's July 9th — telling the audience it was time to play it and cry. She has never directly revealed the song's inspiration.",
        ],
        supported: [
          'The writing works by forensic specificity: dates, postures, small domestic habits recorded in the present tense, so the grief reads as an archive being kept rather than a wound being described.',
          "Fans turned the lyric's July 9th into an annual observance, resurfacing the song every summer — one of the clearest cases of the fandom building a calendar around a deep cut.",
        ],
        fanTheories: [
          "The long-standing fan attribution is Joe Jonas: a hidden liner-notes message reading forever and always, an intro fans time at 27 seconds to match the reported length of the 2008 breakup phone call, and a July 9, 2008 airport reunion that matches the lyric's date. Every piece is fan-assembled; Taylor has confirmed none of it.",
        ],
      },
      connections: [
        {
          relatedId: 'song:back-to-december',
          label: 'Back to December',
          why: "The album's two great griefs with opposite fault lines: December apologizes for the damage, Last Kiss just sits in it.",
        },
        {
          relatedId: 'song:haunted',
          label: 'Haunted',
          why: 'The same loss at two speeds — Haunted is the panic of feeling someone slip away mid-sentence, Last Kiss is the stillness after the door has closed.',
        },
      ],
      sources: [
        {
          name: 'Speak Now — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Speak_Now',
        },
        {
          name: 'PopCrush: Taylor Swift Reveals Her Saddest and Most Scathing Songs (2023)',
          url: 'https://popcrush.com/taylor-swift-saddest-most-scathing-wistfully-romantic-songs/',
        },
        {
          name: 'Nylon: What July 9, Last Kiss Day, Means for Taylor Swift Fans',
          url: 'https://www.nylon.com/entertainment/taylor-swift-july-9-last-kiss-day',
        },
      ],
    },
  },
  {
    slug: 'long-live',
    trackNumber: 14,
    trackTitle: 'Long Live',
    youtubeId: 'F5TMU6916U8', // oEmbed-verified official Taylor Swift channel
    release: 'Speak Now',
    releaseDate: '2010-10-25',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Nathan Chapman'],
    note: 'Her love letter to the band and the fans — the kings-and-queens victory lap that closes the standard album and still closes hearts at tours.',
    summary:
      'A toast to everyone who built the improbable early run with her: if it all ends tomorrow, remember how it felt to hold the crown together.',
    inspiration:
      'Swift confirmed it was written for her band, crew, and fans as a snapshot of the Fearless-era triumphs.',
    themes: ['gratitude', 'shared victory', 'legacy'],
    sourceUrl: 'https://en.wikipedia.org/wiki/Long_Live_(Taylor_Swift_song)',
    sources: [
      wiki(
        'Long Live (Taylor Swift song)',
        'Long_Live_(Taylor_Swift_song)',
        'song article: dedication background',
      ),
      ALBUM,
    ],
    dossier: {
      whyItMatters: [
        'Long Live closes the standard album with the first love song Taylor ever wrote to her own team. She has described it as being about her band, her producer, and the fans — everyone who built the improbable early run brick by brick — written like flipping through a photo album of award shows, stadium crowds, and hands in the air. On the Speak Now World Tour it was the nightly last song before the encore, a victory lap performed while the victory was still happening, and it returned to arenas through later tours and the Eras era after the 2023 re-recording.',
        'It also traveled farther than any other Speak Now deep cut. A bilingual version with Brazilian star Paula Fernandes, released as a digital single in Brazil on January 3, 2012, reached No. 5 on the Brasil Hot 100 Airplay chart and was certified quadruple diamond there — a kings-and-queens anthem crowned in a second language. The crown-and-kingdom imagery became durable fan shorthand for the whole bond between Taylor and her audience, the kind of song communities end up naming things after.',
      ],
      meaning: {
        confirmed: [
          'Taylor wrote it alone and produced it with Nathan Chapman; she dedicated the heartland-rock closer to her bandmates and fans, a celebration of the triumphs of her early career.',
          "A remix with Paula Fernandes featuring Portuguese-language verses was released as a digital single in Brazil on January 3, 2012 to promote the Speak Now World Tour live album; it reached No. 5 on the Brasil Hot 100 Airplay chart and earned a quadruple diamond certification in Brazil, and the two artists filmed a collaborative video pairing tour footage with Fernandes's studio performance.",
        ],
        supported: [
          "Critics praised the anthemic, cymbal-crashing production even where some found it generic; its real durability is ceremonial — the set-closing slot it held on the Speak Now World Tour and its return in later tours made it the catalog's designated curtain call.",
          'The song is pre-emptive nostalgia: a twenty-year-old writing the retrospective while still inside the moment, asking everyone in the room to remember the present tense.',
        ],
        fanTheories: [
          'Fans pair it with the 2023 vault track Castles Crumbling as mirror images — the same crown-and-kingdom imagery with opposite outcomes, triumph and collapse. The pairing is a fan and critical reading, not one Taylor has confirmed.',
        ],
      },
      connections: [
        {
          relatedId: 'song:castles-crumbling',
          label: 'Castles Crumbling',
          why: 'The fan-canonized shadow twin: Long Live holds the crown aloft, the vault track imagines the same kingdom turning on its ruler.',
        },
        {
          relatedId: 'song:mean',
          label: 'Mean',
          why: 'Cause and payoff: Mean promises a someday too big for the bullies to reach, Long Live throws the party when someday arrives.',
        },
      ],
      sources: [
        {
          name: 'Long Live (Taylor Swift song) — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Long_Live_(Taylor_Swift_song)',
        },
        {
          name: "Taste of Country: Taylor Swift and Paula Fernandes Team Up for 'Long Live' Video",
          url: 'https://tasteofcountry.com/taylor-swift-long-live/',
        },
      ],
    },
  },
  {
    slug: 'ours',
    trackNumber: 15,
    trackTitle: 'Ours',
    youtubeId: 'PH8Uc0Z_KRY', // oEmbed-verified official Taylor Swift channel
    release: 'Speak Now (Deluxe Edition)',
    releaseDate: '2010-10-25',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Nathan Chapman'],
    isSingle: true,
    note: 'The deluxe cut that earned a single release anyway — a shrug at everyone who disapproves, because the relationship belongs to exactly two people.',
    summary:
      'Defending an unglamorous, gossiped-about love: let people talk; what they think they see was never theirs to grade.',
    inspiration: null,
    themes: ['us against the world', 'privacy', 'contentment'],
    sourceUrl: 'https://en.wikipedia.org/wiki/Ours_(song)',
    sources: [wiki('Ours (song)', 'Ours_(song)', 'song article: single release'), ALBUM],
  },
  {
    slug: 'if-this-was-a-movie',
    trackNumber: 16,
    trackTitle: 'If This Was a Movie',
    youtubeId: '9wZEx9A8p9k', // oEmbed-verified official Taylor Swift channel
    release: 'Speak Now (Deluxe Edition)',
    releaseDate: '2010-10-25',
    writers: ['Taylor Swift', 'Martin Johnson'],
    producers: ['Taylor Swift', 'Nathan Chapman'],
    note: 'The only Speak Now-era co-write — with Boys Like Girls’ Martin Johnson — about waiting for the third-act reunion scene that real life keeps not delivering.',
    summary:
      'She knows exactly how the movie version ends: he comes back in the rain. The song is the ache of living in the unscripted version.',
    inspiration: null,
    themes: ['cinema versus reality', 'waiting', 'heartbreak logic'],
    easterEggs:
      "Its Taylor's Version was released in 2021 attached to the Fearless TV wave rather than with SNTV in 2023 — a catalog quirk fans still flag.",
    sourceUrl: 'https://en.wikipedia.org/wiki/If_This_Was_a_Movie',
    sources: [
      wiki(
        'If This Was a Movie',
        'If_This_Was_a_Movie',
        'song article: co-write and TV release quirk',
      ),
      ALBUM,
    ],
  },
  {
    slug: 'superman',
    trackNumber: 17,
    trackTitle: 'Superman',
    youtubeId: 'Fn0er7H1Dm0', // oEmbed-verified official Taylor Swift channel
    release: 'Speak Now (Deluxe Edition)',
    releaseDate: '2010-10-25',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Nathan Chapman'],
    note: 'A deluxe track about watching an impressive older man fly off to his important life — and quietly hoping to be the one he comes back to.',
    summary:
      'Hero worship with a bruise in it: he is dazzling and busy saving the world, and she is doing the un-dazzling work of waiting.',
    inspiration:
      'Fans widely file it in the same chapter as Dear John’s subject (unconfirmed by Swift); she has only said it began with the thought that a man leaving the room looked like a superhero departure.',
    themes: ['admiration', 'waiting', 'unequal orbits'],
    fanLore: 'Fan reading (unconfirmed): the Mayer-era attribution common in fan chronologies.',
    sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now',
    sources: [ALBUM],
  },
  {
    slug: 'electric-touch',
    trackNumber: 18,
    trackTitle: 'Electric Touch',
    youtubeId: 'hMPK2vNXr-E', // oEmbed-verified official Taylor Swift channel
    release: "Speak Now (Taylor's Version) — From The Vault",
    releaseDate: '2023-07-07',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Aaron Dessner'],
    isFromTheVault: true,
    note: 'The vault duet with Fall Out Boy — pop-punk royalty joining a song about the terror and thrill of a first date that could fix or wreck everything.',
    summary:
      'Two people with bad track records meet anyway: every past ending says run, the spark says stay.',
    inspiration:
      'Recorded with Fall Out Boy for the 2023 vault — a nod to the pop-punk influences all over the original Speak Now.',
    themes: ['second chances', 'first-date nerves', 'hope over history'],
    sourceUrl: 'https://en.wikipedia.org/wiki/Electric_Touch_(song)',
    sources: [
      wiki(
        'Electric Touch (song)',
        'Electric_Touch_(song)',
        'song article: Fall Out Boy collaboration',
      ),
      TV,
    ],
  },
  {
    slug: 'when-emma-falls-in-love',
    trackNumber: 19,
    trackTitle: 'When Emma Falls in Love',
    youtubeId: 'IYqgVYjN3Go', // oEmbed-verified official Taylor Swift channel
    release: "Speak Now (Taylor's Version) — From The Vault",
    releaseDate: '2023-07-07',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Aaron Dessner'],
    isFromTheVault: true,
    note: 'A piano portrait of a friend who loves carefully and completely — the vault song that launched a thousand which-Emma theories.',
    summary:
      'An admiring character study of a friend named Emma: how she falls, how she guards herself, and why the narrator wishes she were more like her.',
    inspiration:
      'Swift has said only that it is about a friend; fans overwhelmingly speculate Emma Stone (the two have a documented long friendship) — unconfirmed.',
    themes: ['friendship', 'admiration', 'how people love differently'],
    fanLore:
      'Fan reading (unconfirmed): the Emma Stone identification, based on the friendship timeline.',
    sourceUrl: 'https://en.wikipedia.org/wiki/When_Emma_Falls_in_Love',
    sources: [
      wiki(
        'When Emma Falls in Love',
        'When_Emma_Falls_in_Love',
        'song article: speculation coverage',
      ),
      TV,
    ],
  },
  {
    slug: 'i-can-see-you',
    trackNumber: 20,
    trackTitle: 'I Can See You',
    youtubeId: 'lVkKLf4DCn8', // oEmbed-verified official Taylor Swift channel
    release: "Speak Now (Taylor's Version) — From The Vault",
    releaseDate: '2023-07-07',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Jack Antonoff'],
    isFromTheVault: true,
    isSingle: true,
    note: 'The slinkiest thing in the Speak Now vault — with a heist-movie video starring Taylor Lautner, whose casting was its own reconciliation Easter egg.',
    summary:
      'A workplace-crush fantasy kept strictly behind the eyes — desire as a secret both people are pretending not to notice.',
    inspiration:
      'The 2023 video — Lautner and Joey King breaking a vault-imprisoned Swift out — is the documented meta-joke: liberating the old album, with an old flame helping.',
    themes: ['secret desire', 'restraint', 'tension'],
    easterEggs:
      'The video is one long vault metaphor: fans catalog its props as references to reclaiming the Speak Now masters.',
    sourceUrl: 'https://en.wikipedia.org/wiki/I_Can_See_You_(song)',
    sources: [
      wiki(
        'I Can See You (song)',
        'I_Can_See_You_(song)',
        'song article: video and single release',
      ),
      TV,
    ],
    dossier: {
      whyItMatters: [
        "I Can See You is the Speak Now vault's showpiece — not for the song alone, but for how Taylor released it. Instead of quietly dropping the video, she premiered it live from the stage on July 7, 2023, the night Speak Now (Taylor's Version) arrived, in the Kansas City stop of the Eras Tour. Musically it is the vault's outlier: a funk-and-surf-rock strut of distorted guitar and synth bass with almost nothing of the album's teenage country in it, which is exactly why critics kept singling it out.",
        "The video turned the whole re-recording project into a caper. Taylor directed it herself and cast a heist crew that read like a fan's dream footnote: Joey King and Presley Cash reprising the roles they played in the 2011 Mean video, and Taylor Lautner — the acknowledged subject of Back to December — helping break a vault-imprisoned Taylor out. Freeing the old album from a literal vault, with an old flame in on the job, is the masters-reclamation story told as slapstick, and the good-humored public reunion with Lautner became one of the Tour's most-replayed surprises.",
      ],
      meaning: {
        confirmed: [
          'A "From the Vault" track written in the original Speak Now era and left off the 2010 album, released on July 7, 2023 with Speak Now (Taylor\'s Version); Taylor wrote it alone and produced it with Jack Antonoff — a funk/rock departure from the record\'s country songwriting.',
          'Taylor directed the music video and premiered it live during the Eras Tour in Kansas City on the album\'s release day. Its cast acts out a heist to break her out of a vault — a play on reclaiming her masters — with Joey King and Presley Cash reprising their roles from the 2011 "Mean" video and Taylor Lautner, the confirmed subject of "Back to December," as part of the crew.',
        ],
        supported: [
          "Critics treated it as the standout of the vault batch — Billboard's Jason Lipshutz called it the best of the From the Vault tracks and argued it would have been an excellent addition to the original album — even as others found the retro-pop sound a step too far from Speak Now, and that split became part of its story.",
          'The video does the era\'s narrative work literally: casting an old collaborator and an old flame to break the artist out of a vault dramatizes the masters-reclamation project every re-recording is quietly about.',
        ],
        fanTheories: [
          "Fans catalog the video's props and beats as a running metaphor for reclaiming the Speak Now masters, and read the Lautner casting as the affectionate closing note to Back to December — a reconciliation the two have played entirely in public and in good humor. Taylor has framed the video as a celebration of the re-recording, not spelled out a prop-by-prop code, so the deeper reading stays a fan one.",
        ],
      },
      connections: [
        {
          relatedId: 'song:back-to-december',
          label: 'Back to December',
          why: "The vault video's headliner is the man Back to December apologizes to — the heist plays as the good-humored public coda to that song's private apology, a decade on.",
        },
        {
          relatedId: 'song:mean',
          label: 'Mean',
          why: 'Joey King and Presley Cash return as the same characters they played in the 2011 Mean video, quietly stitching the vault clip back into the era\'s own visual history.',
        },
        {
          relatedId: 'song:castles-crumbling',
          label: 'Castles Crumbling',
          why: 'Its sibling From the Vault track, unlocked on the same July 7, 2023 release day as part of the six-song Speak Now vault.',
        },
      ],
      sources: [
        {
          name: 'I Can See You (Taylor Swift song) — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/I_Can_See_You_(Taylor_Swift_song)',
        },
        {
          name: 'Mean (song) — Wikipedia (confirms the Joey King and Presley Cash roles reprised from the 2011 video)',
          url: 'https://en.wikipedia.org/wiki/Mean_(song)',
        },
      ],
    },
  },
  {
    slug: 'castles-crumbling',
    trackNumber: 21,
    trackTitle: 'Castles Crumbling',
    youtubeId: 'HtDriYDIhRs', // oEmbed-verified official Taylor Swift channel
    release: "Speak Now (Taylor's Version) — From The Vault",
    releaseDate: '2023-07-07',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Jack Antonoff'],
    isFromTheVault: true,
    note: 'A duet with Paramore’s Hayley Williams about fearing the fall from grace — written in the Speak Now era, its dread of a turning public an eerie pre-echo of the 2016 pile-on.',
    summary:
      'A ruler watches the kingdom turn: cheers becoming jeers, and the terror of disappointing everyone who once chanted your name. A piano-driven emo/indie-folk ballad produced by Swift with Jack Antonoff (mixed by Serban Ghenea, mastered by Randy Merrill), it was one of the release’s most-discussed vault cuts — debuting at No. 31 on the Billboard Hot 100 and No. 30 on the Global 200 the week Speak Now (Taylor’s Version) put all its songs on the chart (July 2023). Fans read it as Long Live’s shadow twin (a fan reading, not one Swift has confirmed).',
    inspiration:
      'Written in the Speak Now era about fame anxiety and recorded fourteen years later with Hayley Williams. Swift, announcing the vault track, credited Williams as an influence on her Speak Now songwriting — the basis she gave for choosing her as the duet partner; Williams told Coup de Main she was grateful for a song she felt “portrayed an experience that both she and Swift went through.” (The corpus previously called them “friends since their teens,” which no source supports — corrected here.) When in the era it was written, and why it was cut from the 2010 album, are not documented in Swift’s own statements.',
    themes: ['fame anxiety', 'fall from grace', 'public disappointment'],
    easterEggs:
      'Fans read it as the shadow twin of “Long Live” — same castle imagery, opposite outcome (cheers curdling to jeers) — but that mirror is a fan/critical reading, not one Swift has confirmed. Live history: performed only twice on the Eras Tour — a solo surprise-song debut in Santa Clara (July 28, 2023) and a London night on June 23, 2024 where Hayley Williams walked out to sing it with her in person.',
    sourceUrl: 'https://en.wikipedia.org/wiki/Castles_Crumbling',
    sources: [
      wiki(
        'Castles Crumbling',
        'Castles_Crumbling',
        'song article: collaboration, charts, production, reception, live history',
      ),
      TV,
      {
        source_url:
          'https://www.billboard.com/music/chart-beat/taylor-swift-speak-now-taylors-version-all-songs-hot-100-debut-1235373016/',
        source_title:
          "Taylor Swift's 'Speak Now (Taylor's Version)' Debuts All Songs on the Hot 100",
        publisher: 'Billboard',
        source_type: 'chart_database',
        accessed_at: '2026-07-28',
        reliability_score: 4,
        notes: '"Castles Crumbling" debuted at No. 31 on the Hot 100 (chart dated July 22, 2023)',
      },
      {
        source_url:
          'https://www.billboard.com/lists/taylor-swift-speak-now-taylors-version-vault-songs-ranked/',
        source_title:
          "Every 'From The Vault' Song Ranked on Taylor Swift's 'Speak Now (Taylor's Version)'",
        publisher: 'Billboard',
        source_type: 'reputable_press',
        accessed_at: '2026-07-28',
        reliability_score: 4,
        notes: 'Reception of the vault cuts, including the Williams duet',
      },
    ],
    dossier: {
      whyItMatters: [
        "Castles Crumbling is the Speak Now vault's marquee duet — the first recorded collaboration between Taylor and Paramore's Hayley Williams, a song written in the original Speak Now era around 2010 and held back for thirteen years before the 2023 re-recording finally opened it. It debuted at No. 31 on the Hot 100 and No. 30 on the Global 200, and reached No. 13 on Hot Country Songs — Williams's first appearance on that chart, on a duet neither of them could have released at the time.",
        'Its subject is fame\'s vertigo: a ruler watching cheers curdle into jeers, sick with guilt about power going to her head and terrified of disappointing the crowd that built the kingdom. Written by a young star before the 2016 pile-on, its dread reads in hindsight like a prophecy — critics noted the same "castle crumbled overnight" image opens reputation\'s "Call It What You Want," so a teenage anxiety turned out to sketch the downfall narrative an entire later era would inhabit.',
      ],
      meaning: {
        confirmed: [
          'A "From the Vault" track written in the original Speak Now era and released on July 7, 2023 as track 21 of Speak Now (Taylor\'s Version), featuring Paramore\'s Hayley Williams — Taylor\'s first recorded collaboration with her. Taylor wrote it alone and produced it with Jack Antonoff; it debuted at No. 31 on the Hot 100, No. 30 on the Global 200, and No. 13 on Hot Country Songs, Williams\'s first entry on that chart.',
          'Taylor has said she chose Williams because Williams influenced her songwriting in the Speak Now era; Williams told Coup de Main she was grateful for a song she felt "portrayed an experience that both she and Swift went through." Taylor debuted it as a solo surprise song in Santa Clara on July 28, 2023, and Williams joined her to sing it in person in London on June 23, 2024.',
        ],
        supported: [
          'Rolling Stone read the track less as a literal reputation prophecy than as of a piece with "Innocent" — a gauzy survey of a ruined personal landscape shadowed by the 2009 VMAs fallout — while other outlets prized the vocal interplay, calling it a duet built on two voices wrestling with the same fear that the cheers might one day turn.',
          'The most-remarked link is forward: reputation\'s "Call It What You Want" opens on the same "castle crumbled overnight" image this song lives inside, and fans and press treat Castles Crumbling as the early sketch of a downfall narrative Taylor would only inhabit years later.',
        ],
        fanTheories: [
          "Fans pair it with Long Live as mirror images — the same crown-and-kingdom imagery pointed in opposite directions, triumph and collapse, written into the same album fourteen years apart. The mirror is a fan-and-critical reading, not one Taylor has confirmed.",
        ],
      },
      connections: [
        {
          relatedId: 'song:long-live',
          label: 'Long Live',
          why: 'Its fan-canonized shadow twin: Long Live holds the crown aloft while Castles Crumbling imagines the same kingdom turning on its ruler — same castle imagery, opposite ending.',
        },
        {
          relatedId: 'song:call-it-what-you-want',
          label: 'Call It What You Want',
          why: 'The clearest textual callback in the catalog — reputation opens "Call It What You Want" on the exact "castle crumbled overnight" image this Speak Now-era song is built around.',
        },
        {
          relatedId: 'song:electric-touch',
          label: 'Electric Touch',
          why: 'Its sibling From the Vault track — another 2010 song finished in 2023 with a guest Taylor credits as a Speak Now-era influence (Fall Out Boy), the same basis she gave for the Williams pairing.',
        },
      ],
      sources: [
        {
          name: 'Castles Crumbling — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Castles_Crumbling',
        },
        {
          name: "BuzzFeed News: What Taylor Swift's Vault Track 'Castles Crumbling' Is About (Stephanie Soteriou, 2023)",
          url: 'https://www.buzzfeednews.com/article/stephaniesoteriou/taylor-swift-castles-crumbling-about-kanye-vmas-reputation',
        },
      ],
    },
  },
  {
    slug: 'foolish-one',
    trackNumber: 22,
    trackTitle: 'Foolish One',
    youtubeId: '6-x1AlDudZw', // oEmbed-verified official Taylor Swift channel
    release: "Speak Now (Taylor's Version) — From The Vault",
    releaseDate: '2023-07-07',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Aaron Dessner'],
    isFromTheVault: true,
    note: 'The vault’s self-aware spiral — narrating her own delusion about a man who is never going to call, in real time.',
    summary:
      'She lectures herself mid-daydream: stop reading into the crumbs, stop planning the wedding — and then keeps doing both.',
    inspiration: null,
    themes: ['self-delusion', 'waiting by the phone', 'hard truths'],
    sourceUrl: "https://en.wikipedia.org/wiki/Speak_Now_(Taylor's_Version)",
    sources: [TV],
  },
  {
    slug: 'timeless',
    trackNumber: 23,
    trackTitle: 'Timeless',
    youtubeId: 'osmzwWw4RYM', // oEmbed-verified official Taylor Swift channel
    release: "Speak Now (Taylor's Version) — From The Vault",
    releaseDate: '2023-07-07',
    writers: ['Taylor Swift'],
    producers: ['Taylor Swift', 'Jack Antonoff'],
    isFromTheVault: true,
    note: 'The vault closer built from an antique-shop box of strangers’ photographs — love stories she reverse-engineered from other people’s snapshots.',
    summary:
      'Flipping through old photos of couples who survived wars and disapproval, she decides she would have found the same person in any century.',
    inspiration:
      'The antique-store photograph conceit is in the song’s own framing; the lyric-video treatment leaned on vintage imagery to match.',
    themes: ['fated love', 'history', 'love across eras'],
    sourceUrl: "https://en.wikipedia.org/wiki/Speak_Now_(Taylor's_Version)",
    sources: [TV],
  },
];

export default {
  eraSlug: 'speak-now',
  tracks: TRACKS,
};
