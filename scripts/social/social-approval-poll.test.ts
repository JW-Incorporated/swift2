// Covers S1 (poll survives Discord rate limits) — discordGet's 429 retry/
// backoff and the per-message continue-on-failure behavior in run(). Both
// scheduled runs on 2026-09-11 (08:06Z and 12:47Z) failed with a raw
// `429 retry_after 1.035` because the old discordGet threw on the first 429
// it ever saw; these tests pin the fix so it can't regress silently.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
// @ts-expect-error — implementation is plain .mjs
import { run } from './social-approval-poll.mjs';
import { SOCIAL_APPROVERS } from './lib/approvers.mjs';
import { isoWeek, PENCIL_UNSUPPORTED_ON_HEADER } from './lib/feedback.mjs';
import { approvalStatus, contentHash, signApproval } from './lib/queue.mjs';

const CHECK_MARK = '%E2%9C%85';
const CROSS_MARK = '%E2%9D%8C';
const PENCIL_MARK = '%E2%9C%8F%EF%B8%8F';
const REPO = 'JW-Incorporated/swift2';
const WEBHOOK_URL = 'https://discord.com/api/webhooks/999999999999999999/faketoken';
const CHANNEL_ID = '111111111111111111';
const BOT_TOKEN = 'fake-bot-token';
const MESSAGE_ID = '222222222222222222';
const PR_NUMBER = 4200;
const HEAD_SHA = 'a'.repeat(40);
const TEST_KEY = 'test-signing-key';
const QUEUE_FILE = '2026-09-20-example-x.json';
const APPROVER = SOCIAL_APPROVERS[0];
const APPROVER_SNOWFLAKE = APPROVER.slice('discord:'.length);
const NON_APPROVER_SNOWFLAKE = '888888888888888888';
const STALE_SHA = 'b'.repeat(40);

let root: string;
let savedEnv: NodeJS.ProcessEnv;
let savedCwd: string;

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

const HEADER_MESSAGE_ID = '333333333333333333';

function briefMessage() {
  return {
    id: MESSAGE_ID,
    webhook_id: '999999999999999999',
    content: `Draft 1 · X\nref: PR #${PR_NUMBER} · ${HEAD_SHA} · social/queue/${QUEUE_FILE}`,
  };
}

function headerMessage() {
  return {
    id: HEADER_MESSAGE_ID,
    webhook_id: '999999999999999999',
    content: `PR #${PR_NUMBER} · 1 draft\nref: PR #${PR_NUMBER} · ${HEAD_SHA} · *`,
  };
}

function makeFetchImpl(script: { check: Array<() => unknown>; cross?: Array<() => unknown>; pencil?: Array<() => unknown> }) {
  const calls = { messages: 0, check: 0, cross: 0, pencil: 0 };
  const crossScript = script.cross ?? [() => jsonResponse([])];
  const pencilScript = script.pencil ?? [() => jsonResponse([])];
  const impl = vi.fn(async (url: string) => {
    if (url.includes(`/reactions/${CHECK_MARK}`)) {
      const i = Math.min(calls.check++, script.check.length - 1);
      return script.check[i]();
    }
    if (url.includes(`/reactions/${CROSS_MARK}`)) {
      const i = Math.min(calls.cross++, crossScript.length - 1);
      return crossScript[i]();
    }
    if (url.includes(`/reactions/${PENCIL_MARK}`)) {
      const i = Math.min(calls.pencil++, pencilScript.length - 1);
      return pencilScript[i]();
    }
    if (url.includes('/messages?limit=100')) {
      calls.messages++;
      return jsonResponse([briefMessage()]);
    }
    throw new Error(`unexpected fetchImpl url: ${url}`);
  });
  return { impl, calls };
}

/** Fetches reactions keyed per message id, so a header message and a
 * draft's own message can be scripted independently in the same PR. */
function makeFetchImplByMessage(
  messages: Array<{ id: string; content: string }>,
  byMessage: Record<string, { check?: Array<() => unknown>; cross?: Array<() => unknown>; pencil?: Array<() => unknown> }>,
) {
  const calls = new Map<string, { check: number; cross: number; pencil: number }>();
  const impl = vi.fn(async (url: string) => {
    if (url.includes('/messages?limit=100')) return jsonResponse(messages);
    for (const [id, script] of Object.entries(byMessage)) {
      const checkScript = script.check ?? [() => jsonResponse([])];
      const crossScript = script.cross ?? [() => jsonResponse([])];
      const pencilScript = script.pencil ?? [() => jsonResponse([])];
      if (!calls.has(id)) calls.set(id, { check: 0, cross: 0, pencil: 0 });
      const c = calls.get(id)!;
      if (url.includes(`/messages/${id}/reactions/${CHECK_MARK}`)) {
        const i = Math.min(c.check++, checkScript.length - 1);
        return checkScript[i]();
      }
      if (url.includes(`/messages/${id}/reactions/${CROSS_MARK}`)) {
        const i = Math.min(c.cross++, crossScript.length - 1);
        return crossScript[i]();
      }
      if (url.includes(`/messages/${id}/reactions/${PENCIL_MARK}`)) {
        const i = Math.min(c.pencil++, pencilScript.length - 1);
        return pencilScript[i]();
      }
    }
    throw new Error(`unexpected fetchImpl url: ${url}`);
  });
  return { impl, calls };
}

function makeExecGh({ files = [] as Array<{ path: string }> } = {}) {
  const calls: string[][] = [];
  const impl = vi.fn((args: string[]) => {
    calls.push(args);
    if (args[0] === 'pr' && args[1] === 'view' && args.includes('headRefOid,headRefName,state,number')) {
      return JSON.stringify({ headRefOid: HEAD_SHA, headRefName: 'feature/x', state: 'OPEN', number: PR_NUMBER });
    }
    if (args[0] === 'pr' && args[1] === 'view' && args.includes('files')) {
      return JSON.stringify({ files }); // empty keeps the merge phase inert for these tests
    }
    return '';
  });
  return { impl, calls };
}

function makeExecGit({ revParseHead = HEAD_SHA }: { revParseHead?: string } = {}) {
  const calls: string[][] = [];
  const impl = vi.fn((args: string[]) => {
    calls.push(args);
    if (args[0] === 'rev-parse' && args[1] === 'HEAD') return revParseHead;
    return '';
  });
  return { impl, calls };
}

beforeEach(async () => {
  savedEnv = process.env;
  savedCwd = process.cwd();
  root = await mkdtemp(path.join(tmpdir(), 'social-approval-poll-test-'));
  await mkdir(path.join(root, 'social', 'queue'), { recursive: true });
  await writeFile(
    path.join(root, 'social', 'queue', QUEUE_FILE),
    JSON.stringify({ platform: 'x', body: 'hello world', scheduledAt: '2026-09-20T00:00:00Z' }, null, 2) + '\n',
  );
  process.chdir(root);
  process.env = {
    ...savedEnv,
    DISCORD_BOT_TOKEN: BOT_TOKEN,
    SOCIAL_APPROVAL_WEBHOOK_URL: WEBHOOK_URL,
    SOCIAL_APPROVAL_KEY: TEST_KEY,
    GH_TOKEN: 'fake-gh-token',
    REPO,
  };
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
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  process.chdir(savedCwd);
  process.env = savedEnv;
  process.exitCode = 0;
  await rm(root, { recursive: true, force: true });
});

describe('discordGet 429 handling', () => {
  it('a 429-then-200 reaction fetch results in the message being stamped', async () => {
    const { impl: fetchImpl, calls } = makeFetchImpl({
      check: [
        () => jsonResponse({ message: '429: You are being rate limited.', retry_after: 0.01, global: false }, 429),
        () => jsonResponse([{ id: APPROVER_SNOWFLAKE }]),
      ],
    });
    const { impl: execGh } = makeExecGh();
    const { impl: execGit } = makeExecGit();
    const sleepImpl = vi.fn(() => Promise.resolve());

    await run({ execGh, execGit, fetchImpl, sleepImpl });

    expect(calls.check).toBe(2); // one 429, one retry that succeeded
    const raw = await readFile(path.join(root, 'social', 'queue', QUEUE_FILE), 'utf8');
    const item = JSON.parse(raw);
    expect(item.approval?.by).toBe(APPROVER);
    expect(approvalStatus(item, { approvers: SOCIAL_APPROVERS, key: TEST_KEY }).ok).toBe(true);
    expect(process.exitCode).toBe(0);
  });

  it('stamp commits and pushes to the PR\'s own head branch (headRefName), never main — checkout happens via gh, writes via git', async () => {
    const { impl: fetchImpl } = makeFetchImpl({
      check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])],
    });
    const { impl: execGh, calls: ghCalls } = makeExecGh();
    const { impl: execGit, calls: gitCalls } = makeExecGit();
    const sleepImpl = vi.fn(() => Promise.resolve());

    await run({ execGh, execGit, fetchImpl, sleepImpl });

    // gh checks out the PR's branch before any local git write happens.
    expect(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'checkout' && c[2] === String(PR_NUMBER))).toBe(true);
    const checkoutIdx = ghCalls.findIndex((c) => c[0] === 'pr' && c[1] === 'checkout');
    const addIdx = gitCalls.findIndex((c) => c[0] === 'add');
    expect(checkoutIdx).toBeGreaterThanOrEqual(0);
    expect(addIdx).toBeGreaterThanOrEqual(0);
    // The stamp/commit/push sequence goes through git, never gh.
    expect(ghCalls.some((c) => c[0] === 'add' || c[0] === 'commit' || c[0] === 'push' || c[0] === 'rm')).toBe(false);
    expect(gitCalls.some((c) => c[0] === 'add')).toBe(true);
    expect(gitCalls.some((c) => c[0] === 'commit')).toBe(true);
    const pushCall = gitCalls.find((c) => c[0] === 'push');
    expect(pushCall).toEqual(['push', 'origin', 'HEAD:feature/x']); // headRefName from makeExecGh's pr view stub, never main
    expect(process.exitCode).toBe(0);
  });

  it('a 3x429 reaction fetch (exceeding retries) skips that message, logs a ::warning::, and the run still exits 0', async () => {
    const { impl: fetchImpl, calls } = makeFetchImpl({
      check: [
        () => jsonResponse({ message: '429', retry_after: 0.01, global: false }, 429),
        () => jsonResponse({ message: '429', retry_after: 0.01, global: false }, 429),
        () => jsonResponse({ message: '429', retry_after: 0.01, global: false }, 429),
      ],
    });
    const { impl: execGh } = makeExecGh();
    const { impl: execGit } = makeExecGit();
    const sleepImpl = vi.fn(() => Promise.resolve());
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(run({ execGh, execGit, fetchImpl, sleepImpl })).resolves.toBeUndefined();

    expect(calls.check).toBe(3);
    expect(errorSpy.mock.calls.some(([msg]) => typeof msg === 'string' && msg.includes('::warning::'))).toBe(true);
    const raw = await readFile(path.join(root, 'social', 'queue', QUEUE_FILE), 'utf8');
    const item = JSON.parse(raw);
    expect(item.approval).toBeUndefined();
    expect(process.exitCode).toBe(0);
  });

  it('a header ✅ never stamps a draft whose OWN message failed to fetch (exhausted retries) — an unreadable message could carry a ❌', async () => {
    const { impl: fetchImpl } = makeFetchImplByMessage([headerMessage(), briefMessage()], {
      [HEADER_MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] }, // header itself: readable, approved
      [MESSAGE_ID]: {
        check: [
          () => jsonResponse({ message: '429', retry_after: 0.01, global: false }, 429),
          () => jsonResponse({ message: '429', retry_after: 0.01, global: false }, 429),
          () => jsonResponse({ message: '429', retry_after: 0.01, global: false }, 429),
        ],
      },
    });
    const { impl: execGh } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit } = makeExecGit();
    const sleepImpl = vi.fn(() => Promise.resolve());
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await run({ execGh, execGit, fetchImpl, sleepImpl });

    expect(errorSpy.mock.calls.some(([msg]) => typeof msg === 'string' && msg.includes('::warning::'))).toBe(true);
    const raw = await readFile(path.join(root, 'social', 'queue', QUEUE_FILE), 'utf8');
    const item = JSON.parse(raw);
    expect(item.approval).toBeUndefined(); // header approval must not stamp through an unreadable draft message
    expect(process.exitCode).toBe(0);
  });

  it('an unresolved header blocks stamp/merge for the WHOLE PR, even a draft with its own successfully-fetched ✅', async () => {
    const { impl: fetchImpl } = makeFetchImplByMessage([headerMessage(), briefMessage()], {
      [HEADER_MESSAGE_ID]: {
        check: [
          () => jsonResponse({ message: '429', retry_after: 0.01, global: false }, 429),
          () => jsonResponse({ message: '429', retry_after: 0.01, global: false }, 429),
          () => jsonResponse({ message: '429', retry_after: 0.01, global: false }, 429),
        ],
      }, // header itself: unresolved after exhausting retries — could carry an unseen PR-wide ❌
      [MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] }, // draft: readable, individually approved
    });
    const { impl: execGh, calls: ghCalls } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit } = makeExecGit();
    const sleepImpl = vi.fn(() => Promise.resolve());
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await run({ execGh, execGit, fetchImpl, sleepImpl });

    expect(
      errorSpy.mock.calls.some(
        ([msg]) => typeof msg === 'string' && msg.includes('::warning::') && msg.includes(String(PR_NUMBER)) && msg.includes('header'),
      ),
    ).toBe(true);
    const raw = await readFile(path.join(root, 'social', 'queue', QUEUE_FILE), 'utf8');
    const item = JSON.parse(raw);
    expect(item.approval).toBeUndefined(); // individually-readable draft ✅ must not stamp when the PR's header is unresolved
    expect(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'merge')).toBe(false);
    expect(process.exitCode).toBe(0);
  });

  it('a previously-stamped draft does NOT merge when a DIFFERENT remaining draft in the same PR has unresolved reactions this run (Codex finding, PR #4124)', async () => {
    const QUEUE_FILE_B = '2026-09-21-example-y.json';
    const itemA = { platform: 'x', body: 'hello world', scheduledAt: '2026-09-20T00:00:00Z' };
    const approvalWithoutSig = { v: 2, by: APPROVER, at: '2026-09-10T00:00:00Z', pr: PR_NUMBER, message: MESSAGE_ID, contentHash: contentHash(itemA) };
    const stampedItemA = { ...itemA, approval: { ...approvalWithoutSig, sig: signApproval(approvalWithoutSig, TEST_KEY) } };
    await writeFile(path.join(root, 'social', 'queue', QUEUE_FILE), JSON.stringify(stampedItemA, null, 2) + '\n');
    await writeFile(
      path.join(root, 'social', 'queue', QUEUE_FILE_B),
      JSON.stringify({ platform: 'x', body: 'second draft', scheduledAt: '2026-09-21T00:00:00Z' }, null, 2) + '\n',
    );

    const DRAFT_B_MESSAGE_ID = '444444444444444444';
    const draftBMessage = {
      id: DRAFT_B_MESSAGE_ID,
      webhook_id: '999999999999999999',
      content: `Draft 2 · Y\nref: PR #${PR_NUMBER} · ${HEAD_SHA} · social/queue/${QUEUE_FILE_B}`,
    };

    const { impl: fetchImpl } = makeFetchImplByMessage([headerMessage(), briefMessage(), draftBMessage], {
      [HEADER_MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] }, // header: readable, approved
      [MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] }, // draft A: readable, individually approved (already stamped)
      [DRAFT_B_MESSAGE_ID]: {
        check: [
          () => jsonResponse({ message: '429', retry_after: 0.01, global: false }, 429),
          () => jsonResponse({ message: '429', retry_after: 0.01, global: false }, 429),
          () => jsonResponse({ message: '429', retry_after: 0.01, global: false }, 429),
        ],
      }, // draft B: reaction fetch exhausts retries — unresolved this run
    });
    const { impl: execGh, calls: ghCalls } = makeExecGh({
      files: [{ path: `social/queue/${QUEUE_FILE}` }, { path: `social/queue/${QUEUE_FILE_B}` }],
    });
    const { impl: execGit } = makeExecGit();
    const sleepImpl = vi.fn(() => Promise.resolve());
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await run({ execGh, execGit, fetchImpl, sleepImpl });

    expect(
      errorSpy.mock.calls.some(
        ([msg]) => typeof msg === 'string' && msg.includes('::warning::') && msg.includes(String(PR_NUMBER)) && msg.includes(QUEUE_FILE_B),
      ),
    ).toBe(true);
    // draft A's own valid, previously-stamped approval must not be enough to merge
    // while draft B in the same PR carries an unresolved (possibly ❌) reaction message.
    expect(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'merge')).toBe(false);
    expect(process.exitCode).toBe(0);
  });
});

// S3 reason protocol (docs/specs/tree-overhaul/s3-reason-protocol.md) —
// AC1-AC8e.
function replyMessage({ id, parentId, authorId = APPROVER, content = 'a reason', timestamp = '2026-09-20T12:00:00Z' }: { id: string; parentId: string; authorId?: string; content?: string; timestamp?: string }) {
  return { id, author: { id: authorId.replace('discord:', '') }, content, timestamp, message_reference: { message_id: parentId } };
}

/** Wraps a base fetchImpl (GET-only, e.g. from makeFetchImplByMessage) so a
 * POST (nudge / edit-failure notice / "merged before approval") is captured
 * instead of falling through to that mock's "unexpected url" throw. */
function withPostCapture(baseImpl: (url: string, init?: RequestInit) => unknown) {
  const posts: Array<{ url: string; body: Record<string, unknown> }> = [];
  const impl = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === 'POST') {
      posts.push({ url, body: init.body ? JSON.parse(String(init.body)) : {} });
      return jsonResponse({ id: 'posted' });
    }
    return baseImpl(url, init);
  });
  return { impl, posts };
}

async function readQueueItem() {
  const raw = await readFile(path.join(root, 'social', 'queue', QUEUE_FILE), 'utf8');
  return JSON.parse(raw);
}

async function readLedgerLines() {
  const week = isoWeek(new Date());
  const p = path.join(root, 'social', 'feedback', `${week}.jsonl`);
  try {
    const raw = await readFile(p, 'utf8');
    return raw
      .split('\n')
      .filter((l) => l.trim() !== '')
      .map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

describe('S3 reason protocol', () => {
  it('AC1: ✏️ with a qualifying reply replaces the body, records edit provenance, and merges', async () => {
    const { impl: baseImpl } = makeFetchImplByMessage([briefMessage(), replyMessage({ id: 'reply-1', parentId: MESSAGE_ID, content: 'On 22 Oct 2012, Taylor...' })], {
      [MESSAGE_ID]: { check: [() => jsonResponse([])], pencil: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
    });
    const { impl: fetchImpl } = withPostCapture(baseImpl);
    const { impl: execGh, calls: ghCalls } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit, calls: gitCalls } = makeExecGit();
    const sleepImpl = vi.fn(() => Promise.resolve());
    const checkDraftImpl = vi.fn(() => ({ ok: true, findings: [] }));

    await run({ execGh, execGit, fetchImpl, sleepImpl, checkDraftImpl });

    const item = await readQueueItem();
    expect(item.body).toBe('On 22 Oct 2012, Taylor...');
    expect(item.edit).toEqual({ by: APPROVER, at: expect.any(String), message: MESSAGE_ID, fromBody: 'hello world' });
    expect(approvalStatus(item, { approvers: SOCIAL_APPROVERS, key: TEST_KEY }).ok).toBe(true);
    expect(checkDraftImpl).toHaveBeenCalledWith(path.posix.join('social', 'queue', QUEUE_FILE));
    // one commit for the edit+stamp on the PR's own branch, not two — the
    // ledger commit (if any) is a separate, later commit on social-ledger.
    expect(gitCalls.filter((c) => c[0] === 'commit' && c[2]?.startsWith('social-approval: edit '))).toHaveLength(1);
    expect(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'merge')).toBe(true);
    const rows = await readLedgerLines();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ pr: PR_NUMBER, action: 'edit', editedBody: 'On 22 Oct 2012, Taylor...', approver: APPROVER });
  });

  it('AC2: ✏️ with no reply leaves the file untouched and writes no ledger row, across two consecutive runs', async () => {
    for (let i = 0; i < 2; i++) {
      const { impl: baseImpl } = makeFetchImplByMessage([briefMessage()], {
        [MESSAGE_ID]: { pencil: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
      });
      const { impl: fetchImpl } = withPostCapture(baseImpl);
      const { impl: execGh } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
      const { impl: execGit } = makeExecGit();
      await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

      const item = await readQueueItem();
      expect(item.edit).toBeUndefined();
      expect(item.approval).toBeUndefined();
    }
    expect(await readLedgerLines()).toHaveLength(0);
  });

  it('AC3: ❌ with a reply removes only that file, comments "reject: <file> — <reason>", and writes an action:"reject" row', async () => {
    const { impl: baseImpl } = makeFetchImplByMessage([briefMessage(), replyMessage({ id: 'reply-1', parentId: MESSAGE_ID, content: 'too salesy' })], {
      [MESSAGE_ID]: { cross: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
    });
    const { impl: fetchImpl } = withPostCapture(baseImpl);
    const { impl: execGh, calls: ghCalls } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit, calls: gitCalls } = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    expect(gitCalls.some((c) => c[0] === 'rm' && c[1] === path.posix.join('social', 'queue', QUEUE_FILE))).toBe(true);
    const commentCall = ghCalls.find((c) => c[0] === 'pr' && c[1] === 'comment');
    expect(commentCall?.[commentCall.length - 1]).toBe(`reject: social/queue/${QUEUE_FILE} — too salesy`);
    const rows = await readLedgerLines();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ pr: PR_NUMBER, action: 'reject', reason: 'too salesy', approver: APPROVER });
  });

  it('AC4: ❌ with no reply does not close the PR or remove the file, and posts exactly one nudge within 24h', async () => {
    const { impl: baseImpl1 } = makeFetchImplByMessage([briefMessage()], { [MESSAGE_ID]: { cross: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
    const { impl: fetchImpl1, posts: posts1 } = withPostCapture(baseImpl1);
    const { impl: execGh1, calls: ghCalls1 } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit1, calls: gitCalls1 } = makeExecGit();

    await run({ execGh: execGh1, execGit: execGit1, fetchImpl: fetchImpl1, sleepImpl: vi.fn(() => Promise.resolve()) });

    expect(ghCalls1.some((c) => c[0] === 'pr' && c[1] === 'close')).toBe(false);
    expect(gitCalls1.some((c) => c[0] === 'rm')).toBe(false);
    const nudges1 = posts1.filter((p) => typeof p.body.content === 'string' && (p.body.content as string).includes(`nudge: PR #${PR_NUMBER}`));
    expect(nudges1).toHaveLength(1);

    const nudgeMessage = { id: 'nudge-1', webhook_id: '999999999999999999', content: nudges1[0].body.content as string, timestamp: new Date().toISOString() };
    const { impl: baseImpl2 } = makeFetchImplByMessage([briefMessage(), nudgeMessage], { [MESSAGE_ID]: { cross: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
    const { impl: fetchImpl2, posts: posts2 } = withPostCapture(baseImpl2);
    const { impl: execGh2 } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit2 } = makeExecGit();

    await run({ execGh: execGh2, execGit: execGit2, fetchImpl: fetchImpl2, sleepImpl: vi.fn(() => Promise.resolve()) });

    const nudges2 = posts2.filter((p) => typeof p.body.content === 'string' && (p.body.content as string).includes(`nudge: PR #${PR_NUMBER}`));
    expect(nudges2).toHaveLength(0);
  });

  it('AC5 + AC7: ✅ writes an action:"approve" row with reason:null, and a second run against the same state writes no duplicate', async () => {
    const { impl: baseImpl1 } = makeFetchImplByMessage([briefMessage()], { [MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
    const { impl: fetchImpl1 } = withPostCapture(baseImpl1);
    const { impl: execGh1 } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit1 } = makeExecGit();
    await run({ execGh: execGh1, execGit: execGit1, fetchImpl: fetchImpl1, sleepImpl: vi.fn(() => Promise.resolve()) });

    let rows = await readLedgerLines();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ action: 'approve', reason: null, replyId: null });

    // Second run: the file is now stamped, so nothing new should stamp or log.
    const { impl: baseImpl2 } = makeFetchImplByMessage([briefMessage()], { [MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
    const { impl: fetchImpl2 } = withPostCapture(baseImpl2);
    const { impl: execGh2 } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit2 } = makeExecGit();
    await run({ execGh: execGh2, execGit: execGit2, fetchImpl: fetchImpl2, sleepImpl: vi.fn(() => Promise.resolve()) });

    rows = await readLedgerLines();
    expect(rows).toHaveLength(1); // idempotent — no duplicate row
  });

  it('AC6: a reply from a Discord id not in SOCIAL_APPROVERS does not satisfy the reply requirement', async () => {
    const { impl: baseImpl } = makeFetchImplByMessage(
      [briefMessage(), replyMessage({ id: 'reply-1', parentId: MESSAGE_ID, authorId: `discord:${NON_APPROVER_SNOWFLAKE}`, content: 'not an approver' })],
      { [MESSAGE_ID]: { cross: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } },
    );
    const { impl: fetchImpl } = withPostCapture(baseImpl);
    const { impl: execGh, calls: ghCalls } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit, calls: gitCalls } = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    expect(gitCalls.some((c) => c[0] === 'rm')).toBe(false);
    expect(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'close')).toBe(false);
    expect(await readLedgerLines()).toHaveLength(0);
  });

  describe('#4127 stale-SHA honouring', () => {
    function staleBriefMessage() {
      return { id: MESSAGE_ID, webhook_id: '999999999999999999', content: `Draft 1 · X\nref: PR #${PR_NUMBER} · ${STALE_SHA} · social/queue/${QUEUE_FILE}` };
    }

    function honouredStampedItem() {
      const base = { platform: 'x', body: 'hello world', scheduledAt: '2026-09-20T00:00:00Z' };
      const approvalWithoutSig = { v: 2, by: APPROVER, at: '2026-09-10T00:00:00Z', pr: PR_NUMBER, message: MESSAGE_ID, contentHash: contentHash(base) };
      return { ...base, approval: { ...approvalWithoutSig, sig: signApproval(approvalWithoutSig, TEST_KEY) } };
    }

    function makeExecGitForHonouring({
      diffPaths,
      revParseHead = HEAD_SHA,
      staleItem = { platform: 'x', body: 'hello world', scheduledAt: '2026-09-20T00:00:00Z' },
      log = [] as Array<{ author: string; subject: string }>,
    }: {
      diffPaths: string[];
      revParseHead?: string;
      staleItem?: unknown;
      log?: Array<{ author: string; subject: string }>;
    }) {
      const calls: string[][] = [];
      const headContent = JSON.stringify(honouredStampedItem());
      const staleContent = JSON.stringify(staleItem);
      const impl = vi.fn((args: string[]) => {
        calls.push(args);
        if (args[0] === 'rev-parse' && args[1] === 'HEAD') return revParseHead;
        if (args[0] === 'fetch') return '';
        if (args[0] === 'show') {
          const [sha, ...pathParts] = args[1].split(':');
          const filePath = pathParts.join(':');
          if (filePath !== path.posix.join('social', 'queue', QUEUE_FILE)) throw new Error(`unexpected git show path: ${args[1]}`);
          if (sha === HEAD_SHA) return headContent;
          if (sha === STALE_SHA) return staleContent;
          throw new Error(`unexpected git show sha: ${args[1]}`);
        }
        if (args[0] === 'diff' && args[1] === '--name-only') return diffPaths.join('\n');
        if (args[0] === 'log') return log.map((c) => `${c.author}\t${c.subject}`).join('\n');
        return '';
      });
      return { impl, calls };
    }

    it('AC8: a PR stamped in run N whose head SHA advanced past the brief\'s ref: line still merges in run N+1', async () => {
      await writeFile(path.join(root, 'social', 'queue', QUEUE_FILE), JSON.stringify(honouredStampedItem(), null, 2) + '\n');
      const { impl: baseImpl } = makeFetchImplByMessage([staleBriefMessage()], { [MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
      const { impl: fetchImpl } = withPostCapture(baseImpl);
      const { impl: execGh, calls: ghCalls } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
      const { impl: execGit } = makeExecGitForHonouring({ diffPaths: [path.posix.join('social', 'queue', QUEUE_FILE)] });

      await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

      expect(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'merge')).toBe(true);
    });

    it('AC8b: honouring is refused when the stale->head diff touches a path outside social/queue/**.json', async () => {
      await writeFile(path.join(root, 'social', 'queue', QUEUE_FILE), JSON.stringify(honouredStampedItem(), null, 2) + '\n');
      const { impl: baseImpl } = makeFetchImplByMessage([staleBriefMessage()], { [MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
      const { impl: fetchImpl } = withPostCapture(baseImpl);
      const { impl: execGh, calls: ghCalls } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
      const { impl: execGit } = makeExecGitForHonouring({ diffPaths: ['apps/web/public/social/library/photos/some-photo.jpg'] });

      await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

      expect(ghCalls.some((c) => c[1] === 'checkout')).toBe(false); // dropped before ever reaching local git work
      expect(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'merge')).toBe(false);
    });

    it('AC8c: a ❌ arriving on an honoured (stale-SHA) message still rejects the file', async () => {
      await writeFile(path.join(root, 'social', 'queue', QUEUE_FILE), JSON.stringify(honouredStampedItem(), null, 2) + '\n');
      const { impl: baseImpl } = makeFetchImplByMessage([staleBriefMessage(), replyMessage({ id: 'reply-1', parentId: MESSAGE_ID, content: 'wrong photo' })], {
        [MESSAGE_ID]: { cross: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
      });
      const { impl: fetchImpl } = withPostCapture(baseImpl);
      const { impl: execGh } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
      const { impl: execGit, calls: gitCalls } = makeExecGitForHonouring({ diffPaths: [path.posix.join('social', 'queue', QUEUE_FILE)] });

      await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

      expect(gitCalls.some((c) => c[0] === 'rm')).toBe(true);
      const rows = await readLedgerLines();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ action: 'reject', reason: 'wrong photo' });
    });

    function staleHeaderMessage() {
      return { id: HEADER_MESSAGE_ID, webhook_id: '999999999999999999', content: `PR #${PR_NUMBER} · 1 draft\nref: PR #${PR_NUMBER} · ${STALE_SHA} · *` };
    }

    it('finding 4a: a stale header ❌ with a qualifying reply still closes the PR (honoured, not dropped)', async () => {
      const { impl: baseImpl } = makeFetchImplByMessage([staleHeaderMessage(), replyMessage({ id: 'reply-1', parentId: HEADER_MESSAGE_ID, content: 'campaign is dead' })], {
        [HEADER_MESSAGE_ID]: { cross: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
      });
      const { impl: fetchImpl } = withPostCapture(baseImpl);
      const { impl: execGh, calls: ghCalls } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
      const { impl: execGit } = makeExecGit();

      await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

      const closeCall = ghCalls.find((c) => c[0] === 'pr' && c[1] === 'close');
      expect(closeCall).toBeDefined();
      expect(closeCall?.[closeCall.length - 1]).toContain('campaign is dead');
      const rows = await readLedgerLines();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ action: 'reject', file: '*', reason: 'campaign is dead', messageId: HEADER_MESSAGE_ID });
    });

    it('finding 5: honouring is refused when only an unsigned field (mediaCredit) changed on the file between stale and head', async () => {
      await writeFile(path.join(root, 'social', 'queue', QUEUE_FILE), JSON.stringify(honouredStampedItem(), null, 2) + '\n');
      const { impl: baseImpl } = makeFetchImplByMessage([staleBriefMessage()], { [MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
      const { impl: fetchImpl } = withPostCapture(baseImpl);
      const { impl: execGh, calls: ghCalls } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
      const staleItemWithMediaCredit = { platform: 'x', body: 'hello world', scheduledAt: '2026-09-20T00:00:00Z', mediaCredit: 'a different credit' };
      const { impl: execGit } = makeExecGitForHonouring({ diffPaths: [path.posix.join('social', 'queue', QUEUE_FILE)], staleItem: staleItemWithMediaCredit });

      await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

      expect(ghCalls.some((c) => c[1] === 'checkout')).toBe(false); // dropped before ever reaching local git work, same bar as AC8b
      expect(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'merge')).toBe(false);
    });

    it('finding 9: a legitimately-rejected sibling file\'s deletion does not strand honouring the rest of the diff', async () => {
      await writeFile(path.join(root, 'social', 'queue', QUEUE_FILE), JSON.stringify(honouredStampedItem(), null, 2) + '\n');
      const REJECTED_FILE = 'social/queue/2026-09-19-rejected-sibling.json';
      const { impl: baseImpl } = makeFetchImplByMessage([staleBriefMessage()], { [MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
      const { impl: fetchImpl } = withPostCapture(baseImpl);
      const { impl: execGh, calls: ghCalls } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
      const { impl: execGit } = makeExecGitForHonouring({
        diffPaths: [path.posix.join('social', 'queue', QUEUE_FILE), REJECTED_FILE],
        log: [{ author: 'github-actions[bot] <github-actions[bot]@users.noreply.github.com>', subject: `social-approval: reject ${REJECTED_FILE} (founder ❌ in Discord)` }],
      });

      await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

      expect(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'merge')).toBe(true);
    });

    it('finding 9 (negative): a deletion NOT matching the poll\'s own verifiable commit shape still strands honouring', async () => {
      await writeFile(path.join(root, 'social', 'queue', QUEUE_FILE), JSON.stringify(honouredStampedItem(), null, 2) + '\n');
      const REJECTED_FILE = 'social/queue/2026-09-19-rejected-sibling.json';
      const { impl: baseImpl } = makeFetchImplByMessage([staleBriefMessage()], { [MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } });
      const { impl: fetchImpl } = withPostCapture(baseImpl);
      const { impl: execGh, calls: ghCalls } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
      const { impl: execGit } = makeExecGitForHonouring({
        diffPaths: [path.posix.join('social', 'queue', QUEUE_FILE), REJECTED_FILE],
        log: [{ author: 'someone-else <someone-else@example.com>', subject: `social-approval: reject ${REJECTED_FILE} (founder ❌ in Discord)` }],
      });

      await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

      expect(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'merge')).toBe(false);
    });
  });

  it('AC8d: an ✏️ reply that fails checkDraft leaves the file/ledger untouched and names the failing check', async () => {
    const { impl: baseImpl } = makeFetchImplByMessage([briefMessage(), replyMessage({ id: 'reply-1', parentId: MESSAGE_ID, content: 'a caption way over the limit' })], {
      [MESSAGE_ID]: { pencil: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
    });
    const { impl: fetchImpl, posts } = withPostCapture(baseImpl);
    const { impl: execGh } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit, calls: gitCalls } = makeExecGit();
    const checkDraftImpl = vi.fn(() => ({ ok: false, findings: ["length: weighted 321 exceeds X's real 280-character limit"] }));

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()), checkDraftImpl });

    const item = await readQueueItem();
    expect(item.body).toBe('hello world'); // reverted — never left half-applied
    expect(item.edit).toBeUndefined();
    expect(gitCalls.some((c) => c[0] === 'commit')).toBe(false);
    expect(await readLedgerLines()).toHaveLength(0);
    expect(posts.some((p) => typeof p.body.content === 'string' && (p.body.content as string).includes("weighted 321 exceeds X's real 280-character limit"))).toBe(true);
  });

  it('AC8e: an ✏️ on the * header changes nothing and produces the pencil-unsupported nudge', async () => {
    const { impl: baseImpl } = makeFetchImplByMessage([headerMessage(), replyMessage({ id: 'reply-1', parentId: HEADER_MESSAGE_ID, content: 'a fix for both platforms' })], {
      [HEADER_MESSAGE_ID]: { pencil: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
    });
    const { impl: fetchImpl, posts } = withPostCapture(baseImpl);
    const { impl: execGh, calls: ghCalls } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit } = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    expect(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'close')).toBe(false);
    expect(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'merge')).toBe(false);
    expect(posts.some((p) => typeof p.body.content === 'string' && (p.body.content as string).includes(PENCIL_UNSUPPORTED_ON_HEADER))).toBe(true);
  });

  it('finding 1: the real (non-mocked) checkDraft path enforces a real check without shelling out to a subprocess', async () => {
    // `platform` is invalid regardless of any repo context (checkSchema
    // short-circuits checkDraft before any context-dependent rule runs), so
    // this is deterministic. The OLD subprocess-based defaultCheckDraft
    // could never even find scripts/social/check-drafts.mjs relative to
    // this test's temp cwd (ENOENT) and would fail with a generic spawn
    // error; the real checker (imported once, trusted, at module load) can
    // and does report the ACTUAL schema violation by name.
    const badItem = { platform: 'not-a-real-platform', body: 'hello world', scheduledAt: '2026-09-20T00:00:00Z' };
    await writeFile(path.join(root, 'social', 'queue', QUEUE_FILE), JSON.stringify(badItem, null, 2) + '\n');
    const { impl: baseImpl } = makeFetchImplByMessage([briefMessage(), replyMessage({ id: 'reply-1', parentId: MESSAGE_ID, content: 'a fine replacement caption' })], {
      [MESSAGE_ID]: { pencil: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
    });
    const { impl: fetchImpl, posts } = withPostCapture(baseImpl);
    const { impl: execGh } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit, calls: gitCalls } = makeExecGit();

    // No checkDraftImpl override — exercises the REAL defaultCheckDraft.
    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    const item = await readQueueItem();
    expect(item.body).toBe('hello world'); // reverted — the real checker caught it, no subprocess needed
    expect(gitCalls.some((c) => c[0] === 'commit')).toBe(false);
    expect(posts.some((p) => typeof p.body.content === 'string' && (p.body.content as string).includes('platform') && (p.body.content as string).includes('must be one of'))).toBe(true);
  });

  it('finding 2: merge is called with --match-head-commit pinned to the final locally-validated SHA', async () => {
    const { impl: fetchImpl } = makeFetchImpl({ check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] });
    const { impl: execGh, calls: ghCalls } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit } = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    const mergeCall = ghCalls.find((c) => c[0] === 'pr' && c[1] === 'merge');
    expect(mergeCall).toBeDefined();
    const flagIdx = mergeCall?.indexOf('--match-head-commit') ?? -1;
    expect(flagIdx).toBeGreaterThan(-1);
    expect(mergeCall?.[flagIdx + 1]).toBe(HEAD_SHA);
  });

  it('finding 4b: two files approved via two DISTINCT messages in the same run each keep their OWN message id (never collapsed onto one)', async () => {
    const QUEUE_FILE_B = '2026-09-21-example-y.json';
    await writeFile(path.join(root, 'social', 'queue', QUEUE_FILE_B), JSON.stringify({ platform: 'x', body: 'second draft', scheduledAt: '2026-09-21T00:00:00Z' }, null, 2) + '\n');
    const DRAFT_B_MESSAGE_ID = '555555555555555555';
    const draftBMessage = { id: DRAFT_B_MESSAGE_ID, webhook_id: '999999999999999999', content: `Draft 2 · Y\nref: PR #${PR_NUMBER} · ${HEAD_SHA} · social/queue/${QUEUE_FILE_B}` };
    const OTHER_APPROVER = SOCIAL_APPROVERS[1];
    const OTHER_APPROVER_SNOWFLAKE = OTHER_APPROVER.slice('discord:'.length);

    const { impl: baseImpl } = makeFetchImplByMessage([briefMessage(), draftBMessage], {
      [MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
      [DRAFT_B_MESSAGE_ID]: { check: [() => jsonResponse([{ id: OTHER_APPROVER_SNOWFLAKE }])] },
    });
    const { impl: fetchImpl } = withPostCapture(baseImpl);
    const { impl: execGh } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }, { path: `social/queue/${QUEUE_FILE_B}` }] });
    const { impl: execGit } = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    const itemA = await readQueueItem();
    const itemB = JSON.parse(await readFile(path.join(root, 'social', 'queue', QUEUE_FILE_B), 'utf8'));
    expect(itemA.approval.message).toBe(MESSAGE_ID);
    expect(itemA.approval.by).toBe(APPROVER);
    expect(itemB.approval.message).toBe(DRAFT_B_MESSAGE_ID);
    expect(itemB.approval.by).toBe(OTHER_APPROVER);
    expect(approvalStatus(itemA, { approvers: SOCIAL_APPROVERS, key: TEST_KEY }).ok).toBe(true);
    expect(approvalStatus(itemB, { approvers: SOCIAL_APPROVERS, key: TEST_KEY }).ok).toBe(true);
  });

  it('finding 3a: a header ✅ does not stamp a file that has its own pending (no-reply) ✏️', async () => {
    const { impl: baseImpl } = makeFetchImplByMessage([headerMessage(), briefMessage()], {
      [HEADER_MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
      [MESSAGE_ID]: { pencil: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] }, // ✏️, no reply -> pending
    });
    const { impl: fetchImpl } = withPostCapture(baseImpl);
    const { impl: execGh, calls: ghCalls } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit, calls: gitCalls } = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    const item = await readQueueItem();
    expect(item.approval).toBeUndefined(); // must NOT have been stamped via the header's ✅
    expect(gitCalls.some((c) => c[0] === 'commit')).toBe(false);
    expect(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'merge')).toBe(false);
  });

  it('finding 3b: an already-stamped file with a pending (no-reply) ❌ this run does not merge', async () => {
    const itemA = { platform: 'x', body: 'hello world', scheduledAt: '2026-09-20T00:00:00Z' };
    const approvalWithoutSig = { v: 2, by: APPROVER, at: '2026-09-10T00:00:00Z', pr: PR_NUMBER, message: MESSAGE_ID, contentHash: contentHash(itemA) };
    const stampedItem = { ...itemA, approval: { ...approvalWithoutSig, sig: signApproval(approvalWithoutSig, TEST_KEY) } };
    await writeFile(path.join(root, 'social', 'queue', QUEUE_FILE), JSON.stringify(stampedItem, null, 2) + '\n');
    const { impl: baseImpl } = makeFetchImplByMessage([briefMessage()], { [MESSAGE_ID]: { cross: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] } }); // ❌, no reply -> pending
    const { impl: fetchImpl } = withPostCapture(baseImpl);
    const { impl: execGh, calls: ghCalls } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit } = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    expect(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'merge')).toBe(false);
  });

  it('finding 3c: a ✏️ replacement that fails checkDraft on an already-approved file reverts it WITHOUT merging the restored original', async () => {
    const itemA = { platform: 'x', body: 'hello world', scheduledAt: '2026-09-20T00:00:00Z' };
    const approvalWithoutSig = { v: 2, by: APPROVER, at: '2026-09-10T00:00:00Z', pr: PR_NUMBER, message: MESSAGE_ID, contentHash: contentHash(itemA) };
    const stampedItem = { ...itemA, approval: { ...approvalWithoutSig, sig: signApproval(approvalWithoutSig, TEST_KEY) } };
    await writeFile(path.join(root, 'social', 'queue', QUEUE_FILE), JSON.stringify(stampedItem, null, 2) + '\n');
    const { impl: baseImpl } = makeFetchImplByMessage([briefMessage(), replyMessage({ id: 'reply-1', parentId: MESSAGE_ID, content: 'a caption way over the limit' })], {
      [MESSAGE_ID]: { pencil: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
    });
    const { impl: fetchImpl } = withPostCapture(baseImpl);
    const { impl: execGh, calls: ghCalls } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit } = makeExecGit();
    const checkDraftImpl = vi.fn(() => ({ ok: false, findings: ["length: weighted 321 exceeds X's real 280-character limit"] }));

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()), checkDraftImpl });

    const item = await readQueueItem();
    expect(item.body).toBe('hello world'); // reverted to the previously-approved original
    expect(approvalStatus(item, { approvers: SOCIAL_APPROVERS, key: TEST_KEY }).ok).toBe(true); // ...which is STILL validly stamped
    expect(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'merge')).toBe(false); // must not merge it this run regardless
  });

  it('finding 7: an earlier PR\'s ledger row survives a LATER pr in the same run throwing', async () => {
    const PR2 = PR_NUMBER + 1;
    const pr2Brief = { id: 'pr2-message', webhook_id: '999999999999999999', content: `Draft 1 · Y\nref: PR #${PR2} · ${HEAD_SHA} · social/queue/pr2-file.json` };
    const { impl: baseImpl } = makeFetchImplByMessage([briefMessage(), pr2Brief], {
      [MESSAGE_ID]: { check: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
      // deliberately no entry for 'pr2-message' — its reactions fetch throws
      // (unexpected fetchImpl url), so PR2's own file is `unresolved` and
      // never approved/edited/rejected — PR2 contributes nothing of its own.
    });
    const { impl: fetchImpl } = withPostCapture(baseImpl);
    const execGh = vi.fn((args: string[]) => {
      if (args[0] === 'pr' && args[1] === 'view' && args.includes('headRefOid,headRefName,state,number')) {
        const prArg = Number(args[2]);
        return JSON.stringify({ headRefOid: HEAD_SHA, headRefName: prArg === PR2 ? 'feature/y' : 'feature/x', state: 'OPEN', number: prArg });
      }
      if (args[0] === 'pr' && args[1] === 'view' && args.includes('files')) {
        if (Number(args[2]) === PR2) throw new Error('simulated crash resolving PR2 files');
        return JSON.stringify({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
      }
      return '';
    });
    const { impl: execGit } = makeExecGit();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    void errorSpy;

    await expect(run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) })).rejects.toThrow('simulated crash resolving PR2 files');

    const rows = await readLedgerLines();
    expect(rows.some((r) => r.pr === PR_NUMBER && r.action === 'approve')).toBe(true);
  });

  it('finding 8: a header-level reject writes a ledger row naming the reason (covered structurally above too — direct case)', async () => {
    const { impl: baseImpl } = makeFetchImplByMessage([headerMessage(), replyMessage({ id: 'reply-1', parentId: HEADER_MESSAGE_ID, content: 'campaign is stale' })], {
      [HEADER_MESSAGE_ID]: { cross: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
    });
    const { impl: fetchImpl } = withPostCapture(baseImpl);
    const { impl: execGh, calls: ghCalls } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit } = makeExecGit();

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });

    expect(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'close')).toBe(true);
    const rows = await readLedgerLines();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ pr: PR_NUMBER, file: '*', action: 'reject', reason: 'campaign is stale', messageId: HEADER_MESSAGE_ID });
  });

  it('finding 10: retrying an already-applied ✏️ edit is a no-op (no new commit, provenance not corrupted)', async () => {
    const originalBody = 'hello world';
    const editedBody = 'On 22 Oct 2012, Taylor...';
    const editObj = { by: APPROVER, at: '2026-09-10T00:00:00Z', message: MESSAGE_ID, fromBody: originalBody };
    const editedItem = { platform: 'x', body: editedBody, scheduledAt: '2026-09-20T00:00:00Z', edit: editObj };
    const approvalWithoutSig = { v: 2, by: APPROVER, at: '2026-09-10T00:00:00Z', pr: PR_NUMBER, message: MESSAGE_ID, contentHash: contentHash(editedItem) };
    const alreadyStamped = { ...editedItem, approval: { ...approvalWithoutSig, sig: signApproval(approvalWithoutSig, TEST_KEY) } };
    await writeFile(path.join(root, 'social', 'queue', QUEUE_FILE), JSON.stringify(alreadyStamped, null, 2) + '\n');

    // Simulates a retry after an earlier run's merge attempt failed post-edit
    // — the SAME ✏️ + SAME reply are still the latest state on the message.
    const { impl: baseImpl } = makeFetchImplByMessage([briefMessage(), replyMessage({ id: 'reply-1', parentId: MESSAGE_ID, content: editedBody })], {
      [MESSAGE_ID]: { pencil: [() => jsonResponse([{ id: APPROVER_SNOWFLAKE }])] },
    });
    const { impl: fetchImpl } = withPostCapture(baseImpl);
    const { impl: execGh, calls: ghCalls } = makeExecGh({ files: [{ path: `social/queue/${QUEUE_FILE}` }] });
    const { impl: execGit, calls: gitCalls } = makeExecGit();
    const checkDraftImpl = vi.fn(() => ({ ok: true, findings: [] }));

    await run({ execGh, execGit, fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()), checkDraftImpl });

    expect(checkDraftImpl).not.toHaveBeenCalled(); // already-applied — never even re-runs the check
    expect(gitCalls.some((c) => c[0] === 'commit')).toBe(false); // no needless extra commit
    const item = await readQueueItem();
    expect(item.edit).toEqual(editObj); // fromBody/at/message not corrupted by a re-application
    expect(ghCalls.some((c) => c[0] === 'pr' && c[1] === 'merge')).toBe(true); // the merge phase still retries independently
  });
});
