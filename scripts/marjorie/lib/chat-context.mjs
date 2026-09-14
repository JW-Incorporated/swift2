// A chat routine's first job (Marjorie Overhaul M5, m5-chat.md Mechanics 2),
// run as `chat-poll.mjs context` in a `run:` step under `environment: social`.
// M7 (m7-doorbell.md Mechanics 4): its first write is this bot's own 👀 — the
// claim the poll recognises by `reactions[].me` — so a message the doorbell
// dispatched is never dispatched again by the poll. Then it writes the one
// context JSON the agent reads: the message, what it replies to, the thread
// root and the last 15 messages.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { BOTS, CLAIM, FAILED, HISTORY_LIMIT, REPLIED, SNOWFLAKE, buildContext, founderIds } from './chat-inbox.mjs';
import { DISCORD_API, defaultSleep, discordRequest, hasOwnReaction, reactionUrl } from './discord-bot.mjs';

// A refusal is a warning: a second dispatch in the gap stops at its own
// context job once this run's ✅/❌ lands (per-message concurrency group).
async function claim(where, messageId, token, opts) {
  try {
    const r = await discordRequest('PUT', reactionUrl(where, messageId, CLAIM), token, opts);
    if (!r.ok) console.log(`::warning::chat-poll context: ${CLAIM} on ${messageId} refused (HTTP ${r.status}); a duplicate run would stop at its own context job`);
  } catch (err) {
    console.log(`::warning::chat-poll context: ${CLAIM} on ${messageId} failed: ${err.message}`);
  }
}

export async function context(flags, { env = process.env, fetchImpl = fetch, sleepImpl = defaultSleep } = {}) {
  const { bot, out } = flags;
  const channelId = flags['channel-id'] || '';
  const messageId = flags['message-id'] || '';
  const threadId = flags['thread-id'] || '';
  if (!BOTS[bot] || !SNOWFLAKE.test(channelId) || !SNOWFLAKE.test(messageId) || (threadId && !SNOWFLAKE.test(threadId)) || !out) {
    console.log('::error::chat-poll context: needs --bot marjorie|tree, numeric --channel-id and --message-id, optional numeric --thread-id, and --out');
    return 2;
  }
  const token = env.DISCORD_BOT_TOKEN || '';
  const opts = { fetchImpl, sleepImpl };
  const where = threadId || channelId;
  const msg = await discordRequest('GET', `${DISCORD_API}/channels/${where}/messages/${messageId}`, token, opts);
  if (!msg.ok) {
    console.log(`::error::chat-poll context: message ${messageId} unreadable (HTTP ${msg.status})`);
    return 1;
  }
  // allowed_bots lets any github-actions dispatch start this routine, and the
  // doorbell's key starts it as a person, so the routine itself answers only a
  // founder's own message (the poll's ids) and claims nothing else.
  const author = msg.data?.author;
  const notFounder = Boolean(msg.data?.webhook_id || author?.bot || !founderIds(env.DISCORD_FOUNDER_IDS).has(String(author?.id ?? '')));
  const settled = hasOwnReaction(msg.data, REPLIED) || hasOwnReaction(msg.data, FAILED);
  if (!notFounder && !settled && !hasOwnReaction(msg.data, CLAIM)) await claim(where, messageId, token, opts);
  const channel = await discordRequest('GET', `${DISCORD_API}/channels/${channelId}`, token, opts);
  const before = await discordRequest('GET', `${DISCORD_API}/channels/${where}/messages?before=${messageId}&limit=${HISTORY_LIMIT - 1}`, token, opts);
  const earlier = before.ok && Array.isArray(before.data) ? [...before.data].reverse() : [];
  const root = threadId ? await discordRequest('GET', `${DISCORD_API}/channels/${channelId}/messages/${threadId}`, token, opts) : null;
  const ctx = buildContext({
    bot, guildId: channel.data?.guild_id || '@me', channelId, threadId, message: msg.data,
    history: [...earlier, msg.data], threadRoot: root?.ok ? root.data : null,
  });
  if (notFounder) {
    ctx.already = 'not-founder';
    console.log(`::warning::chat-poll context: message ${messageId} is not a founder's message — the run stops here`);
  }
  mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  writeFileSync(out, `${JSON.stringify(ctx, null, 2)}\n`);
  console.log(`context for ${bot} message ${messageId}: ${ctx.history.length} message(s) of history${ctx.top_level ? ', top level' : `, thread ${threadId}`}`);
  return 0;
}
