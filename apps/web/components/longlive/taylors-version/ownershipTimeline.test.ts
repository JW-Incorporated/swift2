import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const src = readFileSync(new URL('./OwnershipTimeline.tsx', import.meta.url), 'utf8');

/** All JSX opening tags in the source, as [tagName, attributes] pairs. */
function openingTags(): Array<{ tag: string; attrs: string }> {
  return [...src.matchAll(/<([a-zA-Z][\w.]*)((?:[^>"']|"[^"]*"|'[^']*')*?)\/?>/gs)].map((m) => ({
    tag: m[1],
    attrs: m[2],
  }));
}

// Regression for #728: the re-record marker was a plain <div aria-label="…">.
// aria-label is prohibited on role-less generic elements (axe
// aria-prohibited-attr, serious), so the TV release date reached screen
// readers not at all — the only other copy lived in a hover-only tooltip.
describe('OwnershipTimeline a11y (#728)', () => {
  it('puts no aria-label on a role-less div', () => {
    const offenders = openingTags().filter(
      ({ tag, attrs }) => tag === 'div' && attrs.includes('aria-label') && !/\brole=/.test(attrs),
    );
    expect(offenders).toEqual([]);
  });

  it('keeps the TV release date in the accessibility tree via visually-hidden row text', () => {
    // The sr-only span renders `{album.album} (Taylor's Version) released {album.reclaimedDate}`
    // inside each re-recorded album's row.
    const srOnlyBlock = src.match(/className="sr-only"[\s\S]{0,200}/)?.[0] ?? '';
    expect(srOnlyBlock).toContain('{album.album}');
    expect(srOnlyBlock).toContain('Version) released');
    expect(srOnlyBlock).toContain('{album.reclaimedDate}');
  });

  it('hides the now-unlabeled decorative marker from assistive tech', () => {
    const marker = openingTags().find(({ attrs }) => attrs.includes('boxShadow: `0 0 6px ${album.color}`'));
    expect(marker).toBeDefined();
    expect(marker?.attrs).toContain('aria-hidden');
  });
});
