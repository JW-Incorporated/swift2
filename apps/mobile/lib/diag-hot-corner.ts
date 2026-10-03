// Pure logic for the invisible Diagnostics hot corner (issue #4872). While the
// Expo DOM shared-UI host is mounted the native Settings -> About path is
// unreachable, so a transparent top-left box reuses the 7-tap unlock instead.
import { createTapUnlock } from './diagnostics';

/** Side of the square hot corner, in points. */
export const HOT_CORNER_SIZE = 44;

/** The hot corner exists only while the shared-UI host is the mounted surface. */
export function shouldMountHotCorner(mount: string): boolean {
  return mount === 'dom';
}

/** Returns a press handler that calls `onUnlock` on the 7th rapid tap. */
export function createHotCornerPress(onUnlock: () => void, unlock = createTapUnlock()) {
  return () => {
    if (unlock.tap()) onUnlock();
  };
}
