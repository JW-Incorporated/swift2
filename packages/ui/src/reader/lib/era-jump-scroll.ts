import { useEffect } from 'react';
import { measureChromeHeight } from './chrome-offset';
import { clearEraJumpGate, jumpLandingScrollTop } from './era-jump-landing';

/**
 * Releases the #6807 era-jump gate on the EraStream exits that never start a
 * jump: a mount that restored a saved scroll spot, and unmount (e.g. the
 * reader switching to Threads while the gate is up). A fresh front-door
 * mount is NOT an exit — the store applies `?era=` one tick later — so it
 * leaves the gate to the jump (or to the store, for a link that isn't one).
 */
export function useEraJumpGateRelease(hasRestore: boolean): void {
  useEffect(() => {
    if (hasRestore) clearEraJumpGate();
    return clearEraJumpGate;
  }, [hasRestore]);
}

/**
 * Jump-scroll timing. SETTLE is how long we keep re-correcting AFTER first
 * landing on the target (absorbing layout shift as images load in above it).
 * MAX is the hard ceiling on the whole attempt, so a jump whose target never
 * renders can't leave timers running forever. MAX is generous because it is
 * a *ceiling*, not a delay: on a fast device the whole thing is done in a
 * frame, and any user gesture stops it immediately.
 */
export const JUMP_SCROLL_SETTLE_MS = 1500;
export const JUMP_SCROLL_MAX_MS = 8000;

/**
 * EraStream's jump-correction loop, moved out of the component so every way
 * it ends is testable (#6807). Returns `finish`, which EraStream uses as the
 * effect cleanup; `onFinish` runs exactly once however the loop ends (settled,
 * deadline, user gesture, or cleanup/unmount).
 *
 * A jump can re-render every era between "now" and the target at once —
 * on a slow connection (mobile, most visibly) their images are often
 * still loading when the initial scroll fires. Each image that finishes
 * loading after that shifts the page layout, so a single scroll-once-
 * after-two-rAFs lands correctly at that instant but then drifts as more
 * images arrive above the target — landing "in the middle of the era" or
 * on the wrong one, non-reproducibly depending on load timing. Re-correct
 * for a short settle window instead of trusting one snapshot.
 * MOBILE JUMP FIX (2026-07-19, founder report: "select a different era and
 * my screen doesn't scroll at all"). Every correction path here is
 * frame-tied (rAF / ResizeObserver), but the settle window used to be a
 * wall-clock timer that cancelled them. A jump re-renders up to 11 era
 * sections (~300k px, hundreds of images); on a phone that layout+paint
 * can take longer than the window, so the timer fired FIRST, set
 * cancelled, and the frame that finally arrived did nothing — zero scroll
 * attempts, screen frozen. Desktop finishes layout in ~30ms and always
 * beat the timer, which is why this only ever showed up on mobile.
 *
 * So: never cancel before we've actually landed once, run a
 * frame-INDEPENDENT poll (setInterval fires even when frames don't), and
 * start the settle window only after the first successful positioning —
 * the window's real job is absorbing the layout shift as images load
 * above the target, which only matters once we're there.
 */
export function startEraJumpScroll(targetId: string, onFinish: () => void): () => void {
  let cancelled = false;
  let finished = false;
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
  const finish = () => {
    stop();
    if (finished) return;
    finished = true;
    onFinish();
  };

  const correct = () => {
    if (cancelled) return;
    const el = document.querySelector<HTMLElement>(`[data-ll-section="${targetId}"]`);
    // Target not rendered yet — WAIT. (Previously this fell back to top: 0,
    // which yanked the reader to the top of the page instead.)
    if (!el) {
      if (Date.now() > deadline) finish();
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
    if (Date.now() - landedAt > JUMP_SCROLL_SETTLE_MS || Date.now() > deadline) finish();
  };

  // A user gesture always wins — never fight someone who has taken over.
  const onUserScroll = () => finish();

  correct(); // immediate attempt: needs no frame at all
  requestAnimationFrame(() => requestAnimationFrame(correct));
  if (!cancelled) {
    poll = window.setInterval(correct, 100);
    ro = new ResizeObserver(correct);
    ro.observe(document.body);
    window.addEventListener('wheel', onUserScroll, { passive: true });
    window.addEventListener('touchstart', onUserScroll, { passive: true });
  }

  return finish;
}
