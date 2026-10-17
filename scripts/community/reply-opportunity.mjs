// W3 (docs/plans/bots-v2/PLAN.md), reshaped by #5987: the mailer lane's reply
// opportunity card (message 1); the reply is its own code-box message 2
// (reply-card.mjs).
// Pure builders + a metadata-only webhook probe; no Supabase, no posting here
// (discord-delivery.mjs#postCommunityPrompts sends, mailer.mjs orchestrates).
import { DISCORD_MESSAGE_LIMIT, neutralizeMentions } from './discord-delivery.mjs';
import { facebookLeadUrl } from './awareness-fb-link.mjs';
import { replyAsLine, withReplyAccount } from './reddit-account.mjs';
import { REACTION_FOOTER, REPLY_TRIM_NOTE, buildDraftBox, clipUnits } from './reply-card.mjs';

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

export { clipUnits };

export function oneLine(text, max) {
  const flat = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  return flat.length > max ? `${clipUnits(flat, max - 1).trimEnd()}…` : flat;
}

export function safe(text) {
  return escapeRefLookalikes(neutralizeMentions(text));
}

// Untrusted titles must not be able to form a markdown link ("[x](http://…)").
export function escapeLinkBrackets(text) {
  return text.replace(/[[\]]/g, '\\$&');
}

// Every URL the message carries is bounded, so the 2000-char cap is always met;
// an over-long or odd URL is dropped, not sent.
const MAX_URL_UNITS = 300;

export function urlLine(url, prefix = '') {
  const clean = String(url ?? '').trim();
  if (!clean || clean.length > MAX_URL_UNITS || /[\s<>]/.test(clean)) return null;
  return `${prefix}<${clean}>`;
}

/** A thread link as a no-preview line; a Reddit link gets the brand-account switch unless that pushes it past the URL bound. */
export function threadLinkLine(url) {
  return urlLine(withReplyAccount(url)) ?? urlLine(url);
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

/**
 * Message 1 of a mailer-lane reply lead: the card only (the reply is message 2,
 * reply-card.mjs#buildDraftBox). Every URL and free-text field is bounded, so
 * the card always fits Discord's limit. `ref: reddit · <id>` stays the true
 * last line for Reddit leads so the social poll's ledger still reads it; the
 * founder's ✅/❌ reaction on the card is what community-reaction-poll acts on.
 */
export function buildReplyOpportunity(lead) {
  const isReddit = lead.platform === 'reddit';
  const where = escapeLinkBrackets(
    oneLine(safe(isReddit ? `r/${lead.community}` : lead.locator || lead.community), 80),
  );
  const title = lead.title ? `**${escapeLinkBrackets(oneLine(safe(lead.title), 200))}**` : null;
  const postId = oneLine(lead.id, 100);
  const refLine = isReddit && postId ? `ref: reddit · ${postId}` : null;
  const altText = String(lead.draft_alt ?? '').trim();
  const lines = [
    `💬 **Reply opportunity · ${where}**`,
    title,
    threadLinkLine(isReddit ? lead.url : facebookLeadUrl(lead)),
    isReddit ? replyAsLine() : null,
    `Why: ${whyLine(lead)}`,
    buildDraftBox(lead.draft).trimmed ? REPLY_TRIM_NOTE : null,
    altText ? `Alt: ${oneLine(safe(altText), 200)}` : null,
    lead.target_url && !lead.link_included
      ? urlLine(lead.target_url, 'Link to add only if it fits: ')
      : null,
    REACTION_FOOTER,
    refLine,
  ].filter(Boolean);
  const content = lines.join('\n');
  if (content.length > DISCORD_MESSAGE_LIMIT)
    throw new Error(`Reply opportunity ${postId} cannot fit Discord's limit`);
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
