// Design tokens shared by every surface — see docs/specs/2026-09-05-one-
// source-three-surfaces.md, OS-031. This module is the single source of
// truth for the "era" palette and the few fixed semantic colors that don't
// re-theme per era. Both renderers derive from this object instead of each
// keeping its own copy:
//
//   - apps/web: `scripts/generate-design-tokens.mjs` reads TOKENS and writes
//     `apps/web/app/tokens.generated.css`, which `globals.css` imports as
//     the default `:root` values (era JS still overrides them at runtime
//     when the active era changes — this is only the *default* palette).
//   - apps/mobile: `apps/mobile/lib/theme.ts` imports TOKENS directly and
//     builds a React Native `StyleSheet` from the same values.
//
// Keep this package headless (no CSS, no RN) — see the purity guard in
// eslint.config.mjs. Values are plain strings (hex / rgba / color-mix), so
// either renderer can consume them without a build step.

/** Default "era" palette — the pre-mount / fallback theme (TTPD/current era). */
export const ERA_TOKENS = {
  bg: '#0c0c0c',
  surface: '#161616',
  surface2: '#1e1e1e',
  ink: '#ededed',
  inkSoft: '#9a9a9a',
  line: '#2a2a2a',
  accent: '#e8e8e8',
  accent2: '#8a8a8a',
  glow: 'rgba(255, 255, 255, 0.12)',
} as const;

/** Clown bot app chrome — deliberately NOT the era palette (see globals.css). */
export const CLOWN_TOKENS = {
  bg: '#17120e',
  panel: '#1e1814',
  raised: '#272019',
  line: '#332a22',
  ink: '#f4efe9',
  inkSoft: '#a3948a',
} as const;

/**
 * Fixed semantic status colors, independent of the active era theme — see
 * globals.css. Web renders these as `color-mix(in srgb, <hex> 16%,
 * transparent)`; native has no `color-mix`, so both the mixed value and its
 * source hex + percentage are exposed so the mobile renderer can compute an
 * equivalent (e.g. hex + alpha) without re-deriving the color by hand.
 */
export const STATUS_TOKENS = {
  disputed: { hex: '#c94040', mixPercent: 16, ink: '#d16a6a' },
  reclaimed: { hex: '#4caf6e', mixPercent: 16, ink: '#5fc383' },
  pending: { hex: '#d4a830', mixPercent: 16, ink: '#dbb94a' },
} as const;

export const TOKENS = {
  era: ERA_TOKENS,
  clown: CLOWN_TOKENS,
  status: STATUS_TOKENS,
} as const;

export type EraTokens = typeof ERA_TOKENS;
export type ClownTokens = typeof CLOWN_TOKENS;
export type StatusTokens = typeof STATUS_TOKENS;
export type Tokens = typeof TOKENS;

/**
 * CSS custom-property names for the era/clown tokens, in the order
 * `scripts/generate-design-tokens.mjs` emits them and the order the
 * snapshot test (`tokens.generated-css.test.ts`) reads them back in.
 * `status` tokens are intentionally excluded — they're derived
 * (`color-mix`) rather than a 1:1 var, and stay defined by hand in
 * globals.css next to the comment explaining why.
 */
export const ERA_CSS_VAR_NAMES: Record<keyof EraTokens, string> = {
  bg: '--era-bg',
  surface: '--era-surface',
  surface2: '--era-surface-2',
  ink: '--era-ink',
  inkSoft: '--era-ink-soft',
  line: '--era-line',
  accent: '--era-accent',
  accent2: '--era-accent-2',
  glow: '--era-glow',
};

export const CLOWN_CSS_VAR_NAMES: Record<keyof ClownTokens, string> = {
  bg: '--clown-bg',
  panel: '--clown-panel',
  raised: '--clown-raised',
  line: '--clown-line',
  ink: '--clown-ink',
  inkSoft: '--clown-ink-soft',
};
