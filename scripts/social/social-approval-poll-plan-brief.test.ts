// T4 (docs/specs/tree-overhaul/t4-weekly-brief.md) — the plan-brief scope
// dispatch social-approval-poll.mjs grows for the Monday brief: proposal:<n>
// / brief / calendar:<n> / questions, bound by (pr, messageId) alone, never
// gated on the plan PR's SHA/OPEN state (spec §Data "Plan-brief scopes bind
// by (pr, messageId)"). A separate file from social-approval-poll.test.ts
// (already 1300+ lines covering the S3 draft/header dispatch) rather than
// growing that one further — this dispatch branch is deliberately
// independent code (see that script's own header comment), so its tests
// are independent too.
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
const REPO = 'JW-Incorporated/swift2';
const WEBHOOK_URL = 'https://discord.com/api/webhooks/999999999999999999/faketoken';
const CHANNEL_ID = '111111111111111111';
const BOT_TOKEN = 'fake-bot-token';
const PR_NUMBER = 4200;
const HEAD_SHA = 'a'.repeat(40);
const STALE_SHA = 'b'.repeat(40);
const TEST_KEY = 'test-signing-key';
const APPROVER = SOCIAL_APPROVERS[0];
const APPROVER_SNOWFLAKE = APPROVER.slice('discord:'.length);
const NON_APPROVER_SNOWFLAKE = '888888888888888888';
const BRIEF_MESSAGE_ID = '300000000000000001';
const PROPOSAL_MESSAGE_ID = '300000000000000002';

let root: string;
let savedEnv: NodeJS.ProcessEnv;
let savedCwd: string;

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

function refMessage({ id, sha = HEAD_SHA, scope, pr = PR_NUMBER, timestamp = '2026-09-14T10:00:00.000Z', thread }: { id: string; sha?: string; scope: string; pr?: number; timestamp?: string; thread?: { id: string } }) {
  return { id, webhook_id: '999999999999999999', timestamp, thread, content: `**Tree message**\nref: PR #${pr} · ${sha} · ${scope}` };
}

function replyMessage({ id, parentId, authorId = APPROVER, authorName = 'Joey', content = 'a reply', timestamp = '2026-09-15T12:00:00.000Z' }: { id: string; parentId: string; authorId?: string; authorName?: string; content?: string; timestamp?: string }) {
  return { id, author: { id: authorId.replace('discord:', ''), global_name: authorName }, content, timestamp, message_reference: { message_id: parentId } };
}

function threadReplyMessage({ id, authorId = APPROVER, authorName = 'Joey', content = 'a thread reply', timestamp = '2026-09-15T12:00:00.000Z' }: { id: string; authorId?: string; authorName?: string; content?: string; timestamp?: string }) {
  return { id, author: { id: authorId.replace('discord:', ''), global_name: authorName }, content, timestamp };
}

/** Fetches reactions/thread-messages keyed per message/thread id, mirroring
 * social-approval-poll.test.ts's own makeFetchImplByMessage. */
function makeFetchImpl(messages: unknown[], byMessage: Record<string, { check?: Array<() => unknown>; cross?: Array<() => unknown> }> = {}, byThread: Record<string, unknown[]> = {}) {
  const calls = new Map<string, { check: number; cross: number; pencil: number }>();
  const posts: Array<{ url: string; body: Record<string, unknown> }> = [];
  const impl = vi.fn(async (url: string, init?: { method?: string; body?: string }) => {
    if (init?.method === 'POST') {
      posts.push({ url, body: init.body ? JSON.parse(init.body) : {} });
      return jsonResponse({ id: 'posted' });
    }
    if (url.includes('/messages?limit=100')) {
      for (const [threadId, threadMessages] of Object.entries(byThread)) {
        if (url.includes(`/channels/${threadId}/messages`)) return jsonResponse(threadMessages);
      }
      return jsonResponse(messages);
    }
    for (const [id, script] of Object.entries(byMessage)) {
      const checkScript = script.check ?? [() => jsonResponse([])];
      const crossScript = script.cross ?? [() => jsonResponse([])];
      const pencilScript = [() => jsonResponse([])];
      if (!calls.has(id)) calls.set(id, { check: 0, cross: 0, pencil: 0 });
      const c = calls.get(id)!;
      if (url.includes(`/messages/${id}/reactions/${CHECK_MARK}`)) return checkScript[Math.min(c.check++, checkScript.length - 1)]();
      if (url.includes(`/messages/${id}/reactions/${CROSS_MARK}`)) return crossScript[Math.min(c.cross++, crossScript.length - 1)]();
      if (url.includes(`/messages/${id}/reactions/${PENCIL_MARK}`)) return pencilScript[Math.min(c.pencil++, pencilScript.length - 1)]();
    }
    throw new Error(`unexpected fetchImpl url: ${url}`);
  });
  return { impl, posts };
}

/** `pr view --json ...`/`pr comment`/`workflow run`, keyed per PR number so
 * a test can exercise two PRs (a plan PR + a draft PR) in one run(). */
// LOW (Codex round 2): the poll only trusts a marker/dedupe comment
// authored by its OWN identity (resolved at runtime via `gh api user`) —
// BOT_LOGIN is that fixture's stand-in.
const BOT_LOGIN = 'tree-poster-bot';
const OTHER_COMMENTER = 'a-different-collaborator';

type SeedComment = string | { body: string; author: string };

function makeExecGh(byPr: Record<number, { state?: string; files?: Array<{ path: string }>; comments?: SeedComment[] }> = {}) {
  const state: Record<number, { state: string; files: Array<{ path: string }>; comments: string[]; commentAuthors: string[] }> = {};
  for (const [k, v] of Object.entries(byPr)) {
    const seeded = v.comments ?? [];
    state[Number(k)] = {
      state: v.state ?? 'OPEN',
      files: v.files ?? [],
      comments: seeded.map((c) => (typeof c === 'string' ? c : c.body)),
      commentAuthors: seeded.map((c) => (typeof c === 'string' ? BOT_LOGIN : c.author)),
    };
  }
  const calls: string[][] = [];
  const impl = vi.fn((args: string[]) => {
    calls.push(args);
    if (args[0] === 'api' && args[1] === 'user') return BOT_LOGIN;
    if (args[0] === 'pr' && args[1] === 'view') {
      const n = Number(args[2]);
      const cfg = (state[n] ??= { state: 'OPEN', files: [], comments: [], commentAuthors: [] });
      if (args.includes('headRefOid,headRefName,state,number')) return JSON.stringify({ headRefOid: HEAD_SHA, headRefName: `tree/plan/${n}`, state: cfg.state, number: n });
      if (args.includes('files')) return JSON.stringify({ files: cfg.files });
      if (args.includes('comments')) {
        return JSON.stringify({ comments: cfg.comments.map((body, i) => ({ body, author: { login: cfg.commentAuthors[i] ?? BOT_LOGIN } })) });
      }
    }
    if (args[0] === 'pr' && args[1] === 'comment') {
      const n = Number(args[2]);
      const bodyIndex = args.indexOf('--body');
      const cfg = (state[n] ??= { state: 'OPEN', files: [], comments: [], commentAuthors: [] });
      cfg.comments.push(args[bodyIndex + 1]);
      cfg.commentAuthors.push(BOT_LOGIN); // this call IS the poll itself posting
      return '';
    }
    return '';
  });
  return { impl, calls, state };
}

function makeExecGit() {
  return vi.fn((args: string[]) => (args[0] === 'rev-parse' ? HEAD_SHA : ''));
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
  vi.setSystemTime(new Date('2026-09-11T09:00:00.000Z'));
  savedEnv = process.env;
  savedCwd = process.cwd();
  root = await mkdtemp(path.join(tmpdir(), 'poll-plan-brief-test-'));
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

describe('proposal:<n> verdicts (AC#3)', () => {
  it('✅ on proposal:2 writes an approve row with file "proposal:2" and the plan PR number', async () => {
    const messages = [refMessage({ id: PROPOSAL_MESSAGE_ID, scope: 'proposal:2' })];
    const { impl: fetchImpl } = makeFetchImpl(messages, { [PROPOSAL_MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
    const { impl: execGh } = makeExecGh({ [PR_NUMBER]: {} });
    const execGit = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    const rows = readAllLedgerRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ pr: PR_NUMBER, file: 'proposal:2', action: 'approve', approver: APPROVER, messageId: PROPOSAL_MESSAGE_ID });
  });

  it('❌ on proposal:2 WITH a reply writes a reject row, exactly like every other S3 scope', async () => {
    const messages = [refMessage({ id: PROPOSAL_MESSAGE_ID, scope: 'proposal:2' }), replyMessage({ id: 'reply-1', parentId: PROPOSAL_MESSAGE_ID, content: 'not now' })];
    const { impl: fetchImpl } = makeFetchImpl(messages, { [PROPOSAL_MESSAGE_ID]: { cross: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
    const { impl: execGh } = makeExecGh({ [PR_NUMBER]: {} });
    const execGit = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    const rows = readAllLedgerRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ pr: PR_NUMBER, file: 'proposal:2', action: 'reject', reason: 'not now' });
  });

  it('❌ on proposal:2 with NO reply requires one first — no row yet, exactly one nudge', async () => {
    const messages = [refMessage({ id: PROPOSAL_MESSAGE_ID, scope: 'proposal:2' })];
    const { impl: fetchImpl, posts } = makeFetchImpl(messages, { [PROPOSAL_MESSAGE_ID]: { cross: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
    const { impl: execGh } = makeExecGh({ [PR_NUMBER]: {} });
    const execGit = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    expect(readAllLedgerRows()).toHaveLength(0);
    expect(posts.some((p) => typeof p.body.content === 'string' && (p.body.content as string).includes(`nudge: PR #${PR_NUMBER}`))).toBe(true);
  });

  it("a bare ✅/❌ on brief/calendar/questions needs no reply — brief ❌ with no reply is already a complete reject row", async () => {
    const messages = [refMessage({ id: BRIEF_MESSAGE_ID, scope: 'brief' })];
    const { impl: fetchImpl } = makeFetchImpl(messages, { [BRIEF_MESSAGE_ID]: { cross: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
    const { impl: execGh } = makeExecGh({ [PR_NUMBER]: {} });
    const execGit = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    const rows = readAllLedgerRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ pr: PR_NUMBER, file: 'brief', action: 'reject', reason: null });
  });
});

describe('AC#3b — the binding regression', () => {
  it('a ✅ on proposal:1 is still processed on a MERGED plan PR at a stale head SHA, while the equivalent reaction on a social/queue/** scope stays ignored', async () => {
    const DRAFT_PR = 4201;
    const QUEUE_MESSAGE_ID = '300000000000000003';
    const messages = [
      refMessage({ id: PROPOSAL_MESSAGE_ID, scope: 'proposal:1', pr: PR_NUMBER, sha: STALE_SHA }),
      refMessage({ id: QUEUE_MESSAGE_ID, scope: 'social/queue/2026-09-20-example-x.json', pr: DRAFT_PR, sha: STALE_SHA }),
    ];
    const { impl: fetchImpl } = makeFetchImpl(messages, {
      [PROPOSAL_MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
      [QUEUE_MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
    });
    const { impl: execGh } = makeExecGh({
      [PR_NUMBER]: { state: 'MERGED' },
      [DRAFT_PR]: { state: 'MERGED', files: [{ path: 'social/queue/2026-09-20-example-x.json' }] },
    });
    const execGit = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    const rows = readAllLedgerRows();
    expect(rows).toContainEqual(expect.objectContaining({ pr: PR_NUMBER, file: 'proposal:1', action: 'approve' }));
    // The draft PR's reaction never mints anything without a valid on-disk
    // v3 stamp — a MERGED draft PR's rows come ONLY from a signed stamp at
    // head (S3), never from a live reaction at a stale SHA.
    expect(rows.some((r) => r.pr === DRAFT_PR)).toBe(false);
  });
});

// Tree Overhaul T5 (docs/specs/tree-overhaul/t5-lessons-ledger.md, PLAN step
// 8) — allRefs.filter(PLAN_SCOPE_RE) / allRefs.filter(!PLAN_SCOPE_RE) already
// partition every ref exhaustively before either dispatch branch runs (this
// script's own header comment: "two dispatch branches, not one collapsed
// together"), so a PR whose refs are ALL plan-brief scopes structurally
// cannot reach the draft classify/stamp/merge path — this proves that
// separation end to end rather than adding a redundant runtime check.
describe('a plan-scope PR is never auto-merged (regression guard)', () => {
  it('a PR carrying only brief/proposal:n refs is processed for its ledger rows but never reaches `gh pr merge`', async () => {
    const messages = [refMessage({ id: BRIEF_MESSAGE_ID, scope: 'brief' }), refMessage({ id: PROPOSAL_MESSAGE_ID, scope: 'proposal:1' })];
    const { impl: fetchImpl } = makeFetchImpl(messages, {
      [BRIEF_MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
      [PROPOSAL_MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
    });
    const { impl: execGh, calls } = makeExecGh({ [PR_NUMBER]: {} });
    const execGit = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    // the plan-brief dispatch still ran normally...
    const rows = readAllLedgerRows();
    expect(rows).toContainEqual(expect.objectContaining({ pr: PR_NUMBER, file: 'brief', action: 'approve' }));
    expect(rows).toContainEqual(expect.objectContaining({ pr: PR_NUMBER, file: 'proposal:1', action: 'approve' }));
    // ...but nothing ever merged this (or any) PR.
    expect(calls.some((args) => args[0] === 'pr' && args[1] === 'merge')).toBe(false);
  });
});

describe('thread-reply ingestion (AC#4, AC#5)', () => {
  it('AC#4: a thread reply from an approver appears as a plan-PR comment quoting it verbatim, carrying discord-reply:<id>; a second run posts no duplicate', async () => {
    const threadId = '400000000000000001';
    const briefRef = refMessage({ id: BRIEF_MESSAGE_ID, scope: 'brief', thread: { id: threadId } });
    const { impl: fetchImpl } = makeFetchImpl([briefRef], { [BRIEF_MESSAGE_ID]: {} }, { [threadId]: [threadReplyMessage({ id: 'thread-reply-1', authorName: 'Joey', content: 'keep it but only when relevant' })] });
    const { impl: execGh, state } = makeExecGh({ [PR_NUMBER]: {} });
    const execGit = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });
    const commentsAfterFirst = [...state[PR_NUMBER].comments];
    expect(commentsAfterFirst.some((c) => c.includes('discord-reply: thread-reply-1'))).toBe(true);
    expect(commentsAfterFirst.some((c) => c.includes('From Joey in #longlive-social'))).toBe(true);
    expect(commentsAfterFirst.some((c) => c.includes('keep it but only when relevant'))).toBe(true);

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });
    const dupeCount = state[PR_NUMBER].comments.filter((c) => c.includes('discord-reply: thread-reply-1')).length;
    expect(dupeCount).toBe(1);
  });

  it('AC#5: a reply from a non-approver produces no PR comment and no dispatch', async () => {
    const messages = [refMessage({ id: BRIEF_MESSAGE_ID, scope: 'brief' }), replyMessage({ id: 'reply-1', parentId: BRIEF_MESSAGE_ID, authorId: `discord:${NON_APPROVER_SNOWFLAKE}`, content: 'not an approver' })];
    const { impl: fetchImpl } = makeFetchImpl(messages, { [BRIEF_MESSAGE_ID]: {} });
    const { impl: execGh, calls, state } = makeExecGh({ [PR_NUMBER]: {} });
    const execGit = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    expect(state[PR_NUMBER].comments).toHaveLength(0);
    expect(calls.some((c) => c[0] === 'workflow' && c[1] === 'run')).toBe(false);
  });
});

describe('the Wednesday cut-off (AC#6, AC#7)', () => {
  it('AC#6: a reply landing before the cut-off dispatches mode=replan exactly once; a second/third reply the same day dispatches nothing further', async () => {
    vi.setSystemTime(new Date('2026-09-15T14:00:00.000Z')); // Tuesday of the brief's own week (brief posted Monday 2026-09-14)
    const messages = [refMessage({ id: BRIEF_MESSAGE_ID, scope: 'brief' }), replyMessage({ id: 'reply-1', parentId: BRIEF_MESSAGE_ID, content: 'first reply' })];
    const { impl: fetchImpl } = makeFetchImpl(messages, { [BRIEF_MESSAGE_ID]: {} });
    const { impl: execGh, calls, state } = makeExecGh({ [PR_NUMBER]: {} });
    const execGit = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });
    const dispatchCallsAfterFirst = calls.filter((c) => c[0] === 'workflow' && c[1] === 'run');
    expect(dispatchCallsAfterFirst).toHaveLength(1);
    // LOW (Codex round 3): asserts the EXACT full argv, not arrayContaining
    // -- mutation testing proved arrayContaining lets a missing --repo (or
    // any other dropped/misordered argument) slip through with every test
    // in this file still green, since it only checks the listed elements
    // are present SOMEWHERE, never that the actual call has nothing else.
    expect(dispatchCallsAfterFirst[0]).toEqual(['workflow', 'run', 'routine-tree-weekly-plan.yml', '--repo', REPO, '-f', 'mode=replan', '-f', `pr=${PR_NUMBER}`]);
    expect(state[PR_NUMBER].comments.some((c) => c.startsWith('replan-dispatched: 2026-W38'))).toBe(true);

    // Two more replies, same Tuesday — the marker this run just posted must
    // suppress any further dispatch.
    const messages2 = [...messages, replyMessage({ id: 'reply-2', parentId: BRIEF_MESSAGE_ID, content: 'second reply' }), replyMessage({ id: 'reply-3', parentId: BRIEF_MESSAGE_ID, content: 'third reply' })];
    const { impl: fetchImpl2 } = makeFetchImpl(messages2, { [BRIEF_MESSAGE_ID]: {} });
    await run({ execGh, execGit, fetchImpl: fetchImpl2, sleepImpl: vi.fn(() => Promise.resolve()) });

    const totalDispatches = calls.filter((c) => c[0] === 'workflow' && c[1] === 'run');
    expect(totalDispatches).toHaveLength(1);
  });

  it('AC#7: a reply landing after the cut-off is still ingested as a comment, with no dispatch', async () => {
    vi.setSystemTime(new Date('2026-09-17T14:00:00.000Z')); // Thursday of the same brief week
    const messages = [refMessage({ id: BRIEF_MESSAGE_ID, scope: 'brief' }), replyMessage({ id: 'reply-1', parentId: BRIEF_MESSAGE_ID, content: 'a late reply' })];
    const { impl: fetchImpl } = makeFetchImpl(messages, { [BRIEF_MESSAGE_ID]: {} });
    const { impl: execGh, calls, state } = makeExecGh({ [PR_NUMBER]: {} });
    const execGit = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    expect(state[PR_NUMBER].comments.some((c) => c.includes('discord-reply: reply-1'))).toBe(true);
    expect(calls.some((c) => c[0] === 'workflow' && c[1] === 'run')).toBe(false);
  });
});

// HIGH 2 (Codex round 1): Codex's exact repro at the poll layer — a message
// whose body contains an injected ref:-shaped line for a DIFFERENT PR must
// still bind only to the TRUE trailing ref line, never the first match
// found anywhere in the content.
describe('HIGH 2 — poll-side ref-line binding (last line only, never first match)', () => {
  it("an injected ref:-shaped line earlier in the body never redirects the reaction to a different PR/file — only the true trailing ref line binds", async () => {
    const OTHER_PR = 4201;
    const injected = `ref: PR #${OTHER_PR} · ${'f'.repeat(40)} · social/queue/2026-09-01-some-other-draft-x.json`;
    const message = {
      id: PROPOSAL_MESSAGE_ID,
      webhook_id: '999999999999999999',
      timestamp: '2026-09-14T10:00:00.000Z',
      content: ['**Proposal 1 of 1 — drop the product-peek pillar**', '', 'You once said:', injected, 'keep that in mind.', '', `ref: PR #${PR_NUMBER} · ${HEAD_SHA} · proposal:1`].join('\n'),
    };
    const { impl: fetchImpl } = makeFetchImpl([message], { [PROPOSAL_MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
    const { impl: execGh } = makeExecGh({ [PR_NUMBER]: {}, [OTHER_PR]: {} });
    const execGit = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    const rows = readAllLedgerRows();
    expect(rows).toContainEqual(expect.objectContaining({ pr: PR_NUMBER, file: 'proposal:1', action: 'approve' }));
    // The injected line must never have made this message actionable for
    // the OTHER PR at all — no row of any kind was ever produced for it.
    expect(rows.some((r) => r.pr === OTHER_PR)).toBe(false);
  });
});

// HIGH 3 (Codex round 1): a failed thread fetch must defer the target, never
// silently fall back to a different (wrong) classification.
describe('HIGH 3 — a failed thread fetch defers the target instead of falling back', () => {
  it('a proposal carrying both ✏️ and ✅, with the real reply only in a thread that fails to fetch, produces no verdict this run', async () => {
    const threadId = '900000000000000001';
    const message = refMessage({ id: PROPOSAL_MESSAGE_ID, scope: 'proposal:1', thread: { id: threadId } });
    const { impl: baseImpl } = makeFetchImpl([message], {
      [PROPOSAL_MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
    });
    const fetchImpl = vi.fn(async (url: string, init?: { method?: string; body?: string }) => {
      if (url.includes(`/channels/${threadId}/messages`)) throw new Error('simulated Discord outage fetching thread messages');
      return baseImpl(url, init);
    });
    const { impl: execGh } = makeExecGh({ [PR_NUMBER]: {} });
    const execGit = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    // Deferred, not wrongly resolved: no approve/reject row at all this run.
    expect(readAllLedgerRows()).toHaveLength(0);
  });
});

// MEDIUM 8 (Codex round 1): the replan-dispatched marker must only ever be
// written after a CONFIRMED-successful dispatch, so a failed `gh workflow
// run` never permanently burns that week's one re-plan opportunity.
describe('MEDIUM 8 — the replan marker is written only after a confirmed dispatch', () => {
  it('a failed dispatch call writes no marker; a later run can then retry successfully', async () => {
    vi.setSystemTime(new Date('2026-09-15T14:00:00.000Z')); // Tuesday, before the cut-off
    const messages = [refMessage({ id: BRIEF_MESSAGE_ID, scope: 'brief' }), replyMessage({ id: 'reply-1', parentId: BRIEF_MESSAGE_ID, content: 'first reply' })];
    const { impl: fetchImpl } = makeFetchImpl(messages, { [BRIEF_MESSAGE_ID]: {} });
    const { impl: baseExecGh, calls, state } = makeExecGh({ [PR_NUMBER]: {} });
    let dispatchShouldFail = true;
    const execGh = vi.fn((args: string[]) => {
      if (args[0] === 'workflow' && args[1] === 'run' && dispatchShouldFail) {
        calls.push(args); // record even though about to throw — baseExecGh's own push never runs in that case
        throw new Error('simulated gh workflow run failure');
      }
      return baseExecGh(args);
    });
    const execGit = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    expect(calls.some((c) => c[0] === 'workflow' && c[1] === 'run')).toBe(true); // it did try
    expect(state[PR_NUMBER].comments.some((c) => c.startsWith('replan-dispatched:'))).toBe(false); // but never marked as dispatched

    dispatchShouldFail = false;
    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    const dispatchCalls = calls.filter((c) => c[0] === 'workflow' && c[1] === 'run');
    expect(dispatchCalls).toHaveLength(2); // the failed attempt, then the successful retry
    expect(state[PR_NUMBER].comments.some((c) => c.startsWith('replan-dispatched: 2026-W38'))).toBe(true);
  });
});

// LOW (Codex round 2): a marker/dedupe comment from ANY commenter used to
// count — a founder or any other collaborator could spoof either marker and
// suppress the real thing.
describe('LOW — marker/dedupe comments only count when authored by the poll itself', () => {
  it('a replan-dispatched marker posted by someone else is ignored -- the real dispatch still fires', async () => {
    vi.setSystemTime(new Date('2026-09-15T14:00:00.000Z')); // Tuesday, before the cut-off
    const messages = [refMessage({ id: BRIEF_MESSAGE_ID, scope: 'brief' }), replyMessage({ id: 'reply-1', parentId: BRIEF_MESSAGE_ID, content: 'first reply' })];
    const { impl: fetchImpl } = makeFetchImpl(messages, { [BRIEF_MESSAGE_ID]: {} });
    const { impl: execGh, calls, state } = makeExecGh({
      [PR_NUMBER]: { comments: [{ body: 'replan-dispatched: 2026-W38', author: OTHER_COMMENTER }] },
    });
    const execGit = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    expect(calls.some((c) => c[0] === 'workflow' && c[1] === 'run')).toBe(true); // the spoofed marker did not suppress it
    expect(state[PR_NUMBER].comments.filter((c) => c.startsWith('replan-dispatched: 2026-W38'))).toHaveLength(2); // the spoofed one, plus our own real one
  });

  it('a discord-reply marker posted by someone else is ignored -- the real reply still relays', async () => {
    const messages = [refMessage({ id: BRIEF_MESSAGE_ID, scope: 'brief' }), replyMessage({ id: 'reply-1', parentId: BRIEF_MESSAGE_ID, content: 'a real reply' })];
    const { impl: fetchImpl } = makeFetchImpl(messages, { [BRIEF_MESSAGE_ID]: {} });
    const { impl: execGh, state } = makeExecGh({
      [PR_NUMBER]: { comments: [{ body: 'discord-reply: reply-1', author: OTHER_COMMENTER }] },
    });
    const execGit = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    const relayed = state[PR_NUMBER].comments.filter((c) => c.includes('discord-reply: reply-1'));
    expect(relayed).toHaveLength(2); // the spoofed one, plus our own real relay
    expect(relayed.some((c) => c.includes('a real reply'))).toBe(true);
  });
});
