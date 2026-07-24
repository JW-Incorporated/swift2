// Vault track guide — The Life of a Showgirl era (Taylor Swift, 2025).
// One record per canonical song. Summaries, themes, and readings are ORIGINAL
// prose in our own words — never lyrics. Anything not publicly confirmed is
// labeled a fan reading. Sources follow the provenance format in
// docs/content/content-audit-2026-07-08.md §5 (all URLs verified 2026-07-08).
import DOSSIERS from './the-life-of-a-showgirl.dossiers.mjs';

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
  'The Life of a Showgirl',
  'The_Life_of_a_Showgirl',
  'album article: full track listing, release facts, and credits',
);
const WRITERS = ['Taylor Swift', 'Max Martin', 'Shellback'];
const PRODUCERS = ['Taylor Swift', 'Max Martin', 'Shellback'];

const TRACKS = [
    {
      slug: 'the-fate-of-ophelia',
      trackNumber: 1,
      trackTitle: 'The Fate of Ophelia',
      youtubeId: 'ko70cExuzZM', // oEmbed-verified official Taylor Swift channel
      release: 'The Life of a Showgirl',
      releaseDate: '2025-10-03',
      writers: WRITERS,
      producers: PRODUCERS,
      isSingle: true,
      singleReleaseDate: '2025-10-03',
      note: 'The lead single and opener, debuting at No. 1 on the Hot 100 and leading the chart for a career-longest 10 non-consecutive weeks.',
      summary:
        'A drowning woman gets pulled back to shore by a love that arrives in time — the album\'s mission statement in miniature, rescue instead of ruin.',
      inspiration:
        'Swift has framed the song as flipping the fate of Shakespeare\'s Ophelia, the Hamlet character who drowns; here the narrator is saved instead, a reversal she has tied to the era\'s "rescued" romantic arc.',
      themes: ['rescue', 'reversal of tragedy', 'literary allusion'],
      easterEggs:
        'The cover art restages John Everett Millais\'s 1850s painting Ophelia, with Swift half-submerged in water — the same image the song\'s title reverses.',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Fate_of_Ophelia',
      sources: [
        wiki('The Fate of Ophelia', 'The_Fate_of_Ophelia', 'song article: chart history and lyrical framing'),
        ALBUM,
      ],
      // Depth ledger #1430 (2026-07-24): arrangement/sound, live footprint,
      // in-lyric Hamlet allusion + decoded easter eggs, and cultural footprint.
      discussion: [
        'Sonically \'The Fate of Ophelia\' is a synth-pop and dance-pop record — critics also heard funk and a new-wave groove, with Fleetwood Mac comparisons — running about 3:46. It opens on a drum roll and minor-key piano before breaking into an upbeat body built on cascading synthesizers, a driving bassline, pedal-steel guitar (Anders Pettersson), Omnichord and keyboards, with Swift singing the verses low and reverbed. Notably, and unlike its album-mate \'Cancelled!\' (which carries a live Swedish string section under Erik Arvinder plus brass), \'Ophelia\' has no strings or horns credited — it is a programmed-plus-band build produced by Swift with Max Martin and Shellback, and carries no credited sample or interpolation. It is also her first single produced with Martin and Shellback since \'Delicate\' (2017).',
        'The title reverses Hamlet: where Shakespeare\'s Ophelia is driven to madness and drowns, here a love that arrives in time pulls the narrator back to shore. Swift framed it as a deliberate flip of a tragic character\'s fate, and the bridge echoes Ophelia\'s line to Laertes in Act 1, scene iii — a memory locked away to which the other holds the key — a documented literary allusion, alongside a self-callback to \'Love Story,\' which likewise handed a Shakespeare tragedy a happy ending. Decoded easter eggs read toward Travis Kelce are confirmed by Swift\'s own framing and by Kelce echoing a lyric on Instagram: a \'keep it one hundred\' line nods to their signature numbers (13 + 87 = 100) and a \'pledge allegiance to your team\' line reads as a Kansas City Chiefs nod. Broader date-motif claims beyond the 13 + 87 sum are fan reading unless separately sourced.',
        'The song generated a large footprint of its own. On release day (Oct. 3, 2025) it set the record for the biggest single-day stream total in Spotify history — roughly 30.99 million streams, the first song ever past 30 million in a day, beating Swift\'s own prior \'Fortnight\' mark. A December 2025 study reported internet searches for \'Ophelia\' spiking about 1,231% above normal and \'Hamlet\' up 66%, and Germany\'s Museum Wiesbaden drew a Swiftie surge to its Ophelia painting, with a Nov. 2, 2025 guided-tour event selling out within hours. As for live history: as of mid-2026 there is no formal, Swift-headlined live performance on record — the Eras Tour had closed in December 2024, the music video premiered inside the theatrical Official Release Party of a Showgirl film (hitting YouTube two days later), and her October 2025 Tonight Show visit was billed as an interview (the episode\'s musical guest was the band The Format), not a staged rendition. The song\'s on-air presence so far has been through others: a Sabrina Carpenter \'Domingo\' parody on SNL (Oct. 18, 2025) and a tango danced to the track on Strictly Come Dancing (Nov. 8, 2025).',
      ],
      discussionSources: [
        wiki('The Fate of Ophelia', 'The_Fate_of_Ophelia', 'song article: personnel/instrumentation, the Hamlet Act 1 sc. iii allusion, streaming record, and search-interest footprint'),
        {
          source_url: 'https://www.today.com/popculture/music/the-fate-of-ophelia-lyrics-meaning-taylor-swift-rcna233770',
          source_title: "'The Fate of Ophelia' Lyrics, Meaning, Explained",
          publisher: 'Today',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: "Swift's stated intent to reverse Ophelia's tragic fate (rescue vs. drowning)",
        },
        {
          source_url: 'https://www.capitalfm.com/news/taylor-swift-fate-of-ophelia-lyrics-meaning-travis-kelce/',
          source_title: "Taylor Swift's 'The Fate of Ophelia' meaning and the Travis Kelce easter eggs",
          publisher: 'Capital FM',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: "the 'keep it one hundred' egg (13 + 87 = 100), echoed by Kelce",
        },
        {
          source_url: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-jimmy-fallon-tonight-show-life-of-a-showgirl-1236394527/',
          source_title: 'Taylor Swift on The Tonight Show',
          publisher: 'The Hollywood Reporter',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'the Tonight Show appearance was an interview/singalong, not a staged live performance (The Format was the musical guest)',
        },
        {
          source_url: 'https://www.billboard.com/music/music-news/snl-domingo-sabrina-carpenter-taylor-swift-fate-of-ophelia-1236092597/',
          source_title: "Domingo Returns to 'SNL' as Sabrina Carpenter Parodies 'The Fate of Ophelia'",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'the SNL rendition was a Carpenter parody, not a Swift performance',
        },
      ],
    },
    {
      slug: 'elizabeth-taylor',
      trackNumber: 2,
      trackTitle: 'Elizabeth Taylor',
      youtubeId: 'WqbJT_vC0rs', // oEmbed-verified official Taylor Swift channel
      release: 'The Life of a Showgirl',
      releaseDate: '2025-10-03',
      writers: WRITERS,
      producers: PRODUCERS,
      note: 'The first song written for the album and, per multiple critics, its emotional centerpiece — an orchestral-pop ballad weighing fame against love.',
      summary:
        'A famous woman compares her own tabloid-scrutinized love life to Elizabeth Taylor\'s, worried success scares men off until she finds one who stays — betting the relationship is worth the gamble either way.',
      inspiration:
        'Swift has said she wrote the refrain in a sudden burst of inspiration and sent Max Martin and Shellback a piano draft before any other song on the album existed; critics including Time and The New Yorker read it as drawing a direct line between her own fame and the actress Elizabeth Taylor\'s.',
      themes: ['fame and romance', 'self-doubt', 'legacy'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Elizabeth_Taylor_(song)',
      sources: [
        wiki('Elizabeth Taylor (song)', 'Elizabeth_Taylor_(song)', 'song article: writing background and critical reception'),
        ALBUM,
      ],
    },
    {
      slug: 'opalite',
      trackNumber: 3,
      trackTitle: 'Opalite',
      youtubeId: '1FVF-9KQiPo', // oEmbed-verified official Taylor Swift channel
      release: 'The Life of a Showgirl',
      releaseDate: '2025-10-03',
      writers: WRITERS,
      producers: PRODUCERS,
      isSingle: true,
      note: 'A sunny, synth-pop track three that became the album\'s second Hot 100 No. 1 in February 2026.',
      summary:
        'A happiness the narrator built herself, named for a man-made stone — joy as something manufactured on purpose rather than found by luck.',
      inspiration:
        'Swift has not named the song\'s subject; the widely repeated fan and critic reading ties opal to October (Travis Kelce\'s birth month) and frames the "opalite" of the title as synthetic, self-made contentment. That reading is fan/critic interpretation, not a confirmed statement from Swift.',
      themes: ['self-made happiness', 'contentment', 'track-three optimism'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
      sources: [ALBUM],
    },
    {
      slug: 'father-figure',
      trackNumber: 4,
      trackTitle: 'Father Figure',
      youtubeId: '98SmlWOKuME', // oEmbed-verified official Taylor Swift channel
      release: 'The Life of a Showgirl',
      releaseDate: '2025-10-03',
      writers: [...WRITERS, 'George Michael'],
      producers: PRODUCERS,
      note: 'Built around an interpolation of George Michael\'s 1987 song of the same name, cleared with his estate before release.',
      summary:
        'The title\'s "father figure" language gets repurposed as music-industry patronage — a mentor or backer whose protégé eventually outgrows them.',
      inspiration:
        'Swift approached George Michael\'s estate for clearance ahead of release; the estate said it had "no hesitation" and believed Michael "would have felt the same," one of the warmest legacy-artist endorsements of any of her interpolations.',
      themes: ['mentorship', 'industry power dynamics', 'outgrowing a patron'],
      sourceUrl: 'https://www.rollingstone.com/music/music-news/george-michael-taylor-swift-father-figure-song-1235439835/',
      sources: [
        ALBUM,
        {
          source_url: 'https://www.rollingstone.com/music/music-news/george-michael-taylor-swift-father-figure-song-1235439835/',
          source_title: "'No Hesitation': George Michael's Estate 'Delighted' Over Taylor Swift Using 'Father Figure'",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: ACCESSED,
          reliability_score: 4,
          notes: 'estate clearance and statement',
        },
      ],
      // Depth ledger #1398 (2026-07-24): chart line, interpolation mechanics,
      // production/personnel, the industry-patron reading, monologue structure,
      // reception, and live status.
      discussion: [
        'The George Michael element is an interpolation — a newly performed replay, not a lifted master sample — which is why George Michael is credited as a co-writer; what carries over is the \'I\'ll be your father figure\' hook and its melody, rebuilt into Swift\'s own orchestral-pop bed. Michael\'s estate publicly blessed it, saying it had \'no hesitation\' and that George \'would have felt the same,\' one of the warmest legacy-artist endorsements of any Swift interpolation (the fuller rights-and-clearance account lives on the \'Father Figure rebuilds George Michael\'s hit\' moment page). Produced by Swift with Max Martin and Shellback like the rest of the record, the track names a notable roster of Swedish session players on its orchestral section — Mattias Bylund (Hammond organ and orchestra arrangements), David Bukovinsky (cello), Erik Arvinder and a violin section, Tomas Jonsson (clarinet), Johan Randén (electric guitar) and Stefan Wingefors (upright bass) — mixed by Serban Ghenea and mastered by Randy Merrill.',
        'It debuted and peaked at No. 4 on the Billboard Hot 100 during the Oct. 18, 2025 week — the first time any artist held the chart\'s entire top 12, all from one album, led by \'The Fate of Ophelia\' at No. 1 (see the top-12-sweep and album-release moment pages) — and reached No. 4 on the Billboard Global 200 with top-five positions across Australia, Canada, Germany, New Zealand and Sweden. Critics widely read the song\'s \'father figure\' as music-industry patronage — a mentor or backer whose protégé outgrows him — and Rolling Stone wrote that \'all signs point to Scott Borchetta,\' the Big Machine founder who signed Swift at 15 and later sold her masters to Scooter Braun, kicking off the six-year ownership battle she closed by buying the catalog back in 2025. Swift did not name a subject but, in the Official Release Party of a Showgirl film, said she \'can relate to both characters,\' framing it as shifting mentor-and-protégé power; that identification stays a critics\' reading of a documented business dispute, not a confirmed statement.',
        'Reviewers described the track as opening in the voice of the patron figure — a self-mythologizing, Godfather-style monologue built on a \'protect the family\' motif — before the bridge flips perspective back to Swift\'s own voice as the one who ultimately outmaneuvered him and becomes the \'father figure\' herself (write-ups frame this as a sung perspective device rather than confirmed spoken-word audio). It was one of the album\'s most-praised cuts: Pitchfork\'s Shaad D\'Souza called it \'a standout\' and Swift\'s \'most straightforward appraisal of her own power,\' the New York Times\'s Jon Caramanica heard \'cool nerve\' like \'an assassin acquiring her target,\' and Variety\'s Chris Willman tied it to her \'lingering capacity for pure vituperation,\' while The Guardian\'s Alexis Petridis was cooler, judging its \'spiky lines\' as ones that \'don\'t really click.\' As of July 2026 Swift has not performed \'Father Figure\' live or in any TV/promo booking — there is no tour behind the album.',
      ],
      discussionSources: [
        wiki('Father Figure (Taylor Swift song)', 'Father_Figure_(Taylor_Swift_song)', 'song article: interpolation classification, personnel, chart peaks, and reception aggregation'),
        {
          source_url: 'https://theconversation.com/taylor-swifts-father-figure-isnt-a-cover-but-an-interpolation-what-that-means-and-why-it-matters-265583',
          source_title: "Taylor Swift's 'Father Figure' isn't a cover but an interpolation — what that means",
          publisher: 'The Conversation',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: 'interpolation vs. sample: re-performed material, recognizable but newly recorded',
        },
        {
          source_url: 'https://www.rollingstone.com/music/music-news/taylor-swift-father-figure-meaning-scott-borchetta-1235440894/',
          source_title: "The Meaning of Taylor Swift's 'Father Figure'",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: "the Scott Borchetta industry-patron reading and Swift's 'I can relate to both characters' comment; labeled as reading, not confirmation",
        },
        {
          source_url: 'https://www.billboard.com/lists/taylor-swift-hot-100-fate-of-ophelia-number-one/',
          source_title: "Taylor Swift Takes Top 12 Spots on Billboard Hot 100, Led by 'The Fate of Ophelia'",
          publisher: 'Billboard',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: "the top-12 sweep week in which 'Father Figure' debuted at No. 4",
        },
      ],
    },
    {
      slug: 'eldest-daughter',
      trackNumber: 5,
      trackTitle: 'Eldest Daughter',
      youtubeId: 'HwQnW_ZRKhc', // oEmbed-verified official Taylor Swift channel
      release: 'The Life of a Showgirl',
      releaseDate: '2025-10-03',
      writers: WRITERS,
      producers: PRODUCERS,
      note: 'The album\'s track five and its longest song at 4:06 — a slot fans expect to hurt that instead resolves into reassurance.',
      summary:
        'A meditation on "eldest daughter syndrome" — the firstborn\'s instinct to hold everything together for everyone else — that lands on being cared for rather than being wrecked.',
      inspiration:
        'Time\'s track-five analysis read the song as a deliberate break from her own pattern of sequencing the most vulnerable song fifth: a track five that, for the first time, ends in reassurance instead of grief.',
      themes: ['eldest daughter syndrome', 'caretaking', 'track-five tradition, broken'],
      sourceUrl: 'https://time.com/7322849/taylor-swift-eldest-daughter-the-life-of-a-showgirl-track-5/',
      sources: [
        {
          source_url: 'https://time.com/7322849/taylor-swift-eldest-daughter-the-life-of-a-showgirl-track-5/',
          source_title: "Making Sense of 'Eldest Daughter,' Taylor Swift's Emotional The Life of a Showgirl Track 5",
          publisher: 'Time',
          source_type: 'reputable_press',
          accessed_at: ACCESSED,
          reliability_score: 4,
          notes: 'track-five sequencing analysis',
        },
        ALBUM,
      ],
      // Depth ledger #1325 (2026-07-24): production, chart, the marriage-reversal
      // and anti-persona lines, reception, live status, Swift's own words, eggs.
      discussion: [
        'Recorded in Sweden with Max Martin and Shellback during breaks between Eras Tour stops — tracked at MXM Studios and Shellback Studios in Stockholm, mixed at MixStar and mastered at Sterling Sound — \'Eldest Daughter\' is the record\'s deliberate outlier: a soft-rock piano ballad over piano and simple acoustic guitar, and at 4:06 the album\'s longest song, a slower and sparser confessional set against the album\'s pop-forward production. It debuted and peaked at No. 9 on the Billboard Hot 100 in the Oct. 18, 2025 top-12 sweep, drawing 49.2 million official US streams in its opening week.',
        'Its most-discussed lines cut against a public persona. One reverses a stance she had projected — that when she said she did not believe in marriage, \'that was a lie\' — turning skepticism into a private vow; outlets including Today and Rolling Stone read it against her then-newly-announced engagement to Travis Kelce (and the song\'s youngest-child imagery, Kelce being a youngest child), a reading attributed to them rather than confirmed by Swift. Another, \'But I\'m not a bad bitch, and this isn\'t savage,\' is the album\'s most-quoted line; critics heard it as shedding a performed, internet-culture toughness and \'dropping artifice,\' though the specific framing of it as a rebuke of her Reputation-era image is fan interpretation, not a sourced Swift or critic statement.',
        'Reception was polarized: Variety\'s Chris Willman called it \'one of the prettiest songs Swift has ever written\' and Rolling Stone\'s Maya Georgi singled out its \'brutal admissions\' as the successor to Swift\'s most devastating track-fives, while Rolling Stone\'s Rob Sheffield judged it \'her most divisive Track 5 ever\' and some outlets mocked its slang. Swift explained it herself in an Amazon Music track-by-track (relayed via Capital FM and Heart) as \'a love song about the roles we play in our public lives\' that turns on the moment \'someone gets close enough to you to earn your trust.\' Fans have noted callbacks to earlier songs — \'You\'re On Your Own, Kid,\' \'Mirrorball,\' \'Lavender Haze\' and \'White Horse\' — but those are fan-noted rather than Swift-confirmed, and while Swift has confirmed the track-five vulnerable-song tradition in general, she has not tied specific hidden references to this song. As of mid-2026 it remains unperformed live (an acoustic studio version arrived Nov. 7, 2025 on the album\'s Acoustic Collection, but that is a recording, not a live outing).',
      ],
      discussionSources: [
        wiki('Eldest Daughter', 'Eldest_Daughter', 'song article: recording/mixing/mastering, ballad style, No. 9 debut, and reception'),
        {
          source_url: 'https://www.rollingstone.com/music/music-album-reviews/taylor-swift-the-life-of-a-showgirl-album-review-1235439733/',
          source_title: 'Taylor Swift, The Life of a Showgirl: Album Review',
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: "Maya Georgi on the track's 'brutal admissions' and the marriage-reversal line",
        },
        {
          source_url: 'https://variety.com/2025/music/album-reviews/taylor-swift-album-review-life-of-a-showgirl-1236537532/',
          source_title: 'Taylor Swift Album Review: The Life of a Showgirl',
          publisher: 'Variety',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: "Chris Willman: 'one of the prettiest songs Swift has ever written'",
        },
        {
          source_url: 'https://www.capitalfm.com/news/taylor-swift-eldest-daughter-lyrics-meaning/',
          source_title: "Taylor Swift's 'Eldest Daughter' lyrics and meaning",
          publisher: 'Capital FM',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: "Swift's Amazon Music track-by-track explanation ('the roles we play in our public lives')",
        },
      ],
    },
    {
      slug: 'ruin-the-friendship',
      trackNumber: 6,
      trackTitle: 'Ruin the Friendship',
      youtubeId: 'WQCPl5rTMDQ', // oEmbed-verified official Taylor Swift channel
      release: 'The Life of a Showgirl',
      releaseDate: '2025-10-03',
      writers: WRITERS,
      producers: PRODUCERS,
      note: 'A regret ballad about a high-school-era almost-romance, closing on a funeral verse that fans trace to a real classmate.',
      summary:
        'The narrator looks back on a friendship she never risked turning into something more, wishing she\'d kissed her friend while there was still time.',
      inspiration:
        'Swift has not named the song\'s subject. Fans have connected it to a classmate, Jeff Lang, who died in 2010 — a reading built on public record (Swift sang at a friend\'s funeral in 2010 and thanked "Jeff Lang" from a 2010 BMI Country Awards stage), but not a statement Swift has confirmed.',
      themes: ['regret', 'unspoken feelings', 'loss'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Ruin_the_Friendship',
      sources: [
        wiki('Ruin the Friendship', 'Ruin_the_Friendship', 'song article: fan-traced background, labeled as interpretation'),
        ALBUM,
      ],
      // Depth ledger #1345 (2026-07-24): production/sound, chart + certs,
      // reception, live status, and Swift's own writing framing.
      discussion: [
        'Despite the \'regret ballad / funeral verse\' framing, \'Ruin the Friendship\' is not a stark piano ballad: written and produced by Swift with Max Martin and Shellback in the 2024 Stockholm sessions (cut between European Eras Tour dates), engineered by Lasse Mårtén, mixed by Serban Ghenea and mastered by Randy Merrill, it runs 3:40 and is classed as country-pop with teen-pop and 1990s-country touches, built on a full band arrangement (piano, keyboards, bass, drums, guitar, percussion, banjo guitar and synths) with an \'80s-soft-rock groove — NPR flagged a Motown-evoking bassline. Its weight comes from the lyric and the devastating closing verse critics single out rather than from sparse instrumentation.',
        'In the album\'s historic top-12 Hot 100 lockout, \'Ruin the Friendship\' debuted and peaked at No. 11, and reached No. 12 on the Billboard Global 200, No. 11 in Australia and Canada and No. 12 in New Zealand and Sweden; it has been certified Platinum in Canada and Brazil, Gold in Australia and New Zealand, and Silver in the UK. Critics repeatedly named it a standout: the BBC\'s Nick Savage called it the album\'s best song and its closing verse \'heart-wrenching,\' Billboard\'s Jason Lipshutz also picked it as the album\'s best, writing that it \'bridges Swift\'s past and present as a songwriter,\' Variety\'s Chris Willman called it \'one of the prettiest songs Swift had written\' and The Guardian\'s Alexis Petridis \'authentically heart-tugging\' — while dissenters (the Telegraph\'s Poppie Platt, Consequence\'s Wren Graves) faulted it as slight.',
        'Swift explained the song in her own album commentary as one that \'wistfully goes back in time to moments that you hesitated,\' the fear that telling or kissing a friend \'might ruin the friendship\' — \'a beautiful story of taking chances\' whose closing turn is the news that the friend has since died. Those confirmed remarks establish the regret theme but do not name anyone; the widely repeated tie to a specific late Hendersonville classmate remains a fan reading built on public record, not a Swift confirmation, and the fuller biographical account lives on the \'Ruin the Friendship — a regret from Hendersonville High\' moment page. No documented Swift statement explains the track-6 placement, and as of mid-2026 — with no tour attached to the album — there is no record of any live, televised, or surprise-song performance of the song.',
      ],
      discussionSources: [
        wiki('Ruin the Friendship', 'Ruin_the_Friendship', 'song article: run-time, genre/credits, chart peaks, certifications, and reception roundup'),
        {
          source_url: 'https://www.taylorswift.com/tloasacousticcredits/',
          source_title: 'The Life of a Showgirl — Acoustic Credits',
          publisher: 'TaylorSwift.com',
          source_type: 'official',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'official credits confirming Swift/Max Martin/Shellback authorship and production',
        },
        {
          source_url: 'https://variety.com/2025/music/news/taylor-swift-hot-100-history-12-songs-showgirl-chart-1236551607/',
          source_title: "Taylor Swift Makes Hot 100 History Taking All of Chart's Top 12 Spots",
          publisher: 'Variety',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'the top-12 lockout context in which the song debuted at No. 11',
        },
        {
          source_url: 'https://www.officialcharts.com/songs/taylor-swift-ruin-the-friendship/',
          source_title: 'Ruin the Friendship — Taylor Swift — Official Charts',
          publisher: 'Official Charts Company',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'UK chart entry / certification basis',
        },
      ],
    },
    {
      slug: 'actually-romantic',
      trackNumber: 7,
      trackTitle: 'Actually Romantic',
      youtubeId: 'FnEg1RgmqO4', // oEmbed-verified official Taylor Swift channel
      release: 'The Life of a Showgirl',
      releaseDate: '2025-10-03',
      writers: WRITERS,
      producers: PRODUCERS,
      note: 'One of the album\'s shortest and most-argued-about tracks — Swift\'s own intro frames it as about someone with a one-sided grudge against her.',
      summary:
        'The narrator reframes a rival\'s hostility as a backhanded compliment: living rent-free in someone\'s head, spun as flattery instead of an attack.',
      inspiration:
        'Swift described the song as being about realizing someone else has had "a one-sided adversarial relationship" with her. She never names a subject; critics and fans near-unanimously read it as a response to Charli XCX\'s "Sympathy Is a Knife," a reading Swift has not confirmed.',
      themes: ['perceived rivalry', 'reframing hostility', 'pop-feud subtext'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Actually_Romantic',
      sources: [
        wiki('Actually Romantic', 'Actually_Romantic', 'song article: intro quote and feud interpretation, labeled as such'),
        ALBUM,
      ],
    },
    {
      slug: 'wish-list',
      trackNumber: 8,
      trackTitle: 'Wish List',
      youtubeId: 'wqgUzLHgNMI', // oEmbed-verified official Taylor Swift channel
      release: 'The Life of a Showgirl',
      releaseDate: '2025-10-03',
      writers: WRITERS,
      producers: PRODUCERS,
      note: 'Written last, described by Swift as the album\'s "final piece" — a companion to "Elizabeth Taylor" on what love adds to a life already full of career wins.',
      summary:
        'A tally of things other people chase — fame, houses, headlines — set against the one thing on the narrator\'s own list: a stable, loving partner.',
      inspiration:
        'Swift has said "Wish List" was the last song written for the album, calling it the final piece that completed the record\'s picture of love as something that enhances an already-full life rather than completing an empty one.',
      themes: ['priorities', 'love versus ambition', 'contentment'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Wish_List_(song)',
      sources: [ALBUM],
      // Depth ledger #1158 (2026-07-24): the writing story, sound + personnel,
      // what the list enumerates, chart debut + certs, reception, live axis.
      discussion: [
        'Written last, "Wi$h Li$t" is the album\'s "final piece": Swift said finishing it felt like "Oh, we\'re done… this is the final piece," and guessed it might be her favorite, calling it "a really dreamy… really romantic song." Cut with Max Martin and Shellback during the 2024 Sweden sessions, it is a 1980s-leaning synth-pop power ballad — 3:27, chiming synths and a pedal steel from Anders Pettersson under Swift\'s upper register; the LA Times\' Mikael Wood called the production "electro-trappy" and the AP likened it to Midnights.',
        'The lyric tallies the things other people chase — a yacht under chopper blades, bright lights, Balenciaga shades, a Palme d\'Or, an Oscar, "a contract with Real Madrid" — before landing on the narrator\'s own smaller wish: a partner, kids, "a driveway with a basketball hoop." Some critics read that domestic turn as a "tradwife" fantasy, a framing others rejected as missing the point. It debuted and peaked at No. 6 on the Billboard Hot 100 in the twelve-track sweep, reached No. 7 on the Global 200 and the top 10 in Australia, Canada and New Zealand, and was certified Platinum in Canada, Gold in Australia and New Zealand, and Silver in the UK.',
        'Reviews ran warmer than for the album\'s louder cuts: Rolling Stone\'s Rob Sheffield called it a "beautifully candid love song" that "cleverly mock[s] a whole litany of selfish fantasies… without quite renouncing any of them," hearing an echo of Joni Mitchell; The Guardian\'s Alexis Petridis read its "suburban domestic contentment" as Swift growing older alongside the fans who once heard themselves in "Fifteen"; the NYT\'s Lindsay Zoladz called it "dreamy" and Esquire\'s Alan Light "pleasant but minor." With no tour behind the album, Swift has not performed "Wi$h Li$t" live as of mid-2026.',
      ],
      discussionSources: [
        wiki('Wish List (song)', 'Wish_List_(song)', 'song article: personnel, chart peaks, certifications, and reception'),
        {
          source_url: 'https://variety.com/2025/music/news/taylor-swift-hot-100-history-12-songs-showgirl-chart-1236551607/',
          source_title: 'Taylor Swift Makes Hot 100 History Taking All of Chart\'s Top 12 Spots',
          publisher: 'Variety',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Wi$h Li$t at No. 6 in the sweep',
        },
        {
          source_url: 'https://www.heart.co.uk/showbiz/taylor-swift-wish-list-meaning/',
          source_title: "Taylor Swift's 'Wi$h Li$t' meaning: the last song written for the album",
          publisher: 'Heart',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: 'Swift\'s "final piece" / favorite-song quotes',
        },
        {
          source_url: 'https://www.rollingstone.com/music/music-lists/taylor-swift-songs-ranked-rob-sheffield-201800/wih-lit-2025-1235440072/',
          source_title: "Taylor Swift's 'Wi$h Li$t,' in Rob Sheffield's ranking",
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Sheffield: "beautifully candid love song"',
        },
        {
          source_url: 'https://www.theguardian.com/music/2025/oct/03/taylor-swift-the-life-of-a-showgirl-review',
          source_title: 'Taylor Swift: The Life of a Showgirl review',
          publisher: 'The Guardian',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Alexis Petridis on the "suburban domestic contentment" reading',
        },
        {
          source_url: 'https://www.today.com/popculture/music/wish-list-lyrics-meaning-taylor-swift-rcna234286',
          source_title: "Taylor Swift's 'Wi$h Li$t' Lyrics, Explained",
          publisher: 'Today',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: 'the enumerated wish-list items',
        },
      ],
    },
    {
      slug: 'wood',
      trackNumber: 9,
      trackTitle: 'Wood',
      youtubeId: '6m50keINEOI', // oEmbed-verified official Taylor Swift channel
      release: 'The Life of a Showgirl',
      releaseDate: '2025-10-03',
      writers: WRITERS,
      producers: PRODUCERS,
      note: 'A horn-driven disco track exploring the playful, superstitious side of a happy relationship — and the album\'s most-talked-about song for its winking double entendres.',
      summary:
        'A giddy, knock-on-wood ode to a good thing the narrator is almost afraid to jinx by naming it directly.',
      inspiration:
        'Swift told Jimmy Fallon the song started somewhere innocent — an idea about knock-on-wood superstition — and only turned cheeky once she and her collaborators got in the studio; critics filed its live-horn, disco-leaning sound alongside "Honey" as the album\'s genre-experiment pocket. It debuted at No. 5 on the Billboard Hot 100 in the week all twelve album tracks charted at once.',
      themes: ['superstition', 'playful love', 'disco influence'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Wood_(song)',
      sources: [ALBUM],
      // Depth ledger #1137 (2026-07-24): craft/personnel, chart run + certs,
      // critical reception, the Fallon origin, and live-history axis.
      discussion: [
        'Musically "Wood" is the album\'s disco outlier — a horn-driven funk-pop and synth-funk track built on a chicken-scratch guitar riff and a live brass section, its 1960s-Motown lean clocking in at just 2:30. The Stockholm sessions stacked it with real players rather than programmed horns: flugelhorns from Janne Bjerger and Magnus Johansson, Peter "Noos" Johansson on trombone, baritone sax and flute from Tomas Jonsson and Wojtek Goral, with Andreas Andersson arranging the horns and Mattias Bylund the strings; Serban Ghenea mixed and Randy Merrill mastered. Swift, Max Martin and Shellback are the only credited writers and producers.',
        'Swift told The Tonight Show (Oct. 7, 2025) she had first imagined it as an "innocent," "throwback kind of timeless-sounding song" about knock-on-wood superstition, and that the lyrics only turned racier once she and her collaborators got into the studio — the winking double entendres that made it the album\'s most-talked-about cut. On the Billboard Hot 100 it debuted at No. 5 during the week all twelve Showgirl tracks swept the top 12, and No. 5 stayed its peak; it hit No. 5 in Australia and Canada, No. 6 on the Global 200 and in New Zealand, and No. 10 on the UK streaming chart, later certified Platinum in Canada, Gold in Australia and New Zealand, and Silver in the UK.',
        'Critics were unusually harsh on the innuendo: Pitchfork\'s Anna Gaca likened it to the "spiritual energy of a bachelorette-party" décor, Clash\'s Lauren Hague called the vocal "gutsy" but the lyrics "cringe," The A.V. Club\'s Mary Kate Carr heard an unconvincing Sabrina Carpenter impression, and Paste listed it among 2025\'s worst songs; Stereogum\'s Tom Breihan was a rare defender, and Nicki Minaj publicly cheered the track. Fans clocked the "new heights of manhood" line as a nod to the Kelce brothers\' New Heights podcast. As of mid-2026 Swift has not performed "Wood" live — there is no tour behind the album.',
      ],
      discussionSources: [
        wiki('Wood (song)', 'Wood_(song)', 'song article: personnel, chart peaks, certifications, and reception roundup'),
        {
          source_url: 'https://variety.com/2025/music/news/taylor-swift-hot-100-history-12-songs-showgirl-chart-1236551607/',
          source_title: 'Taylor Swift Makes Hot 100 History Taking All of Chart\'s Top 12 Spots',
          publisher: 'Variety',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'the Nos. 1-12 sweep; Wood at No. 5',
        },
        {
          source_url: 'https://www.today.com/popculture/music/wood-lyrics-meaning-taylor-swift-travis-kelce-rcna234285',
          source_title: "Taylor Swift's 'Wood' Lyrics, Explained",
          publisher: 'Today',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: 'Fallon origin ("innocent" superstition song) and the New Heights easter egg',
        },
        {
          source_url: 'https://pitchfork.com/reviews/albums/taylor-swift-the-life-of-a-showgirl/',
          source_title: 'Taylor Swift: The Life of a Showgirl',
          publisher: 'Pitchfork',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Anna Gaca album review, the "bachelorette-party" line',
        },
        {
          source_url: 'https://www.clashmusic.com/reviews/taylor-swift-the-life-of-a-showgirl/',
          source_title: 'Taylor Swift - The Life of a Showgirl',
          publisher: 'Clash',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: 'Lauren Hague: "gutsy" vocal, lyrics "border on the cringe"',
        },
      ],
    },
    {
      slug: 'cancelled',
      trackNumber: 10,
      trackTitle: 'Cancelled!',
      youtubeId: 'F-5XoUZ42Tc', // oEmbed-verified official Taylor Swift channel
      release: 'The Life of a Showgirl',
      releaseDate: '2025-10-03',
      writers: WRITERS,
      producers: PRODUCERS,
      note: 'A pointed look at "cancel culture" and public judgment, doubling as a loyalty pledge to friends who\'ve been through it.',
      summary:
        'The narrator stands by friends the public has turned on, questioning how quickly online judgment forms and how selectively it gets applied.',
      inspiration:
        'Coverage of the album described "Cancelled!" as addressing predatory industry behavior and the public\'s appetite for celebrity downfall, narrated in part from the viewpoint of characters the public has judged.',
      themes: ['cancel culture', 'loyalty', 'public judgment'],
      sourceUrl: 'https://en.wikipedia.org/wiki/CANCELLED!',
      sources: [ALBUM],
      // Depth ledger #1146 (2026-07-24): production/construction, Swift's own
      // framing, chart debut, divisive reception, documented callbacks, live axis.
      discussion: [
        'Built by Swift with Max Martin and Shellback, "Cancelled!" pairs an electropop core with pop-punk and grunge edges — a 1990s indie-rock guitar intro, a live Swedish string section conducted by violinist Erik Arvinder, and brass, across 3:31, with no credited sample. In the Official Release Party film Swift framed it from her own history of "mass judgment": being canceled, she said, "is something everyone goes through now… it\'s not just a public-figure type thing," adding that people who face backlash "tend to reach out" to her and that she now judges others "based on who I know them to be… not some kind of general consensus where people are like, \'Step away! They\'re radioactive.\'"',
        'The track debuted at No. 10 on the Billboard Hot 100 — the low end of the album\'s Nos. 1–12 sweep the week of Oct. 18, 2025 — and charted in the top 10 of the streaming-driven charts in Canada, Australia and the UK. Its "standing by cancelled friends" conceit sent outlets cataloguing fan theories about which public figures who had weathered backlash it might defend; Swift has confirmed none, and those readings stay unverified reader interpretation rather than fact.',
        'Reception split sharply. Pitchfork\'s Anna Gaca dismissed it as "a swagless \'Look What You Made Me Do,\'" Exclaim!\'s Megan LaPierre called it "the ugly stepsister of \'Vigilante Shit\'" that trivializes real cancellation, and Beats Per Minute\'s John Wohlmacher found it "oddly derivative"; on the other side Billboard\'s Jason Lipshutz praised Swift "transforming her wounds into an icy resolve," and Collider ranked it the album\'s second-best track. Those "Look What You Made Me Do" and "Vigilante Shit" comparisons — plus critics\' links back to her 2016 reputation-era backlash — are the documented catalog callbacks; broader ties fans draw to "mad woman" or "This Is Why We Can\'t Have Nice Things" are unconfirmed. No live or televised performance of "Cancelled!" is on record as of mid-2026.',
      ],
      discussionSources: [
        wiki('CANCELLED!', 'CANCELLED!', 'song article: composition, international peaks, and reception aggregation'),
        {
          source_url: 'https://www.hollywoodreporter.com/music/music-news/taylor-swift-the-life-of-a-showgirl-billboard-debut-1236399004/',
          source_title: 'Taylor Swift Sweeps the Hot 100 With The Life of a Showgirl',
          publisher: 'The Hollywood Reporter',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'debut order of the Nos. 1-12 sweep; "Cancelled" at No. 10',
        },
        {
          source_url: 'https://pitchfork.com/reviews/albums/taylor-swift-the-life-of-a-showgirl/',
          source_title: 'Taylor Swift: The Life of a Showgirl',
          publisher: 'Pitchfork',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Anna Gaca: "a swagless \'Look What You Made Me Do\'"',
        },
        {
          source_url: 'https://exclaim.ca/music/article/taylor-swift-the-life-of-a-showgirl-album-review',
          source_title: 'Taylor Swift - The Life of a Showgirl',
          publisher: 'Exclaim!',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: 'Megan LaPierre: "the ugly stepsister of \'Vigilante Shit\'"',
        },
        {
          source_url: 'https://www.marieclaire.co.uk/celebrity-news/taylor-swift-on-cancelled-song-meaning',
          source_title: "Taylor Swift on the meaning of 'Cancelled!'",
          publisher: 'Marie Claire UK',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: "Swift's on-record framing from the release-party film",
        },
      ],
    },
    {
      slug: 'honey',
      trackNumber: 11,
      trackTitle: 'Honey',
      youtubeId: '4-EzK5UB40U', // oEmbed-verified official Taylor Swift channel
      release: 'The Life of a Showgirl',
      releaseDate: '2025-10-03',
      writers: WRITERS,
      producers: PRODUCERS,
      note: 'One of the earliest songs written for the album, an R&B-leaning track with horn arrangements that Swift said confirmed she was exploring new sonic ground.',
      summary:
        'A term of endearment turned into a small act of trust — softness offered on purpose after a run of songs about armor and image.',
      inspiration:
        'Swift has said "Honey" was among the first tracks written for the record and that finishing it convinced her the album was heading somewhere new stylistically, pairing it with "Wood" as the record\'s genre-experiment duo.',
      themes: ['tenderness', 'genre experimentation', 'trust'],
      sourceUrl: 'https://en.wikipedia.org/wiki/Honey_(Taylor_Swift_song)',
      sources: [ALBUM],
      // Depth ledger #1155 (2026-07-24): sonic specifics + personnel, Swift's
      // on-record account, chart debut + certs, critical reception, live axis.
      discussion: [
        'One of the first songs Swift wrote for the record, "Honey" is a 3:01 country-pop and synth-pop ballad with an R&B lean — cascading piano, a stuttering trap and hip-hop beat, and an arrangement of clarinet, banjo, flute and Wurlitzer. Rolling Stone\'s Maya Georgi heard "a sultry reclamation carried by both a Speak Now-style banjo and hip-hop beat from 1989, as a Midnights-esque Wurlitzer twinkles," while The Independent\'s Roisin O\'Connor called it a "hybrid of Reputation and Folklore." Mattias Bylund arranged and recorded the brass, with Peter "Noos" Johansson on trombone and tuba; Serban Ghenea mixed.',
        'At the Official Release Party event Swift said "Honey" was "one of the first songs that we made for this record… when we knew we were really going into new territory," the track that "made us feel like, \'Oh, this is a whole new album, yes, let\'s follow this.\'" She tied the title to pet names once used against her — "\'You can\'t pull that off, honey\'" — reclaimed here by a partner who means it kindly. Press widely read the song as about Travis Kelce, but Swift\'s on-record comments describe the concept, not a named subject.',
        'On its debut week "Honey" closed the album\'s Hot 100 sweep at No. 12 (No. 13 on the Global 200), later certified Platinum in Canada and Gold in Australia and New Zealand; no U.S. RIAA certification for the track has been reported. Critics made it a quiet favorite: The New York Times\' Lindsay Zoladz named it one of her two best on the album, Pitchfork\'s Anna Gaca called it "quite sweet" and a highlight for its live instrumentation, Stereogum flagged "one of the stickiest earworms," and The New Yorker\'s Amanda Petrusich judged it "arch, delicate, lovely"; the AP\'s Maria Sherman dissented, filing it a "skip." As of mid-2026 it has not been performed live.',
      ],
      discussionSources: [
        wiki('Honey (Taylor Swift song)', 'Honey_(Taylor_Swift_song)', 'song article: liner-note personnel, chart peaks, certifications, reception'),
        {
          source_url: 'https://www.rollingstone.com/music/music-album-reviews/taylor-swift-the-life-of-a-showgirl-album-review-1235439733/',
          source_title: 'Taylor Swift, The Life of a Showgirl: Album Review',
          publisher: 'Rolling Stone',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 4,
          notes: 'Maya Georgi: "a sultry reclamation…"',
        },
        {
          source_url: 'https://www.yahoo.com/entertainment/music/articles/taylor-swift-explains-honey-turns-191515418.html',
          source_title: "Taylor Swift explains how 'Honey' turned the album a new direction",
          publisher: 'Yahoo Entertainment',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 3,
          notes: "Swift's release-party quotes about 'Honey' as the first song",
        },
        {
          source_url: 'https://www.nytimes.com/2025/10/06/arts/music/taylor-swift-the-life-of-a-showgirl-analysis.html',
          source_title: 'Making Sense of Taylor Swift’s The Life of a Showgirl',
          publisher: 'The New York Times',
          source_type: 'reputable_press',
          accessed_at: '2026-07-24',
          reliability_score: 5,
          notes: "Lindsay Zoladz naming 'Honey' a favorite",
        },
      ],
    },
    {
      slug: 'the-life-of-a-showgirl-title-track',
      trackNumber: 12,
      trackTitle: 'The Life of a Showgirl',
      youtubeId: 'OU6362Nggg0', // oEmbed-verified official Taylor Swift channel
      release: 'The Life of a Showgirl',
      releaseDate: '2025-10-03',
      writers: WRITERS,
      producers: PRODUCERS,
      note: 'The closing title track and the album\'s only feature: a duet with Sabrina Carpenter, who opened the Eras Tour\'s Latin America and Australia/Singapore legs before her own breakout.',
      summary:
        'A veteran performer named Kitty passes hard-won stage wisdom to a younger singer studying her — an elder showgirl and a rising one, trading the cost of the spotlight for its rewards.',
      inspiration:
        'Swift has described the title track as telling the story of veteran performer Kitty and a young singer who studies her; casting Sabrina Carpenter — an Eras Tour opening act turned headliner in her own right by the time the album released — mirrors that mentor-to-successor arc.',
      themes: ['showbiz mentorship', 'passing the torch', 'the cost of fame'],
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
      sources: [ALBUM],
    },
];

// Per-song dossiers (issue #440 Phase 1) live in the .dossiers.mjs side file
// to keep this file diffable; attach them by slug. A dossier keyed to a slug
// that doesn't exist here is an authoring typo — fail loudly, not silently.
{
  const slugs = new Set(TRACKS.map((t) => t.slug));
  for (const key of Object.keys(DOSSIERS)) {
    if (!slugs.has(key)) throw new Error(`dossier for unknown track slug: ${key}`);
  }
}

export default {
  eraSlug: 'the-life-of-a-showgirl',
  tracks: TRACKS.map((t) => (DOSSIERS[t.slug] ? { ...t, dossier: DOSSIERS[t.slug] } : t)),
};
