// Era Secrets pool — The Life of a Showgirl. Raw material for the Era Secret
// card (#688) per the founder decision 2026-07-15
// (docs/proposals/2026-07-15-era-secrets.md); pool requested in #6442.
// Shape: see the schema comment in era-secrets/midnights.mjs (the canonical
// copy). Every fact and source here is carried from the already-vetted item
// its deeperLink points at (content/the-life-of-a-showgirl.mjs,
// tracks/the-life-of-a-showgirl.mjs), with that item's accessed_at dates.
// `media` satisfies the text-only ratchet (scripts/lib/text-only-ratchet.mjs);
// each video id was oEmbed-verified against its official channel 2026-11-11.
const embed = (id, attribution = 'Taylor Swift — official YouTube channel') => ({
  kind: 'oembed',
  rights: 'platform_tos',
  provider: 'youtube',
  post_url: `https://www.youtube.com/watch?v=${id}`,
  oembed_fetched_at: '2026-11-11',
  attribution,
});

export default {
  eraSlug: 'the-life-of-a-showgirl',
  secrets: [
    {
      slug: 'tloas-title-track-vancouver-crowd',
      title: 'The crowd at the end of the album is real',
      secret:
        'The roar under the last seconds of "The Life of a Showgirl" was recorded at the final Eras Tour show in Vancouver. Over it, Taylor says "Give it up for the band / And the dancers / And of course, Sabrina," and Sabrina Carpenter answers "I love you, Taylor!" The tour\'s own sound closes the record.',
      deeperLink: 'song:the-life-of-a-showgirl-title-track',
      provenance: 'sourced',
      media: [embed('OU6362Nggg0')],
      sources: [
        {
          source_url:
            'https://www.cbc.ca/news/canada/british-columbia/vancouver-crowd-on-taylor-swift-s-new-album-1.7650822',
          source_title: "The Vancouver crowd that closes Taylor Swift's new album",
          publisher: 'CBC News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-21',
          reliability_score: 4,
        },
        {
          source_url:
            'https://www.today.com/popculture/music/the-life-of-a-showgirl-lyrics-meaning-taylor-swift-sabrina-carpenter-rcna234281',
          source_title:
            "'The Life of a Showgirl' Lyrics: Taylor Swift and Sabrina Carpenter Explore the Price of Stardom",
          publisher: 'Today',
          source_type: 'reputable_press',
          accessed_at: '2026-07-25',
          reliability_score: 3,
        },
      ],
    },
    {
      slug: 'tloas-father-figure-george-michael-credit',
      title: 'George Michael has a writing credit on "Father Figure"',
      secret:
        'It isn\'t a sample. "Father Figure" re-records the melody and the "I\'ll be your father figure" line from George Michael\'s 1988 hit, so he is credited as a writer next to Taylor, Max Martin and Shellback. She went to his estate before release; they said they "had no hesitation" and believed "George would have felt the same."',
      deeperLink: 'song:father-figure',
      provenance: 'sourced',
      media: [embed('98SmlWOKuME')],
      sources: [
        {
          source_url:
            'https://www.rollingstone.com/music/music-news/george-michael-taylor-swift-father-figure-song-1235439835/',
          source_title:
            "'No Hesitation': George Michael's Estate 'Delighted' Over Taylor Swift Using 'Father Figure'",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-08',
          reliability_score: 4,
        },
        {
          source_url:
            'https://theconversation.com/taylor-swifts-father-figure-isnt-a-cover-but-an-interpolation-what-that-means-and-why-it-matters-265583',
          source_title:
            "Taylor Swift's Father Figure isn't a cover, but an 'interpolation'. What that means – and why it matters",
          publisher: 'The Conversation',
          source_type: 'reputable_press',
          accessed_at: '2026-07-21',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'tloas-elizabeth-taylor-video-archival',
      title: 'Taylor never appears in the "Elizabeth Taylor" video',
      secret:
        'The March 31, 2026 video is built from archival footage of the real Elizabeth Taylor: scenes from Cleopatra, Cat on a Hot Tin Roof, A Place in the Sun, Giant and more, cut against newsreel film of her facing banks of photographers. It lists every film it draws on and thanks House of Taylor, the Elizabeth Taylor Trust, and the families of Mike Todd and Michael Wilding.',
      deeperLink: 'moment:vault-tloas-the-elizabeth-taylor-video-a-supercut-of-the-real-liz',
      provenance: 'sourced',
      media: [embed('WqbJT_vC0rs')],
      sources: [
        {
          source_url: 'https://variety.com/2026/music/news/taylor-swift-elizabeth-taylor-music-video-1236703350/',
          source_title: "Taylor Swift Releases 'Elizabeth Taylor' Music Video",
          publisher: 'Variety',
          source_type: 'reputable_press',
          accessed_at: '2026-07-08',
          reliability_score: 4,
        },
        {
          source_url:
            'https://www.goodmorningamerica.com/culture/story/taylor-swift-elizabeth-taylor-video-archival-footage-late-131576436',
          source_title: "Taylor Swift 'Elizabeth Taylor' video uses archival footage of the late actress",
          publisher: 'ABC News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-21',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'tloas-eldest-daughter-longest-track',
      title: 'Track five is also the longest song on the album',
      secret:
        '"Eldest Daughter" sits in the track-five slot, the one fans expect to hurt, and at 4:06 it is the longest of the twelve songs, five seconds ahead of the title track. It is also the only minor-key piano ballad on the record. Time read it as a break in the tradition: a track five that ends in reassurance instead of grief.',
      deeperLink: 'song:eldest-daughter',
      provenance: 'sourced',
      media: [embed('HwQnW_ZRKhc')],
      sources: [
        {
          source_url: 'https://time.com/7322849/taylor-swift-eldest-daughter-the-life-of-a-showgirl-track-5/',
          source_title:
            "Making Sense of 'Eldest Daughter,' Taylor Swift's Emotional The Life of a Showgirl Track 5",
          publisher: 'Time',
          source_type: 'reputable_press',
          accessed_at: '2026-07-08',
          reliability_score: 4,
        },
        {
          source_url: 'https://en.wikipedia.org/wiki/Eldest_Daughter',
          source_title: 'Eldest Daughter',
          publisher: 'Wikipedia',
          source_type: 'wiki',
          accessed_at: '2026-07-27',
          reliability_score: 2,
          notes: 'runtime (4:06, longest of the twelve) and credits',
        },
      ],
    },
    {
      slug: 'tloas-fate-of-ophelia-live-debut',
      title: '"The Fate of Ophelia" waited a year for its first live performance',
      secret:
        'The Showgirl lead single was not performed live until Oct. 17, 2026, more than a year after the album came out, when Taylor closed the Academy Museum Gala in Los Angeles with a four-song set. "This song, which we are playing for the very first time to you beautiful people, is called \'The Fate of Ophelia,\'" she told the room.',
      deeperLink: 'moment:vault-tloas-the-fate-of-ophelia-goes-live-for-the-first-time-closing-the',
      provenance: 'sourced',
      media: [embed('ko70cExuzZM')],
      sources: [
        {
          source_url:
            'https://stereogum.com/2514902/taylor-swift-performs-the-fate-of-ophelia-live-for-the-first-time-at-academy-museum-gala/news/',
          source_title:
            'Taylor Swift Performs "The Fate Of Ophelia" Live For The First Time At Academy Museum Gala',
          publisher: 'Stereogum',
          source_type: 'reputable_press',
          accessed_at: '2026-10-18',
          reliability_score: 4,
        },
        {
          source_url:
            'https://www.yahoo.com/entertainment/music/articles/taylor-swift-wows-dior-debuts-133454078.html',
          source_title: "Taylor Swift wows in Dior, debuts 'Fate of Ophelia' live at Academy Museum Gala",
          publisher: 'USA Today Network',
          source_type: 'reputable_press',
          accessed_at: '2026-10-18',
          reliability_score: 4,
          notes: "source of Taylor's on-stage quote",
        },
      ],
    },
    {
      slug: 'tloas-new-heights-announcement-crashed-stream',
      title: 'The album announcement crashed its own livestream',
      secret:
        'A countdown on her website ran out at 12:12 a.m. ET on Aug. 12, 2025, revealing the teaser. The full reveal aired the next evening on New Heights, her first-ever podcast appearance, and the livestream gave out about an hour and 44 minutes in with 1.3 million people watching at once. Guinness World Records certified that as the most concurrent views ever for a podcast on YouTube.',
      deeperLink: 'moment:vault-tloas-a-mint-green-briefcase-on-new-heights-album-no-12-announced-',
      provenance: 'sourced',
      media: [embed('M2lX9XESvDE', 'New Heights — official YouTube channel')],
      sources: [
        {
          source_url:
            'https://www.guinnessworldrecords.com/world-records/779144-most-concurrent-views-for-a-podcast-on-youtube',
          source_title: 'Most concurrent views for a podcast on YouTube',
          publisher: 'Guinness World Records',
          source_type: 'official',
          accessed_at: '2026-07-20',
          reliability_score: 5,
        },
        {
          source_url:
            'https://www.nbcnews.com/pop-culture/pop-culture-news/taylor-swift-sets-guinness-world-record-new-heights-podcast-appearance-rcna227245',
          source_title: "Taylor Swift sets Guinness World Record with 'New Heights' podcast appearance",
          publisher: 'NBC News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-08',
          reliability_score: 4,
        },
      ],
    },
  ],
};
