// Orchestrates the Theory Miner stage (Community Engine plan §3.3, Phase 2
// card P2-2): one crawl-artifact bundle -> one Haiku call each -> screen ->
// upsert `fan_theory_candidate`. Mirrors ./run-extract-stage.ts's shape
// (pulls work items -> per-item LLM call -> screen/write -> aggregate
// counts, one item's failure logs and continues, never aborts the whole
// run) applied to the C1 crawl artifact instead of news_story clusters.
//
// Input shape matches community-crawl.yml's JSON artifact
// (scripts/community/crawl.mjs's own `main()` output): `{ subreddits: [{
// subreddit, posts: [{ postId, title, permalink, comments: [{ author,
// body }] }] }] }`. This module takes that already-parsed structure (the
// calling script does the file read — see scripts/community/theory-
// miner.mjs) so this file stays pure/testable with plain fixtures, same
// separation ./run-extract-stage.ts keeps between orchestration and I/O.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClaudePriority, WorkerClaudeCaller } from '../claude-call';
import { extractFanTheories, commentsFromCrawlBundle } from './theory-haiku-client';
import { upsertTheoryCandidate } from './write-theory-candidate';
import { ExtractUsageStore, supabaseTheoryMinerUsageDb } from './usage-store';
import { THEORY_MINER_PER_RUN_CAP, THEORY_MINER_DAILY_CAP } from './usage-store';

export interface CrawlBundleComment {
  author?: string | null;
  body?: string | null;
}

export interface CrawlBundlePost {
  postId: string;
  title: string;
  permalink?: string;
  numComments?: number | null;
  comments: readonly CrawlBundleComment[];
}

export interface CrawlBundleSubreddit {
  subreddit: string; // 'reddit:TaylorSwift' watchlist id form (matches crawl.mjs's own bundle shape)
  posts: readonly CrawlBundlePost[];
}

export interface CrawlArtifact {
  subreddits: readonly CrawlBundleSubreddit[];
}

export interface TheoryMinerStageResult {
  bundlesConsidered: number;
  theoriesFound: number;
  theoriesUpserted: number;
  theoriesScreenedOut: number;
  skipped: number;
  unchanged: number;
  prefiltered: number;
  deferred: number;
  errors: string[];
}

export type TheoryBundleFilter = (post: CrawlBundlePost) => Promise<boolean | null>;

function commentBucket(post: CrawlBundlePost): number {
  const count = Number.isFinite(Number(post.numComments))
    ? Number(post.numComments)
    : post.comments.length;
  return Math.floor(Math.max(0, count) / 10);
}

export function theoryBundleKey(post: CrawlBundlePost): string {
  return `bundle:${post.postId}:${commentBucket(post)}`;
}

function bareCommunityName(watchlistId: string): string {
  return watchlistId.replace(/^(reddit|facebook):/, '');
}

export async function runTheoryMinerStage(
  db: SupabaseClient,
  artifact: CrawlArtifact,
  options: {
    priority?: ClaudePriority;
    shouldMine?: TheoryBundleFilter;
    claude?: WorkerClaudeCaller;
  } = {},
): Promise<TheoryMinerStageResult> {
  const errors: string[] = [];
  const result: TheoryMinerStageResult = {
    bundlesConsidered: 0,
    theoriesFound: 0,
    theoriesUpserted: 0,
    theoriesScreenedOut: 0,
    skipped: 0,
    unchanged: 0,
    prefiltered: 0,
    deferred: 0,
    errors,
  };

  const posts = artifact.subreddits.flatMap((sub) => sub.posts);
  const keys = posts.map(theoryBundleKey);
  const { data: minedRows, error: minedError } = keys.length > 0
    ? await db.from('theory_mined_bundle').select('bundle_key').in('bundle_key', keys)
    : { data: [], error: null };
  if (minedError) throw new Error(`theory_mined_bundle load failed: ${minedError.message}`);
  const minedKeys = new Set((minedRows ?? []).map((row) => row.bundle_key as string));

  const { data: symbolRows, error: symbolError } = await db.from('symbol_lexicon').select('key');
  if (symbolError) errors.push(`symbol_lexicon load failed: ${symbolError.message}`);
  const symbolLexiconKeys = (symbolRows ?? []).map((r) => r.key as string);

  const today = new Date().toISOString().slice(0, 10);
  const usage = await ExtractUsageStore.create(
    supabaseTheoryMinerUsageDb(db),
    THEORY_MINER_PER_RUN_CAP,
    THEORY_MINER_DAILY_CAP,
  );

  for (const sub of artifact.subreddits) {
    const bareSub = bareCommunityName(sub.subreddit);
    for (const post of sub.posts) {
      result.bundlesConsidered++;
      const bundleKey = theoryBundleKey(post);
      if (minedKeys.has(bundleKey)) {
        result.unchanged++;
        continue;
      }
      try {
        const shouldMine = options.shouldMine ? await options.shouldMine(post) : true;
        if (shouldMine === null) {
          result.deferred++;
          continue;
        }
        if (!shouldMine) {
          const { error } = await db.from('theory_mined_bundle').insert({
            bundle_key: bundleKey,
            thread_id: post.postId,
            comment_bucket: commentBucket(post),
            outcome: 'jev_negative',
            theories_found: 0,
          });
          if (error) throw new Error(`theory_mined_bundle insert failed: ${error.message}`);
          result.prefiltered++;
          continue;
        }
        const extracted = await extractFanTheories(usage, {
          subreddit: bareSub,
          postTitle: post.title,
          postId: post.postId,
          permalink: post.permalink ?? '',
          comments: commentsFromCrawlBundle(post.comments),
          symbolLexiconKeys,
          today,
        }, { priority: options.priority ?? 'P2', ...(options.claude ? { claude: options.claude } : {}) });

        if (extracted === null) {
          // Subscription/cap unavailability is retryable: only completed
          // Jev negatives and completed Haiku mines enter the bundle ledger.
          result.deferred++;
          continue;
        }

        const uniqueTheories = [...new Map(
          extracted.theories.map((theory) => [theory.theoryKey, theory]),
        ).values()];
        if (uniqueTheories.length === 0) {
          result.skipped++;
        } else {
          result.theoriesFound += uniqueTheories.length;
          for (const theory of uniqueTheories) {
            const upserted = await upsertTheoryCandidate(db, theory, {
              community: bareSub,
              threadId: post.postId,
              ...(post.permalink ? { permalink: post.permalink } : {}),
              score: post.numComments ?? post.comments.length,
              today,
            });
            if (upserted === null) {
              result.theoriesScreenedOut++;
            } else {
              result.theoriesUpserted++;
            }
          }
        }
        const { error } = await db.from('theory_mined_bundle').insert({
          bundle_key: bundleKey,
          thread_id: post.postId,
          comment_bucket: commentBucket(post),
          outcome: 'mined',
          theories_found: uniqueTheories.length,
        });
        if (error) throw new Error(`theory_mined_bundle insert failed: ${error.message}`);
      } catch (err) {
        errors.push(`theory-miner failed for post ${post.postId}: ${(err as Error).message}`);
      }
    }
  }

  return result;
}
