/**
 * DOM side of hardware back (H1): answers the native `back` command. An open
 * moment/sheet closes first (`handled`); at the root the answer is `exit` and
 * native leaves the app. Replaces the retired `backTick` counter: the client
 * answers each command id exactly once, and the responder remembers the item
 * it has already asked to close, so two distinct presses that arrive before
 * the close commits cannot both answer `handled` (the second is a root press).
 */
import { useEffect, useMemo, useRef } from 'react';

export type BackState = { openItemId: string | null; closeItem: () => void };

export function createBackResponder() {
  let closing: string | null = null;
  return {
    answer(state: BackState): 'handled' | 'exit' {
      if (state.openItemId && state.openItemId !== closing) {
        closing = state.openItemId;
        state.closeItem();
        return 'handled';
      }
      return 'exit';
    },
    /** Call when the committed open item changes: the pending close has landed (or the item was reopened). */
    reset() {
      closing = null;
    },
  };
}

/** Registers the responder for the reader Shell: reads the latest committed state, resets when the open item changes. */
export function useBackRegistration(
  registerBack: (fn: (() => 'handled' | 'exit') | null) => void,
  openItemId: string | null,
  closeItem: () => void,
): void {
  const live = useRef<BackState>({ openItemId, closeItem });
  live.current = { openItemId, closeItem };
  const responder = useMemo(createBackResponder, []);
  useEffect(() => responder.reset(), [openItemId]);
  useEffect(() => {
    registerBack(() => responder.answer(live.current));
    return () => registerBack(null);
  }, []);
}
