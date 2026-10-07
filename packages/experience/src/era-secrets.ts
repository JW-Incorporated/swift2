import type { EraId, EraSecret } from './types';
import { contentItemInjected } from './thread-content-provider';
import type { ReaderCorpus } from './corpus';
import { resolveEraSecretLinkIn, type EraSecretLink } from './era-secrets-link';
import { injectedCorpus } from './corpus-injected';
import { epochDay } from './epoch-day';

export { resolveEraSecretLinkIn, type EraSecretLink };

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
export function eraSecretsForEraIn(corpus: ReaderCorpus, eraId: EraId): EraSecret[] {
  return corpus.eraSecrets()[eraId] ?? [];
}

export function eraSecretsForEra(eraId: EraId): EraSecret[] {
  return eraSecretsForEraIn(injectedCorpus(), eraId);
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

/** Keeps the era-secret link's historical lookup: the content provider, not the content-item lookup. */
export function resolveEraSecretLink(deeperLink?: string): EraSecretLink | null {
  return resolveEraSecretLinkIn({ ...injectedCorpus(), getContentItem: contentItemInjected }, deeperLink);
}
