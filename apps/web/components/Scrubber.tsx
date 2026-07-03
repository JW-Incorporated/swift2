'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { Era } from '@swift2/shared';
import { eraIndexAtPosition, positionForEraIndex } from '@swift2/shared';

interface ScrubberProps {
  eras: Era[];
  index: number;
  onIndexChange: (index: number) => void;
}

/**
 * Morph-on-grab era timeline (v1 snaps to era boundaries). The drag hot path is
 * fully imperative — pointer moves paint the thumb via a transform with NO React
 * state per frame — so it holds the frame budget. React state changes only once
 * per gesture (expand) and once on release (snap → onIndexChange). Ticks and
 * arrow keys give a non-gesture path for accessibility.
 *
 * NOTE: needs on-device 60fps verification + Codex adversarial review before it
 * counts as done (per the v1 spec's performance gate).
 */
export function Scrubber({ eras, index, onIndexChange }: ScrubberProps) {
  const n = eras.length;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const draggingRef = useRef(false);
  const [expanded, setExpanded] = useState(false);

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
    if (rect.width === 0) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    setExpanded(true);
    paint(posFromClientX(e.clientX));
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    paint(posFromClientX(e.clientX));
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setExpanded(false);
    const i = eraIndexAtPosition(n, posFromClientX(e.clientX));
    paint(positionForEraIndex(n, i));
    if (i !== index) onIndexChange(i);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' && index < n - 1) {
      e.preventDefault();
      onIndexChange(index + 1);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      onIndexChange(index - 1);
    }
  };

  if (n === 0) return null;

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 3,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--line)',
        padding: '0.5rem 1rem 0.75rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
          Timeline
        </span>
        <span ref={labelRef} style={{ fontSize: 13, color: 'var(--accent)' }} />
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
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        style={{
          position: 'relative',
          height: expanded ? 56 : 30,
          transition: 'height 180ms ease',
          cursor: 'grab',
          touchAction: 'none',
          borderRadius: 8,
        }}
      >
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: 'var(--line)' }} />
        {eras.map((e, i) => {
          const active = i === index;
          return (
            <button
              key={e.slug}
              type="button"
              aria-label={e.album}
              onClick={() => onIndexChange(i)}
              style={{
                position: 'absolute',
                left: `${positionForEraIndex(n, i) * 100}%`,
                top: '50%',
                transform: 'translate(-50%,-50%)',
                width: active ? 12 : 8,
                height: active ? 12 : 8,
                borderRadius: 999,
                background: active ? 'var(--accent)' : 'var(--ink-soft)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                opacity: active ? 1 : 0.5,
              }}
            />
          );
        })}
        <div ref={thumbRef} aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 0, willChange: 'transform', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: -1, width: 2, background: 'var(--accent)' }} />
        </div>
      </div>
    </div>
  );
}
