// Builds and sends Tree's Monday brief to #longlive-social (Tree Overhaul
// T4, docs/specs/tree-overhaul/t4-weekly-brief.md) — the same channel the
// founder already approves drafts in, instead of an email-only report.
// Mirrors approval-prompt.mjs's structure deliberately: a pure
// `buildWeeklyBrief` (everything worth testing) and a thin `sendWeeklyBrief`
// that reuses the exact same webhook/identity/chunking helpers
// approval-prompt.mjs already established — never reimplemented here.
//
// Message sequence (spec §Data "Message layout"), each carrying the S3
// `ref:` line so social-approval-poll.mjs's scope-token dispatch can bind a
// reaction unambiguously:
//   1. header  -- 5-line scorecard + "what changed and why"     ref: brief
//   2. calendar, days 1-7                                       ref: calendar:1
//   3. calendar, days 8-14                                      ref: calendar:2
//   4..6. one proposal each (<=3)                       ref: proposal:1..n
//   last. questions (<=2) + how to reply                        ref: questions
//
// These scopes bind to `(pr, messageId)` alone, never to the ref line's SHA
// and never gated on the plan PR's OPEN state (spec §Data "Plan-brief
// scopes bind by (pr, messageId)") -- that is social-approval-poll.mjs's
// concern, not this builder's; this file only writes the ref line, it never
// interprets one.
import { readFile } from 'node:fs/promises';
import { neutralizeMentions, DISCORD_MESSAGE_LIMIT } from '../community/discord-delivery.mjs';
import { TREE_WEBHOOK_USERNAME, TREE_AVATAR_URL } from './approval-prompt.mjs';
import { chunkPreservingRefLine } from './lib/ref-line-chunk.mjs';
import { buildScorecard, renderScorecard } from './weekly-scorecard.mjs';
import { runMain } from '../lib/cli.mjs';

const WEDNESDAY_CUTOFF_NOTE =
  "Reply before Wednesday 23:59 UTC and I'll re-plan the rest of this week; a later reply still counts, it just shapes next Monday instead.";

function ref(pr, headSha, scope) {
  return `ref: PR #${pr.number} · ${headSha} · ${scope}`;
}

/** One calendar message: `**<label>**`, one `Day <n> — <text>` line per
 * slot (spec: "one line per slot with the reason it's there"), then the
 * ref line. `slots`: `{ day, text }[]`, already filtered to this message's
 * half — a day with two beats (strategy §2's superseded maximum, tested at
 * AC#2) contributes two lines sharing one `day` number. */
function buildCalendarMessage(slots, label, scope, pr, headSha) {
  const lines = slots.length > 0 ? slots.map((s) => `Day ${s.day} — ${s.text}`) : ['Nothing new scheduled this half.'];
  return { content: [`**${label}**`, '', ...lines, '', ref(pr, headSha, scope)].join('\n') };
}

/** spec §Data "Proposal message shape": what changes (the title) · evidence
 * (quoting the founder's own ledger reasons where they exist) · what it
 * costs · what happens on each reaction. Evidence is not validated here —
 * "a proposal without evidence is a preference, not a proposal" is a
 * runner-prompt rule (docs/agents/runner-prompts/tree-weekly-plan.md), not
 * a build-time check, since evidence quality is a judgement call the LLM
 * planning run makes, not something this pure renderer can verify. */
function buildProposalMessage(proposal, n, total, pr, headSha) {
  const content = [
    `**Proposal ${n} of ${total} — ${proposal.title}**`,
    '',
    [proposal.evidence, proposal.cost].filter(Boolean).join(' '),
    '',
    proposal.onApprove,
    proposal.onReject,
    '',
    "React ✅ or ❌. Reply in the thread if it's neither.",
    ref(pr, headSha, `proposal:${n}`),
  ];
  return { content: content.join('\n') };
}

function buildQuestionsMessage(questions, pr, headSha) {
  const capped = (questions ?? []).slice(0, 2);
  const body = capped.length > 0 ? capped.map((q, i) => `${i + 1}. ${q}`) : ['No open questions this week.'];
  return {
    content: [
      '**Questions for you**',
      '',
      ...body,
      '',
      'Reply in the thread on any message above (or just reply to it) and I\'ll read it.',
      WEDNESDAY_CUTOFF_NOTE,
      ref(pr, headSha, 'questions'),
    ].join('\n'),
  };
}

/**
 * Pure builder. `plan`: `{ whatChangedAndWhy: string, calendar: {day,
 * text}[], proposals: {title, evidence, cost, onApprove, onReject}[],
 * questions: string[] }`. `scorecard`: the verbatim string
 * `renderScorecard()` already produces (never re-derived here — one source
 * of truth, spec: "Lines 1-3 are today's renderScorecard verbatim").
 * `pr`: `{ number, url }`. Caps proposals to 3 and questions to 2 (spec
 * "Up to three proposals" / "Up to two questions") even if the plan carries
 * more — a planning-time overrun is a runner-prompt bug, not a reason to
 * blow the message budget.
 */
export function buildWeeklyBrief(plan, scorecard, { headSha, pr } = {}) {
  if (!headSha) {
    throw new Error('buildWeeklyBrief: headSha is required — every brief message must carry a verifiable ref: line');
  }
  if (!pr?.number) {
    throw new Error('buildWeeklyBrief: pr.number is required');
  }

  const headerTitle = plan.weekOf ? `Tree's week of ${plan.weekOf}` : "Tree's week";
  const header = {
    content: [
      `**${headerTitle}**`,
      '',
      scorecard,
      '',
      plan.whatChangedAndWhy ?? '',
      '',
      'Proposals below are ✅/❌. Everything else here just records feedback — reply in the thread if you want to say more.',
      ref(pr, headSha, 'brief'),
    ].join('\n'),
  };

  const calendar = plan.calendar ?? [];
  const firstHalf = calendar.filter((s) => s.day <= 7);
  const secondHalf = calendar.filter((s) => s.day > 7);
  const calendarMessages = [
    buildCalendarMessage(firstHalf, 'The next 7 days (1-7)', 'calendar:1', pr, headSha),
    buildCalendarMessage(secondHalf, 'Days 8-14', 'calendar:2', pr, headSha),
  ];

  const proposals = (plan.proposals ?? []).slice(0, 3);
  const proposalMessages = proposals.map((p, i) => buildProposalMessage(p, i + 1, proposals.length, pr, headSha));

  const questionsMessage = buildQuestionsMessage(plan.questions, pr, headSha);

  return [header, ...calendarMessages, ...proposalMessages, questionsMessage];
}

/**
 * Thin sender — mirrors sendApprovalPrompt's webhook POST + chunking, minus
 * embeds (the brief carries no images). Returns delivered message ids per
 * built message index so a caller can construct the Discord permalink for
 * whichever one it needs (the workflow only needs the header's).
 */
export async function sendWeeklyBrief(messages, { webhook = process.env.SOCIAL_APPROVAL_WEBHOOK_URL, fetchImpl = fetch } = {}) {
  if (!webhook) return { status: 'unconfigured', delivered: [], failed: [] };

  const delivered = [];
  const failed = [];
  for (let m = 0; m < messages.length; m += 1) {
    const chunks = chunkPreservingRefLine(neutralizeMentions(messages[m].content), DISCORD_MESSAGE_LIMIT);
    for (let i = 0; i < chunks.length; i += 1) {
      try {
        const response = await fetchImpl(`${webhook}?wait=true`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            content: chunks[i],
            username: TREE_WEBHOOK_USERNAME,
            avatar_url: TREE_AVATAR_URL,
            allowed_mentions: { parse: [] },
          }),
        });
        if (!response.ok) throw new Error(`Discord weekly-brief delivery failed with HTTP ${response.status}`);
        const payload = await response.json();
        if (!payload?.id) throw new Error('Discord weekly-brief delivery returned no message id');
        delivered.push({ message: m, chunk: i, messageId: payload.id });
      } catch (err) {
        failed.push({ message: m, chunk: i, error: String(err?.message ?? err) });
      }
    }
  }
  return { status: failed.length === 0 ? 'delivered' : 'partial', delivered, failed };
}

/** `GET /webhooks/{id}/{token}` resolves both `channel_id` and `guild_id`
 * in one call (spec: "guildId comes from the same ... call that already
 * resolves channel_id") -- needed only for the permalink, so it is its own
 * function rather than folded into sendWeeklyBrief's per-chunk POST loop. */
export async function resolveWebhookContext(webhookUrl, { fetchImpl = fetch } = {}) {
  const response = await fetchImpl(webhookUrl.replace(/\/$/, ''));
  if (!response.ok) throw new Error(`could not resolve webhook -> channel/guild (${response.status})`);
  const data = await response.json();
  return { channelId: data.channel_id, guildId: data.guild_id };
}

export function discordPermalink({ guildId, channelId, messageId }) {
  return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
}

/**
 * `mode=replan` (spec §Data "The Wednesday cut-off"): "posts a short 'what
 * I changed' message in the existing brief's thread instead of a whole new
 * brief." Posted with Discord's `?thread_id=` webhook query param, so it
 * still needs only the plain webhook secret, never `DISCORD_BOT_TOKEN` --
 * the same authority-separation this whole job exists for (spec
 * §Mechanics: "never inside the agent job, never in the social
 * environment"). `threadId` is the original brief header message's own id
 * -- starting a Discord thread FROM a message reuses that message's id as
 * the thread's id.
 */
export async function sendReplanUpdate(summary, threadId, { webhook = process.env.SOCIAL_APPROVAL_WEBHOOK_URL, fetchImpl = fetch } = {}) {
  if (!webhook) return { status: 'unconfigured' };
  try {
    const response = await fetchImpl(`${webhook}?wait=true&thread_id=${threadId}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: neutralizeMentions(summary), username: TREE_WEBHOOK_USERNAME, avatar_url: TREE_AVATAR_URL, allowed_mentions: { parse: [] } }),
    });
    if (!response.ok) throw new Error(`Discord replan-update delivery failed with HTTP ${response.status}`);
    return { status: 'delivered' };
  } catch (err) {
    return { status: 'failed', error: String(err?.message ?? err) };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const flag = (name) => {
    const i = args.indexOf(`--${name}`);
    return i === -1 ? undefined : args[i + 1];
  };
  const replanThreadId = flag('replan-thread-id');
  const replanSummaryPath = flag('replan-summary');
  if (replanThreadId || replanSummaryPath) {
    if (!replanThreadId || !replanSummaryPath) {
      throw new Error('Usage: weekly-brief.mjs --replan-thread-id <id> --replan-summary <path-to-text-file>');
    }
    const summary = await readFile(replanSummaryPath, 'utf-8');
    const result = await sendReplanUpdate(summary, replanThreadId);
    if (result.status === 'failed') {
      console.error(`weekly-brief: replan update failed: ${result.error}`);
      return 1;
    }
    console.log(`weekly-brief: replan update ${result.status}.`);
    return;
  }

  const prNumber = flag('pr');
  const prUrl = flag('pr-url');
  const headSha = flag('head-sha');
  const planPath = flag('plan');
  if (!prNumber || !prUrl || !headSha || !planPath) {
    throw new Error('Usage: weekly-brief.mjs --pr <number> --pr-url <url> --head-sha <sha> --plan <path-to-plan.json>');
  }

  const plan = JSON.parse(await readFile(planPath, 'utf-8'));
  const scorecard = renderScorecard(buildScorecard());
  const messages = buildWeeklyBrief(plan, scorecard, { headSha, pr: { number: Number(prNumber), url: prUrl } });
  const result = await sendWeeklyBrief(messages);
  if (result.status === 'unconfigured') {
    console.log('weekly-brief: SOCIAL_APPROVAL_WEBHOOK_URL is not configured -- skipping (clean no-op).');
    return;
  }
  console.log(`weekly-brief: ${result.delivered.length} chunk(s) delivered, ${result.failed.length} failed.`);
  for (const f of result.failed) console.error(`weekly-brief: message ${f.message} chunk ${f.chunk} failed: ${f.error}`);
  if (result.failed.length > 0) return 1;

  const headerDelivery = result.delivered.find((d) => d.message === 0);
  if (headerDelivery) {
    const { channelId, guildId } = await resolveWebhookContext(process.env.SOCIAL_APPROVAL_WEBHOOK_URL);
    const permalink = discordPermalink({ guildId, channelId, messageId: headerDelivery.messageId });
    console.log(`weekly-brief: permalink ${permalink}`);
    if (process.env.GITHUB_OUTPUT) {
      const { appendFileSync } = await import('node:fs');
      appendFileSync(process.env.GITHUB_OUTPUT, `permalink=${permalink}\n`);
    }
  }
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'weekly-brief.mjs') {
  runMain(main, { name: 'weekly-brief' });
}
