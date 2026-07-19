// Vault content — Lover era.
//
// One wavetop month: August 2019, the album release. Every claim verified
// against its cited source directly. See
// docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first) authoring model this follows.

export default {
  eraSlug: 'lover',
  items: [
    {
      year: 2019,
      month: 9,
      day: 1,
      category: 'business',
      title: 'Lover makes her the first woman with six half-million album weeks',
      snippet:
        '867,000 units in week one — her sixth consecutive No. 1 album, and the first time a woman had six albums each sell over 500,000 copies in a week.',
      sourceUrl: 'https://www.billboard.com/pro/taylor-swift-lover-album-debuts-at-no-1-on-billboard-200-chart/',
      thumbnailUrl: 'https://images.complex.com/complex/image/upload/ar_1.91,c_fill,g_auto,q_auto/v1723858619/sanity-new%2Ftaylor-billboard-133759040',
      moment: {
        context:
          "The 867,000 units broke down to 679,000 in pure sales — the biggest sales week for any album since reputation's own debut — plus 226 million on-demand streams, then the second-biggest streaming debut for an album by a woman, behind only Ariana Grande's Thank U, Next.\n\nThe half-million-first-week club she now belonged to six times over (Fearless, Speak Now, Red, 1989, reputation, and now Lover) had exactly one other member in all of music: Eminem. And unlike reputation, which was held off streaming services in its early weeks, Lover posted those numbers while streaming everywhere from day one.",
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-lover-album-debuts-at-no-1-on-billboard-200-chart/',
          },
          {
            outlet: 'Complex',
            url: 'https://www.complex.com/music/a/cmplxtara-mahadevan/taylor-swift-lover-number-1-billboard',
          },
        ],
        photos: [
          {
            url: 'https://images.complex.com/complex/image/upload/ar_1.91,c_fill,g_auto,q_auto/v1723858619/sanity-new%2Ftaylor-billboard-133759040',
            credit: 'Complex',
            focalPoint: '46% 35%',
          },
          // Photo-enrichment pass (2026-07-18, #762): Valheria Rocha Lover-era
          // press photo from Billboard's own chart story on this exact No. 1
          // debut (billboard.com/wp-content CDN, downloaded and
          // vision-confirmed this session).
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/01-taylor-swift-press-photo-2019-billboard-1548.jpg',
            credit: 'Valheria Rocha (press photo via Billboard)',
            caption: 'A Lover-era press portrait, from Billboard\'s story on the 867,000-unit No. 1 debut.',
            kind: 'archival',
            focalPoint: '57% 25%',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 8,
      day: 23,
      category: 'music',
      title: 'The Man, and the double standard behind it',
      snippet:
        'Her own words: "We [women] have to curate and cater everything, but we have to make it look like an accident."',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Man_(Taylor_Swift_song)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7c/Taylor_Swift_-_The_Man.png',
      moment: {
        context:
          'The double standard, as she put it: if we make a mistake, that\'s our fault; if we strategize so we won\'t make a mistake, we\'re calculating — "a bit of a damned-if-we-do, damned-if-we-don\'t thing happening in music."\n\nIn outtakes from her Billboard Woman of the Decade cover story, she said the song was drawn from her own career and from hearing the same stories from women across the industry — and that the pop sheen was deliberate, so listeners would end up with "a song about gender inequality stuck in their heads." Written and produced with Joel Little, it became Lover\'s fourth single in January 2020 and peaked at No. 23 on the Hot 100; its self-directed video later won her Best Direction at the 2020 VMAs, the first solo female director to take the category.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Man_(Taylor_Swift_song)' },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-cover-story-outtakes-the-man-8546109/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/7/7c/Taylor_Swift_-_The_Man.png',
            credit: 'Republic Records (single cover art)',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 6,
      day: 17,
      category: 'business',
      title: 'You Need to Calm Down turns a music video into an Equality Act petition',
      snippet:
        'The video ends with a call to sign her petition for the Equality Act; by the VMAs that August, it had half a million signatures.',
      sourceUrl: 'https://www.advocate.com/news/2019/6/17/taylor-swift-releases-lgbtq-packed-video-you-need-calm-down',
      thumbnailUrl:
        // Image-fix pass (2026-07-10): #239 — Advocate crop had a "VIDEO SCREENSHOT" watermark baked into the
        // pixels (confirmed even on the un-cropped source). Replaced with an eonline.com frame from the same video
        // (curl-verified HTTP 200 image/jpeg); visually confirmed Taylor in the trailer-park pink fur coat/pearl
        // sunglasses look, no watermark, no collage.
        'https://akns-images.eonline.com/eol_images/Entire_Site/201969/rs_1043x646-190709093159-taylor-swift-music-video-2.jpg?fit=around%7C1043:646&output-quality=90&crop=1043:646;center,top',
      moment: {
        context:
          'The video itself, released June 17, 2019 and produced with Todrick Hall, packed its trailer-park block party with LGBTQ figures — Ellen DeGeneres, Billy Porter, Laverne Cox, RuPaul, the Queer Eye cast, Adam Rippon, and Jesse Tyler Ferguson with his real-life husband Justin Mikita — and closed on the on-screen ask: "Let\'s show our pride by demanding that, on a national level, our laws truly treat all our citizens equally." The Advocate called it her most pro-LGBTQ statement ever, and one of the most political stances she had taken with her music.\n\nShe personally wrote to her home-state senator, Lamar Alexander, urging support: "For American citizens to be denied jobs or housing based on who they love or how they identify, in my opinion, is un-American and cruel." Accepting Video of the Year at the VMAs, she noted the petition had "five times the amount that it would need to warrant a response from the White House."',
        sources: [
          {
            outlet: 'The Advocate',
            url: 'https://www.advocate.com/news/2019/6/17/taylor-swift-releases-lgbtq-packed-video-you-need-calm-down',
          },
          {
            outlet: 'Elite Daily',
            url: 'https://www.elitedaily.com/p/heres-how-to-sign-taylor-swifts-petition-supporting-the-equality-act-18700857',
          },
        ],
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/201969/rs_1043x646-190709093159-taylor-swift-music-video-2.jpg?fit=around%7C1043:646&output-quality=90&crop=1043:646;center,top',
            credit: 'E! News (video still)',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 8,
      day: 23,
      category: 'music',
      title: "Soon You'll Get Better, written for her mother",
      snippet: "The hardest song she's ever had to write, by her own account — about her mother's cancer diagnosis.",
      sourceUrl: "https://en.wikipedia.org/wiki/Soon_You'll_Get_Better",
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/DixieChicksMSG062003.jpg',
      moment: {
        context:
          'Her own words: "My dad got cancer when I was 13 and he got better... but things with my mom have been very different." The family actually discussed whether the song was too personal to release at all before agreeing it belonged on the album.\n\nShe brought in the Dixie Chicks — Natalie Maines, Emily Strayer, and Martie Maguire, the group she\'s said made her want to do this in the first place — with Strayer\'s banjo and Maguire\'s fiddle threaded through the fingerpicked arrangement, and all three harmonizing. She has performed it live exactly once — a stripped solo piano rendition for the One World: Together at Home pandemic broadcast on April 18, 2020, one day after cancelling all her 2020 shows — having previously said she found the song too emotionally difficult to perform.',
        sources: [
          { outlet: 'Wikipedia', url: "https://en.wikipedia.org/wiki/Soon_You'll_Get_Better" },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-soon-youll-get-better-together-at-home-global-citizen-986536/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/DixieChicksMSG062003.jpg',
            credit: 'Wasted Time R (CC BY-SA 2.5), via Wikimedia Commons',
            caption: 'The Dixie Chicks — who harmonize on "Soon You\'ll Get Better" — performing in 2003.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 8,
      day: 23,
      category: 'music',
      title: 'Death By A Thousand Cuts, borrowed from a Netflix movie that borrowed from her',
      snippet: 'A song written after crying over a rom-com — whose director had made that movie while listening to Taylor\'s own 1989.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Death_by_a_Thousand_Cuts_(song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/c/c5/Taylor_Swift_-_Death_by_a_Thousand_Cuts_%28Live_form_Paris%29.png',
      moment: {
        context:
          'Director Jennifer Kaytin Robinson said her film "Someone Great" was mainly inspired by 1989, especially "Clean." Taylor, after the song came from watching that film: "I just wrote a song based on something she made, which she made while listening to something I made, which is the most meta thing that\'s ever happened to me."\n\nThe song also settled a question she had raised about herself in print: in a March 2019 essay she wondered whether finding happiness would dull a catalog built on breakup songs, and resolved to write from friends\' experiences, books, and fictional characters instead of only her own life. She later told NPR\'s Tiny Desk audience she had absorbed breakup books and movies while making Lover — this track is the proof of concept. Its live debut came acoustically at the one-night City of Lover show in Paris, the version whose artwork appears here.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Death_by_a_Thousand_Cuts_(song)' }],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/c/c5/Taylor_Swift_-_Death_by_a_Thousand_Cuts_%28Live_form_Paris%29.png',
            credit: 'Republic Records (single cover art, Live from Paris version)',
            kind: 'primary',
            focalPoint: '35% 48%',
          },
          // Photo-enrichment pass (2026-07-18, #762): official Someone Great
          // trailer thumbnail — the Netflix film this page's story is about —
          // video id verified via YouTube oEmbed (author "Netflix") this
          // session. (The song's own Live From Paris video thumbnail was
          // rejected as a duplicate of the cover art above.)
          {
            url: 'https://i.ytimg.com/vi/BBd9gcrj2Wk/hqdefault.jpg',
            credit: 'Netflix via YouTube (official trailer)',
            caption: 'Gina Rodriguez in Someone Great — the Netflix film that inspired the song, itself written to Swift\'s discography.',
            kind: 'archival',
            focalPoint: '68% 50%',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 8,
      day: 26,
      category: 'fashion',
      title: 'A rainbow Versace blazer for the 2019 VMAs',
      snippet: 'An 80s-shouldered, kaleidoscope Versace blazer dress and thigh-high sequined boots, three days after Lover dropped.',
      sourceUrl: 'https://www.bustle.com/p/taylor-swifts-2019-mtv-vmas-outfit-had-her-wearing-versace-a-second-time-in-a-row-18687070',
      thumbnailUrl:
        'https://imgix.bustle.com/uploads/getty/2019/8/26/1a50b4b9-6a40-4a82-a40a-66e602f41cf5-getty-1170384770.jpg?w=248&h=165&fit=crop&crop=faces&dpr=2',
      moment: {
        context:
          'The beaded blazer dress — strong \'80s shoulders, hitting mid-thigh, worn with thigh-high black Christian Louboutin boots and styled by Joseph Cassell — made it two Versace red carpets in a row, after her Teen Choice Awards romper earlier that month.\n\nIt was also her first VMAs since 2015, and a working night: she opened the show with "You Need to Calm Down" and "Lover" in separate Versace performance looks, then used her Video of the Year acceptance to point out that the White House had yet to respond to her Equality Act petition.',
        sources: [
          {
            outlet: 'Bustle',
            url: 'https://www.bustle.com/p/taylor-swifts-2019-mtv-vmas-outfit-had-her-wearing-versace-a-second-time-in-a-row-18687070',
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/news/taylor-swift-wears-versace-2019-mtv-vmas-1234441',
          },
        ],
        photos: [
          {
            url: 'https://imgix.bustle.com/uploads/getty/2019/8/26/1a50b4b9-6a40-4a82-a40a-66e602f41cf5-getty-1170384770.jpg?w=248&h=165&fit=crop&crop=faces&dpr=2',
            credit: 'Dimitrios Kambouris/Getty Images',
          },
        ],
      },
    },
    {
      year: 2023,
      month: 10,
      day: 28,
      category: 'business',
      title: 'Cruel Summer takes four years to become a No. 1',
      snippet:
        "Debuted at No. 29 in 2019, fell to No. 71 the next week — until the Eras Tour revived it in 2023 and finally pushed it to No. 1.",
      sourceUrl: 'https://www.billboard.com/music/chart-beat/taylor-swift-cruel-summer-number-one-hot-100-1235452093/',
      thumbnailUrl: null,
      moment: {
        context:
          'It topped the Hot 100 on the chart dated October 28, 2023 — four years, one month and three weeks after it debuted, the fifth-longest climb to No. 1 in the chart\'s history.\n\nFans had campaigned for it since 2019, and the Eras Tour\'s opening Lover set turned the campaign into a groundswell (roughly 2.3 million TikTok videos deep); a live version, a remix, and the concert film\'s October release finally pushed it over, with 18.6 million streams and a roughly 1,400% sales spike in its final chart week. It landed as her 10th career No. 1 and Lover\'s first — and, as she noted, "it\'s not even the summer anymore."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-cruel-summer-number-one-hot-100-1235452093/',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-cruel-summer-tops-billboard-hot-100-1234860029/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/f8/Taylor_Swift_-_Cruel_Summer.png',
            credit: 'Republic Records (single cover art)',
            kind: 'primary',
            focalPoint: '42% 32%',
          },
          // Photo-enrichment pass (2026-07-18, #762): license-verified
          // Commons photo of the Eras Tour Lover act — the set "Cruel
          // Summer" opened nightly during the song's chart revival (CC BY
          // 2.0, Michael Hicks; extmetadata checked this session).
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Eras_Tour_-_Minneapolis%2C_MN_-_Lover_act_-_4.jpg',
            credit: 'Michael Hicks (CC BY 2.0), via Wikimedia Commons',
            caption: 'The Eras Tour Lover act in Minneapolis, June 2023 — the nightly "Cruel Summer" singalong that powered the song back up the chart.',
            kind: 'archival',
            focalPoint: '54% 45%',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 11,
      day: 14,
      category: 'business',
      title: 'Miss Americana is announced amid a fight over her own back catalog',
      snippet:
        'She said the men who now owned her masters, Scooter Braun and Scott Borchetta, refused to let her use any old music or performance footage in the documentary.',
      sourceUrl:
        'https://www.billboard.com/culture/tv-film/taylor-swift-miss-americana-netflix-documentary-release-date-8548174/',
      thumbnailUrl:
        // Image-fix pass (2026-07-10): #236 — capitalfm URL was a two-panel news collage (red-carpet photo +
        // poster) with a hard seam; replaced with the official Miss Americana one-sheet poster alone, sourced from
        // its enwiki infobox file. curl-verified HTTP 200 image/jpeg and visually confirmed: single poster, no
        // collage, "MISS AMERICANA / A NETFLIX ORIGINAL DOCUMENTARY / TAYLOR SWIFT / NETFLIX | JAN 31" with
        // Sundance laurel.
        'https://upload.wikimedia.org/wikipedia/en/thumb/a/ae/Taylor_Swift_-_Miss_Americana.jpg/500px-Taylor_Swift_-_Miss_Americana.jpg',
      moment: {
        context:
          'The announcement came in November 2019, months after the Big Machine sale, with Lana Wilson\'s film set to open Sundance on January 23 and hit Netflix eight days later — billed by Netflix as Swift embracing her role "as a woman harnessing the full power of her voice."\n\nThe standoff also threatened a planned AMA medley of her old hits; both were cleared within weeks — Variety reported the song clearances were ultimately "granted within a timely manner" — and the finished documentary never mentions Braun, Borchetta, or Big Machine by name.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/culture/tv-film/taylor-swift-miss-americana-netflix-documentary-release-date-8548174/',
          },
          {
            outlet: 'Fox News',
            url: 'https://www.foxnews.com/entertainment/netflix-taylor-swift-documentary-miss-americana',
          },
          {
            outlet: 'Capital FM',
            url: 'https://www.capitalfm.com/artists/taylor-swift/miss-americana-trailer-netflix-documentary/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/ae/Taylor_Swift_-_Miss_Americana.jpg/500px-Taylor_Swift_-_Miss_Americana.jpg',
            credit: 'Netflix (documentary poster art)',
            kind: 'primary',
            focalPoint: '72% 70%',
          },
          // Photo-enrichment pass (2026-07-18, #762): official Miss Americana
          // trailer thumbnail — video id verified via YouTube oEmbed (author
          // "Netflix") this session.
          {
            url: 'https://i.ytimg.com/vi/q07_k5VKuaQ/hqdefault.jpg',
            credit: 'Netflix via YouTube (official trailer)',
            caption: 'The mirror-ball dress frame from the official Miss Americana trailer.',
            kind: 'archival',
            focalPoint: '62% 28%',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 11,
      day: 24,
      category: 'business',
      title: 'Artist of the Decade, and a record 29 AMA wins',
      snippet: 'Named Artist of the Decade, then broke Michael Jackson\'s all-time AMA wins record in the same night.',
      sourceUrl: 'https://www.goodmorningamerica.com/culture/story/american-music-awards-2019-taylor-swift-breaks-records-67284943',
      thumbnailUrl:
        'https://s.abcnews.com/images/GMA/taylor-swift-ama-mo_hpEmbed_20191124-220255_3x2_992.jpg?w=992',
      moment: {
        context:
          'She took home six trophies on November 24, 2019 — five fan-voted awards, including Artist of the Year, plus Artist of the Decade, presented by Carole King — pushing her career AMA total to 29 and past Michael Jackson for the most wins in the show\'s history.\n\nThe performance was the real headline: after a public standoff over whether Big Machine would clear her old catalog, she sang "The Man" in a white button-down printed with the names of the albums she no longer owned, then ran a career medley through "Love Story," "I Knew You Were Trouble" and "Blank Space," with Camila Cabello and Halsey joining "Shake It Off" and ballerina Misty Copeland dancing through "Lover." Her speech skipped the feud entirely: "All that any artist wants is to create something that lasts."',
        sources: [
          {
            outlet: 'Good Morning America',
            url: 'https://www.goodmorningamerica.com/culture/story/american-music-awards-2019-taylor-swift-breaks-records-67284943',
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-ama-singer-beats-michael-jackson-for-most-american-music-awards-2019-performance-artist-of-the-decade/',
          },
        ],
        photos: [
          {
            url: 'https://s.abcnews.com/images/GMA/taylor-swift-ama-mo_hpEmbed_20191124-220255_3x2_992.jpg?w=992',
            credit: 'Good Morning America',
            focalPoint: '49% 25%',
          },
          // Photo-enrichment pass (2026-07-18, #762): second frame from the
          // same GMA story (s.abcnews.com CDN) — the "The Man" opener in the
          // white button-down printed with her Big Machine album titles.
          // Downloaded and vision-confirmed this session.
          {
            url: 'https://s.abcnews.com/images/GMA/taylor-swift-speak-mo_hpMain_20191124-220426_16x9_992.jpg?w=992',
            credit: 'Good Morning America',
            caption: 'Opening the medley with "The Man," in a button-down printed with the names of the albums she didn\'t own.',
            kind: 'archival',
            focalPoint: '48% 20%',
          },
        ],
      },
    },
    // --- Fashion/photo depth pass (2026-07-04)
    {
      year: 2019,
      month: 4,
      day: 26,
      category: 'fashion',
      title: 'Seven pastel outfit changes in the ME! video',
      snippet:
        'Styled by Joseph Cassell Falconer, the video traded Reputation black-and-white for tulle, pastels, and bold suiting — including a Monique Lhuillier tea-length dress and a lemon-yellow power suit.',
      sourceUrl: 'https://www.etonline.com/see-every-dreamy-outfit-taylor-swift-wears-in-me-music-video-124147',
      thumbnailUrl: 'https://www.etonline.com/sites/default/files/styles/1280x720/public/images/2019-04/taylor-swift-me-music-video-1280.jpg',
      moment: {
        context:
          'Longtime stylist Joseph Cassell Falconer put her through seven looks for the video, including a floral Monique Lhuillier tea-length dress with Alison Lou earrings and Roger Vivier shoes, an Alexander McQueen floral jacket-and-shorts set, and a ruffled Amorphose top over an Monica Ivena tulle skirt — the first full preview of the pastel "Lover" aesthetic.\n\nThe wardrobe had a huge stage to debut on: the video, co-directed by Swift and Dave Meyers and premiered at midnight on April 26, 2019, pulled in 65.2 million views in its first day — breaking the 24-hour Vevo record previously held by Ariana Grande\'s "Thank U, Next" — and critics read the bright palette as a deliberate, symbolic exit from the reputation era\'s black-and-white. The kitten Brendon Urie hands her mid-video was real, and stayed: Swift adopted him as her third cat, Benjamin Button.',
        sources: [
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/see-every-dreamy-outfit-taylor-swift-wears-in-me-music-video-124147',
          },
          {
            outlet: 'Refinery29',
            url: 'https://www.refinery29.com/en-us/2019/04/230942/taylor-swift-me-music-video-outfit-looks-shop',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Me!',
          },
        ],
        photos: [
          {
            url: 'https://www.etonline.com/sites/default/files/styles/1280x720/public/images/2019-04/taylor-swift-me-music-video-1280.jpg',
            credit: 'Entertainment Tonight',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 6,
      day: 17,
      category: 'fashion',
      title: 'Rainbow wig, western shirt, and a French fries costume in You Need to Calm Down',
      snippet:
        'Five outfit changes in the trailer-park video, from a peach Agent Provocateur robe to a rainbow wig with a Marina Hoermanseder western shirt and gold Saint Laurent shorts, ending in a French fries costume playing off Katy Perry\'s Met Gala burger dress.',
      sourceUrl: 'https://www.etonline.com/all-of-taylor-swifts-fabulous-outfits-from-you-need-to-calm-down-music-video-shop-the-looks-127156',
      thumbnailUrl:
        // Image-fix pass (2026-07-10): #237 — old bustle still was the opening trailer-park scene (pearl
        // sunglasses/fur coat), none of the three named looks. Replaced with a billboard.com still (curl-verified
        // HTTP 200 image/jpeg, no watermark) visually confirmed showing Taylor in the French fries costume next to
        // Katy Perry's burger costume — the closing look this moment specifically calls out.
        'https://www.billboard.com/wp-content/uploads/media/taylor-swift-calm-down-vid-2019-billboard-1548.jpg?w=875&h=583&crop=1',
      moment: {
        context:
          'The looks tracked the video\'s scenes: a peach silk Agent Provocateur robe and Sophia Webster heels to open, a pink Norma Kamali bikini with a faux-fur Vivetta jacket poolside, then a rainbow wig with a purple Marina Hoermanseder western shirt, gold metallic Saint Laurent shorts, and Irregular Choice unicorn boots.\n\nIt closes with a French fries costume and red Buffalo London x Opening Ceremony sandals, a direct callback to Katy Perry\'s cheeseburger look at the 2019 Met Gala.',
        sources: [
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/all-of-taylor-swifts-fabulous-outfits-from-you-need-to-calm-down-music-video-shop-the-looks-127156',
          },
          {
            outlet: 'Bustle',
            url: 'https://www.bustle.com/p/all-the-looks-from-taylor-swifts-you-need-to-calm-down-music-video-are-a-rainbow-dream-18010763',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-calm-down-vid-2019-billboard-1548.jpg?w=875&h=583&crop=1',
            credit: 'Billboard',
            caption: "Taylor in the closing French fries costume, next to Katy Perry's burger costume.",
          },
        ],
      },
    },
    {
      year: 2019,
      month: 6,
      day: 17,
      category: 'fashion',
      title: 'The glitter heart eye that became the Lover era\'s signature',
      snippet:
        'On the Lover album cover, shot by Valheria Rocha, she swapped her signature red lip for bright fuchsia and outlined one eye in a giant glittery heart, with streaks of pink and blue through her hair.',
      sourceUrl: 'https://www.refinery29.com/en-us/2019/06/235426/taylor-swift-lover-album-heart-makeup',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift credited the cover to "the artistic genius that is @valheria123" (photographer Valheria Rocha) on Instagram. The heart-lined eye, glitter, and pastel pink-and-blue hair streaks became a recurring beauty motif across the era\'s videos and press cycle.\n\nEvery element was a departure from an established signature: the giant glitter heart outlined her right eye, the trademark red lip went bright fuchsia, and the pink-and-blue streaks replaced the all-blonde hair fans had watched for a decade. Because Swift\'s beauty choices have a history of doubling as Easter eggs, Refinery29 noted fans immediately began hunting for a hidden meaning — and, more practically, planning recreations: "All of us are going to show up with glittery heart to the tour," as one put it, back when the era was still supposed to get one.',
        sources: [
          {
            outlet: 'Refinery29',
            url: 'https://www.refinery29.com/en-us/2019/06/235426/taylor-swift-lover-album-heart-makeup',
          },
          {
            outlet: 'YouBeauty',
            url: 'https://www.youbeauty.com/celebs/taylor-swift-provides-summer-makeup-inspo-on-her-lover-album-cover/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/c/cd/Taylor_Swift_-_Lover.png',
            credit: 'Republic Records / Valheria Rocha (album cover art)',
            caption: 'The Lover album cover, shot by Valheria Rocha — the glitter heart eye in its original context.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 11,
      day: 24,
      category: 'fashion',
      title: 'A shimmering green Julien Macdonald gown at the 2019 AMAs',
      snippet: 'She walked the American Music Awards red carpet in a green Julien Macdonald gown before changing into a shirt printed with the names of her old albums to perform "The Man."',
      sourceUrl: 'https://www.eonline.com/news/1095478/revisiting-taylor-swift-s-gorgeous-american-music-awards-looks',
      thumbnailUrl: 'https://akns-images.eonline.com/eol_images/Entire_Site/20191024/rs_634x1024-191124163526-634-taylor-swift-2019-AMAs-red-carpet-fashion.jpg',
      moment: {
        context:
          'The shimmering green gown came the same night she was named Artist of the Decade and broke the all-time AMA wins record, before she changed into a white button-up printed with the names of the "stolen" albums she no longer owned masters to, to perform "The Man."\n\nEntertainment Tonight logged the details of the custom Julien Macdonald design: a sparkly, draped dark-green dress with a leg-baring slit, worn with black over-the-knee boots, black geometric hoop earrings and rings, and her signature bangs with hair swept to the side. She arrived carrying five nominations and 23 career AMAs — one short of Michael Jackson\'s all-time record of 24, which made the red carpet the calm before a historically loaded night.',
        sources: [
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1095478/revisiting-taylor-swift-s-gorgeous-american-music-awards-looks',
          },
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/taylor-swift-shines-in-sparkly-green-dress-ahead-of-2019-amas-artist-of-the-decade-honor-136894',
          },
        ],
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/20191024/rs_634x1024-191124163526-634-taylor-swift-2019-AMAs-red-carpet-fashion.jpg',
            credit: 'Steve Granitz/WireImage',
          },
        ],
      },
    },
    // --- Fashion/photo depth pass round 2 (2026-07-04)
    {
      year: 2019,
      month: 8,
      day: 22,
      category: 'fashion',
      title: 'Jessica Jones sequin shorts and René Caovilla boots for the pre-release GMA set',
      snippet:
        'The morning before Lover dropped, she played Central Park in multi-colored Jessica Jones sequin shorts, a sheer Helmut Lang blouse over a Wolford bodysuit, and glitter-soled René Caovilla Karlotta boots.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-outfit-gma-performance-photos-8528049/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-gma-aug-2019-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'Performing "Me!," "You Need to Calm Down," and "Shake It Off" at Central Park\'s SummerStage on August 22, 2019, one day ahead of the Lover release. Footwear News (via Yahoo) named each piece: Jessica Jones sequin high-waisted shorts, a Helmut Lang sheer pink blouse, a Wolford bodysuit, and René Caovilla\'s black suede Karlotta booties with a glitter-covered sole.\n\nThe sparkle was only half the booking: the same Good Morning America appearance included the sit-down with Robin Roberts in which she confirmed, on air, that she planned to re-record her Big Machine catalog — so the glitter-soled boots ended up sharing a news cycle with one of the biggest business decisions of her career.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-outfit-gma-performance-photos-8528049/',
          },
          {
            outlet: 'Yahoo / Footwear News',
            url: 'https://www.yahoo.com/lifestyle/taylor-swift-ren-caovilla-boots-155958921.html',
          },
          {
            outlet: 'Good Morning America',
            url: 'https://www.goodmorningamerica.com/culture/story/taylor-swift-record-music-year-important-artists-work-65115745',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-gma-aug-2019-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Billboard',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 8,
      day: 22,
      category: 'fashion',
      title: 'A Johanna Ortiz tiered dress for the Lover music video',
      snippet:
        'In the pastel-house music video, she plays guitar in a yellow Johanna Ortiz "Ladies Who Lunch" tiered dress with matching Rebecca de Ravenel "Les Bonbons" ball earrings and an orange headband.',
      sourceUrl: 'https://www.spotern.com/en/spot/video/taylor-swift-lover-official-music-video/226542/yellow-tiered-dress-of-taylor-swift-in-the-music-video-lover',
      thumbnailUrl: 'https://medias.spotern.com/spots/w640/226/226542-1566837979.jpg',
      moment: {
        context:
          'The "Lover" video follows a couple through a color-coded house spanning different moods and moments of a shared life. The sunshine-yellow tiered dress is identified as Johanna Ortiz\'s "Ladies Who Lunch" style, paired with Rebecca de Ravenel "Les Bonbons" drop earrings — part of the video\'s wider pastel wardrobe.\n\nThe house itself was the concept: co-directed by Swift and Drew Kirsch and premiered on YouTube on August 22, 2019 — hours before the album dropped — the video puts the couple\'s whole domestic life inside a dollhouse held in a snow globe, one distinctly colored room at a time, with former tour dancer Christian Owens as the male lead. Critics compared the miniature, hyper-art-directed rooms to a Wes Anderson film, and the closing shot reveals the child holding the snow globe is the couple\'s daughter.',
        sources: [
          {
            outlet: 'Spotern',
            url: 'https://www.spotern.com/en/spot/video/taylor-swift-lover-official-music-video/226542/yellow-tiered-dress-of-taylor-swift-in-the-music-video-lover',
          },
          {
            outlet: 'Social Media Style',
            url: 'https://www.socialmediastyle.org/post/taylor-swift-s-yellow-ball-earrings-and-tiered-dress-from-the-lover-music-video',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Lover_(Taylor_Swift_song)',
          },
        ],
        photos: [
          {
            url: 'https://medias.spotern.com/spots/w640/226/226542-1566837979.jpg',
            credit: 'Spotern',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 7,
      day: 10,
      category: 'fashion',
      title: 'A sequined romper and Kat Maconie heels at the Amazon Prime Day concert',
      snippet:
        'Opening with pyrotechnics for "ME!," she performed the Hammerstein Ballroom show in a black-and-purple sequined romper with Kat Maconie\'s glitter-jeweled "Frida" block heels.',
      sourceUrl: 'https://www.yahoo.com/entertainment/taylor-swift-steals-spotlight-block-152845330.html',
      thumbnailUrl:
        'https://s.yimg.com/ny/api/res/1.2/nGumpB8peACYAs7Asf2FzQ--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyNDI7aD05NTg7Y2Y9d2VicA--/https://media.zenfs.com/en/footwear_news_642/b9f0d931ac0118fb627ab814516c62d5',
      moment: {
        context:
          'Headlining the Amazon Prime Day Concert at Hammerstein Ballroom on July 10, 2019 alongside Dua Lipa, SZA, and Becky G, she opened with "Me!" in a sparkling black-and-purple striped sequin romper. Footwear News named her shoes as Kat Maconie\'s $370 "Frida" style — thick block heels with dark, reflective jewel detailing and a thin silver ankle strap.\n\nBillboard\'s recap called the staging "stadium-level production" jammed into a theater — pyrotechnics, smoke cannons, and spark showers — across a set that gave "You Need to Calm Down" its live debut and ran through "I Knew You Were Trouble," "Style," and "Love Story," plus acoustic takes on "Welcome to New York" and "Delicate," before a confetti-drenched "Shake It Off" closed the night with Becky G and Dua Lipa back onstage.',
        sources: [
          {
            outlet: 'Yahoo / Footwear News',
            url: 'https://www.yahoo.com/entertainment/taylor-swift-steals-spotlight-block-152845330.html',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/amazon-prime-day-concert-recap-taylor-swift-8519537/',
          },
        ],
        photos: [
          {
            url: 'https://s.yimg.com/ny/api/res/1.2/nGumpB8peACYAs7Asf2FzQ--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyNDI7aD05NTg7Y2Y9d2VicA--/https://media.zenfs.com/en/footwear_news_642/b9f0d931ac0118fb627ab814516c62d5',
            credit: 'Footwear News',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 12,
      day: 16,
      category: 'fashion',
      title: 'A floral Oscar de la Renta gown, by Laura Kim and Fernando Garcia, at the Cats premiere',
      snippet:
        'For the Cats world premiere in New York, she wore a strapless Oscar de la Renta gown with giant 3D floral appliqué across the bodice and a train — designed by the label\'s Laura Kim and Fernando Garcia.',
      sourceUrl: 'https://graziamagazine.com/articles/taylor-swift-cats-premiere-oscar-de-la-renta/',
      thumbnailUrl:
        'https://graziamagazine.com/wp-content/uploads/2019/12/taylor-swift-attends-the-world-premiere-of-cats-at-alice-news-photo-1576544616.jpg',
      moment: {
        context:
          'At the December 16, 2019 world premiere at Alice Tully Hall in New York (with Joe Alwyn attending but staying off the official carpet), the strapless gown\'s vintage-tapestry-style floral brocade and dimensional 3D blossoms were credited to Oscar de la Renta\'s creative directors Laura Kim and Fernando Garcia, styled with red silk heels and her signature red lip.\n\nGrazia\'s writeup leaned on the drama of the silhouette — the intricate floral appliqué concentrated at the bodice, "falling with drama at the hem" — and on the deliberate contrast of a sweeping ball gown worn into bitter December weather. Four days before the film opened to some of the harshest reviews of the year, the premiere carpet was the one unambiguous win of the Cats rollout.',
        sources: [
          {
            outlet: 'Grazia',
            url: 'https://graziamagazine.com/articles/taylor-swift-cats-premiere-oscar-de-la-renta/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-cats-premiere-dress-red-carpet-8546528/',
          },
        ],
        photos: [
          {
            url: 'https://graziamagazine.com/wp-content/uploads/2019/12/taylor-swift-attends-the-world-premiere-of-cats-at-alice-news-photo-1576544616.jpg',
            credit: 'Getty Images',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 2,
      day: 27,
      category: 'fashion',
      title: 'Bill Corso\'s six-person prosthetic transformation for The Man',
      snippet:
        'To play her male alter ego in The Man, makeup artist Bill Corso spent four to six hours a day building a new jawline, nose, brows, and facial hair with a muscle suit and dark contacts.',
      sourceUrl: 'https://www.rollingstone.com/music/music-news/taylor-swift-the-man-music-video-makeup-959829/',
      thumbnailUrl: 'https://www.nme.com/wp-content/uploads/2020/02/tay-696x442.png',
      moment: {
        context:
          'For the self-directed video released February 27, 2020, makeup artist Bill Corso — known for Nicole Kidman\'s Bombshell transformation — led a team of more than six people to turn Swift into "Tyler Swift."\n\nThe look combined a muscle suit, eyebrow wigs, and facial prosthetics for a new jawline and nose, with movement coaches Stephen Galloway and Spenser Theberge teaching her masculine gait and mannerisms. The video closes on a before-and-after reveal of the disguise.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-the-man-music-video-makeup-959829/',
          },
          {
            outlet: 'NME',
            url: 'https://www.nme.com/news/music/taylor-behind-the-scenes-the-man-video-transformation-2616077',
          },
        ],
        photos: [
          {
            url: 'https://www.nme.com/wp-content/uploads/2020/02/tay-696x442.png',
            credit: 'NME',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 1,
      day: 23,
      category: 'fashion',
      title: 'Head-to-toe plaid at the Miss Americana Sundance premiere',
      snippet: 'A grey-and-white checked Carmen March jumpsuit, coat, and heels for the Sundance Film Festival premiere of her documentary — a notable, more mature departure from her usual red-carpet look.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-plaid-outfit-sundance-photo-8548953/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-sundance-2020-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'The wide-legged, belted jumpsuit, trenchcoat, and heels were all in matching grey-and-white plaid, from Carmen March\'s Fall 2019 collection, worn with Mateo earrings, rings, and matching checked shoes on January 23, 2020, in Park City, Utah.\n\nBillboard finished the look\'s inventory with a side-parted blonde style and her signature red lip — and noted what she did in it: after the Miss Americana screening she took the stage for a brief Q&A alongside director Lana Wilson. The head-to-toe menswear plaid read as a deliberate register shift — a film-festival look for a film-festival night, eight days before the documentary reached everyone else on Netflix.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-plaid-outfit-sundance-photo-8548953/',
          },
          {
            outlet: 'Red Carpet Fashion Awards',
            url: 'https://www.redcarpet-fashionawards.com/2020/01/24/taylor-swift-wore-carmen-march-to-the-taylor-swift-miss-americana-sundance-film-festival-premiere/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-sundance-2020-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Neilson Barnard/Getty Images',
          },
        ],
      },
    },
    // --- Sightings pass (2026-07-05)
    {
      year: 2019,
      month: 8,
      day: 26,
      category: 'sighting',
      title: 'A sequined jumpsuit and a Hadid-sister hang at the VMAs after-party',
      snippet:
        "Fresh off three VMA wins, she changed into a black sequined jumpsuit and spent Republic Records' after-party at The Fleur Room posing with longtime friends Gigi and Bella Hadid.",
      sourceUrl:
        'https://www.billboard.com/music/pop/taylor-swift-vmas-after-party-outfit-sparkly-black-jumpsuit-photos-8528483/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/media/taylor-swift-gigi-hadid-bella-hadid-2019-billboard-vmas-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'At Republic Records\' after-party at The Fleur Room inside Moxy Chelsea on August 26, 2019 — hours after winning Video of the Year for "You Need to Calm Down" — she changed into a black sequined jumpsuit with a bold red lip, gold eyeshadow, and sparkly purple nails.\n\nShe was photographed posing repeatedly with the Hadid sisters, Gigi in a beige corset and matching pants and Bella in a nude two-piece, with "You Need to Calm Down" co-stars Jesse Tyler Ferguson and Justin Mikita also there.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-vmas-after-party-outfit-sparkly-black-jumpsuit-photos-8528483/',
          },
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/taylor-swift-celebrates-vma-wins-at-after-party-with-gigi-and-bella-hadid-131320',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-gigi-hadid-bella-hadid-2019-billboard-vmas-1548.jpg?w=942&h=628&crop=1',
            credit: 'Billboard',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 10,
      day: 5,
      category: 'sighting',
      title: 'Hand-in-hand with Joe Alwyn at the SNL after-party',
      snippet:
        'Straight from a stripped-down "Lover" and "False God"\'s saxophone-led live debut on SNL, she and Joe Alwyn were photographed holding hands heading into Zuma for the cast\'s after-party.',
      sourceUrl: 'https://www.etonline.com/taylor-swift-and-joe-alwyn-seen-hand-in-hand-outside-snl-after-party-133881',
      thumbnailUrl:
        'https://www.etonline.com/sites/default/files/styles/1280x720/public/images/2019-10/swiftalwyn2.jpg?h=5c0d22e0&width=1024&quality=80',
      moment: {
        context:
          'On October 6, 2019, hours after performing a stripped-down "Lover" and giving "False God" its saxophone-led live debut on Saturday Night Live, she and boyfriend Joe Alwyn were photographed holding hands as they headed into Zuma in New York for the cast\'s after-party.\n\nShe kept her performance look — an oversized black Ambush blazer, crystal-embellished Libertine flare pants, and Christian Louboutin shoes — while Alwyn wore a grey shirt with a black jacket.',
        sources: [
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/taylor-swift-and-joe-alwyn-seen-hand-in-hand-outside-snl-after-party-133881',
          },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1080192/taylor-swift-gives-romantic-performance-on-snl-before-bringing-joe-alwyn-to-after-party',
          },
        ],
        photos: [
          {
            url: 'https://www.etonline.com/sites/default/files/styles/1280x720/public/images/2019-10/swiftalwyn2.jpg?h=5c0d22e0&width=1024&quality=80',
            credit: 'Entertainment Tonight',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 12,
      day: 13,
      category: 'sighting',
      title: 'Blake Lively and Ryan Reynolds help her ring in 30 at Oscar Wilde',
      snippet:
        "After opening Z100's Jingle Ball, she gathered close friends — Blake Lively, Ryan Reynolds, and Gigi Hadid among them — for a 10 p.m. birthday dinner at Oscar Wilde restaurant in New York.",
      sourceUrl:
        'https://www.justjared.com/2019/12/14/blake-lively-ryan-reynolds-help-taylor-swift-celebrate-her-30th-birthday-in-nyc/',
      thumbnailUrl:
        // Image-fix pass (2026-07-10): #234 — swapped /thumbs/ 80x120 crop for the full-res original on the same
        // JustJared S3 path; curl-verified HTTP 200 image/jpeg and visually confirmed Blake Lively (red coat) and
        // Ryan Reynolds (glasses, burgundy jacket) exiting the venue at night.
        'https://jj-justjared-media.s3.amazonaws.com/wp-content/uploads/2019/12/lively-bdayp/blake-lively-ryan-reynolds-at-taylor-swift-party-01.jpg',
      moment: {
        context:
          "On December 13, 2019 — her 30th birthday — she opened the show at Z100's Jingle Ball, then friends joined her for a 10 p.m. dinner party at Oscar Wilde restaurant in New York City.\n\nBlake Lively was photographed leading the way out of the restaurant with husband Ryan Reynolds that Friday night, among a guest list that also included Gigi Hadid, Martha Hunt, and boyfriend Joe Alwyn.",
        sources: [
          {
            outlet: 'Just Jared',
            url: 'https://www.justjared.com/2019/12/14/blake-lively-ryan-reynolds-help-taylor-swift-celebrate-her-30th-birthday-in-nyc/',
          },
        ],
        photos: [
          {
            url: 'https://jj-justjared-media.s3.amazonaws.com/wp-content/uploads/2019/12/lively-bdayp/blake-lively-ryan-reynolds-at-taylor-swift-party-01.jpg',
            credit: 'Backgrid',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 12,
      day: 16,
      category: 'sighting',
      title: 'Hand in hand under an umbrella after the Cats premiere',
      snippet:
        'Days after they celebrated her 30th birthday together, cameras caught her and Joe Alwyn walking hand-in-hand under a shield of umbrellas as they left the Cats premiere in New York.',
      sourceUrl: 'https://www.eonline.com/news/1103481/taylor-swift-and-joe-alwyn-show-rare-pda-after-the-cats-premiere',
      thumbnailUrl:
        'https://akns-images.eonline.com/eol_images/Entire_Site/20191117/rs_634x1024-191217033401-634-Taylor-Swift-Joe-Alwyn-JR-121719.jpg',
      moment: {
        context:
          "On December 16, 2019, after the New York premiere of Tom Hooper's Cats — where Alwyn attended but stayed off the official red carpet — cameras caught the couple walking hand-in-hand under a shield of umbrellas as they left the theater together.\n\nShe wore an Oscar de la Renta gown with floral appliqué for the carpet; Alwyn reportedly sat next to her during the screening.",
        sources: [
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1103481/taylor-swift-and-joe-alwyn-show-rare-pda-after-the-cats-premiere',
          },
        ],
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/20191117/rs_634x1024-191217033401-634-Taylor-Swift-Joe-Alwyn-JR-121719.jpg',
            credit: 'JosiahW / BACKGRID',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 1,
      day: 5,
      category: 'sighting',
      title: 'Kisses at the bar during the Golden Globes after-party',
      snippet:
        'At the CAA after-party for the 2020 Golden Globes, an eyewitness said she leaned in to kiss Joe Alwyn "several times" as the two grabbed drinks and mingled at the Sunset Tower Hotel.',
      sourceUrl:
        'https://www.eonline.com/news/1108537/taylor-swift-and-joe-alwyn-are-the-chicest-couple-at-the-2020-golden-globes-after-party',
      thumbnailUrl:
        // Image-fix pass (2026-07-10): #240 — old crop showed Taylor alone mid-conversation, no Joe Alwyn, no kiss.
        // Replaced with a same-agency (Coleman-Rayner) frame from E! News's "Romance Rewind" gallery, dated/
        // captioned to this same Jan 2020 Golden Globes after-party; curl-verified HTTP 200 image/jpeg and visually
        // confirmed Taylor with her arm around Joe Alwyn's head in a close embrace, both in black formalwear.
        'https://akns-images.eonline.com/eol_images/Entire_Site/202007/rs_634x1024-200107091907-634-taylor-swift-joe-alwyn.cm.1720.jpg',
      moment: {
        context:
          'At Creative Artists Agency\'s after-party at the Sunset Tower Hotel in Los Angeles on January 5, 2020, an eyewitness said the couple "looked inseparable and really in love. Taylor had her arm on Joe, and she leaned in to kiss him several times."\n\nShe wore a sparkly black dress with a metallic clutch; Alwyn was in a classic tuxedo. She had been nominated for Best Original Song for her Cats ballad "Beautiful Ghosts," while Alwyn was there to support his Harriet co-stars.',
        sources: [
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1108537/taylor-swift-and-joe-alwyn-are-the-chicest-couple-at-the-2020-golden-globes-after-party',
          },
        ],
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/202007/rs_634x1024-200107091907-634-taylor-swift-joe-alwyn.cm.1720.jpg',
            credit: 'Coleman-Rayner',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 4,
      day: 29,
      category: 'sighting',
      title: "Joe Alwyn's Instagram gives away a quarantine with Taylor's cat",
      snippet:
        "Notoriously private about their relationship, the couple's lockdown togetherness leaked out sideways: Joe Alwyn posted Instagram Stories of Taylor's cat Benjamin Button hiding in a grocery bag, a box, and under a rug.",
      sourceUrl:
        'https://www.justjared.com/2020/04/29/joe-alwyn-shares-cute-pics-of-girlfriend-taylor-swifts-cat-benjamin-button-during-quarantine/',
      thumbnailUrl:
        // Image-fix pass (2026-07-10): #235 — swapped /thumbs/ 80x120 crop for the full-res original on the same
        // JustJared S3 path; curl-verified HTTP 200 image/jpeg and visually confirmed it's Joe Alwyn's selfie
        // holding a glass of wine, the same IG-story image referenced in the context text below.
        'https://jj-justjared-media.s3.amazonaws.com/wp-content/uploads/2020/04/joe-cat/joe-alwayn-button-pics-ig-story-01.jpg',
      moment: {
        context:
          'On April 29, 2020, Joe Alwyn shared three photos to his Instagram Stories of Benjamin Button — the kitten Taylor adopted after he appeared in her "ME!" video — peeking out of a paper grocery bag, poking his head from a cardboard box, and tucked underneath a rug, along with a selfie holding a glass of wine.\n\nThe notoriously private couple rarely appeared on each other\'s social media, so fans took the cat cameo as a rare, sideways glimpse of them quarantining together during the pandemic.',
        sources: [
          {
            outlet: 'Just Jared',
            url: 'https://www.justjared.com/2020/04/29/joe-alwyn-shares-cute-pics-of-girlfriend-taylor-swifts-cat-benjamin-button-during-quarantine/',
          },
          {
            outlet: 'Capital FM',
            url: 'https://www.capitalfm.com/artists/taylor-swift/boyfriend-joe-alwyn-benjamin-button/',
          },
        ],
        photos: [
          {
            url: 'https://jj-justjared-media.s3.amazonaws.com/wp-content/uploads/2020/04/joe-cat/joe-alwayn-button-pics-ig-story-01.jpg',
            credit: 'Joe Alwyn / Instagram',
          },
        ],
      },
    },
    // --- Music backstory + sighting/fashion/business depth pass (2026-07-05)
    {
      year: 2019,
      month: 6,
      day: 14,
      category: 'sighting',
      title: 'A surprise "Shake It Off" at the Stonewall Inn for Pride\'s 50th anniversary',
      snippet:
        'Hours after "You Need to Calm Down" dropped, she showed up unannounced at the Stonewall Inn\'s 50th-anniversary Pride event: "Thank you for having me, Stonewall. Happy Pride!"',
      sourceUrl: 'https://abcnews.com/Entertainment/taylor-swift-makes-surprise-appearance-stonewall-inn-performs/story?id=63731487',
      thumbnailUrl: 'https://s.abcnews.com/images/GMA/taylor-swift-stonewall-gty-mo-20190615_hpMain_16x9_992.jpg?w=992',
      moment: {
        context:
          'In mid-June 2019, hours after releasing "You Need to Calm Down," Swift made a surprise appearance at AEG and the Stonewall Inn\'s invitation-only Pride celebration marking the 50th anniversary of the Stonewall uprising, headlined by Jesse Tyler Ferguson.\n\nShe performed an acoustic "Shake It Off," telling the crowd, "Thank you for having me, Stonewall. Happy Pride!" before inviting Ferguson onstage for a duet, saying she\'d heard it was his favorite karaoke song.',
        sources: [
          {
            outlet: 'ABC News',
            url: 'https://abcnews.com/Entertainment/taylor-swift-makes-surprise-appearance-stonewall-inn-performs/story?id=63731487',
          },
          {
            outlet: 'BuzzFeed News',
            url: 'https://www.buzzfeed.com/adeonibada/taylor-swift-surprise-performance-stonewall-inn-nyc-pride',
          },
        ],
        photos: [
          {
            url: 'https://s.abcnews.com/images/GMA/taylor-swift-stonewall-gty-mo-20190615_hpMain_16x9_992.jpg?w=992',
            credit: 'Getty Images via ABC News',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 8,
      day: 23,
      category: 'music',
      title: 'Cruel Summer, born from a casual jam with St. Vincent and Jack Antonoff',
      snippet:
        'St. Vincent, on writing it: "Gosh, it was really casual... just some people in a room jammin\'." Taylor\'s own pitch: "a desperate summer love that might be doomed from the start."',
      sourceUrl: 'https://www.nme.com/big-reads/st-vincent-cover-interview-2021-daddys-home-2912166',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/f/f8/Taylor_Swift_-_Cruel_Summer.png',
      moment: {
        context:
          'Swift wrote the song with Jack Antonoff and St. Vincent (Annie Clark), who later described their process to NME as "really casual... just some people in a room jammin\'."\n\nIn her own Spotify storyline note, Swift wrote: "I wanted this song to feel like a desperate summer love that might be doomed from the start. My favorite line from this song is \'I love you. Ain\'t that the worst thing you ever heard?\'" It wasn\'t released as a single in 2019 — it took the Eras Tour, four years later, to send it to No. 1.',
        sources: [
          { outlet: 'NME', url: 'https://www.nme.com/big-reads/st-vincent-cover-interview-2021-daddys-home-2912166' },
          { outlet: 'Songfacts', url: 'https://www.songfacts.com/facts/taylor-swift/cruel-summer' },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/f8/Taylor_Swift_-_Cruel_Summer.png',
            credit: 'Republic Records (single cover art)',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 8,
      day: 23,
      category: 'music',
      title: "I Forgot That You Existed, the track built to end Reputation's cycle of grieving",
      snippet:
        'The Lover opener started nearly finished, by design: "I wanted to come in with an idea that was pretty much all there, melody and lyrics."',
      sourceUrl: 'https://www.rollingstone.com/music/music-features/taylor-swift-rolling-stone-interview-880794/',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift told Rolling Stone the song came out of the emotional distance she found on the Reputation Stadium Tour: "It was sometime on the Reputation tour, which was the most transformative emotional experience of my career. That tour put me in the healthiest, most balanced place I\'ve ever been. After that tour, bad stuff can happen to me, but it doesn\'t level me anymore."\n\nShe picked it to open Lover as a way of "basically kind of shrugging off a lot of things that you\'ve been through that have been causing a lot of struggle and pain."',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/taylor-swift-rolling-stone-interview-880794/',
          },
          { outlet: 'Songfacts', url: 'https://www.songfacts.com/facts/taylor-swift/i-forgot-that-you-existed' },
        ],
        photos: [
          {
            url: 'https://i.ytimg.com/vi/p1cEvNn88jM/hqdefault.jpg',
            credit: 'Republic Records / YouTube (official audio still)',
            caption: "Artwork from the official 'I Forgot That You Existed' audio upload on Taylor Swift's YouTube channel.",
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 8,
      day: 23,
      category: 'music',
      title: "Miss Americana & the Heartbreak Prince, a high school built from 2018's political disillusionment",
      snippet:
        'Written with Joel Little after the midterms: "This song is about disillusionment with our crazy world of politics and inequality, set in a metaphorical high school."',
      sourceUrl: 'https://www.rollingstone.com/music/music-features/taylor-swift-rolling-stone-interview-880794/',
      thumbnailUrl: null,
      moment: {
        context:
          'In her Spotify storyline, Swift said: "This song is about disillusionment with our crazy world of politics and inequality, set in a metaphorical high school... I wanted it to be about finding one person who really sees you and cares about you through all the noise."\n\nShe expanded on it to Rolling Stone: "It\'s about the illusions of what I thought America was before our political landscape took this turn, and that naivete that we used to have about it," written "a couple of months after midterm elections."',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/taylor-swift-rolling-stone-interview-880794/',
          },
          {
            outlet: 'Songfacts',
            url: 'https://www.songfacts.com/facts/taylor-swift/miss-americana-the-heartbreak-prince',
          },
        ],
        photos: [
          {
            url: 'https://i.ytimg.com/vi/Kwf7P2GNAVw/hqdefault.jpg',
            credit: 'Republic Records / YouTube (official audio still)',
            caption: "Artwork from the official 'Miss Americana & The Heartbreak Prince' audio upload on Taylor Swift's YouTube channel.",
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 12,
      day: 12,
      category: 'business',
      title: "Billboard names her the first-ever Woman of the Decade",
      snippet:
        'Accepting the inaugural award, she said: "The pressure that could have crushed us made us into diamonds instead" — then used the speech to relitigate the Scooter Braun masters fight.',
      sourceUrl: 'https://www.billboard.com/music/awards/taylor-swift-woman-of-the-decade-speech-billboard-women-in-music-8546156/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/media/Taylor-Swift-bb29-2019-feat-billboard-ylajkse-1500.jpg',
      moment: {
        context:
          "At Billboard's Women in Music event on December 12, 2019 at the Hollywood Palladium, Swift became the first recipient of the magazine's Woman of the Decade award, recognizing five No. 1 albums, five No. 1 singles, and three stadium tours across the 2010s. In her speech she said: \"I now have come to expect that with good news comes some sort of pushback, but I didn't know that then... the pressure that could have crushed us made us into diamonds instead.\"\n\nShe also addressed the sale of her masters, noting it happened \"without my approval, consultation, or consent,\" and told Billboard's accompanying cover story: \"I do want my music to live on. I do want it to be in movies, I do want it to be in commercials.\"",
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/awards/taylor-swift-woman-of-the-decade-speech-billboard-women-in-music-8546156/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-cover-story-interview-billboard-women-in-music-2019-8545822/',
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added the on-stage speech
        // photo from Billboard's own story on the night (billboard.com CDN,
        // 1548px, no watermark) — her at the Palladium mic holding the
        // inaugural award. Both images verified HTTP 200 + image/jpeg,
        // downloaded, and visually confirmed this session.
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/Taylor-Swift-bb29-2019-feat-billboard-ylajkse-1500.jpg',
            credit: 'Billboard',
            focalPoint: '51% 16%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/01-taylor-swift-speach-2019-wim-billboard-1548.jpg',
            credit: 'Billboard',
            caption:
              "Accepting the inaugural Woman of the Decade award at Billboard's Women in Music, Hollywood Palladium, Dec. 12, 2019.",
            kind: 'archival',
            focalPoint: '53% 18%',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 1,
      day: 5,
      category: 'fashion',
      title: 'A custom Etro floral gown, a "Lover"-coded look for the 2020 Golden Globes',
      snippet:
        'Nominated for Best Original Song ("Beautiful Ghosts," from Cats), she wore a navy Etro ball gown with a bold gold floral print, keyhole cutout, and low-cut back — a nod to the Lover era\'s rainbow palette.',
      sourceUrl: 'https://www.bustle.com/p/taylor-swifts-2020-golden-globes-dress-was-a-not-so-subtle-nod-to-her-lover-album-19766894',
      thumbnailUrl:
        'https://imgix.bustle.com/uploads/getty/2020/1/6/36da59a0-670b-451b-bd63-4ef9b0134e59-getty-1197739056.jpg?w=248&h=165&fit=crop&crop=faces&dpr=2',
      moment: {
        context:
          'At the January 5, 2020 Golden Globes, where she was nominated for Best Original Song for her Cats ballad "Beautiful Ghosts" (co-written with Andrew Lloyd Webber), Swift wore a custom Etro gown: a navy jacquard base with a bold golden floral pattern, a keyhole cutout at the midriff, straps extending into a low-cut open back, and a structured floral train.\n\nShe paired it with drop earrings set with navy, emerald, and diamond stones, swapping her signature red lip for a pink nude. Joe Alwyn, there to support Harriet co-stars, wore a dark tuxedo.',
        sources: [
          {
            outlet: 'Bustle',
            url: 'https://www.bustle.com/p/taylor-swifts-2020-golden-globes-dress-was-a-not-so-subtle-nod-to-her-lover-album-19766894',
          },
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/taylor-swift-and-joe-alwyn-look-sensational-at-2020-golden-globes-137952',
          },
        ],
        photos: [
          {
            url: 'https://imgix.bustle.com/uploads/getty/2020/1/6/36da59a0-670b-451b-bd63-4ef9b0134e59-getty-1197739056.jpg?w=248&h=165&fit=crop&crop=faces&dpr=2',
            credit: 'Getty Images via Bustle',
          },
        ],
      },
    },

    // --- Thin-era top-up (2026-07-08, audit rollout PR 2): the era's empty
    // release, tour, and relationship categories, filled with public record —
    // the one Lover-era concert, the festival that never happened, the film
    // releases, and the doc's rare on-record relationship material. New items
    // carry the audit's additive provenance fields.
    {
      slug: 'city-of-lover-paris',
      year: 2019,
      month: 9,
      day: 9,
      category: 'tour',
      title: 'City of Lover: the only full Lover concert there would ever be',
      snippet:
        'One night at L\'Olympia in Paris, Sept. 9, 2019 — a fans-only show for contest winners from 37 countries, and, until the Eras Tour, the only time most Lover songs were played to a live audience.',
      sourceUrl: 'https://en.wikipedia.org/wiki/City_of_Lover',
      thumbnailUrl: null,
      moment: {
        context:
          'The 2,000-capacity music hall — her first Paris theater show since 2011 — held only fans who won tickets through contests and album-purchase draws, with no public sale.\n\nThe 16-song set split evenly between Lover and back catalog, and several album tracks got their live debuts — "Cornelia Street," "Death by a Thousand Cuts," "The Man" — some inside a stripped acoustic segment where she talked through the songwriting; the crowd wore LED wristbands synced to the music. The concert later aired as a TV special in May 2020, by which point the pandemic had guaranteed its "only Lover-era show" status.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/City_of_Lover',
            source_title: 'City of Lover',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-plays-lover-tracks-live-first-time-paris-watch-8529533/',
            source_title: "Taylor Swift Plays 'Lover' Tracks Live for the First Time in Paris: Watch",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-eras-tour-surprise-songs/',
            source_title: 'Every Surprise Song Taylor Swift Has Played on the Eras Tour',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-10',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://i.ytimg.com/vi/d_2WyBcFbFY/hqdefault.jpg',
            credit: 'Republic Records / YouTube (official video still)',
            caption: "Onstage at L'Olympia — still from the official 'The Archer (Live From Paris)' video on Taylor Swift's YouTube channel.",
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'lover-fest-announced',
      year: 2019,
      month: 9,
      day: 17,
      category: 'tour',
      title: 'Lover Fest: a festival instead of a tour',
      snippet:
        'Her announced plan for the era, revealed Sept. 17, 2019: skip the full stadium slog and throw a handful of self-headlined festival weekends instead — including opening the brand-new SoFi Stadium in Los Angeles.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Lover_Fest',
      thumbnailUrl: null,
      moment: {
        context:
          'Lover Fest East and West were set for summer 2020 — Foxborough\'s Gillette Stadium on July 31 and August 1, and two nights at SoFi on July 25 and 26, which would have made her the first woman in history to open an NFL stadium — plus European dates running June 20 to July 9 and a single Brazil show on July 18. She framed the format as a deliberate breather after the reputation Stadium Tour: fewer shows, bigger parties.\n\nHer announcement pitched the concept in album language: "The Lover album is open fields, sunsets, + SUMMER. I want to perform it in a way that feels authentic." The four stadium nights were billed as her only U.S. shows of 2020, with Verified Fan presales ahead of the October 17 public on-sale — a scarcity model that made the eventual cancellation sting all the more, because there was no rest of the tour to fall back on.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Lover_Fest',
            source_title: 'Lover Fest',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-lover-fest-tour-dates-885897/',
            source_title: "Taylor Swift Announces 2020 'Lover Fest' Stadium Shows",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/SoFi_Stadium_2021.jpg/960px-SoFi_Stadium_2021.jpg',
            credit: 'Troutfarm27 (CC BY-SA 4.0), via Wikimedia Commons',
            caption: 'Reference image: SoFi Stadium in Inglewood, the venue Lover Fest West would have opened — no Lover Fest show was ever performed.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      slug: 'lover-fest-2020-cancelled',
      year: 2020,
      month: 4,
      day: 17,
      category: 'tour',
      title: 'Lover Fest falls to the pandemic',
      snippet:
        'On April 17, 2020, she called off all her 2020 live dates: "I\'m so sad I won\'t be able to see you guys in concert this year, but I know this is the right decision." The era that skipped the tour ended up with no shows at all.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Lover_Fest',
      thumbnailUrl: null,
      moment: {
        context:
          'Lover Fest West had been set for SoFi Stadium on July 25–26, Lover Fest East for Gillette on July 31–August 1, and her Glastonbury headline slot fell in the same sweep.\n\nHer statement asked fans to hold on: "Please, please stay healthy and safe. I\'ll see you on stage as soon as I can but right now what\'s important is committing to this quarantine, for the sake of all of us." The dates were initially pushed to 2021 — tickets carried over automatically — before being scrapped outright the following February. The cancellation had one enormous creative consequence: the empty summer became folklore — and the eventual make-up show became the Eras Tour, where the Lover set finally opened every night.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Lover_Fest',
            source_title: 'Lover Fest',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-cancels-2020-tour-dates-986059/',
            source_title: 'Taylor Swift Cancels All 2020 Tour Dates Due to Coronavirus',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Gillette_Stadium_Foxboro.jpg/960px-Gillette_Stadium_Foxboro.jpg',
            credit: 'Art N. (CC BY 2.0), via Wikimedia Commons',
            caption: 'Reference image: Gillette Stadium in Foxborough, where Lover Fest East was booked for July 31 and August 1, 2020 — shows that never happened.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      slug: 'cats-beautiful-ghosts',
      year: 2019,
      month: 12,
      day: 20,
      category: 'release',
      title: 'Cats arrives: Bombalurina, digital fur, and "Beautiful Ghosts"',
      snippet:
        'Her movie-musical debut hit theaters Dec. 20, 2019 — a critically savaged film she emerged from mostly unscathed, plus "Beautiful Ghosts," the original ballad she wrote with Andrew Lloyd Webber that earned a Golden Globe nomination.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Beautiful_Ghosts',
      thumbnailUrl: null,
      moment: {
        context:
          'She played Bombalurina in Tom Hooper\'s adaptation and co-wrote "Beautiful Ghosts" as a response song to "Memory," sung in the film by Francesca Hayward. Critics roasted the movie and largely exempted her scene; the song\'s Globe nomination gave the Lover era its one awards-season campaign.\n\nThe wreckage around her roughly ten minutes of screen time was historic: a 19% Rotten Tomatoes score, a worldwide gross of $75.5 million against a budget of $80–100 million, and six Razzies including Worst Picture. The "digital fur technology" became its own news story — the first release went out with visual-effects glitches (including a shot where Judi Dench\'s human hand, wedding ring and all, was visible), and Universal took the near-unprecedented step of shipping a patched version with "improved visual effects" to theaters on December 22, two days into the run. Reviewers consistently noted Swift seemed to be one of the few people onscreen having fun.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Beautiful_Ghosts',
            source_title: 'Beautiful Ghosts',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Cats_(2019_film)',
            source_title: 'Cats (2019 film)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/c/cf/Cats_2019_poster.jpg',
            credit: 'Universal Pictures (theatrical release poster)',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'miss-americana-premiere',
      year: 2020,
      month: 1,
      day: 23,
      category: 'release',
      title: 'Miss Americana opens Sundance, then hits Netflix',
      snippet:
        'Lana Wilson\'s documentary premiered opening night at Sundance on Jan. 23, 2020 and landed on Netflix eight days later — the eating-disorder disclosure, the political-silence fight with her own team, and the sexual-assault trial, all on the record.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Miss_Americana',
      thumbnailUrl: null,
      moment: {
        context:
          'The film tracks the deliberate dismantling of the "good girl" reflex — built around the 2018 decision to break political silence over her team\'s objections — and gave fans the era\'s defining self-assessment: a star relearning what she actually wanted to say. It remains the most unguarded long-form footage of her career.\n\nThe title comes from "Miss Americana & the Heartbreak Prince," the Lover track about political disillusionment, and the disclosures went well beyond politics: her struggles with body dysmorphia and an eating disorder, her mother\'s cancer, the toxic online pile-ons, and the sexual assault trial all get direct treatment for the first time. Critics received it as a turning point — a 91% Rotten Tomatoes score, a National Board of Review selection as one of 2020\'s five best documentaries, and a consensus that the film marked "a pivotal moment" in how Swift told her own story.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Miss_Americana',
            source_title: 'Miss Americana',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added Deseret News' own
        // staff photo (Laura Seitz) of Swift arriving at the Eccles Theatre
        // for the premiere — the outlet covered opening night in Park City
        // with its own photographers; 5184px, arcpublishing CDN, no
        // watermark. Variety's only frame of the night is already used on the
        // joe-on-the-record page, so it was skipped as a cross-page
        // duplicate. Verified HTTP 200 + image/jpeg, downloaded, and
        // visually confirmed this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/a/ae/Taylor_Swift_-_Miss_Americana.jpg',
            credit: 'Netflix (official release poster)',
            kind: 'primary',
            focalPoint: '70% 64%',
          },
          {
            url: 'https://cloudfront-us-east-1.images.arcpublishing.com/deseretnews/BPFSE5GJJY32ML4VOUTHMY7J2I.jpg',
            credit: 'Laura Seitz / Deseret News',
            caption:
              'Arriving for the Sundance premiere of Miss Americana at the Eccles Theatre in Park City, Jan. 23, 2020.',
            kind: 'archival',
            focalPoint: '48% 31%',
          },
        ],
      },
    },
    {
      slug: 'miss-americana-joe-on-the-record',
      year: 2020,
      month: 1,
      day: 31,
      category: 'relationship',
      title: '"Someone with a really wonderfully normal, balanced, grounded life"',
      snippet:
        'Miss Americana put her relationship on the record for the first time — without ever saying Joe Alwyn\'s name: "I was falling in love with someone who had a really wonderfully normal, balanced, grounded life."',
      sourceUrl: 'https://www.etonline.com/taylor-swifts-miss-americana-everything-she-says-about-joe-alwyn-and-having-children-140665',
      thumbnailUrl: null,
      moment: {
        context:
          'She also explains the privacy itself as a joint decision: "We decided together that we wanted our relationship to be private."\n\nDirector Lana Wilson later said Alwyn was left almost entirely offscreen on purpose — the relationship "wasn\'t related to the themes in the film," and filming it "felt disrespectful and weird." Those few sentences stood for years as the couple\'s only direct on-record commentary.',
        sources: [
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/taylor-swifts-miss-americana-everything-she-says-about-joe-alwyn-and-having-children-140665',
            source_title: "Taylor Swift's 'Miss Americana': Everything She Says About Joe Alwyn and Having Children",
            publisher: 'Entertainment Tonight',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1410865/why-taylor-swifts-ex-joe-alwyn-was-barely-in-her-miss-americana-documentary',
            source_title: "Why Taylor Swift's Ex Joe Alwyn Was Barely in Her Miss Americana Documentary",
            publisher: 'E! News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): trailer still upgraded from
        // the 480×360 hqdefault to the same video's 1280×720 maxres render
        // (video id oEmbed-verified: "MISS AMERICANA | Official Trailer",
        // Netflix channel). Added the Sundance world-premiere carpet photo
        // from Variety's own CDN — the Jan. 23, 2020 Eccles Theatre premiere
        // of the film the quote appears in. Rolling Stone's press-kit still
        // was rejected as a near-duplicate (same mirror-dress elevator scene
        // as the trailer frame). Both verified HTTP 200 + image/jpeg,
        // downloaded, and visually confirmed this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/q07_k5VKuaQ/maxresdefault.jpg',
            credit: 'Netflix / YouTube (official trailer still)',
            caption: "Still from Netflix's official Miss Americana trailer — the film where the quote appears.",
            kind: 'archival',
            focalPoint: '69% 22%',
          },
          {
            url: 'https://variety.com/wp-content/uploads/2020/01/shutterstock_editorial_10537595c-e1579848059444.jpg',
            credit: 'Shutterstock, via Variety',
            caption:
              'At the Miss Americana world premiere, opening night of the Sundance Film Festival in Park City, Jan. 23, 2020 — a week before the film put the relationship on the record.',
            kind: 'archival',
            focalPoint: '48% 30%',
          },
        ],
      },
    },
    // --- Deep timeline fill (2026-07-08, content/deep-c): music backstories
    // for the remaining marquee tracks, the era's missing release-category
    // moments (singles, the holiday one-off, the concert special), the
    // one-off shows that stood in for a tour, and the two business wavetops
    // (the Big Machine sale + the on-air re-recording pledge) that frame the
    // whole era. Every claim verified against its cited source. New items
    // carry the audit's additive provenance fields; thumbnails deliberately
    // null per the 2026-07-08 media policy (no new hotlinks).
    {
      slug: 'the-archer-track-five',
      year: 2019,
      month: 7,
      day: 23,
      category: 'release',
      title: 'The Archer arrives as track five — and everyone knew what that meant',
      snippet:
        'Out July 23, 2019 as a promotional single, announced on an Instagram Live where she acknowledged the fan-spotted pattern herself: track five is where the most vulnerable song goes. This one asks "who could ever leave me, darling? But who could stay?"',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Archer_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'A synth-heartbeat ballad written and produced with Jack Antonoff — the writing took about two hours, by his account, though the LinnDrum-and-DX7 production never breaks into a radio chorus by design.\n\nShe announced it on an Instagram Live minutes before it dropped, explaining she wanted fans to hear a track five early because that slot holds the songs that are "the most honest, emotional, vulnerable, and personal." The title flips her Sagittarius archer into the era\'s sharpest self-inventory — "I\'ve been the archer, I\'ve been the prey" — and with no video or chart push, it worked as a deliberate "this album has feelings" flare sent up between the candy-colored singles. Stereogum and Slant both ranked it the sixth-best song of 2019.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/The_Archer_(Taylor_Swift_song)',
            source_title: 'The Archer (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/articles/news/8523616/taylor-swift-the-archer-listen',
            source_title: "Taylor Swift's 'The Archer': Listen",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/0/0f/Taylor_Swift_-_The_Archer.png',
            credit: 'Republic Records (single cover art)',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'lover-title-track-waltz',
      year: 2019,
      month: 8,
      day: 16,
      category: 'music',
      title: 'Lover, the waltz she wrote alone',
      snippet:
        'The title track, written solo and released a week ahead of the album as its third single — a hazy, slow-dance waltz produced with Jack Antonoff, and the quietest thesis statement she\'s ever put a whole era\'s name on.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Lover_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'She wrote it alone late one night at the piano, and the recording with Jack Antonoff at Electric Lady took about six hours; her pitch for the sound was "just the last two people on a dance floor at 3 a.m. swaying" — a song that could have played at "a wedding reception in 1980 or 1970 or now."\n\nThe bridge — "swear to be overdramatic and true to my lover" — is written like vows on purpose ("I love a bridge, and I was really able to go to Bridge City," she said on release day). It got its live debut in her 2019 VMAs medley, a Shawn Mendes duet remix followed that November with verses he wrote himself, and it earned her first Grammy nomination for Song of the Year as a solo writer.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Lover_(Taylor_Swift_song)',
            source_title: 'Lover (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-lover-new-song-new-album-listen-871277/',
            source_title: "Hear Taylor Swift's Tender New Song 'Lover'",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): music-video still upgraded
        // from the 480×360 hqdefault to the same video's 1280×720 maxres
        // render (video id oEmbed-verified: "Taylor Swift - Lover (Official
        // Music Video)", Taylor Swift channel). Added the official Lover
        // (Remix) feat. Shawn Mendes lyric-video artwork — the November 2019
        // duet the story mentions (also oEmbed-verified against her channel).
        // Both downloaded and visually confirmed this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/-BjZmE2gtdo/maxresdefault.jpg',
            credit: 'Republic Records / YouTube (official music video still)',
            caption: "Still from the official 'Lover' music video, co-directed by Swift and Drew Kirsch.",
            kind: 'archival',
            focalPoint: '49% 36%',
          },
          {
            url: 'https://i.ytimg.com/vi/b5Zay_Hd_7Q/maxresdefault.jpg',
            credit: 'Republic Records / YouTube (official lyric video still)',
            caption:
              "Artwork from the official 'Lover (Remix)' lyric video — the November 2019 duet with verses Shawn Mendes wrote himself.",
            kind: 'archival',
            focalPoint: '50% 45%',
          },
        ],
      },
    },
    {
      slug: 'london-boy-idris-elba',
      year: 2019,
      month: 8,
      day: 23,
      category: 'music',
      title: "London Boy opens with Idris Elba's voice, borrowed from James Corden's couch",
      snippet:
        'The album\'s giddy tour of Camden, Shoreditch, Brixton and Highgate starts with a sampled Idris Elba clip from The Late Late Show — the most gleefully touristy three minutes on Lover.',
      sourceUrl: 'https://en.wikipedia.org/wiki/London_Boy_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          'British listeners immediately pointed out the geography reads like a tourist doing every borough in one afternoon — which became half the song\'s charm and a running joke online. The London romance at its center went unnamed, but nobody needed a map for that part.\n\nThe Idris Elba spoken clip that opens the track — a stray remark about riding his scooter around London — was lifted from his 2017 appearance on The Late Late Show with James Corden. Swift wrote and produced the song with Jack Antonoff and Sounwave, with Cautious Clay receiving a writing credit for the interpolation of his 2018 song "Cold War," and the album cut still reached No. 62 on the Hot 100 without ever being a single — carried there almost entirely by the joke, the sample, and the subtext.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/London_Boy_(song)',
            source_title: 'London Boy (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): audio-still upgraded from
        // hqdefault to the same upload's 1280×720 maxres render (oEmbed-
        // verified, Taylor Swift channel). Added a license-verified Commons
        // portrait of Idris Elba (Harald Krichel, Berlinale 2018, CC BY-SA
        // 4.0 per extmetadata) — his sampled voice opens the track, same
        // referenced-person pattern as Justin Vernon on the "peace" page.
        // Both downloaded and visually confirmed this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/VsKoOH6DVys/maxresdefault.jpg',
            credit: 'Republic Records / YouTube (official audio still)',
            caption: "Artwork from the official 'London Boy' audio upload on Taylor Swift's YouTube channel.",
            kind: 'archival',
            focalPoint: '46% 59%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Idris_Elba-4688.jpg/1280px-Idris_Elba-4688.jpg',
            credit: 'Harald Krichel (CC BY-SA 4.0), via Wikimedia Commons',
            caption:
              'Reference image: Idris Elba, whose sampled Late Late Show remark opens the track — at the 2018 Berlinale, not from the recording.',
            kind: 'reference',
            focalPoint: '48% 37%',
          },
        ],
      },
    },
    {
      slug: 'daylight-almost-the-title',
      year: 2019,
      month: 8,
      day: 23,
      category: 'music',
      title: 'Daylight, the closer that almost named the album',
      snippet:
        'She originally intended to call the whole record Daylight before deciding it was too on-the-nose. The closer still ends the era\'s thesis out loud: "I want to be defined by the things that I love."',
      sourceUrl: 'https://en.wikipedia.org/wiki/Daylight_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'She ultimately went with Lover because it "better represents the overall theme" and was more elastic as a concept — Daylight read as too obvious a daybreak sequel to reputation\'s nighttime world.\n\nThe closer still does the title track\'s job: the spoken outro reframes the album as a decision rather than a mood — "not the things I hate… not the things that haunt me in the middle of the night" — and "I once believed love would be burning red, but it\'s golden" retires her own Red-era metaphor in a single line. Written and produced with Jack Antonoff, it split critics between "the album\'s best track" and too-familiar production, though the later Paris live version won particular acclaim.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Daylight_(Taylor_Swift_song)',
            source_title: 'Daylight (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Lover_(album)',
            source_title: 'Lover (album)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): audio-still upgraded from
        // hqdefault to maxres (oEmbed-verified, Taylor Swift channel). Added
        // the official 'Daylight (Live From Paris)' single art — the L'Olympia
        // live version the page's own text singles out for acclaim (video id
        // JSD4XCBWzvs oEmbed-verified against her channel). Both downloaded
        // and visually confirmed this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/u9raS7-NisU/maxresdefault.jpg',
            credit: 'Republic Records / YouTube (official audio still)',
            caption: "Artwork from the official 'Daylight' audio upload on Taylor Swift's YouTube channel.",
            kind: 'archival',
            focalPoint: '46% 60%',
          },
          {
            url: 'https://i.ytimg.com/vi/JSD4XCBWzvs/maxresdefault.jpg',
            credit: 'Republic Records / YouTube (official single art)',
            caption:
              "Cover of 'Daylight (Live From Paris)' — the acclaimed live version from the one-night City of Lover show at L'Olympia.",
            kind: 'archival',
            focalPoint: '48% 35%',
          },
        ],
      },
    },
    {
      slug: 'cornelia-street-live-debut',
      year: 2019,
      month: 9,
      day: 9,
      category: 'music',
      title: 'Cornelia Street, written alone — and debuted acoustic in Paris',
      snippet:
        'A solo write that maps a relationship onto the West Village block where she once rented a townhouse — "I\'d never walk Cornelia Street again" as the breakup\'s worst-case scenario. Its first live performance came Sept. 9, 2019, on acoustic guitar at the one-night City of Lover show.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Cornelia_Street_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          'She rented a townhouse on the West Village block in 2016 while her Tribeca apartment was renovated, and the song bonds a relationship\'s earliest memories to that block — as she explained on Elvis Duran\'s show, "sometimes we bond our memories to the places that they happen... I wrote it alone and it ended up being one of my favorite songs."\n\nIntroducing it in Paris, she added the detail fans still quote: "I wrote it in the bathtub, just for context." The chorus stake is the superstition itself — lose the person, lose the street forever — which is exactly why fans made the real Cornelia Street a pilgrimage stop anyway.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Cornelia_Street_(song)',
            source_title: 'Cornelia Street (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Songfacts',
            url: 'https://www.songfacts.com/facts/taylor-swift/cornelia-street',
            source_title: 'Cornelia Street by Taylor Swift — Songfacts',
            publisher: 'Songfacts',
            source_type: 'fan_forum',
            accessed_at: '2026-07-09',
            reliability_score: 3,
          },
        ],
        photos: [
          {
            url: 'https://i.ytimg.com/vi/VikHHWrgb4Y/hqdefault.jpg',
            credit: 'Republic Records / YouTube (official audio still)',
            caption: "Artwork from the official 'Cornelia Street' audio upload on Taylor Swift's YouTube channel.",
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'false-god-snl',
      year: 2019,
      month: 10,
      day: 5,
      category: 'music',
      title: 'False God on SNL: the deep cut nobody saw coming',
      snippet:
        'For her Oct. 5, 2019 Saturday Night Live slot she skipped the singles and gave "False God" — a smoky, saxophone-led album track — its live debut, alongside an acoustic "Lover."',
      sourceUrl: 'https://en.wikipedia.org/wiki/False_God_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          'The staging was bare lightbulbs against pitch-black walls with smoke pooling at her feet, SNL musical director Lenny Pickett on saxophone — Slate\'s recap called it "the smoothest saxophone sound an SNL musical guest has had in years" — and Teen Vogue read her oversized black blazer and sequined pants as a last flicker of the reputation aesthetic.\n\nChoosing an untouched deep cut over "The Man" or "Cruel Summer" read as a statement about the album\'s bench depth, and made a track that was never a single one of the era\'s defining TV moments.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/False_God_(song)',
            source_title: 'False God (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1080192/taylor-swift-gives-romantic-performance-on-snl-before-bringing-joe-alwyn-to-after-party',
            source_title: 'Taylor Swift Gives Romantic Performance on SNL Before Bringing Joe Alwyn to After-Party',
            publisher: 'E! News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): audio-still upgraded from
        // hqdefault to maxres (oEmbed-verified, Taylor Swift channel). Added
        // the thumbnail of her channel's official upload of this exact SNL
        // performance — the show's bumper portrait with the SNL letters
        // (video id kjD3LoXp-Pw oEmbed-verified: '"False God" (Live on
        // Saturday Night Live / 2019)', Taylor Swift channel; a fan re-upload
        // of the same performance was rejected). Both downloaded and visually
        // confirmed this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/acQXa5ArHIk/maxresdefault.jpg',
            credit: 'Republic Records / YouTube (official audio still)',
            caption: "Artwork from the official 'False God' audio upload on Taylor Swift's YouTube channel.",
            kind: 'archival',
            focalPoint: '46% 60%',
          },
          {
            url: 'https://i.ytimg.com/vi/kjD3LoXp-Pw/maxresdefault.jpg',
            credit: 'Republic Records / YouTube (official SNL performance upload)',
            caption:
              "Thumbnail of the official upload of the 'False God' SNL debut — the night's SNL bumper portrait.",
            kind: 'archival',
            focalPoint: '63% 26%',
          },
        ],
      },
    },
    {
      slug: 'lover-first-owned-album',
      significance: 'defining', // the actual arrival of the album that owns her whole catalog's turning point, the first she's owned outright (docs/decisions.md, 2026-07-19)
      relatedIds: ['moment:vault-lover-my-worst-case-scenario-scooter-braun-buys-big-machine-and-he'],
      year: 2019,
      month: 8,
      day: 23,
      category: 'release',
      title: "Lover: the first album she's ever owned",
      snippet:
        '18 tracks, out Aug. 23, 2019 — and, under her 2018 Republic Records deal, the first album in her catalog whose masters belong to Taylor Swift herself. Two months after the Big Machine sale, the timing said everything.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Lover_(album)',
      thumbnailUrl: null,
      moment: {
        context:
          'Her November 2018 deal with Republic and Universal — signed just after the reputation Stadium Tour ended — guaranteed ownership of everything she recorded going forward, and she said it plainly on GMA the day before release: Lover is "the first one that I will own."\n\nRecorded between November 2018 and February 2019, it was also her first album on streaming services from its first week, and it carried three Grammy nominations, including her first solo-written Song of the Year nod for the title track. That made the release more than an era launch: it was the pivot the entire masters fight would be argued around — old catalog owned by someone else, everything new owned by her.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Lover_(album)',
            source_title: 'Lover (album)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2019/music/news/taylor-swifts-masters-scooter-brauns-bullying-inside-the-big-machine-ithaca-holdings-deal-1203256640/',
            source_title: "Taylor Swift Vs. Scooter Braun: Inside the Big Machine-Ithaca Deal",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Good Morning America',
            url: 'https://www.goodmorningamerica.com/culture/story/taylor-swift-record-music-year-important-artists-work-65115745',
            source_title: "Taylor Swift performs live on 'GMA,' reveals she'll re-record her old albums",
            publisher: 'ABC News / Good Morning America',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added GMA's own frame of
        // the Central Park SummerStage show from the very story this page
        // cites (s.abcnews.com CDN, 1620px, no watermark) — the day-before-
        // release performance where she said Lover is "the first one that I
        // will own." Verified HTTP 200 + image/jpeg, downloaded, and
        // visually confirmed this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/c/cd/Taylor_Swift_-_Lover.png',
            credit: 'Republic Records / Valheria Rocha (album cover art)',
            kind: 'primary',
            focalPoint: '50% 53%',
          },
          {
            url: 'https://s.abcnews.com/images/GMA/taylor-swift6-abc-ml-190822_hpMain.jpg',
            credit: 'ABC News / Good Morning America',
            caption:
              "On GMA's Central Park SummerStage, Aug. 22, 2019 — the day before Lover became the first album she owned.",
            kind: 'archival',
            focalPoint: '51% 40%',
          },
        ],
      },
    },
    {
      slug: 'beautiful-ghosts-single',
      year: 2019,
      month: 11,
      day: 15,
      category: 'release',
      title: 'Beautiful Ghosts: a single co-written with Andrew Lloyd Webber',
      snippet:
        'Out Nov. 15, 2019 ahead of Cats — an answer song to "Memory," written with Lloyd Webber, sung in the film by Francesca Hayward and by Taylor over the end credits.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Beautiful_Ghosts',
      thumbnailUrl: null,
      moment: {
        context:
          'The in-film version belongs to newcomer Francesca Hayward; the credits version is hers. Its Golden Globe nomination for Best Original Song became the Lover era\'s one awards-season campaign — the Globes-night Etro gown is covered in this era\'s fashion items.\n\nThe writing story is the good part: during December 2018 rehearsals at Lloyd Webber\'s London studio, he played the melody at the piano and she started improvising lyrics on the spot — by his account they "wrote 90 percent of it pretty much over an afternoon." It later added a Grammy nomination for Best Song Written for Visual Media, her third in the category, and in 2021 Lloyd Webber said the collaboration was his one enjoyable part of working on the Cats film — a movie whose wreckage otherwise spared almost no one.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Beautiful_Ghosts',
            source_title: 'Beautiful Ghosts',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/82/Taylor_Swift_-_Beautiful_Ghosts.png',
            credit: 'Republic Records (single cover art)',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'christmas-tree-farm-single',
      year: 2019,
      month: 12,
      day: 6,
      category: 'release',
      title: 'Christmas Tree Farm, from the girl who literally grew up on one',
      snippet:
        'A holiday single out Dec. 6, 2019, written just days earlier — with a video cut from real Swift-family home movies shot on the Pennsylvania tree farm where she spent her childhood.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Christmas_Tree_Farm_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          'The timeline was almost absurd: written December 1, vocals recorded December 2, a choir session December 3, out December 6 — her first original Christmas music since the 2007 holiday EP.\n\nThe self-directed video is cut entirely from real Swift-family home movies shot at Pine Ridge Farm: sledding, Santa visits, and a young Taylor unwrapping her first guitar on Christmas morning. It reached No. 59 on the Hot 100 and No. 3 on Adult Contemporary — her actual origin story, turned into era canon in under a week.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Christmas_Tree_Farm_(song)',
            source_title: 'Christmas Tree Farm (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/articles/columns/pop/8545576/taylor-swift-christmas-tree-farm-video-watch',
            source_title: "Taylor Swift Shares Family Footage in 'Christmas Tree Farm' Video: Watch",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/e/e6/Taylor_Swift_-_Christmas_Tree_Farm.png',
            credit: 'Republic Records (single cover art)',
            kind: 'primary',
          },
          {
            url: 'https://i.ytimg.com/vi/mN3rDTAdM2o/hqdefault.jpg',
            credit: 'Republic Records / YouTube (official music video still)',
            caption: "Swift-family home-movie footage — still from the official 'Christmas Tree Farm' video on Taylor Swift's YouTube channel.",
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'only-the-young-documentary-song',
      year: 2020,
      month: 1,
      day: 31,
      category: 'release',
      title: 'Only the Young: the protest song saved for the documentary',
      snippet:
        'Written with Joel Little in the aftermath of the 2018 midterms and held off Lover, it finally arrived Jan. 31, 2020 — over Miss Americana\'s closing minutes.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Only_the_Young_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'The film shows exactly why it exists: the disillusionment of watching the 2018 Tennessee race go the wrong way despite her first-ever political endorsement. She told Variety she was "really upset about Tennessee going the way that it did" and that "I saw a lot of young people\'s hopes dashed... young people are the people who feel the worst effects of gun violence."\n\nThe lyrics take on school shootings and voting directly — her most explicitly political writing to date — and releasing it over the documentary\'s closing minutes, not as a single, let it stay a statement. In October 2020 she granted it, free of charge, to a Biden–Harris campaign ad: the first time she had ever cleared her music for political advertising.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Only_the_Young_(Taylor_Swift_song)',
            source_title: 'Only the Young (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2020/music/news/taylor-swift-political-song-documentary-miss-americana-1203473948/',
            source_title: "Taylor Swift on Her Politically Inspired New Song, 'Only the Young'",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/6/69/Taylor_Swift_-_Only_the_Young.png',
            credit: 'Republic Records (single cover art)',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'city-of-lover-special-airs',
      year: 2020,
      month: 5,
      day: 17,
      category: 'release',
      title: 'City of Lover finally airs — a concert special for a tour that never happened',
      snippet:
        'The one-night Paris show reached everyone else on May 17, 2020, as an ABC special, moving to Hulu and Disney+ the next day — part concert film, part accidental time capsule.',
      sourceUrl: 'https://en.wikipedia.org/wiki/City_of_Lover',
      thumbnailUrl: null,
      moment: {
        context:
          'ABC slotted it after the American Idol finale, trimming the 16-song Paris set to just the eight Lover tracks in a 42-minute broadcast that drew 3.63 million viewers; it hit Hulu and Disney+ the next day, and critics\' main complaint was wanting the whole show.\n\nBy the time it aired, the pandemic had erased Lover Fest and every other live plan for the era — so watching these songs meet a live audience for the first and only time, mid-lockdown, gave the broadcast an elegy quality nobody intended when it was filmed the previous September.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/City_of_Lover',
            source_title: 'City of Lover',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-city-lover-concert-special-set-abc-broadcast-1293895/',
            source_title: "Taylor Swift 'City of Lover Concert' Special Set for ABC Broadcast",
            publisher: 'The Hollywood Reporter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/a/ae/City_of_Lover_%28ABC_Special%29_by_Taylor_Swift.png',
            credit: 'ABC / Republic Records (broadcast promotional art)',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'we-can-survive-hollywood-bowl',
      year: 2019,
      month: 10,
      day: 19,
      category: 'tour',
      title: 'Headlining We Can Survive at the Hollywood Bowl',
      snippet:
        'Oct. 19, 2019: closing a radio-benefit bill of Billie Eilish, Lizzo, Camila Cabello and the Jonas Brothers with a hits-and-Lover set — one of the few times the Lover era made it to a live stage at all.',
      sourceUrl: 'https://www.billboard.com/articles/news/8533602/taylor-swift-lizzo-camila-cabello-we-can-survive',
      thumbnailUrl: null,
      moment: {
        context:
          'The annual 97.1 AMP Radio benefit was part of the era\'s strange, tour-less rhythm: award shows, radio nights, and one Paris theater instead of stadiums — which made every one-off like this feel outsized.\n\nHer five-song set — "Blank Space," "ME!," an emotional "Lover," "You Need to Calm Down," and "Shake It Off" — was sung into a pink microphone for Breast Cancer Awareness Month, at a benefit supporting the American Cancer Society. Rolling Stone\'s recap put the night\'s haul at more than $135,000 from tickets and Twitter activations, with a backstage celebrity bowling stunt adding to the total, and the bill around her ran deep: Billie Eilish, Lizzo, Camila Cabello, the Jonas Brothers, Marshmello, Becky G, and a surprise Halsey set.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/articles/news/8533602/taylor-swift-lizzo-camila-cabello-we-can-survive',
            source_title: 'Taylor Swift, Billie Eilish & More Supported a Great Cause at 7th Annual We Can Survive Concert',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/List_of_Taylor_Swift_live_performances',
            source_title: 'List of Taylor Swift live performances',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-billie-eilish-lizzo-hollywood-bowl-cancer-benefit-we-can-survive-901385/',
            source_title: "See Taylor Swift, Billie Eilish, Lizzo Perform at Hollywood Bowl Cancer Benefit",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2019/10/GettyImages-1182186382.jpg?w=1024',
            credit: 'Getty Images, via Rolling Stone',
            caption: 'Onstage at the Hollywood Bowl for We Can Survive, October 19, 2019, backed by Lover-era night-sky visuals.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'singles-day-gala-shanghai',
      year: 2019,
      month: 11,
      day: 10,
      category: 'tour',
      title: "A three-song countdown gala in Shanghai for Singles' Day",
      snippet:
        'Nov. 10, 2019 at the Mercedes-Benz Arena: "ME!," a piano "Lover," and "You Need to Calm Down" to open Alibaba\'s 11.11 shopping-festival countdown — her only mainland China performance of the era.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-performance-shanghai-china-2019-alibaba-singles-day-8543200/',
      thumbnailUrl: null,
      moment: {
        context:
          'The gala precedes the world\'s biggest online shopping day — the prior year\'s event had pulled in $30 billion in sales in 24 hours across Alibaba\'s platforms — and booking her as headliner, announced in late October, was the event\'s statement of global scale. The set was broadcast live across China: an energetic "ME!" to open, "Lover" accompanied at the piano, and "You Need to Calm Down" with dancers to close.\n\nThe lineup around her was a snapshot of the gala\'s reach — Chinese singer G.E.M., Hua Chenyu, and Japanese singer Kana Hanazawa also performed. Afterward she posted an Instagram photo lounging on a too-small couch in her stage outfit, captioned "If it don\'t fits, I still sits" — the cat-logic joke doing the diplomatic work of a whole press tour.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-performance-shanghai-china-2019-alibaba-singles-day-8543200/',
            source_title: "Taylor Swift Performs 'Lover,' 'You Need to Calm Down' & 'ME!' in Shanghai, China",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/carlieporterfield/2019/11/11/alibaba-hits-30-billion-in-singles-day-sales-and-brings-taylor-swift-to-shanghai/',
            source_title: "Alibaba Hits $30 Billion In Singles' Day Sales — And Brings Taylor Swift To Shanghai",
            publisher: 'Forbes',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-shanghai-2019-billboard-1548.jpg?w=1024',
            credit: 'Billboard',
            caption: "Onstage at Alibaba's 11.11 Countdown Gala at the Mercedes-Benz Arena in Shanghai, November 10, 2019.",
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'z100-jingle-ball-30th-birthday',
      year: 2019,
      month: 12,
      day: 13,
      category: 'tour',
      title: 'Spending her 30th birthday on the Jingle Ball stage',
      snippet:
        'Dec. 13, 2019 at Madison Square Garden: "I had a choice: where would I want to spend my 30th birthday?… you\'re looking at it." A crowd "Happy Birthday" singalong, a live "Christmas Tree Farm" — and, though nobody knew it, her last full show before the pandemic.',
      sourceUrl: 'https://www.billboard.com/music/concerts/jingle-ball-new-york-recap-highlights-taylor-swift-8546344/',
      thumbnailUrl: null,
      moment: {
        context:
          'She opened iHeartRadio\'s Z100 Jingle Ball rather than closing it, with a seven-song set that ran through "Blank Space," "ME!," and "Shake It Off" — after which Z100\'s Elvis Duran wheeled out a giant birthday cake decorated with images of her cats, and the Madison Square Garden crowd of 20,000 sang "Happy Birthday." Her review: "That was the most beautiful song I\'ve ever heard." A 90-second video of birthday wishes from celebrities including Katy Perry and BTS then played to the arena.\n\nShe left to the Oscar Wilde birthday dinner covered in this era\'s sightings, off a bill that also held Lizzo, Camila Cabello, the Jonas Brothers, Halsey, and Lewis Capaldi. Live music shut down three months later; the Lover era never got another night like it.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/concerts/jingle-ball-new-york-recap-highlights-taylor-swift-8546344/',
            source_title: 'Jingle Ball New York 2019 Recap: Taylor Swift & More Highlights',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/List_of_Taylor_Swift_live_performances',
            source_title: 'List of Taylor Swift live performances',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-jingle-ball-dec-13-2019-billboard-1548.jpg?w=1024',
            credit: 'Billboard',
            caption: 'The cat-decorated birthday cake onstage at Z100\'s Jingle Ball at Madison Square Garden — her 30th birthday, December 13, 2019.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'big-machine-sale-worst-case-scenario',
      significance: 'defining', // reshaped the whole industry's masters conversation, launched Taylor's Version (docs/decisions.md, 2026-07-19)
      threadIds: ['taylors-version'],
      relatedIds: [
        'moment:vault-evermore-fearless-taylors-version-is-the-first-re-recorded-album-ever',
        'moment:vault-red-red-gets-its-do-over-red-taylors-version-opens-at-no-1',
        'moment:vault-midnights-1989-taylors-version-announced-at-the-final-us-show-on-the-d',
        'moment:vault-reputation-she-leaves-big-machine-for-republic-and-owns-her-masters-goi',
      ],
      year: 2019,
      month: 6,
      day: 30,
      category: 'business',
      title: '"My worst case scenario": Scooter Braun buys Big Machine — and her first six albums',
      snippet:
        'June 30, 2019: Ithaca Holdings acquired Big Machine for over $300 million, her masters included. Her Tumblr response the same day called it her "worst case scenario" — the opening shot of the defining business war of her career.',
      sourceUrl: 'https://variety.com/2019/music/news/taylor-swifts-masters-scooter-brauns-bullying-inside-the-big-machine-ithaca-holdings-deal-1203256640/',
      thumbnailUrl: null,
      moment: {
        context:
          'Her Tumblr post laid out the history in one line — "For years I asked, pleaded for a chance to own my work" — and said the alternative she\'d been offered was to "sign back up to Big Machine Records and \'earn\' one album back at a time, one for every new one I turned in."\n\nShe wrote that she\'d learned of the deal "as it was announced to the world"; Scott Borchetta answered with a blog post titled "So, It\'s Time For Some Truth," claiming he had texted her the night before, which she disputed. #IStandWithTaylor trended worldwide within hours. Everything that follows in this era traces back to this sale: the AMA standoff, Miss Americana\'s framing, the on-air re-recording pledge — and eventually the entire Taylor\'s Version project.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2019/music/news/taylor-swifts-masters-scooter-brauns-bullying-inside-the-big-machine-ithaca-holdings-deal-1203256640/',
            source_title: "Taylor Swift Vs. Scooter Braun: Inside the Big Machine-Ithaca Deal",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/lists/taylor-swift-scooter-braun-feud-timeline/',
            source_title: "Taylor Swift and Scooter Braun's Feud: A Timeline",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Taylor_Swift_masters_dispute',
            source_title: 'Taylor Swift masters dispute',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): added Billboard's own art
        // for its feud-timeline story (the second source this page cites) —
        // a clean side-by-side of the two parties on billboard.com's CDN,
        // captioned honestly as later photos, since no press photo of the
        // 2019 sale itself exists. No usable Commons photo of Scott
        // Borchetta was found (only a signature graphic). Verified HTTP 200
        // + image/jpeg, downloaded, and visually confirmed this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Scooter_Braun.jpg',
            credit: 'TechCrunch (CC BY 2.0), via Wikimedia Commons',
            caption: 'Reference image: Scooter Braun, whose Ithaca Holdings acquired Big Machine — an earlier conference photo, not from the 2019 deal.',
            kind: 'reference',
            focalPoint: '49% 28%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2024/10/scooter-braun-taylor-swift-2024-billboard-1548.jpg',
            credit: 'Billboard',
            caption:
              "The two sides of the fight, in Billboard's art for its feud timeline — later photos of Braun and Swift, not from the 2019 sale.",
            kind: 'reference',
            focalPoint: '50% 30%',
          },
          // Photo pass 2026-07-19 (10-defining-events, docs/decisions.md):
          // real, verified photos from the surrounding news cycle — no photo
          // op exists for the sale itself, so this is the era's actual
          // documented fallout, same convention as the reference photo above.
          {
            url: 'https://i.guim.co.uk/img/media/952d2b76234c00dea74332a4b49e9ee26bb26884/0_31_3000_1800/master/3000.jpg?crop=none&dpr=1&s=none&width=465',
            credit: 'Richard Shotwell/Invision/AP, via The Guardian',
            caption: 'A contemporaneous reference image shows Swift arriving at the Billboard Music Awards on May 1, 2019, two months before the Big Machine sale.',
            kind: 'reference',
          },
          // Two ca-times.brightspotcdn.com (LA Times) candidates were dropped
          // here 2026-07-19: curl returned 200 + real image bytes, but the
          // CDN serves a 1x1 placeholder to actual browser requests
          // (Referer-based hotlink protection) — caught only by testing in
          // a real browser (naturalWidth === 1), not by curl. See
          // docs/decisions.md for the full note; every other domain in this
          // pass tested clean.
          {
            url: 'https://media.vanityfair.com/photos/5ddb4a90d223c300093e7f42/master/w_2560%2Cc_limit/taylor-swift-ama-perfomance.jpg',
            credit: 'JC Olivera/Getty Images, via Vanity Fair',
            caption: 'Swift accepts Artist of the Decade at the 2019 American Music Awards amid the public dispute over performing her Big Machine-era songs.',
            kind: 'archival',
          },
          {
            url: 'https://i.guim.co.uk/img/media/62052f41de01072ab003d60e57853e969dd49106/0_363_3994_2397/master/3994.jpg?crop=none&dpr=1&s=none&width=465',
            credit: 'Kevin Mazur/Getty Images for ABA, via The Guardian',
            caption: 'Swift performs on Good Morning America on Aug. 22, 2019, the day she publicly confirmed that she planned to rerecord her catalog.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'gma-rerecording-pledge',
      year: 2019,
      month: 8,
      day: 22,
      category: 'business',
      title: 'The re-recording plan, confirmed on live TV the day before Lover dropped',
      snippet:
        'Asked on Good Morning America whether she really planned to re-record her Big Machine catalog: "Yeah, that\'s true, and it\'s something I\'m very excited about." Broadcast Aug. 22, 2019 — Lover arrived the next day.',
      sourceUrl: 'https://www.goodmorningamerica.com/culture/story/taylor-swift-record-music-year-important-artists-work-65115745',
      thumbnailUrl: null,
      moment: {
        context:
          'She told Robin Roberts exactly how the plan worked: "My contract says that starting November 2020, so next year, I can record albums 1 through 5 all over again," adding, "I think it\'s important for artists to own their work."\n\nThe interview ran alongside a Central Park SummerStage concert for fans who had camped out overnight — "You Need to Calm Down," "ME!," and "Shake It Off," plus the reveal that Lover would be "the first one that I will own." Fifteen months later she was in the studio doing exactly that — the AMA-night reveal covered in the folklore era.',
        sources: [
          {
            outlet: 'Good Morning America',
            url: 'https://www.goodmorningamerica.com/culture/story/taylor-swift-record-music-year-important-artists-work-65115745',
            source_title: "Taylor Swift performs live on 'GMA,' reveals she'll re-record her old albums",
            publisher: 'ABC News / Good Morning America',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2019/music/news/taylor-swift-performs-on-gma-talks-re-recording-big-machine-songs-watch-1203310319/',
            source_title: "Taylor Swift Performs on 'GMA,' Talks Re-Recording Big Machine Songs",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // Photo-enrichment pass (2026-07-18, #762): segment still upgraded
        // from hqdefault to maxres (video id oEmbed-verified: "Taylor Swift
        // says she'll re-record her old albums | Live on GMA", Good Morning
        // America channel). Added GMA's own wide frame of the Central Park
        // SummerStage concert that ran alongside the interview, from the
        // story this page cites (s.abcnews.com CDN — a different frame than
        // the one added to the lover-first-owned-album page). Both
        // downloaded and visually confirmed this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/ellK-CXh7B4/maxresdefault.jpg',
            credit: 'Good Morning America / YouTube (official segment still)',
            caption: "Still from GMA's official YouTube upload of the segment where she confirmed the re-recording plan.",
            kind: 'archival',
            focalPoint: '42% 40%',
          },
          {
            url: 'https://s.abcnews.com/images/GMA/taylor-swift5abc-ml-190822_hpMain_16x9_992.jpg',
            credit: 'ABC News / Good Morning America',
            caption:
              'The Central Park SummerStage show that ran alongside the interview, Aug. 22, 2019 — fans had camped out overnight.',
            kind: 'archival',
            focalPoint: '49% 28%',
          },
        ],
      },
    },

    // ── Migrated from content.ts RAW (consolidation stage 2a, 2026-07-19) ──
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "lover-album",
      year: 2019,
      month: 8,
      day: 23,
      category: "music",
      title: "Color returns with Lover",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-lov-2", label: "Lover released", kind: "album" },
      snippet: "A pastel love letter — and the first album she would fully own.",
      moment: {
        context: "After the armor, Lover flooded everything with pastel light: romance loud again, hearts and glitter everywhere.",
        // Photo pass (2026-07-19): official "Lover" music video (released
        // the day before the album) on the Taylor Swift YouTube channel —
        // id verified via YouTube oEmbed (title + author "Taylor Swift");
        // thumbnail HTTP 200 + image/jpeg, downloaded and viewed. The
        // couple stands centered, faces in the upper third.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/-BjZmE2gtdo/maxresdefault.jpg',
            credit: 'Taylor Swift via YouTube (official music video)',
            caption: 'Inside the snow globe of the "Lover" music video, released on the eve of the album — the era\'s warm-lit romance in one shot.',
            kind: 'archival',
            focalPoint: '50% 35%',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "lover-masters",
      year: 2019,
      month: 6,
      day: 30,
      category: "sighting",
      title: "The masters are sold",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-lov-1", label: "Masters sold", kind: "business" },
      snippet: "Her back catalog changes hands without her — igniting a fight to reclaim her work.",
      hiddenClue: { clue: "She announced she would re-record her old albums.", payoff: "The “Taylor’s Version” project was born — reclaiming her catalog one album at a time." },
      moment: {
        context: "News that her master recordings were sold set off the defining business battle of her career and the plan to re-record everything.",
      },
    },
  ],
};
