// Chat reply delivery (Marjorie Overhaul M5, docs/specs/marjorie-overhaul/m5-chat.md).
// Every subcommand but `save` runs in a plain `run:` job that checks out
// `main` — the bot token (`social`) and the webhooks (`ops`, repo secret)
// never reach an agent. `save` is the one the agent runs itself, to write its
// reply file without a Write tool; it touches no secret.
//
//   save    agent job      stdin (or --text) → .scratch/out/chat-reply.md,
//                          --summary → .scratch/out/chat-summary.txt
//   thread  context job    starts a thread on a top-level message (a thread
//           (social)       takes its message's id); a message already
//                          carrying ✅/❌ is a duplicate run → skip=true
//   post    post job       the reply, or `[chat failed] <run url>` when there
//           (ops / social) is none, through the channel's webhook as the bot.
//                          With the bot token in the job (Tree), it re-reads
//                          the message first and posts nothing if it already
//                          carries ✅/❌, so re-running a failed job never
//                          answers twice
//   finish  finish job     re-reads the message, then ✅ for a reply; for a
//           (social)       failure, the bot-token `[chat failed]` notice (a
//                          reply to the founder's message — the marker
//                          chat-poll.mjs settles on) BEFORE ❌, so ❌ never
//                          lands without one. The 👀 stays: it is the claim.
//                          Then the `💬 chat:` turn log, which carries no
//                          founder text — this repo is public
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neutralizeMentions } from '../community/discord-delivery.mjs';
import { runMain } from '../lib/cli.mjs';
import { parseFlags } from './chat-poll.mjs';
import { BOTS, FAILED, FAILURE_PREFIX, REPLIED, SNOWFLAKE } from './lib/chat-inbox.mjs';
import { DISCORD_API, defaultSleep, discordRequest, hasOwnReaction, reactionUrl } from './lib/discord-bot.mjs';
import { post as webhookPost } from './lib/discord.mjs';

export const REPLY_CAP = 1800;
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

async function isSettled({ where, messageId, token, fetchImpl, sleepImpl }) {
  try {
    const r = await discordRequest('GET', `${DISCORD_API}/channels/${where}/messages/${messageId}`, token, { fetchImpl, sleepImpl });
    return r.ok && (hasOwnReaction(r.data, REPLIED) || hasOwnReaction(r.data, FAILED));
  } catch {
    return false;
  }
}

export function save(flags, { readStdin = () => readFileSync(0, 'utf8') } = {}) {
  const text = String(flags.text ? flags.text : readStdin()).trim();
  if (!text) {
    console.log('chat-post save: the reply is empty — nothing written');
    return 1;
  }
  const dir = flags.dir || OUT_DIR;
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, REPLY_FILE), `${text}\n`);
  if (flags.summary) writeFileSync(path.join(dir, SUMMARY_FILE), `${oneLine(flags.summary, SUMMARY_CAP)}\n`);
  console.log(`chat-post save: ${text.length} chars${text.length > REPLY_CAP ? ` — over ${REPLY_CAP}, the post step will cut it` : ''}`);
  return 0;
}

export function threadName(bot, text) {
  return `${BOTS[bot].name} · ${oneLine(text, 80) || 'chat'}`.slice(0, 100);
}

export async function startThread({ ctx, token, fetchImpl = fetch, sleepImpl = defaultSleep }) {
  if (!ctx.top_level) return { threadId: ctx.thread_id, note: 'already in a thread' };
  const body = { name: threadName(ctx.bot, ctx.text), auto_archive_duration: 1440 };
  const r = await discordRequest('POST', `${DISCORD_API}/channels/${ctx.channel_id}/messages/${ctx.message_id}/threads`, token, { body, fetchImpl, sleepImpl });
  if (r.ok) return { threadId: r.data?.id || ctx.message_id, note: 'thread started' };
  if (r.status === 400 && r.data?.code === 160004) return { threadId: ctx.message_id, note: 'thread already existed' };
  return { threadId: '', note: `thread refused (HTTP ${r.status}${r.data?.code ? `, code ${r.data.code}` : ''}) — replying at channel top level` };
}

export async function thread(flags, { env = process.env, fetchImpl = fetch, sleepImpl = defaultSleep } = {}) {
  const ctx = readJson(flags.context);
  if (!ctx || !BOTS[ctx.bot]) {
    console.log('::error::chat-post thread: unreadable --context file');
    return 1;
  }
  if (ctx.already) {
    console.log(`message ${ctx.message_id} already carries ${ctx.already === 'replied' ? REPLIED : FAILED} — duplicate run, nothing to do`);
    setOutput(env, 'skip', 'true');
    setOutput(env, 'reply_thread_id', '');
    return 0;
  }
  const { threadId, note } = await startThread({ ctx, token: env.DISCORD_BOT_TOKEN || '', fetchImpl, sleepImpl });
  console.log(threadId ? note : `::warning::chat-post thread: ${note}`);
  setOutput(env, 'skip', 'false');
  setOutput(env, 'reply_thread_id', threadId);
  return 0;
}

/**
 * The exact text to post, and what posting it means. Mentions are neutralized
 * and `ref:` lines defused BEFORE the cap, and checked again on the final
 * text, so what is checked is what is sent: at most REPLY_CAP plus the short
 * top-level prefix — always one Discord message. (Codex review: expanding
 * mentions after the cap split a reply into two messages, and the second
 * could open on a forged `ref:` line.)
 */
export function composePost({ reply, runUrl, messageUrl, threadId }) {
  let body = defuseRefLines(neutralizeMentions(String(reply || '').trim()));
  const result = body ? 'replied' : 'failed-posted';
  if (!body) {
    body = `${FAILURE_PREFIX} ${runUrl}`;
  } else if (body.length > REPLY_CAP) {
    const tail = '…\n(cut to fit Discord)';
    body = `${body.slice(0, REPLY_CAP - tail.length).trimEnd()}${tail}`;
  }
  // No thread (Discord refused one): a webhook cannot reply, so link the ask.
  return { result, text: defuseRefLines(threadId || !messageUrl ? body : `↪ ${messageUrl}\n${body}`) };
}

export async function postCmd(flags, { env = process.env, fetchImpl = fetch, sleepImpl = defaultSleep, waitImpl } = {}) {
  const { bot } = flags;
  if (!BOTS[bot]) {
    console.log('::error::chat-post post: needs --bot marjorie|tree');
    return 2;
  }
  const ctx = readJson(flags.context) || {};
  if (env.DISCORD_BOT_TOKEN && SNOWFLAKE.test(ctx.message_id || '') && SNOWFLAKE.test(ctx.channel_id || '')) {
    const where = ctx.thread_id || ctx.channel_id;
    if (await isSettled({ where, messageId: ctx.message_id, token: env.DISCORD_BOT_TOKEN, fetchImpl, sleepImpl })) {
      console.log(`message ${ctx.message_id} already carries ✅/❌ — a re-run; nothing posted`);
      setOutput(env, 'result', 'already');
      return 0;
    }
  }
  const threadId = SNOWFLAKE.test(flags['thread-id'] || '') ? flags['thread-id'] : '';
  const reply = readText(path.join(flags['reply-dir'] || OUT_DIR, REPLY_FILE));
  const { result, text } = composePost({ reply, runUrl: flags['run-url'] || '', messageUrl: ctx.url || '', threadId });
  const webhook = env[WEBHOOK_ENV[bot]] || '';
  if (!webhook) {
    console.log(`::error::chat-post post: ${WEBHOOK_ENV[bot]} is not set in this job`);
    setOutput(env, 'result', 'post-error');
    return 1;
  }
  const sent = await webhookPost(text, { thread: threadId || undefined, webhook, username: BOTS[bot].name, fetchImpl, ...(waitImpl ? { waitImpl } : {}) });
  if (!sent.ok) {
    console.log(`::error::chat-post post: ${sent.error}`);
    setOutput(env, 'result', 'post-error');
    return 1;
  }
  console.log(`posted ${result === 'replied' ? 'the reply' : FAILURE_PREFIX} ${threadId ? `in thread ${threadId}` : 'at channel top level'}`);
  setOutput(env, 'result', result);
  return 0;
}

/** Public-issue line: what was done, never what the founder wrote. */
export function turnLog({ bot, summary, replied, messageId }) {
  const done = replied ? oneLine(summary, SUMMARY_CAP) || 'answered' : FAILURE_PREFIX;
  return `💬 chat: #${BOTS[bot].channelName} → ${neutralize(done)}\n\n<!-- chat-id: ${messageId} -->`;
}

export async function finish(flags, { env = process.env, fetchImpl = fetch, sleepImpl = defaultSleep, execImpl = execFileSync } = {}) {
  const { bot } = flags;
  const messageId = flags['message-id'] || '';
  const channelId = flags['channel-id'] || '';
  const sourceThreadId = flags['source-thread-id'] || '';
  if (!BOTS[bot] || !SNOWFLAKE.test(messageId) || !SNOWFLAKE.test(channelId) || (sourceThreadId && !SNOWFLAKE.test(sourceThreadId))) {
    console.log('::error::chat-post finish: needs --bot, numeric --message-id and --channel-id, optional numeric --source-thread-id');
    return 2;
  }
  const token = env.DISCORD_BOT_TOKEN || '';
  const opts = { fetchImpl, sleepImpl };
  const where = sourceThreadId || channelId;
  const result = flags['post-result'] || '';
  let failures = 0;
  const attempt = async (label, call) => {
    try {
      const r = await call();
      if (!r.ok) console.log(`::error::chat-post finish: ${label} refused (HTTP ${r.status})`);
      if (!r.ok) failures += 1;
      return r.ok;
    } catch (err) {
      failures += 1;
      console.log(`::error::chat-post finish: ${label} failed: ${err.message}`);
      return false;
    }
  };
  const react = (emoji) => attempt(`${emoji} reaction`, () => discordRequest('PUT', reactionUrl(where, messageId, emoji), token, opts));

  if (result === 'already' || (await isSettled({ where, messageId, token, fetchImpl, sleepImpl }))) {
    console.log(`message ${messageId} already carries ✅/❌ — nothing to settle or log`);
    return 0;
  }
  if (result === 'replied') {
    await react(REPLIED);
  } else if (result === 'failed-posted') {
    await react(FAILED);
  } else {
    // `post` never ran or its webhook refused: say so first, then ❌.
    const body = { content: `${FAILURE_PREFIX} ${flags['run-url'] || ''}`.trim(), allowed_mentions: { parse: [] }, message_reference: { message_id: messageId, fail_if_not_exists: false } };
    const noticed = await attempt(`${FAILURE_PREFIX} notice`, () => discordRequest('POST', `${DISCORD_API}/channels/${where}/messages`, token, { ...opts, body }));
    if (noticed) await react(FAILED);
    else console.log('no ❌ without a notice — bot-chat-poll settles this claim later');
  }

  const summary = readText(path.join(flags['reply-dir'] || OUT_DIR, SUMMARY_FILE));
  const comment = turnLog({ bot, summary, replied: result === 'replied', messageId });
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
  return failures ? 1 : 0;
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
