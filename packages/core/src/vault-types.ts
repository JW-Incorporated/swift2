// Vault (time-machine) Tier 0 skeleton contract. Portable, zero I/O — shared
// by web and mobile, both of which now build this shape from the published
// content bundle (`@swift2/content`'s `loadBundle`) rather than a live
// Supabase read. The read path that used to live here
// (`createVaultClient`, `packages/core/src/vault.ts`) was retired by OS-014b
// once every surface converged on the bundle (see
// `docs/proposals/2026-09-vault-read-path.md`, Option A). This file keeps
// only the shared shape, which mobile's `@swift2/core` import still needs.
import type { Era, Milestone, MonthItem } from '@swift2/shared';

/**
 * Tier 0: the always-resident skeleton. Small enough to load up front so
 * scrubbing never waits on the network (per the v1 spec's payload budget).
 */
export interface VaultSkeleton {
  eras: Era[];
  milestones: Milestone[];
  monthItems: MonthItem[];
}
