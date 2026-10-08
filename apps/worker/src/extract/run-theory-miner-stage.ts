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
  permalink: string;
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
  deferred: number;
  errors: string[];
}

function bareSubredditName(watchlistId: string): string {
  return watchlistId.startsWith('reddit:') ? watchlistId.slice('reddit:'.length) : watchlistId;
}

export async function runTheoryMinerStage(
  db: SupabaseClient,
  artifact: CrawlArtifact,
): Promise<TheoryMinerStageResult> {
  const errors: string[] = [];
  const result: TheoryMinerStageResult = {
    bundlesConsidered: 0,
    theoriesFound: 0,
    theoriesUpserted: 0,
    theoriesScreenedOut: 0,
    skipped: 0,
    deferred: 0,
    errors,
  };

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
    const bareSub = bareSubredditName(sub.subreddit);
    for (const post of sub.posts) {
      result.bundlesConsidered++;
      try {
        const extracted = await extractFanTheories(usage, {
          subreddit: bareSub,
          postTitle: post.title,
          postId: post.postId,
          permalink: post.permalink,
          comments: commentsFromCrawlBundle(post.comments),
          symbolLexiconKeys,
          today,
        });

        if (extracted === null) {
          // No key, or the per-run/daily cap is reserved out — this bundle
          // is simply not retried (unlike run-extract-stage.ts's
          // news_story.extracted_at flag, the crawl artifact is transient
          // and gone in 24h, so there is no "leave it unmarked" state to
          // preserve here — it is dropped for this run, same as any other
          // post below the crawl's own heat/budget cut line).
          result.deferred++;
          continue;
        }

        if (extracted.theories.length === 0) {
          result.skipped++;
          continue;
        }

        result.theoriesFound += extracted.theories.length;
        for (const theory of extracted.theories) {
          const upserted = await upsertTheoryCandidate(db, theory, {
            community: bareSub,
            permalink: post.permalink,
            score: post.comments.length,
            today,
          });
          if (upserted === null) {
            result.theoriesScreenedOut++;
          } else {
            result.theoriesUpserted++;
          }
        }
      } catch (err) {
        errors.push(`theory-miner failed for post ${post.postId}: ${(err as Error).message}`);
      }
    }
  }

  return result;
}
