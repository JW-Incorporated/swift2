// @swift2/shared/mood — portable Mood→Song bot domain (post-v1 groundwork).
// Exposed ONLY via this subpath, never the root barrel, so the Vault's import
// surface is untouched and the boundary stays grep-able. Nothing imports this
// yet. See docs/proposals/2026-07-07-chatbots-architecture.md.

export * from './types';
export * from './match';
export * from './strawman';
