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
import { approveResolved, listBuildTickets } from './build-approval.mjs';
import { renderAmbiguousApproval, renderLinkOnlyRelay, resolveReactionApproval } from './lib/build-approval.mjs';
import { founderIds } from './lib/chat-inbox.mjs';
// `discordGet` (null on a 404 — no thread yet, the steady state before any
// founder replies — throws on any other non-2xx, 429/`retry_after` retry)
// and the root/webhook filter moved to `lib/discord-bot.mjs` unchanged when
// the M5 chat loop became their next consumers.
import { DISCORD_API, defaultSleep, discordGet, isRootOrWebhookMessage } from './lib/discord-bot.mjs';

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
function issueComments(execImpl, repo, issueNumber) {
  const out = gh(execImpl, ['api', `repos/${repo}/issues/${issueNumber}/comments`, '--paginate', '--slurp']);
  return JSON.parse(out).flat();
}

function extractDiscordMessageId(comments) {
  for (const comment of comments) {
    const user = comment?.user;
    if (user?.type !== 'Bot' || !['github-actions[bot]', 'github-actions'].includes(user.login)) continue;
    // Posted only by `routine-marjorie-brief.yml`'s `deliver` job (environment-
    // scoped, not agent-writable), and always before any founder reply can
    // exist on this issue (the thread doesn't exist until that job creates
    // it) — so a first-match-anywhere scan can't collide with attacker-
    // controlled content the way `alreadyRelayedIds` below could. Left as-is.
    const m = /^<!-- discord-message-id: (\d{15,21}) -->$/.exec(String(comment.body || '').trim());
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

function hasTrailingMarker(commentBodies, marker) {
  return commentBodies.some((body) => (body || '').trimEnd().split('\n').at(-1) === marker);
}

async function applyRootApproval({ root, threadId, briefIssueNumber, comments, token, repo, execImpl, fetchImpl, sleepImpl }) {
  const check = root?.reactions?.some((r) => r?.emoji?.name === '✅');
  if (!check || !root.guild_id) return;
  const users = await discordGet(`${DISCORD_API}/channels/${threadId}/messages/${threadId}/reactions/${encodeURIComponent('✅')}?limit=100`, token, { fetchImpl, sleepImpl });
  if (!users) return;
  const messageUrl = `https://discord.com/channels/${root.guild_id}/${threadId}/${threadId}`;
  const issues = listBuildTickets(execImpl, repo);
  const resolved = resolveReactionApproval({
    message: root, messageUrl, reactorIds: users.map((user) => String(user.id)),
    founderIds: founderIds(process.env.DISCORD_FOUNDER_IDS), issues, deliveredMessageId: threadId, repo,
  });
  if (resolved.ok) {
    const result = approveResolved({ execImpl, repo, ...resolved });
    console.log(`approval reaction ${result.duplicate ? 'already recorded on' : 'recorded on'} #${result.issueNumber}`);
    return;
  }
  if (resolved.reason !== 'ambiguous') return;
  const marker = `<!-- marjorie-approval-ambiguous: ${threadId} -->`;
  if (hasTrailingMarker(comments.map((comment) => comment.body), marker)) return;
  const body = renderAmbiguousApproval({ messageId: threadId, messageUrl, candidates: resolved.candidates });
  gh(execImpl, ['issue', 'comment', String(briefIssueNumber), '--repo', repo, '--body', body]);
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

  const comments = issueComments(execImpl, repo, issue.number);
  const commentBodies = comments.map((comment) => comment.body);
  const threadId = extractDiscordMessageId(comments);
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

  const root = messages.find((message) => String(message.id) === String(threadId));
  try {
    await applyRootApproval({ root, threadId, briefIssueNumber: issue.number, comments, token, repo, execImpl, fetchImpl, sleepImpl });
  } catch (err) {
    console.error(`::warning::reply-poll: could not process approval reaction on ${threadId}: ${err.message}`);
  }

  const relayed = alreadyRelayedIds(commentBodies);
  const replies = messages
    .filter((m) => !isRootOrWebhookMessage(m, threadId))
    .filter((m) => !relayed.has(String(m.id)))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  for (const reply of replies) {
    const guildId = reply.guild_id || root?.guild_id;
    if (!guildId) {
      console.error(`::warning::reply-poll: message ${reply.id} has no guild id; relay deferred`);
      continue;
    }
    const messageUrl = `https://discord.com/channels/${guildId}/${threadId}/${reply.id}`;
    const comment = renderLinkOnlyRelay({ messageId: reply.id, messageUrl });
    gh(execImpl, ['issue', 'comment', String(issue.number), '--repo', repo, '--body', comment]);
    console.log(`relayed Discord message ${reply.id} -> issue #${issue.number}`);
  }

  return 0;
}

// Only auto-run as a CLI; tests import `main` and drive it directly.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(main, { name: 'reply-poll' });
}
