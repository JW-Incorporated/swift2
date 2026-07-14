/**
 * Pure share-copy builders for the ShareSheet. Kept out of the component so
 * the exact text we hand to navigator.share / the clipboard is unit-testable.
 */

import { truncate } from './format';
import type { ShareTarget } from './store';
import type { ContentItem, Era, EraId, LensId } from './types';

export interface ShareCopy {
  /** Share-target title (many targets show it as the headline). */
  title: string;
  /** Body text — self-contained, since some targets drop the title. */
  text: string;
}

/** How much of the summary survives into the share body. */
const SHARE_SUMMARY_MAX = 180;

/**
 * Rich share copy for one moment: its title, era, date, and (truncated)
 * summary. The text repeats the title because plenty of share targets
 * (and the clipboard fallback) only carry `text` + url.
 */
export function momentShareCopy(
  item: Pick<ContentItem, 'title' | 'summary' | 'dateLabel'>,
  era: Pick<Era, 'name'>,
): ShareCopy {
  return {
    title: `${item.title} — ${era.name} · Long Live`,
    text: `${item.title} (${era.name}, ${item.dateLabel}) — ${truncate(item.summary, SHARE_SUMMARY_MAX)}`,
  };
}

/**
 * What the top bar's Share button shares in each navigation state. Returns
 * null in threads mode with no thread open — the plain gallery AND the
 * crossing overlay (openCrossing clears lensId) — because no share copy is
 * defined for either state (#492; whether they get their own ShareTarget
 * kind is Joey's call). The button must still RENDER there, just disabled:
 * if the actions group ever changes width between states, the mode toggle
 * shifts (#453).
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
