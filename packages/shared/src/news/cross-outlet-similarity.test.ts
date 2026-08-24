import { describe, expect, it } from 'vitest';
import { clusterBatch, type ClusterableItem, type ExistingStory } from './cluster';
import { CrossOutletSimilarityProvider } from './cross-outlet-similarity';

const provider = new CrossOutletSimilarityProvider();
// similarity() is binary (1/0) — threshold 1 means "any signal fired".
const OPTS = { threshold: 1, subjectTerms: ['Taylor Swift'] };

const item = (
  id: string,
  title: string,
  extra: Partial<ClusterableItem> = {},
): ClusterableItem => ({ id, title, ...extra });

describe('CrossOutletSimilarityProvider — clustering the proposal §4.1 acceptance case', () => {
  it('clusters three differently-worded "wedding gowns" headlines from three outlets into one story', () => {
    // Real cross-outlet coverage of one event rarely shares enough headline
    // vocabulary to clear the 0.85 cosine bar (that signal is for
    // near-duplicate/wire-copy text) — this is the case signal 3 (shared
    // named entity + same date) exists for: three genuinely differently
    // worded outlets, same designer named in each headline, same day.
    const items = [
      item('vogue', 'Vera Wang addresses rumors about a possible Taylor Swift wedding dress', {
        url: 'https://www.vogue.com/article/vera-wang-taylor-swift-wedding-speculation',
        publishedAt: '2026-08-20T10:00:00Z',
      }),
      item('wwd', 'Vera Wang speaks out on the Taylor Swift wedding gown buzz', {
        url: 'https://wwd.com/fashion/vera-wang-taylor-swift-wedding-buzz',
        publishedAt: '2026-08-20T14:30:00Z',
      }),
      item('thr', 'Speculation grows that Vera Wang could design a wedding dress for Taylor Swift', {
        url: 'https://www.hollywoodreporter.com/lifestyle/vera-wang-taylor-swift-wedding-dress',
        publishedAt: '2026-08-20T19:00:00Z',
      }),
    ];
    const result = clusterBatch(items, [], provider, OPTS);
    expect(result.newStoryCount).toBe(1);
    const indices = new Set(result.assignments.map((a) => a.newStoryIndex));
    expect(indices).toEqual(new Set([0]));
    // Every assignment landed in the same story -> a run-cycle-level
    // source_count of 3 once each outlet's news_story_source row is recorded.
    expect(result.assignments).toHaveLength(3);
  });

  it('keeps unrelated stories separate', () => {
    const items = [
      item('a', 'Taylor Swift Announces New Album at Midnight', {
        publishedAt: '2026-08-20T10:00:00Z',
        snippet: 'The pop star surprised fans with a midnight album announcement.',
      }),
      item('b', 'Taylor Swift Spotted Courtside at Chiefs Game', {
        publishedAt: '2026-08-20T10:05:00Z',
        snippet: 'She cheered on Travis Kelce from her usual suite.',
      }),
    ];
    const result = clusterBatch(items, [], provider, OPTS);
    expect(result.newStoryCount).toBe(2);
  });
});

describe('CrossOutletSimilarityProvider.similarity — signal 1: canonical URL match', () => {
  it('matches on canonical URL regardless of query string, www, scheme, or trailing slash', () => {
    const a = provider.computeKey({
      title: 'Some headline',
      url: 'https://www.forbes.com/sites/x/taylor-swift-story/?utm_source=twitter',
    });
    const b = provider.computeKey({
      title: 'A completely different headline about the same link',
      url: 'http://forbes.com/sites/x/taylor-swift-story/',
    });
    expect(provider.similarity(a, b)).toBe(1);
  });

  it('does not match when URLs point to different articles', () => {
    const a = provider.computeKey({ title: 'x', url: 'https://forbes.com/a' });
    const b = provider.computeKey({ title: 'y', url: 'https://forbes.com/b' });
    expect(provider.similarity(a, b)).toBe(0);
  });
});

describe('CrossOutletSimilarityProvider.similarity — signal 2: cosine within a 48h window', () => {
  it('matches high-overlap title+snippet text published within 48h', () => {
    const a = provider.computeKey({
      title: 'Taylor Swift wears custom Dior gown at Grammy Awards afterparty',
      snippet: 'The singer stunned in a custom Dior gown at the Grammy Awards afterparty.',
      publishedAt: '2026-08-20T08:00:00Z',
    });
    const b = provider.computeKey({
      title: 'Taylor Swift stuns in custom Dior gown at the Grammy afterparty',
      snippet: 'Swift wore a custom Dior gown to the Grammy Awards afterparty this weekend.',
      publishedAt: '2026-08-21T20:00:00Z',
    });
    expect(provider.similarity(a, b)).toBe(1);
  });

  it('does not match once the two items fall outside the 48h window', () => {
    const a = provider.computeKey({
      title: 'Taylor Swift wears custom Dior gown at Grammy Awards afterparty',
      snippet: 'The singer stunned in a custom Dior gown at the Grammy Awards afterparty.',
      publishedAt: '2026-08-18T08:00:00Z',
    });
    const b = provider.computeKey({
      title: 'Taylor Swift stuns in custom Dior gown at the Grammy afterparty',
      snippet: 'Swift wore a custom Dior gown to the Grammy Awards afterparty this weekend.',
      publishedAt: '2026-08-21T09:00:00Z',
    });
    expect(provider.similarity(a, b)).toBe(0);
  });
});

describe('CrossOutletSimilarityProvider.similarity — signal 3: shared entities + date', () => {
  it('matches low-lexical-overlap headlines that share a named entity and calendar date', () => {
    const a = provider.computeKey(
      {
        title: 'Vera Wang teases a possible role in an upcoming celebrity wedding',
        snippet: 'The designer declined to confirm details.',
        publishedAt: '2026-08-20T08:00:00Z',
      },
      ['Taylor Swift'],
    );
    const b = provider.computeKey(
      {
        title: 'Sources say Vera Wang is involved in secret wedding planning',
        snippet: 'Nothing has been officially announced yet.',
        publishedAt: '2026-08-20T18:00:00Z',
      },
      ['Taylor Swift'],
    );
    expect(provider.similarity(a, b)).toBe(1);
  });

  it('does not match when the shared date has no shared entity', () => {
    const a = provider.computeKey(
      { title: 'Vera Wang was spotted leaving a fashion week show', publishedAt: '2026-08-20T08:00:00Z' },
      ['Taylor Swift'],
    );
    const b = provider.computeKey(
      { title: 'Alexander McQueen opens its archive to the public', publishedAt: '2026-08-20T18:00:00Z' },
      ['Taylor Swift'],
    );
    expect(provider.similarity(a, b)).toBe(0);
  });

  it('does not match the same entity on different dates', () => {
    const a = provider.computeKey(
      { title: 'Vera Wang teases a new project', publishedAt: '2026-08-20T08:00:00Z' },
      ['Taylor Swift'],
    );
    const b = provider.computeKey(
      { title: 'Vera Wang teases a new project', publishedAt: '2026-08-25T08:00:00Z' },
      ['Taylor Swift'],
    );
    expect(provider.similarity(a, b)).toBe(0);
  });
});

describe('CrossOutletSimilarityProvider — cross-story assignment via ExistingStory', () => {
  it('attaches a new item to an existing story on canonical URL match', () => {
    const existing: ExistingStory[] = [
      {
        id: 'story-1',
        similarityKeys: [
          provider.computeKey({
            title: 'Some earlier headline',
            url: 'https://www.forbes.com/sites/x/taylor-swift-story/',
          }),
        ],
      },
    ];
    const items = [
      item('a', 'A different headline entirely', {
        url: 'https://forbes.com/sites/x/taylor-swift-story/?utm_source=fb',
      }),
    ];
    const result = clusterBatch(items, existing, provider, OPTS);
    expect(result.assignments[0]?.existingStoryId).toBe('story-1');
    expect(result.newStoryCount).toBe(0);
  });
});
