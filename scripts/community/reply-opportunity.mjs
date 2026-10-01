// W3 (docs/plans/bots-v2/PLAN.md): one Discord message per community reply
// opportunity, phone-scannable, reply text in a code block ready to copy.
// Pure builders + a metadata-only webhook probe; no Supabase, no posting here
// (discord-delivery.mjs#postCommunityPrompts sends, mailer.mjs orchestrates).
import { DISCORD_MESSAGE_LIMIT, neutralizeMentions } from './discord-delivery.mjs';

/** Header + per-lead messages post under this display name so a reply
 * opportunity is visually distinct from Tree's approval prompts, which share
 * the same channel/webhook (social-approval-poll keys on `webhook_id`, not on
 * the display name, so the ref-line reaction path is unaffected). */
export const COMMUNITY_WEBHOOK_USERNAME = 'Tree · Reply opportunities';

const REF_LOOKALIKE_RE_PR = /^ref: PR #/gm;
const REF_LOOKALIKE_RE_REDDIT = /^ref: reddit ·/gm;

// Free text rendered ABOVE the trusted trailing `ref: reddit · <id>` line must
// never be ref-line-shaped (same zero-width-space defense approval-prompt.mjs
// and weekly-brief.mjs use; social-approval-poll parses the LAST line only).
function escapeRefLookalikes(text) {
  return String(text ?? '')
    .replace(REF_LOOKALIKE_RE_PR, 'ref​: PR #')
    .replace(REF_LOOKALIKE_RE_REDDIT, 'ref​: reddit ·');
}

/** Longest prefix of `text` within `units` UTF-16 units, never splitting a surrogate pair. */
function clipUnits(text, units) {
  let out = '';
  for (const ch of text) {
    if (out.length + ch.length > units) break;
    out += ch;
  }
  return out;
}

function oneLine(text, max) {
  const flat = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  return flat.length > max ? `${clipUnits(flat, max - 1).trimEnd()}…` : flat;
}

function safe(text) {
  return escapeRefLookalikes(neutralizeMentions(text));
}

// Untrusted titles must not be able to form a markdown link ("[x](http://…)").
function escapeLinkBrackets(text) {
  return text.replace(/[[\]]/g, '\\$&');
}

// Every URL the message carries is bounded, so the 2000-char cap can always be
// met by trimming the reply alone; an over-long or odd URL is dropped, not sent.
const MAX_URL_UNITS = 300;
const MAX_ACK_URL_UNITS = 450;
const MIN_REPLY_UNITS = 200;
const TRIM_NOTE = '(Reply trimmed to fit Discord.)';

function urlLine(url, prefix = '') {
  const clean = String(url ?? '').trim();
  if (!clean || clean.length > MAX_URL_UNITS || /[\s<>]/.test(clean)) return null;
  return `${prefix}<${clean}>`;
}

function whyLine(lead) {
  const relevance =
    typeof lead.relevance === 'number' ? ` · relevance ${lead.relevance.toFixed(2)}` : '';
  if (lead.kind === 'reply_to_us')
    return `Someone replied to our comment, time-sensitive${relevance}`;
  if (lead.kind === 'hot_thread') return `Active thread on-topic for us${relevance}`;
  return `${oneLine(safe(lead.kind), 40) || 'Opportunity'}${relevance}`;
}

/** True when the Answerer left usable reply text for this lead. */
export function hasDraft(lead) {
  return typeof lead?.draft === 'string' && lead.draft.trim() !== '';
}

function render({ head, tail }, body, { note = null, alt = null } = {}) {
  return [
    ...head.filter(Boolean),
    '```',
    body,
    '```',
    ...[note, alt, ...tail].filter(Boolean),
  ].join('\n');
}

/**
 * One reply opportunity as one Discord message, guaranteed at or under
 * DISCORD_MESSAGE_LIMIT. Only the reply text is elastic (trimmed by code
 * point, with a visible note); URLs are clamped/dropped, the optional Alt line
 * is skipped unless it fits whole, and if the full layout still cannot hold a
 * useful reply it degrades to a minimal message (sub, title, reply, ref).
 * `ref: reddit · <id>` stays the true last line for Reddit leads so a ✅/❌/⏭️
 * reaction still reaches social-approval-poll.
 */
export function buildReplyOpportunity(lead, { postedUrl = null, skipUrl = null } = {}) {
  const isReddit = lead.platform === 'reddit';
  const where = escapeLinkBrackets(
    oneLine(safe(isReddit ? `r/${lead.community}` : lead.locator || lead.community), 80),
  );
  const titleText = (max) =>
    lead.title ? `**${escapeLinkBrackets(oneLine(safe(lead.title), max))}**` : null;
  const postId = oneLine(lead.id, 100);
  const refLine = isReddit && postId ? `ref: reddit · ${postId}` : null;
  const acks =
    postedUrl &&
    skipUrl &&
    postedUrl.length <= MAX_ACK_URL_UNITS &&
    skipUrl.length <= MAX_ACK_URL_UNITS;
  const footer = acks
    ? `Done? [✅ Posted](<${postedUrl}>) · [Skip](<${skipUrl}>)`
    : 'Done? React ✅ posted · ⏭️ skip. Nothing posts automatically.';
  const heading = `💬 **Reply opportunity · ${where}**`;
  const full = {
    head: [heading, titleText(200), urlLine(lead.url), `Why: ${whyLine(lead)}`],
    tail: [
      lead.target_url && !lead.link_included
        ? urlLine(lead.target_url, 'Link to add only if it fits: ')
        : null,
      footer,
      refLine,
    ],
  };
  const minimal = { head: [heading, titleText(100)], tail: [refLine] };
  const reply = safe(lead.draft).replace(/```/g, '``​`').trim();
  const altText = String(lead.draft_alt ?? '').trim();
  const alt = altText ? `Alt: ${oneLine(safe(altText), 200)}` : null;

  const fitReply = (parts) => {
    const whole = render(parts, reply);
    if (whole.length <= DISCORD_MESSAGE_LIMIT) return whole;
    const room = DISCORD_MESSAGE_LIMIT - render(parts, '', { note: TRIM_NOTE }).length;
    if (room < MIN_REPLY_UNITS) return null;
    return render(parts, clipUnits(reply, room).trimEnd(), { note: TRIM_NOTE });
  };

  if (alt) {
    const withAlt = render(full, reply, { alt });
    if (withAlt.length <= DISCORD_MESSAGE_LIMIT) return withAlt;
  }
  const content = fitReply(full) ?? fitReply(minimal);
  if (content === null) throw new Error(`Reply opportunity ${postId} cannot fit Discord's limit`);
  return content;
}

/** Short lead-in posted once before a batch so the run reads as one block. */
export function buildBatchHeader(count, { mode = 'daily' } = {}) {
  const noun = count === 1 ? 'reply opportunity' : 'reply opportunities';
  const lead =
    mode === 'replies-waiting'
      ? 'Someone replied to us, so these are time-sensitive.'
      : 'Open, copy, paste, post.';
  return `💬 **${count} ${noun} from Tree**\n${lead} Each one below is a single thread with its reply ready to copy.`;
}

/**
 * Metadata-only probe: GETs the webhook object and returns ONLY
 * `{ channelId, name }` (or `{ error }`), so logs can prove which channel the
 * community prompts land in. Never returns, logs, or throws the URL/token.
 */
export async function describeWebhookTarget(webhook, { fetchImpl = fetch } = {}) {
  if (!webhook) return { error: 'webhook not configured' };
  try {
    const response = await fetchImpl(webhook, { method: 'GET' });
    if (!response.ok) return { error: `HTTP ${response.status}` };
    const payload = await response.json();
    return {
      channelId: String(payload?.channel_id ?? 'unknown'),
      name: oneLine(payload?.name ?? 'unknown', 80),
    };
  } catch (err) {
    return { error: String(err?.name ?? 'request failed') };
  }
}

export function formatWebhookTarget(target) {
  return target.error
    ? `community-mailer: webhook target check failed (${target.error}).`
    : `community-mailer: webhook target channel_id=${target.channelId} name="${target.name}".`;
}
