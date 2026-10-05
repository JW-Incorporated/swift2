import { runMain } from '../lib/cli.mjs';

export const DISCORD_MESSAGE_LIMIT = 2_000;

/** Webhook display identity (Tree Overhaul S5) — matches approval-prompt.mjs's
 * TREE_WEBHOOK_USERNAME/TREE_AVATAR_URL so every message this repo posts to
 * a Discord social channel, community prompts included, shows as "Tree"
 * with the same stable avatar. `apps/web/public/social/tree-avatar.png` is a
 * placeholder (see MAP.md), served from the same host post-queue.mjs
 * publishes media from. */
export const TREE_WEBHOOK_USERNAME = 'Tree';
export const TREE_AVATAR_URL = 'https://www.longlivets.com/social/tree-avatar.png';

export function neutralizeMentions(text) {
  return String(text ?? '')
    .replace(/@everyone/g, '@\u200beveryone')
    .replace(/@here/g, '@\u200bhere')
    .replace(/<@&/g, '<@\u200b&');
}

function fenceTogglesIn(str) {
  const matches = str.match(/```/g);
  return matches ? matches.length : 0;
}

// Headroom for a fence marker `balanceFences` may need to add on either end
// of a chunk \u2014 `'```\n'`/`'\n```'` are both 4 chars, so 8 covers the
// worst case (a chunk that both reopens AND has to re-close a fence).
const FENCE_MARKER_COST = 4;

/**
 * Given a run of raw chunks that may split a triple-backtick fence across a
 * boundary, closes an open fence at the end of a chunk and reopens it at
 * the start of the next so every chunk is independently valid Markdown.
 * Safe to call on chunks produced by `chunkForDiscord`'s packer, which
 * reserves `FENCE_MARKER_COST * 2` headroom on every chunk whenever the
 * content contains any fence marker at all \u2014 see its comment for why a
 * blanket reservation, not a per-chunk prediction, is what's actually safe.
 */
function balanceFences(chunks) {
  const result = [];
  let openFence = false;
  for (const chunk of chunks) {
    const prefix = openFence ? '```\n' : '';
    let body = prefix + chunk;
    let stateAfter = openFence;
    const toggles = fenceTogglesIn(chunk);
    for (let i = 0; i < toggles; i += 1) stateAfter = !stateAfter;
    if (stateAfter) body += '\n```';
    result.push(body);
    openFence = stateAfter;
  }
  return result;
}

/**
 * Splits `content` into Discord-postable chunks, each `<= limit` chars even
 * after fence-balancing. Prefers paragraph (`\n\n`) boundaries; a single
 * paragraph that alone exceeds the pack budget falls back to a hard split
 * (rare path \u2014 most captions don't have a single >2000-char paragraph, so a
 * plain word-boundary-aware cut, not full re-wrapping, is good enough here).
 *
 * Fence safety: rather than predicting exactly which chunk boundary will
 * land inside an open fence (a per-chunk prediction that a round 1 review
 * found could still overflow `limit` by a few characters \u2014 reserving only
 * where a fence was PREDICTED open missed cases where packing multiple
 * small paragraphs together left the fence open at the end of a chunk that
 * was never separately budget-checked), this reserves `FENCE_MARKER_COST *
 * 2` off every packing decision UP FRONT, for the whole call, whenever the
 * content contains any triple-backtick fence at all. That is provably
 * enough headroom for `balanceFences` to add both a reopening prefix and a
 * closing suffix to any one chunk and still fit `limit` \u2014 simpler and
 * always correct, at the cost of possibly one extra chunk in a rare
 * long-fenced caption, which is a fine trade for a Discord message.
 */
export function chunkForDiscord(content, limit = DISCORD_MESSAGE_LIMIT) {
  const text = String(content ?? '');
  if (text.length <= limit) return [text];

  const packLimit = text.includes('```') ? limit - FENCE_MARKER_COST * 2 : limit;

  const paragraphs = text.split('\n\n');
  const rawChunks = [];
  let current = '';
  for (const para of paragraphs) {
    const candidate = current ? `${current}\n\n${para}` : para;
    if (candidate.length <= packLimit) {
      current = candidate;
      continue;
    }
    if (current) rawChunks.push(current);
    if (para.length <= packLimit) {
      current = para;
      continue;
    }
    // Hard-split fallback: word-boundary-aware where cheap (lastIndexOf a
    // space within the budget), plain char-split otherwise.
    let remaining = para;
    while (remaining.length > packLimit) {
      let cut = remaining.lastIndexOf(' ', packLimit);
      if (cut <= 0) cut = packLimit;
      rawChunks.push(remaining.slice(0, cut));
      remaining = remaining.slice(cut).replace(/^ /, '');
    }
    current = remaining;
  }
  if (current) rawChunks.push(current);

  return balanceFences(rawChunks);
}

/** S6 (docs/specs/tree-overhaul/s3-reason-protocol.md §3 "What S6 must
 * add"): the ref line social-approval-poll.mjs dispatches a Reddit
 * reaction against is appended below, after every OTHER field a lead
 * carries — `lead.title`/`lead.draft`/`lead.draft_alt` are uncontrolled
 * free text (a scraped Reddit thread, a drafted reply) rendered BEFORE
 * that trusted trailing line, so a line inside them that happens to be
 * ref-line-shaped is neutralized first, same zero-width-space technique
 * weekly-brief.mjs's escapeRefLookalikes and approval-prompt.mjs's
 * neutralizeRefLikeLines already use for the PR ref grammar (found and
 * fixed twice already this wave) — reused here, not reinvented, extended
 * to also cover S6's own `ref: reddit ·` grammar. */
const REF_LOOKALIKE_RE_PR = /^ref: PR #/gm;
const REF_LOOKALIKE_RE_REDDIT = /^ref: reddit ·/gm;

function escapeRefLookalikes(text) {
  return String(text ?? '')
    .replace(REF_LOOKALIKE_RE_PR, 'ref​: PR #')
    .replace(REF_LOOKALIKE_RE_REDDIT, 'ref​: reddit ·');
}

/**
 * Builds a paste-ready Discord prompt for one lead. Unlike the earlier
 * revision, this never mints its own acknowledgement identifier — it takes
 * the caller-supplied `postedUrl`/`skipUrl` (built by
 * `mailer.mjs#buildAckUrl`, the SAME signed HMAC url the email path has
 * always used — `packages/core/src/community-ack-token.ts`) and simply
 * wraps them in Markdown angle brackets (`<url>`) so Discord's link
 * unfurler never issues its own GET against the acknowledgement route
 * (Fable ruling 2026-09-09 23:24: an unfurl-triggered GET would otherwise
 * be a false, unintended acknowledgement). No unsigned `discord_ack_id`
 * capability exists; `action`/`link` remain bound into the HMAC signature
 * exactly as the email flow already verifies them.
 */
export function buildCommunityPrompt(lead, { postedUrl = null, skipUrl = null } = {}) {
  const platform = lead.platform === 'reddit' ? 'Reddit' : 'Facebook';
  const destination =
    lead.platform === 'reddit' ? `r/${lead.community}` : lead.locator || lead.community;
  const relevance = typeof lead.relevance === 'number' ? lead.relevance.toFixed(2) : 'n/a';
  const lines = [
    `**Community prompt · ${platform} · ${destination}**`,
    `ID: ${lead.id}`,
    `Relevance: ${relevance}`,
    lead.title ? `Thread: ${escapeRefLookalikes(neutralizeMentions(lead.title))}` : null,
    lead.url ? `Open thread: ${lead.url}` : null,
    '',
    '**Paste-ready reply**',
    '```',
    escapeRefLookalikes(neutralizeMentions(lead.draft || '(No draft on file.)')).replace(/```/g, '``\u200b`'),
    '```',
    lead.draft_alt
      ? `**Alternative**\n\`\`\`\n${escapeRefLookalikes(neutralizeMentions(lead.draft_alt)).replace(/```/g, '``\u200b`')}\n\`\`\``
      : null,
    lead.target_url && !lead.link_included
      ? `Link candidate (not included): ${lead.target_url}`
      : null,
    '',
    'Nothing is posted automatically. After your manual decision, record it here:',
    postedUrl && skipUrl
      ? `[Posted manually](<${postedUrl}>) · [Skip](<${skipUrl}>)`
      : 'Acknowledgement control unavailable: COMMUNITY_ACK_SECRET is not configured in this environment yet.',
  ];
  // S6: Reddit only — Facebook prompts (this builder's other caller) are
  // out of S6's scope and keep today's behavior of no ref line at all.
  // `lead.id` lands directly inside this trusted line (not through
  // escapeRefLookalikes, which only guards text rendered ABOVE it), so it
  // is whitespace-collapsed the same way approval-prompt.mjs's
  // sanitizeInlineField guards an inline field — a stray embedded newline
  // in `lead.id` must never be able to shift what this message's true
  // last line is.
  if (lead.platform === 'reddit') {
    const postId = String(lead.id ?? '').replace(/\s+/g, ' ').trim();
    if (postId) lines.push(`ref: reddit · ${postId}`);
  }
  return lines.filter(Boolean).join('\n');
}

/**
 * Sends every prompt to the configured Discord webhook one at a time,
 * never throwing on an individual failure — a transient Discord error on
 * prompt 3 of 5 must not lose the confirmed message ids for prompts 1-2.
 * `onDelivered` fires synchronously right after each confirmed send so a
 * caller (mailer.mjs) can persist that single lead's delivered status
 * immediately, before moving on to the next prompt (Fable ruling: "persist
 * each confirmed Discord message to its lead immediately").
 */
export async function postCommunityPrompts(
  prompts,
  { webhook = process.env.DISCORD_SOCIAL_WEBHOOK, fetchImpl = fetch, onDelivered = null } = {},
) {
  if (!webhook) return { status: 'unconfigured', delivered: [], failed: [] };
  const delivered = [];
  const failed = [];
  for (const prompt of prompts) {
    try {
      if (prompt.content.length > DISCORD_MESSAGE_LIMIT) {
        throw new Error(
          `Community prompt ${prompt.id} exceeds Discord's ${DISCORD_MESSAGE_LIMIT}-character limit`,
        );
      }
      const response = await fetchImpl(`${webhook}?wait=true`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          content: prompt.content,
          username: TREE_WEBHOOK_USERNAME,
          avatar_url: TREE_AVATAR_URL,
          allowed_mentions: { parse: [] },
        }),
      });
      if (!response.ok)
        throw new Error(`Discord social-channel delivery failed with HTTP ${response.status}`);
      const payload = await response.json();
      if (!payload?.id) throw new Error('Discord social-channel delivery returned no message id');
      const record = { leadId: prompt.id, messageId: payload.id };
      delivered.push(record);
      if (onDelivered) await onDelivered(record);
    } catch (err) {
      failed.push({ leadId: prompt.id, message: String(err?.message ?? err) });
    }
  }
  return { status: failed.length === 0 ? 'delivered' : 'partial', delivered, failed };
}

export function deliveryStatusFromResult(result) {
  if (result.status === 'unconfigured') return 'unconfigured';
  if (result.status === 'delivered') return 'delivered';
  return result.failed?.length ? 'partial' : 'missing';
}

async function main() {
  throw new Error(
    'This module is called by community/mailer.mjs; it does not accept direct input.',
  );
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'discord-delivery.mjs') {
  runMain(main, { name: 'community-discord-delivery' });
}
