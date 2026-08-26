// Vault videos — Speak Now era. Official uploads verified via YouTube oEmbed
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
  eraSlug: 'speak-now',
  videos: [
    {
      slug: 'mine-mv',
      kind: 'music_video',
      title: 'Mine',
      director: 'Roman White',
      releasedOn: null,
      relatedSongs: ['Mine'],
      tags: ['Music'],
      summary:
        'A whole imagined lifetime in four minutes: from café glance to kids and a kitchen argument and back — the flash-forward fantasy structure the song\'s "careless man\'s careful daughter" narrates.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=XPBwXKgDTdE',
      media: [embed('XPBwXKgDTdE')],
      sources: [yt('XPBwXKgDTdE', 'Taylor Swift - Mine'), wiki('Mine_(Taylor_Swift_song)', 'Mine (Taylor Swift song)')],
    },
    {
      slug: 'back-to-december-mv',
      kind: 'music_video',
      title: 'Back to December',
      director: 'Yoann Lemoine',
      releasedOn: null,
      relatedSongs: ['Back to December'],
      tags: ['Music'],
      summary:
        'Snow falls indoors: Taylor writes an apology from a room slowly buried in winter while the boy she wronged moves through parallel scenes — her first video built on a single sustained visual metaphor.',
      symbolism: 'The encroaching snow literalizes the regret the lyric circles — December overtaking the room as the apology goes unanswered.',
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=QUwxKWT6m7U',
      media: [embed('QUwxKWT6m7U')],
      sources: [yt('QUwxKWT6m7U', 'Taylor Swift - Back To December'), wiki('Back_to_December', 'Back to December')],
    },
    {
      slug: 'mean-mv',
      kind: 'music_video',
      title: 'Mean',
      director: 'Declan Whitebloom',
      releasedOn: null,
      relatedSongs: ['Mean'],
      tags: ['Music'],
      summary:
        'Banjo-vaudeville staging with a moral: the mocked kids of the verses grow up and out — into the big city, the stadium, the life the bully said they\'d never have — while the band plays a saloon set.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=jYa1eI1hpDE',
      media: [embed('jYa1eI1hpDE')],
      sources: [
        yt('jYa1eI1hpDE', 'Taylor Swift - Mean'),
        wiki('Mean_(song)', 'Mean (song)', 'the song later won two Grammys, sealing the video\'s underdog arc'),
      ],
    },
    {
      slug: 'the-story-of-us-mv',
      kind: 'music_video',
      title: 'The Story of Us',
      director: 'Noble Jones',
      releasedOn: null,
      relatedSongs: ['The Story of Us'],
      tags: ['Music'],
      summary:
        'A library at war: two exes study tables apart as the silence gets louder, pages fly, and the "chapter" conceit of the lyric plays out in the stacks.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-13 (author_name "Taylor Swift", title
      // "Taylor Swift - The Story Of Us") — the 2011 original.
      officialUrl: 'https://www.youtube.com/watch?v=nN6VR92V70M',
      media: [embed('nN6VR92V70M', '2026-08-13')],
      sources: [
        wiki('The_Story_of_Us_(song)', 'The Story of Us (song)'),
        press(
          'https://tasteofcountry.com/taylor-swift-story-of-us-video/',
          "Taylor Swift Tells 'The Story of Us' in New Video",
          'Taste of Country',
          'supports the library-set music-video premise and premiere coverage',
        ),
      ],
    },
    {
      slug: 'sparks-fly-mv',
      kind: 'music_video',
      title: 'Sparks Fly',
      director: null,
      releasedOn: null,
      relatedSongs: ['Sparks Fly'],
      tags: ['Music'],
      summary:
        'A live-performance video compiled from Speak Now World Tour footage, directed by Christian Lamb and released August 2011 — the album\'s fifth single.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=oKar-tF__ac',
      media: [embed('oKar-tF__ac')],
      sources: [yt('oKar-tF__ac', 'Taylor Swift - Sparks Fly'), wiki('Sparks_Fly_(song)', 'Sparks Fly (song)')],
    },
    {
      slug: 'ours-mv',
      kind: 'music_video',
      title: 'Ours',
      director: 'Declan Whitebloom',
      releasedOn: null,
      relatedSongs: ['Ours'],
      tags: ['Music'],
      summary:
        'Taylor plays an office worker grinding through corporate monotony — bus commute, water-cooler small talk — until the day ends at the airport, where she reunites with her boyfriend, a soldier returning home, played by Zach Gilford.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=LZ34LlaIk88',
      media: [embed('LZ34LlaIk88')],
      sources: [yt('LZ34LlaIk88', 'Taylor Swift - Ours'), wiki('Ours_(song)', 'Ours (song)')],
    },
    {
      slug: 'speak-now-world-tour-live',
      kind: 'tour_film',
      title: 'Speak Now World Tour – Live',
      director: null,
      releasedOn: '2011-11-21',
      relatedSongs: [],
      tags: ['Tour'],
      summary:
        'The theatrical Speak Now show — aerial ballet, the levitating balcony, the confetti-showered Love Story finale performed from a flying balcony — captured across the 2011 arena run and released as a live CD/DVD.',
      symbolism: null,
      easterEggs: [],
      // No official upload of the work itself exists — it is a live CD/DVD release.
      // With no embed this record is HIDDEN from every reader-facing surface
      // rather than shown as a card that cannot play (playable-first rule,
      // docs/decisions.md 2026-08-13). Add a verified official upload here and
      // it comes back automatically — no code change needed.
      officialUrl: null,
      media: [],
      sources: [
        wiki('Speak_Now_World_Tour', 'Speak Now World Tour', 'the live album/film is documented in the tour article'),
        press(
          'https://www.hollywoodreporter.com/news/general-news/taylor-swift-speak-now-tour-live-cd-dvd-263669/',
          'Taylor Swift Announces Speak Now World Tour Live CD/DVD',
          'The Hollywood Reporter',
          'supports the live CD/DVD release and theatrical tour-film framing',
        ),
      ],
    },
    {
      slug: 'speak-now-live-letterman',
      kind: 'performance',
      title: 'Speak Now (Live on Letterman)',
      director: null,
      releasedOn: '2010-10-26',
      relatedSongs: ['Speak Now'],
      tags: ['Music'],
      summary:
        'A solo performance of the title track on the Late Show with David Letterman, taped the day after the album\'s October 25, 2010 release.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=4wUPASp2hfY',
      media: [embed('4wUPASp2hfY', '2026-08-25')],
      sources: [
        yt('4wUPASp2hfY', 'Taylor Swift - Speak Now (Live on Letterman)'),
        wiki('Speak_Now_(song)', 'Speak Now (song)', 'confirms the October 26, 2010 Late Show with David Letterman performance'),
      ],
    },
    {
      slug: 'back-to-december-live-letterman',
      kind: 'performance',
      title: 'Back to December (Live on Letterman)',
      director: null,
      releasedOn: null,
      relatedSongs: ['Back to December'],
      tags: ['Music'],
      summary:
        'A solo TV performance of the Speak Now ballad on the Late Show with David Letterman, part of the same album-era promotional run that put "Speak Now" and "Mine" on the show.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=vio0RidOMUM',
      media: [embed('vio0RidOMUM', '2026-08-25')],
      sources: [
        yt('vio0RidOMUM', 'Taylor Swift - Back To December (Live on Letterman)'),
        wiki('Back_to_December', 'Back to December'),
      ],
    },
    {
      slug: 'mine-live-letterman',
      kind: 'performance',
      title: 'Mine (Live on Letterman)',
      director: null,
      releasedOn: null,
      relatedSongs: ['Mine'],
      tags: ['Music'],
      summary:
        'A solo TV performance of the Speak Now lead single on the Late Show with David Letterman, part of the same album-era promotional run that put "Speak Now" and "Back to December" on the show.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=xcLIGAIkztc',
      media: [embed('xcLIGAIkztc', '2026-08-25')],
      sources: [
        yt('xcLIGAIkztc', 'Taylor Swift - Mine (Live on Letterman)'),
        wiki('Mine_(Taylor_Swift_song)', 'Mine (Taylor Swift song)'),
      ],
    },
    {
      slug: 'you-belong-with-me-live-letterman',
      kind: 'performance',
      title: 'You Belong With Me (Live on Letterman)',
      director: null,
      releasedOn: '2010-12-07',
      relatedSongs: ['You Belong with Me'],
      tags: ['Music'],
      // Filed here by real-world upload date (2010-12-07, inside Speak Now's
      // window) rather than by the song's Fearless catalog era — see
      // docs/decisions.md 2026-08-25 "Era placement is decided by real-world date."
      summary:
        'A solo TV performance of the Fearless-era hit on the Late Show with David Letterman, uploaded during the Speak Now promotional cycle alongside the era\'s other Letterman performance videos.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=zudLJdajX5Y',
      media: [embed('zudLJdajX5Y', '2026-08-25')],
      sources: [
        yt('zudLJdajX5Y', 'Taylor Swift - You Belong With Me (Live on Letterman)'),
        wiki('You_Belong_with_Me', 'You Belong with Me'),
      ],
    },
    {
      slug: 'mine-live-bbc-radio-2',
      kind: 'performance',
      title: 'Mine (Live, BBC Radio 2 Session)',
      director: null,
      releasedOn: '2011-08-24',
      relatedSongs: ['Mine'],
      tags: ['Music'],
      summary:
        'An acoustic session performance of "Mine" recorded for BBC Radio 2, posted to her official channel the same day as her Coldplay "Viva La Vida" cover from the same session.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=_9RWI5JBew0',
      media: [embed('_9RWI5JBew0', '2026-08-25')],
      sources: [
        yt('_9RWI5JBew0', 'Taylor Swift - Mine (Live, BBC Radio 2 Session)'),
        wiki('Mine_(Taylor_Swift_song)', 'Mine (Taylor Swift song)'),
      ],
    },
    {
      slug: 'viva-la-vida-cover-bbc-radio-2',
      kind: 'performance',
      title: 'Viva La Vida',
      director: null,
      releasedOn: '2011-08-24',
      relatedSongs: [],
      tags: ['Music'],
      summary:
        'A three-guitar acoustic cover of Coldplay\'s "Viva La Vida," recorded in a BBC Radio 2 studio during the Speak Now era and posted the same day as her BBC session performance of "Mine."',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=AcGbuveDwTg',
      media: [embed('AcGbuveDwTg', '2026-08-25')],
      sources: [
        yt('AcGbuveDwTg', 'Taylor Swift - Viva La Vida'),
        press(
          'https://www.themusicman.uk/rare-taylor-swift-coldplay-cover/',
          "Taylor Swift's roots unearthed as young star's rare, old-school Coldplay cover is rediscovered online",
          'The Music Man',
          'confirms the BBC Radio 2 studio setting, 2011 upload, and acoustic three-guitar arrangement',
        ),
      ],
    },
    {
      slug: 'youtube-presents-taylor-swift-2011',
      kind: 'performance',
      title: 'YouTube Presents Taylor Swift',
      director: null,
      releasedOn: '2011-09-01',
      relatedSongs: [],
      tags: ['Music'],
      summary:
        'A feature-length (42-minute) YouTube-exclusive special from September 2011, one of the platform\'s flagship "YouTube Presents" artist specials and among the longest single uploads on her official channel.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-25 (author_name "Taylor Swift", upload
      // dated 2011-09-01, runtime 42:32). No secondary press coverage of
      // this specific special was found — summary sticks to facts
      // verifiable from the upload itself (title/date/runtime).
      officialUrl: 'https://www.youtube.com/watch?v=OOPFMrF7v4Q',
      media: [embed('OOPFMrF7v4Q', '2026-08-25')],
      sources: [yt('OOPFMrF7v4Q', 'YouTube Presents Taylor Swift')],
    },
    {
      slug: 'wonderstruck-in-store-appearances',
      kind: 'press_event',
      title: 'Wonderstruck In-Store Appearances',
      director: null,
      releasedOn: '2011-11-17',
      relatedSongs: [],
      tags: [],
      summary:
        "Highlights from Taylor's Wonderstruck fragrance launch appearances at Macy's in New York City, Sephora in Glendale, California, and Belk in Nashville, Tennessee.",
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-25 (author_name "Taylor Swift", upload
      // dated 2011-11-17); summary lines drawn from the upload's own
      // description.
      officialUrl: 'https://www.youtube.com/watch?v=xIoApJgIw8U',
      media: [embed('xIoApJgIw8U', '2026-08-25')],
      sources: [yt('xIoApJgIw8U', 'Taylor Swift WONDERSTRUCK In-Store Appearances')],
    },
    {
      // Real-world date (Feb 2012) places this in Speak Now's era window
      // (2010-10-25–2012-10-21) per docs/decisions.md's "Era placement is
      // decided by real-world date" entry — even though the companion
      // official music video ('safe-and-sound-mv') is filed under
      // supabase/seed/videos/red.mjs (that placement predates this rule
      // and was not changed here; flagged in the PR body for follow-up).
      slug: 'safe-and-sound-behind-the-scenes',
      kind: 'documentary',
      title: 'Safe & Sound (Behind The Scenes) ft. The Civil Wars',
      director: null,
      releasedOn: '2012-02-16',
      relatedSongs: ['Safe & Sound'],
      tags: ['Music'],
      summary:
        'Behind-the-scenes footage from the "Safe & Sound" video shoot — the Watertown, Tennessee forest and cemetery sequence with The Civil Wars performing by firelight, for The Hunger Games soundtrack.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-25 (author_name "Taylor Swift", upload
      // dated 2012-02-16, runtime 4:04).
      officialUrl: 'https://www.youtube.com/watch?v=xDJLsPd6NdY',
      media: [embed('xDJLsPd6NdY', '2026-08-25')],
      sources: [
        yt('xDJLsPd6NdY', 'Taylor Swift - Safe & Sound (Behind The Scenes) ft. The Civil Wars'),
        wiki('Safe_%26_Sound_(Taylor_Swift_song)', 'Safe & Sound (Taylor Swift song)'),
      ],
    },
    {
      // See era-placement note on the sibling 'safe-and-sound-behind-the-scenes'
      // entry above — same reasoning applies here.
      slug: 'safe-and-sound-the-collaboration',
      kind: 'documentary',
      title: 'Safe & Sound (The Hunger Games: Songs From District 12 And Beyond - The Collaboration)',
      director: null,
      releasedOn: '2012-02-29',
      relatedSongs: ['Safe & Sound'],
      tags: ['Music'],
      summary:
        'On the writing session at T Bone Burnett\'s house with The Civil Wars — Taylor brought the title "Safe & Sound" wanting the song\'s more sensitive, bittersweet side; the song was written and recorded in a single two-hour sitting.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-25 (author_name "Taylor Swift", upload
      // dated 2012-02-29, runtime 4:16).
      officialUrl: 'https://www.youtube.com/watch?v=dLfkQNnzh2o',
      media: [embed('dLfkQNnzh2o', '2026-08-25')],
      sources: [
        yt(
          'dLfkQNnzh2o',
          'Safe & Sound (The Hunger Games: Songs From District 12 And Beyond - The Collaboration)',
        ),
        press(
          'https://www.mtv.com/news/1679213/taylor-swift-safe-and-sound-civil-wars/',
          "Taylor Swift's 'Safe & Sound' Came Together 'Organically'",
          'MTV News',
          'sources the T Bone Burnett writing-session account and the two-hour session detail',
        ),
      ],
    },
    {
      slug: 'eyes-open-lyric-version',
      kind: 'lyric_video',
      title: 'Eyes Open (Lyric Version)',
      director: null,
      releasedOn: '2012-05-17',
      relatedSongs: ['Eyes Open'],
      tags: ['Music'],
      summary:
        'The lyric video for "Eyes Open," the song Taylor wrote solo for The Hunger Games: Songs From District 12 And Beyond soundtrack — about Katniss Everdeen\'s relationship with the Capitol.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-25 (author_name "Taylor Swift", upload
      // dated 2012-05-17). Despite the "Lyric Version" title, this is the
      // song's only official visual release, not a supplementary lyric
      // video for an already-visualized single.
      officialUrl: 'https://www.youtube.com/watch?v=8hsVICl7d8k',
      media: [embed('8hsVICl7d8k', '2026-08-25')],
      sources: [
        yt('8hsVICl7d8k', 'Taylor Swift - Eyes Open (Lyric Version)'),
        wiki('Eyes_Open_(song)', 'Eyes Open (song)'),
      ],
    },
    {
      slug: 'billboard-woman-of-the-year-2011',
      kind: 'award_speech',
      title: 'Taylor Swift — Billboard Woman of the Year',
      director: null,
      // Event date (Billboard's Women in Music ceremony); the upload
      // itself is dated 2012-06-04, well after the December 2011 event —
      // real-world event date used per the era-placement rule.
      releasedOn: '2011-12-02',
      relatedSongs: [],
      tags: ['Music'],
      summary:
        "Accepting Billboard's Woman of the Year honor at the 2011 Women in Music ceremony — at 21, the youngest artist to receive it — and speaking about staying involved in every management and publicity decision on her career.",
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-25 (author_name "Taylor Swift"; upload
      // dated 2012-06-04, documenting the Dec 2, 2011 ceremony).
      officialUrl: 'https://www.youtube.com/watch?v=weQBrpLffrA',
      media: [embed('weQBrpLffrA', '2026-08-25')],
      sources: [
        yt('weQBrpLffrA', 'Taylor Swift Billboard Woman of the Year'),
        press(
          'https://www.billboard.com/music/awards/taylor-swift-woman-year-honor-speech-6405600/',
          'Taylor Swift Accepts Woman of the Year Honor, Talks Future of Music Industry',
          'Billboard',
          'confirms the December 2, 2011 ceremony, her age, and the acceptance-speech content',
        ),
      ],
    },
    {
      // Consolidated record for the 13-part "Ours" behind-the-scenes
      // micro-series (Dec 2011) rather than 13 separate near-duplicate
      // entries — each individual clip runs well under a minute and covers
      // one narrow facet (casting, locations, wardrobe) of the same video
      // shoot; grouping keeps the rail from being dominated by thin
      // fragments while still documenting the full series via `sources`.
      slug: 'ours-behind-the-scenes-series',
      kind: 'documentary',
      title: '"Ours" — Behind the Scenes',
      director: null,
      releasedOn: '2011-12-07',
      relatedSongs: ['Ours'],
      tags: ['Music'],
      summary:
        'A 13-part making-of micro-series for the "Ours" video shoot — casting, locations, Taylor\'s look, home movies, and Zach Gilford\'s role — posted across December 2011.',
      symbolism: null,
      easterEggs: [],
      // oEmbed-verified 2026-08-25 (author_name "Taylor Swift" on every
      // clip). officialUrl/media point at "We're Making a Video," the
      // earliest-posted, most general-framing clip in the series.
      officialUrl: 'https://www.youtube.com/watch?v=beGv3NTnduo',
      media: [embed('beGv3NTnduo', '2026-08-25')],
      sources: [
        yt('beGv3NTnduo', '"Ours" Behind-the-Scenes - We\'re Making a Video'),
        yt('AtHsg4USz8g', '"Ours" Behind-the-Scenes - The Director'),
        yt('_zyYtE9di9A', '"Ours" Behind-the-Scenes - "The Story of the Video"'),
        yt('h6CRgcouLuU', '"Ours" Behind-the-Scenes - Zach'),
        yt('Y89k5sfHBaw', '"Ours" Behind-the-Scenes - Locations'),
        yt('gPJ8PFeq9Xw', '"Ours" Behind-the-Scenes - Taylor\'s Look'),
        yt('HsLl-IL9c7E', '"Ours" Behind-the-Scenes - Home Movies'),
        yt('0Ot5C6O-KfA', '"Ours" Behind-the-Scenes - Director Casting'),
        yt('7D6-_twz7YE', '"Ours" Behind-the-Scenes - The Inspiration'),
        yt('yHqjZUxaigo', '"Ours" Behind-the-Scenes - Message of Ours'),
        yt('wIvJI6mF1ME', '"Ours" Behind-the-Scenes - Working with Taylor'),
        yt('QvNW_z1Y7Ls', '"Ours" Behind-the-Scenes - That\'s a Wrap'),
        yt('IdMI-HCO5QY', '"Ours" Behind-the-Scenes - The Office'),
        wiki('Ours_(song)', 'Ours (song)'),
      ],
    },],
};
