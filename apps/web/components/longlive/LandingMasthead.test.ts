import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// No jsdom/testing-library render harness for this component (same
// constraint TimelineScrubber.test.ts documents) — source-level regression
// pin for re-review finding F (2026-08-13).
const src = readFileSync(join(__dirname, 'LandingMasthead.tsx'), 'utf8');

describe('LandingMasthead — re-review finding F (gloss line flash and reflow)', () => {
  it('swaps in the daily gloss in a pre-paint layout effect, not a post-paint effect', () => {
    expect(src).toContain('useLayoutEffect');
    expect(src).toContain('useLayoutEffect(() => setDayKey(todayKey()), [])');
    expect(src).not.toMatch(/\buseEffect\(/);
  });

  it('reserves two lines of height on the gloss button so a longer pick cannot reflow the page below it', () => {
    expect(src).toContain('min-h-14');
    expect(src).not.toContain('min-h-11');
  });

  it('still rotates daily — the pool lookup was not removed', () => {
    expect(src).toContain('dailyGloss(dayKey)');
    expect(src).toContain('GLOSS_SECTIONS[0]');
  });
});
