// Builds and sends the Discord approval prompt for pending social draft
// PR(s) (docs/social/RULINGS-SOCIAL.md A3; reshaped 2026-09-30, Bots v2 W2 —
// owner: "I just want to know what we're posting"). ONE Discord message per
// POST (a campaign's IG+X pair, or a lone item), never chunked and never more
// than DISCORD_MESSAGE_HARD_CAP characters: label, schedule, the X text in
// full, the IG caption trimmed with a link to the full draft, a one-line why,
// and one deliberate image embed (the poster's own MEDIA_BASE_URL/
// mediaUrlsFor, so the preview and the published post can never differ in
// host). The message builder lives in lib/approval-post.mjs.
//
// Approve = the owner reacts ✅ on the post — every file in it is approved,
// both halves of a pair (docs/social/RULINGS-SOCIAL-2.md B1 +
// docs/decisions.md 2026-09-30: social-approval-poll.yml stamps a signed
// approval per file, then merges; merging the PR yourself does NOT approve
// it, it kills the draft). Reject = ANY reply to the post (or in its thread),
// or a bare ❌ (reason "none given"): every file in the post is dropped, the
// reply text is the reason, and the poll marks the post ❌ itself as the
// confirmation. docs/agents/runner-prompts/tree-daily-draft.md's drafting
// routine still reads the resulting `reject:` comment before drafting again.
//
// Every message carries a machine-readable `ref: PR #<n> · <headSha> ·
// <file[,file…]>` line as its last content line — webhook-authored, so an
// agent cannot forge which draft a reaction is binding to (see
// social-approval-poll.mjs's header comment for why that property holds).
// Link previews (Bots v2 C6): a post with a deliberate image embed wraps every
// URL in `<…>`; one without sets flags 4 (SUPPRESS_EMBEDS).
//
// This never runs against a real Discord webhook from an agent's own
// context — it is invoked by .github/workflows/social-approval-notify.yml
// (a `pull_request_target`/`schedule` job) or, for an end-to-end proof, by
// hand against a scratch PR/webhook. Only edited/tested here, not executed
// against a real pending draft, per this track's brief.

import { readFile } from 'node:fs/promises';
import { MEDIA_BASE_URL } from './lib/queue.mjs';
import { DISCORD_MESSAGE_HARD_CAP } from './lib/approval-text.mjs';
import { suppressPreviews } from '../community/discord-delivery.mjs';
import { buildPostMessage, groupPosts } from './lib/approval-post.mjs';
import { runMain } from '../lib/cli.mjs';

export { DISCORD_MESSAGE_HARD_CAP };

/** Webhook display identity (Tree Overhaul S5) — every message this script
 * posts to #longlive-tree shows as "Tree", not a bare webhook name, with
 * a stable avatar so the channel reads as one consistent actor.
 * `apps/web/public/social/tree-avatar.png` is a placeholder (see MAP.md),
 * served from the same host post-queue.mjs/mediaUrlsFor already publish
 * from (MEDIA_BASE_URL) so this never depends on a second CDN/host. */
export const TREE_WEBHOOK_USERNAME = 'Tree';
export const TREE_AVATAR_URL = `${MEDIA_BASE_URL}/social/tree-avatar.png`;

/**
 * Builds one message object per POST, each `{ content, embeds, flags? }` —
 * `embeds` is the Discord embed array (one `image.url`) for sendApprovalPrompt
 * to attach, `flags: 4` is set when there is no deliberate embed. `pr` is
 * `{ number, url }`. `drafts` is the PR's changed `social/queue/**.json`
 * entries: `{ file, platform, body, scheduledAt, campaign, media, why,
 * singlePlatformReason, lane, critique }` (the FULL `media` array).
 *
 * A post that cannot be built safely is skipped (never thrown), logged, and
 * listed on the returned array's `.skipped`.
 *
 * `options.facebookCrosspost` (A4) — when true, an Instagram caption's
 * heading gets the cross-post disclosure. `options.headSha`/`repo` build the
 * full-draft link and the ref line.
 */
export function buildApprovalPrompt(pr, drafts, { now = new Date(), headSha, repo, facebookCrosspost = false } = {}) {
  if (!headSha) {
    throw new Error('buildApprovalPrompt: headSha is required — every brief message must carry a verifiable ref: line (RULINGS-SOCIAL-2.md B1)');
  }
  // One unbuildable post (an unsafe file name, a ref line too long to bind
  // safely…) must never abort the rest of the PR's brief: it is skipped, logged
  // loudly, and listed on `.skipped` so the CLI can still fail the run.
  const messages = [];
  const skipped = [];
  for (const post of groupPosts(drafts)) {
    try {
      messages.push(buildPostMessage(post, pr, { now, headSha, repo, facebookCrosspost }));
    } catch (err) {
      const files = post.map((d) => String(d?.file ?? '').slice(0, 120));
      skipped.push({ files, error: String(err?.message ?? err) });
      // JSON.stringify keeps a hostile file name on ONE log line (no ::command:: injection).
      console.error(`::error::approval-prompt: no approval post for ${JSON.stringify(files)} — ${JSON.stringify(String(err?.message ?? err).slice(0, 300))}`);
    }
  }
  return Object.assign(messages, { skipped });
}

/**
 * Sends every built message as its own Discord webhook POST. A message over
 * DISCORD_MESSAGE_HARD_CAP is refused (counted as failed, loud) rather than
 * split — the builder guarantees this never happens, this is the backstop.
 * Checks the `?wait=true` response's `embeds.length` against what was sent —
 * the machine-verifiable half of "the image shows" (RULINGS-SOCIAL A3/A5
 * condition 3) — and counts a message whose response under-reports as failed,
 * loud, not swallowed. Never throws on an individual message's failure — one
 * failed message must not lose the confirmed sends around it.
 */
export async function sendApprovalPrompt(
  messages,
  { webhook = process.env.SOCIAL_APPROVAL_WEBHOOK_URL, fetchImpl = fetch } = {},
) {
  if (!webhook) return { status: 'unconfigured', delivered: [], failed: [], embedsSent: 0, embedsAccepted: 0 };

  const delivered = [];
  const failed = [];
  let embedsSent = 0;
  let embedsAccepted = 0;

  for (let m = 0; m < messages.length; m += 1) {
    const { content, embeds = [], flags } = messages[m];
    try {
      if (content.length > DISCORD_MESSAGE_HARD_CAP) {
        throw new Error(`approval message is ${content.length} characters, over Discord's ${DISCORD_MESSAGE_HARD_CAP} limit — refusing to send (it must be truncated, never chunked)`);
      }
      const body = suppressPreviews({
        content,
        username: TREE_WEBHOOK_USERNAME,
        avatar_url: TREE_AVATAR_URL,
        allowed_mentions: { parse: [] },
        ...(embeds.length ? { embeds } : {}),
        ...(flags ? { flags } : {}),
      });
      // Angle-wrapping adds 2 chars per URL; never let it push a message the
      // builder fitted to the cap over it — an unwrapped URL beats no prompt.
      if (body.content.length > DISCORD_MESSAGE_HARD_CAP) body.content = content;
      const response = await fetchImpl(`${webhook}?wait=true`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`Discord approval-channel delivery failed with HTTP ${response.status}`);
      const payload = await response.json();
      if (!payload?.id) throw new Error('Discord approval-channel delivery returned no message id');
      if (embeds.length) {
        embedsSent += embeds.length;
        const acceptedCount = Array.isArray(payload.embeds) ? payload.embeds.length : 0;
        embedsAccepted += acceptedCount;
        if (acceptedCount !== embeds.length) {
          throw new Error(
            `Discord reported embeds.length=${acceptedCount} but this message sent ${embeds.length} -- the image may not show. This is the machine-verifiable half of "the image shows" (RULINGS-SOCIAL A3); treating it as a failed message.`,
          );
        }
      }
      delivered.push({ message: m, messageId: payload.id });
    } catch (err) {
      failed.push({ message: m, error: String(err?.message ?? err) });
    }
  }

  console.log(`approval-prompt: embeds accepted: ${embedsAccepted}`);
  return { status: failed.length === 0 ? 'delivered' : 'partial', delivered, failed, embedsSent, embedsAccepted };
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
  const headSha = flag('head-sha');
  const repo = flag('repo') ?? process.env.GITHUB_REPOSITORY;
  const facebookCrosspost = flag('facebook-crosspost') === 'true';
  if (!prNumber || !prUrl || !manifestPath) {
    throw new Error(
      'Usage: approval-prompt.mjs --pr <number> --pr-url <url> --manifest <path-to-json-array> [--head-sha <sha>] [--repo <owner/repo>] [--facebook-crosspost true|false]',
    );
  }
  const drafts = JSON.parse(await readFile(manifestPath, 'utf-8'));
  const messages = buildApprovalPrompt({ number: prNumber, url: prUrl }, drafts, { headSha, repo, facebookCrosspost });
  const result = await sendApprovalPrompt(messages);
  if (result.status === 'unconfigured') {
    console.log('approval-prompt: SOCIAL_APPROVAL_WEBHOOK_URL is not configured -- skipping (clean no-op).');
    return;
  }
  if (messages.skipped.length > 0) process.exitCode = 1; // a draft with no approval post can never be approved — keep the run red
  console.log(`approval-prompt: ${result.delivered.length} message(s) delivered, ${result.failed.length} failed.`);
  for (const f of result.failed) console.error(`approval-prompt: message ${f.message} failed: ${f.error}`);
  // A rotated/deleted webhook secret (or a silently-dropped embed) must not
  // fail silently forever (Fable review finding D on #4090) -- a red
  // Actions run here is what watchdog.yml-style monitoring would catch.
  if (result.failed.length > 0) return 1;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'approval-prompt.mjs') {
  runMain(main, { name: 'social-approval-prompt' });
}
