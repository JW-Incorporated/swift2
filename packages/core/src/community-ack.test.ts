import { describe, expect, it, vi } from 'vitest';
import { ackPosted, ackSkipped } from './community-ack';

// A minimal fake SupabaseClient covering exactly the chains community-ack.ts
// calls (.from().select().eq().maybeSingle(), .from().update().eq(),
// .from().insert(), .rpc()) — same lightweight-fake convention as
// devices.test.ts / notification-events.test.ts in this package.
function makeFakeDb(opts: {
  lead: Record<string, unknown> | null;
  fetchError?: { message: string } | null;
  updateError?: { message: string } | null;
  insertError?: { message: string } | null;
  rpcError?: { message: string } | null;
}) {
  const calls: { table: string; op: string; args: unknown[] }[] = [];
  const from = vi.fn((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(async () => {
          calls.push({ table, op: 'select', args: [] });
          return { data: opts.lead, error: opts.fetchError ?? null };
        }),
      })),
    })),
    update: vi.fn((patch: Record<string, unknown>) => ({
      eq: vi.fn(async () => {
        calls.push({ table, op: 'update', args: [patch] });
        return { error: opts.updateError ?? null };
      }),
    })),
    insert: vi.fn(async (row: Record<string, unknown>) => {
      calls.push({ table, op: 'insert', args: [row] });
      return { error: opts.insertError ?? null };
    }),
  }));
  const rpc = vi.fn(async (fn: string, args: Record<string, unknown>) => {
    calls.push({ table: 'rpc', op: fn, args: [args] });
    return { error: opts.rpcError ?? null };
  });
  return { db: { from, rpc } as never, calls };
}

const LEAD_ID = '11111111-1111-4111-8111-111111111111';

describe('ackPosted', () => {
  it('returns not_found for an unknown lead id', async () => {
    const { db } = makeFakeDb({ lead: null });
    const result = await ackPosted(db, LEAD_ID, false);
    expect(result).toEqual({ ok: false, error: 'not_found' });
  });

  it('updates status, inserts a ledger row, and bumps the counter for a link-free reddit post', async () => {
    const { db, calls } = makeFakeDb({
      lead: {
        id: LEAD_ID,
        platform: 'reddit',
        community: 'TaylorSwift',
        thread_id: 't3_abc',
        locator: null,
        link_included: null,
        status: 'drafted',
      },
    });
    const result = await ackPosted(db, LEAD_ID, false, 'joey');
    expect(result).toEqual({ ok: true, alreadyActed: false });

    const update = calls.find((c) => c.op === 'update');
    expect(update?.args[0]).toMatchObject({ status: 'posted', link_included: false });

    const insert = calls.find((c) => c.op === 'insert');
    expect(insert?.args[0]).toMatchObject({
      lead_id: LEAD_ID,
      platform: 'reddit',
      community: 'TaylorSwift',
      thread_id: 't3_abc',
      comment_target: 't3_abc',
      link_included: false,
      posted_by: 'joey',
    });

    const rpcCall = calls.find((c) => c.table === 'rpc');
    expect(rpcCall?.op).toBe('increment_community_counter');
    expect(rpcCall?.args[0]).toEqual({ p_id: 'reddit_non_promo' });
  });

  it('does NOT bump the etiquette counter when a link was included', async () => {
    const { db, calls } = makeFakeDb({
      lead: {
        id: LEAD_ID,
        platform: 'reddit',
        community: 'SwiftlyNeutral',
        thread_id: 't3_xyz',
        locator: null,
        link_included: null,
        status: 'drafted',
      },
    });
    await ackPosted(db, LEAD_ID, true);
    expect(calls.some((c) => c.table === 'rpc')).toBe(false);
  });

  it('does NOT bump the etiquette counter for a facebook post (reddit-only counter)', async () => {
    const { db, calls } = makeFakeDb({
      lead: {
        id: LEAD_ID,
        platform: 'facebook',
        community: "Taylor Swift's Vault",
        thread_id: null,
        locator: "Taylor Swift's Vault: someone asked...",
        link_included: null,
        status: 'drafted',
      },
    });
    await ackPosted(db, LEAD_ID, false);
    expect(calls.some((c) => c.table === 'rpc')).toBe(false);
  });

  it('is idempotent — a lead already posted performs no further writes', async () => {
    const { db, calls } = makeFakeDb({
      lead: { id: LEAD_ID, platform: 'reddit', community: 'TaylorSwift', status: 'posted' },
    });
    const result = await ackPosted(db, LEAD_ID, false);
    expect(result).toEqual({ ok: true, alreadyActed: true });
    expect(calls.some((c) => c.op === 'update' || c.op === 'insert')).toBe(false);
  });

  it('is idempotent for an already-skipped lead too', async () => {
    const { db, calls } = makeFakeDb({
      lead: { id: LEAD_ID, platform: 'reddit', community: 'TaylorSwift', status: 'skipped_redline' },
    });
    const result = await ackPosted(db, LEAD_ID, false);
    expect(result).toEqual({ ok: true, alreadyActed: true });
    expect(calls.some((c) => c.op === 'update' || c.op === 'insert')).toBe(false);
  });

  it('surfaces a db error from the update step', async () => {
    const { db } = makeFakeDb({
      lead: { id: LEAD_ID, platform: 'reddit', community: 'TaylorSwift', status: 'drafted' },
      updateError: { message: 'boom' },
    });
    const result = await ackPosted(db, LEAD_ID, false);
    expect(result).toEqual({ ok: false, error: 'db_error', message: 'boom' });
  });
});

describe('ackSkipped', () => {
  it('returns not_found for an unknown lead id', async () => {
    const { db } = makeFakeDb({ lead: null });
    const result = await ackSkipped(db, LEAD_ID);
    expect(result).toEqual({ ok: false, error: 'not_found' });
  });

  it('marks the lead skipped_by_founder', async () => {
    const { db, calls } = makeFakeDb({ lead: { id: LEAD_ID, status: 'drafted' } });
    const result = await ackSkipped(db, LEAD_ID);
    expect(result).toEqual({ ok: true, alreadyActed: false });
    const update = calls.find((c) => c.op === 'update');
    expect(update?.args[0]).toEqual({ status: 'skipped_by_founder' });
  });

  it('is idempotent for an already-terminal lead', async () => {
    const { db, calls } = makeFakeDb({ lead: { id: LEAD_ID, status: 'posted' } });
    const result = await ackSkipped(db, LEAD_ID);
    expect(result).toEqual({ ok: true, alreadyActed: true });
    expect(calls.some((c) => c.op === 'update')).toBe(false);
  });
});
