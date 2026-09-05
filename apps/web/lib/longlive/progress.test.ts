import { describe, expect, it } from 'vitest';
import { EGG_NODES, MOTIFS, motifNodes } from '@swift2/experience';
import {
  clueWebProgress,
  emptyProgress,
  parseProgress,
  serializeProgress,
  trailProgress,
  withAdded,
  withToggled,
  type Progress,
} from './progress';

function progressWith(partial: Partial<Record<keyof Progress, string[]>>): Progress {
  return {
    moments: new Set(partial.moments ?? []),
    eggs: new Set(partial.eggs ?? []),
    trails: new Set(partial.trails ?? []),
    favorites: new Set(partial.favorites ?? []),
  };
}

describe('parseProgress (storage guard)', () => {
  it('returns empty progress for null / undefined / empty string', () => {
    for (const raw of [null, undefined, '']) {
      const p = parseProgress(raw);
      expect(p.moments.size).toBe(0);
      expect(p.eggs.size).toBe(0);
      expect(p.trails.size).toBe(0);
      expect(p.favorites.size).toBe(0);
    }
  });

  it('never throws on malformed JSON', () => {
    for (const raw of ['{oops', '[1,2', 'not json at all', '"', '{"v":1,"moments":']) {
      expect(parseProgress(raw).moments.size).toBe(0);
    }
  });

  it('rejects non-object payloads and foreign versions', () => {
    expect(parseProgress('42').eggs.size).toBe(0);
    expect(parseProgress('"a string"').eggs.size).toBe(0);
    expect(parseProgress('null').eggs.size).toBe(0);
    expect(parseProgress('[]').eggs.size).toBe(0);
    expect(parseProgress('{"v":2,"eggs":["egg-13-debut"]}').eggs.size).toBe(0);
    expect(parseProgress('{"eggs":["egg-13-debut"]}').eggs.size).toBe(0);
  });

  it('degrades per-field on wrong types instead of dropping everything', () => {
    const p = parseProgress('{"v":1,"moments":"nope","eggs":["a","b"],"trails":123}');
    expect(p.moments.size).toBe(0); // corrupted field → empty
    expect([...p.eggs].sort()).toEqual(['a', 'b']); // intact field survives
    expect(p.trails.size).toBe(0);
    expect(p.favorites.size).toBe(0); // absent field → empty
  });

  it('filters non-string members out of otherwise-valid arrays', () => {
    const p = parseProgress('{"v":1,"moments":["m1",7,null,{"x":1},"m2"],"eggs":[],"trails":[],"favorites":[]}');
    expect([...p.moments].sort()).toEqual(['m1', 'm2']);
  });

  it('round-trips through serializeProgress', () => {
    const original = progressWith({
      moments: ['m2', 'm1'],
      eggs: ['egg-13-debut'],
      trails: ['number-13'],
      favorites: ['m1'],
    });
    const back = parseProgress(serializeProgress(original));
    expect(back.moments).toEqual(original.moments);
    expect(back.eggs).toEqual(original.eggs);
    expect(back.trails).toEqual(original.trails);
    expect(back.favorites).toEqual(original.favorites);
  });
});

describe('withAdded', () => {
  it('adds new ids', () => {
    const next = withAdded(new Set(['a']), ['b', 'c']);
    expect([...next].sort()).toEqual(['a', 'b', 'c']);
  });

  it('returns the SAME set reference when nothing changes (bail-out contract)', () => {
    const set = new Set(['a', 'b']);
    expect(withAdded(set, ['a'])).toBe(set);
    expect(withAdded(set, [])).toBe(set);
  });

  it('deduplicates ids added twice in one call', () => {
    const next = withAdded(new Set<string>(), ['x', 'x']);
    expect(next.size).toBe(1);
  });

  it('does not mutate the input set', () => {
    const set = new Set(['a']);
    withAdded(set, ['b']);
    expect(set.size).toBe(1);
  });
});

describe('withToggled', () => {
  it('adds an absent id and removes a present one', () => {
    const on = withToggled(new Set<string>(), 'fav');
    expect(on.has('fav')).toBe(true);
    const off = withToggled(on, 'fav');
    expect(off.has('fav')).toBe(false);
  });

  it('does not mutate the input set', () => {
    const set = new Set(['fav']);
    withToggled(set, 'fav');
    expect(set.has('fav')).toBe(true);
  });
});

describe('trailProgress / completion detection', () => {
  it('is 0/total with nothing seen, for every trail', () => {
    for (const m of MOTIFS) {
      const tp = trailProgress(new Set(), m.id);
      expect(tp.seen).toBe(0);
      expect(tp.total).toBe(motifNodes(m.id).length);
      expect(tp.total).toBeGreaterThan(0);
      expect(tp.complete).toBe(false);
    }
  });

  it('completes exactly when every node on the trail is seen', () => {
    for (const m of MOTIFS) {
      const ids = motifNodes(m.id).map((n) => n.id);
      const allButOne = new Set(ids.slice(0, -1));
      expect(trailProgress(allButOne, m.id).complete).toBe(false);
      expect(trailProgress(allButOne, m.id).seen).toBe(ids.length - 1);
      const all = new Set(ids);
      const tp = trailProgress(all, m.id);
      expect(tp.complete).toBe(true);
      expect(tp.seen).toBe(tp.total);
    }
  });

  it('ignores ids that are not on the trail (stale/tampered storage)', () => {
    const m = MOTIFS[0];
    const seen = new Set(['egg-that-was-deleted', 'garbage', motifNodes(m.id)[0].id]);
    const tp = trailProgress(seen, m.id);
    expect(tp.seen).toBe(1);
    expect(tp.complete).toBe(false);
  });
});

describe('clueWebProgress', () => {
  it('reports zero explored on a fresh visit, with real totals', () => {
    const cp = clueWebProgress(emptyProgress());
    expect(cp.eggsSeen).toBe(0);
    expect(cp.eggsTotal).toBe(EGG_NODES.length);
    expect(cp.trailsExplored).toBe(0);
    expect(cp.trailsTotal).toBe(MOTIFS.length);
  });

  it('counts only ids that exist in the live data — stale ids never inflate counts', () => {
    const cp = clueWebProgress(
      progressWith({
        eggs: [EGG_NODES[0].id, 'egg-removed-in-v2', 'junk'],
        trails: [MOTIFS[0].id, 'motif-that-never-existed'],
      }),
    );
    expect(cp.eggsSeen).toBe(1);
    expect(cp.trailsExplored).toBe(1);
  });

  it('caps at the totals when everything is seen', () => {
    const cp = clueWebProgress(
      progressWith({
        eggs: EGG_NODES.map((n) => n.id),
        trails: MOTIFS.map((m) => m.id),
      }),
    );
    expect(cp.eggsSeen).toBe(cp.eggsTotal);
    expect(cp.trailsExplored).toBe(cp.trailsTotal);
  });
});
