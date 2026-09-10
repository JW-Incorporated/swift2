// @swift2/shared/news — portable news-pipeline domain logic, consumed by
// @swift2/worker (see docs/proposals/2026-07-07-news-pipeline-architecture.md).
// Deliberately NOT re-exported from the package's root barrel: News and Vault
// are separate data worlds (docs/decisions.md, 2026-07-02), and keeping this
// behind the `@swift2/shared/news` subpath keeps the Vault's import surface
// untouched and the boundary grep-able.

export * from './news-types';
export * from './similarity';
export * from './cross-outlet-similarity';
export * from './cluster';
// Outlet-tier map + corroboration->verification_status now live in the
// consolidated packages/shared/src/source-tiers.ts (R9, Fable 5.1 review) —
// re-exported here so @swift2/shared/news's public surface (lookupOutletTier,
// computeVerificationStatus, OUTLET_TIER_MAP, Corroboration, etc.) is unchanged.
export * from '../source-tiers';
