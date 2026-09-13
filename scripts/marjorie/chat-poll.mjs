// Bot chat poll (Marjorie Overhaul M5, docs/specs/marjorie-overhaul/m5-chat.md).
// A plain script, never an agent step — DISCORD_BOT_TOKEN must never enter an
// agent context. Invoked only from `run:` steps under `environment: social`:
//
//   poll     `bot-chat-poll.yml`. Founder messages in #longlive-marjorie and
//            #longlive-tree (and their active threads), newer than 24 h,
//            without the bot's own 👀, oldest first, at most 3 per channel.
//            Each is claimed with 👀 BEFORE its chat routine is dispatched:
//            reactions are the state, so a claimed message is filtered out
//            and no re-run can double-reply (GitHub list endpoints lag a
//            fresh write by seconds, #4260 — a Discord reaction does not).
//   context  the chat routines' first job. Writes one message's context
//            JSON (the message, what it replies to, the thread root, the
//            last 15 messages) for the agent to read from `.scratch/`.
//
// A founder's Discord *reply* at top level (type 19, `message_reference`) is
// a top-level message here — the 09-13 brief reply that reply-poll.mjs
// missed because it only reads threads.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { SOCIAL_APPROVERS } from '../social/lib/approvers.mjs';
import {
  DISCORD_API, authorName, defaultSleep, discordRequest, hasOwnReaction, isRootOrWebhookMessage, reactionUrl, snowflakeMs,
} from './lib/discord-bot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const CLAIM = '👀';
export const MAX_PER_CHANNEL = 3;
export const WINDOW_MS = 24 * 60 * 60 * 1000;
export const HISTORY_LIMIT = 15;
const HISTORY_TEXT_CAP = 1500;
const MESSAGE_TEXT_CAP = 4000;
// DEFAULT (0) and REPLY (19) are what a person types; pins, joins and
// "started a thread" notices are system types and never answered.
const HUMAN_TYPES = new Set([0, 19]);
const SNOWFLAKE = /^\d{15,21}$/;

export const BOTS = {
  marjorie: { channelName: 'longlive-marjorie', workflow: 'routine-marjorie-chat.yml', channelEnv: 'DISCORD_MARJORIE_CHANNEL_ID' },
  tree: { channelName: 'longlive-tree', workflow: 'routine-tree-chat.yml', channelEnv: 'DISCORD_TREE_CHANNEL_ID' },
};

/**
 * Founder Discord ids: the `DISCORD_FOUNDER_IDS` repo variable when it holds
 * any valid id, else the ids already committed in `SOCIAL_APPROVERS` (the
 * same two founders who approve social) — so the loop needs no variable to
 * exist, and opening it wider is a one-line variable change.
 */
export function founderIds(raw = '') {
  const fromVar = String(raw || '').split(',').map((s) => s.trim()).filter((s) => SNOWFLAKE.test(s));
  if (fromVar.length) return new Set(fromVar);
  return new Set(SOCIAL_APPROVERS.map((id) => String(id).replace(/^discord:/, '')).filter((s) => SNOWFLAKE.test(s)));
}

export function isInboxMessage(message, { founders, sourceId, now }) {
  if (!message || isRootOrWebhookMessage(message, sourceId)) return false;
  if (!founders.has(String(message.author?.id ?? ''))) return false;
  if (!HUMAN_TYPES.has(message.type ?? 0)) return false;
  const at = Date.parse(message.timestamp) || snowflakeMs(message.id);
  if (now - at > WINDOW_MS) return false;
  return !hasOwnReaction(message, CLAIM);
}

function hasText(message) {
  return Boolean(String(message.content || '').trim()) || (message.attachments?.length ?? 0) > 0;
}

/**
 * `sources` = one entry per place a message can live: the channel itself
 * (`threadId: ''`) and each active thread under it. Returns the oldest
 * unclaimed founder messages, capped, plus founder messages whose content
 * came back empty — the signature of a bot without the Message Content
 * intent, surfaced as a warning rather than silently skipped.
 */
export function selectInbox(sources, { founders, now, cap = MAX_PER_CHANNEL }) {
  const picked = [];
  const empty = [];
  for (const { channelId, threadId, messages } of sources) {
    for (const m of messages || []) {
      if (!isInboxMessage(m, { founders, sourceId: threadId || channelId, now })) continue;
      const item = { messageId: m.id, channelId, threadId: threadId || '', timestamp: m.timestamp, length: String(m.content || '').length };
      (hasText(m) ? picked : empty).push(item);
    }
  }
  picked.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp) || (BigInt(a.messageId) < BigInt(b.messageId) ? -1 : 1));
  return { picked: picked.slice(0, cap), empty };
}

export function dispatchArgs(repo, workflow, { messageId, channelId, threadId }) {
  return ['workflow', 'run', workflow, '--repo', repo, '--ref', 'main',
    '-f', `message_id=${messageId}`, '-f', `channel_id=${channelId}`, '-f', `thread_id=${threadId}`];
}

/**
 * Channel ids by name within the guild. The guild comes from the Tree
 * webhook (a webhook GET needs no auth and names its guild and channel —
 * the lookup `social-approval-poll.mjs` already relies on); the Marjorie
 * webhook lives only in `ops`, so her channel is found by name. Env
 * overrides exist for pinning ids later. Never log the webhook URL.
 */
export async function resolveChannels({ env, token, fetchImpl, sleepImpl }) {
  let guildId = env.DISCORD_GUILD_ID || null;
  let webhookChannel = null;
  if (env.DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL) {
    const res = await fetchImpl(env.DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL);
    if (res.ok) {
      const data = await res.json();
      guildId = guildId || data.guild_id || null;
      webhookChannel = data.channel_id || null;
    } else {
      console.log(`::warning::chat-poll: Tree webhook lookup -> HTTP ${res.status}`);
    }
  }
  const ids = { marjorie: env[BOTS.marjorie.channelEnv] || null, tree: env[BOTS.tree.channelEnv] || null };
  if (guildId && (!ids.marjorie || !ids.tree)) {
    const r = await discordRequest('GET', `${DISCORD_API}/guilds/${guildId}/channels`, token, { fetchImpl, sleepImpl });
    const byName = (name) => (r.ok && Array.isArray(r.data) ? r.data.find((c) => c.name === name)?.id : null) || null;
    if (!r.ok) console.log(`::warning::chat-poll: guild channel list -> HTTP ${r.status}`);
    ids.marjorie = ids.marjorie || byName(BOTS.marjorie.channelName);
    ids.tree = ids.tree || byName(BOTS.tree.channelName) || webhookChannel;
  }
  return { guildId, ids };
}

async function readSources({ channelId, activeThreads, token, now, fetchImpl, sleepImpl }) {
  const threads = activeThreads.filter((t) => t.parent_id === channelId && now - snowflakeMs(t.last_message_id || t.id) <= WINDOW_MS);
  const sources = [];
  for (const threadId of ['', ...threads.map((t) => t.id)]) {
    const r = await discordRequest('GET', `${DISCORD_API}/channels/${threadId || channelId}/messages?limit=100`, token, { fetchImpl, sleepImpl });
    if (!r.ok) {
      console.log(`::warning::chat-poll: could not read ${threadId || channelId} (HTTP ${r.status})`);
      continue;
    }
    sources.push({ channelId, threadId, messages: r.data });
  }
  return sources;
}

export async function poll({
  env = process.env, fetchImpl = fetch, sleepImpl = defaultSleep, execImpl = execFileSync, now = Date.now(),
  workflowExists = (wf) => existsSync(path.join(ROOT, '.github', 'workflows', wf)),
} = {}) {
  if (env.BOT_CHAT_ENABLED === 'false') {
    console.log('BOT_CHAT_ENABLED=false — chat loop is off; nothing read');
    return 0;
  }
  const token = env.DISCORD_BOT_TOKEN || '';
  if (!token) {
    console.log('::error::chat-poll: DISCORD_BOT_TOKEN is not set');
    return 1;
  }
  const repo = env.REPO || env.GITHUB_REPOSITORY || '';
  const dryRun = Boolean(env.DRY_RUN);
  const founders = founderIds(env.DISCORD_FOUNDER_IDS);
  const opts = { fetchImpl, sleepImpl };
  const { guildId, ids } = await resolveChannels({ env, token, ...opts });
  if (!guildId) {
    console.log('::error::chat-poll: could not resolve the Discord guild — nothing polled');
    return 1;
  }
  const active = await discordRequest('GET', `${DISCORD_API}/guilds/${guildId}/threads/active`, token, opts);
  if (!active.ok) console.log(`::warning::chat-poll: active thread list -> HTTP ${active.status}; channels only`);
  const activeThreads = (active.ok && active.data?.threads) || [];

  let failures = 0;
  for (const [bot, cfg] of Object.entries(BOTS)) {
    if (!workflowExists(cfg.workflow)) {
      console.log(`${bot}: ${cfg.workflow} is not on main yet — skipped`);
      continue;
    }
    const channelId = ids[bot];
    if (!channelId) {
      console.log(`::warning::chat-poll: #${cfg.channelName} not found in the guild — ${bot} skipped`);
      continue;
    }
    const sources = await readSources({ channelId, activeThreads, token, now, ...opts });
    const { picked, empty } = selectInbox(sources, { founders, now });
    if (empty.length) {
      console.log(`::warning::chat-poll: ${bot}: ${empty.length} founder message(s) read with empty content — the bot likely lacks the Message Content intent`);
    }
    console.log(`${bot}: ${picked.length} founder message(s) to answer (read ${sources.length} of ${1 + activeThreads.filter((t) => t.parent_id === channelId).length} place(s))`);
    for (const item of picked) {
      const where = item.threadId || item.channelId;
      if (dryRun) {
        console.log(`dry-run: would claim ${bot} message ${item.messageId} in ${where} (${item.length} chars)`);
        continue;
      }
      const claim = await discordRequest('PUT', reactionUrl(where, item.messageId, CLAIM), token, opts);
      if (!claim.ok) {
        failures += 1;
        console.log(`::error::chat-poll: could not add ${CLAIM} to ${item.messageId} (HTTP ${claim.status}) — not dispatching, since an unclaimed message would be answered twice`);
        continue;
      }
      try {
        execImpl('gh', dispatchArgs(repo, cfg.workflow, item), { encoding: 'utf8' });
        console.log(`claimed ${bot} message ${item.messageId} → dispatched ${cfg.workflow}`);
      } catch (err) {
        failures += 1;
        console.log(`::error::chat-poll: dispatching ${cfg.workflow} for ${item.messageId} failed: ${err.message}`);
        const undo = await discordRequest('DELETE', reactionUrl(where, item.messageId, CLAIM), token, opts);
        if (!undo.ok) console.log(`::warning::chat-poll: could not remove ${CLAIM} from ${item.messageId} (HTTP ${undo.status}) — it stays claimed and unanswered`);
      }
    }
  }
  return failures ? 1 : 0;
}

function clip(text, cap) {
  const s = String(text || '');
  return s.length > cap ? `${s.slice(0, cap)}…` : s;
}

function line(m) {
  return { id: m.id, author: authorName(m.author), is_bot: Boolean(m.webhook_id || m.author?.bot), at: m.timestamp, text: clip(m.content, HISTORY_TEXT_CAP) };
}

/** The agent's whole view of the conversation. `history` is oldest → newest and ends with the message itself. */
export function buildContext({ bot, guildId, channelId, threadId, message, history, threadRoot }) {
  const where = threadId || channelId;
  return {
    bot,
    channel_id: channelId,
    thread_id: threadId || '',
    top_level: !threadId,
    message_id: message.id,
    url: `https://discord.com/channels/${guildId}/${where}/${message.id}`,
    author: authorName(message.author),
    at: message.timestamp,
    text: clip(message.content, MESSAGE_TEXT_CAP),
    replying_to: message.referenced_message ? line(message.referenced_message) : null,
    thread_root: threadRoot ? line(threadRoot) : null,
    history: history.map(line),
  };
}

export function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith('--')) {
      const next = args[i + 1];
      flags[args[i].slice(2)] = next !== undefined && !next.startsWith('--') ? next : '';
      if (next !== undefined && !next.startsWith('--')) i += 1;
    }
  }
  return flags;
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
  const channel = await discordRequest('GET', `${DISCORD_API}/channels/${channelId}`, token, opts);
  const msg = await discordRequest('GET', `${DISCORD_API}/channels/${where}/messages/${messageId}`, token, opts);
  if (!msg.ok) {
    console.log(`::error::chat-poll context: message ${messageId} unreadable (HTTP ${msg.status})`);
    return 1;
  }
  const before = await discordRequest('GET', `${DISCORD_API}/channels/${where}/messages?before=${messageId}&limit=${HISTORY_LIMIT - 1}`, token, opts);
  const earlier = before.ok && Array.isArray(before.data) ? [...before.data].reverse() : [];
  const root = threadId ? await discordRequest('GET', `${DISCORD_API}/channels/${channelId}/messages/${threadId}`, token, opts) : null;
  const ctx = buildContext({
    bot, guildId: channel.data?.guild_id || '@me', channelId, threadId, message: msg.data,
    history: [...earlier, msg.data], threadRoot: root?.ok ? root.data : null,
  });
  mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  writeFileSync(out, `${JSON.stringify(ctx, null, 2)}\n`);
  console.log(`context for ${bot} message ${messageId}: ${ctx.history.length} message(s) of history${ctx.top_level ? ', top level' : `, thread ${threadId}`}`);
  return 0;
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const [cmd = 'poll', ...rest] = argv;
  if (cmd === 'poll') return poll(deps);
  if (cmd === 'context') return context(parseFlags(rest), deps);
  console.log('usage: chat-poll.mjs poll | context --bot <marjorie|tree> --channel-id <id> --message-id <id> [--thread-id <id>] --out <file>');
  return 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(() => main(), { name: 'chat-poll' });
}
