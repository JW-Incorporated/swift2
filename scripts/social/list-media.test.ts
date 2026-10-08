import { describe, expect, it, vi } from 'vitest';
import { fetchAllMedia, findDuplicates, buildReport } from './list-media.mjs';

function post(overrides: Record<string, unknown> = {}) {
  return {
    id: Math.random().toString(36).slice(2),
    caption: 'hello',
    permalink: 'https://instagram.com/p/abc',
    timestamp: '2026-08-01T00:00:00Z',
    media_url: 'https://example.com/a.png',
    media_type: 'IMAGE',
    ...overrides,
  };
}

describe('fetchAllMedia', () => {
  it('paginates until paging.next is absent', async () => {
    const page1 = { data: [post({ id: '1' }), post({ id: '2' })], paging: { next: 'https://graph.facebook.com/v25.0/next-page' } };
    const page2 = { data: [post({ id: '3' })] };
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('next-page')) return { ok: true, json: async () => page2 };
      return { ok: true, json: async () => page1 };
    });

    const all = await fetchAllMedia({ igUserId: '123', accessToken: 'tok', fetchImpl });

    expect(all.map((p) => p.id)).toEqual(['1', '2', '3']);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('throws a readable error on a non-2xx response', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: 'bad token' }) }));
    await expect(fetchAllMedia({ igUserId: '123', accessToken: 'tok', fetchImpl })).rejects.toThrow(/401/);
  });

  it('returns an empty array when there is no media at all', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ data: [] }) }));
    expect(await fetchAllMedia({ igUserId: '123', accessToken: 'tok', fetchImpl })).toEqual([]);
  });
});

describe('findDuplicates', () => {
  it('groups two posts sharing an identical 80-char caption prefix', () => {
    const longCaption = 'a'.repeat(90);
    const items = [
      post({ id: '1', caption: longCaption + ' first tail', timestamp: '2026-08-01T00:00:00Z' }),
      post({ id: '2', caption: longCaption + ' second tail', timestamp: '2026-08-05T00:00:00Z' }),
    ];
    const groups = findDuplicates(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].map((p) => p.id).sort()).toEqual(['1', '2']);
  });

  it('groups two posts with the exact same caption within 24h', () => {
    const items = [
      post({ id: '1', caption: 'short caption', timestamp: '2026-08-01T10:00:00Z' }),
      post({ id: '2', caption: 'short caption', timestamp: '2026-08-01T20:00:00Z' }),
    ];
    const groups = findDuplicates(items);
    expect(groups).toHaveLength(1);
  });

  it('does not group the exact same caption when more than 24h apart', () => {
    const items = [
      post({ id: '1', caption: 'short caption', timestamp: '2026-08-01T00:00:00Z' }),
      post({ id: '2', caption: 'short caption', timestamp: '2026-08-05T00:00:00Z' }),
    ];
    expect(findDuplicates(items)).toEqual([]);
  });

  it('does not group unrelated posts', () => {
    const items = [
      post({ id: '1', caption: 'the folklore drop', timestamp: '2026-08-01T00:00:00Z' }),
      post({ id: '2', caption: 'the reputation era', timestamp: '2026-08-02T00:00:00Z' }),
    ];
    expect(findDuplicates(items)).toEqual([]);
  });

  it('puts each post in at most one group', () => {
    const longCaption = 'b'.repeat(90);
    const items = [
      post({ id: '1', caption: longCaption + ' a', timestamp: '2026-08-01T00:00:00Z' }),
      post({ id: '2', caption: longCaption + ' b', timestamp: '2026-08-02T00:00:00Z' }),
      post({ id: '3', caption: longCaption + ' c', timestamp: '2026-08-03T00:00:00Z' }),
    ];
    const groups = findDuplicates(items);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(3);
  });
});

describe('buildReport', () => {
  it('lists every post and reports "None found" with no duplicates', () => {
    const items = [post({ id: '1', caption: 'one' }), post({ id: '2', caption: 'two' })];
    const report = buildReport(items, [], new Date('2026-08-11T00:00:00Z'));
    expect(report).toContain('# Instagram media audit');
    expect(report).toContain('2 post(s) total');
    expect(report).toContain('None found.');
    expect(report).toContain('one');
    expect(report).toContain('two');
  });

  it('lists flagged duplicate groups with permalinks', () => {
    const a = post({ id: '1', caption: 'dupe', permalink: 'https://instagram.com/p/aaa' });
    const b = post({ id: '2', caption: 'dupe', permalink: 'https://instagram.com/p/bbb' });
    const report = buildReport([a, b], [[a, b]], new Date('2026-08-11T00:00:00Z'));
    expect(report).toContain('Possible duplicate group 1');
    expect(report).toContain('https://instagram.com/p/aaa');
    expect(report).toContain('https://instagram.com/p/bbb');
    expect(report).toContain('1 possible duplicate group(s) flagged');
  });
});
