import type { SupabaseClient } from '@supabase/supabase-js';
import { hasClaudeSubscriptionToken } from '../claude-call';
import { fetchTopArticleTexts } from '../sources/fetch-article-text';
import { evaluateSameEventGate, loadDedupeCandidates } from './dedupe-gate';
import {
  createCommentFetchState,
  loadClusterSources,
  loadCommentThreads,
  loadRawItems,
  resolveClusterSources,
  type PendingStory,
} from './extract-stage-data';
import { emptyResult, recordDiscard, recordV2Hold, type ExtractStageResult } from './extract-stage-result';
import { finishExtractStage } from './extract-stage-finish';
import { extractWithLLM } from './haiku-client';
import { resolveImageUrl } from './image-resolve';
import { ExtractUsageStore, supabaseExtractUsageDb } from './usage-store';
import { loadEraContext } from './context-loader';
import {
  composeV2Item, createJudgeStore, createWriterStore, DEFERRED_HOLDS, hasFacts, rewriteMergedOriginal, tierFloorHold, writerMode,
} from './v2-stage';
import { loadPendingStories, recordV2Attempt } from './v2-retry';
import { runShadow } from './v2-shadow';
import {
  mergeNewFactsIntoOriginal,
  projectKnowledgeDoc,
  writeCurrentItem,
  type ClusterSource,
  type WriterV2Write,
} from './write-knowledge';
import { writeFanSignalTheories } from './write-fan-signal-theories';

const CURRENT_ERA_ID = 'tloas';
const MAX_CLUSTERS_PER_CYCLE = 50;

export type { ExtractStageResult } from './extract-stage-result';

export async function runExtractStage(db: SupabaseClient): Promise<ExtractStageResult> {
  const result = emptyResult();
  const { errors } = result;
  const { data: symbolRows, error: symbolError } = await db.from('symbol_lexicon').select('key');
  if (symbolError) errors.push(`symbol_lexicon load failed: ${symbolError.message}`);
  const symbolLexiconKeys = (symbolRows ?? []).map((row) => row.key as string);

  const mode = writerMode();
  const writerV2 = mode === 'on';
  const { data: pending, error: pendingError } = await loadPendingStories(db, MAX_CLUSTERS_PER_CYCLE, writerV2);
  if (pendingError) {
    errors.push(`could not load pending clusters: ${pendingError.message}`);
    return result;
  }

  const today = new Date().toISOString().slice(0, 10);
  const usage = await ExtractUsageStore.create(supabaseExtractUsageDb(db));
  const commentFetchState = createCommentFetchState();
  const v2Stores = mode === 'off'
    ? undefined
    : { writer: await createWriterStore(db), judge: await createJudgeStore(db) };

  const stories = (pending ?? []) as (PendingStory & { v2_attempts?: number })[];
  for (const [index, story] of stories.entries()) {
    if (writerV2 && v2Stores && !v2Stores.writer.hasCapacity()) {
      result.writerBudgetExhausted = true;
      result.deferred += stories.length - index;
      console.warn('news-worker: writerBudgetExhausted; leaving the remaining stories for the next cycle');
      break;
    }
    result.clustersConsidered += 1;
    try {
      const [items, sources] = await Promise.all([
        loadRawItems(db, story.id),
        loadClusterSources(db, story.id).then((loaded) => resolveClusterSources(db, story.id, loaded)),
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
        const currentItem = extracted.currentItem;
        if (writerV2 && currentItem && !hasFacts(currentItem)) {
          result.v2MissingFacts += 1;
          console.warn(`news-worker: story ${story.id} returned a current_item without facts; retrying next cycle`);
          await recordV2Attempt(db, result, story.id, story.v2_attempts, 'missing_facts');
          continue;
        }
        const imageUrl = currentItem
          ? await resolveImageUrl(story.top_image_url, sources)
          : undefined;
        let evidenceDocId: string | undefined;
        let theoryImageUrl: string | null | undefined = imageUrl;
        if (currentItem) {
          let decision: Awaited<ReturnType<typeof evaluateSameEventGate>>;
          const floorHold = writerV2 && hasFacts(currentItem) ? tierFloorHold(currentItem, sources) : undefined;
          if (floorHold) decision = { action: 'hold', reason: 'below_tier_floor' };
          else try {
            const candidates = await loadDedupeCandidates(db, CURRENT_ERA_ID);
            decision = writerV2
              ? await evaluateSameEventGate(usage, candidates, currentItem, undefined, {
                eraId: CURRENT_ERA_ID,
                crossLane: (await loadEraContext(CURRENT_ERA_ID)).crossLane,
                newItemSources: sources,
              })
              : await evaluateSameEventGate(usage, candidates, currentItem);
          } catch (error) {
            decision = { action: 'hold', reason: (error as Error).message };
          }
          if (floorHold) {
            recordV2Hold(result, 'below_tier_floor');
          } else if (decision.action === 'hold') {
            result.dedupeHeld += 1;
            errors.push(`dedupe gate held story ${story.id}: ${decision.reason}`);
            continue;
          } else if (decision.action === 'attach_video') {
            result.attachedToVideo += 1;
          } else if (decision.action === 'discard' && decision.momentId) {
            result.dedupeDiscarded += 1;
            recordDiscard(result, decision);
          } else if (decision.action === 'discard' || decision.action === 'merge') {
            result.dedupeDiscarded += decision.action === 'discard' ? 1 : 0;
            if (decision.action === 'discard') recordDiscard(result, decision);
            result.dedupeMerged += decision.action === 'merge' ? 1 : 0;
            let dedupeOriginalImage: string | null;
            try {
              const { data: original, error } = await db
                .from('current_item')
                .select('headline, summary, detail, sources, image_url')
                .eq('id', decision.candidateId)
                .single();
              if (error) throw new Error(error.message);
              dedupeOriginalImage = original.image_url as string | null;
              if (dedupeOriginalImage) {
                theoryImageUrl = dedupeOriginalImage;
              }
              const rewritten = decision.action === 'merge' && decision.needsRewrite && decision.mergedFacts
                && writerV2 && v2Stores && hasFacts(currentItem)
                ? await rewriteMergedOriginal(
                  db,
                  v2Stores,
                  { ...currentItem, headline: original.headline as string, facts: decision.mergedFacts },
                  decision.mergedSources ?? sources,
                  CURRENT_ERA_ID,
                )
                : undefined;
              if (rewritten?.deferred) {
                result.dedupeMerged -= 1;
                result.v2Deferred += 1;
                await recordV2Attempt(db, result, story.id, story.v2_attempts, 'deferred');
                continue;
              }
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
                  ...(rewritten ? rewritten : decision.action === 'merge' ? {
                    mergedSummary: decision.mergedSummary,
                    mergedDetail: decision.mergedDetail,
                  } : {}),
                  duplicateSources: sources,
                  duplicateImageUrl: imageUrl ?? null,
                },
              );
              evidenceDocId = `current:${decision.candidateId}`;
            } catch (error) {
              errors.push(
                `dedupe merge/discard failed for story ${story.id}: ${(error as Error).message}`,
              );
            }
          } else {
            let toWrite = currentItem;
            let v2Write: WriterV2Write | undefined;
            if (writerV2 && v2Stores && hasFacts(currentItem)) {
              const composed = await composeV2Item(db, v2Stores, currentItem, sources, CURRENT_ERA_ID);
              if (composed.v2.holdReason && DEFERRED_HOLDS.includes(composed.v2.holdReason)) {
                result.v2Deferred += 1;
                await recordV2Attempt(db, result, story.id, story.v2_attempts, 'deferred');
                continue;
              }
              toWrite = composed.item;
              v2Write = composed.v2;
            } else if (mode === 'shadow' && v2Stores && hasFacts(currentItem)) {
              await runShadow(db, v2Stores, story.id, currentItem, sources, CURRENT_ERA_ID).catch((error: Error) => {
                console.warn(`news-worker: v2 shadow failed for story ${story.id}: ${error.message}`);
              });
            }
            const written = await writeCurrentItem(
              db,
              story.id,
              CURRENT_ERA_ID,
              toWrite,
              sources,
              countdownTargetAt,
              imageUrl,
              v2Write,
            );
            if (!written.redlineOk) {
              if (v2Write?.holdReason) recordV2Hold(result, v2Write.holdReason);
              else result.screenedOut += 1;
            }
            else {
              result.extracted += 1;
              evidenceDocId = `current:${written.id}`;
              await projectKnowledgeDoc(db, {
                id: evidenceDocId,
                kind: 'current_item',
                title: toWrite.headline,
                text: `${toWrite.summary} ${toWrite.detail}`.trim(),
                date: toWrite.observedOn,
                recencyDate: toWrite.observedOn,
                open: ['rumor', 'reported'].includes(toWrite.statusHint),
                status: toWrite.statusHint,
                sourceTier: sources[0]?.tier ?? 'unverified',
                sources: sources.map((source) => ({
                  name: source.outletName,
                  url: source.url,
                  tier: source.tier,
                })),
                eraId: CURRENT_ERA_ID,
                symbols: toWrite.symbols,
                entities: toWrite.entities,
                expiresAt: written.expiresAt,
                redlineOk: written.redlineOk,
              });
            }
          }
        }
        if (extracted.fanSignal) {
          await writeFanSignalTheories(
            db,
            result,
            extracted.fanSignal,
            evidenceDocId,
            theoryImageUrl,
            today,
            CURRENT_ERA_ID,
            clusterItems.length,
          );
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

  await finishExtractStage(db, result, today, CURRENT_ERA_ID);
  return result;
}
