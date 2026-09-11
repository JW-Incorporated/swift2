#!/usr/bin/env node
// social-approval-poll — the ONLY place a ✅/❌/✏️ in #longlive-social turns
// into a signed approval stamp and a merge (docs/social/RULINGS-SOCIAL-2.md B1,
// extended by the S3 reason protocol —
// docs/specs/tree-overhaul/s3-reason-protocol.md). Deterministic, no LLM.
// Invoked by .github/workflows/social-approval-poll.yml on a 15-minute cron
// + workflow_dispatch, inside the `social` GitHub environment (so
// SOCIAL_APPROVAL_KEY / DISCORD_BOT_TOKEN are only ever readable from a
// main-only workflow run).
//
// Required env:
//   DISCORD_BOT_TOKEN          read-only bot token (View Channel + Read
//                              Message History only — no write scope exists
//                              for this bot at all, by design).
//   SOCIAL_APPROVAL_WEBHOOK_URL  the same webhook approval-prompt.mjs posts
//                              the brief through — used only to resolve the
//                              channel id and to post nudges/notices, never
//                              to post an approval prompt itself.
//   SOCIAL_APPROVAL_KEY        HMAC signing key, environment secret.
//   GH_TOKEN                   SOCIAL_POSTER_PAT — used for `gh` calls only.
//   REPO                       "JW-Incorporated/swift2".
//
// Every one of these missing is a loud, non-zero exit — never a silent
// no-op that looks like a clean "nothing to do" run.
//
// Binding property this whole mechanism rests on (verify, don't assume):
// the `ref: PR #<n> · <40-hex headSha> · <file|*>` line on every brief
// message is written by approval-prompt.mjs and posted by Discord's webhook
// API — the webhook is the only identity that can author a message with
// `webhook_id` set to our own webhook's id. An agent cannot forge that
// binding without the webhook URL AND getting Discord to attribute the
// message to our webhook id, which no agent-held credential can do. This
// script re-derives and checks `webhook_id` on every candidate message
// (step 2) rather than assuming any message claiming to be a brief is one.
//
// S3 reason protocol, summarized (spec is the source of truth): ✏️ approves
// with a founder-supplied replacement caption (reply required), ❌ now
// requires a reply too — a bare ❌ never again silently closes a PR. Every
// resolved reaction (approve/edit/reject) is appended to
// social/feedback/<ISO-week>.jsonl on the social-ledger branch (never main,
// never the PR branch — same unprotected-branch pattern social-poster.yml
// established for issue #2040). #4127's two races are closed here too: a
// stale-SHA ref can still be HONOURED for merging (never for minting a new
// approval) under the safety conditions in classifyReaction's caller below,
// and a TOCTOU guard re-checks the head SHA immediately after checkout.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { SOCIAL_APPROVERS } from './lib/approvers.mjs';
import { appendRows, classifyReaction, isoWeek, pillarOf, PENCIL_UNSUPPORTED_ON_HEADER } from './lib/feedback.mjs';
import { approvalStatus, contentHash } from './lib/queue.mjs';
import { stampFiles } from './stamp-approval.mjs';

const DISCORD_API = 'https://discord.com/api/v10';
const REF_LINE_RE = /^ref: PR #(\d+) · ([0-9a-f]{40}) · (.+)$/m;
const CHECK_MARK = '%E2%9C%85'; // ✅
const CROSS_MARK = '%E2%9D%8C'; // ❌
const PENCIL = '%E2%9C%8F%EF%B8%8F'; // ✏️ (U+270F U+FE0F) — variation selector required, Discord keys them separately
const LEDGER_BRANCH = 'social-ledger'; // unprotected branch, issue #2040's pattern — see social-poster.yml

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`::error::social-approval-poll: missing required env ${name} — refusing to run. This is not a skip; fix the environment/secret and re-run.`);
    process.exitCode = 1;
    throw new Error(`missing env ${name}`);
  }
  return v;
}

function gh(args, { input } = {}) {
  return execFileSync('gh', args, { encoding: 'utf8', input, env: process.env }).trim();
}

// `gh` has no add/commit/push/rm subcommands — local git writes (stamping,
// rejecting) go through the real `git` binary instead. `gh` stays reserved
// for actual GitHub API operations (pr view/checkout/comment/close/merge).
function git(args, { cwd, input } = {}) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', input, env: process.env }).trim();
}

/** The real checkDraft path (spec §Mechanics-4): shells out to the SAME
 * CLI auto-merge-content.yml already uses (`node scripts/social/check-drafts.mjs
 * <file>`) rather than re-deriving check-drafts.mjs's non-exported
 * allQueue/allPosted/openerContext/recentIg context here — that context IS
 * the checker, duplicating it would be a second implementation of an
 * existing mechanism. Injectable (`checkDraftImpl`) because this default
 * only works when process.cwd() is a real repo checkout — never true in
 * this file's own unit tests. */
function defaultCheckDraft(relPath) {
  try {
    execFileSync('node', ['scripts/social/check-drafts.mjs', relPath], { encoding: 'utf8', env: process.env });
    return { ok: true, findings: [] };
  } catch (err) {
    const output = `${err.stdout ?? ''}${err.stderr ?? ''}`;
    const findings = output
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '))
      .map((line) => line.slice(2));
    return { ok: false, findings: findings.length > 0 ? findings : [output.trim() || 'check-drafts failed with no findings text'] };
  }
}

const DISCORD_MIN_INTERVAL_MS = 350; // rate-limit courtesy floor between successive Discord API calls
const DISCORD_MAX_ATTEMPTS = 3; // total attempts per Discord GET (including the first); retries only on 429

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let lastDiscordCallAt = 0;

async function discordThrottle(sleepImpl) {
  const wait = lastDiscordCallAt + DISCORD_MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await sleepImpl(wait);
  lastDiscordCallAt = Date.now();
}

async function discordGet(url, token, { fetchImpl = fetch, sleepImpl = defaultSleep } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= DISCORD_MAX_ATTEMPTS; attempt++) {
    await discordThrottle(sleepImpl);
    const res = await fetchImpl(url, { headers: { Authorization: `Bot ${token}` } });
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

/** Derive the webhook id from its URL: .../webhooks/{id}/{token}. */
function webhookIdFromUrl(webhookUrl) {
  const m = webhookUrl.match(/\/webhooks\/(\d+)\//);
  if (!m) throw new Error('could not parse webhook id out of SOCIAL_APPROVAL_WEBHOOK_URL');
  return m[1];
}

async function resolveChannelId(webhookUrl) {
  // GET /webhooks/{id}/{token} needs no bot auth at all.
  const res = await fetch(webhookUrl.replace(/\/$/, ''));
  if (!res.ok) throw new Error(`could not resolve webhook -> channel (${res.status})`);
  const data = await res.json();
  return data.channel_id;
}

async function fetchReactors(channelId, messageId, emoji, token, opts) {
  const users = await discordGet(`${DISCORD_API}/channels/${channelId}/messages/${messageId}/reactions/${emoji}?limit=100`, token, opts);
  return users.map((u) => `discord:${u.id}`);
}

/** Fetches all three reaction sets for a message in the fewest calls possible
 * (one per emoji), caching per message id so the later stamp phase never
 * re-fetches the same message. */
async function getMessageApprovals(message, channelId, botToken, opts, cache) {
  if (cache.has(message.id)) return cache.get(message.id);
  const approvedBy = (await fetchReactors(channelId, message.id, CHECK_MARK, botToken, opts)).filter((id) => SOCIAL_APPROVERS.includes(id));
  const rejectedBy = (await fetchReactors(channelId, message.id, CROSS_MARK, botToken, opts)).filter((id) => SOCIAL_APPROVERS.includes(id));
  const editedBy = (await fetchReactors(channelId, message.id, PENCIL, botToken, opts)).filter((id) => SOCIAL_APPROVERS.includes(id));
  const result = { approvedBy, rejectedBy, editedBy };
  cache.set(message.id, result);
  return result;
}

/** spec §4: replies live in the SAME messages?limit=100 page already
 * fetched — zero extra Discord calls. Condition 1 (message_reference match)
 * is the Map key; condition 2 (approver) is applied here AND re-checked
 * defensively in classifyReaction. Condition 4 (after the brief's own
 * timestamp) needs no active check — Discord cannot attribute a reply to a
 * message that doesn't exist yet, so it holds by construction; spec §4
 * itself notes this is a weaker stand-in for "after the reaction", which
 * Discord exposes no way to check at all. */
function buildRepliesByParent(messages) {
  const repliesByParent = new Map();
  for (const m of messages) {
    const parentId = m.message_reference?.message_id;
    if (!parentId) continue;
    const authorId = `discord:${m.author?.id}`;
    if (!SOCIAL_APPROVERS.includes(authorId)) continue;
    if (!repliesByParent.has(parentId)) repliesByParent.set(parentId, []);
    repliesByParent.get(parentId).push({ id: m.id, authorId, content: m.content, timestamp: m.timestamp });
  }
  return repliesByParent;
}

const NUDGE_LINE_RE = /^nudge: PR #\d+ · (\S+)$/m;
const NUDGE_WINDOW_MS = 24 * 60 * 60 * 1000;

/** spec §5: "no new state file" — the poll finds its own prior nudges by
 * the `nudge:` line in the same webhook-authored messages it already
 * fetched, and suppresses a repeat within 24h for the same target message. */
function recentNudges(messages, webhookId) {
  const byTarget = new Map();
  for (const m of messages) {
    if (String(m.webhook_id) !== String(webhookId)) continue;
    const match = m.content?.match(NUDGE_LINE_RE);
    if (!match) continue;
    const ts = new Date(m.timestamp);
    const existing = byTarget.get(match[1]);
    if (!existing || ts > existing) byTarget.set(match[1], ts);
  }
  return byTarget;
}

function shouldNudge(nudgeHistory, messageId, now) {
  const last = nudgeHistory.get(messageId);
  if (!last) return true;
  return now.getTime() - last.getTime() >= NUDGE_WINDOW_MS;
}

function nudgeTextFor(pr, file, messageId, pendingKind, reason) {
  const trailer = `nudge: PR #${pr} · ${messageId}`;
  if (pendingKind === 'pencil-header') return `PR #${pr} — ${reason}\n${trailer}`;
  const label = file === '*' ? 'The brief' : path.basename(file);
  const emoji = pendingKind === 'reject' ? '❌' : '✏️';
  const askedFor = pendingKind === 'reject' ? 'a reason' : 'your replacement caption';
  return `${label} on PR #${pr} — you reacted ${emoji} but I don't have ${askedFor} yet.\nReply to that message with it and I'll record it and act on it.\n${trailer}`;
}

async function postToChannel(fetchImpl, webhookUrl, content) {
  try {
    await fetchImpl(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  } catch {
    // best-effort notice; callers already log the load-bearing ::error::/::warning::
  }
}

/** Reads `<sha>:<relPath>` without checking anything out — plumbing only, so
 * the current-vs-honoured partition below never disturbs whatever branch
 * this run has (or hasn't yet) checked out for this or another PR. Returns
 * null on any failure (missing object, missing path at that sha, etc.) —
 * every caller treats "can't read it" as "can't honour it", never a crash. */
function readFileAtSha(execGit, sha, relPath) {
  try {
    return execGit(['show', `${sha}:${relPath}`]);
  } catch {
    return null;
  }
}

/**
 * #4127 issue 2 (spec: "The stale-SHA problem ✏️ makes acute"). Partitions
 * a PR's refs into `current` (head SHA matches — may create a fresh
 * approval) and `honoured` (stale, but safe to let PROCEED TO MERGE only —
 * never to mint). Honouring requires the queue file already naming that
 * exact message, its contentHash still matching, and the stale->head diff
 * touching only already-validly-stamped social/queue/**.json files (the
 * diff restriction is load-bearing — see the spec's "why the naive rule was
 * wrong").  A shallow CI checkout (actions/checkout@v7's default) may not
 * hold the stale commit's objects yet, so this fetches (bounded depth —
 * real staleness here is a handful of commits, never more) before reading;
 * a fetch failure just means nothing gets honoured this run, not a crash.
 */
function partitionCurrentHonoured(pr, refs, prView, execGit, approvalKey) {
  const current = refs.filter((r) => r.sha === prView.headRefOid);
  const stale = refs.filter((r) => r.sha !== prView.headRefOid);
  if (stale.length === 0) return { current, honoured: [] };

  try {
    execGit(['fetch', '--depth=100', 'origin', `pull/${pr}/head`]);
  } catch (err) {
    console.error(`::warning::social-approval-poll: PR #${pr} — could not fetch history to evaluate stale-SHA honouring this run (will retry next run): ${err.message}`);
    return { current, honoured: [] };
  }

  const honoured = [];
  for (const ref of stale) {
    if (ref.file === '*') continue; // no per-file approval.message to honour against on the header
    const relPath = path.posix.join('social', 'queue', path.basename(ref.file));
    const headContent = readFileAtSha(execGit, prView.headRefOid, relPath);
    if (!headContent) continue;
    let headItem;
    try {
      headItem = JSON.parse(headContent);
    } catch {
      continue;
    }
    if (!headItem.approval || headItem.approval.message !== ref.message.id) continue;
    if (headItem.approval.contentHash !== contentHash(headItem)) continue;

    let changedPaths;
    try {
      changedPaths = execGit(['diff', '--name-only', ref.sha, prView.headRefOid]).split('\n').filter(Boolean);
    } catch {
      continue;
    }
    const diffIsAllValidlyStampedQueueFiles = changedPaths.every((p) => {
      if (!p.startsWith('social/queue/') || !p.endsWith('.json')) return false;
      const content = readFileAtSha(execGit, prView.headRefOid, p);
      if (!content) return false;
      try {
        return approvalStatus(JSON.parse(content), { approvers: SOCIAL_APPROVERS, key: approvalKey }).ok;
      } catch {
        return false;
      }
    });
    if (!diffIsAllValidlyStampedQueueFiles) continue;
    honoured.push(ref);
  }
  return { current, honoured };
}

/** spec §1b/social-poster.yml's own pattern, adapted for a script that (unlike
 * social-poster.yml) switches branches per PR over the course of one run:
 * checks out `social-ledger` fresh (from its own tip, or from origin/main
 * if the branch doesn't exist yet) as the LAST git operation of the run, so
 * the tree it commits from is never contaminated by whichever PR branch
 * this run last had checked out. Idempotent (feedback.mjs's appendRows) and
 * fails the run loudly — never silently — on a non-fast-forward push. */
function pushLedgerRows(execGit, ensureGitIdentity, rows, now = new Date()) {
  if (rows.length === 0) return;
  ensureGitIdentity();

  let ledgerBranchExists = true;
  try {
    execGit(['fetch', 'origin', LEDGER_BRANCH]);
  } catch {
    ledgerBranchExists = false;
  }
  if (ledgerBranchExists) {
    execGit(['checkout', '-B', LEDGER_BRANCH, `origin/${LEDGER_BRANCH}`]);
  } else {
    execGit(['fetch', 'origin', 'main']);
    execGit(['checkout', '-B', LEDGER_BRANCH, 'origin/main']);
  }

  const feedbackDir = path.join(process.cwd(), 'social', 'feedback');
  mkdirSync(feedbackDir, { recursive: true });
  const currentWeek = isoWeek(now);
  const prevWeek = isoWeek(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
  const currentPath = path.join(feedbackDir, `${currentWeek}.jsonl`);
  const readLines = (p) => (existsSync(p) ? readFileSync(p, 'utf8').split('\n').filter((l) => l.trim() !== '') : []);
  const currentLines = readLines(currentPath);
  const prevLines = currentWeek === prevWeek ? [] : readLines(path.join(feedbackDir, `${prevWeek}.jsonl`));

  const newRows = appendRows([...currentLines, ...prevLines], rows);
  if (newRows.length === 0) {
    console.log('social-approval-poll: no new feedback rows to record this run (all already present).');
    return;
  }
  const finalLines = [...currentLines, ...newRows.map((r) => JSON.stringify(r))];
  writeFileSync(currentPath, finalLines.join('\n') + '\n');

  execGit(['add', path.posix.join('social', 'feedback', `${currentWeek}.jsonl`)]);
  execGit(['commit', '-m', `social-feedback: ${newRows.length} reaction(s) recorded`]);
  try {
    execGit(['push', 'origin', `HEAD:refs/heads/${LEDGER_BRANCH}`]);
  } catch (err) {
    console.error(`::error::social-approval-poll: push to ${LEDGER_BRANCH} failed — failing loudly, never retried silently (rows are re-derivable from Discord next run): ${err.message}`);
    process.exitCode = 1;
  }
}

export async function run({ execGh = gh, execGit = git, fetchImpl = fetch, sleepImpl = defaultSleep, checkDraftImpl = defaultCheckDraft } = {}) {
  const botToken = requireEnv.call(null, 'DISCORD_BOT_TOKEN');
  const webhookUrl = requireEnv.call(null, 'SOCIAL_APPROVAL_WEBHOOK_URL');
  const approvalKey = requireEnv.call(null, 'SOCIAL_APPROVAL_KEY');
  requireEnv.call(null, 'GH_TOKEN');
  const repo = requireEnv.call(null, 'REPO');
  const discordOpts = { fetchImpl, sleepImpl };

  const webhookId = webhookIdFromUrl(webhookUrl);
  const channelId = await resolveChannelId(webhookUrl);

  // The workflow checks the runner out at `ref: main`, but a queue file
  // being stamped/rejected/edited lives on the PR's own (unmerged) branch —
  // local git reads/writes below must happen on that branch, not main.
  // Configured once, lazily, right before the first local git write.
  let gitIdentityConfigured = false;
  function ensureGitIdentity() {
    if (gitIdentityConfigured) return;
    execGit(['config', 'user.name', 'github-actions[bot]']);
    execGit(['config', 'user.email', 'github-actions[bot]@users.noreply.github.com']);
    gitIdentityConfigured = true;
  }

  const messages = await discordGet(`${DISCORD_API}/channels/${channelId}/messages?limit=100`, botToken, discordOpts);

  const candidates = messages.filter((m) => String(m.webhook_id) === String(webhookId));
  for (const m of candidates) {
    if (m.content === '' || m.content === undefined || m.content === null) {
      console.error('::error::social-approval-poll: message content empty — enable Message Content Intent on the bot');
      process.exitCode = 1;
      return;
    }
  }

  const repliesByParent = buildRepliesByParent(messages);
  const nudgeHistory = recentNudges(messages, webhookId);
  const runResolvedAt = new Date();
  const ledgerRows = [];

  // Group candidate messages by the PR they reference, keeping the ref's
  // headSha alongside each so the current/honoured partition below can
  // compare it against the PR's actual current head.
  const byPr = new Map();
  for (const m of candidates) {
    const match = m.content.match(REF_LINE_RE);
    if (!match) continue;
    const [, prStr, sha, file] = match;
    const pr = Number(prStr);
    if (!byPr.has(pr)) byPr.set(pr, []);
    byPr.get(pr).push({ message: m, sha, file });
  }

  for (const [pr, refs] of byPr.entries()) {
    let prView;
    try {
      prView = JSON.parse(execGh(['pr', 'view', String(pr), '--repo', repo, '--json', 'headRefOid,headRefName,state,number']));
    } catch (err) {
      console.error(`::error::social-approval-poll: could not resolve PR #${pr} — ${err.message}`);
      continue;
    }

    const { current, honoured } = partitionCurrentHonoured(pr, refs, prView, execGit, approvalKey);
    if (current.length === 0 && honoured.length === 0) continue; // every ref is stale and none is safe to honour
    const allRefs = [...current, ...honoured];
    const honouredMessageIds = new Set(honoured.map((r) => r.message.id));

    const filesToStamp = new Set();
    let rejectHeaderClassified = null;
    const rejectFiles = []; // { file, reason, approver, replyId, messageId }
    const editTargets = []; // { file, message, classified }
    const pendingTargets = []; // { message, file, pendingKind, reason }
    const reactionCache = new Map();
    // Files (and the header, tracked separately) whose message's reactions
    // could not be read this run — an unreadable message could carry a ❌
    // we can't see, so it must never be silently approved through, whether
    // directly or via a header '*' expansion that would otherwise cover it.
    const unresolvedFiles = new Set();
    let headerUnresolved = false;

    for (const { message, file } of allRefs) {
      let reactions;
      try {
        reactions = await getMessageApprovals(message, channelId, botToken, discordOpts, reactionCache);
      } catch (err) {
        console.error(`::warning::social-approval-poll: could not fetch reactions for message ${message.id} (PR #${pr}, file ${file}) — treating as unresolved this run (retries next run): ${err.message}`);
        if (file === '*') headerUnresolved = true;
        else unresolvedFiles.add(file);
        continue;
      }

      const replies = repliesByParent.get(message.id) ?? [];
      const classified = classifyReaction(reactions, replies, { kind: file === '*' ? 'pr' : 'draft' });

      if (classified.action === 'reject') {
        if (file === '*') rejectHeaderClassified = classified;
        else rejectFiles.push({ file, reason: classified.reason, approver: classified.approver, replyId: classified.replyId, messageId: message.id });
        continue;
      }
      if (classified.action === 'edit' && file !== '*') {
        editTargets.push({ file, message, classified });
        continue;
      }
      if (classified.action === 'approve') {
        // A bare ✅ on an HONOURED (stale) ref may only let an EXISTING
        // approval proceed to merge, never mint a new one (spec: "Freshness
        // is required to create an approval, never to keep honouring one").
        // The merge phase below re-validates the file's existing stamp
        // fresh from disk regardless, so doing nothing here is correct.
        if (honouredMessageIds.has(message.id)) continue;
        filesToStamp.add(file === '*' ? '*' : file);
        continue;
      }
      if (classified.action === 'pending') {
        const pendingKind = classified.reason === PENCIL_UNSUPPORTED_ON_HEADER ? 'pencil-header' : reactions.rejectedBy?.length > 0 ? 'reject' : 'edit';
        pendingTargets.push({ message, file, pendingKind, reason: classified.reason });
      }
      // 'none' and 'skip' (S6-only, unreachable here): nothing to do.
    }

    if (prView.state !== 'OPEN') {
      if (filesToStamp.size > 0) {
        console.error(`::error::social-approval-poll: PR #${pr} was merged before approval — that draft cannot be approved and will be retired by the poster; the drafting routine re-queues it.`);
        try {
          await fetchImpl(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: `PR #${pr} was merged before approval (by an automation merge) — that draft cannot be approved and will be retired by the poster; the drafting routine re-queues it.`,
            }),
          });
        } catch {
          // best-effort notice; the ::error:: above is the load-bearing signal
        }
      }
      continue;
    }

    // Reject path, header: requires a reason by construction now —
    // rejectHeaderClassified is only ever set when classifyReaction already
    // resolved a qualifying reply (never on a bare ❌).
    if (rejectHeaderClassified) {
      execGh(['pr', 'close', String(pr), '--repo', repo, '--comment', `reject: founder reacted ❌ on the brief — ${rejectHeaderClassified.reason}`]);
      continue;
    }

    // Nudges are a webhook POST, not a local write — safe to send before
    // checkout, and skipped entirely once the PR is closed/merged above.
    for (const target of pendingTargets) {
      if (!shouldNudge(nudgeHistory, target.message.id, runResolvedAt)) continue;
      await postToChannel(fetchImpl, webhookUrl, nudgeTextFor(pr, target.file, target.message.id, target.pendingKind, target.reason));
    }

    // Everything below reads and/or writes the queue file on disk — it must
    // happen on the PR's own branch, not whatever the workflow started on
    // (main). Check out the PR's head branch locally before any local git
    // or fs access for this PR.
    try {
      ensureGitIdentity();
      execGh(['pr', 'checkout', String(pr), '--repo', repo]);
    } catch (err) {
      console.error(`::error::social-approval-poll: could not check out PR #${pr}'s branch for local git operations — ${err.message}`);
      continue;
    }

    // TOCTOU guard (#4127 issue 1, distinct from the current/honoured
    // partition above — that handles drift ACROSS runs, this handles a race
    // WITHIN one run). Reactions were classified against prView.headRefOid,
    // fetched before any Discord calls; `gh pr checkout` pulls whatever is
    // on the branch AT CHECKOUT TIME. A foreign commit landing in between
    // would sign/merge content newer than what was classified — defer the
    // whole PR instead.
    const checkedOutSha = execGit(['rev-parse', 'HEAD']);
    if (checkedOutSha !== prView.headRefOid) {
      console.error(`::warning::social-approval-poll: PR #${pr} head moved between classification (${prView.headRefOid}) and checkout (${checkedOutSha}) — deferring to next run, not signing/editing/stamping/merging (TOCTOU guard, #4127 issue 1).`);
      continue;
    }

    for (const { file, reason, approver, replyId, messageId } of rejectFiles) {
      const relPath = path.posix.join('social', 'queue', path.basename(file));
      let rejectedItem = null;
      try {
        rejectedItem = JSON.parse(readFileSync(path.join(process.cwd(), relPath), 'utf8'));
      } catch {
        // file already gone/unreadable — still proceed with the rm + comment below
      }
      execGit(['rm', relPath]);
      execGit(['commit', '-m', `social-approval: reject ${file} (founder ❌ in Discord)`]);
      execGit(['push', 'origin', `HEAD:${prView.headRefName}`]);
      execGh(['pr', 'comment', String(pr), '--repo', repo, '--body', `reject: ${file} — ${reason}`]);
      ledgerRows.push({
        ts: runResolvedAt.toISOString(),
        pr,
        file: relPath,
        platform: rejectedItem?.platform ?? null,
        campaign: rejectedItem?.campaign ?? null,
        pillar: pillarOf(rejectedItem?.campaign ?? null),
        action: 'reject',
        reason,
        originalBody: rejectedItem?.body ?? null,
        editedBody: null,
        approver,
        messageId,
        replyId,
      });
    }

    for (const { file, message, classified } of editTargets) {
      const relPath = path.posix.join('social', 'queue', path.basename(file));
      const absPath = path.join(process.cwd(), relPath);
      let raw;
      try {
        raw = readFileSync(absPath, 'utf8');
      } catch (err) {
        console.error(`::error::social-approval-poll: PR #${pr} ${relPath} — could not read for edit: ${err.message}`);
        continue;
      }
      const item = JSON.parse(raw);
      const nowIso = new Date().toISOString();
      const editedItem = { ...item, body: classified.editedBody, edit: { by: classified.approver, at: nowIso, message: message.id, fromBody: item.body } };
      writeFileSync(absPath, JSON.stringify(editedItem, null, 2) + '\n');

      // The pre-stamp check is not optional (spec §Mechanics-4): a
      // founder's caption is unvalidated text and could fail checkDraft in
      // any of its 5 rule families. Without this, the edit commits, CI goes
      // red, and the draft sits stranded with nothing said in the channel.
      const checkResult = checkDraftImpl(relPath);
      if (!checkResult.ok) {
        writeFileSync(absPath, raw); // revert — never commit/stamp an unvalidated edit
        const findingText = checkResult.findings[0] ?? 'the edited caption failed a draft-time check';
        console.error(`::warning::social-approval-poll: PR #${pr} ${relPath} — edited caption failed checkDraft, leaving pending: ${findingText}`);
        await postToChannel(fetchImpl, webhookUrl, `Couldn't use that caption for ${path.basename(relPath)}: ${findingText}. Reply again with a different one.`);
        continue;
      }

      const result = stampFiles([relPath], { by: classified.approver, at: nowIso, pr, message: message.id, key: approvalKey });
      if (!result.ok) {
        console.error(`::error::social-approval-poll: ${result.reason}`);
        continue;
      }
      execGit(['add', ...result.stamped]);
      execGit(['commit', '-m', `social-approval: edit ${relPath} (discord ✏️ by founder, PR #${pr})`]);
      execGit(['push', 'origin', `HEAD:${prView.headRefName}`]);
      ledgerRows.push({
        ts: runResolvedAt.toISOString(),
        pr,
        file: relPath,
        platform: item.platform ?? null,
        campaign: item.campaign ?? null,
        pillar: pillarOf(item.campaign ?? null),
        action: 'edit',
        reason: classified.reason,
        originalBody: item.body,
        editedBody: classified.editedBody,
        approver: classified.approver,
        messageId: message.id,
        replyId: classified.replyId,
      });
    }

    // A header message whose reactions couldn't be fetched this run could be
    // carrying a PR-wide ❌ (rejectHeader) we simply can't see — in that case
    // NOTHING on this PR is safe to stamp or merge this run, not even a
    // draft whose own message resolved cleanly with its own ✅, because we
    // cannot know whether the unreadable header's reject should have closed
    // the whole PR instead. Skip the entire PR's approve+merge phases and
    // retry on the next run (individual-file rejects/edits above are
    // unaffected — they don't depend on the header being readable).
    if (headerUnresolved) {
      console.error(`::warning::social-approval-poll: PR #${pr} header message unresolved this run (reactions unreadable after retries) — skipping stamp/merge for the whole PR this run, it could be carrying a ❌ we can't see; retrying next run`);
      continue;
    }

    // Approve path: resolve "*" (header ✅) to every tripping file on the PR
    // — but never when an individual draft's own message failed to fetch
    // this run (see unresolvedFiles above): treat it as not-yet-approved
    // rather than silently stamping through an unreadable message.
    let targetFiles = [...filesToStamp].filter((f) => f !== '*' && !unresolvedFiles.has(f));
    if (filesToStamp.has('*')) {
      const filesMeta = JSON.parse(execGh(['pr', 'view', String(pr), '--repo', repo, '--json', 'files'])).files;
      targetFiles = filesMeta
        .filter((f) => f.path.startsWith('social/queue/') && f.path.endsWith('.json'))
        .map((f) => f.path)
        .filter((f) => !unresolvedFiles.has(f) && !unresolvedFiles.has(path.basename(f)));
    }

    const stampCandidates = targetFiles.map((file) => {
      const relPath = path.posix.join('social', 'queue', path.basename(file));
      const raw = readFileSync(path.join(process.cwd(), relPath), 'utf8');
      const item = JSON.parse(raw);
      return { file, relPath, item, needsStamp: !approvalStatus(item, { approvers: SOCIAL_APPROVERS, key: approvalKey }).ok };
    });
    const toStamp = stampCandidates.filter((c) => c.needsStamp).map((c) => c.file);

    if (toStamp.length > 0) {
      const approverRef = current.find(() => SOCIAL_APPROVERS.length > 0)?.message;
      const approvedByIds = new Set();
      for (const { message } of current) {
        const cached = reactionCache.get(message.id);
        if (!cached) continue; // this message's reactions failed to fetch above and was already logged
        for (const id of cached.approvedBy) approvedByIds.add(id);
      }
      const by = [...approvedByIds][0];
      const stampMessageId = String(approverRef?.id ?? current[0].message.id);
      const result = stampFiles(toStamp, {
        by,
        at: new Date().toISOString(),
        pr,
        message: stampMessageId,
        key: approvalKey,
      });
      if (!result.ok) {
        console.error(`::error::social-approval-poll: ${result.reason}`);
      } else {
        for (const f of result.stamped) {
          console.log(`social-approval-poll: stamped ${f} (${by} ✅ on message ${current[0].message.id})`);
        }
        if (result.stamped.length > 0) {
          execGit(['add', ...result.stamped]);
          execGit(['commit', '-m', `social-approval: stamp ${result.stamped.join(', ')} (discord ✅ by founder, PR #${pr})`]);
          execGit(['push', 'origin', `HEAD:${prView.headRefName}`]);
          for (const relPath of result.stamped) {
            const candidate = stampCandidates.find((c) => c.relPath === relPath);
            if (!candidate) continue;
            ledgerRows.push({
              ts: runResolvedAt.toISOString(),
              pr,
              file: relPath,
              platform: candidate.item.platform ?? null,
              campaign: candidate.item.campaign ?? null,
              pillar: pillarOf(candidate.item.campaign ?? null),
              action: 'approve',
              reason: null,
              originalBody: candidate.item.body ?? null,
              editedBody: null,
              approver: by,
              messageId: stampMessageId,
              replyId: null,
            });
          }
        }
      }
    }

    // Merge phase — independent of this run's reactions, so a red-CI retry
    // on a later run still merges once checks go green. EXCEPT: a draft
    // whose own reaction message couldn't be read this run (unresolvedFiles)
    // must never be treated as safely mergeable even if it already carries a
    // valid stamp from an earlier run — the unreadable message could be
    // carrying a fresher ❌ we simply can't see this run. Defer the WHOLE
    // PR's merge in that case (Codex finding, PR #4124 round 2 review).
    const filesMeta = JSON.parse(execGh(['pr', 'view', String(pr), '--repo', repo, '--json', 'files'])).files;
    const trippingFiles = filesMeta.filter((f) => f.path.startsWith('social/queue/') && f.path.endsWith('.json'));
    const unresolvedTripping = trippingFiles.filter((f) => unresolvedFiles.has(f.path) || unresolvedFiles.has(path.basename(f.path)));
    if (unresolvedTripping.length > 0) {
      console.error(
        `::warning::social-approval-poll: PR #${pr} has unresolved reactions this run for ${unresolvedTripping.map((f) => f.path).join(', ')} — deferring merge even though a prior stamp may be valid, it could be carrying a ❌ we can't see this run; retrying next run`,
      );
      continue;
    }
    const allApproved = trippingFiles.every((f) => {
      try {
        const raw = readFileSync(path.join(process.cwd(), f.path), 'utf8');
        return approvalStatus(JSON.parse(raw), { approvers: SOCIAL_APPROVERS, key: approvalKey }).ok;
      } catch {
        return false;
      }
    });
    if (allApproved && trippingFiles.length > 0) {
      try {
        execGh(['pr', 'checks', String(pr), '--repo', repo, '--watch', '--fail-fast']);
        execGh(['pr', 'merge', String(pr), '--repo', repo, '--squash', '--delete-branch']);
      } catch (err) {
        console.error(`::error::social-approval-poll: PR #${pr} checks red or merge failed — leaving open for the next run: ${err.message}`);
      }
    }
  }

  try {
    pushLedgerRows(execGit, ensureGitIdentity, ledgerRows, runResolvedAt);
  } catch (err) {
    console.error(`::error::social-approval-poll: feedback ledger write/push failed: ${err.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'social-approval-poll.mjs') {
  run().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
