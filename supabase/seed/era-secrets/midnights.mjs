// Era Secrets pool — Midnights. Raw material for the Era Secret card (#688)
// per the founder decision 2026-07-15 (docs/proposals/2026-07-15-era-secrets.md)
// and ticket #690: 5–10 sourced, genuinely-obscure facts per era, each with a
// deeper link into the site.
//
// PROVISIONAL SHAPE (v0) — no seeder/validator consumes this dir yet; the
// #688 build wires it up (and should extend scripts/validate-content.mjs to
// cover it). Fields, mirroring the audited new-type seed records
// (theories/*.mjs):
//   slug       — stable kebab identity, unique within the era
//   title      — short card headline
//   secret     — the card text (≤400 chars, fan-editor voice, hook not essay)
//   deeperLink — RelatedId-style target the card links into
//                ('song:<track slug>' | 'moment:<ContentItem.id>' |
//                 'egg:<EggNode.id>' | 'thread:<LensId>')
//   provenance — 'sourced' (outlet-verified fact) | 'fan_consensus'
//                (documented fan reading — must be presented as one, never
//                as fact, matching the theories confidence language)
//   sources    — ≥1, audited source shape (two independent outlets for any
//                relationship/business-adjacent claim)
// All URLs verified 2026-07-16.
export default {
  eraSlug: 'midnights',
  secrets: [
    {
      slug: 'midnights-track-five-tradition',
      title: "Track five is the seat she saves for the knife-twist",
      secret:
        'Fans spotted it before Taylor admitted it: track 5 of every album is its most vulnerable song. "Instinctively I was just kind of putting a very vulnerable, personal, honest, emotional song as track five," she confirmed in 2019. Midnights\' entry in the tradition: "You\'re On Your Own, Kid."',
      deeperLink: 'song:youre-on-your-own-kid',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.billboard.com/lists/taylor-swift-track-fives-ranked/',
          source_title: "Here Is Every Taylor Swift Track 5, Ranked (Critic's Picks)",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-16',
          reliability_score: 4,
        },
        {
          source_url: 'https://time.com/6969042/taylor-swift-track-five-songs-tortured-poets-department/',
          source_title: "'So Long, London' is a Classic Taylor Swift Track 5 Song",
          publisher: 'Time',
          source_type: 'reputable_press',
          accessed_at: '2026-07-16',
          reliability_score: 4,
          notes: 'recaps the tradition and the 2019 Instagram Live quote',
        },
      ],
    },
    {
      slug: 'midnights-vinyl-clock',
      title: 'The four vinyl back covers are a clock',
      secret:
        "The Jade Green, Blood Moon, Mahogany, and Lavender vinyl editions aren't just color variants — line their back covers up and the numbers printed on each curve complete one clock face, 12 to 11. Her store even sold the shelf kit with brass hands to hang them as a working clock.",
      deeperLink: 'moment:vault-midnights-custom-schiaparelli-with-a-midnights-clock-hidden-in-the-cho',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.billboard.com/music/music-news/taylor-swift-midnights-artwork-clock-1235140079/',
          source_title: "Taylor Swift's 'Midnights' LPs Assemble to Make a Clock",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-16',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.rollingstone.com/music/music-news/taylor-swift-elevates-midnights-artwork-clock-1234594274/',
          source_title: "Taylor Swift's 'Midnights' Album Artwork Assemble to Create a Clock",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-16',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'midnights-mayhem-bingo-tracklist',
      title: 'The tracklist came out of a bingo cage',
      secret:
        'No press release, no post — Midnights\' 13 track titles were revealed one ping-pong ball at a time, in a TikTok series called "Midnights Mayhem With Me": Taylor cranked a bingo cage, drew a number, and answered a vintage telephone to say the title. Episodes dropped at midnight, of course.',
      deeperLink: 'moment:vault-midnights-midnights-3am-edition-surprises-fans-with-7-more-songs',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.today.com/popculture/music/taylor-swift-midnights-tracklist-song-names-rcna50738',
          source_title: "'Midnights' tracklist: Song names of Taylor Swift's new album",
          publisher: 'Today',
          source_type: 'reputable_press',
          accessed_at: '2026-07-16',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.phillyvoice.com/taylor-swift-midnights-album-tracklist-release-tiktok-series-bingo/',
          source_title: "Taylor Swift begins to reveal tracklist for upcoming album 'Midnights' with TikTok series",
          publisher: 'PhillyVoice',
          source_type: 'reputable_press',
          accessed_at: '2026-07-16',
          reliability_score: 3,
        },
      ],
    },
    {
      slug: 'midnights-lavender-haze-mad-men',
      title: '"Lavender Haze" came from Mad Men',
      secret:
        'She heard the phrase watching Mad Men and looked it up: \'50s slang for being in love — "if you were in the lavender haze, then that meant that you were in that all-encompassing love glow." The song is about fighting to stay inside that glow while the outside world speculates.',
      deeperLink: 'song:lavender-haze',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.rollingstone.com/music/music-news/taylor-swift-reveals-lavender-haze-midnights-inspiration-joe-alwyn-1234607000/',
          source_title: "Taylor Swift Shares Inspiration Behind Midnights Track 'Lavender Haze'",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-16',
          reliability_score: 4,
        },
        {
          source_url: 'https://en.wikipedia.org/wiki/Lavender_Haze',
          source_title: 'Lavender Haze',
          publisher: 'Wikipedia',
          source_type: 'wiki',
          accessed_at: '2026-07-16',
          reliability_score: 2,
        },
      ],
    },
    {
      slug: 'midnights-vmas-speech-announcement',
      title: 'The album was announced mid-acceptance-speech',
      secret:
        'Midnights arrived as a mic drop: accepting Video of the Year for the All Too Well short film at the 2022 VMAs — her record third win in the category — she ended the speech by announcing a brand-new album for October 21. The cover and its "Meet me at midnight" caption hit Instagram at, naturally, midnight.',
      deeperLink: 'moment:vault-midnights-midnights-breaks-spotify-in-a-single-day',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.billboard.com/music/pop/taylor-swift-new-album-announcement-vmas-speech-1235132031/',
          source_title: "Taylor Swift Reveals 'Midnights' Album During 2022 VMAs Speech",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-16',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.npr.org/2022/08/28/1119845749/mtv-vmas-ready-to-host-and-honor-some-of-musics-biggest-acts',
          source_title: 'Taylor Swift says a new album is coming, after winning the top award at the MTV VMAs',
          publisher: 'NPR',
          source_type: 'reputable_press',
          accessed_at: '2026-07-16',
          reliability_score: 4,
        },
      ],
    },
  ],
};
