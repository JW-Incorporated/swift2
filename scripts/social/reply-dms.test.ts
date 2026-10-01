import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runNotifier } from './reply-notifier.mjs';
import { SourceDisabledError, collectInstagramDms } from './lib/reply-dms.mjs';
import { formatItem, planNotifications, parseLedger } from './lib/reply-notify.mjs';
import { isPermissionError } from './lib/reply-sources.mjs';

const NOW = Date.parse('2026-10-01T12:00:00Z');
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();
const TOKEN = 'SECRET-TOKEN-123';
const PAGE_TOKEN = 'PAGE-TOKEN-456';

type Reply = { status?: number; code?: number; message?: string; body?: unknown };
/** Routes are keyed `<token-kind>:<graph path>`; falls back to `*:<path>`. */
function fakeFetch(routes: Record<string, Reply>, sent: Array<Record<string, unknown>> = []) {
  return vi.fn(async (input: string, init?: { body?: string }) => {
    if (input.startsWith('https://discord.test')) {
      sent.push(JSON.parse(init?.body ?? '{}'));
      return { ok: true, status: 200, json: async () => ({}) };
    }
    const url = new URL(input);
    const kind = url.searchParams.get('access_token') === PAGE_TOKEN ? 'page' : 'user';
    const key = url.pathname.replace('/v25.0/', '');
    const hit = routes[`${kind}:${key}`] ?? routes[`*:${key}`];
    if (!hit) return { ok: false, status: 400, json: async () => ({ error: { code: 100, message: `unsupported ${key}` } }) };
    if (hit.status) {
      return { ok: false, status: hit.status, json: async () => ({ error: { code: hit.code, message: `${hit.message} ${TOKEN}` } }) };
    }
    return { ok: true, status: 200, json: async () => hit.body };
  });
}

const convo = {
  data: [
    {
      id: 't_1',
      updated_time: hoursAgo(1),
      messages: {
        data: [
          { id: 'mid.1', from: { id: 'fan77', username: 'swiftie_77' }, message: 'hello there', created_time: hoursAgo(2) },
          { id: 'mid.2', from: { id: 'ig1', username: 'longlivets' }, message: 'our reply', created_time: hoursAgo(1) },
          { id: 'mid.3', from: { id: 'fan77', username: 'swiftie_77' }, created_time: hoursAgo(1) },
        ],
      },
    },
  ],
};

describe('collectInstagramDms', () => {
  it('reads conversations with the page token and skips our own messages', async () => {
    const fetchImpl = fakeFetch({
      'user:page1': { body: { access_token: PAGE_TOKEN } },
      'page:ig1/conversations': { body: convo },
    });
    const items = await collectInstagramDms({ igUserId: 'ig1', pageId: 'page1', token: TOKEN, fetchImpl });
    expect(items.map((i: { id: string }) => i.id)).toEqual(['ig-dm:mid.1', 'ig-dm:mid.3']);
    expect(items[0]).toMatchObject({ source: 'ig_dms', kind: 'ig_dm', username: 'swiftie_77', permalink: 'https://www.instagram.com/direct/inbox/' });
    const calls = fetchImpl.mock.calls.map(([u]) => String(u));
    expect(calls.some((u) => u.includes('platform=instagram') && u.includes('conversations'))).toBe(true);
  });

  it('falls back to the user token and the Page edge when the first attempt is a plain failure', async () => {
    const fetchImpl = fakeFetch({ 'user:page1/conversations': { body: convo } });
    const items = await collectInstagramDms({ igUserId: 'ig1', pageId: 'page1', token: TOKEN, fetchImpl });
    expect(items).toHaveLength(2);
  });

  it('reports a permission error as a disabled source, not a failure', async () => {
    const fetchImpl = fakeFetch({
      '*:ig1/conversations': { status: 403, code: 10, message: '(#10) Application does not have permission for this action' },
      '*:page1/conversations': { status: 400, code: 200, message: 'Requires instagram_manage_messages permission' },
    });
    const err = await collectInstagramDms({ igUserId: 'ig1', pageId: 'page1', token: TOKEN, fetchImpl }).catch((e: Error) => e);
    expect(err).toBeInstanceOf(SourceDisabledError);
    expect((err as SourceDisabledError).disabledReason).toMatch(/missing scope/);
    expect((err as Error).message).not.toContain(TOKEN);
  });

  it('a non-permission failure everywhere is an ordinary failure', async () => {
    const fetchImpl = fakeFetch({});
    const err = await collectInstagramDms({ igUserId: 'ig1', pageId: 'page1', token: TOKEN, fetchImpl }).catch((e: Error) => e);
    expect(err).not.toBeInstanceOf(SourceDisabledError);
  });

  it('classifies permission errors', () => {
    expect(isPermissionError({ graphCode: 3 })).toBe(true);
    expect(isPermissionError({ graphCode: 10 })).toBe(true);
    expect(isPermissionError({ graphCode: 200 })).toBe(true);
    expect(isPermissionError({ graphCode: 190, graphDetail: 'Invalid OAuth access token' })).toBe(false);
    expect(isPermissionError({ graphDetail: 'needs instagram_manage_messages' })).toBe(true);
  });
});

describe('DM message + seeding', () => {
  const dm = (text: string, extra = {}) => ({ id: 'ig-dm:1', source: 'ig_dms', kind: 'ig_dm', username: 'swiftie_77', text, permalink: 'https://www.instagram.com/direct/inbox/', postSnippet: '', timestamp: hoursAgo(2), ...extra });

  it('formats as an inbox pointer, quoting at most 200 chars, with injection neutralised', () => {
    const msg = formatItem(dm(`@everyone ${'y'.repeat(500)}`));
    expect(msg.startsWith('✉️ New IG DM from @swiftie\\_77: "')).toBe(true);
    expect(msg.endsWith('\nhttps://www.instagram.com/direct/inbox/')).toBe(true);
    const quoted = msg.split('"')[1];
    expect(quoted.length).toBeLessThanOrEqual(215);
    expect(msg).not.toContain('@everyone');
    expect(msg).not.toContain('y'.repeat(201));
  });

  it('uses the same first-run rule as comments', () => {
    const plan = planNotifications([dm('new'), dm('old', { id: 'ig-dm:2', timestamp: hoursAgo(40) })], parseLedger(''), NOW);
    expect(plan.toNotify.map((i: { id: string }) => i.id)).toEqual(['ig-dm:1']);
    expect(plan.silent.map((i: { id: string }) => i.id)).toEqual(['ig-dm:2']);
  });
});

describe('runNotifier with the DM source', () => {
  const dirs: string[] = [];
  afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));
  const file = () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'reply-dms-'));
    dirs.push(dir);
    return path.join(dir, 'reply-ledger.json');
  };
  const env = (f: string) => ({
    IG_ACCESS_TOKEN: TOKEN,
    IG_BUSINESS_ACCOUNT_ID: 'ig1',
    FB_PAGE_ID: 'page1',
    DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL: 'https://discord.test/hook',
    REPLY_LEDGER_PATH: f,
  });
  const quietRoutes: Record<string, Reply> = {
    '*:ig1': { body: { username: 'longlivets' } },
    '*:ig1/media': { body: { data: [] } },
    '*:ig1/tags': { body: { data: [] } },
    '*:page1': { body: {} },
    '*:page1/posts': { body: { data: [] } },
  };

  it('notifies a new DM once and seeds the DM source', async () => {
    const f = file();
    const sent: Array<Record<string, unknown>> = [];
    const fetchImpl = fakeFetch({ ...quietRoutes, '*:ig1/conversations': { body: convo } }, sent);
    const quiet = { log: vi.fn(), warn: vi.fn() };
    expect(await runNotifier(env(f), { fetchImpl, now: NOW, ...quiet })).toBe(0);
    expect(sent.map((s) => String(s.content))).toEqual([
      expect.stringContaining('✉️ New IG DM from @swiftie\\_77: "hello there"'),
      expect.stringContaining('✉️ New IG DM from @swiftie\\_77\n'),
    ]);
    expect(sent[0]).toMatchObject({ flags: 4, allowed_mentions: { parse: [] }, username: 'Tree · Replies' });
    await runNotifier(env(f), { fetchImpl, now: NOW + 900_000, ...quiet });
    expect(sent).toHaveLength(2);
    expect(JSON.parse(readFileSync(f, 'utf8')).seeded.ig_dms).toBeTruthy();
  });

  it('a missing scope logs "disabled: missing scope" once a day, sends nothing, exits 0', async () => {
    const f = file();
    const sent: Array<Record<string, unknown>> = [];
    const perm = { status: 403, code: 10, message: '(#10) permission denied' };
    const fetchImpl = fakeFetch({ ...quietRoutes, '*:ig1/conversations': perm, '*:page1/conversations': perm }, sent);
    const warn = vi.fn();
    const run = (now: number) => runNotifier(env(f), { fetchImpl, now, log: vi.fn(), warn });
    expect(await run(NOW)).toBe(0);
    expect(await run(NOW + 900_000)).toBe(0);
    const disabledLines = () => warn.mock.calls.filter(([m]) => String(m).includes('ig_dms disabled: missing scope'));
    expect(disabledLines()).toHaveLength(1);
    expect(await run(NOW + 25 * 3_600_000)).toBe(0);
    expect(disabledLines()).toHaveLength(2);
    expect(sent).toHaveLength(0);
    const ledger = JSON.parse(readFileSync(f, 'utf8'));
    expect(ledger.seeded.ig_dms).toBeUndefined();
    expect(ledger.disabledLogged.ig_dms).toBeTruthy();
    expect(warn.mock.calls.flat().join(' ')).not.toContain(TOKEN);
  });

  it('keeps the file writable for an existing ledger without disabledLogged', () => {
    const f = file();
    writeFileSync(f, JSON.stringify({ version: 1, seeded: {}, seen: {} }));
    expect(parseLedger(readFileSync(f, 'utf8')).disabledLogged).toEqual({});
  });
});
