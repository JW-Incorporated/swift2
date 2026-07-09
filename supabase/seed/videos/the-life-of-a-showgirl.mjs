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
      officialUrl: null,
      media: [],
      sources: [wiki('The_Fate_of_Ophelia', 'The Fate of Ophelia')],
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
      sources: [wiki('The_Official_Release_Party_of_a_Showgirl', 'The Official Release Party of a Showgirl')],
    },
  ],
};
