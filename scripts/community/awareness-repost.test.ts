import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { parseArgs, parseCutoff, runRepost } from './awareness-repost.mjs';

const base = { community: 'c', why: 'w', image_ref: null, image_comments: 'text_only', thread_type: 'x' };
const leads = [
  { ...base, id: 'a', platform: 'reddit', url: 'https://www.reddit.com/r/TaylorSwift/comments/1/x/', title: 'T1', draft: 'reply one', discord_delivered_at: '2026-10-01T00:00:00Z' },
  { ...base, id: 'b', platform: 'facebook', url: 'https://www.facebook.com/groups/1/posts/2/', title: 'T2', draft: 'reply two', discord_delivered_at: '2026-10-02T00:00:00Z' },
];
function fakeSupabase() {
  const updates: unknown[] = [];
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'in', 'not', 'lt', 'gte', 'order']) b[m] = () => b;
  b.limit = () => Promise.resolve({ data: leads, error: null });
  b.update = (patch: unknown) => {
    updates.push(patch);
    return { eq: () => ({ eq: () => Promise.resolve({ error: null }) }) };
  };
  return { updates, client: { from: () => b } };
}
const catalog = { eras: [], moments: [] };

describe('awareness-repost', () => {
  it('is a dry run by default and sends nothing', async () => {
    const { client, updates } = fakeSupabase();
    const fetchImpl = vi.fn();
    const r = await runRepost({ supabase: client, catalog, before: '2026-10-09T00:00:00Z', fetchImpl, log: () => {} });
    expect(r.dryRun).toBe(true);
    expect(r.pending).toBe(2);
    expect(r.counts).toEqual({ 'tree-reddit': 1, 'tree-facebook': 1 });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(updates).toEqual([]);
  });

  it('live: card + reply text per lead to the platform channel, then points the lead at the new card', async () => {
    const { client, updates } = fakeSupabase();
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: '555' }) });
    const r = await runRepost({ supabase: client, catalog, before: '2026-10-09T00:00:00Z', live: true, ackSecret: 's', env: { DISCORD_BOT_TOKEN: 'b' }, fetchImpl, log: () => {} });
    expect(r.reposted).toHaveLength(2);
    expect(r.failed).toEqual([]);
    const urls = fetchImpl.mock.calls.map((c: unknown[]) => String(c[0]));
    expect(urls.filter((u: string) => u.includes('/1558093079351787580/'))).toHaveLength(2);
    expect(urls.filter((u: string) => u.includes('/1558093113807999026/'))).toHaveLength(2);
    expect(updates).toHaveLength(2);
    expect((updates[0] as { discord_message_id: string }).discord_message_id).toBe('555');
  });

  it('parses args and refuses a bad cutoff', () => {
    expect(parseArgs(['--live', '--delivered-before=2026-10-09T00:00:00Z', '--since-days=7'])).toEqual({ live: true, deliveredBefore: '2026-10-09T00:00:00Z', sinceDays: 7 });
    expect(parseCutoff('nope')).toBeNull();
  });
});
