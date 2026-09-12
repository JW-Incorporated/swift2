// Builds and sends Tree's Monday brief to #longlive-social (Tree Overhaul
// T4, docs/specs/tree-overhaul/t4-weekly-brief.md) — the same channel the
// founder already approves drafts in, instead of an email-only report.
// Mirrors approval-prompt.mjs's structure deliberately: a pure
// `buildWeeklyBrief` (everything worth testing) and a thin `sendWeeklyBrief`
// that reuses the exact same webhook/identity helpers approval-prompt.mjs
// already established — never reimplemented here.
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
//
// This file is only ever RUN from a trusted `main` checkout (never a plan
// PR's own branch) -- routine-tree-weekly-plan.yml's send-brief job holds
// the Discord webhook secret and must never execute a checkout of anything
// an agent-writable branch could have modified (Codex round-1 HIGH 1). The
// plan PR's own content (calendar.brief.json) reaches this script only as
// DATA, fetched by the workflow via the GitHub API, never by checking out
// that branch's code.
import { readFile } from 'node:fs/promises';
import { chunkForDiscord, neutralizeMentions, DISCORD_MESSAGE_LIMIT } from '../community/discord-delivery.mjs';
import { TREE_WEBHOOK_USERNAME, TREE_AVATAR_URL } from './approval-prompt.mjs';
import { buildScorecard, renderScorecard } from './weekly-scorecard.mjs';
import { runMain } from '../lib/cli.mjs';

const WEDNESDAY_CUTOFF_NOTE =
  "Reply before Wednesday 23:59 UTC and I'll re-plan the rest of this week; a later reply still counts, it just shapes next Monday instead.";

function ref(pr, headSha, scope) {
  return `ref: PR #${pr.number} · ${headSha} · ${scope}`;
}

const REF_LOOKALIKE_RE = /^ref: PR #\d+ · [0-9a-f]{40} · .+$/gm;

/** HIGH 2 (Codex round 1): a proposal's evidence quotes the founder's own
 * past words verbatim (spec's own design) — a founder pasting an old brief
 * back, or any other free text this builder renders, could contain
 * something ref-line-shaped. social-approval-poll.mjs must never be able
 * to confuse that for the real footer (which would misdirect a founder's
 * ✅ on a proposal into approving a completely different, unrelated draft
 * PR they never saw), so any ref:-shaped line found ANYWHERE in a
 * message's own body is neutralized — same zero-width-space technique
 * neutralizeMentions already uses for @everyone/@here — before the one
 * real, trailing ref line for THIS message is appended below it. */
function escapeRefLookalikes(text) {
  return String(text ?? '').replace(REF_LOOKALIKE_RE, (line) => line.replace(/^ref:/, 'ref​:'));
}

/** Joins `bodyLines`, neutralizes any injected ref-line lookalike in that
 * body, then appends the one real `refLine` — the only place a message's
 * content and its ref line are combined, so every builder below goes
 * through the same defense. */
function withRef(bodyLines, refLine) {
  const body = escapeRefLookalikes(bodyLines.filter((l) => l !== null && l !== undefined).join('\n'));
  return `${body}\n${refLine}`;
}

/** One calendar message: `**<label>**`, one `Day <n> — <text>` line per
 * slot (spec: "one line per slot with the reason it's there"), then the
 * ref line. `slots`: `{ day, text }[]`, already filtered to this message's
 * half. Production is one beat/day (14 slots total, spec's own Wave-1
 * correction) — a day carrying two entries is only ever exercised as
 * AC#2's explicit stress test, never the expected shape a real plan hands
 * this builder (see the >14-slot warning in buildWeeklyBrief below). */
function buildCalendarMessage(slots, label, scope, pr, headSha) {
  const lines = slots.length > 0 ? slots.map((s) => `Day ${s.day} — ${s.text}`) : ['Nothing new scheduled this half.'];
  return { content: withRef([`**${label}**`, '', ...lines], ref(pr, headSha, scope)) };
}

/** spec §Data "Proposal message shape": what changes (the title) · evidence
 * (quoting the founder's own ledger reasons where they exist) · what it
 * costs · what happens on each reaction. Evidence is not validated here —
 * "a proposal without evidence is a preference, not a proposal" is a
 * runner-prompt rule (docs/agents/runner-prompts/tree-weekly-plan.md), not
 * a build-time check, since evidence quality is a judgement call the LLM
 * planning run makes, not something this pure renderer can verify. */
function buildProposalMessage(proposal, n, total, pr, headSha) {
  const bodyLines = [
    `**Proposal ${n} of ${total} — ${proposal.title}**`,
    '',
    [proposal.evidence, proposal.cost].filter(Boolean).join(' '),
    '',
    proposal.onApprove,
    proposal.onReject,
    '',
    "React ✅ or ❌. Reply in the thread if it's neither.",
  ];
  return { content: withRef(bodyLines, ref(pr, headSha, `proposal:${n}`)) };
}

function buildQuestionsMessage(questions, pr, headSha) {
  const capped = (questions ?? []).slice(0, 2);
  const body = capped.length > 0 ? capped.map((q, i) => `${i + 1}. ${q}`) : ['No open questions this week.'];
  const bodyLines = ['**Questions for you**', '', ...body, '', "Reply in the thread on any message above (or just reply to it) and I'll read it.", WEDNESDAY_CUTOFF_NOTE];
  return { content: withRef(bodyLines, ref(pr, headSha, 'questions')) };
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
    content: withRef(
      [`**${headerTitle}**`, '', scorecard, '', plan.whatChangedAndWhy ?? '', '', 'Proposals below are ✅/❌. Everything else here just records feedback — reply in the thread if you want to say more.'],
      ref(pr, headSha, 'brief'),
    ),
  };

  const calendar = plan.calendar ?? [];
  // MEDIUM 9 (Codex round 1): production is one beat/day (14 slots) —
  // strategy §2's two-beat maximum is only ever a deliberate AC#2 stress
  // case, never a real plan's shape. A silent 28-slot brief from a
  // mis-shaped hand-off is exactly the "wrong content ships" failure mode
  // this whole epic keeps finding elsewhere; a loud warning replaces the
  // silent acceptance without hard-failing the stress test itself.
  if (calendar.length > 14) {
    console.error(
      `::warning::weekly-brief: plan.calendar carries ${calendar.length} slots — this design is one beat/day (14 slots over 2 messages); check social/calendar.md and the runner prompt if a two-beat day was genuinely intended.`,
    );
  }
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

const REF_LINE_TAIL_RE = /^ref: PR #\d+ · [0-9a-f]{40} · .+$/;

/** MEDIUM 7 (Codex round 1): approval-prompt.mjs's shared
 * `chunkPreservingRefLine` (lib/ref-line-chunk.mjs) puts the ref line on
 * only the LAST chunk of an over-limit message — correct for a draft
 * (only the last chunk is ever that target's mint source there), wrong
 * here: social-approval-poll.mjs only recognizes a message that carries a
 * ref line AT ALL, so a reaction or reply on an EARLIER chunk of an
 * oversized T4 message would be silently unbound, and a permalink built
 * from a message's first chunk could point founders at a message with no
 * binding whatsoever. Every chunk of a T4 message carries the SAME ref
 * line instead — this is a local function, not a change to the shared
 * ref-line-chunk.mjs, which approval-prompt.mjs's own draft/header path
 * still needs exactly as it was. social-approval-poll.mjs's groupPlanRefs
 * already unions reactions/replies across every message naming one scope
 * (the same shape a re-briefed draft already produces), so several bound
 * chunks for one scope is not a new case to handle. */
function chunkWithRefOnEveryChunk(content, limit) {
  const lines = content.split('\n');
  const lastLine = lines[lines.length - 1];
  if (!REF_LINE_TAIL_RE.test(lastLine)) return chunkForDiscord(content, limit);
  const body = lines.slice(0, -1).join('\n');
  const reserved = lastLine.length + 1; // +1 for the joining "\n" before the ref line
  const bodyChunks = chunkForDiscord(body, Math.max(1, limit - reserved));
  return bodyChunks.map((chunk) => `${chunk}\n${lastLine}`);
}

/**
 * Thin sender — mirrors sendApprovalPrompt's webhook POST, minus embeds
 * (the brief carries no images). Returns delivered message ids per built
 * message index so a caller can construct the Discord permalink for
 * whichever one it needs (the workflow only needs the header's — every
 * chunk is bound the same way, so the first chunk is always a safe pick).
 */
export async function sendWeeklyBrief(messages, { webhook = process.env.SOCIAL_APPROVAL_WEBHOOK_URL, fetchImpl = fetch } = {}) {
  if (!webhook) return { status: 'unconfigured', delivered: [], failed: [] };

  const delivered = [];
  const failed = [];
  for (let m = 0; m < messages.length; m += 1) {
    const chunks = chunkWithRefOnEveryChunk(neutralizeMentions(messages[m].content), DISCORD_MESSAGE_LIMIT);
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
 * I changed' message ... instead of a whole new brief." MEDIUM 5 (Codex
 * round 1): posted as a NEW plain channel message linking back to the
 * original brief's permalink, never via Discord's `?thread_id=` webhook
 * param — this script never actually creates a Discord thread (a thread a
 * FOUNDER starts themselves from a message is what
 * social-approval-poll.mjs's thread-reply ingestion reads; creating one
 * from OUR side needs a bot token with MANAGE_THREADS, which this job
 * must never hold — see the "never DISCORD_BOT_TOKEN" rule this whole
 * authority-separation exists for), so a `thread_id` naming a plain
 * message id is not a real thread and would not behave as intended
 * against Discord's actual API. A plain new message needs no special
 * permission and actually works.
 */
export async function sendReplanUpdate(summary, headerPermalink, { webhook = process.env.SOCIAL_APPROVAL_WEBHOOK_URL, fetchImpl = fetch } = {}) {
  if (!webhook) return { status: 'unconfigured' };
  const content = ['**Mid-week update on this week\'s plan**', '', neutralizeMentions(String(summary ?? '').trim()), '', `Original brief: ${headerPermalink}`].join('\n');
  try {
    const response = await fetchImpl(`${webhook}?wait=true`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content, username: TREE_WEBHOOK_USERNAME, avatar_url: TREE_AVATAR_URL, allowed_mentions: { parse: [] } }),
    });
    if (!response.ok) throw new Error(`Discord replan-update delivery failed with HTTP ${response.status}`);
    return { status: 'delivered' };
  } catch (err) {
    return { status: 'failed', error: String(err?.message ?? err) };
  }
}

/** MEDIUM 4 (Codex round 1): the summary comes from `plan.replanSummary` —
 * the SAME calendar.brief.json the agent already wrote and send-brief
 * already fetches as data (see routine-tree-weekly-plan.md step 10) —
 * never a hardcoded placeholder and never a second, parallel hand-off
 * file. Takes the parsed plan OBJECT (not a bare string) precisely so a
 * test exercising this proves the real hand-off file's shape works end to
 * end, not merely that sendReplanUpdate can post a string handed to it
 * directly. */
export async function sendReplanUpdateFromPlan(plan, headerPermalink, opts = {}) {
  const summary = plan?.replanSummary;
  if (!summary) {
    throw new Error('sendReplanUpdateFromPlan: plan.replanSummary is required for a mode=replan run — the agent must write it into calendar.brief.json (docs/agents/runner-prompts/tree-weekly-plan.md step 10)');
  }
  return sendReplanUpdate(summary, headerPermalink, opts);
}

async function main() {
  const args = process.argv.slice(2);
  const flag = (name) => {
    const i = args.indexOf(`--${name}`);
    return i === -1 ? undefined : args[i + 1];
  };
  const planPath = flag('plan');
  if (!planPath) {
    throw new Error('Usage: weekly-brief.mjs --plan <path-to-calendar.brief.json> (--replan-permalink <url> | --pr <number> --pr-url <url> --head-sha <sha>)');
  }
  const plan = JSON.parse(await readFile(planPath, 'utf-8'));

  const replanPermalink = flag('replan-permalink');
  if (replanPermalink) {
    const result = await sendReplanUpdateFromPlan(plan, replanPermalink);
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
  if (!prNumber || !prUrl || !headSha) {
    throw new Error('Usage: weekly-brief.mjs --pr <number> --pr-url <url> --head-sha <sha> --plan <path-to-plan.json>');
  }

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
