import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — implementation is plain .mjs
import { buildWeeklyBrief, sendWeeklyBrief, resolveWebhookContext, discordPermalink, sendReplanUpdate } from './weekly-brief.mjs';
// @ts-expect-error — implementation is plain .mjs
import { chunkPreservingRefLine } from './lib/ref-line-chunk.mjs';
// @ts-expect-error — implementation is plain .mjs
import { DISCORD_MESSAGE_LIMIT } from '../community/discord-delivery.mjs';

// The exact regex social-approval-poll.mjs uses to bind a reaction to a
// target (that file's own `REF_LINE_RE`, duplicated here rather than
// imported per the same precedent as approval-prompt.test.ts — that script
// executes `run()` under a module-load guard). Any edit to that script's
// REF_LINE_RE must be mirrored here.
const POLL_REF_LINE_RE = /^ref: PR #(\d+) · ([0-9a-f]{40}) · (.+)$/m;

const PR = { number: 4200, url: 'https://github.com/JW-Incorporated/swift2/pull/4200' };
const HEAD_SHA = 'a'.repeat(40);
const SCORECARD = '**Posts this week:** X 7 · IG 7 · FB 7 (21 total)\n**Follower change (7d, vs 2026-09-08):** IG +14 · X +2 · FB +0\n**Failed posts this week:** 0\n**Your verdicts:** 9 ✅ · 2 ✏️ · 1 ❌ — 25% needed a change from you\n**Time to your answer:** median 3h 10m, slowest 19h';

function daySlot(day: number, suffix = '') {
  return { day, text: `heartbeat:on-this-day — era deep-cut, X+IG pair${suffix}` };
}

function proposal(overrides: Record<string, unknown> = {}) {
  return {
    title: 'drop the product-peek heartbeat pillar',
    evidence: 'You rejected both product posts this month ("sounds like an ad", "we\'re not a shop").',
    cost: 'Product-peek is 1 of 5 heartbeat pillars, so dropping it costs ~3 slots a fortnight, which era-deep-cut absorbs.',
    onApprove: "If you ✅ this I'll rewrite the heartbeat rotation in docs/marketing/social-strategy.md and open it as a PR for you to merge.",
    onReject: 'If you ❌ it I\'ll keep the pillar and try a different angle on it.',
    ...overrides,
  };
}

function plan(overrides: Record<string, unknown> = {}) {
  return {
    weekOf: '2026-09-14',
    whatChangedAndWhy: "You rejected both product posts for sounding like ads, so I've dropped the product beat.",
    calendar: Array.from({ length: 14 }, (_, i) => daySlot(i + 1)),
    proposals: [proposal()],
    questions: ['Should the Mood beat come back next month?'],
    ...overrides,
  };
}

describe('buildWeeklyBrief', () => {
  it('requires headSha and pr.number — every brief message must carry a verifiable ref: line', () => {
    expect(() => buildWeeklyBrief(plan(), SCORECARD, { pr: PR })).toThrow(/headSha/);
    expect(() => buildWeeklyBrief(plan(), SCORECARD, { headSha: HEAD_SHA })).toThrow(/pr.number/);
  });

  it('AC#1: emits brief, calendar:1, calendar:2, proposal:1..n, questions in order, each with a well-formed ref: line', () => {
    const messages = buildWeeklyBrief(plan({ proposals: [proposal(), proposal({ title: 'add a Reddit beat' })] }), SCORECARD, { headSha: HEAD_SHA, pr: PR });
    const scopes = messages.map((m: { content: string }) => m.content.match(POLL_REF_LINE_RE)?.[3]);
    expect(scopes).toEqual(['brief', 'calendar:1', 'calendar:2', 'proposal:1', 'proposal:2', 'questions']);
    for (const m of messages) {
      const match = m.content.match(POLL_REF_LINE_RE);
      expect(match?.[1]).toBe(String(PR.number));
      expect(match?.[2]).toBe(HEAD_SHA);
    }
  });

  it('caps proposals at 3 and questions at 2 even when the plan carries more', () => {
    const messages = buildWeeklyBrief(
      plan({ proposals: [proposal(), proposal(), proposal(), proposal()], questions: ['one?', 'two?', 'three?'] }),
      SCORECARD,
      { headSha: HEAD_SHA, pr: PR },
    );
    const scopes = messages.map((m: { content: string }) => m.content.match(POLL_REF_LINE_RE)?.[3]);
    expect(scopes.filter((s: string) => s?.startsWith('proposal:'))).toEqual(['proposal:1', 'proposal:2', 'proposal:3']);
    const questionsMsg = messages.at(-1);
    expect(questionsMsg.content).toContain('1. one?');
    expect(questionsMsg.content).toContain('2. two?');
    expect(questionsMsg.content).not.toContain('three?');
  });

  it('the header carries the 5-line scorecard verbatim plus what-changed-and-why', () => {
    const [header] = buildWeeklyBrief(plan(), SCORECARD, { headSha: HEAD_SHA, pr: PR });
    expect(header.content).toContain(SCORECARD);
    expect(header.content).toContain("You rejected both product posts for sounding like ads");
  });

  it('an empty questions list renders "no open questions" rather than an empty section', () => {
    const messages = buildWeeklyBrief(plan({ questions: [] }), SCORECARD, { headSha: HEAD_SHA, pr: PR });
    expect(messages.at(-1).content).toContain('No open questions this week.');
  });

  it('proposal message shape: title, evidence+cost, both outcomes, and the react/reply line (spec §Data)', () => {
    const messages = buildWeeklyBrief(plan(), SCORECARD, { headSha: HEAD_SHA, pr: PR });
    const proposalMsg = messages.find((m: { content: string }) => m.content.includes('proposal:1'));
    expect(proposalMsg.content).toContain('**Proposal 1 of 1 — drop the product-peek heartbeat pillar**');
    expect(proposalMsg.content).toContain('You rejected both product posts this month');
    expect(proposalMsg.content).toContain('costs ~3 slots a fortnight');
    expect(proposalMsg.content).toContain("If you ✅ this I'll rewrite the heartbeat rotation");
    expect(proposalMsg.content).toContain("If you ❌ it I'll keep the pillar");
    expect(proposalMsg.content).toContain("React ✅ or ❌. Reply in the thread if it's neither.");
  });

  it('splits the calendar days 1-7 / 8-14 with one line per slot, not per day', () => {
    const messages = buildWeeklyBrief(plan(), SCORECARD, { headSha: HEAD_SHA, pr: PR });
    const cal1 = messages.find((m: { content: string }) => m.content.endsWith('calendar:1'));
    const cal2 = messages.find((m: { content: string }) => m.content.endsWith('calendar:2'));
    expect(cal1.content.match(/^Day \d+ —/gm)).toHaveLength(7);
    expect(cal2.content.match(/^Day \d+ —/gm)).toHaveLength(7);
    expect(cal1.content).toContain('Day 1 —');
    expect(cal2.content).toContain('Day 14 —');
  });

  // AC#2: "tested at both 14 slots (today's one beat a day) and 28 (strategy
  // §2's two-beat maximum, as a stress case)".
  describe('AC#2 — chunk limit at 14 and 28 slots', () => {
    const SLOT_TEXT = ' — beat A, a full sentence-length reason for this slot, long enough to matter';
    // Padded well past a realistic slot line so 14 of them in one message
    // reliably exceed Discord's 2000-char limit — a real stress case, not a
    // fixture that happens to pass without ever exercising chunking.
    const LONG_SLOT_TEXT =
      ' — beat A, a full sentence-length reason for this slot, padded further so this line alone is closer to two hundred characters wide, which is what fourteen of these in one message actually needs to force a chunk split';
    const LONG_SLOT_TEXT_B =
      ' — beat B, a second full sentence-length reason for this slot, padded further so this line alone is also closer to two hundred characters wide, matching beat A above it for the stress case';

    it("14 slots (today's one beat a day) fit each calendar message with room to spare, per spec — no chunking needed", () => {
      const calendar = Array.from({ length: 14 }, (_, i) => daySlot(i + 1, SLOT_TEXT));
      const messages = buildWeeklyBrief(plan({ calendar }), SCORECARD, { headSha: HEAD_SHA, pr: PR });
      const calendarMessages = messages.filter((m: { content: string }) => /calendar:[12]$/m.test(m.content));
      expect(calendarMessages).toHaveLength(2);
      for (const m of calendarMessages) expect(m.content.length).toBeLessThanOrEqual(DISCORD_MESSAGE_LIMIT);
    });

    it("28 slots (strategy §2's superseded two-beat maximum, as a stress case) still chunk further, ref: line intact on every calendar message", () => {
      const calendar = Array.from({ length: 14 }, (_, i) => i + 1).flatMap((day) => [daySlot(day, LONG_SLOT_TEXT), daySlot(day, LONG_SLOT_TEXT_B)]);
      const messages = buildWeeklyBrief(plan({ calendar }), SCORECARD, { headSha: HEAD_SHA, pr: PR });
      const calendarMessages = messages.filter((m: { content: string }) => /calendar:[12]$/m.test(m.content));
      expect(calendarMessages).toHaveLength(2);
      // Proves this fixture actually exercises multi-chunk splitting, not a
      // no-op pass-through under the limit.
      expect(calendarMessages.some((m: { content: string }) => m.content.length > DISCORD_MESSAGE_LIMIT)).toBe(true);
      for (const m of calendarMessages) {
        const chunks = chunkPreservingRefLine(m.content, DISCORD_MESSAGE_LIMIT);
        for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(DISCORD_MESSAGE_LIMIT);
        expect(chunks.some((c: string) => POLL_REF_LINE_RE.test(c))).toBe(true);
      }
    });
  });
});

describe('sendWeeklyBrief', () => {
  it('is a clean no-op when the webhook is not configured', async () => {
    const fetchImpl = vi.fn();
    const result = await sendWeeklyBrief([{ content: 'short content' }], { webhook: '', fetchImpl });
    expect(result).toEqual({ status: 'unconfigured', delivered: [], failed: [] });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('posts each message as its own webhook call under the Tree identity, returning delivered message ids', async () => {
    const messages = buildWeeklyBrief(plan(), SCORECARD, { headSha: HEAD_SHA, pr: PR });
    const bodies: Array<{ content: string; username: string; avatar_url: string }> = [];
    const fetchImpl = vi.fn(async (_url: string, init: { body: string }) => {
      const body = JSON.parse(init.body);
      bodies.push(body);
      return new Response(JSON.stringify({ id: `msg-${bodies.length}` }), { status: 200 });
    });

    const result = await sendWeeklyBrief(messages, { webhook: 'https://discord.example/webhook', fetchImpl });

    expect(result.status).toBe('delivered');
    expect(result.delivered).toHaveLength(messages.length);
    for (const body of bodies) {
      expect(body.username).toBe('Tree');
      expect(body.avatar_url).toContain('tree-avatar.png');
    }
  });

  it('chunks an over-limit message and isolates a failed chunk from the rest', async () => {
    const longCalendar = Array.from({ length: 14 }, (_, i) => i + 1).flatMap((day) => [
      daySlot(day, ' — beat A, a full sentence-length reason for this slot, long enough to force chunking'),
      daySlot(day, ' — beat B, a second full sentence-length reason for this slot, also long enough'),
    ]);
    const messages = buildWeeklyBrief(plan({ calendar: longCalendar }), SCORECARD, { headSha: HEAD_SHA, pr: PR });
    let call = 0;
    const fetchImpl = vi.fn(async (_url: string, init: { body: string }) => {
      call += 1;
      if (call === 2) return new Response('server error', { status: 500 });
      const body = JSON.parse(init.body);
      return new Response(JSON.stringify({ id: `msg-${call}`, content: body.content }), { status: 200 });
    });

    const result = await sendWeeklyBrief(messages, { webhook: 'https://discord.example/webhook', fetchImpl });

    expect(result.status).toBe('partial');
    expect(result.failed).toHaveLength(1);
    expect(result.delivered.length).toBeGreaterThan(0);
  });
});

describe('resolveWebhookContext / discordPermalink', () => {
  it('resolves channelId and guildId from the same GET /webhooks/{id}/{token} call, and builds the permalink', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ channel_id: '111', guild_id: '222' }), { status: 200 }));
    const context = await resolveWebhookContext('https://discord.com/api/webhooks/999/token', { fetchImpl });
    expect(context).toEqual({ channelId: '111', guildId: '222' });
    expect(discordPermalink({ ...context, messageId: '333' })).toBe('https://discord.com/channels/222/111/333');
  });

  it('throws loudly on a non-ok webhook resolution, never a silent guess', async () => {
    const fetchImpl = vi.fn(async () => new Response('not found', { status: 404 }));
    await expect(resolveWebhookContext('https://discord.com/api/webhooks/999/token', { fetchImpl })).rejects.toThrow(/404/);
  });
});

// mode=replan (spec §Data "The Wednesday cut-off"): a short update posted
// into the EXISTING thread, never a new brief — still only the webhook
// secret, never DISCORD_BOT_TOKEN.
describe('sendReplanUpdate', () => {
  it('posts into the given thread via the webhook\'s ?thread_id= query param, under the Tree identity', async () => {
    let capturedUrl = '';
    let capturedBody: Record<string, unknown> = {};
    const fetchImpl = vi.fn(async (url: string, init: { body: string }) => {
      capturedUrl = url;
      capturedBody = JSON.parse(init.body);
      return new Response(JSON.stringify({ id: 'msg-1' }), { status: 200 });
    });

    const result = await sendReplanUpdate('Rewrote Wed-Sun from your reply.', '555', { webhook: 'https://discord.example/webhook', fetchImpl });

    expect(result).toEqual({ status: 'delivered' });
    expect(capturedUrl).toBe('https://discord.example/webhook?wait=true&thread_id=555');
    expect(capturedBody.content).toBe('Rewrote Wed-Sun from your reply.');
    expect(capturedBody.username).toBe('Tree');
  });

  it('is a clean no-op when the webhook is not configured', async () => {
    const fetchImpl = vi.fn();
    const result = await sendReplanUpdate('x', '555', { webhook: '', fetchImpl });
    expect(result).toEqual({ status: 'unconfigured' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reports a failed send rather than throwing', async () => {
    const fetchImpl = vi.fn(async () => new Response('server error', { status: 500 }));
    const result = await sendReplanUpdate('x', '555', { webhook: 'https://discord.example/webhook', fetchImpl });
    expect(result.status).toBe('failed');
    expect(result.error).toMatch(/500/);
  });
});
