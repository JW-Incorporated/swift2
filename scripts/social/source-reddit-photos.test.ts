import { describe, expect, it } from 'vitest';
import {
  looksLikeNonConcertContent,
  guessVenueDate,
  candidateId,
  isDirectImageUrl,
  buildCandidate,
  sourceSubreddit,
  dedupeById,
  probeHomeRelay,
  TOUR_DATE_HINTS,
} from './source-reddit-photos.mjs';

describe('looksLikeNonConcertContent', () => {
  it('flags promo/merch titles', () => {
    expect(looksLikeNonConcertContent('New merch drop for the Eras Tour!')).toBe(true);
    expect(looksLikeNonConcertContent('Magazine cover shoot')).toBe(true);
  });

  it('does not flag a plain concert photo title', () => {
    expect(looksLikeNonConcertContent('My photo from night 2 in Inglewood')).toBe(false);
  });
});

describe('guessVenueDate', () => {
  it('matches a known tour-date hint', () => {
    expect(guessVenueDate('Amazing show in Inglewood last night!')).toEqual({
      venue: 'SoFi Stadium, Inglewood, CA',
      date: '2023-08-05',
    });
  });

  it('returns undefined for both fields when no hint matches — never guesses', () => {
    expect(guessVenueDate('Some random title with no venue mention')).toEqual({
      venue: undefined,
      date: undefined,
    });
  });

  it('every hint has both venue and date set', () => {
    for (const hint of TOUR_DATE_HINTS) {
      expect(hint.venue).toBeTruthy();
      expect(hint.date).toBeTruthy();
    }
  });
});

describe('candidateId', () => {
  it('is deterministic and namespaced by subreddit', () => {
    expect(candidateId('erastour', 'abc123')).toBe('reddit-erastour-abc123');
    expect(candidateId('erastour', 'abc123')).toBe(candidateId('erastour', 'abc123'));
  });
});

describe('isDirectImageUrl', () => {
  it('accepts common image extensions, with or without a query string', () => {
    expect(isDirectImageUrl('https://preview.redd.it/x.jpg?width=640')).toBe(true);
    expect(isDirectImageUrl('https://i.redd.it/x.png')).toBe(true);
    expect(isDirectImageUrl('https://i.redd.it/x.gif')).toBe(true);
  });

  it('rejects a post permalink or non-image URL', () => {
    expect(isDirectImageUrl('https://www.reddit.com/r/erastour/comments/abc/title/')).toBe(false);
    expect(isDirectImageUrl(undefined)).toBe(false);
    expect(isDirectImageUrl(null)).toBe(false);
  });
});

describe('buildCandidate', () => {
  const post = {
    id: 'abc123',
    title: 'My favorite shot from Inglewood eras tour night',
    permalink: 'https://www.reddit.com/r/erastour/comments/abc123/my_favorite_shot/',
    url: 'https://preview.redd.it/xyz.jpg?width=640',
    author: 'someRedditor',
    createdAt: '2023-08-06T00:00:00.000Z',
    rank: 1,
  };

  it('builds a candidate matching import-photo-library.mjs --fetch\'s expected shape', () => {
    const candidate = buildCandidate('erastour', post);
    expect(candidate.id).toBe('reddit-erastour-abc123');
    expect(candidate.mediaPath).toBe('/social/library/photos/reddit-erastour-abc123.jpg');
    expect(candidate.sourceUrl).toBe(post.url);
    expect(candidate.source).toBe(post.permalink);
    expect(candidate.credit).toContain('someRedditor');
    expect(candidate.alt).toBeTruthy();
    expect(candidate.venue).toBe('SoFi Stadium, Inglewood, CA');
    expect(candidate.date).toBe('2023-08-05');
    expect(candidate.tags).toContain('fan-photo');
    expect(candidate.tags).toContain('concert');
  });

  it('omits venue/date when no hint matches, rather than guessing', () => {
    const candidate = buildCandidate('erastour', { ...post, title: 'Cool concert photo, unknown venue' });
    expect(candidate.venue).toBeUndefined();
    expect(candidate.date).toBeUndefined();
  });
});

describe('sourceSubreddit', () => {
  it('filters out non-image posts and promo/merch titles', async () => {
    const fetchImpl = async () =>
      new Response(
        `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
          <entry><id>t3_img1</id><title>My concert photo from the show</title>
            <link href="https://www.reddit.com/r/erastour/comments/img1/x/"/>
            <content type="html">&lt;span&gt;&lt;a href="https://preview.redd.it/img1.jpg"&gt;[link]&lt;/a&gt;&lt;/span&gt;</content>
            <updated>2026-01-01T00:00:00Z</updated></entry>
          <entry><id>t3_selfpost</id><title>Discussion thread</title>
            <link href="https://www.reddit.com/r/erastour/comments/selfpost/x/"/>
            <content type="html">no link here</content>
            <updated>2026-01-01T00:00:00Z</updated></entry>
          <entry><id>t3_merch</id><title>New merch drop photo</title>
            <link href="https://www.reddit.com/r/erastour/comments/merch/x/"/>
            <content type="html">&lt;span&gt;&lt;a href="https://preview.redd.it/merch.jpg"&gt;[link]&lt;/a&gt;&lt;/span&gt;</content>
            <updated>2026-01-01T00:00:00Z</updated></entry>
        </feed>`,
        { status: 200 },
      );
    const candidates = await sourceSubreddit('erastour', { limit: 10, time: 'year', fetchImpl });
    expect(candidates).toHaveLength(1);
    expect(candidates[0].id).toBe('reddit-erastour-img1');
  });

  it('returns an empty array and warns on a 429, never throws', async () => {
    const fetchImpl = async () => new Response('', { status: 429 });
    const warn = () => {};
    const candidates = await sourceSubreddit('erastour', { limit: 10, time: 'year', fetchImpl, warn });
    expect(candidates).toEqual([]);
  });
});

describe('dedupeById', () => {
  it('keeps only the first occurrence of a repeated id', () => {
    const result = dedupeById([{ id: 'a', v: 1 }, { id: 'b', v: 2 }, { id: 'a', v: 3 }]);
    expect(result).toEqual([{ id: 'a', v: 1 }, { id: 'b', v: 2 }]);
  });
});

describe('probeHomeRelay', () => {
  it('is false when no relay URL is configured', async () => {
    expect(await probeHomeRelay('')).toBe(false);
    expect(await probeHomeRelay(undefined)).toBe(false);
  });

  it('is true when the relay answers with any HTTP status (including its own empty-target 502)', async () => {
    const fetchImpl = async () => new Response('ok', { status: 200 });
    expect(await probeHomeRelay('http://relay:8888', { fetchImpl })).toBe(true);
    const fetchImpl502 = async () => new Response('err', { status: 502 });
    expect(await probeHomeRelay('http://relay:8888', { fetchImpl: fetchImpl502 })).toBe(true);
  });

  it('is false only when the relay connection itself fails/times out', async () => {
    const fetchImplThrow = async () => {
      throw new Error('connection refused');
    };
    expect(await probeHomeRelay('http://relay:8888', { fetchImpl: fetchImplThrow })).toBe(false);
  });
});
