// Facebook groups parser — turns a saved "Webpage, Complete" HTML export
// (proposal §4.7, PLAN.md Stage 6) into one `fan_signal`-shaped draft row.
// Pure/offline: no network or Facebook access of any kind. Since the
// 2026-09-30 owner decision, a deterministic local browser collector saves
// the file from Joey's personal account; this parser still only receives the
// saved HTML and never receives a credential or live browser handle.
//
// HONEST LIMITATION, read before trusting this against a real export:
// Facebook's saved-HTML structure was NOT available to verify this against
// — no Facebook account/group export exists in this build environment, and
// the automation has not completed its first real run. `extractPostsFromHtml`
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
  /** Member-visible post URL found in the saved export, tracking stripped; null when the block has none. */
  permalink?: string | null;
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

/** The handful of entities `stripTags` decodes, shared so an author name can
 * be decoded the same way the body text is before the two are compared.
 * `&amp;` is decoded LAST, so an input of `&amp;quot;` yields the literal
 * `&quot;` rather than being double-unescaped into `"`. */
function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits the export on `role="article"` boundaries — see module header for
 * why that attribute, not a CSS class, is the split point. Each resulting
 * block is treated as one post.
 *
 * Each block starts at the `<` of the tag CARRYING the attribute, not at the
 * attribute match itself: slicing from the attribute left every block
 * beginning with an unclosed tag fragment (`role="article" data-posinset="65">`)
 * which `stripTags`'s `/<[^>]+>/` could not match — so that markup leaked
 * verbatim into the derived text (issue #4885, bug 1).
 */
function articleBlocks(html: string): string[] {
  const marker = 'role="article"';
  const blocks: string[] = [];
  let match = html.indexOf(marker);
  while (match !== -1) {
    const nextMatch = html.indexOf(marker, match + marker.length);
    // Fall back to the attribute position itself if there is no enclosing
    // tag start (malformed input) rather than dropping the block.
    const tagStart = html.lastIndexOf('<', match);
    const start = tagStart === -1 ? match : tagStart;
    const nextTagStart = nextMatch === -1 ? -1 : html.lastIndexOf('<', nextMatch);
    const end = nextMatch === -1 ? html.length : nextTagStart === -1 ? nextMatch : nextTagStart;
    blocks.push(html.slice(start, end));
    match = nextMatch;
  }
  return blocks;
}

const REACTION_RE = /([\d,]+)\s*(?:reactions?|likes?)\b/i;
const COMMENT_RE = /([\d,]+)\s*comments?\b/i;
/**
 * A profile link, matched as a WHOLE unit — opening tag, visible anchor text
 * and closing tag — so the member's name is removed from the block in both
 * the `aria-label` attribute and the rendered text. Matching only the
 * attribute (the original `/aria-label="([^"]{2,80})"/`) left the identical
 * name sitting in the anchor's inner text, which `stripTags` keeps (it
 * strips tags, not tag contents), so real unhashed names of private group
 * members became the leading words of the derived post text (issue #4885,
 * bug 2 — privacy).
 */
const AUTHOR_ANCHOR_RE = /<a\b[^>]*\baria-label="([^"]{2,80})"[^>]*>([\s\S]*?)<\/a\s*>/gi;
/** Attribute-only fallback for a profile link with no closing `</a>` in the block. */
const AUTHOR_ATTR_RE = /\baria-label="([^"]{2,80})"/g;
/**
 * A profile link with NO `aria-label` at all, recognised by its href. Facebook
 * renders a @mention of another member this way, so without this the mentioned
 * person's name would survive in the text even though the poster's does not.
 *
 * Scoped to Facebook's OWN profile-link shapes — a root-relative
 * `/groups/<id>/user/<id>/`, `/profile.php?id=`, or `/people/<name>/<id>`, or
 * the same paths on a facebook.com host — so an outbound third-party link
 * whose path merely contains `/user/` or `/people/`
 * (`https://www.gq.com/people/taylor-swift`) keeps its visible text instead of
 * having it stripped and added to the redaction list.
 */
const FB_PROFILE_PATH = '(?:\\/groups\\/[^"\\/]+)?\\/(?:user\\/|profile\\.php|people\\/)';
const PROFILE_HREF_ANCHOR_RE = new RegExp(
  `<a\\b[^>]*\\bhref="(?:https?:\\/\\/(?:[a-z0-9-]+\\.)*facebook\\.com)?${FB_PROFILE_PATH}[^"]*"[^>]*>([\\s\\S]*?)<\\/a\\s*>`,
  'gi',
);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Removes every occurrence of each known author name from already-stripped
 * text. Belt-and-braces on top of dropping the profile links themselves:
 * Facebook repeats the poster's name outside the profile anchor too (e.g.
 * "<Name> shared a link", a "Reply to <Name>" affordance), and none of those
 * copies may survive into anything we persist.
 */
function redactNames(text: string, names: string[]): string {
  let out = text;
  for (const name of names) {
    const decoded = decodeEntities(name).trim();
    if (decoded.length < 2) continue;
    out = out.replace(new RegExp(escapeRegExp(decoded), 'gi'), ' ');
  }
  return out.replace(/\s+/g, ' ').trim();
}

const FB_ORIGIN = 'https://www.facebook.com';
const PERMALINK_HREF_RE =
  /href="([^"]*(?:\/posts\/[\w.-]+|\/permalink\/[\w.-]+|story_fbid=)[^"]*)"/i;
const KEEP_PERMALINK_PARAMS = new Set(['story_fbid', 'id']);

/**
 * The post's own permalink from a block's raw markup (read BEFORE profile
 * anchors are dropped), or null. Only facebook.com hosts; a /posts/ or
 * /permalink/ path keeps no query at all (comment_id and tracking go), a
 * story_fbid link keeps just story_fbid + id. It is a URL, never a member's
 * name, and profile links (/user/, /people/) never match.
 */
export function extractPermalink(block: string): string | null {
  const match = PERMALINK_HREF_RE.exec(block);
  if (!match?.[1]) return null;
  let url: URL;
  try {
    url = new URL(match[1].replace(/&amp;/g, '&'), FB_ORIGIN);
  } catch {
    return null;
  }
  if (!/^(?:[a-z0-9-]+\.)*facebook\.com$/i.test(url.hostname)) return null;
  if (!/\/(?:posts|permalink)\/[\w.-]+/.test(url.pathname)) {
    if (!url.searchParams.get('story_fbid')) return null;
    for (const key of [...url.searchParams.keys()])
      if (!KEEP_PERMALINK_PARAMS.has(key)) url.searchParams.delete(key);
  } else {
    url.search = '';
  }
  url.hash = '';
  url.protocol = 'https:';
  return url.toString();
}

function parseCount(match: RegExpMatchArray | null): number {
  if (!match?.[1]) return 0;
  return Number(match[1].replace(/,/g, '')) || 0;
}

/** Extracts one post per `role="article"` block. Never throws on malformed input — a block with no findable text is skipped, not fatal. */
export function extractPostsFromHtml(html: string): ParsedFacebookPost[] {
  const posts: ParsedFacebookPost[] = [];
  for (const block of articleBlocks(html)) {
    // Every profile link in the block is dropped as a whole unit (attribute
    // AND visible text); the first one is treated as the post's author for
    // the hash. Names are collected so any further copy of them outside an
    // anchor can be redacted from the derived text too.
    const names: string[] = [];
    let withoutAuthors = block.replace(AUTHOR_ANCHOR_RE, (_full, label: string) => {
      names.push(label);
      return ' ';
    });
    if (names.length === 0) {
      withoutAuthors = withoutAuthors.replace(AUTHOR_ATTR_RE, (_full, label: string) => {
        names.push(label);
        return ' ';
      });
    }
    const authorName = names[0];
    // A mentioned member's profile link carries no aria-label; drop those
    // anchors (and their visible text) too, but never count one as the author.
    withoutAuthors = withoutAuthors.replace(PROFILE_HREF_ANCHOR_RE, (_full, inner: string) => {
      const mentioned = stripTags(inner);
      if (mentioned.length >= 2 && mentioned.length <= 80) names.push(mentioned);
      return ' ';
    });
    const text = redactNames(stripTags(withoutAuthors), names);
    if (!text) continue;
    posts.push({
      text,
      reactionCount: parseCount(block.match(REACTION_RE)),
      commentCount: parseCount(block.match(COMMENT_RE)),
      authorHash: authorName ? hashAuthor(decodeEntities(authorName)) : null,
      permalink: extractPermalink(block),
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
  const heat =
    kept.length > 0 ? Math.min(1, (totalReactions + totalComments * 2) / MAX_REACTIONS_SIGNAL) : 0;

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
