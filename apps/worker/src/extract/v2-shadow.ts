// Shadow mode (NEWS_WRITER_V2=shadow): the legacy path writes the rows, and
// this runs the v2 pipeline beside it for review. It never writes to the DB
// (it only reads context); each item appends one JSON line to a file the
// workflow uploads as an artifact. Public news text and model output only.

import { appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExtractUsageStore } from './usage-store';
import { composeV2Item, DEFERRED_HOLDS, tierFloorHold, type V2Item } from './v2-stage';
import type { ClusterSource } from './write-knowledge';

export function shadowFilePath(env: NodeJS.ProcessEnv = process.env): string {
  return env.NEWS_V2_SHADOW_FILE ?? join(env.RUNNER_TEMP ?? tmpdir(), 'news-v2-shadow.jsonl');
}

export async function runShadow(
  db: SupabaseClient,
  stores: { writer: ExtractUsageStore; judge: ExtractUsageStore },
  storyId: string,
  item: V2Item,
  sources: readonly ClusterSource[],
  eraId: string,
  file: string = shadowFilePath(),
): Promise<void> {
  const base = { storyId, headline: item.headline, facts: item.facts };
  const floor = tierFloorHold(item, sources);
  const line = floor
    ? { ...base, outcome: 'below_tier_floor', holdReason: floor.holdReason }
    : await composeV2Item(db, stores, item, sources, eraId).then(({ v2, trace, contextIds }) => ({
      ...base,
      lead: trace.lead,
      body: trace.body,
      citations: trace.citations,
      gateReasons: trace.gateReasons,
      judgeScores: trace.judgeScores,
      outcome: v2.holdReason ? (DEFERRED_HOLDS.includes(v2.holdReason) ? 'deferred' : 'hold') : 'ok',
      holdReason: v2.holdReason,
      contextIds,
    }));
  appendFileSync(file, `${JSON.stringify(line)}\n`);
}
