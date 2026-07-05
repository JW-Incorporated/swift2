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
  ],
};
