// Vault track guide — Lover era (Lover, 2019). Original prose only — never
// lyrics; unconfirmed readings are labeled. Provenance per
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
  'Lover (album)',
  'Lover_(album)',
  'album article: release facts, credits, and cited interviews',
);

const ERA = {
  eraSlug: 'lover',
  tracks: [
    {
      slug: 'i-forgot-that-you-existed',
      trackNumber: 1,
      trackTitle: 'I Forgot That You Existed',
      youtubeId: 'p1cEvNn88jM', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Louis Bell', 'Frank Dukes'],
      producers: ['Taylor Swift', 'Louis Bell', 'Frank Dukes'],
      note: 'The giggling epilogue to reputation — not love, not hate, just indifference, which turns out to be the real revenge.',
      summary:
        'She opens the pastel album by closing the black-and-white one: the grudges got heavy, so she put them down and forgot the people attached to them.',
      inspiration: null,
      themes: ['indifference as freedom', 'closing a chapter', 'lightness'],
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Forgot_That_You_Existed',
      sources: [
        wiki('I Forgot That You Existed', 'I_Forgot_That_You_Existed', 'song article: composition'),
        ALBUM,
      ],
    },
    {
      slug: 'cruel-summer',
      trackNumber: 2,
      trackTitle: 'Cruel Summer',
      youtubeId: 'ic8j13piAhQ', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Jack Antonoff', 'Annie Clark'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      singleReleaseDate: '2023-06-20',
      note: 'Co-written with St. Vincent, denied a planned 2020 single run by the pandemic — then screamed nightly on the Eras Tour until it hit No. 1 four years late.',
      summary:
        'A secret summer romance conducted through garden gates and bad decisions, with the catalog’s most famous bridge-yell about blurting out love. Its 2023 chart-topping resurrection is the great fan-willed correction.',
      inspiration:
        'Widely tied by fans to the guarded start of her late-2016 relationship (unconfirmed); the documented story is the fan campaign that forced its single release in 2023.',
      themes: ['secret love', 'desperation under cool', 'delayed victory'],
      easterEggs:
        'The bridge became the Eras Tour’s loudest nightly scream-along — a documented live phenomenon of the 2023 shows.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Cruel_Summer_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Cruel Summer (Taylor Swift song)',
          'Cruel_Summer_(Taylor_Swift_song)',
          'song article: St. Vincent credit and 2023 single run',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "One of Swift's biggest songs and the catalog's defining 'fan-willed correction.' A 2019 Lover deep cut that was never a single at release, it climbed to No. 1 on the Billboard Hot 100 four years later — the chart dated October 28, 2023 — after fans screamed its bridge nightly on the Eras Tour and Republic finally issued it as a single on June 20, 2023. It was her 10th Hot 100 leader and the first Lover track to top the chart, completing one of the longest debut-to-No. 1 journeys in the chart's history (it had first entered at No. 29 in September 2019).",
          "The 2023 run turned it into her longest-charting Hot 100 hit ever, at 54 weeks on the survey, with four (non-consecutive) weeks at No. 1 and 34 weeks in the top 10; on Billboard's Radio Songs chart it reigned 12 weeks, her longest-ruling single there.",
        ],
        meaning: {
          confirmed: [
            "Written by Swift with Jack Antonoff and Annie Clark (St. Vincent) during the Lover sessions; Swift and Antonoff produced it and St. Vincent contributed guitar. The 'ranting' bridge runs over skittering synths with Swift's vocal put through a vocoder — a distorted texture rare in her catalog.",
            "Swift confirmed the long-rumored shelved single herself: at the Eras Tour's Pittsburgh show on June 17, 2023 she said she had 'intended to release Cruel Summer as a single in 2020' but abandoned the plan when the pandemic hit and pivoted to folklore instead.",
            "Swift has described the song as an uncertain summer romance, about 'yearning for something that you don't quite have yet' — a general statement of theme rather than a named subject.",
          ],
          fanTheories: [
            "Fans widely tie the song to the guarded early days of the relationship that began in late 2016. Swift has never confirmed a specific subject, so that romantic read stays interpretation, not fact.",
          ],
        },
        live: [
          {
            date: "March 17, 2023",
            event: "The Eras Tour opening night — Glendale, AZ (State Farm Stadium)",
            note: "'Cruel Summer' has been the second song of every Eras Tour show from opening night, launching the Lover act. The nightly bridge scream-along became the documented ritual that drove the 2023 single release and the song's chart resurrection — so the scream has an origin point (the tour's start), not a later mid-run one.",
          },
        ],
        connections: [
          {
            relatedId: "moment:vault-lover-lover-the-first-album-shes-ever-owned",
            label: "Lover: the first album she's ever owned",
            why: "Cruel Summer was buried on Lover as a deep cut; its 2023 No. 1 is the belated smash the album never got at release, and the clearest proof of the record's long streaming tail.",
          },
        ],
        sources: [
          {
            name: "Cruel Summer (Taylor Swift song) — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Cruel_Summer_(Taylor_Swift_song)",
          },
          {
            name: "Taylor Swift's 'Cruel Summer' Hits No. 1 on Billboard Hot 100, Becoming Her 10th Leader — Billboard",
            url: "https://www.billboard.com/music/chart-beat/taylor-swift-cruel-summer-number-one-hot-100-1235452093/",
          },
          {
            name: "Taylor Swift's 'Cruel Summer' Is Now Her Longest-Charting Hot 100 Hit — Billboard",
            url: "https://www.billboard.com/music/chart-beat/taylor-swift-cruel-summer-longest-chart-hot-100-hit-1235687637/",
          },
        ],
      },
    },
    {
      slug: 'lover',
      trackNumber: 3,
      trackTitle: 'Lover',
      youtubeId: '-BjZmE2gtdo', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      singleReleaseDate: '2019-08-16',
      note: 'The solo-written title track — a first-dance waltz with its own vows in the bridge, written in one night at a piano.',
      summary:
        'Domesticity as romance: leaving the Christmas lights up, guest lists, borrowed heartbeats — a love song built to be slow-danced to at weddings indefinitely.',
      inspiration:
        'Swift has described writing it alone at the piano and knowing immediately it was the album’s center; the bridge is structured as a mock wedding toast.',
      themes: ['commitment', 'domestic magic', 'vows'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Lover_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Lover (Taylor Swift song)',
          'Lover_(Taylor_Swift_song)',
          'song article: writing and release',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'the-man',
      trackNumber: 4,
      trackTitle: 'The Man',
      youtubeId: 'AqAJLh9wuZ0', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Joel Little'],
      producers: ['Taylor Swift', 'Joel Little'],
      singleReleaseDate: '2020-01-27',
      note: 'The double-standards thought experiment — every criticism of her career re-run with the genders flipped, plus the video where she disappeared into prosthetics as a swaggering man.',
      summary:
        'If she partied, dated, and hustled identically as a man, the same behavior would read as legend, not liability. The self-directed video (with a Dwayne Johnson voice cameo) made the argument literal.',
      inspiration:
        'Swift confirmed the premise directly in interviews: an inventory of the gendered coverage she had absorbed for a decade, itemized.',
      themes: ['sexist double standards', 'ambition', 'perception'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Man_(Taylor_Swift_song)',
      sources: [
        wiki(
          'The Man (Taylor Swift song)',
          'The_Man_(Taylor_Swift_song)',
          'song article: video and intent',
        ),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "Swift's blunt double-standards thought experiment — and the launchpad of her directing career. Its self-directed music video was her first solo directorial credit and won Best Direction at the 2020 MTV VMAs, making her the first solo woman to win that category; the clip was also nominated for Video of the Year and Video for Good, took an MTV EMA Best Video nod, and earned a 2021 Webby nomination.",
          "Released as Lover's fifth single on January 27, 2020, it peaked at No. 23 on the Billboard Hot 100 and No. 9 on Adult Pop Songs (No. 20 Pop Airplay, No. 21 Adult Contemporary), and is certified Platinum by the RIAA — 5x Platinum in Australia (ARIA) and Platinum in the UK (BPI). Critics split on the song itself: Rolling Stone's Rob Sheffield called it a 'righteous feminist bombshell,' while others (e.g. Spin) judged the central thesis too on-the-nose.",
        ],
        meaning: {
          confirmed: [
            "Co-written and co-produced by Swift and Joel Little — one of his four Lover cuts, alongside 'ME!', 'You Need to Calm Down' and 'Miss Americana & the Heartbreak Prince.' Swift has framed the song as an inventory of the gendered coverage she absorbed for a decade: re-run her career verbatim as a man and the same behavior reads as legend rather than liability.",
            "The self-directed video is a masters-dispute cipher: subway walls are tagged with her album titles (her back catalog), a missing-person poster reads 'return to Taylor Swift,' and the end credits pointedly bill Taylor Swift as director, owner and star. 'Tyler Swift' is her male alter-ego — named on an in-video poster for a fake documentary 'Mr. Americana,' a gender-flip of her Netflix film Miss Americana — not, as sometimes reported, a literal 'directed by Tyler Swift' credit.",
            "The 'Tyler' transformation was led by Oscar-winning makeup artist Bill Corso and took roughly four to six hours to apply (about ten prosthetic pieces plus a muscle suit). Dwayne Johnson voices 'the man'; Swift's father, Scott Swift, cameos as the tennis umpire whose bad call triggers Tyler's on-court meltdown, alongside TikTok stars Loren Gray and Dominic Toliver and actress Jayden Bartels.",
          ],
          fanTheories: [
            "A red 'No Scooters' traffic sign at the video's (13th Street) subway set is widely read as a jab at Scooter Braun, who then controlled her masters. Swift has never confirmed the reference, so it stays fan reading rather than documented fact.",
          ],
        },
        live: [
          {
            date: "November 24, 2019",
            event: "47th American Music Awards (Artist of the Decade medley)",
            note: "Performed within her Artist-of-the-Decade medley. She had also debuted the song at the one-off City of Lover show in Paris on September 9, 2019, later released as 'The Man (Live from Paris)' in February 2020. No standalone 2020 awards-set performance is documented — the '2020' association is that Paris live release.",
          },
          {
            date: "2023–2024",
            event: "The Eras Tour — Lover act",
            note: "A fixture of the show's opening Lover section, staged in a corporate office-cubicle set with Taylor in an oversized silver sequined blazer backed by dancers.",
          },
        ],
        connections: [
          {
            relatedId: "song:mad-woman",
            label: "mad woman",
            why: "folklore's structurally identical double-standard, aimed at anger instead of ambition: both re-run a woman's behavior through a gendered lens and show it judged differently than a man's would be.",
          },
          {
            relatedId: "song:you-need-to-calm-down",
            label: "You Need to Calm Down",
            why: "Its Lover sibling and fellow Joel Little co-write — the album's other overt public-statement single (LGBTQ+ allyship), released months earlier in the same rollout.",
          },
        ],
        sources: [
          {
            name: "The Man (Taylor Swift song) — Wikipedia",
            url: "https://en.wikipedia.org/wiki/The_Man_(Taylor_Swift_song)",
          },
          {
            name: "Taylor Swift Wins Best Direction at 2020 MTV VMAs — MTV",
            url: "https://www.mtv.com/news/obwt32/taylor-swift-the-man-vma-best-direction",
          },
          {
            name: "Taylor Swift's Dad Scott Makes a Cameo in 'The Man' — Billboard",
            url: "https://www.billboard.com/music/pop/taylor-swift-dad-the-man-behind-the-scenes-9339686/",
          },
          {
            name: "How Taylor Swift Transformed Into a Man for 'The Man' (Bill Corso) — Rolling Stone",
            url: "https://www.rollingstone.com/music/music-news/taylor-swift-the-man-music-video-makeup-959829/",
          },
          {
            name: "Taylor Swift 'Lover': The Complete Album Credits — The FADER",
            url: "https://www.thefader.com/2019/08/23/taylor-swift-lover-full-album-credits",
          },
        ],
      },
    },
    {
      slug: 'the-archer',
      trackNumber: 5,
      trackTitle: 'The Archer',
      youtubeId: '8KpKc3C9V3w', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isSingle: true,
      note: 'Track 5, released early precisely because fans knew what that slot means — one synth pulse, no chorus, all confession.',
      summary:
        'She has been the hunter and the target, and now wonders who could stay through both. The absence of a drop is the point: nothing resolves, including her.',
      inspiration:
        'Swift acknowledged the track-5 tradition around this release — the first time the fan observation became official canon.',
      themes: ['self-doubt', 'attachment anxiety', 'who could ever leave or stay'],
      easterEggs:
        'Its early promo release is the moment the track-5 vulnerability tradition went from fan theory to confirmed convention.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Archer_(song)',
      sources: [
        wiki('The Archer (song)', 'The_Archer_(song)', 'song article: track-5 context'),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "As Lover's track five — a slot Swift has repeatedly made her most emotionally exposed song per album — 'The Archer' interrupts the record's bright, romantic optimism with a moment of raw self-scrutiny. It matters to the Lover era because it complicates the album's 'love letter to love' framing, showing Swift questioning whether she is capable of being loved well given her own patterns of self-sabotage.",
          "Critically, the song marked a stylistic pivot within Lover itself: after the bright, hook-driven singles 'Me!' and 'You Need to Calm Down,' its minimalist, synth-laden production (with Jack Antonoff) signaled a more contemplative sound, drawing comparisons to the confessional intimacy of 'All Too Well' and foreshadowing the introspective folklore/evermore era that followed."
        ],
        meaning: {
          confirmed: [
            "Swift co-wrote and co-produced the song with Jack Antonoff, her longtime collaborator on 1989 and Reputation.",
            "The bridge interpolates language from the nursery rhyme 'Humpty Dumpty,' explicitly invoking the image of being broken and unable to be put back together."
          ],
          supported: [
            "Critics and Wikipedia's lyrical analysis describe the song as Swift reflecting on her own past mistakes and interrogating her identity and public persona, rather than addressing a single relationship or person.",
            "The chorus line 'I've been the archer, I've been the prey' has been read by critics as reflecting both Swift's romantic relationships and her fraught relationship with fame and public controversy, casting her as simultaneously aggressor and victim in her own narrative.",
            "Variety's Chris Willman described the song's self-awareness as 'startling and sober,' and American Songwriter's Alex Hopper called it 'a meandering late-night thought' that poses introspective questions without resolving them, a reading widely echoed by other critics as the song's defining quality.",
            "Slant Magazine and other outlets noted tension between the song's melancholy, minimalist production and the emotional violence of its lyrics, which critics said let Swift escalate intensity through restraint rather than bombast."
          ]
        },
        connections: [
          { relatedId: "song:all-too-well", label: "All Too Well", why: "Critics drew direct comparisons between the two songs' intimate, confessional lyricism, both stripping back Swift's pop instincts for raw emotional detail." },
          { relatedId: "song:mirrorball", label: "mirrorball", why: "Both songs turn inward on Swift's anxiety about being seen and loved, questioning whether her self-presentation is sustainable or genuine." },
          { relatedId: "song:karma", label: "Karma", why: "Wikipedia lists the two as related tracks; where 'The Archer' is consumed by self-doubt and fear of being unlovable, 'Karma' answers years later with hard-won self-assurance." },
          { relatedId: "song:this-is-me-trying", label: "this is me trying", why: "Both songs candidly admit to personal failure and self-sabotage, with Swift acknowledging she has driven people away despite her efforts to change." }
        ],
        sources: [
          { name: "The Archer (song) - Wikipedia", url: "https://en.wikipedia.org/wiki/The_Archer_(song)" },
          { name: "Behind the Meaning of Taylor Swift's Introspective 'The Archer' - American Songwriter", url: "https://americansongwriter.com/behind-the-meaning-of-taylor-swifts-introspectivethe-archer/" },
          { name: "Taylor Swift's 'The Archer' Lyrics Are A Raw Look At Her Struggles With Friends And Relationships - Elle", url: "https://www.elle.com/culture/music/amp28485527/taylor-swift-the-archer-lyrics-meaning/" },
          { name: "Taylor Swift's new single, 'Archer', is Swift at her most intimate and vulnerable - Vox", url: "https://www.vox.com/culture/2019/7/24/20708383/taylor-swift-archer-lover-track-five" }
        ]
      },
    },
    {
      slug: 'i-think-he-knows',
      trackNumber: 6,
      trackTitle: 'I Think He Knows',
      youtubeId: '2d1wKn-oJnA', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The strutting deep cut with the 16th Avenue nod to Nashville — confidence borrowed from a partner who does not need telling.',
      summary:
        'A crush on someone fully aware of his own charm: she narrates the electricity while admitting he already knows all of it.',
      inspiration: null,
      themes: ['mutual attraction', 'confidence', 'flirtation'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Lover_(album)',
      sources: [ALBUM],
      dossier: {
        whyItMatters: [
          "A Jack Antonoff-produced funk-pop strut and fan-favorite Lover deep cut, built on what Swift called 'quiet confidence' — a partner sure of himself without arrogance. Its 'Sixteenth Avenue' line is a confirmed nod to Nashville, giving a flirty groove a hometown-songwriting anchor.",
          "As an album cut it entered the Billboard Hot 100 at No. 51 (chart dated September 7, 2019), part of Lover's record week when all 18 tracks charted the Hot 100 at once. It carries no verifiable standalone RIAA certification. Long assumed a never-played deep cut, it finally debuted live as an Eras Tour surprise song in 2023.",
        ],
        meaning: {
          confirmed: [
            "Written and produced by Swift and Jack Antonoff, recorded at Electric Lady Studios (New York) and Conway Recording Studios (Los Angeles) with the album's core team — recording engineer Laura Sisk, mixed by Serban Ghenea. At the album's release-party interview Swift described the song as playing with the idea of 'quiet confidence.'",
            "The 'Sixteenth Avenue' lyric is a confirmed reference to Nashville's Music Row (16th Avenue South, 'Songwriters' Row'): Swift said she named the real street where she used to write songs — 'so if you're wondering if I just picked a random number, I didn't.' A '16th Avenue' street sign even teased in the 'You Need to Calm Down' video ahead of the album.",
            "Its Antonoff-sibling kinship is documented rather than inferred: 'I Think He Knows,' 'Paper Rings' and 'London Boy' share the same writer/producer (Swift with Jack Antonoff) and the same Electric Lady/Conway sessions, so the production DNA across Lover's giddy pop half is a fact even where the songs' shared subject is not. (One correction to a common grouping: 'The Man' is a Joel Little co-write, not an Antonoff cut, so it is a thematic cousin here but not a production sibling.)",
          ],
          fanTheories: [
            "The 'he' is widely read as the same partner threaded through Lover's love songs ('Lover,' 'Paper Rings,' 'London Boy,' 'Cornelia Street'), but Swift has never named a single subject across the album on the record — treat that as interpretation, not fact.",
            "Left open, not fabricated: the exact writing/recording date and any Swift or Antonoff quote about the funk-pop groove itself are undocumented, and the stacked outro 'I think he knows' vocal-harmony breakdown and finger-snap percussion are not individually credited to a named arranger or player — so the page attributes neither.",
          ],
        },
        live: [
          {
            date: "May 21, 2023",
            event: "The Eras Tour surprise song — Foxborough, MA (Gillette Stadium)",
            note: "Live debut, nearly four years after release; played on guitar because the piano had been rain-damaged the night before. Lover never got its own tour (Lover Fest was cancelled by the pandemic), so the song's live life has come entirely through Eras surprise slots.",
          },
          {
            date: "May 17, 2024",
            event: "The Eras Tour — Stockholm",
            note: "Returned as an 'I Think He Knows' / 'Gorgeous' surprise-song mashup.",
          },
        ],
        connections: [
          {
            relatedId: "song:paper-rings",
            label: "Paper Rings",
            why: "Its giddiest Antonoff-produced Lover sibling — both are up-tempo, all-in love songs cut in the same sessions, the album's pop-half sugar rush.",
          },
          {
            relatedId: "song:london-boy",
            label: "London Boy",
            why: "The other bouncy Antonoff love song on Lover's pop half, same writer/producer and studios — a reader charmed by one strut wants the other.",
          },
        ],
        sources: [
          {
            name: "Lover (album) — Wikipedia (credits and personnel)",
            url: "https://en.wikipedia.org/wiki/Lover_(album)",
          },
          {
            name: "I Think He Knows — Songfacts (Swift's 'quiet confidence' / 16th Avenue)",
            url: "https://www.songfacts.com/facts/taylor-swift/i-think-he-knows",
          },
          {
            name: "Taylor Swift's 'Lover': Album Review (16th Avenue / Music Row) — Variety",
            url: "https://variety.com/2019/music/news/taylor-swift-lover-album-review-1203311445/",
          },
          {
            name: "Every Song From Taylor Swift's 'Lover' That Charted on the Hot 100 — Billboard",
            url: "https://www.billboard.com/pro/every-song-taylor-swift-lover-charts-hot-100/",
          },
          {
            name: "Every Taylor Swift Eras Tour Surprise Song — TODAY",
            url: "https://www.today.com/popculture/music/eras-tour-surprise-songs-rcna141380",
          },
        ],
      },
    },
    {
      slug: 'miss-americana-and-the-heartbreak-prince',
      trackNumber: 7,
      trackTitle: 'Miss Americana & the Heartbreak Prince',
      youtubeId: 'Kwf7P2GNAVw', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Joel Little'],
      producers: ['Taylor Swift', 'Joel Little'],
      note: 'High-school Americana as national allegory — the homecoming-queen imagery is confirmed political disillusionment in a letterman jacket.',
      summary:
        'A dance at a school where the scoreboard is rigged: Swift confirmed the marching-band metaphor is about watching American politics curdle post-2016 and deciding to speak anyway.',
      inspiration:
        'Confirmed: Swift said it channels her disillusionment with U.S. politics through a high-school lens — written around the period covered by the Miss Americana documentary.',
      themes: ['political awakening', 'disillusionment', 'american pageantry'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Miss_Americana_%26_the_Heartbreak_Prince',
      sources: [
        wiki(
          'Miss Americana & the Heartbreak Prince',
          'Miss_Americana_%26_the_Heartbreak_Prince',
          'song article: confirmed political reading',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'paper-rings',
      trackNumber: 8,
      trackTitle: 'Paper Rings',
      youtubeId: '8zdg-pDF10g', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The wedding-band-optional stomp — the album’s thesis that the paperwork matters infinitely less than the person.',
      summary:
        'She would marry this one with rings cut from paper: giddy pop-punk about wanting the whole boring, glorious package after years of gilded drama.',
      inspiration: null,
      themes: ['joyful commitment', 'substance over ceremony', 'giddiness'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Paper_Rings',
      sources: [wiki('Paper Rings', 'Paper_Rings', 'song article: composition'), ALBUM],
    },
    {
      slug: 'cornelia-street',
      trackNumber: 9,
      trackTitle: 'Cornelia Street',
      youtubeId: 'VikHHWrgb4Y', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'Solo-written and named for the real West Village street where she rented a townhouse — the address that would become unlivable if this love ever died.',
      summary:
        'Memory pinned to geography: if it ends, the whole street gets amputated from her map. Fans treat the actual Cornelia Street as a pilgrimage site because of it.',
      inspiration:
        'Literal, not metaphorical: Swift rented a townhouse on the real Cornelia Street in the West Village in 2016 (while her own TriBeCa home was renovated), documented by NYC property reporting. The romantic subject is read as her relationship’s early days but is not tied to a named person on the record.',
      themes: ['memory and place', 'fear of loss', 'superstition'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Cornelia_Street',
      sources: [
        wiki('Cornelia Street (song)', 'Cornelia_Street', 'song article: NYC background'),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "A solo-written Lover ballad that pins a whole relationship to a single New York address — and one of the rare Swift titles that is literal reportage rather than metaphor: she really did live on Cornelia Street. Fans treat the West Village block as a pilgrimage site, and the song became one of the Eras Tour's most-wanted surprise songs.",
        ],
        meaning: {
          confirmed: [
            "Swift is the sole writer and co-produced the track with Jack Antonoff. The title is literal: in 2016 Swift rented a townhouse at 23 Cornelia Street in Manhattan's West Village while her own TriBeCa home was being renovated, living there into 2017 (widely documented in NYC property reporting, including when the townhouse was later listed for sale). Keeping to the street/city level she herself made public via the title.",
            "Though never issued as a single, 'Cornelia Street' charted on Lover's release week on streaming strength — No. 57 on the Billboard Hot 100, No. 51 in Canada and No. 40 on Australia's ARIA chart — and is certified Platinum in Australia, Brazil and New Zealand and Silver in the UK. Critics singled it out as a Lover high point: Rolling Stone's Rob Sheffield read it as evidence of her songwriting maturity, Slate's Carl Wilson called it the album's best, and Pitchfork's Anna Gaca praised it as 'a lovely, understated tribute to memory and nostalgia.' The page previously asserted a Swift quote calling the reference 'literal, not poetic'; no such on-record quote is documented, so that framing was replaced with the documented rental fact (she has spoken about writing the song, describing composing it in a bathtub at the City of Lover show).",
          ],
          fanTheories: [
            "The widely repeated fan lore that Swift 'lost the lease' and could never return to the townhouse mirrors the song's premise almost too neatly — but it is not documented. Reporting shows only that the rental was always temporary and she moved back to her renovated TriBeCa home; treat the 'can't go back' story as fan legend, not established fact.",
            "The romantic subject is generally read as the early days of the relationship that began in 2016; Swift has not tied the lyric to a named person on the record.",
          ],
        },
        live: [
          {
            date: "August 26, 2023",
            event: "The Eras Tour — Mexico City (Foro Sol)",
            note: "Live debut, played solo on acoustic guitar as the night's first surprise song; Taylor framed it as challenging herself to perform songs she hadn't yet done on the tour. Later revived, e.g. mashed with 'The Bolter' in Indianapolis on November 3, 2024.",
          },
        ],
        connections: [
          {
            relatedId: "song:death-by-a-thousand-cuts",
            label: "Death by a Thousand Cuts",
            why: "Lover's other New York breakup song — both map heartbreak onto the same downtown Manhattan geography, making them the album's paired city-as-memory tracks.",
          },
          {
            relatedId: "song:welcome-to-new-york",
            label: "Welcome to New York",
            why: "Her first NYC-as-home anthem, five years earlier on 1989 — the arrival that 'Cornelia Street' turns into the fear of losing the place love happened in.",
          },
        ],
        sources: [
          {
            name: "Cornelia Street — Wikipedia (song background)",
            url: "https://en.wikipedia.org/wiki/Cornelia_Street",
          },
          {
            name: "Watch Taylor Swift Deliver Fan-Favorite 'Cornelia Street' in Mexico City — Rolling Stone",
            url: "https://www.rollingstone.com/music/music-news/taylor-swift-cornelia-street-live-mexico-city-eras-tour-watch-1234812964/",
          },
          {
            name: "'Cornelia Street' townhouse once rented by Taylor Swift asks $17.9M — 6sqft",
            url: "https://www.6sqft.com/taylor-swift-cornelia-street-rental-in-nyc-asks-17-9m/",
          },
        ],
      },
    },
    {
      slug: 'death-by-a-thousand-cuts',
      trackNumber: 10,
      trackTitle: 'Death by a Thousand Cuts',
      youtubeId: 'GTEFSuFfgnU', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'A breakup song written inside a happy relationship — confirmed to be inspired by the Netflix rom-com Someone Great, closing a strange creative loop.',
      summary:
        'An imagined heartbreak felt in a hundred small places at once. Swift confirmed the film Someone Great sparked it — whose writer-director had partly drawn on Swift’s own catalog, making it a documented inspiration boomerang.',
      inspiration:
        'Confirmed: Swift cited the film Someone Great; director Jennifer Kaytin Robinson has discussed the mutual-influence loop publicly.',
      themes: ['imagined grief', 'art feeding art', 'a city full of reminders'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Lover_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'london-boy',
      trackNumber: 11,
      trackTitle: 'London Boy',
      youtubeId: 'VsKoOH6DVys', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Jack Antonoff', 'Cautious Clay', 'Sounwave'],
      producers: ['Taylor Swift', 'Jack Antonoff', 'Sounwave'],
      note: 'The tourist-map valentine to a British partner’s city — opening with an Idris Elba clip from the James Corden show, and cheerfully mispricing London geography per every British fan ever.',
      summary:
        'An American falls for the whole kit: pubs, rugby screenings, high tea with the lads. The affectionate geographic chaos (Camden to Brixton like it is one stroll) became its own beloved joke.',
      inspiration:
        'The Elba voice clip and the Cautious Clay interpolation are both in the official credits; the subject’s nationality made the reading self-evident and fans ran the borough-hopping audit for sport.',
      themes: ['loving someone’s world', 'anglophilia', 'playful devotion'],
      sourceUrl: 'https://en.wikipedia.org/wiki/London_Boy_(song)',
      sources: [
        wiki('London Boy (song)', 'London_Boy_(song)', 'song article: samples and reception'),
        ALBUM,
      ],
    },
    {
      slug: 'soon-youll-get-better',
      trackNumber: 12,
      trackTitle: "Soon You'll Get Better",
      youtubeId: 'tMoW5G5LU08', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The Dixie Chicks collaboration about her mother’s cancer — a song Taylor said the family debated even releasing, and one she almost never performs.',
      summary:
        'Written amid Andrea Swift’s cancer treatment: hospital waiting rooms, bargaining with God, and the childlike refrain that has to be true because the alternative is unthinkable.',
      inspiration:
        'Confirmed: about her mother’s illness; Swift said the decision to include it was a family conversation, and its rare performances are documented as exceptional events.',
      themes: ['a parent’s illness', 'bargaining', 'helpless love'],
      sourceUrl: "https://en.wikipedia.org/wiki/Soon_You'll_Get_Better",
      sources: [
        wiki("Soon You'll Get Better", "Soon_You'll_Get_Better", 'song article: family background'),
        ALBUM,
      ],
    },
    {
      slug: 'false-god',
      trackNumber: 13,
      trackTitle: 'False God',
      youtubeId: 'acQXa5ArHIk', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'Saxophone, sacrilege, and a long-distance argument — worship as the metaphor for a love both parties refuse to quit.',
      summary:
        'They fight across time zones and still treat the relationship as religion: even if the faith is misplaced, the devotion is the point.',
      inspiration: null,
      themes: ['love as religion', 'conflict and repair', 'devotion'],
      sourceUrl: 'https://en.wikipedia.org/wiki/False_God_(song)',
      sources: [wiki('False God (song)', 'False_God_(song)', 'song article: composition'), ALBUM],
    },
    {
      slug: 'you-need-to-calm-down',
      trackNumber: 14,
      trackTitle: 'You Need to Calm Down',
      youtubeId: 'GWtfOHBF1_w', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Joel Little'],
      producers: ['Taylor Swift', 'Joel Little'],
      singleReleaseDate: '2019-06-14',
      note: 'The Pride-month single that told trolls and picketers alike to take several seats — with a video ending in a real petition for the Equality Act.',
      summary:
        'Three verses of de-escalation: internet haters, anti-LGBTQ protesters, and women pitted against each other all get the same advice. The celebrity-packed video closed with a documented policy ask.',
      inspiration:
        'Confirmed advocacy: released during Pride 2019 with an Equality Act petition; the video’s Katy Perry reconciliation cameo formally buried the Bad Blood-era feud.',
      themes: ['allyship', 'anti-harassment', 'solidarity'],
      easterEggs:
        'The burger-and-fries hug is the official end of the Bad Blood storyline — feud opened and closed inside two videos.',
      sourceUrl: 'https://en.wikipedia.org/wiki/You_Need_to_Calm_Down',
      sources: [
        wiki('You Need to Calm Down', 'You_Need_to_Calm_Down', 'song article: advocacy and video'),
        ALBUM,
      ],
      dossier: {
        whyItMatters: [
          "Lover's second single (released June 14, 2019) and the era's Pride-month statement record. It debuted and peaked at No. 2 on the Billboard Hot 100, held off the top only by Lil Nas X's record-shattering 'Old Town Road' — the same smash that had just blocked 'ME!' — and reached No. 3 in Australia, No. 4 in Canada, and No. 5 in both the UK and Ireland. It is certified 3x Platinum by the RIAA, 7x Platinum by ARIA in Australia, and 2x Platinum by the BPI in the UK.",
          "Its celebrity-packed, LGBTQ+-celebrating video turned the song into a cultural event: nine nominations at the 2019 MTV VMAs, where it won both Video of the Year and Video for Good — and from the stage Swift pointed to the on-screen Equality Act petition it had launched, which by then had gathered hundreds of thousands of signatures.",
        ],
        meaning: {
          confirmed: [
            "Co-written and co-produced by Swift and Joel Little — one of four Lover tracks he worked on, alongside 'ME!', 'The Man' and 'Miss Americana & the Heartbreak Prince' — recorded at Golden Age in Los Angeles and Golden Age West in Auckland and mixed by Serban Ghenea. It was not Little's first Swift credit: 'ME!' (April 2019) was the first released Swift/Little collaboration. The song's three verses aim the same 'calm down' at internet trolls, anti-LGBTQ picketers, and women pitted against one another; Swift has said she was moved to write more openly about LGBTQ+ rights after realizing she was not well enough educated on the issue.",
            "The video was directed by Swift and Drew Kirsch, executive produced by Swift and Todrick Hall, and premiered June 17, 2019 on Good Morning America. Its cameo roster spans the LGBTQ+ community and its allies: the Queer Eye Fab Five (Tan France, Bobby Berk, Karamo Brown, Antoni Porowski, Jonathan Van Ness), Ellen DeGeneres, Laverne Cox, Billy Porter, Adam Lambert, Hayley Kiyoko, Jesse Tyler Ferguson, Ryan Reynolds, Ciara, RuPaul, Adam Rippon, and Katy Perry — whose burger-costumed hug with Swift's french-fry is the on-screen end of the 'Bad Blood' feud. RuPaul's Drag Race queens appear impersonating pop divas: Tatianna (Ariana Grande), Trinity the Tuck (Lady Gaga), Delta Work (Adele), Trinity K. Bonet (Cardi B), Jade Jolie (Swift herself), Riley Knoxx (Beyonce), Adore Delano (Katy Perry) and A'keria Chanel Davenport (Nicki Minaj).",
            "The video closed on a real Change.org petition urging support for the federal Equality Act. It grew well past 500,000 signatures — by April 2020 it exceeded 704,000, more than five times the threshold that warrants a White House response. The White House did respond, on August 27, 2019, but to OPPOSE the bill. The Equality Act itself passed the U.S. House (in 2019 and again in 2021) but stalled in the Senate and has never become law — so the video's policy ask remains unfulfilled.",
            "Reception was genuinely split, and the song is remembered for that debate. It was praised as a bright pro-LGBTQ anthem (NME called it 'infectious'; The A.V. Club welcomed its plain anti-homophobia stance), but named critics also faulted it for performative allyship and 'rainbow capitalism': Pitchfork's Michelle Kim found it underwhelming, Esquire's Justin Kirkland argued it 'misses the point of being an LGBTQ ally' by equating online haters with LGBTQ+ struggles, and The Atlantic's Spencer Kornhaber criticized its equation of celebrity criticism with queer persecution.",
          ],
          fanTheories: [
            "Fans read the trailer-park setting and the picketers' deliberately misspelled signs as a pointed caricature of real anti-LGBTQ protest groups. Swift has not named specific targets, so the who-is-being-satirized reading stays fan interpretation rather than a documented statement.",
          ],
        },
        live: [
          {
            date: "July 10, 2019",
            event: "Amazon Prime Day Concert — Los Angeles (live debut)",
            note: "The song's first live performance, in the Prime Day headline set weeks after the single dropped — before the album was even out.",
          },
          {
            date: "August 26, 2019",
            event: "2019 MTV Video Music Awards (opening performance)",
            note: "Taylor opened the VMAs with 'You Need to Calm Down' segueing into 'Lover'; later the same night the video won Video of the Year and Video for Good, and she used the acceptance speech to push the Equality Act petition.",
          },
          {
            date: "September 9, 2019",
            event: "City of Lover — Paris (L'Olympia, one-off)",
            note: "Part of the single Lover-era headline concert, later released as the City of Lover special.",
          },
          {
            date: "2023-2024",
            event: "The Eras Tour — Lover act",
            note: "Featured in the show's opening Lover section (performed with its first verse trimmed).",
          },
        ],
        connections: [
          {
            relatedId: "song:bad-blood",
            label: "Bad Blood",
            why: "The Katy-Perry-in-a-burger-suit hug at the end of this video is the on-screen close of the feud the 2015 'Bad Blood' clip opened — the two videos bookend the storyline, feud declared and feud buried.",
          },
          {
            relatedId: "song:me",
            label: "ME!",
            why: "Lover's lead single, released weeks earlier and its other splashy, statement-adjacent pop single — also a Swift/Joel Little co-write, and also kept off No. 1 by 'Old Town Road.'",
          },
          {
            relatedId: "song:the-man",
            label: "The Man",
            why: "The album's other overt public-statement single and fellow Joel Little co-write; both pair a self-aware, celebrity-packed video with an argued social point.",
          },
          {
            relatedId: "moment:vault-lover-lover-the-first-album-shes-ever-owned",
            label: "Lover: the first album she's ever owned",
            why: "The Pride campaign around this single — petition, VMA sweep, allyship debate — is a defining part of the Lover rollout this album page anchors.",
          },
        ],
        sources: [
          {
            name: "You Need to Calm Down — Wikipedia (charts, credits, petition, reception)",
            url: "https://en.wikipedia.org/wiki/You_Need_to_Calm_Down",
          },
          {
            name: "Five Burning Questions: Taylor Swift's No. 2 Hot 100 Debut for 'You Need to Calm Down' — Billboard",
            url: "https://www.billboard.com/pro/taylor-swift-you-need-to-calm-down-five-burning-questions/",
          },
          {
            name: "'You Need to Calm Down' Co-Director Drew Kirsch on His Unlikely Path to Filmmaking — Billboard",
            url: "https://www.billboard.com/music/music-news/taylor-swift-you-need-to-calm-down-drew-kirsch-8518581/",
          },
          {
            name: "Here's Your Guide to the References in Taylor Swift's 'You Need to Calm Down' Video — TIME",
            url: "https://time.com/5608341/taylor-swift-you-need-to-calm-down-references-explained/",
          },
        ],
      },
    },
    {
      slug: 'afterglow',
      trackNumber: 15,
      trackTitle: 'Afterglow',
      youtubeId: '8HxbqAsppwU', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Louis Bell', 'Frank Dukes'],
      producers: ['Taylor Swift', 'Louis Bell', 'Frank Dukes'],
      note: 'The apology song — she started the fight, she knows it, and the chorus is her owning the shrapnel.',
      summary:
        'Anxiety torched something good and she claims the arson: an accountability ballad asking the other person to stay inside the glow while she fixes what she broke.',
      inspiration:
        'Subject unconfirmed — popularly read as an apology to her partner at the time, but Swift has never named it on the record. The song’s documented distinction is its production: the only Lover track built by the Louis Bell / Frank Dukes team rather than the album’s Antonoff / Joel Little core.',
      themes: ['accountability', 'anxiety in love', 'repair'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Lover_(album)',
      sources: [ALBUM],
      dossier: {
        whyItMatters: [
          "Lover's most self-blaming song and its production outlier: track 15 of 18, 'Afterglow' is the only cut on the album built by the pop team of Louis Bell and Frank Dukes rather than the record's Jack Antonoff / Joel Little core — an unusual pairing for Swift, whose regular collaborators handle the rest of the album. It lands late on a deliberately front-loaded record, the accountability low point three tracks before the peace of closer 'Daylight.'",
        ],
        meaning: {
          confirmed: [
            "Written by Swift, Louis Bell and Frank Dukes (Adam King Feeney) and produced by the three; recorded at Electric Feel Studios in Los Angeles. Bell is best known for his Post Malone hits and Dukes for sample-based production. It is a power ballad of slow-building bass and Swift's falsetto in which she takes the blame for a fight she started and asks the other person to stay while she repairs the damage.",
            "A pure album cut, 'Afterglow' was never released as a single and did not chart on the Hot 100 or internationally; it carries no standalone certification. How Swift came to cut this one track with the Bell/Dukes team, and what each contributed in the session, is not documented in any interview or liner note found this pass — it remains the one genuinely undocumented question about the song, left open rather than guessed at.",
          ],
          fanTheories: [
            "The song is popularly read as an apology aimed at her partner at the time, but Swift has never named a subject on the record, so that reading is interpretation rather than confirmed fact. No documented sample or interpolation underlies the track — it is credited as an original composition, notwithstanding Dukes's usual sample-based style.",
          ],
        },
        live: [
          {
            date: "August 27, 2023",
            event: "The Eras Tour — Mexico City (Foro Sol)",
            note: "Live debut as a surprise song, four years after release; later performed mashed with 'Dress' in New Orleans on October 27, 2024. Contrary to its reputation as a never-played deep cut, it has been performed live — though only on the Eras Tour, never during the Lover-era promo run or the April 2020 City of Lover show.",
          },
        ],
        connections: [
          {
            relatedId: "song:daylight",
            label: "Daylight",
            why: "Lover's other glow-titled song and its closer — 'Afterglow' is the self-blame that 'Daylight' resolves into peace three tracks later, the album's turn from arson to light.",
          },
          {
            relatedId: "song:this-is-me-trying",
            label: "This Is Me Trying",
            why: "Its folklore successor in Swift's accountability lineage — both are first-person songs about owning damage and asking for grace rather than assigning blame.",
          },
        ],
        sources: [
          {
            name: "Afterglow (Taylor Swift song) — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Afterglow_(Taylor_Swift_song)",
          },
          {
            name: "'Lover' Songs Taylor Swift Has Never Performed Live — Billboard (2019 context)",
            url: "https://www.billboard.com/music/music-news/lover-taylor-swift-songs-never-performed-live-8529618/",
          },
        ],
      },
    },
    {
      slug: 'me',
      trackNumber: 16,
      trackTitle: 'Me!',
      youtubeId: 'FuXNumBwDOM', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Joel Little', 'Brendon Urie'],
      producers: ['Taylor Swift', 'Joel Little'],
      singleReleaseDate: '2019-04-26',
      note: 'The technicolor lead single with Brendon Urie, announced by a literal butterfly mural — and the spelling-is-fun line that was quietly deleted from the album cut.',
      summary:
        'Self-celebration as a duet: two dramatic people pitching their own irreplaceability. Its pastel-explosion video announced the era’s palette flip from reputation’s black.',
      inspiration:
        'The removed spelling lyric is the documented curiosity: present on the single, absent from the album version after months of ribbing.',
      themes: ['self-worth', 'individuality', 'spectacle'],
      easterEggs:
        'The Kelsey Montague butterfly mural in Nashville was the era’s opening Easter egg — fans found the announcement inside the wings.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Me!',
      sources: [wiki('Me!', 'Me!', 'song article: single rollout and lyric change'), ALBUM],
    },
    {
      slug: 'its-nice-to-have-a-friend',
      trackNumber: 17,
      trackTitle: "It's Nice to Have a Friend",
      youtubeId: 'eaP1VswBF28', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift', 'Louis Bell', 'Frank Dukes'],
      producers: ['Taylor Swift', 'Louis Bell', 'Frank Dukes'],
      note: 'The strangest, sweetest thing on Lover — steel drums, a children’s choir sample, and a whole life story told in miniature.',
      summary:
        'Friendship ripening into marriage in three tiny verses: snow fights, school notes, a ring — the album’s thesis (love as friendship upgraded) in under three minutes. The choir sample benefits a Toronto school program, per the credits.',
      inspiration: null,
      themes: ['friendship into love', 'lifetimes in miniature', 'gentleness'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Lover_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'daylight',
      trackNumber: 18,
      trackTitle: 'Daylight',
      youtubeId: 'u9raS7-NisU', // oEmbed-verified official Taylor Swift channel
      release: 'Lover',
      releaseDate: '2019-08-23',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The solo-written closer that was almost the album title — she once thought love was burning red, and revises her own catalog in a single line.',
      summary:
        'The era-closing thesis: real love is not golden drama or red intensity but ordinary daylight. Ends with a spoken vow to be defined by what she loves, not what she hates — the line the whole album walks toward.',
      inspiration:
        'Confirmed: Swift said Daylight was a candidate album title before Lover won; the closing monologue was written as the record’s mission statement.',
      themes: ['revised definitions of love', 'peace', 'self-definition'],
      easterEggs:
        'The burning-red correction is a direct, deliberate callback to the Red title track — her catalog editing itself in real time.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Daylight_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Daylight (Taylor Swift song)',
          'Daylight_(Taylor_Swift_song)',
          'song article: title-candidate history',
        ),
        ALBUM,
      ],
    },
  ],
};

export default ERA;
