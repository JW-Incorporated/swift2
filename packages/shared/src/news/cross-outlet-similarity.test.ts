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

describe('CrossOutletSimilarityProvider — regression, issue #915 (Healy/Shaq/Paisley)', () => {
  // #915 measured the OLD LexicalSimilarityProvider (title-only Jaccard, since
  // replaced by this provider per cross-outlet-similarity.ts's own module doc)
  // against three real event groups and found lowering its threshold alone
  // would be wrong: the Shaq "trio" is three genuinely distinct statements
  // (must NOT cluster) while Healy/Paisley are each one event covered
  // repeatedly (MUST cluster). Re-run here against the provider that actually
  // ships today, asserting both directions per the issue's own ask.

  it('does NOT cluster the Shaq trio — three distinct statements, not one event (exact headlines from #915)', () => {
    const items = [
      item('a', "Shaq says he didn't get an invite", { publishedAt: '2026-08-15T10:00:00Z' }),
      item('b', 'Shaq shared a 4-word message to the newlyweds', { publishedAt: '2026-08-15T14:00:00Z' }),
      item('c', "Shaquille O'Neal jokingly thanks them for not inviting him", {
        publishedAt: '2026-08-15T18:00:00Z',
      }),
    ];
    const result = clusterBatch(items, [], provider, OPTS);
    expect(result.newStoryCount).toBe(3);
  });

  it('clusters the Healy marriage coverage — one event, four outlets', () => {
    const items = [
      item('a', 'Matty Healy marries Gabbriette Bechtel in surprise ceremony', {
        publishedAt: '2026-08-10T09:00:00Z',
      }),
      item('b', '1975 frontman Matty Healy weds model Gabbriette Bechtel', {
        publishedAt: '2026-08-10T12:00:00Z',
      }),
      item('c', "Matty Healy, Taylor Swift's ex, ties the knot with Gabbriette Bechtel", {
        publishedAt: '2026-08-10T15:00:00Z',
      }),
      item('d', 'Gabbriette Bechtel and Matty Healy are officially married', {
        publishedAt: '2026-08-10T20:00:00Z',
      }),
    ];
    const result = clusterBatch(items, [], provider, OPTS);
    expect(result.newStoryCount).toBe(1);
  });

  it('clusters the Brad Paisley pair — one event, two outlets', () => {
    const items = [
      item('a', 'Brad Paisley performs surprise set at star-studded wedding', {
        publishedAt: '2026-08-12T11:00:00Z',
      }),
      item('b', 'Country star Brad Paisley plays surprise wedding set for A-list couple', {
        publishedAt: '2026-08-12T22:00:00Z',
      }),
    ];
    const result = clusterBatch(items, [], provider, OPTS);
    expect(result.newStoryCount).toBe(1);
  });
});

describe('CrossOutletSimilarityProvider — regression, issue #3179 (single-token entity corroboration)', () => {
  // #3179: signal 3 (shared entity + date) doesn't clear the sentence-initial
  // guard when the shared celebrity name isn't the title's first word — three
  // genuinely distinct statements about "Shaq" (rephrased so "Shaq" isn't
  // sentence-initial) all shared the single-token entity "shaq" and the same
  // calendar date, so the OLD code manufactured a false cluster. A single
  // shared single-token name isn't distinctive enough alone; it recurs across
  // many unrelated stories about that person.

  it('does NOT cluster three distinct Shaq statements sharing only a single-token entity', () => {
    const items = [
      item('a', "NBA legend Shaq says he didn't get a wedding invite", {
        publishedAt: '2026-08-15T10:00:00Z',
      }),
      item('b', 'Basketball star Shaq shares a 4-word message to the newlyweds', {
        publishedAt: '2026-08-15T14:00:00Z',
      }),
      item('c', 'Ex-NBA star Shaq jokes about not being invited to wedding', {
        publishedAt: '2026-08-15T18:00:00Z',
      }),
    ];
    const result = clusterBatch(items, [], provider, OPTS);
    expect(result.newStoryCount).toBe(3);
  });

  it('still clusters when two distinct single-token entities are both shared (corroboration)', () => {
    const items = [
      item('a', 'Reports say Shaq and Wembley reveal plans for a new arena', {
        publishedAt: '2026-08-15T10:00:00Z',
      }),
      item('b', 'Sources confirm Wembley deal with Shaq as ambassador', {
        publishedAt: '2026-08-15T16:00:00Z',
      }),
    ];
    const result = clusterBatch(items, [], provider, OPTS);
    expect(result.newStoryCount).toBe(1);
  });

  it('still clusters on a single shared multi-word entity alone (unchanged behavior)', () => {
    const items = [
      item('a', 'Vera Wang teases a new project', { publishedAt: '2026-08-20T08:00:00Z' }),
      item('b', 'Sources say Vera Wang is behind a secret new project', {
        publishedAt: '2026-08-20T18:00:00Z',
      }),
    ];
    const result = clusterBatch(items, [], provider, OPTS);
    expect(result.newStoryCount).toBe(1);
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
