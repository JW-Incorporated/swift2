// Vault track guide — Fearless era (Fearless 2008 / Platinum 2009 / Taylor's
// Version 2021, including From The Vault). Original prose only — never lyrics;
// unconfirmed readings are labeled. Provenance per
// docs/content/content-audit-2026-07-08.md §5 (URLs verified 2026-07-08).
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
  'Fearless (Taylor Swift album)',
  'Fearless_(Taylor_Swift_album)',
  'album article: release facts, credits, and cited interviews',
);
const TV = wiki(
  "Fearless (Taylor's Version)",
  "Fearless_(Taylor's_Version)",
  're-recording article: vault-track credits and release facts',
);

export default {
  eraSlug: 'fearless',
  tracks: [
    {
      slug: 'fearless',
      trackNumber: 1,
      trackTitle: 'Fearless',
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift', 'Liz Rose', 'Hillary Lindsey'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      isSingle: true,
      note: 'The title track and thesis statement: fearless is not being unafraid, it is driving into the storm anyway.',
      summary:
        'A first date written as a leap of faith — dancing in a parking lot in the rain because the feeling is worth the risk.',
      inspiration:
        'Swift said she wrote it on tour about the best first date she had not had yet — an idea of fearlessness in love rather than a specific person.',
      themes: ['fearlessness', 'first dates', 'optimism in love'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Fearless (Taylor Swift song)',
          'Fearless_(Taylor_Swift_song)',
          'song article: writing background',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'fifteen',
      trackNumber: 2,
      trackTitle: 'Fifteen',
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      isSingle: true,
      note: 'Freshman year in four minutes — starring her real best friend Abigail, whose heartbreak gets the most devastating line on the album.',
      summary:
        'Advice from a slightly older self to a girl starting high school: the boy who says he loves you probably is not the whole story, and who you become matters more.',
      inspiration:
        'Confirmed autobiography: Swift wrote it about meeting best friend Abigail Anderson in ninth grade and the heartbreaks that followed both of them.',
      themes: ['growing up', 'friendship', 'hindsight'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Fifteen_(song)',
      sources: [
        wiki('Fifteen (song)', 'Fifteen_(song)', 'song article: autobiographical background'),
        ALBUM,
      ],
    },
    {
      slug: 'love-story',
      trackNumber: 3,
      trackTitle: 'Love Story',
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      singleReleaseDate: '2008-09-12',
      note: 'Written on her bedroom floor in roughly 20 minutes — Romeo and Juliet, except she overrules Shakespeare and writes the happy ending herself.',
      summary:
        'A forbidden-romance fantasy sparked by a boy her family disapproved of, recast through Romeo and Juliet — with the tragedy swapped for a proposal.',
      inspiration:
        'Swift confirmed it began with a boy her parents did not approve of; she reached for the most famous forbidden-love story and rewrote its ending.',
      themes: ['forbidden love', 'fairy-tale rewrites', 'defiance'],
      easterEggs:
        "Love Story (Taylor's Version) was the first re-recorded song she ever released (February 2021) — the opening move of the whole Taylor's Version project.",
      sourceUrl: 'https://en.wikipedia.org/wiki/Love_Story_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Love Story (Taylor Swift song)',
          'Love_Story_(Taylor_Swift_song)',
          'song article: writing story and TV rollout',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'hey-stephen',
      trackNumber: 4,
      trackTitle: 'Hey Stephen',
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'The flirtiest track on Fearless, addressed by name to a real musician — Stephen Barker Liles of Love and Theft, who got a heads-up text from Taylor herself ("Hey, Track 4") while fans decoded the liner-note code.',
      summary:
        'A confession disguised as a serenade: she lists all the girls who might like the boy, then makes her own case with a wink.',
      inspiration:
        'Confirmed to be about Stephen Barker Liles of the band Love and Theft, who once opened for Swift; the hidden message in the booklet spelled out the giveaway.',
      themes: ['crushes', 'flirtation', 'shooting your shot'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Hey_Stephen',
      sources: [wiki('Hey Stephen', 'Hey_Stephen', 'song article: subject confirmation'), ALBUM],
    },
    {
      slug: 'white-horse',
      trackNumber: 5,
      trackTitle: 'White Horse',
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      isSingle: true,
      note: 'The anti-fairy tale — no prince, no rescue — which won her Grammys for Best Country Song and Best Female Country Vocal.',
      summary:
        'The moment after the apology when you realize the story is not a fairy tale: she leaves the small town and the boy who was never going to change.',
      inspiration:
        'Swift and Liz Rose wrote it as the disillusioned counterpart to Love Story; its early placement in a Grey’s Anatomy premiere was a milestone Swift celebrated publicly.',
      themes: ['disillusionment', 'self-rescue', 'leaving'],
      sourceUrl: 'https://en.wikipedia.org/wiki/White_Horse_(Taylor_Swift_song)',
      sources: [
        wiki(
          'White Horse (Taylor Swift song)',
          'White_Horse_(Taylor_Swift_song)',
          'song article: Grammy wins and background',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'you-belong-with-me',
      trackNumber: 6,
      trackTitle: 'You Belong with Me',
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      isSingle: true,
      note: 'Bleachers-versus-cheer-captain, the biggest pop crossover of the era — and the video whose VMA win triggered the most consequential interruption in award-show history.',
      summary:
        'The girl next door watches her crush waste his time on someone who does not get him; the whole song is her closing argument.',
      inspiration:
        'Sparked when Swift overheard a male friend on a defensive phone call with his girlfriend — she started riffing on being the easier person to love.',
      themes: ['unrequited love', 'girl-next-door underdog', 'longing'],
      easterEggs:
        'Its 2009 VMA Best Female Video win was the night of the Kanye West stage-crash — the fault line that later feeds Innocent, and eventually the reputation era.',
      sourceUrl: 'https://en.wikipedia.org/wiki/You_Belong_with_Me',
      sources: [
        wiki('You Belong with Me', 'You_Belong_with_Me', 'song article: origin and VMA history'),
        ALBUM,
      ],
    },
    {
      slug: 'breathe',
      trackNumber: 7,
      trackTitle: 'Breathe',
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift', 'Colbie Caillat'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'A duet with Colbie Caillat about the breakup nobody writes about — losing a friend, with no villain to blame.',
      summary:
        'A goodbye where no one did anything wrong: two people who simply cannot stay in each other’s lives, and the guilt of being the one who leaves.',
      inspiration:
        'Swift has described it as being about losing a close friendship rather than a romance — one of the album’s few non-boy heartbreaks.',
      themes: ['lost friendship', 'guilt', 'gentle goodbyes'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Breathe_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Breathe (Taylor Swift song)',
          'Breathe_(Taylor_Swift_song)',
          'song article: collaboration background',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'tell-me-why',
      trackNumber: 8,
      trackTitle: 'Tell Me Why',
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'Born from a venting session in Liz Rose’s writing room — Swift described the guy, Rose told her to say it in a song.',
      summary:
        'Frustration set to a stomp: a boy who runs hot and cold, and a narrator done guessing which version of him shows up today.',
      inspiration:
        'Swift recounted arriving at a session furious about a mixed-signals almost-relationship; the song is essentially that rant, structured.',
      themes: ['mixed signals', 'frustration', 'self-respect'],
      sourceUrl: 'https://taylorswiftswitzerland.jimdoweb.com/album-eras/fearless/the-songs/',
      sources: [
        {
          source_url: 'https://taylorswiftswitzerland.jimdoweb.com/album-eras/fearless/the-songs/',
          source_title: 'Fearless — The Songs',
          publisher: 'Taylor Swift Switzerland',
          source_type: 'fan_site',
          accessed_at: ACCESSED,
          reliability_score: 2,
          notes: "Swift's cut-by-cut commentary on the Liz Rose writing session",
        },
        ALBUM,
      ],
    },
    {
      slug: 'youre-not-sorry',
      trackNumber: 9,
      trackTitle: "You're Not Sorry",
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'The album’s darkest ballad — an apology refused, because the apologies were never real. A CSI episode later used a remixed version.',
      summary:
        'She stops accepting the same apology on repeat; the piano ballad is the sound of someone finally hanging up.',
      inspiration:
        'Swift said it was written about a boy who turned out to have secrets stacked on secrets; a remix soundtracked her 2009 CSI guest appearance.',
      themes: ['broken trust', 'boundaries', 'finality'],
      sourceUrl: "https://en.wikipedia.org/wiki/You're_Not_Sorry",
      sources: [
        wiki("You're Not Sorry", "You're_Not_Sorry", 'song article: background and CSI remix'),
        ALBUM,
      ],
    },
    {
      slug: 'the-way-i-loved-you',
      trackNumber: 10,
      trackTitle: 'The Way I Loved You',
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift', 'John Rich'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'Co-written with John Rich — the safe, polite boyfriend loses to the memory of a screaming-in-the-rain love.',
      summary:
        'A perfect-on-paper relationship that feels like nothing, held against a chaotic past love that felt like everything: the album’s case that intensity beats comfort.',
      inspiration:
        'Swift said she wanted to capture wanting the frustrating, passionate love while dating its calm opposite; Rich helped frame the two-boys contrast.',
      themes: ['passion versus comfort', 'nostalgia', 'self-sabotage'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Way_I_Loved_You',
      sources: [
        wiki('The Way I Loved You', 'The_Way_I_Loved_You', 'song article: co-writing background'),
        ALBUM,
      ],
    },
    {
      slug: 'forever-and-always',
      trackNumber: 11,
      trackTitle: 'Forever & Always',
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'Added to the album at the last possible minute after a very public, very short phone-call breakup — the piano version on Platinum twists the knife slower.',
      summary:
        'A promise of forever revoked in real time: she replays the moment someone’s feelings changed and demands to know where the person she knew went.',
      inspiration:
        'Confirmed to be about Joe Jonas — Swift said she added it late in production after the breakup, and famously described the 27-second phone call on Ellen.',
      themes: ['broken promises', 'whiplash heartbreak', 'anger'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Forever_%26_Always',
      sources: [
        wiki('Forever & Always', 'Forever_%26_Always', 'song article: late addition and subject'),
        ALBUM,
      ],
    },
    {
      slug: 'the-best-day',
      trackNumber: 12,
      trackTitle: 'The Best Day',
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'Written and recorded in secret as a gift for her mom, who first heard it set to home movies — still the go-to Swift Mother’s Day song.',
      summary:
        'A thank-you letter to her mother (with a verse for her dad and brother): the parent who drove her away from the mean girls and never said anything but kind words.',
      inspiration:
        'Confirmed: Swift wrote it for Andrea Swift and kept it secret until it was finished, premiering it with a home-video montage.',
      themes: ['family', 'gratitude', 'childhood memory'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Best_Day_(Taylor_Swift_song)',
      sources: [
        wiki(
          'The Best Day (Taylor Swift song)',
          'The_Best_Day_(Taylor_Swift_song)',
          'song article: family background',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'change',
      trackNumber: 13,
      trackTitle: 'Change',
      release: 'Fearless',
      releaseDate: '2008-11-11',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      isSingle: true,
      note: 'Written as an underdog anthem for her tiny label — released early as an AT&T Team USA song for the 2008 Beijing Olympics.',
      summary:
        'A fight song about believing the scrappy operation you belong to will win someday — the closing promise that these walls will come down.',
      inspiration:
        'Swift confirmed it was inspired by being on Big Machine, then a startup label competing against giants; its Olympics placement made it the album’s advance single.',
      themes: ['underdogs', 'perseverance', 'victory'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Change_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Change (Taylor Swift song)',
          'Change_(Taylor_Swift_song)',
          'song article: Big Machine and Olympics background',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'jump-then-fall',
      trackNumber: 14,
      trackTitle: 'Jump Then Fall',
      release: 'Fearless (Platinum Edition)',
      releaseDate: '2009-10-26',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'The sunniest of the Platinum Edition additions — all butterflies, no warnings.',
      summary:
        'An invitation to skip the cautious phase entirely: she promises to catch someone who is willing to fall first.',
      inspiration: null,
      themes: ['infatuation', 'trust', 'joy'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'untouchable',
      trackNumber: 15,
      trackTitle: 'Untouchable',
      release: 'Fearless (Platinum Edition)',
      releaseDate: '2009-10-26',
      writers: ['Cary Barlowe', 'Nathan Barlowe', 'Tommy Lee James', 'Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'The rare Swift cover: a Luna Halo rock song she rearranged so completely into a dreamy waltz that she earned a writing credit.',
      summary:
        'Longing for someone permanently out of reach, rendered as a starlit trance — distance as the whole romance.',
      inspiration:
        'Originally by the band Luna Halo; Swift’s radical rearrangement is the documented story here — her version bears little resemblance to the original.',
      themes: ['unattainable love', 'yearning', 'dream logic'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
      sources: [ALBUM, TV],
    },
    {
      slug: 'come-in-with-the-rain',
      trackNumber: 17,
      trackTitle: 'Come In with the Rain',
      release: 'Fearless (Platinum Edition)',
      releaseDate: '2009-10-26',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'A Platinum Edition slow-burner about leaving the window open for someone you have stopped chasing.',
      summary:
        'She is done fighting for someone’s attention but not done hoping — surrender that still leaves a door unlocked.',
      inspiration: null,
      themes: ['resignation', 'quiet hope', 'letting go'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'superstar',
      trackNumber: 18,
      trackTitle: 'Superstar',
      release: 'Fearless (Platinum Edition)',
      releaseDate: '2009-10-26',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'A fan-in-the-front-row daydream about loving someone famous — written before she became the superstar in everyone else’s version.',
      summary:
        'A crush on a rock star from the crowd: invisible to him by definition, devoted anyway — an inversion fans love given how her own fame turned out.',
      inspiration: null,
      themes: ['celebrity crushes', 'distance', 'daydreams'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'the-other-side-of-the-door',
      trackNumber: 19,
      trackTitle: 'The Other Side of the Door',
      release: 'Fearless (Platinum Edition)',
      releaseDate: '2009-10-26',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      note: 'The Platinum cut about saying leave when you mean stay — with a bridge that explodes exactly the way the argument did.',
      summary:
        'A post-fight standoff where pride says one thing and the heart means the opposite; she wants the grand gesture, not the silence.',
      inspiration: null,
      themes: ['stubbornness', 'push and pull', 'grand gestures'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Fearless_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'today-was-a-fairytale',
      trackNumber: 20,
      trackTitle: 'Today Was a Fairytale',
      release: "Valentine's Day soundtrack / Fearless (Taylor's Version)",
      releaseDate: '2010-01-19',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman', 'Taylor Swift'],
      singleReleaseDate: '2010-01-19',
      note: 'Cut for the Valentine’s Day movie (which she also acted in), it debuted at No. 2 on the Hot 100 — then finally joined the album family on Fearless (Taylor’s Version).',
      summary:
        'A perfect ordinary date replayed in storybook terms — the thesis that magic is a Tuesday afternoon with the right person.',
      inspiration:
        'Recorded for the 2010 film Valentine’s Day, in which Swift had a cameo; its Hot 100 debut set a then-record for her.',
      themes: ['storybook romance', 'living in the moment', 'giddiness'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Today_Was_a_Fairytale',
      sources: [
        wiki(
          'Today Was a Fairytale',
          'Today_Was_a_Fairytale',
          'song article: soundtrack origin and chart debut',
        ),
        TV,
      ],
    },
    {
      slug: 'you-all-over-me',
      trackNumber: 21,
      trackTitle: 'You All Over Me',
      release: "Fearless (Taylor's Version) — From The Vault",
      releaseDate: '2021-04-09',
      writers: ['Taylor Swift', 'Scooter Carusoe'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      isFromTheVault: true,
      isSingle: true,
      note: 'The first From The Vault song ever released — a 2008 castoff with Maren Morris harmonies, previewing the whole re-recording project.',
      summary:
        'Being clean but not new: a breakup leaves a residue no amount of moving on scrubs off. Wiser and wearier than anything that made the 2008 cut.',
      inspiration:
        'Written for the original Fearless and left off; released March 2021 with Maren Morris as the debut vault track.',
      themes: ['lingering heartbreak', 'memory', 'experience as scar tissue'],
      sourceUrl: 'https://en.wikipedia.org/wiki/You_All_Over_Me',
      sources: [
        wiki('You All Over Me', 'You_All_Over_Me', 'song article: vault release details'),
        TV,
      ],
    },
    {
      slug: 'mr-perfectly-fine',
      trackNumber: 22,
      trackTitle: 'Mr. Perfectly Fine',
      release: "Fearless (Taylor's Version) — From The Vault",
      releaseDate: '2021-04-09',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      isSingle: true,
      note: 'The vault’s sharpest 2008-era kiss-off — a boy who moved on suspiciously fast, skewered with the Mr.-titles gimmick.',
      summary:
        'A catalog of a casually cruel ex’s personas, from charming to checked-out — teenage Swift already perfecting the receipts-song format.',
      inspiration:
        'Written in the Fearless era and shelved until 2021; fans widely time-stamp it to the Joe Jonas breakup (unconfirmed), and Sophie Turner’s playful public endorsement of the song became part of its story.',
      themes: ['double standards in moving on', 'wit as armor', 'receipts'],
      fanLore:
        'Fan reading (unconfirmed): the Jonas-era timing; Turner posting the song with a wink is the documented moment fans cite.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Mr._Perfectly_Fine',
      sources: [
        wiki(
          'Mr. Perfectly Fine',
          'Mr._Perfectly_Fine',
          'song article: vault context and reception',
        ),
        TV,
      ],
    },
    {
      slug: 'we-were-happy',
      trackNumber: 23,
      trackTitle: 'We Were Happy',
      release: "Fearless (Taylor's Version) — From The Vault",
      releaseDate: '2021-04-09',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      isFromTheVault: true,
      note: 'A Liz Rose co-write from the vault that grieves the good version of a relationship — the happiness itself is what hurts to remember.',
      summary:
        'Instead of cataloging the ending, she catalogs the golden middle: farm fields, big plans, a love that worked right up until it did not.',
      inspiration: null,
      themes: ['grieving the good times', 'nostalgia', 'quiet loss'],
      sourceUrl: "https://en.wikipedia.org/wiki/Fearless_(Taylor's_Version)",
      sources: [TV],
    },
    {
      slug: 'thats-when',
      trackNumber: 24,
      trackTitle: "That's When",
      release: "Fearless (Taylor's Version) — From The Vault",
      releaseDate: '2021-04-09',
      writers: ['Taylor Swift', 'Brad Warren', 'Brett Warren'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      note: 'A conversation duet with Keith Urban — an apology and its answer, traded verse by verse.',
      summary:
        'Two people who asked for space negotiate the way back: he asks when he can return, she answers with every when she has.',
      inspiration:
        'Recorded with Keith Urban for the vault; Urban had been an opener on the Speak Now tour, closing an old loop.',
      themes: ['reconciliation', 'forgiveness', 'timing'],
      sourceUrl: "https://en.wikipedia.org/wiki/That's_When",
      sources: [wiki("That's When", "That's_When", 'song article: Urban collaboration'), TV],
    },
    {
      slug: 'dont-you',
      trackNumber: 25,
      trackTitle: "Don't You",
      release: "Fearless (Taylor's Version) — From The Vault",
      releaseDate: '2021-04-09',
      writers: ['Taylor Swift', 'Tommy Lee James'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      note: 'The dreamiest vault production — running into an ex who acts like nothing happened, and hating how well it works on you.',
      summary:
        'A chance encounter with someone who broke her heart, and the unfair chemistry that survives the breakup; she asks him not to smile at her like that.',
      inspiration: null,
      themes: ['unresolved feelings', 'chance encounters', 'self-protection'],
      sourceUrl: "https://en.wikipedia.org/wiki/Fearless_(Taylor's_Version)",
      sources: [TV],
    },
    {
      slug: 'bye-bye-baby',
      trackNumber: 26,
      trackTitle: 'Bye Bye Baby',
      release: "Fearless (Taylor's Version) — From The Vault",
      releaseDate: '2021-04-09',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      note: 'The vault’s closing exhale — a goodbye that is sadder than it is angry, ending the expanded Fearless on acceptance.',
      summary:
        'The relationship is over and nobody is screaming; she watches the whole future they planned drive away and lets it.',
      inspiration: null,
      themes: ['acceptance', 'goodbyes', 'what might have been'],
      sourceUrl: "https://en.wikipedia.org/wiki/Fearless_(Taylor's_Version)",
      sources: [TV],
    },
  ],
};
