import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RELATIONSHIPS } from '@swift2/experience';

const source = readFileSync(new URL('../../../../../packages/ui/src/reader/threads/love-story/EntryDetail.tsx', import.meta.url), 'utf8');

describe('EntryDetail solo narrative', () => {
  it('renders the deeper story and its citations', () => {
    expect(source).toContain('{soloContext}');
    expect(source).toContain("soloSources.map((source, index)");
    expect(source).toContain('href={source.url}');
    expect(source).toContain('rel="noopener noreferrer"');
  });
});

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

  it('leaves Escape to the single dispatcher (top of the back stack: song overlay before the chapter)', () => {
    expect(source).not.toContain("'Escape'");
  });
});

describe('EntryDetail married banner (#651)', () => {
  it('gates the "Married July 2026" banner on the Kelce entry\'s real id', () => {
    const kelce = RELATIONSHIPS.find((r) => r.name === 'Travis Kelce');

    expect(kelce).toBeDefined();
    expect(source).toContain(`entry.id === '${kelce!.id}'`);
    expect(source).toContain('Married July 2026 — the resolution.');
  });

  it('does not gate the banner on the stale, never-matching \'kelce\' id', () => {
    expect(source).not.toContain("entry.id === 'kelce'");
  });
});
