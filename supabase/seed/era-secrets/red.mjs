// Era Secrets pool — Red. Raw material for the Era Secret card (#688)
// per the founder decision 2026-07-15 (docs/proposals/2026-07-15-era-secrets.md)
// and ticket #690: 5–10 sourced, genuinely-obscure facts per era, each with a
// deeper link into the site.
//
// PROVISIONAL SHAPE (v0) — same fields as midnights.mjs (the batch-1 header
// documents them); no seeder/validator consumes this dir yet, the #688 build
// wires it up.
//
// Coverage note (batch 4): Red is one of the site's deepest-told eras, so a
// lot of researched material was cut as already-live: the All Too Well
// rehearsal-jam origin and longest-No.-1 record, the WANEGBT
// walked-into-the-studio origin story, the Ed Sheeran trampoline, Starlight's
// found photo, the 22 video's real friends, the Google+ Hangout announcement,
// the High Watch purchase, the surprise-guest parade, and the Grammy shutout
// are all in the vault already. Better Man's Little Big Town giveaway and
// Nothing New's Phoebe Bridgers first-female-feature story are told in the
// track dossiers, so they were cut too. Everything below was checked against
// the vault, tracks, and theories seeds first. All URLs verified this session
// (egress restored 2026-07-17).
export default {
  eraSlug: 'red',
  secrets: [
    {
      slug: 'red-don-mclean-flowers',
      title: 'She broke a 50-year record, then sent the loser flowers',
      secret:
        'When the 10-minute "All Too Well" dethroned "American Pie" as the longest No. 1 in Hot 100 history — a record Don McLean had held since 1972 — Taylor sent him flowers and a handwritten note. McLean posted the bouquet with a caption of his own: "What a class act!" Fifty years of chart history changed hands with a thank-you card.',
      deeperLink: 'song:all-too-well-10-minute-version',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.billboard.com/music/pop/don-mclean-reacts-taylor-swift-for-breaking-half-century-american-pie-record-1235001870/',
          source_title: "Don McLean Reacts to Taylor Swift For Breaking Half-Century 'American Pie' Record",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.today.com/popculture/taylor-swift-sends-flowers-note-don-mclean-after-breaking-his-t242099',
          source_title: 'Taylor Swift sends flowers, note to Don McLean after breaking his record',
          publisher: 'Today',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
      ],
    },
    {
      slug: 'red-all-too-well-maple-lattes',
      title: "All Too Well's liner-note code is a coffee order",
      secret:
        'Before the scarf became scripture, the original Red booklet hid a plainer clue: the coded message threaded through "All Too Well"\'s printed lyrics — capital letters, per the era\'s tradition — spells MAPLE LATTES, matching a much-photographed fall 2010 coffee run. The codes usually hinted at a song\'s subject; this one practically drew a map.',
      deeperLink: 'song:all-too-well',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.billboard.com/music/music-news/taylor-swift-liner-note-secret-messages-6296379/',
          source_title: "Taylor Swift's 13 Best Liner Note Secret Messages",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://tasteofcountry.com/taylor-swift-red-hidden-messages/',
          source_title: "Hidden Messages in Taylor Swift's 'Red' Liner Notes Revealed",
          publisher: 'Taste of Country',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
      ],
    },
    {
      slug: 'red-wanegbt-one-take-video',
      title: "The 'Never Ever' video never cuts — it's one single shot",
      secret:
        'The "We Are Never Ever Getting Back Together" video looks like a dozen sets because it is — but the camera never stops rolling. Director Declan Whitebloom staged the whole thing as one continuous take, Taylor swapping five outfits mid-frame while the rooms rebuilt themselves around her. One shot, five costumes, zero edits.',
      deeperLink: 'song:we-are-never-ever-getting-back-together',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.eonline.com/news/342415/taylor-swift-s-we-are-never-ever-getting-back-together-music-video-filmed-in-one-take',
          source_title: "Taylor Swift's \"We Are Never Ever Getting Back Together\" Music Video: Filmed in One Take!",
          publisher: 'E! News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
        {
          source_url: 'https://www.fdtimes.com/2012/09/05/taylor-swifts-we-are-never-ever-getting-back-together/',
          source_title: 'Making of Taylor Swift\'s "We Are Never Ever Getting Back Together"',
          publisher: 'Film and Digital Times',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
          notes: 'production trade detail: continuous take on a body-mounted stabilizer rig',
        },
      ],
    },
    {
      slug: 'red-ibytam-blake-lively-debut',
      title: "Blake Lively's directing career started on Red TV",
      secret:
        '"I Bet You Think About Me" isn\'t just a vault track — its video is Blake Lively\'s directorial debut. Taylor co-wrote the treatment with her best friend, handed her the chair, and cast Miles Teller as the groom with his real-life wife Keleigh as the bride — a wedding-crasher revenge fantasy staged as a family affair on both sides of the camera.',
      deeperLink: 'song:i-bet-you-think-about-me',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-blake-lively-music-video-red-taylors-version-1235047645/',
          source_title: 'Taylor Swift Releases "I Bet You Think About Me" Music Video Directed by Blake Lively',
          publisher: 'The Hollywood Reporter',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.nbcnews.com/pop-culture/pop-culture-news/miles-teller-stars-taylor-swifts-new-music-video-directed-blake-lively-rcna5586',
          source_title: "Miles Teller stars in Taylor Swift's new music video directed by Blake Lively",
          publisher: 'NBC News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'red-kennedy-wedding-flap',
      title: 'The Conor summer had a wedding-crash controversy',
      secret:
        "August 2012's strangest news cycle: the mother of a Kennedy bride said Taylor and Conor were told \"please do not come\" to a family wedding — and came anyway. Taylor's rep insisted she was invited and thanked for being there; wedding guest Kathie Lee Gifford sided with the bride. The accounts never matched, and Taylor later called the whole thing a misunderstanding.",
      deeperLink: 'moment:vault-red-the-conor-kennedy-summer-quietly-ends',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.today.com/popculture/kathie-lee-taylor-swift-wedding-flap-it-was-brides-day-flna960916',
          source_title: "Kathie Lee on Taylor Swift wedding flap: 'It was the bride's day'",
          publisher: 'Today',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
        {
          source_url: 'https://www.eonline.com/news/340429/kathie-lee-gifford-calls-out-taylor-swift-insists-songbird-crashed-kennedy-nuptials',
          source_title: 'Kathie Lee Gifford: Yes, Taylor Swift Crashed Kennedy Wedding!',
          publisher: 'E! News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
      ],
    },
  ],
};
