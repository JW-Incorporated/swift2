import { describe, expect, it } from 'vitest';
import { validRoute, validSnap } from './bridge-host-validate';

const full = { v: 1, mode: 'era', eraId: 'lover', lens: 'l', itemId: 'i', anchorId: 'fearless', count: 3, scrollY: 1200 };

describe('route snap validation (#5114)', () => {
  it('round-trips a full and a minimal snapshot unchanged', () => {
    expect(validSnap(full)).toEqual(full);
    expect(validSnap(JSON.parse(JSON.stringify(full)))).toEqual(full);
    const min = { v: 1, mode: 'mood', eraId: 'lover', scrollY: 0 };
    expect(validSnap(min)).toEqual(min);
    expect(validRoute({ path: '/', engaged: true, snap: full })).toEqual({ path: '/', busy: false, engaged: true, snap: full });
  });

  it.each([
    ['unknown key', { ...full, extra: 1 }],
    ['wrong version', { ...full, v: 2 }],
    ['wrong type (mode)', { ...full, mode: 5 }],
    ['wrong type (scrollY)', { ...full, scrollY: '10' }],
    ['non-integer scrollY', { ...full, scrollY: 1.5 }],
    ['negative scrollY', { ...full, scrollY: -1 }],
    ['oversized scrollY', { ...full, scrollY: 1_000_001 }],
    ['oversized string', { ...full, itemId: 'x'.repeat(65) }],
    ['empty string', { ...full, eraId: '' }],
    ['oversized count', { ...full, count: 201 }],
    ['zero count', { ...full, count: 0 }],
    ['missing mode', { v: 1, eraId: 'lover', scrollY: 0 }],
    ['array', []],
    ['null', null],
  ])('drops an invalid snapshot (%s) but keeps the rest of the route', (_n, bad) => {
    expect(validSnap(bad)).toBeNull();
    expect(validRoute({ path: '/x', busy: true, snap: bad })).toEqual({ path: '/x', busy: true, engaged: false, snap: null });
  });

  it('accepts the boundary values and rejects an unknown route key', () => {
    const edge = { ...full, itemId: 'x'.repeat(64), count: 200, scrollY: 1_000_000 };
    expect(validSnap(edge)).toEqual(edge);
    expect(validRoute({ path: '/', snap: full, other: 1 })).toBeNull();
    expect(JSON.stringify(full).length).toBeLessThan(300);
  });
});
