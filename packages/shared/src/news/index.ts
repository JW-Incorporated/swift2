// @swift2/shared/news — dormant, portable news-pipeline domain logic.
//
// Groundwork for the post-v1 News/Current world (see
// docs/proposals/2026-07-07-news-pipeline-architecture.md). Deliberately NOT
// re-exported from the package's root barrel: News and Vault are separate
// data worlds (docs/decisions.md, 2026-07-02), and keeping this behind the
// `@swift2/shared/news` subpath keeps the Vault's import surface untouched
// and the boundary grep-able. Nothing imports this yet.

export * from './news-types';
export * from './similarity';
export * from './cluster';
