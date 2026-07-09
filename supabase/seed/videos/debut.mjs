// Vault videos — debut era. Official uploads verified via YouTube oEmbed
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
  eraSlug: 'debut',
  videos: [
    {
      slug: 'tim-mcgraw-mv',
      kind: 'music_video',
      title: 'Tim McGraw',
      director: 'Trey Fanjoy',
      releasedOn: null,
      relatedSongs: ['Tim McGraw'],
      summary:
        'The first video: a sun-flared lakeside memory reel — a 16-year-old Taylor in a white sundress, a Chevy truck, a summer already turning into a song about being remembered.',
      symbolism:
        'Establishes the visual grammar her early videos reuse: golden-hour nostalgia, the letter/memory motif, and Taylor as narrator of her own past.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=GkD20ajVxnY',
      media: [embed('GkD20ajVxnY')],
      sources: [yt('GkD20ajVxnY', 'Taylor Swift - Tim McGraw'), wiki('Tim_McGraw_(song)', 'Tim McGraw (song)')],
    },
    {
      slug: 'teardrops-on-my-guitar-mv',
      kind: 'music_video',
      title: 'Teardrops on My Guitar',
      director: 'Trey Fanjoy',
      releasedOn: null,
      relatedSongs: ['Teardrops on My Guitar'],
      summary:
        'High-school hallways and a bedroom confessional: Taylor watches Drew from the next locker over, then tells the guitar what she can\'t tell him.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=xKCek6_dB0M',
      media: [embed('xKCek6_dB0M')],
      sources: [yt('xKCek6_dB0M', 'Taylor Swift - Teardrops On My Guitar'), wiki('Teardrops_on_My_Guitar', 'Teardrops on My Guitar')],
    },
    {
      slug: 'our-song-mv',
      kind: 'music_video',
      title: 'Our Song',
      director: 'Trey Fanjoy',
      releasedOn: null,
      relatedSongs: ['Our Song'],
      summary:
        'Front-porch performance piece — barefoot on the steps in a blue dress, then a flower-drenched fantasy set, for the song she wrote for her ninth-grade talent show.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=Jb2stN7kH28',
      media: [embed('Jb2stN7kH28')],
      sources: [yt('Jb2stN7kH28', 'Taylor Swift - Our Song'), wiki('Our_Song_(Taylor_Swift_song)', 'Our Song (Taylor Swift song)')],
    },
    {
      slug: 'picture-to-burn-mv',
      kind: 'music_video',
      title: 'Picture to Burn',
      director: 'Trey Fanjoy',
      releasedOn: null,
      relatedSongs: ['Picture to Burn'],
      summary:
        'Revenge-fantasy split-screen: Taylor and her band trash an ex\'s house in her imagination while she sits primly in the truck outside — the first of many satirical self-aware villain turns.',
      symbolism: null,
      easterEggs: [],
      officialUrl: null,
      media: [],
      sources: [wiki('Picture_to_Burn', 'Picture to Burn')],
    },
  ],
};
