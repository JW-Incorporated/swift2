import { createKnowledgeClient } from '@swift2/core';
import type { CurrentItem } from '@swift2/shared';

// Current-tier data access (server-side) — mirrors lib/vault.ts's env
// detection exactly, but has no v0-preview fallback: unlike the Vault
// (baked in at build time from content-vault.generated.ts), the Current
// tier has no static generated form to fall back to, so an unconfigured
// environment simply renders the era stream without it (additive, per
// PLAN.md Stage 5 — the Vault-only render is the correct degraded state,
// not an error).
function supabaseEnv(): { supabaseUrl: string; supabaseKey: string } | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return { supabaseUrl, supabaseKey };
}

/** Load the current era's live `current_item` rows (server-side). Empty
 * array when Supabase env isn't configured (e.g. CI/preview) — never throws. */
export async function loadCurrentItems(eraId: string): Promise<CurrentItem[]> {
  const env = supabaseEnv();
  if (!env) return [];
  return createKnowledgeClient(env).getCurrentItems(eraId);
}
