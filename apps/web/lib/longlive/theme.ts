import type { CSSProperties } from 'react';
import type { Era, EraFont, EraTheme } from './types';

const FONT_VAR: Record<EraFont, string> = {
  serif: 'var(--font-playfair)',
  sans: 'var(--font-inter)',
  mono: 'var(--font-typewriter)',
  script: 'var(--font-script)',
};

/**
 * The Threads "vault" theme. Deliberately era-agnostic — a gold-on-charcoal
 * archive palette that signals you've stepped *out* of the era timeline and
 * into a cross-era observatory. Shaped like an EraTheme so it flows through the
 * same CSS-variable pipeline.
 */
export const VAULT_THEME: EraTheme = {
  bg: '#0b0b0f',
  surface: '#15151d',
  surface2: '#1e1e28',
  ink: '#f3efe6',
  inkSoft: '#a3a1ad',
  line: '#2c2c38',
  accent: '#cba24d',
  accent2: '#7f9cc4',
  glow: 'rgba(203, 162, 77, 0.26)',
  font: 'serif',
};

/**
 * The Merch shop chrome theme. Shaped like an EraTheme so the app shell
 * (TopBar, BottomNav, SiteFooter) transitions into it exactly like an era
 * change. The `.merch-shell` `--merch-*` tokens are a separate, additional
 * layer used only for the three section accents (gold/rose/lilac) and the
 * page background gradients inside the merch page itself — this theme is
 * what makes the surrounding chrome match.
 */
export const MERCH_THEME: EraTheme = {
  bg: '#17102b',
  surface: '#271b47',
  surface2: '#2e2153',
  ink: '#f6efe4',
  inkSoft: '#b0a2cb',
  line: 'rgba(246, 239, 228, 0.14)',
  accent: '#ebc97f',
  accent2: '#b49bee',
  glow: 'rgba(235, 201, 127, 0.26)',
  font: 'sans',
};

/**
 * Turn an era into the CSS custom properties consumed by globals.css.
 * Apply to the app-shell wrapper; changing it re-skins the whole UI.
 */
export function eraStyle(era: Era): CSSProperties {
  return themeStyle(era.theme);
}

/** Turn the Threads vault palette into the CSS custom properties. */
export function vaultStyle(): CSSProperties {
  return themeStyle(VAULT_THEME);
}

/** Turn the Merch shop palette into the CSS custom properties. */
export function merchStyle(): CSSProperties {
  return themeStyle(MERCH_THEME);
}

/** Shared: turn any EraTheme into the runtime CSS custom properties. */
export function themeStyle(t: EraTheme): CSSProperties {
  return {
    ['--era-bg' as string]: t.bg,
    ['--era-surface' as string]: t.surface,
    ['--era-surface-2' as string]: t.surface2,
    ['--era-ink' as string]: t.ink,
    ['--era-ink-soft' as string]: t.inkSoft,
    ['--era-line' as string]: t.line,
    ['--era-accent' as string]: t.accent,
    ['--era-accent-text' as string]: t.accentText ?? t.accent,
    ['--era-accent-fg' as string]: t.accentFg ?? '#000000',
    ['--era-accent-2' as string]: t.accent2,
    ['--era-glow' as string]: t.glow,
    ['--era-font' as string]: FONT_VAR[t.font],
  };
}
