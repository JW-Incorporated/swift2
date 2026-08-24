// Domain -> outlet tier map (proposal §4.1.2, PLAN.md Stage 1). Drives
// resolveGoogleNewsItem's re-tiering once a Google News redirect resolves to
// a real publisher URL: a domain not listed here stays `unverified` even
// after resolving — this map is the only thing allowed to grant `established`,
// never an inferred guess. Seeded from the proposal's §4.2 layer-1 publisher
// list (all `established` tier, publisher URLs) — includes outlets we could
// not seed a direct tag feed for (see the wave-2 seed migration's skip
// notes), because Google News can still surface them and this map is what
// lets a resolved redirect from e.g. people.com earn `established` too.

import type { SourceTier } from './news-types';

export interface OutletTierEntry {
  /** Display name used as `outlet_name` when a redirect resolves here. */
  name: string;
  tier: SourceTier;
}

export const OUTLET_TIER_MAP: Record<string, OutletTierEntry> = {
  'billboard.com': { name: 'Billboard', tier: 'established' },
  'variety.com': { name: 'Variety', tier: 'established' },
  'rollingstone.com': { name: 'Rolling Stone', tier: 'established' },
  'hollywoodreporter.com': { name: 'The Hollywood Reporter', tier: 'established' },
  'wwd.com': { name: 'WWD', tier: 'established' },
  'deadline.com': { name: 'Deadline', tier: 'established' },
  'stereogum.com': { name: 'Stereogum', tier: 'established' },
  'theguardian.com': { name: 'The Guardian', tier: 'established' },
  'bbc.co.uk': { name: 'BBC News', tier: 'established' },
  'bbc.com': { name: 'BBC News', tier: 'established' },
  'nytimes.com': { name: 'The New York Times', tier: 'established' },
  'people.com': { name: 'People', tier: 'established' },
  'etonline.com': { name: 'Entertainment Tonight', tier: 'established' },
  'vogue.com': { name: 'Vogue', tier: 'established' },
  'elle.com': { name: 'Elle', tier: 'established' },
  'harpersbazaar.com': { name: "Harper's Bazaar", tier: 'established' },
  'tennessean.com': { name: 'The Tennessean', tier: 'established' },
  'kansascity.com': { name: 'The Kansas City Star', tier: 'established' },
  'pitchfork.com': { name: 'Pitchfork', tier: 'established' },
};

/** Case-insensitive, `www.`-stripped lookup. Unknown domain -> undefined (caller must keep the item unverified). */
export function lookupOutletTier(domain: string): OutletTierEntry | undefined {
  const normalized = domain.toLowerCase().replace(/^www\./, '');
  return OUTLET_TIER_MAP[normalized];
}
