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
  searchParams: Promise<{ lens?: string; mode?: string; item?: string; era?: string; song?: string; guide?: string; theories?: string }>;
}): Promise<Metadata> {
  const { lens, mode, item, era, song, guide, theories } = await searchParams;
  const validLens = lens && VALID_LENS_IDS.has(lens) ? lens : undefined;
  const validMode = mode && FEATURE_MODE_IDS.has(mode) ? mode : undefined;
  const featureParam = validLens
    ? `lens=${encodeURIComponent(validLens)}`
    : validMode
      ? `mode=${encodeURIComponent(validMode)}`
      : item
        ? `item=${encodeURIComponent(item)}`
        : era
          ? `era=${encodeURIComponent(era)}`
          : song
            ? `song=${encodeURIComponent(song)}`
            : guide
              ? `guide=${encodeURIComponent(guide)}`
              : theories
                ? `theories=${encodeURIComponent(theories)}`
                : undefined;
  if (!featureParam) return {};

  const ogUrl = `/api/og?${featureParam}`;
  return {
    openGraph: { images: [ogUrl] },
    twitter: { images: [ogUrl] },
  };
}

export default function Page() {
  return <LongLive />;
}
