import { runMain } from '../lib/cli.mjs';

export const DISCORD_MESSAGE_LIMIT = 2_000;

export function neutralizeMentions(text) {
  return String(text ?? '')
    .replace(/@everyone/g, '@\u200beveryone')
    .replace(/@here/g, '@\u200bhere')
    .replace(/<@&/g, '<@\u200b&');
}

export function discordAckUrl({ ackId, action, linkIncluded = false }) {
  const params = new URLSearchParams({ ack: ackId, action });
  if (action === 'posted') params.set('link', linkIncluded ? '1' : '0');
  return `https://www.longlivets.com/api/community/ack?${params.toString()}`;
}

export function buildCommunityPrompt(lead) {
  const platform = lead.platform === 'reddit' ? 'Reddit' : 'Facebook';
  const destination = lead.platform === 'reddit' ? `r/${lead.community}` : lead.locator || lead.community;
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
    lead.draft_alt ? `**Alternative**\n\`\`\`\n${neutralizeMentions(lead.draft_alt).replace(/```/g, '``\u200b`')}\n\`\`\`` : null,
    lead.target_url && !lead.link_included ? `Link candidate (not included): ${lead.target_url}` : null,
    '',
    'Nothing is posted automatically. After your manual decision, record it here:',
    lead.discord_ack_id
      ? `[Posted manually](${discordAckUrl({ ackId: lead.discord_ack_id, action: 'posted', linkIncluded: Boolean(lead.link_included) })}) · [Skip](${discordAckUrl({ ackId: lead.discord_ack_id, action: 'skip' })})`
      : 'Acknowledgement control unavailable: this delivery record is incomplete.',
  ];
  return lines.filter(Boolean).join('\n');
}

export async function postCommunityPrompts(prompts, { webhook = process.env.DISCORD_SOCIAL_WEBHOOK, fetchImpl = fetch } = {}) {
  if (!webhook) return { status: 'unconfigured', delivered: [] };
  const delivered = [];
  for (const prompt of prompts) {
    if (prompt.content.length > DISCORD_MESSAGE_LIMIT) {
      throw new Error(`Community prompt ${prompt.id} exceeds Discord's ${DISCORD_MESSAGE_LIMIT}-character limit`);
    }
    const response = await fetchImpl(`${webhook}?wait=true`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: prompt.content, allowed_mentions: { parse: [] } }),
    });
    if (!response.ok) throw new Error(`Discord social-channel delivery failed with HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload?.id) throw new Error('Discord social-channel delivery returned no message id');
    delivered.push({ leadId: prompt.id, messageId: payload.id });
  }
  return { status: 'delivered', delivered };
}

export function deliveryStatusFromResult(result) {
  return result.status === 'delivered' ? 'delivered' : result.status === 'unconfigured' ? 'unconfigured' : 'missing';
}

async function main() {
  throw new Error('This module is called by community/mailer.mjs; it does not accept direct input.');
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'discord-delivery.mjs') {
  runMain(main, { name: 'community-discord-delivery' });
}
