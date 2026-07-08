import type { Era } from './types';

/**
 * The 12 eras, newest-last in this array (last index = current, The Life of a
 * Showgirl). Keep this array in chronological order — the timeline scrubber and
 * date math depend on it. The era selector reverses this for display.
 * Themes keep a readable contrast floor: ink is always high-contrast on bg,
 * even where the palette is dramatic.
 */
export const ERAS: Era[] = [
  {
    id: 'debut',
    name: 'Taylor Swift',
    shortName: 'Debut',
    album: 'Taylor Swift',
    start: '2006-10-24',
    end: '2008-11-10',
    yearLabel: '2006–2008',
    tagline: 'Teenage Nashville country, curly hair and cowboy boots.',
    intro:
      'A sixteen-year-old from Pennsylvania talks her way onto Music Row and writes her own songs about high-school heartbreak. The beginning of everything.',
    image: '/eras/debut.png',
    theme: {
      bg: '#241a10',
      surface: '#2f2314',
      surface2: '#3a2c1a',
      ink: '#f6e9d2',
      inkSoft: '#c7ad86',
      line: '#4a3820',
      accent: '#e0a83c',
      accent2: '#8fa5c4',
      glow: 'rgba(224, 168, 60, 0.28)',
      font: 'serif',
    },
  },
  {
    id: 'fearless',
    name: 'Fearless',
    shortName: 'Fearless',
    album: 'Fearless',
    start: '2008-11-11',
    end: '2010-10-24',
    yearLabel: '2008–2010',
    tagline: 'Sparkly gold fairy tales and anthemic teenage heartbreak.',
    intro:
      'The album that made her a superstar. Fairy-tale romance, princess dresses, and the first of many awards-show moments that would define a decade.',
    image: '/eras/fearless.png',
    theme: {
      bg: '#2a2109',
      surface: '#372c0d',
      surface2: '#453814',
      ink: '#faf0cf',
      inkSoft: '#d8bd7f',
      line: '#54441a',
      accent: '#f0c948',
      accent2: '#e6b06a',
      glow: 'rgba(240, 201, 72, 0.32)',
      font: 'serif',
    },
  },
  {
    id: 'speak-now',
    name: 'Speak Now',
    shortName: 'Speak Now',
    album: 'Speak Now',
    start: '2010-10-25',
    end: '2012-10-21',
    yearLabel: '2010–2012',
    tagline: 'Written entirely solo. Ballgowns and theatrical purple light.',
    intro:
      'A defiant statement of authorship — every word written alone. Enchanted fairy tales meet theatrical drama under deep violet stage lights.',
    image: '/eras/speak-now.png',
    theme: {
      bg: '#1c1030',
      surface: '#27173f',
      surface2: '#33204f',
      ink: '#efe4fb',
      inkSoft: '#c3a8e0',
      line: '#412a5e',
      accent: '#b06be0',
      accent2: '#7d5bd0',
      glow: 'rgba(176, 107, 224, 0.3)',
      font: 'script',
    },
  },
  {
    id: 'red',
    name: 'Red',
    shortName: 'Red',
    album: 'Red',
    start: '2012-10-22',
    end: '2014-10-26',
    yearLabel: '2012–2014',
    tagline: 'Red lips, autumn leaves, and heartbreak across every genre.',
    intro:
      'The messy, maximalist breakup record. Crimson and rust, scarves and city lights, and a genre-hopping ambition that pointed straight at pop.',
    image: '/eras/red.png',
    theme: {
      bg: '#2a0f0c',
      surface: '#381512',
      surface2: '#481c17',
      ink: '#fbe3dd',
      inkSoft: '#d99f92',
      line: '#582420',
      accent: '#d8433a',
      accent2: '#c96a3a',
      glow: 'rgba(216, 67, 58, 0.32)',
      font: 'serif',
    },
  },
  {
    id: '1989',
    name: '1989',
    shortName: '1989',
    album: '1989',
    start: '2014-10-27',
    end: '2017-08-24',
    yearLabel: '2014–2017',
    tagline: 'A full pop reinvention. New York, Polaroids, seagulls.',
    intro:
      'She burned it all down and rebuilt as a pop star. Clean synth-pop, a Polaroid aesthetic, and the squad era that ruled the mid-2010s.',
    image: '/eras/1989.png',
    theme: {
      bg: '#12212b',
      surface: '#1a2f3c',
      surface2: '#223c4c',
      ink: '#e6f3fb',
      inkSoft: '#9fc2d6',
      line: '#2c4d60',
      accent: '#6fb7d8',
      accent2: '#e8a9b6',
      glow: 'rgba(111, 183, 216, 0.3)',
      font: 'sans',
    },
  },
  {
    id: 'reputation',
    name: 'reputation',
    shortName: 'reputation',
    album: 'reputation',
    start: '2017-08-25',
    end: '2019-08-22',
    yearLabel: '2017–2019',
    tagline: 'Snakes, black-and-white, armored and defiant.',
    intro:
      '“There will be no explanation. There will just be reputation.” The most-armored era: monochrome, industrial, and daring you to underestimate her.',
    image: '/eras/reputation.png',
    theme: {
      bg: '#0a0a0a',
      surface: '#141414',
      surface2: '#1d1d1d',
      ink: '#f0f0f0',
      inkSoft: '#9a9a9a',
      line: '#2e2e2e',
      accent: '#d6d6d6',
      accent2: '#6f6f6f',
      glow: 'rgba(230, 230, 230, 0.16)',
      font: 'sans',
    },
  },
  {
    id: 'lover',
    name: 'Lover',
    shortName: 'Lover',
    album: 'Lover',
    start: '2019-08-23',
    end: '2020-07-23',
    yearLabel: '2019–2020',
    tagline: 'Pastel skies, glitter hearts, romance turned loud again.',
    intro:
      'After the armor came the color. A pastel dreamscape about love in all its forms — and the first album she owned outright.',
    image: '/eras/lover.png',
    theme: {
      bg: '#2a1533',
      surface: '#391e45',
      surface2: '#492757',
      ink: '#fbe6f4',
      inkSoft: '#dba6cf',
      line: '#5a3168',
      accent: '#f07fb8',
      accent2: '#7fb0f0',
      glow: 'rgba(240, 127, 184, 0.3)',
      font: 'sans',
    },
  },
  {
    id: 'folklore',
    name: 'folklore',
    shortName: 'folklore',
    album: 'folklore',
    start: '2020-07-24',
    end: '2020-12-10',
    yearLabel: '2020',
    tagline: 'The surprise pandemic album. Cottagecore, cardigans, woods.',
    intro:
      'A quiet left turn dropped with no warning. Muted, literary, and rain-soaked — indie-folk storytelling that traded stadiums for the forest.',
    image: '/eras/folklore.png',
    theme: {
      bg: '#1a1a1a',
      surface: '#242422',
      surface2: '#2e2e2b',
      ink: '#eae7e0',
      inkSoft: '#a8a49a',
      line: '#3a3a36',
      accent: '#b9b0a0',
      accent2: '#8a9a8f',
      glow: 'rgba(185, 176, 160, 0.18)',
      font: 'serif',
    },
  },
  {
    id: 'evermore',
    name: 'evermore',
    shortName: 'evermore',
    album: 'evermore',
    start: '2020-12-11',
    end: '2022-10-20',
    yearLabel: '2020–2022',
    tagline: "folklore's autumn sister. Flannel, woods, piano ballads.",
    intro:
      'The woods in late autumn. A warmer, rustier companion to folklore — flannel and firelight, with some of her most intricate storytelling.',
    image: '/eras/evermore.png',
    theme: {
      bg: '#241611',
      surface: '#301e16',
      surface2: '#3d281c',
      ink: '#f2e2d6',
      inkSoft: '#c6a58c',
      line: '#4c3324',
      accent: '#c07a45',
      accent2: '#9a7b5a',
      glow: 'rgba(192, 122, 69, 0.26)',
      font: 'serif',
    },
  },
  {
    id: 'midnights',
    name: 'Midnights',
    shortName: 'Midnights',
    album: 'Midnights',
    start: '2022-10-21',
    end: '2024-04-18',
    yearLabel: '2022–2024',
    tagline: 'Late-night, diaristic, moody blues — and the Eras Tour.',
    intro:
      'Thirteen sleepless nights across a life. Retro-glam synths, midnight blues, and the launch of the record-shattering Eras Tour.',
    image: '/eras/midnights.png',
    theme: {
      bg: '#0e1230',
      surface: '#161b40',
      surface2: '#1f2652',
      ink: '#e4e8fb',
      inkSoft: '#a2acd8',
      line: '#2c3566',
      accent: '#8a7fe0',
      accent2: '#c9a24a',
      glow: 'rgba(138, 127, 224, 0.3)',
      font: 'serif',
    },
  },
  {
    id: 'ttpd',
    name: 'The Tortured Poets Department',
    shortName: 'TTPD',
    album: 'The Tortured Poets Department',
    start: '2024-04-19',
    end: '2025-10-02',
    yearLabel: '2024–2025',
    tagline: 'Bruised, word-heavy, black-and-white, typewriter poetry.',
    intro:
      'A literary, ink-stained confessional — typewriter fonts, black-and-white restraint, and lyrics dense as diary pages. The chapter that closed out the Eras Tour.',
    image: '/eras/ttpd.png',
    theme: {
      bg: '#0c0c0c',
      surface: '#161616',
      surface2: '#1e1e1e',
      ink: '#ededed',
      inkSoft: '#9a9a9a',
      line: '#2a2a2a',
      accent: '#e8e8e8',
      accent2: '#8a8a8a',
      glow: 'rgba(255, 255, 255, 0.12)',
      font: 'mono',
    },
  },
  {
    id: 'tloas',
    name: 'The Life of a Showgirl',
    shortName: 'Showgirl',
    album: 'The Life of a Showgirl',
    start: '2025-10-03',
    end: '2026-12-31',
    yearLabel: '2025–present',
    tagline: 'Orange sequins, showgirl glitz, and a victory-lap sparkle.',
    intro:
      'The current chapter. After the ink and restraint of the last era, everything turns warm and dazzling — burnt-orange sequins, feathers and footlights, a showgirl taking her bow.',
    image: '/eras/tloas.png',
    isCurrent: true,
    theme: {
      bg: '#2a1405',
      surface: '#3a1d08',
      surface2: '#4b270c',
      ink: '#ffe9d0',
      inkSoft: '#e2b587',
      line: '#5e3413',
      accent: '#ff8a1e',
      accent2: '#ffd45e',
      glow: 'rgba(255, 138, 30, 0.34)',
      font: 'serif',
    },
  },
];

export const CURRENT_ERA_ID = 'tloas' as const;

export const ERA_BY_ID = Object.fromEntries(ERAS.map((e) => [e.id, e])) as Record<
  Era['id'],
  Era
>;

export function getEra(id: string): Era {
  return ERA_BY_ID[id as Era['id']] ?? ERAS[ERAS.length - 1];
}

/** Index of an era in chronological order (0 = Debut). */
export function eraIndex(id: string): number {
  const i = ERAS.findIndex((e) => e.id === id);
  return i === -1 ? ERAS.length - 1 : i;
}

/**
 * A sequence starting at `fromId` and walking *back* in time (newest → oldest),
 * capped at `count` entries or the start of her career (Debut), whichever comes
 * first. Drives the infinite doom-scroll.
 */
export function erasBackFrom(fromId: string, count: number): Era[] {
  const start = eraIndex(fromId);
  const out: Era[] = [];
  for (let i = start; i >= 0 && out.length < count; i--) out.push(ERAS[i]);
  return out;
}

/** True when this era is the very beginning of her career. */
export function isFirstEra(id: string): boolean {
  return eraIndex(id) === 0;
}

/** Career-wide date bounds for cross-era (Threads) timelines. */
export const CAREER_START_MS = new Date(ERAS[0].start).getTime();
export function careerEndMs(): number {
  return Math.max(Date.now(), new Date(ERAS[ERAS.length - 1].end).getTime());
}
