import { NextResponse } from 'next/server';
import { loadCurrentItems, loadFanSignals, loadLiveTheories } from '../../../../lib/current';

// R17: the Current tier's one combined read route — current era's live
// `current_item` rows, `live_theory` rows, and `fan_signal` rows, in one
// payload. Replaces two separate client fetches (`/vault/current/[eraId]`
// and `/vault/live-theories`) with a single round trip; both hooks
// (`use-current-items.ts`, `use-live-theories.ts`) now read from this one
// route. ISR revalidate: 900s (15 min), same cadence the two routes it
// replaces used.
//
// `/vault/current/[eraId]` and `/vault/live-theories` stay live as thin
// aliases for one release, to preserve the mobile additive-only API
// contract (do not remove them yet — see AGENTS.md / CLAUDE.md release
// rules on backward compatibility).
export const revalidate = 900;

function settledOrEmpty<T>(result: PromiseSettledResult<T[]>, label: string): T[] {
  if (result.status === 'fulfilled') return result.value;
  // Fails soft, per-slice: the two routes this replaces (`/vault/current/[eraId]`
  // and `/vault/live-theories`) failed independently of each other, so a
  // combined route must preserve that — one slice's fetch failure degrades
  // only that slice to `[]`, never the other independent slices.
  console.error(`vault/live: ${label}:`, (result.reason as Error)?.message ?? result.reason);
  return [];
}

export async function GET(_req: Request, { params }: { params: Promise<{ eraId: string }> }) {
  const { eraId } = await params;
  const [itemsResult, theoriesResult, signalsResult] = await Promise.allSettled([
    loadCurrentItems(eraId),
    loadLiveTheories(),
    loadFanSignals(),
  ]);
  const items = settledOrEmpty(itemsResult, 'items');
  const theories = settledOrEmpty(theoriesResult, 'theories');
  const signals = settledOrEmpty(signalsResult, 'signals');
  return NextResponse.json(
    { items, theories, signals },
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600' } },
  );
}
