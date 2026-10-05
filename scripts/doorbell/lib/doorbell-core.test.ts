import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs module, no type declarations
import { dispatchArgs } from '../../marjorie/lib/chat-inbox.mjs';
import {
  INTENTS, STUCK_MS, chatDispatch, createChannelMap, createSeen, parseConfig, readyLine, ringDecision, stuckDecision, stuckDispatch,
  // @ts-expect-error — plain .mjs module, no type declarations
} from './doorbell-core.mjs';

const NOW = Date.parse('2026-09-14T18:00:00.000Z');
const JOEY = '338508192755482626';
const STRANGER = '111111111111111111';
const GUILD = '900000000000000001';
const MARJ = '900000000000000010';
const TREE = '900000000000000020';
const THREAD = '900000000000000030';
const GENERAL = '900000000000000040';
const GENERAL_THREAD = '900000000000000050';
const ID = '1000000000000000001';
const founders = new Set([JOEY]);

function places() {
  const map = createChannelMap();
  map.guild({
    id: GUILD,
    channels: [{ id: MARJ, name: 'longlive-marjorie', type: 0 }, { id: TREE, name: 'longlive-tree', type: 0 }, { id: GENERAL, name: 'general', type: 0 }],
    threads: [{ id: THREAD, parent_id: MARJ, type: 11 }, { id: GENERAL_THREAD, parent_id: GENERAL, type: 11 }],
  });
  return map;
}
const message = (over: Record<string, unknown> = {}) => ({
  id: ID, channel_id: MARJ, guild_id: GUILD, type: 0, author: { id: JOEY, username: 'joey' }, content: '', timestamp: '2026-09-14T17:59:59.000Z', ...over,
});
const decide = (m: unknown, over: Record<string, unknown> = {}) => ringDecision(m, { channels: places(), founders, seen: createSeen(), now: NOW, ...over });

describe('ringDecision', () => {
  it('rings a founder message at top level or in a thread under either channel', () => {
    expect(decide(message())).toEqual({ ring: { bot: 'marjorie', channelId: MARJ, threadId: '' } });
    expect(decide(message({ channel_id: THREAD }))).toEqual({ ring: { bot: 'marjorie', channelId: MARJ, threadId: THREAD } });
    expect(decide(message({ channel_id: TREE, type: 19 }))).toEqual({ ring: { bot: 'tree', channelId: TREE, threadId: '' } });
  });

  it('never rings a bot, webhook, thread-root, non-founder, sticker or system message', () => {
    const never = {
      bot: message({ author: { id: JOEY, bot: true } }),
      webhook: message({ webhook_id: '77' }),
      threadRoot: message({ id: THREAD, channel_id: THREAD }),
      nonFounder: message({ author: { id: STRANGER } }),
      sticker: message({ sticker_items: [{ id: '5' }] }),
      system: message({ type: 18 }),
      stale: message({ timestamp: '2026-09-13T17:00:00.000Z' }),
    };
    for (const [name, m] of Object.entries(never)) expect(decide(m).skip, name).toBeTruthy();
  });

  it('skips other channels, their threads, DMs, other guilds and anything already rung', () => {
    expect(decide(message({ channel_id: GENERAL }))).toEqual({ skip: 'another channel' });
    expect(decide(message({ channel_id: GENERAL_THREAD }))).toEqual({ skip: 'another channel' });
    expect(decide(message({ guild_id: undefined }))).toEqual({ skip: 'not in a guild' });
    expect(decide(message(), { guildId: '900000000000000999' })).toEqual({ skip: 'another guild' });
    const seen = createSeen();
    seen.add(ID);
    expect(decide(message(), { seen })).toEqual({ skip: 'already rung' });
  });

  it('asks for a lookup only when a founder writes somewhere never seen', () => {
    const unknown = '900000000000000060';
    expect(decide(message({ channel_id: unknown }))).toEqual({ lookup: unknown });
    expect(decide(message({ channel_id: unknown, author: { id: STRANGER } })).skip).toBeTruthy();
  });
});

describe('createChannelMap', () => {
  it('follows thread events and a channel renamed away', () => {
    const map = places();
    map.channel({ id: '900000000000000070', type: 11, parent_id: TREE, guild_id: GUILD });
    expect(map.resolve('900000000000000070')).toEqual({ bot: 'tree', channelId: TREE, threadId: '900000000000000070' });
    map.forget('900000000000000070');
    expect(map.resolve('900000000000000070')).toBeUndefined();
    map.threadListSync({ guild_id: GUILD, threads: [{ id: '900000000000000080', parent_id: MARJ }] });
    expect(map.resolve('900000000000000080')?.bot).toBe('marjorie');
    map.channel({ id: TREE, name: 'tree-archive', type: 0, guild_id: GUILD });
    expect(map.resolve(TREE)).toBeNull();
    expect(readyLine(map.ids(), founders)).toBe('not ready: #longlive-tree not found in the guild');
  });

  it('names both channels in the ready line', () => {
    expect(readyLine(places().ids(), founders)).toBe(`ready: #longlive-marjorie (${MARJ}) and #longlive-tree (${TREE}); 1 founder id(s)`);
  });

  it('ignores another guild when one is pinned', () => {
    const map = createChannelMap({ guildId: '900000000000000999' });
    map.guild({ id: GUILD, channels: [{ id: MARJ, name: 'longlive-marjorie', type: 0 }] });
    expect(map.resolve(MARJ)).toBeUndefined();
  });
});

describe('dispatch bodies', () => {
  it('sends the chat routine exactly the inputs the poll sends', () => {
    const args: string[] = dispatchArgs('JW-Incorporated/swift2', 'routine-marjorie-chat.yml', { messageId: ID, channelId: MARJ, threadId: THREAD });
    const fromPoll = Object.fromEntries(args.flatMap((arg, i) => (args[i - 1] === '-f' ? [arg.split(/=(.*)/s).slice(0, 2)] : [])));
    expect(args.slice(args.indexOf('--ref'), args.indexOf('--ref') + 2)).toEqual(['--ref', 'main']);
    expect(chatDispatch({ bot: 'marjorie', channelId: MARJ, threadId: THREAD }, ID)).toEqual({
      method: 'POST',
      url: 'https://api.github.com/repos/JW-Incorporated/swift2/actions/workflows/routine-marjorie-chat.yml/dispatches',
      body: { ref: 'main', inputs: fromPoll },
    });
  });

  it('dispatches the stuck alarm with the stage and the message ids only', () => {
    expect(stuckDispatch({ bot: 'tree', channelId: TREE, threadId: '' }, ID)).toEqual({
      method: 'POST',
      url: 'https://api.github.com/repos/JW-Incorporated/swift2/actions/workflows/bot-chat-alarm.yml/dispatches',
      body: { ref: 'main', inputs: { bot: 'tree', message_id: ID, channel_id: TREE, thread_id: '', stage: 'stuck' } },
    });
  });
});

describe('stuckDecision', () => {
  const read = (data: unknown[]) => ({ ok: true, status: 200, data });
  it('is 6 minutes, and any bot ✅ or ❌ settles it', () => {
    expect(STUCK_MS).toBe(360_000);
    expect(stuckDecision(read([{ id: '9', bot: true }]), read([]))).toBe('settled');
    expect(stuckDecision(read([]), read([{ id: '9', bot: true }]))).toBe('settled');
  });
  it("a founder's own ✅ is not a reply", () => {
    expect(stuckDecision(read([{ id: JOEY }]), read([]))).toBe('stuck');
  });
  it('a deleted message is gone; a failed read is unknown', () => {
    expect(stuckDecision({ ok: false, status: 404 }, { ok: false, status: 404 })).toBe('gone');
    expect(stuckDecision(read([]), { ok: false, status: 500 })).toBe('unknown');
  });
});

describe('parseConfig and the rest', () => {
  it('names each missing token without echoing any value', () => {
    const bad = parseConfig({ DOORBELL_GUILD_ID: 'nope' });
    expect(bad.ok).toBe(false);
    expect(bad.problems).toEqual(['DOORBELL_DISCORD_TOKEN is not set', 'DOORBELL_GITHUB_TOKEN is not set', 'DOORBELL_GUILD_ID is not a Discord id']);
    const good = parseConfig({ DOORBELL_DISCORD_TOKEN: 'secret-d', DOORBELL_GITHUB_TOKEN: 'secret-g' });
    expect(good.ok).toBe(true);
    expect(good.founders.has(JOEY)).toBe(true); // the committed approvers, as the poll uses
    expect(JSON.stringify(good.problems)).not.toContain('secret');
  });
  it('asks for GUILDS and GUILD_MESSAGES only — no privileged intent', () => {
    expect(INTENTS).toBe(513);
    expect(INTENTS & ((1 << 1) | (1 << 8) | (1 << 15))).toBe(0);
  });
  it('keeps the last 500 rung ids', () => {
    const seen = createSeen(500);
    for (let i = 0; i < 501; i += 1) seen.add(String(i));
    expect(seen.size).toBe(500);
    expect(seen.has('0')).toBe(false);
    expect(seen.has('500')).toBe(true);
  });
});
