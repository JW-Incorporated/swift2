import { NextResponse } from 'next/server';
import { loadFanSignals, loadLiveTheories } from '../../../lib/live-theories-data';

// PLAN.md Stage 7's one read route: `live_theory` + `fan_signal`, for the
// Threads "Theories & eggs" board and the Clownbot "what we're clowning on"
// board. Zero model calls — pure data. ISR revalidate: 900s (15 min), same
// cadence as `vault/current/[eraId]`.
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
