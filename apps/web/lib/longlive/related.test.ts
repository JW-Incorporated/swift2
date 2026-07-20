import { describe, expect, it } from 'vitest';
import { EGG_NODES, MOTIFS, motifOf } from './lenses';
import { motifTargetOf, resolveMotifTrail, resolveRelatedMoments } from './related';
import { CONTENT } from './content';

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

describe('resolveRelatedMoments', () => {
  // Guards the bug this function was written for: every `moment:` id in the
  // seeds resolved to null under resolveMotifTrail (which handles only
  // motif:/egg:), so all 82 authored cross-links rendered nowhere.
  it('resolves every moment: id authored across the vault', () => {
    const withLinks = CONTENT.filter((c) =>
      (c.relatedIds ?? []).some((r) => r.startsWith('moment:')),
    );
    expect(withLinks.length, 'seeds should carry moment: cross-links').toBeGreaterThan(0);

    let resolved = 0;
    for (const item of withLinks) resolved += resolveRelatedMoments(item.relatedIds, item.id).length;
    expect(resolved, 'authored moment: links should resolve to real items').toBeGreaterThan(0);
  });

  it('returns [] for absent, empty, or non-moment ids', () => {
    expect(resolveRelatedMoments(undefined)).toEqual([]);
    expect(resolveRelatedMoments([])).toEqual([]);
    // motif:/egg: belong to resolveMotifTrail — this resolver must ignore them
    // rather than render a broken card.
    expect(resolveRelatedMoments(['motif:anything', 'egg:anything'])).toEqual([]);
  });

  it('skips dangling ids so a dead link can never render', () => {
    expect(resolveRelatedMoments(['moment:this-id-does-not-exist'])).toEqual([]);
  });

  it('never links a moment to itself', () => {
    const self = CONTENT.find((c) => c.id);
    expect(self).toBeDefined();
    expect(resolveRelatedMoments([`moment:${self!.id}`], self!.id)).toEqual([]);
  });

  it('de-dupes repeated ids', () => {
    const target = CONTENT.find((c) => c.id)!;
    const out = resolveRelatedMoments([`moment:${target.id}`, `moment:${target.id}`]);
    expect(out).toHaveLength(1);
  });

  it('preserves authoring order, which is editorial intent', () => {
    const [a, b] = CONTENT;
    const out = resolveRelatedMoments([`moment:${b.id}`, `moment:${a.id}`]);
    expect(out.map((r) => r.item.id)).toEqual([b.id, a.id]);
  });
});
