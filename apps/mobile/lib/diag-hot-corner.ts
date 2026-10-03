// Pure logic for the invisible Diagnostics hot corner (issue #4872). While the
// Expo DOM shared-UI host is mounted the native Settings -> About path is
// unreachable, so transparent boxes in the top and bottom inset strips (which the
// DOM content never occupies) feed one shared 7-tap unlock.
import { createTapUnlock } from './diagnostics';

/** Width of the hot corner strip, in points. */
export const HOT_CORNER_WIDTH = 88;

/** An inset strip shorter than this is not a usable tap target. */
export const MIN_STRIP_HEIGHT = 20;

export interface HotCornerRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Insets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** The hot corner exists only while the shared-UI host is the mounted surface. */
export function shouldMountHotCorner(mount: string): boolean {
  return mount === 'dom';
}

/**
 * Where the DOM host's content begins. The native SafeAreaView pads every edge
 * by the insets, so content occupies the window minus the insets. (The DOM body
 * pads --safe-top again inside that, which only pushes content lower.)
 */
export function domContentRect(
  insets: Insets,
  window: { width: number; height: number },
): HotCornerRect {
  return {
    left: insets.left,
    top: insets.top,
    width: Math.max(0, window.width - insets.left - insets.right),
    height: Math.max(0, window.height - insets.top - insets.bottom),
  };
}

/**
 * Rects of the hot corner in window coordinates: the top inset strip and the
 * bottom inset strip, each only when usable. Empty when neither is (Settings
 * stays native-only).
 */
export function hotCornerRects(
  insets: Insets,
  window: { width: number; height: number },
): HotCornerRect[] {
  const width = Math.min(HOT_CORNER_WIDTH, window.width);
  const rects: HotCornerRect[] = [];
  if (insets.top >= MIN_STRIP_HEIGHT) {
    rects.push({ left: 0, top: 0, width, height: insets.top });
  }
  if (insets.bottom >= MIN_STRIP_HEIGHT) {
    rects.push({ left: 0, top: window.height - insets.bottom, width, height: insets.bottom });
  }
  return rects;
}

/** Returns a press handler that calls `onUnlock` on the 7th rapid tap. */
export function createHotCornerPress(onUnlock: () => void, unlock = createTapUnlock()) {
  return () => {
    if (unlock.tap()) onUnlock();
  };
}
