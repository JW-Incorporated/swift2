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

function oneLine(text, max) {
  const flat = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

function safe(text) {
  return escapeRefLookalikes(neutralizeMentions(text));
}

function whyLine(lead) {
  const relevance =
    typeof lead.relevance === 'number' ? ` · relevance ${lead.relevance.toFixed(2)}` : '';
  if (lead.kind === 'reply_to_us')
    return `Someone replied to our comment, time-sensitive${relevance}`;
  if (lead.kind === 'hot_thread') return `Active thread on-topic for us${relevance}`;
  return `${oneLine(lead.kind, 40) || 'Opportunity'}${relevance}`;
}

/** True when the Answerer left usable reply text for this lead. */
export function hasDraft(lead) {
  return typeof lead?.draft === 'string' && lead.draft.trim() !== '';
}

/**
 * One reply opportunity as one Discord message, hard-capped at
 * DISCORD_MESSAGE_LIMIT. The reply text is the only elastic part: if the
 * message would overflow it is trimmed (with a visible marker), never the
 * link, footer, or ref line. `ref: reddit · <id>` stays the true last line
 * for Reddit leads so a ✅/❌/⏭️ reaction still reaches social-approval-poll.
 */
export function buildReplyOpportunity(lead, { postedUrl = null, skipUrl = null } = {}) {
  const isReddit = lead.platform === 'reddit';
  const where = isReddit ? `r/${lead.community}` : lead.locator || lead.community;
  const head = [
    `💬 **Reply opportunity · ${oneLine(safe(where), 80)}**`,
    lead.title ? `**${oneLine(safe(lead.title), 200)}**` : null,
    lead.url ? `<${String(lead.url).trim()}>` : null,
    `Why: ${whyLine(lead)}`,
  ].filter(Boolean);
  const tail = [
    lead.target_url && !lead.link_included
      ? `Link to add only if it fits: <${String(lead.target_url).trim()}>`
      : null,
    postedUrl && skipUrl
      ? `Done? [✅ Posted](<${postedUrl}>) · [Skip](<${skipUrl}>)`
      : 'Done? React ✅ posted · ⏭️ skip. Nothing posts automatically.',
  ].filter(Boolean);
  if (isReddit) {
    const postId = String(lead.id ?? '')
      .replace(/\s+/g, ' ')
      .trim();
    if (postId) tail.push(`ref: reddit · ${postId}`);
  }

  const reply = safe(lead.draft).replace(/```/g, '``​`').trim();
  const render = (body, note = null) =>
    [...head, '```', body, '```', note, ...tail].filter((l) => l !== null).join('\n');
  let content = render(reply);
  if (content.length > DISCORD_MESSAGE_LIMIT) {
    const note = '(Reply trimmed to fit Discord.)';
    const room = reply.length - (content.length - DISCORD_MESSAGE_LIMIT) - note.length - 1;
    content = render(reply.slice(0, Math.max(room, 0)).trimEnd(), note);
  }
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
