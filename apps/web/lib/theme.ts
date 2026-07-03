import type { CSSProperties } from 'react';
import type { EraTheme } from '@swift2/shared';

/**
 * Turn an era's theme into CSS custom properties + base colors, so any child
 * styled via those vars re-skins when the era changes. Apply to a wrapper.
 */
export function eraSkin(theme: EraTheme): CSSProperties {
  return {
    background: theme.bg,
    color: theme.ink,
    ['--bg' as string]: theme.bg,
    ['--surface' as string]: theme.surface,
    ['--ink' as string]: theme.ink,
    ['--ink-soft' as string]: theme.inkSoft,
    ['--line' as string]: theme.line,
    ['--accent' as string]: theme.accent,
  };
}
