import { describe, expect, it, vi } from 'vitest';

import { ackSkipped, ackPosted } from '../../packages/core/src/community-ack';
// @ts-expect-error — implementation is plain .mjs
import { candidateChannels, pollReactions } from './community-reaction-poll.mjs';

const OWNER = '338508192755482626';
const STRANGER = '999999999999999999';
const FB_CHANNEL = '1558093113807999026';
const MAIN_CHANNEL = '1558093607393562644';
const REDDIT_CHANNEL = '1558093079351787580';

type Lead = { id: string; platform: string; link_included: boolean; discord_message_id: string };

function fakeSupabase(leads: Lead[]) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'not', 'gte', 'order']) chain[m] = () => chain;
  chain.limit = async () => ({ data: leads, error: null });
  return { from: () => chain } as never;
}

/** reactions: `${channel}:${message}:${emoji}` -> user ids; absent key -> 404 (message not in channel). */
function fakeDiscord(reactions: Record<string, string[]>) {
  const puts: string[] = [];
  const fetchImpl = vi.fn(async (url: string, init?: { method?: string }) => {
    const u = decodeURIComponent(String(url));
    if (init?.method === 'PUT') {
      puts.push(u);
      return new Response(null, { status: 204 });
    }
    const m = u.match(/channels\/(\d+)\/messages\/([^/]+)\/reactions\/([^/?]+)/);
    const key = `${m?.[1]}:${m?.[2]}:${m?.[3]}`;
    const channelHasMessage = Object.keys(reactions).some((k) => k.startsWith(`${m?.[1]}:${m?.[2]}:`));
    if (!channelHasMessage) return new Response('{"code":10008}', { status: 404 });
    return new Response(JSON.stringify((reactions[key] ?? []).map((id) => ({ id }))), {
      status: 200,
    });
  });
  return { fetchImpl, puts };
}

const lead = (over: Partial<Lead> = {}): Lead => ({
  id: 'lead-1',
  platform: 'facebook',
  link_included: false,
  discord_message_id: 'msg-1',
  ...over,
});

function setup(leads: Lead[], reactions: Record<string, string[]>) {
  const { fetchImpl, puts } = fakeDiscord(reactions);
  const acks = {
    posted: vi.fn(async () => ({ ok: true, alreadyActed: false })),
    skipped: vi.fn(async () => ({ ok: true, alreadyActed: false })),
  };
  const run = () =>
    pollReactions({
      supabase: fakeSupabase(leads),
      token: 'bot',
      env: {},
      fetchImpl: fetchImpl as never,
      owners: [OWNER],
      acks,
      sleep: async () => {},
    });
  return { acks, puts, run, fetchImpl };
}

describe('candidateChannels', () => {
  it('tries the platform channel, then tree-main for older cards', () => {
    expect(candidateChannels('facebook', {})).toEqual([FB_CHANNEL, MAIN_CHANNEL]);
    expect(candidateChannels('reddit', {})).toEqual([REDDIT_CHANNEL, MAIN_CHANNEL]);
  });
});

describe('pollReactions', () => {
  it('owner ❌ marks the lead skipped and confirms on the card', async () => {
    const t = setup([lead()], { [`${FB_CHANNEL}:msg-1:❌`]: [OWNER], [`${FB_CHANNEL}:msg-1:✅`]: [] });
    const s = await t.run();
    expect(t.acks.skipped).toHaveBeenCalledWith(expect.anything(), 'lead-1');
    expect(t.acks.posted).not.toHaveBeenCalled();
    expect(s).toMatchObject({ skipped: 1, posted: 0, errors: [] });
    expect(t.puts).toHaveLength(1);
    expect(t.puts[0]).toContain(`channels/${FB_CHANNEL}/messages/msg-1/reactions/🚫/@me`);
  });

  it('owner ✅ marks the lead posted with its link flag and confirms', async () => {
    const t = setup([lead({ platform: 'reddit', link_included: true })], {
      [`${REDDIT_CHANNEL}:msg-1:❌`]: [],
      [`${REDDIT_CHANNEL}:msg-1:✅`]: [OWNER],
    });
    const s = await t.run();
    expect(t.acks.posted).toHaveBeenCalledWith(expect.anything(), 'lead-1', true, 'discord-reaction');
    expect(t.acks.skipped).not.toHaveBeenCalled();
    expect(s.posted).toBe(1);
    expect(t.puts[0]).toContain('reactions/📝/@me');
  });

  it('ignores reactions from anyone but the owner', async () => {
    const t = setup([lead()], {
      [`${FB_CHANNEL}:msg-1:❌`]: [STRANGER],
      [`${FB_CHANNEL}:msg-1:✅`]: [STRANGER],
    });
    const s = await t.run();
    expect(t.acks.skipped).not.toHaveBeenCalled();
    expect(t.acks.posted).not.toHaveBeenCalled();
    expect(t.puts).toEqual([]);
    expect(s).toMatchObject({ posted: 0, skipped: 0, ignored: 1 });
  });

  it('finds an older card still sitting in tree-main', async () => {
    const t = setup([lead()], {
      [`${MAIN_CHANNEL}:msg-1:❌`]: [OWNER],
      [`${MAIN_CHANNEL}:msg-1:✅`]: [],
    });
    const s = await t.run();
    expect(s.skipped).toBe(1);
    expect(t.puts[0]).toContain(`channels/${MAIN_CHANNEL}/messages/msg-1`);
  });

  it('a skip wins when the owner reacted with both', async () => {
    const t = setup([lead()], {
      [`${FB_CHANNEL}:msg-1:❌`]: [OWNER],
      [`${FB_CHANNEL}:msg-1:✅`]: [OWNER],
    });
    await t.run();
    expect(t.acks.skipped).toHaveBeenCalledTimes(1);
    expect(t.acks.posted).not.toHaveBeenCalled();
  });

  it('is idempotent: re-processing never double-acks (real ack layer, stateful fake db)', async () => {
    const rows: Record<string, { id: string; status: string }> = {
      'lead-1': { id: 'lead-1', status: 'delivered' },
    };
    const writes: unknown[] = [];
    const db = {
      from: () => {
        let id = '';
        const b: Record<string, unknown> = {};
        b.select = () => b;
        b.not = () => b;
        b.gte = () => b;
        b.order = () => b;
        b.eq = (col: string, val: string) => {
          if (col === 'id') id = val;
          return b;
        };
        b.limit = async () => ({
          data: Object.values(rows)
            .filter((r) => r.status === 'delivered')
            .map((r) => ({ ...lead(), id: r.id })),
          error: null,
        });
        b.maybeSingle = async () => ({ data: rows[id] ?? null, error: null });
        b.update = (patch: { status: string }) => ({
          eq: async (_c: string, val: string) => {
            writes.push(patch);
            rows[val].status = patch.status;
            return { error: null };
          },
        });
        return b;
      },
    };
    const { fetchImpl, puts } = fakeDiscord({
      [`${FB_CHANNEL}:msg-1:❌`]: [OWNER],
      [`${FB_CHANNEL}:msg-1:✅`]: [],
    });
    const run = () =>
      pollReactions({
        supabase: db as never,
        token: 'bot',
        env: {},
        fetchImpl: fetchImpl as never,
        owners: [OWNER],
        acks: { posted: ackPosted, skipped: ackSkipped },
        sleep: async () => {},
      });
    const first = await run();
    const second = await run();
    expect(first.skipped).toBe(1);
    expect(second.checked).toBe(0);
    expect(writes).toEqual([{ status: 'skipped_by_founder' }]);
    expect(puts).toHaveLength(1);
  });

  it('records a db error and does not confirm', async () => {
    const t = setup([lead()], { [`${FB_CHANNEL}:msg-1:❌`]: [OWNER], [`${FB_CHANNEL}:msg-1:✅`]: [] });
    t.acks.skipped.mockResolvedValue({ ok: false, error: 'db_error', message: 'boom' } as never);
    const s = await t.run();
    expect(s.errors).toEqual([{ leadId: 'lead-1', message: 'boom' }]);
    expect(t.puts).toEqual([]);
  });

  it('never calls the ack layer for a card nobody reacted to', async () => {
    const t = setup([lead()], { [`${FB_CHANNEL}:msg-1:❌`]: [], [`${FB_CHANNEL}:msg-1:✅`]: [] });
    const s = await t.run();
    expect(t.acks.skipped).not.toHaveBeenCalled();
    expect(t.acks.posted).not.toHaveBeenCalled();
    expect(s.ignored).toBe(1);
  });
});
