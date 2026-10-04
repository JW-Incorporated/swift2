/**
 * DOM side of hardware back (H1): answers the native `back` command. An open
 * moment/sheet closes first (`handled`); at the root the answer is `exit` and
 * native leaves the app. Replaces the retired `backTick` counter: the client
 * answers each command id exactly once, so a press delivered twice cannot
 * close two levels.
 */
export type BackState = { openItemId: string | null; closeItem: () => void };

export function answerBack(state: BackState): 'handled' | 'exit' {
  if (state.openItemId) {
    state.closeItem();
    return 'handled';
  }
  return 'exit';
}
