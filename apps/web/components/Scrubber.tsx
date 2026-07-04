'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { Era, Milestone } from '@swift2/shared';
import { eraIndexAtPosition, positionForEraIndex } from '@swift2/shared';

interface ScrubberProps {
  eras: Era[];
  /** Active era from the vertical scroll — drives the thumb at rest (two-way coupling). */
  index: number;
  /** Expanded = full navigator; collapsed = thin peek strip. Parent-controlled. */
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** Scrub/tap/keys → jump the page to this era. */
  onSelectEra: (index: number) => void;
  /** Rendered as orientation markers in the expanded timeline (not snap targets). */
  milestones: Milestone[];
}

const PEEK_H = 34;
const FULL_H = 72;

/**
 * Era scrubber (v1 snaps to era boundaries only). A thin peek strip at rest;
 * grabbing it expands into the full navigator. The drag hot path is fully
 * imperative — pointer moves paint the thumb via a transform with NO React
 * state per frame — so it holds the frame budget. At rest the thumb follows
 * `index`, so scrolling the content into a new era moves the scrubber too.
 * Milestones show as markers for orientation; releasing snaps to an era.
 *
 * NOTE: still needs on-device 60fps verification per the v1 spec.
 */
export function Scrubber({ eras, index, expanded, onExpandedChange, onSelectEra, milestones }: ScrubberProps) {
  const n = eras.length;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const draggingRef = useRef(false);

  const paint = useCallback(
    (pos: number) => {
      const track = trackRef.current;
      const thumb = thumbRef.current;
      if (!track || !thumb) return;
      thumb.style.transform = `translate3d(${pos * track.clientWidth}px, 0, 0)`;
      const label = labelRef.current;
      if (label) label.textContent = eras[eraIndexAtPosition(n, pos)]?.album ?? '';
    },
    [eras, n],
  );

  // At rest, reflect the active era (updated by vertical scroll).
  useEffect(() => {
    if (!draggingRef.current) paint(positionForEraIndex(n, index));
  }, [index, n, paint]);
  useEffect(() => {
    const onResize = () => {
      if (!draggingRef.current) paint(positionForEraIndex(n, index));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [index, n, paint]);

  const posFromClientX = (clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    return rect.width ? Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) : 0;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    onExpandedChange(true);
    paint(posFromClientX(e.clientX));
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) paint(posFromClientX(e.clientX));
  };
  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const i = eraIndexAtPosition(n, posFromClientX(e.clientX));
    paint(positionForEraIndex(n, i));
    onSelectEra(i);
    onExpandedChange(false);
  };
  // A canceled pointer (lost capture, OS/browser gesture interruption) must
  // abort the scrub — restore the current era, never commit a jump.
  const cancelDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    paint(positionForEraIndex(n, index));
    onExpandedChange(false);
  };
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' && index < n - 1) {
      e.preventDefault();
      onSelectEra(index + 1);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      onSelectEra(index - 1);
    }
  };

  if (n === 0) return null;

  // Milestone marker positions: within their era's segment, offset by date.
  const eraMeta = new Map(
    eras.map((e, i) => [e.slug, { i, start: +new Date(e.startDate), end: +new Date(e.endDate) }]),
  );
  const markerPos = (m: Milestone): number | null => {
    const meta = eraMeta.get(m.eraSlug);
    if (!meta) return null;
    const span = meta.end - meta.start;
    const f = span > 0 ? Math.min(1, Math.max(0, (+new Date(m.date) - meta.start) / span)) : 0.5;
    return (meta.i + f) / n;
  };

  return (
    <div
      style={{
        flex: '0 0 auto',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--line)',
        padding: '6px 12px 8px',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
          Timeline
        </span>
        <span ref={labelRef} style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }} />
      </div>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Era timeline"
        aria-valuemin={0}
        aria-valuemax={n - 1}
        aria-valuenow={index}
        aria-valuetext={eras[index]?.album}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={cancelDrag}
        onKeyDown={onKeyDown}
        style={{
          position: 'relative',
          height: expanded ? FULL_H : PEEK_H,
          transition: 'height 200ms ease',
          cursor: 'grab',
          touchAction: 'none',
          borderRadius: 8,
        }}
      >
        {/* baseline */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: expanded ? 16 : '50%',
            height: 2,
            background: 'var(--line)',
            transition: 'top 200ms ease',
          }}
        />
        {/* milestone markers (expanded only, for orientation) */}
        {expanded
          ? milestones.map((m) => {
              const p = markerPos(m);
              if (p === null) return null;
              return (
                <span
                  key={m.id}
                  aria-hidden
                  title={m.title}
                  style={{
                    position: 'absolute',
                    left: `${p * 100}%`,
                    top: 16,
                    transform: 'translate(-50%, -50%)',
                    width: 4,
                    height: 4,
                    borderRadius: 999,
                    background: 'var(--ink-soft)',
                    opacity: 0.7,
                  }}
                />
              );
            })
          : null}
        {/* era ticks */}
        {eras.map((e, i) => {
          const active = i === index;
          return (
            <button
              key={e.slug}
              type="button"
              aria-label={e.album}
              onClick={() => onSelectEra(i)}
              style={{
                position: 'absolute',
                left: `${positionForEraIndex(n, i) * 100}%`,
                top: expanded ? 16 : '50%',
                transform: 'translate(-50%, -50%)',
                width: active ? 12 : 8,
                height: active ? 12 : 8,
                borderRadius: 999,
                background: active ? 'var(--accent)' : 'var(--ink-soft)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                opacity: active ? 1 : 0.55,
                transition: 'top 200ms ease',
              }}
            />
          );
        })}
        {/* active era name, shown in the expanded navigator */}
        {expanded ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 6,
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--accent)',
            }}
          >
            {eras[index]?.title}
          </div>
        ) : null}
        {/* thumb (imperatively positioned) */}
        <div
          ref={thumbRef}
          aria-hidden
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 0, willChange: 'transform', pointerEvents: 'none' }}
        >
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: -1.5, width: 3, background: 'var(--accent)', borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}
