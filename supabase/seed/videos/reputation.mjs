// Vault videos — reputation era. Official uploads verified via YouTube oEmbed
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
  eraSlug: 'reputation',
  videos: [
    {
      slug: 'look-what-you-made-me-do-mv',
      kind: 'music_video',
      title: 'Look What You Made Me Do',
      director: 'Joseph Kahn',
      releasedOn: '2017-08-27',
      relatedSongs: ['Look What You Made Me Do'],
      tags: ['Music'],
      summary:
        'The VMA-premiered resurrection: zombie Taylor claws out of a grave, a snake serves tea on a throne, and the finale lines up fifteen past Taylors to bicker over which one is fake.',
      symbolism:
        'Every set piece answers a headline from the preceding decade — the era\'s whole thesis is that she is burying the old narratives on camera.',
      easterEggs: [
        'The gravestone reads Nils Sjöberg — the pseudonym she used as a songwriter on "This Is What You Came For."',
        '"The old Taylor can\'t come to the phone right now" is delivered from atop a mountain of her past selves; the closing lineup of fifteen era-Taylors instead bickers over her old media narratives.',
        'The "Junior Jewels" shirt from You Belong with Me returns, now scrawled with her real friends\' names.',
      ],
      officialUrl: 'https://www.youtube.com/watch?v=3tmd-ClpJxA',
      media: [embed('3tmd-ClpJxA')],
      sources: [yt('3tmd-ClpJxA', 'Taylor Swift - Look What You Made Me Do'), wiki('Look_What_You_Made_Me_Do', 'Look What You Made Me Do')],
    },
    {
      slug: 'ready-for-it-mv',
      kind: 'music_video',
      title: '...Ready for It?',
      director: 'Joseph Kahn',
      releasedOn: '2017-10-26',
      relatedSongs: ['...Ready for It?'],
      tags: ['Music'],
      summary:
        'Cyberpunk Taylor vs. Taylor: a cloaked figure walks a neon corridor to confront a caged android version of herself — the robot cracks its shell and levels the wall between them.',
      symbolism:
        'Widely read (and reported) as public-image Taylor confronting the real one — the naked android is the self the armor was built around.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=wIft-t-MQuE',
      media: [embed('wIft-t-MQuE')],
      sources: [yt('wIft-t-MQuE', 'Taylor Swift - ...Ready For It?'), wiki('...Ready_for_It%3F', '...Ready for It?')],
    },
    {
      slug: 'end-game-mv',
      kind: 'music_video',
      title: 'End Game',
      director: 'Joseph Kahn',
      releasedOn: '2018-01-12',
      relatedSongs: ['End Game'],
      tags: ['Music'],
      summary:
        'A globe-hopping party flex — Miami boat lights, Tokyo arcades, London double-deckers — with Ed Sheeran and Future riding shotgun through the era\'s one pure hangout video.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=dfnCAmr569k',
      media: [embed('dfnCAmr569k')],
      sources: [yt('dfnCAmr569k', 'Taylor Swift - End Game ft. Ed Sheeran, Future'), wiki('End_Game_(Taylor_Swift_song)', 'End Game (Taylor Swift song)')],
    },
    {
      slug: 'delicate-mv',
      kind: 'music_video',
      title: 'Delicate',
      director: 'Joseph Kahn',
      releasedOn: '2018-03-11',
      relatedSongs: ['Delicate'],
      tags: ['Music'],
      summary:
        'Premiered at the iHeartRadio Awards: a note makes Taylor invisible mid-press-gauntlet, and she dances unwatched through a hotel — lobby, hallway, rain — until the note\'s magic runs out at a dive bar.',
      symbolism:
        'Invisibility as relief: the fame-armor drops the second nobody can see her, which is the lyric\'s whole ache — wanting one person to see through it on purpose.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=tCXGJQYZ9JA',
      media: [embed('tCXGJQYZ9JA')],
      sources: [yt('tCXGJQYZ9JA', 'Taylor Swift - Delicate'), wiki('Delicate_(Taylor_Swift_song)', 'Delicate (Taylor Swift song)')],
    },
    {
      slug: 'reputation-stadium-tour-film',
      kind: 'tour_film',
      title: 'Taylor Swift: reputation Stadium Tour',
      director: 'Paul Dugdale',
      releasedOn: '2018-12-31',
      relatedSongs: [],
      tags: ['Tour'],
      summary:
        'The Dallas stadium show, released to Netflix on New Year\'s Eve — the snake-throne era preserved in full, from the tilted stage to the Long Live/New Year\'s Day piano coda.',
      symbolism: null,
      easterEggs: [],
      // No official upload of the work itself exists — it is a Netflix original.
      // With no embed this record is HIDDEN from every reader-facing surface
      // rather than shown as a card that cannot play (playable-first rule,
      // docs/decisions.md 2026-08-13). Add a verified official upload here and
      // it comes back automatically — no code change needed.
      officialUrl: null,
      media: [],
      sources: [
        wiki('Taylor_Swift:_Reputation_Stadium_Tour', 'Taylor Swift: Reputation Stadium Tour'),
        press(
          'https://www.rollingstone.com/music/music-live-reviews/taylor-swift-reputation-stadium-tour-netflix-movie-review-773808/',
          "Taylor Swift's Reputation Film Shows Why She's One of the All-Time Greats",
          'Rolling Stone',
          'supports the Netflix concert-film release and Dallas stadium-show framing',
        ),
      ],
    },
  ],
};
