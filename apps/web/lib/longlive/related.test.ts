import { describe, expect, it } from 'vitest';
import { EGG_NODES, MOTIFS, motifOf } from './lenses';
import { motifTargetOf, resolveMotifTrail } from './related';

describe('motifTargetOf', () => {
  it('resolves motif:<id> for every trail in the data', () => {
    for (const motif of MOTIFS) {
      const target = motifTargetOf(`motif:${motif.id}`);
      expect(target, `motif:${motif.id} should resolve`).not.toBeNull();
      expect(target!.motifId).toBe(motif.id);
      expect(target!.motif).toBe(motif);
    }
  });

  it('resolves egg:<nodeId> to the trail the node belongs to, for every node', () => {
    for (const node of EGG_NODES) {
      const target = motifTargetOf(`egg:${node.id}`);
      expect(target, `egg:${node.id} should resolve`).not.toBeNull();
      expect(target!.motifId).toBe(motifOf(node.id));
      expect(target!.motif.id).toBe(target!.motifId);
    }
  });

  it('returns null for unknown ids in known namespaces', () => {
    expect(motifTargetOf('motif:not-a-motif')).toBeNull();
    expect(motifTargetOf('egg:egg-does-not-exist')).toBeNull();
  });

  it('returns null for non-Clue-Web namespaces (moment:, rel:, …)', () => {
    expect(motifTargetOf('moment:rep-album')).toBeNull();
    expect(motifTargetOf('rel:rel-5')).toBeNull();
  });

  it('returns null for malformed ids', () => {
    expect(motifTargetOf('')).toBeNull();
    expect(motifTargetOf('the-snake')).toBeNull(); // no namespace
    expect(motifTargetOf(':the-snake')).toBeNull(); // empty namespace
    expect(motifTargetOf('motif:')).toBeNull(); // empty id
  });
});

describe('resolveMotifTrail', () => {
  it('returns null for undefined and empty lists (the unpopulated-data case)', () => {
    expect(resolveMotifTrail(undefined)).toBeNull();
    expect(resolveMotifTrail([])).toBeNull();
  });

  it('skips unresolvable ids and returns the first that lands on a trail', () => {
    const target = resolveMotifTrail([
      'moment:rep-album', // wrong type — skipped
      'motif:nope', // unknown — skipped
      'egg:egg-snake-instagram', // resolves
      'motif:number-13', // never reached
    ]);
    expect(target).not.toBeNull();
    expect(target!.motifId).toBe('the-snake');
  });

  it('returns null when nothing resolves', () => {
    expect(resolveMotifTrail(['moment:rep-album', 'garbage', 'egg:nope'])).toBeNull();
  });
});
