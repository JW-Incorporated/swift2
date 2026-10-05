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
  if (shiftKey && active === first) return last!;
  if (!shiftKey && active === last) return first!;
  return null;
}

// Ref-counted `inert` claims (A11Y-1): aria-modal alone leaves the background in the AT tree. A dialog marks every
// sibling of its own ancestor chain inert, so the dialog itself stays live whether it is portaled or nested. Stacked
// dialogs (lightbox over a moment) nest: only the topmost is live, and closing in any order is safe.
// Ownership: the trap writes the sentinel value below, never a bare `inert=""`. A node that is already inert (e.g. a
// React `inert` prop) is left alone, and on release the attribute is removed only while it still carries OUR value, so
// an owner that re-set or cleared it mid-claim is never clobbered.
// KNOWN LIMITATION: only siblings present when the dialog opens are made inert; there is no MutationObserver, so a
// region mounted while a dialog is already open stays live until the next open.
const TRAP_INERT = 'focus-trap';
const inertClaims = new Map<Element, number>();

const NEVER_INERT = new Set(['HEAD', 'SCRIPT', 'STYLE', 'LINK', 'META', 'TEMPLATE', 'NOSCRIPT']);

function markInert(el: Element, keep: Element | null, claimed: Element[]): void {
  if (NEVER_INERT.has(el.tagName)) return;
  if (keep && el !== keep && el.contains(keep)) {
    for (const child of Array.from(el.children)) markInert(child, keep, claimed);
    return;
  }
  if (el === keep) return;
  const count = inertClaims.get(el);
  if (count !== undefined) inertClaims.set(el, count + 1);
  else if (el.hasAttribute('inert')) return;
  else {
    inertClaims.set(el, 1);
    el.setAttribute('inert', TRAP_INERT);
  }
  claimed.push(el);
}

function claimInert(node: HTMLElement, keep: Element | null): () => void {
  const claimed: Element[] = [];
  for (let el: HTMLElement | null = node; el && el.parentElement; el = el.parentElement) {
    for (const sib of Array.from(el.parentElement.children)) {
      if (sib !== el) markInert(sib, keep, claimed);
    }
  }
  return () => {
    for (const el of claimed) {
      const count = inertClaims.get(el);
      if (count === undefined) continue;
      if (count > 1) {
        inertClaims.set(el, count - 1);
        continue;
      }
      inertClaims.delete(el);
      if (el.getAttribute('inert') === TRAP_INERT) el.removeAttribute('inert');
    }
  };
}

/**
 * Wire the contract above onto a real dialog root. `container` must be the
 * dialog's own outermost node (a plain ref — not a portal wrapper), and
 * should carry `tabIndex={-1}` so it's a valid focus target on the rare open
 * with no focusable content at all. `keepLive` is the dialog's own opener/toggle when it must stay operable while
 * the panel is open (the Feedback toggle); it and its ancestors are exempt from inert, the rest of the page is not.
 */
export function useFocusTrap(active: boolean, container: RefObject<HTMLElement | null>,
  resetKey?: string | null,
  keepLive?: RefObject<HTMLElement | null>,
): void {
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const node = container.current;
    if (!node) return;

    // Remember whoever had focus right before this dialog opened, so it can
    // be restored on close — the trigger card, a nav button, another dialog.
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const releaseInert = claimInert(node, keepLive?.current ?? null);

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
      releaseInert();
      triggerRef.current?.focus();
    };
  }, [active, container, resetKey]);
}
