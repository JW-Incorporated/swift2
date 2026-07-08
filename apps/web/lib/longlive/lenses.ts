import type { EggLink, EggNode, LensId, ReRecord, Relationship, RunwayLook } from './types';
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

export const EGG_NODES: EggNode[] = [
  { id: 'egg-caps', label: 'Secret capital letters', eraId: 'debut', year: 2006, kind: 'clue', detail: 'Hidden messages spelled out in the album booklet’s capitalized letters.', x: 12, y: 30 },
  { id: 'egg-caps-payoff', label: 'A decade of decoding', eraId: 'midnights', year: 2022, kind: 'payoff', detail: 'The booklet-decoding tradition evolved into full-scale internet clue-hunts.', x: 78, y: 18 },
  { id: 'egg-scarf', label: 'The lost scarf', eraId: 'red', year: 2012, kind: 'clue', detail: 'A scarf left behind in a song became the catalog’s most-debated object.', x: 32, y: 62 },
  { id: 'egg-scarf-payoff', label: 'Ten-minute reveal', eraId: 'red', year: 2021, kind: 'payoff', detail: 'The re-recorded ten-minute version reignited the scarf mystery worldwide.', x: 55, y: 78 },
  { id: 'egg-snake', label: 'Reclaimed snake', eraId: 'reputation', year: 2017, kind: 'clue', detail: 'She turned the snake insult into deliberate iconography.', x: 48, y: 40 },
  { id: 'egg-snake-payoff', label: 'Narrative flip', eraId: 'reputation', year: 2018, kind: 'payoff', detail: 'The armor era rewrote the public story entirely in her favor.', x: 68, y: 52 },
  { id: 'egg-re-record', label: 'Re-record hint', eraId: 'lover', year: 2019, kind: 'clue', detail: 'She publicly vowed to re-record her sold masters.', x: 22, y: 88 },
  { id: 'egg-re-record-payoff', label: '“Taylor’s Version”', eraId: 'ttpd', year: 2024, kind: 'payoff', detail: 'A multi-year reclamation project that reshaped artist ownership conversations.', x: 88, y: 70 },
  { id: 'egg-anthology', label: '2am surprise', eraId: 'ttpd', year: 2024, kind: 'payoff', detail: 'A secret second half doubled the album two hours after release.', x: 90, y: 40 },
];

export const EGG_LINKS: EggLink[] = [
  { from: 'egg-caps', to: 'egg-caps-payoff', label: 'clue-hunt tradition' },
  { from: 'egg-scarf', to: 'egg-scarf-payoff', label: 'reawakened' },
  { from: 'egg-snake', to: 'egg-snake-payoff', label: 'flipped' },
  { from: 'egg-re-record', to: 'egg-re-record-payoff', label: 'fulfilled' },
  { from: 'egg-caps-payoff', to: 'egg-anthology', label: 'escalated' },
];
