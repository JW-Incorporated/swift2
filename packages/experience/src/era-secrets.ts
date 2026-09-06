import type { ContentItem, EraId, EraSecret, TrackNote } from './types';
import {
  eraSecretsRawInjected,
  songTargetInjected,
  contentItemInjected,
} from './thread-content-provider';
import { epochDay } from './epoch-day';

/**
 * Per-era "Era Secret" pool (#688) — static data synced at build time from the
 * `supabase/seed/era-secrets/**` seed files by
 * `scripts/sync-longlive-era-secrets.mjs` (same pattern as
 * `theories.generated.ts`; see docs/longlive-experience.md §9). The generator
 * already normalizes, de-dupes, and enforces the ">= 1 real source" rule, so
 * reads here are plain lookups. The product idea (founder decision
 * 2026-07-15): entering an era should immediately teach a fan one delightful,
 * genuinely-obscure, SOURCED fact they didn't know.
 *
 * Moved into `packages/experience` in OS-023
 * (docs/specs/2026-09-05-one-source-three-surfaces.md §6). The generated
 * `ERA_SECRETS_RAW` dataset, `songTargetOf`, and `getContentItem` all still
 * live in `apps/web/lib/longlive/*` (content-loading is OS-013/OS-014
 * scope), so the app wires them in at import time via the injected
 * providers — see `thread-content-provider.ts`.
 */
export function eraSecretsForEra(eraId: EraId): EraSecret[] {
  return eraSecretsRawInjected()[eraId] ?? [];
}

/**
 * Deterministic daily pick from an era's pool: the same secret for everyone on
 * a given calendar day (a curated feel + a return-visit hook, zero runtime
 * LLM — the recommended shape in docs/proposals/2026-07-15-era-secrets.md).
 * Rotates by day so a repeat visit within an era can surface a different fact.
 * Pure: the day key is passed in, never read from the clock here. `epochDay`
 * lives in `epoch-day.ts` (OS-024) — reused by `gloss-rotation.ts`'s daily
 * masthead rotation.
 */
export function dailyEraSecret(eraId: EraId, dayKey: string): EraSecret | null {
  const pool = eraSecretsForEra(eraId);
  if (pool.length === 0) return null;
  return pool[epochDay(dayKey) % pool.length] ?? null;
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
  const song = songTargetInjected(deeperLink);
  if (song) return { kind: 'song', eraId: song.eraId, track: song.track };
  if (deeperLink.startsWith('moment:')) {
    const item = contentItemInjected(deeperLink.slice('moment:'.length));
    if (item) return { kind: 'moment', item };
  }
  return null;
}
