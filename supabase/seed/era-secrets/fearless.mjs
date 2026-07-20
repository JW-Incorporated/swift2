// Era Secrets pool — Fearless. Raw material for the Era Secret card (#688)
// per the founder decision 2026-07-15 (docs/proposals/2026-07-15-era-secrets.md)
// and ticket #690: 5–10 sourced, genuinely-obscure facts per era, each with a
// deeper link into the site.
//
// PROVISIONAL SHAPE (v0) — same fields as midnights.mjs (the batch-1 header
// documents them); no seeder/validator consumes this dir yet, the #688 build
// wires it up.
//
// Coverage note (batch 5): Fearless is one of the site's deepest-told eras, so
// a lot of researched material was cut as already-live and checked against the
// vault, tracks, and theories seeds first: the Love Story bedroom-floor /
// rewrote-the-ending origin, the Hey Stephen liner-note code and Stephen Barker
// Liles answer song, White Horse's Grey's Anatomy save, The Best Day's secret
// home-video premiere, "Untouchable" being a Luna Halo cover, "Breathe" as the
// Colbie Caillat duet, "Change" as the Big Machine / 2008 Olympics anthem, "The
// Way I Loved You" with John Rich, Forever & Always added at the last minute,
// Today Was a Fairytale's Valentine's Day film tie, the youngest-AOTY record,
// and Fifteen's real-life Abigail are all in the vault already. Mr. Perfectly
// Fine's Sophie Turner endorsement is told in the track dossier, so it was cut
// too. All URLs verified this session (egress available 2026-07-20).
export default {
  eraSlug: 'fearless',
  secrets: [
    {
      slug: 'fearless-track-five-tradition',
      title: 'Track five is the album\'s rawest nerve — here, "White Horse"',
      secret:
        'Fans clocked the pattern before Taylor named it: track 5 of every album is its most emotionally exposed song. "Instinctively I was just kind of putting a very vulnerable, personal, honest, emotional song as track five," she confirmed in 2019. Fearless hands the seat to "White Horse" — a fairy tale collapsing in real time.',
      deeperLink: 'song:white-horse',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.billboard.com/lists/taylor-swift-track-fives-ranked/',
          source_title: "Here Is Every Taylor Swift Track 5, Ranked (Critic's Picks)",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 4,
        },
        {
          source_url: 'https://time.com/6969042/taylor-swift-track-five-songs-tortured-poets-department/',
          source_title: "'So Long, London' Is a Classic Taylor Swift Track 5 Song",
          publisher: 'TIME',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 4,
          notes: 'carries the 2019 track-five quote and lists White Horse as the Fearless entry',
        },
      ],
    },
    {
      slug: 'fearless-what-fearless-means',
      title: "The album title is a definition — and it isn't \"unafraid\"",
      secret:
        'The Fearless booklet opens with Taylor defining her own title: "Fearless is not the absence of fear… fearless is having fears. Fearless is having doubts. Lots of them. To me, fearless is living in spite of those things that scare you to death." The whole era, stated in four lines before the first song plays.',
      deeperLink: 'song:fearless',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://readdork.com/lyrics/taylor-swift-fearless-liner-notes',
          source_title: 'Taylor Swift – Fearless [Liner Notes]',
          publisher: 'Dork',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 3,
          notes: "reproduces the album's printed liner-note reflection in full",
        },
        {
          source_url: 'https://en.wikiquote.org/wiki/Taylor_Swift',
          source_title: 'Taylor Swift — Wikiquote (Fearless liner notes)',
          publisher: 'Wikiquote',
          source_type: 'reference',
          accessed_at: '2026-07-20',
          reliability_score: 3,
          notes: 'attributes the quote to the 2008 Fearless album booklet (primary source: her own published words)',
        },
      ],
    },
    {
      slug: 'fearless-love-story-castle-gwynn',
      title: 'The "Love Story" castle is a short drive from Nashville',
      secret:
        'Taylor assumed the "Love Story" video would mean flying to Europe for a castle — until someone found Castle Gwynn, a real turreted castle in Arrington, Tennessee, barely outside Nashville. "I just didn\'t think that castles were in Tennessee at all," she admitted. Locals know it as the home of the state\'s Renaissance Festival.',
      deeperLink: 'song:love-story',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.wkrn.com/news/local-news/story-behind-castle-gwynn-where-taylor-swift-filmed-love-story-music-video/',
          source_title: "How a Tennessee castle brought 'Love Story' to life",
          publisher: 'WKRN (Nashville)',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 3,
        },
        {
          source_url: 'https://www.wsmv.com/2024/04/24/castle-taylor-swifts-music-video-love-story-host-weddings/',
          source_title: "Castle in Taylor Swift's music video 'Love Story' to host weddings",
          publisher: 'WSMV (Nashville)',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 3,
        },
      ],
    },
    {
      slug: 'fearless-vault-tracks-guests',
      title: 'The re-recordings started here — and the vault brought friends',
      secret:
        'Rebuilding Fearless as Fearless (Taylor\'s Version) in 2021 made it her first re-recorded album — and the first re-record ever to debut at No. 1. It also unlocked songs shelved in 2008: "You All Over Me," the first "From the Vault" track she released, features Maren Morris, and the vault duet "That\'s When" pairs her with Keith Urban.',
      deeperLink: 'song:you-all-over-me',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.billboard.com/music/pop/taylor-swift-fearless-taylors-version-everything-we-know-9552361/',
          source_title: "'Fearless (Taylor's Version)': Everything We Know",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 4,
        },
        {
          source_url: "https://en.wikipedia.org/wiki/Fearless_(Taylor's_Version)",
          source_title: "Fearless (Taylor's Version)",
          publisher: 'Wikipedia',
          source_type: 'reference',
          accessed_at: '2026-07-20',
          reliability_score: 3,
          notes: 'first re-recorded album; first re-record to hit No. 1; vault features Maren Morris ("You All Over Me") and Keith Urban ("That\'s When")',
        },
      ],
    },
    {
      slug: 'fearless-fifteen-miley-grammys',
      title: 'Two teenagers sang "Fifteen" on the Grammy stage',
      secret:
        'At the 2009 Grammys, a 19-year-old Taylor played "Fifteen" on acoustic guitar and handed the chorus to her duet partner: 16-year-old Miley Cyrus. Two of the biggest teenagers in music, trading a song about surviving freshman year, on the industry\'s biggest night.',
      deeperLink: 'song:fifteen',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://content.time.com/time/specials/packages/article/0,28804,1877619_1877620_1878024,00.html',
          source_title: "'Fifteen,' Taylor Swift and Miley Cyrus — Grammy Awards 2009",
          publisher: 'TIME',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.nbc.com/nbc-insider/taylor-swift-miley-cyrus-sing-fifteen-listen',
          source_title: "Taylor Swift and Miley Cyrus' Beautiful, Live Duet of \"Fifteen\" Is Timeless",
          publisher: 'NBC',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 3,
          notes: 'dates the duet to the 51st Grammy Awards, Feb. 8, 2009',
        },
      ],
    },
  ],
};
