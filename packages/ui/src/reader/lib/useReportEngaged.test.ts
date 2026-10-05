import { describe, expect, it } from 'vitest';
import { CURRENT_ERA_ID, ERAS } from '@swift2/experience';
import { readerAway } from './useReportEngaged';
import { isEngaged, setEngaged, subscribeEngaged } from '../../bridge/engaged-signal';

const rest = {
  mode: 'era' as const,
  eraId: CURRENT_ERA_ID,
  openItemId: null,
  trackGuideEraId: null,
  theoryGuideEraId: null,
  selectorOpen: false,
  searchOpen: false,
  scrubbing: false,
  crossing: null,
  clownChatExpanded: false,
};

describe('readerAway', () => {
  it('is false only at the front door with nothing open', () => {
    expect(readerAway(rest)).toBe(false);
    const other = ERAS.find((e) => e.id !== CURRENT_ERA_ID)!.id;
    const away = [
      { mode: 'threads' as const },
      { eraId: other },
      { openItemId: 'x' },
      { trackGuideEraId: other },
      { theoryGuideEraId: other },
      { selectorOpen: true },
      { searchOpen: true },
      { scrubbing: true },
      { crossing: { a: 'a', b: 'b' } as never },
      { clownChatExpanded: true },
    ];
    for (const patch of away) expect(readerAway({ ...rest, ...patch })).toBe(true);
  });
});

describe('engaged signal', () => {
  it('is engaged while any key is set and notifies only on a real change', () => {
    let n = 0;
    const off = subscribeEngaged(() => void n++);
    setEngaged('a', true);
    setEngaged('a', true);
    setEngaged('b', true);
    setEngaged('a', false);
    expect(isEngaged()).toBe(true);
    setEngaged('b', false);
    expect(isEngaged()).toBe(false);
    expect(n).toBe(4);
    off();
  });
});
