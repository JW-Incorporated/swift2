// Vault videos — Fearless era. Official uploads verified via YouTube oEmbed
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

import { appearance, upload } from './_appearance-helpers.mjs';

export default {
  eraSlug: 'fearless',
  videos: [
    {
      slug: 'love-story-mv',
      kind: 'music_video',
      title: 'Love Story',
      director: 'Trey Fanjoy',
      releasedOn: null,
      relatedSongs: ['Love Story'],
      summary:
        'The period-piece blockbuster: a campus meet-cute dissolves into a full Regency-styled castle romance, ballgown and all, ending with the two reunited across a field — the happy ending the song writes over Romeo and Juliet.',
      symbolism:
        'The dual-timeline device (present-day glance, imagined past) became a signature she returned to through Wildest Dreams and beyond.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=8xg3vE8Ie_E',
      media: [embed('8xg3vE8Ie_E')],
      sources: [yt('8xg3vE8Ie_E', 'Taylor Swift - Love Story'), wiki('Love_Story_(Taylor_Swift_song)', 'Love Story (Taylor Swift song)')],
    },
    {
      slug: 'you-belong-with-me-mv',
      kind: 'music_video',
      title: 'You Belong with Me',
      director: 'Roman White',
      releasedOn: null,
      relatedSongs: ['You Belong with Me'],
      summary:
        'Taylor plays both the band-tee girl next door and the brunette cheer captain across the driveway — window-sign confessions, a prom-night reveal, and the era\'s defining underdog fantasy.',
      symbolism:
        'Casting herself as her own rival literalizes the song\'s point-of-view trick; the "I love you" window sign became one of her most-referenced images.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=VuNIsY6JdUw',
      media: [embed('VuNIsY6JdUw')],
      sources: [
        yt('VuNIsY6JdUw', 'Taylor Swift - You Belong With Me'),
        wiki('You_Belong_with_Me', 'You Belong with Me', 'also documents the 2009 VMA Best Female Video win and the interrupted acceptance speech'),
      ],
    },
    {
      slug: 'white-horse-mv',
      kind: 'music_video',
      title: 'White Horse',
      director: 'Trey Fanjoy',
      releasedOn: null,
      relatedSongs: ['White Horse'],
      summary:
        'The anti-fairytale companion to Love Story: a dim apartment, a phone that shouldn\'t be answered, and a breakup played in intercut apology scenes — no castle, no rescue.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-13 (author_name "Taylor Swift", title "Taylor
      // Swift - White Horse") — the 2009 original, matching this record's
      // MTV News source. Several "official music video" results for this song
      // are fan re-uploads; this is the copy on her own channel.
      officialUrl: 'https://www.youtube.com/watch?v=D1Xr-JFLxik',
      media: [embed('D1Xr-JFLxik', '2026-08-13')],
      sources: [
        wiki('White_Horse_(Taylor_Swift_song)', 'White Horse (Taylor Swift song)'),
        press(
          'https://web.archive.org/web/20121106152258/http://www.mtv.com/news/articles/1602728/taylor-swift-talks-about-emotional-new-video-white-horse.jhtml',
          "Taylor Swift Talks About 'Emotional' New Video For 'White Horse'",
          'MTV News',
          'supports the White Horse video concept and Trey Fanjoy/Stephen Colletti production context',
        ),
      ],
    },
    {
      slug: 'fifteen-mv',
      kind: 'music_video',
      title: 'Fifteen',
      director: 'Roman White',
      releasedOn: null,
      relatedSongs: ['Fifteen'],
      summary:
        'A greenhouse-dream staging of freshman year: scenes bloom and dissolve around Taylor as she narrates Abigail\'s story and her own — memory rendered as a garden being planted and unplanted.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-13 (author_name "Taylor Swift", title
      // "Taylor Swift - Fifteen") — the 2009 original.
      officialUrl: 'https://www.youtube.com/watch?v=Pb-K2tXWK4w',
      media: [embed('Pb-K2tXWK4w', '2026-08-13')],
      sources: [
        wiki('Fifteen_(Taylor_Swift_song)', 'Fifteen (Taylor Swift song)'),
        press(
          'https://web.archive.org/web/20150327105811/http://www.mtv.com/news/1646390/taylor-swift-flashed-back-to-high-school-for-vma-nominated-fifteen/',
          "Taylor Swift Flashed Back To High School For VMA-Nominated 'Fifteen'",
          'MTV News',
          'supports the Roman White concept, green-screen memory-world production, and VMA nomination context',
        ),
      ],
    },
    {
      slug: 'the-best-day-mv',
      kind: 'music_video',
      title: 'The Best Day',
      director: null,
      releasedOn: null,
      relatedSongs: ['The Best Day'],
      summary:
        'A home-movie tribute assembled from Taylor family footage — childhood birthdays, ordinary afternoons with her mother — released as a Mother\'s Day surprise.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=l4_6eQm7RTQ',
      media: [embed('l4_6eQm7RTQ')],
      sources: [yt('l4_6eQm7RTQ', 'Taylor Swift - The Best Day'), wiki('The_Best_Day_(Taylor_Swift_song)', 'The Best Day (Taylor Swift song)')],
    },
    {
      slug: 'fearless-mv',
      kind: 'music_video',
      title: 'Fearless',
      director: null,
      releasedOn: '2010-01-01',
      relatedSongs: ['Fearless'],
      summary:
        'A live-performance-style video built from touring footage for the album\'s title track, released as its final single.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=ptSjNWnzpjg',
      media: [embed('ptSjNWnzpjg')],
      sources: [yt('ptSjNWnzpjg', 'Taylor Swift - Fearless'), wiki('Fearless_(Taylor_Swift_song)', 'Fearless (Taylor Swift song)')],
    },
    {
      slug: 'the-best-day-taylors-version-mv',
      kind: 'music_video',
      title: "The Best Day (Taylor's Version)",
      director: null,
      releasedOn: '2021-04-09',
      relatedSongs: ['The Best Day (Taylor\'s Version)'],
      summary:
        'A new home-movie video built from never-before-seen family footage spanning her childhood to young adulthood, released three weeks after Fearless (Taylor\'s Version) — extending the original tribute for the re-recording era.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=n0cde-Km05o',
      media: [embed('n0cde-Km05o')],
      sources: [
        yt('n0cde-Km05o', "Taylor Swift - The Best Day (Taylor's Version) (Official Music Video)"),
        wiki('The_Best_Day_(Taylor_Swift_song)', 'The Best Day (Taylor Swift song)', 'documents the Taylor\'s Version re-release'),
      ],
    },
    {
      slug: 'journey-to-fearless',
      kind: 'tour_film',
      title: 'Journey to Fearless',
      director: null,
      releasedOn: null,
      relatedSongs: [],
      summary:
        'The first concert film: a three-part TV documentary following the Fearless Tour — 19-year-old headliner, screaming arenas, and the backstory told between stadium cuts.',
      symbolism: null,
      easterEggs: [],
      // No official upload of the work itself exists — it is an Epix TV special / DVD release.
      // With no embed this record is HIDDEN from every reader-facing surface
      // rather than shown as a card that cannot play (playable-first rule,
      // docs/decisions.md 2026-08-13). Add a verified official upload here and
      // it comes back automatically — no code change needed.
      officialUrl: null,
      media: [],
      sources: [
        wiki('Journey_to_Fearless', 'Journey to Fearless'),
        press(
          'https://www.shoutfactory.com/products/taylor-swift-journey-to-fearless',
          'Taylor Swift: Journey to Fearless',
          'Shout! Factory',
          'supports the DVD/Blu-ray release and documentary-concert-film format',
        ),
      ],
    },
    // ── Appearances (YouTube-appearances pass, 2026-08-12) ──────────────────
    appearance({
      slug: 'grammys-album-of-the-year-2010',
      kind: 'award_speech',
      title: 'Accepting Album of the Year for Fearless — 52nd GRAMMYs',
      releasedOn: '2010-01-31',
      summary:
        'Twenty years old, holding Album of the Year for Fearless and, at the time, the youngest artist ever to win it. She thanks her parents and producer Nathan Chapman.',
      youtubeId: 'BFk2NjdJ1yY',
      channel: 'GRAMMYS',
      attribution: "GRAMMYs — the Recording Academy's official YouTube channel",
      sources: [
        upload({
          youtubeId: 'BFk2NjdJ1yY',
          title:
            'Taylor Swift accepting the GRAMMY for Album of the Year at the 52nd GRAMMY Awards | GRAMMYs',
          channel: 'GRAMMYS',
          note: "official upload on the Recording Academy's own channel — oEmbed-verified 2026-08-12",
        }),
      ],
    }),
  ],
};
