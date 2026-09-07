import type { NextRequest } from 'next/server';

import { THREADS, getEra, getThread, resolveTrackKey } from '@swift2/experience';
import { DEFAULT_OG_COPY, renderOgCard, type OgCardCopy } from '@/lib/longlive/og-card';
import { getContentItem } from '@/lib/longlive/content';
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
  const itemId = url.searchParams.get('item');
  if (itemId) {
    const item = getContentItem(itemId);
    if (item) {
      const era = getEra(item.eraId);
      return { kicker: `${era.name} · ${item.dateLabel}`, title: item.title, subtitle: item.summary };
    }
  }
  const eraId = url.searchParams.get('era');
  if (eraId) {
    try {
      const era = getEra(eraId);
      return { kicker: era.yearLabel, title: era.name, subtitle: era.tagline };
    } catch {
      return DEFAULT_OG_COPY;
    }
  }
  const song = url.searchParams.get('song');
  if (song) {
    const track = resolveTrackKey(song);
    if (track) {
      const era = getEra(track.eraId);
      return { kicker: era.album, title: track.track.title, subtitle: track.track.note };
    }
  }
  const guide = url.searchParams.get('guide');
  if (guide) {
    try {
      const era = getEra(guide);
      return { kicker: `Track guide · ${era.yearLabel}`, title: era.album, subtitle: 'Every song, each with a sourced note.' };
    } catch {
      return DEFAULT_OG_COPY;
    }
  }
  const theories = url.searchParams.get('theories');
  if (theories) {
    try {
      const era = getEra(theories);
      return { kicker: `Theories & eggs · ${era.yearLabel}`, title: `${era.shortName} decoded`, subtitle: 'Every egg and theory, sourced and graded.' };
    } catch {
      return DEFAULT_OG_COPY;
    }
  }
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
