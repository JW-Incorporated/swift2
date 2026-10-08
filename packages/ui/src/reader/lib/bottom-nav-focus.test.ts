import { describe, expect, it } from 'vitest';
import { isTextInputLike, shouldHideNavForFocus } from './bottom-nav-focus';

describe('isTextInputLike', () => {
  it('treats a textarea as a text input', () => {
    expect(isTextInputLike({ tagName: 'TEXTAREA' })).toBe(true);
  });

  it('treats a text/search/email input as a text input', () => {
    expect(isTextInputLike({ tagName: 'INPUT', type: 'text' })).toBe(true);
    expect(isTextInputLike({ tagName: 'INPUT', type: 'search' })).toBe(true);
    expect(isTextInputLike({ tagName: 'INPUT' })).toBe(true); // defaults to 'text'
  });

  it('does not treat a button/checkbox/etc input as a text input', () => {
    expect(isTextInputLike({ tagName: 'INPUT', type: 'button' })).toBe(false);
    expect(isTextInputLike({ tagName: 'INPUT', type: 'checkbox' })).toBe(false);
  });

  it('treats contenteditable as a text input', () => {
    expect(isTextInputLike({ tagName: 'DIV', isContentEditable: true })).toBe(true);
  });

  it('does not treat a plain element, null, or undefined as a text input', () => {
    expect(isTextInputLike({ tagName: 'BODY' })).toBe(false);
    expect(isTextInputLike({ tagName: 'BUTTON' })).toBe(false);
    expect(isTextInputLike(null)).toBe(false);
    expect(isTextInputLike(undefined)).toBe(false);
  });
});

describe('shouldHideNavForFocus — stuck-flag fix (adversarial review finding #1, 2026-08-13)', () => {
  // The bug: `focusout` never fires when its target is removed from the DOM
  // (Escape-closing SearchOverlay/the feedback panel while their input holds
  // focus), so a fix that clears the flag from `e.target` never runs. The
  // fix re-derives from whatever `document.activeElement` is NOW, which is
  // exactly what this function does — it never looks at the old target.
  it('stays hidden while the currently-focused element is still a text input', () => {
    expect(shouldHideNavForFocus({ tagName: 'INPUT', type: 'text' })).toBe(true);
    expect(shouldHideNavForFocus({ tagName: 'TEXTAREA' })).toBe(true);
  });

  it('un-hides once the removed input is gone and focus has fallen back to <body>', () => {
    // This is the exact scenario the bug produced: the focused <input> was
    // unmounted, no focusout ever fired for it, and the browser silently
    // moved focus to <body>. Re-deriving from `document.activeElement`
    // (rather than trusting a stale target reference) resolves this to
    // "un-hide" instead of getting stuck on the old, now-detached target.
    expect(shouldHideNavForFocus({ tagName: 'BODY' })).toBe(false);
  });

  it('un-hides when nothing holds focus at all', () => {
    expect(shouldHideNavForFocus(null)).toBe(false);
    expect(shouldHideNavForFocus(undefined)).toBe(false);
  });

  it('stays hidden when focus moved from one text input straight to another', () => {
    // e.g. tabbing between two text fields — the nav should not flicker
    // visible in between.
    expect(shouldHideNavForFocus({ tagName: 'INPUT', type: 'search' })).toBe(true);
  });
});
