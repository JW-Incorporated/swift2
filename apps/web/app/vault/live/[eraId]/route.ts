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

export async function GET(_req: Request, { params }: { params: Promise<{ eraId: string }> }) {
  try {
    const { eraId } = await params;
    const [items, theories, signals] = await Promise.all([
      loadCurrentItems(eraId),
      loadLiveTheories(),
      loadFanSignals(),
    ]);
    return NextResponse.json(
      { items, theories, signals },
      { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600' } },
    );
  } catch (err) {
    // Fails soft: the Current tier and the theories/signals boards are all
    // additive, so a fetch failure degrades to an empty combined slice
    // (Vault-only render) rather than breaking the page.
    console.error('vault/live:', (err as Error).message);
    return NextResponse.json({ items: [], theories: [], signals: [] }, { status: 200 });
  }
}
