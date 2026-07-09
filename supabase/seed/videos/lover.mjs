// Vault videos — Lover era. Official uploads verified via YouTube oEmbed
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
const embed = (id) => ({
  kind: 'oembed',
  rights: 'platform_tos',
  provider: 'youtube',
  post_url: `https://www.youtube.com/watch?v=${id}`,
  oembed_fetched_at: '2026-07-08',
  attribution: 'Taylor Swift — official YouTube channel',
});

export default {
  eraSlug: 'lover',
  videos: [
    {
      slug: 'me-mv',
      kind: 'music_video',
      title: 'ME!',
      director: 'Dave Meyers & Taylor Swift',
      releasedOn: '2019-04-26',
      relatedSongs: ['ME!'],
      summary:
        'The era-flip: a French-arguing snake bursts into pastel butterflies, and the rest is a candy-colored musical-theater fever dream with Brendon Urie — released 4/26 after a fan-tracked countdown.',
      symbolism: 'The snake-to-butterflies opening is the official handoff from reputation to Lover, staged in one cut.',
      easterEggs: [
        'The Kelsey Montague butterfly mural in Nashville went up hours before the drop as a real-world clue.',
        'A neon "Lover" sign appears months before the album title was announced.',
      ],
      officialUrl: 'https://www.youtube.com/watch?v=FuXNumBwDOM',
      media: [embed('FuXNumBwDOM')],
      sources: [yt('FuXNumBwDOM', 'Taylor Swift - ME! (feat. Brendon Urie of Panic! At The Disco)'), wiki('Me!', 'ME!')],
    },
    {
      slug: 'you-need-to-calm-down-mv',
      kind: 'music_video',
      title: 'You Need to Calm Down',
      director: 'Drew Kirsch & Taylor Swift',
      releasedOn: '2019-06-17',
      relatedSongs: ['You Need to Calm Down'],
      summary:
        'A trailer-park block party stacked with LGBTQ icons — and a mid-video Katy Perry burger-and-fries reconciliation — ending on a title card for the Equality Act petition.',
      symbolism: null,
      easterEggs: ['The burger-and-fries costumes end the long-running Katy Perry feud on camera.'],
      officialUrl: 'https://www.youtube.com/watch?v=Dkk9gvTmCXY',
      media: [embed('Dkk9gvTmCXY')],
      sources: [yt('Dkk9gvTmCXY', 'Taylor Swift - You Need To Calm Down'), wiki('You_Need_to_Calm_Down', 'You Need to Calm Down')],
    },
    {
      slug: 'lover-mv',
      kind: 'music_video',
      title: 'Lover',
      director: 'Drew Kirsch',
      releasedOn: '2019-08-22',
      relatedSongs: ['Lover'],
      summary:
        'A couple lives inside a dollhouse where every room is a different color and mood — an image fans never stopped decoding, especially once the Eras Tour opened with the Lover set.',
      symbolism:
        'The house-of-rooms was later read as a map of her discography\'s moods; the "Lover house" became load-bearing fan canon for era iconography.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=-BjZmE2gtdo',
      media: [embed('-BjZmE2gtdo')],
      sources: [yt('-BjZmE2gtdo', 'Taylor Swift - Lover (Official Music Video)'), wiki('Lover_(Taylor_Swift_song)', 'Lover (Taylor Swift song)')],
    },
    {
      slug: 'the-man-mv',
      kind: 'music_video',
      title: 'The Man',
      director: 'Taylor Swift',
      releasedOn: '2020-02-27',
      relatedSongs: ['The Man'],
      summary:
        'Her solo directorial debut: buried under prosthetics, Taylor plays "Tyler" — the swaggering executive whose every entitled move the song calls out — until the credits reveal the trick.',
      symbolism:
        'The double-standard satire is the point: the same behavior reads as boss-like on a man, so she performs it as one. Her father cameos as the tennis umpire.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=AqAJLh9wuZ0',
      media: [embed('AqAJLh9wuZ0')],
      sources: [yt('AqAJLh9wuZ0', 'Taylor Swift - The Man (Official Video)'), wiki('The_Man_(Taylor_Swift_song)', 'The Man (Taylor Swift song)')],
    },
    {
      slug: 'miss-americana',
      kind: 'documentary',
      title: 'Miss Americana',
      director: 'Lana Wilson',
      releasedOn: '2020-01-31',
      relatedSongs: [],
      summary:
        'The Netflix documentary that opened the vault for real: the eating-disorder disclosure, the political-silence breaking point, and the Lover sessions — Sundance premiere, then streaming.',
      symbolism: null,
      easterEggs: [],
      officialUrl: null,
      media: [],
      sources: [wiki('Miss_Americana', 'Miss Americana')],
    },
    {
      slug: 'city-of-lover',
      kind: 'performance',
      title: 'Taylor Swift: City of Lover',
      director: null,
      releasedOn: '2020-05-17',
      relatedSongs: [],
      summary:
        'The one-night Paris concert special that became the Lover era\'s only live document after the pandemic canceled Lover Fest — aired on ABC, intimate theater instead of stadiums.',
      symbolism: null,
      easterEggs: [],
      officialUrl: null,
      media: [],
      sources: [wiki('Taylor_Swift_City_of_Lover_Concert', 'Taylor Swift City of Lover Concert')],
    },
  ],
};
