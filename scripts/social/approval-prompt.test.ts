import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — implementation is plain .mjs
import { buildApprovalPrompt, sendApprovalPrompt } from './approval-prompt.mjs';
// @ts-expect-error — implementation is plain .mjs
import { DISCORD_MESSAGE_LIMIT } from '../community/discord-delivery.mjs';

function pr(overrides: Record<string, unknown> = {}) {
  return { number: 4100, url: 'https://github.com/JW-Incorporated/swift2/pull/4100', ...overrides };
}

function draft(overrides: Record<string, unknown> = {}) {
  return {
    file: 'social/queue/2026-09-12-shop-the-look-announce-x.json',
    platform: 'x',
    body: 'on this day in 2010: "mine" leaked early.',
    scheduledAt: '2026-09-11T15:00:00Z',
    campaign: 'thread:hidden-clues:origin-story:2026-09',
    mediaCredit: 'Photographer/Getty',
    media: ['/social/library/photos/example.jpg'],
    altText: ['Taylor Swift performing live in 2010, guitar in hand.'],
    why: 'sourcing explanation',
    sourceRoutine: 'growth-draft',
    ...overrides,
  };
}

// A fixed "now" so schedule-line assertions (in Xd Yh / OVERDUE) are stable.
const NOW = new Date('2026-09-11T09:00:00Z');

// The exact regex social-approval-poll.mjs uses to bind a reaction to a
// draft (that file's own `REF_LINE_RE`, duplicated here rather than
// imported — that script executes `run()` under a module-load guard and
// this test only needs to prove format compatibility, not exercise it).
// Any edit to that script's REF_LINE_RE must be mirrored here.
const POLL_REF_LINE_RE = /^ref: PR #(\d+) · ([0-9a-f]{40}) · (.+)$/m;

describe('buildApprovalPrompt', () => {
  it('every message still ends with a ref: line matching social-approval-poll.mjs\'s REF_LINE_RE (Tree identity line must not break this)', () => {
    const messages = buildApprovalPrompt(pr({ number: 4130 }), [draft(), draft({ platform: 'instagram', file: 'social/queue/x-ig.json' })], {
      now: NOW,
      headSha: 'c'.repeat(40),
    });
    for (const message of messages) {
      expect(message.content).toMatch(POLL_REF_LINE_RE);
    }
  });

  it('prefixes each draft message with the Tree identity line ("Tree · slot: ... · pillar: ...") without disturbing the ref: line', () => {
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft()], { now: NOW, headSha: 'abc123' });
    const lines = draftMsg.content.split('\n');
    expect(lines[0]).toBe('Tree · slot: 2026-09-11 15:00 UTC · pillar: thread:hidden-clues:origin-story');
    expect(draftMsg.content.trim().endsWith(`ref: PR #4100 · abc123 · ${'social/queue/2026-09-12-shop-the-look-announce-x.json'}`)).toBe(true);
  });

  it('falls back to "fast lane: <sourceRoutine>" for the Tree identity slot when scheduledAt is missing/invalid', () => {
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft({ scheduledAt: 'not-a-date', sourceRoutine: 'growth-draft' })], { now: NOW, headSha: 'abc123' });
    expect(draftMsg.content.split('\n')[0]).toBe('Tree · slot: fast lane: growth-draft · pillar: thread:hidden-clues:origin-story');
  });

  it('prefers `lane` over `sourceRoutine` for the Tree identity slot fast-lane label (Tree Overhaul T1)', () => {
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft({ scheduledAt: 'not-a-date', lane: 'merch', sourceRoutine: 'growth-draft' })], { now: NOW, headSha: 'abc123' });
    expect(draftMsg.content.split('\n')[0]).toBe('Tree · slot: fast lane: merch · pillar: thread:hidden-clues:origin-story');
  });

  it('header renders "Drafted by: calendar" (not "unknown") for a lane item — spec AC#6', () => {
    const messages = buildApprovalPrompt(pr(), [draft({ lane: 'calendar', sourceRoutine: undefined })], { now: NOW, headSha: 'abc123' });
    expect(messages[0].content).toContain('Drafted by: calendar');
  });

  it('the per-draft body\'s own "Drafted by:" line also prefers `lane` and always renders (reviewer catch, PR #4140 round 1)', () => {
    const [, withLane] = buildApprovalPrompt(pr(), [draft({ lane: 'merch', sourceRoutine: undefined })], { now: NOW, headSha: 'abc123' });
    expect(withLane.content).toContain('Drafted by: merch');

    // No lane AND no sourceRoutine (neither jq projection in
    // social-approval-notify.yml writes sourceRoutine any more) must still
    // render the line, not silently omit it as the old
    // `draft.sourceRoutine ? ... : null` conditional did.
    const [, withNeither] = buildApprovalPrompt(pr(), [draft({ lane: undefined, sourceRoutine: undefined })], { now: NOW, headSha: 'abc123' });
    expect(withNeither.content).toContain('Drafted by: unknown');
  });

  it('renders `pillar:` from `pillarOf(campaign)` for a real campaign, and "unspecified" for a null one (Tree Overhaul T2, spec AC#6)', () => {
    const [, real] = buildApprovalPrompt(pr(), [draft({ campaign: 'thread:hidden-clues:origin-story:2026-09' })], { now: NOW, headSha: 'abc123' });
    expect(real.content.split('\n')[0]).toBe('Tree · slot: 2026-09-11 15:00 UTC · pillar: thread:hidden-clues:origin-story');

    const [, nullCampaign] = buildApprovalPrompt(pr(), [draft({ campaign: null })], { now: NOW, headSha: 'abc123' });
    expect(nullCampaign.content.split('\n')[0]).toBe('Tree · slot: 2026-09-11 15:00 UTC · pillar: unspecified');
  });

  it('returns a header message plus one message per draft', () => {
    const messages = buildApprovalPrompt(pr(), [draft(), draft({ platform: 'instagram', file: 'social/queue/x-ig.json' })], { now: NOW, headSha: 'abc123' });
    expect(messages).toHaveLength(3);
    expect(messages[0].content).toContain('PR #4100');
    expect(messages[0].content).toContain('<https://github.com/JW-Incorporated/swift2/pull/4100>');
    expect(messages[0].content).toContain('2 drafts');
    expect(messages[0].embeds).toEqual([]);
  });

  it('includes account handle, schedule, length, caption, media URL, alt text, credit, why, campaign, and drafted-by', () => {
    const messages = buildApprovalPrompt(pr(), [draft()], { now: NOW, headSha: 'abc123', repo: 'JW-Incorporated/swift2' });
    const [, draftMsg] = messages;

    expect(draftMsg.content).toContain('Draft 1 · X — @longlivetscom');
    expect(draftMsg.content).toContain('Posts at:');
    expect(draftMsg.content).toMatch(/Length: .*\/ 280 weighted characters/);
    expect(draftMsg.content).toContain('on this day in 2010: "mine" leaked early.');
    expect(draftMsg.content).toContain('Image 1/1: https://www.longlivets.com/social/library/photos/example.jpg');
    expect(draftMsg.content).toContain('Alt text 1/1: "Taylor Swift performing live in 2010, guitar in hand."');
    expect(draftMsg.content).toContain('Credit: Photographer/Getty');
    expect(draftMsg.content).toContain('Why: sourcing explanation');
    expect(draftMsg.content).toContain('https://github.com/JW-Incorporated/swift2/blob/abc123/social/queue/2026-09-12-shop-the-look-announce-x.json');
    expect(draftMsg.content).toContain('Campaign: thread:hidden-clues:origin-story:2026-09');
    expect(draftMsg.content).toContain('Drafted by: growth-draft');
  });

  it('renders the critique rationale as the first paragraph, right after the header line, with no numeric scores shown (Tree Overhaul T2, spec AC#5)', () => {
    const rationale = "This is the Decode thread's origin-story beat: it teaches the one mechanic new followers don't get yet.";
    const critique = { v: 1, scores: { onStrategy: 5, onVoice: 4, specific: 5, mediaEarnsItsPlace: 4, notEmbarrassed: 5 }, total: 23, rationale, rulesChecked: [], revision: 1 };
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft({ critique })], { now: NOW, headSha: 'abc123' });
    const lines = draftMsg.content.split('\n');
    const headerIndex = lines.findIndex((l) => l.startsWith('**Draft'));

    expect(lines[headerIndex + 1]).toBe(rationale);
    expect(lines.findIndex((l) => l.startsWith('Posts at:'))).toBeGreaterThan(headerIndex + 1);
    expect(draftMsg.content).not.toMatch(/onStrategy|onVoice|mediaEarnsItsPlace|notEmbarrassed/i);
    expect(draftMsg.content).not.toMatch(/\b(total|score)\s*[:=]?\s*\d/i);
  });

  it('renders no rationale paragraph for a draft with no critique yet, rather than crashing', () => {
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft({ critique: undefined })], { now: NOW, headSha: 'abc123' });
    expect(draftMsg.content).toContain('Posts at:');
  });

  it('attaches an image embed built from the same MEDIA_BASE_URL/mediaUrlsFor helper as the poster, with the www host', () => {
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft()], { now: NOW, headSha: 'abc123' });
    expect(draftMsg.embeds).toEqual([{ image: { url: 'https://www.longlivets.com/social/library/photos/example.jpg' } }]);
  });

  it('emits an OVERDUE annotation instead of a bare timestamp for a past-due draft', () => {
    const overdueDraft = draft({ scheduledAt: '2026-09-10T08:00:00Z' }); // 25h before NOW
    const [, draftMsg] = buildApprovalPrompt(pr(), [overdueDraft], { now: NOW, headSha: 'abc123' });
    expect(draftMsg.content).toMatch(/OVERDUE by 25h/);
    expect(draftMsg.content).toContain('retired to failed/ at 48h');
  });

  it('emits a relative "in Xd Yh" annotation for a future draft, never a bare timestamp', () => {
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft({ scheduledAt: '2026-09-12T23:00:00Z' })], { now: NOW, headSha: 'abc123' });
    expect(draftMsg.content).toMatch(/Posts at: 2026-09-12 23:00 UTC \(in \d+d \d+h\)/);
  });

  it('adds the Facebook cross-post disclosure on an Instagram draft iff facebookCrosspost is true, never on X', () => {
    const igDraft = draft({ platform: 'instagram' });
    const withFb = buildApprovalPrompt(pr(), [igDraft], { now: NOW, headSha: 'abc123', facebookCrosspost: true });
    expect(withFb[1].content).toContain('Also publishes to: your Facebook Page — automatic, image 1 + this caption verbatim, same alt text.');

    const withoutFb = buildApprovalPrompt(pr(), [igDraft], { now: NOW, headSha: 'abc123', facebookCrosspost: false });
    expect(withoutFb[1].content).not.toContain('Also publishes to');

    const xWithFbFlag = buildApprovalPrompt(pr(), [draft({ platform: 'x' })], { now: NOW, headSha: 'abc123', facebookCrosspost: true });
    expect(xWithFbFlag[1].content).not.toContain('Also publishes to');
  });

  it('neutralizes broadcast mentions in an untrusted caption body', () => {
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft({ body: '@everyone check this out' })], { now: NOW, headSha: 'abc123' });
    expect(draftMsg.content).not.toContain('@everyone check');
  });

  it('escapes a caption body that itself contains a triple-backtick fence', () => {
    const [, draftMsg] = buildApprovalPrompt(pr(), [draft({ body: 'before ```danger``` after' })], { now: NOW, headSha: 'abc123' });
    expect(draftMsg.content).not.toMatch(/```\n?danger/);
  });

  it('requires headSha — every brief message must carry a verifiable ref: line (RULINGS-SOCIAL-2.md B1)', () => {
    expect(() => buildApprovalPrompt(pr(), [draft()], { now: NOW })).toThrow(/headSha is required/);
  });

  it('the header message ends with the machine-readable ref: line naming the PR, headSha, and "*" (RULINGS-SOCIAL-2.md B1)', () => {
    const [header] = buildApprovalPrompt(pr({ number: 4130 }), [draft()], { now: NOW, headSha: 'a'.repeat(40) });
    expect(header.content.trim().endsWith(`ref: PR #4130 · ${'a'.repeat(40)} · *`)).toBe(true);
  });

  it('each draft message ends with the machine-readable ref: line naming the PR, headSha, and its own file (RULINGS-SOCIAL-2.md B1)', () => {
    const [, draftMsg] = buildApprovalPrompt(pr({ number: 4130 }), [draft({ file: 'social/queue/2026-09-12-example-x.json' })], {
      now: NOW,
      headSha: 'b'.repeat(40),
    });
    expect(draftMsg.content.trim().endsWith(`ref: PR #4130 · ${'b'.repeat(40)} · social/queue/2026-09-12-example-x.json`)).toBe(true);
  });

  it('formats multiple drafts (the X+Instagram sibling pair) with distinct handles', () => {
    const messages = buildApprovalPrompt(
      pr(),
      [draft({ platform: 'x' }), draft({ platform: 'instagram', body: 'IG sibling body' })],
      { now: NOW, headSha: 'abc123' },
    );
    expect(messages[1].content).toContain('Draft 1 · X — @longlivetscom');
    expect(messages[2].content).toContain('Draft 2 · Instagram — @longlivetscom');
    expect(messages[2].content).toContain('IG sibling body');
  });
});

describe('sendApprovalPrompt', () => {
  it('sends each message as its own webhook POST and attaches embeds only to the last chunk of a message', async () => {
    const messages = buildApprovalPrompt(pr(), [draft()], { now: NOW, headSha: 'abc123' });
    const calls: unknown[] = [];
    const fetchImpl = vi.fn(async (_url: string, init: unknown) => {
      calls.push(init);
      return new Response(JSON.stringify({ id: `msg-${calls.length}`, embeds: [{ image: { url: 'x' } }] }), { status: 200 });
    });

    const result = await sendApprovalPrompt(messages, { webhook: 'https://discord.example/webhook', fetchImpl });

    expect(result.status).toBe('delivered');
    expect(result.delivered).toHaveLength(2); // header (no embed) + 1 draft message
    expect(result.embedsSent).toBe(1);
    expect(result.embedsAccepted).toBe(1);
    const bodies = calls.map((init) => JSON.parse(String((init as { body: string }).body)));
    expect(bodies[0].embeds).toBeUndefined(); // header carries no embed
    expect(bodies[1].embeds).toEqual([{ image: { url: 'https://www.longlivets.com/social/library/photos/example.jpg' } }]);
    for (const body of bodies) {
      expect(body.username).toBe('Tree');
      expect(body.avatar_url).toBe('https://www.longlivets.com/social/tree-avatar.png');
    }
  });

  it('chunks a long message at the Discord limit, attaching embeds only to the final chunk', async () => {
    const longBody = 'word '.repeat(500); // pushes one draft message over 2000 chars
    const messages = buildApprovalPrompt(pr(), [draft({ body: longBody })], { now: NOW, headSha: 'abc123' });
    expect(messages[1].content.length).toBeGreaterThan(DISCORD_MESSAGE_LIMIT);

    const bodies: Array<{ content: string; embeds?: unknown }> = [];
    const fetchImpl = vi.fn(async (_url: string, init: unknown) => {
      const body = JSON.parse(String((init as { body: string }).body));
      bodies.push(body);
      return new Response(JSON.stringify({ id: `msg-${bodies.length}`, embeds: body.embeds ?? [] }), { status: 200 });
    });

    const result = await sendApprovalPrompt(messages, { webhook: 'https://discord.example/webhook', fetchImpl });

    expect(result.status).toBe('delivered');
    expect(bodies.length).toBeGreaterThan(2); // header + at least 2 chunks of the draft message
    for (const body of bodies) expect(body.content.length).toBeLessThanOrEqual(DISCORD_MESSAGE_LIMIT);
    const withEmbeds = bodies.filter((b) => b.embeds?.length);
    expect(withEmbeds).toHaveLength(1); // only the LAST chunk of the draft message carries the embed
  });

  it('is a clean no-op when the webhook is not configured', async () => {
    const fetchImpl = vi.fn();
    const result = await sendApprovalPrompt([{ content: 'short content', embeds: [] }], { webhook: '', fetchImpl });

    expect(result).toEqual({ status: 'unconfigured', delivered: [], failed: [], embedsSent: 0, embedsAccepted: 0 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('isolates a failed chunk send — the rest still deliver', async () => {
    const messages = buildApprovalPrompt(pr(), [draft(), draft({ platform: 'instagram', file: 'x-ig.json' })], { now: NOW, headSha: 'abc123' });

    let call = 0;
    const fetchImpl = vi.fn(async (_url: string, init: unknown) => {
      call += 1;
      if (call === 2) return new Response('boom', { status: 500 });
      const body = JSON.parse(String((init as { body: string }).body));
      return new Response(JSON.stringify({ id: `msg-${call}`, embeds: body.embeds ?? [] }), { status: 200 });
    });

    const result = await sendApprovalPrompt(messages, { webhook: 'https://discord.example/webhook', fetchImpl });

    expect(result.status).toBe('partial');
    expect(result.failed).toEqual([{ message: 1, chunk: 0, error: expect.stringContaining('HTTP 500') }]);
    expect(result.delivered.length).toBeGreaterThan(0);
  });

  it('treats a Discord response reporting fewer embeds than sent as a failed chunk — the machine-verifiable half of "the image shows"', async () => {
    const messages = buildApprovalPrompt(pr(), [draft()], { now: NOW, headSha: 'abc123' });
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: 'msg-1', embeds: [] }), { status: 200 }));

    const result = await sendApprovalPrompt(messages, { webhook: 'https://discord.example/webhook', fetchImpl });

    expect(result.status).toBe('partial');
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].error).toContain('embeds.length=0');
  });
});
