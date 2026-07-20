// Vault track guide — debut era (Taylor Swift, 2006).
// One record per canonical song. Summaries, themes, and readings are ORIGINAL
// prose in our own words — never lyrics. Anything not publicly confirmed is
// labeled a fan reading. Sources follow the provenance format in
// docs/content/content-audit-2026-07-08.md §5 (all URLs verified 2026-07-08).
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
  'Taylor Swift (album)',
  'Taylor_Swift_(album)',
  'album article: release facts, credits, and cited interviews',
);

export default {
  eraSlug: 'debut',
  tracks: [
    {
      slug: 'tim-mcgraw',
      trackNumber: 1,
      trackTitle: 'Tim McGraw',
      youtubeId: 'GkD20ajVxnY', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman'],
      singleReleaseDate: '2006-06-19',
      note: 'The debut single, drafted in ninth-grade math class — a goodbye to a senior boyfriend heading to college, banking on a Tim McGraw song to keep her in his memory.',
      summary:
        'A girl asks to be remembered through the soundtrack of a first love: when her favorite country star comes on, she hopes her ex thinks of her.',
      inspiration:
        'Swift has said she wrote it in math class about Brett, a senior boyfriend about to leave for college, then finished it with Liz Rose after school.',
      themes: ['first love', 'memory and nostalgia', 'small-town summer'],
      easterEggs:
        'Her early liner notes hid capitalized-letter messages per song — the codes that trained fans to hunt for Easter eggs in everything since.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Tim_McGraw_(song)',
      sources: [
        wiki(
          'Tim McGraw (song)',
          'Tim_McGraw_(song)',
          'song article: origin story and release facts',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'picture-to-burn',
      trackNumber: 2,
      trackTitle: 'Picture to Burn',
      youtubeId: 'yCMqcFAigRg', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman'],
      isSingle: true,
      note: 'The bratty banjo kiss-off — a high-school ex gets his photo torched. A softened lyric on later edits became an early lesson in Swift-lyric archaeology.',
      summary:
        'A scorched-earth breakup romp: petty, funny, and fully aware of it, burning every reminder of a boy who never let her drive his truck.',
      inspiration:
        'Swift described it as being about a self-absorbed high-school ex — the anger phase of a teenage breakup, played for laughs.',
      themes: ['teenage anger', 'revenge as comedy', 'moving on'],
      easterEggs:
        'The original album line about telling everyone the ex is gay was rewritten for the radio single — a documented early edit fans still catalog.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Picture_to_Burn',
      sources: [
        wiki('Picture to Burn', 'Picture_to_Burn', 'song article: lyric edit and single history'),
        ALBUM,
      ],
    },
    {
      slug: 'teardrops-on-my-guitar',
      trackNumber: 3,
      trackTitle: 'Teardrops on My Guitar',
      youtubeId: 'xKCek6_dB0M', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman'],
      isSingle: true,
      note: 'The unrequited-crush ballad that named the real boy — Drew from her high school — and crossed her over to pop radio for the first time.',
      summary:
        'She is the shoulder a boy leans on while he gushes about another girl; the song sits in the ache of smiling through it.',
      inspiration:
        'Confirmed to be about classmate Drew Hardwick, whom Swift named publicly; he reportedly had no idea until the song was on the radio.',
      themes: ['unrequited love', 'hiding feelings', 'high-school heartache'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Teardrops_on_My_Guitar',
      sources: [
        wiki(
          'Teardrops on My Guitar',
          'Teardrops_on_My_Guitar',
          'song article: subject and chart history',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'a-place-in-this-world',
      trackNumber: 4,
      trackTitle: 'A Place in This World',
      youtubeId: '_FNQ5qLuLjA', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Robert Ellis Orrall', 'Angelo Petraglia'],
      producers: ['Nathan Chapman'],
      note: 'Written at 13, while shuttling between Pennsylvania and Nashville trying to break in — a kid narrating the exact uncertainty she was living.',
      summary:
        'A wide-eyed mission statement: alone in a new town, unsure of the path, but certain there is one and determined to walk it.',
      inspiration:
        'Swift has said it captures how she felt as a new arrival in Nashville, still trying to figure out where she fit.',
      themes: ['ambition', 'self-discovery', 'small fish, big pond'],
      sourceUrl: 'https://en.wikipedia.org/wiki/A_Place_in_This_World',
      sources: [
        wiki('A Place in This World', 'A_Place_in_This_World', 'song article: writing background'),
        ALBUM,
      ],
    },
    {
      slug: 'cold-as-you',
      trackNumber: 5,
      trackTitle: 'Cold as You',
      youtubeId: 'aGvIwzgJ9hU', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman'],
      note: 'The debut deep cut Swifties hold up as proof the pen was already sharp — a slow, surgical takedown of an emotionally unavailable boy.',
      summary:
        'A post-mortem on a one-sided relationship with someone who gives nothing back; the closing line lands like a door slamming.',
      inspiration: null,
      themes: ['emotional neglect', 'disillusionment', 'quiet fury'],
      fanLore:
        'Fan reading: often ranked by fans among the best-written debut tracks — a favorite pick for early evidence of her bridge-writing instincts.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'the-outside',
      trackNumber: 6,
      trackTitle: 'The Outside',
      youtubeId: 'IAeicVet6SU', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift'],
      producers: ['Robert Ellis Orrall', 'Nathan Chapman'],
      note: 'One of the first songs she ever wrote — age 12, about the middle-school years when nobody saved her a seat.',
      summary:
        'A kid looking in at the friend groups that shut her out, choosing to write about the loneliness instead of pretending it away.',
      inspiration:
        'Swift has repeatedly said she wrote it at 12 about being excluded at school — songwriting itself was the coping mechanism.',
      themes: ['outsiderness', 'loneliness', 'writing as survival'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'tied-together-with-a-smile',
      trackNumber: 7,
      trackTitle: 'Tied Together with a Smile',
      youtubeId: 'aCVHGH5sO0c', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman'],
      note: 'Written the day she learned a friend was struggling with an eating disorder — the debut album at its most tender.',
      summary:
        'A letter to a beautiful friend who is quietly falling apart, about how the girls who seem to have it all can be the ones barely holding on.',
      inspiration:
        'Swift confirmed she wrote it about a close friend battling bulimia, starting it the same day she found out.',
      themes: ['friendship', 'hidden pain', 'beauty-standard pressure'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'stay-beautiful',
      trackNumber: 8,
      trackTitle: 'Stay Beautiful',
      youtubeId: 'TQ9haUkCV-M', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Nathan Chapman'],
      note: 'A daydream about a boy named Cory — admiring from a distance and wishing him well whether or not the story ever starts.',
      summary:
        'Affection without possession: she catalogs what makes a boy shine and leaves the door open rather than forcing an ending.',
      inspiration:
        'Swift said in early album commentary it was written about a boy named Cory she admired mostly from afar.',
      themes: ['crushes', 'admiration', 'open endings'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'shouldve-said-no',
      trackNumber: 9,
      trackTitle: "Should've Said No",
      youtubeId: 'v9bxXO9fj98', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman'],
      isSingle: true,
      note: 'The last-minute solo write about a cheating ex that became a stadium moment — capped by the drenched waterfall performance at the 2008 ACMs.',
      summary:
        'A betrayed girl puts the blame exactly where it belongs: cheating was a choice, and the consequence is the song everyone now sings back at him.',
      inspiration:
        'Written solo about an ex who cheated; the hidden liner-note message famously spelled out his first name, Sam.',
      themes: ['betrayal', 'accountability', 'public reckoning'],
      easterEggs:
        "The album booklet's hidden capital letters for this track spelled SAM — the liner-note code fans decoded on day one.",
      sourceUrl: "https://en.wikipedia.org/wiki/Should've_Said_No",
      sources: [
        wiki(
          "Should've Said No",
          "Should've_Said_No",
          'song article: writing and performance history',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'marys-song-oh-my-my-my',
      trackNumber: 10,
      trackTitle: "Mary's Song (Oh My My My)",
      youtubeId: '9TCRiGA1A2U', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Liz Rose', 'Brian Maher'],
      producers: ['Nathan Chapman'],
      note: 'A whole lifetime in three verses — inspired by the elderly couple next door telling the story of how they fell in love as kids.',
      summary:
        'A love story that ages from seven to eighty-seven, tracing a couple from backyard dares to a porch-swing forever.',
      inspiration:
        'Swift confirmed the song was inspired by her real next-door neighbors, a couple who shared their decades-long love story over dinner.',
      themes: ['lifelong love', 'small-town roots', 'growing old together'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'our-song',
      trackNumber: 11,
      trackTitle: 'Our Song',
      youtubeId: 'Jb2stN7kH28', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift'],
      producers: ['Nathan Chapman'],
      isSingle: true,
      note: 'Written for her ninth-grade talent show, saved from the scrap pile by classmates who kept singing it — then it made her the youngest solo writer of a country No. 1.',
      summary:
        'A couple with no official song decides everything already is one: screen doors, late calls, and sneaking back in slow.',
      inspiration:
        'Swift wrote it alone for a high-school talent show; classmates remembering the hook months later convinced her it belonged on the album.',
      themes: ['young love', 'everyday romance', 'making your own soundtrack'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Our_Song',
      sources: [
        wiki('Our Song', 'Our_Song', 'song article: talent-show origin and chart record'),
        ALBUM,
      ],
    },
    {
      slug: 'im-only-me-when-im-with-you',
      trackNumber: 12,
      trackTitle: "I'm Only Me When I'm with You",
      youtubeId: 'AlTfYj7q5gQ', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift (Deluxe Edition)',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Robert Ellis Orrall', 'Angelo Petraglia'],
      producers: ['Robert Ellis Orrall', 'Angelo Petraglia'],
      note: 'The fiddle-stomping deluxe cut about the people who get to see the unedited version of you.',
      summary:
        'A tribute to the friends and family around whom she never has to perform — the deluxe track fans read as being as much about her best friend as any boy.',
      inspiration: null,
      themes: ['authenticity', 'friendship', 'belonging'],
      fanLore:
        'Fan reading: the home-video-style music video starred her real childhood best friend Abigail, cementing the friendship interpretation.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'invisible',
      trackNumber: 13,
      trackTitle: 'Invisible',
      youtubeId: 'IiWI7qG8Jpc', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift (Deluxe Edition)',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Robert Ellis Orrall'],
      producers: ['Robert Ellis Orrall'],
      note: 'The quiet deluxe-edition companion to Teardrops on My Guitar — same wallflower ache, softer light.',
      summary:
        'Watching a boy chase a girl who barely notices him, while she waits unseen — a study in being overlooked by someone you actually see clearly.',
      inspiration: null,
      themes: ['invisibility', 'unrequited love', 'longing'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      sources: [ALBUM],
    },
    {
      slug: 'a-perfectly-good-heart',
      trackNumber: 14,
      trackTitle: 'A Perfectly Good Heart',
      youtubeId: 'mbs84V9S5Lc', // oEmbed-verified official Taylor Swift channel
      release: 'Taylor Swift (Deluxe Edition)',
      releaseDate: '2006-10-24',
      writers: ['Taylor Swift', 'Brett James', 'Troy Verges'],
      producers: ['Brett James', 'Troy Verges'],
      note: 'The deluxe closer asking the debut album’s simplest question: why break something that was working fine?',
      summary:
        'First heartbreak rendered as bewilderment — no revenge, no comeback, just the raw question of why someone would wound a heart offered in good faith.',
      inspiration: null,
      themes: ['first heartbreak', 'innocence lost', 'confusion'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Taylor_Swift_(album)',
      sources: [ALBUM],
    },
  ],
};
