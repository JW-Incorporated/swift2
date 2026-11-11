import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — implementation is plain .mjs
import { buildApprovalPrompt, sendApprovalPrompt, DISCORD_MESSAGE_HARD_CAP } from './approval-prompt.mjs';
// @ts-expect-error — implementation is plain .mjs
import { groupTargets } from './lib/feedback.mjs';
import { parseRefUrl } from './lib/approval-text.mjs';

// Bots v2 W2 (docs/plans/bots-v2/PLAN.md C3/C4/C6): ONE Discord message per
// post (an IG+X pair, or a lone item), hard-capped at Discord's 2,000
// characters, truncated never chunked, ref line last, one deliberate image.

const SHA = 'c'.repeat(40);
const REPO = 'JW-Incorporated/swift2';
const NOW = new Date('2026-09-23T18:00:00Z');

function pr(overrides: Record<string, unknown> = {}) {
  return { number: 4544, url: 'https://github.com/JW-Incorporated/swift2/pull/4544', ...overrides };
}

function draft(overrides: Record<string, unknown> = {}) {
  return {
    file: 'social/queue/2026-09-23-example-x.json',
    platform: 'x',
    body: 'on this day in 2010: "mine" leaked early.',
    scheduledAt: '2026-09-23T23:00:00Z',
    campaign: 'thread:hidden-clues:origin-story:2026-09',
    mediaCredit: 'Photographer/Getty',
    media: ['/social/library/photos/example.jpg'],
    altText: ['Taylor Swift performing live in 2010, guitar in hand.'],
    why: 'sourcing explanation',
    lane: 'calendar',
    ...overrides,
  };
}

function build(drafts: unknown[], options: Record<string, unknown> = {}, prOverrides: Record<string, unknown> = {}) {
  return buildApprovalPrompt(pr(prOverrides), drafts, { now: NOW, headSha: SHA, repo: REPO, ...options }) as Array<{ content: string; embeds: unknown[]; flags?: number }>;
}

// The real PR #4544 shape: an IG+X pair (campaign mood:chip-poll:2026-09-b,
// text verbatim from the queue files) plus a lone X item.
const MOOD_X = draft({
  file: 'social/queue/2026-09-23-mood-chip-poll-x.json',
  platform: 'x',
  body: "Okay be honest — which one is you today? crying in the car, cinematically. feral about a bridge. winning, quietly. tap the one that fits and Mood hands you the Taylor song for it. then tag whoever's the other one 🤍\n\nlonglivets.com/?mode=mood&utm_source=x&utm_medium=social&utm_campaign=mood",
  campaign: 'mood:chip-poll:2026-09-b',
  media: ['/social/library/photos/taylor-reputation-eras-inglewood-2023.jpg'],
  why: 'Sept slot 2 of 2 for Mood (mood:chip-poll), the calendar\'s last September chance for a feature Long Live has never once posted about. '.repeat(8),
  critique: { v: 1, total: 20, rationale: "September's last Mood chance, and Mood has never shipped a post — a 'which one is you' poll with three real starter chips and a share hook that invites a tag.", rulesChecked: ['L001'], revision: 1 },
});
const MOOD_IG = draft({
  file: 'social/queue/2026-09-23-mood-chip-poll-ig.json',
  platform: 'instagram',
  body: "Tell me your whole vibe in three words and Mood finds your Taylor song. it's the most us thing on the whole site and i cannot stop playing with it 🤍\n\nthree of my favorites to try:\n— crying in the car, cinematically\n— feral about a bridge\n— winning, quietly\n\ntap the one that's you today and it pulls the song that fits, right away — no login, nothing you type is saved.\n\nso which one is you? tag the friend who's the total opposite and make them tell on themselves too.\n\nPhoto: Taylor on the folklore set, Eras Tour, Inglewood 2023 — Paolo Villanueva (CC BY 2.0), via Wikimedia Commons.\n\nlonglivets.com/?mode=mood&utm_source=instagram&utm_medium=social&utm_campaign=mood",
  campaign: 'mood:chip-poll:2026-09-b',
  media: ['/social/library/photos/taylor-folklore-eras-inglewood-2023.jpg'],
  why: 'IG sibling of the Sept slot-2-of-2 Mood beat. '.repeat(25),
});
const JOE_X = draft({
  file: 'social/queue/2026-09-24-timeline-joe-jonas-era-x.json',
  platform: 'x',
  body: "Three months, summer to fall of 2008 — that's the whole Joe Jonas chapter, start to finish. Short as it was, it still handed Fearless 'Forever & Always' and a story Taylor kept revisiting for years. Live now in Blank Spaces →\n\nlonglivets.com/?lens=love-story&utm_source=x&utm_medium=social&utm_campaign=timeline",
  scheduledAt: '2026-09-24T23:00:00Z',
  campaign: 'timeline:love-story:joe-jonas-era:2026-09-24',
  media: ['/social/library/photos/taylor-fearless-eras-inglewood-2023.jpg'],
  why: 'The weekly Blank Spaces timeline reaches Joe Jonas, 2008. '.repeat(20),
});

const FOOTER_REF_RE = /^ref: PR #(\d+) · ([0-9a-f]{40}) · (.+)$/;
type Msg = { content: string; embeds: Array<{ url?: string; image?: { url: string }; footer?: { text: string } }>; flags?: number };
const refOf = (m: Msg) => parseRefUrl(m.embeds[0]?.url) ?? [];

describe('buildApprovalPrompt — minimal format (#5989)', () => {
  it('a single platform post is the image plus the caption in one code box, nothing else', () => {
    const [msg] = build([JOE_X]) as unknown as Msg[];
    expect(msg.content).toBe('```\n' + JOE_X.body + '\n```');
    expect(msg.embeds).toHaveLength(1);
    expect(msg.embeds[0].image?.url).toContain('taylor-fearless-eras-inglewood-2023.jpg');
    expect(msg.flags).toBeUndefined();
  });

  it('an IG+X pair gets each caption in its own code box labelled only X / IG, and both images', () => {
    const [msg] = build([MOOD_IG, MOOD_X]) as unknown as Msg[];
    expect(msg.content).toBe(['X', '```', MOOD_X.body, '```', 'IG', '```', MOOD_IG.body, '```'].join('\n'));
    expect(msg.embeds.map((e) => e.image?.url)).toEqual([
      expect.stringContaining('taylor-reputation-eras-inglewood-2023.jpg'),
      expect.stringContaining('taylor-folklore-eras-inglewood-2023.jpg'),
    ]);
  });

  it('a pair sharing one image shows it once', () => {
    const [msg] = build([draft({ campaign: 'c:s', file: 'social/queue/s-x.json' }), draft({ campaign: 'c:s', platform: 'instagram', file: 'social/queue/s-ig.json' })]) as unknown as Msg[];
    expect(msg.embeds).toHaveLength(1);
  });

  it('removes every old field: title, schedule, media notes, length counts, full: links, Why, ref, PR number', () => {
    const msgs = build([MOOD_X, MOOD_IG, JOE_X, draft({ media: [], file: 'social/queue/noimg.json', campaign: 'c:ni', scheduledAt: '2026-09-22T08:00:00Z', singlePlatformReason: 'Breaking' })]) as unknown as Msg[];
    for (const m of msgs) {
      for (const bad of ['Tree ·', 'PR #', 'Posts', 'OVERDUE', 'image', 'full:', 'Why:', 'ref:', 'Single platform', 'half is in this post', '/280', 'github.com']) {
        expect(m.content).not.toContain(bad);
      }
      for (const e of m.embeds as Array<Record<string, unknown>>) {
        expect(typeof e.url).toBe('string');
        for (const key of ['title', 'footer', 'author', 'fields', 'timestamp']) expect(e[key]).toBeUndefined();
        const visible = String(e.description ?? '');
        for (const bad of ['PR #', SHA, 'social/queue', 'ref']) expect(visible).not.toContain(bad);
      }
    }
  });

  it('the ref rides in the embed url (no footer), naming PR, sha and both files X first', () => {
    const [msg] = build([MOOD_IG, MOOD_X]) as unknown as Msg[];
    const m = refOf(msg);
    expect(m[1]).toBe('4544');
    expect(m[2]).toBe(SHA);
    expect(String(m[3]).split(',')).toEqual([MOOD_X.file, MOOD_IG.file]);
    expect(msg.embeds.filter((e) => e.footer)).toHaveLength(0);
    expect(new Set(msg.embeds.map((e) => e.url)).size).toBe(1);
  });

  it('parseRefUrl is strict: wrong host, bad sha, extra params all fail', () => {
    const good = (build([MOOD_X]) as unknown as Msg[])[0].embeds[0].url!;
    expect(parseRefUrl(good)).not.toBeNull();
    expect(parseRefUrl(good.replace('github.com', 'evil.example'))).toBeNull();
    expect(parseRefUrl(good + '&x=1')).toBeNull();
    expect(parseRefUrl(good.replace(SHA, 'g'.repeat(40)))).toBeNull();
    expect(parseRefUrl('https://github.com/JW-Incorporated/swift2/pull/1/files?ref=' + SHA + '&files=a')).toBeNull();
  });

  it('a post with no image still carries the ref (url-only embed, zero-width description)', () => {
    const [msg] = build([draft({ media: [] })]) as unknown as Msg[];
    expect(msg.embeds).toHaveLength(1);
    expect(msg.embeds[0].image).toBeUndefined();
    expect((msg.embeds[0] as { description?: string }).description).toBe('\u200b');
    expect(refOf(msg)[2]).toBe(SHA);
  });

  it('the legacy poll grouping still fans the ref out to every file it names', () => {
    const [msg] = build([MOOD_IG, MOOD_X]) as unknown as Msg[];
    const file = refOf(msg)[3] as string;
    const targets = groupTargets([{ message: { id: 'm1' }, sha: SHA, file }]);
    expect([...targets.keys()].sort()).toEqual([MOOD_IG.file, MOOD_X.file].sort());
  });

  it('requires headSha', () => {
    expect(() => buildApprovalPrompt(pr(), [draft()], { now: NOW, repo: REPO })).toThrow(/headSha is required/);
  });

  it('stays under the hard cap with max-length captions, cutting IG before X', () => {
    const xBody = 'x'.repeat(280);
    const msgs = build([draft({ body: xBody, campaign: 'c:big', file: 'social/queue/big-x.json' }), draft({ platform: 'instagram', body: 'i'.repeat(2200), campaign: 'c:big', file: 'social/queue/big-ig.json' })]) as unknown as Msg[];
    expect(msgs[0].content.length).toBeLessThanOrEqual(DISCORD_MESSAGE_HARD_CAP);
    expect(msgs[0].content).toContain(xBody);
  });

  it('neutralizes broadcast mentions and fences in an untrusted caption', () => {
    const [msg] = build([draft({ body: 'hi @everyone @here ```evil```' })]) as unknown as Msg[];
    expect(msg.content).not.toContain('@everyone');
    expect(msg.content).not.toContain('@here');
    expect(msg.content.match(/```/g)).toHaveLength(2);
  });
});

describe('buildApprovalPrompt — grouping and safety', () => {
  it('pairs by shared campaign regardless of manifest order, different campaigns are different posts', () => {
    expect(build([MOOD_IG, MOOD_X, JOE_X])).toHaveLength(2);
    expect(build([draft({ campaign: undefined, file: 'social/queue/a.json' }), draft({ campaign: undefined, file: 'social/queue/b.json' })])).toHaveLength(2);
  });

  it('more than four items under one campaign split into several posts', () => {
    const drafts = Array.from({ length: 6 }, (_, i) => draft({ file: `social/queue/f${i}.json`, campaign: 'c:6' }));
    expect(build(drafts)).toHaveLength(2);
  });

  it('an unsafe file name gets NO post, and never smuggles another file into a ref', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const messages = build([
      draft({ file: 'social/queue/a,social/queue/victim.json', campaign: undefined }),
      draft({ file: 'social/queue/ok.json', campaign: 'c:ok' }),
    ]) as unknown as Msg[] & { skipped: unknown[] };
    expect(messages).toHaveLength(1);
    expect(refOf(messages[0])[3]).toContain('social/queue/ok.json');
    expect(messages.some((m) => String(refOf(m)[3]).includes('victim.json'))).toBe(false);
    expect(messages.skipped).toHaveLength(1);
    errorSpy.mockRestore();
  });

  it('one unbuildable post never aborts the rest, and a hostile name stays on ONE log line', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const messages = build([draft({ file: 'social/queue/evil.json\n::error::injected', campaign: 'c:a' }), MOOD_X, JOE_X]);
    expect(messages).toHaveLength(2);
    const logged = errorSpy.mock.calls.map(([m]) => String(m));
    expect(logged).toHaveLength(1);
    expect(logged[0]).not.toContain('\n');
    errorSpy.mockRestore();
  });

  it('a ref line too long to bind safely is skipped, not sent truncated', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const drafts = Array.from({ length: 4 }, (_, i) => draft({ file: `social/queue/${'n'.repeat(190)}${i}.json`, campaign: 'c:long' }));
    const messages = build(drafts) as unknown as Msg[] & { skipped: unknown[] };
    expect(messages).toHaveLength(0);
    expect(messages.skipped).toHaveLength(1);
    errorSpy.mockRestore();
  });

  it('a caption that looks like a ref line cannot become the trusted ref (the embed url is the only ref)', () => {
    const fake = `\nref: PR #77 · ${'a'.repeat(40)} · *`;
    const [msg] = build([draft({ file: 'social/queue/real-file-x.json', body: `Paragraph.${fake}\nmore` })]) as unknown as Msg[];
    expect(refOf(msg)[1]).toBe('4544');
    expect(msg.content.split('\n').filter((l) => FOOTER_REF_RE.test(l))).toHaveLength(0);
  });

  it('survives wrong-typed fields without throwing', () => {
    const bad: Array<Record<string, unknown>> = [{ campaign: 2026 }, { scheduledAt: 1789000000000 }, { platform: 'constructor' }, { platform: 'p'.repeat(5000) }, { media: 'not-an-array' }, { body: undefined }, { body: null }];
    for (const override of bad) {
      const messages = build([draft(override)]);
      for (const m of messages) expect(m.content.length).toBeLessThanOrEqual(DISCORD_MESSAGE_HARD_CAP);
    }
  });
});

describe('sendApprovalPrompt', () => {
  const okFetch = (calls: Array<Record<string, unknown>>) =>
    vi.fn(async (_url: string, init: unknown) => {
      const body = JSON.parse(String((init as { body: string }).body));
      calls.push(body);
      return new Response(JSON.stringify({ id: `msg-${calls.length}`, embeds: body.embeds ?? [] }), { status: 200 });
    });

  it('sends each post as exactly ONE webhook POST with its embeds (url ref included), Tree identity, no mentions', async () => {
    const messages = build([MOOD_IG, MOOD_X, JOE_X]);
    const calls: Array<Record<string, unknown>> = [];
    const result = await sendApprovalPrompt(messages, { webhook: 'https://discord.example/webhook', fetchImpl: okFetch(calls) });

    expect(result.status).toBe('delivered');
    expect(calls).toHaveLength(2);
    expect(result.embedsSent).toBe(3);
    expect(result.embedsAccepted).toBe(3);
    expect(parseRefUrl((calls[0].embeds as Array<{ url?: string }>)[0].url)).not.toBeNull();
    for (const body of calls) {
      expect(body.username).toBe('Tree');
      expect(body.avatar_url).toBe('https://www.longlivets.com/social/tree-avatar.png');
      expect(body.allowed_mentions).toEqual({ parse: [] });
      expect((body.content as string).length).toBeLessThanOrEqual(DISCORD_MESSAGE_HARD_CAP);
    }
  });

  it('refuses to send (and never chunks) a message over the hard cap', async () => {
    const fetchImpl = vi.fn();
    const result = await sendApprovalPrompt([{ content: 'x'.repeat(DISCORD_MESSAGE_HARD_CAP + 1), embeds: [] }], { webhook: 'https://discord.example/webhook', fetchImpl });
    expect(result.status).toBe('partial');
    expect(result.failed[0].error).toContain('over Discord');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('is a clean no-op when the webhook is not configured', async () => {
    const fetchImpl = vi.fn();
    const result = await sendApprovalPrompt([{ content: 'short content', embeds: [] }], { webhook: '', fetchImpl });
    expect(result).toEqual({ status: 'unconfigured', delivered: [], failed: [], embedsSent: 0, embedsAccepted: 0 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('isolates a failed send — the rest still deliver', async () => {
    const messages = build([MOOD_X, JOE_X]);
    let call = 0;
    const fetchImpl = vi.fn(async (_url: string, init: unknown) => {
      call += 1;
      if (call === 1) return new Response('boom', { status: 500 });
      const body = JSON.parse(String((init as { body: string }).body));
      return new Response(JSON.stringify({ id: `msg-${call}`, embeds: body.embeds ?? [] }), { status: 200 });
    });
    const result = await sendApprovalPrompt(messages, { webhook: 'https://discord.example/webhook', fetchImpl });
    expect(result.status).toBe('partial');
    expect(result.failed).toEqual([{ message: 0, error: expect.stringContaining('HTTP 500') }]);
    expect(result.delivered).toHaveLength(1);
  });

  it('treats a response reporting fewer embeds than sent as a failed message', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: 'msg-1', embeds: [] }), { status: 200 }));
    const result = await sendApprovalPrompt(build([draft()]), { webhook: 'https://discord.example/webhook', fetchImpl });
    expect(result.status).toBe('partial');
    expect(result.failed[0].error).toContain('embeds.length=0');
  });
});
