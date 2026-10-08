import { describe, expect, it } from 'vitest';
import { trapBoundaryTarget } from './useFocusTrap';

// #657: the DOM-touching half of useFocusTrap (querySelectorAll,
// document.activeElement, .focus()) can't run in this suite — vitest.config.ts
// runs `environment: 'node'`, no jsdom (docs/engineering-lessons.md, "This
// repo has no component-render test harness"). The boundary decision itself
// is a pure function of (activeElement, focusables, key, shiftKey), so it's
// pulled out and tested here with plain string stand-ins for elements —
// same seam pattern as useScrollLock's injectable OverflowTarget.

describe('#657 trapBoundaryTarget', () => {
  const focusables = ['first', 'middle', 'last'];

  it('wraps Shift+Tab from the first element to the last', () => {
    expect(trapBoundaryTarget('first', focusables, 'Tab', true)).toBe('last');
  });

  it('wraps Tab from the last element to the first', () => {
    expect(trapBoundaryTarget('last', focusables, 'Tab', false)).toBe('first');
  });

  it('leaves Tab from a middle element alone (native behaviour)', () => {
    expect(trapBoundaryTarget('middle', focusables, 'Tab', false)).toBeNull();
    expect(trapBoundaryTarget('middle', focusables, 'Tab', true)).toBeNull();
  });

  it('leaves Tab from the first element alone when not Shift+Tab', () => {
    expect(trapBoundaryTarget('first', focusables, 'Tab', false)).toBeNull();
  });

  it('leaves Shift+Tab from the last element alone', () => {
    expect(trapBoundaryTarget('last', focusables, 'Tab', true)).toBeNull();
  });

  it('ignores every key that is not Tab', () => {
    expect(trapBoundaryTarget('last', focusables, 'Enter', false)).toBeNull();
    expect(trapBoundaryTarget('first', focusables, 'Escape', true)).toBeNull();
  });

  it('with a single focusable, Tab and Shift+Tab both land back on it', () => {
    expect(trapBoundaryTarget('only', ['only'], 'Tab', false)).toBe('only');
    expect(trapBoundaryTarget('only', ['only'], 'Tab', true)).toBe('only');
  });

  it('does nothing when there are no focusables at all', () => {
    expect(trapBoundaryTarget(null, [], 'Tab', false)).toBeNull();
  });

  it('does nothing when the active element is not a boundary element', () => {
    expect(trapBoundaryTarget('outside', focusables, 'Tab', false)).toBeNull();
    expect(trapBoundaryTarget('outside', focusables, 'Tab', true)).toBeNull();
  });
});
