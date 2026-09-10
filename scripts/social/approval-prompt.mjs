// Builds and sends the Discord approval prompt for a pending social draft
// PR (2026-09-10 approval-gate decision, docs/decisions.md). Reuses
// scripts/community/discord-delivery.mjs's mention-neutralizing and
// message-chunking logic rather than re-implementing either — see that
// file's header for why the fence-escaping/`<url>` angle-bracket wrapping
// stay inline expressions instead of separate exports (not worth extracting
// for a two-call-site pattern).
//
// This never runs against a real Discord webhook from an agent's own
// context — it is invoked by .github/workflows/social-approval-notify.yml
// (a `pull_request_target`/`schedule` job) or, for an end-to-end proof, by
// hand against a scratch PR/webhook. Only edited/tested here, not executed
// against a real pending draft, per this track's brief.

import { readFile } from 'node:fs/promises';
import { neutralizeMentions, chunkForDiscord, DISCORD_MESSAGE_LIMIT } from '../community/discord-delivery.mjs';
import { runMain } from '../lib/cli.mjs';

function escapeFences(text) {
  return String(text ?? '').replace(/```/g, '``​`');
}

/** One draft's block within the prompt. */
function formatDraft(draft, index) {
  const platform = draft.platform === 'x' ? 'X' : draft.platform === 'instagram' ? 'Instagram' : draft.platform;
  const lines = [
    `**Draft ${index + 1} · ${platform}**`,
    '```',
    escapeFences(neutralizeMentions(draft.body ?? '(no body on file)')),
    '```',
    `Scheduled: ${draft.scheduledAt ?? 'n/a'}`,
    draft.campaign ? `Campaign: ${draft.campaign}` : null,
    draft.mediaCredit ? `Media credit: ${draft.mediaCredit}` : null,
    draft.media ? `Media: <${draft.media}>` : null,
    draft.sourceRoutine ? `Source routine: ${draft.sourceRoutine}` : null,
  ];
  return lines.filter(Boolean).join('\n');
}

/**
 * Builds the full (unchunked) approval-prompt markdown for one pending PR.
 * `pr` is `{ number, url }`; `drafts` is the PR's changed
 * `social/queue/**.json` entries, each `{ platform, body, scheduledAt,
 * campaign, mediaCredit, media, sourceRoutine }`.
 */
export function buildApprovalPrompt(pr, drafts) {
  const lines = [
    `**Social approval needed · PR #${pr.number}**`,
    `<${pr.url}>`,
    '',
    ...drafts.flatMap((draft, i) => [formatDraft(draft, i), '']),
    'Merge the PR to approve. Close it to reject.',
  ];
  return lines.join('\n');
}

/**
 * Sends one PR's approval prompt to the configured Discord webhook,
 * chunking at Discord's message limit (captions can run up to ~2200 chars
 * on their own, well past a single message). Never throws on an individual
 * chunk's failure — one failed chunk must not lose the confirmed sends
 * around it.
 */
export async function sendApprovalPrompt(
  content,
  { webhook = process.env.SOCIAL_APPROVAL_WEBHOOK_URL, fetchImpl = fetch } = {},
) {
  if (!webhook) return { status: 'unconfigured', delivered: [], failed: [] };
  const chunks = chunkForDiscord(content, DISCORD_MESSAGE_LIMIT);
  const delivered = [];
  const failed = [];
  for (let i = 0; i < chunks.length; i += 1) {
    try {
      const response = await fetchImpl(`${webhook}?wait=true`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: chunks[i], allowed_mentions: { parse: [] } }),
      });
      if (!response.ok) throw new Error(`Discord approval-channel delivery failed with HTTP ${response.status}`);
      const payload = await response.json();
      if (!payload?.id) throw new Error('Discord approval-channel delivery returned no message id');
      delivered.push({ chunk: i, messageId: payload.id });
    } catch (err) {
      failed.push({ chunk: i, message: String(err?.message ?? err) });
    }
  }
  return { status: failed.length === 0 ? 'delivered' : 'partial', delivered, failed };
}

async function main() {
  const args = process.argv.slice(2);
  const flag = (name) => {
    const i = args.indexOf(`--${name}`);
    return i === -1 ? undefined : args[i + 1];
  };
  const prNumber = flag('pr');
  const prUrl = flag('pr-url');
  const manifestPath = flag('manifest');
  if (!prNumber || !prUrl || !manifestPath) {
    throw new Error('Usage: approval-prompt.mjs --pr <number> --pr-url <url> --manifest <path-to-json-array>');
  }
  const drafts = JSON.parse(await readFile(manifestPath, 'utf-8'));
  const content = buildApprovalPrompt({ number: prNumber, url: prUrl }, drafts);
  const result = await sendApprovalPrompt(content);
  if (result.status === 'unconfigured') {
    console.log('approval-prompt: SOCIAL_APPROVAL_WEBHOOK_URL is not configured — skipping (clean no-op).');
    return;
  }
  console.log(`approval-prompt: ${result.delivered.length} chunk(s) delivered, ${result.failed.length} failed.`);
  for (const f of result.failed) console.error(`approval-prompt: chunk ${f.chunk} failed: ${f.message}`);
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'approval-prompt.mjs') {
  runMain(main, { name: 'social-approval-prompt' });
}
