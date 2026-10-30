import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./supabase-server', () => ({
  supabasePublicEnv: () => ({ supabaseUrl: 'https://example.supabase.co', supabaseKey: 'k' }),
}));

import { loadLiveTheories } from './current';

const row = (id: string, image_url: string | null) => ({
  id,
  name: id,
  claim: 'c',
  first_seen_on: '2026-10-20',
  last_seen_on: '2026-10-20',
  origin: 'fan',
  status: 'rumor',
  outcome: 'pending',
  evidence_ids: [],
  symbols: [],
  heat: 1,
  resolution: null,
  promoted_to: null,
  expires_at: '2026-12-20T00:00:00.000Z',
  image_url,
});

describe('loadLiveTheories media gate', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('selects image_url and drops rows without a valid allowlisted image (legacy rows, bad hosts)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        row('legacy', null),
        row('bad-host', 'https://evil.example.com/a.jpg'),
        row('good', 'https://www.people.com/photo.jpg'),
      ],
    });
    vi.stubGlobal('fetch', fetchMock);
    const theories = await loadLiveTheories();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('image_url');
    expect(theories.map((t) => t.id)).toEqual(['good']);
    expect(theories[0]?.imageUrl).toBe('https://www.people.com/photo.jpg');
  });
});
