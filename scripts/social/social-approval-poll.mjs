#!/usr/bin/env node
// social-approval-poll — the ONLY place a ✅/❌ in #longlive-social turns
// into a signed approval stamp and a merge (docs/social/RULINGS-SOCIAL-2.md B1).
// Deterministic, no LLM. Invoked by .github/workflows/social-approval-poll.yml
// on a 15-minute cron + workflow_dispatch, inside the `social` GitHub
// environment (so SOCIAL_APPROVAL_KEY / DISCORD_BOT_TOKEN are only ever
// readable from a main-only workflow run).
//
// Required env:
//   DISCORD_BOT_TOKEN          read-only bot token (View Channel + Read
//                              Message History only — no write scope exists
//                              for this bot at all, by design).
//   SOCIAL_APPROVAL_WEBHOOK_URL  the same webhook approval-prompt.mjs posts
//                              the brief through — used only to resolve the
//                              channel id, never to post.
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
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { SOCIAL_APPROVERS } from './lib/approvers.mjs';
import { approvalStatus } from './lib/queue.mjs';
import { stampFiles } from './stamp-approval.mjs';

const DISCORD_API = 'https://discord.com/api/v10';
const REF_LINE_RE = /^ref: PR #(\d+) · ([0-9a-f]{40}) · (.+)$/m;
const CHECK_MARK = '%E2%9C%85'; // ✅
const CROSS_MARK = '%E2%9D%8C'; // ❌

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

/** Fetches both reaction sets for a message in the fewest calls possible (one per emoji),
 * caching per message id so the later stamp phase never re-fetches the same message. */
async function getMessageApprovals(message, channelId, botToken, opts, cache) {
  if (cache.has(message.id)) return cache.get(message.id);
  const approvedBy = (await fetchReactors(channelId, message.id, CHECK_MARK, botToken, opts)).filter((id) => SOCIAL_APPROVERS.includes(id));
  const rejectedBy = (await fetchReactors(channelId, message.id, CROSS_MARK, botToken, opts)).filter((id) => SOCIAL_APPROVERS.includes(id));
  const result = { approvedBy, rejectedBy };
  cache.set(message.id, result);
  return result;
}

export async function run({ execGh = gh, execGit = git, fetchImpl = fetch, sleepImpl = defaultSleep } = {}) {
  const botToken = requireEnv.call(null, 'DISCORD_BOT_TOKEN');
  const webhookUrl = requireEnv.call(null, 'SOCIAL_APPROVAL_WEBHOOK_URL');
  const approvalKey = requireEnv.call(null, 'SOCIAL_APPROVAL_KEY');
  requireEnv.call(null, 'GH_TOKEN');
  const repo = requireEnv.call(null, 'REPO');
  const discordOpts = { fetchImpl, sleepImpl };

  const webhookId = webhookIdFromUrl(webhookUrl);
  const channelId = await resolveChannelId(webhookUrl);

  // The workflow checks the runner out at `ref: main`, but a queue file
  // being stamped/rejected lives on the PR's own (unmerged) branch — local
  // git reads/writes below must happen on that branch, not main. Configured
  // once, lazily, right before the first PR that actually needs a local
  // git write/checkout this run.
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

  // Group candidate messages by the PR they reference, keeping only
  // messages whose ref: line's headSha matches the PR's CURRENT head —
  // an older message's ref points at superseded content and is ignored.
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

    const current = refs.filter((r) => r.sha === prView.headRefOid);
    if (current.length === 0) continue; // every ref on this PR is stale; content moved on

    const filesToStamp = new Set();
    let rejectHeader = false;
    const rejectFiles = [];
    const reactionCache = new Map();
    // Files (and the header, tracked separately) whose message's reactions
    // could not be read this run — an unreadable message could carry a ❌
    // we can't see, so it must never be silently approved through, whether
    // directly or via a header '*' expansion that would otherwise cover it.
    const unresolvedFiles = new Set();
    let headerUnresolved = false;

    for (const { message, file } of current) {
      let approvedBy, rejectedBy;
      try {
        ({ approvedBy, rejectedBy } = await getMessageApprovals(message, channelId, botToken, discordOpts, reactionCache));
      } catch (err) {
        console.error(`::warning::social-approval-poll: could not fetch reactions for message ${message.id} (PR #${pr}, file ${file}) — treating as unresolved this run (retries next run): ${err.message}`);
        if (file === '*') headerUnresolved = true;
        else unresolvedFiles.add(file);
        continue;
      }

      if (rejectedBy.length > 0) {
        if (file === '*') rejectHeader = true;
        else rejectFiles.push(file);
        continue;
      }
      if (approvedBy.length > 0) {
        if (file === '*') filesToStamp.add('*');
        else filesToStamp.add(file);
      }
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

    // Reject path (A3's rejection path, unchanged in shape).
    if (rejectHeader) {
      execGh(['pr', 'close', String(pr), '--repo', repo, '--comment', 'reject: founder reacted ❌ on the brief (no written reason)']);
      continue;
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

    for (const file of rejectFiles) {
      execGit(['rm', path.posix.join('social', 'queue', path.basename(file))]);
      execGit(['commit', '-m', `social-approval: reject ${file} (founder ❌ in Discord)`]);
      execGit(['push', 'origin', `HEAD:${prView.headRefName}`]);
      execGh(['pr', 'comment', String(pr), '--repo', repo, '--body', `reject: ${file} — founder reacted ❌ in #longlive-social (no written reason)`]);
    }

    // A header message whose reactions couldn't be fetched this run could be
    // carrying a PR-wide ❌ (rejectHeader) we simply can't see — in that case
    // NOTHING on this PR is safe to stamp or merge this run, not even a
    // draft whose own message resolved cleanly with its own ✅, because we
    // cannot know whether the unreadable header's reject should have closed
    // the whole PR instead. Skip the entire PR's approve+merge phases and
    // retry on the next run (individual-file rejects above are unaffected —
    // they don't depend on the header being readable).
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

    const toStamp = targetFiles.filter((file) => {
      const raw = readFileSync(path.join(process.cwd(), path.posix.join('social', 'queue', path.basename(file))), 'utf8');
      const item = JSON.parse(raw);
      return !approvalStatus(item, { approvers: SOCIAL_APPROVERS, key: approvalKey }).ok;
    });

    if (toStamp.length > 0) {
      const approverRef = current.find(() => SOCIAL_APPROVERS.length > 0)?.message;
      const approvedByIds = new Set();
      for (const { message } of current) {
        const cached = reactionCache.get(message.id);
        if (!cached) continue; // this message's reactions failed to fetch above and was already logged
        for (const id of cached.approvedBy) approvedByIds.add(id);
      }
      const by = [...approvedByIds][0];
      const result = stampFiles(toStamp, {
        by,
        at: new Date().toISOString(),
        pr,
        message: String(approverRef?.id ?? current[0].message.id),
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
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'social-approval-poll.mjs') {
  run().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
