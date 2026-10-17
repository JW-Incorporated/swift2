/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs module
import { postQwenOpinions } from './qwen-post.mjs';

type Row = Record<string, any>;

function done(over: Row = {}): Row {
  return {
    id: 'l1',
    platform: 'reddit',
    discord_message_id: '555',
    created_at: '2026-10-17T00:00:00Z',
    qwen_status: 'done',
    qwen_draft: 'Alt reply',
    qwen_discord_message_id: null,
    ...over,
  };
}

function fakeDb(rows: Row[], failUpdate = false) {
  return {
    from: () => {
      const filters: Array<(r: Row) => boolean> = [];
      let patch: Row | null = null;
      let lim = Infinity;
      const b: any = {
        select: () => b,
        update: (p: Row) => ((patch = p), b),
        eq: (c: string, v: any) => (filters.push((r) => r[c] === v), b),
        is: (c: string, v: any) => (filters.push((r) => (r[c] ?? null) === v), b),
        not: (c: string, _op: string, v: any) => (filters.push((r) => (r[c] ?? null) !== v), b),
        order: () => b,
        limit: (n: number) => ((lim = n), b),
        then: (res: any, rej: any) => {
          const hit = rows.filter((r) => filters.every((f) => f(r))).slice(0, lim);
          if (patch && failUpdate) return Promise.resolve({ data: null, error: { message: 'db down' } }).then(res, rej);
          if (patch) hit.forEach((r) => Object.assign(r, patch));
          return Promise.resolve({ data: patch ? null : hit.map((r) => ({ ...r })), error: null }).then(res, rej);
        },
      };
      return b;
    },
  };
}

const env = { DISCORD_BOT_TOKEN: 'bt' };

describe('postQwenOpinions', () => {
  it('posts a done row once as a reply in the platform channel; a second run posts nothing', async () => {
    const rows = [done({ platform: 'facebook', discord_message_id: '777' })];
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: 'm9' }), { status: 200 }));
    const s1 = await postQwenOpinions({ supabase: fakeDb(rows), env, fetchImpl });
    expect(s1.posted).toBe(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, any];
    expect(url).toContain('/channels/1558093113807999026/messages');
    expect(init.headers.Authorization).toBe('Bot bt');
    const body = JSON.parse(init.body);
    expect(body.message_reference.message_id).toBe('777');
    expect(body.content).toBe('-# Qwen\n```\nAlt reply\n```');
    expect(rows[0].qwen_discord_message_id).toBe('m9');
    const s2 = await postQwenOpinions({ supabase: fakeDb(rows), env, fetchImpl });
    expect(s2.posted).toBe(0);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('ignores pending rows and rows without a card id', async () => {
    const rows = [done({ qwen_status: 'pending' }), done({ id: 'l2', discord_message_id: null })];
    const fetchImpl = vi.fn();
    const s = await postQwenOpinions({ supabase: fakeDb(rows), env, fetchImpl });
    expect(s.posted).toBe(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('leaves the row for the next run when Discord fails', async () => {
    const rows = [done()];
    let ok = false;
    const fetchImpl = vi.fn(async () =>
      ok ? new Response(JSON.stringify({ id: 'm1' }), { status: 200 }) : new Response('', { status: 500 }),
    );
    const s1 = await postQwenOpinions({ supabase: fakeDb(rows), env, fetchImpl });
    expect(s1.errors).toHaveLength(1);
    expect(rows[0].qwen_discord_message_id).toBeNull();
    ok = true;
    const s2 = await postQwenOpinions({ supabase: fakeDb(rows), env, fetchImpl });
    expect(s2.posted).toBe(1);
    expect(rows[0].qwen_discord_message_id).toBe('m1');
  });

  it('stops the batch on a 429 and leaves the rest pending', async () => {
    const rows = [done(), done({ id: 'l2', created_at: '2026-10-17T01:00:00Z' })];
    const fetchImpl = vi.fn(async () => new Response('', { status: 429 }));
    const s = await postQwenOpinions({ supabase: fakeDb(rows), env, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(s.posted).toBe(0);
    expect(rows.every((r) => r.qwen_discord_message_id === null)).toBe(true);
  });

  it('caps a run at the limit', async () => {
    const rows = [done(), done({ id: 'l2' }), done({ id: 'l3' })];
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: 'x' }), { status: 200 }));
    const s = await postQwenOpinions({ supabase: fakeDb(rows), env, fetchImpl, limit: 2 });
    expect(s.posted).toBe(2);
  });
});
