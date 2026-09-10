import { runMain } from '../lib/cli.mjs';

export const DISCORD_MESSAGE_LIMIT = 2_000;

export function neutralizeMentions(text) {
  return String(text ?? '')
    .replace(/@everyone/g, '@\u200beveryone')
    .replace(/@here/g, '@\u200bhere')
    .replace(/<@&/g, '<@\u200b&');
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
    lead.title ? `Thread: ${neutralizeMentions(lead.title)}` : null,
    lead.url ? `Open thread: ${lead.url}` : null,
    '',
    '**Paste-ready reply**',
    '```',
    neutralizeMentions(lead.draft || '(No draft on file.)').replace(/```/g, '``\u200b`'),
    '```',
    lead.draft_alt
      ? `**Alternative**\n\`\`\`\n${neutralizeMentions(lead.draft_alt).replace(/```/g, '``\u200b`')}\n\`\`\``
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
        body: JSON.stringify({ content: prompt.content, allowed_mentions: { parse: [] } }),
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
