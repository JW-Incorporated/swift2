import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// #657: MomentDetail's sheet, its nested photo lightbox, and EraSelector all
// declared (or should declare) `role="dialog"` / `aria-modal="true"` but none
// of them moved or trapped focus, so Tab walked through the hidden page
// behind them. The fix is `useFocusTrap` (lib/longlive/useFocusTrap.ts) wired
// onto each dialog root. This repo has no component-render harness (node
// test env, no jsdom — docs/engineering-lessons.md), so this is a static
// source-lock, same shape as scrubber-nested-interactive.test.ts: it can't
// prove Tab actually stays inside the dialog at runtime (that needs a real
// browser), only that the wiring a runtime trap depends on is present and
// can't quietly regress.

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');

/** The opening tag of the element whose attributes include `marker`. */
function openingTag(src: string, marker: string): string {
  const at = src.indexOf(marker);
  if (at === -1) throw new Error(`marker not found: ${marker}`);
  const openStart = src.lastIndexOf('<', at);
  const openEnd = src.indexOf('>', at);
  if (openStart === -1 || openEnd === -1) throw new Error(`malformed tag near: ${marker}`);
  return src.slice(openStart, openEnd + 1);
}

describe('#657 MomentDetail sheet is a real focus-trapped dialog', () => {
  const src = read('./MomentDetail.tsx');

  it('imports the shared focus trap', () => {
    expect(src).toContain("import { useFocusTrap } from '@/lib/longlive/useFocusTrap';");
  });

  it('the sheet root declares dialog semantics and a focus target', () => {
    const tag = openingTag(src, 'aria-labelledby={detailTitleId}');
    expect(tag).toContain('role="dialog"');
    expect(tag).toContain('aria-modal="true"');
    expect(tag).toContain('tabIndex={-1}');
    expect(tag).toContain('ref={scrollRef}');
  });

  it('wires the trap onto the sheet root while a moment is open', () => {
    expect(src).toContain('useFocusTrap(item != null, scrollRef);');
  });

  it('the nested photo lightbox is also trapped', () => {
    // The lightbox's opening tag carries a JS comment with a literal
    // `<img>` in its prose, which defeats a generic "scan to the next `>`"
    // tag-boundary parse — slice to the next unambiguous anchor (its
    // onClick handler) instead.
    const tagStart = src.indexOf('const viewer = (');
    const tagEnd = src.indexOf('onClick={(e) => {', tagStart);
    expect(tagStart).toBeGreaterThan(-1);
    expect(tagEnd).toBeGreaterThan(tagStart);
    const tag = src.slice(tagStart, tagEnd);
    expect(tag).toContain('role="dialog"');
    expect(tag).toContain('aria-modal="true"');
    expect(tag).toContain('aria-label="Photo viewer"');
    expect(tag).toContain('tabIndex={-1}');
    expect(tag).toContain('ref={dialogRef}');
    expect(src).toContain('useFocusTrap(true, dialogRef);');
  });
});

describe('#657 EraSelector is a real focus-trapped dialog', () => {
  const src = read('./EraSelector.tsx');

  it('imports the shared focus trap', () => {
    expect(src).toContain("import { useFocusTrap } from '@/lib/longlive/useFocusTrap';");
  });

  it('the panel root declares dialog semantics and a focus target', () => {
    const tag = openingTag(src, 'aria-labelledby={selectorTitleId}');
    expect(tag).toContain('role="dialog"');
    expect(tag).toContain('aria-modal="true"');
    expect(tag).toContain('tabIndex={-1}');
    expect(tag).toContain('ref={dialogRef}');
  });

  it('the labelling heading carries the matching id', () => {
    expect(src).toContain('id={selectorTitleId}');
  });

  it('wires the trap onto the panel root while open', () => {
    expect(src).toContain('useFocusTrap(selectorOpen, dialogRef);');
  });
});

// #3177: the same #657 fix, extended to the 5 remaining overlays named in
// that issue's audit trail.

describe('#3177 TrackGuide is a real focus-trapped dialog', () => {
  const src = read('./TrackGuide.tsx');

  it('imports the shared focus trap', () => {
    expect(src).toContain("import { useFocusTrap } from '@/lib/longlive/useFocusTrap';");
  });

  it('the guide root declares dialog semantics and a focus target', () => {
    const tag = openingTag(src, 'aria-label={`${era.album} track guide`}');
    expect(tag).toContain('role="dialog"');
    expect(tag).toContain('aria-modal="true"');
    expect(tag).toContain('tabIndex={-1}');
    expect(tag).toContain('ref={dialogRef}');
  });

  it('wires the trap onto the guide root while open', () => {
    expect(src).toContain('useFocusTrap(open, dialogRef);');
  });
});

describe('#3177 TheoryGuide is a real focus-trapped dialog', () => {
  const src = read('./TheoryGuide.tsx');

  it('imports the shared focus trap', () => {
    expect(src).toContain("import { useFocusTrap } from '@/lib/longlive/useFocusTrap';");
  });

  it('the guide root declares dialog semantics and a focus target', () => {
    const tag = openingTag(src, 'aria-label={`${era.name} theories and easter eggs`}');
    expect(tag).toContain('role="dialog"');
    expect(tag).toContain('aria-modal="true"');
    expect(tag).toContain('tabIndex={-1}');
    expect(tag).toContain('ref={dialogRef}');
  });

  it('wires the trap onto the guide root while open', () => {
    expect(src).toContain('useFocusTrap(open, dialogRef);');
  });
});

describe('#3177 ShareSheet is a real focus-trapped dialog', () => {
  const src = read('./ShareSheet.tsx');

  it('imports the shared focus trap', () => {
    expect(src).toContain("import { useFocusTrap } from '@/lib/longlive/useFocusTrap';");
  });

  it('the card root declares dialog semantics and a focus target', () => {
    const tag = openingTag(src, 'aria-labelledby="share-sheet-title"');
    expect(tag).toContain('role="dialog"');
    expect(tag).toContain('aria-modal="true"');
    expect(tag).toContain('tabIndex={-1}');
    expect(tag).toContain('ref={dialogRef}');
  });

  it('wires the trap onto the card root while a share target is set', () => {
    expect(src).toContain('useFocusTrap(Boolean(share), dialogRef);');
  });
});

describe('#3177 the feedback panel is a real focus-trapped dialog', () => {
  const src = read('./FeedbackButton.tsx');

  it('imports the shared focus trap', () => {
    expect(src).toContain("import { useFocusTrap } from '@/lib/longlive/useFocusTrap';");
  });

  it('the panel root declares dialog semantics and a focus target', () => {
    const tag = openingTag(src, 'aria-label="Send feedback"');
    expect(tag).toContain('role="dialog"');
    expect(tag).toContain('aria-modal="true"');
    expect(tag).toContain('tabIndex={-1}');
    expect(tag).toContain('ref={dialogRef}');
  });

  it('wires the trap onto the panel root while open', () => {
    expect(src).toContain('useFocusTrap(open, dialogRef);');
  });
});

describe('#3177 SearchOverlay is a real focus-trapped dialog', () => {
  const src = read('./SearchOverlay.tsx');

  it('imports the shared focus trap', () => {
    expect(src).toContain("import { useFocusTrap } from '@/lib/longlive/useFocusTrap';");
  });

  it('the overlay root declares dialog semantics and a focus target', () => {
    const tag = openingTag(src, 'aria-label="Search the archive"');
    expect(tag).toContain('role="dialog"');
    expect(tag).toContain('aria-modal="true"');
    expect(tag).toContain('tabIndex={-1}');
    expect(tag).toContain('ref={dialogRef}');
  });

  it('wires the trap onto the overlay root while open', () => {
    expect(src).toContain('useFocusTrap(searchOpen, dialogRef);');
  });
});
