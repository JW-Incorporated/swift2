/**
 * Pure share-copy builders for the ShareSheet. Kept out of the component so
 * the exact text we hand to navigator.share / the clipboard is unit-testable.
 */

import { truncate } from './format';
import type { ContentItem, Era } from './types';

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
