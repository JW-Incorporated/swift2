import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// #729: the share sheet's content rendered as a bare positioned <div>,
// outside any landmark — axe `region` flagged the "Share card" label and the
// card panel (2 nodes). Giving the content container real dialog semantics
// (role="dialog" + aria-modal + an accessible name) makes it a
// landmark-equivalent container, same pattern already used by
// MomentDetail/TrackGuide/TrackDetail. Source-locked so a future edit can't
// quietly drop the role back to a bare div.

const src = readFileSync(new URL('./ShareSheet.tsx', import.meta.url), 'utf8');

describe('#729 ShareSheet renders as a landmark (dialog)', () => {
  it('has role="dialog"', () => {
    expect(src).toContain('role="dialog"');
  });

  it('has aria-modal="true"', () => {
    expect(src).toContain('aria-modal="true"');
  });

  it('has an accessible name via aria-labelledby', () => {
    expect(src).toMatch(/aria-labelledby="share-sheet-title"/);
    expect(src).toMatch(/id="share-sheet-title"/);
  });
});
