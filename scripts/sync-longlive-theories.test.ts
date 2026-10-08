import { describe, expect, it } from 'vitest';
// The generator only writes files when invoked directly; importing it here
// just pulls in its pure normalization functions.
import { buildTheoryGuide, normalizeTheory, relatedSlugsFrom } from './sync-longlive-theories.mjs';

const src = [{ source_url: 'https://en.wikipedia.org/wiki/Example', source_title: 'Example', publisher: 'Wikipedia' }];

const base = {
  slug: 'karma-lost-album',
  kind: 'theory',
  title: 'The lost Karma album',
  claim: 'A finished album was shelved in 2016.',
  evidence: 'Built from 2016-era teasers.',
  confidence: 'strong_fan_consensus',
  outcome: 'pending',
  sources: src,
};

describe('normalizeTheory', () => {
  it('normalizes a seed-shape theory into the UI TheoryNote shape', () => {
    const t = normalizeTheory({
      ...base,
      title: '  The lost Karma album ',
      claim: ' A finished album was shelved in 2016. ',
      evidence: '  Built from 2016-era teasers. ',
    });
    expect(t).toEqual({
      slug: 'karma-lost-album',
      kind: 'theory',
      title: 'The lost Karma album',
      claim: 'A finished album was shelved in 2016.',
      evidence: 'Built from 2016-era teasers.',
      confidence: 'strong_fan_consensus',
      outcome: 'pending',
      sources: [{ name: 'Example', url: 'https://en.wikipedia.org/wiki/Example' }],
    });
  });

  it('keeps easter_egg kind and coerces anything else to theory', () => {
    expect(normalizeTheory({ ...base, kind: 'easter_egg' })?.kind).toBe('easter_egg');
    expect(normalizeTheory({ ...base, kind: 'rumor' })?.kind).toBe('theory');
    expect(normalizeTheory({ ...base, kind: undefined })?.kind).toBe('theory');
  });

  it('coerces a missing/blank evidence trail to null', () => {
    expect(normalizeTheory({ ...base, evidence: undefined })?.evidence).toBeNull();
    expect(normalizeTheory({ ...base, evidence: '   ' })?.evidence).toBeNull();
  });

  it('drops records missing slug, title, or claim (no empty placeholders)', () => {
    expect(normalizeTheory({ ...base, slug: '  ' })).toBeNull();
    expect(normalizeTheory({ ...base, title: '' })).toBeNull();
    expect(normalizeTheory({ ...base, claim: undefined })).toBeNull();
  });

  it('drops records with a missing or unknown confidence/outcome — the badges are required', () => {
    expect(normalizeTheory({ ...base, confidence: undefined })).toBeNull();
    expect(normalizeTheory({ ...base, confidence: 'very_sure' })).toBeNull();
    expect(normalizeTheory({ ...base, outcome: undefined })).toBeNull();
    expect(normalizeTheory({ ...base, outcome: 'maybe' })).toBeNull();
  });

  it('drops records with no real source', () => {
    expect(normalizeTheory({ ...base, sources: [] })).toBeNull();
    expect(normalizeTheory({ ...base, sources: undefined })).toBeNull();
  });

  it('resolves relatedSlugs through SLUG_TO_ERA_ID and drops malformed entries', () => {
    const t = normalizeTheory({
      ...base,
      relatedSlugs: ['debut:lucky-number-13', 'the-life-of-a-showgirl:orange-door', 'malformed', 42, ''],
    });
    expect(t?.relatedSlugs).toEqual(['debut:lucky-number-13', 'tloas:orange-door']);
  });

  it('omits relatedSlugs entirely when empty or absent (no empty-array placeholder)', () => {
    expect(normalizeTheory({ ...base, relatedSlugs: [] })?.relatedSlugs).toBeUndefined();
    expect(normalizeTheory({ ...base })?.relatedSlugs).toBeUndefined();
  });
});

describe('relatedSlugsFrom', () => {
  it('maps seed era slugs to EraIds and passes already-correct EraIds through', () => {
    expect(relatedSlugsFrom(['tortured-poets:peter-pan', 'midnights:karma'])).toEqual([
      'ttpd:peter-pan',
      'midnights:karma',
    ]);
  });

  it('returns an empty array for non-array input', () => {
    expect(relatedSlugsFrom(undefined)).toEqual([]);
    expect(relatedSlugsFrom(null)).toEqual([]);
  });
});

describe('buildTheoryGuide', () => {
  it('maps seed era slugs to LongLive EraIds and passes matching slugs through', () => {
    const byEra = buildTheoryGuide([
      { eraSlug: 'tortured-poets', ...base, slug: 'a' },
      { eraSlug: 'the-life-of-a-showgirl', ...base, slug: 'b' },
      { eraSlug: 'midnights', ...base, slug: 'c' },
    ]);
    expect(Object.keys(byEra).sort()).toEqual(['midnights', 'tloas', 'ttpd']);
  });

  it('de-dupes repeated slugs within an era (first wins) and preserves authored order', () => {
    const byEra = buildTheoryGuide([
      { eraSlug: 'red', ...base, slug: 'one', title: 'First' },
      { eraSlug: 'red', ...base, slug: 'two', title: 'Second' },
      { eraSlug: 'red', ...base, slug: 'one', title: 'Dupe' },
    ]);
    expect(byEra.red.map((t) => t.title)).toEqual(['First', 'Second']);
  });

  it('drops unrenderable records without creating an empty era array', () => {
    const byEra = buildTheoryGuide([{ eraSlug: 'red', ...base, confidence: 'nope' }]);
    expect(byEra.red).toBeUndefined();
  });
});
