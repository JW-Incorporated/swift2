import type { CluePair, EggLink, EggNode, LensId, ReRecord, Relationship, RunwayLook, StoryBeat } from './types';
import { getEra } from './eras';

/**
 * Cross-era Lens datasets. Names and details are the widely-discussed fan
 * narratives, framed as an independent fan project (not confirmed fact).
 */

/**
 * Presentation metadata for each Thread (formerly "Lens"). The `what` line is
 * the promise we make the instant someone opens a thread — it must answer
 * "where am I and what am I exploring?" in one breath. `hero` reuses era art so
 * a thread feels as rich as an era. `icon` is resolved in the component.
 */
export interface ThreadMeta {
  id: LensId;
  title: string;
  kicker: string;
  what: string;
  hero: string;
}

export const THREADS: ThreadMeta[] = [
  {
    id: 'love-story',
    title: 'Love Story',
    kicker: 'The muses & the heartbreaks',
    what: 'Trace the relationships behind the songs — who each era was written about, and the tracks they left behind.',
    hero: '/eras/lover.png',
  },
  {
    id: 'fashion',
    title: 'The Runway',
    kicker: 'Twelve wardrobes, one story',
    what: 'Walk the runway of every era and watch the looks, colors, and silhouettes tell you who she was becoming.',
    hero: '/eras/1989.png',
  },
  {
    id: 'taylors-version',
    title: "Taylor's Version",
    kicker: 'Owning the masters',
    what: 'Follow the re-recording campaign, album by album, as she reclaims her life’s work one vault at a time.',
    hero: '/eras/red.png',
  },
  {
    id: 'easter-eggs',
    title: 'The Clue Web',
    kicker: 'The secrets she plants',
    what: 'Pull the threads between hidden messages, cryptic dates, and their payoffs — the game she plays with fans across eras.',
    hero: '/eras/midnights.png',
  },
  {
    id: 'hidden-clues',
    title: 'The Decode',
    kicker: 'One clue, one payoff',
    what: 'Take a single hidden clue and decode it — reveal the payoff it was pointing to, and watch the thread stretch across the months between them.',
    hero: '/eras/ttpd.png',
  },
  {
    id: 'the-proposal',
    title: 'The Proposal',
    kicker: 'A love story, in real time',
    what: 'Follow the story from a friendship bracelet to a garden proposal — the sourced, dated moments behind the engagement.',
    hero: '/eras/lover.png',
  },
];

export function getThread(id: LensId): ThreadMeta {
  return THREADS.find((t) => t.id === id) ?? THREADS[0];
}

/** A single dated point on a thread's career-spanning timeline. */
export interface ThreadPoint {
  date: string;
  eraId: string;
  label: string;
}

/**
 * Date-tagged points for a thread, used to render its career-wide density
 * ridge and era-colored ticks. Each thread maps its own dataset onto a shared
 * 2006→now axis.
 */
export function threadPoints(id: LensId): ThreadPoint[] {
  switch (id) {
    case 'love-story':
      return RELATIONSHIPS.map((r) => ({
        date: r.start,
        eraId: r.eraIds[0],
        label: r.name,
      }));
    case 'fashion':
      return RUNWAY_LOOKS.map((l) => ({
        date: getEra(l.eraId).start,
        eraId: l.eraId,
        label: l.name,
      }));
    case 'taylors-version': {
      const pts: ThreadPoint[] = [];
      for (const r of RERECORDS) {
        pts.push({ date: `${r.originalYear}-01-01`, eraId: eraForYear(r.originalYear), label: `${r.album} (original)` });
        if (r.reclaimedYear)
          pts.push({ date: `${r.reclaimedYear}-06-01`, eraId: eraForYear(r.reclaimedYear), label: `${r.album} (Taylor's Version)` });
      }
      return pts;
    }
    case 'easter-eggs':
      return EGG_NODES.map((n) => ({
        date: `${n.year}-06-01`,
        eraId: n.eraId,
        label: n.label,
      }));
    case 'hidden-clues':
      return CLUE_PAIRS.flatMap((c) => [
        { date: c.plant.date, eraId: c.plant.eraId, label: `${c.title} (planted)` },
        { date: c.payoff.date, eraId: c.payoff.eraId, label: `${c.title} (payoff)` },
      ]);
    case 'the-proposal':
      return PROPOSAL_BEATS.map((b) => ({
        date: b.date,
        eraId: b.eraId,
        label: b.title,
      }));
    default:
      return [];
  }
}

/** Best-effort era for a bare year (used by the reclamation timeline). */
function eraForYear(year: number): string {
  const ms = new Date(`${year}-06-01`).getTime();
  // Import-light: rely on getEra via a scan of known eras through RUNWAY_LOOKS.
  const candidates = RUNWAY_LOOKS.map((l) => getEra(l.eraId));
  let best = candidates[0];
  for (const e of candidates) {
    if (new Date(e.start).getTime() <= ms) best = e;
  }
  return best?.id ?? 'debut';
}

export const RELATIONSHIPS: Relationship[] = [
  {
    id: 'rel-1',
    name: 'The Debut Sweetheart',
    start: '2008-01-01',
    end: '2008-12-31',
    eraIds: ['debut', 'fearless'],
    songs: ['Fifteen', 'Fearless'],
    note: 'The high-school romance that colored the earliest songs.',
  },
  {
    id: 'rel-2',
    name: 'The Fearless Actor',
    start: '2008-12-01',
    end: '2009-03-01',
    eraIds: ['fearless'],
    songs: ['Forever & Always', 'The Way I Loved You'],
    note: 'A brief, high-profile romance that ended in real time on the album.',
  },
  {
    id: 'rel-3',
    name: 'The Speak Now Muse',
    start: '2009-10-01',
    end: '2010-01-01',
    eraIds: ['fearless', 'speak-now'],
    songs: ['Back to December', 'Ours'],
    note: 'A rare apology song points back to this one.',
  },
  {
    id: 'rel-4',
    name: 'The Red Heartbreak',
    start: '2010-11-01',
    end: '2011-01-01',
    eraIds: ['speak-now', 'red'],
    songs: ['All Too Well', 'The Moment I Knew', 'Holy Ground'],
    note: 'Brief in months, enormous in catalog impact — the ten-minute epic lives here.',
  },
  {
    id: 'rel-5',
    name: 'The 1989 Whirlwind',
    start: '2012-12-01',
    end: '2013-01-01',
    eraIds: ['red'],
    songs: ['Style', 'Out of the Woods', 'I Know Places'],
    note: 'An on-again off-again romance stitched across the 1989 sessions.',
  },
  {
    id: 'rel-6',
    name: 'The Reputation Love',
    start: '2016-10-01',
    end: '2023-04-01',
    eraIds: ['reputation', 'lover', 'folklore', 'evermore', 'midnights'],
    songs: ['Call It What You Want', 'Lover', 'Peace', 'Sweet Nothing'],
    note: 'The long, private six-year relationship that anchored the middle catalog.',
  },
];

export const RUNWAY_LOOKS: RunwayLook[] = [
  {
    id: 'look-debut',
    eraId: 'debut',
    name: 'Curls & Cowboy Boots',
    description: 'Sundresses, ringlet curls, and well-worn boots — sunlit country Americana.',
    image: '/eras/debut.png',
    shopTags: ['Cowboy boots', 'Sundress', 'Acoustic guitar'],
  },
  {
    id: 'look-fearless',
    eraId: 'fearless',
    name: 'Golden Fairy Tale',
    description: 'Gold sequins and fringe, all shimmer and romance.',
    image: '/eras/fearless.png',
    shopTags: ['Gold sequins', 'Fringe dress'],
  },
  {
    id: 'look-speak-now',
    eraId: 'speak-now',
    name: 'Theatrical Ballgown',
    description: 'Sweeping purple gowns built for enchanted, storybook staging.',
    image: '/eras/speak-now.png',
    shopTags: ['Ballgown', 'Purple velvet'],
  },
  {
    id: 'look-red',
    eraId: 'red',
    name: 'Red Lip Classic',
    description: 'Vintage tailoring, autumn knits, and the signature bold red lip.',
    image: '/eras/red.png',
    shopTags: ['Red lipstick', 'Knit scarf', 'High-waist shorts'],
  },
  {
    id: 'look-1989',
    eraId: '1989',
    name: 'Polaroid Pop',
    description: 'Crop sets, matching separates, and clean pastel minimalism.',
    image: '/eras/1989.png',
    shopTags: ['Crop set', 'Pastel blue', 'Instant camera'],
  },
  {
    id: 'look-reputation',
    eraId: 'reputation',
    name: 'Armored Monochrome',
    description: 'Sharp black bodysuits, snake motifs, high-contrast and defiant.',
    image: '/eras/reputation.png',
    shopTags: ['Black bodysuit', 'Combat boots'],
  },
  {
    id: 'look-lover',
    eraId: 'lover',
    name: 'Pastel Dreamscape',
    description: 'Glitter hearts, ombré pastels, and romance in full color.',
    image: '/eras/lover.png',
    shopTags: ['Sequin blazer', 'Pastel ombré'],
  },
  {
    id: 'look-folklore',
    eraId: 'folklore',
    name: 'Cottagecore Cardigan',
    description: 'Cozy knits, braids, and a muted grayscale forest palette.',
    image: '/eras/folklore.png',
    shopTags: ['Cardigan', 'Prairie dress'],
  },
  {
    id: 'look-evermore',
    eraId: 'evermore',
    name: 'Autumn Flannel',
    description: 'Rust plaid and firelight — folklore’s warmer sister.',
    image: '/eras/evermore.png',
    shopTags: ['Flannel', 'Braided hair'],
  },
  {
    id: 'look-midnights',
    eraId: 'midnights',
    name: 'Midnight Glam',
    description: 'Retro-70s sparkle, deep blues, and jeweled late-night glamour.',
    image: '/eras/midnights.png',
    shopTags: ['Sequin jumpsuit', 'Jewel tones'],
  },
  {
    id: 'look-ttpd',
    eraId: 'ttpd',
    name: 'Ink & Monochrome',
    description: 'Black-and-white restraint, sheer layers, and literary austerity.',
    image: '/eras/ttpd.png',
    shopTags: ['White dress', 'Black tailoring'],
  },
];

export const RERECORDS: ReRecord[] = [
  {
    id: 'rr-debut',
    album: 'Taylor Swift',
    originalYear: 2006,
    reclaimedYear: null,
    vaultTracks: 0,
    note: 'Announced but not yet released as a Taylor’s Version.',
  },
  {
    id: 'rr-fearless',
    album: 'Fearless',
    originalYear: 2008,
    reclaimedYear: 2021,
    vaultTracks: 6,
    note: 'The first reclaimed album — the project’s proof of concept.',
  },
  {
    id: 'rr-speak-now',
    album: 'Speak Now',
    originalYear: 2010,
    reclaimedYear: 2023,
    vaultTracks: 6,
    note: 'Reclaimed with vault tracks fans had waited over a decade to hear.',
  },
  {
    id: 'rr-red',
    album: 'Red',
    originalYear: 2012,
    reclaimedYear: 2021,
    vaultTracks: 9,
    note: 'Home of the ten-minute version that became a cultural event.',
  },
  {
    id: 'rr-1989',
    album: '1989',
    originalYear: 2014,
    reclaimedYear: 2023,
    vaultTracks: 5,
    note: 'The blockbuster pop record reclaimed to record-breaking numbers.',
  },
  {
    id: 'rr-reputation',
    album: 'reputation',
    originalYear: 2017,
    reclaimedYear: null,
    vaultTracks: 0,
    note: 'Widely anticipated but still awaiting its Taylor’s Version.',
  },
];

// ── Easter Egg Web (constellation) ──────────────────────────────────────────
// x/y are normalized 0–100 coordinates for the SVG constellation layout.
// Dataset compiled by an AI research pass and hand-audited (URLs flattened,
// the "Last Kiss / 1:58" fact corrected, over-confident flags demoted).
//
// TODO(jess): two TLOAS nodes have soft sourcing — verify/replace before we
// present them as fact: `egg-tloas-orange-doors` (cites a YouTube news clip)
// and `egg-wood-track-tloas` (cites an Apple Music page, and is a fan theory).

export const EGG_NODES: EggNode[] = [
  {
    id: 'egg-13-debut',
    label: 'Lucky number 13',
    eraId: 'debut',
    year: 2006,
    kind: 'clue',
    detail: 'Taylor starts writing 13 on her hand before shows, calling it her lucky number and seeding a lifelong motif.',
    x: 10,
    y: 15,
    confirmed: true,
    sources: [{ name: 'MTV News', url: 'https://www.mtv.com/news/1628121/taylor-swift-explains-why-13-is-her-lucky-number/' }],
  },
  {
    id: 'egg-capitals-debut',
    label: 'Capitalized lyric codes',
    eraId: 'debut',
    year: 2006,
    kind: 'clue',
    detail: 'The debut album’s liner notes hide messages in randomized capital letters scattered through the printed lyrics.',
    x: 12,
    y: 75,
    confirmed: true,
    sources: [{ name: 'Billboard', url: 'https://www.billboard.com/lists/taylor-swift-liner-notes-secret-messages-decoded/' }],
  },
  {
    id: 'egg-capitals-fearless',
    label: 'Fearless hidden messages',
    eraId: 'fearless',
    year: 2008,
    kind: 'clue',
    detail: 'She continues the hidden-capitals tradition in the Fearless liner notes to drop clues about each song’s inspiration.',
    x: 22,
    y: 75,
    confirmed: true,
    sources: [{ name: 'Billboard', url: 'https://www.billboard.com/lists/taylor-swift-liner-notes-secret-messages-decoded/' }],
  },
  {
    id: 'egg-clock-lastkiss',
    label: 'Last Kiss 1:58 timestamp',
    eraId: 'speak-now',
    year: 2010,
    kind: 'clue',
    detail: '“Last Kiss” references a highly specific time — “lit through the darkness at 1:58” — establishing timestamps as clues.',
    x: 32,
    y: 45,
    confirmed: true,
    sources: [{ name: 'Rolling Stone', url: 'https://www.rollingstone.com/music/music-lists/taylor-swift-best-songs-1234731317/' }],
  },
  {
    id: 'egg-red-burning',
    label: 'Burning red motif',
    eraId: 'red',
    year: 2012,
    kind: 'clue',
    detail: 'The title track anchors her emotional spectrum to color, defining intense love as “burning red.”',
    x: 40,
    y: 30,
    confirmed: true,
    sources: [{ name: 'Pitchfork', url: 'https://pitchfork.com/reviews/albums/taylor-swift-red-taylors-version/' }],
  },
  {
    id: 'egg-13-video-1989',
    label: '1989 13-second teasers',
    eraId: '1989',
    year: 2014,
    kind: 'clue',
    detail: 'Ahead of 1989 she posts 13-second glitching Instagram videos to count down to her livestream announcement.',
    x: 48,
    y: 15,
    confirmed: true,
    sources: [{ name: 'Time', url: 'https://time.com/3103444/taylor-swift-1989-instagram-clues/' }],
  },
  {
    id: 'egg-karma-album-theory',
    label: 'The lost “Karma” album',
    eraId: 'reputation',
    year: 2016,
    kind: 'clue',
    detail: 'A widespread fan theory that a scrapped, orange-toned album called “Karma” was shelved in 2016 before reputation replaced it.',
    x: 52,
    y: 90,
    confirmed: false,
    sources: [{ name: 'Rolling Stone', url: 'https://www.rollingstone.com/music/music-features/taylor-swift-karma-scrapped-album-theory-explained-1234614742/' }],
  },
  {
    id: 'egg-snake-instagram',
    label: 'Cryptic snake videos',
    eraId: 'reputation',
    year: 2017,
    kind: 'clue',
    detail: 'After wiping her social media, she posts three silent, glitched videos of a slithering snake tail.',
    x: 55,
    y: 55,
    confirmed: true,
    sources: [{ name: 'Billboard', url: 'https://www.billboard.com/music/pop/taylor-swift-snake-videos-reputation-timeline-7948958/' }],
  },
  {
    id: 'egg-snake-lwymmd',
    label: 'Snake reclaimed in LWYMMD',
    eraId: 'reputation',
    year: 2017,
    kind: 'payoff',
    detail: 'The “Look What You Made Me Do” video fulfills the snake teasers, with Taylor serving tea atop a throne of serpents.',
    x: 58,
    y: 55,
    confirmed: true,
    sources: [{ name: 'Vogue', url: 'https://www.vogue.com/article/taylor-swift-look-what-you-made-me-do-music-video-hidden-meanings' }],
  },
  {
    id: 'egg-snake-me-mv',
    label: 'Snake turns to butterflies',
    eraId: 'lover',
    year: 2019,
    kind: 'payoff',
    detail: 'The “ME!” video opens on a pink serpent that bursts into butterflies, formally shedding the reputation era.',
    x: 64,
    y: 55,
    confirmed: true,
    sources: [{ name: 'Entertainment Weekly', url: 'https://ew.com/music/2019/04/26/taylor-swift-me-music-video-easter-eggs/' }],
  },
  {
    id: 'egg-color-daylight',
    label: 'Love is golden, not red',
    eraId: 'lover',
    year: 2019,
    kind: 'payoff',
    detail: 'In “Daylight” she resolves the Red-era color motif: “I once believed love would be burning red / but it’s golden.”',
    x: 65,
    y: 30,
    confirmed: true,
    sources: [{ name: 'Rolling Stone', url: 'https://www.rollingstone.com/music/music-album-reviews/taylor-swift-lover-875207/' }],
  },
  {
    id: 'egg-loverhouse-mv',
    label: 'The Lover house',
    eraId: 'lover',
    year: 2019,
    kind: 'clue',
    detail: 'The “Lover” video’s snow-globe house gives each room a color scheme corresponding to a distinct album/era.',
    x: 66,
    y: 45,
    confirmed: true,
    sources: [{ name: 'People', url: 'https://people.com/music/taylor-swift-lover-music-video-easter-eggs-breakdown/' }],
  },
  {
    id: 'egg-man-graffiti',
    label: '“The Man” graffiti wall',
    eraId: 'lover',
    year: 2020,
    kind: 'clue',
    detail: 'A wall in “The Man” lists her first six albums beside a sign reading “Missing: if found return to Taylor Swift.”',
    x: 68,
    y: 65,
    confirmed: true,
    sources: [{ name: 'BBC', url: 'https://www.bbc.com/news/entertainment-arts-51664182' }],
  },
  {
    id: 'egg-cabin-folklore',
    label: 'The folklore cabin',
    eraId: 'folklore',
    year: 2020,
    kind: 'payoff',
    detail: 'The rustic attic room in the Lover house becomes the aesthetic blueprint for the isolated folklore cabin.',
    x: 70,
    y: 45,
    confirmed: true,
    sources: [{ name: 'Vulture', url: 'https://www.vulture.com/2020/11/taylor-swift-folklore-the-long-pond-studio-sessions-review.html' }],
  },
  {
    id: 'egg-string-willow',
    label: 'Golden string destiny',
    eraId: 'evermore',
    year: 2020,
    kind: 'payoff',
    detail: 'The “willow” video introduces a physical golden string, resolving the “invisible string” motif from folklore.',
    x: 72,
    y: 30,
    confirmed: true,
    sources: [{ name: "Harper's Bazaar", url: 'https://www.harpersbazaar.com/culture/art-books-music/a34938637/taylor-swift-willow-music-video-easter-eggs/' }],
  },
  {
    id: 'egg-fearless-tv-scramble',
    label: 'Fearless TV date cipher',
    eraId: 'fearless',
    year: 2021,
    kind: 'payoff',
    detail: 'She kicks off the re-recordings by tweeting a message whose capital letters unscramble to “APRIL NINTH.”',
    x: 74,
    y: 65,
    confirmed: true,
    sources: [{ name: 'Good Morning America', url: 'https://www.goodmorningamerica.com/culture/story/taylor-swift-announces-re-recorded-fearless-album-drops-75825227' }],
  },
  {
    id: 'egg-red-tv-rings',
    label: 'Red TV ring teaser',
    eraId: 'red',
    year: 2021,
    kind: 'payoff',
    detail: 'After months of red emojis and custom “Red” rings, Red (Taylor’s Version) is officially announced.',
    x: 76,
    y: 67,
    confirmed: true,
    sources: [{ name: 'Variety', url: 'https://variety.com/2021/music/news/taylor-swift-red-taylors-version-release-date-1235000109/' }],
  },
  {
    id: 'egg-bejeweled-elevator',
    label: 'Bejeweled elevator buttons',
    eraId: 'midnights',
    year: 2022,
    kind: 'clue',
    detail: 'The “Bejeweled” video’s elevator lights up button 3 (purple, Speak Now) and 5 (blue, 1989), charting the next re-records.',
    x: 78,
    y: 62,
    confirmed: true,
    sources: [{ name: 'Teen Vogue', url: 'https://www.teenvogue.com/story/taylor-swift-bejeweled-music-video-easter-eggs' }],
  },
  {
    id: 'egg-rep-tv-clue-bejeweled',
    label: 'Reputation TV skipped',
    eraId: 'midnights',
    year: 2022,
    kind: 'clue',
    detail: 'Fans note the reputation floor is skipped on the Bejeweled elevator, reading it as a hint about its re-record timing.',
    x: 82,
    y: 72,
    confirmed: false,
    sources: [{ name: 'Teen Vogue', url: 'https://www.teenvogue.com/story/taylor-swift-bejeweled-music-video-easter-eggs' }],
  },
  {
    id: 'egg-13-tracks-midnights',
    label: '13 tracks on Midnights',
    eraId: 'midnights',
    year: 2022,
    kind: 'payoff',
    detail: 'Midnights ships with exactly 13 tracks on the standard edition — a payoff to her lifelong lucky-number constraint.',
    x: 80,
    y: 15,
    confirmed: true,
    sources: [{ name: 'Pitchfork', url: 'https://pitchfork.com/news/taylor-swift-reveals-all-midnights-track-names/' }],
  },
  {
    id: 'egg-midnights-vinyl-clock',
    label: 'Vinyl covers form a clock',
    eraId: 'midnights',
    year: 2022,
    kind: 'payoff',
    detail: 'The back covers of the four Midnights vinyl variants assemble into a working wall clock.',
    x: 84,
    y: 22,
    confirmed: true,
    sources: [{ name: 'Billboard', url: 'https://www.billboard.com/music/music-news/taylor-swift-midnights-vinyl-back-covers-clock-1235140134/' }],
  },
  {
    id: 'egg-speaknow-tv-nashville',
    label: 'Speak Now TV, in purple',
    eraId: 'speak-now',
    year: 2023,
    kind: 'payoff',
    detail: 'Fulfilling the purple button, she announces Speak Now TV in Nashville as the stadium’s bracelets glow deep purple.',
    x: 86,
    y: 60,
    confirmed: true,
    sources: [{ name: 'Rolling Stone', url: 'https://www.rollingstone.com/music/music-news/taylor-swift-announces-speak-now-taylors-version-eras-tour-nashville-1234730248/' }],
  },
  {
    id: 'egg-1989-tv-la',
    label: '1989 TV, in blue',
    eraId: '1989',
    year: 2023,
    kind: 'payoff',
    detail: 'At the final L.A. Eras show she debuts new light-blue gowns to announce 1989 (Taylor’s Version).',
    x: 88,
    y: 66,
    confirmed: true,
    sources: [{ name: 'Los Angeles Times', url: 'https://www.latimes.com/entertainment-arts/music/story/2023-08-09/taylor-swift-1989-taylors-version-eras-tour-sofi-stadium' }],
  },
  {
    id: 'egg-eras-burning-house',
    label: 'Burning the Lover house',
    eraId: 'midnights',
    year: 2023,
    kind: 'payoff',
    detail: 'The Eras Tour backdrop shows the Lover house burning down, closing the ownership-transition arc.',
    x: 82,
    y: 45,
    confirmed: true,
    sources: [{ name: 'The Hollywood Reporter', url: 'https://www.hollywoodreporter.com/news/general-news/taylor-swift-eras-tour-concert-review-1235355415/' }],
  },
  {
    id: 'egg-grammys-two-fingers',
    label: 'Grammys two fingers',
    eraId: 'midnights',
    year: 2024,
    kind: 'clue',
    detail: 'Announcing TTPD at the Grammys she holds up two fingers, which many fans read as hinting at a double album.',
    x: 88,
    y: 82,
    confirmed: false,
    sources: [{ name: 'Cosmopolitan', url: 'https://www.cosmopolitan.com/entertainment/music/a60538356/taylor-swift-two-fingers-clue-meaning/' }],
  },
  {
    id: 'egg-ttpd-timetable-clock',
    label: 'The 2:00 timetable video',
    eraId: 'ttpd',
    year: 2024,
    kind: 'clue',
    detail: 'A promo timetable video from her team lingers on a clock at the 2:00 mark, hinting at a late-night twist.',
    x: 90,
    y: 80,
    confirmed: true,
    sources: [{ name: 'USA Today', url: 'https://www.usatoday.com/story/entertainment/music/2024/04/16/taylor-swift-ttpd-release-timetable/73347101007/' }],
  },
  {
    id: 'egg-ttpd-anthology-drop',
    label: 'The 2 AM Anthology',
    eraId: 'ttpd',
    year: 2024,
    kind: 'payoff',
    detail: 'Fulfilling the “2” clues, she drops a surprise second half of the album at 2:00 AM, subtitled The Anthology.',
    x: 93,
    y: 82,
    confirmed: true,
    sources: [{ name: 'Variety', url: 'https://variety.com/2024/music/news/taylor-swift-secret-double-album-tortured-poets-department-anthology-1235975618/' }],
  },
  {
    id: 'egg-wood-track-tloas',
    label: 'The “Wood” track theory',
    eraId: 'tloas',
    year: 2025,
    kind: 'clue',
    detail: 'Fans comb early tracklists trying to decode the song “Wood” and tie it back to her folklore nature roots.',
    x: 94,
    y: 52,
    confirmed: false,
    sources: [{ name: 'Apple Music', url: 'https://music.apple.com/us/album/the-life-of-a-showgirl-a-look-behind-the-curtain/1838812720' }],
  },
  {
    id: 'egg-tloas-orange-doors',
    label: '12 orange doors cipher',
    eraId: 'tloas',
    year: 2025,
    kind: 'clue',
    detail: 'To promote the album, 12 orange doors appear in cities worldwide with QR codes and ciphers teasing the tracks.',
    x: 95,
    y: 40,
    confirmed: true,
    sources: [{ name: '7NEWS Australia', url: 'https://www.youtube.com/watch?v=utPXqqCAbzY' }],
  },
  {
    id: 'egg-tloas-album-drop',
    label: 'The Life of a Showgirl',
    eraId: 'tloas',
    year: 2025,
    kind: 'payoff',
    detail: 'On October 3, 2025 she releases her 12th album, resolving the orange-door ciphers with 12 showgirl-themed tracks.',
    x: 98,
    y: 48,
    confirmed: true,
    sources: [{ name: 'PR Newswire', url: 'https://www.prnewswire.com/news-releases/taylor-swifts-the-life-of-a-showgirl-earns-biggest-first-week-in-music-history-with-over-4-million-us-and-over-5-5-million-global-album-equivalent-units-302582496.html' }],
  },
];

export const EGG_LINKS: EggLink[] = [
  { from: 'egg-13-debut', to: 'egg-13-video-1989', label: 'recurs as number motif' },
  { from: 'egg-13-video-1989', to: 'egg-13-tracks-midnights', label: 'escalates to track count' },
  { from: 'egg-capitals-debut', to: 'egg-capitals-fearless', label: 'recurs as format' },
  { from: 'egg-capitals-fearless', to: 'egg-fearless-tv-scramble', label: 'evolves into cipher' },
  { from: 'egg-clock-lastkiss', to: 'egg-midnights-vinyl-clock', label: 'recurs as clock motif' },
  { from: 'egg-red-burning', to: 'egg-color-daylight', label: 'flipped and resolved' },
  { from: 'egg-red-burning', to: 'egg-red-tv-rings', label: 'fulfilled via re-record' },
  { from: 'egg-snake-instagram', to: 'egg-snake-lwymmd', label: 'fulfilled in video' },
  { from: 'egg-snake-lwymmd', to: 'egg-snake-me-mv', label: 'shed and transformed' },
  { from: 'egg-loverhouse-mv', to: 'egg-cabin-folklore', label: 'fulfilled room theme' },
  { from: 'egg-loverhouse-mv', to: 'egg-eras-burning-house', label: 'escalated and destroyed' },
  { from: 'egg-man-graffiti', to: 'egg-fearless-tv-scramble', label: 'fulfilled rollout' },
  { from: 'egg-man-graffiti', to: 'egg-red-tv-rings', label: 'fulfilled rollout' },
  { from: 'egg-man-graffiti', to: 'egg-bejeweled-elevator', label: 'escalated tracking' },
  { from: 'egg-bejeweled-elevator', to: 'egg-speaknow-tv-nashville', label: 'fulfilled purple button' },
  { from: 'egg-bejeweled-elevator', to: 'egg-1989-tv-la', label: 'fulfilled blue button' },
  { from: 'egg-bejeweled-elevator', to: 'egg-rep-tv-clue-bejeweled', label: 'sparks fan theory' },
  { from: 'egg-color-daylight', to: 'egg-string-willow', label: 'recurs as golden motif' },
  { from: 'egg-grammys-two-fingers', to: 'egg-ttpd-timetable-clock', label: 'escalates clue density' },
  { from: 'egg-ttpd-timetable-clock', to: 'egg-ttpd-anthology-drop', label: 'fulfilled midnight twist' },
  { from: 'egg-karma-album-theory', to: 'egg-tloas-orange-doors', label: 'recurs as orange aesthetic' },
  { from: 'egg-tloas-orange-doors', to: 'egg-tloas-album-drop', label: 'fulfilled countdown' },
  { from: 'egg-tloas-orange-doors', to: 'egg-wood-track-tloas', label: 'sparks song theory' },
];

// ── The Proposal (sourced narrative thread) ─────────────────────────────────
// Publicly reported facts, attributed. Framed by an independent fan project.

export const PROPOSAL_BEATS: StoryBeat[] = [
  {
    id: 'prop-bracelet',
    date: '2023-07-26',
    dateLabel: 'July 2023',
    eraId: 'midnights',
    title: 'The friendship bracelet',
    body: 'After attending an Eras Tour night at Arrowhead Stadium, Travis Kelce said on his New Heights podcast that he was disappointed he could not give Taylor a friendship bracelet with his phone number on it. The public shot-his-shot moment kicked everything off.',
    quote: '“I was a little butthurt I didn’t get to meet her.”',
    source: 'New Heights podcast',
  },
  {
    id: 'prop-first-game',
    date: '2023-09-24',
    dateLabel: 'September 24, 2023',
    eraId: 'midnights',
    title: 'The first game',
    body: 'Taylor made her first public appearance in a suite at the Chiefs–Bears game at Arrowhead, sitting beside Travis’s mother. She later said they were already together by then; the appearance sent the internet into overdrive.',
    source: 'AP News',
  },
  {
    id: 'prop-super-bowl',
    date: '2024-02-11',
    dateLabel: 'February 11, 2024',
    eraId: 'midnights',
    title: 'Super Bowl LVIII',
    body: 'After flying in from a Tokyo Eras Tour show, Taylor watched the Chiefs win Super Bowl LVIII in Las Vegas, meeting Travis on the field afterward — one of the most-photographed embraces of the year.',
    source: 'AP News',
  },
  {
    id: 'prop-engagement',
    date: '2025-08-26',
    dateLabel: 'August 26, 2025',
    eraId: 'tloas',
    title: 'The garden proposal',
    body: 'The couple announced their engagement on Instagram. The proposal had happened roughly two weeks earlier in a flower-filled garden in Lee’s Summit, Missouri; the ring, an old mine brilliant-cut diamond, was designed with jeweler Kindred Lubeck.',
    quote: '“Your English teacher and your gym teacher are getting married.”',
    source: 'People',
  },
];

// ── The Decode (hidden clue → payoff pairs) ─────────────────────────────────
// AI-researched, hand-audited: URLs flattened to direct links, plant precedes
// payoff, confirmed vs. fan-theory flags preserved.

export const CLUE_PAIRS: CluePair[] = [
  {
    id: 'clue-delicate-pastel-nails',
    title: 'The pastel nails in “Delicate”',
    plant: {
      date: '2018-03-30',
      dateLabel: 'March 2018',
      eraId: 'reputation',
      what: 'The Spotify vertical video for “Delicate” showed Taylor’s nails in a soft pastel color story that looked out of place in the dark reputation era.',
    },
    payoff: {
      date: '2019-04-26',
      dateLabel: 'April 2019',
      eraId: 'lover',
      what: 'The “ME!” video launched the pastel Lover world, and Taylor later said the “Delicate” nail colors were an Easter egg for the next era.',
    },
    connection: 'A small beauty detail in a reputation video previewed the Lover palette more than a year early.',
    confirmed: true,
    sources: [
      { name: 'Entertainment Weekly', url: 'https://ew.com/music/2019/05/09/taylor-swift-secrets-album-easter-eggs/' },
      { name: 'People', url: 'https://people.com/music/taylor-swift-debuts-new-one-take-delicate-video-on-spotify/' },
    ],
  },
  {
    id: 'clue-seven-palm-trees',
    title: 'Seven palm trees',
    plant: {
      date: '2019-02-24',
      dateLabel: 'February 2019',
      eraId: 'lover',
      what: 'Taylor posted an Instagram photo of seven palm trees — a number fans tied to her upcoming seventh studio album.',
    },
    payoff: {
      date: '2019-04-26',
      dateLabel: 'April 2019',
      eraId: 'lover',
      what: 'The Lover rollout began with “ME!,” and Taylor later confirmed the palm-tree post was part of the TS7 Easter-egg trail.',
    },
    connection: 'The seven palm trees were a numeric clue pointing to TS7 before the Lover campaign began.',
    confirmed: true,
    sources: [
      { name: 'Entertainment Weekly', url: 'https://ew.com/music/2019/05/09/taylor-swift-cover-story/' },
      { name: 'Time', url: 'https://time.com/5538862/taylor-swift-countdown/' },
    ],
  },
  {
    id: 'clue-brendon-hints-in-print',
    title: 'Brendon Urie hidden in print',
    plant: {
      date: '2019-03-06',
      dateLabel: 'March 2019',
      eraId: 'lover',
      what: 'In her Elle essay “30 Things I Learned Before Turning 30,” Taylor referenced Panic! at the Disco’s “I Write Sins Not Tragedies.”',
    },
    payoff: {
      date: '2019-04-26',
      dateLabel: 'April 2019',
      eraId: 'lover',
      what: 'Taylor released “ME!” featuring Panic! at the Disco frontman Brendon Urie.',
    },
    connection: 'The Panic! reference quietly pointed to the collaborator on the first Lover single.',
    confirmed: true,
    sources: [
      { name: 'Elle', url: 'https://www.elle.com/culture/celebrities/a26628467/taylor-swift-30th-birthday-lessons/' },
      { name: 'Entertainment Weekly', url: 'https://ew.com/music/2019/05/09/taylor-swift-secrets-album-easter-eggs/' },
      { name: 'NME', url: 'https://www.nme.com/news/music/taylor-swift-duets-with-panic-at-the-discos-brendon-urie-on-new-single-me-2481142' },
    ],
  },
  {
    id: 'clue-lover-neon-sign',
    title: 'The neon “Lover” sign',
    plant: {
      date: '2019-04-26',
      dateLabel: 'April 2019',
      eraId: 'lover',
      what: 'The “ME!” video featured the word “Lover” glowing in neon; Taylor said the album title was hidden somewhere in the video.',
    },
    payoff: {
      date: '2019-06-13',
      dateLabel: 'June 2019',
      eraId: 'lover',
      what: 'Taylor announced her seventh album would be titled Lover.',
    },
    connection: 'The album title appeared inside the first video of the era before she officially revealed it.',
    confirmed: true,
    sources: [
      { name: 'Glamour', url: 'https://www.glamour.com/story/taylor-swift-me-video-easter-eggs' },
      { name: 'Time', url: 'https://time.com/5651221/taylor-swift-lover-references-explained/' },
    ],
  },
  {
    id: 'clue-hayley-kiyoko-arrow-five',
    title: 'Hayley Kiyoko’s arrow hit five',
    plant: {
      date: '2019-06-17',
      dateLabel: 'June 2019',
      eraId: 'lover',
      what: 'In the “You Need to Calm Down” video, Hayley Kiyoko appears as an archer and shoots an arrow into a target marked with the number 5.',
    },
    payoff: {
      date: '2019-07-23',
      dateLabel: 'July 2019',
      eraId: 'lover',
      what: 'Taylor released “The Archer,” revealed as track 5 on Lover.',
    },
    connection: 'The archer imagery and the number 5 pointed directly to the next song reveal.',
    confirmed: true,
    sources: [
      { name: 'Time', url: 'https://time.com/5651221/taylor-swift-lover-references-explained/' },
      { name: 'Teen Vogue', url: 'https://www.teenvogue.com/story/taylor-swift-releases-the-archer' },
    ],
  },
  {
    id: 'clue-cruel-summer-tattoo',
    title: 'The “Cruel Summer” tattoo',
    plant: {
      date: '2019-06-17',
      dateLabel: 'June 2019',
      eraId: 'lover',
      what: 'In the “You Need to Calm Down” video, Ellen DeGeneres appears with a large “Cruel Summer” tattoo.',
    },
    payoff: {
      date: '2019-08-16',
      dateLabel: 'August 2019',
      eraId: 'lover',
      what: 'Taylor revealed the Lover tracklist, confirming “Cruel Summer” as a song on the album.',
    },
    connection: 'A visual gag in the video doubled as an early reveal of a Lover track title.',
    confirmed: false,
    sources: [
      { name: 'Time', url: 'https://time.com/5651221/taylor-swift-lover-references-explained/' },
      { name: 'Consequence', url: 'https://consequence.net/2019/08/taylor-swift-lover-album-tracklist/' },
      { name: 'Glamour', url: 'https://www.glamour.com/story/taylor-swift-lover-tracklist' },
    ],
  },
  {
    id: 'clue-not-a-lot-evermore',
    title: '“Not a lot going on at the moment,” again',
    plant: {
      date: '2020-11-22',
      dateLabel: 'November 2020',
      eraId: 'evermore',
      what: 'Taylor posted a photo captioned “not a lot going on at the moment,” echoing language she used shortly before folklore.',
    },
    payoff: {
      date: '2020-12-10',
      dateLabel: 'December 2020',
      eraId: 'evermore',
      what: 'Taylor announced evermore, folklore’s sister album, the next month.',
    },
    connection: 'A deliberately quiet caption became a warning sign for another surprise album drop.',
    confirmed: false,
    sources: [
      { name: 'Seventeen', url: 'https://www.seventeen.com/celebrity/music/a34944674/evermore-easter-eggs-taylor-swift/' },
      { name: 'Teen Vogue', url: 'https://www.teenvogue.com/story/taylor-swift-teaser-easter-egg-old-music' },
    ],
  },
  {
    id: 'clue-love-story-match-ad',
    title: 'The Match ad preview',
    plant: {
      date: '2020-12-02',
      dateLabel: 'December 2020',
      eraId: 'fearless',
      what: 'A snippet of the re-recorded “Love Story” appeared in a Ryan Reynolds Match.com ad — the first public taste of the re-recordings.',
    },
    payoff: {
      date: '2021-02-11',
      dateLabel: 'February 2021',
      eraId: 'fearless',
      what: 'Taylor announced Fearless (Taylor’s Version) and the release of “Love Story (Taylor’s Version).”',
    },
    connection: 'The ad preview quietly introduced the first Taylor’s Version era before the album announcement.',
    confirmed: true,
    sources: [
      { name: 'Variety', url: 'https://variety.com/2020/music/news/taylor-swift-rerecording-love-story-ryan-reynolds-match-com-ad-1234844130/' },
      { name: 'Variety', url: 'https://variety.com/2021/music/news/taylor-swift-fearless-love-story-re-record-big-machine-albums-good-morning-america-1234905692/' },
    ],
  },
  {
    id: 'clue-red-vault-word-scramble',
    title: 'The Red vault word scramble',
    plant: {
      date: '2021-08-05',
      dateLabel: 'August 2021',
      eraId: 'red',
      what: 'Taylor posted a vault-themed word-puzzle video teasing the artists and titles connected to Red (Taylor’s Version).',
    },
    payoff: {
      date: '2021-08-06',
      dateLabel: 'August 2021',
      eraId: 'red',
      what: 'The full Red (Taylor’s Version) tracklist was revealed, confirming vault tracks and collaborators including Phoebe Bridgers and Chris Stapleton.',
    },
    connection: 'The scramble gave fans the exact clues to decode the vault-track rollout before the official reveal.',
    confirmed: true,
    sources: [
      { name: 'Variety', url: 'https://variety.com/2021/music/news/taylor-swift-phoebe-bridgers-red-remake-word-puzzle-1235035385/' },
      { name: 'Teen Vogue', url: 'https://www.teenvogue.com/story/taylor-swift-announces-massive-red-taylors-version-tracklist' },
      { name: 'Pitchfork', url: 'https://pitchfork.com/news/taylor-swift-cheekily-reveals-phoebe-bridgers-feature-on-new-red-taylors-version/' },
    ],
  },
  {
    id: 'clue-the-man-karma-graffiti',
    title: 'The “Karma” graffiti',
    plant: {
      date: '2020-02-27',
      dateLabel: 'February 2020',
      eraId: 'lover',
      what: 'In “The Man” video, “Karma” appears in graffiti alongside references to Taylor’s albums and masters.',
    },
    payoff: {
      date: '2022-10-07',
      dateLabel: 'October 2022',
      eraId: 'midnights',
      what: 'During the Midnights rollout, Taylor revealed “Karma” as a track title; the song released with the album on October 21, 2022.',
    },
    connection: 'A word fans treated as lost-album lore eventually became an official Midnights song title.',
    confirmed: false,
    sources: [
      { name: 'Teen Vogue', url: 'https://www.teenvogue.com/story/taylor-swift-karma-fan-theory-explained' },
      { name: 'Time', url: 'https://time.com/6223793/taylor-swift-midnights-album-takeaways/' },
    ],
  },
  {
    id: 'clue-bejeweled-speak-now',
    title: 'Speak Now clues in “Bejeweled”',
    plant: {
      date: '2022-10-25',
      dateLabel: 'October 2022',
      eraId: 'midnights',
      what: 'The “Bejeweled” video dropped on the 12th anniversary of Speak Now, full of purple imagery, elevator-button numbers, and Speak Now references.',
    },
    payoff: {
      date: '2023-05-05',
      dateLabel: 'May 2023',
      eraId: 'speak-now',
      what: 'Taylor announced Speak Now (Taylor’s Version) during the Nashville stop of the Eras Tour.',
    },
    connection: 'The purple-coded imagery and anniversary timing made “Bejeweled” a major breadcrumb toward the next Taylor’s Version.',
    confirmed: false,
    sources: [
      { name: 'Entertainment Weekly', url: 'https://ew.com/music/easter-eggs-taylor-swift-bejeweled-music-video/' },
      { name: 'People', url: 'https://people.com/music/taylor-swift-announces-speak-now-taylors-version-at-nashville-show/' },
    ],
  },
  {
    id: 'clue-i-can-see-you-1989-tv',
    title: 'The “1989 TV” bridge sign',
    plant: {
      date: '2023-07-07',
      dateLabel: 'July 2023',
      eraId: 'speak-now',
      what: 'The “I Can See You” video included a bridge sign fans read as “1989 TV” near the end.',
    },
    payoff: {
      date: '2023-08-09',
      dateLabel: 'August 2023',
      eraId: '1989',
      what: 'Taylor announced 1989 (Taylor’s Version) during the final Los Angeles show of the first U.S. Eras Tour leg.',
    },
    connection: 'A background detail in a Speak Now video pointed to the next re-recording announcement.',
    confirmed: false,
    sources: [
      { name: 'Seventeen', url: 'https://www.seventeen.com/celebrity/music/a44493917/taylor-swift-i-can-see-you-music-video-easter-eggs/' },
      { name: 'People', url: 'https://people.com/taylor-swift-announces-1989-taylors-version-standing-ovation-eras-tour-final-los-angeles-show-7629213/' },
      { name: 'Good Morning America', url: 'https://www.goodmorningamerica.com/culture/story/taylor-swift-announces-1989-taylors-version-details-hints-102157115' },
    ],
  },
  {
    id: 'clue-ttpd-two-fingers-anthology',
    title: 'The twos before The Anthology',
    plant: {
      date: '2024-02-04',
      dateLabel: 'February 2024',
      eraId: 'ttpd',
      what: 'After announcing The Tortured Poets Department at the Grammys, Taylor’s rollout repeatedly emphasized twos — peace-sign imagery and double-coded hints.',
    },
    payoff: {
      date: '2024-04-19',
      dateLabel: 'April 2024',
      eraId: 'ttpd',
      what: 'Two hours after release, Taylor revealed The Tortured Poets Department: The Anthology as a secret double album.',
    },
    connection: 'The repeated two-symbols became legible once the album expanded into a second installment at 2 a.m.',
    confirmed: false,
    sources: [
      { name: 'Marie Claire', url: 'https://www.marieclaire.co.uk/news/celebrity-news/taylor-swift-tortured-poets-easter-egg' },
      { name: 'Good Morning America', url: 'https://abcnews.go.com/GMA/Culture/taylor-swift-tortured-poets-department-album/story?id=109014004' },
      { name: 'People', url: 'https://people.com/taylor-swift-clues-about-the-tortured-poets-department-album-8558843' },
    ],
  },
  {
    id: 'clue-orange-door-showgirl',
    title: 'The orange door',
    plant: {
      date: '2024-12-08',
      dateLabel: 'December 2024',
      eraId: 'tloas',
      what: 'At the final Eras Tour show in Vancouver, Taylor exited through an orange door instead of the usual lift — a change fans flagged immediately.',
    },
    payoff: {
      date: '2025-08-12',
      dateLabel: 'August 2025',
      eraId: 'tloas',
      what: 'Taylor announced The Life of a Showgirl with a strongly orange visual identity, later acknowledging fans had correctly noticed the orange-door clue.',
    },
    connection: 'The final visual exit of the Eras Tour became the color-coded doorway into the next album era.',
    confirmed: true,
    sources: [
      { name: 'NBC Chicago', url: 'https://www.nbcchicago.com/entertainment/12-takeaways-from-taylor-swifts-new-heights-appearance-and-the-easter-eggs-found/3809515/' },
      { name: 'People', url: 'https://people.com/taylor-swift-announces-new-album-the-life-of-a-showgirl-with-help-travis-jason-kelce-11789202/' },
      { name: 'Elle', url: 'https://www.elle.com/culture/music/a65773807/why-taylor-swift-chose-orange-the-life-of-a-showgirl-era-color/' },
    ],
  },
];
