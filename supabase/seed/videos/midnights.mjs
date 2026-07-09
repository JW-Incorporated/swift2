// Vault videos — Midnights / Eras Tour era. Official uploads verified via
// YouTube oEmbed 2026-07-08; Wikipedia URLs verified the same day.

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
const embed = (id) => ({
  kind: 'oembed',
  rights: 'platform_tos',
  provider: 'youtube',
  post_url: `https://www.youtube.com/watch?v=${id}`,
  oembed_fetched_at: '2026-07-08',
  attribution: 'Taylor Swift — official YouTube channel',
});

export default {
  eraSlug: 'midnights',
  videos: [
    {
      slug: 'anti-hero-mv',
      kind: 'music_video',
      title: 'Anti-Hero',
      director: 'Taylor Swift',
      releasedOn: '2022-10-21',
      relatedSongs: ['Anti-Hero'],
      summary:
        'Self-directed release-day centerpiece: Taylor hosts a house party for her own worst selves — a giant "monster on the hill" at the dinner table, a ghost at her funeral, and heirs squabbling over her will.',
      symbolism:
        'Every setpiece literalizes a lyric: the too-big self at the table, the future reading of the will, the "it\'s me, hi" doubles — self-loathing staged as sitcom.',
      easterEggs: ['The squabbling funeral beneficiaries are played by comedians Mike Birbiglia, John Early and Mary Elizabeth Ellis — the will scene fans quote line-for-line.'],
      officialUrl: 'https://www.youtube.com/watch?v=b1kbLwvqugk',
      media: [embed('b1kbLwvqugk')],
      sources: [yt('b1kbLwvqugk', 'Taylor Swift - Anti-Hero (Official Music Video)'), wiki('Anti-Hero_(song)', 'Anti-Hero (song)')],
    },
    {
      slug: 'bejeweled-mv',
      kind: 'music_video',
      title: 'Bejeweled',
      director: 'Taylor Swift',
      releasedOn: '2022-10-25',
      relatedSongs: ['Bejeweled'],
      summary:
        'A Cinderella retelling with Laura Dern as the wicked stepmother, HAIM as stepsisters and Dita Von Teese in the martini glass — and, by Taylor\'s own warning, packed wall-to-wall with easter eggs.',
      symbolism: null,
      easterEggs: [
        'The elevator button for floor 3 lights up — read (correctly) as pointing at album #3, Speak Now.',
        'The purple gown and castle staging were decoded as Speak Now (Taylor\'s Version) signals months before its Nashville announcement.',
      ],
      officialUrl: 'https://www.youtube.com/watch?v=b7QlX3yR2xs',
      media: [embed('b7QlX3yR2xs')],
      sources: [yt('b7QlX3yR2xs', 'Taylor Swift - Bejeweled (Official Music Video)'), wiki('Bejeweled_(song)', 'Bejeweled (song)')],
    },
    {
      slug: 'lavender-haze-mv',
      kind: 'music_video',
      title: 'Lavender Haze',
      director: 'Taylor Swift',
      releasedOn: '2023-01-27',
      relatedSongs: ['Lavender Haze'],
      summary:
        'The album\'s dreamiest visual: a purple fog rolls through a 70s-styled apartment, koi swim across the ceiling, and Taylor drifts from bed to a lavender field without the night ever ending.',
      symbolism: 'The all-consuming lavender cloud is the song\'s borrowed 50s idiom for being untouchably in love — weather instead of narrative.',
      easterEggs: [],
      officialUrl: null,
      media: [],
      sources: [wiki('Lavender_Haze', 'Lavender Haze')],
    },
    {
      slug: 'karma-mv',
      kind: 'music_video',
      title: 'Karma (feat. Ice Spice)',
      director: 'Taylor Swift',
      releasedOn: null,
      relatedSongs: ['Karma'],
      summary:
        'Released with the Til Dawn edition remix: cosmic Taylor rides mythological karma imagery — a giant cat, a wrecking-ball moon — with Ice Spice materializing for the new verse.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=XzOvgu3GPwY',
      media: [embed('XzOvgu3GPwY')],
      sources: [yt('XzOvgu3GPwY', 'Taylor Swift ft. Ice Spice - Karma (Official Music Video)'), wiki('Karma_(Taylor_Swift_song)', 'Karma (Taylor Swift song)')],
    },
    {
      slug: 'taylor-swift-the-eras-tour-film',
      kind: 'tour_film',
      title: 'Taylor Swift: The Eras Tour',
      director: 'Sam Wrench',
      releasedOn: '2023-10-13',
      relatedSongs: [],
      summary:
        'The SoFi Stadium shows cut into a theatrical event that broke the all-time concert-film box-office record — released straight to cinemas on a distribution deal negotiated with AMC itself.',
      symbolism: null,
      easterEggs: [],
      officialUrl: null,
      media: [],
      sources: [wiki('Taylor_Swift:_The_Eras_Tour', 'Taylor Swift: The Eras Tour')],
    },
  ],
};
