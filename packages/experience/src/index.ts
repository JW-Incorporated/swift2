// packages/experience — headless experience core.
//
// This package MUST stay framework-free: no React DOM, no Next.js, no
// React Native, and no browser globals (window/document). It is imported
// by both apps/web (Next.js) and apps/mobile (React Native) per the "one
// source, three surfaces" architecture (docs/specs/2026-09-05-one-source-
// three-surfaces.md, D2). Anything that needs a DOM or a native module
// belongs in the app layer, not here.
//
// Real eras/deep-links/lenses/feeds/threads/track-guide/progress/search
// logic lands in follow-up cards (OS-02x). This file currently only
// establishes the package + purity guard.

export const EXPERIENCE_CORE_VERSION = '0.0.0';

export {
  TOKENS,
  ERA_TOKENS,
  CLOWN_TOKENS,
  STATUS_TOKENS,
  ERA_CSS_VAR_NAMES,
  CLOWN_CSS_VAR_NAMES,
} from './tokens';
export type { Tokens, EraTokens, ClownTokens, StatusTokens } from './tokens';
