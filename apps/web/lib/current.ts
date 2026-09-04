import { createKnowledgeClient } from '@swift2/core';
import type { CurrentItem } from '@swift2/shared';
import { supabasePublicEnv } from './supabase-server';

// Current-tier data access (server-side) — mirrors lib/vault.ts's env
// detection exactly, but has no v0-preview fallback: unlike the Vault
// (baked in at build time from content-vault.generated.ts), the Current
// tier has no static generated form to fall back to, so an unconfigured
// environment simply renders the era stream without it (additive, per
// PLAN.md Stage 5 — the Vault-only render is the correct degraded state,
// not an error).

/** Load the current era's live `current_item` rows (server-side). Empty
 * array when Supabase env isn't configured (e.g. CI/preview) — never throws. */
export async function loadCurrentItems(eraId: string): Promise<CurrentItem[]> {
  const env = supabasePublicEnv();
  if (!env) return [];
  return createKnowledgeClient(env).getCurrentItems(eraId);
}
