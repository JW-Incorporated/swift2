import { NextResponse } from 'next/server';
import { loadCurrentItems } from '../../../../lib/current';

// Thin alias over `/vault/live/[eraId]` (R17), kept for one release so the
// mobile client's additive-only API contract still resolves this path.
// Prefer `/vault/live/[eraId]` for new callers — it returns items + live
// theories + fan signals in one payload; this route re-derives just the
// `items` shape from the same `lib/current.ts` loader.
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
