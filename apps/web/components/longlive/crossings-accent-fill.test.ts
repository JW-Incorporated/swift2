import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// #3397: the Crossings year badge (and CrossingDetail's era pill) painted the
// era's raw accent as text over that same accent at 16–18% tint — 3.84:1 on
// Red, under WCAG 1.4.3's 4.5:1. Both chips are colored by the *crossing's*
// era, not the page's, so no surface-calibrated token (`accentText`, #659) can
// guarantee the pairing; the fix is #3318's `defining` shape — solid accent
// fill + `accentFgFor` foreground. That pairing is swept ≥4.5:1 across every
// theme by theme.test.ts (#3318); this file only source-locks Crossings.tsx
// so neither half of the tinted-chip shape can quietly return.

const SRC = readFileSync(
  fileURLToPath(new URL('./Crossings.tsx', import.meta.url)),
  'utf8',
);

describe('#3397 Crossings never rebuilds the text-on-self-tint chip', () => {
  it('has no `color: <era>.theme.accent` left in the source', () => {
    expect(SRC).not.toMatch(/color:\s*(?:getEra\([^)]*\)|era)\.theme\.accent/);
  });

  it('has no accent self-tint background left to pair text against', () => {
    expect(SRC).not.toMatch(/color-mix\([^`]*theme\.accent/);
  });
});
