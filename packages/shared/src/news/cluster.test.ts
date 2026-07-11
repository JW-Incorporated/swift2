import { describe, expect, it } from 'vitest';
import { clusterBatch, type ClusterableItem, type ExistingStory } from './cluster';
import { LexicalSimilarityProvider } from './similarity';

const provider = new LexicalSimilarityProvider();
const OPTS = { threshold: 0.55, subjectTerms: ['Taylor Swift'] };

const item = (id: string, title: string, publishedAt?: string): ClusterableItem => ({
  id,
  title,
  publishedAt,
});

describe('clusterBatch', () => {
  it('groups same-event items from different outlets into one new story', () => {
    const items = [
      item('a', 'Taylor Swift announces Eras Tour extra London dates', '2026-07-01T10:00:00Z'),
      item('b', 'Taylor Swift announces extra Eras Tour dates in London', '2026-07-01T11:00:00Z'),
    ];
    const result = clusterBatch(items, [], provider, OPTS);
    expect(result.newStoryCount).toBe(1);
    const indices = new Set(result.assignments.map((a) => a.newStoryIndex));
    expect(indices).toEqual(new Set([0]));
  });

  it('keeps distinct events as separate stories', () => {
    const items = [
      item('a', 'Taylor Swift announces new album at midnight'),
      item('b', 'Taylor Swift spotted courtside at Chiefs game'),
    ];
    const result = clusterBatch(items, [], provider, OPTS);
    expect(result.newStoryCount).toBe(2);
  });

  it('attaches an item to an existing story when similarity clears the threshold', () => {
    const existing: ExistingStory[] = [
      {
        id: 'story-1',
        similarityKeys: [
          provider.computeKey('Taylor Swift announces Eras Tour London dates', OPTS.subjectTerms),
        ],
      },
    ];
    const items = [item('a', 'Taylor Swift announces extra London Eras Tour dates')];
    const result = clusterBatch(items, existing, provider, OPTS);
    expect(result.newStoryCount).toBe(0);
    expect(result.assignments[0]?.existingStoryId).toBe('story-1');
    expect(result.assignments[0]?.score).toBeGreaterThanOrEqual(OPTS.threshold);
  });

  it('starts a new story when nothing clears the threshold', () => {
    const existing: ExistingStory[] = [
      { id: 'story-1', similarityKeys: [provider.computeKey('vinyl chart record broken')] },
    ];
    const items = [item('a', 'Taylor Swift surprise set at folk festival')];
    const result = clusterBatch(items, existing, provider, OPTS);
    expect(result.newStoryCount).toBe(1);
    expect(result.assignments[0]?.existingStoryId).toBeUndefined();
    expect(result.assignments[0]?.newStoryIndex).toBe(0);
    expect(result.assignments[0]?.score).toBe(0);
  });

  it('makes the earliest-published item the representative (index order)', () => {
    const items = [
      item('late', 'Taylor Swift announces Eras Tour extra dates', '2026-07-02T00:00:00Z'),
      item('early', 'Taylor Swift announces extra Eras Tour dates', '2026-07-01T00:00:00Z'),
    ];
    const result = clusterBatch(items, [], provider, OPTS);
    // Ordered earliest-first, so the first assignment is the representative.
    expect(result.assignments[0]?.item.id).toBe('early');
  });

  it('does not force items with an empty signature into a story', () => {
    // Title made entirely of subject terms + stopwords -> empty key.
    const items = [
      item('a', 'Taylor Swift announces Eras Tour extra dates'),
      item('b', 'The Taylor Swift'),
    ];
    const result = clusterBatch(items, [], provider, OPTS);
    expect(result.newStoryCount).toBe(2);
    const empty = result.assignments.find((a) => a.item.id === 'b');
    expect(empty?.similarityKey).toBe('');
    expect(empty?.existingStoryId).toBeUndefined();
  });

  it('records the similarity key on every assignment', () => {
    const items = [item('a', 'Taylor Swift announces new single')];
    const result = clusterBatch(items, [], provider, OPTS);
    expect(result.assignments[0]?.similarityKey).toBe(
      provider.computeKey('Taylor Swift announces new single', OPTS.subjectTerms),
    );
  });

  it('handles an empty batch', () => {
    const result = clusterBatch([], [], provider, OPTS);
    expect(result.assignments).toEqual([]);
    expect(result.newStoryCount).toBe(0);
  });
});
