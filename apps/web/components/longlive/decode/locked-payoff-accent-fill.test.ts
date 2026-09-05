import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// #3663: LockedPayoff's blurred era chip painted the payoff era's raw accent
// as text over that same accent at ~15% tint (`${eraColor}26`) — 3.93:1 on
// Midnights/evermore, under WCAG 1.4.3's 4.5:1. The chip is colored by the
// *payoff's* era, not the page's, so no surface-calibrated token can guarantee
// the pairing; the fix is #3318's shape — solid accent fill + `accentFgFor`
// foreground (swept ≥4.5:1 across every theme by theme.test.ts). This file
// source-locks the LockedPayoff region only: the revealed-payoff chip earlier
// in DecodeCard.tsx is a separate, separately-ticketed instance.

const SRC = readFileSync(
  fileURLToPath(new URL('./DecodeCard.tsx', import.meta.url)),
  'utf8',
);

const lockedStart = SRC.indexOf('function LockedPayoff');
const LOCKED = SRC.slice(lockedStart);

describe('#3663 LockedPayoff never rebuilds the text-on-self-tint era chip', () => {
  it('still has the LockedPayoff component to lock', () => {
    expect(lockedStart).toBeGreaterThan(-1);
  });

  it('has no raw-accent tint background left in LockedPayoff', () => {
    expect(LOCKED).not.toMatch(/\$\{eraColor\}/);
  });

  it('has no `color: eraColor` text left in LockedPayoff', () => {
    expect(LOCKED).not.toMatch(/color:\s*eraColor/);
  });

  it('call site derives the chip foreground via accentFgFor', () => {
    expect(SRC).toMatch(/eraFg=\{accentFgFor\(payoffEra\.theme\)\}/);
  });
});
