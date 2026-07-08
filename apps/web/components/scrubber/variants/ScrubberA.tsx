'use client';

import { useEffect, useRef } from 'react';
import { clamp, readMonthFloat } from '../scrubberModel';
import { useGrabScrub } from '../useGrabScrub';
import { useRafScroll } from '../useRafScroll';
import type { ScrubberProps } from '../types';

const DETECTOR = 0.2;
const PASSIVE_ROW_H = 22;
const GRABBED_ROW_H = 30;
const PASSIVE_WINDOW = 2;
const GRABBED_WINDOW = 9;

/**
 * A · Time Reel. A vertical column of month labels on the right edge that drifts
 * with scroll (focused month bright, neighbours ghosted). Grab the full-height
 * strip and it swells into a tall dial: ±9 months fan open, the focused row
 * magnifies with a Dock-style falloff, era-first rows carry the album name, and
 * releasing snaps to the nearest era's first month.
 */
export function ScrubberA(props: ScrubberProps): JSX.Element {
  const { model, scrollRef, sectionRefs, onJumpToEra } = props;
  const months = model.months;

  const reelRef = useRef<HTMLDivElement | null>(null);
  const spineRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const litRange = useRef<{ lo: number; hi: number }>({ lo: 0, hi: -1 });

  const grab = useGrabScrub({
    scrollRef,
    sectionRefs,
    model,
    onJumpToEra,
    fractionFromPointer: (e, hitEl) => {
      const r = hitEl.getBoundingClientRect();
      return r.height ? (e.clientY - r.top) / r.height : 0;
    },
  });
  const grabbedRef = useRef(grab.grabbed);
  grabbedRef.current = grab.grabbed;

  const draw = (scrollEl: HTMLElement) => {
    if (months.length === 0) return;
    const grabbed = grabbedRef.current;
    const mf = grabbed ? (grab.grabMonthFloatRef.current ?? 0) : readMonthFloat(scrollEl, sectionRefs.current ?? [], model.eraMetas);
    const rowH = grabbed ? GRABBED_ROW_H : PASSIVE_ROW_H;
    const win = grabbed ? GRABBED_WINDOW : PASSIVE_WINDOW;
    const centerPx = window.innerHeight * DETECTOR;

    const reel = reelRef.current;
    if (reel) reel.style.transform = `translate3d(0, ${centerPx - mf * rowH}px, 0)`;

    const focusInt = Math.round(mf);
    const lo = Math.max(0, focusInt - win - 1);
    const hi = Math.min(months.length - 1, focusInt + win + 1);

    // Dim rows that just left the window.
    const prev = litRange.current;
    for (let i = prev.lo; i <= prev.hi; i += 1) {
      if (i < lo || i > hi) {
        const el = rowRefs.current[i];
        if (el) el.style.opacity = '0';
      }
    }

    for (let i = lo; i <= hi; i += 1) {
      const el = rowRefs.current[i];
      if (!el) continue;
      const d = i - mf;
      const ad = Math.abs(d);
      const t = clamp(ad / (win + 0.5), 0, 1);
      let opacity: number;
      let scale: number;
      if (grabbed) {
        opacity = clamp(1 - 0.65 * t, 0.35, 1);
        scale = 1.25 - 0.4 * t; // Dock falloff from 1.25x under the finger
      } else {
        opacity = ad < 0.5 ? 0.95 : ad < 1.5 ? 0.5 : 0.18 * (1 - t);
        scale = 1;
      }
      el.style.top = `${i * rowH}px`;
      el.style.height = `${rowH}px`;
      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `scale(${scale.toFixed(3)})`;
      el.style.fontWeight = ad < 0.5 ? '800' : '600';
    }
    litRange.current = { lo, hi };

    // Spine tint follows the focused era; taller/brighter when grabbed.
    const spine = spineRef.current;
    const focusMonth = months[clamp(focusInt, 0, months.length - 1)];
    if (spine && focusMonth) {
      spine.style.background = focusMonth.accent;
      spine.style.opacity = grabbed ? '0.9' : '0.5';
    }
  };

  const drawRef = useRef(draw);
  drawRef.current = draw;
  useRafScroll(scrollRef, (el) => drawRef.current(el), [months.length, model]);
  // Redraw immediately when grab state flips (grow / shrink) with no scroll.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) drawRef.current(el);
  }, [grab.grabbed, scrollRef]);

  const grabbed = grab.grabbed;

  return (
    <div
      role="slider"
      aria-label="Time reel — scrub the timeline"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={model.eraMetas.length - 1}
      aria-valuenow={props.activeIndex}
      aria-valuetext={model.eraMetas[props.activeIndex]?.album}
      tabIndex={0}
      onPointerDown={grab.onPointerDown}
      onPointerMove={grab.onPointerMove}
      onPointerUp={grab.onPointerUp}
      onPointerCancel={grab.onPointerUp}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: grabbed ? 168 : 60,
        zIndex: 30,
        touchAction: 'none',
        cursor: 'ns-resize',
        overflow: 'hidden',
        transition: 'width 200ms cubic-bezier(0.22,1,0.36,1)',
        // Grabbed: a frosted panel; passive: transparent so only the reel shows.
        background: grabbed ? 'rgba(17,17,22,0.42)' : 'transparent',
        backdropFilter: grabbed ? 'blur(16px) saturate(1.4)' : 'none',
        WebkitBackdropFilter: grabbed ? 'blur(16px) saturate(1.4)' : 'none',
        borderLeft: grabbed ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
        maskImage: 'linear-gradient(180deg, transparent, #000 12%, #000 88%, transparent)',
        WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 12%, #000 88%, transparent)',
      }}
    >
      {/* Thin era-color spine behind the reel. */}
      <div
        ref={spineRef}
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 6,
          width: 3,
          borderRadius: 3,
          background: '#888',
          opacity: 0.5,
          transition: 'opacity 200ms ease',
        }}
      />
      <div ref={reelRef} style={{ position: 'absolute', top: 0, right: 14, left: 8, willChange: 'transform' }}>
        {months.map((m, i) => (
          <div
            key={m.key}
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            style={{
              position: 'absolute',
              right: 0,
              left: 0,
              top: i * PASSIVE_ROW_H,
              height: PASSIVE_ROW_H,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'center',
              textAlign: 'right',
              lineHeight: 1,
              opacity: 0,
              transformOrigin: 'right center',
              color: '#fff',
              textShadow: '0 1px 6px rgba(0,0,0,0.55)',
              willChange: 'opacity, transform',
              pointerEvents: 'none',
            }}
          >
            {m.isEraFirst ? (
              <span
                style={{
                  fontSize: 8,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: m.accent,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {m.album}
              </span>
            ) : null}
            <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
              {m.monthShort} {String(m.year).slice(2)}
              {m.milestoneGlyph ? <span style={{ marginLeft: 3 }}>{m.milestoneGlyph}</span> : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
