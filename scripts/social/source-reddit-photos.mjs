#!/usr/bin/env node
// Concert-photo sourcing adapter (kanban t_a66e5eb2, follow-up to
// t_e1d26de7/PR #4522). Discovers fan-taken concert photos on public
// concert-photo subreddits and emits a candidates JSON file in exactly the
// shape `import-photo-library.mjs --fetch` expects — this script never
// writes to the library itself and never touches the live social-posting
// pipeline (post-queue.mjs/delete-media.mjs).
//
// REUSE, PER JOEY'S STANDING "DON'T BUILD PARALLEL INFRA" DIRECTIVE:
//   - Reddit access: `scripts/lib/reddit-rss.mjs`'s existing no-auth
//     `.rss?sort=top&t=<range>` adapter — the exact one community-crawl.mjs
//     already uses for the Community Engine's own subreddit crawl. Same
//     `topPosts()` function, no second Reddit client.
//   - Reddit rate-limit avoidance: routed through the operator's home-relay
//     (skill `home-relay`), with the SAME mandatory randomized 1-11s pacing
//     before every relay request and never-retry-on-429 posture as
//     `crawl.mjs`'s `fetchFullTree`. This script talks to Reddit directly
//     (not via the relay) ONLY for the initial `.rss` listing fetch when the
//     relay is not configured — same graceful-degrade shape as crawl.mjs
//     (`relayReachable` gates the more sensitive path, never the whole
//     script). The `.rss` listing endpoint itself is not the one Reddit
//     aggressively blocks by IP (only comment-tree/`.json` fetches are);
//     confirmed live during design (2026-09-22): plain non-relay `.rss`
//     calls returned a 429 from this sandbox's own IP after a couple of
//     requests, so production runs should always route through the relay
//     when available, same posture as crawl.mjs.
//   - Landing point: this script's OUTPUT is a plain JSON array meant to be
//     passed straight to `import-photo-library.mjs --fetch --write`. It does
//     not import or duplicate any of that importer's dedup/validation logic.
//
// WHAT IT DOES NOT DO (by design, this card's scope):
//   - No X/Instagram/TikTok sourcing — none of those platforms has a
//     working no-auth public-fetch path proven anywhere in this repo
//     (apps/worker/src/sources/registry.ts's ADAPTER_REGISTRY has adapters
//     for rss/bluesky/reddit_rss/tumblr/gnews/site_diff only); doing so
//     would need a real logged-in session, a genuinely separate piece of
//     infrastructure with its own human-action dependency, not a rename of
//     something existing. See the design comment on kanban t_a66e5eb2.
//   - No credit/permission-request gate on ingestion — per the founder
//     decision recorded in docs/decisions.md (2026-09-22, kanban
//     t_e1d26de7), inherited unchanged by this card. `credit`/`source` are
//     still populated (Reddit post author + permalink) as data-quality
//     fields, never as a gate.
//   - No venue/date GUESSING beyond what a post's own title plainly states.
//     A wrong venue/date is worse than a missing one (`photo-coverage.mjs`
//     would misreport concentration), so `venue`/`date` are left undefined
//     whenever the title doesn't contain an unambiguous, known tour date —
//     `TOUR_DATE_HINTS` below is a small, explicit, reviewable list, not a
//     free-text date parser.
//
// Usage:
//   node scripts/social/source-reddit-photos.mjs --output candidates.json [--limit-per-sub 25] [--time year]
//
// Then:
//   node scripts/social/import-photo-library.mjs --input candidates.json --fetch --write

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { runMain } from '../lib/cli.mjs';
import { topPosts } from '../lib/reddit-rss.mjs';

/* global AbortSignal */ // Node 18+ global, same pragma as crawl.mjs

// Small, explicit, curated list — concert-photo-first subreddits. Deliberately
// NOT r/TaylorSwift (that sub's own rules exclude "low quality photos" but
// also mixes in a huge volume of non-photo discussion/news; its RSS top feed
// would need heavy filtering for low yield). erastour and
// TaylorSwiftPictures are both fan-photo-first communities.
export const CONCERT_PHOTO_SUBREDDITS = ['erastour', 'TaylorSwiftPictures'];

export const DEFAULT_LIMIT_PER_SUB = 25;
export const DEFAULT_TIME_RANGE = 'year';
// Same pacing contract as crawl.mjs's fetchFullTree — mandatory before
// every home-relay request, never a fixed interval.
export const RELAY_PACING_MIN_S = 1;
export const RELAY_PACING_MAX_S = 11;
export const RELAY_PROBE_TIMEOUT_MS = 5_000;

// Titles containing any of these are promo/studio/merch content, not a fan's
// own concert photo — skip them even though they showed up in a
// concert-photo-first subreddit's top feed. Conservative: erring toward
// skipping an ambiguous post costs volume, not correctness.
const NON_CONCERT_TITLE_RE =
  /\b(merch|merchandise|poster|album cover|vinyl|cd|photoshoot|magazine|billboard|red carpet|premiere)\b/i;

// A post whose title plainly signals a live show. Not required for
// inclusion (concert-photo-first subreddits are the real filter) — used only
// to boost confidence when tagging `tags: ['fan-photo']` vs leaving it bare.
const CONCERT_SIGNAL_RE = /\b(eras tour|concert|show|stage|live|tour stop|night \d+)\b/i;

// Known Eras Tour venue/date pairs a post title might explicitly name.
// Deliberately a small, reviewable, EXPLICIT list, never a free-text date
// parser — see module header. Extend this list in a reviewed PR as more
// shows are confirmed sourced from; never guess a date from a title alone.
export const TOUR_DATE_HINTS = [
  { re: /\binglewood\b/i, venue: 'SoFi Stadium, Inglewood, CA', date: '2023-08-05' },
  { re: /\bsingapore\b/i, venue: 'National Stadium, Singapore', date: '2024-03-08' },
  { re: /\bwembley\b/i, venue: 'Wembley Stadium, London', date: '2024-06-21' },
  { re: /\bvancouver\b/i, venue: 'BC Place, Vancouver', date: '2024-12-06' },
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomPacingMs(random = Math.random) {
  const span = RELAY_PACING_MAX_S - RELAY_PACING_MIN_S + 1;
  const seconds = Math.floor(random() * span) + RELAY_PACING_MIN_S;
  return seconds * 1_000;
}

/**
 * Reachability probe. Unlike crawl.mjs's probeHomeRelay (a bare-root GET
 * against its own relay, where an unconfigured target 5xxs meaningfully
 * differently from a down relay), THIS relay's proxy script always 502s on
 * an empty target path even when perfectly healthy (verified live during
 * design: the relay strips the leading `/` and tries to fetch an empty URL,
 * which is a data error inside a working process, not a sign the process is
 * unreachable). So "reachable" here means "the relay answered at all"
 * (any HTTP status, including a 502 from its own empty-target handling) —
 * a real connection failure/timeout is the only thing that reports `false`.
 * This never issues a second network hop to Reddit itself just to probe.
 */
export async function probeHomeRelay(
  relayUrl,
  { fetchImpl = fetch, timeoutMs = RELAY_PROBE_TIMEOUT_MS } = {},
) {
  if (!relayUrl) return false;
  try {
    await fetchImpl(relayUrl, { signal: AbortSignal.timeout(timeoutMs) });
    return true;
  } catch {
    return false;
  }
}

/**
 * A GET via `curl`, not undici's global `fetch`. The operator's home-relay
 * proxy script forwards the upstream response's headers verbatim AND sets
 * its own `Content-Length` from the buffered body — for a response whose
 * upstream headers already included one, that produces a duplicate
 * `Content-Length` header, which undici's `fetch` (strict HTTP/1.1 parsing)
 * rejects outright, EVEN with Node's `--insecure-http-parser` flag/
 * `insecureHTTPParser` option on the low-level `http` module (both verified
 * live during design against a real relay response — same
 * `HPE_UNEXPECTED_CONTENT_LENGTH`/"Duplicate Content-Length" parse error
 * either way). `curl` tolerates this natively (already the documented
 * verification tool in the `home-relay` skill itself, e.g.
 * "curl -m 5 http://<home-ip>:8888") and was used to confirm the relay data
 * itself is fine — only Node's own HTTP/1.1 parser is this strict about a
 * response most other clients pass through. Rather than patch the
 * operator's relay script (outside this repo, a separate always-on service
 * the home-relay skill documents as already working for every other
 * caller), this shells out to `curl` for relay requests only; direct
 * (non-relay) Reddit fetches still use the normal global `fetch`, unaffected.
 * `curl` ships on every GitHub Actions ubuntu-latest runner and every dev
 * environment this repo already assumes (`docs/dev-quickstart.md`), so this
 * adds no new dependency.
 */
const execFileAsync = promisify(execFile);
async function curlGet(requestUrl, headers = {}) {
  const headerArgs = Object.entries(headers).flatMap(([key, value]) => ['-H', `${key}: ${value}`]);
  const { stdout } = await execFileAsync(
    'curl',
    ['-sS', '-w', '\n__HTTP_STATUS__%{http_code}', '--max-time', '20', ...headerArgs, requestUrl],
    { maxBuffer: 1024 * 1024 * 20 },
  );
  const marker = '\n__HTTP_STATUS__';
  const markerIndex = stdout.lastIndexOf(marker);
  const body = markerIndex === -1 ? stdout : stdout.slice(0, markerIndex);
  const status = markerIndex === -1 ? 0 : Number(stdout.slice(markerIndex + marker.length).trim());
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    text: async () => body,
  };
}

/** Wraps a fetch call through the home-relay, applying mandatory pacing. */
function relayFetchImpl(relayUrl, { sleepImpl = wait, random = Math.random } = {}) {
  return async (targetUrl, init) => {
    await sleepImpl(randomPacingMs(random));
    const requestUrl = `${relayUrl.replace(/\/$/, '')}/${targetUrl}`;
    return curlGet(requestUrl, init?.headers);
  };
}

/** True when a post title is clearly promo/merch, not a fan's own concert photo. */
export function looksLikeNonConcertContent(title) {
  return NON_CONCERT_TITLE_RE.test(title ?? '');
}

/** Best-effort venue/date guess from a small explicit hint list — never invented. */
export function guessVenueDate(title) {
  for (const hint of TOUR_DATE_HINTS) {
    if (hint.re.test(title ?? '')) return { venue: hint.venue, date: hint.date };
  }
  return { venue: undefined, date: undefined };
}

/** Deterministic candidate id from subreddit + Reddit post id — stable across runs. */
export function candidateId(subreddit, postId) {
  return `reddit-${subreddit.toLowerCase()}-${postId}`;
}

/** Extracts the first real (non-thumbnail) image URL from a Reddit RSS post's outbound `url`. */
export function isDirectImageUrl(url) {
  return typeof url === 'string' && /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url);
}

function extFromUrl(url) {
  const match = /\.(jpe?g|png|gif|webp)(\?|$)/i.exec(url);
  return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

/**
 * Builds one candidate object in `import-photo-library.mjs --fetch`'s
 * exact expected shape. `id` doubles as a natural de-dup key (re-running
 * this script against the same post always yields the same id, so a
 * post already imported becomes a no-op re-import + the importer's own
 * content-hash dedup below still catches a re-shared duplicate photo
 * under a different post/id).
 */
export function buildCandidate(subreddit, post) {
  const ext = extFromUrl(post.url);
  const id = candidateId(subreddit, post.id);
  const { venue, date } = guessVenueDate(post.title);
  const tags = ['fan-photo', 'eras-tour'];
  if (CONCERT_SIGNAL_RE.test(post.title ?? '')) tags.push('concert');
  return {
    id,
    mediaPath: `/social/library/photos/${id}.${ext}`,
    credit: `u/${post.author ?? 'unknown'} via r/${subreddit}`,
    source: post.permalink,
    sourceUrl: post.url,
    alt: `Fan photo from the Eras Tour, shared on r/${subreddit}: ${(post.title ?? '').slice(0, 180)}`,
    tags,
    ...(venue ? { venue } : {}),
    ...(date ? { date } : {}),
  };
}

/**
 * Sources candidates from one subreddit's top-of-range feed. Skips posts
 * with no direct image URL (self-text, video-only, or a post whose "outbound
 * link" the RSS adapter resolved to its own permalink) and posts that read
 * as promo/merch rather than a fan's own concert photo.
 */
export async function sourceSubreddit(subreddit, { limit, time, fetchImpl, warn = console.warn } = {}) {
  const { posts, status } = await topPosts(subreddit, { time, limit, fetchImpl });
  if (status === 429) {
    warn(`source-reddit-photos: r/${subreddit} returned 429 — skipping this subreddit this run.`);
    return [];
  }
  const candidates = [];
  for (const post of posts) {
    if (!isDirectImageUrl(post.url)) continue;
    if (looksLikeNonConcertContent(post.title)) continue;
    candidates.push(buildCandidate(subreddit, post));
  }
  return candidates;
}

/** De-dupes candidates by id, keeping the first occurrence (stable order). */
export function dedupeById(candidates) {
  const seen = new Set();
  const out = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    out.push(candidate);
  }
  return out;
}

function parseArgs(argv) {
  const args = { limit: DEFAULT_LIMIT_PER_SUB, time: DEFAULT_TIME_RANGE, output: null, subreddits: CONCERT_PHOTO_SUBREDDITS };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--output') args.output = argv[++i];
    else if (arg === '--limit-per-sub') args.limit = Number(argv[++i]);
    else if (arg === '--time') args.time = argv[++i];
    else if (arg === '--subreddits') args.subreddits = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.output) {
    throw new Error(
      'Usage: node scripts/social/source-reddit-photos.mjs --output <candidates.json> [--limit-per-sub 25] [--time year] [--subreddits sub1,sub2]',
    );
  }

  const relayUrl = process.env.HOME_RELAY_URL || '';
  const relayReachable = await probeHomeRelay(relayUrl);
  const fetchImpl = relayReachable ? relayFetchImpl(relayUrl) : fetch;
  console.log(
    `source-reddit-photos: home-relay ${relayUrl ? (relayReachable ? 'reachable' : 'configured but unreachable') : 'not configured'} — ` +
      `${relayReachable ? 'routing Reddit fetches through it' : 'falling back to direct fetch (may 429 sooner)'}.`,
  );

  const all = [];
  for (const subreddit of args.subreddits) {
    const found = await sourceSubreddit(subreddit, { limit: args.limit, time: args.time, fetchImpl });
    console.log(`source-reddit-photos: r/${subreddit} — ${found.length} concert-photo candidate(s).`);
    all.push(...found);
  }

  const deduped = dedupeById(all);
  await mkdir(path.dirname(path.resolve(args.output)), { recursive: true });
  await writeFile(path.resolve(args.output), JSON.stringify(deduped, null, 2) + '\n');
  console.log(`source-reddit-photos: wrote ${deduped.length} candidate(s) to ${args.output}.`);
  return 0;
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/social/source-reddit-photos.mjs')
) {
  runMain(main, { name: 'source-reddit-photos' });
}
