// Vault videos — The Life of a Showgirl era.
// NOTE: the `the-life-of-a-showgirl` era row lands in rollout PR 2; this file
// seeds cleanly once it exists (the validator knows the slug as expected).
// Wikipedia URLs verified reachable 2026-07-08.

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
const yt = (id, title) => ({
  source_url: `https://www.youtube.com/watch?v=${id}`,
  source_title: title,
  publisher: 'Taylor Swift (official YouTube channel)',
  source_type: 'official',
  accessed_at: '2026-07-09',
  reliability_score: 5,
  excerpt: null,
  notes: 'official upload — verified via YouTube oEmbed 2026-07-09',
});
const embed = (id) => ({
  kind: 'oembed',
  rights: 'platform_tos',
  provider: 'youtube',
  post_url: `https://www.youtube.com/watch?v=${id}`,
  oembed_fetched_at: '2026-07-09',
  attribution: 'Taylor Swift — official YouTube channel',
});

import { appearance, pressSource, upload } from './_appearance-helpers.mjs';

export default {
  eraSlug: 'the-life-of-a-showgirl',
  videos: [
    {
      slug: 'the-fate-of-ophelia-mv',
      kind: 'music_video',
      title: 'The Fate of Ophelia',
      director: 'Taylor Swift',
      // 2026-08-13: filled in from the record's own Wikipedia citation, which
      // states the video "premiered as part of the film Taylor Swift: The
      // Official Release Party of a Showgirl, before being released onto
      // YouTube two days later" — the film opened 2025-10-03, so the video's
      // own release date is 2025-10-05. (The People citation agrees on the
      // order: it "debuts" the video AFTER the movie event.)
      //
      // Reader-visible effect is only the rail's sort position: the tloas
      // moment "the-fate-of-ophelia-video-premieres" already embeds this same
      // id, so EraSection's embeddedVideoIds de-dupe keeps this record out of
      // the chronological feed either way. The date is filled because it was
      // simply unknown, not to move the card.
      releasedOn: '2025-10-05',
      relatedSongs: ['The Fate of Ophelia'],
      tags: ['Music'],
      summary:
        'The lead single\'s video premiered as the centerpiece of the release-party theatrical event: showgirl staging that pulls Ophelia out of the water and onto the stage, inverting the Hamlet ending.',
      symbolism: 'Rescue-by-love replaces the drowning — the era\'s glitter is framed as the survivable version of the tragedy.',
      easterEggs: [],
      // Fix (issue #1140): was youtubeId/officialUrl null (dead card) despite
      // the correct, oEmbed-verified id already living on the track record
      // (tracks/the-life-of-a-showgirl.mjs). Re-verified via oEmbed this pass.
      officialUrl: 'https://www.youtube.com/watch?v=ko70cExuzZM',
      media: [embed('ko70cExuzZM')],
      sources: [
        wiki('The_Fate_of_Ophelia', 'The Fate of Ophelia'),
        press(
          'https://people.com/taylor-swift-the-fate-of-ophelia-music-video-11823344',
          'Taylor Swift Debuts The Fate of Ophelia Music Video After Premiering It at Life of a Showgirl Movie Event',
          'People',
          'supports the music-video premiere timing and Swift directorial credit',
        ),
        yt('ko70cExuzZM', 'Taylor Swift - The Fate of Ophelia (Official Music Video)'),
      ],
    },
    {
      slug: 'opalite-mv',
      kind: 'music_video',
      title: 'Opalite',
      director: null,
      releasedOn: '2026-01-12',
      relatedSongs: ['Opalite'],
      tags: ['Music'],
      summary:
        'A 1990s-styled rom-com in which Taylor\'s lonely Pet Rock owner and Domhnall Gleeson\'s cactus owner are brought together by a magical "Opalite" spray — released as the era\'s second single.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=1FVF-9KQiPo',
      media: [embed('1FVF-9KQiPo')],
      sources: [
        yt('1FVF-9KQiPo', 'Taylor Swift - Opalite (Official Music Video)'),
        wiki('Opalite_(song)', 'Opalite (song)'),
      ],
    },
    {
      slug: 'elizabeth-taylor-mv',
      kind: 'music_video',
      title: 'Elizabeth Taylor',
      director: null,
      releasedOn: '2026-03-09',
      relatedSongs: ['Elizabeth Taylor'],
      tags: ['Music'],
      summary:
        'The album\'s third single, named for the screen icon, arrives with its own official video as part of an extended single cycle five months after the album\'s release.',
      symbolism: null,
      easterEggs: [],
      officialUrl: 'https://www.youtube.com/watch?v=WqbJT_vC0rs',
      media: [embed('WqbJT_vC0rs')],
      sources: [
        yt('WqbJT_vC0rs', 'Taylor Swift - Elizabeth Taylor (Official Music Video)'),
        wiki('The_Life_of_a_Showgirl', 'The Life of a Showgirl', 'album article documents the single cycle and release dates'),
      ],
    },
    {
      slug: 'the-official-release-party-of-a-showgirl',
      kind: 'performance',
      title: 'The Official Release Party of a Showgirl',
      director: null,
      releasedOn: '2025-10-03',
      relatedSongs: [],
      tags: ['Music'],
      summary:
        'Release weekend as a cinema event: the Ophelia video premiere, lyric videos, and behind-the-scenes cuts packaged into a theatrical party that topped the box office on album weekend.',
      symbolism: null,
      easterEggs: [],
      // No official upload of the work itself exists — it is a theatrical event release.
      // With no embed this record is HIDDEN from every reader-facing surface
      // rather than shown as a card that cannot play (playable-first rule,
      // docs/decisions.md 2026-08-13). Add a verified official upload here and
      // it comes back automatically — no code change needed.
      officialUrl: null,
      media: [],
      sources: [
        wiki('The_Official_Release_Party_of_a_Showgirl', 'The Official Release Party of a Showgirl'),
        press(
          'https://people.com/taylor-swift-the-fate-of-ophelia-music-video-11823344',
          'Taylor Swift Debuts The Fate of Ophelia Music Video After Premiering It at Life of a Showgirl Movie Event',
          'People',
          'supports the October 2025 movie-event framing tied to the video premiere',
        ),
      ],
    },
    // ── Appearances (YouTube-appearances pass, 2026-08-12) ──────────────────
    // Era placement follows the era files, not the calendar: the New Heights
    // and Graham Norton moments both live in this era's content even though
    // their dates fall inside the Tortured Poets window. Splitting the video
    // record away from its moment would put the two halves of one appearance
    // in different eras; re-homing the moments is a content call (flagged on
    // PR #2035), not one to make here.
    appearance({
      slug: 'new-heights-podcast-2025',
      kind: 'interview',
      title: 'New Heights — announcing The Life of a Showgirl',
      releasedOn: '2025-08-13',
      summary:
        'Her first-ever podcast appearance, on Jason and Travis Kelce’s show: a mint-green briefcase opens on album No. 12, out October 3, plus buying back her masters. The livestream buckled at roughly 1.3 million concurrent viewers.',
      youtubeId: 'M2lX9XESvDE',
      channel: 'New Heights',
      tags: ['Music'],
      sources: [
        upload({
          youtubeId: 'M2lX9XESvDE',
          title:
            'Taylor Swift on Reclaiming Her Masters, Wrapping The Eras Tour, and The Life of a Showgirl | NHTV',
          channel: 'New Heights',
        }),
      ],
    }),
    appearance({
      slug: 'graham-norton-2025',
      kind: 'interview',
      title: 'The Graham Norton Show',
      releasedOn: '2025-10-02',
      summary:
        'On the Graham Norton couch as The Life of a Showgirl lands: album promo that detours into wedding plans, and an invitation for the host.',
      youtubeId: 'NlOdFJmkEls',
      channel: 'BBC',
      tags: ['Music', 'Relationship'],
      sources: [
        upload({
          youtubeId: 'NlOdFJmkEls',
          title: 'Taylor Swift Invites Graham Norton To Her Wedding - BBC',
          channel: 'BBC',
          note: "official upload on the BBC's own channel — oEmbed-verified 2026-08-12",
        }),
      ],
    }),
    appearance({
      slug: 'tonight-show-fallon-2025',
      kind: 'interview',
      title: 'The Tonight Show Starring Jimmy Fallon',
      releasedOn: '2025-10-06',
      summary:
        'Roughly twenty minutes with Fallon on the new album, the engagement and regaining her masters — including why she is not playing the 2026 Super Bowl halftime show. An extended cut aired as its own special four days later.',
      youtubeId: 'GzjZqH0WRwE',
      channel: 'The Tonight Show Starring Jimmy Fallon',
      tags: ['Music', 'Relationship'],
      sources: [
        upload({
          youtubeId: 'GzjZqH0WRwE',
          title:
            'Taylor Swift Stops by The Tonight Show | The Tonight Show Starring Jimmy Fallon',
          channel: 'The Tonight Show Starring Jimmy Fallon',
        }),
        pressSource(
          'https://www.hollywoodreporter.com/music/music-news/taylor-swift-jimmy-fallon-tonight-show-life-of-a-showgirl-1236394527/',
          'Taylor Swift on The Tonight Show',
          'The Hollywood Reporter',
          'covers the interview and what she said about the album and the Super Bowl',
        ),
        pressSource(
          'https://www.nbc.com/nbc-insider/how-to-watch-taylor-swift-extended-tonight-show-interview',
          'How to Watch the Extended Taylor Swift Tonight Show Interview',
          'NBC Insider',
          'documents the extended cut airing as a separate special',
        ),
      ],
    }),
    appearance({
      slug: 'zane-lowe-apple-music-2025',
      kind: 'interview',
      title: 'The Zane Lowe Interview — Apple Music',
      releasedOn: '2025-10-07',
      summary:
        'An extended sit-down with Zane Lowe, conducted over FaceTime, on how The Life of a Showgirl was written.',
      youtubeId: 'mUZ9T-hstUI',
      channel: 'Apple Music',
      tags: ['Music'],
      sources: [
        upload({
          youtubeId: 'mUZ9T-hstUI',
          title:
            'Taylor Swift: The Life of a Showgirl and Writing Process | The Zane Lowe Interview',
          channel: 'Apple Music',
        }),
      ],
    }),
    appearance({
      slug: 'late-night-seth-meyers-2025',
      kind: 'interview',
      title: 'Late Night with Seth Meyers — the sole-guest episode',
      releasedOn: '2025-10-08',
      summary:
        'A rare sole-guest episode of Late Night: the album, Travis Kelce, and a full hour built around one interview.',
      youtubeId: 'Wd7S1wZqkbI',
      channel: 'Late Night with Seth Meyers',
      tags: ['Music', 'Relationship'],
      sources: [
        upload({
          youtubeId: 'Wd7S1wZqkbI',
          title: 'Taylor Swift and Seth Talk The Life of a Showgirl, Travis Kelce and More',
          channel: 'Late Night with Seth Meyers',
        }),
        pressSource(
          'https://variety.com/2025/music/news/taylor-swift-extended-interview-late-night-with-seth-meyers-1236534347/',
          'Taylor Swift Extended Interview on Late Night With Seth Meyers',
          'Variety',
          'documents the sole-guest format',
        ),
      ],
    }),
    appearance({
      slug: 'late-show-colbert-2025',
      kind: 'interview',
      title: 'The Late Show with Stephen Colbert',
      releasedOn: '2025-12-10',
      summary:
        "Her first time on Colbert's couch: The End of an Era docuseries and The Final Show film, the engagement, the masters — and a ranking of her own top five songs.",
      youtubeId: 'qtyzac0JbS4',
      channel: 'The Late Show with Stephen Colbert',
      tags: ['Music', 'Relationship'],
      sources: [
        upload({
          youtubeId: 'qtyzac0JbS4',
          title:
            "Taylor Swift's Good Year: Engaged To The Love Of Her Life, In Control Of Her Music Masters",
          channel: 'The Late Show with Stephen Colbert',
          note: "official upload on the show's own channel; the full interview is split across several official clips — this is the main segment. oEmbed-verified 2026-08-12",
        }),
        pressSource(
          'https://www.rollingstone.com/music/music-news/taylor-swift-engagement-masters-showgirl-late-show-1235482380/',
          'Taylor Swift on The Late Show',
          'Rolling Stone',
          'covers the engagement and masters portions of the interview',
        ),
        pressSource(
          'https://www.billboard.com/music/pop/taylor-swift-five-favorite-taytay-songs-colbert-1236134507/',
          "Taylor Swift's Five Favorite Taylor Swift Songs",
          'Billboard',
          'documents the top-five list from the same appearance',
        ),
      ],
    }),
  ],
};
