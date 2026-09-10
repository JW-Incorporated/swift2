import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Single source of truth for the two Supabase env/client shapes every
// server-side route and lib module in apps/web was independently
// re-implementing (Fable 5.1 architecture review, task R1). Behaviour is
// unchanged from every call site this replaces — same env vars, same
// null-on-missing-env contract, same client options.

/**
 * Service-role client for server-only routes that need to bypass RLS
 * (notifications/devices tables ship RLS-enabled with no anon/authenticated
 * policies — see each call site's original header comment for the full
 * rationale). Returns `null` when `SUPABASE_SERVICE_ROLE_KEY` isn't
 * configured (local/preview without the secret) rather than throwing, so
 * every caller can degrade the same way it already did.
 */
export function supabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Public (anon/publishable) Supabase env — used by RLS-public reads (Vault,
 * Current tier, live theories/fan signals). Returns `null` when unconfigured
 * so callers can degrade (empty array / fallback API) exactly as before.
 */
export function supabasePublicEnv(): { supabaseUrl: string; supabaseKey: string } | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return { supabaseUrl, supabaseKey };
}
