'use client';

import { useEffect, useRef } from 'react';
import { clamp, readMonthFloat } from '../scrubberModel';
import { useGrabScrub } from '../useGrabScrub';
import { useRafScroll } from '../useRafScroll';
import type { ScrubberProps } from '../types';

const LOZ_W = 116;
const COL_W = 104;
const WINDOW = 2;

/**
 * D · Marquee. A compact glass lozenge fixed top-centre showing the current
 * month, with prev/next peeking at the clipped edges as it ticks by. Grab it and
 * it stretches into a wide horizontal era timeline — proportional era blocks,
 * month ticks and milestone glyphs — with a fisheye lens bulging under your
 * finger. Block edges snap on release.
 */
export function ScrubberD(props: ScrubberProps): JSX.Element {
  const { model, scrollRef, sectionRefs, onJumpToEra } = props;
  const { months, eraMetas, totalMonths } = model;

  const hitRef = useRef<HTMLDivElement | null>(null);
  const reelRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const litRange = useRef<{ lo: number; hi: number }>({ lo: 0, hi: -1 });
  const playheadRef = useRef<HTMLDivElement | null>(null);
  const bulgeRef = useRef<HTMLDivElement | null>(null);
  const bulgeTextRef = useRef<HTMLSpanElement | null>(null);

  const grab = useGrabScrub({
    scrollRef,
    sectionRefs,
    model,
    onJumpToEra,
    fractionFromPointer: (e, hitEl) => {
      const r = hitEl.getBoundingClientRect();
      return r.width ? (e.clientX - r.left) / r.width : 0;
    },
  });
  const grabbedRef = useRef(grab.grabbed);
  grabbedRef.current = grab.grabbed;

  const draw = (scrollEl: HTMLElement) => {
    if (months.length === 0) return;
    const grabbed = grabbedRef.current;
    const mf = grabbed
      ? (grab.grabMonthFloatRef.current ?? 0)
      : readMonthFloat(scrollEl, sectionRefs.current ?? [], eraMetas);

    if (!grabbed) {
      // Passive marquee: horizontal reel centred on the focused month.
      const reel = reelRef.current;
      if (reel) reel.style.transform = `translate3d(${(LOZ_W / 2 - (mf * COL_W + COL_W / 2)).toFixed(1)}px, 0, 0)`;
      const focusInt = Math.round(mf);
      const lo = Math.max(0, focusInt - WINDOW);
      const hi = Math.min(months.length - 1, focusInt + WINDOW);
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
        const ad = Math.abs(i - mf);
        el.style.opacity = (ad < 0.5 ? 1 : ad < 1.5 ? 0.5 : 0.15).toString();
        el.style.fontWeight = ad < 0.5 ? '800' : '600';
      }
      litRange.current = { lo, hi };
      return;
    }

    // Grabbed: move the playhead + fisheye bulge across the era timeline.
    const rect = hitRef.current?.getBoundingClientRect();
    const w = rect?.width ?? window.innerWidth;
    const frac = clamp(mf / totalMonths, 0, 1);
    const x = frac * w;
    if (playheadRef.current) playheadRef.current.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    if (bulgeRef.current) {
      const bx = clamp(x, 46, w - 46);
      bulgeRef.current.style.transform = `translate3d(${bx.toFixed(1)}px, 0, 0) translateX(-50%)`;
    }
    const m = months[clamp(Math.round(mf - 0.5), 0, months.length - 1)];
    if (bulgeTextRef.current && m) {
      bulgeTextRef.current.textContent = `${m.label}${m.milestoneGlyph ? ` ${m.milestoneGlyph}` : ''}`;
    }
    if (bulgeRef.current && m) bulgeRef.current.style.borderColor = m.accent;
  };

  const drawRef = useRef(draw);
  drawRef.current = draw;
  useRafScroll(scrollRef, (el) => drawRef.current(el), [months.length, model]);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) drawRef.current(el);
  }, [grab.grabbed, scrollRef]);

  const grabbed = grab.grabbed;

  return (
    <div
      role="slider"
      aria-label="Marquee — scrub the timeline"
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={eraMetas.length - 1}
      aria-valuenow={props.activeIndex}
      aria-valuetext={eraMetas[props.activeIndex]?.album}
      tabIndex={0}
      ref={hitRef}
      onPointerDown={grab.onPointerDown}
      onPointerMove={grab.onPointerMove}
      onPointerUp={grab.onPointerUp}
      onPointerCancel={grab.onPointerUp}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 10px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: grabbed ? '92vw' : LOZ_W,
        height: grabbed ? 92 : 30,
        zIndex: 30,
        touchAction: 'none',
        cursor: 'ew-resize',
        borderRadius: grabbed ? 18 : 999,
        overflow: 'hidden',
        background: grabbed ? 'rgba(17,17,22,0.5)' : 'rgba(17,17,22,0.82)',
        backdropFilter: 'blur(16px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.5)',
        border: '1px solid rgba(255,255,255,0.22)',
        boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
        transition: 'width 240ms cubic-bezier(0.22,1,0.36,1), height 240ms cubic-bezier(0.22,1,0.36,1), border-radius 240ms ease',
      }}
    >
      {/* Passive marquee reel. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: grabbed ? 'none' : 'block',
          maskImage: 'linear-gradient(90deg, transparent, #000 22%, #000 78%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 22%, #000 78%, transparent)',
        }}
      >
        <div ref={reelRef} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, willChange: 'transform' }}>
          {months.map((m, i) => (
            <div
              key={m.key}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              style={{
                position: 'absolute',
                left: i * COL_W,
                top: 0,
                bottom: 0,
                width: COL_W,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                color: '#fff',
                fontSize: 13,
                whiteSpace: 'nowrap',
                willChange: 'opacity',
                pointerEvents: 'none',
              }}
            >
              {m.label}
              {m.milestoneGlyph ? <span style={{ marginLeft: 4 }}>{m.milestoneGlyph}</span> : null}
            </div>
          ))}
        </div>
      </div>

      {/* Grabbed horizontal era timeline. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          display: grabbed ? 'flex' : 'none',
          alignItems: 'stretch',
        }}
      >
        {eraMetas.map((meta) => (
          <div
            key={meta.slug}
            style={{
              flex: `${meta.monthCount} 0 0`,
              minWidth: 0,
              position: 'relative',
              borderRight: '1px solid rgba(255,255,255,0.25)',
              background: `linear-gradient(180deg, ${meta.accent}cc, ${meta.accent}66)`,
              backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.28) 0, rgba(255,255,255,0.28) 1px, transparent 1px, transparent ${100 / meta.monthCount}%)`,
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 5,
                bottom: 4,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.03em',
                color: '#fff',
                textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '95%',
              }}
            >
              {meta.album}
            </span>
          </div>
        ))}
        {/* Playhead line. */}
        <div
          ref={playheadRef}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: 2,
            background: '#fff',
            boxShadow: '0 0 8px rgba(255,255,255,0.8)',
            willChange: 'transform',
          }}
        />
        {/* Fisheye bulge lens. */}
        <div
          ref={bulgeRef}
          style={{
            position: 'absolute',
            top: -6,
            left: 0,
            willChange: 'transform',
            padding: '6px 12px',
            borderRadius: 12,
            background: 'rgba(17,17,22,0.95)',
            border: '2px solid #fff',
            color: '#fff',
            fontSize: 16,
            fontWeight: 800,
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <span ref={bulgeTextRef} />
        </div>
      </div>
    </div>
  );
}
