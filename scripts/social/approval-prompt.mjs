// Builds and sends the Discord approval prompt for pending social draft
// PR(s) (docs/social/RULINGS-SOCIAL.md A3, rebuilding the 2026-09-10 text-only version
// per the RCA at scratchpad/RCA-social-brief-image.md). One Discord MESSAGE
// per draft, each carrying an `image.url` embed built from the exact same
// MEDIA_BASE_URL/mediaUrlsFor helpers post-queue.mjs publishes from
// (lib/queue.mjs) — so the brief and the poster can never point at
// different hosts — plus everything else a go/no-go needs: account handle,
// overdue annotation, length against the platform limit, alt text, credit,
// a truncated `why` with a file link, and the Facebook cross-post
// disclosure (A4) on every Instagram draft.
//
// Approve = react ✅ in #longlive-tree, on a draft message for just that
// one or on the header for every draft in the PR (docs/social/RULINGS-SOCIAL-2.md B1 —
// social-approval-poll.yml polls for the reaction, stamps a v2 signed
// approval, then merges; merging the PR yourself does NOT approve it, it
// kills the draft). Reject = react ❌ the same way — on a draft drops just
// that file, on the header closes the whole PR; the poll job then carries
// out the A3 rejection path (git rm + PR comment / PR close), so
// docs/agents/runner-prompts/tree-daily-draft.md's drafting routine still reads
// a `reject:` comment before drafting again.
//
// Every message this builds carries a machine-readable
// `ref: PR #<n> · <headSha> · <file|*>` line as its last content line —
// webhook-authored, so an agent cannot forge which draft a reaction is
// binding to (see social-approval-poll.mjs's header comment for why that
// property holds).
//
// This never runs against a real Discord webhook from an agent's own
// context — it is invoked by .github/workflows/social-approval-notify.yml
// (a `pull_request_target`/`schedule` job) or, for an end-to-end proof, by
// hand against a scratch PR/webhook. Only edited/tested here, not executed
// against a real pending draft, per this track's brief.

import { readFile } from 'node:fs/promises';
import { neutralizeMentions, DISCORD_MESSAGE_LIMIT } from '../community/discord-delivery.mjs';
import { mediaUrlsFor, MEDIA_BASE_URL, hoursOverdue } from './lib/queue.mjs';
import { PLATFORM_RULES, FAST_LANE_LANES } from './lib/queue-schema.mjs';
import { pillarOf } from './lib/feedback.mjs';
import { chunkPreservingRefLine } from './lib/ref-line-chunk.mjs';
import { runMain } from '../lib/cli.mjs';

function escapeFences(text) {
  return String(text ?? '').replace(/```/g, '``​`');
}

/**
 * Round 3 fix (comprehensive audit, not a fifth ad-hoc patch): the ONE
 * shared helper for every dynamic, drafter-controlled field this file
 * renders on a line of its own before the trusted trailing
 * `ref: PR #<n> · <sha> · <file|*>` line — rationale, pillar (via
 * campaign), why, mediaCredit, campaign's own display, the lane/
 * sourceRoutine and platform fallbacks, a raw scheduledAt fallback, and
 * media/alt-text lines. Any one of these left unsanitized is the SAME
 * hijack: a newline (or a Unicode line/paragraph separator — U+2028/2029
 * are LineTerminators for JS's `\s` and for `^`/`$` in `/m` regexes alike,
 * same as `\n`) can plant a second, fake ref:-shaped line earlier in the
 * message, and the poll's REF_LINE_RE match (first match, not last) binds
 * a reaction to the WRONG scope (round 2's rationale finding, round 3's
 * pillar/campaign finding — this generalizes both so a sixth field can't
 * quietly reopen the same class).
 *
 * `String(value ?? '')` first — this PR's own critique exemption
 * (findCritiqueIssues) lets an approved item's `critique` be completely
 * malformed with zero CI findings, by design, so `rationale` (and in
 * principle any other field) is not guaranteed to be a string; a
 * non-string value must never throw and crash brief-building for the
 * WHOLE PR (round 3's self-inflicted regression) — matches
 * neutralizeMentions's own defensive coercion.
 */
function sanitizeInlineField(value) {
  const singleLine = String(value ?? '').replace(/\s+/g, ' ').trim();
  return escapeFences(neutralizeMentions(singleLine));
}

/**
 * `body` (and nothing else in this file) legitimately spans multiple
 * lines — real captions have paragraph breaks — so it can never go
 * through sanitizeInlineField's whitespace-collapse without breaking the
 * product. It still renders before the trusted trailing ref: line, wrapped
 * in a ``` fence for a HUMAN reader, but the poll parses the raw Discord
 * message content string — backticks and all — so a fenced line that
 * happens to match `^ref: PR #\d+ · ...$` is exactly as parseable as an
 * unfenced one (round 3 audit finding). Neutralizes ONLY a line matching
 * that literal, distinctive prefix, leaving every other newline and the
 * rest of the caption completely untouched.
 */
function neutralizeRefLikeLines(text) {
  return String(text ?? '').replace(/^ref: PR #/gm, 'ref\u200B: PR #');
}

/**
 * Round 5 review \u2014 a DIFFERENT dimension from the injection sweep above
 * (this is "does using this value ASSUME a type," not "is this safely
 * renderable as text"). Three shared helpers for every queue-item field
 * this file uses in a way that assumes a type, not just renders one:
 *
 * `stringOrNull(value)` \u2014 for `pillarOf`, which itself calls
 * `campaign.startsWith(...)` on its argument BEFORE this file's own
 * sanitizer ever sees the *output* \u2014 a non-string, non-nullish `campaign`
 * (e.g. `campaign: 2026`, a plain drafting bug) throws inside pillarOf
 * itself. Preserves pillarOf's own null-vs-unrecognized-prefix distinction
 * (a genuinely absent campaign must stay `null`, never become the string
 * `"null"` or trigger its unrecognized-prefix warning).
 */
function stringOrNull(value) {
  return value == null ? null : String(value);
}

/**
 * `compactUtcStamp(scheduled)` \u2014 the "YYYY-MM-DD HH:MM" stamp both the
 * identity line and the schedule line render, formatted from the ALREADY
 * -PARSED `Date` object (via `toISOString()`), never by slicing the raw
 * `draft.scheduledAt` value's own string form. `scheduledAt` is schema-
 * validated as an ISO string, but `Date` happily parses a NUMBER too
 * (`scheduledAt: 1789000000000`, epoch millis) \u2014 that slips straight past
 * the `Number.isNaN(scheduled.getTime())` guard both callers already run,
 * and the raw number has no `.slice` method, so slicing IT (not the
 * parsed Date) used to crash. Formatting from the Date object instead is
 * strictly better than merely not-crashing: it renders a real, correct
 * timestamp for any Date-parseable input, not just the expected ISO
 * string shape. Only ever called after that same NaN guard already
 * passed, so `toISOString()` itself cannot throw (it only ever throws for
 * a `getTime()` that IS NaN \u2014 i.e. exactly the case both callers already
 * excluded).
 */
function compactUtcStamp(scheduled) {
  return scheduled.toISOString().slice(0, 16).replace('T', ' ');
}

/**
 * `asArray(value)` \u2014 `media`/`altText` are schema-expected to be arrays,
 * but neither notify workflow validates the manifest before this file
 * renders it (a raw jq projection, and check-drafts.mjs's own CI check
 * runs independently, not before this step) \u2014 `media: "not-an-array"`
 * (a plain drafting bug) crashed on `.map` inside the shared
 * `mediaUrlsFor` (lib/queue.mjs, out of scope to change here \u2014 used by
 * the real poster too) the instant it ran.
 */
function asArray(value) {
  return Array.isArray(value) ? value : [];
}

/** Webhook display identity (Tree Overhaul S5) — every message this script
 * posts to #longlive-tree shows as "Tree", not a bare webhook name, with
 * a stable avatar so the channel reads as one consistent actor.
 * `apps/web/public/social/tree-avatar.png` is a placeholder (see MAP.md),
 * served from the same host post-queue.mjs/mediaUrlsFor already publish
 * from (MEDIA_BASE_URL) so this never depends on a second CDN/host. */
export const TREE_WEBHOOK_USERNAME = 'Tree';
export const TREE_AVATAR_URL = `${MEDIA_BASE_URL}/social/tree-avatar.png`;

/** "Tree · slot: <calendar time, fast lane (lane), or fast-lane routine> ·
 * pillar: <derived or unspecified>" — the first line of every draft brief
 * (Tree Overhaul S5). A T6 fast-lane item (`lane: "merch"|"appearance"`)
 * renders as `fast lane (<lane>)` unconditionally — spec's own example,
 * "Tree · slot: fast lane (merch) · pillar: launch:merch" — even though it
 * DOES carry a real `scheduledAt` (it takes a displaced calendar slot's
 * day/time): the brief should read as what drafted it, not just when it
 * ships, same as any other calendar slot's time already does. Otherwise
 * `slot` prefers the draft's scheduled calendar time (same formatting as
 * formatScheduleLine's compact stamp); a draft with no valid `scheduledAt`
 * AND no fast-lane `lane` fell outside normal calendar scheduling entirely
 * (the pre-T6 `fast lane: <routine>` shape, Tree Overhaul T1), so it's
 * labeled by the routine that produced it instead. `pillar` is
 * `pillarOf(draft.campaign)` (Tree Overhaul T2 — replaces a truncated
 * `why`, which yielded a sentence fragment where a pillar name belongs),
 * falling back to "unspecified" for a null campaign. */
function formatTreeIdentityLine(draft) {
  const scheduled = new Date(draft.scheduledAt);
  let slot;
  if (FAST_LANE_LANES.includes(draft.lane)) {
    slot = `fast lane (${sanitizeInlineField(draft.lane)})`;
  } else if (Number.isNaN(scheduled.getTime())) {
    slot = `fast lane: ${sanitizeInlineField(draft.lane ?? draft.sourceRoutine ?? 'unknown')}`;
  } else {
    slot = `${compactUtcStamp(scheduled)} UTC`;
  }
  // Round 3, MEDIUM (ref-line injection via pillar/campaign): `campaign` is
  // schema-validated only as "a string when present" — no newline/control-
  // char restriction — so pillarOf's output (which passes an unrecognized
  // prefix's campaign straight through untouched, see feedback.mjs) must
  // be sanitized here, the same as every other field in this message.
  // Round 5: `stringOrNull` first — pillarOf calls `.startsWith` on a
  // non-nullish campaign BEFORE this sanitizer ever sees its output, so a
  // non-string campaign (e.g. `campaign: 2026`) threw inside pillarOf
  // itself, one function too early for the round-3 fix to catch.
  const pillar = sanitizeInlineField(pillarOf(stringOrNull(draft.campaign)) ?? 'unspecified');
  return `Tree · slot: ${slot} · pillar: ${pillar}`;
}

/** Account identity shown per platform — constant, not derived from a
 * draft's own fields (a draft carries no account id; the posted ledger's
 * URLs are the only place the handle shows up today, and hardcoding it
 * here is simpler and cannot drift since this repo only ever posts one
 * account per platform). Round 5: null prototype, same reasoning as
 * queue-schema.mjs's PLATFORM_RULES — `draft.platform: "constructor"`
 * would otherwise resolve to a truthy inherited Object.prototype property
 * instead of falling through to the `?? {...}` fallback below. */
const ACCOUNT_BY_PLATFORM = Object.assign(Object.create(null), {
  x: { label: 'X', handle: '@longlivetscom' },
  instagram: { label: 'Instagram', handle: '@longlivetscom' },
});

/** "in 1d 14h" / "OVERDUE by 25h" — RULINGS-SOCIAL A3 field 3. Never a bare
 * timestamp: hoursOverdue/simple subtraction tell a founder at a glance
 * whether this is routine scheduling or something stuck. */
function formatScheduleLine(draft, now) {
  const iso = draft.scheduledAt ?? 'n/a';
  const scheduled = new Date(draft.scheduledAt);
  // Round 3 audit: an invalid scheduledAt renders RAW here (a genuinely
  // valid ISO date, the only case reaching the two interpolations below,
  // can never itself contain a newline) — the same injection class as
  // rationale/pillar, just via a field a founder would assume is a plain
  // timestamp.
  if (Number.isNaN(scheduled.getTime())) return `Posts at: ${sanitizeInlineField(iso)} — invalid scheduledAt.`;
  const overdue = hoursOverdue({ scheduledAt: draft.scheduledAt }, now);
  if (overdue > 0) {
    const h = Math.round(overdue);
    // Round 5: `compactUtcStamp(scheduled)`, not `iso.slice(...)` — `iso`
    // is the RAW, unvalidated field (a number, e.g. `scheduledAt:
    // 1789000000000`, parses fine as a Date but has no `.slice` method);
    // `scheduled` is the already-parsed Date this NaN guard just proved
    // valid, formatted properly instead.
    return `Posts at: ${compactUtcStamp(scheduled)} UTC — OVERDUE by ${h}h: posts on the first run after approval, retired to failed/ at 48h.`;
  }
  const ms = scheduled.getTime() - now.getTime();
  const totalHours = Math.round(ms / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours - days * 24;
  const relative = days > 0 ? `in ${days}d ${hours}h` : `in ${hours}h`;
  return `Posts at: ${compactUtcStamp(scheduled)} UTC (${relative})`;
}

/** "1,012 / 2,200 characters" / "~256 / 280 weighted characters" —
 * RULINGS-SOCIAL A3 field 4. Falls back to a plain length for an unknown
 * platform rather than throwing — a brief must still render for a draft
 * whose platform is itself the problem check-drafts.mjs will flag. */
function formatLengthLine(draft) {
  const rules = PLATFORM_RULES[draft.platform];
  if (!rules) return `Length: ${String(draft.body ?? '').length} characters (unrecognized platform "${sanitizeInlineField(draft.platform)}")`;
  const measured = rules.measure(draft.body ?? '');
  const approx = rules.unit.startsWith('weighted') ? '~' : '';
  return `Length: ${approx}${measured.toLocaleString('en-US')} / ${rules.maxBody.toLocaleString('en-US')} ${rules.unit}`;
}

/** First 240 chars of `why` + a link to the file at the PR head SHA —
 * RULINGS-SOCIAL A3 field 9. Never the full `why` inline (some run
 * hundreds of words); the file link is how a founder checks the full
 * sourcing claim. */
function formatWhyLine(draft, { headSha, repo }) {
  if (!draft.why) return null;
  // Round 3 audit: sanitized (collapsed to one line, escaped, mention-
  // neutralized) before truncation — same injection class as
  // rationale/pillar, and this field is meant to be one line anyway
  // ("the one-line why", docs/agents/runner-prompts/tree-daily-draft.md).
  const why = sanitizeInlineField(draft.why);
  const truncated = why.length > 240 ? `${why.slice(0, 240)}...` : why;
  // Round 5 LOW: `draft.file` sanitized here too, for consistency with
  // everything else in this pass — it's safe today only because of
  // external invariants this file doesn't itself enforce (the workflow's
  // own jq `$file` argument and automerge-social-approval-gate.mjs's path
  // regex upstream, not anything checked here), so a future reader must
  // not assume this Why: link's construction is what protects it.
  const fileLink =
    headSha && repo && draft.file ? ` (full: https://github.com/${repo}/blob/${headSha}/${sanitizeInlineField(draft.file)})` : '';
  return `Why: ${truncated}${fileLink}`;
}

/** The critique's rationale as the first, UNLABELED paragraph of the brief
 * (Tree Overhaul T2) — "why this post exists," immediately under the Tree
 * identity/draft-number header lines and above `Posts at:`. Unlabeled
 * because it is the pitch, not a field; the existing `Why:` line (sourcing —
 * what the claim rests on) is a different question and is untouched. Scores
 * are never shown here or anywhere in the brief (spec: "the founder judges
 * the post; the scores exist to grade Tree") — only this text. `null` for a
 * draft with no critique yet, so an older/malformed draft still renders. */
function formatRationaleLine(draft) {
  const rationale = draft.critique?.rationale;
  if (!rationale) return null;
  // Round 2, MEDIUM 1 (ref-line injection, same class as T4's this wave)
  // — this is the FIRST line of the message, above the trusted trailing
  // `ref:` line. Round 3: `rationale` is not guaranteed to be a string —
  // this PR's own approval exemption lets an approved item's `critique`
  // be totally malformed with zero CI findings, by design — so
  // sanitizeInlineField's String() coercion is load-bearing here, not
  // decorative (a non-string rationale used to throw and crash
  // brief-building for the whole PR).
  return sanitizeInlineField(rationale);
}

/** One draft's message body lines (everything except the header line and
 * the embed, which buildApprovalPrompt/sendApprovalPrompt handle
 * separately). */
function formatDraftLines(draft, { now, headSha, repo, facebookCrosspost }) {
  // Round 5: `asArray`, not `?? []` — `media`/`altText` are schema-
  // expected arrays, but a present-and-truthy non-array (e.g.
  // `media: "not-an-array"`) skips the `??` fallback entirely and crashed
  // inside mediaUrlsFor's/this function's own `.map` the instant it ran.
  const media = asArray(draft.media);
  const altText = asArray(draft.altText);
  const mediaUrls = mediaUrlsFor({ media }, MEDIA_BASE_URL);

  return [
    formatRationaleLine(draft),
    facebookCrosspost && draft.platform === 'instagram'
      ? 'Also publishes to: your Facebook Page — automatic, image 1 + this caption verbatim, same alt text.'
      : null,
    formatScheduleLine(draft, now),
    formatLengthLine(draft),
    '```',
    // Round 3 audit: `body` legitimately spans multiple lines (real
    // captions have paragraph breaks), so — unlike every other field in
    // this array — it can't go through sanitizeInlineField's whitespace
    // collapse. neutralizeRefLikeLines closes the same injection class
    // without touching any other newline: the poll parses the raw
    // message content string, backticks and all, so a fenced line that
    // happens to match the trusted ref: line's exact shape is exactly as
    // parseable as an unfenced one.
    neutralizeRefLikeLines(escapeFences(neutralizeMentions(draft.body ?? '(no body on file)'))),
    '```',
    // Round 3 audit: a media path is schema-validated only as "a string
    // starting with /" — no newline restriction — and mediaUrlsFor
    // (lib/queue.mjs, shared with the real poster, out of scope to change
    // here) does a bare string concatenation with no encoding. A URL can
    // never legitimately contain whitespace, so collapsing it is always
    // safe, never a false positive.
    ...mediaUrls.map((url, i) => `Image ${i + 1}/${mediaUrls.length}: ${sanitizeInlineField(url)}`),
    // Round 3 audit: JSON.stringify escapes \n/\r but NOT the Unicode
    // line/paragraph separators U+2028/U+2029, which DO start a new
    // "line" for `^`/`$` in a /m regex — a raw U+2028 inside alt text
    // would otherwise still open a fake ref: line right here. altText is
    // meant to be one descriptive line anyway (social/README.md), so
    // collapsing first is always safe.
    ...altText.map((alt, i) => `Alt text ${i + 1}/${altText.length}: ${JSON.stringify(sanitizeInlineField(alt))}`),
    draft.mediaCredit ? `Credit: ${sanitizeInlineField(draft.mediaCredit)}` : null,
    formatWhyLine(draft, { headSha, repo }),
    draft.campaign ? `Campaign: ${sanitizeInlineField(draft.campaign)}` : null,
    `Drafted by: ${sanitizeInlineField(draft.lane ?? draft.sourceRoutine ?? 'unknown')}`,
  ].filter((l) => l !== null && l !== undefined);
}

/**
 * Builds one message object per draft (plus a leading header message),
 * each `{ content, embeds }` — `embeds` is the Discord embed array
 * (`image.url` per image) for sendApprovalPrompt to attach. `pr` is
 * `{ number, url }`. `drafts` is the PR's changed `social/queue/**.json`
 * entries: `{ file, platform, body, scheduledAt, campaign, mediaCredit,
 * media, altText, why, sourceRoutine, critique }` (the FULL `media` array,
 * not just the first element — .github/workflows/social-approval-notify.yml's
 * projection was fixed to stop dropping it).
 *
 * `options.facebookCrosspost` (A4) — when true, every Instagram draft's
 * message gets the cross-post disclosure line. `options.headSha`/`repo`
 * build the `why` field's file link.
 */
export function buildApprovalPrompt(pr, drafts, { now = new Date(), headSha, repo, facebookCrosspost = false } = {}) {
  if (!headSha) {
    throw new Error('buildApprovalPrompt: headSha is required — every brief message must carry a verifiable ref: line (RULINGS-SOCIAL-2.md B1)');
  }

  const header = {
    content: [
      `**Social approval needed · PR #${pr.number}** — <${pr.url}>`,
      // Round 3 audit: this header line is JUST as reachable a target for
      // the ref-line-injection class as anything in a draft message —
      // sanitized the same way, same shared helper.
      `Drafted by: ${sanitizeInlineField(drafts[0]?.lane ?? drafts[0]?.sourceRoutine ?? 'unknown')} · ${drafts.length} draft${drafts.length === 1 ? '' : 's'}` +
        (drafts[0]?.campaign ? ` · campaign \`${sanitizeInlineField(drafts[0].campaign)}\`` : ''),
      'Approve: ✅. Approve with a fix: ✏️ then reply with the caption you want.',
      'Reject: ❌ then reply with why. ✏️ and ❌ do nothing until you reply.',
      'React on a draft for that one, or here for all of them.',
      'Merging the PR yourself does NOT approve — it kills the drafts.',
      `ref: PR #${pr.number} · ${headSha} · *`,
    ].join('\n'),
    embeds: [],
  };

  const draftMessages = drafts.map((draft, i) => {
    // Round 3 audit: the label falls back to the raw `draft.platform` for
    // an unrecognized platform, rendered into the message's bold header
    // line with no sanitization otherwise — same injection class.
    const account = ACCOUNT_BY_PLATFORM[draft.platform] ?? { label: sanitizeInlineField(draft.platform), handle: '(unknown account)' };
    const mediaUrls = mediaUrlsFor({ media: asArray(draft.media) }, MEDIA_BASE_URL);
    const embeds = mediaUrls.map((url) => ({ image: { url } }));
    const content = [
      formatTreeIdentityLine(draft),
      `**Draft ${i + 1} · ${account.label} — ${account.handle}**`,
      ...formatDraftLines(draft, { now, headSha, repo, facebookCrosspost }),
      `ref: PR #${pr.number} · ${headSha} · ${draft.file}`,
    ].join('\n');
    return { content, embeds };
  });

  return [header, ...draftMessages];
}

/**
 * Sends every built message as its own Discord webhook POST, chunking any
 * over-limit `content` with `chunkPreservingRefLine` (guarantees the
 * trailing `ref:` line social-approval-poll.mjs parses always survives
 * intact on one chunk — see lib/ref-line-chunk.mjs) and attaching `embeds`
 * ONLY to the LAST chunk of a message (Discord embeds render against the
 * message they're attached to, and putting them on every chunk would
 * duplicate the image). Checks the `?wait=true` response's `embeds.length`
 * against what was sent — the machine-verifiable half of "the image shows"
 * (RULINGS-SOCIAL A3/A5 condition 3) — and counts an embed-carrying chunk
 * whose response under-reports as a failed chunk, loud, not swallowed.
 * Never throws on an individual chunk's failure — one failed chunk must
 * not lose the confirmed sends around it.
 */
export async function sendApprovalPrompt(
  messages,
  { webhook = process.env.SOCIAL_APPROVAL_WEBHOOK_URL, fetchImpl = fetch } = {},
) {
  if (!webhook) return { status: 'unconfigured', delivered: [], failed: [], embedsSent: 0, embedsAccepted: 0 };

  const delivered = [];
  const failed = [];
  let embedsSent = 0;
  let embedsAccepted = 0;

  for (let m = 0; m < messages.length; m += 1) {
    const { content, embeds = [] } = messages[m];
    const chunks = chunkPreservingRefLine(content, DISCORD_MESSAGE_LIMIT);
    for (let i = 0; i < chunks.length; i += 1) {
      const isLastChunk = i === chunks.length - 1;
      const chunkEmbeds = isLastChunk ? embeds : [];
      try {
        const response = await fetchImpl(`${webhook}?wait=true`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            content: chunks[i],
            username: TREE_WEBHOOK_USERNAME,
            avatar_url: TREE_AVATAR_URL,
            allowed_mentions: { parse: [] },
            ...(chunkEmbeds.length ? { embeds: chunkEmbeds } : {}),
          }),
        });
        if (!response.ok) throw new Error(`Discord approval-channel delivery failed with HTTP ${response.status}`);
        const payload = await response.json();
        if (!payload?.id) throw new Error('Discord approval-channel delivery returned no message id');
        if (chunkEmbeds.length) {
          embedsSent += chunkEmbeds.length;
          const acceptedCount = Array.isArray(payload.embeds) ? payload.embeds.length : 0;
          embedsAccepted += acceptedCount;
          if (acceptedCount !== chunkEmbeds.length) {
            throw new Error(
              `Discord reported embeds.length=${acceptedCount} but this chunk sent ${chunkEmbeds.length} -- the image may not show. This is the machine-verifiable half of "the image shows" (RULINGS-SOCIAL A3); treating it as a failed chunk.`,
            );
          }
        }
        delivered.push({ message: m, chunk: i, messageId: payload.id });
      } catch (err) {
        failed.push({ message: m, chunk: i, error: String(err?.message ?? err) });
      }
    }
  }

  console.log(`approval-prompt: embeds accepted: ${embedsAccepted}`);
  return { status: failed.length === 0 ? 'delivered' : 'partial', delivered, failed, embedsSent, embedsAccepted };
}

async function main() {
  const args = process.argv.slice(2);
  const flag = (name) => {
    const i = args.indexOf(`--${name}`);
    return i === -1 ? undefined : args[i + 1];
  };
  const prNumber = flag('pr');
  const prUrl = flag('pr-url');
  const manifestPath = flag('manifest');
  const headSha = flag('head-sha');
  const repo = flag('repo') ?? process.env.GITHUB_REPOSITORY;
  const facebookCrosspost = flag('facebook-crosspost') === 'true';
  if (!prNumber || !prUrl || !manifestPath) {
    throw new Error(
      'Usage: approval-prompt.mjs --pr <number> --pr-url <url> --manifest <path-to-json-array> [--head-sha <sha>] [--repo <owner/repo>] [--facebook-crosspost true|false]',
    );
  }
  const drafts = JSON.parse(await readFile(manifestPath, 'utf-8'));
  const messages = buildApprovalPrompt({ number: prNumber, url: prUrl }, drafts, { headSha, repo, facebookCrosspost });
  const result = await sendApprovalPrompt(messages);
  if (result.status === 'unconfigured') {
    console.log('approval-prompt: SOCIAL_APPROVAL_WEBHOOK_URL is not configured -- skipping (clean no-op).');
    return;
  }
  console.log(`approval-prompt: ${result.delivered.length} chunk(s) delivered, ${result.failed.length} failed.`);
  for (const f of result.failed) console.error(`approval-prompt: message ${f.message} chunk ${f.chunk} failed: ${f.error}`);
  // A rotated/deleted webhook secret (or a silently-dropped embed) must not
  // fail silently forever (Fable review finding D on #4090) -- a red
  // Actions run here is what watchdog.yml-style monitoring would catch.
  if (result.failed.length > 0) return 1;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'approval-prompt.mjs') {
  runMain(main, { name: 'social-approval-prompt' });
}
