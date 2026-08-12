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
const embed = (id) => ({
  kind: 'oembed',
  rights: 'platform_tos',
  provider: 'youtube',
  post_url: `https://www.youtube.com/watch?v=${id}`,
  oembed_fetched_at: '2026-07-08',
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
      summary:
        'Built from real Eras Tour rehearsal and backstage footage: the show-must-go-on song scored by the machinery of the actual show — lifts, quick changes, and the smile snapping on at places, everyone.',
      symbolism: 'Using documentary tour footage as the "set" makes the lyric literal: the biggest tour ever staged is the broken heart\'s day job.',
      easterEggs: [],
      officialUrl: null,
      media: [],
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
