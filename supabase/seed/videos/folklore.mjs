// Vault videos — folklore era. Official uploads verified via YouTube oEmbed
// 2026-07-08; Wikipedia URLs verified the same day.

const wiki = (article, title, notes) => ({
  source_url: `https://en.wikipedia.org/wiki/${article}`,
  source_title: title,
  publisher: 'Wikipedia',
  source_type: 'wiki',
  accessed_at: '2026-07-08',
  reliability_score: 2,
  excerpt: null,
  notes: notes ?? 'anchors the video, director, and background',
});
const yt = (id, title) => ({
  source_url: `https://www.youtube.com/watch?v=${id}`,
  source_title: title,
  publisher: 'Taylor Swift (official YouTube channel)',
  source_type: 'official',
  accessed_at: '2026-07-08',
  reliability_score: 5,
  excerpt: null,
  notes: 'official upload — verified via YouTube oEmbed 2026-07-08',
});
const press = (source_url, source_title, publisher, notes) => ({
  source_url,
  source_title,
  publisher,
  source_type: 'reputable_press',
  accessed_at: '2026-07-09',
  reliability_score: 4,
  excerpt: null,
  notes,
});
const embed = (id) => ({
  kind: 'oembed',
  rights: 'platform_tos',
  provider: 'youtube',
  post_url: `https://www.youtube.com/watch?v=${id}`,
  oembed_fetched_at: '2026-07-08',
  attribution: 'Taylor Swift — official YouTube channel',
});

export default {
  eraSlug: 'folklore',
  videos: [
    {
      slug: 'cardigan-mv',
      kind: 'music_video',
      title: 'cardigan',
      director: 'Taylor Swift',
      releasedOn: '2020-07-24',
      relatedSongs: ['cardigan'],
      tags: ['Music'],
      summary:
        'Self-directed under COVID protocols and released with the surprise album: a glowing piano becomes a portal from a candlelit cabin to a mossy forest to a storm-tossed sea, and back to safety under a cardigan.',
      symbolism:
        'The piano-portal is the act of songwriting itself — climbing into the instrument to survive the wilderness and the deep water, then coming home.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=K-a8s8OLBSE',
      media: [embed('K-a8s8OLBSE')],
      sources: [yt('K-a8s8OLBSE', 'Taylor Swift - cardigan'), wiki('Cardigan_(song)', 'cardigan (song)')],
    },
    {
      slug: 'folklore-long-pond-studio-sessions-film',
      kind: 'documentary',
      title: 'folklore: the long pond studio sessions',
      director: 'Taylor Swift',
      releasedOn: '2020-11-25',
      relatedSongs: [],
      tags: ['Music'],
      summary:
        'The Disney+ film where folklore got its liner notes out loud: Taylor, Aaron Dessner and Jack Antonoff play the album through in a woodland studio and explain it song by song — including the William Bowery reveal.',
      symbolism: null,
      easterEggs: [],
      // The film itself is Disney+-exclusive, so there is no official full
      // upload to point `officialUrl` at — it stays null. What DOES exist is
      // the official trailer on Taylor's own channel (oEmbed-verified
      // 2026-08-12, author_name "Taylor Swift"), added by the
      // YouTube-appearances research pass so this record carries a real
      // embeddable official asset instead of nothing.
      officialUrl: null,
      media: [
        {
          kind: 'oembed',
          rights: 'platform_tos',
          provider: 'youtube',
          post_url: 'https://www.youtube.com/watch?v=jgdFUoZzCI0',
          oembed_fetched_at: '2026-08-12',
          attribution: 'Taylor Swift — official YouTube channel (official trailer)',
        },
      ],
      sources: [
        wiki('Folklore:_The_Long_Pond_Studio_Sessions', 'Folklore: The Long Pond Studio Sessions'),
        press(
          'https://www.teenvogue.com/story/taylor-swift-folklore-special-disney-plus',
          'Taylor Swift Is Releasing a "Folklore" Special on Disney+',
          'Teen Vogue',
          'supports the Disney+ surprise-release timing and film premise',
        ),
        {
          source_url: 'https://www.youtube.com/watch?v=jgdFUoZzCI0',
          source_title: 'folklore: the long pond studio sessions | Official Trailer',
          publisher: 'Taylor Swift (official YouTube channel)',
          source_type: 'official',
          accessed_at: '2026-08-12',
          reliability_score: 5,
          excerpt: null,
          notes: 'official trailer upload — verified via YouTube oEmbed 2026-08-12',
        },
      ],
    },
  ],
};
