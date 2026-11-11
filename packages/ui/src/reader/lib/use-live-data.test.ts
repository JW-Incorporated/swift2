import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLiveData } from './use-live-data';

const theory = (id: string, imageUrl?: string) => ({ id, name: id, claim: 'c', heat: 1, ...(imageUrl ? { imageUrl } : {}) });

describe('fetchLiveData live_theory media filter', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('drops legacy imageless and off-allowlist theories, keeps valid ones', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [],
          signals: [],
          theories: [
            theory('legacy'),
            theory('bad-host', 'https://evil.example.com/a.jpg'),
            theory('good', 'https://www.people.com/photo.jpg'),
          ],
        }),
      }),
    );
    const data = await fetchLiveData('tloas-filter-test');
    expect(data.theories.map((t) => t.id)).toEqual(['good']);
  });
});
