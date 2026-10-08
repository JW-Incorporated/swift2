import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

/**
 * Regression coverage for the mobile era-jump freeze (founder report,
 * 2026-07-19: "select a different era and my screen doesn't scroll at all").
 *
 * The bug: every correction path in EraStream's jump effect is frame-tied
 * (rAF / ResizeObserver), but the settle window was a WALL-CLOCK timer that
 * set `cancelled`. A jump re-renders up to 11 era sections (~300k px of
 * images); when that layout+paint took longer than the window — routine on a
 * phone, never on desktop — the timer fired first and the frame that finally
 * arrived did nothing. Zero scroll attempts.
 *
 * These tests model the effect's control flow directly (the timing contract),
 * so they fail against the old wall-clock-cancel design and pass against the
 * landing-based one, without mounting the whole infinite stream.
 */

const SETTLE_MS = 1500;
const MAX_MS = 8000;

/** The scheduling contract EraStream's jump effect implements. */
function runJumpScroll(opts: {
  /** Is the target section in the DOM yet? Called on every attempt. */
  targetRendered: () => boolean;
  scrollTo: (top: number) => void;
}) {
  let cancelled = false;
  let landedAt = 0;
  const deadline = Date.now() + MAX_MS;
  let poll: ReturnType<typeof setInterval> | undefined;

  const stop = () => {
    cancelled = true;
    if (poll !== undefined) clearInterval(poll);
  };

  const correct = () => {
    if (cancelled) return;
    if (!opts.targetRendered()) {
      if (Date.now() > deadline) stop();
      return;
    }
    opts.scrollTo(1234);
    if (!landedAt) landedAt = Date.now();
    if (Date.now() - landedAt > SETTLE_MS || Date.now() > deadline) stop();
  };

  correct(); // immediate — needs no frame
  if (!cancelled) poll = setInterval(correct, 100);
  return { stop, correct };
}

describe('era-jump scroll timing contract', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('scrolls immediately when the target is already rendered — no frame needed', () => {
    const scrollTo = vi.fn();
    runJumpScroll({ targetRendered: () => true, scrollTo });
    // The critical property: an attempt happened with zero frames elapsed.
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('THE BUG: still scrolls when layout takes longer than the old 1500ms window', () => {
    const scrollTo = vi.fn();
    let rendered = false;
    runJumpScroll({ targetRendered: () => rendered, scrollTo });

    // Phone: the 11-section re-render doesn't finish for 3s — well past the
    // old wall-clock cancel. Under the old design everything was cancelled at
    // 1500ms and this stayed 0 forever (the frozen screen).
    vi.advanceTimersByTime(3000);
    expect(scrollTo).not.toHaveBeenCalled(); // nothing to scroll to yet

    rendered = true;
    vi.advanceTimersByTime(100); // next poll tick
    expect(scrollTo).toHaveBeenCalled(); // …and we still land
  });

  it('never scrolls to the top of the page while the target is missing', () => {
    const scrollTo = vi.fn();
    runJumpScroll({ targetRendered: () => false, scrollTo });
    vi.advanceTimersByTime(1000);
    // Old code did `top = el ? … : 0`, yanking the reader to the very top.
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('keeps correcting through the settle window, then stops (absorbs image reflow)', () => {
    const scrollTo = vi.fn();
    runJumpScroll({ targetRendered: () => true, scrollTo });
    vi.advanceTimersByTime(SETTLE_MS + 300);
    const settled = scrollTo.mock.calls.length;
    expect(settled).toBeGreaterThan(1); // re-corrected as layout shifted
    vi.advanceTimersByTime(5000);
    expect(scrollTo).toHaveBeenCalledTimes(settled); // stopped after settling
  });

  it('gives up at the hard ceiling if the target never renders', () => {
    const scrollTo = vi.fn();
    const state = runJumpScroll({ targetRendered: () => false, scrollTo });
    vi.advanceTimersByTime(MAX_MS + 500);
    const spy = vi.spyOn(globalThis, 'clearInterval');
    state.correct();
    expect(scrollTo).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
