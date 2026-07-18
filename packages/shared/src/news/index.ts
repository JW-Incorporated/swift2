// @swift2/shared/news — portable news-pipeline domain logic, consumed by
// @swift2/worker (see docs/proposals/2026-07-07-news-pipeline-architecture.md).
// Deliberately NOT re-exported from the package's root barrel: News and Vault
// are separate data worlds (docs/decisions.md, 2026-07-02), and keeping this
// behind the `@swift2/shared/news` subpath keeps the Vault's import surface
// untouched and the boundary grep-able.

export * from './news-types';
export * from './similarity';
export * from './cluster';
export * from './credibility';
