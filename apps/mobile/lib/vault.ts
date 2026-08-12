// Mobile data layer — the SAME @swift2/core client the web app uses, proving
// the reader data access is platform-agnostic (architecture.md hard boundary).
// Only the env-var prefix differs (Expo exposes EXPO_PUBLIC_*).
import { createVaultClient, type VaultSkeleton } from '@swift2/core';
import type { Moment, TrackNote } from '@swift2/shared';

function client() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase env not set (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY)',
    );
  }
  return createVaultClient({ supabaseUrl, supabaseKey });
}

/** Tier 0 Vault skeleton — public RLS read, no login. */
export async function loadSkeleton(): Promise<VaultSkeleton> {
  return client().getSkeleton();
}

/** One Tier 1 moment on demand. */
export async function loadMoment(id: string): Promise<Moment | null> {
  return client().getMoment(id);
}

/** An album's song track guide on demand. */
export async function loadTrackGuide(eraSlug: string): Promise<TrackNote[]> {
  return client().getTrackGuide(eraSlug);
}
