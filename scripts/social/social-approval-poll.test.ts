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
import { approvalStatus } from './lib/queue.mjs';

const CHECK_MARK = '%E2%9C%85';
const CROSS_MARK = '%E2%9D%8C';
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

function makeFetchImpl(script: { check: Array<() => unknown>; cross?: Array<() => unknown> }) {
  const calls = { messages: 0, check: 0, cross: 0 };
  const crossScript = script.cross ?? [() => jsonResponse([])];
  const impl = vi.fn(async (url: string) => {
    if (url.includes(`/reactions/${CHECK_MARK}`)) {
      const i = Math.min(calls.check++, script.check.length - 1);
      return script.check[i]();
    }
    if (url.includes(`/reactions/${CROSS_MARK}`)) {
      const i = Math.min(calls.cross++, crossScript.length - 1);
      return crossScript[i]();
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
function makeFetchImplByMessage(messages: Array<{ id: string; content: string }>, byMessage: Record<string, { check: Array<() => unknown>; cross?: Array<() => unknown> }>) {
  const calls = new Map<string, { check: number; cross: number }>();
  const impl = vi.fn(async (url: string) => {
    if (url.includes('/messages?limit=100')) return jsonResponse(messages);
    for (const [id, script] of Object.entries(byMessage)) {
      const crossScript = script.cross ?? [() => jsonResponse([])];
      if (!calls.has(id)) calls.set(id, { check: 0, cross: 0 });
      const c = calls.get(id)!;
      if (url.includes(`/messages/${id}/reactions/${CHECK_MARK}`)) {
        const i = Math.min(c.check++, script.check.length - 1);
        return script.check[i]();
      }
      if (url.includes(`/messages/${id}/reactions/${CROSS_MARK}`)) {
        const i = Math.min(c.cross++, crossScript.length - 1);
        return crossScript[i]();
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
    const sleepImpl = vi.fn(() => Promise.resolve());

    await run({ execGh, fetchImpl, sleepImpl });

    expect(calls.check).toBe(2); // one 429, one retry that succeeded
    const raw = await readFile(path.join(root, 'social', 'queue', QUEUE_FILE), 'utf8');
    const item = JSON.parse(raw);
    expect(item.approval?.by).toBe(APPROVER);
    expect(approvalStatus(item, { approvers: SOCIAL_APPROVERS, key: TEST_KEY }).ok).toBe(true);
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
    const sleepImpl = vi.fn(() => Promise.resolve());
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(run({ execGh, fetchImpl, sleepImpl })).resolves.toBeUndefined();

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
    const sleepImpl = vi.fn(() => Promise.resolve());
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await run({ execGh, fetchImpl, sleepImpl });

    expect(errorSpy.mock.calls.some(([msg]) => typeof msg === 'string' && msg.includes('::warning::'))).toBe(true);
    const raw = await readFile(path.join(root, 'social', 'queue', QUEUE_FILE), 'utf8');
    const item = JSON.parse(raw);
    expect(item.approval).toBeUndefined(); // header approval must not stamp through an unreadable draft message
    expect(process.exitCode).toBe(0);
  });
});
