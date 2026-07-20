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

/**
 * `source` is a standard RSS 2.0 element that Google News sets on every item
 * (`<source url="https://www.forbes.com">Forbes</source>`). rss-parser does not
 * surface it by default, so ask for it explicitly. We were discarding the only
 * publisher attribution the feed gives us — see the 20260720000500 migration.
 */
// `author` is declared alongside `source` because naming the Item generic
// replaces rss-parser's permissive index signature — without it, fields the
// library does not declare (author among them) stop type-checking.
const parser = new Parser<unknown, { source?: unknown; author?: string }>({
  timeout: 10_000,
  customFields: { item: ['source'] },
});

/**
 * Pull publisher name/url out of an RSS `<source>` element.
 *
 * Shape depends on the parser's XML handling: a bare string when the element
 * has no attributes, or `{ _: 'Forbes', $: { url: '…' } }` when it does. Both
 * are handled, and anything unrecognised yields undefined rather than throwing
 * — a malformed element must not cost us the whole item.
 */
export function readPublisher(raw: unknown): { publisher?: string; publisherUrl?: string } {
  if (!raw) return {};
  if (typeof raw === 'string') {
    const name = raw.trim();
    return name ? { publisher: name } : {};
  }
  if (typeof raw === 'object') {
    const o = raw as { _?: unknown; $?: { url?: unknown }; url?: unknown };
    const name = typeof o._ === 'string' ? o._.trim() : undefined;
    const url = typeof o.$?.url === 'string' ? o.$.url : typeof o.url === 'string' ? o.url : undefined;
    return { publisher: name || undefined, publisherUrl: url || undefined };
  }
  return {};
}

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
        ...readPublisher(item.source),
      }))
      .filter((i) => i.externalId && i.url && i.title);
  },
};
