import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runNotifier } from './reply-notifier.mjs';
import { MAX_CALLS_PER_RUN } from './lib/reply-sources.mjs';
import { formatItem, sanitizeUserText } from './lib/reply-notify.mjs';

const NOW = Date.parse('2026-10-01T12:00:00Z');
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();
const TOKEN = 'SECRET-TOKEN-123';
const GRAPH = 'https://graph.facebook.com/v25.0';

type Discord = (n: number, body: Record<string, unknown>) => { ok: boolean; status: number };
type Opts = { discord?: Discord; failAt?: { n: number; status: number; code?: number } };

/** A worst-case Graph: every list has many items AND a `next` page; counts Graph calls. */
function makeWorld(opts: Opts = {}) {
  const graphCalls: string[] = [];
  const sent: string[] = [];
  let discordN = 0;
  const media = Array.from({ length: 25 }, (_, i) => ({ id: `m${i}`, caption: `post ${i}`, permalink: `https://www.instagram.com/p/P${i}/`, timestamp: hoursAgo(5 + i), created_time: hoursAgo(5 + i) }));
  const comments = (prefix: string) => Array.from({ length: 60 }, (_, i) => ({ id: `${prefix}${i}`, text: `hi ${i}`, message: `hi ${i}`, username: `u${i}`, from: { id: `u${i}`, name: `U${i}` }, timestamp: hoursAgo(1), created_time: hoursAgo(1), replies: { data: [{ id: `${prefix}r${i}`, text: 'r', username: 'z', timestamp: hoursAgo(1) }], paging: { next: `${GRAPH}/x/replies?access_token=${TOKEN}` } } }));
  const fetchImpl = vi.fn(async (input: string, init?: { body?: string; signal?: unknown }) => {
    if (input.startsWith('https://discord.test')) {
      discordN += 1;
      const content = String(JSON.parse(init?.body ?? '{}').content);
      const verdict = opts.discord?.(discordN, JSON.parse(init?.body ?? '{}')) ?? { ok: true, status: 200 };
      if (verdict.ok) sent.push(content);
      return { ok: verdict.ok, status: verdict.status, json: async () => ({}) };
    }
    graphCalls.push(input);
    expect(init?.signal).toBeTruthy();
    const url = new URL(input);
    const key = url.pathname.replace('/v25.0/', '');
    if (opts.failAt && graphCalls.length === opts.failAt.n) {
      return { ok: false, status: opts.failAt.status, json: async () => ({ error: { code: opts.failAt.code, message: `limit ${TOKEN}` } }) };
    }
    const paging = { next: `${GRAPH}/${key}?after=Z&access_token=${TOKEN}` };
    let body: unknown = { data: [] };
    if (key === 'ig1') body = { username: 'longlivets' };
    else if (key === 'page1') body = {};
    else if (key === 'ig1/media') body = { data: media.slice(0, 10), paging };
    else if (key === 'page1/posts') body = { data: media.slice(0, 10), paging };
    else if (key === 'ig1/tags') body = { data: [], paging };
    else if (key.endsWith('/comments')) body = { data: comments(key.split('/')[0]), paging };
    else if (key.endsWith('/replies')) body = { data: [], paging };
    return { ok: true, status: 200, json: async () => body };
  });
  return { fetchImpl, graphCalls, sent };
}

const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));
function ledgerFile(initial?: unknown) {
  const dir = mkdtempSync(path.join(tmpdir(), 'reply-budget-'));
  dirs.push(dir);
  const file = path.join(dir, 'reply-ledger.json');
  if (initial) writeFileSync(file, JSON.stringify(initial));
  return file;
}
const env = (file: string) => ({ IG_ACCESS_TOKEN: TOKEN, IG_BUSINESS_ACCOUNT_ID: 'ig1', FB_PAGE_ID: 'page1', DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL: 'https://discord.test/hook', REPLY_LEDGER_PATH: file });
const quiet = () => ({ log: vi.fn(), warn: vi.fn() });
const seededLedger = { version: 1, seeded: { ig_comments: 'x', ig_mentions: 'x', fb_comments: 'x', ig_dms: 'x' }, seen: {} };

describe('Graph rate budget', () => {
  it('a worst-case run makes at most MAX_CALLS_PER_RUN calls, and an hour of runs at most 60', async () => {
    const file = ledgerFile(seededLedger);
    const world = makeWorld();
    await runNotifier(env(file), { fetchImpl: world.fetchImpl, now: NOW, ...quiet() });
    const first = world.graphCalls.length;
    expect(first).toBeGreaterThan(20);
    expect(first).toBeLessThanOrEqual(MAX_CALLS_PER_RUN);
    await runNotifier(env(file), { fetchImpl: world.fetchImpl, now: NOW + 30 * 60_000, ...quiet() });
    const hour = world.graphCalls.length;
    expect(hour - first).toBeLessThanOrEqual(MAX_CALLS_PER_RUN);
    expect(hour).toBeLessThanOrEqual(60);
    expect(MAX_CALLS_PER_RUN * 2).toBeLessThanOrEqual(60);
  });

  it('polls tags only once an hour', async () => {
    const file = ledgerFile(seededLedger);
    const world = makeWorld();
    const tagCalls = () => world.graphCalls.filter((u) => u.includes('/ig1/tags')).length;
    await runNotifier(env(file), { fetchImpl: world.fetchImpl, now: NOW, ...quiet() });
    await runNotifier(env(file), { fetchImpl: world.fetchImpl, now: NOW + 30 * 60_000, ...quiet() });
    expect(tagCalls()).toBe(1);
    await runNotifier(env(file), { fetchImpl: world.fetchImpl, now: NOW + 60 * 60_000, ...quiet() });
    expect(tagCalls()).toBe(2);
  });

  it('reads comments for at most 10 IG posts and 10 FB posts', async () => {
    const file = ledgerFile(seededLedger);
    const world = makeWorld();
    await runNotifier(env(file), { fetchImpl: world.fetchImpl, now: NOW, ...quiet() });
    const posts = new Set(world.graphCalls.map((u) => /\/(m\d+)\/comments/.exec(u)?.[1]).filter(Boolean));
    expect(posts.size).toBeLessThanOrEqual(10);
  });

  it.each([
    ['error code 4', { status: 400, code: 4 }],
    ['error code 17', { status: 400, code: 17 }],
    ['error code 32', { status: 400, code: 32 }],
    ['error code 613', { status: 400, code: 613 }],
    ['HTTP 429', { status: 429 }],
  ])('%s aborts every remaining Graph call, warns, and never leaks the token', async (_name, failure) => {
    const file = ledgerFile(seededLedger);
    const world = makeWorld({ failAt: { n: 3, ...failure } });
    const { log, warn } = quiet();
    expect(await runNotifier(env(file), { fetchImpl: world.fetchImpl, now: NOW, log, warn })).toBe(0);
    expect(world.graphCalls).toHaveLength(3);
    expect(warn.mock.calls.some(([m]) => /rate limit/i.test(String(m)))).toBe(true);
    expect(warn.mock.calls.flat().join(' ')).not.toContain(TOKEN);
  });
});

describe('delivery robustness', () => {
  it('a Discord 400 for one item marks it seen and the queue continues', async () => {
    const file = ledgerFile(seededLedger);
    const world = makeWorld({ discord: (n) => (n === 1 ? { ok: false, status: 400 } : { ok: true, status: 200 }) });
    const { warn } = quiet();
    expect(await runNotifier(env(file), { fetchImpl: world.fetchImpl, now: NOW, log: vi.fn(), warn })).toBe(0);
    expect(world.sent.length).toBeGreaterThan(1);
    expect(warn.mock.calls.some(([m]) => String(m).includes('Discord rejected'))).toBe(true);
    const seen = Object.keys(JSON.parse(readFileSync(file, 'utf8')).seen);
    expect(seen.length).toBe(world.sent.length - 0 + 1 - (world.sent.some((s) => s.includes('more new item')) ? 1 : 0));
  });

  it('a Discord 404 (dead webhook), 500 or 429 stops the run, leaves the item unseen, exits 1', async () => {
    for (const status of [404, 500, 429]) {
      const file = ledgerFile(seededLedger);
      const world = makeWorld({ discord: () => ({ ok: false, status }) });
      const code = await runNotifier(env(file), { fetchImpl: world.fetchImpl, now: NOW, log: vi.fn(), warn: vi.fn() });
      expect(code).toBe(1);
      expect(Object.keys(JSON.parse(readFileSync(file, 'utf8')).seen)).toEqual([]);
    }
  }, 30_000);

  it('writes the ledger after every message, so a mid-run crash cannot resend', async () => {
    const file = ledgerFile(seededLedger);
    const snapshots: number[] = [];
    const world = makeWorld({
      discord: () => {
        snapshots.push(Object.keys(JSON.parse(readFileSync(file, 'utf8')).seen).length);
        return { ok: true, status: 200 };
      },
    });
    await runNotifier(env(file), { fetchImpl: world.fetchImpl, now: NOW, ...quiet() });
    expect(snapshots.slice(0, 4)).toEqual([0, 1, 2, 3]);
  });
});

describe('rendering', () => {
  const item = (over: Record<string, unknown>) => ({ kind: 'ig_comment', username: 'u', text: 't', postSnippet: 'p', permalink: '', ...over });

  it('never renders @everyone / @here for a user with that name', () => {
    for (const name of ['everyone', 'here', 'Everyone', '@everyone']) {
      const msg = formatItem(item({ username: name }));
      expect(msg).not.toMatch(/@everyone|@here/i);
    }
    expect(formatItem(item({ username: 'everyone' }))).toContain('— everyone');
    expect(formatItem(item({ kind: 'ig_dm', username: 'here' }))).toContain('from here');
    expect(formatItem(item({ username: 'fan' }))).toContain('— @fan');
  });

  it('wraps bare URLs in <> so they do not autolink, keeping trailing punctuation outside', () => {
    const out = sanitizeUserText('see https://spam.example/a_b*c?x=1. and http://x.test/y), ok');
    expect(out).toContain('<https://spam.example/a_b*c?x=1>. and');
    expect(out).toContain('<http://x.test/y>\\)');
    expect(out).not.toMatch(/(^|[^<])https?:\/\//);
  });
});
