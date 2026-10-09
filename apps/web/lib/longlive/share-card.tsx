import { ImageResponse } from 'next/og';
import type { ReactElement } from 'react';
import { loadShareCardFonts } from './share-card-fonts';
import { DefaultLayout, EraLayout, MomentLayout, MyErasLayout } from './share-card-layouts';
import { SHARE_CARD_SIZES, type ShareCardSize } from './share-card-params';
import type { ShareCardSpec } from './share-card-spec';

/**
 * The card is a pure function of (spec, size): same input, same pixels, no
 * network, no LLM, no DB — so the CDN can hold any render for a long time.
 * Browser max-age is short so a content correction reaches fans' devices the
 * same day; the CDN keeps it a day and serves stale while it refreshes.
 */
export const SHARE_CARD_CACHE_CONTROL =
  'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';

/** The element tree for a card (host elements only — walked by the tests). */
export function buildShareCardTree(spec: ShareCardSpec, size: ShareCardSize): ReactElement {
  switch (spec.kind) {
    case 'moment':
      return MomentLayout({ spec, size });
    case 'era':
      return EraLayout({ spec, size });
    case 'myEras':
      return MyErasLayout({ spec, size });
    default:
      return DefaultLayout({ spec, size });
  }
}

export function renderShareCard(spec: ShareCardSpec, size: ShareCardSize): ImageResponse {
  return new ImageResponse(buildShareCardTree(spec, size), {
    ...SHARE_CARD_SIZES[size],
    fonts: loadShareCardFonts(),
    headers: { 'Cache-Control': SHARE_CARD_CACHE_CONTROL },
  });
}
