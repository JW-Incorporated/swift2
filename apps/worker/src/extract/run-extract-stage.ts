import type { SupabaseClient } from '@supabase/supabase-js';
import { hasClaudeSubscriptionToken } from '../claude-call';
import { fetchTopArticleTexts } from '../sources/fetch-article-text';
import { evaluateSameEventGate, loadDedupeCandidates } from './dedupe-gate';
import {
  createCommentFetchState,
  loadClusterSources,
  loadCommentThreads,
  loadRawItems,
  type PendingStory,
} from './extract-stage-data';
import { runExtractMaintenance } from './extract-stage-maintenance';
import { extractWithLLM } from './haiku-client';
import { resolveImageUrl } from './image-resolve';
import { ExtractUsageStore, supabaseExtractUsageDb } from './usage-store';
import {
  mergeNewFactsIntoOriginal,
  projectKnowledgeDoc,
  theoryPassesScreen,
  upsertLiveTheory,
  writeCurrentItem,
  writeFanSignal,
  type ClusterSource,
} from './write-knowledge';

const CURRENT_ERA_ID = 'tloas';
const MAX_CLUSTERS_PER_CYCLE = 50;

export interface ExtractStageResult {
  clustersConsidered: number;
  extracted: number;
  screenedOut: number;
  skipped: number;
  deferred: number;
  theoriesUpserted: number;
  abandonedTheories: number;
  countdownsResolved: number;
  dedupeMerged: number;
  dedupeDiscarded: number;
  dedupeHeld: number;
  errors: string[];
}

function emptyResult(): ExtractStageResult {
  return {
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
  };
}

export async function runExtractStage(db: SupabaseClient): Promise<ExtractStageResult> {
  const result = emptyResult();
  const { errors } = result;
  const { data: symbolRows, error: symbolError } = await db.from('symbol_lexicon').select('key');
  if (symbolError) errors.push(`symbol_lexicon load failed: ${symbolError.message}`);
  const symbolLexiconKeys = (symbolRows ?? []).map((row) => row.key as string);

  const { data: pending, error: pendingError } = await db
    .from('news_story')
    .select('id, canonical_title, summary, top_image_url')
    .not('classified_at', 'is', null)
    .is('extracted_at', null)
    .limit(MAX_CLUSTERS_PER_CYCLE);
  if (pendingError) {
    errors.push(`could not load pending clusters: ${pendingError.message}`);
    return result;
  }

  const today = new Date().toISOString().slice(0, 10);
  const usage = await ExtractUsageStore.create(supabaseExtractUsageDb(db));
  const commentFetchState = createCommentFetchState();

  for (const story of (pending ?? []) as PendingStory[]) {
    result.clustersConsidered += 1;
    try {
      const [items, sources] = await Promise.all([
        loadRawItems(db, story.id),
        loadClusterSources(db, story.id),
      ]);
      const clusterItems = items.length > 0
        ? items.map(({ title, snippet }) => ({ title, snippet }))
        : [{ title: story.canonical_title, snippet: story.summary ?? '' }];
      const countdownTargetAt = items
        .find((item) => item.countdownTargetAt)?.countdownTargetAt ?? undefined;
      const modelAvailable = hasClaudeSubscriptionToken();
      const commentThreads = modelAvailable
        ? await loadCommentThreads(db, items, story.id, commentFetchState)
        : [];
      const articleTexts = modelAvailable
        ? await fetchTopArticleTexts(sources.map((source) => ({
          url: source.url,
          tier: source.tier,
          outletName: source.outletName,
        })))
        : [];
      const extracted = await extractWithLLM(usage, {
        items: clusterItems,
        ...(commentThreads.length > 0 ? { commentThreads } : {}),
        ...(articleTexts.length > 0 ? { articleTexts } : {}),
        symbolLexiconKeys,
        eraId: CURRENT_ERA_ID,
        today,
      });

      if (extracted === null) {
        result.deferred += 1;
        continue;
      }
      if (extracted.kind === 'skip') {
        result.skipped += 1;
      } else {
        if (extracted.currentItem) {
          const imageUrl = await resolveImageUrl(story.top_image_url, sources);
          let decision: Awaited<ReturnType<typeof evaluateSameEventGate>>;
          try {
            const candidates = await loadDedupeCandidates(db, CURRENT_ERA_ID);
            decision = await evaluateSameEventGate(usage, candidates, extracted.currentItem);
          } catch (error) {
            decision = { action: 'hold', reason: (error as Error).message };
          }
          if (decision.action === 'hold') {
            result.dedupeHeld += 1;
            errors.push(`dedupe gate held story ${story.id}: ${decision.reason}`);
            continue;
          }
          if (decision.action === 'discard' || decision.action === 'merge') {
            result.dedupeDiscarded += decision.action === 'discard' ? 1 : 0;
            result.dedupeMerged += decision.action === 'merge' ? 1 : 0;
            try {
              const { data: original, error } = await db
                .from('current_item')
                .select('headline, summary, detail, sources, image_url')
                .eq('id', decision.candidateId)
                .single();
              if (error) throw new Error(error.message);
              await mergeNewFactsIntoOriginal(
                db,
                decision.candidateId,
                {
                  headline: original.headline as string,
                  summary: original.summary as string,
                  detail: original.detail as string,
                  sources: ((original.sources as unknown[]) ?? []) as ClusterSource[],
                  imageUrl: (original.image_url as string | null) ?? null,
                },
                {
                  ...(decision.action === 'merge' ? {
                    mergedSummary: decision.mergedSummary,
                    mergedDetail: decision.mergedDetail,
                  } : {}),
                  duplicateSources: sources,
                  duplicateImageUrl: imageUrl ?? null,
                },
              );
            } catch (error) {
              errors.push(
                `dedupe merge/discard failed for story ${story.id}: ${(error as Error).message}`,
              );
            }
          } else {
            const written = await writeCurrentItem(
              db,
              story.id,
              CURRENT_ERA_ID,
              extracted.currentItem,
              sources,
              countdownTargetAt,
              imageUrl,
            );
            if (!written.redlineOk) result.screenedOut += 1;
            else {
              result.extracted += 1;
              await projectKnowledgeDoc(db, {
                id: `current:${written.id}`,
                kind: 'current_item',
                title: extracted.currentItem.headline,
                text: `${extracted.currentItem.summary} ${extracted.currentItem.detail}`.trim(),
                date: extracted.currentItem.observedOn,
                recencyDate: extracted.currentItem.observedOn,
                open: ['rumor', 'reported'].includes(extracted.currentItem.statusHint),
                status: extracted.currentItem.statusHint,
                sourceTier: sources[0]?.tier ?? 'unverified',
                sources: sources.map((source) => ({
                  name: source.outletName,
                  url: source.url,
                  tier: source.tier,
                })),
                eraId: CURRENT_ERA_ID,
                symbols: extracted.currentItem.symbols,
                entities: extracted.currentItem.entities,
                expiresAt: written.expiresAt,
                redlineOk: written.redlineOk,
              });
            }
          }
        }
        if (extracted.fanSignal) {
          const theoryIds: string[] = [];
          for (const theory of extracted.fanSignal.theories) {
            if (!theoryPassesScreen(theory)) {
              result.screenedOut += 1;
              continue;
            }
            const stored = await upsertLiveTheory(
              db,
              theory,
              extracted.fanSignal.symbols,
              today,
            );
            theoryIds.push(stored.id);
            result.theoriesUpserted += 1;
            await projectKnowledgeDoc(db, {
              id: `ltheory:${stored.id}`,
              kind: 'live_theory',
              title: theory.name,
              text: theory.claim,
              open: true,
              status: 'rumor',
              sourceTier: 'fan',
              sources: [],
              eraId: CURRENT_ERA_ID,
              symbols: extracted.fanSignal.symbols,
              entities: [],
              expiresAt: stored.expiresAt,
              redlineOk: true,
            });
          }
          const stored = await writeFanSignal(
            db,
            extracted.fanSignal,
            theoryIds,
            clusterItems.length,
          );
          if (!stored.redlineOk) result.screenedOut += 1;
          else {
            result.extracted += 1;
            await projectKnowledgeDoc(db, {
              id: `signal:${stored.id}`,
              kind: 'fan_signal',
              title: extracted.fanSignal.topic,
              text: extracted.fanSignal.summary,
              open: true,
              status: 'reported',
              sourceTier: 'fan',
              sources: [],
              eraId: CURRENT_ERA_ID,
              symbols: extracted.fanSignal.symbols,
              entities: [],
              expiresAt: stored.expiresAt,
              redlineOk: stored.redlineOk,
            });
          }
        }
      }
      const { error } = await db
        .from('news_story')
        .update({ extracted_at: new Date().toISOString() })
        .eq('id', story.id);
      if (error) errors.push(`could not mark story ${story.id} extracted: ${error.message}`);
    } catch (error) {
      errors.push(`extract failed for story ${story.id}: ${(error as Error).message}`);
    }
  }

  const maintenance = await runExtractMaintenance(db, today, CURRENT_ERA_ID);
  result.abandonedTheories = maintenance.abandonedTheories;
  result.countdownsResolved = maintenance.countdownsResolved;
  errors.push(...maintenance.errors);
  return result;
}
