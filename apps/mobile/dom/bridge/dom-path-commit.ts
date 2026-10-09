// Commit-aware path change for native-to-DOM `navigate` (W2-I acks only what rendered). Same pattern as reader
// navigation (commit-apply.ts): the change runs inside flushSync, then the layer is observed in the DOM. A path the
// layer did not render (no reader mounted, render error, unmounted) answers false and the entry it pushed is popped (not replaced, so no duplicate entry is left).
import { applyAfterCommit } from './commit-apply';
import { currentDomPath, popDomPath, setDomPath, type DomWin } from './dom-path';

type Win = DomWin & Pick<Window, 'document'>;
const shown = (win: Win) => win.document.querySelector('[data-legal-page]')?.getAttribute('data-legal-page') ?? null;

export async function showDomPath(path: string, win: Win = window): Promise<boolean> {
  const prev = currentDomPath(win);
  if (path === '/' && prev === '/') return true;
  try {
    const ok = await applyAfterCommit(() => setDomPath(path, win));
    if (ok && shown(win) === (path === '/' ? null : path.slice(1))) return true;
  } catch {
    // a render error inside the commit: fall through to the restore
  }
  if (currentDomPath(win) !== prev) await popDomPath(win);
  return false;
}
