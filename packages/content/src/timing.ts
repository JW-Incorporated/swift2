/**
 * Optional load-stage timing hooks (One UI WP0.1). The loader reports how long
 * each stage took to a registered sink; with no sink registered every hook is a
 * shared no-op, so web/build-time callers pay nothing and behavior never
 * changes. A hook only ever fires on a stage's success path and never throws
 * into the loader.
 */
export interface LoadTimingEvent {
  stage: string;
  /** Extra label, e.g. the manifest entry name or the manifest HTTP status. */
  detail?: string;
  /** `now()` reading when the stage began (ms, same clock as `durationMs`). */
  startMs: number;
  durationMs: number;
}

export type LoadTimingSink = (event: LoadTimingEvent) => void;

const NOOP = (): void => {};

let sink: LoadTimingSink | null = null;

/** Register (or clear with `null`) the one sink that receives load-stage timings. */
export function setLoadTimingSink(next: LoadTimingSink | null): void {
  sink = next;
}

function now(): number {
  const perf = (globalThis as { performance?: { now?: () => number } }).performance;
  return typeof perf?.now === 'function' ? perf.now() : Date.now();
}

/** Start timing `stage`; call the returned function when it finishes (optionally with a detail label). */
export function beginStage(stage: string, detail?: string): (endDetail?: string) => void {
  const target = sink;
  if (!target) return NOOP;
  const startMs = now();
  return (endDetail) => {
    try {
      const d = endDetail ?? detail;
      target({ stage, ...(d ? { detail: d } : {}), startMs, durationMs: now() - startMs });
    } catch {
      // A broken sink must never break a content load.
    }
  };
}
