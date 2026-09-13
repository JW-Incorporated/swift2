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

// `execFileSync`'s default `maxBuffer` is 1 MiB (Node docs) — comfortably
// enough for a single day's founders-brief issue (short-lived, closed the
// same day the next brief opens) under normal traffic, but `--paginate
// --slurp` (added for round-1's pagination fix) now reads the issue's
// FULL comment history in one call, and a long reply thread plus every
// prior day's relay-id ledger comments could exceed 1 MiB (2026-09-12
// Codex round-2 review of PR #4217, reproduced with 300 comments of 4,000
// chars each). Raised, not eliminated — a truly unbounded history would
// still need incremental/streamed reads, but this issue's lifetime is
// bounded to ~1 day by design, so a generous static ceiling is the
// pragmatic fix here.
const GH_MAX_BUFFER = 20 * 1024 * 1024;

function gh(execImpl, args) {
  return execImpl('gh', args, { encoding: 'utf8', maxBuffer: GH_MAX_BUFFER });
}

function findBriefIssue(execImpl, repo) {
  const out = gh(execImpl, [
    'issue', 'list', '--repo', repo, '--label', 'founders-brief',
    '--state', 'open', '--json', 'number', '--limit', '1',
  ]);
  const issues = JSON.parse(out);
  return issues[0] || null;
}

// `--jq '[.[].body]'` only ever saw page 1 (30 comments) — `--paginate`
// doesn't compose with an array-wrapping `--jq` filter (each page would
// print its own `[...]`, not one flattened array), and the line-per-body
// alternative (`--jq '.[].body'`) breaks on any comment whose body itself
// contains a newline (every comment this poller posts does). Instead,
// `--slurp` with no `--jq` at all returns one JSON array of pages, each
// page the raw array of comment objects GitHub sent — flattened and
// mapped to `.body` here, so embedded newlines in a comment never get
// mistaken for a record boundary.
function issueCommentBodies(execImpl, repo, issueNumber) {
  const out = gh(execImpl, ['api', `repos/${repo}/issues/${issueNumber}/comments`, '--paginate', '--slurp']);
  return JSON.parse(out).flat().map((comment) => comment.body);
}

function extractDiscordMessageId(commentBodies) {
  for (const body of commentBodies) {
    // Posted only by `routine-marjorie-brief.yml`'s `deliver` job (environment-
    // scoped, not agent-writable), and always before any founder reply can
    // exist on this issue (the thread doesn't exist until that job creates
    // it) — so a first-match-anywhere scan can't collide with attacker-
    // controlled content the way `alreadyRelayedIds` below could. Left as-is.
    const m = /<!--\s*discord-message-id:\s*(\d+)\s*-->/.exec(body || '');
    if (m) return m[1];
  }
  return null;
}

function alreadyRelayedIds(commentBodies) {
  const ids = new Set();
  for (const body of commentBodies) {
    // Only the comment's own trailing line can carry a trustworthy marker —
    // `reply.content` is untrusted Discord text inserted BEFORE the real
    // marker this poller appends last, so a reply that itself contains
    // marker-shaped text must never be allowed to shadow the real one.
    const lastLine = (body || '').trimEnd().split('\n').at(-1) || '';
    const m = /^<!--\s*relay-id:\s*(\d+)\s*-->$/.exec(lastLine);
    if (m) ids.add(m[1]);
  }
  return ids;
}

/**
 * Discord returns newest-first, capped at `limit=100` per call — a thread
 * with more than 100 messages since the last poll would silently lose the
 * older, un-relayed ones without this. Pages backward via `before=<oldest
 * message id in the last page>` until a page comes back under 100 (the
 * whole thread has now been walked) or the thread ROOT itself appears in
 * the page.
 *
 * Only the root ends pagination early (2026-09-12 Codex round-2 review of
 * PR #4217) — an earlier version also stopped as soon as the single oldest
 * message in a page was already relayed, as a performance shortcut. That's
 * unsafe: two Discord messages can share a timestamp, and this module's
 * own `.sort()` on the reply list orders by timestamp, not id, so a
 * same-millisecond pair can land with the already-relayed one sorted as
 * "oldest" in a page while a still-unrelayed one sits right next to it —
 * stopping there would bury that unrelayed neighbor forever once enough
 * newer messages accumulate. The root, by contrast, is a fixed point every
 * pagination walk is guaranteed to reach (or run out of pages before
 * reaching, which also terminates the loop via `page.length === 100`
 * going false), so checking only for it can't introduce this hole and
 * can't loop forever either. The brief issue this polls is short-lived by
 * design (closed the same day the next brief opens), so walking all the
 * way to the root each time a page fills is an acceptable cost.
 */
async function fetchThreadMessages(threadId, token, { fetchImpl, sleepImpl }) {
  const first = await discordGet(`${DISCORD_API}/channels/${threadId}/messages?limit=100`, token, { fetchImpl, sleepImpl });
  if (!first) return null;

  const byId = new Map(first.map((m) => [m.id, m]));
  let page = first;
  while (page.length === 100 && !page.some((m) => m.id === threadId)) {
    const oldest = page[page.length - 1];
    page = await discordGet(`${DISCORD_API}/channels/${threadId}/messages?limit=100&before=${oldest.id}`, token, { fetchImpl, sleepImpl });
    if (!page) break;
    for (const m of page) byId.set(m.id, m);
  }
  return [...byId.values()];
}

function authorName(author) {
  return (author && (author.global_name || author.username)) || 'a founder';
}

// The thread root is Marjorie's own webhook post: its id equals the
// thread id, and/or it carries a `webhook_id` field. Either signal alone
// is enough to exclude it. An ordinary bot account (no `webhook_id`) is
// excluded too — only a human founder's message should ever be relayed as
// a founder reply.
function isRootOrWebhookMessage(message, threadId) {
  return message.id === threadId || Boolean(message.webhook_id) || Boolean(message.author?.bot);
}

/**
 * Takes no CLI args — every input is env, matching
 * `marjorie-reply-poll.yml`'s plain `run:` step.
 *
 * @param {{ fetchImpl?: typeof fetch, sleepImpl?: (ms:number)=>Promise<void>,
 *   execImpl?: typeof execFileSync, repo?: string }} [deps] Test-only
 *   injection points, the same pattern `discord.mjs`'s
 *   `fetchImpl`/`waitImpl` and `post-or-mail.mjs`'s `spawnImpl` use.
 *   `repo` defaults from env (real runs never pass it) so a test asserting
 *   on the `--repo` argument isn't at the mercy of whether
 *   `GITHUB_REPOSITORY` happens to be set in whatever shell runs the suite.
 */
export async function main({ fetchImpl = fetch, sleepImpl = defaultSleep, execImpl = execFileSync, repo = process.env.REPO || process.env.GITHUB_REPOSITORY || '' } = {}) {
  const token = process.env.DISCORD_BOT_TOKEN || '';

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
    messages = await fetchThreadMessages(threadId, token, { fetchImpl, sleepImpl });
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
