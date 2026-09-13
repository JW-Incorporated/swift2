// M5 chat: a failure answer goes out exactly once (lib/chat-delivery.mjs, and
// the chat-post finish / chat-poll reconcile paths that use it). Each Codex
// round-2 finding has a test here that replays its scenario.
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { poll } from './chat-poll.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { finish, postCmd } from './chat-post.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { classifyDelivery, failureBody, linksTo, readDeliveryState } from './lib/chat-delivery.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { FAILURE_PREFIX, isFailureNotice, runTitle, selectInbox } from './lib/chat-inbox.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { DISCORD_API } from './lib/discord-bot.mjs';

const GUILD = '900000000000000001';
const MARJ = '900000000000000010';
const TREE = '900000000000000020';
const THREAD = '900000000000000030';
const MID = '1000000000000000009';
const URL = `https://discord.com/channels/${GUILD}/${MARJ}/${MID}`;
const RUN = 'https://github.com/JW-Incorporated/swift2/actions/runs/1';
const JOEY = '338508192755482626';
const NOW = Date.parse('2026-09-13T18:00:00.000Z');

function res(status: number, body: unknown = null) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}
const sleepImpl = vi.fn().mockResolvedValue(undefined);
const mine = (...emoji: string[]) => ({ reactions: emoji.map((name) => ({ me: true, emoji: { name } })) });
const founder = (id: string, over: Record<string, unknown> = {}) => ({ id, type: 0, author: { id: JOEY, username: 'joey' }, content: 'hi', timestamp: '2026-09-13T17:00:00.000Z', ...over });
const hook = (id: string, username = 'Marjorie', content = 'answer') => ({ id, type: 0, webhook_id: '77', author: { id: '77', username, bot: true }, content });
const notice = (id: string, about = MID) => ({ id, type: 19, author: { id: '55', username: 'longlive-bot', bot: true }, content: `${FAILURE_PREFIX} ${RUN} — please send it again`, message_reference: { message_id: about } });

/** Exact `METHOD url` → response (an Error throws). Unknown routes 404. */
function discord(routes: Record<string, unknown>) {
  const log: Array<{ key: string; body: unknown }> = [];
  const fetchImpl = vi.fn(async (url: string, init: { method?: string; body?: string } = {}) => {
    const key = `${init.method || 'GET'} ${url}`;
    log.push({ key, body: init.body ? JSON.parse(init.body) : null });
    const route = routes[key];
    if (route instanceof Error) throw route;
    return route ?? res(404, { code: 10003 });
  });
  return { fetchImpl, log, writes: () => log.filter((l) => !l.key.startsWith('GET ')).map((l) => l.key) };
}
const get = (where: string, id = MID) => `GET ${DISCORD_API}/channels/${where}/messages/${id}`;
const after = (where: string, id = MID) => `GET ${DISCORD_API}/channels/${where}/messages?after=${id}&limit=100`;
const react = (where: string, emoji: string) => `PUT ${DISCORD_API}/channels/${where}/messages/${MID}/reactions/${encodeURIComponent(emoji)}/@me`;
const say = (where: string) => `POST ${DISCORD_API}/channels/${where}/messages`;
const gh = () => vi.fn((_cmd: string, args: string[]) => (args[1] === 'list' ? JSON.stringify([{ number: 42 }]) : ''));
/** A re-run's finish: flags from inputs and context outputs only; no artifact is left. */
const rerun = (bot: string, channel: string, over: Record<string, string> = {}) => ({
  bot, 'message-id': MID, 'channel-id': channel, 'source-thread-id': '', 'reply-thread-id': MID, 'message-url': URL,
  'post-result': '', 'reply-dir': join(tmpdir(), 'chat-delivery-artifacts-deleted'), 'run-url': RUN, ...over,
});

describe('isFailureNotice (shared with selectInbox)', () => {
  it('counts only a bot-token notice that replies to the message', () => {
    expect(isFailureNotice(notice('1000000000000000010'), MID)).toBe(true);
    expect(isFailureNotice(notice('1000000000000000010', '1000000000000000001'), MID)).toBe(false);
    expect(isFailureNotice({ ...hook('1000000000000000010', 'Marjorie', `${FAILURE_PREFIX} ${RUN}`), message_reference: { message_id: MID } }, MID)).toBe(false);
    expect(isFailureNotice({ ...notice('1000000000000000010'), message_reference: undefined })).toBe(false);
  });

  it('selectInbox marks a claim notified by the same rule', () => {
    const claimed = founder(MID, mine('👀'));
    const { claimed: out } = selectInbox([{ channelId: MARJ, threadId: '', messages: [notice('1000000000000000010'), claimed] }], { founders: new Set([JOEY]), now: NOW });
    expect(out).toEqual([expect.objectContaining({ messageId: MID, notified: true })]);
  });
});

describe('classifyDelivery', () => {
  const base = { bot: 'marjorie', messageId: MID, message: founder(MID, mine('👀')) };

  it('settled wins: the bot already put ✅ or ❌ on the message', () => {
    expect(classifyDelivery({ ...base, message: founder(MID, mine('👀', '❌')) })).toBe('settled');
  });

  it('replied: a bot webhook post in the thread started on the message', () => {
    expect(classifyDelivery({ ...base, replyThreadId: MID, replyMessages: [hook('1000000000000000011')] })).toBe('replied');
    expect(classifyDelivery({ ...base, replyThreadId: MID, replyMessages: [hook('1000000000000000011', 'Tree')] })).toBe('open');
  });

  it("replied in the founder's own thread only before the next human message there", () => {
    const earlier = hook('1000000000000000001');
    const between = [founder(MID), hook('1000000000000000010')];
    expect(classifyDelivery({ ...base, sourceThreadId: THREAD, sourceMessages: [earlier, ...between] })).toBe('replied');
    const later = [founder('1000000000000000010'), hook('1000000000000000011')];
    expect(classifyDelivery({ ...base, sourceThreadId: THREAD, sourceMessages: [earlier, founder(MID), ...later] })).toBe('open');
  });

  it('replied at channel top level only with the ↪ link to this message', () => {
    const linked = hook('1000000000000000010', 'Marjorie', `↪ ${URL}\nanswer`);
    expect(classifyDelivery({ ...base, messageUrl: URL, sourceMessages: [linked] })).toBe('replied');
    expect(linksTo(`↪ https://discord.com/channels/@me/${MARJ}/${MID}\nanswer`, MID, URL)).toBe(true);
    expect(linksTo(`↪ https://discord.com/channels/${GUILD}/${MARJ}/1000000000000000001\nanswer`, MID, '')).toBe(false);
    expect(classifyDelivery({ ...base, messageUrl: URL, sourceMessages: [hook('1000000000000000010', 'Marjorie', "Founders' Brief")] })).toBe('open');
  });

  it('notified: a referenced bot notice, in the source or the reply thread', () => {
    expect(classifyDelivery({ ...base, sourceMessages: [notice('1000000000000000010')] })).toBe('notified');
    expect(classifyDelivery({ ...base, replyThreadId: MID, replyMessages: [notice('1000000000000000010')] })).toBe('notified');
    expect(classifyDelivery({ ...base, sourceMessages: [notice('1000000000000000010', '1000000000000000001')] })).toBe('open');
  });

  it('the failure notice text is the one the poll dedups on', () => {
    expect(failureBody(MID, RUN)).toMatchObject({ content: `${FAILURE_PREFIX} ${RUN} — please send it again`, message_reference: { message_id: MID } });
    expect(failureBody(MID).content).toBe(`${FAILURE_PREFIX} — please send it again`);
    expect(isFailureNotice({ ...failureBody(MID, RUN), id: '1000000000000000010', author: { bot: true } }, MID)).toBe(true);
  });
});

describe('readDeliveryState', () => {
  const args = { bot: 'marjorie', messageId: MID, channelId: MARJ, messageUrl: URL, token: 't', sleepImpl };

  it('top level with no thread output: a 404 on the would-be reply thread is empty, not a failure', async () => {
    const d = discord({ [get(MARJ)]: res(200, founder(MID, mine('👀'))), [after(MARJ)]: res(200, []) });
    expect(await readDeliveryState({ ...args, fetchImpl: d.fetchImpl })).toEqual({ ok: true, state: 'open' });
    expect(d.log.map((l) => l.key)).toEqual([get(MARJ), after(MARJ), after(MID)]);
  });

  it('settled needs one read', async () => {
    const d = discord({ [get(MARJ)]: res(200, founder(MID, mine('👀', '✅'))) });
    expect(await readDeliveryState({ ...args, fetchImpl: d.fetchImpl })).toEqual({ ok: true, state: 'settled' });
    expect(d.log).toHaveLength(1);
  });

  it('any other failed read is ok:false — never "unsettled"', async () => {
    const message = res(200, founder(MID, mine('👀')));
    const cases: Array<Record<string, unknown>> = [
      { [get(MARJ)]: res(500, {}) },
      { [get(MARJ)]: new Error('socket hang up') },
      { [get(MARJ)]: message, [after(MARJ)]: res(403, {}) },
      { [get(MARJ)]: message, [after(MARJ)]: res(200, []), [after(MID)]: res(403, {}) },
      { [get(MARJ)]: message, [after(MARJ)]: res(429, {}) },
    ];
    for (const routes of cases) {
      const d = discord(routes);
      expect(await readDeliveryState({ ...args, fetchImpl: d.fetchImpl })).toMatchObject({ ok: false });
      expect(d.writes()).toEqual([]);
    }
  });

  it('in a thread, reads the thread once and walks past a full page', async () => {
    const page = Array.from({ length: 100 }, (_, i) => founder(String(1000000000000000100n + BigInt(i)), { author: { id: '9', bot: true } }));
    const d = discord({
      [get(THREAD)]: res(200, founder(MID, mine('👀'))),
      [after(THREAD)]: res(200, [...page].reverse()),
      [after(THREAD, '1000000000000000199')]: res(200, [hook('1000000000000000200')]),
    });
    expect(await readDeliveryState({ ...args, sourceThreadId: THREAD, replyThreadId: THREAD, fetchImpl: d.fetchImpl })).toEqual({ ok: true, state: 'replied' });
    expect(d.log.map((l) => l.key)).toEqual([get(THREAD), after(THREAD), after(THREAD, '1000000000000000199')]);
  });
});

describe('finding 1 — Tree: reply sent, ✅ failed, artifacts deleted, deliver re-run', () => {
  it('the re-run finish sees the reply in the thread and only adds ✅ — no [chat failed] beside it', async () => {
    const d = discord({
      [get(TREE)]: res(200, founder(MID, mine('👀'))),
      [after(TREE)]: res(200, []),
      [after(MID)]: res(200, [hook('1000000000000000010', 'Tree', 'the plan is on track')]),
      [react(TREE, '✅')]: res(204),
    });
    expect(await finish(rerun('tree', TREE), { env: {}, fetchImpl: d.fetchImpl, sleepImpl, execImpl: gh() })).toBe(0);
    expect(d.writes()).toEqual([react(TREE, '✅')]);
  });

  it('a failed read is not "unsettled": the re-run sends nothing, reacts nothing, logs nothing, and fails', async () => {
    for (const broken of [{ [after(MID)]: res(500, {}) }, { [get(TREE)]: res(403, {}) }, { [after(TREE)]: new Error('ECONNRESET') }]) {
      const d = discord({ [get(TREE)]: res(200, founder(MID, mine('👀'))), [after(TREE)]: res(200, []), ...broken });
      const execImpl = gh();
      expect(await finish(rerun('tree', TREE), { env: {}, fetchImpl: d.fetchImpl, sleepImpl, execImpl })).toBe(1);
      expect(d.writes()).toEqual([]);
      expect(execImpl).not.toHaveBeenCalled();
    }
  });
});

describe('finding 2 — Marjorie: agent saved a reply then failed; post and finish ran; cleanup failed; re-run', () => {
  it('the re-run finish on the already-✅ message does nothing at all (run and post are attempt-1 only)', async () => {
    const d = discord({ [get(MARJ)]: res(200, founder(MID, mine('👀', '✅'))) });
    const execImpl = gh();
    expect(await finish(rerun('marjorie', MARJ, { 'post-result': 'replied' }), { env: {}, fetchImpl: d.fetchImpl, sleepImpl, execImpl })).toBe(0);
    expect(d.writes()).toEqual([]);
    expect(execImpl).not.toHaveBeenCalled();
  });
});

describe('finding 3 — never a second failure notice', () => {
  it('(a) post sends nothing without a reply, so the only notice is the bot one the poll can see', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'chat-delivery-'));
    const fetchImpl = vi.fn();
    expect(await postCmd({ bot: 'marjorie', 'reply-dir': dir, 'thread-id': MID, 'run-url': RUN }, { env: { DISCORD_MARJORIE_WEBHOOK_URL: 'https://discord.com/api/webhooks/1/x', GITHUB_OUTPUT: join(dir, 'out') }, fetchImpl, sleepImpl })).toBe(0);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(readFileSync(join(dir, 'out'), 'utf8')).toBe('result=missing\n');

    const d = discord({ [get(MARJ)]: res(200, founder(MID, mine('👀'))), [after(MARJ)]: res(200, []), [say(MARJ)]: res(200, { id: '1000000000000000010' }), [react(MARJ, '❌')]: res(503, {}) });
    expect(await finish(rerun('marjorie', MARJ, { 'post-result': 'missing' }), { env: {}, fetchImpl: d.fetchImpl, sleepImpl, execImpl: gh() })).toBe(1);
    expect(d.writes()).toEqual([say(MARJ), react(MARJ, '❌')]);
    const sent = { id: '1000000000000000010', type: 19, author: { id: '55', bot: true }, ...(d.log.find((l) => l.key === say(MARJ))?.body as object) };
    const { claimed } = selectInbox([{ channelId: MARJ, threadId: '', messages: [sent, founder(MID, mine('👀'))] }], { founders: new Set([JOEY]), now: NOW });
    expect(claimed).toEqual([expect.objectContaining({ messageId: MID, notified: true })]);
  });

  it('(b) notice sent, ❌ failed, finish re-run: ❌ only, no second notice', async () => {
    const d = discord({ [get(MARJ)]: res(200, founder(MID, mine('👀'))), [after(MARJ)]: res(200, [notice('1000000000000000010')]), [react(MARJ, '❌')]: res(204) });
    expect(await finish(rerun('marjorie', MARJ), { env: {}, fetchImpl: d.fetchImpl, sleepImpl, execImpl: gh() })).toBe(0);
    expect(d.writes()).toEqual([react(MARJ, '❌')]);
  });
});

/** One real poll over #longlive-marjorie holding one stale claim (an hour old, its run finished). */
const HOOK = 'https://discord.com/api/webhooks/1/secret-token';
const stale = founder(MID, mine('👀'));
async function pollWith(routes: Record<string, unknown>) {
  const d = discord({
    [`GET ${HOOK}`]: res(200, { guild_id: GUILD, channel_id: TREE }),
    [`GET ${DISCORD_API}/guilds/${GUILD}/channels`]: res(200, [{ id: MARJ, name: 'longlive-marjorie' }, { id: TREE, name: 'longlive-tree' }]),
    [`GET ${DISCORD_API}/guilds/${GUILD}/threads/active`]: res(200, { threads: [] }),
    [`GET ${DISCORD_API}/channels/${MARJ}/messages?limit=100`]: res(200, [stale]),
    [get(MARJ)]: res(200, stale),
    ...routes,
  });
  const runs = [{ displayTitle: runTitle('marjorie', MID), status: 'completed', conclusion: 'failure', url: RUN }];
  const execImpl = vi.fn((_cmd: string, args: string[]) => (args[0] === 'run' ? JSON.stringify(runs) : ''));
  const env = { DISCORD_BOT_TOKEN: 'bot', DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL: HOOK, REPO: 'o/r' };
  const code = await poll({ env, fetchImpl: d.fetchImpl, sleepImpl, execImpl, now: NOW, workflowExists: (wf: string) => wf === 'routine-marjorie-chat.yml' });
  return { code, writes: d.writes(), dispatched: execImpl.mock.calls.filter((c) => c[1][0] === 'workflow').length };
}

describe('finding 3 (a) at the poll — finish posted the notice, then ❌ was refused', () => {
  it('the next poll sees the bot notice and adds ❌ only', async () => {
    const sent = { ...notice('1000000000000000010'), ...failureBody(MID, RUN) };
    const out = await pollWith({ [`GET ${DISCORD_API}/channels/${MARJ}/messages?limit=100`]: res(200, [sent, stale]), [after(MARJ)]: res(200, [sent]), [react(MARJ, '❌')]: res(204) });
    expect(out).toEqual({ code: 0, writes: [react(MARJ, '❌')], dispatched: 0 });
  });
});

describe('finding 4 — reply sent, ✅ failed; 45 minutes later the poll reconciles', () => {
  it('a reply in the thread started on the message → ✅, never [chat failed] beside it', async () => {
    const out = await pollWith({ [after(MARJ)]: res(200, []), [after(MID)]: res(200, [hook('1000000000000000010')]), [react(MARJ, '✅')]: res(204) });
    expect(out).toEqual({ code: 0, writes: [react(MARJ, '✅')], dispatched: 0 });
  });

  it('a top-level ↪ reply (Discord refused the thread) → ✅ as well', async () => {
    const out = await pollWith({ [after(MARJ)]: res(200, [hook('1000000000000000010', 'Marjorie', `↪ ${URL}\nanswer`)]), [react(MARJ, '✅')]: res(204) });
    expect(out).toEqual({ code: 0, writes: [react(MARJ, '✅')], dispatched: 0 });
  });

  it('nothing delivered → one notice then ❌; an unreadable reply thread → nothing sent and the poll fails', async () => {
    const open = await pollWith({ [after(MARJ)]: res(200, []), [say(MARJ)]: res(200, { id: '1000000000000000010' }), [react(MARJ, '❌')]: res(204) });
    expect(open).toEqual({ code: 0, writes: [say(MARJ), react(MARJ, '❌')], dispatched: 0 });
    const unreadable = await pollWith({ [after(MARJ)]: res(200, []), [after(MID)]: res(502, {}) });
    expect(unreadable).toEqual({ code: 1, writes: [], dispatched: 0 });
  });
});

describe('force_fail smoke: a settled message is never re-claimed (M5 acceptance criterion)', () => {
  const pick = (m: Record<string, unknown>) => selectInbox([{ channelId: MARJ, threadId: '', messages: [m] }], { founders: new Set([JOEY]), now: NOW });
  it("skips a message carrying the bot's own ❌ or ✅ even without a 👀 claim", () => {
    for (const settled of [founder(MID, mine('❌')), founder(MID, mine('✅'))]) {
      const { picked, claimed } = pick(settled);
      expect(picked).toEqual([]);
      expect(claimed).toEqual([]);
    }
    expect(pick(founder(MID)).picked).toHaveLength(1);
  });
});
