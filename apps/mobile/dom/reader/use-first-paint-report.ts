import { useEffect, type ComponentType, type MutableRefObject } from 'react';
import type { ReaderSnapshotCore, ReaderSnapshotExtensions } from '@swift2/experience/reader-snapshot';
import type { createNativeCalls } from '../bridge/native-calls';
import { sampleImages } from '../bridge/sample-images';
import type { createProbe } from './probe';
import { scheduleSnapshotHash } from './deferred-hash';
import type { ReaderProps } from './reader-modules';

type NativeCalls = ReturnType<typeof createNativeCalls>;

/** Once the Reader mounts: two frames later report first paint + heap, tell native `ready`, then hash the snapshot and sample images. */
export function useFirstPaintReport(
  Reader: ComponentType<ReaderProps> | null,
  native: NativeCalls,
  probeRef: MutableRefObject<ReturnType<typeof createProbe>>,
  snapRef: MutableRefObject<{ core: ReaderSnapshotCore; extensions: ReaderSnapshotExtensions } | null>,
) {
  useEffect(() => {
    if (!Reader) return;
    const probe = probeRef.current;
    const errored = new WeakSet<EventTarget>();
    // img load/error do not bubble, so listen in the capture phase.
    const onImgError = (e: Event) => void errored.add(e.target as EventTarget);
    document.addEventListener('error', onImgError, true);
    requestAnimationFrame(() =>
      requestAnimationFrame(async () => {
        probe.report.firstPaintMs = Math.round(performance.now());
        const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
        probe.report.heapMb = mem ? Math.round(mem.usedJSHeapSize / 1048576) : null;
        await native.reportProbe(probe.json());
        await native.onReady();
        if (snapRef.current) {
          const { core, extensions } = snapRef.current;
          scheduleSnapshotHash(core, extensions, probe, () => native.reportProbe(probe.json()));
        }
        sampleImages(probe, errored, native.reportProbe);
      }),
    );
    return () => document.removeEventListener('error', onImgError, true);
  }, [Reader]);
}
