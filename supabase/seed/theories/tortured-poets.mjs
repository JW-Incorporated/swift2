// Vault theories/easter eggs — Tortured Poets era. All URLs verified 2026-07-08.
// Egg-density pass (#686, Content Shift 2026-07-17): four eggs added, URLs
// verified 2026-07-17.
// Theory-density pass (#685, Content Shift 2026-08-05): TTPD sat at 0 theories
// while every other non-folklore/evermore era had a theory pass. Three
// content/craft/lyrical theories added (Clara Bow, Cassandra, the pen
// categories) — no relationship/private-life readings, per theory-weaving.md.
// URLs verified 2026-08-05.

const wiki = (article, title, notes) => ({
  source_url: `https://en.wikipedia.org/wiki/${article}`,
  source_title: title,
  publisher: 'Wikipedia',
  source_type: 'wiki',
  accessed_at: '2026-08-08',
  reliability_score: 2,
  excerpt: null,
  notes: notes ?? null,
});

export default {
  eraSlug: 'tortured-poets',
  theories: [
    {
      slug: 'thank-you-aimee-capitals',
      kind: 'easter_egg',
      title: 'The capitals in "thanK you aIMee"',
      claim:
        'The track title is stylized "thanK you aIMee" — the stray capitals spell KIM. Press and fans read the song as addressed to a famous bully by that name; Taylor has never said so herself.',
      evidence:
        'The stylization is objective fact (it is printed that way on the tracklist) and the reading was reported by major outlets within hours. But the attribution remains an inference from typography — so it stays labeled as reporting, not confirmation.',
      confidence: 'reputable_reporting',
      outcome: 'pending',
      relatedSlugs: ['reputation:snake-reclamation'],
      sources: [wiki('The_Tortured_Poets_Department', 'The Tortured Poets Department', 'the stylization and its coverage are documented in the album article')],
    },
    {
      slug: 'peter-pan-throughline',
      kind: 'easter_egg',
      title: 'Peter, four years later',
      claim:
        'The Anthology track "Peter" reads as the grown-up ending to folklore\'s Peter-and-Wendy thread — fans hold that the boy who "lost Wendy" in "cardigan" is the same Peter who finally never comes back here.',
      evidence:
        'The Peter Pan allusion is explicit in both lyrics four years apart, and the callback was noted across the album\'s press coverage. The songs connect textually; whether they share one narrator is the (unconfirmed) fan layer.',
      confidence: 'reputable_reporting',
      outcome: 'partially_confirmed',
      relatedSlugs: ['folklore:teenage-love-triangle'],
      sources: [
        wiki('The_Tortured_Poets_Department', 'The Tortured Poets Department'),
        wiki('Cardigan_(song)', 'cardigan (song)'),
      ],
    },
    {
      slug: 'fortnight-dead-poets-casting',
      kind: 'easter_egg',
      title: 'The Dead Poets run the Tortured Poets asylum',
      claim:
        'The two scientists experimenting on Taylor in the "Fortnight" video are Ethan Hawke and Josh Charles — the schoolboys of Dead Poets Society (1989), cast on purpose: the Tortured Poets Department tipping its cap to cinema\'s most famous tortured poets.',
      evidence:
        'Hawke confirmed the intent in release-week interviews: Taylor reached out through his daughter Maya, and he described the album title as owing "some debt" to the film. Charles said he assumed Hawke was punking him when he called with the offer. Both cameos were reported the day the video dropped.',
      confidence: 'confirmed_interview',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        {
          source_url: 'https://www.hollywoodreporter.com/music/music-news/ethan-hawke-taylor-swift-fortnight-music-video-1235892762/',
          source_title: "Ethan Hawke Talks Taylor Swift's 'Fortnight' Music Video",
          publisher: 'The Hollywood Reporter',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://deadline.com/2024/04/taylor-swift-dead-poets-society-stars-ethan-hawke-josh-charles-fortnight-video-1235890796/',
          source_title: "Taylor Swift Reunites 'Dead Poets' Stars Ethan Hawke, Josh Charles For 'Fortnight' Video",
          publisher: 'Deadline',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'ttpd-spotify-library-eggs',
      kind: 'easter_egg',
      title: 'The pop-up library that leaked lyrics on a schedule',
      claim:
        "Three days before release, a Spotify 'library' installation at LA's Grove was one big walk-through egg hunt: an open book displaying unreleased lyrics (swapped for a fresh set at 2 p.m.), shelves of books spined with track titles, and a globe pointed at Florida.",
      evidence:
        'Fans documented the room in real time and the plants paid off on release day: "Even statues crumble if they\'re made to wait" and "One less temptress, one less dagger to sharpen" both surfaced as album lines, and the book spines — "The Manuscript," "The Albatross" — matched the record. Dried flowers and a peace-sign bust rounded out the set dressing fans mined for days.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        {
          source_url: 'https://www.deseret.com/entertainment/2024/04/16/taylor-swift-tortured-poets-department-los-angeles-art-installation/',
          source_title: "Taylor Swift 'The Tortured Poets Department' LA Spotify library",
          publisher: 'Deseret News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 3,
        },
        {
          source_url: 'https://www.nbcnews.com/pop-culture/music/taylor-swift-new-album-tortured-poets-department-what-know-rcna148277',
          source_title: "As Taylor Swift's 'The Tortured Poets Department' drops, here's everything you need to know",
          publisher: 'NBC News',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'black-dog-real-pub',
      kind: 'easter_egg',
      title: 'The Black Dog is a real pub, and fans found it in days',
      claim:
        'The bar the ex walks into in "The Black Dog" is a real place — fans pinned it to The Black Dog at 112 Vauxhall Walk in London within days of release and turned an unassuming neighborhood pub into a Swiftie pilgrimage site.',
      evidence:
        'The pub\'s owners say they learned about the song from the fan surge itself, then leaned in: lyric signage in the window, "home to tortured poets" in the Instagram bio, a "Taylor\'s Version" cocktail menu, and queues they had to turn away. Taylor has never said whether she meant this exact Black Dog — the fan identification, and the pub\'s embrace of it, is the story.',
      confidence: 'reputable_reporting',
      outcome: 'partially_confirmed',
      relatedSlugs: ['tortured-poets:ttpd-grief-playlists'],
      sources: [
        {
          source_url: 'https://www.cnn.com/travel/black-dog-vauxhall-london-pub-taylor-swift',
          source_title: "What it's like inside The Black Dog, the London pub made famous by Taylor Swift",
          publisher: 'CNN',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.cbsnews.com/news/talyor-swift-london-pub-black-dog-swifties-descend/',
          source_title: "Why Swifties have sniffed out and descended upon London's Black Dog pub",
          publisher: 'CBS News',
          source_type: 'reputable_press',
          accessed_at: '2026-08-17',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'ttpd-grief-playlists',
      kind: 'easter_egg',
      title: 'The heartbreak playlists were made of unreleased lyrics',
      claim:
        'Two weeks before TTPD, five Apple Music playlists of her older songs mapped the five stages of grief — and the titles were themselves the egg: "I Love You, It\'s Ruining My Life," "Old Habits Die Screaming," and "I Can Do It With a Broken Heart" were all unreleased TTPD lines hiding in plain sight.',
      evidence:
        'Taylor curated all five (denial, anger, bargaining, depression, acceptance) from her first ten albums with her own notes on each stage. On release day the titles resolved: "I Love You, It\'s Ruining My Life" is a "Fortnight" lyric, "Old Habits Die Screaming" is in "The Black Dog," and "I Can Do It With a Broken Heart" is on the tracklist itself.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: ['tortured-poets:black-dog-real-pub'],
      sources: [
        {
          source_url: 'https://www.billboard.com/music/music-news/taylor-swift-5-stages-of-heartbreak-playlists-apple-music-1235649873/',
          source_title: "Taylor Swift Shares 5 'Stages of Heartbreak' Playlists on Apple Music",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.rollingstone.com/music/music-news/taylor-swift-stages-grief-playlists-apple-music-1234999955/',
          source_title: 'Taylor Swift Soundtracks the Five Stages of Grief With New Apple Music Playlists',
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-17',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'clara-bow-it-girl-lineage',
      kind: 'theory',
      title: 'Clara Bow, Stevie Nicks, and the it-girl assembly line',
      claim:
        'The album closer reads as Taylor mapping the industry\'s cycle of crowning and discarding its women: label voices call the narrator "Clara Bow in this light," then "Stevie Nicks in \'75," then tell her a newer girl has the "edge" that Taylor "never did" — she puts herself mid-conveyor-belt, next in line to be replaced.',
      evidence:
        'The lineage is right there in the text — the song names Clara Bow (the silent era\'s original "It Girl," who retired young under relentless media scrutiny) and Stevie Nicks by name before turning the same appraising label-speak on Taylor herself. Critics read it as a companion to her earlier fame parables "The Lucky One" and "Nothing New": Rolling Stone\'s Rob Sheffield tied it to her writing on short-lived fame and being left behind, and NPR and The Ringer both framed it as Taylor clocking the cyclical nature of stardom. The self-aware reading is widely shared; she has not narrated it line by line.',
      confidence: 'reputable_reporting',
      outcome: 'partially_confirmed',
      relatedSlugs: [],
      sources: [
        {
          source_url: 'https://en.wikipedia.org/wiki/Clara_Bow_(song)',
          source_title: 'Clara Bow (song)',
          publisher: 'Wikipedia',
          source_type: 'wiki',
          accessed_at: '2026-08-05',
          reliability_score: 2,
        },
        {
          source_url: 'https://time.com/6969048/clara-bow-taylor-swift-song/',
          source_title: 'Who Is Clara Bow? The Inspiration Behind Taylor Swift\'s Song',
          publisher: 'Time',
          source_type: 'reputable_press',
          accessed_at: '2026-08-05',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'cassandra-reputation-callback',
      kind: 'theory',
      title: 'Cassandra: the prophet no one believed, and the snakes',
      claim:
        'Fans read "Cassandra" as Taylor mapping her 2016 public downfall onto the Greek myth of the prophet cursed to tell the truth and never be believed — the tell being the snake motif ("they filled my cell with snakes... do you believe me now?"), the reputation-era emoji pile-on revisited from the far side of vindication.',
      evidence:
        'The myth is explicit: Apollo curses Cassandra so her true prophecies always go unheeded. The lyric pulls its snake imagery straight from the reputation-era campaign this catalog already documents, and Billboard, Capital FM and others read the track as Taylor\'s account of being publicly disbelieved in 2016 — down to the "supposed supporters who didn\'t take her side." It points at the same public controversy the "thanK you aIMee" stylization does; it is a documented press reading of a public chapter, not an authorial confirmation.',
      confidence: 'reputable_reporting',
      outcome: 'pending',
      relatedSlugs: ['tortured-poets:thank-you-aimee-capitals', 'reputation:snake-reclamation'],
      sources: [
        {
          source_url: 'https://en.wikipedia.org/wiki/Cassandra_(Taylor_Swift_song)',
          source_title: 'Cassandra (Taylor Swift song)',
          publisher: 'Wikipedia',
          source_type: 'wiki',
          accessed_at: '2026-08-05',
          reliability_score: 2,
        },
        {
          source_url: 'https://www.capitalfm.com/news/music/taylor-swift-cassandra-lyrics-meaning-who/',
          source_title: 'Taylor Swift Explains The Meaning Behind Her \'Cassandra\' Lyrics',
          publisher: 'Capital FM',
          source_type: 'reputable_press',
          accessed_at: '2026-08-05',
          reliability_score: 3,
        },
      ],
    },
    {
      slug: 'ttpd-quill-fountain-pen-era',
      kind: 'theory',
      title: 'The most "quill and fountain pen" album she\'s made',
      claim:
        'Using Taylor\'s own three-pen system — Quill (antique, literary), Fountain Pen (modern, brutally honest), Glitter Gel Pen (carefree fun) — fans peg The Tortured Poets Department as her heaviest lean yet toward the quill/fountain-pen end: the poetry-department framing, the typewriter aesthetic, almost no glitter-gel levity.',
      evidence:
        'Taylor defined the three categories herself while accepting the Songwriter-Artist of the Decade honor at the 2022 Nashville Songwriter Awards, naming "ivy" as a quill lyric, "All Too Well" as fountain pen, and "Shake It Off" as glitter gel. Fans applied the framework to TTPD before release and pointed to a planted clue — the fountain pen sitting on the writing desk in the album\'s Spotify pop-up library. Which specific tracks land in which category is fan debate; Taylor has not sorted this album\'s songs in public.',
      confidence: 'reputable_reporting',
      outcome: 'pending',
      relatedSlugs: ['tortured-poets:ttpd-spotify-library-eggs'],
      sources: [
        {
          source_url: 'https://www.nme.com/news/music/taylor-swift-organises-her-lyrics-into-three-dorky-pen-themed-categories-3325355',
          source_title: 'Taylor Swift organises her lyrics into three "dorky" pen-themed categories',
          publisher: 'NME',
          source_type: 'reputable_press',
          accessed_at: '2026-08-05',
          reliability_score: 4,
        },
        {
          source_url: 'https://www.capitalfm.com/news/music/taylor-swifts-quill-fountain-glitter-pen-songwriting/',
          source_title: 'Is Taylor Swift\'s \'The Tortured Poets Department\' A Quill, Fountain Or Glitter Pen album?',
          publisher: 'Capital FM',
          source_type: 'reputable_press',
          accessed_at: '2026-08-05',
          reliability_score: 3,
        },
      ],
    },
  ],
};
