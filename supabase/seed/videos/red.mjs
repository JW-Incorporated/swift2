// Vault videos — Red era. Official uploads verified via YouTube oEmbed
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

export default {
  eraSlug: 'red',
  videos: [
    {
      slug: 'safe-and-sound-mv',
      kind: 'music_video',
      title: 'Safe & Sound',
      director: null,
      releasedOn: '2012-02-13',
      relatedSongs: ['Safe & Sound'],
      tags: ['Music'],
      summary:
        'A barefoot walk through a Watertown, Tennessee forest and cemetery in a long white gown, intercut with The Civil Wars performing by firelight — recorded for The Hunger Games soundtrack, dotted with mockingjay references.',
      symbolism: null,
      easterEggs: ['Taylor finds a mockingjay pin during the woods sequence, tying the video to the film\'s central symbol.'],
      officialUrl: 'https://www.youtube.com/watch?v=RzhAS_GnJIc',
      media: [embed('RzhAS_GnJIc')],
      sources: [
        yt('RzhAS_GnJIc', 'Safe & Sound feat. The Civil Wars (The Hunger Games: Songs From District 12 And Beyond)'),
        wiki('Safe_%26_Sound_(Taylor_Swift_song)', 'Safe & Sound (Taylor Swift song)'),
      ],
    },
    {
      slug: 'red-mv',
      kind: 'music_video',
      title: 'Red',
      director: 'Kenny Jackson',
      releasedOn: '2013-07-03',
      relatedSongs: ['Red'],
      tags: ['Music'],
      summary:
        'An edited concert-performance video cut from live shows in front of thousands of fans, rather than a scripted narrative — the album\'s fifth single.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=Zlot0i3Zykw',
      media: [embed('Zlot0i3Zykw')],
      sources: [yt('Zlot0i3Zykw', 'Taylor Swift - Red'), wiki('Red_(Taylor_Swift_song)', 'Red (Taylor Swift song)')],
    },
    {
      slug: 'we-are-never-ever-getting-back-together-mv',
      kind: 'music_video',
      title: 'We Are Never Ever Getting Back Together',
      director: 'Declan Whitebloom',
      releasedOn: null,
      relatedSongs: ['We Are Never Ever Getting Back Together'],
      tags: ['Music'],
      summary:
        'Styled as one continuous take through a storybook house party — pajamas, a phone call, and a band in animal costumes — for her first Hot 100 #1.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=WA4iX5D9Z64',
      media: [embed('WA4iX5D9Z64')],
      sources: [yt('WA4iX5D9Z64', 'Taylor Swift - We Are Never Ever Getting Back Together'), wiki('We_Are_Never_Ever_Getting_Back_Together', 'We Are Never Ever Getting Back Together')],
    },
    {
      slug: 'i-knew-you-were-trouble-mv',
      kind: 'music_video',
      title: 'I Knew You Were Trouble',
      director: 'Anthony Mandler',
      releasedOn: null,
      relatedSongs: ['I Knew You Were Trouble'],
      tags: ['Music'],
      summary:
        'A two-minute spoken prologue, a desert festival, a doomed bad-boy romance told in flashback grit — the era\'s deliberate swerve from country sweetheart staging into pop cinema.',
      symbolism: 'Waking up alone in the desert bookends the story: the video opens on the aftermath and spends its runtime explaining the wreckage.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=vNoKguSdy4Y',
      media: [embed('vNoKguSdy4Y')],
      sources: [yt('vNoKguSdy4Y', 'Taylor Swift - I Knew You Were Trouble'), wiki('I_Knew_You_Were_Trouble', 'I Knew You Were Trouble')],
    },
    {
      slug: '22-mv',
      kind: 'music_video',
      title: '22',
      director: 'Anthony Mandler',
      releasedOn: null,
      relatedSongs: ['22'],
      tags: ['Music'],
      summary:
        'Shot like a home movie of the best day off ever: real-friends hangout energy, the "not a lot going on at the moment" tee, a beach-party ending — breakfast at midnight canonized.',
      symbolism: null,
      easterEggs: [
        'Anti-Hero\'s party ghosts wear the 22 video\'s heart-shaped sunglasses and cat ears, and the "not a lot going on at the moment" tee returned — reworded — as an Eras Tour costume.',
      ],
      officialUrl: 'https://www.youtube.com/watch?v=AgFeZr5ptV8',
      media: [embed('AgFeZr5ptV8')],
      sources: [yt('AgFeZr5ptV8', 'Taylor Swift - 22'), wiki('22_(Taylor_Swift_song)', '22 (Taylor Swift song)')],
    },
    {
      slug: 'everything-has-changed-mv',
      kind: 'music_video',
      title: 'Everything Has Changed',
      director: 'Philip Andelman',
      releasedOn: null,
      relatedSongs: ['Everything Has Changed'],
      tags: ['Music'],
      summary:
        'Two grade-schoolers play out the duet\'s friendship-into-something-more — and the kicker reveals Taylor and Ed Sheeran as the parents picking them up.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-13 (author_name "Taylor Swift", title "Taylor
      // Swift - Everything Has Changed ft. Ed Sheeran") — the 2013 original.
      officialUrl: 'https://www.youtube.com/watch?v=w1oM3kQpXRo',
      media: [embed('w1oM3kQpXRo', '2026-08-13')],
      sources: [
        wiki('Everything_Has_Changed', 'Everything Has Changed'),
        press(
          'https://www.billboard.com/music/music-news/taylor-swift-ed-sheeran-return-to-childhood-in-everything-has-changed-video-watch-1565874/',
          "Taylor Swift, Ed Sheeran Return to Childhood in 'Everything Has Changed' Video: Watch",
          'Billboard',
          'supports the Philip Andelman video release and child-counterpart story framing',
        ),
      ],
    },
    {
      slug: 'the-last-time-mv',
      kind: 'music_video',
      title: 'The Last Time',
      director: null,
      releasedOn: null,
      relatedSongs: ['The Last Time'],
      tags: ['Music'],
      summary:
        'A live-performance video built from Red Tour footage of Taylor and duet partner Gary Lightbody trading the song\'s dueling verses onstage, seated on facing stools — the album\'s final single.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-24 (author_name "Taylor Swift", title "Taylor
      // Swift - The Last Time ft. Gary Lightbody").
      officialUrl: 'https://www.youtube.com/watch?v=QuijXg8wm28',
      media: [embed('QuijXg8wm28', '2026-08-24')],
      sources: [
        yt('QuijXg8wm28', 'Taylor Swift - The Last Time ft. Gary Lightbody'),
        wiki('The_Last_Time_(Taylor_Swift_song)', 'The Last Time (Taylor Swift song)'),
      ],
    },
    {
      slug: 'begin-again-mv',
      kind: 'music_video',
      title: 'Begin Again',
      director: 'Philip Andelman',
      releasedOn: null,
      relatedSongs: ['Begin Again'],
      tags: ['Music'],
      summary:
        'Shot in Paris: a slow, sunlit walk out of one story and into the possibility of another — café tables, cobblestones, and the album\'s gentlest landing.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-13 (author_name "Taylor Swift", title "Taylor
      // Swift - Begin Again"). Same id the red.mjs timeline moment already
      // embeds, so the Videos filter de-dupes this record against the moment
      // (eraVideoFeed) — by design; the rail still carries it.
      officialUrl: 'https://www.youtube.com/watch?v=cMPEd8m79Hw',
      media: [embed('cMPEd8m79Hw', '2026-08-13')],
      sources: [
        wiki('Begin_Again_(Taylor_Swift_song)', 'Begin Again (Taylor Swift song)'),
        press(
          'https://tasteofcountry.com/taylor-swift-begin-again-video/',
          "Taylor Swift Starts Over in Scenic 'Begin Again' Video",
          'Taste of Country',
          'supports the Paris-shot video and moving-on visual narrative',
        ),
      ],
    },
    {
      slug: 'red-live-from-new-york-city',
      kind: 'performance',
      title: 'Red (Live from New York City)',
      director: null,
      releasedOn: null,
      relatedSongs: ['Red'],
      tags: ['Music'],
      summary:
        'A solo live performance of the title track taped in New York City, one of six Red-era and catalog songs the official channel posted under the "Live From New York City" banner.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=gQ0pP2z9niw',
      media: [embed('gQ0pP2z9niw', '2026-08-25')],
      sources: [
        yt('gQ0pP2z9niw', 'Taylor Swift - Red (Live from New York City)'),
        wiki('Red_(Taylor_Swift_song)', 'Red (Taylor Swift song)'),
      ],
    },
    {
      slug: 'we-are-never-ever-getting-back-together-live-from-new-york-city',
      kind: 'performance',
      title: 'We Are Never Ever Getting Back Together (Live from New York City)',
      director: null,
      releasedOn: null,
      relatedSongs: ['We Are Never Ever Getting Back Together'],
      tags: ['Music'],
      summary:
        'A solo live performance of the Red lead single taped in New York City, one of six Red-era and catalog songs the official channel posted under the "Live From New York City" banner.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=BktS1hkMx_k',
      media: [embed('BktS1hkMx_k', '2026-08-25')],
      sources: [
        yt('BktS1hkMx_k', 'Taylor Swift - We Are Never Ever Getting Back Together (Live from New York City)'),
        wiki('We_Are_Never_Ever_Getting_Back_Together', 'We Are Never Ever Getting Back Together'),
      ],
    },
    {
      slug: 'love-story-live-from-new-york-city',
      kind: 'performance',
      title: 'Love Story (Live from New York City)',
      director: null,
      releasedOn: null,
      relatedSongs: ['Love Story'],
      tags: ['Music'],
      summary:
        'A solo live performance of the Fearless-era catalog hit taped in New York City during the Red run, one of six songs the official channel posted under the "Live From New York City" banner.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=yfWgXcrNQIw',
      media: [embed('yfWgXcrNQIw', '2026-08-25')],
      sources: [
        yt('yfWgXcrNQIw', 'Taylor Swift - Love Story (Live from New York City)'),
        wiki('Love_Story_(Taylor_Swift_song)', 'Love Story (Taylor Swift song)'),
      ],
    },
    {
      slug: 'you-belong-with-me-live-from-new-york-city',
      kind: 'performance',
      title: 'You Belong with Me (Live from New York City)',
      director: null,
      releasedOn: null,
      relatedSongs: ['You Belong with Me'],
      tags: ['Music'],
      summary:
        'A solo live performance of the Fearless-era catalog hit taped in New York City during the Red run, one of six songs the official channel posted under the "Live From New York City" banner.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=tvnGBYMe9gM',
      media: [embed('tvnGBYMe9gM', '2026-08-25')],
      sources: [
        yt('tvnGBYMe9gM', 'Taylor Swift - You Belong With Me (Live from New York City)'),
        wiki('You_Belong_with_Me', 'You Belong with Me'),
      ],
    },
    {
      slug: 'mean-live-from-new-york-city',
      kind: 'performance',
      title: 'Mean (Live from New York City)',
      director: null,
      releasedOn: null,
      relatedSongs: ['Mean'],
      tags: ['Music'],
      summary:
        'A solo live performance of the Grammy-winning Speak Now single taped in New York City during the Red run, one of six songs the official channel posted under the "Live From New York City" banner.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=RQuY8kERaU0',
      media: [embed('RQuY8kERaU0', '2026-08-25')],
      sources: [
        yt('RQuY8kERaU0', 'Taylor Swift - Mean (Live from New York City)'),
        wiki('Mean_(song)', 'Mean (song)'),
      ],
    },
    {
      slug: 'everything-has-changed-britains-got-talent-2013',
      kind: 'performance',
      title: "Everything Has Changed — Britain's Got Talent",
      director: null,
      releasedOn: '2013-06-08',
      relatedSongs: ['Everything Has Changed'],
      tags: ['Music'],
      summary:
        'A guest performance of "Everything Has Changed" with Ed Sheeran during the live final of Britain\'s Got Talent series 7, alongside fellow guest act Psy.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=YfPfgZjhH1w',
      media: [embed('YfPfgZjhH1w', '2026-08-25')],
      sources: [
        yt('YfPfgZjhH1w', "Britain's Got Talent performance: Everything Has Changed"),
        wiki(
          'Britain%27s_Got_Talent_(series_7)',
          "Britain's Got Talent (series 7)",
          'confirms the June 8, 2013 live final and the Taylor Swift / Ed Sheeran guest performance',
        ),
      ],
    },
    {
      slug: 'begin-again-live-from-new-york-city',
      kind: 'performance',
      title: 'Begin Again (Live from New York City)',
      director: null,
      releasedOn: null,
      relatedSongs: ['Begin Again'],
      tags: ['Music'],
      summary:
        'A stripped-down New York City performance of "Begin Again," part of the same release-week live series as the "Red," "We Are Never Ever Getting Back Together," "Love Story," "You Belong With Me" and "Mean" NYC videos on this channel.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-25 (author_name "Taylor Swift", upload
      // dated 2012-11-05 — part of the same NYC live-series batch as the
      // sibling entries above).
      officialUrl: 'https://www.youtube.com/watch?v=cQ5tlnGg4wc',
      media: [embed('cQ5tlnGg4wc', '2026-08-25')],
      sources: [
        yt('cQ5tlnGg4wc', 'Taylor Swift - Begin Again (Live from New York City)'),
        wiki('Begin_Again_(song)', 'Begin Again (song)'),
      ],
    },
    {
      slug: 'acoustic-performances-from-red-album',
      kind: 'performance',
      title: 'Acoustic Performances from RED Album',
      director: null,
      releasedOn: '2012-12-17',
      relatedSongs: [],
      tags: ['Music'],
      summary:
        'A 15-minute compilation of stripped-down acoustic performances of songs from Red, uploaded to the official channel in the album\'s release window.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-25 (author_name "Taylor Swift", upload
      // dated 2012-12-17, runtime 15:26).
      officialUrl: 'https://www.youtube.com/watch?v=2obMo7y-rvA',
      media: [embed('2obMo7y-rvA', '2026-08-25')],
      sources: [
        yt('2obMo7y-rvA', 'Taylor Swift - Acoustic Performances from RED Album'),
        wiki('Red_(Taylor_Swift_album)', 'Red (Taylor Swift album)'),
      ],
    },
    {
      slug: 'i-knew-you-were-trouble-behind-the-scenes-2',
      kind: 'documentary',
      title: '"I Knew You Were Trouble." Behind-The-Scenes #2',
      director: null,
      releasedOn: '2013-02-05',
      relatedSongs: ['I Knew You Were Trouble'],
      tags: ['Music'],
      summary:
        'The second behind-the-scenes installment documenting the making of the "I Knew You Were Trouble" music video, released as a follow-up companion to the official video.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-25 (author_name "Taylor Swift", upload
      // dated 2013-02-05, runtime 3:53).
      officialUrl: 'https://www.youtube.com/watch?v=sIjKXPXjVxU',
      media: [embed('sIjKXPXjVxU', '2026-08-25')],
      sources: [
        yt('sIjKXPXjVxU', '"I Knew You Were Trouble." Behind-The-Scenes #2'),
        wiki('I_Knew_You_Were_Trouble', 'I Knew You Were Trouble'),
      ],
    },
    {
      slug: 'red-tour-announcement-2012',
      kind: 'speech',
      title: "Taylor Swift's RED Tour Announcement!",
      director: null,
      releasedOn: '2012-10-26',
      relatedSongs: [],
      tags: ['Tour'],
      summary:
        'A direct-to-camera clip announcing The Red Tour, posted the day after Taylor revealed the 2013 stadium/arena run — 58 shows across North America kicking off March 13, 2013 in Omaha — during her "Red" release-week press blitz.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-25 (author_name "Taylor Swift", upload
      // dated 2012-10-26).
      officialUrl: 'https://www.youtube.com/watch?v=YoJj-5nAGpM',
      media: [embed('YoJj-5nAGpM', '2026-08-25')],
      sources: [
        yt('YoJj-5nAGpM', "Taylor Swift's RED Tour Announcement!"),
        press(
          'https://www.hollywoodreporter.com/news/general-news/taylor-swift-red-tour-announcement-383654/',
          'Taylor Swift Red Tour Announcement',
          'The Hollywood Reporter',
          'confirms the October 2012 announcement and the March 13, 2013 Omaha tour opener',
        ),
      ],
    },
  ],
};
