import { describe, expect, it } from 'vitest';
import {
  normalizeOutletName,
  planStorySources,
  storyVerification,
  type StorySourceCandidate,
} from './story-sources';

function source(overrides: Partial<StorySourceCandidate> = {}): StorySourceCandidate {
  return {
    storyId: 'story-1',
    rawItemId: 'raw-1',
    externalId: 'article-1',
    outletName: 'Billboard',
    publisherUrl: 'https://www.billboard.com',
    articleUrl: 'https://news.google.com/rss/articles/article-1',
    url: 'https://news.google.com/rss/articles/article-1',
    tier: 'unverified',
    ...overrides,
  };
}

describe('story source invariant', () => {
  it('keeps one source row for the same article from two feeds and upgrades tier and URL', () => {
    const plan = planStorySources([
      source(),
      source({
        rawItemId: 'raw-2',
        outletName: 'billboard.com',
        articleUrl: 'https://www.billboard.com/music/music-news/project-announcement/',
        url: 'https://www.billboard.com/music/music-news/project-announcement/',
        tier: 'established',
      }),
    ]);

    expect(plan.rows).toEqual([
      expect.objectContaining({
        raw_item_id: 'raw-2',
        outlet_name: 'billboard.com',
        tier: 'established',
        url: 'https://www.billboard.com/music/music-news/project-announcement/',
      }),
    ]);
  });

  it('normalizes casing, leading The, display/domain names, and AMP/mobile hosts', () => {
    expect(
      normalizeOutletName(
        'THE HOLLYWOOD REPORTER',
        null,
        'https://news.google.com/rss/articles/a',
      ),
    ).toBe('Hollywood Reporter');
    expect(
      normalizeOutletName(
        'hollywoodreporter.com',
        null,
        'https://news.google.com/rss/articles/b',
      ),
    ).toBe('Hollywood Reporter');

    const plan = planStorySources([
      source({
        externalId: 'article-a',
        outletName: 'The Hollywood Reporter',
        existingId: 'old-name',
        storedOutletName: 'The Hollywood Reporter',
        publisherUrl: 'https://amp.hollywoodreporter.com',
        articleUrl: 'https://amp.hollywoodreporter.com/news/a/amp',
      }),
      source({
        rawItemId: 'raw-2',
        externalId: 'article-b',
        outletName: 'The Hollywood Reporter',
        existingId: 'canonical-name',
        storedOutletName: 'Hollywood Reporter',
        publisherUrl: 'https://mobile.hollywoodreporter.com',
        articleUrl: 'https://www.hollywoodreporter.com/news/b',
      }),
    ]);
    expect(plan.rows).toHaveLength(1);
    expect(plan.rows[0]?.outlet_name).toBe('The Hollywood Reporter');
    expect(plan.deleteIds).toEqual(['canonical-name']);
  });

  it('never calls one article corroborated even when feed metadata names two outlets', () => {
    const result = storyVerification([
      source({ outletName: 'Outlet One', publisherUrl: null, tier: 'established' }),
      source({
        rawItemId: 'raw-2',
        outletName: 'Outlet Two',
        publisherUrl: null,
        articleUrl: 'https://outlet-two.example/article-1',
        tier: 'established',
      }),
    ]);

    expect(result).toEqual({ status: 'single_source', sourceCount: 1 });
  });

  it('marks two distinct articles from two normalized outlets corroborated', () => {
    const result = storyVerification([
      source({
        externalId: 'article-a',
        articleUrl: 'https://www.billboard.com/news/a',
        url: 'https://www.billboard.com/news/a',
        tier: 'established',
      }),
      source({
        rawItemId: 'raw-2',
        externalId: 'article-b',
        outletName: 'Variety',
        publisherUrl: 'https://variety.com',
        articleUrl: 'https://variety.com/news/b',
        url: 'https://variety.com/news/b',
        tier: 'established',
      }),
    ]);

    expect(result).toEqual({ status: 'corroborated', sourceCount: 2 });
  });

  it('treats AP copies with normalized matching titles as one article', () => {
    const candidates = [
      source({
        externalId: 'abc-copy',
        title: 'AP: Taylor Swift announces a new project - ABC News',
        outletName: 'ABC News',
        publisherUrl: 'https://abcnews.go.com',
        articleUrl: 'https://abcnews.go.com/culture/story?id=101',
        url: 'https://abcnews.go.com/culture/story?id=101',
        tier: 'established',
      }),
      source({
        rawItemId: 'raw-2',
        externalId: 'yahoo-copy',
        title: 'Taylor Swift announces a new project | Yahoo News',
        outletName: 'Yahoo News',
        publisherUrl: 'https://news.yahoo.com',
        articleUrl: 'https://news.yahoo.com/taylor-project-2026.html',
        url: 'https://news.yahoo.com/taylor-project-2026.html',
        tier: 'established',
      }),
    ];

    expect(planStorySources(candidates).rows).toHaveLength(1);
    expect(storyVerification(candidates)).toEqual({ status: 'single_source', sourceCount: 1 });
  });

  it('treats differently titled copies with the same wire credit as one article', () => {
    const candidates = [
      source({
        externalId: 'reuters-a',
        title: 'Outlet rewrites the headline one way',
        author: 'Jane Reporter, Reuters',
        outletName: 'Outlet A',
        publisherUrl: 'https://outlet-a.example',
        articleUrl: 'https://outlet-a.example/news/a',
      }),
      source({
        rawItemId: 'raw-2',
        externalId: 'reuters-b',
        title: 'Another headline for the same wire report',
        snippet: 'Reporting by Reuters',
        outletName: 'Outlet B',
        publisherUrl: 'https://outlet-b.example',
        articleUrl: 'https://outlet-b.example/news/b',
      }),
    ];

    expect(planStorySources(candidates).rows).toHaveLength(1);
  });

  it('keeps identifying query values distinct while dropping tracking parameters', () => {
    const youtube = planStorySources([
      source({
        externalId: null,
        outletName: 'Outlet A',
        publisherUrl: 'https://outlet-a.example',
        articleUrl: 'https://youtube.com/watch?v=A&utm_source=rss',
      }),
      source({
        rawItemId: 'raw-2',
        externalId: null,
        outletName: 'Outlet B',
        publisherUrl: 'https://outlet-b.example',
        articleUrl: 'https://youtube.com/watch?fbclid=tracking&v=B',
      }),
    ]);
    const php = planStorySources([
      source({
        externalId: null,
        outletName: 'Outlet A',
        publisherUrl: 'https://outlet-a.example',
        articleUrl: 'https://example.com/article.php?id=1&utm_medium=feed',
      }),
      source({
        rawItemId: 'raw-2',
        externalId: null,
        outletName: 'Outlet B',
        publisherUrl: 'https://outlet-b.example',
        articleUrl: 'https://example.com/article.php?cmpid=rss&id=2',
      }),
    ]);
    const trackedCopy = planStorySources([
      source({
        externalId: null,
        outletName: 'Outlet A',
        publisherUrl: 'https://outlet-a.example',
        articleUrl: 'https://example.com/article.php?id=1&utm_source=feed',
      }),
      source({
        rawItemId: 'raw-2',
        externalId: null,
        outletName: 'Outlet B',
        publisherUrl: 'https://outlet-b.example',
        articleUrl: 'https://example.com/article.php?gclid=tracking&id=1',
      }),
    ]);

    expect(youtube.rows).toHaveLength(2);
    expect(php.rows).toHaveLength(2);
    expect(trackedCopy.rows).toHaveLength(1);
  });

  it('does not count an unresolved Google News outlet or collide it with a real outlet', () => {
    const candidates = [
      source({
        externalId: 'google-only',
        outletName: 'Google News',
        publisherUrl: null,
        articleUrl: 'https://news.google.com/rss/articles/google-only',
      }),
      source({
        rawItemId: 'raw-2',
        externalId: 'real-article',
        outletName: 'Variety',
        publisherUrl: 'https://variety.com',
        articleUrl: 'https://variety.com/news/real-article',
        tier: 'established',
      }),
    ];

    expect(planStorySources(candidates).rows).toEqual([
      expect.objectContaining({ outlet_name: 'unknown' }),
      expect.objectContaining({ outlet_name: 'Variety' }),
    ]);
    expect(storyVerification(candidates)).toEqual({ status: 'single_source', sourceCount: 1 });
  });

  it('keeps the publisher display name while matching by normalized host', () => {
    const plan = planStorySources([
      source({
        externalId: 'display-a',
        outletName: 'Publisher Display Name',
        publisherUrl: 'https://www.example.com',
        articleUrl: 'https://www.example.com/a',
        url: 'https://www.example.com/a',
        tier: 'established',
      }),
      source({
        rawItemId: 'raw-2',
        externalId: 'display-b',
        outletName: 'Different Feed Label',
        publisherUrl: 'https://mobile.example.com',
        articleUrl: 'https://mobile.example.com/b',
        url: 'https://mobile.example.com/b',
      }),
    ]);

    expect(plan.rows).toHaveLength(1);
    expect(plan.rows[0]?.outlet_name).toBe('Publisher Display Name');
  });

  it('preserves external ID casing when identifying articles', () => {
    const result = storyVerification([
      source({
        externalId: 'CaseSensitiveId',
        outletName: 'Outlet A',
        publisherUrl: 'https://outlet-a.example',
        articleUrl: 'https://outlet-a.example/a',
        tier: 'established',
      }),
      source({
        rawItemId: 'raw-2',
        externalId: 'casesensitiveid',
        outletName: 'Outlet B',
        publisherUrl: 'https://outlet-b.example',
        articleUrl: 'https://outlet-b.example/b',
        tier: 'established',
      }),
    ]);

    expect(result).toEqual({ status: 'corroborated', sourceCount: 2 });
  });
});
