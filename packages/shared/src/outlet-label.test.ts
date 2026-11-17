// W2a tests for outletLabel and dedupeSourcesByOutlet.
import { describe, expect, it } from 'vitest';
import { dedupeSourcesByOutlet, outletLabel } from './outlet-label';

describe('outletLabel', () => {
  it('returns a non-empty name unchanged', () => {
    expect(outletLabel({ name: 'Reuters', url: 'https://reuters.com/a' })).toBe('Reuters');
  });

  it('resolves a known host to its label when the name is empty', () => {
    expect(outletLabel({ name: '', url: 'https://www.bbc.co.uk/news/article' })).toBe('BBC');
  });

  it('falls back to a generic label when both name and URL are unusable', () => {
    expect(outletLabel({ name: '', url: '' })).toBe('Source');
  });
});

describe('dedupeSourcesByOutlet', () => {
  it('collapses two sources that share a host', () => {
    const out = dedupeSourcesByOutlet([
      { name: 'Reuters', url: 'https://reuters.com/a', tier: 'news' },
      { name: 'Reuters', url: 'https://reuters.com/b', tier: 'news' },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.url).toBe('https://reuters.com/a');
  });

  it('keeps distinct hosts separate', () => {
    const out = dedupeSourcesByOutlet([
      { name: 'Reuters', url: 'https://reuters.com/a', tier: 'news' },
      { name: 'AP', url: 'https://apnews.com/b', tier: 'news' },
    ]);
    expect(out).toHaveLength(2);
  });
});
