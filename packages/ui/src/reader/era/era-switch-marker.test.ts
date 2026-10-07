import { describe, expect, it } from 'vitest';
import { createEraSwitchMarker } from './era-switch-marker';

describe('createEraSwitchMarker', () => {
  it('remount with restore: zero marks during mount and settle, one mark on a real later switch', () => {
    const marks: string[] = [];
    const m = createEraSwitchMarker('top', false, (id) => marks.push(id));
    m.observe('top');
    m.observe('older');
    m.settle('older');
    m.observe('older');
    expect(marks).toEqual([]);
    m.observe('oldest');
    expect(marks).toEqual(['oldest']);
  });

  it('no restore: switches mark immediately and only on change', () => {
    const marks: string[] = [];
    const m = createEraSwitchMarker('a', true, (id) => marks.push(id));
    m.observe('a');
    m.observe('b');
    m.observe('b');
    expect(marks).toEqual(['b']);
  });
});
