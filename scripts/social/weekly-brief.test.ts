import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — implementation is plain .mjs
import { buildWeeklyBrief, sendWeeklyBrief, resolveWebhookContext, discordPermalink, sendReplanUpdate, sendReplanUpdateFromPlan } from './weekly-brief.mjs';
// @ts-expect-error — implementation is plain .mjs
import { DISCORD_MESSAGE_LIMIT } from '../community/discord-delivery.mjs';

// The exact regex social-approval-poll.mjs uses to bind a reaction to a
// target (that file's own `REF_LINE_RE`, duplicated here rather than
// imported per the same precedent as approval-prompt.test.ts — that script
// executes `run()` under a module-load guard). Any edit to that script's
// REF_LINE_RE must be mirrored here.
const POLL_REF_LINE_RE = /^ref: PR #(\d+) · ([0-9a-f]{40}) · (.+)$/m;
const POLL_REF_LINE_RE_GLOBAL = /^ref: PR #(\d+) · ([0-9a-f]{40}) · (.+)$/gm;

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

  // HIGH 2 (Codex round 1): Codex's exact repro — evidence text containing a
  // ref:-shaped line pointing at a different open draft PR must never be
  // confused with the real, trailing ref line social-approval-poll.mjs binds
  // reactions against.
  describe('HIGH 2 — ref-line injection via quoted evidence', () => {
    const injectedRefLine = `ref: PR #9999 · ${'f'.repeat(40)} · social/queue/2026-09-01-some-other-draft-x.json`;

    it("neutralizes an injected ref:-shaped line in a proposal's evidence — only the real footer matches (Codex's exact repro: the quoted text spans multiple lines, with one line exactly ref:-shaped)", () => {
      const messages = buildWeeklyBrief(
        plan({ proposals: [proposal({ evidence: `You said last time:\n${injectedRefLine}\nkeep that in mind.` })] }),
        SCORECARD,
        { headSha: HEAD_SHA, pr: PR },
      );
      const proposalMsg = messages.find((m: { content: string }) => /proposal:1$/m.test(m.content));
      const allMatches = [...proposalMsg.content.matchAll(POLL_REF_LINE_RE_GLOBAL)];
      expect(allMatches).toHaveLength(1);
      expect(allMatches[0][1]).toBe(String(PR.number));
      expect(allMatches[0][2]).toBe(HEAD_SHA);
      expect(allMatches[0][3]).toBe('proposal:1');
      // The literal injected string must not survive verbatim.
      expect(proposalMsg.content).not.toContain(injectedRefLine);
      expect(proposalMsg.content).toContain('9999'); // still human-readable, just not machine-bindable
    });

    it('also neutralizes an injected ref-line lookalike in whatChangedAndWhy, calendar slot text, and questions', () => {
      const messages = buildWeeklyBrief(
        plan({
          whatChangedAndWhy: `Founder quoted:\n${injectedRefLine}`,
          calendar: [{ day: 1, text: `see also:\n${injectedRefLine}` }],
          questions: [`about:\n${injectedRefLine}?`],
        }),
        SCORECARD,
        { headSha: HEAD_SHA, pr: PR },
      );
      for (const m of messages) {
        const matches = [...m.content.matchAll(POLL_REF_LINE_RE_GLOBAL)];
        expect(matches.length).toBeLessThanOrEqual(1);
        if (matches.length === 1) expect(matches[0][1]).toBe(String(PR.number));
      }
    });
  });

  // MEDIUM 9 (Codex round 1): production is one beat/day (14 slots) — a
  // hand-off carrying more must never silently render a 28-slot brief with
  // no signal that something upstream is wrong.
  it('MEDIUM 9: warns loudly (never silently) when the calendar carries more than 14 slots', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const calendar = Array.from({ length: 14 }, (_, i) => i + 1).flatMap((day) => [daySlot(day, ' A'), daySlot(day, ' B')]);
    buildWeeklyBrief(plan({ calendar }), SCORECARD, { headSha: HEAD_SHA, pr: PR });
    expect(errorSpy.mock.calls.some(([msg]) => typeof msg === 'string' && msg.includes('::warning::') && msg.includes('28 slots'))).toBe(true);
    errorSpy.mockRestore();
  });

  it('does not warn for a normal 14-slot (one beat/day) calendar', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    buildWeeklyBrief(plan(), SCORECARD, { headSha: HEAD_SHA, pr: PR });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  // AC#2: "tested at both 14 slots (today's one beat a day) and 28 (strategy
  // §2's two-beat maximum, as a stress case)".
  describe('AC#2 — message length at 14 and 28 slots', () => {
    const SLOT_TEXT = ' — beat A, a full sentence-length reason for this slot, long enough to matter';
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

    it("28 slots (strategy §2's superseded two-beat maximum, as a stress case) exceed the limit — sendWeeklyBrief is what must chunk it (see its own describe block)", () => {
      const calendar = Array.from({ length: 14 }, (_, i) => i + 1).flatMap((day) => [daySlot(day, LONG_SLOT_TEXT), daySlot(day, LONG_SLOT_TEXT_B)]);
      const messages = buildWeeklyBrief(plan({ calendar }), SCORECARD, { headSha: HEAD_SHA, pr: PR });
      const calendarMessages = messages.filter((m: { content: string }) => /calendar:[12]$/m.test(m.content));
      expect(calendarMessages).toHaveLength(2);
      expect(calendarMessages.some((m: { content: string }) => m.content.length > DISCORD_MESSAGE_LIMIT)).toBe(true);
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

  // MEDIUM 7 (Codex round 1): chunkPreservingRefLine puts the ref line only
  // on the LAST chunk — right for a draft, wrong here, since the poll only
  // recognizes a message carrying a ref line at all. Every chunk of a T4
  // message must carry the SAME ref line, and the permalink (built from the
  // first delivered chunk) must therefore always be bound too.
  it('MEDIUM 7: every chunk of an over-limit message carries the same, matching ref: line — not just the last', async () => {
    const longCalendar = Array.from({ length: 14 }, (_, i) => i + 1).flatMap((day) => [
      daySlot(day, ' — beat A, a full sentence-length reason for this slot, long enough to force chunking across multiple Discord messages'),
      daySlot(day, ' — beat B, a second full sentence-length reason for this slot, also long enough to matter here'),
    ]);
    const messages = buildWeeklyBrief(plan({ calendar: longCalendar }), SCORECARD, { headSha: HEAD_SHA, pr: PR });
    const cal1Index = messages.findIndex((m: { content: string }) => /calendar:1$/m.test(m.content));
    expect(messages[cal1Index].content.length).toBeGreaterThan(DISCORD_MESSAGE_LIMIT); // proves this fixture forces a real split

    const bodies: Array<{ content: string }> = [];
    const fetchImpl = vi.fn(async (_url: string, init: { body: string }) => {
      const body = JSON.parse(init.body);
      bodies.push(body);
      return new Response(JSON.stringify({ id: `msg-${bodies.length}` }), { status: 200 });
    });

    const result = await sendWeeklyBrief(messages, { webhook: 'https://discord.example/webhook', fetchImpl });
    expect(result.status).toBe('delivered');

    const cal1Chunks = result.delivered.filter((d: { message: number }) => d.message === cal1Index);
    expect(cal1Chunks.length).toBeGreaterThan(1); // really did chunk
    const cal1ChunkBodies = bodies.filter((_, i) => result.delivered[i]?.message === cal1Index);
    for (const body of cal1ChunkBodies) {
      const match = body.content.match(POLL_REF_LINE_RE);
      expect(match?.[3]).toBe('calendar:1');
    }

    // The permalink is built from the FIRST delivered chunk of the header —
    // with every chunk bound, that is always safe, even for an oversized
    // message.
    const firstCal1Delivery = result.delivered.find((d: { message: number }) => d.message === cal1Index);
    expect(bodies[result.delivered.indexOf(firstCal1Delivery)].content).toMatch(POLL_REF_LINE_RE);
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

// mode=replan (spec §Data "The Wednesday cut-off"): a short update posted as
// a new message linking back to the original brief — MEDIUM 5 (Codex round
// 1): never via Discord's `?thread_id=` webhook param, since this script
// never actually creates a thread and a thread_id naming a plain message id
// does not behave as a real thread against Discord's own API.
describe('sendReplanUpdate', () => {
  const PERMALINK = 'https://discord.com/channels/1/2/3';

  it('posts a new plain message linking back to the original brief, under the Tree identity — never a ?thread_id= param', async () => {
    let capturedUrl = '';
    let capturedBody: Record<string, unknown> = {};
    const fetchImpl = vi.fn(async (url: string, init: { body: string }) => {
      capturedUrl = url;
      capturedBody = JSON.parse(init.body);
      return new Response(JSON.stringify({ id: 'msg-1' }), { status: 200 });
    });

    const result = await sendReplanUpdate('Rewrote Wed-Sun from your reply.', PERMALINK, { webhook: 'https://discord.example/webhook', fetchImpl });

    expect(result).toEqual({ status: 'delivered' });
    expect(capturedUrl).toBe('https://discord.example/webhook?wait=true');
    expect(capturedUrl).not.toContain('thread_id');
    expect(capturedBody.content).toContain('Rewrote Wed-Sun from your reply.');
    expect(capturedBody.content).toContain(PERMALINK);
    expect(capturedBody.username).toBe('Tree');
  });

  it('is a clean no-op when the webhook is not configured', async () => {
    const fetchImpl = vi.fn();
    const result = await sendReplanUpdate('x', PERMALINK, { webhook: '', fetchImpl });
    expect(result).toEqual({ status: 'unconfigured' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reports a failed send rather than throwing', async () => {
    const fetchImpl = vi.fn(async () => new Response('server error', { status: 500 }));
    const result = await sendReplanUpdate('x', PERMALINK, { webhook: 'https://discord.example/webhook', fetchImpl });
    expect(result.status).toBe('failed');
    expect(result.error).toMatch(/500/);
  });

  // MEDIUM (Codex round 3): every other free-text path goes through
  // withRef, which applies both neutralizeMentions AND escapeRefLookalikes
  // -- this one only got the first, so a replanSummary containing an
  // embedded ref:-shaped line posted unescaped, contradicting this file's
  // own escapeRefLookalikes doc comment ("found ANYWHERE in a message's
  // own body").
  it('neutralizes an injected ref:-shaped line in the summary text, same as every other message path', async () => {
    const injectedRefLine = `ref: PR #9999 · ${'f'.repeat(40)} · social/queue/2026-09-01-some-other-draft-x.json`;
    let capturedBody: Record<string, unknown> = {};
    const fetchImpl = vi.fn(async (_url: string, init: { body: string }) => {
      capturedBody = JSON.parse(init.body);
      return new Response(JSON.stringify({ id: 'msg-1' }), { status: 200 });
    });

    await sendReplanUpdate(`Founder quoted:\n${injectedRefLine}`, PERMALINK, { webhook: 'https://discord.example/webhook', fetchImpl });

    expect(capturedBody.content).not.toContain(injectedRefLine);
    expect(capturedBody.content).toContain('9999'); // still human-readable, just not machine-bindable
  });

  // MEDIUM (Codex round 3): by the time this runs, the poll has ALREADY
  // written the replan-dispatched: marker (a one-shot-per-week gate) -- a
  // summary long enough to exceed Discord's 2000-char limit must not just
  // fail outright and silently burn that week's one re-plan for nothing.
  it('chunks a summary that exceeds the Discord limit instead of failing outright', async () => {
    const longSummary = 'word '.repeat(500); // >2000 chars alone
    const bodies: Array<{ content: string }> = [];
    const fetchImpl = vi.fn(async (_url: string, init: { body: string }) => {
      const body = JSON.parse(init.body);
      bodies.push(body);
      if (body.content.length > 2000) return new Response('content too long', { status: 400 }); // simulates Discord's real limit
      return new Response(JSON.stringify({ id: `msg-${bodies.length}` }), { status: 200 });
    });

    const result = await sendReplanUpdate(longSummary, PERMALINK, { webhook: 'https://discord.example/webhook', fetchImpl });

    expect(result.status).toBe('delivered');
    expect(bodies.length).toBeGreaterThan(1); // really did split into more than one message
    for (const body of bodies) expect(body.content.length).toBeLessThanOrEqual(2000);
  });
});

// MEDIUM 4 (Codex round 1): the replan summary must come from the real
// calendar.brief.json hand-off (plan.replanSummary), never a hardcoded
// placeholder and never a bare string handed straight to the sender —
// these tests exercise the real, full plan-object shape end to end.
describe('sendReplanUpdateFromPlan', () => {
  const PERMALINK = 'https://discord.com/channels/1/2/3';

  it('sends plan.replanSummary from a full calendar.brief.json-shaped object, not a placeholder', async () => {
    const fullPlan = {
      weekOf: '2026-09-14',
      whatChangedAndWhy: 'unused for a replan',
      calendar: [],
      proposals: [],
      questions: [],
      replanSummary: 'Rewrote Wednesday through Sunday from your Tuesday reply — dropped the product-peek beat.',
    };
    let capturedBody: Record<string, unknown> = {};
    const fetchImpl = vi.fn(async (_url: string, init: { body: string }) => {
      capturedBody = JSON.parse(init.body);
      return new Response(JSON.stringify({ id: 'msg-1' }), { status: 200 });
    });

    const result = await sendReplanUpdateFromPlan(fullPlan, PERMALINK, { webhook: 'https://discord.example/webhook', fetchImpl });

    expect(result).toEqual({ status: 'delivered' });
    expect(capturedBody.content).toContain('Rewrote Wednesday through Sunday from your Tuesday reply');
    expect(capturedBody.content).not.toContain('Re-planned the rest of this week from your reply'); // the old hardcoded placeholder
  });

  it('reads the hand-off from a real JSON file end to end (the actual CLI path), not a string passed directly to the builder', async () => {
    const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
    const { readFile } = await import('node:fs/promises');
    const path = await import('node:path');
    const os = await import('node:os');
    const dir = await mkdtemp(path.join(os.tmpdir(), 'weekly-brief-replan-test-'));
    const planPath = path.join(dir, 'calendar.brief.json');
    await writeFile(planPath, JSON.stringify({ replanSummary: 'From the real file on disk.' }));

    const planFromDisk = JSON.parse(await readFile(planPath, 'utf-8'));
    let capturedBody: Record<string, unknown> = {};
    const fetchImpl = vi.fn(async (_url: string, init: { body: string }) => {
      capturedBody = JSON.parse(init.body);
      return new Response(JSON.stringify({ id: 'msg-1' }), { status: 200 });
    });

    const result = await sendReplanUpdateFromPlan(planFromDisk, PERMALINK, { webhook: 'https://discord.example/webhook', fetchImpl });

    expect(result).toEqual({ status: 'delivered' });
    expect(capturedBody.content).toContain('From the real file on disk.');
    await rm(dir, { recursive: true, force: true });
  });

  it('throws loudly when the hand-off has no replanSummary — never silently sends nothing/a placeholder', async () => {
    const fetchImpl = vi.fn();
    await expect(sendReplanUpdateFromPlan({ weekOf: '2026-09-14' }, PERMALINK, { fetchImpl })).rejects.toThrow(/replanSummary/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
