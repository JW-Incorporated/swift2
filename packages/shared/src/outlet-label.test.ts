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

  it('names the outlets seen with empty names in the live feed', () => {
    expect(outletLabel({ name: '', url: 'https://www.bostonglobe.com/2026/11/17/arts/x/' })).toBe('The Boston Globe');
    expect(outletLabel({ name: '  ', url: 'https://people.com/taylor-swift-12258272' })).toBe('People');
    expect(outletLabel({ url: 'https://www.billboard.com/music/x' })).toBe('Billboard');
  });

  it('resolves a subdomain through its parent domain', () => {
    expect(outletLabel({ name: '', url: 'https://news.pollstar.com/2026/11/x' })).toBe('Pollstar');
    expect(outletLabel({ name: '', url: 'https://buckeyecountry105.iheart.com/content/x' })).toBe('iHeartRadio');
    expect(outletLabel({ name: '', url: 'https://news.google.com/rss/articles/AU_x' })).toBe('Google News');
  });

  it('falls back to the bare host without www. for an unknown outlet', () => {
    expect(outletLabel({ name: '', url: 'https://www.themusicuniverse.com/a' })).toBe('themusicuniverse.com');
    expect(outletLabel({ name: null, url: 'https://blog.example.org/a' })).toBe('blog.example.org');
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
