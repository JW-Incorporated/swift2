// Vault videos — The Life of a Showgirl era.
// NOTE: the `the-life-of-a-showgirl` era row lands in rollout PR 2; this file
// seeds cleanly once it exists (the validator knows the slug as expected).
// Wikipedia URLs verified reachable 2026-07-08.

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
const yt = (id, title) => ({
  source_url: `https://www.youtube.com/watch?v=${id}`,
  source_title: title,
  publisher: 'Taylor Swift (official YouTube channel)',
  source_type: 'official',
  accessed_at: '2026-07-09',
  reliability_score: 5,
  excerpt: null,
  notes: 'official upload — verified via YouTube oEmbed 2026-07-09',
});
const embed = (id) => ({
  kind: 'oembed',
  rights: 'platform_tos',
  provider: 'youtube',
  post_url: `https://www.youtube.com/watch?v=${id}`,
  oembed_fetched_at: '2026-07-09',
  attribution: 'Taylor Swift — official YouTube channel',
});

export default {
  eraSlug: 'the-life-of-a-showgirl',
  videos: [
    {
      slug: 'the-fate-of-ophelia-mv',
      kind: 'music_video',
      title: 'The Fate of Ophelia',
      director: 'Taylor Swift',
      releasedOn: null,
      relatedSongs: ['The Fate of Ophelia'],
      summary:
        'The lead single\'s video premiered as the centerpiece of the release-party theatrical event: showgirl staging that pulls Ophelia out of the water and onto the stage, inverting the Hamlet ending.',
      symbolism: 'Rescue-by-love replaces the drowning — the era\'s glitter is framed as the survivable version of the tragedy.',
      easterEggs: [],
      // Fix (issue #1140): was youtubeId/officialUrl null (dead card) despite
      // the correct, oEmbed-verified id already living on the track record
      // (tracks/the-life-of-a-showgirl.mjs). Re-verified via oEmbed this pass.
      officialUrl: 'https://www.youtube.com/watch?v=ko70cExuzZM',
      media: [embed('ko70cExuzZM')],
      sources: [
        wiki('The_Fate_of_Ophelia', 'The Fate of Ophelia'),
        press(
          'https://people.com/taylor-swift-the-fate-of-ophelia-music-video-11823344',
          'Taylor Swift Debuts The Fate of Ophelia Music Video After Premiering It at Life of a Showgirl Movie Event',
          'People',
          'supports the music-video premiere timing and Swift directorial credit',
        ),
        yt('ko70cExuzZM', 'Taylor Swift - The Fate of Ophelia (Official Music Video)'),
      ],
    },
    {
      slug: 'opalite-mv',
      kind: 'music_video',
      title: 'Opalite',
      director: null,
      releasedOn: '2026-01-12',
      relatedSongs: ['Opalite'],
      summary:
        'A 1990s-styled rom-com in which Swift\'s lonely Pet Rock owner and Domhnall Gleeson\'s cactus owner are brought together by a magical "Opalite" spray — released as the era\'s second single.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=1FVF-9KQiPo',
      media: [embed('1FVF-9KQiPo')],
      sources: [
        yt('1FVF-9KQiPo', 'Taylor Swift - Opalite (Official Music Video)'),
        wiki('Opalite_(song)', 'Opalite (song)'),
      ],
    },
    {
      slug: 'elizabeth-taylor-mv',
      kind: 'music_video',
      title: 'Elizabeth Taylor',
      director: null,
      releasedOn: '2026-03-09',
      relatedSongs: ['Elizabeth Taylor'],
      summary:
        'The album\'s third single, named for the screen icon, arrives with its own official video as part of an extended single cycle five months after the album\'s release.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=WqbJT_vC0rs',
      media: [embed('WqbJT_vC0rs')],
      sources: [
        yt('WqbJT_vC0rs', 'Taylor Swift - Elizabeth Taylor (Official Music Video)'),
        wiki('The_Life_of_a_Showgirl', 'The Life of a Showgirl', 'album article documents the single cycle and release dates'),
      ],
    },
    {
      slug: 'the-official-release-party-of-a-showgirl',
      kind: 'performance',
      title: 'The Official Release Party of a Showgirl',
      director: null,
      releasedOn: '2025-10-03',
      relatedSongs: [],
      summary:
        'Release weekend as a cinema event: the Ophelia video premiere, lyric videos, and behind-the-scenes cuts packaged into a theatrical party that topped the box office on album weekend.',
      symbolism: null,
      easterEggs: [],
      officialUrl: null,
      media: [],
      sources: [
        wiki('The_Official_Release_Party_of_a_Showgirl', 'The Official Release Party of a Showgirl'),
        press(
          'https://people.com/taylor-swift-the-fate-of-ophelia-music-video-11823344',
          'Taylor Swift Debuts The Fate of Ophelia Music Video After Premiering It at Life of a Showgirl Movie Event',
          'People',
          'supports the October 2025 movie-event framing tied to the video premiere',
        ),
      ],
    },
  ],
};
