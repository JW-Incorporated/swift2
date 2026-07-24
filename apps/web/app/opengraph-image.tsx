import { ImageResponse } from 'next/og';

// Closes the #653 gap (Nils, 2026-07-15): no og:image existed, so shared
// links rendered as bare text everywhere (iMessage, Slack, X, etc.) and
// also blocked the CAMPAIGN track's own share-card ask (#736). Next.js
// auto-detects this file and wires it into both og:image and (absent a
// dedicated twitter-image file) the Twitter card, no manual metadata
// needed. Same current-era palette/copy as the landing page eyebrow+
// subtitle (LandingPage.tsx) — not reinvented here.
export const alt = "Long Live — the Taylor Swift time machine";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
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
          }}
        >
          The Taylor Swift time machine
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 148,
            fontWeight: 700,
            color: '#ffe9d0',
            lineHeight: 1,
          }}
        >
          Long Live
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
          Real-time updates on her whole life, or step back into any era.
        </div>
      </div>
    ),
    { ...size },
  );
}
