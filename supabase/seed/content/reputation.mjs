// Vault content — reputation era.
//
// First batch: November 2017, the album-release wavetop month. Every claim
// verified against its cited source directly. See
// docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first) authoring model this follows.
//
// Note on the "Look What You Made Me Do" item: it touches the 2016
// Kanye West/Kim Kardashian phone-call controversy. Debated explicitly
// against the framework's hard exclusion on relationship/private-life
// theories — judged in-scope because it's a public feud Taylor herself
// confirmed on record (2019 Rolling Stone interview), not fan/media
// speculation about a private relationship. Sourced to 2 independent
// outlets (stricter than the usual 1-source bar for `music`) given the
// public-figure adjacency.

export default {
  eraSlug: 'reputation',
  items: [
    {
      year: 2017,
      month: 11,
      category: 'business',
      title: 'reputation sells more than the rest of the chart combined',
      snippet:
        '1.238 million units in week one — the only artist in Nielsen history with four different million-selling album weeks.',
      sourceUrl: 'https://www.billboard.com/pro/taylor-swift-reputation-debuts-no-1-billboard-200-albums/',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Taylor_Swift_-_Reputation.png/250px-Taylor_Swift_-_Reputation.png',
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-reputation-debuts-no-1-billboard-200-albums/',
          },
          {
            outlet: 'Refinery29',
            url: 'https://www.refinery29.com/en-us/2017/11/182106/taylor-swift-reputation-billboard-chart',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Taylor_Swift_-_Reputation.png/250px-Taylor_Swift_-_Reputation.png',
            credit: 'Big Machine Records',
          },
        ],
      },
    },
    {
      year: 2017,
      month: 11,
      category: 'music',
      title: 'Look What You Made Me Do, and the phone call it started with',
      snippet: 'By her own account, it began as a poem about deciding who she could trust.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Look_What_You_Made_Me_Do',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/thumb/6/68/Taylor_Swift_-_Look_What_You_Made_Me_Do.png/250px-Taylor_Swift_-_Look_What_You_Made_Me_Do.png',
      moment: {
        context:
          "She later said the bridge's phone-call line played on \"a stupid phone call I shouldn't have picked up\" — the Kanye West call at the center of their 2016 feud.",
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Look_What_You_Made_Me_Do' },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-features/taylor-swift-rolling-stone-interview-880794/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/68/Taylor_Swift_-_Look_What_You_Made_Me_Do.png/250px-Taylor_Swift_-_Look_What_You_Made_Me_Do.png',
            credit: 'Big Machine Records',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 5,
      category: 'tour',
      title: 'reputation Stadium Tour opens to a record crowd',
      snippet:
        "59,157 fans at University of Phoenix Stadium — breaking the venue's attendance record, set by One Direction in 2014, by 2,633 seats.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Reputation_Stadium_Tour',
      thumbnailUrl:
        "https://upload.wikimedia.org/wikipedia/en/thumb/b/b3/Taylor_Swift%27s_Reputation_Stadium_tour.png/250px-Taylor_Swift%27s_Reputation_Stadium_tour.png",
      moment: {
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Reputation_Stadium_Tour' }],
        photos: [
          {
            url: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b3/Taylor_Swift%27s_Reputation_Stadium_tour.png/250px-Taylor_Swift%27s_Reputation_Stadium_tour.png",
            credit: 'Big Machine Records',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 5,
      category: 'tour',
      title: 'Snakes everywhere, on purpose',
      snippet:
        "Taylor's own explanation, on stage: she was called a snake on social media, and rather than let it define her, she made it the tour's whole visual language — in her words, something that 'can strengthen you instead.'",
      sourceUrl:
        'https://www.iheart.com/content/2018-05-08-taylor-swift-kicks-off-reputation-tour-with-big-setlist-fireworks-snakes/',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Taylor_Swift_-_Reputation_Tour_Seattle_-_Getaway_Car.jpg/250px-Taylor_Swift_-_Reputation_Tour_Seattle_-_Getaway_Car.jpg',
      moment: {
        sources: [
          {
            outlet: 'iHeartRadio',
            url: 'https://www.iheart.com/content/2018-05-08-taylor-swift-kicks-off-reputation-tour-with-big-setlist-fireworks-snakes/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Taylor_Swift_-_Reputation_Tour_Seattle_-_Getaway_Car.jpg/250px-Taylor_Swift_-_Reputation_Tour_Seattle_-_Getaway_Car.jpg',
            credit: 'Ronald Woan / Wikimedia Commons',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Taylor_Swift_Sports_Authority_Field_05.25.18_%2842328420702%29.jpg/250px-Taylor_Swift_Sports_Authority_Field_05.25.18_%2842328420702%29.jpg',
            credit: 'Julio Enriquez / Wikimedia Commons',
          },
        ],
      },
    },
    {
      year: 2017,
      month: 8,
      category: 'release',
      title: 'The snake video that announced reputation',
      snippet:
        'She wiped her social media clean, then reappeared three days later with a slithering snake video — a reclaimed symbol before the album title and Nov. 10 release date dropped.',
      sourceUrl: 'https://www.refinery29.com/en-us/2017/08/168987/taylor-swift-snake-instagram-video-symbolism-emoji',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'Refinery29',
            url: 'https://www.refinery29.com/en-us/2017/08/168987/taylor-swift-snake-instagram-video-symbolism-emoji',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-reputation-new-album-7941019/',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2017,
      month: 11,
      category: 'music',
      title: "New Year's Day closes reputation on a quiet, acoustic note",
      snippet: 'After an album about scandal and revenge, the final track is a piano ballad about who does the dishes the morning after.',
      sourceUrl: "https://en.wikipedia.org/wiki/New_Year's_Day_(Taylor_Swift_song)",
      thumbnailUrl: null,
      moment: {
        context:
          'Her own reasoning: "I think there\'s something even more romantic about who\'s gonna deal with you on New Year\'s Day. Who\'s willing to give you Advil and clean up the house? I think that states more of a permanence."',
        sources: [{ outlet: 'Wikipedia', url: "https://en.wikipedia.org/wiki/New_Year's_Day_(Taylor_Swift_song)" }],
        photos: [],
      },
    },
    {
      year: 2018,
      month: 3,
      category: 'release',
      title: 'A second, stripped-down Delicate video — just her, a clearing, and one take',
      snippet:
        'Two weeks after the elaborate original, a Spotify-exclusive alternate: Taylor, alone in the woods, singing straight into a single unbroken shot.',
      sourceUrl: 'https://www.rollingstone.com/music/music-news/watch-taylor-swifts-one-take-new-delicate-video-629359/',
      thumbnailUrl: 'https://i.ytimg.com/vi/3tHoEgt0zB8/maxresdefault.jpg',
      moment: {
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/watch-taylor-swifts-one-take-new-delicate-video-629359/',
          },
        ],
        photos: [{ url: 'https://i.ytimg.com/vi/3tHoEgt0zB8/maxresdefault.jpg', credit: 'YouTube / Taylor Swift' }],
      },
    },
    {
      year: 2018,
      month: 12,
      category: 'release',
      title: 'The reputation Stadium Tour film premieres on Netflix, New Year\'s Eve',
      snippet: 'Announced on her 29th birthday, filmed secretly at her last North American tour stop, released globally at 12:01 a.m. on New Year\'s Eve.',
      sourceUrl: 'https://www.refinery29.com/en-us/2018/12/219360/taylor-swift-reputation-tour-concert-movie-netflix',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Taylor_Swift_performing_Fearless_during_Reputation_Stadium_Tour_-_New_Jersey%2C_2018.jpg/250px-Taylor_Swift_performing_Fearless_during_Reputation_Stadium_Tour_-_New_Jersey%2C_2018.jpg',
      moment: {
        context:
          'Filmed in Dallas with guest performances from Maren Morris and Sugarland, capturing the final North American stop of a tour that had just closed out as the highest-grossing U.S. tour ever, at $266.1 million.',
        sources: [
          {
            outlet: 'Refinery29',
            url: 'https://www.refinery29.com/en-us/2018/12/219360/taylor-swift-reputation-tour-concert-movie-netflix',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Taylor_Swift_performing_Fearless_during_Reputation_Stadium_Tour_-_New_Jersey%2C_2018.jpg/250px-Taylor_Swift_performing_Fearless_during_Reputation_Stadium_Tour_-_New_Jersey%2C_2018.jpg',
            credit: 'Melodies1917 / Wikimedia Commons',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 10,
      category: 'business',
      title: '23 AMA wins — more than any woman in history',
      snippet:
        'Four more trophies at the 2018 AMAs pushed her past Whitney Houston for the most American Music Award wins ever by a woman.',
      sourceUrl: 'https://www.forbes.com/sites/hughmcintyre/2018/10/10/taylor-swift-now-holds-the-record-for-the-most-american-music-award-wins-among-women/',
      thumbnailUrl: 'https://specials-images.forbesimg.com/dam/imageserve/1048528712/960x0.jpg?fit=scale',
      moment: {
        sources: [
          {
            outlet: 'Forbes',
            url: 'https://www.forbes.com/sites/hughmcintyre/2018/10/10/taylor-swift-now-holds-the-record-for-the-most-american-music-award-wins-among-women/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/awards/2018-amas-recap-taylor-swift-cardi-b-8479215/',
          },
        ],
        photos: [
          {
            url: 'https://specials-images.forbesimg.com/dam/imageserve/1048528712/960x0.jpg?fit=scale',
            credit: 'Jeff Kravitz/FilmMagic',
          },
        ],
      },
    },

    // --- Fashion/photo depth pass (2026-07-04) ---
    // Zero fashion items existed for this era before this batch. Every claim
    // and photo below was verified against its cited source directly (see
    // supabase/seed/content/_example.mjs for the no-fabrication rule).
    {
      year: 2018,
      month: 5,
      category: 'fashion',
      title: "The reputation Stadium Tour's snake bodysuit",
      snippet:
        'A black-and-red, sequined Roberto Cavalli bodysuit with cutouts and a serpent motif, worn for the "Look What You Made Me Do" segment of every stadium show.',
      sourceUrl: 'https://www.rollingstone.com/music/music-news/taylor-swift-reputation-gold-reputation-bodysuit-doc-series-1235487475/',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Taylor_Swift_-_Reputation_Tour_Seattle_-_Look_What_You_Made_Me_Do.jpg/250px-Taylor_Swift_-_Reputation_Tour_Seattle_-_Look_What_You_Made_Me_Do.jpg',
      moment: {
        context:
          'Roberto Cavalli designed the original snake-cutout bodysuit for the reputation Stadium Tour leg of the show. It went unchanged for the entire 131-show run — the only outfit on the tour that never got a variation — until Swift debuted a reworked black-and-gold version six years later on the Eras Tour.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-reputation-gold-reputation-bodysuit-doc-series-1235487475/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Taylor_Swift_-_Reputation_Tour_Seattle_-_Look_What_You_Made_Me_Do.jpg/250px-Taylor_Swift_-_Reputation_Tour_Seattle_-_Look_What_You_Made_Me_Do.jpg',
            credit: 'Ronald Woan / Wikimedia Commons',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 3,
      category: 'fashion',
      title: 'The teal fringe dress in the second Delicate video',
      snippet:
        'A custom Naeem Khan piece from his Spring 2018 collection — layered tassels that swing into a mini as she twirls through the one-take video.',
      sourceUrl: 'https://www.bustle.com/p/where-to-buy-taylor-swifts-delicate-blue-tassel-dress-thats-causing-a-fashion-frenzy-8469568',
      thumbnailUrl:
        'https://imgix.bustle.com/uploads/image/2018/3/12/c5dd79b9-3dd6-48fb-be2c-6b565fc5fe09-screen-shot-2018-03-12-at-61855-am.png?w=248&h=218&fit=crop&crop=faces&dpr=2',
      moment: {
        context:
          'The teal, tiered-tassel dress was custom-made by Naeem Khan from his Spring 2018 ready-to-wear runway collection, styled with Anabela Chan earrings and Christian Louboutin pumps. It became one of the most-searched dresses of the video\'s release week.',
        sources: [
          {
            outlet: 'Bustle',
            url: 'https://www.bustle.com/p/where-to-buy-taylor-swifts-delicate-blue-tassel-dress-thats-causing-a-fashion-frenzy-8469568',
          },
        ],
        photos: [
          {
            url: 'https://imgix.bustle.com/uploads/image/2018/3/12/c5dd79b9-3dd6-48fb-be2c-6b565fc5fe09-screen-shot-2018-03-12-at-61855-am.png?w=248&h=218&fit=crop&crop=faces&dpr=2',
            credit: 'Bustle',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 10,
      category: 'fashion',
      title: 'A disco-ball Balmain look for the 2018 AMAs',
      snippet:
        'A mirrored, all-silver Balmain minidress and matching thigh-high boots — Olivier Rousteing\'s design, worn the same night she performed "I Did Something Bad" and won Artist of the Year.',
      sourceUrl: 'https://www.hollywoodreporter.com/lifestyle/style/american-music-awards-taylor-swift-wears-badass-balmain-outfit-1150928/',
      thumbnailUrl: 'https://www.hollywoodreporter.com/wp-content/uploads/2018/10/gettyimages-1048368054_copy.jpg?w=1296&h=730&crop=1',
      moment: {
        context:
          'Designed by Olivier Rousteing from Balmain\'s Episode collection: a long-sleeved, mock-neck minidress covered edge-to-edge in tiny mirrored squares ($7,650), paired with matching disco-ball thigh-high boots, a snake ring nodding to the album, and a sleek bouffant updo with a bold black cat-eye.',
        sources: [
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/lifestyle/style/american-music-awards-taylor-swift-wears-badass-balmain-outfit-1150928/',
          },
          {
            outlet: 'W Magazine',
            url: 'https://www.wmagazine.com/story/taylor-swift-balmain-disco-ball-2018-american-music-awards',
          },
        ],
        photos: [
          {
            url: 'https://www.hollywoodreporter.com/wp-content/uploads/2018/10/gettyimages-1048368054_copy.jpg?w=1296&h=730&crop=1',
            credit: 'Getty Images',
          },
          {
            url: 'https://imgix.bustle.com/wmag/2018/10/09/5bbd2d31a36ed72d939f3ec2_GettyImages-1048354800.jpg?w=414&h=276&fit=crop&crop=faces&dpr=2',
            credit: 'Getty Images',
          },
        ],
      },
    },
    {
      year: 2017,
      month: 8,
      category: 'fashion',
      title: 'Zombie makeup for Look What You Made Me Do',
      snippet:
        'The grave-crawling zombie look that opens the video was created by Bill Corso — the makeup artist behind Deadpool\'s scarred face — confirmed on record by director Joseph Kahn.',
      sourceUrl: 'https://www.etonline.com/taylor-swifts-look-what-you-made-me-do-video-everything-we-know-about-the-snakes-diamonds-dancing',
      thumbnailUrl: 'https://i.ytimg.com/vi/3tmd-ClpJxA/hqdefault.jpg',
      moment: {
        context:
          'Director Joseph Kahn confirmed via Twitter that special-makeup artist Bill Corso — who did Ryan Reynolds\' scarred prosthetic look in "Deadpool" — created zombie Taylor for the opening graveyard scene, a look deliberately pitched as the antithesis of her earlier, more polished eras.',
        sources: [
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/taylor-swifts-look-what-you-made-me-do-video-everything-we-know-about-the-snakes-diamonds-dancing',
          },
        ],
        photos: [{ url: 'https://i.ytimg.com/vi/3tmd-ClpJxA/hqdefault.jpg', credit: 'YouTube / Taylor Swift' }],
      },
    },

    // --- Fashion/photo depth pass 2 (2026-07-04) ---
    // Second pass, still zero-to-thin on fashion depth before this batch.
    // Every claim and photo below verified directly against its cited
    // source (see supabase/seed/content/_example.mjs for the no-fabrication
    // rule). Costume designer for the whole Stadium Tour wardrobe below is
    // Jessica Jones, confirmed via her IMDb costume-department credit and
    // corroborated across every cited outfit post.
    {
      year: 2018,
      month: 5,
      category: 'fashion',
      title: 'An 800-hour Atelier Versace gown for her first red carpet in two years',
      snippet:
        'Blush-pink, one-shoulder, a thigh-high slit, and a floor-sweeping half-cape of appliqued feathers — Donatella Versace said the piece took over 800 hours to build.',
      sourceUrl: 'https://www.billboard.com/articles/columns/pop/8457333/taylor-swift-bbma-dress-800-hours-to-make',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/media/02-taylor-swift-bbmas-arrivals-2018-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'Worn to the 2018 Billboard Music Awards — a rare red-carpet stop mid-tour — the custom Atelier Versace gown paired scattered appliques at the bust, shoulder, and hips with Casadei shoes. Donatella Versace confirmed the 800-plus build hours on Instagram weeks before the show.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/articles/columns/pop/8457333/taylor-swift-bbma-dress-800-hours-to-make',
          },
          {
            outlet: 'The Fashion Court',
            url: 'https://thefashion-court.com/2018/05/taylor-swift-2018-billboard-music-awards/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/02-taylor-swift-bbmas-arrivals-2018-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Billboard',
          },
          {
            url: 'https://thefashion-court.com/wp-content/uploads/2018/05/taylor-swift-atelier-versace-bbmas-2018.png',
            credit: 'The Fashion Court',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 6,
      category: 'fashion',
      title: 'The reputation tour opening number gets a glitter-cutout upgrade',
      snippet:
        'Debuted night two in Chicago: a custom Jessica Jones bodysuit and matching jacket with intricate glitter cutout patterns, worn with Christian Louboutin boots.',
      sourceUrl: 'https://tayswiftstyle.wordpress.com/2018/06/06/reputation-tour-110-version-2-ready-for-it/',
      thumbnailUrl: 'https://tayswiftstyle.wordpress.com/wp-content/uploads/2018/06/tumblr_p9wqzvce8h1r4fk4fo1_r1_1280.jpg?w=1100',
      moment: {
        context:
          'Jessica Jones, Swift\'s longtime tour costume designer, reworked the "...Ready For It?" opening-number look partway through the run — swapping in a bodysuit-and-jacket set covered edge to edge in cutout glitter patterning.',
        sources: [
          {
            outlet: 'Taylor Swift Style',
            url: 'https://tayswiftstyle.wordpress.com/2018/06/06/reputation-tour-110-version-2-ready-for-it/',
          },
        ],
        photos: [
          {
            url: 'https://tayswiftstyle.wordpress.com/wp-content/uploads/2018/06/tumblr_p9wqzvce8h1r4fk4fo1_r1_1280.jpg?w=1100',
            credit: 'Taylor Swift Style',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 7,
      category: 'fashion',
      title: 'A sparkling green bodysuit for the "Dress" segment',
      snippet:
        'One of three custom Jessica Jones bodysuits Taylor rotated through for the "Blank Space"/"Bad Blood"/"Should\'ve Said No" block — this version in dense sparkling green, worn with Christian Louboutin boots.',
      sourceUrl: 'https://tayswiftstyle.wordpress.com/2018/07/22/reputation-tour-blank-space-bad/',
      thumbnailUrl: 'https://tayswiftstyle.wordpress.com/wp-content/uploads/2018/07/tumblr_pc9uwg06kq1r4fk4fo1_1280.jpg?w=1100',
      moment: {
        context:
          'Jessica Jones designed at least three versions of this sequined bodysuit across the tour\'s run for the "Dress"-nicknamed segment; the sparkling green iteration debuted in the summer 2018 European leg.',
        sources: [
          {
            outlet: 'Taylor Swift Style',
            url: 'https://tayswiftstyle.wordpress.com/2018/07/22/reputation-tour-blank-space-bad/',
          },
        ],
        photos: [
          {
            url: 'https://tayswiftstyle.wordpress.com/wp-content/uploads/2018/07/tumblr_pc9uwg06kq1r4fk4fo1_1280.jpg?w=1100',
            credit: 'Taylor Swift Style',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 7,
      category: 'fashion',
      title: 'The "cotton candy" dress for "Delicate"/"Shake It Off"',
      snippet:
        'A rainbow, tiered-tassel custom Jessica Jones mini dress Taylor herself nicknamed her "cotton candy" dress — one of four versions built for the segment.',
      sourceUrl: 'https://tayswiftstyle.wordpress.com/2018/07/23/reputation-tour-delicateshake-it-off/',
      thumbnailUrl: 'https://tayswiftstyle.wordpress.com/wp-content/uploads/2018/07/tumblr_pcati7kyz11r4fk4fo1_r1_1280.jpg?w=1100',
      moment: {
        context:
          'Jessica Jones built four rotating versions of this fringed mini dress for the "Delicate"/"Shake It Off" segment; this rainbow-tassel take was the one Taylor nicknamed her "cotton candy" dress on stage.',
        sources: [
          {
            outlet: 'Taylor Swift Style',
            url: 'https://tayswiftstyle.wordpress.com/2018/07/23/reputation-tour-delicateshake-it-off/',
          },
        ],
        photos: [
          {
            url: 'https://tayswiftstyle.wordpress.com/wp-content/uploads/2018/07/tumblr_pcati7kyz11r4fk4fo1_r1_1280.jpg?w=1100',
            credit: 'Taylor Swift Style',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 5,
      category: 'fashion',
      title: 'A snake bodysuit and red camo jacket for the Shawn Mendes duet',
      snippet:
        'For the "There\'s Nothing Holding Me Back" duet stop, a custom Jessica Jones snake-print bodysuit layered under a red camouflage sequined jacket with a buckle waist, plus custom Christian Louboutin boots.',
      sourceUrl: 'https://tayswiftstyle.wordpress.com/2018/05/20/reputation-tour-theres-nothing-holding-me-2/',
      thumbnailUrl: 'https://tayswiftstyle.wordpress.com/wp-content/uploads/2018/05/tumblr_p917q0nrgd1r4fk4fo1_1280.jpg?w=1100',
      moment: {
        context:
          'Worn in Pasadena on May 18, 2018, when Shawn Mendes joined the tour for "There\'s Nothing Holding Me Back": a Jessica Jones snake-pattern bodysuit under a red camo sequined jacket with buckle detailing, styled with custom Louboutin boots.',
        sources: [
          {
            outlet: 'Taylor Swift Style',
            url: 'https://tayswiftstyle.wordpress.com/2018/05/20/reputation-tour-theres-nothing-holding-me-2/',
          },
        ],
        photos: [
          {
            url: 'https://tayswiftstyle.wordpress.com/wp-content/uploads/2018/05/tumblr_p917q0nrgd1r4fk4fo1_1280.jpg?w=1100',
            credit: 'Taylor Swift Style',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 5,
      category: 'fashion',
      title: 'The "Call It What You Want"/"...Nice Things" closer dress',
      snippet:
        'A custom Jessica Jones gown for the show\'s emotional final segment — the blogger who\'s tracked every tour costume called it a grown-up echo of a Jenny Packham piece from the Fearless Tour.',
      sourceUrl: 'https://tayswiftstyle.wordpress.com/2018/05/11/reputation-tour-call-it-what-you-want-this/',
      thumbnailUrl: 'https://tayswiftstyle.wordpress.com/wp-content/uploads/2018/05/tumblr_p8jr4cwjzw1r4fk4fo1_1280.jpg?w=1100',
      moment: {
        context:
          'Closing the show over "Call It What You Want" into "This Is Why We Can\'t Have Nice Things," Taylor wore a custom Jessica Jones gown styled with Christian Louboutin boots.',
        sources: [
          {
            outlet: 'Taylor Swift Style',
            url: 'https://tayswiftstyle.wordpress.com/2018/05/11/reputation-tour-call-it-what-you-want-this/',
          },
        ],
        photos: [
          {
            url: 'https://tayswiftstyle.wordpress.com/wp-content/uploads/2018/05/tumblr_p8jr4cwjzw1r4fk4fo1_1280.jpg?w=1100',
            credit: 'Taylor Swift Style',
          },
        ],
      },
    },

    // --- Sightings pass (2026-07-05) ---
    // Zero sighting items existed for this era before this batch. This was a
    // deliberately private stretch of Taylor's life — she and Joe Alwyn were
    // photographed together only a handful of times across nearly two years,
    // almost always by paparazzi/agency photographers rather than at staged
    // events. Every item below is one of those rare documented sightings;
    // every claim and photo verified directly against its cited source (see
    // supabase/seed/content/_example.mjs for the no-fabrication rule). A
    // broader search for a rare-airport-look sighting and Nashville family
    // visits in this specific window turned up nothing independently
    // verifiable, so neither is included — quality over quantity.
    {
      year: 2018,
      month: 5,
      category: 'sighting',
      title: 'A fish-and-chips pub date at The Flask, no red carpet in sight',
      snippet:
        'Paparazzi caught Taylor and Joe Alwyn leaving The Flask, a traditional North London pub, after fish and chips and a pint each — one of only a handful of public sightings during a deliberately private relationship.',
      sourceUrl: 'https://www.wmagazine.com/story/taylor-swift-joe-alwyn-photographed-date-london',
      thumbnailUrl:
        'https://imgix.bustle.com/wmag/2018/06/01/5b11723f15af2220684cbe78_GettyImages-963107270.jpg?w=414&h=276&fit=crop&crop=faces&dpr=2',
      moment: {
        context:
          'Photographed leaving The Flask, a centuries-old pub in North London, on May 30, 2018, mid-way through a break in the reputation Stadium Tour. Swift wore a striped tank top and skirt; Alwyn kept it casual in a white T-shirt and jeans. The two spent about 45 minutes inside over fish and chips and pints of London Pride before leaving in a waiting car — one of the rare unstaged sightings the notoriously private couple allowed during this era.',
        sources: [
          {
            outlet: 'W Magazine',
            url: 'https://www.wmagazine.com/story/taylor-swift-joe-alwyn-photographed-date-london',
          },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/taylor-swift-steps-mini-skirt-232044419.html',
          },
        ],
        photos: [
          {
            url: 'https://imgix.bustle.com/wmag/2018/06/01/5b11723f15af2220684cbe78_GettyImages-963107270.jpg?w=414&h=276&fit=crop&crop=faces&dpr=2',
            credit: 'Jo Hale/Getty Images',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 7,
      category: 'sighting',
      title: 'A rare Fourth of July, just the two of them, in Turks and Caicos',
      snippet:
        'No star-studded Rhode Island party this year — instead, Taylor and Joe Alwyn were photographed hand in hand on a beach in Turks and Caicos over the holiday weekend, swimming and snorkeling during a tour break.',
      sourceUrl: 'https://www.eonline.com/news/950442/taylor-swift-and-joe-alwyn-hold-hands-in-turks-and-caicos',
      thumbnailUrl:
        'https://akns-images.eonline.com/eol_images/Entire_Site/201869/rs_634x1024-180709130925-634-Taylor-Swift-Joe-Alwayn-Turks-And-Caicos-JR-070918.jpg?fit=around%7C634:1024&output-quality=90&crop=634:1024;center,top',
      moment: {
        context:
          "During a break in the reputation Stadium Tour's summer leg, Swift and Alwyn spent the July 4, 2018 weekend at an oceanfront villa in Turks and Caicos rather than hosting her usual Rhode Island gathering. Paparazzi photographed the couple walking the shoreline hand in hand, swimming, and snorkeling; an eyewitness told E! News they kept a low profile the entire stay, splitting time between the villa's beach, pool, and gym.",
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/950442/taylor-swift-and-joe-alwyn-hold-hands-in-turks-and-caicos',
          },
          {
            outlet: 'Just Jared Jr.',
            url: 'https://www.justjaredjr.com/2018/07/05/taylor-swift-vacations-with-joe-alwyn-in-turks-caicos/',
          },
        ],
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/201869/rs_634x1024-180709130925-634-Taylor-Swift-Joe-Alwayn-Turks-And-Caicos-JR-070918.jpg?fit=around%7C634:1024&output-quality=90&crop=634:1024;center,top',
            credit: 'SBMF / BACKGRID',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 8,
      category: 'sighting',
      title: 'Steak, wine, and a rare London date night at Hawksmoor',
      snippet:
        'Taylor and Joe Alwyn were photographed holding hands leaving Hawksmoor Seven Dials, a Covent Garden steakhouse, after a two-and-a-half-hour dinner during a break in the reputation Stadium Tour.',
      sourceUrl: 'https://www.eonline.com/news/962926/inside-taylor-swift-and-joe-alwyn-s-romantic-dinner-date-in-london',
      thumbnailUrl:
        'https://s.yimg.com/ny/api/res/1.2/8s7AwHFL8l1fcEO1Nzrakg--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyNDI7aD02MjQ7Y2Y9d2VicA--/https://media.zenfs.com/en-US/homerun/elle_570/932921f24da6dde86e34cff9ab62a007',
      moment: {
        context:
          'On August 22, 2018, during a five-day break from touring, Swift and Alwyn dined at Hawksmoor Seven Dials in Covent Garden, arriving around 8 p.m. with security and leaving hand in hand roughly two and a half hours later. They reportedly shared fillet steaks with spinach and mac and cheese, toasting with wine in a private section of the restaurant. Swift wore an off-the-shoulder green dress and a necklace bearing Alwyn\'s initial.',
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/962926/inside-taylor-swift-and-joe-alwyn-s-romantic-dinner-date-in-london',
          },
          {
            outlet: 'Elle (via Yahoo)',
            url: 'https://www.yahoo.com/lifestyle/taylor-swift-joe-alwyn-ate-182400550.html',
          },
        ],
        photos: [
          {
            url: 'https://s.yimg.com/ny/api/res/1.2/8s7AwHFL8l1fcEO1Nzrakg--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyNDI7aD02MjQ7Y2Y9d2VicA--/https://media.zenfs.com/en-US/homerun/elle_570/932921f24da6dde86e34cff9ab62a007',
            credit: 'BACKGRID',
          },
          {
            url: 'https://s.yimg.com/ny/api/res/1.2/BUHEwdl3nKDJks5lcyY46g--/YXBwaWQ9aGlnaGxhbmRlcjt3PTk2MDtoPTEwNDY7Y2Y9d2VicA--/https://media.zenfs.com/en-US/homerun/elle_570/c5e18120192022d5561829bc16d9961e',
            credit: 'BACKGRID',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 9,
      category: 'sighting',
      title: 'Skipping the red carpet to support Joe Alwyn at the New York Film Festival',
      snippet:
        "Swift avoided The Favourite's red carpet entirely, watching from inside Lincoln Center and catching up with Jennifer Lawrence, then left hand in hand with Alwyn through a back exit.",
      sourceUrl: 'https://www.wmagazine.com/story/taylor-swift-joe-alwyn-the-favourite-premiere',
      thumbnailUrl:
        'https://imgix.bustle.com/wmag/2018/09/29/5baf8bb27359e94f4fc119bb_GettyImages-1042761566.jpg?w=414&h=531&fit=crop&crop=faces&dpr=2',
      moment: {
        context:
          'On September 28, 2018, Swift attended the New York Film Festival premiere of The Favourite to support Alwyn, who co-starred alongside Emma Stone and Rachel Weisz. She skipped the red carpet where her boyfriend posed with castmates, instead watching the screening from inside Lincoln Center\'s theater, where she was seen chatting with Jennifer Lawrence. Photographers caught the couple leaving hand in hand through a side exit afterward, in a sparkling red-and-black sequined dress, Jimmy Choo pumps, and Eva Fehren jewelry.',
        sources: [
          {
            outlet: 'W Magazine',
            url: 'https://www.wmagazine.com/story/taylor-swift-joe-alwyn-the-favourite-premiere',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-joe-alwyn-the-favourite-premiere-8477522/',
          },
        ],
        photos: [
          {
            url: 'https://imgix.bustle.com/wmag/2018/09/29/5baf8bb27359e94f4fc119bb_GettyImages-1042761566.jpg?w=414&h=531&fit=crop&crop=faces&dpr=2',
            credit: 'Jackson Lee/GC Images',
          },
        ],
      },
    },
    {
      year: 2019,
      month: 4,
      category: 'sighting',
      title: 'A denim-themed birthday party for Gigi Hadid — sans denim',
      snippet:
        "Swift made a rare public appearance at best friend Gigi Hadid's 24th birthday party in New York, skipping the party's all-denim dress code for a red checkered blazer and floral dress.",
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-gigi-hadid-birthday-party-photos-8508341/',
      thumbnailUrl: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-nyc-April-22-2019-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          "Swift attended Gigi Hadid's 24th birthday celebration at L'Avenue at Saks in New York City on April 22, 2019, alongside guests including Martha Hunt, Hailee Steinfeld, Ashley Graham, and Hadid's mother Yolanda. Photographers caught her arriving in a red checkered blazer over a floral dress, having opted out of the party's denim theme. Appearances at friends' private events were among the only places she was reliably photographed during this deliberately low-profile stretch.",
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-gigi-hadid-birthday-party-photos-8508341/',
          },
          {
            outlet: 'Refinery29',
            url: 'https://www.refinery29.com/en-us/2019/04/230667/taylor-swift-gigi-hadid-birthday-surprise-appearance',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-nyc-April-22-2019-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Gotham/GC Images',
          },
        ],
      },
    },

    // --- Music/business/sightings depth pass 3 (2026-07-05) ---
    // Music backstories were thin (2 items for a 15-track album) going into
    // this batch; both new quotes below are pulled directly from the primary
    // iHeartRadio release-party writeup (verified via WebFetch), not a
    // secondary summary. The two new sightings are genuinely distinct dated
    // paparazzi events, verified separately from the sibling relationship-
    // history PR's known milestones. One sighting (the March 2018 Malibu
    // hike) has no verifiable photo of the actual moment — only generic
    // file/red-carpet composites turned up under that headline — so its
    // photos array is intentionally empty rather than using a non-matching
    // image. All other photo URLs below were verified with curl (2xx,
    // image/*) and a visual check that they depict the specific moment.
    {
      year: 2017,
      month: 11,
      category: 'music',
      title: "The Getaway Car bridge, written in under 30 seconds on camera",
      snippet:
        "Jack Antonoff caught it on Taylor's iPhone: \"the only time in my life...that a camera was ever on when magic actually happened.\"",
      sourceUrl:
        'https://www.rollingstone.com/music/music-news/jack-antonoff-on-working-with-taylor-swift-and-viral-getaway-car-video-1234852109/',
      thumbnailUrl: null,
      moment: {
        context:
          "Taylor wrote and produced Getaway Car with Jack Antonoff, and its bridge came together in under 30 seconds during a studio session she happened to be recording on her phone. Antonoff later called it singular in his career: \"That was the only time in my life — million hours I've spent in studios — that a camera was ever on when magic actually happened. She just had her iPhone on for whatever reason...I think that's why that video became so popular, because it was real.\"",
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/jack-antonoff-on-working-with-taylor-swift-and-viral-getaway-car-video-1234852109/',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2017,
      month: 11,
      category: 'music',
      title: "Delicate's confession: 'could something fake...affect something real?'",
      snippet:
        "Taylor's own framing, from the album's release night: the record turns vulnerable exactly when it hits track five.",
      sourceUrl:
        'https://www.iheart.com/content/2017-11-10-taylor-swifts-iheartradio-reputation-release-party-everything-we-learned/',
      thumbnailUrl: null,
      moment: {
        context:
          'At the iHeartRadio reputation release-party special the night the album came out, Taylor explained why Delicate — track five — marks the record\'s turn from bombastic to vulnerable: "Could something fake, like your reputation, affect something real, like somebody getting to know you?" It\'s the moment she\'s said the album starts asking what happens when you meet someone you actually want in your life.',
        sources: [
          {
            outlet: 'iHeartRadio',
            url: 'https://www.iheart.com/content/2017-11-10-taylor-swifts-iheartradio-reputation-release-party-everything-we-learned/',
          },
        ],
        photos: [],
      },
    },

    // --- Active-tier batch 2 (2026-07-04), per docs/decisions.md.
    {
      year: 2019,
      month: 2,
      category: 'relationship',
      title: 'A rare public appearance with Joe Alwyn at the BAFTAs',
      snippet: 'The notoriously private couple stepped out together at the after-party, celebrating "The Favourite" winning seven BAFTAs.',
      sourceUrl: 'https://www.billboard.com/music/pop/taylor-swift-joe-alwyn-the-favourite-2019-bafta-awards-party-8497568/',
      thumbnailUrl: null,
      moment: {
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-joe-alwyn-the-favourite-2019-bafta-awards-party-8497568/',
          },
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/1014397/see-taylor-swift-and-joe-alwyn-pack-on-the-pda-at-baftas-after-party',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2017,
      month: 11,
      category: 'music',
      title: 'Call It What You Want closes the arc: rebellion, then falling in love',
      snippet:
        "\"It starts with...rebellion, or anger, or angst...and then falling in love, and realizing you settle into what your priorities are\" — her own map of reputation, with this song as the landing point.",
      sourceUrl:
        'https://www.iheart.com/content/2017-11-10-taylor-swifts-iheartradio-reputation-release-party-everything-we-learned/',
      thumbnailUrl: null,
      moment: {
        context:
          'At the same iHeartRadio release-party special, Taylor described how Call It What You Want — track 11, and the one most fans read as being about Joe Alwyn — completes reputation\'s arc: "It starts with just getting out any kind of rebellion, or anger, or angst, or whatever. And then, like, falling in love, and realizing that you kind of settle into what your priorities are."',
        sources: [
          {
            outlet: 'iHeartRadio',
            url: 'https://www.iheart.com/content/2017-11-10-taylor-swifts-iheartradio-reputation-release-party-everything-we-learned/',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2019,
      month: 2,
      category: 'business',
      title: "One nomination for the year's best-selling album",
      snippet:
        'At the 61st Grammys, reputation — 2018\'s top seller — picked up a single nomination, Best Pop Vocal Album, and was shut out of Album, Record, and Song of the Year.',
      sourceUrl: 'https://www.rollingstone.com/music/music-news/taylor-swift-reputation-grammys-snub-764008/',
      thumbnailUrl:
        'https://www.rollingstone.com/wp-content/uploads/2018/12/taylor-swift-biggest-loser.jpg?w=1600&h=900&crop=1',
      moment: {
        context:
          "Reputation was the best-selling album of both 2017 and 2018, but by the 61st Annual Grammy Awards in February 2019 it had one nomination to show for it: Best Pop Vocal Album. None of its singles — \"Look What You Made Me Do,\" \"...Ready for It?,\" \"End Game,\" \"New Year's Day,\" \"Gorgeous,\" or \"Delicate\" — made the cut for Record, Song, or Album of the Year, making it, per Rolling Stone, her least-nominated LP since her self-titled 2006 debut.",
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-reputation-grammys-snub-764008/',
          },
        ],
        photos: [
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2018/12/taylor-swift-biggest-loser.jpg?w=1600&h=900&crop=1',
            credit: 'Frank Micelotta/PictureGroup/REX Shutterstock',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 10,
      category: 'business',
      title: 'Breaking a Rolling Stones record set a decade earlier — in almost half the shows',
      snippet:
        "$266.1 million and 2,068,399 tickets across 38 U.S. stadium shows passed the Rolling Stones' prior record — the biggest gross in Billboard Boxscore's history since it began tracking in 1990.",
      sourceUrl: 'https://www.billboard.com/pro/taylor-swift-reputation-stadium-tour-breaks-record-highest-grossing-us-tour/',
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/media/taylor-swift-reputation-tour-nov-21-2018-billboard-1548.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          "The reputation Stadium Tour's North American leg (May 8-Oct. 6, 2018) grossed $266.1 million from 2,068,399 tickets over 38 shows, breaking the U.S. touring record the Rolling Stones had held since their 2005-07 A Bigger Bang tour grossed $245 million — across 70 shows, nearly double what Swift needed.",
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-reputation-stadium-tour-breaks-record-highest-grossing-us-tour/',
          },
        ],
        photos: [
          {
            url: 'https://www.billboard.com/wp-content/uploads/media/taylor-swift-reputation-tour-nov-21-2018-billboard-1548.jpg?w=942&h=628&crop=1',
            credit: 'Jun Sato/TAS18/Getty Images',
          },
        ],
      },
    },
    {
      year: 2018,
      month: 3,
      category: 'sighting',
      title: 'A Malibu hike, and an outfit that read like a lyric',
      snippet:
        "Their first sighting together in months: a 90-minute Malibu hike, Joe Alwyn in the exact \"dark jeans and Nikes\" from Delicate's opening line, two days before its surprise second video.",
      sourceUrl:
        'https://www.etonline.com/taylor-swift-steps-out-for-romantic-hike-with-boyfriend-joe-alwyn-see-the-pic-98043',
      thumbnailUrl: null,
      moment: {
        context:
          'Photographed hiking in Malibu on March 7, 2018 — their first sighting together in months — Taylor wore black running shorts, a dark gray tank top, and a black hoodie tied around her waist; Joe Alwyn wore dark jeans and Nike sneakers. A source told E! News "they were deep in conversation for most of the hike and their attention was focused solely on one another." Fans quickly noted Alwyn\'s outfit matched Delicate\'s opening line, "Dark jeans and your Nikes, look at you" — two days before Swift released the song\'s surprise one-take Spotify video.',
        sources: [
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/taylor-swift-steps-out-for-romantic-hike-with-boyfriend-joe-alwyn-see-the-pic-98043',
          },
          {
            outlet: 'Bustle',
            url: 'https://www.bustle.com/p/taylor-swift-joe-alwyn-went-hiking-but-fans-think-it-was-sneaky-promo-for-her-next-single-8454429',
          },
        ],
        photos: [],
      },
    },
    {
      year: 2019,
      month: 3,
      category: 'sighting',
      title: 'Hand in hand on the Franklin Canyon trail, near the era\'s close',
      snippet:
        'One of the last documented sightings of the reputation stretch: Taylor and Joe Alwyn hiking Franklin Canyon Park in Beverly Hills, caught holding hands by paparazzi.',
      sourceUrl: 'https://www.justjared.com/2019/03/04/taylor-swift-joe-alwyn-hold-hands-while-hiking-in-l-a/',
      thumbnailUrl:
        'https://jj-justjared-media.s3.us-east-1.amazonaws.com/wp-content/uploads/2019/03/taylor-hiking/taylor-swift-joe-alwyn-go-hiking-04.jpg',
      moment: {
        context:
          'Photographed holding hands while hiking the Franklin Canyon Park Trail in Beverly Hills on Sunday, March 3, 2019, Taylor wore a yellow crop top, high-waisted denim shorts, and rainbow Nike sneakers, with Joe Alwyn alongside her. It was one of only a handful of documented sightings of the couple during this stretch of the era.',
        sources: [
          {
            outlet: 'Just Jared',
            url: 'https://www.justjared.com/2019/03/04/taylor-swift-joe-alwyn-hold-hands-while-hiking-in-l-a/',
          },
        ],
        photos: [
          {
            url: 'https://jj-justjared-media.s3.us-east-1.amazonaws.com/wp-content/uploads/2019/03/taylor-hiking/taylor-swift-joe-alwyn-go-hiking-04.jpg',
            credit: 'Just Jared',
          },
        ],
      },
    },
  ],
};
