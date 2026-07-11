import { describe, expect, it } from 'vitest';
import { TOPBAR_ACTIONS_CLASS, TOPBAR_LEFT_CLASS, TOPBAR_ROW_CLASS } from './topbarLayout';

describe('TopBar layout', () => {
  it('keeps the mode toggle in a stable center column', () => {
    expect(TOPBAR_ROW_CLASS).toContain('grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]');
    expect(TOPBAR_LEFT_CLASS).toContain('min-w-0');
    expect(TOPBAR_ACTIONS_CLASS).toContain('justify-end');
  });
});
