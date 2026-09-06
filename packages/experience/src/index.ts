// packages/experience — headless experience core.
//
// This package MUST stay framework-free: no React DOM, no Next.js, no
// React Native, and no browser globals (window/document). It is imported
// by both apps/web (Next.js) and apps/mobile (React Native) per the "one
// source, three surfaces" architecture (docs/specs/2026-09-05-one-source-
// three-surfaces.md, D2). Anything that needs a DOM or a native module
// belongs in the app layer, not here.
//
// OS-021: eras, deep links, lenses, filters, filter chips, and the shared
// content model (types.ts) moved in from apps/web/lib/longlive. OS-031
// added shared design tokens. OS-024: track guide, mood matching, date
// formatting, anchor resolution, content freshness, and the landing
// masthead's gloss rotation moved in too — each generated-data dependency
// (the song catalogue, the per-era track map, a content-item lookup, the
// generated vault's freshness stamp) is wired in by the app at startup via
// the *-provider modules below, so this package stays framework- and
// data-source-free. Real feeds/threads/progress/search logic lands in
// follow-up cards (OS-022, OS-025).

export const EXPERIENCE_CORE_VERSION = '0.2.0';

export * from './types';
export * from './eras';
export * from './deepLink';
export * from './lenses';
export * from './filters';
export * from './filter-chips';
export * from './feed-types';
export * from './thread-content-provider';
export * from './format';
export * from './anchor-date';
export * from './epoch-day';
export * from './gloss-rotation';
export * from './mood-intents';
export * from './song-catalogue-provider';
export * from './mood-match';
export * from './track-catalogue-provider';
export * from './content-item-provider';
export * from './track-guide';
export * from './freshness';
export * from './threads';
export * from './love-story';
export * from './theories';
export * from './live-theories';
export * from './era-secrets';
export * from './progress';
export * from './search-index';

export {
  TOKENS,
  ERA_TOKENS,
  CLOWN_TOKENS,
  STATUS_TOKENS,
  ERA_CSS_VAR_NAMES,
  CLOWN_CSS_VAR_NAMES,
} from './tokens';
export type { Tokens, EraTokens, ClownTokens, StatusTokens } from './tokens';
