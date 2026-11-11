import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { parseArgs, parseCutoff, runRepost } from './awareness-repost.mjs';

type Row = Record<string, unknown>;
const base = { community: 'c', why: 'w', image_ref: null, image_comments: 'text_only', thread_type: 'x', kind: 'awareness_reply', status: 'delivered' };
const mkRows = (): Row[] => [
  { ...base, id: 'a', platform: 'reddit', url: 'https://www.reddit.com/r/TaylorSwift/comments/1/x/', title: 'T1', draft: 'reply one', discord_delivered_at: '2026-10-01T00:00:00Z', discord_message_id: 'old-a' },
  { ...base, id: 'b', platform: 'facebook', url: 'https://www.facebook.com/groups/1/posts/2/', title: 'T2', draft: 'reply two', discord_delivered_at: '2026-10-02T00:00:00Z', discord_message_id: 'old-b' },
];

/** In-memory engagement_lead honouring eq / in / not / lt / gte / order / limit, and update().…select(). */
function fakeSupabase(rows: Row[], opts: { failUpdate?: (patch: Row) => boolean; zeroRowUpdate?: (patch: Row) => boolean } = {}) {
  const from = () => {
    const filters: Array<(r: Row) => boolean> = [];
    let patch: Row | null = null;
    let order: string | null = null;
    const b: Record<string, unknown> = {};
    b.select = () => {
      if (patch) {
        if (opts.failUpdate?.(patch)) return Promise.resolve({ data: null, error: new Error('db down') });
        if (opts.zeroRowUpdate?.(patch)) return Promise.resolve({ data: [], error: null });
        const hit = rows.filter((r) => filters.every((f) => f(r)));
        for (const r of hit) Object.assign(r, patch);
        return Promise.resolve({ data: hit.map((r) => ({ id: r.id })), error: null });
      }
      return b;
    };
    b.eq = (c: string, v: unknown) => (filters.push((r) => r[c] === v), b);
    b.in = (c: string, vs: unknown[]) => (filters.push((r) => vs.includes(r[c])), b);
    b.not = (c: string, _op: string, v: unknown) => (filters.push((r) => r[c] !== v), b);
    b.lt = (c: string, v: string) => (filters.push((r) => String(r[c]) < v), b);
    b.gte = (c: string, v: string) => (filters.push((r) => String(r[c]) >= v), b);
    b.order = (c: string) => ((order = c), b);
    b.limit = () => {
      const hit = rows.filter((r) => filters.every((f) => f(r)));
      if (order) hit.sort((x, y) => String(x[order!]).localeCompare(String(y[order!])));
      return Promise.resolve({ data: hit.map((r) => ({ ...r })), error: null });
    };
    b.update = (p: Row) => ((patch = p), b);
    return b;
  };
  return { from };
}
const catalog = { eras: [], moments: [] };
const NOW = new Date('2026-10-09T12:00:00Z');
const BEFORE = '2026-10-09T00:00:00Z';
const sendOk = () => vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: '555' }) });
const live = (rows: Row[], extra: Record<string, unknown> = {}) => ({
  supabase: fakeSupabase(rows, extra.db as never),
  catalog,
  before: BEFORE,
  now: NOW,
  live: true,
  ackSecret: 's',
  env: { DISCORD_BOT_TOKEN: 'b' },
  log: () => {},
  ...extra,
});

describe('awareness-repost', () => {
  it('is a dry run by default and sends nothing', async () => {
    const rows = mkRows();
    const fetchImpl = vi.fn();
    const r = await runRepost({ supabase: fakeSupabase(rows), catalog, before: BEFORE, now: NOW, fetchImpl, log: () => {} });
    expect(r.dryRun).toBe(true);
    expect(r.pending).toBe(2);
    expect(r.counts).toEqual({ 'tree-reddit': 1, 'tree-facebook': 1 });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(rows[0].discord_message_id).toBe('old-a');
  });

  it('live: card + reply text per lead to the platform channel and the lead points at the new card', async () => {
    const rows = mkRows();
    const fetchImpl = sendOk();
    const r = await runRepost({ ...live(rows), fetchImpl });
    expect(r.reposted).toHaveLength(2);
    expect(r.failed).toEqual([]);
    const urls = fetchImpl.mock.calls.map((c: unknown[]) => String(c[0]));
    expect(urls.filter((u: string) => u.includes('/1558093079351787580/'))).toHaveLength(2);
    expect(urls.filter((u: string) => u.includes('/1558093113807999026/'))).toHaveLength(2);
    expect(rows.map((x) => x.discord_message_id)).toEqual(['555', '555']);
  });

  it('a rerun with the same cutoff sends nothing (stateful)', async () => {
    const rows = mkRows();
    await runRepost({ ...live(rows), fetchImpl: sendOk() });
    const again = sendOk();
    const r = await runRepost({ ...live(rows), fetchImpl: again });
    expect(r.pending).toBe(0);
    expect(again).not.toHaveBeenCalled();
  });

  it('a lead claimed by another run between select and claim is skipped, not double-sent', async () => {
    const rows = mkRows();
    const db = fakeSupabase(rows);
    const realFrom = db.from;
    let first = true;
    db.from = () => {
      if (first) {
        first = false;
        return realFrom();
      }
      rows[0].discord_delivered_at = '2026-10-09T11:59:00Z'; // someone else claimed 'a'
      return realFrom();
    };
    const fetchImpl = sendOk();
    const r = await runRepost({ ...live(rows), supabase: db, fetchImpl });
    expect(r.skipped).toEqual(['a']);
    expect(r.reposted.map((x: { leadId: string }) => x.leadId)).toEqual(['b']);
  });

  it('a failed send is reported and un-claimed so a rerun retries it', async () => {
    const rows = mkRows();
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    const r = await runRepost({ ...live(rows), fetchImpl });
    expect(r.failed).toHaveLength(2);
    expect(r.reposted).toEqual([]);
    expect(rows[0].discord_delivered_at).toBe('2026-10-01T00:00:00Z');
    expect(rows[0].discord_message_id).toBe('old-a');
    const retry = await runRepost({ ...live(rows), fetchImpl: sendOk() });
    expect(retry.reposted).toHaveLength(2);
  });

  it('a zero-row message-id update is a hard failure, not a success', async () => {
    const rows = mkRows();
    const r = await runRepost({ ...live(rows, { db: { zeroRowUpdate: (p: Row) => 'discord_message_id' in p } }), fetchImpl: sendOk() });
    expect(r.reposted).toEqual([]);
    expect(r.failed.length).toBe(2);
    expect(r.failed[0].message).toContain('CARD SENT');
  });

  it('a database error while recording is a hard failure', async () => {
    const rows = mkRows();
    const r = await runRepost({ ...live(rows, { db: { failUpdate: (p: Row) => 'discord_message_id' in p } }), fetchImpl: sendOk() });
    expect(r.failed.length).toBe(2);
  });

  it('refuses a future cutoff', async () => {
    await expect(runRepost({ supabase: fakeSupabase(mkRows()), catalog, before: '2026-10-10T00:00:00Z', now: NOW, log: () => {} })).rejects.toThrow(/past/);
  });

  it('parses args and refuses a bad cutoff', () => {
    expect(parseArgs(['--live', '--delivered-before=2026-10-09T00:00:00Z', '--since-days=7'])).toEqual({ live: true, deliveredBefore: '2026-10-09T00:00:00Z', sinceDays: 7 });
    expect(parseCutoff('nope')).toBeNull();
    expect(parseCutoff('2026-01-01 --live')).toBeNull();
  });
});
