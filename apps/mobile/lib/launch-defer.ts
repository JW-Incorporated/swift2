// Startup perf: Expo serializes native async calls (SecureStore etc.), so non-critical launch work that starts at
// module init or first render queues AHEAD of the mount gate. Such work runs through runAfterFirstPaint instead: it
// fires on the next macrotask after the first era paint (diagnostics' `first-era-paint` mark calls markFirstPaint),
// or after a fallback timeout if no paint ever arrives (error/test page), so it is deferred, never dropped.
export const FIRST_PAINT_FALLBACK_MS = 8000;

let painted = false;
const waiters = new Set<() => void>();

export function markFirstPaint(): void {
  if (painted) return;
  painted = true;
  const ready = [...waiters];
  waiters.clear();
  for (const run of ready) setTimeout(run, 0);
}

/** Run `fn` once, after first paint (or the fallback). Returns a cancel function. */
export function runAfterFirstPaint(fn: () => void, fallbackMs: number = FIRST_PAINT_FALLBACK_MS): () => void {
  let done = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = (): void => {
    if (done) return;
    done = true;
    waiters.delete(run);
    if (timer !== undefined) clearTimeout(timer);
    fn();
  };
  if (painted) timer = setTimeout(run, 0);
  else {
    waiters.add(run);
    timer = setTimeout(run, fallbackMs);
  }
  return () => {
    done = true;
    waiters.delete(run);
    if (timer !== undefined) clearTimeout(timer);
  };
}

export function resetFirstPaintForTests(): void {
  painted = false;
  waiters.clear();
}
