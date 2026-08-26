import type { SourceAdapter } from './types';
import { rssAdapter } from './rss';
import { blueskyAdapter } from './bluesky';
import { redditRssAdapter } from './reddit-rss';
import { tumblrAdapter } from './tumblr';
import { gnewsAdapter } from './gnews';

/** source_type -> adapter. Google News search-query URLs are RSS feeds. */
const ADAPTER_REGISTRY: Record<string, SourceAdapter> = {
  rss: rssAdapter,
  google_news: rssAdapter,
  bluesky: blueskyAdapter,
  reddit_rss: redditRssAdapter,
  tumblr: tumblrAdapter,
  gnews: gnewsAdapter,
};

export function getAdapter(sourceType: string): SourceAdapter | undefined {
  return ADAPTER_REGISTRY[sourceType];
}
