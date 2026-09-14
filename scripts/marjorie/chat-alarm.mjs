// The no-reply alarm's deciding half (Marjorie Overhaul M7,
// docs/specs/marjorie-overhaul/m7-doorbell.md Mechanics 7). `check` is
// bot-chat-alarm.yml's first job, a `run:` step under `environment: social`:
// it re-reads Discord with the bot token, lists the chat runs, and decides
// whether an alert is due. The `alert` job (`ops`) opens it through
// scripts/watchdog/upsert-alert.sh. Stages:
//
//   stuck                     the doorbell's timer: no ✅ or ❌ 6 minutes after
//                             a founder message. A reply, ✅, ❌ or `[chat
//                             failed]` notice present now ends it, no alert.
//   doorbell-missed           the poll found a founder message 60 s or older
//                             that the doorbell never put 👀 on
//   doorbell-dispatch-failed  the doorbell's 👀, but no chat run after 60 s
//
// Outputs `alert`, `title`, `body` and `dispatch_poll` (a stuck message with
// no run at all). The body carries ids, links, run state and age, never
// message text: this repo is public.
//
// `alert` is the `alert` job's one step (`ops`): open the alert through
// upsert-alert.sh, start Marjorie's ops routine, and start the poll when asked.
// Each is attempted whatever happened to the others; any failure fails the step.
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { appendFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { listRuns } from './chat-poll.mjs';
import { readDeliveryState } from './lib/chat-delivery.mjs';
import { BOTS, SNOWFLAKE, findRuns, runTitle } from './lib/chat-inbox.mjs';
import { CLOCK_ALERT_TITLE, CLOCK_SILENT_MS, clockState, readClockRuns } from './lib/clock-watch.mjs';
import { DISCORD_API, defaultSleep, discordRequest, snowflakeMs } from './lib/discord-bot.mjs';

export const STAGES = ['stuck', 'doorbell-missed', 'doorbell-dispatch-failed', 'clock-silent'];
// Each `alert` action is bounded inside the job's 8 minutes, so a stalled
// Discord post or mail fallback cannot use up the dispatches' time (Codex R2).
export const NOTICE_TIMEOUT_MS = 4 * 60_000;
export const DISPATCH_TIMEOUT_MS = 60_000;
const STANDING = {
  'doorbell-missed': 'Doorbell is not answering',
  'doorbell-dispatch-failed': 'Doorbell dispatch is failing',
  'clock-silent': CLOCK_ALERT_TITLE,
};

/** A stuck reply gets its own issue (it notifies); a doorbell fault is one standing issue while it lasts. */
export function alarmTitle(stage, bot, messageId) {
  return stage === 'stuck' ? `Chat reply stuck · ${BOTS[bot].name} · ${messageId}` : STANDING[stage];
}

function runLine(runs, bot, messageId) {
  if (runs === null) return 'could not be listed';
  if (!runs.length) return `none named \`${runTitle(bot, messageId)}\``;
  return runs.map((r) => `${r.url || '(no url)'} (${[r.status, r.conclusion].filter(Boolean).join(', ')})`).join('; ');
}

export function alarmBody({ stage, bot, messageId, channelId, threadId = '', messageUrl = '', runs, delivery = null, posted, now, runUrl = '' }) {
  const cfg = BOTS[bot];
  const age = Math.max(0, Math.round((now - posted) / 60_000));
  const lead = {
    stuck: `A founder message in #${cfg.channelName} has had no reply, ✅ or ❌ for ${age} min.`,
    'doorbell-missed': `The poll found a founder message in #${cfg.channelName}, ${age} min old, that the doorbell never put 👀 on. The poll claimed and dispatched it itself.`,
    'doorbell-dispatch-failed': `The doorbell put 👀 on a founder message in #${cfg.channelName}, but no ${cfg.name} chat run existed a minute later. The poll claimed and dispatched it itself.`,
  }[stage];
  const lines = [
    lead,
    '',
    `- stage: \`${stage}\``,
    `- message: ${messageUrl || '(no link: the channel read failed)'}`,
    `- ids: message \`${messageId}\` · channel \`${channelId}\` · ${threadId ? `thread \`${threadId}\`` : 'top level'}`,
    `- posted: ${new Date(posted).toISOString()} (${age} min before this check)`,
    `- chat run: ${runLine(runs, bot, messageId)}`,
  ];
  if (delivery) lines.push(`- Discord now: ${delivery.ok ? delivery.state : `unreadable (${delivery.detail})`}`);
  if (runUrl) lines.push(`- raised by: ${runUrl}`);
  lines.push('', stage === 'stuck'
    ? `Marjorie's ops routine was started to look${runs && !runs.length ? ', and bot-chat-poll was started to pick the message up' : ''}. Her hourly sweep closes this once the message carries ✅ or ❌.`
    : "Marjorie's ops routine was started to look at the doorbell (docs/ops/doorbell.md). This alert stays open while the fault lasts; her sweep closes it once the doorbell rings again.");
  return lines.join('\n');
}

function output(env, key, value) {
  if (!env.GITHUB_OUTPUT) return;
  const text = String(value);
  if (!text.includes('\n')) {
    appendFileSync(env.GITHUB_OUTPUT, `${key}=${text}\n`);
    return;
  }
  const delimiter = `CHAT_ALARM_${randomUUID()}`;
  appendFileSync(env.GITHUB_OUTPUT, `${key}<<${delimiter}\n${text}\n${delimiter}\n`);
}

export function clockBody({ newest, now, runUrl = '' }) {
  const age = newest ? `${newest.html_url} at ${newest.created_at} (${Math.round((now - Date.parse(newest.created_at)) / 60_000)} min ago)` : 'none in the last 24 h, or the run list failed';
  const lines = [
    `The home-server clock has not started bot-chat-poll.yml for over ${CLOCK_SILENT_MS / 60_000} min, so the routines are back on GitHub's own cron, which drops most runs here (#4290).`,
    '',
    '- stage: `clock-silent`',
    `- newest clock-started poll run: ${age}`,
  ];
  if (runUrl) lines.push(`- raised by: ${runUrl}`);
  lines.push('', "Check the doorbell service on the Hermes VM host (docs/ops/doorbell.md: `journalctl -u longlive-doorbell`); an expired key shows as HTTP 401. Marjorie's sweep closes this once the clock starts the poll again.");
  return lines.join('\n');
}

// `clock-silent` needs no message: it ends with no alert once the clock has started the poll again.
function checkClock({ env, execImpl, now }) {
  let newest = null;
  try {
    newest = readClockRuns(execImpl, env.REPO || env.GITHUB_REPOSITORY || '', now);
  } catch (err) {
    console.log(`::warning::chat-alarm check: the poll's runs could not be read (${err.message})`);
  }
  if (clockState(newest, now) === 'fresh') {
    console.log('the clock started bot-chat-poll.yml within 20 minutes — no alert');
    output(env, 'alert', 'false');
    return 0;
  }
  const body = clockBody({ newest, now, runUrl: env.RUN_URL || '' });
  output(env, 'alert', 'true');
  output(env, 'title', CLOCK_ALERT_TITLE);
  output(env, 'body', body);
  output(env, 'dispatch_poll', 'false');
  console.log(`alert due: ${CLOCK_ALERT_TITLE}\n\n${body}`);
  return 0;
}

export async function check({ env = process.env, fetchImpl = fetch, sleepImpl = defaultSleep, execImpl = execFileSync, now = Date.now() } = {}) {
  const { STAGE: stage = '', BOT: bot = '', MESSAGE_ID: messageId = '', CHANNEL_ID: channelId = '', THREAD_ID: threadId = '' } = env;
  if (stage === 'clock-silent') return checkClock({ env, execImpl, now });
  if (!STAGES.includes(stage) || !BOTS[bot] || !SNOWFLAKE.test(messageId) || !SNOWFLAKE.test(channelId) || (threadId && !SNOWFLAKE.test(threadId))) {
    console.log(`::error::chat-alarm check: needs STAGE (${STAGES.join(' | ')}), BOT marjorie|tree, numeric MESSAGE_ID and CHANNEL_ID, optional numeric THREAD_ID`);
    return 2;
  }
  const token = env.DISCORD_BOT_TOKEN || '';
  const opts = { fetchImpl, sleepImpl };
  const repo = env.REPO || env.GITHUB_REPOSITORY || '';
  const posted = snowflakeMs(messageId);
  const where = threadId || channelId;
  const channel = await discordRequest('GET', `${DISCORD_API}/channels/${channelId}`, token, opts).catch(() => ({ ok: false }));
  const guildId = channel.ok ? channel.data?.guild_id : '';
  const messageUrl = guildId ? `https://discord.com/channels/${guildId}/${where}/${messageId}` : '';
  const listed = listRuns(execImpl, repo, BOTS[bot].workflow, new Date(posted).toISOString());
  const runs = listed ? findRuns(listed.runs, bot, messageId) : null;
  let delivery = null;
  if (stage === 'stuck') {
    delivery = await readDeliveryState({ bot, messageId, channelId, sourceThreadId: threadId, messageUrl, token, ...opts });
    if (delivery.ok && delivery.state !== 'open') {
      console.log(`${bot} message ${messageId} is ${delivery.state} now — no alert`);
      output(env, 'alert', 'false');
      return 0;
    }
  }
  const title = alarmTitle(stage, bot, messageId);
  const body = alarmBody({ stage, bot, messageId, channelId, threadId, messageUrl, runs, delivery, posted, now, runUrl: env.RUN_URL || '' });
  output(env, 'alert', 'true');
  output(env, 'title', title);
  output(env, 'body', body);
  output(env, 'dispatch_poll', stage === 'stuck' && Array.isArray(runs) && runs.length === 0 ? 'true' : 'false');
  console.log(`alert due: ${title}\n\n${body}`);
  return 0;
}

export function alert({ env = process.env, execImpl = execFileSync } = {}) {
  const { TITLE: title = '', BODY: body = '', DISPATCH_POLL: dispatchPoll = '', REPO: repo = '' } = env;
  if (!title || !body || !repo) {
    console.log('::error::chat-alarm alert: needs TITLE, BODY and REPO');
    return 2;
  }
  const file = path.join(env.RUNNER_TEMP || tmpdir(), 'chat-alarm.md');
  writeFileSync(file, `${body}\n`);
  const run = (workflow) => ['gh', ['workflow', 'run', workflow, '--repo', repo, '--ref', 'main'], DISPATCH_TIMEOUT_MS];
  const actions = [
    ['open the alert', ['bash', ['scripts/watchdog/upsert-alert.sh', 'open', title, file], NOTICE_TIMEOUT_MS]],
    ['start routine-marjorie-ops.yml', run('routine-marjorie-ops.yml')],
    ...(dispatchPoll === 'true' ? [['start bot-chat-poll.yml', run('bot-chat-poll.yml')]] : []),
  ];
  let failed = 0;
  for (const [label, [cmd, args, timeout]] of actions) {
    try {
      execImpl(cmd, args, { stdio: 'inherit', timeout, killSignal: 'SIGKILL' });
      console.log(`${label}: done`);
    } catch (err) {
      failed += 1;
      console.log(`::error::chat-alarm alert: could not ${label} (${err.message})`);
    }
  }
  return failed ? 1 : 0;
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  if (argv[0] === 'check') return check(deps);
  if (argv[0] === 'alert') return alert(deps);
  console.log('usage: chat-alarm.mjs check | alert (inputs from the environment; see the header)');
  return 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(() => main(), { name: 'chat-alarm' });
}
