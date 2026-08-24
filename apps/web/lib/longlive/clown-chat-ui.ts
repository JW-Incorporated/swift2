'use client';

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * Split out of ClownChat.tsx to keep that file under the 300-line cap (see
 * MAP.md) — two small DOM-measuring hooks for the composer and the message
 * stream, neither of which needs to know anything about clownbot itself.
 */

/** ~5 lines on this phone-sized composer (15px/leading-relaxed text, py-2
 * padding) — well short of ChatGPT's 11-line cap, which reads too tall for
 * this panel; beyond it the box scrolls internally instead of growing. Also
 * hardcoded as ClownChatComposer.tsx's textarea `max-h-[136px]` (a CSS
 * backstop) — Tailwind needs that literal at build time, so the two can't
 * share one source of truth; keep them in sync by hand. */
export const MAX_TEXTAREA_HEIGHT_PX = 136;

/** Auto-scroll only fires when the reader is already within this many px of
 * the bottom — otherwise a deliberate scroll-up to reread history mid-stream
 * would get yanked back down on every new chunk. */
export const AUTO_SCROLL_THRESHOLD_PX = 96;

/**
 * Auto-grows a textarea to fit its content, capped at MAX_TEXTAREA_HEIGHT_PX
 * — beyond that it scrolls internally instead of growing further.
 * `useLayoutEffect` so the resize lands before paint.
 */
export function useAutoResizeTextarea(ref: RefObject<HTMLTextAreaElement | null>, value: string): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT_PX);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT_PX ? 'auto' : 'hidden';
  }, [ref, value]);
}

/**
 * Keeps a scrollable container pinned to its bottom whenever `deps` change —
 * a new message, a streamed step, an error — but only while the reader was
 * already near the bottom (tracked via a scroll listener), so a deliberate
 * scroll-up to reread history is never yanked back down mid-stream. `deps`
 * must be the same length on every render (an array literal at the call
 * site satisfies that).
 */
export function useStickToBottomScroll(containerRef: RefObject<HTMLElement | null>, deps: readonly unknown[]): void {
  const nearBottomRef = useRef(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < AUTO_SCROLL_THRESHOLD_PX;
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [containerRef]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || !nearBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
