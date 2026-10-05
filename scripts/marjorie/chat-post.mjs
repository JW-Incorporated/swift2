// Chat reply delivery (Marjorie Overhaul M5, docs/specs/marjorie-overhaul/m5-chat.md).
// Every subcommand but `save` runs in a plain `run:` job that checks out
// `main` — the bot token (`social`) and the webhooks (`ops`, repo secret)
// never reach an agent. `save` is the one the agent runs itself, to write its
// reply file without a Write tool; it touches no secret.
//
//   save    agent job      stdin (or --text) → .scratch/out/chat-reply.md,
//                          --summary → .scratch/out/chat-summary.txt
//   thread  context job    selects the reply location; existing user threads
//           (social)       are preserved and top-level messages stay in the channel;
//                          a message already carrying ✅/❌ is a duplicate run → skip=true.
//                          Outputs reply_thread_id and message_url, which
//                          survive a re-run (artifacts may not)
//   post    post step      the reply through the channel's webhook as the bot.
//           (ops / social) No reply file → nothing sent, result=missing: only
//                          `finish` ever says [chat failed]. The workflows run
//                          this step on a run's first attempt only, so a
//                          re-run never posts twice
//   finish  finish step    lib/chat-delivery.mjs reads Discord first. A failed
//           (social)       read sends nothing (exit 1); a settled message is
//                          left alone; a reply → ✅; an existing notice → ❌;
//                          otherwise the bot-token `[chat failed]` notice (a
//                          reply to the founder's message — what the poll
//                          dedups on) BEFORE ❌, so ❌ never lands without
//                          one. The 👀 stays: it is the claim. Then, only when
//                          this run placed that reaction, the `💬 chat:` turn
//                          log, which carries no founder text (public repo)
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neutralizeMentions } from '../community/discord-delivery.mjs';
import { runMain } from '../lib/cli.mjs';
import { parseFlags } from './chat-poll.mjs';
import { postFailure, readDeliveryState, writtenByFounder } from './lib/chat-delivery.mjs';
import { BOTS, FAILED, FAILURE_PREFIX, REPLIED, SNOWFLAKE } from './lib/chat-inbox.mjs';
import { defaultSleep, discordRequest, reactionUrl, snowflakeMs } from './lib/discord-bot.mjs';
import { post as webhookPost } from './lib/discord.mjs';

export const REPLY_CAP = 1800;
export const ORDINARY_WORD_CAP = 80;
const DETAIL_REASONS = new Set(['requested', 'essential']);
const SUMMARY_CAP = 120;
const REPLY_FILE = 'chat-reply.md';
const SUMMARY_FILE = 'chat-summary.txt';
const OUT_DIR = path.join('.scratch', 'out');
export const WEBHOOK_ENV = { marjorie: 'DISCORD_MARJORIE_WEBHOOK_URL', tree: 'DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL' };

function oneLine(text, cap) {
  const flat = String(text || '').replace(/\s+/g, ' ').trim();
  return flat.length > cap ? `${flat.slice(0, cap - 1)}…` : flat;
}

// Agent-written turn-log text must neither ping anyone nor forge a marker.
function neutralize(text) {
  return text.replace(/@/g, '@​').replace(/<!--/g, '&lt;!--');
}

// social-approval-poll.mjs reads a message's last line against `^ref: PR #…`
// and `^ref: reddit · …`; a zero-width space means no line parses as a ref.
function defuseRefLines(text) {
  return text.replace(/^(\s*)ref:/gim, '$1​ref:');
}

function readText(file) {
  return file && existsSync(file) ? readFileSync(file, 'utf8') : '';
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function setOutput(env, key, value) {
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `${key}=${value}\n`);
  console.log(`${key}=${value}`);
}

export function save(flags, { readStdin = () => readFileSync(0, 'utf8') } = {}) {
  const text = String(flags.text ? flags.text : readStdin()).trim();
  const dir = flags.dir || OUT_DIR;
  const replyFile = path.join(dir, REPLY_FILE);
  const summaryFile = path.join(dir, SUMMARY_FILE);
  for (const file of [replyFile, summaryFile]) {
    if (existsSync(file)) unlinkSync(file);
  }
  if (!text) {
    console.log('chat-post save: the reply is empty — nothing written');
    return 1;
  }
  const detail = String(flags.detail || '');
  if (detail && !DETAIL_REASONS.has(detail)) {
    console.log('chat-post save: --detail must be requested or essential — nothing written');
    return 1;
  }
  const words = text.split(/\s+/).length;
  if (words > ORDINARY_WORD_CAP && !detail) {
    console.log(`chat-post save: ${words} words exceeds the ordinary ${ORDINARY_WORD_CAP}-word limit; shorten and retry, or use --detail requested|essential when justified — nothing written`);
    return 1;
  }
  mkdirSync(dir, { recursive: true });
  writeFileSync(replyFile, `${text}\n`);
  if (flags.summary) writeFileSync(summaryFile, `${oneLine(flags.summary, SUMMARY_CAP)}\n`);
  console.log(`chat-post save: ${text.length} chars${text.length > REPLY_CAP ? ` — over ${REPLY_CAP}, the post step will cut it` : ''}`);
  return 0;
}

export async function startThread({ ctx }) {
  if (!ctx.top_level) return { threadId: ctx.thread_id, note: 'already in a thread' };
  return { threadId: '', note: 'replying at channel top level' };
}

export async function thread(flags, { env = process.env } = {}) {
  const ctx = readJson(flags.context);
  if (!ctx || !BOTS[ctx.bot]) {
    console.log('::error::chat-post thread: unreadable --context file');
    return 1;
  }
  if (ctx.already) {
    const why = ctx.already === 'not-founder' ? 'is not a founder message' : `already carries ${ctx.already === 'replied' ? REPLIED : FAILED} — duplicate run`;
    console.log(`message ${ctx.message_id} ${why}, nothing to do`);
    setOutput(env, 'skip', 'true');
    setOutput(env, 'reply_thread_id', '');
    setOutput(env, 'message_url', '');
    return 0;
  }
  const { threadId, note } = await startThread({ ctx });
  console.log(note);
  setOutput(env, 'skip', 'false');
  setOutput(env, 'reply_thread_id', threadId);
  setOutput(env, 'message_url', ctx.url || '');
  return 0;
}

/**
 * The exact text to post. Mentions are neutralized and `ref:` lines defused
 * BEFORE the cap, and checked again on the final text, so what is checked is
 * what is sent: at most REPLY_CAP plus the short `↪ <link>` prefix — always one
 * Discord message. (Codex review: expanding mentions after the cap split a
 * reply into two messages, and the second could open on a forged `ref:` line.)
 * No reply → `missing` and no text: a webhook `[chat failed]` is never sent,
 * because the poll cannot dedup against a webhook post.
 */
export function composePost({ reply, messageUrl }) {
  let body = defuseRefLines(neutralizeMentions(String(reply || '').trim()));
  if (!body) return { result: 'missing', text: '' };
  if (body.length > REPLY_CAP) {
    const tail = '…\n(cut to fit Discord)';
    body = `${body.slice(0, REPLY_CAP - tail.length).trimEnd()}${tail}`;
  }
  // A webhook cannot reply, so the first line links the ask — in a thread too,
  // because two asks in one thread can be answered out of order and
  // lib/chat-delivery.mjs linksTo() credits a reply only to the message it names.
  return { result: 'replied', text: defuseRefLines(messageUrl ? `↪ ${messageUrl}\n${body}` : body) };
}

export async function postCmd(flags, { env = process.env, fetchImpl = fetch, waitImpl } = {}) {
  const { bot } = flags;
  if (!BOTS[bot]) {
    console.log('::error::chat-post post: needs --bot marjorie|tree');
    return 2;
  }
  const webhook = env[WEBHOOK_ENV[bot]] || '';
  if (!webhook) {
    console.log(`::error::chat-post post: ${WEBHOOK_ENV[bot]} is not set in this job`);
    setOutput(env, 'result', 'post-error');
    return 1;
  }
  const threadId = SNOWFLAKE.test(flags['thread-id'] || '') ? flags['thread-id'] : '';
  const reply = readText(path.join(flags['reply-dir'] || OUT_DIR, REPLY_FILE));
  const { result, text } = composePost({ reply, messageUrl: flags['message-url'] || '' });
  if (result === 'missing') {
    console.log('no reply was saved — nothing posted; finish sends the one [chat failed] notice');
    setOutput(env, 'result', 'missing');
    return 0;
  }
  const sent = await webhookPost(text, { thread: threadId || undefined, webhook, username: BOTS[bot].name, fetchImpl, ...(waitImpl ? { waitImpl } : {}) });
  if (!sent.ok) {
    console.log(`::error::chat-post post: ${sent.error}`);
    setOutput(env, 'result', 'post-error');
    return 1;
  }
  console.log(`posted the reply ${threadId ? `in thread ${threadId}` : 'at channel top level'}`);
  setOutput(env, 'result', result);
  return 0;
}

/**
 * Public-issue line: what was done, never what the founder wrote. A reply
 * also records `replied in <n>s` (message to ✅), the timing M7 uses to re-set
 * the doorbell's stuck threshold after a week (m7-doorbell.md Mechanics 8).
 */
export function turnLog({ bot, summary, replied, messageId, repliedIn = null }) {
  const done = replied ? oneLine(summary, SUMMARY_CAP) || 'answered' : FAILURE_PREFIX;
  const timing = replied && Number.isFinite(repliedIn) ? ` · replied in ${repliedIn}s` : '';
  return `💬 chat: #${BOTS[bot].channelName} → ${neutralize(done)}${timing}\n\n<!-- chat-id: ${messageId} -->`;
}

function writeTurnLog({ comment, env, execImpl }) {
  const repo = env.REPO || env.GITHUB_REPOSITORY || '';
  try {
    const issues = JSON.parse(execImpl('gh', ['issue', 'list', '--repo', repo, '--label', 'founders-brief', '--state', 'open', '--json', 'number', '--limit', '1'], { encoding: 'utf8' }));
    if (!issues[0]) {
      console.log('no open founders-brief issue — turn log skipped');
    } else {
      execImpl('gh', ['issue', 'comment', String(issues[0].number), '--repo', repo, '--body', comment], { encoding: 'utf8' });
      console.log(`turn log → #${issues[0].number}`);
    }
  } catch (err) {
    // A warning, not a failure: re-running this job must never be the fix.
    console.log(`::warning::chat-post finish: turn log failed: ${err.message}`);
  }
}

export async function finish(flags, { env = process.env, fetchImpl = fetch, sleepImpl = defaultSleep, execImpl = execFileSync, now = Date.now } = {}) {
  const { bot } = flags;
  const messageId = flags['message-id'] || '';
  const channelId = flags['channel-id'] || '';
  const sourceThreadId = flags['source-thread-id'] || '';
  const replyThreadId = flags['reply-thread-id'] || '';
  if (!BOTS[bot] || !SNOWFLAKE.test(messageId) || !SNOWFLAKE.test(channelId) || [sourceThreadId, replyThreadId].some((id) => id && !SNOWFLAKE.test(id))) {
    console.log('::error::chat-post finish: needs --bot, numeric --message-id and --channel-id, optional numeric --source-thread-id and --reply-thread-id');
    return 2;
  }
  const token = env.DISCORD_BOT_TOKEN || '';
  const opts = { fetchImpl, sleepImpl };
  const where = sourceThreadId || channelId;
  const found = await readDeliveryState({ bot, messageId, channelId, sourceThreadId, replyThreadId, messageUrl: flags['message-url'] || '', token, ...opts });
  if (!found.ok) {
    console.log(`::error::chat-post finish: ${found.detail} — nothing sent or reacted; re-run this job, or bot-chat-poll settles the claim`);
    return 1;
  }
  if (found.state === 'settled') {
    console.log(`message ${messageId} already carries ✅/❌ — nothing to settle or log`);
    return 0;
  }
  if (!writtenByFounder(found.message, env.DISCORD_FOUNDER_IDS)) {
    console.log(`::warning::chat-post finish: message ${messageId} is not a founder's message — nothing sent, reacted or logged`);
    return 0;
  }
  const attempt = async (label, call) => {
    try {
      const r = await call();
      if (!r.ok) console.log(`::error::chat-post finish: ${label} refused (HTTP ${r.status})`);
      return r.ok;
    } catch (err) {
      console.log(`::error::chat-post finish: ${label} failed: ${err.message}`);
      return false;
    }
  };
  const react = (emoji) => attempt(`${emoji} reaction`, () => discordRequest('PUT', reactionUrl(where, messageId, emoji), token, opts));

  const replied = found.state === 'replied' || flags['post-result'] === 'replied';
  let reacted = false;
  if (replied) {
    reacted = await react(REPLIED);
  } else if (found.state === 'notified') {
    console.log(`a ${FAILURE_PREFIX} notice for ${messageId} is already posted — ❌ only`);
    reacted = await react(FAILED);
  } else {
    const noticed = await attempt(`${FAILURE_PREFIX} notice`, () => postFailure({ where, messageId, runUrl: flags['run-url'] || '', token, ...opts }));
    if (noticed) reacted = await react(FAILED);
    else console.log('no ❌ without a notice — a re-run of this job, or bot-chat-poll, settles this claim later');
  }
  if (!reacted) return 1;
  const repliedIn = replied ? Math.max(0, Math.round((now() - snowflakeMs(messageId)) / 1000)) : null;
  if (replied) console.log(`replied in ${repliedIn}s`);

  // One turn log per message: the ✅/❌ this run just placed stops every later run.
  const summary = readText(path.join(flags['reply-dir'] || OUT_DIR, SUMMARY_FILE));
  writeTurnLog({ comment: turnLog({ bot, summary, replied, messageId, repliedIn }), env, execImpl });
  return 0;
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const [cmd, ...rest] = argv;
  const flags = parseFlags(rest);
  if (cmd === 'save') return save(flags, deps);
  if (cmd === 'thread') return thread(flags, deps);
  if (cmd === 'post') return postCmd(flags, deps);
  if (cmd === 'finish') return finish(flags, deps);
  console.log('usage: chat-post.mjs save|thread|post|finish [flags] — see the header of scripts/marjorie/chat-post.mjs');
  return 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(() => main(), { name: 'chat-post' });
}
