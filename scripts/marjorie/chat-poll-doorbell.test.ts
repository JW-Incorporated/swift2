// M7: the poll watches the doorbell, and `context` claims with the bot's own
// 👀 (docs/specs/marjorie-overhaul/m7-doorbell.md Mechanics 4 and 5).
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { EYES, GUILD, MARJ, NOW, REPO, baseRoutes, discord, env, gh, mine, msg, onlyMarjorie, res, sleepImpl } from './chat-poll.fixtures';
// @ts-expect-error — plain .mjs module, no type declarations
import { context, parseFlags, poll } from './chat-poll.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { CLAIM, DOORBELL_LIVE, FAILED, REPLIED, alarmArgs, hasOthersReaction, runTitle } from './lib/chat-inbox.mjs';
// @ts-expect-error — plain .mjs module, no type declarations
import { DISCORD_API } from './lib/discord-bot.mjs';

const ID = '1000000000000000001';
const rung = (count = 1) => ({ reactions: [{ me: false, count, emoji: { name: CLAIM } }] });
const young = { timestamp: '2026-09-13T17:59:30.000Z' }; // 30 s before NOW
const claimOf = (id: string) => `PUT ${DISCORD_API}/channels/${MARJ}/messages/${id}/reactions/${EYES}/@me`;
const claimKey = claimOf(ID);
const isAlarm = (k: string) => k.startsWith('gh workflow run bot-chat-alarm.yml');
const isChat = (k: string) => k.startsWith('gh workflow run routine-marjorie-chat.yml');
const runOf = (id: string, status = 'in_progress', conclusion = '') => ({ displayTitle: runTitle('marjorie', id), status, conclusion, url: `https://github.com/run/${id}` });

type PassOptions = { runs?: unknown[]; doorbellLive?: boolean; execImpl?: unknown; extraEnv?: Record<string, string>; claim?: unknown };
async function pass(messages: unknown | unknown[], { runs = [], doorbellLive = true, execImpl, extraEnv = {}, claim = res(204) }: PassOptions = {}) {
  const list = (Array.isArray(messages) ? messages : [messages]) as Array<{ id: string }>;
  const order: string[] = [];
  const claims = Object.fromEntries(list.map((m) => [claimOf(m.id), claim]));
  const { fetchImpl } = discord({ ...baseRoutes(list), ...claims }, order);
  const exec = (execImpl as ReturnType<typeof gh>) || gh(runs, order);
  const code = await poll({ env: { ...env, ...extraEnv }, fetchImpl, sleepImpl, execImpl: exec, now: NOW, workflowExists: onlyMarjorie, doorbellLive, clockLive: false });
  return { code, order };
}

describe('hasOthersReaction', () => {
  it("counts a reaction beyond the bot's own", () => {
    expect(hasOthersReaction(msg(ID, rung()), CLAIM)).toBe(true);
    expect(hasOthersReaction(msg(ID, { reactions: [{ me: true, count: 1, emoji: { name: CLAIM } }] }), CLAIM)).toBe(false);
    expect(hasOthersReaction(msg(ID, { reactions: [{ me: true, count: 2, emoji: { name: CLAIM } }] }), CLAIM)).toBe(true);
    expect(hasOthersReaction(msg(ID), CLAIM)).toBe(false);
  });
});

describe('the poll watches the doorbell', () => {
  it('ships on after the live proof and alarms for a missed message without an override', async () => {
    expect(DOORBELL_LIVE).toBe(true);
    const order: string[] = [];
    const { fetchImpl } = discord({ ...baseRoutes([msg(ID)]), [claimKey]: res(204) }, order);
    expect(await poll({ env, fetchImpl, sleepImpl, execImpl: gh([], order), now: NOW, workflowExists: onlyMarjorie, clockLive: false })).toBe(0);
    expect(order.filter(isAlarm)).toHaveLength(1);
    expect(order.find(isAlarm)).toContain('stage=doorbell-missed');
    expect(order).toContain(claimKey);
    expect(order.indexOf(claimKey)).toBeLessThan(order.findIndex(isAlarm));
    expect(order.findIndex(isAlarm)).toBeLessThan(order.findIndex(isChat));
  });

  it('while off, a message with the doorbell 👀 is claimed and dispatched exactly as in M5', async () => {
    const { code, order } = await pass(msg(ID, rung()), { doorbellLive: false });
    expect(code).toBe(0);
    expect(order.some((k) => k.startsWith('gh run list'))).toBe(false);
    expect(order.filter(isAlarm)).toEqual([]);
    expect(order.filter(isChat)).toHaveLength(1);
  });

  it("someone else's 👀 and its run still going: skipped — the doorbell has it and context will claim it", async () => {
    const { code, order } = await pass(msg(ID, rung()), { runs: [runOf(ID, 'queued')] });
    expect(code).toBe(0);
    expect(order.some((k) => k.startsWith('gh run list'))).toBe(true);
    expect(order.some((k) => k.startsWith('PUT '))).toBe(false);
    expect(order.filter((k) => isChat(k) || isAlarm(k))).toEqual([]);
  });

  it("someone else's 👀 and its run ended before context claimed it: claimed with no second dispatch (Codex R1 #1)", async () => {
    const { code, order } = await pass(msg(ID, rung()), { runs: [runOf(ID, 'completed', 'cancelled')] });
    expect(code).toBe(0);
    expect(order).toContain(claimKey);
    expect(order.filter((k) => isChat(k) || isAlarm(k))).toEqual([]);
  });

  it("someone else's 👀, no run, under 60 s: skipped this pass", async () => {
    const { code, order } = await pass(msg(ID, { ...rung(), ...young }));
    expect(code).toBe(0);
    expect(order.some((k) => k.startsWith('PUT ') || isChat(k) || isAlarm(k))).toBe(false);
  });

  it("someone else's 👀, no run, 60 s or older: the claim, then the doorbell-dispatch-failed alarm, then the dispatch", async () => {
    const { code, order } = await pass(msg(ID, rung()));
    expect(code).toBe(0);
    const alarm = order.findIndex(isAlarm);
    expect(alarm).toBeGreaterThan(order.indexOf(claimKey));
    expect(order.indexOf(claimKey)).toBeGreaterThan(-1);
    expect(order.findIndex(isChat)).toBeGreaterThan(alarm);
    expect(order[alarm]).toBe(`gh ${alarmArgs(REPO, 'doorbell-dispatch-failed', { bot: 'marjorie', messageId: ID, channelId: MARJ, threadId: '' }).join(' ')}`);
  });

  it('no 👀 at all, 60 s or older: claimed, doorbell-missed raised, then dispatched', async () => {
    const { order } = await pass(msg(ID));
    expect(order.filter(isAlarm)).toHaveLength(1);
    expect(order.find(isAlarm)).toContain('stage=doorbell-missed');
    expect(order.findIndex(isAlarm)).toBeGreaterThan(order.indexOf(claimKey));
    expect(order.findIndex(isChat)).toBeGreaterThan(order.findIndex(isAlarm));
  });

  it('no 👀, under 60 s: claimed and dispatched with no alarm', async () => {
    const { order } = await pass(msg(ID, young));
    expect(order.filter(isAlarm)).toEqual([]);
    expect(order.filter(isChat)).toHaveLength(1);
  });

  it('raises no alarm for a sticker message, which the doorbell skips by design', async () => {
    const { order } = await pass(msg(ID, { sticker_items: [{ id: '5' }] }));
    expect(order.filter(isAlarm)).toEqual([]);
    expect(order.filter(isChat)).toHaveLength(1);
  });

  it('a refused claim raises no alarm, pass after pass (Codex R1 #2)', async () => {
    for (let i = 0; i < 2; i += 1) {
      const { code, order } = await pass(msg(ID), { claim: res(403, { code: 50013 }) });
      expect(code).toBe(1);
      expect(order.filter((k) => isAlarm(k) || isChat(k))).toEqual([]);
    }
  });

  it('messages the doorbell has do not use up the three-per-channel cap (Codex R1 #3)', async () => {
    const at = (minute: number) => `2026-09-13T17:0${minute}:00.000Z`;
    const ids = ['1000000000000000001', '1000000000000000002', '1000000000000000003', '1000000000000000004', '1000000000000000005'];
    const messages = [
      ...ids.slice(0, 3).map((id, i) => msg(id, { ...rung(), timestamp: at(i) })),
      msg(ids[3], { timestamp: at(3) }),
      msg(ids[4], { timestamp: at(4) }),
    ];
    const { order } = await pass(messages, { runs: ids.slice(0, 3).map((id) => runOf(id)) });
    expect(order.filter(isChat).map((k) => /message_id=(\d+)/.exec(k)?.[1])).toEqual([ids[3], ids[4]]);
    expect(order.filter(isAlarm)).toHaveLength(2);
  });

  it('lists the runs once per pass however many rung messages it skips (Codex R2)', async () => {
    const ids = Array.from({ length: 6 }, (_, i) => `100000000000000001${i}`);
    const messages = ids.map((id, i) => msg(id, { ...(i < 5 ? rung() : {}), timestamp: `2026-09-13T17:0${i}:00.000Z` }));
    const { order } = await pass(messages, { runs: ids.slice(0, 5).map((id) => runOf(id)) });
    expect(order.filter((k) => k.startsWith('gh run list'))).toHaveLength(1);
    expect(order.find((k) => k.startsWith('gh run list'))).toContain('>=2026-09-13T16:59:00Z'); // the oldest rung message, a minute early
    expect(order.filter(isChat).map((k) => /message_id=(\d+)/.exec(k)?.[1])).toEqual([ids[5]]);
  });

  it("an unlistable run for a rung message fails the pass and leaves the message alone", async () => {
    const order: string[] = [];
    const execImpl = vi.fn((_cmd: string, args: string[]) => {
      order.push(`gh ${args.join(' ')}`);
      if (args[0] === 'run') throw new Error('gh down');
      return '';
    });
    const { code } = await pass(msg(ID, rung()), { execImpl });
    expect(code).toBe(1);
    expect(order.filter((k) => isChat(k) || isAlarm(k))).toEqual([]);
  });

  it('a failed run list skips only the rung messages; an unrung one in the same pass is still answered', async () => {
    const other = '1000000000000000002';
    const order: string[] = [];
    const execImpl = vi.fn((_cmd: string, args: string[]) => {
      order.push(`gh ${args.join(' ')}`);
      if (args[0] === 'run') throw new Error('gh down');
      return '';
    });
    const { code } = await pass([msg(ID, rung()), msg(other, { timestamp: '2026-09-13T17:01:00.000Z' })], { execImpl });
    expect(code).toBe(1);
    expect(order.filter(isChat).map((k) => /message_id=(\d+)/.exec(k)?.[1])).toEqual([other]);
    expect(order.filter(isAlarm).map((k) => /message_id=(\d+)/.exec(k)?.[1])).toEqual([other]);
  });

  it('a failed alarm dispatch still answers the message', async () => {
    const order: string[] = [];
    const execImpl = vi.fn((_cmd: string, args: string[]) => {
      order.push(`gh ${args.join(' ')}`);
      if (args[2] === 'bot-chat-alarm.yml') throw new Error('HTTP 404: workflow not found');
      return '[]';
    });
    const { code } = await pass(msg(ID), { execImpl });
    expect(code).toBe(0);
    expect(order.filter(isChat)).toHaveLength(1);
  });

  it('dry run raises nothing, claims nothing and dispatches nothing', async () => {
    const { order } = await pass(msg(ID), { extraEnv: { DRY_RUN: '1' } });
    expect(order.some((k) => k.startsWith('PUT ') || isChat(k) || isAlarm(k))).toBe(false);
  });

  it('a ring plus a poll pass before context yields one dispatch, and context then claims it', async () => {
    const { order } = await pass(msg(ID, rung()), { runs: [runOf(ID)] });
    expect(order.filter(isChat)).toEqual([]); // the doorbell's run is the only one
    const log: string[] = [];
    const { fetchImpl } = discord({
      [`GET ${DISCORD_API}/channels/${MARJ}/messages/${ID}`]: res(200, msg(ID, rung())),
      [`GET ${DISCORD_API}/channels/${MARJ}`]: res(200, { id: MARJ, guild_id: GUILD }),
      [claimKey]: res(204),
    }, log);
    const out = join(mkdtempSync(join(tmpdir(), 'chat-ctx-')), 'ctx.json');
    expect(await context(parseFlags(['--bot', 'marjorie', '--channel-id', MARJ, '--message-id', ID, '--out', out]), { env, fetchImpl, sleepImpl })).toBe(0);
    expect(log.filter((k) => k.startsWith('PUT '))).toEqual([claimKey]);
  });
});

describe("context claims with the bot's own 👀", () => {
  const flags = (out: string) => parseFlags(['--bot', 'marjorie', '--channel-id', MARJ, '--message-id', ID, '--out', out]);
  const outFile = () => join(mkdtempSync(join(tmpdir(), 'chat-ctx-')), 'ctx.json');
  const routes = (message: unknown, claim = res(204)) => ({
    [`GET ${DISCORD_API}/channels/${MARJ}/messages/${ID}`]: res(200, message),
    [`GET ${DISCORD_API}/channels/${MARJ}`]: res(200, { id: MARJ, guild_id: GUILD }),
    [`GET ${DISCORD_API}/channels/${MARJ}/messages?before=${ID}&limit=14`]: res(200, []),
    [claimKey]: claim,
  });

  it('adds 👀 right after reading a founder message, before any other read', async () => {
    const log: string[] = [];
    const { fetchImpl } = discord(routes(msg(ID)), log);
    expect(await context(flags(outFile()), { env, fetchImpl, sleepImpl })).toBe(0);
    expect(log.slice(0, 2)).toEqual([`GET ${DISCORD_API}/channels/${MARJ}/messages/${ID}`, claimKey]);
  });

  it('a refused 👀 is a warning: the context file is still written', async () => {
    const out = outFile();
    const { fetchImpl } = discord(routes(msg(ID), res(403, { code: 50013 })));
    expect(await context(flags(out), { env, fetchImpl, sleepImpl })).toBe(0);
    expect(JSON.parse(readFileSync(out, 'utf8')).message_id).toBe(ID);
  });

  it('never claims a non-founder, bot or already-settled message, or one it already claimed', async () => {
    const cases = [
      msg(ID, { author: { id: '111111111111111111' } }),
      msg(ID, { author: { id: '77', bot: true } }),
      msg(ID, { webhook_id: '9' }),
      msg(ID, mine(REPLIED)),
      msg(ID, mine(FAILED)),
      msg(ID, mine(CLAIM)),
    ];
    for (const message of cases) {
      const log: string[] = [];
      const { fetchImpl } = discord(routes(message), log);
      expect(await context(flags(outFile()), { env, fetchImpl, sleepImpl })).toBe(0);
      expect(log.some((k) => k.startsWith('PUT '))).toBe(false);
    }
  });
});
