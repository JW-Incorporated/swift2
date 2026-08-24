import { NextResponse } from 'next/server';
import { loadCurrentItems } from '../../../../lib/current';

// The Current tier's one read route (PLAN.md Stage 5): the current era's
// live `current_item` rows, fetched client-side by
// lib/longlive/use-current-items.ts. ISR revalidate: 900s (15 min) — the
// Vault stays static (build-time), only this slice is dynamic, matching the
// proposal's "Vault stays static, only the current era's live slice is
// dynamic" design.
export const revalidate = 900;

export async function GET(_req: Request, { params }: { params: Promise<{ eraId: string }> }) {
  try {
    const { eraId } = await params;
    const items = await loadCurrentItems(eraId);
    return NextResponse.json(
      { items },
      { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600' } },
    );
  } catch (err) {
    // Fails soft: the Current tier is additive, so a fetch failure degrades
    // to an empty slice (Vault-only render) rather than breaking the page.
    console.error('vault/current:', (err as Error).message);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
