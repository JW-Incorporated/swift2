// Vault videos — evermore era (includes the Fearless/Red Taylor's Version
// window). Official uploads verified via YouTube oEmbed 2026-07-08; Wikipedia
// URLs verified the same day.

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
  eraSlug: 'evermore',
  videos: [
    {
      slug: 'willow-mv',
      kind: 'music_video',
      title: 'willow',
      director: 'Taylor Swift',
      releasedOn: '2020-12-11',
      relatedSongs: ['willow'],
      summary:
        'Picks up in the exact frame cardigan left off: from the piano, Taylor follows a golden thread through winter woods, a carnival tent, and firelit ritual circles to find the person on the other end.',
      symbolism:
        'The glowing thread is the "invisible string" made visible — the two sister-album videos form one continuous story fans treat as a diptych.',
      easterEggs: ['Opens inside the same piano the cardigan video ends in — a deliberate continuity handoff between sister albums.'],
      officialUrl: 'https://www.youtube.com/watch?v=RsEZmictANA',
      media: [embed('RsEZmictANA')],
      sources: [yt('RsEZmictANA', 'Taylor Swift - willow (Official Music Video)'), wiki('Willow_(song)', 'willow (song)')],
    },
    {
      slug: 'all-too-well-the-short-film',
      kind: 'short_film',
      title: 'All Too Well: The Short Film',
      director: 'Taylor Swift',
      releasedOn: '2021-11-12',
      relatedSongs: ['All Too Well (10 Minute Version)'],
      summary:
        'Fifteen minutes starring Sadie Sink and Dylan O\'Brien: the whole arc of the fan-canonized breakup epic — the refrigerator-light dance, the kitchen fight, the scarf — released with Red (Taylor\'s Version) and premiered theatrically.',
      symbolism:
        'The closing scene jumps years ahead to an author reading from a book titled All Too Well: the song\'s thesis that she keeps custody of the story by writing it.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=tollGa3S0o8',
      media: [embed('tollGa3S0o8')],
      sources: [
        yt('tollGa3S0o8', 'Taylor Swift - All Too Well: The Short Film'),
        wiki('All_Too_Well:_The_Short_Film', 'All Too Well: The Short Film', 'documents the theatrical premiere and its Grammy/VMA wins'),
      ],
    },
    {
      // YouTube-appearances research pass (2026-08-12): official upload
      // oEmbed-verified 2026-08-12 (title + author_name "Taylor Swift").
      slug: 'all-too-well-10-min-snl-performance',
      kind: 'performance',
      title: 'All Too Well (10 Minute Version) — Live on Saturday Night Live',
      director: null,
      releasedOn: '2021-11-13',
      relatedSongs: ['All Too Well (10 Minute Version)'],
      summary:
        'A rare single-song SNL musical-guest slot, one day after Red (Taylor\'s Version): the full ten minutes live on a leaf-strewn stage, short-film footage rolling behind her, snow falling by the last verse.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=nJr_8l0AEWE',
      media: [
        {
          kind: 'oembed',
          rights: 'platform_tos',
          provider: 'youtube',
          post_url: 'https://www.youtube.com/watch?v=nJr_8l0AEWE',
          oembed_fetched_at: '2026-08-12',
          attribution: 'Taylor Swift — official YouTube channel',
        },
      ],
      sources: [
        {
          source_url: 'https://www.youtube.com/watch?v=nJr_8l0AEWE',
          source_title: 'Taylor Swift - All Too Well (10 Minute Version) (Live on Saturday Night Live)',
          publisher: 'Taylor Swift (official YouTube channel)',
          source_type: 'official',
          accessed_at: '2026-08-12',
          reliability_score: 5,
          excerpt: null,
          notes: 'official upload — verified via YouTube oEmbed 2026-08-12',
        },
        press(
          'https://www.billboard.com/music/pop/taylor-swift-snl-all-too-well-10-minute-version-performance-video-9659774/',
          "'SNL': Taylor Swift Performs \"All Too Well (10 Minute Version)\"",
          'Billboard',
          'documents the single-song musical-guest slot and the short-film backdrop',
        ),
      ],
    },
    {
      slug: 'i-bet-you-think-about-me-mv',
      kind: 'music_video',
      title: 'I Bet You Think About Me',
      director: 'Blake Lively',
      releasedOn: '2021-11-15',
      relatedSongs: ['I Bet You Think About Me'],
      summary:
        'Blake Lively\'s directorial debut: Taylor crashes a pastel society wedding as the red-dressed ghost of relationships past, gleefully ruining the cake — the vault track as screwball comedy.',
      symbolism: 'She is the only thing in red in a room styled entirely in polite neutrals — the era\'s color used as a walking punchline.',
      easterEggs: [],
      officialUrl: null,
      media: [],
      sources: [
        wiki('I_Bet_You_Think_About_Me', 'I Bet You Think About Me'),
        press(
          'https://www.teenvogue.com/story/taylor-swift-i-bet-you-think-about-me-music-video-blake-lively',
          "Taylor Swift to Release 'I Bet You Think About Me' Music Video Directed By Blake Lively",
          'Teen Vogue',
          "supports Blake Lively's directorial debut and the music-video rollout",
        ),
      ],
    },
  ],
};
