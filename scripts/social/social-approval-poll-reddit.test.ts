// S6 (docs/specs/tree-overhaul/s3-reason-protocol.md §3 "What S6 must
// add") — Reddit completion tracking. A structurally separate dispatch
// pass from the byPr loop (a Reddit prompt has no PR and no SHA — nothing
// to key byPr by, per PLAN.md's own "one finding" for this task), so its
// tests live in their own file, mirroring
// social-approval-poll-plan-brief.test.ts's own precedent for T4's
// equally-separate dispatch branch (see that file's header comment).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
// @ts-expect-error — implementation is plain .mjs
import { run } from './social-approval-poll.mjs';
import { SOCIAL_APPROVERS } from './lib/approvers.mjs';

const CHECK_MARK = '%E2%9C%85';
const CROSS_MARK = '%E2%9D%8C';
const PENCIL_MARK = '%E2%9C%8F%EF%B8%8F';
const SKIP_MARK = '%E2%8F%AD%EF%B8%8F';
const REPO = 'JW-Incorporated/swift2';
const WEBHOOK_URL = 'https://discord.com/api/webhooks/999999999999999999/faketoken';
const CHANNEL_ID = '111111111111111111';
const BOT_TOKEN = 'fake-bot-token';
const TEST_KEY = 'test-signing-key';
const APPROVER = SOCIAL_APPROVERS[0];
const APPROVER_SNOWFLAKE = APPROVER.slice('discord:'.length);
const POST_ID = 'reddit-abc123';

let root: string;
let savedEnv: NodeJS.ProcessEnv;
let savedCwd: string;

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

function redditRefMessage({ id, postId = POST_ID, timestamp = '2026-09-14T10:00:00.000Z', extra = '' }: { id: string; postId?: string; timestamp?: string; extra?: string }) {
  return { id, webhook_id: '999999999999999999', timestamp, content: `**Community prompt · Reddit · r/TaylorSwift**\nID: ${postId}${extra}\nref: reddit · ${postId}` };
}

function replyMessage({ id, parentId, authorId = APPROVER, authorName = 'Joey', content = 'a reply', timestamp = '2026-09-15T12:00:00.000Z' }: { id: string; parentId: string; authorId?: string; authorName?: string; content?: string; timestamp?: string }) {
  return { id, author: { id: authorId.replace('discord:', ''), global_name: authorName }, content, timestamp, message_reference: { message_id: parentId } };
}

/** Fetches reactions keyed per message id, mirroring
 * social-approval-poll-plan-brief.test.ts's own makeFetchImpl, extended
 * with the ⏭️ (SKIP_MARK) reaction getRedditMessageApprovals also fetches. */
function makeFetchImpl(messages: unknown[], byMessage: Record<string, { check?: Array<() => unknown>; cross?: Array<() => unknown>; skip?: Array<() => unknown> }> = {}) {
  const calls = new Map<string, { check: number; cross: number; pencil: number; skip: number }>();
  const posts: Array<{ url: string; body: Record<string, unknown> }> = [];
  const impl = vi.fn(async (url: string, init?: { method?: string; body?: string }) => {
    if (init?.method === 'POST') {
      posts.push({ url, body: init.body ? JSON.parse(init.body) : {} });
      return jsonResponse({ id: 'posted' });
    }
    if (url.includes('/messages?limit=100')) return jsonResponse(messages);
    for (const [id, script] of Object.entries(byMessage)) {
      const checkScript = script.check ?? [() => jsonResponse([])];
      const crossScript = script.cross ?? [() => jsonResponse([])];
      const pencilScript = [() => jsonResponse([])];
      const skipScript = script.skip ?? [() => jsonResponse([])];
      if (!calls.has(id)) calls.set(id, { check: 0, cross: 0, pencil: 0, skip: 0 });
      const c = calls.get(id)!;
      if (url.includes(`/messages/${id}/reactions/${CHECK_MARK}`)) return checkScript[Math.min(c.check++, checkScript.length - 1)]();
      if (url.includes(`/messages/${id}/reactions/${CROSS_MARK}`)) return crossScript[Math.min(c.cross++, crossScript.length - 1)]();
      if (url.includes(`/messages/${id}/reactions/${PENCIL_MARK}`)) return pencilScript[Math.min(c.pencil++, pencilScript.length - 1)]();
      if (url.includes(`/messages/${id}/reactions/${SKIP_MARK}`)) return skipScript[Math.min(c.skip++, skipScript.length - 1)]();
    }
    // No reaction data configured for this message at all — every emoji reads empty.
    return jsonResponse([]);
  });
  return { impl, posts };
}

function makeExecGh() {
  return vi.fn((args: string[]) => (args[0] === 'api' && args[1] === 'user' ? 'tree-poster-bot' : ''));
}

function makeExecGit() {
  return vi.fn((args: string[]) => (args[0] === 'rev-parse' ? 'a'.repeat(40) : ''));
}

function readAllLedgerRows() {
  const dir = path.join(root, 'social', 'feedback');
  if (!existsSync(dir)) return [] as Array<Record<string, unknown>>;
  return readdirSync(dir)
    .filter((f) => f.endsWith('.jsonl'))
    .flatMap((f) =>
      readFileSync(path.join(dir, f), 'utf8')
        .split('\n')
        .filter((l) => l.trim() !== '')
        .map((l) => JSON.parse(l) as Record<string, unknown>),
    );
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-16T09:00:00.000Z'));
  savedEnv = process.env;
  savedCwd = process.cwd();
  root = await mkdtemp(path.join(tmpdir(), 'poll-reddit-test-'));
  process.chdir(root);
  process.env = { ...savedEnv, DISCORD_BOT_TOKEN: BOT_TOKEN, SOCIAL_APPROVAL_WEBHOOK_URL: WEBHOOK_URL, SOCIAL_APPROVAL_KEY: TEST_KEY, GH_TOKEN: 'fake-gh-token', REPO };
  process.exitCode = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (String(url).startsWith(WEBHOOK_URL)) return jsonResponse({ channel_id: CHANNEL_ID });
      throw new Error(`unexpected global fetch url: ${url}`);
    }),
  );
});

afterEach(async () => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  process.chdir(savedCwd);
  process.env = savedEnv;
  process.exitCode = 0;
  await rm(root, { recursive: true, force: true });
});

describe('reddit ref-line grammar (valid/invalid forms)', () => {
  it('ignores a message with no ref line at all — no row, no crash', async () => {
    const messages = [{ id: 'm1', webhook_id: '999999999999999999', timestamp: '2026-09-14T10:00:00.000Z', content: 'just a message' }];
    const { impl: fetchImpl } = makeFetchImpl(messages);
    await run({ execGh: makeExecGh(), execGit: makeExecGit(), fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });
    expect(readAllLedgerRows()).toHaveLength(0);
  });

  it('ignores a malformed reddit ref line (missing the middle dot)', async () => {
    const messages = [{ id: 'm1', webhook_id: '999999999999999999', timestamp: '2026-09-14T10:00:00.000Z', content: `ref: reddit ${POST_ID}` }];
    const { impl: fetchImpl } = makeFetchImpl(messages, { m1: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
    await run({ execGh: makeExecGh(), execGit: makeExecGit(), fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });
    expect(readAllLedgerRows()).toHaveLength(0);
  });

  // Second security lesson carried forward this wave: only the message's
  // TRUE LAST non-empty line is ever consulted (extractRedditRefLine
  // mirrors extractRefLine's own HIGH-2 fix) — a ref-shaped line earlier in
  // free text must never be mistaken for the real trailing ref line.
  it('ignores a ref-shaped line that is not the true last line of the message', async () => {
    const messages = [redditRefMessage({ id: 'm1', extra: `\nref: reddit · attacker-chosen` })];
    // The real ref line (postId=POST_ID) IS still the true last line here —
    // this asserts the EARLIER attacker-shaped line never wins instead.
    const { impl: fetchImpl } = makeFetchImpl(messages, { m1: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
    await run({ execGh: makeExecGh(), execGit: makeExecGit(), fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });
    const rows = readAllLedgerRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ file: `reddit:${POST_ID}` });
  });
});

describe('reaction -> action table (spec §3, reddit column)', () => {
  it('✅ (no reply needed) marks the item done — an approve row, pr null, file reddit:<postId>', async () => {
    const messages = [redditRefMessage({ id: 'm1' })];
    const { impl: fetchImpl } = makeFetchImpl(messages, { m1: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
    await run({ execGh: makeExecGh(), execGit: makeExecGit(), fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    const rows = readAllLedgerRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      ts: '2026-09-16T09:00:00.000Z',
      pr: null,
      file: `reddit:${POST_ID}`,
      platform: null,
      campaign: null,
      pillar: null,
      action: 'approve',
      reason: null,
      originalBody: null,
      editedBody: null,
      approver: APPROVER,
      messageId: 'm1',
      replyId: null,
    });
  });

  it('✏️ with a qualifying reply writes an edit row carrying the reply as reason (editedBody stays null — S6 never auto-posts)', async () => {
    const messages = [redditRefMessage({ id: 'm1' }), replyMessage({ id: 'r1', parentId: 'm1', content: 'say it this way instead' })];
    const { impl: fetchImpl } = makeFetchImpl(messages, { m1: {} });
    // editedBy comes from the PENCIL reactor list — reuse the check-mark
    // slot's shape via a dedicated pencil fetch by hitting the same URL.
    const withPencil = vi.fn(async (url: string, init?: { method?: string; body?: string }) => {
      if (url.includes(`/messages/m1/reactions/${PENCIL_MARK}`)) return jsonResponse([{ id: APPROVER_SNOWFLAKE }]);
      return fetchImpl(url, init);
    });
    await run({ execGh: makeExecGh(), execGit: makeExecGit(), fetchImpl: withPencil, sleepImpl: vi.fn(() => Promise.resolve()) });

    const rows = readAllLedgerRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ pr: null, file: `reddit:${POST_ID}`, action: 'edit', reason: 'say it this way instead', editedBody: null, replyId: 'r1' });
  });

  it('❌ with a qualifying reply writes a reject row', async () => {
    const messages = [redditRefMessage({ id: 'm1' }), replyMessage({ id: 'r1', parentId: 'm1', content: 'wrong thread' })];
    const { impl: fetchImpl } = makeFetchImpl(messages, { m1: { cross: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
    await run({ execGh: makeExecGh(), execGit: makeExecGit(), fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    const rows = readAllLedgerRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ pr: null, file: `reddit:${POST_ID}`, action: 'reject', reason: 'wrong thread' });
  });

  it('❌ with NO reply leaves it pending — no row (spec: "acts on nothing, logs nothing, re-evaluates next run")', async () => {
    const messages = [redditRefMessage({ id: 'm1' })];
    const { impl: fetchImpl, posts } = makeFetchImpl(messages, { m1: { cross: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
    await run({ execGh: makeExecGh(), execGit: makeExecGit(), fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    expect(readAllLedgerRows()).toHaveLength(0);
    expect(posts).toHaveLength(0);
  });

  it('⏭️ (no reply needed) writes a skip row, never a rejection', async () => {
    const messages = [redditRefMessage({ id: 'm1' })];
    const { impl: fetchImpl } = makeFetchImpl(messages, { m1: { skip: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
    await run({ execGh: makeExecGh(), execGit: makeExecGit(), fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    const rows = readAllLedgerRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ pr: null, file: `reddit:${POST_ID}`, action: 'skip', reason: null });
  });

  it('no reaction at all writes no row', async () => {
    const messages = [redditRefMessage({ id: 'm1' })];
    const { impl: fetchImpl } = makeFetchImpl(messages, { m1: {} });
    await run({ execGh: makeExecGh(), execGit: makeExecGit(), fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });
    expect(readAllLedgerRows()).toHaveLength(0);
  });
});

describe('grouping by postId (union across every message naming the same target)', () => {
  it('two messages for the same postId resolve to ONE row via the union — a ✅ on either counts', async () => {
    const messages = [
      redditRefMessage({ id: 'm1', timestamp: '2026-09-14T10:00:00.000Z' }),
      redditRefMessage({ id: 'm2', timestamp: '2026-09-15T10:00:00.000Z' }), // e.g. a re-posted digest naming the same lead
    ];
    const { impl: fetchImpl } = makeFetchImpl(messages, { m1: {}, m2: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
    await run({ execGh: makeExecGh(), execGit: makeExecGit(), fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    const rows = readAllLedgerRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ file: `reddit:${POST_ID}`, action: 'approve' });
  });

  it('two DIFFERENT postIds are tracked independently', async () => {
    const messages = [redditRefMessage({ id: 'm1', postId: 'post-a' }), redditRefMessage({ id: 'm2', postId: 'post-b' })];
    const { impl: fetchImpl } = makeFetchImpl(messages, {
      m1: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
      m2: { skip: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
    });
    await run({ execGh: makeExecGh(), execGit: makeExecGit(), fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    const rows = readAllLedgerRows();
    expect(rows).toHaveLength(2);
    expect(rows).toContainEqual(expect.objectContaining({ file: 'reddit:post-a', action: 'approve' }));
    expect(rows).toContainEqual(expect.objectContaining({ file: 'reddit:post-b', action: 'skip' }));
  });
});

describe('idempotency (spec §Mechanics-8, AC#7 — reused for the reddit pass)', () => {
  it('running the poll twice against an unchanged channel writes exactly one row, not two', async () => {
    const messages = [redditRefMessage({ id: 'm1' })];
    const { impl: fetchImpl } = makeFetchImpl(messages, { m1: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });

    await run({ execGh: makeExecGh(), execGit: makeExecGit(), fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });
    await run({ execGh: makeExecGh(), execGit: makeExecGit(), fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    expect(readAllLedgerRows()).toHaveLength(1);
  });
});
