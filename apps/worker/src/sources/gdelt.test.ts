import { describe, expect, it, vi } from 'vitest';
import { fetchGdeltTaylorSwift } from './gdelt';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

describe('fetchGdeltTaylorSwift', () => {
  it('builds a GDELT document query for the exact Taylor Swift phrase', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ articles: [] }));

    await fetchGdeltTaylorSwift(fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.gdeltproject.org/api/v2/doc/doc?query=%22Taylor+Swift%22&mode=artlist&format=json&maxrecords=20',
    );
  });

  it('normalizes title, link, and date records and caps the result at twenty', async () => {
    const articles = Array.from({ length: 21 }, (_, index) => ({
      title: `Taylor Swift story ${index}`,
      url: `https://example.com/story-${index}`,
      seendate: '20260830T120000Z',
    }));
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ articles }));

    const items = await fetchGdeltTaylorSwift(fetchImpl);

    expect(items).toHaveLength(20);
    expect(items[0]).toMatchObject({
      externalId: 'https://example.com/story-0',
      url: 'https://example.com/story-0',
      title: 'Taylor Swift story 0',
      publishedAt: '2026-08-30T12:00:00.000Z',
    });
  });

  it('skips malformed records', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        articles: [
          { title: 'Missing link', seendate: '20260830T120000Z' },
          { url: 'https://example.com/missing-title', seendate: '20260830T120000Z' },
          { title: 'Bad date', url: 'https://example.com/bad-date', seendate: 'not-a-date' },
          {
            title: 'Impossible date',
            url: 'https://example.com/impossible-date',
            seendate: '20260230T120000Z',
          },
          { title: 'Valid', url: 'https://example.com/valid', seendate: '20260830T120000Z' },
        ],
      }),
    );

    await expect(fetchGdeltTaylorSwift(fetchImpl)).resolves.toMatchObject([
      { title: 'Valid', url: 'https://example.com/valid', publishedAt: '2026-08-30T12:00:00.000Z' },
    ]);
  });

  it('treats malformed article payload shapes as empty results', async () => {
    const nonArrayFetch = vi.fn().mockResolvedValue(jsonResponse({ articles: {} }));
    const nullEntryFetch = vi.fn().mockResolvedValue(jsonResponse({ articles: [null] }));

    await expect(fetchGdeltTaylorSwift(nonArrayFetch)).resolves.toEqual([]);
    await expect(fetchGdeltTaylorSwift(nullEntryFetch)).resolves.toEqual([]);
  });

  it('treats malformed JSON roots as empty results', async () => {
    const nullRootFetch = vi.fn().mockResolvedValue(jsonResponse(null));
    const primitiveRootFetch = vi.fn().mockResolvedValue(jsonResponse('unexpected'));

    await expect(fetchGdeltTaylorSwift(nullRootFetch)).resolves.toEqual([]);
    await expect(fetchGdeltTaylorSwift(primitiveRootFetch)).resolves.toEqual([]);
  });

  it('throws on a non-OK response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, false, 503));

    await expect(fetchGdeltTaylorSwift(fetchImpl)).rejects.toThrow(/503/);
  });
});
