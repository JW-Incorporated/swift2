import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { ERAS } from '@/lib/longlive/eras';
import { accentFgFor, MERCH_THEME, VAULT_THEME } from '@/lib/longlive/theme';

// #3397: the Crossings year badge (and CrossingDetail's era pill) painted the
// era's raw accent as text over that same accent at 16–18% tint — 3.84:1 on
// Red, under WCAG 1.4.3's 4.5:1. Both chips are colored by the *crossing's*
// era, not the page's, so no surface-calibrated token (`accentText`, #659) can
// guarantee the pairing; the fix is #3318's `defining` shape — solid accent
// fill + `accentFgFor` foreground, whose contrast is independent of context.

const SRC = readFileSync(
  fileURLToPath(new URL('./Crossings.tsx', import.meta.url)),
  'utf8',
);

describe('#3397 Crossings never paints a raw era accent as text', () => {
  it('has no `color: <era>.theme.accent` left in the source', () => {
    expect(SRC).not.toMatch(/color:\s*(?:getEra\([^)]*\)|era)\.theme\.accent/);
  });

  it('has no accent self-tint background left to pair text against', () => {
    expect(SRC).not.toMatch(/color-mix\([^)]*theme\.accent/);
  });
});

describe('#3397 the replacement fill pairing clears WCAG AA on every theme', () => {
  const themes = [
    ...ERAS.map((e) => ({ id: e.id, theme: e.theme })),
    { id: 'vault', theme: VAULT_THEME },
    { id: 'merch', theme: MERCH_THEME },
  ];

  function relativeLuminance(hex: string): number {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }
  function contrastRatio(hex1: string, hex2: string): number {
    const [l1, l2] = [relativeLuminance(hex1), relativeLuminance(hex2)];
    const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (hi + 0.05) / (lo + 0.05);
  }

  it.each(themes)('$id: accentFgFor on solid accent ≥ 4.5:1', ({ theme }) => {
    expect(contrastRatio(accentFgFor(theme), theme.accent)).toBeGreaterThanOrEqual(4.5);
  });
});
