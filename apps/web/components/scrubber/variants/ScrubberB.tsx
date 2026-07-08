'use client';

import { useEffect, useRef } from 'react';
import { clamp, readMonthFloat } from '../scrubberModel';
import { useGrabScrub } from '../useGrabScrub';
import { useRafScroll } from '../useRafScroll';
import type { ScrubberProps } from '../types';

/**
 * B · Spectrum Spine. A full-height ribbon of stacked era-colour bands (each
 * band sized by that era's month count), with a glass date chip riding it. Grab
 * it and the ribbon widens into a labelled ruler — month ticks and era names
 * fade in and the chip inflates into a fast-scroll bubble showing Month Year,
 * the album, and a milestone glyph. Band edges snap on release.
 */
export function ScrubberB(props: ScrubberProps): JSX.Element {
  const { model, scrollRef, sectionRefs, onJumpToEra } = props;
  const { months, eraMetas, totalMonths } = model;

  const chipRef = useRef<HTMLDivElement | null>(null);
  const chipDateRef = useRef<HTMLSpanElement | null>(null);
  const chipAlbumRef = useRef<HTMLSpanElement | null>(null);
  const prevRef = useRef<HTMLSpanElement | null>(null);
  const nextRef = useRef<HTMLSpanElement | null>(null);

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
    const mf = grabbed
      ? (grab.grabMonthFloatRef.current ?? 0)
      : readMonthFloat(scrollEl, sectionRefs.current ?? [], eraMetas);
    const frac = clamp(mf / totalMonths, 0, 1);
    const h = window.innerHeight;

    const chip = chipRef.current;
    if (chip) chip.style.transform = `translate3d(0, ${(frac * h).toFixed(1)}px, 0) translateY(-50%)`;

    const idx = clamp(Math.round(mf - 0.5), 0, months.length - 1);
    const m = months[idx];
    if (m) {
      if (chipDateRef.current) {
        chipDateRef.current.textContent = `${m.label}${m.milestoneGlyph ? ` ${m.milestoneGlyph}` : ''}`;
      }
      if (chipAlbumRef.current) chipAlbumRef.current.textContent = m.album;
      if (chip) chip.style.borderColor = m.accent;
    }
    const pm = months[idx - 1];
    const nm = months[idx + 1];
    if (prevRef.current) prevRef.current.textContent = pm ? pm.label : '';
    if (nextRef.current) nextRef.current.textContent = nm ? nm.label : '';
  };

  const drawRef = useRef(draw);
  drawRef.current = draw;
  useRafScroll(scrollRef, (el) => drawRef.current(el), [months.length, model]);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) drawRef.current(el);
  }, [grab.grabbed, scrollRef]);

  const grabbed = grab.grabbed;
  const spineW = grabbed ? 56 : 3;

  return (
    <div
      role="slider"
      aria-label="Spectrum spine — scrub the timeline"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={eraMetas.length - 1}
      aria-valuenow={props.activeIndex}
      aria-valuetext={eraMetas[props.activeIndex]?.album}
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
        width: 46,
        zIndex: 30,
        touchAction: 'none',
        cursor: 'ns-resize',
      }}
    >
      {/* The colour ribbon, pinned to the right edge, widening on grab. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: spineW,
          display: 'flex',
          flexDirection: 'column',
          borderTopLeftRadius: grabbed ? 10 : 3,
          borderBottomLeftRadius: grabbed ? 10 : 3,
          overflow: 'hidden',
          boxShadow: grabbed ? '0 8px 30px rgba(0,0,0,0.35)' : 'none',
          transition: 'width 220ms cubic-bezier(0.22,1,0.36,1), border-radius 220ms ease',
        }}
      >
        {eraMetas.map((meta) => (
          <div
            key={meta.slug}
            style={{
              flex: `${meta.monthCount} 0 0`,
              minHeight: 0,
              position: 'relative',
              background: meta.accent,
            }}
          >
            {/* Month ticks (fade in on grab). */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: grabbed ? 1 : 0,
                transition: 'opacity 200ms ease',
                backgroundImage: `repeating-linear-gradient(180deg, rgba(255,255,255,0.35) 0, rgba(255,255,255,0.35) 1px, transparent 1px, transparent ${100 / meta.monthCount}%)`,
              }}
            />
            {/* Era name (fade in on grab). */}
            <span
              style={{
                position: 'absolute',
                left: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: 'rgba(255,255,255,0.95)',
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                whiteSpace: 'nowrap',
                opacity: grabbed ? 1 : 0,
                transition: 'opacity 200ms ease',
                pointerEvents: 'none',
              }}
            >
              {meta.album}
            </span>
          </div>
        ))}
      </div>

      {/* The riding date chip / fast-scroll bubble. */}
      <div
        ref={chipRef}
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          right: spineW + 8,
          willChange: 'transform',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 2,
          padding: grabbed ? '8px 12px' : '3px 8px',
          borderRadius: 12,
          background: 'rgba(17,17,22,0.9)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '2px solid #888',
          color: '#fff',
          boxShadow: '0 6px 22px rgba(0,0,0,0.4)',
          transform: 'translateY(-50%)',
          transformOrigin: 'right center',
          transition: 'padding 200ms ease',
        }}
      >
        <span
          ref={prevRef}
          style={{ fontSize: 10, opacity: 0.5, whiteSpace: 'nowrap', display: grabbed ? 'none' : 'block' }}
        />
        <span
          ref={chipDateRef}
          style={{ fontSize: grabbed ? 20 : 12, fontWeight: 800, whiteSpace: 'nowrap', lineHeight: 1.1, transition: 'font-size 180ms ease' }}
        />
        <span
          ref={chipAlbumRef}
          style={{
            fontSize: 11,
            opacity: 0.8,
            whiteSpace: 'nowrap',
            display: grabbed ? 'block' : 'none',
          }}
        />
        <span
          ref={nextRef}
          style={{ fontSize: 10, opacity: 0.5, whiteSpace: 'nowrap', display: grabbed ? 'none' : 'block' }}
        />
      </div>
    </div>
  );
}
