import { describe, expect, it } from 'vitest';
import { storedSourceToCluster } from './dedupe-gate';
import { mergeFactLists } from './dedupe-merge';
import type { ClusterSource } from './write-knowledge';

const fact = (claim: string) => ({ id: 'f1', claim, attribution: 'AP', confidence: 'reported' as const });

describe('stored current_item sources in the v2 merge (news-worker crash 2026-11-05)', () => {
  it('maps the persisted {name, url, tier} shape to outletName', () => {
    expect(storedSourceToCluster({ name: 'AP', url: 'https://apnews.com/a', tier: 'trusted' }).outletName).toBe('AP');
    expect(storedSourceToCluster({ url: 'https://x.test/a' }).outletName).toBe('');
  });

  it('merges against stored sources without throwing and de-duplicates by outlet', () => {
    const stored = [storedSourceToCluster({ name: 'AP', url: 'https://apnews.com/a', tier: 'trusted' })];
    const incoming = [
      { outletName: 'ap', url: 'https://apnews.com/b' },
      { outletName: 'Variety', url: 'https://variety.com/c' },
    ] as ClusterSource[];
    const result = mergeFactLists([fact('One')], [fact('Two')], stored, incoming);
    expect(result.mergedSources.map((s) => s.url)).toEqual(['https://apnews.com/a', 'https://variety.com/c']);
  });

  it('never treats two unnamed sources as the same outlet', () => {
    const stored = [storedSourceToCluster({ url: 'https://x.test/a' })];
    const incoming = [{ url: 'https://y.test/b' }] as ClusterSource[];
    const result = mergeFactLists([fact('One')], [fact('Two')], stored, incoming);
    expect(result.mergedSources).toHaveLength(2);
  });
});
