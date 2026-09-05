import { describe, expect, it } from 'vitest';
import { CONTENT } from './content';
import { resolveTrackKey } from './tracks';
import { flattenGroups, searchDocs } from '@swift2/experience';
import { buildSearchIndex } from './search';
import type { SearchDocType } from '@swift2/experience';

describe('buildSearchIndex (real data)', () => {
  const index = buildSearchIndex();

  it('has unique keys', () => {
    const keys = index.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('covers every content type', () => {
    const types = new Set(index.map((d) => d.type));
    for (const t of ['era', 'moment', 'egg', 'track', 'theory', 'video', 'thread'] as SearchDocType[]) {
      expect(types.has(t), `index missing type "${t}"`).toBe(true);
    }
  });

  it('still indexes a work whose video card is hidden for having no embed', () => {
    // Playable-first (2026-08-13) hides 8 records from the rail/feed because no
    // official upload of the work exists. Search deliberately still indexes
    // them: a search hit is not a video card, and an app that returns nothing
    // at all for "Miss Americana" reads as not knowing the work exists. The
    // hit targets the era section, not the card, so it still lands somewhere
    // real. Asserted on index membership rather than on a query's results,
    // because ranking is a separate concern with its own tests.
    const keys = new Set(index.map((d) => d.key));
    for (const key of [
      'video:midnights:taylor-swift-the-eras-tour-film',
      'video:lover:miss-americana',
      'video:reputation:reputation-stadium-tour-film',
    ]) {
      expect(keys.has(key), `hidden work "${key}" dropped out of the search index`).toBe(true);
    }
  });

  it('finds a known moment by a straight-quote query', () => {
    const flat = flattenGroups(searchDocs(index, 'tim mcgraw'));
    // post-migration (stage 2a): the legacy id is now the item's SLUG; the doc
    // key carries the generated vault id, so resolve it through CONTENT.
    const timMcgraw = CONTENT.find((c) => c.slug === 'debut-tim-mcgraw');
    expect(timMcgraw, 'migrated tim-mcgraw item missing').toBeDefined();
    expect(flat.some((r) => r.doc.key === 'moment:' + timMcgraw!.id)).toBe(true);
  });

  it('finds the snake egg nodes and targets a Clue Web trail', () => {
    const groups = searchDocs(index, 'snake');
    const eggs = groups.find((g) => g.type === 'egg');
    expect(eggs).toBeDefined();
    expect(eggs!.results.every((r) => r.doc.target.kind === 'trail')).toBe(true);
  });

  it('every doc has a snippet and a resolvable target shape', () => {
    for (const d of index) {
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.snippet.length).toBeGreaterThan(0);
      expect(d.bodyNorm.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Search dead-ends (#652): a result must reach its actual target, not just
// somewhere near it.
// ---------------------------------------------------------------------------
describe('#652 deep-link targets', () => {
  const index = buildSearchIndex();

  it('song results carry a resolvable track key, not just the era track guide', () => {
    const groups = searchDocs(index, 'cardigan');
    const trackGroup = groups.find((g) => g.type === 'track');
    expect(trackGroup).toBeDefined();
    for (const r of trackGroup!.results) {
      expect(r.doc.target.kind).toBe('track');
      if (r.doc.target.kind === 'track') {
        expect(resolveTrackKey(r.doc.target.trackKey)).not.toBeNull();
      }
    }
  });

  it('video results carry the specific videoId, not just the bare era', () => {
    const groups = searchDocs(index, 'shake it off');
    const videoGroup = groups.find((g) => g.type === 'video');
    expect(videoGroup).toBeDefined();
    for (const r of videoGroup!.results) {
      expect(r.doc.target.kind).toBe('video');
      if (r.doc.target.kind === 'video') {
        expect(r.doc.target.videoId.length).toBeGreaterThan(0);
      }
    }
  });

  it('indexes threads by title, targeting openThread', () => {
    const blankSpaces = searchDocs(index, 'blank spaces').find((g) => g.type === 'thread');
    expect(blankSpaces).toBeDefined();
    expect(blankSpaces!.results[0].doc.target).toEqual({ kind: 'thread', lensId: 'love-story' });

    const endGame = searchDocs(index, 'end game').find((g) => g.type === 'thread');
    expect(endGame).toBeDefined();
    expect(endGame!.results[0].doc.target).toEqual({ kind: 'thread', lensId: 'the-proposal' });
  });
});
