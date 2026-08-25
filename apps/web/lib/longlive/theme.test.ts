import { describe, expect, it } from 'vitest';
import { ERAS } from './eras';
import { eraStyle, themeStyle, VAULT_THEME } from './theme';

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
