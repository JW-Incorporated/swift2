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
        outlet_name: 'Billboard',
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
        outletName: 'THE HOLLYWOOD REPORTER',
        existingId: 'old-name',
        storedOutletName: 'THE HOLLYWOOD REPORTER',
        publisherUrl: 'https://amp.hollywoodreporter.com',
        articleUrl: 'https://amp.hollywoodreporter.com/news/a/amp',
      }),
      source({
        rawItemId: 'raw-2',
        externalId: 'article-b',
        outletName: 'hollywoodreporter.com',
        existingId: 'canonical-name',
        storedOutletName: 'Hollywood Reporter',
        publisherUrl: 'https://mobile.hollywoodreporter.com',
        articleUrl: 'https://www.hollywoodreporter.com/news/b',
      }),
    ]);
    expect(plan.rows).toHaveLength(1);
    expect(plan.rows[0]?.outlet_name).toBe('Hollywood Reporter');
    expect(plan.deleteIds).toEqual(['old-name']);
  });

  it('never calls one article corroborated even when feed metadata names two outlets', () => {
    const result = storyVerification([
      source({ outletName: 'Outlet One', publisherUrl: null, tier: 'established' }),
      source({
        rawItemId: 'raw-2',
        outletName: 'Outlet Two',
        publisherUrl: null,
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
});
