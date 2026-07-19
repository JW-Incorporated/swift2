// Vault content — Speak Now era.
//
// Two wavetop months: Oct 2010 (album release) and Feb 2011 (tour opens).
// Every claim verified against its cited source directly. See
// docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first) authoring model this follows.
//
// "Dear John" is one of the most persistently theorized songs in Swift's
// catalog (widely attributed to a real ex-partner). Deliberately excludes
// any naming/implication — sticks to the song's own described narrative
// and a critic's assessment. Codex's first-pass title ("the relationship
// it doesn't name") was rejected as too knowing a wink at the theory;
// reworded to stay further from that line.

export default {
  eraSlug: 'speak-now',
  items: [
    {
      year: 2010,
      month: 10,
      category: 'business',
      title: 'Speak Now sells over a million copies in a single week',
      snippet:
        "1,047,000 copies in week one — the first album since Lil Wayne's Tha Carter III to cross a million in its opening week.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/8/8f/Taylor_Swift_-_Speak_Now_cover.png',
      moment: {
        context:
          "It debuted at No. 1 on both the Billboard 200 and the Country Albums chart, and The Boot clocked the 1,047,000-copy week as the best first week for any album since 50 Cent's The Massacre in 2005 — and the biggest sales week by any female country artist since 1991.\n\nIt also made her just the fourth woman ever to sell a million copies in a single week, after Britney Spears, Whitney Houston, and Norah Jones. Grammy.com later framed the number and the no-co-writers credit line as the same statement — an album written 'entirely alone as a mic drop against critics,' with an opening week that nearly doubled what Fearless did.",
        sources: [
          {
            outlet: 'Grammy.com',
            url: 'https://www.grammy.com/news/taylor-swift-speak-now-taylors-version-legacy-songs-mine-dear-john-mean/',
          },
          { outlet: 'The Boot', url: 'https://theboot.com/taylor-swift-speak-now-sales-charts/' },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Taylor_Swift_-_Speak_Now_cover.png',
            credit: 'Big Machine Records',
            focalPoint: '62% 18%',
          },
          // Photo pass #762 run 25 (2026-07-18): no photographable "sales week"
          // event exists, so the second image is honest era context — the tour
          // production the million-copy week funded. Commons file page checked
          // this session (CC BY 2.0, author dephisticate); curl 200 image/jpeg;
          // Read-viewed: she performs from the tour's suspended balcony.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Taylor_Swift_-_Speak_Now_tour_2011.jpg/960px-Taylor_Swift_-_Speak_Now_tour_2011.jpg',
            credit: 'dephisticate / Wikimedia Commons (CC BY 2.0)',
            caption:
              "Performing from the Speak Now World Tour's flying balcony in Newark, July 2011 — the arena spectacle that record-setting week set up.",
            kind: 'archival',
            focalPoint: '47% 42%',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 10,
      day: 25,
      category: 'music',
      title: "Dear John's slow-burn reckoning",
      snippet: 'A slow-burning ballad about a 19-year-old narrator naming the damage after the fact.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Dear_John_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          "At six minutes and forty-three seconds, it's the longest, darkest thing on the album — a blues-inflected power ballad whose 19-year-old narrator finally asks, 'Don't you think I was too young to be messed with?' Swift said only that it was about someone who 'made my world very dark for a while,' and waved off the guessing game outright: 'How presumptuous! I never disclose who my songs are about.'\n\nOn the Speak Now World Tour she staged the bridge literally, with fireworks erupting overhead as she sang 'I'm shining like fireworks over your sad, empty town' — and in June 2023 she brought it back as an Eras Tour surprise song in Minneapolis. Critic Rob Sheffield called it 'a failed quasi-relationship, with no happy ending, no moral, no solution.'",
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Dear_John_(Taylor_Swift_song)' },
          {
            outlet: 'Grammy.com',
            url: 'https://www.grammy.com/news/taylor-swift-speak-now-taylors-version-legacy-songs-mine-dear-john-mean/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Taylor_Swift_2011crop.jpg',
            credit: 'Eva Rinaldi / Wikimedia Commons',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 10,
      day: 19,
      category: 'music',
      title: 'Mean, written straight at her critics',
      snippet: "Not a relationship song — this one's aimed straight at her critics.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Mean_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          "In her words: people who \"attack everything about a person\" instead of offering real feedback. It's also the most defiantly country track on the record — banjo-led bluegrass with fiddle, mandolin, and handclaps — and Grammy.com would later call it, flatly, 'a deliciously twangy clapback to critic Bob Lefsetz.'\n\nThe clapback worked on every level: it climbed to No. 11 on the Hot 100, sold over a million downloads within a year, and finished the arc at the 2012 Grammys, where it won Best Country Song and Best Country Solo Performance.",
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Mean_(song)' },
          {
            outlet: 'Grammy.com',
            url: 'https://www.grammy.com/news/taylor-swift-speak-now-taylors-version-legacy-songs-mine-dear-john-mean/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Taylor_Swift_Sydney.jpg',
            credit: 'Eva Rinaldi / Wikimedia Commons',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 10,
      day: 25,
      category: 'music',
      title: 'Innocent, a song written to Kanye West, not about him',
      snippet:
        'A year after the 2009 VMA interruption, she wrote him a song about forgiveness instead of anger.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Innocent_(Taylor_Swift_song)',
      thumbnailUrl:
        'https://assets2.cbsnewsstatic.com/hub/i/r/2010/09/12/99eee01f-a642-11e2-a3f0-029118418759/thumbnail/620x449/8e0c01f51a0436c5eb408696fefc290f/AP100912090147.jpg',
      moment: {
        context:
          'Her own framing, to New York magazine: she wanted to "write a song to him," not about him. She spent six months on it — far beyond her usual thirty-minute writing pace — and the 2010 VMA debut leaned straight into the history: the performance opened with footage of the previous year\'s interruption before she sang it seated with an acoustic guitar, finishing barefoot.\n\nShe told the Belfast Telegraph after: "I performed a song nobody had heard before, and I\'m proud of that. Because it was the right thing to say." Reception split hard — some critics heard an act of grace beyond her years, others "slams disguised as \'forgiveness\'" — which made it one of the most argued-over songs on the album.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Innocent_(Taylor_Swift_song)' },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-vmas-2010-innocent-lyrics-reflect-on-kanye-west-incident/',
          },
        ],
        photos: [
          {
            url: 'https://assets2.cbsnewsstatic.com/hub/i/r/2010/09/12/99eee01f-a642-11e2-a3f0-029118418759/thumbnail/620x449/8e0c01f51a0436c5eb408696fefc290f/AP100912090147.jpg',
            credit: 'AP Photo/Matt Sayles',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 10,
      day: 25,
      category: 'music',
      title: "Long Live, a love song to her band",
      snippet: '"The first love song that I\'ve written to my team" — a thank-you to the band and crew who built her career brick by brick.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Long_Live_(Taylor_Swift_song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Taylor_Swift_Speak_Now_-_Pittsburgh.jpg/500px-Taylor_Swift_Speak_Now_-_Pittsburgh.jpg',
      moment: {
        context:
          'It was inspired by a moment backstage with her band on the final night of the Fearless Tour in 2010, and it never really left her shows: debuted on an NBC Thanksgiving special the month the album dropped, it became the Speak Now World Tour\'s final pre-encore song, then resurfaced on the Red Tour, the 1989 World Tour, a reputation-era piano mashup, and multiple Eras Tour arrangements.\n\nRob Sheffield\'s Rolling Stone review said the album "peaks with \'Long Live,\' a ridiculously over-the-top prom anthem with all the epic girl-group swoon of the Ronettes or the Shirelles" — "the sort of prom song that could only come from an artist who chose to spend her high school years on a tour bus. Yet when Swift sings it, damn if you don\'t believe every word."',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Long_Live_(Taylor_Swift_song)' },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-album-reviews/speak-now-251367/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Taylor_Swift_Speak_Now_-_Pittsburgh.jpg/500px-Taylor_Swift_Speak_Now_-_Pittsburgh.jpg',
            credit: 'Eva Rinaldi / Wikimedia Commons',
          },
        ],
      },
    },
    {
      year: 2011,
      month: 11,
      day: 9,
      category: 'fashion',
      title: 'A dove-grey J. Mendel gown for her second Entertainer of the Year win',
      snippet:
        'A dove-grey J. Mendel gown with a billowing train, held up the whole walk to the stage for her second CMA Entertainer of the Year award.',
      sourceUrl: 'https://www.eonline.com/news/804943/taylor-swift-s-evolving-cma-awards-style-over-the-years',
      thumbnailUrl:
        'https://s.yimg.com/ny/api/res/1.2/ickryvH9sKcF7tDFtwxxbw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTk2MDtoPTE0NDA7Y2Y9d2VicA--/https://media.zenfs.com/en/insider_articles_922/7a2cc8fb3dc0f6c58c259f9ddd4d244f',
      moment: {
        context:
          "The gown was J. Mendel pre-fall 2011 — strapless, dove grey, with an extra-long train she gathered up in one hand for the whole walk to the stage.\n\nThe win itself was the bigger statement: it made her only the second female artist in CMA history, after Barbara Mandrell, to win Entertainer of the Year twice, closing out the Speak Now era's awards run at the top of country music's own room.",
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/804943/taylor-swift-s-evolving-cma-awards-style-over-the-years',
          },
          {
            outlet: 'Yahoo Entertainment (Insider)',
            url: 'https://www.yahoo.com/entertainment/outfits-taylor-swift-worn-cma-174205706.html',
          },
        ],
        photos: [
          {
            url: 'https://s.yimg.com/ny/api/res/1.2/ickryvH9sKcF7tDFtwxxbw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTk2MDtoPTE0NDA7Y2Y9d2VicA--/https://media.zenfs.com/en/insider_articles_922/7a2cc8fb3dc0f6c58c259f9ddd4d244f',
            credit: 'Jason Kempin/Getty Images',
          },
        ],
      },
    },
    {
      year: 2011,
      month: 2,
      day: 9,
      category: 'fashion',
      title: 'A gold Roberto Cavalli fringe dress for Sparks Fly, Mine, and The Story of Us',
      snippet:
        'A gold ombré sequin fringe mini and black knee-high boots — her go-to Speak Now Tour look for three of the album\'s songs.',
      sourceUrl: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Taylor_Swift_-_Speak_Now_World_Tour_Sydney_2012.jpg',
      moment: {
        context:
          "One dress, three songs: Femestella logs the Roberto Cavalli gold ombré sequin fringe mini as the tour's recurring look for 'Sparks Fly,' 'Mine,' and 'The Story of Us,' always paired with the same Everybody Fargo black knee-high boots.\n\nThat made it the workhorse of a show built around nine costume changes — while Susan Hilferty's custom chiffon gowns carried the fairy-tale numbers, the fringe was the up-tempo uniform, cut to catch arena light and movement.",
        sources: [
          { outlet: 'Femestella', url: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/' },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Speak_Now_World_Tour' },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Taylor_Swift_-_Speak_Now_World_Tour_Sydney_2012.jpg',
            credit: 'Eva Rinaldi / Wikimedia Commons',
          },
        ],
      },
    },
    {
      year: 2011,
      month: 2,
      day: 9,
      category: 'tour',
      title: 'The Speak Now World Tour opens in Singapore',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-sn-2", label: "World Tour begins", kind: "tour" },
      snippet:
        '8,964 fans at Singapore Indoor Stadium — the start of a 110-show tour across 19 territories, through March 18, 2012.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now_World_Tour',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Taylor_Swift_-_Enchanted_-_Speak_Now_WORLD_Tour_-_PARIS.jpg/500px-Taylor_Swift_-_Enchanted_-_Speak_Now_WORLD_Tour_-_PARIS.jpg',
      moment: {
        context:
          "The staging was pure Broadway ambition: nine costume changes, pyrotechnics, confetti, aerialists on trapezes, and a suspended balcony that descended over the crowd for the finale.\n\nFrom opening night at the Singapore Indoor Stadium, the production ran through Asia and Europe before the North American leg opened in Omaha that May — six US stadium dates included — and closed in Auckland on March 18, 2012. Announcing the run, Swift kept it simple: 'I'm so excited to go back out on tour again in 2011! The FEARLESS Tour was so much fun...'",
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Speak_Now_World_Tour' },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-announces-speak-now-world-tour-950374/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Taylor_Swift_-_Enchanted_-_Speak_Now_WORLD_Tour_-_PARIS.jpg/500px-Taylor_Swift_-_Enchanted_-_Speak_Now_WORLD_Tour_-_PARIS.jpg',
            credit: 'oouinouin / Wikimedia Commons (CC BY 2.0)',
            caption:
              "The tour's theatrical 'Enchanted' staging, photographed in Paris on March 17, 2011 — same production as the Singapore opener, a later night on the same first international leg.",
            kind: 'reference',
          },
        ],
      },
    },
    {
      year: 2012,
      month: 2,
      day: 12,
      category: 'business',
      title: 'Mean wins two Grammys the same night',
      snippet:
        "Best Country Song and Best Country Solo Performance at the 54th Grammys — performed live, banjo in hand.",
      sourceUrl: 'https://theboot.com/taylor-swift-grammys-2012/',
      thumbnailUrl: 'https://townsquare.media/site/623/files/2012/02/taylor-swift-456-021212.jpg?w=980&q=75',
      moment: {
        context:
          "Her reaction caught the full-circle absurdity of it: \"There's no feeling like writing a song about someone who hates you and is mean to you and makes your life miserable ... and then win the Grammy for it.\"\n\nShe performed the song live at the ceremony and told the room what the night meant — \"It's always gonna mean the world to me, the idea of getting to go to the Grammys\" — on an evening when Speak Now itself was also up for Best Country Album.",
        sources: [
          { outlet: 'The Boot', url: 'https://theboot.com/taylor-swift-grammys-2012/' },
          { outlet: 'Teen Vogue', url: 'https://www.teenvogue.com/story/best-taylor-swift-grammy-moments' },
        ],
        photos: [
          {
            url: 'https://townsquare.media/site/623/files/2012/02/taylor-swift-456-021212.jpg?w=980&q=75',
            credit: 'AP Photo/Matt Sayles',
            focalPoint: '52% 35%',
          },
          // Photo pass #762 run 25 (2026-07-18): the Grammy stage itself has no
          // usable photo on allowed hosts, so the second image is the banjo —
          // the instrument the hook is about — from the same weeks: Sydney,
          // March 9, 2012, 26 days after the ceremony. Commons file page checked
          // (CC BY-SA 2.0, Eva Rinaldi); curl 200 image/jpeg; Read-viewed
          // (banjo clearly in frame, honest caption names the song played).
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Taylor_Swift-Speak_Now_World_Tour_Sydney_-_Our_Song.jpg',
            credit: 'Eva Rinaldi / Wikimedia Commons (CC BY-SA 2.0)',
            caption:
              'Banjo in hand on the Speak Now World Tour in Sydney, March 2012 — weeks after the Grammy night — performing "Our Song".',
            kind: 'archival',
            focalPoint: '35% 22%',
          },
        ],
      },
    },

    // --- Fashion/photo depth pass (2026-07-04) ---
    {
      year: 2010,
      month: 11,
      day: 10,
      category: 'fashion',
      title: 'A red Monique Lhuillier gown at the 2010 CMA Awards',
      snippet:
        'A strapless red sweetheart gown with waist ruching and a thigh-high slit — a bolder red-carpet turn the same month Speak Now took over the charts.',
      sourceUrl: 'https://www.yahoo.com/entertainment/outfits-taylor-swift-worn-cma-174205706.html',
      thumbnailUrl: 'https://media.zenfs.com/en/insider_articles_922/a5afcd15ea4573043b3e2718c01fa859',
      moment: {
        context:
          "Designed by Monique Lhuillier — strapless with a sweetheart neckline, ruching at the waist, and a floor-length skirt slit to the thigh — and paired with diamond earrings. Insider's CMA retrospective files it as a classic rather than a showstopper, part of the same red-carpet arc that ran through her 2011 dove-grey J. Mendel Entertainer of the Year gown.\n\nThe night carried more weight than the dress: at that November 10, 2010 ceremony at Nashville's Bridgestone Arena, she performed 'Back to December' — the stripped-back staging the Los Angeles Times graded a B+, noting she 'kept it simple' and 'rose to the occasion.' Five days later, the apology ballad went to country radio as Speak Now's second single.",
        sources: [
          {
            outlet: 'Yahoo Entertainment (Insider)',
            url: 'https://www.yahoo.com/entertainment/outfits-taylor-swift-worn-cma-174205706.html',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Back_to_December' },
        ],
        photos: [
          {
            url: 'https://media.zenfs.com/en/insider_articles_922/a5afcd15ea4573043b3e2718c01fa859',
            credit: 'Larry Busacca/Getty Images',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 11,
      day: 21,
      category: 'fashion',
      title: 'Blunt bangs debut at the 2010 American Music Awards',
      snippet:
        'She chopped her hair into blunt, eyelash-skimming bangs at the AMAs — a look that would become a recurring signature over the next decade.',
      sourceUrl: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/',
      thumbnailUrl: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2022/11/Depositphotos_79322072_XL.jpg',
      moment: {
        context:
          'Paired that night with a beaded Collette Dinnigan mini dress. A departure from the loose curls she\'d worn since 2006 — Bustle marks it as the moment she "chopped her blonde strands into blunt, eyelash-skimming bangs that would evolve over time — and eventually become her new signature," officially trading the Fearless-era voluminous curls for a sleeker look.\n\nThe fringe stuck, evolving over the following years into the look she\'s now known for — arguably the most durable style decision of her career.',
        sources: [
          { outlet: 'Femestella', url: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/' },
          { outlet: 'Bustle', url: 'https://www.bustle.com/beauty/taylor-swift-bangs' },
        ],
        photos: [
          {
            url: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2022/11/Depositphotos_79322072_XL.jpg',
            credit: 'Femestella',
          },
        ],
      },
    },
    {
      year: 2011,
      month: 1,
      day: 5,
      category: 'fashion',
      title: "A curly updo and J. Mendel pink chiffon at the People's Choice Awards",
      snippet:
        "A loose curly updo with a J. Mendel pink chiffon dress, Prada heels, and Neil Lane jewels — peak Speak Now-era red carpet styling.",
      sourceUrl: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/',
      thumbnailUrl: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2022/11/Depositphotos_12961917_XL.jpg',
      moment: {
        context:
          "The look was peak Speak Now-era red carpet: a pink J. Mendel chiffon dress with a loose, curly updo, Prada heels, and Neil Lane jewels — soft, romantic styling that matched the album's fairy-tale visual register.\n\nShe wore it to the 37th People's Choice Awards at the Nokia Theatre in Los Angeles on January 5, 2011, where she won Favorite Country Artist — a fan-voted trophy landing barely two months into the album's chart run. She was also nominated for Favorite Female Artist that night, a category that went to Katy Perry.",
        sources: [
          { outlet: 'Femestella', url: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/' },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/37th_People%27s_Choice_Awards' },
        ],
        photos: [
          {
            url: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2022/11/Depositphotos_12961917_XL.jpg',
            credit: 'Femestella',
          },
        ],
      },
    },
    {
      year: 2011,
      month: 2,
      day: 9,
      category: 'fashion',
      title: "Susan Hilferty's purple chiffon halter dress becomes the tour's signature",
      snippet:
        "A custom purple chiffon halter gown by costume designer Susan Hilferty — worn for the title track, 'Fearless,' 'Last Kiss,' and more across the Speak Now World Tour.",
      sourceUrl: 'https://susanhilferty.com/shows/taylor-swift-speak-now-world-tour-57/',
      thumbnailUrl:
        'https://zpllkavmkkjnxpedhotv.supabase.co/storage/v1/render/image/public/images/shows/taylor-swift-speak-now-world-tour-57/Taylor-Swift-taylor-swift-newark-purple-04.webp',
      moment: {
        context:
          "Hilferty is credited as costume designer on the Speak Now World Tour; the purple halter became one of the era's most recognizable looks, reused across multiple songs in the setlist.\n\nHer studio's own archive of the tour pairs the original costume sketches with performance photographs — a rare look at a stage wardrobe built by a theatrical costume designer rather than assembled by a stylist, which is exactly why the show's dresses read like characters. Femestella calls the purple chiffon halter 'perhaps one of her most iconic looks' from the tour.",
        sources: [
          { outlet: 'Susan Hilferty (official)', url: 'https://susanhilferty.com/shows/taylor-swift-speak-now-world-tour-57/' },
          { outlet: 'Femestella', url: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/' },
        ],
        photos: [
          {
            url: 'https://zpllkavmkkjnxpedhotv.supabase.co/storage/v1/render/image/public/images/shows/taylor-swift-speak-now-world-tour-57/Taylor-Swift-taylor-swift-newark-purple-04.webp',
            credit: 'Susan Hilferty (costume designer)',
          },
        ],
      },
    },
    {
      year: 2011,
      month: 2,
      day: 9,
      category: 'fashion',
      title: "A white lace Alice + Olivia dress for 'Mean' on the Speak Now Tour",
      snippet:
        "A custom white lace Alice + Olivia dress, worn during 'Mean' performances across the Speak Now World Tour.",
      sourceUrl: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/',
      thumbnailUrl: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2022/11/6966861157_2ca0cc3599_o.jpg',
      moment: {
        context:
          "Femestella notes the custom white lace dress 'took the stage any time Taylor Swift sang' the song on tour.\n\nThe costume matched the number's register: 'Mean' was the banjo-led, fiddle-and-mandolin track critics tagged as the most country thing on Speak Now, and mid-tour the underdog single became a double Grammy winner — Best Country Song and Best Country Solo Performance, both won in February 2012 while the tour was still on the road.",
        sources: [
          { outlet: 'Femestella', url: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/' },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Mean_(song)' },
        ],
        photos: [
          {
            url: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2022/11/6966861157_2ca0cc3599_o.jpg',
            credit: 'Femestella',
          },
        ],
      },
    },
    {
      year: 2011,
      month: 2,
      day: 9,
      category: 'fashion',
      title: "A red sequin Theia slip dress for 'Better Than Revenge'",
      snippet:
        "A Theia red sequin slip dress with black knee-high boots, worn for the tour's 'Better Than Revenge' performances.",
      sourceUrl: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/8/82/Taylor_Swift_Speak_Now_Tour_%286820796178%29.jpg',
      moment: {
        context:
          "Femestella IDs it as a Theia red sequin slip, worn with the same Everybody Fargo black knee-high boots she paired with the gold Cavalli fringe — the tour's up-tempo footwear of choice.\n\nIn a show of nine costume changes otherwise dominated by chiffon and fairy-tale ballgowns, the slinky red sequin for the album's angriest song was the deliberate exception.",
        sources: [
          { outlet: 'Femestella', url: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/' },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Speak_Now_World_Tour' },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Taylor_Swift_Speak_Now_Tour_%286820796178%29.jpg',
            credit: 'Eva Rinaldi / Wikimedia Commons',
          },
        ],
      },
    },
    {
      year: 2011,
      month: 2,
      day: 9,
      category: 'fashion',
      title: "A red chiffon Susan Hilferty dress closes out 'Haunted'",
      snippet:
        "Another Susan Hilferty custom piece — a red chiffon midi-length dress worn for the tour's 'Haunted' performances.",
      sourceUrl: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/',
      thumbnailUrl:
        'https://i0.wp.com/www.femestella.com/wp-content/uploads/2022/11/Taylor_Swift_-_Haunted_-_Speak_Now_WORLD_Tour_in_Pittsburgh.jpg',
      moment: {
        context:
          "Hilferty — the tour's credited costume designer, whose studio archive pairs her original sketches with performance shots — built 'Haunted' its own red chiffon midi, the darker counterpart to the purple halter gown she designed for the show's fairy-tale stretch.\n\nTwo custom pieces from the same hand doing opposite jobs: one dress for the era's romance, one for its ghosts.",
        sources: [
          { outlet: 'Femestella', url: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/' },
          { outlet: 'Susan Hilferty (official)', url: 'https://susanhilferty.com/shows/taylor-swift-speak-now-world-tour-57/' },
        ],
        photos: [
          {
            url: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2022/11/Taylor_Swift_-_Haunted_-_Speak_Now_WORLD_Tour_in_Pittsburgh.jpg',
            credit: 'Femestella',
          },
        ],
      },
    },
    {
      year: 2011,
      month: 5,
      day: 22,
      category: 'fashion',
      title: 'A pink Elie Saab sequin gown at the Billboard Music Awards',
      snippet:
        'A strapless Elie Saab gown covered top to bottom in pink sequins, with side-swept curls — a glamorous but still youthful red-carpet look.',
      sourceUrl: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/',
      thumbnailUrl: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2022/11/Depositphotos_12995401_XL.jpg',
      moment: {
        context:
          "Worn May 22, 2011 — a night she left with two trophies, including the country artist award, presented by Train's Pat Monahan, over a field of Lady Antebellum, Jason Aldean, Zac Brown Band, and Kenny Chesney.\n\nAccepting, she reached back to the ceremonies she grew up watching: 'I used to watch the Billboard Awards and see my heroes like Shania Twain and Faith Hill win these, and now... I'm just having the best time doing this.' Femestella logs the gown as Elie Saab, worn with Lorraine Schwartz jewelry.",
        sources: [
          { outlet: 'Femestella', url: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/' },
          {
            outlet: 'Taste of Country',
            url: 'https://tasteofcountry.com/taylor-swift-billboard-music-awards-2011-country-artist-of-the-year/',
          },
        ],
        photos: [
          {
            url: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2022/11/Depositphotos_12995401_XL.jpg',
            credit: 'Femestella',
          },
        ],
      },
    },
    {
      year: 2011,
      month: 11,
      day: 20,
      category: 'fashion',
      title: 'A gold Reem Acra gown and side ponytail at the American Music Awards',
      snippet:
        'A sparkly gold strapless Reem Acra beaded gown paired with a side ponytail at the 2011 AMAs, where she was up for Artist of the Year.',
      sourceUrl: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/',
      thumbnailUrl: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2022/11/Depositphotos_13015212_XL.jpg',
      moment: {
        context:
          'She didn\'t just show up nominated — she swept all three of her categories that night: Favorite Country Female Artist, Favorite Country Album for Speak Now, and Artist of the Year, her second time taking the show\'s top prize, over a field that included Adele, Lady Gaga, and Katy Perry.\n\nHer reaction onstage: "This is so crazy!" The gold beaded Reem Acra and side ponytail made it one of the era\'s most remembered award-show looks.',
        sources: [
          { outlet: 'Femestella', url: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/' },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/american-music-awards-2011-taylor-swift-wins-artist-of-the-year/',
          },
        ],
        photos: [
          {
            url: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2022/11/Depositphotos_13015212_XL.jpg',
            credit: 'Femestella',
          },
        ],
      },
    },

    // --- Fashion/photo depth pass #2 (2026-07-04) ---
    {
      year: 2010,
      month: 10,
      day: 25,
      category: 'fashion',
      title: 'A purple ombre Reem Acra gown on the Speak Now album cover',
      snippet:
        'The album cover itself is a fashion moment: a strapless purple ombre chiffon gown by Reem Acra, fading from deep violet to pale lilac.',
      sourceUrl: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/',
      thumbnailUrl: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2022/11/Taylor_Swift_-_Speak_Now_cover.jpg',
      moment: {
        context:
          'The Reem Acra gown for the Speak Now cover shoot set the visual identity for the whole era: strapless purple ombre chiffon fading from deep violet to pale lilac, photographed mid-twirl with curled hair and red lipstick.\n\nThe purple was less a dress choice than a thesis — it became the era\'s color outright. The Speak Now World Tour picked the thread straight up, with costume designer Susan Hilferty building a custom purple chiffon halter gown that became the show\'s signature look. The image she twirled in on the cover was, in effect, the version of the era every arena later got.',
        sources: [
          { outlet: 'Femestella', url: 'https://www.femestella.com/taylor-swift-iconic-outfits-speak-now-era/' },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Speak_Now' },
        ],
        photos: [
          {
            url: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2022/11/Taylor_Swift_-_Speak_Now_cover.jpg',
            credit: 'Reem Acra / Big Machine Records',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 11,
      category: 'fashion',
      title: 'Glamour puts her on its November 2010 cover',
      snippet:
        "A Glamour magazine cover timed to Speak Now's release, part of the press run that reintroduced her post-bangs, post-breakout look to a wider readership.",
      sourceUrl: 'https://catherineangiel.com/blogs/editorial/glamour-magazine-cover-november-2010-taylor-swift',
      thumbnailUrl:
        'https://cdn.shopify.com/s/files/1/0234/1539/files/Glamour_November_2010_-_Cover_-Taylor_Swift_large.JPG',
      moment: {
        context:
          "The November 2010 issue put her on the cover in a shimmery light-blue sequined look, and it hit newsstands October 12 — thirteen days before Speak Now itself arrived — making it one of the first big glossy covers of the album's press cycle.\n\nInside, the interview ran through the new album, her songwriting reflex — 'everything that happens to me gets put into a song' — and what she said she actually looked for in a relationship: 'character and honesty and trust' over status. She also confirmed she'd stayed friends with Taylor Lautner, the ex that Speak Now's 'Back to December' would soon be traced back to.",
        sources: [
          {
            outlet: 'Catherine Angiel (archival)',
            url: 'https://catherineangiel.com/blogs/editorial/glamour-magazine-cover-november-2010-taylor-swift',
          },
          { outlet: 'The Boot', url: 'https://theboot.com/taylor-swift-glamour-magazine-interview/' },
        ],
        photos: [
          {
            url: 'https://cdn.shopify.com/s/files/1/0234/1539/files/Glamour_November_2010_-_Cover_-Taylor_Swift_large.JPG',
            credit: 'Glamour',
          },
        ],
      },
    },
    {
      year: 2011,
      month: 2,
      day: 27,
      category: 'fashion',
      title: 'A gold Zuhair Murad minidress at the Vanity Fair Oscar party',
      snippet:
        'A beaded gold strapless Zuhair Murad minidress with a corset back, gold Jimmy Choo platform sandals and clutch, and pinned-back hair at the Vanity Fair Oscars after-party.',
      sourceUrl: 'https://tasteofcountry.com/taylor-swift-vanity-fair-oscars-party-pictures/',
      // Image-fix pass (2026-07-10): townsquare.media URL now serves a dead 'Taste of Country' logo
      // placeholder (curl-verified content-type image/jpeg but pixels show the logo, not Taylor).
      // Replaced with a verified Getty Images photo (id 109489184, HTTP 200, image/jpeg, visually
      // confirmed: Taylor in the gold beaded strapless Zuhair Murad minidress at the 2011 Vanity
      // Fair Oscar Party, Sunset Tower, Feb 27 2011).
      thumbnailUrl: 'https://media.gettyimages.com/id/109489184/photo/west-hollywood-ca-singer-taylor-swift-arrives-at-the-vanity-fair-oscar-party-at-sunset-tower.jpg?s=612x612&w=0&k=20&c=LYkicour3elj3xJhOZJvSJRNzd6pLXo7qpJM_9WWRM8=',
      moment: {
        context:
          'Worn February 27, 2011 at the Sunset Tower Hotel party, one of her earliest red-carpet turns in Zuhair Murad — a designer she\'d return to repeatedly through 2012.\n\nShe skipped the Academy Awards ceremony itself and went straight to the after-party, where Taste of Country reported she spent the night catching up with friends Emma Stone and Selena Gomez. The beaded gold minidress — corset back, matching gold platforms and clutch — previewed a designer relationship with a payoff already scheduled: a year later she walked the 2012 Grammys red carpet in gold Zuhair Murad Couture on the night "Mean" won twice.',
        sources: [
          { outlet: 'Taste of Country', url: 'https://tasteofcountry.com/taylor-swift-vanity-fair-oscars-party-pictures/' },
        ],
        photos: [
          {
            // Image-fix pass (2026-07-10): old townsquare.media URL was a dead hotlink serving a
            // 'Taste of Country' logo placeholder, not a photo. Replaced with Getty Images id
            // 109489184 (curl-verified HTTP 200 image/jpeg; Read-viewed: matches caption exactly —
            // gold beaded strapless Zuhair Murad minidress, Vanity Fair Oscar Party red carpet).
            url: 'https://media.gettyimages.com/id/109489184/photo/west-hollywood-ca-singer-taylor-swift-arrives-at-the-vanity-fair-oscar-party-at-sunset-tower.jpg?s=612x612&w=0&k=20&c=LYkicour3elj3xJhOZJvSJRNzd6pLXo7qpJM_9WWRM8=',
            credit: 'Jon Kopaloff/Getty Images',
            caption: 'Arriving at the Vanity Fair Oscar Party at Sunset Tower, February 27, 2011, in the gold Zuhair Murad minidress.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2011,
      month: 8,
      day: 7,
      category: 'fashion',
      title: 'A Marilyn Monroe-inspired white halter dress at the Teen Choice Awards',
      snippet:
        "A white halterneck dress by Rafael Cennamo, styled with a Ranjana Khan belt, Neil Lane jewelry, and Fendi shoes for a deliberately Marilyn Monroe-inspired look.",
      sourceUrl: 'https://www.aceshowbiz.com/news/view/00042706.html',
      // Image-fix pass (2026-07-10): old aceshowbiz 320x395 'preview' thumbnail was a tight
      // head-and-shoulders crop that barely showed the halter strap. Replaced with a verified Getty
      // Images full-length photo (id 139353810, HTTP 200, image/jpeg, visually confirmed: the white
      // halter dress with belted waist, full skirt, at the 2011 Teen Choice Awards red carpet).
      thumbnailUrl: 'https://media.gettyimages.com/id/139353810/photo/universal-city-ca-taylor-swift-arrives-at-teen-choice-2011-at-the-gibson-amphitheatre-on.jpg?s=612x612&w=0&k=20&c=ikjub89NrsPL5br_63iqmNw_mXtseHJbQAYLDJEjpo8=',
      moment: {
        context:
          "The look was a deliberate Old-Hollywood homage: a white halterneck dress by Rafael Cennamo, styled with a Ranjana Khan belt, Neil Lane jewelry, and Fendi shoes — Marilyn Monroe by way of a 21-year-old country-pop star, worn with her hair pulled back in a ponytail.\n\nThe occasion earned the reference: at the August 7, 2011 show at Universal City's Gibson Amphitheatre she received the Ultimate Choice Award, the show's honorary top prize. She also won five voted categories outright that night — Choice Female Artist, both country awards ('Mean' took Country Track), Break-Up Song for 'Back to December,' and Red Carpet Fashion Icon ('Mine' was only a nominee for Choice Love Song, which went to Selena Gomez & the Scene) — plus the Ultimate Choice Award, a near-sweep powered by Speak Now's singles run.",
        sources: [
          { outlet: 'AceShowbiz', url: 'https://www.aceshowbiz.com/news/view/00042706.html' },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/2011_Teen_Choice_Awards' },
        ],
        photos: [
          {
            // Image-fix pass (2026-07-10): old aceshowbiz preview crop showed only a sliver of the
            // halter neckline at low res. Replaced with Getty Images id 139353810 (curl-verified
            // HTTP 200 image/jpeg; Read-viewed: full-length shot clearly showing the white halter
            // dress with jeweled belt at the 2011 Teen Choice Awards).
            url: 'https://media.gettyimages.com/id/139353810/photo/universal-city-ca-taylor-swift-arrives-at-teen-choice-2011-at-the-gibson-amphitheatre-on.jpg?s=612x612&w=0&k=20&c=ikjub89NrsPL5br_63iqmNw_mXtseHJbQAYLDJEjpo8=',
            credit: 'Gregg DeGuire/FilmMagic',
            caption: 'Arriving at the 2011 Teen Choice Awards in the Marilyn Monroe-inspired white halter dress.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2012,
      month: 1,
      day: 24,
      category: 'fashion',
      title: 'Her first Vogue cover, shot by Mario Testino',
      snippet:
        'Bohemian styling by fashion editor Tonne Goodman, in pieces from Rodarte, Jil Sander, and Rag & Bone, for the February 2012 issue titled "The Single Life" — her debut Vogue cover.',
      sourceUrl: 'https://www.fashiongonerogue.com/taylor-swift-mario-testino-vogue-february-2012/',
      thumbnailUrl: 'https://fashiongonerogue.com/wp-content/uploads/igr/preview/01/taylor_swift1.jpg',
      moment: {
        context:
          "Her debut American Vogue cover — the February 2012 issue, cover line 'The Single Life' — hit newsstands January 24, 2012, shot by Mario Testino with styling by Vogue fashion editor Tonne Goodman.\n\nGoodman built the shoot around a loose, bohemian wardrobe rather than red-carpet gowns, pulling pieces from Rodarte, Jil Sander, and Rag & Bone — a deliberate image reset in the closing months of the Speak Now era, trading the fairy-tale ballgowns of the tour for fashion-editorial ease just as she was writing what would become Red.",
        sources: [
          {
            outlet: 'Fashion Gone Rogue',
            url: 'https://www.fashiongonerogue.com/taylor-swift-mario-testino-vogue-february-2012/',
          },
        ],
        photos: [
          {
            url: 'https://fashiongonerogue.com/wp-content/uploads/igr/preview/01/taylor_swift1.jpg',
            credit: 'Mario Testino / Vogue US',
          },
        ],
      },
    },
    {
      year: 2012,
      month: 2,
      day: 12,
      category: 'fashion',
      title: 'A gold Zuhair Murad Couture gown on the 2012 Grammys red carpet',
      snippet:
        'A gold Zuhair Murad Couture gown with a Mandarin collar, heart-shaped cutout, and mermaid skirt with a short train — worn on the red carpet before her banjo-driven "Mean" performance.',
      sourceUrl: 'https://styledarlingdaily.com/2012/02/15/red-carpet-review-the-best-wild-looks-from-the-2012-grammys-red-carpet/taylor-swift-in-a-gold-mermaid-zuhair-murad-gown/',
      thumbnailUrl:
        'https://styledarlingdaily.com/wp-content/uploads/2012/02/taylor-swift-in-a-gold-mermaid-zuhair-murad-gown.jpg',
      moment: {
        context:
          'Pulled from Zuhair Murad\'s haute couture line — a gold gown with a Mandarin collar, heart-shaped cutout, and mermaid skirt trailing a short train — it was her second gold Murad inside a year, after the Vanity Fair Oscar-party minidress the previous February.\n\nThe night made the dress a footnote: "Mean" won Best Country Song and Best Country Solo Performance, and she performed it live at the ceremony, banjo in hand, altering a lyric mid-song to reference winning at the Grammys — closing the loop on a track written straight back at her critics.',
        sources: [
          {
            outlet: 'Style Darling Daily',
            url: 'https://styledarlingdaily.com/2012/02/15/red-carpet-review-the-best-wild-looks-from-the-2012-grammys-red-carpet/taylor-swift-in-a-gold-mermaid-zuhair-murad-gown/',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Mean_(song)' },
        ],
        photos: [
          {
            url: 'https://styledarlingdaily.com/wp-content/uploads/2012/02/taylor-swift-in-a-gold-mermaid-zuhair-murad-gown.jpg',
            credit: 'Style Darling Daily',
          },
        ],
      },
    },

    // --- Sightings pass (2026-07-05) ---
    {
      year: 2010,
      month: 10,
      day: 27,
      category: 'sighting',
      title: 'A surprise JetBlue concert for travelers at JFK',
      snippet:
        "Two days after Speak Now hit shelves, she played a surprise set for travelers in JetBlue's Terminal 5 lounge — no tickets sold, just whoever happened to be flying that day.",
      sourceUrl: 'https://archive.longislandpress.com/2010/10/28/taylor-swift-performs-at-jfk-airport-photos/',
      thumbnailUrl: 'https://archive.longislandpress.com/wp-content/uploads/2010/10/swift.jpg?w=358',
      moment: {
        context:
          "Held October 27, 2010 as part of JetBlue's 'Live From T5' concert series at JFK Airport, the pop-up show happened past security, in the terminal's Marketplace — only passengers already ticketed out of that terminal could catch it, and no tickets were ever sold. She played selections from Speak Now, released two days earlier.\n\nThe airport set was only half the stunt: afterward she boarded a chartered JetBlue 'Flight Across America' to Los Angeles and performed again mid-flight. The Live From T5 series had launched in 2009, and JetBlue's 2010 lineup put her alongside Sarah McLachlan and Daughtry — though neither of them arrived two days removed from the industry's biggest sales week in five years.",
        sources: [
          {
            outlet: 'Long Island Press',
            url: 'https://archive.longislandpress.com/2010/10/28/taylor-swift-performs-at-jfk-airport-photos/',
          },
          {
            outlet: 'PR Newswire (JetBlue)',
            url: 'https://www.prnewswire.com/news-releases/taylor-swift-to-perform-at-jetblue-airways-jfk-terminal-5-as-part-of-live-from-t5-concert-series-105443353.html',
          },
        ],
        photos: [
          {
            url: 'https://archive.longislandpress.com/wp-content/uploads/2010/10/swift.jpg?w=358',
            credit: 'Kevin Kane/FilmMagic',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 11,
      day: 25,
      category: 'sighting',
      title: 'A Thanksgiving-morning coffee run with Jake Gyllenhaal',
      snippet:
        "She and rumored boyfriend Jake Gyllenhaal stopped into Gorilla Coffee in Brooklyn's Park Slope on Thanksgiving morning, asking an employee to help pick out beans before ordering lattes.",
      sourceUrl: 'https://www.justjared.com/2010/11/25/taylor-swift-jake-gyllenhaal-thanksgiving-in-brooklyn/',
      // Image-fix pass (2026-07-10): old cdn01.justjared.com URL was a 300x300 two-panel collage
      // with a visible 'JUST JARED' watermark and no disclosure caption on this entry. Replaced with
      // a cleaner, non-watermarked, higher-res CBS News editorial composite (still two file photos,
      // now honestly captioned as such) — curl-verified HTTP 200 image/jpeg, Read-viewed.
      thumbnailUrl:
        'https://assets1.cbsnewsstatic.com/hub/i/r/2010/10/27/43706a70-a643-11e2-a3f0-029118418759/thumbnail/620x465/dd9752d17c8aaecefe080fa1a6f4c4e0/Swift-Gyllenhaal.jpg',
      moment: {
        context:
          'A witness told Just Jared the pair "asked one of the coffee shop employees for help picking out beans" and "both seemed super nice" before ordering lattes on November 25, 2010.\n\nGyllenhaal\'s sister Maggie lives in the Park Slope neighborhood, making it a family-adjacent holiday visit. The outing — and the scarf fans believe she left at Maggie Gyllenhaal\'s nearby home around this time — became a touchstone after "All Too Well" referenced a scarf left at "your sister\'s house" two years later.',
        sources: [
          {
            outlet: 'Just Jared',
            url: 'https://www.justjared.com/2010/11/25/taylor-swift-jake-gyllenhaal-thanksgiving-in-brooklyn/',
          },
        ],
        photos: [
          {
            // Image-fix pass (2026-07-10): old justjared.com collage carried a watermark, was
            // 300x300, and (unlike the other slots reusing this image) had no disclosure caption.
            // Replaced with a non-watermarked, higher-res CBS News two-photo composite (curl-verified
            // HTTP 200 image/jpeg; Read-viewed: clean side-by-side of Taylor and Jake, captioned
            // honestly below as file photos, not the coffee run itself).
            url: 'https://assets1.cbsnewsstatic.com/hub/i/r/2010/10/27/43706a70-a643-11e2-a3f0-029118418759/thumbnail/620x465/dd9752d17c8aaecefe080fa1a6f4c4e0/Swift-Gyllenhaal.jpg',
            credit: 'Getty Images (via CBS News)',
            caption:
              "Side-by-side file photos of the two — not the coffee run itself, which produced few clean photos.",
            kind: 'reference',
          },
        ],
      },
    },
    {
      year: 2011,
      month: 4,
      day: 4,
      category: 'sighting',
      title: 'An Anthropologie run the morning after her first ACM Entertainer of the Year win',
      snippet:
        'Chatting on her cell phone while browsing racks at an Anthropologie in Beverly Hills — less than a day after her first Entertainer of the Year win at the ACMs.',
      sourceUrl: 'https://www.justjared.com/photo-gallery/2532939/taylor-swift-anthropologie-11/',
      thumbnailUrl:
        'https://jj-justjared-media.s3.us-east-1.amazonaws.com/wp-content/uploads/2011/04/swift-anthropologie/taylor-swift-anthropologie-11.jpg',
      moment: {
        context:
          'Photographed April 4, 2011 carrying a Ralph Lauren Collection crossbody bag. The night before, she\'d performed new single "Mean" and picked up the Entertainer of the Year trophy at the 2011 Academy of Country Music Awards in Las Vegas.\n\nThat award — her first Entertainer win from the ACMs, and a fan-voted one — had left her visibly stunned at the MGM Grand: "This is the first time that I\'ve ever won this and I\'m just losing my mind," she told the room. The morning-after errand run, phone to her ear at the clothing racks, caught the era\'s whiplash in a single frame: country music\'s newly crowned top entertainer, browsing a Beverly Hills boutique like any other 21-year-old.',
        sources: [
          {
            outlet: 'Just Jared',
            url: 'https://www.justjared.com/2011/04/06/taylor-swift-anthropologie-after-acms/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-wins-entertainer-of-the-year-at-acm-awards-472222/',
          },
        ],
        photos: [
          {
            url: 'https://jj-justjared-media.s3.us-east-1.amazonaws.com/wp-content/uploads/2011/04/swift-anthropologie/taylor-swift-anthropologie-11.jpg',
            credit: 'WENN',
          },
        ],
      },
    },
    {
      year: 2012,
      month: 3,
      day: 30,
      category: 'sighting',
      title: 'Dinner with mom Andrea (and Dianna Agron, just out of frame) at Il Pastaio',
      snippet:
        'Stopping to say hi to a fan on her way out of Il Pastaio in Beverly Hills after dinner with her mom — and, unpictured that night, new friend Dianna Agron.',
      sourceUrl: 'https://www.justjaredjr.com/2012/03/31/taylor-swift-il-pastaio-pretty/',
      // Image-fix pass (2026-07-10 retry): swapped the flagged 300x200 two-panel
      // headline collage (cdn01.justjaredjr.com) for a single full-resolution frame
      // from the same Just Jared Jr. gallery (816x1222, credited INFdaily) — Taylor
      // in the yellow dress bending to greet a young fan inside Il Pastaio, matching
      // this moment's snippet. Verified via curl (200 OK, image/jpeg) and visual
      // inspection; not a collage/watermark-junk image. Source gallery:
      // https://www.justjaredjr.com/photo-gallery/466473/taylor-swift-il-pastaio-01/
      thumbnailUrl:
        'https://jj-justjaredjr-media.s3.us-east-1.amazonaws.com/wp-content/uploads/2012/03/taylor-pastaio/taylor-swift-il-pastaio-01.JPG',
      moment: {
        context:
          "Photographed March 30, 2012 in Beverly Hills; Just Jared Jr. reported she'd eaten alongside mom Andrea and \"good friend Dianna Agron (not pictured).\"\n\nSwift and the Glee star had grown close that year while Swift was recording Red between tour dates. The next day, Swift received Nickelodeon's Big Help Award from Michelle Obama at the Kids' Choice Awards.",
        sources: [
          {
            outlet: 'Just Jared Jr.',
            url: 'https://www.justjaredjr.com/2012/03/31/taylor-swift-il-pastaio-pretty/',
          },
        ],
        photos: [
          {
            url: 'https://jj-justjaredjr-media.s3.us-east-1.amazonaws.com/wp-content/uploads/2012/03/taylor-pastaio/taylor-swift-il-pastaio-01.JPG',
            credit: 'INFdaily',
          },
        ],
      },
    },
    {
      year: 2012,
      month: 8,
      category: 'sighting',
      title: 'Wading through the surf with Conor Kennedy on Cape Cod',
      snippet:
        'Hand in hand in the shallows off Cape Cod in a red polka-dot bikini — the most photographed stretch of her brief summer romance with Conor Kennedy.',
      sourceUrl: 'https://www.eonline.com/photos/6573/taylor-swift-conor-kennedy-romance-rewind',
      thumbnailUrl: 'https://akns-images.eonline.com/eol_images/Entire_Site/2012719/634.taylor.cm.81912_copy.jpg',
      moment: {
        context:
          "By mid-August 2012 the two were photographed wading and embracing in the water off the Kennedy family's stretch of Cape Cod, part of a summer Swift spent largely at the Kennedys' Hyannis Port compound after she and Conor — RFK's 18-year-old grandson — were first linked that July.\n\nDays later they were photographed strolling Hyannis Port and joining his family for outdoor volleyball.",
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/photos/6573/taylor-swift-conor-kennedy-romance-rewind',
          },
        ],
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2012719/634.taylor.cm.81912_copy.jpg',
            credit: 'Paul Adao/INFphoto.com',
          },
        ],
      },
    },
    {
      year: 2012,
      month: 8,
      day: 19,
      category: 'sighting',
      title: "A quiet visit to Mary Kennedy's gravesite",
      snippet:
        "On August 19, 2012, Taylor joined Conor Kennedy at his mother Mary Richardson Kennedy's gravesite — one of the last photographed moments of their summer romance.",
      sourceUrl: 'https://www.eonline.com/photos/6573/taylor-swift-conor-kennedy-romance-rewind',
      thumbnailUrl:
        'https://akns-images.eonline.com/eol_images/Entire_Site/2012722/634.ConorKennedy.TaylorSwift.081912.jpeg',
      moment: {
        context:
          "Mary Richardson Kennedy had died in May 2012; reports at the time said Swift accompanied Conor to the grave and helped clear overgrown brush from the site. It's remembered as one of the final documented moments of the two together — the relationship reportedly ended by October.\n\nE! Online's account had her in a floral pink dress and black sunglasses, joined by Kennedy family and friends for what amounted to an impromptu memorial. It landed just days after she'd attended a Kennedy cousin's wedding with Conor — the appearance that briefly spawned a 'wedding crash' tabloid story E! itself predicted would blow over — and in hindsight it reads as the quiet close of the summer the tabloids couldn't get enough of.",
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/photos/6573/taylor-swift-conor-kennedy-romance-rewind',
          },
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/340153/taylor-swift-bonds-with-conor-kennedy-s-family-at-graveyard-before-wedding-drama',
          },
        ],
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2012722/634.ConorKennedy.TaylorSwift.081912.jpeg',
            credit: 'Paul Adao/INFphoto.com',
          },
        ],
      },
    },

    // --- Music/business depth pass (2026-07-05) ---
    {
      year: 2010,
      month: 10,
      day: 25,
      category: 'music',
      title: "Enchanted was almost the album's title, and hid a coded name in the liner notes",
      snippet:
        "She wrote 'Enchanted' about a man she'd just met in New York, borrowed his own word \"wonderstruck\" for the chorus, and hid \"A-D-A-M\" in the liner notes.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Enchanted_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift wrote "Enchanted" about a man she was infatuated with after meeting him in person in New York City, deliberately using the word "wonderstruck" because he\'d used it in an email to her after they met. The album booklet\'s hidden-message code for the song reads "A-D-A-M." Media speculation pointed to Owl City\'s Adam Young; he responded on his website in February 2011 confirming his own feelings and posted a cover with rewritten lyrics ("Taylor I was so in love with you"), but Swift never confirmed or denied it, and never replied.\n\n"Enchanted" was originally the working title for the whole album until Big Machine president Scott Borchetta pushed for a name reflecting a more grown-up perspective. The song still got the fairy-tale treatment the discarded title implied: on the Speak Now World Tour she performed it in a ball gown atop a winding staircase with ballerinas behind her, and in 2011 her debut fragrance, Wonderstruck, took its name straight from the song\'s borrowed word.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Enchanted_(Taylor_Swift_song)' }],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Taylor_Swift_-_Enchanted_-_Speak_Now_WORLD_Tour_-_PARIS.jpg/500px-Taylor_Swift_-_Enchanted_-_Speak_Now_WORLD_Tour_-_PARIS.jpg',
            credit: 'oouinouin / Wikimedia Commons (CC BY 2.0)',
            caption:
              "Performing 'Enchanted' on the Speak Now World Tour in Paris, March 2011 — the ball-gown-and-staircase staging the song got every night.",
            kind: 'archival',
            focalPoint: '50% 22%',
          },
          // Photo pass #762 run 25 (2026-07-18): second frame from the same
          // March 17, 2011 Paris show, same photographer series as the frame
          // above — same white sparkle-bodice gown, different angle. Commons
          // file page checked (CC BY 2.0, oouinouin); curl 200 image/jpeg;
          // Read-viewed and outfit-matched against the existing photo.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Taylor_Swift_24_-_Live_in_Paris_-_2011.jpg/960px-Taylor_Swift_24_-_Live_in_Paris_-_2011.jpg',
            credit: 'oouinouin / Wikimedia Commons (CC BY 2.0)',
            caption:
              'The same Paris night, closer in — the gown that gave "Enchanted" its fairy-tale staging on the Speak Now World Tour.',
            kind: 'archival',
            focalPoint: '45% 25%',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 10,
      day: 12,
      category: 'music',
      title: 'Back to December, her first apology song',
      snippet:
        '"Guys get what they deserve in my songs, and if they deserve an apology, they should get one" — her first-ever apology track, later confirmed by Taylor Lautner as being about him.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Back_to_December',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0f/Back_to_December.png',
      moment: {
        context:
          'In interviews before Speak Now\'s release, Swift explained she\'d broken her own pattern: "Guys get what they deserve in my songs, and if they deserve an apology, they should get one. There was someone who was absolutely wonderful to me and I dropped the ball, and I needed to say all that."\n\nIt was the first time she wrote an apology to an ex rather than a critique of one. Actor Taylor Lautner, whom she\'d dated in late 2009, confirmed in a 2016 interview that he was the song\'s subject.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Back_to_December' }],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/0/0f/Back_to_December.png',
            credit: 'Big Machine Records',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 10,
      day: 25,
      category: 'music',
      title: 'The Story of Us, written after a crowded-room encounter',
      snippet:
        'Written after an awkward run-in with an ex at an awards show — "I felt like I was standing alone in a crowded room," she told her mom that night, then wrote the song.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Story_of_Us_(song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/6/6e/Taylor_Swift_-_The_Story_of_Us.png',
      moment: {
        context:
          'Swift was inspired by an uncomfortable encounter with an ex-boyfriend at an awards show — she wanted to talk to him but couldn\'t get past the awkwardness. Back home, she told her mother, "I felt like I was standing alone in a crowded room," and wrote the lyrics from there.\n\nShe later told USA Today\'s Brian Mansfield that the subject behind "The Story of Us" was the same person behind "Dear John." It was the last song she wrote for Speak Now.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Story_of_Us_(song)' }],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/6/6e/Taylor_Swift_-_The_Story_of_Us.png',
            credit: 'Big Machine Records',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 10,
      day: 25,
      category: 'business',
      title: 'Speak Now: the only album Taylor Swift has ever written entirely alone',
      snippet:
        'All 14 standard-edition tracks credited to Swift alone — a direct answer to critics who doubted a 20-year-old could really write her own songs.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/8/8f/Taylor_Swift_-_Speak_Now_cover.png',
      moment: {
        context:
          'Swift wrote every song on the standard 14-track edition by herself, gathering ideas during the Fearless Tour.\n\nShe\'s since described it as her answer to critics who doubted her songwriting was really her own. (The deluxe-edition bonus track "If This Was a Movie" is her only co-write on the record, with Martin Johnson.) It remains the only album in her catalog written without a single co-writer.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Speak_Now' }],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Taylor_Swift_-_Speak_Now_cover.png',
            credit: 'Big Machine Records',
            focalPoint: '62% 18%',
          },
          // Photo pass #762 run 25 (2026-07-18): second image is the album's
          // songs on stage — an era-context tour frame, honestly captioned.
          // Commons file page checked (CC BY 2.0, author dephisticate); curl
          // 200 image/jpeg; Read-viewed (gold gown, Newark crowd in frame).
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Taylor_Swift_-_Speak_Now_tour_2011_01.jpg',
            credit: 'dephisticate / Wikimedia Commons (CC BY 2.0)',
            caption:
              'On the Speak Now World Tour in Newark, July 2011 — touring the only album in her catalog with no co-writers.',
            kind: 'archival',
            focalPoint: '55% 12%',
          },
        ],
      },
    },
    {
      year: 2011,
      month: 11,
      day: 30,
      category: 'business',
      title: 'Speak Now earns a Best Country Album Grammy nomination',
      snippet:
        "Nominated for Best Country Album at the 54th Grammy Awards — the same ceremony where its single \"Mean\" won two trophies outright.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now',
      thumbnailUrl: null,
      moment: {
        context:
          'Nominations for the 54th Annual Grammy Awards were announced November 30, 2011; Speak Now was nominated for Best Country Album alongside Jason Aldean\'s "My Kinda Party," Eric Church\'s "Chief," Blake Shelton\'s "Red River Blue," and George Strait\'s "Here for a Good Time."\n\nLady Antebellum\'s "Own the Night" won the category at the February 12, 2012 ceremony; Speak Now\'s single "Mean" won Best Country Song and Best Country Solo Performance that same night.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Speak_Now' },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/music/music-news/grammy-awards-2012-winners-whitney-houston-death-adele-289778/',
          },
        ],
        photos: [
          // Photo pass #762 run 25 (2026-07-18): stays at one image — a
          // nominations-announcement story with no ceremony appearance of its
          // own to depict (the 54th Grammys night itself, where "Mean" won,
          // is the "Mean wins two Grammys" page's moment, photographed there).
          // Nothing on allowed hosts depicts this paper announcement.
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Taylor_Swift_-_Speak_Now_cover.png',
            credit: 'Big Machine Records (album cover art)',
            kind: 'primary',
            focalPoint: '62% 18%',
          },
        ],
      },
    },

    // --- Active-tier batch 2 (2026-07-04), per docs/decisions.md.
    {
      year: 2011,
      month: 1,
      day: 4,
      category: 'relationship',
      title: 'A brief, rumored relationship with Jake Gyllenhaal ends',
      snippet: 'Roughly three months after a backstage sighting at Saturday Night Live sparked speculation, reports of a split surfaced in January.',
      sourceUrl: 'https://www.elitedaily.com/dating/taylor-swift-jake-gyllenhaal-rumored-relationship-timeline',
      thumbnailUrl: null,
      moment: {
        context:
          'The relationship was never confirmed on the record by either party — known publicly through sightings and reporting, including a backstage appearance at an October 2010 "Saturday Night Live" hosted by Swift\'s friend Emma Stone.\n\nWhat reporting there was sketched both ends of the arc: Gwyneth Paltrow later said she had introduced the two at a dinner party, and by January, sources were telling Us Weekly that Gyllenhaal "wasn\'t feeling it anymore and was uncomfortable with all the attention," with the nine-year age gap doing quiet work in every account. Neither of them ever put a word of it on the record — which is exactly why fans would spend the next decade reading Red as its documentation.',
        sources: [
          {
            outlet: 'Elite Daily',
            url: 'https://www.elitedaily.com/dating/taylor-swift-jake-gyllenhaal-rumored-relationship-timeline',
          },
          {
            outlet: 'Yahoo Sports',
            url: 'https://sports.yahoo.com/amphtml/did-taylor-swift-jake-gyllenhaal-112739224.html',
          },
        ],
        photos: [
          {
            url: 'https://cdn01.justjared.com/wp-content/uploads/headlines/2010/11/taylor-swift-jake-gyllenhaal-thanksgiving.jpg',
            credit: 'Getty Images (via Just Jared)',
            caption:
              "Just Jared's side-by-side report art for the Thanksgiving 2010 Brooklyn sighting — file photos of the two, shown for reference; the coffee run itself produced few clean photos.",
            kind: 'reference',
          },
        ],
      },
    },
    {
      year: 2012,
      month: 8,
      category: 'relationship',
      title: "A summer with Conor Kennedy, and Ethel Kennedy's blessing",
      snippet: 'A whirlwind romance with the 18-year-old Kennedy family member, complete with a grandmother\'s public blessing and a house bought near the family\'s Hyannis Port compound — quietly over within months.',
      sourceUrl: 'https://www.eonline.com/news/357246/taylor-swift-and-conor-kennedy-breakup-anatomy-of-a-split',
      thumbnailUrl: null,
      moment: {
        context:
          'Ethel Kennedy, on the relationship: "We should be so lucky." A source on the breakup, reported that October: "They quietly parted ways a while ago. It was just a distance thing. No hard feelings."\n\nThe documented arc was brief but dense: first spotted together at a Mount Kisco, New York pizza restaurant on July 25, 2012, then a public debut at the family\'s Hyannis Port compound the following weekend, then beach afternoons and family volleyball through August. She went as far as buying a seven-bedroom Hyannis Port house near the compound for a reported $4.9 million — the summer\'s most over-literal commitment to a romance that didn\'t survive the fall.',
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/357246/taylor-swift-and-conor-kennedy-breakup-anatomy-of-a-split',
          },
          {
            outlet: 'Nicki Swift',
            url: 'https://www.nickiswift.com/271614/the-truth-about-taylor-swifts-relationship-with-conor-kennedy/',
          },
        ],
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2012719/634.taylor.cm.81912_copy.jpg',
            credit: 'Paul Adao/INFphoto.com',
            caption:
              'Wading off Cape Cod in mid-August 2012 — the most photographed stretch of the summer romance.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2011,
      month: 10,
      category: 'business',
      title: "Wonderstruck, her first fragrance, named for an Enchanted lyric",
      snippet:
        '"I wrote the lyric, \'I\'m wonderstruck, blushing all the way home,\' for the song \'Enchanted\' about the first time you meet someone" — her debut Elizabeth Arden fragrance, out October 2011.',
      sourceUrl: 'https://www.rollingstone.com/music/music-news/taylor-swift-launches-new-perfume-175194/',
      // Image-fix pass (2026-07-10): old cbsnewsstatic URL was a May 2011 Billboard Music Awards
      // red-carpet shot with no connection to the October 2011 Wonderstruck launch. Replaced with a
      // verified Getty Images photo (id 129173267, HTTP 200, image/jpeg, visually confirmed: the
      // 'Wonderstruck' step-and-repeat backdrop is visible behind her) taken at the actual launch
      // event at Macy's Herald Square, October 13, 2011.
      thumbnailUrl:
        'https://media.gettyimages.com/id/129173267/photo/taylor-swifts-wonderstruck-fragrance-launch.jpg?s=594x594&w=0&k=20&c=ibJp3dK0NvxFinzatkJl7lOPCieM5xP3asbvei7IB8s=',
      moment: {
        context:
          'Swift partnered with Elizabeth Arden on Wonderstruck, her first fragrance, released in US stores in October 2011.\n\nShe named it directly after her own lyric: "I wrote the lyric, \'I\'m wonderstruck, blushing all the way home,\' for the song \'Enchanted\' about the first time you meet someone," adding that fragrance helps "shape someone\'s first impression and memory of you." It became her best-selling perfume, and alongside Justin Bieber\'s "Someday," helped drive a reported 57% jump in celebrity-fragrance sales that year.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/taylor-swift-launches-new-perfume-175194/',
          },
        ],
        photos: [
          {
            // Image-fix pass (2026-07-10): old cbsnewsstatic URL was a generic BBMAs red-carpet
            // photo from five months earlier with nothing tying it to the fragrance. Replaced with
            // Getty Images id 129173267 (curl-verified HTTP 200 image/jpeg; Read-viewed: 'Wonderstruck'
            // logo visible on the step-and-repeat behind her), taken at the Macy's Herald Square
            // launch event, October 13, 2011.
            url: 'https://media.gettyimages.com/id/129173267/photo/taylor-swifts-wonderstruck-fragrance-launch.jpg?s=594x594&w=0&k=20&c=ibJp3dK0NvxFinzatkJl7lOPCieM5xP3asbvei7IB8s=',
            credit: 'Cindy Ord/Getty Images',
            caption: "At her Wonderstruck fragrance launch at Macy's Herald Square, October 13, 2011 in New York City.",
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2012,
      month: 3,
      day: 18,
      category: 'business',
      title: 'The Speak Now World Tour closes out at $123.7 million',
      snippet:
        "110 shows, 19 territories, 1.64 million tickets sold — Billboard's final tally for the tour that closed out the era on March 18, 2012.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now_World_Tour',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Taylor_Swift_-_Speak_Now_Tour_in_Pittsburgh_-_Whole_main_stage_with_the_flying_bacolny.jpg/1280px-Taylor_Swift_-_Speak_Now_Tour_in_Pittsburgh_-_Whole_main_stage_with_the_flying_bacolny.jpg',
      moment: {
        context:
          "Billboard estimated the Speak Now World Tour's total gross at $123.7 million, from 1,642,435 tickets sold across its 110-date run spanning 19 territories, from its February 2011 Singapore opener through its final show on March 18, 2012.\n\nInside those numbers: the North American leg alone accounted for roughly 1.5 million of the tickets, the run was her first tour with multiple US stadium shows — six football stadiums — and the closing night landed at Auckland's Vector Arena. Adjusted for inflation, the $123.7 million works out to roughly $173 million in 2025 dollars, earned by a 22-year-old on an album she wrote entirely alone.",
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Speak_Now_World_Tour' }],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Taylor_Swift_-_Speak_Now_Tour_in_Pittsburgh_-_Whole_main_stage_with_the_flying_bacolny.jpg/1280px-Taylor_Swift_-_Speak_Now_Tour_in_Pittsburgh_-_Whole_main_stage_with_the_flying_bacolny.jpg',
            credit: 'Eva Rinaldi / Wikimedia Commons',
          },
        ],
      },
    },

    // --- Deep timeline fill (2026-07-08, content/deep-a): the era's full
    // singles run + live album + Hunger Games one-off (release was empty),
    // tour depth, the awards year, and the relationships' documented starts.
    // Every claim verified against its cited source this session; business
    // and relationship items carry two independent sources per the framework.
    {
      slug: 'mine-rush-release',
      year: 2010,
      month: 8,
      day: 4,
      category: 'release',
      title: 'Mine leaks, so the label ships it 12 days early',
      snippet:
        'An unauthorized MP3 of "Mine" hit the internet in early August 2010 — Big Machine answered by rushing the lead single to radio and iTunes on Aug. 4, twelve days ahead of schedule.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swifts-mine-single-leaks-957034/',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/5/56/Taylor_Swift_-_Mine.png',
      moment: {
        context:
          'She admitted the leak made her cry — then watched the rush-release strategy work anyway, with the single racing up iTunes on day one. "Mine" introduced Speak Now two and a half months before the album arrived.\n\nThe numbers vindicated the scramble: originally slated for August 16, the single debuted at No. 3 on the Hot 100 with 297,000 downloads — at the time the eighth-biggest sales debut ever for a digital song. The music video, co-directed by Swift and Roman White and shot in Kennebunkport, Maine with British actor Toby Hemingway as the love interest (she cast him after seeing Feast of Love), premiered on CMT August 27 and went on to win Video of the Year at the 2011 CMT Music Awards.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swifts-mine-single-leaks-957034/',
            source_title: "Taylor Swift's 'Mine' Single Leaks",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Mine_(Taylor_Swift_song)',
            source_title: 'Mine (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-rush-releases-mine-to-radio-after-internet-leak-speak-now-album-in-october/',
            source_title: 'Taylor Swift Rush Releases "Mine" to Radio After Internet Leak',
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/5/56/Taylor_Swift_-_Mine.png',
            credit: 'Big Machine Records (single cover art)',
            kind: 'primary',
          },
          {
            url: 'https://i.ytimg.com/vi/XPBwXKgDTdE/hqdefault.jpg',
            credit: 'Big Machine Records / YouTube (official music video still)',
            caption: "Still from the official 'Mine' music video, via the video's YouTube thumbnail.",
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'speak-now-album-release',
      significance: 'defining', // the only album she's ever written entirely alone — a direct answer to critics who doubted her (docs/decisions.md, 2026-07-19)
      year: 2010,
      month: 10,
      day: 25,
      category: 'release',
      title: 'Speak Now arrives, no co-writers allowed',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-sn-1", label: "Speak Now released", kind: "album" },
      snippet:
        'Oct. 25, 2010: the third album lands — fourteen tracks written alone between 18 and 20, released into a week that ended with a million copies sold.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/8/8f/Taylor_Swift_-_Speak_Now_cover.png',
      moment: {
        context:
          'The solo writing wasn\'t incidental — it was the thesis, her direct answer to anyone doubting the songs were hers. The title changed late, too: the album was nearly called Enchanted until Scott Borchetta pushed for a name that matched its more grown-up perspective.\n\nShe\'d written the fourteen tracks on the road, co-producing with Nathan Chapman: "I\'d get my best ideas at 3:00 a.m. in Arkansas, and I didn\'t have a co-writer around so I would just finish it," she explained. The new title fit her definition of the whole record — the moment "where it\'s almost too late, and you\'ve got to either say what it is you are feeling or deal with the consequences forever." The market answered with 1,047,000 first-week copies and a No. 1 debut on the Billboard 200.\n\nThe CD booklet carried its own solo touch: a capitalization code hidden in the "Never Grow Up" lyric sheet decodes to "MOVED OUT IN JULY" — a real detail about leaving her family\'s home, continuing the liner-note tradition she\'d run since her debut.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Speak_Now',
            source_title: 'Speak Now',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-liner-note-secret-messages-6296379/',
            source_title: "Taylor Swift's 13 Best Liner Note Secret Messages",
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-19',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Taylor_Swift_-_Speak_Now_cover.png',
            credit: 'Big Machine Records',
            focalPoint: '62% 18%',
          },
          // Photo pass #762 run 25 (2026-07-18): second image is the title
          // track performed live — the closest photographable thing to the
          // album itself. Commons file page checked (CC BY-SA 2.0, Eva
          // Rinaldi); curl 200 image/jpeg; Read-viewed (purple dress at the
          // vintage mic, the tour's "Speak Now" staging).
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Taylor_Swift_-_SPEAK_NOW_World_Tour_Live_in_Sydney_2012_-_Speak_Now.jpg',
            credit: 'Eva Rinaldi / Wikimedia Commons (CC BY-SA 2.0)',
            caption:
              'Performing the title track on the Speak Now World Tour in Sydney, March 2012.',
            kind: 'archival',
            focalPoint: '45% 12%',
          },
          // Photo pass 2026-07-19 (bulk-to-6+, docs/decisions.md): one more
          // verified, not-otherwise-used-in-this-file photo. Wikimedia's API
          // rate-limited most other candidates checked this pass (several
          // already-used-elsewhere tour photos were also found and correctly
          // excluded rather than duplicated); genuinely thin past this for a
          // release-day story whose main visual asset is the cover already
          // shown as thumbnailUrl.
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Taylor_Swift_2011_2.jpg',
            credit: 'dephisticate, Wikimedia Commons (CC BY 2.0)',
            caption: 'Acoustic performance beneath an illuminated tree, Prudential Center, July 2011, on the tour supporting the album.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'back-to-december-single-release',
      year: 2010,
      month: 11,
      day: 15,
      category: 'release',
      title: 'Back to December goes to radio as single two',
      snippet:
        'The apology song becomes the second single in November 2010 — the first time she\'d ever sent an "I\'m sorry" to country radio.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Back_to_December',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0f/Back_to_December.png',
      moment: {
        context:
          'Chosen as the follow-up to "Mine" within weeks of the album\'s release; the apology\'s recipient stayed officially unnamed until Taylor Lautner confirmed, years later, that it was him.\n\nIt went to country radio on November 15, 2010 — five days after she premiered it at the CMA Awards at Nashville\'s Bridgestone Arena, a stripped-back performance the Los Angeles Times graded a B+. The single climbed to No. 6 on the Hot 100 and No. 3 on Hot Country Songs, and its Yoann Lemoine-directed video — all snow and distance, built, in the director\'s words, "to work on the coldness of feelings in a very visual way" — premiered that January.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Back_to_December',
            source_title: 'Back to December',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/0/0f/Back_to_December.png',
            credit: 'Big Machine Records (single cover art)',
          },
        ],
      },
    },
    {
      slug: 'mean-single-release',
      year: 2011,
      month: 3,
      day: 7,
      category: 'release',
      title: 'Mean, the banjo single, goes to country radio',
      snippet:
        'March 2011: the album\'s bluegrass-leaning critic clapback becomes single three — the one that would end up with two Grammys and a live banjo on the Grammy stage.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Mean_(song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/2/2d/Taylor_Swift_-_Mean.png',
      moment: {
        context:
          'Sending the most traditionally country track on Speak Now to radio mid-tour doubled as a statement about where she still lived musically; eleven months later it won Best Country Song and Best Country Solo Performance.\n\nIt had already debuted and peaked at No. 11 on the Hot 100 on album-week sales in 2010; released to country radio March 7, 2011, it passed a million digital copies by that August. The Declan Whitebloom video — shot over two days at Los Angeles\' Orpheum Theatre with young actors Joey King and Presley Cash — reframed the critic clapback as an anti-bullying story, and Grammy.com\'s retrospective still reads the song the way fans did in 2011: "a deliciously twangy clapback to critic Bob Lefsetz."',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Mean_(song)',
            source_title: 'Mean (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Grammy.com',
            url: 'https://www.grammy.com/news/taylor-swift-speak-now-taylors-version-legacy-songs-mine-dear-john-mean/',
            source_title: "How Speak Now Cemented Taylor Swift's Songwriting Legacy",
            publisher: 'The Recording Academy',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/2/2d/Taylor_Swift_-_Mean.png',
            credit: 'Big Machine Records (single cover art)',
            kind: 'primary',
            focalPoint: '25% 60%',
          },
          {
            url: 'https://i.ytimg.com/vi/jYa1eI1hpDE/hqdefault.jpg',
            credit: 'Big Machine Records / YouTube (official music video still)',
            caption: "Still from the official 'Mean' music video, via the video's YouTube thumbnail.",
            kind: 'archival',
            focalPoint: '45% 42%',
          },
        ],
      },
    },
    {
      slug: 'sparks-fly-single-release',
      year: 2011,
      month: 7,
      day: 18,
      category: 'release',
      title: 'Sparks Fly: the fans finally get their single',
      snippet:
        'July 18, 2011: a song written at 16 and bootlegged from 2007 bar shows becomes the album\'s fifth single — because fans simply would not stop asking for it.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Sparks_Fly_(song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/9/91/Sparks_Fly_-_Single.png',
      moment: {
        context:
          'A fan-filmed 2007 performance circulated online for years, and backstage requests at the 2010 CMA Music Festival pushed her to rework the song for Speak Now. The single just made official what tour setlists already knew.\n\nThe studio version kept the original arrangement while retouching lyrics she\'d written at 16. As the album\'s fifth single it reached No. 17 on the Hot 100 and went all the way to No. 1 on Hot Country Songs that November, eventually certified platinum — and, fittingly for a song the live shows kept alive, its Christian Lamb-directed video was cut entirely from Speak Now World Tour concert footage.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Sparks_Fly_(song)',
            source_title: 'Sparks Fly (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/9/91/Sparks_Fly_-_Single.png',
            credit: 'Big Machine Records (single cover art)',
            kind: 'primary',
            focalPoint: '32% 14%',
          },
          {
            url: 'https://i.ytimg.com/vi/oKar-tF__ac/hqdefault.jpg',
            credit: 'Big Machine Records / YouTube (official music video still)',
            caption:
              "Still from the official 'Sparks Fly' music video — cut from Speak Now World Tour performance footage — via the video's YouTube thumbnail.",
            kind: 'archival',
            focalPoint: '47% 38%',
          },
        ],
      },
    },
    {
      slug: 'speak-now-world-tour-live-album',
      year: 2011,
      month: 11,
      day: 21,
      category: 'release',
      title: 'The first live album: Speak Now World Tour Live',
      snippet:
        'Nov. 21, 2011: a CD-plus-DVD of the North American leg arrives — the full show on film, plus tour covers of Train\'s "Drops of Jupiter," "Bette Davis Eyes," and the Jackson 5\'s "I Want You Back."',
      sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now_World_Tour_%E2%80%93_Live',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/e/e9/Taylor_Swift_-_Speak_Now_World_Tour_-_Live.png',
      moment: {
        context:
          'Her first live album, released through Big Machine while the era was still running; it debuted at No. 11 on the Billboard 200 with 77,000 first-week copies.\n\nThe package ran 79 minutes on CD and two hours on the DVD, directed by Ryan Polito from footage shot across the tour\'s North American leg. Beyond the Billboard 200 debut it climbed to No. 2 on Top Country Albums — and it preserved the tour\'s cover-song habit on record, from Train\'s "Drops of Jupiter" to the Jackson 5\'s "I Want You Back," years before surprise covers hardened into a formal nightly slot on her tours.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Speak_Now_World_Tour_%E2%80%93_Live',
            source_title: 'Speak Now World Tour – Live',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Photo pass #762 (2026-07-19): added a CC-licensed live shot from the
        // tour the album documents (Vancouver, Sept. 11, 2011 — the North
        // American leg the DVD was cut from). curl-verified 200 image/jpeg,
        // downloaded and vision-confirmed (full band mid-song on the tour stage).
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/e/e9/Taylor_Swift_-_Speak_Now_World_Tour_-_Live.png',
            credit: 'Big Machine Records (album cover art)',
            kind: 'primary',
            focalPoint: '47% 29%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Taylor_Swift_-_Long_Live_-_Speak_Now_Tour_in_Vancouver.jpg',
            credit: 'Andy (agroove) / Wikimedia Commons, CC BY-SA 2.0',
            caption:
              'Swift and her band mid-set in Vancouver, Sept. 11, 2011 — the North American leg whose footage became Speak Now World Tour Live.',
            kind: 'archival',
            focalPoint: '49% 44%',
          },
        ],
      },
    },
    {
      slug: 'safe-and-sound-surprise-drop',
      year: 2011,
      month: 12,
      day: 26,
      category: 'release',
      title: 'Safe & Sound appears the day after Christmas',
      snippet:
        'Dec. 26, 2011: a haunted, stripped-down Hunger Games ballad with The Civil Wars lands on iTunes — a first glimpse of the indie-folk register she\'d fully move into a decade later.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Safe_%26_Sound_(Taylor_Swift_song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/3/3c/Taylor_Swift_-_Safe_%26_Sound_%28feat._The_Civil_Wars%29.png',
      moment: {
        context:
          'Producer T Bone Burnett had the Civil Wars over to his house after a Los Angeles show; Swift, who\'d spent two days reading the novel, wrote "Safe & Sound" with them in about two hours, singing from Katniss Everdeen\'s perspective. It went on to win the Grammy for Best Song Written for Visual Media.\n\nAs a release it was an outlier on every axis: an out-of-cycle soundtrack single with no album of her own attached, debuting at No. 30 on the Hot 100 on 136,000 first-week downloads. The Philip Andelman-directed video — Swift barefoot in a white dress, walking woods and a cemetery in Watertown, Tennessee — premiered on MTV that February, and the song picked up a Golden Globe nomination for Best Original Song, losing to Adele\'s "Skyfall."',
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
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/3/3c/Taylor_Swift_-_Safe_%26_Sound_%28feat._The_Civil_Wars%29.png',
            credit: 'Big Machine Records (single cover art)',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'speak-now-title-track-origin',
      year: 2010,
      month: 10,
      day: 5,
      category: 'music',
      title: 'Speak Now, the title track: a wedding she never crashed',
      snippet:
        'The album\'s namesake started with a friend\'s story — the boy she\'d loved since childhood was marrying, in Swift\'s telling, a "horrible, controlling, mean girl" — so Swift wrote the objection scene as fiction.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          'She filed it among the album\'s hypotheticals — songs that are "an extension of my feelings and hypothetically what I would do" — rather than autobiography, and said a dream about an ex\'s wedding helped knit the song together.\n\nOn the page it\'s a full screwball plot: the narrator sneaks into the wedding uninvited, hides in the curtains, interrupts the ceremony at the moment tradition invites objections, and leaves with the groom. And it did real chart work for a non-single, debuting at No. 8 on the Hot 100 on album-release sales — her sixth top-ten debut, breaking a record previously held by Mariah Carey.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Speak_Now_(song)',
            source_title: 'Speak Now (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
          {
            outlet: 'American Songwriter',
            url: 'https://americansongwriter.com/behind-the-meaning-of-taylor-swifts-speak-now/',
            source_title: 'Behind the Meaning of Taylor Swift\'s "Speak Now"',
            publisher: 'American Songwriter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        // Photo pass #762 (2026-07-19): added a CC-licensed shot of the song's
        // actual tour staging — the wedding-interruption scene, played out in
        // costume in front of a stained-glass chapel screen. curl-verified 200
        // image/jpeg, downloaded and vision-confirmed (purple dress, white
        // gloves, bridesmaid dancers, stained-glass backdrop).
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Taylor_Swift_-_Speak_Now_cover.png',
            credit: 'Big Machine Records (album cover art)',
            caption: 'The album the title track named — the song that gave Speak Now its thesis and its cover line.',
            kind: 'primary',
            focalPoint: '54% 15%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Taylor_Swift_-_Speak_Now_-_Speak_Now_World_Tour_2011_in_Vancouver.jpg',
            credit: 'Andy (agroove) / Wikimedia Commons, CC BY-SA 2.0',
            caption:
              "The song's wedding scene, staged live: Swift in purple with gloved dancers before a stained-glass chapel screen, performing 'Speak Now' in Vancouver on the 2011 tour.",
            kind: 'archival',
            focalPoint: '49% 46%',
          },
        ],
      },
    },
    {
      slug: 'speak-now-na-leg-omaha',
      year: 2011,
      month: 5,
      day: 27,
      category: 'tour',
      title: 'The North American leg opens in Omaha',
      snippet:
        'May 27, 2011: after opening runs through Asia and Europe, the Speak Now World Tour lands stateside in Omaha — the start of a summer-and-fall North American run.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now_World_Tour',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Taylor_Swift_Speak_Now_Tour_2011_2.jpg/500px-Taylor_Swift_Speak_Now_Tour_2011_2.jpg',
      moment: {
        context:
          'The North American leg became the stretch the era is remembered by — the theatrical staging, the costume changes, and above all the parade of surprise-guest duets that peaked in Los Angeles that August.\n\nOpening night was May 27, 2011 at the Qwest Center in Omaha, and the leg ran deep into November, folding in the tour\'s six US stadium dates along the way. It was also the stretch the cameras kept: the Speak Now World Tour Live CD/DVD released that November was assembled from footage shot across these North American shows.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Speak_Now_World_Tour',
            source_title: 'Speak Now World Tour',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Taylor_Swift_Speak_Now_Tour_2011_2.jpg/500px-Taylor_Swift_Speak_Now_Tour_2011_2.jpg',
            credit: 'Ronald Woan / Wikimedia Commons (CC BY 2.0)',
            caption:
              'On stage during the North American leg — photographed in Pittsburgh on June 18, 2011, three weeks after the Omaha opener on the same leg.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      slug: 'staples-center-guest-week',
      year: 2011,
      month: 8,
      day: 23,
      category: 'tour',
      title: 'Guest-a-night week at Staples Center',
      snippet:
        'Four August nights in LA, four cameos: "Baby" with Justin Bieber, "I\'m Yours" with Jason Mraz, "Tonight Tonight" with Hot Chelle Rae, and "Super Bass" with Nicki Minaj.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Speak_Now_World_Tour',
      thumbnailUrl: null,
      moment: {
        context:
          'The Speak Now tour\'s surprise-duet tradition peaked in Los Angeles, Aug. 23-28, 2011 — a different guest most nights, from country neighbors to whoever owned pop radio that month. The habit never left her shows; the Eras Tour\'s surprise-song slot is its direct descendant.\n\nThe four LA nights were just the densest run of a leg-long habit: across North America the guest list also pulled in Usher, T.I., B.o.B, Selena Gomez, James Taylor, Switchfoot\'s Jon Foreman, and Jimmy Eat World\'s Jim Adkins. The point read clearly even then — a country headliner treating genre as a non-issue, one borrowed pop, R&B, or soft-rock catalog at a time.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Speak_Now_World_Tour',
            source_title: 'Speak Now World Tour',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Taylor_Swift_Speak_Now_Tour_2011_2.jpg/500px-Taylor_Swift_Speak_Now_Tour_2011_2.jpg',
            credit: 'Ronald Woan / Wikimedia Commons (CC BY 2.0)',
            caption:
              'The Speak Now World Tour on the same North American leg, photographed in Pittsburgh in June 2011 — for reference: no freely licensed photo of the Staples Center guest nights themselves exists.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      slug: 'acm-entertainer-2011',
      year: 2011,
      month: 4,
      day: 3,
      category: 'business',
      title: 'Her first Entertainer of the Year at the ACMs',
      snippet:
        'April 3, 2011: the Academy of Country Music hands her its top award for the first time — "This is the first time that I\'ve ever won this," she said, on a night Miranda Lambert won four trophies.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-wins-entertainer-of-the-year-at-acm-awards-472222/',
      thumbnailUrl: null,
      moment: {
        context:
          'The win came mid-tour, a genuine surprise on a Lambert-dominated night, and made the industry\'s verdict on the all-solo-writing gambit explicit. The next morning she was photographed browsing an Anthropologie in Beverly Hills — see the sighting entry.\n\nShe worked the night too, performing "Mean" at the MGM Grand Garden Arena, then watched Miranda Lambert collect trophy after trophy before the fan-voted final award turned her way. Her speech ran on disbelief — "This is the first time that I\'ve ever won this and I\'m just losing my mind" — and, fresh off the tour\'s overseas legs, she called the award a wonderful welcome-home gift.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-wins-entertainer-of-the-year-at-acm-awards-472222/',
            source_title: 'Taylor Swift Wins Entertainer of the Year at ACM Awards',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Taste of Country',
            url: 'https://tasteofcountry.com/taylor-swift-entertainer-of-the-year-2011-acm-awards/',
            source_title: 'Taylor Swift Takes Top Honors as Entertainer of the Year Winner at 2011 ACMs',
            publisher: 'Taste of Country',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        photos: [
          {
            url: 'https://townsquare.media/site/204/files/2011/04/taylor-swift-acms-b.jpg?w=980&q=75',
            credit: 'Ethan Miller/Getty Images (via Taste of Country)',
            caption:
              'The moment itself: hand over mouth as the Entertainer of the Year announcement lands in Las Vegas, April 3, 2011.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'billboard-woman-of-year-2011',
      year: 2011,
      month: 12,
      day: 2,
      category: 'business',
      title: "Billboard's youngest-ever Woman of the Year",
      snippet:
        'Dec. 2, 2011: Billboard honors her as Woman of the Year at 21 — the youngest recipient in the award\'s history, on the strength of a year in which she out-sold every albums artist in any genre.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swift-named-billboard-woman-of-the-year-2-1164046/',
      thumbnailUrl: null,
      moment: {
        context:
          'Billboard\'s citation leaned on the numbers: the top-selling albums artist of the previous 12 months, an entirely self-written No. 1 album, and a sold-out world tour. She\'d win the award again in 2014, the first woman to take it twice.\n\nThe honor was announced October 11, 2011 and presented December 2 at Billboard\'s Women in Music event at Capitale in New York. Editorial director Bill Werde\'s framing put songwriting, not spectacle, at the center: "Taylor has shown the power of good songwriting with music that has transcended genres."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-named-billboard-woman-of-the-year-2-1164046/',
            source_title: 'Taylor Swift Named Billboard Woman of the Year',
            publisher: 'Billboard',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Taste of Country',
            url: 'https://tasteofcountry.com/taylor-swift-billboard-woman-of-the-year-2011/',
            source_title: 'Taylor Swift Crowned 2011 Billboard Woman of the Year',
            publisher: 'Taste of Country',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        // Photo pass #762 (2026-07-19): no second verifiable image — the only
        // other photo in the cited Taste of Country piece (swifty.jpg) is
        // byte-identical to this one, and no hotlinkable image of the Dec. 2
        // Capitale ceremony itself was found on an approved CDN.
        photos: [
          {
            url: 'https://townsquare.media/site/204/files/2011/10/swifty1.jpg?w=980&q=75',
            credit: 'Dave Hogan/Getty Images (via Taste of Country)',
            caption:
              "On stage mid-Speak Now era with the crystal-fretted '13' guitar — the touring-and-sales year Billboard's citation leaned on.",
            kind: 'archival',
            focalPoint: '52% 17%',
          },
        ],
      },
    },
    {
      slug: 'gyllenhaal-rumors-fall-2010',
      year: 2010,
      month: 11,
      day: 25,
      category: 'relationship',
      title: 'The Jake Gyllenhaal rumors go public',
      snippet:
        'Fall 2010: a backstage SNL sighting in October becomes a Brooklyn coffee run by Thanksgiving — the never-confirmed relationship fans would spend the next decade mapping onto Red.',
      sourceUrl: 'https://www.elitedaily.com/dating/taylor-swift-jake-gyllenhaal-rumored-relationship-timeline',
      thumbnailUrl: null,
      moment: {
        context:
          'Neither ever confirmed it on the record; the timeline exists entirely through sightings — SNL in October, Gorilla Coffee on Thanksgiving — and the split reports that followed in January.\n\nThe reported origin was a Gwyneth Paltrow dinner party ("I\'ve just known Jake for a long time," she later explained), and even the SNL night had its own choreography — a source told People the two "walked around together backstage, but they were careful not to be seen too close." By Thanksgiving he\'d reportedly brought her to sister Maggie Gyllenhaal\'s Brooklyn neighborhood for the holiday, which is how a Park Slope coffee shop ended up in the fan-history books.',
        sources: [
          {
            outlet: 'Elite Daily',
            url: 'https://www.elitedaily.com/dating/taylor-swift-jake-gyllenhaal-rumored-relationship-timeline',
            source_title: 'Taylor Swift and Jake Gyllenhaal\'s Rumored Relationship Timeline',
            publisher: 'Elite Daily',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'Yahoo Sports',
            url: 'https://sports.yahoo.com/amphtml/did-taylor-swift-jake-gyllenhaal-112739224.html',
            source_title: 'Did Taylor Swift and Jake Gyllenhaal Date?',
            publisher: 'Yahoo',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        photos: [
          {
            url: 'https://cdn01.justjared.com/wp-content/uploads/headlines/2010/11/taylor-swift-jake-gyllenhaal-thanksgiving.jpg',
            credit: 'Getty Images (via Just Jared)',
            caption:
              "Just Jared's side-by-side report art for the Thanksgiving coffee-run sighting that anchored the rumor timeline — file photos of the two, shown for reference.",
            kind: 'reference',
          },
        ],
      },
    },
    {
      slug: 'conor-kennedy-first-linked',
      year: 2012,
      month: 7,
      day: 25,
      category: 'relationship',
      title: 'First linked to Conor Kennedy in Hyannis Port',
      snippet:
        'July 2012: reports first tie her to RFK\'s 18-year-old grandson Conor Kennedy, with sightings around the family\'s Hyannis Port compound — the start of the summer the tabloids couldn\'t get enough of.',
      sourceUrl: 'https://www.eonline.com/photos/6573/taylor-swift-conor-kennedy-romance-rewind',
      thumbnailUrl: null,
      moment: {
        context:
          'The romance ran through the summer — beach sightings, family volleyball, Ethel Kennedy\'s on-record approval — and was quietly over by fall. See August\'s entries for how thoroughly it was documented.\n\nThe first documented sighting was decidedly low-stakes: pizza at a Mount Kisco, New York restaurant on July 25, 2012, followed by a public debut at the Hyannis Port compound the next weekend. Within a month she\'d reportedly bought a seven-bedroom house near the compound for $4.9 million — the paper trail of a summer that fans would later hear processed on Red\'s quieter back half.',
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/photos/6573/taylor-swift-conor-kennedy-romance-rewind',
            source_title: 'Taylor Swift & Conor Kennedy: Romance Rewind',
            publisher: 'E! Online',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'Nicki Swift',
            url: 'https://www.nickiswift.com/271614/the-truth-about-taylor-swifts-relationship-with-conor-kennedy/',
            source_title: "The Truth About Taylor Swift's Relationship With Conor Kennedy",
            publisher: 'Nicki Swift',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2012719/634.taylor.cm.81912_copy.jpg',
            credit: 'Paul Adao/INFphoto.com',
            caption:
              'Off Cape Cod in mid-August 2012, a few weeks after the two were first linked in July.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'zac-efron-ellen-duet',
      year: 2012,
      month: 2,
      day: 21,
      category: 'sighting',
      title: 'Teaching Zac Efron guitar on Ellen',
      snippet:
        'Feb. 21, 2012: promoting The Lorax, she and Zac Efron duet an acoustic "Pumped Up Kicks" on Ellen — with the lyrics rewritten to be entirely about Ellen DeGeneres.',
      sourceUrl: 'https://www.cbsnews.com/news/taylor-swift-and-zac-efron-cover-pumped-up-kicks-on-ellen/',
      thumbnailUrl: 'https://i.ytimg.com/vi/d8kCTPPwfpM/hqdefault.jpg',
      moment: {
        context:
          'Swift had been teaching her Lorax co-star to play guitar; the rewritten cover — cheat-sheet lyrics in hand — became one of the show\'s most replayed musical bits from that year.\n\nBoth were voicing characters in The Lorax, and the guitar lessons were real: "He had like one lesson," Swift said, marveling that he was already good at it, having taught him the Foster the People song herself. The two spent the rest of the appearance laughing off dating rumors and insisting they were just friends — which only helped the duet clip travel.',
        sources: [
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-and-zac-efron-cover-pumped-up-kicks-on-ellen/',
            source_title: 'Taylor Swift and Zac Efron cover "Pumped Up Kicks" on "Ellen"',
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'YouTube (TheEllenShow)',
            url: 'https://www.youtube.com/watch?v=d8kCTPPwfpM',
            source_title: 'Taylor Swift and Zac Efron Sing a Duet!',
            publisher: 'YouTube',
            source_type: 'video',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        photos: [
          {
            url: 'https://i.ytimg.com/vi/d8kCTPPwfpM/hqdefault.jpg',
            credit: 'The Ellen Show / Warner Bros. (official YouTube clip thumbnail)',
            caption:
              "Swift and Zac Efron mid-duet on Ellen, Feb. 21, 2012 — thumbnail of the show's official YouTube upload of the segment.",
            kind: 'archival',
          },
        ],
      },
    },

    // ── Migrated from content.ts RAW (consolidation stage 2a, 2026-07-19) ──
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "speak-now-album",
      year: 2010,
      month: 10,
      day: 25,
      category: "music",
      title: "Written entirely alone",
      snippet: "A response to critics who doubted her songwriting: every word, solo.",
      moment: {
        context: "Speak Now carries no co-writers — a deliberate statement of authorship after whispers that others wrote her hits.\n\nThe result is theatrical and intimate at once: apologies, fantasies, and confrontations staged under violet light.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "speak-now-mine",
      year: 2010,
      month: 8,
      day: 4,
      category: "music",
      title: "\"Mine\" leaks early, ships anyway",
      snippet: "The lead single was rushed to radio and iTunes after an unauthorized online leak.",
      moment: {
        context: "\"Mine\" was announced via livestream and scheduled for an August 16 release, but an early leak forced Big Machine Records to rush it to country radio and iTunes on August 4 instead — nearly two weeks ahead of plan.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "speak-now-ballgowns",
      year: 2011,
      month: 2,
      dateLabel: "2011 Tour",
      category: "tour",
      tags: ["Fashion"],
      title: "The ballgown tour",
      snippet: "Sweeping purple gowns turn every show into a fairy tale.",
      moment: {
        context: "The Speak Now World Tour leaned fully theatrical — flowing gowns, castles, and enchantment.\n\nEach song got its own staged set piece, from the title track's wedding-crashing fantasy to \"Enchanted\"'s ballroom backdrop.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "speak-now-mean",
      year: 2011,
      month: 3,
      day: 14,
      category: "music",
      title: "\"Mean\" answers a critic",
      snippet: "A banjo-driven single written directly about online criticism she'd received.",
      moment: {
        context: "Swift has said \"Mean\" was written in direct response to a critical review — a rare moment of the album engaging a critic rather than an ex, and one of Speak Now's more overtly personal tracks.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "speak-now-enchanted",
      year: 2011,
      month: 5,
      day: 3,
      category: "music",
      title: "\"Enchanted,\" a fan favorite",
      snippet: "A sprawling, six-minute love-at-first-sight song that became one of the album's most enduring deep cuts.",
      moment: {
        context: "Never released as an official single, \"Enchanted\" nonetheless became one of Speak Now's most fan-beloved tracks — its extended, key-changing structure a favorite live moment on the Speak Now World Tour.",
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "speak-now-taylors-version",
      year: 2023,
      month: 7,
      day: 7,
      category: "music",
      title: "Speak Now (Taylor's Version)",
      snippet: "The third re-recording arrives with six previously unreleased \"From the Vault\" tracks.",
      moment: {
        context: "Speak Now (Taylor's Version) released July 7, 2023, with six vault tracks, including \"Castles Crumbling\" featuring Hayley Williams of Paramore — reclaiming the only album in her catalog she's said was written entirely without a co-writer.",
      },
    },
  ],
};
