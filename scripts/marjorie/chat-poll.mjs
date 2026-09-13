// Bot chat poll (Marjorie Overhaul M5, docs/specs/marjorie-overhaul/m5-chat.md).
// A plain script, never an agent step — DISCORD_BOT_TOKEN must never enter an
// agent context. Invoked only from `run:` steps under `environment: social`:
//
//   poll     `bot-chat-poll.yml`. Founder messages in #longlive-marjorie and
//            #longlive-tree (and their active threads), newer than 24 h,
//            without the bot's own 👀, oldest first, at most 3 per channel.
//            Each is claimed with 👀 BEFORE its chat routine is dispatched.
//            Claims are never removed or re-dispatched. Once a claim is at
//            least 45 minutes old, every matching run is an active-run veto;
//            a complete run query plus a fresh Discord read lets the poll post
//            one referenced `[chat failed]` marker, then settle with ❌.
//   context  the chat routines' first job. Writes one message's context JSON
//            (the message, what it replies to, the thread root, the last 15
//            messages) for the agent to read from `.scratch/`.
//
// A founder's Discord *reply* at top level (type 19, `message_reference`) is
// a top-level message here — the 09-13 brief reply that reply-poll.mjs
// missed because it only reads threads. Anything that leaves messages unread
// (a refused read, a missing channel, blank content) fails the run, so
// watchdog sees a dead poll instead of a green one.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { DISCORD_API, defaultSleep, discordRequest, hasOwnReaction, reactionUrl, snowflakeMs } from './lib/discord-bot.mjs';
import {
  BOTS, CLAIM, FAILED, FAILURE_PREFIX, HISTORY_LIMIT, REPLIED, SNOWFLAKE, STALE_CLAIM_MS, WINDOW_MS,
  buildContext, createdSince, dispatchArgs, findRuns, founderIds, messageTime, selectInbox,
} from './lib/chat-inbox.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MAX_PAGES = 10;
const RUN_LIMIT = 200;
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
/** Newest-first pages of 100, walked back with `before` until a page ends past the 24 h window. */
export async function readMessages(where, { token, now, fetchImpl, sleepImpl }) {
  const messages = [];
  let before = '';
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const r = await discordRequest('GET', `${DISCORD_API}/channels/${where}/messages?limit=100${before ? `&before=${before}` : ''}`, token, { fetchImpl, sleepImpl });
    if (!r.ok) return { ok: false, status: r.status, messages };
    const batch = Array.isArray(r.data) ? r.data : [];
    messages.push(...batch);
    const oldest = batch[batch.length - 1];
    if (batch.length < 100 || !oldest || now - messageTime(oldest) > WINDOW_MS) return { ok: true, messages };
    before = oldest.id;
  }
  return { ok: false, status: 'page-cap', messages };
}
async function readSources({ channelId, activeThreads, token, now, fetchImpl, sleepImpl }) {
  const threads = activeThreads.filter((t) => t.parent_id === channelId && now - snowflakeMs(t.last_message_id || t.id) <= WINDOW_MS);
  const sources = [];
  let failed = 0;
  for (const threadId of ['', ...threads.map((t) => t.id)]) {
    const r = await readMessages(threadId || channelId, { token, now, fetchImpl, sleepImpl });
    if (!r.ok) {
      failed += 1;
      console.log(`::error::chat-poll: could not read ${threadId || channelId} (HTTP ${r.status})`);
      continue;
    }
    sources.push({ channelId, threadId, messages: r.messages });
  }
  return { sources, failed };
}
export function listRuns(execImpl, repo, workflow, createdAfter) {
  try {
    const out = execImpl('gh', ['run', 'list', '--repo', repo, '--workflow', workflow, '--created', `>=${createdSince(createdAfter)}`,
      '--limit', String(RUN_LIMIT), '--json', 'displayTitle,status,conclusion,url'], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
    const runs = JSON.parse(out);
    return Array.isArray(runs) ? { runs, complete: runs.length < RUN_LIMIT } : null;
  } catch (err) {
    console.log(`::error::chat-poll: gh run list for ${workflow} failed: ${err.message}`);
    return null;
  }
}
function failureBody(item, run) {
  const detail = run?.url ? `${run.url} — ` : '— ';
  return { content: `${FAILURE_PREFIX} ${detail}please send it again`, allowed_mentions: { parse: [] }, message_reference: { message_id: item.messageId, fail_if_not_exists: false } };
}
async function postFailure(item, run, token, opts) {
  const where = item.threadId || item.channelId;
  return discordRequest('POST', `${DISCORD_API}/channels/${where}/messages`, token, { ...opts, body: failureBody(item, run) });
}
async function reconcile({ bot, cfg, claimed, repo, token, dryRun, execImpl, opts, now }) {
  let failures = 0;
  const marked = claimed.filter((item) => item.notified);
  for (const item of marked) {
    if (dryRun) {
      console.log(`dry-run: would finish ❌ for notified ${bot} message ${item.messageId}`);
      continue;
    }
    const where = item.threadId || item.channelId;
    const current = await discordRequest('GET', `${DISCORD_API}/channels/${where}/messages/${item.messageId}`, token, opts);
    if (!current.ok) {
      failures += 1;
      console.log(`::error::chat-poll: could not re-read notified ${item.messageId} (HTTP ${current.status})`);
    } else if (hasOwnReaction(current.data, CLAIM) && !hasOwnReaction(current.data, REPLIED) && !hasOwnReaction(current.data, FAILED)) {
      const settled = await discordRequest('PUT', reactionUrl(where, item.messageId, FAILED), token, opts);
      if (!settled.ok) {
        failures += 1;
        console.log(`::error::chat-poll: could not finish ${FAILED} for notified ${item.messageId} (HTTP ${settled.status})`);
      }
    }
  }
  const pending = claimed.filter((item) => !item.notified && now - Date.parse(item.timestamp) >= STALE_CLAIM_MS);
  if (!pending.length) return { failures };
  for (const item of pending) {
    const where = item.threadId || item.channelId;
    const listed = listRuns(execImpl, repo, cfg.workflow, item.timestamp);
    if (!listed) {
      failures += 1;
      continue;
    }
    if (!listed.complete) {
      failures += 1;
      console.log(`::error::chat-poll: ${cfg.workflow} run list hit ${RUN_LIMIT} for ${item.messageId}; claim is inconclusive`);
      continue;
    }
    const matches = findRuns(listed.runs, bot, item.messageId);
    if (matches.some((run) => run.status !== 'completed')) continue;
    const run = matches.find((candidate) => candidate.url) || null;
    if (dryRun) {
      console.log(`dry-run: would settle stale ${bot} claim ${item.messageId} as failed`);
      continue;
    }
    const current = await discordRequest('GET', `${DISCORD_API}/channels/${where}/messages/${item.messageId}`, token, opts);
    if (!current.ok) {
      failures += 1;
      console.log(`::error::chat-poll: could not re-read ${item.messageId} before settle (HTTP ${current.status})`);
      continue;
    }
    if (!hasOwnReaction(current.data, CLAIM) || hasOwnReaction(current.data, REPLIED) || hasOwnReaction(current.data, FAILED)) continue;
    const posted = await postFailure(item, run, token, opts);
    if (!posted.ok) {
      failures += 1;
      console.log(`::error::chat-poll: [chat failed] post for ${item.messageId} refused (HTTP ${posted.status}); leaving it unsettled for retry`);
      continue;
    }
    const settled = await discordRequest('PUT', reactionUrl(where, item.messageId, FAILED), token, opts);
    if (!settled.ok) failures += 1;
    console.log(`${bot} message ${item.messageId}: posted [chat failed]${settled.ok ? ` and marked ${FAILED}` : `; ${FAILED} refused (HTTP ${settled.status}), marker prevents a duplicate notice`}`);
  }
  return { failures };
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
  let failures = 0;
  const active = await discordRequest('GET', `${DISCORD_API}/guilds/${guildId}/threads/active`, token, opts);
  if (!active.ok) {
    failures += 1;
    console.log(`::error::chat-poll: active thread list -> HTTP ${active.status}; channels only`);
  }
  const activeThreads = (active.ok && active.data?.threads) || [];
  for (const [bot, cfg] of Object.entries(BOTS)) {
    if (!workflowExists(cfg.workflow)) {
      console.log(`${bot}: ${cfg.workflow} is not on main yet — skipped`);
      continue;
    }
    const channelId = ids[bot];
    if (!channelId) {
      failures += 1;
      console.log(`::error::chat-poll: #${cfg.channelName} not found in the guild — ${bot} skipped`);
      continue;
    }
    const { sources, failed } = await readSources({ channelId, activeThreads, token, now, ...opts });
    failures += failed;
    const { picked, claimed, empty } = selectInbox(sources, { founders, now });
    if (empty.length) {
      failures += 1;
      console.log(`::error::chat-poll: ${bot}: ${empty.length} founder message(s) read with a blank body — the bot likely lacks the Message Content intent`);
    }
    const settled = await reconcile({ bot, cfg, claimed, repo, token, dryRun, execImpl, opts, now });
    failures += settled.failures;
    const fresh = picked;
    console.log(`${bot}: ${fresh.length} new, ${claimed.length} earlier claim(s) checked, from ${sources.length} place(s)`);
    for (const item of fresh) {
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
        console.log(`::error::chat-poll: dispatching ${cfg.workflow} for ${item.messageId} failed (${err.message}); the claim stays and the next poll reconciles it`);
      }
    }
  }
  return failures ? 1 : 0;
}
export function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i += 1) {
    if (!args[i].startsWith('--')) continue;
    const next = args[i + 1];
    const hasValue = next !== undefined && !next.startsWith('--');
    flags[args[i].slice(2)] = hasValue ? next : '';
    if (hasValue) i += 1;
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
