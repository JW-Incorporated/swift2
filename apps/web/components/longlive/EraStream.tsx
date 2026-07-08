'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { ERAS, erasBackFrom, isFirstEra, getEra } from '@/lib/longlive/eras';
import { eraStyle } from '@/lib/longlive/theme';
import type { Era } from '@/lib/longlive/types';
import { EraSection } from './EraSection';

/**
 * The infinite era stream. You enter at an anchor era (the current era, or one
 * picked from the selector) and scroll *back* in time: older eras append below,
 * colors morph across gradient transition bands, and the era occupying the
 * viewport center becomes "active" (driving the top bar, scrubber, and page
 * theme). Scrolling past Debut lands on the origin end-cap.
 */
export function EraStream() {
  const { eraId, eraJumpSeq } = useAppState();
  const { setActiveEra, saveEraScroll, getEraScroll } = useAppActions();

  // If the user is returning to era mode via a plain toggle, a saved snapshot
  // tells us where they were. Read it once at first render so the stream mounts
  // pre-anchored (and with the same older eras appended) — no top-then-jump flash.
  const restoreRef = useRef(getEraScroll());
  const restore = restoreRef.current;

  const [anchorId, setAnchorId] = useState(restore?.anchorId ?? eraId);
  const [count, setCount] = useState(restore?.count ?? 1);

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

  // Re-anchor + jump to top whenever the user explicitly jumps to an era.
  // Keyed off the *value* of eraJumpSeq (not "has mounted") so it's idempotent:
  // the initial value is pre-seeded as handled, and StrictMode's double-invoke
  // of this effect can't re-trigger a jump that would clobber a scroll restore.
  const handledJumpSeq = useRef(eraJumpSeq);
  useEffect(() => {
    if (handledJumpSeq.current === eraJumpSeq) return;
    handledJumpSeq.current = eraJumpSeq;
    setAnchorId(eraIdRef.current);
    setCount(1);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [eraJumpSeq]);

  const sequence = useMemo(() => erasBackFrom(anchorId, count), [anchorId, count]);
  const reachedBeginning = isFirstEra(sequence[sequence.length - 1].id);
  const sequenceKey = sequence.map((e) => e.id).join(',');

  // Promote whichever section crosses the viewport center to "active", and
  // continuously persist the stream position so a jump into Threads (and back)
  // can restore this exact spot — anchor era, appended eras, and scroll offset.
  useEffect(() => {
    let raf = 0;
    const pick = () => {
      raf = 0;
      const center = window.innerHeight / 2;
      const sections = document.querySelectorAll<HTMLElement>('[data-ll-section]');
      for (const el of sections) {
        const r = el.getBoundingClientRect();
        if (r.top <= center && r.bottom >= center) {
          const id = el.dataset.llSection;
          if (id) setActiveEra(id as Era['id']);
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
      {sequence.map((era, i) => (
        <Fragment key={era.id}>
          {i > 0 && <EraTransition from={sequence[i - 1]} to={era} />}
          <EraSection era={era} />
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
            onClick={() => {
              goHome();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
