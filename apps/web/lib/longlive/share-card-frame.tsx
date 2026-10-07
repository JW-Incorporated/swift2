import type { ReactNode } from 'react';
import type { Era } from '@swift2/experience';
import { SHARE_CARD_SIZES, type ShareCardSize } from './share-card-params';

/**
 * Shared chrome for every share card: the era-palette background, the
 * safe-zone-aware content column, the pill CTA and the watermark. Layouts
 * (share-card-layouts.tsx) only supply what goes in the middle. Everything is
 * our own type and CSS gradients — no photos, album art, lyrics or logos.
 */

export const SHARE_CARD_WATERMARK = 'Fan-made · longlivets.com';

/** Instagram/TikTok/Reels cover the top and bottom ~250px of a 1920-tall story. */
export const STORY_SAFE_Y = 270;

const PAD_X = 88;

export function safeInsets(size: ShareCardSize): { top: number; bottom: number } {
  return size === 'story' ? { top: STORY_SAFE_Y, bottom: STORY_SAFE_Y } : { top: 96, bottom: 84 };
}

/** Story cards have ~42% more height, so type scales up a little with it. */
export function scaleFor(size: ShareCardSize): number {
  return size === 'story' ? 1.12 : 1;
}

export function alpha(hex: string, a: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** Pick a font size from a length ladder — satori has no shrink-to-fit. */
export function fit(length: number, ladder: ReadonlyArray<readonly [number, number]>): number {
  for (const [maxLen, px] of ladder) {
    if (length <= maxLen) return px;
  }
  return ladder[ladder.length - 1][1];
}

export function textOnAccent(era: Era): string {
  return era.theme.accentFg ?? '#000000';
}

export function smallAccent(era: Era): string {
  return era.theme.accentText ?? era.theme.accent;
}

export function Cta({ era, label }: { era: Era; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignSelf: 'flex-start',
        background: era.theme.accent,
        color: textOnAccent(era),
        fontFamily: 'Inter',
        fontWeight: 800,
        fontSize: 32,
        letterSpacing: 1,
        padding: '20px 40px',
        borderRadius: 999,
        boxShadow: `0 12px 40px ${alpha(era.theme.accent, 0.35)}`,
      }}
    >
      {label}
    </div>
  );
}

export function Watermark({ era }: { era: Era }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 56 }}>
      <div
        style={{ display: 'flex', width: 44, height: 2, background: alpha(era.theme.inkSoft, 0.6) }}
      />
      <div
        style={{
          display: 'flex',
          margin: '0 18px',
          fontFamily: 'Inter',
          fontWeight: 600,
          fontSize: 26,
          letterSpacing: 2,
          color: alpha(era.theme.inkSoft, 0.9),
        }}
      >
        {SHARE_CARD_WATERMARK}
      </div>
      <div
        style={{ display: 'flex', width: 44, height: 2, background: alpha(era.theme.inkSoft, 0.6) }}
      />
    </div>
  );
}

export function Frame({
  era,
  size,
  secondary,
  children,
}: {
  era: Era;
  size: ShareCardSize;
  /** A second era whose accent tints the lower-left glow (My Eras card). */
  secondary?: Era;
  children: ReactNode;
}) {
  const { width, height } = SHARE_CARD_SIZES[size];
  const inset = safeInsets(size);
  const t = era.theme;
  const tint = (secondary ?? era).theme.accent2;
  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(160deg, ${t.surface} 0%, ${t.bg} 55%)`,
        color: t.ink,
        fontFamily: 'Inter',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -380,
          right: -380,
          width: 1100,
          height: 1100,
          borderRadius: 550,
          display: 'flex',
          background: `radial-gradient(circle, ${alpha(t.accent, 0.42)} 0%, ${alpha(t.accent, 0)} 68%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -420,
          left: -420,
          width: 1100,
          height: 1100,
          borderRadius: 550,
          display: 'flex',
          background: `radial-gradient(circle, ${alpha(tint, 0.3)} 0%, ${alpha(tint, 0)} 68%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -180,
          right: -180,
          width: 760,
          height: 760,
          borderRadius: 380,
          display: 'flex',
          border: `2px solid ${alpha(t.accent, 0.28)}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 520,
          height: 520,
          borderRadius: 260,
          display: 'flex',
          border: `2px solid ${alpha(t.accent, 0.16)}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: inset.top,
          bottom: inset.bottom,
          left: PAD_X,
          right: PAD_X,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {children}
        <Watermark era={era} />
      </div>
    </div>
  );
}

export function EraPill({ era, label }: { era: Era; label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          width: 18,
          height: 18,
          borderRadius: 9,
          background: era.theme.accent,
          marginRight: 18,
        }}
      />
      <div
        style={{
          display: 'flex',
          fontFamily: 'Inter',
          fontWeight: 600,
          fontSize: 28,
          letterSpacing: 5,
          textTransform: 'uppercase',
          color: smallAccent(era),
        }}
      >
        {label ?? `${era.shortName} · ${era.yearLabel}`}
      </div>
    </div>
  );
}
