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
const embed = (id) => ({
  kind: 'oembed',
  rights: 'platform_tos',
  provider: 'youtube',
  post_url: `https://www.youtube.com/watch?v=${id}`,
  oembed_fetched_at: '2026-07-08',
  attribution: 'Taylor Swift — official YouTube channel',
});

export default {
  eraSlug: 'red',
  videos: [
    {
      slug: 'we-are-never-ever-getting-back-together-mv',
      kind: 'music_video',
      title: 'We Are Never Ever Getting Back Together',
      director: 'Declan Whitebloom',
      releasedOn: null,
      relatedSongs: ['We Are Never Ever Getting Back Together'],
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
      summary:
        'Shot like a home movie of the best day off ever: real-friends hangout energy, the "not a lot going on at the moment" tee, a beach-party ending — breakfast at midnight canonized.',
      symbolism: null,
      easterEggs: [
        'The hipster-glasses-and-tee look returned a decade later in the Anti-Hero video and as an Eras Tour costume — the era cross-reference fans clock instantly.',
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
      summary:
        'Two grade-schoolers play out the duet\'s friendship-into-something-more — and the kicker reveals Taylor and Ed Sheeran as the parents picking them up.',
      symbolism: null,
      easterEggs: [],
      officialUrl: null,
      media: [],
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
      slug: 'begin-again-mv',
      kind: 'music_video',
      title: 'Begin Again',
      director: 'Philip Andelman',
      releasedOn: null,
      relatedSongs: ['Begin Again'],
      summary:
        'Shot in Paris: a slow, sunlit walk out of one story and into the possibility of another — café tables, cobblestones, and the album\'s gentlest landing.',
      symbolism: null,
      easterEggs: [],
      officialUrl: null,
      media: [],
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
  ],
};
