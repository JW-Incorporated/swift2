#!/usr/bin/env node
// Draft-time quality gate for social/queue/**.json — see social/README.md's
// "Draft-time checks" section. This is now the MAIN quality gate for what
// ships (WS1+WS5, 2026-08-11): the post-time guards in lib/queue.mjs exist
// to stop a bad draft from posting wrong, but by the time a draft is posting
// it has already sat in the queue occupying a slot for potentially days —
// this catches the same classes of problem before the draft's PR ever
// merges, which is strictly cheaper.
//
// Five independent rule families:
//   - schema        — body/platform/scheduledAt must be well-formed BEFORE
//                     any other rule runs (they all assume valid shapes).
//   - voice        — reuses scripts/content-engine/checkers/voice.mjs's
//                     surname-overuse / ai-tell / wire-attribution rules
//                     verbatim against the draft's body (not re-implemented).
//   - openers       — bans the "did you know" formula opener outright, and
//                     flags a draft whose first 6 words match the opening of
//                     any post from the last 14 days or any other queue item.
//   - campaign pair — the hard pairing rule (Joey, 2026-08-25, made
//                     UNCONDITIONAL 2026-08-26): a draft whose `campaign` has
//                     no sibling on the OTHER platform in social/queue/ or
//                     social/posted/ fails, full stop — there is no
//                     single-platform exception of any kind. Added
//                     2026-08-26 after a full day shipped five X posts and
//                     zero Instagram ones — the rule existed in prose and as
//                     an advisory P2 finding, but nothing on the merge path
//                     enforced it. The gate briefly honored a
//                     `Single-platform exception:` marker for a genuine
//                     format incompatibility, but that carve-out was itself
//                     the pretext both of that day's X-only drafts used
//                     ("the calendar assigns this subject to X only") — Joey
//                     closed it same-day: "Always an IG copy. Always." See
//                     checkCampaignPair.
//   - cross-post copy — an X draft that reads as a near-clone of its IG
//                     sibling (same `campaign`, or the closest same-day IG
//                     item when no campaign is set) reads as spam and risks
//                     X's duplicate-content 403 — still worth blocking on its
//                     own merits, even though it turned out NOT to be the
//                     cause of the 11 social/failed/ items as of 2026-08-11
//                     (see the `length` rule below — corrected 2026-08-11,
//                     same day: every one of those 11 was a generic 403 from
//                     exceeding X's 280-character *weighted* length, not
//                     duplicate content — see docs/decisions.md).
//   - length        — X drafts only. X counts a tweet's length by its own
//                     "weighted" rule, not raw JS string length: any
//                     autolinked URL counts as exactly 23 characters
//                     regardless of its real length, most emoji/CJK count as
//                     2, everything else counts as 1 (see
//                     weightedTweetLength below). HARD FAILS over 280
//                     weighted (X's real limit — this is what actually
//                     produced the 11 social/failed/ 403s), WARNS over 270
//                     (non-fatal — gives headroom before the hard limit).
//   - media         — IG drafts must have media; every media path must
//                     exist under apps/web/public/, be a .png/.jpg/.jpeg
//                     (the only formats this pipeline ever produces or
//                     uploads to X); media must not repeat the last 10
//                     posted Instagram items. THE TAYLOR-PHOTO STANDARD
//                     (2026-08-12): generic era tiles are banned outright,
//                     and every draft with media must declare mediaKind —
//                     "photo" (a real credited photograph of Taylor, with
//                     mediaCredit + mediaSource) or "site-screen" (a
//                     deliberate product screenshot under /social/library/).
//
// Usage:
//   node scripts/social/check-drafts.mjs                    # checks every file in social/queue/
//   node scripts/social/check-drafts.mjs <file> [file…]      # checks only the given files
//   node scripts/social/check-drafts.mjs --manifest <path>   # checks the files listed in a JSON
//     array file — what .github/workflows/auto-merge-content.yml passes
//     (never a raw shell-split arg list: a filename containing a space must
//     never silently become two bogus paths). Either form's file paths may
//     be repo-relative or absolute. Only checking a PR's own changed files
//     (not the whole directory) means tightening a rule after older items
//     already shipped doesn't retroactively fail every future PR that
//     merely touches social/queue/ near them.
//
// A requested-but-unresolvable target (doesn't exist under social/queue/) is
// a HARD failure, not a warning — silently checking nothing and exiting 0
// would be a false green.
//
// Exits non-zero with a readable findings list if anything fails.

import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkSurnameOveruse, checkAiTells, checkWireAttribution } from '../content-engine/checkers/voice.mjs';
import { imageMeta } from '../content-engine/checkers/image-liveness.mjs';
import { isGenericEraArt, repeatsRecentIgMedia, isValidScheduledAt, utcDateOnly } from './lib/queue.mjs';
import { MAX_X_IMAGES } from './lib/platforms.mjs';
import { weightedTweetLength, WEIGHTED_URL_LENGTH } from './lib/x-length.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const QUEUE_DIR = path.join(ROOT, 'social', 'queue');
const POSTED_DIR = path.join(ROOT, 'social', 'posted');
const PUBLIC_DIR = path.join(ROOT, 'apps', 'web', 'public');

const OPENER_WORDS = 6;
const POSTED_LOOKBACK_DAYS = 14;
const SIBLING_SIMILARITY_THRESHOLD = 0.8;
// A same-day IG item this similar to an X draft with no shared `campaign`
// is worth flagging as "probably should have been tagged," even below the
// near-duplicate threshold above — see checkCrossPostCopy's fallback path.
const PAIRED_LOOKING_FLOOR = 0.15;
const ERA_ART_LOOKBACK = 10;
const RECOGNIZED_PLATFORMS = new Set(['x', 'instagram']);
const ALLOWED_MEDIA_EXTENSIONS = new Set(['png', 'jpg', 'jpeg']);
// Where rehosted real photographs of Taylor live (the 2026-08-12 standard).
// mediaKind "photo" is path-bound to this prefix, and "site-screen" is barred
// from it — see the kind checks in checkMedia.
const PHOTO_PREFIX = '/social/library/photos/';
// Instagram rejects a feed image whose aspect ratio (width/height) falls
// outside ~0.8 (4:5 portrait) to 1.91 (landscape) — API error_subcode
// 2207009 / code 36003, "the aspect ratio is not supported". X has no such
// limit, so this gate is Instagram-only. Nine days of IG posts (15–23 Aug
// 2026) died silently on this: eight/nine 780x1688 site screenshots (ratio
// 0.462) were queued and rejected while nothing inspected image shape
// (social/calendar.md). 1080x1350 = exactly 0.8 and publishes.
const IG_MIN_ASPECT_RATIO = 0.8;
const IG_MAX_ASPECT_RATIO = 1.91;

// X's own length limit — see checkLength/weightedTweetLength below for the
// full story. HARD_LIMIT is X's real cap; anything past it gets rejected
// with a generic 403 (this is what actually broke the 11 social/failed/
// items, corrected 2026-08-11). WARN_THRESHOLD is a self-imposed target with
// headroom, not an X rule — flagged as non-fatal.
const X_WEIGHTED_LENGTH_HARD_LIMIT = 280;
const X_WEIGHTED_LENGTH_WARN_THRESHOLD = 270;
// Findings that are advisory, not fatal, are tagged with this prefix so
// main() can tell the two apart without a richer finding-object shape (every
// other rule family here already returns plain strings) — see checkLength
// and main()'s severity split below.
const WARNING_PREFIX = 'length: warning —';

async function readJsonDir(dir) {
  let files;
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const out = [];
  for (const file of files) {
    const full = path.join(dir, file);
    out.push({ file, full, data: JSON.parse(await readFile(full, 'utf-8')) });
  }
  return out;
}

/**
 * Strips leading non-letter characters (punctuation, smart quotes, emoji,
 * digits, whitespace — anything that isn't a Unicode letter) down to the
 * first real word, then lowercases. Used before both the "did you know"
 * opener ban and the first-N-words formula match, so a body that opens with
 * a quote mark or emoji before the real text isn't silently exempt from
 * either check.
 */
function normalizeOpener(text) {
  return String(text ?? '')
    .replace(/^[^\p{L}]+/u, '')
    .trim()
    .toLowerCase();
}

function firstWords(text, n) {
  const normalized = normalizeOpener(text).replace(/\s+/g, ' ');
  return normalized.split(' ').filter(Boolean).slice(0, n).join(' ');
}

function tokenSet(text) {
  return new Set(
    String(text ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean),
  );
}

// Very short texts need a token floor before the overlap coefficient below
// is trustworthy: two 2-word bodies that happen to share both words look
// "100% similar" by pure set overlap, which is noise, not a real signal —
// added 2026-08-11 (Codex review round 1 on PR #1900).
const MIN_TOKENS_FOR_SIMILARITY = 4;

// Word-level OVERLAP coefficient (intersection / size of the SMALLER set),
// not Jaccard (intersection / union). An X sibling is deliberately trimmed
// and shorter than its IG counterpart — Jaccard's union-sized denominator
// punishes that length gap and undercounts genuine near-duplicates (the
// real 2026-08-10 TTPD IG/X pair, an near-verbatim trim that plausibly
// triggered an X duplicate-content 403 per the failed/ evidence, scores only
// ~0.37 on Jaccard but ~0.89 on overlap). Overlap asks the right question
// for THIS check: "is nearly everything in the shorter draft also in the
// longer one," which is exactly what "trimmed the IG caption down for X"
// looks like, and is far less fooled by the length asymmetry than Jaccard.
export function bodySimilarity(a, b) {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (!A.size || !B.size) return 0;
  if (Math.min(A.size, B.size) < MIN_TOKENS_FOR_SIMILARITY) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / Math.min(A.size, B.size);
}

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Schema validation — runs BEFORE every other rule family, since voice/
 * openers/cross-post-copy/media all assume `body` is a real string,
 * `platform` is recognized, and (for the cross-post fallback)
 * `scheduledAt` parses. A malformed item fails here and skips the rest
 * (checkDraft short-circuits) rather than risking a confusing crash or a
 * misleading finding from a rule that assumed well-formed input.
 */
export function checkSchema(item) {
  const findings = [];
  if (typeof item?.body !== 'string' || item.body.trim().length === 0) {
    findings.push('schema: `body` must be a non-empty string.');
  }
  if (typeof item?.platform !== 'string' || !RECOGNIZED_PLATFORMS.has(item.platform)) {
    findings.push(`schema: \`platform\` must be one of ${[...RECOGNIZED_PLATFORMS].join(', ')} (got ${JSON.stringify(item?.platform)}).`);
  }
  if (!isValidScheduledAt(item)) {
    findings.push(`schema: \`scheduledAt\` is missing or not a valid date (got ${JSON.stringify(item?.scheduledAt)}) — this can never become due or stale (see lib/queue.mjs's isValidScheduledAt) and would sit unprocessed forever if it reached the queue.`);
  }
  return findings;
}

/** Voice rules — reuses voice.mjs's checkers rather than re-implementing
 * the surname/ai-tell/wire-attribution regexes for drafts. */
export async function checkVoice(file, body) {
  const asContentItem = [{ type: 'social-draft', file, era: null, key: file, texts: { body } }];
  const [surname, aiTell, wire] = await Promise.all([
    checkSurnameOveruse(asContentItem),
    checkAiTells(asContentItem),
    checkWireAttribution(asContentItem),
  ]);
  return [...surname, ...aiTell, ...wire].map((f) => `voice (${f.checker}): ${f.evidence}`);
}

export function checkOpeners(file, item, others) {
  const findings = [];
  const normalized = normalizeOpener(item.body);
  // Word boundary (`\b`) so "did you knowledge..." (a real, if unlikely,
  // sentence) doesn't false-positive — only an actual standalone "know".
  if (/^did you know\b/.test(normalized)) {
    findings.push('opener: body opens with "did you know" — banned formula opener, rewrite the hook.');
  }
  const mine = firstWords(item.body, OPENER_WORDS);
  if (mine) {
    for (const other of others) {
      if (other.file === file) continue;
      const theirs = firstWords(other.body, OPENER_WORDS);
      if (theirs && theirs === mine) {
        findings.push(`opener: first ${OPENER_WORDS} words ("${mine}") match ${other.file} — formula opener, vary the hook.`);
      }
    }
  }
  return findings;
}

/**
 * The hard pairing rule (Joey, 2026-08-25, social/README.md; made
 * UNCONDITIONAL 2026-08-26): every real campaign is authored as TWO queue
 * items with the same story-unique `campaign` — one `x`, one `instagram`.
 * There is no exception of any kind, for any reason.
 *
 * Until 2026-08-26 that rule had no gate anywhere on the path that actually
 * merges a draft. It was prose in social/README.md and the runner prompts,
 * plus an advisory P2 finding in the content-engine's
 * `content.social-post-missing` scan — a report nobody has to act on before
 * a queue PR auto-merges. Predictably, drafting lanes kept shipping X-only:
 * on 2026-08-26 every one of the five items that posted was `platform: "x"`
 * and Instagram got nothing at all, which is what the founder noticed.
 * This is the missing gate. It fails a draft that has no Instagram (or no
 * X) counterpart, so the PR does not auto-merge and a human sees it.
 *
 * The gate briefly (same day) honored a `Single-platform exception: <reason>`
 * marker in `why` for content whose FORMAT genuinely could not work on the
 * other platform, rejecting only scheduling pretexts. That carve-out is gone
 * — it was itself the pretext both of that day's X-only drafts used
 * ("the calendar assigns this subject to X only; today's IG slot is a
 * different, dropped subject"), and Joey closed it same-day: "Always an IG
 * copy. Always." No marker, however genuinely worded, suppresses this
 * finding any more.
 *
 * Scoped deliberately to the campaign of the draft being checked, not to the
 * whole corpus: legacy unpaired campaigns already in `social/posted/` are the
 * advisory checker's business, and must not retroactively fail every future
 * PR that merely touches social/queue/ (same reasoning as the targets-only
 * design in main()).
 */
export function checkCampaignPair(file, item, allQueueItems, allPostedItems) {
  if (!RECOGNIZED_PLATFORMS.has(item.platform)) return []; // checkSchema already flags this

  const campaign = typeof item.campaign === 'string' ? item.campaign.trim() : '';
  if (!campaign) {
    return [
      'campaign pair: no `campaign` value, so this draft has no story-unique key to pair an ' +
        `${item.platform === 'x' ? 'Instagram' : 'X'} sibling to — and the poster's idempotency check falls back to ` +
        'matching raw body text. Add a story-unique `campaign` (e.g. "on-this-day:red-announcement-wanegbt") ' +
        'shared with this story\'s sibling item.',
    ];
  }

  const wanted = item.platform === 'x' ? 'instagram' : 'x';
  const group = [...allQueueItems, ...allPostedItems].filter(
    (o) => o.file !== file && (typeof o.data.campaign === 'string' ? o.data.campaign.trim() : '') === campaign,
  );

  if (group.some((o) => o.data.platform === wanted)) return [];

  return [
    `campaign pair: campaign "${campaign}" has this ${item.platform} item but no ${wanted} sibling in social/queue/ or ` +
      'social/posted/. Every real campaign ships to BOTH platforms, unconditionally — no single-platform exception of ' +
      `any kind (social/README.md, Joey 2026-08-25 and 2026-08-26) — author the ${wanted} item in this same change ` +
      'with the exact same `campaign` value. The Instagram item already cross-posts to Facebook, so never add a ' +
      'third Facebook item.',
  ];
}

export function checkCrossPostCopy(file, item, allQueueItems) {
  if (item.platform !== 'x') return [];

  if (item.campaign) {
    const sibling = allQueueItems.find((o) => o.file !== file && o.data.platform === 'instagram' && o.data.campaign === item.campaign);
    if (!sibling) return [];
    const similarity = bodySimilarity(item.body, sibling.data.body);
    if (similarity > SIBLING_SIMILARITY_THRESHOLD) {
      return [
        `cross-post copy: ${Math.round(similarity * 100)}% similar to its Instagram sibling ${sibling.file} (campaign "${item.campaign}") — ` +
          'near-identical siblings are what trigger X\'s duplicate-content 403s and break the platform-native rule. Rewrite the X version distinctly.',
      ];
    }
    return [];
  }

  // No `campaign` to key off of — fall back to "closest same-day Instagram
  // item" so an X/IG pair authored without a shared campaign still gets
  // checked, rather than silently skipping this rule just because the
  // drafter forgot to tag them (added 2026-08-11, Codex review round 1).
  if (!isValidScheduledAt(item)) return []; // checkSchema already flags this; nothing more to compare here
  const itemDay = utcDateOnly(item.scheduledAt);
  const sameDayIg = allQueueItems.filter(
    (o) => o.file !== file && o.data.platform === 'instagram' && isValidScheduledAt(o.data) && utcDateOnly(o.data.scheduledAt) === itemDay,
  );
  if (!sameDayIg.length) return [];

  sameDayIg.sort(
    (a, b) => Math.abs(new Date(a.data.scheduledAt).getTime() - new Date(item.scheduledAt).getTime()) - Math.abs(new Date(b.data.scheduledAt).getTime() - new Date(item.scheduledAt).getTime()),
  );
  const closest = sameDayIg[0];
  const similarity = bodySimilarity(item.body, closest.data.body);

  if (similarity > SIBLING_SIMILARITY_THRESHOLD) {
    return [
      `cross-post copy: no \`campaign\` set, but this X draft is ${Math.round(similarity * 100)}% similar to ${closest.file} (the closest same-day Instagram item) — ` +
        'either tag both with a shared `campaign` (recommended, makes this detection reliable) or rewrite the X version distinctly.',
    ];
  }
  if (similarity >= PAIRED_LOOKING_FLOOR) {
    return [
      `cross-post copy: no \`campaign\` set on this X draft, and a same-day Instagram item (${closest.file}) looks like it could be its sibling (${Math.round(similarity * 100)}% word overlap) — add a shared \`campaign\` value so this check can compare them reliably.`,
    ];
  }
  return [];
}

// The weighted-length rule itself (AUTOLINK_URL_RE, wide-char weighting,
// weightedTweetLength) lives in lib/x-length.mjs so the CI schema gate
// (lib/queue-schema.mjs, run on every queue file by validate-queue.mjs in
// the required `build` job) enforces the exact same counting as this
// draft-time checker — two independent ports of X's counting rule would
// drift, and a drifted length rule is how the 11 social/failed/ 403s
// happened. Re-exported here so existing importers/tests keep working.
export { weightedTweetLength } from './lib/x-length.mjs';

/**
 * X-only. HARD FAILS over X's real 280-weighted-character limit (see
 * weightedTweetLength's docstring for why this is the rule that was
 * actually missing). WARNS (non-fatal — main() treats a `WARNING_PREFIX`
 * finding as advisory, not a checker failure) above 270, to leave headroom
 * before the hard limit rather than let every draft ride the edge.
 */
export function checkLength(item) {
  if (item.platform !== 'x') return [];
  const weighted = weightedTweetLength(item.body);
  if (weighted > X_WEIGHTED_LENGTH_HARD_LIMIT) {
    return [
      `length: weighted ${weighted} exceeds X's real ${X_WEIGHTED_LENGTH_HARD_LIMIT}-character limit (URLs always count as ${WEIGHTED_URL_LENGTH} regardless of actual length; most emoji/CJK count as 2) — X will reject this with a generic 403. Trim the body.`,
    ];
  }
  if (weighted > X_WEIGHTED_LENGTH_WARN_THRESHOLD) {
    return [`${WARNING_PREFIX} weighted ${weighted} is over the ${X_WEIGHTED_LENGTH_WARN_THRESHOLD}-char target (X's hard limit is ${X_WEIGHTED_LENGTH_HARD_LIMIT}) — trim if it doesn't cost the hook.`];
  }
  return [];
}

export async function checkMedia(file, item, recentIgPosted, allQueueItems = []) {
  const findings = [];
  if (item.platform === 'instagram' && !item.media?.length) {
    findings.push('media: Instagram drafts require at least one image in `media`.');
    return findings; // nothing else to check without media
  }
  if (item.platform === 'x' && item.mediaKind === 'site-screen') {
    findings.push('media: X drafts may not use mediaKind "site-screen" — X site-screen posts are permanently prohibited. Use text-only or a real credited photo instead.');
  }
  // Website-screenshot-as-media lock (2026-08-31, Joey — kanban t_895c2ba8:
  // "I want just pictures of Taylor and Taylor related stuff, no more
  // pictures of our website"). docs/marketing/social-strategy.md §2 already
  // SAID a site screenshot is only legitimate "for posts whose subject IS a
  // product surface (a launch, a how-to)" — but nothing on the merge path
  // enforced that scope, so site-screen drifted to 7 of the last 10 posted
  // Instagram items (social/posted/*-ig.json, audited this run) while real
  // Taylor photos ran 3. This is the missing gate: a site-screen tile may
  // only ship on a `launch:`-family campaign (the feature-launch arc, the
  // one place strategy §2(a) actually calls it out — "an Instagram
  // site-screen is legitimate here"). Every other campaign family
  // (heartbeat, thread, mood) must use a real Taylor photo or go text-only
  // on X.
  if (item.platform === 'instagram' && item.mediaKind === 'site-screen') {
    const campaign = typeof item.campaign === 'string' ? item.campaign.trim() : '';
    if (!campaign.startsWith('launch:')) {
      findings.push(
        `media: mediaKind "site-screen" is only allowed on a \`launch:\`-family campaign (this draft's campaign is ${JSON.stringify(item.campaign ?? null)}) — ` +
          'per docs/marketing/social-strategy.md §2, a website screenshot is only legitimate for a feature-launch/how-to post. Every other post must use a real credited Taylor photo ' +
          '(mediaKind "photo") or go text-only on X. (Joey, 2026-08-31: "no more pictures of our website.")',
      );
    }
  }
  if (item.platform === 'x' && (item.media?.length ?? 0) > MAX_X_IMAGES) {
    findings.push(`media: X posts support at most ${MAX_X_IMAGES} images (this draft has ${item.media.length}).`);
  }
  for (const mediaPath of item.media ?? []) {
    const ext = String(mediaPath).split('.').pop()?.toLowerCase();
    if (!ALLOWED_MEDIA_EXTENSIONS.has(ext)) {
      findings.push(`media: "${mediaPath}" has an unsupported extension — only ${[...ALLOWED_MEDIA_EXTENSIONS].join('/')} are produced/uploaded by this pipeline today.`);
      continue; // an unsupported format isn't worth the existence/repeat checks below
    }
    const full = path.join(PUBLIC_DIR, mediaPath);
    if (!(await fileExists(full))) {
      findings.push(`media: "${mediaPath}" does not exist under apps/web/public/ — commit it in this PR.`);
      continue;
    }
    // Instagram rejects images outside its aspect-ratio window at publish time,
    // three days after the draft merged — catch it now, at write time, for IG
    // drafts only (X has no such limit). See IG_MIN/MAX_ASPECT_RATIO above.
    if (item.platform === 'instagram') {
      let meta;
      try {
        meta = imageMeta(await readFile(full));
      } catch {
        meta = null;
      }
      if (!meta || !meta.width || !meta.height) {
        findings.push(
          `media: "${mediaPath}" — could not read image dimensions to verify Instagram's aspect-ratio limit (${IG_MIN_ASPECT_RATIO}–${IG_MAX_ASPECT_RATIO}, width/height). Re-export a standard PNG/JPEG at 1080x1350.`,
        );
      } else {
        const ratio = meta.width / meta.height;
        if (ratio < IG_MIN_ASPECT_RATIO || ratio > IG_MAX_ASPECT_RATIO) {
          findings.push(
            `media: "${mediaPath}" is ${meta.width}x${meta.height} (aspect ${ratio.toFixed(3)}), outside Instagram's accepted ${IG_MIN_ASPECT_RATIO}–${IG_MAX_ASPECT_RATIO} range — Instagram rejects it with "the aspect ratio is not supported". Re-export at 1080x1350 (portrait 4:5) or another in-range size.`,
          );
        }
      }
    }
    // ── THE TAYLOR-PHOTO STANDARD (2026-08-12, Joey's call — see
    //    social/README.md's mediaKind section). Generic era tiles are DEAD as
    //    draft media, full stop: on 2026-08-06 ALL 17 posted IG items were
    //    era tiles, and after the 2026-08-11/12 incident Joey's verdict was
    //    "we are a Taylor Swift fan site whose social media has no pictures
    //    of Taylor Swift." There is no declared-fallback path anymore —
    //    a draft either ships a real credited photograph (mediaKind
    //    "photo") or a deliberate product screenshot (mediaKind
    //    "site-screen"). No tag, no merge. ──────────────────────────────────
    if (isGenericEraArt(mediaPath)) {
      findings.push(
        `media: "${mediaPath}" is a generic era-cover tile — era art is no longer allowed as post media at all (2026-08-12 standard). ` +
          'Use a real credited photograph of Taylor from the sourced corpus (supabase/seed/content/** moment.photos / lenses.ts), rehosted under /social/library/photos/.',
      );
      continue;
    }
    if (repeatsRecentIgMedia(mediaPath, recentIgPosted, ERA_ART_LOOKBACK)) {
      findings.push(
        `media: "${mediaPath}" repeats one of the last ${ERA_ART_LOOKBACK} posted Instagram items' media — even a dedicated photo shouldn't ship twice that soon.`,
      );
    }
    // Queue-vs-queue: a SCHEDULED future repeat is invisible to the
    // posted-window check above until it's too late (PR #2043 review — two
    // queued IG items four days apart shared a screenshot and both passed).
    const alsoQueuedIn = allQueueItems.find((o) => o.file !== file && (o.data.media ?? []).includes(mediaPath));
    if (alsoQueuedIn) {
      findings.push(
        `media: "${mediaPath}" is also scheduled in ${alsoQueuedIn.file} — two queued items may not share media; the repeat would land inside the recent-posted window by construction.`,
      );
    }
  }

  // The tile (media[0] — what the Instagram grid and the X card actually
  // show) must carry a DECLARED kind, and each kind is bound to ITS OWN path
  // prefix (PR #2043 review: without the path binding, any committed image
  // could be laundered as a "photo" with a fabricated credit string, and a
  // real photo declared "site-screen" would ship uncredited).
  if (item.media?.length && !isGenericEraArt(item.media[0])) {
    const tile = String(item.media[0]);
    if (item.mediaKind === 'photo') {
      if (!tile.startsWith(PHOTO_PREFIX)) {
        findings.push(
          `media: mediaKind "photo" tile "${tile}" must live under ${PHOTO_PREFIX} — the rehosted, credited Taylor-photo corpus. A screenshot or other asset cannot be declared a photo.`,
        );
      }
      if (typeof item.mediaCredit !== 'string' || item.mediaCredit.trim() === '') {
        findings.push('media: mediaKind "photo" requires `mediaCredit` — a real photograph of Taylor always ships with its photographer/agency credit.');
      }
      if (typeof item.mediaSource !== 'string' || item.mediaSource.trim() === '') {
        findings.push('media: mediaKind "photo" requires `mediaSource` — record where the photo came from so the credit is auditable.');
      }
    } else if (item.mediaKind === 'site-screen') {
      if (!tile.startsWith('/social/library/') || tile.startsWith(PHOTO_PREFIX)) {
        findings.push(
          `media: mediaKind "site-screen" tile "${tile}" must be a committed product screenshot under /social/library/ (and NOT under ${PHOTO_PREFIX} — a real photo must be declared "photo" so its credit is required).`,
        );
      }
    } else if (item.mediaKind === 'era-art') {
      findings.push(
        'media: mediaKind "era-art" is no longer allowed on drafts (2026-08-12 standard) — the value survives only so historical records parse. Use "photo" or "site-screen".',
      );
    } else {
      findings.push(
        `media: draft has media but no declared \`mediaKind\` (got ${JSON.stringify(item.mediaKind)}) — declare "photo" (real credited photograph of Taylor, with mediaCredit + mediaSource) or "site-screen" (deliberate product screenshot). Undeclared media is how the account drifted to a Taylor-free grid.`,
      );
    }
  }
  return findings;
}

async function recentInstagramPosted(n = ERA_ART_LOOKBACK) {
  const posted = (await readJsonDir(POSTED_DIR)).map((p) => p.data).filter((d) => d.platform === 'instagram');
  return posted.sort((a, b) => new Date(a.postedAt) - new Date(b.postedAt)).slice(-n);
}

async function recentPostedOpeners(days = POSTED_LOOKBACK_DAYS) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const posted = await readJsonDir(POSTED_DIR);
  return posted.filter((p) => p.data.postedAt && new Date(p.data.postedAt).getTime() >= cutoff).map((p) => ({ file: p.file, body: p.data.body }));
}

/**
 * Resolves CLI args to absolute file paths, or `{ targetPaths: null }`
 * meaning "everything in social/queue/". `--manifest <path>` reads a JSON
 * array of strings from that file — the robust option for a caller (the
 * auto-merge-content.yml workflow) that can't safely word-split filenames
 * through a shell. Positional args remain supported for local ad-hoc use.
 * Returns `{ error }` instead of throwing so main() can report it as a
 * normal (loud, exit-1) failure rather than an uncaught crash.
 */
async function resolveTargets(argv) {
  const manifestIdx = argv.indexOf('--manifest');
  let rawPaths;

  if (manifestIdx !== -1) {
    const manifestPath = argv[manifestIdx + 1];
    if (!manifestPath) return { error: '--manifest requires a file path argument.' };
    let content;
    try {
      content = await readFile(manifestPath, 'utf-8');
    } catch (err) {
      return { error: `could not read manifest "${manifestPath}": ${err.message ?? err}` };
    }
    try {
      rawPaths = JSON.parse(content);
    } catch (err) {
      return { error: `manifest "${manifestPath}" is not valid JSON: ${err.message ?? err}` };
    }
    if (!Array.isArray(rawPaths) || !rawPaths.every((p) => typeof p === 'string')) {
      return { error: `manifest "${manifestPath}" must be a JSON array of file path strings.` };
    }
  } else {
    rawPaths = argv;
  }

  if (!rawPaths.length) return { targetPaths: null };
  return { targetPaths: rawPaths.map((a) => (path.isAbsolute(a) ? a : path.resolve(ROOT, a))) };
}

export async function checkDraft(target, { allQueue, allPosted = [], openerContext, recentIg }) {
  const schemaFindings = checkSchema(target.data);
  if (schemaFindings.length) return schemaFindings; // other rules assume a valid shape — don't risk a confusing crash/misfire

  return [
    ...(await checkVoice(target.file, target.data.body)),
    ...checkOpeners(target.file, target.data, openerContext),
    ...checkCampaignPair(target.file, target.data, allQueue, allPosted),
    ...checkCrossPostCopy(target.file, target.data, allQueue),
    ...checkLength(target.data),
    ...(await checkMedia(target.file, target.data, recentIg, allQueue)),
  ];
}

/** True for a finding that's advisory only (see WARNING_PREFIX / checkLength)
 * — main() keeps these out of the pass/fail exit code but still prints them. */
function isWarningFinding(finding) {
  return finding.startsWith(WARNING_PREFIX);
}

async function main() {
  const resolved = await resolveTargets(process.argv.slice(2));
  if (resolved.error) {
    console.error(`check-drafts: ${resolved.error}`);
    process.exit(1);
  }
  const targetPaths = resolved.targetPaths;

  const allQueue = await readJsonDir(QUEUE_DIR);
  const targets = targetPaths ? allQueue.filter((q) => targetPaths.includes(q.full)) : allQueue;

  if (targetPaths) {
    // Specific files were requested — every one of them MUST resolve.
    // A requested-but-missing file (or zero resolved out of N requested) is
    // a hard failure, not a warning: silently checking nothing while
    // exiting 0 would be a false green (added 2026-08-11, Codex review
    // round 1 on PR #1900).
    const foundFulls = new Set(targets.map((t) => t.full));
    const unresolved = targetPaths.filter((p) => !foundFulls.has(p));
    if (unresolved.length) {
      console.error(`check-drafts: requested file(s) not found under social/queue/ — failing closed:\n${unresolved.map((p) => `  - ${p}`).join('\n')}`);
      process.exit(1);
    }
    if (targets.length === 0) {
      // Unreachable given the check above (unresolved would already have
      // caught it), but a second, explicit guard against "0 checked, exit
      // 0" costs nothing and documents the invariant directly.
      console.error('check-drafts: targets were requested but none resolved — failing closed.');
      process.exit(1);
    }
  }

  if (!targets.length) {
    // Only reachable via the "check everything" (no args/manifest) path
    // with an empty social/queue/ directory.
    console.log('check-drafts: no target queue files found — nothing to check.');
    return;
  }

  const recentIg = await recentInstagramPosted();
  const recentPosted = await recentPostedOpeners();
  const openerContext = [...recentPosted, ...allQueue.map((q) => ({ file: q.file, body: q.data.body }))];
  // Full posted history, not the 14-day opener window: a campaign's sibling
  // legitimately posted weeks before its partner is drafted, and treating
  // that as "no sibling" would fail an already-satisfied pairing.
  const allPosted = await readJsonDir(POSTED_DIR);

  let hadFindings = false;
  let hadWarnings = false;
  for (const target of targets) {
    const findings = await checkDraft(target, { allQueue, allPosted, openerContext, recentIg });
    // A warning (currently only checkLength's over-270-but-within-280 case)
    // is advisory: it prints, but never flips the exit code on its own — see
    // WARNING_PREFIX/isWarningFinding. Any non-warning finding is a hard
    // FAIL, same as before this rule existed.
    const hardFindings = findings.filter((f) => !isWarningFinding(f));
    const warnFindings = findings.filter(isWarningFinding);
    if (hardFindings.length) {
      hadFindings = true;
      console.error(`\nFAIL ${target.file}`);
      for (const f of [...hardFindings, ...warnFindings]) console.error(`  - ${f}`);
    } else if (warnFindings.length) {
      hadWarnings = true;
      console.log(`\nWARN ${target.file}`);
      for (const f of warnFindings) console.log(`  - ${f}`);
    } else {
      console.log(`OK   ${target.file}`);
    }
  }

  if (hadFindings) {
    console.error('\ncheck-drafts: one or more queue drafts failed quality checks (see above).');
    process.exit(1);
  }
  if (hadWarnings) {
    console.log('\ncheck-drafts: all checked drafts passed (warnings above are non-fatal).');
    return;
  }
  console.log('\ncheck-drafts: all checked drafts passed.');
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(`check-drafts: crashed: ${err.stack ?? err}`);
    process.exit(1);
  });
}
