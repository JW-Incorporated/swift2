// Runs a store change and resolves only after it has COMMITTED to the DOM. The bridge delivers native events from
// a passive effect (transport-expo `consumeInbox`), where React cannot flush synchronously, so the work is deferred
// out of the effect (macrotask) and then flushed with flushSync; the caller acks `navigated` from the result.
import { flushSync } from 'react-dom';

export function applyAfterCommit(run: () => boolean): Promise<boolean> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        let ok = false;
        flushSync(() => {
          ok = run();
        });
        resolve(ok);
      } catch (e) {
        reject(e);
      }
    }, 0);
  });
}
