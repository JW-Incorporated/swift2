import { describe, expect, it } from 'vitest';
import {
  TOPBAR_ACTIONS_CLASS,
  TOPBAR_LEFT_CLASS,
  TOPBAR_ROW_CLASS,
  topbarShareTarget,
} from './topbarLayout';

describe('TopBar layout', () => {
  // Regression for #492: the #457 grid (`minmax(0,1fr)` side columns) split
  // the row 50/50 regardless of content, truncating long era names. The row
  // must stay a flex bar where the left side takes whatever the fixed-width
  // actions group leaves free.
  it('gives the era name all width the actions group leaves free (#492)', () => {
    expect(TOPBAR_ROW_CLASS).not.toContain('grid');
    expect(TOPBAR_ROW_CLASS).toContain('flex');
    expect(TOPBAR_ROW_CLASS).toContain('justify-between');
    expect(TOPBAR_LEFT_CLASS).toContain('min-w-0');
    expect(TOPBAR_ACTIONS_CLASS).toContain('shrink-0');
  });
});

describe('topbarShareTarget', () => {
  it('shares the era in era mode', () => {
    expect(topbarShareTarget('era', 'tloas', null)).toEqual({
      kind: 'era',
      eraId: 'tloas',
    });
  });

  it('shares the open thread in threads mode', () => {
    expect(topbarShareTarget('threads', 'tloas', 'love-story')).toEqual({
      kind: 'lens',
      lensId: 'love-story',
    });
  });

  // #492: no share copy exists for the plain Threads gallery, so the button
  // must render disabled (null target) rather than disappear — the actions
  // group keeping constant width is what pins the mode toggle (#453).
  it('returns null on the plain Threads gallery (button disabled, not hidden)', () => {
    expect(topbarShareTarget('threads', 'tloas', null)).toBeNull();
  });
});
