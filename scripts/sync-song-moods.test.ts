import { describe, expect, it } from 'vitest';
// The generator only writes files when invoked directly; importing it here just
// pulls in its pure normalization/validation functions.
import {
  MOOD_AXES,
  buildCatalogue,
  looksLikeLyric,
  normalizeScore,
  renderModule,
  round2,
  unit,
  validateScore,
  youtubeIdFrom,
} from './sync-song-moods.mjs';
// Drift guard: the generator's axis list must equal the type's source of truth.
import { MOOD_AXES as TYPES_MOOD_AXES } from '../packages/experience/src/types';

// A complete, valid raw score for reuse in tests.
const validScore = () => ({
  slug: 'all-too-well-10-minute-version',
  moods: {
    heartbreak: 0.95,
    anger: 0.6,
    nostalgia: 0.85,
    joy: 0.05,
    calm: 0.1,
    defiance: 0.3,
    longing: 0.9,
    catharsis: 0.8,
  },
  energy: 0.5,
  valence: 0.15,
  useCase: ['crying in the car', 'the 3am spiral'],
  oneLiner: 'Ten minutes of a wound reopened on purpose.',
});

describe('axis contract', () => {
  it('the generator axis list matches the SongMood type source of truth', () => {
    expect([...MOOD_AXES]).toEqual([...TYPES_MOOD_AXES]);
  });
});

describe('youtubeIdFrom', () => {
  it('accepts a bare 11-char id and trims it', () => {
    expect(youtubeIdFrom('  GkD20ajVxnY ')).toBe('GkD20ajVxnY');
  });
  it('rejects the wrong length or non-id shapes', () => {
    expect(youtubeIdFrom('short')).toBeUndefined();
    expect(youtubeIdFrom('https://youtu.be/GkD20ajVxnY')).toBeUndefined();
    expect(youtubeIdFrom(undefined)).toBeUndefined();
  });
});

describe('unit / round2', () => {
  it('accepts numbers in [0,1] and rejects everything else', () => {
    expect(unit(0)).toBe(0);
    expect(unit(1)).toBe(1);
    expect(unit(0.42)).toBe(0.42);
    expect(unit(-0.1)).toBeNull();
    expect(unit(1.1)).toBeNull();
    expect(unit(NaN)).toBeNull();
    expect(unit('0.5')).toBeNull();
  });
  it('rounds to 2 decimals', () => {
    expect(round2(0.333333)).toBe(0.33);
    expect(round2(0.955)).toBe(0.96);
  });
});

describe('looksLikeLyric', () => {
  it('flags text with an internal line break as verse-shaped', () => {
    expect(looksLikeLyric('one line\nsecond line')).toBe(true);
    expect(looksLikeLyric('carriage\r\nreturn')).toBe(true);
  });
  it('passes an ordinary single-line sentence', () => {
    expect(looksLikeLyric('Ten minutes of a wound reopened on purpose.')).toBe(false);
  });
});

describe('validateScore', () => {
  const resolvable = new Set(['all-too-well-10-minute-version', 'red']);

  it('returns no errors for a clean, resolvable entry', () => {
    expect(validateScore(validScore(), resolvable, 't')).toEqual([]);
  });

  it('flags a missing slug and stops there', () => {
    const errs = validateScore({ ...validScore(), slug: '' }, resolvable, 't');
    expect(errs).toHaveLength(1);
    expect(errs[0]).toMatch(/missing slug/);
  });

  it('flags a slug that does not resolve to a real track', () => {
    const errs = validateScore({ ...validScore(), slug: 'not-a-real-song' }, resolvable, 't');
    expect(errs.some((e) => /does not resolve to a real track/.test(e))).toBe(true);
  });

  it('flags a missing axis, an out-of-range axis, and an unknown axis', () => {
    const raw = validScore();
    delete raw.moods.calm;
    raw.moods.anger = 1.5;
    raw.moods.bliss = 0.5;
    const errs = validateScore(raw, resolvable, 't');
    expect(errs.some((e) => /"calm"/.test(e))).toBe(true);
    expect(errs.some((e) => /"anger"/.test(e))).toBe(true);
    expect(errs.some((e) => /unknown mood axis "bliss"/.test(e))).toBe(true);
  });

  it('flags out-of-range energy/valence', () => {
    const errs = validateScore({ ...validScore(), energy: 2, valence: -1 }, resolvable, 't');
    expect(errs.some((e) => /energy/.test(e))).toBe(true);
    expect(errs.some((e) => /valence/.test(e))).toBe(true);
  });

  it('flags an empty useCase and a lyric-shaped one-liner', () => {
    const errs = validateScore(
      { ...validScore(), useCase: [], oneLiner: 'a quoted line\nanother quoted line' },
      resolvable,
      't',
    );
    expect(errs.some((e) => /useCase must be a non-empty array/.test(e))).toBe(true);
    expect(errs.some((e) => /oneLiner looks like quoted verse/.test(e))).toBe(true);
  });

  it('flags an over-long one-liner', () => {
    const errs = validateScore({ ...validScore(), oneLiner: 'x'.repeat(200) }, resolvable, 't');
    expect(errs.some((e) => /oneLiner exceeds/.test(e))).toBe(true);
  });
});

describe('normalizeScore', () => {
  it('produces all eight axes, clamped and rounded', () => {
    const norm = normalizeScore(validScore());
    expect(Object.keys(norm.moods).sort()).toEqual([...MOOD_AXES].sort());
    expect(norm.energy).toBe(0.5);
    expect(norm.valence).toBe(0.15);
    expect(norm.useCase).toEqual(['crying in the car', 'the 3am spiral']);
    expect(norm.oneLiner).toBe('Ten minutes of a wound reopened on purpose.');
  });
});

describe('buildCatalogue', () => {
  const tracks = [
    {
      eraId: 'red',
      slug: 'all-too-well-10-minute-version',
      title: 'All Too Well (10 Minute Version)',
      trackNumber: 5,
      youtubeId: 'GkD20ajVxnY',
    },
    { eraId: 'red', slug: 'red', title: 'Red', trackNumber: 2 },
    { eraId: 'debut', slug: 'tim-mcgraw', title: 'Tim McGraw', trackNumber: 1 },
    { eraId: 'red', slug: '', title: 'Unslugged', trackNumber: 9 }, // dropped
  ];

  it('merges a score onto its matching track and leaves others unscored', () => {
    const scored = {
      eraId: 'red',
      slug: 'all-too-well-10-minute-version',
      ...normalizeScore(validScore()),
    };
    const cat = buildCatalogue(tracks, [scored]);
    const atw = cat.find((s) => s.slug === 'all-too-well-10-minute-version');
    expect(atw.moods.heartbreak).toBe(0.95);
    expect(atw.youtubeId).toBe('GkD20ajVxnY');
    expect(cat.find((s) => s.slug === 'red').moods).toBeUndefined();
  });

  it('drops unslugged/untitled tracks and orders by era then track number', () => {
    const cat = buildCatalogue(tracks, []);
    expect(cat.map((s) => s.slug)).toEqual(['tim-mcgraw', 'red', 'all-too-well-10-minute-version']);
    expect(cat.some((s) => s.title === 'Unslugged')).toBe(false);
  });

  it('de-dupes a repeated (era, slug), first wins', () => {
    const dup = [
      ...tracks,
      { eraId: 'debut', slug: 'tim-mcgraw', title: 'Tim McGraw (dupe)', trackNumber: 1 },
    ];
    const cat = buildCatalogue(dup, []);
    expect(cat.filter((s) => s.slug === 'tim-mcgraw')).toHaveLength(1);
    expect(cat.find((s) => s.slug === 'tim-mcgraw').title).toBe('Tim McGraw');
  });
});

describe('renderModule', () => {
  it('emits scored fields only for scored songs', () => {
    const scored = {
      eraId: 'red',
      slug: 'all-too-well-10-minute-version',
      ...normalizeScore(validScore()),
    };
    const cat = buildCatalogue(
      [
        {
          eraId: 'red',
          slug: 'all-too-well-10-minute-version',
          title: 'All Too Well (10 Minute Version)',
          trackNumber: 5,
          youtubeId: 'GkD20ajVxnY',
        },
        { eraId: 'red', slug: 'red', title: 'Red', trackNumber: 2 },
      ],
      [scored],
    );
    const out = renderModule(cat);
    expect(out).toContain("import type { SongMood } from '@swift2/experience';");
    expect(out).toContain('1 scored');
    expect(out).toContain('oneLiner: "Ten minutes of a wound reopened on purpose."');
    // Exactly one song is scored, so exactly one `moods:` block is emitted —
    // the unscored "Red" entry carries no mood fields.
    expect((out.match(/moods:/g) || []).length).toBe(1);
  });
});
