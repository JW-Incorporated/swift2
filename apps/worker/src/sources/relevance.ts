import type { NormalizedNewsItem } from '@swift2/shared/news';

/**
 * Applies an optional per-source subject guard before an item reaches storage.
 * Sources without the guard (including Taylor's official channel) pass through.
 */
export function filterRelevantItems(
  config: Record<string, unknown>,
  items: readonly NormalizedNewsItem[],
): NormalizedNewsItem[] {
  const requiredMention = config.requiredMention;
  if (typeof requiredMention !== 'string' || !requiredMention.trim()) return [...items];

  const needle = requiredMention.toLocaleLowerCase('en-US');
  return items.filter((item) =>
    `${item.title}\n${item.snippet ?? ''}`.toLocaleLowerCase('en-US').includes(needle),
  );
}
