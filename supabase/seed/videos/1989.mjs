// Vault videos — 1989 era. Official uploads verified via YouTube oEmbed
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
  eraSlug: '1989',
  videos: [
    {
      slug: 'shake-it-off-mv',
      kind: 'music_video',
      title: 'Shake It Off',
      director: 'Mark Romanek',
      releasedOn: '2014-08-18',
      relatedSongs: ['Shake It Off'],
      summary:
        'Dropped the day 1989 was announced: Taylor gamely flails through ballet, breakdance, twerk squads and cheer lines before the finale says the quiet part — just dance like the fans do.',
      symbolism: 'Failing every polished dance style on purpose is the thesis: the haters\' scorecard doesn\'t apply.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=nfWlot6h_JM',
      media: [embed('nfWlot6h_JM')],
      sources: [yt('nfWlot6h_JM', 'Taylor Swift - Shake It Off'), wiki('Shake_It_Off', 'Shake It Off')],
    },
    {
      slug: 'blank-space-mv',
      kind: 'music_video',
      title: 'Blank Space',
      director: 'Joseph Kahn',
      releasedOn: '2014-11-10',
      relatedSongs: ['Blank Space'],
      summary:
        'The satire that ended the "boy-crazy" narrative by playing it to the hilt: a mansion romance curdles into golf-club-to-the-sports-car mania, with Taylor grinning through the tabloid caricature.',
      symbolism:
        'She is playing the media\'s version of Taylor Swift, not herself — the video is the song\'s joke made visible, and mainstream coverage read it exactly that way.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=e-ORhEE9VVg',
      media: [embed('e-ORhEE9VVg')],
      sources: [yt('e-ORhEE9VVg', 'Taylor Swift - Blank Space'), wiki('Blank_Space', 'Blank Space')],
    },
    {
      slug: 'style-mv',
      kind: 'music_video',
      title: 'Style',
      director: 'Joseph Kahn',
      releasedOn: '2015-02-13',
      relatedSongs: ['Style'],
      summary:
        'No plot, all texture: shattered mirrors, projected faces, fog and headlights — the album\'s moodiest song gets a video made of double exposures instead of story.',
      symbolism: 'The broken-mirror shards and projections keep the two lovers overlapping without ever quite aligning — the never-out-of-style loop rendered literally.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=-CmadmM5cOk',
      media: [embed('-CmadmM5cOk')],
      sources: [yt('-CmadmM5cOk', 'Taylor Swift - Style'), wiki('Style_(Taylor_Swift_song)', 'Style (Taylor Swift song)')],
    },
    {
      slug: 'bad-blood-mv',
      kind: 'music_video',
      title: 'Bad Blood',
      director: 'Joseph Kahn',
      releasedOn: '2015-05-17',
      relatedSongs: ['Bad Blood'],
      summary:
        'The squad-era action trailer: a betrayal, a training montage, and a cast of codenamed stars (Catastrophe, Arsyn, Knockout...) marching into a fireball — premiered at the Billboard Music Awards.',
      symbolism: null,
      easterEggs: ['Every cameo carries a comic-book codename in the credits — fans keep a full roster of who played whom.'],
      officialUrl: 'https://www.youtube.com/watch?v=QcIy9NiNbmo',
      media: [embed('QcIy9NiNbmo')],
      sources: [yt('QcIy9NiNbmo', 'Taylor Swift - Bad Blood ft. Kendrick Lamar'), wiki('Bad_Blood_(Taylor_Swift_song)', 'Bad Blood (Taylor Swift song)')],
    },
    {
      slug: 'wildest-dreams-mv',
      kind: 'music_video',
      title: 'Wildest Dreams',
      director: 'Joseph Kahn',
      releasedOn: '2015-08-30',
      relatedSongs: ['Wildest Dreams'],
      summary:
        'Old-Hollywood safari melodrama: two co-stars fall for each other on a 1950s film set, and the premiere ends the romance the way the song promised it would end. Proceeds went to African Parks.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=IdneKLhsWOQ',
      media: [embed('IdneKLhsWOQ')],
      sources: [yt('IdneKLhsWOQ', 'Taylor Swift - Wildest Dreams'), wiki('Wildest_Dreams', 'Wildest Dreams')],
    },
    {
      slug: 'out-of-the-woods-mv',
      kind: 'music_video',
      title: 'Out of the Woods',
      director: 'Joseph Kahn',
      releasedOn: '2015-12-31',
      relatedSongs: ['Out of the Woods'],
      summary:
        'Premiered on New Year\'s Eve: the woods literally chase Taylor — vines grab, snow buries, wolves close in — until she outruns the forest back to the beach and meets herself.',
      symbolism: 'The pursuing forest is the anxiety spiral of the lyric; arriving at her own calm self on the shore closes the loop the song leaves open.',
      easterEggs: [],
      // Official upload on Taylor's own channel — oEmbed-verified 2026-08-13
      // (author_name "Taylor Swift", title "Taylor Swift - Out Of The Woods").
      // The record shipped with no embed and rendered an unplayable card
      // (playable-first reversal, docs/decisions.md 2026-08-13).
      officialUrl: 'https://www.youtube.com/watch?v=JLf9q36UsBk',
      media: [embed('JLf9q36UsBk', '2026-08-13')],
      sources: [
        wiki('Out_of_the_Woods_(song)', 'Out of the Woods (song)'),
        press(
          'https://time.com/4164964/taylor-swift-new-music-video-out-woods-watch/',
          "Watch Taylor Swift's New Music Video 'Out of the Woods'",
          'Time',
          "supports the New Year's Eve premiere and video imagery",
        ),
        press(
          'https://www.vanityfair.com/hollywood/2015/12/taylor-swift-out-of-the-woods-music-video-announcement',
          'Taylor Swift Will Close Out Her Stellar 2015 with a New Music Video',
          'Vanity Fair',
          "supports the New Year's Rockin' Eve video-premiere setup",
        ),
      ],
    },
    {
      slug: 'new-romantics-mv',
      kind: 'music_video',
      title: 'New Romantics',
      director: 'Jonas Åkerlund',
      releasedOn: null,
      relatedSongs: ['New Romantics'],
      summary:
        'A thank-you cut from 1989 World Tour footage — backstage, crowd waves, confetti — released as the era\'s victory lap for the fans who made the bonus track a hit.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-13 (author_name "Taylor Swift", title
      // "Taylor Swift - New Romantics"). Search surfaces several higher-res
      // re-uploads of this video on fan channels; this is the one on her own
      // channel, which is the only kind that may be an officialUrl.
      officialUrl: 'https://www.youtube.com/watch?v=wyK7YuwUWsU',
      media: [embed('wyK7YuwUWsU', '2026-08-13')],
      sources: [wiki('New_Romantics_(song)', 'New Romantics (song)')],
    },
    {
      slug: 'the-1989-world-tour-live-film',
      kind: 'tour_film',
      title: 'The 1989 World Tour Live',
      director: 'Jonas Åkerlund',
      releasedOn: '2015-12-20',
      relatedSongs: [],
      summary:
        'The Sydney stadium show captured for Apple Music — light-up wristbands, the catwalk, and the era\'s guest-star ritual folded into a streaming-exclusive concert film.',
      symbolism: null,
      easterEggs: [],
      // No official upload of the work itself exists — it is an Apple Music streaming exclusive.
      // With no embed this record is HIDDEN from every reader-facing surface
      // rather than shown as a card that cannot play (playable-first rule,
      // docs/decisions.md 2026-08-13). Add a verified official upload here and
      // it comes back automatically — no code change needed.
      officialUrl: null,
      media: [],
      sources: [
        wiki('The_1989_World_Tour_Live', 'The 1989 World Tour Live'),
        press(
          'https://www.billboard.com/music/pop/taylor-swift-1989-world-tour-live-concert-film-apple-music-6805694/',
          "Taylor Swift '1989 World Tour Live' Concert Film Coming to Apple Music: Watch Trailer",
          'Billboard',
          'supports the Apple Music concert-film release and Sydney-tour-film framing',
        ),
      ],
    },
    // ── Appearances (YouTube-appearances pass, 2026-08-12) ──────────────────
    appearance({
      slug: 'grammys-album-of-the-year-2016',
      kind: 'award_speech',
      title: 'Accepting Album of the Year for 1989 — 58th GRAMMYs',
      releasedOn: '2016-02-15',
      summary:
        'A second Album of the Year makes her the first woman to win it twice — and she closes with advice to any young woman watching: there will be people who try to undercut your success.',
      youtubeId: 'dMCAEUb0h34',
      channel: 'GRAMMYS',
      attribution: "GRAMMYs — the Recording Academy's official YouTube channel",
      sources: [
        upload({
          youtubeId: 'dMCAEUb0h34',
          title: 'Taylor Swift | Album of the Year | 58th GRAMMYs',
          channel: 'GRAMMYS',
          note: "official upload on the Recording Academy's own channel — oEmbed-verified 2026-08-12",
        }),
        pressSource(
          'https://time.com/4225261/2016-grammys-taylor-swift-kanye-west/',
          "Taylor Swift's Grammys Speech",
          'Time',
          'reports the speech and the reaction to it',
        ),
      ],
    }),
  ],
};
