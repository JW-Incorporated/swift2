// Vault track guide — The Tortured Poets Department era (TTPD 2024 + The
// Anthology, surprise-dropped at 2 a.m. the same night). Original prose only —
// never lyrics; unconfirmed muse readings are labeled (this era is almost
// entirely fan-attributed and Swift has named no one). Provenance per
// docs/content/content-audit-2026-07-08.md §5 (URLs verified 2026-07-08).
import DOSSIERS from './tortured-poets.dossiers.mjs';

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
  'The Tortured Poets Department',
  'The_Tortured_Poets_Department',
  'album article: release facts, credits, and cited interviews',
);

const TRACKS = [
    {
      slug: 'fortnight',
      trackNumber: 1,
      trackTitle: 'Fortnight',
      youtubeId: 'q3zqJs7JUCQ', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff', 'Post Malone'],
      producers: ['Taylor Swift', 'Jack Antonoff', 'Louis Bell'],
      singleReleaseDate: '2024-04-19',
      note: 'The Post Malone lead single — suburban dystopia, a two-week love with permanent damage, and a typewriter-filled video cameoing Dead Poets Society alumni.',
      summary:
        'A medicated narrator next door to the one that got away: a fortnight of feeling everything, then lawns and small talk forever. The Ethan Hawke and Josh Charles video cameos made the tortured-poet joke text.',
      inspiration:
        'Swift called it an ode to a brief, ruinous love and picked it as the album’s thesis single; it debuted at Hot 100 No. 1.',
      themes: ['brief love, long damage', 'suburban numbness', 'what-ifs'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Fortnight_(song)',
      sources: [
        wiki('Fortnight (song)', 'Fortnight_(song)', 'song article: single release and video'),
        ALBUM,
        {
          source_url:
            'https://www.billboard.com/lists/taylor-swift-post-malone-fortnight-number-one-hot-100-second-week/',
          source_title:
            "Taylor Swift & Post Malone's 'Fortnight' Spends a Second Week at No. 1 on Billboard Hot 100",
          publisher: 'Billboard',
          source_type: 'chart_database',
          accessed_at: '2026-07-21',
          reliability_score: 4,
        },
        {
          source_url:
            'https://www.hollywoodreporter.com/music/music-news/taylor-swift-video-of-year-win-breaks-records-2024-mtv-vmas-1235997409/',
          source_title: 'Taylor Swift Wins Video of the Year at 2024 MTV VMAs, Breaking Multiple Records',
          publisher: 'The Hollywood Reporter',
          source_type: 'reputable_press',
          accessed_at: '2026-07-21',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'the-tortured-poets-department',
      trackNumber: 2,
      trackTitle: 'The Tortured Poets Department',
      youtubeId: 'RQMz4JDbtmI', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The title track — a spare Antonoff production that name-checks Dylan Thomas, Patti Smith, Lucy Dacus and, most memed of all, Charlie Puth — gently deflates its own poet mythology.',
      summary:
        'A relationship between two people addicted to their own melodrama: she punctures the artist mythos even while cataloging it. Never released as a single, it still peaked at No. 4 on the Billboard Hot 100 during the album’s top-14 takeover, and its "Charlie Puth should be a bigger artist" couplet became the record’s most-quoted line.',
      inspiration:
        'Dylan Thomas and Patti Smith are named in the lyric to set the couple against the Chelsea Hotel’s romantic-artist legends. Two days after release, Smith posted photos of herself reading Thomas and wrote she "was moved to be mentioned in the company of the great Welsh poet Dylan Thomas. Thank you Taylor."',
      themes: ['self-aware melodrama', 'artist personas vs. reality', 'in-jokes as intimacy', 'literary/rock mythology deflated'],
      fanLore:
        'The "Lucy" name-check was confirmed by Lucy Dacus in March 2025 ("she actually texted me and asked for my approval"); "Jack" is widely read as Jack Antonoff, though he has not confirmed it.',
      easterEggs:
        'The Charlie Puth name-drop nudged Puth to finally release his shelved single "Hero" in May 2024. The song was first played live as a surprise song in Lisbon on May 25, 2024 — Swift told the crowd it was "the first time I’m ever playing this one live."',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [
        ALBUM,
        {
          source_url:
            'https://variety.com/2024/music/news/charlie-puth-taylor-swift-the-tortured-poets-department-hero-1235974552/',
          source_title: "Charlie Puth Responds to Taylor Swift's 'Tortured Poets' Mention With New Song 'Hero'",
          publisher: 'Variety',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
        },
        {
          source_url:
            'https://www.today.com/popculture/music/patti-smith-dylan-thomas-tortured-poets-department-taylor-swift-rcna148511',
          source_title: "Patti Smith thanks Taylor Swift for the 'Tortured Poets' album mention",
          publisher: 'TODAY / NBCUniversal',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
        },
        {
          source_url:
            'https://www.rollingstone.com/music/music-news/taylor-swift-tortured-poets-department-hot-100-debut-1235011913/',
          source_title: "Taylor Swift's 'The Tortured Poets Department' Dominates the Hot 100",
          publisher: 'Rolling Stone',
          source_type: 'chart_database',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Title track peaked No. 4 on the Hot 100; part of the top-14 sweep',
        },
        {
          source_url:
            'https://www.rollingstone.com/music/music-news/taylor-swift-debut-the-tortured-poets-department-title-track-lisbon-1235028103/',
          source_title: "Taylor Swift Debuts 'The Tortured Poets Department' Title Track in Lisbon",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'First live performance, Lisbon, May 25, 2024 (surprise song)',
        },
        {
          source_url:
            'https://variety.com/2025/music/news/lucy-dacus-tortured-poets-department-taylor-swift-lyric-1236351456/',
          source_title: "Lucy Dacus Confirms Taylor Swift's 'Tortured Poets Department' Lyric Is About Her",
          publisher: 'Variety',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
        },
      ],
    },
    {
      slug: 'my-boy-only-breaks-his-favorite-toys',
      trackNumber: 3,
      trackTitle: 'My Boy Only Breaks His Favorite Toys',
      youtubeId: 'wRKXAAV6jh4', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'Solo-written heartbreak in toy-box metaphor — being the doll he smashed precisely because she was the favorite.',
      summary:
        'She rationalizes the damage as evidence of being loved: only the cherished toys get broken. The saddest kind of cope, self-diagnosed mid-song.',
      inspiration: null,
      themes: ['rationalizing mistreatment', 'being discarded', 'cope and its collapse'],
      sourceUrl: 'https://en.wikipedia.org/wiki/My_Boy_Only_Breaks_His_Favorite_Toys',
      sources: [
        wiki(
          'My Boy Only Breaks His Favorite Toys',
          'My_Boy_Only_Breaks_His_Favorite_Toys',
          'song article: composition',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'down-bad',
      trackNumber: 4,
      trackTitle: 'Down Bad',
      youtubeId: 'EVbtjaWXQVg', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isSingle: true,
      note: 'Love as alien abduction: beamed up, experimented on, and dropped back in a field — now crying at the gym about it.',
      summary:
        'A cosmic fling ends and re-entry is the injury: ordinary life feels like the wrong planet. Gen-Z idiom in the title, UFO imagery in the verses, grief in everything else.',
      inspiration: null,
      themes: ['post-love withdrawal', 'alienation', 'wanting to be taken back'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Down_Bad_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Down Bad (Taylor Swift song)',
          'Down_Bad_(Taylor_Swift_song)',
          'song article: reception',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'so-long-london',
      trackNumber: 5,
      trackTitle: 'So Long, London',
      youtubeId: 'CCUr2pNJft4', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'Track 5, as always the wound: a farewell to a city and the six-year love that made it home — the grown-up, exhausted answer to London Boy.',
      summary:
        'A eulogy that opens on Swift’s own multitracked voices stacked into a choral hymn, then quickens — a bass-drum pulse running at roughly double the vocal’s tempo — as a long partnership dies not in a blaze but of quiet: she stopped being willing to trade her aliveness for someone’s low simmer. It debuted at No. 5 on the Hot 100 inside TTPD’s record top-14 opening week, and critics singled it out — Billboard called it so raw that by its close “Swift sounds like she’s been slightly healed from the act of catharsis.” The London of it all made the subject reading universal (unconfirmed, as ever).',
      inspiration:
        'Track 5 is Swift’s standing “most vulnerable” slot (All Too Well, my tears ricochet, tolerate it), and the press treated this as a deliberate continuation of that canon. Fans and press read it as a six-year relationship’s post-mortem given the geography and timeline; Swift has said only that the album chronicles a period she needed to close, and has never spoken to this song specifically. She live-debuted it solo on piano at the Aug. 20, 2024 Wembley finale — the tour’s last European night — and reportedly flipped the closing line from “you’ll find someone” to “I’ll find someone.”',
      themes: ['leaving a life, not just a person', 'exhausted grief', 'cities as exes'],
      fanLore:
        'Fan reading (universal, unconfirmed): the six-year London chapter — the direct sequel fans queue against London Boy.',
      sourceUrl: 'https://en.wikipedia.org/wiki/So_Long%2C_London',
      sources: [
        wiki(
          'So Long, London',
          'So_Long%2C_London',
          'song article: track-5 placement, No. 5 Hot 100 debut, tempo construction',
        ),
        {
          source_url:
            'https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/',
          source_title: 'Taylor Swift Charts 32 Songs on the Hot 100 in a Single Week',
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-21',
          reliability_score: 4,
          notes: '"So Long, London" debuted at No. 5, part of the record top-14',
        },
        {
          source_url:
            'https://www.billboard.com/lists/taylor-swift-the-tortured-poets-department-tracks-ranked/my-boy-only-breaks-his-favorite-toys/',
          source_title: 'The Tortured Poets Department: All 31 Tracks Ranked (Billboard)',
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-21',
          reliability_score: 4,
          notes: 'Jason Lipshutz on the song\'s "raw honesty" and catharsis',
        },
        {
          source_url:
            'https://variety.com/2024/music/news/taylor-swift-florence-jack-antonoff-live-debut-florida-so-long-london-1236112940/',
          source_title: 'Taylor Swift Live-Debuts "So Long, London" at Wembley',
          publisher: 'Variety',
          source_type: 'reputable_press',
          accessed_at: '2026-07-21',
          reliability_score: 4,
          notes: 'First live performance, Aug. 20, 2024, Wembley — solo piano',
        },
        {
          source_url:
            'https://www.washingtonpost.com/entertainment/music/2024/04/18/taylor-swift-track-5-so-long-london/',
          source_title: "Why Taylor Swift's track five 'So Long, London' holds extra meaning",
          publisher: 'The Washington Post',
          source_type: 'reputable_press',
          accessed_at: '2026-07-21',
          reliability_score: 4,
          notes: 'The track-5 "most vulnerable" tradition, applied to this song',
        },
        {
          source_url: 'https://www.capitalfm.com/news/music/taylor-swift-so-long-london-lyrics-eras-tour/',
          source_title: "Taylor Swift's 'So Long, London' lyric change at the Eras Tour",
          publisher: 'Capital FM',
          source_type: 'reputable_press',
          accessed_at: '2026-07-21',
          reliability_score: 3,
          notes: 'The live-debut outro change, "you\'ll find someone" → "I\'ll find someone"',
        },
        ALBUM,
      ],
    },
    {
      slug: 'but-daddy-i-love-him',
      trackNumber: 6,
      trackTitle: 'But Daddy I Love Him',
      youtubeId: 'U2W173hRfyA', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner', 'Jack Antonoff'],
      note: 'The country-sized rebellion aimed not at a father but at the fandom itself — the judgmental chorus gets called sanctimonious to its face, with one gleeful fake-out pregnancy line.',
      summary:
        'She dates someone the internet hates and torches the moralizers who staged interventions over it: her life is not a group project. The wild-boy subject is read as the 2023 Healy controversy (unconfirmed); the scolds in the song are documented — they posted.',
      inspiration:
        'Widely read against the documented 2023 fan open-letter campaign about a brief relationship; Swift never names him, but the song’s target is clearly the pile-on, not the boy.',
      themes: ['autonomy', 'fandom parasociality', 'choosing your own mistakes'],
      fanLore:
        'Fan reading (unconfirmed): the Healy chapter; the anti-fan-jury message needed no decoding.',
      sourceUrl: 'https://en.wikipedia.org/wiki/But_Daddy_I_Love_Him',
      sources: [
        wiki(
          'But Daddy I Love Him',
          'But_Daddy_I_Love_Him',
          'song article: reception and readings',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'fresh-out-the-slammer',
      trackNumber: 7,
      trackTitle: 'Fresh Out the Slammer',
      youtubeId: '0EKbEP2L32M', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The rebound with a prison metaphor — first call after release goes to the old flame who waited.',
      summary:
        'A long relationship recast as a sentence served: now sprung, she runs straight to someone from before the walls went up. The giddy escape reads knowingly temporary.',
      inspiration: null,
      themes: ['relationships as confinement', 'rebounds', 'running to the past'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Fresh_Out_the_Slammer',
      sources: [
        wiki('Fresh Out the Slammer', 'Fresh_Out_the_Slammer', 'song article: composition'),
        ALBUM,
      ],
    },
    {
      slug: 'florida',
      trackNumber: 8,
      trackTitle: 'Florida!!!',
      youtubeId: 'uEssK8o3jKg', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Florence Welch'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The Florence + the Machine team-up: Florida as national witness-protection program, three exclamation points mandatory.',
      summary:
        'Two women flee their crime scenes (romantic and otherwise) to the one state where nobody asks questions. Swift said the idea came from true-crime logic — where fugitives go to vanish.',
      inspiration:
        'Confirmed: Swift described the premise on record as inspired by true-crime stories of people disappearing to Florida to restart.',
      themes: ['escape', 'reinvention', 'gothic humor'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Florida!!!',
      sources: [
        wiki('Florida!!!', 'Florida!!!', 'song article: Welch collaboration and premise'),
        ALBUM,
      ],
    },
    {
      slug: 'guilty-as-sin',
      trackNumber: 9,
      trackTitle: 'Guilty as Sin?',
      youtubeId: 'OOYlWF6V8t8', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'Fantasizing inside a fading relationship and putting the fantasy itself on trial — with a confirmed nod to The Blue Nile in the first verse.',
      summary:
        'Nothing happened except in her head — so why does it feel like evidence? Desire as thought-crime, argued before a jury of her own upbringing. The Blue Nile’s Downtown Lights is name-checked in the lyric.',
      inspiration:
        'The Blue Nile reference is in-text (a band tied to the reported muse’s known tastes, per fan forensics — that layer unconfirmed).',
      themes: ['desire as guilt', 'emotional infidelity', 'religious framing of want'],
      fanLore:
        'Fan reading (unconfirmed): the music-taste breadcrumb trail linking the verse’s band reference to a specific muse.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Guilty_as_Sin%3F',
      sources: [
        wiki('Guilty as Sin?', 'Guilty_as_Sin%3F', 'song article: lyric references'),
        ALBUM,
      ],
    },
    {
      slug: 'whos-afraid-of-little-old-me',
      trackNumber: 10,
      trackTitle: "Who's Afraid of Little Old Me?",
      youtubeId: 'vOZFiX6hDXQ', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The solo-written asylum aria — raised in a circus, sharpened by the crowd, and now performing the monster they insisted she was.',
      summary:
        'Fame as a haunted-house attraction she was locked into as a teenager: if they wanted feral, she can do feral. The album’s biggest vocal and its most explicit indictment of celebrity-making machinery.',
      inspiration: null,
      themes: ['fame as cage', 'weaponized reputation', 'rage as performance'],
      sourceUrl: "https://en.wikipedia.org/wiki/Who's_Afraid_of_Little_Old_Me%3F",
      sources: [
        wiki(
          "Who's Afraid of Little Old Me?",
          "Who's_Afraid_of_Little_Old_Me%3F",
          'song article: reception',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'i-can-fix-him-no-really-i-can',
      trackNumber: 11,
      trackTitle: 'I Can Fix Him (No Really I Can)',
      youtubeId: 'OKWfv-x2rdU', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The fixer-upper delusion with a saloon-door twang — a 2:36 country-Western pastiche whose last line, "Woah, maybe I can’t," pulls the rug out from under the whole premise.',
      summary:
        'She parades a "project" of a man before a horrified audience and insists she alone sees the potential — until the closing concession undoes it. A sparse Western/Americana pastiche of tremolo guitars and drum machine (Antonoff on Moog and Mellotron); critics read it as self-aware satire and one of the album’s sonic highlights, and Billboard ranked it 18th of the 31 tracks. It debuted and peaked at No. 20 on the Hot 100 as every TTPD track charted at once.',
      inspiration: null,
      themes: ['savior complex', 'bad-boy delusion', 'the punchline confession', 'country-Western pastiche'],
      easterEggs:
        'Played live only twice on the 2024 Eras Tour, both as acoustic-guitar surprise mashups — with "Sparks Fly" in Madrid (May 29) and "I Can See You" in Warsaw (Aug 2).',
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Can_Fix_Him_(No_Really_I_Can)',
      sources: [
        wiki(
          'I Can Fix Him (No Really I Can)',
          'I_Can_Fix_Him_(No_Really_I_Can)',
          'song article: composition, credits, reception, live history',
        ),
        ALBUM,
        {
          source_url: 'https://www.officialcharts.com/songs/taylor-swift-i-can-fix-him-no-really-i-can/',
          source_title: 'I Can Fix Him (No Really I Can) — Official Charts',
          publisher: 'Official Charts Company',
          source_type: 'chart_database',
          accessed_at: '2026-07-24',
          reliability_score: 5,
          notes: 'UK charting; corroborates the simultaneous TTPD chart entry',
        },
        {
          source_url:
            'https://www.billboard.com/music/chart-beat/taylor-swift-32-songs-hot-100-one-week-tortured-poets-department-1235669025/',
          source_title: "Taylor Swift Charts 32 Songs on Hot 100, Including Every 'Tortured Poets' Track",
          publisher: 'Billboard',
          source_type: 'chart_database',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'No. 20 Hot 100 peak, week of release',
        },
      ],
    },
    {
      slug: 'loml',
      trackNumber: 12,
      trackTitle: 'loml',
      youtubeId: 'GZ4vaTRn0HU', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The piano dirge that redefines its own acronym by the final line — love of my life curdling into loss of my life.',
      summary:
        'A returned lover promises everything with confetti-cannon sincerity, then vanishes on schedule: she inventories the con and files him under the acronym’s crueler expansion.',
      inspiration: null,
      themes: ['love as con job', 'the biggest loss', 'acronyms as knives'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Loml',
      sources: [wiki('loml', 'Loml', 'song article: acronym twist'), ALBUM],
    },
    {
      slug: 'i-can-do-it-with-a-broken-heart',
      trackNumber: 13,
      trackTitle: 'I Can Do It with a Broken Heart',
      youtubeId: 'Sl6en1NPTYM', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isSingle: true,
      note: 'The confirmed Eras Tour confession — performing the biggest show on earth nightly while privately wrecked, with the stage clicker ticking in the mix.',
      summary:
        'Explicitly about smiling through the 2023 tour dates while her life fell apart offstage: the depression-era show-must-go-on anthem, ending with the giddy, unhinged brag that she pulled it off.',
      inspiration:
        'Confirmed autobiography: the song describes performing the Eras Tour mid-heartbreak, down to the in-ear count-offs sampled in the production.',
      themes: ['functioning depression', 'the show must go on', 'professionalism as armor'],
      easterEggs:
        'Eras Tour audiences screaming the more-tour-dates line back at her became the meta-joke of the 2024 legs.',
      sourceUrl: 'https://en.wikipedia.org/wiki/I_Can_Do_It_with_a_Broken_Heart',
      sources: [
        wiki(
          'I Can Do It with a Broken Heart',
          'I_Can_Do_It_with_a_Broken_Heart',
          'song article: tour context',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'the-smallest-man-who-ever-lived',
      trackNumber: 14,
      trackTitle: 'The Smallest Man Who Ever Lived',
      youtubeId: 'Atdzfj8LcuY', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The album’s scorched-earth peak — a quiet build to the most contemptuous bridge she has ever recorded, asking whether the whole romance was an op.',
      summary:
        'Someone vanished without explanation and she drafts the charges: coward, operative, hometown embarrassment. The fury is that she still does not know which betrayal it was.',
      inspiration:
        'Fan attribution splits between the era’s two reported exes (unconfirmed either way) — the ambiguity is itself the fandom’s longest-running TTPD debate.',
      themes: ['contempt', 'unexplained abandonment', 'demanding an autopsy'],
      fanLore:
        'Fan reading (contested, unconfirmed): the great Healy-versus-Alwyn attribution war of 2024.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Smallest_Man_Who_Ever_Lived',
      sources: [
        wiki(
          'The Smallest Man Who Ever Lived',
          'The_Smallest_Man_Who_Ever_Lived',
          'song article: reception',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'the-alchemy',
      trackNumber: 15,
      trackTitle: 'The Alchemy',
      youtubeId: 'iMMUAd66vxo', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The one happy chemical reaction on the album — stacked with touchdown and trophy imagery that made the subject reading a national headline.',
      summary:
        'After the wreckage, something easy: winning streaks, locker-room metaphors, a love that feels like the championship. The football vocabulary pointed everyone the same direction (unconfirmed in the lyric, extremely confirmed by the tour cameras).',
      inspiration:
        'The sports-imagery reading toward her documented 2023-onward relationship with Travis Kelce is universal; the relationship itself is public record even if the song’s address is not footnoted.',
      themes: ['new love as chemistry', 'winning', 'rare joy on a grief album'],
      fanLore: 'Fan reading (near-universal): the Kelce attribution via the end-zone metaphors.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Alchemy',
      sources: [wiki('The Alchemy', 'The_Alchemy', 'song article: readings'), ALBUM],
    },
    {
      slug: 'clara-bow',
      trackNumber: 16,
      trackTitle: 'Clara Bow',
      youtubeId: 'fcVUbmdQfaE', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The standard edition’s closer: the it-girl assembly line from Clara Bow to Stevie Nicks to — in the final twist — a hungrier new girl being told she looks like Taylor Swift.',
      summary:
        'Each generation’s dazzling girl is complimented as an upgrade on the last, then shelved: the industry conveyor examined by its current occupant, who writes her own replacement into the last verse by name.',
      inspiration:
        'Clara Bow and Stevie Nicks are named in-text; Nicks — a documented friend of Swift — appears elsewhere in the album’s liner poetry, closing the loop.',
      themes: ['it-girl economics', 'replaceability', 'passing the crown'],
      easterEggs:
        'The self-naming final verse is the catalog’s starkest fourth-wall break — the machine described from inside, by name.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Clara_Bow_(song)',
      sources: [wiki('Clara Bow (song)', 'Clara_Bow_(song)', 'song article: named figures'), ALBUM],
    },
    {
      slug: 'the-black-dog',
      trackNumber: 17,
      trackTitle: 'The Black Dog',
      youtubeId: '56TZ3B8Qxsk', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The Anthology opener named for a real London pub — which promptly became a Swiftie pilgrimage site with a themed menu, to the owners’ delight.',
      summary:
        'An ex forgets to turn off location sharing and she watches him walk into their old bar: grief via app notification, modern heartbreak’s most specific opening scene. The actual Vauxhall pub leaned in, documented worldwide.',
      inspiration:
        'The real Black Dog pub in London confirmed the tourist wave publicly — the era’s best example of a lyric geotagging itself.',
      themes: ['digital-age grief', 'shared places lost', 'watching from afar'],
      easterEggs:
        'The pub’s post-release fan influx (and commemorative merch) is documented hospitality-industry history now.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Black_Dog_(song)',
      sources: [
        wiki('The Black Dog (song)', 'The_Black_Dog_(song)', 'song article: pub phenomenon'),
        ALBUM,
      ],
    },
    {
      slug: 'imgonnagetyouback',
      trackNumber: 18,
      trackTitle: 'imgonnagetyouback',
      youtubeId: 'SBGdvxi2JmU', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The double-meaning threat: win him back or get him back — she has not decided, and the song refuses to either.',
      summary:
        'Revenge and reunion held in deliberate superposition: whichever hurts more, probably. The lowercase run-on title is doing reputation-era styling on an Anthology budget.',
      inspiration: null,
      themes: ['ambivalence weaponized', 'revenge or romance', 'unfinished business'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Imgonnagetyouback',
      sources: [wiki('imgonnagetyouback', 'Imgonnagetyouback', 'song article: composition'), ALBUM],
    },
    {
      slug: 'the-albatross',
      trackNumber: 19,
      trackTitle: 'The Albatross',
      youtubeId: '4wOsiM2T_xc', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'Coleridge’s cursed bird, self-applied — she is the omen the wise men warn him about, and she arrives anyway.',
      summary:
        'A woman preceded by her own mythology: dangerous to love, per the pamphlet. She accepts the albatross label, then rewrites it — the curse shows up to rescue him.',
      inspiration:
        'The Rime of the Ancient Mariner reference is in-text — one of the Anthology’s densest literary borrowings.',
      themes: ['reputation as curse', 'literary self-mythology', 'rescue by the feared thing'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Albatross_(Taylor_Swift_song)',
      sources: [
        wiki(
          'The Albatross (Taylor Swift song)',
          'The_Albatross_(Taylor_Swift_song)',
          'song article: Coleridge reference',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'chloe-or-sam-or-sophia-or-marcus',
      trackNumber: 20,
      trackTitle: 'Chloe or Sam or Sophia or Marcus',
      youtubeId: 'gOtOWeD9YJk', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The Anthology’s cult favorite — replacing her is so easy the replacements do not even need distinct names.',
      summary:
        'He moves on to interchangeable someones while she replays the specific, unrepeatable thing they had: the title’s shrugged list is the cruelest device on the album.',
      inspiration: null,
      themes: ['interchangeability', 'specific versus generic love', 'lingering'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [ALBUM],
    },
    {
      slug: 'how-did-it-end',
      trackNumber: 21,
      trackTitle: 'How Did It End?',
      youtubeId: 'O3wlMR0y4a4', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'A breakup autopsy performed for an audience of gossips — the couple’s friends, the fans, and the press all lean in for the cause of death.',
      summary:
        'Everyone wants the story of the ending, including the two people it happened to, who genuinely do not know — grief with a Greek chorus of rubberneckers. As track 21 it opens “The Anthology,” the fifteen-song second half that surprise-dropped at 2 a.m. ET on release night, and it reached No. 35 on the Billboard Hot 100 during TTPD’s record-setting chart week. Swift debuted it live as a solo piano ballad at the final Stockholm Eras Tour show (May 19, 2024); Variety later ranked it among her best songs and The Independent named it one of 2024’s best.',
      inspiration:
        'Aaron Dessner co-wrote and co-produced it; the arrangement builds from near-whispered verses toward a full crescendo that fans single out. Swift has named no subject.',
      themes: ['public appetite for private pain', 'unanswerable endings', 'gossip as ritual'],
      fanLore:
        'Fan/press reading (near-universal, unconfirmed): the close of the six-year Joe Alwyn relationship — the “how did it end?” question outsiders ask when any couple splits — frequently paired with “You’re Losing Me” as the same story’s bookends.',
      easterEggs:
        'The lyric sustains a clinical autopsy conceit — a “fatal fever,” a “death rattle,” maladies “we could not cure” — turning the breakup into a coroner’s report.',
      sourceUrl: 'https://en.wikipedia.org/wiki/How_Did_It_End%3F',
      sources: [
        wiki('How Did It End?', 'How_Did_It_End%3F', 'song article: composition, Hot 100 No. 35 peak, critical reception'),
        {
          source_url: 'https://ca.rollingstone.com/music/taylor-swift-debuts-how-did-it-end-at-final-2024-eras-tour-date-in-sweden/',
          source_title: 'Taylor Swift Debuts “How Did It End?” at Final Stockholm Eras Tour Date',
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-21',
          reliability_score: 3,
          notes: 'Live debut May 19, 2024, Stockholm — standalone piano performance',
        },
        ALBUM,
      ],
    },
    {
      slug: 'so-high-school',
      trackNumber: 22,
      trackTitle: 'So High School',
      youtubeId: 'w-FkV0EM_CU', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The 90s-rock crush song that made a grown superstar feel sixteen again — video games and one very identifiable "marry, kiss, or kill" reference.',
      summary:
        'New love that regresses her to gym-class butterflies: teasing, truth-or-dare, learning someone’s aunts’ names. The Anthology’s second unambiguous burst of happiness, read universally toward the same tight end as The Alchemy.',
      inspiration:
        'Fan attribution to the Kelce relationship is near-universal (the relationship is documented; the dedication is not footnoted). He has publicly vibed to it at shows, which fans file as confirmation-adjacent.',
      themes: ['regression to giddiness', 'new love', 'being known simply'],
      fanLore:
        'Fan reading (near-universal): the Kelce song — supported by his documented on-camera reactions at the Eras Tour.',
      sourceUrl: 'https://www.capitalfm.com/news/music/taylor-swift-so-high-school-eras-tour-travis-kelce/',
      sources: [
        wiki('So High School', 'So_High_School', 'song article: readings'),
        {
          source_url: 'https://www.capitalfm.com/news/music/taylor-swift-so-high-school-eras-tour-travis-kelce/',
          source_title: "Taylor Swift's 'So High School' Travis Kelce References Explained",
          publisher: 'Capital FM',
          source_type: 'reputable_press',
          accessed_at: ACCESSED,
          reliability_score: 3,
          notes: "'marry, kiss, or kill' lyric and Kelce's 2016 interview clip; bleachers as Eras Tour staging, not a lyric",
        },
        ALBUM,
      ],
    },
    {
      slug: 'i-hate-it-here',
      trackNumber: 23,
      trackTitle: 'I Hate It Here',
      youtubeId: 'BpkmUfv1I4Q', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The escapist’s manifesto — secret gardens, imaginary decades, and a much-debated line about which decade she would actually survive.',
      summary:
        'When the present is unbearable she emigrates inward: books, invented worlds, lunar vacations. The nostalgia-with-asterisks verse (the 1830s, minus everything wrong with the 1830s) generated its own documented discourse cycle.',
      inspiration: null,
      themes: ['escapism', 'interior worlds', 'nostalgia audited'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [ALBUM],
    },
    {
      slug: 'thank-you-aimee',
      trackNumber: 24,
      trackTitle: 'thanK you aIMee',
      youtubeId: 'oaBJlKXBvjk', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner', 'Jack Antonoff'],
      note: 'The stylized capitals in the official title spell out a three-letter name — the pettiest typography in the catalog, attached to a song about thanking your bully.',
      summary:
        'A lifelong tormentor gets an ironic acknowledgment: the cruelty built the empire. The K-I-M capitalization is on the official tracklist (fact); the Kardashian reading it triggers has never been stated aloud and never needed to be.',
      inspiration:
        'The capitalization is documented in the official track listing; the 2016 feud it evokes is public record. Swift has confirmed only that the name is changed and the bully composite.',
      themes: ['bullies as accidental architects', 'ironic gratitude', 'outliving a feud'],
      fanLore:
        'Fan/press reading (unconfirmed but typographically assisted): the Kim Kardashian address.',
      easterEggs:
        'The official stylization is the Easter egg — the rare clue embedded in the tracklist itself.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Thank_You_Aimee',
      sources: [
        wiki('thanK you aIMee', 'Thank_You_Aimee', 'song article: stylization and readings'),
        ALBUM,
      ],
    },
    {
      slug: 'i-look-in-peoples-windows',
      trackNumber: 25,
      trackTitle: "I Look in People's Windows",
      youtubeId: '6HIA7ouBfGY', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Jack Antonoff', 'Patrik Berger'],
      producers: ['Taylor Swift', 'Jack Antonoff', 'Patrik Berger'],
      note: 'A ninety-second miniature about scanning strangers’ windows for a glimpse of someone who left without a forwarding address.',
      summary:
        'The compulsion phase of grief: what if he is at one of these dinner parties, what if a lit window contains the conversation they never finished. Small, strange, and over before it resolves — on purpose.',
      inspiration: null,
      themes: ['searching for the vanished', 'voyeurism of grief', 'miniatures'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [ALBUM],
    },
    {
      slug: 'the-prophecy',
      trackNumber: 26,
      trackTitle: 'The Prophecy',
      youtubeId: '_PsBoqNwYo4', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The Anthology’s rawest plea — bargaining with whoever writes fate to change hers from always-left to finally-kept.',
      summary:
        'She petitions the universe like a medieval supplicant: the cards keep reading alone, and she wants a different spread. Fans rank its bridge among the era’s most devastating.',
      inspiration: null,
      themes: ['fate and bargaining', 'fear of unlovability', 'petitioning the universe'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [ALBUM],
    },
    {
      slug: 'cassandra',
      trackNumber: 27,
      trackTitle: 'Cassandra',
      youtubeId: '0hYY86DmqPY', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The Greek prophetess cursed to be right and never believed — deployed by the one pop star with a documented 2016 to point it at.',
      summary:
        'She told the truth, the town lit the pyre, and vindication arrived years late with no apology attached. The myth maps so precisely onto the snake-era receipts saga that fans treat it as that chapter’s formal epitaph (unconfirmed, unnecessary).',
      inspiration:
        'The Cassandra myth is in-text; the 2016 phone-call scandal and its 2020 full-video vindication are public record — the song leaves the wiring exposed.',
      themes: ['believed too late', 'mob dynamics', 'myth as memoir'],
      fanLore: 'Fan reading (near-universal): the 2016 feud timeline as the song’s skeleton.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Cassandra_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Cassandra (Taylor Swift song)',
          'Cassandra_(Taylor_Swift_song)',
          'song article: myth reference',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'peter',
      trackNumber: 28,
      trackTitle: 'Peter',
      youtubeId: 'Mxxswu7V1Us', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'Solo-written Peter Pan correspondence — Wendy finally closes the window on the boy who kept promising to grow up.',
      summary:
        'She kept the light on for a man perpetually twenty-five in his own head; the song is her formally releasing the promise. Fans flag the direct callback to cardigan, where the same Peter first lost his Wendy.',
      inspiration:
        'The Peter Pan framework is in-text; the cardigan connection is a documented fan-canon link Swift seeded herself by reusing the names.',
      themes: ['waiting expired', 'boys who won’t grow up', 'closing the window'],
      easterEggs:
        'A four-years-later answer to cardigan’s Peter-and-Wendy line — one of the catalog’s cleanest long-range callbacks.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [ALBUM],
    },
    {
      slug: 'the-bolter',
      trackNumber: 29,
      trackTitle: 'The Bolter',
      youtubeId: 'bAi80EylyXQ', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'A character study of the woman who always runs — named for the aristocratic nickname history gave serial escapees, and grinning about it.',
      summary:
        'A serial vanisher who feels most alive mid-getaway: every relationship ends with the door swinging. Press traced the title to the Idina Sackville-style Bolter archetype of English society lore (a reading, not a footnote); fans read the shoe as autobiographical and half-proud.',
      inspiration:
        'The Bolter as an English-society archetype (popularized by Frances Osborne’s biography of Sackville) is the documented reference point critics reached for.',
      themes: ['flight response', 'self-mythologized escape', 'freedom versus intimacy'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [ALBUM],
    },
    {
      slug: 'robin',
      trackNumber: 30,
      trackTitle: 'Robin',
      youtubeId: 'FQyEZZPbOb0', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The gentlest thing on the Anthology — a lullaby promising to guard a child’s unbothered world for as long as possible.',
      summary:
        'Addressed to a small boy in dinosaur-and-tree-fort years: the adults will hold the sadness so he does not have to know it exists yet. Widely reported to be named for Aaron Dessner’s son Robin, which Dessner has affirmed in interviews.',
      inspiration:
        'Reported and affirmed in press around release: named for co-writer Dessner’s young son.',
      themes: ['protected childhood', 'buying time for innocence', 'tenderness'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [ALBUM],
    },
    {
      slug: 'the-manuscript',
      trackNumber: 31,
      trackTitle: 'The Manuscript',
      youtubeId: 'iY6Qhlua8Zw', // oEmbed-verified official Taylor Swift channel
      release: 'The Tortured Poets Department: The Anthology',
      releaseDate: '2024-04-19',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The solo-written final word of the whole double album — an old heartbreak reread years later, then formally handed over to the readers.',
      summary:
        'She revisits the draft of a long-ago too-young romance, watches younger women live its echoes, and concludes the story stopped being hers the moment it became everyone’s. The closing thesis of the TTPD project: the pain was hers, the manuscript is ours.',
      inspiration:
        'Functions as the album’s stated epilogue — its closing line about the manuscript’s ownership is the era’s mission statement, quoted in essentially every review.',
      themes: ['art outliving pain', 'handing over the story', 'epilogue'],
      easterEggs:
        'Fans map its verses onto the All Too Well mythology — the manuscript rereading as the scarf saga’s final form (fan reading, unconfirmed).',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Tortured_Poets_Department',
      sources: [ALBUM],
    },
];

// Attach per-song dossiers by slug (issue #440 pattern; see red.mjs / tloas).
const dossierSlugs = new Set(TRACKS.map((t) => t.slug));
for (const key of Object.keys(DOSSIERS)) {
  if (!dossierSlugs.has(key)) throw new Error(`dossier for unknown track slug: ${key}`);
}

export default {
  eraSlug: 'tortured-poets',
  tracks: TRACKS.map((t) => (DOSSIERS[t.slug] ? { ...t, dossier: DOSSIERS[t.slug] } : t)),
};
