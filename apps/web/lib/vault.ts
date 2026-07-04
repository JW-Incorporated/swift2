import { createVaultClient, type VaultSkeleton } from '@swift2/core';
import type { Moment, TrackNote } from '@swift2/shared';

function client() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase env not set (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY|_PUBLISHABLE_KEY)');
  }
  return createVaultClient({ supabaseUrl, supabaseKey });
}

/**
 * Load the Tier 0 Vault skeleton (server-side). Uses the public
 * (anon/publishable) key — Vault reads are RLS public, no login.
 */
export async function loadSkeleton(): Promise<VaultSkeleton> {
  return client().getSkeleton();
}

/** Load one Tier 1 moment on demand (server-side). */
export async function loadMoment(id: string): Promise<Moment | null> {
  return client().getMoment(id);
}

/** Load an album's song track guide on demand (server-side). */
export async function loadTrackGuide(eraSlug: string): Promise<TrackNote[]> {
  return client().getTrackGuide(eraSlug);
}
