import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — implementation is plain .mjs
import { buildApprovalPrompt, sendApprovalPrompt, DISCORD_MESSAGE_HARD_CAP } from './approval-prompt.mjs';
// @ts-expect-error — implementation is plain .mjs
import { groupTargets } from './lib/feedback.mjs';

// Bots v2 W2 (docs/plans/bots-v2/PLAN.md C3/C4/C6): ONE Discord message per
// post (an IG+X pair, or a lone item), hard-capped at Discord's 2,000
// characters, truncated never chunked, ref line last, one deliberate image.

const SHA = 'c'.repeat(40);
const REPO = 'JW-Incorporated/swift2';
const NOW = new Date('2026-09-23T18:00:00Z');
// social-approval-poll.mjs's REF_LINE_RE, duplicated (that script runs under a
// module-load guard). Any edit to the poll's must be mirrored here.
const POLL_REF_LINE_RE = /^ref: PR #(\d+) · ([0-9a-f]{40}) · (.+)$/m;

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

function assertEveryMessageIsSafe(messages: Array<{ content: string }>) {
  for (const m of messages) {
    expect(m.content.length).toBeLessThanOrEqual(DISCORD_MESSAGE_HARD_CAP);
    const lines = m.content.split('\n');
    expect(lines[lines.length - 1]).toMatch(new RegExp(POLL_REF_LINE_RE.source));
    expect(m.content.match(new RegExp(POLL_REF_LINE_RE.source, 'gm'))).toHaveLength(1);
    // no bare URL can unfurl: every http(s) URL is wrapped in <…> or inside a ``` fence
    const outsideFences = m.content.replace(/```[\s\S]*?```/g, '');
    for (const match of outsideFences.matchAll(/https?:\/\//g)) {
      expect(outsideFences[(match.index ?? 0) - 1]).toBe('<');
    }
  }
}

describe('buildApprovalPrompt — one message per post (Bots v2 C3)', () => {
  it('PR #4544 shape: the IG+X pair is ONE message, the lone X is another — two messages, no header, none over 2,000', () => {
    const messages = build([MOOD_IG, MOOD_X, JOE_X]);
    expect(messages).toHaveLength(2);
    assertEveryMessageIsSafe(messages);
    expect(messages[0].content).toContain('PR #4544');
    expect(messages.some((m) => /Social approval needed|Draft \d/.test(m.content))).toBe(false);
  });

  it('the pair message carries X in full, the IG caption trimmed with a <link> to the full draft, the schedule, a one-line why, and ref LAST naming both files', () => {
    const [pair] = build([MOOD_IG, MOOD_X, JOE_X]);
    expect(pair.content).toContain(MOOD_X.body); // X in full, verbatim
    expect(pair.content).toContain('Tell me your whole vibe in three words'); // IG opens the same
    expect(pair.content).not.toContain('longlivets.com/?mode=mood&utm_source=instagram'); // …but is trimmed
    expect(pair.content).toContain('…');
    expect(pair.content).toContain(`<https://github.com/${REPO}/blob/${SHA}/social/queue/2026-09-23-mood-chip-poll-ig.json>`);
    expect(pair.content).toMatch(/Posts: 2026-09-23 23:00 UTC \(in 5h\)/);
    expect(pair.content).toContain("Why: September's last Mood chance");
    expect(pair.content).not.toContain('Sept slot 2 of 2'); // the long `why` is not used when a critique rationale exists
    const ref = pair.content.match(POLL_REF_LINE_RE)!;
    expect(ref[3]).toBe('social/queue/2026-09-23-mood-chip-poll-x.json,social/queue/2026-09-23-mood-chip-poll-ig.json');
  });

  it('the IG caption preview is about 350 characters, not the full caption', () => {
    const long = `${'a fan paragraph that keeps going. '.repeat(70)}END`;
    const [msg] = build([draft({ platform: 'instagram', body: long, file: 'social/queue/ig.json' })]);
    const fenced = msg.content.split('```')[1];
    expect(fenced.length).toBeLessThanOrEqual(360);
    expect(fenced.length).toBeGreaterThan(300);
    expect(msg.content).not.toContain('END');
  });

  it('exactly ONE deliberate image: an explicit embed of the first image, via the poster\'s own host helper — and flags stay unset so the embed shows', () => {
    const [pair, lone] = build([MOOD_IG, MOOD_X, JOE_X]);
    expect(pair.embeds).toEqual([{ image: { url: 'https://www.longlivets.com/social/library/photos/taylor-reputation-eras-inglewood-2023.jpg' } }]);
    expect(lone.embeds).toEqual([{ image: { url: 'https://www.longlivets.com/social/library/photos/taylor-fearless-eras-inglewood-2023.jpg' } }]);
    expect(pair.flags).toBeUndefined();
    expect(pair.content).not.toContain('longlivets.com/social/library'); // the image URL is never printed (no unfurl, no clutter)
    expect(pair.content).toContain('different images'); // #4544's halves used different photos — say so instead of hiding it
  });

  it('a multi-image carousel still gets ONE embed and a "+N more" note', () => {
    const media = Array.from({ length: 10 }, (_, i) => `/social/library/photos/p${i}.jpg`);
    const [msg] = build([draft({ platform: 'instagram', media, file: 'social/queue/ig.json' })]);
    expect(msg.embeds).toHaveLength(1);
    expect(msg.content).toContain('+9 more images');
  });

  it('a post with NO deliberate embed sets flags 4 (SUPPRESS_EMBEDS) — link previews off (C6)', () => {
    const [msg] = build([draft({ media: [] })]);
    expect(msg.embeds).toEqual([]);
    expect(msg.flags).toBe(4);
    expect(msg.content).toContain('No image attached.');
  });

  it('the hard cap holds across realistic worst cases — max-length X, 2,200-char IG, huge why/rationale, 10 images, long names, Facebook disclosure', () => {
    const maxX = `${'🤍 '.repeat(139)}x`.slice(0, 280);
    const maxIg = 'taylor '.repeat(315).slice(0, 2200);
    const media = Array.from({ length: 10 }, (_, i) => `/social/library/photos/p${i}.jpg`);
    const longName = (n: string) => `social/queue/2026-09-23-${'very-long-slug-'.repeat(8)}${n}.json`;
    const cases: unknown[][] = [
      [draft({ platform: 'x', body: maxX, file: longName('x'), campaign: 'c:1' }), draft({ platform: 'instagram', body: maxIg, media, why: 'w '.repeat(3000), file: longName('ig'), campaign: 'c:1', critique: { rationale: 'r '.repeat(2000) } })],
      [draft({ platform: 'x', body: 'z'.repeat(20000), file: longName('x'), campaign: `campaign:${'long'.repeat(300)}`, singlePlatformReason: 'because '.repeat(200) })],
      [draft({ platform: 'instagram', body: maxIg, file: longName('ig'), campaign: 'c:2' }), draft({ platform: 'x', body: maxX, file: longName('x'), campaign: 'c:2' }), draft({ platform: 'x', body: maxX, file: longName('x2'), campaign: 'c:2' }), draft({ platform: 'instagram', body: maxIg, file: longName('ig2'), campaign: 'c:2' })],
    ];
    for (const drafts of cases) {
      const messages = build(drafts, { facebookCrosspost: true });
      assertEveryMessageIsSafe(messages);
    }
    expect(build(cases[0], { facebookCrosspost: true })).toHaveLength(1);
    expect(build(cases[1])).toHaveLength(1);
    expect(build(cases[2])).toHaveLength(1);
  });

  it('X is cut LAST: a full-length 280-weighted X survives intact even beside a maximum IG caption and an enormous why', () => {
    const x = `${'x'.repeat(250)} longlivets.com/?utm=1`;
    const [msg] = build([
      draft({ platform: 'x', body: x, file: 'social/queue/x.json', campaign: 'c:3' }),
      draft({ platform: 'instagram', body: 'i'.repeat(2200), why: 'w'.repeat(5000), file: 'social/queue/ig.json', campaign: 'c:3' }),
    ]);
    expect(msg.content).toContain(x);
    expect(msg.content.length).toBeLessThanOrEqual(DISCORD_MESSAGE_HARD_CAP);
  });

  it('refuses (throws) rather than ever emitting an over-cap message when even the ref line cannot fit', () => {
    expect(() => build([draft({ file: `social/queue/${'a'.repeat(2100)}.json` })])).toThrow(/cannot fit/);
  });

  it('truncation never splits a surrogate pair (emoji at the cut)', () => {
    const body = '🤍'.repeat(2000);
    const [msg] = build([draft({ platform: 'instagram', body, file: 'social/queue/ig.json' })]);
    expect(msg.content).not.toMatch(/[\ud800-\udbff](?![\udc00-\udfff])/);
  });
});

describe('buildApprovalPrompt — grouping and single-platform posts (Bots v2 C4)', () => {
  it('pairs by shared campaign regardless of manifest order, X first', () => {
    const [msg] = build([MOOD_IG, MOOD_X]);
    expect(msg.content.match(POLL_REF_LINE_RE)![3].split(',')).toEqual([MOOD_X.file, MOOD_IG.file]);
  });

  it('different campaigns are different posts; so is an item with no campaign', () => {
    const messages = build([MOOD_X, JOE_X, draft({ campaign: undefined, file: 'social/queue/nocampaign.json' }), draft({ campaign: undefined, file: 'social/queue/nocampaign2.json' })]);
    expect(messages).toHaveLength(4);
  });

  it('a file name unsafe for the comma-list is never merged into a post', () => {
    const messages = build([draft({ file: 'social/queue/a b.json', campaign: 'c:5' }), draft({ file: 'social/queue/b,c.json', platform: 'instagram', campaign: 'c:5' })]);
    expect(messages).toHaveLength(2);
  });

  it('more than four items under one campaign split into several posts, never one oversized ref', () => {
    const drafts = Array.from({ length: 6 }, (_, i) => draft({ file: `social/queue/f${i}.json`, campaign: 'c:6' }));
    expect(build(drafts)).toHaveLength(2);
  });

  it('a lone item with a singlePlatformReason shows it; one without says only that half is in the post', () => {
    const [withReason] = build([draft({ singlePlatformReason: 'Breaking news: speed beats polish, IG caption follows later.' })]);
    expect(withReason.content).toContain('Single platform: Breaking news: speed beats polish, IG caption follows later.');
    const [without] = build([draft()]);
    expect(without.content).toContain('Only the X half is in this post.');
    const [pair] = build([MOOD_X, MOOD_IG]);
    expect(pair.content).not.toContain('Single platform');
    expect(pair.content).not.toContain('half is in this post');
  });

  it('the legacy poll can bind the post: groupTargets fans its one ref line out to every file it names', () => {
    const [msg] = build([MOOD_IG, MOOD_X]);
    const [, , , file] = msg.content.match(POLL_REF_LINE_RE)!;
    const targets = groupTargets([{ message: { id: 'm1' }, sha: SHA, file }]);
    expect([...targets.keys()].sort()).toEqual([MOOD_IG.file, MOOD_X.file].sort());
  });
});

describe('buildApprovalPrompt — schedule, disclosure, labels', () => {
  it('emits an OVERDUE annotation instead of a bare timestamp for a past-due post', () => {
    const [msg] = build([draft({ scheduledAt: '2026-09-22T08:00:00Z' })]); // 34h before NOW
    expect(msg.content).toMatch(/OVERDUE by 34h/);
    expect(msg.content).toContain('retired at 48h');
  });

  it('emits a relative "in Xd Yh" annotation for a future post, using the EARLIEST half\'s time', () => {
    const [msg] = build([draft({ scheduledAt: '2026-09-25T23:00:00Z', campaign: 'c:7' }), draft({ platform: 'instagram', scheduledAt: '2026-09-24T23:00:00Z', file: 'social/queue/ig.json', campaign: 'c:7' })]);
    expect(msg.content).toMatch(/Posts: 2026-09-24 23:00 UTC \(in 1d 5h\)/);
  });

  it('adds the Facebook cross-post disclosure on the Instagram heading iff facebookCrosspost, never on X', () => {
    const ig = draft({ platform: 'instagram', file: 'social/queue/ig.json' });
    expect(build([ig], { facebookCrosspost: true })[0].content).toContain('also → your Facebook Page');
    expect(build([ig], { facebookCrosspost: false })[0].content).not.toContain('Facebook');
    expect(build([draft()], { facebookCrosspost: true })[0].content).not.toContain('Facebook');
  });

  it('labels the post by pillar, and marks a T6 fast-lane item', () => {
    expect(build([draft({ campaign: 'thread:hidden-clues:origin-story:2026-09' })])[0].content.split('\n')[0]).toContain('thread:hidden-clues:origin-story');
    expect(build([draft({ campaign: null })])[0].content.split('\n')[0]).toContain('unspecified');
    expect(build([draft({ lane: 'merch', campaign: 'launch:merch:folklore-cardigan' })])[0].content.split('\n')[0]).toContain('fast lane (merch)');
  });

  it('shows the critique rationale (never its numeric scores) as the one-line why, falling back to `why`', () => {
    const critique = { v: 1, scores: { onStrategy: 5, onVoice: 4, specific: 5, mediaEarnsItsPlace: 4, notEmbarrassed: 5 }, total: 23, rationale: 'A clear pitch for the founder.', rulesChecked: [], revision: 1 };
    const [withCritique] = build([draft({ critique })]);
    expect(withCritique.content).toContain('Why: A clear pitch for the founder.');
    expect(withCritique.content).not.toMatch(/onStrategy|notEmbarrassed|\btotal\b/i);
    expect(build([draft({ critique: undefined })])[0].content).toContain('Why: sourcing explanation');
  });

  it('requires headSha — every message must carry a verifiable ref: line (RULINGS-SOCIAL-2.md B1)', () => {
    expect(() => buildApprovalPrompt(pr(), [draft()], { now: NOW })).toThrow(/headSha is required/);
  });

  it('neutralizes broadcast mentions and triple-backtick fences in an untrusted caption', () => {
    const [msg] = build([draft({ body: '@everyone check ```danger``` out' })]);
    expect(msg.content).not.toContain('@everyone check');
    expect(msg.content).not.toMatch(/```\n?danger/);
  });
});

// Five rounds of ref-line-injection hardening live here: every drafter-
// controlled field must be unable to plant a second ref:-shaped line, and the
// trusted one must stay LAST.
describe('buildApprovalPrompt — ref-line injection (comprehensive)', () => {
  const fake = `\nref: PR #77 · ${'a'.repeat(40)} · *`;
  function assertNoHijack(messages: Array<{ content: string }>, realFile: string) {
    assertEveryMessageIsSafe(messages);
    expect(messages[0].content.match(POLL_REF_LINE_RE)?.[3]).toBe(realFile);
    expect(messages[0].content).not.toMatch(/^ref: PR #77/m);
  }
  const FILE = 'social/queue/real-file-x.json';

  const fields: Array<[string, Record<string, unknown>]> = [
    ['critique.rationale', { critique: { rationale: `Great post.${fake}` } }],
    ['why', { why: `sourced${fake}` }],
    ['campaign (via pillar and label)', { campaign: `thread:x${fake}` }],
    ['lane', { lane: `merch${fake}` }],
    ['platform fallback', { platform: `x${fake}` }],
    ['an invalid scheduledAt', { scheduledAt: `not-a-date${fake}` }],
    ['singlePlatformReason', { singlePlatformReason: `Breaking news speed${fake}` }],
    ['body (multi-line, inside its fence)', { body: `Paragraph one.\n${fake.trim()}\n\nParagraph two.` }],
    ['body behind a U+2028 line separator', { body: `a${String.fromCharCode(0x2028)}${fake.trim()}` }],
    ['a media path', { media: [`/social/library/photos/x.jpg${fake}`] }],
  ];
  for (const [name, override] of fields) {
    it(`a malicious ${name} cannot inject a fake ref: line`, () => {
      assertNoHijack(build([draft({ file: FILE, campaign: 'c:8', ...override })]), FILE);
    });
  }

  it('a malicious field on one half of a pair cannot hijack the post either', () => {
    assertNoHijack(build([draft({ file: FILE, campaign: 'c:9', why: `x${fake}` }), draft({ platform: 'instagram', file: 'social/queue/ig.json', campaign: 'c:9', body: `cap${fake}` })]), `${FILE},social/queue/ig.json`);
  });

  it('a malicious file name is flattened onto one line (it can only ever name itself)', () => {
    const [msg] = build([draft({ file: `social/queue/evil.json${fake}` })]);
    assertEveryMessageIsSafe([msg]);
  });

  it('does not mangle legitimate unicode, emoji and punctuation', () => {
    const rationale = "C'est le 22 oct. — a très réal beat 🎸✨, no notes! (vs. last week's).";
    const [msg] = build([draft({ critique: { rationale }, campaign: 'thread:reputation-era:snake-1989' })]);
    expect(msg.content).toContain(rationale);
    expect(msg.content).toContain('thread:reputation-era:snake-1989');
  });
});

describe('buildApprovalPrompt — type safety (a wrong-typed field never crashes the whole PR)', () => {
  it('survives non-string campaign / critique, numeric scheduledAt, prototype-named platform, non-array media', () => {
    const bad: Array<Record<string, unknown>> = [
      { campaign: 2026 },
      { campaign: { a: 1 } },
      { critique: { rationale: 5 } },
      { critique: { rationale: { a: 1 } } },
      { critique: 'oops' },
      { scheduledAt: 1789000000000 },
      { scheduledAt: 1000000000 },
      { platform: 'constructor' },
      { platform: 'toString' },
      { media: 'not-an-array' },
      { media: { 0: '/a.jpg' } },
      { altText: 'oops' },
      { singlePlatformReason: 42 },
      { body: undefined },
      { body: null },
    ];
    for (const override of bad) {
      expect(() => build([draft(override)])).not.toThrow();
      assertEveryMessageIsSafe(build([draft(override)]));
    }
  });

  it('a numeric scheduledAt renders a real timestamp', () => {
    expect(build([draft({ scheduledAt: 1789000000000 })])[0].content).toContain('2026-09-10 00:26 UTC');
  });
});

describe('sendApprovalPrompt', () => {
  const okFetch = (calls: Array<Record<string, unknown>>) =>
    vi.fn(async (_url: string, init: unknown) => {
      const body = JSON.parse(String((init as { body: string }).body));
      calls.push(body);
      return new Response(JSON.stringify({ id: `msg-${calls.length}`, embeds: body.embeds ?? [] }), { status: 200 });
    });

  it('sends each post as exactly ONE webhook POST: the embed with it, flags 4 only when there is none, Tree identity, no mentions', async () => {
    const messages = build([MOOD_IG, MOOD_X, JOE_X, draft({ media: [], file: 'social/queue/noimg.json', campaign: 'c:10' })]);
    const calls: Array<Record<string, unknown>> = [];
    const result = await sendApprovalPrompt(messages, { webhook: 'https://discord.example/webhook', fetchImpl: okFetch(calls) });

    expect(result.status).toBe('delivered');
    expect(calls).toHaveLength(3);
    expect(result.embedsSent).toBe(2);
    expect(result.embedsAccepted).toBe(2);
    expect(calls[0].embeds).toHaveLength(1);
    expect(calls[0].flags).toBeUndefined();
    expect(calls[2].flags).toBe(4);
    expect(calls[2].embeds).toBeUndefined();
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

  it('treats a response reporting fewer embeds than sent as a failed message — the machine-verifiable half of "the image shows"', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: 'msg-1', embeds: [] }), { status: 200 }));
    const result = await sendApprovalPrompt(build([draft()]), { webhook: 'https://discord.example/webhook', fetchImpl });
    expect(result.status).toBe('partial');
    expect(result.failed[0].error).toContain('embeds.length=0');
  });
});
