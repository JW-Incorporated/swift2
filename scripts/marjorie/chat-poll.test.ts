import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  CROSS, EYES, GUILD, JOEY, MARJ, NOW, REPO, STRANGER, THREAD, TREE, baseRoutes, discord, env, founders, gh, mine, msg, onlyMarjorie, res, sleepImpl,
} from './chat-poll.fixtures';
// @ts-expect-error — plain .mjs module, no type declarations
import { context, parseFlags, poll, readMessages, resolveChannels } from './chat-poll.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { CLAIM, FAILED, FAILURE_PREFIX, REPLIED, dispatchArgs, founderIds, missingParents, runTitle, selectInbox } from './lib/chat-inbox.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { DISCORD_API } from './lib/discord-bot.mjs';
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
  // Bots v2 W2: an owner reply to a social approval post is a REJECTION the
  // approval poll acts on — it must never also dispatch a Tree chat run.
  describe('replies to a social approval post are not chat asks', () => {
    const APPROVAL_ID = '1000000000000000100';
    const approval = (extra: Record<string, unknown> = {}) =>
      msg(APPROVAL_ID, { author: { id: '9', bot: true }, webhook_id: '9', content: `**Tree · mood** · X + Instagram · PR #4544
ref: PR #4544 · ${'a'.repeat(40)} · social/queue/a-x.json,social/queue/a-ig.json`, ...extra });
    const reply = (extra: Record<string, unknown> = {}) => msg('1000000000000000101', { type: 19, message_reference: { message_id: APPROVAL_ID }, ...extra });

    it('skips a reply whose message_reference is an approval post in the window', () => {
      expect(pick([approval(), reply()]).picked).toEqual([]);
    });
    it('skips it via the embedded referenced_message when the parent is outside the window', () => {
      expect(pick([reply({ referenced_message: approval() })]).picked).toEqual([]);
    });
    it('skips a message posted in a thread started from an approval post', () => {
      const { picked } = selectInbox(
        [{ channelId: MARJ, threadId: '', messages: [approval({ id: THREAD })] }, { channelId: MARJ, threadId: THREAD, messages: [msg('1000000000000000102')] }],
        { founders, now: NOW },
      );
      expect(picked).toEqual([]);
    });
    it('still picks a reply to an ordinary bot message, and a reply to a weekly-brief ref (not an approval post)', () => {
      const plain = msg('1000000000000000103', { author: { id: '9', bot: true }, webhook_id: '9', content: 'hello' });
      const brief = approval({ id: '1000000000000000104', content: `brief
ref: PR #4544 · ${'a'.repeat(40)} · brief` });
      const { picked } = pick([plain, brief, msg('1000000000000000105', { type: 19, message_reference: { message_id: '1000000000000000103' } }), msg('1000000000000000106', { type: 19, message_reference: { message_id: '1000000000000000104' } })]);
      expect(ids(picked)).toEqual(['1000000000000000105', '1000000000000000106']);
    });
    it('skips a reply to a community reply-opportunity message (`ref: reddit · <id>`)', () => {
      const community = approval({ content: 'a thread worth a reply\nref: reddit · 1abc23' });
      expect(pick([community, reply()]).picked).toEqual([]);
    });
    describe('a parent outside the pages read (W8)', () => {
      const unknownReply = () => msg('1000000000000000107', { type: 19, message_reference: { message_id: '1548716528432713729' } });
      const run = (parents?: Map<string, unknown>) => selectInbox([{ channelId: MARJ, threadId: '', messages: [unknownReply()] }], { founders, now: NOW, parents });
      it('is conservatively NOT chat once the poll has tried to fetch parents and still has none', () => {
        const r = run(new Map());
        expect(r.picked).toEqual([]);
        expect(r.unresolved).toEqual(['1000000000000000107']);
      });
      it('is recognised as a rejection when the fetched parent is an approval post', () => {
        expect(run(new Map([['1548716528432713729', approval()]])).picked).toEqual([]);
      });
      it('is chat when the fetched parent is an ordinary message', () => {
        const plain = msg('1548716528432713729', { author: { id: '9', bot: true }, webhook_id: '9', content: 'hello' });
        expect(ids(run(new Map([['1548716528432713729', plain]])).picked)).toEqual(['1000000000000000107']);
      });
      it('lists exactly the founder replies whose parent nothing holds', () => {
        const sources = [{ channelId: MARJ, threadId: '', messages: [unknownReply(), reply(), msg('1000000000000000108', { author: { id: STRANGER }, type: 19, message_reference: { message_id: '1548716528432713999' } })] }];
        expect(missingParents(sources, { founders, now: NOW })).toEqual([{ id: '1548716528432713729', where: MARJ }, { id: APPROVAL_ID, where: MARJ }]);
      });
    });
  });
  describe('replies to the status change ping are chat asks (the reply-poll relay is retired)', () => {
    const PING_ID = '1000000000000000200';
    const ping = () => msg(PING_ID, { author: { id: '9', bot: true }, webhook_id: '9', content: '📋 Status updated — +1 needs you · 2 closed — https://github.com/o/r/issues/4' });
    it('picks a reply to the ping, in the window or via the embedded referenced_message', () => {
      const reply = (extra: Record<string, unknown> = {}) => msg('1000000000000000201', { type: 19, message_reference: { message_id: PING_ID }, ...extra });
      expect(ids(pick([ping(), reply()]).picked)).toEqual(['1000000000000000201']);
      expect(ids(pick([reply({ referenced_message: ping() })]).picked)).toEqual(['1000000000000000201']);
    });
    it('picks a message in a thread started from the ping', () => {
      const { picked } = selectInbox(
        [{ channelId: MARJ, threadId: '', messages: [{ ...ping(), id: THREAD }] }, { channelId: MARJ, threadId: THREAD, messages: [msg('1000000000000000202')] }],
        { founders, now: NOW },
      );
      expect(ids(picked)).toEqual(['1000000000000000202']);
    });
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
    expect(await poll({ env: { ...env, BOT_CHAT_ENABLED: 'false' }, fetchImpl, sleepImpl, now: NOW, clockLive: false })).toBe(0);
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
    expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie, clockLive: false })).toBe(0);
    const claimTop = order.findIndex((k) => k.startsWith(`PUT ${DISCORD_API}/channels/${MARJ}/messages/${top.id}`));
    const dispatchTop = order.findIndex((k) => k.includes('routine-marjorie-chat.yml') && k.includes(`message_id=${top.id}`));
    expect(claimTop).toBeGreaterThan(-1);
    expect(dispatchTop).toBeGreaterThan(claimTop);
    const chatCalls = execImpl.mock.calls.filter((call) => call[1].includes('routine-marjorie-chat.yml'));
    expect(chatCalls).toHaveLength(2);
    expect(chatCalls[0][1]).toEqual(dispatchArgs(REPO, 'routine-marjorie-chat.yml', { messageId: top.id, channelId: MARJ, threadId: '' }));
    expect(chatCalls[1][1]).toContain(`thread_id=${THREAD}`);
    expect(order.some((k) => k.includes(`/channels/${TREE}/messages`))).toBe(false); // tree routine not deployed yet
  });
  it('keeps the claim and exits 1 when the dispatch fails', async () => {
    const top = msg('1000000000000000001');
    const reaction = `${DISCORD_API}/channels/${MARJ}/messages/${top.id}/reactions/${EYES}/@me`;
    const { fetchImpl, log } = discord({ ...baseRoutes([top]), [`PUT ${reaction}`]: res(204) });
    const execImpl = vi.fn(() => { throw new Error('HTTP 502'); });
    expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie, clockLive: false })).toBe(1);
    expect(log.some((k) => k.startsWith('DELETE '))).toBe(false);
  });
  it('does not dispatch when the 👀 claim is refused', async () => {
    const top = msg('1000000000000000001');
    const { fetchImpl } = discord({ ...baseRoutes([top]), [`PUT ${DISCORD_API}/channels/${MARJ}/messages/${top.id}/reactions/${EYES}/@me`]: res(403, { code: 50013 }) });
    const execImpl = gh();
    expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie, clockLive: false })).toBe(1);
    expect(execImpl).not.toHaveBeenCalled();
  });
  it('dry run reacts to nothing and dispatches nothing', async () => {
    const { fetchImpl, log } = discord(baseRoutes([msg('1000000000000000001'), msg('1000000000000000002', mine(CLAIM))]));
    const execImpl = gh();
    expect(await poll({ env: { ...env, DRY_RUN: '1' }, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie, clockLive: false })).toBe(0);
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
    expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie, clockLive: false })).toBe(0);
    expect(execImpl.mock.calls[0][1]).toContain(`message_id=${older.id}`);
  });
  it('pages past the 24 h window to find an own-👀 claim older than it', async () => {
    const page = Array.from({ length: 100 }, (_, i) => msg(String(2000000000000000099n - BigInt(i)), { author: { id: STRANGER }, timestamp: '2026-09-12T17:54:00.000Z' }));
    const claim = msg('1000000000000000001', { ...mine(CLAIM), timestamp: '2026-09-12T17:00:00.000Z' });
    const routes = { ...baseRoutes(page), [`GET ${DISCORD_API}/channels/${MARJ}/messages?limit=100&before=${page[99].id}`]: res(200, [claim]) };
    const { fetchImpl } = discord(routes);
    const execImpl = gh();
    expect(await poll({ env: { ...env, DRY_RUN: '1' }, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie, clockLive: false })).toBe(0);
    expect(execImpl.mock.calls.some((c) => c[1][0] === 'run')).toBe(true);
  });
  it('fails the run when a place cannot be read or a body comes back blank', async () => {
    const unreadable = { ...baseRoutes([msg('1000000000000000001')]), [`GET ${DISCORD_API}/channels/${THREAD}/messages?limit=100`]: res(403, {}) };
    expect(await poll({ env: { ...env, DRY_RUN: '1' }, ...discord(unreadable), sleepImpl, execImpl: gh(), now: NOW, workflowExists: onlyMarjorie, clockLive: false })).toBe(1);
    const blank = baseRoutes([msg('1000000000000000001', { content: '' })]);
    expect(await poll({ env, ...discord(blank), sleepImpl, execImpl: gh(), now: NOW, workflowExists: onlyMarjorie, clockLive: false })).toBe(1);
  });
  describe('reconciling earlier claims (👀, no ✅/❌)', () => {
    const claimed = msg('1000000000000000001', mine(CLAIM));
    const title = runTitle('marjorie', claimed.id);
    const cross = `PUT ${DISCORD_API}/channels/${MARJ}/messages/${claimed.id}/reactions/${CROSS}/@me`;
    const post = `POST ${DISCORD_API}/channels/${MARJ}/messages`;
    it('never re-dispatches a stale claim with no matching run; it settles once as failed', async () => {
      const { fetchImpl, log } = discord({ ...baseRoutes([claimed]), [cross]: res(204), [post]: res(200, { id: '5' }) });
      const execImpl = gh([{ displayTitle: runTitle('marjorie', '1000000000000000009'), status: 'completed', url: 'u' }]);
      expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie, clockLive: false })).toBe(0);
      expect(execImpl.mock.calls.map((c) => c[1][0])).toEqual(['run']);
      expect(log.findIndex((k) => k.startsWith(post))).toBeLessThan(log.findIndex((k) => k === cross));
    });
    it('does not settle a claim before the 45-minute handoff window', async () => {
      const young = msg(claimed.id, { ...mine(CLAIM), timestamp: '2026-09-13T17:30:00.000Z' });
      const { fetchImpl, log } = discord(baseRoutes([young]));
      const execImpl = gh();
      expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie, clockLive: false })).toBe(0);
      expect(execImpl).not.toHaveBeenCalled();
      expect(log.some((k) => k.startsWith('PUT ') || k.startsWith('POST '))).toBe(false);
    });
    it('checks every matching run and lets an active original veto a completed duplicate', async () => {
      const { fetchImpl, log } = discord(baseRoutes([claimed]));
      const execImpl = gh([{ displayTitle: title, status: 'completed', url: 'duplicate' }, { displayTitle: title, status: 'in_progress', url: 'original' }]);
      expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie, clockLive: false })).toBe(0);
      expect(execImpl).toHaveBeenCalledTimes(1);
      expect(log.some((k) => k.startsWith('PUT ') || k.startsWith('POST '))).toBe(false);
    });
    it('re-reads Discord before settle and stops when the routine just stamped ✅', async () => {
      const routes = { ...baseRoutes([claimed]), [`GET ${DISCORD_API}/channels/${MARJ}/messages/${claimed.id}`]: res(200, msg(claimed.id, mine(CLAIM, REPLIED))) };
      const { fetchImpl, log } = discord(routes);
      const execImpl = gh([{ displayTitle: title, status: 'completed', conclusion: 'failure', url: 'https://github.com/run/1' }]);
      expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie, clockLive: false })).toBe(0);
      expect(log.some((k) => k.startsWith('PUT ') || k.startsWith('POST '))).toBe(false);
    });
    it('never strands a notice behind ❌ and uses the referenced marker to avoid duplicates', async () => {
      const run = [{ displayTitle: title, status: 'completed', url: 'https://github.com/run/1' }];
      const first = discord({ ...baseRoutes([claimed]), [post]: res(503, {}) });
      expect(await poll({ env, ...first, sleepImpl, execImpl: gh(run), now: NOW, workflowExists: onlyMarjorie, clockLive: false })).toBe(1);
      expect(first.log.some((k) => k === cross)).toBe(false);
      const second = discord({ ...baseRoutes([claimed]), [post]: res(200, { id: 'notice' }), [cross]: res(503, {}) });
      expect(await poll({ env, ...second, sleepImpl, execImpl: gh(run), now: NOW, workflowExists: onlyMarjorie, clockLive: false })).toBe(1);
      expect(second.log.filter((k) => k.startsWith(post))).toHaveLength(1);
      const notice = msg('1000000000000000002', { author: { id: '9', bot: true }, content: `${FAILURE_PREFIX} — please send it again`, message_reference: { message_id: claimed.id } });
      const third = discord({ ...baseRoutes([notice, claimed]), [cross]: res(204) });
      expect(await poll({ env, ...third, sleepImpl, execImpl: gh(run), now: NOW, workflowExists: onlyMarjorie, clockLive: false })).toBe(0);
      expect(third.log.some((k) => k.startsWith(post))).toBe(false);
      expect(third.log.some((k) => k === cross)).toBe(true);
    });
    it('treats a full, date-bounded run list as inconclusive and never dispatches', async () => {
      const { fetchImpl, log } = discord(baseRoutes([claimed]));
      const execImpl = gh(Array.from({ length: 200 }, (_, i) => ({ displayTitle: `other-${i}`, status: 'completed' })));
      expect(await poll({ env, fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: onlyMarjorie, clockLive: false })).toBe(1);
      expect(execImpl.mock.calls[0][1]).toContain('>=2026-09-13T16:59:00Z'); // whole seconds, a minute early
      expect(execImpl.mock.calls.map((c) => c[1][0])).toEqual(['run']);
      expect(log.some((k) => k.startsWith('PUT ') || k.startsWith('POST '))).toBe(false);
    });
  });
  it('fails loudly after ten full Discord pages instead of treating coverage as complete', async () => {
    const routes: Record<string, unknown> = {};
    let before = '';
    for (let page = 0; page < 10; page += 1) {
      const batch = Array.from({ length: 100 }, (_, i) => msg(String(3000000000000000000n - BigInt(page * 100 + i)), { author: { id: STRANGER }, timestamp: '2026-09-13T17:30:00.000Z' }));
      routes[`GET ${DISCORD_API}/channels/${MARJ}/messages?limit=100${before ? `&before=${before}` : ''}`] = res(200, batch);
      before = batch[99].id;
    }
    const result = await readMessages(MARJ, { token: 'bot', now: NOW, ...discord(routes), sleepImpl });
    expect(result).toMatchObject({ ok: false, status: 'page-cap' });
    expect(result.messages).toHaveLength(1000);
  });
  it('keeps both relay entry points in one concurrency group', () => {
    const group = /concurrency:\s+group: bot-chat-poll\s+cancel-in-progress: true/;
    expect(readFileSync('.github/workflows/bot-chat-poll.yml', 'utf8')).toMatch(group);
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
  describe('attachments (a picture the owner attaches, #5505)', () => {
    const pic = (filename: string) => ({ filename, url: `https://cdn.discordapp.com/attachments/1/2/${filename}?ex=sig`, content_type: 'image/png', size: 2048 });
    it('carries every attachment on the message, its reply target, the thread root and history', async () => {
      const message = msg('1000000000000000009', {
        type: 19, content: 'post this one', attachments: [pic('shot.png'), pic('alt.png')],
        referenced_message: msg('1548716528432713729', { webhook_id: '9', content: 'the brief', attachments: [pic('brief.png')] }),
      });
      const { fetchImpl } = discord({
        [`GET ${DISCORD_API}/channels/${MARJ}`]: res(200, { id: MARJ, guild_id: GUILD }),
        [`GET ${DISCORD_API}/channels/${THREAD}/messages/${message.id}`]: res(200, message),
        [`GET ${DISCORD_API}/channels/${THREAD}/messages?before=${message.id}&limit=14`]: res(200, [msg('1000000000000000008', { content: 'earlier', attachments: [pic('old.png')] })]),
        [`GET ${DISCORD_API}/channels/${MARJ}/messages/${THREAD}`]: res(200, msg(THREAD, { webhook_id: '9', content: 'root', attachments: [pic('root.png')] })),
      });
      const file = out();
      expect(await context(parseFlags(['--bot', 'tree', '--channel-id', MARJ, '--message-id', message.id, '--thread-id', THREAD, '--out', file]), { env, fetchImpl, sleepImpl })).toBe(0);
      const ctx = JSON.parse(readFileSync(file, 'utf8'));
      expect(ctx.attachments).toEqual([
        { filename: 'shot.png', url: pic('shot.png').url, content_type: 'image/png', size: 2048 },
        { filename: 'alt.png', url: pic('alt.png').url, content_type: 'image/png', size: 2048 },
      ]);
      expect(ctx.replying_to.attachments.map((a: { filename: string }) => a.filename)).toEqual(['brief.png']);
      expect(ctx.thread_root.attachments.map((a: { filename: string }) => a.filename)).toEqual(['root.png']);
      expect(ctx.history.map((h: { attachments: Array<{ filename: string }> }) => h.attachments.map((a) => a.filename)))
        .toEqual([['old.png'], ['shot.png', 'alt.png']]);
    });
    it('an image-only message has empty text but a non-empty attachments array', async () => {
      const message = msg('1000000000000000009', { content: '', attachments: [pic('shot.png')] });
      const { fetchImpl } = discord({
        [`GET ${DISCORD_API}/channels/${MARJ}`]: res(200, { id: MARJ, guild_id: GUILD }),
        [`GET ${DISCORD_API}/channels/${MARJ}/messages/${message.id}`]: res(200, message),
        [`GET ${DISCORD_API}/channels/${MARJ}/messages?before=${message.id}&limit=14`]: res(200, []),
      });
      const file = out();
      expect(await context(parseFlags(['--bot', 'tree', '--channel-id', MARJ, '--message-id', message.id, '--out', file]), { env, fetchImpl, sleepImpl })).toBe(0);
      const ctx = JSON.parse(readFileSync(file, 'utf8'));
      expect(ctx.text).toBe('');
      expect(ctx.attachments).toHaveLength(1);
      expect(ctx.attachments[0]).toMatchObject({ filename: 'shot.png', content_type: 'image/png' });
    });
    it('a message with no attachments gets an empty array, never a missing field', async () => {
      const message = msg('1000000000000000009', { content: 'just words' });
      const { fetchImpl } = discord({
        [`GET ${DISCORD_API}/channels/${MARJ}`]: res(200, { id: MARJ, guild_id: GUILD }),
        [`GET ${DISCORD_API}/channels/${MARJ}/messages/${message.id}`]: res(200, message),
        [`GET ${DISCORD_API}/channels/${MARJ}/messages?before=${message.id}&limit=14`]: res(200, []),
      });
      const file = out();
      expect(await context(parseFlags(['--bot', 'marjorie', '--channel-id', MARJ, '--message-id', message.id, '--out', file]), { env, fetchImpl, sleepImpl })).toBe(0);
      const ctx = JSON.parse(readFileSync(file, 'utf8'));
      expect(ctx.attachments).toEqual([]);
      expect(ctx.history.every((h: { attachments: unknown[] }) => Array.isArray(h.attachments))).toBe(true);
    });
  });
  describe('owner verification (growth-strategy steering)', () => {
    const OTHER_FOUNDER = '1421545239650238555';
    const ownerOf = async (author: string, extraEnv: Record<string, string> = {}) => {
      const message = msg('1000000000000000009', { author: { id: author, global_name: 'Someone' }, content: 'focus on Reddit' });
      const { fetchImpl } = discord({
        [`GET ${DISCORD_API}/channels/${MARJ}`]: res(200, { id: MARJ, guild_id: GUILD }),
        [`GET ${DISCORD_API}/channels/${MARJ}/messages/${message.id}`]: res(200, message),
        [`GET ${DISCORD_API}/channels/${MARJ}/messages?before=${message.id}&limit=14`]: res(200, []),
      });
      const file = out();
      await context(parseFlags(['--bot', 'marjorie', '--channel-id', MARJ, '--message-id', message.id, '--out', file]), { env: { ...env, ...extraEnv }, fetchImpl, sleepImpl });
      return JSON.parse(readFileSync(file, 'utf8')).owner;
    };
    it("verifies only Joey's id as the owner by default", async () => {
      expect(await ownerOf(JOEY)).toEqual({ configured: true, verified: true });
    });
    it('does not verify the other founder, whose messages are answered but never recorded', async () => {
      expect(await ownerOf(OTHER_FOUNDER)).toEqual({ configured: true, verified: false });
    });
    it('honours an OWNER_DISCORD_ID override, and a malformed one verifies nobody', async () => {
      expect(await ownerOf(OTHER_FOUNDER, { OWNER_DISCORD_ID: OTHER_FOUNDER })).toEqual({ configured: true, verified: true });
      expect(await ownerOf(JOEY, { OWNER_DISCORD_ID: 'not-an-id' })).toEqual({ configured: false, verified: false });
    });
  });
  it('refuses non-numeric ids', async () => {
    expect(await context(parseFlags(['--bot', 'marjorie', '--channel-id', '../x', '--message-id', '1', '--out', out()]), { env })).toBe(2);
  });
});

describe('resolveChannels (channel resolved by id, not name)', () => {
  const REAL_MARJ = '1548350324891328562';
  const run = (channels: unknown[], e: Record<string, string> = {}) => {
    const { fetchImpl, log } = discord({
      [`GET ${DISCORD_API}/guilds/${GUILD}/channels`]: res(200, channels),
    });
    return resolveChannels({ env: { DISCORD_GUILD_ID: GUILD, ...e }, token: 'bot', fetchImpl, sleepImpl }).then((r: { ids: { marjorie: string | null } }) => ({ ...r, log }));
  };
  it('a renamed channel still resolves by its BOTS channelId', async () => {
    const r = await run([{ id: REAL_MARJ, name: 'some-new-name' }, { id: TREE, name: 'longlive-tree' }]);
    expect(r.ids.marjorie).toBe(REAL_MARJ);
  });
  it('the env var wins over the BOTS channelId', async () => {
    const r = await run([], { DISCORD_MARJORIE_CHANNEL_ID: MARJ });
    expect(r.ids.marjorie).toBe(MARJ);
  });
});
