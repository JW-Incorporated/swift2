// RSS/Atom adapter — the only adapter shipped in this first pass. Zero cost,
// no API keys, no ToS ambiguity (see docs/proposals/2026-07-18-news-source-
// research.md for the sourced comparison against Reddit/X/YouTube/Bluesky,
// none of which are wired up yet — "which feeds/subreddits/APIs" is a
// product + ToS pass per the architecture proposal §9, not pre-built here).
// Google News search-query URLs are themselves RSS feeds, so they're
// configured as source_type "rss" too — no separate adapter needed.

import Parser from 'rss-parser';
import type { NormalizedNewsItem } from '@swift2/shared/news';
import type { NewsSourceRow, SourceAdapter } from './types';

const parser = new Parser({ timeout: 10_000 });

/** Per-source item cap — config, not a deploy (proposal §6). */
const MAX_ITEMS_PER_SOURCE = 30;

export const rssAdapter: SourceAdapter = {
  async fetch(source: NewsSourceRow): Promise<NormalizedNewsItem[]> {
    const url = source.config.url;
    if (typeof url !== 'string' || !url) {
      throw new Error(`rss source "${source.name}" has no config.url`);
    }
    const feed = await parser.parseURL(url);
    return (feed.items ?? [])
      .slice(0, MAX_ITEMS_PER_SOURCE)
      .map((item): NormalizedNewsItem => ({
        externalId: item.guid ?? item.link ?? item.title ?? '',
        url: item.link ?? '',
        title: item.title ?? '(untitled)',
        snippet: (item.contentSnippet ?? item.summary ?? item.content ?? '').slice(0, 2000),
        author: item.creator ?? item.author,
        publishedAt: item.isoDate,
        imageUrl: item.enclosure?.url,
      }))
      .filter((i) => i.externalId && i.url && i.title);
  },
};
