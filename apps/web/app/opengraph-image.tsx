import { DEFAULT_OG_COPY, renderOgCard } from '@/lib/longlive/og-card';

// Closes the #653 gap (Nils, 2026-07-15): no og:image existed, so shared
// links rendered as bare text everywhere (iMessage, Slack, X, etc.) and
// also blocked the CAMPAIGN track's own share-card ask (#736). Next.js
// auto-detects this file and wires it into both og:image and (absent a
// dedicated twitter-image file) the Twitter card, no manual metadata
// needed. Same current-era palette/copy as the masthead eyebrow+subtitle
// (LandingMasthead.tsx) — not reinvented here.
//
// This is now the FALLBACK card only (the "cool feature only" fix,
// social-strategy.md §2): the bare homepage and any route with no
// distinctive feature to show. Lens/mode deep links get a feature-specific
// card from `app/page.tsx`'s `generateMetadata` + `app/api/og/route.tsx`
// instead — see that route's header for why.
export const alt = 'Long Live — the Taylor Swift time machine';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return renderOgCard(DEFAULT_OG_COPY);
}
