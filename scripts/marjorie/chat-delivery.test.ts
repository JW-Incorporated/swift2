// M5 chat: a failure answer goes out exactly once (lib/chat-delivery.mjs, and
// the chat-post finish / chat-poll reconcile paths that use it). Each Codex
// round-2 finding has a test here that replays its scenario.
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { classifyDelivery, failureBody, linksTo, readDeliveryState } from './lib/chat-delivery.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { FAILURE_PREFIX, isFailureNotice, selectInbox } from './lib/chat-inbox.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { DISCORD_API } from './lib/discord-bot.mjs';

const GUILD = '900000000000000001';
const MARJ = '900000000000000010';
const THREAD = '900000000000000030';
const MID = '1000000000000000009';
const URL = `https://discord.com/channels/${GUILD}/${MARJ}/${MID}`;
const RUN = 'https://github.com/JW-Incorporated/swift2/actions/runs/1';
const JOEY = '338508192755482626';

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
  return { fetchImpl, log, writes: () => log.filter((l) => !l.key.startsWith('GET ')) };
}
const get = (where: string, id = MID) => `GET ${DISCORD_API}/channels/${where}/messages/${id}`;
const after = (where: string, id = MID) => `GET ${DISCORD_API}/channels/${where}/messages?after=${id}&limit=100`;

describe('isFailureNotice (shared with selectInbox)', () => {
  it('counts only a bot-token notice that replies to the message', () => {
    expect(isFailureNotice(notice('1000000000000000010'), MID)).toBe(true);
    expect(isFailureNotice(notice('1000000000000000010', '1000000000000000001'), MID)).toBe(false);
    expect(isFailureNotice({ ...hook('1000000000000000010', 'Marjorie', `${FAILURE_PREFIX} ${RUN}`), message_reference: { message_id: MID } }, MID)).toBe(false);
    expect(isFailureNotice({ ...notice('1000000000000000010'), message_reference: undefined })).toBe(false);
  });

  it('selectInbox marks a claim notified by the same rule', () => {
    const claimed = founder(MID, mine('👀'));
    const { claimed: out } = selectInbox([{ channelId: MARJ, threadId: '', messages: [notice('1000000000000000010'), claimed] }], { founders: new Set([JOEY]), now: Date.parse('2026-09-13T18:00:00.000Z') });
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
