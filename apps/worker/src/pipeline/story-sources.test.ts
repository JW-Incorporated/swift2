import { describe, expect, it } from 'vitest';
import {
  canonicalArticleUrl,
  planStorySources,
  storyVerification,
  type StorySourceCandidate,
} from './story-sources';

function source(overrides: Partial<StorySourceCandidate> = {}): StorySourceCandidate {
  return {
    storyId: 'story-1',
    rawItemId: 'raw-1',
    externalId: 'article-1',
    title: null,
    outletName: 'Billboard',
    publisherUrl: 'https://www.billboard.com',
    articleUrl: 'https://news.google.com/rss/articles/article-1',
    url: 'https://news.google.com/rss/articles/article-1',
    tier: 'unverified',
    ...overrides,
  };
}

describe('story source invariant', () => {
  it('case 1: collapses syndicated wire copies to one article and keeps its best tier and URL', () => {
    const matchingTitle = [
      source({
        externalId: 'abc-copy',
        title: 'AP: Taylor Swift announces a new project - ABC News',
        outletName: 'ABC News',
        publisherUrl: 'https://abcnews.go.com',
        articleUrl: 'https://abcnews.go.com/culture/story?id=101',
        url: 'https://news.google.com/rss/articles/abc-copy',
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
    const wireByline = [
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
    const afpByline = [
      source({
        externalId: 'afp-a',
        title: 'First AFP headline',
        author: 'Agence France-Presse',
        outletName: 'Outlet A',
        publisherUrl: 'https://outlet-a.example',
        articleUrl: 'https://outlet-a.example/afp/a',
      }),
      source({
        rawItemId: 'raw-2',
        externalId: 'afp-b',
        title: 'Second AFP headline',
        snippet: 'Filed by AFP',
        outletName: 'Outlet B',
        publisherUrl: 'https://outlet-b.example',
        articleUrl: 'https://outlet-b.example/afp/b',
      }),
    ];

    expect(planStorySources(matchingTitle).rows).toEqual([
      expect.objectContaining({
        raw_item_id: 'raw-2',
        tier: 'established',
        url: 'https://news.yahoo.com/taylor-project-2026.html',
      }),
    ]);
    expect(storyVerification(matchingTitle)).toEqual({
      status: 'single_source',
      sourceCount: 1,
    });
    expect(planStorySources(wireByline).rows).toHaveLength(1);
    expect(planStorySources(afpByline).rows).toHaveLength(1);
  });

  it('case 2: sorts identifying URL keys, preserves their values, and drops tracking keys', () => {
    expect(
      canonicalArticleUrl(
        'https://www.example.com/story/amp?utm_source=rss&StoryID=S&v=Video&id=ID&p=P&story=Story&article=Article&a=A&sid=SID&newsid=N&itemid=I&fbclid=x',
      ),
    ).toBe(
      'example.com/story?a=A&article=Article&id=ID&itemid=I&newsid=N&p=P&sid=SID&story=Story&storyid=S&v=Video',
    );
    expect(
      canonicalArticleUrl('https://example.com/article.php?gclid=x&id=One&utm_medium=feed'),
    ).toBe(canonicalArticleUrl('https://www.example.com/article.php?id=One&cmpid=rss'));

    const plan = planStorySources([
      source({
        externalId: null,
        outletName: 'Outlet A',
        publisherUrl: 'https://outlet-a.example',
        articleUrl: 'https://youtube.com/watch?v=CaseA&utm_source=rss',
      }),
      source({
        rawItemId: 'raw-2',
        externalId: null,
        outletName: 'Outlet B',
        publisherUrl: 'https://outlet-b.example',
        articleUrl: 'https://youtube.com/watch?fbclid=x&v=casea',
      }),
    ]);
    expect(plan.rows).toHaveLength(2);
  });

  it('case 3: stores unresolved Google News publishers as unknown and never counts them', () => {
    const candidates = [
      source({
        externalId: 'google-only',
        sourceType: 'google_news',
        outletName: 'Named Publisher Without URL',
        publisherUrl: null,
        articleUrl: 'https://publisher.example/resolved-but-unattributed',
      }),
      source({
        rawItemId: 'raw-2',
        externalId: 'real-article',
        outletName: 'Variety',
        publisherUrl: 'https://variety.com',
        articleUrl: 'https://variety.com/news/real-article',
        url: 'https://variety.com/news/real-article',
        tier: 'established',
      }),
    ];

    expect(planStorySources(candidates).rows).toEqual([
      expect.objectContaining({ outlet_name: 'unknown' }),
      expect.objectContaining({ outlet_name: 'Variety' }),
    ]);
    expect(storyVerification(candidates)).toEqual({ status: 'single_source', sourceCount: 1 });
  });

  it('case 4: preserves a publisher display name while matching outlets by normalized host', () => {
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

  it('case 5: preserves external ID casing when identifying articles', () => {
    const candidates = [
      source({
        externalId: 'CaseSensitiveId',
        title: 'First article',
        outletName: 'Outlet A',
        publisherUrl: 'https://outlet-a.example',
        articleUrl: 'https://outlet-a.example/a',
        tier: 'established',
      }),
      source({
        rawItemId: 'raw-2',
        externalId: 'casesensitiveid',
        title: 'Second article',
        outletName: 'Outlet B',
        publisherUrl: 'https://outlet-b.example',
        articleUrl: 'https://outlet-b.example/b',
        tier: 'established',
      }),
    ];

    expect(storyVerification(candidates)).toEqual({ status: 'corroborated', sourceCount: 2 });
  });
});
