import type { ContentItem, EraId, EraSecret, TrackNote } from '@swift2/experience';
import { epochDay, songTargetOf, contentItemLookup } from '@swift2/experience';
import { ERA_SECRETS_RAW } from './era-secrets.generated';

/**
 * Per-era "Era Secret" pool (#688) — static data synced at build time from the
 * supabase/seed/era-secrets/** seed files by
 * scripts/sync-longlive-era-secrets.mjs (same pattern as theories.generated.ts;
 * see docs/longlive-experience.md §9). The generator already normalizes,
 * de-dupes, and enforces the ">= 1 real source" rule, so reads here are plain
 * lookups. The product idea (founder decision 2026-07-15): entering an era
 * should immediately teach a fan one delightful, genuinely-obscure, SOURCED
 * fact they didn't know.
 */
export function eraSecretsForEra(eraId: EraId): EraSecret[] {
  return ERA_SECRETS_RAW[eraId] ?? [];
}

/**
 * Deterministic daily pick from an era's pool: the same secret for everyone on
 * a given calendar day (a curated feel + a return-visit hook, zero runtime
 * LLM — the recommended shape in docs/proposals/2026-07-15-era-secrets.md).
 * Rotates by day so a repeat visit within an era can surface a different fact.
 * Pure: the day key is passed in, never read from the clock here. `epochDay`
 * moved to packages/experience/src/epoch-day.ts (OS-024) — reused by
 * gloss-rotation.ts's daily masthead rotation.
 */
export function dailyEraSecret(eraId: EraId, dayKey: string): EraSecret | null {
  const pool = eraSecretsForEra(eraId);
  if (pool.length === 0) return null;
  return pool[epochDay(dayKey) % pool.length];
}

/** A resolved `EraSecret.deeperLink`, ready to navigate. */
export type EraSecretLink =
  | { kind: 'song'; eraId: EraId; track: TrackNote }
  | { kind: 'moment'; item: ContentItem };

/**
 * Resolve an `EraSecret.deeperLink` to a concrete navigation target. `song:`
 * ids resolve against the track guide, `moment:` ids against era content.
 * Everything else — `egg:` (the Clue Web has no per-egg deep-link target yet),
 * other namespaces, and unknown ids — resolves to null, and the card renders
 * with no deeper link rather than a dead one (same silent-skip contract as
 * lib/longlive/related.ts and the dossier connections).
 */
export function resolveEraSecretLink(deeperLink?: string): EraSecretLink | null {
  if (!deeperLink) return null;
  const song = songTargetOf(deeperLink);
  if (song) return { kind: 'song', eraId: song.eraId, track: song.track };
  if (deeperLink.startsWith('moment:')) {
    const item = contentItemLookup(deeperLink.slice('moment:'.length));
    if (item) return { kind: 'moment', item };
  }
  return null;
}
