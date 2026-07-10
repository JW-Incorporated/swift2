import type { CluePair, EggLink, EggNode, LensId, Motif, MotifId, ReRecord, Relationship, RunwayLook, StoryBeat } from './types';
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
      return RELATIONSHIPS.flatMap((r) =>
        r.eraIds.map((eraId, i) => ({
          // The relationship's real start date only applies to the era it
          // began in; later eras it spans get plotted at that era's own
          // start, since that's the earliest point it's known to overlap.
          date: i === 0 ? r.start : getEra(eraId).start,
          eraId,
          label: r.name,
        })),
      );
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

/**
 * Narrative threads that live on the career axis (excludes the clue mini-apps,
 * which have their own spatial UI). These are the threads offered in the era
 * pivot strip and the Crossings overlay.
 */
export const CROSSING_THREADS: LensId[] = ['love-story', 'fashion', 'taylors-version', 'the-proposal'];

/** Threads with at least one dated point inside the given era, with counts. */
export function threadsInEra(eraId: string): { id: LensId; count: number }[] {
  return CROSSING_THREADS.map((id) => ({
    id,
    count: threadPoints(id).filter((p) => p.eraId === eraId).length,
  })).filter((t) => t.count > 0);
}

/** A moment where two threads have points near each other in time. */
export interface Crossing {
  /** Midpoint of the two dates, in ms — used to place the marker on the axis. */
  date: number;
  /** Era that owns the crossing (taken from thread A's point). */
  eraId: string;
  a: ThreadPoint;
  b: ThreadPoint;
  /** Absolute distance between the two points, in days. */
  gapDays: number;
}

/**
 * Find where two threads cross: pairs of points (one from each) that fall within
 * `windowDays` of each other. This is what powers the intersection overlay —
 * e.g. a fashion shift landing at the same time a relationship begins.
 */
export function threadCrossings(a: LensId, b: LensId, windowDays = 210): Crossing[] {
  if (a === b) return [];
  const pa = threadPoints(a);
  const pb = threadPoints(b);
  const windowMs = windowDays * 86_400_000;
  const out: Crossing[] = [];
  for (const x of pa) {
    const xt = new Date(x.date).getTime();
    for (const y of pb) {
      const yt = new Date(y.date).getTime();
      const gap = Math.abs(xt - yt);
      if (gap <= windowMs) {
        out.push({ date: (xt + yt) / 2, eraId: x.eraId, a: x, b: y, gapDays: Math.round(gap / 86_400_000) });
      }
    }
  }
  return out.sort((m, n) => n.date - m.date);
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

// Sourcing note: this dataset is deliberately non-identifying by naming
// convention ("independent fan project, not confirmed fact" — see file
// header). `Relationship` doesn't yet have a `sources` field (that's a
// schema change landing separately); until it does, each entry below
// carries a `// Sources:` comment so the grounding is at least visible
// in-repo and easy to promote into a real field later.
export const RELATIONSHIPS: Relationship[] = [
  {
    id: 'rel-1',
    name: 'The Debut Sweetheart',
    start: '2008-01-01',
    end: '2008-12-31',
    eraIds: ['debut', 'fearless'],
    songs: ['Fifteen', 'Fearless'],
    // Sources: widely reported as inspiration for early-catalog songs about
    // a first high-school relationship; kept deliberately non-identifying
    // per this thread's naming convention (see file header).
    note: 'The high-school romance that colored the earliest songs.',
  },
  {
    id: 'rel-2',
    name: 'The Fearless Actor',
    start: '2008-12-01',
    end: '2009-03-01',
    eraIds: ['fearless'],
    songs: ['Forever & Always', 'The Way I Loved You'],
    // Sources: Joe Jonas breakup widely reported Oct 2008 (a phone call,
    // per Swift's own later on-record accounts); "Forever & Always" is
    // publicly understood as the direct response song.
    note: 'A brief, high-profile romance that ended in real time on the album.',
  },
  {
    id: 'rel-3',
    name: 'The Speak Now Muse',
    start: '2009-10-01',
    end: '2010-01-01',
    eraIds: ['fearless', 'speak-now'],
    songs: ['Back to December', 'Ours'],
    // Sources: "Back to December" is publicly understood as Swift's own
    // apology song, widely reported as written about actor Taylor Lautner;
    // kept non-identifying per this thread's naming convention.
    note: 'A rare apology song points back to this one.',
  },
  {
    id: 'rel-4',
    name: 'The Red Heartbreak',
    start: '2010-11-01',
    end: '2011-01-01',
    eraIds: ['speak-now', 'red'],
    songs: ['All Too Well', 'The Moment I Knew', 'Holy Ground'],
    // Sources: widely reported ~3-month relationship in late 2010; "All Too
    // Well" is Swift's own on-record most personal song from Red, per her
    // introduction to the song at multiple Eras Tour shows.
    note: 'Brief in months, enormous in catalog impact — the ten-minute epic lives here.',
  },
  {
    id: 'rel-5',
    name: 'The 1989 Whirlwind',
    start: '2012-11-01',
    end: '2013-01-04',
    eraIds: ['1989'],
    songs: ['Style', 'Out of the Woods', 'I Know Places'],
    // Sources: dated late Nov 2012 (public sightings began that month) to
    // Jan 4 2013 (a British Virgin Islands trip that ended the
    // relationship, per contemporaneous People/Us Weekly coverage). The
    // songs are all 1989 tracks, so this entry's eraId was corrected from
    // 'red' to '1989' — the previous era assignment was a dating/content
    // error, not an editorial choice (flagged in the 2026-07-08 content
    // depth audit).
    note: 'A brief, headline-making romance in late 2012 that fed directly into the 1989 sessions.',
  },
  {
    id: 'rel-6',
    name: 'The Reputation Love',
    start: '2016-10-01',
    end: '2023-04-01',
    eraIds: ['reputation', 'lover', 'folklore', 'evermore', 'midnights'],
    songs: ['Call It What You Want', 'Lover', 'Peace', 'Sweet Nothing'],
    // Sources: widely reported ~6-year relationship (British actor Joe
    // Alwyn), Oct 2016 to Apr 2023 per contemporaneous reporting; "Sweet
    // Nothing" is co-written under Swift's "William Bowery" pseudonym,
    // itself confirmed as a joint credit with the same partner (per the
    // Long Pond Studio Sessions documentary, Disney+, 2020).
    note: 'The long, private six-year relationship that anchored the middle catalog.',
  },
];

// Sourcing note: RunwayLook has no `sources` field yet (schema change
// landing separately) — grounding is in `// Source:` comments per entry
// until that field exists. Descriptions below cite one specific, real,
// verifiable occasion/detail per era rather than a generic mood/vibe line.
export const RUNWAY_LOOKS: RunwayLook[] = [
  {
    id: 'look-debut',
    eraId: 'debut',
    name: 'Curls & Cowboy Boots',
    // Source: widely documented in early press/CMT/Opry appearances,
    // 2006-2008 — sundresses, natural curls, and cowboy boots as the
    // consistent early public style, e.g. her 2006 Grand Ole Opry debut.
    description: 'Sundresses, natural ringlet curls, and cowboy boots — the look of her earliest Opry and CMT-era country-circuit appearances.',
    image: '/eras/debut.png',
    shopTags: ['Cowboy boots', 'Sundress', 'Acoustic guitar'],
  },
  {
    id: 'look-fearless',
    eraId: 'fearless',
    name: 'Golden Fairy Tale',
    // Source: the Fearless-era stage costuming (2008-2010 Fearless Tour)
    // was built around gold sequins and fringe, widely documented in tour
    // photography and the Fearless Tour DVD/CD release.
    description: 'Gold sequined dresses with fringe hems, built for the 2009-2010 Fearless Tour stage — shimmer as the era\'s visual signature.',
    image: '/eras/fearless.png',
    shopTags: ['Gold sequins', 'Fringe dress'],
  },
  {
    id: 'look-speak-now',
    eraId: 'speak-now',
    name: 'Theatrical Ballgown',
    // Source: the Speak Now Tour (2011-2012) staged each song with a
    // costume change built around sweeping ballgowns, most iconically the
    // purple gown for the title track — widely documented in tour
    // photography and the Speak Now World Tour Live DVD.
    description: 'Sweeping ballgowns built for a costume change per song on the 2011-2012 Speak Now World Tour — the purple title-track gown is the era\'s signature image.',
    image: '/eras/speak-now.png',
    shopTags: ['Ballgown', 'Purple velvet'],
  },
  {
    id: 'look-red',
    eraId: 'red',
    name: 'Red Lip Classic',
    // Source: Swift has spoken on record about adopting a red lip as a
    // deliberate signature during the Red era (2012-2013) alongside
    // vintage-inspired tailoring and knitwear.
    description: 'A bold red lip as a deliberate signature (Swift has discussed this choice on record), paired with vintage-cut tailoring and autumn knitwear.',
    image: '/eras/red.png',
    shopTags: ['Red lipstick', 'Knit scarf', 'High-waist shorts'],
  },
  {
    id: 'look-1989',
    eraId: '1989',
    name: 'Polaroid Pop',
    // Source: the 1989 album cover/packaging (2014) was shot on Polaroid
    // film by photography duo Lowfield (Sarah Barlow & Stephen Schofield)
    // — 65 Polaroids taken, 13 included per physical copy — and the era's
    // press-tour style leaned into cropped separates and pastel minimalism.
    // The cover shoot is widely credited with reviving instant-film
    // cameras' popularity.
    description: 'Cropped separates and pastel minimalism for the press tour, echoing the Polaroid-shot 1989 album cover (photographed by Lowfield) that helped revive instant-camera culture in 2014.',
    image: '/eras/1989.png',
    shopTags: ['Crop set', 'Pastel blue', 'Instant camera'],
  },
  {
    id: 'look-reputation',
    eraId: 'reputation',
    name: 'Armored Monochrome',
    // Source: the reputation Stadium Tour (2018) snake-motif bodysuit was
    // designed by Fausto Puglisi for Roberto Cavalli; the "Look What You
    // Made Me Do" video (2017) used a related Philipp Plein bodysuit —
    // both widely credited in fashion press coverage.
    description: 'A black snake-motif bodysuit designed by Fausto Puglisi for Roberto Cavalli, built for the 2018 reputation Stadium Tour — armored, high-contrast, and defiant by design.',
    image: '/eras/reputation.png',
    shopTags: ['Black bodysuit', 'Combat boots'],
  },
  {
    id: 'look-lover',
    eraId: 'lover',
    name: 'Pastel Dreamscape',
    // Source: the Lover album era (2019) press cycle and "ME!"/"You Need
    // To Calm Down" videos leaned into pastel, glitter, and rainbow
    // styling — widely documented in music-video credits and press
    // photography from the era.
    description: 'Glitter, pastel ombré, and rainbow motifs across the "ME!" and "You Need To Calm Down" video eras (2019) — the most maximalist-colorful era in the catalog.',
    image: '/eras/lover.png',
    shopTags: ['Sequin blazer', 'Pastel ombré'],
  },
  {
    id: 'look-folklore',
    eraId: 'folklore',
    name: 'Cottagecore Cardigan',
    // Source: the "cardigan" music video (2020) featured a cream
    // cable-knit cardigan with star embroidery that Swift's own store sold
    // as official merchandise; the folklore era is widely credited with
    // driving a cottagecore aesthetic revival, including a documented
    // surge in hand-knitted sweater sales.
    description: 'A cream cable-knit cardigan with embroidered stars, worn in the 2020 "cardigan" video and sold as official merch — the era credited with sparking cottagecore\'s mainstream revival.',
    image: '/eras/folklore.png',
    shopTags: ['Cardigan', 'Prairie dress'],
  },
  {
    id: 'look-evermore',
    eraId: 'evermore',
    name: 'Autumn Flannel',
    // Source: evermore (2020) was explicitly framed by Swift as folklore's
    // "sister record," and its era styling followed suit with rustic
    // autumnal tones — documented in the album's own visual rollout.
    description: 'Rust plaid and autumnal tones, following folklore\'s cottagecore direction — Swift herself called evermore folklore\'s "sister record" on release.',
    image: '/eras/evermore.png',
    shopTags: ['Flannel', 'Braided hair'],
  },
  {
    id: 'look-midnights',
    eraId: 'midnights',
    name: 'Midnight Glam',
    // Source: the "Bejeweled" video (2022) and Midnights press cycle used
    // deep-blue, retro-glam sequined styling — widely documented in the
    // video's own credits and press coverage.
    description: 'Deep-blue, retro-glam sequins from the 2022 "Bejeweled" video and Midnights press cycle — late-night jeweled styling built around the album\'s after-hours concept.',
    image: '/eras/midnights.png',
    shopTags: ['Sequin jumpsuit', 'Jewel tones'],
  },
  {
    id: 'look-ttpd',
    eraId: 'ttpd',
    name: 'Ink & Monochrome',
    // Source: The Tortured Poets Department (2024) rollout and Eras Tour
    // set addition used black-and-white, literary-coded styling —
    // documented in the album's own visual campaign and tour costuming.
    description: 'Black-and-white, sheer-layered styling for the 2024 Tortured Poets Department rollout and its Eras Tour set — literary austerity as the era\'s visual language.',
    image: '/eras/ttpd.png',
    shopTags: ['White dress', 'Black tailoring'],
  },
  {
    id: 'look-tloas',
    eraId: 'tloas',
    name: 'Bathtub Showgirl',
    description: 'Portofino-orange sequins, rhinestone bras, and Bob Mackie-inspired feathers — a Vegas showgirl’s victory lap.',
    image: '/eras/tloas.png',
    shopTags: ['Orange sequins', 'Rhinestone bra', 'Feather headpiece'],
  },
];

export const RERECORDS: ReRecord[] = [
  {
    id: 'rr-debut',
    album: 'Taylor Swift',
    originalYear: 2006,
    reclaimedYear: null,
    reclaimedDate: null,
    vaultTracks: 0,
    color: '#c9a84c',
    note: 'The debut that started everything — hers again since the 2025 buyback, but still the last album awaiting its Taylor’s Version.',
    context:
      'Taylor Swift’s 2006 debut was recorded when she was 14–15 years old and signed to Big Machine as part of the deal her parents helped negotiate. The label held the masters from day one. When Scooter Braun acquired Ithaca Holdings (which by then owned Big Machine) in June 2019, this album — along with the other five — transferred without Swift’s knowledge or consent. Ownership finally returned to her in the May 2025 buyback from Shamrock Capital, but a re-recorded Taylor’s Version has still not been released.',
    whyNow:
      'With the masters now hers, the pressure that drove the re-recording campaign is gone — a debut Taylor’s Version would now be an artistic choice rather than a reclamation tactic. No release date has been confirmed.',
    vaultHighlight: null,
    fanReaction:
      'Fan communities have debated for years whether the re-record can capture the rough-hewn charm of a 15-year-old’s debut. The anticipation is a running thread on Swiftie forums.',
    // Verified via Spotify's own album page. No Taylor's Version exists yet — still a Big Machine master.
    spotify: { original: '7mzrIsaAjnXihW3InKjlC3', taylorsVersion: null },
  },
  {
    id: 'rr-fearless',
    album: 'Fearless',
    originalYear: 2008,
    reclaimedYear: 2021,
    reclaimedDate: 'Apr 9, 2021',
    vaultTracks: 6,
    color: '#d4a830',
    note: 'The first reclaimed album — the project’s proof of concept, with 6 vault tracks.',
    context:
      'Fearless won four Grammy Awards in 2010 including Album of the Year, making it a particularly high-stakes opening move. Swift chose it first partly because Braun had already tried to leverage its masters — licensing “Love Story” to a Cadillac ad without notifying her. She announced the re-recording in November 2020, just as that controversy was fresh in the public mind. The released version included six “From the Vault” tracks that hadn’t appeared on the Platinum Edition.',
    whyNow:
      'Fearless was the strategic beachhead. By re-recording the Grammy Album of the Year first, Swift demonstrated the project could produce culturally legitimate work, not a pale copy — a real test of whether listeners would switch, and by most metrics they did.',
    vaultHighlight:
      '"Mr. Perfectly Fine" — a breakup anthem many fans read as being about Joe Jonas, which went viral on TikTok within hours of release and charted on the Hot 100 despite being a vault track written around 2008.',
    fanReaction:
      'Swifties streamed the TV version en masse to displace the original on charts. "Mr. Perfectly Fine" became a cultural moment of its own within the fan community.',
    // Taylor's Version verified via Spotify. Original Big Machine master intentionally
    // omitted — it is not the canonical release Taylor directs fans to.
    spotify: { original: null, taylorsVersion: '4hDok0OAJd57SGIT8xuWJH' },
  },
  {
    id: 'rr-speak-now',
    album: 'Speak Now',
    originalYear: 2010,
    reclaimedYear: 2023,
    reclaimedDate: 'Jul 7, 2023',
    vaultTracks: 6,
    color: '#9b6bb5',
    note: 'The self-written album — every song penned solo. Reclaimed with 6 vault tracks fans had waited over a decade to hear.',
    context:
      'Speak Now has a unique place in the catalog: Taylor wrote every song herself, without co-writers, a deliberate statement about her craft at 18–20. Its re-recording was announced during a stadium show on the Eras Tour in May 2023, giving the reveal a theatrical weight no press release could match.',
    whyNow:
      'The Eras Tour created a live-event vehicle for the re-record rollout that no previous album had — announcing it mid-concert placed Speak Now TV directly in the cultural conversation at the peak of the tour’s media saturation.',
    vaultHighlight:
      '"Castles Crumbling" featuring Hayley Williams — an unexpected collaboration that gave the vault track an entirely different emotional weight than the solo recording fans had long imagined.',
    fanReaction:
      'The Hayley Williams collaboration set fan communities alight; Paramore fans who weren’t in the Swiftie orbit engaged with the re-recording project too.',
    spotify: { original: null, taylorsVersion: '5AEDGbliTTfjOB8TSm1sxt' },
  },
  {
    id: 'rr-red',
    album: 'Red',
    originalYear: 2012,
    reclaimedYear: 2021,
    reclaimedDate: 'Nov 12, 2021',
    vaultTracks: 9,
    color: '#c94040',
    note: 'Home of the ten-minute version that became a cultural event. The largest vault of any re-record, at 9 tracks.',
    context:
      'Red (Taylor’s Version) arrived in November 2021 with the long-rumored full-length version of "All Too Well." The original 5-minute version had been a fan-favorite deep cut; the 10-minute version had been the subject of speculation for years after a clip appeared to show Swift performing a longer version at a rehearsal. Its release was paired with a 15-minute short film directed by Swift and starring Dylan O’Brien and Sadie Sink.',
    whyNow:
      'Red TV arrived during the window when TikTok had made "All Too Well" newly viral with a younger generation — the conditions for the 10-minute version to land as a cultural event.',
    vaultHighlight:
      '"All Too Well (10 Minute Version)" — one of the most anticipated vault tracks in pop music history. It debuted at #1 on the Billboard Hot 100, making Swift the first artist to replace herself at #1 with a re-recorded track.',
    fanReaction:
      'The 10-minute version became a generational reference point online. The accompanying short film was submitted for Emmy consideration.',
    spotify: { original: null, taylorsVersion: '6kZ42qRrzov54LcAk4onW9' },
  },
  {
    id: 'rr-1989',
    album: '1989',
    originalYear: 2014,
    reclaimedYear: 2023,
    reclaimedDate: 'Oct 27, 2023',
    vaultTracks: 5,
    color: '#6aadcc',
    note: 'The blockbuster pop record reclaimed to record-breaking numbers, re-released at the apex of the Eras Tour media cycle.',
    context:
      '1989 defined the first half of the 2010s commercially — five #1 singles, a complete pop crossover — and its masters were among the most valuable in the catalog. Swift announced 1989 TV during the Japanese leg of the Eras Tour on August 9, 2023; the release date fell during the tour’s New Zealand run. All five vault tracks were previously unreleased.',
    whyNow:
      '1989 TV arrived at the exact moment the Eras Tour concert film was entering theaters, creating a double-release media event that made October 2023 a prolonged cultural moment.',
    vaultHighlight:
      '"Slut!" — its deliberately provocative title sparked immediate conversation, and the song itself (a bubbly anthem reclaiming the word) became a streaming standout.',
    fanReaction:
      'The vault-track titles were teased only as symbols before being decoded by the fan community as a group puzzle — "Slut!" in particular drove enormous conversation before a single second of audio had been heard.',
    // Both verified via Spotify — 1989 is the one album where a true side-by-side
    // is available. Original is the standard 13-track edition (not Deluxe), to
    // match the TV core tracklist for a fair comparison.
    spotify: { original: '2QJmrSgbdM35R67eoGQo4j', taylorsVersion: '64LU4c1nfjz1t4VnGhagcg' },
  },
  {
    id: 'rr-reputation',
    album: 'reputation',
    originalYear: 2017,
    reclaimedYear: null,
    reclaimedDate: null,
    vaultTracks: 0,
    color: '#555555',
    note: 'Hers again since the 2025 buyback, but its Taylor’s Version remains unreleased — the most anticipated re-record left.',
    context:
      'reputation was Swift’s most stylistically extreme pivot — industrial pop production and a deliberately confrontational public persona adopted after years of media narrative she couldn’t control. Like the debut, its original master returned to her in the May 2025 Shamrock buyback, ending the ownership dispute. A re-recorded Taylor’s Version has still not arrived.',
    whyNow:
      'Now that she owns it outright, a reputation (Taylor’s Version) is no longer about reclaiming leverage — it’s about whether and how she chooses to revisit her darkest, most theatrical era. That ambiguity has given it an almost mythological pre-release status in fan communities.',
    vaultHighlight: null,
    fanReaction:
      'Fan-made countdown clocks and theory posts about a reputation TV announcement have become their own genre — the absence of news is the news.',
    // Owned again since the 2025 buyback; no Taylor's Version yet, so the
    // original master is still the only release on streaming.
    spotify: { original: '6DEjYFkNZh67HP7R9PSZvv', taylorsVersion: null },
  },
];

// ── Easter Egg Web (constellation) ──────────────────────────────────────────
// x/y are normalized 0–100 coordinates for the SVG constellation layout.
// Dataset compiled by an AI research pass and hand-audited (URLs flattened,
// the "Last Kiss / 1:58" fact corrected, over-confident flags demoted).
// Both TLOAS soft-sourced nodes (`egg-tloas-orange-doors`, `egg-wood-track-tloas`)
// are marked confirmed: false pending a stronger primary source.

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
    confirmed: false,
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

// ── Motif trails (the Clue Web mini-app) ────────────────────────────────────
// Trails are the *guided* way into the Clue Web: each groups related eggs into
// a readable story. EGG_LINKS remain the cross-trail connections drawn on the
// exploratory constellation map. Every node belongs to exactly one trail.
//
// Adding an egg? Add it to EGG_NODES and to exactly one trail in
// MOTIF_MEMBERSHIP below. The dev guard at the bottom fails loudly if a node is
// left unclassified — that is what keeps new content consistent.

export const MOTIFS: Motif[] = [
  {
    id: 'number-13',
    label: 'The Number 13',
    icon: 'Hash',
    blurb: 'Her lucky number, hidden in dates, teasers, and track counts since day one.',
  },
  {
    id: 'hidden-messages',
    label: 'Hidden Messages',
    icon: 'Type',
    blurb: 'Secret capital letters and coded liner notes that trained fans to decode everything.',
  },
  {
    id: 'the-snake',
    label: 'The Snake',
    icon: 'Spline',
    blurb: 'An insult reclaimed as armor in reputation, then shed for butterflies in Lover.',
  },
  {
    id: 'color-coding',
    label: 'Color Coding',
    icon: 'Palette',
    blurb: 'Colors that forecast an era and pay off seasons — sometimes years — later.',
  },
  {
    id: 'clocks-countdowns',
    label: 'Clocks & Countdowns',
    icon: 'Clock',
    blurb: 'Timestamps and reveal timers pointing at one specific hour.',
  },
  {
    id: 'doors-rooms',
    label: 'Doors & Rooms',
    icon: 'DoorOpen',
    blurb: 'The Lover house, the folklore cabin, and the orange doors of a new era.',
  },
  {
    id: 'the-rerecordings',
    label: 'The Re-Recordings',
    icon: 'RefreshCw',
    blurb: 'Breadcrumbs that mapped the order of the Taylor’s Version rollout.',
  },
];

export const MOTIF_BY_ID = Object.fromEntries(MOTIFS.map((m) => [m.id, m])) as Record<MotifId, Motif>;

/** Source of truth for which eggs belong to which trail. */
const MOTIF_MEMBERSHIP: Record<MotifId, string[]> = {
  'number-13': ['egg-13-debut', 'egg-13-video-1989', 'egg-13-tracks-midnights'],
  'hidden-messages': ['egg-capitals-debut', 'egg-capitals-fearless', 'egg-fearless-tv-scramble', 'egg-wood-track-tloas'],
  'the-snake': ['egg-snake-instagram', 'egg-snake-lwymmd', 'egg-snake-me-mv'],
  'color-coding': ['egg-red-burning', 'egg-color-daylight', 'egg-string-willow', 'egg-karma-album-theory'],
  'clocks-countdowns': [
    'egg-clock-lastkiss',
    'egg-midnights-vinyl-clock',
    'egg-grammys-two-fingers',
    'egg-ttpd-timetable-clock',
    'egg-ttpd-anthology-drop',
  ],
  'doors-rooms': [
    'egg-loverhouse-mv',
    'egg-cabin-folklore',
    'egg-eras-burning-house',
    'egg-tloas-orange-doors',
    'egg-tloas-album-drop',
  ],
  'the-rerecordings': [
    'egg-man-graffiti',
    'egg-red-tv-rings',
    'egg-bejeweled-elevator',
    'egg-rep-tv-clue-bejeweled',
    'egg-speaknow-tv-nashville',
    'egg-1989-tv-la',
  ],
};

const NODE_TO_MOTIF: Record<string, MotifId> = Object.entries(MOTIF_MEMBERSHIP).reduce(
  (acc, [motif, ids]) => {
    for (const id of ids) acc[id] = motif as MotifId;
    return acc;
  },
  {} as Record<string, MotifId>,
);

/** The trail a node belongs to (undefined only if misclassified). */
export function motifOf(nodeId: string): MotifId | undefined {
  return NODE_TO_MOTIF[nodeId];
}

/** Nodes on a trail, oldest → newest (clue before payoff on year ties). */
export function motifNodes(motifId: MotifId): EggNode[] {
  return EGG_NODES.filter((n) => NODE_TO_MOTIF[n.id] === motifId).sort(
    (a, b) => a.year - b.year || (a.kind === b.kind ? 0 : a.kind === 'clue' ? -1 : 1),
  );
}

/** Distinct eras a trail touches, in chronological order. */
export function motifEraIds(motifId: MotifId): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of motifNodes(motifId)) {
    if (!seen.has(n.eraId)) {
      seen.add(n.eraId);
      out.push(n.eraId);
    }
  }
  return out;
}

// Dev-only guard: every egg must live on exactly one trail. An unclassified
// node should fail loudly here instead of silently vanishing from the UI.
if (process.env.NODE_ENV !== 'production') {
  const unclassified = EGG_NODES.filter((n) => !NODE_TO_MOTIF[n.id]).map((n) => n.id);
  if (unclassified.length > 0) {
    // eslint-disable-next-line no-console
    console.error('[v0] Clue Web: unclassified egg nodes — add to MOTIF_MEMBERSHIP:', unclassified);
  }
}

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
    id: 'prop-wsj-confirm',
    date: '2023-11-01',
    dateLabel: 'November 2023',
    eraId: 'midnights',
    title: 'Travis confirms it, on the record',
    body: 'After weeks of stadium-suite appearances (including an October trip to MetLife Stadium for a Chiefs–Jets game), Travis confirmed the relationship on the record in a WSJ. Magazine interview — the first time either side spoke to it directly rather than letting the sightings speak for themselves.',
    source: 'WSJ. Magazine',
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
    id: 'prop-so-high-school',
    date: '2024-04-19',
    dateLabel: 'April 2024',
    eraId: 'ttpd',
    title: '"So High School"',
    body: 'The Tortured Poets Department: The Anthology track "So High School" is widely read by fans — not officially confirmed by Swift — as being about the relationship, down to a lyric fans connect to a 2016 interview where Travis said he\'d "kiss" her in a game of Kiss, Marry, Kill. Swift has performed it on the Eras Tour with visuals fans read as Travis-coded.',
    source: 'Entertainment Tonight / Capital FM (fan reading, not officially confirmed)',
  },
  {
    id: 'prop-us-open',
    date: '2024-09-08',
    dateLabel: 'September 2024',
    eraId: 'ttpd',
    title: 'A public date at the US Open',
    body: 'One of the couple\'s most public, non-football dates: courtside at the US Open alongside Patrick and Brittany Mahomes, cheering on the men\'s final.',
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
  {
    id: 'prop-wedding',
    date: '2026-07-03',
    dateLabel: 'July 3, 2026',
    eraId: 'tloas',
    title: 'The wedding',
    body: 'Taylor and Travis married at Madison Square Garden in New York City, in a star-studded ceremony officiated by Adam Sandler, timed over the July 4th weekend just before Kelce\'s NFL training camp — the resolution of the story this thread has followed since the friendship bracelet.',
    source: 'CNN / Good Morning America',
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
  {
    id: 'clue-1989-elevator-eighteen',
    title: 'The elevator button 18',
    plant: {
      date: '2014-08-04',
      dateLabel: 'August 2014',
      eraId: '1989',
      what: 'Taylor posted what she called her “first clue”: a short Instagram video of an elevator button marked 18 being pressed repeatedly.',
    },
    payoff: {
      date: '2014-08-18',
      dateLabel: 'August 2014',
      eraId: '1989',
      what: 'On August 18, she announced 1989 during a Yahoo livestream and premiered “Shake It Off.”',
    },
    connection: 'The number 18 pointed to the exact date of the 1989 era reveal.',
    confirmed: true,
    sources: [
      { name: 'Vanity Fair', url: 'https://www.vanityfair.com/hollywood/2014/08/taylor-swift-kanye-west-new-music' },
      { name: 'Vanity Fair', url: 'https://www.vanityfair.com/hollywood/2014/08/taylor-swift-shake-it-off-video' },
    ],
  },
  {
    id: 'clue-reputation-social-blackout',
    title: 'The social media blackout',
    plant: {
      date: '2017-08-18',
      dateLabel: 'August 2017',
      eraId: 'reputation',
      what: 'Taylor wiped her social media accounts, leaving fans with a blank slate after a long public quiet period.',
    },
    payoff: {
      date: '2017-08-23',
      dateLabel: 'August 2017',
      eraId: 'reputation',
      what: 'She announced reputation and its black-and-white album artwork, formally beginning the new era.',
    },
    connection: 'The wipe reset her public image before an album explicitly about reputation and reinvention.',
    confirmed: true,
    sources: [
      { name: 'GQ', url: 'https://www.gq.com/story/taylor-swift-look-what-you-made-me-do' },
      { name: 'Vanity Fair', url: 'https://www.vanityfair.com/style/2017/08/taylor-swift-look-what-you-made-me-do-reputation' },
    ],
  },
  {
    id: 'clue-reputation-snake-videos',
    title: 'The snake teasers',
    plant: {
      date: '2017-08-21',
      dateLabel: 'August 2017',
      eraId: 'reputation',
      what: 'After blacking out her accounts, Taylor posted silent, glitchy snake clips across social media.',
    },
    payoff: {
      date: '2017-08-24',
      dateLabel: 'August 2017',
      eraId: 'reputation',
      what: 'She released “Look What You Made Me Do,” and snake imagery became central to the reputation rollout and video.',
    },
    connection: 'The snake clips previewed the symbol she would reclaim as the reputation era’s core iconography.',
    confirmed: true,
    sources: [
      { name: 'GQ', url: 'https://www.gq.com/story/taylor-swift-look-what-you-made-me-do' },
      { name: 'Pitchfork', url: 'https://pitchfork.com/news/watch-taylor-swifts-look-what-you-made-me-do-video/' },
    ],
  },
  {
    id: 'clue-iheartradio-butterfly-stilettos',
    title: 'The butterfly stilettos',
    plant: {
      date: '2019-03-14',
      dateLabel: 'March 2019',
      eraId: 'lover',
      what: 'Taylor attended the iHeartRadio Music Awards wearing butterfly-accented shoes, a sharp visual break from the snake-heavy reputation palette.',
    },
    payoff: {
      date: '2019-04-26',
      dateLabel: 'April 2019',
      eraId: 'lover',
      what: 'The “ME!” video opened with a snake bursting into butterflies, launching the pastel Lover era.',
    },
    connection: 'Butterflies quietly replaced snakes as the visual language of Taylor’s next era.',
    confirmed: true,
    sources: [
      { name: 'Entertainment Weekly', url: 'https://ew.com/music/2019/05/09/taylor-swift-secrets-album-easter-eggs/' },
      { name: 'Glamour', url: 'https://www.glamour.com/story/taylor-swift-me-video-easter-eggs' },
    ],
  },
  {
    id: 'clue-lover-426-countdown',
    title: 'The 4.26 countdown',
    plant: {
      date: '2019-04-13',
      dateLabel: 'April 2019',
      eraId: 'lover',
      what: 'Taylor launched a countdown on her site and social channels pointing to 4.26, without initially saying what would happen.',
    },
    payoff: {
      date: '2019-04-26',
      dateLabel: 'April 2019',
      eraId: 'lover',
      what: 'She released “ME!” featuring Brendon Urie and its pastel, butterfly-filled music video.',
    },
    connection: 'The countdown directly led fans to the first release of the Lover era.',
    confirmed: true,
    sources: [
      { name: 'Time', url: 'https://time.com/5538862/taylor-swift-countdown/' },
      { name: 'NME', url: 'https://www.nme.com/news/music/taylor-swift-duets-with-panic-at-the-discos-brendon-urie-on-new-single-me-2481142' },
    ],
  },
  {
    id: 'clue-lover-nashville-butterfly-mural',
    title: 'The Nashville butterfly mural',
    plant: {
      date: '2019-04-25',
      dateLabel: 'April 2019',
      eraId: 'lover',
      what: 'A butterfly mural appeared in Nashville, and Taylor showed up there with fans shortly before the new music reveal.',
    },
    payoff: {
      date: '2019-04-26',
      dateLabel: 'April 2019',
      eraId: 'lover',
      what: 'The next day, she released “ME!,” whose video made butterflies the defining symbol of the new era.',
    },
    connection: 'The mural served as a real-world butterfly breadcrumb before the Lover era officially opened.',
    confirmed: true,
    sources: [
      { name: 'Time', url: 'https://time.com/5538862/taylor-swift-countdown/' },
      { name: 'Glamour', url: 'https://www.glamour.com/story/taylor-swift-me-video-easter-eggs' },
    ],
  },
  {
    id: 'clue-me-calm-dialogue',
    title: 'The French calm-down line',
    plant: {
      date: '2019-04-26',
      dateLabel: 'April 2019',
      eraId: 'lover',
      what: 'The “ME!” video opened with Taylor and Brendon Urie arguing in French, including a translated version of “you need to calm down.”',
    },
    payoff: {
      date: '2019-06-14',
      dateLabel: 'June 2019',
      eraId: 'lover',
      what: 'Taylor released “You Need to Calm Down” as the second Lover single.',
    },
    connection: 'A line of dialogue in the first Lover video pointed to the title of the next single.',
    confirmed: false,
    sources: [
      { name: 'Glamour', url: 'https://www.glamour.com/story/taylor-swift-me-video-easter-eggs' },
      { name: 'Teen Vogue', url: 'https://www.teenvogue.com/story/taylor-swift-new-album-lover-new-single-june-14' },
    ],
  },
  {
    id: 'clue-me-dixie-chicks-photo',
    title: 'The Dixie Chicks photo',
    plant: {
      date: '2019-04-26',
      dateLabel: 'April 2019',
      eraId: 'lover',
      what: 'The “ME!” video included a framed photo of the Dixie Chicks, which fans flagged as more than background decoration.',
    },
    payoff: {
      date: '2019-08-16',
      dateLabel: 'August 2019',
      eraId: 'lover',
      what: 'Taylor revealed the Lover tracklist, confirming “Soon You’ll Get Better” featuring the Dixie Chicks.',
    },
    connection: 'A framed photo foreshadowed one of Lover’s most important collaborations.',
    confirmed: false,
    sources: [
      { name: 'Glamour', url: 'https://www.glamour.com/story/taylor-swift-me-video-easter-eggs' },
      { name: 'Entertainment Weekly', url: 'https://ew.com/music/2019/08/23/taylor-swift-lover-track-by-track-breakdown/' },
    ],
  },
  {
    id: 'clue-the-man-no-scooters',
    title: 'The “No Scooters” sign',
    plant: {
      date: '2020-02-27',
      dateLabel: 'February 2020',
      eraId: 'lover',
      what: 'In “The Man” video, the graffiti wall included a “No Scooters” sign next to the titles of Taylor’s earlier albums.',
    },
    payoff: {
      date: '2021-02-11',
      dateLabel: 'February 2021',
      eraId: 'fearless',
      what: 'Taylor announced Fearless (Taylor’s Version), beginning the public album-by-album re-recording campaign to reclaim her catalog.',
    },
    connection: 'The wall visually tied the masters dispute to the albums she would soon start re-recording.',
    confirmed: false,
    sources: [
      { name: 'Vulture', url: 'https://www.vulture.com/2020/02/taylor-swift-the-man-music-video-dwayne-johnson-watch.html' },
      { name: 'Pitchfork', url: 'https://pitchfork.com/news/taylor-swift-details-re-recorded-album-fearless-taylors-version/' },
    ],
  },
  {
    id: 'clue-folklore-not-a-lot',
    title: '“Not a lot going on at the moment”',
    plant: {
      date: '2020-04-27',
      dateLabel: 'April 2020',
      eraId: 'folklore',
      what: 'Taylor posted a quarantine photo captioned “Not a lot going on at the moment,” a phrase fans later treated as suspiciously understated.',
    },
    payoff: {
      date: '2020-07-23',
      dateLabel: 'July 2020',
      eraId: 'folklore',
      what: 'She announced folklore, a surprise album written and recorded during lockdown, for release at midnight.',
    },
    connection: 'The quiet caption became meaningful in hindsight once fans learned she had been making an entire album.',
    confirmed: false,
    sources: [
      { name: 'BuzzFeed', url: 'https://www.buzzfeed.com/elliewoodward/taylor-swift-folklore-cardigan-easter-egg-instagram-post' },
      { name: 'Taylor Swift Instagram', url: 'https://www.instagram.com/p/CC-9usjDzUw/' },
    ],
  },
  {
    id: 'clue-cardigan-to-willow',
    title: 'The magic piano continuation',
    plant: {
      date: '2020-07-24',
      dateLabel: 'July 2020',
      eraId: 'folklore',
      what: 'The “cardigan” video ended with Taylor soaked at a piano in a cabin, wearing the cardigan from the song.',
    },
    payoff: {
      date: '2020-12-11',
      dateLabel: 'December 2020',
      eraId: 'evermore',
      what: 'The “willow” video opened in the same setting and continued the visual story with a glowing golden thread.',
    },
    connection: 'The ending of folklore’s lead video became the starting point for evermore’s lead video.',
    confirmed: false,
    sources: [
      { name: 'Entertainment Weekly', url: 'https://ew.com/music/easter-eggs-taylor-swift-willow-music-video/' },
      { name: 'PopSugar', url: 'https://www.popsugar.com/entertainment/taylor-swift-willow-music-video-easter-eggs-48051587' },
    ],
  },
  {
    id: 'clue-fearless-april-ninth',
    title: 'The hidden “April Ninth” message',
    plant: {
      date: '2021-02-11',
      dateLabel: 'February 2021',
      eraId: 'fearless',
      what: 'Taylor announced Fearless (Taylor’s Version) with a letter whose random capital letters spelled “APRIL NINTH.”',
    },
    payoff: {
      date: '2021-04-09',
      dateLabel: 'April 2021',
      eraId: 'fearless',
      what: 'Fearless (Taylor’s Version) was released on April 9.',
    },
    connection: 'The capital-letter code revealed the album’s release date before fans reached the end of the rollout.',
    confirmed: true,
    sources: [
      { name: 'The Independent', url: 'https://www.independent.co.uk/arts-entertainment/music/news/taylor-swift-fearless-re-recorded-b1800919.html' },
      { name: 'Pitchfork', url: 'https://pitchfork.com/news/taylor-swift-details-re-recorded-album-fearless-taylors-version/' },
    ],
  },
  {
    id: 'clue-fearless-vault-scramble',
    title: 'The Fearless vault scramble',
    plant: {
      date: '2021-04-02',
      dateLabel: 'April 2021',
      eraId: 'fearless',
      what: 'Taylor posted a vault video with scrambled letters for fans to decode the unreleased Fearless (Taylor’s Version) tracks.',
    },
    payoff: {
      date: '2021-04-03',
      dateLabel: 'April 2021',
      eraId: 'fearless',
      what: 'She revealed the full Fearless (Taylor’s Version) tracklist, including vault tracks and collaborators.',
    },
    connection: 'The scrambled vault letters let fans solve the tracklist before the official reveal.',
    confirmed: true,
    sources: [
      { name: 'Seventeen', url: 'https://www.seventeen.com/celebrity/music/a36014856/taylor-swift-revealed-six-unreleased-songs-titles-instagram/' },
      { name: 'Teen Vogue', url: 'https://www.teenvogue.com/story/taylor-swift-shares-track-list-fearless-taylors-version' },
    ],
  },
  {
    id: 'clue-wildest-dreams-spirit-trailer',
    title: 'The “Wildest Dreams” trailer preview',
    plant: {
      date: '2021-03-12',
      dateLabel: 'March 2021',
      eraId: '1989',
      what: 'A trailer for Spirit Untamed used a preview of “Wildest Dreams (Taylor’s Version),” giving fans an early official taste of a 1989 re-recording.',
    },
    payoff: {
      date: '2021-09-17',
      dateLabel: 'September 2021',
      eraId: '1989',
      what: 'Taylor released the full “Wildest Dreams (Taylor’s Version)” track.',
    },
    connection: 'A movie-trailer snippet preceded the standalone release of the full Taylor’s Version recording.',
    confirmed: true,
    sources: [
      { name: 'Billboard', url: 'https://www.billboard.com/music/pop/taylor-swift-wildest-dreams-taylors-version-spirit-untamed-trailer-9540468/' },
      { name: 'NME', url: 'https://www.nme.com/news/music/taylor-swift-releases-wildest-dreams-taylors-version-after-it-goes-viral-on-tiktok-3048170' },
    ],
  },
  {
    id: 'clue-this-love-summer-trailer',
    title: 'The “This Love” trailer preview',
    plant: {
      date: '2022-05-05',
      dateLabel: 'May 2022',
      eraId: '1989',
      what: 'The trailer for The Summer I Turned Pretty featured a preview of “This Love (Taylor’s Version).”',
    },
    payoff: {
      date: '2022-05-06',
      dateLabel: 'May 2022',
      eraId: '1989',
      what: 'Taylor released the full “This Love (Taylor’s Version)” track the next day.',
    },
    connection: 'The trailer acted as a one-day breadcrumb for the next 1989 Taylor’s Version song drop.',
    confirmed: true,
    sources: [
      { name: 'Teen Vogue', url: 'https://www.teenvogue.com/story/taylor-swift-this-love-taylors-version-the-summer-i-turned-pretty-trailer' },
      { name: 'Variety', url: 'https://variety.com/2022/music/news/taylor-swift-this-love-taylors-version-summer-i-turned-pretty-trailer-1235260492/' },
    ],
  },
  {
    id: 'clue-midnights-music-movies-trailer',
    title: 'The Midnights music-movies trailer',
    plant: {
      date: '2022-10-20',
      dateLabel: 'October 2022',
      eraId: 'midnights',
      what: 'Taylor premiered a teaser trailer during Thursday Night Football showing clips from multiple secret Midnights visual projects.',
    },
    payoff: {
      date: '2023-01-27',
      dateLabel: 'January 2023',
      eraId: 'midnights',
      what: 'After “Anti-Hero” and “Bejeweled,” she released the “Lavender Haze” video, fulfilling another teased visual from the trailer.',
    },
    connection: 'The trailer previewed a slate of Midnights videos months before all of them were released.',
    confirmed: true,
    sources: [
      { name: 'Variety', url: 'https://variety.com/2022/music/news/taylor-swift-midnights-trailer-1235409770/' },
      { name: 'PopSugar', url: 'https://www.popsugar.com/entertainment/taylor-swift-midnights-music-videos-48986091' },
    ],
  },
  {
    id: 'clue-bejeweled-fifth-floor',
    title: 'The blue fifth-floor button',
    plant: {
      date: '2022-10-25',
      dateLabel: 'October 2022',
      eraId: 'midnights',
      what: 'In the “Bejeweled” video, Taylor rode an elevator with color-coded buttons; after the purple third-floor Speak Now clue, fans noticed the blue fifth-floor button.',
    },
    payoff: {
      date: '2023-08-09',
      dateLabel: 'August 2023',
      eraId: '1989',
      what: 'Taylor announced 1989 (Taylor’s Version), her fifth album’s re-recording, during the Eras Tour in Los Angeles.',
    },
    connection: 'The blue fifth-floor cue became legible once the next Taylor’s Version was 1989.',
    confirmed: false,
    sources: [
      { name: 'Good Morning America', url: 'https://www.goodmorningamerica.com/culture/story/taylor-swift-announces-1989-taylors-version-details-hints-102157115' },
      { name: 'Teen Vogue', url: 'https://www.teenvogue.com/story/taylor-swift-bejeweled-music-video-has-a-major-re-recording-clue-and-tons-of-celeb-cameos' },
    ],
  },
  {
    id: 'clue-karma-blue-nail-eight',
    title: 'The blue nail at eight',
    plant: {
      date: '2023-05-26',
      dateLabel: 'May 2023',
      eraId: 'midnights',
      what: 'In the “Karma” video, Taylor’s blue nail appeared near the number 8 on a clock face, which fans read as an August 1989 clue.',
    },
    payoff: {
      date: '2023-08-09',
      dateLabel: 'August 2023',
      eraId: '1989',
      what: 'Taylor announced 1989 (Taylor’s Version) in August, matching the blue color association and the number 8.',
    },
    connection: 'The color-and-number combination seemed to point to the month and era of the 1989 Taylor’s Version announcement.',
    confirmed: false,
    sources: [
      { name: 'Cosmopolitan', url: 'https://www.cosmopolitan.com/entertainment/music/a44020486/taylor-swift-karma-music-video-easter-eggs/' },
      { name: 'Good Morning America', url: 'https://www.goodmorningamerica.com/culture/story/taylor-swift-announces-1989-taylors-version-details-hints-102157115' },
    ],
  },
  {
    id: 'clue-karma-august-hourglass',
    title: 'The August hourglass',
    plant: {
      date: '2023-05-26',
      dateLabel: 'May 2023',
      eraId: 'midnights',
      what: 'The “Karma” video included an hourglass, which fans connected to Taylor’s folklore-era “August slipped away” hourglass merch.',
    },
    payoff: {
      date: '2023-08-09',
      dateLabel: 'August 2023',
      eraId: '1989',
      what: 'Taylor announced 1989 (Taylor’s Version) in August.',
    },
    connection: 'The hourglass became part of the fan-read August trail that culminated in the 1989 Taylor’s Version announcement.',
    confirmed: false,
    sources: [
      { name: 'People', url: 'https://people.com/music/taylor-swift-midnights-music-videos-easter-eggs/' },
      { name: 'Good Morning America', url: 'https://www.goodmorningamerica.com/culture/story/taylor-swift-announces-1989-taylors-version-details-hints-102157115' },
    ],
  },
  {
    id: 'clue-1989-google-vault',
    title: 'The Google vault puzzles',
    plant: {
      date: '2023-09-19',
      dateLabel: 'September 2023',
      eraId: '1989',
      what: 'Taylor and Google launched a blue-vault search puzzle requiring fans to solve millions of clues tied to 1989 (Taylor’s Version).',
    },
    payoff: {
      date: '2023-09-20',
      dateLabel: 'September 2023',
      eraId: '1989',
      what: 'The vault unlocked and revealed the 1989 (Taylor’s Version) vault-track titles.',
    },
    connection: 'The interactive puzzle was the mechanism for revealing the album’s previously unreleased songs.',
    confirmed: true,
    sources: [
      { name: 'Google', url: 'https://blog.google/products-and-platforms/products/search/taylor-swift-google-search-easter-egg/' },
      { name: 'People', url: 'https://people.com/taylor-swift-reveals-1989-taylors-version-vault-track-names-7972119' },
    ],
  },
  {
    id: 'clue-ttpd-aimee-hair-clip',
    title: 'The Aimee hair clip',
    plant: {
      date: '2023-10-01',
      dateLabel: 'October 2023',
      eraId: 'ttpd',
      what: 'Taylor was photographed wearing an Anthropologie hair clip from a set named “Aimee,” months before fans knew any TTPD track titles.',
    },
    payoff: {
      date: '2024-04-19',
      dateLabel: 'April 2024',
      eraId: 'ttpd',
      what: 'The Tortured Poets Department: The Anthology included the song “thanK you aIMee.”',
    },
    connection: 'A fashion item name appeared to foreshadow one of the Anthology song titles.',
    confirmed: false,
    sources: [
      { name: 'Glamour', url: 'https://www.glamour.com/story/taylor-swift-has-been-hiding-tortured-poets-easter-eggs-in-street-style-fits-for-6-months' },
      { name: 'Us Weekly', url: 'https://www.usmagazine.com/stylish/news/taylor-swifts-style-has-been-full-of-ttpd-easter-eggs-for-months/' },
    ],
  },
  {
    id: 'clue-ttpd-cassandra-bag',
    title: 'The Cassandra bag',
    plant: {
      date: '2023-11-13',
      dateLabel: 'November 2023',
      eraId: 'ttpd',
      what: 'Taylor was photographed in New York carrying a Saint Laurent Cassandra bag.',
    },
    payoff: {
      date: '2024-04-19',
      dateLabel: 'April 2024',
      eraId: 'ttpd',
      what: 'The Tortured Poets Department: The Anthology included a track titled “Cassandra.”',
    },
    connection: 'The handbag name matched an Anthology song title revealed five months later.',
    confirmed: false,
    sources: [
      { name: 'People', url: 'https://people.com/taylor-swift-was-spotted-wearing-the-ysl-cassandra-bag-5-months-before-releasing-a-song-of-the-same-name-8636853' },
      { name: 'Page Six', url: 'https://pagesix.com/2024/04/22/taylor-swift-the-tortured-poets-department-fashion-easter-eggs/' },
    ],
  },
  {
    id: 'clue-ttpd-robin-boots',
    title: 'The Robin boots',
    plant: {
      date: '2024-01-18',
      dateLabel: 'January 2024',
      eraId: 'ttpd',
      what: 'Taylor was photographed wearing The Row’s Robin Leather Chelsea Boots during her pre-TTPD street-style run.',
    },
    payoff: {
      date: '2024-04-19',
      dateLabel: 'April 2024',
      eraId: 'ttpd',
      what: 'The Tortured Poets Department: The Anthology included a track titled “Robin.”',
    },
    connection: 'The boot name matched a song title that would not be public until the Anthology release.',
    confirmed: false,
    sources: [
      { name: 'Elite Daily', url: 'https://www.elitedaily.com/fashion/taylor-swift-outfit-easter-eggs-for-tortured-poets' },
      { name: 'Page Six', url: 'https://pagesix.com/2024/04/22/taylor-swift-the-tortured-poets-department-fashion-easter-eggs/' },
    ],
  },
  {
    id: 'clue-ttpd-literary-academia-style',
    title: 'The literary-academia wardrobe',
    plant: {
      date: '2023-10-01',
      dateLabel: 'October 2023',
      eraId: 'ttpd',
      what: 'In the months before TTPD, Taylor repeatedly wore preppy, literary-academia-coded street-style pieces: pleated skirts, loafers, checked coats, and dark neutral layers.',
    },
    payoff: {
      date: '2024-04-19',
      dateLabel: 'April 2024',
      eraId: 'ttpd',
      what: 'The Tortured Poets Department arrived with a black-and-white, literary, poet-coded visual world.',
    },
    connection: 'The wardrobe moodboard previewed the intellectual, monochrome aesthetic of the TTPD era.',
    confirmed: false,
    sources: [
      { name: 'Vanity Fair', url: 'https://www.vanityfair.com/style/story/poetics-of-taylor-swift-style' },
      { name: 'Page Six', url: 'https://pagesix.com/2024/04/19/style/taylor-swift-tortured-poets-department-style-meaning/' },
    ],
  },
  {
    id: 'clue-showgirl-taylor-nation-orange-posts',
    title: 'Taylor Nation’s orange era posts',
    plant: {
      date: '2025-08-11',
      dateLabel: 'August 2025',
      eraId: 'tloas',
      what: 'Taylor Nation posted a set of orange Eras Tour images with language pointing fans toward the next era.',
    },
    payoff: {
      date: '2025-08-12',
      dateLabel: 'August 2025',
      eraId: 'tloas',
      what: 'Taylor announced her 12th studio album, The Life of a Showgirl, with an orange-heavy visual identity.',
    },
    connection: 'The official fan-team account used orange-coded tour imagery to prime fans for the Showgirl palette.',
    confirmed: true,
    sources: [
      { name: 'The Guardian', url: 'https://www.theguardian.com/music/2025/aug/12/taylor-swift-new-album-announcement-countdown-new-heights-podcast-the-life-of-a-showgirl' },
      { name: 'People', url: 'https://people.com/taylor-swift-new-album-life-of-a-showgirl-style-easter-eggs-decoded-11789517' },
    ],
  },
  {
    id: 'clue-showgirl-1212-countdown',
    title: 'The 12:12 countdown',
    plant: {
      date: '2025-08-11',
      dateLabel: 'August 2025',
      eraId: 'tloas',
      what: 'Taylor’s website displayed a glittering orange countdown set to expire at 12:12 a.m. ET.',
    },
    payoff: {
      date: '2025-08-12',
      dateLabel: 'August 2025',
      eraId: 'tloas',
      what: 'At the end of the countdown, the site revealed The Life of a Showgirl, Taylor’s 12th studio album.',
    },
    connection: 'The 12:12 timing pointed directly to TS12.',
    confirmed: true,
    sources: [
      { name: 'Good Morning America', url: 'https://abcnews.go.com/GMA/Culture/taylor-swift-announces-12th-studio-album-life-showgirl/story?id=124564822' },
      { name: 'The Guardian', url: 'https://www.theguardian.com/music/2025/aug/12/taylor-swift-new-album-announcement-countdown-new-heights-podcast-the-life-of-a-showgirl' },
    ],
  },
  {
    id: 'clue-showgirl-briefcase-colors',
    title: 'The mint-and-orange briefcase',
    plant: {
      date: '2025-08-12',
      dateLabel: 'August 2025',
      eraId: 'tloas',
      what: 'A New Heights teaser showed Taylor pulling a blurred album from a mint-green briefcase marked with orange “T.S.” initials.',
    },
    payoff: {
      date: '2025-08-13',
      dateLabel: 'August 2025',
      eraId: 'tloas',
      what: 'On the full New Heights episode, Taylor revealed The Life of a Showgirl cover, tracklist, release date, and its orange-and-mint visual world.',
    },
    connection: 'The briefcase previewed the album reveal and its key color palette before the full episode aired.',
    confirmed: true,
    sources: [
      { name: 'Pitchfork', url: 'https://pitchfork.com/news/taylor-swift-announces-new-album-the-life-of-a-showgirl/' },
      { name: 'Teen Vogue', url: 'https://www.teenvogue.com/story/taylor-swift-12th-album-the-life-of-a-showgirl-everything-you-need-to-know' },
    ],
  },
  {
    id: 'clue-showgirl-max-shellback-playlist',
    title: 'The Max Martin and Shellback playlist',
    plant: {
      date: '2025-08-12',
      dateLabel: 'August 2025',
      eraId: 'tloas',
      what: 'After the album announcement, Taylor shared a Spotify playlist made up of past songs produced by Max Martin and Shellback.',
    },
    payoff: {
      date: '2025-10-03',
      dateLabel: 'October 2025',
      eraId: 'tloas',
      what: 'The Life of a Showgirl was released with Max Martin and Shellback as central collaborators and producers.',
    },
    connection: 'The playlist previewed the production team behind Taylor’s next pop album.',
    confirmed: true,
    sources: [
      { name: 'NME', url: 'https://www.nme.com/news/music/taylor-swift-curates-playlist-for-the-life-of-a-showgirl-hinting-at-max-martin-and-shellback-collaboration-3884220' },
      { name: 'Entertainment Weekly', url: 'https://ew.com/taylor-swift-the-life-of-a-showgirl-credits-producers-11823950' },
    ],
  },
];
