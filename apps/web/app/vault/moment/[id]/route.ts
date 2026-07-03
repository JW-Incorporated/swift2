import { NextResponse } from 'next/server';
import { loadMoment } from '../../../../lib/vault';

// Tier 1 = moment detail, fetched on demand when a user opens an item. Cached
// at the edge; content is static between deploys so a long s-maxage is safe.
export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const moment = await loadMoment(params.id);
    if (!moment) {
      return NextResponse.json({ error: 'moment not found' }, { status: 404 });
    }
    return NextResponse.json(
      { moment },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
