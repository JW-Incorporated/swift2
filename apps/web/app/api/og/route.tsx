import type { NextRequest } from 'next/server';

import { THREADS, getThread } from '@swift2/experience';
import { DEFAULT_OG_COPY, renderOgCard, type OgCardCopy } from '@/lib/longlive/og-card';
import '../../../lib/longlive/vault-wiring';

// The "cool feature only" fix (social-strategy.md §2, PR #3922 2026-09-06):
// `apps/web/app/opengraph-image.tsx` was a single static card shared by
// every URL on the site, including lens/feature deep links
// (`/?lens=hidden-clues`, `/?mode=mood`, `/?mode=clownbot`) — so a shared
// link to "The Decode" unfurled as the generic brand card, never the
// feature it actually points to. `app/page.tsx`'s `generateMetadata`
// points a lens/mode deep link's `openGraph.images` / `twitter.images`
// here instead of the static file; this route reads the same query params
// `deepLinkTarget` (packages/experience/src/deepLink.ts) already resolves
// nav from, so the card matches whatever the page itself would open.
//
// Threads gallery, Community, and Merch have no comparably distinctive
// single visual (a list/grid, not one feature in use) — they fall through
// to the same generic card the homepage keeps, same as any unrecognized
// `?lens=`/`?mode=` value.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODE_COPY = new Map<string, OgCardCopy>([
  [
    'mood',
    {
      kicker: 'Long Live',
      title: 'Mood',
      subtitle: "Tell it how you're feeling, get back the songs that fit.",
    },
  ],
  [
    'clownbot',
    {
      kicker: 'Long Live',
      title: 'Clownbot',
      subtitle: 'An unhinged, permanently-online superfan you can chat with.',
    },
  ],
]);

const VALID_LENS_IDS = THREADS.map((t) => t.id);

function copyForRequest(url: URL): OgCardCopy {
  const lens = url.searchParams.get('lens');
  if (lens && VALID_LENS_IDS.includes(lens as (typeof VALID_LENS_IDS)[number])) {
    const thread = getThread(lens as (typeof VALID_LENS_IDS)[number]);
    return { kicker: 'Long Live', title: thread.title, subtitle: thread.what };
  }
  const mode = url.searchParams.get('mode');
  const modeCopy = mode ? MODE_COPY.get(mode) : undefined;
  if (modeCopy) return modeCopy;
  return DEFAULT_OG_COPY;
}

export function GET(req: NextRequest): Response {
  const copy = copyForRequest(new URL(req.url));
  return renderOgCard(copy);
}
