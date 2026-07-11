'use client';

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';

/**
 * A self-contained pinch-zoom-and-pan viewer for the moment pill's gallery
 * images.
 *
 * Native browser zoom can't be used here: the pill locks body scroll with
 * `overflow: hidden`, which is fundamentally incompatible with the browser's
 * zoom-and-pan — once pinch-zoomed, the page can't be panned. So the gestures
 * are implemented directly with Pointer Events and applied as a CSS
 * `translate(...) scale(...)` transform scoped to just this container:
 *
 * - pinch with two pointers to zoom, anchored on the fingers' midpoint
 *   (scale clamped to 1×–4×)
 * - drag with one pointer to pan while zoomed (translate clamped so the
 *   image always covers its frame — it can't be dragged off-screen)
 * - double-tap / double-click to toggle between 1× and 2.5×
 * - ctrl/cmd + wheel (how trackpad pinches arrive) zooms on desktop
 *
 * At 1× the container's `touch-action` is `pan-y`, so a one-finger vertical
 * swipe starting on the image still scrolls the pill normally (and the
 * browser's own pinch/double-tap viewport zoom stays disabled). Only while
 * zoomed does the container claim every touch (`touch-action: none`) so
 * one-finger panning works. All state lives in this component, so closing
 * the pill (unmounting) resets everything back to 1× for free.
 */

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
/** Max ms between the two taps of a double-tap (measured up → up). */
const DOUBLE_TAP_MS = 300;
/** Max px apart the two taps may land and still count as a double-tap. */
const DOUBLE_TAP_SLOP = 30;
/** Past this much movement a touch is a drag, not a tap. */
const TAP_MOVE_SLOP = 12;
/** A press held longer than this is not a tap. */
const TAP_MAX_MS = 250;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function ZoomableImage({
  src,
  alt,
  unoptimized,
}: {
  src: string;
  alt: string;
  unoptimized?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Gesture state lives in refs and is written straight to the DOM —
  // pointermove fires at 60–120Hz and must not re-render React.
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  /** Container rect, captured at each gesture start (it can't move mid-gesture). */
  const rectRef = useRef<DOMRect | null>(null);
  /** Active pinch: starting distance/scale + the content-space anchor point. */
  const pinchRef = useRef<{
    startDist: number;
    startScale: number;
    originX: number;
    originY: number;
  } | null>(null);
  /** Active one-finger pan: pointer + translate at pan start. */
  const panRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  /** The in-flight touch, until it moves too far to be a tap. */
  const tapRef = useRef<{ x: number; y: number; t: number; moved: boolean } | null>(null);
  /** The previous completed tap, for double-tap detection. */
  const lastTapRef = useRef<{ x: number; y: number; t: number } | null>(null);

  const apply = useCallback((animate: boolean) => {
    const content = contentRef.current;
    const container = containerRef.current;
    if (!content || !container) return;
    // Animate only the double-tap jump; live gestures track the fingers 1:1.
    content.style.transition = animate ? 'transform 200ms ease-out' : 'none';
    content.style.transform = `translate3d(${translateRef.current.x}px, ${translateRef.current.y}px, 0) scale(${scaleRef.current})`;
    container.style.touchAction = scaleRef.current > 1 ? 'none' : 'pan-y';
    container.style.cursor = scaleRef.current > 1 ? 'grab' : 'zoom-in';
  }, []);

  const setTransform = useCallback(
    (scale: number, tx: number, ty: number, animate = false) => {
      const rect = rectRef.current ?? containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      scaleRef.current = scale;
      // The (object-cover) image exactly fills its frame at 1×, so at scale s
      // the valid translate range is [size·(1−s), 0] per axis — clamping to it
      // keeps the frame fully covered. At s = 1 the range collapses to 0,
      // which also recenters exactly when a pinch-out lands back at 1×.
      translateRef.current = {
        x: clamp(tx, rect.width * (1 - scale), 0),
        y: clamp(ty, rect.height * (1 - scale), 0),
      };
      apply(animate);
    },
    [apply],
  );

  const toggleZoom = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      rectRef.current = rect;
      if (scaleRef.current > 1) {
        setTransform(1, 0, 0, true);
      } else {
        // Zoom in around the tapped point: at 1× with no translate the content
        // point under the tap is the tap itself, so translate = p·(1−s) keeps
        // it stationary (before clamping near the edges).
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        setTransform(DOUBLE_TAP_SCALE, x * (1 - DOUBLE_TAP_SCALE), y * (1 - DOUBLE_TAP_SCALE), true);
      }
    },
    [setTransform],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    rectRef.current = container.getBoundingClientRect();
    container.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = Array.from(pointersRef.current.values());
    if (pts.length === 2) {
      // Second finger down → begin a pinch, anchored on the content point
      // under the fingers' midpoint so the image zooms around the fingers.
      tapRef.current = null;
      panRef.current = null;
      const rect = rectRef.current;
      const midX = (pts[0].x + pts[1].x) / 2 - rect.left;
      const midY = (pts[0].y + pts[1].y) / 2 - rect.top;
      pinchRef.current = {
        startDist: Math.max(Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y), 1),
        startScale: scaleRef.current,
        originX: (midX - translateRef.current.x) / scaleRef.current,
        originY: (midY - translateRef.current.y) / scaleRef.current,
      };
    } else if (pts.length === 1) {
      tapRef.current = { x: e.clientX, y: e.clientY, t: e.timeStamp, moved: false };
      // One finger while zoomed pans; at 1× there is nothing to pan (a
      // vertical swipe scrolls the pill natively via touch-action: pan-y).
      panRef.current =
        scaleRef.current > 1
          ? { x: e.clientX, y: e.clientY, tx: translateRef.current.x, ty: translateRef.current.y }
          : null;
    } else {
      // 3+ fingers: not a gesture we drive — stop tracking until they lift.
      pinchRef.current = null;
      panRef.current = null;
      tapRef.current = null;
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pointersRef.current.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX;
    p.y = e.clientY;
    const tap = tapRef.current;
    if (tap && !tap.moved && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > TAP_MOVE_SLOP) {
      tap.moved = true;
    }
    const pinch = pinchRef.current;
    if (pinch && pointersRef.current.size >= 2) {
      const rect = rectRef.current;
      if (!rect) return;
      const [a, b] = Array.from(pointersRef.current.values());
      const dist = Math.max(Math.hypot(b.x - a.x, b.y - a.y), 1);
      const scale = clamp(pinch.startScale * (dist / pinch.startDist), MIN_SCALE, MAX_SCALE);
      // Keep the anchored content point under the fingers' current midpoint:
      // rendered = translate + p·scale ⇒ translate = mid − origin·scale.
      const midX = (a.x + b.x) / 2 - rect.left;
      const midY = (a.y + b.y) / 2 - rect.top;
      setTransform(scale, midX - pinch.originX * scale, midY - pinch.originY * scale);
    } else if (panRef.current && pointersRef.current.size === 1) {
      const pan = panRef.current;
      setTransform(
        scaleRef.current,
        pan.tx + (e.clientX - pan.x),
        pan.ty + (e.clientY - pan.y),
      );
    }
  };

  /** Shared pointerup/pointercancel handler. */
  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.delete(e.pointerId)) return;
    const remaining = Array.from(pointersRef.current.values());
    if (remaining.length === 1) {
      // Pinch ended with one finger still down — hand off into a pan so the
      // image keeps tracking that finger without a jump.
      pinchRef.current = null;
      panRef.current =
        scaleRef.current > 1
          ? {
              x: remaining[0].x,
              y: remaining[0].y,
              tx: translateRef.current.x,
              ty: translateRef.current.y,
            }
          : null;
    } else if (remaining.length === 0) {
      pinchRef.current = null;
      panRef.current = null;
      const tap = tapRef.current;
      tapRef.current = null;
      // Double-tap (or double-click) toggles zoom. Only clean pointerups
      // count — a cancelled touch was claimed by the browser (e.g. a scroll).
      if (e.type === 'pointerup' && tap && !tap.moved && e.timeStamp - tap.t < TAP_MAX_MS) {
        const last = lastTapRef.current;
        if (
          last &&
          e.timeStamp - last.t < DOUBLE_TAP_MS &&
          Math.hypot(e.clientX - last.x, e.clientY - last.y) < DOUBLE_TAP_SLOP
        ) {
          lastTapRef.current = null;
          toggleZoom(e.clientX, e.clientY);
        } else {
          lastTapRef.current = { x: e.clientX, y: e.clientY, t: e.timeStamp };
        }
      }
    }
  };

  // Desktop trackpad pinches arrive as ctrl+wheel (cmd+wheel on some setups).
  // Registered manually so the listener can be non-passive — preventDefault
  // must stop the browser's page zoom. Plain wheel scrolling passes through.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      rectRef.current = rect;
      const scale = clamp(scaleRef.current * Math.exp(-e.deltaY * 0.01), MIN_SCALE, MAX_SCALE);
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Anchor on the content point under the cursor (same math as pinch).
      const originX = (x - translateRef.current.x) / scaleRef.current;
      const originY = (y - translateRef.current.y) / scaleRef.current;
      setTransform(scale, x - originX * scale, y - originY * scale);
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [setTransform]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] select-none overflow-hidden"
      style={{ touchAction: 'pan-y', cursor: 'zoom-in' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <div
        ref={contentRef}
        className="absolute inset-0 will-change-transform"
        style={{ transformOrigin: '0 0' }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized={unoptimized}
          draggable={false}
          className="object-cover"
        />
      </div>
    </div>
  );
}
