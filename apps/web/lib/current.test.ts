import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./supabase-server', () => ({
  supabasePublicEnv: () => ({ supabaseUrl: 'https://example.supabase.co', supabaseKey: 'k' }),
}));

import { loadCurrentItems, loadFanSignals, loadLiveTheories } from './current';

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

describe('live reads bypass the Next Data Cache', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends every current_item and live_theory request with cache: no-store', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    await loadCurrentItems('tloas');
    await loadLiveTheories();
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    for (const call of fetchMock.mock.calls) expect((call[1] as RequestInit | undefined)?.cache).toBe('no-store');
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('/rest/v1/current_item'))).toBe(true);
  });
});

describe('live reads repeat the RLS read policy in the query', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('filters current_item, live_theory and fan_signal to redline_ok and unexpired rows', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    await loadCurrentItems('tloas');
    await loadLiveTheories();
    await loadFanSignals();
    const urls = fetchMock.mock.calls.map((c) => decodeURIComponent(String(c[0])));
    for (const table of ['current_item', 'live_theory', 'fan_signal']) {
      const url = urls.find((u) => u.includes(`/rest/v1/${table}`));
      expect(url, table).toBeDefined();
      expect(url).toContain('redline_ok=eq.true');
      expect(url).toMatch(/or=\(expires_at\.is\.null,expires_at\.gt\./);
    }
  });
});
