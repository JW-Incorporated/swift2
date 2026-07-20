// Era Secrets pool — Taylor Swift (the 2006 debut). Raw material for the Era
// Secret card (#688) per the founder decision 2026-07-15
// (docs/proposals/2026-07-15-era-secrets.md) and ticket #690: 5–10 sourced,
// genuinely-obscure facts per era, each with a deeper link into the site.
//
// PROVISIONAL SHAPE (v0) — same fields as midnights.mjs (the batch-1 header
// documents them); no seeder/validator consumes this dir yet, the #688 build
// wires it up.
//
// Coverage note (batch 5): the debut's on-site coverage is unusually deep, so
// most catalog facts were cut as already-live (checked against the vault,
// tracks, and theories seeds first): the "Tim McGraw" math-class origin and
// "When you think Tim McGraw" title, Our Song's ninth-grade-talent-show origin
// and youngest-solo-No.1 record, The Outside written at 12, Tied Together and
// Mary's Song's real-life origins, Should've Said No's 20-minute writing, the
// Bluebird night, the RCA-development-deal walkaway, the Sony/ATV signing at
// 14, Nathan Chapman's whole-album production, and the capital-letter liner-note
// code are all already told. This pool therefore leans into the pre-fame origin
// story — the vein the site had not yet mined. All URLs verified this session
// (egress available 2026-07-20).
//
// PRIVACY NOTE: the Christmas-tree-farm secret is kept at city level (Reading,
// Pennsylvania) in historical childhood framing — Always-OK per
// docs/content-ops/privacy-redlines.md — with no street address (L3, never
// publishable). It is a fact Taylor herself made public (the 2019 song).
export default {
  eraSlug: 'debut',
  secrets: [
    {
      slug: 'debut-track-five-tradition',
      title: 'The track-five tradition begins with "Cold As You"',
      secret:
        'The pattern fans would spend a decade decoding starts on the very first album: track 5 is Taylor\'s most vulnerable song, a habit she later admitted was instinctive. On the 2006 debut that seat belongs to "Cold As You" — a quiet, cutting breakup song, years before "All Too Well" made the track-five slot legendary.',
      deeperLink: 'song:cold-as-you',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.billboard.com/lists/taylor-swift-track-fives-ranked/',
          source_title: "Here Is Every Taylor Swift Track 5, Ranked (Critic's Picks)",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 4,
          notes: 'lists "Cold As You" as the debut album\'s track five',
        },
        {
          source_url: 'https://time.com/6969042/taylor-swift-track-five-songs-tortured-poets-department/',
          source_title: "'So Long, London' Is a Classic Taylor Swift Track 5 Song",
          publisher: 'TIME',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'debut-anthem-strategy',
      title: 'The national anthem was her way onto a stage',
      secret:
        'Before any record deal, a young Taylor worked out a hack for singing to big crowds. "When I was 11 years old, it occurred to me that the national anthem was the best way to get in front of a large group of people if you don\'t have a record deal," she said — so she sang it anywhere she could, working up to a Philadelphia 76ers game in front of more than 20,000 fans.',
      deeperLink: 'song:tim-mcgraw',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.nbcphiladelphia.com/news/local/taylor-swifts-connections-to-sports-go-back-to-her-early-days-performing-the-national-anthem/3772093/',
          source_title: "Taylor Swift's connections to sports go back to her early days performing the national anthem",
          publisher: 'NBC Sports Philadelphia',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 3,
          notes: 'carries her "get in front of a large group of people" quote; dates the 76ers anthem to April 5, 2002, before 20,754 fans',
        },
        {
          source_url: 'https://www.foxsports.com/stories/nba/watch-12-year-old-taylor-swift-sing-impressive-anthem-before-76ers-game',
          source_title: 'Watch 12-year-old Taylor Swift sing impressive anthem before 76ers game',
          publisher: 'FOX Sports',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 3,
          notes: 'the strategy quote is about age 11; the 76ers performance itself was in April 2002, when she was 12 — the secret is worded to reflect that',
        },
      ],
    },
    {
      slug: 'debut-named-after-james-taylor',
      title: 'She was named after James Taylor — on purpose, for business',
      secret:
        'Her parents chose a gender-neutral name deliberately: her mother, a former mutual-fund marketing executive, believed "Taylor" would read the same on a business card whether people pictured a man or a woman. The singer they had in mind when they picked it was James Taylor.',
      deeperLink: 'song:a-place-in-this-world',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://en.wikipedia.org/wiki/Taylor_Swift',
          source_title: 'Taylor Swift',
          publisher: 'Wikipedia',
          source_type: 'reference',
          accessed_at: '2026-07-20',
          reliability_score: 3,
          notes: 'her parents chose a unisex name hoping it would help a business career; named after James Taylor',
        },
        {
          source_url: 'https://wbsm.com/massachusetts-taylor-swift-named-james-taylor/',
          source_title: 'Taylor Swift Was Named After This Massachusetts Legend',
          publisher: 'WBSM',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 3,
        },
      ],
    },
    {
      slug: 'debut-abercrombie-rising-stars',
      title: 'She was an Abercrombie model before she had a single out',
      secret:
        'Two years before her debut single, a 14-year-old Taylor turned up in Abercrombie & Fitch\'s "Rising Stars" campaign — shot by the brand\'s longtime photographer Bruce Weber and printed in its glossy A&F Quarterly. She was billed as a star on the rise before a single one of her records existed.',
      deeperLink: 'song:the-outside',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.buzzfeednews.com/article/sapna/abercrombie-revives-stars-on-the-rise-ad-campaign',
          source_title: 'Abercrombie Updates Its "Stars On The Rise" Ad Campaign For A New Generation',
          publisher: 'BuzzFeed News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 3,
          notes: 'names Taylor Swift among the pre-fame "Stars on the Rise" alumni; Bruce Weber shot the black-and-white campaign',
        },
        {
          source_url: 'https://variety.com/2013/scene/vpage/abercrombie-fitch-rising-stars-1200561909/',
          source_title: 'Abercrombie & Fitch Debuts New Rising Stars',
          publisher: 'Variety',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 4,
          notes: 'documents the original 2000s Rising Stars campaign that featured a then-unknown Taylor',
        },
      ],
    },
    {
      slug: 'debut-christmas-tree-farm',
      title: 'She actually grew up on a Christmas tree farm',
      secret:
        'Before Nashville, before the guitar, Taylor spent her early childhood on an 11-acre Christmas tree farm outside Reading, Pennsylvania — Fraser and Douglas firs her family sold by the truckload. She helped work it as a kid, then revisited the whole memory decades later in her 2019 song "Christmas Tree Farm."',
      deeperLink: 'song:marys-song-oh-my-my-my',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.refinery29.com/en-us/2019/12/8979759/taylor-swift-pine-ridge-christmas-tree-farm-pa',
          source_title: "Everything You Need To Know About Taylor Swift's Christmas Tree Farm",
          publisher: 'Refinery29',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 3,
        },
        {
          source_url: 'https://6abc.com/post/taylor-swift-recalls-growing-up-on-pa-farm-in-new-music-video/5737195/',
          source_title: "'Christmas Tree Farm': Taylor Swift recalls growing up on Pennsylvania Pine Ridge Farm in new music video",
          publisher: '6abc Philadelphia',
          source_type: 'reputable_press',
          accessed_at: '2026-07-20',
          reliability_score: 3,
        },
      ],
    },
  ],
};
