// Vault track guide — Midnights era (Midnights 2022, 3am Edition, Til Dawn
// additions). Original prose only — never lyrics; unconfirmed readings are
// labeled. Provenance per docs/content/content-audit-2026-07-08.md §5 (URLs
// verified 2026-07-08). Concept per Swift's announcement: thirteen sleepless
// nights scattered across her life. Grammy Album of the Year, 2024.
import DOSSIERS from './midnights.dossiers.mjs';

const ACCESSED = '2026-07-08';
// Depth pass (ledger #1256, 2026-07-24): accessed date for newly added sources.
const ACCESSED_DEPTH = '2026-07-24';
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
  'Midnights',
  'Midnights',
  'album article: release facts, credits, and cited interviews',
);

const ERA = {
  eraSlug: 'midnights',
  tracks: [
    {
      slug: 'lavender-haze',
      trackNumber: 1,
      trackTitle: 'Lavender Haze',
      youtubeId: 'h8DLofLM7No', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights',
      releaseDate: '2022-10-21',
      writers: [
        'Taylor Swift',
        'Jack Antonoff',
        'Zoë Kravitz',
        'Sounwave',
        'Jahaan Sweet',
        'Sam Dew',
      ],
      producers: ['Taylor Swift', 'Jack Antonoff', 'Sounwave', 'Jahaan Sweet', 'Braxton Cook'],
      singleReleaseDate: '2023-01-27',
      note: 'Named for 1950s slang for being in love that she heard on Mad Men — an opener about protecting a relationship from the marriage-plot press cycle.',
      summary:
        'Staying inside the glow and ignoring the questions: she confirmed the song is about deflecting constant engagement speculation and tabloid scrutiny to keep the real thing intact. Zoë Kravitz’s co-write is the era’s celebrity-friend credit — she added sonic embellishments to a groove Sounwave and Jack Antonoff built from Braxton Cook’s wordless vocal coos, with Sam Dew shaping the melodies. As the album opener it went to pop radio on Nov. 29, 2022 and peaked at No. 2 on the Hot 100 — kept off the top only by her own “Anti-Hero” during the week she swept the chart’s entire top 10 — and reached No. 5 on Pop Airplay. Swift wrote and directed the music video herself, a “sultry sleepless ’70s fever dream” that premiered Jan. 27, 2023 and cast trans model and activist Laith Ashley as her love interest, drawing praise for its inclusive casting. It opened the Midnights act of the Eras Tour across the tour’s run. Critics were warm: Rolling Stone’s Brittany Spanos called the production “restrained and muted,” and NPR’s Ann Powers likened its layered vocals and synth drums to Whitney Houston.',
      inspiration:
        'Confirmed: Swift explained the Mad Men origin of the phrase and the guarding-the-relationship meaning in her own announcement video.',
      themes: ['protecting love from scrutiny', 'refusing the marriage plot', 'the glow'],
      easterEggs:
        'Fan reading (not confirmed by Swift): the song’s lavender imagery echoes the era’s purple color-coding and the video’s lavender-drenched palette, tying the opener’s “protect the glow” theme to the Midnights visual identity.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Lavender_Haze',
      sources: [
        wiki('Lavender Haze', 'Lavender_Haze', 'song article: confirmed origin story, video, charts, reception'),
        {
          source_url:
            'https://www.billboard.com/music/chart-beat/taylor-swift-all-hot-100-top-10-anti-hero-1235163664/',
          source_title:
            'Taylor Swift Makes History as First Artist to Claim Entire Top 10 of the Hot 100',
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: ACCESSED_DEPTH,
          reliability_score: 4,
          notes: '“Lavender Haze” peaked at No. 2, held off No. 1 by “Anti-Hero”',
        },
        ALBUM,
      ],
    },
    {
      slug: 'maroon',
      trackNumber: 2,
      trackTitle: 'Maroon',
      youtubeId: 'lvHZjvIyqsk', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights',
      releaseDate: '2022-10-21',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The grown-up sequel to Red in the fans’ color theory — the same shade, darker, drier, and stained into everything.',
      summary:
        'A New York almost-love remembered through its palette: spilled wine, rust, scarlet — deeper colors for a deeper cut. Fans canonized it instantly as Red’s older sibling.',
      inspiration: null,
      themes: ['color-coded memory', 'adult heartbreak', 'what lingers'],
      easterEggs:
        'The red-to-maroon progression is the fandom’s favorite proof of the catalog aging in real time with her.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Maroon_(song)',
      sources: [wiki('Maroon (song)', 'Maroon_(song)', 'song article: reception'), ALBUM],
    },
    {
      slug: 'anti-hero',
      trackNumber: 3,
      trackTitle: 'Anti-Hero',
      youtubeId: 'b1kbLwvqugk', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights',
      releaseDate: '2022-10-21',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      singleReleaseDate: '2022-10-24',
      note: 'The lead single she called a guided tour of everything she hates about herself — it anchored the record week when she claimed all Hot 100 top ten spots at once.',
      summary:
        'Insecurity given a monster-movie budget: sleepless self-loathing, a daydreamed daughter-in-law murder trial, and the it-is-me chorus that became a global catchphrase within days.',
      inspiration:
        'Confirmed: Swift introduced it in an Instagram video as her most honest inventory of her own flaws and anxieties.',
      themes: ['self-loathing', 'anxiety at 3 a.m.', 'being your own problem'],
      easterEggs:
        'The all-top-ten Hot 100 week (a chart first) is the era stat every future record gets measured against.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Anti-Hero_(song)',
      sources: [
        wiki(
          'Anti-Hero (song)',
          'Anti-Hero_(song)',
          'song article: confirmed self-commentary and chart records',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'snow-on-the-beach',
      trackNumber: 4,
      trackTitle: 'Snow on the Beach',
      youtubeId: '_p0jeMjTccw', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights',
      releaseDate: '2022-10-21',
      writers: ['Taylor Swift', 'Lana Del Rey', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The Lana Del Rey collaboration fans demanded more Lana from — so loudly that a More Lana Del Rey version was actually released later.',
      summary:
        'Two people falling for each other simultaneously, framed as weather too improbable to trust: beautiful, eerie, and hard to believe even while it is happening.',
      inspiration:
        'The famously buried Del Rey vocal became the documented storyline: fan outcry led to a re-cut version with her verses foregrounded in 2023.',
      themes: ['mutual falling', 'improbability', 'wonder'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Snow_on_the_Beach',
      sources: [
        wiki('Snow on the Beach', 'Snow_on_the_Beach', 'song article: Del Rey versions'),
        ALBUM,
      ],
    },
    {
      slug: 'youre-on-your-own-kid',
      trackNumber: 5,
      trackTitle: "You're on Your Own, Kid",
      youtubeId: '7Gbg6Z70J7E', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights',
      releaseDate: '2022-10-21',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'Track 5, on tradition — a whole autobiography in one crescendo, whose friendship-bracelet line singlehandedly created the Eras Tour’s defining ritual.',
      summary:
        'From hometown crushes to industry disillusionment to hard-won self-reliance: the loneliness of self-madeness, resolved by the instruction to make the bracelets and face the fear. Fans took the bracelet line literally, by the millions.',
      inspiration:
        'The friendship-bracelet exchange phenomenon at the Eras Tour is the documented cultural output — a lyric that manufactured a real-world tradition.',
      themes: ['self-reliance', 'growing up in the machine', 'seizing the moment'],
      easterEggs:
        'Every trading-bead bracelet at every Eras Tour night traces back to this bridge — the era’s biggest lyric-to-life Easter egg.',
      sourceUrl: "https://en.wikipedia.org/wiki/You're_on_Your_Own%2C_Kid",
      sources: [
        wiki(
          "You're on Your Own, Kid",
          "You're_on_Your_Own%2C_Kid",
          'song article: bracelet tradition',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'midnight-rain',
      trackNumber: 6,
      trackTitle: 'Midnight Rain',
      youtubeId: 'Odh9ddPUkEY', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights',
      releaseDate: '2022-10-21',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The pitched-down voice that startled everyone on first listen — a sunshine boy, a storm girl, and the ambition that chose for her.',
      summary:
        'He wanted comfortable and settled; she wanted the whole loud world. A breakup with no villain, revisited from hotel rooms years later with mild, unresolved wondering.',
      inspiration: null,
      themes: ['ambition versus comfort', 'diverging paths', 'the one who wanted quiet'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Midnight_Rain',
      sources: [
        wiki('Midnight Rain', 'Midnight_Rain', 'song article: production and reception'),
        ALBUM,
      ],
    },
    {
      slug: 'question',
      trackNumber: 7,
      trackTitle: 'Question...?',
      youtubeId: 'xxrf_QBD5DE', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights',
      releaseDate: '2022-10-21',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'Opens by sampling her own Out of the Woods — then interrogates an ex about one unresolved kiss in a crowded room.',
      summary:
        'A cross-examination disguised as a pop song: did it mean what she thinks it meant, does he regret the crowd, the timing, the girl he settled for. The self-sample makes the 1989 connection explicit.',
      inspiration: null,
      themes: ['unresolved moments', 'interrogating the past', 'what-ifs'],
      easterEggs:
        'The Out of the Woods interpolation is credited — her catalog quoting itself is the era’s favorite trick.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Question...%3F',
      sources: [
        wiki('Question...?', 'Question...%3F', 'song article: self-interpolation credit'),
        ALBUM,
      ],
    },
    {
      slug: 'vigilante-shit',
      trackNumber: 8,
      trackTitle: 'Vigilante Shit',
      youtubeId: 'Uoey4W_3bos', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights',
      releaseDate: '2022-10-21',
      writers: ['Taylor Swift'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The album’s lone solo write — revenge served through paperwork: she dresses for vengeance and helps a wronged wife collect the evidence.',
      summary:
        'Noir minimalism about ruining a bad man lawfully: no keys scratched, just documents forwarded and a widow-to-be empowered. Fans hunt for real-world targets; Swift has named none.',
      inspiration: null,
      themes: ['revenge by receipt', 'female alliance', 'cold precision'],
      fanLore:
        'Fan reading (unconfirmed): popular mappings onto her documented business adversaries — none acknowledged.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Vigilante_Shit',
      sources: [wiki('Vigilante Shit', 'Vigilante_Shit', 'song article: solo credit'), ALBUM],
    },
    {
      slug: 'bejeweled',
      trackNumber: 9,
      trackTitle: 'Bejeweled',
      youtubeId: 'b7QlX3yR2xs', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights',
      releaseDate: '2022-10-21',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isSingle: true,
      note: 'The sparkle-reclamation anthem whose Cinderella video was a confirmed Easter-egg vault — including the Speak Now announcement hiding in plain sight.',
      summary:
        'Taken for granted at home, she remembers she can still light up a room and goes to prove it. The self-directed video buried era clues Swift confirmed were deliberate — fans decoded the purple wardrobe correctly.',
      inspiration:
        'Confirmed: Swift said the video was loaded with intentional Easter eggs; the Speak Now re-record announcement later validated the fan decoding.',
      themes: ['self-worth reclaimed', 'shimmer as defiance', 'walking out the door'],
      easterEggs:
        'The video’s bell chimes, purple gown, and floor numbers were all confirmed clues pointing at Speak Now (Taylor’s Version).',
      sourceUrl: 'https://en.wikipedia.org/wiki/Bejeweled_(song)',
      sources: [
        wiki('Bejeweled (song)', 'Bejeweled_(song)', 'song article: video Easter eggs'),
        ALBUM,
      ],
    },
    {
      slug: 'labyrinth',
      trackNumber: 10,
      trackTitle: 'Labyrinth',
      youtubeId: 'xTXsKMXUi7w', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights',
      releaseDate: '2022-10-21',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The weightless one — falling in love again mid-heartbreak and being terrified of the elevator drop.',
      summary:
        'Breath held in an emotional stairwell: she talks herself through panic as new feelings arrive faster than the old damage healed. Antonoff’s production floats for two-thirds on dense synths and almost no percussion before a beat suddenly drops in, her vocal pitched down near the end. It debuted at No. 14 on the Hot 100 the week Swift became the first artist to hold the chart’s entire top 10 (dated Nov. 5, 2022) and reached No. 12 on the Global 200; critics filed it as a quiet grower — Rolling Stone’s Rob Sheffield called it a “stealth classic” — while a handful found its vocal effects dated. Long a fan favorite left off the setlist, it finally arrived as an Eras Tour surprise song in Buenos Aires (Nov. 9, 2023) and later turned up in piano mashups.',
      inspiration:
        'Swift revealed only the title on “Midnights Mayhem With Me” and never explained the song; the closest self-sourced thread is the “breathe in, breathe through, breathe deep, breathe out” line, which echoes advice from her 2022 NYU commencement speech. The widely repeated falling-in-love-again-after-heartbreak reading is critics’ interpretation, not a confirmed statement.',
      themes: ['falling again', 'fear after loss', 'gentleness with oneself'],
      easterEggs:
        'Fan and critic reading (unconfirmed by Swift): the “elevator”/about-to-fall imagery as the vertigo of new love, and the “it only hurts this much right now” turn as the pivot from dread toward acceptance.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Labyrinth_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Labyrinth (Taylor Swift song)',
          'Labyrinth_(Taylor_Swift_song)',
          'song article: composition, chart peaks, reception, live performances',
        ),
        {
          source_url:
            'https://www.rollingstone.com/music/music-features/taylor-swift-midnights-sheffield-1234615239/',
          source_title: 'Taylor Swift’s ‘Midnights’: Rob Sheffield’s Track-by-Track Review',
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: ACCESSED_DEPTH,
          reliability_score: 4,
          notes: 'review: calls Labyrinth a “stealth classic”',
        },
        {
          source_url:
            'https://www.today.com/popculture/music/taylor-swift-labyrinth-surprise-song-argentina-rcna124660',
          source_title: 'Taylor Swift plays ‘Labyrinth’ live for the first time in Argentina',
          publisher: 'Today',
          source_type: 'reputable_press',
          accessed_at: ACCESSED_DEPTH,
          reliability_score: 4,
          notes: 'live history: Eras Tour surprise-song debut, Buenos Aires',
        },
        ALBUM,
      ],
    },
    {
      slug: 'karma',
      trackNumber: 11,
      trackTitle: 'Karma',
      youtubeId: 'rg18Kf4en2o', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights',
      releaseDate: '2022-10-21',
      writers: ['Taylor Swift', 'Jack Antonoff', 'Sounwave', 'Jahaan Sweet', 'Keanu Torres'],
      producers: ['Taylor Swift', 'Jack Antonoff', 'Sounwave', 'Keanu Beats', 'Jahaan Sweet'],
      singleReleaseDate: '2023-05-01',
      note: 'The gloating victory-lap single — and the wink that reignited the fandom’s beloved lost-Karma-album conspiracy from 2016.',
      summary:
        'Cosmic justice as her personal pet: karma is a cat, a boyfriend, a breeze — and her enemies’ pending invoice. The Ice Spice remix and Eras Tour placement kept it everywhere through 2023.',
      inspiration:
        'The title fed the documented fan theory that a Karma album was scrapped in 2016 when reputation happened — a theory Swift has toyed with but never confirmed.',
      themes: ['comeuppance', 'serenity as revenge', 'winning long-term'],
      fanLore:
        'Fan theory (unconfirmed, famously): the lost 2016 Karma album — the era’s favorite piece of speculative canon.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Karma_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Karma (Taylor Swift song)',
          'Karma_(Taylor_Swift_song)',
          'song article: single run and theory coverage',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'sweet-nothing',
      trackNumber: 12,
      trackTitle: 'Sweet Nothing',
      youtubeId: 'rn0brgg2BpI', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights',
      releaseDate: '2022-10-21',
      writers: ['Taylor Swift', 'William Bowery'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The last William Bowery co-write to appear before the breakup news — a tiny domestic hymn about a love that asks for nothing.',
      summary:
        'Industry wolves demand more all day; at home someone wants only her company and a poem from a trip. Its tenderness reads differently since 2023, and fans handle it accordingly.',
      inspiration:
        'Co-written with Joe Alwyn under the confirmed Bowery pseudonym — the pair’s final released collaboration before their documented 2023 split.',
      themes: ['domestic refuge', 'wanting nothing', 'small love versus big world'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Sweet_Nothing_(Taylor_Swift_song)',
      sources: [
        wiki(
          'Sweet Nothing (Taylor Swift song)',
          'Sweet_Nothing_(Taylor_Swift_song)',
          'song article: Bowery credit',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'mastermind',
      trackNumber: 13,
      trackTitle: 'Mastermind',
      youtubeId: 'Tmz1lz0zcLQ', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights',
      releaseDate: '2022-10-21',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The closer that confesses to the fandom’s oldest suspicion: yes, she plans everything — the meet-cute included.',
      summary:
        'A love that looked like fate was actually chess: she scattered the dominoes on purpose and he knew, and stayed anyway. Doubling as a wink at her Easter-egg empire — being cryptic and Machiavellian was always the brand.',
      inspiration:
        'Swift has repeatedly and publicly embraced strategic planning and clue-dropping as her creative signature; the song makes that persona the love story.',
      themes: ['scheming as love language', 'being fully seen', 'the plan behind the magic'],
      easterEggs:
        'Functionally a mission statement for the entire clue-hunting fandom economy — the mastermind admits the game is real.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Mastermind_(song)',
      sources: [
        wiki('Mastermind (song)', 'Mastermind_(song)', 'song article: closer analysis'),
        ALBUM,
      ],
    },
    {
      slug: 'the-great-war',
      trackNumber: 14,
      trackTitle: 'The Great War',
      youtubeId: 'iFX6_9h7th0', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights (3am Edition)',
      releaseDate: '2022-10-22',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The 3am Edition’s WWI-imagery centerpiece — a relationship’s worst fight survived, with poppies planted over the trench afterward.',
      summary:
        'Old wounds make her swing at someone innocent; the battle nearly ends them, and the vow that closes it is to never fight like that again. Trench warfare as couples therapy.',
      inspiration: null,
      themes: ['conflict and repair', 'fighting your own scars', 'armistice'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Midnights',
      sources: [ALBUM],
    },
    {
      slug: 'bigger-than-the-whole-sky',
      trackNumber: 15,
      trackTitle: 'Bigger Than the Whole Sky',
      youtubeId: 'l8Tps3PITx4', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights (3am Edition)',
      releaseDate: '2022-10-22',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The 3am track that became a grief anthem — embraced especially by listeners mourning pregnancy loss, a reading Swift has left open.',
      summary:
        'A goodbye to something that never got to exist: unnamed, unbounded loss for what was only ever almost. She has never specified the subject, and the ambiguity is why it holds so many people’s grief.',
      inspiration:
        'Deliberately unspecified; the pregnancy-loss resonance is a documented listener phenomenon rather than a confirmed subject — labeled here accordingly.',
      themes: ['grief for the almost', 'loss without a name', 'goodbye unearned'],
      fanLore:
        'Fan reading (unconfirmed, widely embraced): miscarriage and pregnancy loss — the song’s largest documented community of meaning.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Bigger_Than_the_Whole_Sky',
      sources: [
        wiki(
          'Bigger Than the Whole Sky',
          'Bigger_Than_the_Whole_Sky',
          'song article: reception and resonance',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'paris',
      trackNumber: 16,
      trackTitle: 'Paris',
      youtubeId: 'ySZGZrcqvr4', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights (3am Edition)',
      releaseDate: '2022-10-22',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The 3am bonus about being so in love the room becomes another city — privacy as the actual romance.',
      summary:
        'No trip involved: two people draw the blinds, ignore the gossip cycle, and pretend the bedroom is Paris. Escapism as a couple’s inside joke.',
      inspiration: null,
      themes: ['love as elsewhere', 'shutting out the noise', 'giddy secrecy'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Midnights',
      sources: [ALBUM],
    },
    {
      slug: 'high-infidelity',
      trackNumber: 17,
      trackTitle: 'High Infidelity',
      youtubeId: '-qee6dFKlw4', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights (3am Edition)',
      releaseDate: '2022-10-22',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The 3am track with the date stamp that sent the fandom to the archives — April 29 is in the lyric, and the timeline detectives never recovered.',
      summary:
        'A narrator inside a cold relationship keeps one foot out the door and eventually uses it — infidelity framed as symptom rather than sin. The specific date planted in the chorus is the most clue-shaped lyric she has ever written.',
      inspiration:
        'The April 29 reference launched extensively documented fan timeline analysis against her public chronology; Swift has confirmed nothing.',
      themes: ['emotional cold war', 'exit strategies', 'guilt and self-defense'],
      fanLore:
        'Fan reading (unconfirmed): the April 29 cross-referencing project — a signature piece of Swiftie forensics.',
      sourceUrl: 'https://en.wikipedia.org/wiki/High_Infidelity_(song)',
      sources: [
        wiki(
          'High Infidelity (song)',
          'High_Infidelity_(song)',
          'song article: lyric speculation coverage',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'glitch',
      trackNumber: 18,
      trackTitle: 'Glitch',
      youtubeId: 'Y2a73EvnZ4s', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights (3am Edition)',
      releaseDate: '2022-10-22',
      writers: ['Taylor Swift', 'Jack Antonoff', 'Sounwave', 'Sam Dew'],
      producers: ['Taylor Swift', 'Jack Antonoff', 'Sounwave'],
      note: 'The friends-with-benefits system error — a casual arrangement that keeps outputting feelings.',
      summary:
        'The setup was supposed to be temporary and platonic-ish; five years of uptime later, the anomaly looks a lot like the whole program. Nerdy metaphors, R&B undertow.',
      inspiration: null,
      themes: ['accidental love', 'system malfunctions as fate', 'casual gone permanent'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Midnights',
      sources: [ALBUM],
    },
    {
      slug: 'wouldve-couldve-shouldve',
      trackNumber: 19,
      trackTitle: "Would've, Could've, Should've",
      youtubeId: 'B-MfwP_RmHY', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights (3am Edition)',
      releaseDate: '2022-10-22',
      writers: ['Taylor Swift', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Aaron Dessner'],
      note: 'The 3am edition’s reckoning — an adult re-litigating what happened to her at nineteen, in the fandom’s consensus pick for the deepest cut of the era.',
      summary:
        'Regret with religious imagery: a too-young woman and an older man, and the ruins the memory still makes of her sleep at 32. The age in the lyric does the pointing; fans line it up with Dear John and the same reported chapter (unconfirmed by name).',
      inspiration:
        'The nineteen reference and its echo of Dear John’s subject matter are the documented basis for the near-universal fan attribution — never named by Swift.',
      themes: ['delayed reckoning', 'stolen innocence', 'ghosts that keep office hours'],
      fanLore:
        'Fan reading (widely held, unconfirmed): the same subject fans assign to Dear John, twelve years later.',
      sourceUrl: "https://en.wikipedia.org/wiki/Would've%2C_Could've%2C_Should've",
      sources: [
        wiki(
          "Would've, Could've, Should've",
          "Would've%2C_Could've%2C_Should've",
          'song article: reception and readings',
        ),
        ALBUM,
      ],
    },
    {
      slug: 'dear-reader',
      trackNumber: 20,
      trackTitle: 'Dear Reader',
      youtubeId: 'X0Jti9F-oQA', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights (3am Edition)',
      releaseDate: '2022-10-22',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      note: 'The 3am closer as an advice column from someone disqualified to write one — take her guidance, she says, and then absolutely do not.',
      summary:
        'Life-tips dispensed by a self-described bad example: burn the maps, dye the hair, move cities — followed by the confession that anyone taking direction from her is lost too.',
      inspiration: null,
      themes: ['unreliable narrator', 'advice as warning', 'isolation of the oracle'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Midnights',
      sources: [ALBUM],
    },
    {
      slug: 'hits-different',
      trackNumber: 21,
      trackTitle: 'Hits Different',
      youtubeId: '_f4yoKJL7IQ', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights (Target exclusive / Til Dawn Edition)',
      releaseDate: '2022-10-21',
      writers: ['Taylor Swift', 'Jack Antonoff', 'Aaron Dessner'],
      producers: ['Taylor Swift', 'Jack Antonoff', 'Aaron Dessner'],
      note: 'The Target-exclusive bonus that escaped to streaming with the Til Dawn Edition — a spiraling, funny, devastated breakup carousel.',
      summary:
        'Every coping mechanism fails at once: crying at parties, arguing with strangers, seeing his face in traffic. The rare song with both Antonoff and Dessner fingerprints on one track.',
      inspiration: null,
      themes: ['spiraling', 'grief with jokes', 'coping badly in public'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Hits_Different',
      sources: [wiki('Hits Different', 'Hits_Different', 'song article: release history'), ALBUM],
    },
    {
      slug: 'youre-losing-me',
      trackNumber: 22,
      trackTitle: "You're Losing Me",
      youtubeId: 'pQq9eP5OFhw', // oEmbed-verified official Taylor Swift channel
      release: 'Midnights (The Til Dawn Edition) — From The Vault',
      releaseDate: '2023-05-26',
      writers: ['Taylor Swift', 'Jack Antonoff'],
      producers: ['Taylor Swift', 'Jack Antonoff'],
      isFromTheVault: true,
      note: 'The heartbeat-drum vault track that dropped weeks after the breakup news — instantly read as the relationship’s death certificate, written from inside it.',
      summary:
        'A slow flatline: she is fading in a relationship where the other person will not fight, choose, or even argue. Released as a Til Dawn vault cut in the exact news cycle of her documented 2023 split, which fans treated as the announcement’s B-side.',
      inspiration:
        'Recorded in December 2021 per its credits; the timing of its release against the publicly reported breakup is the documented story — Swift let the sequencing speak.',
      themes: ['dying relationships', 'being unchosen', 'the quiet end'],
      fanLore:
        'Fan reading (unconfirmed in specifics): the Alwyn relationship’s final chapter — universally assumed, never narrated by Swift.',
      sourceUrl: "https://en.wikipedia.org/wiki/You're_Losing_Me",
      sources: [
        wiki("You're Losing Me", "You're_Losing_Me", 'song article: release timing and credits'),
        ALBUM,
      ],
    },
  ],
};

// Attach per-song dossiers by slug (issue #440 pattern; see red.mjs / ttpd).
// `ERA` is named rather than exported inline only so the large tracks array
// above keeps its original nesting instead of being reindented under a const;
// the merge below matches the sibling files' compute-in-export shape.
for (const key of Object.keys(DOSSIERS)) {
  if (!ERA.tracks.some((t) => t.slug === key)) {
    throw new Error(`dossier for unknown track slug: ${key}`);
  }
}

export default {
  ...ERA,
  tracks: ERA.tracks.map((t) => (DOSSIERS[t.slug] ? { ...t, dossier: DOSSIERS[t.slug] } : t)),
};
