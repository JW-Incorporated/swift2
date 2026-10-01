// The poll's confirmation that it acted on a reply-rejection (Bots v2 W2:
// "any reply to an approval post = rejection + reason captured in one action;
// the bot then marks ❌ itself"). Preferred: add ❌ to the post with the bot
// token (Add Reactions). The bot token was provisioned read-only by design
// (social-approval-poll.mjs header), so a 403 is expected until the owner
// grants that one permission — then fall back to a short webhook message
// pointing at the post, and say loudly (::warning::) that the permission is
// the missing piece. Idempotent across runs: an existing bot ❌ (`me`) or a
// prior `rejected: <messageId>` fallback trailer means nothing more to do.
import { angleUrl } from './approval-text.mjs';

const DISCORD_API = 'https://discord.com/api/v10';
const CROSS_MARK_ENCODED = '%E2%9D%8C'; // ❌
export const REJECTED_FALLBACK_TEXT = '❌ Rejected — reason logged.';

/** @returns {Promise<'already'|'reacted'|'webhook'|'retry'|'skipped'>} */
export async function confirmRejection({ messageId, channelId, guildId, botToken, webhookUrl, webhookId, fetchImpl = fetch, messages = [] }) {
  if (!/^\d+$/.test(String(messageId ?? ''))) return 'skipped';
  const post = messages.find((m) => m.id === messageId);
  if (post?.reactions?.some((r) => r?.emoji?.name === '❌' && r.me)) return 'already';

  let status;
  try {
    const res = await fetchImpl(`${DISCORD_API}/channels/${channelId}/messages/${messageId}/reactions/${CROSS_MARK_ENCODED}/@me`, {
      method: 'PUT',
      headers: { Authorization: `Bot ${botToken}`, 'Content-Length': '0' },
    });
    if (res.ok) return 'reacted';
    status = res.status;
  } catch (err) {
    console.error(`::warning::social-approval-poll: could not add ❌ to message ${messageId} (${err.message}) — retries next run.`);
    return 'retry';
  }
  // Only a permission problem justifies the fallback; a 429/5xx just retries
  // next run (the rejection itself is already applied and re-derives).
  if (status !== 403 && status !== 401) {
    console.error(`::warning::social-approval-poll: adding ❌ to message ${messageId} returned HTTP ${status} — retries next run.`);
    return 'retry';
  }
  console.error(
    `::warning::social-approval-poll: the bot cannot add reactions in #longlive-tree (HTTP ${status}) — confirming rejections by webhook instead. HUMAN ACTION: grant the swift2 read bot "Add Reactions" in that channel.`,
  );
  const trailer = new RegExp(`^rejected: ${messageId}$`, 'm');
  if (messages.some((m) => String(m.webhook_id) === String(webhookId) && trailer.test(String(m.content ?? '')))) return 'already';
  const link = guildId ? `${angleUrl(`https://discord.com/channels/${guildId}/${channelId}/${messageId}`)}\n` : '';
  try {
    const res = await fetchImpl(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `${REJECTED_FALLBACK_TEXT}\n${link}rejected: ${messageId}`, flags: 4, allowed_mentions: { parse: [] } }),
    });
    if (res && res.ok === false) return 'retry';
  } catch {
    return 'retry';
  }
  return 'webhook';
}
