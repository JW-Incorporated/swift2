import { NextResponse } from 'next/server';
import { loadFanSignals, loadLiveTheories } from '../../../lib/current';

// Thin alias over `/vault/live/[eraId]` (R17), kept for one release so the
// mobile client's additive-only API contract still resolves this path.
// Prefer `/vault/live/[eraId]` for new callers — it returns items + live
// theories + fan signals in one payload; this route re-derives just the
// `theories`/`signals` shape from the same `lib/current.ts` loaders.
export const revalidate = 900;

export async function GET() {
  try {
    const [theories, signals] = await Promise.all([loadLiveTheories(), loadFanSignals()]);
    return NextResponse.json(
      { theories, signals },
      { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600' } },
    );
  } catch (err) {
    // Fails soft: both boards are additive over their existing static
    // content, so a fetch failure degrades to an empty live slice rather
    // than breaking either board.
    console.error('vault/live-theories:', (err as Error).message);
    return NextResponse.json({ theories: [], signals: [] }, { status: 200 });
  }
}
