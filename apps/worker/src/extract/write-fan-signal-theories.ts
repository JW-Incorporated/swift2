import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExtractedFanSignal } from './types';
import {
  projectKnowledgeDoc,
  theoryPassesScreen,
  upsertLiveTheory,
  writeFanSignal,
} from './write-knowledge';
import type { ExtractStageResult } from './run-extract-stage';

/** Runs the fan-signal/theory write phase for one extracted story. */
export async function writeFanSignalTheories(
  db: SupabaseClient,
  result: ExtractStageResult,
  fanSignal: ExtractedFanSignal,
  evidenceDocId: string | undefined,
  imageUrl: string | null | undefined,
  today: string,
  eraId: string,
  clusterCount: number,
): Promise<void> {
  const theoryIds: string[] = [];
  for (const theory of fanSignal.theories) {
    if (!theoryPassesScreen(theory)) {
      result.screenedOut += 1;
      result.theoryHoldReasons.redline =
        (result.theoryHoldReasons.redline ?? 0) + 1;
      continue;
    }
    const stored = await upsertLiveTheory(
      db,
      theory,
      fanSignal.symbols,
      today,
      {
        imageUrl: evidenceDocId ? imageUrl : undefined,
        evidenceIds: evidenceDocId ? [evidenceDocId] : [],
      },
    );
    theoryIds.push(stored.id);
    result.theoriesUpserted += 1;
    if (!stored.published) {
      const reason = stored.holdReason ?? 'unknown';
      result.theoryHoldReasons[reason] =
        (result.theoryHoldReasons[reason] ?? 0) + 1;
    }
    await projectKnowledgeDoc(db, {
      id: `ltheory:${stored.id}`,
      kind: 'live_theory',
      title: theory.name,
      text: theory.claim,
      open: true,
      status: 'rumor',
      sourceTier: 'fan',
      sources: [],
      eraId,
      symbols: fanSignal.symbols,
      entities: [],
      expiresAt: stored.expiresAt,
      redlineOk: stored.published,
    });
  }
  const stored = await writeFanSignal(db, fanSignal, theoryIds, clusterCount);
  if (!stored.redlineOk) result.screenedOut += 1;
  else {
    result.extracted += 1;
    await projectKnowledgeDoc(db, {
      id: `signal:${stored.id}`,
      kind: 'fan_signal',
      title: fanSignal.topic,
      text: fanSignal.summary,
      open: true,
      status: 'reported',
      sourceTier: 'fan',
      sources: [],
      eraId,
      symbols: fanSignal.symbols,
      entities: [],
      expiresAt: stored.expiresAt,
      redlineOk: stored.redlineOk,
    });
  }
}
