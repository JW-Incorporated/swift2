// React Native StyleSheet built from the shared design tokens
// (packages/experience/src/tokens.ts, OS-031). This is the mobile half of
// the "one source, three surfaces" token contract — apps/web/app/globals.css
// generates its --era-*/--clown-* CSS variables from the exact same TOKENS
// object (see scripts/generate-design-tokens.mjs), so a color change here
// only ever needs one edit, in one file, in packages/experience.
import { StyleSheet } from 'react-native';
import { CLOWN_TOKENS, ERA_TOKENS, STATUS_TOKENS } from '@swift2/experience';

/** Era palette as plain values — spread into RN `style` props/StyleSheets. */
export const eraColors = {
  bg: ERA_TOKENS.bg,
  surface: ERA_TOKENS.surface,
  surface2: ERA_TOKENS.surface2,
  ink: ERA_TOKENS.ink,
  inkSoft: ERA_TOKENS.inkSoft,
  line: ERA_TOKENS.line,
  accent: ERA_TOKENS.accent,
  accent2: ERA_TOKENS.accent2,
  glow: ERA_TOKENS.glow,
};

export const clownColors = {
  bg: CLOWN_TOKENS.bg,
  panel: CLOWN_TOKENS.panel,
  raised: CLOWN_TOKENS.raised,
  line: CLOWN_TOKENS.line,
  ink: CLOWN_TOKENS.ink,
  inkSoft: CLOWN_TOKENS.inkSoft,
};

/**
 * Status colors as solid inks (native has no `color-mix`, unlike the web's
 * `color-mix(in srgb, <hex> <percent>%, transparent)` background). Screens
 * that need the mixed background can compute it from `hex` + `mixPercent`;
 * most usages only need the `ink` (text) color, which matches web exactly.
 */
export const statusColors = {
  disputed: STATUS_TOKENS.disputed.ink,
  reclaimed: STATUS_TOKENS.reclaimed.ink,
  pending: STATUS_TOKENS.pending.ink,
};

/** Shared base styles any native screen can spread/extend. */
export const themeStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: eraColors.bg,
  },
  surface: {
    backgroundColor: eraColors.surface,
    borderColor: eraColors.line,
  },
  text: {
    color: eraColors.ink,
  },
  textSoft: {
    color: eraColors.inkSoft,
  },
});
