import { NextResponse } from 'next/server';
import { loadTrackGuide } from '../../../../../lib/vault';

// Per-album song track guide, fetched on demand from the album/era — kept off
// the Tier 0 timeline payload so full-catalog coverage can't blow the budget.
// Edge-cached; content is static between deploys.
export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const tracks = await loadTrackGuide(params.slug);
    return NextResponse.json(
      { eraSlug: params.slug, tracks },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
