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
const unscored = async (items: { id: string; text: string }[]) =>
  items.map((i) => ({ id: i.id, text: i.text, status: 'not_scored' }));
const base = { system: 'sys', sleep: async () => undefined, log: () => undefined, review: unscored };

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

describe('voice critic integration', () => {
  const run = async (review: (items: { id: string; text: string }[]) => Promise<unknown[]>) => {
    const call = vi.fn(async () => okDraft('folklore for me, no contest'));
    const log = vi.fn();
    const entries = await draftLeads(exported(lead('a')), { ...base, call, review, log });
    return { entries, log };
  };
  const scored = (text: string, rewritten: boolean) => async () => [
    { id: 'a', status: 'scored', text, rewritten, rewriteAttempted: true },
  ];

  it('accepts a rewrite that passes the reply validator', async () => {
    const { entries, log } = await run(scored('folklore, easily. the bridge alone wins it', true));
    expect(entries[0]).toMatchObject({ draft: 'folklore, easily. the bridge alone wins it' });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('"rewritten":1'));
  });

  it('keeps the original when the rewrite fails the validator', async () => {
    const { entries, log } = await run(scored('check out longlivets.com for folklore', true));
    expect(entries[0]).toMatchObject({ draft: 'folklore for me, no contest' });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('"rewrite_invalid":1'));
  });

  it('rejects a rewrite that adds an @mention', async () => {
    const { entries } = await run(scored('folklore, easily. ask @someone', true));
    expect(entries[0]).toMatchObject({ draft: 'folklore for me, no contest' });
  });

  it('passes the 18-call per-run cap to the critic', async () => {
    const review = vi.fn(unscored);
    await run(review);
    expect(review.mock.calls[0][1]).toMatchObject({ maxCalls: 18 });
  });

  it('keeps the original when the critic did not score or throws', async () => {
    expect((await run(unscored)).entries[0]).toMatchObject({ draft: 'folklore for me, no contest' });
    const boom = async () => {
      throw new Error('boom');
    };
    expect((await run(boom)).entries[0]).toMatchObject({ draft: 'folklore for me, no contest' });
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
    const ctx = await fetchThreadContext('https://www.reddit.com/r/x/comments/1/t/', { fetchImpl, env: { REDDIT_THREAD_JSON: '1' } });
    expect(ctx.comments).toEqual(['first take']);
    expect(fetchImpl.mock.calls[0][0]).toContain('.json?raw_json=1&limit=8');
    expect(await fetchThreadContext('https://example.com/x', { fetchImpl, env: { REDDIT_THREAD_JSON: '1' } })).toEqual({ error: 'not a reddit thread' });
    const blocked = vi.fn(async () => ({ ok: false, status: 403 }));
    expect(await fetchThreadContext('https://www.reddit.com/r/x/comments/1/t/', { fetchImpl: blocked, env: { REDDIT_THREAD_JSON: '1' } })).toEqual({ error: 'HTTP 403' });
    const boom = vi.fn(async () => { throw new Error('net'); });
    expect((await fetchThreadContext('https://www.reddit.com/r/x/comments/1/t/', { fetchImpl: boom, env: { REDDIT_THREAD_JSON: '1' } })).error).toBe('net');
  });

  it('makes no Reddit request at all with REDDIT_THREAD_JSON off', async () => {
    const fetchImpl = vi.fn();
    const globalFetch = vi.spyOn(globalThis, 'fetch');
    const url = 'https://www.reddit.com/r/x/comments/1/t/';
    expect(await fetchThreadContext(url, { fetchImpl, env: {} })).toEqual({ error: 'thread json disabled' });
    expect(await fetchThreadContext(url, { fetchImpl, env: { REDDIT_THREAD_JSON: '0' } })).toEqual({ error: 'thread json disabled' });
    expect(await fetchThreadContext(url, { env: {} })).toEqual({ error: 'thread json disabled' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(globalFetch).not.toHaveBeenCalled();
    globalFetch.mockRestore();
  });

  it('falls back to the stored snippet when there is no thread text', async () => {
    const call = vi.fn(async () => okDraft('folklore for me, no contest'));
    await draftLeads(exported(lead('a')), { ...base, call, snippets: new Map([['a', 'stored  snippet']]) });
    expect((call.mock.calls[0][0] as { user: string }).user).toContain('stored snippet');
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
