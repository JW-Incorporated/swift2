'use client';

import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getEra } from '@/lib/longlive/eras';
import { contentForEra, milestonesForEra } from '@/lib/longlive/content';
import { truncate } from '@/lib/longlive/format';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { measureChromeHeight } from '@/lib/longlive/chrome-offset';
import { cn } from '@/lib/utils';
import {
  SCRUBBER_ANCHOR_CLASS,
  SCRUBBER_CENTER_MEDIA_QUERY,
  SCRUBBER_RAIL_CLASS,
  SCRUBBER_RAIL_CLIP_PATH,
  SCRUBBER_SCRIM_CLASS,
  SCRUBBER_SHELL_CLASS,
  roundRailPct,
  scrubberAnchorPaddingTop,
  scrubberPillTransform,
  scrubberRailMaxHeight,
  scrubberTooltipTransform,
  snapNow,
  nearestAnchorExact,
  labelForDate,
  type ScrubberAnchor,
} from './timelineScrubberLayout';

/** Reference line for "what am I reading" — chrome (measureChromeHeight) +
 *  a bit into the viewport. */
const REF_RATIO = 0.3;
/** Horizontal distance (px) of the rail line from the viewport's right edge. */
const RAIL_RIGHT = 16;
/** Ridge SVG width (px); shrinks with the rail footprint. */
const RIDGE_WIDTH = 28;
/** Density curve resolution. */
const SAMPLES = 72;

type Anchor = ScrubberAnchor;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function fmtMonth(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function TimelineScrubber() {
  const { eraId } = useAppState();
  const { setScrubbing } = useAppActions();
  const era = getEra(eraId);

  const start = useMemo(() => new Date(era.start).getTime(), [era.start]);
  // The current era's authored end date can sit in the future (a season/
  // year boundary); the rail's top means "now", so don't let the scrubber
  // span into dates that haven't happened yet. snapNow (not raw Date.now())
  // so the SSR render and the client hydration render — which each call
  // Date.now() independently — compute the exact same bound as long as
  // they land in the same 5-minute window (finding #3, 2026-08-14).
  const end = useMemo(() => {
    const authoredEnd = new Date(era.end).getTime();
    return era.isCurrent ? Math.min(authoredEnd, snapNow(Date.now())) : authoredEnd;
  }, [era.end, era.isCurrent]);
  const span = Math.max(1, end - start);

  const items = useMemo(() => contentForEra(eraId), [eraId]);
  const milestones = useMemo(() => milestonesForEra(eraId), [eraId]);

  // Smoothed activity density (Gaussian kernel over item dates). This stays
  // date-based (it's describing *when* things happened), but is drawn against
  // the anchor-based (rendered-position) axis below so its bulges line up
  // with where the ticks actually sit on the rail.
  const density = useMemo(() => {
    const dates = items.map((i) => new Date(i.date).getTime());
    const bandwidth = span / 9;
    const raw = Array.from({ length: SAMPLES }, (_, s) => {
      // s=0 is the top of the ridge, which now represents the newest date.
      const t = end - (s / (SAMPLES - 1)) * span;
      let sum = 0;
      for (const d of dates) {
        const x = (t - d) / bandwidth;
        sum += Math.exp(-0.5 * x * x);
      }
      return sum;
    });
    const max = Math.max(...raw, 1e-6);
    return raw.map((v) => v / max);
  }, [items, span, end]);

  const railRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLSpanElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const anchorsRef = useRef<Anchor[]>([]);
  // Subset of anchorsRef with `exact: true` — the DATE curve (dateForTop
  // below) interpolates over this, never the full anchor set. Positioning
  // (topForDate, pctForDate, ticks/milestones/ridge) still needs every
  // anchor, synthetic included, so a card's rendered spot on the rail stays
  // correct; but a synthetic anchor's fabricated date must never bend what
  // the pill/aria-valuetext read back for a nearby REAL position (adversarial
  // review finding #3, 2026-08-13 — 42 (era, filter) combos showed a month no
  // real content occupies). Excluding it from this list, rather than gating
  // display on adjacent-pair exactness, is also what fixes finding #4: the
  // interpolated date is always drawn from real anchors, so it is always
  // honest and never needs suppressing to "Date unknown".
  const exactAnchorsRef = useRef<Anchor[]>([]);
  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  /** Last time we committed a React state update while dragging (ms, Date.now()). */
  const lastCommitRef = useRef(0);
  /** No React setState per pointer-move: position the handle via direct DOM
   * writes on every frame, and only commit React state (which drives the
   * date-label text) at this throttled interval, per the 60fps scrubber rule. */
  const DRAG_COMMIT_INTERVAL_MS = 120;

  const [currentDate, setCurrentDate] = useState<number | null>(null);
  // The handle's committed rail position. Set directly from the drag's own
  // position math — NEVER recomputed from currentDate via pctForDate, which
  // would re-introduce the position→date→position snapping (dates are
  // month-granularity; many anchors share one date) on every throttled
  // render during a drag, i.e. a periodic snap-back mid-gesture.
  const [currentPct, setCurrentPct] = useState<number | null>(null);
  const [hoverDate, setHoverDate] = useState<number | null>(null);
  // Same reasoning as currentPct: set directly from position, not derived
  // from hoverDate via pctForDate.
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  const [active, setActive] = useState(false); // hovering or dragging
  const [nowPct, setNowPct] = useState<number | null>(null);
  // Bumped after every measure() so date->position lookups (ticks, milestones,
  // ridge, ...) — which read the anchors ref directly during render — repaint
  // once real layout is known, instead of staying pinned to the pre-measure
  // calendar-linear fallback.
  const [anchorsVersion, setAnchorsVersion] = useState(0);
  // Extra top padding for SCRUBBER_ANCHOR_CLASS beyond its own `pt-20`, so the
  // rail (and its always-visible date pill) clears the live sticky chrome
  // instead of overlapping the filter row — see scrubberAnchorPaddingTop's
  // doc comment (adversarial review finding #2, 2026-08-14).
  const [anchorPaddingTop, setAnchorPaddingTop] = useState<number | undefined>(undefined);
  // Caps the rail's own rendered height so it can't run past the viewport
  // when anchorPaddingTop is clamped to a live chrome height taller than the
  // CSS cap's baked-in assumption — see scrubberRailMaxHeight's doc comment
  // (re-review finding #2, 2026-08-14 round 2).
  const [railMaxHeight, setRailMaxHeight] = useState<number | undefined>(undefined);

  // Calendar-linear fallback, used only before the DOM has been measured
  // (first paint) so ticks/milestones have *something* sane to render.
  const pctForDateLinear = useCallback(
    (ms: number) => clamp01((end - ms) / span) * 100,
    [end, span],
  );

  // Measure the on-screen content items (document coordinates + their dates).
  // Scoped to the active era — once the infinite stream has appended
  // neighboring eras, an unscoped query would pull in their anchors too and
  // let scrollToDate jump out of the era this scrubber is supposed to cover.
  // EraSection also renders a zero-size end-of-content sentinel
  // (data-ll-item={`${eraId}__end`}) after its videos/threads blocks, dated
  // at the era's start — that becomes this array's last (bottom-most) entry,
  // so the rail's 100% position resolves to the true end of the era's
  // rendered content, not just the last moment card.
  const measure = useCallback(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-ll-item][data-ll-era="${eraId}"]`),
    );
    anchorsRef.current = els
      .map((el) => ({
        date: Number(el.dataset.llDate),
        top: el.getBoundingClientRect().top + window.scrollY,
        // Missing attribute defaults to exact — every card that can carry a
        // synthetic date sets `data-ll-exact="0"` explicitly (VideoMomentCard,
        // DoorwayCard); everything else (moments, the end-of-era sentinel) has
        // an authored date and never opts out.
        exact: el.dataset.llExact !== '0',
      }))
      // A doorway `spaceDoorways` displaced omits `data-ll-date` entirely
      // (DoorwayCard, adversarial review finding #2, 2026-08-13) — its
      // rendered position no longer matches its date, so it must not be a
      // rail anchor at all, not just a non-exact one.
      .filter((a) => Number.isFinite(a.date))
      .sort((a, b) => a.top - b.top);
    exactAnchorsRef.current = anchorsRef.current.filter((a) => a.exact);
    setAnchorsVersion((v) => v + 1);
  }, [eraId]);

  // Date -> document-Y, by interpolating across the measured anchors.
  // Anchors are ordered by vertical position; dates descend as you go down
  // the page (newest at the top), so interpolate for that direction.
  const topForDate = useCallback((target: number): number => {
    const a = anchorsRef.current;
    if (!a.length) return 0;
    if (target >= a[0].date) return a[0].top;
    const last = a[a.length - 1];
    if (target <= last.date) return last.top;
    for (let i = 0; i < a.length - 1; i++) {
      if (target <= a[i].date && target > a[i + 1].date) {
        const f = (a[i].date - target) / Math.max(1, a[i].date - a[i + 1].date);
        return a[i].top + f * (a[i + 1].top - a[i].top);
      }
    }
    return last.top;
  }, []);

  // Document-Y -> date (inverse of the above); used both to sync the pill
  // label while free-scrolling and to read back a date from an arbitrary
  // rail position. Interpolates over EXACT anchors only (adversarial review
  // finding #3, 2026-08-13) — see exactAnchorsRef's doc comment above.
  const dateForTop = useCallback(
    (top: number): number => {
      const a = exactAnchorsRef.current;
      if (!a.length) return end;
      if (top <= a[0].top) return a[0].date;
      const last = a[a.length - 1];
      if (top >= last.top) return last.date;
      for (let i = 0; i < a.length - 1; i++) {
        if (top >= a[i].top && top < a[i + 1].top) {
          const f = (top - a[i].top) / Math.max(1, a[i + 1].top - a[i].top);
          return a[i].date + f * (a[i + 1].date - a[i].date);
        }
      }
      return last.date;
    },
    [end],
  );

  // Whether a resolved date (from dateForTop/fromPointer above) may be shown
  // or announced — see timelineScrubberLayout.ts's "Anchor honesty" section
  // for the full rationale (adversarial review finding #1, 2026-08-13).
  // Checked against the same exact-only anchor set dateForTop interpolates
  // over (finding #3/#4, 2026-08-13): once the resolved date can only ever
  // come from a real anchor, the nearest anchor to it is always real too, so
  // this never falsely suppresses a genuinely honest date the way checking
  // it against the full (real + synthetic) set could — including the exact
  // debut-era-start tie finding #4 named (a clamped doorway sharing a real
  // moment's date used to lose that tie and read "Date unknown").
  const exactForDate = useCallback(
    (target: number): boolean => nearestAnchorExact(exactAnchorsRef.current, target),
    [],
  );

  // Rail position (0..100) is linear in *rendered position*, not calendar
  // date: equal drag distance covers equal scroll distance. A pure
  // date-linear rail feels "wrong"/non-linear whenever content is bursty
  // (dense weeks next to quiet months) — the handle crawls through busy
  // stretches and rockets through quiet ones relative to what's on screen.
  // Anchoring the axis to measured DOM position instead makes the rail
  // behave like a real scrollbar for this era's content, and — combined with
  // the end-of-content sentinel above — guarantees 100% is the true bottom.
  const pctForTop = useCallback((top: number): number => {
    const a = anchorsRef.current;
    if (a.length < 2) return 0;
    const railSpan = Math.max(1, a[a.length - 1].top - a[0].top);
    return clamp01((top - a[0].top) / railSpan) * 100;
  }, []);

  const topForPct = useCallback((pct: number): number => {
    const a = anchorsRef.current;
    if (a.length < 2) return 0;
    const railSpan = a[a.length - 1].top - a[0].top;
    return a[0].top + (pct / 100) * railSpan;
  }, []);

  // Date -> rail position. Before the DOM has been measured, fall back to
  // the calendar-linear formula so first paint has something sane; once
  // anchors are known, position is linear in rendered content, not date.
  // Rounded via roundRailPct — the single place this percentage is produced
  // — so a server vs. client render pass can't disagree past four decimals
  // and mismatch on hydration (finding #3, 2026-08-14).
  const pctForDate = useCallback(
    (ms: number): number => {
      const raw = anchorsRef.current.length < 2 ? pctForDateLinear(ms) : pctForTop(topForDate(ms));
      return roundRailPct(raw);
    },
    [pctForDateLinear, pctForTop, topForDate],
  );

  // Ridge path in a 0..100 × 0..1000 viewBox, stretched to the rail with
  // preserveAspectRatio="none". x=100 is the rail; smaller x bulges leftward.
  // Sampled at even calendar steps (that's what "density" means) but each
  // sample is placed at its anchor-based rail position so the bulge lines up
  // with the (now position-linear) ticks.
  const ridgePath = useMemo(() => {
    const pts = density.map((v, s) => {
      const t = end - (s / (SAMPLES - 1)) * span;
      const y = clamp01(pctForDate(t) / 100) * 1000;
      const x = 100 - v * 100;
      return `${x.toFixed(2)} ${y.toFixed(2)}`;
    });
    return `M 100 0 L ${pts.join(' L ')} L 100 1000 Z`;
  }, [density, end, span, pctForDate]);

  // Feed scroll → current reading position + date. Position comes straight
  // from the scroll offset (never via date), same reasoning as fromPointer.
  const fromScroll = useCallback((): { pct: number; date: number } | null => {
    if (!anchorsRef.current.length) return null;
    const ref = window.scrollY + measureChromeHeight() + window.innerHeight * REF_RATIO;
    return { pct: pctForTop(ref), date: dateForTop(ref) };
  }, [pctForTop, dateForTop]);

  // Scrolls the feed so document-Y `y` lands at the reading reference line.
  const scrollToY = useCallback((y: number) => {
    const offset = measureChromeHeight() + window.innerHeight * REF_RATIO;
    window.scrollTo({ top: y - offset, behavior: draggingRef.current ? 'auto' : 'smooth' });
  }, []);

  // Target date → feed scroll position (inverse of the above). Only for
  // date-space callers (keyboard step nav) — pointer-drag must NOT round-trip
  // through this: dates are month-granularity, so many anchors share one
  // date, and topForDate collapses them all to the same handful of Y
  // positions, snapping the scroll to the wrong spot for most drag positions.
  // See yFromPointer below for the drag path, which stays in position-space.
  const scrollToDate = useCallback(
    (target: number) => {
      if (!anchorsRef.current.length) return;
      scrollToY(topForDate(target));
    },
    [topForDate, scrollToY],
  );

  const syncFromScroll = useCallback(() => {
    if (draggingRef.current) return;
    const r = fromScroll();
    if (r) {
      setCurrentDate(r.date);
      setCurrentPct(r.pct);
    }
  }, [fromScroll]);

  // Wire up measurement + scroll listeners; re-measure on era/filter/layout change.
  useEffect(() => {
    measure();
    syncFromScroll();
    setNowPct(() => {
      const now = Date.now();
      return now >= start && now <= end ? pctForDate(now) : null;
    });

    const mq = window.matchMedia(SCRUBBER_CENTER_MEDIA_QUERY);
    const recomputeAnchorPadding = () => {
      const paddingTop = scrubberAnchorPaddingTop({
        chromeHeight: measureChromeHeight(),
        isCentered: mq.matches,
      });
      setAnchorPaddingTop(paddingTop);
      setRailMaxHeight(scrubberRailMaxHeight({ paddingTop, viewportHeight: window.innerHeight }));
    };
    recomputeAnchorPadding();

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(syncFromScroll);
    };
    const onResize = () => {
      measure();
      syncFromScroll();
      recomputeAnchorPadding();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    mq.addEventListener('change', recomputeAnchorPadding);

    // Catch layout changes from filtering, image loads, era swaps — also the
    // FilterBar row height changing, which is what the padding above clamps
    // the rail below.
    const ro = new ResizeObserver(() => {
      measure();
      syncFromScroll();
      recomputeAnchorPadding();
    });
    ro.observe(document.body);
    // A follow-up measure after paint settles (fonts/images).
    const t = window.setTimeout(() => {
      measure();
      syncFromScroll();
      recomputeAnchorPadding();
    }, 300);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      mq.removeEventListener('change', recomputeAnchorPadding);
      ro.disconnect();
      window.clearTimeout(t);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eraId, measure, syncFromScroll, start, end]);

  // Finger/pointer Y → { y: document-Y, pct, date }, computed in POSITION
  // space throughout (never round-tripping through date and back — dates are
  // month-granularity, so many anchors share one date, and converting
  // position→date→position again collapses the drag to whichever anchor
  // happens to share that date, snapping the scroll to the wrong spot for
  // most of the rail). `date` here is derived from the already-resolved `y`,
  // purely for display (the pill label) — it's never used to re-derive a
  // position.
  const fromPointer = useCallback(
    (clientY: number): { y: number; pct: number; date: number } => {
      const rect = railRef.current?.getBoundingClientRect();
      const f = clamp01(rect ? (clientY - rect.top) / rect.height : 0);
      if (anchorsRef.current.length < 2) {
        // Pre-measure fallback (calendar-linear); matches pctForDate's fallback.
        const date = end - f * span;
        return { y: 0, pct: clamp01((end - date) / span) * 100, date };
      }
      const pct = f * 100;
      const y = topForPct(pct);
      return { y, pct, date: dateForTop(y) };
    },
    [end, span, topForPct, dateForTop],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      setActive(true);
      // Tell EraStream to hold the active era steady for the duration of the
      // drag — otherwise the drag's own auto-scroll can cross into the next
      // era's viewport-center, flipping the active era (and this scrubber's
      // whole per-era anchor set) out from under the still-active gesture.
      setScrubbing(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const { y, pct, date } = fromPointer(e.clientY);
      setCurrentDate(date);
      setCurrentPct(pct);
      if (anchorsRef.current.length >= 2) scrollToY(y);
      else scrollToDate(date);
    },
    [fromPointer, scrollToY, scrollToDate, setScrubbing],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const { y, pct, date } = fromPointer(e.clientY);
      const dragging = draggingRef.current;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        // Position the handle/pill imperatively every frame (no React
        // render on the hot path); only commit React state — which drives
        // the date-label text — on a throttled cadence.
        if (dragging) {
          if (handleRef.current) handleRef.current.style.top = `${pct}%`;
          if (pillRef.current) {
            pillRef.current.style.top = `${pct}%`;
            pillRef.current.style.transform = scrubberPillTransform(pct);
          }
          if (anchorsRef.current.length >= 2) scrollToY(y);
          else scrollToDate(date);
        }
        const now = Date.now();
        if (!dragging || now - lastCommitRef.current >= DRAG_COMMIT_INTERVAL_MS) {
          lastCommitRef.current = now;
          setHoverDate(date);
          setHoverPct(pct);
          if (dragging) {
            setCurrentDate(date);
            setCurrentPct(pct);
          }
        }
      });
    },
    [fromPointer, scrollToY, scrollToDate],
  );

  const endDrag = useCallback(
    (e: React.PointerEvent) => {
      if (draggingRef.current) {
        draggingRef.current = false;
        // The drag-time commit is throttled, so the last few frames of
        // motion may only exist in the DOM refs — commit the true final
        // position to React state now.
        const { pct, date } = fromPointer(e.clientY);
        setCurrentDate(date);
        setCurrentPct(pct);
        setHoverDate(date);
        setHoverPct(pct);
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          /* no-op */
        }
        setScrubbing(false);
        // EraStream's active-era detection was held while dragging (see
        // onPointerDown) and only re-runs on a real scroll event; dragging
        // may have ended without one firing since the last auto-scroll, so
        // force one resync now that it's safe to re-anchor.
        window.dispatchEvent(new Event('scroll'));
      }
    },
    [fromPointer, setScrubbing],
  );

  const pillDate = draggingRef.current && hoverDate != null ? hoverDate : currentDate;
  const nearestItem = useMemo(() => {
    if (hoverDate == null || !items.length) return null;
    let best = items[0];
    let bestDist = Infinity;
    for (const it of items) {
      const dist = Math.abs(new Date(it.date).getTime() - hoverDate);
      if (dist < bestDist) {
        bestDist = dist;
        best = it;
      }
    }
    return best;
  }, [hoverDate, items]);
  const showTooltip = active && !draggingRef.current && hoverPct != null && nearestItem != null;

  // Referencing anchorsVersion keeps these renders in sync with measure()
  // without changing any of the pure pct-lookup functions above.
  void anchorsVersion;

  return (
    <div className={SCRUBBER_SHELL_CLASS}>
      {/* Legibility scrim — lives on the dynamic-viewport shell, not the
          svh anchor, so the gradient covers the whole visible height even
          while the mobile URL bar is collapsed. */}
      <div
        aria-hidden
        className={SCRUBBER_SCRIM_CLASS}
        style={{
          background:
            'linear-gradient(to left, color-mix(in srgb, var(--era-bg) 78%, transparent), transparent)',
        }}
      />

      <div
        className={SCRUBBER_ANCHOR_CLASS}
        style={anchorPaddingTop != null ? { paddingTop: anchorPaddingTop } : undefined}
      >
        {/* What the removed first-run popup used to say, kept as a description
            on the control itself instead of an interstitial: assistive tech
            announces it, and sighted users are taught the same thing without an
            interaction by the hover/drag pill (date + nearest moment) that this
            rail already shows the instant you touch it. */}
        <span id={`ll-scrubber-desc-${era.id}`} className="sr-only">
          Drag to scrub through {era.name}. The ridge bulges where the most happened.
        </span>

        <div
          ref={railRef}
          role="slider"
          tabIndex={0}
          aria-label={`${era.name} timeline scrubber`}
          aria-describedby={`ll-scrubber-desc-${era.id}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(currentPct ?? 0)}
          aria-valuetext={
            pillDate != null ? labelForDate(fmtMonth(pillDate), exactForDate(pillDate)) : undefined
          }
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerEnter={() => setActive(true)}
          onPointerLeave={() => {
            if (!draggingRef.current) setActive(false);
            setHoverDate(null);
            setHoverPct(null);
          }}
          onKeyDown={(e) => {
            if (currentDate == null) return;
            const step = span / 24;
            // Top of the rail = newest, so ArrowUp moves toward `end`. Discrete
            // date-stepping (not a continuous drag), so deriving pct from date
            // here is fine — no gesture to snap out from under.
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              const d = Math.min(end, currentDate + step);
              setCurrentDate(d);
              setCurrentPct(pctForDate(d));
              scrollToDate(d);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              const d = Math.max(start, currentDate - step);
              setCurrentDate(d);
              setCurrentPct(pctForDate(d));
              scrollToDate(d);
            }
          }}
          className={SCRUBBER_RAIL_CLASS}
          style={
            anchorPaddingTop != null
              ? { clipPath: SCRUBBER_RAIL_CLIP_PATH, maxHeight: railMaxHeight }
              : undefined
          }
        >
          {/* Activity ridge */}
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-y-0"
            style={{ right: RAIL_RIGHT, width: RIDGE_WIDTH, height: '100%' }}
            viewBox="0 0 100 1000"
            preserveAspectRatio="none"
          >
            <path
              d={ridgePath}
              fill="var(--era-accent)"
              fillOpacity={active ? 0.28 : 0.18}
              stroke="var(--era-accent)"
              strokeOpacity={0.55}
              strokeWidth={1.25}
              vectorEffect="non-scaling-stroke"
              style={{ transition: 'fill-opacity 200ms ease' }}
            />
          </svg>

          {/* Rail line */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-px"
            style={{ right: RAIL_RIGHT, background: 'var(--era-line)' }}
          />

          {/* Era start / end year labels */}
          <span
            className={cn(
              'pointer-events-none absolute -top-1 text-[10px] font-medium leading-none uppercase tracking-wider text-[color:var(--era-ink-soft)] transition-opacity',
              active ? 'opacity-100' : 'opacity-0',
            )}
            style={{ right: RAIL_RIGHT + 14, transform: 'translateY(-50%)' }}
          >
            {era.isCurrent ? 'now' : new Date(end).getFullYear()}
          </span>
          <span
            className={cn(
              'pointer-events-none absolute text-[10px] font-medium leading-none uppercase tracking-wider text-[color:var(--era-ink-soft)] transition-opacity',
              active ? 'opacity-100' : 'opacity-0',
            )}
            style={{ right: RAIL_RIGHT + 14, bottom: -4, transform: 'translateY(50%)' }}
          >
            {new Date(start).getFullYear()}
          </span>

          {/* Item ticks */}
          {items.map((it) => {
            const pct = pctForDate(new Date(it.date).getTime());
            return (
              <span
                key={it.id}
                aria-hidden
                className="pointer-events-none absolute rounded-full"
                style={{
                  right: RAIL_RIGHT,
                  top: `${pct}%`,
                  height: 3,
                  width: 3,
                  transform: 'translate(50%, -50%)',
                  background: 'var(--era-ink)',
                  opacity: 0.35,
                }}
              />
            );
          })}

          {/* Milestone markers */}
          {milestones.map((m) => {
            const pct = pctForDate(new Date(m.date).getTime());
            return (
              <div key={m.id} aria-hidden>
                <span
                  className="pointer-events-none absolute rounded-full ring-2"
                  style={{
                    right: RAIL_RIGHT,
                    top: `${pct}%`,
                    height: 8,
                    width: 8,
                    transform: 'translate(50%, -50%)',
                    background: 'var(--era-accent)',
                    // ring color via boxShadow to inherit bg
                    boxShadow: '0 0 0 2px var(--era-bg)',
                  }}
                />
                <span
                  className={cn(
                    'pointer-events-none absolute max-w-28 text-right text-[10px] leading-tight text-[color:var(--era-ink-soft)] transition-opacity',
                    active ? 'opacity-100' : 'opacity-0',
                  )}
                  style={{ right: RAIL_RIGHT + 14, top: `${pct}%`, transform: 'translateY(-50%)' }}
                >
                  {m.label}
                </span>
              </div>
            );
          })}

          {/* "Now" tick for the current era */}
          {nowPct != null && (
            <span
              aria-hidden
              className="pointer-events-none absolute h-3 w-3 -translate-y-1/2 translate-x-1/2 rotate-45 border border-[color:var(--era-bg)]"
              style={{ right: RAIL_RIGHT, top: `${nowPct}%`, background: 'var(--era-ink)' }}
              title="Now"
            />
          )}

          {/* Handle + date pill */}
          {currentPct != null && (
            <>
              <span
                ref={handleRef}
                className="pointer-events-none absolute rounded-full border-2 transition-transform"
                style={{
                  right: RAIL_RIGHT,
                  top: `${currentPct}%`,
                  height: active ? 18 : 14,
                  width: active ? 18 : 14,
                  transform: 'translate(50%, -50%)',
                  background: 'var(--era-accent)',
                  borderColor: 'var(--era-bg)',
                  boxShadow: '0 2px 10px -2px var(--era-glow)',
                }}
              />
              {pillDate != null && (
                <span
                  ref={pillRef}
                  className={cn(
                    'pointer-events-none absolute whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none tabular-nums shadow-sm transition-opacity',
                    active ? 'opacity-100' : 'opacity-90',
                  )}
                  style={{
                    right: RAIL_RIGHT + 16,
                    top: `${currentPct}%`,
                    transform: scrubberPillTransform(currentPct),
                    background: 'var(--era-surface)',
                    borderColor: 'var(--era-line)',
                    color: 'var(--era-ink)',
                  }}
                >
                  {labelForDate(fmtMonth(pillDate), exactForDate(pillDate))}
                </span>
              )}
            </>
          )}

          {/* Hover preview: nearest content item */}
          {showTooltip && nearestItem && hoverPct != null && (
            <>
              <span
                aria-hidden
                className="pointer-events-none absolute h-2 w-2 rounded-full"
                style={{
                  right: RAIL_RIGHT,
                  top: `${hoverPct}%`,
                  transform: 'translate(50%, -50%)',
                  background: 'var(--era-ink)',
                  opacity: 0.5,
                }}
              />
              <div
                className="pointer-events-none absolute z-10 w-48 rounded-lg border p-2.5 shadow-lg"
                style={{
                  right: RAIL_RIGHT + 18,
                  top: `${hoverPct}%`,
                  transform: scrubberTooltipTransform(hoverPct),
                  background: 'var(--era-surface-2)',
                  borderColor: 'var(--era-line)',
                }}
              >
                <div
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--era-accent)' }}
                >
                  {nearestItem.dateLabel}
                </div>
                <div className="mt-0.5 text-[12px] font-medium leading-snug text-[color:var(--era-ink)]">
                  {nearestItem.title}
                </div>
                {nearestItem.summary && (
                  <p className="mt-1 text-[11px] leading-snug text-[color:var(--era-ink-soft)]">
                    {truncate(nearestItem.summary, 140)}
                  </p>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
