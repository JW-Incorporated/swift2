import type { Metadata } from 'next';

import { THREADS } from '@swift2/experience';
import { LongLive } from '@/components/longlive/LongLive';

// The "cool feature only" fix (social-strategy.md §2, PR #3922 2026-09-06):
// a shared `/?lens=hidden-clues` or `/?mode=mood` link must unfurl showing
// that feature, not the generic brand card every other route gets from
// `app/opengraph-image.tsx`. Recognized lens ids and the two feature modes
// (Mood, Clownbot) point at the dynamic renderer in `app/api/og/route.tsx`;
// everything else (bare homepage, an unrecognized/absent param, Threads
// gallery, Community, Merch) falls through to the static file convention
// by simply not overriding `openGraph.images`/`twitter.images` here.
const VALID_LENS_IDS: Set<string> = new Set(THREADS.map((t) => t.id));
const FEATURE_MODE_IDS = new Set(['mood', 'clownbot']);

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lens?: string; mode?: string }>;
}): Promise<Metadata> {
  const { lens, mode } = await searchParams;
  const hasFeatureCard = (lens && VALID_LENS_IDS.has(lens)) || (mode && FEATURE_MODE_IDS.has(mode));
  if (!hasFeatureCard) return {};

  const ogUrl = `/api/og?${lens ? `lens=${encodeURIComponent(lens)}` : `mode=${encodeURIComponent(mode!)}`}`;
  return {
    openGraph: { images: [ogUrl] },
    twitter: { images: [ogUrl] },
  };
}

export default function Page() {
  return <LongLive />;
}
