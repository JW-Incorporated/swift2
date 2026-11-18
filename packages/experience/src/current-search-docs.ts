import type { CurrentItem } from '@swift2/shared';
import { passesCurrentItemQualityGate } from '@swift2/shared';
import { collapseMergedDuplicates, outletFor } from './current-feed';
import { formatFullDate } from './format';
import { makeSearchDoc, type SearchDoc } from './search-index';
import type { EraId } from './types';

/**
 * Search docs for the current era's live `current_item` rows. The baked
 * snapshot index (`ReaderSnapshot.domains.searchIndex`) is built at bake time
 * and never sees live rows, so without these a story in "This week's news" or
 * the feed could not be found by search. Same dedupe and quality gate as the
 * feed (`currentFeedEntries`) and the pinned section (`thisWeekNewsItems`),
 * so search lists exactly the stories those surfaces can show.
 */
export function currentItemSearchDocs(items: readonly CurrentItem[]): SearchDoc[] {
  return collapseMergedDuplicates(items)
    .filter((item) => passesCurrentItemQualityGate(item))
    .map((item) => {
      const snippet = [outletFor(item), formatFullDate(item.observedOn)].filter(Boolean).join(' · ');
      return makeSearchDoc(
        'news',
        item.id,
        item.headline,
        snippet,
        item.eraId as EraId,
        { kind: 'current', itemId: item.id },
        [item.summary, ...item.tags, ...item.entities],
      );
    });
}
