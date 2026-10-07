import { describe, expect, it, vi } from 'vitest';
import {
  isAcceptedLicense,
  guessEraTag,
  candidateId,
  stripHtmlTags,
  buildCandidate,
  searchCommons,
  fetchImageInfo,
  sourceWikimediaQuery,
  dedupeById,
  ERA_KEYWORD_HINTS,
} from './source-wikimedia-photos.mjs';

describe('isAcceptedLicense', () => {
  it('accepts Commons free-license slugs regardless of version', () => {
    expect(isAcceptedLicense('cc-by-2.0')).toBe(true);
    expect(isAcceptedLicense('cc-by-sa-4.0')).toBe(true);
    expect(isAcceptedLicense('cc0-1.0')).toBe(true);
    expect(isAcceptedLicense('pd')).toBe(true);
  });

  it('rejects non-free or missing license metadata — never assumes free', () => {
    expect(isAcceptedLicense('all-rights-reserved')).toBe(false);
    expect(isAcceptedLicense(undefined)).toBe(false);
    expect(isAcceptedLicense(null)).toBe(false);
    expect(isAcceptedLicense('')).toBe(false);
  });
});

describe('guessEraTag', () => {
  it('matches an unambiguous era/act mention', () => {
    expect(guessEraTag('Taylor Swift The Eras Tour Reputation Era Set')).toBe('reputation');
    expect(guessEraTag('Folklore era performance')).toBe('folklore');
  });

  it('returns null rather than guessing when nothing matches', () => {
    expect(guessEraTag('Taylor Swift performing live')).toBeNull();
  });

  it('every hint has a non-empty era slug and a real regex', () => {
    for (const hint of ERA_KEYWORD_HINTS) {
      expect(hint.era).toBeTruthy();
      expect(hint.re).toBeInstanceOf(RegExp);
    }
  });
});

describe('candidateId', () => {
  it('is deterministic and namespaced', () => {
    expect(candidateId(12345)).toBe('wikimedia-12345');
    expect(candidateId(12345)).toBe(candidateId(12345));
  });
});

describe('stripHtmlTags', () => {
  it('strips a simple tag', () => {
    expect(stripHtmlTags('<i>Jane Photographer</i>')).toBe('Jane Photographer');
  });

  it('fully removes nested/overlapping tags a single regex pass would miss (CodeQL finding, PR #4613)', () => {
    // A single `.replace(/<[^>]+>/g, '')` pass on this leaves "<script>alert(1)"
    // behind, because the inner "<script>" only becomes a matchable tag
    // after the outer "<<" .. ">" pair is stripped first.
    expect(stripHtmlTags('<<script>alert(1)</script>>')).not.toContain('<script>');
    expect(stripHtmlTags('<<script>alert(1)</script>>')).toBe('alert(1)>');
  });
});

function makePage(overrides = {}) {
  return {
    pageid: 999,
    title: 'File:Taylor Swift The Eras Tour Reputation Era Set (123).jpg',
    imageinfo: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/x/y/example.jpg',
        descriptionurl: 'https://commons.wikimedia.org/wiki/File:example.jpg',
        extmetadata: {
          License: { value: 'cc-by-2.0' },
          LicenseShortName: { value: 'CC BY 2.0' },
          Artist: { value: 'Jane Photographer' },
          ImageDescription: { value: 'Taylor Swift performing at SoFi Stadium' },
        },
      },
    ],
    ...overrides,
  };
}

describe('buildCandidate', () => {
  it('builds a candidate matching import-photo-library.mjs --fetch\'s expected shape', () => {
    const candidate = buildCandidate(makePage());
    expect(candidate.id).toBe('wikimedia-999');
    expect(candidate.mediaPath).toBe('/social/library/photos/wikimedia-999.jpg');
    expect(candidate.sourceUrl).toBe('https://upload.wikimedia.org/wikipedia/commons/x/y/example.jpg');
    expect(candidate.source).toBe('https://commons.wikimedia.org/wiki/File:example.jpg');
    expect(candidate.credit).toContain('Jane Photographer');
    expect(candidate.credit).toContain('CC BY 2.0');
    expect(candidate.alt).toBeTruthy();
    expect(candidate.tags).toContain('fan-photo');
    expect(candidate.tags).toContain('reputation');
  });

  it('returns null (never a fallback) when license metadata is missing', () => {
    const page = makePage();
    delete page.imageinfo[0].extmetadata.License;
    expect(buildCandidate(page)).toBeNull();
  });

  it('returns null when the license is not in the accepted free set', () => {
    const page = makePage();
    page.imageinfo[0].extmetadata.License.value = 'copyrighted';
    expect(buildCandidate(page)).toBeNull();
  });

  it('returns null when the page has no imageinfo at all', () => {
    expect(buildCandidate({ pageid: 1, title: 'File:x.jpg' })).toBeNull();
  });

  it('falls back to "Unknown" credit and the file title as alt when metadata is sparse', () => {
    const page = makePage();
    delete page.imageinfo[0].extmetadata.Artist;
    delete page.imageinfo[0].extmetadata.ImageDescription;
    const candidate = buildCandidate(page);
    expect(candidate.credit).toContain('Unknown');
    expect(candidate.alt).toContain(page.title);
  });
});

describe('searchCommons', () => {
  it('requests the Commons search API with the expected params and a User-Agent', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ query: { search: [{ title: 'File:a.jpg' }] } }),
    });
    const results = await searchCommons('Taylor Swift', { limit: 10, fetchImpl });
    expect(results).toEqual([{ title: 'File:a.jpg' }]);
    const [url, opts] = fetchImpl.mock.calls[0];
    expect(String(url)).toContain('list=search');
    expect(String(url)).toContain('srnamespace=6');
    expect(opts.headers['User-Agent']).toBeTruthy();
  });

  it('throws a clear error on a non-ok response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 429, statusText: 'Too Many Requests' });
    await expect(searchCommons('x', { fetchImpl })).rejects.toThrow(/429/);
  });
});

describe('fetchImageInfo', () => {
  it('returns an empty array for an empty title list without calling fetch', async () => {
    const fetchImpl = vi.fn();
    expect(await fetchImageInfo([], { fetchImpl })).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('requests imageinfo for the given titles', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ query: { pages: { '1': makePage() } } }),
    });
    const pages = await fetchImageInfo(['File:a.jpg'], { fetchImpl });
    expect(pages).toHaveLength(1);
    expect(pages[0].pageid).toBe(999);
  });
});

describe('sourceWikimediaQuery', () => {
  it('sources, filters by license, and tags candidates end to end', async () => {
    const searchResults = { query: { search: [{ title: 'File:a.jpg' }, { title: 'File:b.jpg' }] } };
    const infoResults = {
      query: {
        pages: {
          '1': makePage({ pageid: 1, title: 'File:a.jpg' }),
          '2': makePage({
            pageid: 2,
            title: 'File:b.jpg',
            imageinfo: [{ ...makePage().imageinfo[0], extmetadata: { License: { value: 'all-rights-reserved' } } }],
          }),
        },
      },
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => searchResults })
      .mockResolvedValueOnce({ ok: true, json: async () => infoResults });

    const warn = vi.fn();
    const candidates = await sourceWikimediaQuery('Taylor Swift', { limit: 2, fetchImpl, warn });
    expect(candidates).toHaveLength(1);
    expect(candidates[0].id).toBe('wikimedia-1');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array immediately when search finds nothing', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ query: { search: [] } }) });
    expect(await sourceWikimediaQuery('nothing', { fetchImpl })).toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('dedupeById', () => {
  it('keeps the first occurrence of each id', () => {
    const a = { id: 'x', n: 1 };
    const b = { id: 'x', n: 2 };
    const c = { id: 'y', n: 3 };
    expect(dedupeById([a, b, c])).toEqual([a, c]);
  });
});
