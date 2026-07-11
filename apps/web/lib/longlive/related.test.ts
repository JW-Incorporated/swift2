import { describe, expect, it } from 'vitest';
import { ERAS } from './eras';
import { EGG_NODES, MOTIFS, motifOf } from './lenses';
import { motifTargetOf, resolveMotifTrail, songRelatedId, songTargetOf } from './related';
import { trackKey, tracksForEra } from './tracks';
import type { TrackNote } from './types';

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

describe('songRelatedId / songTargetOf', () => {
  const sampleTrack: TrackNote = { trackNumber: 3, title: 'Anti-Hero', note: 'n', sources: [] };

  it('builds the documented song:<eraId>:<trackKey> format', () => {
    expect(songRelatedId('midnights', sampleTrack)).toBe(
      `song:midnights:${trackKey('midnights', sampleTrack)}`,
    );
  });

  it('round-trips every track in the generated catalog through songRelatedId -> songTargetOf', () => {
    for (const era of ERAS) {
      for (const track of tracksForEra(era.id)) {
        const id = songRelatedId(era.id, track);
        const target = songTargetOf(id);
        expect(target, `${id} should resolve`).not.toBeNull();
        expect(target!.eraId).toBe(era.id);
        expect(target!.track).toBe(track);
      }
    }
  });

  it('returns null for an unknown era, an unknown track, and non-song namespaces', () => {
    expect(songTargetOf('song:not-a-real-era:midnights::3::Anti-Hero')).toBeNull();
    expect(songTargetOf('song:midnights:midnights::99::Not A Real Song')).toBeNull();
    expect(songTargetOf('motif:the-snake')).toBeNull();
    expect(songTargetOf('moment:rep-album')).toBeNull();
  });

  it('returns null for malformed ids', () => {
    expect(songTargetOf('')).toBeNull();
    expect(songTargetOf('song:')).toBeNull(); // empty id after namespace
    expect(songTargetOf('song:midnights')).toBeNull(); // no track-key segment
    expect(songTargetOf('song:midnights:')).toBeNull(); // empty track-key
  });
});
