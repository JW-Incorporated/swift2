// Era Secrets pool — Lover. Raw material for the Era Secret card (#688)
// per the founder decision 2026-07-15 (docs/proposals/2026-07-15-era-secrets.md)
// and ticket #690: 5–10 sourced, genuinely-obscure facts per era, each with a
// deeper link into the site. Batch 2 of the wave (after midnights/tortured-poets).
//
// PROVISIONAL SHAPE (v0) — same as era-secrets/midnights.mjs (see that file's
// header for the field definitions). No seeder/validator consumes this dir yet;
// the #688 build wires it up. All URLs verified 2026-07-17.
export default {
  eraSlug: 'lover',
  secrets: [
    {
      slug: 'lover-choir-that-funds-a-school',
      title: "The kids on the last track are paying a school's bills",
      secret:
        "Those children's voices on 'It's Nice to Have a Friend' belong to a youth choir from Toronto's Regent Park School of Music — sampled from a library producer Frank Dukes built so that the royalties flow back to fund the school. Every play of the album's quietest track helps keep a music program running.",
      deeperLink: 'song:its-nice-to-have-a-friend',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://exclaim.ca/music/article/taylor_swift_sampled_regent_park_youth_choir_on_lover_track_its_nice_to_have_a_friend',
          source_title: "Taylor Swift Sampled a Toronto Youth Choir on 'Lover'",
          publisher: 'Exclaim!',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://nowtoronto.com/music/taylor-swift-regent-park-school-of-music/',
          source_title: "Taylor Swift's Lover features students from Toronto's Regent Park School of Music",
          publisher: 'NOW Toronto',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'lover-spelling-is-fun-vanishes',
      title: 'The line that quietly vanished',
      secret:
        'Two days before Lover dropped, the most clowned-on line of "ME!" — "Hey kids, spelling is fun!" — silently disappeared from the song. No statement, no acknowledgment; the album version simply doesn\'t have it. She had defended the line for months as a tone decision made in the studio.',
      deeperLink: 'song:me',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.billboard.com/music/pop/taylor-swift-drops-spelling-is-fun-lyric-me-8527951/',
          source_title: "Taylor Swift Drops 'Spelling Is Fun!' Lyric From 'Me!'",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.rollingstone.com/music/music-news/taylor-swift-removes-me-lyric-874631/',
          source_title: "Taylor Swift Removes 'Spelling Is Fun!' Lyric From 'Me!'",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'lover-me-video-called-its-shot',
      title: "The 'ME!' video called its shot",
      secret:
        "A painting of the Dixie Chicks hangs on the wall of the 'ME!' video — four months before they actually appeared on Lover, harmonizing on 'Soon You'll Get Better.' And the kitten Brendon Urie hands her mid-video became a real adoption: that's how Benjamin Button joined the family.",
      deeperLink: 'egg:me-video-chicks-painting',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.billboard.com/music/pop/taylor-swift-me-video-easter-eggs-8509007/',
          source_title: "Taylor Swift's 'ME!' Video Easter Eggs: Album Title, Her Next Single & More",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.eonline.com/news/1035688/taylor-swift-s-me-music-video-all-the-hidden-easter-eggs-and-symbolism',
          source_title: "Taylor Swift's ''ME!'' Music Video: All the Hidden Easter Eggs and Symbolism",
          publisher: 'E! News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'lover-the-man-graffiti-wall',
      title: 'Freeze-frame the subway wall',
      secret:
        "Pause the subway scene in 'The Man': the wall behind Tyler Swift is tagged with her album titles, a 'Missing — if found return to Taylor Swift' poster standing in for the debut, and one word fans had been chasing for years: Karma. All of it shot mid-fight over her stolen masters.",
      deeperLink: 'egg:the-man-karma-graffiti',
      provenance: 'sourced',
      sources: [
        {
          source_url: 'https://www.marieclaire.com/celebrity/a31129779/easter-eggs-taylor-swift-the-man/',
          source_title: "Easter Eggs In Taylor Swift's 'The Man' Video Are Everywhere",
          publisher: 'Marie Claire',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.distractify.com/p/taylor-swift-the-man-music-video-easter-eggs',
          source_title: "7 Easter Eggs You Might Not Have Noticed in Taylor Swift's \"The Man\" Music Video",
          publisher: 'Distractify',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
      ],
    },
    {
      slug: 'lover-house-eras-map',
      title: 'The house with an era behind every door',
      secret:
        "The fan reading: every room in the 'Lover' video's snow-globe house is one of her albums — the red room for Red, the hazy attic for reputation. Taylor has never said it outright, but when Midnights was announced, she liked the TikTok declaring the starry ceiling the final room.",
      deeperLink: 'song:lover',
      provenance: 'fan_consensus',
      sources: [
        {
          source_url: 'https://www.eonline.com/news/1344281/taylor-swift-approves-of-this-theory-about-her-10-albums',
          source_title: 'Taylor Swift Approves of This Theory About Her 10 Albums',
          publisher: 'E! News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://digital.abcaudio.com/news/taylor-swift-seemingly-confirms-fan-theory-about-lover-house',
          source_title: 'Taylor Swift seemingly confirms fan theory about the "Lover" house',
          publisher: 'ABC Audio',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
      ],
    },
  ],
};
