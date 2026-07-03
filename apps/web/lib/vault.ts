import { createVaultClient, type VaultSkeleton } from '@swift2/core';

/**
 * Load the Tier 0 Vault skeleton on the server. Uses the public
 * (anon/publishable) key — Vault reads are RLS public, no login.
 */
export async function loadSkeleton(): Promise<VaultSkeleton> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase env not set (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY|_PUBLISHABLE_KEY)');
  }
  return createVaultClient({ supabaseUrl, supabaseKey }).getSkeleton();
}
