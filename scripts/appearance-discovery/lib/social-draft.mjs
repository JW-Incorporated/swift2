// Fast-lane social drafts — builds an X + Instagram social/queue pair from
// a deterministic appearance-discovery detection candidate (the same shape
// discover.mjs's `plan.toFile` entries carry — see its issueBody for the
// sibling intake-issue version of this data), per docs/decisions.md
// (2026-08-25, "Detection-triggered social auto-post: confirmed live, not
// staged; email on every send").
//
// Deliberately NOT a claim about the video's CONTENT: discover.mjs's own
// invariant (see its header) is "detection is UNVERIFIED — nobody has
// watched this video or checked a single claim." This module only ever
// restates metadata the RSS feed itself already asserts (the channel name,
// the video's own title, its watch URL) — genuine, sourced facts about the
// fact-of-the-drop, never a claim about what's IN it. The caption gushes
// about a new video existing, not about its contents — sourcing stays
// absolute per docs/marketing/social-strategy.md § Voice.
//
// This is content, not a safety gate: the file this produces still runs
// through scripts/social/check-drafts.mjs (the auto-merge-content.yml
// check-drafts job) like every other queue draft before it can land — a bad
// template here fails safe to a human merge, same as any other draft.
//
// Pair construction is pure; the separate thumbnail fetch is injectable and
// unit-testable without a real feed.

import { weightedTweetLength } from '../../social/lib/x-length.mjs';
import { imageMeta } from '../../content-engine/checkers/image-liveness.mjs';

const X_MAX_WEIGHTED = 280;
// Leaves headroom under check-drafts.mjs's own 270 WARN threshold (and a lot
// more under X's real 280 hard limit) so a normal-length YouTube title never
// even risks the length gate.
const SAFETY_MARGIN_WEIGHTED = 10;
// 10 minutes -> 72 hours (2026-08-29: two fast-lane pairs, appearance:
// T6iTnTV-Rgw and appearance:ldBrFonU8NA, had their staging PR sit unmerged
// long enough that scheduledAt was already past queue.mjs's 48h isStaleDue
// cutoff the instant they reached main — both retired to social/failed/
// without ever getting a post attempt). 72h exceeds that 48h stale cutoff on
// its own, so it comfortably covers ordinary PR/CI landing delay before a
// fast-lane draft ever reaches main, without touching the no-approval-gate
// posting model (docs/decisions.md 2026-08-25).
const SCHEDULE_DELAY_MS = 72 * 60 * 60 * 1000;

/**
 * Lowercases everything except "Taylor Swift"/"Taylor" — matches the shipped
 * house style (see any social/posted/*.json sample). A real source video
 * title genuinely can carry her full name ("The Icon Sessions with Taylor
 * Swift…"); lowercasing only the bare word "Taylor" and missing the "Swift"
 * right after it produced "Taylor swift" mid-sentence on a real live feed
 * during testing — the alternation tries the two-word phrase FIRST so it
 * matches as a unit, falling back to bare "Taylor" only when "Swift" isn't
 * the very next word.
 */
function toHouseStyle(text) {
  return String(text ?? '')
    .split(/(Taylor Swift|Taylor)/)
    .map((part) => (part === 'Taylor Swift' || part === 'Taylor' ? part : part.toLowerCase()))
    .join('');
}

/** Collapses whitespace and swaps double quotes for single so an embedded
 * `"` in a video title can't visually break the body's own quoting. */
function sanitize(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim().replace(/"/g, "'");
}

// Wording is conditioned on `c.rule`: 'all-uploads' means the video came
// from Taylor's OWN channel (channels.mjs's allUploads:true entry) — a
// genuine official upload. 'taylor-swift'/'swift-title' mean her NAME
// appeared in a THIRD PARTY channel's title (a talk-show clip, a fan
// reaction, a news channel) — calling that an "official upload" is a false
// claim (Codex review round 1, kanban t_895c2ba8: `emit-official-youtube-
// event.mjs` already draws exactly this distinction for the notifications
// pipeline; the social copy must match it).
function bodyTemplate(title, channel, url, isOfficial) {
  return isOfficial
    ? `"${title}" — official upload, no caption yet, link below. ${url}`
    : `"${title}" — new from ${channel}, no caption yet, link below. ${url}`;
}

// Rewritten 2026-08-31 (Joey, kanban t_895c2ba8): the previous hooks ("i hit
// play SO fast", "drop everything") plus the fixed line "i haven't watched
// yet — come watch with me!!" read as generic breathless fan-account spam
// and, worse, disclosed in the caption itself that nobody had watched the
// video — exactly the low-quality output that triggered the founder
// complaint and the SOCIAL_FREEZE. This lane is still, deliberately,
// title/channel/URL-only (see this file's header) — it must never claim
// anything about the video's CONTENT — but it no longer needs to perform
// enthusiasm about a video it hasn't seen. Calm and factual beats gushing
// about the unknown. Each hook opens on its OWN fixed words (not the title)
// so the Instagram body doesn't collide with the X sibling's title-first
// opener (checkOpeners compares first-6-words across every item in the same
// PR, including a pair's own two halves). Deliberately does NOT repeat the
// channel name in the hook (it already appears in the "video thumbnail:"
// credit line below) — a channel whose NAME is itself Taylor's own name
// (e.g. the "Taylor Swift" YouTube channel) would otherwise double the
// shared-token count against the X sibling's title and push a short title
// over checkCrossPostCopy's 80% overlap threshold (hit for real on
// XwCWKSO0F8s, 2026-08-31 during this fix).
const INSTAGRAM_HOOKS = [
  (title) => `just seen: ${title}.`,
  (title) => `catching up on ${title}.`,
  (title) => `worth a look — ${title}.`,
  (title) => `on the radar today: ${title}.`,
  (title) => `saving this one: ${title}.`,
];

function instagramBodyTemplate(title, channel, url, videoId) {
  let hash = 2166136261;
  for (const char of String(videoId)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  const hookIndex = hash % INSTAGRAM_HOOKS.length;
  return `${INSTAGRAM_HOOKS[hookIndex](title)}\n\n${url}\n\nvideo thumbnail: ${channel}`;
}

/** Trims `title` to fit whatever's left of X's weighted budget after the
 * template's own fixed words + channel + url, measured the same weighted
 * way X itself will measure the final post (so an emoji/CJK-heavy title, or
 * an unusually long channel name, can't quietly blow the total). Budgets
 * against the LONGER of the two isOfficial branches so a swap between them
 * (see bodyTemplate) never surprises the caller with a truncation change. */
function truncateTitle(title, channel, url) {
  const t = sanitize(title);
  const overhead = Math.max(
    weightedTweetLength(bodyTemplate('', channel, url, true)),
    weightedTweetLength(bodyTemplate('', channel, url, false)),
  );
  const budget = X_MAX_WEIGHTED - overhead - SAFETY_MARGIN_WEIGHTED;
  if (weightedTweetLength(t) <= budget) return t;
  let out = t;
  while (out.length > 0 && weightedTweetLength(`${out}…`) > budget) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

/**
 * Builds the fast-lane X + Instagram pair for one appearance-discovery
 * candidate. Both queue items share one story-unique campaign and schedule;
 * the Instagram item rides the poster's existing Facebook cross-post.
 *
 * The video's own TITLE leads the body deliberately (not a fixed lead-in
 * phrase): scripts/social/check-drafts.mjs's opener rule fails a draft whose
 * first 6 words match any other post from the last 14 days OR any other
 * queue item. A channel-name-first template ("new video from Republic
 * Records…") collides with itself on that channel's very next upload; each
 * video's own distinct title does not, by the same guarantee that keeps
 * dedupe/videoId unique in the first place.
 */
export function buildSocialDraftPair(c, { now = new Date() } = {}) {
  const isOfficial = c.rule === 'all-uploads';
  const channel = toHouseStyle(sanitize(c.channelName));
  const title = toHouseStyle(truncateTitle(c.title, channel, c.url));
  const xBody = bodyTemplate(title, channel, c.url, isOfficial);
  const measured = weightedTweetLength(xBody);
  if (measured > X_MAX_WEIGHTED) {
    // Not expected to trip given truncateTitle's own budget math — fail loud
    // here rather than stage something check-drafts.mjs would reject anyway;
    // this pinpoints the cause instead of a downstream PR just silently
    // waiting for a human.
    throw new Error(`social draft over X's weighted ${X_MAX_WEIGHTED}-char limit (${measured}): ${xBody}`);
  }
  const scheduledAt = new Date(now.getTime() + SCHEDULE_DELAY_MS).toISOString();
  const day = scheduledAt.slice(0, 10);
  const campaign = `appearance:${c.videoId}`;
  const mediaFilename = `appearance-${c.videoId}.jpg`;
  const mediaPath = `/social/library/photos/${mediaFilename}`;
  const why =
    `Auto-drafted as an X + Instagram pair by appearance-discovery (fast lane) from a genuinely new, ` +
    `deterministically-matched official upload — rule "${c.rule}", channel ${c.channelName}. Unverified beyond RSS metadata ` +
    `(title/channel/URL only; nobody has watched the video) — see docs/decisions.md 2026-08-25 ` +
    `("Detection-triggered social auto-post" and "X + Instagram pairing"). The slower Vault-authoring lane still gets its own intake issue for the same video.`;
  return {
    drafts: [
      {
        filename: `${day}-appearance-${c.videoId}-x.json`,
        item: { platform: 'x', body: xBody, scheduledAt, campaign, why },
      },
      {
        filename: `${day}-appearance-${c.videoId}-ig.json`,
        item: {
          platform: 'instagram',
          body: instagramBodyTemplate(toHouseStyle(sanitize(c.title)), channel, c.url, c.videoId),
          media: [mediaPath],
          mediaKind: 'photo',
          mediaCredit: `Video thumbnail: ${c.channelName}`,
          mediaSource: c.url,
          scheduledAt,
          campaign,
          why,
        },
      },
    ],
    media: {
      repoPath: `apps/web/public${mediaPath}`,
      sitePath: mediaPath,
    },
  };
}

// ── Real photo-content verification (2026-08-31, Joey — kanban t_ac1281ef,
// docs/decisions.md 2026-08-31) ─────────────────────────────────────────
// Before this fix, a thumbnail only had to pass a SHAPE check (size + aspect
// ratio) to be declared `mediaKind: "photo"` — nothing ever looked at the
// actual pixels. `appearance-XwCWKSO0F8s`'s thumbnail is a Pixar-style
// animated tree/tire-swing illustration with no Taylor in it at all, and it
// sailed through every gate check-drafts.mjs has (path prefix, credit
// string, aspect ratio) because none of them are a CONTENT check. This adds
// exactly that: one claude-sonnet-5 vision call per candidate thumbnail,
// using the SAME model/account/credential already standing-authorized for
// E3 match auditing (docs/decisions.md 2026-08-30 "E3 vision judgment uses
// Claude Sonnet 5…") — no new provider, account, or spend channel, just a
// second authorized use of the existing one. It stays inside the fast
// lane's auto-posting flow (Joey's ruling, this same task: the lane keeps
// auto-posting, it does not become review-first) — a thumbnail that fails
// verification is simply never staged, the same "loud, not fatal" shape
// draftFailures already has for a fetch/build failure.
const TAYLOR_VERIFY_MODEL = 'claude-sonnet-5';
const ANTHROPIC_VERSION = '2023-06-01';
const TAYLOR_VERIFY_TOOL = {
  name: 'record_taylor_presence',
  description: 'Record whether Taylor Swift is visibly, photographically present in the supplied image.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      taylor_present: { type: 'boolean' },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      reason: { type: 'string', minLength: 1, maxLength: 240 },
    },
    required: ['taylor_present', 'confidence', 'reason'],
  },
};
// Below this, treat a "yes" as too uncertain to ship unattended — same
// judgment-call posture as requiring a clean tool response at all.
const TAYLOR_PRESENCE_MIN_CONFIDENCE = 0.6;
// Same 30s ceiling as the thumbnail fetches in this file (AbortSignal.timeout
// below) — Codex review round 1 (kanban t_ac1281ef): this request originally
// had no abort signal, so a connection that accepts but never completes
// could consume the whole 20-minute workflow timeout. Because the intake
// issue is already filed before this call runs, and later runs dedupe
// against that issue, a hung call would silently and PERMANENTLY drop that
// video's social pair (never retried) instead of failing loud within the
// run.
const TAYLOR_VERIFY_TIMEOUT_MS = 30_000;
// Hard cap on total paid vision calls per process, independent of caller
// input (Codex review round 2, kanban t_ac1281ef): discover.mjs's own
// `--max` clamp is the primary control, but this counter is the safety net
// at the actual spend site — any future caller of fetchAppearanceThumbnail
// inherits the cap for free instead of having to remember to reapply it.
// 60 covers the worst case of discover.mjs's 25-candidate hard ceiling (2
// thumbnail URLs each = 50 calls) with headroom, so it never fires in
// normal operation.
export const MAX_VERIFY_CALLS_PER_PROCESS = 60;
let verifyCallCount = 0;

// Test-only escape hatch (Codex review round 3, kanban t_ac1281ef): the
// counter above is deliberately module-level, persistent state — that's
// what makes it a real per-process cap instead of a per-call parameter a
// caller could omit. Tests need to reset it between cases without reaching
// into module internals; production code never calls this.
export function _resetVerifyCallCountForTests() {
  verifyCallCount = 0;
}

function taylorVerifyToolInput(body) {
  const content = body?.content;
  if (!Array.isArray(content)) return null;
  return content.find((block) => block?.type === 'tool_use' && block.name === TAYLOR_VERIFY_TOOL.name)?.input ?? null;
}

/**
 * One vision call: does this image show Taylor Swift as a real photographed
 * person (not an illustration, not someone else, not text/graphics)? Throws
 * on a missing API key or a malformed/failed response — this gate fails
 * CLOSED (no verification credential = no unverified "photo" ships), never
 * open.
 */
/* global AbortSignal */ // a Node 18+ global; same pragma as check-link-liveness.mjs
export async function verifyTaylorPresence(bytes, mediaType, { apiKey, fetchImpl = fetch } = {}) {
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY not set — cannot verify Taylor is actually in this thumbnail, refusing to stage it unverified',
    );
  }
  if (verifyCallCount >= MAX_VERIFY_CALLS_PER_PROCESS) {
    throw new Error(
      `taylor-presence vision call cap (${MAX_VERIFY_CALLS_PER_PROCESS}/run) reached — refusing to spend further, ` +
        'same fail-closed posture as a missing API key',
    );
  }
  verifyCallCount += 1;
  const response = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    signal: AbortSignal.timeout(TAYLOR_VERIFY_TIMEOUT_MS),
    body: JSON.stringify({
      model: TAYLOR_VERIFY_MODEL,
      max_tokens: 128,
      thinking: { type: 'disabled' },
      tools: [TAYLOR_VERIFY_TOOL],
      tool_choice: { type: 'tool', name: TAYLOR_VERIFY_TOOL.name },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: bytes.toString('base64') } },
            {
              type: 'text',
              text:
                'Is Taylor Swift (the musician) visibly and recognizably present in this image as a real photographed ' +
                'person? Answer false for animated/illustrated/cartoon art, a different person, a text/graphic card, ' +
                'or any image where she is not clearly recognizable. Return only the required tool input.',
            },
          ],
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(`taylor-presence vision request failed (${response.status})`);
  const input = taylorVerifyToolInput(await response.json());
  if (
    !input ||
    typeof input.taylor_present !== 'boolean' ||
    // Tool input is model-generated and must not be trusted to obey the
    // supplied JSON-schema bounds (Codex review round 1, kanban
    // t_ac1281ef) — a schema-invalid `confidence: 2` would otherwise sail
    // past the later `>= 0.6` check and defeat the fail-closed gate.
    typeof input.confidence !== 'number' ||
    !Number.isFinite(input.confidence) ||
    input.confidence < 0 ||
    input.confidence > 1 ||
    typeof input.reason !== 'string' ||
    !input.reason.trim()
  ) {
    throw new Error('taylor-presence vision response was malformed');
  }
  return input;
}

/** Fetch the official YouTube thumbnail used by the Instagram sibling, and
 * verify with `verify` (real vision call by default) that Taylor is actually
 * in it before returning it — see the block comment above. maxresdefault is
 * preferred; hqdefault is a real 480px fallback when a video has no
 * max-resolution upload. Tiny YouTube placeholders are rejected by shape
 * before ever reaching the (paid) content check. A candidate that passes the
 * shape check but fails verification is skipped, not returned — the caller
 * (discover.mjs) treats a thrown error here as a loud, non-fatal
 * draftFailure, same as any other staging failure. */
export async function fetchAppearanceThumbnail(
  c,
  { fetchImpl = fetch, apiKey = process.env.ANTHROPIC_API_KEY, verify = verifyTaylorPresence } = {},
) {
  const urls = [
    `https://i.ytimg.com/vi/${c.videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${c.videoId}/hqdefault.jpg`,
  ];
  const rejections = [];
  for (const url of urls) {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok || !String(response.headers.get('content-type')).toLowerCase().startsWith('image/')) continue;
    const bytes = Buffer.from(await response.arrayBuffer());
    const meta = imageMeta(bytes);
    const ratio = meta?.width && meta?.height ? meta.width / meta.height : 0;
    if (!(meta?.width >= 400 && meta?.height >= 300 && ratio >= 0.8 && ratio <= 1.91)) continue;
    const mediaType = meta.format === 'png' ? 'image/png' : meta.format === 'webp' ? 'image/webp' : 'image/jpeg';
    const judgment = await verify(bytes, mediaType, { apiKey, fetchImpl });
    if (judgment.taylor_present && judgment.confidence >= TAYLOR_PRESENCE_MIN_CONFIDENCE) {
      return { bytes, sourceUrl: url };
    }
    rejections.push(
      `${url}: ${judgment.taylor_present ? `low confidence (${judgment.confidence.toFixed(2)})` : 'Taylor not present'} — ${judgment.reason}`,
    );
  }
  if (rejections.length) {
    throw new Error(
      `no Instagram-safe YouTube thumbnail found for ${c.videoId} that verifiably contains Taylor: ${rejections.join('; ')}`,
    );
  }
  throw new Error(`no Instagram-safe YouTube thumbnail found for ${c.videoId}`);
}
