// Marjorie's reply poller (Marjorie Overhaul M2, moved here from M4 per
// docs/plans/marjorie-overhaul/waves/m2-watchdog-handling.md — the
// contract is fixed in docs/specs/marjorie-overhaul/c1-delivery.md's
// "Reading replies" section and docs/specs/marjorie-overhaul/c2-brief.md's
// "Founder replies → issue comments"). A plain script, never an agent step
// — DISCORD_BOT_TOKEN must never enter an agent context, and this file is
// only ever invoked by `marjorie-reply-poll.yml`'s `run:` step.
//
// Finds the day's `founders-brief` issue the same way
// `routine-marjorie-brief.yml`'s own `deliver` job does (`--label
// founders-brief --state open --limit 1` — simpler and already proven in
// production, over the deleted `marjorie-inbox.yml`'s title-`--search`
// approach). `--limit 1` would grab an arbitrary issue if more than one
// were ever open at once; that's accepted here, matching the existing
// `deliver` job's own precedent, since the brief routine only ever leaves
// one `founders-brief` issue open at a time.
//
// Reads the Discord message id of that issue's brief post off a
// `<!-- discord-message-id: ... -->` marker comment (posted by
// `routine-marjorie-brief.yml`'s `deliver` job right after a successful
// Discord send) rather than the issue body — Discord threads share their
// id with the message they were created on, so that id is also the
// thread id to poll.
//
// Idempotent via `<!-- relay-id: <discord message id> -->`, the exact
// scheme `marjorie-inbox.yml:110` used for email (recoverable at
// `git show 9b3f6515^:.github/workflows/marjorie-inbox.yml`), carried
// over unchanged for Discord replies.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runMain } from '../lib/cli.mjs';

const DISCORD_API = 'https://discord.com/api/v10';
const DISCORD_MIN_INTERVAL_MS = 350;
const DISCORD_MAX_ATTEMPTS = 3;

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let lastDiscordCallAt = 0;

async function discordThrottle(sleepImpl) {
  const wait = lastDiscordCallAt + DISCORD_MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await sleepImpl(wait);
  lastDiscordCallAt = Date.now();
}

/**
 * GET against the Discord API with the same 429/`retry_after` handling as
 * `social-approval-poll.mjs`'s `discordGet()` (lines ~208-229) — not
 * imported from there (that file is the social poster's own 1475-line
 * module); a small duplicated retry loop here matches this repo's stated
 * policy of not extracting a shared helper until a fifth consumer appears
 * (c1-delivery.md's "No shared postToWebhook extraction this wave" note,
 * same spirit). Returns `null` on a 404 (no thread yet — the steady-state
 * case before any founder has replied) instead of throwing.
 */
async function discordGet(url, token, { fetchImpl = fetch, sleepImpl = defaultSleep } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= DISCORD_MAX_ATTEMPTS; attempt += 1) {
    await discordThrottle(sleepImpl);
    const res = await fetchImpl(url, { headers: { Authorization: `Bot ${token}` } });
    if (res.status === 404) return null;
    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      const retryAfterSec = typeof body.retry_after === 'number' ? body.retry_after : 1;
      lastErr = new Error(`Discord GET ${url} -> 429 rate limited (retry_after ${retryAfterSec}s)`);
      if (attempt < DISCORD_MAX_ATTEMPTS) {
        await sleepImpl(retryAfterSec * 1000);
        continue;
      }
      throw lastErr;
    }
    if (!res.ok) {
      throw new Error(`Discord GET ${url} -> ${res.status} ${await res.text()}`);
    }
    return res.json();
  }
  throw lastErr;
}

function gh(execImpl, args) {
  return execImpl('gh', args, { encoding: 'utf8' });
}

function findBriefIssue(execImpl, repo) {
  const out = gh(execImpl, [
    'issue', 'list', '--repo', repo, '--label', 'founders-brief',
    '--state', 'open', '--json', 'number', '--limit', '1',
  ]);
  const issues = JSON.parse(out);
  return issues[0] || null;
}

function issueCommentBodies(execImpl, repo, issueNumber) {
  const out = gh(execImpl, ['api', `repos/${repo}/issues/${issueNumber}/comments`, '--jq', '[.[].body]']);
  return JSON.parse(out);
}

function extractDiscordMessageId(commentBodies) {
  for (const body of commentBodies) {
    const m = /<!--\s*discord-message-id:\s*(\d+)\s*-->/.exec(body || '');
    if (m) return m[1];
  }
  return null;
}

function alreadyRelayedIds(commentBodies) {
  const ids = new Set();
  for (const body of commentBodies) {
    const m = /<!--\s*relay-id:\s*(\d+)\s*-->/.exec(body || '');
    if (m) ids.add(m[1]);
  }
  return ids;
}

function authorName(author) {
  return (author && (author.global_name || author.username)) || 'a founder';
}

// The thread root is Marjorie's own webhook post: its id equals the
// thread id, and/or it carries a `webhook_id` field. Either signal alone
// is enough to exclude it; anything else in the thread is a human reply.
function isRootOrWebhookMessage(message, threadId) {
  return message.id === threadId || Boolean(message.webhook_id);
}

/**
 * Takes no CLI args — every input is env, matching
 * `marjorie-reply-poll.yml`'s plain `run:` step.
 *
 * @param {{ fetchImpl?: typeof fetch, sleepImpl?: (ms:number)=>Promise<void>,
 *   execImpl?: typeof execFileSync }} [deps] Test-only injection points,
 *   the same pattern `discord.mjs`'s `fetchImpl`/`waitImpl` and
 *   `post-or-mail.mjs`'s `spawnImpl` use.
 */
export async function main({ fetchImpl = fetch, sleepImpl = defaultSleep, execImpl = execFileSync } = {}) {
  const token = process.env.DISCORD_BOT_TOKEN || '';
  const repo = process.env.REPO || process.env.GITHUB_REPOSITORY || '';

  const issue = findBriefIssue(execImpl, repo);
  if (!issue) {
    console.log('no open founders-brief issue found — nothing to poll');
    return 0;
  }

  const commentBodies = issueCommentBodies(execImpl, repo, issue.number);
  const threadId = extractDiscordMessageId(commentBodies);
  if (!threadId) {
    console.log(`issue #${issue.number} has no discord-message-id marker yet — nothing to poll`);
    return 0;
  }

  let messages;
  try {
    messages = await discordGet(`${DISCORD_API}/channels/${threadId}/messages?limit=100`, token, { fetchImpl, sleepImpl });
  } catch (err) {
    console.error(`::warning::reply-poll: could not fetch thread ${threadId} messages: ${err.message}`);
    return 0;
  }
  if (!messages) {
    console.log(`no thread found yet on message ${threadId} — nothing to poll`);
    return 0;
  }

  const relayed = alreadyRelayedIds(commentBodies);
  const replies = messages
    .filter((m) => !isRootOrWebhookMessage(m, threadId))
    .filter((m) => !relayed.has(String(m.id)))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  for (const reply of replies) {
    const who = authorName(reply.author);
    const comment = `💬 Reply from ${who}\n\n${reply.content}\n\n<!-- relay-id: ${reply.id} -->`;
    gh(execImpl, ['issue', 'comment', String(issue.number), '--repo', repo, '--body', comment]);
    console.log(`relayed ${who} -> issue #${issue.number}`);
  }

  return 0;
}

// Only auto-run as a CLI; tests import `main` and drive it directly.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(main, { name: 'reply-poll' });
}
