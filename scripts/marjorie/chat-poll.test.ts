import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { CLAIM, context, dispatchArgs, founderIds, parseFlags, poll, selectInbox } from './chat-poll.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { DISCORD_API } from './lib/discord-bot.mjs';

const NOW = Date.parse('2026-09-13T18:00:00.000Z');
const JOEY = '338508192755482626';
const STRANGER = '111111111111111111';
const GUILD = '900000000000000001';
const MARJ = '900000000000000010';
const TREE = '900000000000000020';
const THREAD = '900000000000000030';
const HOOK = 'https://discord.com/api/webhooks/1/secret-token';
const EYES = encodeURIComponent('👀');

function snow(ms: number) {
  return String((BigInt(ms) - 1420070400000n) << 22n);
}

function msg(id: string, over: Record<string, unknown> = {}) {
  return { id, type: 0, author: { id: JOEY, username: 'joey', global_name: 'Joey' }, content: 'what is your job?', timestamp: '2026-09-13T17:00:00.000Z', ...over };
}

function res(status: number, body: unknown = null) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

/** Exact `METHOD url` → response. Unknown routes 404. `log` records every call in order. */
function discord(routes: Record<string, unknown>, log: string[] = []) {
  const fetchImpl = vi.fn(async (url: string, init: { method?: string } = {}) => {
    const key = `${init.method || 'GET'} ${url}`;
    log.push(key);
    return key in routes ? routes[key] : res(404, {});
  });
  return { fetchImpl, log };
}

const sleepImpl = vi.fn().mockResolvedValue(undefined);
const founders = new Set([JOEY]);

function baseRoutes(marjMessages: unknown[], threadMessages: unknown[] = []) {
  return {
    [`GET ${HOOK}`]: res(200, { guild_id: GUILD, channel_id: TREE }),
    [`GET ${DISCORD_API}/guilds/${GUILD}/channels`]: res(200, [{ id: MARJ, name: 'longlive-marjorie' }, { id: TREE, name: 'longlive-tree' }]),
    [`GET ${DISCORD_API}/guilds/${GUILD}/threads/active`]: res(200, { threads: [{ id: THREAD, parent_id: MARJ, last_message_id: snow(NOW - 3_600_000) }] }),
    [`GET ${DISCORD_API}/channels/${MARJ}/messages?limit=100`]: res(200, marjMessages),
    [`GET ${DISCORD_API}/channels/${THREAD}/messages?limit=100`]: res(200, threadMessages),
    [`GET ${DISCORD_API}/channels/${TREE}/messages?limit=100`]: res(200, []),
  };
}

const env = { DISCORD_BOT_TOKEN: 'bot', DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL: HOOK, REPO: 'JW-Incorporated/swift2' };

describe('founderIds', () => {
  it('uses DISCORD_FOUNDER_IDS when it holds a valid id', () => {
    expect([...founderIds(' 222222222222222222 , nope')]).toEqual(['222222222222222222']);
  });
  it('falls back to the committed SOCIAL_APPROVERS ids', () => {
    expect(founderIds('').has(JOEY)).toBe(true);
  });
});

describe('selectInbox', () => {
  const pick = (messages: unknown[], threadMessages: unknown[] = []) =>
    selectInbox([{ channelId: MARJ, threadId: '', messages }, { channelId: MARJ, threadId: THREAD, messages: threadMessages }], { founders, now: NOW });

  it('keeps founder messages and drops strangers, webhooks, bots and system types', () => {
    const { picked } = pick([
      msg('1000000000000000001'),
      msg('1000000000000000002', { author: { id: STRANGER } }),
      msg('1000000000000000003', { webhook_id: '9' }),
      msg('1000000000000000004', { author: { id: JOEY, bot: true } }),
      msg('1000000000000000005', { type: 18 }),
    ]);
    expect(picked.map((p: { messageId: string }) => p.messageId)).toEqual(['1000000000000000001']);
  });

  it("drops a message carrying the bot's own 👀 but not a founder's own 👀", () => {
    const { picked } = pick([
      msg('1000000000000000001', { reactions: [{ me: true, emoji: { name: CLAIM } }] }),
      msg('1000000000000000002', { reactions: [{ me: false, emoji: { name: CLAIM } }] }),
    ]);
    expect(picked.map((p: { messageId: string }) => p.messageId)).toEqual(['1000000000000000002']);
  });

  it('ignores messages older than 24 hours', () => {
    expect(pick([msg('1000000000000000001', { timestamp: '2026-09-12T17:59:00.000Z' })]).picked).toEqual([]);
  });

  it('caps at 3 per channel, oldest first across the channel and its threads', () => {
    const { picked } = pick(
      [msg('1000000000000000004', { timestamp: '2026-09-13T17:04:00.000Z' }), msg('1000000000000000001', { timestamp: '2026-09-13T17:01:00.000Z' })],
      [msg('1000000000000000003', { timestamp: '2026-09-13T17:03:00.000Z' }), msg('1000000000000000002', { timestamp: '2026-09-13T17:02:00.000Z' })],
    );
    expect(picked.map((p: { messageId: string; threadId: string }) => [p.messageId, p.threadId])).toEqual([
      ['1000000000000000001', ''],
      ['1000000000000000002', THREAD],
      ['1000000000000000003', THREAD],
    ]);
  });

  it('treats a top-level Discord reply (type 19) as a top-level message', () => {
    const { picked } = pick([msg('1000000000000000001', { type: 19, message_reference: { message_id: '1548716528432713729' } })]);
    expect(picked).toEqual([expect.objectContaining({ messageId: '1000000000000000001', threadId: '' })]);
  });

  it('reports founder messages with empty content separately (Message Content intent missing)', () => {
    const { picked, empty } = pick([msg('1000000000000000001', { content: '' })]);
    expect(picked).toEqual([]);
    expect(empty).toHaveLength(1);
  });
});

describe('poll', () => {
  it('does nothing at all when BOT_CHAT_ENABLED=false', async () => {
    const { fetchImpl } = discord({});
    expect(await poll({ env: { ...env, BOT_CHAT_ENABLED: 'false' }, fetchImpl, sleepImpl, now: NOW })).toBe(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('claims with 👀 before dispatching, with the thread id for a thread message', async () => {
    const order: string[] = [];
    const top = msg('1000000000000000001');
    const inThread = msg('1000000000000000002');
    const routes = {
      ...baseRoutes([top], [inThread]),
      [`PUT ${DISCORD_API}/channels/${MARJ}/messages/${top.id}/reactions/${EYES}/@me`]: res(204),
      [`PUT ${DISCORD_API}/channels/${THREAD}/messages/${inThread.id}/reactions/${EYES}/@me`]: res(204),
    };
    const { fetchImpl } = discord(routes, order);
    const execImpl = vi.fn((_cmd: string, args: string[]) => { order.push(`gh ${args.join(' ')}`); return ''; });

    const code = await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: (wf: string) => wf === 'routine-marjorie-chat.yml' });

    expect(code).toBe(0);
    const claimTop = order.findIndex((k) => k.startsWith(`PUT ${DISCORD_API}/channels/${MARJ}/messages/${top.id}`));
    const dispatchTop = order.findIndex((k) => k.includes(`message_id=${top.id}`));
    expect(claimTop).toBeGreaterThan(-1);
    expect(dispatchTop).toBeGreaterThan(claimTop);
    expect(execImpl).toHaveBeenCalledTimes(2);
    expect(execImpl.mock.calls[0][1]).toEqual(dispatchArgs('JW-Incorporated/swift2', 'routine-marjorie-chat.yml', { messageId: top.id, channelId: MARJ, threadId: '' }));
    expect(execImpl.mock.calls[1][1]).toContain(`thread_id=${THREAD}`);
    expect(order.some((k) => k.includes(`/channels/${TREE}/messages`))).toBe(false); // tree routine not deployed yet
  });

  it('removes the claim and exits 1 when the dispatch fails', async () => {
    const top = msg('1000000000000000001');
    const reaction = `${DISCORD_API}/channels/${MARJ}/messages/${top.id}/reactions/${EYES}/@me`;
    const { fetchImpl, log } = discord({ ...baseRoutes([top]), [`PUT ${reaction}`]: res(204), [`DELETE ${reaction}`]: res(204) });
    const execImpl = vi.fn(() => { throw new Error('HTTP 404'); });

    expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: () => true })).toBe(1);
    expect(log).toContain(`DELETE ${reaction}`);
  });

  it('does not dispatch when the 👀 claim is refused', async () => {
    const top = msg('1000000000000000001');
    const { fetchImpl } = discord({ ...baseRoutes([top]), [`PUT ${DISCORD_API}/channels/${MARJ}/messages/${top.id}/reactions/${EYES}/@me`]: res(403, { code: 50013 }) });
    const execImpl = vi.fn();

    expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: () => true })).toBe(1);
    expect(execImpl).not.toHaveBeenCalled();
  });

  it('dry run reacts to nothing and dispatches nothing', async () => {
    const { fetchImpl, log } = discord(baseRoutes([msg('1000000000000000001')]));
    const execImpl = vi.fn();

    expect(await poll({ env: { ...env, DRY_RUN: '1' }, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: () => true })).toBe(0);
    expect(log.some((k) => k.startsWith('PUT '))).toBe(false);
    expect(execImpl).not.toHaveBeenCalled();
  });
});

describe('context', () => {
  const out = () => join(mkdtempSync(join(tmpdir(), 'chat-ctx-')), 'nested', 'chat-context.json');

  it('top level: no thread, history oldest → newest ending with the message, reply target included', async () => {
    const message = msg('1000000000000000009', { type: 19, content: 'how is the site?', referenced_message: msg('1548716528432713729', { webhook_id: '9', content: 'the brief' }) });
    const { fetchImpl } = discord({
      [`GET ${DISCORD_API}/channels/${MARJ}`]: res(200, { id: MARJ, guild_id: GUILD }),
      [`GET ${DISCORD_API}/channels/${MARJ}/messages/${message.id}`]: res(200, message),
      [`GET ${DISCORD_API}/channels/${MARJ}/messages?before=${message.id}&limit=14`]: res(200, [msg('1000000000000000008', { content: 'newer' }), msg('1000000000000000007', { content: 'older' })]),
    });
    const file = out();

    expect(await context(parseFlags(['--bot', 'marjorie', '--channel-id', MARJ, '--message-id', message.id, '--thread-id', '', '--out', file]), { env, fetchImpl, sleepImpl })).toBe(0);
    const ctx = JSON.parse(readFileSync(file, 'utf8'));
    expect(ctx).toMatchObject({ bot: 'marjorie', top_level: true, thread_id: '', text: 'how is the site?', url: `https://discord.com/channels/${GUILD}/${MARJ}/${message.id}` });
    expect(ctx.history.map((h: { text: string }) => h.text)).toEqual(['older', 'newer', 'how is the site?']);
    expect(ctx.replying_to).toMatchObject({ text: 'the brief', is_bot: true });
    expect(ctx.thread_root).toBeNull();
  });

  it('thread: reads the thread and its root from the parent channel', async () => {
    const message = msg('1000000000000000009');
    const { fetchImpl } = discord({
      [`GET ${DISCORD_API}/channels/${MARJ}`]: res(200, { id: MARJ, guild_id: GUILD }),
      [`GET ${DISCORD_API}/channels/${THREAD}/messages/${message.id}`]: res(200, message),
      [`GET ${DISCORD_API}/channels/${THREAD}/messages?before=${message.id}&limit=14`]: res(200, []),
      [`GET ${DISCORD_API}/channels/${MARJ}/messages/${THREAD}`]: res(200, msg(THREAD, { webhook_id: '9', content: "Founders' Brief" })),
    });
    const file = out();

    expect(await context(parseFlags(['--bot', 'marjorie', '--channel-id', MARJ, '--message-id', message.id, '--thread-id', THREAD, '--out', file]), { env, fetchImpl, sleepImpl })).toBe(0);
    const ctx = JSON.parse(readFileSync(file, 'utf8'));
    expect(ctx).toMatchObject({ top_level: false, thread_id: THREAD, url: `https://discord.com/channels/${GUILD}/${THREAD}/${message.id}` });
    expect(ctx.thread_root).toMatchObject({ text: "Founders' Brief" });
  });

  it('refuses non-numeric ids', async () => {
    expect(await context(parseFlags(['--bot', 'marjorie', '--channel-id', '../x', '--message-id', '1', '--out', out()]), { env })).toBe(2);
  });
});
