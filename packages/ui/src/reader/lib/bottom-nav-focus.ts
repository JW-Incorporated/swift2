/**
 * Pure focus-tracking logic for BottomNav's "hide while a text input has
 * focus" behavior (PLAN.md P4 step 20). Kept out of the component so vitest
 * (node, no jsdom here) can cover the stuck-flag fix directly (adversarial
 * review finding #1, 2026-08-13): `focusout` never fires when its target is
 * REMOVED from the DOM — standard behaviour in Chrome, Firefox and Safari —
 * so Escape-closing SearchOverlay or the feedback panel while their input
 * held focus left the "hide the nav" flag stuck `true` forever. The fix is
 * to never trust the event's own target: always re-derive "is a text input
 * focused right now" from whatever `document.activeElement` actually is.
 */

export interface FocusableLike {
  tagName?: string;
  type?: string;
  isContentEditable?: boolean;
}

const NON_TEXT_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'radio',
  'range',
  'submit',
  'reset',
  'file',
  'color',
]);

/**
 * Duck-typed rather than `instanceof HTMLInputElement`/etc, so this is
 * testable in vitest's node environment with a plain object — identical
 * behavior in the browser, since these are the only fields BottomNav reads
 * off a real `Element`.
 */
export function isTextInputLike(el: FocusableLike | null | undefined): boolean {
  if (!el) return false;
  const tag = el.tagName?.toUpperCase();
  if (tag === 'TEXTAREA') return true;
  if (tag === 'INPUT') return !NON_TEXT_INPUT_TYPES.has(el.type ?? 'text');
  return el.isContentEditable === true;
}

/**
 * Whether BottomNav should stay hidden, given whatever currently holds
 * focus — NOT given the element an event fired on. This is the whole fix:
 * called from a `document.activeElement` re-check rather than from
 * `e.target`, it can't get stuck on a target that no longer exists.
 */
export function shouldHideNavForFocus(activeElement: FocusableLike | null | undefined): boolean {
  return isTextInputLike(activeElement);
}
