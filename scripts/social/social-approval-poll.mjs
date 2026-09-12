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
// Two axes, kept separate by construction (docs/decisions.md 2026-09-12,
// the architect-directed redesign after three failed rounds on PR #4139):
//
//   LISTENING (Discord): reactions and replies are read on EVERY window
//   message whose ref names this PR — header or per-file, at ANY head SHA
//   — and classified per target over the union (a ❌ anywhere wins, the
//   latest reply anywhere wins). A message id decides nothing; the id
//   written into `approval.message` is audit-only.
//
//   SAFETY (git): a stamp is v3 and signs the head SHA it was minted on.
//   One predicate — `cleanSince(S, head)` (every path in `git diff S head`
//   is a social/queue/**.json that is absent at head or validly stamped at
//   head) plus `selfClean(F)` (F's own bytes at approval.sha vs head differ
//   only in approval/body/edit) — decides both whether a reaction on a
//   message at SHA S may mint F (also requiring F itself unchanged since S)
//   and whether F's stamp may merge. Drift is recovered by a fresh ✅ on the
//   newest brief; a notice (one per PR per 24h) says which paths block.
//
// Ledger rows (social/feedback/<ISO-week>.jsonl on the social-ledger branch,
// never main, never the PR branch — the unprotected-branch pattern
// social-poster.yml established for issue #2040) are DERIVED FROM STATE on
// every run — each valid stamp at head is an approve/edit row, each ❌+reason
// whose file is gone from head is a reject row — and deduped, so a lost
// push is recovered on the next run instead of being gone for good.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { neutralizeMentions } from '../community/discord-delivery.mjs';
import { SOCIAL_APPROVERS } from './lib/approvers.mjs';
import { appendRows, capReason, classifyTarget, groupTargets, isoWeek, pillarOf } from './lib/feedback.mjs';
import { approvalStatus } from './lib/queue.mjs';
import { isQueueJson, makeGitState, parseJson, short, stampHealth } from './lib/stamp-health.mjs';
import { stampFiles } from './stamp-approval.mjs';
import { checkDraft, isWarningFinding, POSTED_DIR, QUEUE_DIR, readJsonDir, recentInstagramPosted, recentPostedOpeners } from './check-drafts.mjs';

const DISCORD_API = 'https://discord.com/api/v10';
const REF_LINE_RE = /^ref: PR #(\d+) · ([0-9a-f]{40}) · (.+)$/;
const CHECK_MARK = '%E2%9C%85'; // ✅
const CROSS_MARK = '%E2%9D%8C'; // ❌
const PENCIL = '%E2%9C%8F%EF%B8%8F'; // ✏️ (U+270F U+FE0F) — variation selector required, Discord keys them separately
const LEDGER_BRANCH = 'social-ledger'; // unprotected branch, issue #2040's pattern — see social-poster.yml
// T4 (docs/specs/tree-overhaul/t4-weekly-brief.md §Data "Message layout"):
// weekly-brief.mjs's own ref: scope tokens — never a real queue file path,
// so groupTargets' social/queue/<basename> normalization does not apply to
// these (processPlanBriefRefs groups them by the raw token instead).
const PLAN_SCOPE_RE = /^(?:brief|calendar:\d+|proposal:\d+|questions)$/;
const REPLAN_MARKER_RE = /^replan-dispatched: (\S+)$/m;

/**
 * HIGH 2 (Codex round 1): a message's ref line is the last thing appended
 * when it is built (approval-prompt.mjs, weekly-brief.mjs), so it is
 * always the true LAST line of a message's content — but `String.match`
 * with a global/multiline pattern finds the FIRST line anywhere in the
 * content that looks ref-shaped. Quoted founder text (a proposal's
 * evidence, per this epic's own "quote the founder's own words" design)
 * could contain something ref-line-shaped, accidentally or not, and the
 * first-match behavior would let that redirect a reaction meant for one
 * target onto a completely different PR/file the founder never saw. This
 * is the parser-side half of that fix (weekly-brief.mjs's own
 * escapeRefLookalikes is the builder-side half): only the true last
 * non-empty line of a message is ever consulted, and if THAT line does
 * not match, the message is treated as carrying no ref line at all —
 * never falling back to scan earlier lines for some other match.
 */
function extractRefLine(content) {
  const lines = String(content ?? '').split('\n');
  let i = lines.length - 1;
  while (i >= 0 && lines[i].trim() === '') i -= 1;
  if (i < 0) return null;
  return lines[i].match(REF_LINE_RE);
}

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

/** The real checkDraft path (spec §Mechanics-4). Calls the SAME checker
 * auto-merge-content.yml uses, but as a direct in-process import rather
 * than the earlier `node scripts/social/check-drafts.mjs <file>` subprocess
 * (Codex round-1 review, PR #4139 finding 1): a subprocess re-reads that
 * file from disk at spawn time, which — after this run's `gh pr checkout`
 * has swapped the working tree to the PR's own branch — would execute
 * THAT PR's own (potentially modified) copy of check-drafts.mjs with this
 * job's signing credentials. That breaks the "DATA ONLY, never executing
 * PR code" boundary social-approval-notify.yml already draws elsewhere in
 * this pipeline. `checkDraft` and its context-builders are imported at the
 * top of THIS file instead, so Node resolves and evaluates them once, from
 * the trusted `ref: main` checkout the workflow starts from, before any PR
 * branch is ever checked out — Node's module cache then keeps serving that
 * same in-memory code for the rest of the process regardless of what a
 * later `gh pr checkout` changes on disk. Only the DRAFT CONTENT is read
 * fresh off disk per call (via readJsonDir/readFileSync), which is exactly
 * "passing the draft content as data": the PR fully controls what it puts
 * in social/queue/**.json, never what code checks it. Injectable
 * (`checkDraftImpl`) because this default only works when process.cwd() is
 * a real repo checkout — never true in this file's own unit tests. */
async function defaultCheckDraft(relPath) {
  const absPath = path.join(process.cwd(), relPath);
  let data;
  try {
    data = JSON.parse(readFileSync(absPath, 'utf8'));
  } catch (err) {
    return { ok: false, findings: [`could not read/parse ${relPath} for checkDraft: ${err.message}`] };
  }
  try {
    const target = { file: path.basename(relPath), full: absPath, data };
    const allQueue = await readJsonDir(QUEUE_DIR);
    const allPosted = await readJsonDir(POSTED_DIR);
    const recentIg = await recentInstagramPosted();
    const recentPosted = await recentPostedOpeners();
    const openerContext = [...recentPosted, ...allQueue.map((q) => ({ file: q.file, body: q.data.body }))];
    const findings = await checkDraft(target, { allQueue, allPosted, openerContext, recentIg });
    const hardFindings = findings.filter((f) => !isWarningFinding(f));
    if (hardFindings.length === 0) return { ok: true, findings: [] };
    return { ok: false, findings: [...hardFindings, ...findings.filter(isWarningFinding)] };
  } catch (err) {
    return { ok: false, findings: [`checkDraft crashed: ${err.stack ?? err}`] };
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
 * (one per emoji), caching per message id so nothing re-fetches the same
 * message within a run. */
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
/** Discord's own display name for a reply's author — `global_name` (the
 * modern display name) first, falling back to the legacy `username`, then
 * a generic label. Only T4's plan-PR-comment format (spec §Data
 * "Thread-reply ingestion": "**From Joey in #longlive-social**") reads
 * this; every other consumer of a reply object only ever used `authorId`. */
function discordAuthorName(author) {
  return author?.global_name || author?.username || 'a founder';
}

function buildRepliesByParent(messages) {
  const repliesByParent = new Map();
  for (const m of messages) {
    const parentId = m.message_reference?.message_id;
    if (!parentId) continue;
    const authorId = `discord:${m.author?.id}`;
    if (!SOCIAL_APPROVERS.includes(authorId)) continue;
    if (!repliesByParent.has(parentId)) repliesByParent.set(parentId, []);
    repliesByParent.get(parentId).push({ id: m.id, authorId, authorName: discordAuthorName(m.author), content: m.content, timestamp: m.timestamp });
  }
  return repliesByParent;
}

/** T4 spec §Data "Thread-reply ingestion" route 1: "Discord attaches a
 * `thread` object to the message a thread was started from. The poll reads
 * `message.thread.id` and fetches `GET /channels/<threadId>/messages?
 * limit=100`." One extra Discord call per candidate that carries a thread —
 * every OTHER candidate (the overwhelming majority) costs nothing. A
 * message posted inside a thread has no `message_reference` of its own
 * (the thread itself establishes the parent), so these are collected
 * separately from `buildRepliesByParent` and merged with it below.
 *
 * HIGH 3 (Codex round 1): a failed thread fetch used to just `continue`,
 * which looked identical to "this thread genuinely has no replies" to
 * every caller — with both ✏️ and ✅ present and the founder's actual
 * edit sitting in that unreadable thread, classifyReaction sees
 * "edited-by present, no reply found" and falls back to plain-approve,
 * stamping and merging the ORIGINAL caption instead of the edit. Also
 * returns `failedThreadMessageIds` so every caller can treat that
 * message's target as unresolved this run — the exact same treatment a
 * reaction-fetch failure already gets — instead of silently answering
 * "no replies" for a thread that was never actually read. */
async function fetchThreadReplies(candidates, botToken, opts) {
  const repliesByParent = new Map();
  const failedThreadMessageIds = new Set();
  for (const m of candidates) {
    if (!m.thread?.id) continue;
    let threadMessages;
    try {
      threadMessages = await discordGet(`${DISCORD_API}/channels/${m.thread.id}/messages?limit=100`, botToken, opts);
    } catch (err) {
      console.error(`::warning::social-approval-poll: could not fetch thread messages for ${m.id} (thread ${m.thread.id}) — treating that target as unresolved this run (retries next run): ${err.message}`);
      failedThreadMessageIds.add(m.id);
      continue;
    }
    for (const tm of threadMessages) {
      const authorId = `discord:${tm.author?.id}`;
      if (!SOCIAL_APPROVERS.includes(authorId)) continue;
      if (!repliesByParent.has(m.id)) repliesByParent.set(m.id, []);
      repliesByParent.get(m.id).push({ id: tm.id, authorId, authorName: discordAuthorName(tm.author), content: tm.content, timestamp: tm.timestamp });
    }
  }
  return { repliesByParent, failedThreadMessageIds };
}

/** Merges two parentId -> replies[] maps (thread replies + plain
 * message_reference replies) into one, so every downstream consumer
 * (classifyTarget's entries, the plan-PR-comment relay) reads replies from
 * either route the same way, per spec §Data: "neither is privileged." */
function mergeReplyMaps(...maps) {
  const merged = new Map();
  for (const map of maps) {
    for (const [parentId, replies] of map) {
      if (!merged.has(parentId)) merged.set(parentId, []);
      merged.get(parentId).push(...replies);
    }
  }
  return merged;
}

const NUDGE_LINE_RE = /^nudge: PR #\d+ · (\S+)$/m;
const NOTICE_LINE_RE = /^notice: PR #(\d+)$/m;
const REPEAT_WINDOW_MS = 24 * 60 * 60 * 1000;

/** spec §5: "no new state file" — the poll finds its own prior nudges (and,
 * same pattern, its own prior per-PR notices) by their trailer line in the
 * same webhook-authored messages it already fetched, and suppresses a
 * repeat within 24h for the same key. */
function recentTrailers(messages, webhookId, lineRe) {
  const byKey = new Map();
  for (const m of messages) {
    if (String(m.webhook_id) !== String(webhookId)) continue;
    const match = m.content?.match(lineRe);
    if (!match) continue;
    const ts = new Date(m.timestamp);
    const existing = byKey.get(match[1]);
    if (!existing || ts > existing) byKey.set(match[1], ts);
  }
  return byKey;
}

function withinRepeatWindow(history, key, now) {
  const last = history.get(key);
  return Boolean(last) && now.getTime() - last.getTime() < REPEAT_WINDOW_MS;
}

function nudgeTextFor(pr, file, messageId, pendingKind, reason) {
  const trailer = `nudge: PR #${pr} · ${messageId}`;
  if (pendingKind === 'pencil-header') return `PR #${pr} — ${reason}\n${trailer}`;
  const label = file === '*' ? 'The brief' : path.basename(file);
  const emoji = pendingKind === 'reject' ? '❌' : '✏️';
  const askedFor = pendingKind === 'reject' ? 'a reason' : 'your replacement caption';
  return `${label} on PR #${pr} — you reacted ${emoji} but I don't have ${askedFor} yet.\nReply to that message with it and I'll record it and act on it.\n${trailer}`;
}

/** The per-PR notice: which paths keep a reaction from minting or a stamp
 * from merging. Says explicitly that a drift confined to non-queue paths
 * does not itself trigger a fresh brief (social-approval-notify.yml only
 * fires on social/queue/** changes) — the founder is told the real
 * recovery path, not an implied immediate one. */
function noticeTextFor(pr, problems) {
  const lines = problems.map((p) => `• ${p.path} — ${p.why}`);
  return [
    `PR #${pr} — can't approve or merge from the current briefs:`,
    ...lines,
    'React ✅ on the newest brief for this PR to re-approve what is on the branch now. If no newer brief has appeared (only files outside social/queue/ changed), the next daily digest posts one.',
    `notice: PR #${pr}`,
  ].join('\n');
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

// The safety axis itself — makeGitState (cleanSince/selfClean) and
// stampHealth — lives in lib/stamp-health.mjs, shared with the notifier's
// already-stamped filter so both ask the same question of git.

/** The first anchor (a message carrying the deciding reaction, with its
 * ref SHA) that may mint `relPath` against `head`: at head itself, or
 * clean-since with `relPath` untouched in that range. */
function mintableAnchor(gitState, anchors, relPath, head, statusOptions) {
  const atHead = anchors.find((a) => a.sha === head);
  if (atHead) return { anchor: atHead, problems: [] };
  const problems = [];
  for (const a of anchors) {
    const since = gitState.cleanSince(a.sha, head, statusOptions);
    if (!since.ok) {
      problems.push(...since.offending);
      continue;
    }
    if (since.changed.includes(relPath)) {
      problems.push({ path: relPath, why: `changed after the brief you reacted on (${short(a.sha)}) was posted — that reaction can't cover what is on the branch now` });
      continue;
    }
    return { anchor: a, problems: [] };
  }
  return { anchor: null, problems };
}

function dedupeProblems(problems) {
  const seen = new Set();
  return problems.filter((p) => {
    const key = JSON.stringify([p.path, p.why]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** A ledger row derived from a valid stamp on disk/at a ref: `edit` iff the
 * edit provenance and the stamp were written by the same run (one `nowIso`
 * feeds both), never an approve row AND an edit row for one stamp. */
function stampRow(relPath, item) {
  const a = item.approval;
  const edit = item.edit && item.edit.at === a.at ? item.edit : null;
  return {
    ts: a.at,
    pr: a.pr,
    file: relPath,
    platform: item.platform ?? null,
    campaign: item.campaign ?? null,
    pillar: pillarOf(item.campaign ?? null),
    action: edit ? 'edit' : 'approve',
    reason: edit ? capReason(item.body ?? '') : null,
    originalBody: edit ? (edit.fromBody ?? null) : (item.body ?? null),
    editedBody: edit ? (item.body ?? null) : null,
    approver: a.by,
    messageId: edit ? (edit.message ?? a.message ?? null) : (a.message ?? null),
    replyId: edit ? (edit.reply ?? null) : null,
    // Tree Overhaul T2: Tree's pre-hoc self-score, carried onto the row so
    // the Monday calibration (weekly-scorecard.mjs's calibration()) has
    // something to read even for a rejected item, whose queue file the ❌
    // deletes (see rejectRow below) — `critique` itself is never hashed and
    // never updated by an edit, so this is the draft's original score either way.
    critiqueTotal: item.critique?.total ?? null,
  };
}

function rejectRow(pr, file, classified, item, now) {
  return {
    ts: now.toISOString(),
    pr,
    file,
    platform: item?.platform ?? null,
    campaign: item?.campaign ?? null,
    pillar: pillarOf(item?.campaign ?? null),
    action: 'reject',
    reason: classified.reason,
    originalBody: item?.body ?? null,
    editedBody: null,
    approver: classified.approver,
    messageId: classified.messageId,
    replyId: classified.replyId,
    // Tree Overhaul T2: the ONLY surviving record of a rejected draft's
    // self-score, since the ❌ deletes its queue file (spec docs/specs/
    // tree-overhaul/t2-self-critique.md §Data "The Monday calibration").
    critiqueTotal: item?.critique?.total ?? null,
  };
}

/**
 * One reject row PER real `social/queue/` file a header-level ❌ covers
 * (Codex round 1, MEDIUM 5) — in addition to, not instead of, the header's
 * own `file: '*'` row above. A founder rejecting the whole brief (common
 * when every draft in it is bad) used to contribute ZERO rejected scores
 * to calibration() — it excludes `file: '*'` rows entirely, since `'*'`
 * is not a draft — which could leave calibration permanently stuck at
 * 'insufficient' even after real rejections happened. `sha` is read via
 * `gitState.show`, never a checkout: the OPEN-PR header-reject call site
 * closes the PR and `continue`s before checkout ever runs this pass, and
 * the CLOSED-PR catch-up call site never checks out at all.
 */
function perDraftRejectRows(pr, header, prQueueFiles, gitState, sha, now) {
  const rows = [];
  for (const relPath of prQueueFiles) {
    const item = parseJson(gitState.show(sha, relPath));
    if (!item) continue; // already gone at this ref — nothing to attribute
    rows.push(rejectRow(pr, relPath, header, item, now));
  }
  return rows;
}

/** The rejected draft's content as the founder saw it — read at the
 * replied-to message's SHA first, then any other message carrying the ❌. */
function itemAtAnchors(gitState, anchors, relPath) {
  for (const a of anchors) {
    const item = parseJson(gitState.show(a.sha, relPath));
    if (item) return item;
  }
  return null;
}

/** spec §1b/social-poster.yml's own pattern, adapted for a script that (unlike
 * social-poster.yml) switches branches per PR over the course of one run:
 * checks out `social-ledger` fresh (from its own tip, or from origin/main
 * if the branch doesn't exist yet) so the tree it commits from is never
 * contaminated by whichever PR branch this run last had checked out.
 * Idempotent (feedback.mjs's appendRows, deduped against EVERY week file
 * on the branch — rows carry the stamp's own `at`, so a stamp minted weeks
 * ago re-derives into the week it belongs to, never into "now"'s) and
 * fails the run loudly — never silently — on a non-fast-forward push.
 * Called once per PR (see the `finally` in the caller below) rather than
 * once at the very end of the whole run, so an already-resolved PR's rows
 * are durably pushed before moving on, even if a LATER PR's own processing
 * throws or the run is interrupted. */
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
  const readLines = (p) => (existsSync(p) ? readFileSync(p, 'utf8').split('\n').filter((l) => l.trim() !== '') : []);
  const existingLines = readdirSync(feedbackDir)
    .filter((f) => f.endsWith('.jsonl'))
    .flatMap((f) => readLines(path.join(feedbackDir, f)));

  const newRows = appendRows(existingLines, rows);
  if (newRows.length === 0) {
    console.log('social-approval-poll: no new feedback rows to record this run (all already present).');
    return;
  }
  const byWeek = new Map();
  for (const row of newRows) {
    const t = new Date(row.ts);
    const week = Number.isNaN(t.getTime()) ? isoWeek(now) : isoWeek(t);
    if (!byWeek.has(week)) byWeek.set(week, []);
    byWeek.get(week).push(row);
  }
  const written = [];
  for (const [week, weekRows] of byWeek) {
    const p = path.join(feedbackDir, `${week}.jsonl`);
    writeFileSync(p, [...readLines(p), ...weekRows.map((r) => JSON.stringify(r))].join('\n') + '\n');
    written.push(path.posix.join('social', 'feedback', `${week}.jsonl`));
  }

  execGit(['add', ...written]);
  execGit(['commit', '-m', `social-feedback: ${newRows.length} reaction(s) recorded`]);
  try {
    execGit(['push', 'origin', `HEAD:refs/heads/${LEDGER_BRANCH}`]);
  } catch (err) {
    console.error(`::error::social-approval-poll: push to ${LEDGER_BRANCH} failed — failing loudly, never retried silently (rows are re-derived from state next run): ${err.message}`);
    process.exitCode = 1;
  }
}

// T4 (docs/specs/tree-overhaul/t4-weekly-brief.md) — the plan-brief scope
// dispatch. Deliberately its own self-contained section: no checkout, no
// git write, no minting, no merge — a PR comment, a ledger row, and at most
// one `gh workflow run`. See PLAN.md's correction note / this file's own
// "Two axes" header comment for why this must never fold into the draft
// dispatch above it.

/** Groups raw plan-brief refs by their OWN scope token (never through
 * groupTargets' social/queue/<basename> normalization, which assumes a
 * real queue file and would mangle "proposal:2" into "social/queue/
 * proposal:2" — these are ledger `file` values in their own right, spec
 * §Mechanics: "file: 'proposal:2'"). */
function groupPlanRefs(planRefs) {
  const targets = new Map();
  for (const ref of planRefs) {
    if (!targets.has(ref.file)) targets.set(ref.file, []);
    targets.get(ref.file).push(ref);
  }
  return targets;
}

/** 23:59:59.999 UTC on the Wednesday of `date`'s (Monday-start) week —
 * spec §Data "The Wednesday cut-off". Independent of isoWeek's own
 * Thursday-anchored week-NUMBERING algorithm; this only needs "which day is
 * Wednesday in the same Mon-Sun week as `date`". */
function wednesdayCutoffUtc(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7; // Monday=1 .. Sunday=7
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - (dayNum - 1));
  return new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 2, 23, 59, 59, 999));
}

/** spec §Data: only `proposal:<n>` requires a reply to turn a ❌ into a
 * `reject` row (same rule S3 uses everywhere else); a bare ❌ on
 * `brief`/`calendar:<n>`/`questions` is ALREADY a complete `reject` row —
 * "no action, no reply required, no nudge" — since nothing here mints or
 * merges. Returns the normalized `{action: 'approve'|'reject', ...}` verdict
 * to record, or `null` when there is nothing yet to record (no reaction, an
 * unanswered proposal ❌ awaiting its required reply, or an unsupported ✏️). */
function planScopeVerdict(scope, classified) {
  if (classified.action === 'approve' || classified.action === 'reject') return classified;
  const isProposal = scope.startsWith('proposal:');
  if (!isProposal && classified.action === 'pending' && classified.pending?.kind === 'reject') {
    return { ...classified, action: 'reject' };
  }
  // LOW (Codex round 2): an `edit` classification (✏️ + a qualifying reply)
  // deliberately produces no row and no nudge here, on either a proposal or
  // a brief/calendar/questions scope — intentional, not an oversight. ✏️ has
  // no defined meaning anywhere in spec §Data for these scopes: unlike a
  // real draft, none of them has a `body` for a reply to replace, so
  // recording `action: 'edit'` would leave editedBody/originalBody null in
  // the ledger, a shape T5's distillation never expects. The founder's
  // reply is not lost — collectQualifyingReplies relays it as a plan-PR
  // comment regardless of what (if anything) the reaction classifies as,
  // which is the mechanism that actually matters for a correction/comment
  // on these scopes.
  return null;
}

function planScopeRow(pr, scope, verdict, now) {
  return {
    ts: now.toISOString(),
    pr,
    file: scope,
    platform: null,
    campaign: null,
    pillar: null,
    action: verdict.action,
    reason: verdict.reason ?? null,
    originalBody: null,
    editedBody: null,
    approver: verdict.approver,
    messageId: verdict.messageId,
    replyId: verdict.replyId,
  };
}

/** The bolded first line of a Tree message — weekly-brief.mjs writes one on
 * every message it builds (`**Tree's week ...**` / `**Proposal N of M ---
 * ...**` / etc.) — used only as the human-readable "(on: ...)" label on a
 * relayed reply comment (spec §Data "Thread-reply ingestion"), never to
 * classify or gate anything. */
function messageTitle(content) {
  const firstLine = String(content ?? '').split('\n')[0] ?? '';
  const bold = firstLine.match(/^\*\*(.*)\*\*$/);
  return (bold ? bold[1] : firstLine).trim();
}

function cleanQuotedReply(content) {
  return capReason(neutralizeMentions(String(content ?? '').trim()));
}

/** spec §Data "Thread-reply ingestion" — the exact comment shape, quoting
 * the reply verbatim (cleaned the same way S3 cleans every other founder
 * reply text) and carrying the `discord-reply: <id>` dedupe trailer. */
function replyCommentBody(authorName, title, replyId, content) {
  const quoted = cleanQuotedReply(content)
    .split('\n')
    .map((l) => `> ${l}`)
    .join('\n');
  return [`**From ${authorName} in #longlive-social** (on: ${title})`, '', quoted, '', `discord-reply: ${replyId}`].join('\n');
}

/** Every DISTINCT qualifying reply (approver, non-empty — repliesByParent
 * already filtered to approvers) across every message naming any plan-brief
 * scope for this PR, deduped by reply id (a reply could in principle be
 * attached under more than one ref for the same scope). */
function collectQualifyingReplies(planRefsByScope, repliesByParent) {
  const byId = new Map();
  for (const refsForScope of planRefsByScope.values()) {
    for (const ref of refsForScope) {
      for (const reply of repliesByParent.get(ref.message.id) ?? []) {
        if (typeof reply.content !== 'string' || reply.content.trim() === '') continue;
        if (!byId.has(reply.id)) byId.set(reply.id, { reply, message: ref.message });
      }
    }
  }
  return [...byId.values()];
}

/**
 * The plan-brief scope dispatch (spec §Mechanics social-approval-poll.mjs
 * items 2-4). Returns the ledger rows to fold into this PR's normal
 * pushLedgerRows call — never pushes on its own, so a plan PR's rows go
 * out through the exact same idempotent commit the draft dispatch uses.
 */
async function processPlanBriefRefs({ pr, planRefs, repliesByParent, failedThreadMessageIds, channelId, botToken, discordOpts, reactionCache, nudgeHistory, runResolvedAt, execGh, repo, fetchImpl, webhookUrl }) {
  const byScope = groupPlanRefs(planRefs);
  const rows = [];

  for (const [scope, targetRefs] of byScope) {
    const entries = [];
    let failed = false;
    for (const ref of targetRefs) {
      let reactions;
      try {
        reactions = await getMessageApprovals(ref.message, channelId, botToken, discordOpts, reactionCache);
      } catch (err) {
        console.error(`::warning::social-approval-poll: could not fetch reactions for message ${ref.message.id} (PR #${pr}, ${scope}) — treating as unresolved this run (retries next run): ${err.message}`);
        failed = true;
        break;
      }
      // HIGH 3 (Codex round 1): same treatment as a reaction-fetch failure
      // — a thread that failed to fetch must never be silently read as "no
      // replies", which could resolve a verdict the founder's actual reply
      // (unread this run) would have overturned.
      if (failedThreadMessageIds.has(ref.message.id)) {
        console.error(`::warning::social-approval-poll: message ${ref.message.id} (PR #${pr}, ${scope}) has a thread that failed to fetch this run — treating the target as unresolved (retries next run).`);
        failed = true;
        break;
      }
      entries.push({ message: ref.message, sha: ref.sha, reactions, replies: repliesByParent.get(ref.message.id) ?? [] });
    }
    if (failed) continue;

    const classified = classifyTarget(entries, { kind: scope.startsWith('proposal:') ? 'proposal' : 'draft' });
    const verdict = planScopeVerdict(scope, classified);
    if (verdict) {
      rows.push(planScopeRow(pr, scope, verdict, runResolvedAt));
    } else if (scope.startsWith('proposal:') && classified.action === 'pending' && classified.pending?.messageId) {
      if (!withinRepeatWindow(nudgeHistory, classified.pending.messageId, runResolvedAt)) {
        await postToChannel(fetchImpl, webhookUrl, nudgeTextFor(pr, scope, classified.pending.messageId, classified.pending.kind, classified.pending.reason));
      }
    }
  }

  // Reply relay + the Wednesday re-plan dispatch both dedupe against the
  // plan PR's own existing comments — one extra `gh pr view` call (never
  // added to the draft dispatch's own, already-tested `--json` field list
  // above) covers both, per S3's "no new state file" pattern.
  //
  // LOW (Codex round 2/3): both dedupe checks used to match ANY comment on
  // the PR containing the marker text, from any commenter — a founder or
  // any other collaborator typing (accidentally or not) a line shaped like
  // `replan-dispatched: <week>` could permanently suppress that week's real
  // dispatch, and the same for `discord-reply: <id>` suppressing a real
  // reply's relay. Both checks are now restricted to comments actually
  // authored by this poll's own identity, resolved at runtime via `gh api
  // user` (never hardcoded, so it never drifts from whichever identity
  // GH_TOKEN actually is).
  //
  // Honest about what this does and does not cover (Codex round 3): `gh
  // api user` resolves to `sffan15-sys` — per lib/approvers.mjs's own
  // header comment, "GitHub has only one identity ... for the owner, every
  // agent session's gh, every routine's PAT" — which is BOTH the founder's
  // own account AND every routine's shared automation identity in this
  // repo. This fix excludes any THIRD-PARTY collaborator from spoofing a
  // marker, which is the actual threat this closes. It does NOT protect
  // against the founder's own genuine, unrelated comment (or another
  // routine's own unrelated comment, since they share the identity)
  // happening to contain matching text — that residual gap is real,
  // narrow, and accepted, not silently assumed away by this comment.
  let existingComments;
  let botLogin;
  try {
    existingComments = JSON.parse(execGh(['pr', 'view', String(pr), '--repo', repo, '--json', 'comments'])).comments ?? [];
    botLogin = execGh(['api', 'user', '--jq', '.login']);
  } catch (err) {
    console.error(`::warning::social-approval-poll: PR #${pr} — could not list comments/resolve our own identity for reply-relay/replan dedupe this run: ${err.message}`);
    return rows;
  }
  const ownComments = existingComments.filter((c) => c.author?.login === botLogin);

  const qualifyingReplies = collectQualifyingReplies(byScope, repliesByParent);
  for (const { reply, message } of qualifyingReplies) {
    const trailer = `discord-reply: ${reply.id}`;
    if (ownComments.some((c) => c.body?.includes(trailer))) continue;
    execGh(['pr', 'comment', String(pr), '--repo', repo, '--body', replyCommentBody(reply.authorName, messageTitle(message.content), reply.id, reply.content)]);
  }

  if (qualifyingReplies.length > 0) {
    const briefRef = byScope.get('brief')?.[0];
    if (!briefRef) {
      console.error(`::warning::social-approval-poll: PR #${pr} — a qualifying reply landed but no 'brief' scope ref is in this window; cannot determine the brief's ISO week, skipping the replan-dispatch check this run.`);
    } else if (runResolvedAt.getTime() <= wednesdayCutoffUtc(new Date(briefRef.message.timestamp)).getTime()) {
      const week = isoWeek(new Date(briefRef.message.timestamp));
      const marker = `replan-dispatched: ${week}`;
      const alreadyDispatched = ownComments.some((c) => REPLAN_MARKER_RE.exec(c.body ?? '')?.[1] === week);
      // MEDIUM 8 (Codex round 1): the marker is written ONLY after a
      // confirmed-successful dispatch — writing it first (spec's own
      // literal phrasing) meant a failed `gh workflow run` call still left
      // the marker behind, permanently burning that week's one re-plan
      // opportunity with no way to retry. The accepted trade-off (call
      // made here, not left ambiguous): a dispatch that SUCCEEDS but whose
      // following marker-comment call itself fails could in principle
      // dispatch a second time on a later run — a wasted extra `mode=replan`
      // run (itself idempotent: it only re-reads comments and rewrites
      // from today forward) is a far smaller cost than silently losing the
      // whole week's re-plan to one transient `gh` failure.
      if (!alreadyDispatched) {
        let dispatched = false;
        try {
          execGh(['workflow', 'run', 'routine-tree-weekly-plan.yml', '--repo', repo, '-f', 'mode=replan', '-f', `pr=${pr}`]);
          dispatched = true;
        } catch (err) {
          console.error(`::error::social-approval-poll: PR #${pr} — mode=replan dispatch failed, no marker written so a later run can retry: ${err.message}`);
        }
        if (dispatched) execGh(['pr', 'comment', String(pr), '--repo', repo, '--body', marker]);
      }
    }
  }

  return rows;
}

export async function run({ execGh = gh, execGit = git, fetchImpl = fetch, sleepImpl = defaultSleep, checkDraftImpl = defaultCheckDraft } = {}) {
  const botToken = requireEnv.call(null, 'DISCORD_BOT_TOKEN');
  const webhookUrl = requireEnv.call(null, 'SOCIAL_APPROVAL_WEBHOOK_URL');
  const approvalKey = requireEnv.call(null, 'SOCIAL_APPROVAL_KEY');
  requireEnv.call(null, 'GH_TOKEN');
  const repo = requireEnv.call(null, 'REPO');
  const discordOpts = { fetchImpl, sleepImpl };
  const statusOptions = { approvers: SOCIAL_APPROVERS, key: approvalKey }; // approvalStatus WITH the key — this is the one caller that must verify signatures

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

  const { repliesByParent: threadRepliesByParent, failedThreadMessageIds } = await fetchThreadReplies(candidates, botToken, discordOpts);
  const repliesByParent = mergeReplyMaps(buildRepliesByParent(messages), threadRepliesByParent);
  const nudgeHistory = recentTrailers(messages, webhookId, NUDGE_LINE_RE);
  const noticeHistory = recentTrailers(messages, webhookId, NOTICE_LINE_RE);
  const runResolvedAt = new Date();
  const reactionCache = new Map();

  // Every window message naming a PR, with its ref's head SHA — stale or
  // current alike. Nothing is filtered out here: which messages the poll
  // LISTENS to is never a function of how old they are.
  const byPr = new Map();
  for (const m of candidates) {
    const match = extractRefLine(m.content);
    if (!match) continue;
    const [, prStr, sha, file] = match;
    const pr = Number(prStr);
    if (!byPr.has(pr)) byPr.set(pr, []);
    byPr.get(pr).push({ message: m, sha, file });
  }

  for (const [pr, allRefs] of byPr.entries()) {
    // T4 (docs/specs/tree-overhaul/t4-weekly-brief.md §Data "Plan-brief
    // scopes bind by (pr, messageId) — never by SHA, never by PR state"):
    // kept as a visibly separate partition from the very top of this PR's
    // processing, so the draft dispatch below (queueRefs) never sees a
    // plan-brief ref and vice versa — two dispatch branches, not one
    // collapsed together (spec: "the build must keep the two dispatch
    // branches visibly separate in the code").
    const planRefs = allRefs.filter((r) => PLAN_SCOPE_RE.test(r.file));
    const refs = allRefs.filter((r) => !PLAN_SCOPE_RE.test(r.file));
    const prLedgerRows = [];
    const problems = []; // { path, why } — what keeps this PR from minting/merging, for the notice
    const rejectedThisRun = new Map(); // relPath -> the item as read right before `git rm`
    const classified = new Map(); // target key ('*' or social/queue/<file>) -> classifyTarget result
    let prView = null;
    let gitState = null;
    let treeIsHead = false; // the working tree is the PR head we classified against (checkout + TOCTOU passed)
    let prQueueFilesCache = null;
    // T5 round 2 review: a plan-scope PR (any planRefs) is NEVER treated as
    // carrying a mintable/stampable/mergeable queue file, full stop — not
    // merely because Tree's own posting discipline happens to keep such a
    // PR's real file list empty, but as an explicit invariant every caller
    // of listPrQueueFiles below (the merge phase, the MERGED-state
    // unstamped-approval check, the OPEN-state comment logic, problem
    // reporting) inherits automatically. Converts "the founder merges the
    // strategy PR themselves, never Tree" (docs/agents/tree.md invariant 2)
    // from an emergent property of what Tree happens to post into something
    // that holds even if a future bug ever attached a queue-shaped ref to a
    // plan PR's messages.
    const listPrQueueFiles = () => {
      if (planRefs.length > 0) return [];
      if (prQueueFilesCache) return prQueueFilesCache;
      const filesMeta = JSON.parse(execGh(['pr', 'view', String(pr), '--repo', repo, '--json', 'files'])).files ?? [];
      prQueueFilesCache = filesMeta.map((f) => f.path).filter(isQueueJson);
      return prQueueFilesCache;
    };
    try {
      try {
        prView = JSON.parse(execGh(['pr', 'view', String(pr), '--repo', repo, '--json', 'headRefOid,headRefName,state,number']));
      } catch (err) {
        console.error(`::error::social-approval-poll: could not resolve PR #${pr} — ${err.message}`);
        continue;
      }
      gitState = makeGitState(execGit, pr);

      // Plan-brief scopes (brief/calendar:n/proposal:n/questions): processed
      // regardless of prView.state, entirely independent of the draft
      // dispatch below — no checkout, no minting, no merge, just comments,
      // a ledger row, and at most one workflow_dispatch.
      if (planRefs.length > 0) {
        try {
          const planRows = await processPlanBriefRefs({ pr, planRefs, repliesByParent, failedThreadMessageIds, channelId, botToken, discordOpts, reactionCache, nudgeHistory, runResolvedAt, execGh, repo, fetchImpl, webhookUrl });
          prLedgerRows.push(...planRows);
        } catch (err) {
          console.error(`::error::social-approval-poll: PR #${pr} — plan-brief scope processing failed (draft dispatch below is unaffected): ${err.message}`);
        }
      }

      // Listening axis: classify every target over the union of its messages.
      const unresolved = new Set(); // targets with a message whose reactions couldn't be read — could carry a ❌ we can't see
      for (const [key, targetRefs] of groupTargets(refs)) {
        const entries = [];
        let failed = false;
        for (const ref of targetRefs) {
          let reactions;
          try {
            reactions = await getMessageApprovals(ref.message, channelId, botToken, discordOpts, reactionCache);
          } catch (err) {
            console.error(`::warning::social-approval-poll: could not fetch reactions for message ${ref.message.id} (PR #${pr}, ${key}) — treating the target as unresolved this run (retries next run): ${err.message}`);
            failed = true;
            break;
          }
          // HIGH 3 (Codex round 1): a thread fetch failing for this message
          // must never look like "this thread has no replies" — with both
          // ✏️ and ✅ present, that silently falls back to plain-approve and
          // ships the ORIGINAL caption instead of the founder's actual edit
          // sitting unread in the failed thread. Same unresolved treatment
          // as a reaction-fetch failure, not a different, wrong classification.
          if (failedThreadMessageIds.has(ref.message.id)) {
            console.error(`::warning::social-approval-poll: message ${ref.message.id} (PR #${pr}, ${key}) has a thread that failed to fetch this run — treating the target as unresolved (retries next run).`);
            failed = true;
            break;
          }
          entries.push({ message: ref.message, sha: ref.sha, reactions, replies: repliesByParent.get(ref.message.id) ?? [] });
        }
        if (failed) {
          unresolved.add(key);
          continue;
        }
        classified.set(key, classifyTarget(entries, { kind: key === '*' ? 'pr' : 'draft' }));
      }
      const headerUnresolved = unresolved.has('*');
      const header = classified.get('*') ?? null;
      const pendingTargets = [...classified.entries()].filter(([, c]) => c.action === 'pending').map(([key, c]) => ({ key, ...c.pending }));
      // A pending target (an unanswered ✏️/❌, or — set further below — a
      // caption that failed checkDraft or a reaction that can't mint) blocks
      // stamping and merging for the WHOLE PR, full stop.
      let prBlockedByPending = pendingTargets.length > 0;

      if (prView.state !== 'OPEN') {
        // No checkout: read straight off the PR's own final ref
        // (refs/pull/<n>/head stays reachable after --delete-branch).
        // MERGED: every valid stamp there is an approve/edit row (a lost
        // ledger push from the merging run is recovered here), and a ✅/✏️
        // on a file that was never stamped means it was merged past this
        // gate — say so, loudly, since the poster will retire it. CLOSED
        // without merging: only reject rows — an individually-stamped file
        // on a header-rejected PR was superseded, never approved.
        let prQueueFiles = [];
        try {
          prQueueFiles = listPrQueueFiles();
        } catch (err) {
          console.error(`::warning::social-approval-poll: PR #${pr} — could not list files (${err.message}); rows re-derive next run`);
        }
        if (prView.state === 'MERGED') {
          const unstampedApproved = [];
          for (const relPath of prQueueFiles) {
            const item = parseJson(gitState.show(prView.headRefOid, relPath));
            if (!item) continue;
            const ok = Boolean(item.approval) && approvalStatus(item, statusOptions).ok;
            if (ok) {
              prLedgerRows.push(stampRow(relPath, item));
              continue;
            }
            const own = classified.get(relPath);
            const approved = own ? own.action === 'approve' || own.action === 'edit' : header?.action === 'approve';
            if (approved) unstampedApproved.push(relPath);
          }
          if (unstampedApproved.length > 0) {
            console.error(`::error::social-approval-poll: PR #${pr} was merged before approval (${unstampedApproved.join(', ')}) — that draft cannot be approved and will be retired by the poster; the drafting routine re-queues it.`);
            await postToChannel(fetchImpl, webhookUrl, `PR #${pr} was merged before approval (by an automation merge) — that draft cannot be approved and will be retired by the poster; the drafting routine re-queues it.`);
          }
        }
        if (prView.state === 'CLOSED' && header?.action === 'reject') {
          prLedgerRows.push(rejectRow(pr, '*', header, null, runResolvedAt));
          prLedgerRows.push(...perDraftRejectRows(pr, header, prQueueFiles, gitState, prView.headRefOid, runResolvedAt));
        }
        for (const [key, c] of classified) {
          if (key === '*' || c.action !== 'reject') continue;
          if (gitState.show(prView.headRefOid, key) !== null) continue; // still there at the PR's final head — this ❌ was never acted on
          prLedgerRows.push(rejectRow(pr, key, c, itemAtAnchors(gitState, c.anchors, key), runResolvedAt));
        }
        continue;
      }

      // Reject path, header: requires a reason by construction —
      // classifyTarget only ever yields 'reject' with a qualifying reply.
      if (header?.action === 'reject') {
        execGh(['pr', 'close', String(pr), '--repo', repo, '--comment', `reject: founder reacted ❌ on the brief — ${header.reason}`]);
        prLedgerRows.push(rejectRow(pr, '*', header, null, runResolvedAt));
        // Round 2 LOW: guarded the same way the CLOSED-path's identical
        // call is above — one flaky `gh pr view` must not abort the whole
        // run for every remaining PR.
        let openPrQueueFiles = [];
        try {
          openPrQueueFiles = listPrQueueFiles();
        } catch (err) {
          console.error(`::warning::social-approval-poll: PR #${pr} — could not list files (${err.message}); per-file reject rows re-derive next run`);
        }
        prLedgerRows.push(...perDraftRejectRows(pr, header, openPrQueueFiles, gitState, prView.headRefOid, runResolvedAt));
        continue;
      }

      // Nudges are a webhook POST, not a local write — safe to send before
      // checkout, and skipped entirely once the PR is closed/merged above.
      for (const target of pendingTargets) {
        if (!target.messageId || withinRepeatWindow(nudgeHistory, target.messageId, runResolvedAt)) continue;
        await postToChannel(fetchImpl, webhookUrl, nudgeTextFor(pr, target.key, target.messageId, target.kind, target.reason));
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

      // TOCTOU guard (#4127 issue 1, a race WITHIN one run — distinct from
      // the across-runs drift the safety axis handles). Reactions were
      // classified against prView.headRefOid, fetched before any Discord
      // call; `gh pr checkout` pulls whatever is on the branch AT CHECKOUT
      // TIME. A foreign commit landing in between would sign/merge content
      // newer than what was classified — defer the whole PR instead.
      let headSha = execGit(['rev-parse', 'HEAD']);
      if (headSha !== prView.headRefOid) {
        console.error(`::warning::social-approval-poll: PR #${pr} head moved between classification (${prView.headRefOid}) and checkout (${headSha}) — deferring to next run, not signing/editing/stamping/merging (TOCTOU guard, #4127 issue 1).`);
        continue;
      }
      treeIsHead = true;

      // Rejects: a ❌+reason anywhere in the window wins, whatever else the
      // file's other messages say. A file already gone from head needs no
      // `git rm` and no second comment; its row still derives from state
      // in the `finally` below.
      for (const [key, c] of classified) {
        if (key === '*' || c.action !== 'reject') continue;
        const absPath = path.join(process.cwd(), key);
        if (!existsSync(absPath)) continue;
        const item = parseJson(readFileSync(absPath, 'utf8'));
        execGit(['rm', key]);
        execGit(['commit', '-m', `social-approval: reject ${key} (founder ❌ in Discord)`]);
        execGit(['push', 'origin', `HEAD:${prView.headRefName}`]);
        headSha = execGit(['rev-parse', 'HEAD']);
        rejectedThisRun.set(key, item);
        execGh(['pr', 'comment', String(pr), '--repo', repo, '--body', `reject: ${key} — ${c.reason}`]);
      }

      // Edits: the founder's caption replaces `body`, provenance travels in
      // `edit`, checkDraft runs on the result BEFORE stamping, one commit.
      //
      // KNOWN GAP (round 2 review — confirmed real, currently LATENT: no
      // open social-draft PR has an item in this state right now). If
      // `item` was originally exempt from critique via a valid approval
      // (findCritiqueIssues, queue-schema.mjs — e.g. a pre-T2 item like the
      // four real 2026-09-12/13 social/queue/ files, which can never carry
      // a real critique), an ✏️ edit here changes `body`, which voids that
      // approval's `contentHash` match BEFORE checkDraftImpl re-checks the
      // result a few lines down — so the exemption no longer applies, the
      // edited item has no real critique to fall back on, checkDraftImpl
      // fails with "critique: required", the edit reverts, and prompts the
      // founder to "reply again with a different one" — but NO caption can
      // ever satisfy it, since there is no path for a Discord reply to
      // supply a critique. `prBlockedByPending` then never clears for this
      // target, permanently blocking the WHOLE PR's stamp/merge (see the
      // check a few lines below this loop). Likely correct fix: have
      // findCritiqueIssues ALSO exempt an item carrying `edit` when the
      // item reconstructed with `body: edit.fromBody` (its own pre-edit
      // shape — an edit only ever changes `body`, nothing else) was itself
      // validly approved — this run mints a genuinely fresh, real
      // signature via stampFiles below regardless, so extending the
      // exemption through an already-approved item's edit introduces no
      // new forgery surface. Not fixed this round: needs a real test
      // matrix (double-edits, a missing/malformed `edit.fromBody`) this
      // pass didn't have room for — documented per the reviewer's own
      // guidance rather than rushed.
      for (const [key, c] of classified) {
        if (key === '*' || c.action !== 'edit') continue;
        if (prBlockedByPending) continue;
        const absPath = path.join(process.cwd(), key);
        if (!existsSync(absPath) || rejectedThisRun.has(key)) continue;
        const raw = readFileSync(absPath, 'utf8');
        const item = parseJson(raw);
        if (!item) {
          console.error(`::error::social-approval-poll: PR #${pr} ${key} — could not parse for edit`);
          continue;
        }
        // Already applied (a retry after a merge-phase failure, or a stamp
        // that has since drifted and is handled by the stamp/merge phases
        // below): never re-write `edit.fromBody` with the already-edited
        // body, never spend another commit + CI cycle on the same words.
        if (item.body === c.editedBody && approvalStatus(item, statusOptions).ok) continue;

        const { anchor, problems: mintProblems } = mintableAnchor(gitState, c.anchors, key, headSha, statusOptions);
        if (!anchor) {
          problems.push(...mintProblems.map((p) => ({ path: p.path, why: `your ✏️ for ${path.basename(key)} can't be applied: ${p.why}` })));
          prBlockedByPending = true;
          continue;
        }

        const nowIso = new Date().toISOString();
        const editedItem = { ...item, body: c.editedBody, edit: { by: c.approver, at: nowIso, message: anchor.messageId, reply: c.replyId, fromBody: item.body } };
        writeFileSync(absPath, JSON.stringify(editedItem, null, 2) + '\n');

        // The pre-stamp check is not optional (spec §Mechanics-4): a
        // founder's caption is unvalidated text and could fail checkDraft in
        // any of its 5 rule families. Without this, the edit commits, CI goes
        // red, and the draft sits stranded with nothing said in the channel.
        const checkResult = await checkDraftImpl(key);
        if (!checkResult.ok) {
          writeFileSync(absPath, raw); // revert — never commit/stamp an unvalidated edit
          const findingText = checkResult.findings[0] ?? 'the edited caption failed a draft-time check';
          console.error(`::warning::social-approval-poll: PR #${pr} ${key} — edited caption failed checkDraft, leaving pending: ${findingText}`);
          await postToChannel(fetchImpl, webhookUrl, `Couldn't use that caption for ${path.basename(key)}: ${findingText}. Reply again with a different one.`);
          // A failed replacement leaves the file reverted to its previous
          // (possibly already-approved) content — that must not be free to
          // merge this run as if nothing happened.
          prBlockedByPending = true;
          continue;
        }

        const result = stampFiles([key], { by: c.approver, at: nowIso, pr, message: anchor.messageId, sha: headSha, key: approvalKey });
        if (!result.ok) {
          console.error(`::error::social-approval-poll: ${result.reason}`);
          writeFileSync(absPath, raw);
          continue;
        }
        execGit(['add', ...result.stamped]);
        execGit(['commit', '-m', `social-approval: edit ${key} (discord ✏️ by founder, PR #${pr})`]);
        execGit(['push', 'origin', `HEAD:${prView.headRefName}`]);
        headSha = execGit(['rev-parse', 'HEAD']);
      }

      if (prBlockedByPending) {
        console.error(`::warning::social-approval-poll: PR #${pr} has an unresolved pending target this run (unanswered ✏️/❌, a caption that failed checkDraft, or a reaction that can't cover the current branch) — deferring all stamping and merge for the whole PR until it resolves.`);
        continue;
      }

      // A header message whose reactions couldn't be fetched this run could be
      // carrying a PR-wide ❌ we simply can't see — in that case NOTHING on
      // this PR is safe to stamp or merge this run, not even a draft whose own
      // messages resolved cleanly with a ✅. Retry on the next run (the
      // rejects/edits above are unaffected — they don't depend on the header).
      if (headerUnresolved) {
        console.error(`::warning::social-approval-poll: PR #${pr} header message unresolved this run (reactions unreadable after retries) — skipping stamp/merge for the whole PR this run, it could be carrying a ❌ we can't see; retrying next run`);
        continue;
      }

      // Stamps: every queue file that still needs one and has a ✅ to mint
      // from — its own, or the header's (which expands to whatever still
      // needs a stamp) — provided that ✅ sits on a message that may mint
      // against the current head. A file whose own messages couldn't be
      // read is never stamped through the header either.
      const prQueueFiles = listPrQueueFiles();
      const candidatePaths = [...new Set([...prQueueFiles, ...[...classified.keys()].filter((k) => k !== '*')])].filter(
        (relPath) => !rejectedThisRun.has(relPath) && existsSync(path.join(process.cwd(), relPath)),
      );
      const toStamp = []; // { relPath, by, anchor, carryEditAt }
      for (const relPath of candidatePaths) {
        if (unresolved.has(relPath)) continue;
        const item = parseJson(readFileSync(path.join(process.cwd(), relPath), 'utf8'));
        if (!item) continue;
        const health = stampHealth(gitState, relPath, item, headSha, statusOptions);
        if (health.ok) continue;
        // The file's own ✅ first, then the header's — and the header is
        // tried whenever the file's own ✅ exists but can't mint (a brief
        // older than the drift), not only when the file has no ✅ of its
        // own: "a fresh ✅ on the newest header re-mints" is THE recovery
        // path, and a stale per-file ✅ must never stand in front of it
        // (PR #4139 round 4, M1).
        const own = classified.get(relPath);
        const sources = [own?.action === 'approve' ? own : null, header?.action === 'approve' ? header : null].filter(Boolean);
        if (sources.length === 0) {
          if (health.stamped) problems.push(...health.problems);
          continue;
        }
        let minted = null;
        const mintProblems = [];
        for (const source of sources) {
          const { anchor, problems: sourceProblems } = mintableAnchor(gitState, source.anchors, relPath, headSha, statusOptions);
          if (anchor) {
            minted = { anchor, by: source.approver };
            break;
          }
          mintProblems.push(...sourceProblems);
        }
        if (!minted) {
          problems.push(...mintProblems.map((p) => ({ path: p.path, why: `your ✅ can't mint ${path.basename(relPath)}: ${p.why}` })));
          continue;
        }
        // Re-minting a file whose current stamp is an EDIT stamp (edit.at ===
        // approval.at) keeps it one: `edit.at` moves with the new `at`, so
        // the founder's words stay recorded as an edit, never re-counted as
        // a plain approve, and the row dedupes onto the one already recorded.
        // (pollOwnFieldChange treats exactly that `at`-only bump as the
        // poll's own shape, so the re-signed file is self-clean at merge.)
        const carryEditAt = Boolean(item.edit && item.approval && item.edit.at === item.approval.at);
        toStamp.push({ relPath, by: minted.by, anchor: minted.anchor, carryEditAt });
      }

      if (toStamp.length > 0) {
        const nowIso = new Date().toISOString();
        const groups = new Map(); // `${approver}::${messageId}` -> { by, message, files: [] }
        for (const candidate of toStamp) {
          if (candidate.carryEditAt) {
            const absPath = path.join(process.cwd(), candidate.relPath);
            const item = parseJson(readFileSync(absPath, 'utf8'));
            writeFileSync(absPath, JSON.stringify({ ...item, edit: { ...item.edit, at: nowIso } }, null, 2) + '\n');
          }
          const groupKey = `${candidate.by}::${candidate.anchor.messageId}`;
          if (!groups.has(groupKey)) groups.set(groupKey, { by: candidate.by, message: candidate.anchor.messageId, files: [] });
          groups.get(groupKey).files.push(candidate.relPath);
        }
        const allStamped = [];
        for (const { by, message, files } of groups.values()) {
          const result = stampFiles(files, { by, at: nowIso, pr, message, sha: headSha, key: approvalKey });
          if (!result.ok) {
            console.error(`::error::social-approval-poll: ${result.reason}`);
            continue;
          }
          for (const f of result.stamped) console.log(`social-approval-poll: stamped ${f} at ${short(headSha)} (${by} ✅ on message ${message})`);
          allStamped.push(...result.stamped);
        }
        if (allStamped.length > 0) {
          execGit(['add', ...allStamped]);
          execGit(['commit', '-m', `social-approval: stamp ${allStamped.join(', ')} (discord ✅ by founder, PR #${pr})`]);
          execGit(['push', 'origin', `HEAD:${prView.headRefName}`]);
          headSha = execGit(['rev-parse', 'HEAD']);
        }
      }

      // Merge phase — independent of this run's reactions, so a red-CI retry
      // on a later run still merges once checks go green. Per file, header-
      // independent: every queue file at head must carry a valid stamp that
      // is clean-since and self-clean against the head about to merge.
      // EXCEPT: a draft whose own messages couldn't be read this run must
      // never be treated as safely mergeable even with a valid stamp — the
      // unreadable message could be carrying a ❌ we can't see.
      const unresolvedTripping = prQueueFiles.filter((f) => unresolved.has(f));
      if (unresolvedTripping.length > 0) {
        console.error(
          `::warning::social-approval-poll: PR #${pr} has unresolved reactions this run for ${unresolvedTripping.join(', ')} — deferring merge even though a prior stamp may be valid, it could be carrying a ❌ we can't see this run; retrying next run`,
        );
        continue;
      }
      const present = prQueueFiles.filter((f) => !rejectedThisRun.has(f) && existsSync(path.join(process.cwd(), f)));
      let allClean = present.length > 0;
      for (const relPath of present) {
        const item = parseJson(readFileSync(path.join(process.cwd(), relPath), 'utf8'));
        const health = item ? stampHealth(gitState, relPath, item, headSha, statusOptions) : { ok: false, stamped: false, problems: [] };
        if (health.ok) continue;
        allClean = false;
        if (health.stamped) problems.push(...health.problems);
      }
      if (allClean) {
        try {
          execGh(['pr', 'checks', String(pr), '--repo', repo, '--watch', '--fail-fast']);
          // The merge-time SHA race: everything above only validated content
          // up to whatever this run itself last pushed — a commit landing on
          // the branch after that point (during the `pr checks --watch` wait,
          // for instance) would otherwise merge silently with nothing above
          // having looked at it. `--match-head-commit` makes GitHub itself
          // re-verify the head at the moment of merge and refuse if it moved.
          execGh(['pr', 'merge', String(pr), '--repo', repo, '--squash', '--delete-branch', '--match-head-commit', headSha]);
        } catch (err) {
          console.error(`::error::social-approval-poll: PR #${pr} checks red, head moved, or merge failed — leaving open for the next run: ${err.message}`);
        }
      }
    } finally {
      if (prView?.state === 'OPEN' && problems.length > 0) {
        const deduped = dedupeProblems(problems);
        console.error(`::warning::social-approval-poll: PR #${pr} blocked — ${deduped.map((p) => `${p.path}: ${p.why}`).join('; ')}`);
        if (!withinRepeatWindow(noticeHistory, String(pr), runResolvedAt)) await postToChannel(fetchImpl, webhookUrl, noticeTextFor(pr, deduped));
      }
      if (prView?.state === 'OPEN' && treeIsHead) {
        // Rows from state, not from what this run happened to do: every
        // valid stamp on the branch, every ❌+reason whose file is gone.
        try {
          const files = new Set([...listPrQueueFiles(), ...[...classified.keys()].filter((k) => k !== '*')]);
          for (const relPath of files) {
            const absPath = path.join(process.cwd(), relPath);
            const item = rejectedThisRun.has(relPath) || !existsSync(absPath) ? null : parseJson(readFileSync(absPath, 'utf8'));
            if (item?.approval && approvalStatus(item, statusOptions).ok) prLedgerRows.push(stampRow(relPath, item));
          }
          for (const [key, c] of classified) {
            if (key === '*' || c.action !== 'reject') continue;
            if (!rejectedThisRun.has(key) && existsSync(path.join(process.cwd(), key))) continue;
            prLedgerRows.push(rejectRow(pr, key, c, rejectedThisRun.get(key) ?? itemAtAnchors(gitState, c.anchors, key), runResolvedAt));
          }
        } catch (err) {
          console.error(`::warning::social-approval-poll: PR #${pr} — could not derive feedback rows this run (${err.message}); they re-derive next run`);
        }
      }
      try {
        pushLedgerRows(execGit, ensureGitIdentity, prLedgerRows, runResolvedAt);
      } catch (err) {
        console.error(`::error::social-approval-poll: PR #${pr} — feedback ledger write/push failed: ${err.message}`);
        process.exitCode = 1;
      }
    }
  }
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'social-approval-poll.mjs') {
  run().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
