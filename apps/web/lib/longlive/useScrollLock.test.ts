import { beforeEach, describe, expect, it } from 'vitest';

import {
  __setScrollLockTargetForTests,
  acquireScrollLock,
  releaseScrollLock,
  scrollLockDepth,
} from './useScrollLock';

// Stands in for overflow. The suite runs environment:
// 'node', so the lock injects its style slot rather than dragging in jsdom.
let overflow = '';
const fake = { get: () => overflow, set: (v: string) => { overflow = v; } };

beforeEach(() => {
  overflow = '';
  __setScrollLockTargetForTests(fake);
});

describe('scroll lock', () => {
  it('locks on first acquire and restores on last release', () => {
    acquireScrollLock();
    expect(overflow).toBe('hidden');
    releaseScrollLock();
    expect(overflow).toBe('');
  });

  it('stays locked while any holder remains', () => {
    acquireScrollLock();
    acquireScrollLock();
    releaseScrollLock();
    expect(overflow).toBe('hidden');
    expect(scrollLockDepth()).toBe(1);
    releaseScrollLock();
    expect(overflow).toBe('');
  });

  // THE REGRESSION. Two overlays open; the OUTER one closes first. Under the
  // old per-component save/restore the inner overlay had captured
  // prev='hidden' and would write it back onto an empty page, killing scroll
  // until reload (Wyatt: "I can't use my mousewheel to scroll anymore" ...
  // "I refreshed and now it works").
  it('survives overlays unmounting out of order', () => {
    acquireScrollLock(); // outer opens
    acquireScrollLock(); // inner opens on top
    releaseScrollLock(); // OUTER closes first — the out-of-order case
    expect(overflow).toBe('hidden'); // inner still open
    releaseScrollLock(); // inner closes
    expect(overflow).toBe('');
  });

  it('preserves a pre-existing overflow value rather than assuming empty', () => {
    overflow = 'clip';
    acquireScrollLock();
    acquireScrollLock();
    releaseScrollLock();
    releaseScrollLock();
    expect(overflow).toBe('clip');
  });

  it('ignores an unbalanced release instead of going negative', () => {
    // A negative count would make the NEXT acquire fail to lock — the same
    // dead-scroll symptom, arrived at from the opposite direction.
    releaseScrollLock();
    expect(scrollLockDepth()).toBe(0);
    acquireScrollLock();
    expect(overflow).toBe('hidden');
    expect(scrollLockDepth()).toBe(1);
  });

  it('handles deep nesting', () => {
    for (let i = 0; i < 5; i++) acquireScrollLock();
    for (let i = 0; i < 4; i++) releaseScrollLock();
    expect(overflow).toBe('hidden');
    releaseScrollLock();
    expect(overflow).toBe('');
    expect(scrollLockDepth()).toBe(0);
  });
});
