import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import {
  PRIORITY,
  REPLY_SCHEMA,
  buildUserMessage,
  draftLeads,
  dryRun,
  fetchThreadContext,
  interpret,
  parseThreadContext,
} from './draft-replies.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { applyDrafts } from './awareness-draft.mjs';

const catalog = {
  eras: [{ id: 'folklore', name: 'folklore' }],
  moments: [{ id: 'vault-folklore-x', eraId: 'folklore', title: 'x' }],
};
const lead = (id: string, extra: object = {}) => ({
  id,
  community: 'TaylorSwift',
  title: 'Best era?',
  thread_type: 'ranking',
  image_comments: 'unknown',
  image_ref: null,
  selfPromoNote: null,
  moments: [{ ref: 'moment:vault-folklore-x', title: 'x', eraId: 'folklore' }],
  ...extra,
});
const exported = (...leads: object[]) => ({ leads, eras: ['folklore'], redlined: 0, waiting: leads.length });
const okDraft = (draft: string, extra: object = {}) => ({
  status: 'ok',
  data: { action: 'draft', draft, why: 'on topic for the ranking thread', ...extra },
});
const base = { system: 'sys', sleep: async () => undefined, log: () => undefined };

function fakeSupabase(ids: string[]) {
  const updates: { patch: Record<string, unknown>; id?: string }[] = [];
  const client = {
    from: () => ({
      select: () => {
        const chain: Record<string, unknown> = {};
        chain.in = () => chain;
        chain.eq = () => chain;
        chain.then = (resolve: (v: unknown) => void) =>
          resolve({ data: ids.map((id) => ({ id })), error: null });
        return chain;
      },
      update: (patch: Record<string, unknown>) => {
        const row: { patch: Record<string, unknown>; id?: string } = { patch };
        updates.push(row);
        const chain: Record<string, unknown> = {};
        chain.eq = (col: string, value: string) => {
          if (col === 'id') row.id = value;
          return chain;
        };
        chain.then = (resolve: (v: unknown) => void) => resolve({ error: null });
        return chain;
      },
    }),
  };
  return { client, updates };
}

describe('wrapper contract', () => {
  it('calls at community priority with the schema and a per-run call cap', async () => {
    const call = vi.fn(async () => okDraft('folklore for me, no contest'));
    await draftLeads(exported(lead('a'), lead('b')), { ...base, call });
    const input = call.mock.calls[0][0] as Record<string, unknown>;
    expect(PRIORITY).toBe('P3');
    expect(input).toMatchObject({ priority: 'P3', model: 'claude-sonnet-5-5', schema: REPLY_SCHEMA, maxCalls: 2 });
    expect(call).toHaveBeenCalledTimes(2);
  });
});

describe('draftLeads', () => {
  it('turns drafts and skips into the entries awareness-draft applies', async () => {
    const call = vi
      .fn()
      .mockResolvedValueOnce(okDraft('folklore for me, no contest'))
      .mockResolvedValueOnce({ status: 'ok', data: { action: 'skip' } });
    const entries = await draftLeads(exported(lead('a'), lead('b')), { ...base, call });
    expect(entries).toEqual([
      { id: 'a', action: 'draft', draft: 'folklore for me, no contest', why: 'on topic for the ranking thread', image_ref: undefined },
      { id: 'b', action: 'skip' },
    ]);
  });

  it('keeps an image_ref only when the sub allows image comments', () => {
    const outcome = okDraft('that card fits', { image_ref: 'moment:vault-folklore-x' });
    expect(interpret(lead('a'), outcome).entry?.image_ref).toBeUndefined();
    expect(interpret(lead('a', { image_comments: 'image' }), outcome).entry?.image_ref).toBe('moment:vault-folklore-x');
  });

  it('skips the lead on unavailable and stops on a limit', async () => {
    const call = vi.fn(async () => ({ status: 'unavailable', reason: 'limit' }));
    const log = vi.fn();
    const entries = await draftLeads(exported(lead('a'), lead('b')), { ...base, call, log });
    expect(entries).toEqual([]);
    expect(call).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('lead a left new (unavailable: limit)'));
  });

  it('stops after two unavailable calls in a row, and an invalid result leaves the lead new', async () => {
    const call = vi.fn(async () => ({ status: 'unavailable', reason: 'Claude CLI timed out' }));
    await draftLeads(exported(lead('a'), lead('b'), lead('c')), { ...base, call });
    expect(call).toHaveBeenCalledTimes(2);
    const invalid = vi.fn(async () => ({ status: 'invalid', reason: 'missed the schema' }));
    expect(await draftLeads(exported(lead('a'), lead('b')), { ...base, call: invalid })).toEqual([]);
    expect(invalid).toHaveBeenCalledTimes(2);
  });

  it('stops when the per-run cap is reached', async () => {
    const call = vi.fn(async () => ({ status: 'capped', reason: 'per-run call cap reached' }));
    await draftLeads(exported(lead('a'), lead('b')), { ...base, call });
    expect(call).toHaveBeenCalledTimes(1);
  });
});

describe('storage: same validator and row shape as before', () => {
  it('stores a valid draft, rejects an over-long or pitchy one, never stores thread text', async () => {
    const threadText = 'UNIQUE-QUOTE-FROM-A-COMMENTER';
    const seen: string[] = [];
    const call = vi
      .fn()
      .mockImplementationOnce(async (input: { user: string }) => {
        seen.push(input.user);
        return okDraft('folklore for me, no contest');
      })
      .mockResolvedValueOnce(okDraft('x'.repeat(301)))
      .mockResolvedValueOnce(okDraft('see longlivets.com for the timeline'));
    const fetchThread = vi.fn(async () => ({ selftext: threadText, comments: [threadText] }));
    const urls = new Map([['a', 'https://www.reddit.com/r/TaylorSwift/comments/1/x/']]);
    const entries = await draftLeads(exported(lead('a'), lead('b'), lead('c')), { ...base, call, fetchThread, urls });
    expect(seen[0]).toContain(threadText);
    const { client, updates } = fakeSupabase(['a', 'b', 'c']);
    const result = await applyDrafts(client, entries, catalog);
    expect(result).toMatchObject({ drafted: 1, skipped: 0 });
    expect(result.rejected.map((r: { id: string }) => r.id)).toEqual(['b', 'c']);
    expect(updates).toHaveLength(1);
    expect(updates[0].patch).toEqual({
      draft: 'folklore for me, no contest',
      why: 'on topic for the ranking thread',
      image_ref: null,
      link_included: false,
      status: 'drafted',
    });
    expect(JSON.stringify(updates)).not.toContain(threadText);
  });
});

describe('thread context', () => {
  const body = [
    { data: { children: [{ data: { selftext: 'my  post\ntext' } }] } },
    {
      data: {
        children: [
          { kind: 't1', data: { body: 'first take', author: 'someone' } },
          { kind: 't1', data: { body: 'pinned', stickied: true } },
          { kind: 't1', data: { body: '[removed]' } },
          { kind: 'more', data: {} },
        ],
      },
    },
  ];

  it('keeps post text and top comments, no authors, drops stickied and removed', () => {
    const ctx = parseThreadContext(body);
    expect(ctx).toEqual({ selftext: 'my post text', comments: ['first take'] });
    expect(JSON.stringify(ctx)).not.toContain('someone');
  });

  it('fetches anonymously and never throws', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => body }));
    const ctx = await fetchThreadContext('https://www.reddit.com/r/x/comments/1/t/', { fetchImpl });
    expect(ctx.comments).toEqual(['first take']);
    expect(fetchImpl.mock.calls[0][0]).toContain('.json?raw_json=1&limit=8');
    expect(await fetchThreadContext('https://example.com/x', { fetchImpl })).toEqual({ error: 'not a reddit thread' });
    const blocked = vi.fn(async () => ({ ok: false, status: 403 }));
    expect(await fetchThreadContext('https://www.reddit.com/r/x/comments/1/t/', { fetchImpl: blocked })).toEqual({ error: 'HTTP 403' });
    const boom = vi.fn(async () => { throw new Error('net'); });
    expect((await fetchThreadContext('https://www.reddit.com/r/x/comments/1/t/', { fetchImpl: boom })).error).toBe('net');
  });

  it('stops fetching threads after a throttle but still drafts from the title', async () => {
    const fetchThread = vi.fn(async () => ({ error: 'HTTP 429' }));
    const call = vi.fn(async () => okDraft('folklore for me, no contest'));
    const urls = new Map([['a', 'https://www.reddit.com/r/x/comments/1/t/'], ['b', 'https://www.reddit.com/r/x/comments/2/t/']]);
    await draftLeads(exported(lead('a'), lead('b')), { ...base, call, fetchThread, urls });
    expect(fetchThread).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledTimes(2);
  });

  it('fences thread text as untrusted and omits the block when there is none', () => {
    const withThread = buildUserMessage(lead('a'), ['folklore'], { selftext: 's', comments: ['c'] });
    expect(withThread).toContain('UNTRUSTED DATA');
    expect(buildUserMessage(lead('a'), ['folklore'], null)).not.toContain('<thread>');
  });
});

describe('dry run', () => {
  it('prints eligible leads and prompt sizes without any call', () => {
    const log = vi.fn();
    dryRun(exported(lead('a'), lead('b')), 'system prompt', log);
    expect(log.mock.calls[0][0]).toContain('2 eligible lead(s), system prompt 13 chars');
    expect(log).toHaveBeenCalledTimes(3);
  });
});
