// Era Secrets pool — Speak Now. Raw material for the Era Secret card (#688)
// per the founder decision 2026-07-15 (docs/proposals/2026-07-15-era-secrets.md)
// and ticket #690: 5–10 sourced, genuinely-obscure facts per era, each with a
// deeper link into the site.
//
// PROVISIONAL SHAPE (v0) — same fields as midnights.mjs (the batch-1 header
// documents them); no seeder/validator consumes this dir yet, the #688 build
// wires it up.
//
// Coverage note (batch 4): cut as already-live on the site — the entirely-
// self-written album fact, the Enchanted/Adam Young story (working title,
// liner code, and his answer-song are all in the vault item), the Mine leak
// and early release, Wonderstruck, the JetBlue JFK surprise show, and the
// Never Grow Up liner code (existing egg). Everything below was checked
// against the vault, tracks, and theories seeds first. All URLs verified this
// session (egress restored 2026-07-17).
export default {
  eraSlug: 'speak-now',
  secrets: [
    {
      slug: 'speak-now-hometown-covers',
      title: 'Every tour stop got its own hometown cover',
      secret:
        'On the Speak Now World Tour she did homework on every city: a surprise acoustic cover of a local hero, different nearly every night. Grand Rapids got her rapping Eminem\'s "Lose Yourself" with an Uncle Kracker chaser; Newark got Bon Jovi and Springsteen; Toronto got Alanis and Bieber. Fans traded the recordings like bootlegs — no two cities heard the same show.',
      deeperLink: 'moment:vault-speak-now-the-speak-now-world-tour-opens-in-singapore',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.etonline.com/music/113134_Taylor_Swift_Raps_Eminem_s_Lose_Yourself_at_Concert',
          source_title: "Taylor Swift Raps Eminem's 'Lose Yourself' at Concert",
          publisher: 'Entertainment Tonight',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
        {
          source_url: 'https://www.complex.com/music/a/complex/video-taylor-swift-covers-eminems-lose-yourself',
          source_title: 'Video: Taylor Swift Covers Eminem\'s "Lose Yourself"',
          publisher: 'Complex',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
        {
          source_url: 'https://www.setlist.fm/stats/covers/taylor-swift-3bd6bc5c.html?tour=bd6adc6',
          source_title: 'Taylor Swift Covered Songs and Artists — Speak Now World Tour',
          publisher: 'setlist.fm',
          source_type: 'fan_wiki',
          accessed_at: '2026-07-17',
          reliability_score: 2,
          notes: 'the full city-by-city covers list documenting the per-stop pattern',
        },
      ],
    },
    {
      slug: 'speak-now-itwam-omission',
      title: 'The re-record dropped one of its own songs',
      secret:
        'Speak Now (Taylor\'s Version) quietly runs one song short: "If This Was a Movie," the deluxe cut co-written with Boys Like Girls\' Martin Johnson, is the only original that didn\'t return. Dropping the lone co-write made the re-record something the 2010 album nearly was: entirely self-written. Its Taylor\'s Version had already slipped out months earlier — filed under Fearless.',
      deeperLink: 'song:if-this-was-a-movie',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.capitalfm.com/news/taylor-swift-speak-now-if-this-was-a-movie/',
          source_title: "The Taylor Swift Song That Won't Be On 'Speak Now (Taylor's Version)'",
          publisher: 'Capital',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
        {
          source_url: 'https://uproxx.com/pop/is-taylor-swift-if-this-was-a-movie-from-speak-now/',
          source_title: "Is Taylor Swift's 'If This Was A Movie' From 'Speak Now?'",
          publisher: 'Uproxx',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
        {
          source_url: 'https://en.wikipedia.org/wiki/If_This_Was_a_Movie',
          source_title: 'If This Was a Movie',
          publisher: 'Wikipedia',
          source_type: 'wiki',
          accessed_at: '2026-07-17',
          reliability_score: 2,
          notes: "the re-recording's March 2023 release on The More Fearless (Taylor's Version) Chapter EP",
        },
      ],
    },
    {
      slug: 'speak-now-last-kiss-code',
      title: "Last Kiss's liner code points back two eras",
      secret:
        'The Speak Now booklet\'s hidden message under "Last Kiss" spells FOREVER AND ALWAYS — the title of a Fearless breakup song. Fans read the cross-reference the obvious way: same story, two albums apart, the sequel filed under the original\'s name. She never explained it; the liner notes were allowed to do the talking.',
      deeperLink: 'song:last-kiss',
      provenance: 'fan_consensus',
      sources: [
        {
          source_url: 'https://www.billboard.com/music/music-news/taylor-swift-liner-note-secret-messages-6296379/',
          source_title: "Taylor Swift's 13 Best Liner Note Secret Messages",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
          notes: 'documents the printed FOREVER AND ALWAYS message itself',
        },
        {
          source_url: 'https://theweek.com/feature/briefing/1024743/who-is-taylor-swift-singing-about-on-speak-now-a-complete-guide-to-the',
          source_title: "Who is Taylor Swift singing about on 'Speak Now'? A complete guide to the album",
          publisher: 'The Week',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
          notes: 'documents the fan reading connecting the two songs',
        },
      ],
    },
    {
      slug: 'speak-now-i-can-see-you-reunion',
      title: 'The Mean video kids came back 12 years later',
      secret:
        'The "I Can See You" heist crew is a reunion: Joey King and Presley Cash — the bullied kids from 2011\'s "Mean" video, ages 9 and 13 back then — return grown up to break Speak Now-era Taylor out of a museum vault, alongside Taylor Lautner, the era\'s own leading man. She premiered it onstage in Kansas City and named the theme herself: the fans helping her reclaim her music.',
      deeperLink: 'song:i-can-see-you',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://variety.com/2023/music/news/taylor-swift-lautner-i-can-see-you-music-video-joey-king-presley-cash-1235664478/',
          source_title: "Taylor Swift 'I Can See You' Video Has Taylor Lautner as Surprise Star",
          publisher: 'Variety',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.billboard.com/music/music-news/taylor-swift-i-can-see-you-video-taylor-lautner-joey-king-presley-cash-1235368510/',
          source_title: "Taylor Swift Premieres 'I Can See You' Video With Taylor Lautner at Eras Tour Show in Kansas City",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'speak-now-long-live-portuguese',
      title: 'Long Live has a second official language',
      secret:
        'There\'s a version of "Long Live" most U.S. fans have never heard: a 2012 duet with Brazilian country star Paula Fernandes, with new verses written and sung in Portuguese. Cut for the Brazilian edition of the Speak Now live album, it went four-times diamond in Brazil and soundtracked the primetime soap Avenida Brasil — a parallel life for the album\'s farewell toast.',
      deeperLink: 'song:long-live',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://en.wikipedia.org/wiki/Long_Live_(Taylor_Swift_song)',
          source_title: 'Long Live (Taylor Swift song)',
          publisher: 'Wikipedia',
          source_type: 'wiki',
          accessed_at: '2026-07-17',
          reliability_score: 2,
          notes: 'release, chart, and certification details for the Fernandes version',
        },
        {
          source_url: 'https://rollingstone.com.br/musica/paula-fernandes-revela-como-foi-encontro-com-taylor-swift-em-2012/',
          source_title: 'Paula Fernandes revela como foi encontro com Taylor Swift em 2012',
          publisher: 'Rolling Stone Brasil',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
      ],
    },
  ],
};
