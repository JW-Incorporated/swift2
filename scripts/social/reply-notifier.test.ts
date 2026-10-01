import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runNotifier } from './reply-notifier.mjs';
import {
  collectFacebookComments,
  collectInstagramComments,
  collectInstagramMentions,
  makeGraph,
} from './lib/reply-sources.mjs';
import {
  BATCH_CAP,
  formatItem,
  parseLedger,
  planNotifications,
  sanitizeUserText,
  serializeLedger,
} from './lib/reply-notify.mjs';

const NOW = Date.parse('2026-10-01T12:00:00Z');
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();
const TOKEN = 'SECRET-TOKEN-123';
const GRAPH = 'https://graph.facebook.com/v25.0';

type Route = (url: URL) => unknown;
function fakeFetch(routes: Record<string, Route | unknown>, sent: Array<Record<string, unknown>> = []) {
  return vi.fn(async (input: string, init?: { body?: string }) => {
    if (input.startsWith('https://discord.test')) {
      sent.push(JSON.parse(init?.body ?? '{}'));
      return { ok: true, status: 200, json: async () => ({}) };
    }
    const url = new URL(input);
    const key = url.pathname.replace('/v25.0/', '');
    const hit = routes[key];
    if (hit === undefined) return { ok: false, status: 404, json: async () => ({ error: { message: `no route ${key}` } }) };
    const body = typeof hit === 'function' ? (hit as Route)(url) : hit;
    if (body instanceof Error) throw body;
    if (body && (body as { __status?: number }).__status) {
      return { ok: false, status: (body as { __status: number }).__status, json: async () => ({ error: { message: `bad ${TOKEN}` } }) };
    }
    return { ok: true, status: 200, json: async () => body };
  });
}

describe('makeGraph pagination', () => {
  it('follows paging.next and never leaks the token in errors', async () => {
    const fetchImpl = fakeFetch({
      'm1/comments': (url: URL) =>
        url.searchParams.get('after')
          ? { data: [{ id: 'c2' }] }
          : { data: [{ id: 'c1' }], paging: { next: `${GRAPH}/m1/comments?after=X&access_token=${TOKEN}` } },
      boom: { __status: 400 },
    });
    const graph = makeGraph({ token: TOKEN, fetchImpl });
    expect((await graph.list('m1/comments', {})).map((c: { id: string }) => c.id)).toEqual(['c1', 'c2']);
    const err = await graph.get('boom', {}).catch((e: Error) => e);
    expect((err as Error).message).toContain('HTTP 400');
    expect((err as Error).message).not.toContain(TOKEN);
  });
});

describe('collectors', () => {
  const media = {
    data: [
      { id: 'm1', caption: 'Eras tour memories', permalink: 'https://www.instagram.com/p/AAA/', timestamp: hoursAgo(5) },
      { id: 'm-old', caption: 'ancient', permalink: 'https://www.instagram.com/p/OLD/', timestamp: hoursAgo(24 * 40) },
    ],
  };

  it('collects IG comments and replies, skipping our own account', async () => {
    const fetchImpl = fakeFetch({
      ig1: { username: 'longlivets' },
      'ig1/media': media,
      'm1/comments': {
        data: [
          { id: 'c1', text: 'love it', username: 'fan1', timestamp: hoursAgo(2), replies: { data: [{ id: 'r1', text: 'same!', username: 'fan2', timestamp: hoursAgo(1) }, { id: 'r2', text: 'thanks', username: 'LongLiveTS', timestamp: hoursAgo(1) }] } },
          { id: 'c2', text: 'our own', username: 'longlivets', timestamp: hoursAgo(2) },
        ],
      },
    });
    const items = await collectInstagramComments(makeGraph({ token: TOKEN, fetchImpl }), { igUserId: 'ig1', now: NOW });
    expect(items.map((i: { id: string }) => i.id)).toEqual(['ig-comment:c1', 'ig-comment:r1']);
    expect(items[0]).toMatchObject({ kind: 'ig_comment', permalink: 'https://www.instagram.com/p/AAA/c/c1/', postSnippet: 'Eras tour memories' });
    expect(items[1]).toMatchObject({ kind: 'ig_reply', permalink: 'https://www.instagram.com/p/AAA/c/c1/r/r1/' });
    expect(fetchImpl.mock.calls.some(([u]) => String(u).includes('m-old'))).toBe(false);
  });

  it('follows nested replies pagination', async () => {
    const fetchImpl = fakeFetch({
      ig1: { username: 'longlivets' },
      'ig1/media': { data: [media.data[0]] },
      'm1/comments': { data: [{ id: 'c1', text: 'x', username: 'fan1', timestamp: hoursAgo(2), replies: { data: [{ id: 'r1', text: 'a', username: 'f2', timestamp: hoursAgo(1) }], paging: { next: `${GRAPH}/c1/replies?after=Y&access_token=${TOKEN}` } } }] },
      'c1/replies': { data: [{ id: 'r9', text: 'b', username: 'f3', timestamp: hoursAgo(1) }] },
    });
    const items = await collectInstagramComments(makeGraph({ token: TOKEN, fetchImpl }), { igUserId: 'ig1', now: NOW });
    expect(items.map((i: { id: string }) => i.id)).toEqual(['ig-comment:c1', 'ig-comment:r1', 'ig-comment:r9']);
  });

  it('one media failing warns and the rest still collect', async () => {
    const warn = vi.fn();
    const fetchImpl = fakeFetch({
      ig1: { username: 'longlivets' },
      'ig1/media': { data: [media.data[0], { id: 'm2', caption: 'b', permalink: 'https://www.instagram.com/p/BBB/', timestamp: hoursAgo(9) }] },
      'm1/comments': { __status: 500 },
      'm2/comments': { data: [{ id: 'c5', text: 'hi', username: 'fan5', timestamp: hoursAgo(3) }] },
    });
    const items = await collectInstagramComments(makeGraph({ token: TOKEN, fetchImpl }), { igUserId: 'ig1', now: NOW, onWarn: warn });
    expect(items).toHaveLength(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).not.toContain(TOKEN);
  });

  it('collects IG tags inside the window and skips our own', async () => {
    const fetchImpl = fakeFetch({
      ig1: { username: 'longlivets' },
      'ig1/tags': { data: [
        { id: 't1', caption: 'look @longlivets', username: 'fan9', permalink: 'https://www.instagram.com/p/TTT/', timestamp: hoursAgo(3) },
        { id: 't2', caption: 'old', username: 'fan8', permalink: 'https://www.instagram.com/p/UUU/', timestamp: hoursAgo(24 * 90) },
        { id: 't3', caption: 'self', username: 'longlivets', permalink: 'https://www.instagram.com/p/VVV/', timestamp: hoursAgo(3) },
      ] },
    });
    const items = await collectInstagramMentions(makeGraph({ token: TOKEN, fetchImpl }), { igUserId: 'ig1', now: NOW });
    expect(items.map((i: { id: string }) => i.id)).toEqual(['ig-mention:t1']);
  });

  it('collects FB comments, skipping the Page itself and tolerating missing authors', async () => {
    const fetchImpl = fakeFetch({
      page1: {},
      'page1/posts': { data: [{ id: 'page1_p1', message: 'New post', permalink_url: 'https://www.facebook.com/p1', created_time: hoursAgo(6) }] },
      'page1_p1/comments': { data: [
        { id: 'f1', message: 'nice', from: { id: 'u1', name: 'Fan One' }, created_time: hoursAgo(2), permalink_url: 'https://www.facebook.com/p1?comment_id=f1' },
        { id: 'f2', message: 'page reply', from: { id: 'page1', name: 'Long Live' }, created_time: hoursAgo(2) },
        { id: 'f3', message: 'anon', created_time: hoursAgo(2) },
      ] },
    });
    const items = await collectFacebookComments(makeGraph({ token: TOKEN, fetchImpl }), { pageId: 'page1', now: NOW });
    expect(items.map((i: { id: string }) => i.id)).toEqual(['fb-comment:f1', 'fb-comment:f3']);
    expect(items[1]).toMatchObject({ username: 'someone', permalink: 'https://www.facebook.com/p1' });
  });
});

describe('planNotifications + ledger', () => {
  const item = (id: string, h: number, source = 'ig_comments') => ({ id, source, kind: 'ig_comment', username: 'u', text: 't', permalink: '', postSnippet: 'p', timestamp: hoursAgo(h) });

  it('first run notifies only the last 24h and records the rest silently', () => {
    const plan = planNotifications([item('a', 30), item('b', 3), item('c', 1)], parseLedger(''), NOW);
    expect(plan.toNotify.map((i: { id: string }) => i.id)).toEqual(['b', 'c']);
    expect(plan.silent.map((i: { id: string }) => i.id)).toEqual(['a']);
  });

  it('after seeding, new items notify, seen ones do not, and stale ones are silent', () => {
    const ledger = parseLedger(JSON.stringify({ version: 1, seeded: { ig_comments: 'x' }, seen: { a: hoursAgo(1) } }));
    const plan = planNotifications([item('a', 3), item('b', 30), item('s', 24 * 9), item('b', 30)], ledger, NOW);
    expect(plan.toNotify.map((i: { id: string }) => i.id)).toEqual(['b']);
    expect(plan.silent.map((i: { id: string }) => i.id)).toEqual(['s']);
  });

  it('seeding is per source', () => {
    const ledger = parseLedger(JSON.stringify({ version: 1, seeded: { ig_comments: 'x' }, seen: {} }));
    const plan = planNotifications([item('i', 30), item('f', 30, 'fb_comments')], ledger, NOW);
    expect(plan.toNotify.map((i: { id: string }) => i.id)).toEqual(['i']);
    expect(plan.silent.map((i: { id: string }) => i.id)).toEqual(['f']);
  });

  it('refuses a malformed ledger and prunes very old entries', () => {
    expect(() => parseLedger('{"version":2}')).toThrow(/unexpected shape/);
    const out = JSON.parse(serializeLedger({ version: 1, seeded: {}, seen: { old: hoursAgo(24 * 200), fresh: hoursAgo(1) } }, NOW));
    expect(Object.keys(out.seen)).toEqual(['fresh']);
  });
});

describe('message formatting + injection', () => {
  it('neutralises pings, markdown, mention syntax and newlines', () => {
    const nasty = '@everyone @here <@&123> <@456> <#789>\n# header\n> quote ```code``` **bold** _it_ [x](http://e.vil)';
    const out = sanitizeUserText(nasty);
    expect(out).not.toMatch(/@everyone|@here|<@&/);
    expect(out).not.toContain('\n');
    expect(out).not.toMatch(/(?<!\\)[*_`<>#[\]]/);
  });

  it('builds the spec format, clips the comment, stays under 2000 chars', () => {
    const msg = formatItem({ kind: 'ig_comment', username: 'fan_1', text: 'x'.repeat(2000), postSnippet: 'Eras "tour"', permalink: 'https://www.instagram.com/p/AAA/c/1/' });
    expect(msg.startsWith('💬 New IG comment on "Eras "tour"" — @')).toBe(true);
    expect(msg).toContain('@fan\\_1: "');
    expect(msg.endsWith('\nhttps://www.instagram.com/p/AAA/c/1/')).toBe(true);
    expect(msg.length).toBeLessThanOrEqual(2000);
    expect(msg).toContain('x'.repeat(299) + '…');
  });

  it('drops a non-platform permalink instead of echoing it', () => {
    expect(formatItem({ kind: 'fb_comment', username: 'a', text: 'b', postSnippet: 'p', permalink: 'https://evil.example/x' })).not.toContain('evil');
  });
});

describe('runNotifier', () => {
  const dirs: string[] = [];
  afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

  function setup(ledger?: unknown) {
    const dir = mkdtempSync(path.join(tmpdir(), 'reply-notifier-'));
    dirs.push(dir);
    const file = path.join(dir, 'reply-ledger.json');
    if (ledger) writeFileSync(file, JSON.stringify(ledger));
    return file;
  }
  const baseEnv = (file: string) => ({
    IG_ACCESS_TOKEN: TOKEN,
    IG_BUSINESS_ACCOUNT_ID: 'ig1',
    FB_PAGE_ID: 'page1',
    DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL: 'https://discord.test/hook',
    REPLY_LEDGER_PATH: file,
  });
  const igRoutes = (comments: unknown[]) => ({
    ig1: { username: 'longlivets' },
    'ig1/media': { data: [{ id: 'm1', caption: 'post', permalink: 'https://www.instagram.com/p/AAA/', timestamp: hoursAgo(5) }] },
    'm1/comments': { data: comments },
    'ig1/tags': { data: [] },
    page1: {},
    'page1/posts': { data: [] },
  });
  const c = (id: string, h: number) => ({ id, text: `hi ${id}`, username: `fan${id}`, timestamp: hoursAgo(h) });

  it('first run seeds without a flood, then a rerun sends nothing twice', async () => {
    const file = setup();
    const sent: Array<Record<string, unknown>> = [];
    const fetchImpl = fakeFetch(igRoutes([c('old', 48), c('new', 2)]), sent);
    const quiet = { log: vi.fn(), warn: vi.fn() };
    expect(await runNotifier(baseEnv(file), { fetchImpl, now: NOW, ...quiet })).toBe(0);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ username: 'Tree · Replies', flags: 4, allowed_mentions: { parse: [] } });
    expect(String(sent[0].content)).toContain('hi new');
    expect(await runNotifier(baseEnv(file), { fetchImpl, now: NOW + 900_000, ...quiet })).toBe(0);
    expect(sent).toHaveLength(1);
    const ledger = JSON.parse(readFileSync(file, 'utf8'));
    expect(Object.keys(ledger.seen).sort()).toEqual(['ig-comment:new', 'ig-comment:old']);
    expect(ledger.seeded.ig_comments).toBeTruthy();
    expect(JSON.stringify(ledger)).not.toContain(TOKEN);
  });

  it('caps a batch, adds a "+N more" line, and delivers the rest next run', async () => {
    const file = setup({ version: 1, seeded: { ig_comments: 'x', ig_mentions: 'x', fb_comments: 'x' }, seen: {} });
    const sent: Array<Record<string, unknown>> = [];
    const comments = Array.from({ length: BATCH_CAP + 3 }, (_, i) => c(`n${i}`, 4 - i * 0.01));
    const fetchImpl = fakeFetch(igRoutes(comments), sent);
    const quiet = { log: vi.fn(), warn: vi.fn() };
    await runNotifier(baseEnv(file), { fetchImpl, now: NOW, ...quiet });
    expect(sent).toHaveLength(BATCH_CAP + 1);
    expect(String(sent[BATCH_CAP].content)).toContain('+3 more');
    await runNotifier(baseEnv(file), { fetchImpl, now: NOW + 900_000, ...quiet });
    expect(sent).toHaveLength(BATCH_CAP + 1 + 3);
  });

  it('a failing source warns, others still notify, and the failed source is not marked seeded', async () => {
    const file = setup();
    const sent: Array<Record<string, unknown>> = [];
    const routes = { ...igRoutes([c('new', 2)]), 'page1/posts': { __status: 500 } };
    const fetchImpl = fakeFetch(routes, sent);
    const warn = vi.fn();
    expect(await runNotifier(baseEnv(file), { fetchImpl, now: NOW, log: vi.fn(), warn })).toBe(0);
    expect(sent).toHaveLength(1);
    expect(warn.mock.calls.some(([m]) => String(m).includes('fb_comments failed'))).toBe(true);
    expect(warn.mock.calls.flat().join(' ')).not.toContain(TOKEN);
    const ledger = JSON.parse(readFileSync(file, 'utf8'));
    expect(Object.keys(ledger.seeded).sort()).toEqual(['ig_comments', 'ig_mentions']);
  });

  it('a Discord failure leaves the item unseen, exits 1, and DRY_RUN touches nothing', async () => {
    const file = setup({ version: 1, seeded: { ig_comments: 'x', ig_mentions: 'x', fb_comments: 'x' }, seen: {} });
    const base = fakeFetch(igRoutes([c('n1', 2)]));
    const fetchImpl = vi.fn(async (u: string, i?: { body?: string }) =>
      u.startsWith('https://discord.test') ? { ok: false, status: 500, json: async () => ({}) } : base(u, i));
    const warn = vi.fn();
    expect(await runNotifier(baseEnv(file), { fetchImpl, now: NOW, log: vi.fn(), warn })).toBe(1);
    expect(JSON.parse(readFileSync(file, 'utf8')).seen).toEqual({});
    const before = readFileSync(file, 'utf8');
    const log = vi.fn();
    expect(await runNotifier({ ...baseEnv(file), DRY_RUN: '1' }, { fetchImpl, now: NOW, log, warn })).toBe(0);
    expect(log.mock.calls.some(([m]) => String(m).startsWith('[dry-run]'))).toBe(true);
    expect(readFileSync(file, 'utf8')).toBe(before);
  });
});
