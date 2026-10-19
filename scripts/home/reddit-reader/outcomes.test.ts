import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  dueHorizon,
  matchCommentsToLedgers,
  parseAccountComments,
  runOutcomes,
} from './outcomes.mjs';

const comment = {
  id: 'comment-1', threadId: 'abc123',
  commentUrl: 'https://www.reddit.com/r/TaylorSwift/comments/abc123/post/comment_1/',
  createdAt: '2026-10-18T12:00:00.000Z', score: 4,
};

function listing() {
  return { data: { children: [{ kind: 't1', data: {
    id: 'comment-1', link_id: 't3_abc123', permalink: '/r/TaylorSwift/comments/abc123/post/comment_1/',
    created_utc: Date.parse(comment.createdAt) / 1_000, score: 4,
  } }] } };
}

function detail() {
  return [{ data: { children: [] } }, { data: { children: [{ kind: 't1', data: {
    id: 'comment-1', score: 5, replies: { data: { children: [{ kind: 't1', data: { id: 'reply-1' } }] } },
  } }] } }];
}

function fakeSupabase() {
  const updates: unknown[] = [];
  const upserts: unknown[] = [];
  return {
    updates, upserts,
    client: { from(table: string) {
      if (table === 'community_post_ledger') return {
        select: () => ({ eq: () => ({ gte: () => ({ order: () => Promise.resolve({
          data: [{ id: 'ledger-1', thread_id: 'abc123', comment_url: null, posted_at: '2026-10-18T12:01:00Z' }], error: null,
        }) }) }) }),
        update: (row: unknown) => ({ eq: () => (updates.push(row), Promise.resolve({ error: null })) }),
      };
      return {
        select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }),
        upsert: (rows: unknown[]) => (upserts.push(...rows), Promise.resolve({ error: null })),
      };
    } },
  };
}

describe('Reddit outcomes reader', () => {
  it('matches account comments to ledger rows by normalized thread id', () => {
    const parsed = parseAccountComments(listing());
    const matches = matchCommentsToLedgers(parsed, [
      { id: 'wrong', thread_id: 'zzz', posted_at: comment.createdAt },
      { id: 'right', thread_id: 't3_abc123', posted_at: comment.createdAt },
    ]);
    expect(matches.map(({ ledger }) => ledger.id)).toEqual(['right']);
    expect(matches[0].comment.commentUrl).toBe(comment.commentUrl);
  });

  it('uses an existing comment URL to disambiguate multiple comments on one thread', () => {
    const older = { ...comment, id: 'older', commentUrl: `${comment.commentUrl}older/`, createdAt: '2026-10-18T10:00:00Z' };
    const matches = matchCommentsToLedgers([older, comment], [{
      id: 'ledger', thread_id: 'abc123', posted_at: older.createdAt, comment_url: comment.commentUrl,
    }]);
    expect(matches[0].comment.id).toBe(comment.id);
  });

  it('schedules one missing snapshot for the current window and never duplicates it', () => {
    const now = new Date('2026-10-19T13:00:00Z');
    expect(dueHorizon(comment.createdAt, new Set(), now)).toBe('24h');
    expect(dueHorizon(comment.createdAt, new Set(['24h']), now)).toBeNull();
    expect(dueHorizon('2026-10-19T12:30:00Z', new Set(), now)).toBeNull();
    expect(dueHorizon('2026-10-11T12:00:00Z', new Set(), now)).toBe('7d');
  });

  it('uses the shared paced transport and persists URL plus the due outcome', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'reddit-outcomes-'));
    const db = fakeSupabase();
    const beforeRequest = vi.fn().mockResolvedValue(undefined);
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(listing()), { headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify(detail()), { headers: { 'content-type': 'application/json' } }));
    const result = await runOutcomes({
      supabase: db.client, circuitStatePath: path.join(dir, 'circuit.json'), fetchImpl,
      pacer: { beforeRequest }, now: new Date('2026-10-19T13:00:00Z'), onStatus: () => {},
    });
    expect(result).toMatchObject({ status: 'ok', matched: 1, urlsUpdated: 1, snapshots: 1 });
    expect(beforeRequest).toHaveBeenCalledTimes(2);
    expect(db.updates).toEqual([{ comment_url: comment.commentUrl }]);
    expect(db.upserts[0]).toMatchObject({ horizon: '24h', score: 5, replies: 1 });
  });

  it('trips the shared breaker on a blocked response and skips the next run', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'reddit-outcomes-breaker-'));
    const circuit = path.join(dir, 'circuit.json');
    const db = fakeSupabase();
    const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 429 }));
    const first = await runOutcomes({
      supabase: db.client, circuitStatePath: circuit, fetchImpl,
      pacer: { beforeRequest: vi.fn() }, now: new Date('2026-10-19T13:00:00Z'), onStatus: () => {},
    });
    const second = await runOutcomes({
      supabase: db.client, circuitStatePath: circuit, fetchImpl,
      pacer: { beforeRequest: vi.fn() }, now: new Date('2026-10-19T15:00:00Z'), onStatus: () => {},
    });
    expect(first).toMatchObject({ status: 'tripped', httpStatus: 429 });
    expect(second).toMatchObject({ status: 'backoff', remainingSkips: 2 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(JSON.parse(await readFile(circuit, 'utf8')).lastReason).toContain('HTTP 429');
  });
});
