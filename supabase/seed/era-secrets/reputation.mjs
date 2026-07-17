// Era Secrets pool — reputation. Raw material for the Era Secret card (#688)
// per the founder decision 2026-07-15 (docs/proposals/2026-07-15-era-secrets.md)
// and ticket #690: 5–10 sourced, genuinely-obscure facts per era, each with a
// deeper link into the site. Batch 2 of the wave (after midnights/tortured-poets).
//
// PROVISIONAL SHAPE (v0) — same as era-secrets/midnights.mjs (see that file's
// header for the field definitions). No seeder/validator consumes this dir yet;
// the #688 build wires it up. All URLs verified 2026-07-17.
export default {
  eraSlug: 'reputation',
  secrets: [
    {
      slug: 'rep-karyn-the-cobra',
      title: 'The snake had a name: Karyn',
      secret:
        'The 63-foot cobra that reared up over the Reputation Stadium Tour had a name — Karyn — and Taylor later admitted the bit kept her sane: "I can\'t tell you how hard I had to keep from laughing every time my 63-foot inflatable cobra named Karyn appeared onstage in front of 60,000 screaming fans."',
      deeperLink: 'egg:snake-reclamation',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.bustle.com/p/taylor-swift-alluded-to-kim-kardashians-snake-comments-in-her-new-interview-without-calling-out-the-reality-star-16817249',
          source_title: "Taylor Swift Alluded To Kim Kardashian's Snake Comments In Her New Interview",
          publisher: 'Bustle',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
          notes: 'covers the Karyn passage from her 2019 Elle essay "30 Things I Learned Before Turning 30"',
        },
        {
          source_url: 'https://taylorswift.fandom.com/wiki/Karyn',
          source_title: 'Karyn',
          publisher: 'Taylor Swift Wiki (Fandom)',
          source_type: 'fan_forum',
          accessed_at: '2026-07-17',
          reliability_score: 2,
          notes: 'documents the fandom-side lore around the tour prop',
        },
      ],
    },
    {
      slug: 'rep-liner-codes-go-dark',
      title: 'The album where the hidden messages stopped',
      secret:
        'From the debut through 1989, every printed lyric sheet hid a coded message in stray letters. reputation broke the streak: no booklet codes at all, for the first time in her career. The scavenger hunt didn\'t die — it moved into the music videos, starting with the most egg-stuffed one she\'d ever made.',
      deeperLink: 'egg:1989-lowercase-liner-codes',
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
          source_url: 'https://www.today.com/popculture/music/taylor-swift-easter-eggs-hidden-messages-rcna51887',
          source_title: 'Liner notes and easter eggs: How Taylor Swift turned fandom into a scavenger hunt',
          publisher: 'Today',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
          notes: 'documents that the booklet codes ran through 1989 and stopped after',
        },
      ],
    },
    {
      slug: 'rep-lwymmd-graveyard-receipts',
      title: 'The graveyard has receipts',
      secret:
        "The 'Look What You Made Me Do' video is wall-to-wall references — outlets ran full decoder guides the week it dropped. Start in the graveyard: the headstone beside the grave zombie-Taylor is digging reads Nils Sjöberg, the fake Swedish name she hid behind on a Calvin Harris co-write.",
      deeperLink: 'egg:lwymmd-nils-sjoberg-gravestone',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://time.com/4918411/taylor-swift-look-what-you-made-me-do-music-video-references/',
          source_title: "All the References You Might Have Missed in Taylor Swift's 'Look What You Made Me Do' Video",
          publisher: 'Time',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.rollingstone.com/music/music-news/taylor-swifts-look-what-you-made-me-do-video-decoded-13-things-you-missed-126268/',
          source_title: "Taylor Swift's 'Look What You Made Me Do' Video Decoded: 13 Things You Missed",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'rep-magazines-two-poems',
      title: 'She published poetry, and half the fandom missed it',
      secret:
        'The Target-exclusive reputation magazines carried two original Taylor poems — "Why She Disappeared" and "If You\'re Anything Like Me" — plus her paintings and handwritten lyrics. For an era with essentially no press interviews, the poems were the closest thing to an explanation she ever gave.',
      deeperLink: 'moment:vault-reputation-the-reputation-secret-sessions-500-fans-four-houses-zero-lea',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.eonline.com/news/893003/taylor-swift-explains-disappearance-in-poem-in-target-magazine-reputation-bundle',
          source_title: 'Taylor Swift Explains Her Disappearance in Heartbreaking Poem',
          publisher: 'E! News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.bustle.com/p/taylor-swifts-reputation-poem-meanings-make-having-vulnerabilities-seem-like-a-blessing-3344701',
          source_title: "Taylor Swift's 'Reputation' Poem Meanings Make Having Vulnerabilities Seem Like A Blessing",
          publisher: 'Bustle',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
      ],
    },
    {
      slug: 'rep-ups-trucks',
      title: 'The album cover drove a delivery route',
      secret:
        "reputation had an 'official delivery partner': UPS. Her face rode co-branded brown trucks through Nashville, Atlanta and New York starting August 26, 2017 — the first time UPS had ever wrapped its trucks for a promotion — and preordering from UPS.com entered fans to win tickets and airfare.",
      deeperLink: 'song:look-what-you-made-me-do',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.billboard.com/music/pop/taylor-swift-ups-trucks-reputation-face-branded-partnership-7942081/',
          source_title: "Taylor Swift's Face Is Going to Be on UPS Delivery Trucks Across the Country",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.grammy.com/news/taylor-swift-ups-team-reputation-shipping-strategy',
          source_title: "Taylor Swift, UPS Team For 'Reputation' Shipping Strategy",
          publisher: 'GRAMMY.com',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
      ],
    },
  ],
};
