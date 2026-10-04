import { ERAS, type EraId, type Progress } from '@swift2/experience';

/**
 * Pure, client-safe half of the share-card feature (W9): the size allowlist,
 * count bucketing, URL builders, and the "top eras" ranking. No fs, no
 * content lookups — `share-card-spec.ts` (server) validates against the real
 * catalogue, and the share UI builds URLs with the same functions so the two
 * sides cannot drift.
 */

export const SHARE_CARD_SIZES = {
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
} as const;

export type ShareCardSize = keyof typeof SHARE_CARD_SIZES;

export const DEFAULT_SHARE_CARD_SIZE: ShareCardSize = 'portrait';

export function parseShareCardSize(raw: string | null | undefined): ShareCardSize {
  return raw === 'story' ? 'story' : DEFAULT_SHARE_CARD_SIZE;
}

/**
 * Counts are rounded DOWN to one of these steps before they reach the URL or
 * the renderer. A bounded set means a hostile `?m=` can only ever produce a
 * handful of distinct cacheable URLs (cache-busting defence) and a card never
 * shows an exact, fingerprintable activity log.
 */
export const COUNT_BUCKETS = [0, 1, 3, 5, 10, 25, 50, 100, 250, 500, 1000] as const;

export function bucketCount(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  let out = 0;
  for (const b of COUNT_BUCKETS) {
    if (n >= b) out = b;
  }
  return out;
}

/** Parse a count query value into a bucket; anything non-numeric is 0. */
export function parseBucketParam(raw: string | null | undefined): number {
  if (!raw || !/^\d{1,7}$/.test(raw)) return 0;
  return bucketCount(Number(raw));
}

/** "0", "1", "3+", "25+" — the label a bucketed count renders as. */
export function bucketLabel(bucket: number): string {
  return bucket <= 1 ? String(bucket) : `${bucket}+`;
}

export const MY_ERAS_MAX = 3;

export interface ShareCardSource {
  item?: string;
  era?: string;
  eras?: readonly string[];
  moments?: number;
  eggs?: number;
  favorites?: number;
}

/** Relative URL of the card endpoint. Counts are bucketed here too. */
export function shareCardPath(source: ShareCardSource, size: ShareCardSize): string {
  const q = new URLSearchParams();
  if (source.item) q.set('item', source.item);
  else if (source.era) q.set('era', source.era);
  else if (source.eras && source.eras.length > 0) {
    q.set('eras', source.eras.slice(0, MY_ERAS_MAX).join(','));
    q.set('m', String(bucketCount(source.moments ?? 0)));
    q.set('e', String(bucketCount(source.eggs ?? 0)));
    q.set('f', String(bucketCount(source.favorites ?? 0)));
  }
  q.set('size', size);
  return `/api/share-card?${q.toString()}`;
}

export interface ProgressEraLookups {
  /** Era of a moment id (moments and favorites). */
  itemEra: (id: string) => EraId | undefined;
  /** Era of an egg node id. */
  eggEra: (id: string) => EraId | undefined;
}

export interface MyErasSummary {
  eras: EraId[];
  moments: number;
  eggs: number;
  favorites: number;
}

/** True once there is anything at all worth turning into a card. */
export function hasShareableProgress(p: Progress): boolean {
  return p.moments.size + p.eggs.size + p.favorites.size > 0;
}

/**
 * The visitor's top eras by how much they have touched them (moments +
 * eggs + favorites, ties broken newest-era-first), plus the raw totals —
 * the caller buckets them via `shareCardPath`.
 */
export function summarizeProgress(p: Progress, lookups: ProgressEraLookups): MyErasSummary {
  const score = new Map<EraId, number>();
  const bump = (era: EraId | undefined) => {
    if (era) score.set(era, (score.get(era) ?? 0) + 1);
  };
  for (const id of p.moments) bump(lookups.itemEra(id));
  for (const id of p.favorites) bump(lookups.itemEra(id));
  for (const id of p.eggs) bump(lookups.eggEra(id));
  const order = new Map(ERAS.map((e, i) => [e.id, i]));
  const eras = [...score.entries()]
    .sort((a, b) => b[1] - a[1] || (order.get(b[0]) ?? 0) - (order.get(a[0]) ?? 0))
    .slice(0, MY_ERAS_MAX)
    .map(([id]) => id);
  return { eras, moments: p.moments.size, eggs: p.eggs.size, favorites: p.favorites.size };
}
