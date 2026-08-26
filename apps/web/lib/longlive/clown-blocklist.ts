/**
 * Thin re-export. The actual screening logic (screenTopic/screenTopicOutput,
 * the ten topic gates, normalize/tighten, the location-specificity ladder)
 * moved to `@swift2/shared/redline` (PLAN.md Stage 2, 2026-08-23) so the
 * ingestion worker can screen with the exact same rules the live chat route
 * uses. This file exists only so every existing import path in `apps/web`
 * keeps working unchanged — it re-exports, it does not reimplement, so the
 * live chat safety path's behavior is provably identical to before the move.
 * See `@swift2/shared/redline` for the real header/rationale comments.
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
  BLOCKLIST_GATES,
  BLOCKLIST_ORDER,
  INPUT_ONLY,
  SEXUALIZATION_TERMS,
  normalize,
  tighten,
  isInputOnlyPattern,
  matchesPatterns,
  screenTopic,
  screenTopicOutput,
  type Gate,
  type BlocklistCategory,
} from '@swift2/shared/redline';
