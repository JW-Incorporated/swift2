import { useRef, type KeyboardEvent, type RefObject } from 'react';
import { useFocusTrap } from '@swift2/ui/reader/moment/lib/useFocusTrap';

// The one modal-dialog contract for the DOM overlays: focus moves in on open, Tab is trapped, focus is restored on
// close (all useFocusTrap), and Escape dismisses. Underlying content is made inert by the stacking overlay's own
// `inert` prop (see settings-page.tsx). Spread `dialog(onDismiss)` onto the dialog root.
export function useDialog(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(active, ref);
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
