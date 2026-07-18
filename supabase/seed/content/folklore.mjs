// Vault content — folklore era.
//
// One wavetop month: July 2020, the surprise album release. Every claim
// verified against its cited source directly. See
// docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first) authoring model this follows.
//
// The "Teenage Love Triangle" (cardigan/betty/august) is explicitly
// fictional per multiple sources — safe territory, no real-person
// attribution. Character names are a nod to friends' children; deliberately
// not naming which friends, out of general good taste about minors.
//
// T16 full-era pass (2026-07-09): every item now carries a 2+ paragraph
// sourced body (paragraphs split on blank lines per the sync contract) and
// at least one real photo with credit + caption + kind, per the relaxed
// 2026-07-09 media policy in docs/decisions.md. Every image URL was
// curl-verified (HTTP 200 + image content-type) this session; YouTube
// thumbnails were verified via oEmbed against the official channel; Commons
// files had their licenses checked on the file page. No AI-generated images.

export default {
  eraSlug: 'folklore',
  items: [
    {
      year: 2020,
      month: 8,
      day: 8,
      category: 'business',
      title: 'folklore makes her the first artist to top both charts at once',
      snippet:
        "Announced the day before release — then Swift became the first artist ever to debut atop the Hot 100 (with 'cardigan') and the Billboard 200 in the same week.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Folklore_(Taylor_Swift_album)',
      thumbnailUrl:
        'https://www.hollywoodreporter.com/wp-content/uploads/2020/08/taylor_swift-folklore-_publicity_-_h_2020.jpg?w=1296&h=730&crop=1',
      moment: {
        context:
          'The Billboard 200 dates to 1956 and the Hot 100 to 1958, and in all those decades nobody had opened at No. 1 on both in the same week until the chart dated Aug. 8, 2020. "cardigan" did it on 34 million U.S. streams and 71,000 downloads — her sixth Hot 100 No. 1, and just the 41st song ever to debut at the top.\n\nThe album side was just as lopsided: all 16 standard-edition tracks hit the Hot 100 at once, with three debuting in the top 10 ("cardigan" at No. 1, "the 1" at No. 4, "exile" at No. 6), which also made her the first artist to debut two songs in the top four simultaneously. For a record announced sixteen hours before release, with no lead single and no rollout, the double crown read as proof the surprise-drop model hadn\'t cost her anything at all.',
        sources: [
          {
            outlet: 'BuzzFeed',
            url: 'https://www.buzzfeed.com/eleanorbate/taylor-swift-folklore-cardigan-charts',
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-becomes-first-artist-open-atop-hot-100-billboard-200-same-week-1305638/',
          },
        ],
        photos: [
          {
            url: 'https://www.hollywoodreporter.com/wp-content/uploads/2020/08/taylor_swift-folklore-_publicity_-_h_2020.jpg?w=1296&h=730&crop=1',
            credit: 'Beth Garrabrant',
            caption: 'folklore-era publicity photograph by Beth Garrabrant, shot with no styling team during lockdown.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 7,
      day: 24,
      category: 'music',
      title: 'A fictional teenage love triangle, told across three songs',
      snippet:
        'Three songs, one summer romance, three different narrators — cardigan, betty, and august.',
      sourceUrl:
        'https://screenrant.com/taylor-swift-folklore-betty-august-cardigan-love-triangle-song-lyrics-explained/',
      thumbnailUrl: null,
      moment: {
        context:
          'The arc runs in order: James cheats on Betty over the summer ("august," told by the other girl, who thought it was real), a friend named Inez tells Betty when school starts, and James turns up at Betty\'s party to apologize ("betty") — while "cardigan" is Betty looking back on all of it from years later. The characters are entirely invented, with names borrowed as an affectionate nod to friends\' kids.\n\nThe songs quote each other: James\'s "I dreamt of you all summer long" answers the events of "august," and Betty\'s "chase two girls, lose the one" calls the whole thing. Rolling Stone\'s review counted all three among the album\'s highlights — "the same love triangle, from all three different perspectives" — and decoding which narrator held which detail became the album\'s first fan parlor game in the hours after release.',
        sources: [
          {
            outlet: 'ScreenRant',
            url: 'https://screenrant.com/taylor-swift-folklore-betty-august-cardigan-love-triangle-song-lyrics-explained/',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-album-reviews/taylor-swift-leaves-her-comfort-zones-behind-on-the-head-spinning-heart-breaking-folklore-1033533/',
          },
        ],
        // Real-photo pass (2026-07-09): official single covers for two of the
        // triangle's three songs, exact filenames taken from the Wikipedia
        // article HTML. Verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/0/07/Taylor_Swift_-_Cardigan.png',
            credit: 'Republic Records',
            caption: 'Official single cover for "cardigan" — adult Betty\'s chapter of the triangle.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/3/38/Taylor_Swift_-_Betty.png',
            credit: 'Republic Records',
            // Image-fix pass (2026-07-10): ticket #232 — viewed the file: its
            // on-image text reads "betty — Live from the 2020 Academy of Country
            // Music Awards," i.e. this is the ACM-live artwork, not the plain
            // studio single cover. Caption fixed to match; image kept (correct
            // official artwork for the song, just the live variant).
            caption: 'Cover art for "betty (Live from the 2020 Academy of Country Music Awards)" — James\'s apology, sung from the party on Betty\'s porch.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 7,
      day: 24,
      category: 'music',
      title: "The last great american dynasty, and the widow she found in her own house",
      snippet:
        "A real St. Louis divorcée, a Rhode Island mansion, and a swimming-pool-full-of-champagne legend — until the final verse turns the story into Taylor's own.",
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Last_Great_American_Dynasty',
      // Image-fix pass (2026-07-10): ticket #233 — swapped 250px thumb for the
      // 1280px render of the same Commons file (curl-verified HTTP 200 +
      // image/jpeg; downloaded and viewed — the white Holiday House mansion is
      // clearly discernible at this size, vs. indistinct at 250px).
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Holiday_House_on_Watch_Hill.jpg/1280px-Holiday_House_on_Watch_Hill.jpg',
      moment: {
        context:
          "Rebekah Harkness was a middle-class divorcée from St. Louis who married Standard Oil heir William Harkness in 1947, inherited his fortune at his death in 1954, and spent it loudly — funding her own ballet company and filling Holiday House, the Watch Hill mansion Swift would buy decades later, with parties the town never stopped talking about.\n\nThe song plays a classic country-storytelling trick: three verses of someone else's scandal, then the reveal — \"and then it was bought by me\" — folding Swift's own tabloid-magnet Rhode Island summers into Harkness's story of a loud woman blamed for ruining everything. It peaked at No. 13 on the Hot 100, and critics at Pitchfork, Billboard, and American Songwriter ranked it among the year's best songs.",
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Last_Great_American_Dynasty' }],
        photos: [
          {
            // Image-fix pass (2026-07-10): ticket #233 — same fix as the
            // thumbnailUrl above: 1280px render of the same Commons file,
            // verified HTTP 200 + image/jpeg and confirmed legible by eye.
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Holiday_House_on_Watch_Hill.jpg/1280px-Holiday_House_on_Watch_Hill.jpg',
            credit: 'Wikimedia Commons',
            caption: 'Holiday House on Watch Hill, Rhode Island — Rebekah Harkness\'s mansion, later Swift\'s.',
            kind: 'archival',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Rebekah_Harkness_publicity_photo.jpg',
            credit: 'Wikimedia Commons (public domain publicity photo)',
            caption: 'Rebekah Harkness, the "mad" widow of the song\'s first three verses.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 7,
      day: 24,
      category: 'music',
      title: 'epiphany, from a WWII battlefield to a 2020 hospital ward',
      snippet: 'Her grandfather at Guadalcanal in 1942, a nurse on a COVID ward in 2020 — two kinds of trauma nobody comes home able to talk about.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Epiphany_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Her grandfather Dean fought at the Battle of Guadalcanal and never spoke about what he saw there — Swift said she wrote the song by trying "to imagine what would happen in order to make you never be able to speak about something," then drew the line straight to 2020\'s hospital wards, where medical workers were absorbing the same unspeakable weight in twenty-minute breaks between shifts.\n\nAaron Dessner built the ambient, chamber-style arrangement by slowing and reversing instrument recordings into glacial drones under piano and strings, leaving Swift\'s vocal hanging in the middle like a hymn. The quietest song on the album still hit No. 57 on the Hot 100 in folklore\'s all-16-tracks chart week.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Epiphany_(Taylor_Swift_song)' }],
        // Real-photo pass (2026-07-09): public-domain U.S. Marine Corps photo
        // from Wikimedia Commons (license verified on the file page this
        // session). Verified HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/2/21/U.S._Marines_storm_ashore_on_Guadalcanal%2C_7_August_1942_%2880-CF-112-5-3%29.jpg',
            credit: 'U.S. Marine Corps (public domain), via Wikimedia Commons',
            caption: 'U.S. Marines coming ashore at Guadalcanal, August 1942 — the battle Swift\'s grandfather Dean fought in and never spoke about.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 7,
      day: 24,
      category: 'music',
      title: 'seven, a childhood friendship remembered in fragments',
      snippet: 'A seven-year-old\'s memory of a friend in a house she calls "haunted" — too young to understand why, old enough to want to run away with her.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Seven_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Written and produced with Aaron Dessner, who described it as "wistful and nostalgic — looking back at childhood and those childhood feelings," the song watches a friend\'s frightening home life through a seven-year-old\'s eyes in Pennsylvania: the anger she can\'t name, the offer to run away together, folded into tree swings and make-believe.\n\nIn the Long Pond Studio Sessions, Taylor described looking back at that age: "picture me in the trees before I learned civility, I used to scream ferociously anytime I wanted." She\'s never confirmed whether the friend was real or a composite. It debuted at No. 35 on the Hot 100, and critics repeatedly singled it out as one of folklore\'s most moving songs for handling the subject with that light a touch.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Seven_(Taylor_Swift_song)' }],
        // Real-photo pass (2026-07-09): CC BY 2.0 concert photo from Wikimedia
        // Commons, used on the song's own Wikipedia article (license verified
        // this session). Verified HTTP 200 + image/jpeg.
        photos: [
          {
            // Image-fix pass (2026-07-10): ticket #231 — 330px render of this
            // ultra-wide panorama was only ~101px tall (cabin/performer
            // indiscernible). Swapped to the 1280px render of the same Commons
            // file, verified HTTP 200 + image/jpeg and confirmed by eye: moon,
            // cabin silhouette, and the white-dressed performer are all clearly
            // visible at this size.
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Taylor_Swift_The_Eras_Tour_The_Folklore_Set_Era_%2853110011978%29.jpg/1280px-Taylor_Swift_The_Eras_Tour_The_Folklore_Set_Era_%2853110011978%29.jpg',
            credit: 'Paolo V (CC BY 2.0), via Wikimedia Commons',
            caption: 'The folklore set\'s moonlit cabin at the Eras Tour, where the album\'s songs were finally staged live.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 11,
      day: 25,
      category: 'release',
      title: 'folklore: The Long Pond Studio Sessions marks her directorial debut',
      snippet:
        'A surprise Disney+ release, filmed in a secluded Hudson Valley studio with Aaron Dessner and Jack Antonoff — her first time directing a film.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Folklore:_The_Long_Pond_Studio_Sessions',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b5/Folklore_The_Long_Pond_Studio_Sessions_Poster.jpg',
      moment: {
        context:
          'Announced just hours before it hit Disney+ on Nov. 25, 2020 — a surprise drop about a surprise drop — the film was shot in September 2020 at Aaron Dessner\'s Long Pond Studio, a converted barn in the Hudson Valley where parts of folklore were engineered. It was the first time Swift, Dessner, and Jack Antonoff had ever been in a room together: the album had been made entirely remotely, and here they play all 17 songs acoustically between conversations about how each one happened, with Justin Vernon beaming in from Wisconsin for "exile."\n\nIt\'s also where she confirms on camera that co-writer William Bowery is Joe Alwyn. Critics gave it a perfect 100% on Rotten Tomatoes; Rolling Stone\'s Rob Sheffield called it "a stunning musical statement in its own right." The sessions did double duty — recordings from the same stretch fed evermore, released just 16 days later.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Folklore:_The_Long_Pond_Studio_Sessions',
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-live-reviews/taylor-swift-folklore-movie-disney-1095464/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/b/b5/Folklore_The_Long_Pond_Studio_Sessions_Poster.jpg',
            credit: 'Disney+ (official poster)',
            caption: 'Official release poster for folklore: The Long Pond Studio Sessions.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2021,
      month: 3,
      day: 14,
      category: 'business',
      title: 'folklore makes her the first woman to win Album of the Year three times',
      snippet:
        'A third Grammy for Album of the Year — joining Frank Sinatra, Paul Simon, and Stevie Wonder as the only artists ever to do it three times.',
      sourceUrl: 'https://www.cbsnews.com/news/taylor-swift-first-woman-win-album-of-the-year-grammy-awards-three-times/',
      thumbnailUrl:
        'https://assets3.cbsnewsstatic.com/hub/i/r/2021/03/15/e53c1cc2-5b66-4cc7-8ffe-4143fd3635cc/thumbnail/620x445g2/fc83de0ccaff91d78c6330439a42f406/gettyimages-1307122849.jpg',
      moment: {
        context:
          'The March 14, 2021 win — after Fearless in 2010 and 1989 in 2016 — made her the first woman with three Album of the Year Grammys, in a field that included Dua Lipa, Post Malone, HAIM, and Coldplay.\n\nAccepting at the pandemic-limited ceremony, she thanked Jack Antonoff, Aaron Dessner, and engineers Laura Sisk and Jonathan Low ("I had the best time writing songs with you in quarantine"), told Justin Vernon — whom she still had never met in person — "I\'m so excited to meet you someday," and thanked fans for meeting her in "this imaginary world that we created." It was her only win of the night from six nominations, and the one that mattered.',
        sources: [
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-first-woman-win-album-of-the-year-grammy-awards-three-times/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/awards/taylor-swift-wins-album-of-the-year-2021-grammy-awards-folklore-9540496/',
          },
        ],
        photos: [
          {
            url: 'https://assets3.cbsnewsstatic.com/hub/i/r/2021/03/15/e53c1cc2-5b66-4cc7-8ffe-4143fd3635cc/thumbnail/620x445g2/fc83de0ccaff91d78c6330439a42f406/gettyimages-1307122849.jpg',
            credit: 'Kevin Mazur/Getty Images for The Recording Academy',
            caption: 'At the 63rd Grammy Awards, March 14, 2021, where folklore won Album of the Year.',
            kind: 'primary',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2021/03/Taylor-Swift-grammy-award-2021-billboard-1548-1615778248.jpg?w=942&h=628&crop=1',
            credit: 'Kevin Winter/Getty Images for The Recording Academy',
            caption: 'Accepting the Album of the Year Grammy — her third, a first for any woman.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2021,
      month: 3,
      day: 14,
      category: 'fashion',
      title: 'A custom Etro gown for the folklore/evermore medley',
      snippet:
        'A blue-and-gold Etro gown for a Grammy-night medley of "cardigan," "august," and "willow" with Aaron Dessner and Jack Antonoff.',
      sourceUrl: 'https://www.shefinds.com/collections/taylor-swift-etro-grammys-performance-dress/',
      // Image-fix pass (2026-07-10): ticket #227 — the shefinds.com image was
      // the January 2020 Sundance red-carpet look (SUNDANCE step-and-repeat
      // visible in frame), wrong event/year/outfit for this record. Replaced
      // with Billboard's photo of the actual 2021 Grammys folklore/evermore
      // medley performance (moss-covered cabin staging, Jack Antonoff on
      // guitar, Swift in the gold/blue Etro gown) — verified HTTP 200 +
      // image/jpeg, downloaded and confirmed by eye, credit line from the
      // Billboard article caption.
      thumbnailUrl:
        'https://www.billboard.com/wp-content/uploads/2021/03/taylor-swift-2021-grammy-performance-billboard-1548-1615770993.jpg?w=942&h=628&crop=1',
      moment: {
        context:
          'The floor-length blue-and-gold Etro gown — high slit, seventies lines — was built for the night\'s most theatrical staging: a moss-covered cabin on a woodland hillside set, where she moved through "cardigan," "august," and "willow" with Aaron Dessner and Jack Antonoff. Etro posted a sketch of the design after the show.\n\nIt was one half of a two-look night: on the red carpet she wore a custom floral Oscar de la Renta mini with botanical appliqués tacked on individually — plus a matching mask — a look Oscar de la Renta itself billed as "Floral Folklore."',
        sources: [
          {
            outlet: 'SheFinds',
            url: 'https://www.shefinds.com/collections/taylor-swift-etro-grammys-performance-dress/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/pop/taylor-swift-floral-2021-grammy-awards-dress-video-9540868/',
          },
        ],
        photos: [
          {
            // Image-fix pass (2026-07-10): ticket #227 — same replacement as
            // thumbnailUrl above (see comment there for verification detail).
            url: 'https://www.billboard.com/wp-content/uploads/2021/03/taylor-swift-2021-grammy-performance-billboard-1548-1615770993.jpg?w=942&h=628&crop=1',
            credit: 'TAS Rights Management 2021, via Getty Images / Billboard',
            caption: 'The custom Etro gown during the folklore medley staging at the 2021 Grammys.',
            kind: 'primary',
          },
        ],
      },
    },

    // --- Fashion/photo depth pass (2026-07-04)
    {
      year: 2020,
      month: 7,
      day: 24,
      category: 'fashion',
      title: 'The "cardigan" video: a nap dress and the cottagecore uniform',
      snippet:
        'A loose white nightgown-style "nap dress" worn through nearly the whole "cardigan" video, finished with an oversized cable-knit cardigan — the look that helped push cottagecore into the mainstream.',
      sourceUrl: 'https://www.nickiswift.com/229802/hidden-details-you-missed-in-taylor-swifts-new-cardigan-video/',
      thumbnailUrl:
        'https://www.nickiswift.com/img/gallery/hidden-details-you-missed-in-taylor-swifts-new/taylor-swifts-nap-dress-pays-homage-to-whimsy-1595575441.jpg',
      moment: {
        context:
          'Swift wears one outfit for nearly the entire "cardigan" video: a flowing white nightgown-style dress in the "nap dress" trend that broke out in 2020, worn with the cream cable-knit cardigan (star embroidery, folklore patch) at the end. Filmed under pandemic protocols with a skeleton crew, social distancing, and an on-set medical inspector.\n\nThe single-costume approach fit a video Swift wrote, directed, and styled entirely herself — one dress carried through the story\'s three worlds, from candlelit cottage to mossy forest to storm-tossed sea, so the cardigan\'s appearance in the final scene lands as the only wardrobe change in the whole film. The soft, homespun look helped push the cottagecore aesthetic into the mainstream — and, as Elite Daily put it, was among the easiest Swift looks to recreate at home.',
        sources: [
          {
            outlet: 'Nicki Swift',
            url: 'https://www.nickiswift.com/229802/hidden-details-you-missed-in-taylor-swifts-new-cardigan-video/',
          },
          {
            outlet: 'Elite Daily',
            url: 'https://www.elitedaily.com/p/taylor-swifts-outfit-from-her-cardigan-music-video-is-the-easiest-to-copy-29940067',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Cardigan_(song)',
          },
        ],
        photos: [
          {
            url: 'https://www.nickiswift.com/img/gallery/hidden-details-you-missed-in-taylor-swifts-new/taylor-swifts-nap-dress-pays-homage-to-whimsy-1595575441.jpg',
            credit: 'Taylor Swift/VEVO',
            caption: 'The white nap dress in the self-directed "cardigan" music video.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 7,
      day: 24,
      category: 'fashion',
      title: 'No glam team: self-styled hair and makeup for the folklore era',
      snippet:
        'With pandemic protocols keeping hair and makeup artists off set, Swift did her own — natural, barely-there makeup and two low braided buns — for both the "cardigan" video and the album photoshoot.',
      sourceUrl:
        'https://www.etonline.com/taylor-swift-recalls-doing-her-own-hair-and-makeup-for-folklore-album-art-guess-ill-braid-it-229646',
      thumbnailUrl:
        'https://www.nickiswift.com/img/gallery/hidden-details-you-missed-in-taylor-swifts-new/intro-1595575441.jpg',
      moment: {
        context:
          'Swift later recalled the DIY process for the album art: "Just was like, \'Guess I\'ll braid it? I don\'t know.\'" Gone were the red lips and cat-eyes of prior eras; in their place, natural waves, a messy low bun or two braided knots, and makeup-free close-ups — a stripped-down beauty look that matched the album\'s whole visual turn.\n\nThe same do-it-yourself rule covered the "cardigan" video, which she wrote, directed, and styled herself under pandemic protocols that kept hair and makeup artists off set. What started as a health necessity became the era\'s aesthetic signature: visuals made almost entirely by her own hands.',
        sources: [
          {
            outlet: 'ET Online',
            url: 'https://www.etonline.com/taylor-swift-recalls-doing-her-own-hair-and-makeup-for-folklore-album-art-guess-ill-braid-it-229646',
          },
          {
            outlet: 'Nicki Swift',
            url: 'https://www.nickiswift.com/229802/hidden-details-you-missed-in-taylor-swifts-new-cardigan-video/',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Cardigan_(song)',
          },
        ],
        photos: [
          {
            url: 'https://www.nickiswift.com/img/gallery/hidden-details-you-missed-in-taylor-swifts-new/intro-1595575441.jpg',
            credit: 'Taylor Swift/VEVO',
            caption: 'Self-styled hair and makeup in the "cardigan" music video.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 7,
      day: 24,
      category: 'fashion',
      title: 'The folklore album cover: a self-directed, black-and-white photoshoot',
      snippet:
        'Shot by Beth Garrabrant with no styling team on hand, in black and white for the first time — Swift standing alone in a misty forest in a plaid coat over a white prairie dress.',
      sourceUrl: 'https://www.femestella.com/taylor-swift-folklore-photoshoot-by-photographer-beth-garrabrant/',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f8/Taylor_Swift_-_Folklore.png',
      moment: {
        context:
          'Swift styled her own hair, makeup, and wardrobe for the shoot — cardigans, oversized plaid blazers, and rugby shirts, worn in the summer heat of a friend\'s forest. She and photographer Beth Garrabrant referenced Surrealist work and early autochromes and ambrotypes, and shot the whole series in black and white, a first for Garrabrant, who usually works in color.\n\nIt was a deliberate departure from her earlier album cycles\' larger production teams — no glam squad, no set build, just the two of them in the woods. The resulting frame of Swift standing small among the trees became the cover, and the surrounding shots were posted as a grid of captionless black-and-white photos in the July 23 announcement.',
        sources: [
          {
            outlet: 'Femestella',
            url: 'https://www.femestella.com/taylor-swift-folklore-photoshoot-by-photographer-beth-garrabrant/',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Folklore_(Taylor_Swift_album)' },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/f8/Taylor_Swift_-_Folklore.png',
            credit: 'Republic Records (official album cover, photo by Beth Garrabrant)',
            caption: 'The folklore album cover — Beth Garrabrant\'s black-and-white forest frame.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 11,
      day: 25,
      category: 'fashion',
      title: 'A Free People velvet shirt dress for the Long Pond Studio Sessions',
      snippet:
        'For her directorial debut on Disney+, Swift wore the Free People Lux Velvet Shirt Dress with a Tiffany & Co. bracelet — a cozy, intimate wardrobe matching the stripped-down studio set.',
      sourceUrl:
        'https://fashionsizzle.com/2020/11/28/taylor-swift-wore-free-people-blouse-shirt-dress-for-folklore-the-long-pond-studio-sessions/',
      thumbnailUrl: 'https://fashionsizzle.com/wp-content/uploads/2020/11/462213.jpg',
      moment: {
        context:
          'Swift wore the Free People Lux Velvet Shirt Dress, paired with a Tiffany & Co. Infinity bracelet and a Melinda Maria Soleil stacking ring set, while filming the Long Pond Studio Sessions with Aaron Dessner and Jack Antonoff — a soft, low-key wardrobe fitting the candlelit, unplugged staging of the special.\n\nLike everything else in the film, which premiered on Disney+ on Nov. 25, 2020, the styling read as deliberately domestic: a shirt dress on a couch in a converted barn, about as far from a stadium costume as her wardrobe had ever been. It matched the era\'s whole self-styled turn — the same stretch in which she was doing her own hair and makeup for the album art and the "cardigan" video.',
        sources: [
          {
            outlet: 'Fashion Sizzle',
            url: 'https://fashionsizzle.com/2020/11/28/taylor-swift-wore-free-people-blouse-shirt-dress-for-folklore-the-long-pond-studio-sessions/',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Folklore:_The_Long_Pond_Studio_Sessions',
          },
        ],
        photos: [
          {
            url: 'https://fashionsizzle.com/wp-content/uploads/2020/11/462213.jpg',
            credit: 'Disney+ (still from folklore: The Long Pond Studio Sessions)',
            caption: 'The Free People velvet shirt dress, in a still from the Disney+ special.',
            kind: 'archival',
          },
        ],
      },
    },
    // --- Sightings research pass (2026-07-05): searched extensively for
    // real candid/paparazzi public sightings within this era's real-world
    // span (2020-07-24 to 2020-12-10) — grocery runs, family visits, dates
    // with Joe Alwyn, Long Pond travel, etc. Found none that clear the bar.
    // The only "rare outing" paparazzi photos of Swift and Alwyn near this
    // window are dated Feb 2020 (before the window) and Jan 11 2021 (after
    // it, likely evermore-era territory already covered elsewhere) — both
    // out of range. Every other public moment in-window (the Sept 16, 2020
    // ACM "betty" performance, the Nov 22, 2020 AMA win, the Long Pond
    // Studio Sessions premiere) was a scheduled broadcast/promo appearance,
    // not a candid sighting. This era genuinely has ~zero real sightings —
    // confirmed rather than padded. No sighting items added.
    {
      year: 2020,
      month: 7,
      day: 24,
      category: 'fashion',
      title: 'The original folklore cardigan sells out and becomes a piece of merch history',
      snippet:
        'A cream cable-knit cardigan with gray star embroidery and a "folklore album" patch, sold on her official store — it sold out almost instantly in July 2020 and stayed a coveted rarity for years.',
      sourceUrl: 'https://www.hercampus.com/style/taylor-swift-folklore-cardigan-restock/',
      thumbnailUrl:
        'https://cdn.hercampus.com/SH6M70M3/as/c3hfjtcwgp4ffqj8pc59g3/taylor_swift_folklore_cardigan?width=1024&height=1024&fit=cover&auto=webp&dpr=4',
      moment: {
        context:
          'The cardigan Swift wears at the end of the "cardigan" video — tan cable knit, navy stripes, gray elbow patches, star embroidery, and a "folklore album" patch on the chest — went up for sale on her official store alongside the album and sold out almost immediately. It became one of the most sought-after pieces of Swift merch of the whole decade.\n\nIt wasn\'t restocked until July 24, 2024 — folklore\'s fourth anniversary — and even then only as a 72-hour window, priced at $70 with a four-per-order limit. The rerun wasn\'t quite the original, either: the 2024 version swapped the folklore chest patch for a Taylor Swift one and ran longer than the original, which kept the true 2020 cardigan a collector\'s item.',
        sources: [
          { outlet: 'Her Campus', url: 'https://www.hercampus.com/style/taylor-swift-folklore-cardigan-restock/' },
          { outlet: 'Capital FM', url: 'https://www.capitalfm.com/news/music/taylor-swift-cardigans-merch/' },
        ],
        photos: [
          {
            url: 'https://cdn.hercampus.com/SH6M70M3/as/c3hfjtcwgp4ffqj8pc59g3/taylor_swift_folklore_cardigan?width=1024&height=1024&fit=cover&auto=webp&dpr=4',
            credit: 'Taylor Swift Store',
            caption: 'The official folklore cardigan as sold on Swift\'s store.',
            kind: 'primary',
          },
        ],
      },
    },

    // --- Music/business depth pass (2026-07-05): song-backstory and
    // chart/critical-reception items for tracks and facts not yet covered,
    // sourced from dedicated Wikipedia song pages, NME (citing a December
    // 2020 Entertainment Weekly interview), Billboard, and Rolling Stone.
    {
      year: 2020,
      month: 7,
      day: 24,
      category: 'music',
      title: 'mirrorball, written right after the Lover Fest tour was scrapped',
      snippet:
        "Swift and Jack Antonoff wrote mirrorball after her Lover Fest tour was cancelled for the pandemic — her own words: \"a metaphor for celebrity,\" but also for anyone who feels they have to be a different version of themselves for different people.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Mirrorball_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          'In the Long Pond Studio Sessions documentary, Swift explained the song\'s meaning directly: "It\'s a metaphor for celebrity, but it\'s also a metaphor for so many people who feel like they have to be different versions of themselves for different people." She wrote it with Jack Antonoff after her planned Lover Fest tour was cancelled at the start of the pandemic, channeling how fans find "solace on the dance floor" against her own anxiety about staying relevant.\n\nAntonoff\'s production wraps the idea in reverb-heavy guitars, pedal steel colors, and live drums — critics kept reaching for words like "warm" and "sparkling" to describe the glow. It reached No. 26 on the Hot 100 in the album\'s opening week and kept growing in stature from there: it became a fixture of critics\' album-highlight picks, and in 2025 Swift herself named it among her five best songs.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Mirrorball_(song)' }],
        // Real-photo pass (2026-07-09): thumbnail from the official lyric
        // video on the Taylor Swift YouTube channel — id verified via YouTube
        // oEmbed (title + author "Taylor Swift") this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/KaM1bCuG4xo/hqdefault.jpg',
            credit: 'Taylor Swift via YouTube (official lyric video)',
            caption: 'The disco ball from the official "mirrorball" lyric video.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 12,
      day: 9,
      category: 'music',
      title: 'mad woman, and the dispute Taylor confirmed inspired it',
      snippet:
        'Written with Aaron Dessner about "female rage," mad woman targets the gaslighting Swift said she felt during her masters dispute — a connection she confirmed herself in a December 2020 interview, comparing the fallout to a divorce.',
      sourceUrl: 'https://www.nme.com/news/music/taylor-swift-says-her-dispute-with-scooter-braun-felt-like-a-divorce-2834880',
      thumbnailUrl: null,
      moment: {
        context:
          'In a December 2020 Entertainment Weekly interview, Swift confirmed "mad woman" (along with "my tears ricochet") grew out of her 2019 masters dispute with Scooter Braun and former label boss Scott Borchetta, saying the fallout from the 15-year professional relationship left her "very triggered by any stories, movies, or narratives revolving around divorce."\n\nOn the song itself, co-written and produced with Aaron Dessner, Swift said its theme of gaslighting was "the most rage-provoking element of being a female." The track works the accusation in circles — a woman called crazy acting exactly as crazy as she\'s been told she is — and it sits directly before "epiphany" in the tracklist, two of the album\'s heaviest songs back to back.',
        sources: [
          {
            outlet: 'NME',
            url: 'https://www.nme.com/news/music/taylor-swift-says-her-dispute-with-scooter-braun-felt-like-a-divorce-2834880',
          },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Mad_Woman' },
        ],
        // Real-photo pass (2026-07-09): thumbnail from the official lyric
        // video on the Taylor Swift YouTube channel — id verified via YouTube
        // oEmbed (title + author "Taylor Swift") this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/6DP4q_1EgQQ/hqdefault.jpg',
            credit: 'Taylor Swift via YouTube (official lyric video)',
            caption: 'The flame imagery of the official "mad woman" lyric video.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 7,
      day: 24,
      category: 'music',
      title: 'invisible string, and "a single thread that ties you to your fate"',
      snippet:
        'Swift built the song around one image from her album announcement — "a single thread that, for better or for worse, ties you to your fate" — tracing years of near-misses back to a Nashville park where she read as a girl.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Invisible_String',
      thumbnailUrl: null,
      moment: {
        context:
          'Co-written and produced with Aaron Dessner, the song grew from an idea Swift described in her folklore announcement: "a single thread that, for better or for worse, ties you to your fate." Its lyrics recall reading as a girl at Nashville\'s Centennial Park — "green was the color of the grass where I used to read at Centennial Park" — years before meeting the person the song is about; critics have read those details as tracing the path to her relationship with Joe Alwyn.\n\nNPR ranked it No. 22 on its 100 best songs of 2020, praising "all the beautiful detail, all the muscular melody and immaculately placed acoustic production details." On an album of invented characters, it was the track fans treated as the plainly happy autobiographical one — the rare folklore song where the string holds.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Invisible_String' }],
        // Real-photo pass (2026-07-09): CC BY 3.0 photo of Centennial Park
        // from Wikimedia Commons, used on the song's own Wikipedia article
        // (license verified this session). Verified HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Centennial_Park_and_Parthenon_Nashville_TN_2013-12-28_008.jpg/500px-Centennial_Park_and_Parthenon_Nashville_TN_2013-12-28_008.jpg',
            credit: 'Thomas R Machnitzki (CC BY 3.0), via Wikimedia Commons',
            caption: 'Centennial Park in Nashville — the park named in the song\'s opening verse.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 7,
      day: 24,
      category: 'music',
      title: 'hoax, the last song written for the album',
      snippet:
        'Swift wrote hoax\'s lyrics just days before folklore\'s surprise release, then told Aaron Dessner not to overthink the production — the last song finished became the one that closes the record.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Hoax_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          'According to Wikipedia\'s sourcing, "hoax" was the final track written for folklore — Swift wrote its lyrics only days before the July 24, 2020 release, and she and Aaron Dessner agreed it should close the album. On direction, she told him not to "try to give it any other space other than what feels natural" to him.\n\nDessner recorded the instrumentation (piano, acoustic and electric guitars, OP-1, synth bass) at Long Pond Studio in the Hudson Valley, with Rob Moose adding orchestration, violin, and viola. The result is the album\'s starkest ending: a piano ballad that refuses resolution, closing the standard edition on a bruise rather than a bow.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Hoax_(song)' }],
        // Real-photo pass (2026-07-09): thumbnail from the official lyric
        // video on the Taylor Swift YouTube channel — id verified via YouTube
        // oEmbed (title + author "Taylor Swift") this session.
        // Photo-enrichment run 17 (2026-07-18, #762): no official upload of
        // the hoax Long Pond performance exists (only re-uploads and the
        // auto-generated Topic channel — rejected), so the second image is a
        // clearly-labeled CC BY-SA 4.0 Commons reference photo of Aaron
        // Dessner, who produced and recorded the song at Long Pond. License
        // verified via the Commons API (photographer Kim Metso), URL verified
        // HTTP 200 + image/jpeg, downloaded and visually confirmed. Per-image
        // focal points set by eye.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/ryLGxpjwAhM/hqdefault.jpg',
            credit: 'Taylor Swift via YouTube (official lyric video)',
            caption: 'The stormy coastline of the official "hoax" lyric video.',
            kind: 'archival',
            focalPoint: '48% 40%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Aaron_Dessner_at_Way_Out_West_2014.jpg',
            credit: 'Kim Metso (CC BY-SA 4.0), via Wikimedia Commons',
            caption: 'For reference — Aaron Dessner, who Swift told not to overthink the production of the album\'s last-written song.',
            kind: 'reference',
            focalPoint: '57% 20%',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 8,
      day: 2,
      category: 'business',
      title: "folklore's surprise debut: 846,000 units and her seventh No. 1 album",
      snippet:
        'With essentially no advance promotion, folklore opened with 846,000 equivalent album units — 615,000 in pure sales plus 289.85 million on-demand streams, the biggest streaming week of 2020 for any album by a woman.',
      sourceUrl: 'https://www.billboard.com/pro/taylor-swift-folklore-billboard-200-number-1/',
      thumbnailUrl: null,
      moment: {
        context:
          "folklore debuted atop the Billboard 200 with 846,000 equivalent album units — Swift's seventh No. 1 album — including 615,000 in pure album sales, the largest sales week for any album since her own Lover (679,000) the year before.\n\nIts 218,000 in streaming-equivalent units came from 289.85 million on-demand streams of the album's tracks, the largest streaming week of 2020 for an album by a woman. The number settled an open industry question in one week: a hushed indie-folk record with no lead single, no physical retail lead time, and sixteen hours of promotion had just posted the biggest U.S. sales week of any album in nearly a year.",
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-folklore-billboard-200-number-1/',
          },
        ],
        // Real-photo pass (2026-07-09): official album cover from Wikipedia's
        // stable upload.wikimedia.org copy. Verified HTTP 200 + image/png.
        // Photo-enrichment run 17 (2026-07-18, #762): added the cream-sweater
        // Beth Garrabrant press-kit portrait from Billboard's own folklore
        // chart coverage (billboard.com/wp-content, no watermark) — verified
        // HTTP 200 + image/jpeg, downloaded and visually confirmed. Per-image
        // focal points set by eye.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/f8/Taylor_Swift_-_Folklore.png',
            credit: 'Republic Records (official album cover, photo by Beth Garrabrant)',
            caption: 'folklore, which opened with 846,000 equivalent units in its first week.',
            kind: 'primary',
            focalPoint: '48% 70%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2020/07/03-taylor-swift-cr-Beth-Garrabrant-press-photo-2020-billboard-1548-1595547189.jpg?w=1024',
            credit: 'Beth Garrabrant',
            caption: 'The folklore press-kit portrait that ran with the chart coverage of the surprise No. 1 debut.',
            kind: 'archival',
            focalPoint: '42% 40%',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 10,
      day: 31,
      category: 'business',
      title: 'folklore becomes the first million-selling album of 2020 in the US',
      snippet:
        "By late October, folklore had sold 1.038 million copies in the US — the first album to cross a million that year — while returning to No. 1 on the Billboard 200 for an eighth nonconsecutive week.",
      sourceUrl: 'https://www.billboard.com/pro/taylor-swift-folklore-first-million-selling-album-2020/',
      thumbnailUrl: null,
      moment: {
        context:
          'On the chart dated Oct. 31, 2020, folklore returned to No. 1 on the Billboard 200 for an eighth nonconsecutive week after selling another 57,000 copies in the U.S. in the tracking week ending Oct. 22 — pushing its total past 1.038 million copies sold and making it the first album to sell a million copies in the U.S. in 2020.\n\nThe back-to-back symmetry was hard to miss: Swift\'s prior album, Lover, had been the only album to sell a million U.S. copies in 2019, with 1.09 million that year. In a collapsing sales market, she had now delivered each year\'s first album to cross the million mark two years running — one made as a maximalist pop rollout, the other with sixteen hours\' notice from lockdown.',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/pro/taylor-swift-folklore-first-million-selling-album-2020/',
          },
        ],
        // Real-photo pass (2026-07-09): folklore-era publicity photo, same
        // stable Hollywood Reporter CDN copy used on this era's chart item.
        // Verified HTTP 200 + image/jpeg this session.
        // Photo-enrichment run 17 (2026-07-18, #762): added the gingham-dress
        // Beth Garrabrant press frame from the body of Billboard's own
        // million-selling-album story (billboard.com/wp-content, no
        // watermark) — verified HTTP 200 + image/jpeg, downloaded and
        // visually confirmed as a distinct frame from the THR copy above.
        // Per-image focal points set by eye.
        photos: [
          {
            url: 'https://www.hollywoodreporter.com/wp-content/uploads/2020/08/taylor_swift-folklore-_publicity_-_h_2020.jpg?w=1296&h=730&crop=1',
            credit: 'Beth Garrabrant',
            caption: 'folklore-era publicity photograph by Beth Garrabrant.',
            kind: 'archival',
            focalPoint: '52% 22%',
          },
          {
            url: 'https://www.billboard.com/wp-content/uploads/2020/07/01-taylor-swift-cr-Beth-Garrabrant-press-photo-2020-billboard-1548-1595547205.jpg?w=1024',
            credit: 'Beth Garrabrant',
            caption: 'From the folklore press shoot — the image Billboard ran with the million-copies milestone.',
            kind: 'archival',
            focalPoint: '34% 16%',
          },
        ],
      },
    },
    {
      year: 2020,
      month: 12,
      category: 'business',
      title: 'Rolling Stone names folklore the best album of 2020',
      snippet:
        "Topping Rolling Stone's year-end ranking of the 50 best albums of 2020, folklore was called potentially \"the definitive quarantine album.\"",
      sourceUrl: 'https://www.rollingstone.com/music/music-lists/best-albums-2020-1096814/taylor-swift-folklore-1096815/',
      thumbnailUrl: null,
      moment: {
        context:
          "Rolling Stone put folklore at No. 1 on its year-end list of the 50 best albums of 2020, calling it potentially \"the definitive quarantine album.\"\n\nThe writeup framed the win as a creative consequence of the shutdown: without the pressure of a typical rollout, \"Swift shed the über-pop trappings of her previous album, Lover, for a project that put her once-in-a-generation songwriting talent front and center,\" with contributions from the National's Aaron Dessner and Bon Iver's Justin Vernon.",
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-lists/best-albums-2020-1096814/taylor-swift-folklore-1096815/',
          },
        ],
        // Real-photo pass (2026-07-09): official album cover from Wikipedia's
        // stable upload.wikimedia.org copy. Verified HTTP 200 + image/png.
        // Photo-enrichment run 17 (2026-07-18, #762): added the lead collage
        // art of the Rolling Stone list itself (the article body's folklore
        // image is just the album cover — rejected as a duplicate). Hosted on
        // rollingstone.com/wp-content, no watermark; verified HTTP 200 +
        // image/jpeg, downloaded and visually confirmed (Swift top right).
        // Per-image focal points set by eye.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/f8/Taylor_Swift_-_Folklore.png',
            credit: 'Republic Records (official album cover, photo by Beth Garrabrant)',
            caption: 'folklore — Rolling Stone\'s No. 1 album of 2020.',
            kind: 'primary',
            focalPoint: '48% 70%',
          },
          {
            url: 'https://www.rollingstone.com/wp-content/uploads/2020/12/Albums.jpg?w=1200&h=800&crop=1',
            credit: 'Rolling Stone',
            caption: 'The lead art of Rolling Stone\'s 50 Best Albums of 2020 list — Swift, top right, above the field she topped.',
            kind: 'archival',
            focalPoint: '78% 28%',
          },
        ],
      },
    },

    // --- Thin-era top-up (2026-07-08, audit rollout PR 2): release items,
    // remaining song stories, the era's business wavetops, and the one real,
    // sourced relationship moment (the William Bowery reveal). Tour and
    // sighting stay genuinely empty — no touring happened and the 2026-07-05
    // sightings research pass (above) confirmed ~zero candid sightings.
    // New items carry the audit's additive provenance fields.
    {
      slug: 'folklore-sixteen-hour-announcement',
      year: 2020,
      month: 7,
      day: 23,
      category: 'release',
      title: 'Sixteen hours\' notice: the announcement that invented the surprise era',
      snippet:
        '"Most of the things I had planned this summer didn\'t end up happening, but there is something I hadn\'t planned on that DID happen" — posted the morning of July 23, 2020. The album arrived at midnight.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Folklore_(Taylor_Swift_album)',
      thumbnailUrl: null,
      moment: {
        context:
          'After years of elaborate months-long rollouts, folklore got a same-day Instagram post announcing an album written and recorded entirely "in isolation" — with the "cardigan" video, shot under pandemic protocols, dropping alongside it at midnight. The announcement came dressed as its own reveal: a grid of captionless black-and-white forest photographs from the Beth Garrabrant cover shoot, posted with no advance warning of any kind.\n\nThe rollout compression extended to retail — deluxe CDs and vinyl in alternate covers went up only through her own website — and the no-lead-time surprise drop became a template she would reuse for evermore five months later.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Folklore_(Taylor_Swift_album)',
            source_title: 'Folklore (Taylor Swift album)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): official album cover — the image the
        // announcement itself revealed. Stable upload.wikimedia.org copy,
        // verified HTTP 200 + image/png this session.
        // Photo-enrichment run 17 (2026-07-18, #762): focal point only. No
        // verifiable distinct second image — the nine-photo Instagram grid IS
        // the cover image already shown here, and the outlet stills found for
        // the announcement stories are logo-branded video frames (rejected).
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/f/f8/Taylor_Swift_-_Folklore.png',
            credit: 'Republic Records (official album cover, photo by Beth Garrabrant)',
            caption: 'The cover art revealed in the July 23, 2020 announcement post.',
            kind: 'primary',
            focalPoint: '48% 70%',
          },
        ],
      },
    },
    {
      slug: 'exile-bon-iver-duet',
      year: 2020,
      month: 7,
      day: 24,
      category: 'music',
      title: 'exile: a break-up seen from both sides, with Bon Iver in the other corner',
      snippet:
        'Justin Vernon\'s low growl and Taylor\'s answer, talking past each other in the same chorus — "you never gave a warning sign" / "I gave so many signs." Recorded remotely, the two never in the same room.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Exile_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'The song started at home: Joe Alwyn — still hidden behind the William Bowery credit — wrote the piano melody and the first verse, and Swift cut a demo singing both the male and female parts herself before Aaron Dessner shaped the arrangement and Justin Vernon tracked his side from April Base, his Wisconsin studio. The bridge is built as actual counterpoint, two independent melodic lines arguing over each other rather than trading bars — the structural trick everyone covers.\n\nReleased as a single on Aug. 3, 2020, it debuted at No. 6 on the Hot 100, became Bon Iver\'s highest-charting song anywhere, and earned a Grammy nomination for Best Pop Duo/Group Performance. Swift and Vernon still hadn\'t met in person by the time the nomination landed — the whole collaboration, like the album around it, happened over sent files.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Exile_(Taylor_Swift_song)',
            source_title: 'Exile (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-album-reviews/taylor-swift-leaves-her-comfort-zones-behind-on-the-head-spinning-heart-breaking-folklore-1033533/',
            source_title: 'Taylor Swift Leaves Her Comfort Zones Behind on the Head-Spinning, Heartbreaking Folklore',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): CC BY 2.0 photo of Justin Vernon from
        // Wikimedia Commons, used on the song's own Wikipedia article
        // (license verified this session). Verified HTTP 200 + image/jpeg.
        // Photo-enrichment run 17 (2026-07-18, #762): added the title card of
        // the official "exile" lyric video — id verified via YouTube oEmbed
        // (title "Taylor Swift – exile (feat. Bon Iver) (Official Lyric
        // Video)", channel "Taylor Swift"); thumbnail verified HTTP 200 +
        // image/jpeg, downloaded and visually confirmed (aerial forest path,
        // lone figure). Per-image focal points set by eye.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Justin_Vernon_at_Jazz_Fest_2012.jpg/500px-Justin_Vernon_at_Jazz_Fest_2012.jpg',
            credit: 'Nikko Russano (CC BY 2.0), via Wikimedia Commons',
            caption: 'Justin Vernon of Bon Iver, whose duet vocal made "exile" the band\'s highest-charting song.',
            kind: 'archival',
            focalPoint: '47% 35%',
          },
          {
            url: 'https://i.ytimg.com/vi/osdoLjUNFnA/hqdefault.jpg',
            credit: 'Taylor Swift via YouTube (official lyric video)',
            caption: 'The lone figure on a darkening path — the official "exile" lyric video.',
            kind: 'archival',
            focalPoint: '50% 45%',
          },
        ],
      },
    },
    {
      slug: 'my-tears-ricochet-first-written',
      year: 2020,
      month: 7,
      day: 24,
      category: 'music',
      title: 'my tears ricochet, the first song written for the album — alone',
      snippet:
        'The first folklore song she wrote, and one she wrote solo: a narrator singing at her own funeral to the "embittered tormentor" who showed up anyway. Track five, of course.',
      sourceUrl: 'https://en.wikipedia.org/wiki/My_Tears_Ricochet',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift described it as being about "a person who was your best friend" turning on you, and in a December 2020 Entertainment Weekly interview confirmed it (with "mad woman") as one of the songs that grew out of the 2019 sale of her masters. Produced with Jack Antonoff, it holds folklore\'s track-five slot in her vulnerable-song tradition.\n\nThe conceit is gothic: the narrator is a dead woman watching her own funeral, where the person who wronged her — someone she once loved — has shown up to grieve anyway. Swift has said she was drawn to divorce narratives in that stretch (she\'d been affected by 2019\'s Marriage Story), and the song borrows that language of a bond dissolving into claims on what\'s left. It was the very first song written for folklore, and it debuted at No. 16 on the Hot 100 in the album\'s opening week.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/My_Tears_Ricochet',
            source_title: 'My Tears Ricochet',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'NME',
            url: 'https://www.nme.com/news/music/taylor-swift-says-her-dispute-with-scooter-braun-felt-like-a-divorce-2834880',
            source_title: 'Taylor Swift says her dispute with Scooter Braun felt like a divorce',
            publisher: 'NME',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): CC BY-SA 2.0 concert photo from
        // Wikimedia Commons, used on the song's own Wikipedia article
        // (license verified this session). Verified HTTP 200 + image/jpeg.
        // Photo-enrichment run 17 (2026-07-18, #762): added the title card of
        // the official "my tears ricochet" lyric video — id verified via
        // YouTube oEmbed (title "Taylor Swift – my tears ricochet (Official
        // Lyric Video)", channel "Taylor Swift"); thumbnail verified HTTP 200
        // + image/jpeg, downloaded and visually confirmed (moonlit dark
        // water). Per-image focal points set by eye.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Taylor_Swift_Eras_Tour_-_Arlington_TX_20230331_-_My_Tears_Ricochet_%28cropped%29.jpg/500px-Taylor_Swift_Eras_Tour_-_Arlington_TX_20230331_-_My_Tears_Ricochet_%28cropped%29.jpg',
            credit: 'Ronald Woan (CC BY-SA 2.0), via Wikimedia Commons',
            caption: 'Performing "my tears ricochet" in the folklore set at the Eras Tour, Arlington, March 2023.',
            kind: 'archival',
            focalPoint: '50% 20%',
          },
          {
            url: 'https://i.ytimg.com/vi/OWbDJFtHl3w/hqdefault.jpg',
            credit: 'Taylor Swift via YouTube (official lyric video)',
            caption: 'Moonlight on black water — the official "my tears ricochet" lyric video.',
            kind: 'archival',
            focalPoint: '50% 50%',
          },
        ],
      },
    },
    {
      slug: 'august-augusta-or-augustine',
      year: 2020,
      month: 7,
      day: 24,
      category: 'music',
      title: 'august, and the girl Taylor says might be named Augusta. Or Augustine.',
      snippet:
        'The love triangle\'s third narrator never gets named in the lyrics — she\'s just the summer that "slipped away." In the Long Pond Sessions, Taylor mused the character was "Augusta or Augustine," and fans made it canon.',
      sourceUrl: 'https://en.wikipedia.org/wiki/August_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Written and produced with Jack Antonoff, "august" is the triangle\'s sympathetic wildcard — Swift framed the character sympathetically, deserving kindness rather than blame for a romance that was never really hers. It entered the Hot 100 at No. 23 in the album\'s opening week, and the outro builds to what one critic described as a full-orchestra major-chord climax — the album\'s biggest purely musical release.\n\nIts stature only grew with time: Rolling Stone\'s Rob Sheffield ranked it fifth among all of Swift\'s songs in his 2021 catalog ranking, calling it "the album\'s most plainly beautiful ballad," and it earned a spot in the Grammys 2021 folklore medley and the Eras Tour\'s folklore act.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/August_(Taylor_Swift_song)',
            source_title: 'August (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): CC BY-SA 2.0 concert photo from
        // Wikimedia Commons, used on the song's own Wikipedia article
        // (license verified this session). Verified HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Taylor_Swift_Eras_Tour_-_Arlington%2C_TX_-_Folklore_act_3_%28cropped%29.jpg/500px-Taylor_Swift_Eras_Tour_-_Arlington%2C_TX_-_Folklore_act_3_%28cropped%29.jpg',
            credit: 'Ronald Woan (CC BY-SA 2.0), via Wikimedia Commons',
            caption: 'Performing "august" during the Eras Tour folklore act, Arlington, March 2023.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'the-lakes-deluxe-bonus',
      year: 2020,
      month: 8,
      day: 18,
      category: 'release',
      title: 'the lakes: the Lake District escape fantasy, saved for the deluxe edition',
      snippet:
        'The lone bonus track — a Windermere daydream about quitting the discourse and moving somewhere the poets went to die — arrived Aug. 18 on folklore\'s deluxe editions, three weeks after the album.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Lakes_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Written with Jack Antonoff and inspired by England\'s Lake District and its Romantic poets, "the lakes" was folklore\'s intended epilogue — Swift later said she considered it the album\'s thesis statement about retreating from public life, which is why it closed every deluxe pressing rather than opening anything. The Wordsworth homage is built right into the writing, down to the pun critics flagged on the poet\'s own name: "tell me what are my words worth."\n\nAntonoff had first imagined it as a big orchestral piece before Swift asked for the scaled-down arrangement that shipped — and the bigger version eventually surfaced anyway: a fuller, orchestral "original version" was released on July 24, 2021, to mark folklore\'s first anniversary.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/The_Lakes_(song)',
            source_title: 'The Lakes (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): official cover art (exact filename
        // from the Wikipedia article HTML) plus the public-domain Wordsworth
        // portrait used on the same article. Both verified HTTP 200.
        // Photo-enrichment run 17 (2026-07-18, #762): focal points only — the
        // page already carries two distinct verified photos. Both downloaded
        // and viewed this session; values set per image, by eye.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/a/a2/The_Lakes_%28Original_Version%29_-_Taylor_Swift.png',
            credit: 'Republic Records',
            caption: 'Cover art for "the lakes (original version)," released on folklore\'s first anniversary.',
            kind: 'primary',
            focalPoint: '50% 32%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/William_Wordsworth_by_Henry_William_Pickersgill.jpg/1280px-William_Wordsworth_by_Henry_William_Pickersgill.jpg',
            credit: 'Henry William Pickersgill (public domain), via Wikimedia Commons',
            caption: 'William Wordsworth, the Lake Poet behind the lyric\'s "what are my words worth" pun.',
            kind: 'archival',
            focalPoint: '57% 28%',
          },
        ],
      },
    },
    {
      slug: 'betty-country-radio-single',
      year: 2020,
      month: 8,
      day: 17,
      category: 'release',
      title: 'betty goes to country radio — her first country single since 2013',
      snippet:
        'The love triangle\'s apology song, sent to country radio on Aug. 17, 2020: her first single on the format since the Red era, a homecoming pitched from inside an indie-folk album.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Betty_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Sung from the perspective of seventeen-year-old James — a character voiced into being partly by Joe Alwyn, whom Swift overheard "singing the entire, fully formed chorus" from another room — "betty" was the folklore track built closest to her Nashville roots. She modeled its sound on Bob Dylan, specifically The Freewheelin\' Bob Dylan and John Wesley Harding, and the guitars, pedal steel, and harmonica read as a deliberate olive branch to the format she\'d left after Red.\n\nSent to country radio on Aug. 17, 2020, it peaked at No. 6 on Hot Country Songs — the highest debut by a woman on that chart since Bebe Rexha\'s "Meant to Be" in 2017 — and crossed to No. 42 on the Hot 100. It stayed a one-off: rather than a full country return, it was a postcard to the old neighborhood from an album that lived somewhere else entirely.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Betty_(Taylor_Swift_song)',
            source_title: 'Betty (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): official single cover (exact filename
        // from the Wikipedia article HTML) plus the public-domain Dylan photo
        // used on the same article for the song's cited influence. Verified
        // HTTP 200 this session.
        photos: [
          // Photo-enrichment run 17 (2026-07-18, #762): focal points only —
          // the page already carries two distinct verified photos. Both
          // downloaded and viewed this session; values set per image, by eye.
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/3/38/Taylor_Swift_-_Betty.png',
            credit: 'Republic Records',
            caption: 'Official single cover for "betty," her first country-radio single since 2013.',
            kind: 'primary',
            focalPoint: '48% 40%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Joan_Baez_Bob_Dylan_crop.jpg/500px-Joan_Baez_Bob_Dylan_crop.jpg',
            credit: 'Rowland Scherman (public domain), via Wikimedia Commons',
            // Image-fix pass (2026-07-10): ticket #238 — this Commons file is the
            // "_crop" that removes Joan Baez from frame (verified by viewing the
            // image: Dylan alone with harmonica rack, no Baez visible), so the
            // caption naming her was wrong. Dropped the Baez mention; image kept
            // as-is (correct subject: Dylan, 1963).
            caption: 'Bob Dylan in 1963 — Swift modeled the song\'s sound on his early records.',
            kind: 'archival',
            focalPoint: '42% 35%',
          },
        ],
      },
    },
    {
      slug: 'betty-acm-awards-performance',
      year: 2020,
      month: 9,
      day: 16,
      category: 'music',
      title: "folklore's first live moment: betty, alone at the Grand Ole Opry House",
      snippet:
        'Her first ACM Awards performance in seven years, Sept. 16, 2020 — just Taylor, an acoustic guitar, and "betty" on the Opry stage of a mostly empty, pandemic-staged show. The first time any folklore song was performed live.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Betty_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Her first ACM Awards appearance in seven years was staged as minimally as the album itself: seated at the Opry with an acoustic Gibson, a single spotlight glowing behind her, one harmonica player as the entire band, in a burgundy sequined turtleneck.\n\nThe audience-free, pandemic-produced broadcast made it the world television premiere of any folklore song — Variety noted "betty" is the one track on the album that harks back to early Swift country hits like "Love Story," which made it the natural pick for a country-stage homecoming. It stayed folklore\'s only live TV performance until the Grammys medley the following March.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Betty_(Taylor_Swift_song)',
            source_title: 'Betty (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Variety',
            url: 'https://variety.com/2020/music/news/taylor-swift-betty-acm-awards-performance-country-opry-1234772890/',
            source_title: "Taylor Swift Sings Solo Acoustic 'Betty' on ACM Awards",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): thumbnail from the official
        // performance upload on the Taylor Swift YouTube channel — id
        // verified via YouTube oEmbed (title + author "Taylor Swift").
        photos: [
          {
            url: 'https://i.ytimg.com/vi/orXAg5dIMa8/hqdefault.jpg',
            credit: 'Taylor Swift via YouTube (official performance video)',
            caption: 'Alone in the spotlight at the Grand Ole Opry House — from the official upload of the 2020 ACM Awards performance.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'william-bowery-is-joe',
      year: 2020,
      month: 11,
      day: 25,
      category: 'relationship',
      title: 'William Bowery is Joe: the Long Pond reveal',
      snippet:
        'folklore\'s mystery co-writer — credited on "exile" and "betty" — turned out to be Joe Alwyn, confirmed on camera in the Long Pond Studio Sessions: "Joe plays piano beautifully, and he\'s always just playing and making things up… Joe had written that entire piano part."',
      sourceUrl: 'https://www.eonline.com/news/1212449/taylor-swift-reveals-the-identity-of-folklores-mystery-co-writer-william-bowery',
      thumbnailUrl: null,
      moment: {
        context:
          'Fans had theorized for months about the unknown name in the credits of "exile" and "betty" — with Alwyn always the leading suspect — until the Long Pond Studio Sessions premiered on Disney+ on Nov. 25, 2020, and she settled it on camera, describing how Alwyn had written the "exile" piano part and how she\'d overheard him singing what became the "betty" chorus.\n\nThe pseudonym stitched together Alwyn\'s composer great-grandfather William Alwyn and the Bowery — the New York neighborhood where Alwyn said he spent a lot of time when he first moved to the city, not, as fans once theorized, the Bowery Hotel — and "Bowery" would go on to co-write on evermore and Midnights under the same name.',
        sources: [
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1212449/taylor-swift-reveals-the-identity-of-folklores-mystery-co-writer-william-bowery',
            source_title: "Taylor Swift Reveals the Identity of folklore's Mystery Co-Writer William Bowery",
            publisher: 'E! News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Capital FM',
            url: 'https://www.capitalfm.com/artists/taylor-swift/william-bowery-joe-alwyn-folklore-exile/',
            source_title: 'Taylor Swift confirms Joe Alwyn is mystery Folklore writer William Bowery',
            publisher: 'Capital FM',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/joe-alwyn-william-bowery-pen-name-origin-taylor-swift-1235073220/',
          },
        ],
        // Real-photo pass (2026-07-09): CC BY-SA 3.0 photo of Joe Alwyn from
        // Wikimedia Commons (license verified on the file page this session).
        // Verified HTTP 200 + image/png.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Joe_Alwyn_during_an_interview%2C_August_2018.png',
            credit: 'ColliderVideo (CC BY-SA 3.0), via Wikimedia Commons',
            caption: 'Joe Alwyn in 2018 — revealed at Long Pond as folklore\'s mystery co-writer "William Bowery."',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'amas-2020-rerecording-reveal',
      year: 2020,
      month: 11,
      day: 22,
      category: 'business',
      title: "Artist of the Year, accepted from the studio: 'I'm re-recording all of my old music'",
      snippet:
        'She skipped the 2020 AMAs despite winning three awards — explaining on video: "The reason I\'m not there tonight is I\'m actually re-recording all of my old music in the studio where we originally recorded it." The Taylor\'s Version project, announced mid-acceptance-speech.',
      sourceUrl: 'https://variety.com/2020/music/news/taylor-swift-wins-three-american-music-awards-says-shes-mia-because-of-recording-all-of-my-old-music-1234837818/',
      thumbnailUrl: null,
      moment: {
        context:
          'The Nov. 22, 2020 wins — her third straight Artist of the Year, plus favorite pop/rock female and favorite music video for "cardigan" — pushed her career AMA total from 29 to 32, extending her own all-time record. She accepted by video, on a plain feed from a recording studio, six days after publicly revealing that her masters had been sold a second time.\n\nThe re-recording reveal, dropped almost as an aside in that acceptance video, set up the Taylor\'s Version era that would define the next three years — and it made the ceremony itself the least interesting thing about her night: the headline wasn\'t the trophies, it was where she was standing.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2020/music/news/taylor-swift-wins-three-american-music-awards-says-shes-mia-because-of-recording-all-of-my-old-music-1234837818/',
            source_title: "Taylor Swift Wins Top AMA; MIA Due to 'Recording All My Old Music'",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'CBS News',
            url: 'https://www.cbsnews.com/news/taylor-swift-artist-of-the-year-2020-american-music-awards/',
            source_title: 'Taylor Swift takes home third straight artist of the year award at 2020 AMAs',
            publisher: 'CBS News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): thumbnail from the official American
        // Music Awards channel upload of the acceptance — id verified via
        // YouTube oEmbed (author "American Music Awards") this session.
        // Photo-enrichment run 17 (2026-07-18, #762): added Variety's own
        // broadcast still of the same acceptance (variety.com/wp-content,
        // from the article this page cites) — a distinct, higher-resolution
        // frame with the studio mic in view; small ABC bug only, no agency
        // watermark. Verified HTTP 200 + image/png, downloaded and visually
        // confirmed. Per-image focal points set by eye.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/65Oso8K4FzY/hqdefault.jpg',
            credit: 'American Music Awards via YouTube (official upload)',
            caption: 'Accepting Artist of the Year by video from the studio where she was re-recording her old music.',
            kind: 'primary',
            focalPoint: '46% 30%',
          },
          {
            url: 'https://variety.com/wp-content/uploads/2020/11/Screen-Shot-2020-11-22-at-8.47.21-PM-e1606106986474.png?w=1000&h=543&crop=1',
            credit: 'ABC (broadcast still, via Variety)',
            caption: 'Mid-speech beside the studio microphone — the frame where the re-recording plan slipped out.',
            kind: 'primary',
            focalPoint: '49% 38%',
          },
        ],
      },
    },
    {
      slug: 'folklore-six-grammy-nominations',
      year: 2020,
      month: 11,
      day: 24,
      category: 'business',
      title: 'Six Grammy nominations for the quarantine album',
      snippet:
        'The Nov. 24, 2020 nominations gave the surprise album a full slate: folklore for Album of the Year and Best Pop Vocal Album, "cardigan" for Song of the Year and Best Pop Solo Performance, "exile" for Best Pop Duo/Group Performance, and her Cats ballad "Beautiful Ghosts" for visual media.',
      sourceUrl: 'https://www.eonline.com/news/1211337/taylor-swifts-folklore-sweeps-2021-grammys-nominations',
      thumbnailUrl: null,
      moment: {
        context:
          'Exactly four months after an album made in secret quarantine sessions appeared with sixteen hours\' notice, it led her to six nominations — "cardigan" pulling double duty in the songwriting and pop performance fields, "exile" earning Bon Iver a pop nomination, and "Beautiful Ghosts" carrying a stray Cats credit into the visual-media category.\n\nOn the night itself she went one-for-six, but the one was Album of the Year — the win that made her the first woman with three AOTY trophies (covered separately in this era). The haul also made the industry\'s verdict plain: a record with no conventional campaign behind it had become one of the night\'s most-nominated projects anyway.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Folklore_(Taylor_Swift_album)',
            source_title: 'Folklore (Taylor Swift album)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'E! News',
            url: 'https://www.eonline.com/news/1211337/taylor-swifts-folklore-sweeps-2021-grammys-nominations',
            source_title: "Taylor Swift's folklore Sweeps 2021 Grammys Nominations",
            publisher: 'E! News',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): official single cover for the twice-
        // nominated "cardigan," exact filename from the Wikipedia article
        // HTML. Verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/0/07/Taylor_Swift_-_Cardigan.png',
            credit: 'Republic Records',
            caption: '"cardigan," nominated for both Song of the Year and Best Pop Solo Performance.',
            kind: 'primary',
          },
        ],
      },
    },
    // --- Deep timeline fill (2026-07-08, content/deep-c): completes song
    // coverage for the standard tracklist (every folklore track now has a
    // sourced music item somewhere in this file) and adds the era's second
    // masters-sale wavetop. Tour and sighting remain genuinely empty — no
    // touring happened, and the 2026-07-05 sightings research pass (above)
    // confirmed ~zero candid sightings. New items carry the audit's additive
    // provenance fields; thumbnails deliberately null per the 2026-07-08
    // media policy (no new hotlinks).
    {
      slug: 'cardigan-self-directed-video',
      year: 2020,
      month: 7,
      day: 24,
      category: 'music',
      title: 'cardigan: the lead single, with a video she directed herself',
      snippet:
        'folklore\'s lead single arrived with the album at midnight, its self-directed video sending Taylor through a glowing piano into forest and ocean — the love triangle\'s adult-Betty chapter, and her sixth Hot 100 No. 1.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Cardigan_(song)',
      thumbnailUrl: null,
      moment: {
        context:
          'Written with Aaron Dessner, it answers the triangle\'s other two songs from twenty years\' distance — "when you are young, they assume you know nothing" as the thesis. The song began as an instrumental Dessner had titled "Maple," sent over on April 27, 2020; Swift finished the songwriting in about five hours.\n\nShe wrote, directed, and styled the video herself, and did her own hair and makeup on set (the no-glam-team shoot is covered in this era\'s fashion items). Its story runs through three worlds — a candlelit cottage, a mossy forest where the piano pours a waterfall, and a storm-tossed sea where she clings to the instrument — before returning her, and the cardigan, safely home. Under COVID protocols, cinematographer Rodrigo Prieto shot much of it with a camera on a remotely operated robotic arm, with color-coded wristbands marking who could work near the unmasked performer.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Cardigan_(song)',
            source_title: 'Cardigan (song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): official single cover (exact filename
        // from the Wikipedia article HTML) plus the official music video
        // thumbnail — video id verified via YouTube oEmbed (title + author
        // "Taylor Swift") this session. Both verified HTTP 200.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/0/07/Taylor_Swift_-_Cardigan.png',
            credit: 'Republic Records',
            caption: 'Official single cover for "cardigan," folklore\'s lead single.',
            kind: 'primary',
          },
          {
            url: 'https://i.ytimg.com/vi/K-a8s8OLBSE/hqdefault.jpg',
            credit: 'Taylor Swift via YouTube (official music video)',
            caption: 'The candlelit piano that opens the self-directed "cardigan" video.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'the-1-last-minute-opener',
      year: 2020,
      month: 7,
      day: 24,
      category: 'music',
      title: 'the 1, written days before release and promoted straight to opening track',
      snippet:
        'Aaron Dessner thought the album was finished — then a voice memo arrived days before the drop. One of the last two folklore songs written (with "hoax"), it got sequenced first, so the record opens on a wry, conversational what-if.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_1',
      thumbnailUrl: null,
      moment: {
        context:
          'Swift sent Aaron Dessner a voice memo with the lyrics days before release; he finished the production in a scramble while his brother Bryce added orchestration — a buzzer-beater that changed the album\'s shape and set up folklore\'s whole exercise in imagined lives before a single "real" song plays.\n\nThe machinery is almost comically simple: the piano cycles just two chords, C and F, at an easy 70 BPM, with the conversational vocal carrying the wry what-ifs on top — one of the lightest-sounding songs on a heavy record. It debuted at No. 4 on the Hot 100 in the album\'s opening week, part of Swift becoming the first artist ever to debut two songs in the chart\'s top four at once.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/The_1',
            source_title: 'The 1',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): CC BY-SA 2.0 concert photo from
        // Wikimedia Commons, used on the song's own Wikipedia article
        // (license verified this session). Verified HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Taylor_Swift_Eras_Tour_-_Arlington%2C_TX_-_Folklore_act_2.jpg/500px-Taylor_Swift_Eras_Tour_-_Arlington%2C_TX_-_Folklore_act_2.jpg',
            credit: 'Ronald Woan (CC BY-SA 2.0), via Wikimedia Commons',
            caption: 'On the folklore act\'s moss-covered cabin roof at the Eras Tour, Arlington, March 2023.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'illicit-affairs-bridge',
      year: 2020,
      month: 7,
      day: 24,
      category: 'music',
      title: 'illicit affairs, and the bridge that ate the song',
      snippet:
        'A hushed folk track about an affair\'s slow corrosion, written with Jack Antonoff, that detonates in its final minute — "you taught me a secret language I can\'t speak with anyone else" — routinely ranked among folklore\'s best writing.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Illicit_Affairs',
      thumbnailUrl: null,
      moment: {
        context:
          'The structure is the story: verses of muted, procedural regret — the parking lots, the perfume worn only for one person — then a bridge where the narrator finally erupts ("don\'t call me kid, don\'t call me baby") and the song simply stops, with no final chorus to tidy it up.\n\nRolling Stone\'s Rob Sheffield flagged the line "a drug that only worked the first few hundred times" in his album review; the Los Angeles Times called the writing more sophisticated than any of her earlier infidelity songs. It never got a single push and didn\'t need one: it peaked at No. 44 on the Hot 100 on album-cut streaming alone, and the whispered-to-shouted bridge became one of the Eras Tour folklore set\'s loudest singalongs.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Illicit_Affairs',
            source_title: 'Illicit Affairs',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-album-reviews/taylor-swift-leaves-her-comfort-zones-behind-on-the-head-spinning-heart-breaking-folklore-1033533/',
            source_title: 'Taylor Swift Leaves Her Comfort Zones Behind on the Head-Spinning, Heartbreaking Folklore',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): thumbnail from the official lyric
        // video on the Taylor Swift YouTube channel — id verified via YouTube
        // oEmbed (title + author "Taylor Swift") this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/MLV2SJKWk4M/hqdefault.jpg',
            credit: 'Taylor Swift via YouTube (official lyric video)',
            caption: 'The rain-dark woods of the official "illicit affairs" lyric video.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'this-is-me-trying-long-pond',
      year: 2020,
      month: 11,
      day: 25,
      category: 'music',
      title: 'this is me trying, unpacked at Long Pond',
      snippet:
        'In the Long Pond Studio Sessions she walked through the song\'s shifting perspectives — including a verse that touches on alcoholism and the quiet work of staying sober — one of folklore\'s heaviest songs at its lowest volume.',
      sourceUrl: 'https://en.wikipedia.org/wiki/This_Is_Me_Trying',
      thumbnailUrl: null,
      moment: {
        context:
          'Her commentary framed it around people trying their hardest while assuming nobody notices — the kid who "got wasted like all my potential," the person white-knuckling a hard stretch — and she traced part of it to her own 2016–2017 low, when "I just felt like I was worth absolutely nothing."\n\nWritten and produced with Jack Antonoff (Joe Alwyn holds a co-producer credit), it wraps that fragility in organ, horns, and saxophone, with processed vocals that leave the effort audible. Rolling Stone\'s Rob Sheffield called it "the disturbingly witty tale of someone pouring her heart out, to keep herself from pouring more whiskey." It reached No. 39 on the Hot 100 in folklore\'s opening week.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/This_Is_Me_Trying',
            source_title: 'This Is Me Trying',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-album-reviews/taylor-swift-leaves-her-comfort-zones-behind-on-the-head-spinning-heart-breaking-folklore-1033533/',
            source_title: 'Taylor Swift Leaves Her Comfort Zones Behind on the Head-Spinning, Heartbreaking Folklore',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 4,
          },
        ],
        // Real-photo pass (2026-07-09): thumbnail from the official lyric
        // video on the Taylor Swift YouTube channel — id verified via YouTube
        // oEmbed (title + author "Taylor Swift") this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/9bdLTPNrlEg/hqdefault.jpg',
            credit: 'Taylor Swift via YouTube (official lyric video)',
            caption: 'The drive-in movie screen of the official "this is me trying" lyric video.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'peace-the-real-one',
      year: 2020,
      month: 11,
      day: 25,
      category: 'music',
      title: 'peace, the most autobiographical song on the "fictional" album',
      snippet:
        'On a record sold as invented characters, "peace" is the confirmed exception — rooted in her personal life and the balance between private and public, built around one question: "would it be enough if I could never give you peace?"',
      sourceUrl: 'https://en.wikipedia.org/wiki/Peace_(Taylor_Swift_song)',
      thumbnailUrl: null,
      moment: {
        context:
          'The third song she and Aaron Dessner wrote together for the album, and the one where she worked against the music on purpose: Swift said Dessner\'s composition gave her an "immediate sense of serenity," so she wrote conflicted lyrics over it — an offer of everything except an ordinary life, the one thing fame permanently prices out.\n\nThe production stays nearly transparent (soft piano, harmonized basslines, a ticking pulse contributed by Justin Vernon), which is why the writing lands so hard; one critic called it the most romantic song she\'d ever written precisely because peace is the only thing she can\'t promise. Fans clocked it immediately as the album\'s realest moment, and her Long Pond commentary confirmed the read. It reached No. 58 on the Hot 100.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Peace_(Taylor_Swift_song)',
            source_title: 'Peace (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Real-photo pass (2026-07-09): thumbnail from the official lyric
        // video on the Taylor Swift YouTube channel — id verified via YouTube
        // oEmbed (title + author "Taylor Swift") this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/HpxX4ZE4KWE/hqdefault.jpg',
            credit: 'Taylor Swift via YouTube (official lyric video)',
            caption: 'The storm-swept plain of the official "peace" lyric video.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'shamrock-masters-sale',
      year: 2020,
      month: 11,
      day: 16,
      category: 'business',
      title: 'Her masters get sold again — this time to Shamrock Capital, for about $300 million',
      snippet:
        'On Nov. 16, 2020 she revealed Braun\'s Ithaca had sold her first six albums to Shamrock Capital — "the second time my music had been sold without my knowledge" — and said she\'d declined to partner with the firm because Braun would keep profiting from the deal.',
      sourceUrl: 'https://variety.com/2020/music/news/scooter-braun-sells-taylor-swift-big-machine-masters-1234832080/',
      thumbnailUrl: null,
      moment: {
        context:
          'Her open letter laid out why the second sale stung like the first: Braun\'s team had required an "ironclad" NDA that would have allowed her to say only positive things about him before any buy-back talks, never quoted her a price, and — she said — required that Shamrock not notify her until the deal was already done. Shamrock offered her an equity partnership; she declined because under the terms Braun and Ithaca Holdings would keep profiting from her old catalog, though she told the firm she wished them well.\n\nInstead she doubled down: the re-recording sessions began that same November, days before the Long Pond film premiered — and the standoff only fully resolved in May 2025, when she bought the masters back from Shamrock outright.',
        sources: [
          {
            outlet: 'Variety',
            url: 'https://variety.com/2020/music/news/scooter-braun-sells-taylor-swift-big-machine-masters-1234832080/',
            source_title: "Scooter Braun Sells Taylor Swift's Big Machine Masters for Big Payday",
            publisher: 'Variety',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-buys-back-her-catalog-explainer-1236233783/',
            source_title: 'Taylor Swift Gets Her Masters Back: How We Got Here',
            publisher: 'The Hollywood Reporter',
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
        // Real-photo pass (2026-07-09): CC BY-SA 4.0 photo of Scooter Braun
        // from Wikimedia Commons (license verified on the file page this
        // session). Verified HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Scott_%28Scooter%29_Braun_2022.jpg/960px-Scott_%28Scooter%29_Braun_2022.jpg',
            credit: 'Scott Braun (CC BY-SA 4.0), via Wikimedia Commons',
            caption: 'Scooter Braun, whose Ithaca Holdings sold the masters of Swift\'s first six albums to Shamrock Capital.',
            kind: 'archival',
          },
        ],
      },
    },
  ],
};
