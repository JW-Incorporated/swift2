// Vault theories/easter eggs — Midnights / Eras Tour era. Peak decoding:
// vault puzzles, color-coded announcements, the Karma album theory, and the
// surprise-song metagame. All URLs verified 2026-07-08.

const wiki = (article, title, notes) => ({
  source_url: `https://en.wikipedia.org/wiki/${article}`,
  source_title: title,
  publisher: 'Wikipedia',
  source_type: 'wiki',
  accessed_at: '2026-07-08',
  reliability_score: 2,
  excerpt: null,
  notes: notes ?? null,
});

export default {
  eraSlug: 'midnights',
  theories: [
    {
      slug: 'karma-lost-album',
      kind: 'theory',
      title: 'The lost "Karma" album',
      claim:
        'Long-running fan theory that a finished album called Karma was scrapped in 2016 when the era imploded — and that later karma references (the Midnights track above all) are Taylor winking at what was shelved.',
      evidence:
        'Built from 2016-era teasers fans read as an album hint, then supercharged when Midnights shipped a song literally called "Karma." Never confirmed, never denied; every era adds a new "proof" and the theory keeps its engine running. Filed as beloved, unresolved canon.',
      confidence: 'strong_fan_consensus',
      outcome: 'pending',
      relatedSlugs: [],
      sources: [wiki('Karma_(Taylor_Swift_song)', 'Karma (Taylor Swift song)', 'the lost-album theory is discussed in the song article')],
    },
    {
      slug: 'bejeweled-speak-now-clues',
      kind: 'easter_egg',
      title: 'The Bejeweled video was a Speak Now announcement',
      claim:
        'Fans read the "Bejeweled" video — the purple gown, the pointed floor-three elevator button, the Enchanted-coded ballroom — as a coded reveal that Speak Now (Taylor\'s Version), album three, was next. It was.',
      evidence:
        'Taylor said on release day that the video was stuffed with easter eggs; the fandom filed the purple/third-floor cluster under Speak Now within hours. Eight months later the Nashville announcement proved the read. The clean template of clue -> consensus -> confirmation.',
      confidence: 'strong_fan_consensus',
      outcome: 'confirmed',
      relatedSlugs: ['lover:mastermind-doctrine'],
      sources: [
        wiki('Bejeweled_(song)', 'Bejeweled (song)', 'the video easter eggs are documented in the song article'),
        wiki('Speak_Now_(Taylor%27s_Version)', "Speak Now (Taylor's Version)"),
      ],
    },
    {
      slug: 'vault-puzzles-1989',
      kind: 'easter_egg',
      title: 'The Google vault puzzles',
      claim:
        'To reveal the 1989 (Taylor\'s Version) vault track titles, fans had to collectively solve 33 million Google word puzzles — searching her name spilled a literal blue vault across the results page.',
      evidence:
        'An official, platform-scale scavenger hunt run with Google in September 2023; the fandom cleared the 33-million target in under a day (crashing the puzzle at one point) and the vault titles unlocked. Easter-egg culture as infrastructure.',
      confidence: 'official',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [wiki('1989_(Taylor%27s_Version)', "1989 (Taylor's Version)", 'the Google vault puzzle campaign is documented in the album article')],
    },
    {
      slug: 'eight-nine-sofi',
      kind: 'theory',
      title: '8/9: the date fans called in advance',
      claim:
        'Swifties bet 1989 (Taylor\'s Version) would be announced on August 9, 2023 — the final 2023 US Eras show, on 8/9 — after weeks of blue outfits and cursive-“T” hints. She announced it that night.',
      evidence:
        'A genuinely predictive win for fan numerology: date logic (8/9 = ’89), the color-code system (blue = 1989), and the tour calendar all pointed the same way, publicly, before the show. Documented as called-in-advance rather than retrofitted.',
      confidence: 'strong_fan_consensus',
      outcome: 'confirmed',
      relatedSlugs: ['midnights:album-color-canon'],
      sources: [wiki('1989_(Taylor%27s_Version)', "1989 (Taylor's Version)", 'the SoFi 8/9 announcement is documented in the album article')],
    },
    {
      slug: 'album-color-canon',
      kind: 'theory',
      title: 'Every era has a color',
      claim:
        'Fan canon assigns each album a color — gold Fearless, purple Speak Now, red Red, blue 1989, black reputation, pink Lover, grey folklore, rust evermore, midnight-blue Midnights — and Taylor signals eras by wearing the palette before announcing anything.',
      evidence:
        'The color system started as fan taxonomy and became a two-way channel: the Eras Tour staged each act in its color, and announcement-watching now runs on outfit forensics (blue before 1989 TV, purple before Speak Now TV). Repeatedly validated, never formally codified.',
      confidence: 'strong_fan_consensus',
      outcome: 'partially_confirmed',
      relatedSlugs: ['midnights:eight-nine-sofi'],
      sources: [
        wiki('The_Eras_Tour', 'The Eras Tour', 'the era-by-era color staging is documented in the tour article'),
        wiki('Cultural_impact_of_Taylor_Swift', 'Cultural impact of Taylor Swift'),
      ],
    },
    {
      slug: 'surprise-song-metagame',
      kind: 'theory',
      title: 'The surprise-song metagame',
      claim:
        'Eras Tour fans treated the nightly two-song acoustic set as a solvable system: a no-repeat rule, dwindling remaining-songs spreadsheets, and city-specific logic used to predict each night\'s picks.',
      evidence:
        'The no-repeat pattern held through most of 2023 (screwed-up songs earned reruns, by her own stage admission), making the community spreadsheets genuinely predictive — until the 2024 mashup era deliberately broke the system. Pattern real; rule informal; expiration confirmed.',
      confidence: 'reputable_reporting',
      outcome: 'partially_confirmed',
      relatedSlugs: [],
      sources: [wiki('The_Eras_Tour', 'The Eras Tour', 'the surprise-song format and its evolution are documented in the tour article')],
    },
    {
      slug: 'friendship-bracelets',
      kind: 'easter_egg',
      title: 'One lyric started the bracelet economy',
      claim:
        'The Eras Tour friendship-bracelet ritual — millions of beaded bracelets made, traded, and stacked at every show — grew out of a single "You\'re on Your Own, Kid" lyric about making friendship bracelets and taking the moment.',
      evidence:
        'Fans took the lyric as an instruction within weeks of opening night; by mid-2023 bracelet trading was the tour\'s defining ritual, covered everywhere from local news to bead-shortage business stories. A lyric became a subculture — the fandom\'s favorite kind of easter egg: one they built themselves.',
      confidence: 'reputable_reporting',
      outcome: 'confirmed',
      relatedSlugs: [],
      sources: [
        wiki('The_Eras_Tour', 'The Eras Tour', 'the friendship-bracelet phenomenon is documented in the tour article'),
        wiki('Swifties', 'Swifties'),
      ],
    },
  ],
};
