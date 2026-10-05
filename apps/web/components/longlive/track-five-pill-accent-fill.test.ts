import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// #3662: TrackFivePill hardcoded `text-white` over the raw `--era-accent` fill —
// 2.35:1 on tloas at 10px, under WCAG 1.4.3's 4.5:1, and the badge renders on
// every era's Track Guide (each album has exactly one track 5). Same "white text
// on saturated theme accent" shape as #659, fixed elsewhere by #3318's
// `accentFgFor`/`--era-accent-fg` token; this component was never touched by
// that fix. theme.test.ts already sweeps the token ≥4.5:1 across every theme,
// so this file only source-locks the pairing here.

const SRC = readFileSync(fileURLToPath(new URL('./TrackFivePill.tsx', import.meta.url)), 'utf8');

describe('#3662 TrackFivePill never repaints white text on the raw accent fill', () => {
  it('has no hardcoded text-white left', () => {
    expect(SRC).not.toMatch(/text-white/);
  });

  it('pairs the solid accent fill with the --era-accent-fg token', () => {
    expect(SRC).toMatch(/text-\[color:var\(--era-accent-fg\)\]/);
    expect(SRC).toMatch(/backgroundColor:\s*'var\(--era-accent\)'/);
  });
});
