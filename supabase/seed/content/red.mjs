// Vault content — Red era.
//
// Two wavetop months: Oct 2012 (album release) and Mar 2013 (tour opens).
// Every claim verified against its cited source directly. See
// docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first) authoring model this follows.
//
// "All Too Well" is one of the most persistently theorized songs in
// Swift's catalog. Deliberately excludes any naming/implication — sticks
// to Taylor's own quote about the scarf as a songwriting device, not the
// fan theory about who it's about.
//
// T16 full-standard pass (2026-07-09): every item now carries a 2+ paragraph
// body (paragraphs split on blank lines, per the sync script's \n\n split)
// and at least one real photo. Existing prose and photos were kept intact;
// splits landed at natural seams and expansions were verified against the
// cited sources (each new claim fetched and checked this session). New
// photos follow the 2026-07-09 relaxed image policy in docs/decisions.md:
// real press/agency/fan photos, hotlinked with credit, honest 'archival'/
// 'reference' labeling where the image is not the literal moment.

export default {
  eraSlug: 'red',
  items: [
    {
      year: 2012,
      month: 10,
      day: 30,
      category: 'business',
      significance: 'defining', // stands in for the whole Red era's arrival — no dedicated release-day item exists yet (docs/decisions.md, 2026-07-19)
      relatedIds: ['moment:vault-red-red-gets-its-do-over-red-taylors-version-opens-at-no-1'],
      title: 'Red sells 1.2 million copies — the biggest week in a decade',
      snippet:
        "1.208 million copies in week one — the strongest opening week for any album since Eminem's The Eminem Show in 2002, and her second million-selling debut in a row.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e8/Taylor_Swift_-_Red.png',
      moment: {
        context:
          "Nobody was supposed to sell like this anymore. Red's 1.208 million was the first opening week to clear 1.2 million since The Eminem Show moved 1.3 million in 2002 — and it landed in a market where, as Slate put it, even a very popular artist shipping 300,000 copies out of the gate counted as a huge success.\n\nRed roughly doubled the year's next-best debut, and unlike Lady Gaga's Born This Way, which cracked a million the year before with help from Amazon's 99-cent promotional pricing, it did so selling at $7.99. The week also made her the first female solo artist with two million-selling weeks (alongside Speak Now) and surpassed Garth Brooks's Double Live as the fastest-selling country album.",
        sources: [
          {
            outlet: 'Slate',
            url: 'https://slate.com/culture/2012/10/taylor-swift-album-sales-record-1-2-million-copies-of-red-sold-in-first-week-according-to-soundscan.html',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-country/taylor-swifts-red-sells-1-2-million-copies-in-first-week-243204/',
          },
        ],
        // Photo-enrichment pass (2026-07-18): focal point set by viewing — the
        // cover's lower face/red lip sits just above center-left under the hat
        // brim. (Counts as one unique photo; thumbnailUrl reuses the same file.)
        // Photo pass 2026-07-19 (bulk-to-6+, docs/decisions.md): this item
        // stands in for the whole era's arrival (no dedicated release-day
        // item exists), so 6 more real, verified Red Tour photos anchor the
        // era the record-setting week opened. All curl 200, image/jpeg.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/e/e8/Taylor_Swift_-_Red.png',
            credit: 'Big Machine Records',
            focalPoint: '45% 38%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Taylor_Swift_-_Red_Tour_-_Sparks_Fly_-_Live_in_Los_Angeles.jpg',
            focalPoint: '54% 30%',
            credit: 'Denielle (celestigirl25), Wikimedia Commons (CC BY-SA 2.0)',
            caption: 'The Red Tour\'s main stage in Los Angeles, August 2012 — the tour built around the record-setting album.',
            kind: 'archival',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Taylor_Swift_%26_Ed_Sheeran_on_B-stage_-_Red_Tour_-_Tacoma_-_Cut.jpg',
            focalPoint: '46% 26%',
            credit: 'Ronald Woan, Wikimedia Commons (CC BY-SA 2.0)',
            caption: 'Swift and opener Ed Sheeran on the Red Tour\'s B-stage, Tacoma, August 2013.',
            kind: 'archival',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Taylor_Swift_RED_tour_2013_%288591000109%29.jpg',
            focalPoint: '55% 33%',
            credit: 'Jana Zills, Wikimedia Commons (CC BY 2.0)',
            caption: 'Performing "Holy Ground" on the Red Tour, 2013.',
            kind: 'archival',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Taylor_Swift_-_RED_Tour_-_LONDON_-_I_Knew_You_Were_Trouble_%28night_4%29.jpg',
            focalPoint: '48% 20%',
            credit: 'Clarence Ji, Wikimedia Commons (CC BY 2.0)',
            caption: '"I Knew You Were Trouble" staged as a Victorian-gown set piece, O2 Arena, London, February 2014.',
            kind: 'archival',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Taylor_Swift_-_Red_Tour_08.jpg',
            focalPoint: '53% 22%',
            credit: 'Jana Beamer (jazills), Wikimedia Commons (CC BY 2.0)',
            caption: 'Playing the title track on a red Les Paul, Red Tour, 2013.',
            kind: 'archival',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Taylor_Swift_RED_tour_2013_%288589120838%29.jpg',
            focalPoint: '57% 42%',
            credit: 'Jana Zills, Wikimedia Commons (CC BY 2.0)',
            caption: 'The circus-ringmaster set piece for "22" and "Holy Ground," St. Louis, March 2013.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2012,
      month: 10,
      day: 22,
      category: 'music',
      title: 'All Too Well, and the scarf that became a metaphor',
      snippet:
        "The scarf in the lyrics — Taylor's called it \"a metaphor,\" then stopped herself before saying more.",
      sourceUrl: 'https://www.etonline.com/taylor-swift-says-red-scarf-in-all-too-well-is-a-metaphor-190595',
      thumbnailUrl: null,
      moment: {
        context:
          'Full quote, from the Toronto International Film Festival in September 2022, where she screened the All Too Well short film (the film premiered in New York in November 2021): "Basically, the scarf is a metaphor, and we turned it red because red is a very important color in this album, which is called Red." Then she stopped herself: "And, I think when I say it\'s a metaphor ... I\'m just going to stop."\n\nThe song behind the scarf started as an improvised "emotional rant" over a four-chord vamp at a February 2011 band rehearsal; co-writer Liz Rose later helped trim what she remembered as a 10-to-20-minute draft down to the 5:28 album cut — still Red\'s longest track. It was never a single and debuted at just No. 80 on the Hot 100, but became the album\'s critical standout, and when the full 10-minute version finally surfaced on Red (Taylor\'s Version) in 2021, it became the longest song ever to top the Hot 100.',
        sources: [
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/taylor-swift-says-red-scarf-in-all-too-well-is-a-metaphor-190595',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/All_Too_Well',
          },
        ],
        // T16 full-standard pass (2026-07-09): single cover for the 10-minute
        // version, from Wikipedia's stable upload.wikimedia.org copy — exact
        // filename taken from the All Too Well article HTML. The item's body
        // already covers the 2021 version, so kind 'archival' with a dated
        // caption. Verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/5/55/Taylor_Swift_-_All_Too_Well_%2810_Minute_Version%29_%28Taylor%27s_Version%29_%28From_The_Vault%29.png',
            credit: 'Republic Records',
            caption: 'Single art for "All Too Well (10 Minute Version) (Taylor\'s Version) (From the Vault)" — the 2021 release that finally took the song to No. 1.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2012,
      month: 10,
      day: 22,
      category: 'music',
      title: '22, a birthday letter to her closest friends',
      snippet: 'Not a love song — a carefree ode to being "happy, free, confused, and lonely" all in the same year, with her girls beside her.',
      sourceUrl: 'https://www.songfacts.com/facts/taylor-swift/22',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/d/d4/Taylor_Swift_-_22.png',
      moment: {
        context:
          'Written with Max Martin and Shellback, and — as she told Ryan Seacrest — written "about my friends." She called 22 "my favorite year of my life," and her own description of the age stuck: "You\'re still learning, but you know enough. You still know nothing, but you know that you know nothing."\n\nA hidden message in the liner notes — "Ashley Dianna Claire Selena" — named the friend group behind it, including Dianna Agron and Selena Gomez. Released as Red\'s fourth single the following March, it carried the thesis into the top 20 of the Hot 100.',
        sources: [
          { outlet: 'Songfacts', url: 'https://www.songfacts.com/facts/taylor-swift/22' },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/complete-timeline-taylor-swift-dianna-124601988.html',
          },
        ],
        // T16 image-fix pass (2026-07-10): the Yahoo/zenfs URL was a
        // two-panel collage stitching Dianna Agron (Golden Globes carpet)
        // next to Taylor (ACM Awards carpet) — two unrelated red-carpet
        // photos, not a "22"-appropriate image. Replaced with the song's
        // own official single cover art. Verified HTTP 200 + image/png +
        // subject visually confirmed this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/d/d4/Taylor_Swift_-_22.png',
            credit: 'Big Machine Records',
          },
        ],
      },
    },
    {
      year: 2012,
      month: 10,
      day: 9,
      category: 'music',
      // Cross-link (Stage 3, 2026-07-27): the "I Knew You Were Trouble"
      // cluster — the dubstep debut, its global chart run, and the video's
      // birthday drop — now interlink.
      relatedIds: [
        'moment:vault-red-i-knew-you-were-trouble-goes-global',
        'moment:vault-red-the-i-knew-you-were-trouble-video-drops-on-her-23rd-birthday',
      ],
      title: 'I Knew You Were Trouble brings dubstep to pop radio',
      snippet: 'A wobble-bass drop in the middle of a breakup song — critics called it the moment mainstream pop stopped being "sonically conservative."',
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Knew_You_Were_Trouble',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/7/70/I_Knew_You_Were_Trouble.png',
      moment: {
        context:
          'Produced with Max Martin and Shellback after Swift sketched the melody on piano, the drop was there — by her account — to convey the chaotic emotions of the lyrics, not to chase a trend.\n\nCritics treated it as a hinge point anyway: the New York Times\' Jon Caramanica called the wobble a "wrecking ball" that shifted "the dynamic of not only the song but also of Ms. Swift\'s career," and the Los Angeles Times noted that while DJs like Skrillex and Zedd had popularized dubstep, this was the song that introduced it to a mainstream pop audience that had been "sonically conservative for the past half-decade." It sold 416,000 downloads in its first week — making her the first artist ever with two 400,000-download opening weeks — and peaked at No. 2 on the Hot 100.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/I_Knew_You_Were_Trouble' }],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/7/70/I_Knew_You_Were_Trouble.png',
            credit: 'Big Machine Records',
          },
        ],
      },
    },
    {
      year: 2012,
      month: 10,
      day: 22,
      category: 'music',
      title: 'Starlight, built from an old photo of two teenagers dancing',
      snippet: 'A black-and-white photo of a young couple sneaking into a yacht-club party — she imagined the rest, and wrote a whole song around it.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Starlight_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          "The couple in the photo was a teenage Ethel and Robert F. Kennedy, dancing in the 1940s. Swift said she found herself imagining how much fun they must have had that night, and built the lyric around two seventeen-year-olds who \"pretended they were a duchess and a prince\" at a 1945 yacht-club party.\n\nThe song folded into a real friendship: she grew close to Ethel and the Kennedy family over 2012, dedicated the song to her in Red's liner notes, and that December performed an acoustic \"Starlight\" at the Robert F. Kennedy Center for Justice and Human Rights ceremony where she received the Ripple of Hope Award.",
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Starlight_(Taylor_Swift_song)' }],
        // T16 full-standard pass (2026-07-09): no cover art exists for
        // "Starlight" (album track) and the 1940s snapshot that inspired it
        // isn't hosted anywhere stable. Wikimedia Commons has a public-domain
        // 1968 photo of the actual couple — Robert and Ethel Kennedy — so it
        // ships as kind 'reference' with a caption that says outright it is
        // not the liner-notes photo. Verified HTTP 200 + image/jpeg this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Robert_and_Ethel_Kennedy_%281%29.jpg/500px-Robert_and_Ethel_Kennedy_%281%29.jpg',
            credit: 'Public domain, via Wikimedia Commons',
            caption: 'Robert and Ethel Kennedy — the couple whose 1940s photo inspired "Starlight" — shown here in 1968, not in the snapshot from Red\'s liner notes.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      year: 2012,
      month: 10,
      day: 22,
      category: 'music',
      title: 'Everything Has Changed, written on a trampoline with Ed Sheeran',
      snippet: "Written together on a trampoline in her backyard, with an up-and-coming Ed Sheeran she'd discovered on tour.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Everything_Has_Changed',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/7/72/Taylor_Swift_-_Everything_Has_Changed.png',
      moment: {
        context:
          'Swift brought in Butch Walker to produce, saying she knew he would approach it "from an organic place, which is where [Sheeran] comes from." Released as a single in July 2013, it reached No. 32 on the Hot 100 — and did even better in Sheeran\'s home market, hitting the top 10 in the UK and Ireland — went double platinum in the US, and became a live duet throughout the Red Tour\'s North American run, which Sheeran opened.\n\nThe Philip Andelman video, out that June, cast two child actors as elementary-school classmates falling into an easy friendship — with Swift and Sheeran revealed at the end as their parents. The story got an epilogue nine years later: the same two actors, grown up, were brought back for Sheeran\'s 2022 "The Joker and the Queen" video (featuring Swift), which outlets read as a deliberate sequel.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Everything_Has_Changed' }],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/7/72/Taylor_Swift_-_Everything_Has_Changed.png',
            credit: 'Big Machine Records',
          },
        ],
      },
    },
    {
      year: 2013,
      month: 3,
      day: 13,
      category: 'tour',
      significance: 'notable', // her first arena-to-stadium-scale headlining run at the height of Red, but not a record-setting tour opening on the site's defining tier (docs/decisions.md, 2026-07-19)
      title: 'The Red Tour opens with Ed Sheeran in Omaha',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-red-2", label: "The Red Tour", kind: "tour" },
      snippet:
        "A sold-out opening-night crowd got 17 songs and a surprise duet on 'Everything Has Changed' with opening act Ed Sheeran.",
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Red_Tour',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Taylor_Swift_%26_Ed_Sheeran_on_B-stage_-_Red_Tour_-_Tacoma_-_Cut.jpg/500px-Taylor_Swift_%26_Ed_Sheeran_on_B-stage_-_Red_Tour_-_Tacoma_-_Cut.jpg',
      relatedIds: [
        'moment:vault-red-caught-mid-rehearsal-for-the-red-tour-days-before-it-opened',
        'moment:vault-red-128-costumes-for-the-red-tour-hand-built-in-three-weeks',
        'moment:vault-red-the-red-tour-takes-its-final-bow-in-singapore',
        'moment:vault-red-the-red-tour-closes-as-the-highest-grossing-country-tour-of-',
      ],
      moment: {
        context:
          'Opening night on March 13, 2013 drew 13,800 to Omaha\'s CenturyLink Center — the first of a two-night stand that totaled 27,877 tickets — kicking off a 66-date North American run.\n\nThirteen of the 17 songs came from Red, delivered with a seven-piece band, dancers, pyrotechnics, and more than ten costume changes; the Omaha World-Herald described the crowd\'s "screams, whistles and cheers" melding with the band into "a relentless cacophony." Sheeran, who opened every North American date, came back mid-show to duet "Everything Has Changed" with her on the B-stage during the acoustic segment.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Red_Tour' },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-opens-red-tour-in-omaha-1552195/',
          },
        ],
        // Photo pass (2026-07-19, defining-events-31-50): 6 added, all Wikimedia
        // Commons "The Red Tour" uploads — curl-verified 200 + image/jpeg,
        // downloaded and visually confirmed this session. No freely licensed
        // photo of the actual March 13, 2013 Omaha opener exists on Commons, so
        // these are the tour's other 2013 stops (same costumes/staging, kept as
        // 'archival'/'reference' rather than 'primary' for that reason).
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Taylor_Swift_%26_Ed_Sheeran_on_B-stage_-_Red_Tour_-_Tacoma_-_Cut.jpg/500px-Taylor_Swift_%26_Ed_Sheeran_on_B-stage_-_Red_Tour_-_Tacoma_-_Cut.jpg',
            credit: 'Wikimedia Commons',
            focalPoint: '45% 18%',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Taylor_Swift_-_Red_Tour_06.jpg',
            credit: 'jazills / Wikimedia Commons, CC BY 2.0',
            caption: 'The opening-number look — a black bowler hat and cream lace top — from an April 2013 tour stop.',
            kind: 'archival',
            focalPoint: '46% 28%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Taylor_Swift_-_Red_Tour_13.jpg',
            credit: 'jazills / Wikimedia Commons, CC BY 2.0',
            caption: 'In the black-and-cream ballgown worn for the tour\'s acoustic segment, April 2013.',
            kind: 'archival',
            focalPoint: '48% 30%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Taylor_Swift_-_Red_Tour_15.jpg',
            credit: 'jazills / Wikimedia Commons, CC BY 2.0',
            caption: 'The red-and-white "State of Grace" opening costume, with bassist Amos Heller, April 2013.',
            kind: 'archival',
            focalPoint: '42% 32%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/3/37/Taylor_Swift_-_Red_Tour_19.jpg',
            credit: 'jazills / Wikimedia Commons, CC BY 2.0',
            caption: 'The red sequined ringmaster jacket from the tour\'s circus-themed opening number, April 2013.',
            kind: 'archival',
            focalPoint: '48% 22%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/3/37/Taylor_Swift_-_Red_Tour_09.jpg',
            credit: 'jazills / Wikimedia Commons, CC BY 2.0',
            caption: 'The full circus-costumed ensemble behind her during the ringmaster-jacket opening number, April 2013.',
            kind: 'archival',
            focalPoint: '55% 45%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Taylor_Swift_-_Red_Tour_-_Tacoma_Dome_-_Begin_Again_on_B-stage.jpg',
            credit: 'Selbe Lynn / Wikimedia Commons, CC BY-SA 2.0',
            caption: 'A wide shot of the elevated B-stage catwalk during the acoustic "Begin Again" set, Tacoma Dome, Aug. 31, 2013.',
            kind: 'reference',
            focalPoint: '48% 40%',
          },
        ],
      },
    },
    {
      year: 2013,
      month: 11,
      day: 6,
      category: 'fashion',
      title: 'A wine-red Elie Saab gown for a historic Pinnacle Award',
      snippet: 'A wine-colored Elie Saab gown at the CMAs, the night she became the first woman ever to receive the Pinnacle Award.',
      sourceUrl: 'https://www.refinery29.com/en-us/2013/11/56892/taylor-swift-cma-awards',
      thumbnailUrl: 'https://static3.refinery29.com/bin/entry/218/1155x/1120498/rexusa-1815036m.jpg',
      moment: {
        context:
          'Garth Brooks, who won it in 2005, was the only other artist to have received the Pinnacle Award — which recognizes artists who dominate the industry — before her; she was 23.\n\nThe presentation came with a tribute video of Justin Timberlake, Julia Roberts, Mick Jagger, and Carly Simon applauding her from afar, and she kept the acceptance speech cool and collected, thanking the country legends who presented it. The look was pure era signature: the wine-colored Elie Saab gown, nude Jimmy Choo sandals, and her bold red lip. She also performed an acoustic "Red" alongside Alison Krauss and Vince Gill that night.',
        sources: [
          {
            outlet: 'Refinery29',
            url: 'https://www.refinery29.com/en-us/2013/11/56892/taylor-swift-cma-awards',
          },
        ],
        photos: [
          {
            url: 'https://static3.refinery29.com/bin/entry/218/1155x/1120498/rexusa-1815036m.jpg',
            credit: 'MediaPunch Inc/REX USA',
          },
        ],
        // Shop pass (2026-07-21): the exact 2013 Elie Saab gown is
        // discontinued -- a current Mac Duggal gown, verified in stock,
        // closest real match.
        products: [
          {
            brand: 'Mac Duggal',
            item: 'Burgundy Satin Off-the-Shoulder Twist Evening Ball Gown',
            retailer: 'macduggal.com',
            url: 'https://macduggal.com/products/56188',
            price: '$598.00',
            isAlternative: true,
            altNote: 'Her exact 2013 Elie Saab gown is long discontinued -- this is a current Mac Duggal gown in Wine, the same deep red-wine color family.',
          },
        ],
      },
    },
    {
      year: 2013,
      month: 6,
      day: 5,
      category: 'fashion',
      title: "An ankle-length red dress with a thigh-high slit for 'Red' at the CMTs",
      snippet:
        'A red dress, a red guitar, a red light show — she introduced the title track to CMT viewers at the 2013 CMT Music Awards.',
      sourceUrl: 'https://tasteofcountry.com/taylor-swift-red-cmt-awards/',
      thumbnailUrl: 'https://townsquare.media/site/623/files/2013/06/taylor-swift-1370483022.jpg?w=980&q=75',
      moment: {
        context:
          'The staging telegraphed the song before she sang a note: red lighting, red set pieces, dancers, and flag twirlers filled the stage while she worked a platform running out into the crowd, playing a crimson-colored guitar alongside her lead guitarist. The ankle-length red dress with its thigh-high slit completed the monochrome — a full commit-to-the-bit production for the title track, taking the stage after performances by Hunter Hayes and Luke Bryan.\n\nThe CMT performance doubled as a launch: "Red" was sent to country radio as a single on June 24, 2013, weeks after the show, and went on to peak at No. 2 on Hot Country Songs across a 42-week chart run — at the time her longest-charting single. By that November she\'d reinvented it again, performing an acoustic version at the CMA Awards with Alison Krauss on fiddle and Vince Gill singing harmony.',
        sources: [
          { outlet: 'Taste of Country', url: 'https://tasteofcountry.com/taylor-swift-red-cmt-awards/' },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_song)' },
        ],
        photos: [
          {
            url: 'https://townsquare.media/site/623/files/2013/06/taylor-swift-1370483022.jpg?w=980&q=75',
            credit: 'Jason Merritt/Getty Images',
          },
        ],
        // Shop pass (2026-07-21): the exact 2013 stage dress is undocumented
        // past this description -- a current red thigh-slit dress,
        // verified in stock, closest real match.
        products: [
          {
            brand: 'Showpo',
            item: 'Nitha Maxi Dress (Asymmetrical Frill Thigh Slit)',
            retailer: 'showpo.com',
            url: 'https://www.showpo.com/nitha-asymmetrical-frill-thigh-slit-maxi-dress-in-red.html',
            price: '$30.00',
            isAlternative: true,
            altNote: 'The exact CMT stage dress is undocumented beyond this description -- this is a current red maxi dress with a thigh-high slit in the same monochrome-red spirit.',
          },
        ],
      },
    },

    // --- Fashion/photo depth pass (2026-07-04) ---
    {
      year: 2013,
      month: 2,
      category: 'fashion',
      title: 'The red lip becomes the era-defining signature',
      snippet:
        'A crimson lipstick makeup artist Gucci Westman first put on her in 2009 hardened into a full-blown signature during Red — inseparable from the album\'s visual identity.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-makeup-artist-red-lip-1235648989/',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e8/Taylor_Swift_-_Red.png',
      moment: {
        context:
          'The origin story is specific: prepping a 2009 Allure cover shoot, Westman recalled, "I remember I really wanted to do a red lip on her because I hadn\'t seen her in a red lip before." The resistance came from close to home — "her mom, if I\'m allowed to say this, was like, \'Well, Taylor doesn\'t wear red\'" — but Westman asked to try it anyway, and the shoot went ahead with the crimson lip.\n\nBy the Red era, the bold red lip — paired with winged eyeliner and blunt bangs — had become one of the most recognizable pieces of Swift\'s image, as prominent in press photos as the album\'s title color itself. Looking back years later, with the red lip still turning up everywhere from the Eras Tour to the 2024 Grammys, Westman put it simply: "Look at her now ... That was her first red."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-makeup-artist-red-lip-1235648989/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/e/e8/Taylor_Swift_-_Red.png',
            credit: 'Big Machine Records',
            focalPoint: '48% 40%',
          },
        ],
        // Shop pass (2026-07-21): a makeup look, not a garment -- offering
        // an iconic red lipstick shade rather than forcing a clothing
        // link onto a beauty item.
        products: [
          {
            brand: 'MAC',
            item: 'Retro Matte Lipstick in Ruby Woo',
            retailer: 'maccosmetics.com',
            url: 'https://www.maccosmetics.com/product/13854/52593/products/makeup/lips/lipstick/retro-matte-lipstick',
            price: '$23.00',
            isAlternative: true,
            altNote: 'Westman\'s exact shade for Swift is undocumented -- Ruby Woo is MAC\'s iconic blue-red matte, the same bold-red family this era\'s signature lip belongs to.',
          },
        ],
      },
    },
    {
      year: 2013,
      month: 2,
      day: 10,
      category: 'fashion',
      title: 'A J. Mendel gown and a Heidi braid at the 2013 Grammys',
      snippet:
        'A cream-and-white chiffon J. Mendel gown with silver beaded straps, paired with a loose, disheveled braid — soft and youthful instead of formal Old Hollywood.',
      sourceUrl:
        'https://www.hollywoodreporter.com/music/music-news/grammys-2013-taylor-swift-wears-j-mendel-gown-heidi-hair-poll-420170/',
      thumbnailUrl:
        'https://assets3.cbsnewsstatic.com/hub/i/r/2013/02/10/51455457-a645-11e2-a3f0-029118418759/thumbnail/620x1005/cf494e8cba2e12a4982a8d12d080d3f7/161394430.jpg',
      moment: {
        context:
          'The gown\'s silver straps did the job a statement necklace usually would. She paired it with Jimmy Choo heels and Lorraine Schwartz jewelry, and wore her hair in a loose "Heidi braid" instead of a formal updo — a look outlets at the time noted made the gown feel young and modern rather than pageant-y.\n\nThe finishing touch was a sparkly manicure she applied herself moments before the event, and the night ended with hardware: Best Song Written for Visual Media, for "Safe & Sound" from The Hunger Games.',
        sources: [
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/music/music-news/grammys-2013-taylor-swift-wears-j-mendel-gown-heidi-hair-poll-420170/',
          },
        ],
        // T16 image-fix pass (2026-07-10): the Hollywood Reporter asset had
        // a circular picture-in-picture inset (a close-up of the braid)
        // baked into the file itself, over the main red-carpet shot.
        // Replaced with a single un-composited CBS News photo of the same
        // gown and braid at the 2013 Grammys. Verified HTTP 200 + image/jpeg
        // + subject visually confirmed this session.
        photos: [
          {
            url: 'https://assets3.cbsnewsstatic.com/hub/i/r/2013/02/10/51455457-a645-11e2-a3f0-029118418759/thumbnail/620x1005/cf494e8cba2e12a4982a8d12d080d3f7/161394430.jpg',
            credit: 'CBS News',
            focalPoint: '40% 14%',
          },
        ],
        // Shop pass (2026-07-21): the exact 2013 J. Mendel gown is
        // discontinued -- a current Monique Lhuillier ivory gown, verified
        // in stock, closest real match.
        products: [
          {
            brand: 'Monique Lhuillier',
            item: 'Pearl Strap Ivory A-Line Gown',
            retailer: 'moniquelhuillier.com',
            url: 'https://moniquelhuillier.com/products/pearl-strap-ivory-a-line-gown',
            price: '$3,195.00',
            isAlternative: true,
            altNote: 'Her exact 2013 J. Mendel gown is long discontinued -- this is a current ivory gown in the same cream-and-white register (Jimmy Choo heels, Lorraine Schwartz jewelry not separately sourced).',
          },
        ],
      },
    },
    {
      year: 2012,
      month: 9,
      category: 'fashion',
      title: 'High-waisted shorts become a recurring signature',
      snippet:
        'Sparkling oxfords, Keds, and high-waisted shorts on nearly every red carpet and stage appearance — a 1950s-inflected throughline across the whole era, from the VMAs to the Grammys.',
      sourceUrl: 'https://www.foxnews.com/lifestyle/photos-taylor-swift-and-her-signature-high-waisted-shorts',
      thumbnailUrl: 'https://a57.foxnews.com/static.foxnews.com/foxnews.com/content/uploads/2018/09/1200/1200/shorts08.jpg?ve=1&tl=1',
      moment: {
        context:
          'Documented instances stack up across the whole album cycle: the 2012 MTV VMAs performance of "We Are Never Ever Getting Back Together," the iHeartRadio Music Festival that September, the MTV European Music Awards in November, both coasts\' Jingle Balls that December — KIIS FM in Los Angeles and Z100 at Madison Square Garden — and white high-waisted shorts at the February 2013 Grammys. The silhouette even followed her off duty, turning up in a retro black-and-white swimsuit while paddleboarding in Westerly, Rhode Island.\n\nFashion director Melissa Liebling-Goldberg told Fox News the retro high-waist look was a deliberate throughline: "Taylor Swift is really bringing back the retro look of a high waist." The appeal, she explained, was practical as much as nostalgic — "the trick to making it flattering is finding the right proportion to your torso" — and versatile enough to work "with everything from retro bikinis to flared skirts to short shorts."',
        sources: [
          {
            outlet: 'Fox News',
            url: 'https://www.foxnews.com/lifestyle/photos-taylor-swift-and-her-signature-high-waisted-shorts',
          },
        ],
        // T16 image-fix pass (2026-07-10): the original URL requested Fox's
        // 96x96 thumbnail rendition (3 KB, unusable). Swapped to the same
        // CDN asset's 1200x1200 rendition — same photo, same host, just a
        // usable size. Verified HTTP 200 + image/jpeg + subject visually
        // confirmed this session (Swift on stage in striped top and
        // high-waisted black shorts, arm raised over the crowd).
        photos: [
          {
            url: 'https://a57.foxnews.com/static.foxnews.com/foxnews.com/content/uploads/2018/09/1200/1200/shorts08.jpg?ve=1&tl=1',
            // Face upper-center as she stands above the crowd; keep it framed under a wide crop.
            focalPoint: '48% 30%',
            credit: 'Fox News',
          },
        ],
        // Shop pass (2026-07-21): no single pair was ever named -- a
        // current retro high-waisted denim short, verified in stock, in
        // the same recurring silhouette.
        products: [
          {
            brand: 'GOLDSTITCH',
            item: 'Vintage Denim High-Waisted Jean Shorts',
            retailer: 'amazon.com',
            url: 'https://www.amazon.com/Womens-Juniors-Vintage-Waisted-Shorts/dp/B00KSYPWWO',
            price: '$14.98',
            isAlternative: true,
            altNote: 'No single named pair -- she wore many high-waisted shorts across the era -- this is a current pair in the same retro-inflected silhouette.',
          },
        ],
      },
    },
    {
      year: 2013,
      month: 3,
      day: 13,
      category: 'fashion',
      title: '128 costumes for the Red Tour, hand-built in three weeks',
      snippet:
        "Designer Marina Toybina built more than 125 pieces — 23 custom looks for Swift and over 100 for her dancers — draped, sewn, and hand-finished in just over three weeks to match the tour's choreography and set list.",
      sourceUrl: 'https://www.hollywoodreporter.com/news/general-news/taylor-swifts-costume-designer-talks-612119/',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Taylor_Swift_-_Red_Tour_-_Sparks_Fly_-_Live_in_Los_Angeles.jpg/500px-Taylor_Swift_-_Red_Tour_-_Sparks_Fly_-_Live_in_Los_Angeles.jpg',
      relatedIds: [
        'moment:vault-red-caught-mid-rehearsal-for-the-red-tour-days-before-it-opened',
        'moment:vault-red-the-red-tour-opens-with-ed-sheeran-in-omaha',
        'moment:vault-red-the-red-tour-takes-its-final-bow-in-singapore',
        'moment:vault-red-the-red-tour-closes-as-the-highest-grossing-country-tour-of-',
      ],
      moment: {
        context:
          'Toybina said her direction came from "Taylor\'s songs, as well as our passion, art and individuality," designing each costume to "tell its own story" as an extension of Swift\'s stage presence. The build — 128 pieces total — involved custom draping and handwork finished only after choreography and setlist were locked, then refined through fittings and dress rehearsals in the final days before launch.\n\nThe references ran from old-school Hollywood glamour to dancers performing on stilts, with the white Victorian dress worn during "I Knew You Were Trouble" among the most elaborate single pieces in the show. Toybina named opening night in Omaha as her favorite moment of the whole project — watching three weeks of sketches and fittings "come alive" alongside the full production for the first time.',
        sources: [
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/news/general-news/taylor-swifts-costume-designer-talks-612119/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Taylor_Swift_-_Red_Tour_-_Sparks_Fly_-_Live_in_Los_Angeles.jpg/500px-Taylor_Swift_-_Red_Tour_-_Sparks_Fly_-_Live_in_Los_Angeles.jpg',
            credit: 'Wikimedia Commons',
          },
        ],
        // Shop pass (2026-07-21): the 128 costumes were one-off Toybina
        // originals, never sold -- a current beaded fringe mini, verified
        // in stock, in the same rotating-sparkle spirit.
        products: [
          {
            brand: 'Showpo',
            item: 'Siofra Mini Dress (Zig Zag Fringe Dress)',
            retailer: 'showpo.com',
            // Liveness re-check 2026-07-22: old `/siofra-...html` path now 301s
            // to Showpo's canonical `/us/products/` URL (still the live PDP);
            // stored the canonical target directly so we don't lean on the redirect.
            url: 'https://www.showpo.com/us/products/siofra-beaded-fringe-mini-dress-in-hot-pink',
            price: '$22.00',
            isAlternative: true,
            altNote: 'Toybina\'s 128 costumes were one-off pieces, never sold -- this is a current beaded fringe mini in the same rotating-sparkle spirit as the tour wardrobe.',
          },
        ],
      },
    },
    {
      year: 2013,
      month: 3,
      day: 13,
      category: 'fashion',
      title: "A rhinestone cat-ear headband defines the '22' video look",
      snippet:
        'A thin metal cat-ear headband topped with rhinestones, worn through a girls\'-weekend disco party — one of the most requested and recreated accessories to come out of the Red era.',
      sourceUrl: 'https://k945.com/taylor-swift-22-music-video/',
      thumbnailUrl: 'https://townsquare.media/site/182/files/2013/03/taylorswift22.jpg?w=980&q=75',
      moment: {
        context:
          'Shot by Anthony Mandler at a Malibu beach house with Swift\'s real-life friend group, the video leans into a deliberately care-free, Instagram-filtered vibe — trampolines, a pool, a baking scene, and a sparkly off-the-shoulder disco outfit for the party sequence — a pointed tonal reset after the dark festival-wasteland storyline of "I Knew You Were Trouble" a few months earlier.\n\nThe Urban Outfitters cat-ear headband became one of the most-requested items from the video and is still recreated by fans at Eras Tour "22" sing-alongs — where the song\'s wardrobe iconography got a second life: "22" opens the Red act of the show, and Swift ends it by handing her black hat to a chosen fan in the crowd, one of the tour\'s signature nightly rituals.',
        sources: [
          { outlet: 'K94.5', url: 'https://k945.com/taylor-swift-22-music-video/' },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/22_(Taylor_Swift_song)' },
        ],
        photos: [
          {
            url: 'https://townsquare.media/site/182/files/2013/03/taylorswift22.jpg?w=980&q=75',
            credit: 'YouTube/Big Machine Records',
          },
        ],
        // Shop pass (2026-07-21): the exact Urban Outfitters headband from
        // the video is discontinued -- a current rhinestone cat-ear
        // headband, verified in stock, same accessory.
        products: [
          {
            brand: 'Bnikion',
            item: 'Rhinestone Cat Ears Headband (3-Pack)',
            retailer: 'amazon.com',
            url: 'https://www.amazon.com/Rhinestone-Headbands-Decoration-Headdress-Accessories/dp/B075STRZCY',
            price: '$9.99',
            isAlternative: true,
            altNote: 'The exact Urban Outfitters headband from the video is discontinued -- this is a current rhinestone cat-ear headband, the same accessory fans still recreate.',
          },
        ],
      },
    },

    // --- Fashion/photo depth pass #2 (2026-07-04) ---
    {
      year: 2012,
      month: 11,
      day: 1,
      category: 'fashion',
      title: 'A Jenny Packham lace gown blooms with red at the 2012 CMAs',
      snippet:
        'A nude lace Jenny Packham gown embellished with sparkling red-and-gold rose appliques on the red carpet at the 46th CMA Awards, paired with straightened hair and bangs instead of her usual curls.',
      sourceUrl: 'https://www.hollywoodreporter.com/gallery/cma-2012-arrivals-taylor-swift-385607/',
      thumbnailUrl: 'https://www.hollywoodreporter.com/wp-content/uploads/2012/11/46th_CMA_Awards_12.jpg?w=1500',
      moment: {
        context:
          'Swift was up for Entertainer of the Year, Female Artist of the Year, and Musical Event of the Year (for her Civil Wars collaboration "Safe & Sound") at the Nov. 1, 2012 ceremony, just ten days after Red\'s release.\n\nThe tan lace Jenny Packham gown was embellished with red-and-gold sequin rose shapes, keeping the red carpet look tied to the album\'s namesake color, and she wore her signature bold red lip with straightened hair and blunt bangs.',
        sources: [
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/gallery/cma-2012-arrivals-taylor-swift-385607/',
          },
        ],
        photos: [
          {
            url: 'https://www.hollywoodreporter.com/wp-content/uploads/2012/11/46th_CMA_Awards_12.jpg?w=1500',
            credit: 'Getty Images',
          },
        ],
        // Shop pass (2026-07-21): the exact 2012 gown is discontinued --
        // a current Jenny Packham gown, verified in stock, closest real match.
        products: [
          {
            brand: 'Jenny Packham',
            item: 'Sirocco',
            retailer: 'jennypackham.com',
            url: 'https://www.jennypackham.com/products/sirocco',
            price: '$4,930.00',
            isAlternative: true,
            altNote: 'Her exact 2012 rose-appliqued gown is long discontinued -- this is a current Jenny Packham gown in Bordeaux rather than nude lace, same house.',
          },
        ],
      },
    },
    {
      year: 2013,
      month: 5,
      day: 19,
      category: 'fashion',
      title: 'A Zuhair Murad mini dress and a bright pink lip at the Billboard Music Awards',
      snippet:
        'A long-sleeved blue Zuhair Murad mini dress with sheer side panels — hair pulled into a ponytail to show off the cutouts, makeup built around a dramatic cat eye and an unexpected bright pink lip instead of her usual red.',
      sourceUrl: 'https://hollywoodlife.com/2013/05/19/taylor-swift-billboard-awards-dress-2013-pics/',
      thumbnailUrl: 'https://akns-images.eonline.com/eol_images/Entire_Site/2013420/rs_634x1024-130520071003-634.gomez.swift.ls.52013_copy.jpg',
      moment: {
        context:
          'Worn to the May 19, 2013 Billboard Music Awards at the MGM Grand Garden Arena, the vibrant blue long-sleeve mini by Zuhair Murad had sheer inserts along the sides; she pulled her hair into a ponytail specifically to keep the cutout detail visible, then paired it with strappy metallic Jimmy Choo pumps and Ofira jewelry. The makeup swapped her signature red lip for a bright pink one under a dramatic cat eye — a rare departure from the era\'s usual red-lip formula.\n\nThe dress got plenty of camera time: Swift was the night\'s biggest winner, taking home eight trophies including Top Artist, Top Female Artist, and Top Billboard 200 Album for Red — a haul that made the 2013 Billboard Music Awards one of the single most decorated evenings of the entire era.',
        sources: [
          {
            outlet: 'Hollywood Life',
            url: 'https://hollywoodlife.com/2013/05/19/taylor-swift-billboard-awards-dress-2013-pics/',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/2013_Billboard_Music_Awards' },
        ],
        // T16 image-fix pass (2026-07-10): the HollywoodLife URL was a
        // two-panel "front/back" feature-graphic thumbnail resized to
        // 384x216. Replaced with a single E! News frame of Swift in the
        // same blue Zuhair Murad dress at the event (pictured with Selena
        // Gomez). Verified HTTP 200 + image/jpeg + subject visually
        // confirmed this session.
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2013420/rs_634x1024-130520071003-634.gomez.swift.ls.52013_copy.jpg',
            credit: 'E! News',
            caption:
              'Swift in the blue Zuhair Murad mini at the 2013 Billboard Music Awards, pictured with Selena Gomez.',
          },
        ],
        // Shop pass (2026-07-21): Zuhair Murad has no accessible direct
        // e-commerce -- a current blue long-sleeve sheer-panel mini,
        // verified in stock, closest real match.
        products: [
          {
            brand: 'Princess Polly',
            item: 'Moonrising Long Sleeve Sheer Blouson Mini Dress',
            retailer: 'us.princesspolly.com',
            url: 'https://us.princesspolly.com/products/moonrising-sheer-blouson-dress-blue',
            price: '$79.00',
            isAlternative: true,
            altNote: 'Zuhair Murad has no accessible direct retail -- this is a current blue long-sleeve mini with sheer paneling, same silhouette (Jimmy Choo pumps, Ofira jewelry not separately sourced).',
          },
        ],
      },
    },
    {
      year: 2013,
      month: 8,
      day: 25,
      category: 'fashion',
      title: 'Retro pin curls and a crimson-crystal Hervé Léger gown at the 2013 VMAs',
      snippet:
        'A plunging, crystal-embellished black Hervé Léger by Max Azria gown at the MTV VMAs, styled with retro pin curls, a smokey eye, and a crimson-coated lip and nails for a full vintage-glam look the night she won Best Female Video.',
      sourceUrl: 'https://www.redcarpet-fashionawards.com/2013/08/26/taylor-swift-in-herve-leger-by-max-azria-2013-mtv-video-music-awards-vmas/',
      thumbnailUrl: 'https://akns-images.eonline.com/eol_images/Entire_Site/2013725/rs_634x1024-130825184000-634.tay.cm.82513.jpg',
      moment: {
        context:
          'At the Aug. 25, 2013 MTV VMAs in Brooklyn, where she won the Moon Man for Best Female Video, the plunging, beaded black Hervé Léger gown was paired with statement earrings instead of a necklace so nothing competed with the neckline.\n\nHair and makeup went full "femme-fatale": tight retro pin curls, a smokey eye, and a crimson-coated lip and matching nails — the red-lip signature carried through to the nail polish. Fashion press read the whole package as "major temptress mode" — a vampy, vintage-glam detour from her usual awards-show sweetness, and one of the clearest signals that the era\'s styling had ambitions beyond country-ingenue.',
        sources: [
          {
            outlet: 'Red Carpet Fashion Awards',
            url: 'https://www.redcarpet-fashionawards.com/2013/08/26/taylor-swift-in-herve-leger-by-max-azria-2013-mtv-video-music-awards-vmas/',
          },
        ],
        // T16 image-fix pass (2026-07-10): the redcarpet-fashionawards URL
        // was actually a Herve Leger lookbook product shot of an anonymous
        // model in a plain black dress — not Taylor Swift, not the VMAs.
        // Replaced with an E! News red-carpet photo of Swift herself in the
        // crystal-embellished gown with pin curls at the 2013 VMAs. Verified
        // HTTP 200 + image/jpeg + subject visually confirmed this session.
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2013725/rs_634x1024-130825184000-634.tay.cm.82513.jpg',
            credit: 'E! News',
          },
        ],
        // Shop pass (2026-07-21): the exact 2013 gown is discontinued -- a
        // current Hervé Léger gown, verified in stock, same house and
        // crystal-embellished bandage construction.
        products: [
          {
            brand: 'Hervé Léger',
            item: 'The Reina Gown',
            retailer: 'herveleger.com',
            url: 'https://herveleger.com/products/the-reina-gown-black-001',
            price: '$569.00',
            isAlternative: true,
            altNote: 'Her exact 2013 gown is long discontinued -- this is a current Hervé Léger black gown, same house and crystal-embellished bandage construction.',
          },
        ],
      },
    },
    {
      year: 2013,
      month: 11,
      day: 24,
      category: 'fashion',
      title: 'A gold Julien Macdonald gown, altered with a hidden message',
      snippet:
        "A gold-spangled Julien Macdonald gown at the American Music Awards, tousled bedhead waves instead of a formal updo — pulled straight off the Fall 2013 runway and modified with a sheer mesh panel over the torso cutout.",
      sourceUrl: 'https://mix957gr.com/taylor-swift-dress-2013-american-music-awards-red-carpet-photos/',
      thumbnailUrl: 'https://townsquare.media/site/252/files/2013/11/taylor-swift5.jpg?w=980&q=75',
      moment: {
        context:
          'At the Nov. 24, 2013 American Music Awards, where she won four trophies including Artist of the Year, Swift wore a gold-spangled Julien Macdonald gown taken from his Fall 2013 runway collection. Her team altered the runway piece by adding a sheer mesh panel across the triangular torso cutout, paired with strappy metallic sandals and loose, tousled waves rather than a sleek updo.\n\nThe four wins made her the night\'s biggest winner: Artist of the Year plus Favorite Pop/Rock Female Artist, Favorite Country Female Artist, and Favorite Country Album for Red — a sweep across both genre lanes that captured exactly where the album sat, claiming country trophies and pop ones on the same night. She also took a turn as presenter, handing Favorite Pop/Rock Male Artist to Justin Timberlake.',
        sources: [
          {
            outlet: 'Mix 95.7',
            url: 'https://mix957gr.com/taylor-swift-dress-2013-american-music-awards-red-carpet-photos/',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/American_Music_Awards_of_2013' },
        ],
        photos: [
          {
            url: 'https://townsquare.media/site/252/files/2013/11/taylor-swift5.jpg?w=980&q=75',
            credit: 'Jason Kempin/Getty Images',
          },
          {
            url: 'https://townsquare.media/site/252/files/2013/11/taylor-swift-11.jpg?w=980&q=75',
            credit: 'Jason Kempin/Getty Images',
          },
        ],
        // Shop pass (2026-07-21): the exact 2013 runway-altered gown is
        // discontinued -- a current gold beaded gown, verified in stock,
        // closest real match.
        products: [
          {
            brand: 'Windsor',
            item: 'Nicki Beaded Fringe Mermaid Formal Dress',
            retailer: 'windsorstore.com',
            url: 'https://www.windsorstore.com/products/nicki-beaded-fringe-mermaid-formal-dress-05002001093625',
            price: '$99.90',
            isAlternative: true,
            altNote: 'Her exact altered runway gown is one-of-a-kind and long gone -- this is a current gold beaded gown in the same spangled-gold spirit.',
          },
        ],
      },
    },
    {
      year: 2014,
      month: 1,
      day: 26,
      category: 'fashion',
      title: 'A crystal-mesh Gucci Première gown for the 2014 Grammys',
      snippet:
        'A gold lamé, short-sleeve Gucci Première gown with a crystal mesh overlay and crystal gemstone detail at the neckline, arms, and waist — a rare designer-runway red carpet moment mid-Red-era.',
      sourceUrl: 'https://www.redcarpet-fashionawards.com/2014/01/27/taylor-swift-gucci-premiere-2014-grammy-awards/',
      thumbnailUrl:
        'https://akns-images.eonline.com/eol_images/Entire_Site/2014026/rs_634x1024-140126164619-634-taylor-swift-grammy.ls.12614_copy_2.jpg',
      moment: {
        context:
          'Worn to the Jan. 26, 2014 Grammy Awards at the Staples Center, the fitted Gucci Première gown was built from gold lamé under a crystal mesh overlay, with crystal gemstone detailing at the neckline, arms, and waist. On the red carpet Swift herself compared the armored, glittering effect to "chainmail," and she styled it with a side-parted ponytail and a pink lip to soften all that sparkle.\n\nShe paired it with Jimmy Choo heels and clutch and Lorraine Schwartz jewelry — one of the more directly high-fashion, runway-driven looks of the era, ahead of the pop pivot into 1989. Fashion critics filed it under glamorous-sparkle comfort zone — "expected" rather than experimental, but "still lovely" — on a night she attended as a four-time nominee.',
        sources: [
          {
            outlet: 'Red Carpet Fashion Awards',
            url: 'https://www.redcarpet-fashionawards.com/2014/01/27/taylor-swift-gucci-premiere-2014-grammy-awards/',
          },
        ],
        // T16 image-fix pass (2026-07-10): the redcarpet-fashionawards URL
        // was a side-by-side collage (a lookbook comparison panel pasted
        // next to the real red-carpet shot) with an "RCFA" watermark.
        // Replaced with a single, un-composited E! News photo of Swift
        // alone on the 2014 Grammys red carpet in the gown. Verified HTTP
        // 200 + image/jpeg + subject visually confirmed this session.
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2014026/rs_634x1024-140126164619-634-taylor-swift-grammy.ls.12614_copy_2.jpg',
            // Full-length red-carpet shot; face sits high in this tall portrait.
            focalPoint: '48% 13%',
            credit: 'E! News',
          },
        ],
        // Shop pass (2026-07-21): the exact Gucci Première gown is
        // discontinued -- a current gold sequin gown, verified in stock,
        // closest real match.
        products: [
          {
            brand: 'Monique Lhuillier',
            item: 'Gold Sequin Scoop Neck Gown',
            retailer: 'moniquelhuillier.com',
            url: 'https://moniquelhuillier.com/products/gold-sequin-scoop-neck-gown',
            price: '$5,495.00',
            isAlternative: true,
            altNote: 'Her exact Gucci Première gown is long discontinued -- this is a current gold sequin gown in the same "chainmail" glittering spirit (Jimmy Choo heels, Lorraine Schwartz jewelry not separately sourced).',
          },
        ],
      },
    },
    {
      year: 2014,
      month: 8,
      day: 24,
      category: 'fashion',
      title: 'A Mary Katrantzou romper signals the turn toward 1989',
      snippet:
        "A powder-blue, alphabet-printed Mary Katrantzou romper at the 2014 VMAs — paired with a blunt bob and a bolder, more pop-leaning silhouette that fans and critics read as the first visible sign of the shift toward 1989.",
      sourceUrl: 'https://www.redcarpet-fashionawards.com/2014/08/25/taylor-swift-mary-katrantzou-2014-mtv-video-music-awards-vma/',
      thumbnailUrl:
        'https://akns-images.eonline.com/eol_images/Entire_Site/2014724/rs_634x1024-140824172545-634-taylor-swift-mtv-vma.ls.82414.jpg',
      moment: {
        context:
          'At the Aug. 24, 2014 MTV VMAs at The Forum in Inglewood, Swift wore a long-sleeve, high-cut powder-blue romper from Mary Katrantzou\'s Resort 2015 collection, printed with an abstract alphabet motif, paired with maroon peep-toe Elie Saab booties and Lorraine Schwartz jewelry.\n\nStyled with the blunt bob she debuted earlier that year, the polarizing, fashion-forward look came six days after the Aug. 18, 2014 announcement of 1989 — the same night she performed "Shake It Off" — and about two months before the album\'s Oct. 27 release, an early red-carpet statement of the coming pop era.',
        sources: [
          {
            outlet: 'Red Carpet Fashion Awards',
            url: 'https://www.redcarpet-fashionawards.com/2014/08/25/taylor-swift-mary-katrantzou-2014-mtv-video-music-awards-vma/',
          },
        ],
        // T16 image-fix pass (2026-07-10): the redcarpet-fashionawards URL
        // was a side-by-side comparison graphic — an anonymous lookbook
        // model on the left, Taylor on the right — with a text overlay and
        // an "RCFA" watermark. Replaced with a single E! News photo of
        // Swift alone on the 2014 VMAs red carpet in the romper. Verified
        // HTTP 200 + image/jpeg + subject visually confirmed this session.
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2014724/rs_634x1024-140824172545-634-taylor-swift-mtv-vma.ls.82414.jpg',
            credit: 'E! News',
          },
        ],
        // Shop pass (2026-07-21): the exact Mary Katrantzou Resort 2015
        // romper is discontinued -- a current printed long-sleeve romper,
        // verified in stock, closest real match.
        products: [
          {
            brand: 'Plush Fashion Hub',
            item: 'Cutout Front Printed Long Sleeve Romper',
            retailer: 'plushfashionhub.us',
            url: 'https://plushfashionhub.us/products/cutout-front-printed-long-sleeve-romper',
            price: '$52.99',
            isAlternative: true,
            altNote: 'Her Mary Katrantzou romper is discontinued -- a current printed long-sleeve romper, same silhouette (Elie Saab booties, Lorraine Schwartz jewelry not separately sourced).',
          },
        ],
      },
    },

    // --- Sightings pass (2026-07-05) ---
    {
      year: 2012,
      month: 12,
      day: 2,
      category: 'sighting',
      title: "A Central Park stroll confirms she's dating Harry Styles",
      snippet:
        'Photographed walking through Central Park with Harry Styles on December 2, 2012 — the first public sighting of the two together, joined by his stylist Lou Teasdale.',
      sourceUrl: 'http://www.justjared.com/2012/12/02/taylor-swift-harry-styles-central-park-stroll/',
      thumbnailUrl: 'https://imgix.bustle.com/uploads/getty/2023/10/26/4391b9c6-1852-4f20-a292-5dd1acba75cf-getty-474684387.jpg?w=800',
      moment: {
        context:
          "Photographers caught the pair on a Sunday walk through Central Park in New York City, weeks after they were first linked — a route that took them through the Central Park Zoo, with fans posting their own sightings in real time. They weren't alone: Styles' stylist Lou Teasdale came along with her fiancé Tom and their baby daughter Lux in a stroller, making the whole outing look less like a photo op and more like a family Sunday.\n\nAn eyewitness told E! News, \"Harry and Taylor were walking next to each other. They seemed happy to be together, talking and smiling.\" The outing became the first widely circulated set of photos confirming the relationship — following earlier sightings of Styles at her X Factor rehearsals — and kicked off two months of tabloid coverage that ran through their British Virgin Islands breakup in January.",
        sources: [
          {
            outlet: 'Just Jared',
            url: 'http://www.justjared.com/2012/12/02/taylor-swift-harry-styles-central-park-stroll/',
          },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/367789/taylor-swift-and-one-direction-s-harry-styles-spotted-together-at-central-park-zoo',
          },
        ],
        // T16 image-fix pass (2026-07-10): the Just Jared frame had a
        // "JUST JARED" watermark and a neon-yellow border. Replaced with a
        // real Getty Images (GC Images) photo of the same December 2012
        // Central Park walk, hosted on Bustle's image CDN — the identical
        // photo already used as an archival reference on the BVI breakup
        // moment elsewhere in this file. Verified HTTP 200 + image/jpeg +
        // subject visually confirmed this session (Swift's burgundy coat and
        // yellow scarf, Styles' olive bomber and black beanie, fall foliage).
        photos: [
          {
            url: 'https://imgix.bustle.com/uploads/getty/2023/10/26/4391b9c6-1852-4f20-a292-5dd1acba75cf-getty-474684387.jpg?w=800',
            credit: 'GC Images / Getty Images, via Bustle',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2012,
      month: 12,
      day: 13,
      category: 'sighting',
      title: 'A birthday minibreak to the Lake District, spotted feeding doves and shopping for Beatrix Potter gifts',
      snippet:
        'Spotted with Harry Styles in Bowness-on-Windermere on December 10, 2012 — sightseeing, feeding white doves in the town square, and shopping at the Beatrix Potter store and a local jewelry shop.',
      sourceUrl: 'https://www.hellomagazine.com/celebrities/2012121310465/taylor-swift-harry-lake-district/',
      thumbnailUrl: 'https://images.hellomagazine.com/horizon/original_aspect_ratio/ea807ef4c932-bowness-z.jpg',
      moment: {
        context:
          'The pair spent about five hours in the Lake District village of Bowness on December 10, 2012 — ahead of Swift\'s 23rd birthday on December 13 — and days after their relationship went public, with Styles reportedly bringing his parents along for the trip. The itinerary was pure tourist: feeding the white doves in the town square, browsing Beatrix Potter World, and wandering in and out of local shops.\n\nPandora jewelry shop manager Claire Dibbs, who met them when they wandered in, recalled: "They were just walking past and one of my colleagues saw them. I was hyperventilating." She said Swift "introduced herself, she was really lovely" and told her she loved the area. The visit came days after an earlier stop in Sheffield that same week.',
        sources: [
          {
            outlet: 'HELLO!',
            url: 'https://www.hellomagazine.com/celebrities/2012121310465/taylor-swift-harry-lake-district/',
          },
        ],
        // T16 image-fix pass (2026-07-10): the prior URL was actually a
        // photo from the earlier December 2, 2012 Central Park stroll (same
        // outfits, urban NYC park) mislabeled as the Lake District trip — no
        // village, lake, doves, or shops in frame. No paparazzi photo of the
        // couple in Bowness could be verified this session, so this ships a
        // real HELLO! photo of Bowness-on-Windermere itself (the visit's
        // actual location, from HELLO!'s own coverage of the trip) as kind
        // 'reference', with a caption that says outright it does not show
        // Swift or Styles. Verified HTTP 200 + image/jpeg this session.
        photos: [
          {
            url: 'https://images.hellomagazine.com/horizon/original_aspect_ratio/ea807ef4c932-bowness-z.jpg',
            credit: 'HELLO!',
            caption:
              'Bowness-on-Windermere, the Lake District village where the visit took place — not a photo of Swift or Styles, who could not be verified in any available frame from the trip.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      year: 2013,
      month: 1,
      day: 3,
      category: 'sighting',
      title: 'A Virgin Islands getaway, spotted at dinner at CocoMaya',
      snippet:
        "Days after the Times Square kiss, fans spotted Swift and Styles having dinner and drinks at the beachfront restaurant CocoMaya on Virgin Gorda on January 3, 2013 — a trip Us Weekly reported was a surprise for her.",
      sourceUrl: 'https://hollywoodlife.com/2013/01/04/harry-styles-taylor-swift-virgin-islands-vacation-gorda/',
      thumbnailUrl: 'https://imgix.bustle.com/uploads/getty/2023/10/26/4391b9c6-1852-4f20-a292-5dd1acba75cf-getty-474684387.jpg?w=800',
      moment: {
        context:
          "The pair were photographed at CocoMaya, a beach restaurant on Virgin Gorda in the British Virgin Islands, the day after arriving on the island. Fans at the restaurant posted photos of the two at dinner and drinks — the kind of low-key sighting that had defined the whole two-month relationship, from Central Park to the Lake District.\n\nThe vacation ended abruptly: reports at the time described a blowout fight, and Swift flew home alone on January 4. E! News reported she was photographed that day leaving U.S. Customs in St. Johns with her bodyguards — five bags in tow — boarding a boat by herself, with a source saying she \"looked a bit sad and not very happy.\" One frame from that departure, sitting alone on the back of the boat in a blue dress, became the breakup's defining image — one she'd reference a decade later in \"Is It Over Now?\"",
        sources: [
          {
            outlet: 'HollywoodLife',
            url: 'https://hollywoodlife.com/2013/01/04/harry-styles-taylor-swift-virgin-islands-vacation-gorda/',
          },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/376598/taylor-swift-spotted-on-boat-without-harry-styles-amid-breakup-reports',
          },
        ],
        // T16 image-fix pass (2026-07-10): the HollywoodLife URL was a
        // two-panel vertical collage of blurry fan snapshots (Styles with
        // fans on top, Swift with fans on bottom) — the two never appear
        // together in it, and no clean single photo of the CocoMaya dinner
        // itself could be verified this session. Shipping the same real
        // Getty (GC Images) photo of the couple from weeks earlier in New
        // York used elsewhere in this file, as kind 'reference', with a
        // caption disclosing it predates the Virgin Gorda trip. Verified
        // HTTP 200 + image/jpeg this session.
        photos: [
          {
            url: 'https://imgix.bustle.com/uploads/getty/2023/10/26/4391b9c6-1852-4f20-a292-5dd1acba75cf-getty-474684387.jpg?w=800',
            credit: 'GC Images / Getty Images, via Bustle',
            caption:
              'Swift and Styles in New York in December 2012, weeks before this trip — no verified photo of the CocoMaya dinner itself exists beyond a low-quality fan-photo collage.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      year: 2013,
      month: 2,
      day: 21,
      category: 'sighting',
      title: 'A late-night out with singer-songwriter Tom Odell after the BRITs',
      snippet:
        "Spotted leaving a London pub with fellow musician Tom Odell on February 21, 2013 — the night after both attended the BRIT Awards, where Odell won Critics' Choice — before the pair headed to the Groucho Club together.",
      sourceUrl: 'https://www.eonline.com/news/390649/taylor-swift-goes-out-with-british-singer-tom-odell-in-london',
      thumbnailUrl: 'https://akns-images.eonline.com/eol_images/Entire_Site/2013121/634.SwiftOdell.ms.022113_copy.jpg',
      moment: {
        context:
          "Photographers caught Swift leaving a pub with Odell in London the Thursday after the BRIT Awards, where Odell had won the Critics' Choice Award. The pair then went on to the Groucho Club, a members' club in Soho. Swift had been in London earlier that day leaving a radio station appearance, and E! noted the two had been spotted \"getting flirty\" backstage at the BRITs the night before.\n\nThe awards show itself had been a full Swift production: she performed \"We Are Never Ever Getting Back Together\" in an old-fashioned white wedding dress, removed mid-song to reveal black hot pants and a lacy halter top, lost Best International Female Solo Artist to Lana Del Rey, then danced through the after-party alongside Frank Ocean, Carey Mulligan, Marcus Mumford, and Ellie Goulding. The Odell outing fueled brief dating speculation, though nothing came of it publicly beyond the one night out.",
        sources: [
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/390649/taylor-swift-goes-out-with-british-singer-tom-odell-in-london',
          },
          {
            outlet: 'Just Jared',
            url: 'https://www.justjared.com/photo-gallery/2816649/taylor-swift-london-night-out-with-tom-odell-01/',
          },
        ],
        // T16 image-fix pass (2026-07-10): the Just Jared frame was
        // watermarked and, worse, didn't actually show Odell in the shot —
        // just Swift and a security escort. Replaced with an E! News frame
        // from the same night showing both Swift and Odell leaving the pub
        // doorway together, unwatermarked. Verified HTTP 200 + image/jpeg +
        // subject visually confirmed this session.
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2013121/634.SwiftOdell.ms.022113_copy.jpg',
            credit: 'E! News',
          },
        ],
      },
    },
    {
      year: 2013,
      month: 3,
      day: 11,
      category: 'sighting',
      title: 'Caught mid-rehearsal for the Red Tour, days before it opened',
      snippet:
        "Photographed rehearsing in all-black practice clothes with her hair in a messy ponytail, mid-choreography, just two days before the Red Tour's March 13, 2013 opening night in Omaha.",
      sourceUrl: 'https://popcrush.com/taylor-swift-red-tour-rehearsal-pics/',
      thumbnailUrl: 'https://townsquare.media/site/252/files/2013/03/Taylor-Swift-1.jpg?w=980&q=75',
      relatedIds: [
        'moment:vault-red-the-red-tour-opens-with-ed-sheeran-in-omaha',
        'moment:vault-red-128-costumes-for-the-red-tour-hand-built-in-three-weeks',
        'moment:vault-red-the-red-tour-takes-its-final-bow-in-singapore',
        'moment:vault-red-the-red-tour-closes-as-the-highest-grossing-country-tour-of-',
      ],
      moment: {
        context:
          "Photos published March 11, 2013 showed Swift running through choreography in practice gear ahead of the tour's opening week, caught mid-movement with one hand raised as though playing to an imaginary crowd — a rare glimpse of the unglamorous rehearsal process behind the tour's eventual 128-costume, arena-scale production.\n\nThe experimentation was the point. Talking about the show she was building, Swift emphasized \"the element of surprise, and incorporating the unexpected\" — the goal being a concert that let the audience escape for the evening rather than a note-for-note album recital. Two days later in Omaha, the surprises started delivering, from mid-show costume reveals to the B-stage duet with Ed Sheeran.",
        sources: [{ outlet: 'PopCrush', url: 'https://popcrush.com/taylor-swift-red-tour-rehearsal-pics/' }],
        photos: [
          {
            url: 'https://townsquare.media/site/252/files/2013/03/Taylor-Swift-1.jpg?w=980&q=75',
            credit: 'TSA / Getty Images',
          },
          {
            // Karen #877 fix (2026-07-19): q=75 render was 7.9KB and flagged as a
            // likely placeholder; same 980px render at q=100 verified + viewed.
            url: 'https://townsquare.media/site/252/files/2013/03/Taylor-Swift-2.jpg?w=980&q=100',
            credit: 'TSA / Getty Images',
          },
        ],
      },
    },

    // --- Business/chart + music + sightings depth pass (2026-07-05) ---
    {
      significance: 'notable', // her first-ever Hot 100 #1, the chart record that opened the era's whole commercial run (docs/decisions.md, 2026-07-19)
      year: 2012,
      month: 8,
      day: 22,
      category: 'business',
      title: "'We Are Never Ever Getting Back Together' becomes her first-ever Hot 100 No. 1",
      snippet:
        "Red's lead single leapt from No. 72 to No. 1 in a single week — her first career Hot 100 chart-topper on her 46th entry, after 'You Belong With Me' and 'Today Was a Fairytale' had both stalled at No. 2.",
      sourceUrl: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-new-single-number-1-364803/',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/4/40/We_Are_Never_Ever_Getting_Back_Together.png',
      moment: {
        context:
          "The song sold 623,000 downloads in its first week — the highest one-week digital sales total ever by a female artist at the time, and second all-time behind only Flo Rida's \"Right Round.\" It entered the Hot 100 Airplay chart at No. 25 before jumping to No. 14 the next week on a 29% surge in radio audience. The single led the rollout for Red's October 22 release, arriving as Swift's first Hot 100 No. 1 after two previous singles had each peaked at No. 2.\n\nThe song itself was written almost by accident: a friend of an ex dropped by the studio while Swift was working with Max Martin and Shellback and mentioned rumors the couple were reconciling — after the friend left, Swift picked up an acoustic guitar, improvised the refrain on the spot, and the three finished the song in about 25 minutes. It went on to spend three non-consecutive weeks at No. 1 and pick up a Record of the Year nomination at the Grammys — even as country radio kept it out of the Country Airplay top ten, an early flashpoint in the was-she-still-country debate that shadowed the whole album.",
        sources: [
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-new-single-number-1-364803/',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/We_Are_Never_Ever_Getting_Back_Together' },
        ],
        // Photo-enrichment pass (2026-07-18, #762): single cover viewed — face sits top-left,
        // so the focal point pulls up-left. Added the 2013 Grammys ringmaster performance of
        // this song (the ceremony where it was up for Record of the Year, per context above);
        // PopCrush's own article image, curl-verified 200 + image/webp, vision-confirmed.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/4/40/We_Are_Never_Ever_Getting_Back_Together.png',
            credit: 'Big Machine Records',
            focalPoint: '30% 20%',
          },
          {
            url: 'https://townsquare.media/site/252/files/2013/02/TaylorSwift1.jpg?w=980&q=75',
            credit: 'Getty Images / PopCrush',
            focalPoint: '45% 28%',
          },
        ],
      },
    },
    {
      significance: 'notable', // a genuine, outright genre-tour gross record when it closed (docs/decisions.md, 2026-07-19)
      year: 2014,
      month: 7,
      day: 3,
      category: 'business',
      title: 'The Red Tour closes as the highest-grossing country tour of all time',
      snippet:
        '86 shows across 12 countries sold 1.7 million tickets and grossed $150,184,971 — surpassing the $141 million record set by Tim McGraw and Faith Hill\'s Soul2Soul tour.',
      sourceUrl: 'https://billboard.com/articles/news/6150193/taylor-swift-red-all-time-country-tour',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Taylor_Swift_Red_Tour_2013.jpg/500px-Taylor_Swift_Red_Tour_2013.jpg',
      relatedIds: [
        'moment:vault-red-caught-mid-rehearsal-for-the-red-tour-days-before-it-opened',
        'moment:vault-red-the-red-tour-opens-with-ed-sheeran-in-omaha',
        'moment:vault-red-128-costumes-for-the-red-tour-hand-built-in-three-weeks',
        'moment:vault-red-the-red-tour-takes-its-final-bow-in-singapore',
      ],
      moment: {
        context:
          'Final box office figures put the tour at $150,184,971 in gross revenue from 1,702,933 sold tickets across 86 shows in 12 countries over a 15-month run from its March 13, 2013 Omaha opener to its June 12, 2014 close in Singapore.\n\nThat total broke the prior country-touring record of $141 million held by Tim McGraw and Faith Hill\'s Soul2Soul tour (2006-2007). The single best-performing stop was a two-night stand at Gillette Stadium in Foxborough, Massachusetts, which drew 110,712 fans and $9.4 million in ticket sales; London\'s O2 Arena led the arena dates with $5.8 million from 74,740 tickets across five shows.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://billboard.com/articles/news/6150193/taylor-swift-red-all-time-country-tour',
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added a shot from the closing Singapore
        // stand itself (Singapore Indoor Stadium, June 2014 — the tour's final city, per
        // context above). Commons CC BY-SA 4.0, curl-verified 200 + image/jpeg, vision-
        // confirmed. The other Singapore file in this Commons set already illustrates the
        // red-tour-asia-finale page, so this page takes the distinct "Mean" frame.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Taylor_Swift_Red_Tour_2013.jpg/500px-Taylor_Swift_Red_Tour_2013.jpg',
            credit: 'Jana Zills / Wikimedia Commons',
            focalPoint: '45% 28%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Taylor_Swift_-_RED_Tour_-_Singapore_-_Mean_%28night_1%29.jpg',
            credit: 'Weslam123 / Wikimedia Commons (CC BY-SA 4.0)',
            focalPoint: '42% 12%',
          },
        ],
      },
    },
    {
      significance: 'notable', // a real, well-documented snub that became part of the album's own underdog narrative (docs/decisions.md, 2026-07-19)
      relatedIds: ['moment:vault-red-all-too-well-gets-its-first-tv-performance-alone-at-a-piano-'],
      year: 2014,
      month: 1,
      day: 26,
      category: 'business',
      title: 'Red goes into the Grammys with two nominations — and leaves with neither',
      snippet:
        'Album of the Year and Best Country Album nods at the January 26, 2014 ceremony — losing Album of the Year to Daft Punk\'s Random Access Memories and Best Country Album to Kacey Musgraves\' debut, Same Trailer Different Park.',
      sourceUrl: 'https://en.wikipedia.org/wiki/56th_Annual_Grammy_Awards',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e8/Taylor_Swift_-_Red.png',
      moment: {
        context:
          'At the 56th Annual Grammy Awards, Red was one of five Album of the Year nominees alongside Sara Bareilles\' The Blessed Unrest, Kendrick Lamar\'s Good Kid, M.A.A.D City, and Macklemore & Ryan Lewis\' The Heist — the trophy went to Daft Punk\'s Random Access Memories.\n\nIn Best Country Album, Red competed against Jason Aldean\'s Night Train, Tim McGraw\'s Two Lanes of Freedom, and Blake Shelton\'s Based on a True Story..., with Kacey Musgraves\' debut Same Trailer Different Park taking the win. It was Swift\'s second Album of the Year nomination (after Fearless won in 2010) and a rare winless Grammy night.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/56th_Annual_Grammy_Awards' }],
        // Photo-enrichment audit (2026-07-18, #762): stays at one image. The only reachable
        // outlet-CDN frames of her at the 56th Grammys are the same Getty head-thrown-back
        // piano shot already on red-all-too-well-grammys-2014 (The Boot and PopCrush both ran
        // that identical frame; townsquare's k945 red-carpet gallery image is a dead "no
        // longer available" placeholder — verified by download this run), and Commons has no
        // 2014-Grammys files of her. Cover art viewed: profile fills the upper half, so the
        // focal point sits at 50% 32%.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/e/e8/Taylor_Swift_-_Red.png',
            credit: 'Big Machine Records',
            focalPoint: '50% 32%',
          },
          // Photo pass 2026-07-19 (Tier 3): re-challenged — real photos of
          // the two artists who beat Red in each category this item names.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Daft_Punk_in_2013_2-_centered.jpg',
            focalPoint: '50% 26%',
            credit: 'Sony Music Entertainment, Wikimedia Commons (CC BY 4.0)',
            caption: 'Daft Punk, whose Random Access Memories won Album of the Year over Red that night.',
            kind: 'reference',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/3/37/KaceyMRoundhouse140524_%289%29_%2853727111656%29_%28cropped%29.jpg',
            focalPoint: '43% 31%',
            credit: 'Raph_PH, Wikimedia Commons (CC BY 2.0)',
            caption: 'Kacey Musgraves, whose debut Same Trailer Different Park won Best Country Album over Red.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      year: 2012,
      month: 10,
      day: 16,
      category: 'music',
      title: 'State of Grace opens Red with her first arena-rock swing',
      snippet:
        'A "howling, U2-style epic with reverb-drenched guitars," per Rolling Stone — Taylor\'s own description was simpler: "This sounds like the feeling of falling in love in an epic way."',
      sourceUrl: 'https://www.songfacts.com/facts/taylor-swift/state-of-grace',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/8/8a/Taylor_Swift_-_State_of_Grace.png',
      moment: {
        context:
          'Previewing the song on Good Morning America, Swift explained: "I wrote this song about when you first fall in love with someone. The possibilities. Kind of thinking about the different ways that it could go."\n\nOn the sound she added: "It\'s a really big sound. To me, this sounds like the feeling of falling in love in an epic way" — a deliberate departure into arena rock that opens the album before its country roots resurface. A stripped-down acoustic version included on the Target-exclusive edition was, in her words, "really acoustic and like emotional and sweet."',
        sources: [{ outlet: 'Songfacts', url: 'https://www.songfacts.com/facts/taylor-swift/state-of-grace' }],
        // Real-photo pass (2026-07-09): promotional single cover from Wikipedia's
        // stable upload.wikimedia.org copy. Verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/8a/Taylor_Swift_-_State_of_Grace.png',
            credit: 'Big Machine Records',
            caption: 'Promotional single cover for "State of Grace," released ahead of the album in October 2012.',
            kind: 'primary',
          },
        ],
      },
    },

    // --- Active-tier batch 2 (2026-07-04), per docs/decisions.md.
    {
      year: 2012,
      month: 10,
      day: 22,
      category: 'music',
      title: 'The Last Time turns an on-again-off-again relationship into a two-voice duet',
      snippet:
        'A duet with Snow Patrol\'s Gary Lightbody, born from a relationship where "you never know when he\'s going to leave... but he always does come back" — Ed Sheeran made the introduction.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Last_Time_(Taylor_Swift_song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/8/8d/Taylor_Swift_-_The_Last_Time_%28feat._Gary_Lightbody%29_%28Official_Single_Cover%29.png',
      moment: {
        context:
          'Swift told NPR the song was inspired by an unreliable partner: "You never know when he\'s going to leave, you never know when he\'s going to come back, but he always does come back."\n\nShe described picturing a boyfriend on his knees outside a door, promising "this is the last time," while his girlfriend waits inside, torn on whether to let him back in: "It\'s a really fragile emotion you\'re dealing with when you want to love someone, but you don\'t know if it\'s smart to." The collaboration came together after her friend Ed Sheeran introduced her to Lightbody in spring 2012; the track was produced by Jacknife Lee, known for his work with Snow Patrol and U2.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Last_Time_(Taylor_Swift_song)' },
          { outlet: 'NPR', url: 'https://www.npr.org/2012/11/03/164186569/taylor-swift-my-confidence-is-easy-to-shake' },
        ],
        // Real-photo pass (2026-07-09): official single cover from Wikipedia's
        // stable upload.wikimedia.org copy. Verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/8d/Taylor_Swift_-_The_Last_Time_%28feat._Gary_Lightbody%29_%28Official_Single_Cover%29.png',
            credit: 'Big Machine Records',
            caption: 'Official single cover for "The Last Time" featuring Gary Lightbody of Snow Patrol.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2012,
      month: 12,
      day: 31,
      category: 'relationship',
      significance: 'notable', // one of the most-photographed paparazzi moments of the era, widely credited with inspiring several Red-adjacent and 1989 songs (docs/decisions.md, 2026-07-19)
      title: "A New Year's Eve kiss with Harry Styles in Times Square",
      snippet: 'Caught on camera by a reveler as the ball dropped — the clearest public confirmation of a relationship that had started weeks earlier.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-rocks-times-square-kisses-harry-styles-on-new-years-eve-watch-1481640/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/stylus/2673339-taylor-swift-nye-2013-617-409.jpg',
      moment: {
        context:
          'Swift took the Times Square stage at 11:39 p.m. on December 31, 2012, performing "I Knew You Were Trouble" and "We Are Never Ever Getting Back Together" for Dick Clark\'s New Year\'s Rockin\' Eve, then was seen in Styles\' arms as the clock struck midnight.\n\nStyles had started the evening at Jay-Z and Coldplay\'s Barclays Center show in Brooklyn before leaving to catch her set. The kiss was caught by fans in the crowd, and by January 1 the photos were all over the gossip blogs.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-rocks-times-square-kisses-harry-styles-on-new-years-eve-watch-1481640/',
          },
          { outlet: 'Entertainment Tonight', url: 'https://www.etonline.com/news/128673_Taylor_Swift_Harry_Styles_New_Years_Eve_Kiss' },
        ],
        // T16 image-fix pass (2026-07-10): every available frame of the
        // actual kiss (Just Jared's set, an E! News crop) is heavily
        // motion-blurred and/or carries a watermark or picture-in-picture
        // inset — no clean, clearly-identifiable frame of the kiss itself
        // could be verified this session. Shipping instead a sharp,
        // un-watermarked Billboard photo of Swift performing in Times
        // Square earlier that same New Year's Eve, as kind 'reference',
        // with a caption that says outright it is not the kiss photo.
        // Verified HTTP 200 + image/jpeg this session.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/stylus/2673339-taylor-swift-nye-2013-617-409.jpg',
            credit: 'Billboard',
            caption:
              'Swift performing in Times Square earlier on New Year\'s Eve 2012 — not the midnight kiss photo itself, which exists only as blurred/watermarked paparazzi frames.',
            kind: 'reference',
            // Mid-performance, red sequins; her singing face is high-center of the frame.
            focalPoint: '48% 28%',
          },
        ],
      },
    },
    {
      year: 2013,
      month: 1,
      day: 4,
      category: 'relationship',
      title: 'A British Virgin Islands trip ends the relationship',
      snippet: 'A vacation together turned into a breakup, and a photo of her alone on the back of a boat went viral in its aftermath.',
      sourceUrl: 'https://www.today.com/popculture/taylor-swift-harry-styles-relationship-timeline-rcna122164',
      thumbnailUrl: null,
      moment: {
        context:
          'The getaway in early January 2013 ended the relationship instead of cementing it: the two reportedly split after a heated argument, and Swift left the islands early — Styles stayed on, socializing with Richard Branson — while the image of her riding alone on the back of a boat became the breakup\'s unofficial portrait. E! News reported she was photographed on January 4 leaving U.S. Customs in St. Johns with her bodyguards carrying five bags, boarding the boat alone and looking, per a source, "a bit sad and not very happy."\n\nThe whole romance had run only a few months, but it echoed for years: "Style" and "Out of the Woods" on 1989 are widely read as chronicling it, and when "Is It Over Now?" arrived on 1989 (Taylor\'s Version) in 2023, its "blue dress on a boat" line sent the decade-old departure photo viral all over again.',
        sources: [
          { outlet: 'Today', url: 'https://www.today.com/popculture/taylor-swift-harry-styles-relationship-timeline-rcna122164' },
          { outlet: 'Bustle', url: 'https://www.bustle.com/entertainment/when-did-taylor-swift-and-harry-styles-date' },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/376598/taylor-swift-spotted-on-boat-without-harry-styles-amid-breakup-reports',
          },
          {
            outlet: 'Bustle',
            url: 'https://www.bustle.com/entertainment/taylor-swift-is-it-over-now-lyrics-harry-styles-connection-explained',
          },
        ],
        // T16 full-standard pass (2026-07-09): the "blue dress on a boat"
        // frame itself is agency-controlled and not hotlinkable from any
        // strong host, so this ships a real Getty (GC Images) photo of the
        // couple from December 2012 as kind 'archival', with a caption that
        // says exactly what it is and is not. Hosted on Bustle's image CDN
        // (imgix), credited "GC Images" on the Bustle article it illustrates.
        // Verified HTTP 200 + image/jpeg + subject visually confirmed this session.
        photos: [
          {
            url: 'https://imgix.bustle.com/uploads/getty/2023/10/26/4391b9c6-1852-4f20-a292-5dd1acba75cf-getty-474684387.jpg?w=800',
            // Both walking full-length; faces sit near the top of the tall frame.
            focalPoint: '48% 17%',
            credit: 'GC Images / Getty Images, via Bustle',
            caption: 'Swift and Styles walking in New York in December 2012, weeks before the Virgin Islands trip ended the relationship. The famous "blue dress on a boat" departure photo itself remains agency-controlled.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      significance: 'notable', // the friendship the era's whole "squad" phase and imagery grew out of (docs/decisions.md, 2026-07-19)
      year: 2014,
      month: 3,
      day: 6,
      category: 'sighting',
      title: 'A California road trip with new best friend Karlie Kloss',
      snippet:
        'Days spent driving up the Pacific Coast Highway with Karlie Kloss in March 2014 — redwoods, cliffs, and a beach stop at Pfeiffer Big Sur State Park, all documented on Instagram as "the best road trip ever."',
      sourceUrl: 'https://www.hellomagazine.com/fashion/2014030617340/karlie-kloss-taylor-swift-instagram-pictures-road-trip/',
      thumbnailUrl: 'https://images.hellomagazine.com/horizon/original_aspect_ratio/73900276f68b-road-trip2-z.jpg',
      moment: {
        context:
          'Swift and Kloss — who\'d met just four months earlier backstage at the November 2013 Victoria\'s Secret Fashion Show — shared a self-documented road trip up the Northern California coast in early March 2014, stopping at redwood forests, ocean cliffs, and Pfeiffer Big Sur State Park.\n\nSwift captioned one post "California here we come, right back where we started from... ROAD TRIP!!" and another simply "This forest situation," while Kloss wrote "Karlie ♥ Taylor" in the sand at the beach. Swift summed up the trip on Instagram: "Beach, forests, cliffs, Northern California, sand, flower picking... Best road trip ever."',
        sources: [
          {
            outlet: 'HELLO!',
            url: 'https://www.hellomagazine.com/fashion/2014030617340/karlie-kloss-taylor-swift-instagram-pictures-road-trip/',
          },
        ],
        photos: [
          {
            url: 'https://images.hellomagazine.com/horizon/original_aspect_ratio/f710f8fef400-road-trip-z.jpg',
            // Photo pass #762 (2026-07-20): viewed the image. Both women perch
            // on the Pfeiffer Big Sur park sign, split to the far corners; keep
            // the crop centered on the sign's upper text band so both survive.
            focalPoint: '50% 45%',
            credit: 'Instagram / HELLO!',
          },
          {
            url: 'https://images.hellomagazine.com/horizon/original_aspect_ratio/73900276f68b-road-trip2-z.jpg',
            // Viewed: a black-and-white cheek-to-cheek selfie, both faces in the
            // upper-middle band, Taylor left of center; hold the crop high.
            focalPoint: '48% 35%',
            credit: 'Instagram / HELLO!',
          },
          {
            url: 'https://images.hellomagazine.com/horizon/original_aspect_ratio/2269843edce4-road-trip3-z.jpg',
            // Viewed: back-to-back in a field, both faces clustered left-of-center
            // and high; bias the crop left so neither face is lost.
            focalPoint: '40% 33%',
            credit: 'Instagram / HELLO!',
          },
        ],
      },
    },
    {
      year: 2014,
      month: 9,
      day: 16,
      category: 'sighting',
      title: 'Carrying kitten Olivia Benson down the street instead of using a cat carrier',
      snippet:
        "Paparazzi photos of Swift walking around New York carrying her new Scottish Fold kitten by hand sparked a wave of coverage — she later explained why: \"the kitten freaks out about being put in the cat carrier.\"",
      sourceUrl: 'https://abcnews.com/Entertainment/taylor-swift-explains-carries-cat-olivia-benson/story?id=25755359',
      thumbnailUrl:
        'https://akns-images.eonline.com/eol_images/Entire_Site/2014823/rs_634x1024-140923101708-634.Taylor-Swift-Olivia-Benson-JR-92314.jpg',
      moment: {
        context:
          'After being photographed multiple times in September 2014 carrying kitten Olivia Benson through New York City rather than using a carrier, Swift explained the habit in an Access Hollywood interview: "The kitten freaks out about being put in the cat carrier ... she freaks out when she\'s in there. So I was just like, \'OK, all right, we\'re gonna just do this!\'"\n\nShe downplayed the distance involved: "It was like a ten foot walk from my door to the car!" — and noted the kitten seemed unbothered by the cameras: "the cat is looking straight at the cameras!"',
        sources: [
          {
            outlet: 'ABC News',
            url: 'https://abcnews.com/Entertainment/taylor-swift-explains-carries-cat-olivia-benson/story?id=25755359',
          },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/583118/taylor-swift-explains-why-she-carries-cat-olivia-benson-around-new-york',
          },
        ],
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2014823/rs_634x1024-140923101708-634.Taylor-Swift-Olivia-Benson-JR-92314.jpg',
            credit: 'JR / E! News',
          },
        ],
      },
    },

    // --- Deep timeline fill (2026-07-08): release/tour/business/relationship
    // depth for an era that had 0 release items and 1 tour item. New items
    // carry the audit's additive provenance fields (slug + publisher/
    // source_type/accessed_at/reliability_score alongside legacy {outlet,url}),
    // same convention as the-life-of-a-showgirl.mjs. Every claim verified
    // against its cited source via search on 2026-07-08; no fabrication.
    // Photos deliberately omitted where no already-verified image URL exists.
    {
      slug: 'red-announced-google-hangout',
      year: 2012,
      month: 8,
      day: 13,
      category: 'release',
      title: 'Red announced live from her living room, on a Google+ Hangout',
      snippet:
        'A worldwide webcast from Nashville on August 13, 2012: the album title, the October 22 date, and — dropped the same night — a brand-new single called "We Are Never Ever Getting Back Together."',
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e8/Taylor_Swift_-_Red.png',
      moment: {
        context:
          'More than 70,000 fans were watching at the stream\'s peak as she laid out the whole plan: a 16-track album called Red, out October 22, with her first outside co-writers since she wrote all of Speak Now solo — Ed Sheeran and Max Martin among them.\n\nShe explained the title as an emotional color-code, saying the songs were "all pretty much about the kind of tumultuous, crazy, insane, intense, semi-toxic relationships that I\'ve experienced in the last two years." Then she premiered "We Are Never Ever Getting Back Together," which went on to become her first career Hot 100 No. 1 — a direct-to-fans rollout she\'s been elaborating on ever since.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
            source_title: 'Red (Taylor Swift album)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-to-release-new-red-album-in-october-191751/',
            source_title: "Taylor Swift to Release New 'Red' Album in October",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-new-single-number-1-364803/',
            source_title: "Taylor Swift's New Single Hits No. 1 on Hot 100",
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added the webcast still itself — Taylor
        // in the living room with fans, Red cover on the screen behind her — from Taste of
        // Country's own announcement-day article. Curl-verified 200 + image/webp, vision-
        // confirmed as the Aug 13, 2012 Google+ Hangout. Cover art focal matches the copy
        // on the Grammys-noms page.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/e/e8/Taylor_Swift_-_Red.png',
            credit: 'Big Machine Records',
            focalPoint: '50% 32%',
          },
          {
            url: 'https://townsquare.media/site/204/files/2012/08/TaylorSwiftRed.jpg?w=980&q=75',
            credit: 'YouTube webcast still / Taste of Country',
            focalPoint: '46% 42%',
          },
        ],
      },
    },
    {
      slug: 'red-ronan-stand-up-to-cancer',
      year: 2012,
      month: 9,
      day: 8,
      category: 'music',
      title: 'Ronan, a charity single built from a grieving mother\'s blog',
      snippet:
        'Written from Maya Thompson\'s blog posts about her son Ronan, who died of neuroblastoma at three — Thompson gets a co-writing credit, and every dollar went to fighting cancer.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Ronan_(song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Taylor_Swift_%22Ronan%22_SVG_Cover.svg/1280px-Taylor_Swift_%22Ronan%22_SVG_Cover.svg.png',
      moment: {
        context:
          'Swift debuted the song live at the Stand Up to Cancer telethon on September 8, 2012, and released it as an iTunes-exclusive the same night, with all proceeds donated to cancer charities. She assembled the lyrics from direct quotes in Thompson\'s blog about her son, crediting her as co-writer — with Thompson\'s share of the proceeds going to her Ronan Thompson Foundation. The song reached No. 16 on the Hot 100 and was certified gold, and Thompson told MTV that Swift "got it in a way that most people don\'t."\n\nSwift has treated the song as close to unperformable since: she has sung it live only twice, at the 2012 telethon and again on August 17, 2015 in Glendale, Arizona, when Thompson attended the 1989 World Tour. She re-recorded it for Red (Taylor\'s Version) in 2021 — after writing to Thompson for permission, explaining that Red was "an album of heartbreak and healing ... and of the loss of an imagined future alongside someone."',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Ronan_(song)',
            source_title: 'Ronan (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-debuts-ronan-at-stand-up-to-cancer-benefit-122781/',
            source_title: "Taylor Swift Debuts 'Ronan' at Stand Up To Cancer Benefit",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): Wikimedia Commons hosts a public-domain
        // vector replica of the text-only "Ronan" single cover (the artwork is
        // below the threshold of originality). Faithful to the real cover but not
        // the original raster file, so kind 'reference' with an honest caption.
        // Verified HTTP 200 + image/png this session.
        // Photo-enrichment audit (2026-07-18, #762): stays at one image. No reachable
        // outlet-CDN photo depicts the SU2C telecast performance itself — Taste of Country's
        // own article images are a dead placeholder (Ronan.jpg) and an off-hook 2012 VMAs
        // red-carpet close-up (TaylorSwiftCP.jpg), both downloaded and viewed this run; the
        // telecast stills live only on watermarked wire services. Cover viewed: text block
        // sits in the upper-middle of the square, so the focal point rides slightly high.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Taylor_Swift_%22Ronan%22_SVG_Cover.svg/1280px-Taylor_Swift_%22Ronan%22_SVG_Cover.svg.png',
            credit: 'Big Machine Records (vector replica via Wikimedia Commons)',
            caption: 'The "Ronan" single cover — shown here as a faithful vector replica of the text-only artwork, hosted on Wikimedia Commons.',
            kind: 'reference',
            focalPoint: '50% 42%',
          },
        ],
      },
    },
    {
      slug: 'red-begin-again-single',
      year: 2012,
      month: 10,
      day: 1,
      category: 'release',
      title: 'Begin Again sends a country valentine ahead of the pop swerve',
      snippet:
        'Sent to country radio October 1 (after a Sept. 25 digital release), three weeks before the album — a soft, waltzing country ballad about a first date that heals, deliberately reassuring country radio before Red\'s dubstep drop landed.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Begin_Again_(Taylor_Swift_song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/1/1e/Taylor_Swift_-_Begin_Again.png',
      moment: {
        context:
          'The second track released from Red, sent to country radio as a counterweight to the pop-leaning lead single. Swift described it as a song about "when you\'ve gotten through a really bad relationship and you finally dust yourself off and go on that first date after a horrible breakup."\n\nIt debuted and peaked at No. 7 on the Hot 100 on release-week downloads and earned a Grammy nomination for Best Country Song. The Philip Andelman video — a solitary, contemplative walk through Paris that ends at a café — was, in her words, a "love letter" to the city, about "somebody moving on and finding yourself again."',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Begin_Again_(Taylor_Swift_song)',
            source_title: 'Begin Again (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): single cover art from Wikipedia's stable
        // upload.wikimedia.org copy. URL verified HTTP 200 + image/png this session.
        // Photo-enrichment pass (2026-07-18, #762): added a Commons shot of her performing
        // this exact song on the Red Tour B-stage (Tacoma Dome; uploader's description names
        // "Begin Again"). CC BY-SA 2.0, curl-verified 200 + image/jpeg, vision-confirmed —
        // solo under a spotlight on the riser, which is how the song was staged.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/1/1e/Taylor_Swift_-_Begin_Again.png',
            credit: 'Big Machine Records',
            caption: 'Single cover art for "Begin Again," released October 1, 2012.',
            kind: 'primary',
            focalPoint: '62% 30%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Taylor_Swift_-_Red_Tour_-_Tacoma_Dome_-_Begin_Again_on_B-stage.jpg',
            credit: 'Selbe Lynn / Wikimedia Commons (CC BY-SA 2.0)',
            caption: 'Performing "Begin Again" alone on the B-stage riser during the Red Tour at Tacoma Dome.',
            kind: 'primary',
            focalPoint: '50% 42%',
          },
        ],
      },
    },
    {
      slug: 'red-title-track-names-the-album',
      year: 2012,
      month: 10,
      day: 2,
      category: 'music',
      title: 'Red, the song that named the record',
      snippet:
        'Loving him was like driving a new Maserati down a dead-end street — the title track\'s color-coded theory of a relationship whose emotions ran too hot to be anything but red.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/c/c0/Taylor_Swift_-_Red_%28Single%29.png',
      moment: {
        context:
          'Swift has explained that the album took its name from this song\'s central idea: the semi-toxic relationships she was writing about were defined by intense, burning emotion — red — rather than the blues and grays of ordinary heartbreak. The lyric maps feelings to colors directly: losing him was blue, missing him was dark gray, loving him was red. She wrote it on September 7, 2011, on the flight home to Nashville after a Tacoma, Washington show, homesick and still mid-tour.\n\nOn release week the track debuted at No. 6 on the Hot 100 on album-preview downloads, then became the album\'s fifth single in June 2013, peaking at No. 2 on Hot Country Songs across a 42-week run — at the time the longest-charting single of her career. Its biggest television moment came at the November 2013 CMA Awards, reworked acoustically with Alison Krauss on fiddle and Vince Gill on harmony.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_song)',
            source_title: 'Red (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): single cover art from Wikipedia's stable
        // upload.wikimedia.org copy. URL verified HTTP 200 + image/png this session.
        // Photo-enrichment pass (2026-07-18, #762): added a Red Tour live close-up (Jana
        // Zills, St. Louis, March 2013 — CC BY 2.0, curl-verified 200 + image/jpeg, vision-
        // confirmed): red gown at the red crystal mic, the album's signature color on stage.
        // An era-performance shot, not a photo of the writing session — no photo of that
        // exists; flagged here for honesty.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/c/c0/Taylor_Swift_-_Red_%28Single%29.png',
            credit: 'Big Machine Records',
            caption: 'Single cover art for "Red," the album\'s fifth single.',
            kind: 'primary',
            focalPoint: '28% 15%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Taylor_Swift_Red_Tour_4%2C_2013.jpg',
            credit: 'Jana Zills / Wikimedia Commons (CC BY 2.0)',
            caption: 'On the Red Tour in St. Louis, March 2013 — red gown, red crystal mic.',
            kind: 'archival',
            focalPoint: '46% 24%',
          },
        ],
      },
    },
    {
      slug: 'red-conor-kennedy-split',
      year: 2012,
      month: 10,
      day: 25,
      category: 'relationship',
      title: 'The Conor Kennedy summer quietly ends',
      snippet:
        'Us Weekly broke it on October 25: the Hyannis Port romance had "quietly parted ways a while ago" — a source blamed distance and the wall-to-wall Red promo schedule, not drama.',
      sourceUrl: 'https://www.eonline.com/news/357246/taylor-swift-and-conor-kennedy-breakup-anatomy-of-a-split',
      thumbnailUrl: null,
      moment: {
        context:
          'The split was reported three days after Red\'s release, ending a roughly three-month romance that began when the two were first spotted together in Mount Kisco, New York on July 31.\n\nThe summer had folded her deep into the family — Cape Cod stays around the Kennedy compound, a visit to the grave of Conor\'s mother, and open enthusiasm from grandmother Ethel Kennedy (the same Ethel whose 1940s photo inspired "Starlight"). The ending, by all accounts, was undramatic: a source told Us Weekly "They quietly parted ways a while ago. It was just a distance thing. No hard feelings. They\'re fine," as her promotional calendar ran without a break through the end of the year.',
        sources: [
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/357246/taylor-swift-and-conor-kennedy-breakup-anatomy-of-a-split',
            source_title: 'Taylor Swift and Conor Kennedy Breakup: Anatomy of a Split',
            publisher: 'E! News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/report-taylor-swift-and-conor-kennedy-split/',
            source_title: 'Report: Taylor Swift and Conor Kennedy split',
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 full-standard pass (2026-07-09): real paparazzi photo of the
        // couple from the Hyannis Port summer (E! Online's "Romance Rewind"
        // gallery, agency-credited "Paul Adao/INFphoto.com" in the gallery's
        // own metadata). The item is about the October split, so the summer
        // photo ships as kind 'archival' with a dated caption. Verified
        // HTTP 200 + image/jpeg + subject visually confirmed this session.
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2012719/634.taylor.cm.81912_copy.jpg',
            // Two figures wading, faces in the upper third of the tall frame.
            focalPoint: '45% 28%',
            credit: 'Paul Adao/INFphoto.com, via E! Online',
            caption: 'Swift and Conor Kennedy on the shore at Hyannis Port in August 2012 — the summer that quietly ended that October.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'red-ikywt-video-birthday',
      // Cross-link (Stage 3, 2026-07-27): sibling "I Knew You Were Trouble"
      // moments.
      relatedIds: [
        'moment:vault-red-i-knew-you-were-trouble-brings-dubstep-to-pop-radio',
        'moment:vault-red-i-knew-you-were-trouble-goes-global',
      ],
      year: 2012,
      month: 12,
      day: 13,
      category: 'release',
      title: 'The I Knew You Were Trouble video drops on her 23rd birthday',
      snippet:
        'December 13, 2012: a spoken-word intro, a pink-streaked dye job, and a festival-wasteland storyline — the most cinematic, least country video she\'d made to that point.',
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Knew_You_Were_Trouble',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/7/70/I_Knew_You_Were_Trouble.png',
      moment: {
        context:
          'Directed by Anthony Mandler, the video cast Swift opposite Reeve Carney as a bad-boy love interest through a desert festival bender of bar fights and infidelity, opening with a moody spoken monologue instead of the song — landing on the line "I think that the worst part of it all wasn\'t losing him. It was losing me."\n\nIts grittier styling — including temporary pink tips — marked a deliberate image departure timed to the single\'s pop-radio push, and it paid off in hardware: Best Female Video at the 2013 MTV VMAs and YouTube Phenomenon at the 2013 YouTube Music Awards.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/I_Knew_You_Were_Trouble',
            source_title: 'I Knew You Were Trouble',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/7/70/I_Knew_You_Were_Trouble.png',
            credit: 'Big Machine Records',
          },
        ],
      },
    },
    {
      slug: 'red-safe-and-sound-grammy',
      year: 2013,
      month: 2,
      day: 10,
      category: 'business',
      title: 'Safe & Sound wins the first Grammy of the Red era',
      snippet:
        'Her haunting Hunger Games ballad with The Civil Wars took Best Song Written for Visual Media at the 55th Grammys — still the only Hunger Games song ever to win a Grammy.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Safe_%26_Sound_(Taylor_Swift_song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/3/3c/Taylor_Swift_-_Safe_%26_Sound_%28feat._The_Civil_Wars%29.png',
      moment: {
        context:
          'Written with Joy Williams and John Paul White of The Civil Wars and producer T Bone Burnett for The Hunger Games soundtrack, the song won Best Song Written for Visual Media at the February 10, 2013 ceremony, where it was also nominated for Best Country Duo/Group Performance. She performed "We Are Never Ever Getting Back Together" as the show\'s ringmaster-themed opener the same night.\n\nThe collaboration itself came together in a single two-hour writing session at Burnett\'s home in fall 2011, after Swift spent two days reading the novel to get inside Katniss Everdeen\'s head. Released as a surprise iTunes drop on December 26, 2011, it debuted at No. 30 on the Hot 100, eventually went double platinum, and picked up a Golden Globe nomination for Best Original Song along the way — with a Philip Andelman video of Swift walking barefoot through a Watertown, Tennessee forest in a white gown.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Safe_%26_Sound_(Taylor_Swift_song)',
            source_title: 'Safe & Sound (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'PopCrush',
            url: 'https://popcrush.com/taylor-swift-civil-wars-best-song-written-for-visual-media-2013-grammys/',
            source_title: 'Taylor Swift + Civil Wars Win Best Song Written for Visual Media at 2013 Grammys',
            publisher: 'PopCrush',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'CBS Boston',
            url: 'https://www.cbsnews.com/boston/news/taylor-swift-wins-first-grammy-of-the-night-for-hunger-games-song/',
            source_title: "Taylor Swift Wins First GRAMMY Of The Night For 'Hunger Games' Song",
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): single cover art from Wikipedia's stable
        // upload.wikimedia.org copy. Verified HTTP 200 + image/png this session.
        // kind 'archival': the item is about the Grammy win; the cover is the
        // winning song's artwork, not a photo of the ceremony moment.
        // Photo-enrichment pass (2026-07-18, #762): added the acceptance moment itself —
        // Taylor with John Paul White, T Bone Burnett and Kaskade as the award is handed
        // over — from Taste of Country's own article on the win. Curl-verified 200 +
        // image/webp, vision-confirmed (gramophone trophy visible).
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/3/3c/Taylor_Swift_-_Safe_%26_Sound_%28feat._The_Civil_Wars%29.png',
            credit: 'Big Machine Records',
            caption: 'Single cover for "Safe & Sound" (feat. The Civil Wars), which won Best Song Written for Visual Media at the 55th Grammys.',
            kind: 'archival',
            focalPoint: '50% 45%',
          },
          {
            url: 'https://townsquare.media/site/204/files/2013/02/Taylor-Winning.jpg?w=980&q=75',
            credit: 'Getty Images / Taste of Country',
            caption: 'Accepting the Grammy with The Civil Wars\' John Paul White and producer T Bone Burnett, February 10, 2013.',
            kind: 'primary',
            focalPoint: '60% 26%',
          },
        ],
      },
    },
    {
      slug: 'red-22-single-and-video',
      // Depth ledger #1396 Q7 (2026-07-25): the Red pop-pivot throughline — the
      // page had no authored relatedIds. Thread "22" to the era's other Max
      // Martin/Shellback single and to the album itself. Both target ids
      // verified present in content-vault.generated.ts.
      relatedIds: [
        'moment:vault-red-i-knew-you-were-trouble-brings-dubstep-to-pop-radio',
        'moment:vault-red-red-heartbreak-in-every-genre',
      ],
      year: 2013,
      month: 3,
      day: 12,
      category: 'release',
      title: 'The 22 video: her actual friends, an actual party',
      snippet:
        'The fourth single arrived March 12, 2013, with a video shot the next-best thing to candid — Taylor and her real-life friend group at a house party, trampoline and cat-ear headband included.',
      sourceUrl: 'https://en.wikipedia.org/wiki/22_(Taylor_Swift_song)',
      thumbnailUrl: 'https://i.ytimg.com/vi/AgFeZr5ptV8/hqdefault.jpg',
      moment: {
        context:
          'Anthony Mandler shot the video at a Malibu beach house in February 2013, and it premiered on Good Morning America on March 13 — the day after the single\'s release. It cast her real friends rather than actors, leaning into the song\'s "happy, free, confused, and lonely" thesis with a day-in-the-life arc of baking, sunbathing, and swimming. The single peaked at No. 20 on the Hot 100 and was certified triple platinum.\n\n"22" is one of Red\'s three Max Martin and Shellback cuts — alongside "I Knew You Were Trouble" and "We Are Never Ever Getting Back Together" — that Swift wrote with the two Swedish producers outside Nashville, all built on pop production and programmed keyboards. It came out of some of her earliest sessions with Martin, whose knack for how to "just land a chorus" she has cited as an inspiration, and the trio\'s Red work is where the pop turn 1989 later completed actually began. Internationally the single reached No. 9 in the U.K. (Platinum) and charted in Australia (4× Platinum) and Canada (Platinum); 2013 critics split on it, from Billboard praising how it "succinctly communicat[ed] conflicting emotion" under the bubblegum surface to Slant\'s "shrill, deliberately vapid Ke$ha knockoff" and AllMusic\'s "cheerfully ludicrous club-filler." Re-recorded with Shellback and Christopher Rowe for Red (Taylor\'s Version) in November 2021, "22 (Taylor\'s Version)" re-entered the Hot 100 at No. 52 and reached No. 30 on the Billboard Global 200 amid the album\'s 26-song chart flood.\n\nThe song outlived its chart run to become a permanent set-list fixture — and eventually a ritual: on the Eras Tour, "22" opens the Red act, Swift performs it in a version of the video\'s white tee and black hat, and each night she ends the song by handing that hat to one pre-chosen fan, one of the show\'s most-anticipated recurring moments. Culture writers have since credited the song with turning the 22nd birthday itself into a milestone worth celebrating in lyric quotes.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/22_(Taylor_Swift_song)',
            source_title: '22 (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          // Depth ledger #1396 (2026-07-25): the Max Martin/Shellback authorship
          // + pop-pivot, international charts, 2013 reception, and the Taylor's
          // Version re-recording — the page previously cited only Wikipedia.
          {
            outlet: 'Capital FM',
            url: 'https://www.capitalfm.com/news/music/taylor-swift-max-martin-songs/',
            source_title: 'Every song Taylor Swift and Max Martin have worked on together',
            publisher: 'Capital FM',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 3,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-26-songs-hot-100-red-taylors-version-1235001484/',
            source_title: "Taylor Swift Charts 26 Songs From 'Red (Taylor's Version)' on Hot 100",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-25',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): thumbnail of the official "22" music
        // video. Video id AgFeZr5ptV8 verified via YouTube oEmbed this session:
        // title "Taylor Swift - 22", channel "Taylor Swift" (@TaylorSwift).
        // Thumbnail URL verified HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/AgFeZr5ptV8/hqdefault.jpg',
            credit: 'Big Machine Records / YouTube',
            caption: 'Taylor in the "not a lot going on at the moment" tee — thumbnail from the official "22" music video.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'red-buys-high-watch',
      // Cross-link (candidate #1369): the estate she staged her pre-wedding
      // bachelorette weekend at, two weeks before the July 2026 MSG wedding.
      relatedIds: [
        'moment:vault-tloas-a-tented-lawn-in-rhode-island-two-weeks-before-the-wedding',
      ],
      year: 2013,
      month: 4,
      day: 28,
      category: 'business',
      title: 'She buys High Watch, the Watch Hill mansion — in cash',
      snippet:
        'A $17.75 million, 5-acre oceanfront estate at the highest point of Watch Hill, Rhode Island, bought outright in 2013 — the future site of the July 4th parties and, years later, the muse for "The Last Great American Dynasty."',
      sourceUrl: 'https://en.wikipedia.org/wiki/High_Watch',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Holiday_House_on_Watch_Hill.jpg/500px-Holiday_House_on_Watch_Hill.jpg',
      moment: {
        context:
          'Built in 1929-30 for the Snowden family — who named it Holiday House — and later owned by Standard Oil heiress Rebekah Harkness, the estate came with more than 700 feet of private beachfront. The Colonial-style house itself runs about 11,000 square feet, with 8 bedrooms, a 36-foot parlor, a 45-foot sun room, and an octagonal formal dining room on five acres at the highest point of the village.\n\nNews of the all-cash purchase broke in spring 2013, and within a year the house was hosting the squad\'s famous Independence Day gatherings — an annual fixture from 2013 to 2016 that press treated as one of the most exclusive invitations in America, revived again in 2023. In 2020, Harkness\'s scandalous history in the house became "The Last Great American Dynasty" on folklore — turning the purchase itself into songwriting material: "and then it was bought by me."',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/High_Watch',
            source_title: 'High Watch',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'HELLO!',
            url: 'https://www.hellomagazine.com/homes/514523/inside-taylor-swifts-epic-17million-rhode-island-holiday-house/',
            source_title: "Inside Taylor Swift's $17million Rhode Island mansion",
            publisher: 'HELLO!',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        // Real-photo pass (2026-07-09): Wikimedia Commons photo of the actual
        // estate, seen from the Watch Hill shoreline (CC BY 2.0, author JJBers).
        // Distant public view — no private-location detail beyond what the
        // Wikipedia article itself publishes. Verified HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Holiday_House_on_Watch_Hill.jpg/500px-Holiday_House_on_Watch_Hill.jpg',
            credit: 'JJBers via Wikimedia Commons (CC BY 2.0)',
            caption: 'The Watch Hill, Rhode Island shoreline, with High Watch ("Holiday House") visible on the bluff among the neighboring homes.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'red-tour-surprise-guests',
      year: 2013,
      month: 8,
      day: 24,
      category: 'tour',
      title: 'The Red Tour\'s surprise-guest parade hits its stride',
      snippet:
        'Carly Simon duetting "You\'re So Vain" in Foxborough; Jennifer Lopez doing "Jenny From the Block" at Staples Center — the summer 2013 stadium run turned nightly guest cameos into a Taylor Swift tour signature.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Red_Tour',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Taylor_Swift_Red_Tour_2013.jpg/500px-Taylor_Swift_Red_Tour_2013.jpg',
      moment: {
        context:
          'Simon joined her on July 27, 2013 at Gillette Stadium for the song fans have spent 50 years trying to decode; Lopez appeared August 24 at Staples Center, one of a Los Angeles guest run that also included Sara Bareilles, Ellie Goulding, Tegan and Sara, and Cher Lloyd on different nights. The parade had started as early as the tour\'s first week — Nelly did "Hey Porsche" in St. Louis that March — and the guest slot quickly became the night-specific reason to buy a ticket.\n\nThe format followed her overseas in February 2014: opening act Ed Sheeran stepped up for a "Lego House" duet at London\'s O2, Sam Smith sang "Money on My Mind" the next night, and Emeli Sandé brought "Next to Me" a week later. The rotating-cameo tradition carried into every tour she has mounted since, from 1989\'s nightly celebrity walk-ons to the Eras Tour\'s surprise-song slot.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/The_Red_Tour',
            source_title: 'The Red Tour',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Taylor_Swift_Red_Tour_2013.jpg/500px-Taylor_Swift_Red_Tour_2013.jpg',
            credit: 'Jana Zills / Wikimedia Commons',
          },
        ],
      },
    },
    {
      slug: 'red-education-center-opens',
      year: 2013,
      month: 10,
      day: 12,
      category: 'business',
      title: 'A $4 million gift opens the Taylor Swift Education Center',
      snippet:
        'The Country Music Hall of Fame opened its Taylor Swift Education Center on October 12, 2013 — funded by the largest individual artist donation the museum had ever received.',
      sourceUrl: 'http://www.rollingstone.com/music/news/taylor-swift-opens-education-center-at-country-music-hall-of-fame-20131013',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Taylor_Swift_Education_Center_%2849328753061%29.jpg/500px-Taylor_Swift_Education_Center_%2849328753061%29.jpg',
      moment: {
        context:
          'Her $4 million endowment built a two-story, 7,500-square-foot wing with a gallery, classrooms, a studio, and a videoconference lab — doubling the Nashville museum\'s education space.\n\nThe center still operates today, hosting curriculum-connected school programs, toddler programming, and family music-and-art workshops, with rotating displays of her artifacts that have included music-video pieces and Fearless Tour Hatch Show Print posters, plus an interactive recording booth and a sensory-inclusive room.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'http://www.rollingstone.com/music/news/taylor-swift-opens-education-center-at-country-music-hall-of-fame-20131013',
            source_title: 'Taylor Swift Opens Education Center at Country Music Hall of Fame',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Country Music Hall of Fame',
            url: 'https://www.countrymusichalloffame.org/learn/taylor-swift-education-center',
            source_title: 'Taylor Swift Education Center',
            publisher: 'Country Music Hall of Fame and Museum',
            source_type: 'official',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
        ],
        // Real-photo pass (2026-07-09): Wikimedia Commons photo of the actual
        // center's signage (CC BY 2.0, author Jeremy Thompson), taken December
        // 2019 — the center as it still operates, not the 2013 opening event,
        // hence kind 'archival' and the dated caption. Verified HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Taylor_Swift_Education_Center_%2849328753061%29.jpg/500px-Taylor_Swift_Education_Center_%2849328753061%29.jpg',
            credit: 'Jeremy Thompson via Wikimedia Commons (CC BY 2.0)',
            caption: 'The Taylor Swift Education Center at the Country Music Hall of Fame in Nashville, photographed in 2019.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'red-sweeter-than-fiction',
      year: 2013,
      month: 10,
      day: 21,
      category: 'release',
      title: 'Sweeter Than Fiction: the first Jack Antonoff collaboration',
      snippet:
        'A one-off single for the film One Chance, released October 21, 2013 — the first song Taylor ever made with Jack Antonoff, years before he became her most constant collaborator.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Sweeter_Than_Fiction',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/2/29/Taylor_Swift_-_Sweeter_Than_Fiction_%28Official_Single_Cover%29.png',
      moment: {
        context:
          'Swift wrote it with Antonoff after watching the Paul Potts biopic One Chance, reading the film as a love story and writing from the perspective of Potts\'s unfailingly supportive wife.\n\nThe sound was the real tell: an \'80s-inspired synth-pop track one critic described as "You Belong With Me" run through Fun\'s synthesizers — in hindsight, a first sketch of the 1989 palette a year early. It peaked at No. 34 on the Hot 100, and its Golden Globe nomination for Best Original Song was her second in a row. The partnership it started went on to shape 1989, reputation, Lover, folklore, Midnights and beyond.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Sweeter_Than_Fiction',
            source_title: 'Sweeter Than Fiction',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): official single cover from Wikipedia's
        // stable upload.wikimedia.org copy. Verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/2/29/Taylor_Swift_-_Sweeter_Than_Fiction_%28Official_Single_Cover%29.png',
            credit: 'Big Machine Records',
            caption: 'Official single cover for "Sweeter Than Fiction," from the One Chance soundtrack.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'red-meets-karlie-kloss',
      year: 2013,
      month: 11,
      day: 13,
      category: 'sighting',
      title: 'Meets Karlie Kloss at the Victoria\'s Secret Fashion Show',
      snippet:
        'Nearly two years after telling Vogue "I love Karlie Kloss. I want to bake cookies with her!" — and Kloss tweeting back "Your kitchen or mine?" — the two finally met at the November 2013 VS Fashion Show, where Taylor performed and Karlie walked.',
      sourceUrl: 'https://www.eonline.com/news/1432607/taylor-swift-karlie-kloss-friendship-timeline-rift-rumors',
      thumbnailUrl: null,
      moment: {
        context:
          'The courtship had played out in public for almost two years: Swift spotted Kloss\'s photo during a 2012 Vogue interview at Prabal Gurung\'s studio and blurted the cookies line, and Kloss tweeted right back in January 2012 — "Hey @taylorswift13 love the @voguemagazine cover! Your kitchen or mine? :)"\n\nAfter finally meeting at the show, the friendship moved fast: the March 2014 Big Sur road trip, regular New York outings, and by the time Rolling Stone toured Swift\'s Tribeca apartment that September, Kloss had her own guest room there, stocked with a basket of her favorite Whole Foods snacks. It became one of the defining squad relationships of the 1989 era that followed.',
        sources: [
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1432607/taylor-swift-karlie-kloss-friendship-timeline-rift-rumors',
            source_title: "Inside Taylor Swift's Decades-Long Friendship With Karlie Kloss",
            publisher: 'E! News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Hollywood Life',
            url: 'https://hollywoodlife.com/feature/taylor-swift-karlie-kloss-4299380/',
            source_title: "Taylor Swift & Karlie Kloss' Friendship Timeline",
            publisher: 'Hollywood Life',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        // T16 full-standard pass (2026-07-09): Getty press photo of Swift
        // performing at the actual show where the two met (taped Nov 13, 2013,
        // aired Dec 10 on CBS), hosted on PopCrush's Townsquare CDN and
        // credited "Bryan Bedder, Getty Images" in that article's figcaption.
        // kind 'archival': it shows Swift's runway performance, not the
        // backstage meeting itself. Verified HTTP 200 + image + subject
        // visually confirmed this session.
        photos: [
          {
            url: 'https://townsquare.media/site/252/files/2013/12/TaylorSwift26.jpg?w=980&q=75',
            credit: 'Bryan Bedder, Getty Images / PopCrush',
            caption: 'Swift performing "I Knew You Were Trouble" during the Snow Angels finale of the 2013 Victoria\'s Secret Fashion Show — the night she and Karlie Kloss finally met.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'red-all-too-well-grammys-2014',
      significance: 'notable', // the performance that turned a deep cut into the fan-favorite that eventually became a chart-topping 10-minute version (docs/decisions.md, 2026-07-19)
      relatedIds: ['moment:vault-evermore-all-too-well-10-minute-version-becomes-the-longest-song-ever'],
      year: 2014,
      month: 1,
      day: 26,
      category: 'music',
      title: 'All Too Well gets its first TV performance — alone at a piano at the Grammys',
      snippet:
        'January 26, 2014: a deep cut that was never a single, performed solo at the piano at the 56th Grammys, hair-whip and all — the moment the fan favorite became the song everyone knew.',
      sourceUrl: 'https://en.wikipedia.org/wiki/All_Too_Well',
      thumbnailUrl: null,
      moment: {
        context:
          'Choosing a five-and-a-half-minute album track over any of Red\'s hit singles for her Grammy slot signaled how she — and fans — had come to regard the song. Introduced by LL Cool J, she hit the first note on a black grand piano the moment the lights came up, her band and backup singers kept back in the stage shadows so the spotlight stayed on her alone. She wore a cascading rhinestone-embellished gown with loose strands of beads draped across her shoulders and bare back, and worked through the song\'s emotional peaks with the whipping, headbanging piano style that instantly became a GIF.\n\nThe room gave her a standing ovation — Taste of Country described the audience screaming and hollering as she held the song\'s sad expression all the way through the applause — and the performance became one of the ceremony\'s most replayed moments. The song\'s stature only grew from there, culminating in the 10-minute version topping the Hot 100 in 2021.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/All_Too_Well',
            source_title: 'All Too Well',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Taste of Country',
            url: 'https://tasteofcountry.com/taylor-swift-all-too-well-2014-grammys/',
            source_title: "Taylor Swift Gives Emotional Grammys Perf of 'All Too Well'",
            publisher: 'Taste of Country',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 3,
          },
        ],
        // T16 full-standard pass (2026-07-09): Getty press photo of the actual
        // performance (the mid-hair-whip piano shot, "13" visible on the
        // piano), hosted on PopCrush's Townsquare CDN and credited "Kevork
        // Djansezian, Getty Images" in that article's figcaption. Verified
        // HTTP 200 + image + subject visually confirmed this session.
        // Photo-enrichment pass (2026-07-18, #762): added Billboard's own frame of the same
        // performance — the quiet wide shot seated at the piano before the hair-whip, a
        // distinct moment from the existing Getty frame (The Boot and Taste of Country both
        // ran that identical head-thrown-back image; rejected as duplicates this run).
        // Curl-verified 200 + image/jpeg, vision-confirmed.
        photos: [
          {
            url: 'https://townsquare.media/site/252/files/2014/01/TaylorSwift.jpg?w=980&q=75',
            credit: 'Kevork Djansezian, Getty Images / PopCrush',
            caption: 'Mid-hair-whip at the piano — "All Too Well" at the 56th Grammy Awards, January 26, 2014, with her lucky 13 stenciled on the piano.',
            kind: 'primary',
            focalPoint: '34% 35%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-grammys-2014-show-650-430.jpg',
            credit: 'Getty Images / Billboard',
            caption: 'Alone in the spotlight at the black grand piano, band held back in the shadows — the 56th Grammys, January 26, 2014.',
            kind: 'primary',
            focalPoint: '25% 32%',
          },
        ],
      },
    },
    {
      slug: 'red-bridal-shower-surprise',
      year: 2014,
      month: 4,
      day: 17,
      category: 'sighting',
      title: 'She flies to Ohio to crash a fan\'s bridal shower',
      snippet:
        'Gena Gabrielle mailed her an invitation not expecting a reply — Taylor showed up in Columbus with a KitchenAid mixer, a cookbook, and hand-painted gifts, telling the room it was her first bridal shower ever.',
      sourceUrl: 'https://abcnews.com/Entertainment/taylor-swift-surprise-fan-bridal-shower/story?id=23353944',
      thumbnailUrl: null,
      moment: {
        context:
          'Gabrielle, a fan Swift had first met at a 2007 meet-and-greet, sent the invite as a long shot; Swift found it going through fan mail at her management office and planned the April 2014 surprise herself, flying to Columbus for the day. She narrated the trip in a video posted afterward: "There\'s this girl named Gena, who has been coming to my shows for years ... I\'ve never been to a bridal shower, so we are going to fly to Ohio today."\n\nShe arrived carrying gifts — the KitchenAid mixer, a cookbook, and hand-painted presents among them — and posed for photos with the stunned bride and her guests. The video made national news, one of the era\'s defining direct-to-fans gestures, a year before Swiftmas took the same instinct to scale.',
        sources: [
          {
            outlet: 'ABC News',
            url: 'https://abcnews.com/Entertainment/taylor-swift-surprise-fan-bridal-shower/story?id=23353944',
            source_title: 'See Taylor Swift Surprise a Fan at Her Bridal Shower',
            publisher: 'ABC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/531583/taylor-swift-crashes-bridal-shower-surprises-fan-with-kitchenaid-mixer-cookbook-more-see-the-pics',
            source_title: 'Taylor Swift Surprises Fan at Bridal Shower',
            publisher: 'E! News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // T16 full-standard pass (2026-07-09): the photo E! ran with its own
        // story — Swift and bride-to-be Gena Gabrielle holding the shower's
        // L-O-V-E letters, shared from the event on Instagram. Verified
        // HTTP 200 + image/jpeg + subject visually confirmed this session.
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2014314/rs_600x600-140414070712-600.Taylor-Swift-Gena-JR-41414_copy.jpg',
            credit: 'Instagram, via E! News',
            caption: 'Swift and bride-to-be Gena Gabrielle at the Columbus, Ohio bridal shower, April 2014 — holding the party\'s L-O-V-E letters.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'red-tour-asia-finale',
      year: 2014,
      month: 6,
      day: 12,
      category: 'tour',
      title: 'The Red Tour takes its final bow in Singapore',
      snippet:
        'After 15 months and 86 shows, the tour closed June 12, 2014 at the Singapore Indoor Stadium — an Asian leg that also saw the Bangkok stop canceled in the aftermath of Thailand\'s military coup.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Red_Tour',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Taylor_Swift_RED_Tour_2014%2C_Singapore.jpg/500px-Taylor_Swift_RED_Tour_2014%2C_Singapore.jpg',
      relatedIds: [
        'moment:vault-red-caught-mid-rehearsal-for-the-red-tour-days-before-it-opened',
        'moment:vault-red-the-red-tour-opens-with-ed-sheeran-in-omaha',
        'moment:vault-red-128-costumes-for-the-red-tour-hand-built-in-three-weeks',
        'moment:vault-red-the-red-tour-closes-as-the-highest-grossing-country-tour-of-',
      ],
      moment: {
        context:
          'The 2014 leg carried the show from London\'s O2 through Berlin and on to Asia: Shanghai\'s Mercedes-Benz Arena on May 30, then Saitama, Jakarta\'s MEIS Ancol, Manila\'s Mall of Asia Arena, and Kuala Lumpur before the closing Singapore stand at the Indoor Stadium. The planned Bangkok concert — already sold out — was called off following the May 2014 coup d\'etat in Thailand.\n\nThe Singapore finale on June 12 closed the books on a 15-month, 86-show, 12-country run: 1.7 million tickets, $150.2 million grossed, and the record — confirmed by Billboard weeks later — as the highest-grossing country tour of all time. She wouldn\'t tour again until The 1989 World Tour the following year, by which point the "country" qualifier no longer applied.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/The_Red_Tour',
            source_title: 'The Red Tour',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): Wikimedia Commons photo from the closing
        // Singapore stand itself (CC BY-SA 4.0, author Weslam123, dated June 9,
        // 2014 at the Singapore Indoor Stadium) — the finale was June 12 at the
        // same venue, so kind 'archival' with the date in the caption.
        // Verified HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Taylor_Swift_RED_Tour_2014%2C_Singapore.jpg/500px-Taylor_Swift_RED_Tour_2014%2C_Singapore.jpg',
            credit: 'Weslam123 via Wikimedia Commons (CC BY-SA 4.0)',
            caption: 'Performing at the Singapore Indoor Stadium on June 9, 2014, during the Red Tour\'s closing Singapore stand.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'red-taylors-version-number-one',
      threadIds: ['taylors-version'],
      year: 2021,
      month: 11,
      day: 21,
      category: 'business',
      significance: 'notable', // a real chart record (fastest to four #1s, breaking a 46-year-old Elton John mark), but one of four TV chart debuts rather than a career-wide top-40 event (docs/decisions.md, 2026-07-19)
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-red-3", label: "Red (TV) opens at #1", kind: "album" },
      relatedIds: ['moment:vault-lover-my-worst-case-scenario-scooter-braun-buys-big-machine-and-he'],
      title: 'Red gets its do-over: Red (Taylor\'s Version) opens at No. 1',
      snippet:
        "Nine years later, the re-recording debuted atop the Billboard 200 with 605,000 units — 2021's biggest sales week for any album to that point, her tenth No. 1, and the fastest run to four chart-toppers by a solo artist, breaking Elton John's 1975 record.",
      sourceUrl: 'https://www.billboard.com/music/chart-beat/taylor-swift-tenth-number-one-album-billboard-200-red-taylors-version-1235000860/',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/4/47/Taylor_Swift_-_Red_%28Taylor%27s_Version%29.png',
      moment: {
        context:
          'Of the 605,000 first-week units (week ending Nov. 18, 2021), 369,000 were pure album sales — 2021\'s biggest sales week for any album to that point, a mark Adele\'s 30 topped a week later — including 114,000 on vinyl, at the time the largest vinyl sales week of the modern chart era. The 30-track set, including nine from-the-vault songs and the 10-minute "All Too Well," gave Swift her tenth Billboard 200 No. 1 and made her the fastest solo artist ever to notch four chart-toppers, in under 16 months — breaking a 46-year-old Elton John record.\n\nThe streaming side told the same story: 303 million on-demand streams, the biggest streaming week ever recorded for a country album. The tenth No. 1 also put her in company only Barbra Streisand (with 11) had reached among women — a chart footnote that doubled as vindication for the re-recording project itself.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-tenth-number-one-album-billboard-200-red-taylors-version-1235000860/',
            source_title: "Taylor Swift's 'Red (Taylor's Version)' Debuts at No. 1 on Billboard 200",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2021/11/21/taylor-swift-earns-her-milestone-tenth-no-1-album-with-red-taylors-version/',
            source_title: "Taylor Swift Earns Her Milestone Tenth No. 1 Album With 'Red (Taylor's Version)'",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/adele-30-billboard-200-albums-chart-debut-1235003213/',
            source_title: "Adele's '30' Debuts Atop the Billboard 200 With 2021's Biggest Sales Week",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added the official All Too Well: The
        // Short Film frame (Sadie Sink and Dylan O'Brien) — the campaign centerpiece of this
        // exact chart week, released Nov 12, 2021, and the vehicle for the 10-minute track
        // this page's context credits for the record. Official Taylor Swift channel
        // thumbnail via i.ytimg.com (same pattern as the vault's other official-video
        // stills), curl-verified 200 + image/jpeg, vision-confirmed.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/4/47/Taylor_Swift_-_Red_%28Taylor%27s_Version%29.png',
            credit: 'Republic Records',
            focalPoint: '45% 42%',
          },
          {
            url: 'https://i.ytimg.com/vi/tollGa3S0o8/maxresdefault.jpg',
            credit: 'Republic Records / Taylor Swift via YouTube',
            caption: 'Sadie Sink and Dylan O\'Brien in All Too Well: The Short Film, released with Red (Taylor\'s Version) the same chart week.',
            kind: 'archival',
            focalPoint: '52% 40%',
          },
        ],
      },
    },

    // ── Migrated from content.ts RAW (consolidation stage 2a, 2026-07-19) ──
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "red-album",
      year: 2012,
      month: 10,
      day: 22,
      category: "music",
      title: "Red: heartbreak in every genre",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-red-1", label: "Red released", kind: "album" },
      snippet: "The transitional masterpiece that pointed straight at pop stardom.",
      hiddenClue: { clue: "A scarf mentioned in one song became the most-discussed accessory in pop.", payoff: "Fans still debate who kept the scarf — a mystery she has coyly refused to fully resolve." },
      moment: {
        context: "Red is maximalist and messy on purpose — dubstep drops next to acoustic confessionals, all of it about one crimson-colored heartbreak.\n\nThe centerpiece, a ten-minute epic, would return years later as a cultural event of its own.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "red-wanegbt",
      year: 2012,
      month: 8,
      day: 13,
      category: "music",
      title: "“We Are Never Ever Getting Back Together”",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-red-0", label: "First #1 single", kind: "award" },
      snippet: "The gleeful kiss-off lead single that announced a decisive pop pivot.",
      video: { youtubeId: "WA4iX5D9Z64", title: "Taylor Swift - We Are Never Ever Getting Back Together" },
      moment: {
        context: "The lead single arrived with an eye-roll and a spoken-word bridge, and it shot straight to number one — her first Hot 100 chart-topper.\n\nIt signaled, unmistakably, that the country prodigy was walking toward the center of pop.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "red-begin-again",
      year: 2012,
      month: 10,
      day: 1,
      category: "music",
      title: "“Begin Again” as the soft landing",
      snippet: "A gentle promotional single about hope after heartbreak.",
      video: { youtubeId: "cMPEd8m79Hw", title: "Taylor Swift - Begin Again" },
      moment: {
        context: "Released ahead of the album, “Begin Again” balanced the era’s louder singles with quiet, hopeful romance.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "red-i-knew-you",
      year: 2012,
      month: 11,
      day: 12,
      category: "music",
      title: "“I Knew You Were Trouble” goes global",
      snippet: "A dubstep-tinged drop that pushed her sound to its poppiest edge yet.",
      video: { youtubeId: "vNoKguSdy4Y", title: "Taylor Swift - I Knew You Were Trouble" },
      moment: {
        context: "The bass-heavy breakdown scandalized country purists and delighted everyone else, cementing the genre crossover.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "red-snl",
      year: 2012,
      month: 11,
      dateLabel: "Fall 2012",
      category: "tour",
      title: "A run of TV performances",
      snippet: "Late-night and award-show stages keep Red everywhere at once.",
      moment: {
        context: "A dense promotional stretch put the album on every major stage as the release momentum peaked.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "red-grammys-2013",
      year: 2013,
      month: 2,
      day: 10,
      category: "tour",
      title: "The circus-themed Grammy opener",
      snippet: "A theatrical performance opens the ceremony and previews the tour’s scale.",
      moment: {
        context: "Opening the Grammys with a ringmaster’s flourish, she turned a single song into full-blown spectacle.",
        // Photo pass #762 (2026-07-19): E! News' own CDN (akns-images.eonline
        // .com, from E!'s night-of performance story); curl 200 image/jpeg
        // 634x1024; Read-viewed: Swift mid-performance in the white ringmaster
        // tailcoat and crystal top hat at the 2013 Grammys opener.
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2013110/634.2swift.show.ls.21013.jpg',
            credit: 'Via E! News',
            caption: 'The white ringmaster look that opened the 2013 Grammys — "We Are Never Ever Getting Back Together" as circus.',
            focalPoint: '48% 20%',
          },
          {
            // Salvaged 2026-07-19 from photo-enrichment PR #886 (otherwise
            // superseded by a racing run): a second, wider angle of the same
            // performance from Taste of Country's CDN — credit line per that
            // article. Re-verified 200 (image, 630x420, unwatermarked).
            url: 'https://townsquare.media/site/204/files/2013/02/tay.jpg',
            credit: 'Kevork Djansezian, Getty Images, via Taste of Country',
            caption: 'In the white ringmaster suit and top hat, opening the 2013 Grammys with "We Are Never Ever Getting Back Together."',
            kind: 'primary',
            // Face upper-center-left.
            focalPoint: '45% 28%',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "red-everything-changed",
      year: 2013,
      month: 7,
      day: 6,
      category: "music",
      title: "“Everything Has Changed” duet",
      snippet: "A folk-pop collaboration extends the album’s long single run.",
      moment: {
        context: "A tender duet kept Red on the charts deep into 2013, well over a year after release.",
      },
    },
  ],
};
