// STAGED CANDIDATES — YouTube appearances research pass (2026-08-12).
// Files in candidates/ are staged, NOT seeded (same convention as 00-orbit.mjs).
//
// Source: docs/research/2026-08-12-youtube-appearances-manifest.md (preserved
// verbatim; its embedded JSON is syntactically invalid — citation links were
// injected into string values — so this file is the hand-normalized dataset).
//
// Verification method (2026-08-12): every watch URL was checked against
// YouTube's oEmbed endpoint (https://www.youtube.com/oembed?url=...&format=json).
// HTTP 200 with a returned title/author_name = alive; `verification.oembedChannel`
// records the REAL uploading channel oEmbed returned — several manifest
// channel labels marked "official, needs re-verification" turned out to be fan
// archives. 403/404 = not embeddable / dead. Placeholder URLs (channel pages,
// search pages, a Dailymotion mirror, one youtu.be short link) were resolved
// via web search to exact watch URLs where possible, then oEmbed-verified.
//
// verification.status values:
//   verified   — live watch URL, oEmbed 200, channel confirmed
//   dead       — the manifest's URL 404s (a verified replacement may be noted)
//   placeholder— manifest URL was not a watch URL; resolvedUrl is the verified fix
//   unresolved — no verifiable YouTube watch URL could be found; NOT integrated
//
// verification.integration records what the 2026-08-12 PR did with the entry:
//   'enriched:<era>'   — added the verified link to an existing month item
//   'new:<era>'        — became a new month item (and/or videos/ entry)
//   'candidates-only'  — verified or not, deliberately kept out of era content
//                        (reason in verification.notes). Never fabricated.
export default {
  kind: 'youtube-appearances-research',
  researchedOn: '2026-08-12',
  entries: [
    {
      title: "Performs 'Tim McGraw' at the 42nd ACM Awards",
      date: '2007-05-15',
      youtubeUrl: 'https://www.youtube.com/watch?v=k3eWsix68bs',
      channel: 'Taylor Swift Evolution (fan archive)',
      type: 'award_performance',
      venue: '42nd Academy of Country Music Awards',
      eraSlug: 'debut',
      summary: "Early televised performance of debut single 'Tim McGraw' — sung at Tim McGraw in the front row.",
      notes: "Manifest guessed 'Taylor Swift (official)'; oEmbed shows a fan archive channel.",
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'Taylor Swift Evolution',
        integration: 'enriched:debut ("Hi, I\'m Taylor" — sung at Tim McGraw, then said to him)',
      },
    },
    {
      title: "Wins CMA Horizon Award and performs 'Our Song'",
      date: '2007-11-07',
      youtubeUrl: 'https://www.youtube.com/watch?v=6Ak1OMIGC1c',
      channel: 'lionheart33026 (fan archive)',
      type: 'award_speech',
      venue: '41st CMA Awards',
      eraSlug: 'debut',
      summary: "Performs 'Our Song', then accepts the Horizon (New Artist) Award — her first major industry award.",
      notes: 'Fan re-upload, alive since the late 2000s.',
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'lionheart33026',
        integration: 'enriched:debut (Wins her first CMA Award — the Horizon Award)',
      },
    },
    {
      title: 'First interview on The Ellen DeGeneres Show',
      date: '2008-01-17',
      youtubeUrl: 'https://www.youtube.com/watch?v=vBgiDYBCuxY',
      channel: 'TheEllenShow (official)',
      type: 'talk_show',
      venue: 'The Ellen DeGeneres Show',
      eraSlug: 'debut',
      summary: "18-year-old Swift's debut talk-show sit-down after 'Teardrops on My Guitar' broke through.",
      notes: 'Billboard confirms the Jan 17, 2008 debut date.',
      pressSources: [{ outlet: 'Billboard', url: 'https://www.billboard.com/music/music-news/taylor-swift-ellen-appearances-8511659/' }],
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'TheEllenShow',
        integration: 'enriched:debut (Her first Ellen appearance, talking Sony/ATV at 14)',
      },
    },
    {
      title: "Performs 'Love Story' as SNL musical guest",
      date: '2009-01-10',
      youtubeUrl: 'https://www.youtube.com/watch?v=aB291QhwHco',
      channel: 'Swift Leaks Backup (fan re-upload)',
      type: 'tv_performance',
      venue: 'Saturday Night Live (S34, host Neil Patrick Harris)',
      eraSlug: 'fearless',
      summary: "First SNL appearance as musical guest, performing 'Love Story' (and 'Forever & Always').",
      notes: 'No official NBC clip surfaced.',
      pressSources: [{ outlet: 'E! News', url: 'https://www.eonline.com/news/893243/taylor-swift-rocks-saturday-night-live-for-the-first-time-since-2009' }],
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'Swift Leaks Backup',
        integration: 'candidates-only',
        notes: 'URL is alive but the channel is a re-upload/"leaks backup" of NBC-policed SNL footage — judged very likely to be taken down; kept out of live content.',
      },
    },
    {
      title: 'Kanye West interrupts her speech at the 2009 MTV VMAs',
      date: '2009-09-13',
      youtubeUrl: 'https://www.youtube.com/watch?v=PwTx1VuMlqo',
      channel: 'OCCULT (fan re-upload, HD)',
      type: 'award_speech',
      venue: '2009 MTV Video Music Awards, Radio City Music Hall',
      eraSlug: 'fearless',
      summary: "Accepts Best Female Video for 'You Belong With Me'; Kanye West storms the stage. Beyoncé later invited her back onstage to finish the speech.",
      notes: 'The moment itself is already covered as a defining fearless item with 4 sources.',
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'OCCULT',
        integration: 'candidates-only',
        notes: 'Fan re-upload of MTV-policed VMA footage on an anonymous channel — judged high takedown risk, and the existing item is already well-sourced; link withheld from live content.',
      },
    },
    {
      title: "Accepts Album of the Year for 'Fearless' at the 52nd GRAMMYs",
      date: '2010-01-31',
      youtubeUrl: 'https://www.youtube.com/watch?v=BFk2NjdJ1yY',
      channel: 'GRAMMYs (official)',
      type: 'award_speech',
      venue: '52nd Annual GRAMMY Awards',
      eraSlug: 'fearless',
      summary: 'Youngest Album of the Year winner at the time; thanks her parents and producer Nathan Chapman.',
      notes: 'Official GRAMMYs channel; durable.',
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'GRAMMYS',
        integration: 'enriched:fearless (Fearless makes her the youngest Album of the Year winner — for a decade)',
      },
    },
    {
      title: 'Interview on The Ellen DeGeneres Show (Speak Now week)',
      date: '2010-11-01',
      youtubeUrl: 'https://www.youtube.com/watch?v=f4kEl3f-ySc',
      channel: 'tswiftfan13 (fan archive)',
      type: 'talk_show',
      venue: 'The Ellen DeGeneres Show',
      eraSlug: 'speak-now',
      summary: "Speak Now release-week interview; includes one of Ellen's signature scare pranks.",
      pressSources: [{ outlet: 'Billboard', url: 'https://www.billboard.com/music/music-news/taylor-swift-ellen-appearances-8511659/' }],
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'tswiftfan13',
        // Review pass: an OFFICIAL upload covering this appearance does exist
        // after all — TheEllenShow's in-order retrospective compilation
        // (https://www.youtube.com/watch?v=rPLRA256Rco, oEmbed-verified
        // 2026-08-12). Added as a source alongside the fan archive, and the
        // moment's "no official clip exists" wording was corrected.
        integration: 'new:speak-now',
        notes: 'Fan archive upload alive since 2010 — judged durable enough to link.',
      },
    },
    {
      title: "Performs 'Back to December' at the 2010 American Music Awards",
      date: '2010-11-21',
      youtubeUrl: 'https://www.youtube.com/watch?v=792hPowNKDw',
      channel: 'Fan/archive upload (manifest)',
      type: 'award_performance',
      venue: '2010 American Music Awards',
      eraSlug: 'speak-now',
      summary: "Performs 'Back to December' interpolating OneRepublic's 'Apologize'.",
      pressSources: [{ outlet: 'Billboard', url: 'https://www.billboard.com/music/awards/taylor-swift-american-music-awards-moments-amas-8544183/' }],
      verification: {
        status: 'dead', checkedOn: '2026-08-12', method: 'oembed (404)',
        resolvedUrl: 'https://www.youtube.com/watch?v=L8-HPbEemcY',
        oembedChannel: 'LadyStefani (replacement, verified 200)',
        integration: 'new:speak-now (using the verified replacement upload)',
        notes: 'Manifest URL 404s. Replacement "[HD] Taylor Swift - Back To December (AMA 2010)" found via search and oEmbed-verified; long-lived fan archive.',
      },
    },
    {
      title: "Performs 'Red' on Good Morning America",
      date: '2012-10-23',
      youtubeUrl: 'https://www.youtube.com/watch?v=019k5vbbqB0',
      channel: 'Paul Henry (fan archive)',
      type: 'tv_performance',
      venue: 'Good Morning America, Times Square',
      eraSlug: 'red',
      summary: 'Release-week Times Square set for the GMA fall concert series.',
      pressSources: [{ outlet: 'Rolling Stone', url: 'https://www.rollingstone.com/music/music-live-reviews/taylor-swift-whips-new-york-into-a-frenzy-on-good-morning-america-48822/' }],
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'Paul Henry',
        integration: 'new:red',
        notes: 'Red era is the sparsest on official YouTube; fan archive upload alive since 2012.',
      },
    },
    {
      title: 'Presents Kanye West the Video Vanguard Award at the 2015 VMAs',
      date: '2015-08-30',
      youtubeUrl: 'https://www.youtube.com/watch?v=XLiXeztX0Fw',
      channel: 'Fan compilation channel',
      type: 'award_speech',
      venue: '2015 MTV Video Music Awards',
      eraSlug: '1989',
      summary: "Introduces Kanye West for the Vanguard Award, echoing 'Imma let you finish' — a public reconciliation moment.",
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: '\u{1d460}\u{1d461}\u{1d44e}\u{1d45f}\u{1d45f}\u{1d466} (fan channel)',
        integration: 'candidates-only',
        notes: 'The URL resolves to a 2009-vs-2015 fan MASHUP compilation with an editorialized title, not clean footage of the moment — unusable as a source link. No official MTV upload of the presentation was found.',
      },
    },
    {
      title: 'Zane Lowe Beats 1 interview (1989 / tour documentary)',
      date: '2015-12-15',
      youtubeUrl: null,
      channel: null,
      type: 'radio',
      venue: 'Apple Music / Beats 1',
      eraSlug: '1989',
      summary: "Wide-ranging talk on the 'Dear Apple' letter, the 1989 World Tour, and the tour documentary.",
      notes: 'Manifest could only find a Dailymotion mirror (https://www.dailymotion.com/video/x8ry6ps).',
      verification: {
        status: 'unresolved', checkedOn: '2026-08-12', method: 'web search',
        integration: 'candidates-only',
        notes: 'No official or durable YouTube upload exists — only Dailymotion/SoundCloud mirrors. Never invent a URL; stays candidates-only until an official upload surfaces.',
      },
    },
    {
      title: "Accepts Album of the Year for '1989' at the 58th GRAMMYs",
      date: '2016-02-15',
      youtubeUrl: 'https://www.youtube.com/watch?v=dMCAEUb0h34',
      channel: 'GRAMMYs (official)',
      type: 'award_speech',
      venue: '58th Annual GRAMMY Awards',
      eraSlug: '1989',
      summary: "First woman to win Album of the Year twice; the 'people who will try to undercut your success' speech.",
      pressSources: [{ outlet: 'Time', url: 'https://time.com/4225261/2016-grammys-taylor-swift-kanye-west/' }],
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'GRAMMYS',
        integration: 'enriched:1989 (1989 wins Album of the Year — making her the first woman to win it twice)',
      },
    },
    {
      title: "Wins Video of the Year for 'You Need to Calm Down' at the 2019 VMAs",
      date: '2019-08-26',
      youtubeUrl: 'https://www.youtube.com/watch?v=8z4icNgFSPI',
      channel: 'MTV (official)',
      type: 'award_speech',
      venue: '2019 MTV Video Music Awards',
      eraSlug: 'lover',
      summary: 'Uses the acceptance speech to call for support of the Equality Act.',
      pressSources: [{ outlet: 'CBS News', url: 'https://www.cbsnews.com/detroit/news/taylor-swift-calls-out-white-house-during-vmas-acceptance-speech' }],
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'MTV',
        // Review pass: this started as a new month item, but lover.mjs already
        // had a moment whose context narrates this speech and the
        // White-House-response threshold ("You Need to Calm Down turns a music
        // video into an Equality Act petition"), and the VMA red carpet is
        // already a fashion item. Enriched that record instead of adding a
        // third moment about the same night.
        integration: 'enriched:lover ("You Need to Calm Down turns a music video into an Equality Act petition")',
      },
    },
    {
      title: 'Accepts Artist of the Decade at the 2019 American Music Awards',
      date: '2019-11-24',
      youtubeUrl: 'https://www.youtube.com/watch?v=0pbSQ_0qbqU',
      channel: 'American Music Awards (official)',
      type: 'award_speech',
      venue: '2019 American Music Awards',
      eraSlug: 'lover',
      summary: 'Carole King presents Artist of the Decade; Swift also won Artist of the Year the same night.',
      pressSources: [{ outlet: 'Billboard', url: 'https://www.billboard.com/music/awards/taylor-swift-artist-decade-speech-2019-amas-8544659/' }],
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'American Music Awards',
        integration: 'enriched:lover (Artist of the Decade, and a record 29 AMA wins)',
      },
    },
    {
      title: 'Accepts Woman of the Decade at Billboard Women in Music 2019',
      date: '2019-12-12',
      youtubeUrl: 'https://www.youtube.com/watch?v=hyf9vJB8V3s',
      channel: 'TaylorShreya13 (fan archive)',
      type: 'speech',
      venue: 'Billboard Women in Music',
      eraSlug: 'lover',
      summary: '~15-minute speech on sexism in the music industry and the Scooter Braun/masters dispute.',
      pressSources: [{ outlet: 'Gulf News', url: 'https://gulfnews.com/entertainment/music/taylor-swift-calls-out-scooter-braun-during-billboard-speech-1.68473457' }],
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'TaylorShreya13',
        integration: 'enriched:lover (She\'s Billboard\'s first-ever Woman of the Decade)',
        notes: 'No official Billboard upload confirmed; long-lived fan archive judged durable enough to link.',
      },
    },
    {
      title: 'Miss Americana — Sundance 2020 world-premiere Q&A',
      date: '2020-01-23',
      youtubeUrl: 'https://www.youtube.com/watch?v=JqIt0H6XqpA',
      channel: 'Scott D. Menzel (press)',
      type: 'press',
      venue: '2020 Sundance Film Festival (opening night)',
      eraSlug: 'lover',
      summary: 'Post-premiere Q&A with Swift and director Lana Wilson for the Netflix documentary.',
      pressSources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Miss_Americana' }],
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'Scott D. Menzel',
        integration: 'enriched:lover (Miss Americana opens Sundance, then hits Netflix)',
        notes: "A film journalist's own festival footage — low takedown risk.",
      },
    },
    {
      title: 'folklore: the long pond studio sessions — official trailer (Disney+)',
      date: '2020-11-25',
      youtubeUrl: 'https://www.youtube.com/watch?v=jgdFUoZzCI0',
      channel: 'Taylor Swift (official)',
      type: 'other',
      venue: 'Disney+ concert film',
      eraSlug: 'folklore',
      summary: "Trailer for her directorial debut; the film performs all 17 folklore tracks with Aaron Dessner and Jack Antonoff.",
      notes: "Related official clip: 'exile' ft. Bon Iver — https://www.youtube.com/watch?v=o5SQIECedTY (also oEmbed-verified, Taylor Swift official).",
      pressSources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Folklore:_The_Long_Pond_Studio_Sessions' }],
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'Taylor Swift',
        integration: 'enriched:folklore (folklore: The Long Pond Studio Sessions marks her directorial debut). The film itself already has a videos/folklore.mjs documentary entry.',
      },
    },
    {
      title: 'Full interview on Jimmy Kimmel Live!',
      date: '2020-12-14',
      youtubeUrl: 'https://youtu.be/qOX0FK1DW5U',
      channel: 'Jimmy Kimmel Live! (official)',
      type: 'talk_show',
      venue: 'Jimmy Kimmel Live!',
      eraSlug: 'evermore',
      summary: 'Discusses keeping evermore secret and the folklore/evermore surprise-album era.',
      verification: {
        status: 'placeholder', checkedOn: '2026-08-12', method: 'oembed (403 on the short link) + web search',
        resolvedUrl: 'https://www.youtube.com/watch?v=ionfV_r8s40',
        oembedChannel: 'Jimmy Kimmel Live (replacement, verified 200)',
        integration: 'new:evermore (using the verified official interview clip)',
        notes: 'The manifest\'s short link resolves to a video that is not embeddable (oEmbed 403). Replaced with the official channel\'s interview clip "Taylor Swift on Turning 31, New Album, Fan Theories, Documentary & Boyfriend\'s Pseudonym".',
      },
    },
    {
      title: "Performs 'All Too Well (10 Minute Version)' on SNL",
      date: '2021-11-13',
      youtubeUrl: null,
      channel: 'manifest had only a search-page placeholder',
      type: 'tv_performance',
      venue: 'Saturday Night Live',
      eraSlug: 'evermore',
      summary: "Rare single-song musical-guest slot; the 10-minute 'All Too Well' with the short film playing behind her.",
      pressSources: [{ outlet: 'Billboard', url: 'https://www.billboard.com/music/pop/taylor-swift-snl-all-too-well-10-minute-version-performance-video-9659774/' }],
      verification: {
        status: 'placeholder', checkedOn: '2026-08-12', method: 'web search + oembed',
        resolvedUrl: 'https://www.youtube.com/watch?v=nJr_8l0AEWE',
        oembedChannel: 'Taylor Swift (official — verified 200)',
        // Review pass: the standalone month item was dropped — Nov. 13, 2021
        // SNL is already covered three times in evermore.mjs (the 10-minute
        // No. 1 record item narrates the performance in depth, plus the Alaïa
        // jumpsuit fashion item and the sketch-cameo item). Sourced onto the
        // record item instead. The videos/ performance entry stands.
        integration: 'enriched:evermore (the 10-minute No. 1 record item) + new videos/evermore.mjs performance entry',
        notes: 'Resolved to the official Taylor Swift channel upload "All Too Well (10 Minute Version) (Live on Saturday Night Live)" — durable.',
      },
    },
    {
      title: 'NYU 2022 Commencement Speech',
      date: '2022-05-18',
      youtubeUrl: 'https://www.youtube.com/watch?v=OBG50aoUwlI',
      channel: 'New York University (official)',
      type: 'speech',
      venue: "NYU 188th Commencement, Yankee Stadium",
      eraSlug: 'evermore',
      summary: "Receives an honorary Doctor of Fine Arts; ~20-minute address ('cringe is unavoidable').",
      notes: 'Alt (NBC New York, also oEmbed-verified): https://www.youtube.com/watch?v=0bkDDJNOlJQ',
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'New York University',
        integration: 'enriched:evermore (An honorary NYU doctorate, and a graduation-cap \'first\')',
      },
    },
    {
      title: "Announces 'Midnights' during her 2022 VMAs acceptance speech",
      date: '2022-08-28',
      youtubeUrl: 'https://www.youtube.com/watch?v=0H4Bhf-KPZ0',
      channel: 'Entertainment Tonight (press)',
      type: 'award_speech',
      venue: '2022 MTV Video Music Awards, Prudential Center',
      eraSlug: 'evermore',
      summary: "Wins Video of the Year for 'All Too Well: The Short Film' and reveals Midnights arrives Oct 21.",
      notes: 'Alt (MTV UK, also oEmbed-verified): https://www.youtube.com/watch?v=_J1dJLDrPBo',
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'Entertainment Tonight',
        integration: 'enriched:evermore (Video of the Year for All Too Well — then she announces Midnights from the podium)',
      },
    },
    {
      title: 'Red carpet at the Eras Tour concert-film premiere',
      date: '2023-10-11',
      youtubeUrl: 'https://www.youtube.com/watch?v=X_wHLxTOzas',
      channel: 'Good Morning America (official)',
      type: 'red_carpet',
      venue: 'AMC The Grove 14, Los Angeles',
      eraSlug: 'midnights',
      summary: 'Red-carpet arrival and fan meet-and-greet; the premiere was moved up a day due to demand.',
      pressSources: [{ outlet: 'CBS News', url: 'https://www.cbsnews.com/amp/losangeles/news/the-grove-shutdown-for-taylor-swift-the-eras-tour-movie-premiere' }],
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'Good Morning America',
        integration: 'enriched:midnights (A blue floral gown, and a surprise Beyoncé reunion)',
      },
    },
    {
      title: "Named Time's 2023 Person of the Year (TODAY reveal)",
      date: '2023-12-06',
      youtubeUrl: 'https://www.youtube.com/watch?v=VeFzmqp6OaQ',
      channel: 'TODAY (official)',
      type: 'other',
      venue: 'Time Person of the Year / TODAY Show',
      eraSlug: 'midnights',
      summary: "Time's EIC reveals Swift as the first arts/entertainment figure named Person of the Year.",
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'TODAY',
        integration: "enriched:midnights (She's Time's 2023 Person of the Year)",
        // NEVER a Videos-rail record (Joey, 2026-08-12: "it should only be
        // Taylor") — the footage is Time's EIC announcing the honor, not
        // Taylor on screen. Timeline source only; a videos.test.ts regression
        // bans this video id from the rail.
        videosSurface: 'banned:not-taylor-on-screen',
      },
    },
    {
      title: "Wins Album of the Year for 'Midnights' at the 2024 GRAMMYs",
      date: '2024-02-04',
      youtubeUrl: 'https://www.youtube.com/watch?v=Yq-q-ZCZwxc',
      channel: 'GRAMMYs (official)',
      type: 'award_speech',
      venue: '66th Annual GRAMMY Awards',
      eraSlug: 'midnights',
      summary: 'First artist in Grammy history to win Album of the Year four times; announced TTPD earlier the same night.',
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'GRAMMYS',
        integration: 'enriched:midnights (A record fourth Album of the Year Grammy, for Midnights)',
      },
    },
    {
      title: 'Remembers 9/11 during her 2024 VMAs acceptance speech',
      date: '2024-09-11',
      youtubeUrl: 'https://www.youtube.com/watch?v=g55D_gAoC3I',
      channel: 'Access Hollywood (press)',
      type: 'award_speech',
      venue: '2024 MTV Video Music Awards',
      eraSlug: 'tortured-poets',
      summary: "Accepts Best Collaboration for 'Fortnight' with Post Malone; notes the 9/11 anniversary.",
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'Access Hollywood',
        integration: 'enriched:tortured-poets (Seven more VMAs, and a tie with Beyoncé at 30)',
      },
    },
    {
      title: "New Heights podcast — announces 'The Life of a Showgirl'",
      date: '2025-08-13',
      youtubeUrl: null,
      channel: 'New Heights (official; manifest had only the channel homepage)',
      type: 'podcast',
      venue: 'New Heights with Jason & Travis Kelce',
      eraSlug: 'the-life-of-a-showgirl', // by-date this is late tortured-poets, but the existing month item lives in the tloas file
      summary: 'Announces album No. 12 (out Oct 3), reveals cover art and tracklist, and discusses buying back her masters and the relationship. 13M YouTube views in 24h; the livestream crashed at ~1.3M concurrent viewers.',
      verification: {
        status: 'placeholder', checkedOn: '2026-08-12', method: 'web search + oembed',
        resolvedUrl: 'https://www.youtube.com/watch?v=M2lX9XESvDE',
        oembedChannel: 'New Heights (official — verified 200)',
        integration: 'enriched:the-life-of-a-showgirl (A mint-green briefcase on New Heights: album No. 12, announced on her first-ever podcast)',
        notes: 'Resolved to the full official episode "Taylor Swift on Reclaiming Her Masters, Wrapping The Eras Tour, and The Life of a Showgirl | NHTV".',
      },
    },
    {
      title: 'The Graham Norton Show (The Life of a Showgirl)',
      date: '2025-10-02',
      youtubeUrl: 'https://www.youtube.com/watch?v=NlOdFJmkEls',
      channel: 'BBC (official)',
      type: 'talk_show',
      venue: 'The Graham Norton Show',
      eraSlug: 'tortured-poets', // by date (era hands off 2025-10-03); the existing month item lives in the tloas file
      summary: 'Album promo; jokes about inviting Norton to her wedding. Taped Oct 2, aired in the UK Oct 3.',
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'BBC',
        integration: 'enriched:the-life-of-a-showgirl (Wedding plans, teased from a British chat-show couch)',
      },
    },
    {
      title: 'The Tonight Show Starring Jimmy Fallon',
      date: '2025-10-06',
      youtubeUrl: 'https://www.youtube.com/watch?v=GzjZqH0WRwE',
      channel: 'The Tonight Show (official)',
      type: 'talk_show',
      venue: 'The Tonight Show Starring Jimmy Fallon',
      eraSlug: 'the-life-of-a-showgirl',
      summary: '~20-minute interview on the album, the engagement, regaining her masters, and why she is not playing the 2026 Super Bowl halftime; an extended cut aired as a special Oct 10.',
      pressSources: [
        { outlet: 'The Hollywood Reporter', url: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-jimmy-fallon-tonight-show-life-of-a-showgirl-1236394527/' },
        { outlet: 'NBC Insider', url: 'https://www.nbc.com/nbc-insider/how-to-watch-taylor-swift-extended-tonight-show-interview' },
      ],
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'The Tonight Show Starring Jimmy Fallon',
        integration: 'new:the-life-of-a-showgirl',
      },
    },
    {
      title: 'The Life of a Showgirl — The Zane Lowe Interview (Apple Music)',
      date: '2025-10-07',
      youtubeUrl: 'https://www.youtube.com/watch?v=mUZ9T-hstUI',
      channel: 'Apple Music (official)',
      type: 'radio',
      venue: 'Apple Music / Zane Lowe',
      eraSlug: 'the-life-of-a-showgirl',
      summary: 'Extended sit-down (via FaceTime) on the writing process behind The Life of a Showgirl.',
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'Apple Music',
        integration: 'new:the-life-of-a-showgirl',
      },
    },
    {
      title: 'Late Night with Seth Meyers ("TAY/kover" sole-guest episode)',
      date: '2025-10-08',
      youtubeUrl: 'https://www.youtube.com/watch?v=Wd7S1wZqkbI',
      channel: 'Late Night with Seth Meyers (official)',
      type: 'talk_show',
      venue: 'Late Night with Seth Meyers',
      eraSlug: 'the-life-of-a-showgirl',
      summary: 'Sole-guest episode covering the album, Travis Kelce, and more.',
      pressSources: [{ outlet: 'Variety', url: 'https://variety.com/2025/music/news/taylor-swift-extended-interview-late-night-with-seth-meyers-1236534347/' }],
      verification: {
        status: 'verified', checkedOn: '2026-08-12', method: 'oembed',
        oembedChannel: 'Late Night with Seth Meyers',
        integration: 'new:the-life-of-a-showgirl',
      },
    },
    {
      title: 'The Late Show with Stephen Colbert',
      date: '2025-12-10',
      youtubeUrl: null,
      channel: 'The Late Show (official; manifest had only the channel homepage)',
      type: 'talk_show',
      venue: 'The Late Show with Stephen Colbert',
      eraSlug: 'the-life-of-a-showgirl',
      summary: "First time on Colbert's couch; promotes The End of an Era docuseries and The Final Show film (Disney+); discusses the engagement, the masters, and a top-five Taylor songs list.",
      pressSources: [
        { outlet: 'Rolling Stone', url: 'https://www.rollingstone.com/music/music-news/taylor-swift-engagement-masters-showgirl-late-show-1235482380/' },
        { outlet: 'Billboard', url: 'https://www.billboard.com/music/pop/taylor-swift-five-favorite-taytay-songs-colbert-1236134507/' },
      ],
      verification: {
        status: 'placeholder', checkedOn: '2026-08-12', method: 'web search + oembed',
        resolvedUrl: 'https://www.youtube.com/watch?v=qtyzac0JbS4',
        oembedChannel: 'The Late Show with Stephen Colbert (official — verified 200)',
        integration: 'new:the-life-of-a-showgirl',
        notes: 'Resolved to the show\'s main interview segment "Taylor Swift\'s Good Year: Engaged To The Love Of Her Life, In Control Of Her Music Masters". The full interview is split across several official clips.',
      },
    },
  ],
};
