'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Shared modal focus contract (#657): every full-screen overlay declared
 * `role="dialog"` / `aria-modal="true"` but none of them actually moved or
 * trapped focus — Tab walked straight through into the hidden page behind
 * them (WCAG 2.4.3, 1.3.2, 4.1.2). This hook is the one place that owns it:
 * on open, focus moves into the dialog's first focusable element (or the
 * dialog root itself, which must carry `tabIndex={-1}`); Tab / Shift+Tab
 * cycle only inside the dialog's own focusables; on close, focus returns to
 * whatever was focused right before the dialog opened. Each overlay keeps
 * owning its own Escape handling and visual chrome — this only owns focus.
 */

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null,
  );
}

/**
 * The Tab-trap boundary decision, pulled out of the DOM so it's unit
 * testable without jsdom — this repo's suite runs `environment: 'node'`
 * (see `useScrollLock`'s injectable `OverflowTarget` for the same reasoning).
 * Returns the element Tab should land on to stay inside the boundary, or
 * `null` to let the browser's default Tab behaviour run untouched.
 */
export function trapBoundaryTarget<T>(
  active: T | null,
  focusables: T[],
  key: string,
  shiftKey: boolean,
): T | null {
  if (key !== 'Tab' || focusables.length === 0) return null;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (shiftKey && active === first) return last;
  if (!shiftKey && active === last) return first;
  return null;
}

/**
 * Wire the contract above onto a real dialog root. `container` must be the
 * dialog's own outermost node (a plain ref — not a portal wrapper), and
 * should carry `tabIndex={-1}` so it's a valid focus target on the rare open
 * with no focusable content at all.
 */
export function useFocusTrap(active: boolean, container: RefObject<HTMLElement | null>): void {
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const node = container.current;
    if (!node) return;

    // Remember whoever had focus right before this dialog opened, so it can
    // be restored on close — the trigger card, a nav button, another dialog.
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusables = getFocusableElements(node);
    (focusables[0] ?? node).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const target = trapBoundaryTarget(active, getFocusableElements(node), e.key, e.shiftKey);
      if (target) {
        e.preventDefault();
        target.focus();
      }
    };
    node.addEventListener('keydown', onKeyDown);

    return () => {
      node.removeEventListener('keydown', onKeyDown);
      triggerRef.current?.focus();
    };
  }, [active, container]);
}
