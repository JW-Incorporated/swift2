'use client';

import { useEffect, useRef } from 'react';
import { clamp, eraIndexAtMonthFloat, readMonthFloat, type ScrubberModel } from '../scrubberModel';
import { useGrabScrub } from '../useGrabScrub';
import { useRafScroll } from '../useRafScroll';
import type { ScrubberProps } from '../types';

const LOUPE_H = 260;
const LOUPE_W = 132;
const ROW_H = 26;
const WINDOW = 6;

/** C's drag maps finger position across eras evenly (matching the dot capsule). */
function fractionToMonthFloatC(f: number, model: ScrubberModel): number {
  const n = model.eraMetas.length;
  if (n === 0) return 0;
  const eraFloat = clamp(f, 0, 0.99999) * n;
  const era = clamp(Math.floor(eraFloat), 0, n - 1);
  const within = eraFloat - era;
  const meta = model.eraMetas[era]!;
  return meta.startFloat + within * meta.monthCount;
}

/**
 * C · Loupe. A slim capsule of one dot per era with a date tag that floats
 * beside the active dot, gliding continuously as you scroll. Grab it and a
 * frosted loupe blooms under your finger: the nearest eras unroll into
 * Dock-magnified month lists while distant eras stay dots for context. Crossing
 * a dot rolls into the next era; release snaps to the nearest era.
 */
export function ScrubberC(props: ScrubberProps): JSX.Element {
  const { model, scrollRef, sectionRefs, onJumpToEra } = props;
  const { months, eraMetas } = model;
  const n = eraMetas.length;

  const capsuleRef = useRef<HTMLDivElement | null>(null);
  const tagRef = useRef<HTMLDivElement | null>(null);
  const tagTextRef = useRef<HTMLSpanElement | null>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const loupeRef = useRef<HTMLDivElement | null>(null);
  const reelRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const litRange = useRef<{ lo: number; hi: number }>({ lo: 0, hi: -1 });
  const pointerYRef = useRef(0);

  const grab = useGrabScrub({
    scrollRef,
    sectionRefs,
    model,
    onJumpToEra,
    fractionToMonthFloat: fractionToMonthFloatC,
    fractionFromPointer: (e, hitEl) => {
      pointerYRef.current = e.clientY;
      const r = hitEl.getBoundingClientRect();
      return r.height ? (e.clientY - r.top) / r.height : 0;
    },
  });
  const grabbedRef = useRef(grab.grabbed);
  grabbedRef.current = grab.grabbed;

  const draw = (scrollEl: HTMLElement) => {
    if (months.length === 0 || n === 0) return;
    const grabbed = grabbedRef.current;
    const mf = grabbed
      ? (grab.grabMonthFloatRef.current ?? 0)
      : readMonthFloat(scrollEl, sectionRefs.current ?? [], eraMetas);
    const era = eraIndexAtMonthFloat(eraMetas, mf);
    const meta = eraMetas[era]!;
    const within = clamp((mf - meta.startFloat) / meta.monthCount, 0, 1);
    const eraFloat = era + within;

    // Passive: date tag glides beside the capsule; active dot swells.
    const capRect = capsuleRef.current?.getBoundingClientRect();
    if (capRect) {
      const tagY = capRect.top + (clamp(eraFloat, 0, n) / n) * capRect.height;
      if (tagRef.current) tagRef.current.style.transform = `translate3d(0, ${tagY.toFixed(1)}px, 0) translateY(-50%)`;
    }
    const focusMonth = months[clamp(Math.round(mf - 0.5), 0, months.length - 1)];
    if (tagTextRef.current && focusMonth) {
      tagTextRef.current.textContent = `${focusMonth.label}${focusMonth.milestoneGlyph ? ` ${focusMonth.milestoneGlyph}` : ''}`;
    }
    if (tagRef.current && focusMonth) tagRef.current.style.borderColor = focusMonth.accent;

    const activeEra = clamp(Math.floor(eraFloat), 0, n - 1);
    for (let i = 0; i < n; i += 1) {
      const dot = dotRefs.current[i];
      if (!dot) continue;
      const active = i === activeEra;
      dot.style.width = active ? '9px' : '5px';
      dot.style.height = active ? '9px' : '5px';
      dot.style.opacity = active ? '1' : '0.5';
      dot.style.boxShadow = active ? '0 0 0 3px rgba(255,255,255,0.28)' : 'none';
    }

    // Grabbed: loupe blooms at the finger and unrolls magnified months.
    const loupe = loupeRef.current;
    const reel = reelRef.current;
    if (grabbed && loupe && reel) {
      const centerY = clamp(pointerYRef.current, LOUPE_H / 2 + 6, window.innerHeight - LOUPE_H / 2 - 6);
      loupe.style.transform = `translate3d(0, ${(centerY - LOUPE_H / 2).toFixed(1)}px, 0)`;

      const focusInt = Math.round(mf);
      const lo = Math.max(0, focusInt - WINDOW - 1);
      const hi = Math.min(months.length - 1, focusInt + WINDOW + 1);
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
        const dist = i - mf;
        const t = clamp(Math.abs(dist) / (WINDOW + 0.5), 0, 1);
        const scale = 1.3 - 0.55 * t; // finger month 1.3x, falloff to ~0.45
        const opacity = clamp(1 - 0.75 * t, 0.25, 1);
        el.style.top = `${(LOUPE_H / 2 + dist * ROW_H).toFixed(1)}px`;
        el.style.opacity = opacity.toFixed(3);
        el.style.transform = `translateY(-50%) scale(${scale.toFixed(3)})`;
        el.style.fontWeight = Math.abs(dist) < 0.5 ? '800' : '600';
      }
      litRange.current = { lo, hi };
    }
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
      aria-label="Loupe — scrub the timeline"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={n - 1}
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
        width: 52,
        zIndex: 30,
        touchAction: 'none',
        cursor: 'ns-resize',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      {/* Dot capsule (always visible; dots stay for context while grabbed). */}
      <div
        ref={capsuleRef}
        aria-hidden
        style={{
          position: 'relative',
          marginRight: 9,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '62vh',
          gap: 10,
          padding: '12px 6px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(14px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(14px) saturate(1.5)',
          border: '1px solid rgba(255,255,255,0.22)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.22)',
          opacity: grabbed ? 0.5 : 1,
          transition: 'opacity 200ms ease',
        }}
      >
        {eraMetas.map((meta, i) => (
          <span
            key={meta.slug}
            ref={(el) => {
              dotRefs.current[i] = el;
            }}
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              background: meta.accent,
              opacity: 0.5,
              flex: '0 0 auto',
            }}
          />
        ))}
      </div>

      {/* Passive date tag riding beside the active dot. */}
      <div
        ref={tagRef}
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          right: 34,
          willChange: 'transform',
          padding: '3px 9px',
          borderRadius: 10,
          background: 'rgba(17,17,22,0.9)',
          border: '2px solid #888',
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          transform: 'translateY(-50%)',
          opacity: grabbed ? 0 : 1,
          transition: 'opacity 160ms ease',
        }}
      >
        <span ref={tagTextRef} />
      </div>

      {/* Grabbed loupe: frosted magnifier near the finger. */}
      <div
        ref={loupeRef}
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          right: 30,
          width: LOUPE_W,
          height: LOUPE_H,
          willChange: 'transform',
          borderRadius: 22,
          overflow: 'hidden',
          background: 'rgba(20,20,26,0.55)',
          backdropFilter: 'blur(20px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
          border: '1px solid rgba(255,255,255,0.28)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
          display: grabbed ? 'block' : 'none',
          pointerEvents: 'none',
        }}
      >
        <div ref={reelRef} style={{ position: 'absolute', inset: 0 }}>
          {months.map((m, i) => (
            <div
              key={m.key}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              style={{
                position: 'absolute',
                left: 12,
                right: 12,
                top: 0,
                opacity: 0,
                display: 'flex',
                alignItems: 'baseline',
                gap: 6,
                color: '#fff',
                textShadow: '0 1px 6px rgba(0,0,0,0.6)',
                transformOrigin: 'left center',
                willChange: 'opacity, transform',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 999, background: m.accent, flex: '0 0 auto' }} />
              <span style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                {m.isEraFirst ? <strong style={{ color: m.accent }}>{m.album} · </strong> : null}
                {m.label}
                {m.milestoneGlyph ? ` ${m.milestoneGlyph}` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
