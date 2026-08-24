// Facebook groups parser — turns a saved "Webpage, Complete" HTML export
// (proposal §4.7, PLAN.md Stage 6) into one `fan_signal`-shaped draft row.
// Pure/offline: no network, no Facebook access of any kind (Facebook has no
// API for groups an account doesn't administer and prohibits *automated*
// collection — this only ever processes a file Joey saved by hand in a
// normal logged-in browser, per that section's rule).
//
// HONEST LIMITATION, read before trusting this against a real export:
// Facebook's saved-HTML structure was NOT available to verify this against
// — no Facebook account/group export exists in this build environment, and
// creating one is outside what an agent may do unattended (CLAUDE.md
// Decision Authority: no signing up for services). `extractPostsFromHtml`
// targets `role="article"` post containers and `aria-label` profile links —
// both long-standing Facebook accessibility attributes, chosen because
// they're far more stable across Facebook's markup changes than its
// hashed/rotating CSS class names, but this is a best-known-structure
// design, not a verified one. If the first real export parses to zero posts,
// that's the signal to retune the regexes against that real file — flagged
// in HUMAN-ACTIONS.md.
//
// Redline-screened per post (packages/shared/src/redline.ts's screenTopic,
// Stage 2) — a flagged post is dropped entirely, never counted toward
// volume/heat/summary, matching the site-wide "screen before it enters the
// store" rule. Author names are hashed, never stored raw. No comment
// bodies, no individual post text kept beyond this file's own process —
// only the aggregate numbers below ever reach `fan_signal`.
//
// GROUND-TRUTH NOTE: the proposal text (§4.7) describes the resulting row as
// carrying `source_tier:'unverified'`, but the landed fan_signal schema
// (20260901000000_knowledge_engine.sql, Stage 2) has no `source_tier`
// column at all — only current_item does. This draft matches the REAL
// schema; `source_tier` is omitted rather than invented.

import { createHash } from 'node:crypto';
import { screenTopic } from '@swift2/shared/redline';

const WINDOW_DAYS = 7;
const MAX_REACTIONS_SIGNAL = 500; // placeholder scale — see heat comment below

export interface ParsedFacebookPost {
  text: string;
  reactionCount: number;
  commentCount: number;
  authorHash: string | null;
}

/** `fan_signal`-shaped draft — a future extract-stage write path inserts this, this module only produces it. */
export interface FanSignalDraft {
  platform: 'facebook';
  community: string; // `facebook:<group-slug>`
  topic: string;
  summary: string;
  volume: number;
  heat: number;
  stance_mix: Record<string, never>;
  symbols: string[];
  theory_ids: string[];
  current_item_ids: string[];
  sample_urls: string[]; // always [] — private groups have no public permalink to cite
  window_start: string;
  window_end: string;
  redline_ok: boolean;
}

function hashAuthor(name: string): string {
  return createHash('sha256').update(name.trim().toLowerCase()).digest('hex').slice(0, 16);
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits the export on `role="article"` boundaries — see module header for
 * why that attribute, not a CSS class, is the split point. Each resulting
 * block is treated as one post.
 */
function articleBlocks(html: string): string[] {
  const marker = 'role="article"';
  const blocks: string[] = [];
  let start = html.indexOf(marker);
  while (start !== -1) {
    const nextStart = html.indexOf(marker, start + marker.length);
    const end = nextStart === -1 ? html.length : nextStart;
    blocks.push(html.slice(start, end));
    start = nextStart;
  }
  return blocks;
}

const REACTION_RE = /([\d,]+)\s*(?:reactions?|likes?)\b/i;
const COMMENT_RE = /([\d,]+)\s*comments?\b/i;
const AUTHOR_RE = /aria-label="([^"]{2,80})"/;

function parseCount(match: RegExpMatchArray | null): number {
  if (!match?.[1]) return 0;
  return Number(match[1].replace(/,/g, '')) || 0;
}

/** Extracts one post per `role="article"` block. Never throws on malformed input — a block with no findable text is skipped, not fatal. */
export function extractPostsFromHtml(html: string): ParsedFacebookPost[] {
  const posts: ParsedFacebookPost[] = [];
  for (const block of articleBlocks(html)) {
    const authorMatch = block.match(AUTHOR_RE);
    const authorName = authorMatch?.[1];
    // Author label (if present) usually leads the block — strip it out of
    // the body text so it isn't double-counted as post content.
    const withoutAuthorTag = authorMatch ? block.replace(authorMatch[0], '') : block;
    const text = stripTags(withoutAuthorTag);
    if (!text) continue;
    posts.push({
      text,
      reactionCount: parseCount(block.match(REACTION_RE)),
      commentCount: parseCount(block.match(COMMENT_RE)),
      authorHash: authorName ? hashAuthor(authorName) : null,
    });
  }
  return posts;
}

/**
 * Parses one saved export into a single `fan_signal`-shaped draft row
 * (one row per weekly export per group — the extract stage clusters/merges
 * across sources later, this module only produces this file's own slice).
 */
export function parseFacebookExport(
  html: string,
  opts: { groupSlug: string; exportedAt?: Date },
): FanSignalDraft {
  const exportedAt = opts.exportedAt ?? new Date();
  const windowEnd = exportedAt;
  const windowStart = new Date(exportedAt.getTime() - WINDOW_DAYS * 86_400_000);

  const allPosts = extractPostsFromHtml(html);
  const kept = allPosts.filter((post) => screenTopic(post.text) === null);

  const totalReactions = kept.reduce((sum, p) => sum + p.reactionCount, 0);
  const totalComments = kept.reduce((sum, p) => sum + p.commentCount, 0);
  // Placeholder scale, not the real cross-source heat model (that lands with
  // the extract stage) — just enough signal that a busy week outranks a
  // quiet one until then.
  const heat = kept.length > 0 ? Math.min(1, (totalReactions + totalComments * 2) / MAX_REACTIONS_SIGNAL) : 0;

  return {
    platform: 'facebook',
    community: `facebook:${opts.groupSlug}`,
    topic: `Weekly export — ${opts.groupSlug}`,
    summary:
      kept.length > 0
        ? `${kept.length} post(s) saved from this week's export`
        : 'no postable content in this export (all screened out or none found)',
    volume: kept.length,
    heat,
    stance_mix: {},
    symbols: [],
    theory_ids: [],
    current_item_ids: [],
    sample_urls: [],
    window_start: windowStart.toISOString(),
    window_end: windowEnd.toISOString(),
    redline_ok: true, // every post in this draft already survived screenTopic
  };
}
