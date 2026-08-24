'use client';

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { ERAS, erasBackFrom, isFirstEra, getEra, jumpWindow, CURRENT_ERA_ID } from '@/lib/longlive/eras';
import { eraStyle } from '@/lib/longlive/theme';
import type { Era } from '@/lib/longlive/types';
import { EraSection } from './EraSection';
import { FilterBar } from './FilterBar';
import { LandingMasthead } from './LandingMasthead';
import { filterChangeScrollDelta } from '@/lib/longlive/era-stream-pin';
import { measureChromeHeight } from '@/lib/longlive/chrome-offset';
import { jumpLandingScrollTop, shouldRunEraJump } from '@/lib/longlive/era-jump-landing';
import { useCurrentItems } from '@/lib/longlive/use-current-items';

/**
 * Jump-scroll timing. SETTLE is how long we keep re-correcting AFTER first
 * landing on the target (absorbing layout shift as images load in above it).
 * MAX is the hard ceiling on the whole attempt, so a jump whose target never
 * renders can't leave timers running forever. MAX is generous because it is
 * a *ceiling*, not a delay: on a fast device the whole thing is done in a
 * frame, and any user gesture stops it immediately.
 */
const JUMP_SCROLL_SETTLE_MS = 1500;
const JUMP_SCROLL_MAX_MS = 8000;

/**
 * The infinite era stream. You enter at an anchor era (the current era, or one
 * picked from the selector) and scroll *back* in time: older eras append below,
 * colors morph across gradient transition bands, and the era occupying the
 * viewport center becomes "active" (driving the top bar, scrubber, and page
 * theme). Scrolling past Debut lands on the origin end-cap.
 */
export function EraStream() {
  const { eraId, eraJumpSeq, scrubbing, filters } = useAppState();
  // Read the live scrubbing flag without making it an effect dependency —
  // toggling it shouldn't tear down/rebuild the scroll listener, it should
  // just change what a single already-running listener does on its next call.
  const scrubbingRef = useRef(scrubbing);
  scrubbingRef.current = scrubbing;
  const { setActiveEra, saveEraScroll, getEraScroll, setMode } = useAppActions();
  // PLAN.md Stage 5: the current era's live current_item rows, fetched once
  // here (not per EraSection) so the masthead's "Updated Nh ago" line and
  // the current era's feed entries read the exact same fetch.
  const currentItems = useCurrentItems(CURRENT_ERA_ID);

  // If the user is returning to era mode via a plain toggle, a saved snapshot
  // tells us where they were. Read it once at first render so the stream mounts
  // pre-anchored (and with the same older eras appended) — no top-then-jump flash.
  const restoreRef = useRef(getEraScroll());
  const restore = restoreRef.current;

  // With no snapshot, this mount may itself be an explicit jump: switching
  // into era mode from elsewhere (openEra) bumps eraJumpSeq in the same
  // action that first mounts this component — the jump effect below can't
  // see that bump as a change (#747). Seed the window the way the jump would
  // have, so newer eras exist above the picked one from the first paint.
  const initialWindow = restore ?? jumpWindow(eraId);
  const [anchorId, setAnchorId] = useState(initialWindow.anchorId);
  const [count, setCount] = useState(initialWindow.count);

  // Read the live active era without making it an effect dependency (scroll
  // updates it constantly; only an explicit *jump* should re-anchor the stream).
  const eraIdRef = useRef(eraId);
  eraIdRef.current = eraId;

  // Keep live anchor/count so the scroll handler can persist them continuously.
  const anchorRef = useRef(anchorId);
  anchorRef.current = anchorId;
  const countRef = useRef(count);
  countRef.current = count;

  // On mount: restore the saved scroll spot, or start at the top on a fresh
  // entry / explicit jump. Runs once. A double rAF lets the appended eras lay
  // out before we scroll so the offset lands on the right content. We do NOT
  // clear the snapshot here — the store clears it on explicit jumps, so a stale
  // one never survives — which keeps this immune to effect-ordering/StrictMode
  // remount quirks (the snapshot is rebuilt continuously by the scroll handler).
  useEffect(() => {
    if (restore) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => window.scrollTo({ top: restore.scrollY, behavior: 'auto' })),
      );
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-anchor + jump to the chosen era whenever the user explicitly jumps.
  // Keyed off the *value* of eraJumpSeq (not "has mounted") so StrictMode's
  // double-invoke of this effect can't re-trigger a jump that would clobber a
  // scroll restore. When there's no snapshot to protect, the mount itself may
  // BE the jump (#747: openEra bumps eraJumpSeq in the same action that
  // mounts the stream, so the pre-seeded ref would swallow
  // the bump) — re-anchoring to the same target is idempotent, so the
  // mount-time run (and StrictMode's double-invoke of it, which cancels the
  // first run's scroll correction) is safe to let through — EXCEPT the plain
  // front-door mount (no restore, eraJumpSeq still its initial 0), which
  // looks identical to a no-snapshot openEra mount but must NOT jump: the
  // masthead sits above the current era's section, and jumping the section
  // to the chrome scrolls straight past it — the reader never sees it
  // (adversarial review finding #1, 2026-08-14). shouldRunEraJump
  // (era-jump-landing.ts) carries the gate so it's covered without mounting
  // React.
  //
  // The stream always anchors at the newest (current) era and extends back
  // just far enough to include the chosen era (see jumpWindow) — anchoring AT
  // the chosen era would strand the user with no way to scroll back up toward
  // more recent eras (the stream only ever grows *older* going down), which
  // was the reported "can't scroll forward after an era-menu jump" bug.
  const mountedWithoutRestore = useRef(!restore);
  const handledJumpSeq = useRef(eraJumpSeq);
  useEffect(() => {
    if (
      !shouldRunEraJump({
        hasRestore: !mountedWithoutRestore.current,
        eraJumpSeq,
        handledJumpSeq: handledJumpSeq.current,
      })
    )
      return;
    handledJumpSeq.current = eraJumpSeq;
    const targetId = eraIdRef.current;
    const { anchorId: nextAnchorId, count: neededCount } = jumpWindow(targetId);
    setAnchorId(nextAnchorId);
    setCount(neededCount);

    // A jump can re-render every era between "now" and the target at once —
    // on a slow connection (mobile, most visibly) their images are often
    // still loading when the initial scroll fires. Each image that finishes
    // loading after that shifts the page layout, so a single scroll-once-
    // after-two-rAFs lands correctly at that instant but then drifts as more
    // images arrive above the target — landing "in the middle of the era" or
    // on the wrong one, non-reproducibly depending on load timing. Re-correct
    // for a short settle window instead of trusting one snapshot.
    // MOBILE JUMP FIX (2026-07-19, founder report: "select a different era and
    // my screen doesn't scroll at all"). Every correction path here is
    // frame-tied (rAF / ResizeObserver), but the settle window used to be a
    // wall-clock timer that cancelled them. A jump re-renders up to 11 era
    // sections (~300k px, hundreds of images); on a phone that layout+paint
    // can take longer than the window, so the timer fired FIRST, set
    // cancelled, and the frame that finally arrived did nothing — zero scroll
    // attempts, screen frozen. Desktop finishes layout in ~30ms and always
    // beat the timer, which is why this only ever showed up on mobile.
    //
    // So: never cancel before we've actually landed once, run a
    // frame-INDEPENDENT poll (setInterval fires even when frames don't), and
    // start the settle window only after the first successful positioning —
    // the window's real job is absorbing the layout shift as images load
    // above the target, which only matters once we're there.
    let cancelled = false;
    let landedAt = 0;
    const deadline = Date.now() + JUMP_SCROLL_MAX_MS;
    // Declared before stop() so it can never hit a temporal-dead-zone
    // ReferenceError if a correction ever stops on its very first pass.
    let poll: number | undefined;
    let ro: ResizeObserver | undefined;

    const stop = () => {
      cancelled = true;
      ro?.disconnect();
      if (poll !== undefined) window.clearInterval(poll);
      window.removeEventListener('wheel', onUserScroll);
      window.removeEventListener('touchstart', onUserScroll);
    };

    const correct = () => {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(`[data-ll-section="${targetId}"]`);
      // Target not rendered yet — WAIT. (Previously this fell back to top: 0,
      // which yanked the reader to the top of the page instead.)
      if (!el) {
        if (Date.now() > deadline) stop();
        return;
      }
      // Compensate for the sticky chrome (TopBar + FilterBar) pinned over
      // y=0, or the section's top edge lands hidden underneath it (founder
      // report, 2026-08-14: "our scroll goes under the filters"). Re-measured
      // on every pass so a chrome-height change mid-settle (e.g. FilterBar's
      // own ResizeObserver catching up) can't leave a stale offset behind.
      window.scrollTo({
        top: jumpLandingScrollTop({
          sectionTop: el.getBoundingClientRect().top,
          scrollY: window.scrollY,
          chromeHeight: measureChromeHeight(),
        }),
        behavior: 'auto',
      });
      if (!landedAt) landedAt = Date.now();
      // Settle window starts at the FIRST landing, not at the jump.
      if (Date.now() - landedAt > JUMP_SCROLL_SETTLE_MS || Date.now() > deadline) stop();
    };

    // A user gesture always wins — never fight someone who has taken over.
    const onUserScroll = () => stop();

    correct(); // immediate attempt: needs no frame at all
    requestAnimationFrame(() => requestAnimationFrame(correct));
    if (!cancelled) {
      poll = window.setInterval(correct, 100);
      ro = new ResizeObserver(correct);
      ro.observe(document.body);
      window.addEventListener('wheel', onUserScroll, { passive: true });
      window.addEventListener('touchstart', onUserScroll, { passive: true });
    }

    return stop;
  }, [eraJumpSeq]);

  const sequence = useMemo(() => erasBackFrom(anchorId, count), [anchorId, count]);
  const reachedBeginning = isFirstEra(sequence[sequence.length - 1].id);
  const sequenceKey = sequence.map((e) => e.id).join(',');

  // The active era's section-top offset (relative to the viewport), kept
  // continuously fresh by the scroll handler below — the "before" snapshot
  // the filter-change restore effect (below) reads from. It is deliberately
  // NOT the saveEraScroll/getEraScroll snapshot: that pair persists raw
  // scrollY across a mode switch (a different concern, on the provider), and
  // a filter change narrows content ABOVE the active era, so restoring raw
  // scrollY would leave the reader on the wrong era entirely — anchoring on
  // the era section's own top edge is what keeps them in place.
  const activeEraOffsetRef = useRef<{ eraId: string; offset: number } | null>(null);

  // Promote whichever section crosses the viewport center to "active", and
  // continuously persist the stream position so a jump into Threads (and back)
  // can restore this exact spot — anchor era, appended eras, and scroll offset.
  useEffect(() => {
    let raf = 0;
    const pick = () => {
      raf = 0;
      // The TimelineScrubber's own auto-scroll during a drag can cross into
      // the next era's viewport-center; flipping the active era mid-drag
      // would swap the scrubber's whole per-era anchor set out from under
      // the still-active gesture (it reads as the rail jumping). Hold the
      // active era steady until the drag ends, which forces one resync.
      if (scrubbingRef.current) {
        saveEraScroll({
          anchorId: anchorRef.current,
          count: countRef.current,
          scrollY: window.scrollY,
        });
        return;
      }
      const center = window.innerHeight / 2;
      const sections = document.querySelectorAll<HTMLElement>('[data-ll-section]');
      for (const el of sections) {
        const r = el.getBoundingClientRect();
        if (r.top <= center && r.bottom >= center) {
          const id = el.dataset.llSection;
          if (id) {
            setActiveEra(id as Era['id']);
            activeEraOffsetRef.current = { eraId: id, offset: r.top };
          }
          break;
        }
      }
      saveEraScroll({
        anchorId: anchorRef.current,
        count: countRef.current,
        scrollY: window.scrollY,
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    pick();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sequenceKey, setActiveEra, saveEraScroll]);

  // A filter change must not move the user between eras: it only narrows or
  // widens each era's own feed, so the fix is to keep the ACTIVE era's
  // section top pinned at the same viewport offset it held right before the
  // change, rather than falling back to any absolute scrollY (which the
  // narrowed/widened content above the active era would invalidate).
  //
  // `activeEraOffsetRef` is read here, not written — by the time this effect
  // sees a new `filters` value, the DOM has already re-rendered under it, so
  // the ref's value is still whatever the scroll handler above last recorded
  // BEFORE the change (that handler doesn't depend on `filters`, so a filter
  // toggle alone never touches it). useLayoutEffect (not useEffect) so the
  // correction lands before the browser paints the shifted layout.
  const prevFiltersRef = useRef(filters);
  useLayoutEffect(() => {
    if (prevFiltersRef.current === filters) return;
    prevFiltersRef.current = filters;
    const saved = activeEraOffsetRef.current;
    if (!saved) return;
    const el = document.querySelector<HTMLElement>(`[data-ll-section="${saved.eraId}"]`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // filterChangeScrollDelta (era-stream-pin.ts) also clamps for the case
    // where the filter change collapsed the active era's own feed to the
    // short empty-state message: pinning the top alone would then leave the
    // section's bottom above the reading reference line, silently landing
    // the reader in the FOLLOWING era (adversarial review finding #3,
    // 2026-08-13).
    const delta = filterChangeScrollDelta({
      sectionTop: rect.top,
      sectionBottom: rect.bottom,
      savedTop: saved.offset,
      viewportCenter: window.innerHeight / 2,
      scrollY: window.scrollY,
    });
    if (delta !== 0) window.scrollBy({ top: delta, behavior: 'auto' });
  }, [filters]);

  // Lazily append the next older era as the sentinel nears the viewport.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reachedBeginning) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setCount((c) => c + 1);
      },
      { rootMargin: '900px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [sequenceKey, reachedBeginning]);

  return (
    <div>
      {/* The masthead (R1, PLAN.md 2026-08-14): mounted ONCE here, above the
          whole sequence — never inside the map below, which repeats per era.
          It sits above the stream's anchor (always the current/newest era,
          see jumpWindow), scrolls away as the reader goes back in time, and
          never returns — the sticky TopBar above it is the "compact bar" it
          collapses into. */}
      <header className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-5 pb-10 pt-12 text-center sm:pt-16">
        <LandingMasthead
          onNavigate={(m) => {
            // 'era' is a no-op: the stream IS the era surface already.
            if (m === 'threads' || m === 'mood' || m === 'clownbot') setMode(m);
          }}
          currentItems={currentItems}
        />
      </header>
      <FilterBar />
      {sequence.map((era, i) => (
        <Fragment key={era.id}>
          {i > 0 && <EraTransition from={sequence[i - 1]} to={era} />}
          <EraSection era={era} currentItems={era.id === CURRENT_ERA_ID ? currentItems : undefined} />
        </Fragment>
      ))}

      {reachedBeginning ? (
        <OriginCap />
      ) : (
        <div ref={sentinelRef} aria-hidden className="h-px w-full" />
      )}
    </div>
  );
}

/**
 * The color-morphing band between two stacked eras — a pure gradient that
 * smooths the palette change from one era into the next. No text: the era name
 * lives in the hero directly below, so a label here would just be redundant.
 */
function EraTransition({ from, to }: { from: Era; to: Era }) {
  return (
    <div
      aria-hidden
      className="h-[24vh] w-full"
      style={{ background: `linear-gradient(to bottom, ${from.theme.bg}, ${to.theme.bg})` }}
    />
  );
}

/** The terminus: scrolling past Debut reaches the start of her career. */
function OriginCap() {
  const debut = getEra(ERAS[0].id);
  const { goHome, setMode } = useAppActions();

  return (
    <section
      style={eraStyle(debut)}
      className="relative flex min-h-[92vh] items-center justify-center bg-[color:var(--era-bg)] px-5 text-center text-[color:var(--era-ink)]"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-40"
        style={{ background: `linear-gradient(to bottom, ${debut.theme.bg}, transparent)` }}
      />
      <div className="relative mx-auto max-w-xl">
        <Sparkles className="mx-auto h-6 w-6 text-[color:var(--era-accent)]" />
        <div className="mt-6 text-[11px] font-medium uppercase tracking-[0.35em] text-[color:var(--era-ink-soft)]">
          The beginning
        </div>
        <h2 className="mt-4 font-[family-name:var(--era-font)] text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Before the first song
        </h2>
        <p className="mx-auto mt-5 max-w-md text-pretty leading-relaxed text-[color:var(--era-ink-soft)]">
          This is where the story starts — a teenager in Pennsylvania with a guitar and a
          notebook full of songs. You&apos;ve traveled all the way back to the first page.
          Everything after this became history.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={goHome}
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--era-accent)] px-5 py-2.5 text-sm font-semibold text-[color:var(--era-bg)] transition hover:opacity-90"
          >
            <ArrowUp className="h-4 w-4" />
            Return to now
          </button>
          <button
            onClick={() => {
              setMode('threads');
              window.scrollTo({ top: 0, behavior: 'auto' });
            }}
            className="era-btn-ghost inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
          >
            Explore the threads
          </button>
        </div>
      </div>
    </section>
  );
}
