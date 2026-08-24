import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./EntryDetail.tsx', import.meta.url), 'utf8');

describe('EntryDetail song chips (#1856)', () => {
  it('opens resolved songs through the canonical track-guide navigation path', () => {
    const linkedBranch = source.slice(
      source.indexOf('return target ? ('),
      source.indexOf(') : (', source.indexOf('return target ? (')),
    );

    expect(linkedBranch).toContain('<button');
    expect(linkedBranch).toContain('type="button"');
    expect(linkedBranch).toContain('openSong(target.eraId, trackKey(target.eraId, target.track))');
    expect(linkedBranch).toContain('aria-label={`Open song: ${song.title}`}');
    expect(linkedBranch).toContain('min-h-11');
  });

  it('keeps an unresolved song as non-interactive text instead of a broken control', () => {
    const fallbackBranch = source.slice(
      source.indexOf(') : (', source.indexOf('return target ? (')),
    );

    expect(source).toContain('song.relatedId ? songTargetOf(song.relatedId) : null');
    expect(fallbackBranch).toContain('<span');
  });

  it('leaves Escape to the song overlay before collapsing the underlying chapter', () => {
    expect(source).toContain("e.key === 'Escape' && !share && !trackGuideEraId");
  });
});
