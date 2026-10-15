import type { SourceAdapter } from './types';
import { rssAdapter } from './rss';
import { blueskyAdapter } from './bluesky';
import { redditRssAdapter } from './reddit-rss';
import { tumblrAdapter } from './tumblr';
import { gnewsAdapter } from './gnews';
import { siteDiffAdapter } from './site-diff';

export interface PrimarySourceDefinition {
  name: string;
  sourceType: 'rss' | 'google_news' | 'site_diff';
  tier: 'official' | 'established' | 'unverified';
  url: string;
  requiredMention?: string;
}

/** One network request per entry per fast cycle; mirrored by the source seed migration. */
export const PRIMARY_SOURCES: readonly PrimarySourceDefinition[] = [
  {
    name: 'Taylor Swift — official YouTube channel',
    sourceType: 'rss',
    tier: 'official',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCqECaJ8Gagnn7YCbPEzWH6g',
  },
  {
    name: 'Taylor Swift — official site',
    sourceType: 'site_diff',
    tier: 'official',
    url: 'https://www.taylorswift.com/',
  },
  {
    name: 'Taylor Swift — official store',
    sourceType: 'site_diff',
    tier: 'official',
    url: 'https://store.taylorswift.com/',
  },
  {
    name: 'Google News — "Taylor Swift" fast lane',
    sourceType: 'google_news',
    tier: 'unverified',
    url: 'https://news.google.com/rss/search?q=%22Taylor+Swift%22&hl=en-US&gl=US&ceid=US:en&scoring=n',
  },
  {
    name: 'Republic Records — press feed',
    sourceType: 'rss',
    tier: 'established',
    url: 'https://www.republicrecords.com/blogs/news.atom',
    requiredMention: 'Taylor Swift',
  },
  {
    name: 'Universal Music Group — press feed',
    sourceType: 'rss',
    tier: 'established',
    url: 'https://www.universalmusic.com/feed/',
    requiredMention: 'Taylor Swift',
  },
];

/** source_type -> adapter. Google News search-query URLs are RSS feeds. */
const ADAPTER_REGISTRY: Record<string, SourceAdapter> = {
  rss: rssAdapter,
  google_news: rssAdapter,
  bluesky: blueskyAdapter,
  reddit_rss: redditRssAdapter,
  tumblr: tumblrAdapter,
  gnews: gnewsAdapter,
  site_diff: siteDiffAdapter,
};

export function getAdapter(sourceType: string): SourceAdapter | undefined {
  return ADAPTER_REGISTRY[sourceType];
}
