// Builds and sends the Discord approval prompt for pending social draft
// PR(s) (RULINGS-SOCIAL.md A3, rebuilding the 2026-09-10 text-only version
// per the RCA at scratchpad/RCA-social-brief-image.md). One Discord MESSAGE
// per draft, each carrying an `image.url` embed built from the exact same
// MEDIA_BASE_URL/mediaUrlsFor helpers post-queue.mjs publishes from
// (lib/queue.mjs) — so the brief and the poster can never point at
// different hosts — plus everything else a go/no-go needs: account handle,
// overdue annotation, length against the platform limit, alt text, credit,
// a truncated `why` with a file link, and the Facebook cross-post
// disclosure (A4) on every Instagram draft.
//
// Approve = react ✅ in #longlive-social, on a draft message for just that
// one or on the header for every draft in the PR (RULINGS-SOCIAL-2.md B1 —
// social-approval-poll.yml polls for the reaction, stamps a v2 signed
// approval, then merges; merging the PR yourself does NOT approve it, it
// kills the draft). Reject = react ❌ the same way — on a draft drops just
// that file, on the header closes the whole PR; the poll job then carries
// out the A3 rejection path (git rm + PR comment / PR close), so
// docs/agents/runner-prompts/growth-draft.md's drafting routine still reads
// a `reject:` comment before drafting again.
//
// Every message this builds carries a machine-readable
// `ref: PR #<n> · <headSha> · <file|*>` line as its last content line —
// webhook-authored, so an agent cannot forge which draft a reaction is
// binding to (see social-approval-poll.mjs's header comment for why that
// property holds).
//
// This never runs against a real Discord webhook from an agent's own
// context — it is invoked by .github/workflows/social-approval-notify.yml
// (a `pull_request_target`/`schedule` job) or, for an end-to-end proof, by
// hand against a scratch PR/webhook. Only edited/tested here, not executed
// against a real pending draft, per this track's brief.

import { readFile } from 'node:fs/promises';
import { neutralizeMentions, chunkForDiscord, DISCORD_MESSAGE_LIMIT } from '../community/discord-delivery.mjs';
import { mediaUrlsFor, MEDIA_BASE_URL, hoursOverdue } from './lib/queue.mjs';
import { PLATFORM_RULES } from './lib/queue-schema.mjs';
import { runMain } from '../lib/cli.mjs';

function escapeFences(text) {
  return String(text ?? '').replace(/```/g, '``​`');
}

/** Webhook display identity (Tree Overhaul S5) — every message this script
 * posts to #longlive-social shows as "Tree", not a bare webhook name, with
 * a stable avatar so the channel reads as one consistent actor.
 * `apps/web/public/social/tree-avatar.png` is a placeholder (see MAP.md),
 * served from the same host post-queue.mjs/mediaUrlsFor already publish
 * from (MEDIA_BASE_URL) so this never depends on a second CDN/host. */
export const TREE_WEBHOOK_USERNAME = 'Tree';
export const TREE_AVATAR_URL = `${MEDIA_BASE_URL}/social/tree-avatar.png`;

/** "Tree · slot: <calendar slot or fast-lane routine> · pillar: <why or
 * unspecified>" — the first line of every draft brief (Tree Overhaul S5).
 * `slot` prefers the draft's scheduled calendar time (same formatting as
 * formatScheduleLine's compact stamp); a draft with no valid `scheduledAt`
 * fell outside normal calendar scheduling, so it's labeled by the routine
 * that produced it instead. `pillar` surfaces the `why` field (truncated)
 * so a founder sees at a glance whether this draft is sourced. */
function formatTreeIdentityLine(draft) {
  const scheduled = new Date(draft.scheduledAt);
  const slot = Number.isNaN(scheduled.getTime())
    ? `fast lane: ${draft.sourceRoutine ?? 'unknown'}`
    : `${draft.scheduledAt.slice(0, 16).replace('T', ' ')} UTC`;
  const pillar = draft.why ? (draft.why.length > 80 ? `${draft.why.slice(0, 80)}...` : draft.why) : 'unspecified';
  return `Tree · slot: ${slot} · pillar: ${pillar}`;
}

/** Account identity shown per platform — constant, not derived from a
 * draft's own fields (a draft carries no account id; the posted ledger's
 * URLs are the only place the handle shows up today, and hardcoding it
 * here is simpler and cannot drift since this repo only ever posts one
 * account per platform). */
const ACCOUNT_BY_PLATFORM = {
  x: { label: 'X', handle: '@longlivetscom' },
  instagram: { label: 'Instagram', handle: '@longlivetscom' },
};

/** "in 1d 14h" / "OVERDUE by 25h" — RULINGS-SOCIAL A3 field 3. Never a bare
 * timestamp: hoursOverdue/simple subtraction tell a founder at a glance
 * whether this is routine scheduling or something stuck. */
function formatScheduleLine(draft, now) {
  const iso = draft.scheduledAt ?? 'n/a';
  const scheduled = new Date(draft.scheduledAt);
  if (Number.isNaN(scheduled.getTime())) return `Posts at: ${iso} — invalid scheduledAt.`;
  const overdue = hoursOverdue({ scheduledAt: draft.scheduledAt }, now);
  if (overdue > 0) {
    const h = Math.round(overdue);
    return `Posts at: ${iso.slice(0, 16).replace('T', ' ')} UTC — OVERDUE by ${h}h: posts on the first run after approval, retired to failed/ at 48h.`;
  }
  const ms = scheduled.getTime() - now.getTime();
  const totalHours = Math.round(ms / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours - days * 24;
  const relative = days > 0 ? `in ${days}d ${hours}h` : `in ${hours}h`;
  return `Posts at: ${iso.slice(0, 16).replace('T', ' ')} UTC (${relative})`;
}

/** "1,012 / 2,200 characters" / "~256 / 280 weighted characters" —
 * RULINGS-SOCIAL A3 field 4. Falls back to a plain length for an unknown
 * platform rather than throwing — a brief must still render for a draft
 * whose platform is itself the problem check-drafts.mjs will flag. */
function formatLengthLine(draft) {
  const rules = PLATFORM_RULES[draft.platform];
  if (!rules) return `Length: ${String(draft.body ?? '').length} characters (unrecognized platform "${draft.platform}")`;
  const measured = rules.measure(draft.body ?? '');
  const approx = rules.unit.startsWith('weighted') ? '~' : '';
  return `Length: ${approx}${measured.toLocaleString('en-US')} / ${rules.maxBody.toLocaleString('en-US')} ${rules.unit}`;
}

/** First 240 chars of `why` + a link to the file at the PR head SHA —
 * RULINGS-SOCIAL A3 field 9. Never the full `why` inline (some run
 * hundreds of words); the file link is how a founder checks the full
 * sourcing claim. */
function formatWhyLine(draft, { headSha, repo }) {
  if (!draft.why) return null;
  const truncated = draft.why.length > 240 ? `${draft.why.slice(0, 240)}...` : draft.why;
  const fileLink =
    headSha && repo && draft.file ? ` (full: https://github.com/${repo}/blob/${headSha}/${draft.file})` : '';
  return `Why: ${escapeFences(truncated)}${fileLink}`;
}

/** One draft's message body lines (everything except the header line and
 * the embed, which buildApprovalPrompt/sendApprovalPrompt handle
 * separately). */
function formatDraftLines(draft, { now, headSha, repo, facebookCrosspost }) {
  const media = draft.media ?? [];
  const altText = draft.altText ?? [];
  const mediaUrls = mediaUrlsFor({ media }, MEDIA_BASE_URL);

  return [
    facebookCrosspost && draft.platform === 'instagram'
      ? 'Also publishes to: your Facebook Page — automatic, image 1 + this caption verbatim, same alt text.'
      : null,
    formatScheduleLine(draft, now),
    formatLengthLine(draft),
    '```',
    escapeFences(neutralizeMentions(draft.body ?? '(no body on file)')),
    '```',
    ...mediaUrls.map((url, i) => `Image ${i + 1}/${mediaUrls.length}: ${url}`),
    ...altText.map((alt, i) => `Alt text ${i + 1}/${altText.length}: ${JSON.stringify(alt)}`),
    draft.mediaCredit ? `Credit: ${draft.mediaCredit}` : null,
    formatWhyLine(draft, { headSha, repo }),
    draft.campaign ? `Campaign: ${draft.campaign}` : null,
    draft.sourceRoutine ? `Drafted by: ${draft.sourceRoutine}` : null,
  ].filter((l) => l !== null && l !== undefined);
}

/**
 * Builds one message object per draft (plus a leading header message),
 * each `{ content, embeds }` — `embeds` is the Discord embed array
 * (`image.url` per image) for sendApprovalPrompt to attach. `pr` is
 * `{ number, url }`. `drafts` is the PR's changed `social/queue/**.json`
 * entries: `{ file, platform, body, scheduledAt, campaign, mediaCredit,
 * media, altText, why, sourceRoutine }` (the FULL `media` array, not just
 * the first element — .github/workflows/social-approval-notify.yml's
 * projection was fixed to stop dropping it).
 *
 * `options.facebookCrosspost` (A4) — when true, every Instagram draft's
 * message gets the cross-post disclosure line. `options.headSha`/`repo`
 * build the `why` field's file link.
 */
export function buildApprovalPrompt(pr, drafts, { now = new Date(), headSha, repo, facebookCrosspost = false } = {}) {
  if (!headSha) {
    throw new Error('buildApprovalPrompt: headSha is required — every brief message must carry a verifiable ref: line (RULINGS-SOCIAL-2.md B1)');
  }

  const header = {
    content: [
      `**Social approval needed · PR #${pr.number}** — <${pr.url}>`,
      `Drafted by: ${drafts[0]?.sourceRoutine ?? 'unknown'} · ${drafts.length} draft${drafts.length === 1 ? '' : 's'}` +
        (drafts[0]?.campaign ? ` · campaign \`${drafts[0].campaign}\`` : ''),
      'Approve: react ✅ on a draft below, or on this message for all of them. Reject: react ❌ (on a draft drops just that one; here closes the PR). Merging the PR yourself does NOT approve — it kills the drafts.',
      `ref: PR #${pr.number} · ${headSha} · *`,
    ].join('\n'),
    embeds: [],
  };

  const draftMessages = drafts.map((draft, i) => {
    const account = ACCOUNT_BY_PLATFORM[draft.platform] ?? { label: draft.platform, handle: '(unknown account)' };
    const mediaUrls = mediaUrlsFor({ media: draft.media ?? [] }, MEDIA_BASE_URL);
    const embeds = mediaUrls.map((url) => ({ image: { url } }));
    const content = [
      formatTreeIdentityLine(draft),
      `**Draft ${i + 1} · ${account.label} — ${account.handle}**`,
      ...formatDraftLines(draft, { now, headSha, repo, facebookCrosspost }),
      `ref: PR #${pr.number} · ${headSha} · ${draft.file}`,
    ].join('\n');
    return { content, embeds };
  });

  return [header, ...draftMessages];
}

/**
 * Sends every built message as its own Discord webhook POST, chunking any
 * over-limit `content` with `chunkForDiscord` and attaching `embeds` ONLY
 * to the LAST chunk of a message (Discord embeds render against the
 * message they're attached to, and putting them on every chunk would
 * duplicate the image). Checks the `?wait=true` response's `embeds.length`
 * against what was sent — the machine-verifiable half of "the image shows"
 * (RULINGS-SOCIAL A3/A5 condition 3) — and counts an embed-carrying chunk
 * whose response under-reports as a failed chunk, loud, not swallowed.
 * Never throws on an individual chunk's failure — one failed chunk must
 * not lose the confirmed sends around it.
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
    const { content, embeds = [] } = messages[m];
    const chunks = chunkForDiscord(content, DISCORD_MESSAGE_LIMIT);
    for (let i = 0; i < chunks.length; i += 1) {
      const isLastChunk = i === chunks.length - 1;
      const chunkEmbeds = isLastChunk ? embeds : [];
      try {
        const response = await fetchImpl(`${webhook}?wait=true`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            content: chunks[i],
            username: TREE_WEBHOOK_USERNAME,
            avatar_url: TREE_AVATAR_URL,
            allowed_mentions: { parse: [] },
            ...(chunkEmbeds.length ? { embeds: chunkEmbeds } : {}),
          }),
        });
        if (!response.ok) throw new Error(`Discord approval-channel delivery failed with HTTP ${response.status}`);
        const payload = await response.json();
        if (!payload?.id) throw new Error('Discord approval-channel delivery returned no message id');
        if (chunkEmbeds.length) {
          embedsSent += chunkEmbeds.length;
          const acceptedCount = Array.isArray(payload.embeds) ? payload.embeds.length : 0;
          embedsAccepted += acceptedCount;
          if (acceptedCount !== chunkEmbeds.length) {
            throw new Error(
              `Discord reported embeds.length=${acceptedCount} but this chunk sent ${chunkEmbeds.length} -- the image may not show. This is the machine-verifiable half of "the image shows" (RULINGS-SOCIAL A3); treating it as a failed chunk.`,
            );
          }
        }
        delivered.push({ message: m, chunk: i, messageId: payload.id });
      } catch (err) {
        failed.push({ message: m, chunk: i, error: String(err?.message ?? err) });
      }
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
  console.log(`approval-prompt: ${result.delivered.length} chunk(s) delivered, ${result.failed.length} failed.`);
  for (const f of result.failed) console.error(`approval-prompt: message ${f.message} chunk ${f.chunk} failed: ${f.error}`);
  // A rotated/deleted webhook secret (or a silently-dropped embed) must not
  // fail silently forever (Fable review finding D on #4090) -- a red
  // Actions run here is what watchdog.yml-style monitoring would catch.
  if (result.failed.length > 0) return 1;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'approval-prompt.mjs') {
  runMain(main, { name: 'social-approval-prompt' });
}
