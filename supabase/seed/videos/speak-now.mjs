// Vault videos — Speak Now era. Official uploads verified via YouTube oEmbed
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
  eraSlug: 'speak-now',
  videos: [
    {
      slug: 'mine-mv',
      kind: 'music_video',
      title: 'Mine',
      director: 'Roman White',
      releasedOn: null,
      relatedSongs: ['Mine'],
      summary:
        'A whole imagined lifetime in four minutes: from café glance to kids and a kitchen argument and back — the flash-forward fantasy structure the song\'s "careless man\'s careful daughter" narrates.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=XPBwXKgDTdE',
      media: [embed('XPBwXKgDTdE')],
      sources: [yt('XPBwXKgDTdE', 'Taylor Swift - Mine'), wiki('Mine_(Taylor_Swift_song)', 'Mine (Taylor Swift song)')],
    },
    {
      slug: 'back-to-december-mv',
      kind: 'music_video',
      title: 'Back to December',
      director: 'Yoann Lemoine',
      releasedOn: null,
      relatedSongs: ['Back to December'],
      summary:
        'Snow falls indoors: Taylor writes an apology from a room slowly buried in winter while the boy she wronged moves through parallel scenes — her first video built on a single sustained visual metaphor.',
      symbolism: 'The encroaching snow literalizes the regret the lyric circles — December overtaking the room as the apology goes unanswered.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=QUwxKWT6m7U',
      media: [embed('QUwxKWT6m7U')],
      sources: [yt('QUwxKWT6m7U', 'Taylor Swift - Back To December'), wiki('Back_to_December', 'Back to December')],
    },
    {
      slug: 'mean-mv',
      kind: 'music_video',
      title: 'Mean',
      director: 'Declan Whitebloom',
      releasedOn: null,
      relatedSongs: ['Mean'],
      summary:
        'Banjo-vaudeville staging with a moral: the mocked kids of the verses grow up and out — into the big city, the stadium, the life the bully said they\'d never have — while the band plays a saloon set.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=jYa1eI1hpDE',
      media: [embed('jYa1eI1hpDE')],
      sources: [
        yt('jYa1eI1hpDE', 'Taylor Swift - Mean'),
        wiki('Mean_(song)', 'Mean (song)', 'the song later won two Grammys, sealing the video\'s underdog arc'),
      ],
    },
    {
      slug: 'the-story-of-us-mv',
      kind: 'music_video',
      title: 'The Story of Us',
      director: 'Noble Jones',
      releasedOn: null,
      relatedSongs: ['The Story of Us'],
      summary:
        'A library at war: two exes study tables apart as the silence gets louder, pages fly, and the "chapter" conceit of the lyric plays out in the stacks.',
      symbolism: null,
      easterEggs: [],
      officialUrl: null,
      media: [],
      sources: [
        wiki('The_Story_of_Us_(song)', 'The Story of Us (song)'),
        press(
          'https://tasteofcountry.com/taylor-swift-story-of-us-video/',
          "Taylor Swift Tells 'The Story of Us' in New Video",
          'Taste of Country',
          'supports the library-set music-video premise and premiere coverage',
        ),
      ],
    },
    {
      slug: 'speak-now-world-tour-live',
      kind: 'tour_film',
      title: 'Speak Now World Tour – Live',
      director: null,
      releasedOn: '2011-11-21',
      relatedSongs: [],
      summary:
        'The theatrical Speak Now show — aerial ballet, the levitating balcony, the sparkler-burst Long Live finale — captured across the 2011 arena run and released as a live CD/DVD.',
      symbolism: null,
      easterEggs: [],
      officialUrl: null,
      media: [],
      sources: [
        wiki('Speak_Now_World_Tour', 'Speak Now World Tour', 'the live album/film is documented in the tour article'),
        press(
          'https://www.hollywoodreporter.com/news/general-news/taylor-swift-speak-now-tour-live-cd-dvd-263669/',
          'Taylor Swift Announces Speak Now World Tour Live CD/DVD',
          'The Hollywood Reporter',
          'supports the live CD/DVD release and theatrical tour-film framing',
        ),
      ],
    },
  ],
};
