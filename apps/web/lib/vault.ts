import { createVaultClient, type VaultDataSource, type VaultSkeleton } from '@swift2/core';
import type { Moment, TrackNote } from '@swift2/shared';

function supabaseEnv(): { supabaseUrl: string; supabaseKey: string } | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return { supabaseUrl, supabaseKey };
}

/**
 * Preview/dev fallback: when no Supabase env is configured (e.g. the v0
 * preview, which doesn't hold the production Vault credentials), read the same
 * public, RLS-public Vault data from a deployed instance's public API routes
 * (`/vault/tier0`, `/vault/moment/[id]`, `/vault/album/[slug]/tracks`). These
 * endpoints serve the exact domain shapes below, so no re-mapping is needed.
 * Production is unaffected — it has Supabase env and never hits this path.
 */
function fallbackBaseUrl(): string {
  return (process.env.VAULT_FALLBACK_BASE_URL ?? 'https://swift2-web-nine.vercel.app').replace(/\/$/, '');
}

function publicApiClient(): VaultDataSource {
  const base = fallbackBaseUrl();
  const opts = { next: { revalidate: 3600 } } as const;
  return {
    async getSkeleton(): Promise<VaultSkeleton> {
      const res = await fetch(`${base}/vault/tier0`, opts);
      if (!res.ok) throw new Error(`getSkeleton (fallback): HTTP ${res.status}`);
      const json = (await res.json()) as { skeleton: VaultSkeleton };
      return json.skeleton;
    },
    async getMoment(monthItemId: string): Promise<Moment | null> {
      const res = await fetch(`${base}/vault/moment/${encodeURIComponent(monthItemId)}`, opts);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`getMoment (fallback): HTTP ${res.status}`);
      const json = (await res.json()) as { moment: Moment };
      return json.moment;
    },
    async getTrackGuide(eraSlug: string): Promise<TrackNote[]> {
      const res = await fetch(`${base}/vault/album/${encodeURIComponent(eraSlug)}/tracks`, opts);
      if (!res.ok) throw new Error(`getTrackGuide (fallback): HTTP ${res.status}`);
      const json = (await res.json()) as { tracks: TrackNote[] };
      return json.tracks;
    },
  };
}

function client(): VaultDataSource {
  const env = supabaseEnv();
  if (env) return createVaultClient(env);
  // No Supabase env → serve the full site from the public deployed API.
  return publicApiClient();
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
