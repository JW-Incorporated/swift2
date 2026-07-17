// Era Secrets pool — evermore. Raw material for the Era Secret card (#688)
// per the founder decision 2026-07-15 (docs/proposals/2026-07-15-era-secrets.md)
// and ticket #690: 5–10 sourced, genuinely-obscure facts per era, each with a
// deeper link into the site.
//
// PROVISIONAL SHAPE (v0) — same fields as midnights.mjs (the batch-1 header
// documents them); no seeder/validator consumes this dir yet, the #688 build
// wires it up.
//
// Coverage note (batch 3): like folklore, evermore is heavily told on-site —
// the 31/13 announcement mirror, marjorie's real voice, the track-13
// grandparent seat, tolerate it's Rebecca origin and 10/8 time, Este's
// casting, Dorothea's shared universe, the Mumford backing vocals, the
// "Westerly" instrumental, happiness-finished-last, and closure's 5/4 are all
// already live and were cut as not-secrets. A 'tis-the-damn-season-recharts-
// every-December candidate was cut too: no named-outlet receipt found this
// session. Everything below was checked against the vault, tracks, and
// theories seeds first.
// Sources verified via web search 2026-07-17; this session's environment
// blocks direct URL fetches (network policy), so per-URL liveness was not
// re-checked — URLs are as published in the indexed articles.
export default {
  eraSlug: 'evermore',
  secrets: [
    {
      slug: 'evermore-vinyl-modern-record',
      title: 'The vinyl broke a 30-year record — six months late',
      secret:
        "evermore's LPs shipped in May 2021, five months after the surprise drop — and promptly sold 102,000 copies in one week, the biggest vinyl sales week since tracking began in 1991 and the first ever to clear 100,000. The old record (Jack White's Lazaretto) was 40,000. The wave vaulted the album from No. 74 straight back to No. 1.",
      deeperLink: 'moment:vault-evermore-evermore-makes-her-the-first-artist-to-top-both-charts-at-on',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.billboard.com/pro/taylor-swift-evermore-record-breaking-vinyl-album-sales-week/',
          source_title: "Taylor Swift's 'Evermore' Breaks Modern-Era Record for Biggest Vinyl Album Sales Week",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.forbes.com/sites/hughmcintyre/2021/06/07/taylor-swifts-evermore-is-the-first-album-to-sell-100000-vinyl-copies-in-one-week-in-us-history/',
          source_title: "Taylor Swift's 'Evermore' Is The First Album To Sell 100,000 Vinyl Copies In One Week In U.S. History",
          publisher: 'Forbes',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'evermore-gasoline-return-favor',
      title: 'She paid HAIM back with a verse on their song',
      secret:
        'The murder ballad had a sequel: two months after the Haim sisters sang on "no body, no crime," Taylor returned the favor with guest vocals on the remix of "Gasoline" — she\'d told them it was her favorite song on Women in Music Pt. III, so when the expanded edition came together, they called it in. Este gets killed in her song; Taylor sings on Este\'s.',
      deeperLink: 'moment:vault-evermore-a-surprise-cameo-at-haims-sold-out-o2-arena-show',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://variety.com/2021/music/news/taylor-swift-haim-remix-featured-gasoline-1234910806/',
          source_title: "Taylor Swift Joins Haim for Remix of Sister Trio's 'Gasoline'",
          publisher: 'Variety',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.rollingstone.com/music/music-news/taylor-swift-haim-gasoline-1128513/',
          source_title: "Haim Release 'Women in Music Pt. III' Expanded Edition With Taylor Swift",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'evermore-true-crime-origin',
      title: 'no body, no crime came out of a true-crime binge',
      secret:
        'Taylor wrote "no body, no crime" alone, after a lockdown deep-dive into true-crime podcasts and documentaries — then named the victim Este because, in her words, she\'s "the friend I have who would be stoked to be in a song like that." The genre homework shows: the song is built like an episode, alibi and all.',
      deeperLink: 'song:no-body-no-crime',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.oxygen.com/true-crime-buzz/taylor-swifts-no-body-no-crime-off-evermore-album-has-true-crime-roots',
          source_title: "Taylor Swift Channels True-Crime Fandom In New Song, 'No Body, No Crime'",
          publisher: 'Oxygen',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
        {
          source_url: 'https://www.refinery29.com/en-us/2020/12/10222300/taylor-swift-haim-no-body-no-crime-real-murder-mystery',
          source_title: 'What Is No Body No Crime About On Taylor Swift Evermore',
          publisher: 'Refinery29',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
      ],
    },
    {
      slug: 'evermore-gold-rush-lone-antonoff',
      title: 'One song on evermore is a heist',
      secret:
        "Aaron Dessner produced every track on evermore except one: \"gold rush\" is Jack Antonoff's lone fingerprint on the record, a glittering pop daydream smuggled into the middle of the folk album. Flip it around and it makes the sister-album split visible — folklore split the credits, evermore went almost all-in on Dessner.",
      deeperLink: 'song:gold-rush',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://en.wikipedia.org/wiki/Evermore',
          source_title: 'Evermore',
          publisher: 'Wikipedia',
          source_type: 'wiki',
          accessed_at: '2026-07-17',
          reliability_score: 2,
          notes: 'production credits: Dessner on all tracks except "gold rush" (Antonoff)',
        },
        {
          source_url: 'https://www.songfacts.com/facts/taylor-swift/gold-rush',
          source_title: 'Gold Rush by Taylor Swift',
          publisher: 'Songfacts',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 2,
          notes: 'the only evermore track produced by Antonoff rather than Dessner',
        },
      ],
    },
    {
      slug: 'evermore-happiness-gatsby',
      title: 'happiness is narrated from inside The Great Gatsby',
      secret:
        'Listen to "happiness" with Fitzgerald open: "I hope she\'ll be your beautiful fool" reworks Daisy Buchanan\'s most famous line, and "all you want from me now is the green light of forgiveness" borrows the dock light itself. Taylor — who was "feeling so Gatsby" back on reputation — wrote her divorce ballad in Daisy\'s vocabulary.',
      deeperLink: 'song:happiness',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://post45.org/2020/12/zelda-daisy-taylor-beautiful-fools/',
          source_title: 'Zelda, Daisy, Taylor: Beautiful Fools?',
          publisher: 'Post45',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
          notes: 'peer-edited literary venue tracing the Gatsby borrowings line by line',
        },
        {
          source_url: 'https://www.nickiswift.com/294137/the-real-meaning-behind-taylor-swifts-happiness-lyrics/',
          source_title: "The Real Meaning Behind Taylor Swift's Happiness Lyrics",
          publisher: 'Nicki Swift',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 2,
        },
      ],
    },
  ],
};
