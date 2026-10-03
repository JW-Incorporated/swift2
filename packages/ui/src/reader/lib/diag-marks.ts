/**
 * Era-stream diagnostics marks (One UI perf, #4895). A host that wants timing
 * data (e.g. the app's Speed test mode) calls `setEraPerfCollector` once; the
 * era stream then reports `era-scroll` (rAF-coalesced scroll tick) and
 * `era-switch` (active era changed, detail `{ eraId }`). With no collector
 * installed `eraPerfMark` is a no-op, so the website pays nothing.
 */
export type EraPerfCollector = (name: 'era-scroll' | 'era-switch', detail?: { eraId?: string }) => void;

let collector: EraPerfCollector | null = null;

/** Install (or clear with `null`) the host's collector. */
export function setEraPerfCollector(next: EraPerfCollector | null): void {
  collector = next;
}

export function eraPerfMark(name: 'era-scroll' | 'era-switch', detail?: { eraId?: string }): void {
  collector?.(name, detail);
}
