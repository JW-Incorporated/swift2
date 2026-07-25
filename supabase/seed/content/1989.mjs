// Vault content — 1989 era (original 2014 release, not Taylor's Version —
// the 2023 re-release is dated to the Midnights era per its actual release
// date, see midnights.mjs).
//
// Two wavetop months: Oct 2014 (album release) and May 2015 (tour opens).
// Every claim verified against its cited source directly. See
// docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first) authoring model this follows.

export default {
  eraSlug: '1989',
  items: [
    {
      year: 2014,
      month: 11,
      day: 15,
      category: 'business',
      title: '1989 becomes her third million-copy opening week',
      snippet:
        "1.287 million copies in week one — the biggest sales week for any album since Eminem's The Eminem Show in 2002, and her third album to cross a million copies in its first week.",
      sourceUrl: 'https://www.forbes.com/sites/hughmcintyre/2014/11/05/taylor-swifts-1989-moves-1-287-million-copies-in-its-first-week/',
      thumbnailUrl: 'https://blogs-images.forbes.com/hughmcintyre/files/2014/11/Taylor-Swift.jpg',
      moment: {
        context:
          "The seven-day frame ending Nov. 2, 2014 produced the biggest sales week for any album since The Eminem Show in 2002, and made her the only woman with three albums to each clear a million copies in a week — Speak Now and Red had done it first.\n\nBillboard's chart recap put the scale plainly: 1989 outsold the Nos. 2 through 107 albums on that week's Billboard 200 combined, in a year when no other album had even approached seven figures in a week. It debuted at No. 1 on the chart dated Nov. 15, 2014 and spent 11 nonconsecutive weeks at No. 1; only four albums have posted a bigger single week since — Adele's 25, The Tortured Poets Department, 1989 (Taylor's Version) itself, and The Life of a Showgirl.",
        sources: [
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2014/11/05/taylor-swifts-1989-moves-1-287-million-copies-in-its-first-week/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-1989-chart-rewind-2014-1235829365/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-life-of-a-showgirl-number-one-billboard-200/',
          },
        ],
        // Photo-enrichment run 11 (2026-07-18, #762): focal point set by
        // viewing — 1989-era press photo, face upper-left on the carpet shot.
        photos: [{ url: 'https://blogs-images.forbes.com/hughmcintyre/files/2014/11/Taylor-Swift.jpg', credit: 'Big Machine Records', focalPoint: '39% 24%' }],
      },
    },
    {
      year: 2014,
      month: 11,
      day: 10,
      category: 'music',
      title: 'Blank Space, and the joke half the audience missed',
      snippet:
        "Satire aimed at her own tabloid image — \"a girl who's crazy but seductive but glamorous but nuts but manipulative.\"",
      sourceUrl: 'https://en.wikipedia.org/wiki/Blank_Space',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7c/Taylor_Swift_-_Blank_Space_%28Official_Single_Cover%29.png',
      moment: {
        context:
          "She's said only about half of listeners caught it was a joke; the rest took the persona at face value — which was almost the point, since the song was written as a satirical, self-referential nod to a tabloid caricature she'd decided was \"kind of hilarious\" once she stopped feeling attacked by it.\n\nThe joke worked commercially either way: after debuting at No. 18, \"Blank Space\" knocked \"Shake It Off\" out of No. 1 in its third week, making her the first woman in the Hot 100's 56-year history to succeed herself at the top — only nine acts, from the Beatles to the Black Eyed Peas, had ever done it. It held No. 1 for seven straight weeks and was eventually certified 8x Platinum.",
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Blank_Space' },
          { outlet: 'Billboard', url: 'https://www.billboard.com/pro/taylor-swift-blank-space-hot-100/' },
        ],
        // Photo pass (2026-07-20, #762): 2nd verified photo + focal points on
        // both. Official "Blank Space" video id e-ORhEE9VVg confirmed via
        // YouTube oEmbed (author "Taylor Swift"); maxresdefault curl-verified
        // 200 image/jpeg, downloaded and viewed. Focal points set by eye.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/7/7c/Taylor_Swift_-_Blank_Space_%28Official_Single_Cover%29.png',
            focalPoint: '48% 35%',
            credit: 'Big Machine Records',
            caption: 'The "Blank Space" single cover — the satirical tabloid persona, rendered as a torn-up polaroid.',
            kind: 'archival',
          },
          {
            url: 'https://i.ytimg.com/vi/e-ORhEE9VVg/maxresdefault.jpg',
            focalPoint: '50% 40%',
            credit: 'Taylor Swift / Big Machine Records, via YouTube',
            caption: 'A close-up from the official "Blank Space" video — the mansion-and-mascara caricature played straight.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2014,
      month: 8,
      day: 18,
      category: 'music',
      title: 'Shake It Off, and the pivot from victim to punchline-maker',
      snippet: 'The tonal opposite of Mean — critics get a shrug and a wink instead of a wound.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Shake_It_Off',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/d/d1/Taylor_Swift_-_Shake_It_Off_music_video_screenshot.jpg',
      moment: {
        context:
          "In her Rolling Stone cover story that fall, she spelled out the shift: \"Mean\" had answered critics \"from kind of a victimized perspective,\" while years of having \"every part of my life dissected — my choices, my actions, my words, my body, my style, my music\" taught her a different response: \"you can either let it break you, or you can get really good at dodging punches.\"\n\nWritten and produced with Max Martin and Shellback — she pictured it as the song that drags reluctant dancers onto the floor at a wedding — it dropped the same day as the album-announcement livestream and entered the Hot 100 at No. 1, just the 22nd song ever to debut on top. Four nonconsecutive weeks at No. 1 later, it was on its way to becoming her first Diamond-certified single.",
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Shake_It_Off' },
          { outlet: 'Rolling Stone', url: 'https://www.rollingstone.com/music/music-news/the-reinvention-of-taylor-swift-116925/' },
        ],
        // Focal point 2026-07-20 (by eye): reference frame from the "Shake It
        // Off" video — a vertical crop with Taylor's face near the top.
        // Photo pass (2026-07-20, #762): 2nd verified frame from the same
        // official video (id nfWlot6h_JM, oEmbed author "Taylor Swift";
        // maxresdefault curl-verified 200 image/jpeg, downloaded and viewed).
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/d/d1/Taylor_Swift_-_Shake_It_Off_music_video_screenshot.jpg',
            focalPoint: '48% 16%',
            credit: 'Big Machine Records',
            caption: 'A frame from the "Shake It Off" video — the all-black look on the bare white soundstage.',
            kind: 'archival',
          },
          {
            url: 'https://i.ytimg.com/vi/nfWlot6h_JM/maxresdefault.jpg',
            focalPoint: '50% 46%',
            credit: 'Taylor Swift / Big Machine Records, via YouTube',
            caption: 'The hip-hop dance-crew scene from the same official "Shake It Off" video — the self-deprecating punchline in motion.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2014,
      month: 9,
      day: 8,
      category: 'music',
      title: 'Bad Blood, and the friendship it ended',
      snippet:
        "Not about an ex — by her own account, about a friend who tried to sabotage an entire arena tour.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Bad_Blood_(Taylor_Swift_song)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9b/Taylor_Swift_Feat._Kendrick_Lamar_-_Bad_Blood_%28Official_Single_Cover%29.png',
      moment: {
        context:
          "She told Rolling Stone the person had \"tried to hire a bunch of people out from under\" her; a year later she told GQ she'd \"never said anything that would point a finger in the specific direction of one specific person.\"\n\nKaty Perry, the widely speculated subject — the falling-out reportedly traced to a 2013 disagreement over backup dancers — made peace in stages, and largely in private first. Perry sent a literal olive branch as the reputation Stadium Tour opened in May 2018, and by June 2019 the two were sharing a screen, dressed as a burger and fries, in the \"You Need to Calm Down\" video; both have said they made sure the friendship was solid between them before letting the public in on it. By 2024 Perry was in the crowd at an Eras Tour show in Australia.",
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Bad_Blood_(Taylor_Swift_song)' },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/the-reinvention-of-taylor-swift-116925/',
          },
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/706891/taylor-swift-on-bad-blood-being-about-katy-perry-it-doesn-t-point-to-any-one-person',
          },
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/1423684/katy-perry-supports-taylor-swifts-the-life-of-a-showgirl',
          },
        ],
        // Photo pass (2026-07-20, #762): 2nd verified photo + focal points on
        // both. Official "Bad Blood ft. Kendrick Lamar" video id QcIy9NiNbmo
        // confirmed via YouTube oEmbed (author "Taylor Swift"); maxresdefault
        // curl-verified 200 image/jpeg, downloaded and viewed. Focal by eye.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/9/9b/Taylor_Swift_Feat._Kendrick_Lamar_-_Bad_Blood_%28Official_Single_Cover%29.png',
            focalPoint: '50% 28%',
            credit: 'Big Machine Records',
            caption: 'The "Bad Blood" single cover for the Kendrick Lamar version — "band-aids don\'t fix bullet holes."',
            kind: 'archival',
          },
          {
            url: 'https://i.ytimg.com/vi/QcIy9NiNbmo/maxresdefault.jpg',
            focalPoint: '54% 42%',
            credit: 'Taylor Swift / Big Machine Records, via YouTube',
            caption: 'A frame from the star-studded official "Bad Blood" video, the Kendrick Lamar remix.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2015,
      month: 5,
      day: 5,
      category: 'tour',
      significance: 'notable', // a real tour-opening record, but not on the career-defining tier next to the Eras Tour opening or the Stadium Tour (docs/decisions.md, 2026-07-19)
      title: 'The 1989 World Tour opens with two sold-out nights in Tokyo',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-89-2", label: "1989 World Tour", kind: "tour" },
      snippet:
        '100,320 fans across two shows at Tokyo Dome, $10.6 million combined — the start of what became 2015\'s highest-grossing tour.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_1989_World_Tour',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Taylor_tokyo_20150506.jpg',
      moment: {
        context:
          'Opening night on May 5, 2015 packed the 55,000-seat Tokyo Dome, with a light-up wristband on every seat pulsing and changing color in sync with the show. She opened with "Welcome to New York" against a mock Manhattan skyline, ran at least ten costume changes across nearly two hours, and swapped an opening act for video testimonials from Selena Gomez, HAIM, and the rest of the friend group.\n\n"This year changed my life and I wanted to come here to say thank you," she told the crowd, before closing with "Shake It Off" on a rotating catwalk under falling confetti. The two Tokyo shows drew 100,320 fans and grossed $10.6 million — the start of an 85-show run that ended as 2015\'s highest-grossing tour worldwide.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/The_1989_World_Tour' },
          { outlet: 'Billboard', url: 'https://www.billboard.com/music/music-news/taylor-swift-1989-tour-kickoff-tokyo-6553995/' },
        ],
        // Image-fix pass (2026-07-10): #168 — old photo was Commons-verified but shot in
        // Glasgow, six weeks after this Tokyo Dome opener. Swapped for a Commons "own work"
        // photo actually dated/described as Tokyo Dome, 6 May 2015 (CC BY-SA 4.0, photographer
        // Johndavis2004); curl-verified 200/image-jpeg, downloaded and visually confirmed
        // Taylor onstage with a guitar and a visible exit-sign pictogram consistent with Japan.
        // Photo pass (2026-07-19, defining-events-31-50): 6 added, all Wikimedia
        // Commons "The 1989 World Tour" uploads — curl-verified 200 + image/jpeg,
        // downloaded and visually confirmed this session. All from other stops
        // on the same 2015 tour (kept 'archival'/'reference', not 'primary').
        photos: [
          // Focal point 2026-07-20 (by eye): Tokyo Dome shot, her face upper-
          // center-right holding the guitar; hold high to keep the face framed.
          { url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Taylor_tokyo_20150506.jpg', credit: 'Johndavis2004 / Wikimedia Commons, CC BY-SA 4.0', kind: 'primary', caption: 'Onstage at the Tokyo Dome, May 6, 2015 — the second of the two sold-out opening nights.', focalPoint: '52% 28%' },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Taylor_Swift_-_The_1989_World_Tour_-_Ford_Field_001_%2818116917298%29.jpg',
            credit: 'GabboT / Wikimedia Commons, CC BY-SA 2.0',
            caption: 'The silver sequined bomber jacket and blue skater skirt worn for the "Style"/"New York" opening stretch, Ford Field, Detroit, May 30, 2015.',
            kind: 'archival',
            focalPoint: '55% 22%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Taylor_Swift_-_The_1989_World_Tour_-_Ford_Field_004_%2818117171700%29.jpg',
            credit: 'GabboT / Wikimedia Commons, CC BY-SA 2.0',
            caption: 'The same silver-jacket opening number, seen from behind with dancers, Ford Field, Detroit, May 30, 2015.',
            kind: 'archival',
            focalPoint: '50% 25%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Taylor_Swift_-_1989_Tour_Singapore_-_Style_%2823409003734%29.jpg',
            credit: 'Flower Black / Wikimedia Commons, CC BY 2.0',
            caption: 'A jumbotron view of the purple sequined "Style" performance dress, Singapore Indoor Stadium, Dec. 28, 2015.',
            kind: 'archival',
            focalPoint: '38% 35%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Taylor_Swift_-_ANZ_Stadium_Concert_1989_World_Tour_%2823928940022%29.jpg',
            credit: 'Flower Black / Wikimedia Commons, CC BY 2.0',
            caption: 'The stadium bathed in the tour\'s signature light-up wristbands as she crosses a catwalk, ANZ Stadium, Sydney, Dec. 28, 2015.',
            kind: 'reference',
            focalPoint: '35% 55%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/Taylor_Swift_-_The_1989_World_Tour_-_LOS_ANGELES_-_Blank_Space.jpg',
            credit: 'Denielle / Wikimedia Commons, CC BY-SA 2.0',
            caption: 'The black sequined romper worn for "Blank Space," walking the catwalk with a dancer, Los Angeles, Aug. 22, 2015.',
            kind: 'archival',
            focalPoint: '58% 25%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Taylor_Swift_-_The_1989_World_Tour_-_Whole_view_of_the_stage_before_the_show.jpg',
            credit: 'Daniel Park / Wikimedia Commons, CC BY 2.0',
            caption: 'The "1989" stage and a full stadium bowl before showtime, Levi\'s Stadium, Santa Clara, Aug. 15, 2015.',
            kind: 'reference',
            focalPoint: '25% 55%',
          },
        ],
      },
    },
    {
      year: 2014,
      month: 10,
      day: 27,
      category: 'music',
      title: 'New Romantics, the deluxe-track Rolling Stone later called one of the decade\'s best',
      snippet: '"Heartbreak is the national anthem" — a synth-pop rallying cry for coming back from it with your friends beside you.',
      sourceUrl: 'https://en.wikipedia.org/wiki/New_Romantics_(song)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/8/87/Taylor_Swift_-_New_Romantics_%28Official_Single_Cover%29.png',
      moment: {
        context:
          "Recorded with Max Martin and Shellback, it was relegated to the deluxe edition in 2014, then finally released as 1989's seventh and last single in February 2016 — with a Jonas Åkerlund video stitched from 1989 World Tour footage that premiered exclusively on Apple Music.\n\nRolling Stone's 2019 decade-end list ranked it No. 58 among the 100 best songs of the 2010s, calling it \"the type of relieving dance floor soul purge that the best pop can be\" and arguing the bonus track was the album's real thesis — a heartbroken hopeless romantic finding power in the pain. Critics keep ranking it among her best songs, usually with the same complaint attached: it never made the standard tracklist.",
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/New_Romantics_(song)' },
          { outlet: 'Rolling Stone', url: 'https://www.rollingstone.com/music/music-lists/the-100-best-songs-of-the-2010s-917532/taylor-swift-new-romantics-917602/' },
        ],
        // Photo pass (2026-07-20, #762): 2nd verified photo + focal points on
        // both. Official "New Romantics" video (1989 World Tour footage) id
        // wyK7YuwUWsU confirmed via YouTube oEmbed (author "Taylor Swift");
        // maxresdefault curl-verified 200 image/jpeg, downloaded and viewed.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/87/Taylor_Swift_-_New_Romantics_%28Official_Single_Cover%29.png',
            focalPoint: '50% 38%',
            credit: 'Big Machine Records',
            caption: 'The "New Romantics" single cover — "the best people in life are free," in polaroid.',
            kind: 'archival',
          },
          {
            url: 'https://i.ytimg.com/vi/wyK7YuwUWsU/maxresdefault.jpg',
            focalPoint: '48% 28%',
            credit: 'Taylor Swift / Big Machine Records, via YouTube',
            caption: 'A frame from the official "New Romantics" video, cut from 1989 World Tour concert footage.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2014,
      month: 10,
      day: 27,
      category: 'music',
      title: 'Clean, and the storm that washes everything out',
      snippet: 'The album\'s closing track, built entirely around one metaphor: heartbreak as addiction, and finally getting clean of it.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Clean_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          "The idea arrived in London, when she realized she'd spent two weeks in the same city as an ex without once thinking of him — the moment you notice the hurt is gone. She finished the lyrics and melody alone, then recorded it with Imogen Heap in a single day at Heap's Hideaway Studio, done after two takes, with Heap layering mbira, vibraphone, drums, and keyboards under the vocal. Heap later admitted she'd \"assumed Taylor didn't write too much of her own music\" and came away insisting the lyrics were entirely Swift's.\n\nOn the 1989 World Tour it became the show's confessional centerpiece, prefaced nightly by spoken reflections on mistakes and self-worth — and it kept resurfacing as an Eras Tour surprise song a decade later.",
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Clean_(song)' },
          { outlet: 'Billboard', url: 'https://www.billboard.com/music/music-news/imogen-heap-taylor-swift-write-music-1989-clean-6304250/' },
        ],
        // Photo-enrichment run 11 (2026-07-18, #762): added a clearly-labeled
        // reference photo of co-writer/producer Imogen Heap from 2014, the
        // year Clean was recorded at her Hideaway Studio (Commons, CC BY 3.0,
        // license and date verified via the Commons API; downloaded and
        // vision-confirmed). A studio track has no event imagery of its own.
        // Focal points set per image by viewing.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Taylor_Swift_onstage_Ford_Field_in_Detroit_-_The_1989_World_Tour.png',
            credit: 'tonyshek / Wikimedia Commons, CC BY-SA 2.0',
            kind: 'archival',
            caption: 'At the mic on the 1989 World Tour (Ford Field, Detroit, May 30, 2015) — the tour where Clean became the nightly spoken-word confessional. The song itself had no music video.',
            // Portrait crop; smiling profile sits upper-left of center.
            focalPoint: '45% 25%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Imogen_Heap_keytar_2014.png',
            credit: 'devastation jhayne / Wikimedia Commons, CC BY 3.0',
            kind: 'reference',
            caption: 'Reference image: Imogen Heap onstage in March 2014 — the co-writer and producer who recorded Clean with Swift in a single day at her Hideaway Studio.',
            // Tall frame; Heap's face is high, keytar diagonal through the middle.
            focalPoint: '50% 16%',
          },
        ],
      },
    },
    {
      year: 2015,
      month: 9,
      day: 2,
      category: 'music',
      title: 'Wildest Dreams draws colonialism criticism for its overwhelmingly white 1950s Africa',
      snippet:
        'A romance set on a 1950s film shoot in Africa, with critics calling its overwhelmingly white cast a colonial-nostalgia fantasy.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swifts-wildest-dreams-video-accused-of-channeling-white-colonialism-6685110/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-wildest-dreams-video-3-billboard-650.jpg?w=650&h=430&crop=1',
      moment: {
        context:
          "Joseph Kahn shot the video in Botswana and South Africa as a doomed romance between Swift's old-Hollywood actress and Scott Eastwood's co-star on a 1950s film set. Critics at multiple outlets read the safari fantasy and its overwhelmingly white cast as colonial nostalgia — African-studies professor Matthew Carotenuto pointed to a genre of \"pith-helmet-and-khaki-clad men as civilizing heroes\" — while Kahn countered that the casting was historically accurate to the segregated 1950s productions it depicted, not a statement on colonialism.\n\nSwift donated the video's proceeds to the African Parks Foundation of America for wildlife conservation. The controversy never dented the song's run: it became 1989's fifth consecutive top-10 hit, peaking at No. 5 on the Hot 100.",
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swifts-wildest-dreams-video-accused-of-channeling-white-colonialism-6685110/',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Wildest_Dreams_(Taylor_Swift_song)' },
        ],
        photos: [{ url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-wildest-dreams-video-3-billboard-650.jpg?w=650&h=430&crop=1', focalPoint: '52% 34%', credit: 'Big Machine Records' }],
      },
    },
    {
      year: 2015,
      month: 3,
      day: 29,
      category: 'fashion',
      title: 'A black cutout KaufmanFranco mini at the iHeartRadio Awards',
      snippet: 'Bandeau cutouts and intricate beadwork — the night she also won Artist of the Year.',
      sourceUrl: 'https://www.refinery29.com/en-us/2015/03/84671/taylor-swift-iheart-radio-awards',
      thumbnailUrl: 'https://images.hellomagazine.com/horizon/original_aspect_ratio/d02f741a61d4-taylor-a.jpg',
      moment: {
        context:
          "The black sequined KaufmanFranco minidress — bandeau cutouts at the sides, intricate beadwork, a neckline high enough to keep the whole thing polished rather than bare — put her on the best-dressed lists for the March 29, 2015 show, with Hello! calling her the night's best dressed and Refinery29 reading the look as part of a run of noticeably bolder choices that had started at that February's Elle Style Awards and BRIT Awards.\n\nThe dress was only half the night's story: she went home with three trophies, including Artist of the Year, the evening's biggest prize, plus Best Lyrics — a win Justin Timberlake, seated beside her, jokingly tried to accept for himself before hugging her on her way to the stage. She also joined Madonna onstage for a surprise performance mid-show.",
        sources: [
          {
            outlet: 'Refinery29',
            url: 'https://www.refinery29.com/en-us/2015/03/84671/taylor-swift-iheart-radio-awards',
          },
          {
            outlet: 'Hello!',
            url: 'https://www.hellomagazine.com/fashion/news/2015033053845/taylor-swift-leads-best-dressed-at-i-heart-radio-music-awards/',
          },
        ],
        photos: [{ url: 'https://images.hellomagazine.com/horizon/original_aspect_ratio/d02f741a61d4-taylor-a.jpg', credit: 'Getty Images' }],
        // Shop pass (2026-07-21): KaufmanFranco has no e-commerce -- a
        // current, verified in-stock black sequin mini in the same spirit.
        products: [
          {
            brand: 'Princess Polly',
            item: 'Miss Me Sequin Mini Dress',
            retailer: 'us.princesspolly.com',
            url: 'https://us.princesspolly.com/products/bombshell-sequin-mini-dress-black',
            price: '$85.00',
            isAlternative: true,
            altNote: 'Her KaufmanFranco mini has no e-commerce path -- this is a current black sequin mini in the same beaded, cutout-adjacent spirit.',
          },
        ],
      },
    },

    // --- Active-tier batch (2026-07-04): real, extensively-documented
    // relationship history from this era — the category the whole vault
    // under-serves (0 items before this batch), per docs/decisions.md.
    // Every item verified against its cited source(s) directly.
    {
      year: 2015,
      month: 5,
      day: 17,
      category: 'relationship',
      significance: 'defining', // the first major public relationship of the pop era, a full public arc from BBMAs to breakup (docs/decisions.md, 2026-07-19)
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-89-5", label: "Calvin Harris, public", kind: "life" },
      title: 'Calvin Harris and Taylor go public at the Billboard Music Awards',
      snippet: 'Introduced by Ellie Goulding that February, the DJ-and-pop-star pairing went fully public a month after a first, subtler social-media hint.',
      sourceUrl: 'https://www.yahoo.com/entertainment/taylor-swift-calvin-harris-relationship-183259939.html',
      thumbnailUrl: 'https://media.zenfs.com/en/us_magazine_896/a4a28013bda26c2b26c9551a2fc8bcef',
      moment: {
        context:
          "Ellie Goulding played matchmaker at the February 2015 Elle Style Awards in London, and the two were spotted flirting at a BRIT Awards afterparty the very next night, followed by a trip to Nashville together. Harris dropped the first public hint himself that April — an Instagram post of Swift's cats — before the paparazzi caught them holding hands leaving a HAIM show at the Troubadour.\n\nThe Billboard Music Awards that May made it unmistakable: they sat together all night, with cameras catching \"a smooch and plenty of hugs\" as she went up to collect her awards. By their one-year mark he was engraving the date — 3.6.15 — on a locket.",
        sources: [
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/taylor-swift-calvin-harris-relationship-183259939.html',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/calvin-harris-taylor-swift-breakup-twitter-rant-british-gq-interview-7850101/',
          },
        ],
        // Photo pass 2026-07-19 (defining-events-31-50): 3 more real,
        // verified photos. Two are recent (2024) individual photos of each
        // person, honestly captioned as such rather than implying they're
        // from 2015; the third is Harris's own period-accurate 2015 press
        // photo (Sony BMG, CC BY 3.0).
        photos: [
          // Focal point (#762): the pair sit side-by-side laughing, both faces in the upper third.
          { url: 'https://media.zenfs.com/en/us_magazine_896/a4a28013bda26c2b26c9551a2fc8bcef', credit: 'Kevin Mazur/BMA2015/WireImage', focalPoint: '50% 30%' },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Calvin_Harris_-_Press_Image_1.tif/lossy-page1-250px-Calvin_Harris_-_Press_Image_1.tif.jpg',
            credit: 'Sony BMG, Wikimedia Commons (CC BY 3.0)',
            caption: 'Calvin Harris\'s own 2015 press photo, from the same year the relationship went public.',
            kind: 'reference',
            // Studio portrait: his face sits just above center.
            focalPoint: '52% 28%',
          },
          {
            url: 'https://media.zenfs.com/en/us_magazine_896/5cdacd465b06109bab8c9239f156469e',
            credit: 'Getty Images, via Us Weekly',
            caption: 'Swift at a 2024 event — a recent individual photo, not from the 2015 relationship.',
            kind: 'reference',
            // CDN now serves a side-by-side split (Swift left, Harris right); both faces sit high, so center-top holds them.
            focalPoint: '50% 20%',
          },
          {
            url: 'https://media.zenfs.com/en/us_magazine_896/e7d0e3df697d43aa93972af434ff348b',
            credit: 'Getty Images, via Us Weekly',
            caption: 'Harris at a 2024 event — a recent individual photo, not from the 2015 relationship.',
            kind: 'reference',
            // CDN now serves a side-by-side split (Swift left, Harris right); both faces sit high.
            focalPoint: '50% 20%',
          },
        ],
      },
    },
    {
      year: 2015,
      month: 5,
      day: 17,
      category: 'fashion',
      title: 'A sparkling white Balmain jumpsuit for the Billboard Music Awards',
      snippet: 'Waist cutouts, all-over sparkle, and a "Bad Blood" video premiere the same night.',
      sourceUrl: 'https://www.eonline.com/photos/31611/taylor-swift-at-the-billboard-music-awards',
      thumbnailUrl: 'https://akns-images.eonline.com/eol_images/Entire_Site/2015417/rs_634x1024-150517170511-634.Taylor-Swift-Billboard-Music-Awards.jl.051715.jpg',
      moment: {
        context:
          'The sparkling white Balmain jumpsuit — low-cut, backless, beaded all over, with cutouts at the waist — was the look E! filed as her fashion game taken "to the next level," and she styled it against type: a smoky eye and pale, glossy nude lips instead of the signature red lipstick.\n\nThe accessory did the marketing: a black-and-red clutch that literally read "Bad Blood," teasing the video she would world-premiere on that very broadcast at the MGM Grand on May 17, 2015 — the Joseph Kahn revenge fantasy that opened the show and broke the Vevo 24-hour record within a day.',
        sources: [
          { outlet: 'E! Online', url: 'https://www.eonline.com/photos/31611/taylor-swift-at-the-billboard-music-awards' },
          { outlet: 'Bustle', url: 'https://www.bustle.com/articles/83746-taylor-swift-attends-2015-billboard-awards-red-carpet-in-a-white-jumpsuit-bad-blood-clutch' },
        ],
        photos: [{ url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2015417/rs_634x1024-150517170511-634.Taylor-Swift-Billboard-Music-Awards.jl.051715.jpg', credit: 'Jason Merritt/Getty Images' }],
        // Shop pass (2026-07-21): the exact 2015 beaded jumpsuit is
        // discontinued -- a current Balmain white jumpsuit, verified in
        // stock, closest real match.
        products: [
          {
            brand: 'Balmain',
            item: 'Sleeveless Lambskin Jumpsuit',
            retailer: 'us.balmain.com',
            url: 'https://us.balmain.com/en/p/sleeveless-lambskin-jumpsuit-FF0QO025LE040DA.html',
            price: '$3,495.00',
            isAlternative: true,
            altNote: 'Her exact 2015 beaded jumpsuit is long discontinued -- this is a current Balmain white jumpsuit, same house, a sleek lambskin cut rather than all-over beading.',
          },
        ],
      },
    },
    {
      year: 2016,
      month: 6,
      day: 1,
      category: 'relationship',
      title: 'Taylor and Calvin Harris split after 15 months',
      snippet: '"It just wasn\'t working anymore" — a breakup Harris addressed directly on social media, citing love and respect that remained.',
      sourceUrl: 'https://www.billboard.com/music/music-news/calvin-harris-taylor-swift-breakup-twitter-rant-british-gq-interview-7850101/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-calvin-harris-sunglasses-2015-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          "The June 2016 split arrived through an insider's shrug — \"it just wasn't working anymore\" — but Harris's real retrospective came later, in a British GQ interview after his tweets about the \"This Is What You Came For\" songwriting credit had blown up.\n\n\"It was completely the wrong instinct,\" he admitted, describing a stretch where \"it felt like things were piling on top of me and that was when I snapped,\" protecting \"what I see as my one talent in the world being belittled.\" His sharpest observation was about the coverage itself: the breakup, he noted, was \"way more heavily publicized than the relationship itself.\"",
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/calvin-harris-taylor-swift-breakup-twitter-rant-british-gq-interview-7850101/',
          },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/taylor-swift-calvin-harris-relationship-183259939.html',
          },
        ],
        photos: [{ url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-calvin-harris-sunglasses-2015-billboard-1548.jpg?w=942&h=628&crop=1', focalPoint: '48% 27%', credit: 'James Devaney/GC Images' }],
      },
    },
    {
      year: 2016,
      month: 7,
      day: 14,
      category: 'relationship',
      title: 'Tom Hiddleston, weeks after the Calvin Harris split',
      snippet: '"Taylor Swift and I are together, and we\'re very happy... it\'s not a publicity stunt" — his own words to The Hollywood Reporter.',
      sourceUrl: 'https://www.hellomagazine.com/celebrities/877239/why-tom-hiddleston-really-split-from-taylor-swift-after-whirlwind-three-month-romance/',
      thumbnailUrl: 'https://akns-images.eonline.com/eol_images/Entire_Site/201643/rs_600x600-160503143431-600.Taylor-Swift-Tom-Hiddleston-Dancing.ms.050316.jpg',
      moment: {
        context:
          "The two met at the 2016 Met Gala, where they danced together — he later recalled sitting next to her at dinner that night and finding her \"very charming.\" What followed ran at whirlwind speed: beach photos in Rhode Island, sightseeing in Rome, a stretch in England, then Australia's Gold Coast, where he was filming Thor: Ragnarok.\n\nEven the era's most memed image had a mundane explanation — the \"I ❤ T.S.\" tank top from her July 4th party, he told GQ, was a joke among friends after he'd hurt his back and needed to keep the sun off. His Hollywood Reporter confirmation was the rare mid-relationship on-record statement, and he never walked it back: \"Of course it was real,\" he said after the split.",
        sources: [
          {
            outlet: 'Hello!',
            url: 'https://www.hellomagazine.com/celebrities/877239/why-tom-hiddleston-really-split-from-taylor-swift-after-whirlwind-three-month-romance/',
          },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/timeline-events-leading-taylor-swift-022000915.html',
          },
        ],
        // Image-fix pass (2026-07-10): #167 — old photo was a hard-seamed two-panel
        // collage (Taylor and Hiddleston photographed separately, pasted together), also
        // reused on the "Hiddleswift ends" moment below. Swapped for E! Online's own single
        // photo of the two dancing together at the 2016 Met Gala — "where it all began" per
        // that outlet's own captioning; curl-verified 200/image-jpeg, downloaded and visually
        // confirmed both of them together in one frame.
        photos: [{ url: 'https://akns-images.eonline.com/eol_images/Entire_Site/201643/rs_600x600-160503143431-600.Taylor-Swift-Tom-Hiddleston-Dancing.ms.050316.jpg', focalPoint: '50% 40%', credit: 'E! Online', kind: 'archival', caption: 'Dancing together at the 2016 Met Gala afterparty, where the two met — the start of the relationship this moment covers.' }],
      },
    },
    {
      year: 2016,
      month: 7,
      day: 3,
      category: 'sighting',
      title: 'A Fourth of July beach walk in Rhode Island',
      snippet: "Spotted walking the shore at her Rhode Island house in matching \"I ❤ T.S.\" gear, part of a holiday party with her regular friend group.",
      sourceUrl: 'https://www.yahoo.com/entertainment/timeline-events-leading-taylor-swift-022000915.html',
      thumbnailUrl: 'https://akns-images.eonline.com/eol_images/Entire_Site/201663/rs_634x1024-160703191428-634.Taylor-Swift-Tom-Hiddleston-4th-of-july.tt.070316.jpg',
      moment: {
        context:
          "The walk came the day before the fireworks: on July 3, 2016, photographers caught the couple strolling the shore below her Rhode Island house, Hiddleston in the instantly memed \"I ❤ T.S.\" tank top with a temporary heart-and-\"T\" tattoo on his arm. The holiday party rolled on around them with Blake Lively, Karlie Kloss, and the rest of the regular squad in attendance; a friend's Instagram group shot of the couple, later deleted, became the weekend's defining image.\n\nThe tank top eventually got a mundane explanation — a joke among friends, Hiddleston told GQ, after he'd hurt his back and needed to keep the sun off — but in the moment it crystallized the public's disbelief at how fast \"Hiddleswift\" was moving: they'd met at the Met Gala in May, gone public in June, and were doing matching swimwear on her beach by the Fourth of July.",
        sources: [
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/timeline-events-leading-taylor-swift-022000915.html',
          },
          {
            outlet: 'Hello!',
            url: 'https://www.hellomagazine.com/celebrities/877239/why-tom-hiddleston-really-split-from-taylor-swift-after-whirlwind-three-month-romance/',
          },
        ],
        // Image-fix pass (2026-07-10): #166 — old photo (media.zenfs.com) actually showed
        // the two kissing at the Colosseum in Rome (late June 2016), not a Rhode Island beach
        // — a different moment already covers Rome separately elsewhere in this file. Swapped
        // for E! Online's own photo captioned "PDA in the Ocean," dated July 3, 2016, matching
        // this moment's Fourth-of-July Rhode Island beach party; curl-verified 200/image-jpeg,
        // downloaded and visually confirmed the two embracing in ocean water.
        photos: [{ url: 'https://akns-images.eonline.com/eol_images/Entire_Site/201663/rs_634x1024-160703191428-634.Taylor-Swift-Tom-Hiddleston-4th-of-july.tt.070316.jpg', credit: 'E! Online', kind: 'archival', caption: 'In the water at the July 3, 2016 Rhode Island Independence Day party — the same weekend as the memed "I ❤ T.S." tank top.' }],
      },
    },
    {
      year: 2016,
      month: 9,
      day: 6,
      category: 'relationship',
      title: 'Hiddleswift ends after three months',
      snippet: 'A brief, intensely-covered romance that started at the Met Gala ended quietly by September.',
      sourceUrl: 'https://www.hellomagazine.com/celebrities/877239/why-tom-hiddleston-really-split-from-taylor-swift-after-whirlwind-three-month-romance/',
      thumbnailUrl: 'https://akns-images.eonline.com/eol_images/Entire_Site/2016628/rs_634x1024-160728100815-634.Taylor-Swift-Tom-Hiddleston-Exclusive-Dinner-Date-J4R-072816.jpg',
      moment: {
        context:
          "The September 2016 ending was reported as amicable — and strikingly quiet for a romance that had been photographed on three continents in twelve weeks.\n\nHiddleston said little afterward, but what he did say pushed back on the theory that it had all been staged: \"Of course it was real,\" he told GQ, while acknowledging that a relationship lived that publicly takes real work — a nod to the media glare that, by most accounts, helped end it. \"Hiddleswift\" had become shorthand for celebrity-romance overexposure in a single summer.",
        sources: [
          {
            outlet: 'Hello!',
            url: 'https://www.hellomagazine.com/celebrities/877239/why-tom-hiddleston-really-split-from-taylor-swift-after-whirlwind-three-month-romance/',
          },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/timeline-events-leading-taylor-swift-022000915.html',
          },
        ],
        // Image-fix pass (2026-07-10): #167 — same two-panel collage flagged on the moment
        // above (Taylor and Hiddleston shot separately, pasted together). Swapped for E!
        // Online's own photo of their July 27, 2016 dinner-date exit — captioned by that
        // outlet as their last sighting together before the September split; curl-verified
        // 200/image-jpeg, downloaded and visually confirmed the two together hand-in-hand.
        photos: [{ url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2016628/rs_634x1024-160728100815-634.Taylor-Swift-Tom-Hiddleston-Exclusive-Dinner-Date-J4R-072816.jpg', focalPoint: '48% 16%', credit: 'E! Online', kind: 'archival', caption: 'Leaving a dinner date hand-in-hand, July 27, 2016 — their last publicly photographed sighting together before the September split.' }],
      },
    },
    {
      significance: 'notable', // the origin point of a relationship that ran six years, already 'defining' at its end elsewhere in this corpus (docs/decisions.md, 2026-07-19)
      relatedIds: ['moment:vault-midnights-taylor-and-joe-alwyn-confirm-their-breakup-after-six-years'],
      year: 2017,
      month: 5,
      day: 16,
      category: 'relationship',
      title: 'The Sun breaks the news: quietly dating Joe Alwyn since the fall',
      snippet: "She'd kept it secret for months, renting a North London house and using scarves and hats to avoid being recognized.",
      sourceUrl: 'https://www.today.com/popculture/music/taylor-swift-joe-alwyn-relationship-timeline-rcna51604',
      thumbnailUrl: 'https://cdn.mos.cms.futurecdn.net/yXTo3vnDBfTQ7FuxY8EdMH.jpg',
      moment: {
        context:
          'The Sun\'s May 2017 scoop reported the two had quietly been a couple for months — with Swift moving around London in disguises, "like scarves and hats," and renting a house in North London for her time in the city. The Daily Mail floated a claim that Emma Stone had made the introduction; fans have long preferred the 2016 Met Gala theory, pointing to the "Dress" lyric about his buzz cut and her bleached hair, though the two were also reportedly at the same Kings of Leon afterparty at the Bowery Hotel that October.\n\nSwift later confirmed the real timeline herself, in a diary entry included with a Lover deluxe edition, dated Jan. 3, 2017: "We have been together and no one has found out for 3 months now" — placing the start around October 2016, more than half a year before The Sun\'s story landed.',
        sources: [
          {
            outlet: 'Today',
            url: 'https://www.today.com/popculture/music/taylor-swift-joe-alwyn-relationship-timeline-rcna51604',
          },
          { outlet: 'The Week', url: 'https://theweek.com/feature/briefing/1022534/taylor-swift-and-joe-alwyn-a-timeline-of-their-relationship' },
        ],
        // Image-fix pass (2026-07-10): #169 — image is genuinely Taylor and Joe Alwyn
        // (verified subject correct) but the outfit/context (oversized blazer, SNL
        // afterparty at Zuma, bodyguard, Chase sign) matches their October 5-6, 2019 NYC
        // outing, not this May 2017 story — no public couple photos exist from 2017, which
        // is the point of the "quietly dating" scoop. Caption corrected to the real date
        // instead of replacing the URL, per protocol fallback for a real-but-mismatched-date
        // photo; no other 2017-dated couple photo passed the sourcing gates.
        // Focal point (#762): the couple walks center-frame, both faces in the upper quarter; a wide crop keeps both.
        photos: [{ url: 'https://cdn.mos.cms.futurecdn.net/yXTo3vnDBfTQ7FuxY8EdMH.jpg', credit: 'Robert Kamau/GC Images', kind: 'archival', caption: 'Taylor and Joe Alwyn hand-in-hand at the SNL afterparty, October 2019 — over two years after The Sun\'s scoop; no public photos of the couple exist from the May 2017 period this moment covers.', focalPoint: '52% 24%' }],
      },
    },

    // --- Fashion/photo depth pass (2026-07-04): new fashion + hair/makeup
    // items for this era, plus verified photos backfilled onto existing
    // items above. Every photo URL hotlinked to the outlet's own CDN and
    // checked for a 2xx image response before being added.
    {
      year: 2015,
      month: 8,
      day: 30,
      category: 'fashion',
      title: 'A houndstooth Ashish crop-top pantsuit leads the "Bad Blood" squad onto the VMAs carpet',
      snippet: 'Sequined, metallic houndstooth crop top and trousers, dark cat-eye makeup, and an entire squad of models and actresses walking in formation behind her.',
      sourceUrl: 'https://www.etonline.com/news/170949_taylor_swift_dominated_the_2015_vmas_red_carpet_with_her_entire_bad_blood_squad',
      thumbnailUrl: 'https://www.hollywoodreporter.com/wp-content/uploads/2015/08/Martha_Hunt_Hailee_Steinfeld_Cara_Delevingne_Selena_Gomez_Taylor_Swift_Serayah_Lily_Aldridge_Gigi_Hadid_Karlie_Kloss_VMAs.jpg?w=2000&h=1126&crop=1',
      moment: {
        context:
          'The sequined, metallic houndstooth Ashish crop top and trousers — worn with dark cat-eye makeup — arrived on the night "Bad Blood" won Video of the Year. Swift walked the red carpet flanked by Martha Hunt, Hailee Steinfeld, Cara Delevingne, Selena Gomez, Serayah, Lily Aldridge, Gigi Hadid, and Karlie Kloss — the "squad" era in its full, coordinated force.\n\nEntertainment Tonight counted ten of the video\'s women on the carpet, Mariska Hargitay — namesake of her cat Olivia Benson — among them, and noted Swift came in as the night\'s most-nominated artist with nine nods. "I\'m so excited to be here with Taylor and all the \'Bad Blood\' girls," Steinfeld said on the carpet, which was roughly the whole thesis of the appearance: the video\'s casting trick restaged as a live formation.',
        sources: [
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/news/170949_taylor_swift_dominated_the_2015_vmas_red_carpet_with_her_entire_bad_blood_squad',
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/news/general-news/vmas-fashion-taylor-swift-bad-818775/',
          },
        ],
        photos: [{ url: 'https://www.hollywoodreporter.com/wp-content/uploads/2015/08/Martha_Hunt_Hailee_Steinfeld_Cara_Delevingne_Selena_Gomez_Taylor_Swift_Serayah_Lily_Aldridge_Gigi_Hadid_Karlie_Kloss_VMAs.jpg?w=2000&h=1126&crop=1', credit: 'Getty Images' }],
        // Shop pass (2026-07-21): the exact 2015 Ashish set is discontinued
        // -- a current Ashish piece, verified in stock, same house and
        // sequined-check spirit.
        products: [
          {
            brand: 'Ashish',
            item: 'Sequin Tartan Overshirt',
            retailer: 'ashish.co.uk',
            url: 'https://ashish.co.uk/products/sequin-tartan-overshirt-1',
            price: '£1,690.00',
            isAlternative: true,
            altNote: 'Her exact 2015 Ashish houndstooth set is discontinued -- this is a current Ashish piece, same house, a tartan check rather than houndstooth.',
          },
        ],
      },
    },
    {
      year: 2015,
      month: 5,
      day: 5,
      category: 'fashion',
      title: 'The 1989 World Tour wardrobe: a rotating closet of sparkle',
      snippet: 'Beaded fringe minidresses, a jeweled bodysuit, a Marilyn Monroe-style playsuit, a leather catsuit — a different sequined look for nearly every section of the show.',
      sourceUrl: 'https://www.marieclaire.com/fashion/news/a14342/taylor-swift-1989-tour-costumes/',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Taylor_Swift_onstage_Ford_Field_in_Detroit_-_The_1989_World_Tour.png',
      moment: {
        context:
          'Across the tour\'s stops, the wardrobe ranged from a powdery-pink beaded fringe minidress to a black beaded crop top with a flared skirt, a bejeweled bra top with high-waisted cigarette pants, and a white plunging halter playsuit with swinging fringe — costume changes built for a stadium show as much as for the songs themselves.\n\nMarie Claire\'s costume roundup ran to a dozen distinct stage looks: a jewel-toned sequined bomber it compared to rainbow fish scales, a light-up LED crop-top-and-skirt set matching her backup dancers, a second-skin black leather catsuit, a bright green beaded flapper romper, and glittery lace-up platform ankle boots grounding the lot — a deliberately rotating closet for a show whose Tokyo opening night alone had run at least ten costume changes.',
        sources: [
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/news/a14342/taylor-swift-1989-tour-costumes/',
          },
        ],
        // Image-fix pass (2026-07-10): #177 — old photo was a hard-seamed three-panel
        // editorial collage, not a single photograph. Swapped for the Commons Ford Field
        // sequin-jacket shot already verified elsewhere in this file (CC BY-SA 2.0,
        // tonyshek); captioned here as one look from the rotating wardrobe rather than
        // implying it's the only one.
        photos: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Taylor_Swift_onstage_Ford_Field_in_Detroit_-_The_1989_World_Tour.png', credit: 'tonyshek / Wikimedia Commons, CC BY-SA 2.0', kind: 'archival', caption: 'One of the tour\'s many sequined stage looks (Ford Field, Detroit, May 30, 2015) — the wardrobe rotated night to night.' }],
        // Shop pass (2026-07-21): the exact tour costumes are custom,
        // one-off pieces -- a current beaded fringe mini, verified in
        // stock, in the same spirit as the pink fringe minidress described.
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
            altNote: 'The tour\'s custom costumes were one-off pieces, never sold -- this is a current beaded fringe mini in the same pink-fringe spirit as one of the rotating looks.',
          },
        ],
      },
    },
    {
      year: 2016,
      month: 2,
      day: 15,
      category: 'fashion',
      title: 'A red bandeau top and a thigh-slit magenta maxi skirt at the 2016 Grammys',
      snippet: 'A strapless red crop top paired with a voluminous hot-pink satin skirt slit to the hip — worn the same night 1989 won Album of the Year.',
      sourceUrl: 'https://www.eonline.com/news/740307/taylor-swift-s-grammys-2016-red-carpet-outfit-looks-very-familiar-and-this-is-why',
      thumbnailUrl: 'https://akns-images.eonline.com/eol_images/Entire_Site/2016115/rs_634x1024-160215153706-634-2016-Grammy-Awards-taylor-swift.jpg?fit=around%7C634:1024&output-quality=90&crop=634:1024;center,top',
      moment: {
        context:
          'The two-piece was custom Atelier Versace — a coral-red bandeau over a floor-length hot-pink silk skirt slit high up the thigh — finished with roughly $900,000 of Lorraine Schwartz sapphires. Donatella Versace told Billboard that Swift "wanted a look that was young, sexy and fresh, as she is, totally reflecting her character," with the drama coming from "the right colors, and then cut and fit."\n\nThe internet mostly saw other things: E! rounded up the lookalikes, from Bianca\'s prom dress in 10 Things I Hate About You to Emma Stone\'s pink-and-magenta 2014 Met Gala two-piece to Kimberly Schlapman in similar color-blocking on the same carpet. The night itself did the historic work — she left as the first woman ever to win Album of the Year twice.',
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/740307/taylor-swift-s-grammys-2016-red-carpet-outfit-looks-very-familiar-and-this-is-why',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/donatella-versace-taylor-swift-grammy-custom-look-6882411/',
          },
        ],
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2016115/rs_634x1024-160215153706-634-2016-Grammy-Awards-taylor-swift.jpg?fit=around%7C634:1024&output-quality=90&crop=634:1024;center,top',
            credit: 'Jason Merritt/Getty Images for NARAS',
            // Photo pass #762 (2026-07-19): viewed — full-length carpet shot, face high in the
            // portrait frame.
            focalPoint: '49% 12%',
          },
          // Photo pass #762 (2026-07-19): second frame from the cited Billboard (Donatella
          // Versace) article's own CDN (billboard.com/wp-content). curl 200 image/jpeg 650x430;
          // Read-viewed: three-quarter shot of the same look — red bandeau, pink skirt, choker,
          // hand on hip against the Grammy step-and-repeat; EXIF copyright names Steve Granitz.
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/Taylor-Swift-grammys-2016-red-carpet-billboard-650.jpg',
            credit: 'Steve Granitz/Getty Images (via Billboard)',
            caption: 'The custom Atelier Versace two-piece in close-up on the 2016 Grammys carpet.',
            focalPoint: '45% 18%',
          },
        ],
        // Shop pass (2026-07-21): a one-of-a-kind custom Atelier Versace
        // piece has no retail equivalent -- a current hot-pink satin skirt,
        // verified in stock, in the same color and silhouette as the
        // half of the look most remembered.
        products: [
          {
            brand: 'Pink Attitude Boutique',
            item: 'Happy To Know You Hot Pink Satin Maxi Skirt',
            retailer: 'shoppinkattitude.com',
            url: 'https://shoppinkattitude.com/products/happy-to-know-you-hot-pink-satin-maxi-skirt',
            price: '$25.20',
            isAlternative: true,
            altNote: 'The custom Atelier Versace two-piece was one-of-a-kind couture, never sold -- this is a current hot-pink satin skirt in the same color and volume as the memorable half of the look.',
          },
        ],
      },
    },
    {
      year: 2016,
      month: 2,
      day: 15,
      category: 'fashion',
      title: 'A blunt bob with bangs replaces the signature curls at the 2016 Grammys',
      snippet: 'A dramatically shorter, blunt-cut bob with heavy fringe — a sharp departure from the long waves she\'d worn through most of the 1989 era, debuted on one of the year\'s biggest red carpets.',
      sourceUrl: 'https://www.eonline.com/news/740307/taylor-swift-s-grammys-2016-red-carpet-outfit-looks-very-familiar-and-this-is-why',
      thumbnailUrl: 'https://akns-images.eonline.com/eol_images/Entire_Site/2016115/rs_634x1024-160215153706-634-2016-Grammy-Awards-taylor-swift.jpg?fit=around%7C634:1024&output-quality=90&crop=634:1024;center,top',
      moment: {
        context:
          "E! Online's red-carpet coverage that night singled out the new haircut alongside the outfit as the story of her look — a straight, blunt-cut bob with heavy fringe, debuted against custom Versace on the biggest carpet of the year, and a hard break from the long waves that had defined the era's first eighteen months.\n\nIt was also step one of a fast transformation: within three months the same blunt length had been bleached platinum and paired with dark burgundy lips for the \"Manus x Machina\" Met Gala, the sharper beauty pivot The Hollywood Reporter documented that May — a bob-with-bangs silhouette she'd keep returning to in the years after.",
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/740307/taylor-swift-s-grammys-2016-red-carpet-outfit-looks-very-familiar-and-this-is-why',
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/lifestyle/style/taylor-swifts-met-gala-2016-888011/',
          },
        ],
        photos: [{ url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2016115/rs_634x1024-160215153706-634-2016-Grammy-Awards-taylor-swift.jpg?fit=around%7C634:1024&output-quality=90&crop=634:1024;center,top', credit: 'Jason Merritt/Getty Images for NARAS', focalPoint: '48% 10%' }],
        // Shop pass (2026-07-21): a haircut, not a garment -- offering the
        // styling tool used to maintain a blunt, straight bob rather than
        // forcing a clothing link onto a hair item.
        products: [
          {
            brand: 'ghd',
            item: 'Original Styler 1" Flat Iron Hair Straightener',
            retailer: 'amazon.com',
            url: 'https://www.amazon.com/Ghd-Original-Styler-Straightener-Professional/dp/B09P4SVXK4',
            price: '$191.00',
            isAlternative: true,
            altNote: 'Not her exact styling tool (undocumented) -- a professional flat iron suited to keeping a blunt, straight bob like this one sleek.',
          },
        ],
      },
    },
    {
      year: 2016,
      month: 8,
      category: 'fashion',
      title: 'Denim overall-dress street style on a New York afternoon',
      snippet: 'A cutoff denim overall dress over a coral tank, worn with white sneakers for a walk through the city — the off-duty, un-styled half of her public image.',
      sourceUrl: 'https://www.eonline.com/photos/25013/taylor-swift-s-new-york-city-style',
      thumbnailUrl: 'https://akns-images.eonline.com/eol_images/Entire_Site/201678/rs_634x1024-160808163309-634taylor-swift-nyc-demin-overalls.jpg',
      moment: {
        context:
          'E!\'s long-running New York City style gallery filed the August 2016 look under "Denim Daredevil": a cutoff denim overall dress worn over a pink tank — "a fun summer outfit" in the gallery\'s words — with white sneakers keeping it fully off-duty.\n\nIt\'s one of a long run of paparazzi-caught New York street-style looks E! Online has tracked across the era — casual denim, sneakers, and minimal styling as the deliberate counterpoint to the much more constructed red-carpet image from the same period, when even a sidewalk errand got the full photo-gallery treatment.',
        sources: [
          { outlet: 'E! Online', url: 'https://www.eonline.com/photos/25013/taylor-swift-s-new-york-city-style' },
        ],
        photos: [{ url: 'https://akns-images.eonline.com/eol_images/Entire_Site/201678/rs_634x1024-160808163309-634taylor-swift-nyc-demin-overalls.jpg', credit: 'Kristin Callahan/ACE/INFphoto.com' }],
        // Shop pass (2026-07-21): the exact denim piece is undocumented
        // past this street-style sighting -- a current denim overall
        // dress, verified in stock, closest real match.
        products: [
          {
            brand: 'Copper Union Apparel',
            item: 'Denim Overall Dress',
            retailer: 'copperunionapparel.com',
            url: 'https://copperunionapparel.com/products/denim-overall-dress',
            price: '$153.00',
            isAlternative: true,
            altNote: 'No designer was ever named for this street-style sighting -- this is a current denim overall dress in the same off-duty spirit.',
          },
        ],
      },
    },

    // --- Fashion/photo depth pass 2 (2026-07-04)
    {
      year: 2016,
      month: 5,
      day: 2,
      category: 'fashion',
      title: 'A silver snakeskin Louis Vuitton mini co-chairing the 2016 Met Gala',
      snippet:
        'Co-chairing the "Manus x Machina" Met Gala alongside Idris Elba and Anna Wintour, she wore a sequined Louis Vuitton mini with a snakeskin pattern, leather panels, and a cutout waist, finished with a platinum bob and burgundy lipstick.',
      sourceUrl: 'https://www.hollywoodreporter.com/lifestyle/style/taylor-swifts-met-gala-2016-888011/',
      thumbnailUrl: 'https://www.hollywoodreporter.com/wp-content/uploads/2016/05/gettyimages-527338016.jpg?w=2000&h=1126&crop=1',
      moment: {
        context:
          'The May 2, 2016 gala\'s theme, "Manus x Machina: Fashion in an Age of Technology," was reflected in the dress\'s tiered ruffled skirt and space-age-leaning silver texture.\n\nShe paired it with strappy gladiator heels; her platinum-blonde bob and dark burgundy lip and nails marked a sharper, edgier beauty look than her usual red-carpet glam.',
        sources: [
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/lifestyle/style/taylor-swifts-met-gala-2016-888011/',
          },
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/news/a20287/taylor-swift-met-gala-dress-2016/',
          },
        ],
        photos: [
          {
            url: 'https://www.hollywoodreporter.com/wp-content/uploads/2016/05/gettyimages-527338016.jpg?w=2000&h=1126&crop=1',
            credit: 'Larry Busacca/Getty Images',
          },
        ],
        // Shop pass (2026-07-21): the exact 2016 Louis Vuitton mini is
        // discontinued -- a current silver snake-print sequin mini,
        // verified in stock, closest real match.
        products: [
          {
            brand: 'EDGEbyks',
            item: 'Serene Snake Print Sequin Mini Dress',
            retailer: 'edgebyks.com',
            url: 'https://edgebyks.com/products/snake-print-sequin-mini-dress',
            price: '$27.99',
            isAlternative: true,
            altNote: 'Her exact 2016 Louis Vuitton mini is discontinued -- this is a current silver snake-print sequin mini in the same reptile-texture spirit.',
          },
        ],
      },
    },
    {
      year: 2015,
      month: 5,
      day: 17,
      category: 'fashion',
      title: '"Bad Blood" video\'s warrior makeup: winged eyes and a red lip by Lorrie Turk',
      snippet:
        'For the video\'s final battle scene, longtime makeup artist Lorrie Turk built a dramatic smoky eye — black and midnight-blue shadow with exaggerated winged liner — paired with a bold red lip.',
      sourceUrl: 'https://www.birchbox.com/magazine/article/taylor-swift-bad-blood-music-video-makeup',
      thumbnailUrl:
        'https://images.prismic.io/birchbox/MDFhZjY0OWUtZTM3MS00MDkxLThmOGQtMzAxNTU0MGZhMDc2_may-taylor-swift-bad-blood-700x400.jpg',
      moment: {
        context:
          'Lorrie Turk, Swift\'s regular makeup artist, is credited on the "Bad Blood" video (with Jemma Muradian on hair).\n\nThe finale look layered black and midnight-blue eyeshadow with gunpowder-grey liner smudged along both lash lines, multiple coats of mascara plus false lashes top and bottom, and a precisely applied red lip — the "warrior" beauty look tying together the video\'s ensemble cast of characters.',
        sources: [
          {
            outlet: 'Birchbox',
            url: 'https://www.birchbox.com/magazine/article/taylor-swift-bad-blood-music-video-makeup',
          },
        ],
        photos: [
          {
            url: 'https://images.prismic.io/birchbox/MDFhZjY0OWUtZTM3MS00MDkxLThmOGQtMzAxNTU0MGZhMDc2_may-taylor-swift-bad-blood-700x400.jpg',
            credit: 'Birchbox',
          },
        ],
        // Shop pass (2026-07-21): a makeup look, not a garment -- offering
        // the iconic red lipstick shade rather than forcing a clothing
        // link onto a beauty item.
        products: [
          {
            brand: 'MAC',
            item: 'Retro Matte Lipstick in Ruby Woo',
            retailer: 'maccosmetics.com',
            url: 'https://www.maccosmetics.com/product/13854/52593/products/makeup/lips/lipstick/retro-matte-lipstick',
            price: '$23.00',
            isAlternative: true,
            altNote: 'The exact shade Lorrie Turk used is undocumented -- Ruby Woo is MAC\'s iconic blue-red matte, the same bold-red finish described for the video\'s warrior look.',
          },
        ],
      },
    },

    // --- Sightings depth pass (2026-07-05): candid, real-world public-
    // appearance moments per the founder's request — squad outings, July 4th
    // Rhode Island parties, Calvin Harris/Tom Hiddleston dating-era candids,
    // and an airport look. Every photo URL hotlinked to the outlet's own CDN
    // and checked for a 2xx image response before being added.
    {
      year: 2014,
      month: 7,
      category: 'sighting',
      title: 'A rain-soaked Fourth of July family portrait in Rhode Island',
      snippet:
        "Emma Stone, Lena Dunham, and a Slip 'N Slide built to fight the rain — the first of what became an annual squad tradition at her Rhode Island beach house.",
      sourceUrl: 'https://www.eonline.com/news/557177/taylor-swift-has-amazing-fourth-of-july-weekend-poses-for-family-portrait-with-9-pals-see-the-photos',
      thumbnailUrl: 'https://jj-justjared-media.s3.amazonaws.com/wp-content/uploads/2014/07/swift-king/taylor-swift-emma-stone-fourth-of-july-weekend-04.jpg',
      moment: {
        context:
          "Swift hosted Emma Stone, Jaime King, Ingrid Michaelson, Jessica Stam, Jessica Szohr, and Girls creator Lena Dunham, among others, for the 2014 holiday weekend at her Rhode Island house.\n\nRain didn't stop the group — they built a giant Slip 'N Slide, baked an American-flag cake, and posed for a group \"family portrait\" that Dunham photobombed with a mock scowl and a raised middle finger. \"When the 4th of July gives you nonstop rain, make a giant slip n slide,\" Swift captioned one photo. Dunham called the weekend her personal Coachella.",
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/557177/taylor-swift-has-amazing-fourth-of-july-weekend-poses-for-family-portrait-with-9-pals-see-the-photos',
          },
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/864384/taylor-swift-s-4th-of-july-party-squad-a-visual-guide',
          },
        ],
        // Image-fix pass (2026-07-10): #173 — old photo was a Slip 'N Slide action shot
        // (a guest on an inflatable turtle), not the posed "family portrait." Swapped for
        // Just Jared's actual full-resolution group couch photo from the same weekend (curl-
        // verified 200/image-jpeg, downloaded and visually confirmed the full posed squad,
        // Taylor included, on a couch — matching the moment's "family portrait" description).
        photos: [{ url: 'https://jj-justjared-media.s3.amazonaws.com/wp-content/uploads/2014/07/swift-king/taylor-swift-emma-stone-fourth-of-july-weekend-04.jpg', credit: 'Just Jared', kind: 'archival', caption: "The posed \"family portrait\" from the rain-soaked July 2014 Rhode Island weekend." }],
      },
    },
    {
      year: 2015,
      month: 4,
      day: 2,
      category: 'sighting',
      title: 'Hand in hand after a HAIM show at the Troubadour — the first Calvin Harris sighting',
      snippet:
        'Weeks before either confirmed it, paparazzi caught Taylor and Calvin Harris holding hands leaving a HAIM concert at West Hollywood\'s Troubadour — the sighting that kicked off the dating rumors.',
      sourceUrl: 'https://www.eonline.com/photos/17305/taylor-swift-calvin-harris-romance-rewind',
      thumbnailUrl: 'https://akns-images.eonline.com/eol_images/Entire_Site/201533/rs_634x1024-150403050319-634.Taylor-Swift-Calvin-Harris-JR-4315.jpg',
      moment: {
        context:
          'In early April 2015, weeks after they met at the BRIT Awards, Swift and Harris were photographed holding hands as they left a HAIM show at the Troubadour in West Hollywood — one of the first sightings that fueled dating rumors ahead of their public confirmation at the Billboard Music Awards that May.\n\nThe Troubadour photos fit a courtship that had been running just below the surface for weeks: Ellie Goulding had played matchmaker at the Elle Style Awards in London that February, the two were spotted flirting at a BRITs afterparty the next night, and Harris had posted a photo of Swift\'s cats to Instagram days before the concert — the kind of breadcrumb fans were already reading as confirmation.',
        sources: [
          { outlet: 'E! Online', url: 'https://www.eonline.com/photos/17305/taylor-swift-calvin-harris-romance-rewind' },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/taylor-swift-calvin-harris-relationship-183259939.html',
          },
        ],
        photos: [{ url: 'https://akns-images.eonline.com/eol_images/Entire_Site/201533/rs_634x1024-150403050319-634.Taylor-Swift-Calvin-Harris-JR-4315.jpg', credit: 'MEP/Splash News' }],
      },
    },
    {
      year: 2015,
      month: 5,
      day: 28,
      category: 'sighting',
      title: "Gigi Hadid and Karlie Kloss stop by the NYC apartment for a night in",
      snippet:
        "Gigi Hadid, Karlie Kloss, Lena Dunham, and Jack Antonoff swing by Taylor's New York apartment on a Thursday night — the low-key, at-home counterpart to the era's red-carpet squad appearances.",
      sourceUrl: 'https://www.justjaredjr.com/2015/05/29/gigi-hadid-karlie-kloss-stop-by-taylor-swifts-nyc-party/',
      thumbnailUrl: 'https://jj-justjaredjr-media.s3.amazonaws.com/wp-content/uploads/2015/05/taylor-studded/taylor-swift-hosts-star-studded-party-at-her-nyc-apartment-02.JPG',
      moment: {
        context:
          "Gigi Hadid and Karlie Kloss were photographed arriving at Taylor's Manhattan apartment on Thursday night, May 28, 2015, along with Lena Dunham and Jack Antonoff — a quieter, at-home counterpart to the era's red-carpet squad appearances.\n\nThe paparazzi shots outside caught the details anyway: Gigi in Blue Life FIT leggings, Karlie carrying a Dolce & Gabbana handbag — enough for Just Jared to run the arrivals as a photo set of their own, which was the era's squad culture in miniature: even a Thursday night in was coverage.",
        sources: [
          {
            outlet: 'Just Jared Jr.',
            url: 'https://www.justjaredjr.com/2015/05/29/gigi-hadid-karlie-kloss-stop-by-taylor-swifts-nyc-party/',
          },
          {
            outlet: 'Just Jared',
            url: 'https://www.justjared.com/photo-gallery/3380957/taylor-swift-hosts-star-studded-party-at-her-nyc-apartment-04/',
          },
        ],
        // Image-fix pass (2026-07-10): #160 — old URL was an 80x120px /thumbs/ crop that,
        // at full size, actually shows Lena Dunham, not Gigi Hadid or Karlie Kloss. Checked
        // the full-res sibling images in the same Just Jared set (dropping /thumbs/ from the
        // path) and found -02.JPG actually shows Gigi Hadid arriving; curl-verified 200/
        // image-jpeg at full resolution, downloaded and visually confirmed her face/outfit.
        photos: [{ url: 'https://jj-justjaredjr-media.s3.amazonaws.com/wp-content/uploads/2015/05/taylor-studded/taylor-swift-hosts-star-studded-party-at-her-nyc-apartment-02.JPG', credit: 'Just Jared Jr.', kind: 'archival', caption: 'Gigi Hadid arriving at the party, May 28, 2015.' }],
      },
    },
    {
      year: 2015,
      month: 7,
      day: 4,
      category: 'sighting',
      title: 'Matching flag onesies for the Fourth of July, Calvin Harris included',
      snippet:
        'Gigi Hadid and Joe Jonas brought American-flag onesies for the whole group; Ed Sheeran, the HAIM sisters, and boyfriend Calvin Harris rounded out the guest list at the Rhode Island beach house.',
      sourceUrl: 'https://www.eonline.com/news/673098/10-reasons-why-taylor-swift-s-fourth-of-july-celebration-was-better-than-anyone-else-s-party',
      thumbnailUrl: 'https://akns-images.eonline.com/eol_images/Entire_Site/201563/rs_600x600-150703170056-600.Taylor-Swift-Calvin-Harris-Instagram.ms.070315.JPG',
      moment: {
        context:
          "The 2015 edition of Swift's Rhode Island Independence Day tradition drew Calvin Harris (her boyfriend at the time), Ed Sheeran, Joe Jonas, Nick Jonas, Gigi Hadid, brother Austin Swift, and the HAIM sisters.\n\nHadid and Jonas brought matching American-flag onesies for the group, and the party featured what E! called \"the biggest inflatable slide,\" piggyback rides, and Swift doing the cooking, under sunny East Coast weather ahead of that evening's fireworks.",
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/673098/10-reasons-why-taylor-swift-s-fourth-of-july-celebration-was-better-than-anyone-else-s-party',
          },
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/864384/taylor-swift-s-4th-of-july-party-squad-a-visual-guide',
          },
        ],
        // Image-fix pass (2026-07-10): #170 — old photo was the famous towel-jump shot,
        // which shows neither onesies nor Calvin Harris. The onesie Polaroids Taylor posted
        // that weekend have since been deleted from Instagram and aren't recoverable on an
        // allowlisted host, so swapped for E! Online's own photo of Calvin Harris giving her
        // a piggyback ride, dated July 3, 2015 (the same party) — curl-verified 200/image-
        // jpeg, downloaded and visually confirmed both of them together; caption corrected
        // to describe what's actually shown rather than implying onesies.
        photos: [{ url: 'https://akns-images.eonline.com/eol_images/Entire_Site/201563/rs_600x600-150703170056-600.Taylor-Swift-Calvin-Harris-Instagram.ms.070315.JPG', credit: 'E! Online / Instagram', kind: 'archival', caption: 'Calvin Harris giving Taylor a piggyback ride at the July 3, 2015 Rhode Island Independence Day party — the same weekend as the group\'s flag-onesie photos.' }],
      },
    },
    {
      year: 2016,
      month: 6,
      day: 15,
      category: 'sighting',
      title: 'Caught kissing on a Rhode Island beach — the first Hiddleswift sighting',
      snippet:
        'Weeks after the Calvin Harris breakup, paparazzi photographed Taylor and Tom Hiddleston kissing on a beach in Westerly, Rhode Island — the candid that broke the story before either side said a word.',
      sourceUrl: 'https://www.eonline.com/photos/19032/taylor-swift-tom-hiddleston-romance-rewind',
      thumbnailUrl: 'https://akns-images.eonline.com/eol_images/Entire_Site/2016518/rs_634x1024-160618144035-634.Tom-Hiddleston-Taylor-Swift-Beach-kiss.tt.061816.jpg',
      moment: {
        context:
          'On June 15, 2016, Swift and Hiddleston were photographed kissing on a beach in Westerly, Rhode Island — the first public sighting of their relationship, surfacing just weeks after her split from Calvin Harris and shortly after she and Hiddleston met at the 2016 Met Gala.\n\nThe pictures broke the story before either Swift or Hiddleston commented publicly — a rarity for a relationship this photographed, where nearly every later beat, from Rome to the Gold Coast, played out with the two visibly unbothered by the cameras.',
        sources: [
          { outlet: 'E! Online', url: 'https://www.eonline.com/photos/19032/taylor-swift-tom-hiddleston-romance-rewind' },
          {
            outlet: 'Hello!',
            url: 'https://www.hellomagazine.com/celebrities/877239/why-tom-hiddleston-really-split-from-taylor-swift-after-whirlwind-three-month-romance/',
          },
        ],
        photos: [{ url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2016518/rs_634x1024-160618144035-634.Tom-Hiddleston-Taylor-Swift-Beach-kiss.tt.061816.jpg', credit: 'TheImageDirect.com' }],
      },
    },
    {
      year: 2016,
      month: 6,
      day: 27,
      category: 'sighting',
      title: 'Sightseeing at the Colosseum, hand in hand, in matching outfits',
      snippet:
        "Two weeks into the relationship, Taylor and Tom Hiddleston toured Rome's Colosseum in coordinated ensembles, photographed holding hands through the cobblestone streets.",
      sourceUrl: 'https://www.eonline.com/photos/19032/taylor-swift-tom-hiddleston-romance-rewind',
      thumbnailUrl: 'https://akns-images.eonline.com/eol_images/Entire_Site/2016528/rs_634x1024-160628080313-634.Taylor-Swift-Tom-Hiddleston-Rome-JR-062816.jpg',
      moment: {
        context:
          "On June 27, 2016, Swift and Hiddleston were photographed sightseeing at Rome's Colosseum, wearing matching ensembles and holding hands throughout.\n\nIt was part of a European stretch of the relationship that also took them to Hiddleston's family home in Suffolk, England, before they returned to the U.S. for her Fourth of July party in Rhode Island.",
        sources: [{ outlet: 'E! Online', url: 'https://www.eonline.com/photos/19032/taylor-swift-tom-hiddleston-romance-rewind' }],
        photos: [{ url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2016528/rs_634x1024-160628080313-634.Taylor-Swift-Tom-Hiddleston-Rome-JR-062816.jpg', credit: 'INFphoto.com' }],
      },
    },
    {
      year: 2016,
      month: 7,
      day: 6,
      category: 'sighting',
      title: 'Matching outfits through LAX, hours before a flight to Australia',
      snippet:
        'Navy jackets for both of them — Taylor in a blue plaid skirt, Tom in a white v-neck tee — as they moved through Los Angeles International Airport the morning of a flight to Australia.',
      sourceUrl: 'https://www.hellomagazine.com/celebrities/2016070732300/taylor-swift-tom-hiddleston-matching-outfits-airport/',
      thumbnailUrl: 'https://images.hellomagazine.com/horizon/original_aspect_ratio/a6f6cfa25b82-taylor-a.jpg',
      moment: {
        context:
          'On July 6, 2016, Swift and Hiddleston were photographed moving through LAX in coordinating navy jackets — she in a blue plaid skirt with flats, he in a white v-neck T-shirt — with his arm around her as they made their way through the terminal.\n\nThey were bound for Australia, where Hiddleston was filming, and touched down still wearing the same matching looks the next day.',
        sources: [
          {
            outlet: 'Hello!',
            url: 'https://www.hellomagazine.com/celebrities/2016070732300/taylor-swift-tom-hiddleston-matching-outfits-airport/',
          },
        ],
        photos: [{ url: 'https://images.hellomagazine.com/horizon/original_aspect_ratio/a6f6cfa25b82-taylor-a.jpg', credit: 'Rex' }],
      },
    },

    // --- Business/chart/music depth pass (2026-07-05): the era's business
    // category was thin (1 item) for the decade's biggest-selling album, so
    // this batch digs into its Grammy, RIAA, streaming-economics, and tour
    // milestones, plus one more on-record songwriting backstory. Every claim
    // verified against its cited source directly; every photo URL checked
    // for a 2xx image response before being added.
    {
      year: 2016,
      month: 2,
      day: 15,
      category: 'business',
      significance: 'defining', // first woman to win AOTY twice — a historic record (docs/decisions.md, 2026-07-19)
      title: '1989 wins Album of the Year — making her the first woman to win it twice',
      snippet:
        '"There are going to be people along the way who will try to undercut your success or take credit for your accomplishments or your fame" — her message to young women, accepting music\'s top prize for the second time.',
      sourceUrl: 'https://www.billboard.com/music/awards/taylor-swift-album-of-the-year-speech-credit-for-fame-6875390/',
      thumbnailUrl: 'https://ra-grammy-media.ncp.consulting/uploads/2026/05/Grammy-Rewind_Taylor-Swift_Hero_1920x1080.avif',
      relatedIds: [
        'moment:vault-1989-the-night-famous-premiered-and-she-said-no',
        'moment:vault-fearless-fearless-makes-her-the-youngest-album-of-the-year-winner-for',
      ],
      moment: {
        context:
          'At the Feb. 15, 2016 ceremony, 1989 won Album of the Year at the 58th Grammy Awards (also winning Best Pop Vocal Album), making Swift the first woman in Grammy history to win Album of the Year twice — her first was for Fearless in 2010. She thanked the fans for "the last 10 years" and producer Max Martin in the same speech.\n\nThe speech\'s pointed center — the warning to young women about people who "will try to undercut your success or take credit for your accomplishments or your fame" — was widely read as her answer to Kanye West\'s "Famous," released days earlier, in which he rapped about having made her famous. She never said his name; the room, and Billboard\'s coverage that night, understood exactly who she meant.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/awards/taylor-swift-album-of-the-year-speech-credit-for-fame-6875390/',
          },
          {
            outlet: 'Grammy.com',
            url: 'https://www.grammy.com/news/taylor-swift-1989-album-of-the-year-win-2016-grammys-acceptance-speech-video-rewind/',
          },
        ],
        // Photo-enrichment run 11 (2026-07-18, #762): focal point set by
        // viewing — press-room shot, three gramophones at chest height,
        // face centered high.
        photos: [
          {
            url: 'https://ra-grammy-media.ncp.consulting/uploads/2026/05/Grammy-Rewind_Taylor-Swift_Hero_1920x1080.avif',
            credit: 'The Recording Academy',
            focalPoint: '50% 22%',
          },
          // Photo pass 2026-07-19 (10-defining-events, docs/decisions.md):
          // every real, verified photo found from the Feb. 15, 2016 ceremony.
          {
            url: 'https://i.guim.co.uk/img/media/338849e33c7e6b53df14a7f5a00183b2a31d1203/0_48_2640_1584/master/2640.jpg?crop=none&dpr=1&s=none&width=465',
            focalPoint: '55% 42%',
            credit: 'Stringer/Reuters, via The Guardian',
            caption: 'Swift stands on the Grammy stage during the ceremony where 1989 won Album of the Year.',
            kind: 'primary',
          },
          {
            url: 'https://static.time.com/v3/assets/bltea6093859af6183b/blt4200ccf647ed3548/69888f30428a9ed09ecd23bd/taylor-swift-success-double-standard-women.jpg?branch=production&width=3840&quality=75&auto=webp&crop=3%3A2',
            focalPoint: '50% 30%',
            credit: 'Mark Ralston/AFP/Getty Images, via TIME',
            caption: 'Swift holds her three trophies in the press room after the 58th Grammy Awards.',
            kind: 'primary',
          },
          {
            url: 'https://static.time.com/v3/assets/bltea6093859af6183b/blt5ccf62fadac5fa4d/69887dac8e0601bf454649de/grammys-red-carpet-lead.jpg?branch=production&width=3840&quality=75&auto=webp&crop=3%3A2',
            focalPoint: '42% 50%',
            credit: 'Steve Granitz/Getty Images, via TIME',
            caption: 'Selena Gomez and Swift pose together on the red carpet before the 58th Grammy Awards.',
            kind: 'primary',
          },
          {
            url: 'https://static.time.com/v3/assets/bltea6093859af6183b/blta95b1ab48ade842b/69887da62dce016f4f9e7d02/taylor-swift-grammys-performance.jpg?branch=production&width=3840&quality=75&auto=webp&crop=3%3A2',
            focalPoint: '50% 30%',
            credit: 'Robyn Beck/AFP/Getty Images, via TIME',
            caption: 'Swift opens the 58th Grammy Awards with "Out of the Woods."',
            kind: 'primary',
          },
          {
            url: 'https://media.vanityfair.com/photos/56c278c5a76c406e241cfa0e/master/w_2560%2Cc_limit/a-taylor-swift-grammys-2016-performance.jpg',
            focalPoint: '48% 30%',
            credit: 'WireImage/Getty Images, via Vanity Fair',
            caption: 'Swift accepts Album of the Year for 1989 on the Grammy stage with her collaborators behind her.',
            kind: 'primary',
          },
          {
            url: 'https://media.vanityfair.com/photos/6973c38b8d6b50621a0c2414/master/w_1024%2Cc_limit/taylor-swift-grammys-red-carpet-2016.jpg',
            focalPoint: '50% 12%',
            credit: 'Jason Merritt/Getty Images, via Vanity Fair',
            caption: 'Swift poses on the Grammy red carpet in her orange-and-pink Versace ensemble.',
            kind: 'primary',
          },
          {
            url: 'https://assets.teenvogue.com/photos/56c2618a92a7d1d17a722124/master/w_1024%2Cc_limit/GettyImages-510439952.jpg',
            focalPoint: '51% 15%',
            credit: 'AFP/Getty Images, via Teen Vogue',
            caption: 'A second full-length red-carpet angle shows Swift\'s Versace crop top and split ball skirt.',
            kind: 'primary',
          },
          {
            url: 'https://assets.teenvogue.com/photos/56c2618992a7d1d17a722120/master/w_1024%2Cc_limit/GettyImages-510439902.jpg',
            focalPoint: '56% 16%',
            credit: 'AFP/Getty Images, via Teen Vogue',
            caption: 'A separate red-carpet close-up shows Swift\'s bob haircut and jeweled choker at the 2016 Grammys.',
            kind: 'primary',
          },
          {
            url: 'https://assets.teenvogue.com/photos/56c2618ae9ea465e7cf5b563/master/w_1024%2Cc_limit/GettyImages-510439964.jpg',
            focalPoint: '38% 52%',
            credit: 'Getty Images for NARAS, via Teen Vogue',
            caption: 'A Grammy red-carpet detail frame shows Swift\'s metallic manicure and matching cocktail ring.',
            kind: 'primary',
          },
          {
            url: 'https://assets.teenvogue.com/photos/56c2618ce9ea465e7cf5b567/master/w_1024%2Cc_limit/GettyImages-510439972.jpg',
            focalPoint: '54% 60%',
            credit: 'Getty Images for NARAS, via Teen Vogue',
            caption: 'A separate detail frame shows the metallic platform sandals worn with Swift\'s 2016 Grammy look.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 3,
      day: 13,
      category: 'business',
      title: '"Shake It Off" becomes her first Diamond-certified single',
      snippet:
        'Crossing 10 million units in the U.S. made her the first female artist in history to hold both a Diamond-certified single and a Diamond-certified album.',
      sourceUrl: 'https://www.forbes.com/sites/bryanrolli/2020/03/14/taylor-swift-shake-it-off-riaa-diamond-certification/',
      thumbnailUrl: 'https://imageio.forbes.com/specials-images/imageserve/1189862274/Taylor-Swift-Shake-It-Off-RIAA-Diamond/0x0.jpg?width=960',
      moment: {
        context:
          'The RIAA certified "Shake It Off" Diamond on March 13, 2020, for surpassing 10 million combined sales-and-streaming units — her first single to reach that tier, following Fearless\'s Diamond album certification in December 2017.\n\nAt the time, 1989\'s other singles stood at 8x Platinum ("Blank Space") and 6x Platinum ("Bad Blood"), with "Wildest Dreams" at 4x Platinum and the album itself certified 9x Platinum.',
        sources: [
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/bryanrolli/2020/03/14/taylor-swift-shake-it-off-riaa-diamond-certification/',
          },
          {
            outlet: 'Headline Planet',
            url: 'https://headlineplanet.com/home/2020/03/14/taylor-swifts-shake-it-off-earns-diamond-certification-in-us-lover-album-reaches-2x-platinum/',
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2023/10/10/taylor-swifts-1989-songs-ranked/',
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added the ballerina frame from the
        // official Shake It Off video (id oEmbed-verified against @TaylorSwift; 480px frame,
        // downloaded and visually confirmed). Per-image focal points set by viewing each image.
        photos: [
          {
            url: 'https://imageio.forbes.com/specials-images/imageserve/1189862274/Taylor-Swift-Shake-It-Off-RIAA-Diamond/0x0.jpg?width=960',
            credit: 'Forbes',
            focalPoint: '45% 24%',
          },
          {
            url: 'https://i.ytimg.com/vi/nfWlot6h_JM/hq2.jpg',
            credit: 'Big Machine Records / Taylor Swift via YouTube',
            kind: 'archival',
            focalPoint: '52% 48%',
            caption: "The swan-tutu ballerina scene from the official 'Shake It Off' video — the single that, six years on, became her first Diamond-certified song.",
          },
        ],
      },
    },
    {
      year: 2025,
      month: 9,
      day: 30,
      category: 'business',
      title: '1989 itself goes Diamond, joining Fearless as her second 10-million-unit album',
      snippet:
        'Certified 14x Platinum by the RIAA — crossing the 10-million-unit Diamond threshold and putting her among a small group of women, including Adele, Mariah Carey, and Whitney Houston, with a Diamond album.',
      sourceUrl: 'https://www.aol.com/articles/only-30-albums-women-certified-202930018.html',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f6/Taylor_Swift_-_1989.png',
      moment: {
        context:
          'The RIAA certified 1989 14x Platinum on Sept. 30, 2025 — clearing the 10x-Platinum Diamond threshold (10 million combined sales-and-streaming units) almost eleven years after release, and making it Swift\'s second Diamond album after Fearless (certified in December 2017).\n\nThe company is thin: only 31 albums by women or female-fronted acts have ever gone Diamond, and the double puts her alongside Madonna, Whitney Houston, Mariah Carey, Celine Dion, Shania Twain, Britney Spears, Adele, and The Chicks among the women with more than one — with Twain and Houston leading at three apiece.',
        sources: [
          { outlet: 'AOL', url: 'https://www.aol.com/articles/only-30-albums-women-certified-202930018.html' },
          { outlet: 'RIAA Gold & Platinum Database', url: 'https://www.riaa.com/gold-platinum/?tab_active=default-award&ar=Taylor+Swift&ti=1989' },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added GabboT's Ford Field shot of the
        // 1989 World Tour (Commons license API-verified CC BY-SA 2.0; downloaded and
        // visually confirmed the 1989-era look). Focal points set per image by viewing.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/f6/Taylor_Swift_-_1989.png',
            credit: 'Big Machine Records',
            focalPoint: '50% 38%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Taylor_Swift_-_The_1989_World_Tour_-_Ford_Field_003_%28cropped%29.jpg',
            credit: 'GabboT / Wikimedia Commons, CC BY-SA 2.0',
            kind: 'archival',
            focalPoint: '46% 10%',
            caption: 'Performing "Welcome to New York" at Ford Field in Detroit, May 30, 2015 — the era whose album crossed the Diamond line a decade later.',
          },
        ],
      },
    },
    {
      significance: 'notable', // a genuinely bold, industry-shaping stand on artist compensation, years ahead of the wider streaming-payout conversation (docs/decisions.md, 2026-07-19)
      year: 2014,
      month: 11,
      day: 3,
      category: 'business',
      title: 'Pulls her entire catalog from Spotify',
      snippet:
        "Days after 1989's record-breaking opening week, her label withdrew everything — arguing free, ad-supported streaming undermined the paid tier that pays songwriters and artists more.",
      sourceUrl: 'https://money.cnn.com/2014/11/03/media/taylor-swift-spotify/index.html',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Taylor_Swift_045_%2817682880264%29_%28cropped%29.jpg',
      moment: {
        context:
          'On Nov. 3, 2014, Big Machine Records pulled Swift\'s full back catalog from Spotify, a week after 1989 released without ever appearing on the service. It followed a July 2014 Wall Street Journal op-ed in which she argued that "music should not be free"; she spelled out her objection to Spotify\'s ad-supported free tier in interviews that November.\n\nDays later, Big Machine\'s Scott Borchetta told radio host Nikki Sixx the label didn\'t want to disrespect fans who\'d paid for the album while friends streamed it free: "We\'re being completely disrespectful to that superfan who wants to invest."',
        sources: [
          { outlet: 'CNN Money', url: 'https://money.cnn.com/2014/11/03/media/taylor-swift-spotify/index.html' },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/music/music-news/big-machines-scott-borchetta-explains-747781/',
          },
        ],
        // Image-fix pass (2026-07-10): #162 / #146 — old photo (Forbes-hosted, filename says
        // "swift_taylor_2007") was a 7-years-off debut-era shot: curly hair, acoustic guitar,
        // country styling — nothing like 1989-era Taylor. Swapped for a Commons "own work"
        // photo of her onstage on the 1989 World Tour, short bob included (CC BY-SA 2.0,
        // GabboT); curl-verified 200/image-jpeg, downloaded and visually confirmed the
        // correct 1989-era look.
        // Photo-enrichment pass (2026-07-18, #762): deliberately kept at one photo — the
        // moment is a label decision with no photographable event; era-correct archival
        // tour shot already covers it, and the only Nov-2014 news art is agency/watermarked.
        photos: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Taylor_Swift_045_%2817682880264%29_%28cropped%29.jpg', credit: 'GabboT / Wikimedia Commons, CC BY-SA 2.0', kind: 'archival', focalPoint: '42% 24%', caption: 'Onstage on the 1989 World Tour, 2015 — the short-bob 1989 era, not the 2007 photo this story previously used.' }],
      },
    },
    {
      significance: 'notable', // one artist's open letter changed a trillion-dollar company's policy in under 24 hours — a real, outsized moment of industry leverage (docs/decisions.md, 2026-07-19)
      year: 2015,
      month: 6,
      day: 21,
      category: 'business',
      title: '"To Apple, Love, Taylor" — an open letter reverses Apple Music\'s royalty policy in under a day',
      snippet:
        '"We don\'t ask you for free iPhones. Please don\'t ask us to provide you with our music for no compensation" — a Tumblr post that got Apple to pay artists during its free trial period.',
      sourceUrl: 'https://stereogum.com/1810310/read-taylor-swifts-open-letter-to-apple-music/news',
      thumbnailUrl: 'https://lede-admin.stereogum.com/wp-content/uploads/sites/64/2015/06/Taylor-Swift-Shake-It-Off-640x423.jpg',
      moment: {
        context:
          'Swift published the letter on Tumblr on Sunday, June 21, 2015, announcing she was withholding 1989 from Apple Music and objecting to the plan not to pay royalties during the three-month free trial. She insisted it wasn\'t about her: "This is about the new artist or band that has just released their first single and will not be paid for its success."\n\nApple\'s Eddy Cue later described reading the letter that morning — "it solidified quickly that we needed a change" — and by that night he had announced the reversal on Twitter, conceding the trial structure "was clearly something that was not working." Less than 24 hours from Tumblr post to policy change; 1989 subsequently went up on the service.',
        sources: [
          { outlet: 'Stereogum', url: 'https://stereogum.com/1810310/read-taylor-swifts-open-letter-to-apple-music/news' },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/apple-exec-eddy-cue-why-taylor-swift-was-right-39608/',
          },
        ],
        // Focal point (#762): tight 'Shake It Off' frame, her face fills the upper-center of the shot.
        photos: [{ url: 'https://lede-admin.stereogum.com/wp-content/uploads/sites/64/2015/06/Taylor-Swift-Shake-It-Off-640x423.jpg', credit: 'Stereogum', focalPoint: '48% 30%' }],
      },
    },
    {
      year: 2015,
      month: 12,
      day: 12,
      category: 'tour',
      title: 'The 1989 World Tour closes in Melbourne: 85 shows, $250.7 million, 2.28 million tickets',
      snippet:
        '"This has been the most incredible adventure" — eight months, 53 cities, 78 guest cameos, and the highest-grossing tour in the world for 2015.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_1989_World_Tour',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Taylor_Swift_AAMI_Park_20151212_01.jpg/1280px-Taylor_Swift_AAMI_Park_20151212_01.jpg',
      moment: {
        context:
          'The tour wrapped its third Melbourne show at AAMI Park on Dec. 12, 2015, having run 85 shows across 53 cities in 10 countries since opening in Tokyo that May.\n\nFinal tallies: $250.7 million grossed and 2,278,647 tickets sold (100% of capacity) — Pollstar\'s highest-grossing tour worldwide for 2015. Swift posted a farewell photo with her tour crew: "Farewell, 1989 World Tour."',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/The_1989_World_Tour' },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-1989-tour-ends-6805721/',
          },
        ],
        photos: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Taylor_Swift_AAMI_Park_20151212_01.jpg/1280px-Taylor_Swift_AAMI_Park_20151212_01.jpg', focalPoint: '50% 12%', credit: 'Wikimedia Commons' }],
      },
    },
    {
      year: 2014,
      month: 10,
      day: 14,
      category: 'music',
      title: 'Out of the Woods: a voice memo written to Jack Antonoff\'s track mid-flight',
      snippet:
        'She called it the song that "best represents" the album — built around a real snowmobile accident and twenty stitches she\'d kept out of the tabloids.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Out_of_the_Woods_(song)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f1/Taylor_Swift_-_Out_of_the_Woods.png',
      moment: {
        context:
          "Jack Antonoff built the instrumental on a Yamaha DX7 and Minimoog Voyager and sent it to Swift on a plane; she returned a voice-memo of finished lyrics about 30 minutes later — the first time she'd written words to an already-finished track.\n\nThe bridge's \"twenty stitches in a hospital room\" references a real snowmobile accident from a past relationship, which she'd persuaded tabloids not to publicize at the time.",
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Out_of_the_Woods_(song)' }],
        // Photo-enrichment pass (2026-07-18, #762): added the blizzard frame from the
        // official Out of the Woods video (id oEmbed-verified against @TaylorSwift;
        // downloaded and visually confirmed). Focal points set per image by viewing.
        // Karen #877 fix (2026-07-19): same frame upgraded hq2 (480x360, 6KB)
        // -> maxres2 (1280x720); downloaded and vision-confirmed identical.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/f1/Taylor_Swift_-_Out_of_the_Woods.png',
            credit: 'Big Machine Records',
            focalPoint: '47% 42%',
          },
          {
            url: 'https://i.ytimg.com/vi/JLf9q36UsBk/maxres2.jpg',
            credit: 'Big Machine Records / Taylor Swift via YouTube',
            kind: 'archival',
            focalPoint: '48% 42%',
            caption: "Frost-covered mid-blizzard — a still from Joseph Kahn's official 'Out of the Woods' video, premiered on New Year's Eve 2015.",
          },
        ],
      },
    },

    // --- Deep timeline fill (2026-07-08): release/tour depth for an era that
    // had 0 release items, plus the rollout, fan-culture, and business moments
    // the era is famous for. New items carry the audit's additive provenance
    // fields (slug + publisher/source_type/accessed_at/reliability_score
    // alongside legacy {outlet,url}), same convention as
    // the-life-of-a-showgirl.mjs. Every claim verified against its cited
    // source via search on 2026-07-08; no fabrication. Photos deliberately
    // omitted where no already-verified image URL exists.
    {
      slug: '1989-announced-yahoo-livestream',
      year: 2014,
      month: 8,
      day: 18,
      category: 'release',
      title: 'A Yahoo livestream announces 1989 — her "first documented, official pop album"',
      snippet:
        'August 18, 2014: a worldwide livestream reveals the album title, the October 27 date, the Polaroid cover — and drops "Shake It Off" plus its video the same day.',
      sourceUrl: 'https://en.wikipedia.org/wiki/1989_(album)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f6/Taylor_Swift_-_1989.png',
      moment: {
        context:
          'On the livestream she declared the record her first documented, official pop album, formally closing the country chapter the Red era had already strained — a pivot her own label resisted. Big Machine\'s Scott Borchetta, hearing the finished album, asked her to add country tracks with fiddle; she refused, reasoning that "if you chase two rabbits, you lose them both," and the label settled for not promoting it to country radio at all.\n\nMax Martin came aboard as co-executive producer to keep the synth-pop palette cohesive, "Shake It Off" dropped the same day and entered the Hot 100 at No. 1, and naming the album for her birth year — fronted by a Polaroid crop that cut off her face — set the visual language for everything that followed.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/1989_(album)',
            source_title: '1989 (album)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Shake_It_Off',
            source_title: 'Shake It Off',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added the signature frame from the
        // Shake It Off video, which dropped the same day as this livestream (id
        // oEmbed-verified against @TaylorSwift; downloaded and visually confirmed).
        // Album-cover focalPoint matches the same image on the 2025 Diamond item.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/f6/Taylor_Swift_-_1989.png',
            credit: 'Big Machine Records',
            focalPoint: '50% 38%',
          },
          {
            url: 'https://i.ytimg.com/vi/nfWlot6h_JM/maxresdefault.jpg',
            credit: 'Big Machine Records / Taylor Swift via YouTube',
            kind: 'archival',
            focalPoint: '50% 48%',
            caption: "The 'Shake It Off' video's most-talked-about scene — the single and video dropped the same day as the livestream reveal.",
          },
        ],
      },
    },
    {
      slug: '1989-secret-sessions',
      year: 2014,
      month: 10,
      category: 'release',
      title: 'The Secret Sessions: 89 fans at a time, in her living rooms',
      snippet:
        'Through September and October she hand-picked fans off the internet and played them 1989 early — at her homes in New York, LA, Rhode Island, her mom\'s place in Nashville, and a London hotel — baking the cookies herself. Nobody leaked a note.',
      sourceUrl: 'https://www.nylon.com/entertainment/oral-history-of-taylor-swifts-1989-secret-sessions',
      thumbnailUrl: null,
      moment: {
        context:
          'Each session hosted 89 fans, selected by Swift herself from social media. She previewed the full album weeks before release, talked through the songs, posed for photos, and served homemade chocolate chip and toasted coconut cookies. Despite hundreds of fans hearing it early, the album never leaked — a loyalty story the fandom still retells, and a rollout ritual she repeated for reputation.\n\nNYLON\'s oral history laid out the logistics: invitees — contacted by Taylor Nation via DM, phone call, or email — met at parking lots and were bused to undisclosed addresses, phones locked away and NDAs signed, before Swift played the album from her iPhone with track-by-track commentary. Five sessions ran in barely three weeks: Los Angeles on Sept. 20, her mom\'s house in Nashville on Sept. 28, her New York apartment in early October, Rhode Island on Oct. 4, and a London hotel room on Oct. 10, with individual Polaroid-and-hug meet-and-greets closing every night.',
        sources: [
          {
            outlet: 'NYLON',
            url: 'https://www.nylon.com/entertainment/oral-history-of-taylor-swifts-1989-secret-sessions',
            source_title: "An Oral History Of Taylor Swift's '1989' Secret Sessions",
            publisher: 'NYLON',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'Just Jared',
            url: 'https://www.justjared.com/2014/09/22/taylor-swift-invites-fans-to-her-home-for-1989-secret-sessions/',
            source_title: "Taylor Swift Invites Fans to Her Home for '1989' Secret Sessions",
            publisher: 'Just Jared',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        photos: [
          {
            url: 'https://i.ytimg.com/vi/EKnl7STzSMU/hqdefault.jpg',
            focalPoint: '62% 34%',
            credit: 'Taylor Swift via YouTube',
            kind: 'archival',
            caption: "Hugging a fan at a session — a still from the official '1989 Secret Sessions, Behind The Scenes!' video on Swift's own channel (Oct. 2014).",
          },
        ],
      },
    },
    {
      slug: '1989-welcome-to-new-york-schools',
      year: 2014,
      month: 10,
      day: 20,
      category: 'music',
      title: 'Welcome to New York, with the proceeds going to the city\'s schools',
      snippet:
        'The synth-drenched opener that announced the move to New York — and whose sales she donated to New York City public schools.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Welcome_to_New_York_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Track one of 1989 doubled as a mission statement for the era\'s move from Nashville to Manhattan — she\'d relocated in April 2014, and put the song first to mark the city as a formative influence on the record\'s "wide-eyed optimism." She wrote and produced it with Ryan Tedder, who programmed the first draft on a Juno-106 synth in about three hours.\n\nActual New Yorkers were split — critics called the portrait idealized, one noting it skipped the subway rats and closet-sized bedrooms — but the charity piece was concrete: in February 2015 the Department of Education confirmed a $50,000 donation from the single\'s sales, more than a first-year NYC public school teacher\'s starting salary at the time.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Welcome_to_New_York_(song)',
            source_title: 'Welcome to New York (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-donated-50k-new-york-public-schools-welcome-to-new-york-6480453/',
            source_title: "Taylor Swift Donated $50k to NYC Public Schools From 'Welcome to New York' Sales",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
          {
            outlet: 'NYC & Company',
            url: 'https://www.business.nyctourism.com/press-media/press-releases/nyc-company-announces-taylor-swift-as-new-york-citys-global-welcome-ambassa',
            source_title: "NYC & Company Announces Taylor Swift as New York City's Global Welcome Ambassador",
            publisher: 'NYC Tourism + Conventions',
            source_type: 'official',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Taylor_Swift_-_The_1989_World_Tour_-_Ford_Field_001_%2818116917298%29.jpg/960px-Taylor_Swift_-_The_1989_World_Tour_-_Ford_Field_001_%2818116917298%29.jpg',
            focalPoint: '52% 16%',
            credit: 'GabboT / Wikimedia Commons, CC BY-SA 2.0',
            kind: 'archival',
            caption: "On the 1989 World Tour at Ford Field in Detroit, May 30, 2015 — the show opened every night with 'Welcome to New York' against a mock Manhattan skyline.",
          },
        ],
      },
    },
    {
      slug: '1989-nyc-welcome-ambassador',
      year: 2014,
      month: 10,
      day: 27,
      category: 'business',
      title: 'New York names her its Global Welcome Ambassador',
      snippet:
        'Release-day promotion, city-scale: on October 27, 2014, NYC & Company made the Pennsylvania-born, Nashville-raised new Manhattanite the face of New York tourism — unpaid, announced live on Good Morning America.',
      sourceUrl: 'https://www.business.nyctourism.com/press-media/press-releases/nyc-company-announces-taylor-swift-as-new-york-citys-global-welcome-ambassa',
      thumbnailUrl: null,
      moment: {
        context:
          'The city\'s tourism arm built its global "Welcome to New York" campaign around the 1989 opener, with Swift fronting videos explaining New York slang and landmarks. NYC & Company confirmed she wasn\'t paid for the role; the appointment drew both delight and eye-rolls from lifelong New Yorkers, which only fed the coverage.\n\nThe rollout was total: the announcement went out live on Good Morning America the morning of the album\'s release, and nycgo.com\'s homepage turned into a 1989 billboard the same day — a photo of Swift on a Manhattan pier under the hand-lettered slogan "welcome to new york — it\'s been waiting for you," her signature underneath. For a Pennsylvania-born, Nashville-raised transplant seven months into actually living there, it was a remarkable civic embrace — and precision-timed marketing for both parties.',
        sources: [
          {
            outlet: 'NYC & Company',
            url: 'https://www.business.nyctourism.com/press-media/press-releases/nyc-company-announces-taylor-swift-as-new-york-citys-global-welcome-ambassa',
            source_title: "NYC & Company Announces Taylor Swift as New York City's Global Welcome Ambassador",
            publisher: 'NYC Tourism + Conventions',
            source_type: 'official',
            accessed_at: '2026-07-08',
            reliability_score: 5,
          },
          {
            outlet: 'Skift',
            url: 'https://skift.com/2014/10/27/new-york-city-taps-taylor-swift-as-its-global-welcome-ambassador/',
            source_title: 'New York City Taps Taylor Swift As Its Global Welcome Ambassador',
            publisher: 'Skift',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://skift.com/wp-content/uploads/2014/10/taylor.jpg',
            focalPoint: '50% 45%',
            credit: 'NYC & Company / nycgo.com, via Skift',
            kind: 'primary',
            caption: "nycgo.com's homepage on launch day: Swift fronting the 'Welcome to New York' campaign as the city's Global Welcome Ambassador, Oct. 27, 2014.",
          },
        ],
      },
    },
    {
      slug: '1989-blank-space-interactive-video',
      year: 2014,
      month: 11,
      day: 10,
      category: 'release',
      title: 'The Blank Space video arrives with its own interactive app',
      snippet:
        'November 10, 2014: Joseph Kahn\'s mansion-meltdown video drops alongside American Express Unstaged — an explorable 360° app version of the video that went on to win an Emmy.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Blank_Space',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/7/7c/Taylor_Swift_-_Blank_Space_%28Official_Single_Cover%29.png',
      moment: {
        context:
          'Joseph Kahn shot the mansion meltdown at Oheka Castle on Long Island, borrowing Stanley Kubrick\'s symmetrical framing while Swift played the tabloids\' "crazy ex" caricature to the hilt — golf clubs to the sports car included. The companion "AMEX Unstaged: Taylor Swift Experience" app let viewers roam the mansion in interactive 360° mid-video, discovering easter eggs and side characters outside the linear cut.\n\nIt won the 2015 Emmy for Outstanding Creative Achievement in Interactive Media — Original Interactive Program, with Swift credited as artist and executive producer: her first Emmy, earned for a music video\'s companion app.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Blank_Space',
            source_title: 'Blank Space',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Television Academy',
            url: 'https://www.televisionacademy.com/shows/amex-unstaged-taylor-swift-experience',
            source_title: 'AMEX Unstaged: Taylor Swift Experience | Emmy Awards and Nominations',
            publisher: 'Television Academy',
            source_type: 'official',
            accessed_at: '2026-07-09',
            reliability_score: 5,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/7/7c/Taylor_Swift_-_Blank_Space_%28Official_Single_Cover%29.png',
            focalPoint: '42% 28%',
            credit: 'Big Machine Records',
          },
        ],
      },
    },
    {
      slug: '1989-swiftmas',
      year: 2014,
      month: 12,
      category: 'sighting',
      title: 'Swiftmas: hand-wrapped packages, one hand-delivered to Connecticut',
      snippet:
        'She stalked her own fans\' Tumblrs, picked out personalized gifts, wrapped them herself, and shipped "SwiftEx" boxes across the country — then drove to Connecticut to hand one mom and son their presents in person.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-swiftmas-6415161/',
      thumbnailUrl: null,
      moment: {
        context:
          'The December 2014 gift blitz — fans dubbed it "Swiftmas" — was documented in a behind-the-scenes YouTube video on her own channel, posted Dec. 31, showing the wrapping marathon complete with cats asleep on the wrapping paper. The fan reaction videos became a holiday news cycle of their own.\n\nBillboard traced the packages to 32 hand-picked Tumblr followers, shipped by FedEx starting in mid-November after Taylor Nation quietly collected addresses. The most famous box — 31 pounds, to 16-year-old Rebecca Cox of West Bloomfield, Michigan — held a Victoria\'s Secret Fashion Show duffel, a Fujifilm Instax camera with film, blankets, candles, $200 in gift cards, and a handwritten note on nearly every item ("She uses a ridiculous amount of tape," Cox reported). The one delivery she wouldn\'t outsource closed the video: she drove to Connecticut herself to surprise a fan\'s young son with his presents, including a mini motorized car.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-swiftmas-6415161/',
            source_title: "Taylor Swift's 'Swiftmas': Fans Talk Receiving Gifts",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'TIME',
            url: 'https://time.com/3651775/behind-the-scenes-of-taylor-swifts-swiftmas-christmas-gift-extravaganza/',
            source_title: "Behind the Scenes of Taylor Swift's 'Swiftmas' Christmas Gift Extravaganza",
            publisher: 'TIME',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://i.ytimg.com/vi/j3yyF31jbKo/hqdefault.jpg',
            credit: 'Taylor Swift via YouTube',
            kind: 'archival',
            caption: "Mid-wrap in a NEW YORK sweatshirt — a still from 'Taylor Swift's Gift Giving of 2014 | SWIFTMAS' on her official channel (Dec. 31, 2014).",
          },
        ],
      },
    },
    {
      slug: '1989-this-sick-beat-trademarks',
      significance: 'notable', // a genuinely notable, widely-covered business precedent — one of the first mainstream artist trademark filings of its kind (docs/decisions.md, 2026-07-19)
      year: 2015,
      month: 1,
      day: 29,
      category: 'business',
      title: 'She trademarks "This Sick Beat" (and "Party Like It\'s 1989")',
      snippet:
        'Filings with the U.S. Patent and Trademark Office locked down lyric phrases from 1989 — "This Sick Beat," "Nice to Meet You. Where You Been?," "Could Show You Incredible Things" — before bootleg merch could.',
      sourceUrl: 'https://abcnews.com/Entertainment/taylor-swift-files-trademark-sick-beat-1989-phrases/story?id=28575143',
      thumbnailUrl: null,
      moment: {
        context:
          'The filings — made with the USPTO in October 2014 and surfacing in the press that January — covered "This Sick Beat," "Party Like It\'s 1989," "Cause We Never Go Out of Style," "Could Show You Incredible Things," and "Nice to Meet You. Where You Been?" — plus her name, signature, and initials — across product categories running from T-shirts and guitar straps to paper products and handbags. Forbes framed it as pre-tour housekeeping ahead of the May kickoff: locking down the 1989 merch economy before bootleggers could, with the round described as only the first.\n\nThe move — mocked by some, studied by others — became a case study in how aggressively her team protected the era\'s business; the applications were still pending as of early 2015, with registrations granted later.',
        sources: [
          {
            outlet: 'ABC News',
            url: 'https://abcnews.com/Entertainment/taylor-swift-files-trademark-sick-beat-1989-phrases/story?id=28575143',
            source_title: "Taylor Swift Files to Trademark 'This Sick Beat' and Other 1989 Phrases",
            publisher: 'ABC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2015/02/04/taylor-swift-has-trademarked-the-phrase-this-sick-beat/',
            source_title: "Taylor Swift Has Trademarked The Phrase 'This Sick Beat'",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/d/d1/Taylor_Swift_-_Shake_It_Off_music_video_screenshot.jpg',
            credit: 'Big Machine Records',
            kind: 'reference',
            caption: "Reference image: the 'Shake It Off' video — the song 'This Sick Beat' comes from. The trademark filings themselves are paperwork; no event photography exists.",
            // Tall full-body frame; her face is near the very top, slightly left of center.
            focalPoint: '42% 16%',
          },
        ],
      },
    },
    {
      slug: '1989-style-video',
      year: 2015,
      month: 2,
      day: 13,
      category: 'release',
      title: 'The Style video trades plot for pure atmosphere',
      snippet:
        'Released February 13, 2015: shattered mirrors, projected faces, a fog-drenched forest — a moody, near-abstract video that looked like nothing she\'d put out before.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Style_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Director Kyle Newman\'s treatment abandoned narrative for double-exposure imagery — Swift and English actor Dominic Sherwood projected onto each other, the relationship replayed in shards of broken mirror and hazy flashbacks by the sea, in the woods, and behind the wheel. Billboard called it "gorgeously shot," conceding the plot was thinner than "Blank Space" but that the atmosphere could carry a perfume ad; other critics caught echoes of True Detective\'s title sequence, Mulholland Drive, and Chris Isaak\'s "Wicked Game" video.\n\nThe art-film styling extended the pop reinvention to her videos — and the song underneath, a No. 6 Hot 100 peak at the time, has only climbed in critical standing since, routinely ranked among the finest pure pop songs in her catalog.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Style_(Taylor_Swift_song)',
            source_title: 'Style (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-style-video-6472752/',
            source_title: "Taylor Swift 'Style': Watch the Dreamy Music Video Here",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://i.ytimg.com/vi/-CmadmM5cOk/hqdefault.jpg',
            focalPoint: '38% 40%',
            credit: 'Big Machine Records / Taylor Swift via YouTube',
            kind: 'archival',
            caption: "The double-exposure profile shot from the official 'Style' video — Kyle Newman's atmosphere-over-plot treatment in a single frame.",
          },
        ],
      },
    },
    {
      slug: '1989-bad-blood-video-vevo-record',
      significance: 'notable', // a real streaming/premiere record, and the biggest visual statement of the era's star-studded "squad" phase (docs/decisions.md, 2026-07-19)
      relatedIds: ['moment:vault-1989-calvin-harris-and-taylor-go-public-at-the-billboard-music-aw'],
      year: 2015,
      month: 5,
      day: 17,
      category: 'release',
      title: 'Bad Blood premieres at the BBMAs and breaks the Vevo record',
      snippet:
        'The star-packed revenge fantasy — Selena Gomez, Kendrick Lamar, Mariska Hargitay, half the squad in neon codenames — opened the May 17, 2015 Billboard Music Awards and pulled 20.1 million views in 24 hours.',
      sourceUrl: 'https://time.com/3892980/bad-blood-music-video-record/',
      thumbnailUrl: null,
      moment: {
        context:
          'The 24-hour total broke Nicki Minaj\'s "Anaconda" record of 19.6 million Vevo views. Joseph Kahn\'s sci-fi action treatment gave each cast member a comic-book alias — Selena Gomez as Arsyn, Karlie Kloss as Knockout, Lena Dunham as Lucky Fiori — turning the squad itself into the video\'s marketing engine.\n\nThe premiere literally opened the Billboard Music Awards broadcast from the MGM Grand. The momentum didn\'t stop at the record: Forbes counted nearly 38 million total views within four days, and by August the video had won Video of the Year at the VMAs.',
        sources: [
          {
            outlet: 'TIME',
            url: 'https://time.com/3892980/bad-blood-music-video-record/',
            source_title: "Taylor Swift's 'Bad Blood' Music Video Breaks Vevo World Record",
            publisher: 'TIME',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2015/05/21/taylor-swifts-bad-blood-video-breaks-a-record-with-20-million-views-in-its-first-24-hours/',
            source_title: "Taylor Swift's 'Bad Blood' Video Breaks A Record With 20 Million Views In Its First 24 Hours",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added the Kendrick/Catastrophe
        // split-screen frame from the same official video (id oEmbed-verified against
        // @TaylorSwift; distinct scene from the existing close-up, downloaded and
        // visually confirmed). Focal points set per image by viewing.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/QcIy9NiNbmo/hqdefault.jpg',
            credit: 'Big Machine Records / Taylor Swift via YouTube',
            kind: 'archival',
            focalPoint: '48% 45%',
            caption: "Catastrophe mid-transformation — a still from the official 'Bad Blood' video that premiered at the 2015 BBMAs and broke the Vevo 24-hour record.",
          },
          {
            url: 'https://i.ytimg.com/vi/QcIy9NiNbmo/hq1.jpg',
            credit: 'Big Machine Records / Taylor Swift via YouTube',
            kind: 'archival',
            focalPoint: '50% 34%',
            caption: 'Kendrick Lamar as Welvin da Great opposite Catastrophe — the featured verse that shared the record-breaking premiere.',
          },
        ],
      },
    },
    {
      slug: '1989-hyde-park-runway',
      year: 2015,
      month: 6,
      day: 27,
      category: 'tour',
      title: 'Hyde Park, 65,000 people, and a literal squad runway',
      snippet:
        'At British Summer Time on June 27, 2015, she turned the "Style" bridge into a catwalk — Cara Delevingne, Kendall Jenner, Karlie Kloss, Gigi Hadid, Martha Hunt, and Serena Williams strutting the stage in front of 65,000.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-1989-tour-kendall-jenner-cara-delevingne-style-london-6612932/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Hyde Park festival date was the UK centerpiece of the 1989 World Tour, with Ellie Goulding, Vance Joy, John Newman and Rae Morris supporting.\n\nThe nightly celebrity-walk segment reached its peak form here — a tennis legend and half the world\'s top models strutting the catwalk mid-"Style," with Cara Delevingne carrying the U.K. flag down the stage. Billboard framed it as the live extension of the "Bad Blood" casting trick: the famous-friends roster deployed as part of the show itself.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-1989-tour-kendall-jenner-cara-delevingne-style-london-6612932/',
            source_title: "Taylor Swift's '1989' Tour: Kendall Jenner, Cara Delevingne & More Join Her for 'Style' in London",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'NME',
            url: 'https://www.nme.com/news/music/taylor-swift-189-1230492',
            source_title: "Taylor Swift announces trio of UK live dates as part of '1989' world tour",
            publisher: 'NME',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Taylor_Swift_-_The_1989_World_Tour_-_Crowd_at_HYDE_Park_during_Wildest_Dream_%26_Enchanted_performance.jpg/960px-Taylor_Swift_-_The_1989_World_Tour_-_Crowd_at_HYDE_Park_during_Wildest_Dream_%26_Enchanted_performance.jpg',
            focalPoint: '50% 55%',
            credit: 'James Honeyball / Wikimedia Commons, CC BY-SA 2.0',
            kind: 'primary',
            caption: 'The Hyde Park crowd — light-up wristbands glowing at dusk — during the British Summer Time show, June 27, 2015.',
          },
        ],
      },
    },
    {
      slug: '1989-kobe-staples-banner',
      year: 2015,
      month: 8,
      day: 21,
      category: 'tour',
      title: 'Kobe Bryant raises a banner for her at Staples Center',
      snippet:
        'August 21, 2015: mid-show, Kobe walked out and unveiled a banner in the rafters — 16 sold-out Staples Center shows, the most of any artist, hanging alongside the Lakers\' 16 championships.',
      sourceUrl: 'https://www.billboard.com/music/pop/kobe-bryant-surprise-taylor-swift-banner-staples-center-ryan-tedder-6671158/',
      thumbnailUrl: null,
      moment: {
        context:
          'The banner — "Taylor Swift, Most Sold Out Performances" — was unveiled on Friday, Aug. 21, 2015, as she opened a five-night Staples Center stand; completing the run would put her at 16 sold-out shows at the arena, the most by any artist. "16 is a very special number here in Los Angeles," Bryant told the crowd, "because 16 is the same number of championships we have as the Lakers franchise," adding of the banner: "It\'s going to hang here forever."\n\nRyan Tedder joined her onstage the same night — one stop in a five-night LA guest run that also produced the Mary J. Blige and Justin Timberlake cameos fans still trade clips of. Bryant kept cheering from a distance afterward, tweeting "Keep breaking records and changing lives #1989TourLA."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/kobe-bryant-surprise-taylor-swift-banner-staples-center-ryan-tedder-6671158/',
            source_title: "Kobe Bryant Surprises Taylor Swift With Championship Banner at L.A.'s Staples Center",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'CBS Sports',
            url: 'https://www.cbssports.com/nba/news/video-kobe-bryant-gives-staples-center-banner-to-taylor-swift/',
            source_title: 'VIDEO: Kobe Bryant gives Staples Center banner to Taylor Swift',
            publisher: 'CBS Sports',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Taylor_Swift_-_The_1989_World_Tour_-_Los_Angeles_-_record_at_STAPLES_Center_%28crop%29.jpg/960px-Taylor_Swift_-_The_1989_World_Tour_-_Los_Angeles_-_record_at_STAPLES_Center_%28crop%29.jpg',
            focalPoint: '48% 40%',
            credit: 'Denielle / Wikimedia Commons, CC BY-SA 2.0',
            kind: 'primary',
            caption: "The 'Taylor Swift, Most Sold Out Performances' banner in the Staples Center rafters, photographed at the Aug. 22, 2015 show — the night after Kobe Bryant unveiled it.",
          },
        ],
      },
    },
    {
      slug: '1989-world-tour-live-film',
      year: 2015,
      month: 12,
      day: 20,
      category: 'release',
      title: 'The 1989 World Tour Live lands as an Apple Music exclusive',
      snippet:
        'Released December 20, 2015: Jonas Åkerlund\'s film of the Sydney show — 76,000 fans at ANZ Stadium — stitched with backstage footage and the tour\'s parade of surprise guests.',
      sourceUrl: 'https://www.billboard.com/pro/taylor-swift-1989-world-tour-live-concert-film-apple-music-dec-20/',
      thumbnailUrl: null,
      moment: {
        context:
          'Six months after her open letter got Apple to reverse its trial-period royalty policy, the concert film arrived as an Apple Music exclusive — the reconciliation made product, released December 20 as pre-Christmas ammunition for the streaming service.\n\nJonas Åkerlund\'s cut captured the full November 28 show before 76,000 at Sydney\'s ANZ Stadium, stitched with never-before-seen backstage and rehearsal footage plus guest moments from across the tour, from Mick Jagger to Imagine Dragons. Her own pitch, in the announcement: "I wondered what would happen if I invited the most amazing artists in the world to come out with me and perform on my stage — would they do it?"',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-1989-world-tour-live-concert-film-apple-music-dec-20/',
            source_title: "Taylor Swift '1989 World Tour Live' Concert Film Coming to Apple Music",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-1989-world-tour-848317/',
            source_title: "Taylor Swift '1989 World Tour Live' Concert Film Coming to Apple Music",
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/6/6d/The_1989_World_Tour.png',
            focalPoint: '50% 48%',
            credit: 'Big Machine Records',
            kind: 'archival',
            caption: 'The official 1989 World Tour poster art — the tour the Apple Music film documents, shot at the Nov. 28, 2015 Sydney show.',
          },
        ],
      },
    },
    {
      slug: '1989-out-of-the-woods-video-nye',
      year: 2015,
      month: 12,
      day: 31,
      category: 'release',
      title: 'The Out of the Woods video closes the era on New Year\'s Eve',
      snippet:
        'Premiered December 31, 2015 on Dick Clark\'s New Year\'s Rockin\' Eve: Taylor pursued through forests, blizzards, and mudslides by the woods themselves — ending back on the beach where she started.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-out-of-the-woods-premiere-new-years-rockin-eve-6820708/',
      thumbnailUrl: null,
      moment: {
        context:
          'The sixth 1989 single\'s video, shot in New Zealand, rendered the song\'s anxiety as literal wilderness — grasping branches, frozen lakes, a wall of fire. Its closing title card, "She lost him. But she found herself. And somehow that was everything," reads as the era\'s thesis statement, dropped as the year turned.\n\nABC treated the premiere as event television: the network announced it on Good Morning America on Dec. 22, then slotted the debut into Dick Clark\'s New Year\'s Rockin\' Eve with Ryan Seacrest — the same broadcast rhythm as a ball drop. Timing-wise it bookended the campaign almost exactly: "Shake It Off" had opened the era in August 2014, and this closed the original album\'s video run fourteen months after release, with one deluxe-track single still to come.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-out-of-the-woods-premiere-new-years-rockin-eve-6820708/',
            source_title: "Taylor Swift 'Out of the Woods' Video Premiere Will Hit New Year's Rockin' Eve",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'ABC News',
            url: 'https://abcnews.go.com/Entertainment/taylor-swift-debut-woods-music-video-years-rockin/story?id=35897285',
            source_title: "Taylor Swift to Debut 'Out of the Woods' Music Video During 'New Year's Rockin' Eve' on ABC",
            publisher: 'ABC News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://i.ytimg.com/vi/JLf9q36UsBk/maxresdefault.jpg',
            focalPoint: '50% 42%',
            credit: 'Big Machine Records / Taylor Swift via YouTube',
            kind: 'archival',
            caption: "Mud-caked and mid-pursuit — a still from the official 'Out of the Woods' video, premiered on New Year's Rockin' Eve, Dec. 31, 2015.",
          },
        ],
      },
    },
    {
      slug: '1989-taylor-vs-treadmill',
      year: 2016,
      month: 4,
      day: 1,
      category: 'business',
      title: 'Taylor vs. Treadmill: the Apple Music ad that sold a Drake song',
      snippet:
        'April 1, 2016: an Apple Music spot of Taylor rapping Drake and Future\'s "Jumpman" on a treadmill — then eating the floor — went so viral that "Jumpman" iTunes sales jumped 431%.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-apple-music-ad-campaign-7318684/',
      thumbnailUrl: null,
      moment: {
        context:
          'The gag ad — captioned #TaylorvsTreadmill — racked up more than 20 million views on Facebook and Instagram within days, boosted Apple\'s #gymflow playlist plays 325%, and put a rap song that had been out for six months back up the charts. It marked how completely the Apple relationship had flipped since the 2015 royalty standoff.\n\nBillboard reported it as the first of a planned series of Apple Music spots leaning on her self-deprecating side, and Forbes did the receipts on the "Jumpman" bump: a 431% jump in iTunes sales — likely tens of thousands of downloads — for a track that had peaked at No. 12 on the Hot 100 half a year earlier, with a fresh chart climb predicted off the exposure. Not bad for sixty seconds of face-planting in athleisure.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-apple-music-ad-campaign-7318684/',
            source_title: "Taylor Swift Raps Drake & Future's 'Jumpman,' Falls Off Treadmill in Apple Music Ad",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2016/04/07/taylor-swifts-apple-music-commercial-spurred-a-431-jump-in-sales-for-drake/',
            source_title: "Taylor Swift's Apple Music Commercial Spurred A 431% Jump In Sales For Drake",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://i.ytimg.com/vi/9R2Fux_af6k/hqdefault.jpg',
            focalPoint: '40% 38%',
            credit: 'Apple Music, via ABC News on YouTube',
            kind: 'archival',
            caption: 'The face-plant itself: Swift comes off the treadmill mid-"Jumpman" in the April 1, 2016 Apple Music spot.',
          },
        ],
      },
    },
    {
      slug: '1989-nils-sjoberg-reveal',
      year: 2016,
      month: 7,
      day: 13,
      category: 'relationship',
      title: 'Nils Sjöberg unmasked: she secretly wrote Calvin Harris\'s biggest hit of the year',
      snippet:
        'July 13, 2016: her team confirmed the pseudonymous songwriter behind "This Is What You Came For" was Taylor herself — and her ex responded with a now-infamous string of tweets.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-calvin-harris-co-wrote-this-is-what-you-came-for-pseudonym-7438158/',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift had written the Rihanna-fronted hit — released April 29, 2016 — under the name Nils Sjöberg while she and Harris were still together, keeping it secret so the relationship wouldn\'t overshadow the song. She picked the pseudonym because those are two of the most common Swedish male names, and she even sings uncredited backing vocals on the track.\n\nAfter the credit surfaced post-breakup, Harris confirmed it on Twitter — she "wrote the lyrics and contributed some background vocals" while he wrote, produced, and arranged it — but added it was "hurtful" that her team let the story out, turning a songwriting footnote into the summer\'s defining pop feud.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-calvin-harris-co-wrote-this-is-what-you-came-for-pseudonym-7438158/',
            source_title: "Taylor Swift Co-Wrote Calvin Harris' 'This is What You Came For' Under Pseudonym",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2016/music/news/calvin-harris-blasts-taylor-swift-songwriting-credit-this-is-what-you-came-for-1201813531/',
            source_title: 'Calvin Harris Blasts Taylor Swift Over Songwriting Credit',
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/This_Is_What_You_Came_For',
            source_title: 'This Is What You Came For',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/a/a8/This_Is_What_You_Came_For_cover.png',
            // Symmetric circular cover art (lightning over mountains); genuinely reads best centered.
            focalPoint: '50% 50%',
            credit: 'Westbury Road / Sony Music',
            kind: 'primary',
            caption: 'The single art for "This Is What You Came For" — credited on release to Calvin Harris featuring Rihanna, with "Nils Sjöberg" in the songwriting credits.',
          },
        ],
      },
    },
    {
      slug: '1989-taylors-version-announced',
      year: 2023,
      month: 8,
      day: 9,
      category: 'release',
      title: '1989 (Taylor\'s Version) announced in head-to-toe blue at SoFi Stadium',
      snippet:
        'August 9, 2023, the final show of the Eras Tour\'s first U.S. leg: after a night of suspiciously blue outfit swaps, she announced the 1989 re-recording from the stage — due October 27, nine years to the day after the original.',
      sourceUrl: 'https://variety.com/2023/music/news/taylor-swift-announces-1989-taylors-version-coming-la-tour-finale-sofi-stadium-1235692622/',
      thumbnailUrl: null,
      moment: {
        context:
          'Fans clocked the Easter egg immediately: blue variants of the Speak Now, folklore, and 1989 act costumes across the night, capped by the reveal and a long-awaited "New Romantics" as a surprise song. The crowd of 70,000 at the sixth SoFi show turned the announcement into the loudest moment of the U.S. leg.\n\nThe date was its own Easter egg — Oct. 27, 2023, nine years to the day after the original album. "Instead of telling you about it, I think I\'ll just sort of show you," she said before the screens flipped 1989 blue. The surprise-song set doubled down: "New Romantics" on guitar (the last 1989 track she hadn\'t yet played on the tour) and "New Year\'s Day" on piano, plus an onstage thank-you to fans for making the re-recordings matter: "It was so generous of you to care about something that I cared about."',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2023/music/news/taylor-swift-announces-1989-taylors-version-coming-la-tour-finale-sofi-stadium-1235692622/',
            source_title: "Taylor Swift Reveals '1989 (Taylor's Version)' Is Coming at L.A. Tour Finale",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-eras-tour-la-recap-night-6-best-moments-sofi-stadium/',
            source_title: "6 Best Moments From Night 6 of Taylor Swift's Eras Tour at LA's SoFi Stadium",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added the 1989 act from the same
        // Aug. 9, 2023 SoFi show (Commons API-verified CC BY 2.0, Paolo Villanueva,
        // EXIF-dated 2023-08-09; downloaded and visually confirmed the blue sparkle
        // 1989 set). Focal points set per image by viewing.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Taylor_Swift_The_Eras_Tour_Midnights_Era_Set_%2853110098448%29.jpg/960px-Taylor_Swift_The_Eras_Tour_Midnights_Era_Set_%2853110098448%29.jpg',
            credit: 'Paolo V / Wikimedia Commons, CC BY 2.0',
            kind: 'primary',
            focalPoint: '62% 45%',
            caption: 'Onstage at SoFi Stadium on Aug. 9, 2023 — the night of the 1989 (Taylor\'s Version) announcement — during the Midnights act.',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Taylor_Swift_The_Eras_Tour_1989_Era_Set_%2853109741404%29.jpg/1280px-Taylor_Swift_The_Eras_Tour_1989_Era_Set_%2853109741404%29.jpg',
            credit: 'Paolo Villanueva / Wikimedia Commons, CC BY 2.0',
            kind: 'primary',
            focalPoint: '72% 56%',
            caption: 'The 1989 act at SoFi that same night — one of the not-so-subtle blue hints dropped across the show before the screens flipped.',
          },
        ],
      },
    },

    // --- The July 2016 rupture arc (2026-07-16, #695): the era's actual
    // ending — "Famous," the Snapchat receipts, and the 2020 full-call
    // vindication — was untold anywhere on the site while three other items
    // already referenced it. The 2020 payoff item follows this file's
    // existing convention of post-era payoff items (see the 2020-03-13
    // Diamond certification above). Every claim verified against its cited
    // sources directly; quotes are verbatim from the cited coverage.
    {
      year: 2016,
      month: 2,
      day: 11,
      category: 'music',
      significance: 'defining', // the inciting incident of the whole Kimye saga and reputation era (docs/decisions.md, 2026-07-19)
      title: 'The night "Famous" premiered, and she said no',
      snippet:
        'Kanye West debuts "Famous" at Madison Square Garden — "I made that bitch famous" — and says she approved it. Her team answers the same day: she was never told that line, and she "cautioned him about releasing a song with such a strong misogynistic message."',
      sourceUrl: 'https://time.com/4411055/kanye-west-taylor-swift-kim-kardashian-feud/',
      thumbnailUrl: null,
      relatedIds: [
        'moment:vault-1989-1989-wins-album-of-the-year-making-her-the-first-woman-to-wi',
        'moment:vault-1989-snakes-snapchat-and-excluded-from-this-narrative',
      ],
      moment: {
        context:
'At the Yeezy Season 3 event at Madison Square Garden on Feb. 11, 2016 — part fashion show, part listening party for The Life of Pablo, staged with performance artist Vanessa Beecroft in front of roughly 20,000 people — West premiered "Famous" and its line about Taylor: "I feel like me and Taylor might still have sex / Why? I made that bitch famous." He insisted she had approved it in a phone call.\n\nHer spokesperson\'s statement said otherwise: "Kanye did not call for approval, but to ask Taylor to release his single \'Famous\' on her Twitter account. She declined and cautioned him about releasing a song with such a strong misogynistic message. Taylor was never made aware of the actual lyric, \'I made that bitch famous.\'"\n\nFour days later she accepted Album of the Year at the Grammys with the "there are going to be people along the way who will try to undercut your success" speech — the whole room knew who she meant. The question of what was actually said on that call would hang over the next four years.',
        sources: [
          { outlet: 'Time', url: 'https://time.com/4411055/kanye-west-taylor-swift-kim-kardashian-feud/' },
          { outlet: 'CBS News', url: 'https://www.cbsnews.com/media/kanye-west-vs-taylor-swift-timeline/' },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Taylor_Swift%E2%80%93Kanye_West_feud' },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/rb-hip-hop/kanye-yeezy-season-3-show-madison-square-garden-6874812/',
            source_title: "Kanye West's Yeezy Season 3 Event: A Fashion Show All Its Own",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-19',
            reliability_score: 4,
          },
        ],
        // Photo pass 2026-07-19 (defining-events-31-50): 6 real, verified
        // photos — 4 from the actual Yeezy Season 3 / Life of Pablo event
        // where "Famous" premiered, and 2 reused (already verified, ≤3-use
        // safe) from the 1989-AOTY item for the "four days later" speech
        // this item's own text references.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/kanye-west-yeezy-3-msg-2016-09-billboard-650.jpg?w=650&h=430&crop=1',
            focalPoint: '48% 38%',
            credit: 'Getty Images, via Billboard',
            caption: 'Kanye West at the Yeezy Season 3 / The Life of Pablo listening event, Madison Square Garden, Feb. 11, 2016 — where "Famous" premiered.',
            kind: 'primary',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/kanye-west-yeezy-3-msg-2016-01-billboard-650.jpg?w=650&h=430&crop=1',
            focalPoint: '50% 45%',
            credit: 'Getty Images, via Billboard',
            caption: 'The event\'s staging inside Madison Square Garden, built for an audience of roughly 20,000.',
            kind: 'archival',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/kanye-west-yeezy-3-msg-2016-07-billboard-650.jpg?w=650&h=430&crop=1',
            focalPoint: '50% 22%',
            credit: 'Getty Images, via Billboard',
            caption: 'Models on the Yeezy Season 3 runway during the same event.',
            kind: 'archival',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/kanye-west-yeezy-3-msg-2016-08-billboard-650.jpg?w=650&h=430&crop=1',
            focalPoint: '50% 20%',
            credit: 'Getty Images, via Billboard',
            caption: 'More of the roughly 1,000 models styled for the Yeezy Season 3 runway.',
            kind: 'archival',
          },
          {
            url: 'https://media.vanityfair.com/photos/6973c38b8d6b50621a0c2414/master/w_1024%2Cc_limit/taylor-swift-grammys-red-carpet-2016.jpg',
            focalPoint: '50% 12%',
            credit: 'Getty Images, via Vanity Fair',
            caption: 'Swift at the Grammys red carpet, Feb. 15, 2016 — four days after "Famous" premiered, hours before her Album of the Year speech.',
            kind: 'archival',
          },
          {
            url: 'https://assets.teenvogue.com/photos/56c2618a92a7d1d17a722124/master/w_1024%2Cc_limit/GettyImages-510439952.jpg',
            focalPoint: '51% 15%',
            credit: 'Getty Images, via Teen Vogue',
            caption: 'On the Grammys red carpet that night, Feb. 15, 2016 — hours before accepting Album of the Year with the "undercut your success" line the room understood as her answer.',
            kind: 'archival',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/Vanessa-Beecroft-portrait-bw-billboard-1548.jpg?w=942&h=628&crop=1',
            focalPoint: '40% 28%',
            credit: 'Pier Marco Tacca/Getty Images, via Billboard',
            caption: 'Vanessa Beecroft, the performance artist who staged the Yeezy Season 3 presentation West premiered "Famous" inside.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      year: 2016,
      month: 7,
      day: 17,
      category: 'music',
      significance: 'defining', // the defining controversy of her career, direct catalyst for reputation (docs/decisions.md, 2026-07-19)
      title: 'Snakes, Snapchat, and "excluded from this narrative"',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-89-4", label: "The call leaks", kind: "life" },
      snippet:
        'Kim Kardashian posts an edited cut of the "Famous" call to Snapchat, snake emojis flood every comment section, and #TaylorSwiftIsOverParty trends worldwide. Her answer — "I would very much like to be excluded from this narrative" — is the era\'s last word before the lights go out.',
      sourceUrl:
        'https://www.washingtonpost.com/news/arts-and-entertainment/wp/2016/07/18/read-the-secret-kanye-westtaylor-swift-phone-call-that-kim-kardashian-posted-on-snapchat/',
      // thumbnailUrl set 2026-07-19 (10-defining-events photo pass): her own
      // posted statement screenshot — curl 200 image/png, verified live.
      thumbnailUrl: 'https://assets.teenvogue.com/photos/578d040a6e85f8db434d47c6/master/w_1600%2Cc_limit/IMG_1374.PNG',
      relatedIds: [
        'moment:vault-1989-the-night-famous-premiered-and-she-said-no',
        'moment:vault-1989-the-full-call-leaks-and-she-was-telling-the-truth',
        'moment:vault-reputation-the-snake-video-that-announced-reputation',
        'moment:vault-reputation-look-what-you-made-me-do-and-the-phone-call-it-started-with',
        'moment:vault-fearless-wins-best-female-video-then-kanye-west-takes-the-mic',
        'moment:vault-lover-miss-americana-opens-sundance-then-hits-netflix',
      ],
      moment: {
        context:
          'A month after telling GQ that video of the "Famous" call existed, Kim Kardashian posted it — edited into Snapchat-length clips, on the night of July 17, 2016 — showing Taylor responding warmly as West read her parts of the song. The clips did not include the "I made that bitch famous" line, but the internet\'s verdict was instant: #TaylorSwiftIsOverParty trended worldwide and snake emojis flooded her every post.\n\nHer response drew the line she would hold for four years: "Where is the video of Kanye telling me he was going to call me \'that bitch\' in his song? It doesn\'t exist because it never happened... I would very much like to be excluded from this narrative, one that I have never asked to be a part of, since 2009."\n\nThen she withdrew from the spotlight — no red carpets, no interviews, no album cycle — for the longest stretch of her career, broken only by a handful of exceptions: a rare public sighting later that month, a previously announced headline concert at the Formula 1 U.S. Grand Prix in Austin that October — her only full show of 2016 — and a Zayn duet, "I Don\'t Wanna Live Forever," released that December for the Fifty Shades Darker soundtrack. "Nobody physically saw me for a year," she said later in Miss Americana — a characterization of how absent she felt, not a literal account. What came back in full a year later, snake-first, was reputation.',
        sources: [
          {
            outlet: 'The Washington Post',
            url: 'https://www.washingtonpost.com/news/arts-and-entertainment/wp/2016/07/18/read-the-secret-kanye-westtaylor-swift-phone-call-that-kim-kardashian-posted-on-snapchat/',
          },
          { outlet: 'Time', url: 'https://time.com/4410370/taylor-swift-kim-kardashian-kanye-west/' },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-miss-americana-trailer-941161/',
          },
          // Backs the corrected withdrawal claim (found in review, 2026-07-19)
          // — she wasn't in absolute silence: a surprise F1 after-party set
          // and the Zayn duet both happened during this stretch.
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/amp/news/taylor-swift-performs-at-formula-one-her-only-concert-of-the-year/',
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-and-zayn-release-surprise-duet-single-for-fifty-shades-darker/',
          },
        ],
        // Photo pass 2026-07-19 (10-defining-events, docs/decisions.md):
        // this item had zero photos before this pass. Every URL below
        // curl-verified live (HTTP 200 + real image content-type).
        photos: [
          {
            url: 'https://assets.teenvogue.com/photos/578d040a6e85f8db434d47c6/master/w_1600%2Cc_limit/IMG_1374.PNG',
            focalPoint: '50% 12%',
            credit: 'Taylor Swift/Instagram, via Teen Vogue',
            // FLAG (photo-enrichment 2026-07-20): downloaded + vision-checked —
            // this asset is a BLANK Apple Notes screen, not the statement text
            // the prior caption claimed. Caption corrected to match the image;
            // recommend a verified replacement showing the actual statement.
            caption: 'The Apple Notes format Swift used to post her July 18, 2016 reply — the statement that asked where West had told her about the "that bitch" lyric and ended, "I would very much like to be excluded from this narrative."',
            kind: 'primary',
          },
          {
            url: 'https://i.guim.co.uk/img/media/83c4993d8e8ad4dde6c653daff10b74e537e6aea/0_0_620_372/master/620.jpg?crop=none&dpr=1&s=none&width=465',
            focalPoint: '50% 22%',
            credit: 'Rex Features, via The Guardian',
            // FLAG (photo-enrichment 2026-07-20): downloaded + vision-checked —
            // this asset is a Guardian side-by-side of Kim Kardashian and Taylor
            // Swift, NOT a Snapchat still of West on the phone. Caption corrected
            // to match the image; recommend a verified replacement if a Snapchat
            // still is wanted here.
            caption: 'A Guardian side-by-side of Kim Kardashian and Taylor Swift, published as Kardashian\'s Snapchat clips reignited the feud in July 2016.',
            kind: 'primary',
          },
          {
            url: 'https://media.vanityfair.com/photos/5792599af9039e5f13c9db9f/master/w_2560%2Cc_limit/taylor-swift-tom-hiddleston.jpg',
            focalPoint: '50% 33%',
            credit: 'Cameron Richardson/Newspix/Rex/Shutterstock, via Vanity Fair',
            caption: 'Swift walks with Tom Hiddleston in Los Angeles on July 21, her first public sighting after the Snapchat clips appeared.',
            kind: 'archival',
          },
          {
            url: 'https://assets.teenvogue.com/photos/578c4ca16e85f8db434d478f/16%3A9/w_2560%2Cc_limit/GettyImages-463036782.jpg',
            focalPoint: '50% 25%',
            credit: 'Larry Busacca/Getty Images for NARAS, via Teen Vogue',
            caption: 'For context, Swift, Kardashian, and West pose together at the 2015 Grammys, before the "Famous" dispute reopened the VMA feud.',
            kind: 'reference',
          },
          // Photo pass 2026-07-19 (bulk-to-6+, docs/decisions.md): 3 more
          // real, verified photos anchoring the withdrawal-year exceptions
          // named in the context text. Every URL curl-verified live.
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-perform-austin-oct-2016-billboard-1548.jpg?w=942&h=628&crop=1',
            focalPoint: '50% 14%',
            credit: 'Gary Miller/FilmMagic, via Billboard',
            caption: 'Swift headlines the Formula 1 U.S. Grand Prix concert in Austin on Oct. 22, 2016 — her only full show of the year, announced months ahead of the Grand Prix weekend.',
            kind: 'archival',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/82/Zayn_%26_Taylor_Swift_-_I_Don%27t_Wanna_Live_Forever_%28Official_Single_Cover%29.png',
            focalPoint: '50% 50%',
            credit: 'RCA Records / Republic Records (official single cover)',
            caption: 'The cover for "I Don\'t Wanna Live Forever," her December 2016 duet with Zayn for the Fifty Shades Darker soundtrack — one of two music releases during the withdrawal year.',
            kind: 'archival',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/a/ae/Taylor_Swift_-_Miss_Americana.jpg',
            focalPoint: '50% 50%',
            credit: 'Netflix (official poster)',
            caption: 'The poster for "Miss Americana" (2020), the Netflix documentary where she later characterized this year as one where "nobody physically saw me."',
            kind: 'reference',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 3,
      day: 20,
      category: 'music',
      significance: 'defining', // the four-year saga's actual resolution — vindication on tape (docs/decisions.md, 2026-07-19)
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-89-6", label: "Full call leaks", kind: "life" },
      title: 'The full call leaks, and she was telling the truth',
      snippet:
        'Four years after the Snapchat clips, the full 25-minute "Famous" call leaks — and the "that bitch" line is nowhere in it. He never read it to her. Her response points everyone to Feeding America instead.',
      sourceUrl: 'https://variety.com/2020/music/news/taylor-swift-kanye-west-phone-call-leaks-read-full-transcript-1203541363/',
      thumbnailUrl: null,
      relatedIds: [
        'moment:vault-1989-snakes-snapchat-and-excluded-from-this-narrative',
        'moment:vault-reputation-look-what-you-made-me-do-and-the-phone-call-it-started-with',
      ],
      moment: {
        context:
          'Late on the night of March 20, 2020, the unedited call — all 25 minutes of it — surfaced online, and Variety transcribed every word. The full recording showed what the 2016 Snapchat edit had left out: West never read her the "I made that bitch famous" line she was accused of approving. The conversation she\'d described in her original statement was the conversation that had actually happened.\n\nHer response, on Instagram Stories, didn\'t relitigate: the footage proved "that I was telling the truth the whole time about *that call* (you know, the one that was illegally recorded, that somebody edited and manipulated in order to frame me)" — and then, with the world a week into pandemic lockdown, she pointed followers to Feeding America and the World Health Organization instead: "If you have the ability to, please join me in donating during this crisis."\n\nFour years of "liar" and snake emojis, answered by the tape itself — the vindication reputation had been written without.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2020/music/news/taylor-swift-kanye-west-phone-call-leaks-read-full-transcript-1203541363/',
          },
          {
            outlet: 'Global News',
            url: 'https://globalnews.ca/news/6717438/taylor-swift-kanye-west-full-leaked-phone-call/',
          },
          {
            outlet: 'NME',
            url: 'https://www.nme.com/news/music/taylor-swift-says-she-was-framed-as-2016-phone-call-with-kanye-west-leaks-online-2633977',
          },
        ],
        // Photo pass 2026-07-19 (defining-events-31-50): genuinely thin —
        // this is a March 2020 pandemic-lockdown, Instagram-Stories-only
        // event with no public appearance or press photo op of its own.
        // 3 real, verified reference photos: the most recent public sighting
        // of both parties before the leak, none claiming to depict the leak
        // itself.
        photos: [
          {
            url: 'https://www.deseret.com/resizer/v2/3SBWN62DPKVBNOM5OCEMSLB4CY.jpg?auth=f2f1556df77c838ffb25beba3cd481a6d23be38d2b195ee46ba46d063b9fcc19&focal=1216%2C845&width=800&height=556',
            credit: 'Deseret News',
            caption: 'Swift at the "Miss Americana" Sundance premiere, Jan. 23, 2020 — her last major public appearance before the leak and the pandemic lockdown that followed weeks later.',
            kind: 'reference',
            // Over-the-shoulder pose; her face sits upper-left of center.
            focalPoint: '40% 25%',
          },
          {
            url: 'https://hollywoodlife.com/wp-content/uploads/2020/03/taylor-swift-kimye-full-phone-call-leaked-rex-ftr-1-1.jpg',
            credit: 'Rex, via HollywoodLife',
            caption: 'A composite of both parties around this period: Swift at Sundance, West and Kardashian at a 2020 event.',
            kind: 'reference',
            // Left/right split composite; all faces read in the upper band.
            focalPoint: '50% 22%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Kim_Kardashian_and_Kanye_West_at_the_Met_Gala_in_2019.png',
            credit: 'Cosmopolitan UK, Wikimedia Commons (CC BY 3.0)',
            caption: 'Kardashian and West in 2019, the year before the full call surfaced.',
            kind: 'reference',
            // Two faces center-frame, West a touch higher than Kardashian.
            focalPoint: '46% 40%',
          },
        ],
      },
    },

    // ── Migrated from content.ts RAW (consolidation stage 2a, 2026-07-19) ──
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "1989-album",
      // Cross-link (candidate #1405): The Life of a Showgirl — the return of the
      // Max Martin/Shellback pop machinery first built on 1989.
      relatedIds: ["moment:vault-tloas-the-life-of-a-showgirl-arrives-12-tracks-max-martin-and-shel"],
      year: 2014,
      month: 10,
      day: 27,
      category: "music",
      title: "The pop reinvention",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-89-1", label: "1989 released", kind: "album" },
      snippet: "A clean break from country: synths, New York, and a Polaroid aesthetic.",
      moment: {
        context: "Billed as her first “official pop album,” 1989 traded twang for gleaming synth-pop and remade her as the biggest star in the world.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "1989-shake-it-off",
      year: 2014,
      month: 8,
      day: 18,
      category: "music",
      title: "“Shake It Off” launches the era",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-89-0", label: "“Shake It Off”", kind: "life" },
      snippet: "A brass-driven lead single announces the full pop pivot from a stadium stage.",
      video: { youtubeId: "nfWlot6h_JM", title: "Taylor Swift - Shake It Off" },
      moment: {
        context: "Debuted at a live-streamed event, the lead single made the reinvention official and immediately topped the charts.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "1989-blank-space",
      year: 2014,
      month: 11,
      day: 10,
      category: "music",
      tags: ["Lore"],
      // Cross-link (candidate #1342, 2026-07-25): the vault song Swift chose between
      // with "Blank Space" for the original 1989 tracklist.
      relatedIds: ['moment:vault-midnights-slut-turns-out-to-be-a-love-song'],
      title: "“Blank Space” flips the narrative",
      snippet: "A self-aware satire of her own tabloid image becomes a defining smash.",
      video: { youtubeId: "e-ORhEE9VVg", title: "Taylor Swift - Blank Space" },
      moment: {
        context: "By playing the “boy-crazy” caricature for laughs, she seized control of the story and scored another number one.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "1989-polaroids",
      year: 2014,
      month: 11,
      dateLabel: "Late 2014",
      category: "fashion",
      title: "Polaroids and pastel",
      snippet: "The visual language of 1989: instant photos, seagulls, sky-blue minimalism.",
      moment: {
        context: "Polaroid-framed lyrics and a crisp pastel palette made 1989 instantly iconic.",
        // Shop pass (2026-07-22): no single named dress -- a current
        // sky-blue mini in the era's pastel-minimalist palette.
        products: [
          {
            brand: 'Fashion Nova',
            item: 'Simona Satin Mini Dress',
            retailer: 'fashionnova.com',
            url: 'https://www.fashionnova.com/products/simona-satin-mini-dress-light-blue',
            price: '$23.98',
            isAlternative: true,
            altNote: 'No single named dress -- this is the era\'s visual palette, not one outfit -- a current light-blue mini in the same sky-blue minimalist spirit.',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "1989-squad",
      year: 2015,
      month: 1,
      dateLabel: "Early 2015",
      category: "sighting",
      title: "The “squad” era",
      snippet: "A rotating cast of famous friends becomes its own cultural storyline.",
      moment: {
        context: "Group appearances and red-carpet friendships turned her social circle into a defining 1989-era talking point.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "1989-bad-blood",
      year: 2015,
      month: 5,
      day: 17,
      category: "music",
      title: "“Bad Blood” short film",
      snippet: "A star-studded cinematic music video doubles as an event premiere.",
      video: { youtubeId: "QcIy9NiNbmo", title: "Taylor Swift - Bad Blood ft. Kendrick Lamar" },
      moment: {
        context: "The action-movie video premiered at an awards show with a cast of celebrity cameos, blurring music and blockbuster.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "1989-aoty",
      year: 2016,
      month: 2,
      day: 15,
      category: "sighting",
      title: "Second Album of the Year",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-89-3", label: "Album of the Year", kind: "award" },
      snippet: "She becomes the first woman to win the top Grammy twice.",
      // Photo added 2026-07-20 (photo-enrichment #762): page had zero photos.
      // Billboard/wp-content red-carpet frame from the same ceremony —
      // verified HTTP 200, image/jpeg, 650x430 (above the 400px floor),
      // downloaded + Read-viewed: Swift solo at the "GRAMMY AWARDS"
      // step-and-repeat in the orange crop top and magenta skirt she wore
      // the night 1989 won Album of the Year. Non-watermarked outlet CDN.
      thumbnailUrl:
        "https://www.billboard.com/wp-content/uploads/media/Taylor-Swift-grammys-2016-red-carpet-billboard-650.jpg",
      moment: {
        context: "Accepting the award, she used the moment to speak directly to young women about crediting their own work.",
        photos: [
          {
            url: "https://www.billboard.com/wp-content/uploads/media/Taylor-Swift-grammys-2016-red-carpet-billboard-650.jpg",
            focalPoint: "48% 20%",
            credit: "Getty Images, via Billboard",
            caption:
              "On the 58th Grammy Awards red carpet, February 15, 2016 — the night 1989 won Album of the Year, making Taylor the first woman to win the top Grammy twice.",
            kind: "primary",
          },
        ],
      },
    },
  ],
};
