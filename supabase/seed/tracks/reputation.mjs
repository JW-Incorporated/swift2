// Vault track guide — reputation era (reputation, 2017). Original prose only —
// never lyrics; unconfirmed readings are labeled. Provenance per
// docs/content/content-audit-2026-07-08.md §5 (URLs verified 2026-07-08).
// Era context: released with no interviews — the prologue's promise that there
// would be no explanation, only reputation, shapes every reading below.
const ACCESSED = '2026-07-08';
const wiki = (title, path, notes) => ({
  source_url: `https://en.wikipedia.org/wiki/${path}`,
  source_title: `${title} — Wikipedia`,
  publisher: 'Wikipedia',
  source_type: 'wiki',
  accessed_at: ACCESSED,
  reliability_score: 2,
  notes,
});
const ALBUM = wiki(
  'Reputation (album)',
  'Reputation_(album)',
  'album article: release facts, credits, and cited interviews',
);

export default {
  eraSlug: 'reputation',
  tracks: [
    {
      slug: 'ready-for-it',
      trackNumber: 1,
      trackTitle: '...Ready for It?',
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback', 'Ali Payami'],
      producers: ['Max Martin', 'Shellback', 'Ali Payami'],
      singleReleaseDate: '2017-09-03',
      note: 'The industrial-trap gauntlet throw that opens the album — armor on the verses, a secret love song hiding in the chorus.',
      summary:
        'A heist-movie meet-cute: she sizes up a new love like a co-conspirator, keeping him hidden as the prize the outside world cannot touch. The clank of the production is the disguise.',
      inspiration: null,
      themes: ['love as conspiracy', 'armor versus softness', 'new beginnings in wartime'],
      sourceUrl: 'https://en.wikipedia.org/wiki/...Ready_for_It%3F',
      sources: [
        wiki(
          '...Ready for It?',
          '...Ready_for_It%3F',
          'song article: single release and composition',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'end-game',
      trackNumber: 2,
      trackTitle: 'End Game',
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback', 'Ed Sheeran', 'Future'],
      producers: ['Max Martin', 'Shellback', 'Ilya'],
      singleReleaseDate: '2017-11-14',
      note: 'The three-hander with Ed Sheeran and Future — reputations preceding everyone involved, and wanting to be someone’s ending anyway.',
      summary:
        'Three narrators with big reputations ask for the same thing: to be judged by who they are up close, not by the highlight reel of their misses.',
      inspiration: null,
      themes: ['reputation versus reality', 'commitment', 'baggage'],
      sourceUrl: 'https://en.wikipedia.org/wiki/End_Game_(song)',
      sources: [
        wiki('End Game (song)', 'End_Game_(song)', 'song article: features and single release'),
        ALBUM,
      ],
    },
    {
      slug: 'i-did-something-bad',
      trackNumber: 3,
      trackTitle: 'I Did Something Bad',
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      note: 'The most unapologetic song she had ever released — including her first recorded curse — with witch-hunt imagery aimed straight at 2016.',
      summary:
        'Zero remorse as a power stance: if they are going to burn her as a witch either way, she will supply the gasoline and enjoy the light. Fans read the narcissist verses toward specific 2016 antagonists (unconfirmed).',
      inspiration: null,
      themes: ['unapologetic power', 'witch-hunt inversion', 'playing the villain'],
      fanLore: 'Fan reading (unconfirmed): verse-by-verse mappings to the era’s public feuds.',
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Did_Something_Bad',
      sources: [
        wiki(
          'I Did Something Bad',
          'I_Did_Something_Bad',
          'song article: composition and reception',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'dont-blame-me',
      trackNumber: 4,
      trackTitle: "Don't Blame Me",
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      note: 'The gospel-stomp about love as a drug she is happy to be convicted for — reborn years later as a live and streaming favorite.',
      summary:
        'She pleads guilty with a choir behind her: love made her crazy, the addiction metaphors pile up, and the courtroom framing turns worship and vice into the same thing.',
      inspiration: null,
      themes: ['love as intoxication', 'devotion', 'guilty as charged'],
      sourceUrl: "https://en.wikipedia.org/wiki/Don't_Blame_Me_(Taylor_Swift_song)",
      sources: [
        wiki(
          "Don't Blame Me (Taylor Swift song)",
          "Don't_Blame_Me_(Taylor_Swift_song)",
          'song article: composition and live legacy',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'delicate',
      trackNumber: 5,
      trackTitle: 'Delicate',
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      singleReleaseDate: '2018-03-12',
      note: 'Track 5, on schedule: the vocoder confession that her reputation has never been worse — so the person who likes her anyway must actually mean it.',
      summary:
        'The album’s soft center: starting something real while assuming the worst about your own name, and asking, twice a line, whether it is too soon to say what she is feeling.',
      inspiration:
        'Swift has framed reputation overall as the story of finding something real amid the wreckage — this is the song fans and critics agree carries that thesis.',
      themes: ['vulnerability', 'reputation as filter', 'is it okay to want this'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Delicate_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Delicate (Taylor Swift song)',
          'Delicate_(Taylor_Swift_song)',
          'song article: single run and thesis reading',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'look-what-you-made-me-do',
      trackNumber: 6,
      trackTitle: 'Look What You Made Me Do',
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: [
        'Taylor Swift',
        'Jack Antonoff',
        'Richard Fairbrass',
        'Fred Fairbrass',
        'Rob Manzoli',
      ],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      singleReleaseDate: '2017-08-24',
      note: 'The comeback single that killed the old Taylor on the phone — built on an interpolation of I’m Too Sexy, with a video that is one long Easter-egg museum.',
      summary:
        'A revenge overture aimed at everyone who wrote her 2016 obituary: the tilted stage, the list of names, the declaration that the old versions of her cannot come to the phone. The Right Said Fred interpolation is why their names sit in the credits.',
      inspiration:
        'Universally read against the 2016 Kimye phone-call fallout (Swift let the imagery speak rather than confirming specifics); the snake motif reclaimed the emoji flood documented that summer.',
      themes: ['revenge', 'death of the old self', 'narrative reclamation'],
      easterEggs:
        'The video buries the entire discography: dresses, headlines, and a tombstone-adjacent bathtub of jewels fans have itemized line-by-line since 2017.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Look_What_You_Made_Me_Do',
      sources: [
        wiki(
          'Look What You Made Me Do',
          'Look_What_You_Made_Me_Do',
          'song article: interpolation credit and video analysis',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'so-it-goes',
      trackNumber: 7,
      trackTitle: 'So It Goes...',
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback', 'Oscar Görres'],
      producers: ['Max Martin', 'Shellback', 'Oscar Görres'],
      note: 'The album’s trapdoor track — the only reputation song left off its own stadium tour’s main setlist, surfacing only as an occasional acoustic surprise.',
      summary:
        'A dissolve into someone behind closed doors, with the Vonnegut-echo title shrugging at everything outside them. Fans know it mainly as the great unplayed deep cut.',
      inspiration: null,
      themes: ['private intensity', 'compartmentalized love', 'deep-cut mystique'],
      sourceUrl: 'https://en.wikipedia.org/wiki/So_It_Goes...',
      sources: [wiki('So It Goes...', 'So_It_Goes...', 'song article: composition'), ALBUM],
    },
    {
      slug: 'gorgeous',
      trackNumber: 8,
      trackTitle: 'Gorgeous',
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      isSingle: true,
      note: 'The tipsy crush song that opens with a baby saying the title — credited to James, Blake Lively and Ryan Reynolds’ daughter.',
      summary:
        'Being furious at someone for being that attractive while she is spoken for: petty, funny, self-incriminating — the album’s lightest confession.',
      inspiration:
        'The intro voice is confirmed in the credits as one-year-old James Reynolds — the friendship Easter egg that later paid off again in Betty’s character names.',
      themes: ['inconvenient attraction', 'humor', 'self-sabotage'],
      easterEggs:
        'The baby-voice credit connects forward to folklore, where James and Inez name the love-triangle characters.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Gorgeous_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Gorgeous (Taylor Swift song)',
          'Gorgeous_(Taylor_Swift_song)',
          'song article: intro credit',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'getaway-car',
      trackNumber: 9,
      trackTitle: 'Getaway Car',
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The Antonoff heist epic fans call the album’s best writing — using one relationship as the escape vehicle from another, and knowing it is doomed from the ignition.',
      summary:
        'A Bonnie-without-Clyde confession: she jumped into a rebound to flee a crash, and getaway cars, by definition, do not go the distance. She turns herself in by the bridge.',
      inspiration:
        'Fans near-universally map it to the well-photographed mid-2016 relationship handoff (unconfirmed by Swift); the song’s own crime-movie framing is the only official statement.',
      themes: ['rebounds', 'self-aware wrongdoing', 'escape'],
      fanLore:
        'Fan reading (unconfirmed): the 2016 summer timeline fans treat as the heist in question.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Getaway_Car_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Getaway Car (Taylor Swift song)',
          'Getaway_Car_(Taylor_Swift_song)',
          'song article: reception',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'king-of-my-heart',
      trackNumber: 10,
      trackTitle: 'King of My Heart',
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      note: 'A relationship built in three acts of drum programming — each section written as a later stage of falling.',
      summary:
        'From liking her own company, to a new person breaking the cynicism, to full fanfare: the structure itself dramatizes commitment deepening. Luxury-brand boys lose to the one with the American smile.',
      inspiration: null,
      themes: ['stages of falling in love', 'substance over flash', 'contentment'],
      sourceUrl: 'https://en.wikipedia.org/wiki/King_of_My_Heart',
      sources: [wiki('King of My Heart', 'King_of_My_Heart', 'song article: structure'), ALBUM],
    },
    {
      slug: 'dancing-with-our-hands-tied',
      trackNumber: 11,
      trackTitle: 'Dancing with Our Hands Tied',
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback', 'Oscar Holter'],
      producers: ['Max Martin', 'Shellback', 'Oscar Holter'],
      note: 'Loving someone while the internet watches with knives out — the era’s anxiety distilled into one held breath of a dance.',
      summary:
        'A romance conducted under hostile surveillance: they slow-dance inside the blast radius, certain the world will detonate it eventually. The stadium-tour acoustic version became its redemption arc.',
      inspiration: null,
      themes: ['love under scrutiny', 'dread', 'holding on anyway'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Dancing_with_Our_Hands_Tied',
      sources: [
        wiki(
          'Dancing with Our Hands Tied',
          'Dancing_with_Our_Hands_Tied',
          'song article: composition',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'dress',
      trackNumber: 12,
      trackTitle: 'Dress',
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The most adult song in the catalog to that point — desire stated plainly enough that fans watched her parents’ reactions at the listening parties.',
      summary:
        'Friendship burning past its container: the golden-tattoo imagery and the bought-it-so-you-could-take-it-off thesis said what the earlier albums only implied.',
      inspiration:
        'Fans connect the buzzed-hair and flower details in the bridge to documented 2016 events (unconfirmed by Swift).',
      themes: ['desire', 'friends to lovers', 'grown-up candor'],
      fanLore: 'Fan reading (unconfirmed): the bridge details fans use to identify the subject.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Dress_(Taylor_Swift_song)',
      sources: [
        wiki('Dress (Taylor Swift song)', 'Dress_(Taylor_Swift_song)', 'song article: reception'),
        ALBUM,
      ],
    },
    {
      slug: 'this-is-why-we-cant-have-nice-things',
      trackNumber: 13,
      trackTitle: "This Is Why We Can't Have Nice Things",
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The party-crash diss track about a friendship that came with a knife in it — forgiveness gets offered mid-song and then gleefully retracted.',
      summary:
        'She throws a housewarming for her own success, names the betrayal that wrecked it, fake-raises a toast to forgiveness, and bursts out laughing instead. The album’s id, unsupervised.',
      inspiration:
        'Universally read as the Kanye West friendship post-2016 (unconfirmed in so many words); the golden-things-broken framing matches the era’s documented events beat for beat.',
      themes: ['betrayed trust', 'mock forgiveness', 'gleeful pettiness'],
      fanLore:
        'Fan/press reading: the West fallout as subject — treated as obvious, never officially footnoted.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Reputation_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'call-it-what-you-want',
      trackNumber: 14,
      trackTitle: 'Call It What You Want',
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isSingle: true,
      note: 'Released quietly before the album with lyric-video calligraphy — the castle fell, the kingdom shrank to two people, and she is fine with the downsize.',
      summary:
        'The peace treaty after the war tracks: her status collapsed, the fair-weather crowd left, and what remained was one person who stayed. The title dares the commentariat to keep labeling.',
      inspiration: null,
      themes: ['aftermath', 'love as refuge', 'indifference to opinion'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Call_It_What_You_Want_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Call It What You Want (Taylor Swift song)',
          'Call_It_What_You_Want_(Taylor_Swift_song)',
          'song article: promo release',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'new-years-day',
      trackNumber: 15,
      trackTitle: "New Year's Day",
      release: 'reputation',
      releaseDate: '2017-11-10',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isSingle: true,
      note: 'The piano closer that drops every mask on the album at once — she does not want the party, she wants the person holding the trash bag the morning after.',
      summary:
        'Love measured by who stays to clean up: glitter on the floor, candle wax, a ride home from the hospital someday. After twelve tracks of armor, the thesis lands barefoot in a kitchen.',
      inspiration:
        'Swift premiered it in a living-room session and pushed it to country radio — a deliberate callback to her roots at the end of her most synthetic record.',
      themes: ['staying', 'ordinary devotion', 'the morning after'],
      sourceUrl: "https://en.wikipedia.org/wiki/New_Year's_Day_(Taylor_Swift_song)",
      sources: [
        wiki(
          "New Year's Day (Taylor Swift song)",
          "New_Year's_Day_(Taylor_Swift_song)",
          'song article: country-radio release',
        ),
        ALBUM,
      ],
    },
  ],
};
