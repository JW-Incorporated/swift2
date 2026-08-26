import { describe, expect, it } from 'vitest';
import { ERAS } from './eras';
import { eraStyle, MERCH_THEME, themeStyle, VAULT_THEME } from './theme';

// #659: --era-accent-text needs to reach every consumer even though most
// themes don't set an explicit `accentText` override.
describe('themeStyle — #659 (--era-accent-text propagation)', () => {
  it('falls back to accent when a theme has no accentText override', () => {
    const style = themeStyle(VAULT_THEME) as Record<string, string>;
    expect(style['--era-accent-text']).toBe(VAULT_THEME.accent);
  });

  it('uses the override when a theme sets accentText', () => {
    const red = ERAS.find((e) => e.id === 'red')!;
    const style = eraStyle(red) as Record<string, string>;
    expect(style['--era-accent-text']).toBe(red.theme.accentText);
    expect(style['--era-accent-text']).not.toBe(red.theme.accent);
  });
});

// #3318: --era-accent-fg is the on-fill counterpart of #659's --era-accent-text
// (text painted on a *solid accent background*, e.g. SignificanceBadge's
// "Career-defining" fill, instead of accent-colored text on a surface).
describe('themeStyle — #3318 (--era-accent-fg propagation)', () => {
  it('falls back to a fixed near-black when a theme has no accentFg override', () => {
    const style = themeStyle(VAULT_THEME) as Record<string, string>;
    expect(style['--era-accent-fg']).toBe('#000000');
  });

  it('would use an override if a theme set accentFg (none currently need one)', () => {
    expect(ERAS.every((e) => e.theme.accentFg === undefined)).toBe(true);
  });
});

// WCAG relative-luminance contrast, same formula axe-core uses for
// color-contrast (relied on directly since no shared helper exists yet).
function relativeLuminance(hex: string): number {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrastRatio(hex1: string, hex2: string): number {
  const [l1, l2] = [relativeLuminance(hex1), relativeLuminance(hex2)];
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// #3318 acceptance: axe color-contrast clean on SignificanceBadge's
// 'defining' (accentFg-on-accent fill) and 'notable' (accentText-on-surface)
// variants, on every era plus the vault/merch chrome themes.
describe('SignificanceBadge colors — WCAG AA 4.5:1 (#3318)', () => {
  const themes = [...ERAS.map((e) => ({ id: e.id, theme: e.theme })), { id: 'vault', theme: VAULT_THEME }, { id: 'merch', theme: MERCH_THEME }];

  it.each(themes)('$id: "defining" fill clears 4.5:1 (accentFg on accent)', ({ theme }) => {
    const fg = theme.accentFg ?? '#000000';
    expect(contrastRatio(fg, theme.accent)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(themes)('$id: "notable" outline text clears 4.5:1 (accentText on surface)', ({ theme }) => {
    const fg = theme.accentText ?? theme.accent;
    expect(contrastRatio(fg, theme.surface)).toBeGreaterThanOrEqual(4.5);
  });
});
