import type { NextRequest } from 'next/server';

import { DEFAULT_OG_COPY, renderOgCard, type OgCardCopy } from '@/lib/longlive/og-card';
import { resolveShareTarget, type ShareParams } from '@/lib/longlive/share-target';
import { trustedClientIp } from '@/lib/longlive/client-ip';
import { makeRateLimiter } from '@/lib/longlive/rate-limit';
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
export const revalidate = 86_400;

// Image rendering is CPU-bound; generous per-IP cap (best-effort, per instance).
const RENDER_LIMIT_PER_MIN = 120;
const limiter = makeRateLimiter({ windowMs: 60_000, max: RENDER_LIMIT_PER_MIN, sweepIntervalMs: 60_000 });

export function ogCopyForRequest(url: URL): OgCardCopy {
  const get = (key: keyof ShareParams) => url.searchParams.get(key) ?? undefined;
  const target = resolveShareTarget({
    item: get('item'),
    song: get('song'),
    guide: get('guide'),
    theories: get('theories'),
    lens: get('lens'),
    mode: get('mode'),
    era: get('era'),
  });
  return target ? target.card : DEFAULT_OG_COPY;
}

export function GET(req: NextRequest): Response {
  if (limiter.isLimited(trustedClientIp(req))) {
    return new Response('Too many requests', { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } });
  }
  const copy = ogCopyForRequest(new URL(req.url));
  return renderOgCard(copy);
}
