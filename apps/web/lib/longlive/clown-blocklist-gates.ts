/**
 * Thin re-export. The gate data itself moved to `@swift2/shared/redline`
 * (via `@swift2/shared/src/redline-gates.ts`) alongside `screenTopic` in
 * PLAN.md Stage 2 (2026-08-23) — see `clown-blocklist.ts`'s header for why.
 * This file exists only so the existing `./clown-blocklist-gates` import
 * path (and the comments pointing at it) keep working unchanged.
 */
export {
  BODY,
  HEALTH,
  SEXUALITY,
  LOCATION,
  RELATIONSHIP,
  FAMILY,
  ACCUSATION,
  SEXUAL,
  POLITICS,
  OTHER_ARTISTS,
} from '@swift2/shared/redline';
