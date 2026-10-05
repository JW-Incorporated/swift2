// The canonical snapshot hash is diagnostics only: it runs after first paint and the ready signal, never on the mount path.
import type { ReaderSnapshotCore, ReaderSnapshotExtensions } from '@swift2/experience/reader-snapshot';
import type { createProbe } from './probe';
import { describeSnapshotSafe } from './snapshot';

type Idle = (cb: () => void) => void;

const defaultIdle: Idle = (cb) => {
  const w = globalThis as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(cb, { timeout: 2000 });
  else setTimeout(cb, 0);
};

/** Hash + describe once the browser is idle, record it on the probe, then publish the probe again. */
export function scheduleSnapshotHash(
  core: ReaderSnapshotCore,
  extensions: ReaderSnapshotExtensions,
  probe: ReturnType<typeof createProbe>,
  publish: () => Promise<unknown>,
  idle: Idle = defaultIdle,
): void {
  idle(() => {
    void (async () => {
      const t0 = performance.now();
      const described = await describeSnapshotSafe(core, extensions);
      probe.report.timings = { ...probe.report.timings, hashMs: Math.round(performance.now() - t0) };
      probe.report.snapshot = described.snapshot;
      if (described.error) probe.report.error = described.error;
      await publish();
    })();
  });
}
