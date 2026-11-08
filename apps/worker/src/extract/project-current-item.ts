import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExtractedCurrentItem } from './types';
import { projectKnowledgeDoc, type ClusterSource, type WriteCurrentItemResult } from './write-knowledge';

/** Projects a freshly written, servable current_item into the knowledge index. */
export function projectCurrentItemDoc(
  db: SupabaseClient,
  id: string,
  item: ExtractedCurrentItem,
  sources: readonly ClusterSource[],
  eraId: string,
  written: WriteCurrentItemResult,
): Promise<void> {
  return projectKnowledgeDoc(db, {
    id,
    kind: 'current_item',
    title: item.headline,
    text: `${item.summary} ${item.detail}`.trim(),
    date: item.observedOn,
    recencyDate: item.observedOn,
    open: ['rumor', 'reported'].includes(item.statusHint),
    status: item.statusHint,
    sourceTier: sources[0]?.tier ?? 'unverified',
    sources: sources.map((source) => ({
      name: source.outletName,
      url: source.url,
      tier: source.tier,
    })),
    eraId,
    symbols: item.symbols,
    entities: item.entities,
    expiresAt: written.expiresAt,
    redlineOk: written.redlineOk,
  });
}
