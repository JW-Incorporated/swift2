import { describe, expect, it } from 'vitest';
import { TOPBAR_ACTIONS_CLASS, TOPBAR_LEFT_CLASS, TOPBAR_ROW_CLASS } from './topbarLayout';

describe('TopBar layout', () => {
  // Regression for #492: the #457 grid (`minmax(0,1fr)` side columns) split
  // the row 50/50 regardless of content, truncating long era names. What
  // carries the fix: no grid columns, a left group that can shrink
  // (min-w-0, so the era name truncates last), and an actions group that
  // never gets squeezed (shrink-0).
  it('gives the era name all width the actions group leaves free (#492)', () => {
    expect(TOPBAR_ROW_CLASS).not.toContain('grid-cols-');
    expect(TOPBAR_LEFT_CLASS).toContain('min-w-0');
    expect(TOPBAR_ACTIONS_CLASS).toContain('shrink-0');
  });
});
