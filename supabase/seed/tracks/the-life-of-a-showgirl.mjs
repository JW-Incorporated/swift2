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
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
      sources: [ALBUM],
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
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
      sources: [ALBUM],
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
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
      sources: [ALBUM],
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
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Life_of_a_Showgirl',
      sources: [ALBUM],
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
