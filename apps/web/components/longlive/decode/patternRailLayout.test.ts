import { describe, expect, it } from 'vitest';
import { RAIL_BUTTON_CLASS, railButtonLabel } from './patternRailLayout';

describe('PatternRail era buttons', () => {
  // Regression for #727 (WCAG 2.5.8 Target Size): the hit area used to be the
  // density-scaled dot itself — 6–12px, 14px active. What carries the fix: a
  // fixed 24×24px button box that never shrinks, with the dot centered inside.
  it('gives every era button a fixed 24×24px hit area (#727)', () => {
    expect(RAIL_BUTTON_CLASS).toContain('h-6');
    expect(RAIL_BUTTON_CLASS).toContain('w-6');
    expect(RAIL_BUTTON_CLASS).toContain('shrink-0');
    expect(RAIL_BUTTON_CLASS).toContain('items-center');
    expect(RAIL_BUTTON_CLASS).toContain('justify-center');
  });

  it('names the button with era + clue count, pluralized', () => {
    expect(railButtonLabel('Red', 1)).toBe('Red — 1 clue');
    expect(railButtonLabel('1989', 8)).toBe('1989 — 8 clues');
  });
});
