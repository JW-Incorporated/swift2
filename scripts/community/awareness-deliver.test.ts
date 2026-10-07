import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { BATCH_CAP, DAILY_CAP, ensureImageRef, runDelivery } from './awareness-deliver.mjs';

const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16),
]);
const catalog = {
  eras: ['folklore', 'ttpd', 'tloas'].map((id) => ({ id, name: id })),
  moments: [{ id: 'vault-folklore-x', eraId: 'folklore', title: 'x' }],
};
const config = {
  defaults: { perSubDailyDeliveryCap: 3 },
  subs: [
    { name: 'TaylorSwift', tier: 1, selfPromoNote: 'No self-promo here.' },
    { name: 'swifties', tier: 1, selfPromoNote: 'Standard 9:1.' },
  ],
};

function lead(n: number, community = 'TaylorSwift', overrides: Record<string, unknown> = {}) {
  return {
    id: `lead-${n}`,
    platform: 'reddit',
    community,
    url: `https://www.reddit.com/r/${community}/comments/${n}/x/`,
    title: `Thread ${n}`,
    draft: `reply number ${n}`,
    why: 'fits',
    image_ref: 'era:folklore',
    image_comments: 'image',
    thread_type: 'ranking',
    created_at: `2026-10-01T10:0${n % 10}:00Z`,
    ...overrides,
  };
}

function fakeSupabase({
  drafted = [] as unknown[],
  deliveredToday = [] as { community: string }[],
  onUpdate = undefined as ((patch: unknown, id: string) => void) | undefined,
} = {}) {
  return {
    from() {
      const state: { delivered?: boolean } = {};
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: (col: string, val: string) => {
          if (col === 'id') onUpdate?.(builder.patch, val);
          return builder;
        },
        not: () => builder,
        gte: (col: string) => {
          state.delivered = col === 'discord_delivered_at';
          return state.delivered ? Promise.resolve({ data: deliveredToday, error: null }) : builder;
        },
        limit: () => Promise.resolve({ data: drafted, error: null }),
        update: (patch: unknown) => {
          builder.patch = patch;
          return builder;
        },
        then: (resolve: (v: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve),
      };
      return builder;
    },
  };
}

function discord() {
  const calls: { url: string; body: unknown }[] = [];
  const fetchImpl = vi.fn(async (url: string, init?: { body?: unknown }) => {
    if (String(url).includes('/api/share-card')) return new Response(PNG, { status: 200 });
    calls.push({ url: String(url), body: init?.body });
    return new Response(JSON.stringify({ id: `msg-${calls.length}` }), { status: 200 });
  });
  return { fetchImpl, calls };
}

describe('ensureImageRef', () => {
  it('keeps a valid ref and replaces an unknown one with the deterministic pick', () => {
    expect(ensureImageRef({ image_ref: 'moment:vault-folklore-x', title: 't' }, catalog)).toBe(
      'moment:vault-folklore-x',
    );
    expect(
      ensureImageRef({ image_ref: 'moment:made-up', title: 'Ranking folklore' }, catalog),
    ).toBe('era:folklore');
  });
});

describe('runDelivery', () => {
  it('uploads each card as multipart, marks the lead delivered, and posts no batch header', async () => {
    const { fetchImpl, calls } = discord();
    const updates: unknown[] = [];
    const supabase = fakeSupabase({
      drafted: [lead(1), lead(2, 'swifties')],
      deliveredToday: [{ community: 'TaylorSwift' }],
      onUpdate: (p) => updates.push(p),
    });
    const result = await runDelivery({
      supabase,
      webhook: 'https://discord.test/hook',
      catalog,
      config,
      ackSecret: 'secret',
      fetchImpl: fetchImpl as never,
    });
    expect(result.delivered).toHaveLength(2);
    expect(result.failed).toEqual([]);
    expect(result.totalToday).toBe(3);
    // Exactly card + reply per lead: no header message before the batch.
    expect(calls).toHaveLength(4);
    expect(calls[0].body).toBeInstanceOf(FormData);
    const form = calls[0].body as FormData;
    expect((form.get('files[0]') as File).type).toBe('image/png');
    const card = String(JSON.parse(String(form.get('payload_json'))).content);
    expect(card.split('\n')[0]).toBe('<https://www.reddit.com/r/TaylorSwift/comments/1/x/>');
    expect(card).toContain('/api/community/ack?lead=lead-1&action=posted');
    expect(card).not.toContain('No self-promo');
    expect(card).not.toContain('```');
    // The reply follows its card as a plain message holding nothing else, so
    // long-press "Copy Text" on mobile copies exactly the reply.
    const reply = JSON.parse(String(calls[1].body));
    expect(reply.content).toBe(lead(1).draft);
    expect(reply).toMatchObject({
      username: 'Tree · Awareness replies',
      allowed_mentions: { parse: [] },
    });
    expect(calls[2].body).toBeInstanceOf(FormData);
    expect(JSON.parse(String(calls[3].body)).content).toBe(lead(2, 'swifties').draft);
    expect(updates.filter((p) => (p as { status?: string }).status === 'delivered')).toHaveLength(
      2,
    );
  });

  it('respects the per-sub daily cap given what was already delivered today', async () => {
    const { fetchImpl } = discord();
    const drafted = [1, 2, 3, 4].map((n) => lead(n));
    const supabase = fakeSupabase({
      drafted,
      deliveredToday: [{ community: 'TaylorSwift' }, { community: 'TaylorSwift' }],
    });
    const result = await runDelivery({
      supabase,
      webhook: 'h',
      catalog,
      config,
      fetchImpl: fetchImpl as never,
      postHeader: async () => true,
    });
    expect(result.delivered).toHaveLength(1);
  });

  it('caps a batch and never passes the daily total', async () => {
    const { fetchImpl } = discord();
    const subs = Array.from({ length: 12 }, (_, i) => ({ name: `S${i}`, tier: 1 }));
    const drafted = subs.map((s, i) => lead(i, s.name));
    const supabase = fakeSupabase({ drafted });
    const result = await runDelivery({
      supabase,
      webhook: 'h',
      catalog,
      config: { defaults: config.defaults, subs },
      fetchImpl: fetchImpl as never,
      postHeader: async () => true,
    });
    expect(result.delivered).toHaveLength(BATCH_CAP);
    expect(BATCH_CAP * 3).toBeGreaterThan(DAILY_CAP - 1);
    const full = fakeSupabase({
      drafted,
      deliveredToday: Array.from({ length: DAILY_CAP }, (_, i) => ({ community: `X${i}` })),
    });
    const none = await runDelivery({
      supabase: full,
      webhook: 'h',
      catalog,
      config: { defaults: config.defaults, subs },
      fetchImpl: fetchImpl as never,
      postHeader: async () => true,
    });
    expect(none.batch).toBe(0);
  });

  it('delivers nothing and posts no header when no draft is waiting', async () => {
    const { fetchImpl, calls } = discord();
    const header = vi.fn(async () => true);
    const result = await runDelivery({
      supabase: fakeSupabase(),
      webhook: 'h',
      catalog,
      config,
      fetchImpl: fetchImpl as never,
      postHeader: header,
    });
    expect(result.batch).toBe(0);
    expect(header).not.toHaveBeenCalled();
    expect(calls).toHaveLength(0);
  });

  it('dry-run selects but sends nothing', async () => {
    const { fetchImpl, calls } = discord();
    const result = await runDelivery({
      supabase: fakeSupabase({ drafted: [lead(1)] }),
      webhook: 'h',
      catalog,
      config,
      dryRun: true,
      fetchImpl: fetchImpl as never,
    });
    expect(result).toMatchObject({ batch: 1, delivered: [], dryRun: true });
    expect(calls).toHaveLength(0);
  });

  it('reports a Discord failure per lead without marking it delivered', async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      String(url).includes('/api/share-card')
        ? new Response(PNG)
        : new Response('no', { status: 500 }),
    );
    const updates: unknown[] = [];
    const result = await runDelivery({
      supabase: fakeSupabase({ drafted: [lead(1)], onUpdate: (p) => updates.push(p) }),
      webhook: 'h',
      catalog,
      config,
      fetchImpl: fetchImpl as never,
      postHeader: async () => true,
    });
    expect(result.delivered).toEqual([]);
    expect(result.failed[0].message).toMatch(/HTTP 500/);
    expect(updates).toEqual([]);
  });

  it('keeps a posted card delivered when only its reply-text message fails, and reports it', async () => {
    const fetchImpl = vi.fn(async (url: string, init?: { body?: unknown }) => {
      if (String(url).includes('/api/share-card')) return new Response(PNG);
      if (init?.body instanceof FormData)
        return new Response(JSON.stringify({ id: 'card-1' }), { status: 200 });
      return new Response('no', { status: 500 });
    });
    const updates: unknown[] = [];
    const result = await runDelivery({
      supabase: fakeSupabase({ drafted: [lead(1)], onUpdate: (p) => updates.push(p) }),
      webhook: 'h',
      catalog,
      config,
      fetchImpl: fetchImpl as never,
      postHeader: async () => true,
    });
    expect(result.delivered).toEqual([expect.objectContaining({ messageId: 'card-1' })]);
    expect(result.failed[0].message).toMatch(/reply-text delivery failed with HTTP 500/);
    expect(updates.filter((p) => (p as { status?: string }).status === 'delivered')).toHaveLength(
      1,
    );
  });
});

describe('runDelivery caps and unlisted subs', () => {
  const bigConfig = {
    defaults: { perSubDailyDeliveryCap: 3 },
    subs: [{ name: 'TaylorSwift', tier: 1, dailyCap: 4 }],
  };

  it('lets r/TaylorSwift reach 4 a day while other subs stay at 3', async () => {
    const { fetchImpl } = discord();
    const drafted = [
      ...[1, 2, 3, 4, 5].map((n) => lead(n, 'TaylorSwift')),
      ...[6, 7, 8, 9].map((n) => lead(n, 'popculturechat')),
    ];
    const result = await runDelivery({
      supabase: fakeSupabase({ drafted }),
      webhook: 'h',
      catalog,
      config: bigConfig,
      fetchImpl: fetchImpl as never,
      postHeader: async () => true,
    });
    const byCommunity = (name: string) =>
      result.delivered.filter((d: { leadId: string }) => {
        const n = Number(d.leadId.split('-')[1]);
        return drafted.find((l) => l.id === `lead-${n}`)?.community === name;
      }).length;
    expect(byCommunity('TaylorSwift')).toBe(4);
    expect(byCommunity('popculturechat')).toBe(1); // batch cap of 5 reached
    expect(result.delivered).toHaveLength(5);
  });

  it('caps the whole day at 15 and sends an unlisted sub as a bare link card', async () => {
    const { fetchImpl, calls } = discord();
    const full = fakeSupabase({
      drafted: [lead(1, 'AskReddit', { image_comments: 'unknown' })],
      deliveredToday: Array.from({ length: DAILY_CAP }, (_, i) => ({ community: `X${i}` })),
    });
    const none = await runDelivery({
      supabase: full,
      webhook: 'h',
      catalog,
      config: bigConfig,
      fetchImpl: fetchImpl as never,
      postHeader: async () => true,
    });
    expect(none.batch).toBe(0);
    const ok = await runDelivery({
      supabase: fakeSupabase({ drafted: [lead(1, 'AskReddit', { image_comments: 'unknown' })] }),
      webhook: 'h',
      catalog,
      config: bigConfig,
      fetchImpl: fetchImpl as never,
      postHeader: async () => true,
    });
    expect(ok.delivered).toHaveLength(1);
    const content = String(
      JSON.parse(String((calls[0].body as FormData).get('payload_json'))).content,
    );
    // Owner 2026-10-05: the card is the link only — no rule note, no label.
    expect(content).toBe(
      '<https://www.reddit.com/r/AskReddit/comments/1/x/>\nReact ✅ posted · ⏭️ skip\nref: reddit · lead-1',
    );
    expect(DAILY_CAP).toBe(15);
    expect(BATCH_CAP).toBe(5);
  });
});

describe('delivery re-lints what it reads', () => {
  it('never sends a draft that fails the reply lint, even if it was saved as drafted', async () => {
    const { fetchImpl, calls } = discord();
    const drafted = [
      lead(1, 'TaylorSwift', { draft: 'see https://longlivets.com for more' }),
      lead(2, 'swifties', { draft: 'folklore, no contest' }),
    ];
    const result = await runDelivery({
      supabase: fakeSupabase({ drafted }),
      webhook: 'h',
      catalog,
      config,
      fetchImpl: fetchImpl as never,
      postHeader: async () => true,
    });
    expect(result.delivered).toHaveLength(1);
    expect(calls).toHaveLength(2); // its card + its reply text
    expect(result.drafted).toBe(1);
  });
});
