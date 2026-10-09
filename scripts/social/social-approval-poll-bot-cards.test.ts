// TREE-MARJORIE-AGENTS P1: Reddit/Facebook cards are posted by the Tree BOT (no webhook_id) into
// tree-reddit / tree-facebook / tree-main (scripts/lib/discord-route.mjs). The poll must still turn
// their reactions into ledger rows, anchored on the sending bot's own user id (GET /users/@me).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
// @ts-expect-error — implementation is plain .mjs
import { run } from './social-approval-poll.mjs';
// @ts-expect-error — implementation is plain .mjs
import { isApprovalPost } from '../marjorie/lib/chat-inbox.mjs';
import { SOCIAL_APPROVERS } from './lib/approvers.mjs';

const CHECK_MARK = '%E2%9C%85';
const REPO = 'JW-Incorporated/swift2';
const WEBHOOK_URL = 'https://discord.com/api/webhooks/999999999999999999/faketoken';
const WEBHOOK_CHANNEL = '111111111111111111';
const REDDIT_CH = '1558093079351787580';
const FB_CH = '1558093113807999026';
const BOT_ID = '424242424242424242';
const APPROVER_SNOWFLAKE = SOCIAL_APPROVERS[0].slice('discord:'.length);

let root: string;
let savedEnv: NodeJS.ProcessEnv;
let savedCwd: string;

const json = (body: unknown, status = 200) => ({ ok: status < 300, status, json: async () => body, text: async () => JSON.stringify(body) });
const card = (id: string, postId: string, authorId: string) => ({
  id,
  author: { id: authorId, bot: true },
  timestamp: '2026-09-14T10:00:00.000Z',
  content: `**Community prompt**\nref: reddit · ${postId}`,
});

function discord(byChannel: Record<string, unknown[]>, reactors: Record<string, string[]>) {
  return vi.fn(async (url: string) => {
    if (url.endsWith('/users/@me')) return json({ id: BOT_ID });
    const list = /\/channels\/(\d+)\/messages\?limit=100/.exec(url);
    if (list) return json(byChannel[list[1]] ?? []);
    const react = /\/channels\/\d+\/messages\/(\w+)\/reactions\/%E2%9C%85/.exec(url);
    if (react) return json((reactors[react[1]] ?? []).map((id) => ({ id })));
    return json([]);
  });
}

function ledger() {
  const dir = path.join(root, 'social', 'feedback');
  if (!existsSync(dir)) return [] as Array<Record<string, unknown>>;
  return readdirSync(dir)
    .filter((f) => f.endsWith('.jsonl'))
    .flatMap((f) => readFileSync(path.join(dir, f), 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l) as Record<string, unknown>));
}
const execGh = () => vi.fn((args: string[]) => (args[0] === 'api' && args[1] === 'user' ? 'tree-poster-bot' : ''));
const execGit = () => vi.fn((args: string[]) => (args[0] === 'rev-parse' ? 'a'.repeat(40) : ''));

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-16T09:00:00.000Z'));
  savedEnv = process.env;
  savedCwd = process.cwd();
  root = await mkdtemp(path.join(tmpdir(), 'poll-botcards-'));
  process.chdir(root);
  process.env = { ...savedEnv, DISCORD_BOT_TOKEN: 'fake', SOCIAL_APPROVAL_WEBHOOK_URL: WEBHOOK_URL, SOCIAL_APPROVAL_KEY: 'k', GH_TOKEN: 'g', REPO };
  delete process.env.DISCORD_TREE_BOT_TOKEN;
  process.exitCode = 0;
  vi.stubGlobal('fetch', vi.fn(async (url: string) => (String(url).startsWith(WEBHOOK_URL) ? json({ channel_id: WEBHOOK_CHANNEL }) : json({}, 404))));
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

describe('bot-posted reddit/facebook cards feed the ledger again', () => {
  it('a ✅ on a card in tree-reddit and one in tree-facebook each yield an approve row', async () => {
    const fetchImpl = discord(
      { [REDDIT_CH]: [card('r1', 'reddit-aaa', BOT_ID)], [FB_CH]: [card('f1', 'reddit-bbb', BOT_ID)] },
      { r1: [APPROVER_SNOWFLAKE], f1: [APPROVER_SNOWFLAKE] },
    );
    await run({ execGh: execGh(), execGit: execGit(), fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });
    const rows = ledger();
    expect(rows.map((r) => r.file).sort()).toEqual(['reddit:reddit-aaa', 'reddit:reddit-bbb']);
    expect(rows.every((r) => r.action === 'approve')).toBe(true);
    expect(process.exitCode).toBe(0);
  });

  it('ignores a ref line in a message not authored by the sending bot (no forged feedback)', async () => {
    const fetchImpl = discord({ [REDDIT_CH]: [card('x1', 'reddit-evil', '555555555555555555')] }, { x1: [APPROVER_SNOWFLAKE] });
    await run({ execGh: execGh(), execGit: execGit(), fetchImpl, sleepImpl: vi.fn(() => Promise.resolve()) });
    expect(ledger()).toEqual([]);
  });
});

describe('isApprovalPost for bot-authored cards', () => {
  it('accepts a bot-authored Reddit-ref card but not a bot-authored PR ref or a plain bot message', () => {
    expect(isApprovalPost({ author: { bot: true }, content: 'x\nref: reddit · reddit-abc' })).toBe(true);
    expect(isApprovalPost({ author: { bot: true }, content: `x\nref: PR #1 · ${'a'.repeat(40)} · a.json` })).toBe(false);
    expect(isApprovalPost({ author: { bot: true }, content: 'hello' })).toBe(false);
    expect(isApprovalPost({ author: { bot: false }, content: 'x\nref: reddit · reddit-abc' })).toBe(false);
    expect(isApprovalPost({ webhook_id: '1', author: { bot: true }, content: 'x\nref: reddit · reddit-abc' })).toBe(true);
  });
});
