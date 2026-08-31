import { describe, expect, it } from 'vitest';
import { ONBOARDING_PRESETS, onboardingPresetById } from './notifications-types';

function cadenceFor(prefs: readonly { category: string; cadence: string }[], category: string) {
  return prefs.find((p) => p.category === category)?.cadence;
}

describe('ONBOARDING_PRESETS (spec §7)', () => {
  it('has exactly three presets with the verbatim spec §7 titles', () => {
    expect(ONBOARDING_PRESETS.map((p) => p.title)).toEqual([
      'Just the big stuff',
      'Daily Swiftie',
      'Full Clown \ud83e\udd21',
    ]);
  });

  it('"Just the big stuff": T1 instant, everything else off', () => {
    const preset = onboardingPresetById('big_stuff');
    expect(cadenceFor(preset.prefs, 'song_drop')).toBe('instant');
    expect(cadenceFor(preset.prefs, 'album_news')).toBe('instant');
    expect(cadenceFor(preset.prefs, 'tour_news')).toBe('instant');
    for (const p of preset.prefs) {
      if (['song_drop', 'album_news', 'tour_news'].includes(p.category)) continue;
      expect(p.cadence).toBe('off');
    }
  });

  it('"Daily Swiftie": T1 instant, T2 daily digest, weekly Clown Report', () => {
    const preset = onboardingPresetById('daily_swiftie');
    expect(cadenceFor(preset.prefs, 'song_drop')).toBe('instant');
    expect(cadenceFor(preset.prefs, 'official_merch')).toBe('daily');
    expect(cadenceFor(preset.prefs, 'official_youtube')).toBe('daily');
    expect(cadenceFor(preset.prefs, 'relationship_news')).toBe('daily');
    expect(cadenceFor(preset.prefs, 'public_appearance')).toBe('daily');
    expect(cadenceFor(preset.prefs, 'easter_egg')).toBe('weekly'); // the Clown Report
    expect(cadenceFor(preset.prefs, 'lyric_of_day')).toBe('off'); // Fun stays off
  });

  it('"Full Clown": everything on at defaults + lyric of the day', () => {
    const preset = onboardingPresetById('full_clown');
    expect(cadenceFor(preset.prefs, 'song_drop')).toBe('instant');
    expect(cadenceFor(preset.prefs, 'official_merch')).toBe('daily');
    expect(cadenceFor(preset.prefs, 'award_news')).toBe('weekly');
    expect(cadenceFor(preset.prefs, 'easter_egg')).toBe('weekly');
    expect(cadenceFor(preset.prefs, 'lyric_of_day')).toBe('daily');
  });

  it('every preset covers every category (no gaps for the PUT batch write)', () => {
    for (const preset of ONBOARDING_PRESETS) {
      expect(preset.prefs).toHaveLength(13); // 10 steady + 3 fun
    }
  });

  it('throws for an unknown preset id', () => {
    // @ts-expect-error deliberately invalid for the test
    expect(() => onboardingPresetById('nonexistent')).toThrow();
  });
});
