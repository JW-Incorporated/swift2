import type { CSSProperties } from 'react';
import type { Era, EraFont } from './types';

const FONT_VAR: Record<EraFont, string> = {
  serif: 'var(--font-playfair)',
  sans: 'var(--font-inter)',
  mono: 'var(--font-typewriter)',
  script: 'var(--font-script)',
};

/**
 * Turn an era into the CSS custom properties consumed by globals.css.
 * Apply to the app-shell wrapper; changing it re-skins the whole UI.
 */
export function eraStyle(era: Era): CSSProperties {
  const t = era.theme;
  return {
    ['--era-bg' as string]: t.bg,
    ['--era-surface' as string]: t.surface,
    ['--era-surface-2' as string]: t.surface2,
    ['--era-ink' as string]: t.ink,
    ['--era-ink-soft' as string]: t.inkSoft,
    ['--era-line' as string]: t.line,
    ['--era-accent' as string]: t.accent,
    ['--era-accent-2' as string]: t.accent2,
    ['--era-glow' as string]: t.glow,
    ['--era-font' as string]: FONT_VAR[t.font],
  };
}
