import { ImageResponse } from 'next/og';

// Shared renderer behind both the static root `opengraph-image.tsx` (the
// homepage / no-feature fallback) and `app/api/og/route.tsx` (the
// lens/mode-aware cards). One layout, one palette — only the three copy
// lines change per card. Keeping this in one place is what makes the
// "cool feature only" fix (#social-strategy.md §2) a one-file change
// instead of two drifting copies.
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

export interface OgCardCopy {
  /** Small uppercase eyebrow line, e.g. "The Taylor Swift time machine". */
  kicker: string;
  /** The big line — the feature's own name (e.g. "The Decode"), never the
   * generic "Long Live" brand lockup once a real feature is known. */
  title: string;
  subtitle: string;
}

export function renderOgCard({ kicker, title, subtitle }: OgCardCopy): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#2a1405',
        padding: '80px',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 6,
          textTransform: 'uppercase',
          color: '#ffd45e',
          marginBottom: 28,
          textAlign: 'center',
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: title.length > 14 ? 110 : 148,
          fontWeight: 700,
          color: '#ffe9d0',
          lineHeight: 1,
          textAlign: 'center',
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 34,
          color: '#e2b587',
          marginTop: 36,
          textAlign: 'center',
        }}
      >
        {subtitle}
      </div>
    </div>,
    { ...OG_IMAGE_SIZE },
  );
}

// The generic brand card — the bare homepage and any route with no
// distinctive feature to show. Unchanged from the original single card
// (docs #653 / #736), just given a name so both call sites share it.
export const DEFAULT_OG_COPY: OgCardCopy = {
  kicker: 'The Taylor Swift time machine',
  title: 'Long Live',
  subtitle: 'Real-time updates on her whole life, or step back into any era.',
};
