#!/usr/bin/env node
// social-approval-poll — the ONLY place a ✅/❌ in #longlive-social turns
// into a signed approval stamp and a merge (RULINGS-SOCIAL-2.md B1).
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

async function discordGet(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bot ${token}` } });
  if (!res.ok) {
    throw new Error(`Discord GET ${url} -> ${res.status} ${await res.text()}`);
  }
  return res.json();
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

async function fetchReactors(channelId, messageId, emoji, token) {
  const users = await discordGet(`${DISCORD_API}/channels/${channelId}/messages/${messageId}/reactions/${emoji}?limit=100`, token);
  return users.map((u) => `discord:${u.id}`);
}

export async function run({ execGh = gh, fetchImpl = fetch } = {}) {
  const botToken = requireEnv.call(null, 'DISCORD_BOT_TOKEN');
  const webhookUrl = requireEnv.call(null, 'SOCIAL_APPROVAL_WEBHOOK_URL');
  const approvalKey = requireEnv.call(null, 'SOCIAL_APPROVAL_KEY');
  requireEnv.call(null, 'GH_TOKEN');
  const repo = requireEnv.call(null, 'REPO');

  const webhookId = webhookIdFromUrl(webhookUrl);
  const channelId = await resolveChannelId(webhookUrl);

  const messages = await discordGet(`${DISCORD_API}/channels/${channelId}/messages?limit=100`, botToken);

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

    for (const { message, file } of current) {
      const approvedBy = (await fetchReactors(channelId, message.id, CHECK_MARK, botToken)).filter((id) => SOCIAL_APPROVERS.includes(id));
      const rejectedBy = (await fetchReactors(channelId, message.id, CROSS_MARK, botToken)).filter((id) => SOCIAL_APPROVERS.includes(id));

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
    for (const file of rejectFiles) {
      execGh(['rm', path.posix.join('social', 'queue', path.basename(file))]);
      execGh(['commit', '-m', `social-approval: reject ${file} (founder ❌ in Discord)`]);
      execGh(['pr', 'comment', String(pr), '--repo', repo, '--body', `reject: ${file} — founder reacted ❌ in #longlive-social (no written reason)`]);
    }

    // Approve path: resolve "*" (header ✅) to every tripping file on the PR.
    let targetFiles = [...filesToStamp].filter((f) => f !== '*');
    if (filesToStamp.has('*')) {
      const filesMeta = JSON.parse(execGh(['pr', 'view', String(pr), '--repo', repo, '--json', 'files'])).files;
      targetFiles = filesMeta.filter((f) => f.path.startsWith('social/queue/') && f.path.endsWith('.json')).map((f) => f.path);
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
        for (const id of await fetchReactors(channelId, message.id, CHECK_MARK, botToken)) {
          if (SOCIAL_APPROVERS.includes(id)) approvedByIds.add(id);
        }
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
          execGh(['add', ...result.stamped]);
          execGh(['commit', '-m', `social-approval: stamp ${result.stamped.join(', ')} (discord ✅ by founder, PR #${pr})`]);
          execGh(['push']);
        }
      }
    }

    // Merge phase — independent of this run's reactions, so a red-CI retry
    // on a later run still merges once checks go green.
    const filesMeta = JSON.parse(execGh(['pr', 'view', String(pr), '--repo', repo, '--json', 'files'])).files;
    const trippingFiles = filesMeta.filter((f) => f.path.startsWith('social/queue/') && f.path.endsWith('.json'));
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
