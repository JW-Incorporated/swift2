// Era Secrets pool — folklore. Raw material for the Era Secret card (#688)
// per the founder decision 2026-07-15 (docs/proposals/2026-07-15-era-secrets.md)
// and ticket #690: 5–10 sourced, genuinely-obscure facts per era, each with a
// deeper link into the site.
//
// PROVISIONAL SHAPE (v0) — same fields as midnights.mjs (the batch-1 header
// documents them); no seeder/validator consumes this dir yet, the #688 build
// wires it up.
//
// Coverage note (batch 3): folklore is one of the site's deepest-told eras —
// the Woodvale codename, the Augustine reveal, William Bowery, the track-13
// grandparent mirror, the sixteen-hours announcement, mirrorball's Lover Fest
// origin, "the lakes," hoax-written-last, and the million-seller-of-2020 fact
// are ALL already on the live site and were cut as not-secrets before
// authoring. Everything below was checked against the vault, tracks, and
// theories seeds first.
// Sources verified via web search 2026-07-17; this session's environment
// blocks direct URL fetches (network policy), so per-URL liveness was not
// re-checked — URLs are as published in the indexed articles.
export default {
  eraSlug: 'folklore',
  secrets: [
    {
      slug: 'folklore-never-in-the-same-room',
      title: 'The whole album was made by people who were never in the same room',
      secret:
        "Taylor and Aaron Dessner wrote and recorded all of folklore without once meeting in person — she cut her vocals in a home studio she named Kitty Committee, streaming takes to him live over Audiomovers. They weren't in the same room until September 2020, when she finally drove to Long Pond to film the documentary — months after the album was out.",
      deeperLink: 'moment:vault-folklore-folklore-the-long-pond-studio-sessions-marks-her-directorial',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.soundonsound.com/people/aaron-dessner-producing-folklore-and-evermore',
          source_title: 'Aaron Dessner: Producing folklore And evermore',
          publisher: 'Sound on Sound',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
          notes: 'remote workflow, Audiomovers sessions, Kitty Committee vocal setup with engineer Laura Sisk',
        },
        {
          source_url: 'https://www.rollingstone.com/music/music-features/aaron-dessner-taylor-swift-interview-folklore-1033870/',
          source_title: "How Aaron Dessner and Taylor Swift Stripped Down Her Sound on 'Folklore'",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'folklore-seven-at-seven',
      title: 'seven, at seven, at No. 7',
      secret:
        'The numbers on "seven" line up like she planned them: a narrator remembering being seven years old, sitting at track 7 — and when folklore dropped, the song entered Billboard\'s Hot Rock & Alternative Songs chart at No. 7. Her lucky number is 13, but for one week in 2020, seven put up a fight.',
      deeperLink: 'song:seven',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://en.wikipedia.org/wiki/Seven_(Taylor_Swift_song)',
          source_title: 'Seven (Taylor Swift song)',
          publisher: 'Wikipedia',
          source_type: 'wiki',
          accessed_at: '2026-07-17',
          reliability_score: 2,
          notes: 'chart positions section, citing Billboard chart data: No. 7 on Hot Rock & Alternative Songs',
        },
        {
          source_url: 'https://www.billboard.com/charts/hot-rock-songs/2020-08-08/',
          source_title: 'Hot Rock & Alternative Songs — chart dated August 8, 2020',
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
          notes: 'the chart of record for the debut week',
        },
      ],
    },
    {
      slug: 'folklore-first-f-bomb',
      title: 'Fourteen years in, she finally swore on a record',
      secret:
        '"mad woman" carries the first F-bomb of Taylor\'s entire catalog — eight albums in. She\'d held a private rule that she couldn\'t do it because she never had; folklore\'s characters broke it for her, and she told an interviewer the release of finally swearing on record felt, fittingly, "f***ing fantastic."',
      deeperLink: 'song:mad-woman',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.refinery29.com/en-us/2020/12/10216208/taylor-swift-folklore-interview-mad-woman-explicit-swear',
          source_title: 'Taylor Swift Explains Why It Felt "F*cking Fantastic" To F*cking Swear On folklore',
          publisher: 'Refinery29',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
        {
          source_url: 'https://www.billboard.com/lists/taylor-swift-swear-words-lyrics-explicit/',
          source_title: "Taylor Swift's Most Explicit Lyrics: Swear Words in Her Lyrics",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
          notes: 'documents "mad woman" as the first F-bomb in her discography',
        },
      ],
    },
    {
      slug: 'folklore-marriage-story-ricochet',
      title: 'my tears ricochet started with a movie about a divorce',
      secret:
        "The first lines of \"my tears ricochet\" — the first song written for folklore — came right after Taylor watched Marriage Story. She'd found herself wrecked by divorce narratives without ever having lived one, and realized why: losing her masters felt like watching a marriage end. The film gave the grief its shape.",
      deeperLink: 'song:my-tears-ricochet',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.nme.com/news/music/taylor-swift-my-tears-ricochet-marriage-story-2834641',
          source_title: "Taylor Swift wrote early 'My Tears Ricochet' lyrics after watching 'Marriage Story'",
          publisher: 'NME',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.bustle.com/entertainment/taylor-swifts-my-tears-ricochet-lyrics-were-inspired-by-marriage-story',
          source_title: "Taylor Swift's \"My Tears Ricochet\" Lyrics Were Inspired By 'Marriage Story'",
          publisher: 'Bustle',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
      ],
    },
    {
      slug: 'folklore-rubber-bridge-guitar',
      title: 'That "old" guitar sound is a rubber band trick from an LA shop',
      secret:
        'The muted, decades-old-sounding guitar under "invisible string" is a real 1950s-style guitar fitted with a rubber bridge by Reuben Cox of LA\'s Old Style Guitar Shop — Aaron Dessner says the rubber "deadens the strings so that it sounds old." The same instrument came back to open "willow." One thrift-store mod, the sonic signature of both sister albums.',
      deeperLink: 'song:invisible-string',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://vintageking.com/blog/five-sounds-aaron-dessner/',
          source_title: 'Five Sounds With Aaron Dessner',
          publisher: 'Vintage King',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
          notes: "Dessner on the rubber-bridge guitar on 'willow' and 'invisible string'",
        },
        {
          source_url: 'https://www.guitarworld.com/features/diy-rubber-bridge-indie-rock-sound',
          source_title: 'How to get the rubber bridge guitar sound without permanently modifying your guitar',
          publisher: 'Guitar World',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
          notes: 'documents the Old Style Guitar Shop rubber-bridge origin and its use on folklore',
        },
      ],
    },
  ],
};
