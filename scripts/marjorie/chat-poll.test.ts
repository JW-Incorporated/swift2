import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { context, parseFlags, poll } from './chat-poll.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { CLAIM, FAILED, REPLIED, dispatchArgs, founderIds, runTitle, selectInbox } from './lib/chat-inbox.mjs';
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
const CROSS = encodeURIComponent('❌');
const REPO = 'JW-Incorporated/swift2';

const snow = (ms: number) => String((BigInt(ms) - 1420070400000n) << 22n);

function msg(id: string, over: Record<string, unknown> = {}) {
  return { id, type: 0, author: { id: JOEY, username: 'joey', global_name: 'Joey' }, content: 'what is your job?', timestamp: '2026-09-13T17:00:00.000Z', ...over };
}

const mine = (...emoji: string[]) => ({ reactions: emoji.map((name) => ({ me: true, emoji: { name } })) });

function res(status: number, body: unknown = null) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

/** Exact `METHOD url` → response. Unknown routes 404. `log` records every call in order. */
function discord(routes: Record<string, unknown>, log: string[] = []) {
  const fetchImpl = vi.fn(async (url: string, init: { method?: string; body?: string } = {}) => {
    const key = `${init.method || 'GET'} ${url}`;
    log.push(init.body ? `${key} ${init.body}` : key);
    return key in routes ? routes[key] : res(404, {});
  });
  return { fetchImpl, log };
}

/** `gh` stand-in: `run list` answers with `runs`, `workflow run` is recorded. */
function gh(runs: unknown[] = [], log: string[] = []) {
  return vi.fn((_cmd: string, args: string[]) => {
    log.push(`gh ${args.join(' ')}`);
    return args[0] === 'run' ? JSON.stringify(runs) : '';
  });
}

const sleepImpl = vi.fn().mockResolvedValue(undefined);
const founders = new Set([JOEY]);
const onlyMarjorie = (wf: string) => wf === 'routine-marjorie-chat.yml';

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

const env = { DISCORD_BOT_TOKEN: 'bot', DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL: HOOK, REPO };

describe('founderIds', () => {
  it('uses DISCORD_FOUNDER_IDS when it holds a valid id, else the committed SOCIAL_APPROVERS ids', () => {
    expect([...founderIds(' 222222222222222222 , nope')]).toEqual(['222222222222222222']);
    expect(founderIds('').has(JOEY)).toBe(true);
  });
});

describe('selectInbox', () => {
  const pick = (messages: unknown[], threadMessages: unknown[] = []) =>
    selectInbox([{ channelId: MARJ, threadId: '', messages }, { channelId: MARJ, threadId: THREAD, messages: threadMessages }], { founders, now: NOW });
  const ids = (items: Array<{ messageId: string }>) => items.map((p) => p.messageId);

  it('keeps founder messages and drops strangers, webhooks, bots and system types', () => {
    const { picked } = pick([
      msg('1000000000000000001'),
      msg('1000000000000000002', { author: { id: STRANGER } }),
      msg('1000000000000000003', { webhook_id: '9' }),
      msg('1000000000000000004', { author: { id: JOEY, bot: true } }),
      msg('1000000000000000005', { type: 18 }),
    ]);
    expect(ids(picked)).toEqual(['1000000000000000001']);
  });

  it("never re-picks a message with the bot's own 👀, and ignores a founder's own 👀", () => {
    const { picked, claimed } = pick([
      msg('1000000000000000001', mine(CLAIM)),
      msg('1000000000000000002', { reactions: [{ me: false, emoji: { name: CLAIM } }] }),
      msg('1000000000000000003', mine(CLAIM, REPLIED)),
      msg('1000000000000000004', mine(CLAIM, FAILED)),
    ]);
    expect(ids(picked)).toEqual(['1000000000000000002']);
    expect(ids(claimed)).toEqual(['1000000000000000001']);
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

  it('reports a blank body separately, but not a sticker', () => {
    const { picked, empty } = pick([msg('1000000000000000001', { content: '' }), msg('1000000000000000002', { content: '', sticker_items: [{ id: '1' }] })]);
    expect(picked).toEqual([]);
    expect(ids(empty)).toEqual(['1000000000000000001']);
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
    const execImpl = gh([], order);

    expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie })).toBe(0);
    const claimTop = order.findIndex((k) => k.startsWith(`PUT ${DISCORD_API}/channels/${MARJ}/messages/${top.id}`));
    const dispatchTop = order.findIndex((k) => k.includes(`message_id=${top.id}`));
    expect(claimTop).toBeGreaterThan(-1);
    expect(dispatchTop).toBeGreaterThan(claimTop);
    expect(execImpl.mock.calls[0][1]).toEqual(dispatchArgs(REPO, 'routine-marjorie-chat.yml', { messageId: top.id, channelId: MARJ, threadId: '' }));
    expect(execImpl.mock.calls[1][1]).toContain(`thread_id=${THREAD}`);
    expect(order.some((k) => k.includes(`/channels/${TREE}/messages`))).toBe(false); // tree routine not deployed yet
  });

  it('keeps the claim and exits 1 when the dispatch fails', async () => {
    const top = msg('1000000000000000001');
    const reaction = `${DISCORD_API}/channels/${MARJ}/messages/${top.id}/reactions/${EYES}/@me`;
    const { fetchImpl, log } = discord({ ...baseRoutes([top]), [`PUT ${reaction}`]: res(204) });
    const execImpl = vi.fn(() => { throw new Error('HTTP 502'); });

    expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie })).toBe(1);
    expect(log.some((k) => k.startsWith('DELETE '))).toBe(false);
  });

  it('does not dispatch when the 👀 claim is refused', async () => {
    const top = msg('1000000000000000001');
    const { fetchImpl } = discord({ ...baseRoutes([top]), [`PUT ${DISCORD_API}/channels/${MARJ}/messages/${top.id}/reactions/${EYES}/@me`]: res(403, { code: 50013 }) });
    const execImpl = gh();

    expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie })).toBe(1);
    expect(execImpl).not.toHaveBeenCalled();
  });

  it('dry run reacts to nothing and dispatches nothing', async () => {
    const { fetchImpl, log } = discord(baseRoutes([msg('1000000000000000001'), msg('1000000000000000002', mine(CLAIM))]));
    const execImpl = gh();

    expect(await poll({ env: { ...env, DRY_RUN: '1' }, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie })).toBe(0);
    expect(log.some((k) => k.startsWith('PUT ') || k.startsWith('POST '))).toBe(false);
    expect(execImpl.mock.calls.some((c) => c[1][0] === 'workflow')).toBe(false);
  });

  it('pages back past 100 newer messages to find an older founder message', async () => {
    const newer = Array.from({ length: 100 }, (_, i) => msg(String(2000000000000000099n - BigInt(i)), { author: { id: STRANGER }, timestamp: '2026-09-13T17:30:00.000Z' }));
    const older = msg('1000000000000000001');
    const oldest = newer[newer.length - 1].id;
    const routes = {
      ...baseRoutes(newer),
      [`GET ${DISCORD_API}/channels/${MARJ}/messages?limit=100&before=${oldest}`]: res(200, [older]),
      [`PUT ${DISCORD_API}/channels/${MARJ}/messages/${older.id}/reactions/${EYES}/@me`]: res(204),
    };
    const { fetchImpl } = discord(routes);
    const execImpl = gh();

    expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie })).toBe(0);
    expect(execImpl.mock.calls[0][1]).toContain(`message_id=${older.id}`);
  });

  it('fails the run when a place cannot be read or a body comes back blank', async () => {
    const unreadable = { ...baseRoutes([msg('1000000000000000001')]), [`GET ${DISCORD_API}/channels/${THREAD}/messages?limit=100`]: res(403, {}) };
    expect(await poll({ env: { ...env, DRY_RUN: '1' }, ...discord(unreadable), sleepImpl, execImpl: gh(), now: NOW, workflowExists: onlyMarjorie })).toBe(1);
    const blank = baseRoutes([msg('1000000000000000001', { content: '' })]);
    expect(await poll({ env, ...discord(blank), sleepImpl, execImpl: gh(), now: NOW, workflowExists: onlyMarjorie })).toBe(1);
  });

  describe('reconciling earlier claims (👀, no ✅/❌)', () => {
    const claimed = msg('1000000000000000001', mine(CLAIM));
    const title = runTitle('marjorie', claimed.id);

    it('re-dispatches when no run carries the message id, without re-claiming', async () => {
      const { fetchImpl, log } = discord(baseRoutes([claimed]));
      const execImpl = gh([{ displayTitle: runTitle('marjorie', '1000000000000000009'), status: 'completed', url: 'u' }]);

      expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie })).toBe(0);
      expect(execImpl.mock.calls.map((c) => c[1][0])).toEqual(['run', 'workflow']);
      expect(execImpl.mock.calls[1][1]).toContain(`message_id=${claimed.id}`);
      expect(log.some((k) => k.startsWith('PUT '))).toBe(false);
    });

    it('leaves a queued or running run alone', async () => {
      const { fetchImpl, log } = discord(baseRoutes([claimed]));
      const execImpl = gh([{ displayTitle: title, status: 'in_progress', url: 'u' }]);

      expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie })).toBe(0);
      expect(execImpl).toHaveBeenCalledTimes(1);
      expect(log.some((k) => k.startsWith('PUT ') || k.startsWith('POST '))).toBe(false);
    });

    it('marks ❌ first, then posts [chat failed], when the run finished without reacting', async () => {
      const cross = `PUT ${DISCORD_API}/channels/${MARJ}/messages/${claimed.id}/reactions/${CROSS}/@me`;
      const post = `POST ${DISCORD_API}/channels/${MARJ}/messages`;
      const { fetchImpl, log } = discord({ ...baseRoutes([claimed]), [cross]: res(204), [post]: res(200, { id: '5' }) });
      const execImpl = gh([{ displayTitle: title, status: 'completed', conclusion: 'failure', url: 'https://github.com/run/1' }]);

      expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie })).toBe(0);
      const crossAt = log.findIndex((k) => k === cross);
      const postAt = log.findIndex((k) => k.startsWith(post));
      expect(crossAt).toBeGreaterThan(-1);
      expect(postAt).toBeGreaterThan(crossAt);
      expect(log[postAt]).toContain('[chat failed] https://github.com/run/1');
    });

    it('posts nothing when the ❌ itself is refused', async () => {
      const { fetchImpl, log } = discord({ ...baseRoutes([claimed]), [`PUT ${DISCORD_API}/channels/${MARJ}/messages/${claimed.id}/reactions/${CROSS}/@me`]: res(403, {}) });
      const execImpl = gh([{ displayTitle: title, status: 'completed', url: 'u' }]);

      expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie })).toBe(1);
      expect(log.some((k) => k.startsWith('POST '))).toBe(false);
    });
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
    expect(ctx.already).toBeNull();
  });

  it('thread: reads the thread and its root from the parent channel', async () => {
    const message = msg('1000000000000000009', mine(CLAIM, REPLIED));
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
    expect(ctx.already).toBe('replied'); // a duplicate run's context job stops here
  });

  it('refuses non-numeric ids', async () => {
    expect(await context(parseFlags(['--bot', 'marjorie', '--channel-id', '../x', '--message-id', '1', '--out', out()]), { env })).toBe(2);
  });
});
