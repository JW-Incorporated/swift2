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
const embed = (id, fetchedOn = '2026-07-08') => ({
  kind: 'oembed',
  rights: 'platform_tos',
  provider: 'youtube',
  post_url: `https://www.youtube.com/watch?v=${id}`,
  oembed_fetched_at: fetchedOn,
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
      tags: ['Music'],
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
      tags: ['Music'],
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
      tags: ['Music'],
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
      tags: ['Music'],
      summary:
        'A library at war: two exes study tables apart as the silence gets louder, pages fly, and the "chapter" conceit of the lyric plays out in the stacks.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-13 (author_name "Taylor Swift", title
      // "Taylor Swift - The Story Of Us") — the 2011 original.
      officialUrl: 'https://www.youtube.com/watch?v=nN6VR92V70M',
      media: [embed('nN6VR92V70M', '2026-08-13')],
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
      slug: 'sparks-fly-mv',
      kind: 'music_video',
      title: 'Sparks Fly',
      director: null,
      releasedOn: null,
      relatedSongs: ['Sparks Fly'],
      tags: ['Music'],
      summary:
        'A live-performance video compiled from Speak Now World Tour footage, directed by Christian Lamb and released August 2011 — the album\'s fifth single.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=oKar-tF__ac',
      media: [embed('oKar-tF__ac')],
      sources: [yt('oKar-tF__ac', 'Taylor Swift - Sparks Fly'), wiki('Sparks_Fly_(song)', 'Sparks Fly (song)')],
    },
    {
      slug: 'ours-mv',
      kind: 'music_video',
      title: 'Ours',
      director: 'Declan Whitebloom',
      releasedOn: null,
      relatedSongs: ['Ours'],
      tags: ['Music'],
      summary:
        'Taylor plays an office worker grinding through corporate monotony — bus commute, water-cooler small talk — until the day ends at the airport, where she reunites with her boyfriend, a soldier returning home, played by Zach Gilford.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=LZ34LlaIk88',
      media: [embed('LZ34LlaIk88')],
      sources: [yt('LZ34LlaIk88', 'Taylor Swift - Ours'), wiki('Ours_(song)', 'Ours (song)')],
    },
    {
      slug: 'i-can-see-you-mv',
      kind: 'music_video',
      title: 'I Can See You',
      director: 'Taylor Swift',
      releasedOn: '2023-07-08',
      relatedSongs: ['I Can See You (Taylor\'s Version) (From the Vault)'],
      tags: ['Music', 'Tour'],
      summary:
        'A vault-track heist: Joey King, Taylor Lautner, and Presley Cash break Taylor out of imprisonment in a vault — a metaphor for reclaiming her masters — premiered live at the July 7, 2023 Kansas City stop of the Eras Tour, the night Speak Now (Taylor\'s Version) dropped.',
      symbolism: 'The vault break-out literalizes the re-recording project itself: taking her art back from Big Machine.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=lVkKLf4DCn8',
      media: [embed('lVkKLf4DCn8')],
      sources: [
        yt('lVkKLf4DCn8', "Taylor Swift - I Can See You (Taylor's Version) (From The Vault) (Official Video)"),
        wiki('I_Can_See_You_(song)', 'I Can See You (song)'),
      ],
    },
    {
      slug: 'speak-now-world-tour-live',
      kind: 'tour_film',
      title: 'Speak Now World Tour – Live',
      director: null,
      releasedOn: '2011-11-21',
      relatedSongs: [],
      tags: ['Tour'],
      summary:
        'The theatrical Speak Now show — aerial ballet, the levitating balcony, the confetti-showered Love Story finale performed from a flying balcony — captured across the 2011 arena run and released as a live CD/DVD.',
      symbolism: null,
      easterEggs: [],
      // No official upload of the work itself exists — it is a live CD/DVD release.
      // With no embed this record is HIDDEN from every reader-facing surface
      // rather than shown as a card that cannot play (playable-first rule,
      // docs/decisions.md 2026-08-13). Add a verified official upload here and
      // it comes back automatically — no code change needed.
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
    {
      slug: 'speak-now-live-letterman',
      kind: 'performance',
      title: 'Speak Now (Live on Letterman)',
      director: null,
      releasedOn: '2010-10-26',
      relatedSongs: ['Speak Now'],
      tags: ['Music'],
      summary:
        'A solo performance of the title track on the Late Show with David Letterman, taped the day after the album\'s October 25, 2010 release.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=4wUPASp2hfY',
      media: [embed('4wUPASp2hfY', '2026-08-25')],
      sources: [
        yt('4wUPASp2hfY', 'Taylor Swift - Speak Now (Live on Letterman)'),
        wiki('Speak_Now_(song)', 'Speak Now (song)', 'confirms the October 26, 2010 Late Show with David Letterman performance'),
      ],
    },
    {
      slug: 'back-to-december-live-letterman',
      kind: 'performance',
      title: 'Back to December (Live on Letterman)',
      director: null,
      releasedOn: null,
      relatedSongs: ['Back to December'],
      tags: ['Music'],
      summary:
        'A solo TV performance of the Speak Now ballad on the Late Show with David Letterman, part of the same album-era promotional run that put "Speak Now" and "Mine" on the show.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=vio0RidOMUM',
      media: [embed('vio0RidOMUM', '2026-08-25')],
      sources: [
        yt('vio0RidOMUM', 'Taylor Swift - Back To December (Live on Letterman)'),
        wiki('Back_to_December', 'Back to December'),
      ],
    },
    {
      slug: 'mine-live-letterman',
      kind: 'performance',
      title: 'Mine (Live on Letterman)',
      director: null,
      releasedOn: null,
      relatedSongs: ['Mine'],
      tags: ['Music'],
      summary:
        'A solo TV performance of the Speak Now lead single on the Late Show with David Letterman, part of the same album-era promotional run that put "Speak Now" and "Back to December" on the show.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=xcLIGAIkztc',
      media: [embed('xcLIGAIkztc', '2026-08-25')],
      sources: [
        yt('xcLIGAIkztc', 'Taylor Swift - Mine (Live on Letterman)'),
        wiki('Mine_(Taylor_Swift_song)', 'Mine (Taylor Swift song)'),
      ],
    },
  ],
};
