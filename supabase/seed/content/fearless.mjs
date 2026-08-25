// Vault content — Fearless era.
//
// Two wavetop months: Nov 2008 (album release) and Apr 2009 (tour opens).
// Every claim verified against its cited source directly. See
// docs/marketing/content-framework-2026-07-03.md for the no-fabrication
// rule and the light-touch (link-first) authoring model this follows.

export default {
  eraSlug: 'fearless',
  items: [
    {
      // Cross-link (Stage 3, 2026-07-30): the "Love Story" pair — the song's
      // story, and the single's release two months ahead of the album — now
      // interlink.
      relatedIds: ['moment:vault-fearless-love-story-arrives-two-months-before-the-album'],
      year: 2008,
      month: 9,
      day: 15,
      category: 'music',
      title: "Love Story, and the boy her family didn't approve of",
      snippet:
        "Inspired by a boy she never actually dated — one her family and friends \"all said they didn't like.\"",
      sourceUrl: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor_Swift_song)',
      thumbnailUrl: 'https://i.ytimg.com/vi/8xg3vE8Ie_E/hqdefault.jpg',
      moment: {
        context:
          "She's said the disapproval reminded her of Romeo and Juliet — \"the only people who wanted them to be together were them\" — so she gave her version the happy ending Shakespeare didn't, swapping the double suicide for a marriage proposal she felt the characters deserved.\n\nThe whole thing came fast: she wrote it on her bedroom floor in about 20 minutes, then cut a rough demo in roughly 15 minutes the next day. The boy stayed anonymous — she's only ever said he was someone she never actually dated, and that when she brought him around, \"[they] all said they didn't like him. All of them!\"",
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor_Swift_song)' },
          { outlet: 'Wide Open Country', url: 'https://www.wideopencountry.com/love-story-taylor-swift/' },
        ],
        // Photo-enrichment pass (2026-07-30): added the official "Love Story"
        // music-video still (YouTube id 8xg3vE8Ie_E, oEmbed-verified channel
        // "Taylor Swift" @TaylorSwift; curl 200 image/jpeg); downloaded and
        // vision-confirmed.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/8xg3vE8Ie_E/hqdefault.jpg',
            focalPoint: '52% 45%',
            credit: 'Big Machine Records / official Taylor Swift YouTube channel',
            caption: 'Still from the official "Love Story" music video.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2008,
      month: 11,
      day: 11,
      category: 'music',
      title: "Fifteen, written for her best friend Abigail",
      snippet: "A freshman-year memory, built around one line about her best friend Abigail's heartbreak.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Fifteen_(song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/4/41/Taylor_Swift_en_Fifteen_cantando.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original',
      moment: {
        context:
          'The whole song grew backwards from one line — "Abigail gave everything she had to a boy who changed his mind" — which Taylor has said she wrote first, building everything else around it. Unsure how Abigail would take something so personal, Taylor played her the finished song and asked first. Abigail\'s answer: "If one girl can kind of learn from it or connect to a song like that, it\'s totally worth it."\n\nRecording it wrecked Taylor anyway — she\'s admitted she cried in the studio, "the things that make me cry are when the people I love have gone through pain and I\'ve seen it" — and when Roman White shot the surreal green-screen garden video, Abigail appeared in it as herself.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Fifteen_(song)' },
          { outlet: 'Songfacts', url: 'https://www.songfacts.com/facts/taylor-swift/fifteen' },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Taylor_Swift_en_Fifteen_cantando.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original',
            focalPoint: '68% 34%',
            credit: 'Flickr user 11001344@N02 (CC BY 2.0), via Wikimedia Commons',
            caption: 'Performing "Fifteen" on the Fearless Tour in June 2009.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 1,
      day: 31,
      category: 'business',
      significance: 'defining', // youngest-ever AOTY win; the first of her (now-record) 4 (docs/decisions.md, 2026-07-19)
      title: 'Fearless makes her the youngest Album of the Year winner — for a decade',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-fear-3", label: "Album of the Year", kind: "award" },
      // Corrected 2026-07-19 (found in review): snippet/sourceUrl/thumbnail
      // previously described the Nov. 2008 album debut, not the Jan. 2010
      // Grammy win this item is actually about — mismatched hero card.
      snippet: 'At the 52nd Grammys, 20-year-old Taylor became the youngest Album of the Year winner ever — a record that stood for a decade, until Billie Eilish broke it.',
      sourceUrl: 'https://americansongwriter.com/on-this-day-in-2010-this-country-star-turned-pop-phenomenon-became-the-youngest-album-of-the-year-winner-in-grammys-history/',
      thumbnailUrl: 'https://media.vanityfair.com/photos/6973c403bc755155c2f9ebcc/master/w_1024%2Cc_limit/taylor-swift-grammys-red-carpet-2010.jpg',
      relatedIds: ['moment:vault-1989-1989-wins-album-of-the-year-making-her-the-first-woman-to-wi', 'moment:vault-folklore-folklore-makes-her-the-first-woman-to-win-album-of-the-year-'],
      moment: {
        context:
          'At the Grammys — Jan. 31, 2010, at Staples Center — 20-year-old Taylor became the youngest Album of the Year winner ever, a record that stood until Billie Eilish broke it a decade later.\n\nShe won four of the eight categories she was nominated in that night, and her speech guessed exactly how long the moment would last: "When we\'re 80 years old and we are telling the same stories over and over again to our grandkids... this is the story we\'re gonna be telling over and over again — in 2010, that we got to win Album of the Year."\n\nThe four went to Album of the Year and Best Country Album for Fearless, plus Best Country Song and Best Female Country Vocal Performance for "White Horse," her twice-honored co-write with Liz Rose — a haul that made Fearless the most-awarded country album in Grammy history. The album had already closed 2009 as the best-selling release in the United States, and Guinness World Records still lists her as the youngest solo artist ever to win Album of the Year. The mark held for a decade, until 18-year-old Billie Eilish won for When We All Fall Asleep, Where Do We Go? in 2020. It came a little over four months after Kanye West took the microphone from her at the MTV Video Music Awards, and it was the first of four Album of the Year wins — 1989, folklore, and Midnights followed — more than any artist has won in the category, which is why a quiet January night in 2010 reads in hindsight as the start of a dynasty.',
        sources: [
          {
            outlet: 'American Songwriter',
            url: 'https://americansongwriter.com/on-this-day-in-2010-this-country-star-turned-pop-phenomenon-became-the-youngest-album-of-the-year-winner-in-grammys-history/',
          },
          {
            outlet: 'Guinness World Records',
            url: 'https://www.guinnessworldrecords.com/world-records/607151-youngest-solo-artist-to-win-album-of-the-year-at-the-grammy-awards',
          },
          {
            outlet: 'Grammy.com',
            url: 'https://www.grammy.com/news/grammy-rewind-watch-taylor-swift-win-album-year-fearless-2010/',
          },
          // The acceptance speech on the Recording Academy's own channel —
          // oEmbed-verified 2026-08-12 (see candidates/youtube-appearances.mjs).
          {
            outlet: 'YouTube — GRAMMYS',
            url: 'https://www.youtube.com/watch?v=BFk2NjdJ1yY',
          },
        ],
        photos: [
          // Photo pass #762 (2026-07-18): still from the Recording Academy's
          // official GRAMMY Rewind upload of this exact win — Swift at the
          // mic with the gramophone, "13" inked on her waving hand. oEmbed-
          // verified the video (v5e0eAhpC00) belongs to the official @GRAMMYS
          // channel; i.ytimg.com is YouTube's own CDN; curl 200 image/jpeg
          // 1280x720, downloaded and vision-confirmed.
          {
            url: 'https://i.ytimg.com/vi/v5e0eAhpC00/maxresdefault.jpg',
            credit: 'Still from the Recording Academy\'s official GRAMMY Rewind video of the 2010 Album of the Year win, via YouTube',
            caption: 'Accepting Album of the Year at 20 — the "13" still inked on her hand — the night she promised to tell this story "when we\'re 80."',
            kind: 'archival',
            // Focal point set by viewing: face upper-center with the raised
            // hand right; GRAMMY REWIND overlay text sits bottom-left.
            focalPoint: '52% 22%',
          },
          // Photo pass 2026-07-19 (10-defining-events, docs/decisions.md):
          // real, verified photos from the actual Jan. 31, 2010 Grammy night.
          {
            url: 'https://media.vanityfair.com/photos/6973c403bc755155c2f9ebcc/master/w_1024%2Cc_limit/taylor-swift-grammys-red-carpet-2010.jpg',
            focalPoint: '30% 20%',
            credit: 'Dan MacMedan/WireImage, via Vanity Fair',
            caption: 'Taylor arrives at the 52nd Grammy Awards in a blue sequined KaufmanFranco gown.',
            kind: 'primary',
          },
          {
            url: 'https://i.guim.co.uk/img/static/sys-images/Guardian/Pix/pictures/2010/2/1/1264988049224/Singer-Swift-speaks-onsta-001.jpg?crop=none&dpr=1&s=none&width=465',
            focalPoint: '52% 30%',
            credit: 'Danny Moloshok/Reuters, via The Guardian',
            caption: 'Taylor speaks onstage after winning Best Female Country Vocal Performance for "White Horse," one of her four Grammys that night.',
            kind: 'primary',
          },
          {
            url: 'https://i.guim.co.uk/img/static/sys-images/Guardian/Pix/pictures/2010/2/1/1265015933818/Taylor-Swift-drops-one-of-003.jpg?crop=none&dpr=1&s=none&width=375',
            focalPoint: '52% 30%',
            credit: 'Valerie Macon/AFP/Getty Images, via The Guardian',
            caption: 'Taylor loses her grip on one of the four trophies she carried in the Grammy press room.',
            kind: 'primary',
          },
          {
            url: 'https://static.time.com/v3/assets/bltea6093859af6183b/blte142e31b64ce6139/69877c56524fc062c0dec2d5/ap100131042457.jpg?branch=production&width=3840&quality=75&auto=webp&crop=3%3A2',
            focalPoint: '50% 28%',
            credit: 'Matt Sayles/AP, via TIME',
            caption: 'Taylor and Stevie Nicks perform together during the 52nd Grammy Awards telecast.',
            kind: 'primary',
          },
          {
            url: 'https://static.time.com/v3/assets/bltea6093859af6183b/bltca5404e6952dca29/698762d6e20a87c7bda82aeb/taylor-swift-12.jpg?branch=production&width=3840&quality=75&auto=webp',
            focalPoint: '55% 30%',
            credit: 'Michael Caulfield/WireImage/Getty Images, via TIME',
            caption: 'Taylor performs onstage during the 52nd Grammy Awards at Staples Center.',
            kind: 'primary',
          },
          {
            url: 'https://assets.teenvogue.com/photos/56be4d24e9ea465e7cf59f44/16%3A9/w_2560%2Cc_limit/GettyImages-98115429.jpg',
            focalPoint: '52% 28%',
            credit: 'Michael Tran/FilmMagic, via Teen Vogue',
            caption: 'Taylor poses in the Grammy press room with all four awards she won that night, including Album of the Year.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2009,
      month: 4,
      day: 23,
      category: 'tour',
      significance: 'notable', // her first-ever headlining tour, launching a 118-show run — real but not on the site's defining tier next to the Eras Tour opening (docs/decisions.md, 2026-07-19)
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-fear-0", label: "Fearless Tour opens", kind: "tour" },
      // Cross-link (Stage 3, 2026-07-30): the "Fearless Tour" opening-night
      // pair — the sold-out crowd, and the marching-band reveal that opened
      // the show — now interlink.
      relatedIds: ['moment:vault-fearless-a-marching-band-reveal-to-open-the-fearless-tour'],
      title: 'The Fearless Tour opens to a sold-out crowd in 30 seconds',
      snippet:
        "Evansville, Indiana gave her the key to the city and declared it \"Taylor Swift Day\" — the start of her first-ever headlining tour.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_Tour',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Taylor_Swift_-_Fearless_Tour_-_Austin_07.jpg/500px-Taylor_Swift_-_Fearless_Tour_-_Austin_07.jpg',
      moment: {
        context:
          'The 7,463-seat Roberts Municipal Stadium show on April 23, 2009 was a headlining debut she\'d deliberately delayed: "I never wanted to go into an arena and have to downsize it so there were only 5,000 or 4,000 people there... we waited a long time to make sure the headlining tour was everything I wanted it to be."\n\nHer pitch for finally topping the bill was simpler — "Headlining my own tour is a dream come true! This way I can play more music every night than I ever have before" — and the tour it launched ran 118 shows across six countries over the next 15 months.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Fearless_Tour' },
          { outlet: 'The Boot', url: 'https://theboot.com/taylor-swift-fearless-tour-first-headlining-tour-2009/' },
        ],
        // Photo pass (2026-07-19, defining-events-31-50): 6 added, all Wikimedia
        // Commons "Fearless Tour" uploads — curl-verified 200 + image/jpeg,
        // downloaded and visually confirmed this session. No freely licensed
        // photo of the actual April 23, 2009 Evansville opener exists on
        // Commons, so these are the same 2009-10 tour's other stops (kept
        // 'archival'/'reference', not 'primary').
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Taylor_Swift_-_Fearless_Tour_-_Austin_07.jpg/500px-Taylor_Swift_-_Fearless_Tour_-_Austin_07.jpg',
            focalPoint: '50% 55%',
            credit: 'Wikimedia Commons',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/db/Taylor_Swift_during_Fearless_Tour_concert_in_Portland.jpg',
            credit: 'calmdownlove / Wikimedia Commons, CC BY 2.0',
            caption: 'The full band on the tour\'s round center stage, with a live jumbotron feed behind them, Portland.',
            kind: 'reference',
            focalPoint: '40% 60%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Taylor_Swift_during_Fearless_Tour_concert_in_Portland_02.jpg',
            credit: 'calmdownlove / Wikimedia Commons, CC BY 2.0',
            caption: 'A gold sequined dress and cowboy boots, fist raised mid-song, Portland.',
            kind: 'archival',
            focalPoint: '25% 30%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Taylor_Swift_-_B-stage_-_Newark_-_Fearless_Tour_2010.jpg',
            credit: 'Alexanhalasan / Wikimedia Commons, CC BY-SA 2.0',
            caption: 'Seated on the B-stage in a teal dress and embroidered boots, her hand-painted "13" visible while playing acoustic guitar, Newark, May 13, 2010.',
            kind: 'archival',
            focalPoint: '35% 30%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Taylor_Swift%2C_Fearless_tour%2C_Australia%2C_2010.jpg',
            credit: 'Soth Loeu / Wikimedia Commons, CC BY-SA 3.0',
            caption: 'A silver fringed dress during the tour\'s Australian leg, 2010.',
            kind: 'archival',
            focalPoint: '48% 30%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Taylor_Swift_-_Fearless_Tour_-_Foxboro_01.jpg',
            credit: 'Meltedheadaches / Wikimedia Commons, CC BY-SA 2.0',
            caption: 'A white-and-gold majorette-style costume with a plumed hat for the tour\'s marching-band segment, Foxboro.',
            kind: 'archival',
            focalPoint: '45% 25%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Taylor_Swift_Fearless_Tour_01.jpg',
            credit: 'WEZL / Wikimedia Commons, CC BY 2.0',
            caption: 'A black rock-styled outfit with electric guitar, flanked by her full band.',
            kind: 'reference',
            focalPoint: '42% 55%',
          },
        ],
      },
    },
    {
      year: 2008,
      month: 11,
      day: 11,
      category: 'music',
      title: 'The Best Day, a secret Christmas gift for her mom',
      snippet: 'Recorded in secret while on tour, then given to her mother as a Christmas surprise with a home-movie video to match.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Best_Day_(Taylor_Swift_song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/7/76/TaylorSwift_080208_photoby_Adam-Bielawski_%28cropped%29.jpg',
      moment: {
        context:
          'Taylor wrote it in summer 2008 on tour and recorded it with producer Nathan Chapman without her mother knowing, then unveiled it on Christmas Eve alongside a home video she\'d edited herself from family footage.\n\nHer mother, Andrea, on hearing it: "that\'s when I lost it... I\'ve lost it pretty much every time I\'ve heard that song since." That never stopped being true — the song had to come out of the Fearless Tour setlist because, as Andrea put it, "I kept breaking down" backstage every time it played.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Best_Day_(Taylor_Swift_song)' },
          { outlet: 'Songfacts', url: 'https://www.songfacts.com/facts/taylor-swift/the-best-day' },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/7/76/TaylorSwift_080208_photoby_Adam-Bielawski_%28cropped%29.jpg',
            credit: 'Adam Bielawski / Wikimedia Commons',
            // Focal point set 2026-07-18 by viewing (399x509 portrait): face
            // top-center at the headset mic, koa guitar across the lower half.
            focalPoint: '54% 18%',
          },
          // Photo pass #762 (2026-07-18): frame from the official "The Best
          // Day" music video — the home-movie footage of toddler Taylor in
          // pigtails that Swift cut together herself as the Christmas gift
          // this page is about. oEmbed-verified the video (l4_6eQm7RTQ)
          // belongs to the official @TaylorSwift channel; i.ytimg.com is
          // YouTube's own CDN; curl 200 image/jpeg 1280x720, downloaded and
          // vision-confirmed.
          {
            url: 'https://i.ytimg.com/vi/l4_6eQm7RTQ/maxresdefault.jpg',
            credit: 'Still from the official "The Best Day" music video (home-movie footage), Big Machine Records, via YouTube',
            caption: 'The gift itself: a frame from the home-movie video Taylor edited in secret — toddler Taylor in pigtails — unveiled to her mom on Christmas Eve.',
            kind: 'archival',
            // Focal point set by viewing: the child stands just left of
            // center, face in the upper third, armchair lower right.
            focalPoint: '48% 28%',
          },
        ],
      },
    },
    {
      year: 2009,
      month: 9,
      day: 13,
      category: 'business',
      significance: 'defining', // the first mass cultural flashpoint of her career (docs/decisions.md, 2026-07-19)
      title: 'Wins Best Female Video, then Kanye West takes the mic',
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-fear-2", label: "VMAs moment", kind: "life" },
      snippet:
        '"I\'mma let you finish, but Beyoncé had one of the best videos of all time" — Kanye West interrupted her VMA speech for "You Belong With Me" in front of a live audience.',
      sourceUrl: 'https://www.rollingstone.com/music/music-country/kanye-west-storms-the-vmas-stage-during-taylor-swifts-speech-83468/',
      thumbnailUrl: 'https://townsquare.media/site/204/files/2023/09/attachment-taylor-swift-kanye-west-2009-mtv-vmas.jpg?w=980&q=75',
      // Cross-link (Stage 3, 2026-07-30): + "Innocent" — the Speak Now song
      // written to Kanye West, not about him — a direct reply to this moment.
      relatedIds: [
        'moment:vault-1989-snakes-snapchat-and-excluded-from-this-narrative',
        'moment:vault-speak-now-innocent-a-song-written-to-kanye-west-not-about-him',
      ],
      moment: {
        context:
          'The Radio City crowd went from stunned silence to a standing ovation for Taylor; West was escorted out of the venue and apologized on his blog that night — "i\'m in the wrong for going on stage and taking away from her moment!" When presenter Wale suggested you "can\'t fault a man for speaking his mind," the audience booed him too.\n\nBeyoncé, who went on to win Video of the Year, used her own acceptance to invite Taylor back onstage to finish the speech she\'d been denied — a gesture remembered as vividly as the interruption itself.\n\nLost in the noise were the trophy and the performance. "You Belong with Me" had won Best Female Video, and earlier that night Taylor had turned in one of the broadcast\'s signature numbers — opening the song in a brown trench coat and black beanie inside a New York subway station, singing on through a moving subway car as she shed the coat to reveal a red cocktail dress, then finishing atop a yellow taxi once the train reached its stop. That neither the win nor a marquee performance is what anyone remembers about the evening is itself the measure of what those seconds at the microphone did.\n\nThe backlash reached all the way to the White House. The very next day, in an off-the-record aside while taping a CNBC interview, President Barack Obama called West\'s stunt the work of a "jackass" — a remark an ABC News reporter posted online before it was meant to be public, prompting the network to apologize for airing an off-record comment. Obama would say much the same on the record years later. That a music-awards interruption drew a sitting president into the conversation is the measure of how far the moment traveled: it stopped being a VMAs story and became a national one, the first time the culture at large treated a Taylor moment as its own event.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-country/kanye-west-storms-the-vmas-stage-during-taylor-swifts-speech-83468/',
          },
          {
            outlet: 'Taste of Country',
            url: 'https://tasteofcountry.com/taylor-swift-kanye-west-interruption-2009-vmas/',
          },
          {
            // Added 2026-07-28 (ledger #719, residual (b)): the Obama "jackass"
            // aftermath. Off-the-record CNBC remark, Sept. 14 2009, surfaced by
            // ABC's Terry Moran; contemporaneous TMZ report + Rolling Stone's
            // later on-record coverage. Public-event commentary — no redline.
            outlet: 'TMZ',
            url: 'https://www.tmz.com/2009/09/15/obama-caught-on-tape-calling-kanye-jackass-taylor-swift/',
            source_title: "Obama Caught on Tape Calling Kanye 'Jackass'",
            publisher: 'TMZ',
            source_type: 'reputable_press',
            accessed_at: '2026-07-28',
            reliability_score: 3,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-news/obama-goes-on-record-to-call-kanye-west-a-jackass-204727/',
            source_title: "Obama Goes on Record to Call Kanye West a 'Jackass'",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-28',
            reliability_score: 4,
          },
          {
            // Added 2026-08-14 (Answerer depth pass): confirms the Best Female
            // Video win and the subway/taxi VMA performance the interruption
            // overshadowed. Fetched + verified this run.
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/You_Belong_with_Me',
            source_title: 'You Belong with Me',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-08-14',
            reliability_score: 3,
          },
        ],
        photos: [
          {
            url: 'https://townsquare.media/site/204/files/2023/09/attachment-taylor-swift-kanye-west-2009-mtv-vmas.jpg?w=980&q=75',
            focalPoint: '50% 22%',
            credit: 'Taste of Country',
          },
          // Photo pass 2026-07-19 (10-defining-events, docs/decisions.md):
          // every real, verified photo found from the Sept. 13, 2009 VMAs —
          // the interruption, the Beyoncé invite-back, and her own
          // performance/red-carpet that night. Curl-verified live.
          {
            url: 'https://i.guim.co.uk/img/static/sys-images/Guardian/Pix/pictures/2009/9/14/1252922286265/Kayne-West-jumps-onstage--007.jpg?crop=none&dpr=1&s=none&width=1000',
            focalPoint: '50% 22%',
            credit: 'Jeff Kravitz/FilmMagic, via The Guardian',
            caption: 'Kanye West steps onto the VMA stage while Taylor is accepting Best Female Video at Radio City Music Hall.',
            kind: 'primary',
          },
          {
            url: 'https://i.guim.co.uk/img/static/sys-images/Guardian/Pix/pictures/2009/9/14/1252922290422/Singer-Taylor-Swift-speak-012.jpg?crop=none&dpr=1&s=none&width=1000',
            focalPoint: '50% 22%',
            credit: 'Kevin Mazur/WireImage, via The Guardian',
            caption: 'Taylor finally finishes her acceptance speech after Beyoncé invites her back onstage later that night.',
            kind: 'primary',
          },
          {
            url: 'https://static.time.com/v3/assets/bltea6093859af6183b/bltc121921405a5eef5/698762d75f570fee2bb12f23/taylor-swift-16.jpg?branch=production&width=3840&quality=75&auto=webp',
            focalPoint: '50% 40%',
            credit: 'Stephen Lovekin/FilmMagic/Getty Images, via TIME',
            caption: 'Taylor arrives on the 2009 VMA red carpet in the silver KaufmanFranco gown she would still be wearing when West interrupted her.',
            kind: 'primary',
          },
          {
            url: 'https://media.glamour.com/photos/5b748cfd0271d30d24ff90ad/master/w_1024%2Cc_limit/GettyImages-90715371.jpg',
            focalPoint: '50% 42%',
            credit: 'Jason Kempin/Getty Images, via Glamour',
            caption: 'Taylor performs "You Belong with Me" inside a New York subway car during the 2009 VMA broadcast.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/T-Swift_VMA_performance.JPG',
            focalPoint: '30% 25%',
            credit: 'Coldbread, via Wikimedia Commons',
            caption: 'Taylor steps down from the yellow taxi after completing her outdoor VMA performance on Sept. 13, 2009.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Taylor_Swift_2009_MTV_VMA.jpg',
            focalPoint: '40% 28%',
            credit: 'Philip Nelson, via Wikimedia Commons',
            caption: 'Taylor appears during the 2009 MTV Video Music Awards at Radio City Music Hall.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Taylor_Swift_at_2009_MTV_Video_Music_Awards_%283917030572%29.jpg',
            focalPoint: '30% 40%',
            credit: 'Philip Nelson, via Wikimedia Commons',
            caption: 'A distinct audience-level view of Taylor at the 2009 MTV Video Music Awards.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Taylor_Swift_at_2009_MTV_VMA%27s_2.jpg',
            focalPoint: '40% 30%',
            credit: 'Philip Nelson, via Wikimedia Commons',
            caption: 'Taylor performs during the 2009 MTV Video Music Awards in New York.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Taylor_Swift_at_2009_MTV_VMA%27s_3.jpg',
            focalPoint: '33% 33%',
            credit: 'Philip Nelson, via Wikimedia Commons',
            caption: 'Standing atop a car on a closed-off Avenue of the Americas, mic raised, as a street crowd reaches up during the outdoor VMA broadcast performance.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Taylor_Swift_at_2009_MTV_VMA%27s_4.jpg',
            focalPoint: '38% 28%',
            credit: 'Philip Nelson, via Wikimedia Commons',
            caption: 'Taylor performs "You Belong with Me" during the 2009 VMA telecast.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Taylor_Swift_at_2009_MTV_VMA%27s_5.jpg',
            focalPoint: '42% 35%',
            credit: 'Philip Nelson, via Wikimedia Commons',
            caption: 'A wide, horizontal view of Taylor\'s performance during the 2009 MTV Video Music Awards.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Taylor_Swift_at_2009_MTV_VMA%27s.jpg',
            focalPoint: '38% 37%',
            credit: 'Philip Nelson, via Wikimedia Commons',
            caption: 'Taylor onstage during her "You Belong with Me" performance at the 2009 VMAs.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      // Cross-link (Stage 3, 2026-07-30): sibling "Fearless Tour" opening-night moment.
      relatedIds: ['moment:vault-fearless-the-fearless-tour-opens-to-a-sold-out-crowd-in-30-seconds'],
      year: 2009,
      month: 4,
      day: 23,
      category: 'fashion',
      title: 'A marching-band reveal to open the Fearless Tour',
      snippet:
        'The opening number: a drum majorette uniform torn away mid-song to reveal a sparkling silver cocktail dress underneath.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_Tour',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Taylor_Swift_-_Fearless_Tour_-_Los_Angeles.jpg/500px-Taylor_Swift_-_Fearless_Tour_-_Los_Angeles.jpg',
      moment: {
        context:
          'The show opened with "You Belong with Me," Taylor in a drum majorette uniform that dancers stripped away mid-number to reveal the sparkling silver cocktail dress underneath.\n\nIt set the tone for a production she had a design hand in herself — a fairytale castle lit by more than a million lumens, LED projection walls, and a night of quick changes that ran through a crimson gown and a white wedding dress for "Love Story."',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Fearless_Tour' },
          { outlet: 'The Boot', url: 'https://theboot.com/taylor-swift-fearless-tour-first-headlining-tour-2009/' },
        ],
        // Image-fix pass (2026-07-10): this Los Angeles tour-stage photo does not
        // itself show the marching-band costume (right tour/era, loose pairing
        // per review) — caption reworded to describe it as a general Fearless
        // Tour stage photo rather than the specific band-uniform reveal. No
        // Commons photo of that exact costume moment could be verified.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Taylor_Swift_-_Fearless_Tour_-_Los_Angeles.jpg/500px-Taylor_Swift_-_Fearless_Tour_-_Los_Angeles.jpg',
            credit: 'Wikimedia Commons',
            caption: 'For reference — Taylor performing on the Fearless Tour stage in Los Angeles; not the specific band-uniform reveal described here.',
            kind: 'reference',
          },
        ],
        // Shop pass (2026-07-21): the exact tour costume is undocumented
        // past this description -- a current, verified in-stock silver
        // sequin mini in the same sparkling-cocktail-dress spirit.
        products: [
          {
            brand: 'Princess Polly',
            item: 'Miss Me Sequin Mini Dress',
            retailer: 'us.princesspolly.com',
            url: 'https://us.princesspolly.com/products/bombshell-sequin-mini-dress-silver',
            imageUrl: 'https://cdn.shopify.com/s/files/1/0061/8627/0804/files/1-modelinfo-anna-us2_50d8d45d-d7e9-436c-8612-a72cbd106a3e.jpg?v=1757460707',
            price: '$85.00',
            isAlternative: true,
            altNote: 'The exact tour costume is undocumented beyond this description -- a current silver sequin mini dress in the same sparkling-cocktail-dress spirit as the reveal underneath the uniform.',
          },
        ],
      },
    },

    // --- Active-tier batch (2026-07-04), per docs/decisions.md.
    {
      year: 2009,
      month: 9,
      day: 13,
      category: 'fashion',
      title: 'A silver sequined gown, worn into an interruption no one saw coming',
      snippet: 'A floor-length silver gown, matching the Moonman she was mid-speech with when Kanye West took the mic.',
      sourceUrl: 'https://www.eonline.com/news/1407066/revisiting-taylor-swift-and-kanye-wests-mtv-vmas-feud-15-years-later',
      thumbnailUrl: 'https://cdn.mos.cms.futurecdn.net/DQ3KoxNSJgDDtCrzfjpf83.jpg',
      moment: {
        context:
          'A one-shoulder, skin-toned KaufmanFranco gown covered in silver beads and sequins, finished with a bold red lip, per The Hollywood Reporter\'s VMA style retrospective — and she\'d arrived at the show in a Cinderella-style coach, leaning all the way into the fairytale staging.\n\nBy the time Beyoncé called her back out at the end of the night to finish her speech, she\'d already changed into the red strapless vintage dress from her performance — so the gown of the era\'s most infamous televised moment was only on screen for those few minutes.',
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/1407066/revisiting-taylor-swift-and-kanye-wests-mtv-vmas-feud-15-years-later',
          },
          {
            outlet: 'The Hollywood Reporter',
            url: 'https://www.hollywoodreporter.com/news/general-news/see-taylor-swifts-mtv-video-music-awards-11-year-style-evolution-1234123/',
          },
        ],
        // Image-fix pass (issue #745, 2026-08-24): the Getty comp URL always
        // rendered with a visible Getty watermark on the live site. Replaced
        // with Marie Claire's own CDN copy of the same red-carpet frame
        // (allowlisted host, unwatermarked). Verified live via probe() —
        // HTTP 206, image/jpeg, 1992x3000 — and visually confirmed
        // (one-shoulder silver/nude sequined gown, VMA '09 backdrop).
        photos: [
          {
            url: 'https://cdn.mos.cms.futurecdn.net/DQ3KoxNSJgDDtCrzfjpf83.jpg',
            credit: 'Getty Images, via Marie Claire',
            caption: 'The silver sequined KaufmanFranco gown on the VMA red carpet, Sept. 13, 2009.',
            kind: 'primary',
          },
        ],
        // Shop pass (2026-07-21): KaufmanFranco has no e-commerce -- a
        // current, verified in-stock alternative in the same silver
        // one-shoulder sequin silhouette.
        products: [
          {
            brand: 'WonderlandByLilian',
            item: 'Silver Sequin Evening Gown with Off-Shoulder Sleeves',
            retailer: 'wonderlandbylilian.com',
            url: 'https://wonderlandbylilian.com/products/silver-sequin-evening-gown-with-off-shoulder-sleeves-elegant-sequined-dress-with-draped-skirt-plus-size',
            imageUrl: 'https://cdn.shopify.com/s/files/1/0550/3919/7262/files/b2b9ca237ee2e9d0031ad3655088b7c0.png?v=1785294642',
            price: '$589.00',
            isAlternative: true,
            altNote: 'Her exact KaufmanFranco gown has no e-commerce path (brand has no current online store) -- this is a current made-to-order silver sequin off-shoulder gown in the same one-shoulder silhouette.',
          },
        ],
      },
    },

    // --- Sightings + fashion depth pass (2026-07-05)
    {
      year: 2009,
      month: 7,
      day: 30,
      category: 'sighting',
      title: 'Caught on the Valentine’s Day set with Taylor Lautner',
      snippet: 'Paparazzi photograph her and co-star Taylor Lautner filming track-and-field scenes at an LA high school — months before their romance went public.',
      sourceUrl: 'https://www.justjaredjr.com/photo-gallery/231981/taylor-lautner-taylor-swift-team-01/',
      // Image-fix pass (2026-07-10): team-01.jpg (previous thumbnail) showed
      // Lautner alone with crew — no Taylor Swift in frame — so the thumbnail
      // now points at the companion team-05.jpg, which does show her. See the
      // photos array below for the full note on that swap.
      thumbnailUrl: 'https://jj-justjaredjr-media.s3.amazonaws.com/wp-content/uploads/2009/07/lautner-swift/taylor-lautner-taylor-swift-team-05.jpg',
      relatedIds: [
        'moment:vault-fearless-a-hockey-date-with-taylor-lautner-at-the-staples-center',
        'moment:vault-fearless-a-few-months-with-her-valentines-day-co-star-taylor-lautner',
        'moment:vault-fearless-benihana-and-menchies-frozen-yogurt-with-taylor-lautner',
        // Cross-link (Stage 3, 2026-08-10): the movie's soundtrack single.
        'moment:vault-fearless-today-was-a-fairytale-breaks-a-download-record-in-a-week',
      ],
      moment: {
        context:
          'Shot July 30, 2009, the candids show Lautner clearing a high-jump bar on the track-and-field equipment while the pair filmed their Valentine’s Day roles as high school sweethearts — among the earliest public photos of the two Taylors together.\n\nThe Garry Marshall ensemble rom-com, released Feb. 12, 2010, cast Taylor as Felicia and Lautner as Willy — a young couple written to represent "the freshness of new love" — in what was her feature-film acting debut. The chemistry visible in these set photos read on screen, too: the pair went on to earn a Best Kiss nomination at the 2010 MTV Movie Awards.',
        sources: [
          {
            outlet: 'Just Jared Jr.',
            url: 'https://www.justjaredjr.com/photo-gallery/231981/taylor-lautner-taylor-swift-team-01/',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Valentine%27s_Day_(2010_film)',
          },
        ],
        // Image-fix pass (2026-07-10): removed team-01.jpg — it showed
        // Lautner alone with film crew; Taylor Swift does not appear in it at
        // all, on a moment specifically about her being on set. The remaining
        // team-05.jpg does show her (pulling on the track-and-field tee) and
        // is the item's sole photo now; it still carries a Just Jared
        // watermark and no unwatermarked replacement of this July 30, 2009
        // set day could be verified (not covered by Getty or other
        // allowlisted hosts), so that watermark issue is left unresolved —
        // flagging for manual sourcing rather than stripping the item to zero
        // photos.
        // Image-fix pass (2026-07-10 retry): broadened the search well past
        // the allowlist — Getty (multiple phrasings, oldest-sort, and the
        // "celebrity sightings bauer-griffin archival" event feed directly),
        // Wikimedia Commons (Category:Taylor_Swift_in_2009 and
        // Category:Taylor_Lautner_in_2009 — VMAs/Twilight/Comic-Con only,
        // nothing from this shoot), YouTube/official studio channels (movie
        // clips only, no candid stills), and Flickr (one repost of this same
        // paparazzi shot exists but is marked All Rights Reserved, not CC).
        // Getty has zero editorial coverage of this specific July 30, 2009
        // set day under any Swift/Lautner keyword combination — the shoot
        // appears to have been exclusive to Just Jared's own agency and
        // never got broader syndication. No clean candidate found; ticket
        // #203 stays SKIPPED-FINAL, sole photo left in place.
        photos: [
          {
            url: 'https://jj-justjaredjr-media.s3.amazonaws.com/wp-content/uploads/2009/07/lautner-swift/taylor-lautner-taylor-swift-team-05.jpg',
            credit: 'Just Jared Jr.',
          },
        ],
      },
    },
    {
      year: 2009,
      month: 10,
      day: 25,
      category: 'sighting',
      title: 'A hockey date with Taylor Lautner at the Staples Center',
      snippet: 'Spotted together at a Kings–Blue Jackets game after she picked him up from LAX — the outing that confirmed the "Taylor Squared" romance rumors.',
      sourceUrl: 'https://theboot.com/taylor-swift-taylor-lautner-3/',
      thumbnailUrl: 'https://people.com/thmb/G87KXPwCFp6mSACQ_efnqOa1wjg=/4000x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(551x307:553x309)/taylor-lautner-taylor-swift-3-0130-0fbe69f4661c4e5ea6ae4681b6a287e1.jpg',
      relatedIds: [
        'moment:vault-fearless-caught-on-the-valentines-day-set-with-taylor-lautner',
        'moment:vault-fearless-a-few-months-with-her-valentines-day-co-star-taylor-lautner',
        'moment:vault-fearless-benihana-and-menchies-frozen-yogurt-with-taylor-lautner',
      ],
      moment: {
        context:
          'On Oct. 25, 2009, Taylor picked Lautner up from the airport and the two headed to a Los Angeles Kings–Columbus Blue Jackets game at the Staples Center, then were seen together in a Beverly Hills hotel lobby that night.\n\nAn eyewitness said Taylor "was all dolled up and looked super pretty," while Lautner "was hiding under a hoody."',
        sources: [{ outlet: 'The Boot', url: 'https://theboot.com/taylor-swift-taylor-lautner-3/' }],
        // Image-fix pass (2026-07-10): the previous townsquare.media hotlink
        // was serving the site's own placeholder/logo graphic, not a real
        // photo. Image-fix pass (issue #745, 2026-08-24): the Getty comp URL
        // always rendered with a visible Getty watermark on the live site.
        // Replaced with People.com's own CDN copy of the same photo
        // (allowlisted host, unwatermarked). Verified live via probe() —
        // HTTP 206, image/jpeg, 1200x833 — and visually confirmed (both
        // Swift and Lautner seated together at the game).
        photos: [
          {
            url: 'https://people.com/thmb/G87KXPwCFp6mSACQ_efnqOa1wjg=/4000x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(551x307:553x309)/taylor-lautner-taylor-swift-3-0130-0fbe69f4661c4e5ea6ae4681b6a287e1.jpg',
            credit: 'Andrew D. Bernstein/NHLI via Getty Images, via People',
            caption: 'Together in the stands at the Kings-Blue Jackets game, Staples Center, Oct. 25, 2009.',
            kind: 'primary',
          },
        ],
      },
    },

    // --- Active-tier batch 2 (2026-07-04), per docs/decisions.md — real,
    // widely-reported relationship history from this era. (The Joe Jonas
    // breakup, Oct 2008, is dated a month before Fearless's Nov 11, 2008
    // start — see debut.mjs instead.)
    {
      year: 2009,
      month: 12,
      category: 'relationship',
      title: 'A few months with her Valentine\'s Day co-star, Taylor Lautner',
      snippet: 'A set romance that became real, then ended quietly by December — Lautner later confirmed on the record that she was the one who ended it.',
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-lautner-talks-taylor-swift-relationship-call-her-daddy-1235556301/',
      // Getty retirement pass (issue #935, 2026-08-24): the Getty comp URL
      // retired per the 2026-08-15 no-rehosted-third-party-press-photos
      // decision. Same Dec. 3, 2009 outing already has a verified People.com
      // CDN copy in the "Benihana" item just above (FameFlynet/Backgrid, via
      // People) — reused here rather than sourcing a second image of the
      // same day. Verified live via probe() — HTTP 206, image/jpeg.
      thumbnailUrl:
        'https://people.com/thmb/O6ePoeN7buQvyyFWlSBaP1--m08=/4000x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(527x431:529x433)/taylor-lautner-taylor-swift-0130-c1d2ef188ab7473d81c5910a05228eeb.jpg',
      // Cross-link (Stage 3, 2026-08-17): "Today Was a Fairytale," the song
      // written for the Valentine's Day movie she co-starred in with him.
      relatedIds: [
        'moment:vault-fearless-caught-on-the-valentines-day-set-with-taylor-lautner',
        'moment:vault-fearless-a-hockey-date-with-taylor-lautner-at-the-staples-center',
        'moment:vault-fearless-benihana-and-menchies-frozen-yogurt-with-taylor-lautner',
        'moment:vault-fearless-today-was-a-fairytale-breaks-a-download-record-in-a-week',
      ],
      moment: {
        context:
          'They met on the Valentine\'s Day set in 2009 playing high-school sweethearts, and the off-screen version lasted a few months before ending quietly.\n\nIt took until 2023, on Call Her Daddy, for Lautner to confirm on the record who ended it — "she did" — while making clear there was no bitterness left: he called the rekindling of their friendship "one of the greater things to happen in my life over the last year," adding, "when you respect somebody for who they are, like in their soul, it allows you to move on, forgive and continue that love in a different way."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-lautner-talks-taylor-swift-relationship-call-her-daddy-1235556301/',
          },
          {
            outlet: 'Yahoo Entertainment',
            url: 'https://www.yahoo.com/entertainment/taylor-swift-taylor-lautner-relationship-130738009.html',
          },
        ],
        // Image-fix pass (2026-07-10): the Just Jared Jr. hotlink carried a
        // baked-in watermark; replaced with an unwatermarked Getty candid of
        // the couple from the same Dec. 3, 2009 outing.
        // Getty retirement pass (issue #935, 2026-08-24): the Getty comp URL
        // retired per the 2026-08-15 decision. Replaced with the same
        // People.com CDN photo already verified for the "Benihana" item's
        // Dec. 3, 2009 outing (allowlisted host, unwatermarked). Verified
        // live via probe() — HTTP 206, image/jpeg — both Swift and Lautner
        // together, matches this record's date and subject.
        photos: [
          {
            url: 'https://people.com/thmb/O6ePoeN7buQvyyFWlSBaP1--m08=/4000x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(527x431:529x433)/taylor-lautner-taylor-swift-0130-c1d2ef188ab7473d81c5910a05228eeb.jpg',
            credit: 'FameFlynet/Backgrid, via People',
            caption:
              'Together in Los Angeles on Dec. 3, 2009 — weeks before the quiet breakup.',
            kind: 'primary',
            focalPoint: '50% 45%',
          },
        ],
      },
    },
    {
      year: 2009,
      month: 12,
      day: 3,
      category: 'sighting',
      title: 'Benihana and Menchie’s frozen yogurt with Taylor Lautner',
      snippet: 'Photographed leaving a Beverly Hills dinner with Taylor Lautner, carrying a giant pink box and a stuffed polar bear.',
      sourceUrl: 'https://www.justjaredjr.com/2009/12/04/taylor-lautner-taylor-swift-benihana-buds/',
      thumbnailUrl: 'https://people.com/thmb/O6ePoeN7buQvyyFWlSBaP1--m08=/4000x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(527x431:529x433)/taylor-lautner-taylor-swift-0130-c1d2ef188ab7473d81c5910a05228eeb.jpg',
      relatedIds: [
        'moment:vault-fearless-caught-on-the-valentines-day-set-with-taylor-lautner',
        'moment:vault-fearless-a-hockey-date-with-taylor-lautner-at-the-staples-center',
        'moment:vault-fearless-a-few-months-with-her-valentines-day-co-star-taylor-lautner',
      ],
      moment: {
        context:
          'On Dec. 3, 2009, after afternoon reshoots for Valentine’s Day at a local high school, Taylor and Lautner grabbed a snack at Menchie’s Frozen Yogurt and met up with co-star Emma Roberts (in a brunette wig) before heading to dinner at Benihana in Beverly Hills.\n\nThe paparazzi set caught the details that made the outing a fan favorite: the pair leaving with a giant pink box — presumed chocolates, per Just Jared Jr. — and a giant stuffed polar bear. The day had started as work, with the reshoots staged in the bleachers of a football field, and ended as one of the pair’s last widely photographed outings before the quiet December breakup.',
        sources: [
          {
            outlet: 'Just Jared Jr.',
            url: 'https://www.justjaredjr.com/2009/12/04/taylor-lautner-taylor-swift-benihana-buds/',
          },
        ],
        // Image-fix pass (2026-07-10): benihana-01.jpg carried a baked-in Just
        // Jared watermark, replaced with an unwatermarked Getty candid from
        // the same Dec. 3, 2009 outing. benihana-05.jpg was removed outright —
        // it actually showed a young woman at a fence gate (not Swift or
        // Lautner, likely Emma Roberts on set) and didn't depict this outing
        // at all.
        // Image-fix pass (issue #745, 2026-08-24): the Getty comp URL always
        // rendered with a visible Getty watermark on the live site. Replaced
        // with People.com's own CDN copy of the same Dec. 3, 2009 outing
        // (allowlisted host, unwatermarked). Verified live via probe() —
        // HTTP 206, image/jpeg, 1200x1546 — and visually confirmed (both
        // Swift and Lautner leaving Benihana together, matches the People
        // caption "spotted leaving dinner at Benihana and heading over to
        // Menchies Yogurt").
        photos: [
          {
            url: 'https://people.com/thmb/O6ePoeN7buQvyyFWlSBaP1--m08=/4000x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(527x431:529x433)/taylor-lautner-taylor-swift-0130-c1d2ef188ab7473d81c5910a05228eeb.jpg',
            credit: 'FameFlynet/Backgrid, via People',
            caption: 'Together in Los Angeles on the Dec. 3, 2009 outing.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2009,
      month: 12,
      day: 9,
      category: 'sighting',
      title: 'Ice cream with Emma Stone after a day of photo shoots',
      snippet: 'Peering into the case at a Baskin-Robbins in New York City with new friend Emma Stone, after a full day on set.',
      sourceUrl: 'https://www.justjaredjr.com/2009/12/10/taylor-swift-emma-stone-baskin-robbins-besties/',
      thumbnailUrl: 'https://jj-justjaredjr-media.s3.amazonaws.com/wp-content/uploads/2009/12/emma-taylor/emma-stone-taylor-swift-baskin-robbins-01.jpg',
      moment: {
        context:
          'Taylor described the Dec. 9, 2009 outing herself: "Photo shoot all day, followed by dinner with Emma Stone. Then we wandered around a candy store like wide-eyed little kids." The pair had dinner at Otto Restaurant before stopping at the ice cream shop.\n\nThe friendship was still new but already more than a year deep: the two met at the 2008 Young Hollywood Awards, and Stone later admitted she made the first move — "I listened to some of her music, and I wrote her an e-mail saying I liked her music, I swear. And then we started talking and hanging out." The Baskin-Robbins run was one of the friendship\'s first paparazzi-documented hangouts.',
        sources: [
          {
            outlet: 'Just Jared Jr.',
            url: 'https://www.justjaredjr.com/2009/12/10/taylor-swift-emma-stone-baskin-robbins-besties/',
          },
          {
            outlet: 'Wide Open Country',
            url: 'https://www.wideopencountry.com/taylor-swift-emma-stone-friendship/',
          },
        ],
        // Image-fix pass (2026-07-10): removed baskin-robbins-03.jpg — it
        // showed Swift alone; Emma Stone does not appear in it, on a moment
        // specifically about the two of them together. The remaining
        // baskin-robbins-01.jpg does show both of them and is the item's sole
        // photo now; it still carries Just Jared watermarks and no
        // unwatermarked replacement of this Dec. 9, 2009 outing could be
        // verified (not covered by Getty or other allowlisted hosts), so that
        // watermark issue is left unresolved — flagging for manual sourcing
        // rather than stripping the item to zero photos.
        // Image-fix pass (2026-07-10 retry): broadened the search well past
        // the allowlist — Getty (multiple phrasings, oldest-sort on both the
        // "taylor-swift-emma-stone" tag and the "celebrity sightings
        // bauer-griffin archival" event feed directly — earliest hit is
        // April 2010, nothing from Dec. 2009), Wikimedia Commons
        // (Category:Taylor_Swift_in_2009 — VMA photos only), YouTube/press
        // (no candid stills beyond the Just Jared gallery), and Flickr/other
        // aggregators (hawtcelebs, gotceleb, celebmafia — no hits for this
        // outing at all). This Dec. 9, 2009 Baskin-Robbins outing appears to
        // have been exclusive to Just Jared's own agency and never got
        // broader syndication. No clean candidate found; ticket #206 stays
        // SKIPPED-FINAL, sole photo left in place.
        photos: [
          {
            url: 'https://jj-justjaredjr-media.s3.amazonaws.com/wp-content/uploads/2009/12/emma-taylor/emma-stone-taylor-swift-baskin-robbins-01.jpg',
            credit: 'Just Jared Jr.',
          },
        ],
      },
    },
    {
      year: 2009,
      month: 12,
      day: 11,
      category: 'relationship',
      title: 'A duet with John Mayer fuels dating rumors',
      snippet: "A live 'Half of My Heart' at Z100's Jingle Ball, obvious onstage chemistry, a 12-year age gap — and rumors that became a real, brief relationship.",
      sourceUrl: 'https://www.billboard.com/music/music-news/john-mayer-taylor-swift-duet-half-of-my-heart-performance-1235291747/',
      thumbnailUrl:
        'https://i.ytimg.com/vi/U8k_Paf4E14/maxresdefault.jpg',
      moment: {
        context:
          'Mayer, then 31, had invited 19-year-old Taylor to sing on "Half of My Heart" while he was still finishing Battle Studies, and their live duet at Z100\'s Jingle Ball made the chemistry public. The romance the rumors predicted did happen — and was over within a couple of months.\n\nThe real aftermath arrived on her next album: "Dear John" called out the age gap directly, and Mayer fired back in a 2012 Rolling Stone interview, calling it "cheap songwriting" and "a really lousy thing to do."',
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/john-mayer-taylor-swift-duet-half-of-my-heart-performance-1235291747/',
          },
          {
            outlet: 'Fox News',
            url: 'https://www.foxnews.com/entertainment/taylor-swift-speak-now-re-release-resurfaces-old-john-mayer-love-story',
          },
          {
            outlet: 'Just Jared Jr. (photo gallery — Z100 Jingle Ball, Dec. 11, 2009)',
            url: 'https://www.justjaredjr.com/2009/12/12/taylor-swift-jingles-all-the-way/',
          },
        ],
        photos: [
          {
            url: 'https://i.ytimg.com/vi/U8k_Paf4E14/maxresdefault.jpg',
            // Both singers' faces sit in the top third; bias upward to keep them.
            focalPoint: '48% 24%',
            credit: 'Still from Samantha Faigen\'s Dec. 11, 2009 concert footage, via YouTube',
            caption:
              'Onstage with John Mayer for the "Half of My Heart" duet at Z100\'s Jingle Ball, Madison Square Garden, Dec. 11, 2009.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 2,
      day: 5,
      category: 'sighting',
      title: 'Touching down in Sydney for the tour’s Australian leg',
      snippet: "Photographed arriving at Sydney Airport mid-leg — the day after the Fearless Tour's five-city Australian run opened in Brisbane, and the day before her two Acer Arena shows.",
      sourceUrl: 'https://taylorpictures.net/thumbnails.php?album=812',
      thumbnailUrl: 'https://taylorpictures.net/albums/candids/2010/5-2%20Arriving%20to%20Sydneys%20Airport/001.jpg',
      moment: {
        context:
          'Taylor landed in Sydney on Feb. 5, 2010 ahead of the Australian leg of the Fearless Tour — a five-city, week-long run that had opened at the Brisbane Entertainment Centre the night before and reached Sydney’s Acer Arena for two shows on Feb. 6 and 7.\n\nThe leg carried on through Newcastle, Melbourne’s Rod Laver Arena and Adelaide by Feb. 12, with country trio Gloriana opening, and played to roughly 78,000 people across the week — the Fearless show’s only visit to Australia before the tour wrapped that July.',
        sources: [
          { outlet: 'Taylor Swift Web Photo Gallery', url: 'https://taylorpictures.net/thumbnails.php?album=812' },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Fearless_Tour' },
        ],
        // Image-fix pass (2026-07-10): the previous URL was the gallery's
        // 205x400 "normal_" thumbnail preview; swapped to the same gallery's
        // full-size original (same filename, no "normal_" prefix). Verified
        // HTTP 200 + image/jpeg (2500x4859) and visually confirmed (red dress,
        // curled hair, night arrival) this session.
        photos: [
          {
            url: 'https://taylorpictures.net/albums/candids/2010/5-2%20Arriving%20to%20Sydneys%20Airport/001.jpg',
            credit: 'Taylor Swift Web Photo Gallery',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 3,
      day: 23,
      category: 'sighting',
      title: 'Bowling with Selena Gomez in Studio City',
      snippet: 'An off-duty afternoon at Pinz Bowling Center with Selena Gomez, early in a friendship that would become one of her most enduring.',
      sourceUrl: 'https://www.taylorpictures.net/displayimage.php?album=874&pid=47589',
      thumbnailUrl:
        'https://taylorpictures.net/albums/candids/2010/23-3%20Selena%20Gomez%20and%20Taylor%20Swift%20at%20Pinz%20Bowling%20in%20Studio%20City/normal_001.jpg',
      moment: {
        context:
          'On March 23, 2010, Taylor and Gomez spent the afternoon bowling with a group of friends at Pinz Bowling Center in Studio City, California — a casual, camera-ready hangout from the earliest stretch of their friendship.\n\nThe two had met in 2008 while dating brothers — "I dated Nick, and she dated Joe. And it was cute, we were young," Gomez has said of the Jonas Brothers chapter — and bonded when both relationships ended, agreeing that "the best thing we got out of those relationships was each other." By this 2010 afternoon the friendship had already outlasted both romances, on its way to becoming one of the longest-running in Taylor\'s circle.',
        sources: [
          {
            outlet: 'Taylor Swift Web Photo Gallery',
            url: 'https://www.taylorpictures.net/displayimage.php?album=874&pid=47589',
          },
          {
            outlet: 'Hola!',
            url: 'https://www.hola.com/us/celebrities/20250807849060/selena-gomez-jonas-brothers-taylor-swift-friendship/',
          },
        ],
        photos: [
          {
            url: 'https://taylorpictures.net/albums/candids/2010/23-3%20Selena%20Gomez%20and%20Taylor%20Swift%20at%20Pinz%20Bowling%20in%20Studio%20City/normal_001.jpg',
            credit: 'Taylor Swift Web Photo Gallery',
          },
        ],
      },
    },
    // --- Music/business/tour depth pass (2026-07-05)
    {
      year: 2008,
      month: 10,
      day: 28,
      category: 'music',
      title: "You're Not Sorry, and the ex-boyfriend who felt like Prince Charming",
      snippet: "He \"came across as Prince Charming\" — until Taylor found out how many secrets he'd been keeping from her.",
      sourceUrl: "https://en.wikipedia.org/wiki/You%27re_Not_Sorry",
      thumbnailUrl:
        'https://i.ytimg.com/vi/hNiMWIwAr3k/hqdefault.jpg',
      moment: {
        context:
          'She\'s said the inspiration was an ex-boyfriend whose lies took a while to surface: "He came across as Prince Charming [...] who had a lot of secrets that he didn\'t tell me about." The situation became a "breaking point" where she felt she had to walk away before getting hurt further.\n\nShe wrote the song alone and produced it with Nathan Chapman at Blackbird Studio in Nashville, releasing it Oct. 28, 2008 as a promotional single ahead of the album.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/You%27re_Not_Sorry' }],
        photos: [
          {
            url: 'https://i.ytimg.com/vi/hNiMWIwAr3k/hqdefault.jpg',
            focalPoint: '50% 45%',
            credit: "Fearless Tour performance still, via Taylor Swift's Tour Extras on YouTube",
            caption: 'Performing the "You\'re Not Sorry" piano mashup on the Fearless Tour.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2008,
      month: 11,
      day: 11,
      category: 'music',
      title: 'The Way I Loved You, written with John Rich about missing the chaos',
      snippet: 'She met a guy who seemed perfect on paper — then wrote a song, with country outlaw John Rich, about missing an ex who wasn\'t.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Way_I_Loved_You',
      thumbnailUrl:
        'https://i.ytimg.com/vi/IY43emg0W6Y/hqdefault.jpg',
      moment: {
        context:
          'Taylor was inspired after meeting someone who seemed like the ideal partner but didn\'t feel as exciting as a more toxic ex. She brought the idea to a writing session with John Rich, saying he related "because he is that complicated, frustrating messy guy in his relationships."\n\nShe called the collaboration "just so cool" and Rich "an incredible writer"; he, in turn, was impressed by her songwriting and connection with her audience at her age.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Way_I_Loved_You' }],
        // Issue #743: replaced generic album art with a verified still from
        // an actual Fearless Tour performance of this song.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/IY43emg0W6Y/hqdefault.jpg',
            // Photo pass #762 (2026-07-31): viewed. Profile turned left, curls
            // fanned out around her face — face sits left-of-center, upper third.
            focalPoint: '42% 46%',
            credit: "Fearless Tour performance still, via Taylor Swift's Tour Extras on YouTube",
            caption: 'Performing "The Way I Loved You" on the Fearless Tour.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2008,
      month: 11,
      day: 11,
      category: 'music',
      title: 'Forever & Always, added a day before the tracklist was locked',
      snippet: 'Written about her breakup with Joe Jonas — the last song she finished for Fearless, one day before the album was mastered.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Forever_%26_Always',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Taylor_Swift_-_Fearless_Tour_-_Los_Angeles_04.jpg/500px-Taylor_Swift_-_Fearless_Tour_-_Los_Angeles_04.jpg',
      moment: {
        context:
          'Taylor pleaded with Big Machine\'s Scott Borchetta to add the track a day before the tracklist was finalized, because it was about "something really, really dramatic and crazy." She\'s described her writing process as reactive: "I can write something, call up my producer, we can get in the studio, put a rush on it, get an overnight mix."\n\nOn Ellen that November, she first guessed Jonas had ended things "over the phone in 25 seconds," then said she\'d actually checked her call log afterward and corrected herself: it was 27 seconds — "that\'s got to be a record." She felt she "owed it" to fans to be open about it; Jonas later called her response "flattering."',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Forever_%26_Always' }],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Taylor_Swift_-_Fearless_Tour_-_Los_Angeles_04.jpg/500px-Taylor_Swift_-_Fearless_Tour_-_Los_Angeles_04.jpg',
            credit: 'Wikimedia Commons',
            // Focal point set 2026-07-18 by viewing (500x648): she stands on
            // the red couch mid-frame in the sequined dress, face just above
            // center-left; "They shouldn't do..." lyric screens above/below.
            focalPoint: '46% 44%',
          },
          // Photo pass #762 (2026-07-18): Commons portrait of Joe Jonas —
          // the 27-second phone call this song answers — EXIF-dated Sept. 10,
          // 2008, one month before the breakup (era context). Commons license
          // API-verified CC BY-SA 2.0; curl 200 image/jpeg 500x690,
          // downloaded and vision-confirmed (clean close-up, no watermark;
          // rejected a Concert-for-Hope alternative that carried a
          // photographer watermark).
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Joe_Jonas_cropped.jpg/500px-Joe_Jonas_cropped.jpg',
            credit: 'Wikimedia Commons (CC BY-SA 2.0) — Joe Jonas, September 2008 (archival, era context)',
            caption: 'Joe Jonas in September 2008 — weeks before the 27-second phone call that got a song added to Fearless a day before mastering.',
            kind: 'archival',
            // Focal point set by viewing: tight head shot, eyes just above
            // the vertical midpoint.
            focalPoint: '50% 40%',
          },
        ],
      },
    },
    {
      year: 2009,
      month: 10,
      day: 26,
      category: 'music',
      title: "Untouchable, the one Fearless song she didn't write alone from scratch",
      snippet: 'A cover of a Luna Halo rock song her label president introduced her to — reworked into a stripped-down country-pop bonus track.',
      sourceUrl: 'https://theboot.com/taylor-swift-untouchable/',
      thumbnailUrl: 'https://i.ytimg.com/vi/7uQ5gCqASaY/hqdefault.jpg',
      moment: {
        context:
          'Taylor discovered Luna Halo\'s "Untouchable" when her label president gave her the band\'s album, then debuted a stripped-down cover during a 2008 "Stripped" session before including a reworked version — new lyrics and arrangement, earning her a co-writing credit — on the Fearless: Platinum Edition.\n\nLuna Halo\'s Nathan Barlowe on her pick: "She could have chosen any cover in the world, but that\'s what she chose."',
        sources: [
          { outlet: 'The Boot', url: 'https://theboot.com/taylor-swift-untouchable/' },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Luna_Halo_(album)' },
        ],
        photos: [
          {
            url: 'https://i.ytimg.com/vi/7uQ5gCqASaY/hqdefault.jpg',
            focalPoint: '50% 42%',
            credit: 'Taylor Swift official artist channel / YouTube',
            caption: 'Performing "Untouchable" for Clear Channel Stripped in 2008.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      significance: 'notable', // a decade-long chart record from her very first #1 album (docs/decisions.md, 2026-07-19)
      year: 2009,
      month: 3,
      day: 14,
      category: 'business',
      title: 'Fearless spends 11 weeks at No. 1 — a record for the whole decade',
      snippet: 'Eleven non-consecutive weeks atop the Billboard 200: the longest run for a female country album, and for any album released in the 2000s.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Taylor_Swift_during_Fearless_Tour_concert_in_Portland_02.jpg/500px-Taylor_Swift_during_Fearless_Tour_concert_in_Portland_02.jpg',
      moment: {
        context:
          'After debuting at No. 1 with 592,000 first-week copies, Fearless spent 11 non-consecutive weeks atop the Billboard 200 — the longest run for a female country album, and for any album in the 2000s decade. It logged 58 weeks in the top 10, a record for a country act, and was the only 2000s album to spend its entire first year there.\n\nThe number kept its stature inside her own catalog for a while, too: when The Tortured Poets Department reached an 11th week at No. 1 in July 2024, Billboard framed it as tying Fearless and 1989 as her longest-leading albums — before TTPD pushed on to 17 weeks, the 11-week mark her teenage self set was the one to catch for 15 years.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)' },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/chart-beat/taylor-swift-ties-career-best-11-weeks-number-one-billboard-200-tortured-poets-department-1235725955/',
          },
        ],
        photos: [
          // Photo pass #762 (2026-07-18): Commons shot from the Fearless
          // Tour's Portland stop, EXIF-dated May 16, 2009 — taken inside the
          // very spring the album was logging its record 11 weeks at No. 1
          // (era context; a tour date, not a chart ceremony). Commons license
          // API-verified CC BY 2.0 (calmdownlove); curl 200 image/jpeg
          // 500x862, downloaded and vision-confirmed (gold sequined dress,
          // fist raised, Ludwig kit behind).
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Taylor_Swift_during_Fearless_Tour_concert_in_Portland_02.jpg/500px-Taylor_Swift_during_Fearless_Tour_concert_in_Portland_02.jpg',
            credit: 'calmdownlove, Wikimedia Commons (CC BY 2.0) — Fearless Tour, Portland, May 16, 2009 (archival, era context)',
            caption: 'On the Fearless Tour in Portland, May 2009 — mid-victory-lap for an album spending its eleventh week at No. 1 that spring.',
            kind: 'primary',
            // Focal point set by viewing: tall frame; she stands center-left,
            // face upper-left quadrant beneath the raised fist.
            focalPoint: '32% 24%',
          },
          // Photo pass #762 (2026-08-25): a second image — no chart-ceremony
          // photo exists for a Billboard 200 record (there is no ceremony),
          // so era context again, distinct from the Portland tour shot above:
          // a red-carpet portrait from April 2, 2009, three weeks after the
          // March 14 11th-week milestone. Commons VRT-confirmed free-use
          // permission (ticket #2009121510015033); curl-verified 200
          // image/jpeg, downloaded and vision-confirmed (close portrait,
          // updo hair, strapless dress).
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/TaylorSwiftApr09.jpg',
            focalPoint: '48% 30%',
            credit: 'Angela George, Wikimedia Commons (free use, VRT-confirmed)',
            caption:
              'At the "Hannah Montana: The Movie" premiere, April 2, 2009 — three weeks after Fearless logged its record-setting 11th week at No. 1 (era context, not a chart-ceremony photo).',
            kind: 'reference',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 1,
      day: 7,
      category: 'business',
      title: 'The best-selling album in America — for all of 2009',
      snippet: '3.217 million copies sold in the US in 2009 alone, making 20-year-old Taylor the youngest artist — and only female country act — with a calendar-year best-seller.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Taylor_Swift_Fearless_Tour_02.jpg',
      moment: {
        context:
          'With 3.217 million copies sold in the United States throughout 2009, Fearless was the year\'s best-selling album in the country, making Taylor, then 20, the youngest artist and the only female country musician to have a best-selling album of a calendar year.\n\nIt also spent a total of 58 weeks in the Billboard 200\'s top 10 — a record for a country musician, and the only 2000s album to spend its first full year there.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)' }],
        // Photo-enrichment run 16 (2026-07-18, #762): added a CC BY 2.0 Commons
        // shot from the Fearless Tour's 2010 leg (WEZL, Apr. 30, 2010) —
        // license verified via the Commons API, URL verified HTTP 200 +
        // image/jpeg, downloaded and visually confirmed (Swift mid-song in the
        // sparkling violet dress). Per-image focal points set by eye.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Taylor_Swift_Fearless_Tour_02.jpg',
            credit: 'WEZL (CC BY 2.0), via Wikimedia Commons',
            caption: 'On the Fearless Tour in April 2010, just after Fearless closed 2009 as America\'s best-selling album.',
            kind: 'primary',
            focalPoint: '35% 30%',
          },
        ],
      },
    },
    {
      significance: 'notable', // a genuine, historic first — the earliest stadium-scale record in a career full of them (docs/decisions.md, 2026-07-19)
      year: 2010,
      month: 6,
      day: 5,
      category: 'tour',
      title: 'First woman to headline and sell out Gillette Stadium',
      snippet: '56,868 fans and $3.7 million in ticket sales — the Fearless Tour\'s single highest-grossing night.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_Tour',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Taylor_Swift_-_You_Belong_With_Me_-_Fearless_Tour_2010_at_Gillette_Stadium.jpg/500px-Taylor_Swift_-_You_Belong_With_Me_-_Fearless_Tour_2010_at_Gillette_Stadium.jpg',
      moment: {
        context:
          'On June 5, 2010, the Fearless Tour stop at Gillette Stadium in Foxborough, Massachusetts brought in $3.7 million in ticket sales from 56,868 concertgoers — the tour\'s highest-grossing show — and made Taylor the first female musician to headline and sell out Gillette Stadium.\n\nIt was also the tour\'s final US date, and Billboard\'s review caught her playing to the home crowd: she pulled on a No. 13 Patriots jersey mid-show, walked the stands hugging fans through an acoustic set, and closed under the waterfall effect that soaked her at the end of every night.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Fearless_Tour' },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-june-5-2010-foxboro-mass-957869/',
          },
        ],
        // Photo pass (2026-07-19, Tier 3): added a second Commons frame from
        // the same June 5, 2010 Gillette show, curl-verified live.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Taylor_Swift_-_You_Belong_With_Me_-_Fearless_Tour_2010_at_Gillette_Stadium.jpg/500px-Taylor_Swift_-_You_Belong_With_Me_-_Fearless_Tour_2010_at_Gillette_Stadium.jpg',
            focalPoint: '48% 25%',
            credit: 'Meltedheadaches / Wikimedia Commons, CC BY-SA 2.0',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/8/81/Taylor_Swift_-_Fearless_Tour_-_Foxboro12.jpg',
            focalPoint: '50% 55%',
            credit: 'Meltedheadaches / Wikimedia Commons, CC BY-SA 2.0',
            caption: 'Performing at the same Gillette Stadium show, June 5, 2010.',
            kind: 'archival',
          },
        ],
      },
    },


    // --- Deep timeline fill (2026-07-08, content/deep-a): the era's singles
    // and reissue (release was empty), song origin stories, tour lore, the
    // 2009 CMA sweep, and her acting/SNL firsts. Every claim verified against
    // its cited source this session; business items carry two independent
    // sources per the framework.
    {
      slug: 'love-story-single-release',
      // Cross-link (Stage 3, 2026-07-30): sibling "Love Story" moment.
      relatedIds: ['moment:vault-fearless-love-story-and-the-boy-her-family-didnt-approve-of'],
      year: 2008,
      month: 9,
      day: 15,
      category: 'release',
      title: 'Love Story arrives two months before the album',
      snippet:
        'Sept. 15, 2008: the lead single from Fearless goes out to country radio ahead of the album — and starts a climb that wouldn\'t stop until it had topped pop radio too.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor_Swift_song)',
      thumbnailUrl: 'https://i.ytimg.com/vi/8xg3vE8Ie_E/hqdefault.jpg',
      moment: {
        context:
          'It peaked at No. 4 on the Hot 100, spent two weeks atop Hot Country Songs — and five months later became the first country song ever to hit No. 1 on Billboard\'s pop-radio chart (see February 2009).\n\nThe long tail is the real story: roughly 18 million copies sold worldwide make it one of the best-selling singles ever released, and its 6.2 million US copies still stand as her biggest-selling song at home — a lead single that outsold everything the superstar decade that followed produced.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor_Swift_song)',
            source_title: 'Love Story (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Wide Open Country',
            url: 'https://www.wideopencountry.com/love-story-taylor-swift/',
            source_title: "'Love Story': The Story Behind The Classic Taylor Swift Song",
            publisher: 'Wide Open Country',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 3,
          },
        ],
        // Photo-enrichment run 16 (2026-07-18, #762): added a still from the
        // official "Love Story" music video, which premiered Sept. 12, 2008,
        // days before the single's radio release — video id verified via
        // YouTube oEmbed (title "Taylor Swift - Love Story", channel
        // @TaylorSwift); thumbnail verified HTTP 200 + image/jpeg, downloaded
        // and visually confirmed. Per-image focal points set by eye.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/8xg3vE8Ie_E/hqdefault.jpg',
            credit: 'Big Machine Records / YouTube (official music video still)',
            caption: 'The sepia close-up from the official "Love Story" video, which premiered days before the single went to country radio.',
            kind: 'archival',
            focalPoint: '48% 40%',
          },
        ],
      },
    },
    {
      slug: 'white-horse-single-release',
      // Cross-link (Stage 3, 2026-08-13): Phil Collins's 2026 recollection of
      // hearing the song early.
      relatedIds: ['moment:vault-tloas-phil-collins-taylors-early-white-horse-blew-me-away-complete'],
      year: 2008,
      month: 12,
      day: 8,
      category: 'release',
      title: "White Horse, the single Grey's Anatomy saved for Fearless",
      snippet:
        'She\'d considered holding "White Horse" for her third album — until Grey\'s Anatomy used it in its season-five premiere, and it became the second Fearless single that December.',
      sourceUrl: 'https://en.wikipedia.org/wiki/White_Horse_(Taylor_Swift_song)',
      thumbnailUrl: 'https://i.ytimg.com/vi/D1Xr-JFLxik/hqdefault.jpg',
      moment: {
        context:
          'A devoted Grey\'s fan, she didn\'t undersell the moment: "You should\'ve seen tears streaming down my face when I got the phone call that they were going to use that song." The September 2008 premiere placement settled the tracklist question — "if it wasn\'t going to be on the show, then we weren\'t going to put it on the album," she admitted — and the song itself runs the fairy-tale imagery of the rest of Fearless in reverse. As she put it to CMT: "this is not a fairy tale at all — this is real life."\n\nThe single followed in December, peaked at No. 13 on the Hot 100, and later took two Grammys: Best Country Song and Best Female Country Vocal Performance.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/White_Horse_(Taylor_Swift_song)',
            source_title: 'White Horse (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Songfacts',
            url: 'https://www.songfacts.com/facts/taylor-swift/white-horse',
            source_title: 'White Horse by Taylor Swift',
            publisher: 'Songfacts',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
        ],
        // T16 photo pass (2026-07-09): cover art taken from the Wikipedia
        // article's stable upload.wikimedia.org copy; verified HTTP 200 +
        // image/png this session.
        // Photo-enrichment run 16 (2026-07-18, #762): added a still from the
        // official "White Horse" music video — id verified via YouTube oEmbed
        // (title "Taylor Swift - White Horse", channel @TaylorSwift);
        // thumbnail verified HTTP 200 + image/jpeg, downloaded and visually
        // confirmed (the video's brick-walled apartment scene). Per-image
        // focal points set by eye.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/D1Xr-JFLxik/hqdefault.jpg',
            credit: 'Big Machine Records / YouTube (official music video still)',
            caption: 'From the official "White Horse" video — the un-fairy-tale the song promises.',
            kind: 'archival',
            focalPoint: '58% 30%',
          },
        ],
      },
    },
    {
      slug: 'fearless-platinum-edition',
      year: 2009,
      month: 10,
      day: 26,
      category: 'release',
      title: 'Fearless: Platinum Edition adds six new songs to a No. 1 album',
      snippet:
        'Oct. 26, 2009: the Platinum Edition reissue drops six new tracks — "Jump Then Fall," "Untouchable," a piano "Forever & Always," "Come In with the Rain," "SuperStar," and "The Other Side of the Door."',
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/c/c4/Taylor_Swift_Fearless_Tour_05.jpg',
      moment: {
        context:
          'Announced Sept. 10, 2009 and released mid-tour, the reissue placed the six new songs ahead of the original tracklist and paired the CD with a DVD — keeping a year-old blockbuster in the conversation straight through awards season.\n\nThe DVD side was a fan-service time capsule: the music videos for "Change," "The Best Day," "Love Story," "White Horse" and "You Belong with Me," behind-the-scenes footage from the latter three shoots and from the Fearless Tour\'s opening night, plus "Thug Story" — the CMT Awards rap spoof with T-Pain. The reissue also queued up one more single: the title track, "Fearless," released that January.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
            source_title: 'Fearless (Taylor Swift album)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // Photo-enrichment run 16 (2026-07-18, #762): added a CC BY 2.0
        // Commons shot of the Fearless Tour's acoustic set (WEZL, Apr. 30,
        // 2010) — the tour this reissue was released into. License verified
        // via the Commons API, URL verified HTTP 200 + image/jpeg, downloaded
        // and visually confirmed (yellow dress, cowboy boots, acoustic
        // guitar on the stool). Per-image focal points set by eye.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Taylor_Swift_Fearless_Tour_05.jpg',
            credit: 'WEZL (CC BY 2.0), via Wikimedia Commons',
            caption: 'The Fearless Tour\'s acoustic set, April 2010 — the reissue kept a year-old album running deep into its tour.',
            kind: 'archival',
            focalPoint: '32% 35%',
          },
        ],
      },
    },
    {
      slug: 'today-was-a-fairytale-release',
      year: 2010,
      month: 1,
      day: 26,
      category: 'release',
      // Cross-link (Stage 3, 2026-08-10): the Valentine's Day set the
      // soundtrack single came from.
      // Cross-link (Stage 3, 2026-08-17): the few months she and Lautner
      // dated after meeting on that set.
      relatedIds: [
        'moment:vault-fearless-caught-on-the-valentines-day-set-with-taylor-lautner',
        'moment:vault-fearless-a-few-months-with-her-valentines-day-co-star-taylor-lautner',
      ],
      title: 'Today Was a Fairytale breaks a download record in a week',
      snippet:
        'A one-off for the Valentine\'s Day soundtrack, released Jan. 19, 2010 on iTunes only — 325,000 downloads in week one, the biggest ever for a female artist at the time.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Today_Was_a_Fairytale',
      thumbnailUrl: 'https://i.ytimg.com/vi/xSWVPqnKcXQ/hqdefault.jpg',
      moment: {
        context:
          'The record it broke was Britney Spears\'s "Womanizer." It debuted at No. 2 on the Hot 100 and went to No. 1 in Canada — her first Canadian Hot 100 chart-topper — all from a soundtrack single for the rom-com she was starring in with Taylor Lautner.\n\nThe song itself was a leftover: she\'d written it back in summer 2008 and offered it to the film\'s producers because it didn\'t fit the album she was building. Twelve days after release she sang it at the 52nd Grammys in a medley with Stevie Nicks — the performance whose shaky vocals drew enough criticism that her label chief publicly defended her — and it finally joined the era\'s official canon on Fearless (Taylor\'s Version) in 2021.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Today_Was_a_Fairytale',
            source_title: 'Today Was a Fairytale',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Songfacts',
            url: 'https://www.songfacts.com/facts/taylor-swift/today-was-a-fairytale',
            source_title: 'Today Was a Fairytale by Taylor Swift',
            publisher: 'Songfacts',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        photos: [
          // Photo-enrichment run 16 (2026-07-18, #762): no official video was
          // made for the 2010 original (the HD "music video" uploads are
          // fan-made — rejected), so this is the title card of the official
          // Today Was A Fairytale (Taylor's Version) lyric video — id verified
          // via YouTube oEmbed (channel @TaylorSwift); thumbnail verified
          // HTTP 200 + image/jpeg, downloaded and visually confirmed.
          {
            url: 'https://i.ytimg.com/vi/xSWVPqnKcXQ/hqdefault.jpg',
            credit: 'Taylor Swift via YouTube (official lyric video)',
            caption: 'The title card of the Taylor\'s Version lyric video, built from the single\'s white-dress cover shoot.',
            kind: 'archival',
            focalPoint: '50% 45%',
          },
        ],
      },
    },
    {
      slug: 'hey-stephen-liner-code',
      year: 2008,
      month: 11,
      day: 11,
      category: 'music',
      title: 'Hey Stephen, addressed to the opening act',
      snippet:
        'Written about Stephen Barker Liles of Love and Theft, who\'d opened shows for her — and she spelled out who it was for in the album\'s hidden liner-note code: "LOVE AND THEFT."',
      sourceUrl: 'https://en.wikipedia.org/wiki/Hey_Stephen',
      thumbnailUrl: 'https://i.ytimg.com/vi/tMhiHrL7rPE/hqdefault.jpg',
      moment: {
        context:
          'Every Fearless lyric sheet hid a capitalized-letter message inside the printed lyrics; "Hey Stephen"\'s decoded to the name of its subject\'s band — the era\'s Easter-egg culture, already fully operational in 2008.\n\nTaylor texted Liles about the song after the album dropped, and his first reaction was dread: "What did I do? Because she doesn\'t really write very many nice songs about guys. So I was very relieved when it turned out to be a nice song." He eventually answered in kind, writing Taylor a response song, "Try to Make It Anyway," recorded in his home studio and released in 2011.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Hey_Stephen',
            source_title: 'Hey Stephen',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'The Boot',
            url: 'https://theboot.com/stephen-barker-liles-taylor-swift-song/',
            source_title: "Taylor Swift's 'Hey Stephen' Inspiration Returns the Favor",
            publisher: 'The Boot',
            source_type: 'reputable_press',
            accessed_at: '2026-07-09',
            reliability_score: 3,
          },
        ],
        photos: [
          // Photo-enrichment run 16 (2026-07-18, #762): still from the
          // official Hey Stephen (Taylor's Version) lyric video — id verified
          // via YouTube oEmbed (channel @TaylorSwift); thumbnail verified
          // HTTP 200 + image/jpeg, downloaded and visually confirmed (Swift
          // in profile at the mic).
          {
            url: 'https://i.ytimg.com/vi/tMhiHrL7rPE/hqdefault.jpg',
            credit: 'Taylor Swift via YouTube (official lyric video)',
            caption: 'The title card of the Hey Stephen (Taylor\'s Version) lyric video.',
            kind: 'archival',
            focalPoint: '78% 28%',
          },
        ],
      },
    },
    {
      slug: 'you-belong-with-me-video',
      year: 2009,
      month: 5,
      day: 4,
      category: 'music',
      title: 'One video, two Taylors: You Belong with Me hits screens',
      snippet:
        'She plays both the girl next door and the mean-girl cheerleader in the "You Belong with Me" video, opposite Lucas Till — the clip that would win Best Female Video at the VMAs.',
      sourceUrl: 'https://en.wikipedia.org/wiki/You_Belong_with_Me',
      thumbnailUrl: 'https://i.ytimg.com/vi/VuNIsY6JdUw/hqdefault.jpg',
      moment: {
        context:
          'Premiered in May 2009 as the album\'s third single took off, the split-role video became the era\'s defining visual — and its VMA win that September is the reason the Kanye West moment happened at all.\n\nRoman White shot it over two days at Pope John Paul II High School near her Hendersonville home town, with Taylor playing both "the nerd, who is pining away for this guy that she can\'t have" and "the popular girl — horrible, scary, intimidating and perfect"; White has said the closing kiss with Lucas Till took about 45 takes. The song matched the video\'s reach, peaking at No. 2 on the Hot 100 (blocked only by "I Gotta Feeling") and becoming the first country song to top the all-genre Radio Songs airplay chart.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/You_Belong_with_Me',
            source_title: 'You Belong with Me',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Songfacts',
            url: 'https://www.songfacts.com/facts/taylor-swift/you-belong-with-me',
            source_title: 'You Belong With Me by Taylor Swift',
            publisher: 'Songfacts',
            source_type: 'wiki',
            accessed_at: '2026-07-09',
            reliability_score: 2,
          },
        ],
        // Official video id VuNIsY6JdUw was verified via YouTube oEmbed
        // (title "Taylor Swift - You Belong With Me", channel @TaylorSwift).
        photos: [
          {
            url: 'https://i.ytimg.com/vi/VuNIsY6JdUw/hqdefault.jpg',
            focalPoint: '46% 22%',
            credit: 'Big Machine Records / official Taylor Swift YouTube channel',
            caption:
              'Still from the official "You Belong with Me" music video, directed by Roman White — the dance-scene arrival in a white dress.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'msg-sold-out-minute',
      year: 2009,
      month: 8,
      day: 27,
      category: 'tour',
      title: 'Madison Square Garden, sold out in about a minute',
      snippet:
        'Her Fearless Tour stop at the Garden on Aug. 27, 2009 — tickets had sold out in roughly 60 seconds when they went on sale that winter.',
      sourceUrl: 'https://www.countrystandardtime.com/news/newsitem.asp?xid=3395',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/db/Taylor_Swift_during_Fearless_Tour_concert_in_Portland.jpg',
      moment: {
        context:
          'The sellout was near-instant — tickets moved in early 2009, per Country Standard Time — and by the time the tour reached New York that August, the show read like a coronation, per Rolling Stone\'s review — a two-hour, three-act "elaborate spectacle" that opened with "You Belong with Me" in marching-band gear and ended with a waterfall drenching her onstage.\n\nIn between she carried a guitar into the stands for an acoustic set, and told the crowd after "Tim McGraw": "As long as I live, I will never forget what you just did for me." Her own pre-show summary, per Rolling Stone: "I\'m freaking out."',
        sources: [
          {
            outlet: 'Country Standard Time',
            url: 'https://www.countrystandardtime.com/news/newsitem.asp?xid=3395',
            source_title: 'Taylor Swift sells out fast',
            publisher: 'Country Standard Time',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-country/taylor-swift-performs-a-fearless-set-at-madison-square-garden-246419/',
            source_title: 'Taylor Swift Performs a "Fearless" Set at Madison Square Garden',
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Just Jared Jr. (photo gallery — the Aug. 27, 2009 MSG show)',
            url: 'https://www.justjaredjr.com/photo-gallery/269331/taylor-swift-msg-nyc-concert-13/',
          },
        ],
        // Image-fix pass (2026-07-10): the Just Jared Jr. hotlink carried two
        // baked-in watermarks; an interim Getty frame was used next.
        // Kevin Stream 1 (#751, 2026-07-23): that interim frame was a
        // Getty comp-image CDN watermarked comp (banned host). No freely
        // licensed photo of the Aug. 27, 2009 MSG show itself exists on
        // Commons, so replaced with a freely licensed Fearless Tour 2009
        // concert photo as an era illustration and the caption reworded to
        // match (no longer claims MSG specifically). Curl-verified 200 +
        // image/jpeg and vision-confirmed (Fearless Tour in-the-round stage,
        // 2009) this run.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/db/Taylor_Swift_during_Fearless_Tour_concert_in_Portland.jpg',
            // Photo pass #762 (2026-07-31): viewed (2345x1824, wide stage
            // shot). She's the small figure on the round stage, lower-center;
            // the big screen carries her face upper-left-of-center — keep the
            // crop mid-height to hold both in frame.
            focalPoint: '36% 48%',
            credit: 'calmdownlove / Wikimedia Commons, CC BY 2.0',
            caption:
              'Performing on the Fearless Tour, 2009 — the tour whose Madison Square Garden stop sold out in about a minute.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'bieber-wembley-broken-foot',
      year: 2009,
      month: 11,
      day: 23,
      category: 'tour',
      title: 'Her UK opening act breaks his foot mid-song',
      snippet:
        'Justin Bieber — the 15-year-old opening the Fearless Tour\'s UK leg — fractured his foot during "One Time" at Wembley Arena on Nov. 23, 2009, and finished the song anyway.',
      sourceUrl: 'https://www.justjaredjr.com/2009/11/23/justin-bieber-fractures-his-foot/',
      thumbnailUrl: null,
      moment: {
        context:
          'Bieber said he tripped over something coming down a ramp and "felt my ankle roll in a very bad way," but sang "One Time" through to the end before limping backstage to the medics — skipping the encore, getting a visit from Taylor herself, then heading to the hospital for X-rays and a cast.\n\nHe was back opening for Taylor in Manchester the next night, show-must-go-on style. The booking itself is the time capsule: two teenagers on one arena bill, months before both went supernova.',
        sources: [
          {
            outlet: 'Just Jared Jr.',
            url: 'https://www.justjaredjr.com/2009/11/23/justin-bieber-fractures-his-foot/',
            source_title: 'Justin Bieber Fractures His Foot',
            publisher: 'Just Jared Jr.',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'Long Island Press',
            url: 'http://archive.longislandpress.com/2009/11/25/justin-bieber-performs-with-broken-foot/',
            source_title: 'Justin Bieber Performs With Broken Foot',
            publisher: 'Long Island Press',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          // License provenance for the reference image below (Commons file page):
          {
            outlet: 'Wikimedia Commons (file page — 2009 Justin Bieber NYC 1)',
            url: 'https://commons.wikimedia.org/wiki/File:2009_Justin_Bieber_NYC_1.JPG',
          },
        ],
        // T16 photo pass (2026-07-09): no free or stable photo of the Wembley
        // night itself could be verified, so this is a clearly-labeled
        // reference image of Bieber from the same months, CC BY 2.0 per the
        // Commons file page cited above. Verified HTTP 200 + image/jpeg.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/2009_Justin_Bieber_NYC_1.JPG',
            // Photo pass #762 (2026-07-31): viewed. Straight-on portrait,
            // face centered horizontally, sits in the upper quarter of frame.
            focalPoint: '46% 20%',
            credit: 'Kerosene Photography / CC BY 2.0 via Wikimedia Commons',
            caption:
              'For reference — not from the Wembley show: 15-year-old Justin Bieber at a New York in-store appearance on Sept. 1, 2009, weeks before he opened the Fearless Tour\'s UK leg.',
            kind: 'reference',
          },
        ],
      },
    },
    {
      slug: 'cma-entertainer-2009',
      significance: 'notable', // a genuine industry age record, the country establishment's own top honor (docs/decisions.md, 2026-07-19)
      relatedIds: ['moment:vault-fearless-hosting-snl-and-writing-her-own-monologue'],
      year: 2009,
      month: 11,
      day: 11,
      category: 'business',
      title: 'CMA Entertainer of the Year at 19 — the youngest ever',
      snippet:
        'Nov. 11, 2009: the CMAs hand their top prize to a 19-year-old — the youngest Entertainer of the Year in the award\'s history, and the first woman to win it since Shania Twain in 1999.',
      sourceUrl: 'https://theboot.com/taylor-swift-wins-2009-cma-entertainer-of-the-year/',
      thumbnailUrl:
        'https://akns-images.eonline.com/eol_images/Entire_Site/2016926/rs_634x1024-161026143557-634.Taylor-Swift-CMA-2009-Nashville.kg.102616.jpg',
      moment: {
        context:
          'She won every category she was nominated in that night, with Fearless taking Album of the Year and "Love Story" winning Music Video of the Year — the country establishment\'s full endorsement, one year to the day after the album dropped.\n\nShe pulled her whole band onstage for the big one and didn\'t bother playing it cool: "I will never forget this moment because in this moment, everything I ever wanted has just happened to me." She also thanked the competition — every artist in the category, she noted, had once let her open for them.',
        sources: [
          {
            outlet: 'The Boot',
            url: 'https://theboot.com/taylor-swift-wins-2009-cma-entertainer-of-the-year/',
            source_title: 'Taylor Swift Wins 2009 CMA Entertainer of the Year',
            publisher: 'The Boot',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'BMI',
            url: 'https://www.bmi.com/news/entry/taylor_swift_wins_entertainer_of_the_year_and_more_at_2009_cma_awards',
            source_title: 'Taylor Swift Wins Entertainer of the Year and More at 2009 CMA Awards',
            publisher: 'BMI',
            source_type: 'official',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/2009_Country_Music_Association_Awards',
            source_title: '2009 Country Music Association Awards',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Just Jared Jr. (photo gallery — 2009 CMA Awards)',
            url: 'https://www.justjaredjr.com/photo-gallery/346791/taylor-swift-sweeps-cmas-00/',
          },
        ],
        // Image-fix pass (2026-07-10): the Just Jared Jr. hotlink carried
        // watermarks in both top corners; replaced with an unwatermarked
        // Getty photo of the same Entertainer of the Year acceptance moment.
        // Image-fix pass (issue #745, 2026-08-24): that Getty comp URL always
        // rendered with a visible Getty watermark on the live site. No
        // allowed-CDN equivalent of the exact acceptance-speech frame exists
        // (The Boot carries only a logo placeholder; Wikimedia has nothing
        // from the 2009 CMAs; Billboard's is the 2011 win) — replaced instead
        // with E! Online's own CDN copy of a red-carpet arrival shot in the
        // same gold gown from the same night (allowlisted host,
        // unwatermarked); caption reworded from "accepting" to "arriving" to
        // match what this frame actually shows. Verified live via probe() —
        // HTTP 206, image/jpeg, 634x1024.
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2016926/rs_634x1024-161026143557-634.Taylor-Swift-CMA-2009-Nashville.kg.102616.jpg',
            credit: 'Donna Svennevik/ABC via Getty Images, via E! Online',
            caption:
              'Arriving at the 43rd CMA Awards in the gold gown she wore to accept Entertainer of the Year, Nov. 11, 2009.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      slug: 'love-story-pop-crossover',
      year: 2009,
      month: 2,
      day: 28,
      category: 'business',
      title: 'First country song ever to top pop radio',
      snippet:
        'The week ending Feb. 28, 2009, "Love Story" hit No. 1 on Billboard\'s Pop Songs chart — the first country crossover ever to do it.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor_Swift_song)',
      thumbnailUrl:
        'https://i.ytimg.com/vi/8xg3vE8Ie_E/hqdefault.jpg',
      moment: {
        context:
          'Country songs had crossed to pop radio for decades without finishing the climb — Shania Twain\'s "You\'re Still the One" had set the previous high-water mark at No. 3 in 1998.\n\n"Love Story" went all the way the week ending Feb. 28, 2009, on top of a No. 4 Hot 100 peak and two weeks atop Hot Country Songs — the data point that made the eventual pop pivot look less like a risk than a formality.',
        sources: [
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor_Swift_song)',
            source_title: 'Love Story (Taylor Swift song)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
          {
            outlet: 'Wide Open Country',
            url: 'https://www.wideopencountry.com/love-story-taylor-swift/',
            source_title: "'Love Story': The Story Behind The Classic Taylor Swift Song",
            publisher: 'Wide Open Country',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        // Issue #743: the official music-video still replaces generic single
        // art on this non-release moment.
        // Photo-enrichment run 16 (2026-07-18, #762): added a clearly-labeled
        // CC BY 3.0 Commons reference photo of Shania Twain, whose "You're
        // Still the One" held the previous country-crossover high (No. 3,
        // 1998) named in the context above. License verified via the Commons
        // API, URL verified HTTP 200 + image/jpeg, downloaded and visually
        // confirmed. Per-image focal points set by eye.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/8xg3vE8Ie_E/hqdefault.jpg',
            credit: 'Big Machine Records / official Taylor Swift YouTube channel',
            caption: 'Still from the official "Love Story" music video.',
            kind: 'primary',
            focalPoint: '52% 45%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/ShaniaTwain1.jpg',
            credit: 'David Swales (CC BY 3.0), via Wikimedia Commons',
            caption: 'For reference — Shania Twain, whose "You\'re Still the One" set the previous country-crossover high-water mark at No. 3 in 1998.',
            kind: 'reference',
            focalPoint: '49% 22%',
          },
        ],
      },
    },
    {
      slug: 'csi-haley-jones',
      year: 2009,
      month: 3,
      day: 5,
      category: 'sighting',
      title: 'Her acting debut: a murder victim on CSI',
      snippet:
        'March 5, 2009: she guest-stars on CSI as Haley Jones, a motel owner\'s daughter whose death anchors the whole episode — a dream booking for a longtime fan of the show.',
      sourceUrl: 'https://www.eonline.com/news/700262/remember-when-taylor-swift-played-a-murder-victim-on-csi-reminisce-ahead-of-the-series-finale',
      thumbnailUrl:
        'https://akns-images.eonline.com/eol_images/Entire_Site/2015825/rs_600x600-150925152931-600.taylor-swift-csi.jpg',
      moment: {
        context:
          'In "Turn, Turn, Turn," CSI Nick Stokes pieces together a year of visits to a seedy motel run by her character\'s parents — Taylor, then 19, playing 16-year-old Haley Jones across the episode\'s time-jumping structure, in long brownish hair that made her briefly unrecognizable. Reviews were kinder than anyone expected — she "held her own," per Rolling Stone.\n\nThe episode aired March 5, 2009, right at the peak of Fearless\'s chart run, and the stunt casting aged into a tradition: E!\'s retrospective notes she followed John Mayer (a season-seven murder victim) and paved the way for Justin Bieber to get the same treatment later.',
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/700262/remember-when-taylor-swift-played-a-murder-victim-on-csi-reminisce-ahead-of-the-series-finale',
            source_title: 'Remember When Taylor Swift Played a Murder Victim on CSI?',
            publisher: 'E! Online',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/Turn,_Turn,_Turn_(CSI)',
            source_title: 'Turn, Turn, Turn (CSI)',
            publisher: 'Wikipedia',
            source_type: 'wiki',
            accessed_at: '2026-07-08',
            reliability_score: 2,
          },
        ],
        // T16 photo pass (2026-07-09, relaxed image policy): CBS episode still
        // as published by E! Online's retrospective of the episode. Verified
        // HTTP 200 + image/jpeg and visually confirmed (Swift as Haley Jones)
        // this session. No AI imagery.
        // Photo pass #762 (2026-07-19): stays at 1 photo — the cited E!
        // retrospective carries only this one CBS still (checked the page's
        // full image set), and the episode's Wikipedia article has no image.
        // No second verifiable frame of her as Haley Jones on an allowed CDN.
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2015825/rs_600x600-150925152931-600.taylor-swift-csi.jpg',
            credit: 'CBS, via E! Online',
            caption: 'As Haley Jones in the CSI episode "Turn, Turn, Turn," which aired March 5, 2009.',
            kind: 'archival',
            // Focal point set by viewing (photo pass #762, 2026-07-19):
            // profile close-up, face upper-right of the square frame.
            focalPoint: '55% 28%',
          },
        ],
      },
    },
    {
      slug: 'snl-host-monologue-song',
      significance: 'notable', // a genuine hosting-and-writing milestone at 19, four days before the CMA Entertainer of the Year win the same era carries (docs/decisions.md, 2026-07-19)
      relatedIds: ['moment:vault-fearless-cma-entertainer-of-the-year-at-19-the-youngest-ever'],
      year: 2009,
      month: 11,
      day: 7,
      category: 'sighting',
      title: 'Hosting SNL — and writing her own monologue',
      snippet:
        'Nov. 7, 2009: she hosts Saturday Night Live and shows up with the monologue already written — as a song, skewering her own headlines before anyone else could.',
      sourceUrl: 'https://www.rollingstone.com/tv-movies/tv-movie-news/taylor-swift-snl-monologue-seth-meyers-1234866409/',
      thumbnailUrl: 'https://i.ytimg.com/vi/W2twcSFYlt0/hqdefault.jpg',
      moment: {
        context:
          'Seth Meyers has told the story since: she arrived saying "I wrote a song for the opening monologue," and it needed essentially no fixing. The "Monologue Song" joked about the exes and the interruption heard round the world — self-aware damage control, years before that became a signature move.\n\nStrapping on a sparkly guitar, the 19-year-old first-time host sang her way through the gossip of the moment — the Taylor Lautner headlines included — in a piece Meyers later described to Howard Stern as "not only a beautiful song by a beautiful singer but... a perfect SNL" opener, one that arrived "fully formed." He called it "a fully giftwrapped present": the rare host who showed up with the night\'s hardest five minutes already written.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/tv-movies/tv-movie-news/taylor-swift-snl-monologue-seth-meyers-1234866409/',
            source_title: "Taylor Swift's 2009 SNL Monologue Shook Seth Meyers: 'Force of Nature'",
            publisher: 'Rolling Stone',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 4,
          },
          {
            outlet: 'American Songwriter',
            url: 'https://americansongwriter.com/remember-when-taylor-swift-wrote-her-own-opening-monologue-on-saturday-night-live/',
            source_title: "Remember When Taylor Swift Wrote Her Own 'SNL' Monologue?",
            publisher: 'American Songwriter',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        // T16 photo pass (2026-07-09): still is the thumbnail of the official
        // SNL upload of the monologue — video id W2twcSFYlt0 verified via
        // YouTube oEmbed this session (title "Taylor Swift Monologue Song -
        // SNL", channel @SaturdayNightLive). Verified HTTP 200 + image/jpeg
        // and visually confirmed (Swift with guitar on the SNL stage).
        photos: [
          {
            url: 'https://i.ytimg.com/vi/W2twcSFYlt0/hqdefault.jpg',
            // Photo pass #762 (2026-07-20): viewed. Letterboxed YouTube frame —
            // she stands center-left with the guitar, face in the upper third;
            // keep the crop centered and high, above the black bars.
            focalPoint: '46% 30%',
            credit: 'NBC / Saturday Night Live official YouTube channel',
            caption: 'Performing the self-written "Monologue Song" on the SNL stage, Nov. 7, 2009.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'lucas-till-spring-2009',
      year: 2009,
      month: 5,
      category: 'relationship',
      title: 'A brief real-life sequel to the You Belong with Me video',
      snippet:
        'She and video co-star Lucas Till dated briefly in spring 2009 — "no friction," he said later, "because we were too nice."',
      sourceUrl: 'https://www.etonline.com/gallery/162334_taylor_swift_boyfriends/lucas-till-66523',
      thumbnailUrl: 'https://i.ytimg.com/vi/VuNIsY6JdUw/hq1.jpg',
      moment: {
        context:
          'Till confirmed it himself in interviews: the two dated for a stretch after shooting the video, then settled back into friendship — one of the era\'s few relationship stories with no drama attached.\n\n"We just really both liked each other. I really just liked her as a friend. That\'s the only reason that didn\'t work out," he explained later, putting the romance at about a month or two. The shoot itself he remembers fondly — "I remember just feeling like a star when I came and did that music video. I felt so special," he said in 2020, calling Taylor generous and professional — and the video left him permanently attached to the era as the boy next door reading her notebook messages through the window.',
        sources: [
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/gallery/162334_taylor_swift_boyfriends/lucas-till-66523',
            source_title: "Lucas Till: Taylor Swift's Boyfriends: The 'Lover' Look Back",
            publisher: 'Entertainment Tonight',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
          {
            outlet: 'Looper',
            url: 'https://www.looper.com/1511791/taylor-swift-you-belong-with-me-music-video-actor-lucas-till-today/',
            source_title: "What The Actor From Taylor Swift's You Belong With Me Music Video Looks Like Today",
            publisher: 'Looper',
            source_type: 'reputable_press',
            accessed_at: '2026-07-08',
            reliability_score: 3,
          },
        ],
        // T16 photo pass (2026-07-09): still from the official "You Belong
        // with Me" upload — video id VuNIsY6JdUw previously verified via
        // YouTube oEmbed (channel @TaylorSwift); this hq1 frame verified HTTP
        // 200 + image/jpeg and visually confirmed (Till holding the "tired of
        // drama" notepad) this session.
        photos: [
          {
            url: 'https://i.ytimg.com/vi/VuNIsY6JdUw/hq1.jpg',
            // Till's face is center-left of the frame, just below the midline.
            focalPoint: '48% 40%',
            credit: 'Big Machine Records / official Taylor Swift YouTube channel',
            caption:
              'Lucas Till in the official "You Belong with Me" video — the "tired of drama" notepad scene — on the shoot where the two met.',
            kind: 'archival',
          },
        ],
      },
    },

    // ── Migrated from content.ts RAW (consolidation stage 2a, 2026-07-19) ──
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "fearless-album",
      year: 2008,
      month: 11,
      day: 11,
      category: "music",
      title: "Fearless changes everything",
      // Era-timeline milestone (stage 2b, 2026-07-19): derived MILESTONES
      // now come from these markers — legacy id kept for stability.
      milestone: { id: "m-fear-1", label: "Fearless released", kind: "album" },
      snippet: "The fairy-tale record that turns a promising country act into a global phenomenon.",
      moment: {
        sources: [
          {
            outlet: 'The Recording Academy',
            url: 'https://www.grammy.com/news/deep-10-taylor-swifts-fearless/',
            source_title: 'Deep 10: Taylor Swift\'s Fearless',
            publisher: 'The Recording Academy',
            source_type: 'official',
            accessed_at: '2026-08-11',
            reliability_score: 5,
          },
          {
            outlet: 'Big Machine Records (via PR Newswire)',
            url: 'https://www.prnewswire.com/news-releases/taylor-swifts-fearless-album-officially-lauded-as-most-awarded-album-in-country-music-history-88431737.html',
            source_title: 'Taylor Swift\'s FEARLESS Album Officially Lauded as Most Awarded Album in Country Music History',
            publisher: 'Big Machine Records',
            source_type: 'official',
            accessed_at: '2026-08-11',
            reliability_score: 5,
            notes: 'Label press release — primary for the award tally it lists, not an independent assessment.',
          },
        ],
        context: "Fearless is the sound of teenage romance written in gold ink — princess dresses, white horses, and choruses built for arenas.\n\nIt would become the most-awarded country album in history and make her the youngest Album of the Year winner at the time.",
        // Photo pass #762 (2026-07-19): freely licensed Commons live shot from
        // the album's own tour — license (CC BY-SA 2.0, alexahalasan) verified
        // on the file page via the Commons API; curl 200 image/jpeg 1769x2470;
        // Read-viewed: Swift seated with the koi-fish Taylor guitar, Fearless
        // Tour, Prudential Center, Newark (May 13, 2010).
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Taylor_Swift_-_Fearless_Tour_Prudential_Center_Newark_%28May_13%2C_2010%29.jpg',
            credit: 'alexahalasan via Wikimedia Commons, CC BY-SA 2.0',
            caption: 'On the Fearless Tour with the koi-fish Taylor guitar — the album that filled arenas, Newark, 2010.',
            focalPoint: '48% 18%',
          },
          // Photo Enrichment lane (Vault Run 2026-08-15): a second, distinct
          // live shot — the Fearless act of the Eras Tour, the same album's
          // songs still opening stadiums. Commons file (Paolo Villanueva, CC
          // BY 2.0); curl 200 image/jpeg, 500px thumb downloaded and
          // vision-confirmed (gold fringe dress, mic, arena).
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Taylor_Swift_The_Eras_Tour_Fearless_Set_Era_%2853109821975%29.jpg/500px-Taylor_Swift_The_Eras_Tour_Fearless_Set_Era_%2853109821975%29.jpg',
            focalPoint: '46% 25%',
            credit: 'Paolo Villanueva via Wikimedia Commons, CC BY 2.0',
            caption: 'The Fearless act on the Eras Tour, 2023 — the gold fringe dress and the album\'s songs, still filling stadiums fifteen years on.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      // Added 2026-08-24 (issue #719, item 2): the release itself as a news
      // event — the debut number lived only 4 months downstream (the
      // 2009-03-14 "11 weeks" item) with no dated release-day beat of its own.
      significance: 'notable', // the debut that seeds the record-run item four months later (docs/decisions.md, 2026-07-19)
      // Explicit slug: this moment legitimately carries the official album
      // cover (Big Machine Records credit), same as the other release-artwork
      // moments below — needed so content.test.ts's release-artwork allowlist
      // can recognize it instead of flagging it as a stray Wikipedia image.
      slug: 'fearless-billboard-no-1-debut',
      year: 2008,
      month: 11,
      day: 11,
      category: 'business',
      // Cross-link (issue #719, item 3): the album's 2021 re-record — the
      // era page is titled "Fearless (Taylor's Version)" but the TV content
      // lives, correctly, in evermore.mjs's chronological window; this is
      // the missing forward link from a fearless surface.
      relatedIds: ['moment:vault-evermore-fearless-taylors-version-26-songs-six-from-the-vault'],
      title: 'Fearless arrives and debuts at No. 1 on the Billboard 200',
      snippet:
        "Her second album opens at No. 1 with 592,000 first-week copies — the first of eleven non-consecutive weeks she'd spend at the top.",
      sourceUrl: 'https://www.billboard.com/music/music-news/taylor-swifts-fearless-flies-at-no-1-with-592000-1301317/',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/8/86/Taylor_Swift_-_Fearless.png',
      moment: {
        context:
          "Released Nov. 11, 2008 on Big Machine Records, Fearless opened at No. 1 on the Billboard 200 with 592,000 first-week copies — the first of what became eleven non-consecutive weeks at the top, a decade-long chart record covered separately in this era's later coverage. NPR's Ken Tucker, reviewing the album that same release window, confirmed its debut atop Billboard's country albums chart too — an early signal the record would cross over well past a country audience.\n\nThe album went on to become the most-awarded country album in history and, thirteen years later, the first LP Taylor would re-record top to bottom as Fearless (Taylor's Version) — the release that proved the whole re-recording project could work commercially.",
        sources: [
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swifts-fearless-flies-at-no-1-with-592000-1301317/',
            source_title: "Taylor Swift's Fearless Flies At No. 1 With 592,000",
            publisher: 'Billboard',
            source_type: 'chart_database',
            accessed_at: '2026-08-24',
            reliability_score: 5,
          },
          {
            outlet: 'NPR',
            url: 'https://www.npr.org/2008/12/04/97800838/taylor-swifts-fearless-follow-up-album',
            source_title: "Taylor Swift's 'Fearless' Follow-Up Album",
            publisher: 'NPR',
            source_type: 'reputable_press',
            accessed_at: '2026-08-24',
            reliability_score: 4,
          },
        ],
        // Photo pass #762 (2026-08-25): searched for a second image — the
        // cited Billboard piece is paywalled (tollbit gateway, HTTP 402) so
        // its hero art couldn't be verified; the NPR source's lead image is
        // an unrelated Fresh Air show tile, not Taylor; no CC-licensed
        // Commons photo dated to the Nov. 11, 2008 release week or the
        // Nov. 12 CMA Awards was found. Left reviewed-sparse at one photo
        // (the album cover) rather than pad with an unverifiable frame.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/86/Taylor_Swift_-_Fearless.png',
            credit: 'Big Machine Records',
            focalPoint: '40% 32%',
          },
        ],
      },
    },
    {
      // Migrated 2026-07-19 from apps/web/lib/longlive/content.ts (RAW —
      // consolidation stage 2a): text unchanged; legacy id kept as slug.
      slug: "fearless-vmas",
      year: 2009,
      month: 9,
      day: 13,
      category: "sighting",
      title: "The interrupted speech",
      snippet: "A VMAs moment becomes pop-culture lore and a defining public turning point.",
      hiddenClue: { clue: "She later wrote a song thanking the moment for making her stronger.", payoff: "“Innocent” and, years later, the framing of the reputation era both trace back here." },
      moment: {
        sources: [
          {
            outlet: 'TIME',
            url: 'https://content.time.com/time/specials/packages/article/0,28804,1922188_1922187_1922190,00.html',
            source_title: 'Taylor Swift Got Kanyed — Top 10 Outrageous Kanye West Moments',
            publisher: 'TIME',
            source_type: 'reputable_press',
            accessed_at: '2026-08-11',
            reliability_score: 4,
          },
          {
            outlet: 'VICE',
            url: 'https://www.vice.com/en/article/on-this-day-in-2009-kanye-west-grabbed-the-mic-from-taylor-swift-at-the-mtv-vmas/',
            source_title: 'On This Day in 2009, Kanye West Grabbed the Mic From Taylor Swift at the MTV VMAs',
            publisher: 'VICE',
            source_type: 'reputable_press',
            accessed_at: '2026-08-11',
            reliability_score: 3,
          },
        ],
        context: "Mid-acceptance, the microphone was taken. The moment turned a rising star into a household name overnight and seeded a narrative she would revisit for years.",
      },
    },
  ],
};
