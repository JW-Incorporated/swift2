/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error plain .mjs module
import { runPoller } from './poller.mjs';
// @ts-expect-error plain .mjs module
import { buildQwenMessage, cleanReply } from './message.mjs';
// @ts-expect-error plain .mjs module
import { buildMessages } from './prompt.mjs';
// @ts-expect-error plain .mjs module
import { callOnce, normalizeBaseUrl } from './qwen-client.mjs';

type Row = Record<string, any>;

function lead(over: Row = {}): Row {
  return {
    id: 'l1',
    platform: 'reddit',
    community: 'TaylorSwift',
    kind: 'reply_to_us',
    title: 'Thread title',
    context: 'Our summary',
    draft: 'Tree draft',
    link_included: false,
    status: 'delivered',
    discord_message_id: '555',
    created_at: '2026-10-17T00:00:00Z',
    qwen_status: 'pending',
    qwen_draft: null,
    qwen_attempts: 0,
    qwen_discord_message_id: null,
    qwen_error: null,
    ...over,
  };
}

// Minimal in-memory PostgREST-shaped builder: eq/in/is/not/order/limit/select/update.
function fakeDb(rows: Row[]) {
  const from = () => {
    const filters: Array<(r: Row) => boolean> = [];
    let patch: Row | null = null;
    let lim = Infinity;
    let sortCol: string | null = null;
    let returning = false;
    const b: any = {
      select: () => {
        returning = true;
        return b;
      },
      update: (p: Row) => {
        patch = p;
        return b;
      },
      eq: (c: string, v: any) => (filters.push((r) => r[c] === v), b),
      in: (c: string, v: any[]) => (filters.push((r) => v.includes(r[c])), b),
      is: (c: string, v: any) => (filters.push((r) => (r[c] ?? null) === v), b),
      not: (c: string, op: string, v: any) => {
        if (op === 'is') filters.push((r) => (r[c] ?? null) !== v);
        else filters.push((r) => !String(v).slice(1, -1).split(',').includes(r[c]));
        return b;
      },
      order: (c: string) => ((sortCol = c), b),
      limit: (n: number) => ((lim = n), b),
      then: (res: any, rej: any) => {
        let hit = rows.filter((r) => filters.every((f) => f(r)));
        if (sortCol) hit = hit.sort((a, z) => String(a[sortCol!]).localeCompare(String(z[sortCol!])));
        hit = hit.slice(0, lim);
        if (patch) hit.forEach((r) => Object.assign(r, patch));
        return Promise.resolve({ data: returning || !patch ? hit.map((r) => ({ ...r })) : null, error: null }).then(res, rej);
      },
    };
    return b;
  };
  return { from };
}

const OK = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
const ERR = (status: number, code = 'x') => new Response(JSON.stringify({ error: { code } }), { status });

function setup(rows: Row[], qwen: (url: string, init: any) => Response | Promise<Response>, env: Row = {}) {
  const calls: Array<{ url: string; init: any }> = [];
  const fetchImpl = vi.fn(async (url: string, init: any) => {
    calls.push({ url, init });
    if (url.includes('discord.com')) return new Response(JSON.stringify({ id: `d${calls.length}` }), { status: 200 });
    return qwen(url, init);
  });
  const run = () =>
    runPoller({
      supabase: fakeDb(rows),
      env: { QWEN_BASE_URL: 'http://qwen.example/v1', QWEN_API_KEY: 'k', DISCORD_BOT_TOKEN: 'bt', ...env },
      fetchImpl,
      sleep: async () => {},
      log: vi.fn(),
      now: () => new Date('2026-10-17T12:00:00Z'),
    });
  return { run, calls, fetchImpl };
}
const qwenCalls = (calls: any[]) => calls.filter((c) => c.url.includes('qwen.example'));
const discordCalls = (calls: any[]) => calls.filter((c) => c.url.includes('discord.com'));

describe('claim', () => {
  it('claims atomically: a lost compare-and-set draws nothing, and reruns do not redo done rows', async () => {
    const rows = [lead()];
    const { run, calls } = setup(rows, () => OK('Alt reply'));
    const db = fakeDb(rows);
    const orig = db.from;
    // Another runner bumps attempts between select and claim.
    let first = true;
    const stale = {
      from: () => {
        const b = orig();
        const origUpdate = b.update;
        b.update = (p: Row) => {
          if (first && 'qwen_attempts' in p && !('qwen_status' in p)) {
            first = false;
            rows[0].qwen_attempts = 1;
          }
          return origUpdate(p);
        };
        return b;
      },
    };
    const env = { QWEN_BASE_URL: 'http://qwen.example/v1', QWEN_API_KEY: 'k' };
    const f = vi.fn(async () => OK('x'));
    const s = await runPoller({ supabase: stale, env, fetchImpl: f, sleep: async () => {}, log: vi.fn() });
    expect(s.done).toBe(0);
    expect(f).not.toHaveBeenCalled();
    // normal path then runs once and is idempotent
    await run();
    await run();
    expect(qwenCalls(calls)).toHaveLength(1);
    expect(rows[0].qwen_status).toBe('done');
  });

  it('skips non-reply kinds and owner-handled leads', async () => {
    const rows = [
      lead({ id: 'a', kind: 'awareness_reply' }),
      lead({ id: 'b', status: 'posted' }),
      lead({ id: 'c', platform: 'x' }),
    ];
    const { run, calls } = setup(rows, () => OK('Alt'));
    await run();
    expect(rows.map((r) => r.qwen_status)).toEqual(['skipped', 'skipped', 'skipped']);
    expect(calls).toHaveLength(0);
  });

  it('only claims leads that have a card message id', async () => {
    const rows = [lead({ discord_message_id: null })];
    const { run, calls } = setup(rows, () => OK('Alt'));
    await run();
    expect(calls).toHaveLength(0);
    expect(rows[0].qwen_status).toBe('pending');
  });
});

describe('qwen calls', () => {
  it('sends the thinking-off body to BASE/chat/completions with the bearer key', async () => {
    const rows = [lead()];
    const { run, calls } = setup(rows, () => OK('Alt'));
    await run();
    const q = qwenCalls(calls)[0];
    expect(q.url).toBe('http://qwen.example/v1/chat/completions');
    expect(q.init.headers.authorization).toBe('Bearer k');
    const body = JSON.parse(q.init.body);
    expect(body).toMatchObject({ model: 'local-worker', max_tokens: 600, chat_template_kwargs: { enable_thinking: false } });
  });

  it('normalizes the base url idempotently', () => {
    expect(normalizeBaseUrl('http://h/v1')).toBe('http://h/v1');
    expect(normalizeBaseUrl('http://h/')).toBe('http://h/v1');
    expect(normalizeBaseUrl('http://h')).toBe('http://h/v1');
  });

  it('treats a non-2xx error object as an error, never parsing choices', async () => {
    const f = async () =>
      new Response(JSON.stringify({ error: { code: 'rate' }, choices: [{ message: { content: 'nope' } }] }), { status: 429 });
    const r = await callOnce({ baseUrl: 'http://h', apiKey: 'k', model: 'm', messages: [], fetchImpl: f });
    expect(r).toMatchObject({ ok: false, status: 429, retryable: true });
  });

  it('retries an empty or reasoning-only 200, and trims content', async () => {
    const rows = [lead()];
    const responses = [
      new Response(JSON.stringify({ choices: [{ message: { content: '', reasoning_content: 'thinking' }, finish_reason: 'length' }] }), { status: 200 }),
      OK('\n\n  Trimmed reply \n'),
    ];
    const { run, calls } = setup(rows, () => responses.shift()!);
    await run();
    expect(qwenCalls(calls)).toHaveLength(2);
    expect(rows[0].qwen_draft).toBe('Trimmed reply');
  });

  it('falls back to the fallback model, also with thinking off; 403 does not retry the primary', async () => {
    const rows = [lead()];
    const { run, calls } = setup(rows, (_u, init) =>
      JSON.parse(init.body).model === 'local-worker' ? ERR(403, 'key_model_access_denied') : OK('From fallback'),
    );
    await run();
    const models = qwenCalls(calls).map((c) => JSON.parse(c.init.body));
    expect(models.map((m: any) => m.model)).toEqual(['local-worker', 'local-orchestrator']);
    expect(models[1].chat_template_kwargs).toEqual({ enable_thinking: false });
    expect(rows[0].qwen_draft).toBe('From fallback');
  });

  it('retries 5xx once per model then fails over, and marks failed after 5 attempts', async () => {
    const rows = [lead({ qwen_attempts: 4 })];
    const { run, calls } = setup(rows, () => ERR(500));
    await run();
    expect(qwenCalls(calls)).toHaveLength(4);
    expect(rows[0].qwen_status).toBe('failed');
    expect(rows[0].qwen_attempts).toBe(5);
    expect(discordCalls(calls)).toHaveLength(0);
  });

  it('counts an attempt on failure and stays pending below the cap', async () => {
    const rows = [lead()];
    const { run } = setup(rows, () => ERR(500));
    await run();
    expect(rows[0]).toMatchObject({ qwen_status: 'pending', qwen_attempts: 1 });
  });

  it('leaves rows pending, attempts untouched, when Qwen is unreachable', async () => {
    const rows = [lead(), lead({ id: 'l2' })];
    const { run, calls } = setup(rows, () => {
      throw new TypeError('fetch failed');
    });
    const s = await run();
    expect(s.unreachable).toBe(true);
    expect(rows.map((r) => [r.qwen_status, r.qwen_attempts])).toEqual([['pending', 0], ['pending', 0]]);
    expect(qwenCalls(calls)).toHaveLength(4);
  });
});

describe('store then post', () => {
  it('stores the draft, then posts a reply to the card in the lead channel', async () => {
    const rows = [lead({ platform: 'facebook', discord_message_id: '777' })];
    const { run, calls } = setup(rows, () => OK('Alt reply'));
    await run();
    const d = discordCalls(calls);
    expect(d).toHaveLength(1);
    expect(d[0].url).toContain('/channels/1558093113807999026/messages');
    const body = JSON.parse(d[0].init.body);
    expect(body.message_reference.message_id).toBe('777');
    expect(body.content).toBe('-# Qwen\n```\nAlt reply\n```');
    expect(rows[0]).toMatchObject({ qwen_status: 'done', qwen_draft: 'Alt reply', qwen_discord_message_id: expect.any(String) });
  });

  it('keeps a stored draft when Discord fails, and a later run posts it exactly once', async () => {
    const rows = [lead()];
    let discordOk = false;
    const calls: any[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      calls.push(url);
      if (url.includes('discord.com')) return discordOk ? new Response(JSON.stringify({ id: '9' }), { status: 200 }) : new Response('', { status: 500 });
      return OK('Alt');
    });
    const run = () =>
      runPoller({ supabase: fakeDb(rows), env: { QWEN_BASE_URL: 'http://q/v1', QWEN_API_KEY: 'k', DISCORD_BOT_TOKEN: 't' }, fetchImpl, sleep: async () => {}, log: vi.fn() });
    await run();
    expect(rows[0]).toMatchObject({ qwen_status: 'done', qwen_discord_message_id: null });
    discordOk = true;
    await run();
    await run();
    expect(rows[0].qwen_discord_message_id).toBe('9');
    expect(calls.filter((u) => u.includes('discord.com'))).toHaveLength(2);
    expect(calls.filter((u) => u.includes('/chat/completions'))).toHaveLength(1);
  });

  it('without a bot token stores but does not post, then posts once the token exists', async () => {
    const rows = [lead()];
    const log = vi.fn();
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      calls.push(url);
      return url.includes('discord.com') ? new Response(JSON.stringify({ id: '5' }), { status: 200 }) : OK('Alt');
    });
    const base = { QWEN_BASE_URL: 'http://q/v1', QWEN_API_KEY: 'k' };
    await runPoller({ supabase: fakeDb(rows), env: base, fetchImpl, sleep: async () => {}, log });
    expect(log).toHaveBeenCalledWith('qwen-poller: post pending: DISCORD_BOT_TOKEN missing');
    expect(rows[0]).toMatchObject({ qwen_status: 'done', qwen_discord_message_id: null });
    expect(calls.some((u) => u.includes('discord.com'))).toBe(false);
    await runPoller({ supabase: fakeDb(rows), env: { ...base, DISCORD_BOT_TOKEN: 't' }, fetchImpl, sleep: async () => {}, log });
    expect(rows[0].qwen_discord_message_id).toBe('5');
  });
});

describe('message format', () => {
  it('is exactly the subtext line plus a code box', () => {
    expect(buildQwenMessage('Hello there')).toBe('-# Qwen\n```\nHello there\n```');
  });

  it('strips preamble, labels, quotes and bold', () => {
    expect(cleanReply("Here is a draft reply:\n\"Love this take.\"")).toBe('Love this take.');
    expect(cleanReply('Sure! Here is one:\nThat bridge is everything.')).toBe('That bridge is everything.');
    expect(cleanReply('Draft: **Same** here')).toBe('Same here');
    expect(cleanReply('“Quoted”')).toBe('Quoted');
    expect(cleanReply('Sure thing, that is right')).toBe('Sure thing, that is right');
  });

  it('escapes backtick runs so the box cannot close early', () => {
    const msg = buildQwenMessage('a ``` b');
    expect(msg.match(/```/g)).toHaveLength(2);
  });

  it('clips to 2000 units and neutralizes mass mentions', () => {
    const msg = buildQwenMessage('😀'.repeat(3000) + ' @everyone');
    expect(msg.length).toBeLessThanOrEqual(2000);
    expect(msg.startsWith('-# Qwen\n```\n')).toBe(true);
    expect(msg.endsWith('\n```')).toBe(true);
    expect(buildQwenMessage('hi @everyone')).toContain('@​everyone');
  });

  it('returns nothing for an empty reply', () => {
    expect(buildQwenMessage('  ')).toBe('');
  });
});

describe('prompt', () => {
  it('is deterministic and carries the lead fields', () => {
    const a = buildMessages(lead());
    expect(a).toEqual(buildMessages(lead()));
    expect(a[1].content).toContain('Thread title');
    expect(a[1].content).toContain('Tree draft');
    expect(a[0].content).toContain('Output ONLY the reply text');
  });
});
