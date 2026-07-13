import type { EraId, LensId } from '@/lib/longlive/types';
import type { ShareTarget } from '@/lib/longlive/store';

export const TOPBAR_ROW_CLASS =
  'flex items-center justify-between gap-2 border-b border-line bg-bg/80 px-4 py-3 backdrop-blur-xl md:gap-3 md:px-6';

export const TOPBAR_LEFT_CLASS = 'flex min-w-0 items-center gap-2 md:gap-3';

export const TOPBAR_ACTIONS_CLASS = 'flex shrink-0 items-center gap-2';

/**
 * What the top bar's Share button shares in each navigation state. Returns
 * null on the plain Threads gallery (no lens picked): no share copy exists
 * for that state (#492), so the button renders disabled there instead of
 * disappearing — the actions group must never change width, or the mode
 * toggle shifts (#453).
 */
export function topbarShareTarget(
  mode: 'era' | 'threads',
  eraId: EraId,
  lensId: LensId | null,
): ShareTarget | null {
  if (mode === 'era') return { kind: 'era', eraId };
  if (lensId != null) return { kind: 'lens', lensId };
  return null;
}
