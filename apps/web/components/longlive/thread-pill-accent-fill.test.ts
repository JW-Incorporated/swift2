import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// #3411: the era pill on RunwayThread and ProposalThread painted the era's raw
// accent as text over that same accent at 14% tint — 3.2–4.46:1 across
// Midnights/evermore/Red/Speak Now, under WCAG 1.4.3's 4.5:1. Same family as
// #3397's Crossings chips: the pill is colored by the *item's* era (in
// ProposalThread the page even runs the vault theme), so no surface-calibrated
// token can guarantee the pairing; the fix is the same solid accent fill +
// `accentFgFor` foreground, swept ≥4.5:1 across every theme by theme.test.ts
// (#3318). This file only source-locks both components so neither half of the
// tinted-chip shape can quietly return.

const SOURCES = ['./runway/RunwayThread.tsx', './proposal/ProposalThread.tsx'].map(
  (rel) => [rel, readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')] as const,
);

describe('#3411 thread era pills never rebuild the text-on-self-tint chip', () => {
  it.each(SOURCES)('%s has no accent self-tint background left', (_rel, src) => {
    expect(src).not.toMatch(/color-mix\([^`]*theme\.accent/);
  });

  it.each(SOURCES)('%s pairs the solid accent fill with accentFgFor', (_rel, src) => {
    expect(src).toMatch(
      /backgroundColor:\s*era\.theme\.accent,\s*color:\s*accentFgFor\(era\.theme\)/,
    );
  });
});
