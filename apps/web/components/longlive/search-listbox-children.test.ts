import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// #1206: the search results `role="listbox"` may contain only option/group
// children (axe `aria-required-children`, critical), but it used to be the
// scroll container that ALSO held the empty hint, the suggestion chips, the
// no-match message, and the show-all "Back to top matches" header — so it was
// malformed in every state except plain results. The fix moves the listbox
// onto an inner wrapper that mounts only when there are results and holds
// nothing but the grouped options; the chrome states render as siblings above
// it. These tests pin that source shape so a layout edit can't quietly put
// chrome back inside the listbox.

const src = readFileSync(new URL('./SearchOverlay.tsx', import.meta.url), 'utf8');
const listboxAt = src.indexOf('role="listbox"');

describe('#1206 search results listbox holds only option/group children', () => {
  it('has exactly one listbox, and it carries the aria-controls target id', () => {
    expect(listboxAt).toBeGreaterThan(-1);
    expect(src.indexOf('role="listbox"', listboxAt + 1)).toBe(-1);

    const openStart = src.lastIndexOf('<div', listboxAt);
    const openEnd = src.indexOf('>', listboxAt);
    const tag = src.slice(openStart, openEnd + 1);
    expect(tag).toContain('id="ll-search-results"');
    expect(src).toContain('aria-controls="ll-search-results"');
  });

  it('mounts the listbox only when there are results — the aria-expanded condition', () => {
    // The input's aria-expanded and the listbox's presence must stay in
    // lockstep, so a collapsed combobox never aria-controls a live empty
    // listbox and an expanded one always finds its target id.
    expect(src).toMatch(/\{groups\.length > 0 && \(\s*<div id="ll-search-results" role="listbox"/);
    expect(src).toContain('aria-expanded={flat.length > 0}');
  });

  it('renders every non-result state before (outside) the listbox, never inside it', () => {
    for (const marker of [
      'showEmptyHint && (',
      'showNoMatch && (',
      'showAll && (',
      'SUGGESTIONS.map',
      'Back to top matches',
    ]) {
      const at = src.indexOf(marker);
      expect(at, marker).toBeGreaterThan(-1);
      expect(at, `${marker} must precede the listbox`).toBeLessThan(listboxAt);
    }
  });

  it('keeps chrome buttons out of the listbox subtree', () => {
    // Between the listbox tag and the key-hints footer there is only the
    // grouped results markup; options come from <ResultRow>, so any literal
    // <button> here is chrome that has crept back inside the listbox.
    const end = src.indexOf('{/* Key hints */}');
    expect(end).toBeGreaterThan(listboxAt);
    const inner = src.slice(listboxAt, end);
    expect(inner).not.toContain('<button');
    const roles = [...inner.matchAll(/role="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(roles)).toEqual(new Set(['listbox', 'group', 'presentation']));
  });
});
