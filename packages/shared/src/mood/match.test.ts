import { describe, expect, it } from 'vitest';
import {
  matchMoodsFromText,
  moodMatchesFromSlugs,
  normalizeMoodText,
  rankSongsForMoods,
  validateMoodTaxonomy,
  validateSongMoodTags,
} from './match';
import { STRAWMAN_MOOD_TAXONOMY, STRAWMAN_SONG_MOOD_TAGS } from './strawman';
import type { MoodTaxonomy, SongMoodTag } from './types';

const taxonomy: MoodTaxonomy = {
  version: 1,
  moods: [
    {
      slug: 'blue',
      label: 'Blue',
      prompt: 'I feel blue',
      keywords: ['sad', 'crying', 'crying at 2am'],
    },
    {
      slug: 'fired-up',
      label: 'Fired up',
      prompt: 'I am fired up',
      keywords: ['angry', 'revenge'],
    },
    {
      slug: 'soft',
      label: 'Soft',
      prompt: 'I want something soft',
      keywords: ['cozy', 'calm', 'rainy'],
    },
  ],
};

const tags: readonly SongMoodTag[] = [
  { eraSlug: 'red', trackTitle: 'Alpha', moodSlug: 'blue', weight: 3 },
  { eraSlug: 'red', trackTitle: 'Beta', moodSlug: 'blue', weight: 1 },
  { eraSlug: 'lover', trackTitle: 'Beta', moodSlug: 'fired-up', weight: 2 },
  { eraSlug: 'folklore', trackTitle: 'Gamma', moodSlug: 'blue', weight: 1 },
  { eraSlug: 'folklore', trackTitle: 'Gamma', moodSlug: 'soft', weight: 3 },
];

describe('normalizeMoodText', () => {
  it('lowercases, strips punctuation and apostrophes, collapses whitespace', () => {
    expect(normalizeMoodText("  I'm SO   sad!! (crying, tbh) ")).toBe('im so sad crying tbh');
  });

  it('returns empty string for punctuation-only input', () => {
    expect(normalizeMoodText('?!... ---')).toBe('');
  });
});

describe('matchMoodsFromText', () => {
  it('matches single-word keywords case- and punctuation-insensitively', () => {
    const matches = matchMoodsFromText(taxonomy, 'Feeling SAD today...');
    expect(matches).toEqual([{ moodSlug: 'blue', score: 1, matchedKeywords: ['sad'] }]);
  });

  it('matches multiword phrases as contiguous tokens and scores them higher', () => {
    const matches = matchMoodsFromText(taxonomy, 'i was crying at 2am again');
    expect(matches).toHaveLength(1);
    // "crying" (1) + phrase "crying at 2am" (2)
    expect(matches[0]).toEqual({
      moodSlug: 'blue',
      score: 3,
      matchedKeywords: ['crying', 'crying at 2am'],
    });
  });

  it('does not match a phrase whose words are present but not contiguous', () => {
    const matches = matchMoodsFromText(taxonomy, 'crying because at midnight, 2am even');
    expect(matches[0]!.matchedKeywords).toEqual(['crying']);
  });

  it('does not substring-match inside words', () => {
    // "sadness" must not match keyword "sad"
    expect(matchMoodsFromText(taxonomy, 'sadness')).toEqual([]);
  });

  it('returns multiple moods sorted by score desc then slug asc', () => {
    const matches = matchMoodsFromText(taxonomy, 'sad and angry and cozy');
    expect(matches.map((m) => m.moodSlug)).toEqual(['blue', 'fired-up', 'soft']);
    const scores = matches.map((m) => m.score);
    expect(scores).toEqual([1, 1, 1]);
  });

  it('returns [] for empty or unmatchable input (fallback = starter chips)', () => {
    expect(matchMoodsFromText(taxonomy, '')).toEqual([]);
    expect(matchMoodsFromText(taxonomy, 'quantum chromodynamics')).toEqual([]);
  });
});

describe('moodMatchesFromSlugs', () => {
  it('gives each tapped chip equal weight', () => {
    expect(moodMatchesFromSlugs(['blue', 'soft'])).toEqual([
      { moodSlug: 'blue', score: 1, matchedKeywords: [] },
      { moodSlug: 'soft', score: 1, matchedKeywords: [] },
    ]);
  });
});

describe('rankSongsForMoods', () => {
  it('ranks by tag weight × match score', () => {
    const ranked = rankSongsForMoods(tags, [{ moodSlug: 'blue', score: 2, matchedKeywords: [] }]);
    expect(ranked.map((s) => [s.trackTitle, s.score])).toEqual([
      ['Alpha', 6],
      ['Beta', 2],
      ['Gamma', 2],
    ]);
  });

  it('aggregates across moods and reports contributing moods strongest-first', () => {
    const ranked = rankSongsForMoods(tags, moodMatchesFromSlugs(['blue', 'soft']));
    const gamma = ranked.find((s) => s.trackTitle === 'Gamma')!;
    expect(gamma.score).toBe(4); // blue 1×1 + soft 3×1
    expect(gamma.moodSlugs).toEqual(['soft', 'blue']);
  });

  it('breaks score ties by trackTitle then eraSlug, deterministically', () => {
    const ranked = rankSongsForMoods(tags, moodMatchesFromSlugs(['blue', 'soft']));
    // Beta(red)=1 vs Alpha=3 vs Gamma=4 → order Gamma, Alpha, Beta
    expect(ranked.map((s) => s.trackTitle)).toEqual(['Gamma', 'Alpha', 'Beta']);
    const twice = rankSongsForMoods(tags, moodMatchesFromSlugs(['blue', 'soft']));
    expect(twice).toEqual(ranked);
  });

  it('treats same title in different eras as different songs', () => {
    const ranked = rankSongsForMoods(tags, moodMatchesFromSlugs(['blue', 'fired-up']));
    const betas = ranked.filter((s) => s.trackTitle === 'Beta');
    expect(betas.map((s) => s.eraSlug).sort()).toEqual(['lover', 'red']);
  });

  it('ignores matches for unknown mood slugs and respects the limit', () => {
    expect(rankSongsForMoods(tags, moodMatchesFromSlugs(['nope']))).toEqual([]);
    expect(rankSongsForMoods(tags, moodMatchesFromSlugs(['blue']), 1)).toHaveLength(1);
  });

  it('returns [] for empty matches', () => {
    expect(rankSongsForMoods(tags, [])).toEqual([]);
  });
});

describe('validators', () => {
  it('accept a well-formed taxonomy and tags', () => {
    expect(validateMoodTaxonomy(taxonomy)).toEqual([]);
    expect(validateSongMoodTags(taxonomy, tags)).toEqual([]);
  });

  it('flag duplicate slugs, empty fields, and non-normalized keywords', () => {
    const bad: MoodTaxonomy = {
      version: 1,
      moods: [
        { slug: 'a', label: 'A', prompt: 'p', keywords: ['ok'] },
        { slug: 'a', label: '', prompt: 'p', keywords: ["Don't!", 'ok', 'ok'] },
        { slug: 'Bad Slug', label: 'B', prompt: '', keywords: [] },
      ],
    };
    const problems = validateMoodTaxonomy(bad);
    expect(problems.some((p) => p.includes('duplicate mood slug "a"'))).toBe(true);
    expect(problems.some((p) => p.includes('empty label'))).toBe(true);
    expect(problems.some((p) => p.includes('not in normalized form'))).toBe(true);
    expect(problems.some((p) => p.includes('duplicate keyword "ok"'))).toBe(true);
    expect(problems.some((p) => p.includes('kebab-case'))).toBe(true);
    expect(problems.some((p) => p.includes('empty prompt'))).toBe(true);
    expect(problems.some((p) => p.includes('no keywords'))).toBe(true);
  });

  it('flag tags with unknown moods, bad weights, and duplicates', () => {
    const badTags: SongMoodTag[] = [
      { eraSlug: 'red', trackTitle: 'X', moodSlug: 'ghost', weight: 2 },
      { eraSlug: 'red', trackTitle: 'X', moodSlug: 'blue', weight: 5 as 1 },
      { eraSlug: 'red', trackTitle: 'Y', moodSlug: 'blue', weight: 1 },
      { eraSlug: 'red', trackTitle: 'Y', moodSlug: 'blue', weight: 2 },
    ];
    const problems = validateSongMoodTags(taxonomy, badTags);
    expect(problems.some((p) => p.includes('unknown mood slug'))).toBe(true);
    expect(problems.some((p) => p.includes('weight must be'))).toBe(true);
    expect(problems.some((p) => p.includes('duplicate tag'))).toBe(true);
  });
});

describe('strawman fixture', () => {
  it('passes its own validators (keeps the placeholder honest)', () => {
    expect(validateMoodTaxonomy(STRAWMAN_MOOD_TAXONOMY)).toEqual([]);
    expect(validateSongMoodTags(STRAWMAN_MOOD_TAXONOMY, STRAWMAN_SONG_MOOD_TAGS)).toEqual([]);
  });

  it('answers a realistic free-text query end-to-end with zero I/O', () => {
    const matches = matchMoodsFromText(
      STRAWMAN_MOOD_TAXONOMY,
      'honestly? crying at 2am, missing how things used to be',
    );
    expect(matches.length).toBeGreaterThan(0);
    const ranked = rankSongsForMoods(STRAWMAN_SONG_MOOD_TAGS, matches, 3);
    expect(ranked).toHaveLength(3);
    expect(ranked[0]!.trackTitle).toBe('All Too Well'); // heartbreak 3 + nostalgic 2
  });
});
