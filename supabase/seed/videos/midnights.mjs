// Vault videos — Midnights / Eras Tour era. Official uploads verified via
// YouTube oEmbed 2026-07-08; Wikipedia URLs verified the same day.

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
  eraSlug: 'midnights',
  videos: [
    {
      slug: 'anti-hero-mv',
      kind: 'music_video',
      title: 'Anti-Hero',
      director: 'Taylor Swift',
      releasedOn: '2022-10-21',
      relatedSongs: ['Anti-Hero'],
      tags: ['Music'],
      summary:
        'Self-directed release-day centerpiece: Taylor hosts a house party for her own worst selves — a giant "monster on the hill" at the dinner table, a ghost at her funeral, and heirs squabbling over her will.',
      symbolism:
        'Every setpiece literalizes a lyric: the too-big self at the table, the future reading of the will, the "it\'s me, hi" doubles — self-loathing staged as sitcom.',
      easterEggs: ['The squabbling funeral beneficiaries are played by comedians Mike Birbiglia, John Early and Mary Elizabeth Ellis — the will scene fans quote line-for-line.'],
      officialUrl: 'https://www.youtube.com/watch?v=b1kbLwvqugk',
      media: [embed('b1kbLwvqugk')],
      sources: [yt('b1kbLwvqugk', 'Taylor Swift - Anti-Hero (Official Music Video)'), wiki('Anti-Hero_(song)', 'Anti-Hero (song)')],
    },
    {
      slug: 'bejeweled-mv',
      kind: 'music_video',
      title: 'Bejeweled',
      director: 'Taylor Swift',
      releasedOn: '2022-10-25',
      relatedSongs: ['Bejeweled'],
      tags: ['Music'],
      summary:
        'A Cinderella retelling with Laura Dern as the wicked stepmother, HAIM as stepsisters and Dita Von Teese in the martini glass — and, by Taylor\'s own warning, packed wall-to-wall with easter eggs.',
      symbolism: null,
      easterEggs: [
        'The elevator button for floor 3 lights up — read (correctly) as pointing at album #3, Speak Now.',
        'The purple gown and castle staging were decoded as Speak Now (Taylor\'s Version) signals months before its Nashville announcement.',
      ],
      officialUrl: 'https://www.youtube.com/watch?v=b7QlX3yR2xs',
      media: [embed('b7QlX3yR2xs')],
      sources: [yt('b7QlX3yR2xs', 'Taylor Swift - Bejeweled (Official Music Video)'), wiki('Bejeweled_(song)', 'Bejeweled (song)')],
    },
    {
      slug: 'lavender-haze-mv',
      kind: 'music_video',
      title: 'Lavender Haze',
      director: 'Taylor Swift',
      releasedOn: '2023-01-27',
      relatedSongs: ['Lavender Haze'],
      tags: ['Music'],
      summary:
        'The album\'s dreamiest visual: a purple fog rolls through a 70s-styled apartment, koi swim across the ceiling, and Taylor drifts from bed to a lavender field without the night ever ending.',
      symbolism: 'The all-consuming lavender cloud is the song\'s borrowed 50s idiom for being untouchably in love — weather instead of narrative.',
      easterEggs: [],
      // oEmbed-verified 2026-08-13 (author_name "Taylor Swift", title
      // "Taylor Swift - Lavender Haze (Official Music Video)").
      officialUrl: 'https://www.youtube.com/watch?v=h8DLofLM7No',
      media: [embed('h8DLofLM7No', '2026-08-13')],
      sources: [
        wiki('Lavender_Haze', 'Lavender Haze'),
        press(
          'https://pitchfork.com/news/taylor-swift-shares-new-lavender-haze-video-watch',
          'Taylor Swift Shares New "Lavender Haze" Video: Watch',
          'Pitchfork',
          'supports the video release, Swift directing credit, and Laith Ashley appearance',
        ),
      ],
    },
    {
      slug: 'karma-mv',
      kind: 'music_video',
      title: 'Karma (feat. Ice Spice)',
      director: 'Taylor Swift',
      releasedOn: null,
      relatedSongs: ['Karma'],
      tags: ['Music'],
      summary:
        'Released with the Til Dawn edition remix: cosmic Taylor rides mythological karma imagery — a giant cat, a lassoed moon — with Ice Spice materializing for the new verse.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=XzOvgu3GPwY',
      media: [embed('XzOvgu3GPwY')],
      sources: [yt('XzOvgu3GPwY', 'Taylor Swift ft. Ice Spice - Karma (Official Music Video)'), wiki('Karma_(Taylor_Swift_song)', 'Karma (Taylor Swift song)')],
    },
    {
      slug: 'taylor-swift-the-eras-tour-film',
      kind: 'tour_film',
      title: 'Taylor Swift: The Eras Tour',
      director: 'Sam Wrench',
      releasedOn: '2023-10-13',
      relatedSongs: [],
      tags: ['Tour'],
      summary:
        'The SoFi Stadium shows cut into a theatrical event that broke the all-time concert-film box-office record — released straight to cinemas on a distribution deal negotiated with AMC itself.',
      symbolism: null,
      easterEggs: [],
      // No official upload of the work itself exists — it is a theatrical release, then Disney+.
      // With no embed this record is HIDDEN from every reader-facing surface
      // rather than shown as a card that cannot play (playable-first rule,
      // docs/decisions.md 2026-08-13). Add a verified official upload here and
      // it comes back automatically — no code change needed.
      officialUrl: null,
      media: [],
      sources: [
        wiki('Taylor_Swift:_The_Eras_Tour', 'Taylor Swift: The Eras Tour'),
        press(
          'https://people.com/taylor-swift-the-eras-tour-most-watched-music-film-disney-plus-8611339',
          '"Taylor Swift: The Eras Tour" Shatters Records and Becomes the Most-Watched Music Film on Disney+',
          'People',
          'supports the concert-film record context and Disney+ Taylor\'s Version release',
        ),
      ],
    },
    // ── Appearances (YouTube-appearances pass, 2026-08-12) ──────────────────
    appearance({
      slug: 'eras-tour-film-premiere-carpet-2023',
      kind: 'press_event',
      title: 'Red carpet at the Eras Tour concert-film premiere',
      releasedOn: '2023-10-11',
      summary:
        'The Eras Tour film premiere at The Grove, pulled forward a day by demand: a blue floral gown, the shopping centre closed to the public, and a carpet she works slowly along the barricades.',
      youtubeId: 'X_wHLxTOzas',
      channel: 'Good Morning America',
      // Fashion only. The record is a red carpet at a film premiere — the gown
      // and the barricade walk — and says nothing about the tour itself. "Eras
      // Tour" appearing in the event's NAME is not the record being about the
      // tour, and a Tour filter that surfaces this returns a premiere.
      tags: ['Fashion'],
      sources: [
        upload({
          youtubeId: 'X_wHLxTOzas',
          title: 'Taylor Swift hits red carpet for premiere of ‘Eras Tour’ concert film l GMA',
          channel: 'Good Morning America',
        }),
        pressSource(
          'https://www.cbsnews.com/amp/losangeles/news/the-grove-shutdown-for-taylor-swift-the-eras-tour-movie-premiere',
          'The Grove shut down for Taylor Swift "The Eras Tour" movie premiere',
          'CBS News',
          'documents the venue closure and the premiere being moved up',
        ),
      ],
    }),
    // The Time Person of the Year TODAY reveal (VeFzmqp6OaQ) was REMOVED from
    // this surface on 2026-08-12 — Joey's rule for the Videos rail: "it should
    // only be Taylor." That video is Time's editor-in-chief announcing the
    // honor; Taylor is not on screen. An announcement ABOUT her is a timeline
    // moment, not a watchable appearance. The honor itself lives on, fully
    // sourced, as the content/midnights.mjs moment "She's Time's 2023 Person
    // of the Year" (2023-12-06), which cites the same TODAY upload. Do not
    // re-add records here unless Taylor is herself the on-screen participant.
    appearance({
      slug: 'grammys-album-of-the-year-2024',
      kind: 'award_speech',
      title: 'Accepting Album of the Year for Midnights — 66th GRAMMYs',
      releasedOn: '2024-02-04',
      summary:
        'A fourth Album of the Year, for Midnights: no artist in Grammy history had won it more than three times. She had already announced The Tortured Poets Department from the same stage earlier that night.',
      youtubeId: 'Yq-q-ZCZwxc',
      channel: 'GRAMMYS',
      attribution: "GRAMMYs — the Recording Academy's official YouTube channel",
      tags: ['Music'],
      sources: [
        upload({
          youtubeId: 'Yq-q-ZCZwxc',
          title:
            "TAYLOR SWIFT Wins Album Of The Year For 'MIDNIGHTS' | 2024 GRAMMYs Acceptance Speech",
          channel: 'GRAMMYS',
          note: "official upload on the Recording Academy's own channel — oEmbed-verified 2026-08-12",
        }),
      ],
    }),

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
  ],
};
