import type { SourceAdapter } from './types';
import { rssAdapter } from './rss';

/** source_type -> adapter. Google News search-query URLs are RSS feeds. */
const ADAPTER_REGISTRY: Record<string, SourceAdapter> = {
  rss: rssAdapter,
  google_news: rssAdapter,
};

export function getAdapter(sourceType: string): SourceAdapter | undefined {
  return ADAPTER_REGISTRY[sourceType];
}
