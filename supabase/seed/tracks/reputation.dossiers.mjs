// Per-song dossiers for the reputation era (issue #440 / #726 pattern),
// keyed by track slug and attached in reputation.mjs. Researched and
// fact-checked 2026-07-24 to drain curiosity ledgers #1281 (Delicate),
// #1385 (End Game), #1413 (New Year's Day), #1417 (Look What You Made Me
// Do) and #1474 (Getaway Car): every source URL below was fetched and verified to resolve and support
// its claim (a browser User-Agent was used for outlets that block default
// fetchers). Confirmed tier = Swift's own public statements or hard documented
// chart/credit facts only; every muse/target read is labeled unconfirmed.
// No lyric quotations beyond short titles/phrases already public. Internal
// song:<slug> ids resolve within the track corpus and moment:<id> ids resolve
// in the generated content vault; both are asserted by
// apps/web/lib/longlive/tracks.test.ts.
export default {
  'delicate': {
    whyItMatters: [
      "Delicate is reputation's emotional thesis in miniature: after an album of armor, it is the confession that her name has never been worse — so someone who likes her anyway must actually mean it. Critics and fans treat it as the record's soft center, the counter-argument to its revenge singles.",
      "It also proved the album's most durable hit. Sent to radio in March 2018, it logged 35 weeks on the Hot 100 — the longest run of any reputation single — and topped three Billboard airplay charts, quietly reframing the era from spectacle to staying power long after the louder singles faded.",
    ],
    meaning: {
      confirmed: [
        "Swift wrote 'Delicate' with Max Martin and Shellback, who produced it at MXM Studios in Stockholm and Los Angeles; the intro vocal is run through a vocoder. Released as reputation's fourth single on March 12, 2018, it peaked at No. 12 on the Hot 100, spent 35 weeks on the chart (the album's longest-charting single), and reached No. 1 on Pop Airplay, Adult Pop Songs and Adult Contemporary.",
        "The Joseph Kahn–directed video premiered March 11, 2018 at the iHeartRadio Music Awards; its concept has Swift, hounded by press, turn invisible and dance freely through a hotel and city streets.",
      ],
      supported: [
        "It is widely read as reputation's counter-thesis — the tender private feeling beneath the public-villain persona — and is frequently named among the album's best tracks; NPR's Ann Powers called it one of the record's most memorable, and it made 2018 year-end lists at Billboard, Slant and Rolling Stone.",
        "The blurred, vocoder-processed intro is often heard as a 'confession spoken through a filter,' matching the lyric's twice-a-line hesitancy — a reading built on the documented vocoder effect rather than a stated production goal.",
        "After release, some online commentators accused the video of copying Spike Jonze's 2016 Kenzo World fragrance ad (a woman dancing unseen through a building); the comparison dominated part of its reception, and Swift did not publicly respond to that specific charge.",
      ],
      fanTheories: [
        "Fans tie the 'third floor on the west side' line to a real downtown-LA bar, the Golden Gopher (an actual filming location in the video), but no Swift or writer statement confirms the lyric refers to it — treat the venue identification as unconfirmed.",
        "A supposed 2018 'Delicate challenge' lip-sync trend on musical.ly/TikTok is not well documented; what spread was reaction-image humor riffing on the video's mirror faces, so the organized-'challenge' framing is unconfirmed.",
      ],
    },
    live: [
      {
        date: '2018',
        event: 'reputation Stadium Tour',
        note: "Performed in the main setlist, opening the tour's third act into 'Shake It Off.'",
      },
      {
        event: 'The Eras Tour',
        note: "Sits at position 16 in the reputation block, between '...Ready for It?' and 'Don't Blame Me' → 'Look What You Made Me Do.'",
      },
    ],
    connections: [
      {
        relatedId: 'moment:vault-reputation-the-snake-video-that-announced-reputation',
        label: 'The snake video that announced reputation',
        why: "Delicate is the private answer to the era this rollout launched — the same 'reputation' the album weaponizes on the outside is what she assumes has ruined her chances on the inside.",
      },
      {
        relatedId: 'song:look-what-you-made-me-do',
        label: 'Look What You Made Me Do',
        why: "The album's two filters on the same self: the lead single builds a villain persona, Delicate confesses the soft feeling that persona is protecting.",
      },
    ],
    sources: [
      { name: 'Delicate (Taylor Swift song) — Wikipedia', url: 'https://en.wikipedia.org/wiki/Delicate_(Taylor_Swift_song)' },
      { name: "NME: Director Joseph Kahn on the 'Delicate' video", url: 'https://www.nme.com/news/music/director-joseph-kahn-trolls-taylor-swift-fans-upcoming-delicate-music-video-2255760' },
      { name: 'setlist.fm: reputation Stadium Tour, MetLife Stadium (July 21, 2018)', url: 'https://www.setlist.fm/setlist/taylor-swift/2018/metlife-stadium-east-rutherford-nj-13ebe5f1.html' },
      { name: "Yahoo Entertainment: real-life locations in the 'Delicate' video", url: 'https://www.yahoo.com/entertainment/apos-visit-real-life-locations-170548748.html' },
    ],
  },

  'end-game': {
    whyItMatters: [
      "End Game is where reputation says its own name: the hook chants 'big reputation, big reputation,' and the word recurs throughout, making the Ed Sheeran and Future three-hander the track that most directly voices the era's title and its theme of wanting to be judged up close rather than by a highlight reel of misses.",
      "It was also the album's marquee collaboration — Swift's second team-up with Sheeran after 'Everything Has Changed,' and Future's only Swift collaboration — carried by a globe-trotting Joseph Kahn video.",
    ],
    meaning: {
      confirmed: [
        "Written and produced by Max Martin and Shellback with Ilya, End Game was released as a single on November 14, 2017. On the Hot 100 it debuted at No. 86 and peaked at No. 18; internationally it reached No. 49 in the UK, No. 36 in Australia and No. 11 in Canada.",
        "Ed Sheeran has said he wrote his verse alone, early one morning in a New York hotel after a dream — so the three-artist track was assembled from separate contributions rather than recorded together in one room.",
        "The Joseph Kahn–directed video premiered January 12, 2018, moving between Miami (a yacht with Future), Tokyo (a bar with Sheeran) and London.",
      ],
      supported: [
        "Critics split on it: Rolling Stone's Rob Sheffield called it 'deeply weird, wildly funny,' while Pitchfork found the guest-heavy production lifeless — with Future's verse frequently singled out as the track's strongest element.",
      ],
      fanTheories: [
        "Listeners map the three verses' bravado onto each singer's own tabloid history, and read Sheeran's 'after the storm... Fourth of July' line as autobiographical; those real-life readings are reported interpretation, not stated in the song.",
      ],
    },
    live: [
      {
        date: '2018',
        event: 'reputation Stadium Tour',
        note: 'Performed nightly in a shortened version within the main setlist.',
      },
      {
        date: '2023-11-11',
        event: 'The Eras Tour — Buenos Aires',
        note: 'Returned as an acoustic surprise song.',
      },
      {
        date: '2024',
        event: 'The Eras Tour — London',
        note: "Performed with Sheeran in a mashup that folded in their earlier collaboration 'Everything Has Changed.'",
      },
    ],
    connections: [
      {
        relatedId: 'song:ready-for-it',
        label: '...Ready for It?',
        why: "reputation's other Max Martin/Shellback opener and the single End Game directly followed — the two front-load the album's armored, hip-hop-leaning sound.",
      },
      {
        relatedId: 'song:everything-has-changed',
        label: 'Everything Has Changed',
        why: "Swift's first Ed Sheeran collaboration (Red, 2013); End Game is the reunion, and the two were later fused in a 2024 Wembley mashup.",
      },
      {
        relatedId: 'moment:vault-reputation-the-end-game-video-miami-tokyo-london-with-ed-sheeran-and-fu',
        label: 'The End Game video — Miami, Tokyo, London',
        why: 'The song’s biggest visual moment gets its own page — the globe-trotting Kahn shoot with Sheeran and Future.',
      },
    ],
    sources: [
      { name: 'End Game (song) — Wikipedia', url: 'https://en.wikipedia.org/wiki/End_Game_(song)' },
      { name: 'Songfacts: End Game', url: 'https://www.songfacts.com/facts/taylor-swift/end-game' },
      { name: "NPR: Taylor Swift's 'End Game' video with Ed Sheeran and Future", url: 'https://www.npr.org/2018/01/12/577618929/taylor-swift-takes-a-shot-with-ed-sheeran-and-rides-shotgun-with-future-in-end-g' },
      { name: 'setlist.fm: reputation Stadium Tour, Manchester (June 8, 2018)', url: 'https://www.setlist.fm/setlist/taylor-swift/2018/etihad-stadium-manchester-england-5beabfb0.html' },
    ],
  },

  'new-years-day': {
    whyItMatters: [
      "New Year's Day is the album's barefoot thesis: after twelve tracks of armor, the closer measures love by who stays to clean up — glitter on the floor, candle wax — choosing the morning-after over the midnight kiss.",
      "It doubled as the album's country-radio single, a deliberate nod back to where Swift started, closing her most synthetic record on a stripped Swift/Antonoff piano ballad.",
    ],
    meaning: {
      confirmed: [
        "Big Machine sent 'New Year's Day' to US country radio as a promotional single on November 15, 2017 and as an official single on November 27. It peaked at No. 33 on Hot Country Songs and No. 41 on Country Airplay and did not enter the Hot 100; it carries no US certification (only Australian Platinum, New Zealand Gold and UK Silver).",
        "Its first public airing was a pre-recorded, intimate living-room performance — filmed during her October 2017 Secret Sessions at her Rhode Island home — that aired during an ad break in ABC's Scandal on November 9, 2017, the day before reputation's release. There is no official narrative music video.",
      ],
      supported: [
        "Though often called the album's only Swift/Antonoff duo production, several reputation tracks share that pairing ('Call It What You Want,' 'Dress,' 'Getaway Car'); New Year's Day is best described as the sparsest of them, not the sole one.",
      ],
    },
    voices: [
      {
        who: 'Taylor Swift',
        context: 'at the reputation release party',
        note: "Said she wrote it after a big New Year's Eve party in London, explaining the truly romantic figure is 'who's gonna deal with you on New Year's Day. Who's willing to give you Advil and clean up the house.'",
      },
      {
        who: 'Jack Antonoff',
        note: "Said the song 'happened so quickly' at his apartment — 'we texted the next morning to make sure it wasn't a dream' — and that 'the sessions were just her and I,' with unwanted ambient sounds deliberately left in for intimacy.",
      },
    ],
    live: [
      {
        date: '2018',
        event: 'reputation Stadium Tour',
        note: "Performed on piano every night, mashed up with 'Long Live.'",
      },
      {
        date: '2023-08-09',
        event: 'The Eras Tour — SoFi Stadium, Los Angeles',
        note: "Debuted as a piano surprise song at the final LA show; later reprised in 2024 mashups, including with 'Peace' and, at the Vancouver finale, 'Long Live'/'The Manuscript.'",
      },
    ],
    connections: [
      {
        relatedId: 'song:call-it-what-you-want',
        label: 'Call It What You Want',
        why: "reputation's other hushed, private turn — love as shelter rather than spectacle — the closest sibling in tone and sequence.",
      },
      {
        relatedId: 'song:daylight',
        label: 'Daylight',
        why: "Lover's closer answers this one: both end an album on ordinary, durable devotion, making them a deliberate cross-record pair.",
      },
    ],
    sources: [
      { name: "New Year's Day (Taylor Swift song) — Wikipedia", url: "https://en.wikipedia.org/wiki/New_Year's_Day_(Taylor_Swift_song)" },
      { name: "Rolling Stone: 'New Year's Day' sent to country radio", url: 'https://www.rollingstone.com/country/news/taylor-swifts-new-years-day-sent-to-country-radio-w512049' },
      { name: "Songfacts: New Year's Day", url: 'https://www.songfacts.com/facts/taylor-swift/new-years-day' },
      { name: "ABC News: Taylor Swift performs 'New Year's Day' for fans at her home", url: 'https://abcnews.go.com/Entertainment/taylor-swift-performs-reputation-song-years-day-fans/story?id=51038508' },
    ],
  },

  'look-what-you-made-me-do': {
    whyItMatters: [
      "The comeback single that opened the reputation era by killing the old Taylor on the phone: built on an interpolation of Right Said Fred's 'I'm Too Sexy,' it turned the summer's snake-emoji pile-on into a revenge overture and reset the public narrative on Swift's own terms.",
      "It rewrote the record books on arrival — a No. 1 debut-week that ended 'Despacito's reign, and a video that broke the global 24-hour streaming records of its day — making it one of the biggest single-week events of 2017.",
    ],
    meaning: {
      confirmed: [
        "Released August 24, 2017, it debuted at No. 77 and vaulted to No. 1 on the Hot 100 dated September 16, 2017 — its first full tracking week — ending 'Despacito's record-tying 16-week reign, on 2017's biggest week (84.4M US streams and 353,000 downloads). It also hit No. 1 on the UK Singles Chart and is RIAA-certified 4× Platinum.",
        "It set the then-record for most single-day global Spotify streams — 10,129,087 on August 25, 2017 — and the Joseph Kahn–directed video, premiered at the 2017 VMAs, took the YouTube 24-hour record with 43.2M views (past PSY's 'Gentleman,' ~36M) and the Vevo 24-hour record from Adele's 'Hello' (27.7M); both marks have since been beaten.",
        "The 'I'm Too Sexy' interpolation was cleared before release — Swift's team reached out and Right Said Fred (all three members co-credited) approved; the group publicly welcomed it, tweeting 'what a marvellous reinvention!'",
      ],
      supported: [
        "Reception was sharply polarized: Pitchfork's Meaghan Garvey called it 'a hardcore self-own' and The Ringer's Lindsay Zoladz 'a strange collage of retro reference points... devoid of self-effacing humor,' while others praised the darker turn. The video drew 2018 MTV VMA nominations for its craft (art direction, editing, visual effects) but no major song Grammy.",
        "Produced by Swift and Jack Antonoff, the track breaks deliberately from its sing-song verses into a chanted title-hook chorus — the team stripped the vocal down to the repeated title, echoing the 'I'm Too Sexy' cadence — before the spoken 'the old Taylor can't come to the phone right now... she's dead' bridge.",
      ],
      fanTheories: [
        "Swift never named a target on record — the Reputation prologue promised 'no further explanation,' and Antonoff deflected the question to her — so the near-universal read of the song as the 2016 Kanye West / Kim Kardashian / Katy Perry fallout is fan interpretation, not confirmed fact.",
        "The video is a museum of self-reference: press-confirmed intentional Easter eggs include the 'Nils Sjöberg' tombstone (Swift's real songwriting pseudonym on Calvin Harris's 'This Is What You Came For'), the 'I ❤ TS' crop-tops, and the tower of past-era Taylors reciting old quotes; finer 'receipts' readings are more fan-itemized than documented.",
      ],
    },
    live: [
      {
        date: '2018-05-08',
        event: 'reputation Stadium Tour (opening night, Glendale)',
        note: "Not the opener — the tour opened with '...Ready for It?'; 'Look What You Made Me Do' was the fifth song, staged with the giant inflatable cobra fans nicknamed 'Karyn.'",
      },
      {
        event: 'The Eras Tour',
        note: 'Performed in the main reputation set (dancers boxed in clear cases as past eras), not as a surprise song.',
      },
    ],
    connections: [
      {
        relatedId: 'moment:vault-reputation-look-what-you-made-me-do-and-the-phone-call-it-started-with',
        label: 'Look What You Made Me Do — and the phone call it started with',
        why: "The song's own origin moment: the 2016 phone-call fallout it answers, and the 'old Taylor is dead' framing it launched.",
      },
      {
        relatedId: 'moment:vault-reputation-the-look-what-you-made-me-do-video-shatters-youtubes-24-hour',
        label: 'The Look What You Made Me Do video shatters YouTube’s 24-hour record',
        why: 'The record-breaking premiere gets its own page — the 43.2M-view debut this single set.',
      },
      {
        relatedId: 'moment:vault-reputation-the-snake-video-that-announced-reputation',
        label: 'The snake video that announced reputation',
        why: 'The rollout this single launched — the reclaimed-snake teasers that broke the silence before the album.',
      },
    ],
    sources: [
      { name: 'Look What You Made Me Do — Wikipedia', url: 'https://en.wikipedia.org/wiki/Look_What_You_Made_Me_Do' },
      { name: 'Billboard: Leaps to No. 1 on Hot 100 With Top Streaming & Sales Week of 2017', url: 'https://www.billboard.com/pro/taylor-swift-look-what-you-made-me-do-number-one-hot-100/' },
      { name: 'Official Charts: shatters YouTube viewing record', url: 'https://www.officialcharts.com/chart-news/taylor-swifts-look-what-you-made-me-do-shatters-youtube-viewing-record__20292/' },
      { name: "The Hollywood Reporter: Taylor Swift Tops Psy's 24-Hour YouTube Record", url: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-tops-psys-24-hour-youtube-record-look-what-you-made-me-do-1033726/' },
      { name: "The FADER: Right Said Fred are 'very pleased' with the interpolation", url: 'https://www.thefader.com/2017/08/25/taylor-swift-right-said-fred-look-what-you-made-me-do' },
      { name: "Rolling Stone: 'Look What You Made Me Do' video decoded", url: 'https://www.rollingstone.com/music/music-news/taylor-swifts-look-what-you-made-me-do-video-decoded-13-things-you-missed-126268/' },
      { name: 'RIAA Gold & Platinum database', url: 'https://www.riaa.com/gold-platinum/' },
    ],
  },

  'getaway-car': {
    whyItMatters: [
      "Getaway Car is the album cut critics and fans most often crown reputation's best writing: a Bonnie-without-Clyde heist metaphor for using one relationship to flee another, doomed from the ignition. It was never a single and never got a video, yet it routinely tops best-of-reputation and best-Swift-deep-cut lists.",
      "It also became one of the Eras Tour's most-loved surprise songs — proof that a non-single can carry an album's reputation on songwriting alone.",
    ],
    meaning: {
      confirmed: [
        "Written and produced by Taylor Swift and Jack Antonoff, 'Getaway Car' was never released as a single and has no music video. On the Hot 100 it made only a minor No. 76 entry during reputation's release week, on pure streaming and sales; it is certified 4× Platinum in Australia (ARIA) and Platinum in the UK (BPI).",
      ],
      supported: [
        "It is widely named reputation's finest non-single and among Swift's best-written songs, praised for its cinematic 1980s synth-pop craft with Antonoff — a pulsing arpeggio that lifts in key and tempo into the celebrated bridge.",
        "It did not appear in the 2018 reputation Stadium Tour setlist; its live life began five years later on the Eras Tour, where it became a recurring, fan-favorite surprise song.",
        "It was never a US single and never got a music video; the only single service was to radio in Australia and New Zealand, which is why its chart footprint and certifications (4× Platinum ARIA) sit there rather than on the Hot 100 — the answer to the perennial 'why wasn't this a single' question fans ask about it.",
      ],
      fanTheories: [
        "The opening 'it was the best of times, the worst of crimes' is often read as a nod to Dickens's A Tale of Two Cities, and the Bonnie-and-Clyde / 'Thelma & Louise' framing as further cinematic allusion — readings the song's own crime-movie imagery supports but that Swift has not spelled out.",
        "Fans near-universally map the song to a well-photographed mid-2016 relationship handoff; Swift has never confirmed a real-life subject, so that mapping is unconfirmed.",
      ],
    },
    live: [
      {
        date: '2023-05-26',
        event: 'The Eras Tour — MetLife Stadium, East Rutherford',
        note: "Surprise-song debut on guitar with Jack Antonoff — the first of the tour's three MetLife nights, not the tour's opening night.",
      },
      {
        date: '2024-02',
        event: 'The Eras Tour — Melbourne',
        note: "Performed as a surprise-song mashup with 'August' and 'The Other Side of the Door.'",
      },
    ],
    connections: [
      {
        relatedId:
          'moment:vault-reputation-the-getaway-car-bridge-written-in-under-30-seconds-on-camera',
        label: 'The Getaway Car bridge, written in under 30 seconds on camera',
        why: "The filmed songwriting moment behind the track's most-praised section — the bridge fans consider its high point.",
      },
      {
        relatedId: 'song:out-of-the-woods',
        label: 'Out of the Woods',
        why: "Swift's other high-velocity escape song and a documented Eras mashup partner for 'Getaway Car' — the getaway/runaway lineage the two share.",
      },
      {
        relatedId: 'song:the-bolter',
        label: 'The Bolter',
        why: "Swift's later runaway-woman portrait and a documented Eras surprise-song mashup partner — both are songs about leaving before you can be left (cross-link candidate #1445).",
      },
    ],
    voices: [
      {
        who: 'Spencer Kornhaber',
        context: 'The Atlantic',
        note: "Singled it out as reputation's standout — 'the one true tune to hum misty-eyed after the movies.'",
      },
      {
        who: 'Stephen Thomas Erlewine',
        context: 'AllMusic',
        note: "Read the Antonoff cuts as Taylor at her most 'deeply felt and complex,' with 'vulnerability, melody, and confidence.'",
      },
    ],
    sources: [
      { name: 'Getaway Car (Taylor Swift song) — Wikipedia', url: 'https://en.wikipedia.org/wiki/Getaway_Car_(Taylor_Swift_song)' },
      { name: 'Billboard: All the Surprise Songs Taylor Swift Performed on The Eras Tour', url: 'https://www.billboard.com/lists/taylor-swift-eras-tour-surprise-songs/' },
      { name: 'Official Charts: Getaway Car — Taylor Swift', url: 'https://www.officialcharts.com/songs/taylor-swift-getaway-car/' },
      { name: 'Songfacts: Getaway Car', url: 'https://www.songfacts.com/facts/taylor-swift/getaway-car' },
    ],
  },
};
