// Speed test mode (#4896): image-load marks for the current launch. Both era
// streams feed `noteImageLoaded` (native MomentCard onLoad; the shared-UI DOM
// host via ReaderSpike's reportImageLoad). Times are offsets from the launch T0.
import { diagCollector, diagMarkOnce } from './diagnostics';

export const IMAGE_WINDOW_MS = 10_000;
const MAX_TRACKED = 500;

export function createImageMarks(elapsed: () => number) {
  let first: number | null = null;
  let times: number[] = [];
  return {
    /** Record one loaded image; true when it was the first VISIBLE one this launch. */
    loaded(visible: boolean): boolean {
      const t = elapsed();
      if (times.length < MAX_TRACKED) times.push(t);
      if (visible && first === null) {
        first = t;
        return true;
      }
      return false;
    },
    firstVisibleMs(): number | null {
      return first;
    },
    /** Images loaded within the first `ms` of the launch. */
    loadedBy(ms: number): number {
      return times.filter((t) => t <= ms).length;
    },
    reset(): void {
      first = null;
      times = [];
    },
  };
}

export const imageMarks = createImageMarks(() => diagCollector.elapsed());

let enabled = false;

/** Image marks are only taken while Speed test mode is running. */
export function setImageMarksEnabled(on: boolean): void {
  enabled = on;
}

export function noteImageLoaded(visible: boolean): void {
  if (!enabled) return;
  if (imageMarks.loaded(visible)) diagMarkOnce('first-image-paint');
}
