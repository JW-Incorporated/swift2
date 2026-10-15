import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchPostComments, type RedditComment } from '../sources/reddit-rss';
import type { ExtractCommentThread } from './types';
import type { ClusterSource } from './write-knowledge';

const MAX_COMMENT_FETCHES_PER_RUN = 40;

export interface PendingStory {
  id: string;
  canonical_title: string;
  summary: string | null;
  top_image_url: string | null;
}

export interface RawItem {
  id: string;
  title: string;
  snippet: string;
  url: string;
  sourceType?: string;
  fetchedCommentsAt: string | null;
  countdownTargetAt: string | null;
}

export interface CommentFetchState {
  urlCache: Map<string, Promise<RedditComment[]>>;
  fetchesRemaining: number;
}

export function createCommentFetchState(): CommentFetchState {
  return { urlCache: new Map(), fetchesRemaining: MAX_COMMENT_FETCHES_PER_RUN };
}

export async function loadRawItems(
  db: SupabaseClient,
  storyId: string,
): Promise<RawItem[]> {
  const { data, error } = await db
    .from('news_raw_item')
    .select('id, title, snippet, url, fetched_comments_at, countdown_target_at, news_source(source_type)')
    .eq('story_id', storyId)
    .limit(20);
  if (error) throw new Error(`raw item load failed for story ${storyId}: ${error.message}`);
  return (data ?? []).map((row) => {
    const relation = row.news_source as
      | { source_type?: string }
      | { source_type?: string }[]
      | null;
    const source = Array.isArray(relation) ? relation[0] : relation;
    return {
      id: row.id as string,
      title: row.title as string,
      snippet: (row.snippet as string) ?? '',
      url: row.url as string,
      sourceType: source?.source_type,
      fetchedCommentsAt: (row.fetched_comments_at as string | null) ?? null,
      countdownTargetAt: (row.countdown_target_at as string | null) ?? null,
    };
  });
}

export async function loadCommentThreads(
  db: SupabaseClient,
  items: readonly RawItem[],
  storyId: string,
  state: CommentFetchState,
): Promise<ExtractCommentThread[]> {
  const threads = await Promise.all(
    items
      .filter((item) => item.sourceType === 'reddit_rss')
      .map(async (item): Promise<ExtractCommentThread | null> => {
        if (item.fetchedCommentsAt) return null;
        let pending = state.urlCache.get(item.url);
        if (!pending) {
          if (state.fetchesRemaining <= 0) return null;
          state.fetchesRemaining -= 1;
          pending = fetchPostComments(item.url);
          state.urlCache.set(item.url, pending);
        }
        try {
          const comments = await pending;
          const { error: stampError } = await db
            .from('news_raw_item')
            .update({ fetched_comments_at: new Date().toISOString() })
            .eq('id', item.id);
          if (stampError) {
            console.error(
              `could not stamp fetched_comments_at for raw item ${item.id}: ${stampError.message}`,
            );
          }
          if (comments.length === 0) return null;
          return {
            postTitle: item.title,
            comments: comments.map((comment) => comment.body),
          };
        } catch (error) {
          console.error(
            `reddit comment context unavailable for story ${storyId}: ${(error as Error).message}`,
          );
          return null;
        }
      }),
  );
  return threads.filter((thread): thread is ExtractCommentThread => thread !== null);
}

export async function loadClusterSources(
  db: SupabaseClient,
  storyId: string,
): Promise<ClusterSource[]> {
  const { data, error } = await db
    .from('news_story_source')
    .select('outlet_name, url, tier')
    .eq('story_id', storyId);
  if (error) throw new Error(`story source load failed for story ${storyId}: ${error.message}`);
  return (data ?? []).map((row) => ({
    outletName: row.outlet_name as string,
    url: row.url as string,
    tier: row.tier as ClusterSource['tier'],
  }));
}
