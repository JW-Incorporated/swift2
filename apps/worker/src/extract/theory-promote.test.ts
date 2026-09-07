import { describe, expect, it } from 'vitest';
import {
  PROMOTION_MENTION_THRESHOLD,
  mergeTheoryCandidates,
  buildLiveTheoryUpsert,
  type FanTheoryCandidateRow,
  type MergedTheoryCluster,
} from './theory-promote';

/** noUncheckedIndexedAccess makes `clusters[0]` a possibly-undefined type;
 * every call site below already knows (by construction of its fixture)
 * that a cluster exists, so this asserts that instead of scattering `!`
 * non-null assertions through every test. */
function onlyCluster(clusters: readonly MergedTheoryCluster[]): MergedTheoryCluster {
  const cluster = clusters[0];
  if (!cluster) throw new Error('expected at least one cluster');
  return cluster;
}

function candidate(overrides: Partial<FanTheoryCandidateRow>): FanTheoryCandidateRow {
  return {
    id: 'c1',
    claim: 'Fans believe the countdown clock predicts a new vault track.',
    theoryKey: 'vault-track-countdown',
    name: 'Vault Track Countdown',
    mechanism: 'number',
    symbols: ['13'],
    trackSlug: null,
    predicts: null,
    predictedDate: null,
    evidenceSummary: null,
    mentionCount: 1,
    peakScore: 5,
    communities: ['TaylorSwift'],
    stance: 'believed',
    sampleUrls: [],
    ...overrides,
  };
}

describe('mergeTheoryCandidates', () => {
  it('keeps unrelated candidates in separate clusters', () => {
    const rows = [
      candidate({ id: 'a', name: 'Ticket Countdown Theory', symbols: ['13'] }),
      candidate({ id: 'b', name: 'Merch Color Egg', symbols: ['snake'] }),
    ];
    const clusters = mergeTheoryCandidates(rows);
    expect(clusters).toHaveLength(2);
    expect(clusters.every((c) => c.mergedIds.length === 0)).toBe(true);
  });

  it('merges near-duplicate candidates into one cluster, summing mention_count', () => {
    const rows = [
      candidate({ id: 'a', name: 'Ticket Countdown Theory', symbols: ['13'], mentionCount: 2 }),
      candidate({ id: 'b', name: 'Ticket Countdown Theory', symbols: ['13'], mentionCount: 3 }),
    ];
    const clusters = mergeTheoryCandidates(rows);
    expect(clusters).toHaveLength(1);
    const cluster = onlyCluster(clusters);
    expect(cluster.mentionCount).toBe(5);
    expect(cluster.mergedIds).toEqual(['a']);
    expect(cluster.canonicalId).toBe('b'); // higher mentionCount wins canonical
  });

  it('unions symbols, communities and caps sample_urls at 3 across a merged cluster', () => {
    const rows = [
      candidate({
        id: 'a',
        name: 'Ticket Countdown Theory',
        symbols: ['13'],
        communities: ['TaylorSwift'],
        sampleUrls: ['url1', 'url2'],
        mentionCount: 2,
      }),
      candidate({
        id: 'b',
        name: 'Ticket Countdown Theory',
        symbols: ['13', 'butterfly'],
        communities: ['SwiftlyNeutral'],
        sampleUrls: ['url3', 'url4'],
        mentionCount: 3,
      }),
    ];
    const cluster = onlyCluster(mergeTheoryCandidates(rows));
    expect(cluster.symbols.sort()).toEqual(['13', 'butterfly']);
    expect(cluster.communities.sort()).toEqual(['SwiftlyNeutral', 'TaylorSwift']);
    expect(cluster.sampleUrls).toHaveLength(3);
  });

  it('holds a cluster below the promotion mention threshold', () => {
    const rows = [candidate({ mentionCount: PROMOTION_MENTION_THRESHOLD - 1 })];
    const cluster = onlyCluster(mergeTheoryCandidates(rows));
    expect(cluster.decision).toBe('hold');
  });

  it('promotes a cluster at/above the threshold when not debunked', () => {
    const rows = [candidate({ mentionCount: PROMOTION_MENTION_THRESHOLD, stance: 'believed' })];
    const cluster = onlyCluster(mergeTheoryCandidates(rows));
    expect(cluster.decision).toBe('promote');
  });

  it('rejects a cluster at/above the threshold whose majority stance is debunked_by_fans', () => {
    const rows = [
      candidate({ id: 'a', mentionCount: 2, stance: 'debunked_by_fans' }),
      candidate({ id: 'b', name: candidate({}).name, mentionCount: 2, stance: 'debunked_by_fans' }),
    ];
    const cluster = onlyCluster(mergeTheoryCandidates(rows));
    expect(cluster.mentionCount).toBeGreaterThanOrEqual(PROMOTION_MENTION_THRESHOLD);
    expect(cluster.decision).toBe('reject');
    expect(cluster.stance).toBe('debunked_by_fans');
  });

  it('ties break toward contested rather than picking a side', () => {
    // Three near-identical-name rows (all merge into one cluster) split
    // 1 believed / 1 contested / 1 debunked_by_fans — a true 3-way tie.
    const rows = [
      candidate({
        id: 'x',
        name: 'Ticket Countdown Theory',
        symbols: ['13'],
        mentionCount: 1,
        stance: 'believed',
      }),
      candidate({
        id: 'y',
        name: 'Ticket Countdown Theory',
        symbols: ['13'],
        mentionCount: 1,
        stance: 'contested',
      }),
      candidate({
        id: 'z',
        name: 'Ticket Countdown Theory',
        symbols: ['13'],
        mentionCount: 1,
        stance: 'debunked_by_fans',
      }),
    ];
    const cluster = onlyCluster(mergeTheoryCandidates(rows));
    expect(cluster.stance).toBe('contested');
  });
});

describe('buildLiveTheoryUpsert', () => {
  it('inserts fresh when no existing live_theory matches', () => {
    const cluster = onlyCluster(
      mergeTheoryCandidates([
        candidate({ mentionCount: PROMOTION_MENTION_THRESHOLD, stance: 'believed' }),
      ]),
    );
    const upsert = buildLiveTheoryUpsert(cluster, []);
    expect(upsert.existingId).toBeUndefined();
    expect(upsert.row.origin).toBe('fan');
    expect(upsert.row.persistent).toBe(true);
    expect(upsert.row.status).toBe('rumor');
  });

  it('sets status debunked when the cluster stance is debunked_by_fans (promoted path only reached for non-debunked in practice)', () => {
    const cluster = onlyCluster(
      mergeTheoryCandidates([
        candidate({ mentionCount: PROMOTION_MENTION_THRESHOLD, stance: 'debunked_by_fans' }),
      ]),
    );
    const upsert = buildLiveTheoryUpsert(cluster, []);
    expect(upsert.row.status).toBe('debunked');
  });

  it('bumps an existing matching live_theory rather than inserting a duplicate', () => {
    const cluster = onlyCluster(
      mergeTheoryCandidates([
        candidate({
          name: 'Ticket Countdown Theory',
          symbols: ['13'],
          mentionCount: PROMOTION_MENTION_THRESHOLD,
        }),
      ]),
    );
    const existing = [
      {
        id: 'live-1',
        name: 'Ticket Countdown Theory',
        symbols: ['13'],
        heat: 4,
        mentionCount: 2,
        communities: ['TaylorSwift'],
      },
    ];
    const upsert = buildLiveTheoryUpsert(cluster, existing);
    expect(upsert.existingId).toBe('live-1');
    expect(upsert.row.mention_count).toBe(2 + cluster.mentionCount);
    expect(upsert.row.communities).toContain('TaylorSwift');
  });
});
