// Vault videos — Lover era. Official uploads verified via YouTube oEmbed
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

import { appearance, pressSource, upload, wikiSource } from './_appearance-helpers.mjs';

export default {
  eraSlug: 'lover',
  videos: [
    {
      slug: 'me-mv',
      kind: 'music_video',
      title: 'ME!',
      director: 'Dave Meyers & Taylor Swift',
      releasedOn: '2019-04-26',
      relatedSongs: ['ME!'],
      tags: ['Music'],
      summary:
        'The era-flip: a French-arguing snake bursts into pastel butterflies, and the rest is a candy-colored musical-theater fever dream with Brendon Urie — released 4/26 after a fan-tracked countdown.',
      symbolism: 'The snake-to-butterflies opening is the official handoff from reputation to Lover, staged in one cut.',
      easterEggs: [
        'The Kelsey Montague butterfly mural in Nashville went up hours before the drop as a real-world clue.',
        'A neon "Lover" sign appears months before the album title was announced.',
      ],
      officialUrl: 'https://www.youtube.com/watch?v=FuXNumBwDOM',
      media: [embed('FuXNumBwDOM')],
      sources: [yt('FuXNumBwDOM', 'Taylor Swift - ME! (feat. Brendon Urie of Panic! At The Disco)'), wiki('Me!', 'ME!')],
    },
    {
      slug: 'you-need-to-calm-down-mv',
      kind: 'music_video',
      title: 'You Need to Calm Down',
      director: 'Drew Kirsch & Taylor Swift',
      releasedOn: '2019-06-17',
      relatedSongs: ['You Need to Calm Down'],
      tags: ['Music'],
      summary:
        'A trailer-park block party stacked with LGBTQ icons — and a mid-video Katy Perry burger-and-fries reconciliation — ending on a title card for the Equality Act petition.',
      symbolism: null,
      easterEggs: ['The burger-and-fries costumes end the long-running Katy Perry feud on camera.'],
      officialUrl: 'https://www.youtube.com/watch?v=Dkk9gvTmCXY',
      media: [embed('Dkk9gvTmCXY')],
      sources: [yt('Dkk9gvTmCXY', 'Taylor Swift - You Need To Calm Down'), wiki('You_Need_to_Calm_Down', 'You Need to Calm Down')],
    },
    {
      slug: 'lover-mv',
      kind: 'music_video',
      title: 'Lover',
      director: 'Drew Kirsch',
      releasedOn: '2019-08-22',
      relatedSongs: ['Lover'],
      tags: ['Music'],
      summary:
        'A couple lives inside a dollhouse where every room is a different color and mood — an image fans never stopped decoding, especially once the Eras Tour opened with the Lover set.',
      symbolism:
        'The house-of-rooms was later read as a map of her discography\'s moods; the "Lover house" became load-bearing fan canon for era iconography.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=-BjZmE2gtdo',
      media: [embed('-BjZmE2gtdo')],
      sources: [yt('-BjZmE2gtdo', 'Taylor Swift - Lover (Official Music Video)'), wiki('Lover_(Taylor_Swift_song)', 'Lover (Taylor Swift song)')],
    },
    {
      slug: 'the-man-mv',
      kind: 'music_video',
      title: 'The Man',
      director: 'Taylor Swift',
      releasedOn: '2020-02-27',
      relatedSongs: ['The Man'],
      tags: ['Music'],
      summary:
        'Her solo directorial debut: buried under prosthetics, Taylor plays "Tyler" — the swaggering executive whose every entitled move the song calls out — until the credits reveal the trick.',
      symbolism:
        'The double-standard satire is the point: the same behavior reads as boss-like on a man, so she performs it as one. Her father cameos as the tennis umpire.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=AqAJLh9wuZ0',
      media: [embed('AqAJLh9wuZ0')],
      sources: [yt('AqAJLh9wuZ0', 'Taylor Swift - The Man (Official Video)'), wiki('The_Man_(Taylor_Swift_song)', 'The Man (Taylor Swift song)')],
    },
    {
      slug: 'christmas-tree-farm-mv',
      kind: 'music_video',
      title: 'Christmas Tree Farm',
      director: 'Taylor Swift',
      releasedOn: '2019-12-06',
      relatedSongs: ['Christmas Tree Farm'],
      tags: ['Music'],
      summary:
        'A self-directed holiday video built from real Taylor-family home footage — sledding, decorating, and Taylor unwrapping her first guitar — set on the actual Pennsylvania tree farm the song is named for.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=mN3rDTAdM2o',
      media: [embed('mN3rDTAdM2o')],
      sources: [
        yt('mN3rDTAdM2o', 'Taylor Swift - Christmas Tree Farm'),
        wiki('Christmas_Tree_Farm', 'Christmas Tree Farm'),
      ],
    },
    {
      slug: 'miss-americana',
      kind: 'documentary',
      title: 'Miss Americana',
      director: 'Lana Wilson',
      releasedOn: '2020-01-31',
      relatedSongs: [],
      tags: ['Music'],
      summary:
        'The Netflix documentary that opened the vault for real: the eating-disorder disclosure, the political-silence breaking point, and the Lover sessions — Sundance premiere, then streaming.',
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
        wiki('Miss_Americana', 'Miss Americana'),
        press(
          'https://www.vanityfair.com/hollywood/2020/01/taylor-swift-netflix-miss-americana',
          "Taylor Swift Gets On the Right Side of History in First Trailer for Netflix's Miss Americana",
          'Vanity Fair',
          'supports the Netflix/Sundance release context and documentary framing',
        ),
      ],
    },
    {
      slug: 'city-of-lover',
      kind: 'performance',
      title: 'Taylor Swift: City of Lover',
      director: null,
      releasedOn: '2020-05-17',
      relatedSongs: [],
      tags: ['Music'],
      summary:
        'The one-night Paris concert special that became the Lover era\'s only live document after the pandemic canceled Lover Fest — aired on ABC, intimate theater instead of stadiums.',
      symbolism: null,
      easterEggs: [],
      // No official upload of the work itself exists — it is an ABC special, then Disney+.
      // With no embed this record is HIDDEN from every reader-facing surface
      // rather than shown as a card that cannot play (playable-first rule,
      // docs/decisions.md 2026-08-13). Add a verified official upload here and
      // it comes back automatically — no code change needed.
      officialUrl: null,
      media: [],
      sources: [
        wiki('Taylor_Swift_City_of_Lover_Concert', 'Taylor Swift City of Lover Concert'),
        press(
          'https://pitchfork.com/news/listen-to-taylor-swifts-city-of-lover-film-soundtrack',
          "Listen to Taylor Swift's City of Lover Film Soundtrack",
          'Pitchfork',
          'supports the ABC premiere date, Paris concert source, and streaming follow-up',
        ),
      ],
    },
    {
      // Distinct upload from the existing 'amas-artist-of-the-decade-2019'
      // appearance record below (youtubeId 0pbSQ_0qbqU, the acceptance speech
      // itself) — this is the separate official upload of the live medley
      // performance that preceded the award.
      slug: 'amas-artist-of-the-decade-medley-2019',
      kind: 'performance',
      title: 'Artist of the Decade Medley — 2019 American Music Awards',
      director: null,
      releasedOn: '2019-11-24',
      relatedSongs: ['The Man', 'Love Story', 'I Knew You Were Trouble', 'Blank Space', 'Shake It Off'],
      tags: ['Music'],
      summary:
        'A career-spanning medley for the Artist of the Decade honor at the Microsoft Theater — joined by Halsey and Camila Cabello on "Shake It Off" and Misty Copeland for a "First Dance Remix."',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=SVY8I46dkb0',
      media: [
        {
          kind: 'oembed',
          rights: 'platform_tos',
          provider: 'youtube',
          post_url: 'https://www.youtube.com/watch?v=SVY8I46dkb0',
          oembed_fetched_at: '2026-08-25',
          attribution: 'Taylor Swift — official YouTube channel',
        },
      ],
      sources: [
        {
          source_url: 'https://www.youtube.com/watch?v=SVY8I46dkb0',
          source_title: 'Taylor Swift - Live at the 2019 American Music Awards',
          publisher: 'Taylor Swift (official YouTube channel)',
          source_type: 'official',
          accessed_at: '2026-08-25',
          reliability_score: 5,
          excerpt: null,
          notes: 'official upload on the verified Taylor Swift channel',
        },
        wiki('2019_American_Music_Awards', '2019 American Music Awards', 'confirms the date, venue, and Artist of the Decade medley guests'),
      ],
    },
    {
      slug: 'me-live-billboard-music-awards-2019',
      kind: 'performance',
      title: 'ME! (Live From The Billboard Music Awards) ft. Brendon Urie',
      director: null,
      releasedOn: '2019-05-01',
      relatedSongs: ['ME!'],
      tags: ['Music'],
      summary:
        '"ME!"\'s world-premiere live debut, opening the NBC broadcast alongside Brendon Urie of Panic! At The Disco.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=bqOfdv9i4sE',
      media: [
        {
          kind: 'oembed',
          rights: 'platform_tos',
          provider: 'youtube',
          post_url: 'https://www.youtube.com/watch?v=bqOfdv9i4sE',
          oembed_fetched_at: '2026-08-25',
          attribution: 'Taylor Swift — official YouTube channel',
        },
      ],
      sources: [
        {
          source_url: 'https://www.youtube.com/watch?v=bqOfdv9i4sE',
          source_title: 'ME! (feat. Brendon Urie of Panic! At The Disco) (Live From The Billboard Music Awards / 2019)',
          publisher: 'Taylor Swift (official YouTube channel)',
          source_type: 'official',
          accessed_at: '2026-08-25',
          reliability_score: 5,
          excerpt: null,
          notes: 'official upload on the verified Taylor Swift channel',
        },
        wiki('2019_Billboard_Music_Awards', '2019 Billboard Music Awards', 'confirms the date and broadcast-opening performance'),
      ],
    },
    // ── Appearances (YouTube-appearances pass, 2026-08-12) ──────────────────
    appearance({
      slug: 'vmas-video-of-the-year-2019',
      kind: 'award_speech',
      title: "Accepting Video of the Year for 'You Need to Calm Down' — 2019 VMAs",
      releasedOn: '2019-08-26',
      summary:
        "'You Need to Calm Down' wins Video of the Year, and she uses the podium to point back at the Equality Act petition the video ends on — noting from the stage that the White House had not responded to it.",
      youtubeId: '8z4icNgFSPI',
      channel: 'MTV',
      tags: ['Music'],
      sources: [
        upload({
          youtubeId: '8z4icNgFSPI',
          title: 'Taylor Swift Wins Video of the Year | 2019 Video Music Awards',
          channel: 'MTV',
        }),
        pressSource(
          'https://www.cbsnews.com/detroit/news/taylor-swift-calls-out-white-house-during-vmas-acceptance-speech',
          'Taylor Swift calls out White House during VMAs acceptance speech',
          'CBS News',
          'reports the Equality Act petition callout from the stage',
        ),
      ],
    }),
    appearance({
      slug: 'amas-artist-of-the-decade-2019',
      kind: 'award_speech',
      title: 'Accepting Artist of the Decade — 2019 American Music Awards',
      releasedOn: '2019-11-24',
      summary:
        'Carole King hands her Artist of the Decade — one of the wins that night that carried her to a record 29 American Music Awards.',
      youtubeId: '0pbSQ_0qbqU',
      channel: 'American Music Awards',
      tags: ['Music'],
      sources: [
        upload({
          youtubeId: '0pbSQ_0qbqU',
          title: 'Taylor Swift wins the Artist of the Decade Award  I  AMAs 2019',
          channel: 'American Music Awards',
        }),
        pressSource(
          'https://www.billboard.com/music/awards/taylor-swift-artist-decade-speech-2019-amas-8544659/',
          "Taylor Swift's Artist of the Decade Speech at the 2019 AMAs",
          'Billboard',
          "documents the presentation by Carole King and the night's wins",
        ),
      ],
    }),
    appearance({
      slug: 'sundance-miss-americana-qa-2020',
      kind: 'press_event',
      title: 'Miss Americana — Sundance world-premiere Q&A',
      releasedOn: '2020-01-23',
      summary:
        'Miss Americana opens Sundance, and Taylor joins director Lana Wilson on stage afterwards for the festival Q&A — days before the documentary landed on Netflix.',
      youtubeId: 'JqIt0H6XqpA',
      channel: 'Scott D. Menzel',
      // NOT a re-upload, and not a broadcaster either: a film journalist's own
      // recording of the public Q&A, published on his own channel. That is why
      // it earns an officialUrl (nobody else's footage is being redistributed)
      // but is typed `video` at reliability 3 rather than `official` 5.
      attribution: "Scott D. Menzel — the journalist's own festival footage",
      sources: [
        upload({
          youtubeId: 'JqIt0H6XqpA',
          title: 'Taylor Swift: Miss Americana - Sundance 2020 World Premiere Q&A',
          channel: 'Scott D. Menzel',
          sourceType: 'video',
          reliability: 3,
          note: "first-party festival footage filmed and uploaded by the journalist himself (not a re-upload of anyone else's broadcast) — oEmbed-verified 2026-08-12",
        }),
        wikiSource(
          'https://en.wikipedia.org/wiki/Miss_Americana',
          'Miss Americana',
          'anchors the Sundance opening-night premiere and the Netflix release date',
        ),
      ],
    }),
    // ── YouTube-catalog pass, issue #3286 batch B (2026-08-25) ──────────────
    {
      slug: 'lover-album-photoshoot-bts',
      kind: 'documentary',
      title: 'Lover Album Photoshoot: Behind The Scenes',
      director: null,
      releasedOn: '2019-08-23',
      relatedSongs: [],
      tags: ['Music', 'Fashion'],
      summary:
        'Behind-the-scenes footage from the Lover album-cover photoshoot, released the day the album dropped.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=hKcEdTPOGGw',
      media: [embed('hKcEdTPOGGw')],
      sources: [
        {
          source_url: 'https://www.youtube.com/watch?v=hKcEdTPOGGw',
          source_title: 'Lover Album Photoshoot: Behind The Scenes',
          publisher: 'Taylor Swift (official YouTube channel)',
          source_type: 'official',
          accessed_at: '2026-08-25',
          reliability_score: 5,
          excerpt: null,
          notes: 'official upload — verified via YouTube oEmbed and page date 2026-08-25 (Aug 23, 2019)',
        },
        wiki('Lover_(Taylor_Swift_album)', 'Lover (Taylor Swift album)'),
      ],
    },
    {
      slug: 'false-god-live-snl-2019',
      kind: 'performance',
      title: '"False God" (Live on Saturday Night Live / 2019)',
      director: null,
      releasedOn: '2019-10-07',
      relatedSongs: ['False God'],
      tags: ['Music'],
      summary:
        'A live SNL performance of "False God," one of two Lover-album songs Taylor performed on the show the same night.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=kjD3LoXp-Pw',
      media: [embed('kjD3LoXp-Pw')],
      sources: [
        {
          source_url: 'https://www.youtube.com/watch?v=kjD3LoXp-Pw',
          source_title: 'Taylor Swift - "False God" (Live on Saturday Night Live / 2019)',
          publisher: 'Taylor Swift (official YouTube channel)',
          source_type: 'official',
          accessed_at: '2026-08-25',
          reliability_score: 5,
          excerpt: null,
          notes: 'official upload — verified via YouTube oEmbed and page date 2026-08-25 (Oct 7, 2019)',
        },
      ],
    },
    {
      slug: 'lover-live-snl-2019',
      kind: 'performance',
      title: '"Lover" (Live on Saturday Night Live / 2019)',
      director: null,
      releasedOn: '2019-10-07',
      relatedSongs: ['Lover'],
      tags: ['Music'],
      summary:
        'A live SNL performance of the title track "Lover," released the same night as her "False God" performance on the show.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=dmipFjOtMA8',
      media: [embed('dmipFjOtMA8')],
      sources: [
        {
          source_url: 'https://www.youtube.com/watch?v=dmipFjOtMA8',
          source_title: 'Taylor Swift - "Lover" (Live on Saturday Night Live / 2019)',
          publisher: 'Taylor Swift (official YouTube channel)',
          source_type: 'official',
          accessed_at: '2026-08-25',
          reliability_score: 5,
          excerpt: null,
          notes: 'official upload — verified via YouTube oEmbed and page date 2026-08-25 (Oct 7, 2019)',
        },
        wiki('Lover_(Taylor_Swift_song)', 'Lover (Taylor Swift song)'),
      ],
    },
    {
      slug: 'making-of-christmas-tree-farm',
      kind: 'documentary',
      title: 'The Making Of Christmas Tree Farm',
      director: null,
      releasedOn: '2019-12-23',
      relatedSongs: ['Christmas Tree Farm'],
      tags: ['Music'],
      summary:
        'A making-of look at the self-directed "Christmas Tree Farm" video, built from real Taylor-family home footage.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=O2Irnn7F1PM',
      media: [embed('O2Irnn7F1PM')],
      sources: [
        {
          source_url: 'https://www.youtube.com/watch?v=O2Irnn7F1PM',
          source_title: 'Taylor Swift - The Making Of Christmas Tree Farm',
          publisher: 'Taylor Swift (official YouTube channel)',
          source_type: 'official',
          accessed_at: '2026-08-25',
          reliability_score: 5,
          excerpt: null,
          notes: 'official upload — verified via YouTube oEmbed and page date 2026-08-25 (Dec 23, 2019)',
        },
        wiki('Christmas_Tree_Farm', 'Christmas Tree Farm'),
      ],
    },
    {
      slug: 'the-man-bts-the-umpire',
      kind: 'documentary',
      title: 'The Man (Behind The Scenes: The Umpire)',
      director: null,
      releasedOn: '2020-03-20',
      relatedSongs: ['The Man'],
      tags: ['Music'],
      summary:
        'A making-of clip from "The Man" shoot focused on the tennis-umpire scene — the cameo played by Taylor\'s father, Scott Swift.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=IQL1vIP9sos',
      media: [embed('IQL1vIP9sos')],
      sources: [
        {
          source_url: 'https://www.youtube.com/watch?v=IQL1vIP9sos',
          source_title: 'Taylor Swift - The Man (Behind The Scenes: The Umpire)',
          publisher: 'Taylor Swift (official YouTube channel)',
          source_type: 'official',
          accessed_at: '2026-08-25',
          reliability_score: 5,
          excerpt: null,
          notes: 'official upload — verified via YouTube oEmbed and page date 2026-08-25 (Mar 20, 2020)',
        },
        wiki('The_Man_(Taylor_Swift_song)', 'The Man (Taylor Swift song)'),
      ],
    },
    {
      slug: 'the-man-bts-directing',
      kind: 'documentary',
      title: 'The Man (Behind The Scenes: Directing)',
      director: null,
      releasedOn: '2020-03-10',
      relatedSongs: ['The Man'],
      tags: ['Music'],
      summary:
        'A making-of clip from "The Man" shoot showing Taylor directing her solo directorial debut.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=mxtUnuldKgc',
      media: [embed('mxtUnuldKgc')],
      sources: [
        {
          source_url: 'https://www.youtube.com/watch?v=mxtUnuldKgc',
          source_title: 'Taylor Swift - The Man (Behind The Scenes: Directing)',
          publisher: 'Taylor Swift (official YouTube channel)',
          source_type: 'official',
          accessed_at: '2026-08-25',
          reliability_score: 5,
          excerpt: null,
          notes: 'official upload — verified via YouTube oEmbed and page date 2026-08-25 (Mar 10, 2020)',
        },
        wiki('The_Man_(Taylor_Swift_song)', 'The Man (Taylor Swift song)'),
      ],
    },
    {
      slug: 'the-man-bts-becoming-the-man',
      kind: 'documentary',
      title: 'The Man (Becoming The Man: Behind The Scenes)',
      director: null,
      releasedOn: '2020-03-06',
      relatedSongs: ['The Man'],
      tags: ['Music'],
      summary:
        'A making-of clip covering the prosthetics and transformation work behind Taylor\'s "Tyler" character in "The Man."',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=a5gXfaAFPOM',
      media: [embed('a5gXfaAFPOM')],
      sources: [
        {
          source_url: 'https://www.youtube.com/watch?v=a5gXfaAFPOM',
          source_title: 'Taylor Swift - The Man (Becoming The Man: Behind The Scenes)',
          publisher: 'Taylor Swift (official YouTube channel)',
          source_type: 'official',
          accessed_at: '2026-08-25',
          reliability_score: 5,
          excerpt: null,
          notes: 'official upload — verified via YouTube oEmbed and page date 2026-08-25 (Mar 6, 2020)',
        },
        wiki('The_Man_(Taylor_Swift_song)', 'The Man (Taylor Swift song)'),
      ],
    },
    {
      slug: 'the-man-live-from-paris-2020',
      kind: 'performance',
      title: 'The Man (Live From Paris)',
      director: null,
      releasedOn: '2020-02-17',
      relatedSongs: ['The Man'],
      tags: ['Music'],
      summary:
        'A live performance of "The Man" filmed in Paris during the Lover-era promotional run.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=F3aXpa1rQEY',
      media: [embed('F3aXpa1rQEY')],
      sources: [
        {
          source_url: 'https://www.youtube.com/watch?v=F3aXpa1rQEY',
          source_title: 'Taylor Swift - The Man (Live From Paris)',
          publisher: 'Taylor Swift (official YouTube channel)',
          source_type: 'official',
          accessed_at: '2026-08-25',
          reliability_score: 5,
          excerpt: null,
          notes: 'official upload — verified via YouTube oEmbed and page date 2026-08-25 (Feb 17, 2020)',
        },
        wiki('The_Man_(Taylor_Swift_song)', 'The Man (Taylor Swift song)'),
      ],
    },
  ],
};
