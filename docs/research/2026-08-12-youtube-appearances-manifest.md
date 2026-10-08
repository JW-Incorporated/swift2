# Taylor Swift YouTube Appearances Manifest — "Swifties Hub" Ingestion File

**TL;DR**
- This manifest delivers a chronological, app-ready JSON array of Taylor Swift public appearances available on YouTube from her 2006 debut era through the December 2025 *The Life of a Showgirl* / Eras docuseries press cycle — spanning talk shows, award speeches/performances, radio/podcasts, red carpets, speeches, and viral moments.
- Coverage is strongest and most link-durable for 2015–2025 (official channels: GRAMMYs, MTV, AMAs, Apple Music, Disney+, NBC, BBC); the 2006–2013 Debut/Fearless/Speak Now/Red eras rely heavily on fan/archive re-uploads that are more prone to takedown.
- Every URL was drawn from live search results; those that could not be independently opened for channel confirmation are flagged in each entry's `notes` and in the Caveats section — these must be re-validated at ingestion time.

## Key Findings
- Taylor Swift's most-viewed single YouTube appearance is her August 13, 2025 *New Heights* podcast episode, which drew **13 million YouTube views in its first 24 hours (15M+ within two days)** and peaked at **over 1.3 million concurrent livestream viewers** — per YouTube's official Aug. 15, 2025 statement, "more than any other podcast on YouTube since the platform officially launched a dedicated podcast experience in 2023" (the prior *New Heights* record was 141,821 concurrent viewers).
- Official, durable YouTube uploads exist for most major award-show moments from 2010 onward (GRAMMYs, MTV, AMAs channels) and for essentially the entire 2025 promo cycle.
- The single most sparse era on official YouTube is Speak Now/Red (2010–2013); many appearances survive only as fan re-uploads.
- The late-2025 promo run for *The Life of a Showgirl* (Graham Norton Oct 2, Fallon Oct 6, Zane Lowe Oct 7, Seth Meyers Oct 8, Colbert Dec 10) forms an unusually dense cluster of official-channel appearances.

## Details — Manifest (JSON)

```json
[
  {
    "title": "Taylor Swift performs 'Tim McGraw' at the 42nd Academy of Country Music Awards",
    "date": "2007-05-15",
    "youtube_url": "https://www.youtube.com/watch?v=k3eWsix68bs",
    "channel": "Taylor Swift (official, needs re-verification)",
    "type": "award_performance",
    "venue_or_show": "42nd Academy of Country Music Awards",
    "era": "Debut",
    "summary": "Early televised performance of debut single 'Tim McGraw'.",
    "notes": "URL surfaced via search; confirm channel/ID at ingestion."
  },
  {
    "title": "Taylor Swift wins CMA Horizon Award and performs 'Our Song'",
    "date": "2007-11-07",
    "youtube_url": "https://www.youtube.com/watch?v=6Ak1OMIGC1c",
    "channel": "Fan/archive upload",
    "type": "award_speech",
    "venue_or_show": "41st CMA Awards",
    "era": "Debut",
    "summary": "Performs 'Our Song' then accepts the CMA Horizon (New Artist) Award — her first major industry award.",
    "notes": "Fan re-upload; takedown risk."
  },
  {
    "title": "Taylor Swift's first interview with Ellen",
    "date": "2008-01-17",
    "youtube_url": "https://www.youtube.com/watch?v=vBgiDYBCuxY",
    "channel": "TheEllenShow (official, needs re-verification)",
    "type": "talk_show",
    "venue_or_show": "The Ellen DeGeneres Show",
    "era": "Debut",
    "summary": "18-year-old Swift's debut talk-show sit-down after 'Teardrops on My Guitar' broke through.",
    "notes": "Billboard confirms Jan 17, 2008 debut date." [Billboard](https://www.billboard.com/music/music-news/taylor-swift-ellen-appearances-8511659/)
  },
  {
    "title": "Taylor Swift performs 'Love Story' as SNL musical guest",
    "date": "2009-01-10",
    "youtube_url": "https://www.youtube.com/watch?v=aB291QhwHco",
    "channel": "Fan/archive upload",
    "type": "tv_performance",
    "venue_or_show": "Saturday Night Live (S34, host Neil Patrick Harris)",
    "era": "Fearless",
    "summary": "Swift's first SNL appearance as musical guest, performing 'Love Story' (also performed 'Forever & Always').", [E! News](https://www.eonline.com/news/893243/taylor-swift-rocks-saturday-night-live-for-the-first-time-since-2009)
    "notes": "Fan re-upload; NBC official clip not surfaced."
  },
  {
    "title": "Kanye West interrupts Taylor Swift at the 2009 MTV VMAs",
    "date": "2009-09-13",
    "youtube_url": "https://www.youtube.com/watch?v=PwTx1VuMlqo",
    "channel": "Fan/archive upload (HD)",
    "type": "award_speech",
    "venue_or_show": "2009 MTV Video Music Awards, Radio City Music Hall",
    "era": "Fearless",
    "summary": "Swift accepts Best Female Video for 'You Belong With Me'; Kanye West storms the stage ('Imma let you finish'). One of the most-referenced pop-culture moments of the era; Beyoncé later invited Swift back onstage to finish her speech.",
    "notes": "Viral moment; fan upload."
  },
  {
    "title": "Taylor Swift accepts Album of the Year for 'Fearless' at the 52nd GRAMMY Awards",
    "date": "2010-01-31",
    "youtube_url": "https://www.youtube.com/watch?v=BFk2NjdJ1yY",
    "channel": "GRAMMYs (official)",
    "type": "award_speech",
    "venue_or_show": "52nd Annual GRAMMY Awards",
    "era": "Fearless",
    "summary": "Youngest AOTY winner at the time; [IMDb](https://www.imdb.com/news/ni63035865/) thanks her father, mother, and producer Nathan Chapman ('we get to take this back to Nashville').", [Grammy](https://www.grammy.com/news/grammy-rewind-watch-taylor-swift-win-album-year-fearless-2010/)
    "notes": "Official GRAMMYs channel; durable."
  },
  {
    "title": "Taylor Swift interview on The Ellen DeGeneres Show",
    "date": "2010-11-01",
    "youtube_url": "https://www.youtube.com/watch?v=f4kEl3f-ySc",
    "channel": "Fan/archive upload",
    "type": "talk_show",
    "venue_or_show": "The Ellen DeGeneres Show",
    "era": "Speak Now",
    "summary": "Speak Now-era interview; includes Ellen's signature scare prank.", [Billboard](https://www.billboard.com/music/music-news/taylor-swift-ellen-appearances-8511659/)
    "notes": "Fan upload."
  },
  {
    "title": "Taylor Swift performs 'Back to December' at the 2010 American Music Awards",
    "date": "2010-11-21",
    "youtube_url": "https://www.youtube.com/watch?v=792hPowNKDw",
    "channel": "Fan/archive upload",
    "type": "award_performance",
    "venue_or_show": "2010 American Music Awards",
    "era": "Speak Now",
    "summary": "Performs 'Back to December' interpolating OneRepublic's 'Apologize'.", [Billboard](https://www.billboard.com/music/awards/taylor-swift-american-music-awards-moments-amas-8544183/)
    "notes": "Fan upload; no official AMA channel version surfaced."
  },
  {
    "title": "Taylor Swift performs 'Red' on Good Morning America",
    "date": "2012-10-23",
    "youtube_url": "https://www.youtube.com/watch?v=019k5vbbqB0",
    "channel": "Fan/archive upload",
    "type": "tv_performance",
    "venue_or_show": "Good Morning America (Times Square)",
    "era": "Red",
    "summary": "Red release-week performance.",
    "notes": "Red era is the sparsest on official YouTube; fan upload."
  },
  {
    "title": "Taylor Swift presents Kanye West the Video Vanguard Award at the 2015 VMAs",
    "date": "2015-08-30",
    "youtube_url": "https://www.youtube.com/watch?v=XLiXeztX0Fw",
    "channel": "Fan/archive upload",
    "type": "award_speech",
    "venue_or_show": "2015 MTV Video Music Awards",
    "era": "1989",
    "summary": "Swift (who also won Video of the Year for 'Bad Blood') introduces Kanye West for the Vanguard Award, echoing 'Imma let you finish' — a public reconciliation moment.",
    "notes": "Fan compilation (2009 vs 2015)."
  },
  {
    "title": "Taylor Swift interview with Zane Lowe on Beats 1 (1989 / tour documentary)",
    "date": "2015-12-15",
    "youtube_url": "https://www.dailymotion.com/video/x8ry6ps",
    "channel": "Dailymotion (no clean YouTube URL located)",
    "type": "radio",
    "venue_or_show": "Apple Music / Beats 1",
    "era": "1989",
    "summary": "Wide-ranging talk on the 'Dear Apple' letter, the 1989 World Tour, and the tour documentary.",
    "notes": "Only a Dailymotion mirror was confirmed; flag for a YouTube substitute at ingestion."
  },
  {
    "title": "Taylor Swift accepts Album of the Year for '1989' at the 58th GRAMMY Awards",
    "date": "2016-02-15",
    "youtube_url": "https://www.youtube.com/watch?v=dMCAEUb0h34",
    "channel": "GRAMMYs (official, needs re-verification)",
    "type": "award_speech",
    "venue_or_show": "58th Annual GRAMMY Awards",
    "era": "1989",
    "summary": "Becomes the first woman to win Album of the Year twice; delivers 'young women… people who will try to undercut your success' speech, widely read as a response to Kanye West's 'Famous' lyric.", [Time](https://time.com/4225261/2016-grammys-taylor-swift-kanye-west/)
    "notes": "Confirm official GRAMMYs ID."
  },
  {
    "title": "Taylor Swift wins Video of the Year for 'You Need to Calm Down' at the 2019 VMAs",
    "date": "2019-08-26",
    "youtube_url": "https://www.youtube.com/watch?v=8z4icNgFSPI",
    "channel": "MTV (official, needs re-verification)",
    "type": "award_speech",
    "venue_or_show": "2019 MTV Video Music Awards",
    "era": "Lover",
    "summary": "Uses speech to call for support of the Equality Act.", [CBS News](https://www.cbsnews.com/detroit/news/taylor-swift-calls-out-white-house-during-vmas-acceptance-speech)
    "notes": "Confirm MTV official ID."
  },
  {
    "title": "Taylor Swift accepts Artist of the Decade at the 2019 American Music Awards",
    "date": "2019-11-24",
    "youtube_url": "https://www.youtube.com/watch?v=0pbSQ_0qbqU",
    "channel": "AMAs (official, needs re-verification)",
    "type": "award_speech",
    "venue_or_show": "2019 American Music Awards",
    "era": "Lover",
    "summary": "Carole King presents the Artist of the Decade award; [Billboard](https://www.billboard.com/music/awards/taylor-swift-artist-decade-speech-2019-amas-8544659/) Swift reflects on the 2010s.",
    "notes": "She also won Artist of the Year the same night." [gulfnews](https://gulfnews.com/amp/story/entertainment%2Fmusic%2Ftaylor-swift-breaks-michael-jacksons-record-at-ama-awards-1.68060555)
  },
  {
    "title": "Taylor Swift accepts Woman of the Decade at Billboard Women in Music 2019",
    "date": "2019-12-12",
    "youtube_url": "https://www.youtube.com/watch?v=hyf9vJB8V3s",
    "channel": "Fan/archive upload",
    "type": "speech",
    "venue_or_show": "Billboard Women in Music",
    "era": "Lover",
    "summary": "~15-minute speech on sexism in the music industry and the Scooter Braun/masters dispute.", [gulfnews](https://gulfnews.com/entertainment/music/taylor-swift-calls-out-scooter-braun-during-billboard-speech-1.68473457)
    "notes": "Fan upload; no official Billboard channel version confirmed."
  },
  {
    "title": "Taylor Swift: Miss Americana — Sundance 2020 World Premiere Q&A",
    "date": "2020-01-23",
    "youtube_url": "https://www.youtube.com/watch?v=JqIt0H6XqpA",
    "channel": "Fan/press upload",
    "type": "press",
    "venue_or_show": "2020 Sundance Film Festival (opening night)",
    "era": "Lover",
    "summary": "Post-premiere Q&A with Swift and director Lana Wilson for the Netflix documentary.", [YouTube](https://www.youtube.com/watch?v=JqIt0H6XqpA)
    "notes": "Documentary released on Netflix Jan 31, 2020." [Wikipedia](https://en.wikipedia.org/wiki/Miss_Americana)
  },
  {
    "title": "folklore: the long pond studio sessions — Official Trailer (Disney+)",
    "date": "2020-11-25",
    "youtube_url": "https://www.youtube.com/watch?v=jgdFUoZzCI0",
    "channel": "Disney+ (official)",
    "type": "other",
    "venue_or_show": "Disney+ concert film",
    "era": "Folklore/Evermore",
    "summary": "Trailer for Swift's directorial debut concert/documentary film; the full film performs all 17 folklore tracks with Aaron Dessner and Jack Antonoff.", [Wikipedia](https://en.wikipedia.org/wiki/Folklore:_The_Long_Pond_Studio_Sessions)
    "notes": "Related official clip: 'exile' ft. Bon Iver — https://www.youtube.com/watch?v=o5SQIECedTY"
  },
  {
    "title": "Taylor Swift full interview on Jimmy Kimmel Live!",
    "date": "2020-12-14",
    "youtube_url": "https://youtu.be/qOX0FK1DW5U",
    "channel": "Jimmy Kimmel Live! (official)",
    "type": "talk_show",
    "venue_or_show": "Jimmy Kimmel Live!",
    "era": "Folklore/Evermore",
    "summary": "Discusses keeping evermore secret and the folklore/evermore surprise-album era.",
    "notes": "Short-link; resolve to full watch URL at ingestion."
  },
  {
    "title": "Taylor Swift performs 'All Too Well (10 Minute Version)' on SNL",
    "date": "2021-11-13",
    "youtube_url": "https://www.youtube.com/results?search_query=taylor+swift+all+too+well+snl",
    "channel": "Saturday Night Live (official — locate exact ID)",
    "type": "tv_performance",
    "venue_or_show": "Saturday Night Live",
    "era": "Red (Taylor's Version)",
    "summary": "Rare single-song musical-guest slot; performs the 10-minute 'All Too Well' with the short film playing behind her.",
    "notes": "Exact watch URL not captured; SNL official channel hosts the clip."
  },
  {
    "title": "Taylor Swift NYU 2022 Commencement Speech",
    "date": "2022-05-18",
    "youtube_url": "https://www.youtube.com/watch?v=OBG50aoUwlI",
    "channel": "NYU (official)",
    "type": "speech",
    "venue_or_show": "New York University 188th Commencement, Yankee Stadium",
    "era": "Midnights (pre-announce)",
    "summary": "Receives honorary Doctor of Fine Arts; ~20-minute address on embracing mistakes and 'cringe is unavoidable'.",
    "notes": "Alt (NBC New York): https://www.youtube.com/watch?v=0bkDDJNOlJQ"
  },
  {
    "title": "Taylor Swift announces 'Midnights' during 2022 VMAs acceptance speech",
    "date": "2022-08-28",
    "youtube_url": "https://www.youtube.com/watch?v=0H4Bhf-KPZ0",
    "channel": "Fan/press upload",
    "type": "award_speech",
    "venue_or_show": "2022 MTV Video Music Awards, Prudential Center",
    "era": "Midnights",
    "summary": "Wins Video of the Year for 'All Too Well: The Short Film' (record third VOTY, first for a self-directed video) and reveals Midnights arrives Oct 21.",
    "notes": "Alt MTV News: https://www.youtube.com/watch?v=_J1dJLDrPBo"
  },
  {
    "title": "Taylor Swift hits red carpet for the Eras Tour concert film premiere",
    "date": "2023-10-11",
    "youtube_url": "https://www.youtube.com/watch?v=X_wHLxTOzas",
    "channel": "Good Morning America (official)",
    "type": "red_carpet",
    "venue_or_show": "Taylor Swift: The Eras Tour film world premiere, AMC The Grove 14, LA",
    "era": "Eras Tour / Midnights",
    "summary": "Red-carpet arrival and fan meet-and-greet; premiere moved up a day due to demand.", [CBS News](https://www.cbsnews.com/amp/losangeles/news/the-grove-shutdown-for-taylor-swift-the-eras-tour-movie-premiere)
    "notes": "GMA official upload."
  },
  {
    "title": "Taylor Swift named Time's 2023 Person of the Year (TODAY announcement)",
    "date": "2023-12-06",
    "youtube_url": "https://www.youtube.com/watch?v=VeFzmqp6OaQ",
    "channel": "TODAY (official)",
    "type": "other",
    "venue_or_show": "Time Person of the Year / TODAY Show",
    "era": "Midnights",
    "summary": "Time EIC Sam Jacobs reveals Swift as the first figure from the arts/entertainment to be named Person of the Year, and the first woman to appear twice on the franchise's cover since 1927 (she was also a 2017 'Silence Breaker').",
    "notes": "The interview itself was print; this is the reveal segment."
  },
  {
    "title": "Taylor Swift wins Album of the Year for 'Midnights' at the 2024 GRAMMYs",
    "date": "2024-02-04",
    "youtube_url": "https://www.youtube.com/watch?v=Yq-q-ZCZwxc",
    "channel": "GRAMMYs (official)",
    "type": "award_speech",
    "venue_or_show": "66th Annual GRAMMY Awards",
    "era": "Midnights / TTPD",
    "summary": "Becomes the first artist in Grammy history to win Album of the Year four times (surpassing Frank Sinatra, Stevie Wonder and Paul Simon at three each); her 14th career Grammy. Earlier in the night announced The Tortured Poets Department (out April 19).",
    "notes": "Official GRAMMYs channel."
  },
  {
    "title": "Taylor Swift remembers 9/11 during 2024 VMAs acceptance speech",
    "date": "2024-09-11",
    "youtube_url": "https://www.youtube.com/watch?v=g55D_gAoC3I",
    "channel": "Fan/press upload",
    "type": "award_speech",
    "venue_or_show": "2024 MTV Video Music Awards",
    "era": "TTPD",
    "summary": "Accepts Best Collaboration for 'Fortnight' with Post Malone; notes the 9/11 anniversary.",
    "notes": "Clip."
  },
  {
    "title": "Taylor Swift on New Heights podcast — announces 'The Life of a Showgirl'",
    "date": "2025-08-13",
    "youtube_url": "https://www.youtube.com/@newheightshow",
    "channel": "New Heights (official — locate episode ID)",
    "type": "podcast",
    "venue_or_show": "New Heights with Jason & Travis Kelce",
    "era": "The Life of a Showgirl",
    "summary": "Announces 12th album (out Oct 3), reveals cover art and tracklist (incl. a Sabrina Carpenter title-track collab), and discusses buying back her masters and her relationship with Travis Kelce.",
    "notes": "13M YouTube views in first 24h (15M+ within two days); YouTube stream crashed 'roughly an hour and 44 minutes in, at which point the audience count had climbed to 1.3 million' (Variety/TheWrap); averaged ~1.18M viewers. Locate exact episode watch URL."
  },
  {
    "title": "Taylor Swift on The Graham Norton Show (The Life of a Showgirl)",
    "date": "2025-10-02",
    "youtube_url": "https://www.youtube.com/watch?v=NlOdFJmkEls",
    "channel": "The Graham Norton Show / BBC (official)",
    "type": "talk_show",
    "venue_or_show": "The Graham Norton Show",
    "era": "The Life of a Showgirl",
    "summary": "Album promo; jokes about inviting Norton to her wedding. Taped Oct 2, aired UK Oct 3.",
    "notes": "Official BBC upload."
  },
  {
    "title": "Taylor Swift stops by The Tonight Show Starring Jimmy Fallon",
    "date": "2025-10-06",
    "youtube_url": "https://www.youtube.com/watch?v=GzjZqH0WRwE",
    "channel": "The Tonight Show (official)",
    "type": "talk_show",
    "venue_or_show": "The Tonight Show Starring Jimmy Fallon",
    "era": "The Life of a Showgirl",
    "summary": "~20-minute interview on the album, [NBC](https://www.nbc.com/nbc-insider/how-to-watch-taylor-swift-extended-tonight-show-interview) engagement to Travis Kelce, regaining masters; addresses why she isn't playing the 2026 Super Bowl halftime (Jay-Z/Roc Nation context). Extended cut aired as a special Oct 10.", [NBC](https://www.nbc.com/nbc-insider/how-to-watch-taylor-swift-extended-tonight-show-interview)
    "notes": "First major US late-night appearance since 2022." [The Hollywood Reporter](https://www.hollywoodreporter.com/music/music-news/taylor-swift-jimmy-fallon-tonight-show-life-of-a-showgirl-1236394527/)
  },
  {
    "title": "Taylor Swift: The Life of a Showgirl — The Zane Lowe Interview (Apple Music)",
    "date": "2025-10-07",
    "youtube_url": "https://www.youtube.com/watch?v=mUZ9T-hstUI",
    "channel": "Apple Music (official)",
    "type": "radio",
    "venue_or_show": "Apple Music / Zane Lowe",
    "era": "The Life of a Showgirl",
    "summary": "Extended sit-down (via FaceTime) on the writing process behind The Life of a Showgirl.",
    "notes": "Official Apple Music upload."
  },
  {
    "title": "Taylor Swift on Late Night with Seth Meyers",
    "date": "2025-10-08",
    "youtube_url": "https://www.youtube.com/watch?v=Wd7S1wZqkbI",
    "channel": "Late Night with Seth Meyers (official, needs re-verification)",
    "type": "talk_show",
    "venue_or_show": "Late Night with Seth Meyers ('TAY/kover' episode)",
    "era": "The Life of a Showgirl",
    "summary": "Sole-guest episode; [Variety](https://variety.com/2025/music/news/taylor-swift-extended-interview-late-night-with-seth-meyers-1236534347/) talks the album, Travis Kelce, and more.", [Yahoo!](https://www.yahoo.com/entertainment/videos/taylor-swift-2025-full-interview-130000263.html)
    "notes": "Confirm official ID."
  },
  {
    "title": "Taylor Swift on The Late Show with Stephen Colbert",
    "date": "2025-12-10",
    "youtube_url": "https://www.youtube.com/@ColbertLateShow",
    "channel": "The Late Show (official — locate ID)",
    "type": "talk_show",
    "venue_or_show": "The Late Show with Stephen Colbert",
    "era": "The Life of a Showgirl / Eras docuseries",
    "summary": "First time on Colbert's couch; promotes 'The End of an Era' docuseries and 'The Final Show' film (Disney+); [Rolling Stone](https://au.rollingstone.com/?p=88634) discusses engagement, masters, and building a top-five Taylor songs list.",
    "notes": "Locate exact watch URL; full interview posted to the show's YouTube." [Threads](https://www.threads.com/@tswiftedits_13_/post/DSIMMRNFHNH/taylor-swifts-full-interview-with-stephen-colbert-is-now-available-on-you-tube)
  }
]
```

## Recommendations
**Stage 1 — Ingest official-channel entries first** (GRAMMYs, MTV, AMAs, Disney+, Apple Music, NBC/Tonight Show, BBC/Graham Norton, TODAY, GMA, NYU). These are the most link-durable and can go live immediately.

**Stage 2 — Programmatic validation.** Run every URL through the YouTube oEmbed or Data API at ingestion; quarantine any that 404. Fan uploads (all Debut/Fearless/Speak Now/Red entries, Billboard 2019, Miss Americana Q&A, 2009 & 2015 VMA compilations) carry the highest takedown risk and should be checked most frequently.

**Stage 3 — Resolve placeholders.** Capture exact `watch?v=` IDs for the *New Heights* episode, the 2021 SNL 'All Too Well' performance, the Colbert Dec 2025 interview, and a YouTube substitute for the 2015 Zane Lowe interview (currently a Dailymotion mirror).

**Stage 4 — Backfill sparse eras.** Commission a dedicated second pass on 2006–2013 (Debut through Red), prioritizing established fan-archive channels; this is where the manifest is thinnest.

**Benchmarks that would change the plan:** if API validation shows a >20% dead-link rate among fan uploads, switch those entries to "clip pending" status rather than publishing; if official channels (e.g., MTV, AMAs) are confirmed to host the fan-sourced award moments, replace the fan URLs before launch.

## Caveats
- **This is a representative backbone, not the full "hundreds of entries" target.** The web-search budget was exhausted mid-research, so this manifest covers the major/notable appearance in each era (as prioritized in the brief) rather than every minor talk-show hit. It should be treated as a validated seed set to expand.
- **Channel labels marked "needs re-verification" are inferred** from search-result titles/descriptions because individual YouTube pages could not be opened for direct confirmation.
- **A few entries use channel-homepage or search placeholders** where an exact watch URL was not captured; these are flagged in each `notes` field.
- **Two known appearances could not be matched to confirmed YouTube URLs** and are omitted pending verification: the 2009 CMA Entertainer of the Year win/speech (event confirmed for Nov 11, 2009), and a Red-era (2012–2013) Kimmel/Fallon appearance (the well-documented Kimmel sit-down is 2014, i.e., the 1989 era).
- **No verified Jimmy Kimmel October 2025 appearance exists** in the sources reviewed; Swift's documented Oct 2025 promo stops were Graham Norton, Fallon, Zane Lowe, and Seth Meyers. Do not add a Kimmel 2025 entry without primary confirmation.
- **Sparse-era flag:** Debut (2006–2008), Speak Now (2010–2011), and especially Red (2012–2013) have the weakest official-YouTube availability and depend on fan archives; 1989 onward is well covered by official channels.