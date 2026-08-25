// Vault videos — evermore era (includes the Fearless/Red Taylor's Version
// window). Official uploads verified via YouTube oEmbed 2026-07-08; Wikipedia
// URLs verified the same day.

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
  eraSlug: 'evermore',
  videos: [
    {
      slug: 'willow-mv',
      kind: 'music_video',
      title: 'willow',
      director: 'Taylor Swift',
      releasedOn: '2020-12-11',
      relatedSongs: ['willow'],
      tags: ['Music'],
      summary:
        'Picks up in the exact frame cardigan left off: from the piano, Taylor follows a golden thread through winter woods, a carnival tent, and firelit ritual circles to find the person on the other end.',
      symbolism:
        'The glowing thread is the "invisible string" made visible — the two sister-album videos form one continuous story fans treat as a diptych.',
      easterEggs: ['Opens inside the same piano the cardigan video ends in — a deliberate continuity handoff between sister albums.'],
      officialUrl: 'https://www.youtube.com/watch?v=RsEZmictANA',
      media: [embed('RsEZmictANA')],
      sources: [yt('RsEZmictANA', 'Taylor Swift - willow (Official Music Video)'), wiki('Willow_(song)', 'willow (song)')],
    },
    {
      slug: 'all-too-well-the-short-film',
      kind: 'short_film',
      title: 'All Too Well: The Short Film',
      director: 'Taylor Swift',
      releasedOn: '2021-11-12',
      relatedSongs: ['All Too Well (10 Minute Version)'],
      tags: ['Music'],
      summary:
        'Fifteen minutes starring Sadie Sink and Dylan O\'Brien: the whole arc of the fan-canonized breakup epic — the refrigerator-light dance, the kitchen fight, the scarf — released with Red (Taylor\'s Version) and premiered theatrically.',
      symbolism:
        'The closing scene jumps years ahead to an author reading from a book titled All Too Well: the song\'s thesis that she keeps custody of the story by writing it.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=tollGa3S0o8',
      media: [embed('tollGa3S0o8')],
      sources: [
        yt('tollGa3S0o8', 'Taylor Swift - All Too Well: The Short Film'),
        wiki('All_Too_Well:_The_Short_Film', 'All Too Well: The Short Film', 'documents the theatrical premiere and its Grammy/VMA wins'),
      ],
    },
    {
      // YouTube-appearances research pass (2026-08-12): official upload
      // oEmbed-verified 2026-08-12 (title + author_name "Taylor Swift").
      slug: 'all-too-well-10-min-snl-performance',
      kind: 'performance',
      title: 'All Too Well (10 Minute Version) — Live on Saturday Night Live',
      director: null,
      releasedOn: '2021-11-13',
      relatedSongs: ['All Too Well (10 Minute Version)'],
      tags: ['Music'],
      summary:
        'A rare single-song SNL musical-guest slot, one day after Red (Taylor\'s Version): the full ten minutes live on a leaf-strewn stage, short-film footage rolling behind her, snow falling by the last verse.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=nJr_8l0AEWE',
      media: [
        {
          kind: 'oembed',
          rights: 'platform_tos',
          provider: 'youtube',
          post_url: 'https://www.youtube.com/watch?v=nJr_8l0AEWE',
          oembed_fetched_at: '2026-08-12',
          attribution: 'Taylor Swift — official YouTube channel',
        },
      ],
      sources: [
        {
          source_url: 'https://www.youtube.com/watch?v=nJr_8l0AEWE',
          source_title: 'Taylor Swift - All Too Well (10 Minute Version) (Live on Saturday Night Live)',
          publisher: 'Taylor Swift (official YouTube channel)',
          source_type: 'official',
          accessed_at: '2026-08-12',
          reliability_score: 5,
          excerpt: null,
          notes: 'official upload — verified via YouTube oEmbed 2026-08-12',
        },
        // Not the press() helper: it hardcodes accessed_at 2026-07-09, which
        // would stamp a source added and verified on 2026-08-12 with a
        // month-old access date.
        {
          source_url: 'https://www.billboard.com/music/pop/taylor-swift-snl-all-too-well-10-minute-version-performance-video-9659774/',
          source_title: "'SNL': Taylor Swift Performs \"All Too Well (10 Minute Version)\"",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-08-12',
          reliability_score: 4,
          excerpt: null,
          notes: 'documents the single-song musical-guest slot and the short-film backdrop',
        },
      ],
    },
    {
      slug: 'i-bet-you-think-about-me-mv',
      kind: 'music_video',
      title: 'I Bet You Think About Me',
      director: 'Blake Lively',
      releasedOn: '2021-11-15',
      relatedSongs: ['I Bet You Think About Me'],
      tags: ['Music'],
      summary:
        'Blake Lively\'s directorial debut: Taylor crashes a pastel society wedding as the red-dressed ghost of relationships past, gleefully ruining the cake — the vault track as screwball comedy.',
      symbolism: 'She is the only thing in red in a room styled entirely in polite neutrals — the era\'s color used as a walking punchline.',
      easterEggs: [],
      // oEmbed-verified 2026-08-13 (author_name "Taylor Swift", title "Taylor
      // Swift ft. Chris Stapleton - I Bet You Think About Me (Taylor's
      // Version) (Official Video)"). The Taylor's Version upload is the only
      // one that exists — the song is a From The Vault track, so there is no
      // earlier original to prefer.
      officialUrl: 'https://www.youtube.com/watch?v=5UMCrq-bBCg',
      media: [embed('5UMCrq-bBCg', '2026-08-13')],
      sources: [
        wiki('I_Bet_You_Think_About_Me', 'I Bet You Think About Me'),
        press(
          'https://www.teenvogue.com/story/taylor-swift-i-bet-you-think-about-me-music-video-blake-lively',
          "Taylor Swift to Release 'I Bet You Think About Me' Music Video Directed By Blake Lively",
          'Teen Vogue',
          "supports Blake Lively's directorial debut and the music-video rollout",
        ),
      ],
    },
    // ── Appearances (YouTube-appearances pass, 2026-08-12) ──────────────────
    appearance({
      slug: 'jimmy-kimmel-live-2020',
      kind: 'interview',
      title: 'Interview on Jimmy Kimmel Live!',
      releasedOn: '2020-12-14',
      summary:
        'Days after evermore arrived with no rollout: how she kept a second surprise album secret in the same year as folklore, the fan theories she reads, and the William Bowery question.',
      youtubeId: 'ionfV_r8s40',
      channel: 'Jimmy Kimmel Live',
      tags: ['Music', 'Lore'],
      sources: [
        upload({
          youtubeId: 'ionfV_r8s40',
          title:
            'Taylor Swift on Turning 31, New Album, Fan Theories, Documentary & Boyfriend’s Pseudonym',
          channel: 'Jimmy Kimmel Live',
        }),
      ],
    }),
    appearance({
      slug: 'nyu-commencement-2022',
      kind: 'speech',
      title: 'NYU commencement address',
      releasedOn: '2022-05-18',
      summary:
        "An honorary Doctor of Fine Arts at Yankee Stadium, then twenty minutes to NYU's class of 2022 — including her case that cringe is unavoidable over a long enough life.",
      youtubeId: 'OBG50aoUwlI',
      channel: 'New York University',
      sources: [
        upload({
          youtubeId: 'OBG50aoUwlI',
          title: "NYU's 2022 Commencement Speaker Taylor Swift",
          channel: 'New York University',
          note: "official upload on the university's own channel — oEmbed-verified 2026-08-12",
        }),
      ],
    }),
    appearance({
      slug: 'vmas-midnights-announcement-2022',
      kind: 'award_speech',
      title: 'Announcing Midnights from the VMAs stage',
      releasedOn: '2022-08-28',
      summary:
        "'All Too Well: The Short Film' wins Video of the Year — and she spends the end of the acceptance speech announcing a brand-new album, Midnights, arriving October 21.",
      youtubeId: '_J1dJLDrPBo',
      channel: 'MTV UK',
      tags: ['Music'],
      sources: [
        upload({
          youtubeId: '_J1dJLDrPBo',
          title: "Taylor Swift Announces Her New Album 'Midnights' at the 2022 VMAs | MTV News",
          channel: 'MTV UK',
          note: 'official upload on MTV UK — the rights-holding broadcaster of the ceremony; oEmbed-verified 2026-08-12',
        }),
      ],
    }),

    {
      slug: 'the-best-day-taylors-version-mv',
      kind: 'music_video',
      title: "The Best Day (Taylor's Version)",
      director: null,
      releasedOn: '2021-04-09',
      relatedSongs: ['The Best Day (Taylor\'s Version)'],
      tags: ['Music'],
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
      slug: 'mr-perfectly-fine-taylors-version-lyric-video',
      kind: 'lyric_video',
      title: "Mr. Perfectly Fine (Taylor's Version) (From the Vault)",
      director: null,
      releasedOn: '2021-04-09',
      relatedSongs: ["Mr. Perfectly Fine (Taylor's Version)"],
      tags: ['Music'],
      summary:
        'A vault-track lyric video released alongside Fearless (Taylor\'s Version) — the "casually cruel" comeback song fans had wanted a video for since it leaked in 2010.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-24 (author_name "Taylor Swift", title "Taylor
      // Swift - Mr. Perfectly Fine (Taylor's Version) (From The Vault) (Lyric
      // Video)").
      officialUrl: 'https://www.youtube.com/watch?v=rFjJs6ZjPe8',
      media: [embed('rFjJs6ZjPe8', '2026-08-24')],
      sources: [
        yt('rFjJs6ZjPe8', "Taylor Swift - Mr. Perfectly Fine (Taylor's Version) (From The Vault) (Lyric Video)"),
        wiki('Mr._Perfectly_Fine', 'Mr. Perfectly Fine'),
      ],
    },
  ],
};
