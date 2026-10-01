// Discord "typing…" indicator while a chat routine composes its reply
// (docs/ops/chat-poll.md, "Typing indicator"). Runs as the parallel `typing`
// job of routine-marjorie-chat.yml / routine-tree-chat.yml, under
// `environment: social` (the only place DISCORD_BOT_TOKEN lives besides the
// poll), never in an agent step.
//
//   start --channel-id <id> [--thread-id <id>] [--stop-job <name>]
//
// POSTs /channels/{target}/typing every 8 s, where target is the reply thread
// when there is one and the channel otherwise (the same choice chat-post.mjs
// `thread` makes). Each call shows "typing…" for ~10 s, so the loop keeps it
// lit across the Claude run. It ends when, whichever comes first:
//   - the `--stop-job` job (`post` for Marjorie, `deliver` for Tree) has
//     started, i.e. the reply is about to land (`gh run view --json jobs`);
//   - the agent's `run` job failed or was cancelled (no reply is coming);
//   - Discord answers 401/403/404 — a missing permission is harmless, so one
//     log line and exit 0, no retry;
//   - 20 minutes have passed, or 5 transport/5xx failures in a row.
// 429 backs off for the response's `retry_after`. It always exits 0 and never
// logs the token; the workflow job is also `continue-on-error`.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { parseFlags } from './chat-poll.mjs';
import { DISCORD_API, defaultSleep } from './lib/discord-bot.mjs';

export const TYPING_INTERVAL_MS = 8000;
export const TYPING_CAP_MS = 20 * 60 * 1000;
const MAX_CONSECUTIVE_FAILURES = 5;
const MAX_RETRY_AFTER_MS = 60 * 1000;
const RUN_FAILED = new Set(['failure', 'cancelled', 'timed_out']);

function ghJobs(runId) {
  const out = execFileSync('gh', ['run', 'view', String(runId), '--json', 'jobs'], { encoding: 'utf8', timeout: 30000 });
  return JSON.parse(out).jobs || [];
}

/**
 * Why the indicator should stop, from the run's jobs; `null` while the agent
 * is still working. The agent job is a reusable-workflow call, so its jobs are
 * named `run` or `run / <inner job>`.
 */
export function stopReason(jobs, stopJob) {
  const list = Array.isArray(jobs) ? jobs : [];
  const stop = list.find((job) => job?.name === stopJob);
  if (stop && (stop.status === 'in_progress' || stop.status === 'completed')) return `${stopJob} job started`;
  const failed = list.find((job) => (job?.name === 'run' || String(job?.name).startsWith('run / ')) && RUN_FAILED.has(job.conclusion));
  if (failed) return `run job ${failed.conclusion}`;
  return null;
}

export async function start(flags, { env = process.env, fetchImpl = fetch, sleepImpl = defaultSleep, nowImpl = Date.now, listJobs = ghJobs } = {}) {
  const target = flags['thread-id'] || flags['channel-id'];
  const stopJob = flags['stop-job'] || 'post';
  const token = env.DISCORD_BOT_TOKEN;
  const runId = env.GITHUB_RUN_ID;
  if (!target || !token || !runId) {
    console.log('chat-typing: needs --channel-id, DISCORD_BOT_TOKEN and GITHUB_RUN_ID — no indicator');
    return 0;
  }
  const url = `${DISCORD_API}/channels/${target}/typing`;
  const began = nowImpl();
  let failures = 0;
  while (nowImpl() - began < TYPING_CAP_MS) {
    let reason;
    try {
      reason = stopReason(listJobs(runId), stopJob);
    } catch {
      reason = null; // a failed job read only costs the early stop; the cap still ends it
    }
    if (reason) {
      console.log(`chat-typing: stopping — ${reason}`);
      return 0;
    }
    let wait = TYPING_INTERVAL_MS;
    try {
      const res = await fetchImpl(url, { method: 'POST', headers: { Authorization: `Bot ${token}` } });
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        console.log(`chat-typing: Discord answered ${res.status} — no typing permission or target, no indicator`);
        return 0;
      }
      if (res.status === 429) {
        const body = await res.json().catch(() => ({}));
        const retryAfterSec = typeof body?.retry_after === 'number' ? body.retry_after : 1;
        wait = Math.min(Math.max(retryAfterSec * 1000, TYPING_INTERVAL_MS), MAX_RETRY_AFTER_MS);
      } else if (res.ok) {
        failures = 0;
      } else {
        failures += 1;
      }
    } catch {
      failures += 1;
    }
    if (failures >= MAX_CONSECUTIVE_FAILURES) {
      console.log(`chat-typing: ${failures} failed calls in a row — giving up`);
      return 0;
    }
    await sleepImpl(wait);
  }
  console.log('chat-typing: 20-minute cap reached — stopping');
  return 0;
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const [cmd, ...rest] = argv;
  if (cmd === 'start') return start(parseFlags(rest), deps);
  console.log('usage: chat-typing.mjs start --channel-id <id> [--thread-id <id>] [--stop-job <post|deliver>]');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(() => main(), { name: 'chat-typing' });
}
