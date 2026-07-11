// Vault track guide — Red era (Red 2012 / Taylor's Version 2021, including
// From The Vault). Original prose only — never lyrics; unconfirmed readings
// are labeled. Provenance per docs/content/content-audit-2026-07-08.md §5
// (URLs verified 2026-07-08).
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
  'Red (Taylor Swift album)',
  'Red_(Taylor_Swift_album)',
  'album article: release facts, credits, and cited interviews',
);
const TV = wiki(
  "Red (Taylor's Version)",
  "Red_(Taylor's_Version)",
  're-recording article: vault-track credits and release facts',
);

export default {
  eraSlug: 'red',
  tracks: [
    {
      slug: 'state-of-grace',
      trackNumber: 1,
      trackTitle: 'State of Grace',
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      singleReleaseDate: '2012-10-16',
      note: 'The U2-sized arena-rock opener — the sound of country Taylor kicking the door open on everything Red was about to become.',
      summary:
        'Love as a collision of two headstrong people: risky, ruinous, and worth it — the thesis statement the rest of the album stress-tests.',
      inspiration:
        'Swift described it as capturing the moment of meeting a love that would change her — deliberately sequenced first as the calm before the album’s storm.',
      themes: ['love as risk', 'new beginnings', 'intensity'],
      sourceUrl: 'https://en.wikipedia.org/wiki/State_of_Grace_(song)',
      sources: [
        wiki(
          'State of Grace (song)',
          'State_of_Grace_(song)',
          'song article: promo-single release and style',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'red',
      trackNumber: 2,
      trackTitle: 'Red',
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman', 'Dann Huff'],
      isSingle: true,
      note: 'The color-wheel title track: an entire relationship graded by hue, with red reserved for the parts that refuse to fade.',
      summary:
        'Loving him was primary-color intense, losing him was gray-blue; the song is a paint chart for a relationship that ran too hot to keep.',
      inspiration:
        'Swift explained the title concept on release: the album covers relationships defined by extreme, red emotions — this song is the legend for that map.',
      themes: ['emotional intensity', 'synesthetic memory', 'aftermath'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Red (Taylor Swift song)',
          'Red_(Taylor_Swift_song)',
          'song article: concept and single run',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'treacherous',
      trackNumber: 3,
      trackTitle: 'Treacherous',
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift', 'Dan Wilson'],
      producers: ['Dan Wilson'],
      note: 'The Dan Wilson co-write that whispers what the rest of Red shouts — wanting something you know is a bad idea, slowly.',
      summary:
        'Attraction on an unsafe road: she can see exactly where the slope leads and takes the first step anyway.',
      inspiration:
        'Written with Semisonic’s Dan Wilson, who has described building the song around the tension between gentleness and danger.',
      themes: ['temptation', 'knowing better', 'slow-burn desire'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Treacherous_(song)',
      sources: [
        wiki('Treacherous (song)', 'Treacherous_(song)', 'song article: co-writing background'),
        ALBUM,
      ],
    },
    {
      slug: 'i-knew-you-were-trouble',
      trackNumber: 4,
      trackTitle: 'I Knew You Were Trouble',
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      isSingle: true,
      note: 'The dubstep drop heard round Nashville — her first full Max Martin swerve, plus the screaming-goat meme that outlived the discourse.',
      summary:
        'Blame turned inward: the red flags were visible from the parking lot, and she walked in anyway. The bass drop is the floor giving out.',
      inspiration:
        'Swift said the song is about the shame of knowing at first sight exactly how it would end; the Martin/Shellback production made it her boldest pop move to date.',
      themes: ['self-blame', 'red flags', 'aftermath of bad choices'],
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Knew_You_Were_Trouble',
      sources: [
        wiki(
          'I Knew You Were Trouble',
          'I_Knew_You_Were_Trouble',
          'song article: production shift and reception',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'all-too-well',
      trackNumber: 5,
      trackTitle: 'All Too Well',
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'Never a single, always the masterpiece: born as a 10-plus-minute soundcheck ad-lib on the Speak Now tour, trimmed with Liz Rose, and canonized by fans as the best thing she has ever written.',
      summary:
        'A relationship reconstructed object by object — a scarf left at a sister’s house, an autumn upstate, a refrigerator-light dance — because remembering precisely is the only power left.',
      inspiration:
        'Swift confirmed it began as a long, improvised vent during tour rehearsals; Liz Rose was called in to help carve a song out of it. The muse is widely reported as Jake Gyllenhaal — never confirmed by Swift.',
      themes: ['memory as evidence', 'grief for a specific autumn', 'the scarf'],
      fanLore:
        'Fan reading (widely reported, unconfirmed): the Gyllenhaal attribution and the endlessly relitigated real-world scarf.',
      easterEggs:
        'Track 5 — the fan-observed emotional-centerpiece slot she later acknowledged as a real tradition.',
      sourceUrl: 'https://en.wikipedia.org/wiki/All_Too_Well',
      sources: [
        wiki('All Too Well', 'All_Too_Well', 'song article: origin story and legacy'),
        ALBUM,
      ],
    },
    {
      slug: '22',
      trackNumber: 6,
      trackTitle: '22',
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback'],
      singleReleaseDate: '2013-03-12',
      note: 'The birthday-party single that made an age into a brand — and later, the Eras Tour’s nightly hat-giveaway ritual.',
      summary:
        'Being 22 as a mood: dressed up like hipsters, ditching the heartbreak for one night, happy-free-confused in exactly that order.',
      inspiration:
        'Swift tied it to the specific joy of her early-twenties friend group — the rare Red song about friends, not the relationship.',
      themes: ['friendship', 'youth', 'joy as defiance'],
      easterEggs:
        'On the Eras Tour, the 22 hat handed to a young fan each night became one of the tour’s signature traditions.',
      sourceUrl: 'https://en.wikipedia.org/wiki/22_(Taylor_Swift_song)',
      sources: [
        wiki('22 (Taylor Swift song)', '22_(Taylor_Swift_song)', 'song article: single history'),
        ALBUM,
      ],
    },
    {
      slug: 'i-almost-do',
      trackNumber: 7,
      trackTitle: 'I Almost Do',
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'The letter she never sends — Swift has said writing this song was how she avoided actually calling.',
      summary:
        'Hovering over the call button after a breakup: every reason to reach out, met by the one reason not to. The song exists so the phone call did not have to.',
      inspiration:
        'Swift said writing it was her way of resisting the urge to reconnect — the song replaced the conversation.',
      themes: ['restraint', 'almosts', 'post-breakup gravity'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'we-are-never-ever-getting-back-together',
      trackNumber: 8,
      trackTitle: 'We Are Never Ever Getting Back Together',
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Max Martin', 'Shellback', 'Taylor Swift'],
      singleReleaseDate: '2012-08-13',
      note: 'Her first Hot 100 No. 1 — written in roughly 25 minutes after a friend of an ex walked into the studio and the on-off drama wrote itself.',
      summary:
        'A breakup declared with a flounce and an eye-roll, indie-record condescension included — the never-ever is doing gleeful, spiteful work.',
      inspiration:
        'Confirmed studio lore: an associate of an ex interrupted the session, Swift vented about the never-quite-over relationship, and Martin and Shellback turned the rant into the hook on the spot.',
      themes: ['on-again-off-again fatigue', 'liberation', 'playful spite'],
      sourceUrl: 'https://en.wikipedia.org/wiki/We_Are_Never_Ever_Getting_Back_Together',
      sources: [
        wiki(
          'We Are Never Ever Getting Back Together',
          'We_Are_Never_Ever_Getting_Back_Together',
          'song article: writing story and chart record',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'stay-stay-stay',
      trackNumber: 9,
      trackTitle: 'Stay Stay Stay',
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'The album’s screen-door palate cleanser — a fight that ends in laughter instead of a bridge full of tears.',
      summary:
        'Domestic comedy about a couple who argue and stay: she throws a phone, he shows up with a football helmet, and staying becomes the punchline and the point.',
      inspiration:
        'Swift called it an idealized sketch of the kind of easygoing love she had observed rather than lived — deliberately placed after the album’s heaviest stretch.',
      themes: ['staying', 'humor in love', 'domestic warmth'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'the-last-time',
      trackNumber: 10,
      trackTitle: 'The Last Time',
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift', 'Gary Lightbody', 'Jacknife Lee'],
      producers: ['Jacknife Lee'],
      isSingle: true,
      note: 'The Snow Patrol summit: Gary Lightbody duets on two exhausted people meeting at the same doorway one more time.',
      summary:
        'A dual-perspective standoff — his side pleading for one more chance, hers worn down from giving them — sung simultaneously because neither is listening.',
      inspiration:
        'Written with Lightbody and Jacknife Lee; Swift described wanting a duet where both parties talk past each other on purpose.',
      themes: ['last chances', 'exhaustion', 'two sides of one door'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Last_Time_(Taylor_Swift_song)',
      sources: [
        wiki(
          'The Last Time (Taylor Swift song)',
          'The_Last_Time_(Taylor_Swift_song)',
          'song article: collaboration details',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'holy-ground',
      trackNumber: 11,
      trackTitle: 'Holy Ground',
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Jeff Bhasker'],
      note: 'The drum-driven sprint where a past relationship finally gets remembered fondly — grace instead of a grudge.',
      summary:
        'Years later, the anger burns off and what is left is gratitude: the time was good, the dancing happened, the ground it stood on gets consecrated.',
      inspiration:
        'Swift said it came from realizing she could look back at a long-ended relationship and feel thankful rather than bitter.',
      themes: ['retrospective grace', 'gratitude', 'making peace with the past'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Holy_Ground_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Holy Ground (Taylor Swift song)',
          'Holy_Ground_(Taylor_Swift_song)',
          'song article: background',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'sad-beautiful-tragic',
      trackNumber: 12,
      trackTitle: 'Sad Beautiful Tragic',
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'Written on the tour bus in one sitting — a waltz-time eulogy she has said she wanted to feel like the fog of remembering.',
      summary:
        'A relationship viewed from the far shore: no blame left, just the three adjectives of the title taking turns.',
      inspiration:
        'Swift confirmed she wrote it alone on her tour bus, chasing the hazy mood of a memory rather than the events themselves.',
      themes: ['mourning', 'haze of memory', 'acceptance'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'the-lucky-one',
      trackNumber: 13,
      trackTitle: 'The Lucky One',
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Jeff Bhasker'],
      note: 'Her fame-parable about the star who took the money and vanished — written by someone quietly wondering if she would ever want the same exit.',
      summary:
        'A golden-age starlet chooses a rose garden over Madison Square Garden; the narrator, now famous herself, starts to suspect the runaway was the lucky one.',
      inspiration:
        'Swift said it was inspired by artists who walked away from fame at their peak; fans map it onto figures like Joni Mitchell (unconfirmed specifics).',
      themes: ['cost of fame', 'escape', 'foreshadowing'],
      fanLore:
        'Fan reading (unconfirmed): Joni Mitchell as the model — Mitchell was separately attached to a shelved biopic Swift was once linked to.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'everything-has-changed',
      trackNumber: 14,
      trackTitle: 'Everything Has Changed',
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift', 'Ed Sheeran'],
      producers: ['Butch Walker'],
      isSingle: true,
      note: 'Written with Ed Sheeran on a trampoline in her backyard — an early session in what became pop’s most durable friendship.',
      summary:
        'The first-meeting butterflies duet: two people who just met and already divide time into before and after.',
      inspiration:
        'Confirmed origin: Swift and Sheeran wrote it bouncing on her trampoline in early 2012, then cut it with Butch Walker; Sheeran opened the Red Tour the next year.',
      themes: ['new love', 'friendship origin story', 'beginnings'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Everything_Has_Changed',
      sources: [
        wiki(
          'Everything Has Changed',
          'Everything_Has_Changed',
          'song article: trampoline writing session',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'starlight',
      trackNumber: 15,
      trackTitle: 'Starlight',
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman', 'Dann Huff'],
      note: 'Sparked by a single old photograph of Ethel and Bobby Kennedy dancing as teenagers in 1945 — historical fan-fiction, Swift style.',
      summary:
        'She invents the whole night around one snapshot: two seventeen-year-olds crashing a yacht-club party, the future unwritten and gleaming.',
      inspiration:
        'Confirmed: Swift wrote it after seeing a vintage photo of young Ethel and Robert F. Kennedy; Ethel Kennedy attended a screening of the video era with her.',
      themes: ['imagined history', 'youthful glamour', 'possibility'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Starlight_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Starlight (Taylor Swift song)',
          'Starlight_(Taylor_Swift_song)',
          'song article: Kennedy photo origin',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'begin-again',
      trackNumber: 16,
      trackTitle: 'Begin Again',
      release: 'Red',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman', 'Dann Huff'],
      singleReleaseDate: '2012-10-01',
      note: 'The gentle country closer released as the second single — a Wednesday-café first date that quietly reboots her belief in the whole enterprise.',
      summary:
        'After months of bracing for criticism that never comes, she notices she is laughing on a first date — and that heartbreak did not get the last word.',
      inspiration:
        'Swift described it as the moment of realizing a past relationship’s scorn was not the universal condition of love.',
      themes: ['healing', 'first dates after heartbreak', 'renewal'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Begin_Again_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Begin Again (Taylor Swift song)',
          'Begin_Again_(Taylor_Swift_song)',
          'song article: single release',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'the-moment-i-knew',
      trackNumber: 17,
      trackTitle: 'The Moment I Knew',
      release: 'Red (Deluxe Edition)',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'The deluxe cut about the birthday party where the one person who mattered never walked in.',
      summary:
        'Standing in a party dress watching the door: the relationship ends not with a fight but with an empty doorway at her own birthday.',
      inspiration:
        'Widely tied by fans to her 21st birthday and the Gyllenhaal chapter (unconfirmed by Swift); the party scenario is the song’s own explicit frame.',
      themes: ['disappointment', 'the no-show', 'endings you watch happen'],
      fanLore:
        'Fan reading (unconfirmed): the 21st-birthday timeline fans cross-reference with All Too Well.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'come-back-be-here',
      trackNumber: 18,
      trackTitle: 'Come Back... Be Here',
      release: 'Red (Deluxe Edition)',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift', 'Dan Wilson'],
      producers: ['Dan Wilson'],
      note: 'The long-distance lament from the deluxe edition — New York to London measured in time zones and second-guessing.',
      summary:
        'One perfect weekend, then an ocean: she resents geography itself for interrupting something that had barely started.',
      inspiration: null,
      themes: ['long distance', 'bad timing', 'longing'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      sources: [ALBUM],
    },
    {
      slug: 'girl-at-home',
      trackNumber: 19,
      trackTitle: 'Girl at Home',
      release: 'Red (Deluxe Edition)',
      releaseDate: '2012-10-22',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Nathan Chapman'],
      note: 'The deluxe track that turns down a taken man on principle — later given a full synth-pop makeover on Taylor’s Version.',
      summary:
        'A flirtatious guy with a girlfriend gets shut down out of solidarity: it is not about jealousy, it is about the girl at home.',
      inspiration: null,
      themes: ['loyalty between women', 'principles', 'rejection as ethics'],
      easterEggs:
        'The 2021 re-record (produced by Elvira Anderfjärd) reinvented it as glittering synth-pop — the most changed arrangement on Red TV.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Red_(Taylor_Swift_album)',
      sources: [ALBUM, TV],
    },
    {
      slug: 'ronan',
      trackNumber: 21,
      trackTitle: 'Ronan',
      release: "Charity single / Red (Taylor's Version)",
      releaseDate: '2012-09-08',
      writers: ['Taylor Swift', 'Maya Thompson'],
      producers: ['Taylor Swift', 'Christopher Rowe'],
      singleReleaseDate: '2012-09-08',
      note: 'The charity single built from a grieving mother’s blog — Maya Thompson shares the writing credit, and every profit went to cancer research.',
      summary:
        'A eulogy for Ronan Thompson, who died of neuroblastoma just before turning four, written in his mother’s words and voice — Swift performing it once at Stand Up to Cancer remains one of her heaviest moments.',
      inspiration:
        'Confirmed: composed from phrases in Maya Thompson’s blog about her son; Thompson is credited as co-writer and approved its Red TV inclusion.',
      themes: ['grief', 'a mother’s love', 'memorial'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Ronan_(song)',
      sources: [
        wiki('Ronan (song)', 'Ronan_(song)', 'song article: charity origin and credit'),
        TV,
      ],
    },
    {
      slug: 'better-man',
      trackNumber: 22,
      trackTitle: 'Better Man',
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      isFromTheVault: true,
      note: 'Written for Red, shelved, then gifted to Little Big Town in 2016 — where it won CMA Song of the Year before her own version surfaced in the vault.',
      summary:
        'Missing someone and refusing to apologize for leaving: the love was real, but so was the pattern — she just wishes he had been a better man.',
      inspiration:
        'Confirmed history: cut from the original Red, recorded by Little Big Town in 2016 (CMA Song of the Year), reclaimed by Swift on Red TV.',
      themes: ['leaving well', 'grief without regret', 'what he could have been'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Better_Man_(Little_Big_Town_song)',
      sources: [
        wiki(
          'Better Man (Little Big Town song)',
          'Better_Man_(Little_Big_Town_song)',
          'song article: Swift authorship and awards',
        ),
        TV,
      ],
    },
    {
      slug: 'nothing-new',
      trackNumber: 23,
      trackTitle: 'Nothing New',
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Aaron Dessner', 'Tony Berg'],
      isFromTheVault: true,
      note: 'Written at 22 about the industry’s expiration date for young women — released at 31 as a duet with Phoebe Bridgers, the next generation answering back.',
      summary:
        'The fear of being novelty: what happens when a newer, shinier girl arrives and everyone stops clapping. Giving the second verse to Bridgers turned a private anxiety into a generational relay.',
      inspiration:
        'Confirmed: a 2012 composition about the churn of it-girls, unreleased until Red TV; Bridgers has called being asked her career’s pinch-me moment.',
      themes: ['aging in public', 'industry churn', 'women replacing women by design'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Nothing_New_(song)',
      sources: [
        wiki('Nothing New (song)', 'Nothing_New_(song)', 'song article: Bridgers duet background'),
        TV,
      ],
    },
    {
      slug: 'babe',
      trackNumber: 24,
      trackTitle: 'Babe',
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift', 'Patrick Monahan'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      note: 'Co-written with Train’s Pat Monahan for Red, handed to Sugarland in 2018 (with Swift guesting), and finally sung solo in the vault.',
      summary:
        'The last straw song: one act of betrayal detonates the whole future tense — every plan they made now needs a new pronoun.',
      inspiration:
        'Confirmed provenance: written in the Red sessions with Monahan; Sugarland released it as a single in 2018 with Swift featured before her own cut arrived on Red TV.',
      themes: ['betrayal', 'the point of no return', 'canceled futures'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Babe_(Sugarland_song)',
      sources: [
        wiki(
          'Babe (Sugarland song)',
          'Babe_(Sugarland_song)',
          'song article: writing and release history',
        ),
        TV,
      ],
    },
    {
      slug: 'message-in-a-bottle',
      trackNumber: 25,
      trackTitle: 'Message in a Bottle',
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift', 'Max Martin', 'Shellback'],
      producers: ['Elvira Anderfjärd', 'Shellback'],
      isFromTheVault: true,
      note: 'The first song she ever wrote with Max Martin and Shellback — the vault reveal that the 1989 pivot was already loaded in 2012.',
      summary:
        'A crush lobbed into the void like a corked note into the sea: pure fizzy hope that the message finds its way to the right person.',
      inspiration:
        'Confirmed as the trio’s first-ever collaboration from the Red sessions — the historical footnote is the headline here.',
      themes: ['hope', 'long-shot love', 'pop origins'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Message_in_a_Bottle_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Message in a Bottle (Taylor Swift song)',
          'Message_in_a_Bottle_(Taylor_Swift_song)',
          'song article: first Martin/Shellback co-write',
        ),
        TV,
      ],
    },
    {
      slug: 'i-bet-you-think-about-me',
      trackNumber: 26,
      trackTitle: 'I Bet You Think About Me',
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift', 'Lori McKenna'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      isFromTheVault: true,
      isSingle: true,
      note: 'The harmonica-laced class-warfare kiss-off with Chris Stapleton — and a wedding-crasher video directed by Blake Lively.',
      summary:
        'A small-town girl toasts the rich ex at his own imaginary wedding: his organic-shoes world never fit her, but she bets she still haunts it.',
      inspiration:
        'Written with Lori McKenna in the Red era; the 2021 video (Lively’s directing debut for Swift) staged the revenge-at-the-wedding fantasy with red-velvet cake.',
      themes: ['class contrast', 'haunting an ex', 'country wit'],
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Bet_You_Think_About_Me',
      sources: [
        wiki(
          'I Bet You Think About Me',
          'I_Bet_You_Think_About_Me',
          'song article: Stapleton feature and Lively video',
        ),
        TV,
      ],
    },
    {
      slug: 'forever-winter',
      trackNumber: 27,
      trackTitle: 'Forever Winter',
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift', 'Mark Foster'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      note: 'The vault’s heaviest subject handled with horns — loving someone through a mental-health crisis and being terrified of losing them.',
      summary:
        'She circles a person in crisis, wishing she had understood sooner and promising to stay on the line — fans embraced it as one of her few songs explicitly about a loved one’s struggle.',
      inspiration:
        'Co-written with Foster the People’s Mark Foster during the Red era, per the TV credits.',
      themes: ['loving someone in crisis', 'helplessness', 'showing up'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Forever_Winter',
      sources: [wiki('Forever Winter', 'Forever_Winter', 'song article: vault credits'), TV],
    },
    {
      slug: 'run',
      trackNumber: 28,
      trackTitle: 'Run',
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift', 'Ed Sheeran'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      isFromTheVault: true,
      note: 'The other trampoline-era Sheeran co-write — written the very first day they met, and kept in a drawer for nine years.',
      summary:
        'An elopement fantasy in hushed harmony: two people ditching everyone’s expectations with a getaway car and a head start.',
      inspiration:
        'Confirmed: Swift and Sheeran wrote it the first day they worked together in 2012, before Everything Has Changed; it stayed unreleased until Red TV.',
      themes: ['escape', 'secret love', 'creative kinship'],
      sourceUrl: "https://en.wikipedia.org/wiki/Red_(Taylor's_Version)",
      sources: [TV],
    },
    {
      slug: 'the-very-first-night',
      trackNumber: 29,
      trackTitle: 'The Very First Night',
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift', 'Amund Bjørklund', 'Espen Lind'],
      producers: ['Espionage', 'Taylor Swift', 'Christopher Rowe'],
      isFromTheVault: true,
      note: 'The vault’s brightest bop — dancing back to the beginning of a relationship the world never got to see.',
      summary:
        'Grief disguised as a party track: she misses the private, pre-cameras version of a love, back when it was only theirs.',
      inspiration:
        'Written with the Norwegian duo Espionage during the Red sessions, per the TV credits.',
      themes: ['private joy', 'nostalgia', 'before it went wrong'],
      sourceUrl: "https://en.wikipedia.org/wiki/Red_(Taylor's_Version)",
      sources: [TV],
    },
    {
      slug: 'all-too-well-10-minute-version',
      trackNumber: 30,
      trackTitle: 'All Too Well (10 Minute Version)',
      release: "Red (Taylor's Version) — From The Vault",
      releaseDate: '2021-11-12',
      writers: ['Taylor Swift', 'Liz Rose'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      isSingle: true,
      note: 'The original uncut draft, restored after nine years of fan lobbying — it became the longest song ever to hit No. 1 on the Hot 100, with a Sadie Sink short film to match.',
      summary:
        'Every excised verse returned: the ages, the keys thrown, the twin-flame speech — plus the short film (Sink and Dylan O’Brien) that Swift wrote and directed, which won video-of-the-year trophies and made the scarf mythology canon.',
      inspiration:
        'Confirmed: this is the full-length version from the original 2011 writing sessions; fan demand for the mythical 10-minute cut is the documented reason it exists in public.',
      themes: ['the director’s cut of heartbreak', 'age-gap retrospect', 'fan-willed history'],
      easterEggs:
        'The short film’s title cards and autumn palette seeded Easter eggs fans later connected forward to Midnights and TTPD imagery.',
      sourceUrl: 'https://en.wikipedia.org/wiki/All_Too_Well',
      sources: [
        wiki('All Too Well', 'All_Too_Well', 'song article: 10-minute version and short film'),
        TV,
      ],
    },
  ],
};
