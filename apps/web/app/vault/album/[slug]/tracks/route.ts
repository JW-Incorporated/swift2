import { NextResponse } from 'next/server';
import { loadTrackGuide } from '../../../../../lib/vault';

// Per-album song track guide, fetched on demand from the album/era — kept off
// the Tier 0 timeline payload so full-catalog coverage can't blow the budget.
// Edge-cached; content is static between deploys.
export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const tracks = await loadTrackGuide(slug);
    return NextResponse.json(
      { eraSlug: slug, tracks },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
    );
  } catch (err) {
    // Log detail server-side; don't leak internal/Supabase error text to clients.
    console.error('vault/tracks:', (err as Error).message);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
