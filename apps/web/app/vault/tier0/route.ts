import { NextResponse } from 'next/server';
import type { VaultSkeleton } from '@swift2/core';
import { loadSkeleton } from '../../../lib/vault';

// Tier 0 = the always-resident skeleton (eras + milestones + month index).
// Rendered static at deploy and served from the CDN; the web reader and the
// future mobile app both consume this one contract. `version` lets a client
// detect a stale cache and know its pinned Tier 1 paths are still current.
export const dynamic = 'force-static';
export const revalidate = 3600;

const EMPTY: VaultSkeleton = { eras: [], milestones: [], monthItems: [] };

/** Stable short fingerprint of the payload (djb2) for cache/version checks. */
function versionOf(skeleton: VaultSkeleton): string {
  const json = JSON.stringify(skeleton);
  let h = 5381;
  for (let i = 0; i < json.length; i += 1) h = (h * 33) ^ json.charCodeAt(i);
  return (h >>> 0).toString(36);
}

export async function GET() {
  let skeleton = EMPTY;
  try {
    skeleton = await loadSkeleton();
  } catch (err) {
    // Build without Supabase env (e.g. CI) → emit an empty, still-valid Tier 0.
    console.warn('tier0: skeleton unavailable at build:', (err as Error).message);
  }
  return NextResponse.json(
    { version: versionOf(skeleton), skeleton },
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' } },
  );
}
