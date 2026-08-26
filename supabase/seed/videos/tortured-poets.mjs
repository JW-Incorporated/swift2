// Vault videos — Tortured Poets era. Official uploads verified via YouTube
// oEmbed 2026-07-08; Wikipedia URLs verified the same day.

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
  eraSlug: 'tortured-poets',
  videos: [
    {
      slug: 'fortnight-mv',
      kind: 'music_video',
      title: 'Fortnight (feat. Post Malone)',
      director: 'Taylor Swift',
      releasedOn: '2024-04-19',
      relatedSongs: ['Fortnight'],
      tags: ['Music'],
      summary:
        'Black-and-white asylum-for-poets imagery: Taylor is committed to an asylum and later enters a room marked "The Tortured Poets Department," where Post Malone types across from her — with Dead Poets Society\'s Ethan Hawke and Josh Charles as the doctors.',
      symbolism:
        'The typewriter-era styling and the institution of tortured poets literalize the album\'s conceit: heartbreak processed as manuscript, "I love you, it\'s ruining my life" typed instead of said.',
      easterEggs: ['Ethan Hawke and Josh Charles — two of the original Dead Poets Society cast — cameo as the doctors, a casting-level pun on the album title.'],
      officialUrl: 'https://www.youtube.com/watch?v=q3zqJs7JUCQ',
      media: [embed('q3zqJs7JUCQ')],
      sources: [yt('q3zqJs7JUCQ', 'Taylor Swift - Fortnight (feat. Post Malone) (Official Music Video)'), wiki('Fortnight_(song)', 'Fortnight (song)')],
    },
    {
      slug: 'i-can-do-it-with-a-broken-heart-mv',
      kind: 'music_video',
      title: 'I Can Do It with a Broken Heart',
      director: 'Taylor Swift',
      releasedOn: null,
      relatedSongs: ['I Can Do It with a Broken Heart'],
      tags: ['Music', 'Tour'],
      summary:
        'Built from real Eras Tour rehearsal and backstage footage: the show-must-go-on song scored by the machinery of the actual show — lifts, quick changes, and the smile snapping on at places, everyone.',
      symbolism: 'Using documentary tour footage as the "set" makes the lyric literal: the biggest tour ever staged is the broken heart\'s day job.',
      easterEggs: [],
      // oEmbed-verified 2026-08-13 (author_name "Taylor Swift", title "Taylor
      // Swift - I Can Do It With A Broken Heart (Official Video)").
      officialUrl: 'https://www.youtube.com/watch?v=Sl6en1NPTYM',
      media: [embed('Sl6en1NPTYM', '2026-08-13')],
      sources: [
        wiki('I_Can_Do_It_with_a_Broken_Heart', 'I Can Do It with a Broken Heart'),
        press(
          'https://people.com/taylor-swift-releases-i-can-do-it-with-a-broken-heart-music-video-8698971',
          "Taylor Swift Offers Inside Look at Tour - and Confirms How She Gets Onstage - with 'I Can Do It with a Broken Heart' Video",
          'People',
          'supports the Eras Tour rehearsal/backstage footage and August 2024 video release',
        ),
      ],
    },
    // ── Behind-the-scenes featurette batch (Taylor's 35th birthday gift to
    // fans, 2026-08-25 catalog pass — issue #3286). Nine BTS videos for music
    // videos spanning folklore/Midnights/TTPD subjects all uploaded the same
    // day, 2024-12-13. Filed here (not their subject song's era) per
    // docs/decisions.md 2026-08-25: era placement follows the real-world
    // upload date, never the song/era being depicted.
    {
      slug: 'anti-hero-bts-ghosts-in-the-room',
      kind: 'documentary',
      title: 'Anti-Hero (Behind The Scenes with The Ghosts In The Room)',
      director: null,
      releasedOn: '2024-12-13',
      relatedSongs: ['Anti-Hero'],
      tags: ['Music'],
      summary:
        'A making-of featurette for the "Anti-Hero" video, focused on building the ghost-at-the-dinner-table effects — one of nine BTS videos Taylor released as a birthday gift to fans.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=P0haCYjysUs',
      media: [embed('P0haCYjysUs', '2026-08-25')],
      sources: [
        yt('P0haCYjysUs', 'Anti-Hero (Behind The Scenes with The Ghosts In The Room)'),
        press(
          'https://www.billboard.com/music/pop/taylor-swift-birthday-35-behind-the-scenes-videos-eras-archive-1235857085/',
          'Taylor Swift Drops 9 Behind-the-Scenes Music Video Clips for Her 35th Birthday',
          'Billboard',
          'confirms the same-day, nine-video BTS release on 2024-12-13',
        ),
      ],
    },
    {
      slug: 'cardigan-bts-forest-ocean',
      kind: 'documentary',
      title: 'cardigan (behind the scenes - forest & ocean)',
      director: null,
      releasedOn: '2024-12-13',
      relatedSongs: ['cardigan'],
      tags: ['Music'],
      summary:
        'A making-of look at the "cardigan" video\'s practical forest and storm-tossed-sea sets, part of the same nine-video birthday BTS release.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=PQp643val70',
      media: [embed('PQp643val70', '2026-08-25')],
      sources: [
        yt('PQp643val70', 'cardigan (behind the scenes - forest & ocean)'),
        press(
          'https://www.billboard.com/music/pop/taylor-swift-birthday-35-behind-the-scenes-videos-eras-archive-1235857085/',
          'Taylor Swift Drops 9 Behind-the-Scenes Music Video Clips for Her 35th Birthday',
          'Billboard',
          'confirms the same-day, nine-video BTS release on 2024-12-13',
        ),
      ],
    },
    {
      slug: 'anti-hero-bts-birbiglia-early-ellis',
      kind: 'documentary',
      title: 'Anti-Hero (Behind the Scenes with Mike Birbiglia, John Early & Mary Elizabeth Ellis)',
      director: null,
      releasedOn: '2024-12-13',
      relatedSongs: ['Anti-Hero'],
      tags: ['Music'],
      summary:
        'A second "Anti-Hero" making-of clip, this one following the will-reading scene with Mike Birbiglia, John Early and Mary Elizabeth Ellis as the squabbling heirs.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=-ddfFsLHNQs',
      media: [embed('-ddfFsLHNQs', '2026-08-25')],
      sources: [
        yt('-ddfFsLHNQs', 'Anti-Hero (Behind the Scenes with Mike Birbiglia, John Early & Mary Elizabeth Ellis)'),
        press(
          'https://www.billboard.com/music/pop/taylor-swift-birthday-35-behind-the-scenes-videos-eras-archive-1235857085/',
          'Taylor Swift Drops 9 Behind-the-Scenes Music Video Clips for Her 35th Birthday',
          'Billboard',
          'confirms the same-day, nine-video BTS release on 2024-12-13',
        ),
      ],
    },
    {
      slug: 'bejeweled-bts-dita-von-teese',
      kind: 'documentary',
      title: 'Bejeweled (Behind the Scenes with Dita Von Teese)',
      director: null,
      releasedOn: '2024-12-13',
      relatedSongs: ['Bejeweled'],
      tags: ['Music'],
      summary:
        'A "Bejeweled" making-of clip built around the giant martini-glass set piece Dita Von Teese performs in.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=0GeyBM6NS5s',
      media: [embed('0GeyBM6NS5s', '2026-08-25')],
      sources: [
        yt('0GeyBM6NS5s', 'Bejeweled (Behind the Scenes with Dita Von Teese)'),
        press(
          'https://www.billboard.com/music/pop/taylor-swift-birthday-35-behind-the-scenes-videos-eras-archive-1235857085/',
          'Taylor Swift Drops 9 Behind-the-Scenes Music Video Clips for Her 35th Birthday',
          'Billboard',
          'confirms the same-day, nine-video BTS release on 2024-12-13',
        ),
      ],
    },
    {
      slug: 'bejeweled-bts-antonoff-haim-mcgrath',
      kind: 'documentary',
      title: 'Bejeweled (Behind the Scenes with Jack Antonoff, HAIM & Pat McGrath)',
      director: null,
      releasedOn: '2024-12-13',
      relatedSongs: ['Bejeweled'],
      tags: ['Music'],
      summary:
        'A second "Bejeweled" making-of clip covering the stepsister cameos and makeup design with Jack Antonoff, HAIM and Pat McGrath.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=UAtpbCEsJlA',
      media: [embed('UAtpbCEsJlA', '2026-08-25')],
      sources: [
        yt('UAtpbCEsJlA', 'Bejeweled (Behind the Scenes with Jack Antonoff, HAIM & Pat McGrath)'),
        press(
          'https://www.billboard.com/music/pop/taylor-swift-birthday-35-behind-the-scenes-videos-eras-archive-1235857085/',
          'Taylor Swift Drops 9 Behind-the-Scenes Music Video Clips for Her 35th Birthday',
          'Billboard',
          'confirms the same-day, nine-video BTS release on 2024-12-13',
        ),
      ],
    },
    {
      slug: 'bejeweled-bts-laura-dern',
      kind: 'documentary',
      title: 'Bejeweled (Behind the Scenes with Laura Dern)',
      director: null,
      releasedOn: '2024-12-13',
      relatedSongs: ['Bejeweled'],
      tags: ['Music'],
      summary:
        'A third "Bejeweled" making-of clip built around Laura Dern\'s wicked-stepmother staging.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=K-8dOw7yuPo',
      media: [embed('K-8dOw7yuPo', '2026-08-25')],
      sources: [
        yt('K-8dOw7yuPo', 'Bejeweled (Behind the Scenes with Laura Dern)'),
        press(
          'https://www.billboard.com/music/pop/taylor-swift-birthday-35-behind-the-scenes-videos-eras-archive-1235857085/',
          'Taylor Swift Drops 9 Behind-the-Scenes Music Video Clips for Her 35th Birthday',
          'Billboard',
          'confirms the same-day, nine-video BTS release on 2024-12-13',
        ),
      ],
    },
    {
      slug: 'fortnight-bts-post-malone-hawke-charles',
      kind: 'documentary',
      title: 'Fortnight (Behind the Scenes with Post Malone, Ethan Hawke & Josh Charles)',
      director: null,
      releasedOn: '2024-12-13',
      relatedSongs: ['Fortnight'],
      tags: ['Music'],
      summary:
        'A "Fortnight" making-of clip covering the asylum-set scenes with Post Malone, Ethan Hawke and Josh Charles — distinct from the earlier June 2024 Fortnight BTS release.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=w04K8z_nfDI',
      media: [embed('w04K8z_nfDI', '2026-08-25')],
      sources: [
        yt('w04K8z_nfDI', 'Fortnight (Behind the Scenes with Post Malone, Ethan Hawke & Josh Charles)'),
        press(
          'https://www.billboard.com/music/pop/taylor-swift-birthday-35-behind-the-scenes-videos-eras-archive-1235857085/',
          'Taylor Swift Drops 9 Behind-the-Scenes Music Video Clips for Her 35th Birthday',
          'Billboard',
          'confirms the same-day, nine-video BTS release on 2024-12-13',
        ),
      ],
    },
    {
      slug: 'i-can-see-you-bts',
      kind: 'documentary',
      title: 'I Can See You (From The Vault) (Behind the Scenes with Joey King, Taylor Lautner & Presley Cash)',
      director: null,
      releasedOn: '2024-12-13',
      relatedSongs: ['I Can See You'],
      tags: ['Music'],
      summary:
        'A making-of clip for the "I Can See You" heist-caper video, following Joey King, Taylor Lautner and Presley Cash through the vault set.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=AFzzgQ7uCw4',
      media: [embed('AFzzgQ7uCw4', '2026-08-25')],
      sources: [
        yt('AFzzgQ7uCw4', 'I Can See You (From The Vault) (Behind the Scenes with Joey King, Taylor Lautner & Presley Cash)'),
        press(
          'https://www.billboard.com/music/pop/taylor-swift-birthday-35-behind-the-scenes-videos-eras-archive-1235857085/',
          'Taylor Swift Drops 9 Behind-the-Scenes Music Video Clips for Her 35th Birthday',
          'Billboard',
          'confirms the same-day, nine-video BTS release on 2024-12-13',
        ),
      ],
    },
    {
      slug: 'karma-bts',
      kind: 'documentary',
      title: 'Karma (feat. Ice Spice) (Behind the Scenes)',
      director: null,
      releasedOn: '2024-12-13',
      relatedSongs: ['Karma'],
      tags: ['Music'],
      summary:
        'A making-of clip for the cosmic "Karma" video, covering the giant-cat and lassoed-moon set pieces and Ice Spice\'s verse shoot.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=ZwK7hrDC5UM',
      media: [embed('ZwK7hrDC5UM', '2026-08-25')],
      sources: [
        yt('ZwK7hrDC5UM', 'Karma (feat. Ice Spice) (Behind the Scenes)'),
        press(
          'https://www.billboard.com/music/pop/taylor-swift-birthday-35-behind-the-scenes-videos-eras-archive-1235857085/',
          'Taylor Swift Drops 9 Behind-the-Scenes Music Video Clips for Her 35th Birthday',
          'Billboard',
          'confirms the same-day, nine-video BTS release on 2024-12-13',
        ),
      ],
    },
    {
      slug: 'fortnight-bts-june-2024',
      kind: 'documentary',
      title: 'Taylor Swift - Fortnight (feat. Post Malone) (Behind the Scenes)',
      director: null,
      releasedOn: '2024-06-21',
      relatedSongs: ['Fortnight'],
      tags: ['Music'],
      summary:
        'The first "Fortnight" making-of video, released about two months after the single — an earlier, separate BTS drop from the December birthday batch.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=0GQ_QeZxdzo',
      media: [embed('0GQ_QeZxdzo', '2026-08-25')],
      sources: [
        yt('0GQ_QeZxdzo', 'Taylor Swift - Fortnight (feat. Post Malone) (Behind the Scenes)'),
        press(
          'https://www.billboard.com/music/music-news/taylor-swift-fortnight-behind-the-scenes-post-malone-video-1235715140/',
          'Taylor Swift Shares Behind-the-Scenes Video for "Fortnight"',
          'Billboard',
          'supports the June 21, 2024 release date',
        ),
      ],
    },
    // ── Appearances (YouTube-appearances pass, 2026-08-12) ──────────────────
    appearance({
      slug: 'vmas-fortnight-speech-2024',
      kind: 'award_speech',
      title: "Accepting Best Collaboration for 'Fortnight' — 2024 VMAs",
      releasedOn: '2024-09-11',
      summary:
        "Accepting Best Collaboration for 'Fortnight' with Post Malone, she stops the speech to mark the date: the anniversary of September 11.",
      youtubeId: 'g55D_gAoC3I',
      channel: 'Access Hollywood',
      attribution: 'Access Hollywood — the outlet’s official YouTube channel',
      tags: ['Music'],
      sources: [
        upload({
          youtubeId: 'g55D_gAoC3I',
          title: 'Taylor Swift Remembers 9/11 During VMAs Acceptance Speech',
          channel: 'Access Hollywood',
          // States only what was verified. An earlier draft said this channel
          // "owns" the footage — it doesn't: MTV owns the ceremony, Access
          // Hollywood is entertainment-news coverage of it. What IS established
          // is that the upload sits on Access Hollywood's own channel (oEmbed
          // author_name), i.e. a broadcaster's own upload and not a fan
          // re-upload, which is what the officialUrl rule actually requires.
          note: "upload on Access Hollywood's own channel (NBCUniversal entertainment news), not a fan re-upload — oEmbed author_name verified 2026-08-12",
        }),
      ],
    }),
  ],
};
