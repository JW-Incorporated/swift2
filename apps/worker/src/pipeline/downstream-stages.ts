import type { SupabaseClient } from '@supabase/supabase-js';
import { classifyByKeywords, type ClassifyResult } from '../classify/rule-based';
import { classifyWithLLM } from '../classify/openai-client';
import { UsageStore, supabaseUsageDb } from '../classify/usage-store';
import { runExtractStage, type ExtractStageResult } from '../extract/run-extract-stage';

const MAX_UNCLASSIFIED_PER_CYCLE = 50;

export interface CycleResult {
  sourcesPolled: number;
  itemsIngested: number;
  newStories: number;
  storiesClassified: number;
  storiesVerified: number;
  extract: ExtractStageResult;
  errors: string[];
}

export function emptyCycleResult(errors: string[]): CycleResult {
  return {
    sourcesPolled: 0,
    itemsIngested: 0,
    newStories: 0,
    storiesClassified: 0,
    storiesVerified: 0,
    extract: {
      clustersConsidered: 0,
      extracted: 0,
      screenedOut: 0,
      skipped: 0,
      deferred: 0,
      theoriesUpserted: 0,
      abandonedTheories: 0,
      countdownsResolved: 0,
      dedupeMerged: 0,
      dedupeDiscarded: 0,
      dedupeHeld: 0,
      errors: [],
    },
    errors,
  };
}

export async function runDownstreamStages(
  db: SupabaseClient,
  result: CycleResult,
): Promise<void> {
  const { data: unclassified, error } = await db
    .from('news_story')
    .select('id, canonical_title, summary')
    .is('classified_at', null)
    .limit(MAX_UNCLASSIFIED_PER_CYCLE);
  if (error) {
    result.errors.push(`could not load unclassified stories: ${error.message}`);
  } else if (unclassified && unclassified.length > 0) {
    const usage = await UsageStore.create(supabaseUsageDb(db));
    for (const story of unclassified) {
      try {
        const input = { title: story.canonical_title, snippet: story.summary ?? '' };
        let classification: ClassifyResult | null = null;
        try {
          classification = await classifyWithLLM(usage, input);
        } catch (llmError) {
          result.errors.push(
            `LLM classify failed for story ${story.id}, falling back to rule-based: ${(llmError as Error).message}`,
          );
        }
        if (!classification) classification = classifyByKeywords(input.title, input.snippet);
        const { error: updateError } = await db
          .from('news_story')
          .update({
            canonical_title: classification.headline || story.canonical_title,
            summary: classification.summary,
            category: classification.category,
            importance: classification.importance,
            classified_at: new Date().toISOString(),
            last_updated_at: new Date().toISOString(),
          })
          .eq('id', story.id);
        if (updateError) throw new Error(updateError.message);
        result.storiesClassified++;
      } catch (stageError) {
        result.errors.push(`classify failed for story ${story.id}: ${(stageError as Error).message}`);
      }
    }
  }

  try {
    result.extract = await runExtractStage(db);
    result.errors.push(...result.extract.errors);
  } catch (extractError) {
    result.errors.push(`extract stage failed: ${(extractError as Error).message}`);
  }
}
