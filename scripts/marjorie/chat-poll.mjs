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
//            a complete run query plus lib/chat-delivery.mjs's Discord read
//            settles it: ✅ for a reply already there, ❌ for a notice already
//            there, else one referenced `[chat failed]` notice, then ❌.
//            While DOORBELL_LIVE it also watches the M7 doorbell
//            (m7-doorbell.md Mechanics 5; doorbellWatch in lib/chat-inbox.mjs).
//   context  the chat routines' first job (lib/chat-context.mjs): claims the
//            message with this bot's own 👀, then writes its context JSON for
//            the agent to read from `.scratch/`.
//
// A founder's Discord *reply* at top level (type 19, `message_reference`) is
// a top-level message here — the 09-13 brief reply that reply-poll.mjs
// missed because it only reads threads. Anything that leaves messages unread
// (a refused read, a missing channel, blank content) fails the run, so
// watchdog sees a dead poll instead of a green one.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { context } from './lib/chat-context.mjs';
import { postFailure, readDeliveryState } from './lib/chat-delivery.mjs';
import { DISCORD_API, defaultSleep, discordRequest, reactionUrl, snowflakeMs } from './lib/discord-bot.mjs';
import {
  ALARM_WORKFLOW, BOTS, CLAIM, CLAIM_WINDOW_MS, DOORBELL_LIVE, FAILED, FAILURE_PREFIX, MAX_PER_CHANNEL, REPLIED, STALE_CLAIM_MS,
  alarmArgs, createdSince, dispatchArgs, doorbellWatch, findRuns, founderIds, messageTime, selectInbox,
} from './lib/chat-inbox.mjs';
export { context };
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
/** Newest-first pages of 100, walked back with `before` until a page ends past the claim window (an old 👀 claim on a later page must still be seen). */
export async function readMessages(where, { token, now, fetchImpl, sleepImpl }) {
  const messages = [];
  let before = '';
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const r = await discordRequest('GET', `${DISCORD_API}/channels/${where}/messages?limit=100${before ? `&before=${before}` : ''}`, token, { fetchImpl, sleepImpl });
    if (!r.ok) return { ok: false, status: r.status, messages };
    const batch = Array.isArray(r.data) ? r.data : [];
    messages.push(...batch);
    const oldest = batch[batch.length - 1];
    if (batch.length < 100 || !oldest || now - messageTime(oldest) > CLAIM_WINDOW_MS) return { ok: true, messages };
    before = oldest.id;
  }
  return { ok: false, status: 'page-cap', messages };
}
async function readSources({ channelId, activeThreads, token, now, fetchImpl, sleepImpl }) {
  // Threads stay in view for the claim window, so a stale claim there is still reconciled.
  const threads = activeThreads.filter((t) => t.parent_id === channelId && now - snowflakeMs(t.last_message_id || t.id) <= CLAIM_WINDOW_MS);
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
/** One claim, from what Discord shows now (the same check as the routines' finish). Returns failures. */
async function settle({ bot, item, run, guildId, token, opts }) {
  const where = item.threadId || item.channelId;
  const messageUrl = `https://discord.com/channels/${guildId}/${where}/${item.messageId}`;
  const found = await readDeliveryState({ bot, messageId: item.messageId, channelId: item.channelId, sourceThreadId: item.threadId, messageUrl, token, ...opts });
  if (!found.ok) {
    console.log(`::error::chat-poll: ${found.detail} — ${item.messageId} left unsettled; nothing sent`);
    return 1;
  }
  if (found.state === 'settled') return 0;
  // The channel scan already saw a notice; never post a second one.
  const state = found.state === 'open' && item.notified ? 'notified' : found.state;
  if (state === 'open') {
    const posted = await postFailure({ where, messageId: item.messageId, runUrl: run?.url || '', token, ...opts });
    if (!posted.ok) {
      console.log(`::error::chat-poll: ${FAILURE_PREFIX} post for ${item.messageId} refused (HTTP ${posted.status}); leaving it unsettled for retry`);
      return 1;
    }
  }
  const emoji = state === 'replied' ? REPLIED : FAILED;
  const settled = await discordRequest('PUT', reactionUrl(where, item.messageId, emoji), token, opts);
  console.log(`${bot} message ${item.messageId}: ${state}${settled.ok ? `, marked ${emoji}` : `; ${emoji} refused (HTTP ${settled.status}), retried next poll without a second notice`}`);
  return settled.ok ? 0 : 1;
}
async function reconcile({ bot, cfg, claimed, repo, guildId, token, dryRun, execImpl, opts, now }) {
  let failures = 0;
  for (const item of claimed) {
    let run = null;
    if (!item.notified) {
      if (now - Date.parse(item.timestamp) < STALE_CLAIM_MS) continue;
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
      if (matches.some((candidate) => candidate.status !== 'completed')) continue;
      run = matches.find((candidate) => candidate.url) || null;
    }
    if (dryRun) {
      console.log(`dry-run: would settle ${item.notified ? 'notified' : 'stale'} ${bot} claim ${item.messageId}`);
      continue;
    }
    failures += await settle({ bot, item, run, guildId, token, opts });
  }
  return { failures };
}
// Mechanics 5's one read, once per bot per pass (Codex R2): runs since the oldest
// rung message; null (every rung message waits) when the list failed or came back full.
function doorbellRuns({ bot, cfg, fresh, repo, execImpl }) {
  const rung = fresh.filter((item) => item.doorbell);
  if (!rung.length) return [];
  const oldest = rung.reduce((a, b) => (Date.parse(a.timestamp) <= Date.parse(b.timestamp) ? a : b));
  const listed = listRuns(execImpl, repo, cfg.workflow, oldest.timestamp);
  if (listed?.complete) return listed.runs;
  console.log(`::error::chat-poll: ${bot}: ${rung.length} message(s) carry another ${CLAIM} but the runs could not be listed completely; left for the next pass`);
  return null;
}
// A warning, not a failure: the message is still claimed and answered.
function raiseAlarm({ execImpl, repo, stage, bot, item }) {
  try {
    execImpl('gh', alarmArgs(repo, stage, { bot, ...item }), { encoding: 'utf8' });
    console.log(`::warning::chat-poll: ${stage} on ${bot} message ${item.messageId} → dispatched ${ALARM_WORKFLOW}`);
  } catch (err) {
    console.log(`::warning::chat-poll: ${ALARM_WORKFLOW} (${stage}) for ${item.messageId} failed: ${err.message}`);
  }
}
export async function poll({
  env = process.env, fetchImpl = fetch, sleepImpl = defaultSleep, execImpl = execFileSync, now = Date.now(),
  workflowExists = (wf) => existsSync(path.join(ROOT, '.github', 'workflows', wf)), doorbellLive = DOORBELL_LIVE,
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
    // Watching the doorbell skips messages it has, so the cap applies to claims below.
    const { picked, claimed, empty } = selectInbox(sources, { founders, now, cap: doorbellLive ? Infinity : MAX_PER_CHANNEL });
    if (empty.length) {
      failures += 1;
      console.log(`::error::chat-poll: ${bot}: ${empty.length} founder message(s) read with a blank body — the bot likely lacks the Message Content intent`);
    }
    const settled = await reconcile({ bot, cfg, claimed, repo, guildId, token, dryRun, execImpl, opts, now });
    failures += settled.failures;
    const fresh = picked;
    console.log(`${bot}: ${fresh.length} new, ${claimed.length} earlier claim(s) checked, from ${sources.length} place(s)`);
    const runs = doorbellLive ? doorbellRuns({ bot, cfg, fresh, repo, execImpl }) : [];
    if (runs === null) failures += 1;
    let taken = 0;
    for (const item of fresh) {
      if (taken >= MAX_PER_CHANNEL) break;
      const where = item.threadId || item.channelId;
      let watch = { action: 'claim', alarm: null };
      if (doorbellLive) {
        if (item.doorbell && runs === null) continue;
        watch = doorbellWatch(item, { now, runs: item.doorbell ? findRuns(runs, bot, item.messageId) : [] });
        if (watch.action === 'skip') console.log(`${bot} message ${item.messageId}: ${watch.why} — skipped`);
        if (watch.action === 'skip') continue;
      }
      taken += 1;
      if (dryRun) {
        console.log(`dry-run: would claim ${bot} message ${item.messageId} in ${where} (${item.length} chars)${watch.alarm ? `, then raise ${watch.alarm}` : ''}${watch.action === 'claim-only' ? ', without a dispatch' : ''}`);
        continue;
      }
      const claim = await discordRequest('PUT', reactionUrl(where, item.messageId, CLAIM), token, opts);
      if (!claim.ok) {
        failures += 1;
        console.log(`::error::chat-poll: could not add ${CLAIM} to ${item.messageId} (HTTP ${claim.status}) — not dispatching, since an unclaimed message would be answered twice`);
        continue;
      }
      // Only after a claim: an unclaimed message comes back next pass, and its alarm must not.
      if (watch.alarm) raiseAlarm({ execImpl, repo, stage: watch.alarm, bot, item });
      if (watch.action === 'claim-only') {
        console.log(`claimed ${bot} message ${item.messageId} without a dispatch (${watch.why}); the 45-minute reconcile settles it`);
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
