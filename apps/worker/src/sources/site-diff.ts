// site-diff adapter — proposal §4.3 ("HTML diff every run, new SKUs,
// countdowns, hidden strings — a classic egg surface"), design approved on
// t_09dc269f. Polls taylorswift.com (or store.taylorswift.com — whichever
// URL the news_source row's config points at; one source row per page, same
// "adding a feed is a data change" convention as every other adapter) on
// the existing 4h knowledge-engine cadence (Joey, 2026-09-22: option B —
// no tighter conditional poll). Diffs the fetched HTML's hash against the
// last-seen hash (site_diff_snapshot, one row per source — never the whole
// page, to keep the row small) and emits one NormalizedNewsItem per run
// when the page changed, carrying a deterministically parsed countdown
// target when the markup has one.
//
// Countdown detection is a heuristic, refined once real markup is seen (per
// this card's own instruction): look for a `data-countdown`/
// `data-countdown-target`/`data-reveal-at` attribute value, or a visible
// epoch/ISO timestamp inside an element whose class/id mentions "countdown"
// or "timer". Any of these forms is accepted as long as it parses to a
// FUTURE timestamp — a past or unparseable value is not a live countdown.
//
// Resolution (clearing countdown_resolved_at): the extract stage owns
// writing current_item rows, so it cannot see "this specific countdown is
// gone" on its own — this adapter reports whether the site CURRENTLY shows
// a countdown at all via `siteHasCountdown`, and write-knowledge.ts (or its
// caller) is responsible for resolving any current_item rows whose
// countdown the site no longer shows. See resolveVanishedCountdowns below,
// called from the pipeline after extraction (run-cycle.ts).

import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { NormalizedNewsItem } from '@swift2/shared/news';
import type { NewsSourceRow, SourceAdapter } from './types';
import { createWorkerDbClient } from '../db/client';

const MAX_HTML_BYTES = 2_000_000; // sanity ceiling; taylorswift.com is nowhere near this

/** sha256 of the raw page body — the ONLY thing persisted across runs
 * (site_diff_snapshot.content_hash), never the page itself. */
export function hashHtml(html: string): string {
  return createHash('sha256').update(html).digest('hex');
}

/**
 * Countdown markers this heuristic recognizes, in priority order:
 *   1. `data-countdown-target="<epoch-ms|epoch-s|ISO>"` (or `data-countdown`,
 *      `data-reveal-at`) on ANY element.
 *   2. A `<time datetime="...">` inside an element whose class/id contains
 *      "countdown" or "timer".
 * Returns the earliest FUTURE target found, or undefined. A past timestamp
 * is treated as a stale/resolved countdown still in the markup, not a live
 * one — never surfaced as countdownTargetAt.
 */
export function detectCountdownTarget(html: string, nowMs: number = Date.now()): string | undefined {
  const candidates: number[] = [];

  const attrPattern = /data-(?:countdown-target|countdown|reveal-at)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(attrPattern)) {
    const parsed = parseTimestampCandidate(match[1] ?? '');
    if (parsed !== undefined) candidates.push(parsed);
  }

  // `<time>` elements nested in a countdown/timer-labelled container. Cheap
  // heuristic, not a real DOM parse: scan for `class="..."`/`id="..."`
  // attributes mentioning countdown/timer within ~300 chars of a
  // `datetime="..."` attribute on a following `<time>` tag.
  const timerBlockPattern = /(?:class|id)=["'][^"']*(?:countdown|timer)[^"']*["'][\s\S]{0,300}?<time[^>]*datetime=["']([^"']+)["']/gi;
  for (const match of html.matchAll(timerBlockPattern)) {
    const parsed = parseTimestampCandidate(match[1] ?? '');
    if (parsed !== undefined) candidates.push(parsed);
  }

  const future = candidates.filter((ms) => ms > nowMs);
  if (future.length === 0) return undefined;
  return new Date(Math.min(...future)).toISOString();
}

function parseTimestampCandidate(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  // Pure digits: epoch. 10 digits ~= seconds, 13 ~= milliseconds.
  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed);
    const ms = trimmed.length <= 10 ? n * 1000 : n;
    return Number.isFinite(ms) ? ms : undefined;
  }
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export interface SiteDiffSnapshotStore {
  getHash(sourceId: string): Promise<string | undefined>;
  setHash(sourceId: string, hash: string): Promise<void>;
}

export function supabaseSiteDiffSnapshotStore(db: SupabaseClient): SiteDiffSnapshotStore {
  return {
    async getHash(sourceId: string) {
      const { data, error } = await db
        .from('site_diff_snapshot')
        .select('content_hash')
        .eq('source_id', sourceId)
        .maybeSingle();
      if (error) throw new Error(`site_diff_snapshot read failed: ${error.message}`);
      return (data?.content_hash as string | undefined) ?? undefined;
    },
    async setHash(sourceId: string, hash: string) {
      const { error } = await db
        .from('site_diff_snapshot')
        .upsert({ source_id: sourceId, content_hash: hash, updated_at: new Date().toISOString() });
      if (error) throw new Error(`site_diff_snapshot write failed: ${error.message}`);
    },
  };
}

/** Lazily built so importing this module never requires worker DB env vars
 * (e.g. in tests) — same convention as gnews.ts's `workerDb()`. */
let cachedStore: SiteDiffSnapshotStore | undefined;
function defaultStore(): SiteDiffSnapshotStore {
  if (!cachedStore) cachedStore = supabaseSiteDiffSnapshotStore(createWorkerDbClient());
  return cachedStore;
}

/**
 * Core fetch-and-diff logic, DB/store injected so it's unit-testable without
 * a real Supabase connection (same shape as tumblr.ts's fetchTumblrTag /
 * bluesky.ts's fetchBlueskyPosts).
 */
export async function fetchSiteDiff(
  source: NewsSourceRow,
  store: SiteDiffSnapshotStore,
  fetchImpl: typeof fetch = fetch,
): Promise<NormalizedNewsItem[]> {
  const url = source.config.url;
  if (typeof url !== 'string' || !url) {
    throw new Error(`site_diff source "${source.name}" has no config.url`);
  }

  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`site_diff fetch failed for "${source.name}" (${res.status})`);
  }
  const html = (await res.text()).slice(0, MAX_HTML_BYTES);
  const hash = hashHtml(html);

  const previousHash = await store.getHash(source.id);
  await store.setHash(source.id, hash);

  if (previousHash === undefined) {
    // First-ever poll of this source: nothing to diff against yet. Still
    // worth checking for a countdown already live on first sight, so a
    // countdown that predates this adapter's deployment is caught
    // immediately rather than waiting for the NEXT change.
    const countdownTargetAt = detectCountdownTarget(html);
    if (!countdownTargetAt) return [];
    return [buildCountdownItem(url, hash, countdownTargetAt)];
  }

  if (previousHash === hash) return []; // no change since last poll — the common case

  const countdownTargetAt = detectCountdownTarget(html);
  if (countdownTargetAt) return [buildCountdownItem(url, hash, countdownTargetAt)];

  // A structural change with no countdown marker — still worth a
  // NormalizedNewsItem (proposal: "new SKUs, hidden strings — a classic egg
  // surface"), just without a countdown target.
  return [
    {
      externalId: `site-diff:${source.id}:${hash}`,
      url,
      title: `${source.name}: page changed`,
      snippet: 'Automated detection: the page content changed since the last check.',
      publishedAt: new Date().toISOString(),
    },
  ];
}

function buildCountdownItem(url: string, hash: string, countdownTargetAt: string): NormalizedNewsItem {
  return {
    externalId: `site-diff:countdown:${url}:${hash}`,
    url,
    title: 'Countdown detected on taylorswift.com',
    snippet: `A live countdown was detected, targeting ${countdownTargetAt}.`,
    publishedAt: new Date().toISOString(),
    countdownTargetAt,
  };
}

/**
 * Whether the given HTML currently shows a live (future) countdown at all —
 * used by the pipeline's resolution sweep (run-cycle.ts) to clear
 * `current_item.countdown_resolved_at` once the site's countdown markup is
 * gone, independent of whether THIS run's diff produced a new item.
 */
export function siteHasCountdown(html: string, nowMs: number = Date.now()): boolean {
  return detectCountdownTarget(html, nowMs) !== undefined;
}

export const siteDiffAdapter: SourceAdapter = {
  async fetch(source: NewsSourceRow): Promise<NormalizedNewsItem[]> {
    return fetchSiteDiff(source, defaultStore());
  },
};

/**
 * Auto-clear sweep (t_09dc269f's approved design §3): re-checks every
 * enabled `site_diff` source's CURRENT page for a live countdown, and if
 * NONE of them show one, sets `countdown_resolved_at` on every still-open
 * `current_item` countdown row in the given era. Deliberately independent
 * of this cycle's diff result — the diff only fires on a hash change, but
 * resolution must be checked every run regardless (a countdown that quietly
 * disappeared without any OTHER page change must still resolve). Called
 * once per cycle from the extract stage, same stage-isolation discipline
 * (wrapped in try/catch by the caller) as `abandonQuietTheories`.
 */
export async function resolveVanishedCountdowns(
  db: SupabaseClient,
  eraId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<number> {
  const { data: sources, error: sourcesError } = await db
    .from('news_source')
    .select('id, config')
    .eq('source_type', 'site_diff')
    .eq('is_enabled', true);
  if (sourcesError) throw new Error(`site_diff source load failed: ${sourcesError.message}`);
  if (!sources || sources.length === 0) return 0;

  // No open countdown rows at all — nothing to resolve, skip the network
  // calls entirely (the common case, 90+% of runs).
  const { data: openRows, error: openError } = await db
    .from('current_item')
    .select('id')
    .eq('era_id', eraId)
    .not('countdown_target_at', 'is', null)
    .is('countdown_resolved_at', null)
    .limit(1);
  if (openError) throw new Error(`open-countdown lookup failed: ${openError.message}`);
  if (!openRows || openRows.length === 0) return 0;

  let anyStillLive = false;
  for (const source of sources) {
    const url = (source.config as { url?: unknown })?.url;
    if (typeof url !== 'string' || !url) continue;
    try {
      const res = await fetchImpl(url);
      if (!res.ok) continue; // a fetch failure here must never falsely resolve a live countdown
      const html = await res.text();
      if (siteHasCountdown(html)) {
        anyStillLive = true;
        break;
      }
    } catch {
      // Network error: treat as "unknown", never as "resolved" — a fetch
      // failure must not falsely clear a still-live countdown.
      anyStillLive = true;
      break;
    }
  }
  if (anyStillLive) return 0;

  const { data: resolved, error: resolveError } = await db
    .from('current_item')
    .update({ countdown_resolved_at: new Date().toISOString() })
    .eq('era_id', eraId)
    .not('countdown_target_at', 'is', null)
    .is('countdown_resolved_at', null)
    .select('id');
  if (resolveError) throw new Error(`countdown resolve failed: ${resolveError.message}`);
  return resolved?.length ?? 0;
}
