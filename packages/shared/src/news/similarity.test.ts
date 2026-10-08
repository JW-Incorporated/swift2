import { describe, expect, it } from 'vitest';
import { LexicalSimilarityProvider } from './similarity';

const provider = new LexicalSimilarityProvider();

describe('LexicalSimilarityProvider.computeKey', () => {
  it('produces a canonical (deduped, sorted) signature', () => {
    expect(provider.computeKey({ title: 'Album Announces New Album' })).toBe(
      'album announces new',
    );
  });

  it('is case- and punctuation-insensitive', () => {
    expect(provider.computeKey({ title: 'SHOWGIRL: The Tour!!' })).toBe(
      provider.computeKey({ title: 'showgirl the tour' }),
    );
  });

  it('drops stopwords', () => {
    expect(provider.computeKey({ title: 'the and of a an' })).toBe('');
  });

  it('strips subject terms so they carry no clustering signal', () => {
    const key = provider.computeKey(
      { title: 'Taylor Swift announces stadium dates' },
      ['Taylor Swift'],
    );
    expect(key).not.toContain('taylor');
    expect(key).not.toContain('swift');
    expect(key).toContain('stadium');
  });

  it('strips HTML tags and entities from feed-provided titles', () => {
    expect(provider.computeKey({ title: '<b>Eras</b> tour &amp; tickets' })).toBe(
      provider.computeKey({ title: 'Eras tour tickets' }),
    );
  });

  it('drops single-character tokens', () => {
    expect(provider.computeKey({ title: 'x tour' })).toBe('tour');
  });
});

describe('LexicalSimilarityProvider.similarity', () => {
  const key = (title: string) => provider.computeKey({ title }, ['Taylor Swift']);

  it('scores identical signatures 1', () => {
    const k = key('announces new album at midnight');
    expect(provider.similarity(k, k)).toBe(1);
  });

  it('scores disjoint signatures 0', () => {
    expect(provider.similarity(key('stadium tour tickets'), key('vinyl chart record'))).toBe(0);
  });

  it('scores empty signatures 0 (never NaN)', () => {
    expect(provider.similarity('', '')).toBe(0);
    expect(provider.similarity('tour', '')).toBe(0);
  });

  it('scores same-event headlines from different outlets above unrelated ones', () => {
    const a = key('Taylor Swift announces new album The Life of a Showgirl');
    const b = key('Swift reveals new album "The Life of a Showgirl" on podcast');
    const unrelated = key('Taylor Swift spotted at Chiefs game in Kansas City');
    expect(provider.similarity(a, b)).toBeGreaterThan(provider.similarity(a, unrelated));
    expect(provider.similarity(a, b)).toBeGreaterThanOrEqual(0.4);
  });

  it('is symmetric', () => {
    const a = key('announces world tour dates');
    const b = key('world tour dates revealed');
    expect(provider.similarity(a, b)).toBeCloseTo(provider.similarity(b, a), 10);
  });
});
