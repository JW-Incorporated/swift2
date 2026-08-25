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

import { appearance, pressSource, upload } from './_appearance-helpers.mjs';

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
      tags: ['Music'],
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
      tags: ['Music'],
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
      tags: ['Music'],
      summary:
        'Front-porch performance piece — barefoot on the steps in a blue dress, then a flower-drenched fantasy set, for the song she wrote for her ninth-grade talent show.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=Jb2stN7kH28',
      media: [embed('Jb2stN7kH28')],
      sources: [yt('Jb2stN7kH28', 'Taylor Swift - Our Song'), wiki('Our_Song_(Taylor_Swift_song)', 'Our Song (Taylor Swift song)')],
    },
    {
      slug: 'shouldve-said-no-mv',
      kind: 'music_video',
      title: "Should've Said No",
      director: 'Trey Fanjoy',
      releasedOn: null,
      relatedSongs: ["Should've Said No"],
      tags: ['Music'],
      summary:
        'Built from her live 43rd ACM Awards performance: hooded-sweatshirt confessional through a costume change into a black dress, closing on the last lines sung in pouring stage rain.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=v9bxXO9fj98',
      media: [embed('v9bxXO9fj98')],
      sources: [
        yt('v9bxXO9fj98', "Should've Said No"),
        wiki("Should've_Said_No", "Should've Said No"),
      ],
    },
    {
      slug: 'picture-to-burn-mv',
      kind: 'music_video',
      title: 'Picture to Burn',
      director: 'Trey Fanjoy',
      releasedOn: null,
      relatedSongs: ['Picture to Burn'],
      tags: ['Music'],
      summary:
        'Revenge fantasy: Taylor and her friend Abigail spy on the ex from a parked truck, then Taylor leads her band inside to trash his house in her imagination while Abigail keeps watch outside — the first of many satirical self-aware villain turns.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-13 (author_name "Taylor Swift", title
      // "Taylor Swift - Picture To Burn").
      officialUrl: 'https://www.youtube.com/watch?v=yCMqcFAigRg',
      media: [embed('yCMqcFAigRg', '2026-08-13')],
      sources: [
        wiki('Picture_to_Burn', 'Picture to Burn'),
        press(
          'https://theboot.com/video-premiere-picture-to-burn-taylor-swift/',
          "Video Premiere: 'Picture to Burn,' Taylor Swift",
          'The Boot',
          'supports the music-video premiere and early-video revenge-comedy framing',
        ),
      ],
    },
    // ── Appearances (YouTube-appearances pass, 2026-08-12) ──────────────────
    appearance({
      slug: 'ellen-first-interview-2008',
      kind: 'interview',
      title: 'First interview on The Ellen DeGeneres Show',
      releasedOn: '2008-01-17',
      summary:
        "Eighteen years old and one album in, with 'Teardrops on My Guitar' crossing over to pop radio: her first talk-show sit-down, on a couch she would keep coming back to for the next decade.",
      youtubeId: 'vBgiDYBCuxY',
      channel: 'TheEllenShow',
      sources: [
        upload({
          youtubeId: 'vBgiDYBCuxY',
          title: "Taylor Swift's First Interview with Ellen!",
          channel: 'TheEllenShow',
        }),
        pressSource(
          'https://www.billboard.com/music/music-news/taylor-swift-ellen-appearances-8511659/',
          "Taylor Swift's Best Moments on 'Ellen'",
          'Billboard',
          'dates the first appearance to Jan. 17, 2008 and tracks the run of return visits',
        ),
      ],
    }),
  ],
};
