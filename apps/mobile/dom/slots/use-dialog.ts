import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react';
import { useFocusTrap } from '@swift2/ui/reader/moment/lib/useFocusTrap';

// The one modal-dialog contract for the DOM overlays: focus moves in on open, Tab is trapped, focus is restored on
// close (all useFocusTrap), and Escape dismisses. useFocusTrap also makes the rest of the page inert (siblings present at
// open); a dialog that stacks over another one additionally gets the stacking overlay's own `inert` prop (settings-page.tsx). Spread `dialog(onDismiss)` onto the dialog root.
// `focusRoot` keeps initial focus on the dialog itself (announced by its label) instead of the first control, so a
// page-like dialog opens without a focus ring on an arbitrary button.
export function useDialog(active: boolean, focusRoot = false) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(active, ref);
  useEffect(() => {
    if (active && focusRoot) ref.current?.focus();
  }, [active, focusRoot]);
  return (onDismiss: () => void): { ref: RefObject<HTMLDivElement | null>; tabIndex: -1; onKeyDown: (e: KeyboardEvent) => void } => ({
    ref,
    tabIndex: -1,
    onKeyDown: (e) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onDismiss();
    },
  });
}
