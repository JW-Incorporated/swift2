import type { Insets } from '@swift2/ui';

/** Dev/web only: ?inset=top,right,bottom,left simulates the native safe-area insets. */
export function insetsFromQuery(): Insets | undefined {
  const raw = new URLSearchParams(window.location.search).get('inset');
  if (!raw) return undefined;
  const [top = 0, right = 0, bottom = 0, left = 0] = raw.split(',').map((n) => Number(n) || 0);
  return { top, right, bottom, left };
}
