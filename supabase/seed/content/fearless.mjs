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
      year: 2008,
      month: 9,
      day: 15,
      category: 'music',
      title: "Love Story, and the boy her family didn't approve of",
      snippet:
        "Inspired by a boy she never actually dated — one her family and friends \"all said they didn't like.\"",
      sourceUrl: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor_Swift_song)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/0/01/Taylor_Swift_-_Love_Story.png',
      moment: {
        context:
          "She's said the disapproval reminded her of Romeo and Juliet — \"the only people who wanted them to be together were them\" — so she gave her version the happy ending Shakespeare didn't, swapping the double suicide for a marriage proposal she felt the characters deserved.\n\nThe whole thing came fast: she wrote it on her bedroom floor in about 20 minutes, then cut a rough demo in roughly 15 minutes the next day. The boy stayed anonymous — she's only ever said he was someone she never actually dated, and that when she brought him around, \"[they] all said they didn't like him. All of them!\"",
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor_Swift_song)' },
          { outlet: 'Wide Open Country', url: 'https://www.wideopencountry.com/love-story-taylor-swift/' },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/0/01/Taylor_Swift_-_Love_Story.png',
            credit: 'Big Machine Records',
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
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Taylor_Swift_-_Fifteen.png',
      moment: {
        context:
          'The whole song grew backwards from one line — "Abigail gave everything she had to a boy who changed his mind" — which Swift has said she wrote first, building everything else around it. Unsure how Abigail would take something so personal, Taylor played her the finished song and asked first. Abigail\'s answer: "If one girl can kind of learn from it or connect to a song like that, it\'s totally worth it."\n\nRecording it wrecked Swift anyway — she\'s admitted she cried in the studio, "the things that make me cry are when the people I love have gone through pain and I\'ve seen it" — and when Roman White shot the surreal green-screen garden video, Abigail appeared in it as herself.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Fifteen_(song)' },
          { outlet: 'Songfacts', url: 'https://www.songfacts.com/facts/taylor-swift/fifteen' },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Taylor_Swift_-_Fifteen.png',
            credit: 'Big Machine Records',
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
      snippet: 'At the 52nd Grammys, 20-year-old Swift became the youngest Album of the Year winner ever — a record that stood for a decade, until Billie Eilish broke it.',
      sourceUrl: 'https://americansongwriter.com/on-this-day-in-2010-this-country-star-turned-pop-phenomenon-became-the-youngest-album-of-the-year-winner-in-grammys-history/',
      thumbnailUrl: 'https://media.vanityfair.com/photos/6973c403bc755155c2f9ebcc/master/w_1024%2Cc_limit/taylor-swift-grammys-red-carpet-2010.jpg',
      relatedIds: ['moment:vault-1989-1989-wins-album-of-the-year-making-her-the-first-woman-to-wi'],
      moment: {
        context:
          'At the Grammys — Jan. 31, 2010, at Staples Center — 20-year-old Swift became the youngest Album of the Year winner ever, a record that stood until Billie Eilish broke it a decade later.\n\nShe won four of the eight categories she was nominated in that night, and her speech guessed exactly how long the moment would last: "When we\'re 80 years old and we are telling the same stories over and over again to our grandkids... this is the story we\'re gonna be telling over and over again — in 2010, that we got to win Album of the Year."',
        sources: [
          {
            outlet: 'American Songwriter',
            url: 'https://americansongwriter.com/on-this-day-in-2010-this-country-star-turned-pop-phenomenon-became-the-youngest-album-of-the-year-winner-in-grammys-history/',
          },
          {
            outlet: 'Guinness World Records',
            url: 'https://www.guinnessworldrecords.com/world-records/607151-youngest-solo-artist-to-win-album-of-the-year-at-the-grammy-awards',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/86/Taylor_Swift_-_Fearless.png',
            credit: 'Big Machine Records',
            // Focal point set 2026-07-18 by viewing (300x300): profile facing
            // left-of-center, wind-blown curls filling the right half.
            focalPoint: '40% 32%',
          },
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
            credit: 'Dan MacMedan/WireImage, via Vanity Fair',
            caption: 'Swift arrives at the 52nd Grammy Awards in a blue sequined KaufmanFranco gown.',
            kind: 'primary',
          },
          {
            url: 'https://i.guim.co.uk/img/static/sys-images/Guardian/Pix/pictures/2010/2/1/1264988049224/Singer-Swift-speaks-onsta-001.jpg?crop=none&dpr=1&s=none&width=465',
            credit: 'Danny Moloshok/Reuters, via The Guardian',
            caption: 'Swift speaks onstage after winning Best Female Country Vocal Performance for "White Horse," one of her four Grammys that night.',
            kind: 'primary',
          },
          {
            url: 'https://i.guim.co.uk/img/static/sys-images/Guardian/Pix/pictures/2010/2/1/1265015933818/Taylor-Swift-drops-one-of-003.jpg?crop=none&dpr=1&s=none&width=375',
            credit: 'Valerie Macon/AFP/Getty Images, via The Guardian',
            caption: 'Swift loses her grip on one of the four trophies she carried in the Grammy press room.',
            kind: 'primary',
          },
          {
            url: 'https://static.time.com/v3/assets/bltea6093859af6183b/blte142e31b64ce6139/69877c56524fc062c0dec2d5/ap100131042457.jpg?branch=production&width=3840&quality=75&auto=webp&crop=3%3A2',
            credit: 'Matt Sayles/AP, via TIME',
            caption: 'Swift and Stevie Nicks perform together during the 52nd Grammy Awards telecast.',
            kind: 'primary',
          },
          {
            url: 'https://static.time.com/v3/assets/bltea6093859af6183b/bltca5404e6952dca29/698762d6e20a87c7bda82aeb/taylor-swift-12.jpg?branch=production&width=3840&quality=75&auto=webp',
            credit: 'Michael Caulfield/WireImage/Getty Images, via TIME',
            caption: 'Swift performs onstage during the 52nd Grammy Awards at Staples Center.',
            kind: 'primary',
          },
          {
            url: 'https://assets.teenvogue.com/photos/56be4d24e9ea465e7cf59f44/16%3A9/w_2560%2Cc_limit/GettyImages-98115429.jpg',
            credit: 'Michael Tran/FilmMagic, via Teen Vogue',
            caption: 'Swift poses in the Grammy press room with all four awards she won that night, including Album of the Year.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2008,
      month: 11,
      day: 12,
      category: 'fashion',
      title: 'A silver Kaufman Franco gown for the 2008 CMAs',
      snippet: 'A body-hugging silver Kaufman Franco gown, hair pinned into a sleek bun, at the 42nd CMA Awards.',
      sourceUrl: 'https://www.eonline.com/news/804943/taylor-swift-s-evolving-cma-awards-style-over-the-years',
      thumbnailUrl: 'https://cdn.mos.cms.futurecdn.net/E8AuEcoVjwZx6nd2RDfhQa.jpeg',
      moment: {
        context:
          'Worn Nov. 12, 2008 at Nashville\'s Sommet Center — the night after Fearless hit shelves — where she also performed "Love Story" on the show.\n\nE!\'s retrospective marks it as the turning point in her CMA style: a body-hugging silver Kaufman Franco and a sleek bun that read noticeably more polished and grown-up than the curls and sundresses of her debut-era carpets, arriving right as the album that would define the next two years did.',
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/804943/taylor-swift-s-evolving-cma-awards-style-over-the-years',
          },
          {
            outlet: 'Marie Claire',
            url: 'https://www.marieclaire.com/fashion/taylor-swift-gowns/',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/2008_Country_Music_Association_Awards',
          },
        ],
        photos: [
          {
            url: 'https://cdn.mos.cms.futurecdn.net/E8AuEcoVjwZx6nd2RDfhQa.jpeg',
            credit: 'Marie Claire',
          },
        ],
      },
    },
    {
      year: 2009,
      month: 4,
      day: 23,
      category: 'tour',
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
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Taylor_Swift_-_Fearless_Tour_-_Austin_07.jpg/500px-Taylor_Swift_-_Fearless_Tour_-_Austin_07.jpg',
            credit: 'Wikimedia Commons',
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
          'Swift wrote it in summer 2008 on tour and recorded it with producer Nathan Chapman without her mother knowing, then unveiled it on Christmas Eve alongside a home video she\'d edited herself from family footage.\n\nHer mother, Andrea, on hearing it: "that\'s when I lost it... I\'ve lost it pretty much every time I\'ve heard that song since." That never stopped being true — the song had to come out of the Fearless Tour setlist because, as Andrea put it, "I kept breaking down" backstage every time it played.',
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
            caption: 'The gift itself: a frame from the home-movie video Swift edited in secret — toddler Taylor in pigtails — unveiled to her mom on Christmas Eve.',
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
      relatedIds: ['moment:vault-1989-snakes-snapchat-and-excluded-from-this-narrative'],
      moment: {
        context:
          'The Radio City crowd went from stunned silence to a standing ovation for Swift; West was escorted out of the venue and apologized on his blog that night — "i\'m in the wrong for going on stage and taking away from her moment!" When presenter Wale suggested you "can\'t fault a man for speaking his mind," the audience booed him too.\n\nBeyoncé, who went on to win Video of the Year, used her own acceptance to invite Swift back onstage to finish the speech she\'d been denied — a gesture remembered as vividly as the interruption itself.',
        sources: [
          {
            outlet: 'Rolling Stone',
            url: 'https://www.rollingstone.com/music/music-country/kanye-west-storms-the-vmas-stage-during-taylor-swifts-speech-83468/',
          },
          {
            outlet: 'Taste of Country',
            url: 'https://tasteofcountry.com/taylor-swift-kanye-west-interruption-2009-vmas/',
          },
        ],
        photos: [
          {
            url: 'https://townsquare.media/site/204/files/2023/09/attachment-taylor-swift-kanye-west-2009-mtv-vmas.jpg?w=980&q=75',
            credit: 'Taste of Country',
          },
          // Photo pass 2026-07-19 (10-defining-events, docs/decisions.md):
          // every real, verified photo found from the Sept. 13, 2009 VMAs —
          // the interruption, the Beyoncé invite-back, and her own
          // performance/red-carpet that night. Curl-verified live.
          {
            url: 'https://i.guim.co.uk/img/static/sys-images/Guardian/Pix/pictures/2009/9/14/1252922286265/Kayne-West-jumps-onstage--007.jpg?crop=none&dpr=1&s=none&width=375',
            credit: 'Jeff Kravitz/FilmMagic, via The Guardian',
            caption: 'Kanye West steps onto the VMA stage while Swift is accepting Best Female Video at Radio City Music Hall.',
            kind: 'primary',
          },
          {
            url: 'https://i.guim.co.uk/img/static/sys-images/Guardian/Pix/pictures/2009/9/14/1252922290422/Singer-Taylor-Swift-speak-012.jpg?crop=none&dpr=1&s=none&width=375',
            credit: 'Kevin Mazur/WireImage, via The Guardian',
            caption: 'Swift finally finishes her acceptance speech after Beyoncé invites her back onstage later that night.',
            kind: 'primary',
          },
          {
            url: 'https://static.time.com/v3/assets/bltea6093859af6183b/bltc121921405a5eef5/698762d75f570fee2bb12f23/taylor-swift-16.jpg?branch=production&width=3840&quality=75&auto=webp',
            credit: 'Stephen Lovekin/FilmMagic/Getty Images, via TIME',
            caption: 'Swift arrives on the 2009 VMA red carpet in the silver KaufmanFranco gown she would still be wearing when West interrupted her.',
            kind: 'primary',
          },
          {
            url: 'https://media.glamour.com/photos/5b748cfd0271d30d24ff90ad/master/w_1024%2Cc_limit/GettyImages-90715371.jpg',
            credit: 'Jason Kempin/Getty Images, via Glamour',
            caption: 'Swift performs "You Belong with Me" inside a New York subway car during the 2009 VMA broadcast.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/T-Swift_VMA_performance.JPG',
            credit: 'Coldbread, via Wikimedia Commons',
            caption: 'Swift steps down from the yellow taxi after completing her outdoor VMA performance on Sept. 13, 2009.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Taylor_Swift_2009_MTV_VMA.jpg',
            credit: 'Philip Nelson, via Wikimedia Commons',
            caption: 'Swift appears during the 2009 MTV Video Music Awards at Radio City Music Hall.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Taylor_Swift_at_2009_MTV_Video_Music_Awards_%283917030572%29.jpg',
            credit: 'Philip Nelson, via Wikimedia Commons',
            caption: 'A distinct audience-level view of Swift at the 2009 MTV Video Music Awards.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Taylor_Swift_at_2009_MTV_VMA%27s_2.jpg',
            credit: 'Philip Nelson, via Wikimedia Commons',
            caption: 'Swift performs during the 2009 MTV Video Music Awards in New York.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Taylor_Swift_at_2009_MTV_VMA%27s_3.jpg',
            credit: 'Philip Nelson, via Wikimedia Commons',
            caption: 'Standing atop a car on a closed-off Avenue of the Americas, mic raised, as a street crowd reaches up during the outdoor VMA broadcast performance.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Taylor_Swift_at_2009_MTV_VMA%27s_4.jpg',
            credit: 'Philip Nelson, via Wikimedia Commons',
            caption: 'Swift performs "You Belong with Me" during the 2009 VMA telecast.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Taylor_Swift_at_2009_MTV_VMA%27s_5.jpg',
            credit: 'Philip Nelson, via Wikimedia Commons',
            caption: 'A wide, horizontal view of Swift\'s performance during the 2009 MTV Video Music Awards.',
            kind: 'primary',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Taylor_Swift_at_2009_MTV_VMA%27s.jpg',
            credit: 'Philip Nelson, via Wikimedia Commons',
            caption: 'Swift onstage during her "You Belong with Me" performance at the 2009 VMAs.',
            kind: 'primary',
          },
        ],
      },
    },
    {
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
          'The show opened with "You Belong with Me," Swift in a drum majorette uniform that dancers stripped away mid-number to reveal the sparkling silver cocktail dress underneath.\n\nIt set the tone for a production she had a design hand in herself — a fairytale castle lit by more than a million lumens, LED projection walls, and a night of quick changes that ran through a crimson gown and a white wedding dress for "Love Story."',
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
            caption: 'For reference — Swift performing on the Fearless Tour stage in Los Angeles; not the specific band-uniform reveal described here.',
            kind: 'reference',
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
      thumbnailUrl: 'https://media.gettyimages.com/id/90711948/photo/2009-mtv-video-music-awards-arrivals.jpg?s=594x594&w=0&k=20&c=fOcdRBdNZWp3iccajOnxlMcQfah9P6PsfGr3EsD_URk=',
      moment: {
        context:
          'The Hollywood Reporter\'s VMA style retrospective logs it as a one-shoulder, skin-toned KaufmanFranco gown covered in silver beads and sequins, finished with a bold red lip — and she\'d arrived at the show in a Cinderella-style coach, leaning all the way into the fairytale staging.\n\nBy the time Beyoncé called her back out at the end of the night to finish her speech, she\'d already changed into the red strapless vintage dress from her performance — so the gown of the era\'s most infamous televised moment was only on screen for those few minutes.',
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
        // Image-fix pass (2026-07-10): the Hollywood Reporter frame was a
        // two-panel collage (this gown plus a different red dress); replaced
        // with a single un-collaged Getty red-carpet arrivals frame of the
        // silver sequined gown. Verified HTTP 200 + image/jpeg and visually
        // confirmed (one-shoulder silver/nude sequined gown, VMA '09 backdrop)
        // this session.
        photos: [
          {
            url: 'https://media.gettyimages.com/id/90711948/photo/2009-mtv-video-music-awards-arrivals.jpg?s=594x594&w=0&k=20&c=fOcdRBdNZWp3iccajOnxlMcQfah9P6PsfGr3EsD_URk=',
            credit: 'Michael Loccisano/Getty Images',
            caption: 'The silver sequined KaufmanFranco gown on the VMA red carpet, Sept. 13, 2009.',
            kind: 'primary',
          },
        ],
      },
    },

    // --- Fashion/photo depth pass (2026-07-04)
    {
      year: 2009,
      month: 2,
      day: 18,
      category: 'fashion',
      title: 'A sparkly Kaufmanfranco mini and a curled updo at the 2009 BRIT Awards',
      snippet: 'A sequined Kaufmanfranco mini dress, Christian Louboutin heels, and a curled updo on the London red carpet.',
      sourceUrl: 'https://www.taylorswiftstyle.com/post-grid/brit-021809',
      thumbnailUrl:
        'https://images.squarespace-cdn.com/content/v1/6616cae0172b170a8dd0818d/1ad829fe-c8e1-4226-87a4-ce32e97a570b/BRIT+Awards+February+2009+Taylor+Swift+Style+Feature+Image.png',
      moment: {
        context:
          'Worn Feb. 18, 2009 in London, the look paired a Kaufmanfranco sparkly mini with Christian Louboutin Prive platform pumps, a Judith Leiber sparkly clutch and David Yurman jewelry — an early sign of the sleeker, sparklier red-carpet era Fearless ushered in.\n\nFashion archivist Sarah Chapelle\'s Taylor Swift Style catalogs it as a textbook example of the era\'s formula — in her words, "a sparkly mini, curled updo and Christian Louboutin heels created the Taylor trifecta at the 2009 BRITs." The same three-part recipe would repeat across the Fearless awards run, right up to the silver KaufmanFranco she wore to the VMAs that September.',
        sources: [
          { outlet: 'Taylor Swift Style', url: 'https://www.taylorswiftstyle.com/post-grid/brit-021809' },
          { outlet: 'Taylor Swift Style', url: 'https://www.taylorswiftstyle.com/fearless' },
        ],
        photos: [
          {
            url: 'https://images.squarespace-cdn.com/content/v1/6616cae0172b170a8dd0818d/1ad829fe-c8e1-4226-87a4-ce32e97a570b/BRIT+Awards+February+2009+Taylor+Swift+Style+Feature+Image.png',
            credit: 'Taylor Swift Style',
          },
        ],
      },
    },
    {
      year: 2009,
      month: 11,
      day: 11,
      category: 'fashion',
      title: 'A gold Reem Acra gown for a four-award sweep at the 2009 CMAs',
      snippet: 'A floor-skimming gold Reem Acra gown and an old-Hollywood pinned-back style, the night she swept all four of her CMA nominations.',
      sourceUrl: 'https://www.eonline.com/news/804943/taylor-swift-s-evolving-cma-awards-style-over-the-years',
      thumbnailUrl: 'https://media.gettyimages.com/id/93005940/photo/the-43rd-annual-cma-awards-arrivals.jpg?s=594x594&w=0&k=20&c=vSzO7akNN5nM5rgvS8oYRyyvApcm0uCienxGRp9sFYI=',
      moment: {
        context:
          'At the Nov. 11, 2009 CMA Awards in Nashville, Swift paired the gold gown with hair pinned back in an old-Hollywood style — a more grown-up counterpoint to the sleek silver look she\'d worn the year before. E!\'s CMA style retrospective remembers her looking "like a total award-winning star," in "a gold Reem Acra gown that skimmed the floor."\n\nThe styling matched the scoreboard: she swept all four categories she was nominated in that night — Entertainer of the Year, Female Vocalist of the Year, Album of the Year for Fearless, and Music Video of the Year for "Love Story" — becoming the youngest Entertainer of the Year winner in CMA history.',
        sources: [
          {
            outlet: 'E! Online',
            url: 'https://www.eonline.com/news/804943/taylor-swift-s-evolving-cma-awards-style-over-the-years',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/2009_Country_Music_Association_Awards',
          },
          {
            outlet: 'Just Jared Jr. (photo gallery — 2009 CMA Awards)',
            url: 'https://www.justjaredjr.com/photo-gallery/346791/taylor-swift-sweeps-cmas-00/',
          },
        ],
        // Image-fix pass (2026-07-10): the Just Jared Jr. hotlink carried a
        // baked-in watermark; replaced with an unwatermarked Getty red-carpet
        // frame from the same Nov. 11, 2009 CMA Awards. Verified HTTP 200 +
        // image/jpeg and visually confirmed (gold sequined gown, CMA Awards
        // step-and-repeat) this session.
        photos: [
          {
            url: 'https://media.gettyimages.com/id/93005940/photo/the-43rd-annual-cma-awards-arrivals.jpg?s=594x594&w=0&k=20&c=vSzO7akNN5nM5rgvS8oYRyyvApcm0uCienxGRp9sFYI=',
            credit: 'Taylor Hill/WireImage, via Getty Images',
            caption:
              'The gold Reem Acra gown on the red carpet at the Nov. 11, 2009 CMA Awards.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 1,
      day: 31,
      category: 'fashion',
      title: 'A blue sequined KaufmanFranco gown for a four-Grammy night',
      snippet: 'A navy, off-the-shoulder KaufmanFranco sequin gown, Louboutin pumps, and Lorraine Schwartz earrings — worn the night Fearless won Album of the Year.',
      sourceUrl: 'https://www.femestella.com/taylor-swift-iconic-grammys-red-carpet-dress-look-outfit/',
      thumbnailUrl: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2023/02/Depositphotos_15014271_XL.jpg?resize=800%2C1204&ssl=1',
      moment: {
        context:
          'At the Jan. 31, 2010 Grammys at Staples Center in Los Angeles, the KaufmanFranco Blue Sequin Off-the-Shoulder Gown — worn with Christian Louboutin pumps and Lorraine Schwartz earrings — was the glam counterpoint to the biggest night of her career to that point.\n\nBy the end of it she had four trophies, including Album of the Year for Fearless, making the 20-year-old the youngest artist ever to win the top prize at the time. Femestella\'s retrospective files the navy gown among her most iconic Grammy looks — a full pivot into old-Hollywood sparkle from the sundresses of two years earlier.',
        sources: [
          {
            outlet: 'Femestella',
            url: 'https://www.femestella.com/taylor-swift-iconic-grammys-red-carpet-dress-look-outfit/',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/52nd_Annual_Grammy_Awards',
          },
        ],
        photos: [
          {
            url: 'https://i0.wp.com/www.femestella.com/wp-content/uploads/2023/02/Depositphotos_15014271_XL.jpg?resize=800%2C1204&ssl=1',
            credit: 'Depositphotos',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 1,
      day: 31,
      category: 'fashion',
      title: "Curls swept to the side to make room for four Grammys",
      snippet: "Her long, shoulder-length curls — the signature look of the Fearless era — swept to one side at the 2010 Grammys.",
      sourceUrl: 'https://www.etonline.com/gallery/152871_taylor_swift_hair_timeline/68589',
      thumbnailUrl: 'https://www.etonline.com/sites/default/files/styles/640xh/public/slides/152871/set_taylor_swift_96311259.jpg?width=1024&quality=80',
      moment: {
        context:
          'Entertainment Tonight\'s hair-timeline retrospective singles out this look: curls swept to the side "to make room for all of her awards" the night Fearless won Album of the Year and Best Country Album.\n\nThe side-swept style did a lot of on-camera work that evening — she performed a medley with Fleetwood Mac\'s Stevie Nicks and made four trips to the podium at Staples Center. It was a signature outing for the ringlet curls she\'d worn since her debut, still reading as the era\'s calling card from every camera angle.',
        sources: [
          {
            outlet: 'Entertainment Tonight',
            url: 'https://www.etonline.com/gallery/152871_taylor_swift_hair_timeline/68589',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/52nd_Annual_Grammy_Awards',
          },
        ],
        photos: [
          {
            url: 'https://www.etonline.com/sites/default/files/styles/640xh/public/slides/152871/set_taylor_swift_96311259.jpg?width=1024&quality=80',
            credit: 'Entertainment Tonight',
          },
        ],
      },
    },

    // --- Fashion/photo depth pass 2 (2026-07-04)
    {
      year: 2008,
      month: 11,
      day: 10,
      category: 'fashion',
      title: 'A French Connection Tallulah skirt for a Letterman appearance',
      snippet: "A French Connection 'Tallulah' skirt, Christian Louboutin 'Babel' leather boots, and Nordstrom floral tights for The Late Show with David Letterman.",
      sourceUrl: 'https://www.taylorswiftstyle.com/post-grid/letterman-111008',
      thumbnailUrl:
        'https://images.squarespace-cdn.com/content/v1/6616cae0172b170a8dd0818d/7d638f75-6b9b-4ff6-b9d2-06e0871c2dba/David+Letterman+November+2008+Taylor+Swift+Style+Feature+Image.png',
      moment: {
        context:
          'Worn Nov. 10, 2008 in New York for a Letterman taping, days before Fearless hit shelves — a low-key, mixed-designer look (French Connection "Tallulah" skirt, Christian Louboutin "Babel" leather boots, Nordstrom floral tights and a black turtleneck) typical of her pre-tour press-run style.\n\nTaylor Swift Style\'s archive ranks the ensemble among the writer\'s all-time favorite Swift outfits, while noting how completely her styling logic changed in the years since: today\'s Swift, the blog reckons, would swap the heeled boots for pumps, crop the turtleneck, and drop the stacks of bracelets that were practically a uniform in 2008.',
        sources: [
          { outlet: 'Taylor Swift Style', url: 'https://www.taylorswiftstyle.com/post-grid/letterman-111008' },
        ],
        photos: [
          {
            url: 'https://images.squarespace-cdn.com/content/v1/6616cae0172b170a8dd0818d/7d638f75-6b9b-4ff6-b9d2-06e0871c2dba/David+Letterman+November+2008+Taylor+Swift+Style+Feature+Image.png',
            credit: 'Taylor Swift Style',
          },
        ],
      },
    },
    {
      year: 2009,
      month: 3,
      day: 1,
      category: 'fashion',
      title: 'A white BCBG Max Azria cocktail dress for a Daily Telegraph shoot',
      snippet: 'A white BCBG Max Azria Corozo cocktail dress paired with stacked bracelets for a March 2009 Daily Telegraph feature.',
      sourceUrl: 'https://www.taylorswiftstyle.com/post-grid/dailytelegraph-030109',
      thumbnailUrl:
        'https://images.squarespace-cdn.com/content/v1/6616cae0172b170a8dd0818d/eca000d7-4a7b-4b27-b5b3-4d4fef296c74/The+Daily+Telegraph+March+2009+Taylor+Swift+Style+Feature+Image.png',
      moment: {
        context:
          'Shot for The Daily Telegraph in March 2009, the BCBG Max Azria Corozo cocktail dress was styled with stacked bracelets — a recurring accessory choice fashion writers flag as signature to her Fearless-era press look.\n\n"Those stacked bracelets! So Fearless era," is how Sarah Chapelle\'s Taylor Swift Style archive files the shoot — the armful of bangles turning up in nearly every press photo of the stretch. Even Selena Gomez remembers the accessory as definitional: recalling their first meeting around 2008, she described "the crazy curly Taylor" with "bracelets that went all the way up."',
        sources: [
          { outlet: 'Taylor Swift Style', url: 'https://www.taylorswiftstyle.com/post-grid/dailytelegraph-030109' },
          {
            outlet: 'Hola!',
            url: 'https://www.hola.com/us/celebrities/20250807849060/selena-gomez-jonas-brothers-taylor-swift-friendship/',
          },
        ],
        photos: [
          {
            url: 'https://images.squarespace-cdn.com/content/v1/6616cae0172b170a8dd0818d/eca000d7-4a7b-4b27-b5b3-4d4fef296c74/The+Daily+Telegraph+March+2009+Taylor+Swift+Style+Feature+Image.png',
            credit: 'Taylor Swift Style',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 1,
      day: 31,
      category: 'fashion',
      title: 'A mauve Dolce & Gabbana dress for her first Grammy win',
      snippet: 'A mauve Dolce & Gabbana cocktail dress, worn when "White Horse" won Best Country Song at the 2010 Grammys pre-telecast ceremony.',
      sourceUrl: 'https://www.justjaredjr.com/2010/01/31/taylor-swift-white-horse-grammy-winner/',
      thumbnailUrl:
        'https://media.gettyimages.com/id/96303852/photo/the-52nd-annual-grammy-awards-pre-telecast-show.jpg?s=594x594&w=0&k=20&c=m6WSv7vy-GdYcvplS6Q2QZh-kSvnl2vE1PtlTEmQjvw=',
      moment: {
        context:
          'Held earlier in the day before the televised main event (where she\'d later wear the blue KaufmanFranco gown), the pre-telecast ceremony was where "White Horse" picked up Best Country Song and Best Female Country Vocal Performance — the first two Grammy wins of her career.\n\nThe mauve Dolce & Gabbana cocktail dress ended up in the record books almost by accident: by night\'s end she had four trophies including Album of the Year, so the low-key afternoon look is what she\'s wearing in the photos of the wins that started the count. Just Jared Jr.\'s gallery from the ceremony catches her accepting with the gramophone in hand.',
        sources: [
          {
            outlet: 'JustJared Jr.',
            url: 'https://www.justjaredjr.com/2010/01/31/taylor-swift-white-horse-grammy-winner/',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/52nd_Annual_Grammy_Awards',
          },
        ],
        // Image-fix pass (2026-07-10): the previous hotlink was actually from
        // the Jan. 30 "Salute to Icons" gala the night before (silver dress,
        // with Katy Perry) rather than this Jan. 31 pre-telecast win; replaced
        // with an unwatermarked Getty frame of her onstage at the actual
        // pre-telecast ceremony in the mauve dress. Verified HTTP 200 +
        // image/jpeg and visually confirmed (mauve/dusty-rose cocktail dress,
        // Staples Center pre-telecast stage) this session.
        photos: [
          {
            url: 'https://media.gettyimages.com/id/96303852/photo/the-52nd-annual-grammy-awards-pre-telecast-show.jpg?s=594x594&w=0&k=20&c=m6WSv7vy-GdYcvplS6Q2QZh-kSvnl2vE1PtlTEmQjvw=',
            credit: 'Kevin Winter/Getty Images',
            caption: 'Accepting Best Country Song for "White Horse" at the Jan. 31, 2010 Grammy pre-telecast ceremony.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 1,
      day: 6,
      category: 'fashion',
      title: "A Jenny Packham resort mini for the 2010 People's Choice Awards",
      snippet: 'A white Jenny Packham Resort 2010 mini dress, Christian Louboutin pumps, and Neil Lane jewelry at the Nokia Theatre.',
      sourceUrl: 'https://taylorswiftstyled.com/2013/11/11/2010-peoples-choice-awards-january-6-2010-3/',
      thumbnailUrl: 'https://media.gettyimages.com/id/95615213/photo/peoples-choice-awards-2010-inside.jpg?s=594x594&w=0&k=20&c=i2sE4_vzMgI0z9xq55bKp3xHMw8YS29LcycMA7v6bWU=',
      moment: {
        context:
          'Worn Jan. 6, 2010 at the Nokia Theatre L.A. Live, the night she won Favorite Female Artist — a leggy, sparkle-free mini in contrast to the sequined gowns dominating her other red-carpet stops that awards season.\n\nThe win itself came over a heavyweight ballot — Beyoncé, Britney Spears, Carrie Underwood and Pink — and she read the moment as an omen for the year ahead: "What a beautiful, beautiful way to start out a new decade," she told the crowd, crediting the fans as "the ones who choose which songs on the radio you want to turn up." Twenty-five days later, the omen paid off with four Grammys.',
        sources: [
          {
            outlet: 'Taylor Swift Styled',
            url: 'https://taylorswiftstyled.com/2013/11/11/2010-peoples-choice-awards-january-6-2010-3/',
          },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-wins-favorite-female-artist-at-2010-peoples-choice-awards-960796/',
          },
        ],
        // Image-fix pass (2026-07-10): the taylorswiftstyled.com hotlink was a
        // two-panel dress-comparison collage; replaced with a single unwatermarked
        // Getty frame backstage at the actual show. Verified HTTP 200 +
        // image/jpeg and visually confirmed (white Jenny Packham mini, holding
        // the Favorite Female Artist trophy) this session.
        photos: [
          {
            url: 'https://media.gettyimages.com/id/95615213/photo/peoples-choice-awards-2010-inside.jpg?s=594x594&w=0&k=20&c=i2sE4_vzMgI0z9xq55bKp3xHMw8YS29LcycMA7v6bWU=',
            credit: 'Michael Buckner/Getty Images',
            caption: 'Backstage in the Jenny Packham mini with her Favorite Female Artist trophy, Jan. 6, 2010.',
            kind: 'primary',
          },
        ],
      },
    },
    {
      year: 2010,
      month: 6,
      day: 9,
      category: 'fashion',
      title: 'A John Galliano buckle-strap dress for the 2010 CMT Music Awards',
      snippet: "A deep-purple John Galliano 'Buckle Strap Dress' at the 2010 CMT Music Awards in Nashville — the first year she wore her hair straight for the show.",
      sourceUrl: 'https://www.hellomagazine.com/celebrities/516949/taylor-swifts-most-iconic-cmt-performances-head-turning-outfits-over-the-years/',
      thumbnailUrl: 'https://images.hellomagazine.com/horizon/original_aspect_ratio/e2a6da3bf8ab-gettyimages-101937337.jpg',
      moment: {
        context:
          'Worn June 9, 2010 at Bridgestone Arena, the John Galliano dress marked a style pivot for the CMTs — the first year her signature curls gave way to straight blonde hair on that red carpet.\n\nThe night itself was a rare Fearless-era shutout: nominated for Video of the Year and Female Video of the Year for "You Belong with Me," she lost the first to Carrie Underwood\'s "Cowboy Casanova" and the second, in a mild upset, to Miranda Lambert\'s "White Liar" — one of the few award shows of the stretch where the deep-purple dress, not a trophy haul, was the story.',
        sources: [
          {
            outlet: 'Hello!',
            url: 'https://www.hellomagazine.com/celebrities/516949/taylor-swifts-most-iconic-cmt-performances-head-turning-outfits-over-the-years/',
          },
          {
            outlet: 'The Boot',
            url: 'https://theboot.com/cmt-awards-winners-2010/',
          },
        ],
        photos: [
          {
            url: 'https://images.hellomagazine.com/horizon/original_aspect_ratio/e2a6da3bf8ab-gettyimages-101937337.jpg',
            credit: 'Getty Images / Hello!',
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
      moment: {
        context:
          'Shot July 30, 2009, the candids show Lautner clearing a high-jump bar on the track-and-field equipment while the pair filmed their Valentine’s Day roles as high school sweethearts — among the earliest public photos of the two Taylors together.\n\nThe Garry Marshall ensemble rom-com, released Feb. 12, 2010, cast Swift as Felicia and Lautner as Willy — a young couple written to represent "the freshness of new love" — in what was her feature-film acting debut. The chemistry visible in these set photos read on screen, too: the pair went on to earn a Best Kiss nomination at the 2010 MTV Movie Awards.',
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
      thumbnailUrl: 'https://media.gettyimages.com/id/92338597/photo/columbus-blue-jackets-v-los-angeles-kings.jpg?s=594x594&w=0&k=20&c=mRN-Vj_Vy27121bqUS3wWF1EjIx5iemjLkCSp5v9gn4=',
      moment: {
        context:
          'On Oct. 25, 2009, Swift picked Lautner up from the airport and the two headed to a Los Angeles Kings–Columbus Blue Jackets game at the Staples Center, then were seen together in a Beverly Hills hotel lobby that night.\n\nAn eyewitness said Swift "was all dolled up and looked super pretty," while Lautner "was hiding under a hoody."',
        sources: [{ outlet: 'The Boot', url: 'https://theboot.com/taylor-swift-taylor-lautner-3/' }],
        // Image-fix pass (2026-07-10): the previous townsquare.media hotlink
        // was serving the site's own placeholder/logo graphic, not a real
        // photo. Replaced with a genuine Getty photo from the actual Oct. 25,
        // 2009 Kings-Blue Jackets game. Verified HTTP 200 + image/jpeg and
        // visually confirmed (both Swift and Lautner seated together at the
        // game) this session.
        photos: [
          {
            url: 'https://media.gettyimages.com/id/92338597/photo/columbus-blue-jackets-v-los-angeles-kings.jpg?s=594x594&w=0&k=20&c=mRN-Vj_Vy27121bqUS3wWF1EjIx5iemjLkCSp5v9gn4=',
            credit: 'Andrew D. Bernstein/NHLI via Getty Images',
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
      thumbnailUrl:
        'https://media.gettyimages.com/id/2230719065/photo/celebrity-sightings-bauer-griffin-2009.jpg?s=594x594&w=0&k=20&c=nIIEsh_b-K1G32j7WfSWEA62lLJKWGPGESEdoxpAWww=',
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
        // the couple from the same Dec. 3, 2009 outing. Verified HTTP 200 +
        // image/jpeg and visually confirmed (both Taylors together) this
        // session.
        photos: [
          {
            url: 'https://media.gettyimages.com/id/2230719065/photo/celebrity-sightings-bauer-griffin-2009.jpg?s=594x594&w=0&k=20&c=nIIEsh_b-K1G32j7WfSWEA62lLJKWGPGESEdoxpAWww=',
            credit: 'Bauer-Griffin/GC Images',
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
      thumbnailUrl: 'https://media.gettyimages.com/id/2230718733/photo/celebrity-sightings-bauer-griffin-2009.jpg?s=594x594&w=0&k=20&c=uw4mj6X64bIucRaYDJQvGPQFTGIKZdPj-q1YXerW31Q=',
      moment: {
        context:
          'On Dec. 3, 2009, after afternoon reshoots for Valentine’s Day at a local high school, Swift and Lautner grabbed a snack at Menchie’s Frozen Yogurt and met up with co-star Emma Roberts (in a brunette wig) before heading to dinner at Benihana in Beverly Hills.\n\nThe paparazzi set caught the details that made the outing a fan favorite: the pair leaving with a giant pink box — presumed chocolates, per Just Jared Jr. — and a giant stuffed polar bear. The day had started as work, with the reshoots staged in the bleachers of a football field, and ended as one of the pair’s last widely photographed outings before the quiet December breakup.',
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
        // at all. Verified the replacement HTTP 200 + image/jpeg and visually
        // confirmed (both Swift and Lautner together) this session.
        photos: [
          {
            url: 'https://media.gettyimages.com/id/2230718733/photo/celebrity-sightings-bauer-griffin-2009.jpg?s=594x594&w=0&k=20&c=uw4mj6X64bIucRaYDJQvGPQFTGIKZdPj-q1YXerW31Q=',
            credit: 'Bauer-Griffin/GC Images',
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
          'Swift described the Dec. 9, 2009 outing herself: "Photo shoot all day, followed by dinner with Emma Stone. Then we wandered around a candy store like wide-eyed little kids." The pair had dinner at Otto Restaurant before stopping at the ice cream shop.\n\nThe friendship was still new but already more than a year deep: the two met at the 2008 Young Hollywood Awards, and Stone later admitted she made the first move — "I listened to some of her music, and I wrote her an e-mail saying I liked her music, I swear. And then we started talking and hanging out." The Baskin-Robbins run was one of the friendship\'s first paparazzi-documented hangouts.',
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
        'https://media.gettyimages.com/id/94673660/photo/z100s-jingle-ball-2009-presented-by-h-m-show.jpg?s=594x594&w=0&k=20&c=E59rBFYnR4Ncd9xBGTWP2Z7eMj8WOUs75Hy4l1odmC8=',
      moment: {
        context:
          'Mayer, then 31, had invited 19-year-old Swift to sing on "Half of My Heart" while he was still finishing Battle Studies, and their live duet at Z100\'s Jingle Ball made the chemistry public. The romance the rumors predicted did happen — and was over within a couple of months.\n\nThe real aftermath arrived on her next album: "Dear John" called out the age gap directly, and Mayer fired back in a 2012 Rolling Stone interview, calling it "cheap songwriting" and "a really lousy thing to do."',
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
        // Image-fix pass (2026-07-10): the Just Jared Jr. hotlink carried a
        // baked-in watermark; replaced with an unwatermarked Getty photo of
        // the same duet. Verified HTTP 200 + image/jpeg and visually
        // confirmed (Swift and Mayer sharing the MSG stage) this session.
        photos: [
          {
            url: 'https://media.gettyimages.com/id/94673660/photo/z100s-jingle-ball-2009-presented-by-h-m-show.jpg?s=594x594&w=0&k=20&c=E59rBFYnR4Ncd9xBGTWP2Z7eMj8WOUs75Hy4l1odmC8=',
            credit: 'Kevin Mazur/WireImage',
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
          'Swift landed in Sydney on Feb. 5, 2010 ahead of the Australian leg of the Fearless Tour — a five-city, week-long run that had opened at the Brisbane Entertainment Centre the night before and reached Sydney’s Acer Arena for two shows on Feb. 6 and 7.\n\nThe leg carried on through Newcastle, Melbourne’s Rod Laver Arena and Adelaide by Feb. 12, with country trio Gloriana opening, and played to roughly 78,000 people across the week — the Fearless show’s only visit to Australia before the tour wrapped that July.',
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
          'On March 23, 2010, Swift and Gomez spent the afternoon bowling with a group of friends at Pinz Bowling Center in Studio City, California — a casual, camera-ready hangout from the earliest stretch of their friendship.\n\nThe two had met in 2008 while dating brothers — "I dated Nick, and she dated Joe. And it was cute, we were young," Gomez has said of the Jonas Brothers chapter — and bonded when both relationships ended, agreeing that "the best thing we got out of those relationships was each other." By this 2010 afternoon the friendship had already outlasted both romances, on its way to becoming one of the longest-running in Swift\'s circle.',
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
        "https://upload.wikimedia.org/wikipedia/en/d/d9/Taylor_Swift_-_You%27re_Not_Sorry.png",
      moment: {
        context:
          'She\'s said the inspiration was an ex-boyfriend whose lies took a while to surface: "He came across as Prince Charming [...] who had a lot of secrets that he didn\'t tell me about." The situation became a "breaking point" where she felt she had to walk away before getting hurt further.\n\nShe wrote the song alone and produced it with Nathan Chapman at Blackbird Studio in Nashville, releasing it Oct. 28, 2008 as a promotional single ahead of the album.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/You%27re_Not_Sorry' }],
        photos: [
          {
            url: "https://upload.wikimedia.org/wikipedia/en/d/d9/Taylor_Swift_-_You%27re_Not_Sorry.png",
            credit: 'Big Machine Records',
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
        'https://upload.wikimedia.org/wikipedia/en/8/86/Taylor_Swift_-_Fearless.png',
      moment: {
        context:
          'Swift was inspired after meeting someone who seemed like the ideal partner but didn\'t feel as exciting as a more toxic ex. She brought the idea to a writing session with John Rich, saying he related "because he is that complicated, frustrating messy guy in his relationships."\n\nShe called the collaboration "just so cool" and Rich "an incredible writer"; he, in turn, was impressed by her songwriting and connection with her audience at her age.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Way_I_Loved_You' }],
        // T16 photo pass (2026-07-09): the song is an album track with no
        // single artwork or video, so this is the parent album's cover art
        // from the Wikipedia article's stable upload.wikimedia.org copy —
        // verified HTTP 200 + image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/86/Taylor_Swift_-_Fearless.png',
            credit: 'Big Machine Records (album cover art)',
            caption: 'Cover art for Fearless, the album that carries "The Way I Loved You."',
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
          'Swift pleaded with Big Machine\'s Scott Borchetta to add the track a day before the tracklist was finalized, because it was about "something really, really dramatic and crazy." She\'s described her writing process as reactive: "I can write something, call up my producer, we can get in the studio, put a rush on it, get an overnight mix."\n\nOn Ellen that November, she first guessed Jonas had ended things "over the phone in 25 seconds," then said she\'d actually checked her call log afterward and corrected herself: it was 27 seconds — "that\'s got to be a record." She felt she "owed it" to fans to be open about it; Jonas later called her response "flattering."',
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
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/8/86/Taylor_Swift_-_Fearless.png',
      moment: {
        context:
          'Swift discovered Luna Halo\'s "Untouchable" when her label president gave her the band\'s album, then debuted a stripped-down cover during a 2008 "Stripped" session before including a reworked version — new lyrics and arrangement, earning her a co-writing credit — on the Fearless: Platinum Edition.\n\nLuna Halo\'s Nathan Barlowe on her pick: "She could have chosen any cover in the world, but that\'s what she chose."',
        sources: [
          { outlet: 'The Boot', url: 'https://theboot.com/taylor-swift-untouchable/' },
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Luna_Halo_(album)' },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/86/Taylor_Swift_-_Fearless.png',
            credit: 'Big Machine Records',
          },
        ],
      },
    },
    {
      year: 2009,
      month: 3,
      day: 14,
      category: 'business',
      title: 'Fearless spends 11 weeks at No. 1 — a record for the whole decade',
      snippet: 'Eleven non-consecutive weeks atop the Billboard 200: the longest run for a female country album, and for any album released in the 2000s.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/8/86/Taylor_Swift_-_Fearless.png',
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
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/86/Taylor_Swift_-_Fearless.png',
            credit: 'Big Machine Records',
            // Focal point set 2026-07-18 by viewing (300x300): profile facing
            // left-of-center, wind-blown curls filling the right half.
            focalPoint: '40% 32%',
          },
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
            kind: 'archival',
            // Focal point set by viewing: tall frame; she stands center-left,
            // face upper-left quadrant beneath the raised fist.
            focalPoint: '32% 24%',
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
      snippet: '3.217 million copies sold in the US in 2009 alone, making 20-year-old Swift the youngest artist — and only female country act — with a calendar-year best-seller.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
      thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/en/8/86/Taylor_Swift_-_Fearless.png',
      moment: {
        context:
          'With 3.217 million copies sold in the United States throughout 2009, Fearless was the year\'s best-selling album in the country, making Swift, then 20, the youngest artist and the only female country musician to have a best-selling album of a calendar year.\n\nIt also spent a total of 58 weeks in the Billboard 200\'s top 10 — a record for a country musician, and the only 2000s album to spend its first full year there.',
        sources: [{ outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)' }],
        // Photo-enrichment run 16 (2026-07-18, #762): added a CC BY 2.0 Commons
        // shot from the Fearless Tour's 2010 leg (WEZL, Apr. 30, 2010) —
        // license verified via the Commons API, URL verified HTTP 200 +
        // image/jpeg, downloaded and visually confirmed (Swift mid-song in the
        // sparkling violet dress). Per-image focal points set by eye.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/8/86/Taylor_Swift_-_Fearless.png',
            credit: 'Big Machine Records',
            focalPoint: '35% 35%',
          },
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Taylor_Swift_Fearless_Tour_02.jpg',
            credit: 'WEZL (CC BY 2.0), via Wikimedia Commons',
            caption: 'On the Fearless Tour in April 2010, just after Fearless closed 2009 as America\'s best-selling album.',
            kind: 'archival',
            focalPoint: '35% 30%',
          },
        ],
      },
    },
    {
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
          'On June 5, 2010, the Fearless Tour stop at Gillette Stadium in Foxborough, Massachusetts brought in $3.7 million in ticket sales from 56,868 concertgoers — the tour\'s highest-grossing show — and made Swift the first female musician to headline and sell out Gillette Stadium.\n\nIt was also the tour\'s final US date, and Billboard\'s review caught her playing to the home crowd: she pulled on a No. 13 Patriots jersey mid-show, walked the stands hugging fans through an acoustic set, and closed under the waterfall effect that soaked her at the end of every night.',
        sources: [
          { outlet: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Fearless_Tour' },
          {
            outlet: 'Billboard',
            url: 'https://www.billboard.com/music/music-news/taylor-swift-june-5-2010-foxboro-mass-957869/',
          },
        ],
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Taylor_Swift_-_You_Belong_With_Me_-_Fearless_Tour_2010_at_Gillette_Stadium.jpg/500px-Taylor_Swift_-_You_Belong_With_Me_-_Fearless_Tour_2010_at_Gillette_Stadium.jpg',
            credit: 'Wikimedia Commons',
          },
        ],
      },
    },

    {
      year: 2010,
      month: 4,
      day: 18,
      category: 'fashion',
      title: 'A wisteria Marchesa gown for the 2010 ACM Awards',
      snippet: 'A draped, chiffon-embroidered wisteria Marchesa gown, Christian Louboutin heels, and Neil Lane jewels at the Academy of Country Music Awards.',
      sourceUrl: 'https://www.justjaredjr.com/2010/04/18/taylor-swift-is-acm-amazing/',
      thumbnailUrl: 'https://media.gettyimages.com/id/98533973/photo/45th-annual-academy-of-country-music-awards-arrivals.jpg?s=594x594&w=0&k=20&c=67QbByMHXPBbPhVd880zAhmLEoz7-Hm5Ns4unn8vrnA=',
      moment: {
        context:
          'At the April 18, 2010 ACM Awards at Las Vegas’ MGM Grand Garden Arena, 20-year-old Swift wore the Marchesa gown on the carpet ahead of nominations including Entertainer of the Year, then changed mid-performance into a Carmen Marc Valvo dress she tore away on stage.\n\nFor once the trophies went elsewhere: despite nominations spanning Entertainer of the Year, Top Female Vocalist of the Year, and Song of the Year and Video of the Year for "You Belong with Me," she went home empty-handed, with Entertainer of the Year going to Carrie Underwood. Her performance slot went to "Change" — one of the only major award nights of the era where the draped wisteria chiffon, not a sweep, was the headline.',
        sources: [
          {
            outlet: 'Just Jared Jr.',
            url: 'https://www.justjaredjr.com/2010/04/18/taylor-swift-is-acm-amazing/',
          },
          {
            outlet: 'Just Jared',
            url: 'https://www.justjared.com/2010/04/18/taylor-swift-acm-awards-2010-performance/',
          },
          {
            outlet: 'Wikipedia',
            url: 'https://en.wikipedia.org/wiki/45th_Academy_of_Country_Music_Awards',
          },
        ],
        // Image-fix pass (2026-07-10): the Just Jared Jr. headline hotlink was
        // a 300x300 two-panel fan-site collage; replaced with a single
        // full-length Getty arrivals frame. Verified HTTP 200 + image/jpeg and
        // visually confirmed (draped lavender/wisteria one-shoulder Marchesa
        // gown, ACM step-and-repeat) this session.
        photos: [
          {
            url: 'https://media.gettyimages.com/id/98533973/photo/45th-annual-academy-of-country-music-awards-arrivals.jpg?s=594x594&w=0&k=20&c=67QbByMHXPBbPhVd880zAhmLEoz7-Hm5Ns4unn8vrnA=',
            credit: 'Jon Kopaloff/FilmMagic, via Getty Images',
            caption: 'The wisteria Marchesa gown on the red carpet at the April 18, 2010 ACM Awards.',
            kind: 'primary',
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
      year: 2008,
      month: 9,
      day: 15,
      category: 'release',
      title: 'Love Story arrives two months before the album',
      snippet:
        'Sept. 15, 2008: the lead single from Fearless goes out to country radio ahead of the album — and starts a climb that wouldn\'t stop until it had topped pop radio too.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor_Swift_song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/0/01/Taylor_Swift_-_Love_Story.png',
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
            url: 'https://upload.wikimedia.org/wikipedia/en/0/01/Taylor_Swift_-_Love_Story.png',
            credit: 'Big Machine Records (single cover art)',
            focalPoint: '70% 30%',
          },
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
      year: 2008,
      month: 12,
      day: 8,
      category: 'release',
      title: "White Horse, the single Grey's Anatomy saved for Fearless",
      snippet:
        'She\'d considered holding "White Horse" for her third album — until Grey\'s Anatomy used it in its season-five premiere, and it became the second Fearless single that December.',
      sourceUrl: 'https://en.wikipedia.org/wiki/White_Horse_(Taylor_Swift_song)',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/7/74/Taylor_Swift_-_White_Horse.png',
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
            url: 'https://upload.wikimedia.org/wikipedia/en/7/74/Taylor_Swift_-_White_Horse.png',
            credit: 'Big Machine Records (single cover art)',
            caption: 'Single cover art for "White Horse."',
            kind: 'primary',
            focalPoint: '65% 35%',
          },
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
        'https://upload.wikimedia.org/wikipedia/en/8/86/Taylor_Swift_-_Fearless.png',
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
            url: 'https://upload.wikimedia.org/wikipedia/en/8/86/Taylor_Swift_-_Fearless.png',
            credit: 'Big Machine Records',
            focalPoint: '35% 35%',
          },
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
      title: 'Today Was a Fairytale breaks a download record in a week',
      snippet:
        'A one-off for the Valentine\'s Day soundtrack, released Jan. 19, 2010 on iTunes only — 325,000 downloads in week one, the biggest ever for a female artist at the time.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Today_Was_a_Fairytale',
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/en/6/6e/Taylor_Swift_-_Today_Was_a_Fairytale_%28Altr.%29.png',
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
        // T16 photo pass (2026-07-09): cover art taken from the Wikipedia
        // article's stable upload.wikimedia.org copy; verified HTTP 200 +
        // image/png this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/6/6e/Taylor_Swift_-_Today_Was_a_Fairytale_%28Altr.%29.png',
            credit: 'Big Machine Records (single cover art)',
            caption: 'Single cover art for "Today Was a Fairytale."',
            kind: 'primary',
            focalPoint: '67% 75%',
          },
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
      thumbnailUrl:
        'https://upload.wikimedia.org/wikipedia/commons/7/72/Love_and_Theft_-_Stephen_Barker_Liles.jpg',
      moment: {
        context:
          'Every Fearless lyric sheet hid a capitalized-letter message inside the printed lyrics; "Hey Stephen"\'s decoded to the name of its subject\'s band — the era\'s Easter-egg culture, already fully operational in 2008.\n\nSwift texted Liles about the song after the album dropped, and his first reaction was dread: "What did I do? Because she doesn\'t really write very many nice songs about guys. So I was very relieved when it turned out to be a nice song." He eventually answered in kind, writing Swift a response song, "Try to Make It Anyway," recorded in his home studio and released in 2011.',
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
          // License provenance for the reference image below (Commons file page):
          {
            outlet: 'Wikimedia Commons (file page — Love and Theft - Stephen Barker Liles)',
            url: 'https://commons.wikimedia.org/wiki/File:Love_and_Theft_-_Stephen_Barker_Liles.jpg',
          },
        ],
        // T16 photo pass (2026-07-09): no free or stable photo of Swift and
        // Liles together could be verified, so this is a clearly-labeled
        // reference image of the song's subject — CC BY 2.0 per the Commons
        // file page cited above (crop of a 2010 WEZL concert photo). Verified
        // HTTP 200 + image/jpeg and visually confirmed this session.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Love_and_Theft_-_Stephen_Barker_Liles.jpg',
            credit: "WEZL Charleston's Best Country / CC BY 2.0, via Wikimedia Commons",
            caption:
              'For reference — Stephen Barker Liles of Love and Theft, the song\'s namesake, performing in May 2010.',
            kind: 'reference',
            focalPoint: '48% 22%',
          },
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
          'Premiered in May 2009 as the album\'s third single took off, the split-role video became the era\'s defining visual — and its VMA win that September is the reason the Kanye West moment happened at all.\n\nRoman White shot it over two days at Pope John Paul II High School near her Hendersonville home town, with Swift playing both "the nerd, who is pining away for this guy that she can\'t have" and "the popular girl — horrible, scary, intimidating and perfect"; White has said the closing kiss with Lucas Till took about 45 takes. The song matched the video\'s reach, peaking at No. 2 on the Hot 100 (blocked only by "I Gotta Feeling") and becoming the first country song to top the all-genre Radio Songs airplay chart.',
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
        // T16 photo pass (2026-07-09): cover art from the Wikipedia article's
        // stable upload.wikimedia.org copy; video still is the thumbnail of the
        // official upload — video id VuNIsY6JdUw verified via YouTube oEmbed
        // this session (title "Taylor Swift - You Belong With Me", channel
        // @TaylorSwift). Both URLs verified HTTP 200 + image content-type.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Taylor_Swift_-_You_Belong_with_Me.png',
            credit: 'Big Machine Records (single cover art)',
            caption: 'Single cover art for "You Belong with Me."',
            kind: 'primary',
          },
          {
            url: 'https://i.ytimg.com/vi/VuNIsY6JdUw/hqdefault.jpg',
            credit: 'Big Machine Records / official Taylor Swift YouTube channel',
            caption:
              'Still from the official "You Belong with Me" music video, directed by Roman White — the dance-scene arrival in a white dress.',
            kind: 'archival',
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
      thumbnailUrl:
        'https://media.gettyimages.com/id/90123054/photo/taylor-swift-fearless-tour-2009-in-new-york-city.jpg?s=594x594&w=0&k=20&c=EC4gdnl3KTm305fgyn1obvUpdu10yO8fz8KVrigs_II=',
      moment: {
        context:
          'Country Standard Time reported the near-instant sellout when tickets moved in early 2009; by the time the tour reached New York that August, Rolling Stone\'s review of the show read like a coronation — a two-hour, three-act "elaborate spectacle" that opened with "You Belong with Me" in marching-band gear and ended with a waterfall drenching her onstage.\n\nIn between she carried a guitar into the stands for an acoustic set, and told the crowd after "Tim McGraw": "As long as I live, I will never forget what you just did for me." Her own pre-show summary, per Rolling Stone: "I\'m freaking out."',
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
        // baked-in watermarks; replaced with an unwatermarked Getty photo from
        // the same Aug. 27, 2009 MSG show (this frame shows the fringed
        // mini-dress guitar segment rather than the marching-band opener, so
        // the caption below was reworded to match what the photo actually
        // shows). Verified HTTP 200 + image/jpeg and visually confirmed this
        // session.
        photos: [
          {
            url: 'https://media.gettyimages.com/id/90123054/photo/taylor-swift-fearless-tour-2009-in-new-york-city.jpg?s=594x594&w=0&k=20&c=EC4gdnl3KTm305fgyn1obvUpdu10yO8fz8KVrigs_II=',
            credit: 'Jason Kempin/Getty Images',
            caption:
              'Onstage at the sold-out Madison Square Garden show, Aug. 27, 2009.',
            kind: 'primary',
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
          'Bieber said he tripped over something coming down a ramp and "felt my ankle roll in a very bad way," but sang "One Time" through to the end before limping backstage to the medics — skipping the encore, getting a visit from Swift herself, then heading to the hospital for X-rays and a cast.\n\nHe was back opening for Swift in Manchester the next night, show-must-go-on style. The booking itself is the time capsule: two teenagers on one arena bill, months before both went supernova.',
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
      year: 2009,
      month: 11,
      day: 11,
      category: 'business',
      title: 'CMA Entertainer of the Year at 19 — the youngest ever',
      snippet:
        'Nov. 11, 2009: the CMAs hand their top prize to a 19-year-old — the youngest Entertainer of the Year in the award\'s history, and the first woman to win it since Shania Twain in 1999.',
      sourceUrl: 'https://theboot.com/taylor-swift-wins-2009-cma-entertainer-of-the-year/',
      thumbnailUrl:
        'https://media.gettyimages.com/id/92999603/photo/the-43rd-annual-cma-awards-performances-and-awards.jpg?s=594x594&w=0&k=20&c=c0ywESeQ4T5SlLbIozC6BDQv2g71urPuzthsW__5Dn8=',
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
        // Getty photo of the same Entertainer of the Year acceptance moment
        // (Faith Hill and Tim McGraw are not in this particular frame, so the
        // caption below was reworded to match what the photo actually shows).
        // Verified HTTP 200 + image/jpeg and visually confirmed (gold gown,
        // hand to face at the mic) this session.
        photos: [
          {
            url: 'https://media.gettyimages.com/id/92999603/photo/the-43rd-annual-cma-awards-performances-and-awards.jpg?s=594x594&w=0&k=20&c=c0ywESeQ4T5SlLbIozC6BDQv2g71urPuzthsW__5Dn8=',
            credit: 'Frank Micelotta/Getty Images',
            caption:
              'Accepting Entertainer of the Year in the gold gown, Nov. 11, 2009 — the biggest of her wins that night.',
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
        'https://upload.wikimedia.org/wikipedia/en/0/01/Taylor_Swift_-_Love_Story.png',
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
        // T16 photo pass (2026-07-09): the song that crossed over — its cover
        // art, from the Wikipedia article's stable upload.wikimedia.org copy.
        // Verified HTTP 200 + image/png this session.
        // Photo-enrichment run 16 (2026-07-18, #762): added a clearly-labeled
        // CC BY 3.0 Commons reference photo of Shania Twain, whose "You're
        // Still the One" held the previous country-crossover high (No. 3,
        // 1998) named in the context above. License verified via the Commons
        // API, URL verified HTTP 200 + image/jpeg, downloaded and visually
        // confirmed. Per-image focal points set by eye.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/en/0/01/Taylor_Swift_-_Love_Story.png',
            credit: 'Big Machine Records (single cover art)',
            caption: 'Single cover art for "Love Story," the first country song to top Billboard\'s pop-radio chart.',
            kind: 'primary',
            focalPoint: '70% 30%',
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
          'In "Turn, Turn, Turn," CSI Nick Stokes pieces together a year of visits to a seedy motel run by her character\'s parents — Swift, then 19, playing 16-year-old Haley Jones across the episode\'s time-jumping structure, in long brownish hair that made her briefly unrecognizable. Reviews were kinder than anyone expected — Rolling Stone said she "held her own."\n\nThe episode aired March 5, 2009, right at the peak of Fearless\'s chart run, and the stunt casting aged into a tradition: E!\'s retrospective notes she followed John Mayer (a season-seven murder victim) and paved the way for Justin Bieber to get the same treatment later.',
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
        photos: [
          {
            url: 'https://akns-images.eonline.com/eol_images/Entire_Site/2015825/rs_600x600-150925152931-600.taylor-swift-csi.jpg',
            credit: 'CBS, via E! Online',
            caption: 'As Haley Jones in the CSI episode "Turn, Turn, Turn," which aired March 5, 2009.',
            kind: 'archival',
          },
        ],
      },
    },
    {
      slug: 'snl-host-monologue-song',
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
          'Till confirmed it himself in interviews: the two dated for a stretch after shooting the video, then settled back into friendship — one of the era\'s few relationship stories with no drama attached.\n\n"We just really both liked each other. I really just liked her as a friend. That\'s the only reason that didn\'t work out," he explained later, putting the romance at about a month or two. The shoot itself he remembers fondly — "I remember just feeling like a star when I came and did that music video. I felt so special," he said in 2020, calling Swift generous and professional — and the video left him permanently attached to the era as the boy next door reading her notebook messages through the window.',
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
        context: "Fearless is the sound of teenage romance written in gold ink — princess dresses, white horses, and choruses built for arenas.\n\nIt would become the most-awarded country album in history and make her the youngest Album of the Year winner at the time.",
        // Photo pass (2026-07-19): freely licensed Commons photo from the
        // Fearless Tour; license (CC BY 2.0, photographer WEZL) verified via
        // the Commons API, URL HTTP 200 + image/jpeg, downloaded and viewed.
        // She sits frame-left with guitar — focal point keeps her face.
        photos: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Taylor_Swift_Fearless_Tour_05.jpg',
            credit: 'WEZL (CC BY 2.0) via Wikimedia Commons',
            caption: 'On a stool with an acoustic guitar and cowboy boots on the Fearless Tour — the album\'s era, live and unpolished.',
            kind: 'archival',
            focalPoint: '34% 34%',
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
        context: "Mid-acceptance, the microphone was taken. The moment turned a rising star into a household name overnight and seeded a narrative she would revisit for years.",
      },
    },
  ],
};
