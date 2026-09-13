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
//           (ops / social) is none, through the channel's webhook as the bot
//   finish  finish job     ✅ or ❌ on the founder's message (the 👀 stays —
//           (social)       it is the poll's claim), `[chat failed]` with the
//                          bot token when `post` itself died, and the
//                          `💬 chat:` turn-log comment on the brief issue
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { parseFlags } from './chat-poll.mjs';
import { BOTS, FAILED, REPLIED, SNOWFLAKE } from './lib/chat-inbox.mjs';
import { DISCORD_API, defaultSleep, discordRequest, reactionUrl } from './lib/discord-bot.mjs';
import { post as webhookPost } from './lib/discord.mjs';

export const REPLY_CAP = 1800;
const SUMMARY_CAP = 120;
const TURN_TEXT_CAP = 80;
const REPLY_FILE = 'chat-reply.md';
const SUMMARY_FILE = 'chat-summary.txt';
const OUT_DIR = path.join('.scratch', 'out');
export const WEBHOOK_ENV = { marjorie: 'DISCORD_MARJORIE_WEBHOOK_URL', tree: 'DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL' };

function oneLine(text, cap) {
  const flat = String(text || '').replace(/\s+/g, ' ').trim();
  return flat.length > cap ? `${flat.slice(0, cap - 1)}…` : flat;
}

// Turn-log text is founder- and agent-written: it must neither ping anyone
// nor forge a marker (same rule as l1-loop.md's asks).
function neutralize(text) {
  return text.replace(/@/g, '@​').replace(/<!--/g, '&lt;!--');
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

/** The text to post, and what posting it means. A reply over the cap is cut with a link to the run, which keeps the full file. */
export function composePost({ reply, runUrl, messageUrl, threadId }) {
  let body = String(reply || '').trim();
  const result = body ? 'replied' : 'failed-posted';
  if (!body) {
    body = `[chat failed] ${runUrl}`;
  } else if (body.length > REPLY_CAP) {
    const tail = `…\n(cut to fit Discord; the full reply is in ${runUrl})`;
    body = `${body.slice(0, Math.max(0, REPLY_CAP - tail.length)).trimEnd()}${tail}`;
  }
  // No thread (Discord refused one): a webhook cannot reply, so link the ask.
  return { result, text: threadId || !messageUrl ? body : `↪ ${messageUrl}\n${body}` };
}

export async function postCmd(flags, { env = process.env, fetchImpl = fetch, waitImpl } = {}) {
  const { bot } = flags;
  if (!BOTS[bot]) {
    console.log('::error::chat-post post: needs --bot marjorie|tree');
    return 2;
  }
  const ctx = readJson(flags.context) || {};
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
  console.log(`posted ${result === 'replied' ? 'the reply' : '[chat failed]'} ${threadId ? `in thread ${threadId}` : 'at channel top level'}`);
  setOutput(env, 'result', result);
  return 0;
}

export function turnLog({ bot, text, summary, replied, messageId }) {
  const said = oneLine(text, TURN_TEXT_CAP) || '(message unreadable)';
  const done = replied ? oneLine(summary, SUMMARY_CAP) || 'answered' : '[chat failed]';
  return `💬 chat: #${BOTS[bot].channelName} — ${neutralize(said)} → ${neutralize(done)}\n\n<!-- chat-id: ${messageId} -->`;
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
  const replied = result === 'replied';
  const runUrl = flags['run-url'] || '';
  let failures = 0;

  const emoji = replied ? REPLIED : FAILED;
  const mark = await discordRequest('PUT', reactionUrl(where, messageId, emoji), token, opts);
  if (!mark.ok) {
    failures += 1;
    console.log(`::error::chat-post finish: could not react ${emoji} (HTTP ${mark.status})`);
  }
  if (!replied && result !== 'failed-posted') {
    // `post` never ran or its webhook refused: say so with the bot token.
    const replyThread = SNOWFLAKE.test(flags['thread-id'] || '') ? flags['thread-id'] : '';
    const target = replyThread || where;
    const body = { content: `[chat failed] ${runUrl}`, allowed_mentions: { parse: [] } };
    if (target === where) body.message_reference = { message_id: messageId, fail_if_not_exists: false };
    const sent = await discordRequest('POST', `${DISCORD_API}/channels/${target}/messages`, token, { ...opts, body });
    if (!sent.ok) failures += 1;
    console.log(sent.ok ? `posted [chat failed] in ${target}` : `::error::chat-post finish: [chat failed] refused (HTTP ${sent.status})`);
  }

  const ctx = readJson(flags.context);
  const summary = readText(path.join(flags['reply-dir'] || OUT_DIR, SUMMARY_FILE));
  const comment = turnLog({ bot, text: ctx?.text, summary, replied, messageId });
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
    failures += 1;
    console.log(`::error::chat-post finish: turn log failed: ${err.message}`);
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
