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
// content model (types.ts) moved in from apps/web/lib/longlive. Real
// feeds/threads/track-guide/progress/search logic lands in follow-up cards
// (OS-022..OS-025).

export const EXPERIENCE_CORE_VERSION = '0.1.0';

export * from './types';
export * from './eras';
export * from './deepLink';
export * from './lenses';
export * from './filters';
export * from './filter-chips';
export * from './feed-types';
export * from './thread-content-provider';
